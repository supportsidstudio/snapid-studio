import React from 'react';
import { Layout } from 'lucide-react';
import PassportDressPanel from '../PassportDressPanel';
import type { DressState, AppLanguage, AppTheme } from '../../types';

interface PassportDressStudioTabProps {
  language: AppLanguage;
  theme: AppTheme;
  dressState: DressState;
  onDressStateChange: (newState: DressState) => void;
  onApplyDress: () => void;
  isBgRemoved: boolean;
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
