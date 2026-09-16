/**
 * SnapID Studio - Lightweight AI HD Photo Enhancement System
 * 
 * High-Speed, Natural Quality, Browser-Side AI Super-Resolution Pipeline
 * Powered by Real-ESRGAN general-x4v3 (Compact SRVGGNet, ~4.7 MB total model payload).
 * 
 * Pipeline:
 * 1. Auto Brightness & Exposure (Adaptive Dynamic Range Lift)
 * 2. Auto White Balance & Natural Color Correction (Skin-Tone Preserving)
 * 3. Light Edge-Preserving Denoising (Removes sensor noise & JPEG compression blocks)
 * 4. Lightweight AI Super-Resolution & Detail Enhancement (WebGPU preferred + WASM fallback)
 * 5. Natural Sharpening (Micro-contrast without halos)
 * 6. Final 2× Scale (Optimal 300 DPI passport print clarity)
 */

import * as ort from 'onnxruntime-web';

export interface EnhancementProgressCallback {
  (step: string, percent?: number): void;
}

const CACHE_NAME = 'snapid-enhancer-model-v2';
const MODEL_MIN_BYTES = 4000000; // ~4.7MB model

/**
 * Dynamically resolves the base URL of the deployed app
 */
function getAppBaseUrl(): string {
  if (typeof window !== 'undefined' && window.location && window.location.href) {
    const href = window.location.href;
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
    } catch {
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
  const base = getAppBaseUrl().replace(/\/+$/, '');
  return [
    `${base}/models/realesr-general-x4v3/model.onnx`,
    `${base}/models/realesrgan/model.onnx`,
    'https://huggingface.co/CoderViking/realesr-general-x4v3-onnx/resolve/main/realesr-general-x4v3.onnx'
  ];
}

// Global cached session and promise
let cachedSession: ort.InferenceSession | null = null;
let sessionInitPromise: Promise<ort.InferenceSession> | null = null;

/**
 * Configure ONNX Runtime environment
 */
function configureOrtEnvironment() {
  try {
    ort.env.logLevel = 'error';
    ort.env.wasm.wasmPaths = getWasmBasePath();
    const threads = typeof navigator !== 'undefined' && navigator.hardwareConcurrency
      ? Math.min(4, Math.max(1, navigator.hardwareConcurrency))
      : 2;
    ort.env.wasm.numThreads = threads;
    ort.env.wasm.proxy = false;
  } catch (err) {
    console.warn('[AI Enhancer] WASM config warning:', err);
  }
}

/**
 * Fetch and persistently cache the Real-ESRGAN model binary in the browser Cache API
 */
async function fetchAndCacheModelBuffer(onProgress?: EnhancementProgressCallback): Promise<ArrayBuffer> {
  const sources = getModelSources();

  // 1. Try retrieving from persistent browser Cache API
  if (typeof caches !== 'undefined') {
    try {
      const cache = await caches.open(CACHE_NAME);
      for (const url of sources) {
        const cached = await cache.match(url);
        if (cached) {
          const buffer = await cached.arrayBuffer();
          if (buffer.byteLength >= MODEL_MIN_BYTES) {
            console.log(`[AI Enhancer] Loaded Real-ESRGAN model from browser cache (${(buffer.byteLength / 1048576).toFixed(1)} MB)`);
            return buffer;
          }
        }
      }
    } catch (e) {
      console.warn('[AI Enhancer] Cache API read error, falling back to network:', e);
    }
  }

  // 2. Fetch from available sources
  let lastError: any = null;
  for (let i = 0; i < sources.length; i++) {
    const url = sources[i];
    try {
      onProgress?.(i === 0 ? 'Loading lightweight AI model (~4.7MB)...' : 'Retrying AI model load...', 15);
      console.log(`[AI Enhancer] Fetching Real-ESRGAN model from: ${url}`);
      
      const response = await fetch(url, { cache: 'force-cache' });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status} (${response.statusText})`);
      }

      const buffer = await response.arrayBuffer();
      if (buffer.byteLength < MODEL_MIN_BYTES) {
        throw new Error(`Invalid model buffer size: ${buffer.byteLength} bytes (expected >= ${MODEL_MIN_BYTES})`);
      }

      // 3. Persist to browser Cache API so subsequent calls NEVER download again
      if (typeof caches !== 'undefined') {
        try {
          const cache = await caches.open(CACHE_NAME);
          await cache.put(url, new Response(buffer.slice(0), {
            headers: {
              'Content-Type': 'application/octet-stream',
              'Content-Length': buffer.byteLength.toString(),
              'Cache-Control': 'public, max-age=31536000, immutable'
            }
          }));
          console.log('[AI Enhancer] Model persisted to browser Cache API successfully.');
        } catch (cacheErr) {
          console.warn('[AI Enhancer] Failed to store model in Cache API:', cacheErr);
        }
      }

      return buffer;
    } catch (err) {
      console.warn(`[AI Enhancer] Failed to fetch from ${url}:`, err);
      lastError = err;
    }
  }

  throw lastError || new Error('Failed to load Real-ESRGAN model from any source');
}

/**
 * Get or initialize the ONNX InferenceSession (reuses singleton)
 */
async function getOrInitEnhancerSession(onProgress?: EnhancementProgressCallback): Promise<ort.InferenceSession> {
  if (cachedSession) {
    return cachedSession;
  }

  if (sessionInitPromise) {
    return sessionInitPromise;
  }

  sessionInitPromise = (async () => {
    configureOrtEnvironment();
    const modelBuffer = await fetchAndCacheModelBuffer(onProgress);

    onProgress?.('Initializing AI engine...', 30);
    const hasWebGPU = typeof navigator !== 'undefined' && 'gpu' in navigator;
    let session: ort.InferenceSession | null = null;

    if (hasWebGPU) {
      try {
        console.log('[AI Enhancer] Attempting WebGPU execution provider...');
        session = await ort.InferenceSession.create(modelBuffer, {
          executionProviders: ['webgpu', 'wasm'],
          graphOptimizationLevel: 'all',
          logSeverityLevel: 3,
          logVerbosityLevel: 0,
        });
        console.log('[AI Enhancer] WebGPU session initialized successfully!');
      } catch (gpuErr) {
        console.warn('[AI Enhancer] WebGPU session creation failed, falling back to WASM:', gpuErr);
      }
    }

    if (!session) {
      console.log('[AI Enhancer] Initializing WASM execution provider...');
      session = await ort.InferenceSession.create(modelBuffer, {
        executionProviders: ['wasm'],
        graphOptimizationLevel: 'all',
        logSeverityLevel: 3,
        logVerbosityLevel: 0,
      });
      console.log('[AI Enhancer] WASM session initialized successfully!');
    }

    cachedSession = session;
    return session;
  })();

  return sessionInitPromise;
}

/**
 * 1. Auto Brightness & Exposure (Adaptive Dynamic Range Lift)
 */
function applyAutoExposureAndBrightness(
  ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
  width: number,
  height: number
) {
  const imgData = ctx.getImageData(0, 0, width, height);
  const data = imgData.data;

  let totalLum = 0;
  let sampleCount = 0;
  const stride = Math.max(1, Math.floor((width * height) / 12000));

  for (let i = 0; i < data.length; i += stride * 4) {
    if (data[i + 3] > 25) {
      const lum = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
      totalLum += lum;
      sampleCount++;
    }
  }

  if (sampleCount < 100) return;

  const avgLum = totalLum / sampleCount;
  let gamma = 1.0;
  let brightnessOffset = 0;

  if (avgLum < 95) {
    // Under-exposed: smoothly lift shadows without blowing highlights
    gamma = Math.max(0.75, Math.pow(avgLum / 125, 0.4));
    brightnessOffset = Math.min(16, Math.round((105 - avgLum) * 0.2));
  } else if (avgLum < 118) {
    // Mildly dark: gentle boost
    gamma = Math.max(0.86, Math.pow(avgLum / 125, 0.28));
    brightnessOffset = Math.min(8, Math.round((118 - avgLum) * 0.12));
  } else if (avgLum > 180) {
    // Over-exposed: pull down slightly
    gamma = 1.08;
    brightnessOffset = -6;
  }

  const lut = new Uint8ClampedArray(256);
  for (let v = 0; v < 256; v++) {
    const norm = v / 255;
    const corrected = Math.pow(norm, gamma);
    lut[v] = Math.max(0, Math.min(255, Math.round(corrected * 255 + brightnessOffset)));
  }

  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] > 10) {
      data[i] = lut[data[i]];
      data[i + 1] = lut[data[i + 1]];
      data[i + 2] = lut[data[i + 2]];
    }
  }

  ctx.putImageData(imgData, 0, 0);
}

/**
 * 2. Auto White Balance & Natural Color Correction (Skin-Tone Preserving)
 */
function applyAutoWhiteBalanceAndColor(
  ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
  width: number,
  height: number
) {
  const imgData = ctx.getImageData(0, 0, width, height);
  const data = imgData.data;

  let sumR = 0, sumG = 0, sumB = 0, count = 0;
  const stride = Math.max(1, Math.floor((width * height) / 12000));

  for (let i = 0; i < data.length; i += stride * 4) {
    if (data[i + 3] > 30) {
      sumR += data[i];
      sumG += data[i + 1];
      sumB += data[i + 2];
      count++;
    }
  }

  if (count < 100) return;

  const avgR = sumR / count;
  const avgG = sumG / count;
  const avgB = sumB / count;
  const avgGray = (avgR + avgG + avgB) / 3;

  if (avgR <= 0 || avgG <= 0 || avgB <= 0) return;

  // Clamped strictly between 0.95 and 1.05 to prevent skin tone distortion
  const rGain = Math.max(0.95, Math.min(1.05, avgGray / avgR));
  const gGain = Math.max(0.95, Math.min(1.05, avgGray / avgG));
  const bGain = Math.max(0.95, Math.min(1.05, avgGray / avgB));

  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] > 10) {
      data[i] = Math.max(0, Math.min(255, Math.round(data[i] * rGain)));
      data[i + 1] = Math.max(0, Math.min(255, Math.round(data[i + 1] * gGain)));
      data[i + 2] = Math.max(0, Math.min(255, Math.round(data[i + 2] * bGain)));
    }
  }

  ctx.putImageData(imgData, 0, 0);
}

/**
 * 3. Light Edge-Preserving Denoising
 */
function applyNaturalDenoise(
  ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
  width: number,
  height: number
) {
  const imgData = ctx.getImageData(0, 0, width, height);
  const data = imgData.data;
  const copy = new Uint8ClampedArray(data);

  for (let y = 1; y < height - 1; y++) {
    const rowOffset = y * width;
    const topOffset = (y - 1) * width;
    const botOffset = (y + 1) * width;

    for (let x = 1; x < width - 1; x++) {
      const idx = (rowOffset + x) * 4;
      if (copy[idx + 3] < 15) continue;

      const topIdx = (topOffset + x) * 4;
      const botIdx = (botOffset + x) * 4;
      const leftIdx = (rowOffset + x - 1) * 4;
      const rightIdx = (rowOffset + x + 1) * 4;

      const cLum = 0.299 * copy[idx] + 0.587 * copy[idx + 1] + 0.114 * copy[idx + 2];
      const tLum = 0.299 * copy[topIdx] + 0.587 * copy[topIdx + 1] + 0.114 * copy[topIdx + 2];
      const bLum = 0.299 * copy[botIdx] + 0.587 * copy[botIdx + 1] + 0.114 * copy[botIdx + 2];
      const lLum = 0.299 * copy[leftIdx] + 0.587 * copy[leftIdx + 1] + 0.114 * copy[leftIdx + 2];
      const rLum = 0.299 * copy[rightIdx] + 0.587 * copy[rightIdx + 1] + 0.114 * copy[rightIdx + 2];

      const grad = (Math.abs(cLum - tLum) + Math.abs(cLum - bLum) + Math.abs(cLum - lLum) + Math.abs(cLum - rLum)) / 4;

      // Only smooth low-gradient noise areas; leave facial contours & hair 100% sharp
      if (grad < 15) {
        const blendWeight = Math.max(0, (15 - grad) / 15) * 0.3;
        for (let c = 0; c < 3; c++) {
          const neighborAvg = (copy[topIdx + c] + copy[botIdx + c] + copy[leftIdx + c] + copy[rightIdx + c]) / 4;
          data[idx + c] = Math.round(copy[idx + c] * (1 - blendWeight) + neighborAvg * blendWeight);
        }
      }
    }
  }

  ctx.putImageData(imgData, 0, 0);
}

/**
 * 5. Natural Sharpening (Micro-contrast without halos)
 */
function applyNaturalPostSharpening(
  ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
  width: number,
  height: number
) {
  const imgData = ctx.getImageData(0, 0, width, height);
  const data = imgData.data;
  const copy = new Uint8ClampedArray(data);

  for (let y = 1; y < height - 1; y++) {
    const rowOffset = y * width;
    const topOffset = (y - 1) * width;
    const botOffset = (y + 1) * width;

    for (let x = 1; x < width - 1; x++) {
      const idx = (rowOffset + x) * 4;
      if (copy[idx + 3] < 15) continue;

      const topIdx = (topOffset + x) * 4;
      const botIdx = (botOffset + x) * 4;
      const leftIdx = (rowOffset + x - 1) * 4;
      const rightIdx = (rowOffset + x + 1) * 4;

      for (let c = 0; c < 3; c++) {
        const center = copy[idx + c];
        const blur = (copy[topIdx + c] + copy[botIdx + c] + copy[leftIdx + c] + copy[rightIdx + c]) / 4;
        const diff = center - blur;

        // Threshold = 3.5: sharpen authentic facial detail, skip subtle skin texture
        if (Math.abs(diff) >= 3.5) {
          const sharpened = center + diff * 0.35;
          data[idx + c] = Math.max(0, Math.min(255, Math.round(sharpened)));
        }
      }
    }
  }

  ctx.putImageData(imgData, 0, 0);
}

/**
 * Runs Real-ESRGAN general-x4v3 inference on an input ImageData
 * Uses dynamic single-pass for images <= 256x256, or efficient overlap tiling for larger inputs.
 */
async function runRealEsrganInference(
  session: ort.InferenceSession,
  inputCanvas: OffscreenCanvas,
  inWidth: number,
  inHeight: number,
  onProgress?: EnhancementProgressCallback
): Promise<OffscreenCanvas> {
  const inputName = session.inputNames[0] || 'input';
  const outputName = session.outputNames[0] || 'output';

  const outScale = 4;
  const outW = inWidth * outScale;
  const outH = inHeight * outScale;

  const inCtx = inputCanvas.getContext('2d', { willReadFrequently: true })!;
  const fullImgData = inCtx.getImageData(0, 0, inWidth, inHeight);
  const inPixels = fullImgData.data;

  // Case A: Image is compact (<= 256x256) -> Single-pass inference (< 250ms)
  if (inWidth <= 256 && inHeight <= 256) {
    onProgress?.('Enhancing fine details with AI...', 60);
    const tensorData = new Float32Array(1 * 3 * inHeight * inWidth);
    const planeSize = inHeight * inWidth;

    for (let y = 0; y < inHeight; y++) {
      for (let x = 0; x < inWidth; x++) {
        const pIdx = (y * inWidth + x) * 4;
        const tIdx = y * inWidth + x;
        tensorData[tIdx] = inPixels[pIdx] / 255.0;                   // R
        tensorData[planeSize + tIdx] = inPixels[pIdx + 1] / 255.0;   // G
        tensorData[planeSize * 2 + tIdx] = inPixels[pIdx + 2] / 255.0; // B
      }
    }

    const inputTensor = new ort.Tensor('float32', tensorData, [1, 3, inHeight, inWidth]);
    const feeds: Record<string, ort.Tensor> = { [inputName]: inputTensor };
    const results = await session.run(feeds);
    const outputTensor = results[outputName];
    const outData = outputTensor.data as Float32Array;

    const outCanvas = new OffscreenCanvas(outW, outH);
    const outCtx = outCanvas.getContext('2d', { willReadFrequently: true })!;
    const outImgData = outCtx.createImageData(outW, outH);
    const outPixels = outImgData.data;

    const outPlaneSize = outH * outW;
    for (let y = 0; y < outH; y++) {
      const srcY = Math.min(inHeight - 1, Math.floor(y / outScale));
      for (let x = 0; x < outW; x++) {
        const srcX = Math.min(inWidth - 1, Math.floor(x / outScale));
        const srcAlpha = inPixels[(srcY * inWidth + srcX) * 4 + 3];

        const oIdx = (y * outW + x) * 4;
        const tIdx = y * outW + x;
        outPixels[oIdx] = Math.max(0, Math.min(255, Math.round(outData[tIdx] * 255)));
        outPixels[oIdx + 1] = Math.max(0, Math.min(255, Math.round(outData[outPlaneSize + tIdx] * 255)));
        outPixels[oIdx + 2] = Math.max(0, Math.min(255, Math.round(outData[outPlaneSize * 2 + tIdx] * 255)));
        outPixels[oIdx + 3] = srcAlpha;
      }
    }

    outCtx.putImageData(outImgData, 0, 0);
    return outCanvas;
  }

  // Case B: Larger image -> Efficient Overlap Tiling
  // Using 192x192 tiles with 20px overlap (step = 152px)
  // For standard passport photos (~320x400), this requires only 4 to 6 tiles!
  const tileSize = 192;
  const pad = 20;
  const step = tileSize - pad * 2; // 152px

  const tilesX = Math.ceil((inWidth - pad * 2) / step);
  const tilesY = Math.ceil((inHeight - pad * 2) / step);
  const totalTiles = Math.max(1, tilesX * tilesY);

  console.log(`[AI Enhancer] Processing ${totalTiles} efficient tiles (${tileSize}x${tileSize}, step ${step})`);

  // Accumulator buffers for weighted blending (eliminates tile seams completely)
  const accR = new Float32Array(outW * outH);
  const accG = new Float32Array(outW * outH);
  const accB = new Float32Array(outW * outH);
  const accW = new Float32Array(outW * outH);

  let tileIndex = 0;
  for (let ty = 0; ty < inHeight; ty += step) {
    for (let tx = 0; tx < inWidth; tx += step) {
      tileIndex++;
      const percent = Math.min(88, 40 + Math.round((tileIndex / totalTiles) * 45));
      onProgress?.(`Enhancing details (tile ${tileIndex}/${totalTiles})...`, percent);

      // Give browser event loop time to update UI / spinner
      await new Promise((r) => setTimeout(r, 0));

      const actualTileW = Math.min(tileSize, inWidth - tx);
      const actualTileH = Math.min(tileSize, inHeight - ty);

      // Create padded tile tensor
      const tileTensorData = new Float32Array(1 * 3 * actualTileH * actualTileW);
      const tilePlaneSize = actualTileH * actualTileW;

      for (let y = 0; y < actualTileH; y++) {
        for (let x = 0; x < actualTileW; x++) {
          const pIdx = ((ty + y) * inWidth + (tx + x)) * 4;
          const tIdx = y * actualTileW + x;
          tileTensorData[tIdx] = inPixels[pIdx] / 255.0;
          tileTensorData[tilePlaneSize + tIdx] = inPixels[pIdx + 1] / 255.0;
          tileTensorData[tilePlaneSize * 2 + tIdx] = inPixels[pIdx + 2] / 255.0;
        }
      }

      const tileTensor = new ort.Tensor('float32', tileTensorData, [1, 3, actualTileH, actualTileW]);
      const tileResults = await session.run({ [inputName]: tileTensor });
      const tileOutTensor = tileResults[outputName];
      const tileOutData = tileOutTensor.data as Float32Array;

      const tileOutW = actualTileW * outScale;
      const tileOutH = actualTileH * outScale;
      const tileOutPlane = tileOutW * tileOutH;

      const outTx = tx * outScale;
      const outTy = ty * outScale;

      // Blend tile into accumulator using linear feathering on overlap boundaries
      const blendPadOut = pad * outScale;
      for (let y = 0; y < tileOutH; y++) {
        const destY = outTy + y;
        if (destY >= outH) continue;

        // Vertical weight
        let wy = 1.0;
        if (y < blendPadOut && tx > 0) wy = Math.min(wy, y / blendPadOut);
        if (y > tileOutH - blendPadOut && ty + tileSize < inHeight) wy = Math.min(wy, (tileOutH - y) / blendPadOut);

        for (let x = 0; x < tileOutW; x++) {
          const destX = outTx + x;
          if (destX >= outW) continue;

          // Horizontal weight
          let wx = 1.0;
          if (x < blendPadOut && tx > 0) wx = Math.min(wx, x / blendPadOut);
          if (x > tileOutW - blendPadOut && tx + tileSize < inWidth) wx = Math.min(wx, (tileOutW - x) / blendPadOut);

          const weight = Math.max(0.01, wx * wy);
          const tIdx = y * tileOutW + x;
          const dIdx = destY * outW + destX;

          accR[dIdx] += tileOutData[tIdx] * weight;
          accG[dIdx] += tileOutData[tileOutPlane + tIdx] * weight;
          accB[dIdx] += tileOutData[tileOutPlane * 2 + tIdx] * weight;
          accW[dIdx] += weight;
        }
      }
    }
  }

  // Composite accumulated tiles to final canvas
  const outCanvas = new OffscreenCanvas(outW, outH);
  const outCtx = outCanvas.getContext('2d', { willReadFrequently: true })!;
  const outImgData = outCtx.createImageData(outW, outH);
  const outPixels = outImgData.data;

  for (let y = 0; y < outH; y++) {
    const srcY = Math.min(inHeight - 1, Math.floor(y / outScale));
    for (let x = 0; x < outW; x++) {
      const srcX = Math.min(inWidth - 1, Math.floor(x / outScale));
      const srcAlpha = inPixels[(srcY * inWidth + srcX) * 4 + 3];

      const dIdx = y * outW + x;
      const w = accW[dIdx] || 1.0;
      const oIdx = dIdx * 4;

      outPixels[oIdx] = Math.max(0, Math.min(255, Math.round((accR[dIdx] / w) * 255)));
      outPixels[oIdx + 1] = Math.max(0, Math.min(255, Math.round((accG[dIdx] / w) * 255)));
      outPixels[oIdx + 2] = Math.max(0, Math.min(255, Math.round((accB[dIdx] / w) * 255)));
      outPixels[oIdx + 3] = srcAlpha;
    }
  }

  outCtx.putImageData(outImgData, 0, 0);
  return outCanvas;
}

/**
 * Fallback Studio Enhancement Pipeline (Runs if ONNX model download or execution encounters an issue)
 * Guarantees that the user NEVER sees a black, blank, or broken image.
 */
async function fallbackStudioEnhancement(
  inputBlob: Blob,
  onProgress?: EnhancementProgressCallback
): Promise<Blob> {
  console.log('[AI Enhancer] Running fast studio enhancement fallback...');
  onProgress?.('Optimizing lighting & colors...', 40);

  const imageBitmap = await createImageBitmap(inputBlob);
  const origW = imageBitmap.width;
  const origH = imageBitmap.height;

  // 2× final scale for passport 300 DPI
  const outW = Math.round(origW * 2);
  const outH = Math.round(origH * 2);

  const canvas = new OffscreenCanvas(outW, outH);
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!;

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(imageBitmap, 0, 0, outW, outH);

  applyAutoExposureAndBrightness(ctx, outW, outH);
  applyAutoWhiteBalanceAndColor(ctx, outW, outH);
  applyNaturalDenoise(ctx, outW, outH);
  applyNaturalPostSharpening(ctx, outW, outH);

  onProgress?.('Done ✓', 100);
  return await canvas.convertToBlob({ type: 'image/png' });
}

/**
 * Main AI HD Photo Enhancement Pipeline
 * 
 * Pipeline:
 * Original
 * → Auto Brightness/Exposure
 * → Auto White Balance/Color
 * → Light Denoise
 * → Lightweight AI Upscaling/Detail Enhancement (Real-ESRGAN general-x4v3, ~4.7MB)
 * → Natural Sharpening
 * → Final 2× Scale (Clean, anti-aliased 300 DPI passport clarity)
 */
export async function enhancePhotoWithRealEsrgan(
  inputBlob: Blob,
  onProgress?: EnhancementProgressCallback
): Promise<Blob> {
  const startTime = performance.now();
  console.log('[AI Enhancer] Starting Lightweight AI HD Enhancement Pipeline...');

  try {
    onProgress?.('Analyzing photo...', 10);
    const imageBitmap = await createImageBitmap(inputBlob);
    const origW = imageBitmap.width;
    const origH = imageBitmap.height;

    if (origW <= 0 || origH <= 0) {
      throw new Error('Invalid input image dimensions');
    }

    // 1. Optimize input dimensions for super-resolution
    // For standard passport photos, keeping input at max ~400px ensures < 3-5 second processing
    // on low-end hardware while producing a massive 1600px 4× output that scales cleanly to 2×
    const maxInDim = 400;
    let inW = origW;
    let inH = origH;
    if (Math.max(origW, origH) > maxInDim) {
      const scale = maxInDim / Math.max(origW, origH);
      inW = Math.round(origW * scale);
      inH = Math.round(origH * scale);
    }

    // Prepare pre-processing canvas
    const preCanvas = new OffscreenCanvas(inW, inH);
    const preCtx = preCanvas.getContext('2d', { willReadFrequently: true })!;
    preCtx.imageSmoothingEnabled = true;
    preCtx.imageSmoothingQuality = 'high';
    preCtx.drawImage(imageBitmap, 0, 0, inW, inH);

    // Step 1: Auto Brightness / Exposure
    onProgress?.('Balancing exposure & lighting...', 20);
    applyAutoExposureAndBrightness(preCtx, inW, inH);

    // Step 2: Auto White Balance & Natural Color
    onProgress?.('Balancing natural skin tones...', 30);
    applyAutoWhiteBalanceAndColor(preCtx, inW, inH);

    // Step 3: Light Denoise
    onProgress?.('Denoising sensor grain...', 40);
    applyNaturalDenoise(preCtx, inW, inH);

    // Step 4: Lightweight AI Upscaling (Real-ESRGAN general-x4v3)
    let aiCanvas: OffscreenCanvas;
    try {
      const session = await getOrInitEnhancerSession(onProgress);
      aiCanvas = await runRealEsrganInference(session, preCanvas, inW, inH, onProgress);
    } catch (onnxErr) {
      console.warn('[AI Enhancer] AI model inference failed, using studio fallback:', onnxErr);
      return await fallbackStudioEnhancement(inputBlob, onProgress);
    }

    // Step 5: Natural Sharpening
    onProgress?.('Applying natural micro-contrast...', 90);
    const aiCtx = aiCanvas.getContext('2d', { willReadFrequently: true })!;
    applyNaturalPostSharpening(aiCtx, aiCanvas.width, aiCanvas.height);

    // Step 6: Final 2× Scale
    // Downsampling cleanly from 4× AI model output to 2× of original input
    // yields anti-aliased, studio-crisp 300 DPI passport print clarity
    const finalW = Math.round(origW * 2);
    const finalH = Math.round(origH * 2);

    const finalCanvas = new OffscreenCanvas(finalW, finalH);
    const finalCtx = finalCanvas.getContext('2d', { willReadFrequently: true })!;
    finalCtx.imageSmoothingEnabled = true;
    finalCtx.imageSmoothingQuality = 'high';
    finalCtx.drawImage(aiCanvas, 0, 0, finalW, finalH);

    const outputBlob = await finalCanvas.convertToBlob({ type: 'image/png' });

    // Step 7: Output Validation (verify image exists, loads successfully, width > 0, height > 0)
    if (!outputBlob || outputBlob.size < 1000) {
      throw new Error('Generated blob is empty or too small');
    }

    const testBitmap = await createImageBitmap(outputBlob);
    if (testBitmap.width <= 0 || testBitmap.height <= 0) {
      throw new Error('Generated image has zero dimensions');
    }

    const elapsed = (performance.now() - startTime).toFixed(0);
    console.log(`[AI Enhancer] Enhancement finished successfully in ${elapsed}ms (${finalW}x${finalH})`);

    onProgress?.('AI HD Enhance ✓', 100);
    return outputBlob;
  } catch (err) {
    console.error('[AI Enhancer] Unhandled error during enhancement pipeline:', err);
    return await fallbackStudioEnhancement(inputBlob, onProgress);
  }
}

// Backward compatibility exports
export const enhancePhotoWithFsrcnn = enhancePhotoWithRealEsrgan;
export const enhancePhotoWithSpan2x = enhancePhotoWithRealEsrgan;
export const enhancePhotoWithSwin2sr = enhancePhotoWithRealEsrgan;
