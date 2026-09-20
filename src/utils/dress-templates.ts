export type DressCategory = 'men' | 'women' | 'kids';

export interface DressTemplate {
  id: string;
  name: string;
  nameHi: string;
  category: DressCategory;
  imageSrc: string;
  fallbackImageSrc?: string;
  colorTheme: string;
  description: string;
  collarWidthRatio: number; // relative collar opening width
  collarDepthRatio: number; // relative collar opening depth
  defaultScale: number;
  defaultOffsetY: number; // percentage from top (e.g. 52%)
  style?: string;
  builtIn?: boolean;
}

export interface DressTransformState {
  templateId: string | null;
  customImageSrc: string | null;
  offsetX: number; // percentage offset -50% to +50%
  offsetY: number; // percentage offset -50% to +50%
  scale: number; // 0.6 to 2.0
  scaleX: number; // width stretch 0.7 to 1.3
  scaleY: number; // height stretch 0.7 to 1.3
  rotation: number; // -15 to +15 deg
  collarWidth: number; // 0.8 to 1.3 (collar neck cutout width)
  collarCutoutY: number; // -20 to +20px fine collar notch
}

export const INITIAL_DRESS_STATE: DressTransformState = {
  templateId: null,
  customImageSrc: null,
  offsetX: 0,
  offsetY: 0,
  scale: 1.0,
  scaleX: 1.0,
  scaleY: 1.0,
  rotation: 0,
  collarWidth: 1.0,
  collarCutoutY: 0,
};

export const BUILT_IN_SUIT_TEMPLATES: DressTemplate[] = [
  {
    id: 'classic-navy',
    name: 'Classic Navy',
    nameHi: 'क्लासिक नेवी सूट (नेवी टाई)',
    category: 'men',
    imageSrc: '/dress-templates/classic-navy.png',
    fallbackImageSrc: '/dress-templates/classic-navy.png',
    style: 'Single-Breasted',
    builtIn: true,
    colorTheme: '#122652',
    description: 'Classic Navy suit with crisp white collar shirt and navy silk tie',
    collarWidthRatio: 1.0,
    collarDepthRatio: 1.0,
    defaultScale: 1.0,
    defaultOffsetY: 0
  },
  {
    id: 'jet-black',
    name: 'Jet Black',
    nameHi: 'जेट ब्लैक सूट (ब्लैक टाई)',
    category: 'men',
    imageSrc: '/dress-templates/jet-black.png',
    fallbackImageSrc: '/dress-templates/jet-black.png',
    style: 'Single-Breasted',
    builtIn: true,
    colorTheme: '#101114',
    description: 'Jet Black formal suit with crisp white shirt and matching black tie',
    collarWidthRatio: 1.0,
    collarDepthRatio: 1.0,
    defaultScale: 1.0,
    defaultOffsetY: 0
  },
  {
    id: 'royal-blue',
    name: 'Royal Blue',
    nameHi: 'रॉयल ब्लू सूट (रॉयल टाई)',
    category: 'men',
    imageSrc: '/dress-templates/royal-blue.png',
    fallbackImageSrc: '/dress-templates/royal-blue.png',
    style: 'Single-Breasted',
    builtIn: true,
    colorTheme: '#1c3e8a',
    description: 'Vibrant Royal Blue tailored blazer with matching royal blue silk tie',
    collarWidthRatio: 1.0,
    collarDepthRatio: 1.0,
    defaultScale: 1.0,
    defaultOffsetY: 0
  },
  {
    id: 'sky-blue',
    name: 'Sky Blue',
    nameHi: 'स्काई ब्लू सूट (स्काई टाई)',
    category: 'men',
    imageSrc: '/dress-templates/sky-blue.png',
    fallbackImageSrc: '/dress-templates/sky-blue.png',
    style: 'Single-Breasted',
    builtIn: true,
    colorTheme: '#467ab9',
    description: 'Sky Blue modern formal suit with crisp white shirt and sky blue tie',
    collarWidthRatio: 1.0,
    collarDepthRatio: 1.0,
    defaultScale: 1.0,
    defaultOffsetY: 0
  },
  {
    id: 'aqua-blue',
    name: 'Aqua Blue',
    nameHi: 'एक्वा ब्लू सूट (एक्वा टाई)',
    category: 'men',
    imageSrc: '/dress-templates/aqua-blue.png',
    fallbackImageSrc: '/dress-templates/aqua-blue.png',
    style: 'Single-Breasted',
    builtIn: true,
    colorTheme: '#186e8e',
    description: 'Fresh Aqua Blue tailored suit with vibrant oceanic aqua silk tie',
    collarWidthRatio: 1.0,
    collarDepthRatio: 1.0,
    defaultScale: 1.0,
    defaultOffsetY: 0
  },
  {
    id: 'deep-teal',
    name: 'Deep Teal',
    nameHi: 'डीप टील सूट (टील टाई)',
    category: 'men',
    imageSrc: '/dress-templates/deep-teal.png',
    fallbackImageSrc: '/dress-templates/deep-teal.png',
    style: 'Single-Breasted',
    builtIn: true,
    colorTheme: '#0e4b52',
    description: 'Executive Deep Teal jacket with rich teal formal silk tie',
    collarWidthRatio: 1.0,
    collarDepthRatio: 1.0,
    defaultScale: 1.0,
    defaultOffsetY: 0
  },
  {
    id: 'charcoal-grey',
    name: 'Charcoal Grey',
    nameHi: 'चारकोल ग्रे सूट (चारकोल टाई)',
    category: 'men',
    imageSrc: '/dress-templates/charcoal-grey.png',
    fallbackImageSrc: '/dress-templates/charcoal-grey.png',
    style: 'Single-Breasted',
    builtIn: true,
    colorTheme: '#2c3138',
    description: 'Executive Charcoal Grey tailored suit with dark charcoal tie',
    collarWidthRatio: 1.0,
    collarDepthRatio: 1.0,
    defaultScale: 1.0,
    defaultOffsetY: 0
  },
  {
    id: 'light-grey',
    name: 'Light Grey',
    nameHi: 'लाइट ग्रे सूट (सिल्वर टाई)',
    category: 'men',
    imageSrc: '/dress-templates/light-grey.png',
    fallbackImageSrc: '/dress-templates/light-grey.png',
    style: 'Single-Breasted',
    builtIn: true,
    colorTheme: '#7d8590',
    description: 'Crisp Light Grey formal suit with gleaming silver silk tie',
    collarWidthRatio: 1.0,
    collarDepthRatio: 1.0,
    defaultScale: 1.0,
    defaultOffsetY: 0
  },
  {
    id: 'midnight-blue',
    name: 'Midnight Blue',
    nameHi: 'मिडनाइट ब्लू सूट (बरगंडी टाई)',
    category: 'men',
    imageSrc: '/dress-templates/midnight-blue.png',
    fallbackImageSrc: '/dress-templates/midnight-blue.png',
    style: 'Single-Breasted',
    builtIn: true,
    colorTheme: '#0c1226',
    description: 'Deep Midnight Blue blazer with elegant contrast burgundy wine tie',
    collarWidthRatio: 1.0,
    collarDepthRatio: 1.0,
    defaultScale: 1.0,
    defaultOffsetY: 0
  },
  {
    id: 'cobalt-blue',
    name: 'Cobalt Blue',
    nameHi: 'कोबाल्ट ब्लू सूट (नेवी टाई)',
    category: 'men',
    imageSrc: '/dress-templates/cobalt-blue.png',
    fallbackImageSrc: '/dress-templates/cobalt-blue.png',
    style: 'Single-Breasted',
    builtIn: true,
    colorTheme: '#183487',
    description: 'Striking Cobalt Blue jacket with classic deep navy tie',
    collarWidthRatio: 1.0,
    collarDepthRatio: 1.0,
    defaultScale: 1.0,
    defaultOffsetY: 0
  },
  {
    id: 'indigo-blue',
    name: 'Indigo Blue',
    nameHi: 'इंडिगो ब्लू सूट (इंडिगो टाई)',
    category: 'men',
    imageSrc: '/dress-templates/indigo-blue.png',
    fallbackImageSrc: '/dress-templates/indigo-blue.png',
    style: 'Single-Breasted',
    builtIn: true,
    colorTheme: '#24205f',
    description: 'Rich Indigo Blue executive suit with matching indigo patterned tie',
    collarWidthRatio: 1.0,
    collarDepthRatio: 1.0,
    defaultScale: 1.0,
    defaultOffsetY: 0
  },
  {
    id: 'powder-blue',
    name: 'Powder Blue',
    nameHi: 'पाउडर ब्लू सूट (सॉफ्ट ब्लू टाई)',
    category: 'men',
    imageSrc: '/dress-templates/powder-blue.png',
    fallbackImageSrc: '/dress-templates/powder-blue.png',
    style: 'Single-Breasted',
    builtIn: true,
    colorTheme: '#5f80a5',
    description: 'Soft Powder Blue formal suit with pastel soft blue silk tie',
    collarWidthRatio: 1.0,
    collarDepthRatio: 1.0,
    defaultScale: 1.0,
    defaultOffsetY: 0
  },
  {
    id: 'burgundy-wine',
    name: 'Burgundy Wine',
    nameHi: 'बरगंडी वाइन सूट (बरगंडी टाई)',
    category: 'men',
    imageSrc: '/dress-templates/burgundy-wine.png',
    fallbackImageSrc: '/dress-templates/burgundy-wine.png',
    style: 'Single-Breasted',
    builtIn: true,
    colorTheme: '#521222',
    description: 'Royal Burgundy Wine formal blazer with silk burgundy tie',
    collarWidthRatio: 1.0,
    collarDepthRatio: 1.0,
    defaultScale: 1.0,
    defaultOffsetY: 0
  },
  {
    id: 'chocolate-brown',
    name: 'Chocolate Brown',
    nameHi: 'चॉकलेट ब्राउन सूट (क्रीम शर्ट + ब्राउन टाई)',
    category: 'men',
    imageSrc: '/dress-templates/chocolate-brown.png',
    fallbackImageSrc: '/dress-templates/chocolate-brown.png',
    style: 'Single-Breasted',
    builtIn: true,
    colorTheme: '#3e261c',
    description: 'Warm Chocolate Brown suit with soft cream collar shirt and brown tie',
    collarWidthRatio: 1.0,
    collarDepthRatio: 1.0,
    defaultScale: 1.0,
    defaultOffsetY: 0
  },
  {
    id: 'camel-tan',
    name: 'Camel Tan',
    nameHi: 'ऊंट टैन सूट (ब्राउन टाई)',
    category: 'men',
    imageSrc: '/dress-templates/camel-tan.png',
    fallbackImageSrc: '/dress-templates/camel-tan.png',
    style: 'Single-Breasted',
    builtIn: true,
    colorTheme: '#8a6a48',
    description: 'Elegant Camel Tan formal blazer with contrasting dark brown tie',
    collarWidthRatio: 1.0,
    collarDepthRatio: 1.0,
    defaultScale: 1.0,
    defaultOffsetY: 0
  },
  {
    id: 'olive-green',
    name: 'Olive Green',
    nameHi: 'ऑलिव ग्रीन सूट (ऑलिव टाई)',
    category: 'men',
    imageSrc: '/dress-templates/olive-green.png',
    fallbackImageSrc: '/dress-templates/olive-green.png',
    style: 'Single-Breasted',
    builtIn: true,
    colorTheme: '#3a462a',
    description: 'Refined Olive Green tailored suit with matching olive silk tie',
    collarWidthRatio: 1.0,
    collarDepthRatio: 1.0,
    defaultScale: 1.0,
    defaultOffsetY: 0
  },
  {
    id: 'forest-green',
    name: 'Forest Green',
    nameHi: 'फॉरेस्ट ग्रीन सूट (डार्क ग्रीन टाई)',
    category: 'men',
    imageSrc: '/dress-templates/forest-green.png',
    fallbackImageSrc: '/dress-templates/forest-green.png',
    style: 'Single-Breasted',
    builtIn: true,
    colorTheme: '#163a24',
    description: 'Deep Forest Green jacket with dark pine formal tie',
    collarWidthRatio: 1.0,
    collarDepthRatio: 1.0,
    defaultScale: 1.0,
    defaultOffsetY: 0
  },
  {
    id: 'black-double-breasted',
    name: 'Black Double-Breasted',
    nameHi: 'ब्लैक डबल-ब्रेस्टेड सूट',
    category: 'men',
    imageSrc: '/dress-templates/black-double-breasted.png',
    fallbackImageSrc: '/dress-templates/black-double-breasted.png',
    style: 'Double-Breasted',
    builtIn: true,
    colorTheme: '#101114',
    description: 'Prestigious Black Double-Breasted suit with peaked lapels and dual button rows',
    collarWidthRatio: 1.0,
    collarDepthRatio: 1.0,
    defaultScale: 1.0,
    defaultOffsetY: 0
  },
  {
    id: 'navy-double-breasted',
    name: 'Navy Double-Breasted',
    nameHi: 'नेवी डबल-ब्रेस्टेड सूट',
    category: 'men',
    imageSrc: '/dress-templates/navy-double-breasted.png',
    fallbackImageSrc: '/dress-templates/navy-double-breasted.png',
    style: 'Double-Breasted',
    builtIn: true,
    colorTheme: '#122652',
    description: 'Classic Navy Double-Breasted blazer with peaked lapels and formal buttons',
    collarWidthRatio: 1.0,
    collarDepthRatio: 1.0,
    defaultScale: 1.0,
    defaultOffsetY: 0
  },
  {
    id: 'navy-three-piece',
    name: 'Navy Three-Piece',
    nameHi: 'नेवी थ्री-पीस सूट (वेस्टकोट सहित)',
    category: 'men',
    imageSrc: '/dress-templates/navy-three-piece.png',
    fallbackImageSrc: '/dress-templates/navy-three-piece.png',
    style: 'Three-Piece',
    builtIn: true,
    colorTheme: '#122652',
    description: 'Executive Navy Three-Piece suit with matching tailored formal vest',
    collarWidthRatio: 1.0,
    collarDepthRatio: 1.0,
    defaultScale: 1.0,
    defaultOffsetY: 0
  }
];

export const DRESS_TEMPLATES: DressTemplate[] = [
  // --- 20 BUILT-IN MEN SUITS ---
  ...BUILT_IN_SUIT_TEMPLATES,

  // --- WOMEN ---
  {
    id: 'women_black_business_blazer',
    name: 'Tailored Black Blazer & Shirt',
    nameHi: 'ब्लैक बिजनेस ब्लेज़र व शर्ट',
    category: 'women',
    imageSrc: '/dress-templates/women_black_business_blazer.png',
    colorTheme: '#111827',
    description: 'Corporate women’s black tailored blazer with white inner formal top',
    collarWidthRatio: 1.1,
    collarDepthRatio: 1.15,
    defaultScale: 1.0,
    defaultOffsetY: 0
  },
  {
    id: 'women_navy_corporate_suit',
    name: 'Navy Blue Executive Blazer',
    nameHi: 'नेवी ब्लू एग्जीक्यूटिव ब्लेज़र',
    category: 'women',
    imageSrc: '/dress-templates/women_navy_corporate_suit.png',
    colorTheme: '#1e3a8a',
    description: 'Deep navy professional blazer with elegant lapels',
    collarWidthRatio: 1.1,
    collarDepthRatio: 1.15,
    defaultScale: 1.0,
    defaultOffsetY: 0
  },
  {
    id: 'women_formal_white_shirt',
    name: 'Formal White Collar Shirt',
    nameHi: 'फॉर्मल व्हाइट कॉलर शर्ट',
    category: 'women',
    imageSrc: '/dress-templates/women_formal_white_shirt.png',
    colorTheme: '#e2e8f0',
    description: 'Classic crisp white button-down collar formal shirt',
    collarWidthRatio: 1.05,
    collarDepthRatio: 1.1,
    defaultScale: 1.0,
    defaultOffsetY: 0
  },
  {
    id: 'women_formal_saree_maroon',
    name: 'Formal Traditional Saree (Maroon)',
    nameHi: 'फॉर्मल साड़ी (मैरून व जरी बॉर्डर)',
    category: 'women',
    imageSrc: '/dress-templates/women_formal_saree_maroon.png',
    colorTheme: '#831843',
    description: 'Traditional elegant maroon saree with gold border and formal drape',
    collarWidthRatio: 1.15,
    collarDepthRatio: 1.2,
    defaultScale: 1.0,
    defaultOffsetY: 0
  },
  {
    id: 'women_charcoal_blazer',
    name: 'Charcoal Grey Corporate Blazer',
    nameHi: 'चारकोल ग्रे कॉर्पोरेट ब्लेज़र',
    category: 'women',
    imageSrc: '/dress-templates/women_charcoal_blazer.png',
    colorTheme: '#374151',
    description: 'Sleek dark grey blazer with satin notch lapels',
    collarWidthRatio: 1.1,
    collarDepthRatio: 1.15,
    defaultScale: 1.0,
    defaultOffsetY: 0
  },

  // --- KIDS ---
  {
    id: 'kids_school_navy_blazer',
    name: 'Junior School Navy Blazer & Tie',
    nameHi: 'जूनियर स्कूल नेवी ब्लेज़र व टाई',
    category: 'kids',
    imageSrc: '/dress-templates/kids_school_navy_blazer.png',
    colorTheme: '#1e3a8a',
    description: 'Smart junior navy school uniform blazer with striped tie',
    collarWidthRatio: 0.9,
    collarDepthRatio: 0.9,
    defaultScale: 0.95,
    defaultOffsetY: 0
  },
  {
    id: 'kids_black_formal_suit',
    name: 'Junior Black Formal Suit',
    nameHi: 'जूनियर ब्लैक फॉर्मल सूट',
    category: 'kids',
    imageSrc: '/dress-templates/kids_black_formal_suit.png',
    colorTheme: '#111827',
    description: 'Boy’s neat black formal suit with mini bow tie',
    collarWidthRatio: 0.9,
    collarDepthRatio: 0.9,
    defaultScale: 0.95,
    defaultOffsetY: 0
  },
  {
    id: 'kids_white_collar_shirt',
    name: 'Junior Clean White Collar Shirt',
    nameHi: 'जूनियर व्हाइट कॉलर शर्ट',
    category: 'kids',
    imageSrc: '/dress-templates/kids_white_collar_shirt.png',
    colorTheme: '#f1f5f9',
    description: 'Children’s neat white pressed button-up collar shirt',
    collarWidthRatio: 0.92,
    collarDepthRatio: 0.9,
    defaultScale: 0.95,
    defaultOffsetY: 0
  }
];

/**
 * Generate a high-resolution Vector SVG Data URL representing the suit template
 * Used as an instant, zero-latency fallback and thumbnail renderer.
 */
export function generateDressVectorDataUrl(template: DressTemplate): string {
  const { id, category, colorTheme } = template;
  
  // High-resolution SVG canvas (800 x 900)
  const isMen = category === 'men';
  const isWomen = category === 'women';
  const isKids = category === 'kids';

  let innerContent = '';

  if (id === 'men_bandhgala_suit') {
    // Mandarin / Nehru Bandhgala Jacket
    innerContent = `
      <!-- Shoulder & Jacket Silhouette -->
      <path d="M 120 780 C 120 480, 240 330, 310 320 C 350 315, 360 350, 400 350 C 440 350, 450 315, 490 320 C 560 330, 680 480, 680 780 Z" fill="${colorTheme}" />
      <!-- Collar Band -->
      <path d="M 310 320 C 350 310, 450 310, 490 320 L 490 345 C 450 340, 350 340, 310 345 Z" fill="#1e293b" stroke="#334155" stroke-width="3" />
      <!-- Center Placket & Gold Buttons -->
      <line x1="400" y1="345" x2="400" y2="780" stroke="#0f172a" stroke-width="6" />
      <circle cx="400" cy="380" r="7" fill="#fbbf24" stroke="#d97706" stroke-width="2" />
      <circle cx="400" cy="440" r="7" fill="#fbbf24" stroke="#d97706" stroke-width="2" />
      <circle cx="400" cy="500" r="7" fill="#fbbf24" stroke="#d97706" stroke-width="2" />
      <circle cx="400" cy="560" r="7" fill="#fbbf24" stroke="#d97706" stroke-width="2" />
      <circle cx="400" cy="620" r="7" fill="#fbbf24" stroke="#d97706" stroke-width="2" />
      <!-- Pocket Square -->
      <line x1="240" y1="460" x2="310" y2="460" stroke="#fbbf24" stroke-width="4" stroke-linecap="round" />
    `;
  } else if (id === 'women_formal_saree_maroon') {
    // Saree Drape & Blouse
    innerContent = `
      <!-- Body & Shoulders -->
      <path d="M 120 780 C 130 500, 240 370, 300 350 C 350 340, 370 380, 400 380 C 430 380, 450 340, 500 350 C 560 370, 670 500, 680 780 Z" fill="#831843" />
      <!-- Saree Pallu Pleats Drape Across Chest -->
      <path d="M 180 780 L 290 360 C 310 350, 350 350, 370 370 L 650 780 Z" fill="#9f1239" />
      <!-- Gold Zari Border on Pallu -->
      <path d="M 280 355 L 670 780" stroke="#fbbf24" stroke-width="12" stroke-linecap="round" />
      <path d="M 285 355 L 675 780" stroke="#f59e0b" stroke-width="4" stroke-linecap="round" />
      <!-- Inner Neckline Cutout -->
      <path d="M 330 350 C 360 410, 440 410, 470 350 Z" fill="#be123c" opacity="0.4" />
    `;
  } else if (id === 'kids_black_formal_suit') {
    // Boy's Formal Suit with Bow Tie
    innerContent = `
      <!-- Suit Silhouette -->
      <path d="M 150 780 C 160 500, 250 360, 320 340 C 360 330, 440 330, 480 340 C 550 360, 640 500, 650 780 Z" fill="#111827" />
      <!-- White Shirt Inner -->
      <polygon points="340,340 460,340 420,530 380,530" fill="#ffffff" />
      <!-- Bow Tie -->
      <path d="M 370 370 L 430 370 L 415 390 L 435 410 L 365 410 L 385 390 Z" fill="#e11d48" stroke="#9f1239" stroke-width="2" />
      <circle cx="400" cy="390" r="6" fill="#be123c" />
      <!-- Lapels -->
      <polygon points="320,340 370,440 340,510 310,400" fill="#1f2937" stroke="#374151" stroke-width="2" />
      <polygon points="480,340 430,440 460,510 490,400" fill="#1f2937" stroke="#374151" stroke-width="2" />
    `;
  } else if (id.includes('shirt')) {
    // Formal Button Collar Shirt
    const shirtColor = id.includes('blue') ? '#93c5fd' : '#f8fafc';
    const tieColor = id.includes('blue') ? '#1e3a8a' : '#047857';
    innerContent = `
      <!-- Shirt Base -->
      <path d="M 130 780 C 140 490, 240 350, 310 330 C 350 320, 450 320, 490 330 C 560 350, 660 490, 670 780 Z" fill="${shirtColor}" stroke="#cbd5e1" stroke-width="3" />
      <!-- Collar Left & Right Points -->
      <polygon points="310,330 395,360 365,420 300,360" fill="#ffffff" stroke="#cbd5e1" stroke-width="3" />
      <polygon points="490,330 405,360 435,420 500,360" fill="#ffffff" stroke="#cbd5e1" stroke-width="3" />
      <!-- Tie -->
      <polygon points="390,360 410,360 425,600 400,640 375,600" fill="${tieColor}" stroke="#0f172a" stroke-width="2" />
      <polygon points="385,355 415,355 410,380 390,380" fill="${tieColor}" />
      <!-- Center Placket & Buttons -->
      <line x1="400" y1="380" x2="400" y2="780" stroke="#cbd5e1" stroke-width="4" />
    `;
  } else if (isWomen) {
    // Women's Business Blazer
    const innerTopColor = '#ffffff';
    innerContent = `
      <!-- Blazer Body -->
      <path d="M 130 780 C 140 480, 230 350, 310 330 C 360 320, 440 320, 490 330 C 570 350, 660 480, 670 780 Z" fill="${colorTheme}" />
      <!-- White Camisole / Top Inner -->
      <path d="M 330 335 C 360 430, 440 430, 470 335 L 430 520 L 370 520 Z" fill="${innerTopColor}" />
      <!-- Lapels Notch Cut -->
      <polygon points="310,330 380,480 340,540 280,420" fill="${colorTheme}" stroke="#475569" stroke-width="2" />
      <polygon points="490,330 420,480 460,540 520,420" fill="${colorTheme}" stroke="#475569" stroke-width="2" />
      <!-- Single Button Closure -->
      <circle cx="400" cy="560" r="6" fill="#0f172a" stroke="#64748b" stroke-width="2" />
    `;
  } else {
    // Men's & Junior Formal Suits with Lapels & Tie
    const hasTie = !id.includes('notie');
    let tieColor = '#1e293b';
    if (id.includes('navy') || id.includes('blue') || id.includes('teal')) {
      tieColor = '#1e3a8a';
    } else if (id.includes('burgundy') || id.includes('maroon') || id.includes('plum') || id.includes('wine')) {
      tieColor = '#881337';
    } else if (id.includes('green') || id.includes('olive') || id.includes('emerald') || id.includes('sage')) {
      tieColor = '#166534';
    } else if (id.includes('brown') || id.includes('tan')) {
      tieColor = '#78350f';
    } else if (id.includes('silver') || id.includes('light-grey')) {
      tieColor = '#94a3b8';
    } else if (id.includes('purple')) {
      tieColor = '#6b21a8';
    } else if (id.includes('charcoal')) {
      tieColor = '#334155';
    }

    const shirtColor = id.includes('chocolate-brown') ? '#fef3c7' : '#ffffff';
    const isDoubleBreasted = id.includes('double-breasted');
    const isThreePiece = id.includes('three-piece');
    const isBlazerGrey = id.includes('blazer-grey');

    innerContent = `
      <!-- Suit Outer Jacket Body -->
      <path d="M 120 780 C 130 470, 230 340, 310 320 C 350 310, 450 310, 490 320 C 570 340, 670 470, 680 780 Z" fill="${colorTheme}" />
      ${isBlazerGrey ? `
        <!-- Lower Formal Grey Tonal Trim -->
        <path d="M 120 640 L 680 640 L 680 780 L 120 780 Z" fill="#475569" opacity="0.9" />
      ` : ''}
      <!-- Shirt Inner V-Area -->
      <polygon points="325,320 475,320 430,560 370,560" fill="${shirtColor}" />
      ${isThreePiece ? `
        <!-- Tailored Waistcoat / Vest V-Cut -->
        <polygon points="340,430 460,430 425,580 375,580" fill="${colorTheme}" opacity="0.9" stroke="#334155" stroke-width="1.5" />
      ` : ''}
      <!-- Shirt Collar Wings -->
      <polygon points="320,320 395,355 365,405 315,355" fill="${shirtColor}" stroke="#cbd5e1" stroke-width="2" />
      <polygon points="480,320 405,355 435,405 485,355" fill="${shirtColor}" stroke="#cbd5e1" stroke-width="2" />
      ${hasTie ? `
        <!-- Silk Tie Knot and Blade -->
        <polygon points="390,350 410,350 425,580 400,620 375,580" fill="${tieColor}" stroke="#0f172a" stroke-width="2" />
        <polygon points="385,345 415,345 412,375 388,375" fill="${tieColor}" stroke="#0f172a" stroke-width="1.5" />
      ` : `
        <!-- Open Collar Shadow -->
        <polygon points="390,360 410,360 400,440" fill="#e2e8f0" />
      `}
      <!-- Jacket Lapels (Left & Right) -->
      <polygon points="310,320 380,480 345,560 275,420" fill="${colorTheme}" stroke="#475569" stroke-width="2" />
      <polygon points="490,320 420,480 455,560 525,420" fill="${colorTheme}" stroke="#475569" stroke-width="2" />
      ${isDoubleBreasted ? `
        <!-- Dual Column Horn Buttons -->
        <circle cx="360" cy="530" r="5.5" fill="#f8fafc" stroke="#334155" stroke-width="1.5" />
        <circle cx="440" cy="530" r="5.5" fill="#f8fafc" stroke="#334155" stroke-width="1.5" />
        <circle cx="360" cy="590" r="5.5" fill="#f8fafc" stroke="#334155" stroke-width="1.5" />
        <circle cx="440" cy="590" r="5.5" fill="#f8fafc" stroke="#334155" stroke-width="1.5" />
      ` : `
        <!-- Center Button -->
        <circle cx="400" cy="570" r="5" fill="#0f172a" stroke="#64748b" stroke-width="1.5" />
      `}
      <!-- Pocket Square / Pocket Line -->
      <line x1="230" y1="460" x2="290" y2="455" stroke="${isBlazerGrey ? '#ffffff' : '#475569'}" stroke-width="4" stroke-linecap="round" />
    `;
  }

  // Define soft feathered alpha mask cutout for the neck curve (X: 300 to 500, Y: 180 to 340)
  const svgString = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 900" width="800" height="900">
      <defs>
        <!-- Soft gradient mask for the collar area so it blends seamlessly onto the user's neck -->
        <linearGradient id="neckGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#ffffff" stop-opacity="0" />
          <stop offset="85%" stop-color="#ffffff" stop-opacity="1" />
        </linearGradient>
        <filter id="softShadow" x="-10%" y="-10%" width="120%" height="120%">
          <feDropShadow dx="0" dy="6" stdDeviation="8" flood-opacity="0.25" />
        </filter>
      </defs>
      <g filter="url(#softShadow)">
        ${innerContent}
      </g>
    </svg>
  `;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svgString)}`;
}

/**
 * Image Cache for loaded dress templates
 */
const dressImageCache = new Map<string, HTMLImageElement>();

/**
 * Load dress template image (checking real PNG first, then fallback PNG, then vector SVG)
 */
export async function loadDressImage(template: DressTemplate | { customImageSrc: string }): Promise<HTMLImageElement> {
  const cacheKey = 'customImageSrc' in template && template.customImageSrc 
    ? template.customImageSrc 
    : ('id' in template ? template.id : 'unknown');

  if (dressImageCache.has(cacheKey)) {
    const cached = dressImageCache.get(cacheKey)!;
    if (cached.complete && cached.naturalWidth > 0) {
      return cached;
    }
  }

  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    const tryVectorFallback = () => {
      if ('id' in template) {
        const svgDataUrl = generateDressVectorDataUrl(template);
        img.onload = () => {
          dressImageCache.set(cacheKey, img);
          resolve(img);
        };
        img.onerror = () => {
          resolve(img);
        };
        img.src = svgDataUrl;
      } else {
        resolve(img);
      }
    };

    const tryFallbackPng = () => {
      if ('fallbackImageSrc' in template && template.fallbackImageSrc) {
        const fallbackImg = new Image();
        fallbackImg.crossOrigin = 'anonymous';
        fallbackImg.onload = () => {
          dressImageCache.set(cacheKey, fallbackImg);
          resolve(fallbackImg);
        };
        fallbackImg.onerror = tryVectorFallback;
        fallbackImg.src = template.fallbackImageSrc;
      } else {
        tryVectorFallback();
      }
    };

    img.onload = () => {
      dressImageCache.set(cacheKey, img);
      resolve(img);
    };

    img.onerror = tryFallbackPng;

    if ('customImageSrc' in template && template.customImageSrc) {
      img.src = template.customImageSrc;
    } else if ('imageSrc' in template && template.imageSrc) {
      img.src = template.imageSrc;
    } else {
      tryVectorFallback();
    }
  });
}

/**
 * Composite Dress Layer onto a Destination Canvas Context with feathered neck blending
 */
export function drawDressLayerOnCanvas(
  ctx: CanvasRenderingContext2D,
  dressImg: HTMLImageElement,
  cardWidth: number,
  cardHeight: number,
  dressState: DressTransformState,
  photoPanX = 0,
  photoPanY = 0,
  photoZoom = 1.0,
  photoRotation = 0
) {
  if (!dressImg || (!dressImg.complete && !dressImg.naturalWidth)) return;

  const { offsetX, offsetY, scale, scaleX, scaleY, rotation, collarCutoutY } = dressState;

  ctx.save();

  // Compute center anchor of the suit based on standard passport proportions
  // Head is centered ~35% from top; shoulders / suit start around ~52% to 65% from top
  const photoPanXPx = (photoPanX / 600) * cardWidth;
  const photoPanYPx = (photoPanY / 600) * cardHeight;

  // Center position of the suit overlay
  const suitCenterX = (cardWidth / 2) + photoPanXPx + ((offsetX / 100) * cardWidth);
  const baseSuitCenterY = (cardHeight * 0.76) + (photoPanYPx * 0.7) + ((offsetY / 100) * cardHeight) + collarCutoutY;

  // Translate to suit center
  ctx.translate(suitCenterX, baseSuitCenterY);

  // Combine suit rotation with slight follow of portrait rotation
  const totalRotation = rotation + (photoRotation * 0.25);
  ctx.rotate((totalRotation * Math.PI) / 180);

  // Proportional sizing: suit spans roughly 96% to 110% of card width at scale 1.0
  const baseWidth = cardWidth * 1.05 * scale * scaleX;
  const imgAspect = (dressImg.naturalHeight || dressImg.height || 900) / (dressImg.naturalWidth || dressImg.width || 800);
  const baseHeight = baseWidth * imgAspect * scaleY;

  // Smoothing
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  // Draw the suit centered at (0, 0)
  ctx.drawImage(
    dressImg,
    -baseWidth / 2,
    -baseHeight / 2,
    baseWidth,
    baseHeight
  );

  ctx.restore();
}
