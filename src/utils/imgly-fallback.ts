/**
 * @imgly/background-removal Fallback Utility
 * Provides automatic WebGPU -> WASM hardware acceleration with the isnet model.
 */
import { removeBackground } from "@imgly/background-removal";

export interface ImglyProgressCallback {
  (step: string, percent: number): void;
}

/**
 * Executes high-accuracy background removal using @imgly/background-removal
 * Automatically selects WebGPU if available, falling back seamlessly to WASM.
 *
 * @param imageInput - Blob, File, or image URL
 * @param onProgress - Optional callback reporting real-time step and percent
 * @returns Promise<Blob> - Transparent PNG Blob
 */
export async function removeBgWithImgly(
  imageInput: Blob | File | string,
  onProgress?: ImglyProgressCallback
): Promise<Blob> {
  const startTime = performance.now();
  console.log('[Imgly Engine] Starting background removal with ISNet model...');

  try {
    const resultBlob = await removeBackground(imageInput, {
      model: "isnet",
      output: {
        format: "image/png",
        quality: 1,
      },
      progress: (key: string, current: number, total: number) => {
        const percent = total > 0 ? Math.round((current / total) * 100) : 50;
        let stepLabel = 'मॉडल लोड हो रहा है...';

        if (key.includes('fetch')) {
          stepLabel = `मॉडल डाउनलोड हो रहा है... (${percent}%)`;
        } else if (key.includes('compute') || key.includes('infer')) {
          stepLabel = `बैकग्राउंड हट रहा है... (${percent}%)`;
        } else if (key.includes('post')) {
          stepLabel = `किनारे रिफाइन हो रहे हैं... (${percent}%)`;
        }

        console.log(`[Imgly Engine] Progress: ${key} - ${percent}%`);
        onProgress?.(stepLabel, percent);
      },
    });

    const elapsed = ((performance.now() - startTime) / 1000).toFixed(2);
    console.log(`[Imgly Engine] Completed background removal in ${elapsed}s (Size: ${(resultBlob.size / 1024).toFixed(1)} KB)`);

    return resultBlob;
  } catch (error: any) {
    console.error('[Imgly Engine] Background removal failed:', error);
    throw error;
  }
}
