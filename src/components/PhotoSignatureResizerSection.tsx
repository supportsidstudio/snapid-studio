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
  const [previewModalOpen, setPreviewModalOpen] = useState<boolean>(false);

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
        setUseTargetKB(true);
        setTargetKB(toolMode === 'signature' ? 20 : 50);
        setTargetKBError(null);
        setIsEditorOpen(true);
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

  // Reset entire component back to upload dropzone
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

  // Reset settings back to default values for the current image
  const handleResetSettings = () => {
    if (originalWidth > 0 && originalHeight > 0) {
      setWidth(originalWidth);
      setHeight(originalHeight);
      setNewWidth(originalWidth);
      setNewHeight(originalHeight);
      setPercentage(100);
      setQuality(75);
      const defaultFileType: OutputFileType = toolMode === 'signature' ? 'PNG' : 'JPG';
      setFileType(defaultFileType);
      setUseTargetKB(true);
      setTargetKB(toolMode === 'signature' ? 20 : 50);
      setTargetKBError(null);
    }
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
          ? 'कृपया 10 KB और 200 KB के बीच का साइज चुनें।'
          : 'Please choose a target size between 10 KB and 200 KB.'
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
          ? 'कृपया 10 KB और 200 KB के बीच का साइज चुनें।'
          : 'Please choose a target size between 10 KB and 200 KB.'
      );
    } else {
      setTargetKBError(null);
    }
  };

  const handleTargetKBSliderChange = (val: number) => {
    setUseTargetKB(true);
    setTargetKB(val);
    setTargetKBError(null);
  };

  const handleQuickKBClick = (kb: number) => {
    setUseTargetKB(true);
    setTargetKB(kb);
    setTargetKBError(null);
  };

  // Multi-Pass Step-Down Canvas Resampler with Edge-Clarity Preservation
  // Prevents canvas bilinear decimation aliasing & eliminates pixelation / blurriness ("photo fatna")
  const createCrispCanvas = (
    source: HTMLImageElement | HTMLCanvasElement,
    targetW: number,
    targetH: number,
    fillWhiteBg: boolean
  ): HTMLCanvasElement => {
    const origW = source instanceof HTMLImageElement ? source.naturalWidth : source.width;
    const origH = source instanceof HTMLImageElement ? source.naturalHeight : source.height;

    const destW = Math.max(1, Math.round(targetW));
    const destH = Math.max(1, Math.round(targetH));

    // If upscale or identical, single direct pass with high smoothing
    if (destW >= origW && destH >= origH) {
      const directCanvas = document.createElement('canvas');
      directCanvas.width = destW;
      directCanvas.height = destH;
      const ctx = directCanvas.getContext('2d', { willReadFrequently: true });
      if (ctx) {
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        if (fillWhiteBg) {
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, destW, destH);
        } else {
          ctx.clearRect(0, 0, destW, destH);
        }
        ctx.drawImage(source, 0, 0, destW, destH);
      }
      return directCanvas;
    }

    // Step-Down Halving Loop (Mipmapping):
    // Drawing down in halving steps allows the browser to calculate true pixel averages
    // rather than skipping pixel rows/columns (which causes jagged aliasing and pixelated photos)
    let curCanvas = document.createElement('canvas');
    curCanvas.width = origW;
    curCanvas.height = origH;
    let curCtx = curCanvas.getContext('2d', { willReadFrequently: true })!;
    if (fillWhiteBg) {
      curCtx.fillStyle = '#FFFFFF';
      curCtx.fillRect(0, 0, origW, origH);
    } else {
      curCtx.clearRect(0, 0, origW, origH);
    }
    curCtx.drawImage(source, 0, 0, origW, origH);

    let curW = origW;
    let curH = origH;

    while (curW > destW * 2 || curH > destH * 2) {
      const nextW = Math.max(destW, Math.floor(curW * 0.5));
      const nextH = Math.max(destH, Math.floor(curH * 0.5));

      const nextCanvas = document.createElement('canvas');
      nextCanvas.width = nextW;
      nextCanvas.height = nextH;
      const nextCtx = nextCanvas.getContext('2d', { willReadFrequently: true })!;
      nextCtx.imageSmoothingEnabled = true;
      nextCtx.imageSmoothingQuality = 'high';

      if (fillWhiteBg) {
        nextCtx.fillStyle = '#FFFFFF';
        nextCtx.fillRect(0, 0, nextW, nextH);
      } else {
        nextCtx.clearRect(0, 0, nextW, nextH);
      }

      nextCtx.drawImage(curCanvas, 0, 0, nextW, nextH);
      curCanvas = nextCanvas;
      curW = nextW;
      curH = nextH;
    }

    // Final pass to exact dimensions
    const finalCanvas = document.createElement('canvas');
    finalCanvas.width = destW;
    finalCanvas.height = destH;
    const finalCtx = finalCanvas.getContext('2d', { willReadFrequently: true })!;
    finalCtx.imageSmoothingEnabled = true;
    finalCtx.imageSmoothingQuality = 'high';

    if (fillWhiteBg) {
      finalCtx.fillStyle = '#FFFFFF';
      finalCtx.fillRect(0, 0, destW, destH);
    } else {
      finalCtx.clearRect(0, 0, destW, destH);
    }

    finalCtx.drawImage(curCanvas, 0, 0, destW, destH);

    // Subtle edge micro-contrast sharpening pass so fine facial contours, eyes, text, and signatures stay razor-sharp
    if (destW >= 60 && destH >= 60) {
      try {
        const imgData = finalCtx.getImageData(0, 0, destW, destH);
        const data = imgData.data;
        const copy = new Uint8ClampedArray(data);
        const strength = 0.12; // Natural, artifact-free micro-sharpness

        for (let y = 1; y < destH - 1; y++) {
          const rowOffset = y * destW;
          for (let x = 1; x < destW - 1; x++) {
            const idx = (rowOffset + x) * 4;
            for (let c = 0; c < 3; c++) {
              const center = copy[idx + c];
              const avgNeighbors = (
                copy[((y - 1) * destW + x) * 4 + c] +
                copy[((y + 1) * destW + x) * 4 + c] +
                copy[(rowOffset + (x - 1)) * 4 + c] +
                copy[(rowOffset + (x + 1)) * 4 + c]
              ) * 0.25;
              data[idx + c] = center + (center - avgNeighbors) * strength;
            }
          }
        }
        finalCtx.putImageData(imgData, 0, 0);
      } catch {
        // Fallback gracefully if pixel read is not permitted
      }
    }

    return finalCanvas;
  };

  // Core High-Fidelity Client-Side Image Resizing & Compression Engine
  const performResize = useCallback(async () => {
    if (!sourceImageRef.current || width <= 0 || height <= 0) return;
    setIsProcessing(true);

    const img = sourceImageRef.current;
    const baseW = Math.max(1, Math.round(width));
    const baseH = Math.max(1, Math.round(height));

    // Mime Type configuration
    let mimeType = 'image/jpeg';
    if (fileType === 'PNG') mimeType = 'image/png';
    else if (fileType === 'WEBP') mimeType = 'image/webp';

    const getBlob = (c: HTMLCanvasElement, mime: string, q: number): Promise<Blob | null> => {
      return new Promise((resolve) => {
        c.toBlob((blob) => resolve(blob), mime, q);
      });
    };

    try {
      let finalBlob: Blob | null = null;
      let finalW = baseW;
      let finalH = baseH;

      // MODE 1: Target File Size in KB Optimization (10 KB - 200 KB)
      if (useTargetKB && typeof targetKB === 'number' && targetKB >= 10 && targetKB <= 200) {
        const targetBytes = targetKB * 1024;

        if (fileType === 'PNG') {
          // PNG (Lossless - Signatures / Documents)
          const crispC = createCrispCanvas(img, baseW, baseH, false);
          const directBlob = await getBlob(crispC, mimeType, 1.0);

          if (directBlob && directBlob.size <= targetBytes) {
            finalBlob = directBlob;
            finalW = baseW;
            finalH = baseH;
          } else {
            // Step down resolution smoothly while keeping maximum crispness
            const scales = [0.95, 0.90, 0.85, 0.80, 0.75, 0.70, 0.65, 0.60, 0.55, 0.50, 0.45, 0.40, 0.35, 0.30];
            let bestBlob = directBlob;
            let bestW = baseW;
            let bestH = baseH;

            for (const s of scales) {
              const curW = Math.max(80, Math.round(baseW * s));
              const curH = Math.max(40, Math.round(baseH * s));
              const stepCanvas = createCrispCanvas(img, curW, curH, false);
              const stepBlob = await getBlob(stepCanvas, mimeType, 1.0);
              if (stepBlob) {
                bestBlob = stepBlob;
                bestW = curW;
                bestH = curH;
                if (stepBlob.size <= targetBytes) {
                  break;
                }
              }
            }
            finalBlob = bestBlob;
            finalW = bestW;
            finalH = bestH;
          }
        } else {
          // JPG & WEBP: High-Fidelity Anti-Tearing Adaptive Quality Engine
          // RULE 1: If user chose explicit dimensions in 'pixels' mode, strictly preserve them!
          if (resizeMode === 'pixels') {
            const crispC = createCrispCanvas(img, baseW, baseH, fileType === 'JPG');
            
            // Check top quality first
            const topBlob = await getBlob(crispC, mimeType, 0.95);
            if (topBlob && topBlob.size <= targetBytes) {
              finalBlob = topBlob;
            } else {
              // Precise binary search in [0.25, 0.95] for highest quality under targetBytes
              let lowQ = 0.25;
              let highQ = 0.95;
              let bestFit: Blob | null = null;

              for (let iter = 0; iter < 7; iter++) {
                const midQ = (lowQ + highQ) / 2;
                const testBlob = await getBlob(crispC, mimeType, midQ);
                if (testBlob) {
                  if (testBlob.size <= targetBytes) {
                    bestFit = testBlob;
                    lowQ = midQ; // Try higher quality
                  } else {
                    highQ = midQ;
                  }
                }
              }

              if (!bestFit) {
                bestFit = await getBlob(crispC, mimeType, 0.28);
              }
              finalBlob = bestFit;
            }
            finalW = baseW;
            finalH = baseH;
          } else {
            // General or Percentage Resizing:
            // First check if baseW x baseH can fit targetBytes with quality >= 0.40
            const crispC = createCrispCanvas(img, baseW, baseH, fileType === 'JPG');
            const testMax = await getBlob(crispC, mimeType, 0.95);

            if (testMax && testMax.size <= targetBytes) {
              // Fits at 95% pristine quality! Full resolution kept
              finalBlob = testMax;
              finalW = baseW;
              finalH = baseH;
            } else {
              // Test minimum acceptable quality at full resolution
              const testMin = await getBlob(crispC, mimeType, 0.42);
              if (testMin && testMin.size <= targetBytes) {
                // Requested resolution is 100% PRESERVED!
                // Binary search for highest possible quality
                let lowQ = 0.42;
                let highQ = 0.95;
                let bestFit: Blob | null = testMin;

                for (let i = 0; i < 7; i++) {
                  const midQ = (lowQ + highQ) / 2;
                  const testBlob = await getBlob(crispC, mimeType, midQ);
                  if (testBlob) {
                    if (testBlob.size <= targetBytes) {
                      bestFit = testBlob;
                      lowQ = midQ;
                    } else {
                      highQ = midQ;
                    }
                  }
                }
                finalBlob = bestFit;
                finalW = baseW;
                finalH = baseH;
              } else {
                // If original image is high-megapixel (e.g. 12-24 MP camera photo) and target KB is small (e.g. 20-50 KB),
                // step down dimensions smoothly while keeping JPEG quality high (0.60 to 0.88).
                // This ensures the photo is silky smooth and never tears or pixelates!
                const scaleCandidates = [0.85, 0.70, 0.58, 0.48, 0.38, 0.28, 0.20];
                let foundBlob: Blob | null = null;
                let foundW = baseW;
                let foundH = baseH;

                for (const s of scaleCandidates) {
                  const curW = Math.max(260, Math.round(baseW * s));
                  const curH = Math.max(260, Math.round(baseH * s));
                  const candCanvas = createCrispCanvas(img, curW, curH, fileType === 'JPG');

                  let lowQ = 0.55;
                  let highQ = 0.88;
                  let candBest: Blob | null = null;

                  for (let i = 0; i < 5; i++) {
                    const midQ = (lowQ + highQ) / 2;
                    const testB = await getBlob(candCanvas, mimeType, midQ);
                    if (testB) {
                      if (testB.size <= targetBytes) {
                        candBest = testB;
                        lowQ = midQ;
                      } else {
                        highQ = midQ;
                      }
                    }
                  }

                  if (candBest) {
                    foundBlob = candBest;
                    foundW = curW;
                    foundH = curH;
                    break;
                  }
                }

                if (!foundBlob) {
                  const minW = Math.max(240, Math.round(baseW * 0.20));
                  const minH = Math.max(240, Math.round(baseH * 0.20));
                  const fallbackCanvas = createCrispCanvas(img, minW, minH, fileType === 'JPG');
                  foundBlob = await getBlob(fallbackCanvas, mimeType, 0.52);
                  foundW = minW;
                  foundH = minH;
                }

                finalBlob = foundBlob;
                finalW = foundW;
                finalH = foundH;
              }
            }
          }
        }
      } else {
        // MODE 2: Manual Quality Mode (Uses exact canvas width/height with crisp smoothing)
        const crispC = createCrispCanvas(img, baseW, baseH, fileType === 'JPG');
        const qNorm = Math.max(0.15, Math.min(1.0, quality / 100));
        finalBlob = await getBlob(crispC, mimeType, qNorm);
        finalW = baseW;
        finalH = baseH;
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
  }, [width, height, fileType, quality, useTargetKB, targetKB, resizedImageUrl, resizeMode, originalWidth, originalHeight]);

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
      <div className={`p-6 sm:p-8 rounded-3xl border relative overflow-hidden transition-all subtle-glow-card ${
        theme === 'dark'
          ? 'bg-gradient-to-r from-blue-950/25 via-slate-900/90 to-slate-950 border-slate-800/80 shadow-xl'
          : 'bg-gradient-to-r from-blue-50/70 via-white to-slate-50 border-slate-200 shadow-sm'
      }`}>
        <div className="absolute -right-16 -top-16 w-60 h-60 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-16 -bottom-16 w-60 h-60 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[11px] font-bold text-blue-500 uppercase tracking-wider bg-blue-500/10 px-3 py-1 rounded-full border border-blue-500/20 flex items-center gap-1.5 subtle-element-glow">
                <Sliders className="w-3.5 h-3.5" />
                <span>Online Image Utility</span>
              </span>
              <span className="text-[11px] font-semibold text-emerald-500 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20 subtle-element-glow">
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
          <div className={`p-1.5 rounded-2xl border flex items-center gap-1 shrink-0 subtle-glow-card ${
            theme === 'dark' ? 'bg-slate-950 border-slate-800' : 'bg-slate-100 border-slate-200'
          }`}>
            <button
              type="button"
              onClick={() => handleToolModeChange('photo')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer subtle-glow-button ${
                toolMode === 'photo'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20 subtle-glow-active'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <User className="w-4 h-4" />
              <span>{language === 'hi' ? 'फोटो (Photo)' : 'Photo'}</span>
            </button>
            <button
              type="button"
              onClick={() => handleToolModeChange('signature')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer subtle-glow-button ${
                toolMode === 'signature'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20 subtle-glow-active'
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
          INITIAL UPLOAD (When no image is uploaded)
         ======================================================== */}
      {!imageSrc ? (
        /* Dropzone / Upload Box with Subtle Premium Glow */
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`relative overflow-hidden group border-2 rounded-3xl p-8 sm:p-14 text-center cursor-pointer transition-all duration-300 ${
            isDragging
              ? 'border-blue-500 bg-blue-500/10 scale-[0.99] shadow-[0_0_30px_rgba(59,130,246,0.3)]'
              : theme === 'dark'
              ? 'border-blue-500/50 bg-gradient-to-br from-slate-900/90 via-blue-950/20 to-slate-900/90 shadow-[0_0_24px_rgba(59,130,246,0.18)] hover:border-blue-400 hover:shadow-[0_0_32px_rgba(59,130,246,0.32)]'
              : 'border-blue-300/80 bg-gradient-to-br from-blue-50/80 via-sky-50/40 to-indigo-50/30 shadow-[0_4px_22px_rgba(37,99,235,0.12)] hover:border-blue-500 hover:shadow-[0_6px_28px_rgba(37,99,235,0.22)]'
          }`}
        >
          <div className="relative z-10 max-w-md mx-auto flex flex-col items-center">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-lg shadow-blue-500/30 mb-4 group-hover:scale-110 transition-transform duration-300">
              {toolMode === 'signature' ? (
                <PenTool className="w-8 h-8" />
              ) : (
                <Upload className="w-8 h-8 animate-bounce" />
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

            <div className="mt-5 flex flex-wrap items-center justify-center gap-2 text-[11px] font-mono">
              <span className="px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 font-bold">
                ⚡ 10 KB – 200 KB Ready
              </span>
              <span className="px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 font-medium">
                JPG, JPEG, PNG, WEBP
              </span>
            </div>
          </div>
        </div>
      ) : (
        /* ========================================================
            DEDICATED RESIZE EDITOR / PANEL (Opens immediately on upload)
           ======================================================== */
        <div className={`rounded-3xl border p-5 sm:p-8 space-y-6 transition-all animate-fade-in subtle-glow-card ${
          theme === 'dark' 
            ? 'bg-slate-900/90 border-slate-800 shadow-2xl shadow-blue-950/20' 
            : 'bg-white border-slate-200/90 shadow-xl shadow-slate-200/60'
        }`}>
          {/* Top Panel Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-start sm:items-center gap-3 min-w-0 flex-1">
              <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-600/20 shrink-0 mt-0.5 sm:mt-0 subtle-glow-button">
                <Sliders className="w-5 h-5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2 min-w-0">
                  <h3 className="text-lg sm:text-xl font-bold font-display text-slate-900 dark:text-white shrink-0">
                    {language === 'hi' ? 'रीसाइज एडिटर (Resize Image)' : 'Resize Image'}
                  </h3>
                  {fileName && (
                    <span 
                      className="text-[11px] font-mono text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 rounded-md border border-slate-200 dark:border-slate-700 max-w-[140px] sm:max-w-[220px] md:max-w-[280px] truncate block subtle-element-glow" 
                      title={fileName}
                    >
                      {fileName}
                    </span>
                  )}
                </div>
                <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                  {language === 'hi'
                    ? 'पिक्सेल, प्रतिशत, क्वालिटी और लक्ष्य फाइल साइज (KB) सेट करें'
                    : 'Set dimensions, percentage, quality, and target KB'}
                </p>
              </div>
            </div>

            {/* Quick Action Toolbar */}
            <div className="flex flex-wrap items-center gap-2 self-start md:self-center shrink-0">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border flex items-center gap-1.5 transition-colors cursor-pointer subtle-glow-button ${
                  theme === 'dark'
                    ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
                }`}
                title="Change Image"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>{language === 'hi' ? 'फोटो बदलें' : 'Change Image'}</span>
              </button>

              <button
                type="button"
                onClick={handleResetSettings}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border flex items-center gap-1.5 transition-colors cursor-pointer subtle-glow-button ${
                  theme === 'dark'
                    ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
                }`}
                title="Reset all settings to original image"
              >
                <span>{language === 'hi' ? 'रीसेट' : 'Reset'}</span>
              </button>

              <button
                type="button"
                onClick={handleReset}
                className="p-1.5 rounded-lg text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-colors cursor-pointer subtle-glow-button"
                title={language === 'hi' ? 'हटाएं' : 'Remove Image'}
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
                    className={`py-3 px-4 rounded-xl text-xs sm:text-sm font-bold border flex items-center justify-center gap-2 transition-all cursor-pointer subtle-glow-button ${
                      resizeMode === 'pixels'
                        ? 'bg-blue-600 border-blue-500 text-white shadow-md shadow-blue-600/20 ring-2 ring-blue-500/30 subtle-glow-active'
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
                    className={`py-3 px-4 rounded-xl text-xs sm:text-sm font-bold border flex items-center justify-center gap-2 transition-all cursor-pointer subtle-glow-button ${
                      resizeMode === 'percentage'
                        ? 'bg-blue-600 border-blue-500 text-white shadow-md shadow-blue-600/20 ring-2 ring-blue-500/30 subtle-glow-active'
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
                <div className={`p-4 rounded-2xl border subtle-glow-card ${
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
                        className={`w-full px-3.5 py-2.5 rounded-xl text-sm font-mono font-bold border outline-none transition-all subtle-element-glow ${
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
                        className={`p-2.5 rounded-xl border transition-all cursor-pointer subtle-glow-button ${
                          aspectRatioLocked
                            ? 'bg-blue-600/15 border-blue-500/40 text-blue-500 hover:bg-blue-600/25 subtle-glow-active'
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
                        className={`w-full px-3.5 py-2.5 rounded-xl text-sm font-mono font-bold border outline-none transition-all subtle-element-glow ${
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
                <div className={`p-4 rounded-2xl border space-y-3 subtle-glow-card ${
                  theme === 'dark' ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50/80 border-slate-200'
                }`}>
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                      Scale Percentage
                    </label>
                    <span className="text-sm font-mono font-bold text-blue-500 bg-blue-500/10 px-2.5 py-0.5 rounded-md border border-blue-500/20 subtle-element-glow">
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
                    className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-600 subtle-element-glow"
                  />

                  <div className="flex items-center justify-between text-[11px] font-mono text-slate-500 dark:text-slate-400">
                    <span>10%</span>
                    <span>Calculated: {width} × {height} px</span>
                    <span>200%</span>
                  </div>
                </div>
              )}

              {/* 3. Quality Slider */}
              <div className={`p-4 rounded-2xl border space-y-3 subtle-glow-card ${
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
                  className={`w-full h-2 rounded-lg appearance-none cursor-pointer accent-blue-600 subtle-element-glow ${
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
                      className={`py-2.5 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer flex flex-col items-center justify-center gap-1 subtle-glow-button ${
                        fileType === type
                          ? 'bg-blue-600 border-blue-500 text-white shadow-md shadow-blue-600/20 ring-2 ring-blue-500/30 subtle-glow-active'
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
              <div className={`p-4 sm:p-5 rounded-2xl border space-y-4 transition-all subtle-glow-card ${
                useTargetKB
                  ? 'border-blue-500/60 bg-blue-500/5 ring-1 ring-blue-500/20'
                  : theme === 'dark'
                  ? 'bg-slate-950/60 border-slate-800'
                  : 'bg-slate-50/80 border-slate-200'
              }`}>
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-blue-500" />
                      <span>Target File Size</span>
                      <span className="text-[11px] font-bold text-blue-500 bg-blue-500/10 px-2 py-0.5 rounded-full border border-blue-500/20 subtle-element-glow">
                        10 KB – 200 KB
                      </span>
                    </label>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      {language === 'hi' 
                        ? 'हाई-क्वालिटी कम्प्रेशन: फोटो फटेगी नहीं और सटीक KB में सेव होगी' 
                        : 'High-fidelity compression: crisp photo without tearing or pixelation'}
                    </p>
                  </div>

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
                    className={`text-[11px] font-bold px-3 py-1.5 rounded-xl border transition-all cursor-pointer subtle-glow-button ${
                      useTargetKB
                        ? 'bg-blue-600 text-white border-blue-500 shadow-sm subtle-glow-active'
                        : theme === 'dark'
                        ? 'bg-slate-800 text-slate-300 border-slate-700 hover:text-white'
                        : 'bg-white text-slate-700 border-slate-300 hover:text-slate-900'
                    }`}
                  >
                    {useTargetKB ? '✓ Active' : 'Enable KB'}
                  </button>
                </div>

                {/* Dedicated 10 KB to 200 KB Range Slider */}
                <div className="space-y-2 pt-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                      Slide to Adjust KB:
                    </span>
                    <span className="text-sm font-mono font-bold text-blue-500 bg-blue-500/15 px-3 py-1 rounded-lg border border-blue-500/30 flex items-center gap-1.5 shadow-xs subtle-element-glow">
                      <span>Target:</span>
                      <span className="text-base text-blue-600 dark:text-blue-400">{typeof targetKB === 'number' ? targetKB : 50} KB</span>
                    </span>
                  </div>

                  {/* Range Slider restricted strictly between 10 KB and 200 KB */}
                  <input
                    type="range"
                    min="10"
                    max="200"
                    step="1"
                    value={typeof targetKB === 'number' ? targetKB : 50}
                    onChange={(e) => handleTargetKBSliderChange(parseInt(e.target.value, 10))}
                    className="w-full h-2.5 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-600 focus:outline-none subtle-element-glow"
                  />

                  <div className="flex items-center justify-between text-[11px] font-mono font-bold text-slate-500 dark:text-slate-400">
                    <span className="bg-slate-100 dark:bg-slate-800/80 px-2 py-0.5 rounded border border-slate-300 dark:border-slate-700 subtle-element-glow">10 KB (Min)</span>
                    <span className="text-emerald-500 font-semibold text-[10px]">Crisp Multi-Pass Smoothing</span>
                    <span className="bg-slate-100 dark:bg-slate-800/80 px-2 py-0.5 rounded border border-slate-300 dark:border-slate-700 subtle-element-glow">200 KB (Max)</span>
                  </div>
                </div>

                {/* Direct Number Input & Quick Presets */}
                <div className="pt-2 border-t border-slate-200/80 dark:border-slate-800/80 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-slate-500">Custom Size:</span>
                    <div className="relative w-24">
                      <input
                        type="number"
                        min="10"
                        max="200"
                        value={targetKB}
                        onChange={(e) => handleTargetKBInput(e.target.value)}
                        placeholder="50"
                        className={`w-full px-2.5 py-1.5 rounded-lg text-sm font-mono font-bold border outline-none subtle-element-glow ${
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

                  {/* Quick KB Preset Buttons */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {QUICK_KB_PRESETS.map((kb) => (
                      <button
                        key={kb}
                        type="button"
                        onClick={() => handleQuickKBClick(kb)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold border transition-all cursor-pointer subtle-glow-button ${
                          useTargetKB && targetKB === kb
                            ? 'bg-blue-600 border-blue-500 text-white shadow-xs scale-105 subtle-glow-active'
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

                {/* Validation Message */}
                {targetKBError && (
                  <p className="text-xs font-medium text-rose-500 flex items-center gap-1 bg-rose-500/10 p-2 rounded-lg border border-rose-500/20">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{targetKBError}</span>
                  </p>
                )}
              </div>

            </div>

            {/* RIGHT COLUMN: Live Previews & Current/New HUD (5 cols on lg) */}
            <div className="lg:col-span-5 flex flex-col justify-between space-y-6">
              
              {/* Live Info HUD: Current vs New Comparison */}
              <div className={`p-4 rounded-2xl border space-y-3 subtle-glow-card ${
                theme === 'dark' ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
              }`}>
                {/* Current Specs */}
                <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-200 dark:border-slate-800/80">
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="w-2 h-2 rounded-full bg-slate-400 shrink-0" />
                    <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Current:</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs font-mono font-bold text-slate-700 dark:text-slate-300">
                    <span className="whitespace-nowrap">{originalWidth} × {originalHeight} px</span>
                    <span className="whitespace-nowrap">{formatFileSize(originalFileSize)}</span>
                    <span className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-[10px] shrink-0">
                      {originalFileType}
                    </span>
                  </div>
                </div>

                {/* New Specs */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                    <span className="text-xs font-bold text-emerald-500">New:</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs font-mono font-bold text-slate-900 dark:text-white">
                    <span className="whitespace-nowrap">{newWidth} × {newHeight} px</span>
                    <span className="text-blue-500 whitespace-nowrap">{formatFileSize(newFileSize)}</span>
                    <span className="px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30 text-[10px] shrink-0 subtle-element-glow">
                      {fileType}
                    </span>
                  </div>
                </div>
              </div>

              {/* Original & Resized Preview Cards (Side-by-side or stacked on mobile) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 flex-1">
                {/* Original Preview */}
                <div className={`p-3 rounded-2xl border flex flex-col items-center justify-between subtle-glow-card ${
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
                <div className={`p-3 rounded-2xl border flex flex-col items-center justify-between relative overflow-hidden subtle-glow-card ${
                  theme === 'dark' ? 'bg-slate-950/60 border-slate-800 ring-1 ring-blue-500/20' : 'bg-slate-50/80 border-slate-200 ring-1 ring-blue-500/20'
                }`}>
                  <div className="w-full flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold text-blue-500 uppercase tracking-wider flex items-center gap-1">
                      <Sparkles className="w-3 h-3" />
                      <span>Resized Image</span>
                    </span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-mono text-blue-400 font-bold">
                        {newWidth}×{newHeight}
                      </span>
                      {resizedImageUrl && (
                        <button
                          type="button"
                          onClick={() => setPreviewModalOpen(true)}
                          className="p-1 rounded text-blue-400 hover:text-blue-300 hover:bg-blue-500/20 transition-colors cursor-pointer"
                          title="Full Size Zoom Preview"
                        >
                          <Maximize2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
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
                  <div className="w-full flex items-center justify-between mt-2 pt-1 border-t border-slate-200/50 dark:border-slate-800/50">
                    <span className="text-[10px] font-mono font-bold text-blue-500">
                      {formatFileSize(newFileSize)}
                    </span>
                    {resizedImageUrl && (
                      <button
                        type="button"
                        onClick={() => setPreviewModalOpen(true)}
                        className="text-[10px] text-blue-500 hover:text-blue-400 font-semibold flex items-center gap-1 cursor-pointer"
                      >
                        <Eye className="w-3 h-3" />
                        <span>{language === 'hi' ? 'फुल देखें' : 'Zoom'}</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Bottom Action Buttons: Save/Download */}
              <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-3">
                {downloadSuccess && (
                  <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 text-xs font-semibold flex items-center gap-2 animate-fade-in subtle-glow-card">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>
                      {language === 'hi' ? 'इमेज सफलतापूर्वक डाउनलोड हो गई!' : 'Image downloaded successfully!'}
                    </span>
                  </div>
                )}

                <button
                  type="button"
                  onClick={handleDownload}
                  disabled={isProcessing || !resizedBlob}
                  className="w-full py-3.5 px-6 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold text-xs sm:text-sm shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 cursor-pointer transition-all hover:scale-[1.01] active:scale-[0.99] subtle-glow-button"
                >
                  <Download className="w-4 h-4" />
                  <span>{language === 'hi' ? 'सेव / डाउनलोड करें (Download)' : 'Save / Download'}</span>
                </button>
              </div>

            </div>

          </div>
        </div>
      )}

      {/* Full Size Preview Modal to inspect crispness / pixel clarity */}
      {previewModalOpen && resizedImageUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className={`relative max-w-3xl w-full max-h-[90vh] rounded-2xl border flex flex-col overflow-hidden shadow-2xl ${
            theme === 'dark' ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            {/* Modal Header */}
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-blue-500" />
                <h3 className="text-sm font-bold">
                  {language === 'hi' ? 'रीसाइज्ड इमेज फुल-साइज प्रिव्यू' : 'Resized Image Full Quality Preview'}
                </h3>
                <span className="text-xs font-mono bg-blue-500/10 text-blue-500 px-2 py-0.5 rounded-full border border-blue-500/20 font-bold">
                  {newWidth}×{newHeight}px • {formatFileSize(newFileSize)}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setPreviewModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-auto p-4 sm:p-6 flex items-center justify-center bg-slate-950/40 min-h-[300px]">
              <div className="relative border border-slate-700/50 rounded-xl overflow-hidden shadow-lg max-w-full">
                <img
                  src={resizedImageUrl}
                  alt="Full Resized Preview"
                  className="max-h-[60vh] max-w-full object-contain mx-auto"
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <span className="text-xs text-emerald-500 font-medium flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                <span>{language === 'hi' ? 'फुल क्लैरिटी व एंटी-टियरिंग' : '100% Crisp Clarity'}</span>
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPreviewModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold border border-slate-700 hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  {language === 'hi' ? 'बंद करें' : 'Close'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    handleDownload();
                    setPreviewModalOpen(false);
                  }}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-blue-600/20 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>{language === 'hi' ? 'डाउनलोड करें' : 'Download'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </section>
  );
}
