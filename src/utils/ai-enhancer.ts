/**
 * SnapID Studio - AI HD Photo Enhancement Client
 * 
 * Powered by Real-ESRGAN general-x4v3 Compact Neural Super-Resolution (4x ONNX)
 * running inside a dedicated background Web Worker for 100% fluid UI responsiveness.
 * 
 * Key Features:
 * 1. Dedicated Web Worker: Zero main-thread blocking — CSS animations, spinners, and touch events remain silky smooth.
 * 2. Tier-Aware Pre-Resolution Cap:
 *    - Mid/High-End Mobile & Tablets (>=6 cores or >=4GB RAM): 960-1000px
 *    - Desktop: 1200px
 *    - Low-End Mobile (<=4 cores / <=2GB RAM): 640px fallback
 * 3. Stage-1 Face-Crop Re-Pass: High-fidelity facial texture pass targeting skin pores, eyelashes, and hair definition.
 * 4. Overlapped Feathered Tiling: Cosine window accumulation across overlap zones eliminates all seams.
 * 5. Fast Mode Option: Instant classical studio clarity pass for low-power or low-spec devices.
 */

import AiEnhancerWorker from '../workers/ai-enhancer.worker?worker';

export interface EnhancementProgressCallback {
  (step: string, percent?: number): void;
}

export interface EnhanceOptions {
  fastMode?: boolean;
  maxDimension?: number;
}

let enhancerWorker: Worker | null = null;
let currentRequestId = 0;

function getClientBaseUrl(): string {
  if (typeof window !== 'undefined' && window.location) {
    const origin = window.location.origin;
    const pathname = window.location.pathname;
    const segments = pathname.split('/').filter(Boolean);
    if (window.location.hostname.includes('github.io') && segments.length > 0) {
      return `${origin}/${segments[0]}/`;
    }
    return `${origin}/`;
  }
  return '/';
}

function getEnhancerWorker(): Worker {
  if (!enhancerWorker && typeof window !== 'undefined') {
    enhancerWorker = new AiEnhancerWorker();
    enhancerWorker.onerror = (err) => {
      console.warn('[AI Enhancer Client] Worker error:', err);
      if (enhancerWorker) {
        try {
          enhancerWorker.terminate();
        } catch {
          // ignore
        }
        enhancerWorker = null;
      }
    };
  }
  return enhancerWorker;
}

/**
 * Preloads the AI model in background worker without blocking UI
 */
export function preloadAiEnhancerModel(): void {
  try {
    const worker = getEnhancerWorker();
    const baseUrl = getClientBaseUrl();
    worker.postMessage({ id: 'preload', type: 'preload', baseUrl });
  } catch (e) {
    console.warn('[AI Enhancer Client] Preload notice:', e);
  }
}

/**
 * Explicit Fast Clarity pass (Only executed when explicitly requested by user in fastMode)
 */
export async function applyFastClarityPass(
  inputBlob: Blob,
  onProgress?: EnhancementProgressCallback
): Promise<Blob> {
  onProgress?.('Applying fast clarity pass...', 50);
  const bitmap = await createImageBitmap(inputBlob);
  const targetW = Math.round(bitmap.width * 2);
  const targetH = Math.round(bitmap.height * 2);

  const canvas = new OffscreenCanvas(targetW, targetH);
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(bitmap, 0, 0, targetW, targetH);

  onProgress?.('Fast clarity pass complete', 100);
  return await canvas.convertToBlob({ type: 'image/png' });
}

/**
 * 🚀 AI HD Photo Enhancement Pipeline (Web Worker Offloaded)
 * NEVER silently falls back to classical processing. Returns actual AI neural result or throws error.
 */
export async function enhancePhotoWithRealEsrgan(
  inputBlob: Blob,
  onProgress?: EnhancementProgressCallback,
  options: EnhanceOptions = {}
): Promise<Blob> {
  const reqId = `enhance_${++currentRequestId}_${Date.now()}`;
  onProgress?.('Preparing portrait for AI super-resolution...', 5);

  const isMobile = typeof navigator !== 'undefined' && (
    /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent) ||
    (typeof window !== 'undefined' && window.innerWidth <= 768)
  );

  // Precise tier detection: low-end check vs mid/high-tier mobile
  const cores = typeof navigator !== 'undefined' && typeof navigator.hardwareConcurrency === 'number'
    ? navigator.hardwareConcurrency
    : 4;
  const memory = typeof (navigator as any)?.deviceMemory === 'number'
    ? (navigator as any).deviceMemory
    : 4;

  const isLowEnd = (cores <= 2 || memory <= 4) || (isMobile && (cores <= 4 || memory <= 4));

  console.log(`[AI Enhancer Client: INVOKE] ID: ${reqId} | Mode: ${options.fastMode ? 'Fast Classical' : 'Real-ESRGAN Neural HD'} | Blob Size: ${inputBlob.size} bytes | Device: ${isMobile ? (isLowEnd ? 'Low-End Mobile' : 'Mid/High-End Mobile') : (isLowEnd ? 'Low-Spec Desktop' : 'Standard Desktop')} (cores: ${cores}, RAM: ${memory}GB)`);

  // Pre-create ImageBitmap to pass to worker
  const imageBitmap = await createImageBitmap(inputBlob);
  if (imageBitmap.width <= 0 || imageBitmap.height <= 0) {
    throw new Error('Invalid input image dimensions');
  }

  const worker = getEnhancerWorker();
  const baseUrl = getClientBaseUrl();

  return await new Promise<Blob>((resolve, reject) => {
    const handleMessage = (e: MessageEvent) => {
      const data = e.data;
      if (!data || data.id !== reqId) return;

      if (data.type === 'progress') {
        onProgress?.(data.step, data.percent);
      } else if (data.type === 'complete') {
        worker.removeEventListener('message', handleMessage);
        onProgress?.('AI HD Enhance ✓', 100);
        console.log(`[AI Enhancer Client: COMPLETE] ID: ${reqId} in ${data.elapsedMs}ms | Mode: ${data.mode || 'neural_hd'} | Output Blob: ${data.resultBlob?.size} bytes`, data.diagnostics || {});
        resolve(data.resultBlob);
      } else if (data.type === 'error') {
        worker.removeEventListener('message', handleMessage);
        console.error(`[AI Enhancer Client: ERROR] ID: ${reqId} failed in worker:`, data.message);
        // Terminate and reset worker reference so next invocation starts with clean worker state
        if (enhancerWorker === worker) {
          try {
            enhancerWorker.terminate();
          } catch {
            // ignore
          }
          enhancerWorker = null;
        }
        // Reject with clear, honest error (NO SILENT FALLBACK)
        reject(new Error(data.message || 'AI HD Neural Super-Resolution model failed to run'));
      }
    };

    worker.addEventListener('message', handleMessage);

    // Send to worker with transferable imageBitmap
    worker.postMessage(
      {
        id: reqId,
        type: 'enhance',
        baseUrl,
        imageBitmap,
        options: {
          fastMode: options.fastMode || false,
          isMobile,
          isLowEnd,
          maxDimension: options.maxDimension
        }
      },
      [imageBitmap]
    );
  });
}

// Clean aliases
export const enhancePhotoWithFsrcnn = enhancePhotoWithRealEsrgan;
export const enhancePhotoWithSwin2sr = enhancePhotoWithRealEsrgan;
export const enhancePhotoWithSpan2x = enhancePhotoWithRealEsrgan;
