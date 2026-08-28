import React, { useState, useRef, useEffect } from 'react';
import { 
  Upload, 
  Sparkles, 
  Download, 
  RefreshCw, 
  Maximize2, 
  RotateCw, 
  Sun, 
  Sliders, 
  Check, 
  Layout, 
  Image as ImageIcon,
  Printer,
  ChevronRight,
  Eye,
  FileDown,
  Camera
} from 'lucide-react';
import { 
  AppLanguage, 
  AppTheme, 
  PassportPresetId, 
  PassportSizePreset, 
  SheetSizeId, 
  SheetSizePreset, 
  ImageCropState 
} from '../types';
import { translations } from '../translations';
import { jsPDF } from 'jspdf';
import BgRemovalWorker from '../workers/bg-removal.worker?worker';

let bgWorker: Worker | null = null;

const getWorker = () => {
  if (!bgWorker && typeof window !== 'undefined') {
    bgWorker = new BgRemovalWorker();
  }
  return bgWorker;
};

const enhancePassportPhoto = (blob: Blob): Promise<Blob> => {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(blob);
    img.src = url;
    
    img.onload = () => {
      URL.revokeObjectURL(url);
      
      const width = img.naturalWidth;
      const height = img.naturalHeight;
      
      if (width === 0 || height === 0) {
        resolve(blob);
        return;
      }
      
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(blob);
        return;
      }
      
      ctx.drawImage(img, 0, 0);
      const imgData = ctx.getImageData(0, 0, width, height);
      const data = imgData.data;
      
      // --- PART 1: AUTO BRIGHTNESS ADJUSTMENT ---
      let totalLuminance = 0;
      let subjectPixelCount = 0;
      
      for (let i = 0; i < data.length; i += 4) {
        const a = data[i + 3];
        if (a > 50) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          // Standard luma formula (ITU-R BT.709)
          const luma = 0.2126 * r + 0.7152 * g + 0.0722 * b;
          totalLuminance += luma;
          subjectPixelCount++;
        }
      }
      
      let multiplier = 1.0;
      if (subjectPixelCount > 0) {
        const avgLuminance = totalLuminance / subjectPixelCount;
        
        // Soft standard passport luma range is 120 - 150
        if (avgLuminance < 120) {
          // Gently brighten dark photos
          multiplier = Math.min(1.15, 132 / avgLuminance);
        } else if (avgLuminance > 160) {
          // Gently dim overexposed photos
          multiplier = Math.max(0.88, 148 / avgLuminance);
        }
      }
      
      // Skin detection function covering light, olive, brown, and dark skin tones
      const isSkinPixel = (r: number, g: number, b: number) => {
        if (r < 50 || g < 35 || b < 22) return false;
        if (r <= g) return false;
        const rGDiff = r - g;
        if (rGDiff < 10 || rGDiff > 75) return false;
        if (g < b) return false;
        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        if (max - min < 15) return false;
        return true;
      };
      
      // Apply brightness factor first directly to the output buffer
      if (multiplier !== 1.0) {
        for (let i = 0; i < data.length; i += 4) {
          if (data[i + 3] > 50) {
            data[i] = Math.max(0, Math.min(255, data[i] * multiplier));
            data[i + 1] = Math.max(0, Math.min(255, data[i + 1] * multiplier));
            data[i + 2] = Math.max(0, Math.min(255, data[i + 2] * multiplier));
          }
        }
      }
      
      // Copy the brightened state to srcData as the reading source
      const srcData = new Uint8ClampedArray(data);
      
      // Pass 2: Selective Bilateral Smoothing (preserving sharp features)
      const radius = 1; // 3x3 window is 3x faster than 5x5 and visually indistinguishable for skin-smoothing
      const colorThreshold = 35; // Maximum pixel color difference to smooth
      const blendFactor = 0.65; // Blends 65% smooth skin with 35% original to keep microtexture natural
      
      // Performance optimization: Process only the bounding box of non-transparent pixels
      let minX = width;
      let maxX = 0;
      let minY = height;
      let maxY = 0;
      let hasSubject = false;

      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const idx = (y * width + x) * 4;
          if (srcData[idx + 3] > 50) {
            if (x < minX) minX = x;
            if (x > maxX) maxX = x;
            if (y < minY) minY = y;
            if (y > maxY) maxY = y;
            hasSubject = true;
          }
        }
      }

      if (hasSubject) {
        const margin = 2;
        const startY = Math.max(0, minY - margin);
        const endY = Math.min(height - 1, maxY + margin);
        const startX = Math.max(0, minX - margin);
        const endX = Math.min(width - 1, maxX + margin);

        for (let y = startY; y <= endY; y++) {
          for (let x = startX; x <= endX; x++) {
            const idx = (y * width + x) * 4;
            const a = srcData[idx + 3];
            
            if (a > 50) {
              const r = srcData[idx];
              const g = srcData[idx + 1];
              const b = srcData[idx + 2];
              
              if (isSkinPixel(r, g, b)) {
                let rSum = 0;
                let gSum = 0;
                let bSum = 0;
                let weightSum = 0;
                
                for (let ky = -radius; ky <= radius; ky++) {
                  const ny = y + ky;
                  if (ny < 0 || ny >= height) continue;
                  
                  for (let kx = -radius; kx <= radius; kx++) {
                    const nx = x + kx;
                    if (nx < 0 || nx >= width) continue;
                    
                    const nIdx = (ny * width + nx) * 4;
                    const nA = srcData[nIdx + 3];
                    
                    if (nA > 50) {
                      const nR = srcData[nIdx];
                      const nG = srcData[nIdx + 1];
                      const nB = srcData[nIdx + 2];
                      
                      if (isSkinPixel(nR, nG, nB)) {
                        const colorDist = Math.abs(r - nR) + Math.abs(g - nG) + Math.abs(b - nB);
                        if (colorDist < colorThreshold) {
                          const weight = 1.0 - (colorDist / (colorThreshold * 1.5));
                          rSum += nR * weight;
                          gSum += nG * weight;
                          bSum += nB * weight;
                          weightSum += weight;
                        }
                      }
                    }
                  }
                }
                
                if (weightSum > 0) {
                  const smoothedR = rSum / weightSum;
                  const smoothedG = gSum / weightSum;
                  const smoothedB = bSum / weightSum;
                  
                  data[idx] = Math.max(0, Math.min(255, smoothedR * blendFactor + r * (1 - blendFactor)));
                  data[idx + 1] = Math.max(0, Math.min(255, smoothedG * blendFactor + g * (1 - blendFactor)));
                  data[idx + 2] = Math.max(0, Math.min(255, smoothedB * blendFactor + b * (1 - blendFactor)));
                }
              }
            }
          }
        }
      }
      
      ctx.putImageData(imgData, 0, 0);
      canvas.toBlob((enhancedBlob) => {
        resolve(enhancedBlob || blob);
      }, 'image/png');
    };
    
    img.onerror = () => {
      resolve(blob);
    };
  });
};

const U2NETP_CONFIG = {
  model: 'u2netp.onnx',
  inputSize: 320,
  license: 'Apache-2.0'
};

let preloadPromise: Promise<void> | null = null;

const globalPreload = async (): Promise<void> => {
  if (preloadPromise) {
    return preloadPromise;
  }

  preloadPromise = (async () => {
    const worker = getWorker();
    if (!worker) return;

    return new Promise<void>((resolve, reject) => {
      const handleMessage = (e: MessageEvent) => {
        if (e.data.type === 'preload-success') {
          worker.removeEventListener('message', handleMessage);
          resolve();
        } else if (e.data.type === 'preload-error') {
          worker.removeEventListener('message', handleMessage);
          reject(new Error(e.data.error));
        }
      };
      worker.addEventListener('message', handleMessage);
      worker.postMessage({ type: 'preload' });
    });
  })();

  try {
    await preloadPromise;
  } catch (err) {
    preloadPromise = null;
    throw err;
  }
};

interface PassportSectionProps {
  language: AppLanguage;
  theme: AppTheme;
}

const PASSPORT_PRESETS: PassportSizePreset[] = [
  { id: 'eu_uk', nameEn: 'Standard Passport (35 x 45 mm)', nameHi: 'पासपोर्ट मानक (35 x 45 मिमी)', widthMm: 35, heightMm: 45, aspectRatio: 35 / 45 },
  { id: 'india_us', nameEn: 'US Square / OCI Standard (2" x 2")', nameHi: 'यूएस / ओसीआई वर्ग मानक (2" x 2")', widthMm: 51, heightMm: 51, aspectRatio: 1 },
  { id: 'oci_visa', nameEn: 'OCI Visa / Custom (35 x 35 mm)', nameHi: 'ओसीआई वीजा / कस्टम (35 x 35 मिमी)', widthMm: 35, heightMm: 35, aspectRatio: 1 },
  { id: 'stamp', nameEn: 'Stamp Size (20 x 25 mm)', nameHi: 'स्टाम्प आकार (20 x 25 मिमी)', widthMm: 20, heightMm: 25, aspectRatio: 20 / 25 },
];

const SHEET_SIZE_PRESETS: SheetSizePreset[] = [
  { id: 'single', nameEn: 'Single Photo (Individual)', nameHi: 'एकल उच्च-गुणवत्ता फोटो', widthMm: 0, heightMm: 0, photosCount: 1, cols: 1 },
  { id: 'size_a4', nameEn: 'A4 Standard Sheet', nameHi: 'A4 स्टैंडर्ड पेज (30 फोटो)', widthMm: 210, heightMm: 297, photosCount: 30, cols: 5 },
];

export default function PassportSection({ language, theme }: PassportSectionProps) {
  const t = translations[language];

  // Image upload states
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [removedBgImg, setRemovedBgImg] = useState<string | null>(null);
  
  // Settings & Toggles
  const [sizePreset, setSizePreset] = useState<PassportPresetId>('eu_uk');
  const [sheetSize, setSheetSize] = useState<SheetSizeId>('size_a4');

  // eMitra & Cyber Cafe Direct Print Settings
  const [printPaperSize, setPrintPaperSize] = useState<'a4'>('a4');
  const [printOrientation, setPrintOrientation] = useState<'portrait' | 'landscape'>('portrait');
  const [printCopiesMode, setPrintCopiesMode] = useState<'single' | 'multiple'>('multiple');

  // Automatically keep print properties in sync with sheet selections
  useEffect(() => {
    if (sheetSize === 'single') {
      if (printCopiesMode !== 'single') setPrintCopiesMode('single');
    } else if (sheetSize === 'size_a4') {
      if (printPaperSize !== 'a4') setPrintPaperSize('a4');
      if (printCopiesMode !== 'multiple') setPrintCopiesMode('multiple');
    } else if (sheetSize === 'single_a4_centered') {
      if (printCopiesMode !== 'single') setPrintCopiesMode('single');
      if (printPaperSize !== 'a4') setPrintPaperSize('a4');
    }
  }, [sheetSize]);

  useEffect(() => {
    if (printCopiesMode === 'single') {
      if (sheetSize !== 'single_a4_centered' && sheetSize !== 'single') {
        setSheetSize('single_a4_centered');
      }
    } else {
      if (sheetSize !== 'size_a4') {
        setSheetSize('size_a4');
      }
    }
  }, [printCopiesMode, printPaperSize]);

  // Background selection
  const [bgColorType, setBgColorType] = useState<'white' | 'blue' | 'red' | 'transparent' | 'custom'>('white');
  const [customBgColor, setCustomBgColor] = useState('#ffffff');
  
  // AI Progress
  const [isRemovingBg, setIsRemovingBg] = useState(false);
  const [aiStep, setAiStep] = useState<string>('');

  // Background removal error state
  const [bgRemovalError, setBgRemovalError] = useState(false);
  const errorFileInputRef = useRef<HTMLInputElement>(null);
  
  // Crop states (Zoom & Pan & Rotate)
  const [zoom, setZoom] = useState(1.0);
  const [panX, setPanX] = useState(0); // offset pixels
  const [panY, setPanY] = useState(0);
  const [rotation, setRotation] = useState(0); // -180 to 180 degrees
  
  // Color filters
  const [brightness, setBrightness] = useState(100); // 100%
  const [contrast, setContrast] = useState(100); // 100%
  
  // Borders
  const [borderWidth, setBorderWidth] = useState(0.25); // mm border thickness (0.25mm matches standard 1px crisp border)
  const [borderColor, setBorderColor] = useState('#000000'); // simple black border by default
  
  // UI Panels
  const [activeTab, setActiveTab] = useState<'adjust' | 'sheet'>('adjust');
  const [isDragOver, setIsDragOver] = useState(false);

  // Refs
  const containerRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  const sheetCanvasRef = useRef<HTMLCanvasElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  // Serial queue for local AI background removal (prevents concurrent execution of ONNX sessions)
  const bgRemovalChainRef = useRef<Promise<any>>(Promise.resolve());
  const latestRequestedSrcRef = useRef<string | null>(null);
  const pendingRequestsCountRef = useRef<number>(0);

  // Mobile device detection
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(/Mobi|Android|iPhone|iPad|Macintosh/i.test(navigator.userAgent) || window.innerWidth < 1024);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    const preloadModel = async () => {
      try {
        await globalPreload();
      } catch (err) {
        console.warn('Failed to preload background removal model:', err);
      }
    };
    preloadModel();
  }, []);

  const selectedSizePreset = PASSPORT_PRESETS.find(p => p.id === sizePreset) || PASSPORT_PRESETS[0];
  const selectedSheetPreset = SHEET_SIZE_PRESETS.find(p => p.id === sheetSize) || SHEET_SIZE_PRESETS[0];

  const [photosCopiesCount, setPhotosCopiesCount] = useState<number>(8);
  const [showBeforePreview, setShowBeforePreview] = useState<boolean>(false);
  const [singleCanvasUpdated, setSingleCanvasUpdated] = useState<number>(0);

  // Local optimization: downscale/compress before sending to browser-based AI model (greatly reduces RAM and ONNX execution time)
  // Set default maxDim to 1024 for extremely fast processing without any print quality loss
  const resizeAndCompressImage = (file: File, maxDim = 1024, quality = 0.90): Promise<string> => {
    return new Promise((resolve) => {
      const startTime = performance.now();
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const originalW = img.naturalWidth || img.width;
          const originalH = img.naturalHeight || img.height;
          let { width, height } = img;
          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            console.log(`[RESIZE] Canvas context unavailable, kept original. Size: ${originalW}x${originalH}`);
            resolve(e.target?.result as string);
            return;
          }
          ctx.drawImage(img, 0, 0, width, height);
          const dataUrl = canvas.toDataURL('image/jpeg', quality);
          const elapsed = (performance.now() - startTime).toFixed(1);
          console.log(`[RESIZE CONFIRMED] Original: ${originalW}x${originalH}px -> Resized: ${width}x${height}px (Max Dimension: ${maxDim}px) in ${elapsed}ms`);
          resolve(dataUrl);
        };
        img.onerror = () => {
          console.warn('[RESIZE] Image failed to load for resizing');
          resolve(e.target?.result as string);
        };
        img.src = e.target?.result as string;
      };
      reader.onerror = () => {
        console.warn('[RESIZE] FileReader failed');
        resolve('');
      };
      reader.readAsDataURL(file);
    });
  };

  // Reset states on new photo upload
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      await setupImage(file);
      // Clear value so the same or another photo can be selected/re-selected instantly
      e.target.value = '';
    }
  };

  const setupImage = async (file: File) => {
    setIsRemovingBg(true);
    setAiStep('Loading Image...');
    try {
      // Preserve full image quality (up to 2048px for sharp 300DPI passport printing)
      const optimizedUrl = await resizeAndCompressImage(file, 2048, 0.95);
      setOriginalImage(optimizedUrl);
      setRemovedBgImg(null);
      setZoom(1.0);
      setPanX(0);
      setPanY(0);
      setRotation(0);
      setBrightness(100);
      setContrast(100);
      setActiveTab('adjust');
      setShowBeforePreview(false); // Render the AI background removed by default

      // Run automatic U²-NetP background removal
      await runBackgroundRemoval(optimizedUrl);
    } catch (err) {
      console.error('Image pre-processing failed:', err);
      setIsRemovingBg(false);
    }
  };

  // Drag and Drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      await setupImage(e.dataTransfer.files[0]);
    }
  };

  // Run AI Background removal in browser client-side using U²-NetP ONNX
  const runBackgroundRemoval = (imageSrcToUse?: string) => {
    const src = imageSrcToUse || originalImage;
    if (!src) return;

    setBgRemovalError(false);
    setIsRemovingBg(true);
    setAiStep('U²-NetP AI Model starting...');
    latestRequestedSrcRef.current = src;
    pendingRequestsCountRef.current++;

    // Chain the request to ensure serial, non-overlapping execution
    bgRemovalChainRef.current = bgRemovalChainRef.current
      .then(async () => {
        // Decrease pending count on start of execution
        pendingRequestsCountRef.current--;

        // If a newer image request has been initiated, skip processing this older one
        if (src !== latestRequestedSrcRef.current) {
          if (pendingRequestsCountRef.current === 0) {
            setIsRemovingBg(false);
          }
          return;
        }

        setAiStep('Loading U²-NetP ONNX Session...');

        try {
          const overallStart = performance.now();
          console.log(`[U2-NetP PIPELINE] Started at ${new Date().toLocaleTimeString()} with config:`, U2NETP_CONFIG);

          // Fetch image and build file blob
          const fetchStart = performance.now();
          const response = await fetch(src);
          const inputBlob = await response.blob();
          console.log(`[U2-NetP PIPELINE] Image Blob: ${(inputBlob.size / 1024).toFixed(1)} KB (prepared in ${(performance.now() - fetchStart).toFixed(1)}ms)`);
          
          const worker = getWorker();
          if (!worker) throw new Error('U²-NetP Worker could not be initialized');

          const aiInferenceStart = performance.now();
          const resultBlob = await new Promise<Blob>((resolve, reject) => {
            const handleMessage = (e: MessageEvent) => {
              if (e.data.type === 'progress') {
                if (src !== latestRequestedSrcRef.current) return;
                const { step, percent } = e.data;
                setAiStep(`${step || 'Processing'} (${percent || 0}%)`);
              } else if (e.data.type === 'success') {
                worker.removeEventListener('message', handleMessage);
                resolve(e.data.blob);
              } else if (e.data.type === 'error') {
                worker.removeEventListener('message', handleMessage);
                reject(new Error(e.data.error));
              }
            };
            worker.addEventListener('message', handleMessage);
            worker.postMessage({
              type: 'removeBackground',
              blob: inputBlob
            });
          });

          const aiElapsed = ((performance.now() - aiInferenceStart) / 1000).toFixed(2);
          console.log(`[U2-NetP PIPELINE] U²-NetP ONNX background removal finished in ${aiElapsed}s`);

          setAiStep('Polishing Portrait... (Auto-Brightness & Skin Smoothing)');
          const polishStart = performance.now();
          const enhancedBlob = await enhancePassportPhoto(resultBlob);
          const polishElapsed = (performance.now() - polishStart).toFixed(1);
          console.log(`[U2-NetP PIPELINE] Portrait enhance & skin smoothing finished in ${polishElapsed}ms`);

          const totalElapsed = ((performance.now() - overallStart) / 1000).toFixed(2);
          console.log(`[U2-NetP PIPELINE TOTAL] Entire process completed in ${totalElapsed}s`);

          // Only update the state if this represents the latest requested image
          if (src === latestRequestedSrcRef.current) {
            const transparentUrl = URL.createObjectURL(enhancedBlob);
            setRemovedBgImg(transparentUrl);
          }
        } catch (err) {
          console.error('Error removing background via U²-NetP ONNX:', err);
          setBgRemovalError(true);
        } finally {
          // If no more pending tasks in queue, stop the loading animation
          if (pendingRequestsCountRef.current === 0) {
            setIsRemovingBg(false);
          }
        }
      })
      .catch((err) => {
        console.error('Unhandled error in U²-NetP background removal queue:', err);
        setBgRemovalError(true);
        if (pendingRequestsCountRef.current === 0) {
          setIsRemovingBg(false);
        }
      });
  };

  // Get background color string
  const getBackgroundColor = () => {
    switch (bgColorType) {
      case 'white': return '#ffffff';
      case 'blue': return '#00a4e4';
      case 'red': return '#d21034';
      case 'transparent': return 'transparent';
      case 'custom': return customBgColor;
    }
  };

  // Drag to Pan inside Cropper
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!originalImage || activeTab === 'sheet') return;
    isDraggingRef.current = true;
    dragStartRef.current = { x: e.clientX - panX, y: e.clientY - panY };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingRef.current) return;
    setPanX(e.clientX - dragStartRef.current.x);
    setPanY(e.clientY - dragStartRef.current.y);
  };

  const handleMouseUpOrLeave = () => {
    isDraggingRef.current = false;
  };

  // Live Canvas Sync representing single Passport Photo cropped
  useEffect(() => {
    const canvas = previewCanvasRef.current;
    if (!canvas || !originalImage) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.onload = () => {
      // Set canvas to a clean high-resolution (600x600 px range depending on standard aspect ratio)
      const baseWidth = 600;
      const baseHeight = baseWidth / selectedSizePreset.aspectRatio;
      canvas.width = baseWidth;
      canvas.height = baseHeight;

      ctx.clearRect(0, 0, baseWidth, baseHeight);

      // Fill background color
      const bgColor = getBackgroundColor();
      if (showBeforePreview) {
        // Draw normal white background or transparent checkerboard for "Before" overview
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, baseWidth, baseHeight);
      } else if (bgColor === 'transparent') {
        // Draw standard grey grid checkerboard
        ctx.fillStyle = '#e5e7eb';
        ctx.fillRect(0, 0, baseWidth, baseHeight);
        ctx.fillStyle = '#f3f4f6';
        const size = 16;
        for (let y = 0; y < baseHeight; y += size * 2) {
          for (let x = 0; x < baseWidth; x += size * 2) {
            ctx.fillRect(x, y, size, size);
            ctx.fillRect(x + size, y + size, size, size);
          }
        }
      } else {
        ctx.fillStyle = bgColor;
        ctx.fillRect(0, 0, baseWidth, baseHeight);
      }

      // Draw portrait with transforms
      ctx.save();
      
      // Move coordinate to center of crop canvas for rotations and scaling
      ctx.translate(baseWidth / 2 + panX, baseHeight / 2 + panY);
      ctx.rotate((rotation * Math.PI) / 180);
      
      // Calculate scaled image sizing to cover the canvas area (preventing empty borders showing at the sides of the passport photo)
      const scaleImgWidth = img.width;
      const scaleImgHeight = img.height;
      // Use Math.max to fully cover the target viewport aspect ratio
      const fitScale = Math.max(baseWidth / scaleImgWidth, baseHeight / scaleImgHeight);
      
      const drawWidth = scaleImgWidth * fitScale * zoom;
      const drawHeight = scaleImgHeight * fitScale * zoom;

      // Apply brightness/contrast filters directly
      ctx.filter = `brightness(${brightness}%) contrast(${contrast}%)`;

      ctx.drawImage(
        img,
        -drawWidth / 2,
        -drawHeight / 2,
        drawWidth,
        drawHeight
      );

      ctx.restore();

      // If user selected borders, draw inside frame
      if (borderWidth > 0) {
        ctx.strokeStyle = borderColor;
        // Convert border thickness relative to canvas size
        const ratio = baseWidth / selectedSizePreset.widthMm;
        const strokePx = borderWidth * ratio;
        ctx.lineWidth = strokePx;
        ctx.strokeRect(strokePx / 2, strokePx / 2, baseWidth - strokePx, baseHeight - strokePx);
      }

      setSingleCanvasUpdated(prev => prev + 1);
    };
    img.src = (removedBgImg && !showBeforePreview) ? removedBgImg : originalImage;
  }, [
    originalImage, 
    removedBgImg, 
    showBeforePreview,
    sizePreset, 
    bgColorType, 
    customBgColor, 
    zoom, 
    panX, 
    panY, 
    rotation, 
    brightness, 
    contrast,
    borderWidth,
    borderColor
  ]);

  // Live Sheet lay-up render grid sheet preview
  useEffect(() => {
    const sheetCanvas = sheetCanvasRef.current;
    if (!sheetCanvas || !previewCanvasRef.current || !originalImage) return;

    const ctx = sheetCanvas.getContext('2d');
    if (!ctx) return;

    // Wait until single card renderer finishes
    const singleCanvas = previewCanvasRef.current;
    
    // Physical Page Config
    let pageWidthMm = selectedSheetPreset.widthMm;
    let pageHeightMm = selectedSheetPreset.heightMm;
    
    if (sheetSize === 'single') {
      pageWidthMm = selectedSizePreset.widthMm + (borderWidth * 2);
      pageHeightMm = selectedSizePreset.heightMm + (borderWidth * 2);
    } else if (sheetSize === 'single_a4_centered') {
      pageWidthMm = printOrientation === 'portrait' ? 210 : 297;
      pageHeightMm = printOrientation === 'portrait' ? 297 : 210;
    } else {
      // Respect orientation setting for sheet grids!
      const wBase = selectedSheetPreset.widthMm || 210;
      const hBase = selectedSheetPreset.heightMm || 297;
      pageWidthMm = printOrientation === 'portrait' ? wBase : hBase;
      pageHeightMm = printOrientation === 'portrait' ? hBase : wBase;
    }

    // Set 300 DPI high-res scale (1 inch = 25.4 mm)
    const dpm = 300 / 25.4; // pixels per mm (~11.81 px/mm)
    const widthPx = Math.round(pageWidthMm * dpm);
    const heightPx = Math.round(pageHeightMm * dpm);

    sheetCanvas.width = widthPx;
    sheetCanvas.height = heightPx;

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, widthPx, heightPx);

    if (sheetSize === 'single') {
      // Draw standard single passport size directly centered (standalone download)
      ctx.drawImage(singleCanvas, 0, 0, widthPx, heightPx);
      return;
    }

    const photoWidthPx = Math.round(selectedSizePreset.widthMm * dpm);
    const photoHeightPx = Math.round(selectedSizePreset.heightMm * dpm);

    if (sheetSize === 'single_a4_centered') {
      // Draw exactly one photo centered on the A4 page template
      const px = Math.round((widthPx - photoWidthPx) / 2);
      const py = Math.round((heightPx - photoHeightPx) / 2);

      // Draw faint cut mark around card limit
      ctx.strokeStyle = borderColor;
      ctx.lineWidth = 1;
      ctx.strokeRect(px - 1, py - 1, photoWidthPx + 2, photoHeightPx + 2);

      ctx.drawImage(singleCanvas, px, py, photoWidthPx, photoHeightPx);
      return;
    }

    // Sheet layouts
    const gapPx = Math.round(4 * dpm); // 4mm gaps between photos

    let numPhotos = photosCopiesCount;
    let numCols = 4;
    if (numPhotos === 4) numCols = 2;
    else if (numPhotos === 6) numCols = 3;
    else if (numPhotos === 8) numCols = 4;
    else if (numPhotos === 12) numCols = 4;
    else if (numPhotos === 16) numCols = 4;

    // Recalculate columns relative to constraints of page size (aligned with selected orientation)
    if (sheetSize === 'size_a4') {
      const maxCols = Math.floor((pageWidthMm - 20) / (selectedSizePreset.widthMm + 4)); // 20mm margin
      numCols = Math.max(1, Math.min(maxCols, numCols));
      const maxRows = Math.floor((pageHeightMm - 20) / (selectedSizePreset.heightMm + 4));
      numPhotos = Math.min(photosCopiesCount, numCols * maxRows);
    } else if (sheetSize === 'size_4x6') {
      // Fit max onto 4x6"
      const fitsWide = Math.floor((pageWidthMm - 10) / (selectedSizePreset.widthMm + 3));
      const fitsTall = Math.floor((pageHeightMm - 10) / (selectedSizePreset.heightMm + 3));
      numCols = Math.max(1, Math.min(fitsWide, numCols));
      numPhotos = Math.min(photosCopiesCount, numCols * fitsTall);
    }

    // Compute layout margins to center the entire grid
    const totalGridWidth = (numCols * photoWidthPx) + ((numCols - 1) * gapPx);
    const numRows = Math.ceil(numPhotos / numCols);
    const totalGridHeight = (numRows * photoHeightPx) + ((numRows - 1) * gapPx);
    
    const startX = Math.round((widthPx - totalGridWidth) / 2);
    const startY = Math.round((heightPx - totalGridHeight) / 2);

    // Render photo copies
    for (let i = 0; i < numPhotos; i++) {
      const row = Math.floor(i / numCols);
      const col = i % numCols;

      const px = startX + (col * (photoWidthPx + gapPx));
      const py = startY + (row * (photoHeightPx + gapPx));

      // Draw faint cut mark around card limit
      ctx.strokeStyle = borderColor;
      ctx.lineWidth = 1;
      ctx.strokeRect(px - 1, py - 1, photoWidthPx + 2, photoHeightPx + 2);

      ctx.drawImage(singleCanvas, px, py, photoWidthPx, photoHeightPx);
    }
  }, [
    sizePreset, 
    sheetSize, 
    photosCopiesCount,
    originalImage, 
    removedBgImg, 
    bgColorType, 
    customBgColor,
    zoom, 
    panX, 
    panY, 
    rotation, 
    brightness, 
    contrast, 
    borderWidth, 
    borderColor,
    printPaperSize,
    printOrientation,
    printCopiesMode,
    singleCanvasUpdated
  ]);

  // Download Single Cropped Photo
  const downloadSinglePhoto = () => {
    if (!previewCanvasRef.current) return;
    const link = document.createElement('a');
    link.download = `SnapID_Passport_${selectedSizePreset.id}_single.png`;
    link.href = previewCanvasRef.current.toDataURL('image/png');
    link.click();
  };

  // Download Entire Compiled Sheet layout as PNG
  const downloadSheetPng = () => {
    if (!sheetCanvasRef.current) return;
    const link = document.createElement('a');
    link.download = `SnapID_Passport_${selectedSizePreset.id}_sheet_${selectedSheetPreset.id}.png`;
    link.href = sheetCanvasRef.current.toDataURL('image/png');
    link.click();
  };

  // Download Exact Millimetric High-Quality PDF ready-for-print
  const downloadSheetPdf = () => {
    if (!previewCanvasRef.current) return;

    try {
      // Setup PDF in millimeters
      const isSingleRaw = sheetSize === 'single';
      const isSingleA4 = sheetSize === 'single_a4_centered';
      const isA4 = sheetSize === 'size_a4' || isSingleA4;
      const is4x6 = sheetSize === 'size_4x6';
      
      let widthMm = 210;
      let heightMm = 297;
      
      if (isSingleRaw) {
        widthMm = selectedSizePreset.widthMm + (borderWidth * 2);
        heightMm = selectedSizePreset.heightMm + (borderWidth * 2);
      } else if (is4x6) {
        widthMm = printOrientation === 'portrait' ? 101.6 : 152.4;
        heightMm = printOrientation === 'portrait' ? 152.4 : 101.6;
      } else {
        // A4 pages
        widthMm = printOrientation === 'portrait' ? 210 : 297;
        heightMm = printOrientation === 'portrait' ? 297 : 210;
      }
      
      const orientation = printOrientation === 'portrait' ? 'portrait' : 'landscape';
      const format = isSingleRaw ? [widthMm, heightMm] : 'a4';

      // Initialize doc with precise physical formats
      const doc = new jsPDF({
        orientation: orientation as any,
        unit: 'mm',
        format: format as any
      });

      const cardImgData = previewCanvasRef.current.toDataURL('image/png');

      if (isSingleRaw) {
        // Just fit the card precisely to the page limits
        doc.addImage(cardImgData, 'PNG', 0, 0, widthMm, heightMm);
      } else if (isSingleA4) {
        // Center single photo on A4
        const photoWidthMm = selectedSizePreset.widthMm;
        const photoHeightMm = selectedSizePreset.heightMm;
        const px = (widthMm - photoWidthMm) / 2;
        const py = (heightMm - photoHeightMm) / 2;
        
        doc.setDrawColor(220, 220, 220);
        doc.setLineWidth(0.1);
        doc.rect(px - 0.2, py - 0.2, photoWidthMm + 0.4, photoHeightMm + 0.4, 'S');
        doc.addImage(cardImgData, 'PNG', px, py, photoWidthMm, photoHeightMm);
      } else {
        // Build millimetric copy placement to match canvas sheets
        const photoWidthMm = selectedSizePreset.widthMm;
        const photoHeightMm = selectedSizePreset.heightMm;
        const gapMm = 4; // 4mm grid gaps
        
        let numPhotos = photosCopiesCount;
        let numCols = 4;
        if (numPhotos === 4) numCols = 2;
        else if (numPhotos === 6) numCols = 3;
        else if (numPhotos === 8) numCols = 4;
        else if (numPhotos === 12) numCols = 4;
        else if (numPhotos === 16) numCols = 4;

        if (isA4) {
          const maxCols = Math.floor((widthMm - 20) / (photoWidthMm + 4));
          numCols = Math.max(1, Math.min(maxCols, numCols));
          const maxRows = Math.floor((heightMm - 20) / (photoHeightMm + 4));
          numPhotos = Math.min(photosCopiesCount, numCols * maxRows);
        } else if (is4x6) {
          const fitsWide = Math.floor((widthMm - 10) / (photoWidthMm + 3));
          const fitsTall = Math.floor((heightMm - 10) / (photoHeightMm + 3));
          numCols = Math.max(1, Math.min(fitsWide, numCols));
          numPhotos = Math.min(photosCopiesCount, numCols * fitsTall);
        }

        const gridWidth = (numCols * photoWidthMm) + ((numCols - 1) * gapMm);
        const numRows = Math.ceil(numPhotos / numCols);
        const gridHeight = (numRows * photoHeightMm) + ((numRows - 1) * gapMm);

        const startX = (widthMm - gridWidth) / 2;
        const startY = (heightMm - gridHeight) / 2;

        for (let i = 0; i < numPhotos; i++) {
          const r = Math.floor(i / numCols);
          const c = i % numCols;

          const px = startX + (c * (photoWidthMm + gapMm));
          const py = startY + (r * (photoHeightMm + gapMm));

          // Draw a very faint cut guidelines
          doc.setDrawColor(240, 240, 240);
          doc.setLineWidth(0.1);
          doc.rect(px - 0.2, py - 0.2, photoWidthMm + 0.4, photoHeightMm + 0.4, 'S');

          // Place portrait
          doc.addImage(cardImgData, 'PNG', px, py, photoWidthMm, photoHeightMm);
        }
      }

      doc.save(`SnapID_Passport_${selectedSizePreset.id}_sheet_${selectedSheetPreset.id}.pdf`);
    } catch (e) {
      console.error('PDF creation error:', e);
      alert('Failed to generate PDF layout. Please try downloading as PNG.');
    }
  };

  // eMitra & Cyber Cafe style instant Direct Print
  const handleDirectPrint = () => {
    if (!sheetCanvasRef.current || !originalImage) {
      alert("Please upload and process an image first before printing.");
      return;
    }
    window.print();
  };

  useEffect(() => {
    const handleBeforePrint = () => {
      if (!sheetCanvasRef.current || !originalImage) return;

      const canvas = sheetCanvasRef.current;
      const dataUrl = canvas.toDataURL('image/png');

      const styleEl = document.createElement('style');
      styleEl.id = 'snapid-print-style';
      const actualPaperSize = printPaperSize === '4x6' ? '101.6mm 152.4mm' : 'A4';
      styleEl.innerHTML = `
        @media print {
          @page {
            size: ${actualPaperSize} ${printOrientation};
            margin: 0mm;
          }
          body > *:not(#snapid-global-print-area) {
            display: none !important;
          }
          #snapid-global-print-area {
            display: flex !important;
            position: fixed !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            height: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            background-color: #ffffff !important;
            justify-content: center !important;
            align-items: center !important;
            z-index: 9999999 !important;
          }
          #snapid-global-print-area img {
            max-width: 100% !important;
            max-height: 100% !important;
            width: auto !important;
            height: auto !important;
            object-fit: contain !important;
            display: block !important;
            image-rendering: -webkit-optimize-contrast !important;
            image-rendering: crisp-edges !important;
          }
        }
      `;
      document.head.appendChild(styleEl);

      const printContainer = document.createElement('div');
      printContainer.id = 'snapid-global-print-area';
      const img = document.createElement('img');
      img.src = dataUrl;
      printContainer.appendChild(img);
      document.body.appendChild(printContainer);
    };

    const handleAfterPrint = () => {
      document.getElementById('snapid-print-style')?.remove();
      document.getElementById('snapid-global-print-area')?.remove();
    };

    window.addEventListener('beforeprint', handleBeforePrint);
    window.addEventListener('afterprint', handleAfterPrint);

    return () => {
      window.removeEventListener('beforeprint', handleBeforePrint);
      window.removeEventListener('afterprint', handleAfterPrint);
    };
  }, [originalImage, printPaperSize, printOrientation]);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-black font-display tracking-tight text-inherit flex flex-wrap items-center gap-2">
          <span>{t.passportTitle}</span>
          <span className="text-[10px] sm:text-[11px] font-semibold bg-blue-500/10 text-blue-500 border border-blue-500/20 px-2 py-0.5 rounded uppercase font-mono shrink-0">
            AI Powered
          </span>
        </h1>
        <p className={`text-xs mt-1 ${theme === 'dark' ? 'text-slate-550' : 'text-slate-500'}`}>
          {t.passportSubtitle}
        </p>
      </div>

      {!originalImage ? (
        /* Empty upload area with full responsive style */
        <div 
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-2xl p-6 sm:p-12 text-center transition-all ${
            isDragOver 
              ? 'border-blue-500 bg-blue-500/5 glow-blue-500/10' 
              : theme === 'dark'
                ? 'border-slate-800 bg-slate-900/10 hover:border-slate-750 hover:bg-slate-900/20'
                : 'border-slate-200 bg-slate-50/50 hover:border-slate-350 hover:bg-slate-50'
          }`}
        >
          <div className={`mx-auto w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center mb-4 ${
            theme === 'dark' ? 'bg-slate-900 border border-slate-800' : 'bg-white border border-slate-200 shadow-xs'
          }`}>
            <Upload className="w-5.5 h-5.5 text-slate-400" />
          </div>
          <h3 className="font-semibold text-base sm:text-lg">{t.photoUploadLabel}</h3>
          <p className="text-[11px] sm:text-xs text-slate-400 max-w-sm mx-auto mt-2 mb-6">
            {t.photoUploadSubText}
          </p>

          {isMobile ? (
            <div className="flex flex-col gap-3.5 w-full max-w-[280px] mx-auto">
              <button
                onClick={() => cameraInputRef.current?.click()}
                className="w-full inline-flex items-center justify-center gap-2.5 px-5 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-sm shadow-md cursor-pointer transition-colors"
              >
                <Camera className="w-4 h-4 shrink-0" />
                <span>Open Camera</span>
              </button>
              
              <button
                onClick={() => galleryInputRef.current?.click()}
                className={`w-full inline-flex items-center justify-center gap-2.5 px-5 py-3 rounded-xl font-bold text-sm border shadow-xs cursor-pointer transition-all ${
                  theme === 'dark' 
                    ? 'bg-slate-900 border-slate-800 hover:bg-slate-850 text-slate-200' 
                    : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'
                }`}
              >
                <ImageIcon className="w-4 h-4 text-blue-500 shrink-0" />
                <span>Choose from Gallery</span>
              </button>

              <input 
                ref={cameraInputRef}
                type="file" 
                accept="image/*" 
                capture="environment"
                onChange={handlePhotoUpload} 
                className="hidden" 
              />
              <input 
                ref={galleryInputRef}
                type="file" 
                accept="image/*" 
                onChange={handlePhotoUpload} 
                className="hidden" 
              />
            </div>
          ) : (
            <label className="inline-flex items-center gap-2 px-5 py-2.5 sm:px-6 sm:py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-medium text-xs sm:text-sm shadow-md cursor-pointer transition-colors">
              <Maximize2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span>Select Local Photo</span>
              <input 
                type="file" 
                accept="image/*" 
                onChange={handlePhotoUpload} 
                className="hidden" 
              />
            </label>
          )}
        </div>
      ) : (
        /* Portrait loaded, show modular workspace */
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
          
          {/* Left panel / Center Preview Area (8-cols on desktop for bigger viewports) */}
          <div className="xl:col-span-8 flex flex-col gap-4">
            
            {/* Tab header buttons */}
            <div className={`flex p-1 sm:p-1.5 rounded-xl border shrink-0 ${
              theme === 'dark' ? 'bg-slate-950 border-slate-900' : 'bg-slate-100 border-slate-200'
            }`}>
              <button
                onClick={() => setActiveTab('adjust')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 sm:py-2.5 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
                  activeTab === 'adjust'
                    ? theme === 'dark'
                      ? 'bg-slate-900 text-white shadow-md'
                      : 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-400 hover:text-inherit'
                }`}
              >
                <Sliders className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span>{t.cropAndAlign}</span>
              </button>
              <button
                onClick={() => setActiveTab('sheet')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 sm:py-2.5 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
                  activeTab === 'sheet'
                    ? theme === 'dark'
                      ? 'bg-slate-900 text-white shadow-md'
                      : 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-400 hover:text-inherit'
                }`}
              >
                <Layout className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span>
                  <span className="hidden sm:inline">Print Layup Grid ({selectedSheetPreset.nameEn})</span>
                  <span className="sm:hidden">Print Grid</span>
                </span>
              </button>
            </div>

            {/* Render selected canvas stage */}
            <div className={`relative border rounded-2xl overflow-hidden min-h-[300px] sm:aspect-[4/3] w-full flex items-center justify-center p-3 sm:p-6 ${
              theme === 'dark' 
                ? 'bg-slate-950 border-slate-900 shadow-2xl shadow-blue-550/5' 
                : 'bg-stone-50 border-slate-200 shadow-md'
            }`}>
              
              {/* Cropper View */}
              <div 
                className={`w-full h-full flex flex-col items-center justify-center ${activeTab === 'adjust' ? 'block' : 'hidden'}`}
              >
                {/* Before/After Segmented Selector */}
                {removedBgImg && (
                  <div className={`flex p-1 rounded-xl gap-1 mb-3 shrink-0 ${
                    theme === 'dark' ? 'bg-slate-900 border border-slate-800' : 'bg-slate-150 border border-slate-200'
                  }`}>
                    <button
                      type="button"
                      onClick={() => setShowBeforePreview(false)}
                      className={`px-2.5 py-1.5 text-[10px] sm:text-xs font-bold rounded-lg transition-all cursor-pointer ${
                        !showBeforePreview
                          ? theme === 'dark' ? 'bg-blue-600 text-white shadow-md' : 'bg-white text-slate-900 shadow-sm'
                          : theme === 'dark' ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-950'
                      }`}
                    >
                      <span className="hidden sm:inline">AI Bg Removed (After)</span>
                      <span className="sm:hidden">AI Removed</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowBeforePreview(true)}
                      className={`px-2.5 py-1.5 text-[10px] sm:text-xs font-bold rounded-lg transition-all cursor-pointer ${
                        showBeforePreview
                          ? theme === 'dark' ? 'bg-slate-800 text-white shadow-md' : 'bg-white text-slate-900 shadow-sm'
                          : theme === 'dark' ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-950'
                      }`}
                    >
                      <span className="hidden sm:inline">Original Upload (Before)</span>
                      <span className="sm:hidden">Original</span>
                    </button>
                  </div>
                )}

                <p className="text-[11px] font-medium text-slate-400 mb-2 font-mono flex items-center gap-1.5 uppercase tracking-wide">
                  <Eye className="w-3.5 h-3.5 text-blue-500" />
                  Drag inside the card area to align, zoom with slider below
                </p>

                {/* Cropping box viewport reflecting actual aspect-ratio */}
                <div 
                  ref={containerRef}
                  onMouseDown={handleMouseDown}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUpOrLeave}
                  onMouseLeave={handleMouseUpOrLeave}
                  style={{ aspectRatio: selectedSizePreset.aspectRatio }}
                  className={`relative w-auto h-full max-h-[350px] shadow-xl overflow-hidden border border-dashed cursor-move select-none rounded-[1px] ${
                    theme === 'dark' ? 'border-slate-700 bg-slate-90/80 shadow-black' : 'border-slate-300 bg-white shadow-slate-200'
                  }`}
                >
                  <canvas 
                    ref={previewCanvasRef} 
                    className="w-full h-full block object-contain pointer-events-none"
                  />
                  
                  {/* Guideline Overlays representing camera framing aid */}
                  <div className="absolute inset-0 border border-blue-500/20 pointer-events-none">
                    <div className="absolute top-1/4 bottom-1/4 left-0 right-0 border-y border-dashed border-blue-500/15" />
                    <div className="absolute left-1/3 right-1/3 top-0 bottom-0 border-x border-dashed border-blue-500/15" />
                    {/* Head contour circle guide for alignment */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[60%] w-2/5 h-2/5 rounded-full border border-dashed border-blue-500/25 flex items-center justify-center">
                      <div className="w-[8px] h-[8px] rounded-full bg-blue-500/30" />
                    </div>
                  </div>
                </div>

                <div className="mt-2.5 flex items-center gap-4 text-xs font-mono text-slate-500 bg-slate-500/5 px-3 py-1 rounded">
                  <span>Aspect: {selectedSizePreset.widthMm} x {selectedSizePreset.heightMm} mm</span>
                  <span>Zoom: {zoom.toFixed(1)}x</span>
                </div>
              </div>

              {/* Sheet Layup Grid Preview */}
              <div 
                className={`w-full h-full flex flex-col items-center justify-center ${activeTab === 'sheet' ? 'block' : 'hidden'}`}
              >
                <div className={`shadow-2xl overflow-y-auto max-h-[360px] p-2 border rounded-md max-w-full ${
                  theme === 'dark' ? 'border-slate-800 bg-slate-900 shadow-black' : 'border-slate-200 bg-white text-slate-900'
                }`}>
                  <canvas 
                    ref={sheetCanvasRef} 
                    className="w-auto h-auto max-h-[340px] max-w-full block mx-auto object-contain bg-white shrink-0"
                  />
                </div>
                <div className="mt-3 flex items-center gap-3.5 text-xs text-slate-400 font-medium">
                  <span>Layout Sheet: {selectedSheetPreset.nameEn} ({photosCopiesCount} Photos Grid)</span>
                  <span>•</span>
                  <span>300 DPI high resolution printing ready</span>
                </div>
              </div>

            </div>

            {/* Quick action buttons row inside panel */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <button
                onClick={() => {
                  setOriginalImage(null);
                  setRemovedBgImg(null);
                }}
                className={`w-full sm:w-auto px-4.5 py-2.5 rounded-xl text-xs font-semibold border flex items-center justify-center gap-2 transition-colors cursor-pointer ${
                  theme === 'dark'
                    ? 'border-slate-800 hover:bg-slate-900 text-slate-300'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-650'
                }`}
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>{t.reUploadPhoto}</span>
              </button>

              <div className="w-full sm:w-auto flex items-center justify-center gap-2">
                {/* AI removal process initiator */}
                {!removedBgImg ? (
                  <button
                    onClick={() => runBackgroundRemoval()}
                    disabled={isRemovingBg}
                    className={`w-full sm:w-auto px-5 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      isRemovingBg
                        ? 'bg-blue-600/20 text-blue-400 cursor-not-allowed'
                        : theme === 'dark'
                          ? 'bg-blue-600/15 border border-blue-500/30 hover:bg-blue-600 text-blue-400 hover:text-white'
                          : 'bg-blue-600 hover:bg-blue-550 text-white shadow-xs'
                    }`}
                  >
                    <Sparkles className={`w-3.5 h-3.5 ${isRemovingBg ? 'animate-spin' : ''}`} />
                    <span>{isRemovingBg ? 'Extracting...' : t.bgRemovalLabel}</span>
                  </button>
                ) : (
                  <div className="w-full sm:w-auto flex items-center justify-center gap-2 text-xs bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 font-bold px-3 py-2.5 rounded-xl">
                    <Check className="w-3.5 h-3.5" />
                    <span>AI Background Extracted</span>
                  </div>
                )}
              </div>
            </div>

            {/* Generate Print Layout Button (CTA to go to Print layup sheet) */}
            {activeTab === 'adjust' && (
              <button
                type="button"
                onClick={() => {
                  setActiveTab('sheet');
                  // Trigger a reflow redraw on standard canvas
                }}
                className="w-full px-4.5 py-3.5 rounded-xl font-extrabold text-sm text-white bg-gradient-to-r from-blue-600 to-cyan-600 hover:opacity-95 shadow-lg shadow-blue-500/10 flex items-center justify-center gap-2 cursor-pointer transition-all border border-blue-500/20"
              >
                <Printer className="w-4 h-4 text-white" />
                <span>{t.generatePrintSheet}</span>
              </button>
            )}

            {/* Mobile / Tablet detailed loading state */}
            {isRemovingBg && (
              <div className={`p-4 rounded-xl border text-center space-y-2 animate-pulse ${
                theme === 'dark' ? 'bg-slate-900/60 border-slate-800' : 'bg-blue-50/50 border-blue-100'
              }`}>
                <div className="flex items-center justify-center gap-2">
                  <RefreshCw className="w-4 h-4 text-blue-500 animate-spin" />
                  <span className="text-sm font-bold text-blue-500">{aiStep}</span>
                </div>
                <p className="text-[10px] text-slate-400 max-w-sm mx-auto">
                  Neural model file (~4.4 MB) is loading. Once initialized, background removal and cropping execute 100% locally.
                </p>
              </div>
            )}

          </div>

          {/* Right Panel: Settings panels, sliders, borders, choices (4-cols on desktop) */}
          <div className="xl:col-span-4 space-y-6">
            
            {/* Panel Card: Target Spec */}
            <div className={`p-5 rounded-2xl border ${
              theme === 'dark' ? 'bg-slate-950 border-slate-900' : 'bg-white border-slate-200 shadow-sm'
            } space-y-4`}>
              <h3 className="font-bold text-sm tracking-tight border-b pb-2 flex items-center gap-2">
                <Layout className="w-4 h-4 text-blue-500" />
                <span>Layout Specifications</span>
              </h3>

              {/* Preset selectors */}
              <div className="space-y-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wide">
                    {t.sheetSizeLabel}
                  </label>
                  <div className="grid grid-cols-1 gap-2">
                    {SHEET_SIZE_PRESETS.map((preset) => (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => {
                          setSheetSize(preset.id);
                          if (preset.id === 'single') {
                            setPhotosCopiesCount(1);
                          }
                        }}
                        className={`px-3 py-2.5 rounded-xl text-left text-xs font-medium border flex items-center justify-between transition-all cursor-pointer ${
                          sheetSize === preset.id
                            ? 'border-blue-500 bg-blue-500/5 font-semibold text-blue-500 ring-1 ring-blue-500'
                            : theme === 'dark'
                              ? 'border-slate-800 hover:border-slate-750 text-slate-300 bg-slate-900/50'
                              : 'border-slate-200 hover:border-slate-300 text-slate-700 bg-slate-50'
                        }`}
                      >
                        <div className="flex flex-col">
                          <span>{language === 'hi' ? preset.nameHi : preset.nameEn}</span>
                          {preset.id !== 'single' && (
                            <span className="text-[10px] font-mono text-slate-500">
                              Grid Size: {preset.widthMm} x {preset.heightMm} mm
                            </span>
                          )}
                        </div>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-mono ${
                          sheetSize === preset.id
                            ? 'bg-blue-500/10 text-blue-500'
                            : 'bg-slate-500/5 text-slate-500'
                        }`}>
                          {preset.id === 'single' ? 'Single' : 'Multi-Grid'}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Copies selection panel - custom grid options */}
                {sheetSize !== 'single' && (
                  <div className="pt-2 animate-fadeIn">
                    <label className="block text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wide">
                      Passport Copies count
                    </label>
                    <div className="grid grid-cols-5 gap-1.5">
                      {[4, 6, 8, 12, 16].map((count) => {
                        const isAllowedOnPaper = sheetSize === 'size_4x6' ? count <= 8 : true;
                        return (
                          <button
                            key={count}
                            type="button"
                            disabled={!isAllowedOnPaper}
                            onClick={() => setPhotosCopiesCount(count)}
                            className={`py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                              !isAllowedOnPaper
                                ? 'opacity-30 cursor-not-allowed border-slate-800 bg-slate-950 text-slate-600'
                                : photosCopiesCount === count
                                  ? 'border-blue-500 bg-blue-500/10 text-blue-500'
                                  : theme === 'dark'
                                    ? 'border-slate-800 text-slate-400 bg-slate-900/40 hover:border-slate-750 hover:text-white'
                                    : 'border-slate-200 text-slate-650 bg-slate-50 hover:border-slate-350 hover:text-slate-950'
                            }`}
                          >
                            {count}
                          </button>
                        );
                      })}
                    </div>
                    <p className={`text-[10.5px] mt-1.5 leading-normal ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>
                      {sheetSize === 'size_4x6' 
                        ? '4"x6" Photo papers are optimized for 4, 6, or 8 photo print alignments.' 
                        : 'A4 pages support dense grids: up to 16 passport duplicates perfectly packed.'}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Copies selection panel - custom grid options */}

            {/* Panel Card: Background Fill (Available only when AI extracted background) */}
            <div className={`p-5 rounded-2xl border ${
              theme === 'dark' ? 'bg-slate-950 border-slate-900' : 'bg-white border-slate-200 shadow-sm'
            } space-y-4`}>
              <div className="flex items-center justify-between border-b pb-2">
                <h3 className="font-bold text-sm tracking-tight flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-blue-500" />
                  <span>{t.bgColorLabel}</span>
                </h3>
                {!removedBgImg && (
                  <span className="text-[10px] font-mono text-amber-500 font-semibold uppercase leading-none bg-amber-500/10 border border-amber-500/10 px-1.5 py-0.5 rounded">
                    Requires AI Bg Removal
                  </span>
                )}
              </div>

              <div className={`grid grid-cols-2 gap-2 ${!removedBgImg ? 'opacity-55 pointer-events-none' : ''}`}>
                <button
                  type="button"
                  onClick={() => setBgColorType('white')}
                  className={`py-2 rounded-xl text-xs font-semibold border flex items-center justify-center gap-2 transition-all ${
                    bgColorType === 'white'
                      ? 'border-blue-500 bg-blue-500/10 text-blue-500 font-bold ring-1 ring-blue-500'
                      : theme === 'dark' ? 'border-slate-800 text-slate-350 bg-slate-900/40 hover:border-slate-700' : 'border-slate-200 text-slate-650 bg-slate-50 hover:border-slate-300'
                  }`}
                >
                  <div className="w-3 h-3 rounded-full border border-slate-300 bg-white" />
                  <span>White</span>
                </button>

                <button
                  type="button"
                  onClick={() => setBgColorType('blue')}
                  className={`py-2 rounded-xl text-xs font-semibold border flex items-center justify-center gap-2 transition-all ${
                    bgColorType === 'blue'
                      ? 'border-blue-500 bg-blue-500/10 text-blue-500 font-bold ring-1 ring-blue-500'
                      : theme === 'dark' ? 'border-slate-800 text-slate-350 bg-slate-900/40 hover:border-slate-700' : 'border-slate-200 text-slate-650 bg-slate-50 hover:border-slate-300'
                  }`}
                >
                  <div className="w-3 h-3 rounded-full bg-[#00a4e4] border border-blue-400" />
                  <span>Blue</span>
                </button>
              </div>
            </div>

            {/* Panel Card: Crop Adjustments */}
            <div className={`p-5 rounded-2xl border ${
              theme === 'dark' ? 'bg-slate-950 border-slate-900' : 'bg-white border-slate-200 shadow-sm'
            } space-y-4`}>
              <h3 className="font-bold text-sm tracking-tight border-b pb-2 flex items-center gap-2">
                <Sliders className="w-4 h-4 text-blue-500" />
                <span>Adjustments & Scaling</span>
              </h3>

              {/* Sliders */}
              <div className="space-y-4.5">
                <div>
                  <div className="flex items-center justify-between text-xs mb-1.5 font-medium">
                    <span className="text-slate-400">{t.zoomLabel}</span>
                    <span className="font-mono text-slate-400">{zoom.toFixed(1)}x</span>
                  </div>
                  <input
                    type="range"
                    min="0.5"
                    max="4.0"
                    step="0.05"
                    value={zoom}
                    onChange={(e) => setZoom(parseFloat(e.target.value))}
                    className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between text-xs mb-1.5 font-medium">
                    <span className="text-slate-400">{t.rotateLabel}</span>
                    <span className="font-mono text-slate-400">{rotation}°</span>
                  </div>
                  <input
                    type="range"
                    min="-180"
                    max="180"
                    step="1"
                    value={rotation}
                    onChange={(e) => setRotation(parseInt(e.target.value))}
                    className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between text-xs mb-1.5 font-medium">
                    <span className="text-slate-400">{t.brightnessLabel}</span>
                    <span className="font-mono text-slate-400">{brightness}%</span>
                  </div>
                  <input
                    type="range"
                    min="50"
                    max="180"
                    step="1"
                    value={brightness}
                    onChange={(e) => setBrightness(parseInt(e.target.value))}
                    className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between text-xs mb-1.5 font-medium">
                    <span className="text-slate-400">{t.contrastLabel}</span>
                    <span className="font-mono text-slate-400">{contrast}%</span>
                  </div>
                  <input
                    type="range"
                    min="50"
                    max="180"
                    step="1"
                    value={contrast}
                    onChange={(e) => setContrast(parseInt(e.target.value))}
                    className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Panel Card: Borders and Outlines */}
            <div className={`p-5 rounded-2xl border ${
              theme === 'dark' ? 'bg-slate-950 border-slate-900' : 'bg-white border-slate-200 shadow-sm'
            } space-y-4`}>
              <h3 className="font-bold text-sm tracking-tight border-b pb-2 flex items-center gap-2">
                <Layout className="w-4 h-4 text-blue-500" />
                <span>{t.borderWidthLabel}</span>
              </h3>
              <div className="space-y-4">
                <div className="grid grid-cols-4 gap-2">
                  {[0, 0.25, 0.5, 1.0].map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setBorderWidth(val)}
                      className={`py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                        borderWidth === val
                          ? 'border-blue-500 bg-blue-500/10 text-blue-500 ring-1 ring-blue-500'
                          : theme === 'dark'
                            ? 'border-slate-800 text-slate-400 bg-slate-900/40 hover:border-slate-750 hover:text-white'
                            : 'border-slate-200 text-slate-650 bg-slate-50 hover:border-slate-350 hover:text-slate-950'
                      }`}
                    >
                      {val === 0 ? 'None' : val === 0.25 ? 'Thin (1px)' : `${val}mm`}
                    </button>
                  ))}
                </div>
              </div>
            </div>


            {/* Downloads & Printing Block Drawer */}
            <div className={`p-5 rounded-2xl border ${
              theme === 'dark' 
                ? 'bg-slate-950 border-slate-900 shadow-xl' 
                : 'bg-white border-slate-200 shadow-md'
            } space-y-3.5`}>
              <h4 className="font-bold text-sm tracking-tight border-b pb-2 flex items-center gap-1.5">
                <Download className="w-4 h-4 text-blue-500" />
                <span>{language === 'hi' ? 'प्रिंट और डाउनलोड सेंटर (Print & Download)' : 'Print & Download Options'}</span>
              </h4>
              <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                {language === 'hi'
                  ? 'शीट लेआउट तैयार करें और उच्च-गुणवत्ता वाली PNG इमेज या PDF फ़ॉर्मेट तुरंत डाउनलोड करके आसानी से प्रिंट करें।'
                  : 'Prepare page layout configurations and download high-quality PNG or PDF formatting immediately for clean, professional printing.'}
              </p>

              <div className="grid grid-cols-1 gap-2 pt-1">
                
                {/* 1. PRINT INSTANTLY (Direct Print A4 Layout) */}
                <button
                  type="button"
                  onClick={handleDirectPrint}
                  className="w-full px-3 sm:px-4.5 py-3 rounded-xl font-extrabold text-[11px] sm:text-xs text-white bg-blue-600 hover:bg-blue-550 flex items-center justify-between group cursor-pointer transition-all border border-blue-500/10"
                >
                  <div className="flex items-center gap-2">
                    <Printer className="w-4 h-4 shrink-0 animate-pulse" />
                    <span>PRINT INSTANTLY <span className="hidden sm:inline">(No Download)</span></span>
                  </div>
                  <span className="bg-blue-700 text-[9px] sm:text-[10px] font-bold px-2 py-0.5 rounded text-blue-100 shrink-0">
                    Direct Print
                  </span>
                </button>
                
                {/* 2. GENERATE LAYOUT GRID BUTTON */}
                <button
                  type="button"
                  onClick={() => setActiveTab('sheet')}
                  className={`w-full px-3 sm:px-4.5 py-3 rounded-xl font-bold text-[11px] sm:text-xs border flex items-center justify-between group cursor-pointer transition-all ${
                    activeTab === 'sheet'
                      ? 'bg-blue-600/10 border-blue-500/20 text-blue-500'
                      : theme === 'dark' ? 'bg-slate-900 hover:bg-slate-800 border-slate-800 text-white' : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Layout className="w-4 h-4 text-blue-400 shrink-0" />
                    <span>Generate & View <span className="hidden sm:inline">Print </span>Layout</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform shrink-0" />
                </button>

                {/* 2. DOWNLOAD PNG */}
                <button
                  type="button"
                  onClick={sheetSize === 'single' ? downloadSinglePhoto : downloadSheetPng}
                  className={`w-full px-3 sm:px-4.5 py-3 rounded-xl font-bold text-[11px] sm:text-xs border flex items-center justify-between group cursor-pointer transition-all ${
                    theme === 'dark' ? 'bg-slate-900 hover:bg-slate-800 border-slate-800 text-white' : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <ImageIcon className="w-4 h-4 text-pink-400 shrink-0" />
                    <span>Download Layout <span className="hidden sm:inline">(PNG Image)</span><span className="sm:hidden">(PNG)</span></span>
                  </div>
                  <Download className="w-4 h-4 text-slate-400 group-hover:text-white shrink-0" />
                </button>

                {/* 3. DOWNLOAD PDF */}
                <button
                  type="button"
                  onClick={downloadSheetPdf}
                  className={`w-full px-3 sm:px-4.5 py-3 rounded-xl font-bold text-[11px] sm:text-xs border flex items-center justify-between group cursor-pointer transition-all ${
                    theme === 'dark' ? 'bg-slate-900 hover:bg-slate-800 border-slate-800 text-white' : 'bg-white hover:bg-slate-50 border-slate-205 text-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <FileDown className="w-4 h-4 text-red-400 shrink-0" />
                    <span>Download <span className="hidden sm:inline font-bold">High-Quality </span>PDF <span className="hidden sm:inline">Formatted</span></span>
                  </div>
                  <Download className="w-4 h-4 text-slate-400 group-hover:text-white shrink-0" />
                </button>

              </div>
            </div>

          </div>

        </div>
      )}

      {/* Background Removal Error Modal Overlay */}
      {bgRemovalError && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm select-none animate-in fade-in duration-200"
          onClick={() => setBgRemovalError(false)}
        >
          <div 
            className={`w-full max-w-md rounded-2xl border p-6 flex flex-col space-y-4 text-center ${
              theme === 'dark' 
                ? 'bg-slate-900 border-red-500/30 shadow-2xl shadow-red-950/10 text-white' 
                : 'bg-white border-red-200 shadow-2xl shadow-red-100/30 text-slate-900'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header / Red Icon */}
            <div className="mx-auto w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center text-red-500 mb-2 animate-bounce">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-black tracking-tight text-red-500">
                ❌ Background Removal Failed
              </h3>
              <p className={`text-sm leading-relaxed ${
                theme === 'dark' ? 'text-slate-300' : 'text-slate-650'
              }`}>
                We couldn't remove the background from this image. Please try again or upload a different image.
              </p>
            </div>

            {/* Buttons Row */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setBgRemovalError(false);
                  runBackgroundRemoval();
                }}
                className="w-full sm:w-auto px-5 py-2.5 bg-red-600 hover:bg-red-500 text-white rounded-xl font-bold text-sm shadow-md transition-all cursor-pointer inline-flex items-center justify-center gap-1.5"
              >
                <RefreshCw className="w-4 h-4 animate-spin-hover" />
                <span>Retry</span>
              </button>
              
              <button
                type="button"
                onClick={() => {
                  setBgRemovalError(false);
                  errorFileInputRef.current?.click();
                }}
                className={`w-full sm:w-auto px-5 py-2.5 rounded-xl font-bold text-sm border shadow-xs transition-all cursor-pointer inline-flex items-center justify-center gap-1.5 ${
                  theme === 'dark'
                    ? 'bg-slate-800 border-slate-700 hover:bg-slate-700 text-slate-200'
                    : 'bg-slate-100 border-slate-200 hover:bg-slate-200 text-slate-700'
                }`}
              >
                <ImageIcon className="w-4 h-4 text-blue-500" />
                <span>Choose Another Image</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Programmatic fallback input for error recovery and seamless choosing */}
      <input
        ref={errorFileInputRef}
        type="file"
        accept="image/*"
        onChange={handlePhotoUpload}
        className="hidden"
      />
    </div>
  );
}
