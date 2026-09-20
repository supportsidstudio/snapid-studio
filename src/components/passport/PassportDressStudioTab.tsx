import React from 'react';
import { Sparkles, Pipette, Layout } from 'lucide-react';
import PassportDressPanel from '../PassportDressPanel';
import type { DressState, AppLanguage, AppTheme } from '../../types';

interface PassportDressStudioTabProps {
  language: AppLanguage;
  theme: AppTheme;
  dressState: DressState;
  onDressStateChange: (newState: DressState) => void;
  onApplyDress: () => void;
  isBgRemoved: boolean;
  bgColorType: string;
  setBgColorType: (type: any) => void;
  customBgColor: string;
  setCustomBgColor: (color: string) => void;
  borderWidth: number;
  setBorderWidth: (w: number) => void;
  t: Record<string, string>;
}

export const PassportDressStudioTab: React.FC<PassportDressStudioTabProps> = ({
  language,
  theme,
  dressState,
  onDressStateChange,
  onApplyDress,
  isBgRemoved,
  bgColorType,
  setBgColorType,
  customBgColor,
  setCustomBgColor,
  borderWidth,
  setBorderWidth,
  t,
}) => {
  return (
    <div className="flex flex-col gap-3.5">
      {/* 👔 Dress / Suit Studio & Attire Scaling */}
      <PassportDressPanel
        language={language}
        theme={theme}
        dressState={dressState}
        onDressStateChange={onDressStateChange}
        onApplyDress={onApplyDress}
        isBgRemoved={isBgRemoved}
      />

      {/* Panel Card: Background Fill */}
      <div
        className={`p-3.5 sm:p-4 rounded-2xl border subtle-glow-card ${
          theme === 'dark' ? 'bg-slate-950 border-slate-900' : 'bg-white border-slate-200 shadow-sm'
        } space-y-3`}
      >
        <div className="flex items-center justify-between border-b pb-2">
          <h3 className="font-bold text-sm tracking-tight flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-blue-500" />
            <span>{t.bgColorLabel || 'Background Color'}</span>
          </h3>
          {!isBgRemoved && (
            <span className="text-[10px] font-mono text-amber-500 font-semibold uppercase leading-none bg-amber-500/10 border border-amber-500/10 px-1.5 py-0.5 rounded subtle-element-glow">
              Requires AI Bg Removal
            </span>
          )}
        </div>

        <div className={`space-y-2.5 ${!isBgRemoved ? 'opacity-55 pointer-events-none' : ''}`}>
          {/* Standard Swatches */}
          <div className="grid grid-cols-3 gap-1.5">
            {[
              { id: 'white', label: 'White', dotBg: 'bg-white', dotBorder: 'border-slate-300' },
              { id: 'blue', label: 'Blue', dotBg: 'bg-[#004494]', dotBorder: 'border-blue-600' },
              { id: 'lightgray', label: 'Gray', dotBg: 'bg-[#e5e7eb]', dotBorder: 'border-slate-400' },
              { id: 'red', label: 'Red', dotBg: 'bg-[#d21034]', dotBorder: 'border-red-600' },
              { id: 'cyan', label: 'Sky Blue', dotBg: 'bg-[#38bdf8]', dotBorder: 'border-sky-400' },
              { id: 'offwhite', label: 'Off-White', dotBg: 'bg-[#f8fafc]', dotBorder: 'border-slate-300' },
            ].map((swatch) => (
              <button
                key={swatch.id}
                type="button"
                onClick={() => setBgColorType(swatch.id)}
                className={`py-1.5 px-2 rounded-lg text-[11px] font-semibold border flex items-center justify-center gap-1.5 cursor-pointer subtle-glow-button ${
                  bgColorType === swatch.id
                    ? 'border-blue-500 bg-blue-500/10 text-blue-500 font-bold ring-1 ring-blue-500 subtle-glow-active'
                    : theme === 'dark'
                    ? 'border-slate-800 text-slate-300 bg-slate-900/40 hover:border-slate-700'
                    : 'border-slate-200 text-slate-600 bg-slate-50 hover:border-slate-300'
                }`}
              >
                <div className={`w-2.5 h-2.5 rounded-full border ${swatch.dotBg} ${swatch.dotBorder}`} />
                <span>{swatch.label}</span>
              </button>
            ))}
          </div>

          {/* More Colors & Custom Color Picker */}
          <div
            className={`p-2 rounded-xl border flex items-center justify-between gap-2 ${
              bgColorType === 'custom'
                ? 'border-blue-500/60 bg-blue-500/10'
                : theme === 'dark'
                ? 'border-slate-800/80 bg-slate-900/40'
                : 'border-slate-200 bg-slate-50'
            }`}
          >
            <div className="flex items-center gap-2">
              <label className="relative cursor-pointer flex items-center">
                <input
                  type="color"
                  value={customBgColor}
                  onChange={(e) => {
                    setCustomBgColor(e.target.value);
                    setBgColorType('custom');
                  }}
                  className="opacity-0 absolute inset-0 w-full h-full cursor-pointer"
                />
                <div
                  className="w-6 h-6 rounded-lg border shadow-xs transition-transform hover:scale-110 flex items-center justify-center"
                  style={{ backgroundColor: customBgColor }}
                >
                  <Pipette className="w-3 h-3 text-slate-700 drop-shadow-[0_1px_1px_rgba(255,255,255,0.8)]" />
                </div>
              </label>
              <div className="text-[10px]">
                <span className="font-bold block text-slate-300">Custom Color</span>
                <span className="font-mono text-slate-500 uppercase">{customBgColor}</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setBgColorType('custom')}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border cursor-pointer ${
                bgColorType === 'custom'
                  ? 'border-blue-500 bg-blue-500 text-white'
                  : theme === 'dark'
                  ? 'border-slate-700 bg-slate-800 text-slate-300 hover:text-white'
                  : 'border-slate-300 bg-white text-slate-700'
              }`}
            >
              Apply Custom
            </button>
          </div>
        </div>
      </div>

      {/* Panel Card: Borders and Outlines */}
      <div
        className={`p-3.5 sm:p-4 rounded-2xl border subtle-glow-card ${
          theme === 'dark' ? 'bg-slate-950 border-slate-900' : 'bg-white border-slate-200 shadow-sm'
        } space-y-3`}
      >
        <h3 className="font-bold text-sm tracking-tight border-b pb-2 flex items-center gap-2">
          <Layout className="w-4 h-4 text-blue-500" />
          <span>{t.borderWidthLabel || 'Border Outline'}</span>
        </h3>
        <div className="space-y-3">
          <div className="grid grid-cols-4 gap-2">
            {[0, 0.25, 0.5, 1.0].map((val) => (
              <button
                key={val}
                type="button"
                onClick={() => setBorderWidth(val)}
                className={`py-2 rounded-xl text-xs font-bold border cursor-pointer subtle-glow-button ${
                  borderWidth === val
                    ? 'border-blue-500 bg-blue-500/10 text-blue-500 ring-1 ring-blue-500 subtle-glow-active'
                    : theme === 'dark'
                    ? 'border-slate-800 text-slate-400 bg-slate-900/40 hover:border-slate-700 hover:text-white'
                    : 'border-slate-200 text-slate-600 bg-slate-50 hover:border-slate-300 hover:text-slate-950'
                }`}
              >
                {val === 0 ? 'None' : val === 0.25 ? 'Thin (1px)' : `${val}mm`}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
