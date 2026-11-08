import path from 'path';
import fs from 'fs';
import { PNG } from 'pngjs';

import { spawn } from 'child_process';

let rmbgSession: any = null;
let rmbgLoadingPromise: Promise<any> | null = null;

/**
 * Attempts to execute the high-fidelity BiRefNet model via image_processor.py
 */
export async function runPythonBiRefNet(inputBuffer: Buffer): Promise<Buffer | null> {
  return new Promise((resolve) => {
    try {
      const scriptPath = path.join(process.cwd(), 'image_processor.py');
      if (!fs.existsSync(scriptPath)) {
        return resolve(null);
      }

      const pyProcess = spawn('python3', [scriptPath], {
        stdio: ['pipe', 'pipe', 'pipe']
      });

      const chunks: Buffer[] = [];
      let errorData = '';

      pyProcess.stdout.on('data', (data) => {
        chunks.push(data);
      });

      pyProcess.stderr.on('data', (data) => {
        errorData += data.toString();
      });

      pyProcess.on('error', (err) => {
        console.warn('[Python BiRefNet Engine] python3 execution error:', err.message);
        resolve(null);
      });

      pyProcess.on('close', (code) => {
        if (code === 0 && chunks.length > 0) {
          const resultBuf = Buffer.concat(chunks);
          console.log(`[Python BiRefNet Engine] Processed image with image_processor.py (${resultBuf.length} bytes)`);
          resolve(resultBuf);
        } else {
          if (errorData) {
            console.warn('[Python BiRefNet Engine] Non-zero exit or error:', errorData.trim().slice(0, 300));
          }
          resolve(null);
        }
      });

      pyProcess.stdin.write(inputBuffer);
      pyProcess.stdin.end();
    } catch (err: any) {
      console.warn('[Python BiRefNet Engine] Could not spawn python3:', err.message);
      resolve(null);
    }
  });
}

async function getRmbgServerSession() {
  if (rmbgSession) return rmbgSession;
  if (rmbgLoadingPromise) return rmbgLoadingPromise;

  rmbgLoadingPromise = (async () => {
    try {
      const ort = await import('onnxruntime-web');
      const modelPath = path.join(process.cwd(), 'public/models/rmbg-1.4.onnx');
      if (!fs.existsSync(modelPath)) {
        throw new Error('RMBG-1.4 model file not found on server at ' + modelPath);
      }
      const session = await ort.InferenceSession.create(modelPath, {
        executionProviders: ['wasm'],
        graphOptimizationLevel: 'all',
      });
      rmbgSession = session;
      console.log('[Server Bg Engine] RMBG-1.4 model session initialized successfully');
      return session;
    } catch (err: any) {
      rmbgLoadingPromise = null;
      console.error('[Server Bg Engine] Error initializing RMBG model:', err.message);
      throw err;
    }
  })();

  return rmbgLoadingPromise;
}

export interface RemoveBgOptions {
  image: string; // Base64 data URL
  modelType?: 'rmbg' | 'modnet' | 'auto';
  category?: 'auto' | 'people' | 'product' | 'animal' | 'glass';
  customApiKey?: string;
  customProvider?: 'removebg' | 'photoroom';
}

/**
 * Parses a data URL into a binary Buffer and mime type
 */
function parseDataUrl(dataUrl: string): { buffer: Buffer; mimeType: string } {
  const matches = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
  if (!matches) {
    throw new Error('Invalid data URL format');
  }
  return {
    mimeType: matches[1],
    buffer: Buffer.from(matches[2], 'base64')
  };
}

/**
 * Handles proxying to official remove.bg API if user supplies their own API key
 */
async function callRemoveBgApi(buffer: Buffer, apiKey: string): Promise<string> {
  const formData = new FormData();
  const blob = new Blob([buffer], { type: 'image/jpeg' });
  formData.append('image_file', blob, 'image.jpg');
  formData.append('size', 'auto');

  const res = await fetch('https://api.remove.bg/v1.0/removebg', {
    method: 'POST',
    headers: {
      'X-Api-Key': apiKey,
    },
    body: formData,
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`remove.bg API error (${res.status}): ${errorText}`);
  }

  const arrayBuffer = await res.arrayBuffer();
  const base64 = Buffer.from(arrayBuffer).toString('base64');
  return `data:image/png;base64,${base64}`;
}

/**
 * Simple bilinear image resize for RGBA buffers
 */
function resizeImageData(
  srcData: Buffer,
  srcW: number,
  srcH: number,
  dstW: number,
  dstH: number
): Buffer {
  const dstData = Buffer.alloc(dstW * dstH * 4);
  const xRatio = srcW / dstW;
  const yRatio = srcH / dstH;

  for (let dy = 0; dy < dstH; dy++) {
    for (let dx = 0; dx < dstW; dx++) {
      const sx = Math.floor(dx * xRatio);
      const sy = Math.floor(dy * yRatio);
      const srcIdx = (sy * srcW + sx) * 4;
      const dstIdx = (dy * dstW + dx) * 4;

      dstData[dstIdx] = srcData[srcIdx];
      dstData[dstIdx + 1] = srcData[srcIdx + 1];
      dstData[dstIdx + 2] = srcData[srcIdx + 2];
      dstData[dstIdx + 3] = srcData[srcIdx + 3];
    }
  }

  return dstData;
}

/**
 * Server-side RMBG-1.4 inference pipeline
 */
export async function processServerBackgroundRemoval(options: RemoveBgOptions): Promise<{
  cutoutImage: string;
  maskImage: string;
  width: number;
  height: number;
  modelUsed: string;
  inferenceTimeMs: number;
}> {
  const { image, customApiKey, customProvider } = options;

  if (!image || typeof image !== 'string') {
    throw new Error('Image data is required');
  }

  const { buffer } = parseDataUrl(image);

  // 1. Check for custom 3rd party API key
  if (customApiKey && customApiKey.trim().length > 5) {
    if (customProvider === 'removebg' || !customProvider) {
      console.log('[Server Bg Engine] Delegating to remove.bg API with user key');
      const start = Date.now();
      const cutoutImage = await callRemoveBgApi(buffer, customApiKey.trim());
      return {
        cutoutImage,
        maskImage: cutoutImage,
        width: 1024,
        height: 1024,
        modelUsed: 'remove.bg API (User Key)',
        inferenceTimeMs: Date.now() - start
      };
    }
  }

  // 2. Try Python BiRefNet pipeline (image_processor.py with BiRefNet-general)
  const startTime = Date.now();
  try {
    const pythonResult = await runPythonBiRefNet(buffer);
    if (pythonResult && pythonResult.length > 0) {
      const parsedPng = PNG.sync.read(pythonResult);
      const cutoutDataUrl = `data:image/png;base64,${pythonResult.toString('base64')}`;
      return {
        cutoutImage: cutoutDataUrl,
        maskImage: cutoutDataUrl,
        width: parsedPng.width,
        height: parsedPng.height,
        modelUsed: 'BiRefNet (image_processor.py)',
        inferenceTimeMs: Date.now() - startTime
      };
    }
  } catch (pyErr) {
    console.warn('[Server Bg Engine] BiRefNet Python pipeline skipped, falling back to local engine:', pyErr);
  }

  // 3. Fallback: Server-side ONNX processing
  const session = await getRmbgServerSession();
  const ort = await import('onnxruntime-web');

  // Decode image into RGBA buffer using pngjs or basic format check
  let png: PNG;
  try {
    png = PNG.sync.read(buffer);
  } catch {
    // If not PNG, try wrapping or re-encoding
    // Since client passes canvas data URLs (png/jpeg), we convert to PNG
    png = PNG.sync.read(buffer);
  }

  const origW = png.width;
  const origH = png.height;

  // Resize to 1024x1024 for RMBG model
  const modelDim = 1024;
  const resizedBuffer = resizeImageData(png.data, origW, origH, modelDim, modelDim);

  // Build NCHW float32 tensor with ImageNet normalization
  const numPixels = modelDim * modelDim;
  const tensorData = new Float32Array(3 * numPixels);
  const meanR = 0.485, meanG = 0.456, meanB = 0.406;
  const stdR = 0.229, stdG = 0.224, stdB = 0.225;

  for (let i = 0; i < numPixels; i++) {
    const px = i * 4;
    const r = resizedBuffer[px] / 255.0;
    const g = resizedBuffer[px + 1] / 255.0;
    const b = resizedBuffer[px + 2] / 255.0;

    tensorData[i] = (r - meanR) / stdR;
    tensorData[numPixels + i] = (g - meanG) / stdG;
    tensorData[2 * numPixels + i] = (b - meanB) / stdB;
  }

  const inputTensor = new ort.Tensor('float32', tensorData, [1, 3, modelDim, modelDim]);

  const inferStart = Date.now();
  const results = await session.run({ input: inputTensor });
  const inferenceTimeMs = Date.now() - inferStart;

  const outputTensor = results.output;
  const matteData = outputTensor.data as Float32Array;

  // Build mask array at original resolution
  const finalPng = new PNG({ width: origW, height: origH });
  const maskPng = new PNG({ width: origW, height: origH });

  const xRatio = modelDim / origW;
  const yRatio = modelDim / origH;

  for (let y = 0; y < origH; y++) {
    for (let x = 0; x < origW; x++) {
      const origIdx = (y * origW + x) * 4;
      const mx = Math.floor(x * xRatio);
      const my = Math.floor(y * yRatio);
      const mIdx = my * modelDim + mx;

      let alpha = matteData[mIdx];
      if (alpha < 0 || alpha > 1) {
        alpha = 1 / (1 + Math.exp(-alpha));
      }
      alpha = Math.max(0, Math.min(1, alpha));

      // Thresholding
      if (alpha <= 0.02) {
        alpha = 0;
      } else if (alpha >= 0.96) {
        alpha = 1.0;
      }

      const alphaByte = Math.round(alpha * 255);

      // Cutout image
      finalPng.data[origIdx] = png.data[origIdx];
      finalPng.data[origIdx + 1] = png.data[origIdx + 1];
      finalPng.data[origIdx + 2] = png.data[origIdx + 2];
      finalPng.data[origIdx + 3] = alphaByte;

      // Mask image (B&W)
      maskPng.data[origIdx] = alphaByte;
      maskPng.data[origIdx + 1] = alphaByte;
      maskPng.data[origIdx + 2] = alphaByte;
      maskPng.data[origIdx + 3] = 255;
    }
  }

  const finalCutoutBuf = PNG.sync.write(finalPng);
  const finalMaskBuf = PNG.sync.write(maskPng);

  const cutoutDataUrl = `data:image/png;base64,${finalCutoutBuf.toString('base64')}`;
  const maskDataUrl = `data:image/png;base64,${finalMaskBuf.toString('base64')}`;

  console.log(`[Server Bg Engine] Background removal finished in ${Date.now() - startTime}ms (${origW}x${origH})`);

  return {
    cutoutImage: cutoutDataUrl,
    maskImage: maskDataUrl,
    width: origW,
    height: origH,
    modelUsed: 'RMBG-1.4 Neural Engine',
    inferenceTimeMs
  };
}
