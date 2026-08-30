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
  Camera,
  Plus,
  Minus,
  Crop,
  ChevronUp,
  ChevronDown,
  RotateCcw,
  FlipHorizontal,
  X,
  Grid3X3,
  Square,
  Move
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
  { id: 'eu_uk', nameEn: 'Passport (35 x 45 mm)', nameHi: 'पासपोर्ट (35 x 45 mm)', widthMm: 35, heightMm: 45, aspectRatio: 35 / 45 },
  { id: 'india_us', nameEn: 'US/Visa (51 x 51 mm / 2"x2")', nameHi: 'यूएस/वीजा (51 x 51 mm)', widthMm: 51, heightMm: 51, aspectRatio: 1 },
  { id: 'oci_visa', nameEn: 'OCI/Visa (35 x 35 mm)', nameHi: 'OCI/वीजा (35 x 35 mm)', widthMm: 35, heightMm: 35, aspectRatio: 1 },
  { id: 'stamp', nameEn: 'Stamp (20 x 25 mm)', nameHi: 'स्टाम्प (20 x 25 mm)', widthMm: 20, heightMm: 25, aspectRatio: 20 / 25 },
];

const SHEET_SIZE_PRESETS: SheetSizePreset[] = [
  { id: 'size_4x6', nameEn: '4 x 6" (10x15 cm)', nameHi: '4x6" (10x15 cm)', widthMm: 101.6, heightMm: 152.4, category: 'Photo Paper' },
  { id: 'size_a4', nameEn: 'A4 (210 x 297 mm)', nameHi: 'A4 (210x297 mm)', widthMm: 210, heightMm: 297, category: 'Standard Paper' },
  { id: 'size_5x7', nameEn: '5 x 7" (13x18 cm)', nameHi: '5x7" (13x18 cm)', widthMm: 127, heightMm: 178, category: 'Photo Paper' },
  { id: 'size_a6', nameEn: 'A6 (105 x 148 mm)', nameHi: 'A6 (105x148 mm)', widthMm: 105, heightMm: 148, category: 'Standard Paper' },
  { id: 'size_a5', nameEn: 'A5 (148 x 210 mm)', nameHi: 'A5 (148x210 mm)', widthMm: 148, heightMm: 210, category: 'Standard Paper' },
  { id: 'size_b5', nameEn: 'B5 (182 x 257 mm)', nameHi: 'B5 (182x257 mm)', widthMm: 182, heightMm: 257, category: 'Standard Paper' },
  { id: 'size_b6', nameEn: 'B6 (128 x 182 mm)', nameHi: 'B6 (128x182 mm)', widthMm: 128, heightMm: 182, category: 'Standard Paper' },
  { id: 'size_3_5x5', nameEn: '3.5 x 5" (9x13 cm)', nameHi: '3.5x5" (9x13 cm)', widthMm: 89, heightMm: 127, category: 'Photo Paper' },
  { id: 'size_5x8', nameEn: '5 x 8" (127x203 mm)', nameHi: '5x8" (127x203 mm)', widthMm: 127, heightMm: 203, category: 'Photo Paper' },
  { id: 'size_8x10', nameEn: '8 x 10" (20x25 cm)', nameHi: '8x10" (20x25 cm)', widthMm: 203.2, heightMm: 254, category: 'Photo Paper' },
  { id: 'size_16_9_wide', nameEn: '16:9 Wide (102x181 mm)', nameHi: '16:9 Wide', widthMm: 101.6, heightMm: 180.6, category: 'Photo Paper' },
  { id: 'size_100x148', nameEn: 'Postcard (100x148 mm)', nameHi: 'पोस्टकार्ड (100x148 mm)', widthMm: 100, heightMm: 148, category: 'Photo Paper' },
  { id: 'env_10', nameEn: 'Envelope #10 (105x241 mm)', nameHi: 'Envelope #10', widthMm: 105, heightMm: 241, category: 'Envelope' },
  { id: 'env_dl', nameEn: 'Envelope DL (110x220 mm)', nameHi: 'Envelope DL', widthMm: 110, heightMm: 220, category: 'Envelope' },
  { id: 'env_c6', nameEn: 'Envelope C6 (114x162 mm)', nameHi: 'Envelope C6', widthMm: 114, heightMm: 162, category: 'Envelope' },
  { id: 'size_letter', nameEn: 'Letter (8.5 x 11")', nameHi: 'Letter (8.5x11")', widthMm: 215.9, heightMm: 279.4, category: 'Standard Paper' },
  { id: 'size_8_5x13', nameEn: 'Folio (8.5 x 13")', nameHi: 'Folio (8.5x13")', widthMm: 215.9, heightMm: 330.2, category: 'Standard Paper' },
  { id: 'size_indian_legal', nameEn: 'Indian-Legal (215x345 mm)', nameHi: 'Indian-Legal', widthMm: 215, heightMm: 345, category: 'Legal / Official' },
  { id: 'size_legal', nameEn: 'Legal (8.5 x 14")', nameHi: 'Legal (8.5x14")', widthMm: 215.9, heightMm: 355.6, category: 'Legal / Official' },
  { id: 'size_a3', nameEn: 'A3 (297 x 420 mm)', nameHi: 'A3 (297x420 mm)', widthMm: 297, heightMm: 420, category: 'Large Format' },
  { id: 'size_a3_plus', nameEn: 'A3+ (329 x 483 mm)', nameHi: 'A3+ (329x483 mm)', widthMm: 329, heightMm: 483, category: 'Large Format' },
  { id: 'size_a2', nameEn: 'A2 (420 x 594 mm)', nameHi: 'A2 (420x594 mm)', widthMm: 420, heightMm: 594, category: 'Large Format' },
  { id: 'size_b4', nameEn: 'B4 (257 x 364 mm)', nameHi: 'B4 (257x364 mm)', widthMm: 257, heightMm: 364, category: 'Large Format' },
  { id: 'size_b3', nameEn: 'B3 (364 x 515 mm)', nameHi: 'B3 (364x515 mm)', widthMm: 364, heightMm: 515, category: 'Large Format' },
  { id: 'size_8k', nameEn: '8K (270 x 390 mm)', nameHi: '8K (270x390 mm)', widthMm: 270, heightMm: 390, category: 'Special' },
  { id: 'size_16k', nameEn: '16K (195 x 270 mm)', nameHi: '16K (195x270 mm)', widthMm: 195, heightMm: 270, category: 'Special' },
  { id: 'size_user_defined', nameEn: 'Custom (mm)', nameHi: 'कस्टम (mm)', widthMm: 100, heightMm: 150, category: 'Custom' },
  { id: 'single', nameEn: 'Single Photo', nameHi: 'सिंगल फोटो', widthMm: 0, heightMm: 0, category: 'Single' },
];

export default function PassportSection({ language, theme }: PassportSectionProps) {
  const t = translations[language];

  // Image upload states
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [removedBgImg, setRemovedBgImg] = useState<string | null>(null);
  
  // Settings & Toggles
  const [sizePreset, setSizePreset] = useState<PassportPresetId>('eu_uk');
  const [sheetSize, setSheetSize] = useState<SheetSizeId>('size_4x6');
  const [customPaperWidthMm, setCustomPaperWidthMm] = useState<number>(100);
  const [customPaperHeightMm, setCustomPaperHeightMm] = useState<number>(150);

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

  // Raw original uncropped image stored for repeated high-fidelity cropping
  const [rawSourceImage, setRawSourceImage] = useState<string | null>(null);

  // Android Phone Style Crop Station state
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [cropBox, setCropBox] = useState<{ x: number; y: number; w: number; h: number } | null>(null);
  const [cropAspectRatio, setCropAspectRatio] = useState<'passport' | 'free' | '1:1' | '4:3' | '16:9'>('passport');
  const [cropRotation, setCropRotation] = useState<number>(0);
  const [cropFlipH, setCropFlipH] = useState<boolean>(false);
  const [cropDragAction, setCropDragAction] = useState<string | null>(null);
  const [cropDragStart, setCropDragStart] = useState<{ x: number; y: number; box: { x: number; y: number; w: number; h: number } }>({
    x: 0,
    y: 0,
    box: { x: 10, y: 10, w: 80, h: 80 }
  });
  const cropDisplayContainerRef = useRef<HTMLDivElement>(null);

  // Serial queue for local AI background removal (prevents concurrent execution of ONNX sessions)
  const bgRemovalChainRef = useRef<Promise<any>>(Promise.resolve());
  const latestRequestedSrcRef = useRef<string | null>(null);
  const pendingRequestsCountRef = useRef<number>(0);

  // Helper to initialize cropping box centered in the displayed image dimensions
  const initCropBox = (imgW: number, imgH: number, ratioMode: string) => {
    const containerRatio = imgW / imgH;
    let targetRatio = containerRatio;
    if (ratioMode === 'passport') {
      targetRatio = selectedSizePreset.widthMm / selectedSizePreset.heightMm;
    } else if (ratioMode === '1:1') {
      targetRatio = 1.0;
    } else if (ratioMode === '4:3') {
      targetRatio = 4 / 3;
    } else if (ratioMode === '16:9') {
      targetRatio = 16 / 9;
    } else if (ratioMode === 'free') {
      targetRatio = containerRatio;
    }

    let w = 85;
    let h = (w / targetRatio) * containerRatio;
    if (h > 85) {
      h = 85;
      w = (h * targetRatio) / containerRatio;
    }
    const x = (100 - w) / 2;
    const y = (100 - h) / 2;
    return {
      x: Math.max(2, Math.min(90, x)),
      y: Math.max(2, Math.min(90, y)),
      w: Math.max(10, Math.min(96, w)),
      h: Math.max(10, Math.min(96, h)),
    };
  };

  const openAndroidCropModal = () => {
    if (!originalImage && !rawSourceImage) return;
    setCropRotation(0);
    setCropFlipH(false);
    setCropAspectRatio('passport');
    setCropModalOpen(true);
  };

  const handleCropRatioChange = (ratioMode: 'passport' | 'free' | '1:1' | '4:3' | '16:9') => {
    setCropAspectRatio(ratioMode);
    if (cropDisplayContainerRef.current) {
      const imgEl = cropDisplayContainerRef.current.querySelector('img');
      if (imgEl && imgEl.naturalWidth && imgEl.naturalHeight) {
        let nw = imgEl.naturalWidth;
        let nh = imgEl.naturalHeight;
        if (cropRotation === 90 || cropRotation === 270) {
          nw = imgEl.naturalHeight;
          nh = imgEl.naturalWidth;
        }
        setCropBox(initCropBox(nw, nh, ratioMode));
      }
    }
  };

  const startCropBoxDrag = (action: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!cropBox) return;
    setCropDragAction(action);
    setCropDragStart({
      x: e.clientX,
      y: e.clientY,
      box: { ...cropBox }
    });
  };

  const startCropBoxDragTouch = (action: string, e: React.TouchEvent) => {
    if (e.touches && e.touches[0] && cropBox) {
      e.stopPropagation();
      setCropDragAction(action);
      setCropDragStart({
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
        box: { ...cropBox }
      });
    }
  };

  const updateCropWithDelta = (deltaX: number, deltaY: number, containerW: number, containerH: number) => {
    if (!containerW || !containerH || !cropBox) return;
    const pctX = (deltaX / containerW) * 100;
    const pctY = (deltaY / containerH) * 100;
    const start = cropDragStart.box;
    const minSize = 8; // minimum 8% size for crop box

    if (cropDragAction === 'move') {
      let newX = start.x + pctX;
      let newY = start.y + pctY;
      newX = Math.max(0, Math.min(100 - start.w, newX));
      newY = Math.max(0, Math.min(100 - start.h, newY));
      setCropBox({ ...start, x: newX, y: newY });
    } else if (cropDragAction === 'resize-se') {
      let newW = Math.max(minSize, Math.min(100 - start.x, start.w + pctX));
      let newH = Math.max(minSize, Math.min(100 - start.y, start.h + pctY));
      setCropBox({ ...start, w: newW, h: newH });
    } else if (cropDragAction === 'resize-sw') {
      let newX = Math.max(0, Math.min(start.x + start.w - minSize, start.x + pctX));
      let newW = (start.x + start.w) - newX;
      let newH = Math.max(minSize, Math.min(100 - start.y, start.h + pctY));
      setCropBox({ ...start, x: newX, w: newW, h: newH });
    } else if (cropDragAction === 'resize-nw') {
      let newX = Math.max(0, Math.min(start.x + start.w - minSize, start.x + pctX));
      let newY = Math.max(0, Math.min(start.y + start.h - minSize, start.y + pctY));
      let newW = (start.x + start.w) - newX;
      let newH = (start.y + start.h) - newY;
      setCropBox({ ...start, x: newX, y: newY, w: newW, h: newH });
    } else if (cropDragAction === 'resize-ne') {
      let newY = Math.max(0, Math.min(start.y + start.h - minSize, start.y + pctY));
      let newW = Math.max(minSize, Math.min(100 - start.x, start.w + pctX));
      let newH = (start.y + start.h) - newY;
      setCropBox({ ...start, y: newY, w: newW, h: newH });
    } else if (cropDragAction === 'resize-n') {
      let newY = Math.max(0, Math.min(start.y + start.h - minSize, start.y + pctY));
      let newH = (start.y + start.h) - newY;
      setCropBox({ ...start, y: newY, h: newH });
    } else if (cropDragAction === 'resize-s') {
      let newH = Math.max(minSize, Math.min(100 - start.y, start.h + pctY));
      setCropBox({ ...start, h: newH });
    } else if (cropDragAction === 'resize-w') {
      let newX = Math.max(0, Math.min(start.x + start.w - minSize, start.x + pctX));
      let newW = (start.x + start.w) - newX;
      setCropBox({ ...start, x: newX, w: newW });
    } else if (cropDragAction === 'resize-e') {
      let newW = Math.max(minSize, Math.min(100 - start.x, start.w + pctX));
      setCropBox({ ...start, w: newW });
    }
  };

  const handleCropContainerMouseMove = (e: React.MouseEvent) => {
    if (!cropDragAction || !cropDisplayContainerRef.current) return;
    const rect = cropDisplayContainerRef.current.getBoundingClientRect();
    const deltaX = e.clientX - cropDragStart.x;
    const deltaY = e.clientY - cropDragStart.y;
    updateCropWithDelta(deltaX, deltaY, rect.width, rect.height);
  };

  const handleCropContainerTouchMove = (e: React.TouchEvent) => {
    if (!cropDragAction || !cropDisplayContainerRef.current || !e.touches[0]) return;
    const rect = cropDisplayContainerRef.current.getBoundingClientRect();
    const deltaX = e.touches[0].clientX - cropDragStart.x;
    const deltaY = e.touches[0].clientY - cropDragStart.y;
    updateCropWithDelta(deltaX, deltaY, rect.width, rect.height);
  };

  const handleCropContainerMouseUp = () => {
    setCropDragAction(null);
  };

  const applyCrop = () => {
    const sourceToUse = rawSourceImage || originalImage;
    if (!sourceToUse || !cropBox) return;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const naturalW = img.naturalWidth || img.width;
      const naturalH = img.naturalHeight || img.height;

      // Step 1: Render source image with rotation and flip to intermediate canvas
      const intermediateCanvas = document.createElement('canvas');
      let interW = naturalW;
      let interH = naturalH;
      if (cropRotation === 90 || cropRotation === 270) {
        intermediateCanvas.width = naturalH;
        intermediateCanvas.height = naturalW;
        interW = naturalH;
        interH = naturalW;
      } else {
        intermediateCanvas.width = naturalW;
        intermediateCanvas.height = naturalH;
      }

      const interCtx = intermediateCanvas.getContext('2d');
      if (!interCtx) return;

      interCtx.save();
      interCtx.translate(intermediateCanvas.width / 2, intermediateCanvas.height / 2);
      interCtx.rotate((cropRotation * Math.PI) / 180);
      if (cropFlipH) interCtx.scale(-1, 1);
      interCtx.drawImage(img, -naturalW / 2, -naturalH / 2);
      interCtx.restore();

      // Step 2: Slice the crop rectangle
      const rx = Math.max(0, Math.min(1, cropBox.x / 100));
      const ry = Math.max(0, Math.min(1, cropBox.y / 100));
      const rw = Math.max(0.01, Math.min(1 - rx, cropBox.w / 100));
      const rh = Math.max(0.01, Math.min(1 - ry, cropBox.h / 100));

      const cropX = Math.round(rx * interW);
      const cropY = Math.round(ry * interH);
      const cropW = Math.max(20, Math.round(rw * interW));
      const cropH = Math.max(20, Math.round(rh * interH));

      const finalCanvas = document.createElement('canvas');
      finalCanvas.width = cropW;
      finalCanvas.height = cropH;
      const finalCtx = finalCanvas.getContext('2d');
      if (!finalCtx) return;

      finalCtx.drawImage(intermediateCanvas, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH);
      const croppedDataUrl = finalCanvas.toDataURL('image/jpeg', 0.95);

      setOriginalImage(croppedDataUrl);
      setRemovedBgImg(null); // Reset background so AI auto-extracts the newly cropped portrait
      setZoom(1.0);
      setPanX(0);
      setPanY(0);
      setRotation(0);
      setCropModalOpen(false);

      // Re-run AI background removal on the freshly cropped portrait
      runBackgroundRemoval(croppedDataUrl);
    };
    img.src = sourceToUse;
  };

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

  // Dynamically calculate maximum photos that fit on the selected paper without overflowing margins (Landscape studio standard)
  const maxCopiesOnPaper = React.useMemo(() => {
    if (sheetSize === 'single') return 1;
    let wBase = selectedSheetPreset.widthMm || 101.6;
    let hBase = selectedSheetPreset.heightMm || 152.4;
    if (sheetSize === 'size_user_defined') {
      wBase = customPaperWidthMm || 100;
      hBase = customPaperHeightMm || 150;
    }
    const pageW = Math.max(wBase, hBase);
    const pageH = Math.min(wBase, hBase);

    const isSmallPhotoPaper = pageW <= 160 && pageH <= 210;
    const gapMm = isSmallPhotoPaper ? 2 : 3.5;
    const edgeMargin = isSmallPhotoPaper ? 2 : 8;

    const maxCols = Math.max(1, Math.floor((pageW - (2 * edgeMargin) + gapMm) / (selectedSizePreset.widthMm + gapMm)));
    const maxRows = Math.max(1, Math.floor((pageH - (2 * edgeMargin) + gapMm) / (selectedSizePreset.heightMm + gapMm)));

    return Math.max(1, maxCols * maxRows);
  }, [selectedSheetPreset, selectedSizePreset, sheetSize, customPaperWidthMm, customPaperHeightMm]);

  const [photosCopiesCount, setPhotosCopiesCount] = useState<number>(8);

  // Keep copies count strictly bounded between 1 and max paper capacity
  useEffect(() => {
    if (photosCopiesCount > maxCopiesOnPaper) {
      setPhotosCopiesCount(maxCopiesOnPaper);
    } else if (photosCopiesCount < 1) {
      setPhotosCopiesCount(1);
    }
  }, [maxCopiesOnPaper]);

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
      setRawSourceImage(optimizedUrl);
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
    let baseWidthMm = selectedSheetPreset.widthMm || 101.6;
    let baseHeightMm = selectedSheetPreset.heightMm || 152.4;
    if (sheetSize === 'size_user_defined') {
      baseWidthMm = customPaperWidthMm || 100;
      baseHeightMm = customPaperHeightMm || 150;
    }

    let pageWidthMm = baseWidthMm;
    let pageHeightMm = baseHeightMm;
    
    if (sheetSize === 'single') {
      pageWidthMm = selectedSizePreset.widthMm + (borderWidth * 2);
      pageHeightMm = selectedSizePreset.heightMm + (borderWidth * 2);
    } else {
      const minDim = Math.min(baseWidthMm, baseHeightMm);
      const maxDim = Math.max(baseWidthMm, baseHeightMm);
      pageWidthMm = maxDim;
      pageHeightMm = minDim;
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

    // Sheet layouts with smart adaptive padding (Landscape studio standard)
    const isSmallPhotoPaper = pageWidthMm <= 160 && pageHeightMm <= 210;
    const gapMm = isSmallPhotoPaper ? 2 : 3.5;
    const edgeMargin = isSmallPhotoPaper ? 2 : 8;
    const gapPx = Math.round(gapMm * dpm);

    const maxCols = Math.max(1, Math.floor((pageWidthMm - (2 * edgeMargin) + gapMm) / (selectedSizePreset.widthMm + gapMm)));
    const maxRows = Math.max(1, Math.floor((pageHeightMm - (2 * edgeMargin) + gapMm) / (selectedSizePreset.heightMm + gapMm)));
    const maxCapacity = maxCols * maxRows;

    let numPhotos = Math.max(1, Math.min(photosCopiesCount, maxCapacity));

    // Choose optimal columns to keep layout clean and within maxCols and maxRows
    let numCols = Math.min(maxCols, numPhotos <= 2 ? 2 : numPhotos <= 4 ? 2 : numPhotos <= 6 ? (maxCols >= 4 && numPhotos > 4 ? 4 : 3) : 4);
    if (Math.ceil(numPhotos / numCols) > maxRows) {
      numCols = Math.min(maxCols, Math.ceil(numPhotos / maxRows));
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

    // Pre-sync print buffer into DOM ahead of time for instant 1st-try Ctrl+P printing
    try {
      const dataUrl = sheetCanvas.toDataURL('image/png');
      let printContainer = document.getElementById('snapid-global-print-area');
      if (!printContainer) {
        printContainer = document.createElement('div');
        printContainer.id = 'snapid-global-print-area';
        printContainer.style.display = 'none';
        document.body.appendChild(printContainer);
      } else {
        printContainer.style.display = 'none';
      }
      let img = printContainer.querySelector('img') as HTMLImageElement | null;
      if (!img) {
        img = document.createElement('img');
        img.alt = 'Print Sheet';
        printContainer.appendChild(img);
      }
      img.src = dataUrl;
      if (img.decode) {
        img.decode().catch(() => {});
      }
    } catch {
      // ignore
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
    customPaperWidthMm,
    customPaperHeightMm,
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
      // Setup PDF in exact millimeters
      const isSingleRaw = sheetSize === 'single';
      
      let baseWidthMm = selectedSheetPreset.widthMm || 101.6;
      let baseHeightMm = selectedSheetPreset.heightMm || 152.4;
      if (sheetSize === 'size_user_defined') {
        baseWidthMm = customPaperWidthMm || 100;
        baseHeightMm = customPaperHeightMm || 150;
      }
      
      let widthMm = baseWidthMm;
      let heightMm = baseHeightMm;
      
      if (isSingleRaw) {
        widthMm = selectedSizePreset.widthMm + (borderWidth * 2);
        heightMm = selectedSizePreset.heightMm + (borderWidth * 2);
      } else {
        const minDim = Math.min(baseWidthMm, baseHeightMm);
        const maxDim = Math.max(baseWidthMm, baseHeightMm);
        widthMm = maxDim;
        heightMm = minDim;
      }

      // Initialize doc with precise physical formats (Landscape for sheets)
      const doc = new jsPDF({
        orientation: isSingleRaw ? 'portrait' : 'landscape',
        unit: 'mm',
        format: [widthMm, heightMm]
      });

      const cardImgData = previewCanvasRef.current.toDataURL('image/png');

      if (isSingleRaw) {
        // Just fit the card precisely to the page limits
        doc.addImage(cardImgData, 'PNG', 0, 0, widthMm, heightMm);
      } else {
        // Build millimetric copy placement to match canvas sheets
        const photoWidthMm = selectedSizePreset.widthMm;
        const photoHeightMm = selectedSizePreset.heightMm;
        const isSmallPhotoPaper = widthMm <= 160 && heightMm <= 210;
        const gapMm = isSmallPhotoPaper ? 2 : 3.5;
        const edgeMargin = isSmallPhotoPaper ? 2 : 8;

        const maxCols = Math.max(1, Math.floor((widthMm - (2 * edgeMargin) + gapMm) / (photoWidthMm + gapMm)));
        const maxRows = Math.max(1, Math.floor((heightMm - (2 * edgeMargin) + gapMm) / (photoHeightMm + gapMm)));
        const maxCapacity = maxCols * maxRows;

        let numPhotos = Math.max(1, Math.min(photosCopiesCount, maxCapacity));

        let numCols = Math.min(maxCols, numPhotos <= 2 ? 2 : numPhotos <= 4 ? 2 : numPhotos <= 6 ? (maxCols >= 4 && numPhotos > 4 ? 4 : 3) : 4);
        if (Math.ceil(numPhotos / numCols) > maxRows) {
          numCols = Math.min(maxCols, Math.ceil(numPhotos / maxRows));
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
          doc.setDrawColor(230, 230, 230);
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

  // Sync print buffer into dedicated DOM element with exact physical millimeter @page CSS
  const syncPrintArea = async () => {
    const canvas = sheetCanvasRef.current;
    if (!canvas || !originalImage) return false;

    try {
      const dataUrl = canvas.toDataURL('image/png');
      let printContainer = document.getElementById('snapid-global-print-area');
      if (!printContainer) {
        printContainer = document.createElement('div');
        printContainer.id = 'snapid-global-print-area';
        printContainer.style.display = 'none';
        document.body.appendChild(printContainer);
      } else {
        printContainer.style.display = 'none';
      }

      let img = printContainer.querySelector('img') as HTMLImageElement | null;
      if (!img) {
        img = document.createElement('img');
        img.alt = 'Print Preview';
        printContainer.appendChild(img);
      }
      img.src = dataUrl;

      let styleEl = document.getElementById('snapid-print-style') as HTMLStyleElement | null;
      if (!styleEl) {
        styleEl = document.createElement('style');
        styleEl.id = 'snapid-print-style';
        document.head.appendChild(styleEl);
      }

      let baseWidthMm = selectedSheetPreset.widthMm || 101.6;
      let baseHeightMm = selectedSheetPreset.heightMm || 152.4;
      if (sheetSize === 'size_user_defined') {
        baseWidthMm = customPaperWidthMm || 100;
        baseHeightMm = customPaperHeightMm || 150;
      }
      
      let widthMm = baseWidthMm;
      let heightMm = baseHeightMm;
      
      if (sheetSize === 'single') {
        widthMm = selectedSizePreset.widthMm + (borderWidth * 2);
        heightMm = selectedSizePreset.heightMm + (borderWidth * 2);
      } else {
        const minDim = Math.min(baseWidthMm, baseHeightMm);
        const maxDim = Math.max(baseWidthMm, baseHeightMm);
        widthMm = maxDim;
        heightMm = minDim;
      }

      styleEl.innerHTML = `
        @media print {
          @page {
            size: ${widthMm}mm ${heightMm}mm !important;
            margin: 0mm !important;
          }
        }
      `;

      if (img.decode) {
        await img.decode().catch(() => {});
      }
      return true;
    } catch (err) {
      console.warn('Print sync error:', err);
      return false;
    }
  };

  // Instant 1st-try Direct Print Trigger
  const handleDirectPrint = async () => {
    if (!sheetCanvasRef.current || !originalImage) {
      alert(language === 'hi' 
        ? "कृपया प्रिंट करने से पहले फोटो अपलोड और प्रोसेस करें।"
        : "Please upload and process an image first before printing.");
      return;
    }
    await syncPrintArea();
    setTimeout(() => {
      window.print();
    }, 40);
  };

  // Instant Ctrl+P / Cmd+P Keyboard Interceptor
  useEffect(() => {
    const handleKeyDown = async (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === 'p' || e.key === 'P')) {
        if (originalImage && sheetCanvasRef.current) {
          e.preventDefault();
          await syncPrintArea();
          setTimeout(() => {
            window.print();
          }, 40);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [originalImage, sheetSize, photosCopiesCount, sizePreset, customPaperWidthMm, customPaperHeightMm, singleCanvasUpdated]);

  // Browser BeforePrint fallback hook
  useEffect(() => {
    const handleBeforePrint = () => {
      syncPrintArea();
    };

    window.addEventListener('beforeprint', handleBeforePrint);
    return () => {
      window.removeEventListener('beforeprint', handleBeforePrint);
    };
  }, [originalImage, sheetSize, customPaperWidthMm, customPaperHeightMm]);

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
            
            {/* Panel Card: Target Spec & Document Sizes */}
            <div className={`p-5 rounded-2xl border ${
              theme === 'dark' ? 'bg-slate-950 border-slate-900' : 'bg-white border-slate-200 shadow-sm'
            } space-y-4`}>
              <div className="flex items-center justify-between border-b pb-2">
                <h3 className="font-bold text-xs tracking-tight flex items-center gap-1.5">
                  <Layout className="w-3.5 h-3.5 text-blue-500" />
                  <span>Layout Specifications</span>
                </h3>
                <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-500">
                  {selectedSheetPreset.id === 'single' ? 'Single' : selectedSheetPreset.nameEn.split(' ')[0]}
                </span>
              </div>

              {/* 1. Passport Photo Size Selection */}
              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1 uppercase tracking-wider">
                  {language === 'hi' ? 'फोटो आकार (Photo Size)' : 'Passport Size'}
                </label>
                <div className="grid grid-cols-2 gap-1">
                  {PASSPORT_PRESETS.map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => setSizePreset(preset.id)}
                      className={`px-2 py-1.5 rounded-lg text-left border transition-all cursor-pointer ${
                        sizePreset === preset.id
                          ? 'border-blue-500 bg-blue-500/10 font-bold text-blue-500 ring-1 ring-blue-500'
                          : theme === 'dark'
                            ? 'border-slate-800 hover:border-slate-700 text-slate-300 bg-slate-900/40'
                            : 'border-slate-200 hover:border-slate-300 text-slate-700 bg-slate-50'
                      }`}
                    >
                      <div className="font-bold truncate text-[11px] leading-tight">{preset.nameEn.split('(')[0]}</div>
                      <div className="text-[10px] font-mono text-slate-400">
                        {preset.widthMm} x {preset.heightMm} mm
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* 2. Document / Paper Size with Down-Arrow Dropdown */}
              <div className="space-y-1.5 pt-1 border-t border-slate-200/60 dark:border-slate-800/60">
                <div className="flex items-center justify-between">
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    {language === 'hi' ? 'शीट साइज (Sheet Size)' : 'Document / Paper Size'}
                  </label>
                  <span className="text-[10px] font-mono text-blue-500 font-bold">
                    {sheetSize === 'size_user_defined'
                      ? `${customPaperWidthMm} x ${customPaperHeightMm} mm`
                      : sheetSize === 'single'
                        ? 'Individual'
                        : `${selectedSheetPreset.widthMm} x ${selectedSheetPreset.heightMm} mm`}
                  </span>
                </div>

                {/* Dropdown with custom styling & down arrow */}
                <div className="relative">
                  <select
                    id="passport-document-size-dropdown"
                    value={sheetSize}
                    onChange={(e) => {
                      const newSize = e.target.value as SheetSizeId;
                      setSheetSize(newSize);
                      if (newSize === 'single') {
                        setPhotosCopiesCount(1);
                      } else if (newSize === 'size_4x6') {
                        setPhotosCopiesCount(8);
                      } else if (newSize === 'size_a4') {
                        setPhotosCopiesCount(30);
                      }
                    }}
                    className={`w-full appearance-none px-3 py-2 pr-8 rounded-lg text-xs font-bold border transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      theme === 'dark'
                        ? 'bg-slate-900 border-slate-700 text-slate-100 hover:border-slate-600'
                        : 'bg-white border-slate-300 text-slate-800 hover:border-slate-400 shadow-sm'
                    }`}
                  >
                    <optgroup label="⭐ Most Popular for Photo Printing">
                      {SHEET_SIZE_PRESETS.slice(0, 3).map((preset) => (
                        <option key={preset.id} value={preset.id}>
                          {preset.nameEn} {preset.category ? `(${preset.category})` : ''}
                        </option>
                      ))}
                    </optgroup>
                    <optgroup label="📄 Standard Paper Sizes">
                      {SHEET_SIZE_PRESETS.filter(p => p.category === 'Standard Paper').map((preset) => (
                        <option key={preset.id} value={preset.id}>
                          {preset.nameEn}
                        </option>
                      ))}
                    </optgroup>
                    <optgroup label="🖼️ Photo & Card Papers">
                      {SHEET_SIZE_PRESETS.filter(p => p.category === 'Photo Paper' && p.id !== 'size_4x6' && p.id !== 'size_5x7').map((preset) => (
                        <option key={preset.id} value={preset.id}>
                          {preset.nameEn}
                        </option>
                      ))}
                    </optgroup>
                    <optgroup label="⚖️ Legal / Official Formats">
                      {SHEET_SIZE_PRESETS.filter(p => p.category === 'Legal / Official').map((preset) => (
                        <option key={preset.id} value={preset.id}>
                          {preset.nameEn}
                        </option>
                      ))}
                    </optgroup>
                    <optgroup label="✉️ Envelope Formats">
                      {SHEET_SIZE_PRESETS.filter(p => p.category === 'Envelope').map((preset) => (
                        <option key={preset.id} value={preset.id}>
                          {preset.nameEn}
                        </option>
                      ))}
                    </optgroup>
                    <optgroup label="📐 Large Formats & Special">
                      {SHEET_SIZE_PRESETS.filter(p => p.category === 'Large Format' || p.category === 'Special').map((preset) => (
                        <option key={preset.id} value={preset.id}>
                          {preset.nameEn}
                        </option>
                      ))}
                    </optgroup>
                    <optgroup label="⚙️ Custom & Single">
                      <option value="size_user_defined">User-Defined (Custom mm)</option>
                      <option value="single">Single Photo (Individual)</option>
                    </optgroup>
                  </select>

                  {/* Down Arrow Indicator */}
                  <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 flex items-center">
                    <ChevronDown className="w-3.5 h-3.5 text-blue-500" />
                  </div>
                </div>

                {/* Quick Selection Chips */}
                <div className="grid grid-cols-4 gap-1 pt-0.5">
                  <button
                    type="button"
                    onClick={() => {
                      setSheetSize('size_4x6');
                      setPhotosCopiesCount(8);
                    }}
                    className={`px-1.5 py-1 rounded text-[10px] font-bold border text-center transition-all cursor-pointer truncate ${
                      sheetSize === 'size_4x6'
                        ? 'border-blue-500 bg-blue-500/15 text-blue-500 ring-1 ring-blue-500'
                        : theme === 'dark' ? 'border-slate-800 bg-slate-900/60 text-slate-400 hover:text-slate-200' : 'border-slate-200 bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                    title="10 x 15 cm (4 x 6 in) - 8 Photos Studio Standard"
                  >
                    10x15 (4x6")
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSheetSize('size_a4');
                      setPhotosCopiesCount(30);
                    }}
                    className={`px-1.5 py-1 rounded text-[10px] font-bold border text-center transition-all cursor-pointer truncate ${
                      sheetSize === 'size_a4'
                        ? 'border-blue-500 bg-blue-500/15 text-blue-500 ring-1 ring-blue-500'
                        : theme === 'dark' ? 'border-slate-800 bg-slate-900/60 text-slate-400 hover:text-slate-200' : 'border-slate-200 bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                    title="A4 Standard Sheet"
                  >
                    A4 Sheet
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSheetSize('size_5x7');
                      setPhotosCopiesCount(10);
                    }}
                    className={`px-1.5 py-1 rounded text-[10px] font-bold border text-center transition-all cursor-pointer truncate ${
                      sheetSize === 'size_5x7'
                        ? 'border-blue-500 bg-blue-500/15 text-blue-500 ring-1 ring-blue-500'
                        : theme === 'dark' ? 'border-slate-800 bg-slate-900/60 text-slate-400 hover:text-slate-200' : 'border-slate-200 bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                    title="13 x 18 cm (5 x 7 in)"
                  >
                    13x18 (5x7")
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSheetSize('single');
                      setPhotosCopiesCount(1);
                    }}
                    className={`px-1.5 py-1 rounded text-[10px] font-bold border text-center transition-all cursor-pointer truncate ${
                      sheetSize === 'single'
                        ? 'border-blue-500 bg-blue-500/15 text-blue-500 ring-1 ring-blue-500'
                        : theme === 'dark' ? 'border-slate-800 bg-slate-900/60 text-slate-400 hover:text-slate-200' : 'border-slate-200 bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                    title="Single Photo"
                  >
                    Single
                  </button>
                </div>

                {/* User-Defined Custom Millimeter inputs */}
                {sheetSize === 'size_user_defined' && (
                  <div className={`p-2 rounded-lg border space-y-1.5 animate-fadeIn ${
                    theme === 'dark' ? 'bg-slate-900/70 border-slate-800' : 'bg-slate-50 border-slate-200'
                  }`}>
                    <div className="text-[10px] font-bold text-blue-500 flex items-center justify-between">
                      <span>Custom Size</span>
                      <span className="font-mono text-[10px]">Max: {maxCopiesOnPaper}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-1.5">
                      <div>
                        <span className="text-[9px] text-slate-400 font-semibold block mb-0.5">Width (mm)</span>
                        <input
                          type="number"
                          min={50}
                          max={600}
                          value={customPaperWidthMm}
                          onChange={(e) => setCustomPaperWidthMm(Math.max(30, Number(e.target.value) || 100))}
                          className={`w-full px-2 py-1 rounded text-xs font-mono font-bold border ${
                            theme === 'dark' ? 'bg-slate-950 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                          }`}
                        />
                      </div>
                      <div>
                        <span className="text-[9px] text-slate-400 font-semibold block mb-0.5">Height (mm)</span>
                        <input
                          type="number"
                          min={50}
                          max={900}
                          value={customPaperHeightMm}
                          onChange={(e) => setCustomPaperHeightMm(Math.max(30, Number(e.target.value) || 150))}
                          className={`w-full px-2 py-1 rounded text-xs font-mono font-bold border ${
                            theme === 'dark' ? 'bg-slate-950 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                          }`}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* 3. Copies Selection Panel - Compact Interactive Stepper */}
              {sheetSize !== 'single' && (
                <div className="pt-1.5 border-t border-slate-200/60 dark:border-slate-800/60 animate-fadeIn space-y-1.5">
                  <div className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg border ${
                    theme === 'dark' ? 'bg-slate-900/50 border-slate-800' : 'bg-slate-50 border-slate-200'
                  }`}>
                    <div className="flex flex-col">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        {language === 'hi' ? 'प्रतियाँ (Copies)' : 'Copies Count'}
                      </span>
                      <span className="text-[9px] text-blue-500 font-medium font-mono">
                        Max Capacity: {maxCopiesOnPaper}
                      </span>
                    </div>

                    {/* Stepper (- [count] +) */}
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        id="passport-copies-decrease-btn"
                        disabled={photosCopiesCount <= 1}
                        onClick={() => setPhotosCopiesCount(prev => Math.max(1, prev - 1))}
                        className={`w-7 h-7 rounded-md flex items-center justify-center font-bold border transition-all cursor-pointer select-none ${
                          photosCopiesCount <= 1
                            ? 'opacity-30 cursor-not-allowed border-slate-800 bg-slate-950 text-slate-600'
                            : theme === 'dark'
                              ? 'border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700 hover:text-white active:scale-95'
                              : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-100 active:scale-95'
                        }`}
                        title={language === 'hi' ? 'कम करें (-1)' : 'Decrease (-1)'}
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>

                      <div className="min-w-[30px] text-center">
                        <span className="text-sm font-black font-mono text-blue-500">
                          {photosCopiesCount}
                        </span>
                      </div>

                      <button
                        type="button"
                        id="passport-copies-increase-btn"
                        disabled={photosCopiesCount >= maxCopiesOnPaper}
                        onClick={() => setPhotosCopiesCount(prev => Math.min(maxCopiesOnPaper, prev + 1))}
                        className={`w-7 h-7 rounded-md flex items-center justify-center font-bold border transition-all cursor-pointer select-none ${
                          photosCopiesCount >= maxCopiesOnPaper
                            ? 'opacity-30 cursor-not-allowed border-slate-800 bg-slate-950 text-slate-600'
                            : 'border-blue-500 bg-blue-600 text-white hover:bg-blue-500 active:scale-95 shadow-sm shadow-blue-500/20'
                        }`}
                        title={language === 'hi' ? 'बढ़ाएं (+1)' : 'Increase (+1)'}
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Preset quick counts */}
                  <div className="flex items-center gap-1 justify-end">
                    <span className="text-[9px] text-slate-400 mr-auto font-medium">Quick:</span>
                    {[2, 4, 6, 8, maxCopiesOnPaper].filter((c, idx, arr) => c <= maxCopiesOnPaper && arr.indexOf(c) === idx).map(count => (
                      <button
                        key={count}
                        type="button"
                        onClick={() => setPhotosCopiesCount(count)}
                        className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold border transition-all cursor-pointer ${
                          photosCopiesCount === count
                            ? 'border-blue-500 bg-blue-500 text-white'
                            : theme === 'dark' ? 'border-slate-800 bg-slate-900 text-slate-400 hover:text-white' : 'border-slate-200 bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {count === maxCopiesOnPaper ? `Max(${count})` : count}
                      </button>
                    ))}
                  </div>
                </div>
              )}
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
                  className={`py-2 rounded-xl text-xs font-semibold border flex items-center justify-center gap-2 transition-all cursor-pointer ${
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
                  className={`py-2 rounded-xl text-xs font-semibold border flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    bgColorType === 'blue'
                      ? 'border-blue-500 bg-blue-500/10 text-blue-500 font-bold ring-1 ring-blue-500'
                      : theme === 'dark' ? 'border-slate-800 text-slate-350 bg-slate-900/40 hover:border-slate-700' : 'border-slate-200 text-slate-650 bg-slate-50 hover:border-slate-300'
                  }`}
                >
                  <div className="w-3 h-3 rounded-full bg-[#00a4e4] border border-blue-400" />
                  <span>Blue</span>
                </button>
              </div>

              {/* Dedicated Crop & Align Button with Crop Icon directly below background color */}
              <div className="pt-2 border-t border-slate-800/60">
                <button
                  type="button"
                  id="passport-crop-action-btn"
                  onClick={openAndroidCropModal}
                  className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold border flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm ${
                    theme === 'dark'
                      ? 'border-blue-500/60 bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 hover:border-blue-400 ring-1 ring-blue-500/30'
                      : 'border-blue-400 bg-blue-50 text-blue-700 hover:bg-blue-100 hover:border-blue-500 shadow-xs'
                  }`}
                >
                  <Crop className="w-4 h-4 text-blue-500" />
                  <span>{language === 'hi' ? 'फोटो क्रॉप करें (Android Style Crop)' : 'Crop Photo (Phone Style)'}</span>
                </button>
              </div>
            </div>

            {/* Panel Card: Crop Adjustments & Scaling */}
            <div className={`p-4 sm:p-5 rounded-2xl border ${
              theme === 'dark' ? 'bg-slate-950 border-slate-900' : 'bg-white border-slate-200 shadow-sm'
            } space-y-3.5`}>
              <div className="flex items-center justify-between border-b pb-2">
                <h3 className="font-bold text-sm tracking-tight flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-blue-500" />
                  <span>Adjustments & Scaling</span>
                </h3>
                <button
                  type="button"
                  onClick={() => {
                    setZoom(1.0);
                    setRotation(0);
                    setBrightness(100);
                    setContrast(100);
                  }}
                  className="text-[10px] font-semibold text-slate-400 hover:text-blue-400 flex items-center gap-1 transition-colors cursor-pointer"
                  title="Reset Adjustments"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset</span>
                </button>
              </div>

              {/* Sliders with compact mini bars and Up/Down stepper input boxes in single row */}
              <div className="space-y-3">
                {/* 1. Zoom */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex flex-col">
                    <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-300">
                      <Maximize2 className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                      {t.zoomLabel}
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">0.5x - 4.0x</span>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Compact Mini Slider Bar */}
                    <input
                      type="range"
                      min="0.5"
                      max="4.0"
                      step="0.05"
                      value={zoom}
                      onChange={(e) => setZoom(parseFloat(e.target.value))}
                      className="w-20 sm:w-28 h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
                    />
                    {/* Stepper Box with Up/Down Arrows */}
                    <div className={`flex items-center rounded-lg border overflow-hidden shrink-0 ${
                      theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-300'
                    }`}>
                      <input
                        type="number"
                        min="0.5"
                        max="4.0"
                        step="0.1"
                        value={Number(zoom.toFixed(1))}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value);
                          if (!isNaN(val)) setZoom(Math.max(0.5, Math.min(4.0, val)));
                        }}
                        className={`w-10 py-0.5 text-center font-mono font-bold text-xs bg-transparent focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${
                          theme === 'dark' ? 'text-slate-200' : 'text-slate-800'
                        }`}
                      />
                      <div className={`flex flex-col border-l ${theme === 'dark' ? 'border-slate-800' : 'border-slate-200'}`}>
                        <button
                          type="button"
                          onClick={() => setZoom(prev => Math.min(4.0, parseFloat((prev + 0.1).toFixed(1))))}
                          className="px-1 py-0.5 hover:bg-blue-500/20 text-slate-400 hover:text-blue-400 transition-colors cursor-pointer"
                          title="Increase Zoom (+0.1)"
                        >
                          <ChevronUp className="w-2.5 h-2.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setZoom(prev => Math.max(0.5, parseFloat((prev - 0.1).toFixed(1))))}
                          className={`px-1 py-0.5 hover:bg-blue-500/20 text-slate-400 hover:text-blue-400 transition-colors cursor-pointer border-t ${
                            theme === 'dark' ? 'border-slate-800' : 'border-slate-200'
                          }`}
                          title="Decrease Zoom (-0.1)"
                        >
                          <ChevronDown className="w-2.5 h-2.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 2. Rotation */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex flex-col">
                    <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-300">
                      <RotateCw className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                      {t.rotateLabel}
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">-180° to +180°</span>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Compact Mini Slider Bar */}
                    <input
                      type="range"
                      min="-180"
                      max="180"
                      step="1"
                      value={rotation}
                      onChange={(e) => setRotation(parseInt(e.target.value))}
                      className="w-20 sm:w-28 h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
                    />
                    {/* Stepper Box with Up/Down Arrows */}
                    <div className={`flex items-center rounded-lg border overflow-hidden shrink-0 ${
                      theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-300'
                    }`}>
                      <input
                        type="number"
                        min="-180"
                        max="180"
                        step="1"
                        value={rotation}
                        onChange={(e) => {
                          const val = parseInt(e.target.value);
                          if (!isNaN(val)) setRotation(Math.max(-180, Math.min(180, val)));
                        }}
                        className={`w-10 py-0.5 text-center font-mono font-bold text-xs bg-transparent focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${
                          theme === 'dark' ? 'text-slate-200' : 'text-slate-800'
                        }`}
                      />
                      <div className={`flex flex-col border-l ${theme === 'dark' ? 'border-slate-800' : 'border-slate-200'}`}>
                        <button
                          type="button"
                          onClick={() => setRotation(prev => Math.min(180, prev + 1))}
                          className="px-1 py-0.5 hover:bg-blue-500/20 text-slate-400 hover:text-blue-400 transition-colors cursor-pointer"
                          title="Rotate Right (+1°)"
                        >
                          <ChevronUp className="w-2.5 h-2.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setRotation(prev => Math.max(-180, prev - 1))}
                          className={`px-1 py-0.5 hover:bg-blue-500/20 text-slate-400 hover:text-blue-400 transition-colors cursor-pointer border-t ${
                            theme === 'dark' ? 'border-slate-800' : 'border-slate-200'
                          }`}
                          title="Rotate Left (-1°)"
                        >
                          <ChevronDown className="w-2.5 h-2.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 3. Brightness */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex flex-col">
                    <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-300">
                      <Sun className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                      {t.brightnessLabel}
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">50% - 180%</span>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Compact Mini Slider Bar */}
                    <input
                      type="range"
                      min="50"
                      max="180"
                      step="1"
                      value={brightness}
                      onChange={(e) => setBrightness(parseInt(e.target.value))}
                      className="w-20 sm:w-28 h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
                    />
                    {/* Stepper Box with Up/Down Arrows */}
                    <div className={`flex items-center rounded-lg border overflow-hidden shrink-0 ${
                      theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-300'
                    }`}>
                      <input
                        type="number"
                        min="50"
                        max="180"
                        step="1"
                        value={brightness}
                        onChange={(e) => {
                          const val = parseInt(e.target.value);
                          if (!isNaN(val)) setBrightness(Math.max(50, Math.min(180, val)));
                        }}
                        className={`w-10 py-0.5 text-center font-mono font-bold text-xs bg-transparent focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${
                          theme === 'dark' ? 'text-slate-200' : 'text-slate-800'
                        }`}
                      />
                      <div className={`flex flex-col border-l ${theme === 'dark' ? 'border-slate-800' : 'border-slate-200'}`}>
                        <button
                          type="button"
                          onClick={() => setBrightness(prev => Math.min(180, prev + 5))}
                          className="px-1 py-0.5 hover:bg-blue-500/20 text-slate-400 hover:text-blue-400 transition-colors cursor-pointer"
                          title="Increase Brightness (+5%)"
                        >
                          <ChevronUp className="w-2.5 h-2.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setBrightness(prev => Math.max(50, prev - 5))}
                          className={`px-1 py-0.5 hover:bg-blue-500/20 text-slate-400 hover:text-blue-400 transition-colors cursor-pointer border-t ${
                            theme === 'dark' ? 'border-slate-800' : 'border-slate-200'
                          }`}
                          title="Decrease Brightness (-5%)"
                        >
                          <ChevronDown className="w-2.5 h-2.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 4. Contrast */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex flex-col">
                    <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-300">
                      <Sliders className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                      {t.contrastLabel}
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">50% - 180%</span>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Compact Mini Slider Bar */}
                    <input
                      type="range"
                      min="50"
                      max="180"
                      step="1"
                      value={contrast}
                      onChange={(e) => setContrast(parseInt(e.target.value))}
                      className="w-20 sm:w-28 h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
                    />
                    {/* Stepper Box with Up/Down Arrows */}
                    <div className={`flex items-center rounded-lg border overflow-hidden shrink-0 ${
                      theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-300'
                    }`}>
                      <input
                        type="number"
                        min="50"
                        max="180"
                        step="1"
                        value={contrast}
                        onChange={(e) => {
                          const val = parseInt(e.target.value);
                          if (!isNaN(val)) setContrast(Math.max(50, Math.min(180, val)));
                        }}
                        className={`w-10 py-0.5 text-center font-mono font-bold text-xs bg-transparent focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${
                          theme === 'dark' ? 'text-slate-200' : 'text-slate-800'
                        }`}
                      />
                      <div className={`flex flex-col border-l ${theme === 'dark' ? 'border-slate-800' : 'border-slate-200'}`}>
                        <button
                          type="button"
                          onClick={() => setContrast(prev => Math.min(180, prev + 5))}
                          className="px-1 py-0.5 hover:bg-blue-500/20 text-slate-400 hover:text-blue-400 transition-colors cursor-pointer"
                          title="Increase Contrast (+5%)"
                        >
                          <ChevronUp className="w-2.5 h-2.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setContrast(prev => Math.max(50, prev - 5))}
                          className={`px-1 py-0.5 hover:bg-blue-500/20 text-slate-400 hover:text-blue-400 transition-colors cursor-pointer border-t ${
                            theme === 'dark' ? 'border-slate-800' : 'border-slate-200'
                          }`}
                          title="Decrease Contrast (-5%)"
                        >
                          <ChevronDown className="w-2.5 h-2.5" />
                        </button>
                      </div>
                    </div>
                  </div>
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

      {/* Android Phone Style Interactive Photo Crop Modal */}
      {cropModalOpen && (rawSourceImage || originalImage) && (
        <div 
          className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex flex-col justify-between text-white p-3 sm:p-5 select-none animate-fadeIn"
          onMouseMove={handleCropContainerMouseMove}
          onTouchMove={handleCropContainerTouchMove}
          onMouseUp={handleCropContainerMouseUp}
          onTouchEnd={handleCropContainerMouseUp}
        >
          {/* Top Bar (Phone Gallery Header) */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center border border-blue-500/30">
                <Crop className="w-4 h-4 text-blue-400" />
              </div>
              <div>
                <h3 className="text-sm font-bold tracking-tight text-white flex items-center gap-1.5">
                  <span>{language === 'hi' ? 'फोटो क्रॉपिंग और संरेखण (Android Crop)' : 'Crop & Straighten Photo'}</span>
                </h3>
                <p className="text-[11px] text-slate-400">
                  {language === 'hi' ? 'कोनों व किनारों को खींचकर फोटो को सही आकार में सेट करें' : 'Drag the corner brackets or edges to frame your photo'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setCropRotation(0);
                  setCropFlipH(false);
                  if (cropDisplayContainerRef.current) {
                    const imgEl = cropDisplayContainerRef.current.querySelector('img');
                    if (imgEl && imgEl.naturalWidth && imgEl.naturalHeight) {
                      let nw = imgEl.naturalWidth;
                      let nh = imgEl.naturalHeight;
                      if (cropRotation === 90 || cropRotation === 270) {
                        nw = imgEl.naturalHeight;
                        nh = imgEl.naturalWidth;
                      }
                      setCropBox(initCropBox(nw, nh, cropAspectRatio));
                    }
                  }
                }}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all cursor-pointer flex items-center gap-1.5 border border-slate-700"
                title="Reset Crop Box"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>{language === 'hi' ? 'रीसेट' : 'Reset'}</span>
              </button>

              <button
                type="button"
                onClick={() => setCropModalOpen(false)}
                className="p-1.5 px-3 rounded-lg text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all cursor-pointer border border-slate-700"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Stage: Interactive Image Container with Android Crop Overlay */}
          <div className="flex-1 flex items-center justify-center p-2 relative overflow-hidden min-h-[300px]">
            <div 
              ref={cropDisplayContainerRef}
              className="relative max-w-full max-h-[56vh] flex items-center justify-center select-none"
            >
              <img 
                src={rawSourceImage || originalImage || ''}
                alt="Source preview"
                style={{
                  transform: `rotate(${cropRotation}deg) scaleX(${cropFlipH ? -1 : 1})`,
                  transition: 'transform 0.15s ease-out'
                }}
                onLoad={(e) => {
                  const imgEl = e.currentTarget;
                  let nw = imgEl.naturalWidth;
                  let nh = imgEl.naturalHeight;
                  if (cropRotation === 90 || cropRotation === 270) {
                    nw = imgEl.naturalHeight;
                    nh = imgEl.naturalWidth;
                  }
                  setCropBox(initCropBox(nw, nh, cropAspectRatio));
                }}
                className="max-w-full max-h-[52vh] block object-contain select-none pointer-events-none opacity-90 shadow-2xl rounded-sm"
              />

              {/* Outer dark vignette overlay around crop area */}
              {cropBox && (
                <div className="absolute inset-0 pointer-events-none z-10">
                  <div className="absolute top-0 left-0 right-0 bg-black/75" style={{ height: `${cropBox.y}%` }} />
                  <div className="absolute bottom-0 left-0 right-0 bg-black/75" style={{ top: `${cropBox.y + cropBox.h}%` }} />
                  <div className="absolute left-0 bg-black/75" style={{ top: `${cropBox.y}%`, height: `${cropBox.h}%`, width: `${cropBox.x}%` }} />
                  <div className="absolute right-0 bg-black/75" style={{ top: `${cropBox.y}%`, height: `${cropBox.h}%`, left: `${cropBox.x + cropBox.w}%` }} />
                </div>
              )}

              {/* Draggable Android-style Crop Frame */}
              {cropBox && (
                <div 
                  style={{
                    left: `${cropBox.x}%`,
                    top: `${cropBox.y}%`,
                    width: `${cropBox.w}%`,
                    height: `${cropBox.h}%`,
                  }}
                  className="absolute border border-white/80 shadow-[0_0_0_1px_rgba(255,255,255,0.4)] z-20 select-none"
                >
                  {/* Center Area: Pan / Move handle */}
                  <div 
                    onMouseDown={(e) => startCropBoxDrag('move', e)}
                    onTouchStart={(e) => startCropBoxDragTouch('move', e)}
                    className="absolute inset-0 cursor-move bg-blue-500/5 hover:bg-blue-500/10 transition-colors select-none z-10"
                    title="Drag to reposition crop"
                  />

                  {/* Android 3x3 Rule-of-Thirds Grid */}
                  <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 pointer-events-none">
                    <div className="border-r border-b border-white/30" />
                    <div className="border-r border-b border-white/30" />
                    <div className="border-b border-white/30" />
                    <div className="border-r border-b border-white/30" />
                    <div className="border-r border-b border-white/30" />
                    <div className="border-b border-white/30" />
                    <div className="border-r border-b border-white/30" />
                    <div className="border-r border-b border-white/30" />
                    <div />
                  </div>

                  {/* Android-Style Thick L-Corner Brackets (4 corners) */}
                  {/* NW - Top Left */}
                  <div 
                    onMouseDown={(e) => startCropBoxDrag('resize-nw', e)}
                    onTouchStart={(e) => startCropBoxDragTouch('resize-nw', e)}
                    className="absolute -top-3 -left-3 w-8 h-8 flex items-start justify-start cursor-nwse-resize select-none pointer-events-auto z-30 group p-1"
                  >
                    <div className="w-5 h-5 border-t-[3.5px] border-l-[3.5px] border-white shadow-md drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] group-hover:scale-110 group-active:scale-95 transition-transform" />
                  </div>

                  {/* NE - Top Right */}
                  <div 
                    onMouseDown={(e) => startCropBoxDrag('resize-ne', e)}
                    onTouchStart={(e) => startCropBoxDragTouch('resize-ne', e)}
                    className="absolute -top-3 -right-3 w-8 h-8 flex items-start justify-end cursor-nesw-resize select-none pointer-events-auto z-30 group p-1"
                  >
                    <div className="w-5 h-5 border-t-[3.5px] border-r-[3.5px] border-white shadow-md drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] group-hover:scale-110 group-active:scale-95 transition-transform" />
                  </div>

                  {/* SE - Bottom Right */}
                  <div 
                    onMouseDown={(e) => startCropBoxDrag('resize-se', e)}
                    onTouchStart={(e) => startCropBoxDragTouch('resize-se', e)}
                    className="absolute -bottom-3 -right-3 w-8 h-8 flex items-end justify-end cursor-nwse-resize select-none pointer-events-auto z-30 group p-1"
                  >
                    <div className="w-5 h-5 border-b-[3.5px] border-r-[3.5px] border-white shadow-md drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] group-hover:scale-110 group-active:scale-95 transition-transform" />
                  </div>

                  {/* SW - Bottom Left */}
                  <div 
                    onMouseDown={(e) => startCropBoxDrag('resize-sw', e)}
                    onTouchStart={(e) => startCropBoxDragTouch('resize-sw', e)}
                    className="absolute -bottom-3 -left-3 w-8 h-8 flex items-end justify-start cursor-nesw-resize select-none pointer-events-auto z-30 group p-1"
                  >
                    <div className="w-5 h-5 border-b-[3.5px] border-l-[3.5px] border-white shadow-md drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] group-hover:scale-110 group-active:scale-95 transition-transform" />
                  </div>

                  {/* 4 Edge Handles (Android Middle Bars) */}
                  {/* Top */}
                  <div 
                    onMouseDown={(e) => startCropBoxDrag('resize-n', e)}
                    onTouchStart={(e) => startCropBoxDragTouch('resize-n', e)}
                    className="absolute -top-3 left-1/2 -translate-x-1/2 w-10 h-6 flex items-center justify-center cursor-ns-resize select-none pointer-events-auto z-30 group"
                  >
                    <div className="w-6 h-1.5 bg-white rounded-full shadow-md group-hover:scale-125 transition-transform" />
                  </div>

                  {/* Bottom */}
                  <div 
                    onMouseDown={(e) => startCropBoxDrag('resize-s', e)}
                    onTouchStart={(e) => startCropBoxDragTouch('resize-s', e)}
                    className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-10 h-6 flex items-center justify-center cursor-ns-resize select-none pointer-events-auto z-30 group"
                  >
                    <div className="w-6 h-1.5 bg-white rounded-full shadow-md group-hover:scale-125 transition-transform" />
                  </div>

                  {/* Left */}
                  <div 
                    onMouseDown={(e) => startCropBoxDrag('resize-w', e)}
                    onTouchStart={(e) => startCropBoxDragTouch('resize-w', e)}
                    className="absolute top-1/2 -left-3 -translate-y-1/2 w-6 h-10 flex items-center justify-center cursor-ew-resize select-none pointer-events-auto z-30 group"
                  >
                    <div className="w-1.5 h-6 bg-white rounded-full shadow-md group-hover:scale-125 transition-transform" />
                  </div>

                  {/* Right */}
                  <div 
                    onMouseDown={(e) => startCropBoxDrag('resize-e', e)}
                    onTouchStart={(e) => startCropBoxDragTouch('resize-e', e)}
                    className="absolute top-1/2 -right-3 -translate-y-1/2 w-6 h-10 flex items-center justify-center cursor-ew-resize select-none pointer-events-auto z-30 group"
                  >
                    <div className="w-1.5 h-6 bg-white rounded-full shadow-md group-hover:scale-125 transition-transform" />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Bottom Toolbar: Phone Gallery Aspect Ratios + Rotations + Action Buttons */}
          <div className="pt-3 border-t border-slate-800/80 space-y-3">
            {/* Aspect Ratio Options */}
            <div className="flex items-center justify-center gap-1.5 flex-wrap">
              <button
                type="button"
                onClick={() => handleCropRatioChange('passport')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border flex items-center gap-1.5 transition-all cursor-pointer ${
                  cropAspectRatio === 'passport'
                    ? 'bg-blue-600 border-blue-500 text-white shadow-sm ring-1 ring-blue-400'
                    : 'bg-slate-900/90 border-slate-800 text-slate-300 hover:border-slate-700'
                }`}
              >
                <span>Passport ({selectedSizePreset.widthMm}×{selectedSizePreset.heightMm}mm)</span>
              </button>

              <button
                type="button"
                onClick={() => handleCropRatioChange('free')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border flex items-center gap-1.5 transition-all cursor-pointer ${
                  cropAspectRatio === 'free'
                    ? 'bg-blue-600 border-blue-500 text-white shadow-sm ring-1 ring-blue-400'
                    : 'bg-slate-900/90 border-slate-800 text-slate-300 hover:border-slate-700'
                }`}
              >
                <span>{language === 'hi' ? 'फ्री (Freeform)' : 'Freeform'}</span>
              </button>

              <button
                type="button"
                onClick={() => handleCropRatioChange('1:1')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border flex items-center gap-1.5 transition-all cursor-pointer ${
                  cropAspectRatio === '1:1'
                    ? 'bg-blue-600 border-blue-500 text-white shadow-sm ring-1 ring-blue-400'
                    : 'bg-slate-900/90 border-slate-800 text-slate-300 hover:border-slate-700'
                }`}
              >
                <Square className="w-3.5 h-3.5" />
                <span>1:1 Square</span>
              </button>

              <button
                type="button"
                onClick={() => handleCropRatioChange('4:3')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border flex items-center gap-1.5 transition-all cursor-pointer ${
                  cropAspectRatio === '4:3'
                    ? 'bg-blue-600 border-blue-500 text-white shadow-sm ring-1 ring-blue-400'
                    : 'bg-slate-900/90 border-slate-800 text-slate-300 hover:border-slate-700'
                }`}
              >
                <span>4:3</span>
              </button>

              <button
                type="button"
                onClick={() => handleCropRatioChange('16:9')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border flex items-center gap-1.5 transition-all cursor-pointer ${
                  cropAspectRatio === '16:9'
                    ? 'bg-blue-600 border-blue-500 text-white shadow-sm ring-1 ring-blue-400'
                    : 'bg-slate-900/90 border-slate-800 text-slate-300 hover:border-slate-700'
                }`}
              >
                <span>16:9</span>
              </button>
            </div>

            {/* Rotation / Flip and Final Action Buttons Row */}
            <div className="flex items-center justify-between flex-wrap gap-2 pt-1">
              {/* Transform Tools */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const nextRot = (cropRotation - 90 + 360) % 360;
                    setCropRotation(nextRot);
                    if (cropDisplayContainerRef.current) {
                      const imgEl = cropDisplayContainerRef.current.querySelector('img');
                      if (imgEl && imgEl.naturalWidth && imgEl.naturalHeight) {
                        let nw = imgEl.naturalWidth;
                        let nh = imgEl.naturalHeight;
                        if (nextRot === 90 || nextRot === 270) {
                          nw = imgEl.naturalHeight;
                          nh = imgEl.naturalWidth;
                        }
                        setCropBox(initCropBox(nw, nh, cropAspectRatio));
                      }
                    }
                  }}
                  className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 flex items-center gap-1.5 text-xs font-semibold transition-all cursor-pointer"
                  title="Rotate Left (-90°)"
                >
                  <RotateCcw className="w-4 h-4 text-blue-400" />
                  <span className="hidden sm:inline">Rotate -90°</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const nextRot = (cropRotation + 90) % 360;
                    setCropRotation(nextRot);
                    if (cropDisplayContainerRef.current) {
                      const imgEl = cropDisplayContainerRef.current.querySelector('img');
                      if (imgEl && imgEl.naturalWidth && imgEl.naturalHeight) {
                        let nw = imgEl.naturalWidth;
                        let nh = imgEl.naturalHeight;
                        if (nextRot === 90 || nextRot === 270) {
                          nw = imgEl.naturalHeight;
                          nh = imgEl.naturalWidth;
                        }
                        setCropBox(initCropBox(nw, nh, cropAspectRatio));
                      }
                    }
                  }}
                  className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 flex items-center gap-1.5 text-xs font-semibold transition-all cursor-pointer"
                  title="Rotate Right (+90°)"
                >
                  <RotateCw className="w-4 h-4 text-blue-400" />
                  <span className="hidden sm:inline">Rotate +90°</span>
                </button>

                <button
                  type="button"
                  onClick={() => setCropFlipH(f => !f)}
                  className={`p-2 rounded-xl border flex items-center gap-1.5 text-xs font-semibold transition-all cursor-pointer ${
                    cropFlipH 
                      ? 'bg-blue-600 border-blue-500 text-white' 
                      : 'bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border-slate-800'
                  }`}
                  title="Flip Horizontal"
                >
                  <FlipHorizontal className="w-4 h-4" />
                  <span className="hidden sm:inline">Flip</span>
                </button>
              </div>

              {/* Action Confirm / Cancel */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setCropModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-all cursor-pointer"
                >
                  {language === 'hi' ? 'रद्द करें (Cancel)' : 'Cancel'}
                </button>

                <button
                  type="button"
                  onClick={applyCrop}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/30 flex items-center gap-2 transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
                >
                  <Check className="w-4 h-4" />
                  <span>{language === 'hi' ? 'क्रॉप लागू करें (Apply Crop)' : 'Apply Crop'}</span>
                </button>
              </div>
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
