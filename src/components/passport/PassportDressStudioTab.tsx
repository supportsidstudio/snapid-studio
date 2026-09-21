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
        className={`p-4 rounded-2xl border ${
          theme === 'dark' ? 'bg-slate-950 border-slate-900' : 'bg-white border-slate-200 shadow-sm'
        } space-y-3`}
      >
        <div className="flex items-center justify-between border-b pb-2.5 border-slate-200/80 dark:border-slate-800/80">
          <h3 className="font-extrabold text-xs sm:text-sm tracking-tight flex items-center gap-2 text-slate-900 dark:text-slate-100">
            <Sparkles className="w-4 h-4 text-blue-500" />
            <span>{t.bgColorLabel || 'Background Color'}</span>
          </h3>
          {!isBgRemoved && (
            <span className="text-[10px] font-mono text-amber-500 font-extrabold uppercase leading-none bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 rounded">
              Requires AI Bg Removal
            </span>
          )}
        </div>

        <div className={`space-y-3 ${!isBgRemoved ? 'opacity-55 pointer-events-none' : ''}`}>
          {/* Standard Swatches */}
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'white', label: 'White', dotBg: 'bg-white', dotBorder: 'border-slate-300' },
              { id: 'blue', label: 'Blue', dotBg: 'bg-[#004494]', dotBorder: 'border-blue-600' },
              { id: 'lightgray', label: 'Gray', dotBg: 'bg-[#e5e7eb]', dotBorder: 'border-slate-400' },
              { id: 'red', label: 'Red', dotBg: 'bg-[#d21034]', dotBorder: 'border-red-600' },
              { id: 'cyan', label: 'Sky Blue', dotBg: 'bg-[#38bdf8]', dotBorder: 'border-sky-400' },
              { id: 'offwhite', label: 'Off-White', dotBg: 'bg-[#f8fafc]', dotBorder: 'border-slate-300' },
            ].map((swatch) => {
              const isSelected = bgColorType === swatch.id;
              return (
                <button
                  key={swatch.id}
                  type="button"
                  onClick={() => setBgColorType(swatch.id)}
                  className={`py-2 px-2.5 rounded-xl text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    isSelected
                      ? 'border-2 border-blue-600 dark:border-blue-400 bg-blue-50/90 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-extrabold shadow-sm ring-1 ring-blue-500/30 scale-[1.02]'
                      : theme === 'dark'
                      ? 'border border-slate-800 text-slate-300 bg-slate-900/40 hover:border-slate-700 font-medium'
                      : 'border border-slate-200 text-slate-700 bg-white hover:border-slate-300 font-medium shadow-2xs'
                  }`}
                >
                  <div className={`w-3 h-3 rounded-full border ${swatch.dotBg} ${swatch.dotBorder}`} />
                  <span>{swatch.label}</span>
                </button>
              );
            })}
          </div>

          {/* More Colors & Custom Color Picker */}
          <div
            className={`p-2.5 rounded-xl border flex items-center justify-between gap-2 ${
              bgColorType === 'custom'
                ? 'border-2 border-blue-600 dark:border-blue-400 bg-blue-50/90 dark:bg-blue-950/60'
                : theme === 'dark'
                ? 'border-slate-800 bg-slate-900/40'
                : 'border-slate-200 bg-white shadow-2xs'
            }`}
          >
            <div className="flex items-center gap-2.5">
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
                  className="w-7 h-7 rounded-lg border shadow-xs transition-transform hover:scale-110 flex items-center justify-center"
                  style={{ backgroundColor: customBgColor }}
                >
                  <Pipette className="w-3.5 h-3.5 text-slate-700 drop-shadow-[0_1px_1px_rgba(255,255,255,0.8)]" />
                </div>
              </label>
              <div>
                <span className="font-extrabold text-xs block text-slate-800 dark:text-slate-200">Custom Color</span>
                <span className="font-mono text-[10px] text-slate-500 uppercase font-semibold">{customBgColor}</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setBgColorType('custom')}
              className={`px-3 py-1.5 rounded-lg text-xs font-extrabold border cursor-pointer transition-colors ${
                bgColorType === 'custom'
                  ? 'border-blue-600 bg-blue-600 text-white shadow-xs'
                  : theme === 'dark'
                  ? 'border-slate-700 bg-slate-800 text-slate-300 hover:text-white'
                  : 'border-slate-300 bg-slate-50 text-slate-700 hover:bg-slate-100'
              }`}
            >
              Apply Custom
            </button>
          </div>
        </div>
      </div>

      {/* Panel Card: Borders and Outlines */}
      <div
        className={`p-4 rounded-2xl border ${
          theme === 'dark' ? 'bg-slate-950 border-slate-900' : 'bg-white border-slate-200 shadow-sm'
        } space-y-3`}
      >
        <h3 className="font-extrabold text-xs sm:text-sm tracking-tight border-b pb-2.5 border-slate-200/80 dark:border-slate-800/80 flex items-center gap-2 text-slate-900 dark:text-slate-100">
          <Layout className="w-4 h-4 text-blue-500" />
          <span>{t.borderWidthLabel || 'Border Outline'}</span>
        </h3>
        <div className="space-y-3">
          <div className="grid grid-cols-4 gap-2">
            {[0, 0.25, 0.5, 1.0].map((val) => {
              const isSelected = borderWidth === val;
              return (
                <button
                  key={val}
                  type="button"
                  onClick={() => setBorderWidth(val)}
                  className={`py-2 rounded-xl text-xs transition-all cursor-pointer ${
                    isSelected
                      ? 'border-2 border-blue-600 dark:border-blue-400 bg-blue-50/90 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-extrabold shadow-sm ring-1 ring-blue-500/30 scale-[1.02]'
                      : theme === 'dark'
                      ? 'border border-slate-800 text-slate-400 bg-slate-900/40 hover:border-slate-700 hover:text-white font-medium'
                      : 'border border-slate-200 text-slate-600 bg-white hover:border-slate-300 hover:text-slate-950 font-medium shadow-2xs'
                  }`}
                >
                  {val === 0 ? 'None' : val === 0.25 ? 'Thin (1px)' : `${val}mm`}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
