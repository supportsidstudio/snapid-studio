import * as ort from 'onnxruntime-web';

// Matching onnxruntime-web package version in package.json
const ORT_VERSION = '1.29.0';
const CDN_WASM_PATH = `https://cdn.jsdelivr.net/npm/onnxruntime-web@${ORT_VERSION}/dist/`;

let runtimeAppBaseUrl: string | null = null;

/**
 * Dynamically resolves the base URL of the deployed app,
 * automatically handling root domains, subdirectories (e.g. GitHub Pages /<repo>/),
 * Cloudflare Pages, Netlify, and local development.
 */
function getAppBaseUrl(): string {
  if (runtimeAppBaseUrl) {
    return runtimeAppBaseUrl;
  }
  if (typeof self !== 'undefined' && self.location) {
    let origin = '';
    try {
      if (self.location.origin && self.location.origin !== 'null' && !self.location.origin.startsWith('file:')) {
        origin = self.location.origin.replace(/^blob:/, '');
      }
    } catch {}

    const href = self.location.href || '';
    const assetsIndex = href.lastIndexOf('/assets/');
    if (assetsIndex !== -1 && origin) {
      try {
        const u = new URL(href);
        const pathPart = u.pathname.substring(0, u.pathname.lastIndexOf('/assets/') + 1);
        return `${origin}${pathPart}`;
      } catch {}
    }

    if (origin) {
      return `${origin}/`;
    }
  }
  return '/';
}

function getWasmBasePath(): string {
  const base = getAppBaseUrl();
  return `${base.replace(/\/+$/, '')}/onnxruntime/`;
}

const MODNET_CACHE_NAME = 'snapid-modnet-model-v3';
const RMBG_CACHE_NAME = 'snapid-rmbg-model-v1';

try {
  ort.env.logLevel = 'error';
  const isIsolated = typeof crossOriginIsolated !== 'undefined' && crossOriginIsolated;
  const safeThreads = isIsolated
    ? (typeof navigator !== 'undefined' && navigator.hardwareConcurrency
        ? Math.min(4, Math.max(1, navigator.hardwareConcurrency))
        : 2)
    : 1;

  const initialBasePath = getWasmBasePath();
  ort.env.wasm.wasmPaths = {
    mjs: `${initialBasePath}ort-wasm-simd-threaded.mjs`,
    wasm: `${initialBasePath}ort-wasm-simd-threaded.wasm`,
  };
  ort.env.wasm.numThreads = safeThreads;
  ort.env.wasm.simd = true;
  ort.env.wasm.proxy = false;
} catch (e) {
  console.warn('[AI Bg Worker] Initial wasmPaths configuration warning:', e);
}

// Cached sessions
let modnetSession: ort.InferenceSession | null = null;
let modnetLoadingPromise: Promise<ort.InferenceSession> | null = null;

let rmbgSession: ort.InferenceSession | null = null;
let rmbgLoadingPromise: Promise<ort.InferenceSession> | null = null;

async function fetchValidModelBuffer(url: string, cacheName: string, minBytes: number): Promise<ArrayBuffer> {
  const base = getAppBaseUrl();
  let resolvedUrl = url;

  if (url.startsWith('/') && !url.startsWith('//')) {
    resolvedUrl = `${base.replace(/\/+$/, '')}${url}`;
  }

  // 1. Try retrieving from persistent browser Cache API for instantaneous load (<20ms)
  if (typeof caches !== 'undefined') {
    try {
      const cache = await caches.open(cacheName);
      const cached = await cache.match(resolvedUrl);
      if (cached) {
        const cachedBuffer = await cached.arrayBuffer();
        if (cachedBuffer.byteLength >= minBytes) {
          const header = new Uint8Array(cachedBuffer, 0, 4);
          if (header[0] === 0x08) {
            console.log(`[AI Bg Worker] Loaded model instantly from Cache API (${(cachedBuffer.byteLength / 1024 / 1024).toFixed(2)} MB)`);
            return cachedBuffer;
          }
        }
      }
    } catch {
      // Ignore cache match error
    }
  }

  console.log(`[AI Bg Worker] Fetching model binary from: ${resolvedUrl}`);
  const response = await fetch(resolvedUrl, { mode: 'cors' });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status} (${response.statusText})`);
  }

  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('text/html')) {
    throw new Error(`Invalid response: Expected binary ONNX but received HTML text (SPA redirect or 404)`);
  }

  const buffer = await response.arrayBuffer();
  if (buffer.byteLength < minBytes) {
    // If Git LFS pointer text file was served (typically ~130 bytes)
    const textHeader = new TextDecoder().decode(new Uint8Array(buffer.slice(0, 30)));
    throw new Error(`Invalid model binary size: ${buffer.byteLength} bytes (expected >= ${minBytes}). Content: ${textHeader}`);
  }

  // Validate protobuf ONNX magic header (starts with 0x08)
  const header = new Uint8Array(buffer, 0, 4);
  if (header[0] !== 0x08) {
    const textHeader = new TextDecoder().decode(new Uint8Array(buffer.slice(0, 30)));
    throw new Error(`Invalid ONNX protobuf header: [${Array.from(header).join(', ')}]. Content: ${textHeader}`);
  }

  // Store in Cache API for zero-delay subsequent loads
  if (typeof caches !== 'undefined') {
    try {
      const cache = await caches.open(cacheName);
      await cache.put(resolvedUrl, new Response(buffer.slice(0), {
        headers: { 'Content-Type': 'application/octet-stream' }
      }));
      console.log(`[AI Bg Worker] Cached model binary in browser CacheStorage (${cacheName})`);
    } catch {
      // Ignore cache put error
    }
  }

  console.log(`[AI Bg Worker] Successfully verified model binary (${(buffer.byteLength / 1024 / 1024).toFixed(2)} MB)`);
  return buffer;
}

/**
 * Creates an inference session with progressive fallback paths:
 * 1. Multi-threaded WASM SIMD (if crossOriginIsolated)
 * 2. Single-threaded WASM SIMD (if isolation disabled)
 * 3. CDN fallback if local WASM paths fail
 */
async function createConfiguredSession(buffer: ArrayBuffer, modelLabel: string): Promise<ort.InferenceSession> {
  const isIsolated = typeof crossOriginIsolated !== 'undefined' && crossOriginIsolated;
  const threads = isIsolated
    ? (typeof navigator !== 'undefined' && navigator.hardwareConcurrency
        ? Math.min(4, Math.max(1, navigator.hardwareConcurrency))
        : 2)
    : 1;

  const sessionOptions: ort.InferenceSession.SessionOptions = {
    executionProviders: ['wasm'],
    graphOptimizationLevel: 'all',
    logSeverityLevel: 3,
    logVerbosityLevel: 0,
  };

  const basePath = getWasmBasePath();
  const wasmPathConfig = {
    mjs: `${basePath}ort-wasm-simd-threaded.mjs`,
    wasm: `${basePath}ort-wasm-simd-threaded.wasm`,
  };

  const wasmConfigs: Array<{ path: any; threads: number; label: string }> = [
    { path: wasmPathConfig, threads: threads, label: `Local WASM (${threads > 1 ? 'Multi-thread' : 'Single-thread'})` },
    { path: basePath, threads: threads, label: `Local WASM Path (${threads > 1 ? 'Multi-thread' : 'Single-thread'})` },
    { path: wasmPathConfig, threads: 1, label: 'Local WASM (Single-thread fallback)' },
    { path: basePath, threads: 1, label: 'Local WASM Path (Single-thread fallback)' },
    { path: CDN_WASM_PATH, threads: 1, label: 'JSDelivr CDN WASM (Global fallback)' }
  ];

  let lastError: any = null;
  for (const cfg of wasmConfigs) {
    try {
      ort.env.wasm.wasmPaths = cfg.path;
      ort.env.wasm.numThreads = cfg.threads;
      ort.env.wasm.simd = true;
      ort.env.wasm.proxy = false;
      const session = await ort.InferenceSession.create(buffer.slice(0), sessionOptions);
      console.log(`[AI Bg Worker] ${modelLabel} session active via ${cfg.label}! Inputs: [${session.inputNames.join(', ')}], Outputs: [${session.outputNames.join(', ')}]`);
      return session;
    } catch (err: any) {
      lastError = err;
      console.warn(`[AI Bg Worker] ${modelLabel} on ${cfg.label} warning:`, err?.message || err);
    }
  }

  throw lastError || new Error(`Failed to initialize session for ${modelLabel}`);
}

/**
 * Loads and caches the universal RMBG-1.4 model (People, Animals, Products, Fur, Glass, Objects)
 * Automatically checks local file first, then falls back to public HuggingFace CDN if Cloudflare's 25MB limit dropped the asset.
 */
async function getRmbgSession(): Promise<ort.InferenceSession> {
  if (rmbgSession) return rmbgSession;
  if (rmbgLoadingPromise) return rmbgLoadingPromise;

  rmbgLoadingPromise = (async () => {
    const base = getAppBaseUrl();
    const sources = [
      `${base.replace(/\/+$/, '')}/models/rmbg-1.4.onnx`,
      '/models/rmbg-1.4.onnx',
      // High-speed CDN fallback that bypasses Cloudflare Pages 25MB file upload limit
      'https://huggingface.co/briaai/RMBG-1.4/resolve/main/onnx/model_quantized.onnx'
    ];

    let lastError: any = null;
    for (const src of sources) {
      try {
        const buffer = await fetchValidModelBuffer(src, RMBG_CACHE_NAME, 30000000);
        rmbgSession = await createConfiguredSession(buffer, 'RMBG-1.4');
        return rmbgSession;
      } catch (err: any) {
        lastError = err;
        console.warn(`[AI Bg Worker] RMBG source failed [${src}]:`, err?.message || err);
      }
    }

    rmbgLoadingPromise = null;
    throw new Error(`Failed to load RMBG-1.4 ONNX model: ${lastError?.message || lastError}`);
  })();

  return rmbgLoadingPromise;
}

/**
 * Loads and caches the MODNet model (human portrait matting)
 */
async function getModnetSession(): Promise<ort.InferenceSession> {
  if (modnetSession) return modnetSession;
  if (modnetLoadingPromise) return modnetLoadingPromise;

  modnetLoadingPromise = (async () => {
    const base = getAppBaseUrl();
    const sources = [
      `${base.replace(/\/+$/, '')}/models/modnet.onnx`,
      '/models/modnet.onnx'
    ];

    let lastError: any = null;
    for (const src of sources) {
      try {
        const buffer = await fetchValidModelBuffer(src, MODNET_CACHE_NAME, 20000000);
        modnetSession = await createConfiguredSession(buffer, 'MODNet');
        return modnetSession;
      } catch (err: any) {
        lastError = err;
        console.warn(`[AI Bg Worker] MODNet source failed [${src}]:`, err?.message || err);
      }
    }

    modnetLoadingPromise = null;
    throw new Error(`Failed to load MODNet ONNX model: ${lastError?.message || lastError}`);
  })();

  return modnetLoadingPromise;
}

/**
 * Preprocesses an ImageBitmap for RMBG-1.4
 * Shape: [1, 3, 1024, 1024]
 * ImageNet Normalization: (RGB / 255 - mean) / std
 */
function preprocessRmbgImage(imageBitmap: ImageBitmap): { tensor: ort.Tensor; origWidth: number; origHeight: number } {
  const targetW = 1024;
  const targetH = 1024;
  const origWidth = imageBitmap.width;
  const origHeight = imageBitmap.height;

  const canvas = new OffscreenCanvas(targetW, targetH);
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) throw new Error('Could not get 2D context from OffscreenCanvas');

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(imageBitmap, 0, 0, targetW, targetH);

  const imageData = ctx.getImageData(0, 0, targetW, targetH);
  const data = imageData.data;
  const numPixels = targetW * targetH;
  const tensorData = new Float32Array(3 * numPixels);

  const meanR = 0.485, meanG = 0.456, meanB = 0.406;
  const stdR = 0.229, stdG = 0.224, stdB = 0.225;

  for (let i = 0; i < numPixels; i++) {
    const px = i * 4;
    const r = data[px] / 255.0;
    const g = data[px + 1] / 255.0;
    const b = data[px + 2] / 255.0;

    tensorData[i] = (r - meanR) / stdR;
    tensorData[numPixels + i] = (g - meanG) / stdG;
    tensorData[2 * numPixels + i] = (b - meanB) / stdB;
  }

  const tensor = new ort.Tensor('float32', tensorData, [1, 3, targetH, targetW]);
  return { tensor, origWidth, origHeight };
}

/**
 * Preprocesses an ImageBitmap for MODNet
 * Shape: [1, 3, 512, 512]
 */
function preprocessModnetImage(imageBitmap: ImageBitmap): { tensor: ort.Tensor; origWidth: number; origHeight: number } {
  const targetW = 512;
  const targetH = 512;
  const origWidth = imageBitmap.width;
  const origHeight = imageBitmap.height;

  const canvas = new OffscreenCanvas(targetW, targetH);
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) throw new Error('Could not get 2D context from OffscreenCanvas');

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(imageBitmap, 0, 0, targetW, targetH);

  const imageData = ctx.getImageData(0, 0, targetW, targetH);
  const data = imageData.data;
  const numPixels = targetW * targetH;
  const tensorData = new Float32Array(3 * numPixels);

  for (let i = 0; i < numPixels; i++) {
    const px = i * 4;
    tensorData[i] = (data[px] - 127.5) / 127.5;
    tensorData[numPixels + i] = (data[px + 1] - 127.5) / 127.5;
    tensorData[2 * numPixels + i] = (data[px + 2] - 127.5) / 127.5;
  }

  const tensor = new ort.Tensor('float32', tensorData, [1, 3, targetH, targetW]);
  return { tensor, origWidth, origHeight };
}

/**
 * Composites alpha matte onto original resolution ImageBitmap.
 */
async function generateCutoutAndMask(
  imageBitmap: ImageBitmap,
  matteData: Float32Array | Float64Array | number[],
  maskWidth: number,
  maskHeight: number,
  isModnet = false
): Promise<{ cutoutBlob: Blob; maskBlob: Blob; width: number; height: number }> {
  const origWidth = imageBitmap.width;
  const origHeight = imageBitmap.height;
  const numPixels = maskWidth * maskHeight;

  // 1. Build mask canvas
  const maskCanvas = new OffscreenCanvas(maskWidth, maskHeight);
  const maskCtx = maskCanvas.getContext('2d');
  if (!maskCtx) throw new Error('Could not get mask canvas context');

  const maskImageData = maskCtx.createImageData(maskWidth, maskHeight);
  const maskPixels = maskImageData.data;

  const bwCanvas = new OffscreenCanvas(maskWidth, maskHeight);
  const bwCtx = bwCanvas.getContext('2d');
  if (!bwCtx) throw new Error('Could not get B&W mask canvas context');
  const bwImageData = bwCtx.createImageData(maskWidth, maskHeight);
  const bwPixels = bwImageData.data;

  for (let i = 0; i < numPixels; i++) {
    const px = i * 4;
    const rawVal = matteData[i];

    let alpha = rawVal;
    if (alpha < 0 || alpha > 1) {
      alpha = 1 / (1 + Math.exp(-alpha));
    }
    alpha = Math.max(0, Math.min(1, alpha));

    if (isModnet) {
      if (alpha <= 0.04) {
        alpha = 0;
      } else if (alpha >= 0.60) {
        alpha = 1.0;
      } else {
        const t = (alpha - 0.04) / (0.60 - 0.04);
        alpha = Math.pow(t, 0.75);
      }
    } else {
      if (alpha <= 0.02) {
        alpha = 0;
      } else if (alpha >= 0.96) {
        alpha = 1.0;
      } else {
        const t = (alpha - 0.02) / (0.96 - 0.02);
        alpha = Math.pow(t, 0.90);
      }
    }

    const alphaByte = Math.round(alpha * 255);

    maskPixels[px] = 255;
    maskPixels[px + 1] = 255;
    maskPixels[px + 2] = 255;
    maskPixels[px + 3] = alphaByte;

    bwPixels[px] = alphaByte;
    bwPixels[px + 1] = alphaByte;
    bwPixels[px + 2] = alphaByte;
    bwPixels[px + 3] = 255;
  }

  maskCtx.putImageData(maskImageData, 0, 0);
  bwCtx.putImageData(bwImageData, 0, 0);

  let targetOutW = origWidth;
  let targetOutH = origHeight;
  const MAX_DIM = 4096;
  if (targetOutW > MAX_DIM || targetOutH > MAX_DIM) {
    const scale = Math.min(MAX_DIM / targetOutW, Math.max(MAX_DIM / targetOutH, 0.1));
    targetOutW = Math.round(targetOutW * scale);
    targetOutH = Math.round(targetOutH * scale);
  }

  const finalCanvas = new OffscreenCanvas(targetOutW, targetOutH);
  const finalCtx = finalCanvas.getContext('2d');
  if (!finalCtx) throw new Error('Could not get final canvas context');

  finalCtx.drawImage(imageBitmap, 0, 0, targetOutW, targetOutH);
  finalCtx.globalCompositeOperation = 'destination-in';
  finalCtx.imageSmoothingEnabled = true;
  finalCtx.imageSmoothingQuality = 'high';
  finalCtx.drawImage(maskCanvas, 0, 0, targetOutW, targetOutH);

  const finalBwCanvas = new OffscreenCanvas(targetOutW, targetOutH);
  const finalBwCtx = finalBwCanvas.getContext('2d');
  if (finalBwCtx) {
    finalBwCtx.imageSmoothingEnabled = true;
    finalBwCtx.imageSmoothingQuality = 'high';
    finalBwCtx.drawImage(bwCanvas, 0, 0, targetOutW, targetOutH);
  }

  const cutoutBlob = await finalCanvas.convertToBlob({ type: 'image/png' });
  const maskBlob = finalBwCtx ? await finalBwCanvas.convertToBlob({ type: 'image/png' }) : cutoutBlob;

  return { cutoutBlob, maskBlob, width: targetOutW, height: targetOutH };
}

self.onmessage = async (e: MessageEvent) => {
  const { type, blob, baseUrl, modelType } = e.data;

  if (baseUrl && typeof baseUrl === 'string') {
    runtimeAppBaseUrl = baseUrl;
    try {
      ort.env.wasm.wasmPaths = getWasmBasePath();
    } catch {}
  }

  if (type === 'preload') {
    try {
      if (modelType === 'modnet') {
        await getModnetSession();
      } else {
        await getRmbgSession();
      }
      self.postMessage({ type: 'preload-success', modelType });
    } catch (error: any) {
      self.postMessage({ type: 'preload-error', error: error?.message || String(error) });
    }
  } else if (type === 'removeBackground') {
    try {
      const startTime = performance.now();
      const useModnet = modelType === 'modnet';

      self.postMessage({ 
        type: 'progress', 
        step: useModnet ? 'Loading Portrait Matting AI...' : 'Loading Universal Neural Model (RMBG-1.4)...', 
        percent: 20 
      });

      let activeSession: ort.InferenceSession;
      try {
        activeSession = useModnet ? await getModnetSession() : await getRmbgSession();
      } catch (err: any) {
        if (!useModnet) {
          console.warn('[AI Bg Worker] RMBG load failed, falling back to MODNet:', err?.message);
          self.postMessage({ type: 'progress', step: 'Falling back to portrait model...', percent: 35 });
          activeSession = await getModnetSession();
        } else {
          throw err;
        }
      }

      self.postMessage({ type: 'progress', step: 'Extracting image tensors...', percent: 45 });
      const imageBitmap = await createImageBitmap(blob);

      const isModnetActive = activeSession.inputNames.length > 0 && activeSession.outputNames.includes('output') && activeSession === modnetSession;
      const { tensor, origWidth, origHeight } = isModnetActive
        ? preprocessModnetImage(imageBitmap)
        : preprocessRmbgImage(imageBitmap);

      self.postMessage({ type: 'progress', step: 'Analyzing subject & edges...', percent: 65 });
      const inputName = activeSession.inputNames[0] || 'input';
      const outputName = activeSession.outputNames[0] || 'output';

      const inferenceStart = performance.now();
      const results = await activeSession.run({ [inputName]: tensor });
      const inferenceElapsed = (performance.now() - inferenceStart).toFixed(1);
      console.log(`[AI Bg Worker] Inference completed in ${inferenceElapsed}ms (${isModnetActive ? 'MODNet' : 'RMBG-1.4'})`);

      self.postMessage({ type: 'progress', step: 'Matting hair, fur & transparent edges...', percent: 85 });
      const outputTensor = results[outputName];
      const matteData = outputTensor.data as Float32Array;

      const maskDim = isModnetActive ? 512 : 1024;
      const { cutoutBlob, maskBlob, width, height } = await generateCutoutAndMask(
        imageBitmap, 
        matteData, 
        maskDim, 
        maskDim, 
        isModnetActive
      );

      const totalTime = ((performance.now() - startTime) / 1000).toFixed(2);
      console.log(`[AI Bg Worker] Background removal complete in ${totalTime}s (${origWidth}x${origHeight}px -> ${width}x${height}px)`);

      self.postMessage({
        type: 'success',
        blob: cutoutBlob,
        maskBlob: maskBlob,
        width,
        height,
        modelUsed: isModnetActive ? 'MODNet Portrait AI' : 'RMBG-1.4 Universal AI',
        inferenceTimeMs: Number(inferenceElapsed),
        totalTimeSec: Number(totalTime)
      });
    } catch (error: any) {
      console.error('[AI Bg Worker] Error during background removal:', error);
      self.postMessage({ type: 'error', error: error?.message || String(error) });
    }
  }
};
