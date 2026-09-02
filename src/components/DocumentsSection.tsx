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
  ZoomIn,
  Sliders,
  Sparkles,
  Layout,
  FileDown,
  Move
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
  { id: 'side_by_side' as DocumentLayoutPresetId, labelEn: 'Side-by-Side (Horizontally foldable)', labelHi: 'अगल-बगल (हॉरिजॉन्टल फोल्ड)', descEn: 'Front and back side printed horizontally next to each other. Perfect for folding.', descHi: 'सामने और पीछे का हिस्सा प्रिंटिंग के बाद मोडने के लिए अगल-बगल रहता है |' },
  { id: 'stacked' as DocumentLayoutPresetId, labelEn: 'Stacked (Vertically foldable)', labelHi: 'सामने ऊपर, पीछे नीचे (वर्टिकल फोल्ड)', descEn: 'Front side placed on top, back side on bottom. Suitable for folding over.', descHi: 'ऊपर सामने और नीचे पीछे का हिस्सा |' },
  { id: 'split' as DocumentLayoutPresetId, labelEn: 'Centered Split (Full page A4 placement)', labelHi: 'A4 केंद्र सप्रिट (अलग प्रिंट)', descEn: 'Placed near the center of the sheet with comfortable cutting margins.', descHi: 'काटने के लिए पर्याप्त जगह के साथ A4 शीट के बीच में रखा गया है |' },
];

export default function DocumentsSection({ language, theme }: DocumentsSectionProps) {
  const t = translations[language];

  // Document preset selections
  const [activeDocType, setActiveDocType] = useState<DocumentTypeId>('aadhaar');
  const [layoutStyle, setLayoutStyle] = useState<DocumentLayoutPresetId>('side_by_side');

  // Multi-side file States
  const [frontImage, setFrontImage] = useState<string | null>(null);
  const [frontOriginal, setFrontOriginal] = useState<string | null>(null);
  const [backImage, setBackImage] = useState<string | null>(null);
  const [backOriginal, setBackOriginal] = useState<string | null>(null);

  // Crop Modal state
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [cropModalSide, setCropModalSide] = useState<'front' | 'back'>('front');
  const [cropBox, setCropBox] = useState({ x: 10, y: 10, w: 80, h: 50 });
  const [dragAction, setDragAction] = useState<string | null>(null);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0, box: { x: 0, y: 0, w: 0, h: 0 } });

  const displayContainerRef = useRef<HTMLDivElement>(null);

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

  // Edge-detection & Auto-crop loading states
  const [isDetectingFront, setIsDetectingFront] = useState(false);
  const [isDetectingBack, setIsDetectingBack] = useState(false);
  const [cvState, setCvState] = useState<'idle' | 'loading' | 'ready' | 'failed'>('idle');

  useEffect(() => {
    if ((window as any).cv && (window as any).cv.Mat) {
      setCvState('ready');
      return;
    }
    const existing = document.getElementById('opencv-cdn-script');
    if (existing) {
      const interval = setInterval(() => {
        if ((window as any).cv && (window as any).cv.Mat) {
          setCvState('ready');
          clearInterval(interval);
        }
      }, 100);
      return;
    }
    setCvState('loading');
    const script = document.createElement('script');
    script.id = 'opencv-cdn-script';
    script.src = 'https://docs.opencv.org/4.5.5/opencv.js';
    script.async = true;
    script.onload = () => {
      const interval = setInterval(() => {
        if ((window as any).cv && (window as any).cv.Mat) {
          console.log('OpenCV.js initialized successfully.');
          setCvState('ready');
          clearInterval(interval);
        }
      }, 100);
    };
    script.onerror = () => {
      console.warn('OpenCV load failed, falling back to pure-JS locator');
      setCvState('failed');
    };
    document.body.appendChild(script);
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
        const dataUrl = event.target?.result as string;
        try {
          // Run AI-inspired card boundary automatic detection and crop!
          const analysis = await detectDocumentAndCrop(dataUrl, selectedDocPreset.aspectRatio);
          
          if (!analysis.failed) {
            // STEP 1-8 are logged inside detectDocumentAndCrop
            
            // Show the debug overlay with the red rectangle for 1500ms
            if (side === 'front') {
              setFrontImage(analysis.debugDataUrl);
              setFrontOriginal(dataUrl);
              setFrontZoom(1.0);
              setFrontPanX(0);
              setFrontPanY(0);
              setFrontRot(0);
              setFrontBright(100);
              setFrontContrast(100);
              setActiveSide('front');
            } else {
              setBackImage(analysis.debugDataUrl);
              setBackOriginal(dataUrl);
              setBackZoom(1.0);
              setBackPanX(0);
              setBackPanY(0);
              setBackRot(0);
              setBackBright(100);
              setBackContrast(100);
              setActiveSide('back');
            }
            
            // Wait 1.5 seconds so user can see the red box in the interactive preview
            await new Promise(r => setTimeout(r, 1500));
            
            // Apply the actual cropped image
            if (side === 'front') {
              setFrontImage(analysis.croppedDataUrl);
            } else {
              setBackImage(analysis.croppedDataUrl);
            }
            console.log("STEP 9: frontImage/backImage/panImage updated");
            setPreviewTab('individual');
          } else {
            // If failed, fall back to full image as normal
            setDetectionFailed(true);
            setDetectionFailedSide(side);
            if (side === 'front') {
              setFrontImage(dataUrl);
              setFrontOriginal(dataUrl);
              setFrontZoom(1.0);
              setFrontPanX(0);
              setFrontPanY(0);
              setFrontRot(0);
              setFrontBright(100);
              setFrontContrast(100);
              setActiveSide('front');
            } else {
              setBackImage(dataUrl);
              setBackOriginal(dataUrl);
              setBackZoom(1.0);
              setBackPanX(0);
              setBackPanY(0);
              setBackRot(0);
              setBackBright(100);
              setBackContrast(100);
              setActiveSide('back');
            }
            console.log("STEP 9: frontImage/backImage/panImage updated (using fallback)");
            setPreviewTab('individual');
          }
          setIsDetectingFront(false);
          setIsDetectingBack(false);
          resolveResolve();
        } catch (err) {
          console.warn("AUTO CROP: Error during detection, applying safe manual fallback", err);
          setDetectionFailed(true);
          setDetectionFailedSide(side);
          if (side === 'front') {
            setFrontImage(dataUrl);
            setFrontOriginal(dataUrl);
            setFrontZoom(1.0);
            setFrontPanX(0);
            setFrontPanY(0);
            setFrontRot(0);
            setFrontBright(100);
            setFrontContrast(100);
            setActiveSide('front');
          } else {
            setBackImage(dataUrl);
            setBackOriginal(dataUrl);
            setBackZoom(1.0);
            setBackPanX(0);
            setBackPanY(0);
            setBackRot(0);
            setBackBright(100);
            setBackContrast(100);
            setActiveSide('back');
          }
          setIsDetectingFront(false);
          setIsDetectingBack(false);
          resolveResolve();
        }
      };
      reader.onerror = () => {
        console.warn("AUTO CROP: FileReader error reading document file");
        setIsDetectingFront(false);
        setIsDetectingBack(false);
        resolveResolve();
      };
      reader.readAsDataURL(file);
    });
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
    if (!dragAction || !displayContainerRef.current || !e.touches || !e.touches[0]) return;
    const container = displayContainerRef.current.getBoundingClientRect();
    updateCropWithDelta(e.touches[0].clientX - dragStart.x, e.touches[0].clientY - dragStart.y, container.width, container.height);
  };

  const handleBoxDragEnd = () => {
    setDragAction(null);
  };

  // Rotates high-resolution source uncropped image physically by 90 deg.
  const rotateOriginalImage90 = () => {
    const origSrc = cropModalSide === 'front' ? frontOriginal : backOriginal;
    if (!origSrc) return;
    const img = new Image();
    img.src = origSrc;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.height;
      canvas.height = img.width;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.rotate((90 * Math.PI) / 180);
        ctx.drawImage(img, -img.width / 2, -img.height / 2);
        const rotatedData = canvas.toDataURL('image/png');
        if (cropModalSide === 'front') {
          setFrontOriginal(rotatedData);
          setFrontImage(rotatedData);
        } else {
          setBackOriginal(rotatedData);
          setBackImage(rotatedData);
        }
      }
    };
    img.src = origSrc;
  };

  // Extract crop rectangle from original high resolution source
  const applyManualCrop = () => {
    const origSrc = cropModalSide === 'front' ? frontOriginal : backOriginal;
    if (!origSrc) return;
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const rx = cropBox.x / 100;
      const ry = cropBox.y / 100;
      const rw = cropBox.w / 100;
      const rh = cropBox.h / 100;

      const pxX = rx * img.naturalWidth;
      const pxY = ry * img.naturalHeight;
      const pxW = rw * img.naturalWidth;
      const pxH = rh * img.naturalHeight;

      canvas.width = pxW;
      canvas.height = pxH;

      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, pxW, pxH);
        ctx.drawImage(img, pxX, pxY, pxW, pxH, 0, 0, pxW, pxH);
        const croppedDUrl = canvas.toDataURL('image/png');
        
        if (cropModalSide === 'front') {
          setFrontImage(croppedDUrl);
          setFrontZoom(1.0);
          setFrontPanX(0);
          setFrontPanY(0);
          setFrontRot(0);
        } else {
          setBackImage(croppedDUrl);
          setBackZoom(1.0);
          setBackPanX(0);
          setBackPanY(0);
          setBackRot(0);
        }
        setCropModalOpen(false);
      }
    };
    img.src = origSrc;
  };

  // Render Front Canvas
  useEffect(() => {
    const canvas = frontCanvasRef.current;
    if (!canvas || !frontImage) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.onload = () => {
      // High-res rendering scale: standard card ratio 1.585
      const baseWidth = 856;
      const baseHeight = 540;
      canvas.width = baseWidth;
      canvas.height = baseHeight;

      ctx.clearRect(0, 0, baseWidth, baseHeight);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, baseWidth, baseHeight);

      // Draw with offset zoom rotate
      ctx.save();
      ctx.translate(baseWidth / 2 + frontPanX, baseHeight / 2 + frontPanY);
      ctx.rotate((frontRot * Math.PI) / 180);

      const fitScale = Math.min(baseWidth / img.width, baseHeight / img.height);
      const drawWidth = img.width * fitScale * frontZoom;
      const drawHeight = img.height * fitScale * frontZoom;

      ctx.filter = `brightness(${frontBright}%) contrast(${frontContrast}%)`;
      ctx.drawImage(img, -drawWidth / 2, -drawHeight / 2, drawWidth, drawHeight);
      ctx.restore();

      // Border outer
      if (borderWidth > 0) {
        ctx.strokeStyle = borderColor;
        const ratio = baseWidth / selectedDocPreset.widthMm;
        const strokePx = borderWidth * ratio;
        ctx.lineWidth = strokePx;
        ctx.strokeRect(strokePx / 2, strokePx / 2, baseWidth - strokePx, baseHeight - strokePx);
      }
    };
    img.src = frontImage;
  }, [
    activeDocType,
    frontImage,
    frontZoom,
    frontPanX,
    frontPanY,
    frontRot,
    frontBright,
    frontContrast,
    borderWidth,
    borderColor
  ]);

  // Render Back Canvas
  useEffect(() => {
    const canvas = backCanvasRef.current;
    if (!canvas || !backImage) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.onload = () => {
      const baseWidth = 856;
      const baseHeight = 540;
      canvas.width = baseWidth;
      canvas.height = baseHeight;

      ctx.clearRect(0, 0, baseWidth, baseHeight);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, baseWidth, baseHeight);

      // Draw with offset zoom rotate
      ctx.save();
      ctx.translate(baseWidth / 2 + backPanX, baseHeight / 2 + backPanY);
      ctx.rotate((backRot * Math.PI) / 180);

      const fitScale = Math.min(baseWidth / img.width, baseHeight / img.height);
      const drawWidth = img.width * fitScale * backZoom;
      const drawHeight = img.height * fitScale * backZoom;

      ctx.filter = `brightness(${backBright}%) contrast(${backContrast}%)`;
      ctx.drawImage(img, -drawWidth / 2, -drawHeight / 2, drawWidth, drawHeight);
      ctx.restore();

      // Border outer
      if (borderWidth > 0) {
        ctx.strokeStyle = borderColor;
        const ratio = baseWidth / selectedDocPreset.widthMm;
        const strokePx = borderWidth * ratio;
        ctx.lineWidth = strokePx;
        ctx.strokeRect(strokePx / 2, strokePx / 2, baseWidth - strokePx, baseHeight - strokePx);
      }
    };
    img.src = backImage;
  }, [
    activeDocType,
    backImage,
    backZoom,
    backPanX,
    backPanY,
    backRot,
    backBright,
    backContrast,
    borderWidth,
    borderColor
  ]);

  // Render Final Print Assembly Sheet on dynamic viewport canvas
  useEffect(() => {
    const canvas = assemblyCanvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const cardWidthMm = selectedDocPreset.widthMm;
    const cardHeightMm = selectedDocPreset.heightMm;

    // Use current quick print settings
    const pageWidthMm = docPrintOrientation === 'portrait' ? 210 : 297;
    const pageHeightMm = docPrintOrientation === 'portrait' ? 297 : 210;
    const dpm = 300 / 25.4; // 11.81 pixels per mm

    const widthPx = Math.round(pageWidthMm * dpm);
    const heightPx = Math.round(pageHeightMm * dpm);

    canvas.width = widthPx;
    canvas.height = heightPx;

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, widthPx, heightPx);

    // Draw grid scale markers on physical sheet to guide users
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1;
    for (let x = 0; x < widthPx; x += Math.round(20 * dpm)) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, heightPx);
      ctx.stroke();
    }
    for (let y = 0; y < heightPx; y += Math.round(20 * dpm)) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(widthPx, y);
      ctx.stroke();
    }

    const cardWPx = Math.round(cardWidthMm * dpm);
    const cardHPx = Math.round(cardHeightMm * dpm);

    const centerX = widthPx / 2;
    const centerY = heightPx / 2;

    const frontSrc = frontCanvasRef.current;
    const backSrc = backCanvasRef.current;

    const drawItem = (source: HTMLCanvasElement | null, px: number, py: number, label: string) => {
      if (source && ((label === 'Front' && frontImage) || (label === 'Back' && backImage))) {
        ctx.drawImage(source, px, py, cardWPx, cardHPx);
      } else {
        ctx.strokeStyle = '#94a3b8';
        ctx.lineWidth = 3;
        ctx.setLineDash([8, 8]);
        ctx.strokeRect(px, py, cardWPx, cardHPx);
        ctx.setLineDash([]);

        ctx.fillStyle = '#f8fafc';
        ctx.fillRect(px, py, cardWPx, cardHPx);

        ctx.font = 'bold 36px font-sans';
        ctx.fillStyle = '#64748b';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`${label} Side Preview`, px + cardWPx / 2, py + cardHPx / 2);
      }
    };

    // Calculate copy alignment vertical coordinates
    const duplicateCopiesCount = docPrintCopiesMode === 'single' ? 1 : docPrintCopiesCount;

    if (layoutStyle === 'side_by_side') {
      const totalWidth = (cardWPx * 2) + Math.round(4 * dpm);
      const startX = Math.round((widthPx - totalWidth) / 2);
      
      // Calculate row offsets so they fit on the page
      const rowGapPx = Math.round(12 * dpm);
      const totalRowsHeight = (duplicateCopiesCount * cardHPx) + ((duplicateCopiesCount - 1) * rowGapPx);
      const startY = Math.round((heightPx - totalRowsHeight) / 2);

      for (let i = 0; i < duplicateCopiesCount; i++) {
        const activeY = startY + (i * (cardHPx + rowGapPx));
        drawItem(frontSrc, startX, activeY, 'Front');
        drawItem(backSrc, startX + cardWPx + Math.round(4 * dpm), activeY, 'Back');

        // Separation fold-guide
        ctx.strokeStyle = '#cbd5e1';
        ctx.lineWidth = 2;
        ctx.beginPath();
        const fx = startX + cardWPx + Math.round(2 * dpm);
        ctx.moveTo(fx, activeY - 10);
        ctx.lineTo(fx, activeY + cardHPx + 10);
        ctx.stroke();
      }

    } else if (layoutStyle === 'stacked') {
      const pairHeight = (cardHPx * 2) + Math.round(4 * dpm);
      const rowGapPx = Math.round(15 * dpm);
      const totalRowsHeight = (duplicateCopiesCount * pairHeight) + ((duplicateCopiesCount - 1) * rowGapPx);
      const startY = Math.round((heightPx - totalRowsHeight) / 2);
      const startX = Math.round(centerX - (cardWPx / 2));

      for (let i = 0; i < duplicateCopiesCount; i++) {
        const activeY = startY + (i * (pairHeight + rowGapPx));
        drawItem(frontSrc, startX, activeY, 'Front');
        drawItem(backSrc, startX, activeY + cardHPx + Math.round(4 * dpm), 'Back');

        // Fold guideline
        ctx.strokeStyle = '#cbd5e1';
        ctx.lineWidth = 2;
        ctx.beginPath();
        const fy = activeY + cardHPx + Math.round(2 * dpm);
        ctx.moveTo(startX - 20, fy);
        ctx.lineTo(startX + cardWPx + 20, fy);
        ctx.stroke();
      }

    } else if (layoutStyle === 'split') {
      // Split layout: centered or stacked
      const pairHeight = (cardHPx * 2) + Math.round(42 * dpm);
      const rowGapPx = Math.round(10 * dpm);
      const totalRowsHeight = (duplicateCopiesCount * pairHeight) + ((duplicateCopiesCount - 1) * rowGapPx);
      const startY = Math.round((heightPx - totalRowsHeight) / 2);
      const startX = Math.round(centerX - (cardWPx / 2));

      for (let i = 0; i < duplicateCopiesCount; i++) {
        const activeY = startY + (i * (pairHeight + rowGapPx));
        const marginY = Math.round(42 * dpm);
        drawItem(frontSrc, startX, activeY, 'Front');
        drawItem(backSrc, startX, activeY + cardHPx + marginY, 'Back');
      }
    }

    // Pre-sync print buffer into DOM ahead of time for instant 1st-try Ctrl+P printing
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
        img.alt = 'Document Print Sheet';
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
    activeDocType,
    layoutStyle,
    frontImage,
    backImage,
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

  // Sync document print area with pre-decode and dynamic page rules
  const syncDocPrintArea = async () => {
    const canvas = assemblyCanvasRef.current;
    if (!canvas || (!frontImage && !backImage)) return false;

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
        img.alt = 'Document Print Sheet';
        printContainer.appendChild(img);
      }
      img.src = dataUrl;

      let styleEl = document.getElementById('snapid-print-style') as HTMLStyleElement | null;
      if (!styleEl) {
        styleEl = document.createElement('style');
        styleEl.id = 'snapid-print-style';
        document.head.appendChild(styleEl);
      }
      styleEl.innerHTML = `
        @media print {
          @page {
            size: A4 ${docPrintOrientation} !important;
            margin: 0mm !important;
          }
        }
      `;

      if (img.decode) {
        await img.decode().catch(() => {});
      }
      return true;
    } catch (err) {
      console.warn('Doc print sync error:', err);
      return false;
    }
  };

  // eMitra / Cyber Cafe Instant direct print system on standard A4 layout
  const handleDirectPrintDoc = async () => {
    if (!frontImage && !backImage) {
      alert(language === 'hi'
        ? 'कृपया प्रिंट या डाउनलोड करने से पहले कम से कम एक दस्तावेज़ (फ्रंट या बैक) अपलोड करें!'
        : 'Please upload at least one document side (Front or Back) first!');
      return;
    }
    const canvas = assemblyCanvasRef.current;
    if (!canvas) {
      alert(language === 'hi'
        ? 'प्रिंट एरर: लेआउट कैनवास उपलब्ध नहीं है।'
        : 'Print Error: Layout canvas is not available.');
      return;
    }
    await syncDocPrintArea();
    setTimeout(() => {
      window.print();
    }, 40);
  };

  // Instant Ctrl+P / Cmd+P Keyboard Interceptor for Documents
  useEffect(() => {
    const handleKeyDown = async (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === 'p' || e.key === 'P')) {
        if ((frontImage || backImage) && assemblyCanvasRef.current) {
          e.preventDefault();
          await syncDocPrintArea();
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
  }, [frontImage, backImage, docPrintOrientation, layoutStyle, docPrintCopiesCount, docPrintCopiesMode]);

  useEffect(() => {
    const handleBeforePrint = () => {
      syncDocPrintArea();
    };

    window.addEventListener('beforeprint', handleBeforePrint);
    return () => {
      window.removeEventListener('beforeprint', handleBeforePrint);
    };
  }, [frontImage, backImage, docPrintOrientation]);

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
        <p className={`text-xs mt-1 ${theme === 'dark' ? 'text-slate-500' : 'text-slate-500'}`}>
          {t.docSectionSubtitle}
        </p>
      </div>

      {/* Preset selection ribbon */}
      <div className={`p-4 rounded-2xl border ${
        theme === 'dark' ? 'bg-slate-950 border-slate-900' : 'bg-white border-slate-200 shadow-sm'
      } space-y-3`}>
        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block">
          {t.docSelectLabel}
        </span>
        <div className="flex flex-wrap gap-2">
          {DOCUMENT_PRESETS.map((doc) => (
            <button
              key={doc.id}
              onClick={() => setActiveDocType(doc.id)}
              className={`px-4 py-2.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                activeDocType === doc.id
                  ? 'border-blue-500 bg-blue-500/10 text-blue-500 shadow-sm'
                  : theme === 'dark' 
                    ? 'border-slate-800 hover:border-slate-750 text-slate-400 hover:text-white bg-slate-900/30'
                    : 'border-slate-200 hover:border-slate-300 text-slate-650 hover:text-slate-900 bg-slate-50'
              }`}
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
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold transition-all ${
                previewTab === 'individual'
                  ? theme === 'dark' ? 'bg-slate-900 text-white shadow-md' : 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-400 hover:text-inherit'
              }`}
            >
              <Eye className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-500" />
              <span>Align <span className="hidden sm:inline">Inputs</span> & Crop</span>
            </button>
            <button
              onClick={() => setPreviewTab('assembly')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold transition-all ${
                previewTab === 'assembly'
                  ? theme === 'dark' ? 'bg-slate-900 text-white shadow-md' : 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-400 hover:text-inherit'
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
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setActiveSide('front')}
                      className={`px-4.5 py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                        activeSide === 'front'
                          ? 'border-blue-500 bg-blue-500/10 text-blue-500'
                          : theme === 'dark' ? 'border-slate-800 text-slate-400 bg-slate-900/40' : 'border-slate-200 text-slate-650 bg-slate-50'
                      }`}
                    >
                      {t.frontSide} Side
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveSide('back')}
                      className={`px-4.5 py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                        activeSide === 'back'
                          ? 'border-blue-500 bg-blue-500/10 text-blue-500'
                          : theme === 'dark' ? 'border-slate-800 text-slate-400 bg-slate-900/40' : 'border-slate-200 text-slate-650 bg-slate-50'
                      }`}
                    >
                      {language === 'hi' ? 'पीछे' : 'Back'} Side
                    </button>
                  </div>

                  {/* Explicit Crop trigger shortcuts */}
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
                      className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                        frontOriginal 
                          ? 'border-emerald-500/30 bg-emerald-500/5 text-emerald-500 hover:bg-emerald-500/10' 
                          : 'opacity-40 cursor-not-allowed border-slate-800 text-slate-500'
                      }`}
                    >
                      <span>📐 {language === 'hi' ? 'फ्रंट क्रॉप करें' : 'Crop Front Side'}</span>
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
                      className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                        backOriginal 
                          ? 'border-emerald-500/30 bg-emerald-500/5 text-emerald-500 hover:bg-emerald-500/10' 
                          : 'opacity-40 cursor-not-allowed border-slate-800 text-slate-500'
                      }`}
                    >
                      <span>📐 {language === 'hi' ? 'बैक क्रॉप करें' : 'Crop Back Side'}</span>
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
                        style={{ aspectRatio: selectedDocPreset.aspectRatio }}
                        className={`relative w-auto h-full max-h-[290px] shadow-2xl overflow-hidden border-2 select-none cursor-move rounded-md group ${
                          theme === 'dark' ? 'border-slate-850 bg-slate-900 shadow-black' : 'border-black bg-white'
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
                      className={`text-center p-8 border-2 border-dashed rounded-xl max-w-sm transition-all duration-200 cursor-pointer ${
                        isDragOverStage 
                          ? 'border-blue-500 bg-blue-500/10 scale-[1.03] ring-4 ring-blue-500/10'
                          : theme === 'dark'
                            ? 'border-slate-800 bg-slate-900/40 hover:border-slate-700'
                            : 'border-slate-200 bg-slate-500/5 hover:border-slate-350'
                      }`}
                    >
                      <Upload className={`w-10 h-10 mx-auto mb-3 transition-colors ${isDragOverStage ? 'text-blue-500 animate-bounce' : 'text-slate-400'}`} />
                      <h4 className={`font-bold text-sm leading-snug transition-colors ${isDragOverStage ? 'text-blue-500' : ''}`}>
                        {isDragOverStage ? 'Drop to Upload Document!' : `Please Upload Scanned ${activeSide === 'front' ? 'Front' : 'Back'} Image`}
                      </h4>
                      <p className="text-xs text-slate-400 mt-1.5 max-w-xs mb-3 font-medium">
                        Drag & drop file here or use the file upload selector on the right sidebar.
                      </p>
                    </div>
                  )}
                </div>

                {/* Display active modifications tags */}
                {((activeSide === 'front' && frontImage) || (activeSide === 'back' && backImage)) && (
                  <div className="flex flex-col sm:flex-row items-center justify-between w-full gap-3 mt-4">
                    <div className="flex flex-wrap justify-center sm:justify-start gap-2 sm:gap-4 text-[10px] font-mono text-slate-550 bg-slate-500/5 px-3 py-2 rounded-xl w-full sm:w-auto">
                      <span>Target: {selectedDocPreset.widthMm}x{selectedDocPreset.heightMm}mm</span>
                      <span>Zoom: {currentZoomState.toFixed(2)}x</span>
                      <span>Rot: {currentRotState}°</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setCropModalSide(activeSide);
                        setCropModalOpen(true);
                      }}
                      className="w-full sm:w-auto px-5 py-2.5 rounded-xl text-xs font-extrabold bg-emerald-600 hover:bg-emerald-555 text-white flex items-center justify-center gap-1.5 shadow-md shadow-emerald-950/15 hover:shadow-lg transition-all cursor-pointer active:scale-95 shrink-0"
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
              <p className="text-xs text-slate-400 mt-3 font-medium text-center">
                Page assembly preset: {layoutStyle} • Placed on physical 210x297mm A4 Canvas
              </p>
            </div>
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
          <div className={`p-5 rounded-2xl border ${
            theme === 'dark' ? 'bg-slate-950 border-slate-900' : 'bg-white border-slate-200 shadow-sm'
          } space-y-4`}>
            <h3 className="font-bold text-sm tracking-tight border-b pb-2 flex items-center gap-2">
              <Upload className="w-4 h-4 text-blue-500" />
              <span>Scanned Images Upload</span>
            </h3>

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
                className={`transition-all duration-200 rounded-2xl ${
                  isDragOverFront
                    ? 'ring-2 ring-blue-500 ring-offset-2 scale-[1.01]'
                    : ''
                }`}
              >
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                  {t.uploadFrontLabel} (Auto-Crop Active)
                </span>
                
                {isDetectingFront ? (
                  <div className={`border-2 border-dashed rounded-xl p-6 text-center block bg-blue-500/5 ${
                    theme === 'dark' ? 'border-blue-500/40' : 'border-blue-500/30'
                  } animate-pulse`}>
                    <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                    <span className="text-[10px] font-extrabold text-blue-500 block uppercase tracking-widest animate-pulse">
                      AI Auto-Detecting & Cropping...
                    </span>
                  </div>
                ) : frontImage ? (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-2 rounded-xl border border-dashed border-slate-850 bg-slate-900/10">
                      <div className="flex items-center gap-2">
                        <div className="w-10 h-8 rounded bg-slate-50 border border-slate-305 overflow-hidden shadow-xs">
                          <img src={frontImage} className="w-full h-full object-cover" />
                        </div>
                        <div>
                          <span className="text-xs font-semibold block leading-tight">Front Image loaded</span>
                          <span className="text-[10px] font-medium text-emerald-500">Auto-crop applied ✓</span>
                        </div>
                      </div>
                      <div className="flex gap-1.5 items-center">
                        <button
                          type="button"
                          onClick={() => {
                            setCropModalSide('front');
                            setCropModalOpen(true);
                          }}
                          className="text-[10px] uppercase font-bold text-emerald-500 bg-emerald-500/10 hover:bg-emerald-500/15 cursor-pointer px-2 py-1 rounded transition-colors"
                        >
                          Crop (क्रॉप)
                        </button>
                        <label className="text-[10px] uppercase font-bold text-blue-500 bg-blue-500/10 hover:bg-blue-500/15 cursor-pointer px-2 py-1 rounded transition-colors block">
                          {t.changeImage}
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
                      </div>
                    </div>
                  </div>
                ) : (
                  <label className={`border-2 border-dashed rounded-xl p-4 text-center block cursor-pointer transition-all ${
                    isDragOverFront
                      ? 'border-blue-500 bg-blue-500/5'
                      : theme === 'dark' 
                        ? 'border-slate-800 bg-slate-900/20 hover:border-slate-750 hover:bg-slate-900/40' 
                        : 'border-slate-200 bg-slate-50 hover:border-slate-350 hover:bg-slate-100/50'
                  }`}>
                    <Upload className="w-4 h-4 text-blue-500 mx-auto mb-1.5 animate-bounce" />
                    <span className="text-[11px] font-bold text-slate-300 block mb-0.5">
                      Drop front side image here
                    </span>
                    <span className="text-[9px] text-slate-500 font-medium block">
                      or click to upload Aadhaar/PAN Front
                    </span>
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
                className={`transition-all duration-200 rounded-2xl ${
                  isDragOverBack
                    ? 'ring-2 ring-blue-500 ring-offset-2 scale-[1.01]'
                    : ''
                }`}
              >
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                  {t.uploadBackLabel} (Auto-Crop Active)
                </span>
                
                {isDetectingBack ? (
                  <div className={`border-2 border-dashed rounded-xl p-6 text-center block bg-blue-500/5 ${
                    theme === 'dark' ? 'border-blue-500/40' : 'border-blue-500/30'
                  } animate-pulse`}>
                    <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                    <span className="text-[10px] font-extrabold text-blue-500 block uppercase tracking-widest animate-pulse">
                      AI Auto-Detecting & Cropping...
                    </span>
                  </div>
                ) : backImage ? (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-2 rounded-xl border border-dashed border-slate-850 bg-slate-900/10">
                      <div className="flex items-center gap-2">
                        <div className="w-10 h-8 rounded bg-slate-50 border border-slate-305 overflow-hidden shadow-xs">
                          <img src={backImage} className="w-full h-full object-cover" />
                        </div>
                        <div>
                          <span className="text-xs font-semibold block leading-tight">Back Image loaded</span>
                          <span className="text-[10px] font-medium text-emerald-500">Auto-crop applied ✓</span>
                        </div>
                      </div>
                      <div className="flex gap-1.5 items-center">
                        <button
                          type="button"
                          onClick={() => {
                            setCropModalSide('back');
                            setCropModalOpen(true);
                          }}
                          className="text-[10px] uppercase font-bold text-emerald-500 bg-emerald-500/10 hover:bg-emerald-500/15 cursor-pointer px-2 py-1 rounded transition-colors"
                        >
                          Crop (क्रॉप)
                        </button>
                        <label className="text-[10px] uppercase font-bold text-blue-500 bg-blue-500/10 hover:bg-blue-500/15 cursor-pointer px-2 py-1 rounded transition-colors block">
                          {t.changeImage}
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
                      </div>
                    </div>
                  </div>
                ) : (
                  <label className={`border-2 border-dashed rounded-xl p-4 text-center block cursor-pointer transition-all ${
                    isDragOverBack
                      ? 'border-blue-500 bg-blue-500/5'
                      : theme === 'dark' 
                        ? 'border-slate-800 bg-slate-900/20 hover:border-slate-750 hover:bg-slate-900/40' 
                        : 'border-slate-200 bg-slate-50 hover:border-slate-350 hover:bg-slate-100/50'
                  }`}>
                    <Upload className="w-4 h-4 text-blue-500 mx-auto mb-1.5 animate-bounce" />
                    <span className="text-[11px] font-bold text-slate-300 block mb-0.5">
                      Drop back side image here
                    </span>
                    <span className="text-[9px] text-slate-500 font-medium block">
                      or click to upload Aadhaar/PAN Back
                    </span>
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

            {/* Document Detection Warning Card */}
            {detectionFailed && (
              <div className={`rounded-xl border p-3.5 transition-all text-xs ${
                theme === 'dark' 
                  ? 'bg-red-500/5 border-red-500/30 text-red-200' 
                  : 'bg-red-50/80 border-red-200 text-red-950 shadow-xs'
              }`}>
                {/* Collapsed Header */}
                <div 
                  onClick={() => setGuidanceExpanded(!guidanceExpanded)}
                  className="flex items-center justify-between cursor-pointer select-none font-semibold gap-2"
                >
                  <span className="flex items-center gap-1.5 leading-tight text-left">
                    <span className="text-sm shrink-0">⚠️</span>
                    <span className="text-[11px] font-bold">
                      {language === 'hi' 
                        ? '⚠️ यह छवि ऑटो क्रॉप के लिए उपयुक्त नहीं है। कारण देखने के लिए क्लिक करें।' 
                        : "⚠️ This image is not suitable for Auto Crop. Click to see why."
                      }
                    </span>
                  </span>
                  <span className="text-red-500 text-[10px] font-black shrink-0">
                    {guidanceExpanded ? '▲' : '▼'}
                  </span>
                </div>

                {/* Expanded Guidance Grid */}
                {guidanceExpanded && (
                  <div className="mt-4 pt-3 border-t border-red-500/10 space-y-4 animate-in fade-in duration-200">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                      {/* Possible Reasons */}
                      <div className="space-y-2">
                        <h4 className="font-bold text-red-500 flex items-center gap-1 text-[11px]">
                          <span>❌</span>
                          <span>{language === 'hi' ? 'संभावित कारण:' : 'Possible reasons:'}</span>
                        </h4>
                        <ul className="space-y-1.5 pl-4 list-disc text-[10.5px] text-slate-400">
                          {language === 'hi' ? (
                            <>
                              <li>दस्तावेज़ बहुत दूर है या हाथ में पकड़ा हुआ है।</li>
                              <li>सभी 4 कोने दिखाई नहीं दे रहे हैं।</li>
                              <li>फ़ोटो धुंधली, तिरछी या बहुत गहरी (डार्क) है।</li>
                              <li>दस्तावेज़ को उचित दस्तावेज़ स्कैन की तरह कैप्चर नहीं किया गया है।</li>
                            </>
                          ) : (
                            <>
                              <li>The document is too far away or held in hand.</li>
                              <li>All 4 corners are not visible.</li>
                              <li>The photo is blurry, tilted, or too dark.</li>
                              <li>The document is not captured like a proper document scan.</li>
                            </>
                          )}
                        </ul>
                      </div>

                      {/* Best Results */}
                      <div className="space-y-2">
                        <h4 className="font-bold text-emerald-500 flex items-center gap-1 text-[11px]">
                          <span>✅</span>
                          <span>{language === 'hi' ? 'सर्वोत्तम परिणाम के लिए:' : 'For best results:'}</span>
                        </h4>
                        <ul className="space-y-1.5 pl-4 list-disc text-[10.5px] text-slate-400">
                          {language === 'hi' ? (
                            <>
                              <li>दस्तावेज़ को समतल सतह पर रखें।</li>
                              <li>केवल दस्तावेज़ को कैप्चर करें।</li>
                              <li>सभी 4 कोनों को स्पष्ट रूप से दिखाई देने दें।</li>
                              <li>फ़ोटो बिल्कुल ऊपर से (सीधे) और पर्याप्त करीब से लें।</li>
                            </>
                          ) : (
                            <>
                              <li>Place the document on a flat surface.</li>
                              <li>Capture only the document.</li>
                              <li>Keep all 4 corners visible.</li>
                              <li>Take the photo from directly above and close enough.</li>
                            </>
                          )}
                        </ul>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row items-center justify-start gap-2 pt-2.5 border-t border-red-500/10">
                      <button
                        type="button"
                        onClick={() => fallbackFileInputRef.current?.click()}
                        className="w-full sm:w-auto px-3.5 py-1.5 bg-red-650 hover:bg-red-550 text-white rounded-lg font-bold text-[10.5px] shadow-sm transition-all cursor-pointer inline-flex items-center justify-center gap-1"
                      >
                        <Upload className="w-3 h-3" />
                        <span>{language === 'hi' ? 'दूसरी छवि अपलोड करें' : 'Upload Another Image'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setCropModalSide(detectionFailedSide || 'front');
                          setCropModalOpen(true);
                        }}
                        className={`w-full sm:w-auto px-3.5 py-1.5 rounded-lg font-bold text-[10.5px] border shadow-xs transition-all cursor-pointer inline-flex items-center justify-center gap-1 ${
                          theme === 'dark'
                            ? 'bg-slate-900 border-slate-850 hover:bg-slate-800 text-slate-200'
                            : 'bg-slate-100 border-slate-200 hover:bg-slate-150 text-slate-700'
                        }`}
                      >
                        <Maximize2 className="w-3 h-3 text-blue-500" />
                        <span>{language === 'hi' ? 'मैन्युअल क्रॉप करें' : 'Crop Manually'}</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
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

          {/* Panel: Image crop adjustments (Brightness/contrast, crop factors) */}
          <div className={`p-4 sm:p-5 rounded-2xl border ${
            theme === 'dark' ? 'bg-slate-950 border-slate-900' : 'bg-white border-slate-200 shadow-sm'
          } space-y-3.5`}>
            <div className="flex items-center justify-between border-b pb-2.5">
              <h3 className="font-bold text-xs sm:text-sm tracking-tight flex items-center gap-1.5">
                <Sliders className="w-4 h-4 text-blue-500" />
                <span>Crop & Image adjustments</span>
              </h3>

              {((activeSide === 'front' && frontImage) || (activeSide === 'back' && backImage)) && (
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-blue-500 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">
                    {activeSide} Side
                  </span>
                  <button
                    type="button"
                    onClick={resetActiveAdjustments}
                    title={language === 'hi' ? 'रीसेट करें' : 'Reset to default'}
                    className={`inline-flex items-center gap-1 text-[10.5px] font-semibold px-2 py-0.5 rounded-lg border transition-all cursor-pointer ${
                      theme === 'dark'
                        ? 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:text-slate-900 hover:border-slate-300'
                    }`}
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Reset</span>
                  </button>
                </div>
              )}
            </div>

            {/* Check if image loads */}
            {((activeSide === 'front' && frontImage) || (activeSide === 'back' && backImage)) ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {/* 1. Zoom */}
                <div className={`p-2.5 rounded-xl border space-y-1.5 ${
                  theme === 'dark' ? 'bg-slate-900/60 border-slate-800' : 'bg-slate-50/80 border-slate-200/80'
                }`}>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold flex items-center gap-1 text-slate-700 dark:text-slate-300">
                      <ZoomIn className="w-3.5 h-3.5 text-blue-500" />
                      <span>{t.zoomLabel}</span>
                    </span>
                    <span className="text-[11px] font-mono font-bold text-blue-600 dark:text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded">
                      {currentZoomState.toFixed(2)}x
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0.5"
                    max="3.0"
                    step="0.05"
                    value={currentZoomState}
                    onChange={(e) => updateActiveAdjustments('zoom', parseFloat(e.target.value))}
                    className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500 focus:outline-none"
                  />
                  <div className="flex justify-between text-[9px] font-mono text-slate-400">
                    <span>0.5x</span>
                    <span>1.0x</span>
                    <span>3.0x</span>
                  </div>
                </div>

                {/* 2. Rotation */}
                <div className={`p-2.5 rounded-xl border space-y-1.5 ${
                  theme === 'dark' ? 'bg-slate-900/60 border-slate-800' : 'bg-slate-50/80 border-slate-200/80'
                }`}>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold flex items-center gap-1 text-slate-700 dark:text-slate-300">
                      <RotateCw className="w-3.5 h-3.5 text-blue-500" />
                      <span>{t.rotateLabel}</span>
                    </span>
                    <span className="text-[11px] font-mono font-bold text-blue-600 dark:text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded">
                      {currentRotState}°
                    </span>
                  </div>
                  <input
                    type="range"
                    min="-180"
                    max="180"
                    step="1"
                    value={currentRotState}
                    onChange={(e) => updateActiveAdjustments('rot', parseInt(e.target.value))}
                    className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500 focus:outline-none"
                  />
                  <div className="flex justify-between text-[9px] font-mono text-slate-400">
                    <span>-180°</span>
                    <span>0°</span>
                    <span>+180°</span>
                  </div>
                </div>

                {/* 3. Brightness */}
                <div className={`p-2.5 rounded-xl border space-y-1.5 ${
                  theme === 'dark' ? 'bg-slate-900/60 border-slate-800' : 'bg-slate-50/80 border-slate-200/80'
                }`}>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold flex items-center gap-1 text-slate-700 dark:text-slate-300">
                      <Sun className="w-3.5 h-3.5 text-amber-500" />
                      <span>{t.brightnessLabel}</span>
                    </span>
                    <span className="text-[11px] font-mono font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded">
                      {currentBrightState}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="50"
                    max="160"
                    step="1"
                    value={currentBrightState}
                    onChange={(e) => updateActiveAdjustments('bright', parseInt(e.target.value))}
                    className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500 focus:outline-none"
                  />
                  <div className="flex justify-between text-[9px] font-mono text-slate-400">
                    <span>50%</span>
                    <span>100%</span>
                    <span>160%</span>
                  </div>
                </div>

                {/* 4. Contrast */}
                <div className={`p-2.5 rounded-xl border space-y-1.5 ${
                  theme === 'dark' ? 'bg-slate-900/60 border-slate-800' : 'bg-slate-50/80 border-slate-200/80'
                }`}>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold flex items-center gap-1 text-slate-700 dark:text-slate-300">
                      <Contrast className="w-3.5 h-3.5 text-indigo-500" />
                      <span>{t.contrastLabel}</span>
                    </span>
                    <span className="text-[11px] font-mono font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 px-1.5 py-0.5 rounded">
                      {currentContrastState}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="50"
                    max="160"
                    step="1"
                    value={currentContrastState}
                    onChange={(e) => updateActiveAdjustments('contrast', parseInt(e.target.value))}
                    className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500 focus:outline-none"
                  />
                  <div className="flex justify-between text-[9px] font-mono text-slate-400">
                    <span>50%</span>
                    <span>100%</span>
                    <span>160%</span>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-400 text-center py-4">
                Upload image first to unlock alignment parameters.
              </p>
            )}
          </div>

          {/* Panel: Document assembly configuration template */}
          <div className={`p-5 rounded-2xl border ${
            theme === 'dark' ? 'bg-slate-950 border-slate-900' : 'bg-white border-slate-200 shadow-sm'
          } space-y-4`}>
            <h3 className="font-bold text-sm tracking-tight border-b pb-2 flex items-center gap-2">
              <Layers className="w-4 h-4 text-blue-500" />
              <span>{t.layoutOptions}</span>
            </h3>

            <div className="space-y-2">
              {LAYOUT_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  onClick={() => setLayoutStyle(preset.id)}
                  className={`w-full text-left p-3 rounded-xl border transition-all flex flex-col gap-0.5 cursor-pointer ${
                    layoutStyle === preset.id
                      ? 'border-blue-500 bg-blue-500/5 text-blue-500'
                      : theme === 'dark' 
                        ? 'border-slate-800 hover:border-slate-750 text-slate-300 hover:text-white bg-slate-900/30'
                        : 'border-slate-200 hover:border-slate-300 text-slate-600 hover:text-slate-900 bg-slate-50'
                  }`}
                >
                  <span className="text-xs font-bold">
                    {language === 'hi' ? preset.labelHi : preset.labelEn}
                  </span>
                  <span className="text-[10px] text-slate-400 leading-normal line-clamp-2">
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
            <h4 className="font-bold text-sm tracking-tight border-b pb-2 flex items-center gap-1.5">
              <Download className="w-4 h-4 text-blue-500" />
              <span>{language === 'hi' ? 'प्रिंट और डाउनलोड सेंटर (Print & Download)' : 'Print & Download Options'}</span>
            </h4>
            <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
              {language === 'hi'
                ? 'दस्तावेज़ शीट लेआउट तैयार करें और उच्च-गुणवत्ता वाली PNG इमेज या PDF फ़ॉर्मेट तुरंत डाउनलोड करके आसानी से प्रिंट करें।'
                : 'Prepare document layouts and download high-quality PNG or PDF formatting immediately for clean, professional printing.'}
            </p>

            <div className="grid grid-cols-1 gap-2 pt-1">
              
              {/* 1. PRINT INSTANTLY */}
              <button
                type="button"
                onClick={handleDirectPrintDoc}
                className="w-full px-4.5 py-3 rounded-xl font-extrabold text-xs text-white bg-blue-600 hover:bg-blue-550 flex items-center justify-between group cursor-pointer transition-all border border-blue-500/10"
              >
                <div className="flex items-center gap-2">
                  <Printer className="w-4 h-4 shrink-0" />
                  <span>PRINT INSTANTLY (No Download)</span>
                </div>
                <span className="bg-blue-700 text-[10px] font-bold px-2 py-0.5 rounded text-blue-100">
                  Direct Print
                </span>
              </button>

              {/* 2. GENERATE LAYOUT GRID BUTTON */}
              <button
                type="button"
                onClick={() => setPreviewTab('assembly')}
                className={`w-full px-4.5 py-3 rounded-xl font-bold text-xs border flex items-center justify-between group cursor-pointer transition-all ${
                  previewTab === 'assembly'
                    ? 'bg-blue-600/10 border-blue-500/20 text-blue-500 font-semibold shadow-xs'
                    : theme === 'dark' ? 'bg-slate-900 hover:bg-slate-800 border-slate-800 text-white' : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-800'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Layout className="w-4 h-4 text-blue-400 shrink-0" />
                  <span>Generate & View print layout</span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
              </button>

              {/* 3. DOWNLOAD PNG */}
              <button
                type="button"
                onClick={downloadAssemblyPng}
                className={`w-full px-4.5 py-3 rounded-xl font-semibold text-xs border flex items-center justify-between group cursor-pointer transition-all ${
                  theme === 'dark' ? 'bg-slate-900 hover:bg-slate-800 border-slate-800 text-white' : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-800'
                }`}
              >
                <div className="flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 text-pink-400 shrink-0" />
                  <span>Download Photo Layout (PNG)</span>
                </div>
                <Download className="w-4 h-4 text-slate-400 group-hover:text-white" />
              </button>

              {/* 4. DOWNLOAD PDF */}
              <button
                type="button"
                onClick={downloadAssemblyPdf}
                className={`w-full px-4.5 py-3 rounded-xl font-semibold text-xs border flex items-center justify-between group cursor-pointer transition-all ${
                  theme === 'dark' ? 'bg-slate-900 hover:bg-slate-800 border-slate-800 text-white' : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-850'
                }`}
              >
                <div className="flex items-center gap-2">
                  <FileDown className="w-4 h-4 text-red-500 shrink-0" />
                  <span>Download Ready-to-Print PDF</span>
                </div>
                <Download className="w-4 h-4 text-slate-400 group-hover:text-white" />
              </button>

            </div>
          </div>

        </div>

      </div>

      {/* Precision Crop Modal Overlay */}
      {cropModalOpen && cropImageSrc && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-sm select-none"
          onMouseMove={handleBoxDragMove}
          onMouseUp={handleBoxDragEnd}
          onMouseLeave={handleBoxDragEnd}
          onTouchMove={handleBoxDragMoveTouch}
          onTouchEnd={handleBoxDragEnd}
        >
          <div 
            className={`w-full max-w-3xl rounded-2xl border ${
              theme === 'dark' ? 'bg-slate-950 border-slate-850 shadow-black' : 'bg-slate-900 border-slate-800 shadow-2xl'
            } p-5 flex flex-col space-y-4 text-white`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-black tracking-tight flex items-center gap-2 text-emerald-400">
                  <Sliders className="w-4 h-4" />
                  <span>Manual Precision Crop Station (मैनुअल क्रॉप स्टेशन) - {cropModalSide === 'front' ? 'FRONT' : 'BACK'}</span>
                </h3>
                <p className="text-[10px] text-slate-400 mt-0.5 leading-normal">
                  {language === 'hi' 
                    ? 'कोनों को खींचें और दस्तावेज़ के चारों ओर फिट करें। 90° रोटेशन का भी उपयोग कर सकते हैं।' 
                    : 'Drag corners of the green box to frame the document side. Aspect ratio is locked to the preset.'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setCropModalOpen(false)}
                className="p-1.5 px-3 rounded-lg text-[10px] uppercase font-bold bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all cursor-pointer border border-slate-750"
              >
                ✕ Close
              </button>
            </div>

            {/* Stage Container */}
            <div className="flex-1 flex items-center justify-center bg-slate-950 p-2 rounded-xl relative border border-slate-850 select-none overflow-hidden min-h-[300px]">
              <div 
                ref={displayContainerRef}
                className="relative max-w-full max-h-[50vh] flex items-center justify-center select-none"
              >
                <img 
                  src={cropImageSrc} 
                  onLoad={(e) => {
                    const imgEl = e.currentTarget;
                    const containerRatio = imgEl.naturalWidth / imgEl.naturalHeight;
                    const targetRatio = selectedDocPreset.widthMm / selectedDocPreset.heightMm;
                    let w = 80;
                    let h = (w / targetRatio) * containerRatio;
                    if (h > 80) {
                      h = 80;
                      w = (h * targetRatio) / containerRatio;
                    }
                    setCropBox({
                      x: (100 - w) / 2,
                      y: (100 - h) / 2,
                      w,
                      h
                    });
                  }}
                  className="max-w-full max-h-[48vh] block object-contain select-none pointer-events-none opacity-90"
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
                    className="absolute border-2 border-emerald-400 shadow-[0_0_20px_rgba(52,211,153,0.3)] z-20 transition-all duration-75 select-none"
                  >
                    {/* Centered panning handle */}
                    <div 
                      onMouseDown={(e) => startBoxDrag('move', e)}
                      onTouchStart={(e) => startBoxDragTouch('move', e)}
                      className="absolute inset-0 cursor-move bg-emerald-500/5 select-none z-10"
                    />

                    {/* Thin crosshair lines inside */}
                    <div className="absolute inset-0 border border-emerald-400/20 pointer-events-none" />

                    {/* Resize handles - 4 Corners + 4 Edge Centers (8 points total) */}
                    {/* NW - Top Left */}
                    <div 
                      onMouseDown={(e) => startBoxDrag('resize-nw', e)}
                      onTouchStart={(e) => startBoxDragTouch('resize-nw', e)}
                      className="absolute -top-3 -left-3 w-7 h-7 flex items-center justify-center cursor-nwse-resize select-none pointer-events-auto z-30 group"
                      title="Resize Top-Left"
                    >
                      <div className="w-3.5 h-3.5 bg-emerald-400 border-2 border-white rounded-full shadow-md group-hover:scale-125 group-active:scale-95 transition-all" />
                    </div>

                    {/* NE - Top Right */}
                    <div 
                      onMouseDown={(e) => startBoxDrag('resize-ne', e)}
                      onTouchStart={(e) => startBoxDragTouch('resize-ne', e)}
                      className="absolute -top-3 -right-3 w-7 h-7 flex items-center justify-center cursor-nesw-resize select-none pointer-events-auto z-30 group"
                      title="Resize Top-Right"
                    >
                      <div className="w-3.5 h-3.5 bg-emerald-400 border-2 border-white rounded-full shadow-md group-hover:scale-125 group-active:scale-95 transition-all" />
                    </div>

                    {/* SE - Bottom Right */}
                    <div 
                      onMouseDown={(e) => startBoxDrag('resize-se', e)}
                      onTouchStart={(e) => startBoxDragTouch('resize-se', e)}
                      className="absolute -bottom-3 -right-3 w-7 h-7 flex items-center justify-center cursor-nwse-resize select-none pointer-events-auto z-30 group"
                      title="Resize Bottom-Right"
                    >
                      <div className="w-3.5 h-3.5 bg-emerald-400 border-2 border-white rounded-full shadow-md group-hover:scale-125 group-active:scale-95 transition-all" />
                    </div>

                    {/* SW - Bottom Left */}
                    <div 
                      onMouseDown={(e) => startBoxDrag('resize-sw', e)}
                      onTouchStart={(e) => startBoxDragTouch('resize-sw', e)}
                      className="absolute -bottom-3 -left-3 w-7 h-7 flex items-center justify-center cursor-nesw-resize select-none pointer-events-auto z-30 group"
                      title="Resize Bottom-Left"
                    >
                      <div className="w-3.5 h-3.5 bg-emerald-400 border-2 border-white rounded-full shadow-md group-hover:scale-125 group-active:scale-95 transition-all" />
                    </div>

                    {/* N - Top / Up */}
                    <div 
                      onMouseDown={(e) => startBoxDrag('resize-n', e)}
                      onTouchStart={(e) => startBoxDragTouch('resize-n', e)}
                      className="absolute -top-3 left-1/2 -translate-x-1/2 w-8 h-7 flex items-center justify-center cursor-ns-resize select-none pointer-events-auto z-30 group"
                      title="Resize Top"
                    >
                      <div className="w-5 h-2.5 bg-emerald-400 border-2 border-white rounded-full shadow-md group-hover:scale-125 group-active:scale-95 transition-all" />
                    </div>

                    {/* S - Bottom / Down */}
                    <div 
                      onMouseDown={(e) => startBoxDrag('resize-s', e)}
                      onTouchStart={(e) => startBoxDragTouch('resize-s', e)}
                      className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-8 h-7 flex items-center justify-center cursor-ns-resize select-none pointer-events-auto z-30 group"
                      title="Resize Bottom"
                    >
                      <div className="w-5 h-2.5 bg-emerald-400 border-2 border-white rounded-full shadow-md group-hover:scale-125 group-active:scale-95 transition-all" />
                    </div>

                    {/* W - Left */}
                    <div 
                      onMouseDown={(e) => startBoxDrag('resize-w', e)}
                      onTouchStart={(e) => startBoxDragTouch('resize-w', e)}
                      className="absolute top-1/2 -left-3 -translate-y-1/2 w-7 h-8 flex items-center justify-center cursor-ew-resize select-none pointer-events-auto z-30 group"
                      title="Resize Left"
                    >
                      <div className="w-2.5 h-5 bg-emerald-400 border-2 border-white rounded-full shadow-md group-hover:scale-125 group-active:scale-95 transition-all" />
                    </div>

                    {/* E - Right */}
                    <div 
                      onMouseDown={(e) => startBoxDrag('resize-e', e)}
                      onTouchStart={(e) => startBoxDragTouch('resize-e', e)}
                      className="absolute top-1/2 -right-3 -translate-y-1/2 w-7 h-8 flex items-center justify-center cursor-ew-resize select-none pointer-events-auto z-30 group"
                      title="Resize Right"
                    >
                      <div className="w-2.5 h-5 bg-emerald-400 border-2 border-white rounded-full shadow-md group-hover:scale-125 group-active:scale-95 transition-all" />
                    </div>
                  </div>
                )}

                {/* Outer mask overlays */}
                {cropBox && (
                  <div className="absolute inset-0 pointer-events-none z-10">
                    <div className="absolute top-0 left-0 right-0 bg-slate-950/70" style={{ height: `${cropBox.y}%` }} />
                    <div className="absolute bottom-0 left-0 right-0 bg-slate-950/70" style={{ top: `${cropBox.y + cropBox.h}%` }} />
                    <div className="absolute left-0 bg-slate-950/70" style={{ top: `${cropBox.y}%`, height: `${cropBox.h}%`, width: `${cropBox.x}%` }} />
                    <div className="absolute right-0 bg-slate-950/70" style={{ top: `${cropBox.y}%`, height: `${cropBox.h}%`, left: `${cropBox.x + cropBox.w}%` }} />
                  </div>
                )}
              </div>
            </div>

            {/* Under-Modal Controls bar */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-t border-slate-800 pt-4">
              <div className="flex gap-2">
                {/* 90 Rotation button */}
                <button
                  type="button"
                  onClick={rotateOriginalImage90}
                  className="px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-850 hover:bg-slate-800 transition-all flex items-center gap-2 cursor-pointer border border-slate-750"
                >
                  <RotateCw className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                  <span>{language === 'hi' ? '90° रोटेट' : 'Rotate 90°'}</span>
                </button>
              </div>

              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setCropModalOpen(false)}
                  className="px-4.5 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-750 transition-all cursor-pointer border border-slate-750"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={applyManualCrop}
                  className="px-5 py-2.5 rounded-xl text-xs font-extrabold bg-emerald-600 hover:bg-emerald-550 transition-all cursor-pointer flex items-center gap-1.5 shadow-md shadow-emerald-950/40 text-white"
                >
                  <Check className="w-4 h-4" />
                  <span>{language === 'hi' ? 'क्रॉप सेव करें' : 'Apply Crop & Save'}</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
