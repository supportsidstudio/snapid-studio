import fs from 'fs';
import { PNG } from 'pngjs';

interface SuitSpec {
  id: string;
  name: string;
  nameHi: string;
  filename: string;
  suitColor: [number, number, number]; // RGB
  tieColor: [number, number, number];  // RGB
  shirtTone?: 'white' | 'cream';
  style: 'single' | 'double' | 'three-piece' | 'blazer-grey';
  colorTheme: string;
  description: string;
}

export const SUIT_SPECS: SuitSpec[] = [
  {
    id: 'classic-navy',
    name: 'Classic Navy',
    nameHi: 'क्लासिक नेवी सूट (नेवी टाई)',
    filename: 'classic-navy.png',
    suitColor: [18, 38, 82],
    tieColor: [20, 42, 95],
    style: 'single',
    colorTheme: '#122652',
    description: 'Classic Navy suit with crisp white collar shirt and navy silk tie'
  },
  {
    id: 'jet-black',
    name: 'Jet Black',
    nameHi: 'जेट ब्लैक सूट (ब्लैक टाई)',
    filename: 'jet-black.png',
    suitColor: [16, 17, 20],
    tieColor: [22, 22, 25],
    style: 'single',
    colorTheme: '#101114',
    description: 'Jet Black formal suit with crisp white shirt and matching black tie'
  },
  {
    id: 'royal-blue',
    name: 'Royal Blue',
    nameHi: 'रॉयल ब्लू सूट (रॉयल टाई)',
    filename: 'royal-blue.png',
    suitColor: [28, 62, 138],
    tieColor: [24, 70, 165],
    style: 'single',
    colorTheme: '#1c3e8a',
    description: 'Vibrant Royal Blue tailored blazer with matching royal blue silk tie'
  },
  {
    id: 'sky-blue',
    name: 'Sky Blue',
    nameHi: 'स्काई ब्लू सूट (स्काई टाई)',
    filename: 'sky-blue.png',
    suitColor: [70, 122, 185],
    tieColor: [52, 130, 225],
    style: 'single',
    colorTheme: '#467ab9',
    description: 'Sky Blue modern formal suit with crisp white shirt and sky blue tie'
  },
  {
    id: 'aqua-blue',
    name: 'Aqua Blue',
    nameHi: 'एक्वा ब्लू सूट (एक्वा टाई)',
    filename: 'aqua-blue.png',
    suitColor: [24, 110, 142],
    tieColor: [16, 145, 190],
    style: 'single',
    colorTheme: '#186e8e',
    description: 'Fresh Aqua Blue tailored suit with vibrant oceanic aqua silk tie'
  },
  {
    id: 'deep-teal',
    name: 'Deep Teal',
    nameHi: 'डीप टील सूट (टील टाई)',
    filename: 'deep-teal.png',
    suitColor: [14, 75, 82],
    tieColor: [15, 120, 130],
    style: 'single',
    colorTheme: '#0e4b52',
    description: 'Executive Deep Teal jacket with rich teal formal silk tie'
  },
  {
    id: 'charcoal-grey',
    name: 'Charcoal Grey',
    nameHi: 'चारकोल ग्रे सूट (चारकोल टाई)',
    filename: 'charcoal-grey.png',
    suitColor: [44, 49, 56],
    tieColor: [48, 54, 62],
    style: 'single',
    colorTheme: '#2c3138',
    description: 'Executive Charcoal Grey tailored suit with dark charcoal tie'
  },
  {
    id: 'light-grey',
    name: 'Light Grey',
    nameHi: 'लाइट ग्रे सूट (सिल्वर टाई)',
    filename: 'light-grey.png',
    suitColor: [125, 133, 144],
    tieColor: [165, 175, 190],
    style: 'single',
    colorTheme: '#7d8590',
    description: 'Crisp Light Grey formal suit with gleaming silver silk tie'
  },
  {
    id: 'medium-grey',
    name: 'Medium Grey',
    nameHi: 'मीडियम ग्रे सूट (डार्क ग्रे टाई)',
    filename: 'medium-grey.png',
    suitColor: [78, 85, 96],
    tieColor: [42, 48, 56],
    style: 'single',
    colorTheme: '#4e5560',
    description: 'Balanced Medium Grey formal suit with contrasting dark grey tie'
  },
  {
    id: 'silver-grey',
    name: 'Silver Grey',
    nameHi: 'सिल्वर ग्रे सूट (ब्लू-सिल्वर टाई)',
    filename: 'silver-grey.png',
    suitColor: [136, 146, 160],
    tieColor: [100, 128, 168],
    style: 'single',
    colorTheme: '#8892a0',
    description: 'Silver Grey tailored suit with complementary blue-silver sheen tie'
  },
  {
    id: 'midnight-blue',
    name: 'Midnight Blue',
    nameHi: 'मिडनाइट ब्लू सूट (बरगंडी टाई)',
    filename: 'midnight-blue.png',
    suitColor: [12, 18, 38],
    tieColor: [115, 24, 42],
    style: 'single',
    colorTheme: '#0c1226',
    description: 'Deep Midnight Blue blazer with elegant contrast burgundy wine tie'
  },
  {
    id: 'cobalt-blue',
    name: 'Cobalt Blue',
    nameHi: 'कोबाल्ट ब्लू सूट (नेवी टाई)',
    filename: 'cobalt-blue.png',
    suitColor: [24, 52, 135],
    tieColor: [16, 28, 65],
    style: 'single',
    colorTheme: '#183487',
    description: 'Striking Cobalt Blue jacket with classic deep navy tie'
  },
  {
    id: 'indigo-blue',
    name: 'Indigo Blue',
    nameHi: 'इंडिगो ब्लू सूट (इंडिगो टाई)',
    filename: 'indigo-blue.png',
    suitColor: [36, 32, 95],
    tieColor: [50, 45, 135],
    style: 'single',
    colorTheme: '#24205f',
    description: 'Rich Indigo Blue executive suit with matching indigo patterned tie'
  },
  {
    id: 'powder-blue',
    name: 'Powder Blue',
    nameHi: 'पाउडर ब्लू सूट (सॉफ्ट ब्लू टाई)',
    filename: 'powder-blue.png',
    suitColor: [95, 128, 165],
    tieColor: [130, 172, 220],
    style: 'single',
    colorTheme: '#5f80a5',
    description: 'Soft Powder Blue formal suit with pastel soft blue silk tie'
  },
  {
    id: 'steel-blue',
    name: 'Steel Blue',
    nameHi: 'स्टील ब्लू सूट (स्टील टाई)',
    filename: 'steel-blue.png',
    suitColor: [48, 75, 102],
    tieColor: [62, 88, 115],
    style: 'single',
    colorTheme: '#304b66',
    description: 'Steel Blue contemporary jacket with tailored steel blue tie'
  },
  {
    id: 'burgundy-wine',
    name: 'Burgundy Wine',
    nameHi: 'बरगंडी वाइन सूट (बरगंडी टाई)',
    filename: 'burgundy-wine.png',
    suitColor: [82, 18, 34],
    tieColor: [108, 22, 45],
    style: 'single',
    colorTheme: '#521222',
    description: 'Royal Burgundy Wine formal blazer with silk burgundy tie'
  },
  {
    id: 'maroon',
    name: 'Maroon',
    nameHi: 'मैरून सूट (डार्क मैरून टाई)',
    filename: 'maroon.png',
    suitColor: [70, 16, 24],
    tieColor: [88, 18, 28],
    style: 'single',
    colorTheme: '#461018',
    description: 'Rich Indian Formal Maroon suit with dark maroon silk tie'
  },
  {
    id: 'chocolate-brown',
    name: 'Chocolate Brown',
    nameHi: 'चॉकलेट ब्राउन सूट (क्रीम शर्ट + ब्राउन टाई)',
    filename: 'chocolate-brown.png',
    suitColor: [62, 38, 28],
    tieColor: [75, 45, 32],
    shirtTone: 'cream',
    style: 'single',
    colorTheme: '#3e261c',
    description: 'Warm Chocolate Brown suit with soft cream collar shirt and brown tie'
  },
  {
    id: 'camel-tan',
    name: 'Camel Tan',
    nameHi: 'ऊंट टैन सूट (ब्राउन टाई)',
    filename: 'camel-tan.png',
    suitColor: [138, 106, 72],
    tieColor: [70, 42, 28],
    style: 'single',
    colorTheme: '#8a6a48',
    description: 'Elegant Camel Tan formal blazer with contrasting dark brown tie'
  },
  {
    id: 'olive-green',
    name: 'Olive Green',
    nameHi: 'ऑलिव ग्रीन सूट (ऑलिव टाई)',
    filename: 'olive-green.png',
    suitColor: [58, 70, 42],
    tieColor: [72, 86, 52],
    style: 'single',
    colorTheme: '#3a462a',
    description: 'Refined Olive Green tailored suit with matching olive silk tie'
  },
  {
    id: 'sage-green',
    name: 'Sage Green',
    nameHi: 'सेज ग्रीन सूट (सेज टाई)',
    filename: 'sage-green.png',
    suitColor: [86, 108, 88],
    tieColor: [102, 128, 104],
    style: 'single',
    colorTheme: '#566c58',
    description: 'Subtle Sage Green formal attire with delicate sage silk tie'
  },
  {
    id: 'forest-green',
    name: 'Forest Green',
    nameHi: 'फॉरेस्ट ग्रीन सूट (डार्क ग्रीन टाई)',
    filename: 'forest-green.png',
    suitColor: [22, 58, 36],
    tieColor: [18, 48, 30],
    style: 'single',
    colorTheme: '#163a24',
    description: 'Deep Forest Green jacket with dark pine formal tie'
  },
  {
    id: 'emerald-green',
    name: 'Emerald Green',
    nameHi: 'एमराल्ड ग्रीन सूट (एमराल्ड टाई)',
    filename: 'emerald-green.png',
    suitColor: [14, 82, 54],
    tieColor: [16, 125, 82],
    style: 'single',
    colorTheme: '#0e5236',
    description: 'Jewel-tone Emerald Green blazer with vibrant emerald silk tie'
  },
  {
    id: 'deep-purple',
    name: 'Deep Purple',
    nameHi: 'डीप पर्पल सूट (पर्पल टाई)',
    filename: 'deep-purple.png',
    suitColor: [56, 22, 78],
    tieColor: [95, 34, 135],
    style: 'single',
    colorTheme: '#38164e',
    description: 'Regal Deep Purple formal suit with rich purple silk tie'
  },
  {
    id: 'plum',
    name: 'Plum',
    nameHi: 'प्लम सूट (प्लम टाई)',
    filename: 'plum.png',
    suitColor: [74, 26, 68],
    tieColor: [108, 32, 98],
    style: 'single',
    colorTheme: '#4a1a44',
    description: 'Executive Plum aubergine suit with matching plum silk tie'
  },
  {
    id: 'black-double-breasted',
    name: 'Black Double-Breasted',
    nameHi: 'ब्लैक डबल-ब्रेस्टेड सूट',
    filename: 'black-double-breasted.png',
    suitColor: [16, 17, 20],
    tieColor: [22, 22, 25],
    style: 'double',
    colorTheme: '#101114',
    description: 'Prestigious Black Double-Breasted suit with peaked lapels and dual button rows'
  },
  {
    id: 'navy-double-breasted',
    name: 'Navy Double-Breasted',
    nameHi: 'नेवी डबल-ब्रेस्टेड सूट',
    filename: 'navy-double-breasted.png',
    suitColor: [18, 38, 82],
    tieColor: [20, 42, 95],
    style: 'double',
    colorTheme: '#122652',
    description: 'Classic Navy Double-Breasted blazer with peaked lapels and formal buttons'
  },
  {
    id: 'charcoal-three-piece',
    name: 'Charcoal Three-Piece',
    nameHi: 'चारकोल थ्री-पीस सूट (वेस्टकोट सहित)',
    filename: 'charcoal-three-piece.png',
    suitColor: [44, 49, 56],
    tieColor: [32, 36, 42],
    style: 'three-piece',
    colorTheme: '#2c3138',
    description: 'Distinguished Charcoal Three-Piece suit with tailored inner waistcoat'
  },
  {
    id: 'navy-three-piece',
    name: 'Navy Three-Piece',
    nameHi: 'नेवी थ्री-पीस सूट (वेस्टकोट सहित)',
    filename: 'navy-three-piece.png',
    suitColor: [18, 38, 82],
    tieColor: [32, 65, 140],
    style: 'three-piece',
    colorTheme: '#122652',
    description: 'Executive Navy Three-Piece suit with matching tailored formal vest'
  },
  {
    id: 'black-blazer-grey',
    name: 'Black Blazer + Grey Formal',
    nameHi: 'ब्लैक ब्लेज़र + ग्रे फॉर्मल स्टाइल',
    filename: 'black-blazer-grey.png',
    suitColor: [18, 19, 22],
    tieColor: [35, 38, 44],
    style: 'blazer-grey',
    colorTheme: '#121316',
    description: 'Tailored Black blazer with contrasting formal grey lower styling and pocket square'
  }
];

export async function generateAllSuits() {
  console.log('Starting suit generation for 30 built-in templates...');
  const baseData = fs.readFileSync('public/dress-templates/men_black_suit_tie.png');
  const basePng = PNG.sync.read(baseData);
  const { width, height } = basePng;

  for (let i = 0; i < SUIT_SPECS.length; i++) {
    const spec = SUIT_SPECS[i];
    console.log(`[${i + 1}/30] Generating ${spec.name} (${spec.filename})...`);

    const outPng = new PNG({ width, height });

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = (y * width + x) * 4;
        const a = basePng.data[idx + 3];

        if (a < 15) {
          outPng.data[idx] = 0;
          outPng.data[idx + 1] = 0;
          outPng.data[idx + 2] = 0;
          outPng.data[idx + 3] = 0;
          continue;
        }

        const r = basePng.data[idx];
        const g = basePng.data[idx + 1];
        const b = basePng.data[idx + 2];
        const lum = 0.299 * r + 0.587 * g + 0.114 * b;
        const dx = Math.abs(x - 512);

        // Identify regions
        const inKnot = y >= 290 && y <= 365 && dx <= 25;
        const bladeHalfW = 18 + (y - 365) * 0.082;
        const inBlade = y > 365 && y <= 670 && dx <= bladeHalfW;
        const isTie = (inKnot || inBlade) && lum < 95;

        const isShirtZone = y >= 170 && y <= 580 && dx <= 140;
        const isShirt = !isTie && isShirtZone && (lum > 75 || (y < 335 && dx < 110));

        if (isShirt) {
          if (spec.shirtTone === 'cream') {
            // Warm ivory/cream shirt
            const creamLum = lum / 255;
            outPng.data[idx] = Math.min(255, Math.round(250 * creamLum));
            outPng.data[idx + 1] = Math.min(255, Math.round(242 * creamLum));
            outPng.data[idx + 2] = Math.min(255, Math.round(225 * creamLum));
          } else {
            // Crisp clean white shirt
            outPng.data[idx] = r;
            outPng.data[idx + 1] = g;
            outPng.data[idx + 2] = b;
          }
          outPng.data[idx + 3] = a;
          continue;
        }

        if (isTie) {
          // Tie styling with silk weave sheen
          const tLum = Math.min(2.6, lum / 42);
          const weave = 1.0 + 0.08 * Math.sin((x + y) * 0.45) + 0.04 * Math.cos((x - y) * 0.3);
          outPng.data[idx] = Math.min(255, Math.max(0, Math.round(spec.tieColor[0] * tLum * weave)));
          outPng.data[idx + 1] = Math.min(255, Math.max(0, Math.round(spec.tieColor[1] * tLum * weave)));
          outPng.data[idx + 2] = Math.min(255, Math.max(0, Math.round(spec.tieColor[2] * tLum * weave)));
          outPng.data[idx + 3] = a;
          continue;
        }

        // Three-piece waistcoat styling
        if (spec.style === 'three-piece') {
          // Waistcoat visible in V-opening below tie knot (y: 490 - 660)
          const inVestArea = y >= 490 && y <= 660 && dx > bladeHalfW && dx < (bladeHalfW + 35);
          if (inVestArea) {
            const vLum = Math.min(2.5, lum / 30);
            const vestWeave = 1.0 + 0.05 * Math.sin(y * 0.8);
            const vestColor = spec.id.includes('navy') ? [24, 45, 95] : [55, 60, 68];
            outPng.data[idx] = Math.min(255, Math.round(vestColor[0] * vLum * vestWeave));
            outPng.data[idx + 1] = Math.min(255, Math.round(vestColor[1] * vLum * vestWeave));
            outPng.data[idx + 2] = Math.min(255, Math.round(vestColor[2] * vLum * vestWeave));
            outPng.data[idx + 3] = a;
            continue;
          }
        }

        // Black Blazer + Grey Lower Formal styling
        if (spec.style === 'blazer-grey') {
          // Pocket square peak in breast pocket
          const inPocketSquare = y >= 438 && y <= 454 && x >= 335 && x <= 375 && (y - 438) > Math.abs(x - 355) * 0.7;
          if (inPocketSquare) {
            outPng.data[idx] = 248;
            outPng.data[idx + 1] = 250;
            outPng.data[idx + 2] = 252;
            outPng.data[idx + 3] = 255;
            continue;
          }

          // Lower jacket styling in medium grey
          if (y >= 680) {
            const gLum = Math.min(2.5, lum / 30);
            outPng.data[idx] = Math.min(255, Math.round(72 * gLum));
            outPng.data[idx + 1] = Math.min(255, Math.round(78 * gLum));
            outPng.data[idx + 2] = Math.min(255, Math.round(88 * gLum));
            outPng.data[idx + 3] = a;
            continue;
          }
        }

        // Jacket Body & Lapels
        let jLum = Math.min(2.8, lum / 28);

        // Double-breasted peak lapel accent
        if (spec.style === 'double' && y >= 390 && y <= 500 && (dx >= 150 && dx <= 180)) {
          jLum *= 1.15;
        }

        const suitR = Math.min(255, Math.max(0, Math.round(spec.suitColor[0] * jLum)));
        const suitG = Math.min(255, Math.max(0, Math.round(spec.suitColor[1] * jLum)));
        const suitB = Math.min(255, Math.max(0, Math.round(spec.suitColor[2] * jLum)));

        outPng.data[idx] = suitR;
        outPng.data[idx + 1] = suitG;
        outPng.data[idx + 2] = suitB;
        outPng.data[idx + 3] = a;
      }
    }

    // Add buttons for Double-Breasted style
    if (spec.style === 'double') {
      const buttonPositions = [
        { cx: 460, cy: 640 },
        { cx: 564, cy: 640 },
        { cx: 458, cy: 725 },
        { cx: 566, cy: 725 }
      ];

      for (const btn of buttonPositions) {
        const radius = 10;
        for (let by = btn.cy - radius - 2; by <= btn.cy + radius + 2; by++) {
          for (let bx = btn.cx - radius - 2; bx <= btn.cx + radius + 2; bx++) {
            const dist = Math.hypot(bx - btn.cx, by - btn.cy);
            if (dist <= radius) {
              const bIdx = (by * width + bx) * 4;
              const angle = Math.atan2(by - btn.cy, bx - btn.cx);
              const isHighlight = angle < -0.8 && angle > -2.4;
              const isShadow = angle > 0.8 && angle < 2.4;
              const isInner = dist < (radius - 3);

              let br = spec.suitColor[0] > 40 ? 180 : 35;
              let bg = spec.suitColor[1] > 40 ? 160 : 35;
              let bb = spec.suitColor[2] > 40 ? 110 : 40;

              if (isHighlight) {
                br += 70;
                bg += 65;
                bb += 55;
              } else if (isShadow) {
                br = Math.max(10, br - 20);
                bg = Math.max(10, bg - 20);
                bb = Math.max(10, bb - 20);
              }

              if (isInner) {
                br = Math.max(15, br - 25);
                bg = Math.max(15, bg - 25);
                bb = Math.max(15, bb - 25);
              }

              if (dist < 3) {
                br = 15;
                bg = 15;
                bb = 15;
              }

              outPng.data[bIdx] = Math.min(255, br);
              outPng.data[bIdx + 1] = Math.min(255, bg);
              outPng.data[bIdx + 2] = Math.min(255, bb);
              outPng.data[bIdx + 3] = 255;
            }
          }
        }
      }
    }

    // Add buttons for Three-Piece style (vest buttons)
    if (spec.style === 'three-piece') {
      const vestButtons = [
        { cx: 512, cy: 535 },
        { cx: 512, cy: 585 },
        { cx: 512, cy: 635 }
      ];

      for (const btn of vestButtons) {
        const radius = 5;
        for (let by = btn.cy - radius - 1; by <= btn.cy + radius + 1; by++) {
          for (let bx = btn.cx - radius - 1; bx <= btn.cx + radius + 1; bx++) {
            const dist = Math.hypot(bx - btn.cx, by - btn.cy);
            if (dist <= radius) {
              const bIdx = (by * width + bx) * 4;
              const isHighlight = (bx - btn.cx < 0) && (by - btn.cy < 0);
              outPng.data[bIdx] = isHighlight ? 210 : 80;
              outPng.data[bIdx + 1] = isHighlight ? 215 : 85;
              outPng.data[bIdx + 2] = isHighlight ? 225 : 95;
              outPng.data[bIdx + 3] = 255;
            }
          }
        }
      }
    }

    const targetPath = `public/dress-templates/${spec.filename}`;
    fs.writeFileSync(targetPath, PNG.sync.write(outPng, { deflateLevel: 9 }));
    console.log(`Saved ${targetPath} (${(fs.statSync(targetPath).size / 1024).toFixed(0)} KB)`);
  }

  console.log('All 30 suit templates generated successfully!');
}

generateAllSuits().catch(console.error);

