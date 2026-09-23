import React from 'react';
import { 
  Sparkles, 
  RefreshCw, 
  Check, 
  Pipette 
} from 'lucide-react';
import { AppLanguage, AppTheme } from '../../types';
import { translations } from '../../translations';
import { isLowSpecDevice, EnhanceProgressData } from '../../utils/ai-enhancer';

interface PassportEnhanceTabProps {
  language: AppLanguage;
  theme: AppTheme;
  isRemovingBg: boolean;
  removedBgImg: string | null;
  rawRemovedBgImg: string | null;
  enhancedBgImg: string | null;
  useEnhancedPhoto: boolean;
  isEnhancing: boolean;
  enhancementStatus: 'ready' | 'enhancing' | 'enhanced' | 'unavailable';
  enhanceStepText: string;
  enhanceProgress?: EnhanceProgressData | null;
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
  enhancementStatus,
  enhanceStepText,
  enhanceProgress,
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

  const isLowSpec = isLowSpecDevice();

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
            {isEnhancing ? (
              <span className="text-[10px] font-mono font-extrabold px-2.5 py-0.5 rounded-full bg-blue-500/15 text-blue-400 border border-blue-500/30 flex items-center gap-1.5 animate-pulse">
                <RefreshCw className="w-3 h-3 animate-spin text-blue-400" />
                <span>
                  {enhanceProgress && enhanceProgress.totalSteps > 0 && enhanceProgress.phase !== 'preparing'
                    ? `Step ${Math.max(1, Math.min(enhanceProgress.totalSteps, enhanceProgress.currentStep))}/${enhanceProgress.totalSteps}`
                    : (enhanceStepText || (language === 'hi' ? 'तैयार हो रहा है...' : 'Preparing...'))}
                </span>
              </span>
            ) : enhancementStatus === 'enhanced' ? (
              <span className="text-[10px] font-mono font-extrabold px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5">
                <Check className="w-3 h-3 stroke-[3]" />
                <span>HD Enhanced{enhanceCount > 1 ? ` (${enhanceCount}x)` : ''}</span>
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

        {/* User-Facing AI HD Enhancement Processing Panel or Action Button */}
        {isEnhancing ? (
          <div className="p-3.5 sm:p-4 rounded-xl bg-slate-900/90 dark:bg-slate-950/90 border border-blue-500/30 shadow-lg shadow-blue-950/30 space-y-3">
            {/* Header: Title + Step info + Percentage */}
            <div className="flex items-start justify-between gap-2">
              <div className="space-y-0.5 min-w-0">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-blue-400 shrink-0 animate-pulse" />
                  <span className="text-xs sm:text-sm font-extrabold text-white truncate">
                    {enhanceProgress?.phase === 'preparing' 
                      ? (language === 'hi' ? 'फोटो तैयार की जा रही है...' : 'Preparing your photo...')
                      : (language === 'hi' ? '✨ फोटो एन्हांस की जा रही है...' : '✨ Enhancing your photo...')}
                  </span>
                </div>
                {enhanceProgress && enhanceProgress.totalSteps > 0 && enhanceProgress.phase !== 'preparing' && (
                  <div className="text-[11px] sm:text-xs text-blue-300 font-semibold font-mono pl-6">
                    Step {Math.max(1, Math.min(enhanceProgress.totalSteps, enhanceProgress.currentStep))} of {enhanceProgress.totalSteps}
                  </div>
                )}
              </div>

              <div className="text-right shrink-0">
                <span className="text-xs sm:text-sm font-black font-mono text-blue-400">
                  {enhanceProgress?.percent ?? 0}%
                </span>
                {enhanceProgress?.remainingTimeText && (
                  <div className="text-[10px] sm:text-[11px] text-blue-300/80 font-medium mt-0.5">
                    {enhanceProgress.remainingTimeText}
                  </div>
                )}
              </div>
            </div>

            {/* Progress Bar (Strictly connected to actual completed units) */}
            <div className="w-full bg-slate-800/90 rounded-full h-2 overflow-hidden border border-slate-700/60 p-[1px]">
              <div
                className="h-full rounded-full bg-gradient-to-r from-blue-500 via-cyan-400 to-emerald-400 transition-all duration-500 ease-out shadow-sm shadow-blue-500/50"
                style={{ width: `${Math.min(100, Math.max(0, enhanceProgress?.percent ?? 0))}%` }}
              />
            </div>

            {/* Real Work Unit Checklist */}
            <div className="space-y-1.5 max-h-32 overflow-y-auto pr-0.5 text-xs">
              {enhanceProgress && enhanceProgress.totalSteps > 0 ? (
                <>
                  {Array.from({ length: enhanceProgress.totalSteps }, (_, idx) => idx + 1).map((stepNum) => {
                    const isDone = stepNum <= (enhanceProgress?.completedSteps ?? 0);
                    const isCurrent = stepNum === enhanceProgress.currentStep && !isDone;

                    if (!isDone && !isCurrent) return null;

                    return (
                      <div
                        key={stepNum}
                        className={`flex items-center justify-between px-2.5 py-1 rounded-lg text-xs transition-all ${
                          isDone
                            ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20'
                            : 'bg-blue-500/15 text-blue-200 border border-blue-500/30 animate-pulse font-medium'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          {isDone ? (
                            <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 stroke-[3]" />
                          ) : (
                            <RefreshCw className="w-3.5 h-3.5 text-blue-400 animate-spin shrink-0" />
                          )}
                          <span>
                            {isDone ? `Step ${stepNum} completed` : `Processing step ${stepNum}...`}
                          </span>
                        </div>
                        {isDone && (
                          <span className="text-[10px] font-mono text-emerald-400/90 font-bold">✓</span>
                        )}
                      </div>
                    );
                  })}
                  {enhanceProgress.phase === 'finalizing' && (
                    <div className="flex items-center gap-2 px-2.5 py-1 rounded-lg text-xs bg-cyan-500/15 text-cyan-200 border border-cyan-500/30 animate-pulse font-medium">
                      <RefreshCw className="w-3.5 h-3.5 text-cyan-400 animate-spin shrink-0" />
                      <span>⏳ Finalizing your HD photo...</span>
                    </div>
                  )}
                </>
              ) : (
                <div className="flex items-center gap-2 px-2.5 py-1 rounded-lg text-xs bg-blue-500/10 text-blue-300 border border-blue-500/20 animate-pulse">
                  <RefreshCw className="w-3.5 h-3.5 text-blue-400 animate-spin shrink-0" />
                  <span>Preparing photo...</span>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-2.5">
            {/* Show Completion Notice if freshly completed */}
            {enhancementStatus === 'enhanced' && enhanceProgress?.phase === 'complete' && (
              <div className="p-3 sm:p-3.5 rounded-xl bg-gradient-to-r from-emerald-950/60 to-blue-950/60 border border-emerald-500/30 text-xs shadow-md space-y-1 animate-fadeIn">
                <div className="flex items-center gap-2 text-emerald-300 font-extrabold text-xs sm:text-sm">
                  <span>🎉 Enhancement Complete!</span>
                </div>
                <p className="text-[11px] sm:text-xs text-emerald-200/90 font-medium pl-0.5">
                  Your photo is ready in HD.
                </p>
              </div>
            )}

            {/* Primary Enhance Photo Action Button */}
            <button
              type="button"
              id="passport-enhance-action-btn"
              disabled={(!rawRemovedBgImg && !removedBgImg) || isEnhancing}
              onClick={handleManualEnhanceClick}
              className={`w-full py-3.5 px-4 rounded-xl text-xs sm:text-sm font-extrabold flex items-center justify-center gap-2.5 cursor-pointer transition-all ${
                'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-md shadow-blue-500/25 active:scale-[0.99] border border-blue-400/40'
              } ${(!rawRemovedBgImg && !removedBgImg) ? 'opacity-40 cursor-not-allowed' : ''}`}
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>
                {enhanceCount > 0
                  ? (language === 'hi' ? '🚀 AI HD एन्हांस पुनः लागू करें ✓' : '🚀 Re-apply AI HD Enhance ✓')
                  : (language === 'hi' ? '🚀 AI HD स्टूडियो एन्हांस' : '🚀 AI HD Studio Enhance')}
              </span>
            </button>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 text-center font-medium">
              {language === 'hi' ? '✨ उच्च गुणवत्ता स्टूडियो फोटो एन्हांसमेंट' : '✨ High-Fidelity Studio Photo Enhancement'}
            </p>
          </div>
        )}

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
