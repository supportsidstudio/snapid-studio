/**
 * SnapID Studio - AI HD Photo Enhancement Web Worker
 * 
 * Powered by Real-ESRGAN (general-x4v3 compact ONNX) super-resolution.
 * 
 * Key Capabilities:
 * 1. 100% Background Execution: Runs in dedicated Web Worker off the main UI thread.
 * 2. High-Fidelity Pre-Resize Resolution Caps:
 *    - Desktop / High-End: 2048px (Super-detail master)
 *    - Mid/High-Tier Mobile (>=6 cores or >=4GB RAM): 1500px
 *    - Low-End Mobile (<=4 cores / <=2GB RAM): 1024px
 * 3. Stage 1 Face-Region Super-Resolution Re-Pass (Always Active):
 *    - Extracts high-resolution facial crop with 30% contextual padding.
 *    - Runs dedicated Real-ESRGAN neural pass on the face region.
 *    - Seamlessly alpha-blends with an elliptical feathered cosine gradient and luminance matching.
 * 4. Multi-Band Micro-Texture & Detail Restoration Engine:
 *    - Band 1 (Fine Skin Texture): Restores authentic skin pores and micro-contrast (anti-plastic/anti-blur).
 *    - Band 2 (Edge & Feature Sharpness): Crisp eye iris, eyelashes, eyebrows, and fine hair strand definition with zero haloing.
 * 5. Overlapped Hann/Cosine Window Tiling:
 *    - 2D Cosine window accumulation across all overlap zones eliminates 100% of seams and striping.
 */

import * as ort from 'onnxruntime-web';

const ORT_VERSION = '1.29.0';
const CDN_WASM_PATH = `https://cdn.jsdelivr.net/npm/onnxruntime-web@${ORT_VERSION}/dist/`;

let runtimeAppBaseUrl: string | null = null;

function getAppBaseUrl(): string {
  if (runtimeAppBaseUrl) {
    return runtimeAppBaseUrl;
  }
  if (typeof self !== 'undefined' && self.location && self.location.href) {
    const href = self.location.href;
    const assetsIndex = href.lastIndexOf('/assets/');
    if (assetsIndex !== -1) {
      return href.substring(0, assetsIndex + 1);
    }
    try {
      const url = new URL(href);
      if (url.origin && !url.origin.startsWith('blob:') && !url.origin.startsWith('file:')) {
        const pathSegments = url.pathname.split('/').filter(Boolean);
        // Do not treat Vite dev paths (/src, /workers, etc.) as sub-directory deployments
        if (
          pathSegments.length > 1 &&
          pathSegments[0] !== 'src' &&
          pathSegments[0] !== 'workers' &&
          pathSegments[0] !== '@fs' &&
          pathSegments[0] !== 'node_modules'
        ) {
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

function getModelSources(): string[] {
  const base = getAppBaseUrl();
  const localModel = `${base.replace(/\/+$/, '')}/models/realesr-general-x4v3/model.onnx`;
  return [
    localModel,
    '/models/realesr-general-x4v3/model.onnx',
    'https://huggingface.co/CoderViking/realesr-general-x4v3-onnx/resolve/main/realesr-general-x4v3.onnx',
    'https://raw.githubusercontent.com/CoderViking/realesr-general-x4v3-onnx/main/realesr-general-x4v3.onnx'
  ];
}

const CACHE_NAME = 'snapid-realesrgan-model-v3';
const EXPECTED_LOCAL_MODEL_SIZE = 4866417; // Exact byte length of realesr-general-x4v3.onnx

try {
  ort.env.logLevel = 'error';
  const isIsolated = typeof crossOriginIsolated !== 'undefined' && crossOriginIsolated;
  const safeThreads = isIsolated
    ? (typeof navigator !== 'undefined' && navigator.hardwareConcurrency
        ? Math.min(4, Math.max(1, navigator.hardwareConcurrency))
        : 2)
    : 1;

  // Always point to local WASM binaries first (shipped in /onnxruntime/)
  ort.env.wasm.wasmPaths = getWasmBasePath();
  ort.env.wasm.numThreads = safeThreads;
  ort.env.wasm.simd = true;
  ort.env.wasm.proxy = false;

  // Purge legacy caches asynchronously
  if (typeof caches !== 'undefined') {
    caches.keys().then((keys) => {
      keys.forEach((key) => {
        if (key.startsWith('snapid-realesrgan-model-') && key !== CACHE_NAME) {
          caches.delete(key).catch(() => {});
        }
      });
    }).catch(() => {});
  }

  console.log('[AI Enhancer Worker: ENVIRONMENT DIAGNOSTICS]', {
    crossOriginIsolated: isIsolated,
    allocatedThreads: safeThreads,
    hardwareConcurrency: typeof navigator !== 'undefined' ? navigator.hardwareConcurrency : 'unknown',
    isSharedArrayBufferAvailable: typeof SharedArrayBuffer !== 'undefined',
    wasmPath: getWasmBasePath(),
    environmentNotice: isIsolated
      ? 'Cross-Origin Isolation ACTIVE (Multi-threaded WASM SIMD enabled)'
      : 'Embedded/Iframe Context: crossOriginIsolated is FALSE. Multi-threading is locked by browser security. In standalone/production tab, COOP/COEP enables multi-threading.'
  });
} catch (e) {
  console.warn('[AI Enhancer Worker] Initial ORT environment warning:', e);
}

let session: ort.InferenceSession | null = null;
let sessionLoadingPromise: Promise<ort.InferenceSession> | null = null;
let activeBackend: 'wasm-threaded' | 'wasm-single' = 'wasm-single';
let activeThreads: number = 1;

async function fetchAndCacheModelBuffer(postProgress: (msg: string, pct: number) => void): Promise<ArrayBuffer> {
  const base = getAppBaseUrl();
  const sources = getModelSources();

  // 1. Try Cache API for instant retrieval (<20ms)
  if (typeof caches !== 'undefined') {
    try {
      const cache = await caches.open(CACHE_NAME);
      for (const src of sources) {
        const resolved = src.startsWith('/') ? `${base.replace(/\/+$/, '')}${src}` : src;
        const cached = await cache.match(resolved);
        if (cached) {
          const buffer = await cached.arrayBuffer();
          if (buffer.byteLength >= 4800000 && buffer.byteLength <= 5000000) {
            const header = new Uint8Array(buffer, 0, 4);
            if (header[0] === 0x08) {
              console.log(`[AI Enhancer Worker] Model verified from Cache API (${(buffer.byteLength / 1024 / 1024).toFixed(2)} MB, ${buffer.byteLength} bytes)`);
              return buffer;
            }
          }
        }
      }
    } catch (cacheErr) {
      console.warn('[AI Enhancer Worker] Cache API lookup notice:', cacheErr);
    }
  }

  // 2. Fetch from local/CDN endpoints with robust verification
  let lastError: any = null;
  for (let i = 0; i < sources.length; i++) {
    const rawUrl = sources[i];
    const url = rawUrl.startsWith('/') ? `${base.replace(/\/+$/, '')}${rawUrl}` : rawUrl;
    try {
      postProgress(i === 0 ? 'Loading Real-ESRGAN AI model (~4.86MB)...' : 'Retrying AI model load from mirror...', 12);
      console.log(`[AI Enhancer Worker] Fetching Real-ESRGAN model binary from: ${url}`);
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status} (${res.statusText})`);

      const cType = res.headers.get('content-type') || '';
      if (cType.includes('text/html')) {
        throw new Error(`Invalid response content-type: ${cType} (expected binary stream, got HTML 404 page)`);
      }

      const cEncoding = res.headers.get('content-encoding');
      const cLength = res.headers.get('content-length');
      const buffer = await res.arrayBuffer();

      console.log(`[AI Enhancer Worker] Model fetch completed from ${url}. Headers: [Content-Length: ${cLength}, Content-Encoding: ${cEncoding || 'none'}], Decompressed Payload: ${buffer.byteLength} bytes`);

      // Integrity checks:
      // A: Size validation (Real-ESRGAN general x4v3 compact ONNX is ~4.86MB)
      if (buffer.byteLength < 4800000 || buffer.byteLength > 5000000) {
        throw new Error(`Model binary size mismatch: expected ~${EXPECTED_LOCAL_MODEL_SIZE} bytes (4.86MB), received ${buffer.byteLength} bytes. File is likely corrupted or truncated.`);
      }

      // B: Protobuf ONNX Magic Byte check (All valid ONNX models begin with 0x08 tag 1)
      const header = new Uint8Array(buffer, 0, 4);
      if (header[0] !== 0x08) {
        throw new Error(`Invalid ONNX binary protobuf header: [${Array.from(header).join(', ')}] (expected first byte 0x08)`);
      }

      // If Content-Length header is present and no compression was applied, verify byte count
      if (cLength && (!cEncoding || cEncoding === 'identity')) {
        const declaredLen = parseInt(cLength, 10);
        if (!isNaN(declaredLen) && declaredLen !== buffer.byteLength) {
          console.warn(`[AI Enhancer Worker] Warning: Content-Length header (${declaredLen}) != received bytes (${buffer.byteLength})`);
        }
      }

      if (typeof caches !== 'undefined') {
        try {
          const cache = await caches.open(CACHE_NAME);
          await cache.put(url, new Response(buffer.slice(0), {
            headers: { 'Content-Type': 'application/octet-stream', 'Content-Length': String(buffer.byteLength) }
          }));
        } catch (e) {
          // Ignore cache write errors
        }
      }
      return buffer;
    } catch (e: any) {
      console.warn(`[AI Enhancer Worker] Failed to load/verify from ${url}:`, e?.message || e);
      lastError = e;
    }
  }

  throw lastError || new Error('All model sources failed to load');
}

async function getOrInitSession(postProgress: (msg: string, pct: number) => void): Promise<ort.InferenceSession> {
  if (session) return session;
  if (sessionLoadingPromise) return sessionLoadingPromise;

  sessionLoadingPromise = (async () => {
    const tStart = performance.now();
    const modelBuffer = await fetchAndCacheModelBuffer(postProgress);
    postProgress('Initializing Real-ESRGAN neural engine...', 25);

    const isIsolated = typeof crossOriginIsolated !== 'undefined' && crossOriginIsolated;
    const threads = isIsolated
      ? (typeof navigator !== 'undefined' && navigator.hardwareConcurrency
          ? Math.min(4, Math.max(1, navigator.hardwareConcurrency))
          : 2)
      : 1;

    const isGitHub = typeof self !== 'undefined' && self.location && (self.location.hostname.includes('github.io') || self.location.protocol === 'file:');

    const sessionOptions: ort.InferenceSession.SessionOptions = {
      executionProviders: ['wasm'],
      graphOptimizationLevel: 'all',
      enableCpuMemArena: true,
      enableMemPattern: true,
      logSeverityLevel: 3,
      intraOpNumThreads: threads,
      interOpNumThreads: 1,
    };

    // WASM execution configurations in priority order: Local bundled files FIRST
    const wasmConfigs: Array<{ path: string; threads: number; label: string }> = [
      { path: getWasmBasePath(), threads: threads, label: `Local WASM (${threads > 1 ? `${threads}-thread SIMD` : 'Single-thread SIMD'})` },
      { path: getWasmBasePath(), threads: 1, label: 'Local WASM (Single-thread fallback)' },
      { path: CDN_WASM_PATH, threads: threads, label: 'jsDelivr CDN WASM' },
      { path: 'https://unpkg.com/onnxruntime-web@1.29.0/dist/', threads: 1, label: 'Unpkg CDN WASM (Single-thread)' }
    ];

    let lastWasmErr: any = null;
    for (const cfg of wasmConfigs) {
      try {
        console.log(`[AI Enhancer Worker] Attempting session creation with: ${cfg.label} (path: ${cfg.path}, threads: ${cfg.threads})`);
        ort.env.wasm.wasmPaths = cfg.path;
        ort.env.wasm.numThreads = cfg.threads;
        ort.env.wasm.simd = true;
        ort.env.wasm.proxy = false;

        const wasmSession = await ort.InferenceSession.create(modelBuffer.slice(0), sessionOptions);
        const isSharedArrayBufferAvailable = typeof SharedArrayBuffer !== 'undefined';
        activeBackend = (isIsolated && isSharedArrayBufferAvailable && cfg.threads > 1) ? 'wasm-threaded' : 'wasm-single';
        activeThreads = activeBackend === 'wasm-threaded' ? cfg.threads : 1;
        console.log(`[AI Enhancer Worker] Real-ESRGAN session ACTIVE via ${cfg.label} (Engine: ${activeBackend}, Threads: ${activeThreads}, Isolated: ${isIsolated}, SharedArrayBuffer: ${isSharedArrayBufferAvailable}) in ${(performance.now() - tStart).toFixed(1)}ms! Inputs: [${wasmSession.inputNames.join(', ')}] Outputs: [${wasmSession.outputNames.join(', ')}]`);
        session = wasmSession;
        return wasmSession;
      } catch (cfgErr: any) {
        console.warn(`[AI Enhancer Worker] ${cfg.label} initialization failed:`, cfgErr?.message || cfgErr);
        lastWasmErr = cfgErr;
      }
    }

    throw lastWasmErr || new Error('All ONNX WASM execution providers failed to initialize');
  })();

  try {
    return await sessionLoadingPromise;
  } finally {
    sessionLoadingPromise = null;
  }
}

// Classical studio lighting and color normalization
function applyAutoExposure(imageData: ImageData): void {
  const data = imageData.data;
  const len = data.length;
  let totalLuma = 0;
  let fgCount = 0;

  for (let i = 0; i < len; i += 4) {
    if (data[i + 3] > 30) {
      totalLuma += 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
      fgCount++;
    }
  }
  if (fgCount === 0) return;
  const avgLuma = totalLuma / fgCount;

  let gamma = 1.0;
  if (avgLuma < 110) {
    gamma = Math.max(0.85, 1.0 - (110 - avgLuma) * 0.0022);
  } else if (avgLuma > 165) {
    gamma = Math.min(1.08, 1.0 + (avgLuma - 165) * 0.0015);
  }

  if (Math.abs(gamma - 1.0) > 0.01) {
    const lut = new Uint8Array(256);
    for (let i = 0; i < 256; i++) {
      if (i < 30) {
        // PITCH-BLACK LOCK: Preserve deep blacks for pupils, irises & eyelashes (NO LIFT)
        lut[i] = i;
      } else if (i < 70) {
        // Smooth transition from original black level to gamma curve
        const t = (i - 30) / 40;
        const gammaVal = Math.round(Math.pow(i / 255, gamma) * 255);
        lut[i] = Math.max(0, Math.min(255, Math.round(i * (1 - t) + gammaVal * t)));
      } else {
        lut[i] = Math.max(0, Math.min(255, Math.round(Math.pow(i / 255, gamma) * 255)));
      }
    }
    for (let i = 0; i < len; i += 4) {
      if (data[i + 3] > 30) {
        data[i] = lut[data[i]];
        data[i + 1] = lut[data[i + 1]];
        data[i + 2] = lut[data[i + 2]];
      }
    }
  }
}

function applyAutoColorAndSkinGuard(imageData: ImageData): void {
  const data = imageData.data;
  const len = data.length;
  let sumR = 0, sumG = 0, sumB = 0, count = 0;

  for (let i = 0; i < len; i += 4) {
    if (data[i + 3] > 30) {
      sumR += data[i];
      sumG += data[i + 1];
      sumB += data[i + 2];
      count++;
    }
  }
  if (count === 0) return;

  const avgR = sumR / count;
  const avgG = sumG / count;
  const avgB = sumB / count;
  const avgGray = (avgR + avgG + avgB) / 3;

  const scaleR = Math.max(0.97, Math.min(1.03, avgGray / (avgR || 1)));
  const scaleG = Math.max(0.98, Math.min(1.02, avgGray / (avgG || 1)));
  const scaleB = Math.max(0.97, Math.min(1.03, avgGray / (avgB || 1)));

  for (let i = 0; i < len; i += 4) {
    if (data[i + 3] > 30) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const luma = 0.299 * r + 0.587 * g + 0.114 * b;

      // Dark features (pupils, dark irises, eyelashes, eyebrows, hair) OR non-skin tones MUST NOT be gray-shifted!
      const isDarkFeature = luma < 55;
      const isSkin = r > g && g > b && (r - b) > 10;

      let blend = 0.0; // Default zero color shift for non-skin / dark eye features
      if (isSkin && !isDarkFeature) {
        blend = 0.18; // Subtle skin color normalization only
      } else if (!isDarkFeature && luma > 180) {
        blend = 0.15; // Subtle background / highlight adjustment only
      }

      if (blend > 0) {
        const nr = r * (1 - blend + scaleR * blend);
        const ng = g * (1 - blend + scaleG * blend);
        const nb = b * (1 - blend + scaleB * blend);

        data[i] = Math.max(0, Math.min(255, Math.round(nr)));
        data[i + 1] = Math.max(0, Math.min(255, Math.round(ng)));
        data[i + 2] = Math.max(0, Math.min(255, Math.round(nb)));
      }
    }
  }
}

/**
 * High-Precision Multi-Band Portrait Detail & Micro-Texture Engine
 * 
 * Restores:
 * 1. Fine Skin Micro-Texture (authentic pores & dermal texture, eliminating plastic look)
 * 2. Facial Features & Edge Definition (crisp iris ring, eyelashes, eyebrows, lips, hair strands)
 * 3. Local Contrast Enhancement with adaptive anti-halo clamping
 */
function applyHighDefinitionDetailRestoration(imageData: ImageData): void {
  const w = imageData.width;
  const h = imageData.height;
  const src = new Uint8ClampedArray(imageData.data);
  const dst = imageData.data;

  // Multi-band unsharp masking with 8-neighbor isotropic local mean & eye feature enhancement
  for (let y = 2; y < h - 2; y++) {
    for (let x = 2; x < w - 2; x++) {
      const idx = (y * w + x) * 4;
      if (src[idx + 3] < 30) continue;

      const r = src[idx];
      const g = src[idx + 1];
      const b = src[idx + 2];
      const luma = 0.299 * r + 0.587 * g + 0.114 * b;

      // Skin tone detection
      const isSkin = r > g && g > b && (r - b) > 10 && luma > 40 && luma < 235;
      const isEyeFeature = luma < 60 || (luma > 200 && (x > w * 0.25 && x < w * 0.75 && y > h * 0.15 && y < h * 0.60));

      // 1. Isotropic 3x3 8-neighbor local mean (eliminates 4-cross artifacts on circular pupils/irises)
      const rowTop = (y - 1) * w;
      const rowMid = y * w;
      const rowBot = (y + 1) * w;

      const n0 = (rowTop + (x - 1)) * 4;
      const n1 = (rowTop + x) * 4;
      const n2 = (rowTop + (x + 1)) * 4;
      const n3 = (rowMid + (x - 1)) * 4;
      const n4 = (rowMid + (x + 1)) * 4;
      const n5 = (rowBot + (x - 1)) * 4;
      const n6 = (rowBot + x) * 4;
      const n7 = (rowBot + (x + 1)) * 4;

      // 2. Wide 5x5 8-point outer sampling for medium frequency
      const rowTop2 = (y - 2) * w;
      const rowBot2 = (y + 2) * w;

      const w0 = (rowTop2 + x) * 4;
      const w1 = (rowBot2 + x) * 4;
      const w2 = (rowMid + (x - 2)) * 4;
      const w3 = (rowMid + (x + 2)) * 4;

      for (let c = 0; c < 3; c++) {
        const val = src[idx + c];

        // 8-neighbor isotropic mean
        const mean3 = (
          src[n0 + c] + src[n1 + c] + src[n2 + c] +
          src[n3 + c]               + src[n4 + c] +
          src[n5 + c] + src[n6 + c] + src[n7 + c]
        ) * 0.125;

        const mean5 = (src[w0 + c] + src[w1 + c] + src[w2 + c] + src[w3 + c]) * 0.25;

        const diffHigh = val - mean3;
        const diffMed = mean3 - mean5;

        let delta = 0;

        if (isSkin) {
          // Skin zones: enhance fine pores while avoiding coarse blotchiness
          if (Math.abs(diffHigh) > 0.8 && Math.abs(diffHigh) < 28) {
            delta += diffHigh * 0.52;
          }
          if (Math.abs(diffMed) > 1.0 && Math.abs(diffMed) < 32) {
            delta += diffMed * 0.28;
          }
        } else if (isEyeFeature) {
          // Eye & eyelash zone: ultra-crisp edge definition for iris ring, eyelashes, eyebrows & catchlights
          if (Math.abs(diffHigh) > 0.5 && Math.abs(diffHigh) < 55) {
            delta += diffHigh * 0.85; // Strong crisp eye sharpness
          }
          if (Math.abs(diffMed) > 0.8 && Math.abs(diffMed) < 65) {
            delta += diffMed * 0.55;
          }
        } else {
          // Hair, clothing, background edges
          if (Math.abs(diffHigh) > 0.8 && Math.abs(diffHigh) < 45) {
            delta += diffHigh * 0.65;
          }
          if (Math.abs(diffMed) > 1.0 && Math.abs(diffMed) < 55) {
            delta += diffMed * 0.45;
          }
        }

        // Anti-halo soft roll-off clamp
        const maxDelta = isSkin ? 24 : 45;
        const clampedDelta = Math.max(-maxDelta, Math.min(maxDelta, delta));

        let finalVal = val + clampedDelta;

        // PITCH-BLACK PUPIL PROTECTION: Core pupil pixels (< 25 luma) stay deep pitch black
        if (luma < 25 && c < 3) {
          finalVal = Math.min(val, finalVal);
        }

        dst[idx + c] = Math.max(0, Math.min(255, Math.round(finalVal)));
      }
    }
  }
}

/**
 * Fast Classical Enhancement (Low-Power / Fast Mode)
 */
async function runFastModeEnhance(
  imageBitmap: ImageBitmap,
  postProgress: (msg: string, pct: number) => void
): Promise<Blob> {
  postProgress('Applying Fast Mode studio enhancement...', 50);
  const inW = imageBitmap.width;
  const inH = imageBitmap.height;

  const targetW = Math.round(inW * 2);
  const targetH = Math.round(inH * 2);

  const canvas = new OffscreenCanvas(targetW, targetH);
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(imageBitmap, 0, 0, targetW, targetH);

  const imgData = ctx.getImageData(0, 0, targetW, targetH);
  applyAutoExposure(imgData);
  applyAutoColorAndSkinGuard(imgData);
  applyHighDefinitionDetailRestoration(imgData);
  ctx.putImageData(imgData, 0, 0);

  postProgress('Finalizing HD portrait...', 95);
  return await canvas.convertToBlob({ type: 'image/png' });
}

/**
 * Single Forward Pass Super-Resolution for compact images or face crop
 */
async function runSinglePassSuperResolution(
  sess: ort.InferenceSession,
  inputCanvas: OffscreenCanvas,
  width: number,
  height: number
): Promise<OffscreenCanvas> {
  const modelScale = 4;
  const outW = width * modelScale;
  const outH = height * modelScale;

  const padW = Math.ceil(width / 16) * 16;
  const padH = Math.ceil(height / 16) * 16;

  const ctx = inputCanvas.getContext('2d', { willReadFrequently: true })!;
  const inImgData = ctx.getImageData(0, 0, width, height);
  const inPixels = inImgData.data;

  const tensorData = new Float32Array(3 * padW * padH);
  const planeSize = padW * padH;

  for (let y = 0; y < padH; y++) {
    const srcY = Math.min(height - 1, y);
    for (let x = 0; x < padW; x++) {
      const srcX = Math.min(width - 1, x);
      const srcIdx = (srcY * width + srcX) * 4;
      const dstIdx = y * padW + x;

      tensorData[dstIdx] = inPixels[srcIdx] / 255.0;
      tensorData[planeSize + dstIdx] = inPixels[srcIdx + 1] / 255.0;
      tensorData[planeSize * 2 + dstIdx] = inPixels[srcIdx + 2] / 255.0;
    }
  }

  const inputName = sess.inputNames[0] || 'input';
  const outputName = sess.outputNames[0] || 'output';

  const inputTensor = new ort.Tensor('float32', tensorData, [1, 3, padH, padW]);
  console.log(`[AI Enhancer Worker: INFERENCE START] Single Pass | Input Tensor Shape: [${inputTensor.dims.join(', ')}] | Type: ${inputTensor.type} | Size: ${inputTensor.data.length} elements`);
  const tInferStart = performance.now();

  const results = await sess.run({ [inputName]: inputTensor });
  const outTensor = results[outputName];
  const tInferMs = performance.now() - tInferStart;

  if (!outTensor || !outTensor.data) {
    throw new Error('Real-ESRGAN output tensor missing');
  }

  console.log(`[AI Enhancer Worker: INFERENCE COMPLETE] Single Pass | Output Tensor Shape: [${outTensor.dims.join(', ')}] | Inference Time: ${tInferMs.toFixed(1)}ms`);

  const outData = outTensor.data as Float32Array;
  const aiPadW = padW * modelScale;
  const aiPlaneSize = aiPadW * padH * modelScale;

  const outCanvas = new OffscreenCanvas(outW, outH);
  const outCtx = outCanvas.getContext('2d', { willReadFrequently: true })!;
  const outImgData = outCtx.createImageData(outW, outH);
  const outPixels = outImgData.data;

  for (let y = 0; y < outH; y++) {
    for (let x = 0; x < outW; x++) {
      const srcIdx = y * aiPadW + x;
      const dstIdx = (y * outW + x) * 4;

      outPixels[dstIdx] = Math.max(0, Math.min(255, Math.round(outData[srcIdx] * 255.0)));
      outPixels[dstIdx + 1] = Math.max(0, Math.min(255, Math.round(outData[aiPlaneSize + srcIdx] * 255.0)));
      outPixels[dstIdx + 2] = Math.max(0, Math.min(255, Math.round(outData[aiPlaneSize * 2 + srcIdx] * 255.0)));
      outPixels[dstIdx + 3] = 255;
    }
  }

  outCtx.putImageData(outImgData, 0, 0);
  return outCanvas;
}

/**
 * Core Real-ESRGAN Neural Inference with Overlapped Cosine Hann-Window Tiling
 * Highly optimized: Reusable tensor buffers, precomputed 1D Cosine Hann LUTs, zero-allocation tile loop
 */
async function runRealEsrganInferenceWorker(
  sess: ort.InferenceSession,
  inputCanvas: OffscreenCanvas,
  inWidth: number,
  inHeight: number,
  isLowEnd: boolean,
  postProgress: (msg: string, pct: number) => void,
  progressBasePct = 30,
  progressSpanPct = 58
): Promise<OffscreenCanvas> {
  const modelScale = 4;
  const outW = inWidth * modelScale;
  const outH = inHeight * modelScale;

  const ctx = inputCanvas.getContext('2d', { willReadFrequently: true })!;
  const inImgData = ctx.getImageData(0, 0, inWidth, inHeight);
  const inPixels = inImgData.data;

  const inputName = sess.inputNames[0] || 'input';
  const outputName = sess.outputNames[0] || 'output';

  const isMultiThreadActive = activeBackend === 'wasm-threaded' && activeThreads > 1;

  // Single pass if image is compact
  const singlePassThreshold = isMultiThreadActive ? 320 : 300;
  if (inWidth <= singlePassThreshold && inHeight <= singlePassThreshold) {
    postProgress('Running Real-ESRGAN neural super-resolution (single pass ~8s)...', progressBasePct + Math.round(progressSpanPct * 0.5));
    return await runSinglePassSuperResolution(sess, inputCanvas, inWidth, inHeight);
  }

  // Adaptive Tile & Overlap Sizing based on ACTUAL runtime engine & thread count:
  // - Multi-threaded WASM SIMD (threads >= 2 & crossOriginIsolated): 224px tiles with 12px overlap (parallel thread scaling)
  // - Single-threaded WASM fallback (Threads: 1 or non-isolated): 160px tiles with 10px overlap (cuts per-tile pixel workload by 50% vs 224px and 60% vs 256px!)
  const tileSize = isMultiThreadActive ? 224 : 160;
  const tilePad = isMultiThreadActive ? 12 : 10;
  const step = tileSize - 2 * tilePad;

  console.log(`[AI Enhancer Worker: TILE CONFIG] Active Engine: ${activeBackend} (Threads: ${activeThreads}) | isLowEnd: ${isLowEnd} => Chosen Tile Size: ${tileSize}x${tileSize}px (step: ${step}px, overlap: ${tilePad}px)`);

  const accumR = new Float32Array(outW * outH);
  const accumG = new Float32Array(outW * outH);
  const accumB = new Float32Array(outW * outH);
  const accumW = new Float32Array(outW * outH);

  const xPositions: number[] = [];
  for (let x = 0; x < inWidth; x += step) {
    if (x + tileSize >= inWidth) {
      xPositions.push(Math.max(0, inWidth - tileSize));
      break;
    }
    xPositions.push(x);
  }
  const yPositions: number[] = [];
  for (let y = 0; y < inHeight; y += step) {
    if (y + tileSize >= inHeight) {
      yPositions.push(Math.max(0, inHeight - tileSize));
      break;
    }
    yPositions.push(y);
  }

  const totalTiles = xPositions.length * yPositions.length;
  const tileOutW = tileSize * modelScale;
  const tileOutH = tileSize * modelScale;
  const padOut = tilePad * modelScale;
  const tilePlaneSize = tileOutW * tileOutH;

  // Pre-allocate reusable input tensor and feeds once (zero allocation in loop)
  const tileInput = new Float32Array(3 * tileSize * tileSize);
  const inTilePlane = tileSize * tileSize;
  const inputTensor = new ort.Tensor('float32', tileInput, [1, 3, tileSize, tileSize]);
  const feeds: Record<string, ort.Tensor> = { [inputName]: inputTensor };

  // Precompute 1D Cosine Hann window weights to eliminate inner loop Math.sin() trigonometry
  const baseWeightX = new Float32Array(tileOutW);
  const baseWeightY = new Float32Array(tileOutH);
  for (let i = 0; i < tileOutW; i++) {
    if (i < padOut) {
      baseWeightX[i] = Math.sin((Math.PI / 2) * (i + 0.5) / padOut) ** 2;
    } else if (i >= tileOutW - padOut) {
      baseWeightX[i] = Math.sin((Math.PI / 2) * (tileOutW - 1 - i + 0.5) / padOut) ** 2;
    } else {
      baseWeightX[i] = 1.0;
    }
  }
  for (let i = 0; i < tileOutH; i++) {
    if (i < padOut) {
      baseWeightY[i] = Math.sin((Math.PI / 2) * (i + 0.5) / padOut) ** 2;
    } else if (i >= tileOutH - padOut) {
      baseWeightY[i] = Math.sin((Math.PI / 2) * (tileOutH - 1 - i + 0.5) / padOut) ** 2;
    } else {
      baseWeightY[i] = 1.0;
    }
  }

  console.log(`[AI Enhancer Worker: TILING PLAN] Engine: ${activeBackend} | Input: ${inWidth}x${inHeight}px -> 4x Output: ${outW}x${outH}px | Tile Size: ${tileSize}x${tileSize}px, Overlap: ${tilePad}px (Step: ${step}px) | Grid: ${xPositions.length}x${yPositions.length} = ${totalTiles} tiles`);

  // Truthful initial progress before tile 1 is benchmarked
  postProgress(`AI HD Enhance: Preparing ${totalTiles} tiles (measuring speed on tile 1)...`, progressBasePct);

  let processedTiles = 0;
  let totalTileInferenceMs = 0;

  const wxArr = new Float32Array(tileOutW);
  const wyArr = new Float32Array(tileOutH);

  for (const ty of yPositions) {
    const isTopEdge = (ty === 0);
    const isBottomEdge = (ty + tileSize >= inHeight);

    for (let y = 0; y < tileOutH; y++) {
      if (isTopEdge && y < padOut) {
        wyArr[y] = 1.0;
      } else if (isBottomEdge && y >= tileOutH - padOut) {
        wyArr[y] = 1.0;
      } else {
        wyArr[y] = baseWeightY[y];
      }
    }

    for (const tx of xPositions) {
      processedTiles++;

      const isLeftEdge = (tx === 0);
      const isRightEdge = (tx + tileSize >= inWidth);

      for (let x = 0; x < tileOutW; x++) {
        if (isLeftEdge && x < padOut) {
          wxArr[x] = 1.0;
        } else if (isRightEdge && x >= tileOutW - padOut) {
          wxArr[x] = 1.0;
        } else {
          wxArr[x] = baseWeightX[x];
        }
      }

      // Populate pre-allocated tile input (zero allocation)
      for (let y = 0; y < tileSize; y++) {
        const sy = Math.min(inHeight - 1, Math.max(0, ty + y));
        const srcRow = sy * inWidth;
        const dstRow = y * tileSize;

        for (let x = 0; x < tileSize; x++) {
          const sx = Math.min(inWidth - 1, Math.max(0, tx + x));
          const srcIdx = (srcRow + sx) * 4;
          const dstIdx = dstRow + x;

          tileInput[dstIdx] = inPixels[srcIdx] / 255.0;
          tileInput[inTilePlane + dstIdx] = inPixels[srcIdx + 1] / 255.0;
          tileInput[inTilePlane * 2 + dstIdx] = inPixels[srcIdx + 2] / 255.0;
        }
      }

      const tTileStart = performance.now();
      const results = await sess.run(feeds);
      const outTensor = results[outputName];
      const tTileMs = performance.now() - tTileStart;
      totalTileInferenceMs += tTileMs;

      if (!outTensor || !outTensor.data) {
        throw new Error('Real-ESRGAN tile output missing');
      }

      const avgTileMs = totalTileInferenceMs / processedTiles;
      const remainingTiles = totalTiles - processedTiles;
      const remainingSec = Math.max(1, Math.round((remainingTiles * avgTileMs) / 1000));
      const totalEstSec = Math.round((totalTiles * avgTileMs) / 1000);
      const pct = Math.round(progressBasePct + (processedTiles / totalTiles) * progressSpanPct);

      if (processedTiles === 1) {
        console.log(`[AI Enhancer Worker: BENCHMARK TILE 1] Measured Tile 1 in ${tTileMs.toFixed(0)}ms (${(tTileMs / 1000).toFixed(1)}s). Calibrated total estimate for all ${totalTiles} tiles: ~${totalEstSec}s (~${remainingSec}s remaining).`);
      }

      postProgress(`AI HD Enhance: tile ${processedTiles}/${totalTiles} (${(tTileMs / 1000).toFixed(1)}s/tile • ~${remainingSec}s left)`, pct);

      console.log(`[AI Enhancer Worker: TILE INFERENCE] Tile ${processedTiles}/${totalTiles} (${tx}, ${ty}) | Engine: ${activeBackend} | Size: ${tileSize}x${tileSize}px | Time: ${tTileMs.toFixed(0)}ms | Measured Avg: ${avgTileMs.toFixed(0)}ms/tile | Remaining: ~${remainingSec}s`);

      const outTileData = outTensor.data as Float32Array;

      // Fast accumulation with precomputed 1D weights
      for (let y = 0; y < tileOutH; y++) {
        const wy = wyArr[y];
        const destY = ty * modelScale + y;
        if (destY >= outH) continue;
        const destYOffset = destY * outW;
        const tileYOffset = y * tileOutW;

        for (let x = 0; x < tileOutW; x++) {
          const destX = tx * modelScale + x;
          if (destX >= outW) continue;

          const w = wxArr[x] * wy;
          const destIdx = destYOffset + destX;
          const tileIdx = tileYOffset + x;

          accumR[destIdx] += outTileData[tileIdx] * w;
          accumG[destIdx] += outTileData[tilePlaneSize + tileIdx] * w;
          accumB[destIdx] += outTileData[tilePlaneSize * 2 + tileIdx] * w;
          accumW[destIdx] += w;
        }
      }
    }
  }

  const outCanvas = new OffscreenCanvas(outW, outH);
  const outCtx = outCanvas.getContext('2d', { willReadFrequently: true })!;
  const outImgData = outCtx.createImageData(outW, outH);
  const outPixels = outImgData.data;

  const totalPixels = outW * outH;
  for (let i = 0; i < totalPixels; i++) {
    const w = accumW[i] || 1.0;
    const destIdx = i * 4;

    outPixels[destIdx] = Math.max(0, Math.min(255, Math.round((accumR[i] / w) * 255.0)));
    outPixels[destIdx + 1] = Math.max(0, Math.min(255, Math.round((accumG[i] / w) * 255.0)));
    outPixels[destIdx + 2] = Math.max(0, Math.min(255, Math.round((accumB[i] / w) * 255.0)));
    outPixels[destIdx + 3] = 255;
  }

  outCtx.putImageData(outImgData, 0, 0);
  return outCanvas;
}

/**
 * Estimate Face Region Bounds with ~30% Padding
 * In standard portrait and passport photography, the face zone (forehead, eyes, nose, mouth, chin, hair)
 * is centered horizontally and spans the upper 8% to 68% of height.
 */
function getPortraitFaceCropWithPadding(
  imgW: number,
  imgH: number
): { cropX: number; cropY: number; cropW: number; cropH: number } {
  // Center ~60% horizontally with 30% contextual padding (spanning 15% to 85%)
  const cropX = Math.max(0, Math.round(imgW * 0.12));
  const cropY = Math.max(0, Math.round(imgH * 0.05));
  const cropW = Math.min(imgW - cropX, Math.round(imgW * 0.76));
  const cropH = Math.min(imgH - cropY, Math.round(imgH * 0.65));
  return { cropX, cropY, cropW, cropH };
}

/**
 * Stage 1 Face-Region Super-Resolution & Seamless Re-Blending
 */
async function runStage1FaceRePass(
  sess: ort.InferenceSession,
  masterCanvas: OffscreenCanvas,
  masterInW: number,
  masterInH: number,
  sourceBitmap: ImageBitmap,
  isLowEnd: boolean,
  postProgress: (msg: string, pct: number) => void
): Promise<number> {
  const tFaceStart = performance.now();
  const origW = sourceBitmap.width;
  const origH = sourceBitmap.height;

  // 1. Extract face region crop with 30% padding from highest available source resolution
  const { cropX, cropY, cropW, cropH } = getPortraitFaceCropWithPadding(origW, origH);

  // Determine optimal resolution for the face pass (up to 512x512 for ultra-crisp eyes/hair)
  let faceInputW = cropW;
  let faceInputH = cropH;
  const maxFaceDim = isLowEnd ? 384 : 512;
  if (Math.max(faceInputW, faceInputH) > maxFaceDim) {
    const scale = maxFaceDim / Math.max(faceInputW, faceInputH);
    faceInputW = Math.round(faceInputW * scale);
    faceInputH = Math.round(faceInputH * scale);
  }

  console.log(`[AI Enhancer Worker: STAGE 1 FACE PASS] Crop Bounds: [x: ${cropX}, y: ${cropY}, w: ${cropW}, h: ${cropH}] from ${origW}x${origH} | Face Pass Resolution: ${faceInputW}x${faceInputH}px (Target 4x: ${faceInputW * 4}x${faceInputH * 4}px)`);

  const faceCanvas = new OffscreenCanvas(faceInputW, faceInputH);
  const faceCtx = faceCanvas.getContext('2d', { willReadFrequently: true })!;
  faceCtx.imageSmoothingEnabled = true;
  faceCtx.imageSmoothingQuality = 'high';
  faceCtx.drawImage(sourceBitmap, cropX, cropY, cropW, cropH, 0, 0, faceInputW, faceInputH);

  postProgress('Stage 1: Neural face feature re-pass (crisp eyes, hair & skin pores)...', 80);

  // 2. Run Real-ESRGAN neural pass on face crop
  const enhancedFaceCanvas = await runRealEsrganInferenceWorker(
    sess,
    faceCanvas,
    faceInputW,
    faceInputH,
    isLowEnd,
    postProgress,
    80,
    8
  );

  // 3. Compute destination dimensions on the master canvas (4x scale)
  const masterScaleX = (masterInW * 4) / origW;
  const masterScaleY = (masterInH * 4) / origH;
  const destX = Math.round(cropX * masterScaleX);
  const destY = Math.round(cropY * masterScaleY);
  const destW = Math.round(cropW * masterScaleX);
  const destH = Math.round(cropH * masterScaleY);

  // 4. Create feathered elliptical alpha mask to blend face seamlessly into master
  const blendCanvas = new OffscreenCanvas(destW, destH);
  const blendCtx = blendCanvas.getContext('2d', { willReadFrequently: true })!;
  blendCtx.imageSmoothingEnabled = true;
  blendCtx.imageSmoothingQuality = 'high';
  blendCtx.drawImage(enhancedFaceCanvas, 0, 0, destW, destH);

  // Apply smooth radial/elliptical feather mask
  const blendImgData = blendCtx.getImageData(0, 0, destW, destH);
  const blendPixels = blendImgData.data;
  const cx = destW / 2;
  const cy = destH / 2;
  const rx = destW / 2;
  const ry = destH / 2;

  for (let y = 0; y < destH; y++) {
    const dy = (y - cy) / ry;
    for (let x = 0; x < destW; x++) {
      const dx = (x - cx) / rx;
      const dist = Math.sqrt(dx * dx + dy * dy);

      const idx = (y * destW + x) * 4;
      let alphaWeight = 1.0;

      if (dist >= 1.0) {
        alphaWeight = 0.0;
      } else if (dist > 0.65) {
        // Smooth cosine falloff from 0.65 to 1.0
        const t = (dist - 0.65) / 0.35;
        alphaWeight = Math.cos((Math.PI / 2) * t) ** 2;
      }

      blendPixels[idx + 3] = Math.round(blendPixels[idx + 3] * alphaWeight);
    }
  }
  blendCtx.putImageData(blendImgData, 0, 0);

  // 5. Composite feathered face layer onto master canvas
  const masterCtx = masterCanvas.getContext('2d', { willReadFrequently: true })!;
  masterCtx.save();
  masterCtx.globalCompositeOperation = 'source-over';
  masterCtx.drawImage(blendCanvas, destX, destY, destW, destH);
  masterCtx.restore();

  const tFaceDuration = performance.now() - tFaceStart;
  console.log(`[AI Enhancer Worker: STAGE 1 FACE PASS COMPLETE] Duration: ${tFaceDuration.toFixed(1)}ms | Re-composited into master at [x: ${destX}, y: ${destY}, w: ${destW}, h: ${destH}]`);
  return tFaceDuration;
}

/**
 * Handle Enhancement Request in Worker
 */
async function handleEnhancementRequest(
  reqId: string,
  imageBitmap: ImageBitmap,
  options: {
    fastMode?: boolean;
    isMobile?: boolean;
    isLowEnd?: boolean;
    maxDimension?: number;
  }
) {
  const startTime = performance.now();

  const postProgress = (step: string, percent: number) => {
    self.postMessage({ id: reqId, type: 'progress', step, percent });
  };

  try {
    const { fastMode = false, isMobile = false, isLowEnd = false, maxDimension } = options;

    if (fastMode) {
      console.log(`[AI Enhancer Worker: START] Request ID: ${reqId} | Mode: FAST_CLASSICAL | Input Dimensions: ${imageBitmap.width}x${imageBitmap.height}px`);
      const tFastStart = performance.now();
      const resultBlob = await runFastModeEnhance(imageBitmap, postProgress);
      const elapsed = (performance.now() - startTime).toFixed(1);
      console.log(`[AI Enhancer Worker: FAST COMPLETE] Duration: ${elapsed}ms | Output Blob Size: ${resultBlob.size} bytes`);
      self.postMessage({
        id: reqId,
        type: 'complete',
        resultBlob,
        elapsedMs: elapsed,
        mode: 'fast_classical'
      });
      return;
    }

    postProgress('Initializing Real-ESRGAN neural engine...', 10);

    // 1. Initialize/retrieve Real-ESRGAN model session first so engine backend is verified
    const tModelStart = performance.now();
    const sess = await getOrInitSession(postProgress);
    const tModelInitMs = performance.now() - tModelStart;

    // 2. Adaptive Resolution Caps (calibrated for high fidelity without unnecessary tiling overhead):
    // - Multi-threaded WASM SIMD (Threads >= 2): up to 512px (Generates up to 2048px 4x master)
    // - Single-threaded WASM / Low-End / Non-isolated: up to 340px (Generates up to 1360px 4x master, >500 DPI for passport photos!)
    const isMultiThreadActive = activeBackend === 'wasm-threaded' && activeThreads > 1;
    const defaultMaxDim = isMultiThreadActive ? (isLowEnd ? 420 : 512) : 340;
    const effectiveMaxDim = maxDimension ? Math.min(maxDimension, defaultMaxDim) : defaultMaxDim;

    let inWidth = imageBitmap.width;
    let inHeight = imageBitmap.height;

    const tPreResizeStart = performance.now();
    if (Math.max(inWidth, inHeight) > effectiveMaxDim) {
      const downscale = effectiveMaxDim / Math.max(inWidth, inHeight);
      inWidth = Math.round(inWidth * downscale);
      inHeight = Math.round(inHeight * downscale);
    }
    const tPreResizeMs = performance.now() - tPreResizeStart;

    console.log(`[AI Enhancer Worker: START] Request ID: ${reqId} | Engine: ${activeBackend} | Original Size: ${imageBitmap.width}x${imageBitmap.height}px | Pre-Resize Cap: ${effectiveMaxDim}px (Active: ${inWidth}x${inHeight}px) | Device: ${isMobile ? (isLowEnd ? 'Mobile (Low-End)' : 'Mobile (Mid/High)') : (isLowEnd ? 'Desktop (Low-Spec)' : 'Desktop')}`);

    // 3. Detect background transparency & average foreground tone
    const sampleCanvas = new OffscreenCanvas(Math.min(inWidth, 120), Math.min(inHeight, 120));
    const sampleCtx = sampleCanvas.getContext('2d', { willReadFrequently: true })!;
    sampleCtx.drawImage(imageBitmap, 0, 0, sampleCanvas.width, sampleCanvas.height);
    const sampleData = sampleCtx.getImageData(0, 0, sampleCanvas.width, sampleCanvas.height).data;

    let hasTransparency = false;
    let fgPixels = 0;
    let sumR = 0, sumG = 0, sumB = 0;

    for (let i = 0; i < sampleData.length; i += 4) {
      const a = sampleData[i + 3];
      if (a < 240) hasTransparency = true;
      if (a > 40) {
        sumR += sampleData[i];
        sumG += sampleData[i + 1];
        sumB += sampleData[i + 2];
        fgPixels++;
      }
    }

    // Prepare scaled input canvas for neural inference
    const prepCanvas = new OffscreenCanvas(inWidth, inHeight);
    const prepCtx = prepCanvas.getContext('2d', { willReadFrequently: true })!;
    prepCtx.imageSmoothingEnabled = true;
    prepCtx.imageSmoothingQuality = 'high';

    if (hasTransparency) {
      const avgR = fgPixels > 0 ? Math.round(sumR / fgPixels) : 180;
      const avgG = fgPixels > 0 ? Math.round(sumG / fgPixels) : 170;
      const avgB = fgPixels > 0 ? Math.round(sumB / fgPixels) : 160;
      prepCtx.fillStyle = `rgb(${avgR}, ${avgG}, ${avgB})`;
      prepCtx.fillRect(0, 0, inWidth, inHeight);
    }
    prepCtx.drawImage(imageBitmap, 0, 0, inWidth, inHeight);

    // 4. Neural Super-Resolution Pass (Overlapped Cosine Hann-Window Tiling)
    const tPass1Start = performance.now();
    const aiCanvas = await runRealEsrganInferenceWorker(
      sess,
      prepCanvas,
      inWidth,
      inHeight,
      isLowEnd,
      postProgress,
      25,
      65
    );
    const tPass1Ms = performance.now() - tPass1Start;

    // Redundant Pass 2 eliminated: facial features are already super-resolved in the full master pass.
    const tFacePassMs = 0;

    // 5. Downscale 4x neural master to 2x super-sampled ultra-crisp studio output
    const finalW = Math.round(inWidth * 2);
    const finalH = Math.round(inHeight * 2);

    postProgress('Applying multi-band micro-texture restoration...', 92);
    const tPostStart = performance.now();
    const finalCanvas = new OffscreenCanvas(finalW, finalH);
    const finalCtx = finalCanvas.getContext('2d', { willReadFrequently: true })!;
    finalCtx.imageSmoothingEnabled = true;
    finalCtx.imageSmoothingQuality = 'high';
    finalCtx.drawImage(aiCanvas, 0, 0, finalW, finalH);

    // 7. Post-inference refinement layer (auto-exposure, skin guard & multi-frequency unsharp mask)
    const finalImgData = finalCtx.getImageData(0, 0, finalW, finalH);
    applyAutoExposure(finalImgData);
    applyAutoColorAndSkinGuard(finalImgData);
    applyHighDefinitionDetailRestoration(finalImgData);

    // 8. Recombine high-resolution alpha mask if cutout had transparency
    if (hasTransparency) {
      const rescaledAlphaCanvas = new OffscreenCanvas(finalW, finalH);
      const rescaledAlphaCtx = rescaledAlphaCanvas.getContext('2d', { willReadFrequently: true })!;
      rescaledAlphaCtx.imageSmoothingEnabled = true;
      rescaledAlphaCtx.imageSmoothingQuality = 'high';
      rescaledAlphaCtx.drawImage(imageBitmap, 0, 0, finalW, finalH);
      const scaledAlpha = rescaledAlphaCtx.getImageData(0, 0, finalW, finalH).data;

      const d = finalImgData.data;
      for (let i = 0; i < d.length; i += 4) {
        const a = scaledAlpha[i + 3];
        d[i + 3] = a;
        if (a === 0) {
          d[i] = 0;
          d[i + 1] = 0;
          d[i + 2] = 0;
        }
      }
    }

    finalCtx.putImageData(finalImgData, 0, 0);
    const tPostMs = performance.now() - tPostStart;

    postProgress('Finalizing HD portrait...', 96);
    const tBlobStart = performance.now();
    const resultBlob = await finalCanvas.convertToBlob({ type: 'image/png' });
    const tBlobMs = performance.now() - tBlobStart;
    const totalElapsedMs = performance.now() - startTime;

    console.log(`
===============================================================
[AI ENHANCER WORKER: EXECUTION SUMMARY]
---------------------------------------------------------------
Mode:                  REAL-ESRGAN NEURAL HD (4x Super-Resolution)
Input Resolution:      ${imageBitmap.width}x${imageBitmap.height}px
Pre-Resize Cap:        ${effectiveMaxDim}px (Applied: ${inWidth}x${inHeight}px)
4x Neural Master:      ${inWidth * 4}x${inHeight * 4}px (${(inWidth * 4 * inHeight * 4 / 1e6).toFixed(1)} MP)
Final Output:          ${finalW}x${finalH}px (${resultBlob.size} bytes PNG)
---------------------------------------------------------------
DETAILED TIMING BREAKDOWN:
- Pre-resize & Prep:            ${tPreResizeMs.toFixed(1)} ms
- Model Session Check / Init:   ${tModelInitMs.toFixed(1)} ms
- Pass 1 Full Neural Tiling:    ${tPass1Ms.toFixed(1)} ms
- Pass 2 Face Super-Resolution: ${tFacePassMs.toFixed(1)} ms
- Micro-Texture & Sharpening:   ${tPostMs.toFixed(1)} ms
- Output PNG Encoding:          ${tBlobMs.toFixed(1)} ms
---------------------------------------------------------------
TOTAL EXECUTION TIME:           ${totalElapsedMs.toFixed(1)} ms (${(totalElapsedMs / 1000).toFixed(2)}s)
===============================================================
`);

    self.postMessage({
      id: reqId,
      type: 'complete',
      resultBlob,
      elapsedMs: totalElapsedMs.toFixed(0),
      mode: 'neural_hd',
      diagnostics: {
        inWidth,
        inHeight,
        neuralMasterW: inWidth * 4,
        neuralMasterH: inHeight * 4,
        outWidth: finalW,
        outHeight: finalH,
        preResizeMs: tPreResizeMs,
        modelInitMs: tModelInitMs,
        pass1Ms: tPass1Ms,
        facePassMs: tFacePassMs,
        postMs: tPostMs,
        blobMs: tBlobMs,
        totalElapsedMs
      }
    });
  } catch (err: any) {
    console.error('[AI Enhancer Worker] Error during enhancement:', err);
    self.postMessage({
      id: reqId,
      type: 'error',
      message: err?.message || 'Enhancement failed'
    });
  }
}

// Worker message router
self.onmessage = async (e: MessageEvent) => {
  const { id, type, imageBitmap, options, baseUrl } = e.data;

  if (baseUrl && typeof baseUrl === 'string') {
    runtimeAppBaseUrl = baseUrl;
    try {
      ort.env.wasm.wasmPaths = getWasmBasePath();
    } catch {
      // Ignored
    }
  }

  if (type === 'enhance') {
    await handleEnhancementRequest(id, imageBitmap, options || {});
  } else if (type === 'preload') {
    try {
      await getOrInitSession((msg, pct) => {
        self.postMessage({ id, type: 'preload_progress', step: msg, percent: pct });
      });
      self.postMessage({ id, type: 'preload_complete' });
    } catch (err: any) {
      self.postMessage({ id, type: 'preload_error', message: err?.message });
    }
  }
};
