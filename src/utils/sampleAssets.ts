import { SAMPLE_FEMALE_PASSPORT_DATA_URL } from '../data/samplePhotoData';
export { SAMPLE_FEMALE_PASSPORT_DATA_URL };

/**
 * Converts a base64 Data URL to a standard browser File object.
 */
export function dataUrlToFile(dataUrl: string, filename: string): File {
  const arr = dataUrl.split(',');
  const mimeMatch = arr[0].match(/:(.*?);/);
  const mime = mimeMatch ? mimeMatch[1] : 'image/jpeg';
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new File([u8arr], filename, { type: mime });
}

/**
 * Get high-resolution natural female passport headshot data URL.
 */
export async function getSamplePassportPhotoDataUrl(): Promise<string> {
  // If static file is served, test if fetch works, else return embedded data URL
  try {
    const res = await fetch('/sample-female-passport.jpg');
    if (res.ok) {
      const blob = await res.blob();
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => resolve(SAMPLE_FEMALE_PASSPORT_DATA_URL);
        reader.readAsDataURL(blob);
      });
    }
  } catch {
    // Network or sandbox fallback
  }
  return SAMPLE_FEMALE_PASSPORT_DATA_URL;
}

/**
 * Generates an authentic handwritten cursive sample signature on a 600x240 canvas.
 * Simulates real fountain pen ink flow, variable line width, and clean high contrast.
 */
export function generateSampleSignatureDataUrl(): string {
  const canvas = document.createElement('canvas');
  canvas.width = 600;
  canvas.height = 240;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  // Crisp clean white paper background
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, 600, 240);

  // Subtle paper grain texture
  ctx.fillStyle = 'rgba(0, 0, 0, 0.015)';
  for (let i = 0; i < 400; i++) {
    const x = Math.random() * 600;
    const y = Math.random() * 240;
    ctx.fillRect(x, y, 1, 1);
  }

  // Draw signature in rich Royal Blue fountain pen ink
  ctx.strokeStyle = '#0d3268';
  ctx.fillStyle = '#0d3268';
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  // Helper for smooth stroke drawing
  const drawStroke = (points: [number, number][], width: number) => {
    if (points.length < 2) return;
    ctx.beginPath();
    ctx.lineWidth = width;
    ctx.moveTo(points[0][0], points[0][1]);
    for (let i = 1; i < points.length - 1; i++) {
      const xc = (points[i][0] + points[i + 1][0]) / 2;
      const yc = (points[i][1] + points[i + 1][1]) / 2;
      ctx.quadraticCurveTo(points[i][0], points[i][1], xc, yc);
    }
    ctx.lineTo(points[points.length - 1][0], points[points.length - 1][1]);
    ctx.stroke();
  };

  // Capital 'P' of Priya
  // Downstroke stem
  drawStroke([
    [70, 75],
    [72, 105],
    [75, 145],
    [78, 185],
    [74, 195],
    [70, 188]
  ], 3.8);

  // 'P' upper loop
  drawStroke([
    [72, 85],
    [95, 65],
    [130, 68],
    [142, 90],
    [135, 115],
    [105, 128],
    [76, 125]
  ], 3.2);

  // 'r-i-y-a' fluid connected cursive body
  drawStroke([
    [135, 130],
    [150, 148],
    [160, 142],
    [168, 155],
    [175, 140],
    [185, 155],
    [198, 142],
    [208, 158],
    [215, 188],
    [208, 205],
    [195, 198],
    [208, 172],
    [225, 142],
    [240, 152],
    [252, 140],
    [258, 155]
  ], 2.8);

  // Dot for 'i'
  ctx.beginPath();
  ctx.arc(175, 125, 2.2, 0, Math.PI * 2);
  ctx.fill();

  // Space & Capital 'S' of Sharma
  drawStroke([
    [285, 160],
    [305, 80],
    [325, 60],
    [345, 68],
    [330, 95],
    [298, 125],
    [310, 155],
    [340, 158],
    [358, 145]
  ], 3.5);

  // 'h-a-r-m-a' connected flow
  drawStroke([
    [355, 145],
    [365, 85],
    [375, 88],
    [378, 155],
    [385, 135],
    [398, 152],
    [412, 140],
    [420, 155],
    [432, 142],
    [442, 155],
    [452, 142],
    [465, 155],
    [478, 140],
    [485, 155],
    [495, 142],
    [505, 152]
  ], 2.6);

  // Dynamic energetic flourish underline with slight tapering
  drawStroke([
    [110, 195],
    [180, 190],
    [280, 182],
    [380, 178],
    [480, 172],
    [535, 168]
  ], 2.5);

  // End decorative twin dots under flourish
  ctx.beginPath();
  ctx.arc(520, 188, 2.0, 0, Math.PI * 2);
  ctx.arc(535, 186, 2.0, 0, Math.PI * 2);
  ctx.fill();

  return canvas.toDataURL('image/png');
}

/**
 * Generates authentic, high-resolution (1000x630 px, standard ~1.586 ratio)
 * Front & Back Aadhaar card sample images with dummy details and crisp graphics.
 */
export async function generateSampleAadhaarDocuments(): Promise<{ front: string; back: string }> {
  // Load passport headshot photo to embed on front card
  const headshotImg = new Image();
  await new Promise<void>((resolve) => {
    headshotImg.onload = () => resolve();
    headshotImg.onerror = () => resolve();
    headshotImg.src = SAMPLE_FEMALE_PASSPORT_DATA_URL;
  });

  const cardW = 1000;
  const cardH = 630;

  // ==========================================
  // 1. FRONT AADHAAR CARD
  // ==========================================
  const frontCanvas = document.createElement('canvas');
  frontCanvas.width = cardW;
  frontCanvas.height = cardH;
  const fCtx = frontCanvas.getContext('2d');

  if (fCtx) {
    // Clean off-white paper base
    fCtx.fillStyle = '#ffffff';
    fCtx.fillRect(0, 0, cardW, cardH);

    // Subtle security pattern / wavy guilloche lines in soft golden-yellow
    fCtx.strokeStyle = 'rgba(234, 179, 8, 0.08)';
    fCtx.lineWidth = 1.2;
    for (let y = 10; y < cardH; y += 14) {
      fCtx.beginPath();
      fCtx.moveTo(0, y);
      for (let x = 0; x < cardW; x += 30) {
        fCtx.quadraticCurveTo(x + 15, y + Math.sin(x / 20) * 8, x + 30, y);
      }
      fCtx.stroke();
    }

    // Top Tricolor Ribbon (Indian Flag accent band)
    fCtx.fillStyle = '#ff9933'; // Saffron
    fCtx.fillRect(0, 0, cardW, 8);
    fCtx.fillStyle = '#ffffff'; // White
    fCtx.fillRect(0, 8, cardW, 4);
    fCtx.fillStyle = '#138808'; // Green
    fCtx.fillRect(0, 12, cardW, 8);

    // Header Emblem & Titles
    // Ashoka Pillar Symbol (Golden Navy silhouette)
    fCtx.fillStyle = '#1e3a8a';
    fCtx.beginPath();
    fCtx.arc(58, 56, 20, 0, Math.PI * 2);
    fCtx.fill();
    fCtx.fillStyle = '#f59e0b';
    fCtx.font = 'bold 18px serif';
    fCtx.textAlign = 'center';
    fCtx.fillText('🏛️', 58, 62);

    // Header Text
    fCtx.textAlign = 'left';
    fCtx.fillStyle = '#1e293b';
    fCtx.font = 'bold 24px "Noto Sans Devanagari", "Mangal", sans-serif';
    fCtx.fillText('भारत सरकार', 92, 48);
    fCtx.font = 'bold 18px "Inter", sans-serif';
    fCtx.fillStyle = '#334155';
    fCtx.fillText('Government of India', 92, 72);

    // UIDAI Aadhaar Sunburst Logo on Right Header
    fCtx.fillStyle = '#dc2626'; // Aadhaar Red Logo accent
    fCtx.beginPath();
    fCtx.arc(cardW - 65, 55, 24, 0, Math.PI * 2);
    fCtx.fill();
    fCtx.fillStyle = '#ffffff';
    fCtx.font = 'bold 20px sans-serif';
    fCtx.textAlign = 'center';
    fCtx.fillText('☀️', cardW - 65, 62);

    fCtx.textAlign = 'right';
    fCtx.font = 'bold 13px sans-serif';
    fCtx.fillStyle = '#b91c1c';
    fCtx.fillText('मेरा आधार, मेरी पहचान', cardW - 100, 58);

    // Divider Line
    fCtx.strokeStyle = '#cbd5e1';
    fCtx.lineWidth = 1.5;
    fCtx.beginPath();
    fCtx.moveTo(35, 92);
    fCtx.lineTo(cardW - 35, 92);
    fCtx.stroke();

    // Portrait Photo Box on Left
    const photoX = 55;
    const photoY = 120;
    const photoW = 220;
    const photoH = 280;

    // Photo border & background
    fCtx.fillStyle = '#f1f5f9';
    fCtx.fillRect(photoX, photoY, photoW, photoH);

    // Draw Headshot
    if (headshotImg.complete && headshotImg.naturalWidth > 0) {
      fCtx.drawImage(headshotImg, photoX, photoY, photoW, photoH);
    } else {
      // Fallback headshot silhouette if image unavailable
      fCtx.fillStyle = '#e2e8f0';
      fCtx.fillRect(photoX, photoY, photoW, photoH);
      fCtx.fillStyle = '#64748b';
      fCtx.font = 'bold 14px sans-serif';
      fCtx.textAlign = 'center';
      fCtx.fillText('SAMPLE PHOTO', photoX + photoW / 2, photoY + photoH / 2);
    }

    // Photo Outer Thin Frame
    fCtx.strokeStyle = '#94a3b8';
    fCtx.lineWidth = 2;
    fCtx.strokeRect(photoX, photoY, photoW, photoH);

    // Subtle Ghost Hologram Seal over Photo
    fCtx.save();
    fCtx.globalAlpha = 0.25;
    fCtx.strokeStyle = '#0284c7';
    fCtx.lineWidth = 3;
    fCtx.beginPath();
    fCtx.arc(photoX + photoW - 40, photoY + photoH - 40, 32, 0, Math.PI * 2);
    fCtx.stroke();
    fCtx.restore();

    // Personal Details (Right of Photo)
    fCtx.textAlign = 'left';
    
    // Hindi Name
    fCtx.fillStyle = '#0f172a';
    fCtx.font = 'bold 30px "Noto Sans Devanagari", "Mangal", sans-serif';
    fCtx.fillText('प्रिया शर्मा', 315, 160);

    // English Name
    fCtx.font = 'bold 24px "Inter", -apple-system, sans-serif';
    fCtx.fillStyle = '#1e293b';
    fCtx.fillText('Priya Sharma', 315, 198);

    // Date of Birth
    fCtx.font = 'bold 17px "Noto Sans Devanagari", sans-serif';
    fCtx.fillStyle = '#475569';
    fCtx.fillText('जन्म तिथि / DOB:', 315, 252);
    fCtx.font = 'bold 19px "Inter", sans-serif';
    fCtx.fillStyle = '#0f172a';
    fCtx.fillText('15/08/1998', 475, 252);

    // Gender
    fCtx.font = 'bold 17px "Noto Sans Devanagari", sans-serif';
    fCtx.fillStyle = '#475569';
    fCtx.fillText('महिला / FEMALE', 315, 296);

    // Specimen Watermark across center
    fCtx.save();
    fCtx.translate(cardW / 2, cardH / 2);
    fCtx.rotate(-Math.PI / 12);
    fCtx.fillStyle = 'rgba(220, 38, 38, 0.12)';
    fCtx.font = '900 36px sans-serif';
    fCtx.textAlign = 'center';
    fCtx.fillText('SAMPLE SPECIMEN • DEMO ONLY', 0, 0);
    fCtx.restore();

    // Bottom Aadhaar Number Box
    const numBoxY = 445;
    fCtx.fillStyle = '#fffbeb';
    fCtx.fillRect(35, numBoxY, cardW - 70, 110);
    fCtx.strokeStyle = '#fde68a';
    fCtx.lineWidth = 1.5;
    fCtx.strokeRect(35, numBoxY, cardW - 70, 110);

    // Big Bold Aadhaar Number with Space Separation
    fCtx.textAlign = 'center';
    fCtx.fillStyle = '#b91c1c';
    fCtx.font = 'bold 42px "Courier New", monospace';
    fCtx.fillText('6842   9105   3471', cardW / 2, numBoxY + 58);

    // Tagline in red
    fCtx.fillStyle = '#b91c1c';
    fCtx.font = 'bold 15px "Noto Sans Devanagari", sans-serif';
    fCtx.fillText('आधार - आम आदमी का अधिकार', cardW / 2, numBoxY + 92);

    // Bottom Security Microtext & Card Outer Border
    fCtx.strokeStyle = '#cbd5e1';
    fCtx.lineWidth = 2;
    fCtx.strokeRect(2, 2, cardW - 4, cardH - 4);
  }

  // ==========================================
  // 2. BACK AADHAAR CARD
  // ==========================================
  const backCanvas = document.createElement('canvas');
  backCanvas.width = cardW;
  backCanvas.height = cardH;
  const bCtx = backCanvas.getContext('2d');

  if (bCtx) {
    // Clean off-white paper base
    bCtx.fillStyle = '#ffffff';
    bCtx.fillRect(0, 0, cardW, cardH);

    // Subtle wavy security pattern
    bCtx.strokeStyle = 'rgba(234, 179, 8, 0.08)';
    bCtx.lineWidth = 1.2;
    for (let y = 10; y < cardH; y += 14) {
      bCtx.beginPath();
      bCtx.moveTo(0, y);
      for (let x = 0; x < cardW; x += 30) {
        bCtx.quadraticCurveTo(x + 15, y + Math.cos(x / 20) * 8, x + 30, y);
      }
      bCtx.stroke();
    }

    // Top Header Banner
    bCtx.fillStyle = '#f8fafc';
    bCtx.fillRect(0, 0, cardW, 85);

    // Ashoka Pillar Symbol on Left
    bCtx.fillStyle = '#1e3a8a';
    bCtx.beginPath();
    bCtx.arc(58, 42, 18, 0, Math.PI * 2);
    bCtx.fill();
    bCtx.fillStyle = '#f59e0b';
    bCtx.font = 'bold 16px serif';
    bCtx.textAlign = 'center';
    bCtx.fillText('🏛️', 58, 48);

    // Header Title (UIDAI)
    bCtx.textAlign = 'left';
    bCtx.fillStyle = '#1e293b';
    bCtx.font = 'bold 20px "Noto Sans Devanagari", "Mangal", sans-serif';
    bCtx.fillText('भारतीय विशिष्ट पहचान प्राधिकरण', 90, 36);
    bCtx.font = 'bold 15px "Inter", sans-serif';
    bCtx.fillStyle = '#475569';
    bCtx.fillText('Unique Identification Authority of India', 90, 60);

    // Top divider
    bCtx.strokeStyle = '#cbd5e1';
    bCtx.lineWidth = 1.5;
    bCtx.beginPath();
    bCtx.moveTo(35, 85);
    bCtx.lineTo(cardW - 35, 85);
    bCtx.stroke();

    // Address Section (Left 62% of width)
    const addrX = 55;
    
    // Hindi Address
    bCtx.font = 'bold 16px "Noto Sans Devanagari", sans-serif';
    bCtx.fillStyle = '#0f172a';
    bCtx.fillText('पता:', addrX, 125);
    bCtx.font = '15px "Noto Sans Devanagari", sans-serif';
    bCtx.fillStyle = '#334155';
    bCtx.fillText('आत्मजा: रमेश शर्मा, मकान नं. 42-बी, शांति नगर,', addrX, 155);
    bCtx.fillText('सिविल लाइन्स, जयपुर,', addrX, 182);
    bCtx.fillText('राजस्थान - 302006', addrX, 209);

    // Divider between Hindi & English address
    bCtx.strokeStyle = '#e2e8f0';
    bCtx.lineWidth = 1;
    bCtx.beginPath();
    bCtx.moveTo(addrX, 230);
    bCtx.lineTo(addrX + 480, 230);
    bCtx.stroke();

    // English Address
    bCtx.font = 'bold 15px "Inter", sans-serif';
    bCtx.fillStyle = '#0f172a';
    bCtx.fillText('Address:', addrX, 260);
    bCtx.font = '14px "Inter", sans-serif';
    bCtx.fillStyle = '#334155';
    bCtx.fillText('D/O: Ramesh Sharma, H. No. 42-B, Shanti Nagar,', addrX, 288);
    bCtx.fillText('Civil Lines, Jaipur,', addrX, 312);
    bCtx.fillText('Rajasthan - 302006', addrX, 336);

    // Realistic QR Code Box on Right side
    const qrX = 640;
    const qrY = 115;
    const qrSize = 275;

    bCtx.fillStyle = '#ffffff';
    bCtx.fillRect(qrX, qrY, qrSize, qrSize);
    bCtx.strokeStyle = '#94a3b8';
    bCtx.lineWidth = 1.5;
    bCtx.strokeRect(qrX, qrY, qrSize, qrSize);

    // Draw QR pattern simulation (authentic geometric 2D matrix look)
    bCtx.fillStyle = '#0f172a';
    const gridCols = 25;
    const cellSize = qrSize / gridCols;

    // Corner Position Detection Markers (Top-Left, Top-Right, Bottom-Left)
    const drawFinderMarker = (cx: number, cy: number) => {
      bCtx.fillRect(cx, cy, cellSize * 7, cellSize * 7);
      bCtx.fillStyle = '#ffffff';
      bCtx.fillRect(cx + cellSize, cy + cellSize, cellSize * 5, cellSize * 5);
      bCtx.fillStyle = '#0f172a';
      bCtx.fillRect(cx + cellSize * 2, cy + cellSize * 2, cellSize * 3, cellSize * 3);
    };

    drawFinderMarker(qrX + cellSize, qrY + cellSize);
    drawFinderMarker(qrX + qrSize - cellSize * 8, qrY + cellSize);
    drawFinderMarker(qrX + cellSize, qrY + qrSize - cellSize * 8);

    // Random but deterministic data modules
    let seed = 42;
    const pseudoRandom = () => {
      seed = (seed * 9301 + 49297) % 233280;
      return seed / 233280;
    };

    bCtx.fillStyle = '#0f172a';
    for (let r = 0; r < gridCols; r++) {
      for (let c = 0; c < gridCols; c++) {
        // Skip finder areas
        const isFinderTL = r < 8 && c < 8;
        const isFinderTR = r < 8 && c >= gridCols - 8;
        const isFinderBL = r >= gridCols - 8 && c < 8;
        const isCenterAadhaarEmblem = r >= 10 && r <= 14 && c >= 10 && c <= 14;

        if (!isFinderTL && !isFinderTR && !isFinderBL && !isCenterAadhaarEmblem) {
          if (pseudoRandom() > 0.52) {
            bCtx.fillRect(qrX + c * cellSize, qrY + r * cellSize, cellSize - 0.5, cellSize - 0.5);
          }
        }
      }
    }

    // Small Red Center Dot in QR
    bCtx.fillStyle = '#dc2626';
    bCtx.beginPath();
    bCtx.arc(qrX + qrSize / 2, qrY + qrSize / 2, 14, 0, Math.PI * 2);
    bCtx.fill();

    bCtx.fillStyle = '#ffffff';
    bCtx.font = 'bold 9px sans-serif';
    bCtx.textAlign = 'center';
    bCtx.fillText('UIDAI', qrX + qrSize / 2, qrY + qrSize / 2 + 3);

    // Specimen Watermark
    bCtx.save();
    bCtx.translate(cardW / 2, cardH / 2);
    bCtx.rotate(-Math.PI / 12);
    bCtx.fillStyle = 'rgba(220, 38, 38, 0.12)';
    bCtx.font = '900 36px sans-serif';
    bCtx.textAlign = 'center';
    bCtx.fillText('SAMPLE SPECIMEN • DEMO ONLY', 0, 0);
    bCtx.restore();

    // Bottom Aadhaar Number Box (Matches Front)
    const numBoxY = 445;
    bCtx.fillStyle = '#fffbeb';
    bCtx.fillRect(35, numBoxY, cardW - 70, 110);
    bCtx.strokeStyle = '#fde68a';
    bCtx.lineWidth = 1.5;
    bCtx.strokeRect(35, numBoxY, cardW - 70, 110);

    // Big Bold Aadhaar Number
    bCtx.textAlign = 'center';
    bCtx.fillStyle = '#b91c1c';
    bCtx.font = 'bold 42px "Courier New", monospace';
    bCtx.fillText('6842   9105   3471', cardW / 2, numBoxY + 58);

    // Contact info in footer
    bCtx.fillStyle = '#475569';
    bCtx.font = 'bold 13px sans-serif';
    bCtx.fillText('📞 1947   |   ✉️ help@uidai.gov.in   |   🌐 www.uidai.gov.in', cardW / 2, numBoxY + 92);

    // Card Outer Border
    bCtx.strokeStyle = '#cbd5e1';
    bCtx.lineWidth = 2;
    bCtx.strokeRect(2, 2, cardW - 4, cardH - 4);
  }

  return {
    front: frontCanvas.toDataURL('image/jpeg', 0.95),
    back: backCanvas.toDataURL('image/jpeg', 0.95),
  };
}
