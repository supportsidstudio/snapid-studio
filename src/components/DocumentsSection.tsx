import React, { useState, useRef, useEffect } from 'react';
import { 
  Upload, 
  Download, 
  RefreshCw, 
  Maximize2, 
  Check, 
  Layers, 
  Printer, 
  Image as ImageIcon,
  ChevronRight,
  Eye,
  RotateCw,
  RotateCcw,
  Sun,
  Contrast,
  Sliders,
  Sparkles,
  Layout,
  ArrowLeft,
  FileDown,
  Move,
  Crop,
  CheckCircle2,
  Trash2,
  FileImage,
  ArrowUpCircle
} from 'lucide-react';
import { 
  AppLanguage, 
  AppTheme, 
  DocumentTypeId, 
  DocumentPreset, 
  DocumentLayoutPresetId,
  ImageCropState 
} from '../types';
import { translations } from '../translations';
import { jsPDF } from 'jspdf';
import { printCanvasAsA4Pdf } from '../utils/pdf-print-helper';
import { generateSampleAadhaarDocuments } from '../utils/sampleAssets';

interface DocumentsSectionProps {
  language: AppLanguage;
  theme: AppTheme;
}

const DOCUMENT_PRESETS: DocumentPreset[] = [
  { id: 'aadhaar', nameEn: 'Aadhaar Card (Standard PVC)', nameHi: 'आधार कार्ड ( pvc मानक )', widthMm: 85.6, heightMm: 54, aspectRatio: 85.6 / 54 },
  { id: 'pan', nameEn: 'PAN Card (Income Tax Dept)', nameHi: 'पैन कार्ड ( आयकर विभाग )', widthMm: 85.6, heightMm: 54, aspectRatio: 85.6 / 54 },
  { id: 'janaadhaar', nameEn: 'Jan Aadhaar Card (Rajasthan)', nameHi: 'जन आधार कार्ड ( राजस्थान )', widthMm: 85.6, heightMm: 54, aspectRatio: 85.6 / 54 },
  { id: 'voterid', nameEn: 'Voter ID Card (Election Comm.)', nameHi: 'मतदाता पहचान पत्र ( वोटर आईडी )', widthMm: 85.6, heightMm: 54, aspectRatio: 85.6 / 54 },
  { id: 'dl', nameEn: 'Driving Licence (Ministry of RT)', nameHi: 'ड्राइविंग लाइसेंस ( आरटीओ )', widthMm: 85.6, heightMm: 54, aspectRatio: 85.6 / 54 },
];

const LAYOUT_PRESETS = [
  { id: 'split' as DocumentLayoutPresetId, labelEn: 'Centered Split (Full page A4 placement)', labelHi: 'A4 केंद्र सप्रिट (अलग प्रिंट)', descEn: 'Placed near the center of the sheet with comfortable cutting margins.', descHi: 'काटने के लिए पर्याप्त जगह के साथ A4 शीट के बीच में रखा गया है |' },
  { id: 'stacked' as DocumentLayoutPresetId, labelEn: 'Stacked (Vertically foldable)', labelHi: 'सामने ऊपर, पीछे नीचे (वर्टिकल फोल्ड)', descEn: 'Front side placed on top, back side on bottom. Suitable for folding over.', descHi: 'ऊपर सामने और नीचे पीछे का हिस्सा |' },
];

export default function DocumentsSection({ language, theme }: DocumentsSectionProps) {
  const t = translations[language];

  // Document preset selections
  const [activeDocType, setActiveDocType] = useState<DocumentTypeId>('aadhaar');
  const [layoutStyle, setLayoutStyle] = useState<DocumentLayoutPresetId>('split');

  // Multi-side file States
  const [frontImage, setFrontImage] = useState<string | null>(null);
  const [frontOriginal, setFrontOriginal] = useState<string | null>(null);
  const [backImage, setBackImage] = useState<string | null>(null);
  const [backOriginal, setBackOriginal] = useState<string | null>(null);

  // Crop Modal state
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [cropModalSide, setCropModalSide] = useState<'front' | 'back'>('front');
  const [cropBox, setCropBox] = useState({ x: 10, y: 10, w: 80, h: 50 });
  const [modalRotation, setModalRotation] = useState<number>(0);
  const [aspectRatioLocked, setAspectRatioLocked] = useState<boolean>(false);
  const [dragAction, setDragAction] = useState<string | null>(null);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0, box: { x: 0, y: 0, w: 0, h: 0 } });

  const displayContainerRef = useRef<HTMLDivElement>(null);
  const cropCanvasRef = useRef<HTMLCanvasElement>(null);

  // Active side focal adjust: 'front' | 'back'
  const [activeSide, setActiveSide] = useState<'front' | 'back'>('front');

  // Front crop adjustments
  const [frontZoom, setFrontZoom] = useState(1.0);
  const [frontPanX, setFrontPanX] = useState(0);
  const [frontPanY, setFrontPanY] = useState(0);
  const [frontRot, setFrontRot] = useState(0);
  const [frontBright, setFrontBright] = useState(100);
  const [frontContrast, setFrontContrast] = useState(100);

  // Back crop adjustments
  const [backZoom, setBackZoom] = useState(1.0);
  const [backPanX, setBackPanX] = useState(0);
  const [backPanY, setBackPanY] = useState(0);
  const [backRot, setBackRot] = useState(0);
  const [backBright, setBackBright] = useState(100);
  const [backContrast, setBackContrast] = useState(100);

  // Borders for documents
  const [borderWidth, setBorderWidth] = useState(0.5); // mm border thickness
  const [borderColor, setBorderColor] = useState('#000000'); // simple black border by default

  // eMitra & Cyber Cafe Quick-Print settings for documents
  const [docPrintPaperSize, setDocPrintPaperSize] = useState<'a4' | 'custom'>('a4');
  const [docPrintOrientation, setDocPrintOrientation] = useState<'portrait' | 'landscape'>('portrait');
  const [docPrintCopiesMode, setDocPrintCopiesMode] = useState<'single' | 'multiple'>('single');
  const [docPrintCopiesCount, setDocPrintCopiesCount] = useState<number>(1);

  // UI Tabs
  const [previewTab, setPreviewTab] = useState<'individual' | 'assembly'>('individual');
  const [isPrintingDoc, setIsPrintingDoc] = useState(false);

  // Sample Documents State & Loader
  const [isLoadingSampleDocs, setIsLoadingSampleDocs] = useState(false);

  const handleLoadSampleDocuments = async () => {
    try {
      setIsLoadingSampleDocs(true);
      const { front, back } = await generateSampleAadhaarDocuments();
      
      const aadhaarAspect = 85.6 / 54;
      setActiveDocType('aadhaar');

      // Front side
      setFrontOriginal(front);
      setFrontImage(front);
      setFrontAspect(aadhaarAspect);
      setFrontZoom(1.0);
      setFrontPanX(0);
      setFrontPanY(0);
      setFrontRot(0);
      setFrontBright(100);
      setFrontContrast(100);

      // Back side
      setBackOriginal(back);
      setBackImage(back);
      setBackAspect(aadhaarAspect);
      setBackZoom(1.0);
      setBackPanX(0);
      setBackPanY(0);
      setBackRot(0);
      setBackBright(100);
      setBackContrast(100);

      setActiveSide('front');
      setDetectionFailedSide(null);
      setDetectionFailed(false);

      await renderAllDocumentCanvases(front, back, aadhaarAspect, aadhaarAspect);
    } catch (err) {
      console.error('Failed to load sample documents:', err);
    } finally {
      setIsLoadingSampleDocs(false);
    }
  };

  // Sync body class and lock scrolling to prevent page scroll/bounce during crop modal
  useEffect(() => {
    if (cropModalOpen) {
      document.body.classList.add('snapid-modal-open');
      const origOverflow = document.body.style.overflow;
      const origTouchAction = document.body.style.touchAction;
      document.body.style.overflow = 'hidden';
      document.body.style.touchAction = 'none';
      return () => {
        document.body.classList.remove('snapid-modal-open');
        document.body.style.overflow = origOverflow;
        document.body.style.touchAction = origTouchAction;
      };
    } else {
      document.body.classList.remove('snapid-modal-open');
    }
  }, [cropModalOpen]);

  // Edge-detection & Auto-crop loading states
  const [isDetectingFront, setIsDetectingFront] = useState(false);
  const [isDetectingBack, setIsDetectingBack] = useState(false);
  const [cvState, setCvState] = useState<'idle' | 'loading' | 'ready' | 'failed'>('idle');

  useEffect(() => {
    if ((window as any).cv && (window as any).cv.Mat) {
      setCvState('ready');
      return;
    }

    // Defer loading OpenCV asynchronously on idle/timeout so tab switching remains 100% instant and lag-free
    let intervalId: any = null;
    const idleTimer = setTimeout(() => {
      if ((window as any).cv && (window as any).cv.Mat) {
        setCvState('ready');
        return;
      }
      const existing = document.getElementById('opencv-cdn-script');
      if (existing) {
        intervalId = setInterval(() => {
          if ((window as any).cv && (window as any).cv.Mat) {
            setCvState('ready');
            if (intervalId) clearInterval(intervalId);
          }
        }, 500);
        return;
      }
      const script = document.createElement('script');
      script.id = 'opencv-cdn-script';
      script.src = 'https://docs.opencv.org/4.5.5/opencv.js';
      script.async = true;
      script.onload = () => {
        intervalId = setInterval(() => {
          if ((window as any).cv && (window as any).cv.Mat) {
            setCvState('ready');
            if (intervalId) clearInterval(intervalId);
          }
        }, 500);
      };
      script.onerror = () => {
        setCvState('failed');
      };
      document.body.appendChild(script);
    }, 2500);

    return () => {
      clearTimeout(idleTimer);
      if (intervalId) clearInterval(intervalId);
    };
  }, []);

  // Drag-and-drop hover state tracking
  const [isDragOverFront, setIsDragOverFront] = useState(false);
  const [isDragOverBack, setIsDragOverBack] = useState(false);
  const [isDragOverStage, setIsDragOverStage] = useState(false);

  // Document Auto Crop Guidance states
  const [detectionFailed, setDetectionFailed] = useState(false);
  const [detectionFailedSide, setDetectionFailedSide] = useState<'front' | 'back' | null>(null);
  const [guidanceExpanded, setGuidanceExpanded] = useState(false);
  const fallbackFileInputRef = useRef<HTMLInputElement>(null);

  const selectedDocPreset = DOCUMENT_PRESETS.find(d => d.id === activeDocType) || DOCUMENT_PRESETS[0];

  // Dynamic aspect ratio tracking for front and back sides
  const [frontAspect, setFrontAspect] = useState<number>(selectedDocPreset.aspectRatio);
  const [backAspect, setBackAspect] = useState<number>(selectedDocPreset.aspectRatio);

  useEffect(() => {
    if (!frontImage) setFrontAspect(selectedDocPreset.aspectRatio);
    if (!backImage) setBackAspect(selectedDocPreset.aspectRatio);
  }, [activeDocType, selectedDocPreset.aspectRatio]);

  // Canvas Refs
  const frontCanvasRef = useRef<HTMLCanvasElement>(null);
  const backCanvasRef = useRef<HTMLCanvasElement>(null);
  const assemblyCanvasRef = useRef<HTMLCanvasElement>(null);

  // Draggings
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef({ x: 0, y: 0 });

  // Highly sophisticated Automatic Edge Detection & Card Cropping Algorithm
  const detectDocumentAndCrop = (imageSrc: string, targetRatio: number): Promise<{
    croppedDataUrl: string;
    debugDataUrl: string;
    originalWidth: number;
    originalHeight: number;
    cropWidth: number;
    cropHeight: number;
    cropX: number;
    cropY: number;
    failed: boolean;
  }> => {
    console.log("STEP 3: detectDocumentAndCrop Called");
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        console.log("STEP 4: Image Loaded");
        
        let croppedDataUrl = imageSrc;
        let debugDataUrl = imageSrc;
        let finalCropX = 0;
        let finalCropY = 0;
        let finalCropW = img.naturalWidth;
        let finalCropH = img.naturalHeight;
        
        let usedOpenCV = false;
        let cropDone = false;
        let detectionFailed = false;

        const cv = (window as any).cv;

        // Perfect Corner Sorter mathematically pairing points in [tl, tr, br, bl] order
        const sortCorners = (pts: { x: number; y: number }[]) => {
          const sum = pts.map(p => p.x + p.y);
          const diff = pts.map(p => p.y - p.x);
          const tl = pts[sum.indexOf(Math.min(...sum))];
          const br = pts[sum.indexOf(Math.max(...sum))];
          const tr = pts[diff.indexOf(Math.min(...diff))];
          const bl = pts[diff.indexOf(Math.max(...diff))];
          const uniq = new Set([tl, tr, br, bl]);
          if (uniq.size < 4) {
            const sortedByY = [...pts].sort((a, b) => a.y - b.y);
            const topTwo = [sortedByY[0], sortedByY[1]].sort((a, b) => a.x - b.x);
            const bottomTwo = [sortedByY[2], sortedByY[3]].sort((a, b) => b.x - a.x);
            return [topTwo[0], topTwo[1], bottomTwo[0], bottomTwo[1]];
          }
          return [tl, tr, br, bl];
        };

        // ------------------ OPENCV.JS PROCESSING PATH ------------------
        if (cv && cv.Mat) {
          try {
            console.log("AUTO-CROP: Running OpenCV.js contour-based document locator...");
            const src = cv.imread(img);
            const grayMat = new cv.Mat();
            cv.cvtColor(src, grayMat, cv.COLOR_RGBA2GRAY);

            const blurredMat = new cv.Mat();
            cv.GaussianBlur(grayMat, blurredMat, new cv.Size(5, 5), 0, 0, cv.BORDER_DEFAULT);

            const edgesMat = new cv.Mat();
            cv.Canny(blurredMat, edgesMat, 75, 200, 3, false);

            const M = cv.Mat.ones(3, 3, cv.CV_8U);
            const dilatedMat = new cv.Mat();
            cv.dilate(edgesMat, dilatedMat, M, new cv.Point(-1, -1), 1, cv.BORDER_CONSTANT, cv.morphologyDefaultBorderValue());

            const contours = new cv.MatVector();
            const hierarchy = new cv.Mat();
            cv.findContours(dilatedMat, contours, hierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);

            const listContours: { index: number; area: number; cnt: any }[] = [];
            for (let i = 0; i < contours.size(); ++i) {
              const cnt = contours.get(i);
              const area = cv.contourArea(cnt);
              listContours.push({ index: i, area, cnt });
            }
            listContours.sort((a, b) => b.area - a.area);

            let bestQuadPts: { x: number; y: number }[] | null = null;
            let boundsArea = 0;
            const totalArea = img.naturalWidth * img.naturalHeight;

            for (const item of listContours) {
              if (item.area < totalArea * 0.06) {
                continue;
              }
              const cnt = item.cnt;
              const perimeter = cv.arcLength(cnt, true);
              
              let found4 = false;
              let pts: { x: number; y: number }[] = [];
              const approx = new cv.Mat();
              
              // Try different epsilons to find exactly 4 corners
              for (let eps = 0.01; eps <= 0.09; eps += 0.005) {
                cv.approxPolyDP(cnt, approx, eps * perimeter, true);
                if (approx.rows === 4) {
                  pts = [];
                  for (let j = 0; j < 4; j++) {
                    pts.push({
                      x: approx.data32S[j * 2],
                      y: approx.data32S[j * 2 + 1]
                    });
                  }
                  found4 = true;
                  break;
                }
              }
              approx.delete();

              if (!found4) {
                // Fall back to oriented bounding box (minAreaRect)
                const rect = cv.minAreaRect(cnt);
                const rw = rect.size.width;
                const rh = rect.size.height;
                const w = Math.max(rw, rh);
                const h = Math.min(rw, rh);
                const rectRatio = w / h;
                
                if (rectRatio >= 1.18 && rectRatio <= 2.2) {
                  const angleRad = (rect.angle * Math.PI) / 180;
                  const cos = Math.cos(angleRad);
                  const sin = Math.sin(angleRad);
                  const hw = rw / 2;
                  const hh = rh / 2;
                  
                  pts = [
                    { x: rect.center.x - hw * cos + hh * sin, y: rect.center.y - hw * sin - hh * cos },
                    { x: rect.center.x + hw * cos + hh * sin, y: rect.center.y + hw * sin - hh * cos },
                    { x: rect.center.x + hw * cos - hh * sin, y: rect.center.y + hw * sin + hh * cos },
                    { x: rect.center.x - hw * cos - hh * sin, y: rect.center.y - hw * sin + hh * cos }
                  ];
                  found4 = true;
                }
              }

              if (found4 && pts.length === 4) {
                const cx = (pts[0].x + pts[1].x + pts[2].x + pts[3].x) / 4;
                const cy = (pts[0].y + pts[1].y + pts[2].y + pts[3].y) / 4;
                const devX = Math.abs(cx - img.naturalWidth / 2) / img.naturalWidth;
                const devY = Math.abs(cy - img.naturalHeight / 2) / img.naturalHeight;

                const minX = Math.min(...pts.map(p => p.x));
                const maxX = Math.max(...pts.map(p => p.x));
                const minY = Math.min(...pts.map(p => p.y));
                const maxY = Math.max(...pts.map(p => p.y));
                const bw = maxX - minX;
                const bh = maxY - minY;
                const ratio = bw / bh;

                if (ratio >= 1.18 && ratio <= 2.2 && devX <= 0.45 && devY <= 0.45) {
                  bestQuadPts = pts;
                  boundsArea = item.area;
                  break;
                }
              }
            }

            if (bestQuadPts) {
              console.log("AUTO-CROP: Selected Quad points:", bestQuadPts);
              const sorted = sortCorners(bestQuadPts);
              const [tl, tr, br, bl] = sorted;

              // Centroid
              const centroidX = (tl.x + tr.x + br.x + bl.x) / 4;
              const centroidY = (tl.y + tr.y + br.y + bl.y) / 4;

              const clampX = (val: number) => Math.max(0, Math.min(img.naturalWidth - 1, val));
              const clampY = (val: number) => Math.max(0, Math.min(img.naturalHeight - 1, val));

              // Stretch slightly outwards from centroid to cover safety margins: Top: 3%, Bottom: 3%, Left: 2%, Right: 2%
              const tlEx = { x: clampX(centroidX + (tl.x - centroidX) * 1.04), y: clampY(centroidY + (tl.y - centroidY) * 1.06) };
              const trEx = { x: clampX(centroidX + (tr.x - centroidX) * 1.04), y: clampY(centroidY + (tr.y - centroidY) * 1.06) };
              const brEx = { x: clampX(centroidX + (br.x - centroidX) * 1.04), y: clampY(centroidY + (br.y - centroidY) * 1.06) };
              const blEx = { x: clampX(centroidX + (bl.x - centroidX) * 1.04), y: clampY(centroidY + (bl.y - centroidY) * 1.06) };

              const edgeWidthTop = Math.hypot(trEx.x - tlEx.x, trEx.y - tlEx.y);
              const edgeWidthBottom = Math.hypot(brEx.x - blEx.x, brEx.y - blEx.y);
              const edgeW = Math.max(edgeWidthTop, edgeWidthBottom);

              const destW = Math.round(Math.max(edgeW, 800));
              const destH = Math.round(destW / targetRatio);

              const srcCoords = cv.matFromArray(4, 1, cv.CV_32FC2, [
                tlEx.x, tlEx.y,
                trEx.x, trEx.y,
                brEx.x, brEx.y,
                blEx.x, blEx.y
              ]);
              const dstCoords = cv.matFromArray(4, 1, cv.CV_32FC2, [
                0, 0,
                destW - 1, 0,
                destW - 1, destH - 1,
                0, destH - 1
              ]);

              const warpMat = cv.getPerspectiveTransform(srcCoords, dstCoords);
              const warpedMat = new cv.Mat();
              cv.warpPerspective(src, warpedMat, warpMat, new cv.Size(destW, destH), cv.INTER_LINEAR, cv.BORDER_CONSTANT, new cv.Scalar(255, 255, 255, 255));

              const outCanvas = document.createElement('canvas');
              outCanvas.width = destW;
              outCanvas.height = destH;
              cv.imshow(outCanvas, warpedMat);
              croppedDataUrl = outCanvas.toDataURL('image/png');

              // Draw beautiful transparent outer masks and solid red lines for interactive live preview
              const debugCanvas = document.createElement('canvas');
              debugCanvas.width = img.naturalWidth;
              debugCanvas.height = img.naturalHeight;
              const debugCtx = debugCanvas.getContext('2d');
              if (debugCtx) {
                debugCtx.drawImage(img, 0, 0);
                debugCtx.strokeStyle = '#ef4444';
                const strokeWidth = Math.max(6, Math.round(Math.min(img.naturalWidth, img.naturalHeight) * 0.015));
                debugCtx.lineWidth = strokeWidth;
                debugCtx.lineJoin = 'round';
                
                debugCtx.beginPath();
                debugCtx.moveTo(tlEx.x, tlEx.y);
                debugCtx.lineTo(trEx.x, trEx.y);
                debugCtx.lineTo(brEx.x, brEx.y);
                debugCtx.lineTo(blEx.x, blEx.y);
                debugCtx.closePath();
                debugCtx.stroke();

                // Clipping mask
                debugCtx.fillStyle = 'rgba(0, 0, 0, 0.45)';
                debugCtx.beginPath();
                debugCtx.rect(0, 0, img.naturalWidth, img.naturalHeight);
                debugCtx.moveTo(tlEx.x, tlEx.y);
                debugCtx.lineTo(blEx.x, blEx.y);
                debugCtx.lineTo(brEx.x, brEx.y);
                debugCtx.lineTo(trEx.x, trEx.y);
                debugCtx.closePath();
                debugCtx.fill('evenodd');

                // Label badge
                const minX = Math.min(tlEx.x, trEx.x, brEx.x, blEx.x);
                const minY = Math.min(tlEx.y, trEx.y, brEx.y, blEx.y);
                const lH = Math.max(28, Math.round(img.naturalHeight * 0.04));
                const lW = Math.max(160, Math.round(img.naturalWidth * 0.22));
                debugCtx.fillStyle = '#ef4444';
                debugCtx.fillRect(minX, Math.max(0, minY - lH), lW, lH);
                debugCtx.font = `bold ${Math.round(lH * 0.5)}px sans-serif`;
                debugCtx.fillStyle = '#ffffff';
                debugCtx.textAlign = 'center';
                debugCtx.textBaseline = 'middle';
                debugCtx.fillText("AUTO-CROP AREA", minX + lW / 2, Math.max(lH / 2, minY - lH / 2));
              }
              debugDataUrl = debugCanvas.toDataURL('image/png');

              finalCropX = Math.round(Math.min(tlEx.x, trEx.x, blEx.x, brEx.x));
              finalCropY = Math.round(Math.min(tlEx.y, trEx.y, blEx.y, brEx.y));
              finalCropW = Math.round(Math.max(tlEx.x, trEx.x, blEx.x, brEx.x) - finalCropX);
              finalCropH = Math.round(Math.max(tlEx.y, trEx.y, blEx.y, brEx.y) - finalCropY);

              srcCoords.delete();
              dstCoords.delete();
              warpMat.delete();
              warpedMat.delete();

              cropDone = true;
              usedOpenCV = true;
            } else {
              // Strategy B: bounding box fallback of largest valid contour
              let bestContourRect: any = null;
              for (const item of listContours) {
                if (item.area > totalArea * 0.12 && item.area < totalArea * 0.95) {
                  const rect = cv.boundingRect(item.cnt);
                  const cardRatio = rect.width / rect.height;
                  if (cardRatio >= 1.15 && cardRatio <= 1.95) {
                    bestContourRect = rect;
                    break;
                  }
                }
              }

              if (bestContourRect) {
                console.log("AUTO-CROP: OpenCV bounding box fallback:", bestContourRect);
                const padL = Math.round(img.naturalWidth * 0.02);
                const padR = Math.round(img.naturalWidth * 0.02);
                const padT = Math.round(img.naturalHeight * 0.03);
                const padB = Math.round(img.naturalHeight * 0.03);

                let cX = Math.max(0, bestContourRect.x - padL);
                let cY = Math.max(0, bestContourRect.y - padT);
                let cW = bestContourRect.width + padL + padR;
                let cH = bestContourRect.height + padT + padB;

                cW = Math.min(img.naturalWidth - cX, cW);
                cH = Math.min(img.naturalHeight - cY, cH);

                const centX = cX + cW / 2;
                const centY = cY + cH / 2;

                const curRatio = cW / cH;
                if (curRatio > targetRatio) {
                  const newH = cW / targetRatio;
                  if (centY + newH / 2 <= img.naturalHeight && centY - newH / 2 >= 0) {
                    cY = Math.round(centY - newH / 2);
                    cH = Math.round(newH);
                  } else {
                    cH = Math.round(Math.min(img.naturalHeight, newH));
                    cY = Math.round((img.naturalHeight - cH) / 2);
                    cW = Math.round(cH * targetRatio);
                    cX = Math.round(Math.max(0, Math.min(img.naturalWidth - cW, centX - cW / 2)));
                  }
                } else {
                  const newW = cH * targetRatio;
                  if (centX + newW / 2 <= img.naturalWidth && centX - newW / 2 >= 0) {
                    cX = Math.round(centX - newW / 2);
                    cW = Math.round(newW);
                  } else {
                    cW = Math.round(Math.min(img.naturalWidth, newW));
                    cX = Math.round((img.naturalWidth - cW) / 2);
                    cH = Math.round(cW / targetRatio);
                    cY = Math.round(Math.max(0, Math.min(img.naturalHeight - cH, centY - cH / 2)));
                  }
                }

                finalCropX = Math.round(cX);
                finalCropY = Math.round(cY);
                finalCropW = Math.round(cW);
                finalCropH = Math.round(cH);
                cropDone = true;
              }
            }

            src.delete();
            grayMat.delete();
            blurredMat.delete();
            edgesMat.delete();
            M.delete();
            dilatedMat.delete();
            contours.delete();
            hierarchy.delete();

          } catch (cvErr) {
            console.warn("OpenCV execution skipped or unavailable, using optimized pure-JS detector", cvErr);
          }
        }

        // ------------------ PURE-JS PROCESSING FALLBACK ------------------
        if (!cropDone) {
          console.log("AUTO-CROP: Running Pure-JS Dynamic Gradient Lane Tracker Fallback Engine");
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          if (ctx) {
            const analyzeWidth = 400;
            const analyzeHeight = Math.round(analyzeWidth * (img.height / img.width));
            canvas.width = analyzeWidth;
            canvas.height = analyzeHeight;
            ctx.drawImage(img, 0, 0, analyzeWidth, analyzeHeight);

            const imgData = ctx.getImageData(0, 0, analyzeWidth, analyzeHeight);
            const data = imgData.data;

            const gray = new Uint8Array(analyzeWidth * analyzeHeight);
            for (let i = 0; i < data.length / 4; i++) {
              gray[i] = Math.round(data[i * 4] * 0.299 + data[i * 4 + 1] * 0.587 + data[i * 4 + 2] * 0.114);
            }

            const leftPeakIdx: number[] = [];
            const rightPeakIdx: number[] = [];
            const topPeakIdx: number[] = [];
            const bottomPeakIdx: number[] = [];

            // ------------------ ENHANCED PURE-JS PROCESSING ------------------
            // Multi-channel Sobel gradient & contrast detection for card/document borders
            const scanRows = 24;
            const scanCols = 24;

            for (let row = 1; row <= scanRows; row++) {
              const y = Math.round((analyzeHeight * row) / (scanRows + 1));
              let baseLuma = gray[y * analyzeWidth];
              for (let x = 4; x < analyzeWidth * 0.45; x++) {
                const idx = y * analyzeWidth + x;
                const luma = gray[idx];
                const grad = Math.abs(luma - gray[idx - 1]) + Math.abs(luma - gray[idx + 1]);
                const diffFromStart = Math.abs(luma - baseLuma);
                if (grad > 14 || diffFromStart > 20) {
                  leftPeakIdx.push(x);
                  break;
                }
              }

              baseLuma = gray[y * analyzeWidth + analyzeWidth - 1];
              for (let x = analyzeWidth - 5; x > analyzeWidth * 0.55; x--) {
                const idx = y * analyzeWidth + x;
                const luma = gray[idx];
                const grad = Math.abs(luma - gray[idx + 1]) + Math.abs(luma - gray[idx - 1]);
                const diffFromStart = Math.abs(luma - baseLuma);
                if (grad > 14 || diffFromStart > 20) {
                  rightPeakIdx.push(x);
                  break;
                }
              }
            }

            for (let col = 1; col <= scanCols; col++) {
              const x = Math.round((analyzeWidth * col) / (scanCols + 1));
              let baseLuma = gray[x];
              for (let y = 4; y < analyzeHeight * 0.45; y++) {
                const idx = y * analyzeWidth + x;
                const luma = gray[idx];
                const grad = Math.abs(gray[idx] - gray[(y - 1) * analyzeWidth + x]) + Math.abs(gray[idx] - gray[(y + 1) * analyzeWidth + x]);
                const diffFromStart = Math.abs(luma - baseLuma);
                if (grad > 14 || diffFromStart > 20) {
                  topPeakIdx.push(y);
                  break;
                }
              }

              baseLuma = gray[(analyzeHeight - 1) * analyzeWidth + x];
              for (let y = analyzeHeight - 5; y > analyzeHeight * 0.55; y--) {
                const idx = y * analyzeWidth + x;
                const luma = gray[idx];
                const grad = Math.abs(gray[idx] - gray[(y + 1) * analyzeWidth + x]) + Math.abs(gray[idx] - gray[(y - 1) * analyzeWidth + x]);
                const diffFromStart = Math.abs(luma - baseLuma);
                if (grad > 14 || diffFromStart > 20) {
                  bottomPeakIdx.push(y);
                  break;
                }
              }
            }

            const getMedian = (arr: number[], fallbackVal: number) => {
              if (arr.length === 0) return fallbackVal;
              const sorted = [...arr].sort((a, b) => a - b);
              return sorted[Math.floor(sorted.length / 2)];
            };

            const lEdge = getMedian(leftPeakIdx, Math.round(analyzeWidth * 0.05));
            const rEdge = getMedian(rightPeakIdx, Math.round(analyzeWidth * 0.95));
            const tEdge = getMedian(topPeakIdx, Math.round(analyzeHeight * 0.05));
            const bEdge = getMedian(bottomPeakIdx, Math.round(analyzeHeight * 0.95));

            const scaleX = img.naturalWidth / analyzeWidth;
            const scaleY = img.naturalHeight / analyzeHeight;

            let nativeX = lEdge * scaleX;
            let nativeY = tEdge * scaleY;
            let nativeW = (rEdge - lEdge) * scaleX;
            let nativeH = (bEdge - tEdge) * scaleY;

            // Apply requested safety margins: +2% Left/Right, +3% Top/Bottom
            const padL = Math.round(img.naturalWidth * 0.02);
            const padR = Math.round(img.naturalWidth * 0.02);
            const padT = Math.round(img.naturalHeight * 0.03);
            const padB = Math.round(img.naturalHeight * 0.03);

            let cX = Math.max(0, nativeX - padL);
            let cY = Math.max(0, nativeY - padT);
            let cW = nativeW + padL + padR;
            let cH = nativeH + padT + padB;

            cW = Math.min(img.naturalWidth - cX, cW);
            cH = Math.min(img.naturalHeight - cY, cH);

            const centX = cX + cW / 2;
            const centY = cY + cH / 2;

            const fallbackRatio = cW / cH;
            let isFailedDetection = false;
            if (fallbackRatio < 1.15 || fallbackRatio > 1.95) {
              isFailedDetection = true;
            }

            const imgCenterX = img.naturalWidth / 2;
            const imgCenterY = img.naturalHeight / 2;
            if (Math.abs(centX - imgCenterX) / img.naturalWidth > 0.32 || Math.abs(centY - imgCenterY) / img.naturalHeight > 0.32) {
              isFailedDetection = true;
            }

            if (isFailedDetection) {
              let idealW = img.naturalWidth * 0.88;
              let idealH = idealW / targetRatio;
              if (idealH > img.naturalHeight * 0.88) {
                idealH = img.naturalHeight * 0.88;
                idealW = idealH * targetRatio;
              }
              cX = Math.round((img.naturalWidth - idealW) / 2);
              cY = Math.round((img.naturalHeight - idealH) / 2);
              cW = Math.round(idealW);
              cH = Math.round(idealH);
              detectionFailed = true;
            } else {
              if (cW / cH > targetRatio) {
                const newH = cW / targetRatio;
                if (centY + newH / 2 <= img.naturalHeight && centY - newH / 2 >= 0) {
                  cY = Math.round(centY - newH / 2);
                  cH = Math.round(newH);
                } else {
                  cH = Math.round(Math.min(img.naturalHeight, newH));
                  cY = Math.round((img.naturalHeight - cH) / 2);
                  cW = Math.round(cH * targetRatio);
                  cX = Math.round(Math.max(0, Math.min(img.naturalWidth - cW, centX - cW / 2)));
                }
              } else {
                const newW = cH * targetRatio;
                if (centX + newW / 2 <= img.naturalWidth && centX - newW / 2 >= 0) {
                  cX = Math.round(centX - newW / 2);
                  cW = Math.round(newW);
                } else {
                  cW = Math.round(Math.min(img.naturalWidth, newW));
                  cX = Math.round((img.naturalWidth - cW) / 2);
                  cH = Math.round(cW / targetRatio);
                  cY = Math.round(Math.max(0, Math.min(img.naturalHeight - cH, centY - cH / 2)));
                }
              }
            }

            finalCropX = Math.round(cX);
            finalCropY = Math.round(cY);
            finalCropW = Math.round(cW);
            finalCropH = Math.round(cH);
            cropDone = true;
          }
        }

        // Apply final rectangle crop slice and debug visualizations for fallbacks / bounding box strategies
        if (cropDone && !usedOpenCV) {
          const widthRatio = finalCropW / img.naturalWidth;
          const heightRatio = finalCropH / img.naturalHeight;
          const isNearlyIdentical = (widthRatio > 0.98 && heightRatio > 0.98);
          const isExactlyFullImage = (finalCropX === 0 && finalCropY === 0 && finalCropW === img.naturalWidth && finalCropH === img.naturalHeight);

          if (isNearlyIdentical || isExactlyFullImage || detectionFailed) {
            console.log("AUTO CROP: Center crop framing used for document");
            detectionFailed = true;
          } else {
            console.log("AUTO CROP SUCCESS: Document boundaries identified successfully.");
          }

          const debugCanvas = document.createElement('canvas');
          debugCanvas.width = img.naturalWidth;
          debugCanvas.height = img.naturalHeight;
          const debugCtx = debugCanvas.getContext('2d');
          if (debugCtx) {
            debugCtx.drawImage(img, 0, 0);

            debugCtx.strokeStyle = '#ef4444'; 
            const strokeWidth = Math.max(6, Math.round(Math.min(img.naturalWidth, img.naturalHeight) * 0.015));
            debugCtx.lineWidth = strokeWidth;
            debugCtx.strokeRect(finalCropX, finalCropY, finalCropW, finalCropH);

            debugCtx.fillStyle = 'rgba(0, 0, 0, 0.45)';
            debugCtx.fillRect(0, 0, img.naturalWidth, finalCropY);
            debugCtx.fillRect(0, finalCropY + finalCropH, img.naturalWidth, img.naturalHeight - (finalCropY + finalCropH));
            debugCtx.fillRect(0, finalCropY, finalCropX, finalCropH);
            debugCtx.fillRect(finalCropX + finalCropW, finalCropY, img.naturalWidth - (finalCropX + finalCropW), finalCropH);

            const labelHeight = Math.max(28, Math.round(img.naturalHeight * 0.04));
            const labelWidth = Math.max(160, Math.round(img.naturalWidth * 0.22));
            debugCtx.fillStyle = '#ef4444';
            debugCtx.fillRect(finalCropX, Math.max(0, finalCropY - labelHeight), labelWidth, labelHeight);
            
            debugCtx.font = `bold ${Math.round(labelHeight * 0.5)}px sans-serif`;
            debugCtx.fillStyle = '#ffffff';
            debugCtx.textAlign = 'center';
            debugCtx.textBaseline = 'middle';
            debugCtx.fillText("AUTO-CROP AREA", finalCropX + labelWidth / 2, Math.max(labelHeight / 2, finalCropY - labelHeight / 2));
          }
          debugDataUrl = debugCanvas.toDataURL('image/png');

          const cropCanvas = document.createElement('canvas');
          cropCanvas.width = finalCropW;
          cropCanvas.height = finalCropH;
          const cropCtx = cropCanvas.getContext('2d');
          if (cropCtx) {
            cropCtx.fillStyle = '#ffffff';
            cropCtx.fillRect(0, 0, finalCropW, finalCropH);
            cropCtx.drawImage(img, finalCropX, finalCropY, finalCropW, finalCropH, 0, 0, finalCropW, finalCropH);
            croppedDataUrl = cropCanvas.toDataURL('image/png');
          }
        }

        // Standardized Logging metrics according to user specification
        console.log("Original image width/height:", img.naturalWidth, img.naturalHeight);
        console.log("croppedCanvas.width:", finalCropW);
        console.log("croppedCanvas.height:", finalCropH);
        console.log("Original image width:", img.naturalWidth, "Cropped image width:", finalCropW);
        console.log("Original image height:", img.naturalHeight, "Cropped image height:", finalCropH);
        console.log("Detected crop rectangle values: x:", finalCropX, "y:", finalCropY, "width:", finalCropW, "height:", finalCropH);
        console.log("Exact file rendering the preview image: src/components/DocumentsSection.tsx");

        resolve({
          croppedDataUrl,
          debugDataUrl,
          originalWidth: img.naturalWidth,
          originalHeight: img.naturalHeight,
          cropWidth: finalCropW,
          cropHeight: finalCropH,
          cropX: finalCropX,
          cropY: finalCropY,
          failed: detectionFailed
        });
      };
      img.onerror = () => {
        console.warn("AUTO CROP: Image failed to load into canvas");
        resolve({
          croppedDataUrl: imageSrc,
          debugDataUrl: imageSrc,
          originalWidth: 0,
          originalHeight: 0,
          cropWidth: 0,
          cropHeight: 0,
          cropX: 0,
          cropY: 0,
          failed: true
        });
      };
      img.src = imageSrc;
    });
  };

  // Analyze a document image canvas and return a score indicating how likely it is right-side up (upright)
  // Higher score = UPRIGHT (horizontal text lines, emblem/header at top, face hair at top)
  const scoreUprightOrientation = (canvas: HTMLCanvasElement): number => {
    try {
      const w = canvas.width;
      const h = canvas.height;
      if (w <= 0 || h <= 0) return 0;

      // Analysis thumbnail
      const anW = 400;
      const anH = Math.max(10, Math.round(400 * (h / w)));
      const aCanvas = document.createElement('canvas');
      aCanvas.width = anW;
      aCanvas.height = anH;
      const aCtx = aCanvas.getContext('2d', { willReadFrequently: true });
      if (!aCtx) return 0;

      aCtx.drawImage(canvas, 0, 0, anW, anH);
      const imgData = aCtx.getImageData(0, 0, anW, anH);
      const data = imgData.data;

      // 1. Check Horizontal Text Line Density (Row projection variance vs Column projection variance)
      // Horizontal text lines produce alternating bands of text and whitespace along rows (high variance across rows)
      const rowDarkCounts: number[] = new Array(anH).fill(0);
      const colDarkCounts: number[] = new Array(anW).fill(0);
      let totalDark = 0;

      let topDarkPixels = 0;
      let bottomDarkPixels = 0;
      let topEdgeEnergy = 0;
      let bottomEdgeEnergy = 0;

      let skinPixels = 0;
      let minSkinX = anW, maxSkinX = 0, minSkinY = anH, maxSkinY = 0;

      const topBoundary = Math.round(anH * 0.35);
      const bottomBoundary = Math.round(anH * 0.65);

      for (let y = 1; y < anH - 1; y++) {
        const rowIdx = y * anW * 4;
        const isTop = y <= topBoundary;
        const isBottom = y >= bottomBoundary;

        for (let x = 1; x < anW - 1; x++) {
          const idx = rowIdx + x * 4;
          const r = data[idx];
          const g = data[idx + 1];
          const b = data[idx + 2];
          const lum = 0.299 * r + 0.587 * g + 0.114 * b;

          const isDark = lum < 125;
          if (isDark) {
            rowDarkCounts[y]++;
            colDarkCounts[x]++;
            totalDark++;
            if (isTop) topDarkPixels++;
            if (isBottom) bottomDarkPixels++;
          }

          // Vertical edge (crossing horizontal text line)
          const idxBelow = ((y + 1) * anW + x) * 4;
          const lumBelow = 0.299 * data[idxBelow] + 0.587 * data[idxBelow + 1] + 0.114 * data[idxBelow + 2];
          const vEdge = Math.abs(lum - lumBelow);

          if (isTop) topEdgeEnergy += vEdge;
          if (isBottom) bottomEdgeEnergy += vEdge;

          // Skin tone check for ID face detection (Aadhaar, PAN, DL, Voter ID front)
          if (r > 80 && g > 40 && b > 20 && r > g && g > b && (r - g) > 12 && (r - g) < 110) {
            skinPixels++;
            if (x < minSkinX) minSkinX = x;
            if (x > maxSkinX) maxSkinX = x;
            if (y < minSkinY) minSkinY = y;
            if (y > maxSkinY) maxSkinY = y;
          }
        }
      }

      // Horizontal text lines yield higher row variance compared to column variance
      const avgRowDark = totalDark / Math.max(1, anH);
      let rowVar = 0;
      for (let y = 0; y < anH; y++) {
        rowVar += Math.pow(rowDarkCounts[y] - avgRowDark, 2);
      }
      rowVar = rowVar / Math.max(1, anH);

      const avgColDark = totalDark / Math.max(1, anW);
      let colVar = 0;
      for (let x = 0; x < anW; x++) {
        colVar += Math.pow(colDarkCounts[x] - avgColDark, 2);
      }
      colVar = colVar / Math.max(1, anW);

      // Text horizontal orientation factor (bonus if text runs horizontally)
      const textOrientationScore = (rowVar - colVar) * 2;

      // Aspect ratio factor: ID cards are landscape (width > height).
      const aspectScore = (w > h) ? 4000 : -4000;

      // Header on top factor (Top dark & edge vs Bottom dark & edge)
      // Indian IDs always have header banner / emblem / title on top
      const headerScore = (topEdgeEnergy * 1.5 + topDarkPixels * 12) - (bottomEdgeEnergy * 1.5 + bottomDarkPixels * 12);

      let totalScore = headerScore + textOrientationScore + aspectScore;

      // Face analysis: if face is detected
      if (skinPixels > 200 && maxSkinY > minSkinY + 20 && maxSkinX > minSkinX + 20) {
        const boxH = maxSkinY - minSkinY;
        let hairLum = 0, hairCount = 0;
        let neckLum = 0, neckCount = 0;

        const hairYEnd = minSkinY + Math.round(boxH * 0.25);
        const neckYStart = maxSkinY - Math.round(boxH * 0.25);

        for (let fy = minSkinY; fy <= maxSkinY; fy++) {
          for (let fx = minSkinX; fx <= maxSkinX; fx++) {
            const fidx = (fy * anW + fx) * 4;
            const flum = 0.299 * data[fidx] + 0.587 * data[fidx + 1] + 0.114 * data[fidx + 2];
            if (fy <= hairYEnd) {
              hairLum += flum;
              hairCount++;
            } else if (fy >= neckYStart) {
              neckLum += flum;
              neckCount++;
            }
          }
        }

        const avgHairLum = hairCount > 0 ? hairLum / hairCount : 128;
        const avgNeckLum = neckCount > 0 ? neckLum / neckCount : 128;

        // In upright face, hair on top is darker than neck on bottom
        if (avgHairLum < avgNeckLum - 5) {
          totalScore += 25000; // Face is definitely upright!
        } else if (avgNeckLum < avgHairLum - 5) {
          totalScore -= 25000; // Face is upside down!
        }
      }

      return totalScore;
    } catch {
      return 0;
    }
  };

  // Helper to rotate an image DataURL smoothly by any degree
  const rotateImageDataUrl = (src: string, angleDeg: number): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const rad = (angleDeg * Math.PI) / 180;
        const cos = Math.abs(Math.cos(rad));
        const sin = Math.abs(Math.sin(rad));
        const newW = Math.round(img.naturalWidth * cos + img.naturalHeight * sin);
        const newH = Math.round(img.naturalWidth * sin + img.naturalHeight * cos);

        const c = document.createElement('canvas');
        c.width = Math.max(1, newW);
        c.height = Math.max(1, newH);
        const ctx = c.getContext('2d');
        if (!ctx) {
          resolve(src);
          return;
        }
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, newW, newH);
        ctx.translate(newW / 2, newH / 2);
        ctx.rotate(rad);
        ctx.drawImage(img, -img.naturalWidth / 2, -img.naturalHeight / 2);
        resolve(c.toDataURL('image/png'));
      };
      img.onerror = () => resolve(src);
      img.src = src;
    });
  };

  // Automatically straighten and orient any uploaded document photo
  // Evaluates ALL FOUR canonical orientations (0°, 90°, 180°, 270°) to ensure the document is right-side up
  const autoStraightenDocumentImage = (rawSrc: string): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = async () => {
        try {
          // Candidate orthogonal angles: 0° (as uploaded), 90° (cw), 180° (flipped), 270° / -90° (ccw)
          const candidateAngles = [0, 90, 180, 270];

          const renderRotated = (angleDeg: number): HTMLCanvasElement => {
            const rad = (angleDeg * Math.PI) / 180;
            const cos = Math.abs(Math.cos(rad));
            const sin = Math.abs(Math.sin(rad));
            const newW = Math.round(img.naturalWidth * cos + img.naturalHeight * sin);
            const newH = Math.round(img.naturalWidth * sin + img.naturalHeight * cos);

            const c = document.createElement('canvas');
            c.width = Math.max(1, newW);
            c.height = Math.max(1, newH);
            const ctx = c.getContext('2d');
            if (ctx) {
              ctx.imageSmoothingEnabled = true;
              ctx.imageSmoothingQuality = 'high';
              ctx.fillStyle = '#ffffff';
              ctx.fillRect(0, 0, newW, newH);
              ctx.translate(newW / 2, newH / 2);
              ctx.rotate(rad);
              ctx.drawImage(img, -img.naturalWidth / 2, -img.naturalHeight / 2);
            }
            return c;
          };

          const candidates = candidateAngles.map((angle) => {
            const canvas = renderRotated(angle);
            let score = scoreUprightOrientation(canvas);
            // Conservative bias for 0° so an already straight/upright photo is NOT rotated
            if (angle === 0) {
              score += 4000;
            }
            return { angle, canvas, score };
          });

          // Sort descending by upright score
          candidates.sort((a, b) => b.score - a.score);
          const best = candidates[0];

          console.log(
            `[AUTO-ORIENT] Evaluated:`,
            candidates.map((c) => `${c.angle}°: ${Math.round(c.score)}`).join(', '),
            `=> Chosen: ${best.angle}°`
          );

          if (best.angle === 0) {
            resolve(rawSrc);
          } else {
            resolve(best.canvas.toDataURL('image/png'));
          }
        } catch {
          resolve(rawSrc);
        }
      };
      img.onerror = () => resolve(rawSrc);
      img.src = rawSrc;
    });
  };

  // Step 10: preview refreshed logger
  useEffect(() => {
    if (frontImage || backImage) {
      console.log("STEP 10: Preview refreshed");
    }
  }, [frontImage, backImage]);

  // Handle uploading front / back side (Manual File Selection)
  const handleFileUpload = async (side: 'front' | 'back', file: File): Promise<void> => {
    console.log("STEP 1: File Selected");
    await setupSideImage(side, file);
  };

  // Handle dragging & dropping front / back side
  const handleDrop = async (side: 'front' | 'back', file: File): Promise<void> => {
    console.log("STEP 2: Drag and drop received");
    await setupSideImage(side, file);
  };

  const setupSideImage = async (side: 'front' | 'back', file: File): Promise<void> => {
    setDetectionFailed(false);
    setDetectionFailedSide(null);
    if (side === 'front') {
      setIsDetectingFront(true);
    } else {
      setIsDetectingBack(true);
    }

    return new Promise((resolveResolve) => {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const rawDataUrl = event.target?.result as string;
        let dataUrl = rawDataUrl;
        try {
          // Automatically straighten and orient any uploaded document photo (portrait, sideways, or upside-down)
          // to a perfect horizontal upright card layout (like Image 3 standard photocopy) without any manual intervention!
          dataUrl = await autoStraightenDocumentImage(rawDataUrl);

          // Run AI-inspired card boundary automatic detection and crop on the horizontal upright image!
          const analysis = await detectDocumentAndCrop(dataUrl, selectedDocPreset.aspectRatio);
          
          let boxX = 5;
          let boxY = 5;
          let boxW = 90;
          let boxH = 90;
          if (analysis.originalWidth > 0 && analysis.originalHeight > 0 && analysis.cropWidth > 0 && analysis.cropHeight > 0) {
            boxX = Math.max(0, Math.min(95, (analysis.cropX / analysis.originalWidth) * 100));
            boxY = Math.max(0, Math.min(95, (analysis.cropY / analysis.originalHeight) * 100));
            boxW = Math.max(5, Math.min(100 - boxX, (analysis.cropWidth / analysis.originalWidth) * 100));
            boxH = Math.max(5, Math.min(100 - boxY, (analysis.cropHeight / analysis.originalHeight) * 100));
          }
          
          setCropBox({ x: boxX, y: boxY, w: boxW, h: boxH });
          setDetectionFailed(false);

          const initialAspect = (analysis.cropWidth > 0 && analysis.cropHeight > 0)
            ? (analysis.cropWidth / analysis.cropHeight)
            : selectedDocPreset.aspectRatio;

          const croppedUrl = analysis.croppedDataUrl || dataUrl;

          if (side === 'front') {
            setFrontOriginal(dataUrl);
            setFrontImage(croppedUrl);
            setFrontAspect(initialAspect);
            setFrontZoom(1.0);
            setFrontPanX(0);
            setFrontPanY(0);
            setFrontRot(0);
            setFrontBright(100);
            setFrontContrast(100);
            setActiveSide('front');
            await renderAllDocumentCanvases(croppedUrl, backImage, initialAspect, backAspect);
          } else {
            setBackOriginal(dataUrl);
            setBackImage(croppedUrl);
            setBackAspect(initialAspect);
            setBackZoom(1.0);
            setBackPanX(0);
            setBackPanY(0);
            setBackRot(0);
            setBackBright(100);
            setBackContrast(100);
            setActiveSide('back');
            await renderAllDocumentCanvases(frontImage, croppedUrl, frontAspect, initialAspect);
          }
          setPreviewTab('individual');

          setIsDetectingFront(false);
          setIsDetectingBack(false);
          resolveResolve();
        } catch (err) {
          console.warn("AUTO CROP: Error during detection, applying safe manual fallback", err);
          setDetectionFailed(false);
          if (side === 'front') {
            setFrontImage(dataUrl);
            setFrontOriginal(dataUrl);
            setFrontAspect(selectedDocPreset.aspectRatio);
            setFrontZoom(1.0);
            setFrontPanX(0);
            setFrontPanY(0);
            setFrontRot(0);
            setFrontBright(100);
            setFrontContrast(100);
            setActiveSide('front');
            await renderAllDocumentCanvases(dataUrl, backImage, selectedDocPreset.aspectRatio, backAspect);
          } else {
            setBackImage(dataUrl);
            setBackOriginal(dataUrl);
            setBackAspect(selectedDocPreset.aspectRatio);
            setBackZoom(1.0);
            setBackPanX(0);
            setBackPanY(0);
            setBackRot(0);
            setBackBright(100);
            setBackContrast(100);
            setActiveSide('back');
            await renderAllDocumentCanvases(frontImage, dataUrl, frontAspect, selectedDocPreset.aspectRatio);
          }
          setCropBox({ x: 5, y: 5, w: 90, h: 90 });

          setIsDetectingFront(false);
          setIsDetectingBack(false);
          resolveResolve();
        }
      };
      reader.onerror = () => {
        console.warn("AUTO CROP: FileReader error reading document file");
        setIsDetectingFront(false);
        setIsDetectingBack(false);
        alert(language === 'hi' ? 'फ़ाइल पढ़ने में समस्या हुई। कृपया पुनः प्रयास करें।' : 'Error reading image file. Please try again.');
        resolveResolve();
      };
      reader.readAsDataURL(file);
    });
  };

  const handleRemoveImage = (side: 'front' | 'back') => {
    if (side === 'front') {
      setFrontImage(null);
      setFrontOriginal(null);
      setFrontRot(0);
      setFrontZoom(1.0);
      setFrontPanX(0);
      setFrontPanY(0);
    } else {
      setBackImage(null);
      setBackOriginal(null);
      setBackRot(0);
      setBackZoom(1.0);
      setBackPanX(0);
      setBackPanY(0);
    }
  };

  // Drag Panning and rotating handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (previewTab === 'assembly') return;
    const hasImage = activeSide === 'front' ? frontImage : backImage;
    if (!hasImage) return;

    isDraggingRef.current = true;
    const panX = activeSide === 'front' ? frontPanX : backPanX;
    const panY = activeSide === 'front' ? frontPanY : backPanY;
    dragStartRef.current = { x: e.clientX - panX, y: e.clientY - panY };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingRef.current) return;
    const px = e.clientX - dragStartRef.current.x;
    const py = e.clientY - dragStartRef.current.y;

    if (activeSide === 'front') {
      setFrontPanX(px);
      setFrontPanY(py);
    } else {
      setBackPanX(px);
      setBackPanY(py);
    }
  };

  const handleMouseUpOrLeave = () => {
    isDraggingRef.current = false;
  };

  // Helper to initialize cropping box centered in the displayed image dimensions
  const initCropBox = (imgW: number, imgH: number, targetRatio: number) => {
    const containerRatio = imgW / imgH;
    let w = 80; // Default starts drawing at 80% container width
    let h = (w / targetRatio) * containerRatio;
    if (h > 80) {
      h = 80;
      w = (h * targetRatio) / containerRatio;
    }
    const x = (100 - w) / 2;
    const y = (100 - h) / 2;
    return { x, y, w, h };
  };

  const startBoxDrag = (action: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragAction(action);
    setDragStart({
      x: e.clientX,
      y: e.clientY,
      box: { ...cropBox }
    });
  };

  const startBoxDragTouch = (action: string, e: React.TouchEvent) => {
    if (e.touches && e.touches[0]) {
      e.stopPropagation();
      setDragAction(action);
      setDragStart({
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
        box: { ...cropBox }
      });
    }
  };

  const updateCropWithDelta = (deltaX: number, deltaY: number, containerWidth: number, containerHeight: number) => {
    const pctDeltaX = (deltaX / containerWidth) * 100;
    const pctDeltaY = (deltaY / containerHeight) * 100;

    const start = dragStart.box;
    const minSize = 4; // minimum 4% size for crop box

    if (dragAction === 'move') {
      let newX = start.x + pctDeltaX;
      let newY = start.y + pctDeltaY;

      if (newX < 0) newX = 0;
      if (newY < 0) newY = 0;
      if (newX + start.w > 100) newX = 100 - start.w;
      if (newY + start.h > 100) newY = 100 - start.h;

      setCropBox({ ...start, x: newX, y: newY });
    } else if (dragAction === 'resize-e') {
      // Drag Right Edge
      let newW = start.w + pctDeltaX;
      if (start.x + newW > 100) newW = 100 - start.x;
      if (newW < minSize) newW = minSize;
      setCropBox({ ...start, w: newW });
    } else if (dragAction === 'resize-w') {
      // Drag Left Edge
      let newX = start.x + pctDeltaX;
      if (newX < 0) newX = 0;
      if (newX > start.x + start.w - minSize) newX = start.x + start.w - minSize;
      let newW = (start.x + start.w) - newX;
      setCropBox({ ...start, x: newX, w: newW });
    } else if (dragAction === 'resize-s') {
      // Drag Bottom Edge (Down)
      let newH = start.h + pctDeltaY;
      if (start.y + newH > 100) newH = 100 - start.y;
      if (newH < minSize) newH = minSize;
      setCropBox({ ...start, h: newH });
    } else if (dragAction === 'resize-n') {
      // Drag Top Edge (Up)
      let newY = start.y + pctDeltaY;
      if (newY < 0) newY = 0;
      if (newY > start.y + start.h - minSize) newY = start.y + start.h - minSize;
      let newH = (start.y + start.h) - newY;
      setCropBox({ ...start, y: newY, h: newH });
    } else if (dragAction === 'resize-se') {
      // Bottom-Right Corner
      let newW = start.w + pctDeltaX;
      let newH = start.h + pctDeltaY;
      if (start.x + newW > 100) newW = 100 - start.x;
      if (start.y + newH > 100) newH = 100 - start.y;
      if (newW < minSize) newW = minSize;
      if (newH < minSize) newH = minSize;
      setCropBox({ ...start, w: newW, h: newH });
    } else if (dragAction === 'resize-sw') {
      // Bottom-Left Corner
      let newX = start.x + pctDeltaX;
      let newH = start.h + pctDeltaY;
      if (newX < 0) newX = 0;
      if (newX > start.x + start.w - minSize) newX = start.x + start.w - minSize;
      let newW = (start.x + start.w) - newX;
      if (start.y + newH > 100) newH = 100 - start.y;
      if (newH < minSize) newH = minSize;
      setCropBox({ x: newX, y: start.y, w: newW, h: newH });
    } else if (dragAction === 'resize-ne') {
      // Top-Right Corner
      let newW = start.w + pctDeltaX;
      let newY = start.y + pctDeltaY;
      if (start.x + newW > 100) newW = 100 - start.x;
      if (newW < minSize) newW = minSize;
      if (newY < 0) newY = 0;
      if (newY > start.y + start.h - minSize) newY = start.y + start.h - minSize;
      let newH = (start.y + start.h) - newY;
      setCropBox({ x: start.x, y: newY, w: newW, h: newH });
    } else if (dragAction === 'resize-nw') {
      // Top-Left Corner
      let newX = start.x + pctDeltaX;
      let newY = start.y + pctDeltaY;
      if (newX < 0) newX = 0;
      if (newX > start.x + start.w - minSize) newX = start.x + start.w - minSize;
      let newW = (start.x + start.w) - newX;
      if (newY < 0) newY = 0;
      if (newY > start.y + start.h - minSize) newY = start.y + start.h - minSize;
      let newH = (start.y + start.h) - newY;
      setCropBox({ x: newX, y: newY, w: newW, h: newH });
    }
  };

  const handleBoxDragMove = (e: React.MouseEvent) => {
    if (!dragAction || !displayContainerRef.current) return;
    e.preventDefault();
    const container = displayContainerRef.current.getBoundingClientRect();
    updateCropWithDelta(e.clientX - dragStart.x, e.clientY - dragStart.y, container.width, container.height);
  };

  const handleBoxDragMoveTouch = (e: React.TouchEvent) => {
    if (e.cancelable) e.preventDefault();
    if (!dragAction || !displayContainerRef.current || !e.touches || !e.touches[0]) return;
    const container = displayContainerRef.current.getBoundingClientRect();
    updateCropWithDelta(e.touches[0].clientX - dragStart.x, e.touches[0].clientY - dragStart.y, container.width, container.height);
  };

  const handleBoxDragEnd = () => {
    setDragAction(null);
  };

  // Re-draw crop modal canvas whenever modal is open, rotation changes, or image changes
  useEffect(() => {
    if (!cropModalOpen) return;
    const canvas = cropCanvasRef.current;
    const origSrc = cropModalSide === 'front' ? frontOriginal : backOriginal;
    if (!canvas || !origSrc) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.onload = () => {
      const rad = (modalRotation * Math.PI) / 180;
      const cos = Math.abs(Math.cos(rad));
      const sin = Math.abs(Math.sin(rad));
      const baseW = Math.round(img.naturalWidth * cos + img.naturalHeight * sin);
      const baseH = Math.round(img.naturalWidth * sin + img.naturalHeight * cos);
      const rotW = Math.max(10, baseW);
      const rotH = Math.max(10, baseH);

      canvas.width = rotW;
      canvas.height = rotH;

      ctx.clearRect(0, 0, rotW, rotH);
      ctx.save();
      ctx.translate(rotW / 2, rotH / 2);
      ctx.rotate(rad);
      ctx.drawImage(img, -img.naturalWidth / 2, -img.naturalHeight / 2);
      ctx.restore();
    };
    img.src = origSrc;
  }, [cropModalOpen, cropModalSide, frontOriginal, backOriginal, modalRotation]);

  // Rotates modal image smoothly
  const rotateModalBy = (deg: number) => {
    if (deg === 0) {
      setModalRotation(0);
      return;
    }
    setModalRotation((prev) => {
      let next = prev + deg;
      while (next > 180) next -= 360;
      while (next < -180) next += 360;
      return next;
    });
  };

  // Re-run document edge detection inside the crop modal
  const reDetectInModal = async () => {
    const origSrc = cropModalSide === 'front' ? frontOriginal : backOriginal;
    if (!origSrc) return;
    try {
      const analysis = await detectDocumentAndCrop(origSrc, selectedDocPreset.aspectRatio);
      if (analysis.originalWidth > 0 && analysis.originalHeight > 0) {
        const boxX = Math.max(0, Math.min(95, (analysis.cropX / analysis.originalWidth) * 100));
        const boxY = Math.max(0, Math.min(95, (analysis.cropY / analysis.originalHeight) * 100));
        const boxW = Math.max(5, Math.min(100 - boxX, (analysis.cropWidth / analysis.originalWidth) * 100));
        const boxH = Math.max(5, Math.min(100 - boxY, (analysis.cropHeight / analysis.originalHeight) * 100));
        setCropBox({ x: boxX, y: boxY, w: boxW, h: boxH });
      }
    } catch (e) {
      console.warn("Re-detection failed", e);
    }
  };

  // Unified Document Canvas Rendering Engine: synchronously renders front, back, and assembly sheets
  const renderAllDocumentCanvases = async (
    overrideFront?: string | null,
    overrideBack?: string | null,
    overrideFrontAspect?: number,
    overrideBackAspect?: number
  ) => {
    const curFront = overrideFront !== undefined ? overrideFront : frontImage;
    const curBack = overrideBack !== undefined ? overrideBack : backImage;
    const curFrontAspect = overrideFrontAspect !== undefined ? overrideFrontAspect : frontAspect;
    const curBackAspect = overrideBackAspect !== undefined ? overrideBackAspect : backAspect;

    const loadImg = (src: string | null): Promise<HTMLImageElement | null> => {
      if (!src) return Promise.resolve(null);
      return new Promise((resolve) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => resolve(img);
        img.onerror = () => resolve(null);
        img.src = src;
      });
    };

    const [frontImgEl, backImgEl] = await Promise.all([loadImg(curFront), loadImg(curBack)]);

    // 1. Render Front Canvas - Always standard horizontal card (856x540)
    const fCanvas = frontCanvasRef.current;
    if (fCanvas) {
      const fCtx = fCanvas.getContext('2d');
      if (fCtx) {
        const baseW = 856;
        const baseH = 540;
        fCanvas.width = baseW;
        fCanvas.height = baseH;

        fCtx.clearRect(0, 0, baseW, baseH);
        fCtx.fillStyle = '#ffffff';
        fCtx.fillRect(0, 0, baseW, baseH);

        if (frontImgEl) {
          fCtx.save();
          fCtx.translate(baseW / 2 + frontPanX, baseH / 2 + frontPanY);
          fCtx.rotate((frontRot * Math.PI) / 180);

          let drawW = baseW * frontZoom;
          let drawH = baseH * frontZoom;

          fCtx.filter = `brightness(${frontBright}%) contrast(${frontContrast}%)`;
          fCtx.drawImage(frontImgEl, -drawW / 2, -drawH / 2, drawW, drawH);
          fCtx.restore();

          if (borderWidth > 0) {
            fCtx.strokeStyle = borderColor;
            const ratio = baseW / selectedDocPreset.widthMm;
            const strokePx = borderWidth * ratio;
            fCtx.lineWidth = strokePx;
            fCtx.strokeRect(strokePx / 2, strokePx / 2, baseW - strokePx, baseH - strokePx);
          }
        }
      }
    }

    // 2. Render Back Canvas - Always standard horizontal card (856x540)
    const bCanvas = backCanvasRef.current;
    if (bCanvas) {
      const bCtx = bCanvas.getContext('2d');
      if (bCtx) {
        const baseW = 856;
        const baseH = 540;
        bCanvas.width = baseW;
        bCanvas.height = baseH;

        bCtx.clearRect(0, 0, baseW, baseH);
        bCtx.fillStyle = '#ffffff';
        bCtx.fillRect(0, 0, baseW, baseH);

        if (backImgEl) {
          bCtx.save();
          bCtx.translate(baseW / 2 + backPanX, baseH / 2 + backPanY);
          bCtx.rotate((backRot * Math.PI) / 180);

          let drawW = baseW * backZoom;
          let drawH = baseH * backZoom;

          bCtx.filter = `brightness(${backBright}%) contrast(${backContrast}%)`;
          bCtx.drawImage(backImgEl, -drawW / 2, -drawH / 2, drawW, drawH);
          bCtx.restore();

          if (borderWidth > 0) {
            bCtx.strokeStyle = borderColor;
            const ratio = baseW / selectedDocPreset.widthMm;
            const strokePx = borderWidth * ratio;
            bCtx.lineWidth = strokePx;
            bCtx.strokeRect(strokePx / 2, strokePx / 2, baseW - strokePx, baseH - strokePx);
          }
        }
      }
    }

    // 3. Render Final Print Assembly Sheet
    const aCanvas = assemblyCanvasRef.current;
    if (aCanvas) {
      const aCtx = aCanvas.getContext('2d');
      if (aCtx) {
        const pageWidthMm = docPrintOrientation === 'portrait' ? 210 : 297;
        const pageHeightMm = docPrintOrientation === 'portrait' ? 297 : 210;
        const dpm = 300 / 25.4; // 11.81 pixels per mm

        const widthPx = Math.round(pageWidthMm * dpm);
        const heightPx = Math.round(pageHeightMm * dpm);

        aCanvas.width = widthPx;
        aCanvas.height = heightPx;

        // Clean white paper background without grid artifacts
        aCtx.fillStyle = '#ffffff';
        aCtx.fillRect(0, 0, widthPx, heightPx);

        // Calculate card dimensions on A4 sheet - ALWAYS standard horizontal photocopy card (85.6mm x 54mm)
        const itemWPx = Math.round(selectedDocPreset.widthMm * dpm);
        const itemHPx = Math.round(selectedDocPreset.heightMm * dpm);

        const drawItem = (source: HTMLCanvasElement | null, px: number, py: number, label: 'Front' | 'Back') => {
          const hasImg = label === 'Front' ? !!curFront : !!curBack;
          if (source && hasImg) {
            // Guarantee horizontal orientation: if source canvas is somehow vertical, draw rotated 90°
            if (source.width < source.height) {
              aCtx.save();
              aCtx.translate(px + itemWPx / 2, py + itemHPx / 2);
              aCtx.rotate((90 * Math.PI) / 180);
              aCtx.drawImage(source, -itemHPx / 2, -itemWPx / 2, itemHPx, itemWPx);
              aCtx.restore();
            } else {
              aCtx.drawImage(source, px, py, itemWPx, itemHPx);
            }
          } else {
            aCtx.strokeStyle = '#94a3b8';
            aCtx.lineWidth = 3;
            aCtx.setLineDash([8, 8]);
            aCtx.strokeRect(px, py, itemWPx, itemHPx);
            aCtx.setLineDash([]);

            aCtx.fillStyle = '#f8fafc';
            aCtx.fillRect(px, py, itemWPx, itemHPx);

            aCtx.font = 'bold 36px sans-serif';
            aCtx.fillStyle = '#64748b';
            aCtx.textAlign = 'center';
            aCtx.textBaseline = 'middle';
            aCtx.fillText(`${label} Side Preview`, px + itemWPx / 2, py + itemHPx / 2);
          }
        };

        const duplicateCopiesCount = docPrintCopiesMode === 'single' ? 1 : docPrintCopiesCount;

        if (layoutStyle === 'side_by_side') {
          const totalWidth = (itemWPx * 2) + Math.round(4 * dpm);
          const startX = Math.round((widthPx - totalWidth) / 2);
          const rowGapPx = Math.round(12 * dpm);
          const totalRowsHeight = (duplicateCopiesCount * itemHPx) + ((duplicateCopiesCount - 1) * rowGapPx);
          const startY = Math.round((heightPx - totalRowsHeight) / 2);

          for (let i = 0; i < duplicateCopiesCount; i++) {
            const activeY = startY + (i * (itemHPx + rowGapPx));
            drawItem(fCanvas, startX, activeY, 'Front');
            drawItem(bCanvas, startX + itemWPx + Math.round(4 * dpm), activeY, 'Back');

            // Separation fold-guide
            aCtx.strokeStyle = '#cbd5e1';
            aCtx.lineWidth = 2;
            aCtx.beginPath();
            const fx = startX + itemWPx + Math.round(2 * dpm);
            aCtx.moveTo(fx, activeY - 10);
            aCtx.lineTo(fx, activeY + itemHPx + 10);
            aCtx.stroke();
          }
        } else if (layoutStyle === 'stacked') {
          const pairHeight = (itemHPx * 2) + Math.round(4 * dpm);
          const rowGapPx = Math.round(15 * dpm);
          const totalRowsHeight = (duplicateCopiesCount * pairHeight) + ((duplicateCopiesCount - 1) * rowGapPx);
          const startY = Math.round((heightPx - totalRowsHeight) / 2);
          const startX = Math.round((widthPx - itemWPx) / 2);

          for (let i = 0; i < duplicateCopiesCount; i++) {
            const activeY = startY + (i * (pairHeight + rowGapPx));
            drawItem(fCanvas, startX, activeY, 'Front');
            drawItem(bCanvas, startX, activeY + itemHPx + Math.round(4 * dpm), 'Back');

            // Fold guideline
            aCtx.strokeStyle = '#cbd5e1';
            aCtx.lineWidth = 2;
            aCtx.beginPath();
            const fy = activeY + itemHPx + Math.round(2 * dpm);
            aCtx.moveTo(startX - 20, fy);
            aCtx.lineTo(startX + itemWPx + 20, fy);
            aCtx.stroke();
          }
        } else if (layoutStyle === 'split') {
          const marginY = Math.round(42 * dpm);
          const pairHeight = (itemHPx * 2) + marginY;
          const rowGapPx = Math.round(10 * dpm);
          const totalRowsHeight = (duplicateCopiesCount * pairHeight) + ((duplicateCopiesCount - 1) * rowGapPx);
          const startY = Math.round((heightPx - totalRowsHeight) / 2);
          const startX = Math.round((widthPx - itemWPx) / 2);

          for (let i = 0; i < duplicateCopiesCount; i++) {
            const activeY = startY + (i * (pairHeight + rowGapPx));
            drawItem(fCanvas, startX, activeY, 'Front');
            drawItem(bCanvas, startX, activeY + itemHPx + marginY, 'Back');
          }
        }
      }
    }
  };

  // Extract crop rectangle from the rotated canvas in high resolution & update immediately
  const applyManualCrop = () => {
    const canvas = cropCanvasRef.current;
    if (!canvas) return;

    const clampedX = Math.max(0, Math.min(99, cropBox.x));
    const clampedY = Math.max(0, Math.min(99, cropBox.y));
    const clampedW = Math.max(1, Math.min(100 - clampedX, cropBox.w));
    const clampedH = Math.max(1, Math.min(100 - clampedY, cropBox.h));

    const rx = Math.round((clampedX / 100) * canvas.width);
    const ry = Math.round((clampedY / 100) * canvas.height);
    const rw = Math.max(1, Math.round((clampedW / 100) * canvas.width));
    const rh = Math.max(1, Math.round((clampedH / 100) * canvas.height));

    const outCanvas = document.createElement('canvas');
    if (rw < rh) {
      // The cropped selection is vertical (height > width), but ID documents (Aadhaar, PAN, DL)
      // must ALWAYS be horizontal landscape like standard photocopy (Image 3)!
      // Rotate 90 degrees clockwise so width becomes rh and height becomes rw!
      outCanvas.width = rh;
      outCanvas.height = rw;
      const ctx = outCanvas.getContext('2d');
      if (ctx) {
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, rh, rw);
        ctx.save();
        ctx.translate(rh / 2, rw / 2);
        ctx.rotate((90 * Math.PI) / 180);
        ctx.drawImage(canvas, rx, ry, rw, rh, -rw / 2, -rh / 2, rw, rh);
        ctx.restore();
      }
    } else {
      outCanvas.width = rw;
      outCanvas.height = rh;
      const ctx = outCanvas.getContext('2d');
      if (ctx) {
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, rw, rh);
        ctx.drawImage(canvas, rx, ry, rw, rh, 0, 0, rw, rh);
      }
    }

    const croppedDUrl = outCanvas.toDataURL('image/png');
    const newAspect = outCanvas.width / outCanvas.height;
    
    if (cropModalSide === 'front') {
      setFrontAspect(newAspect);
      setFrontImage(croppedDUrl);
      setFrontZoom(1.0);
      setFrontPanX(0);
      setFrontPanY(0);
      setFrontRot(0);
      // Instant synchronous render with latest front crop
      renderAllDocumentCanvases(croppedDUrl, backImage, newAspect, backAspect);
    } else {
      setBackAspect(newAspect);
      setBackImage(croppedDUrl);
      setBackZoom(1.0);
      setBackPanX(0);
      setBackPanY(0);
      setBackRot(0);
      // Instant synchronous render with latest back crop
      renderAllDocumentCanvases(frontImage, croppedDUrl, frontAspect, newAspect);
    }
    setCropModalOpen(false);
    setDetectionFailed(false);
  };

  // Reactive canvas rendering effect
  useEffect(() => {
    renderAllDocumentCanvases();
  }, [
    activeDocType,
    frontImage,
    backImage,
    frontAspect,
    backAspect,
    frontZoom,
    frontPanX,
    frontPanY,
    frontRot,
    frontBright,
    frontContrast,
    backZoom,
    backPanX,
    backPanY,
    backRot,
    backBright,
    backContrast,
    borderWidth,
    borderColor,
    layoutStyle,
    previewTab,
    docPrintPaperSize,
    docPrintOrientation,
    docPrintCopiesMode,
    docPrintCopiesCount
  ]);

  // Individual download as PNG
  const downloadSidePng = (side: 'front' | 'back') => {
    const canvas = side === 'front' ? frontCanvasRef.current : backCanvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `SnapID_${activeDocType}_${side}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  // Assembled Download layup as PNG
  const downloadAssemblyPng = () => {
    if (!frontImage && !backImage) {
      alert(language === 'hi'
        ? 'कृपया प्रिंट या डाउनलोड करने से पहले कम से कम एक दस्तावेज़ (फ्रंट या बैक) अपलोड करें!'
        : 'Please upload at least one document side (Front or Back) first!');
      return;
    }
    if (!assemblyCanvasRef.current) return;
    const link = document.createElement('a');
    link.download = `SnapID_${activeDocType}_layup_${layoutStyle}.png`;
    link.href = assemblyCanvasRef.current.toDataURL('image/png');
    link.click();
  };

  // Compile millimetric correct PDF direct on A4 at standard dimensions (85.6 mm x 54.0 mm)
  const downloadAssemblyPdf = () => {
    if (!frontImage && !backImage) {
      alert(language === 'hi'
        ? 'कृपया प्रिंट या डाउनलोड करने से पहले कम से कम एक दस्तावेज़ (फ्रंट या बैक) अपलोड करें!'
        : 'Please upload at least one document side (Front or Back) first!');
      return;
    }
    try {
      const doc = new jsPDF({
        orientation: docPrintOrientation,
        unit: 'mm',
        format: 'a4'
      });

      const widthMm = docPrintOrientation === 'portrait' ? 210 : 297;
      const heightMm = docPrintOrientation === 'portrait' ? 297 : 210;

      const cardW = selectedDocPreset.widthMm;
      const cardH = selectedDocPreset.heightMm;

      const frontCanvas = frontCanvasRef.current;
      const backCanvas = backCanvasRef.current;

      const frontData = frontCanvas && frontImage ? frontCanvas.toDataURL('image/png') : null;
      const backData = backCanvas && backImage ? backCanvas.toDataURL('image/png') : null;

      const halfW = widthMm / 2;
      const halfH = heightMm / 2;

      // Draw PDF outputs
      const drawPdfSide = (imgData: string | null, px: number, py: number, sideLabel: string) => {
        if (imgData) {
          doc.addImage(imgData, 'PNG', px, py, cardW, cardH);
        } else {
          // Draw standard dashed placeholder box
          doc.setDrawColor(180, 180, 180);
          doc.setLineWidth(0.3);
          doc.setLineDashPattern([2, 2], 0);
          doc.rect(px, py, cardW, cardH, 'S');
          doc.setLineDashPattern([], 0);
          
          doc.setFontSize(8);
          doc.setTextColor(120, 120, 120);
          doc.text(`[Missing ${sideLabel} image]`, px + (cardW / 2), py + (cardH / 2), { align: 'center' });
        }
      };

      const duplicateCopiesCount = docPrintCopiesMode === 'single' ? 1 : docPrintCopiesCount;

      if (layoutStyle === 'side_by_side') {
        const totalW = (cardW * 2) + 4; // 4mm separation
        const startX = (widthMm - totalW) / 2;
        const rowGapMm = 12;
        const totalRowsHeight = (duplicateCopiesCount * cardH) + ((duplicateCopiesCount - 1) * rowGapMm);
        const startY = (heightMm - totalRowsHeight) / 2;

        for (let i = 0; i < duplicateCopiesCount; i++) {
          const activeY = startY + (i * (cardH + rowGapMm));
          drawPdfSide(frontData, startX, activeY, 'Front');
          drawPdfSide(backData, startX + cardW + 4, activeY, 'Back');

          // Fine dotted line for fold
          doc.setDrawColor(200, 200, 200);
          doc.setLineWidth(0.15);
          doc.setLineDashPattern([1, 1], 0);
          doc.line(startX + cardW + 2, activeY - 5, startX + cardW + 2, activeY + cardH + 5);
        }

      } else if (layoutStyle === 'stacked') {
        const pairHeight = (cardH * 2) + 4;
        const rowGapMm = 15;
        const totalRowsHeight = (duplicateCopiesCount * pairHeight) + ((duplicateCopiesCount - 1) * rowGapMm);
        const startY = (heightMm - totalRowsHeight) / 2;
        const startX = halfW - (cardW / 2);

        for (let i = 0; i < duplicateCopiesCount; i++) {
          const activeY = startY + (i * (pairHeight + rowGapMm));
          drawPdfSide(frontData, startX, activeY, 'Front');
          drawPdfSide(backData, startX, activeY + cardH + 4, 'Back');

          // Fold line
          doc.setDrawColor(200, 200, 200);
          doc.setLineWidth(0.15);
          doc.setLineDashPattern([1, 1], 0);
          doc.line(startX - 5, activeY + cardH + 2, startX + cardW + 5, activeY + cardH + 2);
        }

      } else if (layoutStyle === 'split') {
        const pairHeight = (cardH * 2) + 42;
        const rowGapMm = 10;
        const totalRowsHeight = (duplicateCopiesCount * pairHeight) + ((duplicateCopiesCount - 1) * rowGapMm);
        const startY = (heightMm - totalRowsHeight) / 2;
        const startX = halfW - (cardW / 2);

        for (let i = 0; i < duplicateCopiesCount; i++) {
          const activeY = startY + (i * (pairHeight + rowGapMm));
          const marginY = 42;
          drawPdfSide(frontData, startX, activeY, 'Front');
          drawPdfSide(backData, startX, activeY + cardH + marginY, 'Back');
        }
      }

      doc.save(`SnapID_${activeDocType}_layup_A4.pdf`);
    } catch (e) {
      console.error(e);
      alert('Error creating document PDF. Please try printing via PNG download.');
    }
  };

  // eMitra / Cyber Cafe Instant direct print system on standard A4 layout via 300 DPI PDF hidden iframe
  const handleDirectPrintDoc = async () => {
    if (!frontImage && !backImage) {
      alert(language === 'hi'
        ? 'कृपया प्रिंट या डाउनलोड करने से पहले कम से कम एक दस्तावेज़ (फ्रंट या बैक) अपलोड करें!'
        : 'Please upload at least one document side (Front or Back) first!');
      return;
    }
    // Guarantee latest cropped rendering is complete on assembly canvas
    await renderAllDocumentCanvases();
    const canvas = assemblyCanvasRef.current;
    if (!canvas) {
      alert(language === 'hi'
        ? 'प्रिंट एरर: लेआउट कैनवास उपलब्ध नहीं है।'
        : 'Print Error: Layout canvas is not available.');
      return;
    }

    try {
      setIsPrintingDoc(true);
      await printCanvasAsA4Pdf(canvas, docPrintOrientation);
    } catch (err) {
      console.error('[Document PDF Print Error]:', err);
      alert(language === 'hi'
        ? 'प्रिंट तैयार करने में त्रुटि हुई। कृपया PDF या PNG डाउनलोड करके प्रिंट करें।'
        : 'Error preparing document print. Please try downloading as PDF or PNG to print.');
    } finally {
      setIsPrintingDoc(false);
    }
  };

  // Instant Ctrl+P / Cmd+P Keyboard Interceptor for Documents
  useEffect(() => {
    const handleKeyDown = async (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === 'p' || e.key === 'P')) {
        if ((frontImage || backImage) && assemblyCanvasRef.current) {
          e.preventDefault();
          handleDirectPrintDoc();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [frontImage, backImage, docPrintOrientation, layoutStyle, docPrintCopiesCount, docPrintCopiesMode]);

  const currentZoomState = activeSide === 'front' ? frontZoom : backZoom;
  const currentRotState = activeSide === 'front' ? frontRot : backRot;
  const currentBrightState = activeSide === 'front' ? frontBright : backBright;
  const currentContrastState = activeSide === 'front' ? frontContrast : backContrast;
  const cropImageSrc = cropModalSide === 'front' ? frontOriginal : backOriginal;

  const updateActiveAdjustments = (key: string, value: number) => {
    if (activeSide === 'front') {
      if (key === 'zoom') setFrontZoom(value);
      if (key === 'rot') setFrontRot(value);
      if (key === 'bright') setFrontBright(value);
      if (key === 'contrast') setFrontContrast(value);
    } else {
      if (key === 'zoom') setBackZoom(value);
      if (key === 'rot') setBackRot(value);
      if (key === 'bright') setBackBright(value);
      if (key === 'contrast') setBackContrast(value);
    }
  };

  const resetActiveAdjustments = () => {
    if (activeSide === 'front') {
      setFrontZoom(1);
      setFrontRot(0);
      setFrontBright(100);
      setFrontContrast(100);
    } else {
      setBackZoom(1);
      setBackRot(0);
      setBackBright(100);
      setBackContrast(100);
    }
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-xl sm:text-2xl font-black font-display tracking-tight text-inherit">
          {t.docSectionTitle}
        </h1>
        <p className={`text-xs mt-1 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
          {t.docSectionSubtitle}
        </p>
      </div>

      {/* Preset selection ribbon */}
      <div className={`p-4 sm:p-5 rounded-2xl border ${
        theme === 'dark' ? 'bg-slate-950 border-slate-900' : 'bg-white border-slate-200 shadow-sm'
      } space-y-3`}>
        <span className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider block">
          {t.docSelectLabel}
        </span>
        <div className="flex flex-wrap gap-2.5">
          {DOCUMENT_PRESETS.map((doc) => (
            <button
              key={doc.id}
              onClick={() => setActiveDocType(doc.id)}
              className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm transition-all cursor-pointer max-w-full truncate ${
                activeDocType === doc.id
                  ? 'border-2 border-blue-600 dark:border-blue-400 bg-blue-50/90 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-extrabold shadow-sm'
                  : theme === 'dark' 
                    ? 'border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-slate-200 bg-slate-900/40 font-medium'
                    : 'border border-slate-200 hover:border-slate-300 text-slate-600 hover:text-slate-900 bg-slate-50 font-medium'
              }`}
              title={language === 'hi' ? doc.nameHi : doc.nameEn}
            >
              {language === 'hi' ? doc.nameHi : doc.nameEn}
            </button>
          ))}
        </div>
      </div>

      {/* Main double uploading layout */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        
        {/* Left Side: Drag-drop inputs, croppers, previews (8-cols) */}
        <div className="xl:col-span-8 space-y-4">
          
          {/* View switcher assembly layout tabs */}
          <div className={`flex p-1 rounded-xl border shrink-0 ${
            theme === 'dark' ? 'bg-slate-950 border-slate-900' : 'bg-slate-100 border-slate-200'
          }`}>
            <button
              onClick={() => setPreviewTab('individual')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold cursor-pointer ${
                previewTab === 'individual'
                  ? theme === 'dark' ? 'bg-slate-900 text-white shadow-md' : 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-inherit'
              }`}
            >
              <Eye className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-500" />
              <span>Align <span className="hidden sm:inline">Inputs</span> & Crop</span>
            </button>
            <button
              onClick={() => setPreviewTab('assembly')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold cursor-pointer ${
                previewTab === 'assembly'
                  ? theme === 'dark' ? 'bg-slate-900 text-white shadow-md' : 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-inherit'
              }`}
            >
              <Layers className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-cyan-500" />
              <span>Render Assembly <span className="hidden sm:inline">Sheet Preview</span></span>
            </button>
          </div>

          {/* Interactive Workspace Screen canvas block */}
          <div className={`border rounded-2xl p-3 sm:p-6 relative min-h-[300px] sm:aspect-[4/3] w-full flex flex-col items-center justify-center overflow-hidden/auto ${
            theme === 'dark' ? 'bg-slate-950 border-slate-900 shadow-2xl' : 'bg-stone-50 border-slate-200 shadow-md'
          }`}>            {/* Tab 1: Align, Crop viewports for both sides */}
            <div className={`w-full h-full flex flex-col items-center justify-center space-y-3 ${
              previewTab === 'individual' ? 'flex' : 'hidden'
            }`}>
                
                {/* Selector switch between adjusting Front / Back */}
                <div className="flex flex-col gap-2.5 w-full">
                  <div className="flex gap-2.5">
                    <button
                      type="button"
                      onClick={() => setActiveSide('front')}
                      className={`px-5 py-2 rounded-xl text-xs sm:text-sm transition-all cursor-pointer ${
                        activeSide === 'front'
                          ? 'border-2 border-blue-600 dark:border-blue-400 bg-blue-50/90 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-extrabold shadow-sm'
                          : theme === 'dark' ? 'border border-slate-800 text-slate-400 bg-slate-900/40 font-medium hover:border-slate-700 hover:text-slate-200' : 'border border-slate-200 text-slate-600 bg-slate-50 font-medium hover:border-slate-300 hover:text-slate-900'
                      }`}
                    >
                      {t.frontSide} Side
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveSide('back')}
                      className={`px-5 py-2 rounded-xl text-xs sm:text-sm transition-all cursor-pointer ${
                        activeSide === 'back'
                          ? 'border-2 border-blue-600 dark:border-blue-400 bg-blue-50/90 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-extrabold shadow-sm'
                          : theme === 'dark' ? 'border border-slate-800 text-slate-400 bg-slate-900/40 font-medium hover:border-slate-700 hover:text-slate-200' : 'border border-slate-200 text-slate-600 bg-slate-50 font-medium hover:border-slate-300 hover:text-slate-900'
                      }`}
                    >
                      {language === 'hi' ? 'पीछे' : 'Back'} Side
                    </button>
                  </div>

                  {/* Crop Action Buttons */}
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        if (frontOriginal) {
                          setCropModalSide('front');
                          setCropModalOpen(true);
                        }
                      }}
                      disabled={!frontOriginal}
                      className={`px-3 py-2 rounded-xl text-xs font-bold border flex items-center justify-center gap-1.5 cursor-pointer ${
                        frontOriginal 
                          ? 'border-emerald-500/30 bg-emerald-500/5 text-emerald-500 hover:bg-emerald-500/10' 
                          : 'opacity-40 cursor-not-allowed border-slate-800 text-slate-500'
                      }`}
                    >
                      <Crop className="w-3.5 h-3.5" />
                      <span>{language === 'hi' ? 'फ्रंट क्रॉप' : 'Crop Front'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (backOriginal) {
                          setCropModalSide('back');
                          setCropModalOpen(true);
                        }
                      }}
                      disabled={!backOriginal}
                      className={`px-3 py-2 rounded-xl text-xs font-bold border flex items-center justify-center gap-1.5 cursor-pointer ${
                        backOriginal 
                          ? 'border-emerald-500/30 bg-emerald-500/5 text-emerald-500 hover:bg-emerald-500/10' 
                          : 'opacity-40 cursor-not-allowed border-slate-800 text-slate-500'
                      }`}
                    >
                      <Crop className="w-3.5 h-3.5" />
                      <span>{language === 'hi' ? 'बैक क्रॉप' : 'Crop Back'}</span>
                    </button>
                  </div>
                </div>

                {/* Cropping guide frame with background rendering */}
                <div className="w-full flex-1 flex flex-col items-center justify-center">
                  {((activeSide === 'front' && frontImage) || (activeSide === 'back' && backImage)) ? (
                    <div className="w-full h-full flex flex-col items-center justify-center select-none">
                      <p className="text-[10px] font-mono text-slate-400 mb-2 uppercase flex items-center gap-1">
                        <Move className="w-3.5 h-3.5 text-emerald-500" />
                        Drag/Slide photo inside to adjust alignment. Click Manual Crop below.
                      </p>

                      <div 
                        onMouseDown={handleMouseDown}
                        onMouseMove={handleMouseMove}
                        onMouseUp={handleMouseUpOrLeave}
                        onMouseLeave={handleMouseUpOrLeave}
                        style={{ aspectRatio: (activeSide === 'front' ? frontAspect : backAspect) || selectedDocPreset.aspectRatio }}
                        className={`relative w-auto h-full max-h-[290px] shadow-2xl overflow-hidden border-2 select-none cursor-move rounded-md group ${
                          theme === 'dark' ? 'border-slate-800 bg-slate-900 shadow-black' : 'border-black bg-white'
                        }`}
                      >
                        {/* Front Canvas */}
                        <canvas 
                          ref={frontCanvasRef}
                          style={{ display: activeSide === 'front' ? 'block' : 'none' }}
                          className="w-full h-full block object-contain pointer-events-none"
                        />
                        {/* Back Canvas */}
                        <canvas 
                          ref={backCanvasRef}
                          style={{ display: activeSide === 'back' ? 'block' : 'none' }}
                          className="w-full h-full block object-contain pointer-events-none"
                        />

                        {/* Framing Alignment Aids */}
                        <div className="absolute inset-0 border border-blue-500/15 pointer-events-none">
                          <div className="absolute top-1/2 left-0 right-0 border-t border-dashed border-blue-500/10" />
                          <div className="absolute left-1/2 top-0 bottom-0 border-x border-dashed border-blue-500/10" />
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* Dummy Empty Stage placeholder prompting uploads with drag-and-drop support */
                    <div 
                      onDragOver={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setIsDragOverStage(true);
                      }}
                      onDragLeave={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setIsDragOverStage(false);
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setIsDragOverStage(false);
                        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                          handleDrop(activeSide, e.dataTransfer.files[0]);
                        }
                      }}
                      className={`text-center p-8 border-2 border-dashed rounded-xl max-w-sm cursor-pointer ${
                        isDragOverStage 
                          ? 'border-blue-500 bg-blue-500/10 scale-[1.03] ring-4 ring-blue-500/10'
                          : theme === 'dark'
                            ? 'border-slate-800 bg-slate-900/40 hover:border-slate-700'
                            : 'border-slate-200 bg-slate-500/5 hover:border-slate-400'
                      }`}
                    >
                      <Upload className={`w-10 h-10 mx-auto mb-3 transition-colors ${isDragOverStage ? 'text-blue-500 animate-bounce' : 'text-slate-400'}`} />
                      <h4 className={`font-bold text-sm leading-snug transition-colors ${isDragOverStage ? 'text-blue-500' : ''}`}>
                        {isDragOverStage ? 'Drop to Upload Document!' : `Please Upload Scanned ${activeSide === 'front' ? 'Front' : 'Back'} Image`}
                      </h4>
                      <p className="text-xs text-slate-600 dark:text-slate-400 mt-1.5 max-w-xs mb-3 font-medium">
                        Drag & drop file here or use the file upload selector on the right sidebar.
                      </p>
                    </div>
                  )}
                </div>

                {/* Display active modifications tags */}
                {((activeSide === 'front' && frontImage) || (activeSide === 'back' && backImage)) && (
                  <div className="flex flex-col sm:flex-row items-center justify-between w-full gap-3 mt-4">
                    <div className="flex flex-wrap justify-center sm:justify-start gap-2 sm:gap-4 text-[10px] font-mono text-slate-500 bg-slate-500/5 px-3 py-2 rounded-xl w-full sm:w-auto">
                      <span>Target: {selectedDocPreset.widthMm}x{selectedDocPreset.heightMm}mm</span>
                      <span>Rot: {currentRotState}°</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setCropModalSide(activeSide);
                        setCropModalOpen(true);
                      }}
                      className="w-full sm:w-auto px-5 py-2.5 rounded-xl text-xs font-extrabold bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center gap-1.5 shadow-md shadow-emerald-950/15 hover:shadow-lg cursor-pointer active:scale-95 shrink-0"
                    >
                      <Sliders className="w-3.5 h-3.5 text-white" />
                      <span>{language === 'hi' ? 'मैन्युअल क्रॉप करें' : 'Manual Crop Document'}</span>
                    </button>
                  </div>
                )}
              </div>

            {/* Tab 2: Assembled ready sheet */}
            <div className={`w-full h-full flex flex-col items-center justify-center ${
              previewTab === 'assembly' ? 'flex' : 'hidden'
            }`}>
              <div className={`p-2 border shadow-2xl rounded-lg max-h-[380px] overflow-y-auto ${
                theme === 'dark' ? 'border-slate-800 bg-slate-900' : 'border-slate-200 bg-white'
              }`}>
                <canvas 
                  ref={assemblyCanvasRef}
                  className="w-auto h-auto max-h-[350px] max-w-full block mx-auto object-contain bg-white shrink-0"
                />
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-3 font-medium text-center">
                Page assembly preset: {layoutStyle} • Placed on physical 210x297mm A4 Canvas
              </p>
            </div>
          </div>

          {/* Side-by-Side: Print & Print Layout / Back to Edit (Always Visible) */}
          <div className="grid grid-cols-2 gap-2 sm:gap-2.5 md:gap-3 w-full">
            {/* 1. PRINT BUTTON */}
            <button
              type="button"
              id="snapid-doc-print-btn"
              onClick={handleDirectPrintDoc}
              className="w-full py-2 sm:py-2.5 md:py-3.5 px-2 sm:px-3 md:px-4 rounded-xl font-bold text-[11px] sm:text-xs md:text-sm lg:text-base text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-700 flex items-center justify-center gap-1.5 sm:gap-2 cursor-pointer border border-blue-500/20 subtle-glow-button active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={(!frontImage && !backImage) || isPrintingDoc}
            >
              {isPrintingDoc ? (
                <RefreshCw className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5 shrink-0 animate-spin" />
              ) : (
                <Printer className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5 shrink-0" />
              )}
              <span>{isPrintingDoc ? (language === 'hi' ? 'तैयार हो रहा है...' : 'Preparing...') : 'Print'}</span>
            </button>
            
            {/* 2. PRINT LAYOUT / BACK TO EDIT BUTTON */}
            <button
              type="button"
              id="snapid-doc-tab-toggle-btn"
              onClick={() => {
                if (previewTab === 'assembly') {
                  setPreviewTab('individual');
                } else {
                  setPreviewTab('assembly');
                }
              }}
              className={`w-full py-2 sm:py-2.5 md:py-3.5 px-2 sm:px-3 md:px-4 rounded-xl font-bold text-[11px] sm:text-xs md:text-sm lg:text-base border flex items-center justify-center gap-1.5 sm:gap-2 cursor-pointer subtle-glow-button active:scale-[0.98] ${
                previewTab === 'assembly'
                  ? 'bg-blue-600/15 border-blue-500/30 text-blue-400 hover:bg-blue-600/25'
                  : theme === 'dark' 
                    ? 'bg-slate-900 hover:bg-slate-800 border-slate-800 text-white' 
                    : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-800'
              }`}
            >
              {previewTab === 'assembly' ? (
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

          {/* Quick downloads block below stage */}
          {previewTab === 'individual' && (
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <span className="text-xs text-slate-400 font-mono text-center md:text-left">
                Preserve individual sides crop and download safely
              </span>
              <div className="flex flex-wrap justify-center gap-2 w-full md:w-auto">
                <button
                  type="button"
                  disabled={!frontImage}
                  onClick={() => downloadSidePng('front')}
                  className={`w-full sm:w-auto px-3.5 py-2 rounded-lg text-[11px] font-bold border flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                    frontImage
                      ? theme === 'dark' ? 'border-slate-800 bg-slate-900/50 hover:bg-slate-900 text-slate-300' : 'border-slate-200 hover:bg-slate-100 text-slate-700'
                      : 'opacity-40 cursor-not-allowed text-slate-400 border-transparent'
                  }`}
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Front (PNG)</span>
                </button>
                <button
                  type="button"
                  disabled={!backImage}
                  onClick={() => downloadSidePng('back')}
                  className={`w-full sm:w-auto px-3.5 py-2 rounded-lg text-[11px] font-bold border flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                    backImage
                      ? theme === 'dark' ? 'border-slate-800 bg-slate-900/50 hover:bg-slate-900 text-slate-300' : 'border-slate-200 hover:bg-slate-100 text-slate-700'
                      : 'opacity-40 cursor-not-allowed text-slate-400 border-transparent'
                  }`}
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Back (PNG)</span>
                </button>
              </div>
            </div>
          )}

        </div>

        {/* Right Side: Upload controls and sliders (4-cols) */}
        <div className="xl:col-span-4 space-y-6">
          
          {/* Panel: Upload front / back panels */}
          <div className={`p-5 sm:p-6 rounded-3xl border ${
            theme === 'dark' 
              ? 'bg-slate-950/90 border-slate-800 shadow-2xl shadow-blue-950/20' 
              : 'bg-white border-slate-200/90 shadow-xl shadow-slate-200/60'
          } space-y-5`}>
            
            {/* Header with Shining Badge */}
            <div className="flex items-center justify-between border-b pb-3 border-slate-200 dark:border-slate-800/80">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/25 shrink-0">
                  <Upload className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm sm:text-base tracking-tight leading-none text-slate-900 dark:text-white flex items-center gap-2">
                    <span>{language === 'hi' ? 'दस्तावेज़ स्कैन अपलोड' : 'Scanned Images Upload'}</span>
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                    {language === 'hi' 
                      ? 'फ्रंट व बैक दोनों भाग यहाँ अपलोड करें (ऑटो-क्रॉप सक्रिय)' 
                      : 'Upload Front & Back document scans'}
                  </p>
                </div>
              </div>
              <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 shrink-0">
                <Sparkles className="w-3 h-3 text-blue-500 animate-pulse" />
                <span>AI Auto-Crop</span>
              </span>
            </div>

            {/* Instant Try with Sample Documents Feature Card */}
            <div className={`p-3.5 sm:p-4 rounded-2xl border transition-all ${
              theme === 'dark'
                ? 'bg-gradient-to-r from-blue-950/40 via-indigo-950/30 to-slate-900/60 border-blue-500/30 shadow-md'
                : 'bg-gradient-to-r from-blue-50 via-indigo-50/60 to-sky-50/50 border-blue-200/80 shadow-xs'
            }`}>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-blue-500/25">
                    <Sparkles className="w-5 h-5 text-cyan-300" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-900 dark:text-white">
                        {language === 'hi' ? '⚡ नमूना आधार कार्ड (Front + Back)' : '⚡ Try with Sample Documents'}
                      </span>
                      <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                        DEMO
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      {language === 'hi'
                        ? 'बिना स्कैन किए Realistic Aadhaar (Front + Back) के साथ तुरंत प्रिंट टेस्ट करें'
                        : 'Instantly test Front & Back printing with realistic specimen Aadhaar cards'}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleLoadSampleDocuments}
                  disabled={isLoadingSampleDocs}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl font-bold text-xs text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-md shadow-blue-500/25 cursor-pointer transform active:scale-95 transition-all disabled:opacity-70 whitespace-nowrap shrink-0"
                >
                  {isLoadingSampleDocs ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>{language === 'hi' ? 'तैयार हो रहा है...' : 'Loading Demo Docs...'}</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5 text-cyan-300" />
                      <span>{language === 'hi' ? '⚡ नमूना दस्तावेज़ लोड करें' : '⚡ Load Sample Aadhaar'}</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Front upload zone */}
            <div className="space-y-4">
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setIsDragOverFront(true);
                }}
                onDragLeave={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setIsDragOverFront(false);
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setIsDragOverFront(false);
                  if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                    handleDrop('front', e.dataTransfer.files[0]);
                  }
                }}
                className={`rounded-2xl ${
                  isDragOverFront
                    ? 'ring-4 ring-blue-500 ring-offset-2 scale-[1.02]'
                    : ''
                }`}
              >
                {/* Step Header Bar */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-blue-600 text-white shadow-xs">
                      Step 1
                    </span>
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      {language === 'hi' ? 'सामने का भाग (Front Side)' : 'Front Side Image'}
                    </span>
                  </div>
                  {frontImage && (
                    <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>Loaded ✓</span>
                    </span>
                  )}
                </div>
                
                {isDetectingFront ? (
                  <div className={`border-2 border-dashed rounded-2xl p-7 text-center block bg-blue-500/5 ${
                    theme === 'dark' ? 'border-blue-500/50 animate-pulse-glow-dark' : 'border-blue-500/40 animate-pulse-glow-light'
                  }`}>
                    <div className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                    <span className="text-xs font-extrabold text-blue-600 dark:text-blue-400 block uppercase tracking-wider animate-pulse">
                      {language === 'hi' ? 'AI दस्तावेज़ पहचान व ऑटो-क्रॉपिंग चालू है...' : 'AI Auto-Detecting & Cropping...'}
                    </span>
                    <span className="text-[11px] text-slate-500 mt-1 block">
                      {language === 'hi' ? 'कृपया कुछ सेकंड प्रतीक्षा करें' : 'Please wait a moment'}
                    </span>
                  </div>
                ) : frontImage ? (
                  /* Loaded state card */
                  <div className={`p-3.5 rounded-2xl border ${
                    theme === 'dark'
                      ? 'bg-slate-900/80 border-slate-800 shadow-md shadow-black/20'
                      : 'bg-slate-50/90 border-slate-200 shadow-md shadow-slate-200/50'
                  }`}>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="w-14 h-10 rounded-lg bg-slate-900 border border-slate-700/60 overflow-hidden shadow-sm shrink-0 flex items-center justify-center relative">
                          <img src={frontImage} className="w-full h-full object-cover" alt="Front Preview" />
                          <div className="absolute inset-0 bg-blue-500/10 pointer-events-none" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <span className="text-xs font-bold text-slate-800 dark:text-slate-100 block truncate" title={language === 'hi' ? 'फ्रंट इमेज तैयार है' : 'Front Image Ready'}>
                            {language === 'hi' ? 'फ्रंट इमेज तैयार है' : 'Front Image Ready'}
                          </span>
                          <span className="text-[10px] font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1 truncate">
                            <span>Auto-crop applied ✓</span>
                          </span>
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex flex-wrap items-center gap-1.5 shrink-0 self-end sm:self-center">
                        <button
                          type="button"
                          onClick={() => {
                            setCropModalSide('front');
                            setCropModalOpen(true);
                          }}
                          className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 active:scale-95 cursor-pointer px-2.5 py-1.5 rounded-lg border border-emerald-500/20 flex items-center gap-1 whitespace-nowrap"
                          title="Manual Crop"
                        >
                          <Crop className="w-3 h-3 shrink-0" />
                          <span>{language === 'hi' ? 'क्रॉप' : 'Crop'}</span>
                        </button>
                        <label className="text-[11px] font-bold text-blue-600 dark:text-blue-400 bg-blue-500/10 hover:bg-blue-500/20 active:scale-95 cursor-pointer px-2.5 py-1.5 rounded-lg border border-blue-500/20 flex items-center gap-1 whitespace-nowrap">
                          <RefreshCw className="w-3 h-3 shrink-0" />
                          <span>{language === 'hi' ? 'बदलें' : 'Change'}</span>
                          <input 
                            type="file" 
                            accept="image/*" 
                            onChange={(e) => {
                              if (e.target.files && e.target.files[0]) {
                                handleFileUpload('front', e.target.files[0]);
                                e.target.value = '';
                              }
                            }} 
                            className="hidden" 
                          />
                        </label>
                        <button
                          type="button"
                          onClick={() => handleRemoveImage('front')}
                          className="text-[11px] font-bold text-rose-500 hover:text-rose-600 bg-rose-500/10 hover:bg-rose-500/20 active:scale-95 cursor-pointer p-1.5 rounded-lg border border-rose-500/20 shrink-0"
                          title="Remove Front Image"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Glowing Empty Upload Zone */
                  <label className={`relative overflow-hidden group border-2 rounded-2xl p-6 sm:p-7 text-center block cursor-pointer ${
                    isDragOverFront
                      ? 'border-blue-500 bg-blue-500/10 scale-[1.02]'
                      : theme === 'dark' 
                        ? 'border-blue-500/70 bg-gradient-to-br from-slate-900/90 via-blue-950/25 to-slate-900/90 shadow-[0_0_24px_rgba(59,130,246,0.25)] hover:border-blue-400' 
                        : 'border-blue-400/90 bg-gradient-to-br from-blue-50/90 via-sky-50/50 to-indigo-50/40 shadow-[0_6px_25px_rgba(37,99,235,0.18)] hover:border-blue-600'
                  }`}>
                    <div className="relative z-10 flex flex-col items-center justify-center space-y-2.5">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-lg shadow-blue-500/35 group-hover:scale-110 transition-transform duration-300">
                        <Upload className="w-6 h-6 animate-bounce" />
                      </div>
                      <div>
                        <span className="text-sm font-extrabold text-slate-900 dark:text-white block group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                          {language === 'hi' 
                            ? 'यहाँ फ्रंट इमेज ड्रॉप करें या क्लिक करें' 
                            : 'Upload Front Side Image'}
                        </span>
                        <span className="text-xs text-slate-600 dark:text-slate-300 font-medium block mt-0.5">
                          {language === 'hi'
                            ? 'आधार / पैन कार्ड / पहचान पत्र का सामने का भाग'
                            : 'Click or drop Aadhaar / PAN / Voter ID Front'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 pt-1">
                        <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                          ⚡ Auto-Crop AI
                        </span>
                        <span className="text-[10px] font-medium text-slate-500">
                          JPG, PNG, WEBP
                        </span>
                      </div>
                    </div>
                    
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          handleFileUpload('front', e.target.files[0]);
                          e.target.value = '';
                        }
                      }} 
                      className="hidden" 
                    />
                  </label>
                )}
              </div>

              {/* Back upload zone */}
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setIsDragOverBack(true);
                }}
                onDragLeave={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setIsDragOverBack(false);
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setIsDragOverBack(false);
                  if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                    handleDrop('back', e.dataTransfer.files[0]);
                  }
                }}
                className={`rounded-2xl ${
                  isDragOverBack
                    ? 'ring-4 ring-indigo-500 ring-offset-2 scale-[1.02]'
                    : ''
                }`}
              >
                {/* Step Header Bar */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-indigo-600 text-white shadow-xs">
                      Step 2
                    </span>
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      {language === 'hi' ? 'पीछे का भाग (Back Side)' : 'Back Side Image'}
                    </span>
                  </div>
                  {backImage && (
                    <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>Loaded ✓</span>
                    </span>
                  )}
                </div>
                
                {isDetectingBack ? (
                  <div className={`border-2 border-dashed rounded-2xl p-7 text-center block bg-indigo-500/5 ${
                    theme === 'dark' ? 'border-indigo-500/50 animate-pulse-glow-dark' : 'border-indigo-500/40 animate-pulse-glow-light'
                  }`}>
                    <div className="w-8 h-8 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                    <span className="text-xs font-extrabold text-indigo-600 dark:text-indigo-400 block uppercase tracking-wider animate-pulse">
                      {language === 'hi' ? 'AI दस्तावेज़ पहचान व ऑटो-क्रॉपिंग चालू है...' : 'AI Auto-Detecting & Cropping...'}
                    </span>
                    <span className="text-[11px] text-slate-500 mt-1 block">
                      {language === 'hi' ? 'कृपया कुछ सेकंड प्रतीक्षा करें' : 'Please wait a moment'}
                    </span>
                  </div>
                ) : backImage ? (
                  /* Loaded state card */
                  <div className={`p-3.5 rounded-2xl border ${
                    theme === 'dark'
                      ? 'bg-slate-900/80 border-slate-800 shadow-md shadow-black/20'
                      : 'bg-slate-50/90 border-slate-200 shadow-md shadow-slate-200/50'
                  }`}>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="w-14 h-10 rounded-lg bg-slate-900 border border-slate-700/60 overflow-hidden shadow-sm shrink-0 flex items-center justify-center relative">
                          <img src={backImage} className="w-full h-full object-cover" alt="Back Preview" />
                          <div className="absolute inset-0 bg-indigo-500/10 pointer-events-none" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <span className="text-xs font-bold text-slate-800 dark:text-slate-100 block truncate" title={language === 'hi' ? 'बैक इमेज तैयार है' : 'Back Image Ready'}>
                            {language === 'hi' ? 'बैक इमेज तैयार है' : 'Back Image Ready'}
                          </span>
                          <span className="text-[10px] font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1 truncate">
                            <span>Auto-crop applied ✓</span>
                          </span>
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex flex-wrap items-center gap-1.5 shrink-0 self-end sm:self-center">
                        <button
                          type="button"
                          onClick={() => {
                            setCropModalSide('back');
                            setCropModalOpen(true);
                          }}
                          className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 active:scale-95 cursor-pointer px-2.5 py-1.5 rounded-lg border border-emerald-500/20 flex items-center gap-1 whitespace-nowrap"
                          title="Manual Crop"
                        >
                          <Crop className="w-3 h-3 shrink-0" />
                          <span>{language === 'hi' ? 'क्रॉप' : 'Crop'}</span>
                        </button>
                        <label className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 hover:bg-indigo-500/20 active:scale-95 cursor-pointer px-2.5 py-1.5 rounded-lg border border-indigo-500/20 flex items-center gap-1 whitespace-nowrap">
                          <RefreshCw className="w-3 h-3 shrink-0" />
                          <span>{language === 'hi' ? 'बदलें' : 'Change'}</span>
                          <input 
                            type="file" 
                            accept="image/*" 
                            onChange={(e) => {
                              if (e.target.files && e.target.files[0]) {
                                handleFileUpload('back', e.target.files[0]);
                                e.target.value = '';
                              }
                            }} 
                            className="hidden" 
                          />
                        </label>
                        <button
                          type="button"
                          onClick={() => handleRemoveImage('back')}
                          className="text-[11px] font-bold text-rose-500 hover:text-rose-600 bg-rose-500/10 hover:bg-rose-500/20 active:scale-95 cursor-pointer p-1.5 rounded-lg border border-rose-500/20 shrink-0"
                          title="Remove Back Image"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Glowing Empty Upload Zone */
                  <label className={`relative overflow-hidden group border-2 rounded-2xl p-6 sm:p-7 text-center block cursor-pointer ${
                    isDragOverBack
                      ? 'border-indigo-500 bg-indigo-500/10 scale-[1.02]'
                      : theme === 'dark' 
                        ? 'border-indigo-500/70 bg-gradient-to-br from-slate-900/90 via-indigo-950/25 to-slate-900/90 shadow-[0_0_24px_rgba(99,102,241,0.25)] hover:border-indigo-400' 
                        : 'border-indigo-400/90 bg-gradient-to-br from-indigo-50/90 via-purple-50/40 to-blue-50/40 shadow-[0_6px_25px_rgba(99,102,241,0.18)] hover:border-indigo-600'
                  }`}>
                    <div className="relative z-10 flex flex-col items-center justify-center space-y-2.5">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white flex items-center justify-center shadow-lg shadow-indigo-500/35 group-hover:scale-110 transition-transform duration-300">
                        <Upload className="w-6 h-6 animate-bounce" />
                      </div>
                      <div>
                        <span className="text-sm font-extrabold text-slate-900 dark:text-white block group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                          {language === 'hi' 
                            ? 'यहाँ बैक इमेज ड्रॉप करें या क्लिक करें' 
                            : 'Upload Back Side Image'}
                        </span>
                        <span className="text-xs text-slate-600 dark:text-slate-300 font-medium block mt-0.5">
                          {language === 'hi'
                            ? 'आधार / पैन कार्ड / पहचान पत्र का पीछे का भाग'
                            : 'Click or drop Aadhaar / PAN / Voter ID Back'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 pt-1">
                        <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                          ⚡ Auto-Crop AI
                        </span>
                        <span className="text-[10px] font-medium text-slate-500">
                          JPG, PNG, WEBP
                        </span>
                      </div>
                    </div>
                    
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          handleFileUpload('back', e.target.files[0]);
                          e.target.value = '';
                        }
                      }} 
                      className="hidden" 
                    />
                  </label>
                )}
              </div>
            </div>
          </div>

          {/* Hidden file input for programmatic fallbacks */}
          <input
            ref={fallbackFileInputRef}
            type="file"
            accept="image/*"
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                handleFileUpload(detectionFailedSide || 'front', e.target.files[0]);
                e.target.value = '';
              }
            }}
            className="hidden"
          />

          {/* Panel: Document assembly configuration template */}
          <div className={`p-5 rounded-2xl border ${
            theme === 'dark' ? 'bg-slate-950 border-slate-900' : 'bg-white border-slate-200 shadow-sm'
          } space-y-4`}>
            <h3 className="font-bold text-sm sm:text-base tracking-tight border-b border-slate-200 dark:border-slate-800/80 pb-2.5 flex items-center gap-2">
              <Layers className="w-4 h-4 text-blue-500" />
              <span>{t.layoutOptions}</span>
            </h3>

            <div className="space-y-2.5">
              {LAYOUT_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  onClick={() => setLayoutStyle(preset.id)}
                  className={`w-full text-left p-3.5 rounded-xl transition-all flex flex-col gap-1 cursor-pointer ${
                    layoutStyle === preset.id
                      ? 'border-2 border-blue-600 dark:border-blue-400 bg-blue-50/90 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 shadow-sm'
                      : theme === 'dark' 
                        ? 'border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white bg-slate-900/30'
                        : 'border border-slate-200 hover:border-slate-300 text-slate-700 hover:text-slate-900 bg-slate-50'
                  }`}
                >
                  <span className={`text-xs sm:text-sm ${layoutStyle === preset.id ? 'font-extrabold text-blue-700 dark:text-blue-300' : 'font-bold'}`}>
                    {language === 'hi' ? preset.labelHi : preset.labelEn}
                  </span>
                  <span className={`text-[11px] leading-normal line-clamp-2 ${layoutStyle === preset.id ? 'text-blue-600/90 dark:text-blue-300/80 font-medium' : 'text-slate-600 dark:text-slate-400'}`}>
                    {language === 'hi' ? preset.descHi : preset.descEn}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Print & Download Options */}
          <div className={`p-5 rounded-2xl border ${
            theme === 'dark' 
              ? 'bg-slate-950 border-slate-900 shadow-xl' 
              : 'bg-white border-slate-200 shadow-md'
          } space-y-3.5`}>
            <h4 className="font-bold text-sm sm:text-base tracking-tight border-b border-slate-200 dark:border-slate-800/80 pb-2.5 flex items-center gap-1.5">
              <Download className="w-4 h-4 text-blue-500" />
              <span>{language === 'hi' ? 'प्रिंट और डाउनलोड सेंटर (Print & Download)' : 'Print & Download Options'}</span>
            </h4>
            <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
              {language === 'hi'
                ? 'दस्तावेज़ शीट लेआउट तैयार करें और उच्च-गुणवत्ता वाली PNG इमेज या PDF फ़ॉर्मेट तुरंत डाउनलोड करके आसानी से प्रिंट करें।'
                : 'Prepare document layouts and download high-quality PNG or PDF formatting immediately for clean, professional printing.'}
            </p>

            <div className="grid grid-cols-1 gap-2.5 pt-1">
              {/* 1. DOWNLOAD PNG */}
              <button
                type="button"
                onClick={downloadAssemblyPng}
                className="w-full px-4.5 py-3.5 rounded-xl font-bold text-xs sm:text-sm bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-600/25 flex items-center justify-between group cursor-pointer transition-all active:scale-[0.99]"
              >
                <div className="flex items-center gap-2.5">
                  <ImageIcon className="w-4 h-4 text-blue-100 shrink-0" />
                  <span>Download Photo Layout (PNG)</span>
                </div>
                <Download className="w-4 h-4 text-blue-100 group-hover:translate-y-0.5 transition-transform" />
              </button>

              {/* 4. DOWNLOAD PDF */}
              <button
                type="button"
                onClick={downloadAssemblyPdf}
                className={`w-full px-4.5 py-3.5 rounded-xl font-bold text-xs sm:text-sm border flex items-center justify-between group cursor-pointer transition-all active:scale-[0.99] ${
                  theme === 'dark' ? 'bg-slate-900 hover:bg-slate-800 border-slate-800 text-white' : 'bg-slate-50 hover:bg-slate-100 border-slate-300 text-slate-900'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <FileDown className="w-4 h-4 text-red-500 shrink-0" />
                  <span>Download Ready-to-Print PDF</span>
                </div>
                <Download className="w-4 h-4 text-slate-400 group-hover:text-inherit group-hover:translate-y-0.5 transition-transform" />
              </button>

            </div>
          </div>

        </div>

      </div>

      {/* Precision Crop Modal Overlay */}
      {cropModalOpen && cropImageSrc && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-slate-950/90 backdrop-blur-sm select-none touch-none overscroll-none"
          onMouseMove={handleBoxDragMove}
          onMouseUp={handleBoxDragEnd}
          onMouseLeave={handleBoxDragEnd}
          onTouchMove={handleBoxDragMoveTouch}
          onTouchEnd={handleBoxDragEnd}
        >
          <div 
            className={`w-full max-w-4xl rounded-2xl border ${
              theme === 'dark' ? 'bg-slate-950 border-slate-800 shadow-black' : 'bg-slate-900 border-slate-700 shadow-2xl'
            } p-4 sm:p-5 flex flex-col space-y-3.5 text-white my-auto`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  <h3 className="text-sm sm:text-base font-black tracking-tight text-emerald-400">
                    {language === 'hi' ? 'दस्तावेज़ क्रॉप एवं रोटेशन स्टेशन' : 'Document Crop & Smooth Rotate Station'}
                  </h3>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 uppercase">
                    {cropModalSide === 'front' ? 'Front Side' : 'Back Side'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-300 mt-0.5">
                  {language === 'hi' 
                    ? '8 दिशाओं (कोने और साइड) से बॉक्स को खींचकर सही करें। नीचे दिए गए स्लाइडर से मनचाहे एंगल पर रोटेट करें।' 
                    : 'Adjust crop boundary from all 8 directions. Use the smooth slider bar to rotate to any precise angle.'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setCropModalOpen(false)}
                className="p-1.5 px-3 rounded-lg text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white cursor-pointer border border-slate-700"
              >
                ✕ Close
              </button>
            </div>

            {/* Quick Action Toolbar: Auto-Detect, Fit Full, Card Ratio */}
            <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-900/90 p-2.5 rounded-xl border border-slate-800 text-xs">
              <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                <span>{language === 'hi' ? 'त्वरित क्रॉप टूल:' : 'Quick Crop Tools:'}</span>
              </span>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => rotateModalBy(90)}
                  className="px-2.5 py-1.5 rounded-lg font-bold text-[11px] bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 transition-colors cursor-pointer flex items-center gap-1.5"
                  title="Rotate 90° Clockwise"
                >
                  <RotateCw className="w-3 h-3 text-amber-400" />
                  <span>90° घुमाएं</span>
                </button>
                <button
                  type="button"
                  onClick={() => rotateModalBy(180)}
                  className="px-2.5 py-1.5 rounded-lg font-bold text-[11px] bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/40 transition-colors cursor-pointer flex items-center gap-1.5"
                  title="180° Flip (उल्टी फोटो सीधी करें)"
                >
                  <RefreshCw className="w-3 h-3 text-purple-400" />
                  <span>180° उल्टी से सीधी</span>
                </button>
                <button
                  type="button"
                  onClick={reDetectInModal}
                  className="px-2.5 py-1.5 rounded-lg font-bold text-[11px] bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 transition-colors cursor-pointer flex items-center gap-1.5"
                  title="Auto detect document boundaries"
                >
                  <Sparkles className="w-3 h-3 text-emerald-400" />
                  <span>{language === 'hi' ? 'ऑटो डिटेक्ट' : 'Auto Detect'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const canvas = cropCanvasRef.current;
                    if (canvas) {
                      const containerRatio = canvas.width / canvas.height;
                      const targetRatio = selectedDocPreset.widthMm / selectedDocPreset.heightMm;
                      let w = 85;
                      let h = (w / targetRatio) * containerRatio;
                      if (h > 85) {
                        h = 85;
                        w = (h * targetRatio) / containerRatio;
                      }
                      setCropBox({
                        x: (100 - w) / 2,
                        y: (100 - h) / 2,
                        w,
                        h
                      });
                    }
                  }}
                  className="px-2.5 py-1.5 rounded-lg font-bold text-[11px] bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 border border-blue-500/40 transition-colors cursor-pointer flex items-center gap-1.5"
                  title="Reset to standard ID Card aspect ratio"
                >
                  <Crop className="w-3 h-3 text-blue-400" />
                  <span>{language === 'hi' ? 'कार्ड अनुपात (85.6x54mm)' : 'Card Ratio Preset'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setCropBox({ x: 2, y: 2, w: 96, h: 96 })}
                  className="px-2.5 py-1.5 rounded-lg font-bold text-[11px] bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors cursor-pointer flex items-center gap-1.5"
                  title="Fit entire image"
                >
                  <Maximize2 className="w-3 h-3 text-slate-400" />
                  <span>{language === 'hi' ? 'पूरा फोटो' : 'Full Image'}</span>
                </button>
              </div>
            </div>

            {/* Stage Container */}
            <div className="flex-1 flex items-center justify-center bg-slate-950 p-2 sm:p-3 rounded-xl relative border border-slate-800 select-none overflow-hidden min-h-[280px] max-h-[50vh]">
              <div 
                ref={displayContainerRef}
                className="relative max-w-full max-h-[46vh] flex items-center justify-center select-none"
              >
                <canvas 
                  ref={cropCanvasRef}
                  className="max-w-full max-h-[46vh] block object-contain select-none shadow-2xl rounded"
                />

                {/* Crop overlay box bounds */}
                {cropBox && (
                  <div 
                    style={{
                      left: `${cropBox.x}%`,
                      top: `${cropBox.y}%`,
                      width: `${cropBox.w}%`,
                      height: `${cropBox.h}%`,
                    }}
                    className="absolute border-2 border-emerald-400 shadow-[0_0_25px_rgba(52,211,153,0.4)] z-20 transition-all duration-75 select-none"
                  >
                    {/* Centered panning handle */}
                    <div 
                      onMouseDown={(e) => startBoxDrag('move', e)}
                      onTouchStart={(e) => startBoxDragTouch('move', e)}
                      className="absolute inset-0 cursor-move bg-emerald-500/10 select-none z-10 flex items-center justify-center"
                    >
                      <span className="text-[10px] font-mono font-bold text-emerald-300 bg-slate-950/80 px-2 py-0.5 rounded border border-emerald-500/40 pointer-events-none opacity-80 group-hover:opacity-100">
                        ✥ {language === 'hi' ? 'खींचकर ले जाएं' : 'Drag to Move'}
                      </span>
                    </div>

                    {/* 3x3 Rule of Thirds Grid */}
                    <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 pointer-events-none">
                      <div className="border-r border-b border-emerald-400/20" />
                      <div className="border-r border-b border-emerald-400/20" />
                      <div className="border-b border-emerald-400/20" />
                      <div className="border-r border-b border-emerald-400/20" />
                      <div className="border-r border-b border-emerald-400/20" />
                      <div className="border-b border-emerald-400/20" />
                      <div className="border-r border-emerald-400/20" />
                      <div className="border-r border-emerald-400/20" />
                      <div />
                    </div>

                    {/* Resize handles - 4 Corners + 4 Edge Centers (8 directions) */}
                    {/* 1. NW - Top Left */}
                    <div 
                      onMouseDown={(e) => startBoxDrag('resize-nw', e)}
                      onTouchStart={(e) => startBoxDragTouch('resize-nw', e)}
                      className="absolute -top-3.5 -left-3.5 w-8 h-8 flex items-center justify-center cursor-nwse-resize select-none pointer-events-auto z-30 group"
                      title="Resize Top-Left (उत्तर-पश्चिम)"
                    >
                      <div className="w-4 h-4 bg-emerald-400 border-2 border-white rounded-full shadow-lg group-hover:scale-125 group-active:scale-95 transition-all" />
                    </div>

                    {/* 2. NE - Top Right */}
                    <div 
                      onMouseDown={(e) => startBoxDrag('resize-ne', e)}
                      onTouchStart={(e) => startBoxDragTouch('resize-ne', e)}
                      className="absolute -top-3.5 -right-3.5 w-8 h-8 flex items-center justify-center cursor-nesw-resize select-none pointer-events-auto z-30 group"
                      title="Resize Top-Right (उत्तर-पूर्व)"
                    >
                      <div className="w-4 h-4 bg-emerald-400 border-2 border-white rounded-full shadow-lg group-hover:scale-125 group-active:scale-95 transition-all" />
                    </div>

                    {/* 3. SE - Bottom Right */}
                    <div 
                      onMouseDown={(e) => startBoxDrag('resize-se', e)}
                      onTouchStart={(e) => startBoxDragTouch('resize-se', e)}
                      className="absolute -bottom-3.5 -right-3.5 w-8 h-8 flex items-center justify-center cursor-nwse-resize select-none pointer-events-auto z-30 group"
                      title="Resize Bottom-Right (दक्षिण-पूर्व)"
                    >
                      <div className="w-4 h-4 bg-emerald-400 border-2 border-white rounded-full shadow-lg group-hover:scale-125 group-active:scale-95 transition-all" />
                    </div>

                    {/* 4. SW - Bottom Left */}
                    <div 
                      onMouseDown={(e) => startBoxDrag('resize-sw', e)}
                      onTouchStart={(e) => startBoxDragTouch('resize-sw', e)}
                      className="absolute -bottom-3.5 -left-3.5 w-8 h-8 flex items-center justify-center cursor-nesw-resize select-none pointer-events-auto z-30 group"
                      title="Resize Bottom-Left (दक्षिण-पश्चिम)"
                    >
                      <div className="w-4 h-4 bg-emerald-400 border-2 border-white rounded-full shadow-lg group-hover:scale-125 group-active:scale-95 transition-all" />
                    </div>

                    {/* 5. N - Top Side */}
                    <div 
                      onMouseDown={(e) => startBoxDrag('resize-n', e)}
                      onTouchStart={(e) => startBoxDragTouch('resize-n', e)}
                      className="absolute -top-3 left-1/2 -translate-x-1/2 w-10 h-7 flex items-center justify-center cursor-ns-resize select-none pointer-events-auto z-30 group"
                      title="Resize Top (ऊपर)"
                    >
                      <div className="w-6 h-3 bg-emerald-400 border-2 border-white rounded-full shadow-md group-hover:scale-125 group-active:scale-95 transition-all" />
                    </div>

                    {/* 6. S - Bottom Side */}
                    <div 
                      onMouseDown={(e) => startBoxDrag('resize-s', e)}
                      onTouchStart={(e) => startBoxDragTouch('resize-s', e)}
                      className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-10 h-7 flex items-center justify-center cursor-ns-resize select-none pointer-events-auto z-30 group"
                      title="Resize Bottom (नीचे)"
                    >
                      <div className="w-6 h-3 bg-emerald-400 border-2 border-white rounded-full shadow-md group-hover:scale-125 group-active:scale-95 transition-all" />
                    </div>

                    {/* 7. W - Left Side */}
                    <div 
                      onMouseDown={(e) => startBoxDrag('resize-w', e)}
                      onTouchStart={(e) => startBoxDragTouch('resize-w', e)}
                      className="absolute top-1/2 -left-3 -translate-y-1/2 w-7 h-10 flex items-center justify-center cursor-ew-resize select-none pointer-events-auto z-30 group"
                      title="Resize Left (बाएं)"
                    >
                      <div className="w-3 h-6 bg-emerald-400 border-2 border-white rounded-full shadow-md group-hover:scale-125 group-active:scale-95 transition-all" />
                    </div>

                    {/* 8. E - Right Side */}
                    <div 
                      onMouseDown={(e) => startBoxDrag('resize-e', e)}
                      onTouchStart={(e) => startBoxDragTouch('resize-e', e)}
                      className="absolute top-1/2 -right-3 -translate-y-1/2 w-7 h-10 flex items-center justify-center cursor-ew-resize select-none pointer-events-auto z-30 group"
                      title="Resize Right (दाएं)"
                    >
                      <div className="w-3 h-6 bg-emerald-400 border-2 border-white rounded-full shadow-md group-hover:scale-125 group-active:scale-95 transition-all" />
                    </div>
                  </div>
                )}

                {/* Outer dark mask overlays */}
                {cropBox && (
                  <div className="absolute inset-0 pointer-events-none z-10">
                    <div className="absolute top-0 left-0 right-0 bg-slate-950/75" style={{ height: `${cropBox.y}%` }} />
                    <div className="absolute bottom-0 left-0 right-0 bg-slate-950/75" style={{ top: `${cropBox.y + cropBox.h}%` }} />
                    <div className="absolute left-0 bg-slate-950/75" style={{ top: `${cropBox.y}%`, height: `${cropBox.h}%`, width: `${cropBox.x}%` }} />
                    <div className="absolute right-0 bg-slate-950/75" style={{ top: `${cropBox.y}%`, height: `${cropBox.h}%`, left: `${cropBox.x + cropBox.w}%` }} />
                  </div>
                )}
              </div>
            </div>

            {/* Compact Rotation Controls */}
            <div className="bg-slate-900/95 p-3.5 rounded-xl border border-slate-800 space-y-3">
              {/* Smooth Rotation Slider & Fine adjustment buttons */}
              <div className="space-y-2 bg-slate-950/60 p-3 rounded-lg border border-slate-800/60">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                    <RotateCw className="w-3.5 h-3.5 text-blue-400" />
                    <span>{language === 'hi' ? 'रोटेशन (Rotation / एंगल):' : 'Rotation / Straighten:'}</span>
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] font-mono font-black text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">
                      {modalRotation > 0 ? `+${modalRotation.toFixed(1)}` : modalRotation.toFixed(1)}°
                    </span>
                    <button
                      type="button"
                      onClick={() => setModalRotation(0)}
                      className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 cursor-pointer transition-colors"
                      title="Straighten to 0°"
                    >
                      0°
                    </button>
                  </div>
                </div>

                <input
                  type="range"
                  min="-180"
                  max="180"
                  step="0.5"
                  value={modalRotation}
                  onChange={(e) => setModalRotation(parseFloat(e.target.value))}
                  className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-400 focus:outline-none"
                />

                <div className="flex items-center justify-between gap-1.5 pt-0.5">
                  <button
                    type="button"
                    onClick={() => rotateModalBy(-90)}
                    className="flex-1 px-2 py-1 rounded text-[11px] font-bold bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 cursor-pointer transition-colors"
                    title="-90°"
                  >
                    -90°
                  </button>
                  <button
                    type="button"
                    onClick={() => rotateModalBy(-1)}
                    className="flex-1 px-2 py-1 rounded text-[11px] font-mono font-bold bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 cursor-pointer transition-colors"
                    title="-1°"
                  >
                    -1°
                  </button>
                  <button
                    type="button"
                    onClick={() => rotateModalBy(1)}
                    className="flex-1 px-2 py-1 rounded text-[11px] font-mono font-bold bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 cursor-pointer transition-colors"
                    title="+1°"
                  >
                    +1°
                  </button>
                  <button
                    type="button"
                    onClick={() => rotateModalBy(90)}
                    className="flex-1 px-2 py-1 rounded text-[11px] font-bold bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 cursor-pointer transition-colors"
                    title="+90°"
                  >
                    +90°
                  </button>
                  <button
                    type="button"
                    onClick={() => rotateModalBy(180)}
                    className="flex-1 px-2 py-1 rounded text-[11px] font-bold bg-purple-900/60 hover:bg-purple-900 text-purple-200 border border-purple-700/60 cursor-pointer transition-colors"
                    title="180° Flip (उल्टी फोटो सीधी करें)"
                  >
                    180° फ्लिप
                  </button>
                </div>
              </div>

              {/* Action Buttons & Guidance */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-800/80">
                <span className="text-[11px] text-slate-400">
                  {language === 'hi' 
                    ? 'दस्तावेज़ को 8 कोनों व हैंडल से सटीक घेरें, रोटेशन सेट करके लागू करें।' 
                    : 'Frame document with 8-point handles, adjust angle, then save.'}
                </span>
                <div className="flex items-center gap-2 ml-auto">
                  <button
                    type="button"
                    onClick={() => setCropModalOpen(false)}
                    className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 cursor-pointer transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={applyManualCrop}
                    className="px-4 py-1.5 rounded-lg text-xs font-extrabold bg-emerald-500 hover:bg-emerald-400 text-slate-950 cursor-pointer flex items-center gap-1.5 shadow-md shadow-emerald-950/40"
                  >
                    <Check className="w-4 h-4 text-slate-950 stroke-[3]" />
                    <span>{language === 'hi' ? 'क्रॉप लागू करें (Apply Crop)' : 'Apply Crop & Save'}</span>
                  </button>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
