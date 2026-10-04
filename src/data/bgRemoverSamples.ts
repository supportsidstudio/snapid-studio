/**
 * Demo sample photos for testing high-accuracy background removal across
 * all categories: People (hair), Products (clean edges), Animals (fur), and Glass (transparency).
 */

import { SAMPLE_FEMALE_PASSPORT_DATA_URL } from './samplePhotoData';

export interface BgSampleItem {
  id: string;
  category: 'people' | 'product' | 'animal' | 'glass';
  titleEn: string;
  titleHi: string;
  badge: string;
  descEn: string;
  getDataUrl: () => Promise<string> | string;
}

/**
 * Generates an authentic high-resolution product demo:
 * Modern athletic sneaker with clean laces, mesh texture, dynamic gradient backdrop,
 * and ground shadow. Perfect for demonstrating product edge segmentation.
 */
export function generateProductSampleDataUrl(): string {
  const canvas = document.createElement('canvas');
  canvas.width = 900;
  canvas.height = 700;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  // Gradient background (studio photoshoot backdrop)
  const bgGrad = ctx.createLinearGradient(0, 0, 900, 700);
  bgGrad.addColorStop(0, '#e0e7ff');
  bgGrad.addColorStop(0.5, '#f1f5f9');
  bgGrad.addColorStop(1, '#cbd5e1');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, 900, 700);

  // Soft studio podium / spotlight
  ctx.save();
  ctx.beginPath();
  ctx.ellipse(450, 480, 320, 60, 0, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(15, 23, 42, 0.15)';
  ctx.filter = 'blur(12px)';
  ctx.fill();
  ctx.restore();

  // Draw Sneaker Silhouette & Details
  ctx.save();
  ctx.translate(180, 200);

  // Sole (White & Cyber Orange)
  ctx.beginPath();
  ctx.moveTo(30, 220);
  ctx.bezierCurveTo(40, 250, 120, 260, 260, 250);
  ctx.bezierCurveTo(380, 245, 480, 230, 520, 200);
  ctx.bezierCurveTo(530, 185, 510, 180, 480, 185);
  ctx.bezierCurveTo(360, 200, 240, 210, 120, 205);
  ctx.bezierCurveTo(50, 200, 25, 205, 30, 220);
  ctx.closePath();
  ctx.fillStyle = '#ffffff';
  ctx.fill();
  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 3;
  ctx.stroke();

  // Sole air cushion accent (Electric Blue / Orange)
  ctx.beginPath();
  ctx.roundRect(140, 220, 120, 22, 10);
  ctx.fillStyle = '#f97316';
  ctx.fill();

  // Shoe Upper Body (Deep Navy & Neon Teal mesh)
  ctx.beginPath();
  ctx.moveTo(35, 205);
  ctx.bezierCurveTo(50, 120, 100, 80, 150, 65);
  ctx.bezierCurveTo(200, 50, 270, 70, 320, 110);
  ctx.bezierCurveTo(390, 130, 440, 150, 480, 175);
  ctx.bezierCurveTo(490, 185, 450, 195, 360, 205);
  ctx.closePath();
  const upperGrad = ctx.createLinearGradient(100, 60, 400, 200);
  upperGrad.addColorStop(0, '#1e3a8a');
  upperGrad.addColorStop(0.6, '#0284c7');
  upperGrad.addColorStop(1, '#0f172a');
  ctx.fillStyle = upperGrad;
  ctx.fill();

  // Heel Collar & Padding
  ctx.beginPath();
  ctx.moveTo(60, 150);
  ctx.bezierCurveTo(80, 70, 140, 40, 180, 45);
  ctx.bezierCurveTo(200, 50, 190, 80, 170, 95);
  ctx.closePath();
  ctx.fillStyle = '#06b6d4';
  ctx.fill();

  // Laces criss-cross
  ctx.strokeStyle = '#f8fafc';
  ctx.lineWidth = 4;
  ctx.lineCap = 'round';
  const lacePoints: [number, number, number, number][] = [
    [220, 75, 260, 95],
    [240, 90, 280, 110],
    [265, 105, 305, 125],
    [290, 120, 335, 140],
    [320, 135, 365, 155]
  ];
  lacePoints.forEach(([x1, y1, x2, y2]) => {
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  });

  // Dynamic Nike-style Swoosh Wing Emblem
  ctx.beginPath();
  ctx.moveTo(160, 165);
  ctx.bezierCurveTo(260, 140, 360, 110, 430, 80);
  ctx.bezierCurveTo(370, 130, 280, 185, 190, 185);
  ctx.bezierCurveTo(170, 185, 155, 175, 160, 165);
  ctx.fillStyle = '#e11d48';
  ctx.fill();

  ctx.restore();

  // Product Tag Watermark
  ctx.fillStyle = '#334155';
  ctx.font = 'bold 20px -apple-system, sans-serif';
  ctx.fillText('SNAPID E-COMMERCE SAMPLE • PRODUCT PHOTO', 220, 630);

  return canvas.toDataURL('image/jpeg', 0.92);
}

/**
 * Generates an authentic animal sample:
 * Cute fluffy Golden Dog with fine fur strands, floppy ears, and whiskers against a park grass backdrop.
 * Ideal for testing fine fur and whisker matting.
 */
export function generateAnimalSampleDataUrl(): string {
  const canvas = document.createElement('canvas');
  canvas.width = 800;
  canvas.height = 700;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  // Outdoor bokeh blurred nature background
  const natureGrad = ctx.createLinearGradient(0, 0, 800, 700);
  natureGrad.addColorStop(0, '#86efac');
  natureGrad.addColorStop(0.4, '#4ade80');
  natureGrad.addColorStop(1, '#15803d');
  ctx.fillStyle = natureGrad;
  ctx.fillRect(0, 0, 800, 700);

  // Soft bokeh circles in background
  ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
  for (let i = 0; i < 18; i++) {
    const bx = (i * 123) % 800;
    const by = (i * 241) % 400;
    ctx.beginPath();
    ctx.arc(bx, by, 35 + (i % 5) * 15, 0, Math.PI * 2);
    ctx.fill();
  }

  // Dog Head & Body (Golden Retriever)
  const cx = 400;
  const cy = 380;

  // Chest / Shoulders
  ctx.beginPath();
  ctx.ellipse(cx, cy + 180, 220, 140, 0, 0, Math.PI * 2);
  ctx.fillStyle = '#d97706';
  ctx.fill();

  // Head base
  ctx.beginPath();
  ctx.ellipse(cx, cy, 150, 140, 0, 0, Math.PI * 2);
  ctx.fillStyle = '#f59e0b';
  ctx.fill();

  // Floppy Ears with fur texture
  ctx.beginPath();
  ctx.ellipse(cx - 140, cy - 20, 50, 110, -Math.PI / 10, 0, Math.PI * 2);
  ctx.fillStyle = '#b45309';
  ctx.fill();

  ctx.beginPath();
  ctx.ellipse(cx + 140, cy - 20, 50, 110, Math.PI / 10, 0, Math.PI * 2);
  ctx.fillStyle = '#b45309';
  ctx.fill();

  // Snout / Muzzle
  ctx.beginPath();
  ctx.ellipse(cx, cy + 45, 75, 60, 0, 0, Math.PI * 2);
  ctx.fillStyle = '#fde68a';
  ctx.fill();

  // Cute Black Nose
  ctx.beginPath();
  ctx.ellipse(cx, cy + 25, 32, 22, 0, 0, Math.PI * 2);
  ctx.fillStyle = '#0f172a';
  ctx.fill();

  // Warm Shiny Eyes
  const drawEye = (ex: number) => {
    ctx.beginPath();
    ctx.arc(ex, cy - 35, 20, 0, Math.PI * 2);
    ctx.fillStyle = '#451a03';
    ctx.fill();
    // Catchlight
    ctx.beginPath();
    ctx.arc(ex - 6, cy - 40, 6, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
  };
  drawEye(cx - 55);
  drawEye(cx + 55);

  // Fine Fur Strands on head contour (for testing hair/fur matting)
  ctx.strokeStyle = '#fef3c7';
  ctx.lineWidth = 1.5;
  for (let a = -Math.PI * 0.8; a < Math.PI * -0.2; a += 0.05) {
    const fx = cx + Math.cos(a) * 148;
    const fy = cy + Math.sin(a) * 138;
    ctx.beginPath();
    ctx.moveTo(fx, fy);
    ctx.lineTo(fx + Math.cos(a) * 22, fy + Math.sin(a) * 22);
    ctx.stroke();
  }

  // Whiskers
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
  ctx.lineWidth = 1.8;
  const drawWhiskers = (sign: number) => {
    for (let i = -1; i <= 1; i++) {
      ctx.beginPath();
      ctx.moveTo(cx + sign * 35, cy + 45 + i * 10);
      ctx.quadraticCurveTo(cx + sign * 90, cy + 40 + i * 18, cx + sign * 140, cy + 50 + i * 25);
      ctx.stroke();
    }
  };
  drawWhiskers(1);
  drawWhiskers(-1);

  // Red Collar
  ctx.beginPath();
  ctx.roundRect(cx - 100, cy + 170, 200, 26, 8);
  ctx.fillStyle = '#dc2626';
  ctx.fill();

  ctx.fillStyle = '#1e293b';
  ctx.font = 'bold 18px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('SNAPID PET SAMPLE • FINE FUR & WHISKERS', 400, 660);

  return canvas.toDataURL('image/jpeg', 0.92);
}

/**
 * Generates an authentic transparent glass sample:
 * Luxury French perfume bottle with translucent amber fragrance liquid,
 * reflective glass body, and chrome sprayer cap against a studio background.
 * Ideal for testing glass & transparency preservation.
 */
export function generateGlassSampleDataUrl(): string {
  const canvas = document.createElement('canvas');
  canvas.width = 800;
  canvas.height = 750;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  // Moody studio backdrop with vignette
  const bg = ctx.createRadialGradient(400, 350, 50, 400, 350, 450);
  bg.addColorStop(0, '#f8fafc');
  bg.addColorStop(0.5, '#e2e8f0');
  bg.addColorStop(1, '#94a3b8');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, 800, 750);

  // Surface reflection plane
  ctx.fillStyle = 'rgba(15, 23, 42, 0.12)';
  ctx.beginPath();
  ctx.ellipse(400, 590, 240, 35, 0, 0, Math.PI * 2);
  ctx.fill();

  const bx = 280;
  const by = 260;
  const bw = 240;
  const bh = 300;

  // Gold Fragrance Liquid Inside Glass (Translucent)
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(bx + 18, by + 80, bw - 36, bh - 98, 16);
  const liquidGrad = ctx.createLinearGradient(bx, by + 80, bx, by + bh);
  liquidGrad.addColorStop(0, 'rgba(245, 158, 11, 0.65)');
  liquidGrad.addColorStop(1, 'rgba(217, 119, 6, 0.85)');
  ctx.fillStyle = liquidGrad;
  ctx.fill();
  ctx.restore();

  // Glass Bottle Outer Wall (Semi-transparent with specular glass highlights)
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(bx, by, bw, bh, 24);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.28)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
  ctx.lineWidth = 4;
  ctx.stroke();

  // Left vertical high-gloss glass reflection
  ctx.beginPath();
  ctx.roundRect(bx + 14, by + 16, 22, bh - 32, 10);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
  ctx.fill();

  // Right subtle rim highlight
  ctx.beginPath();
  ctx.roundRect(bx + bw - 26, by + 20, 10, bh - 40, 5);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
  ctx.fill();

  // Bottle Label
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(bx + 35, by + 120, bw - 70, 90);
  ctx.strokeStyle = '#d97706';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(bx + 40, by + 125, bw - 80, 80);

  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 16px serif';
  ctx.textAlign = 'center';
  ctx.fillText('EAU DE PARFUM', bx + bw / 2, by + 155);
  ctx.font = '12px sans-serif';
  ctx.fillStyle = '#b45309';
  ctx.fillText('PARIS • 100 ML', bx + bw / 2, by + 180);

  // Chrome Collar & Sprayer
  ctx.beginPath();
  ctx.rect(bx + bw / 2 - 30, by - 35, 60, 35);
  const chromeGrad = ctx.createLinearGradient(bx, by - 35, bx + bw, by);
  chromeGrad.addColorStop(0, '#94a3b8');
  chromeGrad.addColorStop(0.5, '#f8fafc');
  chromeGrad.addColorStop(1, '#64748b');
  ctx.fillStyle = chromeGrad;
  ctx.fill();
  ctx.strokeStyle = '#475569';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Crystal Cap
  ctx.beginPath();
  ctx.roundRect(bx + bw / 2 - 45, by - 120, 90, 85, 12);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
  ctx.lineWidth = 3;
  ctx.stroke();

  ctx.restore();

  ctx.fillStyle = '#334155';
  ctx.font = 'bold 18px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('SNAPID GLASS SAMPLE • TRANSPARENCY & REFLECTIONS', 400, 710);

  return canvas.toDataURL('image/jpeg', 0.92);
}

export const BG_REMOVER_SAMPLES: BgSampleItem[] = [
  {
    id: 'sample-people',
    category: 'people',
    titleEn: 'Portrait & Hair',
    titleHi: 'पोर्ट्रेट व बाल',
    badge: 'Fine Hair',
    descEn: 'Natural headshot with delicate flyaway hair strands',
    getDataUrl: () => SAMPLE_FEMALE_PASSPORT_DATA_URL,
  },
  {
    id: 'sample-product',
    category: 'product',
    titleEn: 'E-Commerce Product',
    titleHi: 'प्रोडक्ट व वस्तु',
    badge: 'Sharp Edges',
    descEn: 'Athletic sneaker with laces, mesh & studio shadow',
    getDataUrl: () => generateProductSampleDataUrl(),
  },
  {
    id: 'sample-animal',
    category: 'animal',
    titleEn: 'Animal & Fur',
    titleHi: 'पशु व फर',
    badge: 'Dense Fur',
    descEn: 'Golden pet dog with fine fur contours & whiskers',
    getDataUrl: () => generateAnimalSampleDataUrl(),
  },
  {
    id: 'sample-glass',
    category: 'glass',
    titleEn: 'Transparent Glass',
    titleHi: 'कांच व पारदर्शी',
    badge: 'Translucent',
    descEn: 'Luxury perfume bottle with see-through liquid & reflections',
    getDataUrl: () => generateGlassSampleDataUrl(),
  }
];
