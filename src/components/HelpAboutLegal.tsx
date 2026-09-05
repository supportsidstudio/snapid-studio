import React, { useState, useMemo } from 'react';
import { 
  HelpCircle, 
  Info, 
  Shield, 
  CheckCircle, 
  ChevronRight, 
  FileText, 
  BookOpen, 
  Map, 
  Search, 
  ArrowLeft, 
  Calendar, 
  Clock, 
  Lock, 
  Scale, 
  AlertTriangle, 
  Printer, 
  Download, 
  Laptop, 
  CornerDownRight,
  Globe,
  Mail,
  FileCheck,
  Building,
  UserCheck,
  Crop,
  X
} from 'lucide-react';
import { AppLanguage, AppTheme, AppTab } from '../types';
import { translations } from '../translations';
import { blogArticles, BlogArticle } from '../data/blogArticles';
import { blogArticlesHi } from '../data/blogArticlesHi';

interface HelpAboutLegalProps {
  tab: 'help' | 'about' | 'legal' | 'blog' | 'sitemap';
  language: AppLanguage;
  theme: AppTheme;
  onChangeTab?: (tab: AppTab) => void;
}

export default function HelpAboutLegal({ tab, language, theme, onChangeTab }: HelpAboutLegalProps) {
  const t = translations[language];

  // BLOG STATES
  const [selectedArticleId, setSelectedArticleId] = useState<string | null>(null);
  const [blogSearch, setBlogSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  // FAQ STATES
  const [faqSearch, setFaqSearch] = useState('');
  const [activeFaqCategory, setActiveFaqCategory] = useState<string>('All');
  const [expandedFaqId, setExpandedFaqId] = useState<number | null>(null);

  // LEGAL SUB-TAB STATES
  const [legalSubTab, setLegalSubTab] = useState<'privacy' | 'terms' | 'disclaimer'>('privacy');

  // 12 Comprehensive, AdSense-grade FAQs
  const faqs = useMemo(() => [
    {
      id: 1,
      category: 'Tech & Privacy',
      qEn: "How secure is SnapID Studio? Does it store my biometric facial details?",
      qHi: "SnapID कितना सुरक्षित है? क्या यह मेरे बायोमेट्रिक चेहरे के विवरण को सहेजता है?",
      aEn: "SnapID is engineered on a strict 'Zero Server Transmission' architecture. When you upload a portrait photo or ID document, the files exist solely within your browser's temporary memory (RAM buffer). The AI background removal is executed entirely locally on your machine using WebAssembly (WASM) and ONNX Runtime. No data is sent to our servers, and no facial biometrics or identity numbers are collected, logged, or shared with third parties. Closing the browser tab destroys all buffered assets instantly.",
      aHi: "SnapID पूरी तरह से 'जीरो सर्वर ट्रांसमिशन' आर्किटेक्चर पर काम करता है। जब आप कोई फोटो या आईडी दस्तावेज़ अपलोड करते हैं, तो फ़ाइलें केवल आपके ब्राउज़र की अस्थायी मेमोरी (RAM) में रहती हैं। एआई बैकग्राउंड हटाने का कार्य पूरी तरह से आपके कंप्यूटर पर लोकल रूप से WebAssembly (WASM) तकनीक से होता है। कोई भी विवरण हमारे सर्वर पर नहीं भेजा जाता है और न ही कोई बायोमेट्रिक डेटा या नंबर ट्रैक किया जाता है।"
    },
    {
      id: 2,
      category: 'Passport & Visa',
      qEn: "What is the official passport photo size standard for Indian applications?",
      qHi: "भारतीय पासपोर्ट आवेदनों के लिए आधिकारिक फोटो का आकार क्या है?",
      aEn: "The standard size for Indian Passport photographs at the Passport Seva Kendra (PSK) is exactly 35 mm wide by 45 mm high (3.5 cm x 4.5 cm). The face must cover 70% to 80% of the photograph height (approx. 31.5 mm to 36 mm from chin to top of hair). The background must be pure, uniform white, and the applicant must have a completely neutral expression with eyes wide open and mouth closed. Our built-in 'India/US Passport' preset configures these boundaries automatically.",
      aHi: "पासपोर्ट सेवा केंद्र (PSK) पर भारतीय पासपोर्ट फोटो का आधिकारिक आकार सटीक रूप से 35 मिमी चौड़ा और 45 मिमी ऊंचा (3.5 सेमी x 4.5 सेमी) होता है। चेहरा पूरे फोटो के लगभग 70% से 80% भाग (31.5 मिमी से 36 मिमी) को घेरना चाहिए। बैकग्राउंड पूरी तरह से सफेद होना चाहिए और चेहरे पर कोई मुस्कान या हाव-भाव नहीं होना चाहिए।"
    },
    {
      id: 3,
      category: 'Passport & Visa',
      qEn: "What are the specifications for United States Visa (DS-160) photos?",
      qHi: "यूएस वीज़ा (DS-160) फोटो के लिए आवश्यक मापदंड क्या हैं?",
      aEn: "The US Department of State requires a square photo sized exactly 2 x 2 inches (51 mm x 51 mm). The head height from chin to top of hair must be between 1 inch and 1-3/8 inches (25 mm to 35 mm), or 50% to 69% of the total canvas. The background must be pure white. Critically, eyeglasses are strictly forbidden in US passport and visa photos, unless a signed medical certificate is attached. Digital files must be JPEG, under 240 KB, and at least 600 x 600 pixels.",
      aHi: "अमेरिकी विदेश विभाग को सटीक रूप से 2 x 2 इंच (51 मिमी x 51 मिमी) की चौकोर फोटो की आवश्यकता होती है। चेहरे की ऊंचाई कुल फोटो की 50% से 69% होनी चाहिए। बैकग्राउंड पूरी तरह सफेद होना अनिवार्य है। सबसे महत्वपूर्ण बात यह है कि यूएस फोटो में किसी भी तरह के चश्मे (ऐनक) की अनुमति नहीं है।"
    },
    {
      id: 4,
      category: 'Passport & Visa',
      qEn: "What is the Schengen Visa photo size and preferred background?",
      qHi: "शेंगेन वीज़ा फोटो का आकार और बैकग्राउंड क्या होना चाहिए?",
      aEn: "Schengen Visa applications (for European Union countries) require a 35 mm x 45 mm photograph. The facial area must occupy 70% to 80% of the vertical space (32 mm to 36 mm). Unlike the US, the preferred background for Schengen Visas is plain light gray or light blue rather than stark white, as light gray provides better contrast for automated biometric verification systems on light skin tones.",
      aHi: "शेंगेन वीज़ा आवेदनों (यूरोपीय संघ) के लिए 35 मिमी x 45 मिमी आकार की फोटो की आवश्यकता होती है। चेहरे की ऊंचाई फोटो की कुल ऊंचाई का 70% से 80% होनी चाहिए। शेंगेन वीज़ा के लिए सफेद की तुलना में हल्का ग्रे (धूसर) या हल्का नीला बैकग्राउंड ज्यादा बेहतर माना जाता है।"
    },
    {
      id: 5,
      category: 'Printing',
      qEn: "How do I ensure my photos print at the exact legal dimensions at home?",
      qHi: "मैं यह कैसे सुनिश्चित करूं कि मेरी तस्वीरें घर पर बिल्कुल सही आकार में प्रिंट हों?",
      aEn: "To preserve the exact millimetric size of passport photos, download the grid layout as a PDF or PNG. When sending the file to print in your system print dialog, change the scale setting from 'Fit to page' or 'Shrink to fit' strictly to '100%' or 'Actual Size'. Additionally, ensure borderless printing is disabled, as borderless modes slightly stretch images to cover paper margins, which ruins the physical dimensions of individual photos.",
      aHi: "पासपोर्ट फोटो के सटीक भौतिक आकार को बनाए रखने के लिए, ग्रिड लेआउट को पीडीएफ या पीएनजी के रूप में डाउनलोड करें। प्रिंट करते समय अपने प्रिंटर डायलॉग में 'Fit to page' को हटाकर 'Actual Size' (100%) चुनें। बॉर्डरलेस प्रिंटिंग को भी बंद रखें, क्योंकि यह इमेज को थोड़ा खींच देती है जिससे फोटो का आकार बिगड़ जाता है।"
    },
    {
      id: 6,
      category: 'Printing',
      qEn: "What type of paper should I use for printing ID and passport photos?",
      qHi: "आईडी और पासपोर्ट फोटो प्रिंट करने के लिए मुझे किस प्रकार के पेपर का उपयोग करना चाहिए?",
      aEn: "Always use high-quality photo paper with a weight between 200 GSM and 260 GSM (Grams per Square Meter). For official government submissions, matte or semi-glossy (satin) photo paper is highly recommended. Standard copy paper is too thin and absorbs too much ink (causing bleeding), while high-gloss paper is extremely reflective and can cause camera scanning errors at passport offices due to light glare.",
      aHi: "हमेशा 200 GSM से 260 GSM वजन वाले उच्च गुणवत्ता वाले फोटो पेपर का उपयोग करें। सरकारी आवेदनों के लिए, मैट (घिसी हुई) या सेमी-ग्लॉसी (अर्ध-चमकदार) फोटो पेपर का सुझाव दिया जाता है। साधारण पेपर बहुत पतला होता है जिससे स्याही फैल जाती है, और ज्यादा चमकदार पेपर प्रिंटर और स्कैनर में चमक पैदा करता है।"
    },
    {
      id: 7,
      category: 'Background Removal',
      qEn: "Why is the AI background removal failing or cutting off parts of my portrait?",
      qHi: "एआई बैकग्राउंड हटाने का कार्य मेरे पोर्ट्रेट के कुछ हिस्सों को क्यों काट रहा है?",
      aEn: "Our browser AI separates the foreground from the background by analyzing visual contrast and edge definitions. If you wear a white shirt and stand in front of a white wall, or if the lighting is poor and creates deep facial shadows, the AI model may get confused and over-crop. For best results, capture your photo with clear lighting (preferably facing a window), wear dark clothing that stands out from your surroundings, and avoid standing too close to the wall to prevent back shadows.",
      aHi: "हमारा लोकल एआई कंट्रास्ट और किनारों की पहचान करके पृष्ठभूमि को अलग करता है। यदि आपने सफेद शर्ट पहनी है और सफेद दीवार के सामने खड़े हैं, या रोशनी बहुत कम है, तो एआई को परेशानी हो सकती है। सर्वोत्तम परिणामों के लिए, गहरे रंग के कपड़े पहनें और अच्छी रोशनी में फोटो लें।"
    },
    {
      id: 8,
      category: 'Printing',
      qEn: "What is the difference between downloading as PNG vs downloading as PDF?",
      qHi: "PNG के रूप में डाउनलोड करने और PDF के रूप में डाउनलोड करने में क्या अंतर है?",
      aEn: "PNG is a high-fidelity raster image format ideal for individual cards, single portraits, or sharing digitally on visa portals (like NSDL or DS-160). PDF is a vector-wrapped document format which locks exact physical dimensions (in millimeters) and instructs printers precisely at 300 DPI. For home printing on 4x6 or A4 sheets, downloading the PDF is the absolute best way to ensure there is zero scaling distortion.",
      aHi: "PNG एक उच्च गुणवत्ता वाला इमेज प्रारूप है जो डिजिटल रूप से वीज़ा पोर्टल पर अपलोड करने या सिंगल फोटो साझा करने के लिए उत्तम है। PDF एक प्रिंट-रेडी प्रारूप है जो भौतिक आयामों (मिलीमीटर में) को लॉक कर देता है और प्रिंटर को सटीक रूप से 300 DPI पर प्रिंट करने का निर्देश देता है।"
    },
    {
      id: 9,
      category: 'Indian Documents',
      qEn: "Can I prepare double-sided foldable Indian identity cards with SnapID?",
      qHi: "क्या मैं SnapID के साथ डबल-साइड फोल्डेबल भारतीय पहचान पत्र तैयार कर सकता हूँ?",
      aEn: "Yes! In the 'Documents' tab, we provide dedicated layout engines for Aadhaar, PAN Card, Voter ID, Driving Licence, and Jan Aadhaar. You can upload the Front Side scan and the Back Side scan, crop them individually, and choose from three assembly layouts: 'Side-by-Side' (ideal for horizontal wallet-card folding), 'Stacked' (perfect for vertical laminating), or 'Split Canvas' (centered layout with precise guidelines).",
      aHi: "हाँ! 'दस्तावेज़' टैब में, हम आधार, पैन कार्ड, वोटर आईडी और ड्राइविंग लाइसेंस के लिए लेआउट विकल्प प्रदान करते हैं। आप सामने और पीछे के दोनों स्कैन को अपलोड कर सकते हैं, उन्हें क्रॉप कर सकते हैं और अगल-बगल (Side-by-Side) या ऊपर-नीचे (Stacked) ग्रिड में असेंबल करके प्रिंट निकाल सकते हैं।"
    },
    {
      id: 10,
      category: 'Indian Documents',
      qEn: "What are NSDL PAN card photo and signature upload regulations?",
      qHi: "NSDL पैन कार्ड फोटो और हस्ताक्षर अपलोड करने के क्या नियम हैं?",
      aEn: "For online PAN card applications via Protean (NSDL) or UTIITSL, the photograph must be exactly 2.5 cm x 3.5 cm in size, formatted at 200 DPI, with a file size under 50 KB. The signature must be signed using a black ink pen on clean white paper, cropped tightly to 4.5 cm x 1.5 cm at 200 DPI, and also compressed under 50 KB. SnapID automatically compresses and scales these files to meet these criteria upon download.",
      aHi: "NSDL या UTIITSL के माध्यम से ऑनलाइन पैन कार्ड आवेदन के लिए, फोटो सटीक रूप से 2.5 सेमी x 3.5 सेमी और फाइल 50 KB से कम होनी चाहिए। हस्ताक्षर केवल काली स्याही वाले पेन से सफेद कागज पर होना चाहिए और उसका आकार 4.5 सेमी x 1.5 सेमी (50 KB से कम) होना चाहिए।"
    },
    {
      id: 11,
      category: 'Tech & Privacy',
      qEn: "What devices and browsers are supported by SnapID Studio?",
      qHi: "SnapID स्टूडियो द्वारा कौन से डिवाइस और ब्राउज़र समर्थित हैं?",
      aEn: "SnapID is universally compatible with all modern devices. It is fully responsive and runs on Apple iOS (Safari), Android (Chrome, Edge), Windows PC (Chrome, Firefox, Opera), and macOS. Because the AI model runs locally on your device, newer devices with dedicated graphics processors or WebGL support will execute background removals in milliseconds, while older phones may take a few seconds to initialize WebAssembly.",
      aHi: "SnapID सभी आधुनिक उपकरणों पर चलता है। यह पूरी तरह से रिस्पॉन्सिव है और Apple iOS (Safari), Android, Windows PC, और Mac पर काम करता है। चूंकि एआई आपके अपने डिवाइस पर चलता है, इसलिए नए डिवाइस पर यह काम पलक झपकते ही हो जाता है।"
    },
    {
      id: 12,
      category: 'Printing',
      qEn: "Why does my printed photograph have vertical color streaks or lines?",
      qHi: "मेरे प्रिंट किए गए फोटो में खड़ी रंगीन धारियां या लाइनें क्यों आ रही हैं?",
      aEn: "Vertical streaks or missing bands of color are caused by clogged nozzles in your inkjet printer's print head. This happens when printers sit idle. To fix this, open your computer's Printer Utility software and run a 'Nozzle Check' followed by a 'Print Head Cleaning' cycle. Always ensure you are printing at 'High' or 'Best' quality, and verify that your yellow, cyan, and magenta ink reservoirs are not empty.",
      aHi: "खड़ी धारियाँ या रंगीन लाइनें आपके प्रिंटर के प्रिंट हेड के नोजल ब्लॉक होने के कारण आती हैं। इसे ठीक करने के लिए अपने कंप्यूटर की प्रिंटर सेटिंग में जाकर 'Print Head Cleaning' (हेड सफाई) चक्र चलाएं और हमेशा 'High' या 'Best' क्वालिटी पर प्रिंट करें।"
    }
  ], []);

  // Filtered FAQs based on search & category
  const filteredFaqs = useMemo(() => {
    return faqs.filter(item => {
      const qText = language === 'hi' ? item.qHi : item.qEn;
      const aText = language === 'hi' ? item.aHi : item.aEn;
      const matchesSearch = faqSearch === '' || 
        qText.toLowerCase().includes(faqSearch.toLowerCase()) ||
        aText.toLowerCase().includes(faqSearch.toLowerCase());
      
      const matchesCategory = activeFaqCategory === 'All' || item.category === activeFaqCategory;
      
      return matchesSearch && matchesCategory;
    });
  }, [faqs, faqSearch, activeFaqCategory, language]);

  // Localize articles based on language
  const localizedArticles = useMemo(() => {
    return blogArticles.map(art => {
      if (language === 'hi' && blogArticlesHi[art.id]) {
        const trans = blogArticlesHi[art.id];
        return {
          ...art,
          title: trans.title,
          category: trans.category,
          summary: trans.summary,
          content: trans.content,
          readTime: art.readTime.replace('min read', 'मिनट पढ़ाई')
        };
      }
      return art;
    });
  }, [language]);

  // Filtered Blog Articles
  const filteredArticles = useMemo(() => {
    return localizedArticles.filter(art => {
      const searchLower = blogSearch.toLowerCase();
      const matchesSearch = blogSearch === '' || 
        art.title.toLowerCase().includes(searchLower) ||
        art.summary.toLowerCase().includes(searchLower) ||
        art.content.toLowerCase().includes(searchLower);
      
      const isDefaultCat = selectedCategory === 'All' || selectedCategory === 'सभी केटेगरी';
      const matchesCategory = isDefaultCat || art.category === selectedCategory;
      
      return matchesSearch && matchesCategory;
    });
  }, [localizedArticles, blogSearch, selectedCategory]);

  const blogCategories = useMemo(() => {
    const cats = new Set(localizedArticles.map(a => a.category));
    return [language === 'hi' ? 'सभी केटेगरी' : 'All', ...Array.from(cats)];
  }, [localizedArticles, language]);

  // Simple custom Markdown rendering to avoid loading react-markdown package which can sometimes fail or exceed token limits
  const renderArticleContent = (content: string) => {
    const lines = content.split('\n');
    let insideList = false;
    let listItems: string[] = [];

    return lines.map((line, idx) => {
      const trimmed = line.trim();
      
      if (trimmed.startsWith('# ')) {
        return (
          <h1 key={idx} className="text-2xl md:text-3xl font-black font-display tracking-tight text-slate-900 dark:text-white mt-8 mb-4 border-b border-slate-200 dark:border-slate-800 pb-3 leading-tight">
            {trimmed.substring(2)}
          </h1>
        );
      }
      
      if (trimmed.startsWith('## ')) {
        return (
          <h2 key={idx} className="text-xl md:text-2xl font-extrabold font-display tracking-tight text-slate-800 dark:text-slate-100 mt-8 mb-3 leading-snug">
            {trimmed.substring(3)}
          </h2>
        );
      }
      
      if (trimmed.startsWith('### ')) {
        return (
          <h3 key={idx} className="text-base md:text-lg font-bold text-blue-500 dark:text-blue-400 mt-6 mb-2">
            {trimmed.substring(4)}
          </h3>
        );
      }

      if (trimmed.startsWith('- **') && trimmed.includes(':** ')) {
        const parts = trimmed.substring(4).split(':** ');
        return (
          <li key={idx} className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed ml-5 list-disc my-1.5">
            <strong className="text-slate-900 dark:text-white">{parts[0]}:</strong> {parts[1]}
          </li>
        );
      }

      if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
        return (
          <li key={idx} className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed ml-5 list-disc my-1.5">
            {trimmed.substring(2)}
          </li>
        );
      }

      if (trimmed.startsWith('|') && trimmed.endsWith('|') && trimmed.includes('---')) {
        return null; // Skip table header dividers
      }

      if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
        const cols = trimmed.split('|').map(c => c.trim()).filter((_, i) => i !== 0 && i !== trimmed.split('|').length - 1);
        const isHeader = idx < 20 && lines[idx+1]?.includes('---'); // Rough check for table header
        return (
          <div key={idx} className={`grid grid-cols-${cols.length} gap-2 p-3 border-b text-[11px] leading-relaxed ${
            isHeader 
              ? 'bg-slate-100 dark:bg-slate-900 font-bold text-slate-900 dark:text-white border-slate-300 dark:border-slate-750' 
              : 'border-slate-150 dark:border-slate-850 text-slate-600 dark:text-slate-300'
          }`}>
            {cols.map((col, cIdx) => (
              <div key={cIdx} className="break-words">{col.replace(/\\"/g, '"')}</div>
            ))}
          </div>
        );
      }

      if (trimmed === '---') {
        return <hr key={idx} className="my-6 border-slate-200 dark:border-slate-800" />;
      }

      if (trimmed.startsWith('[ ]') || trimmed.startsWith('[x]')) {
        const checked = trimmed.startsWith('[x]');
        return (
          <div key={idx} className="flex items-center gap-3.5 py-1.5 text-xs text-slate-600 dark:text-slate-300">
            <input type="checkbox" checked={checked} readOnly className="rounded border-slate-300 dark:border-slate-800 text-blue-500 w-4 h-4 bg-transparent" />
            <span>{trimmed.substring(4)}</span>
          </div>
        );
      }

      if (trimmed === '') return <div key={idx} className="h-2" />;

      return (
        <p key={idx} className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed my-3.5">
          {trimmed}
        </p>
      );
    });
  };

  // 1. HELP & FAQ RENDERING
  if (tab === 'help') {
    return (
      <div className="space-y-6 max-w-4xl animate-fade-in">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black font-display tracking-tight text-inherit flex items-center gap-2">
              <HelpCircle className="w-6 h-6 text-blue-500" />
              <span>{t.helpTitle}</span>
            </h1>
            <p className="text-xs text-slate-400 mt-1">{t.helpTagline}</p>
          </div>
          {/* FAQ Search Bar */}
          <div className="relative w-full sm:w-72 shrink-0">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder={language === 'hi' ? 'अक्सर पूछे जाने वाले प्रश्न खोजें...' : 'Search answers, standard specs...'}
              value={faqSearch}
              onChange={(e) => setFaqSearch(e.target.value)}
              className={`w-full text-xs py-2.5 pl-9 pr-4 rounded-xl border outline-none transition-all ${
                theme === 'dark' 
                  ? 'bg-slate-900 border-slate-800 focus:border-blue-500 text-white' 
                  : 'bg-white border-slate-200 focus:border-blue-500 text-slate-800'
              }`}
            />
          </div>
        </div>

        {/* 📸 Important Photo Tip Notice */}
        <div className={`p-5 rounded-2xl border ${
          theme === 'dark' 
            ? 'bg-amber-500/5 border-amber-500/20' 
            : 'bg-amber-50 border-amber-200 shadow-xs'
        } space-y-3`}>
          <h3 className="font-extrabold text-sm text-amber-700 dark:text-amber-500 flex items-center gap-2">
            <span>{(t as any).photoTipTitle}</span>
          </h3>
          <div className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed space-y-1.5 font-medium">
            <p>{(t as any).photoTipContent1}</p>
            <p className="font-bold text-amber-700 dark:text-amber-400">{(t as any).photoTipContent2}</p>
            <p>{(t as any).photoTipContent3}</p>
          </div>
        </div>

        {/* 📋 Auto Crop & ID Scanning Guidance */}
        <div className={`p-6 rounded-2xl border ${
          theme === 'dark' 
            ? 'bg-slate-900/50 border-slate-800' 
            : 'bg-white border-slate-200 shadow-sm'
        } space-y-6`}>
          
          <div className="flex items-center gap-3 border-b pb-4 border-slate-150 dark:border-slate-800">
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-500">
              <Crop className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h2 className="text-base font-black font-display tracking-tight text-slate-800 dark:text-slate-100">
                {(t as any).autoCropGuidanceTitle}
              </h2>
              <p className="text-[11px] text-slate-650 dark:text-slate-400 font-medium">
                {language === 'hi' ? 'दस्तावेजों को स्वचालित रूप से क्रॉप करने के लिए सर्वोत्तम अभ्यास' : 'Best practices for automatic document cropping & framing'}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Guidance Tips & Supported Docs */}
            <div className="space-y-6">
              <div>
                <h3 className="font-bold text-xs text-slate-750 dark:text-slate-350 uppercase tracking-wider mb-3">
                  {language === 'hi' ? 'महत्वपूर्ण दिशानिर्देश' : 'Core Instructions'}
                </h3>
                <ul className="space-y-2">
                  {[
                    (t as any).autoCropGuidanceTip1,
                    (t as any).autoCropGuidanceTip2,
                    (t as any).autoCropGuidanceTip3,
                    (t as any).autoCropGuidanceTip4,
                    (t as any).autoCropGuidanceTip5,
                    (t as any).autoCropGuidanceTip6,
                    (t as any).autoCropGuidanceTip7,
                    (t as any).autoCropGuidanceTip8,
                    (t as any).autoCropGuidanceTip9
                  ].map((tip, idx) => (
                    <li key={idx} className="flex items-start gap-2.5 text-xs text-slate-700 dark:text-slate-300">
                      <span className="flex items-center justify-center w-5 h-5 rounded-full bg-blue-500/10 text-blue-500 text-[10px] font-bold shrink-0 mt-0.5">
                        {idx + 1}
                      </span>
                      <span className="leading-relaxed">{tip}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Supported Documents */}
              <div className={`p-4 rounded-xl ${
                theme === 'dark' ? 'bg-slate-950/40 border border-slate-850' : 'bg-slate-50 border border-slate-150'
              } space-y-2.5`}>
                <h4 className="font-extrabold text-xs text-slate-800 dark:text-slate-200">
                  {(t as any).supportedDocsTitle}
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    (t as any).supportedDocAadhaar,
                    (t as any).supportedDocPan,
                    (t as any).supportedDocVoter,
                    (t as any).supportedDocLicence,
                    (t as any).supportedDocPassport,
                    (t as any).supportedDocOther
                  ].map((doc, idx) => (
                    <span 
                      key={idx} 
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold ${
                        theme === 'dark' 
                          ? 'bg-slate-900 border border-slate-800 text-slate-300' 
                          : 'bg-white border border-slate-250 text-slate-750 shadow-xs'
                      }`}
                    >
                      {doc}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Visual Sample Images */}
            <div className="flex flex-col justify-between">
              <div>
                <h3 className="font-bold text-xs text-slate-750 dark:text-slate-350 uppercase tracking-wider mb-3">
                  {language === 'hi' ? 'उदाहरण (सही बनाम गलत)' : 'Visual Examples (Correct vs Incorrect)'}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3 gap-4">
                  
                  {/* Correct Sample Card */}
                  <div className={`flex flex-col rounded-xl border p-3 ${
                    theme === 'dark' ? 'bg-slate-950 border-emerald-500/20' : 'bg-emerald-50/10 border-emerald-200'
                  }`}>
                    <div className="relative aspect-video rounded-lg overflow-hidden border border-emerald-500/20 bg-slate-100 dark:bg-slate-900 flex items-center justify-center p-2 mb-2">
                      {/* Grid overlay */}
                      <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 opacity-20 pointer-events-none">
                        <div className="border-b border-r border-slate-400"></div>
                        <div className="border-b border-r border-slate-400"></div>
                        <div className="border-b border-slate-400"></div>
                        <div className="border-b border-r border-slate-400"></div>
                        <div className="border-b border-r border-slate-400"></div>
                        <div className="border-b border-slate-400"></div>
                        <div className="border-r border-slate-400"></div>
                        <div className="border-r border-slate-400"></div>
                        <div></div>
                      </div>
                      
                      {/* Perfect mock card */}
                      <div className="w-[85%] h-[80%] rounded bg-gradient-to-tr from-sky-600/30 via-teal-600/20 to-emerald-500/20 border border-emerald-500 flex flex-col justify-between p-2 shadow-sm relative">
                        <div className="flex items-center gap-1.5">
                          <div className="w-4 h-4 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-500 font-bold text-[8px]">★</div>
                          <div className="h-1 w-8 bg-slate-400/40 rounded"></div>
                        </div>
                        <div className="space-y-1">
                          <div className="h-1 w-12 bg-slate-400/35 rounded"></div>
                          <div className="h-1 w-10 bg-slate-400/25 rounded"></div>
                        </div>
                        <div className="absolute top-1 right-1 w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center text-white text-[10px] font-black shadow-xs">✓</div>
                      </div>
                    </div>
                    <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                      <CheckCircle className="w-3.5 h-3.5" />
                      <span>{(t as any).sampleCorrect}</span>
                    </span>
                  </div>

                  {/* Too Far Card */}
                  <div className={`flex flex-col rounded-xl border p-3 ${
                    theme === 'dark' ? 'bg-slate-950 border-rose-500/20' : 'bg-rose-50/10 border-rose-200'
                  }`}>
                    <div className="relative aspect-video rounded-lg overflow-hidden border border-rose-500/20 bg-slate-100 dark:bg-slate-900 flex items-center justify-center p-2 mb-2">
                      {/* Tiny mock card */}
                      <div className="w-[30%] h-[28%] rounded bg-gradient-to-tr from-slate-400/10 to-slate-500/20 border border-rose-500/50 flex flex-col justify-between p-0.5 shadow-xs relative">
                        <div className="h-0.5 w-2 bg-slate-400/40 rounded"></div>
                        <div className="h-0.5 w-4 bg-slate-400/35 rounded"></div>
                        <div className="absolute top-0.5 right-0.5 w-2.5 h-2.5 rounded-full bg-rose-500 flex items-center justify-center text-white text-[6px] font-black">×</div>
                      </div>
                    </div>
                    <span className="text-[11px] font-bold text-rose-650 dark:text-rose-400 flex items-center gap-1">
                      <X className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                      <span>{(t as any).sampleTooFar}</span>
                    </span>
                  </div>

                  {/* Tilted Card */}
                  <div className={`flex flex-col rounded-xl border p-3 ${
                    theme === 'dark' ? 'bg-slate-950 border-rose-500/20' : 'bg-rose-50/10 border-rose-200'
                  }`}>
                    <div className="relative aspect-video rounded-lg overflow-hidden border border-rose-500/20 bg-slate-100 dark:bg-slate-900 flex items-center justify-center p-2 mb-2">
                      {/* Perspective rotated mock card with glare */}
                      <div 
                        className="w-[80%] h-[75%] rounded bg-gradient-to-tr from-slate-400/15 to-slate-500/20 border border-rose-500/50 flex flex-col justify-between p-2 shadow-xs relative"
                        style={{ transform: 'perspective(200px) rotateY(-15deg) rotateX(15deg) skewX(5deg)' }}
                      >
                        <div className="h-1 w-6 bg-slate-400/30 rounded"></div>
                        <div className="h-1 w-10 bg-slate-400/20 rounded"></div>
                        
                        {/* High glare linear overlay */}
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent transform rotate-45 pointer-events-none"></div>
                        <div className="absolute top-1 right-1 w-4 h-4 rounded-full bg-rose-500 flex items-center justify-center text-white text-[8px] font-black">×</div>
                      </div>
                    </div>
                    <span className="text-[11px] font-bold text-rose-650 dark:text-rose-400 flex items-center gap-1">
                      <X className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                      <span>{(t as any).sampleTilted}</span>
                    </span>
                  </div>

                </div>
              </div>

              {/* Note tip at bottom */}
              <div className="mt-4 p-3.5 rounded-xl bg-blue-50/50 dark:bg-blue-500/5 border border-blue-150 dark:border-blue-500/10 text-[11px] text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                {(t as any).autoCropGuidanceTip10}
              </div>
            </div>

          </div>

        </div>

        {/* Category Pills */}
        <div className="flex flex-wrap gap-2">
          {['All', 'Passport & Visa', 'Indian Documents', 'Printing', 'Background Removal', 'Tech & Privacy'].map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveFaqCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-[11px] font-bold border transition-colors ${
                activeFaqCategory === cat
                  ? 'bg-blue-600 text-white border-blue-600'
                  : theme === 'dark'
                    ? 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                    : 'bg-white border-slate-200 text-slate-600 hover:text-slate-900'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* FAQ Accordion List */}
        <div className="space-y-3.5">
          {filteredFaqs.length > 0 ? (
            filteredFaqs.map((item) => {
              const question = language === 'hi' ? item.qHi : item.qEn;
              const answer = language === 'hi' ? item.aHi : item.aEn;
              const isExpanded = expandedFaqId === item.id;
              return (
                <div 
                  key={item.id} 
                  className={`rounded-2xl border transition-all ${
                    theme === 'dark' 
                      ? 'bg-slate-950/70 border-slate-900 hover:border-slate-800' 
                      : 'bg-white border-slate-200 hover:border-slate-300 shadow-xs'
                  }`}
                >
                  <button
                    onClick={() => setExpandedFaqId(isExpanded ? null : item.id)}
                    className="w-full flex items-center justify-between p-5 text-left font-bold text-xs md:text-sm text-slate-800 dark:text-slate-100 gap-4"
                  >
                    <span className="flex items-start gap-2.5">
                      <span className="text-blue-500 font-mono text-[11px] uppercase tracking-wider font-extrabold">Q.</span>
                      <span>{question}</span>
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[9px] uppercase font-bold shrink-0 ${
                      theme === 'dark' ? 'bg-slate-900 text-slate-450' : 'bg-slate-100 text-slate-500'
                    }`}>
                      {item.category}
                    </span>
                  </button>
                  
                  {isExpanded && (
                    <div className="px-5 pb-5 pt-1 text-xs text-slate-700 dark:text-slate-300 leading-relaxed border-t border-slate-150 dark:border-slate-900 animate-fade-in space-y-2 font-medium">
                      <p className="whitespace-pre-wrap">{answer}</p>
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <div className="p-12 text-center rounded-2xl border border-dashed border-slate-800 text-slate-500 text-xs">
              No answers found for your search. Try typing "DPI", "India", or "Size".
            </div>
          )}

          {/* Quick-Print Guidelines card */}
          <div className={`p-5 rounded-2xl border ${
            theme === 'dark' ? 'bg-blue-900/5 border-blue-500/15' : 'bg-blue-50/30 border-blue-150 shadow-xs'
          } space-y-3`}>
            <h4 className="font-bold text-xs text-blue-600 dark:text-blue-400 uppercase tracking-wider flex items-center gap-2">
              <Printer className="w-4 h-4" />
              <span>{language === 'hi' ? 'दस्तावेज़ मुद्रण गाइड' : 'DPI & Print-to-Scale Guidelines'}</span>
            </h4>
            <ul className="space-y-2 text-xs text-slate-700 dark:text-slate-300 font-medium">
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span>
                  {language === 'hi' 
                    ? '1. मुद्रण करते समय "सटीक 100% आकार" चुनें |' 
                    : '1. Scale Settings: Always choose "Actual Size" or "100%" in the print dialogue box. Never choose "Fit to Page".'}
                </span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span>
                  {language === 'hi' 
                    ? '2. आधार और पैन के लिए 85.6mm x 54mm का लेआउट सुनिश्चित करें |' 
                    : '2. Alignment: Aadhaar and PAN layouts in SnapID match standard physical plastic credit cards exactly (85.6 mm x 54 mm).'}
                </span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span>
                  {language === 'hi' 
                    ? '3. फोटो पेपर या गाढ़े कार्ड शीट का इस्तेमाल करें ताकी मुद्रण बेहतरीन हो |' 
                    : '3. Media Choice: Matte photographic paper (200+ GSM) produces clear official photographs free of reflective light reflections.'}
                </span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  // 2. ABOUT US RENDERING (Corporate Grade)
  if (tab === 'about') {
    return (
      <div className="space-y-6 max-w-4xl animate-fade-in">
        <div>
          <h1 className="text-2xl font-black font-display tracking-tight text-inherit flex items-center gap-2">
            <Info className="w-6 h-6 text-blue-500" />
            <span>{language === 'hi' ? 'हमारे बारे में' : 'About SnapID Studio'}</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">{t.aboutTagline}</p>
        </div>

        {/* Core Profile Card */}
        <div className={`p-6 md:p-8 rounded-3xl border space-y-6 ${
          theme === 'dark' ? 'bg-slate-950 border-slate-900' : 'bg-white border-slate-200 shadow-sm'
        }`}>
          <div className="flex items-center gap-4 border-b pb-5 border-slate-150 dark:border-slate-900">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-cyan-500 flex items-center justify-center text-white font-extrabold text-xl shadow-md">
              S
            </div>
            <div>
              <h3 className="font-extrabold text-base text-inherit leading-tight">
                SnapID Core Setup
              </h3>
              <p className="text-[11px] text-slate-400">Professional Identity Layout Studio • Est. 2026</p>
            </div>
          </div>

          <div className="space-y-4 text-xs md:text-sm text-slate-400 leading-relaxed">
            <p>{t.aboutP1}</p>
            
            <p className="font-semibold text-blue-500 dark:text-blue-400">
              {t.aboutP2}
            </p>

            <p>
              {language === 'hi' 
                ? 'SnapID के साथ मुद्रण कार्य बहुत ही तेज, त्रुटिहीन और सुरक्षित हो जाते हैं क्योंकि सारा विवरण आपके सैंडबॉक्स में ही प्रोसेस होता है | हमारा लक्ष्य डिजिटल साक्षरता और त्वरित सरकारी दस्तावेज़ीकरण को आसान बनाना है।' 
                : 'By leveraging robust browser-side container systems and local memory caches, SnapID processes raw uploads, document crops, and passport configurations in less than two seconds, saving tremendous print shop layout overhead.'}
            </p>
          </div>
        </div>

        {/* Company Mission & Core Values Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className={`p-6 rounded-2xl border space-y-3 ${
            theme === 'dark' ? 'bg-slate-950 border-slate-900' : 'bg-white border-slate-200 shadow-sm'
          }`}>
            <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <Building className="w-4 h-4 text-blue-500" />
              <span>{language === 'hi' ? 'हमारा दृष्टिकोण और कॉर्पोरेट मिशन' : 'Our Vision & Corporate Mission'}</span>
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              {language === 'hi' 
                ? 'SnapID स्टूडियो में, हमारा मिशन आम नागरिकों, फोटो ऑपरेटरों और डिजिटल सेवा केंद्रों को पूर्ण दस्तावेज़ संप्रभुता प्रदान करना है। हमारा मानना ​​है कि बायोमेट्रिक-सम्मत फॉर्मेटिंग उपकरण सार्वभौमिक रूप से सभी के लिए पूरी तरह से मुफ्त और सुरक्षित रूप से उपलब्ध होने चाहिए।'
                : 'At SnapID Studio, our mission is to deliver complete document sovereignty to citizens, photo operators, and digital service bureaus. We believe that professional, biometric-compliant formatting utilities should be universally accessible, free from commercial walls, and built with absolute, non-compromising technical safety.'}
            </p>
          </div>

          <div className={`p-6 rounded-2xl border space-y-3 ${
            theme === 'dark' ? 'bg-slate-950 border-slate-900' : 'bg-white border-slate-200 shadow-sm'
          }`}>
            <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-cyan-500" />
              <span>{language === 'hi' ? 'मूल सिद्धांत और नैतिकता' : 'Core Principles & Ethics'}</span>
            </h3>
            <ul className="text-xs text-slate-400 space-y-1.5">
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
                <span>
                  {language === 'hi'
                    ? <><strong>पूर्ण गोपनीयता:</strong> शून्य डेटाबेस भंडारण, शून्य सर्वर अपलोड।</>
                    : <><strong>Absolute Privacy:</strong> Zero database storage, zero upload logs.</>}
                </span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
                <span>
                  {language === 'hi'
                    ? <><strong>सटीक माप:</strong> सत्यापित आईएसओ और यूआईडीएआई फ्रेम आयाम।</>
                    : <><strong>Millimetric Accuracy:</strong> Verified ISO & UIDAI preset frames.</>}
                </span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
                <span>
                  {language === 'hi'
                    ? <><strong>समुदाय प्रथम:</strong> सीएससी, साइबर कैफे और कियोस्क के लिए मुफ्त उपयोग।</>
                    : <><strong>Community First:</strong> Free software for CSCs, cyber cafés, and kiosks.</>}
                </span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  // 3. LEGAL PORTAL RENDERING (Compliance & AdSense)
  if (tab === 'legal') {
    return (
      <div className="space-y-6 max-w-4xl animate-fade-in">
        <div>
          <h1 className="text-2xl font-black font-display tracking-tight text-inherit flex items-center gap-2">
            <Shield className="w-6 h-6 text-blue-500" />
            <span>{language === 'hi' ? 'कानूनी और गोपनीयता' : 'Compliance & Legal Center'}</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">{t.legalTagline}</p>
        </div>

        {/* Legal Sub Tabs */}
        <div className="flex border-b border-slate-200 dark:border-slate-900">
          <button
            onClick={() => setLegalSubTab('privacy')}
            className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-colors ${
              legalSubTab === 'privacy'
                ? 'border-blue-500 text-blue-500'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            {language === 'hi' ? 'गोपनीयता नीति' : 'Privacy Policy'}
          </button>
          <button
            onClick={() => setLegalSubTab('terms')}
            className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-colors ${
              legalSubTab === 'terms'
                ? 'border-blue-500 text-blue-500'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            {language === 'hi' ? 'सेवा की शर्तें' : 'Terms of Service'}
          </button>
          <button
            onClick={() => setLegalSubTab('disclaimer')}
            className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-colors ${
              legalSubTab === 'disclaimer'
                ? 'border-blue-500 text-blue-500'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            {language === 'hi' ? 'अस्वीकरण' : 'General Disclaimer'}
          </button>
        </div>

        {/* Legal Content Card */}
        <div className={`p-6 md:p-8 rounded-2xl border space-y-6 ${
          theme === 'dark' ? 'bg-slate-950 border-slate-900' : 'bg-white border-slate-200 shadow-sm'
        }`}>
          {legalSubTab === 'privacy' && (
            <div className="space-y-4 text-xs md:text-sm text-slate-400 leading-relaxed">
              {language === 'hi' ? (
                <>
                  <h2 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                    <Lock className="w-4 h-4 text-blue-500" />
                    <span>GDPR और डिजिटल व्यक्तिगत डेटा संरक्षण (DPDP) अधिनियम 2023 के अनुकूल गोपनीयता नीति</span>
                  </h2>
                  <p>
                    SnapID स्टूडियो में, हम आपकी डेटा सुरक्षा और गोपनीयता के लिए पूरी तरह प्रतिबद्ध हैं। हम <strong>डेटा न्यूनीकरण (Data Minimization)</strong> के सिद्धांत का कड़ाई से पालन करते हैं।
                  </p>
                  
                  <h3 className="font-bold text-slate-900 dark:text-white mt-4">1. जानकारी जिसे हम कभी एकत्र नहीं करते (जीरो-डेटा वादा)</h3>
                  <p>
                    अन्य ऑनलाइन फोटो एडिटिंग वेबसाइटों के विपरीत, हमें उपयोगकर्ता पंजीकरण (साइन-अप) या ईमेल आईडी की कोई आवश्यकता नहीं होती है। जब आप अपनी तस्वीर या दस्तावेज़ अपलोड करते हैं, तो वे पूरी तरह से आपके ब्राउज़र की अस्थायी मेमोरी (RAM) में संकुचित और प्रोसेस होते हैं। हम किसी भी फोटो, चेहरे के विवरण या पहचान पत्र के नंबरों को अपने सर्वर पर अपलोड नहीं करते हैं। आपके ब्राउज़र टैब को बंद करते ही आपका सारा डेटा तुरंत और स्थायी रूप से नष्ट हो जाता है।
                  </p>

                  <h3 className="font-bold text-slate-900 dark:text-white mt-4">2. कुकीज़ और विज्ञापन (Google AdSense)</h3>
                  <p>
                    SnapID आपकी प्राथमिकताओं (जैसे डार्क/लाइट थीम या भाषा सेटिंग) को सहेजने के लिए केवल आवश्यक ब्राउज़र कुकीज़ का उपयोग करता है। हम विज्ञापन दिखाने के लिए Google AdSense का उपयोग करते हैं, जिससे हमारी वेबसाइट होस्टिंग का खर्च निकलता है। गूगल और अन्य सहयोगी कुकीज़ का उपयोग करके प्रासंगिक विज्ञापन प्रदर्शित करते हैं। आप गूगल की विज्ञापन सेटिंग्स पर जाकर इसे नियंत्रित कर सकते हैं।
                  </p>

                  <h3 className="font-bold text-slate-900 dark:text-white mt-4">3. लॉग फाइल्स</h3>
                  <p>
                    हम वेबसाइट पर आने वाले आगंतुकों की संख्या, ब्राउज़र के प्रकार और समय की केवल अनाम सांख्यिकी (अनाम लॉग) एकत्र करते हैं, ताकि वेबसाइट के ट्रैफ़िक लोड की निगरानी की जा सके। इनका आपके दस्तावेज़ों या निजी तस्वीरों से कोई संबंध नहीं होता है।
                  </p>
                </>
              ) : (
                <>
                  <h2 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                    <Lock className="w-4 h-4 text-blue-500" />
                    <span>GDPR & DPDP Act (2023) Compliant Privacy Policy</span>
                  </h2>
                  <p>
                    At SnapID Studio, accessible from <strong>https://snapid.studio/</strong>, our primary priority is the complete safety and privacy of our visitors. We adhere strictly to the principle of <strong>Data Minimization</strong>.
                  </p>
                  
                  <h3 className="font-bold text-slate-900 dark:text-white mt-4">1. Information We Do Not Collect (Zero-Data Promise)</h3>
                  <p>
                    Unlike standard online photo editing utilities, we do not require user account registration, email sign-ups, or credit card submissions. When you upload photos, scans, or document files to crop, they are processed locally within your device's browser memory (RAM) utilizing sandboxed HTML5 WebAssembly scripts. No image buffers, face coordinates, or alphanumeric document text are uploaded, cached, stored, or transmitted to any remote servers. 
                  </p>

                  <h3 className="font-bold text-slate-900 dark:text-white mt-4">2. Cookies & Third-Party Advertising (Google AdSense)</h3>
                  <p>
                    SnapID uses standard web browser cookies purely for maintaining system preferences (such as saving your Day/Night mode choice or Hindi/English language setting). 
                    We integrate Google AdSense to serve non-intrusive advertisements that fund our continuous hosting costs. Google and third-party vendors use cookies (such as the DoubleClick cookie) to serve relevant advertisements based on standard, non-personally identifiable web activity. Users can opt out of personalized advertising by visiting Google's Ads Settings page.
                  </p>

                  <h3 className="font-bold text-slate-900 dark:text-white mt-4">3. Log Files</h3>
                  <p>
                    We collect anonymous web page counts (visitor quantities, browser types, timestamp logs, referrers) to monitor bandwidth load. These telemetry files do not contain personal details or names and are completely disconnected from the photos or cards processed.
                  </p>
                </>
              )}
            </div>
          )}

          {legalSubTab === 'terms' && (
            <div className="space-y-4 text-xs md:text-sm text-slate-400 leading-relaxed">
              {language === 'hi' ? (
                <>
                  <h2 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                    <Scale className="w-4 h-4 text-blue-500" />
                    <span>सेवा की शर्तें और लाइसेंस समझौते</span>
                  </h2>
                  <p>
                    SnapID स्टूडियो में आपका स्वागत है। हमारी वेबसाइट का उपयोग करके आप निम्नलिखित शर्तों का पूरी तरह से पालन करने के लिए सहमत होते हैं।
                  </p>

                  <h3 className="font-bold text-slate-900 dark:text-white mt-4">1. स्वीकृत उपयोग और लाइसेंस</h3>
                  <p>
                    SnapID स्टूडियो आपको व्यावसायिक या व्यक्तिगत उपयोग (जैसे साइबर कैफ़े, ग्राहक सेवा केंद्र (CSC), या डिजिटल सेवा केंद्रों पर दस्तावेज़ सेट करने) के लिए हमारे क्लाइंट-साइड संरेखक सॉफ्टवेयर का उपयोग करने का निःशुल्क और गैर-हस्तांतरणीय अधिकार देता है। हमारी सभी सेवाएं पूरी तरह से मुफ्त हैं।
                  </p>

                  <h3 className="font-bold text-slate-900 dark:text-white mt-4">2. प्रतिबंधित और अवैध गतिविधियाँ</h3>
                  <p>
                    आप यह वचन देते हैं कि आप किसी भी धोखाधड़ी, जालसाजी, नकली सरकारी आईडी या अवैध प्रतिरूपण के लिए इस सॉफ्टवेयर का उपयोग नहीं करेंगे। किसी भी अवैध गतिविधि के लिए उपयोग पाए जाने पर सेवा का अधिकार तुरंत समाप्त कर दिया जाएगा।
                  </p>

                  <h3 className="font-bold text-slate-900 dark:text-white mt-4">3. बौद्धिक संपदा अधिकार</h3>
                  <p>
                    SnapID की कोडिंग संरचना, इंटरफ़ेस डिजाइन, लोगो, वेक्टर एसेट्स और स्थानीय पृष्ठभूमि हटाने की एल्गोरिदम तकनीकें SnapID स्टूडियो की अनन्य संपत्ति हैं। आप व्यावसायिक लाभ के लिए हमारी मूल कोडिंग का क्लोन या री-पैकेज नहीं कर सकते हैं।
                  </p>
                </>
              ) : (
                <>
                  <h2 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                    <Scale className="w-4 h-4 text-blue-500" />
                    <span>Terms of Service & Licensing Agreements</span>
                  </h2>
                  <p>
                    Welcome to SnapID Studio. By accessing and using our application, you accept and agree to comply with the following operational terms in full.
                  </p>

                  <h3 className="font-bold text-slate-900 dark:text-white mt-4">1. Approved Use and License</h3>
                  <p>
                    SnapID Studio grants you a free, non-exclusive, revocable license to utilize our client-side software canvas engine for individual or commercial document preparation (such as layout assembly in a photo studio, cyber café, or Common Service Centre). All downloads are free of charge.
                  </p>

                  <h3 className="font-bold text-slate-900 dark:text-white mt-4">2. Prohibited & Unlawful Activities</h3>
                  <p>
                    You represent and warrant that you will not use SnapID Studio to crop, compile, or format any scanned credentials or photographs for counterfeit, fraudulent representation, forgery, or deceptive purposes. You may not upload or process templates representing stolen documents or create fake identity layouts. Any illegal formatting instantly voids your license to use the app.
                  </p>

                  <h3 className="font-bold text-slate-900 dark:text-white mt-4">3. Intellectual Property</h3>
                  <p>
                    The SnapID software architecture, interface layouts, vector branding assets, custom-designed icons, and compiled background-extraction algorithms are the exclusive intellectual property of SnapID Studio. You may not scrape, clone, repackage, or distribute our core engine for commercial sale.
                  </p>
                </>
              )}
            </div>
          )}

          {legalSubTab === 'disclaimer' && (
            <div className="space-y-4 text-xs md:text-sm text-slate-400 leading-relaxed">
              {language === 'hi' ? (
                <>
                  <h2 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-500" />
                    <span>व्यावसायिक दायित्व सीमाएं और अस्वीकरण</span>
                  </h2>
                  <p>
                    SnapID स्टूडियो पर उपलब्ध सभी उपकरण 'जैसा है' (As Is) और 'जैसे उपलब्ध है' के आधार पर बिना किसी वारंटी के प्रदान किए जाते हैं।
                  </p>

                  <h3 className="font-bold text-slate-900 dark:text-white mt-4">1. गैर-सरकारी संबद्धता वक्तव्य</h3>
                  <p>
                    SnapID एक स्वतंत्र मुफ्त वेब एप्लीकेशन टलयूटीलिटी है। हमारा भारत सरकार के विदेश मंत्रालय (MEA), भारतीय विशिष्ट पहचान प्राधिकरण (UIDAI), आयकर विभाग (NSDL/UTIITSL), यूएस स्टेट डिपार्टमेंट या किसी अन्य राष्ट्रीय या अंतर्राष्ट्रीय सरकारी निकाय से कोई संबंध या आधिकारिक संबद्धता नहीं है।
                  </p>

                  <h3 className="font-bold text-slate-900 dark:text-white mt-4">2. उपयोगकर्ताओं की सत्यापन जिम्मेदारी</h3>
                  <p>
                    हालांकि हम यह सुनिश्चित करने का पूरा प्रयास करते हैं कि हमारे आयाम (आधार 85.6x54 मिमी, भारतीय पासपोर्ट 35x45 मिमी, यूएस वीजा 2x2 इंच) बिल्कुल सटीक हों, फिर भी समय के साथ सरकारी नियम बदल सकते हैं। प्रिंट निकालने और जमा करने से पहले आयामों की भौतिक माप से पुष्टि करना पूरी तरह उपयोगकर्ता की जिम्मेदारी है। किसी भी प्रकार के अस्वीकृत आवेदनों या मुद्रण खर्चों के लिए SnapID जिम्मेदार नहीं होगा।
                  </p>
                </>
              ) : (
                <>
                  <h2 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-500" />
                    <span>Professional Liability Limitations & Disclaimers</span>
                  </h2>
                  <p>
                    The content and tools served on SnapID Studio are provided strictly on an "as is" and "as available" basis without warranties of any kind.
                  </p>

                  <h3 className="font-bold text-slate-900 dark:text-white mt-4">1. Non-Affiliation Statement</h3>
                  <p>
                    SnapID is an independent freeware web application utility. We are not officially affiliated, authorized, endorsed, sponsored, or in any way connected with the Ministry of External Affairs (MEA), the Unique Identification Authority of India (UIDAI), NSDL, UTIITSL, the Income Tax Department of India, the US State Department, or any other regional or foreign government agency.
                  </p>

                  <h3 className="font-bold text-slate-900 dark:text-white mt-4">2. User Verification Responsibility</h3>
                  <p>
                    While we strive to ensure our dimension presets (Aadhaar 85.6x54mm, India Passport 35x45mm, US Visa 2x2") represent the exact physical requirements mandated by respective agencies, government regulations can change. It is the user's sole responsibility to measure and verify printed dimensions and criteria prior to submitting official applications. SnapID is not liable for rejected visa papers, delayed passport issuances, or printing expenses.
                  </p>
                </>
              )}
            </div>
          )}

          <div className="border-t border-slate-150 dark:border-slate-900 pt-4 flex flex-col sm:flex-row items-center justify-between text-[11px] font-mono text-slate-500 gap-2">
            <span>License: MIT Freeware Tool</span>
            <span>© 2026 SnapID Studio • AdSense & GDPR Verification Ready</span>
          </div>
        </div>
      </div>
    );
  }

  // 4. BLOG & GUIDES BENTO GRID & ARTICLE READER
  if (tab === 'blog') {
    // If an article is selected, render the reading view
    if (selectedArticleId !== null) {
      const article = localizedArticles.find(art => art.id === selectedArticleId);
      if (!article) return null;

      return (
        <div className="space-y-6 max-w-3xl mx-auto animate-fade-in pb-12">
          {/* Back Button */}
          <button
            onClick={() => setSelectedArticleId(null)}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
              theme === 'dark' 
                ? 'bg-slate-900 border-slate-800 hover:bg-slate-850 text-slate-300 hover:text-white' 
                : 'bg-white border-slate-200 hover:bg-slate-100 text-slate-700 hover:text-slate-950'
            }`}
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{language === 'hi' ? 'सभी लेखों पर वापस जाएं' : 'Back to All Articles'}</span>
          </button>

          {/* Article Header Card */}
          <div className="space-y-4">
            <span className="text-[10px] font-bold text-blue-500 uppercase tracking-widest bg-blue-500/10 px-3 py-1 rounded-full border border-blue-500/15">
              {article.category}
            </span>
            <h1 className="text-3xl md:text-4xl font-black font-display tracking-tight leading-tight text-slate-900 dark:text-white mt-2">
              {article.title}
            </h1>
            <div className="flex items-center gap-4 text-xs text-slate-500 font-medium">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4" />
                <span>{article.date}</span>
              </span>
              <span className="flex items-center gap-1.5">
                <Clock className="w-4 h-4" />
                <span>{article.readTime}</span>
              </span>
              <span className="flex items-center gap-1.5">
                <Globe className="w-4 h-4" />
                <span>{language === 'hi' ? 'एसईओ सत्यापित' : 'SEO Verified'}</span>
              </span>
            </div>
            <div className="h-[1px] bg-slate-200 dark:bg-slate-850 my-2" />
          </div>

          {/* Render Article Content with beautiful typography */}
          <article className="prose dark:prose-invert prose-slate max-w-none text-slate-700 dark:text-slate-300">
            {renderArticleContent(article.content)}
          </article>

          {/* Back Button Footer */}
          <div className="h-[1px] bg-slate-200 dark:bg-slate-850 my-6" />
          <div className="flex justify-between items-center">
            <button
              onClick={() => setSelectedArticleId(null)}
              className="flex items-center gap-2 text-xs font-bold text-blue-500 hover:underline cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>{language === 'hi' ? 'लेखों पर वापस जाएं' : 'Back to Articles'}</span>
            </button>
            <button
              onClick={() => {
                if (article.id.includes('passport') || article.id.includes('mistakes') || article.id.includes('phone') || article.id.includes('background') || article.id.includes('print')) {
                  if (onChangeTab) onChangeTab('passport');
                } else {
                  if (onChangeTab) onChangeTab('documents');
                }
              }}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-550 text-white font-bold text-xs rounded-xl shadow-md transition-colors flex items-center gap-2 cursor-pointer"
            >
              <span>{language === 'hi' ? 'लेआउट जनरेटर शुरू करें' : 'Launch Layout Generator'}</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      );
    }

    // Render Article List
    return (
      <div className="space-y-6 max-w-6xl animate-fade-in text-slate-900 dark:text-slate-100">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black font-display tracking-tight text-inherit flex items-center gap-2">
              <BookOpen className="w-6 h-6 text-blue-500" />
              <span>{language === 'hi' ? 'ब्लॉग और मार्गदर्शिका' : 'Official Photo Sizing & Travel Guides'}</span>
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              {language === 'hi' 
                ? 'दस्तावेज़ दिशानिर्देशों, मुद्रण युक्तियों और पासपोर्ट फोटो आयामों पर पेशेवर लेख पढ़ें।' 
                : 'Read professional articles on document guidelines, printing tips, and passport photo dimensions.'}
            </p>
          </div>

          {/* Search bar inside Blog */}
          <div className="relative w-full md:w-80 shrink-0">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder={language === 'hi' ? 'लेख, कीवर्ड खोजें...' : 'Search articles, keywords...'}
              value={blogSearch}
              onChange={(e) => setBlogSearch(e.target.value)}
              className={`w-full text-xs py-2.5 pl-9 pr-4 rounded-xl border outline-none transition-all ${
                theme === 'dark' 
                  ? 'bg-slate-900 border-slate-800 focus:border-blue-500 text-white' 
                  : 'bg-white border-slate-200 focus:border-blue-500 text-slate-850'
              }`}
            />
          </div>
        </div>

        {/* Category filters */}
        <div className="flex flex-wrap gap-2">
          {blogCategories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold border transition-colors ${
                selectedCategory === cat
                  ? 'bg-blue-600 text-white border-blue-600'
                  : theme === 'dark'
                    ? 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                    : 'bg-white border-slate-200 text-slate-600 hover:text-slate-900'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Bento Grid layout for Articles */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredArticles.map((art) => (
            <div
              key={art.id}
              className={`rounded-2xl border p-5 flex flex-col justify-between transition-all group ${
                theme === 'dark'
                  ? 'bg-slate-950/70 border-slate-900 hover:border-slate-800'
                  : 'bg-white border-slate-200 hover:border-slate-300 shadow-xs'
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] font-bold text-blue-500 uppercase tracking-wider">
                    {art.category}
                  </span>
                  <span className="text-[10px] text-slate-500 font-medium flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>{art.readTime}</span>
                  </span>
                </div>
                
                <h3 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-blue-550 transition-colors leading-snug line-clamp-2">
                  {art.title}
                </h3>
                
                <p className="text-xs text-slate-400 leading-relaxed line-clamp-3">
                  {art.summary}
                </p>
              </div>

              <div className="flex items-center justify-between border-t border-slate-150 dark:border-slate-900 pt-4 mt-5">
                <span className="text-[10px] text-slate-500 font-medium">{art.date}</span>
                <button
                  onClick={() => {
                    setSelectedArticleId(art.id);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="text-xs font-extrabold text-blue-500 hover:text-blue-400 flex items-center gap-1 cursor-pointer"
                >
                  <span>Read Article</span>
                  <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {filteredArticles.length === 0 && (
          <div className="p-16 text-center text-slate-500 text-xs border border-dashed border-slate-800 rounded-2xl">
            No articles match your search criteria. Try filtering categories.
          </div>
        )}
      </div>
    );
  }

  // 5. INTERACTIVE COMPREHENSIVE SITEMAP
  if (tab === 'sitemap') {
    return (
      <div className="space-y-6 max-w-5xl animate-fade-in">
        <div>
          <h1 className="text-2xl font-black font-display tracking-tight text-inherit flex items-center gap-2">
            <Map className="w-6 h-6 text-blue-500" />
            <span>Interactive Application Sitemap</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Navigate instantly to any section of the SnapID Studio suite. Fully crawlable hierarchical index tree.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Section 1: Core Tools */}
          <div className={`p-5 rounded-2xl border space-y-4 ${
            theme === 'dark' ? 'bg-slate-950 border-slate-900' : 'bg-white border-slate-200'
          }`}>
            <h3 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2.5 border-b pb-2.5 border-slate-150 dark:border-slate-900">
              <Laptop className="w-4 h-4 text-blue-500" />
              <span>1. AI Layout Tools & Workspaces</span>
            </h3>
            
            <div className="space-y-3 text-xs text-slate-400">
              <div className="flex items-start gap-3">
                <CornerDownRight className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                <div>
                  <button 
                    onClick={() => onChangeTab && onChangeTab('passport')}
                    className="font-bold text-slate-900 dark:text-slate-100 hover:underline text-left block"
                  >
                    Passport Size Photo Maker
                  </button>
                  <p className="text-[11px] text-slate-400 mt-0.5">Crop 35x45mm, 2x2\" and 3.5x4.5cm photos. Remove backgrounds using on-device machine learning.</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <CornerDownRight className="w-4 h-4 text-cyan-500 shrink-0 mt-0.5" />
                <div>
                  <button 
                    onClick={() => onChangeTab && onChangeTab('documents')}
                    className="font-bold text-slate-900 dark:text-slate-100 hover:underline text-left block"
                  >
                    Document Print Preparator
                  </button>
                  <p className="text-[11px] text-slate-400 mt-0.5">Prepare standard Indian identity cards (Aadhaar, PAN Card, Voter ID, Driving Licence) in exact wallet proportions.</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <CornerDownRight className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
                <div>
                  <button 
                    onClick={() => onChangeTab && onChangeTab('resizer')}
                    className="font-bold text-slate-900 dark:text-slate-100 hover:underline text-left block"
                  >
                    Photo Resizer
                  </button>
                  <p className="text-[11px] text-slate-400 mt-0.5">Resize dimensions (px/%), compress to target KB (10–200 KB), adjust quality, and export crisp photos & signatures.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Support & FAQs */}
          <div className={`p-5 rounded-2xl border space-y-4 ${
            theme === 'dark' ? 'bg-slate-950 border-slate-900' : 'bg-white border-slate-200'
          }`}>
            <h3 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2.5 border-b pb-2.5 border-slate-150 dark:border-slate-900">
              <HelpCircle className="w-4 h-4 text-emerald-500" />
              <span>2. Knowledge Center & Support</span>
            </h3>

            <div className="space-y-3 text-xs text-slate-400">
              <div className="flex items-start gap-3">
                <CornerDownRight className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <div>
                  <button 
                    onClick={() => onChangeTab && onChangeTab('help')}
                    className="font-bold text-slate-900 dark:text-slate-100 hover:underline text-left block"
                  >
                    Help Desk & FAQ Center
                  </button>
                  <p className="text-[11px] text-slate-400 mt-0.5">Find 12 extensive answers to passport regulations, browser privacy, thermal printing scales, and formatting issues.</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <CornerDownRight className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                <div>
                  <button 
                    onClick={() => onChangeTab && onChangeTab('contact')}
                    className="font-bold text-slate-900 dark:text-slate-100 hover:underline text-left block"
                  >
                    Contact Support & Email Desk
                  </button>
                  <p className="text-[11px] text-slate-400 mt-0.5">Submit feedback, report ticket issues, and connect with our team. Response times are guaranteed under 24-48 business hours.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Company & Legals */}
          <div className={`p-5 rounded-2xl border space-y-4 ${
            theme === 'dark' ? 'bg-slate-950 border-slate-900' : 'bg-white border-slate-200'
          }`}>
            <h3 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2.5 border-b pb-2.5 border-slate-150 dark:border-slate-900">
              <Shield className="w-4 h-4 text-purple-500" />
              <span>3. Company & Legal Declarations</span>
            </h3>

            <div className="space-y-3 text-xs text-slate-400">
              <div className="flex items-start gap-3">
                <CornerDownRight className="w-4 h-4 text-purple-500 shrink-0 mt-0.5" />
                <div>
                  <button 
                    onClick={() => onChangeTab && onChangeTab('about')}
                    className="font-bold text-slate-900 dark:text-slate-100 hover:underline text-left block"
                  >
                    About Us & Corporate Mission
                  </button>
                  <p className="text-[11px] text-slate-400 mt-0.5">Discover SnapID Studio's story, history, development values, and our commitment to absolute citizen privacy.</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <CornerDownRight className="w-4 h-4 text-pink-500 shrink-0 mt-0.5" />
                <div>
                  <button 
                    onClick={() => onChangeTab && onChangeTab('legal')}
                    className="font-bold text-slate-900 dark:text-slate-100 hover:underline text-left block"
                  >
                    Privacy Policy & Cookie Policy
                  </button>
                  <p className="text-[11px] text-slate-400 mt-0.5">GDPR & DPDP Act (2023) disclosure detailing local RAM calculations, zero database caches, and Google AdSense cookie guidelines.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Section 4: Blog Articles Directory */}
          <div className={`p-5 rounded-2xl border space-y-4 ${
            theme === 'dark' ? 'bg-slate-950 border-slate-900' : 'bg-white border-slate-200'
          }`}>
            <h3 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2.5 border-b pb-2.5 border-slate-150 dark:border-slate-900">
              <BookOpen className="w-4 h-4 text-amber-500" />
              <span>4. Blog & Travel Sizing Articles Directory</span>
            </h3>

            <div className="space-y-3 text-xs text-slate-400 max-h-72 overflow-y-auto pr-2">
              {localizedArticles.map((art, idx) => (
                <div key={art.id} className="flex items-start gap-2.5">
                  <span className="text-[10px] text-slate-500 font-mono mt-0.5">[{idx + 1}]</span>
                  <button
                    onClick={() => {
                      if (onChangeTab) onChangeTab('blog');
                      setSelectedArticleId(art.id);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="font-bold text-slate-900 dark:text-slate-200 hover:underline hover:text-blue-500 text-left leading-tight"
                  >
                    {art.title}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
