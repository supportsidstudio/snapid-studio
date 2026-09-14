/**
 * SnapID Studio - Clark Swin2SR Lightweight x2 1.58bit Super-Resolution Photo Enhancement Worker
 * Model: clark-labs/clark-swin2sr-lightweight-x2-1.58bit
 * Runs 100% locally inside the browser using ONNX Runtime Web (WebGPU / WASM)
 */
import * as ort from 'onnxruntime-web';

const TILE_SIZE = 64;
const OVERLAP = 8;
const STRIDE = TILE_SIZE - OVERLAP; // 56px

let runtimeAppBaseUrl: string | null = null;
let cachedSession: ort.InferenceSession | null = null;
let sessionLoadingPromise: Promise<ort.InferenceSession> | null = null;
let activeBackend: 'WebGPU' | 'WASM' = 'WASM';

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

/**
 * Fetch and decompress the Swin2SR model buffer with Cache API caching
 */
async function getModelBuffer(): Promise<ArrayBuffer> {
  const CACHE_NAME = 'snapid-swin2sr-v1';
  const base = getAppBaseUrl();
  const gzUrl = `${base.replace(/\/+$/, '')}/models/swin2sr/model.onnx.gz`;
  const plainUrl = `${base.replace(/\/+$/, '')}/models/swin2sr/model.onnx`;

  // 1. Try Browser Cache API first
  if (typeof caches !== 'undefined') {
    try {
      const cache = await caches.open(CACHE_NAME);
      const cachedResp = await cache.match(gzUrl);
      if (cachedResp) {
        const buf = await cachedResp.arrayBuffer();
        if (buf.byteLength > 1000000) {
          return buf;
        }
      }
    } catch {
      // Ignore cache open error
    }
  }

  // 2. Fetch gzipped model if DecompressionStream is supported
  if (typeof DecompressionStream !== 'undefined') {
    try {
      const resp = await fetch(gzUrl, { cache: 'force-cache' });
      if (resp.ok) {
        const decompressedStream = resp.body!.pipeThrough(new DecompressionStream('gzip'));
        const decompressedBuffer = await new Response(decompressedStream).arrayBuffer();
        if (decompressedBuffer.byteLength > 1000000) {
          // Store in Cache API asynchronously
          if (typeof caches !== 'undefined') {
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(gzUrl, new Response(decompressedBuffer.slice(0)));
            }).catch(() => {});
          }
          return decompressedBuffer;
        }
      }
    } catch (e) {
      console.warn('[Swin2SR Worker] Gzip download/decompression warning, falling back:', e);
    }
  }

  // 3. Fallback to uncompressed local model
  try {
    const resp = await fetch(plainUrl, { cache: 'force-cache' });
    if (resp.ok) {
      const buffer = await resp.arrayBuffer();
      if (buffer.byteLength > 1000000) {
        return buffer;
      }
    }
  } catch (e) {
    console.warn('[Swin2SR Worker] Local model fetch warning:', e);
  }

  // 4. Remote Hugging Face fallback if needed
  const remoteGz = 'https://huggingface.co/clark-labs/clark-swin2sr-lightweight-x2-1.58bit/resolve/main/onnx/model.onnx.gz';
  const resp = await fetch(remoteGz, { cache: 'force-cache' });
  if (!resp.ok) {
    throw new Error(`Failed to download Swin2SR model: ${resp.status}`);
  }
  if (typeof DecompressionStream !== 'undefined') {
    const decompressedStream = resp.body!.pipeThrough(new DecompressionStream('gzip'));
    return await new Response(decompressedStream).arrayBuffer();
  }
  return await resp.arrayBuffer();
}

/**
 * Initializes and caches the ONNX InferenceSession.
 * Prefers WebGPU, automatically falling back to WASM.
 */
async function getSession(): Promise<ort.InferenceSession> {
  if (cachedSession) {
    return cachedSession;
  }
  if (sessionLoadingPromise) {
    return sessionLoadingPromise;
  }

  sessionLoadingPromise = (async () => {
    try {
      ort.env.wasm.wasmPaths = getWasmBasePath();
      ort.env.wasm.numThreads = typeof navigator !== 'undefined' && navigator.hardwareConcurrency
        ? Math.min(4, Math.max(1, navigator.hardwareConcurrency))
        : 1;
      ort.env.wasm.proxy = false;
    } catch (e) {
      console.warn('[Swin2SR Worker] wasm setup warning:', e);
    }

    const modelBuffer = await getModelBuffer();

    // 1. Try WebGPU provider first
    if (typeof navigator !== 'undefined' && 'gpu' in navigator) {
      try {
        const adapter = await (navigator as any).gpu.requestAdapter();
        if (adapter) {
          const sess = await ort.InferenceSession.create(modelBuffer, {
            executionProviders: ['webgpu'],
            graphOptimizationLevel: 'all',
          });
          cachedSession = sess;
          activeBackend = 'WebGPU';
          console.log('[Swin2SR Worker] Session initialized with WebGPU acceleration.');
          return sess;
        }
      } catch (gpuErr) {
        console.warn('[Swin2SR Worker] WebGPU unavailable, falling back to WASM CPU:', gpuErr);
      }
    }

    // 2. Fallback to WASM
    const sess = await ort.InferenceSession.create(modelBuffer, {
      executionProviders: ['wasm'],
      graphOptimizationLevel: 'all',
    });
    cachedSession = sess;
    activeBackend = 'WASM';
    console.log('[Swin2SR Worker] Session initialized with WASM engine.');
    return sess;
  })();

  return sessionLoadingPromise;
}

/**
 * Smooth weighting for overlapping tile seams
 */
function getTileWeight(x: number, y: number, size: number, overlap: number): number {
  const dx = Math.min(x, size - 1 - x);
  const dy = Math.min(y, size - 1 - y);
  const d = Math.min(dx, dy);
  if (d >= overlap) return 1.0;
  return Math.max(0.05, (d + 1) / (overlap + 1));
}

/**
 * Main enhancement handler for a portrait cutout Blob
 */
async function processEnhancement(inputBlob: Blob): Promise<Blob> {
  // Decode image into an ImageBitmap
  const imageBitmap = await createImageBitmap(inputBlob);
  const origW = imageBitmap.width;
  const origH = imageBitmap.height;

  // Capping inference input resolution to prevent memory freezes on low-end laptops
  // For passport printing (35x45mm at 300 DPI = ~413x531px):
  // An upscaled output around 512-700px provides pristine >350 DPI print quality.
  let scaleFactor = 1.0;
  const maxInDim = activeBackend === 'WebGPU' ? 384 : 288;
  if (origW > maxInDim || origH > maxInDim) {
    scaleFactor = Math.min(maxInDim / origW, maxInDim / origH);
  }

  const inW = Math.max(64, Math.round(origW * scaleFactor));
  const inH = Math.max(64, Math.round(origH * scaleFactor));

  // Render input into an OffscreenCanvas
  const inputCanvas = new OffscreenCanvas(inW, inH);
  const inputCtx = inputCanvas.getContext('2d', { willReadFrequently: true });
  if (!inputCtx) throw new Error('OffscreenCanvas 2D context unavailable');

  inputCtx.drawImage(imageBitmap, 0, 0, inW, inH);
  const inImageData = inputCtx.getImageData(0, 0, inW, inH);
  const inData = inImageData.data;

  // Extract RGB and Alpha
  const planeSize = inW * inH;
  const rPlane = new Float32Array(planeSize);
  const gPlane = new Float32Array(planeSize);
  const bPlane = new Float32Array(planeSize);
  const alphaPlane = new Uint8ClampedArray(planeSize);

  for (let i = 0; i < planeSize; i++) {
    const p = i * 4;
    rPlane[i] = inData[p] / 255.0;
    gPlane[i] = inData[p + 1] / 255.0;
    bPlane[i] = inData[p + 2] / 255.0;
    alphaPlane[i] = inData[p + 3];
  }

  // Get or initialize session
  const session = await getSession();

  // Generate tile coordinates
  const tiles: { left: number; top: number }[] = [];
  for (let top = 0; top < inH; top += STRIDE) {
    let actualTop = top;
    if (actualTop + TILE_SIZE > inH) actualTop = Math.max(0, inH - TILE_SIZE);
    for (let left = 0; left < inW; left += STRIDE) {
      let actualLeft = left;
      if (actualLeft + TILE_SIZE > inW) actualLeft = Math.max(0, inW - TILE_SIZE);
      tiles.push({ left: actualLeft, top: actualTop });
      if (actualLeft + TILE_SIZE >= inW) break;
    }
    if (actualTop + TILE_SIZE >= inH) break;
  }

  const outW = inW * 2;
  const outH = inH * 2;
  const outR = new Float32Array(outW * outH);
  const outG = new Float32Array(outW * outH);
  const outB = new Float32Array(outW * outH);
  const weights = new Float32Array(outW * outH);

  const tileInputBuf = new Float32Array(1 * 3 * 64 * 64);
  const tileRStart = 0;
  const tileGStart = 64 * 64;
  const tileBStart = 2 * 64 * 64;

  const totalTiles = tiles.length;
  for (let t = 0; t < totalTiles; t++) {
    const { left, top } = tiles[t];

    // Populate 64x64 tile
    for (let ty = 0; ty < 64; ty++) {
      const sy = top + ty;
      const sRow = sy * inW;
      const tRow = ty * 64;
      for (let tx = 0; tx < 64; tx++) {
        const sx = left + tx;
        const sIdx = sRow + sx;
        const tIdx = tRow + tx;

        tileInputBuf[tileRStart + tIdx] = rPlane[sIdx];
        tileInputBuf[tileGStart + tIdx] = gPlane[sIdx];
        tileInputBuf[tileBStart + tIdx] = bPlane[sIdx];
      }
    }

    const inputTensor = new ort.Tensor('float32', tileInputBuf, [1, 3, 64, 64]);
    const feeds: Record<string, ort.Tensor> = {};
    feeds[session.inputNames[0]] = inputTensor;

    const results = await session.run(feeds);
    const outTensor = results[session.outputNames[0]];
    const outData = outTensor.data as Float32Array;

    // Blend into full canvas with weight mask
    const outLeft = left * 2;
    const outTop = top * 2;
    const outTileR = 0;
    const outTileG = 128 * 128;
    const outTileB = 2 * 128 * 128;

    for (let ty = 0; ty < 128; ty++) {
      const oy = outTop + ty;
      if (oy >= outH) continue;
      const oRow = oy * outW;
      const tRow = ty * 128;

      for (let tx = 0; tx < 128; tx++) {
        const ox = outLeft + tx;
        if (ox >= outW) continue;

        const w = getTileWeight(tx, ty, 128, OVERLAP * 2);
        const oIdx = oRow + ox;
        const tIdx = tRow + tx;

        outR[oIdx] += outData[outTileR + tIdx] * w;
        outG[oIdx] += outData[outTileG + tIdx] * w;
        outB[oIdx] += outData[outTileB + tIdx] * w;
        weights[oIdx] += w;
      }
    }

    // Report progress
    const percent = Math.round(25 + ((t + 1) / totalTiles) * 65);
    self.postMessage({
      type: 'progress',
      step: 'Enhancing photo quality...',
      percent,
    });
  }

  // Normalize blended weights
  for (let i = 0; i < outW * outH; i++) {
    const w = weights[i];
    if (w > 0) {
      outR[i] /= w;
      outG[i] /= w;
      outB[i] /= w;
    }
  }

  // Smooth 2x Bilinear upscaling for Alpha channel
  const outAlpha = new Uint8ClampedArray(outW * outH);
  for (let oy = 0; oy < outH; oy++) {
    const sy = Math.min(inH - 1, oy / 2);
    const y0 = Math.floor(sy);
    const y1 = Math.min(inH - 1, y0 + 1);
    const fy = sy - y0;

    const oRow = oy * outW;
    const sRow0 = y0 * inW;
    const sRow1 = y1 * inW;

    for (let ox = 0; ox < outW; ox++) {
      const sx = Math.min(inW - 1, ox / 2);
      const x0 = Math.floor(sx);
      const x1 = Math.min(inW - 1, x0 + 1);
      const fx = sx - x0;

      const a00 = alphaPlane[sRow0 + x0];
      const a10 = alphaPlane[sRow0 + x1];
      const a01 = alphaPlane[sRow1 + x0];
      const a11 = alphaPlane[sRow1 + x1];

      const topA = a00 + fx * (a10 - a00);
      const btmA = a01 + fx * (a11 - a01);
      outAlpha[oRow + ox] = Math.round(topA + fy * (btmA - topA));
    }
  }

  // Construct final 2x ImageData with mild natural detail sharpening
  const outCanvas = new OffscreenCanvas(outW, outH);
  const outCtx = outCanvas.getContext('2d');
  if (!outCtx) throw new Error('Output canvas context unavailable');

  const finalImgData = outCtx.createImageData(outW, outH);
  const finalData = finalImgData.data;

  for (let y = 0; y < outH; y++) {
    const row = y * outW;
    const upRow = (y > 0 ? y - 1 : y) * outW;
    const downRow = (y < outH - 1 ? y + 1 : y) * outW;

    for (let x = 0; x < outW; x++) {
      const idx = row + x;
      const leftIdx = row + (x > 0 ? x - 1 : x);
      const rightIdx = row + (x < outW - 1 ? x + 1 : x);
      const upIdx = upRow + x;
      const downIdx = downRow + x;

      // Mild natural sharpening: center 1.16, neighbors -0.04 (total weight 1.0)
      const rCenter = outR[idx];
      const rSurround = (outR[leftIdx] + outR[rightIdx] + outR[upIdx] + outR[downIdx]) * 0.25;
      const rSharp = rCenter + (rCenter - rSurround) * 0.16;

      const gCenter = outG[idx];
      const gSurround = (outG[leftIdx] + outG[rightIdx] + outG[upIdx] + outG[downIdx]) * 0.25;
      const gSharp = gCenter + (gCenter - gSurround) * 0.16;

      const bCenter = outB[idx];
      const bSurround = (outB[leftIdx] + outB[rightIdx] + outB[upIdx] + outB[downIdx]) * 0.25;
      const bSharp = bCenter + (bCenter - bSurround) * 0.16;

      const p = idx * 4;
      finalData[p] = Math.max(0, Math.min(255, Math.round(rSharp * 255)));
      finalData[p + 1] = Math.max(0, Math.min(255, Math.round(gSharp * 255)));
      finalData[p + 2] = Math.max(0, Math.min(255, Math.round(bSharp * 255)));
      finalData[p + 3] = outAlpha[idx];
    }
  }

  outCtx.putImageData(finalImgData, 0, 0);
  return await outCanvas.convertToBlob({ type: 'image/png' });
}

// Worker message listener
self.onmessage = async (e: MessageEvent) => {
  const { type, blob, baseUrl } = e.data;

  if (baseUrl) {
    runtimeAppBaseUrl = baseUrl;
  }

  if (type === 'enhance') {
    const startTime = performance.now();
    self.postMessage({ type: 'progress', step: 'Enhancing photo...', percent: 15 });

    try {
      // Set a 12-second safety timeout
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Swin2SR inference timeout')), 12000);
      });

      const enhancedBlob = await Promise.race([
        processEnhancement(blob),
        timeoutPromise,
      ]);

      const elapsedMs = Math.round(performance.now() - startTime);
      console.log(`[Swin2SR Worker] 2x enhancement completed in ${elapsedMs}ms via ${activeBackend}`);

      self.postMessage({
        type: 'success',
        blob: enhancedBlob,
        elapsedMs,
        backend: activeBackend,
      });
    } catch (err: any) {
      console.warn('[Swin2SR Worker] Enhancement error, immediately falling back to original cutout:', err);
      // Immediately return original blob as guaranteed fallback
      self.postMessage({
        type: 'success',
        blob,
        elapsedMs: 0,
        fallback: true,
      });
    }
  }
};
