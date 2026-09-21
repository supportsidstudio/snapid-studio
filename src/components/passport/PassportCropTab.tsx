import React from 'react';
import { 
  Crop, 
  Sliders, 
  Maximize2, 
  RotateCw, 
  Sun, 
  RotateCcw, 
  ChevronUp, 
  ChevronDown, 
  Layout 
} from 'lucide-react';
import { AppLanguage, AppTheme, PassportSizePreset } from '../../types';
import { translations } from '../../translations';

interface PassportCropTabProps {
  language: AppLanguage;
  theme: AppTheme;
  selectedSizePreset: PassportSizePreset;
  openPhotoshopCropModal: () => void;
  zoom: number;
  setZoom: (val: number | ((prev: number) => number)) => void;
  rotation: number;
  setRotation: (val: number | ((prev: number) => number)) => void;
  brightness: number;
  setBrightness: (val: number | ((prev: number) => number)) => void;
  contrast: number;
  setContrast: (val: number | ((prev: number) => number)) => void;
  borderWidth: number;
  setBorderWidth: (val: number) => void;
  resetAdjustments: () => void;
}

export const PassportCropTab: React.FC<PassportCropTabProps> = ({
  language,
  theme,
  selectedSizePreset,
  openPhotoshopCropModal,
  zoom,
  setZoom,
  rotation,
  setRotation,
  brightness,
  setBrightness,
  contrast,
  setContrast,
  borderWidth,
  setBorderWidth,
  resetAdjustments,
}) => {
  const t = translations[language];

  return (
    <div className="space-y-3.5">
      {/* 1. Precision Studio Crop & Alignment Tool Card */}
      <div className={`p-4 rounded-2xl border ${
        theme === 'dark' 
          ? 'bg-gradient-to-b from-blue-950/30 via-slate-950 to-slate-950 border-blue-500/30 shadow-lg shadow-blue-500/5' 
          : 'bg-gradient-to-b from-blue-50/60 via-white to-white border-blue-200 shadow-sm'
      } space-y-3`}>
        <div className="flex items-center justify-between border-b pb-2.5 border-slate-200/80 dark:border-slate-800/80">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/25">
              <Crop className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-extrabold text-xs sm:text-sm tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                <span>{language === 'hi' ? 'फोटो क्रॉप एवं अलाइन (Crop Tool)' : 'Crop & Align Tool'}</span>
                <span className="text-[10px] font-mono font-extrabold px-1.5 py-0.2 rounded bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/30">
                  {selectedSizePreset.widthMm}x{selectedSizePreset.heightMm}mm
                </span>
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                {language === 'hi' ? 'पासपोर्ट फेस रेश्यो के अनुसार परफेक्ट फ्रेमिंग' : 'Precision crop box & instant alignment'}
              </p>
            </div>
          </div>
        </div>

        <button
          type="button"
          id="passport-top-crop-action-btn"
          onClick={openPhotoshopCropModal}
          className="w-full py-3 px-4 rounded-xl text-xs sm:text-sm font-extrabold flex items-center justify-center gap-2.5 cursor-pointer bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-600/30 active:scale-[0.99] border border-blue-400/40 transition-all"
        >
          <Crop className="w-4 h-4 text-white stroke-[2.5]" />
          <span>{language === 'hi' ? '✂️ फोटो क्रॉप करें (Open Crop Box)' : '✂️ Crop Photo (Studio Box)'}</span>
        </button>
      </div>

      {/* 2. Crop Adjustments & Scaling Card */}
      <div className={`p-4 rounded-2xl border ${
        theme === 'dark' ? 'bg-slate-950 border-slate-900' : 'bg-white border-slate-200 shadow-sm'
      } space-y-3.5`}>
        <div className="flex items-center justify-between border-b pb-2.5 border-slate-200/80 dark:border-slate-800/80">
          <h3 className="font-extrabold text-xs sm:text-sm tracking-tight flex items-center gap-2 text-slate-900 dark:text-slate-100">
            <Sliders className="w-4 h-4 text-blue-500" />
            <span>Adjustments & Scaling</span>
          </h3>
          <button
            type="button"
            onClick={resetAdjustments}
            className={`text-[11px] font-bold px-2.5 py-1 rounded-lg border transition-colors cursor-pointer flex items-center gap-1.5 ${
              theme === 'dark' ? 'bg-slate-900 hover:bg-slate-800 border-slate-800 text-slate-400 hover:text-white' : 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700'
            }`}
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset</span>
          </button>
        </div>

        <div className="space-y-3">
          {/* Zoom */}
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 w-24 shrink-0">
              <Maximize2 className="w-3.5 h-3.5 text-blue-500" />
              <span>Zoom</span>
            </span>
            <input
              type="range"
              min="0.5"
              max="4.0"
              step="0.05"
              value={zoom}
              onChange={(e) => setZoom(parseFloat(e.target.value))}
              className="flex-1 h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
            <div className={`flex items-center rounded-lg border overflow-hidden shrink-0 ${
              theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-300'
            }`}>
              <input
                type="number"
                min="0.5"
                max="4.0"
                step="0.1"
                value={zoom.toFixed(1)}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  if (!isNaN(val)) setZoom(Math.max(0.5, Math.min(4.0, val)));
                }}
                className={`w-11 py-1 text-center font-mono font-extrabold text-xs bg-transparent focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${
                  theme === 'dark' ? 'text-slate-200' : 'text-slate-800'
                }`}
              />
              <div className={`flex flex-col border-l ${theme === 'dark' ? 'border-slate-800' : 'border-slate-200'}`}>
                <button
                  type="button"
                  onClick={() => setZoom(prev => Math.min(4.0, Number((prev + 0.1).toFixed(1))))}
                  className="px-1.5 py-0.5 hover:bg-blue-500/20 text-slate-400 hover:text-blue-400 cursor-pointer"
                  title="Increase Zoom (+0.1x)"
                >
                  <ChevronUp className="w-2.5 h-2.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setZoom(prev => Math.max(0.5, Number((prev - 0.1).toFixed(1))))}
                  className={`px-1.5 py-0.5 hover:bg-blue-500/20 text-slate-400 hover:text-blue-400 cursor-pointer border-t ${
                    theme === 'dark' ? 'border-slate-800' : 'border-slate-200'
                  }`}
                  title="Decrease Zoom (-0.1x)"
                >
                  <ChevronDown className="w-2.5 h-2.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Rotation */}
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 w-24 shrink-0">
              <RotateCw className="w-3.5 h-3.5 text-blue-500" />
              <span>Rotate</span>
            </span>
            <input
              type="range"
              min="-180"
              max="180"
              value={rotation}
              onChange={(e) => setRotation(parseInt(e.target.value))}
              className="flex-1 h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
            <div className={`flex items-center rounded-lg border overflow-hidden shrink-0 ${
              theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-300'
            }`}>
              <input
                type="number"
                min="-180"
                max="180"
                step="5"
                value={rotation}
                onChange={(e) => {
                  const val = parseInt(e.target.value);
                  if (!isNaN(val)) setRotation(Math.max(-180, Math.min(180, val)));
                }}
                className={`w-11 py-1 text-center font-mono font-extrabold text-xs bg-transparent focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${
                  theme === 'dark' ? 'text-slate-200' : 'text-slate-800'
                }`}
              />
              <div className={`flex flex-col border-l ${theme === 'dark' ? 'border-slate-800' : 'border-slate-200'}`}>
                <button
                  type="button"
                  onClick={() => setRotation(prev => Math.min(180, prev + 5))}
                  className="px-1.5 py-0.5 hover:bg-blue-500/20 text-slate-400 hover:text-blue-400 cursor-pointer"
                  title="Rotate Right (+5°)"
                >
                  <ChevronUp className="w-2.5 h-2.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setRotation(prev => Math.max(-180, prev - 5))}
                  className={`px-1.5 py-0.5 hover:bg-blue-500/20 text-slate-400 hover:text-blue-400 cursor-pointer border-t ${
                    theme === 'dark' ? 'border-slate-800' : 'border-slate-200'
                  }`}
                  title="Rotate Left (-5°)"
                >
                  <ChevronDown className="w-2.5 h-2.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Brightness */}
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 w-24 shrink-0">
              <Sun className="w-3.5 h-3.5 text-blue-500" />
              <span>Brightness</span>
            </span>
            <input
              type="range"
              min="50"
              max="180"
              value={brightness}
              onChange={(e) => setBrightness(parseInt(e.target.value))}
              className="flex-1 h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
            <div className={`flex items-center rounded-lg border overflow-hidden shrink-0 ${
              theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-300'
            }`}>
              <input
                type="number"
                min="50"
                max="180"
                step="5"
                value={brightness}
                onChange={(e) => {
                  const val = parseInt(e.target.value);
                  if (!isNaN(val)) setBrightness(Math.max(50, Math.min(180, val)));
                }}
                className={`w-11 py-1 text-center font-mono font-extrabold text-xs bg-transparent focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${
                  theme === 'dark' ? 'text-slate-200' : 'text-slate-800'
                }`}
              />
              <div className={`flex flex-col border-l ${theme === 'dark' ? 'border-slate-800' : 'border-slate-200'}`}>
                <button
                  type="button"
                  onClick={() => setBrightness(prev => Math.min(180, prev + 5))}
                  className="px-1.5 py-0.5 hover:bg-blue-500/20 text-slate-400 hover:text-blue-400 cursor-pointer"
                  title="Increase Brightness (+5%)"
                >
                  <ChevronUp className="w-2.5 h-2.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setBrightness(prev => Math.max(50, prev - 5))}
                  className={`px-1.5 py-0.5 hover:bg-blue-500/20 text-slate-400 hover:text-blue-400 cursor-pointer border-t ${
                    theme === 'dark' ? 'border-slate-800' : 'border-slate-200'
                  }`}
                  title="Decrease Brightness (-5%)"
                >
                  <ChevronDown className="w-2.5 h-2.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Contrast */}
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 w-24 shrink-0">
              <Sliders className="w-3.5 h-3.5 text-blue-500" />
              <span>Contrast</span>
            </span>
            <input
              type="range"
              min="50"
              max="180"
              value={contrast}
              onChange={(e) => setContrast(parseInt(e.target.value))}
              className="flex-1 h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
            <div className={`flex items-center rounded-lg border overflow-hidden shrink-0 ${
              theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-300'
            }`}>
              <input
                type="number"
                min="50"
                max="180"
                step="5"
                value={contrast}
                onChange={(e) => {
                  const val = parseInt(e.target.value);
                  if (!isNaN(val)) setContrast(Math.max(50, Math.min(180, val)));
                }}
                className={`w-11 py-1 text-center font-mono font-extrabold text-xs bg-transparent focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${
                  theme === 'dark' ? 'text-slate-200' : 'text-slate-800'
                }`}
              />
              <div className={`flex flex-col border-l ${theme === 'dark' ? 'border-slate-800' : 'border-slate-200'}`}>
                <button
                  type="button"
                  onClick={() => setContrast(prev => Math.min(180, prev + 5))}
                  className="px-1.5 py-0.5 hover:bg-blue-500/20 text-slate-400 hover:text-blue-400 cursor-pointer"
                  title="Increase Contrast (+5%)"
                >
                  <ChevronUp className="w-2.5 h-2.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setContrast(prev => Math.max(50, prev - 5))}
                  className={`px-1.5 py-0.5 hover:bg-blue-500/20 text-slate-400 hover:text-blue-400 cursor-pointer border-t ${
                    theme === 'dark' ? 'border-slate-800' : 'border-slate-200'
                  }`}
                  title="Decrease Contrast (-5%)"
                >
                  <ChevronDown className="w-2.5 h-2.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Borders & Outlines Card */}
      <div className={`p-4 rounded-2xl border ${
        theme === 'dark' ? 'bg-slate-950 border-slate-900' : 'bg-white border-slate-200 shadow-sm'
      } space-y-3`}>
        <h3 className="font-extrabold text-xs sm:text-sm tracking-tight border-b pb-2.5 border-slate-200/80 dark:border-slate-800/80 flex items-center gap-2 text-slate-900 dark:text-slate-100">
          <Layout className="w-4 h-4 text-blue-500" />
          <span>{t.borderWidthLabel}</span>
        </h3>
        <div className="grid grid-cols-4 gap-2">
          {[0, 0.25, 0.5, 1.0].map((val) => (
            <button
              key={val}
              type="button"
              onClick={() => setBorderWidth(val)}
              className={`py-2 rounded-xl text-xs cursor-pointer transition-all ${
                borderWidth === val
                  ? 'border-2 border-blue-600 dark:border-blue-400 bg-blue-50/90 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-extrabold shadow-sm ring-1 ring-blue-500/30'
                  : theme === 'dark'
                    ? 'border border-slate-800 text-slate-400 bg-slate-900/40 hover:border-slate-700 hover:text-white font-medium'
                    : 'border border-slate-200 text-slate-700 bg-white hover:border-slate-300 hover:text-slate-950 font-medium shadow-2xs'
              }`}
            >
              {val === 0 ? 'None' : val === 0.25 ? 'Thin (1px)' : `${val}mm`}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
