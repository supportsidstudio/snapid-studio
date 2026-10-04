/**
 * Background Remover Engine & Image Utilities
 * High-accuracy hybrid pipeline supporting In-Browser WebAssembly AI,
 * Cloud AI API fallback, and client-side manual brush editing.
 */

import BgRemovalWorker from '../workers/bg-removal.worker?worker';

export type BgModelType = 'rmbg' | 'modnet' | 'auto';
export type BgEngineType = 'worker' | 'server' | 'custom_api';
export type BgSubjectCategory = 'auto' | 'people' | 'product' | 'animal' | 'glass';

export interface BgRemovalProgress {
  step: string;
  percent: number;
}

export interface BgRemovalResult {
  cutoutDataUrl: string;
  maskDataUrl: string;
  width: number;
  height: number;
  modelUsed: string;
  inferenceTimeMs: number;
  totalTimeSec: number;
}

let sharedWorker: Worker | null = null;

export function getSharedBgWorker(): Worker {
  if (!sharedWorker && typeof window !== 'undefined') {
    try {
      sharedWorker = new Worker(
        new URL('../workers/bg-removal.worker.ts', import.meta.url),
        { type: 'module' }
      );
    } catch {
      sharedWorker = new BgRemovalWorker();
    }
  }
  return sharedWorker!;
}

/**
 * Preload the AI model in background
 */
export async function preloadBgModel(modelType: BgModelType = 'rmbg'): Promise<void> {
  const worker = getSharedBgWorker();
  const appBaseUrl = typeof window !== 'undefined'
    ? (window.location.origin + window.location.pathname.replace(/\/[^/]*$/, '/'))
    : '/';

  return new Promise((resolve, reject) => {
    const handler = (e: MessageEvent) => {
      if (e.data.type === 'preload-success') {
        worker.removeEventListener('message', handler);
        resolve();
      } else if (e.data.type === 'preload-error') {
        worker.removeEventListener('message', handler);
        reject(new Error(e.data.error));
      }
    };
    worker.addEventListener('message', handler);
    worker.postMessage({ type: 'preload', baseUrl: appBaseUrl, modelType });
  });
}

/**
 * Executes high-accuracy in-browser background removal via Web Worker
 */
export async function removeBackgroundInBrowser(
  imageBlob: Blob,
  modelType: BgModelType = 'rmbg',
  onProgress?: (progress: BgRemovalProgress) => void
): Promise<BgRemovalResult> {
  const worker = getSharedBgWorker();
  const appBaseUrl = typeof window !== 'undefined'
    ? (window.location.origin + window.location.pathname.replace(/\/[^/]*$/, '/'))
    : '/';

  return new Promise((resolve, reject) => {
    const handleMessage = (e: MessageEvent) => {
      if (e.data.type === 'progress') {
        onProgress?.({
          step: e.data.step,
          percent: e.data.percent
        });
      } else if (e.data.type === 'success') {
        worker.removeEventListener('message', handleMessage);
        
        const cutoutBlob: Blob = e.data.blob;
        const maskBlob: Blob = e.data.maskBlob;

        // Convert blobs to Data URLs
        const reader1 = new FileReader();
        reader1.onload = () => {
          const cutoutDataUrl = reader1.result as string;
          const reader2 = new FileReader();
          reader2.onload = () => {
            const maskDataUrl = reader2.result as string;
            resolve({
              cutoutDataUrl,
              maskDataUrl,
              width: e.data.width,
              height: e.data.height,
              modelUsed: e.data.modelUsed || 'RMBG-1.4 AI',
              inferenceTimeMs: e.data.inferenceTimeMs || 0,
              totalTimeSec: e.data.totalTimeSec || 0
            });
          };
          reader2.onerror = reject;
          reader2.readAsDataURL(maskBlob);
        };
        reader1.onerror = reject;
        reader1.readAsDataURL(cutoutBlob);
      } else if (e.data.type === 'error') {
        worker.removeEventListener('message', handleMessage);
        reject(new Error(e.data.error || 'Failed to remove background'));
      }
    };

    worker.addEventListener('message', handleMessage);
    worker.postMessage({
      type: 'removeBackground',
      blob: imageBlob,
      baseUrl: appBaseUrl,
      modelType
    });
  });
}

/**
 * Executes server-side background removal via /api/remove-background
 */
export async function removeBackgroundOnServer(
  imageDataUrl: string,
  options?: {
    modelType?: BgModelType;
    category?: BgSubjectCategory;
    customApiKey?: string;
    customProvider?: 'removebg' | 'photoroom';
  },
  onProgress?: (progress: BgRemovalProgress) => void
): Promise<BgRemovalResult> {
  onProgress?.({ step: 'Sending image to high-accuracy server...', percent: 20 });
  const start = performance.now();

  const response = await fetch('/api/remove-background', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      image: imageDataUrl,
      modelType: options?.modelType || 'rmbg',
      category: options?.category || 'auto',
      customApiKey: options?.customApiKey,
      customProvider: options?.customProvider,
    })
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || `Server responded with ${response.status}`);
  }

  onProgress?.({ step: 'Rendering high-res cutout...', percent: 85 });
  const data = await response.json();
  const elapsed = ((performance.now() - start) / 1000).toFixed(2);

  return {
    cutoutDataUrl: data.cutoutImage,
    maskDataUrl: data.maskImage || data.cutoutImage,
    width: data.width || 1024,
    height: data.height || 1024,
    modelUsed: data.modelUsed || 'Server AI Engine',
    inferenceTimeMs: data.inferenceTimeMs || 0,
    totalTimeSec: Number(elapsed)
  };
}

/**
 * Downloads image directly in browser
 */
export function downloadDataUrl(dataUrl: string, filename: string): void {
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Copies a PNG data URL to system clipboard as image/png
 */
export async function copyImageToClipboard(dataUrl: string): Promise<boolean> {
  try {
    if (!navigator.clipboard || !window.ClipboardItem) return false;
    const res = await fetch(dataUrl);
    const blob = await res.blob();
    const item = new ClipboardItem({ 'image/png': blob });
    await navigator.clipboard.write([item]);
    return true;
  } catch (err) {
    console.warn('Clipboard copy error:', err);
    return false;
  }
}
