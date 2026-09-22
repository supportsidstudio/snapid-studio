import React from 'react';
import { 
  Sparkles, 
  RefreshCw, 
  Check, 
  Pipette 
} from 'lucide-react';
import { AppLanguage, AppTheme } from '../../types';
import { translations } from '../../translations';

interface PassportEnhanceTabProps {
  language: AppLanguage;
  theme: AppTheme;
  isRemovingBg: boolean;
  removedBgImg: string | null;
  rawRemovedBgImg: string | null;
  enhancedBgImg: string | null;
  useEnhancedPhoto: boolean;
  isEnhancing: boolean;
  enhanceFastMode: boolean;
  setEnhanceFastMode: (val: boolean) => void;
  enhancementStatus: 'ready' | 'enhancing' | 'enhanced' | 'unavailable';
  enhanceStepText: string;
  enhancementErrorMsg: string | null;
  enhanceCount: number;
  handleManualEnhanceClick: () => void;
  handleToggleEnhanced: (enhanced: boolean) => void;
  handleResetEnhancement: () => void;
  runBackgroundRemoval: () => void;
  bgColor: string;
  setBgColor: (color: any) => void;
  customBgColor: string;
  setCustomBgColor: (color: string) => void;
}

export const PassportEnhanceTab: React.FC<PassportEnhanceTabProps> = ({
  language,
  theme,
  isRemovingBg,
  removedBgImg,
  rawRemovedBgImg,
  enhancedBgImg,
  useEnhancedPhoto,
  isEnhancing,
  enhanceFastMode,
  setEnhanceFastMode,
  enhancementStatus,
  enhanceStepText,
  enhancementErrorMsg,
  enhanceCount,
  handleManualEnhanceClick,
  handleToggleEnhanced,
  handleResetEnhancement,
  runBackgroundRemoval,
  bgColor,
  setBgColor,
  customBgColor,
  setCustomBgColor,
}) => {
  const t = translations[language];

  // Preset studio background colors
  const BG_COLOR_PRESETS = [
    { name: 'White', value: '#ffffff', border: true },
    { name: 'Passport Blue', value: '#004494', border: false },
    { name: 'Light Blue', value: '#cce3f7', border: false },
    { name: 'Sky Blue', value: '#38bdf8', border: false },
    { name: 'Light Gray', value: '#e5e7eb', border: false },
    { name: 'Off White', value: '#f8fafc', border: true },
    { name: 'Passport Red', value: '#d21034', border: false },
    { name: 'Soft Red', value: '#fca5a5', border: false },
  ];

  const isPresetSelected = (presetValue: string) => {
    const current = (bgColor || '').toLowerCase();
    const target = presetValue.toLowerCase();
    if (current === target) return true;
    if (target === '#ffffff' && current === 'white') return true;
    if (target === '#004494' && (current === 'blue' || current === '#3b82f6' || current === '#004494')) return true;
    if (target === '#e5e7eb' && (current === 'lightgray' || current === '#e2e8f0')) return true;
    if (target === '#d21034' && (current === 'red' || current === '#dc2626')) return true;
    if (target === '#38bdf8' && current === 'cyan') return true;
    if (target === '#f8fafc' && current === 'offwhite') return true;
    return false;
  };

  const handleSelectColor = (val: string) => {
    setBgColor(val);
    if (!removedBgImg && !isRemovingBg) {
      runBackgroundRemoval();
    }
  };

  return (
    <div className="space-y-3.5">
      {/* 1. ✨ AI Photo Enhance Card */}
      <div className={`p-4 rounded-2xl border ${
        theme === 'dark' ? 'bg-slate-950 border-slate-900' : 'bg-white border-slate-200 shadow-sm'
      } space-y-3.5`}>
        <div className="flex items-center justify-between border-b pb-2.5 border-slate-200/80 dark:border-slate-800/80">
          <div>
            <h3 className="font-extrabold text-xs sm:text-sm tracking-tight flex items-center gap-2 text-slate-900 dark:text-slate-100">
              <Sparkles className="w-4 h-4 text-blue-500 shrink-0" />
              <span>✨ AI Photo Enhance</span>
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
              Improve clarity & studio print quality
            </p>
          </div>

          {/* Status Badge */}
          <div>
            {enhancementStatus === 'enhancing' ? (
              <span className="text-[10px] font-mono font-extrabold px-2.5 py-0.5 rounded-full bg-blue-500/15 text-blue-500 border border-blue-500/30 flex items-center gap-1.5 animate-pulse">
                <RefreshCw className="w-3 h-3 animate-spin" />
                <span>{language === 'hi' ? 'एन्हांस हो रहा है...' : 'Enhancing...'}</span>
              </span>
            ) : enhancementStatus === 'enhanced' ? (
              <span className="text-[10px] font-mono font-extrabold px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5">
                <Check className="w-3 h-3 stroke-[3]" />
                <span>Enhanced{enhanceCount > 1 ? ` (${enhanceCount}x)` : ''}</span>
              </span>
            ) : enhancementStatus === 'unavailable' ? (
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-500 border border-amber-500/30">
                Enhancement unavailable
              </span>
            ) : (
              <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-slate-500/10 text-slate-500 dark:text-slate-400 border border-slate-700/40">
                Ready
              </span>
            )}
          </div>
        </div>

        {/* Error / Fallback Notification */}
        {enhancementErrorMsg && (
          <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-500 flex items-start gap-2">
            <span className="text-xs">⚠️</span>
            <div className="leading-snug">
              <span className="font-semibold block">{enhancementErrorMsg}</span>
            </div>
          </div>
        )}

        {/* Primary Enhance Photo Action Button */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span className="font-extrabold uppercase tracking-wide text-slate-800 dark:text-slate-200">Enhance Engine:</span>
            <div className="flex items-center bg-slate-100 dark:bg-slate-900/90 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700">
              <button
                type="button"
                onClick={() => setEnhanceFastMode(false)}
                className={`px-2.5 py-1 rounded-md text-[11px] font-extrabold transition-all cursor-pointer ${
                  !enhanceFastMode
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
                title={language === 'hi' ? 'उच्च गुणवत्ता AI HD एन्हांस' : 'High Quality AI HD Enhance'}
              >
                ✨ AI HD
              </button>
              <button
                type="button"
                onClick={() => setEnhanceFastMode(true)}
                className={`px-2.5 py-1 rounded-md text-[11px] font-extrabold transition-all cursor-pointer ${
                  enhanceFastMode
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
                title={language === 'hi' ? 'फास्ट स्टूडियो क्लैरिटी पास' : 'Fast Studio Clarity Pass'}
              >
                ⚡ Fast Mode
              </button>
            </div>
          </div>

          <button
            type="button"
            id="passport-enhance-action-btn"
            disabled={(!rawRemovedBgImg && !removedBgImg) || isEnhancing}
            onClick={handleManualEnhanceClick}
            className={`w-full py-3 px-4 rounded-xl text-xs sm:text-sm font-extrabold flex items-center justify-center gap-2.5 cursor-pointer transition-all ${
              isEnhancing
                ? 'bg-blue-600 text-white cursor-wait opacity-80'
                : enhanceFastMode
                  ? 'bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white shadow-md shadow-amber-500/25 active:scale-[0.99] border border-amber-400/40'
                  : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-md shadow-blue-500/25 active:scale-[0.99] border border-blue-400/40'
            } ${(!rawRemovedBgImg && !removedBgImg) ? 'opacity-40 cursor-not-allowed' : ''}`}
          >
            {isEnhancing ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-white" />
                <span>{language === 'hi' ? 'फोटो एन्हांस की जा रही है...' : 'Enhancing photo...'}</span>
              </>
            ) : (
              <>
                <Sparkles className={`w-4 h-4 ${enhanceFastMode ? 'text-yellow-200' : 'text-amber-300'}`} />
                <span>
                  {enhanceCount > 0
                    ? (enhanceFastMode ? '⚡ Fast Enhance ✓' : '🚀 AI HD Enhance ✓')
                    : (enhanceFastMode ? '⚡ Fast Studio Enhance' : '🚀 AI HD Enhance')}
                </span>
              </>
            )}
          </button>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 text-center font-medium">
            {enhanceFastMode
              ? (language === 'hi' ? '⚡ तुरंत फोटो क्लैरिटी एन्हांसमेंट' : '⚡ Quick studio clarity enhancement')
              : (language === 'hi' ? '✨ उच्च गुणवत्ता स्टूडियो फोटो एन्हांसमेंट' : '✨ Studio quality photo enhancement')}
          </p>
        </div>

        {/* Manual Selector: Use Enhanced / Use Original & Level Badge */}
        <div className="space-y-2 pt-1">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
            <span className="flex items-center gap-1.5">
              <span>Photo Version:</span>
              {enhanceCount > 0 && (
                <span className="text-[10px] font-mono font-extrabold text-blue-600 dark:text-blue-400 bg-blue-500/15 px-2 py-0.5 rounded border border-blue-500/30">
                  {enhanceCount}x Level
                </span>
              )}
            </span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                disabled={!enhancedBgImg || isEnhancing}
                onClick={() => handleToggleEnhanced(true)}
                className={`px-3 py-1.5 text-xs font-extrabold rounded-lg cursor-pointer transition-all ${
                  useEnhancedPhoto && enhancedBgImg
                    ? 'bg-blue-600 text-white shadow-sm ring-1 ring-blue-400'
                    : theme === 'dark' 
                      ? 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800 font-medium' 
                      : 'bg-white text-slate-600 hover:text-slate-800 border border-slate-200 font-medium'
                } ${(!enhancedBgImg || isEnhancing) ? 'opacity-40 cursor-not-allowed' : ''}`}
              >
                {enhanceCount > 0 ? `Enhanced (${enhanceCount}x)` : 'Enhanced'}
              </button>
              <button
                type="button"
                disabled={!rawRemovedBgImg || isEnhancing}
                onClick={() => handleToggleEnhanced(false)}
                className={`px-3 py-1.5 text-xs font-extrabold rounded-lg cursor-pointer transition-all ${
                  !useEnhancedPhoto && rawRemovedBgImg
                    ? 'bg-blue-600 text-white shadow-sm ring-1 ring-blue-400'
                    : theme === 'dark' 
                      ? 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800 font-medium' 
                      : 'bg-white text-slate-600 hover:text-slate-800 border border-slate-200 font-medium'
                } ${(!rawRemovedBgImg || isEnhancing) ? 'opacity-40 cursor-not-allowed' : ''}`}
              >
                Original (0x)
              </button>
            </div>
          </div>

          {/* Before / Enhanced Compact Preview & Info */}
          {rawRemovedBgImg && (
            <div className={`p-3 rounded-xl border flex items-center justify-between gap-3 ${
              theme === 'dark' ? 'bg-slate-900/60 border-slate-800/80' : 'bg-slate-50 border-slate-200'
            }`}>
              <div className="flex items-center gap-2.5">
                <div className={`relative w-10 h-12 rounded-lg overflow-hidden border shrink-0 ${
                  theme === 'dark' ? 'border-slate-700 bg-slate-950' : 'border-slate-300 bg-white'
                }`}>
                  <img 
                    src={useEnhancedPhoto && enhancedBgImg ? enhancedBgImg : rawRemovedBgImg} 
                    alt="Active Portrait Version" 
                    className="w-full h-full object-contain"
                  />
                  <span className="absolute bottom-0 inset-x-0 text-[8px] font-black text-center bg-black/80 text-white py-0.5 uppercase tracking-tight">
                    {useEnhancedPhoto && enhancedBgImg ? `${enhanceCount}x Pass` : 'Original'}
                  </span>
                </div>
                <div className="text-xs">
                  <div className="font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                    <span>{useEnhancedPhoto && enhancedBgImg ? `AI Enhanced (Clearer & Sharper)` : 'Original Extracted Portrait Active'}</span>
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 font-normal">
                    {useEnhancedPhoto && enhancedBgImg
                      ? `${language === 'hi' ? 'नेचुरली ब्राइट, क्लियर और पासपोर्ट प्रिंटिंग के लिए परफेक्ट।' : 'Naturally brighter, clearer & refined for passport printing.'}`
                      : `${language === 'hi' ? 'बिना किसी एन्हांसमेंट के ओरिजिनल कटआउट।' : 'Original un-enhanced extracted portrait.'}`}
                  </div>
                </div>
              </div>

              {/* Quick reset button if enhanced */}
              {enhanceCount > 0 && (
                <button
                  type="button"
                  onClick={handleResetEnhancement}
                  disabled={isEnhancing}
                  title={language === 'hi' ? 'ओरिजिनल पर वापस रीसेट करें' : 'Reset to original'}
                  className="px-2.5 py-1.5 rounded-lg text-xs font-extrabold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 cursor-pointer transition-colors shrink-0"
                >
                  ↺ Reset
                </button>
              )}
            </div>
          )}
        </div>

        {/* Studio Enhancement Indicator */}
        <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800/60 flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400">
            <Sparkles className="w-3.5 h-3.5 text-blue-500 shrink-0" />
            <span>
              {useEnhancedPhoto && enhancedBgImg
                ? (language === 'hi' ? 'AI HD एन्हांसमेंट सक्रिय' : 'AI HD Enhanced')
                : (language === 'hi' ? 'ओरिजिनल कटआउट (Ready)' : 'Original Cutout (Ready)')}
            </span>
          </span>
          <span className="text-[10px] font-mono text-blue-600 dark:text-blue-400 font-extrabold bg-blue-500/15 px-2.5 py-0.5 rounded-full border border-blue-500/30">
            {language === 'hi' ? 'स्टूडियो HD' : 'Studio HD'}
          </span>
        </div>
      </div>

      {/* 2. Background Color Fill Card */}
      <div className={`p-4 rounded-2xl border ${
        theme === 'dark' ? 'bg-slate-950 border-slate-900' : 'bg-white border-slate-200 shadow-sm'
      } space-y-3`}>
        <div className="flex items-center justify-between border-b pb-2.5 border-slate-200/80 dark:border-slate-800/80">
          <h3 className="font-extrabold text-xs sm:text-sm tracking-tight flex items-center gap-2 text-slate-900 dark:text-slate-100">
            <Sparkles className="w-4 h-4 text-blue-500" />
            <span>{t.bgColorLabel}</span>
          </h3>
          {!removedBgImg && (
            <button
              type="button"
              onClick={runBackgroundRemoval}
              disabled={isRemovingBg}
              className="text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-500/10 border border-blue-500/25 px-2.5 py-0.5 rounded-lg hover:bg-blue-500/20 cursor-pointer transition-colors"
            >
              {isRemovingBg ? 'Extracting...' : 'Extract Background'}
            </button>
          )}
        </div>

        <div className={`space-y-3 ${!removedBgImg ? 'opacity-65' : ''}`}>
          {/* Preset Color Swatches */}
          <div className="grid grid-cols-4 gap-2">
            {BG_COLOR_PRESETS.map((preset) => {
              const isSelected = isPresetSelected(preset.value);
              return (
                <button
                  key={preset.value}
                  type="button"
                  onClick={() => handleSelectColor(preset.value)}
                  className={`p-2.5 rounded-xl flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                    isSelected
                      ? 'border-2 border-blue-600 dark:border-blue-400 bg-blue-50/90 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-extrabold shadow-sm ring-1 ring-blue-500/30 scale-[1.02]'
                      : theme === 'dark'
                        ? 'border border-slate-800 hover:border-slate-700 bg-slate-900/40 text-slate-400 font-medium'
                        : 'border border-slate-200 hover:border-slate-300 bg-white text-slate-700 font-medium shadow-2xs'
                  }`}
                >
                  <div
                    style={{ backgroundColor: preset.value }}
                    className={`w-6 h-6 rounded-full shadow-xs ${
                      preset.border ? 'border border-slate-300 dark:border-slate-600' : ''
                    }`}
                  />
                  <span className={`text-[11px] truncate max-w-full ${isSelected ? 'font-extrabold text-blue-700 dark:text-blue-300' : 'font-semibold text-slate-700 dark:text-slate-300'}`}>
                    {preset.name}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Custom Color Picker Input */}
          <div className="flex items-center gap-2 pt-1">
            <div className="relative flex-1 flex items-center">
              <input
                type="color"
                value={customBgColor}
                onChange={(e) => {
                  setCustomBgColor(e.target.value);
                  handleSelectColor(e.target.value);
                }}
                className="w-8 h-8 rounded-lg cursor-pointer border border-slate-700 bg-transparent p-0 mr-2"
              />
              <input
                type="text"
                value={customBgColor}
                onChange={(e) => {
                  setCustomBgColor(e.target.value);
                  if (/^#[0-9A-Fa-f]{6}$/.test(e.target.value)) {
                    handleSelectColor(e.target.value);
                  }
                }}
                placeholder="#ffffff"
                className={`flex-1 px-3 py-1.5 text-xs font-mono font-bold rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  theme === 'dark' ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-300 text-slate-900'
                }`}
              />
            </div>
            <button
              type="button"
              onClick={() => handleSelectColor(customBgColor)}
              className="px-4 py-2 rounded-lg text-xs font-extrabold bg-blue-600 hover:bg-blue-700 text-white cursor-pointer transition-colors shadow-xs"
            >
              Apply
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
