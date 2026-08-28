import * as ort from 'onnxruntime-web';

// Matching onnxruntime-web package version in package.json (1.29.0)
const ORT_VERSION = '1.29.0';
const CDN_WASM_PATH = `https://cdn.jsdelivr.net/npm/onnxruntime-web@${ORT_VERSION}/dist/`;

const MODEL_SOURCES = [
  '/models/u2netp.onnx',
  'https://huggingface.co/edgetools/u2netp/resolve/main/u2netp.onnx',
  'https://github.com/danielgatis/rembg/releases/download/v0.0.0/u2netp.onnx'
];

function getWasmBasePath(): string {
  if (typeof location !== 'undefined' && location.origin && location.origin !== 'null' && !location.origin.startsWith('blob:') && !location.origin.startsWith('file:')) {
    return `${location.origin}/onnxruntime/`;
  }
  return CDN_WASM_PATH;
}

try {
  ort.env.wasm.wasmPaths = getWasmBasePath();
  ort.env.wasm.numThreads = 1;
} catch (e) {
  console.warn('[U2NetP Worker] Initial wasmPaths configuration warning:', e);
}

let session: ort.InferenceSession | null = null;
let sessionLoadingPromise: Promise<ort.InferenceSession> | null = null;

async function fetchValidModelBuffer(url: string): Promise<ArrayBuffer> {
  const resolvedUrl = (typeof location !== 'undefined' && location.origin && location.origin !== 'null' && !location.origin.startsWith('blob:') && url.startsWith('/'))
    ? `${location.origin}${url}`
    : url;

  console.log(`[U2NetP Worker] Attempting to load U²-NetP model from: ${resolvedUrl}`);
  const response = await fetch(resolvedUrl, { cache: 'force-cache' });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status} (${response.statusText})`);
  }
  const buffer = await response.arrayBuffer();
  if (buffer.byteLength < 4000000) {
    // Standard U2NetP model is ~4.5MB. Small size means 404 HTML, git lfs pointer, or truncated download
    throw new Error(`Invalid model binary size: ${buffer.byteLength} bytes`);
  }

  // Validate protobuf ONNX magic header (starts with 0x08)
  const header = new Uint8Array(buffer, 0, 4);
  if (header[0] !== 0x08) {
    throw new Error(`Invalid ONNX protobuf header: [${Array.from(header).join(', ')}]`);
  }

  console.log(`[U2NetP Worker] Successfully verified U²-NetP model binary (${(buffer.byteLength / 1024 / 1024).toFixed(2)} MB) from: ${resolvedUrl}`);
  return buffer;
}

/**
 * Loads and caches the U2-NetP ONNX inference session once.
 * Reuses the cached session across all subsequent image requests.
 */
async function getSession(): Promise<ort.InferenceSession> {
  if (session) return session;
  if (sessionLoadingPromise) return sessionLoadingPromise;

  sessionLoadingPromise = (async () => {
    let lastError: any = null;

    // Try creating session with each verified model source until one succeeds
    for (const source of MODEL_SOURCES) {
      try {
        const buffer = await fetchValidModelBuffer(source);

        const sessionOptions: ort.InferenceSession.SessionOptions = {
          executionProviders: ['wasm'],
          graphOptimizationLevel: 'all',
        };

        // Try local wasm first
        try {
          ort.env.wasm.wasmPaths = getWasmBasePath();
          ort.env.wasm.numThreads = 1;
          const newSession = await ort.InferenceSession.create(buffer.slice(0), sessionOptions);
          console.log(`[U2NetP Worker] U²-NetP session active via local WASM! Inputs: [${newSession.inputNames.join(', ')}]`);
          session = newSession;
          return newSession;
        } catch (localWasmErr) {
          console.warn('[U2NetP Worker] Local WASM init failed, switching to CDN wasmPaths fallback...', localWasmErr);
          ort.env.wasm.wasmPaths = CDN_WASM_PATH;
          ort.env.wasm.numThreads = 1;
          const newSession = await ort.InferenceSession.create(buffer.slice(0), sessionOptions);
          console.log(`[U2NetP Worker] U²-NetP session active via CDN WASM! Inputs: [${newSession.inputNames.join(', ')}]`);
          session = newSession;
          return newSession;
        }
      } catch (srcErr: any) {
        console.warn(`[U2NetP Worker] Failed loading model from source ${source}:`, srcErr.message || srcErr);
        lastError = srcErr;
      }
    }

    sessionLoadingPromise = null;
    const finalErr = new Error(`Could not initialize U²-NetP ONNX session from any source. Reason: ${lastError?.message || lastError}`);
    console.error('[U2NetP Worker] Failed to load ONNX session:', finalErr);
    throw finalErr;
  })();

  return sessionLoadingPromise;
}

/**
 * Preprocesses an ImageBitmap into a 320x320 Float32Array NCHW tensor
 * normalized using standard ImageNet mean & std expected by U²-Net.
 */
function preprocessImage(
  imageBitmap: ImageBitmap,
  targetWidth = 320,
  targetHeight = 320
): { tensor: ort.Tensor; origWidth: number; origHeight: number } {
  const origWidth = imageBitmap.width;
  const origHeight = imageBitmap.height;

  const canvas = new OffscreenCanvas(targetWidth, targetHeight);
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) throw new Error('Could not get 2D context from OffscreenCanvas');

  ctx.drawImage(imageBitmap, 0, 0, targetWidth, targetHeight);
  const imageData = ctx.getImageData(0, 0, targetWidth, targetHeight);
  const data = imageData.data;

  const numPixels = targetWidth * targetHeight;
  const tensorData = new Float32Array(3 * numPixels);

  // ImageNet standard mean and std used by U2-Net
  const meanR = 0.485, meanG = 0.456, meanB = 0.406;
  const stdR = 0.229, stdG = 0.224, stdB = 0.225;

  for (let i = 0; i < numPixels; i++) {
    const px = i * 4;
    const r = data[px] / 255.0;
    const g = data[px + 1] / 255.0;
    const b = data[px + 2] / 255.0;

    tensorData[i] = (r - meanR) / stdR;                      // Channel 0 (Red)
    tensorData[numPixels + i] = (g - meanG) / stdG;          // Channel 1 (Green)
    tensorData[2 * numPixels + i] = (b - meanB) / stdB;      // Channel 2 (Blue)
  }

  const tensor = new ort.Tensor('float32', tensorData, [1, 3, targetHeight, targetWidth]);
  return { tensor, origWidth, origHeight };
}

/**
 * Applies the predicted 320x320 saliency mask back to the original full-resolution image,
 * producing a transparent RGBA PNG Blob with 100% original dimensions preserved.
 */
async function generateTransparentImage(
  imageBitmap: ImageBitmap,
  d0Data: Float32Array | Float64Array | number[],
  maskWidth = 320,
  maskHeight = 320
): Promise<Blob> {
  const origWidth = imageBitmap.width;
  const origHeight = imageBitmap.height;

  // 1. Min-max normalization of d0 saliency output
  let minVal = Infinity;
  let maxVal = -Infinity;
  const numPixels = maskWidth * maskHeight;
  for (let i = 0; i < numPixels; i++) {
    const val = d0Data[i];
    if (val < minVal) minVal = val;
    if (val > maxVal) maxVal = val;
  }
  const range = (maxVal - minVal) || 1;

  // 2. Generate 320x320 alpha mask ImageData with crisp edge refinement
  const maskCanvas = new OffscreenCanvas(maskWidth, maskHeight);
  const maskCtx = maskCanvas.getContext('2d');
  if (!maskCtx) throw new Error('Could not get mask canvas context');

  const maskImageData = maskCtx.createImageData(maskWidth, maskHeight);
  const maskData = maskImageData.data;

  for (let i = 0; i < numPixels; i++) {
    let norm = (d0Data[i] - minVal) / range;
    
    // Smooth threshold curve for passport photo portrait edges
    // Cleans up background haze while retaining fine hair edges
    if (norm < 0.04) {
      norm = 0;
    } else if (norm > 0.96) {
      norm = 1;
    } else {
      // Smoothstep curve: 3x^2 - 2x^3
      norm = norm * norm * (3 - 2 * norm);
    }
    
    const alpha = Math.round(Math.max(0, Math.min(1, norm)) * 255);
    const px = i * 4;
    maskData[px] = 255;
    maskData[px + 1] = 255;
    maskData[px + 2] = 255;
    maskData[px + 3] = alpha;
  }

  maskCtx.putImageData(maskImageData, 0, 0);

  // 3. Composite onto full-resolution canvas preserving 100% original pixels
  const finalCanvas = new OffscreenCanvas(origWidth, origHeight);
  const finalCtx = finalCanvas.getContext('2d');
  if (!finalCtx) throw new Error('Could not get final canvas context');

  // Draw original high-res image
  finalCtx.drawImage(imageBitmap, 0, 0, origWidth, origHeight);

  // Blend mask smoothly using destination-in
  finalCtx.globalCompositeOperation = 'destination-in';
  finalCtx.imageSmoothingEnabled = true;
  finalCtx.imageSmoothingQuality = 'high';
  finalCtx.drawImage(maskCanvas, 0, 0, origWidth, origHeight);

  // 4. Convert to PNG blob
  const resultBlob = await finalCanvas.convertToBlob({ type: 'image/png' });
  return resultBlob;
}

self.onmessage = async (e: MessageEvent) => {
  const { type, blob } = e.data;

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
      self.postMessage({ type: 'progress', step: 'Loading U²-NetP Model', percent: 25 });

      // Get or load cached session
      const activeSession = await getSession();

      self.postMessage({ type: 'progress', step: 'Preprocessing (320×320 Tensor)', percent: 50 });
      const imageBitmap = await createImageBitmap(blob);
      const { tensor, origWidth, origHeight } = preprocessImage(imageBitmap, 320, 320);

      self.postMessage({ type: 'progress', step: 'Running U²-NetP AI Inference', percent: 75 });
      const inputName = activeSession.inputNames[0] || 'input.1';
      const outputName = activeSession.outputNames[0] || '1959';

      const inferenceStart = performance.now();
      const results = await activeSession.run({ [inputName]: tensor });
      const inferenceElapsed = (performance.now() - inferenceStart).toFixed(1);
      console.log(`[U2NetP Worker] Inference completed in ${inferenceElapsed}ms`);

      self.postMessage({ type: 'progress', step: 'Extracting Alpha Mask at Full Resolution', percent: 90 });
      const outputTensor = results[outputName];
      const d0Data = outputTensor.data as Float32Array;

      const finalBlob = await generateTransparentImage(imageBitmap, d0Data, 320, 320);
      
      const totalTime = ((performance.now() - startTime) / 1000).toFixed(2);
      console.log(`[U2NetP Worker] Full background removal completed in ${totalTime}s (Original Size: ${origWidth}x${origHeight}px)`);

      self.postMessage({ type: 'success', blob: finalBlob, inferenceTimeMs: Number(inferenceElapsed), totalTimeSec: Number(totalTime) });
    } catch (error: any) {
      console.error('[U2NetP Worker] Error during background removal:', error);
      self.postMessage({ type: 'error', error: error?.message || String(error) });
    }
  }
};
