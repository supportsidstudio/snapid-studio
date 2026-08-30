import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import PassportSection from './components/PassportSection';
import DocumentsSection from './components/DocumentsSection';
import PhotoSignatureResizerSection from './components/PhotoSignatureResizerSection';
import HelpAboutLegal from './components/HelpAboutLegal';
import ContactSection from './components/ContactSection';
import { AppTab, AppTheme, AppLanguage } from './types';
import { translations } from './translations';
import { 
  User, 
  FileText, 
  Sliders,
  ChevronRight, 
  Sparkles, 
  CheckCircle, 
  ShieldCheck, 
  Printer,
  Info,
  Sun,
  Moon,
  Languages
} from 'lucide-react';

export default function App() {
  // Read localized and theme values from LocalStorage on mount
  const [theme, setTheme] = useState<AppTheme>(() => {
    const saved = localStorage.getItem('snapid_theme');
    return (saved === 'light' || saved === 'dark') ? saved : 'dark';
  });

  const [language, setLanguage] = useState<AppLanguage>(() => {
    const saved = localStorage.getItem('snapid_language');
    return (saved === 'hi' || saved === 'en') ? saved : 'en';
  });

  const [currentTab, setCurrentTab] = useState<AppTab>(() => {
    const saved = localStorage.getItem('snapid_active_tab');
    return (saved as AppTab) || 'home';
  });

  // Persist selections
  useEffect(() => {
    localStorage.setItem('snapid_theme', theme);
    // Apply styling helper classes
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('snapid_language', language);
  }, [language]);

  useEffect(() => {
    localStorage.setItem('snapid_active_tab', currentTab);
  }, [currentTab]);

  const handleToggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  const handleToggleLanguage = () => {
    setLanguage(prev => prev === 'en' ? 'hi' : 'en');
  };

  const t = translations[language];

  // Render the core page based on tab
  const renderTabContent = () => {
    switch (currentTab) {
      case 'home':
        return renderHomeDashboard();
      case 'passport':
        return <PassportSection language={language} theme={theme} />;
      case 'documents':
        return <DocumentsSection language={language} theme={theme} />;
      case 'resizer':
        return <PhotoSignatureResizerSection language={language} theme={theme} />;
      case 'help':
      case 'about':
      case 'legal':
      case 'blog':
      case 'sitemap':
        return (
          <HelpAboutLegal 
            tab={currentTab} 
            language={language} 
            theme={theme} 
            onChangeTab={setCurrentTab}
          />
        );
      case 'contact':
        return <ContactSection language={language} theme={theme} />;
      default:
        return renderHomeDashboard();
    }
  };

  // Modern Home element
  const renderHomeDashboard = () => (
    <div className="space-y-8 animate-fade-in">
      {/* Top Welcome Title Card */}
      <div className={`p-8 rounded-3xl border relative overflow-hidden ${
        theme === 'dark' 
          ? 'bg-gradient-to-r from-blue-950/20 via-slate-950 to-slate-950 border-slate-900 shadow-xl' 
          : 'bg-gradient-to-r from-blue-50/20 via-white to-white border-slate-200 shadow-sm'
      }`}>
        {/* Glow vector shapes */}
        <div className="absolute -right-16 -top-16 w-60 h-60 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-16 -bottom-16 w-60 h-60 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-2xl">
          <span className="text-xs font-bold text-blue-500 uppercase tracking-widest bg-blue-500/10 px-3 py-1 rounded-full border border-blue-500/15">
            Active Workspace
          </span>
          <h1 className="text-3xl lg:text-4xl font-black font-display tracking-tight mt-4 leading-tight">
            {t.welcomeTitle}
          </h1>
          <p className="text-slate-400 text-sm mt-3.5 leading-relaxed">
            {t.welcomeDesc}
          </p>
        </div>
      </div>

      {/* Main Three Feature Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Card 1: Passport Size Photo Section */}
        <div className={`rounded-2xl border p-6 flex flex-col justify-between transition-all group ${
          theme === 'dark'
            ? 'bg-slate-950/70 border-slate-900 hover:border-slate-800'
            : 'bg-white border-slate-200 hover:border-slate-300 shadow-sm'
        }`}>
          <div>
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-5 ${
              theme === 'dark' ? 'bg-blue-600/10 text-blue-400' : 'bg-blue-50 text-blue-600'
            }`}>
              <User className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold font-display tracking-tight group-hover:text-blue-550 transition-colors">
              {t.cardPassportTitle}
            </h3>
            <p className="text-xs text-slate-400 mt-2.5 leading-relaxed">
              {t.cardPassportDesc}
            </p>
          </div>

          <button
            onClick={() => setCurrentTab('passport')}
            className="mt-6 inline-flex items-center justify-between px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs shadow-md shadow-blue-500/5 group/btn cursor-pointer transition-colors"
          >
            <span>{t.getStarted}</span>
            <ChevronRight className="w-4 h-4 group-hover/btn:translate-x-0.5 transition-transform" />
          </button>
        </div>

        {/* Card 2: Documents Section */}
        <div className={`rounded-2xl border p-6 flex flex-col justify-between transition-all group ${
          theme === 'dark'
            ? 'bg-slate-950/70 border-slate-900 hover:border-slate-800'
            : 'bg-white border-slate-200 hover:border-slate-300 shadow-sm'
        }`}>
          <div>
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-5 ${
              theme === 'dark' ? 'bg-cyan-600/10 text-cyan-400' : 'bg-cyan-50 text-cyan-700'
            }`}>
              <FileText className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold font-display tracking-tight group-hover:text-cyan-550 transition-colors">
              {t.cardDocsTitle}
            </h3>
            <p className="text-xs text-slate-400 mt-2.5 leading-relaxed">
              {t.cardDocsDesc}
            </p>
          </div>

          <button
            onClick={() => setCurrentTab('documents')}
            className="mt-6 inline-flex items-center justify-between px-5 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white border border-slate-805 font-semibold text-xs shadow-md group/btn cursor-pointer transition-colors"
          >
            <span>{t.getStarted}</span>
            <ChevronRight className="w-4 h-4 group-hover/btn:translate-x-0.5 transition-transform text-slate-400" />
          </button>
        </div>

        {/* Card 3: Photo Resizer */}
        <div className={`rounded-2xl border p-6 flex flex-col justify-between transition-all group ${
          theme === 'dark'
            ? 'bg-slate-950/70 border-slate-900 hover:border-slate-800'
            : 'bg-white border-slate-200 hover:border-slate-300 shadow-sm'
        }`}>
          <div>
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-5 ${
              theme === 'dark' ? 'bg-indigo-600/10 text-indigo-400' : 'bg-indigo-50 text-indigo-700'
            }`}>
              <Sliders className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold font-display tracking-tight group-hover:text-indigo-500 transition-colors">
              {(t as any).cardResizerTitle || 'Photo Resizer'}
            </h3>
            <p className="text-xs text-slate-400 mt-2.5 leading-relaxed">
              {(t as any).cardResizerDesc || 'Resize dimensions (px/%), compress to target KB (10–200 KB), and adjust quality for photos and signatures.'}
            </p>
          </div>

          <button
            onClick={() => setCurrentTab('resizer')}
            className="mt-6 inline-flex items-center justify-between px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-md group/btn cursor-pointer transition-colors"
          >
            <span>{t.getStarted}</span>
            <ChevronRight className="w-4 h-4 group-hover/btn:translate-x-0.5 transition-transform text-white" />
          </button>
        </div>
      </div>

      {/* Bottom specs summary dictionary */}
      <div className={`p-6 rounded-2xl border ${
        theme === 'dark' ? 'bg-slate-950 border-slate-900 text-slate-400' : 'bg-white border-slate-200'
      }`}>
        <h3 className={`font-bold text-sm mb-3.5 flex items-center gap-2 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
          <Printer className="w-4 h-4 text-blue-500" />
          <span>ISO standard specs dimensions guide</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="p-3.5 rounded-xl bg-slate-500/5 space-y-1">
            <span className={`font-semibold block ${theme === 'dark' ? 'text-slate-200' : 'text-slate-800'}`}>ID-1 (PVC standard)</span>
            <span className="text-slate-400">85.60 mm x 53.98 mm</span>
            <span className="text-[10px] text-slate-400 block font-mono">Aadhaar, PAN, Voter ID, DL, Jan Aadhaar</span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-500/5 space-y-1">
            <span className={`font-semibold block ${theme === 'dark' ? 'text-slate-200' : 'text-slate-800'}`}>US / India Passport</span>
            <span className="text-slate-400">2" x 2" (51.0 mm x 51.0 mm)</span>
            <span className="text-[10px] text-slate-400 block font-mono">Standard Square Profile Portrait</span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-500/5 space-y-1">
            <span className={`font-semibold block ${theme === 'dark' ? 'text-slate-200' : 'text-slate-800'}`}>UK / EU Passport</span>
            <span className="text-slate-400">35.0 mm x 45.0 mm</span>
            <span className="text-[10px] text-slate-400 block font-mono">Standard Tall Profile Portrait</span>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className={`min-h-screen flex flex-col lg:flex-row font-sans ${
      theme === 'dark' 
        ? 'bg-slate-950 text-slate-100' 
        : 'bg-slate-50 text-slate-800'
    }`}>
      
      {/* Sidebar Section */}
      <Sidebar
        currentTab={currentTab}
        onChangeTab={setCurrentTab}
        theme={theme}
        onToggleTheme={handleToggleTheme}
        language={language}
        onToggleLanguage={handleToggleLanguage}
      />

      {/* Main content viewport space */}
      <main className="flex-1 min-w-0 flex flex-col relative">
        
        {/* Top-Right Premium Quick Controls Header Bar (Desktop Only) */}
        <div className={`w-full hidden lg:flex justify-end items-center px-4 py-3 md:px-8 md:py-4 gap-3 shrink-0 ${
          theme === 'dark' 
            ? 'bg-slate-950/20 border-b border-slate-900/50' 
            : 'bg-slate-50/20 border-b border-slate-200/50'
        } backdrop-blur-md sticky top-0 z-30`}>
          
          {/* Quick Language Toggle */}
          <button
            onClick={handleToggleLanguage}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all duration-300 cursor-pointer ${
              theme === 'dark'
                ? 'bg-slate-900/90 hover:bg-slate-850 text-slate-200 hover:text-white shadow-[0_4px_12px_rgba(0,0,0,0.5)] hover:shadow-[0_6px_16px_rgba(0,0,0,0.7)]'
                : 'bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 shadow-[0_4px_12px_rgba(15,23,42,0.08)] hover:shadow-[0_6px_16px_rgba(15,23,42,0.12)]'
            }`}
            title={language === 'en' ? 'हिन्दी में बदलें' : 'Switch to English'}
          >
            <Languages className="w-3.5 h-3.5 text-blue-500 shrink-0" />
            <span className="font-sans tracking-wide text-[11px]">
              {language === 'en' ? 'हिन्दी' : 'English'}
            </span>
          </button>

          {/* Quick Theme Toggle */}
          <button
            onClick={handleToggleTheme}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all duration-300 cursor-pointer ${
              theme === 'dark'
                ? 'bg-slate-900/90 hover:bg-slate-850 text-slate-200 hover:text-white shadow-[0_4px_12px_rgba(0,0,0,0.5)] hover:shadow-[0_6px_16px_rgba(0,0,0,0.7)]'
                : 'bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 shadow-[0_4px_12px_rgba(15,23,42,0.08)] hover:shadow-[0_6px_16px_rgba(15,23,42,0.12)]'
            }`}
            title={theme === 'dark' ? 'Switch to White Mode' : 'Switch to Dark Mode'}
          >
            {theme === 'dark' ? (
              <>
                <Sun className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                <span>White Mode</span>
              </>
            ) : (
              <>
                <Moon className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                <span>Dark Mode</span>
              </>
            )}
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-6 md:p-8 max-w-7xl w-full mx-auto space-y-8 flex flex-col justify-between">
          <div className="flex-1">
            {renderTabContent()}
          </div>
          
          <footer className={`pt-6 pb-2 border-t text-[11px] font-sans flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0 ${
            theme === 'dark' 
              ? 'border-slate-900 text-slate-400' 
              : 'border-slate-200 text-slate-550'
          }`}>
            <div className="flex items-center gap-1.5 font-medium">
              <span>© 2026</span>
              <span className="font-black tracking-tight dark:text-slate-300 text-slate-700">SnapID Studio.</span>
              <span>All Rights Reserved.</span>
            </div>
            <div className="flex items-center gap-1.5 font-medium">
              <span>Designed &amp; Developed by</span>
              <span className="font-bold dark:text-slate-200 text-slate-700">Lakshya Mehra</span>
              <span>&amp;</span>
              <span className="font-bold dark:text-slate-200 text-slate-700">Sunil Kumar</span>
            </div>
          </footer>
        </div>
      </main>

    </div>
  );
}
