import React from 'react';
import { 
  ArrowLeft, 
  ArrowRight, 
  ArrowUp, 
  ArrowDown, 
  RotateCcw, 
  Move,
  Maximize2,
  Check,
  X,
  SlidersHorizontal,
  Minus,
  Plus
} from 'lucide-react';
import { DressTransformState } from '../utils/dress-templates';
import { AppLanguage, AppTheme } from '../types';

export interface QuickSuitAdjustPanelProps {
  dressState: DressTransformState;
  onDressStateChange: (state: DressTransformState) => void;
  onApply: () => void;
  onCancel: () => void;
  onReset: () => void;
  isOpen: boolean;
  onOpen?: () => void;
  language: AppLanguage;
  theme: AppTheme;
}

export function QuickSuitAdjustPanel({
  dressState,
  onDressStateChange,
  onApply,
  onCancel,
  onReset,
  isOpen,
  onOpen,
  language,
  theme
}: QuickSuitAdjustPanelProps) {
  const isSuitActive = Boolean(dressState.templateId || dressState.customImageSrc);

  // If no suit is selected, do not display anything
  if (!isSuitActive) {
    return null;
  }

  // If suit is active but panel is closed, show a sleek compact re-open button directly beneath preview
  if (!isOpen) {
    return (
      <div className="w-full mt-2 flex items-center justify-center animate-fadeIn">
        <button
          type="button"
          onClick={onOpen}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold border flex items-center gap-1.5 transition-all cursor-pointer shadow-xs active:scale-95 ${
            theme === 'dark'
              ? 'bg-slate-900/90 hover:bg-slate-800 border-blue-500/40 text-blue-400 hover:text-blue-300 shadow-black/40'
              : 'bg-white hover:bg-slate-50 border-blue-300 text-blue-600 shadow-slate-200'
          }`}
          title={language === 'hi' ? 'सूट एडजस्टमेंट पैनल खोलें' : 'Open Quick Suit Adjust'}
        >
          <span>👔</span>
          <span>{language === 'hi' ? 'त्वरित सूट एडजस्ट खोलें' : 'Quick Suit Adjust'}</span>
          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-blue-500/15 text-blue-400 font-bold border border-blue-500/25">
            {dressState.offsetX !== 0 || dressState.offsetY !== 0 || dressState.scale !== 1.0 || dressState.scaleX !== 1.0 ? 'Active' : 'Ready'}
          </span>
        </button>
      </div>
    );
  }

  // Position Nudge Handlers (1px / 1 unit per press)
  const handleNudge = (dx: number, dy: number) => {
    onDressStateChange({
      ...dressState,
      offsetX: Math.max(-40, Math.min(40, dressState.offsetX + dx)),
      offsetY: Math.max(-40, Math.min(40, dressState.offsetY + dy))
    });
  };

  // Shoulder Width Handlers (Left = Decrease, Right = Increase)
  const handleShoulderWidthChange = (delta: number) => {
    const newScaleX = Math.max(0.8, Math.min(1.3, parseFloat((dressState.scaleX + delta).toFixed(2))));
    onDressStateChange({
      ...dressState,
      scaleX: newScaleX
    });
  };

  // Suit Scale Handlers (Up = Increase / Decrease as defined, intuitive UI)
  const handleSuitScaleChange = (delta: number) => {
    const newScale = Math.max(0.7, Math.min(1.8, parseFloat((dressState.scale + delta).toFixed(2))));
    onDressStateChange({
      ...dressState,
      scale: newScale
    });
  };

  return (
    <div 
      id="quick-suit-adjust-panel"
      className="w-full mt-3 p-3 sm:p-3.5 rounded-2xl border border-blue-500/40 bg-slate-900/95 backdrop-blur-md shadow-2xl text-slate-100 select-none animate-fadeIn transition-all"
    >
      {/* Header: Title, Live Status Badge & Reset Button */}
      <div className="flex items-center justify-between pb-2 mb-2.5 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <span className="text-base sm:text-lg">👔</span>
          <h4 className="text-xs sm:text-sm font-black tracking-tight text-white flex items-center gap-1.5">
            <span>{language === 'hi' ? 'त्वरित सूट एडजस्ट' : 'Quick Suit Adjust'}</span>
          </h4>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 font-bold border border-blue-400/30 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
            <span>Live</span>
          </span>
        </div>

        {/* Small Reset Button in top-right */}
        <button
          type="button"
          onClick={onReset}
          className="text-[10px] font-bold text-slate-300 hover:text-white px-2.5 py-1 rounded-lg border border-slate-700/80 bg-slate-800/90 hover:bg-slate-700 flex items-center gap-1 transition-colors cursor-pointer active:scale-95 shadow-xs"
          title={language === 'hi' ? 'डिफ़ॉल्ट पोजीशन व साइज रीसेट करें' : 'Reset to default position & scale'}
        >
          <RotateCcw className="w-3 h-3 text-blue-400" />
          <span>{language === 'hi' ? 'रीसेट' : 'Reset'}</span>
        </button>
      </div>

      {/* Control Groups: POSITION | SHOULDER WIDTH | SUIT SCALE */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 mb-3">
        
        {/* 1. POSITION (← ↑ ↓ →) */}
        <div className="p-2 sm:p-2.5 rounded-xl border border-slate-800 bg-slate-950/80 flex flex-col justify-between gap-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-1">
              <Move className="w-3 h-3 text-blue-400" />
              <span>{language === 'hi' ? 'पोजीशन' : 'POSITION'}</span>
            </span>
            <span className="text-[9px] font-mono font-bold text-blue-400 bg-blue-500/10 px-1.5 py-0.2 rounded border border-blue-500/20">
              X:{dressState.offsetX} Y:{dressState.offsetY}
            </span>
          </div>

          {/* Four Arrow Buttons Only */}
          <div className="grid grid-cols-4 gap-1 pt-0.5">
            <button
              type="button"
              onClick={() => handleNudge(-1, 0)}
              className="h-8.5 rounded-lg bg-slate-800 hover:bg-slate-700 active:bg-blue-600 text-white flex items-center justify-center cursor-pointer active:scale-90 transition-all shadow-xs border border-slate-700/80"
              title={language === 'hi' ? 'सूट बाएं खिसकाएं (←)' : 'Move Suit Left (←)'}
              aria-label="Move Suit Left"
            >
              <ArrowLeft className="w-4 h-4 text-slate-200" />
            </button>
            <button
              type="button"
              onClick={() => handleNudge(0, -1)}
              className="h-8.5 rounded-lg bg-slate-800 hover:bg-slate-700 active:bg-blue-600 text-white flex items-center justify-center cursor-pointer active:scale-90 transition-all shadow-xs border border-slate-700/80"
              title={language === 'hi' ? 'सूट ऊपर खिसकाएं (↑)' : 'Move Suit Up (↑)'}
              aria-label="Move Suit Up"
            >
              <ArrowUp className="w-4 h-4 text-slate-200" />
            </button>
            <button
              type="button"
              onClick={() => handleNudge(0, 1)}
              className="h-8.5 rounded-lg bg-slate-800 hover:bg-slate-700 active:bg-blue-600 text-white flex items-center justify-center cursor-pointer active:scale-90 transition-all shadow-xs border border-slate-700/80"
              title={language === 'hi' ? 'सूट नीचे खिसकाएं (↓)' : 'Move Suit Down (↓)'}
              aria-label="Move Suit Down"
            >
              <ArrowDown className="w-4 h-4 text-slate-200" />
            </button>
            <button
              type="button"
              onClick={() => handleNudge(1, 0)}
              className="h-8.5 rounded-lg bg-slate-800 hover:bg-slate-700 active:bg-blue-600 text-white flex items-center justify-center cursor-pointer active:scale-90 transition-all shadow-xs border border-slate-700/80"
              title={language === 'hi' ? 'सूट दाएं खिसकाएं (→)' : 'Move Suit Right (→)'}
              aria-label="Move Suit Right"
            >
              <ArrowRight className="w-4 h-4 text-slate-200" />
            </button>
          </div>
        </div>

        {/* 2. SHOULDER WIDTH (− / +) */}
        <div className="p-2 sm:p-2.5 rounded-xl border border-slate-800 bg-slate-950/80 flex flex-col justify-between gap-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-1 truncate">
              <SlidersHorizontal className="w-3 h-3 text-indigo-400" />
              <span>{language === 'hi' ? 'कंधे की चौड़ाई' : 'SHOULDER WIDTH'}</span>
            </span>
            <span className="text-[9px] font-mono font-bold text-indigo-300 bg-indigo-500/15 px-1.5 py-0.2 rounded border border-indigo-500/25 shrink-0">
              {dressState.scaleX.toFixed(2)}x
            </span>
          </div>

          {/* Two Buttons: [ − ] (Decrease) and [ + ] (Increase) */}
          <div className="grid grid-cols-2 gap-1.5 pt-0.5">
            <button
              type="button"
              onClick={() => handleShoulderWidthChange(-0.02)}
              className="h-8.5 rounded-lg bg-indigo-950/60 hover:bg-indigo-900 active:bg-indigo-600 text-indigo-200 hover:text-white flex items-center justify-center gap-1 cursor-pointer active:scale-90 transition-all shadow-xs border border-indigo-500/30"
              title={language === 'hi' ? 'कंधे की चौड़ाई घटाएं (−)' : 'Decrease Shoulder Width (−)'}
              aria-label="Decrease Shoulder Width"
            >
              <Minus className="w-4 h-4 stroke-[2.5]" />
            </button>
            <button
              type="button"
              onClick={() => handleShoulderWidthChange(0.02)}
              className="h-8.5 rounded-lg bg-indigo-950/60 hover:bg-indigo-900 active:bg-indigo-600 text-indigo-200 hover:text-white flex items-center justify-center gap-1 cursor-pointer active:scale-90 transition-all shadow-xs border border-indigo-500/30"
              title={language === 'hi' ? 'कंधे की चौड़ाई बढ़ाएं (+)' : 'Increase Shoulder Width (+)'}
              aria-label="Increase Shoulder Width"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
            </button>
          </div>
        </div>

        {/* 3. SUIT SCALE (− / +) */}
        <div className="p-2 sm:p-2.5 rounded-xl border border-slate-800 bg-slate-950/80 flex flex-col justify-between gap-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-1 truncate">
              <Maximize2 className="w-3 h-3 text-cyan-400" />
              <span>{language === 'hi' ? 'सूट स्केल' : 'SUIT SCALE'}</span>
            </span>
            <span className="text-[9px] font-mono font-bold text-cyan-300 bg-cyan-500/15 px-1.5 py-0.2 rounded border border-cyan-500/25 shrink-0">
              {dressState.scale.toFixed(2)}x
            </span>
          </div>

          {/* Two Buttons: [ − ] (Decrease Scale) and [ + ] (Increase Scale) */}
          <div className="grid grid-cols-2 gap-1.5 pt-0.5">
            <button
              type="button"
              onClick={() => handleSuitScaleChange(-0.02)}
              className="h-8.5 rounded-lg bg-cyan-950/60 hover:bg-cyan-900 active:bg-cyan-600 text-cyan-200 hover:text-white flex items-center justify-center gap-1 cursor-pointer active:scale-90 transition-all shadow-xs border border-cyan-500/30"
              title={language === 'hi' ? 'सूट साइज घटाएं (−)' : 'Decrease Suit Scale (−)'}
              aria-label="Decrease Suit Scale"
            >
              <Minus className="w-4 h-4 stroke-[2.5]" />
            </button>
            <button
              type="button"
              onClick={() => handleSuitScaleChange(0.02)}
              className="h-8.5 rounded-lg bg-cyan-950/60 hover:bg-cyan-900 active:bg-cyan-600 text-cyan-200 hover:text-white flex items-center justify-center gap-1 cursor-pointer active:scale-90 transition-all shadow-xs border border-cyan-500/30"
              title={language === 'hi' ? 'सूट साइज बढ़ाएं (+)' : 'Increase Suit Scale (+)'}
              aria-label="Increase Suit Scale"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
            </button>
          </div>
        </div>

      </div>

      {/* Bottom Action Buttons: [ Cancel ] and [ ✓ Apply Dress ] */}
      <div className="flex items-center gap-2 pt-2 border-t border-slate-800">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 py-2 px-3 rounded-xl text-xs font-bold bg-slate-800/90 hover:bg-slate-700 active:bg-slate-600 text-slate-300 hover:text-white border border-slate-700 flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-95 shadow-xs"
          title={language === 'hi' ? 'बदलाव रद्द करें' : 'Discard adjustments and restore prior state'}
        >
          <X className="w-3.5 h-3.5 text-rose-400" />
          <span>{language === 'hi' ? 'रद्द करें (Cancel)' : 'Cancel'}</span>
        </button>

        <button
          type="button"
          onClick={onApply}
          className="flex-1 py-2 px-3 rounded-xl text-xs font-bold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 active:scale-95 text-white shadow-lg shadow-blue-500/20 border border-blue-400/30 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
          title={language === 'hi' ? 'सूट लागू करें' : 'Apply and commit dress adjustments'}
        >
          <Check className="w-3.5 h-3.5 stroke-[2.5]" />
          <span>{language === 'hi' ? 'सूट लागू करें ✓' : '✓ Apply Dress'}</span>
        </button>
      </div>
    </div>
  );
}
