import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { 
  Sparkles, 
  Upload, 
  Download, 
  Undo2, 
  Redo2, 
  ZoomIn, 
  ZoomOut, 
  Maximize2, 
  Sliders, 
  Eraser, 
  Paintbrush, 
  Hand, 
  Wand2, 
  Eye, 
  RefreshCw, 
  Check, 
  Copy, 
  Share2, 
  Layers, 
  Palette, 
  Scissors, 
  ShieldCheck, 
  Cpu, 
  Server, 
  Key, 
  User, 
  FileText, 
  HelpCircle, 
  AlertCircle,
  Split,
  Columns,
  Image as ImageIcon
} from 'lucide-react';
import { AppTheme, AppLanguage, AppTab } from '../types';
import { 
  removeBackgroundInBrowser, 
  removeBackgroundOnServer, 
  downloadDataUrl, 
  copyImageToClipboard,
  BgModelType,
  BgEngineType,
  BgSubjectCategory,
  BgRemovalResult
} from '../utils/bg-remover-engine';
import { BG_REMOVER_SAMPLES, BgSampleItem } from '../data/bgRemoverSamples';

export interface BackgroundRemoverSectionProps {
  language: AppLanguage;
  theme: AppTheme;
  onSelectTab?: (tab: AppTab) => void;
  onSendToPassport?: (dataUrl: string) => void;
  onSendToResizer?: (dataUrl: string) => void;
}

type BrushMode = 'erase' | 'restore' | 'pan';
type ViewMode = 'split' | 'side_by_side' | 'mask' | 'preview';
type BgFillType = 'transparent' | 'color' | 'gradient' | 'blur' | 'custom_image';

export default function BackgroundRemoverSection({
  language,
  theme,
  onSelectTab,
  onSendToPassport,
  onSendToResizer
}: BackgroundRemoverSectionProps) {
  const isDark = theme === 'dark';

  // 1. Source Image States
  const [sourceImage, setSourceImage] = useState<string | null>(null);
  const [sourceFilename, setSourceFilename] = useState<string>('photo.png');
  const [sourceDimensions, setSourceDimensions] = useState<{ width: number; height: number } | null>(null);

  // 2. AI Processing States
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [progressStep, setProgressStep] = useState<string>('');
  const [progressPercent, setProgressPercent] = useState<number>(0);
  const [engineType, setEngineType] = useState<BgEngineType>('worker');
  const [modelType, setModelType] = useState<BgModelType>('rmbg');
  const [subjectCategory, setSubjectCategory] = useState<BgSubjectCategory>('auto');
  const [customApiKey, setCustomApiKey] = useState<string>('');
  const [showApiKeyModal, setShowApiKeyModal] = useState<boolean>(false);
  const [removalError, setRemovalError] = useState<string | null>(null);

  // 3. Cutout & Mask States
  const [resultCutout, setResultCutout] = useState<string | null>(null);
  const [resultMask, setResultMask] = useState<string | null>(null);
  const [modelUsedInfo, setModelUsedInfo] = useState<string>('RMBG-1.4 Universal AI');
  const [inferenceTimeMs, setInferenceTimeMs] = useState<number>(0);

  // 4. View & Canvas Navigation States
  const [viewMode, setViewMode] = useState<ViewMode>('split');
  const [splitPosition, setSplitPosition] = useState<number>(50); // 0 to 100 percentage
  const [zoomLevel, setZoomLevel] = useState<number>(1.0); // 0.25 to 5.0
  const [panOffset, setPanOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDraggingPan, setIsDraggingPan] = useState<boolean>(false);
  const [panDragStart, setPanDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // 5. Manual Brush Editing States
  const [brushMode, setBrushMode] = useState<BrushMode>('erase');
  const [brushSize, setBrushSize] = useState<number>(30); // 5 to 150 px
  const [brushFeather, setBrushFeather] = useState<number>(40); // 0 to 100%
  const [brushOpacity, setBrushOpacity] = useState<number>(100); // 10 to 100%
  const [isPainting, setIsPainting] = useState<boolean>(false);
  const [mousePosOnCanvas, setMousePosOnCanvas] = useState<{ x: number; y: number } | null>(null);
  const [cursorInCanvas, setCursorInCanvas] = useState<boolean>(false);

  // 6. Undo / Redo History Stack (stores ImageData of editable mask canvas)
  const [historyStack, setHistoryStack] = useState<ImageData[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);

  // 7. Background Replacement States
  const [bgFillType, setBgFillType] = useState<BgFillType>('transparent');
  const [solidBgColor, setSolidBgColor] = useState<string>('#ffffff');
  const [gradientType, setGradientType] = useState<'radial_spotlight' | 'dual_blue' | 'dark_vignette'>('radial_spotlight');
  const [blurIntensity, setBlurIntensity] = useState<number>(14); // 0 to 30 px
  const [customBackdropImage, setCustomBackdropImage] = useState<string | null>(null);

  // 8. Copy feedback banner
  const [copiedSuccess, setCopiedSuccess] = useState<boolean>(false);

  // DOM Refs
  const fileInputRef = useRef<HTMLInputElement>(null);
  const customBgInputRef = useRef<HTMLInputElement>(null);
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const editorCanvasRef = useRef<HTMLCanvasElement>(null);
  const baseImageRef = useRef<HTMLImageElement | null>(null);
  const maskCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const lastDrawPos = useRef<{ x: number; y: number } | null>(null);

  // Quick preset colors
  const COLOR_PRESETS = [
    { label: 'White', color: '#ffffff', border: true },
    { label: 'Off-White', color: '#f8fafc', border: true },
    { label: 'Studio Grey', color: '#e2e8f0', border: false },
    { label: 'Charcoal', color: '#111827', border: false },
    { label: 'Passport Blue', color: '#2563eb', border: false },
    { label: 'Passport Red', color: '#dc2626', border: false },
    { label: 'Soft Peach', color: '#fef3c7', border: false },
    { label: 'Emerald Studio', color: '#065f46', border: false },
  ];

  // ==========================================
  // Load & Process Images
  // ==========================================

  const handleSelectFile = async (file: File) => {
    if (!file || !file.type.startsWith('image/')) return;
    setSourceFilename(file.name);
    setRemovalError(null);

    const reader = new FileReader();
    reader.onload = async (e) => {
      const dataUrl = e.target?.result as string;
      setSourceImage(dataUrl);

      // Pre-measure original dimensions
      const img = new Image();
      img.onload = () => {
        setSourceDimensions({ width: img.naturalWidth, height: img.naturalHeight });
        executeBackgroundRemoval(dataUrl, file);
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  };

  const handleSelectSample = async (sample: BgSampleItem) => {
    try {
      setIsProcessing(true);
      setProgressStep('Loading demo image...');
      setProgressPercent(15);
      const dataUrl = await sample.getDataUrl();
      setSourceImage(dataUrl);
      setSourceFilename(`${sample.id}.jpg`);
      setRemovalError(null);

      const img = new Image();
      img.onload = () => {
        setSourceDimensions({ width: img.naturalWidth, height: img.naturalHeight });
        executeBackgroundRemoval(dataUrl);
      };
      img.src = dataUrl;
    } catch (err: any) {
      setRemovalError('Failed to load sample image');
      setIsProcessing(false);
    }
  };

  const executeBackgroundRemoval = async (dataUrl: string, originalFile?: File) => {
    try {
      setIsProcessing(true);
      setRemovalError(null);
      setProgressStep('Initializing high-accuracy neural engine...');
      setProgressPercent(10);

      let result: BgRemovalResult;

      if (engineType === 'server') {
        result = await removeBackgroundOnServer(dataUrl, {
          modelType,
          category: subjectCategory,
          customApiKey: customApiKey.trim() || undefined,
          customProvider: 'removebg'
        }, (prog) => {
          setProgressStep(prog.step);
          setProgressPercent(prog.percent);
        });
      } else {
        // In-Browser Web Worker execution
        let blob: Blob;
        if (originalFile) {
          blob = originalFile;
        } else {
          const res = await fetch(dataUrl);
          blob = await res.blob();
        }

        result = await removeBackgroundInBrowser(blob, modelType, (prog) => {
          setProgressStep(prog.step);
          setProgressPercent(prog.percent);
        });
      }

      setResultCutout(result.cutoutDataUrl);
      setResultMask(result.maskDataUrl);
      setModelUsedInfo(result.modelUsed);
      setInferenceTimeMs(result.inferenceTimeMs);
      initializeEditorCanvas(dataUrl, result.maskDataUrl);
    } catch (err: any) {
      console.error('Background removal error:', err);
      // Automatic graceful fallback in-browser (RMBG -> MODNet)
      if (engineType === 'worker' && modelType !== 'modnet') {
        try {
          setProgressStep('Retrying with in-browser portrait matting model...');
          setProgressPercent(40);

          let blob: Blob;
          if (originalFile) {
            blob = originalFile;
          } else {
            const res = await fetch(dataUrl);
            blob = await res.blob();
          }

          const fallbackResult = await removeBackgroundInBrowser(blob, 'modnet', (prog) => {
            setProgressStep(prog.step);
            setProgressPercent(prog.percent);
          });

          setResultCutout(fallbackResult.cutoutDataUrl);
          setResultMask(fallbackResult.maskDataUrl);
          setModelUsedInfo(fallbackResult.modelUsed + ' (Client Fallback)');
          setInferenceTimeMs(fallbackResult.inferenceTimeMs);
          initializeEditorCanvas(dataUrl, fallbackResult.maskDataUrl);
          return;
        } catch (fallbackErr: any) {
          setRemovalError(fallbackErr.message || 'Background removal failed');
        }
      } else {
        setRemovalError(err.message || 'Background removal failed');
      }
    } finally {
      setIsProcessing(false);
    }
  };

  // ==========================================
  // Dual-Layer Canvas Engine Initialization
  // ==========================================

  const initializeEditorCanvas = (imgDataUrl: string, maskDataUrl: string) => {
    const baseImg = new Image();
    baseImg.crossOrigin = 'anonymous';
    baseImg.onload = () => {
      baseImageRef.current = baseImg;

      const maskImg = new Image();
      maskImg.crossOrigin = 'anonymous';
      maskImg.onload = () => {
        const w = baseImg.naturalWidth;
        const h = baseImg.naturalHeight;

        // Create internal mask canvas
        const mCanvas = document.createElement('canvas');
        mCanvas.width = w;
        mCanvas.height = h;
        const mCtx = mCanvas.getContext('2d', { willReadFrequently: true });
        if (mCtx) {
          mCtx.drawImage(maskImg, 0, 0, w, h);
          maskCanvasRef.current = mCanvas;

          // Push initial clean state to history
          const initialImageData = mCtx.getImageData(0, 0, w, h);
          setHistoryStack([initialImageData]);
          setHistoryIndex(0);
        }

        renderEditorComposite();
      };
      maskImg.src = maskDataUrl;
    };
    baseImg.src = imgDataUrl;
  };

  // ==========================================
  // Composite Rendering on Display Canvas
  // ==========================================

  const renderEditorComposite = useCallback(() => {
    const canvas = editorCanvasRef.current;
    const baseImg = baseImageRef.current;
    const maskCanvas = maskCanvasRef.current;
    if (!canvas || !baseImg || !maskCanvas) return;

    const w = baseImg.naturalWidth;
    const h = baseImg.naturalHeight;

    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, w, h);

    // 1. Draw Background
    if (bgFillType === 'transparent') {
      // Checkerboard transparency pattern
      const tileSize = 20;
      for (let y = 0; y < h; y += tileSize) {
        for (let x = 0; x < w; x += tileSize) {
          ctx.fillStyle = ((x / tileSize + y / tileSize) % 2 === 0) ? '#f1f5f9' : '#cbd5e1';
          ctx.fillRect(x, y, tileSize, tileSize);
        }
      }
    } else if (bgFillType === 'color') {
      ctx.fillStyle = solidBgColor;
      ctx.fillRect(0, 0, w, h);
    } else if (bgFillType === 'gradient') {
      if (gradientType === 'radial_spotlight') {
        const grad = ctx.createRadialGradient(w / 2, h / 2, 20, w / 2, h / 2, Math.max(w, h) * 0.7);
        grad.addColorStop(0, '#ffffff');
        grad.addColorStop(0.5, '#e2e8f0');
        grad.addColorStop(1, '#94a3b8');
        ctx.fillStyle = grad;
      } else if (gradientType === 'dual_blue') {
        const grad = ctx.createLinearGradient(0, 0, w, h);
        grad.addColorStop(0, '#1e3a8a');
        grad.addColorStop(0.6, '#0284c7');
        grad.addColorStop(1, '#0f172a');
        ctx.fillStyle = grad;
      } else {
        const grad = ctx.createRadialGradient(w / 2, h / 2, 50, w / 2, h / 2, Math.max(w, h) * 0.75);
        grad.addColorStop(0, '#334155');
        grad.addColorStop(1, '#090d16');
        ctx.fillStyle = grad;
      }
      ctx.fillRect(0, 0, w, h);
    } else if (bgFillType === 'blur') {
      // Draw blurred original image as background
      ctx.save();
      ctx.filter = `blur(${blurIntensity}px)`;
      ctx.drawImage(baseImg, -blurIntensity * 2, -blurIntensity * 2, w + blurIntensity * 4, h + blurIntensity * 4);
      ctx.restore();
    } else if (bgFillType === 'custom_image' && customBackdropImage) {
      const bgImg = new Image();
      bgImg.onload = () => {
        ctx.drawImage(bgImg, 0, 0, w, h);
        drawForegroundSubject(ctx, w, h);
      };
      bgImg.src = customBackdropImage;
      return;
    }

    drawForegroundSubject(ctx, w, h);
  }, [bgFillType, solidBgColor, gradientType, blurIntensity, customBackdropImage]);

  const drawForegroundSubject = (ctx: CanvasRenderingContext2D, w: number, h: number) => {
    const baseImg = baseImageRef.current;
    const maskCanvas = maskCanvasRef.current;
    if (!baseImg || !maskCanvas) return;

    if (viewMode === 'mask') {
      // B&W mask view only
      ctx.drawImage(maskCanvas, 0, 0, w, h);
      return;
    }

    // Temporary offscreen canvas for subject cutout
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = w;
    tempCanvas.height = h;
    const tempCtx = tempCanvas.getContext('2d');
    if (!tempCtx) return;

    // Draw original base image
    tempCtx.drawImage(baseImg, 0, 0, w, h);

    // Apply alpha mask
    tempCtx.globalCompositeOperation = 'destination-in';
    tempCtx.drawImage(maskCanvas, 0, 0, w, h);

    if (viewMode === 'split') {
      // Split view: Left = Original, Right = Cutout on Background
      const splitX = Math.round((splitPosition / 100) * w);

      // Save background that was already drawn
      ctx.save();
      ctx.beginPath();
      ctx.rect(splitX, 0, w - splitX, h);
      ctx.clip();
      ctx.drawImage(tempCanvas, 0, 0, w, h);
      ctx.restore();

      // Draw original on left side
      ctx.save();
      ctx.beginPath();
      ctx.rect(0, 0, splitX, h);
      ctx.clip();
      ctx.drawImage(baseImg, 0, 0, w, h);
      ctx.restore();

      // Split Divider Line
      ctx.save();
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = Math.max(2, Math.round(w / 400));
      ctx.beginPath();
      ctx.moveTo(splitX, 0);
      ctx.lineTo(splitX, h);
      ctx.stroke();

      // Divider Handle Center Bead
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(splitX, h / 2, Math.max(12, Math.round(w / 80)), 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#0284c7';
      ctx.lineWidth = 3;
      ctx.stroke();
      ctx.restore();
    } else {
      // Full cutout composite
      ctx.drawImage(tempCanvas, 0, 0, w, h);
    }
  };

  useEffect(() => {
    renderEditorComposite();
  }, [renderEditorComposite, viewMode, splitPosition]);

  // ==========================================
  // Interactive Manual Brush Painting Engine
  // ==========================================

  const applyBrushStroke = (canvasX: number, canvasY: number) => {
    const maskCanvas = maskCanvasRef.current;
    if (!maskCanvas) return;
    const mCtx = maskCanvas.getContext('2d');
    if (!mCtx) return;

    mCtx.save();

    // Scale brush size relative to image resolution
    const actualBrushRadius = (brushSize / 2) * (maskCanvas.width / (editorCanvasRef.current?.clientWidth || 600));

    if (brushMode === 'erase') {
      // Erase: Set alpha mask to transparent / black
      mCtx.globalCompositeOperation = 'destination-out';
    } else if (brushMode === 'restore') {
      // Restore: Paint back solid white / opaque into mask
      mCtx.globalCompositeOperation = 'source-over';
    }

    // Radial gradient for feathering
    const grad = mCtx.createRadialGradient(
      canvasX, canvasY, Math.max(0, actualBrushRadius * (1 - brushFeather / 100)),
      canvasX, canvasY, actualBrushRadius
    );

    const alphaLevel = brushOpacity / 100;
    grad.addColorStop(0, `rgba(255, 255, 255, ${alphaLevel})`);
    grad.addColorStop(1, 'rgba(255, 255, 255, 0)');

    mCtx.fillStyle = grad;
    mCtx.beginPath();
    mCtx.arc(canvasX, canvasY, actualBrushRadius, 0, Math.PI * 2);
    mCtx.fill();

    mCtx.restore();
    renderEditorComposite();
  };

  const getCanvasCoordinates = (e: React.MouseEvent<HTMLCanvasElement>): { x: number; y: number } | null => {
    const canvas = editorCanvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY
    };
  };

  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (viewMode === 'split' && e.buttons === 1) {
      // Check if user is clicking near split divider
      const coords = getCanvasCoordinates(e);
      if (coords && editorCanvasRef.current) {
        const splitX = (splitPosition / 100) * editorCanvasRef.current.width;
        if (Math.abs(coords.x - splitX) < 40) {
          return; // Let split drag handler handle it
        }
      }
    }

    if (brushMode === 'pan' || e.button === 1) {
      setIsDraggingPan(true);
      setPanDragStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
      return;
    }

    if (brushMode === 'erase' || brushMode === 'restore') {
      setIsPainting(true);
      const coords = getCanvasCoordinates(e);
      if (coords) {
        lastDrawPos.current = coords;
        applyBrushStroke(coords.x, coords.y);
      }
    }
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const coords = getCanvasCoordinates(e);
    if (coords) {
      setMousePosOnCanvas({ x: e.clientX, y: e.clientY });
    }

    if (isDraggingPan) {
      setPanOffset({
        x: e.clientX - panDragStart.x,
        y: e.clientY - panDragStart.y
      });
      return;
    }

    if (isPainting && (brushMode === 'erase' || brushMode === 'restore')) {
      if (coords) {
        applyBrushStroke(coords.x, coords.y);
        lastDrawPos.current = coords;
      }
    }
  };

  const handleCanvasMouseUp = () => {
    if (isPainting) {
      setIsPainting(false);
      lastDrawPos.current = null;
      // Push state to Undo History
      const maskCanvas = maskCanvasRef.current;
      if (maskCanvas) {
        const mCtx = maskCanvas.getContext('2d');
        if (mCtx) {
          const snapshot = mCtx.getImageData(0, 0, maskCanvas.width, maskCanvas.height);
          const newHistory = historyStack.slice(0, historyIndex + 1);
          newHistory.push(snapshot);
          if (newHistory.length > 20) newHistory.shift();
          setHistoryStack(newHistory);
          setHistoryIndex(newHistory.length - 1);
        }
      }
    }
    setIsDraggingPan(false);
  };

  // Undo / Redo Handlers
  const handleUndo = () => {
    if (historyIndex > 0) {
      const nextIndex = historyIndex - 1;
      const maskCanvas = maskCanvasRef.current;
      if (maskCanvas) {
        const mCtx = maskCanvas.getContext('2d');
        if (mCtx) {
          mCtx.putImageData(historyStack[nextIndex], 0, 0);
          setHistoryIndex(nextIndex);
          renderEditorComposite();
        }
      }
    }
  };

  const handleRedo = () => {
    if (historyIndex < historyStack.length - 1) {
      const nextIndex = historyIndex + 1;
      const maskCanvas = maskCanvasRef.current;
      if (maskCanvas) {
        const mCtx = maskCanvas.getContext('2d');
        if (mCtx) {
          mCtx.putImageData(historyStack[nextIndex], 0, 0);
          setHistoryIndex(nextIndex);
          renderEditorComposite();
        }
      }
    }
  };

  // Zoom handlers
  const handleZoom = (delta: number) => {
    setZoomLevel(prev => Math.max(0.3, Math.min(4.0, prev + delta)));
  };

  const handleResetZoom = () => {
    setZoomLevel(1.0);
    setPanOffset({ x: 0, y: 0 });
  };

  // Export handlers
  const handleDownloadPng = () => {
    const canvas = editorCanvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/png');
    downloadDataUrl(dataUrl, `snapid-${sourceFilename.replace(/\.[^/.]+$/, '')}-cutout.png`);
  };

  const handleDownloadJpg = () => {
    const canvas = editorCanvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
    downloadDataUrl(dataUrl, `snapid-${sourceFilename.replace(/\.[^/.]+$/, '')}-enhanced.jpg`);
  };

  const handleCopyClipboard = async () => {
    const canvas = editorCanvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/png');
    const ok = await copyImageToClipboard(dataUrl);
    if (ok) {
      setCopiedSuccess(true);
      setTimeout(() => setCopiedSuccess(false), 2500);
    }
  };

  const handleSendToPassportStudio = () => {
    const canvas = editorCanvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/png');
    if (onSendToPassport) {
      onSendToPassport(dataUrl);
    }
    if (onSelectTab) {
      onSelectTab('passport');
    }
  };

  const handleSendToResizer = () => {
    const canvas = editorCanvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/png');
    if (onSendToResizer) {
      onSendToResizer(dataUrl);
    }
    if (onSelectTab) {
      onSelectTab('resizer');
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 pb-12 pt-1 select-none">
      
      {/* 1. Header Banner */}
      <div className={`rounded-3xl p-5 sm:p-7 border backdrop-blur-xl transition-all shadow-xl ${
        isDark 
          ? 'bg-slate-900/80 border-slate-800/80 shadow-[0_12px_40px_rgba(0,0,0,0.5)]' 
          : 'bg-white/95 border-slate-200/90 shadow-md'
      }`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/25">
                <Scissors className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white">
                    {language === 'hi' ? 'एआई बैकग्राउंड रिमूवर' : 'AI Background Remover'}
                  </h1>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase font-mono bg-blue-500/15 text-blue-500 border border-blue-500/30">
                    Neural Matting
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                  {language === 'hi' 
                    ? 'लोग, प्रोडक्ट, पालतू जानवर, बाल, फर व पारदर्शी कांच — किसी भी फोटो से सटीक कटआउट' 
                    : 'Universal precision for People, Hair, Fur, Products, and Transparent Glass'}
                </p>
              </div>
            </div>
          </div>

          {/* Engine & Settings Toggles */}
          <div className="flex flex-wrap items-center gap-2">
            <div className={`flex items-center p-1 rounded-2xl border ${
              isDark ? 'bg-slate-950/70 border-slate-800' : 'bg-slate-100 border-slate-200'
            }`}>
              <button
                type="button"
                onClick={() => setEngineType('worker')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  engineType === 'worker'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
                title="100% In-Browser WebAssembly SIMD (Zero Cloud Upload)"
              >
                <Cpu className="w-3.5 h-3.5" />
                <span>In-Browser AI</span>
              </button>
              <button
                type="button"
                onClick={() => setEngineType('server')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  engineType === 'server'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
                title="Cloud AI Server (High Performance for Mobile)"
              >
                <Server className="w-3.5 h-3.5" />
                <span>Cloud AI</span>
              </button>
            </div>

            <button
              type="button"
              onClick={() => setShowApiKeyModal(true)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-2xl border text-xs font-bold transition-all cursor-pointer ${
                customApiKey
                  ? 'bg-emerald-500/15 text-emerald-500 border-emerald-500/30'
                  : isDark ? 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-800' : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-300'
              }`}
              title="Configure Custom remove.bg API key (Optional)"
            >
              <Key className="w-3.5 h-3.5" />
              <span>{customApiKey ? 'API Active' : 'Custom API'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Top Quick Dropzone & Category Sample Presets */}
      {!sourceImage && (
        <div className="space-y-6">
          {/* Main Upload Dropzone */}
          <div
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
            onDrop={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                handleSelectFile(e.dataTransfer.files[0]);
              }
            }}
            className={`border-2 border-dashed rounded-3xl p-8 sm:p-14 text-center cursor-pointer transition-all hover:scale-[1.005] group ${
              isDark 
                ? 'border-slate-800 hover:border-blue-500/80 bg-slate-900/40 hover:bg-slate-900/70 shadow-2xl' 
                : 'border-slate-300 hover:border-blue-500 bg-white hover:bg-blue-50/40 shadow-lg'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && handleSelectFile(e.target.files[0])}
            />

            <div className="max-w-md mx-auto space-y-4">
              <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto rounded-3xl bg-gradient-to-tr from-blue-600 to-cyan-500 flex items-center justify-center text-white shadow-xl shadow-blue-500/30 group-hover:scale-105 transition-transform">
                <Upload className="w-8 h-8 sm:w-10 sm:h-10 animate-bounce" />
              </div>

              <div>
                <h3 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">
                  {language === 'hi' ? 'फोटो अपलोड करें या यहाँ खींचें' : 'Upload Any Photo or Drag & Drop'}
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                  {language === 'hi' 
                    ? 'JPG, PNG, WebP सपोर्टेड • 100% फ्री एवं प्राइवेट' 
                    : 'Supports JPG, PNG, WEBP • Zero compression loss'}
                </p>
              </div>

              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 text-white font-bold text-xs shadow-md shadow-blue-600/30">
                <span>{language === 'hi' ? 'फाइल चुनें' : 'Choose Photo'}</span>
              </div>
            </div>
          </div>

          {/* 4 Instant Demo Presets (People, Products, Animals, Glass) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span className="text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300">
                  {language === 'hi' ? 'तुरंत टेस्ट करें (सैंपल फोटो)' : 'Try Instant Sample Photos'}
                </span>
              </div>
              <span className="text-[11px] font-mono text-slate-400">
                1-Click Benchmark
              </span>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              {BG_REMOVER_SAMPLES.map((sample) => (
                <button
                  key={sample.id}
                  type="button"
                  onClick={() => handleSelectSample(sample)}
                  className={`p-3.5 sm:p-4 rounded-2xl border text-left cursor-pointer transition-all hover:scale-[1.02] flex flex-col justify-between ${
                    isDark 
                      ? 'bg-slate-900/60 hover:bg-slate-900 border-slate-800 hover:border-blue-500/50' 
                      : 'bg-white hover:bg-slate-50 border-slate-200 hover:border-blue-400 shadow-sm'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                        {language === 'hi' ? sample.titleHi : sample.titleEn}
                      </span>
                      <span className="px-1.5 py-0.5 rounded-md text-[9px] font-bold font-mono bg-blue-500/15 text-blue-400 border border-blue-500/30 shrink-0">
                        {sample.badge}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 line-clamp-2">
                      {sample.descEn}
                    </p>
                  </div>
                  <div className="mt-3 pt-2 border-t border-slate-800/40 flex items-center justify-between text-[11px] text-blue-500 font-semibold">
                    <span>Test Cutout</span>
                    <span>→</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 3. Main Workspace & Interactive Touch-Up Studio */}
      {sourceImage && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

          {/* LEFT: Toolbar & Precision Brush Controls (4 Columns) */}
          <div className="lg:col-span-4 space-y-4">

            {/* Change Photo / Reset Card */}
            <div className={`p-4 rounded-2xl border ${
              isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
            }`}>
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <span className="text-xs font-bold text-slate-900 dark:text-white block truncate">
                    {sourceFilename}
                  </span>
                  {sourceDimensions && (
                    <span className="text-[10px] font-mono text-slate-400 block">
                      {sourceDimensions.width} × {sourceDimensions.height} px
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSourceImage(null);
                    setResultCutout(null);
                    setResultMask(null);
                  }}
                  className="px-2.5 py-1.5 rounded-xl border border-slate-700/60 text-xs font-bold text-slate-400 hover:text-white transition-all cursor-pointer"
                >
                  Change Photo
                </button>
              </div>
            </div>

            {/* Brush & Tools Panel */}
            <div className={`p-4 sm:p-5 rounded-3xl border space-y-4 ${
              isDark ? 'bg-slate-900/90 border-slate-800 shadow-xl' : 'bg-white border-slate-200 shadow-md'
            }`}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold uppercase font-mono tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Paintbrush className="w-3.5 h-3.5 text-blue-400" />
                  Manual Brush Tools
                </span>
                
                {/* Undo / Redo */}
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={handleUndo}
                    disabled={historyIndex <= 0}
                    className="p-1.5 rounded-lg border border-slate-800 text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-800 transition-all cursor-pointer"
                    title="Undo (Ctrl+Z)"
                  >
                    <Undo2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={handleRedo}
                    disabled={historyIndex >= historyStack.length - 1}
                    className="p-1.5 rounded-lg border border-slate-800 text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-800 transition-all cursor-pointer"
                    title="Redo (Ctrl+Y)"
                  >
                    <Redo2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Mode Select Buttons */}
              <div className="grid grid-cols-3 gap-1.5">
                <button
                  type="button"
                  onClick={() => setBrushMode('erase')}
                  className={`flex flex-col items-center justify-center p-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                    brushMode === 'erase'
                      ? 'bg-rose-600/20 text-rose-400 border-rose-500/50 shadow-md'
                      : isDark ? 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white' : 'bg-slate-100 text-slate-600 border-slate-200'
                  }`}
                >
                  <Eraser className="w-4 h-4 mb-1" />
                  <span>Erase</span>
                </button>

                <button
                  type="button"
                  onClick={() => setBrushMode('restore')}
                  className={`flex flex-col items-center justify-center p-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                    brushMode === 'restore'
                      ? 'bg-emerald-600/20 text-emerald-400 border-emerald-500/50 shadow-md'
                      : isDark ? 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white' : 'bg-slate-100 text-slate-600 border-slate-200'
                  }`}
                >
                  <Paintbrush className="w-4 h-4 mb-1" />
                  <span>Restore</span>
                </button>

                <button
                  type="button"
                  onClick={() => setBrushMode('pan')}
                  className={`flex flex-col items-center justify-center p-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                    brushMode === 'pan'
                      ? 'bg-blue-600/20 text-blue-400 border-blue-500/50 shadow-md'
                      : isDark ? 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white' : 'bg-slate-100 text-slate-600 border-slate-200'
                  }`}
                >
                  <Hand className="w-4 h-4 mb-1" />
                  <span>Pan / Hand</span>
                </button>
              </div>

              {/* Sliders (Size, Feathering, Opacity) */}
              <div className="space-y-3 pt-1">
                {/* Size */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-400">
                    <span>Brush Size</span>
                    <span className="font-mono text-blue-400">{brushSize}px</span>
                  </div>
                  <input
                    type="range"
                    min="5"
                    max="150"
                    value={brushSize}
                    onChange={(e) => setBrushSize(Number(e.target.value))}
                    className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
                  />
                </div>

                {/* Feathering */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-400">
                    <span>Edge Softness / Hair Feather</span>
                    <span className="font-mono text-blue-400">{brushFeather}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={brushFeather}
                    onChange={(e) => setBrushFeather(Number(e.target.value))}
                    className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Background Replacement Customizer */}
            <div className={`p-4 sm:p-5 rounded-3xl border space-y-4 ${
              isDark ? 'bg-slate-900/90 border-slate-800 shadow-xl' : 'bg-white border-slate-200 shadow-md'
            }`}>
              <span className="text-xs font-extrabold uppercase font-mono tracking-wider text-slate-400 flex items-center gap-1.5">
                <Palette className="w-3.5 h-3.5 text-blue-400" />
                Background Replace
              </span>

              {/* Category tabs */}
              <div className="grid grid-cols-4 gap-1 p-1 rounded-xl bg-slate-950 border border-slate-800 text-[11px] font-bold">
                <button
                  type="button"
                  onClick={() => setBgFillType('transparent')}
                  className={`py-1.5 rounded-lg transition-all ${
                    bgFillType === 'transparent' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Alpha
                </button>
                <button
                  type="button"
                  onClick={() => setBgFillType('color')}
                  className={`py-1.5 rounded-lg transition-all ${
                    bgFillType === 'color' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Color
                </button>
                <button
                  type="button"
                  onClick={() => setBgFillType('gradient')}
                  className={`py-1.5 rounded-lg transition-all ${
                    bgFillType === 'gradient' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Studio
                </button>
                <button
                  type="button"
                  onClick={() => setBgFillType('blur')}
                  className={`py-1.5 rounded-lg transition-all ${
                    bgFillType === 'blur' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Blur
                </button>
              </div>

              {/* Color Presets */}
              {bgFillType === 'color' && (
                <div className="space-y-2">
                  <div className="grid grid-cols-4 gap-2">
                    {COLOR_PRESETS.map((p) => (
                      <button
                        key={p.color}
                        type="button"
                        onClick={() => setSolidBgColor(p.color)}
                        className={`h-9 rounded-xl flex items-center justify-center transition-all cursor-pointer border ${
                          solidBgColor === p.color
                            ? 'ring-2 ring-blue-500 scale-105 border-white'
                            : p.border ? 'border-slate-300 dark:border-slate-700' : 'border-transparent'
                        }`}
                        style={{ backgroundColor: p.color }}
                        title={p.label}
                      >
                        {solidBgColor === p.color && (
                          <Check className={`w-4 h-4 ${p.color === '#ffffff' || p.color === '#f8fafc' ? 'text-slate-900' : 'text-white'}`} />
                        )}
                      </button>
                    ))}
                  </div>

                  {/* Custom Hex Picker */}
                  <div className="flex items-center gap-2 pt-1">
                    <input
                      type="color"
                      value={solidBgColor}
                      onChange={(e) => setSolidBgColor(e.target.value)}
                      className="w-8 h-8 rounded-lg border border-slate-700 cursor-pointer bg-transparent"
                    />
                    <input
                      type="text"
                      value={solidBgColor}
                      onChange={(e) => setSolidBgColor(e.target.value)}
                      className="flex-1 px-3 py-1.5 rounded-xl border border-slate-800 bg-slate-950 font-mono text-xs text-white uppercase"
                    />
                  </div>
                </div>
              )}

              {/* Studio Gradients */}
              {bgFillType === 'gradient' && (
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setGradientType('radial_spotlight')}
                    className={`p-2 rounded-xl border text-center transition-all cursor-pointer ${
                      gradientType === 'radial_spotlight' ? 'border-blue-500 ring-2 ring-blue-500/40' : 'border-slate-800'
                    }`}
                  >
                    <div className="w-full h-8 rounded-lg bg-radial from-white via-slate-200 to-slate-400 mb-1" />
                    <span className="text-[10px] font-bold text-slate-300 block">Spotlight</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setGradientType('dual_blue')}
                    className={`p-2 rounded-xl border text-center transition-all cursor-pointer ${
                      gradientType === 'dual_blue' ? 'border-blue-500 ring-2 ring-blue-500/40' : 'border-slate-800'
                    }`}
                  >
                    <div className="w-full h-8 rounded-lg bg-gradient-to-r from-blue-900 to-slate-900 mb-1" />
                    <span className="text-[10px] font-bold text-slate-300 block">Dual Blue</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setGradientType('dark_vignette')}
                    className={`p-2 rounded-xl border text-center transition-all cursor-pointer ${
                      gradientType === 'dark_vignette' ? 'border-blue-500 ring-2 ring-blue-500/40' : 'border-slate-800'
                    }`}
                  >
                    <div className="w-full h-8 rounded-lg bg-radial from-slate-700 to-slate-950 mb-1" />
                    <span className="text-[10px] font-bold text-slate-300 block">Vignette</span>
                  </button>
                </div>
              )}

              {/* DSLR Depth-of-Field Blur */}
              {bgFillType === 'blur' && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-400">
                    <span>DSLR Bokeh Blur</span>
                    <span className="font-mono text-blue-400">{blurIntensity}px</span>
                  </div>
                  <input
                    type="range"
                    min="2"
                    max="30"
                    value={blurIntensity}
                    onChange={(e) => setBlurIntensity(Number(e.target.value))}
                    className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
                  />
                  <p className="text-[10px] text-slate-400">
                    Blurs original background behind the cutout subject for an authentic portrait bokeh look.
                  </p>
                </div>
              )}
            </div>

            {/* Export & One-Click Workflows */}
            <div className={`p-4 sm:p-5 rounded-3xl border space-y-3 ${
              isDark ? 'bg-slate-900/90 border-slate-800 shadow-xl' : 'bg-white border-slate-200 shadow-md'
            }`}>
              <span className="text-xs font-extrabold uppercase font-mono tracking-wider text-slate-400 flex items-center gap-1.5">
                <Download className="w-3.5 h-3.5 text-blue-400" />
                Export & Workflows
              </span>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={handleDownloadPng}
                  className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all shadow-md shadow-blue-500/30 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Save PNG</span>
                </button>

                <button
                  type="button"
                  onClick={handleDownloadJpg}
                  className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all cursor-pointer"
                >
                  <ImageIcon className="w-3.5 h-3.5" />
                  <span>Save JPG</span>
                </button>
              </div>

              <div className="pt-2 border-t border-slate-800/60 space-y-2">
                <button
                  type="button"
                  onClick={handleSendToPassportStudio}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-gradient-to-r from-blue-700 to-indigo-700 hover:from-blue-600 hover:to-indigo-600 text-white text-xs font-bold transition-all cursor-pointer shadow-md"
                >
                  <User className="w-3.5 h-3.5" />
                  <span>Send to Passport Studio</span>
                </button>

                <button
                  type="button"
                  onClick={handleSendToResizer}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl border border-slate-700/80 bg-slate-950/60 hover:bg-slate-900 text-slate-300 text-xs font-semibold transition-all cursor-pointer"
                >
                  <Sliders className="w-3.5 h-3.5" />
                  <span>Send to Document Resizer</span>
                </button>
              </div>
            </div>

          </div>

          {/* RIGHT: Main Interactive Canvas Viewport (8 Columns) */}
          <div className="lg:col-span-8 space-y-3">

            {/* View Mode & Zoom Navigation Bar */}
            <div className={`p-2.5 rounded-2xl border flex flex-wrap items-center justify-between gap-2 ${
              isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
            }`}>
              {/* View Modes */}
              <div className="flex items-center gap-1 p-0.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setViewMode('split')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                    viewMode === 'split' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                  title="Before vs After Split Screen Slider"
                >
                  <Split className="w-3.5 h-3.5" />
                  <span>Split Slider</span>
                </button>

                <button
                  type="button"
                  onClick={() => setViewMode('preview')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                    viewMode === 'preview' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                  title="Full Cutout on Selected Background"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Cutout Only</span>
                </button>

                <button
                  type="button"
                  onClick={() => setViewMode('mask')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                    viewMode === 'mask' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                  title="Black & White Alpha Silhouette to Inspect Hair/Fur Precision"
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>Alpha Matte</span>
                </button>
              </div>

              {/* Zoom Controls */}
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => handleZoom(-0.2)}
                  className="p-1.5 rounded-lg border border-slate-800 text-slate-300 hover:bg-slate-800 transition-all cursor-pointer"
                  title="Zoom Out"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>
                <span className="font-mono text-xs font-bold text-slate-400 min-w-[42px] text-center">
                  {Math.round(zoomLevel * 100)}%
                </span>
                <button
                  type="button"
                  onClick={() => handleZoom(0.2)}
                  className="p-1.5 rounded-lg border border-slate-800 text-slate-300 hover:bg-slate-800 transition-all cursor-pointer"
                  title="Zoom In"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={handleResetZoom}
                  className="p-1.5 rounded-lg border border-slate-800 text-slate-300 hover:bg-slate-800 transition-all cursor-pointer"
                  title="Fit to Screen"
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                </button>

                <div className="h-4 w-px bg-slate-800 mx-1" />

                <button
                  type="button"
                  onClick={handleCopyClipboard}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-800 text-xs font-semibold text-slate-300 hover:bg-slate-800 transition-all cursor-pointer"
                  title="Copy PNG to Clipboard"
                >
                  {copiedSuccess ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedSuccess ? 'Copied!' : 'Copy'}</span>
                </button>
              </div>
            </div>

            {/* Split Screen Slider Control Bar (Only when in Split Mode) */}
            {viewMode === 'split' && (
              <div className={`p-2.5 rounded-xl border flex items-center gap-3 ${
                isDark ? 'bg-slate-900/50 border-slate-800/80' : 'bg-slate-100 border-slate-200'
              }`}>
                <span className="text-[11px] font-bold text-slate-400 shrink-0">
                  Original (Left)
                </span>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={splitPosition}
                  onChange={(e) => setSplitPosition(Number(e.target.value))}
                  className="flex-1 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
                />
                <span className="text-[11px] font-bold text-blue-400 shrink-0">
                  AI Cutout (Right)
                </span>
              </div>
            )}

            {/* Main Interactive Canvas Container */}
            <div
              ref={canvasContainerRef}
              className={`relative w-full h-[450px] sm:h-[550px] lg:h-[620px] rounded-3xl border overflow-hidden flex items-center justify-center select-none shadow-2xl ${
                isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-100 border-slate-300'
              }`}
              onMouseEnter={() => setCursorInCanvas(true)}
              onMouseLeave={() => { setCursorInCanvas(false); handleCanvasMouseUp(); }}
            >
              {/* Transform wrapper for Zoom & Pan */}
              <div
                style={{
                  transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoomLevel})`,
                  transformOrigin: 'center center',
                  transition: isDraggingPan || isPainting ? 'none' : 'transform 0.15s ease-out'
                }}
                className="max-w-full max-h-full flex items-center justify-center"
              >
                <canvas
                  ref={editorCanvasRef}
                  onMouseDown={handleCanvasMouseDown}
                  onMouseMove={handleCanvasMouseMove}
                  onMouseUp={handleCanvasMouseUp}
                  className={`block object-contain max-w-full max-h-full ${
                    brushMode === 'pan' ? 'cursor-grab active:cursor-grabbing' : 'cursor-crosshair'
                  }`}
                />
              </div>

              {/* Circular Brush Outline Cursor Tracker */}
              {cursorInCanvas && mousePosOnCanvas && (brushMode === 'erase' || brushMode === 'restore') && (
                <div
                  className={`pointer-events-none fixed rounded-full border transform -translate-x-1/2 -translate-y-1/2 z-50 transition-opacity ${
                    brushMode === 'erase' ? 'border-rose-500 bg-rose-500/10' : 'border-emerald-500 bg-emerald-500/10'
                  }`}
                  style={{
                    left: `${mousePosOnCanvas.x}px`,
                    top: `${mousePosOnCanvas.y}px`,
                    width: `${brushSize * zoomLevel}px`,
                    height: `${brushSize * zoomLevel}px`,
                  }}
                />
              )}

              {/* In-Canvas Processing Loading Spinner */}
              {isProcessing && (
                <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-sm z-30 flex flex-col items-center justify-center p-6 text-center select-none animate-fadeIn">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-cyan-400 flex items-center justify-center text-white mb-4 shadow-xl shadow-blue-500/30 animate-pulse">
                    <Sparkles className="w-7 h-7 animate-spin" />
                  </div>
                  <h4 className="text-base sm:text-lg font-bold text-white mb-1">
                    {progressStep || 'Segmenting subject & matting edges...'}
                  </h4>
                  <p className="text-xs text-slate-400 mb-4 font-mono">
                    RMBG-1.4 Neural Matting • Hair, Fur, Glass Preservation
                  </p>
                  <div className="w-56 bg-slate-800 rounded-full h-2 overflow-hidden border border-slate-700/60 p-[1px]">
                    <div
                      className="bg-gradient-to-r from-blue-500 via-cyan-400 to-emerald-400 h-full rounded-full transition-all duration-300 ease-out"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Performance Diagnostic Bar */}
            <div className={`px-4 py-2 rounded-xl border flex items-center justify-between text-[11px] font-mono text-slate-400 ${
              isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200'
            }`}>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span>Engine: {modelUsedInfo}</span>
              </div>
              <div>
                <span>Inference: {inferenceTimeMs > 0 ? `${inferenceTimeMs}ms` : 'Instant'}</span>
              </div>
            </div>

          </div>

        </div>
      )}

      {/* Custom API Key Configuration Modal */}
      {showApiKeyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className={`w-full max-w-md p-6 rounded-3xl border shadow-2xl space-y-4 ${
            isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Key className="w-5 h-5 text-blue-500" />
                <h3 className="text-base font-bold">Custom API Key (Optional)</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowApiKeyModal(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              SnapID Studio includes high-accuracy in-browser RMBG-1.4 AI free of charge. If you have an official remove.bg API key, you can enter it here to route requests directly.
            </p>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">
                remove.bg API Key
              </label>
              <input
                type="password"
                placeholder="Enter your API key..."
                value={customApiKey}
                onChange={(e) => setCustomApiKey(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-800 bg-slate-950 text-xs text-white font-mono focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => { setCustomApiKey(''); setShowApiKeyModal(false); }}
                className="px-3.5 py-2 rounded-xl border border-slate-800 text-xs font-bold text-slate-400 hover:text-white"
              >
                Clear
              </button>
              <button
                type="button"
                onClick={() => setShowApiKeyModal(false)}
                className="px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold shadow-md shadow-blue-500/25"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
