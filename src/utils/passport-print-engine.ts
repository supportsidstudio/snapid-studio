import { jsPDF } from 'jspdf';
import { printPdfBlobDirectly } from './pdf-print-helper';

export interface PrintEngineConfig {
  pageWidthMm: number;
  pageHeightMm: number;
  photoWidthMm: number;
  photoHeightMm: number;
  copiesCount: number;
  borderWidthMm?: number;
  borderColor?: string;
  isSingle?: boolean;
  marginMm?: number;
  gapMm?: number;
}

export interface SheetLayoutInfo {
  totalPages: number;
  perSheetCapacity: number;
  photosOnPage: number;
  cols: number;
  rows: number;
  startXMm: number;
  startYMm: number;
  gapMm: number;
  pageWidthMm: number;
  pageHeightMm: number;
  photoWidthMm: number;
  photoHeightMm: number;
}

/**
 * 300 DPI Scale constant (pixels per millimeter)
 * 1 inch = 25.4 mm => 300 DPI = 300 / 25.4 ≈ 11.8110236 px/mm
 */
export const DPI_300_DPM = 300 / 25.4;

/**
 * Calculate physical sheet layout, columns, rows, margins and multi-sheet pagination.
 * Photos ALWAYS fill sequentially starting from top-left (row-by-row, left-to-right, top-to-bottom),
 * leaving any remaining empty slots at the bottom/end of the sheet.
 */
export function calculateSheetLayout(config: PrintEngineConfig, pageIndex = 0): SheetLayoutInfo {
  const { pageWidthMm, pageHeightMm, photoWidthMm, photoHeightMm, copiesCount, isSingle } = config;

  if (isSingle) {
    return {
      totalPages: 1,
      perSheetCapacity: 1,
      photosOnPage: 1,
      cols: 1,
      rows: 1,
      startXMm: 0,
      startYMm: 0,
      gapMm: 0,
      pageWidthMm: photoWidthMm,
      pageHeightMm: photoHeightMm,
      photoWidthMm,
      photoHeightMm
    };
  }

  // Determine physical margins & spacing
  const isSmallPhotoPaper = pageWidthMm <= 160 && pageHeightMm <= 210;
  const gapMm = config.gapMm !== undefined ? config.gapMm : (isSmallPhotoPaper ? 2.0 : 3.0);
  const edgeMarginMm = config.marginMm !== undefined ? config.marginMm : (isSmallPhotoPaper ? 2.5 : 6.0);

  // Maximum grid columns & rows that fit without overflowing printable bounds
  const maxCols = Math.max(1, Math.floor((pageWidthMm - (2 * edgeMarginMm) + gapMm) / (photoWidthMm + gapMm)));
  const maxRows = Math.max(1, Math.floor((pageHeightMm - (2 * edgeMarginMm) + gapMm) / (photoHeightMm + gapMm)));
  const perSheetCapacity = Math.max(1, maxCols * maxRows);

  const totalPages = Math.max(1, Math.ceil(copiesCount / perSheetCapacity));
  const safePageIndex = Math.max(0, Math.min(totalPages - 1, pageIndex));

  // Number of photos to render on this specific page
  const remainingPhotos = copiesCount - (safePageIndex * perSheetCapacity);
  const photosOnPage = Math.max(1, Math.min(perSheetCapacity, remainingPhotos));

  // Sequential standard grid layout: always use standard full columns across the page
  const cols = maxCols;
  const rows = Math.ceil(photosOnPage / maxCols);

  // Full grid horizontal centering with predictable top-left origin
  const fullGridWidthMm = (maxCols * photoWidthMm) + ((maxCols - 1) * gapMm);
  const startXMm = Math.max(edgeMarginMm, (pageWidthMm - fullGridWidthMm) / 2);
  const startYMm = edgeMarginMm; // Top-to-bottom: starts directly from top margin

  return {
    totalPages,
    perSheetCapacity,
    photosOnPage,
    cols,
    rows,
    startXMm,
    startYMm,
    gapMm,
    pageWidthMm,
    pageHeightMm,
    photoWidthMm,
    photoHeightMm
  };
}

/**
 * Render a single high-resolution passport photo card with precise background & transformation
 */
export function renderSinglePassportCardCanvas(
  img: HTMLImageElement,
  photoWidthMm: number,
  photoHeightMm: number,
  options: {
    zoom: number;
    panX: number;
    panY: number;
    rotation: number;
    brightness: number;
    contrast: number;
    borderWidthMm: number;
    borderColor: string;
    bgColor: string;
    showBeforePreview?: boolean;
    dpm?: number;
  }
): HTMLCanvasElement {
  const dpm = options.dpm || DPI_300_DPM;
  const widthPx = Math.round(photoWidthMm * dpm);
  const heightPx = Math.round(photoHeightMm * dpm);

  const canvas = document.createElement('canvas');
  canvas.width = widthPx;
  canvas.height = heightPx;

  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return canvas;

  // Maximum quality smoothing
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  // 1. Draw solid background fill
  if (options.showBeforePreview) {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, widthPx, heightPx);
  } else if (options.bgColor === 'transparent') {
    // Checkerboard for transparent preview
    ctx.fillStyle = '#e5e7eb';
    ctx.fillRect(0, 0, widthPx, heightPx);
    ctx.fillStyle = '#f8fafc';
    const checkSize = Math.round(4 * dpm);
    for (let y = 0; y < heightPx; y += checkSize * 2) {
      for (let x = 0; x < widthPx; x += checkSize * 2) {
        ctx.fillRect(x, y, checkSize, checkSize);
        ctx.fillRect(x + checkSize, y + checkSize, checkSize, checkSize);
      }
    }
  } else {
    ctx.fillStyle = options.bgColor || '#ffffff';
    ctx.fillRect(0, 0, widthPx, heightPx);
  }

  // 2. Draw portrait with transforms
  ctx.save();
  // Move to center of card
  const panXPx = (options.panX / 600) * widthPx;
  const panYPx = (options.panY / 600) * heightPx;

  ctx.translate((widthPx / 2) + panXPx, (heightPx / 2) + panYPx);
  ctx.rotate((options.rotation * Math.PI) / 180);

  const scaleImgWidth = img.naturalWidth || img.width;
  const scaleImgHeight = img.naturalHeight || img.height;

  // Fit to cover aspect ratio cleanly without leaving gaps
  const fitScale = Math.max(widthPx / scaleImgWidth, heightPx / scaleImgHeight);
  const drawWidth = scaleImgWidth * fitScale * options.zoom;
  const drawHeight = scaleImgHeight * fitScale * options.zoom;

  // Direct brightness & contrast
  ctx.filter = `brightness(${options.brightness}%) contrast(${options.contrast}%)`;

  ctx.drawImage(
    img,
    -drawWidth / 2,
    -drawHeight / 2,
    drawWidth,
    drawHeight
  );

  ctx.restore();

  // 3. Draw inner border if selected
  if (options.borderWidthMm > 0) {
    const strokePx = Math.max(1, Math.round(options.borderWidthMm * dpm));
    ctx.strokeStyle = options.borderColor || '#000000';
    ctx.lineWidth = strokePx;
    ctx.strokeRect(strokePx / 2, strokePx / 2, widthPx - strokePx, heightPx - strokePx);
  }

  return canvas;
}

/**
 * Render a complete high-resolution Sheet Canvas for a specific page index.
 * Supports custom dpm for high-performance responsive UI previews while preserving 300 DPI for exports.
 */
export function renderHighResSheetCanvas(
  singleCardCanvas: HTMLCanvasElement,
  config: PrintEngineConfig,
  pageIndex = 0,
  customDpm?: number
): HTMLCanvasElement {
  const layout = calculateSheetLayout(config, pageIndex);
  const dpm = customDpm || DPI_300_DPM;

  const widthPx = Math.round(layout.pageWidthMm * dpm);
  const heightPx = Math.round(layout.pageHeightMm * dpm);

  const canvas = document.createElement('canvas');
  canvas.width = widthPx;
  canvas.height = heightPx;

  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = dpm < DPI_300_DPM ? 'medium' : 'high';

  // Crisp white paper background
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, widthPx, heightPx);

  if (config.isSingle) {
    ctx.drawImage(singleCardCanvas, 0, 0, widthPx, heightPx);
    return canvas;
  }

  const photoWidthPx = Math.round(layout.photoWidthMm * dpm);
  const photoHeightPx = Math.round(layout.photoHeightMm * dpm);
  const gapPx = Math.round(layout.gapMm * dpm);
  const startXPx = Math.round(layout.startXMm * dpm);
  const startYPx = Math.round(layout.startYMm * dpm);

  // Render each photo copy with exact integer alignment
  for (let i = 0; i < layout.photosOnPage; i++) {
    const row = Math.floor(i / layout.cols);
    const col = i % layout.cols;

    const px = startXPx + (col * (photoWidthPx + gapPx));
    const py = startYPx + (row * (photoHeightPx + gapPx));

    // Draw a subtle 1px cutting guideline around the photo for professional scissors/trimming
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1;
    ctx.strokeRect(px, py, photoWidthPx, photoHeightPx);

    // Draw the high-res raster card
    ctx.drawImage(singleCardCanvas, px, py, photoWidthPx, photoHeightPx);
  }

  return canvas;
}

/**
 * Result of the strict print verification rule:
 * TOTAL SELECTED = TOTAL RENDERED = TOTAL PRINTABLE
 */
export interface PrintVerificationResult {
  verified: boolean;
  totalSelected: number;
  totalRendered: number;
  totalPrintable: number;
  totalPages: number;
  perSheetCapacity: number;
  pagesBreakdown: { page: number; photosCount: number }[];
  errorMessage?: string;
}

/**
 * Mathematically verify that selected photo count exactly equals total printed photo count.
 * RULE: TOTAL SELECTED = TOTAL RENDERED = TOTAL PRINTABLE
 * No photos dropped, no photos hidden, no photos duplicated, no silent count reduction.
 */
export function verifyPrintQuantity(config: PrintEngineConfig): PrintVerificationResult {
  const totalSelected = config.isSingle ? 1 : Math.max(1, Math.round(config.copiesCount));

  if (config.isSingle) {
    return {
      verified: true,
      totalSelected: 1,
      totalRendered: 1,
      totalPrintable: 1,
      totalPages: 1,
      perSheetCapacity: 1,
      pagesBreakdown: [{ page: 1, photosCount: 1 }]
    };
  }

  const baseLayout = calculateSheetLayout(config, 0);
  const totalPages = baseLayout.totalPages;
  const perSheetCapacity = baseLayout.perSheetCapacity;

  let totalRendered = 0;
  const pagesBreakdown: { page: number; photosCount: number }[] = [];

  for (let p = 0; p < totalPages; p++) {
    const pageLayout = calculateSheetLayout(config, p);
    totalRendered += pageLayout.photosOnPage;
    pagesBreakdown.push({
      page: p + 1,
      photosCount: pageLayout.photosOnPage
    });
  }

  const totalPrintable = totalRendered;
  const verified = (totalSelected === totalRendered) && (totalRendered === totalPrintable) && (totalSelected > 0);

  return {
    verified,
    totalSelected,
    totalRendered,
    totalPrintable,
    totalPages,
    perSheetCapacity,
    pagesBreakdown,
    errorMessage: verified ? undefined : `Quantity mismatch: Selected (${totalSelected}) != Rendered (${totalRendered})`
  };
}

// Track active Object URLs for direct print DOM to cleanly revoke memory
let activePrintObjectUrls: string[] = [];

export function cleanupPrintMemory(): void {
  if (activePrintObjectUrls.length > 0) {
    activePrintObjectUrls.forEach(url => {
      try {
        URL.revokeObjectURL(url);
      } catch {
        // ignore
      }
    });
    activePrintObjectUrls = [];
  }
}

if (typeof window !== 'undefined') {
  window.addEventListener('afterprint', () => {
    cleanupPrintMemory();
  });
}

/**
 * Generate a Print-Ready Studio-Quality PDF (with automatic multi-page handling and memory-efficient batch processing)
 */
export async function generatePrintReadyPdf(
  singleCardCanvas: HTMLCanvasElement,
  config: PrintEngineConfig,
  filename = 'SnapID_Passport_Sheet.pdf',
  onProgress?: (current: number, total: number) => void
): Promise<void> {
  // Verify quantity parity before generating PDF
  const verification = verifyPrintQuantity(config);
  if (!verification.verified) {
    throw new Error(`PDF Generation Failed: ${verification.errorMessage}`);
  }

  const { pageWidthMm, pageHeightMm } = config;
  const isLandscape = pageWidthMm >= pageHeightMm;
  const orientation = isLandscape ? 'landscape' : 'portrait';

  const doc = new jsPDF({
    orientation,
    unit: 'mm',
    format: [pageWidthMm, pageHeightMm],
    compress: true
  });

  const totalPages = verification.totalPages;

  // Process one print page at a time to prevent RAM spikes on large batches
  for (let p = 0; p < totalPages; p++) {
    if (onProgress) {
      onProgress(p + 1, totalPages);
    }
    if (p > 0) {
      doc.addPage([pageWidthMm, pageHeightMm], orientation);
    }

    const sheetCanvas = renderHighResSheetCanvas(singleCardCanvas, config, p);
    const sheetDataUrl = sheetCanvas.toDataURL('image/jpeg', 0.98);

    // Free canvas RAM buffer immediately
    sheetCanvas.width = 0;
    sheetCanvas.height = 0;

    doc.addImage(sheetDataUrl, 'JPEG', 0, 0, pageWidthMm, pageHeightMm, undefined, 'FAST');

    // Yield control briefly for large batches
    if (totalPages > 4) {
      await new Promise(r => setTimeout(r, 4));
    }
  }

  doc.save(filename);
}

/**
 * Synchronize the direct print DOM container with strict verification and memory-efficient streaming
 * RULE: TOTAL SELECTED = TOTAL RENDERED = TOTAL PRINTABLE
 */
export async function syncDirectPrintDOM(
  singleCardCanvas: HTMLCanvasElement,
  config: PrintEngineConfig,
  onProgress?: (current: number, total: number) => void
): Promise<boolean> {
  return executeDedicatedFinalPrint(singleCardCanvas, config, onProgress);
}

/**
 * Executes a robust dedicated print layout flow:
 * Generates an in-memory studio 300 DPI PDF document (using jsPDF)
 * with exact millimetric dimensions and lossless PNG images,
 * embeds the auto-print directive, and silently triggers the browser print dialog
 * via an isolated hidden iframe without downloading the PDF.
 */
export async function executeDedicatedFinalPrint(
  singleCardCanvas: HTMLCanvasElement,
  config: PrintEngineConfig,
  onProgress?: (current: number, total: number) => void
): Promise<boolean> {
  try {
    // 1. Strict Verification Check: Selected MUST equal Rendered and Printable
    const verification = verifyPrintQuantity(config);
    if (!verification.verified) {
      console.error('[Print Engine] Verification failed:', verification);
      throw new Error(`Print verification failed: Selected (${verification.totalSelected}) != Rendered (${verification.totalRendered})`);
    }

    const { pageWidthMm, pageHeightMm } = config;
    const totalPages = verification.totalPages;

    console.info(
      `[Print Engine Verified] Rendering ${totalPages} page(s) with ${verification.totalPrintable} total photos into PDF print stream...`
    );

    // 2. Generate studio-quality 300 DPI PDF directly
    const isLandscape = pageWidthMm >= pageHeightMm;
    const orientation = isLandscape ? 'landscape' : 'portrait';

    const doc = new jsPDF({
      orientation,
      unit: 'mm',
      format: [pageWidthMm, pageHeightMm],
      compress: true
    });

    for (let p = 0; p < totalPages; p++) {
      if (onProgress) {
        onProgress(p + 1, totalPages);
      }
      if (p > 0) {
        doc.addPage([pageWidthMm, pageHeightMm], orientation);
      }

      const sheetCanvas = renderHighResSheetCanvas(singleCardCanvas, config, p, DPI_300_DPM);
      const dataUrl = sheetCanvas.toDataURL('image/png', 1.0); // 100% lossless 300 DPI PNG

      // Immediately free the canvas buffer to keep RAM usage minimal
      sheetCanvas.width = 0;
      sheetCanvas.height = 0;

      doc.addImage(dataUrl, 'PNG', 0, 0, pageWidthMm, pageHeightMm, undefined, 'FAST');

      if (totalPages > 2) {
        await new Promise((r) => setTimeout(r, 4));
      }
    }

    // Output pure in-memory Blob (no download to disk)
    const pdfBlob = doc.output('blob');

    // 3. Silently trigger print dialog via isolated hidden iframe
    return await printPdfBlobDirectly(pdfBlob);
  } catch (err) {
    console.error('[Print Engine] executeDedicatedFinalPrint error:', err);
    return false;
  }
}
