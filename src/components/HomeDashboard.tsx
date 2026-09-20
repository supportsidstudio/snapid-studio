import React from 'react';
import { 
  ArrowRight,
  Sparkles, 
  ShieldCheck, 
  Users,
  CheckCircle2,
  FileText,
  Sliders,
  Maximize2,
  Lock,
  Zap,
  Cpu,
  Globe,
  Printer,
  Shirt,
  Star,
  Contact,
  HelpCircle
} from 'lucide-react';
import { AppTab, AppTheme, AppLanguage } from '../types';
import SnapIdLogo from './SnapIdLogo';

interface HomeDashboardProps {
  onSelectTab: (tab: AppTab) => void;
  language: AppLanguage;
  theme: AppTheme;
}

export default function HomeDashboard({
  onSelectTab,
  language,
  theme
}: HomeDashboardProps) {
  const isDark = theme === 'dark';

  return (
    <div className="w-full max-w-6xl mx-auto space-y-12 sm:space-y-16 pb-6 pt-2">

      {/* ========================================================= */}
      {/* 1. HERO SECTION & QUICK START CARD */}
      {/* ========================================================= */}
      <section id="hero-section" className="space-y-6 sm:space-y-8">
        
        {/* Hero Top Content */}
        <div className="space-y-4 sm:space-y-5 text-left">
          
          {/* Logo & Brand Name */}
          <div className="flex items-center gap-3">
            <SnapIdLogo theme={theme} size="sm" iconOnly={true} />
            <span className="font-bold text-lg sm:text-xl tracking-tight text-slate-900 dark:text-white">
              SnapID <span className="text-blue-500 dark:text-blue-400">Studio</span>
            </span>
          </div>

          {/* Main Hero Headline */}
          <div className="space-y-1">
            <h2 className="text-xl sm:text-2xl font-extrabold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 dark:from-blue-400 dark:via-indigo-300 dark:to-purple-400 bg-clip-text text-transparent">
              SnapID Studio
            </h2>
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-[44px] font-black tracking-tight leading-[1.12] text-slate-900 dark:text-white">
              AI-powered Passport &amp; Document Photo Tools
            </h1>
          </div>

          {/* Subtitle */}
          <p className="text-slate-600 dark:text-slate-400 text-sm sm:text-base leading-relaxed max-w-2xl">
            Built for Cyber Cafe &amp; eMitra operators — make passport photos, resize, enhance and print, all in your browser.
          </p>

          {/* Audience Badge */}
          <div>
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800/60 text-blue-700 dark:text-blue-300 text-xs font-semibold shadow-xs">
              <Users className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span>Cyber Cafe &amp; eMitra Walo ke liye</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-3 pt-1">
            <button
              onClick={() => onSelectTab('passport')}
              className="inline-flex items-center gap-2 px-5 py-2.5 sm:px-6 sm:py-3 rounded-xl font-bold text-xs sm:text-sm text-white bg-blue-600 hover:bg-blue-500 dark:bg-blue-500 dark:hover:bg-blue-400 shadow-[0_4px_20px_rgba(59,130,246,0.35)] cursor-pointer transition-all active:scale-95"
            >
              <span>Start Free</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => onSelectTab('help')}
              className="inline-flex items-center gap-2 px-5 py-2.5 sm:px-6 sm:py-3 rounded-xl font-bold text-xs sm:text-sm text-slate-700 dark:text-slate-200 bg-white hover:bg-slate-100 dark:bg-[#0c1630] dark:hover:bg-[#122044] border border-slate-300 dark:border-slate-800 hover:border-slate-400 dark:hover:border-slate-700 cursor-pointer transition-all active:scale-95 shadow-xs"
            >
              <span>Help &amp; FAQ</span>
            </button>
          </div>

          {/* Feature Checkmarks */}
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 pt-2 text-xs sm:text-sm text-slate-700 dark:text-slate-300 font-medium">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 dark:text-emerald-400 shrink-0" />
              <span>No uploads</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 dark:text-emerald-400 shrink-0" />
              <span>Works offline</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 dark:text-emerald-400 shrink-0" />
              <span>Hindi + English</span>
            </div>
          </div>

        </div>

        {/* Quick Start Card */}
        <div className="rounded-2xl sm:rounded-3xl border border-slate-200 dark:border-slate-800/80 bg-white/90 dark:bg-[#0b1428]/90 p-4 sm:p-6 shadow-md dark:shadow-xl backdrop-blur-md space-y-3.5">
          <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight text-left">
            Quick Start
          </h2>

          <div className="space-y-2">
            {/* Quick Row 1: Passport Size */}
            <div
              onClick={() => onSelectTab('passport')}
              className="w-full flex items-center justify-between p-3 sm:p-3.5 rounded-xl sm:rounded-2xl bg-slate-50 dark:bg-[#0e1a38]/60 hover:bg-blue-50/80 dark:hover:bg-[#13234d] border border-slate-200 dark:border-slate-800/60 hover:border-blue-500/40 cursor-pointer group transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-500/10 dark:bg-blue-600/20 border border-blue-500/30 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                  <Contact className="w-4.5 h-4.5" />
                </div>
                <div className="text-left">
                  <div className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-300 transition-colors">
                    Passport Size
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                    Open tool &rarr;
                  </div>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 dark:text-slate-500 group-hover:text-blue-500 dark:group-hover:text-blue-400 group-hover:translate-x-1 transition-all" />
            </div>

            {/* Quick Row 2: Documents */}
            <div
              onClick={() => onSelectTab('documents')}
              className="w-full flex items-center justify-between p-3 sm:p-3.5 rounded-xl sm:rounded-2xl bg-slate-50 dark:bg-[#0e1a38]/60 hover:bg-blue-50/80 dark:hover:bg-[#13234d] border border-slate-200 dark:border-slate-800/60 hover:border-blue-500/40 cursor-pointer group transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-500/10 dark:bg-blue-600/20 border border-blue-500/30 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                  <FileText className="w-4.5 h-4.5" />
                </div>
                <div className="text-left">
                  <div className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-300 transition-colors">
                    Documents
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                    Open tool &rarr;
                  </div>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 dark:text-slate-500 group-hover:text-blue-500 dark:group-hover:text-blue-400 group-hover:translate-x-1 transition-all" />
            </div>

            {/* Quick Row 3: Photo Resizer */}
            <div
              onClick={() => onSelectTab('resizer')}
              className="w-full flex items-center justify-between p-3 sm:p-3.5 rounded-xl sm:rounded-2xl bg-slate-50 dark:bg-[#0e1a38]/60 hover:bg-blue-50/80 dark:hover:bg-[#13234d] border border-slate-200 dark:border-slate-800/60 hover:border-blue-500/40 cursor-pointer group transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-500/10 dark:bg-blue-600/20 border border-blue-500/30 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                  <Maximize2 className="w-4.5 h-4.5" />
                </div>
                <div className="text-left">
                  <div className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-300 transition-colors">
                    Photo Resizer
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                    Open tool &rarr;
                  </div>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 dark:text-slate-500 group-hover:text-blue-500 dark:group-hover:text-blue-400 group-hover:translate-x-1 transition-all" />
            </div>
          </div>
        </div>

      </section>


      {/* ========================================================= */}
      {/* 2. MAIN TOOLS SECTION */}
      {/* ========================================================= */}
      <section id="main-tools-section" className="space-y-4 sm:space-y-5 text-left">
        
        {/* Section Header */}
        <div className="space-y-1">
          <div className="text-[11px] font-bold tracking-wider text-blue-600 dark:text-blue-400 uppercase">
            MAIN TOOLS
          </div>
          <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Everything you need for photo work
          </h2>
          <p className="text-slate-600 dark:text-slate-400 text-xs sm:text-sm">
            One workspace for passport photos, document photos, resizing, enhancement and printing.
          </p>
        </div>

        {/* 6 Cards Grid (3 Columns, 2 Rows) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4">
          
          {/* Card 1: Passport Size */}
          <div
            onClick={() => onSelectTab('passport')}
            className="p-4 sm:p-5 rounded-2xl sm:rounded-3xl border border-slate-200 dark:border-slate-800/80 bg-white dark:bg-gradient-to-br dark:from-[#0c1633]/90 dark:via-[#0a1228]/90 dark:to-[#070d1d]/90 hover:bg-slate-50 dark:hover:bg-[#0e1c40] hover:border-blue-500/40 cursor-pointer group transition-all flex flex-col justify-between relative overflow-hidden shadow-sm dark:shadow-none"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 dark:bg-blue-600/20 border border-blue-500/30 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                <Contact className="w-5 h-5" />
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 dark:text-slate-500 group-hover:text-blue-500 dark:group-hover:text-blue-400 group-hover:translate-x-1 transition-all" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-300 transition-colors">
                Passport Size
              </h3>
              <p className="text-slate-600 dark:text-slate-400 text-xs leading-relaxed">
                Background removal, crop, color, layout and print-ready passport sheets.
              </p>
            </div>
          </div>

          {/* Card 2: Documents */}
          <div
            onClick={() => onSelectTab('documents')}
            className="p-4 sm:p-5 rounded-2xl sm:rounded-3xl border border-slate-200 dark:border-slate-800/80 bg-white dark:bg-gradient-to-br dark:from-[#0c1633]/90 dark:via-[#0a1228]/90 dark:to-[#070d1d]/90 hover:bg-slate-50 dark:hover:bg-[#0e1c40] hover:border-blue-500/40 cursor-pointer group transition-all flex flex-col justify-between relative overflow-hidden shadow-sm dark:shadow-none"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 dark:bg-blue-600/20 border border-blue-500/30 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                <FileText className="w-5 h-5" />
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 dark:text-slate-500 group-hover:text-blue-500 dark:group-hover:text-blue-400 group-hover:translate-x-1 transition-all" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-300 transition-colors">
                Documents
              </h3>
              <p className="text-slate-600 dark:text-slate-400 text-xs leading-relaxed">
                Crop, straighten and print Aadhaar, PAN, Voter ID, DL &amp; more.
              </p>
            </div>
          </div>

          {/* Card 3: Photo Resizer */}
          <div
            onClick={() => onSelectTab('resizer')}
            className="p-4 sm:p-5 rounded-2xl sm:rounded-3xl border border-slate-200 dark:border-slate-800/80 bg-white dark:bg-gradient-to-br dark:from-[#0c1633]/90 dark:via-[#0a1228]/90 dark:to-[#070d1d]/90 hover:bg-slate-50 dark:hover:bg-[#0e1c40] hover:border-blue-500/40 cursor-pointer group transition-all flex flex-col justify-between relative overflow-hidden shadow-sm dark:shadow-none"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 dark:bg-blue-600/20 border border-blue-500/30 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                <Maximize2 className="w-5 h-5" />
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 dark:text-slate-500 group-hover:text-blue-500 dark:group-hover:text-blue-400 group-hover:translate-x-1 transition-all" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-300 transition-colors">
                Photo Resizer
              </h3>
              <p className="text-slate-600 dark:text-slate-400 text-xs leading-relaxed">
                Target exact file sizes (10 KB – 200 KB) for online government forms.
              </p>
            </div>
          </div>

          {/* Card 4: AI HD Enhance */}
          <div
            onClick={() => onSelectTab('passport')}
            className="p-4 sm:p-5 rounded-2xl sm:rounded-3xl border border-slate-200 dark:border-slate-800/80 bg-white dark:bg-gradient-to-br dark:from-[#0c1633]/90 dark:via-[#0a1228]/90 dark:to-[#070d1d]/90 hover:bg-slate-50 dark:hover:bg-[#0e1c40] hover:border-blue-500/40 cursor-pointer group transition-all flex flex-col justify-between relative overflow-hidden shadow-sm dark:shadow-none"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 dark:bg-blue-600/20 border border-blue-500/30 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                <Sparkles className="w-5 h-5" />
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 dark:text-slate-500 group-hover:text-blue-500 dark:group-hover:text-blue-400 group-hover:translate-x-1 transition-all" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-300 transition-colors">
                AI HD Enhance
              </h3>
              <p className="text-slate-600 dark:text-slate-400 text-xs leading-relaxed">
                Lightweight 2× upscaling, denoise &amp; color correction — fully offline.
              </p>
            </div>
          </div>

          {/* Card 5: Dress & Studio */}
          <div
            onClick={() => onSelectTab('passport')}
            className="p-4 sm:p-5 rounded-2xl sm:rounded-3xl border border-slate-200 dark:border-slate-800/80 bg-white dark:bg-gradient-to-br dark:from-[#0c1633]/90 dark:via-[#0a1228]/90 dark:to-[#070d1d]/90 hover:bg-slate-50 dark:hover:bg-[#0e1c40] hover:border-blue-500/40 cursor-pointer group transition-all flex flex-col justify-between relative overflow-hidden shadow-sm dark:shadow-none"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 dark:bg-blue-600/20 border border-blue-500/30 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                <Shirt className="w-5 h-5" />
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 dark:text-slate-500 group-hover:text-blue-500 dark:group-hover:text-blue-400 group-hover:translate-x-1 transition-all" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-300 transition-colors">
                Dress &amp; Studio
              </h3>
              <p className="text-slate-600 dark:text-slate-400 text-xs leading-relaxed">
                12 formal suit templates with shoulder width, scale &amp; alignment.
              </p>
            </div>
          </div>

          {/* Card 6: Print */}
          <div
            onClick={() => onSelectTab('passport')}
            className="p-4 sm:p-5 rounded-2xl sm:rounded-3xl border border-slate-200 dark:border-slate-800/80 bg-white dark:bg-gradient-to-br dark:from-[#0c1633]/90 dark:via-[#0a1228]/90 dark:to-[#070d1d]/90 hover:bg-slate-50 dark:hover:bg-[#0e1c40] hover:border-blue-500/40 cursor-pointer group transition-all flex flex-col justify-between relative overflow-hidden shadow-sm dark:shadow-none"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 dark:bg-blue-600/20 border border-blue-500/30 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                <Printer className="w-5 h-5" />
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 dark:text-slate-500 group-hover:text-blue-500 dark:group-hover:text-blue-400 group-hover:translate-x-1 transition-all" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-300 transition-colors">
                Print
              </h3>
              <p className="text-slate-600 dark:text-slate-400 text-xs leading-relaxed">
                Direct print, PDF, JPG &amp; PNG export with correct paper layout.
              </p>
            </div>
          </div>

        </div>

      </section>


      {/* ========================================================= */}
      {/* 3. HOW IT WORKS SECTION */}
      {/* ========================================================= */}
      <section id="how-it-works-section" className="space-y-4 sm:space-y-5 text-left">
        
        {/* Section Header */}
        <div className="space-y-1">
          <div className="text-[11px] font-bold tracking-wider text-blue-600 dark:text-blue-400 uppercase">
            HOW IT WORKS
          </div>
          <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Three simple steps
          </h2>
          <p className="text-slate-600 dark:text-slate-400 text-xs sm:text-sm">
            Professional output, every time — no design skills required.
          </p>
        </div>

        {/* 3 Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 sm:gap-4">
          
          {/* Step 01 */}
          <div className="p-5 sm:p-6 rounded-2xl sm:rounded-3xl border border-slate-200 dark:border-slate-800/80 bg-white dark:bg-[#0a1329]/80 shadow-sm dark:shadow-none flex flex-col justify-between">
            <div>
              <div className="text-3xl sm:text-4xl font-black text-blue-500/20 dark:text-blue-500/40 mb-2 font-mono">
                01
              </div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white mb-1.5">
                Upload
              </h3>
              <p className="text-slate-600 dark:text-slate-400 text-xs leading-relaxed">
                Drop a photo or document. Everything stays in your browser.
              </p>
            </div>
          </div>

          {/* Step 02 */}
          <div className="p-5 sm:p-6 rounded-2xl sm:rounded-3xl border border-slate-200 dark:border-slate-800/80 bg-white dark:bg-[#0a1329]/80 shadow-sm dark:shadow-none flex flex-col justify-between">
            <div>
              <div className="text-3xl sm:text-4xl font-black text-blue-500/20 dark:text-blue-500/40 mb-2 font-mono">
                02
              </div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white mb-1.5">
                Edit
              </h3>
              <p className="text-slate-600 dark:text-slate-400 text-xs leading-relaxed">
                Crop, remove background, enhance, add a suit — full control.
              </p>
            </div>
          </div>

          {/* Step 03 */}
          <div className="p-5 sm:p-6 rounded-2xl sm:rounded-3xl border border-slate-200 dark:border-slate-800/80 bg-white dark:bg-[#0a1329]/80 shadow-sm dark:shadow-none flex flex-col justify-between">
            <div>
              <div className="text-3xl sm:text-4xl font-black text-blue-500/20 dark:text-blue-500/40 mb-2 font-mono">
                03
              </div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white mb-1.5">
                Export
              </h3>
              <p className="text-slate-600 dark:text-slate-400 text-xs leading-relaxed">
                Print directly or save as PDF, JPG, PNG with correct layout.
              </p>
            </div>
          </div>

        </div>

      </section>


      {/* ========================================================= */}
      {/* 4. WHY SNAPID STUDIO SECTION */}
      {/* ========================================================= */}
      <section id="why-snapid-section" className="space-y-4 sm:space-y-5 text-left">
        
        {/* Section Header */}
        <div className="space-y-1">
          <div className="text-[11px] font-bold tracking-wider text-blue-600 dark:text-blue-400 uppercase">
            WHY SNAPID STUDIO
          </div>
          <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Why SnapID Studio
          </h2>
          <p className="text-slate-600 dark:text-slate-400 text-xs sm:text-sm">
            Built ground-up for the realities of Indian cyber cafe &amp; eMitra counters.
          </p>
        </div>

        {/* 6 Features Grid (3 Columns, 2 Rows) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4">
          
          {/* Feature 1: 100% Private */}
          <div className="p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800/80 bg-white dark:bg-[#0a1329]/80 shadow-sm dark:shadow-none flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 dark:bg-blue-600/20 border border-blue-500/30 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
              <Lock className="w-5 h-5" />
            </div>
            <div className="space-y-0.5">
              <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                100% Private
              </h3>
              <p className="text-slate-600 dark:text-slate-400 text-xs leading-relaxed">
                Photos never leave your browser. No server uploads.
              </p>
            </div>
          </div>

          {/* Feature 2: Fast & Light */}
          <div className="p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800/80 bg-white dark:bg-[#0a1329]/80 shadow-sm dark:shadow-none flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 dark:bg-blue-600/20 border border-blue-500/30 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
              <Zap className="w-5 h-5" />
            </div>
            <div className="space-y-0.5">
              <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                Fast &amp; Light
              </h3>
              <p className="text-slate-600 dark:text-slate-400 text-xs leading-relaxed">
                Runs smoothly on older Celeron laptops with 4 GB RAM.
              </p>
            </div>
          </div>

          {/* Feature 3: Browser-side AI */}
          <div className="p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800/80 bg-white dark:bg-[#0a1329]/80 shadow-sm dark:shadow-none flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 dark:bg-blue-600/20 border border-blue-500/30 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
              <Cpu className="w-5 h-5" />
            </div>
            <div className="space-y-0.5">
              <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                Browser-side AI
              </h3>
              <p className="text-slate-600 dark:text-slate-400 text-xs leading-relaxed">
                Background removal &amp; enhancement run on-device.
              </p>
            </div>
          </div>

          {/* Feature 4: Hindi + English */}
          <div className="p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800/80 bg-white dark:bg-[#0a1329]/80 shadow-sm dark:shadow-none flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 dark:bg-blue-600/20 border border-blue-500/30 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
              <Globe className="w-5 h-5" />
            </div>
            <div className="space-y-0.5">
              <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                Hindi + English
              </h3>
              <p className="text-slate-600 dark:text-slate-400 text-xs leading-relaxed">
                Switch language instantly. Saved for next visit.
              </p>
            </div>
          </div>

          {/* Feature 5: Made for India */}
          <div className="p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800/80 bg-white dark:bg-[#0a1329]/80 shadow-sm dark:shadow-none flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 dark:bg-blue-600/20 border border-blue-500/30 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div className="space-y-0.5">
              <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                Made for India
              </h3>
              <p className="text-slate-600 dark:text-slate-400 text-xs leading-relaxed">
                Built for Cyber Cafe &amp; eMitra operators &amp; workflows.
              </p>
            </div>
          </div>

          {/* Feature 6: Print-accurate */}
          <div className="p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800/80 bg-white dark:bg-[#0a1329]/80 shadow-sm dark:shadow-none flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 dark:bg-blue-600/20 border border-blue-500/30 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
              <Printer className="w-5 h-5" />
            </div>
            <div className="space-y-0.5">
              <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                Print-accurate
              </h3>
              <p className="text-slate-600 dark:text-slate-400 text-xs leading-relaxed">
                Sheet layout matches the final printed output.
              </p>
            </div>
          </div>

        </div>

      </section>


      {/* ========================================================= */}
      {/* 5. USER FEEDBACK SECTION */}
      {/* ========================================================= */}
      <section id="user-feedback-section" className="space-y-4 sm:space-y-5 text-left">
        
        {/* Section Header with "User Feedback" Button */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
          <div className="space-y-1">
            <div className="text-[11px] font-bold tracking-wider text-blue-600 dark:text-blue-400 uppercase">
              USER FEEDBACK
            </div>
            <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              What operators say
            </h2>
          </div>

          <button
            onClick={() => onSelectTab('feedback')}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-[#0c1630] hover:bg-slate-100 dark:hover:bg-[#122044] border border-slate-300 dark:border-slate-800 hover:border-slate-400 dark:hover:border-slate-700 cursor-pointer transition-all self-start sm:self-auto shrink-0 shadow-xs"
          >
            <span>User Feedback</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* 3 Testimonials Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 sm:gap-4">
          
          {/* Testimonial 1 */}
          <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800/80 bg-white dark:bg-[#0a1329]/80 shadow-sm dark:shadow-none flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="flex items-center gap-1 text-amber-500 dark:text-amber-400">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-amber-400" />
                ))}
              </div>
              <p className="text-slate-800 dark:text-slate-200 text-xs sm:text-[13px] leading-relaxed">
                &ldquo;Background removal ekdum perfect. Customer ko 30 second me photo ready milta hai.&rdquo;
              </p>
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
              Ramesh K. &middot; Cyber Cafe, Jaipur
            </div>
          </div>

          {/* Testimonial 2 */}
          <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800/80 bg-white dark:bg-[#0a1329]/80 shadow-sm dark:shadow-none flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="flex items-center gap-1 text-amber-500 dark:text-amber-400">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-amber-400" />
                ))}
              </div>
              <p className="text-slate-800 dark:text-slate-200 text-xs sm:text-[13px] leading-relaxed">
                &ldquo;Resizer 20 KB ka target exact banata hai. Form reject nahi hota.&rdquo;
              </p>
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
              Sunita Devi &middot; eMitra, Kota
            </div>
          </div>

          {/* Testimonial 3 */}
          <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800/80 bg-white dark:bg-[#0a1329]/80 shadow-sm dark:shadow-none flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="flex items-center gap-1 text-amber-500 dark:text-amber-400">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-amber-400" />
                ))}
              </div>
              <p className="text-slate-800 dark:text-slate-200 text-xs sm:text-[13px] leading-relaxed">
                &ldquo;Suit template natural lagta hai, sticker jaisa nahi. Bahut badhiya.&rdquo;
              </p>
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
              Aslam &middot; CSC VLE
            </div>
          </div>

        </div>

        {/* Disclaimer Text */}
        <p className="text-[11px] text-slate-500 dark:text-slate-500 pt-1">
          Sample feedback shown for illustration. Submit your own on the Feedback page (stored locally).
        </p>

      </section>


      {/* ========================================================= */}
      {/* 6. CTA SECTION */}
      {/* ========================================================= */}
      <section id="cta-section" className="rounded-2xl sm:rounded-3xl border border-slate-200 dark:border-slate-800/80 bg-gradient-to-b from-blue-50/70 via-indigo-50/40 to-white dark:from-[#0e1b3d]/90 dark:to-[#070d1e]/90 p-8 sm:p-12 text-center relative overflow-hidden shadow-lg dark:shadow-2xl space-y-4">
        
        {/* Subtle center ambient radial light */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-xl mx-auto space-y-2.5">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
            Ready to make your next passport photo?
          </h2>
          <p className="text-slate-600 dark:text-slate-300 text-xs sm:text-sm leading-relaxed">
            Open the Passport Studio — upload, remove background, pick a color, enhance, dress and print. All in one place.
          </p>
        </div>

        {/* Buttons Row */}
        <div className="relative z-10 flex flex-wrap items-center justify-center gap-3 pt-2">
          <button
            onClick={() => onSelectTab('passport')}
            className="inline-flex items-center gap-2 px-5 py-2.5 sm:px-6 sm:py-3 rounded-xl font-bold text-xs sm:text-sm text-white bg-blue-600 hover:bg-blue-500 dark:bg-blue-500 dark:hover:bg-blue-400 shadow-[0_4px_20px_rgba(59,130,246,0.35)] cursor-pointer transition-all active:scale-95"
          >
            <Contact className="w-4 h-4" />
            <span>Passport Size</span>
          </button>
          <button
            onClick={() => onSelectTab('documents')}
            className="inline-flex items-center gap-2 px-5 py-2.5 sm:px-6 sm:py-3 rounded-xl font-bold text-xs sm:text-sm text-slate-700 dark:text-slate-200 bg-white hover:bg-slate-100 dark:bg-[#0c1630] dark:hover:bg-[#122044] border border-slate-300 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-600 cursor-pointer transition-all active:scale-95 shadow-xs"
          >
            <FileText className="w-4 h-4" />
            <span>Documents</span>
          </button>
        </div>

      </section>

    </div>
  );
}
