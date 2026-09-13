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
  ArrowLeft,
  RotateCcw,
  FlipHorizontal,
  FlipVertical,
  Crosshair,
  Lock,
  Unlock,
  X,
  Grid3X3,
  Square,
  Move,
  Pipette
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
import {
  calculateSheetLayout,
  renderSinglePassportCardCanvas,
  renderHighResSheetCanvas,
  generatePrintReadyPdf,
  syncDirectPrintDOM,
  DPI_300_DPM
} from '../utils/passport-print-engine';
import BgRemovalWorker from '../workers/bg-removal.worker?worker';
import PhotoEnhanceWorker from '../workers/photo-enhance.worker?worker';

let bgWorker: Worker | null = null;
let enhanceWorker: Worker | null = null;

const getWorker = () => {
  if (!bgWorker && typeof window !== 'undefined') {
    bgWorker = new BgRemovalWorker();
  }
  return bgWorker;
};

const getEnhanceWorker = () => {
  if (!enhanceWorker && typeof window !== 'undefined') {
    enhanceWorker = new PhotoEnhanceWorker();
  }
  return enhanceWorker;
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
  const [rawSourceImage, setRawSourceImage] = useState<string | null>(null);
  const [removedBgImg, setRemovedBgImg] = useState<string | null>(null);
  const [rawRemovedBgImg, setRawRemovedBgImg] = useState<string | null>(null);
  const [enhancedBgImg, setEnhancedBgImg] = useState<string | null>(null);
  const [useEnhancedPhoto, setUseEnhancedPhoto] = useState<boolean>(true);
  const [enhanceCount, setEnhanceCount] = useState<number>(0);
  const [enhancementStatus, setEnhancementStatus] = useState<'ready' | 'enhancing' | 'enhanced' | 'unavailable'>('ready');
  const [enhancementErrorMsg, setEnhancementErrorMsg] = useState<string | null>(null);
  const [isEnhancing, setIsEnhancing] = useState<boolean>(false);
  const [enhanceStepText, setEnhanceStepText] = useState<string>('');
  
  // Settings & Toggles
  const [sizePreset, setSizePreset] = useState<PassportPresetId>('eu_uk');
  const [sheetSize, setSheetSize] = useState<SheetSizeId>('size_4x6');
  const [customPaperWidthMm, setCustomPaperWidthMm] = useState<number>(100);
  const [customPaperHeightMm, setCustomPaperHeightMm] = useState<number>(150);

  // Background selection
  const [bgColorType, setBgColorType] = useState<'white' | 'blue' | 'lightgray' | 'red' | 'cyan' | 'offwhite' | 'transparent' | 'custom'>('white');
  const [customBgColor, setCustomBgColor] = useState('#ffffff');
  const [sheetPageIndex, setSheetPageIndex] = useState<number>(0);
  
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

  // Photoshop Pro Studio Crop Station state
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [cropBox, setCropBox] = useState<{ x: number; y: number; w: number; h: number } | null>(null);
  const [cropAspectRatio, setCropAspectRatio] = useState<'passport' | 'free' | '1:1' | '3:4' | '4:3' | '16:9'>('passport');
  const [cropSymmetricMode, setCropSymmetricMode] = useState<boolean>(true); // Photoshop Alt/Center Anchor scaling standard
  const [cropGridOverlay, setCropGridOverlay] = useState<'thirds' | 'grid' | 'crosshair' | 'none'>('thirds');
  const [cropRotation, setCropRotation] = useState<number>(0);
  const [cropFlipH, setCropFlipH] = useState<boolean>(false);
  const [cropFlipV, setCropFlipV] = useState<boolean>(false);
  const [cropDragAction, setCropDragAction] = useState<string | null>(null);
  const [cropDragStart, setCropDragStart] = useState<{ x: number; y: number; box: { x: number; y: number; w: number; h: number } }>({
    x: 0,
    y: 0,
    box: { x: 10, y: 10, w: 80, h: 80 }
  });
  const cropDisplayContainerRef = useRef<HTMLDivElement>(null);

  // Sync body class to hide overlapping fixed floating widgets (Feedback, etc.) during cropping
  useEffect(() => {
    if (cropModalOpen) {
      document.body.classList.add('snapid-modal-open');
    } else {
      document.body.classList.remove('snapid-modal-open');
    }
    return () => {
      document.body.classList.remove('snapid-modal-open');
    };
  }, [cropModalOpen]);

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
    } else if (ratioMode === '3:4') {
      targetRatio = 3 / 4;
    } else if (ratioMode === '4:3') {
      targetRatio = 4 / 3;
    } else if (ratioMode === '16:9') {
      targetRatio = 16 / 9;
    } else if (ratioMode === 'free') {
      targetRatio = containerRatio;
    }

    let w = 80;
    let h = (w / targetRatio) * containerRatio;
    if (h > 85) {
      h = 85;
      w = (h * targetRatio) / containerRatio;
    }
    if (w > 85) {
      w = 85;
      h = (w / targetRatio) * containerRatio;
    }
    const x = (100 - w) / 2;
    const y = (100 - h) / 2;
    return {
      x: Math.max(1, Math.min(95, x)),
      y: Math.max(1, Math.min(95, y)),
      w: Math.max(10, Math.min(98, w)),
      h: Math.max(10, Math.min(98, h)),
    };
  };

  const openPhotoshopCropModal = () => {
    if (!originalImage && !rawSourceImage) return;
    setCropRotation(0);
    setCropFlipH(false);
    setCropFlipV(false);
    setCropAspectRatio('passport');
    setCropSymmetricMode(true); // Default to Photoshop center symmetrical crop
    setCropModalOpen(true);
  };

  const handleCropRatioChange = (ratioMode: 'passport' | 'free' | '1:1' | '3:4' | '4:3' | '16:9') => {
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
    const minSize = 6;

    if (cropDragAction === 'move') {
      let newX = start.x + pctX;
      let newY = start.y + pctY;
      newX = Math.max(0, Math.min(100 - start.w, newX));
      newY = Math.max(0, Math.min(100 - start.h, newY));
      setCropBox({ ...start, x: newX, y: newY });
      return;
    }

    // Determine target aspect ratio multiplier in percentage coordinates
    let targetRatio = containerW / containerH;
    if (cropAspectRatio === 'passport') {
      targetRatio = selectedSizePreset.widthMm / selectedSizePreset.heightMm;
    } else if (cropAspectRatio === '1:1') {
      targetRatio = 1.0;
    } else if (cropAspectRatio === '3:4') {
      targetRatio = 3 / 4;
    } else if (cropAspectRatio === '4:3') {
      targetRatio = 4 / 3;
    } else if (cropAspectRatio === '16:9') {
      targetRatio = 16 / 9;
    } else if (cropAspectRatio === 'free') {
      targetRatio = (start.w / 100 * containerW) / (start.h / 100 * containerH);
    }

    const aspectRatioPct = targetRatio * (containerH / containerW);

    // 4-SIDE SYMMETRIC (CENTER-ANCHORED) UNIFORM CROP ENGINE
    // When dragging ANY of the 4 corners, Left, Right, Top, Bottom all resize equally around the center
    if (cropSymmetricMode) {
      const cx = start.x + start.w / 2;
      const cy = start.y + start.h / 2;
      const halfW = start.w / 2;
      const halfH = start.h / 2;

      let deltaHalfW = 0;
      if (cropDragAction === 'resize-se') {
        deltaHalfW = (pctX + pctY * aspectRatioPct) / 2;
      } else if (cropDragAction === 'resize-nw') {
        deltaHalfW = (-pctX - pctY * aspectRatioPct) / 2;
      } else if (cropDragAction === 'resize-ne') {
        deltaHalfW = (pctX - pctY * aspectRatioPct) / 2;
      } else if (cropDragAction === 'resize-sw') {
        deltaHalfW = (-pctX + pctY * aspectRatioPct) / 2;
      }

      let newHalfW = halfW + deltaHalfW;

      if (cropAspectRatio !== 'free') {
        // Max half-dimensions possible from center without exceeding container [0, 100]
        const maxHalfW_X = Math.min(cx, 100 - cx);
        const maxHalfH_Y = Math.min(cy, 100 - cy);
        const maxHalfWAllowed = Math.min(maxHalfW_X, maxHalfH_Y * aspectRatioPct);
        const minHalfW = Math.max(3, 3 * aspectRatioPct);

        newHalfW = Math.max(minHalfW, Math.min(maxHalfWAllowed, newHalfW));
        const newHalfH = newHalfW / aspectRatioPct;

        setCropBox({
          x: Math.max(0, cx - newHalfW),
          y: Math.max(0, cy - newHalfH),
          w: Math.min(100, newHalfW * 2),
          h: Math.min(100, newHalfH * 2),
        });
      } else {
        // Freeform symmetric mode
        const maxHalfW = Math.min(cx, 100 - cx);
        const maxHalfH = Math.min(cy, 100 - cy);
        let dHW = 0;
        let dHH = 0;
        if (cropDragAction === 'resize-se') {
          dHW = pctX;
          dHH = pctY;
        } else if (cropDragAction === 'resize-nw') {
          dHW = -pctX;
          dHH = -pctY;
        } else if (cropDragAction === 'resize-ne') {
          dHW = pctX;
          dHH = -pctY;
        } else if (cropDragAction === 'resize-sw') {
          dHW = -pctX;
          dHH = pctY;
        }
        let newHalfW = Math.max(3, Math.min(maxHalfW, halfW + dHW));
        let newHalfH = Math.max(3, Math.min(maxHalfH, halfH + dHH));

        setCropBox({
          x: Math.max(0, cx - newHalfW),
          y: Math.max(0, cy - newHalfH),
          w: Math.min(100, newHalfW * 2),
          h: Math.min(100, newHalfH * 2),
        });
      }
      return;
    } else {
      // Standard Corner Anchor Mode (Non-Symmetric)
      if (cropDragAction === 'resize-se') {
        let newW = Math.max(minSize, Math.min(100 - start.x, start.w + pctX));
        let newH = cropAspectRatio === 'free' ? Math.max(minSize, Math.min(100 - start.y, start.h + pctY)) : newW / aspectRatioPct;
        if (start.y + newH > 100) {
          newH = 100 - start.y;
          if (cropAspectRatio !== 'free') newW = newH * aspectRatioPct;
        }
        setCropBox({ ...start, w: newW, h: newH });
      } else if (cropDragAction === 'resize-sw') {
        let newX = Math.max(0, Math.min(start.x + start.w - minSize, start.x + pctX));
        let newW = (start.x + start.w) - newX;
        let newH = cropAspectRatio === 'free' ? Math.max(minSize, Math.min(100 - start.y, start.h + pctY)) : newW / aspectRatioPct;
        if (start.y + newH > 100) {
          newH = 100 - start.y;
          if (cropAspectRatio !== 'free') {
            newW = newH * aspectRatioPct;
            newX = (start.x + start.w) - newW;
          }
        }
        setCropBox({ ...start, x: newX, w: newW, h: newH });
      } else if (cropDragAction === 'resize-nw') {
        let newX = Math.max(0, Math.min(start.x + start.w - minSize, start.x + pctX));
        let newW = (start.x + start.w) - newX;
        let newH = cropAspectRatio === 'free' ? Math.max(minSize, (start.y + start.h) - (start.y + pctY)) : newW / aspectRatioPct;
        let newY = (start.y + start.h) - newH;
        if (newY < 0) {
          newY = 0;
          newH = start.y + start.h;
          if (cropAspectRatio !== 'free') {
            newW = newH * aspectRatioPct;
            newX = (start.x + start.w) - newW;
          }
        }
        setCropBox({ ...start, x: newX, y: newY, w: newW, h: newH });
      } else if (cropDragAction === 'resize-ne') {
        let newW = Math.max(minSize, Math.min(100 - start.x, start.w + pctX));
        let newH = cropAspectRatio === 'free' ? Math.max(minSize, (start.y + start.h) - (start.y + pctY)) : newW / aspectRatioPct;
        let newY = (start.y + start.h) - newH;
        if (newY < 0) {
          newY = 0;
          newH = start.y + start.h;
          if (cropAspectRatio !== 'free') newW = newH * aspectRatioPct;
        }
        setCropBox({ ...start, y: newY, w: newW, h: newH });
      } else if (cropDragAction === 'resize-n') {
        let newY = Math.max(0, Math.min(start.y + start.h - minSize, start.y + pctY));
        let newH = (start.y + start.h) - newY;
        let newW = cropAspectRatio === 'free' ? start.w : newH * aspectRatioPct;
        setCropBox({ ...start, y: newY, w: Math.min(100 - start.x, newW), h: newH });
      } else if (cropDragAction === 'resize-s') {
        let newH = Math.max(minSize, Math.min(100 - start.y, start.h + pctY));
        let newW = cropAspectRatio === 'free' ? start.w : newH * aspectRatioPct;
        setCropBox({ ...start, w: Math.min(100 - start.x, newW), h: newH });
      } else if (cropDragAction === 'resize-w') {
        let newX = Math.max(0, Math.min(start.x + start.w - minSize, start.x + pctX));
        let newW = (start.x + start.w) - newX;
        let newH = cropAspectRatio === 'free' ? start.h : newW / aspectRatioPct;
        setCropBox({ ...start, x: newX, w: newW, h: Math.min(100 - start.y, newH) });
      } else if (cropDragAction === 'resize-e') {
        let newW = Math.max(minSize, Math.min(100 - start.x, start.w + pctX));
        let newH = cropAspectRatio === 'free' ? start.h : newW / aspectRatioPct;
        setCropBox({ ...start, w: newW, h: Math.min(100 - start.y, newH) });
      }
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
      interCtx.scale(cropFlipH ? -1 : 1, cropFlipV ? -1 : 1);
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
      setRawRemovedBgImg(null);
      setEnhancedBgImg(null);
      setEnhanceCount(0);
      setEnhancementStatus('ready');
      setEnhancementErrorMsg(null);
      setUseEnhancedPhoto(true);
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

  // Keyboard shortcut listener for Photoshop Crop Modal
  useEffect(() => {
    if (!cropModalOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        applyCrop();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        setCropModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [cropModalOpen, cropBox, cropRotation, cropFlipH, cropFlipV, rawSourceImage, originalImage]);

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

  // Keep copies count bounded between 1 and 64 (multi-page sheets supported automatically)
  useEffect(() => {
    if (photosCopiesCount < 1) {
      setPhotosCopiesCount(1);
    } else if (photosCopiesCount > 64) {
      setPhotosCopiesCount(64);
    }
  }, [photosCopiesCount]);

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
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';

          // If downsizing by more than 2x, do step-down halving for razor-sharp clarity
          if (originalW > width * 2 || originalH > height * 2) {
            let stepC = document.createElement('canvas');
            stepC.width = originalW;
            stepC.height = originalH;
            let stepCtx = stepC.getContext('2d')!;
            stepCtx.drawImage(img, 0, 0, originalW, originalH);
            let sW = originalW;
            let sH = originalH;

            while (sW > width * 2 || sH > height * 2) {
              const nW = Math.max(width, Math.floor(sW * 0.5));
              const nH = Math.max(height, Math.floor(sH * 0.5));
              const nCanvas = document.createElement('canvas');
              nCanvas.width = nW;
              nCanvas.height = nH;
              const nCtx = nCanvas.getContext('2d')!;
              nCtx.imageSmoothingEnabled = true;
              nCtx.imageSmoothingQuality = 'high';
              nCtx.drawImage(stepC, 0, 0, nW, nH);
              stepC = nCanvas;
              sW = nW;
              sH = nH;
            }
            ctx.drawImage(stepC, 0, 0, width, height);
          } else {
            ctx.drawImage(img, 0, 0, width, height);
          }

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
      setRawRemovedBgImg(null);
      setEnhancedBgImg(null);
      setEnhanceCount(0);
      setEnhancementStatus('ready');
      setEnhancementErrorMsg(null);
      setUseEnhancedPhoto(true);
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
    setAiStep(language === 'hi' ? 'शुरू हो रहा है...' : 'Loading...');
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

        setAiStep(language === 'hi' ? 'बैकग्राउंड हटाया जा रहा है...' : 'Processing...');

        try {
          const overallStart = performance.now();

          // Fetch image and build file blob
          const fetchStart = performance.now();
          const response = await fetch(src);
          const inputBlob = await response.blob();
          
          const worker = getWorker();
          if (!worker) throw new Error('Worker could not be initialized');

          const aiInferenceStart = performance.now();
          const resultBlob = await new Promise<Blob>((resolve, reject) => {
            const handleMessage = (e: MessageEvent) => {
              if (e.data.type === 'progress') {
                if (src !== latestRequestedSrcRef.current) return;
                const { percent } = e.data;
                setAiStep(
                  language === 'hi' 
                    ? `प्रोसेसिंग... (${percent || 0}%)` 
                    : `Loading... (${percent || 0}%)`
                );
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

          const totalElapsed = ((performance.now() - overallStart) / 1000).toFixed(2);
          console.log(`[U2-NetP PIPELINE TOTAL] Background removal completed in ${totalElapsed}s`);

          // Only update the state if this represents the latest requested image
          if (src === latestRequestedSrcRef.current) {
            const transparentUrl = URL.createObjectURL(resultBlob);
            setRawRemovedBgImg(transparentUrl);
            setRemovedBgImg(transparentUrl);
            setEnhancedBgImg(null);
            setEnhancementStatus('ready');
            setEnhancementErrorMsg(null);
            setUseEnhancedPhoto(true);

            // Automatically run professional AI photo enhancement in the background (Pass 1)
            runAiPhotoEnhancement(resultBlob, true);
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

  // AI Photo Enhancement runner (supports iterative passes & super-resolution)
  const runAiPhotoEnhancement = async (inputBlob: Blob, isFirstAutoPass = false) => {
    setIsEnhancing(true);
    setEnhancementStatus('enhancing');
    setEnhanceStepText('Analyzing image clarity...');
    setEnhancementErrorMsg(null);

    try {
      const worker = getEnhanceWorker();
      if (!worker) throw new Error('AI Enhancement worker unavailable');

      const enhancedBlob = await new Promise<Blob>((resolve, reject) => {
        const handleMessage = (e: MessageEvent) => {
          if (e.data.type === 'progress') {
            setEnhanceStepText(e.data.step || 'Enhancing photo...');
          } else if (e.data.type === 'success') {
            worker.removeEventListener('message', handleMessage);
            resolve(e.data.blob);
          } else if (e.data.type === 'error') {
            worker.removeEventListener('message', handleMessage);
            reject(new Error(e.data.error || 'Enhancement failed'));
          }
        };
        worker.addEventListener('message', handleMessage);
        worker.postMessage({
          type: 'enhance',
          blob: inputBlob,
          strength: 1.0
        });
      });

      const enhancedUrl = URL.createObjectURL(enhancedBlob);
      setEnhancedBgImg(enhancedUrl);
      setEnhancementStatus('enhanced');
      setUseEnhancedPhoto(true);
      setRemovedBgImg(enhancedUrl);

      if (isFirstAutoPass) {
        setEnhanceCount(1);
      } else {
        setEnhanceCount((prev) => prev + 1);
      }
    } catch (err: any) {
      console.warn('AI photo enhancement failed:', err);
      setEnhancementStatus('unavailable');
      setEnhancementErrorMsg("AI enhancement couldn't be completed. Original photo is ready.");
    } finally {
      setIsEnhancing(false);
      setEnhanceStepText('');
    }
  };

  // Toggle between Enhanced and Original background-removed version
  const handleToggleEnhanced = (useEnhanced: boolean) => {
    setUseEnhancedPhoto(useEnhanced);
    if (useEnhanced && enhancedBgImg) {
      setRemovedBgImg(enhancedBgImg);
    } else if (rawRemovedBgImg) {
      setRemovedBgImg(rawRemovedBgImg);
    }
  };

  // Manual trigger for Enhance Photo button (iterative multi-pass enhancement on each click)
  const handleManualEnhanceClick = async () => {
    // If currently using enhanced version, enhance that version further; otherwise enhance raw original
    const srcToEnhance = (useEnhancedPhoto && enhancedBgImg) ? enhancedBgImg : (rawRemovedBgImg || removedBgImg);
    if (!srcToEnhance || isEnhancing) return;

    try {
      const resp = await fetch(srcToEnhance);
      const blob = await resp.blob();
      await runAiPhotoEnhancement(blob, false);
    } catch (err) {
      console.warn('Manual enhancement fetch failed:', err);
      setEnhancementStatus('unavailable');
      setEnhancementErrorMsg("AI enhancement couldn't be completed. Original photo is ready.");
    }
  };

  // Reset enhancement back to 0x Original
  const handleResetEnhancement = () => {
    if (!rawRemovedBgImg) return;
    setUseEnhancedPhoto(false);
    setRemovedBgImg(rawRemovedBgImg);
    setEnhancedBgImg(null);
    setEnhanceCount(0);
    setEnhancementStatus('ready');
    setEnhancementErrorMsg(null);
  };

  // Get background color string
  const getBackgroundColor = () => {
    switch (bgColorType) {
      case 'white': return '#ffffff';
      case 'blue': return '#004494';
      case 'lightgray': return '#e5e7eb';
      case 'red': return '#d21034';
      case 'cyan': return '#38bdf8';
      case 'offwhite': return '#f8fafc';
      case 'transparent': return 'transparent';
      case 'custom': return customBgColor || '#ffffff';
      default: return '#ffffff';
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

  // Physical print engine config helper
  const getPrintEngineConfig = () => {
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

    return {
      pageWidthMm,
      pageHeightMm,
      photoWidthMm: selectedSizePreset.widthMm,
      photoHeightMm: selectedSizePreset.heightMm,
      copiesCount: sheetSize === 'single' ? 1 : photosCopiesCount,
      borderWidthMm: borderWidth,
      borderColor: borderColor,
      isSingle: sheetSize === 'single'
    };
  };

  // Live Sheet lay-up render grid sheet preview using fast responsive Engine
  useEffect(() => {
    const sheetCanvas = sheetCanvasRef.current;
    if (!sheetCanvas || !previewCanvasRef.current || !originalImage) return;

    const singleCanvas = previewCanvasRef.current;
    const config = getPrintEngineConfig();
    
    // Ensure sheetPageIndex is valid
    const layout = calculateSheetLayout(config, sheetPageIndex);
    const safePageIndex = Math.max(0, Math.min(layout.totalPages - 1, sheetPageIndex));
    if (safePageIndex !== sheetPageIndex) {
      setSheetPageIndex(safePageIndex);
    }

    // Fast screen preview DPM (caps at ~900px wide for instantaneous 60fps rendering without memory freeze)
    const previewDpm = Math.min(DPI_300_DPM, Math.max(3.0, 900 / Math.max(config.pageWidthMm, config.pageHeightMm)));

    // Render fast preview sheet canvas
    const renderedSheet = renderHighResSheetCanvas(singleCanvas, config, safePageIndex, previewDpm);
    sheetCanvas.width = renderedSheet.width;
    sheetCanvas.height = renderedSheet.height;

    const ctx = sheetCanvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(renderedSheet, 0, 0);
    }
  }, [
    sizePreset, 
    sheetSize, 
    photosCopiesCount,
    sheetPageIndex,
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
    link.href = previewCanvasRef.current.toDataURL('image/png', 1.0);
    link.click();
  };

  // Download Entire Compiled Sheet layout as 300 DPI PNG
  const downloadSheetPng = () => {
    if (!previewCanvasRef.current) return;
    const config = getPrintEngineConfig();
    const sheetCanvas = renderHighResSheetCanvas(previewCanvasRef.current, config, sheetPageIndex);
    const link = document.createElement('a');
    link.download = `SnapID_Passport_${selectedSizePreset.id}_sheet_${selectedSheetPreset.id}_page${sheetPageIndex + 1}.png`;
    link.href = sheetCanvas.toDataURL('image/png', 1.0);
    link.click();
  };

  // Download Exact Millimetric High-Quality PDF ready-for-print
  const downloadSheetPdf = async () => {
    if (!previewCanvasRef.current) return;

    try {
      const config = getPrintEngineConfig();
      const filename = `SnapID_Passport_${selectedSizePreset.id}_sheet_${selectedSheetPreset.id}.pdf`;
      await generatePrintReadyPdf(previewCanvasRef.current, config, filename);
    } catch (e) {
      console.error('PDF creation error:', e);
      alert('Failed to generate PDF layout. Please try downloading as PNG.');
    }
  };

  // Instant 1st-try Direct Print Trigger
  const handleDirectPrint = async () => {
    if (!previewCanvasRef.current || !originalImage) {
      alert(language === 'hi' 
        ? "कृपया प्रिंट करने से पहले फोटो अपलोड और प्रोसेस करें।"
        : "Please upload and process an image first before printing.");
      return;
    }
    const config = getPrintEngineConfig();
    await syncDirectPrintDOM(previewCanvasRef.current, config);
    setTimeout(() => {
      window.print();
    }, 40);
  };

  // Keyboard Shortcuts: F8 (8 photos), F9 (32 photos), Alt+E / F4 (AI Enhance), Ctrl+P (Direct Print)
  useEffect(() => {
    const handleKeyDown = async (e: KeyboardEvent) => {
      if (e.key === 'F8') {
        e.preventDefault();
        setPhotosCopiesCount(8);
      } else if (e.key === 'F9') {
        e.preventDefault();
        setPhotosCopiesCount(32);
      } else if (e.key === 'F4' || (e.altKey && (e.key === 'e' || e.key === 'E'))) {
        e.preventDefault();
        handleManualEnhanceClick();
      } else if ((e.ctrlKey || e.metaKey) && (e.key === 'p' || e.key === 'P')) {
        if (originalImage && previewCanvasRef.current) {
          e.preventDefault();
          const config = getPrintEngineConfig();
          await syncDirectPrintDOM(previewCanvasRef.current, config);
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
  }, [
    originalImage, 
    sheetSize, 
    photosCopiesCount, 
    sizePreset, 
    customPaperWidthMm, 
    customPaperHeightMm, 
    singleCanvasUpdated,
    useEnhancedPhoto,
    enhancedBgImg,
    rawRemovedBgImg,
    removedBgImg,
    isEnhancing,
    borderWidth,
    borderColor
  ]);

  // Browser BeforePrint fallback hook
  useEffect(() => {
    const handleBeforePrint = () => {
      if (previewCanvasRef.current) {
        const config = getPrintEngineConfig();
        syncDirectPrintDOM(previewCanvasRef.current, config);
      }
    };

    window.addEventListener('beforeprint', handleBeforePrint);
    return () => {
      window.removeEventListener('beforeprint', handleBeforePrint);
    };
  }, [originalImage, sheetSize, customPaperWidthMm, customPaperHeightMm, photosCopiesCount, sizePreset, borderWidth, borderColor]);

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
        /* Empty upload area with subtle premium glowing style */
        <div 
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`relative overflow-hidden group border-2 rounded-3xl p-8 sm:p-14 text-center transition-all duration-300 ${
            isDragOver 
              ? 'border-blue-500 bg-blue-500/10 scale-[1.01] shadow-[0_0_30px_rgba(59,130,246,0.3)]' 
              : theme === 'dark'
                ? 'border-blue-500/50 bg-gradient-to-br from-slate-900/90 via-blue-950/20 to-slate-900/90 shadow-[0_0_24px_rgba(59,130,246,0.18)] hover:border-blue-400 hover:shadow-[0_0_32px_rgba(59,130,246,0.32)]'
                : 'border-blue-300/80 bg-gradient-to-br from-blue-50/80 via-sky-50/40 to-indigo-50/30 shadow-[0_4px_22px_rgba(37,99,235,0.12)] hover:border-blue-500 hover:shadow-[0_6px_28px_rgba(37,99,235,0.22)]'
          }`}
        >
          <div className="relative z-10 max-w-md mx-auto flex flex-col items-center">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-lg shadow-blue-500/30 mb-4 group-hover:scale-110 transition-transform duration-300">
              <Upload className="w-6 h-6 sm:w-7 sm:h-7 animate-bounce" />
            </div>
            <h3 className="font-extrabold text-base sm:text-xl text-slate-900 dark:text-white tracking-tight">
              {t.photoUploadLabel}
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-sm mx-auto mt-2 mb-6">
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
              <label className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-xs sm:text-sm shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 cursor-pointer transition-all hover:scale-105 active:scale-95">
                <Maximize2 className="w-4 h-4" />
                <span>Select Local Photo</span>
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={handlePhotoUpload} 
                  className="hidden" 
                />
              </label>
            )}

            <div className="mt-6 flex flex-wrap items-center justify-center gap-2 text-[11px] font-mono text-slate-400 dark:text-slate-400">
              <span className="px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 font-bold">
                ⚡ 300 DPI Studio Quality
              </span>
              <span className="px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 font-medium">
                AI Auto Background Removal
              </span>
            </div>
          </div>
        </div>
      ) : (
        /* Portrait loaded, show modular workspace */
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
          
          {/* Left panel / Center Preview Area (8-cols on desktop for bigger viewports) */}
          <div className="xl:col-span-8 flex flex-col gap-4">
            
            {/* Tab header buttons */}
            <div className={`flex p-1 sm:p-1.5 rounded-xl border shrink-0 subtle-element-glow ${
              theme === 'dark' ? 'bg-slate-950 border-slate-900' : 'bg-slate-100 border-slate-200'
            }`}>
              <button
                onClick={() => setActiveTab('adjust')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 sm:py-2.5 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
                  activeTab === 'adjust'
                    ? theme === 'dark'
                      ? 'bg-slate-900 text-white shadow-md subtle-glow-active'
                      : 'bg-white text-slate-900 shadow-sm subtle-glow-active'
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
                      ? 'bg-slate-900 text-white shadow-md subtle-glow-active'
                      : 'bg-white text-slate-900 shadow-sm subtle-glow-active'
                    : 'text-slate-400 hover:text-inherit'
                }`}
              >
                <Layout className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span>
                  <span className="hidden sm:inline">Print Layup Grid ({selectedSheetPreset.nameEn.split('(')[0].trim()})</span>
                  <span className="sm:hidden">Print Grid</span>
                </span>
              </button>
            </div>

            {/* Render selected canvas stage */}
            <div className={`relative border rounded-2xl overflow-hidden min-h-[300px] sm:aspect-[4/3] w-full flex items-center justify-center p-3 sm:p-6 subtle-glow-card ${
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
                  <div className={`flex p-1 rounded-xl gap-1 mb-3 shrink-0 subtle-element-glow ${
                    theme === 'dark' ? 'bg-slate-900 border border-slate-800' : 'bg-slate-150 border border-slate-200'
                  }`}>
                    <button
                      type="button"
                      onClick={() => setShowBeforePreview(false)}
                      className={`px-2.5 py-1.5 text-[10px] sm:text-xs font-bold rounded-lg transition-all cursor-pointer ${
                        !showBeforePreview
                          ? theme === 'dark' ? 'bg-blue-600 text-white shadow-md subtle-glow-active' : 'bg-white text-slate-900 shadow-sm subtle-glow-active'
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
                          ? theme === 'dark' ? 'bg-slate-800 text-white shadow-md subtle-glow-active' : 'bg-white text-slate-900 shadow-sm subtle-glow-active'
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
                  className={`relative w-auto h-full max-h-[350px] shadow-xl overflow-hidden border border-dashed cursor-move select-none rounded-[1px] subtle-element-glow ${
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

                {/* Multi-Page Sheet Navigation Controls */}
                {(() => {
                  const config = getPrintEngineConfig();
                  const layout = calculateSheetLayout(config, sheetPageIndex);
                  if (layout.totalPages > 1) {
                    return (
                      <div className="mt-2.5 flex items-center justify-center gap-3">
                        <button
                          type="button"
                          disabled={sheetPageIndex <= 0}
                          onClick={() => setSheetPageIndex(p => Math.max(0, p - 1))}
                          className={`px-3 py-1 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                            sheetPageIndex <= 0
                              ? 'opacity-40 cursor-not-allowed border-slate-800 text-slate-600 bg-slate-900'
                              : 'border-blue-500/40 bg-blue-500/10 text-blue-400 hover:bg-blue-500/20'
                          }`}
                        >
                          ← Prev Page
                        </button>
                        <span className="text-xs font-mono font-bold text-slate-200 bg-slate-800/80 px-3 py-1 rounded-lg border border-slate-700">
                          Sheet {sheetPageIndex + 1} of {layout.totalPages} ({layout.photosOnPage} photos)
                        </span>
                        <button
                          type="button"
                          disabled={sheetPageIndex >= layout.totalPages - 1}
                          onClick={() => setSheetPageIndex(p => Math.min(layout.totalPages - 1, p + 1))}
                          className={`px-3 py-1 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                            sheetPageIndex >= layout.totalPages - 1
                              ? 'opacity-40 cursor-not-allowed border-slate-800 text-slate-600 bg-slate-900'
                              : 'border-blue-500/40 bg-blue-500/10 text-blue-400 hover:bg-blue-500/20'
                          }`}
                        >
                          Next Page →
                        </button>
                      </div>
                    );
                  }
                  return null;
                })()}

                <div className="mt-3 flex flex-wrap items-center justify-center gap-2 sm:gap-3.5 text-xs text-slate-400 font-medium text-center">
                  <span className="truncate max-w-[260px] sm:max-w-none">Layout Sheet: {selectedSheetPreset.nameEn} ({photosCopiesCount} Photos Total)</span>
                  <span className="hidden sm:inline">•</span>
                  <span>300 DPI Studio Grade Output</span>
                </div>
              </div>

            </div>

            {/* Quick action buttons row inside panel */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              <button
                onClick={() => {
                  setOriginalImage(null);
                  setRemovedBgImg(null);
                  setRawRemovedBgImg(null);
                  setEnhancedBgImg(null);
                  setEnhanceCount(0);
                  setEnhancementStatus('ready');
                  setEnhancementErrorMsg(null);
                }}
                className={`w-full sm:w-auto px-3.5 py-2.5 rounded-xl text-xs font-semibold border flex items-center justify-center gap-2 transition-colors cursor-pointer subtle-glow-button ${
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
                    className={`w-full sm:w-auto px-5 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer subtle-glow-button ${
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
                  <div className="w-full sm:w-auto flex items-center justify-center gap-2 text-xs bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 font-bold px-3 py-2.5 rounded-xl subtle-element-glow">
                    <Check className="w-3.5 h-3.5" />
                    <span>AI Background Extracted</span>
                  </div>
                )}
              </div>
            </div>

            {/* Side-by-Side: Print & Print Layout / Back to Edit (Always Visible) */}
            <div className="grid grid-cols-2 gap-2 sm:gap-2.5 md:gap-3 w-full">
              {/* 1. PRINT BUTTON */}
              <button
                type="button"
                id="snapid-passport-print-btn"
                onClick={handleDirectPrint}
                className="w-full py-2 sm:py-2.5 md:py-3.5 px-2 sm:px-3 md:px-4 rounded-xl font-bold text-[11px] sm:text-xs md:text-sm lg:text-base text-white bg-blue-600 hover:bg-blue-550 active:bg-blue-700 flex items-center justify-center gap-1.5 sm:gap-2 cursor-pointer transition-all border border-blue-500/20 subtle-glow-button active:scale-[0.98]"
              >
                <Printer className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5 shrink-0" />
                <span>Print</span>
              </button>
              
              {/* 2. PRINT LAYOUT / BACK TO EDIT BUTTON */}
              <button
                type="button"
                id="snapid-passport-tab-toggle-btn"
                onClick={() => {
                  if (activeTab === 'sheet') {
                    setActiveTab('adjust');
                  } else {
                    setActiveTab('sheet');
                  }
                }}
                className={`w-full py-2 sm:py-2.5 md:py-3.5 px-2 sm:px-3 md:px-4 rounded-xl font-bold text-[11px] sm:text-xs md:text-sm lg:text-base border flex items-center justify-center gap-1.5 sm:gap-2 cursor-pointer transition-all subtle-glow-button active:scale-[0.98] ${
                  activeTab === 'sheet'
                    ? 'bg-blue-600/15 border-blue-500/30 text-blue-400 hover:bg-blue-600/25'
                    : theme === 'dark' 
                      ? 'bg-slate-900 hover:bg-slate-800 border-slate-800 text-white' 
                      : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-800'
                }`}
              >
                {activeTab === 'sheet' ? (
                  <>
                    <ArrowLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5 text-blue-400 shrink-0" />
                    <span>{language === 'hi' ? 'वापस जाएं (Back)' : 'Back to Edit'}</span>
                  </>
                ) : (
                  <>
                    <Layout className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5 text-blue-400 shrink-0" />
                    <span>Print Layout</span>
                  </>
                )}
              </button>
            </div>

            {/* Mobile / Tablet detailed loading state */}
            {isRemovingBg && (
              <div className={`p-4 rounded-xl border text-center space-y-2 animate-pulse subtle-glow-card ${
                theme === 'dark' ? 'bg-slate-900/60 border-slate-800' : 'bg-blue-50/50 border-blue-100'
              }`}>
                <div className="flex items-center justify-center gap-2">
                  <RefreshCw className="w-4 h-4 text-blue-500 animate-spin" />
                  <span className="text-sm font-bold text-blue-500">{aiStep || (language === 'hi' ? 'लोड हो रहा है...' : 'Loading...')}</span>
                </div>
                <p className="text-[10px] text-slate-400 max-w-sm mx-auto">
                  {language === 'hi'
                    ? 'कृपया प्रतीक्षा करें, फोटो प्रोसेस की जा रही है (100% सुरक्षित एवं निजी)...'
                    : 'Please wait, processing image securely in your browser...'}
                </p>
              </div>
            )}

          </div>

          {/* Right Panel: Settings panels, sliders, borders, choices (4-cols on desktop) */}
          <div className="xl:col-span-4 space-y-6">
            
            {/* Panel Card: Target Spec & Document Sizes */}
            <div className={`p-5 rounded-2xl border subtle-glow-card ${
              theme === 'dark' ? 'bg-slate-950 border-slate-900' : 'bg-white border-slate-200 shadow-sm'
            } space-y-4`}>
              <div className="flex items-center justify-between border-b pb-2">
                <h3 className="font-bold text-xs tracking-tight flex items-center gap-1.5">
                  <Layout className="w-3.5 h-3.5 text-blue-500" />
                  <span>Layout Specifications</span>
                </h3>
                <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-500 max-w-[120px] truncate subtle-element-glow" title={selectedSheetPreset.nameEn}>
                  {selectedSheetPreset.id === 'single' ? 'Single' : selectedSheetPreset.nameEn.split('(')[0].trim()}
                </span>
              </div>

              {/* 1. Passport Photo Size Selection */}
              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1 uppercase tracking-wider">
                  {language === 'hi' ? 'फोटो आकार (Photo Size)' : 'Passport Size'}
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  {PASSPORT_PRESETS.map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => setSizePreset(preset.id)}
                      className={`px-2 py-1.5 rounded-lg text-left border transition-all cursor-pointer min-w-0 subtle-glow-button ${
                        sizePreset === preset.id
                          ? 'border-blue-500 bg-blue-500/10 font-bold text-blue-500 ring-1 ring-blue-500 subtle-glow-active'
                          : theme === 'dark'
                            ? 'border-slate-800 hover:border-slate-750 text-slate-300 bg-slate-900/40'
                            : 'border-slate-200 hover:border-slate-300 text-slate-700 bg-slate-50'
                      }`}
                      title={language === 'hi' ? preset.nameHi : preset.nameEn}
                    >
                      <div className="font-bold truncate text-[11px] leading-tight">
                        {language === 'hi' ? preset.nameHi.split('(')[0] : preset.nameEn.split('(')[0]}
                      </div>
                      <div className="text-[10px] font-mono text-slate-400 truncate">
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
                    className={`w-full appearance-none px-3 py-2 pr-8 rounded-lg text-xs font-bold border transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 subtle-element-glow ${
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
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 pt-0.5">
                  <button
                    type="button"
                    onClick={() => {
                      setSheetSize('size_4x6');
                      setPhotosCopiesCount(8);
                    }}
                    className={`px-1.5 py-1.5 rounded text-[10px] font-bold border text-center transition-all cursor-pointer truncate subtle-glow-button ${
                      sheetSize === 'size_4x6'
                        ? 'border-blue-500 bg-blue-500/15 text-blue-500 ring-1 ring-blue-500 subtle-glow-active'
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
                    className={`px-1.5 py-1.5 rounded text-[10px] font-bold border text-center transition-all cursor-pointer truncate subtle-glow-button ${
                      sheetSize === 'size_a4'
                        ? 'border-blue-500 bg-blue-500/15 text-blue-500 ring-1 ring-blue-500 subtle-glow-active'
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
                    className={`px-1.5 py-1.5 rounded text-[10px] font-bold border text-center transition-all cursor-pointer truncate subtle-glow-button ${
                      sheetSize === 'size_5x7'
                        ? 'border-blue-500 bg-blue-500/15 text-blue-500 ring-1 ring-blue-500 subtle-glow-active'
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
                    className={`px-1.5 py-1.5 rounded text-[10px] font-bold border text-center transition-all cursor-pointer truncate subtle-glow-button ${
                      sheetSize === 'single'
                        ? 'border-blue-500 bg-blue-500/15 text-blue-500 ring-1 ring-blue-500 subtle-glow-active'
                        : theme === 'dark' ? 'border-slate-800 bg-slate-900/60 text-slate-400 hover:text-slate-200' : 'border-slate-200 bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                    title="Single Photo"
                  >
                    Single
                  </button>
                </div>

                {/* User-Defined Custom Millimeter inputs */}
                {sheetSize === 'size_user_defined' && (
                  <div className={`p-2 rounded-lg border space-y-1.5 animate-fadeIn subtle-element-glow ${
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
                          className={`w-full px-2 py-1 rounded text-xs font-mono font-bold border subtle-element-glow ${
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
                          className={`w-full px-2 py-1 rounded text-xs font-mono font-bold border subtle-element-glow ${
                            theme === 'dark' ? 'bg-slate-950 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                          }`}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* 3. Copies Selection Panel - Compact Interactive Stepper & Studio Presets */}
              {sheetSize !== 'single' && (
                <div className="pt-1.5 border-t border-slate-200/60 dark:border-slate-800/60 animate-fadeIn space-y-2">
                  <div className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg border subtle-element-glow ${
                    theme === 'dark' ? 'bg-slate-900/50 border-slate-800' : 'bg-slate-50 border-slate-200'
                  }`}>
                    <div className="flex flex-col">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        {language === 'hi' ? 'फोटो संख्या (Photo Quantity)' : 'Photo Quantity'}
                      </span>
                      <span className="text-[9px] text-blue-500 font-medium font-mono">
                        {photosCopiesCount > maxCopiesOnPaper 
                          ? `${Math.ceil(photosCopiesCount / maxCopiesOnPaper)} Sheets (${maxCopiesOnPaper}/sheet)`
                          : `1 Sheet (${photosCopiesCount}/${maxCopiesOnPaper} slots)`}
                      </span>
                    </div>

                    {/* Stepper (- [count] +) */}
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        id="passport-copies-decrease-btn"
                        disabled={photosCopiesCount <= 1}
                        onClick={() => setPhotosCopiesCount(prev => Math.max(1, prev - 1))}
                        className={`w-7 h-7 rounded-md flex items-center justify-center font-bold border transition-all cursor-pointer select-none subtle-glow-button ${
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

                      <div className="min-w-[32px] text-center">
                        <span className="text-sm font-black font-mono text-blue-500">
                          {photosCopiesCount}
                        </span>
                      </div>

                      <button
                        type="button"
                        id="passport-copies-increase-btn"
                        disabled={photosCopiesCount >= 64}
                        onClick={() => setPhotosCopiesCount(prev => Math.min(64, prev + 1))}
                        className={`w-7 h-7 rounded-md flex items-center justify-center font-bold border transition-all cursor-pointer select-none subtle-glow-button ${
                          photosCopiesCount >= 64
                            ? 'opacity-30 cursor-not-allowed border-slate-800 bg-slate-950 text-slate-600'
                            : 'border-blue-500 bg-blue-600 text-white hover:bg-blue-500 active:scale-95 shadow-sm shadow-blue-500/20'
                        }`}
                        title={language === 'hi' ? 'बढ़ाएं (+1)' : 'Increase (+1)'}
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Preset quick studio counts */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[9px] text-slate-400 font-semibold uppercase tracking-wider">Studio Layouts:</span>
                      <span className="text-[8px] font-mono text-slate-500">Shortcuts: F8=8, F9=32</span>
                    </div>
                    <div className="grid grid-cols-6 gap-1">
                      {[4, 6, 8, 12, 16, 32].map(count => (
                        <button
                          key={count}
                          type="button"
                          onClick={() => setPhotosCopiesCount(count)}
                          className={`py-1 rounded text-[10px] font-mono font-bold border text-center transition-all cursor-pointer subtle-glow-button ${
                            photosCopiesCount === count
                              ? 'border-blue-500 bg-blue-500 text-white subtle-glow-active'
                              : theme === 'dark' 
                                ? 'border-slate-800 bg-slate-900 text-slate-300 hover:text-white hover:border-slate-700' 
                                : 'border-slate-200 bg-slate-100 text-slate-700 hover:bg-slate-200'
                          }`}
                          title={`${count} Photos${count === 8 ? ' (F8)' : count === 32 ? ' (F9)' : ''}`}
                        >
                          {count}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Panel Card: Professional Crop & Align Studio Tool (Single Primary Location) */}
            <div className={`p-4 sm:p-5 rounded-2xl border subtle-glow-card ${
              theme === 'dark' 
                ? 'bg-gradient-to-b from-blue-950/20 via-slate-950 to-slate-950 border-blue-500/30 shadow-lg shadow-blue-500/5' 
                : 'bg-gradient-to-b from-blue-50/50 via-white to-white border-blue-200 shadow-sm'
            } space-y-3`}>
              <div className="flex items-center justify-between border-b pb-2 border-slate-200/60 dark:border-slate-800/60">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-500 border border-blue-500/20">
                    <Crop className="w-4 h-4 text-blue-500" />
                  </div>
                  <div>
                    <h3 className="font-bold text-xs sm:text-sm tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                      <span>{language === 'hi' ? 'फोटो क्रॉप एवं अलाइन (Crop Tool)' : 'Crop & Align Tool'}</span>
                      <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-blue-500/15 text-blue-400 border border-blue-500/30">
                        {selectedSizePreset.widthMm}x{selectedSizePreset.heightMm}mm
                      </span>
                    </h3>
                    <p className="text-[10px] text-slate-400 font-medium">
                      {language === 'hi' ? 'पासपोर्ट फेस रेश्यो के अनुसार परफेक्ट फ्रेमिंग' : 'Precision crop box & instant alignment'}
                    </p>
                  </div>
                </div>
              </div>

              <button
                type="button"
                id="passport-top-crop-action-btn"
                onClick={openPhotoshopCropModal}
                className="w-full py-2.5 sm:py-3 px-4 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2.5 transition-all cursor-pointer bg-blue-600 hover:bg-blue-550 text-white shadow-md shadow-blue-600/25 active:scale-[0.99] border border-blue-400/30"
              >
                <Crop className="w-4 h-4 text-white" />
                <span>{language === 'hi' ? '✂️ फोटो क्रॉप करें (Open Crop Box)' : '✂️ Crop Photo (Studio Box)'}</span>
              </button>
            </div>

            {/* Panel Card: AI Photo Enhance */}
            <div className={`p-4 sm:p-5 rounded-2xl border subtle-glow-card ${
              theme === 'dark' ? 'bg-slate-950 border-slate-900' : 'bg-white border-slate-200 shadow-sm'
            } space-y-3.5`}>
              <div className="flex items-center justify-between border-b pb-2 border-slate-200/60 dark:border-slate-800/60">
                <div>
                  <h3 className="font-bold text-xs sm:text-sm tracking-tight flex items-center gap-1.5 text-slate-900 dark:text-slate-100">
                    <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-500 shrink-0" />
                    <span>✨ AI Photo Enhance</span>
                  </h3>
                  <p className="text-[10px] text-slate-400 mt-0.5 font-medium">
                    Improve clarity & print quality
                  </p>
                </div>

                {/* Status Badge */}
                <div>
                  {enhancementStatus === 'enhancing' ? (
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-400 border border-blue-500/30 flex items-center gap-1 animate-pulse">
                      <RefreshCw className="w-2.5 h-2.5 animate-spin" />
                      <span>{enhanceStepText || 'Enhancing...'}</span>
                    </span>
                  ) : enhancementStatus === 'enhanced' ? (
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                      <Check className="w-2.5 h-2.5" />
                      <span>Enhanced{enhanceCount > 1 ? ` (${enhanceCount}x)` : ''}</span>
                    </span>
                  ) : enhancementStatus === 'unavailable' ? (
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30">
                      Enhancement unavailable
                    </span>
                  ) : (
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-slate-500/10 text-slate-400 border border-slate-700/40">
                      Ready
                    </span>
                  )}
                </div>
              </div>

              {/* Error / Fallback Notification */}
              {enhancementErrorMsg && (
                <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-400 flex items-start gap-2">
                  <span className="text-xs">⚠️</span>
                  <div className="leading-snug">
                    <span className="font-semibold block">{enhancementErrorMsg}</span>
                  </div>
                </div>
              )}

              {/* Manual Selector: Use Enhanced / Use Original & Level Badge */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-[11px] font-medium text-slate-400">
                  <span className="flex items-center gap-1.5">
                    <span>Photo Version:</span>
                    {enhanceCount > 0 && (
                      <span className="text-[10px] font-mono font-bold text-blue-400 bg-blue-500/10 px-1.5 py-0.2 rounded border border-blue-500/20">
                        {enhanceCount}x Level
                      </span>
                    )}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      disabled={!enhancedBgImg || isEnhancing}
                      onClick={() => handleToggleEnhanced(true)}
                      className={`px-2.5 py-1 text-[10px] sm:text-xs font-bold rounded-lg transition-all cursor-pointer ${
                        useEnhancedPhoto && enhancedBgImg
                          ? 'bg-blue-600 text-white shadow-sm ring-1 ring-blue-400'
                          : theme === 'dark' 
                            ? 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800' 
                            : 'bg-slate-100 text-slate-600 hover:text-slate-800 border border-slate-200'
                      } ${(!enhancedBgImg || isEnhancing) ? 'opacity-40 cursor-not-allowed' : ''}`}
                    >
                      {enhanceCount > 0 ? `Enhanced (${enhanceCount}x)` : 'Enhanced'}
                    </button>
                    <button
                      type="button"
                      disabled={!rawRemovedBgImg || isEnhancing}
                      onClick={() => handleToggleEnhanced(false)}
                      className={`px-2.5 py-1 text-[10px] sm:text-xs font-bold rounded-lg transition-all cursor-pointer ${
                        !useEnhancedPhoto && rawRemovedBgImg
                          ? 'bg-blue-600 text-white shadow-sm ring-1 ring-blue-400'
                          : theme === 'dark' 
                            ? 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800' 
                            : 'bg-slate-100 text-slate-600 hover:text-slate-800 border border-slate-200'
                      } ${(!rawRemovedBgImg || isEnhancing) ? 'opacity-40 cursor-not-allowed' : ''}`}
                    >
                      Original (0x)
                    </button>
                  </div>
                </div>

                {/* Before / Enhanced Compact Preview & Info */}
                {rawRemovedBgImg && (
                  <div className={`p-2.5 rounded-xl border flex items-center justify-between gap-3 ${
                    theme === 'dark' ? 'bg-slate-900/60 border-slate-800/80' : 'bg-slate-50 border-slate-200'
                  }`}>
                    <div className="flex items-center gap-2.5">
                      <div className={`relative w-10 h-12 rounded-lg overflow-hidden border shrink-0 ${
                        theme === 'dark' ? 'border-slate-700 bg-slate-950' : 'border-slate-300 bg-white'
                      }`}>
                        <img 
                          src={useEnhancedPhoto && enhancedBgImg ? enhancedBgImg : rawRemovedBgImg} 
                          alt="Active Portrait Version" 
                          className="w-full h-full object-contain"
                        />
                        <span className="absolute bottom-0 inset-x-0 text-[7px] font-black text-center bg-black/75 text-white py-0.2 uppercase tracking-tight">
                          {useEnhancedPhoto && enhancedBgImg ? `${enhanceCount}x Pass` : 'Original'}
                        </span>
                      </div>
                      <div className="text-[10px]">
                        <div className="font-bold text-slate-900 dark:text-slate-200 flex items-center gap-1.5">
                          <span>{useEnhancedPhoto && enhancedBgImg ? `AI Enhanced (Naturally Brighter & Clearer)` : 'Original Extracted Portrait Active'}</span>
                        </div>
                        <div className="text-[9px] text-slate-400 font-normal">
                          {useEnhancedPhoto && enhancedBgImg
                            ? `${language === 'hi' ? 'नेचुरली ब्राइट, क्लियर और पासपोर्ट प्रिंटिंग के लिए परफेक्ट।' : 'Naturally brighter, clearer & refined for passport printing.'}`
                            : `${language === 'hi' ? 'बिना किसी एन्हांसमेंट के ओरिजिनल कटआउट।' : 'Original un-enhanced extracted portrait.'}`}
                        </div>
                      </div>
                    </div>

                    {/* Quick reset button if enhanced */}
                    {enhanceCount > 0 && (
                      <button
                        type="button"
                        onClick={handleResetEnhancement}
                        disabled={isEnhancing}
                        title={language === 'hi' ? 'ओरिजिनल पर वापस रीसेट करें' : 'Reset to original'}
                        className="px-2 py-1 rounded-lg text-[10px] font-bold bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 cursor-pointer transition-colors shrink-0"
                      >
                        ↺ Reset
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Action Button & Meta Label */}
              <div className="space-y-2 pt-1 border-t border-slate-200/60 dark:border-slate-800/60">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    id="passport-enhance-photo-btn"
                    onClick={handleManualEnhanceClick}
                    disabled={(!rawRemovedBgImg && !removedBgImg) || isEnhancing}
                    className={`flex-1 py-2 sm:py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer subtle-glow-button ${
                      isEnhancing
                        ? 'bg-blue-600/20 text-blue-400 cursor-not-allowed border border-blue-500/30'
                        : theme === 'dark'
                          ? 'bg-blue-600/20 hover:bg-blue-600 border border-blue-500/40 text-blue-400 hover:text-white'
                          : 'bg-blue-600 hover:bg-blue-700 text-white shadow-xs'
                    } ${(!rawRemovedBgImg && !removedBgImg) ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''}`}
                  >
                    <Sparkles className={`w-3.5 h-3.5 ${isEnhancing ? 'animate-spin' : ''}`} />
                    <span>
                      {isEnhancing 
                        ? (enhanceStepText || 'Enhancing photo...') 
                        : '✨ Enhance Photo'}
                    </span>
                  </button>

                  {enhanceCount > 0 && (
                    <button
                      type="button"
                      onClick={handleResetEnhancement}
                      disabled={isEnhancing}
                      className="px-3 py-2 sm:py-2.5 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 cursor-pointer transition-colors"
                      title={language === 'hi' ? 'ओरिजिनल फोटो पर रीसेट करें' : 'Reset to Original'}
                    >
                      ↺ 0x
                    </button>
                  )}
                </div>

                <div className="text-center">
                  <span className="text-[9px] sm:text-[10px] font-mono text-slate-400 font-medium tracking-wide">
                    Lightweight • Browser AI • Private
                  </span>
                </div>
              </div>
            </div>

            {/* Panel Card: Background Fill (Available only when AI extracted background) */}
            <div className={`p-5 rounded-2xl border subtle-glow-card ${
              theme === 'dark' ? 'bg-slate-950 border-slate-900' : 'bg-white border-slate-200 shadow-sm'
            } space-y-4`}>
              <div className="flex items-center justify-between border-b pb-2">
                <h3 className="font-bold text-sm tracking-tight flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-blue-500" />
                  <span>{t.bgColorLabel}</span>
                </h3>
                {!removedBgImg && (
                  <span className="text-[10px] font-mono text-amber-500 font-semibold uppercase leading-none bg-amber-500/10 border border-amber-500/10 px-1.5 py-0.5 rounded subtle-element-glow">
                    Requires AI Bg Removal
                  </span>
                )}
              </div>

              <div className={`space-y-2.5 ${!removedBgImg ? 'opacity-55 pointer-events-none' : ''}`}>
                {/* Standard Swatches */}
                <div className="grid grid-cols-3 gap-1.5">
                  <button
                    type="button"
                    onClick={() => setBgColorType('white')}
                    className={`py-1.5 px-2 rounded-lg text-[11px] font-semibold border flex items-center justify-center gap-1.5 transition-all cursor-pointer subtle-glow-button ${
                      bgColorType === 'white'
                        ? 'border-blue-500 bg-blue-500/10 text-blue-500 font-bold ring-1 ring-blue-500 subtle-glow-active'
                        : theme === 'dark' ? 'border-slate-800 text-slate-350 bg-slate-900/40 hover:border-slate-700' : 'border-slate-200 text-slate-650 bg-slate-50 hover:border-slate-300'
                    }`}
                  >
                    <div className="w-2.5 h-2.5 rounded-full border border-slate-300 bg-white" />
                    <span>White</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setBgColorType('blue')}
                    className={`py-1.5 px-2 rounded-lg text-[11px] font-semibold border flex items-center justify-center gap-1.5 transition-all cursor-pointer subtle-glow-button ${
                      bgColorType === 'blue'
                        ? 'border-blue-500 bg-blue-500/10 text-blue-500 font-bold ring-1 ring-blue-500 subtle-glow-active'
                        : theme === 'dark' ? 'border-slate-800 text-slate-350 bg-slate-900/40 hover:border-slate-700' : 'border-slate-200 text-slate-650 bg-slate-50 hover:border-slate-300'
                    }`}
                  >
                    <div className="w-2.5 h-2.5 rounded-full bg-[#004494] border border-blue-600" />
                    <span>Blue</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setBgColorType('lightgray')}
                    className={`py-1.5 px-2 rounded-lg text-[11px] font-semibold border flex items-center justify-center gap-1.5 transition-all cursor-pointer subtle-glow-button ${
                      bgColorType === 'lightgray'
                        ? 'border-blue-500 bg-blue-500/10 text-blue-500 font-bold ring-1 ring-blue-500 subtle-glow-active'
                        : theme === 'dark' ? 'border-slate-800 text-slate-350 bg-slate-900/40 hover:border-slate-700' : 'border-slate-200 text-slate-650 bg-slate-50 hover:border-slate-300'
                    }`}
                  >
                    <div className="w-2.5 h-2.5 rounded-full bg-[#e5e7eb] border border-slate-400" />
                    <span>Gray</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setBgColorType('red')}
                    className={`py-1.5 px-2 rounded-lg text-[11px] font-semibold border flex items-center justify-center gap-1.5 transition-all cursor-pointer subtle-glow-button ${
                      bgColorType === 'red'
                        ? 'border-blue-500 bg-blue-500/10 text-blue-500 font-bold ring-1 ring-blue-500 subtle-glow-active'
                        : theme === 'dark' ? 'border-slate-800 text-slate-350 bg-slate-900/40 hover:border-slate-700' : 'border-slate-200 text-slate-650 bg-slate-50 hover:border-slate-300'
                    }`}
                  >
                    <div className="w-2.5 h-2.5 rounded-full bg-[#d21034] border border-red-600" />
                    <span>Red</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setBgColorType('cyan')}
                    className={`py-1.5 px-2 rounded-lg text-[11px] font-semibold border flex items-center justify-center gap-1.5 transition-all cursor-pointer subtle-glow-button ${
                      bgColorType === 'cyan'
                        ? 'border-blue-500 bg-blue-500/10 text-blue-500 font-bold ring-1 ring-blue-500 subtle-glow-active'
                        : theme === 'dark' ? 'border-slate-800 text-slate-350 bg-slate-900/40 hover:border-slate-700' : 'border-slate-200 text-slate-650 bg-slate-50 hover:border-slate-300'
                    }`}
                  >
                    <div className="w-2.5 h-2.5 rounded-full bg-[#38bdf8] border border-sky-400" />
                    <span>Sky Blue</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setBgColorType('offwhite')}
                    className={`py-1.5 px-2 rounded-lg text-[11px] font-semibold border flex items-center justify-center gap-1.5 transition-all cursor-pointer subtle-glow-button ${
                      bgColorType === 'offwhite'
                        ? 'border-blue-500 bg-blue-500/10 text-blue-500 font-bold ring-1 ring-blue-500 subtle-glow-active'
                        : theme === 'dark' ? 'border-slate-800 text-slate-350 bg-slate-900/40 hover:border-slate-700' : 'border-slate-200 text-slate-650 bg-slate-50 hover:border-slate-300'
                    }`}
                  >
                    <div className="w-2.5 h-2.5 rounded-full bg-[#f8fafc] border border-slate-300" />
                    <span>Off-White</span>
                  </button>
                </div>

                {/* More Colors & Custom Color Picker */}
                <div className={`p-2 rounded-xl border flex items-center justify-between gap-2 ${
                  bgColorType === 'custom'
                    ? 'border-blue-500/60 bg-blue-500/10'
                    : theme === 'dark' ? 'border-slate-800/80 bg-slate-900/40' : 'border-slate-200 bg-slate-50'
                }`}>
                  <div className="flex items-center gap-2">
                    <label className="relative cursor-pointer flex items-center">
                      <input
                        type="color"
                        value={customBgColor}
                        onChange={(e) => {
                          setCustomBgColor(e.target.value);
                          setBgColorType('custom');
                        }}
                        className="opacity-0 absolute inset-0 w-full h-full cursor-pointer"
                      />
                      <div 
                        className="w-6 h-6 rounded-lg border shadow-xs transition-transform hover:scale-110 flex items-center justify-center"
                        style={{ backgroundColor: customBgColor }}
                      >
                        <Pipette className="w-3 h-3 text-slate-700 drop-shadow-[0_1px_1px_rgba(255,255,255,0.8)]" />
                      </div>
                    </label>
                    <div className="text-[10px]">
                      <span className="font-bold block text-slate-300">Custom Color</span>
                      <span className="font-mono text-slate-500 uppercase">{customBgColor}</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setBgColorType('custom')}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-all cursor-pointer ${
                      bgColorType === 'custom'
                        ? 'border-blue-500 bg-blue-500 text-white'
                        : theme === 'dark' ? 'border-slate-700 bg-slate-800 text-slate-300 hover:text-white' : 'border-slate-300 bg-white text-slate-700'
                    }`}
                  >
                    Apply Custom
                  </button>
                </div>
              </div>
            </div>

            {/* Panel Card: Crop Adjustments & Scaling */}
            <div className={`p-4 sm:p-5 rounded-2xl border subtle-glow-card ${
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
                    <div className={`flex items-center rounded-lg border overflow-hidden shrink-0 subtle-element-glow ${
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
                    <div className={`flex items-center rounded-lg border overflow-hidden shrink-0 subtle-element-glow ${
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
                    <div className={`flex items-center rounded-lg border overflow-hidden shrink-0 subtle-element-glow ${
                      theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-300'
                    }`}>
                      <input
                        type="number"
                        min="50"
                        max="180"
                        step="5"
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
                    <div className={`flex items-center rounded-lg border overflow-hidden shrink-0 subtle-element-glow ${
                      theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-300'
                    }`}>
                      <input
                        type="number"
                        min="50"
                        max="180"
                        step="5"
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
            <div className={`p-5 rounded-2xl border subtle-glow-card ${
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
                      className={`py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer subtle-glow-button ${
                        borderWidth === val
                          ? 'border-blue-500 bg-blue-500/10 text-blue-500 ring-1 ring-blue-500 subtle-glow-active'
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
            <div className={`p-5 rounded-2xl border subtle-glow-card ${
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
                
                {/* 1. DOWNLOAD PNG */}
                <button
                  type="button"
                  onClick={sheetSize === 'single' ? downloadSinglePhoto : downloadSheetPng}
                  className={`w-full px-3 sm:px-4.5 py-3 rounded-xl font-bold text-[11px] sm:text-xs border flex items-center justify-between group cursor-pointer transition-all subtle-glow-button ${
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
                  className={`w-full px-3 sm:px-4.5 py-3 rounded-xl font-bold text-[11px] sm:text-xs border flex items-center justify-between group cursor-pointer transition-all subtle-glow-button ${
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

      {/* Interactive Photo Crop Station */}
      {cropModalOpen && (rawSourceImage || originalImage) && (
        <div 
          className="fixed inset-0 z-[100] bg-slate-950/95 backdrop-blur-md flex flex-col justify-between text-white p-2.5 sm:p-4 select-none animate-fadeIn"
          onMouseMove={handleCropContainerMouseMove}
          onTouchMove={handleCropContainerTouchMove}
          onMouseUp={handleCropContainerMouseUp}
          onTouchEnd={handleCropContainerMouseUp}
        >
          {/* Top Options Bar */}
          <div className="flex flex-col gap-2 pb-2.5 border-b border-slate-800">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              {/* Left: Crop Title with Icon */}
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-600/20 border border-blue-500/40 flex items-center justify-center shadow-md">
                  <Crop className="w-4 h-4 text-blue-400" />
                </div>
                <div>
                  <h3 className="text-xs sm:text-sm font-bold tracking-tight text-white flex items-center gap-2">
                    <span>{language === 'hi' ? 'फोटो क्रॉप (Crop Photo)' : 'Crop Photo'}</span>
                  </h3>
                  <p className="text-[10px] sm:text-[11px] text-slate-400">
                    {language === 'hi' 
                      ? 'किसी भी एक कोने को खींचकर चारों तरफ से फोटो क्रॉप करें' 
                      : 'Drag any corner to crop uniformly from all 4 sides'}
                  </p>
                </div>
              </div>

              {/* Right: Quick Actions */}
              <div className="flex items-center gap-2">
                {/* Reset Button */}
                <button
                  type="button"
                  onClick={() => {
                    setCropRotation(0);
                    setCropFlipH(false);
                    setCropFlipV(false);
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
                  className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white transition-all cursor-pointer flex items-center gap-1 border border-slate-700"
                  title="Reset Crop Box"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{language === 'hi' ? 'रीसेट' : 'Reset'}</span>
                </button>

                {/* Close Button */}
                <button
                  type="button"
                  onClick={() => setCropModalOpen(false)}
                  className="p-1.5 px-2.5 rounded-lg text-xs font-bold bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white transition-all cursor-pointer border border-slate-700"
                  title="Cancel & Close (Esc)"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Ratio Selector Presets Row */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              <button
                type="button"
                onClick={() => handleCropRatioChange('passport')}
                className={`px-3 py-1 rounded-lg text-[11px] font-bold border whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                  cropAspectRatio === 'passport'
                    ? 'bg-blue-600 border-blue-400 text-white shadow-sm ring-1 ring-blue-400'
                    : 'bg-slate-900/90 border-slate-800 text-slate-300 hover:border-slate-700'
                }`}
              >
                <span>📷 Passport ({selectedSizePreset.widthMm}×{selectedSizePreset.heightMm}mm)</span>
              </button>

              <button
                type="button"
                onClick={() => handleCropRatioChange('1:1')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border whitespace-nowrap transition-all cursor-pointer flex items-center gap-1 ${
                  cropAspectRatio === '1:1'
                    ? 'bg-blue-600 border-blue-400 text-white shadow-sm ring-1 ring-blue-400'
                    : 'bg-slate-900/90 border-slate-800 text-slate-300 hover:border-slate-700'
                }`}
              >
                <Square className="w-3 h-3" />
                <span>1:1 (2×2" Visa)</span>
              </button>

              <button
                type="button"
                onClick={() => handleCropRatioChange('3:4')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border whitespace-nowrap transition-all cursor-pointer ${
                  cropAspectRatio === '3:4'
                    ? 'bg-blue-600 border-blue-400 text-white shadow-sm ring-1 ring-blue-400'
                    : 'bg-slate-900/90 border-slate-800 text-slate-300 hover:border-slate-700'
                }`}
              >
                <span>3:4 Portrait</span>
              </button>

              <button
                type="button"
                onClick={() => handleCropRatioChange('4:3')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border whitespace-nowrap transition-all cursor-pointer ${
                  cropAspectRatio === '4:3'
                    ? 'bg-blue-600 border-blue-400 text-white shadow-sm ring-1 ring-blue-400'
                    : 'bg-slate-900/90 border-slate-800 text-slate-300 hover:border-slate-700'
                }`}
              >
                <span>4:3 Standard</span>
              </button>

              <button
                type="button"
                onClick={() => handleCropRatioChange('16:9')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border whitespace-nowrap transition-all cursor-pointer ${
                  cropAspectRatio === '16:9'
                    ? 'bg-blue-600 border-blue-400 text-white shadow-sm ring-1 ring-blue-400'
                    : 'bg-slate-900/90 border-slate-800 text-slate-300 hover:border-slate-700'
                }`}
              >
                <span>16:9</span>
              </button>

              <button
                type="button"
                onClick={() => handleCropRatioChange('free')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border whitespace-nowrap transition-all cursor-pointer flex items-center gap-1 ${
                  cropAspectRatio === 'free'
                    ? 'bg-blue-600 border-blue-400 text-white shadow-sm ring-1 ring-blue-400'
                    : 'bg-slate-900/90 border-slate-800 text-slate-300 hover:border-slate-700'
                }`}
              >
                <Unlock className="w-3 h-3" />
                <span>{language === 'hi' ? 'फ्री (Freeform)' : 'Freeform'}</span>
              </button>

              {/* Grid Toggle Selector */}
              <div className="ml-auto flex items-center gap-1 pl-2 border-l border-slate-800">
                <button
                  type="button"
                  onClick={() => setCropGridOverlay(cropGridOverlay === 'thirds' ? 'crosshair' : cropGridOverlay === 'crosshair' ? 'grid' : 'thirds')}
                  className="px-2 py-1 rounded text-[10px] font-mono text-slate-400 hover:text-white bg-slate-900 border border-slate-800 flex items-center gap-1 cursor-pointer"
                  title="Cycle Grid Overlay"
                >
                  <Grid3X3 className="w-3 h-3 text-blue-400" />
                  <span className="capitalize">{cropGridOverlay}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Stage: Interactive Image Container with Crop Overlay */}
          <div className="flex-1 flex items-center justify-center p-2 relative overflow-hidden min-h-[300px]">
            <div 
              ref={cropDisplayContainerRef}
              className="relative max-w-full max-h-[58vh] flex items-center justify-center select-none"
            >
              <img 
                src={rawSourceImage || originalImage || ''}
                alt="Source preview"
                style={{
                  transform: `rotate(${cropRotation}deg) scaleX(${cropFlipH ? -1 : 1}) scaleY(${cropFlipV ? -1 : 1})`,
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
                className="max-w-full max-h-[54vh] block object-contain select-none pointer-events-none opacity-90 shadow-2xl rounded-xs"
              />

              {/* Outer dark vignette mask outside crop boundary */}
              {cropBox && (
                <div className="absolute inset-0 pointer-events-none z-10">
                  <div className="absolute top-0 left-0 right-0 bg-black/80" style={{ height: `${cropBox.y}%` }} />
                  <div className="absolute bottom-0 left-0 right-0 bg-black/80" style={{ top: `${cropBox.y + cropBox.h}%` }} />
                  <div className="absolute left-0 bg-black/80" style={{ top: `${cropBox.y}%`, height: `${cropBox.h}%`, width: `${cropBox.x}%` }} />
                  <div className="absolute right-0 bg-black/80" style={{ top: `${cropBox.y}%`, height: `${cropBox.h}%`, left: `${cropBox.x + cropBox.w}%` }} />
                </div>
              )}

              {/* Draggable Crop Frame with 4-Corner Handles */}
              {cropBox && (
                <div 
                  style={{
                    left: `${cropBox.x}%`,
                    top: `${cropBox.y}%`,
                    width: `${cropBox.w}%`,
                    height: `${cropBox.h}%`,
                  }}
                  className="absolute border border-white/90 shadow-[0_0_0_1px_rgba(0,0,0,0.8),0_0_15px_rgba(0,0,0,0.5)] z-20 select-none"
                >
                  {/* Floating Dimension HUD Badge */}
                  <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-slate-950/90 text-white font-mono text-[10px] font-bold px-2 py-0.5 rounded border border-blue-500/40 shadow-lg pointer-events-none whitespace-nowrap z-40 flex items-center gap-1.5">
                    <span className="text-blue-400">
                      {cropAspectRatio === 'passport' 
                        ? `${selectedSizePreset.widthMm}×${selectedSizePreset.heightMm} mm` 
                        : cropAspectRatio === '1:1' 
                        ? '50×50 mm (1:1)' 
                        : `${cropAspectRatio}`}
                    </span>
                    <span className="text-slate-500">•</span>
                    <span className="text-emerald-400 font-semibold">
                      4-Side Symmetric
                    </span>
                  </div>

                  {/* Center Pan Handle: Drag inside to move frame */}
                  <div 
                    onMouseDown={(e) => startCropBoxDrag('move', e)}
                    onTouchStart={(e) => startCropBoxDragTouch('move', e)}
                    className="absolute inset-0 cursor-move bg-blue-500/5 hover:bg-blue-500/10 transition-colors select-none z-10"
                    title="Drag to reposition crop area"
                  />

                  {/* 3x3 Rule-of-Thirds Grid */}
                  {cropGridOverlay === 'thirds' && (
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
                  )}

                  {/* Dense 6x6 Grid */}
                  {cropGridOverlay === 'grid' && (
                    <div className="absolute inset-0 grid grid-cols-6 grid-rows-6 pointer-events-none">
                      {Array.from({ length: 36 }).map((_, i) => (
                        <div key={i} className="border-r border-b border-white/15" />
                      ))}
                    </div>
                  )}

                  {/* Center Anchor Point Target */}
                  <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-25 flex items-center justify-center">
                    <div className="w-5 h-5 rounded-full border border-blue-400/80 flex items-center justify-center bg-blue-500/20 shadow-xs">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-400 shadow-sm" />
                    </div>
                    <div className="absolute w-8 h-[1px] bg-blue-400/60" />
                    <div className="absolute h-8 w-[1px] bg-blue-400/60" />
                  </div>

                  {/* Signature Thick Corner L-Brackets (4 Corners ONLY) */}
                  {/* NW - Top Left */}
                  <div 
                    onMouseDown={(e) => startCropBoxDrag('resize-nw', e)}
                    onTouchStart={(e) => startCropBoxDragTouch('resize-nw', e)}
                    className="absolute -top-3.5 -left-3.5 w-9 h-9 flex items-start justify-start cursor-nwse-resize select-none pointer-events-auto z-30 group p-1"
                    title="Drag corner to resize all 4 sides uniformly"
                  >
                    <div className="w-6 h-6 border-t-[4px] border-l-[4px] border-white shadow-[0_2px_5px_rgba(0,0,0,0.9)] group-hover:scale-115 group-hover:border-blue-400 group-active:scale-95 transition-all" />
                  </div>

                  {/* NE - Top Right */}
                  <div 
                    onMouseDown={(e) => startCropBoxDrag('resize-ne', e)}
                    onTouchStart={(e) => startCropBoxDragTouch('resize-ne', e)}
                    className="absolute -top-3.5 -right-3.5 w-9 h-9 flex items-start justify-end cursor-nesw-resize select-none pointer-events-auto z-30 group p-1"
                    title="Drag corner to resize all 4 sides uniformly"
                  >
                    <div className="w-6 h-6 border-t-[4px] border-r-[4px] border-white shadow-[0_2px_5px_rgba(0,0,0,0.9)] group-hover:scale-115 group-hover:border-blue-400 group-active:scale-95 transition-all" />
                  </div>

                  {/* SE - Bottom Right */}
                  <div 
                    onMouseDown={(e) => startCropBoxDrag('resize-se', e)}
                    onTouchStart={(e) => startCropBoxDragTouch('resize-se', e)}
                    className="absolute -bottom-3.5 -right-3.5 w-9 h-9 flex items-end justify-end cursor-nwse-resize select-none pointer-events-auto z-30 group p-1"
                    title="Drag corner to resize all 4 sides uniformly"
                  >
                    <div className="w-6 h-6 border-b-[4px] border-r-[4px] border-white shadow-[0_2px_5px_rgba(0,0,0,0.9)] group-hover:scale-115 group-hover:border-blue-400 group-active:scale-95 transition-all" />
                  </div>

                  {/* SW - Bottom Left */}
                  <div 
                    onMouseDown={(e) => startCropBoxDrag('resize-sw', e)}
                    onTouchStart={(e) => startCropBoxDragTouch('resize-sw', e)}
                    className="absolute -bottom-3.5 -left-3.5 w-9 h-9 flex items-end justify-start cursor-nesw-resize select-none pointer-events-auto z-30 group p-1"
                    title="Drag corner to resize all 4 sides uniformly"
                  >
                    <div className="w-6 h-6 border-b-[4px] border-l-[4px] border-white shadow-[0_2px_5px_rgba(0,0,0,0.9)] group-hover:scale-115 group-hover:border-blue-400 group-active:scale-95 transition-all" />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Bottom Toolbar: Photoshop Transformations + Shortcuts + Commit/Apply */}
          <div className="pt-2.5 border-t border-slate-800 space-y-2">
            <div className="flex items-center justify-between flex-wrap gap-2">
              {/* Transform Tools (Rotate & Flips) */}
              <div className="flex items-center gap-1.5">
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
                  className="px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 flex items-center gap-1 text-xs font-semibold transition-all cursor-pointer"
                  title="Rotate Left (-90°)"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-blue-400" />
                  <span className="hidden sm:inline">-90°</span>
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
                  className="px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 flex items-center gap-1 text-xs font-semibold transition-all cursor-pointer"
                  title="Rotate Right (+90°)"
                >
                  <RotateCw className="w-3.5 h-3.5 text-blue-400" />
                  <span className="hidden sm:inline">+90°</span>
                </button>

                <button
                  type="button"
                  onClick={() => setCropFlipH(f => !f)}
                  className={`px-2.5 py-1.5 rounded-lg border flex items-center gap-1 text-xs font-semibold transition-all cursor-pointer ${
                    cropFlipH 
                      ? 'bg-blue-600 border-blue-500 text-white' 
                      : 'bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border-slate-800'
                  }`}
                  title="Flip Horizontal"
                >
                  <FlipHorizontal className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Flip H</span>
                </button>

                <button
                  type="button"
                  onClick={() => setCropFlipV(f => !f)}
                  className={`px-2.5 py-1.5 rounded-lg border flex items-center gap-1 text-xs font-semibold transition-all cursor-pointer ${
                    cropFlipV 
                      ? 'bg-blue-600 border-blue-500 text-white' 
                      : 'bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border-slate-800'
                  }`}
                  title="Flip Vertical"
                >
                  <FlipVertical className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Flip V</span>
                </button>
              </div>

              {/* Keyboard Shortcut Hint */}
              <div className="hidden md:flex items-center gap-1.5 text-[11px] text-slate-400 font-mono">
                <span className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300">↵ Enter</span>
                <span>to Apply</span>
                <span className="mx-1 text-slate-600">|</span>
                <span className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300">Esc</span>
                <span>to Cancel</span>
              </div>

              {/* Action Confirm / Cancel */}
              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <button
                  type="button"
                  onClick={() => setCropModalOpen(false)}
                  className="flex-1 sm:flex-initial text-center justify-center px-3.5 py-2.5 sm:py-2 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700 transition-all cursor-pointer"
                >
                  {language === 'hi' ? 'रद्द करें (Esc)' : 'Cancel (Esc)'}
                </button>

                <button
                  type="button"
                  onClick={applyCrop}
                  className="flex-1 sm:flex-initial text-center justify-center px-4 sm:px-5 py-2.5 sm:py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/30 flex items-center gap-1.5 transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
                >
                  <Check className="w-4 h-4 shrink-0" />
                  <span className="truncate">{language === 'hi' ? 'क्रॉप लागू करें (Apply)' : 'Apply Crop (Enter)'}</span>
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
