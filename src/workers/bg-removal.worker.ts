import * as ort from 'onnxruntime-web';

// Matching onnxruntime-web package version in package.json
const ORT_VERSION = '1.29.0';
const CDN_WASM_PATH = `https://cdn.jsdelivr.net/npm/onnxruntime-web@${ORT_VERSION}/dist/`;

let runtimeAppBaseUrl: string | null = null;

/**
 * Dynamically resolves the base URL of the deployed app,
 * automatically handling root domains, subdirectories (e.g. GitHub Pages /<repo>/),
 * Vite preview, Netlify, and local development.
 */
function getAppBaseUrl(): string {
  if (runtimeAppBaseUrl) {
    return runtimeAppBaseUrl;
  }
  if (typeof self !== 'undefined' && self.location && self.location.href) {
    const href = self.location.href;
    // If worker is located in /assets/ subdirectory
    const assetsIndex = href.lastIndexOf('/assets/');
    if (assetsIndex !== -1) {
      return href.substring(0, assetsIndex + 1);
    }
    try {
      const url = new URL(href);
      if (url.origin && !url.origin.startsWith('blob:') && !url.origin.startsWith('file:')) {
        const pathSegments = url.pathname.split('/').filter(Boolean);
        if (pathSegments.length > 1) {
          return `${url.origin}/${pathSegments[0]}/`;
        }
        return `${url.origin}/`;
      }
    } catch (e) {
      // Fallback
    }
  }
  return '/';
}

function getWasmBasePath(): string {
  const base = getAppBaseUrl();
  return `${base.replace(/\/+$/, '')}/onnxruntime/`;
}

/**
 * MODNet: Real-Time Trimap-Free Portrait Matting
 * Photographic portrait matting model specifically trained on human portraits
 * (head, hair, eyes, neck, collar, clothes, and shoulders).
 */
function getModelSources(): string[] {
  const base = getAppBaseUrl();
  const localModel = `${base.replace(/\/+$/, '')}/models/modnet.onnx`;
  return [
    localModel,
    'https://huggingface.co/TheEeeeLin/HivisionIDPhotos_matting/resolve/main/modnet_photographic_portrait_matting.onnx',
    'https://huggingface.co/DavG25/modnet-pretrained-models/resolve/main/modnet_photographic_portrait_matting.onnx'
  ];
}

const CACHE_NAME = 'snapid-modnet-model-v3';

try {
  ort.env.logLevel = 'error';
  const isIsolated = typeof crossOriginIsolated !== 'undefined' && crossOriginIsolated;
  const safeThreads = isIsolated
    ? (typeof navigator !== 'undefined' && navigator.hardwareConcurrency
        ? Math.min(4, Math.max(1, navigator.hardwareConcurrency))
        : 2)
    : 1;

  ort.env.wasm.wasmPaths = getWasmBasePath();
  ort.env.wasm.numThreads = safeThreads;
  ort.env.wasm.simd = true;
  ort.env.wasm.proxy = false;

  // Immediately eradicate all legacy caches (old U2NetP models and previous versions)
  if (typeof caches !== 'undefined') {
    caches.keys().then((keys) => {
      keys.forEach((key) => {
        if (key !== CACHE_NAME && (key.includes('u2net') || key.startsWith('snapid-u2netp-model-') || key.startsWith('snapid-modnet-model-'))) {
          console.log(`[MODNet Worker] Evicting legacy cache: ${key}`);
          caches.delete(key).catch(() => {});
        }
      });
    }).catch(() => {});
  }
} catch (e) {
  console.warn('[MODNet Worker] Initial wasmPaths configuration warning:', e);
}

let session: ort.InferenceSession | null = null;
let sessionLoadingPromise: Promise<ort.InferenceSession> | null = null;

async function fetchValidModelBuffer(url: string): Promise<ArrayBuffer> {
  const base = getAppBaseUrl();
  let resolvedUrl = url;

  if (url.startsWith('/')) {
    resolvedUrl = `${base.replace(/\/+$/, '')}${url}`;
  }

  // 1. Try retrieving from persistent browser Cache API for instantaneous load (<20ms)
  if (typeof caches !== 'undefined') {
    try {
      const cache = await caches.open(CACHE_NAME);
      const cached = await cache.match(resolvedUrl);
      if (cached) {
        const cachedBuffer = await cached.arrayBuffer();
        if (cachedBuffer.byteLength >= 20000000) {
          const header = new Uint8Array(cachedBuffer, 0, 4);
          if (header[0] === 0x08) {
            console.log(`[MODNet Worker] Loaded model instantly from Cache API (${(cachedBuffer.byteLength / 1024 / 1024).toFixed(2)} MB)`);
            return cachedBuffer;
          }
        }
      }
    } catch {
      // Ignore cache match error
    }
  }

  console.log(`[MODNet Worker] Fetching MODNet model binary from: ${resolvedUrl}`);
  const response = await fetch(resolvedUrl);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status} (${response.statusText})`);
  }
  const buffer = await response.arrayBuffer();
  if (buffer.byteLength < 20000000) {
    // MODNet photographic portrait matting model is ~24-26MB
    throw new Error(`Invalid model binary size: ${buffer.byteLength} bytes (expected >= 20MB)`);
  }

  // Validate protobuf ONNX magic header (starts with 0x08)
  const header = new Uint8Array(buffer, 0, 4);
  if (header[0] !== 0x08) {
    throw new Error(`Invalid ONNX protobuf header: [${Array.from(header).join(', ')}]`);
  }

  // Store in Cache API for zero-delay subsequent loads
  if (typeof caches !== 'undefined') {
    try {
      const cache = await caches.open(CACHE_NAME);
      await cache.put(resolvedUrl, new Response(buffer.slice(0), {
        headers: { 'Content-Type': 'application/octet-stream' }
      }));
      console.log(`[MODNet Worker] Cached model binary in browser CacheStorage (${CACHE_NAME})`);
    } catch {
      // Ignore cache put error
    }
  }

  console.log(`[MODNet Worker] Successfully verified MODNet model binary (${(buffer.byteLength / 1024 / 1024).toFixed(2)} MB) from: ${resolvedUrl}`);
  return buffer;
}

/**
 * Loads and caches the MODNet ONNX inference session once.
 * Reuses the cached session across all subsequent image requests.
 */
async function getSession(): Promise<ort.InferenceSession> {
  if (session) return session;
  if (sessionLoadingPromise) return sessionLoadingPromise;

  sessionLoadingPromise = (async () => {
    let lastError: any = null;
    const modelSources = getModelSources();

    const isIsolated = typeof crossOriginIsolated !== 'undefined' && crossOriginIsolated;
    const threads = isIsolated
      ? (typeof navigator !== 'undefined' && navigator.hardwareConcurrency
          ? Math.min(4, Math.max(1, navigator.hardwareConcurrency))
          : 2)
      : 1;

    // Try creating session with each verified model source until one succeeds
    for (const source of modelSources) {
      try {
        const buffer = await fetchValidModelBuffer(source);

        const sessionOptions: ort.InferenceSession.SessionOptions = {
          executionProviders: ['wasm'],
          graphOptimizationLevel: 'all',
          logSeverityLevel: 3,
          logVerbosityLevel: 0,
        };

        // Try candidate configurations in order of performance and compatibility (Local first)
        const wasmConfigs: Array<{ path: string; threads: number; label: string }> = [
          { path: getWasmBasePath(), threads: threads, label: `Local WASM (${threads > 1 ? 'Multi-thread' : 'Single-thread'})` },
          { path: getWasmBasePath(), threads: 1, label: 'Local WASM (Single-thread fallback)' },
          { path: CDN_WASM_PATH, threads: threads, label: 'jsDelivr CDN WASM' },
          { path: 'https://unpkg.com/onnxruntime-web@1.29.0/dist/', threads: 1, label: 'Unpkg CDN WASM (Single-thread)' }
        ];

        let createdSession: ort.InferenceSession | null = null;
        let lastInitError: any = null;

        for (const cfg of wasmConfigs) {
          try {
            ort.env.wasm.wasmPaths = cfg.path;
            ort.env.wasm.numThreads = cfg.threads;
            ort.env.wasm.simd = true;
            ort.env.wasm.proxy = false;
            createdSession = await ort.InferenceSession.create(buffer.slice(0), sessionOptions);
            console.log(`[MODNet Worker] MODNet session active via ${cfg.label}! Inputs: [${createdSession.inputNames.join(', ')}], Outputs: [${createdSession.outputNames.join(', ')}]`);
            break;
          } catch (cfgErr) {
            console.warn(`[MODNet Worker] ${cfg.label} initialization failed, trying next configuration...`, cfgErr);
            lastInitError = cfgErr;
          }
        }

        if (createdSession) {
          session = createdSession;
          return createdSession;
        }

        throw lastInitError || new Error('All WASM initialization attempts failed for this model buffer.');
      } catch (srcErr: any) {
        console.warn(`[MODNet Worker] Failed loading model from source ${source}:`, srcErr.message || srcErr);
        lastError = srcErr;
      }
    }

    sessionLoadingPromise = null;
    const finalErr = new Error(`Could not initialize MODNet ONNX session from any source. Reason: ${lastError?.message || lastError}`);
    console.error('[MODNet Worker] Failed to load ONNX session:', finalErr);
    throw finalErr;
  })();

  return sessionLoadingPromise;
}

/**
 * Preprocesses an ImageBitmap into a 512x512 Float32Array NCHW tensor
 * normalized using standard MODNet photographic portrait normalization: (pixel - 127.5) / 127.5.
 */
function preprocessImage(
  imageBitmap: ImageBitmap,
  targetWidth = 512,
  targetHeight = 512
): { tensor: ort.Tensor; origWidth: number; origHeight: number } {
  const origWidth = imageBitmap.width;
  const origHeight = imageBitmap.height;

  const canvas = new OffscreenCanvas(targetWidth, targetHeight);
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) throw new Error('Could not get 2D context from OffscreenCanvas');

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(imageBitmap, 0, 0, targetWidth, targetHeight);
  const imageData = ctx.getImageData(0, 0, targetWidth, targetHeight);
  const data = imageData.data;

  const numPixels = targetWidth * targetHeight;
  const tensorData = new Float32Array(3 * numPixels);

  for (let i = 0; i < numPixels; i++) {
    const px = i * 4;
    // MODNet normalization: (pixel - 127.5) / 127.5
    tensorData[i] = (data[px] - 127.5) / 127.5;                   // Channel 0 (Red)
    tensorData[numPixels + i] = (data[px + 1] - 127.5) / 127.5;   // Channel 1 (Green)
    tensorData[2 * numPixels + i] = (data[px + 2] - 127.5) / 127.5;// Channel 2 (Blue)
  }

  const tensor = new ort.Tensor('float32', tensorData, [1, 3, targetHeight, targetWidth]);
  return { tensor, origWidth, origHeight };
}

/**
 * Applies MODNet's 512x512 photographic portrait alpha matte cleanly onto
 * the original full-resolution image.
 *
 * NOTE: Unlike U2-NetP which required extensive heuristic cones, shoulder protection
 * bounds, and flood-fill patches, MODNet is natively trained specifically for human portraits.
 * It detects the entire upper body (face, eyes, neck, collar, clothes, shoulders, and hair)
 * with studio-grade matting precision and continuous edge blending.
 */
async function generateTransparentImage(
  imageBitmap: ImageBitmap,
  matteData: Float32Array | Float64Array | number[],
  maskWidth = 512,
  maskHeight = 512
): Promise<Blob> {
  const origWidth = imageBitmap.width;
  const origHeight = imageBitmap.height;
  const numPixels = maskWidth * maskHeight;

  // 1. Construct 512x512 Alpha Matte Canvas
  const maskCanvas = new OffscreenCanvas(maskWidth, maskHeight);
  const maskCtx = maskCanvas.getContext('2d');
  if (!maskCtx) throw new Error('Could not get mask canvas context');

  const maskImageData = maskCtx.createImageData(maskWidth, maskHeight);
  const maskData = maskImageData.data;

  for (let i = 0; i < numPixels; i++) {
    const px = i * 4;
    const rawAlpha = matteData[i];

    // Clamp value between 0 and 1
    let alphaFloat = Math.max(0, Math.min(1, rawAlpha));

    // Refinement curve:
    // MODNet matte ranges from 0.0 (background) to 1.0 (subject).
    // Subtle ear contours and thin protrusions often produce model confidence around 0.3 - 0.65.
    // With previous high solid-threshold (0.95), ears stayed semi-transparent or got clipped at edges.
    // New refined curve:
    // - Background floor (< 0.04): 100% transparent (cleans up any faint background fog)
    // - Foreground solid threshold (>= 0.60): 100% fully solid opaque (guarantees ears, hair rims, and collars are completely solid)
    // - Smooth transition zone [0.04, 0.60]: smooth curve with gentle power gamma (0.75) ensuring thin protrusions like ears get full body
    if (alphaFloat <= 0.04) {
      alphaFloat = 0;
    } else if (alphaFloat >= 0.60) {
      alphaFloat = 1.0;
    } else {
      const t = (alphaFloat - 0.04) / (0.60 - 0.04);
      // Gentle curve that boosts midtones (ears, thin hair strands) toward opacity
      alphaFloat = Math.pow(t, 0.75);
    }

    const alphaByte = Math.round(alphaFloat * 255);

    maskData[px] = 255;
    maskData[px + 1] = 255;
    maskData[px + 2] = 255;
    maskData[px + 3] = alphaByte;
  }

  maskCtx.putImageData(maskImageData, 0, 0);

  // 2. Composite onto full-resolution canvas preserving passport photo crispness
  let targetOutW = origWidth;
  let targetOutH = origHeight;
  const MAX_DIM = 2000;
  if (targetOutW > MAX_DIM || targetOutH > MAX_DIM) {
    const scale = Math.min(MAX_DIM / targetOutW, Math.max(MAX_DIM / targetOutH, 0.1));
    targetOutW = Math.round(targetOutW * scale);
    targetOutH = Math.round(targetOutH * scale);
  }

  const finalCanvas = new OffscreenCanvas(targetOutW, targetOutH);
  const finalCtx = finalCanvas.getContext('2d');
  if (!finalCtx) throw new Error('Could not get final canvas context');

  // Draw original image at target dimensions
  finalCtx.drawImage(imageBitmap, 0, 0, targetOutW, targetOutH);

  // Apply alpha mask smoothly with high-quality bicubic interpolation
  finalCtx.globalCompositeOperation = 'destination-in';
  finalCtx.imageSmoothingEnabled = true;
  finalCtx.imageSmoothingQuality = 'high';
  finalCtx.drawImage(maskCanvas, 0, 0, targetOutW, targetOutH);

  const resultBlob = await finalCanvas.convertToBlob({ type: 'image/png' });
  return resultBlob;
}

self.onmessage = async (e: MessageEvent) => {
  const { type, blob, baseUrl } = e.data;

  if (baseUrl && typeof baseUrl === 'string') {
    runtimeAppBaseUrl = baseUrl;
    try {
      ort.env.wasm.wasmPaths = getWasmBasePath();
    } catch (err) {
      // Ignored
    }
  }

  if (type === 'preload') {
    try {
      await getSession();
      self.postMessage({ type: 'preload-success' });
    } catch (error: any) {
      self.postMessage({ type: 'preload-error', error: error?.message || String(error) });
    }
  } else if (type === 'removeBackground') {
    try {
      const startTime = performance.now();
      self.postMessage({ type: 'progress', step: 'Loading AI Model...', percent: 25 });

      // Get or load cached session
      const activeSession = await getSession();

      self.postMessage({ type: 'progress', step: 'Extracting portrait...', percent: 50 });
      const imageBitmap = await createImageBitmap(blob);
      const { tensor, origWidth, origHeight } = preprocessImage(imageBitmap, 512, 512);

      self.postMessage({ type: 'progress', step: 'Matting background...', percent: 75 });
      const inputName = activeSession.inputNames[0] || 'input';
      const outputName = activeSession.outputNames[0] || 'output';

      const inferenceStart = performance.now();
      const results = await activeSession.run({ [inputName]: tensor });
      const inferenceElapsed = (performance.now() - inferenceStart).toFixed(1);
      console.log(`[MODNet Worker] Inference completed in ${inferenceElapsed}ms`);

      self.postMessage({ type: 'progress', step: 'Rendering portrait...', percent: 90 });
      const outputTensor = results[outputName];
      const matteData = outputTensor.data as Float32Array;

      const finalBlob = await generateTransparentImage(imageBitmap, matteData, 512, 512);
      
      const totalTime = ((performance.now() - startTime) / 1000).toFixed(2);
      console.log(`[MODNet Worker] Full portrait matting completed in ${totalTime}s (Original Size: ${origWidth}x${origHeight}px)`);

      self.postMessage({
        type: 'success',
        blob: finalBlob,
        inferenceTimeMs: Number(inferenceElapsed),
        totalTimeSec: Number(totalTime)
      });
    } catch (error: any) {
      console.error('[MODNet Worker] Error during portrait background removal:', error);
      session = null;
      self.postMessage({ type: 'error', error: error?.message || String(error) });
    }
  }
};
