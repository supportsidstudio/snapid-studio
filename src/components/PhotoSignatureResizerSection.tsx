import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  Upload, 
  Download, 
  RefreshCw, 
  Image as ImageIcon, 
  Lock, 
  Unlock, 
  Sliders, 
  Check, 
  X, 
  AlertCircle, 
  Sparkles, 
  User, 
  PenTool, 
  Maximize2, 
  CheckCircle2, 
  FileText,
  Layers,
  ArrowRight,
  Eye
} from 'lucide-react';
import { AppLanguage, AppTheme } from '../types';

interface PhotoSignatureResizerSectionProps {
  language: AppLanguage;
  theme: AppTheme;
}

type ResizeMode = 'pixels' | 'percentage';
type OutputFileType = 'JPG' | 'PNG' | 'WEBP';
type ToolMode = 'photo' | 'signature';

const QUICK_KB_PRESETS = [10, 20, 30, 50, 100, 150, 200];

export default function PhotoSignatureResizerSection({
  language,
  theme
}: PhotoSignatureResizerSectionProps) {
  // Mode: Photo vs Signature
  const [toolMode, setToolMode] = useState<ToolMode>('photo');

  // Uploaded Image State
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>('');
  const [originalWidth, setOriginalWidth] = useState<number>(0);
  const [originalHeight, setOriginalHeight] = useState<number>(0);
  const [originalFileSize, setOriginalFileSize] = useState<number>(0);
  const [originalFileType, setOriginalFileType] = useState<string>('JPG');
  const [aspectRatio, setAspectRatio] = useState<number>(1);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Editor View State
  const [isEditorOpen, setIsEditorOpen] = useState<boolean>(false);

  // Resize Settings
  const [resizeMode, setResizeMode] = useState<ResizeMode>('pixels');
  const [width, setWidth] = useState<number>(0);
  const [height, setHeight] = useState<number>(0);
  const [aspectRatioLocked, setAspectRatioLocked] = useState<boolean>(true);
  const [percentage, setPercentage] = useState<number>(100);
  const [quality, setQuality] = useState<number>(75);
  const [fileType, setFileType] = useState<OutputFileType>('JPG');
  
  // Target File Size in KB
  const [useTargetKB, setUseTargetKB] = useState<boolean>(false);
  const [targetKB, setTargetKB] = useState<number | ''>(50);
  const [targetKBError, setTargetKBError] = useState<string | null>(null);

  // Live Output State
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [resizedBlob, setResizedBlob] = useState<Blob | null>(null);
  const [resizedImageUrl, setResizedImageUrl] = useState<string | null>(null);
  const [newWidth, setNewWidth] = useState<number>(0);
  const [newHeight, setNewHeight] = useState<number>(0);
  const [newFileSize, setNewFileSize] = useState<number>(0);
  const [downloadSuccess, setDownloadSuccess] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const sourceImageRef = useRef<HTMLImageElement | null>(null);

  // Format bytes to KB or MB
  const formatFileSize = (bytes: number): string => {
    if (!bytes || bytes === 0) return '0 KB';
    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    }
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  // Quality live label helper
  const getQualityLabel = (q: number): string => {
    if (q >= 90) return 'Maximum';
    if (q >= 70) return 'Medium / High';
    if (q >= 40) return 'Medium';
    return 'Low';
  };

  // Clean up object URLs on unmount or reset
  useEffect(() => {
    return () => {
      if (resizedImageUrl) {
        URL.revokeObjectURL(resizedImageUrl);
      }
    };
  }, [resizedImageUrl]);

  // Handle image upload from File object
  const processUploadedFile = (file: File) => {
    setErrorMessage(null);
    setDownloadSuccess(false);

    // Validate mime type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type.toLowerCase()) && !file.name.match(/\.(jpe?g|png|webp)$/i)) {
      setErrorMessage(
        language === 'hi' 
          ? 'अमान्य फाइल प्रारूप! कृपया JPG, PNG, या WEBP इमेज अपलोड करें।' 
          : 'Invalid file format! Please upload a JPG, PNG, or WEBP image.'
      );
      return;
    }

    // Determine type label
    let detectedType: OutputFileType = 'JPG';
    if (file.type.includes('png') || file.name.endsWith('.png')) {
      detectedType = 'PNG';
    } else if (file.type.includes('webp') || file.name.endsWith('.webp')) {
      detectedType = 'WEBP';
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      if (!result) return;

      const img = new Image();
      img.onload = () => {
        sourceImageRef.current = img;
        const nw = img.naturalWidth;
        const nh = img.naturalHeight;
        const ar = nw / nh;

        setUploadedFile(file);
        setImageSrc(result);
        setFileName(file.name);
        setOriginalWidth(nw);
        setOriginalHeight(nh);
        setOriginalFileSize(file.size);
        setOriginalFileType(detectedType);
        setAspectRatio(ar);

        // Initialize editor values
        setWidth(nw);
        setHeight(nh);
        setNewWidth(nw);
        setNewHeight(nh);
        setPercentage(100);
        setQuality(75);
        
        // If signature mode, prefer PNG default to preserve transparency, otherwise JPG
        const defaultFileType: OutputFileType = toolMode === 'signature' ? 'PNG' : 'JPG';
        setFileType(defaultFileType);
        setUseTargetKB(false);
        setTargetKB(toolMode === 'signature' ? 20 : 50);
        setTargetKBError(null);
      };
      img.onerror = () => {
        setErrorMessage(
          language === 'hi' 
            ? 'इमेज लोड करने में असमर्थ। कृपया दूसरी वैध इमेज चुनें।' 
            : 'Failed to load image. Please select a valid image file.'
        );
      };
      img.src = result;
    };
    reader.onerror = () => {
      setErrorMessage(
        language === 'hi' 
          ? 'फाइल पढ़ने में त्रुटि हुई।' 
          : 'Error reading file.'
      );
    };
    reader.readAsDataURL(file);
  };

  // Drag & drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processUploadedFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processUploadedFile(e.target.files[0]);
    }
  };

  // Reset entire component
  const handleReset = () => {
    setUploadedFile(null);
    setImageSrc(null);
    setFileName('');
    setOriginalWidth(0);
    setOriginalHeight(0);
    setOriginalFileSize(0);
    setIsEditorOpen(false);
    setErrorMessage(null);
    setTargetKBError(null);
    if (resizedImageUrl) {
      URL.revokeObjectURL(resizedImageUrl);
    }
    setResizedBlob(null);
    setResizedImageUrl(null);
    setDownloadSuccess(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Cancel resize editor (returns to preview screen)
  const handleCancelEditor = () => {
    setIsEditorOpen(false);
    setErrorMessage(null);
    setTargetKBError(null);
  };

  // Tool Mode switch (Photo vs Signature)
  const handleToolModeChange = (mode: ToolMode) => {
    setToolMode(mode);
    if (!isEditorOpen) {
      setFileType(mode === 'signature' ? 'PNG' : 'JPG');
      setTargetKB(mode === 'signature' ? 20 : 50);
    }
  };

  // Aspect ratio lock handlers
  const handleWidthChange = (valStr: string) => {
    const val = parseInt(valStr, 10);
    if (isNaN(val) || val <= 0) {
      setWidth(0);
      return;
    }
    setWidth(val);
    if (aspectRatioLocked && aspectRatio > 0) {
      const calculatedHeight = Math.max(1, Math.round(val / aspectRatio));
      setHeight(calculatedHeight);
    }
  };

  const handleHeightChange = (valStr: string) => {
    const val = parseInt(valStr, 10);
    if (isNaN(val) || val <= 0) {
      setHeight(0);
      return;
    }
    setHeight(val);
    if (aspectRatioLocked && aspectRatio > 0) {
      const calculatedWidth = Math.max(1, Math.round(val * aspectRatio));
      setWidth(calculatedWidth);
    }
  };

  const handlePercentageChange = (val: number) => {
    setPercentage(val);
    if (originalWidth > 0 && originalHeight > 0) {
      const newW = Math.max(1, Math.round((originalWidth * val) / 100));
      const newH = Math.max(1, Math.round((originalHeight * val) / 100));
      setWidth(newW);
      setHeight(newH);
    }
  };

  // Target KB validation & change
  const handleTargetKBInput = (valStr: string) => {
    setUseTargetKB(true);
    if (valStr === '') {
      setTargetKB('');
      setTargetKBError(
        language === 'hi'
          ? 'कृपया 10 KB और 200 KB के बीच का टारगेट साइज दर्ज करें।'
          : 'Please select a target size between 10 KB and 200 KB.'
      );
      return;
    }
    const val = parseInt(valStr, 10);
    if (isNaN(val)) {
      setTargetKB('');
      return;
    }
    setTargetKB(val);
    if (val < 10 || val > 200) {
      setTargetKBError(
        language === 'hi'
          ? 'कृपया 10 KB और 200 KB के बीच का टारगेट साइज दर्ज करें।'
          : 'Please select a target size between 10 KB and 200 KB.'
      );
    } else {
      setTargetKBError(null);
    }
  };

  const handleQuickKBClick = (kb: number) => {
    setUseTargetKB(true);
    setTargetKB(kb);
    setTargetKBError(null);
  };

  // Core Client-Side Image Resizing & Compression Engine
  const performResize = useCallback(async () => {
    if (!sourceImageRef.current || width <= 0 || height <= 0) return;
    setIsProcessing(true);

    const img = sourceImageRef.current;
    let targetW = Math.max(1, width);
    let targetH = Math.max(1, height);

    // Mime Type configuration
    let mimeType = 'image/jpeg';
    if (fileType === 'PNG') mimeType = 'image/png';
    else if (fileType === 'WEBP') mimeType = 'image/webp';

    const canvas = document.createElement('canvas');
    canvas.width = targetW;
    canvas.height = targetH;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      setIsProcessing(false);
      return;
    }

    // Enable high quality image scaling
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    // Helper to render on canvas
    const drawToCanvas = (c: HTMLCanvasElement, w: number, h: number) => {
      c.width = w;
      c.height = h;
      const context = c.getContext('2d');
      if (!context) return;
      context.imageSmoothingEnabled = true;
      context.imageSmoothingQuality = 'high';

      // If JPG, fill with white background (in case of transparent PNG inputs)
      if (fileType === 'JPG') {
        context.fillStyle = '#FFFFFF';
        context.fillRect(0, 0, w, h);
      } else {
        // PNG and WEBP preserve transparency!
        context.clearRect(0, 0, w, h);
      }

      context.drawImage(img, 0, 0, w, h);
    };

    drawToCanvas(canvas, targetW, targetH);

    // Helper promise for canvas.toBlob
    const getBlob = (c: HTMLCanvasElement, mime: string, q: number): Promise<Blob | null> => {
      return new Promise((resolve) => {
        c.toBlob((blob) => resolve(blob), mime, q);
      });
    };

    try {
      let finalBlob: Blob | null = null;
      let finalW = targetW;
      let finalH = targetH;

      // MODE 1: Target File Size in KB Optimization
      if (useTargetKB && typeof targetKB === 'number' && targetKB >= 10 && targetKB <= 200) {
        const targetBytes = targetKB * 1024;

        if (fileType === 'PNG') {
          // PNG is lossless; to reduce size to target KB, scale dimensions intelligently if too large
          let currentBlob = await getBlob(canvas, mimeType, 1.0);
          let currentW = targetW;
          let currentH = targetH;
          let attempts = 0;

          while (currentBlob && currentBlob.size > targetBytes && attempts < 5 && currentW > 100 && currentH > 100) {
            attempts++;
            const scale = Math.max(0.65, Math.sqrt(targetBytes / currentBlob.size) * 0.95);
            currentW = Math.max(50, Math.round(currentW * scale));
            currentH = Math.max(50, Math.round(currentH * scale));
            drawToCanvas(canvas, currentW, currentH);
            currentBlob = await getBlob(canvas, mimeType, 1.0);
          }
          finalBlob = currentBlob;
          finalW = currentW;
          finalH = currentH;
        } else {
          // JPG / WEBP: Binary search on Quality (0.05 to 0.95)
          let lowQ = 0.05;
          let highQ = 0.98;
          let bestBlob: Blob | null = null;
          let bestDiff = Infinity;

          for (let iter = 0; iter < 8; iter++) {
            const midQ = (lowQ + highQ) / 2;
            const blob = await getBlob(canvas, mimeType, midQ);
            if (!blob) break;

            const diff = Math.abs(blob.size - targetBytes);
            if (diff < bestDiff) {
              bestDiff = diff;
              bestBlob = blob;
            }

            if (blob.size > targetBytes) {
              highQ = midQ;
            } else {
              lowQ = midQ;
            }
          }

          // If even at lowest quality, blob exceeds target size by more than 15%, scale dimensions down
          if (bestBlob && bestBlob.size > targetBytes * 1.15) {
            let curW = targetW;
            let curH = targetH;
            let attempts = 0;
            while (bestBlob && bestBlob.size > targetBytes && attempts < 4 && curW > 100) {
              attempts++;
              const scale = Math.max(0.7, Math.sqrt(targetBytes / bestBlob.size) * 0.95);
              curW = Math.max(60, Math.round(curW * scale));
              curH = Math.max(60, Math.round(curH * scale));
              drawToCanvas(canvas, curW, curH);

              // re-evaluate quality at new dimensions
              bestBlob = await getBlob(canvas, mimeType, 0.4);
            }
            finalW = curW;
            finalH = curH;
          }

          finalBlob = bestBlob;
        }
      } else {
        // MODE 2: Manual Quality Mode
        const qNorm = Math.max(0.1, Math.min(1.0, quality / 100));
        finalBlob = await getBlob(canvas, mimeType, qNorm);
      }

      if (finalBlob) {
        if (resizedImageUrl) {
          URL.revokeObjectURL(resizedImageUrl);
        }
        const newUrl = URL.createObjectURL(finalBlob);
        setResizedBlob(finalBlob);
        setResizedImageUrl(newUrl);
        setNewWidth(finalW);
        setNewHeight(finalH);
        setNewFileSize(finalBlob.size);
      }
    } catch (err) {
      console.error('Resize processing error:', err);
    } finally {
      setIsProcessing(false);
    }
  }, [width, height, fileType, quality, useTargetKB, targetKB, resizedImageUrl]);

  // Debounced auto-recalculate when editor parameters change
  useEffect(() => {
    if (!isEditorOpen || !sourceImageRef.current) return;
    const timer = setTimeout(() => {
      performResize();
    }, 200);
    return () => clearTimeout(timer);
  }, [width, height, fileType, quality, useTargetKB, targetKB, isEditorOpen, resizeMode]);

  // Save / Download Handler
  const handleDownload = () => {
    if (!resizedBlob && !resizedImageUrl) return;

    let ext = 'jpg';
    if (fileType === 'PNG') ext = 'png';
    else if (fileType === 'WEBP') ext = 'webp';

    const defaultBaseName = toolMode === 'signature' ? 'snapid-resized-signature' : 'snapid-resized-photo';
    const downloadName = `${defaultBaseName}.${ext}`;

    const link = document.createElement('a');
    link.href = resizedImageUrl || '';
    link.download = downloadName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setDownloadSuccess(true);
    setTimeout(() => setDownloadSuccess(false), 4000);
  };

  return (
    <section 
      id="photo-signature-resizer" 
      className="space-y-6 scroll-mt-20 animate-fade-in"
    >
      {/* Section Header Card */}
      <div className={`p-6 sm:p-8 rounded-3xl border relative overflow-hidden transition-all ${
        theme === 'dark'
          ? 'bg-gradient-to-r from-blue-950/25 via-slate-900/90 to-slate-950 border-slate-800/80 shadow-xl'
          : 'bg-gradient-to-r from-blue-50/70 via-white to-slate-50 border-slate-200 shadow-sm'
      }`}>
        <div className="absolute -right-16 -top-16 w-60 h-60 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-16 -bottom-16 w-60 h-60 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[11px] font-bold text-blue-500 uppercase tracking-wider bg-blue-500/10 px-3 py-1 rounded-full border border-blue-500/20 flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5" />
                <span>Online Image Utility</span>
              </span>
              <span className="text-[11px] font-semibold text-emerald-500 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                100% Client-Side
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black font-display tracking-tight text-slate-900 dark:text-white">
              {language === 'hi' ? 'फोटो रिसाइजर (Photo Resizer)' : 'Photo Resizer'}
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-2 leading-relaxed">
              {language === 'hi'
                ? 'अपनी फोटो या हस्ताक्षर को आवश्यक आकार (Dimensions) और फाइल साइज (KB) में आसानी से रीसाइज और कंप्रेस करें।'
                : 'Resize and compress your photo or signature to precise dimensions and file size.'}
            </p>
          </div>

          {/* Mode Switcher: Photo / Signature */}
          <div className={`p-1.5 rounded-2xl border flex items-center gap-1 shrink-0 ${
            theme === 'dark' ? 'bg-slate-950 border-slate-800' : 'bg-slate-100 border-slate-200'
          }`}>
            <button
              type="button"
              onClick={() => handleToolModeChange('photo')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                toolMode === 'photo'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <User className="w-4 h-4" />
              <span>{language === 'hi' ? 'फोटो (Photo)' : 'Photo'}</span>
            </button>
            <button
              type="button"
              onClick={() => handleToolModeChange('signature')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                toolMode === 'signature'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <PenTool className="w-4 h-4" />
              <span>{language === 'hi' ? 'हस्ताक्षर (Signature)' : 'Signature'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Error Banner */}
      {errorMessage && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-500 text-xs sm:text-sm flex items-center gap-3 animate-fade-in">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span className="flex-1 font-medium">{errorMessage}</span>
          <button 
            onClick={() => setErrorMessage(null)} 
            className="p-1 hover:bg-rose-500/20 rounded-lg cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp"
        onChange={handleFileInputChange}
        className="hidden"
      />

      {/* ========================================================
          SCREEN 1: INITIAL UPLOAD OR UPLOADED PREVIEW (When Editor Closed)
         ======================================================== */}
      {!isEditorOpen && (
        <div className="space-y-6">
          {!imageSrc ? (
            /* Dropzone / Upload Box */
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-3xl p-8 sm:p-14 text-center cursor-pointer transition-all duration-200 relative overflow-hidden group ${
                isDragging
                  ? 'border-blue-500 bg-blue-500/10 scale-[0.99]'
                  : theme === 'dark'
                  ? 'border-slate-800 bg-slate-900/40 hover:bg-slate-900/70 hover:border-slate-700'
                  : 'border-slate-300 bg-white hover:bg-slate-50 hover:border-blue-400 shadow-sm'
              }`}
            >
              <div className="max-w-md mx-auto flex flex-col items-center">
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110 duration-200 ${
                  theme === 'dark' 
                    ? 'bg-blue-600/15 text-blue-400 border border-blue-500/20' 
                    : 'bg-blue-50 text-blue-600 border border-blue-100'
                }`}>
                  {toolMode === 'signature' ? (
                    <PenTool className="w-8 h-8" />
                  ) : (
                    <Upload className="w-8 h-8" />
                  )}
                </div>

                <h3 className="text-lg sm:text-xl font-bold font-display text-slate-900 dark:text-white">
                  {language === 'hi' 
                    ? `${toolMode === 'signature' ? 'हस्ताक्षर' : 'फोटो'} अपलोड करें` 
                    : `Upload ${toolMode === 'signature' ? 'Signature' : 'Photo or Signature'}`}
                </h3>

                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-2">
                  {language === 'hi'
                    ? 'यहाँ अपनी इमेज ड्रैग और ड्रॉप करें या ब्राउज़ करने के लिए क्लिक करें'
                    : 'Drag & Drop your image here or Click to Browse'}
                </p>

                <div className="mt-5 flex items-center gap-2 text-[11px] font-mono text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800/60 px-3.5 py-1.5 rounded-full border border-slate-200 dark:border-slate-700/60">
                  <span>Supported formats:</span>
                  <span className="font-bold text-blue-500">JPG, JPEG, PNG, WEBP</span>
                </div>
              </div>
            </div>
          ) : (
            /* Uploaded Image Overview Card */
            <div className={`rounded-3xl border p-6 sm:p-8 transition-all ${
              theme === 'dark' 
                ? 'bg-slate-900/60 border-slate-800 shadow-xl' 
                : 'bg-white border-slate-200 shadow-sm'
            }`}>
              <div className="flex flex-col lg:flex-row items-center gap-8">
                {/* Image Preview Box */}
                <div className="w-full lg:w-72 shrink-0 flex flex-col items-center">
                  <div className={`w-full aspect-[4/3] max-h-64 rounded-2xl border overflow-hidden relative flex items-center justify-center p-3 ${
                    theme === 'dark' 
                      ? 'bg-slate-950 border-slate-800' 
                      : 'bg-slate-100/70 border-slate-200'
                  }`}>
                    {/* Checkerboard background for transparent signature visualization */}
                    <div 
                      className="absolute inset-0 opacity-15"
                      style={{
                        backgroundImage: `radial-gradient(#888 1px, transparent 1px)`,
                        backgroundSize: '12px 12px'
                      }}
                    />
                    <img
                      src={imageSrc}
                      alt="Uploaded preview"
                      className="max-h-full max-w-full object-contain rounded-lg shadow-sm relative z-10"
                    />
                  </div>
                </div>

                {/* Metadata & Details */}
                <div className="flex-1 w-full space-y-5">
                  <div>
                    <span className="text-[10px] font-mono uppercase font-bold text-blue-500 bg-blue-500/10 px-2.5 py-1 rounded-md border border-blue-500/20">
                      Uploaded File
                    </span>
                    <h3 className="text-xl font-bold font-display text-slate-900 dark:text-white mt-2 truncate" title={fileName}>
                      {fileName}
                    </h3>
                  </div>

                  {/* Metadata Chips Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    <div className={`p-3 rounded-xl border ${
                      theme === 'dark' ? 'bg-slate-950/80 border-slate-800' : 'bg-slate-50 border-slate-200'
                    }`}>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 block font-medium">Dimensions</span>
                      <span className="text-sm font-bold font-mono text-slate-900 dark:text-slate-100">
                        {originalWidth} × {originalHeight} px
                      </span>
                    </div>

                    <div className={`p-3 rounded-xl border ${
                      theme === 'dark' ? 'bg-slate-950/80 border-slate-800' : 'bg-slate-50 border-slate-200'
                    }`}>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 block font-medium">Original File Size</span>
                      <span className="text-sm font-bold font-mono text-blue-500">
                        {formatFileSize(originalFileSize)}
                      </span>
                    </div>

                    <div className={`p-3 rounded-xl border ${
                      theme === 'dark' ? 'bg-slate-950/80 border-slate-800' : 'bg-slate-50 border-slate-200'
                    }`}>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 block font-medium">File Format</span>
                      <span className="text-sm font-bold font-mono text-slate-900 dark:text-slate-100">
                        {originalFileType}
                      </span>
                    </div>
                  </div>

                  {/* Actions Row */}
                  <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setIsEditorOpen(true);
                        // Trigger initial resize preview
                        setTimeout(() => performResize(), 50);
                      }}
                      className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs sm:text-sm shadow-lg shadow-blue-600/30 flex items-center gap-2 cursor-pointer transition-all hover:scale-[1.02] active:scale-[0.98]"
                    >
                      <Sliders className="w-4 h-4" />
                      <span>{language === 'hi' ? 'इमेज रीसाइज करें (Resize Image)' : 'Resize Image'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className={`px-4 py-3 rounded-xl text-xs font-semibold border flex items-center gap-1.5 transition-colors cursor-pointer ${
                        theme === 'dark' 
                          ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700' 
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
                      }`}
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>{language === 'hi' ? 'फोटो बदलें' : 'Change Image'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleReset}
                      className="px-4 py-3 rounded-xl text-xs font-semibold text-rose-500 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 transition-colors cursor-pointer"
                    >
                      <span>{language === 'hi' ? 'हटाएं (Remove)' : 'Remove'}</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================
          SCREEN 2: DEDICATED RESIZE EDITOR / PANEL (Opens in-place)
         ======================================================== */}
      {isEditorOpen && imageSrc && (
        <div className={`rounded-3xl border p-5 sm:p-8 space-y-6 transition-all animate-fade-in ${
          theme === 'dark' 
            ? 'bg-slate-900/90 border-slate-800 shadow-2xl' 
            : 'bg-white border-slate-200 shadow-lg'
        }`}>
          {/* Top Panel Header */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-600/20">
                <Sliders className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg sm:text-xl font-bold font-display text-slate-900 dark:text-white">
                  {language === 'hi' ? 'रीसाइज एडिटर (Resize)' : 'Resize'}
                </h3>
                <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400">
                  {language === 'hi'
                    ? 'पिक्सेल, प्रतिशत, क्वालिटी और लक्ष्य फाइल साइज (KB) सेट करें'
                    : 'Set dimensions, percentage, quality, and target KB'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleReset}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border flex items-center gap-1.5 transition-colors cursor-pointer ${
                  theme === 'dark'
                    ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
                }`}
                title="Reset all settings to original image"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>{language === 'hi' ? 'रीसेट' : 'Reset'}</span>
              </button>

              <button
                type="button"
                onClick={handleCancelEditor}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800/80 transition-colors cursor-pointer"
                title="Close Editor"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Main Grid: Left Controls Form | Right Live Dual-Preview */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* LEFT COLUMN: Controls & Settings (7 cols on lg) */}
            <div className="lg:col-span-7 space-y-6">
              
              {/* 1. Resize Mode: Pixels vs Percentage */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
                  Resize Mode
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setResizeMode('pixels');
                    }}
                    className={`py-3 px-4 rounded-xl text-xs sm:text-sm font-bold border flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      resizeMode === 'pixels'
                        ? 'bg-blue-600 border-blue-500 text-white shadow-md shadow-blue-600/20 ring-2 ring-blue-500/30'
                        : theme === 'dark'
                        ? 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    <span className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                      resizeMode === 'pixels' ? 'border-white' : 'border-slate-500'
                    }`}>
                      {resizeMode === 'pixels' && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                    </span>
                    <span>Pixels</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setResizeMode('percentage');
                    }}
                    className={`py-3 px-4 rounded-xl text-xs sm:text-sm font-bold border flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      resizeMode === 'percentage'
                        ? 'bg-blue-600 border-blue-500 text-white shadow-md shadow-blue-600/20 ring-2 ring-blue-500/30'
                        : theme === 'dark'
                        ? 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    <span className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                      resizeMode === 'percentage' ? 'border-white' : 'border-slate-500'
                    }`}>
                      {resizeMode === 'percentage' && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                    </span>
                    <span>Percentage</span>
                  </button>
                </div>
              </div>

              {/* 2. Pixel Inputs OR Percentage Slider */}
              {resizeMode === 'pixels' ? (
                <div className={`p-4 rounded-2xl border ${
                  theme === 'dark' ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50/80 border-slate-200'
                }`}>
                  <div className="flex items-center gap-3">
                    {/* Width input */}
                    <div className="flex-1 space-y-1">
                      <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block">
                        Width (px)
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="10000"
                        value={width || ''}
                        onChange={(e) => handleWidthChange(e.target.value)}
                        className={`w-full px-3.5 py-2.5 rounded-xl text-sm font-mono font-bold border outline-none transition-all ${
                          theme === 'dark'
                            ? 'bg-slate-900 border-slate-700 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500'
                            : 'bg-white border-slate-300 text-slate-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500'
                        }`}
                      />
                    </div>

                    {/* Aspect Ratio Lock/Unlock button */}
                    <div className="flex flex-col items-center justify-center pt-5">
                      <button
                        type="button"
                        onClick={() => setAspectRatioLocked(!aspectRatioLocked)}
                        className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
                          aspectRatioLocked
                            ? 'bg-blue-600/15 border-blue-500/40 text-blue-500 hover:bg-blue-600/25'
                            : theme === 'dark'
                            ? 'bg-slate-900 border-slate-700 text-slate-400 hover:text-slate-200'
                            : 'bg-white border-slate-300 text-slate-500 hover:text-slate-700'
                        }`}
                        title={aspectRatioLocked ? 'Aspect Ratio Locked (Click to Unlock)' : 'Aspect Ratio Unlocked (Click to Lock)'}
                      >
                        {aspectRatioLocked ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                      </button>
                    </div>

                    {/* Height input */}
                    <div className="flex-1 space-y-1">
                      <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block">
                        Height (px)
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="10000"
                        value={height || ''}
                        onChange={(e) => handleHeightChange(e.target.value)}
                        className={`w-full px-3.5 py-2.5 rounded-xl text-sm font-mono font-bold border outline-none transition-all ${
                          theme === 'dark'
                            ? 'bg-slate-900 border-slate-700 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500'
                            : 'bg-white border-slate-300 text-slate-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500'
                        }`}
                      />
                    </div>
                  </div>

                  <div className="mt-2.5 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                    <span>Aspect Ratio: {aspectRatioLocked ? 'Locked (Proportional)' : 'Free (Independent)'}</span>
                    <span className="font-mono">Original: {originalWidth} × {originalHeight}</span>
                  </div>
                </div>
              ) : (
                /* Percentage Mode controls */
                <div className={`p-4 rounded-2xl border space-y-3 ${
                  theme === 'dark' ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50/80 border-slate-200'
                }`}>
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                      Scale Percentage
                    </label>
                    <span className="text-sm font-mono font-bold text-blue-500 bg-blue-500/10 px-2.5 py-0.5 rounded-md border border-blue-500/20">
                      {percentage}%
                    </span>
                  </div>

                  <input
                    type="range"
                    min="10"
                    max="200"
                    step="1"
                    value={percentage}
                    onChange={(e) => handlePercentageChange(parseInt(e.target.value, 10))}
                    className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-600"
                  />

                  <div className="flex items-center justify-between text-[11px] font-mono text-slate-500 dark:text-slate-400">
                    <span>10%</span>
                    <span>Calculated: {width} × {height} px</span>
                    <span>200%</span>
                  </div>
                </div>
              )}

              {/* 3. Quality Slider */}
              <div className={`p-4 rounded-2xl border space-y-3 ${
                theme === 'dark' ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50/80 border-slate-200'
              }`}>
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    <span>Compression Quality</span>
                  </label>
                  <span className="text-xs font-bold text-slate-900 dark:text-slate-200 font-mono">
                    Quality: {quality}% ({getQualityLabel(quality)})
                  </span>
                </div>

                <input
                  type="range"
                  min="10"
                  max="100"
                  step="1"
                  disabled={useTargetKB}
                  value={quality}
                  onChange={(e) => {
                    setUseTargetKB(false);
                    setQuality(parseInt(e.target.value, 10));
                  }}
                  className={`w-full h-2 rounded-lg appearance-none cursor-pointer accent-blue-600 ${
                    useTargetKB ? 'opacity-40 cursor-not-allowed' : 'bg-slate-200 dark:bg-slate-800'
                  }`}
                />

                <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                  <span>10% (Smaller file)</span>
                  {useTargetKB && (
                    <span className="text-amber-500 font-medium">Auto-managed by Target KB</span>
                  )}
                  <span>100% (High fidelity)</span>
                </div>
              </div>

              {/* 4. Output File Type */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
                  File Type
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {(['JPG', 'PNG', 'WEBP'] as OutputFileType[]).map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setFileType(type)}
                      className={`py-2.5 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer flex flex-col items-center justify-center gap-1 ${
                        fileType === type
                          ? 'bg-blue-600 border-blue-500 text-white shadow-md shadow-blue-600/20 ring-2 ring-blue-500/30'
                          : theme === 'dark'
                          ? 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                          : 'bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-300'
                      }`}
                    >
                      <span>{type}</span>
                      <span className={`text-[10px] font-normal ${
                        fileType === type ? 'text-blue-100' : 'text-slate-500'
                      }`}>
                        {type === 'JPG' ? 'Photo default' : type === 'PNG' ? 'Transparent' : 'Modern Web'}
                      </span>
                    </button>
                  ))}
                </div>
                {fileType === 'PNG' && (
                  <p className="text-[11px] text-emerald-500 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                    <span>PNG preserves transparent background for signatures.</span>
                  </p>
                )}
              </div>

              {/* 5. Target File Size (KB optimization 10 - 200 KB) */}
              <div className={`p-4 rounded-2xl border space-y-3 transition-all ${
                useTargetKB
                  ? 'border-blue-500/50 bg-blue-500/5 ring-1 ring-blue-500/20'
                  : theme === 'dark'
                  ? 'bg-slate-950/60 border-slate-800'
                  : 'bg-slate-50/80 border-slate-200'
              }`}>
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <span>Target File Size (KB)</span>
                    <span className="text-[10px] font-normal text-slate-500">(10 – 200 KB)</span>
                  </label>

                  <button
                    type="button"
                    onClick={() => {
                      if (useTargetKB) {
                        setUseTargetKB(false);
                        setTargetKBError(null);
                      } else {
                        setUseTargetKB(true);
                        setTargetKB(50);
                      }
                    }}
                    className={`text-[11px] font-bold px-2.5 py-1 rounded-md border transition-colors cursor-pointer ${
                      useTargetKB
                        ? 'bg-blue-600 text-white border-blue-500'
                        : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200'
                    }`}
                  >
                    {useTargetKB ? 'Active' : 'Enable KB Target'}
                  </button>
                </div>

                {/* Target KB input */}
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-slate-500">Target Size:</span>
                  <div className="relative w-28">
                    <input
                      type="number"
                      min="10"
                      max="200"
                      value={targetKB}
                      onChange={(e) => handleTargetKBInput(e.target.value)}
                      placeholder="50"
                      className={`w-full px-3 py-1.5 rounded-lg text-sm font-mono font-bold border outline-none ${
                        targetKBError
                          ? 'border-rose-500 bg-rose-500/10 text-rose-500'
                          : theme === 'dark'
                          ? 'bg-slate-900 border-slate-700 text-white focus:border-blue-500'
                          : 'bg-white border-slate-300 text-slate-900 focus:border-blue-500'
                      }`}
                    />
                  </div>
                  <span className="text-xs font-mono font-bold text-slate-600 dark:text-slate-300">KB</span>
                </div>

                {/* Validation Message */}
                {targetKBError && (
                  <p className="text-[11px] font-medium text-rose-500 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{targetKBError}</span>
                  </p>
                )}

                {/* Quick KB Buttons */}
                <div className="space-y-1.5">
                  <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">
                    Quick Presets:
                  </span>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {QUICK_KB_PRESETS.map((kb) => (
                      <button
                        key={kb}
                        type="button"
                        onClick={() => handleQuickKBClick(kb)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold border transition-all cursor-pointer ${
                          useTargetKB && targetKB === kb
                            ? 'bg-blue-600 border-blue-500 text-white shadow-xs'
                            : theme === 'dark'
                            ? 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
                            : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                        }`}
                      >
                        {kb} KB
                      </button>
                    ))}
                  </div>
                </div>
              </div>

            </div>

            {/* RIGHT COLUMN: Live Previews & Current/New HUD (5 cols on lg) */}
            <div className="lg:col-span-5 flex flex-col justify-between space-y-6">
              
              {/* Live Info HUD: Current vs New Comparison */}
              <div className={`p-4 rounded-2xl border space-y-3 ${
                theme === 'dark' ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
              }`}>
                {/* Current Specs */}
                <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800/80">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-slate-400" />
                    <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Current:</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs font-mono font-bold text-slate-700 dark:text-slate-300">
                    <span>{originalWidth} × {originalHeight} px</span>
                    <span>{formatFileSize(originalFileSize)}</span>
                    <span className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-[10px]">
                      {originalFileType}
                    </span>
                  </div>
                </div>

                {/* New Specs */}
                <div className="flex items-center justify-between pt-1">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-xs font-bold text-emerald-500">New:</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs font-mono font-bold text-slate-900 dark:text-white">
                    <span>{newWidth} × {newHeight} px</span>
                    <span className="text-blue-500">{formatFileSize(newFileSize)}</span>
                    <span className="px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30 text-[10px]">
                      {fileType}
                    </span>
                  </div>
                </div>
              </div>

              {/* Original & Resized Preview Cards (Side-by-side or stacked on mobile) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 flex-1">
                {/* Original Preview */}
                <div className={`p-3 rounded-2xl border flex flex-col items-center justify-between ${
                  theme === 'dark' ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50/80 border-slate-200'
                }`}>
                  <div className="w-full flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                      Original Image
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">
                      {originalWidth}×{originalHeight}
                    </span>
                  </div>
                  <div className="w-full flex-1 min-h-[140px] max-h-48 rounded-xl overflow-hidden relative flex items-center justify-center p-2 bg-black/10 dark:bg-black/40">
                    <img
                      src={imageSrc}
                      alt="Original"
                      className="max-h-full max-w-full object-contain rounded"
                    />
                  </div>
                  <span className="text-[10px] font-mono text-slate-400 mt-2">
                    {formatFileSize(originalFileSize)}
                  </span>
                </div>

                {/* Resized Result Preview */}
                <div className={`p-3 rounded-2xl border flex flex-col items-center justify-between relative overflow-hidden ${
                  theme === 'dark' ? 'bg-slate-950/60 border-slate-800 ring-1 ring-blue-500/20' : 'bg-slate-50/80 border-slate-200 ring-1 ring-blue-500/20'
                }`}>
                  <div className="w-full flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold text-blue-500 uppercase tracking-wider flex items-center gap-1">
                      <Sparkles className="w-3 h-3" />
                      <span>Resized Image</span>
                    </span>
                    <span className="text-[10px] font-mono text-blue-400 font-bold">
                      {newWidth}×{newHeight}
                    </span>
                  </div>
                  <div className="w-full flex-1 min-h-[140px] max-h-48 rounded-xl overflow-hidden relative flex items-center justify-center p-2 bg-black/10 dark:bg-black/40">
                    {isProcessing ? (
                      <div className="flex flex-col items-center gap-2 text-blue-500">
                        <RefreshCw className="w-6 h-6 animate-spin" />
                        <span className="text-[10px] font-medium">Compressing...</span>
                      </div>
                    ) : resizedImageUrl ? (
                      <img
                        src={resizedImageUrl}
                        alt="Resized Result"
                        className="max-h-full max-w-full object-contain rounded"
                      />
                    ) : null}
                  </div>
                  <span className="text-[10px] font-mono font-bold text-blue-500 mt-2">
                    {formatFileSize(newFileSize)}
                  </span>
                </div>
              </div>

              {/* Bottom Action Buttons: Save/Download & Cancel */}
              <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-3">
                {downloadSuccess && (
                  <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 text-xs font-semibold flex items-center gap-2 animate-fade-in">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>
                      {language === 'hi' ? 'इमेज सफलतापूर्वक डाउनलोड हो गई!' : 'Image downloaded successfully!'}
                    </span>
                  </div>
                )}

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={handleCancelEditor}
                    className={`flex-1 py-3 px-4 rounded-xl text-xs font-bold border transition-colors cursor-pointer text-center ${
                      theme === 'dark'
                        ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
                    }`}
                  >
                    {language === 'hi' ? 'रद्द करें (Cancel)' : 'Cancel'}
                  </button>

                  <button
                    type="button"
                    onClick={handleDownload}
                    disabled={isProcessing || !resizedBlob}
                    className="flex-2 py-3.5 px-6 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold text-xs sm:text-sm shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 cursor-pointer transition-all hover:scale-[1.02] active:scale-[0.98]"
                  >
                    <Download className="w-4 h-4" />
                    <span>{language === 'hi' ? 'सेव / डाउनलोड करें (Download)' : 'Save / Download'}</span>
                  </button>
                </div>
              </div>

            </div>

          </div>
        </div>
      )}

    </section>
  );
}
