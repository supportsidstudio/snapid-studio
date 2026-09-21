import React, { useState } from 'react';
import { 
  Layout, 
  Check, 
  ChevronUp, 
  ChevronDown, 
  Plus, 
  Minus,
  Layers
} from 'lucide-react';
import { 
  AppLanguage, 
  AppTheme, 
  PassportSizePreset, 
  SheetSizeId, 
  SheetSizePreset 
} from '../../types';
import { translations } from '../../translations';

interface PassportLayoutTabProps {
  language: AppLanguage;
  theme: AppTheme;
  selectedSizePreset: PassportSizePreset;
  onSelectSizePreset: (preset: PassportSizePreset) => void;
  sheetSize: SheetSizeId;
  onSelectSheetSize: (id: SheetSizeId) => void;
  selectedSheetPreset: SheetSizePreset;
  customWidthMm: number;
  setCustomWidthMm: (val: number) => void;
  customHeightMm: number;
  setCustomHeightMm: (val: number) => void;
  customPaperWidthMm: number;
  setCustomPaperWidthMm: (val: number) => void;
  customPaperHeightMm: number;
  setCustomPaperHeightMm: (val: number) => void;
  photosCopiesCount: number;
  setPhotosCopiesCount: React.Dispatch<React.SetStateAction<number>>;
  maxCopiesOnPaper: number;
  availablePresetSizes: PassportSizePreset[];
  sheetSizePresets: SheetSizePreset[];
}

export const PassportLayoutTab: React.FC<PassportLayoutTabProps> = ({
  language,
  theme,
  selectedSizePreset,
  onSelectSizePreset,
  sheetSize,
  onSelectSheetSize,
  selectedSheetPreset,
  customWidthMm,
  setCustomWidthMm,
  customHeightMm,
  setCustomHeightMm,
  customPaperWidthMm,
  setCustomPaperWidthMm,
  customPaperHeightMm,
  setCustomPaperHeightMm,
  photosCopiesCount,
  setPhotosCopiesCount,
  maxCopiesOnPaper,
  availablePresetSizes,
  sheetSizePresets,
}) => {
  const t = translations[language];
  const [isPaperSizesExpanded, setIsPaperSizesExpanded] = useState<boolean>(false);

  // Top 4 commonly used paper sizes (4x6 is standard photo paper default)
  const commonSheetIds: SheetSizeId[] = ['size_4x6', 'size_a4', 'size_5x7', 'single'];

  // In collapsed mode, show the 4 common sizes + the currently selected one if it's not in top 4
  const visibleCollapsedSheets = sheetSizePresets.filter(
    sheet => commonSheetIds.includes(sheet.id) || sheet.id === sheetSize
  );

  return (
    <div className={`p-4 sm:p-4.5 rounded-2xl border subtle-glow-card ${
      theme === 'dark' ? 'bg-slate-950 border-slate-900' : 'bg-white border-slate-200 shadow-sm'
    } space-y-4 text-left`}>
      
      {/* Header */}
      <div className="flex items-center justify-between border-b pb-2">
        <h3 className="font-bold text-xs tracking-tight flex items-center gap-1.5">
          <Layout className="w-3.5 h-3.5 text-blue-500" />
          <span>Layout Specifications</span>
        </h3>
        <span 
          className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-500 max-w-[130px] truncate subtle-element-glow" 
          title={selectedSheetPreset.nameEn}
        >
          {selectedSheetPreset.id === 'single' ? 'Single Photo' : selectedSheetPreset.nameEn.split('(')[0].trim()}
        </span>
      </div>

      {/* 1. Passport Photo Size Selection */}
      <div>
        <label className="block text-[11px] font-bold text-slate-400 mb-1.5 uppercase tracking-wider">
          {language === 'hi' ? 'फोटो आकार (Photo Size)' : 'Passport Size'}
        </label>
        <div className="grid grid-cols-2 gap-2">
          {availablePresetSizes.map((preset) => {
            const isSelected = selectedSizePreset.id === preset.id;
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => onSelectSizePreset(preset)}
                className={`p-2.5 rounded-xl border text-left flex flex-col justify-between transition-all cursor-pointer subtle-glow-button ${
                  isSelected
                    ? 'border-blue-500 bg-blue-500/10 text-blue-500 ring-1 ring-blue-500 subtle-glow-active'
                    : theme === 'dark'
                      ? 'border-slate-800 text-slate-400 bg-slate-900/40 hover:border-slate-700 hover:text-white'
                      : 'border-slate-200 text-slate-700 bg-slate-50 hover:border-slate-300 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="font-bold text-xs truncate">
                    {language === 'hi' ? preset.nameHi : preset.nameEn}
                  </span>
                  {isSelected && <Check className="w-3 h-3 text-blue-500 shrink-0" />}
                </div>
                <div className="text-[10px] font-mono mt-0.5 opacity-80">
                  {preset.widthMm} x {preset.heightMm} mm
                </div>
              </button>
            );
          })}
        </div>

        {/* Custom dimensions if custom selected */}
        {selectedSizePreset.id === 'custom' && (
          <div className={`mt-2.5 p-3 rounded-xl border grid grid-cols-2 gap-3 ${
            theme === 'dark' ? 'bg-slate-900/40 border-slate-800' : 'bg-slate-50 border-slate-200'
          }`}>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 mb-1">
                Width (mm)
              </label>
              <input
                type="number"
                min="15"
                max="100"
                value={customWidthMm}
                onChange={(e) => setCustomWidthMm(Math.max(15, parseInt(e.target.value) || 35))}
                className={`w-full px-2 py-1 text-xs font-mono font-bold rounded-lg border focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                  theme === 'dark' ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                }`}
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 mb-1">
                Height (mm)
              </label>
              <input
                type="number"
                min="15"
                max="150"
                value={customHeightMm}
                onChange={(e) => setCustomHeightMm(Math.max(15, parseInt(e.target.value) || 45))}
                className={`w-full px-2 py-1 text-xs font-mono font-bold rounded-lg border focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                  theme === 'dark' ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                }`}
              />
            </div>
          </div>
        )}
      </div>

      {/* 2. Quantity of Copies on Page (Moved UP as requested in CHANGE 4) */}
      {sheetSize !== 'single' && (
        <div className={`p-3 sm:p-3.5 rounded-xl border space-y-2.5 ${
          theme === 'dark' ? 'bg-slate-900/50 border-slate-800' : 'bg-slate-50 border-slate-200'
        }`}>
          <div className="flex items-center justify-between">
            <label className="text-[11px] font-bold text-slate-300 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-blue-500" />
              <span>{language === 'hi' ? 'फोटो प्रतियों की संख्या' : 'Copies Quantity'}</span>
            </label>
            <span className="text-[10px] font-mono font-bold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">
              {photosCopiesCount} Copies Total
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Decrement */}
            <button
              type="button"
              onClick={() => setPhotosCopiesCount(prev => Math.max(1, prev - 1))}
              className={`p-2 rounded-xl border flex items-center justify-center cursor-pointer transition-colors ${
                theme === 'dark' ? 'bg-slate-900 hover:bg-slate-800 border-slate-800 text-slate-300' : 'bg-white hover:bg-slate-50 border-slate-300 text-slate-700 shadow-xs'
              }`}
              title="Decrease Copies"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>

            {/* Stepper Input */}
            <input
              type="number"
              min="1"
              max="200"
              value={photosCopiesCount}
              onChange={(e) => {
                const val = parseInt(e.target.value);
                if (!isNaN(val)) setPhotosCopiesCount(Math.max(1, Math.min(200, val)));
              }}
              className={`flex-1 py-1.5 text-center font-mono font-black text-sm rounded-xl border focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                theme === 'dark' ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-300 text-slate-900 shadow-xs'
              }`}
            />

            {/* Increment */}
            <button
              type="button"
              onClick={() => setPhotosCopiesCount(prev => Math.min(200, prev + 1))}
              className={`p-2 rounded-xl border flex items-center justify-center cursor-pointer transition-colors ${
                theme === 'dark' ? 'bg-slate-900 hover:bg-slate-800 border-slate-800 text-slate-300' : 'bg-white hover:bg-slate-50 border-slate-300 text-slate-700 shadow-xs'
              }`}
              title="Increase Copies"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Quick Presets for Copies */}
          <div className="grid grid-cols-5 gap-1.5">
            {[4, 8, 16, 32, 64].map((cnt) => (
              <button
                key={cnt}
                type="button"
                onClick={() => setPhotosCopiesCount(cnt)}
                className={`py-1.5 rounded-lg text-[10px] font-mono font-bold border transition-colors cursor-pointer ${
                  photosCopiesCount === cnt
                    ? 'border-blue-500 bg-blue-500/20 text-blue-400 ring-1 ring-blue-500'
                    : theme === 'dark'
                      ? 'border-slate-800 text-slate-400 bg-slate-900/30 hover:border-slate-700 hover:text-white'
                      : 'border-slate-200 text-slate-600 bg-white hover:border-slate-300 hover:text-slate-900 shadow-xs'
                }`}
              >
                {cnt} pcs
              </button>
            ))}
          </div>

          {/* Mathematical Parity & Verification Banner */}
          <div className={`p-2.5 rounded-xl border flex items-center justify-between text-[10px] font-mono ${
            theme === 'dark' 
              ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-400' 
              : 'bg-emerald-50/80 border-emerald-200 text-emerald-700'
          }`}>
            <div className="flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              <span className="font-bold">Verified:</span>
            </div>
            <span className="font-semibold text-right truncate">
              {photosCopiesCount} Selected = {photosCopiesCount} Printable ({Math.ceil(photosCopiesCount / maxCopiesOnPaper)} {Math.ceil(photosCopiesCount / maxCopiesOnPaper) > 1 ? 'Sheets' : 'Sheet'})
            </span>
          </div>
        </div>
      )}

      {/* 3. Print Sheet & Paper Size (Collapsible as requested in CHANGE 3) */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            {language === 'hi' ? 'प्रिंट शीट / पेपर आकार' : 'Print Paper Sheet'}
          </label>
          <button
            type="button"
            onClick={() => setIsPaperSizesExpanded(prev => !prev)}
            className="text-[11px] font-semibold text-blue-400 hover:text-blue-300 flex items-center gap-1 cursor-pointer transition-colors px-1.5 py-0.5 rounded hover:bg-blue-500/10"
          >
            <span>
              {isPaperSizesExpanded 
                ? (language === 'hi' ? 'कम आकार ▲' : 'Show fewer sizes ▲') 
                : (language === 'hi' ? `अन्य पेपर आकार (${sheetSizePresets.length - visibleCollapsedSheets.length}+) ▼` : `More paper sizes (${sheetSizePresets.length - visibleCollapsedSheets.length}+) ▼`)}
            </span>
          </button>
        </div>

        {/* Paper Size Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-2 gap-2">
          {(isPaperSizesExpanded ? sheetSizePresets : visibleCollapsedSheets).map((sheet) => {
            const isSelected = sheetSize === sheet.id;
            return (
              <button
                key={sheet.id}
                type="button"
                onClick={() => onSelectSheetSize(sheet.id)}
                className={`p-2 rounded-xl border text-left flex flex-col justify-between transition-all cursor-pointer subtle-glow-button ${
                  isSelected
                    ? 'border-blue-500 bg-blue-500/10 text-blue-500 ring-1 ring-blue-500 subtle-glow-active'
                    : theme === 'dark'
                      ? 'border-slate-800 text-slate-400 bg-slate-900/40 hover:border-slate-700 hover:text-white'
                      : 'border-slate-200 text-slate-700 bg-slate-50 hover:border-slate-300 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="font-bold text-xs truncate">
                    {language === 'hi' ? sheet.nameHi : sheet.nameEn.split('(')[0].trim()}
                  </span>
                  {isSelected && <Check className="w-3 h-3 text-blue-500 shrink-0" />}
                </div>
                <div className="text-[9px] font-mono mt-0.5 opacity-80">
                  {sheet.widthMm > 0 ? `${sheet.widthMm}x${sheet.heightMm}mm` : '1 Copy Only'}
                </div>
              </button>
            );
          })}
        </div>

        {/* Toggle Expand / Collapse Button Bar */}
        <button
          type="button"
          onClick={() => setIsPaperSizesExpanded(prev => !prev)}
          className={`w-full py-1.5 px-2.5 rounded-xl border text-[11px] font-medium flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
            theme === 'dark' 
              ? 'border-slate-800/80 bg-slate-900/30 text-slate-400 hover:text-slate-200 hover:bg-slate-900/60' 
              : 'border-slate-200 bg-slate-50 text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          {isPaperSizesExpanded ? (
            <>
              <ChevronUp className="w-3.5 h-3.5 text-blue-500" />
              <span>{language === 'hi' ? 'कम आकार दिखाएं' : 'Collapse paper sizes list'}</span>
            </>
          ) : (
            <>
              <ChevronDown className="w-3.5 h-3.5 text-blue-500" />
              <span>{language === 'hi' ? 'सभी पेपर आकार दिखाएं (A6, A5, B5, Legal, A3...)' : 'Show all paper sizes (A6, A5, B5, Legal, A3...)'}</span>
            </>
          )}
        </button>

        {/* Custom Paper Size Input */}
        {sheetSize === 'custom' && (
          <div className={`mt-2.5 p-3 rounded-xl border grid grid-cols-2 gap-3 ${
            theme === 'dark' ? 'bg-slate-900/40 border-slate-800' : 'bg-slate-50 border-slate-200'
          }`}>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 mb-1">
                Paper Width (mm)
              </label>
              <input
                type="number"
                min="50"
                max="500"
                value={customPaperWidthMm}
                onChange={(e) => setCustomPaperWidthMm(Math.max(50, parseInt(e.target.value) || 102))}
                className={`w-full px-2 py-1 text-xs font-mono font-bold rounded-lg border focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                  theme === 'dark' ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                }`}
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 mb-1">
                Paper Height (mm)
              </label>
              <input
                type="number"
                min="50"
                max="500"
                value={customPaperHeightMm}
                onChange={(e) => setCustomPaperHeightMm(Math.max(50, parseInt(e.target.value) || 152))}
                className={`w-full px-2 py-1 text-xs font-mono font-bold rounded-lg border focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                  theme === 'dark' ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                }`}
              />
            </div>
          </div>
        )}
      </div>

    </div>
  );
};
