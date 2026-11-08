import * as ort from 'onnxruntime-web';

// Matching onnxruntime-web package version
const ORT_VERSION = '1.29.0';
const CDN_WASM_PATH = `https://cdn.jsdelivr.net/npm/onnxruntime-web@${ORT_VERSION}/dist/`;

let runtimeAppBaseUrl: string | null = null;

/**
 * Dynamically resolves base URL across local dev, Cloudflare Pages, Next.js, and subdirectories.
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

// Model Cache Names in browser CacheStorage
const RMBG_CACHE_NAME = 'snapid-rmbg-model-v1';
const LITE_MODEL_CACHE_NAME = 'snapid-lite-bg-model-v1';
const MODNET_CACHE_NAME = 'snapid-modnet-model-v3';

// ============================================================================
// Model Source Definitions (Configurable Fallback Chain)
// ============================================================================
export const MODEL_SOURCES = {
  // Option 1: Lightweight Model (BiRefNet-lite / ISNet-quint8)
  lite: [
    '/models/birefnet-lite.onnx',
    'https://huggingface.co/ZhengPeng7/BiRefNet_lite/resolve/main/birefnet_lite.onnx',
    'https://huggingface.co/danielgatis/rembg/resolve/main/isnet-general-use.onnx',
  ],
  // Option 2: High-Fidelity Universal Model (RMBG-1.4 Quantized)
  rmbg: [
    '/models/rmbg-1.4.onnx',
    'https://huggingface.co/briaai/RMBG-1.4/resolve/main/onnx/model_quantized.onnx',
  ],
  // Option 3: Portrait Matting Fallback (MODNet)
  modnet: [
    '/models/modnet.onnx',
  ],
};

// ============================================================================
// Environment Diagnostics & WASM Multi-threading Setup
// ============================================================================
const isIsolated = typeof crossOriginIsolated !== 'undefined' && crossOriginIsolated;
const isSabAvailable = typeof SharedArrayBuffer !== 'undefined';
const hardwareThreads = typeof navigator !== 'undefined' && navigator.hardwareConcurrency ? navigator.hardwareConcurrency : 4;
const hasWebGpu = typeof navigator !== 'undefined' && 'gpu' in navigator && !!(navigator as any).gpu;

// If crossOriginIsolated is active, allocate all available CPU cores (up to 8).
// If isolation is false, browser blocks SharedArrayBuffer so fallback to single thread.
const allocatedThreads = (isIsolated && isSabAvailable)
  ? Math.min(8, Math.max(2, hardwareThreads))
  : 1;

try {
  ort.env.logLevel = 'error';
  const initialBasePath = getWasmBasePath();
  ort.env.wasm.wasmPaths = {
    mjs: `${initialBasePath}ort-wasm-simd-threaded.mjs`,
    wasm: `${initialBasePath}ort-wasm-simd-threaded.wasm`,
  };
  ort.env.wasm.numThreads = allocatedThreads;
  ort.env.wasm.simd = true;
  ort.env.wasm.proxy = false;

  console.log('[AI Bg Worker: ENVIRONMENT DIAGNOSTICS]', {
    crossOriginIsolated: isIsolated,
    allocatedThreads,
    hardwareConcurrency: hardwareThreads,
    isSharedArrayBufferAvailable: isSabAvailable,
    hasWebGpu,
    wasmPath: initialBasePath,
  });

  if (!isIsolated) {
    console.warn(
      '[AI Bg Worker] Notice: crossOriginIsolated is FALSE. WASM is falling back to single-thread mode (numThreads=1). ' +
      'To enable multi-threading, configure COOP: same-origin and COEP: credentialless headers in next.config.js / server.'
    );
  }
} catch (e) {
  console.warn('[AI Bg Worker] Initial ORT environment setup notice:', e);
}

// Session state cache
let activeBackendLabel = 'Unknown';
let cachedRmbgSession: ort.InferenceSession | null = null;
let rmbgLoadingPromise: Promise<ort.InferenceSession> | null = null;
let cachedLiteSession: ort.InferenceSession | null = null;
let liteLoadingPromise: Promise<ort.InferenceSession> | null = null;
let cachedModnetSession: ort.InferenceSession | null = null;
let modnetLoadingPromise: Promise<ort.InferenceSession> | null = null;

// ============================================================================
// Model Fetching with Browser CacheStorage (Zero-delay repeated loads)
// ============================================================================
async function fetchValidModelBuffer(url: string, cacheName: string, minBytes = 10000000): Promise<ArrayBuffer> {
  const base = getAppBaseUrl();
  let resolvedUrl = url;

  if (url.startsWith('/') && !url.startsWith('//')) {
    resolvedUrl = `${base.replace(/\/+$/, '')}${url}`;
  }

  // 1. Check browser Cache API first
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

  // 2. Fetch from network
  console.log(`[AI Bg Worker] Fetching model binary from: ${resolvedUrl}`);
  const response = await fetch(resolvedUrl, { mode: 'cors' });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status} (${response.statusText})`);
  }

  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('text/html')) {
    throw new Error(`Invalid response: Expected binary ONNX but received HTML text (SPA 404 or redirect)`);
  }

  const buffer = await response.arrayBuffer();
  if (buffer.byteLength < minBytes) {
    const textHeader = new TextDecoder().decode(new Uint8Array(buffer.slice(0, 30)));
    throw new Error(`Invalid model binary size: ${buffer.byteLength} bytes (expected >= ${minBytes}). Header: ${textHeader}`);
  }

  // Validate protobuf ONNX magic header (first byte 0x08)
  const header = new Uint8Array(buffer, 0, 4);
  if (header[0] !== 0x08) {
    const textHeader = new TextDecoder().decode(new Uint8Array(buffer.slice(0, 30)));
    throw new Error(`Invalid ONNX protobuf header: [${Array.from(header).join(', ')}]. Header: ${textHeader}`);
  }

  // Store in Cache API for subsequent zero-delay runs
  if (typeof caches !== 'undefined') {
    try {
      const cache = await caches.open(cacheName);
      await cache.put(resolvedUrl, new Response(buffer.slice(0), {
        headers: { 'Content-Type': 'application/octet-stream' },
      }));
      console.log(`[AI Bg Worker] Cached model binary in browser CacheStorage (${cacheName})`);
    } catch {
      // Ignore cache put error
    }
  }

  return buffer;
}

// ============================================================================
// Session Creation: WebGPU First -> Multi-threaded WASM -> Single-thread WASM
// ============================================================================
async function createOptimizedSession(modelBuffer: ArrayBuffer, modelLabel: string): Promise<ort.InferenceSession> {
  const tSessionStart = performance.now();

  // Step 2: WebGPU Acceleration (0.2s - 0.5s inference)
  if (typeof navigator !== 'undefined' && 'gpu' in navigator && (navigator as any).gpu) {
    try {
      console.log(`[AI Bg Worker] Attempting WebGPU hardware acceleration for ${modelLabel}...`);
      const webgpuSession = await ort.InferenceSession.create(modelBuffer.slice(0), {
        executionProviders: ['webgpu', 'wasm'],
        graphOptimizationLevel: 'all',
      });
      activeBackendLabel = 'WebGPU (Hardware Accelerated)';
      console.log(
        `[AI Bg Worker] SUCCESS: ${modelLabel} session ACTIVE via ${activeBackendLabel} in ${(performance.now() - tSessionStart).toFixed(1)}ms! ` +
        `Inputs: [${webgpuSession.inputNames.join(', ')}], Outputs: [${webgpuSession.outputNames.join(', ')}]`
      );
      return webgpuSession;
    } catch (gpuErr: any) {
      console.warn(`[AI Bg Worker] WebGPU session creation warning, falling back to WASM:`, gpuErr?.message || gpuErr);
    }
  }

  // Step 3: WASM Execution Provider (Multi-threaded if crossOriginIsolated, else Single-thread)
  const isIsolatedNow = typeof crossOriginIsolated !== 'undefined' && crossOriginIsolated;
  const threadsToUse = (isIsolatedNow && typeof SharedArrayBuffer !== 'undefined')
    ? Math.min(8, Math.max(2, hardwareThreads))
    : 1;

  const basePath = getWasmBasePath();
  const wasmPathConfig = {
    mjs: `${basePath}ort-wasm-simd-threaded.mjs`,
    wasm: `${basePath}ort-wasm-simd-threaded.wasm`,
  };

  const wasmAttempts: Array<{ path: any; threads: number; label: string }> = [
    {
      path: wasmPathConfig,
      threads: threadsToUse,
      label: `Local WASM (${threadsToUse > 1 ? `Multi-thread ${threadsToUse} cores` : 'Single-thread'})`,
    },
    {
      path: basePath,
      threads: threadsToUse,
      label: `Local Base WASM (${threadsToUse > 1 ? `Multi-thread ${threadsToUse} cores` : 'Single-thread'})`,
    },
    {
      path: wasmPathConfig,
      threads: 1,
      label: 'Local WASM (Single-thread fallback)',
    },
    {
      path: CDN_WASM_PATH,
      threads: 1,
      label: 'JSDelivr CDN WASM (Global fallback)',
    },
  ];

  let lastError: any = null;
  for (const cfg of wasmAttempts) {
    try {
      ort.env.wasm.wasmPaths = cfg.path;
      ort.env.wasm.numThreads = cfg.threads;
      ort.env.wasm.simd = true;
      ort.env.wasm.proxy = false;

      const wasmSession = await ort.InferenceSession.create(modelBuffer.slice(0), {
        executionProviders: ['wasm'],
        graphOptimizationLevel: 'all',
        logSeverityLevel: 3,
      });

      activeBackendLabel = cfg.label;
      console.log(
        `[AI Bg Worker] SUCCESS: ${modelLabel} session ACTIVE via ${activeBackendLabel} in ${(performance.now() - tSessionStart).toFixed(1)}ms! ` +
        `Inputs: [${wasmSession.inputNames.join(', ')}], Outputs: [${wasmSession.outputNames.join(', ')}]`
      );
      return wasmSession;
    } catch (err: any) {
      lastError = err;
      console.warn(`[AI Bg Worker] Session attempt failed for ${cfg.label}:`, err?.message || err);
    }
  }

  throw lastError || new Error(`Could not initialize inference session for ${modelLabel}`);
}

// ============================================================================
// Model Loaders with Progressive Fallbacks
// ============================================================================

/**
 * Loads RMBG-1.4 model (Local -> HuggingFace CDN)
 */
async function getRmbgSession(): Promise<ort.InferenceSession> {
  if (cachedRmbgSession) return cachedRmbgSession;
  if (rmbgLoadingPromise) return rmbgLoadingPromise;

  rmbgLoadingPromise = (async () => {
    const sources = MODEL_SOURCES.rmbg;
    let lastError: any = null;

    for (const src of sources) {
      try {
        const buffer = await fetchValidModelBuffer(src, RMBG_CACHE_NAME, 30000000);
        cachedRmbgSession = await createOptimizedSession(buffer, 'RMBG-1.4');
        return cachedRmbgSession;
      } catch (err: any) {
        lastError = err;
        console.warn(`[AI Bg Worker] RMBG source failed [${src}]:`, err?.message || err);
      }
    }

    rmbgLoadingPromise = null;
    throw new Error(`Failed to load RMBG-1.4 model: ${lastError?.message || lastError}`);
  })();

  return rmbgLoadingPromise;
}

/**
 * Loads Lightweight model (BiRefNet-lite / ISNet)
 */
async function getLiteSession(): Promise<ort.InferenceSession> {
  if (cachedLiteSession) return cachedLiteSession;
  if (liteLoadingPromise) return liteLoadingPromise;

  liteLoadingPromise = (async () => {
    const sources = MODEL_SOURCES.lite;
    let lastError: any = null;

    for (const src of sources) {
      try {
        const buffer = await fetchValidModelBuffer(src, LITE_MODEL_CACHE_NAME, 15000000);
        cachedLiteSession = await createOptimizedSession(buffer, 'BiRefNet-Lite / ISNet');
        return cachedLiteSession;
      } catch (err: any) {
        lastError = err;
        console.warn(`[AI Bg Worker] Lite model source skipped [${src}]:`, err?.message || err);
      }
    }

    // Fallback to RMBG-1.4 if lite models are unavailable
    console.log('[AI Bg Worker] Lite model unavailable, falling back to RMBG-1.4...');
    cachedLiteSession = await getRmbgSession();
    return cachedLiteSession;
  })();

  return liteLoadingPromise;
}

/**
 * Loads MODNet model (Portrait Matting fallback)
 */
async function getModnetSession(): Promise<ort.InferenceSession> {
  if (cachedModnetSession) return cachedModnetSession;
  if (modnetLoadingPromise) return modnetLoadingPromise;

  modnetLoadingPromise = (async () => {
    const sources = MODEL_SOURCES.modnet;
    let lastError: any = null;

    for (const src of sources) {
      try {
        const buffer = await fetchValidModelBuffer(src, MODNET_CACHE_NAME, 20000000);
        cachedModnetSession = await createOptimizedSession(buffer, 'MODNet');
        return cachedModnetSession;
      } catch (err: any) {
        lastError = err;
        console.warn(`[AI Bg Worker] MODNet source failed [${src}]:`, err?.message || err);
      }
    }

    modnetLoadingPromise = null;
    throw new Error(`Failed to load MODNet model: ${lastError?.message || lastError}`);
  })();

  return modnetLoadingPromise;
}

// ============================================================================
// Image Preprocessing (1024x1024 RMBG / 512x512 MODNet)
// ============================================================================
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

// ============================================================================
// Alpha Mask Compositing (with 1024-1500px resolution optimization)
// ============================================================================
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

  // Build mask canvas
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
    let alpha = matteData[i];

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

  // Step 4: Cap output dimension to 1024-1500px for maximum speed and memory efficiency
  let targetOutW = origWidth;
  let targetOutH = origHeight;
  const MAX_OUTPUT_DIM = 1500;
  if (targetOutW > MAX_OUTPUT_DIM || targetOutH > MAX_OUTPUT_DIM) {
    const scale = Math.min(MAX_OUTPUT_DIM / targetOutW, MAX_OUTPUT_DIM / targetOutH);
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

// ============================================================================
// Worker Message Handler
// ============================================================================
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
      if (modelType === 'lite') {
        await getLiteSession();
      } else if (modelType === 'modnet') {
        await getModnetSession();
      } else {
        await getRmbgSession();
      }
      self.postMessage({ type: 'preload-success', modelType, activeBackend: activeBackendLabel });
    } catch (error: any) {
      self.postMessage({ type: 'preload-error', error: error?.message || String(error) });
    }
  } else if (type === 'removeBackground') {
    const overallStart = performance.now();
    try {
      // Step 7: Continuous Progress Reporting
      self.postMessage({
        type: 'progress',
        step: 'मॉडल लोड हो रहा है... (Loading neural model)',
        percent: 20,
      });

      const tLoadStart = performance.now();
      let activeSession: ort.InferenceSession;
      let modelUsedName = 'RMBG-1.4 Universal AI';

      if (modelType === 'lite') {
        try {
          activeSession = await getLiteSession();
          modelUsedName = 'BiRefNet-Lite / ISNet';
        } catch {
          activeSession = await getRmbgSession();
          modelUsedName = 'RMBG-1.4 Universal AI';
        }
      } else if (modelType === 'modnet') {
        activeSession = await getModnetSession();
        modelUsedName = 'MODNet Portrait Matting';
      } else {
        try {
          activeSession = await getRmbgSession();
          modelUsedName = 'RMBG-1.4 Universal AI';
        } catch (err: any) {
          console.warn('[AI Bg Worker] RMBG load failed, attempting MODNet fallback:', err?.message);
          self.postMessage({
            type: 'progress',
            step: 'पोर्ट्रेट मॉडल पर स्विच हो रहा है... (Falling back to MODNet)',
            percent: 30,
          });
          activeSession = await getModnetSession();
          modelUsedName = 'MODNet Portrait AI (Fallback)';
        }
      }

      const loadElapsed = (performance.now() - tLoadStart).toFixed(1);
      console.log(`[AI Bg Worker: TIMER] Model load completed in ${loadElapsed}ms (Backend: ${activeBackendLabel})`);

      self.postMessage({
        type: 'progress',
        step: 'इमेज प्रोसेस हो रही है... (Extracting tensors)',
        percent: 45,
      });

      const tPrepStart = performance.now();
      const imageBitmap = await createImageBitmap(blob);
      const isModnet = activeSession.outputNames.includes('output') && activeSession === cachedModnetSession;

      const { tensor, origWidth, origHeight } = isModnet
        ? preprocessModnetImage(imageBitmap)
        : preprocessRmbgImage(imageBitmap);

      const prepElapsed = (performance.now() - tPrepStart).toFixed(1);
      console.log(`[AI Bg Worker: TIMER] Preprocessing completed in ${prepElapsed}ms (${origWidth}x${origHeight}px)`);

      self.postMessage({
        type: 'progress',
        step: 'बैकग्राउंड हट रहा है... (Neural inference)',
        percent: 65,
      });

      const inputName = activeSession.inputNames[0] || 'input';
      const outputName = activeSession.outputNames[0] || 'output';

      const tInferStart = performance.now();
      const results = await activeSession.run({ [inputName]: tensor });
      const inferenceElapsed = (performance.now() - tInferStart).toFixed(1);

      console.log(
        `[AI Bg Worker: TIMER] Inference finished in ${inferenceElapsed}ms | Backend: ${activeBackendLabel} | Model: ${modelUsedName}`
      );

      self.postMessage({
        type: 'progress',
        step: 'किनारे रिफाइन हो रहे हैं... (Refining edges & alpha matting)',
        percent: 85,
      });

      const tPostStart = performance.now();
      const outputTensor = results[outputName];
      const matteData = outputTensor.data as Float32Array;
      const maskDim = isModnet ? 512 : 1024;

      const { cutoutBlob, maskBlob, width, height } = await generateCutoutAndMask(
        imageBitmap,
        matteData,
        maskDim,
        maskDim,
        isModnet
      );

      const postElapsed = (performance.now() - tPostStart).toFixed(1);
      const totalTimeSec = Number(((performance.now() - overallStart) / 1000).toFixed(2));

      console.log(
        `[AI Bg Worker: TIMER] Post-processing finished in ${postElapsed}ms. ` +
        `TOTAL ROUNDTRIP: ${totalTimeSec}s (${origWidth}x${origHeight}px -> ${width}x${height}px)`
      );

      self.postMessage({
        type: 'progress',
        step: 'पूर्ण हुआ! (Complete)',
        percent: 100,
      });

      self.postMessage({
        type: 'success',
        blob: cutoutBlob,
        maskBlob: maskBlob,
        width,
        height,
        modelUsed: `${modelUsedName} [${activeBackendLabel}]`,
        backendUsed: activeBackendLabel,
        inferenceTimeMs: Number(inferenceElapsed),
        totalTimeSec,
      });
    } catch (error: any) {
      console.error('[AI Bg Worker] Error during background removal:', error);
      self.postMessage({ type: 'error', error: error?.message || String(error) });
    }
  }
};
