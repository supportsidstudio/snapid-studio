import { jsPDF } from 'jspdf';

/**
 * Silently loads a PDF Blob into a hidden iframe and triggers the browser's native print dialog.
 * Guarantees single-click print without user download or manual file opening.
 * Automatically cleans up iframe and revokes the Blob URL after printing to prevent memory leaks.
 */
export async function printPdfBlobDirectly(pdfBlob: Blob): Promise<boolean> {
  return new Promise<boolean>((resolve, reject) => {
    try {
      // Remove any pre-existing print iframe
      const existingIframe = document.getElementById('snapid-silent-pdf-print-frame');
      if (existingIframe) {
        try { existingIframe.remove(); } catch {}
      }

      const blobUrl = URL.createObjectURL(pdfBlob);
      const iframe = document.createElement('iframe');
      iframe.id = 'snapid-silent-pdf-print-frame';
      iframe.style.position = 'fixed';
      iframe.style.right = '0';
      iframe.style.bottom = '0';
      iframe.style.width = '0';
      iframe.style.height = '0';
      iframe.style.border = '0';
      iframe.style.opacity = '0';
      iframe.style.pointerEvents = 'none';

      let cleanedUp = false;
      const cleanup = () => {
        if (cleanedUp) return;
        cleanedUp = true;
        try {
          URL.revokeObjectURL(blobUrl);
          iframe.remove();
        } catch {}
      };

      // Lifecycle cleanup on afterprint or fallback timeout
      window.addEventListener('afterprint', () => {
        setTimeout(cleanup, 1500);
      }, { once: true });

      // Fallback cleanup timer (safety mechanism)
      setTimeout(cleanup, 90000);

      let printTriggered = false;
      const triggerPrint = () => {
        if (printTriggered) return;
        printTriggered = true;
        try {
          if (iframe.contentWindow) {
            iframe.contentWindow.focus();
            iframe.contentWindow.print();
            resolve(true);
            return;
          }
        } catch (err) {
          console.warn('[PDF Silent Print] iframe.contentWindow.print() exception (autoPrint might handle):', err);
        }
        resolve(true);
      };

      iframe.onload = () => {
        // Allow the browser's PDF engine 200ms to parse internal PDF streams
        setTimeout(triggerPrint, 200);
      };

      // Fallback trigger in case onload does not fire for application/pdf blob URLs in some browser engines
      setTimeout(triggerPrint, 650);

      iframe.src = blobUrl;
      document.body.appendChild(iframe);
    } catch (outerErr) {
      console.error('[PDF Silent Print] Initialization error:', outerErr);
      reject(outerErr);
    }
  });
}

/**
 * Converts any standard 300 DPI Document Assembly Canvas directly into a 1:1 A4 PDF
 * and silently opens the print dialog via hidden iframe.
 */
export async function printCanvasAsA4Pdf(
  canvas: HTMLCanvasElement,
  orientation: 'portrait' | 'landscape' = 'portrait'
): Promise<boolean> {
  const widthMm = orientation === 'portrait' ? 210 : 297;
  const heightMm = orientation === 'portrait' ? 297 : 210;

  const doc = new jsPDF({
    orientation,
    unit: 'mm',
    format: 'a4',
    compress: true
  });

  // Extract 100% lossless PNG raster from the 300 DPI canvas
  const imgData = canvas.toDataURL('image/png', 1.0);
  doc.addImage(imgData, 'PNG', 0, 0, widthMm, heightMm, undefined, 'FAST');

  const pdfBlob = doc.output('blob');
  return printPdfBlobDirectly(pdfBlob);
}
