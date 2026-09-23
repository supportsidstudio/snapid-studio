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
 * 5. High-Fidelity Neural HD: Pure Real-ESRGAN super-resolution with zero classical quality compromises.
 */

import AiEnhancerWorker from '../workers/ai-enhancer.worker?worker';

export interface EnhanceProgressData {
  phase: 'preparing' | 'enhancing' | 'finalizing' | 'complete';
  stepText: string;
  percent: number;
  currentStep: number;
  totalSteps: number;
  completedSteps: number;
  remainingTimeText?: string | null;
}

export interface EnhancementProgressCallback {
  (step: string, percent?: number, progressData?: EnhanceProgressData): void;
}

export interface EnhanceOptions {
  maxDimension?: number;
}

let enhancerWorker: Worker | null = null;
let currentRequestId = 0;

/**
 * Detects if current machine is a low-spec device (e.g. 2 cores, <=4GB RAM, or low-tier mobile)
 * Commonly found in Cyber Cafes, eMitra centers, and budget setups.
 */
export function isLowSpecDevice(): boolean {
  if (typeof navigator === 'undefined') return false;
  const cores = typeof navigator.hardwareConcurrency === 'number' ? navigator.hardwareConcurrency : 4;
  const memory = typeof (navigator as any)?.deviceMemory === 'number' ? (navigator as any).deviceMemory : 4;
  const isMobile = typeof window !== 'undefined' && (
    /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent) || window.innerWidth <= 768
  );
  return (cores <= 2 || memory <= 4) || (isMobile && (cores <= 4 || memory <= 4));
}

function getClientBaseUrl(): string {
  if (typeof window !== 'undefined' && window.location) {
    const origin = window.location.origin;
    const pathname = window.location.pathname.replace(/\/[^/]*$/, '/');
    return `${origin}${pathname}`;
  }
  return '/';
}

function getEnhancerWorker(): Worker {
  if (!enhancerWorker && typeof window !== 'undefined') {
    try {
      enhancerWorker = new Worker(
        new URL('../workers/ai-enhancer.worker.ts', import.meta.url),
        { type: 'module' }
      );
    } catch {
      enhancerWorker = new AiEnhancerWorker();
    }
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
 * 🚀 AI HD Photo Enhancement Pipeline (Web Worker Offloaded)
 * NEVER silently falls back to classical processing. Returns actual AI neural result or throws error.
 */
export async function enhancePhotoWithRealEsrgan(
  inputBlob: Blob,
  onProgress?: EnhancementProgressCallback,
  options: EnhanceOptions = {}
): Promise<Blob> {
  const reqId = `enhance_${++currentRequestId}_${Date.now()}`;
  onProgress?.('Preparing your photo...', 0, {
    phase: 'preparing',
    stepText: 'Preparing your photo...',
    percent: 0,
    currentStep: 0,
    totalSteps: 0,
    completedSteps: 0,
    remainingTimeText: null,
  });

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

  console.log(`[AI Enhancer Client: INVOKE] ID: ${reqId} | Mode: Real-ESRGAN Neural HD | Blob Size: ${inputBlob.size} bytes | Device: ${isMobile ? (isLowEnd ? 'Low-End Mobile' : 'Mid/High-End Mobile') : (isLowEnd ? 'Low-Spec Desktop' : 'Standard Desktop')} (cores: ${cores}, RAM: ${memory}GB)`);

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
        const progressData: EnhanceProgressData = {
          phase: data.phase || 'enhancing',
          stepText: data.step || '✨ Enhancing your photo...',
          percent: typeof data.percent === 'number' ? data.percent : 0,
          currentStep: data.currentStep || 0,
          totalSteps: data.totalSteps || 0,
          completedSteps: data.completedSteps || 0,
          remainingTimeText: data.remainingTimeText || null,
        };
        onProgress?.(data.step, data.percent, progressData);
      } else if (data.type === 'complete') {
        worker.removeEventListener('message', handleMessage);
        const total = data.diagnostics?.totalTiles || 1;
        onProgress?.('🎉 Enhancement Complete!', 100, {
          phase: 'complete',
          stepText: '🎉 Enhancement Complete!',
          percent: 100,
          currentStep: total,
          totalSteps: total,
          completedSteps: total,
          remainingTimeText: null,
        });
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
