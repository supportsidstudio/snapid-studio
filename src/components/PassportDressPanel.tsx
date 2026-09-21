import React, { useState, useRef } from 'react';
import { 
  Shirt, 
  RotateCcw, 
  Trash2, 
  Check, 
  Upload, 
  Maximize2, 
  RotateCw, 
  ChevronUp, 
  ChevronDown, 
  ChevronLeft, 
  ChevronRight,
  Sparkles,
  Sliders,
  Move,
  HelpCircle,
  X
} from 'lucide-react';
import { 
  DressCategory, 
  DressTemplate, 
  DressTransformState, 
  DRESS_TEMPLATES, 
  INITIAL_DRESS_STATE, 
  generateDressVectorDataUrl,
  getAssetUrl
} from '../utils/dress-templates';
import { AppLanguage, AppTheme } from '../types';
import { translations } from '../translations';

interface PassportDressPanelProps {
  language: AppLanguage;
  theme: AppTheme;
  dressState: DressTransformState;
  onDressStateChange: (newState: DressTransformState) => void;
  onApplyDress?: () => void;
  isBgRemoved: boolean;
}

export default function PassportDressPanel({
  language,
  theme,
  dressState,
  onDressStateChange,
  onApplyDress,
  isBgRemoved
}: PassportDressPanelProps) {
  const [selectedCategory, setSelectedCategory] = useState<DressCategory>('men');
  const [showGuideModal, setShowGuideModal] = useState<boolean>(false);
  const [guideStep, setGuideStep] = useState<number>(1);
  const customFileInputRef = useRef<HTMLInputElement>(null);
  const t = translations[language];

  const activeTemplate = DRESS_TEMPLATES.find(t => t.id === dressState.templateId);
  const filteredTemplates = DRESS_TEMPLATES.filter(t => t.category === selectedCategory);

  const handleCloseGuide = () => {
    try {
      localStorage.setItem('snapid_dress_guide_seen', 'true');
    } catch {
      // ignore localStorage errors in sandboxed iframes
    }
    setShowGuideModal(false);
    setGuideStep(1);
  };

  const handleOpenGuide = () => {
    setGuideStep(1);
    setShowGuideModal(true);
  };

  const handleSelectTemplate = (template: DressTemplate) => {
    if (dressState.templateId === template.id) {
      // Toggle off if already selected
      onDressStateChange({
        ...INITIAL_DRESS_STATE
      });
      return;
    }

    try {
      const hasSeenGuide = localStorage.getItem('snapid_dress_guide_seen') === 'true';
      if (!hasSeenGuide) {
        setGuideStep(1);
        setShowGuideModal(true);
      }
    } catch {
      // ignore
    }

    onDressStateChange({
      ...INITIAL_DRESS_STATE,
      templateId: template.id,
      customImageSrc: null,
      scale: template.defaultScale || 1.0,
      offsetY: template.defaultOffsetY || 0
    });
  };

  const handleCustomUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        onDressStateChange({
          ...INITIAL_DRESS_STATE,
          templateId: 'custom_upload',
          customImageSrc: dataUrl,
          scale: 1.0,
          offsetY: 0
        });
      }
    };
    reader.readAsDataURL(file);
    // Reset file input value so re-selecting same file triggers event
    e.target.value = '';
  };

  const handleNudge = (dx: number, dy: number) => {
    onDressStateChange({
      ...dressState,
      offsetX: Math.max(-40, Math.min(40, dressState.offsetX + dx)),
      offsetY: Math.max(-40, Math.min(40, dressState.offsetY + dy))
    });
  };

  const handleReset = () => {
    if (activeTemplate) {
      onDressStateChange({
        ...INITIAL_DRESS_STATE,
        templateId: activeTemplate.id,
        scale: activeTemplate.defaultScale || 1.0,
        offsetY: activeTemplate.defaultOffsetY || 0
      });
    } else if (dressState.customImageSrc) {
      onDressStateChange({
        ...INITIAL_DRESS_STATE,
        templateId: 'custom_upload',
        customImageSrc: dressState.customImageSrc
      });
    } else {
      onDressStateChange({ ...INITIAL_DRESS_STATE });
    }
  };

  const handleRemoveSuit = () => {
    onDressStateChange({ ...INITIAL_DRESS_STATE });
  };

  const isSuitActive = Boolean(dressState.templateId || dressState.customImageSrc);

  return (
    <div className={`p-3.5 sm:p-4 rounded-2xl border subtle-glow-card space-y-3 ${
      theme === 'dark' ? 'bg-slate-950 border-slate-900' : 'bg-white border-slate-200 shadow-sm'
    }`}>
      {/* Header */}
      <div className="flex items-center justify-between border-b pb-2.5 border-slate-200/80 dark:border-slate-800/80">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/25">
            <Shirt className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-extrabold text-xs sm:text-sm tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
              <span>{language === 'hi' ? '👔 ड्रेस एवं सूट स्टूडियो' : '👔 Dress & Suit Studio'}</span>
              {isSuitActive && (
                <span className="text-[10px] font-mono font-extrabold px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                  Applied
                </span>
              )}
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
              {language === 'hi' ? 'फॉर्मल सूट, ब्लेज़र व साड़ी का स्मार्ट ओवरले' : 'Formal suits, blazers & attire overlay'}
            </p>
          </div>
        </div>

        {/* Quick Clear / Reset if active & Help Guide Trigger */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={handleOpenGuide}
            className="p-1.5 rounded-lg text-slate-400 hover:text-blue-500 hover:bg-blue-500/10 transition-colors cursor-pointer"
            title={language === 'hi' ? 'गाइड और शॉर्टकट' : 'Guide & Keyboard Shortcuts'}
          >
            <HelpCircle className="w-4 h-4" />
          </button>
          {isSuitActive && (
            <button
              type="button"
              onClick={handleRemoveSuit}
              className="text-xs font-bold text-rose-500 hover:text-rose-600 dark:text-rose-400 dark:hover:text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 px-2.5 py-1 rounded-lg border border-rose-500/20 flex items-center gap-1 transition-colors cursor-pointer"
              title="Remove Suit Overlay"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Remove</span>
            </button>
          )}
        </div>
      </div>

      {/* Category Tabs: Men, Women, Kids */}
      <div className={`flex p-1 rounded-xl border shrink-0 ${
        theme === 'dark' ? 'bg-slate-900/90 border-slate-800' : 'bg-slate-100 border-slate-200'
      }`}>
        <button
          type="button"
          onClick={() => setSelectedCategory('men')}
          className={`flex-1 py-1.5 rounded-lg text-xs transition-all cursor-pointer ${
            selectedCategory === 'men'
              ? 'bg-blue-600 text-white font-extrabold shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white font-semibold'
          }`}
        >
          <span>👨 {language === 'hi' ? 'पुरुष (Men)' : 'Men'}</span>
        </button>
        <button
          type="button"
          onClick={() => setSelectedCategory('women')}
          className={`flex-1 py-1.5 rounded-lg text-xs transition-all cursor-pointer ${
            selectedCategory === 'women'
              ? 'bg-blue-600 text-white font-extrabold shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white font-semibold'
          }`}
        >
          <span>👩 {language === 'hi' ? 'महिलाएं (Women)' : 'Women'}</span>
        </button>
        <button
          type="button"
          onClick={() => setSelectedCategory('kids')}
          className={`flex-1 py-1.5 rounded-lg text-xs transition-all cursor-pointer ${
            selectedCategory === 'kids'
              ? 'bg-blue-600 text-white font-extrabold shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white font-semibold'
          }`}
        >
          <span>🧒 {language === 'hi' ? 'बच्चे (Kids)' : 'Kids'}</span>
        </button>
      </div>

      {/* Templates Grid */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs font-extrabold text-slate-800 dark:text-slate-200 uppercase tracking-wide">
          <span>{language === 'hi' ? 'टेम्पलेट चुनें (Select Attire):' : 'Select Attire Template:'}</span>
          <span className="text-[11px] font-mono text-slate-500 font-normal">{filteredTemplates.length} Available</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-[260px] overflow-y-auto p-1 rounded-xl border border-slate-200 dark:border-slate-800/80">
          {filteredTemplates.map((template) => {
            const isSelected = dressState.templateId === template.id;
            const previewSvg = generateDressVectorDataUrl(template);

            return (
              <button
                key={template.id}
                type="button"
                onClick={() => handleSelectTemplate(template)}
                className={`relative p-2 rounded-xl text-left flex flex-col items-center gap-1.5 cursor-pointer transition-all group ${
                  isSelected
                    ? 'border-2 border-blue-600 dark:border-blue-400 bg-blue-50/90 dark:bg-blue-950/60 ring-1 ring-blue-500/30 shadow-md shadow-blue-500/10 scale-[1.02]'
                    : theme === 'dark'
                      ? 'border border-slate-800 bg-slate-900/40 hover:border-slate-700 hover:bg-slate-900 font-medium'
                      : 'border border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50 font-medium shadow-2xs'
                }`}
                title={language === 'hi' ? template.nameHi : template.name}
              >
                {/* Active Checkmark Pill */}
                {isSelected && (
                  <div className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-xs">
                    <Check className="w-2.5 h-2.5 stroke-[3]" />
                  </div>
                )}

                {/* Template Visual Thumbnail */}
                <div className="w-14 h-16 rounded-lg bg-slate-100 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-700/60 flex items-center justify-center overflow-hidden p-0.5">
                  <img
                    src={getAssetUrl(template.imageSrc) || previewSvg}
                    alt={template.name}
                    className="w-full h-full object-contain group-hover:scale-105 transition-transform"
                    loading="lazy"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src = previewSvg;
                    }}
                  />
                </div>

                {/* Title */}
                <div className="w-full text-center">
                  <div className={`text-xs truncate leading-tight ${isSelected ? 'font-extrabold text-blue-700 dark:text-blue-300' : 'font-bold text-slate-800 dark:text-slate-200'}`}>
                    {language === 'hi' ? template.nameHi.split('(')[0] : template.name.split('(')[0]}
                  </div>
                  <div className={`text-[9px] font-mono truncate mt-0.5 ${isSelected ? 'text-blue-600/80 dark:text-blue-300/80 font-bold' : 'text-slate-500 dark:text-slate-400'}`}>
                    {template.style ? template.style : template.category.toUpperCase()}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Upload Custom Suit PNG Option */}
      <div className="pt-1">
        <input
          ref={customFileInputRef}
          type="file"
          accept="image/png,image/webp"
          className="hidden"
          onChange={handleCustomUpload}
        />
        <button
          type="button"
          onClick={() => customFileInputRef.current?.click()}
          className={`w-full py-2.5 px-3 rounded-xl text-xs font-bold border border-dashed flex items-center justify-center gap-2 cursor-pointer transition-colors ${
            dressState.templateId === 'custom_upload'
              ? 'border-2 border-blue-600 dark:border-blue-400 bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-extrabold'
              : theme === 'dark'
                ? 'border-slate-700 hover:border-slate-600 text-slate-300 bg-slate-900/30 hover:bg-slate-900/60'
                : 'border-slate-300 hover:border-slate-400 text-slate-700 bg-white hover:bg-slate-50 shadow-2xs'
          }`}
        >
          <Upload className="w-3.5 h-3.5 text-blue-500" />
          <span>{language === 'hi' ? '📁 कस्टम सूट PNG अपलोड करें' : '📁 Upload Custom Suit PNG'}</span>
        </button>
      </div>

      {/* Fine-Tuning Controls (Visible when a template is active) */}
      {isSuitActive && (
        <div className={`p-3.5 rounded-xl border space-y-3.5 animate-fadeIn subtle-element-glow ${
          theme === 'dark' ? 'bg-slate-900/60 border-slate-800' : 'bg-slate-50/80 border-slate-200'
        }`}>
          <div className="flex items-center justify-between border-b pb-1.5 border-slate-200/50 dark:border-slate-800/50">
            <span className="text-[11px] font-bold text-slate-300 flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-blue-500" />
              <span>{language === 'hi' ? 'सूट अलाइनमेंट एवं साइज' : 'Attire Alignment & Scaling'}</span>
            </span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handleReset}
                className="text-[10px] font-semibold text-slate-400 hover:text-blue-400 flex items-center gap-1 transition-colors cursor-pointer"
                title="Reset Position"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset</span>
              </button>
            </div>
          </div>

          {/* 1. Nudge D-Pad (Up, Down, Left, Right) */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex flex-col">
              <span className="text-xs font-semibold text-slate-300 flex items-center gap-1">
                <Move className="w-3.5 h-3.5 text-blue-500" />
                <span>{language === 'hi' ? 'स्थान (Position)' : 'Position Nudge'}</span>
              </span>
              <span className="text-[9px] font-mono text-slate-500">
                X: {dressState.offsetX > 0 ? `+${dressState.offsetX}` : dressState.offsetX}% | Y: {dressState.offsetY > 0 ? `+${dressState.offsetY}` : dressState.offsetY}%
              </span>
            </div>

            {/* Compact 4-way Nudge cross */}
            <div className="flex items-center gap-1 bg-slate-950/40 p-1 rounded-xl border border-slate-800">
              <button
                type="button"
                onClick={() => handleNudge(-1, 0)}
                className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center justify-center cursor-pointer active:scale-95 transition-all"
                title="Move Left (-1%)"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <div className="flex flex-col gap-1">
                <button
                  type="button"
                  onClick={() => handleNudge(0, -1)}
                  className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center justify-center cursor-pointer active:scale-95 transition-all"
                  title="Move Up (-1%)"
                >
                  <ChevronUp className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => handleNudge(0, 1)}
                  className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center justify-center cursor-pointer active:scale-95 transition-all"
                  title="Move Down (+1%)"
                >
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>
              </div>
              <button
                type="button"
                onClick={() => handleNudge(1, 0)}
                className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center justify-center cursor-pointer active:scale-95 transition-all"
                title="Move Right (+1%)"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* 2. Scale Slider */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex flex-col">
              <span className="text-xs font-semibold text-slate-300 flex items-center gap-1">
                <Maximize2 className="w-3.5 h-3.5 text-blue-500" />
                <span>{language === 'hi' ? 'सूट साइज (Scale)' : 'Suit Scale'}</span>
              </span>
              <span className="text-[9px] font-mono text-slate-500">0.7x - 1.8x</span>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="range"
                min="0.7"
                max="1.8"
                step="0.02"
                value={dressState.scale}
                onChange={(e) => onDressStateChange({ ...dressState, scale: parseFloat(e.target.value) })}
                className="w-20 sm:w-28 h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
              />
              <span className="font-mono text-xs font-bold text-blue-400 w-10 text-right">
                {dressState.scale.toFixed(2)}x
              </span>
            </div>
          </div>

          {/* 3. Width Stretch (Shoulder Broadness) */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex flex-col">
              <span className="text-xs font-semibold text-slate-300">
                {language === 'hi' ? 'कंधे की चौड़ाई (Width)' : 'Shoulder Width'}
              </span>
              <span className="text-[9px] font-mono text-slate-500">0.8x - 1.3x</span>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="range"
                min="0.8"
                max="1.3"
                step="0.02"
                value={dressState.scaleX}
                onChange={(e) => onDressStateChange({ ...dressState, scaleX: parseFloat(e.target.value) })}
                className="w-20 sm:w-28 h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
              />
              <span className="font-mono text-xs font-bold text-blue-400 w-10 text-right">
                {dressState.scaleX.toFixed(2)}x
              </span>
            </div>
          </div>

          {/* 4. Rotation Angle */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex flex-col">
              <span className="text-xs font-semibold text-slate-300 flex items-center gap-1">
                <RotateCw className="w-3.5 h-3.5 text-blue-500" />
                <span>{language === 'hi' ? 'झुकाव (Tilt)' : 'Rotation Tilt'}</span>
              </span>
              <span className="text-[9px] font-mono text-slate-500">-15° to +15°</span>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="range"
                min="-15"
                max="15"
                step="1"
                value={dressState.rotation}
                onChange={(e) => onDressStateChange({ ...dressState, rotation: parseInt(e.target.value) })}
                className="w-20 sm:w-28 h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
              />
              <span className="font-mono text-xs font-bold text-blue-400 w-10 text-right">
                {dressState.rotation > 0 ? `+${dressState.rotation}°` : `${dressState.rotation}°`}
              </span>
            </div>
          </div>

          {/* Action Buttons Row: Reset & Apply */}
          <div className="flex items-center gap-2 pt-1 border-t border-slate-200/50 dark:border-slate-800/50">
            <button
              type="button"
              onClick={handleRemoveSuit}
              className="flex-1 py-2 px-3 rounded-xl text-xs font-bold border border-rose-500/30 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 cursor-pointer flex items-center justify-center gap-1.5"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>{language === 'hi' ? 'सूट हटाएं' : 'Remove Suit'}</span>
            </button>
            <button
              type="button"
              onClick={onApplyDress}
              className="flex-1 py-2 px-3 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20 cursor-pointer flex items-center justify-center gap-1.5"
            >
              <Check className="w-3.5 h-3.5" />
              <span>{language === 'hi' ? 'लागू रखें ✓' : 'Keep Suit ✓'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Feathered Edge & Identity Guarantee Notice */}
      <div className={`p-2.5 rounded-xl border flex items-start gap-2 text-[10px] ${
        theme === 'dark' ? 'bg-blue-950/20 border-blue-500/20 text-blue-300' : 'bg-blue-50 border-blue-200 text-blue-800'
      }`}>
        <Sparkles className="w-3.5 h-3.5 text-blue-500 shrink-0 mt-0.5" />
        <span className="leading-snug">
          {language === 'hi'
            ? '100% प्राइवेट इन-ब्राउज़र ओवरले: आपका चेहरा व पहचान 100% अपरिवर्तित रहती है। केवल कंधों पर फॉर्मल सूट ओवरले किया जाता है।'
            : '100% Private In-Browser Overlay: Your facial biometrics and identity remain completely untouched, with formal attire seamlessly fitted to the shoulder line.'}
        </span>
      </div>

      {/* First-Use Dress Guide Modal — 3-Step Onboarding Flow (i18n multilingual) */}
      {showGuideModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
          <div className={`w-full max-w-md rounded-2xl border shadow-2xl p-5 sm:p-6 space-y-5 max-h-[92vh] overflow-y-auto ${
            theme === 'dark'
              ? 'bg-slate-900 border-slate-700/80 text-slate-100 shadow-black/60'
              : 'bg-white border-slate-200 text-slate-900 shadow-slate-400/40'
          }`}>
            {/* Modal Header */}
            <div className="flex items-center justify-between gap-3 border-b pb-3.5 border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-500 border border-blue-500/20">
                  {language === 'hi' ? `स्टेप ${guideStep} / 3` : `Step ${guideStep} of 3`}
                </span>
                <span className="text-xs font-medium text-slate-400">
                  {language === 'hi' ? 'ऑनबोर्डिंग गाइड' : 'Onboarding Guide'}
                </span>
              </div>
              <button
                type="button"
                onClick={handleCloseGuide}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 transition-colors cursor-pointer shrink-0"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Step Content */}
            {guideStep === 1 && (
              <div className="space-y-4 animate-in fade-in slide-in-from-right-2 duration-200">
                <div className="space-y-1">
                  <h3 className="text-lg sm:text-xl font-black tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <span>{t.dressGuideStep1Title}</span>
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                    {t.dressGuideStep1Desc}
                  </p>
                </div>

                {/* Large Arrow Keys Visual */}
                <div className={`p-4 rounded-xl border flex flex-col items-center justify-center gap-2 ${
                  theme === 'dark' ? 'bg-slate-950/80 border-slate-800' : 'bg-slate-50 border-slate-200'
                }`}>
                  <div className="flex items-center justify-center gap-2">
                    <kbd className="w-11 h-11 inline-flex items-center justify-center font-mono font-extrabold text-base text-slate-100 bg-gradient-to-b from-slate-700 to-slate-800 rounded-xl border border-slate-600 shadow-md">
                      ↑
                    </kbd>
                  </div>
                  <div className="flex items-center justify-center gap-2">
                    <kbd className="w-11 h-11 inline-flex items-center justify-center font-mono font-extrabold text-base text-slate-100 bg-gradient-to-b from-slate-700 to-slate-800 rounded-xl border border-slate-600 shadow-md">
                      ←
                    </kbd>
                    <kbd className="w-11 h-11 inline-flex items-center justify-center font-mono font-extrabold text-base text-slate-100 bg-gradient-to-b from-slate-700 to-slate-800 rounded-xl border border-slate-600 shadow-md">
                      ↓
                    </kbd>
                    <kbd className="w-11 h-11 inline-flex items-center justify-center font-mono font-extrabold text-base text-slate-100 bg-gradient-to-b from-slate-700 to-slate-800 rounded-xl border border-slate-600 shadow-md">
                      →
                    </kbd>
                  </div>
                </div>

                {/* Action Explanations Grid */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className={`p-2.5 rounded-lg border flex items-center gap-2 ${
                    theme === 'dark' ? 'bg-slate-950/40 border-slate-800' : 'bg-white border-slate-200'
                  }`}>
                    <kbd className="px-1.5 py-0.5 font-mono font-bold text-xs bg-slate-700 text-white rounded border border-slate-600">←</kbd>
                    <span className="text-slate-700 dark:text-slate-200 font-medium">{t.dressGuideStep1Left}</span>
                  </div>
                  <div className={`p-2.5 rounded-lg border flex items-center gap-2 ${
                    theme === 'dark' ? 'bg-slate-950/40 border-slate-800' : 'bg-white border-slate-200'
                  }`}>
                    <kbd className="px-1.5 py-0.5 font-mono font-bold text-xs bg-slate-700 text-white rounded border border-slate-600">→</kbd>
                    <span className="text-slate-700 dark:text-slate-200 font-medium">{t.dressGuideStep1Right}</span>
                  </div>
                  <div className={`p-2.5 rounded-lg border flex items-center gap-2 ${
                    theme === 'dark' ? 'bg-slate-950/40 border-slate-800' : 'bg-white border-slate-200'
                  }`}>
                    <kbd className="px-1.5 py-0.5 font-mono font-bold text-xs bg-slate-700 text-white rounded border border-slate-600">↑</kbd>
                    <span className="text-slate-700 dark:text-slate-200 font-medium">{t.dressGuideStep1Up}</span>
                  </div>
                  <div className={`p-2.5 rounded-lg border flex items-center gap-2 ${
                    theme === 'dark' ? 'bg-slate-950/40 border-slate-800' : 'bg-white border-slate-200'
                  }`}>
                    <kbd className="px-1.5 py-0.5 font-mono font-bold text-xs bg-slate-700 text-white rounded border border-slate-600">↓</kbd>
                    <span className="text-slate-700 dark:text-slate-200 font-medium">{t.dressGuideStep1Down}</span>
                  </div>
                </div>

                {/* Helpful Note */}
                <div className={`p-2.5 rounded-xl border text-xs ${
                  theme === 'dark' ? 'bg-blue-950/20 border-blue-500/25 text-blue-300' : 'bg-blue-50 border-blue-200 text-blue-800'
                }`}>
                  💡 {t.dressGuideStep1Note}
                </div>
              </div>
            )}

            {guideStep === 2 && (
              <div className="space-y-4 animate-in fade-in slide-in-from-right-2 duration-200">
                <div className="space-y-1">
                  <h3 className="text-lg sm:text-xl font-black tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <span>{t.dressGuideStep2Title}</span>
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                    {t.dressGuideStep2Desc}
                  </p>
                </div>

                {/* Large Shift + Key Visuals */}
                <div className={`p-4 rounded-xl border flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 ${
                  theme === 'dark' ? 'bg-slate-950/80 border-slate-800' : 'bg-slate-50 border-slate-200'
                }`}>
                  <div className="flex items-center gap-1.5">
                    <kbd className="h-10 px-2.5 inline-flex items-center justify-center font-mono font-extrabold text-xs text-indigo-100 bg-gradient-to-b from-indigo-600 to-indigo-800 rounded-xl border border-indigo-400/80 shadow-md">
                      Shift
                    </kbd>
                    <span className="text-slate-400 font-bold text-sm">+</span>
                    <kbd className="w-10 h-10 inline-flex items-center justify-center font-mono font-extrabold text-base text-slate-100 bg-gradient-to-b from-slate-700 to-slate-800 rounded-xl border border-slate-600 shadow-md">
                      ←
                    </kbd>
                  </div>
                  <div className="text-slate-400 font-bold text-xs hidden sm:block">•</div>
                  <div className="flex items-center gap-1.5">
                    <kbd className="h-10 px-2.5 inline-flex items-center justify-center font-mono font-extrabold text-xs text-indigo-100 bg-gradient-to-b from-indigo-600 to-indigo-800 rounded-xl border border-indigo-400/80 shadow-md">
                      Shift
                    </kbd>
                    <span className="text-slate-400 font-bold text-sm">+</span>
                    <kbd className="w-10 h-10 inline-flex items-center justify-center font-mono font-extrabold text-base text-slate-100 bg-gradient-to-b from-slate-700 to-slate-800 rounded-xl border border-slate-600 shadow-md">
                      →
                    </kbd>
                  </div>
                </div>

                {/* Explanations */}
                <div className="space-y-2 text-xs">
                  <div className={`p-2.5 rounded-lg border flex items-center justify-between gap-2 ${
                    theme === 'dark' ? 'bg-slate-950/40 border-slate-800' : 'bg-white border-slate-200'
                  }`}>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <kbd className="px-1.5 py-0.5 font-mono font-bold text-[11px] bg-indigo-700 text-white rounded border border-indigo-500">Shift</kbd>
                      <span className="text-slate-400 font-bold">+</span>
                      <kbd className="px-1.5 py-0.5 font-mono font-bold text-xs bg-slate-700 text-white rounded border border-slate-600">←</kbd>
                    </div>
                    <span className="text-slate-700 dark:text-slate-200 font-medium text-right">{t.dressGuideStep2Dec}</span>
                  </div>

                  <div className={`p-2.5 rounded-lg border flex items-center justify-between gap-2 ${
                    theme === 'dark' ? 'bg-slate-950/40 border-slate-800' : 'bg-white border-slate-200'
                  }`}>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <kbd className="px-1.5 py-0.5 font-mono font-bold text-[11px] bg-indigo-700 text-white rounded border border-indigo-500">Shift</kbd>
                      <span className="text-slate-400 font-bold">+</span>
                      <kbd className="px-1.5 py-0.5 font-mono font-bold text-xs bg-slate-700 text-white rounded border border-slate-600">→</kbd>
                    </div>
                    <span className="text-slate-700 dark:text-slate-200 font-medium text-right">{t.dressGuideStep2Inc}</span>
                  </div>
                </div>

                {/* Manual control mention */}
                <div className={`p-2.5 rounded-xl border text-xs ${
                  theme === 'dark' ? 'bg-indigo-950/20 border-indigo-500/25 text-indigo-300' : 'bg-indigo-50 border-indigo-200 text-indigo-800'
                }`}>
                  🎛️ {t.dressGuideStep2Manual}
                </div>
              </div>
            )}

            {guideStep === 3 && (
              <div className="space-y-4 animate-in fade-in slide-in-from-right-2 duration-200">
                <div className="space-y-1">
                  <h3 className="text-lg sm:text-xl font-black tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <span>{t.dressGuideStep3Title}</span>
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                    {t.dressGuideStep3Desc}
                  </p>
                </div>

                {/* Large Shift + Up / Down Key Visuals */}
                <div className={`p-4 rounded-xl border flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 ${
                  theme === 'dark' ? 'bg-slate-950/80 border-slate-800' : 'bg-slate-50 border-slate-200'
                }`}>
                  <div className="flex items-center gap-1.5">
                    <kbd className="h-10 px-2.5 inline-flex items-center justify-center font-mono font-extrabold text-xs text-indigo-100 bg-gradient-to-b from-indigo-600 to-indigo-800 rounded-xl border border-indigo-400/80 shadow-md">
                      Shift
                    </kbd>
                    <span className="text-slate-400 font-bold text-sm">+</span>
                    <kbd className="w-10 h-10 inline-flex items-center justify-center font-mono font-extrabold text-base text-slate-100 bg-gradient-to-b from-slate-700 to-slate-800 rounded-xl border border-slate-600 shadow-md">
                      ↑
                    </kbd>
                  </div>
                  <div className="text-slate-400 font-bold text-xs hidden sm:block">•</div>
                  <div className="flex items-center gap-1.5">
                    <kbd className="h-10 px-2.5 inline-flex items-center justify-center font-mono font-extrabold text-xs text-indigo-100 bg-gradient-to-b from-indigo-600 to-indigo-800 rounded-xl border border-indigo-400/80 shadow-md">
                      Shift
                    </kbd>
                    <span className="text-slate-400 font-bold text-sm">+</span>
                    <kbd className="w-10 h-10 inline-flex items-center justify-center font-mono font-extrabold text-base text-slate-100 bg-gradient-to-b from-slate-700 to-slate-800 rounded-xl border border-slate-600 shadow-md">
                      ↓
                    </kbd>
                  </div>
                </div>

                {/* Explanations */}
                <div className="space-y-2 text-xs">
                  <div className={`p-2.5 rounded-lg border flex items-center justify-between gap-2 ${
                    theme === 'dark' ? 'bg-slate-950/40 border-slate-800' : 'bg-white border-slate-200'
                  }`}>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <kbd className="px-1.5 py-0.5 font-mono font-bold text-[11px] bg-indigo-700 text-white rounded border border-indigo-500">Shift</kbd>
                      <span className="text-slate-400 font-bold">+</span>
                      <kbd className="px-1.5 py-0.5 font-mono font-bold text-xs bg-slate-700 text-white rounded border border-slate-600">↑</kbd>
                    </div>
                    <span className="text-slate-700 dark:text-slate-200 font-medium text-right">{t.dressGuideStep3Dec}</span>
                  </div>

                  <div className={`p-2.5 rounded-lg border flex items-center justify-between gap-2 ${
                    theme === 'dark' ? 'bg-slate-950/40 border-slate-800' : 'bg-white border-slate-200'
                  }`}>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <kbd className="px-1.5 py-0.5 font-mono font-bold text-[11px] bg-indigo-700 text-white rounded border border-indigo-500">Shift</kbd>
                      <span className="text-slate-400 font-bold">+</span>
                      <kbd className="px-1.5 py-0.5 font-mono font-bold text-xs bg-slate-700 text-white rounded border border-slate-600">↓</kbd>
                    </div>
                    <span className="text-slate-700 dark:text-slate-200 font-medium text-right">{t.dressGuideStep3Inc}</span>
                  </div>
                </div>

                {/* Manual control mention */}
                <div className={`p-2.5 rounded-xl border text-xs ${
                  theme === 'dark' ? 'bg-cyan-950/20 border-cyan-500/25 text-cyan-300' : 'bg-cyan-50 border-cyan-200 text-cyan-800'
                }`}>
                  🎛️ {t.dressGuideStep3Manual}
                </div>
              </div>
            )}

            {/* Progress Dots Indicator */}
            <div className="flex items-center justify-center gap-1.5 pt-1">
              <span className={`transition-all duration-300 rounded-full ${
                guideStep === 1 
                  ? 'w-6 h-2 bg-blue-600 dark:bg-blue-500' 
                  : 'w-2 h-2 bg-slate-300 dark:bg-slate-700'
              }`} />
              <span className={`transition-all duration-300 rounded-full ${
                guideStep === 2 
                  ? 'w-6 h-2 bg-blue-600 dark:bg-blue-500' 
                  : 'w-2 h-2 bg-slate-300 dark:bg-slate-700'
              }`} />
              <span className={`transition-all duration-300 rounded-full ${
                guideStep === 3 
                  ? 'w-6 h-2 bg-blue-600 dark:bg-blue-500' 
                  : 'w-2 h-2 bg-slate-300 dark:bg-slate-700'
              }`} />
            </div>

            {/* Footer Navigation Buttons */}
            <div className="flex items-center justify-between gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
              {guideStep === 1 ? (
                <>
                  <button
                    type="button"
                    onClick={handleCloseGuide}
                    className="py-2.5 px-4 rounded-xl text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  >
                    {t.dressGuideSkip}
                  </button>
                  <button
                    type="button"
                    onClick={() => setGuideStep(2)}
                    className="py-2.5 px-6 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-500/25 transition-all cursor-pointer active:scale-95"
                  >
                    {t.dressGuideNext}
                  </button>
                </>
              ) : guideStep === 2 ? (
                <>
                  <button
                    type="button"
                    onClick={() => setGuideStep(1)}
                    className="py-2.5 px-4 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                  >
                    {t.dressGuideBack}
                  </button>
                  <button
                    type="button"
                    onClick={handleCloseGuide}
                    className="py-2.5 px-3 rounded-xl text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors cursor-pointer"
                  >
                    {t.dressGuideSkip}
                  </button>
                  <button
                    type="button"
                    onClick={() => setGuideStep(3)}
                    className="py-2.5 px-6 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-500/25 transition-all cursor-pointer active:scale-95"
                  >
                    {t.dressGuideNext}
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => setGuideStep(2)}
                    className="py-2.5 px-4 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                  >
                    {t.dressGuideBack}
                  </button>
                  <button
                    type="button"
                    onClick={handleCloseGuide}
                    className="py-2.5 px-3 rounded-xl text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors cursor-pointer"
                  >
                    {t.dressGuideSkip}
                  </button>
                  <button
                    type="button"
                    onClick={handleCloseGuide}
                    className="py-2.5 px-6 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-500/25 transition-all cursor-pointer active:scale-95"
                  >
                    {t.dressGuideDone}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
