import React, { useState, useRef, useEffect } from 'react';
import { 
  Home, 
  User, 
  FileText, 
  Sliders, 
  HelpCircle, 
  Info, 
  Shield, 
  Mail, 
  BookOpen, 
  Map, 
  MessageSquareHeart, 
  ChevronDown, 
  Sun, 
  Moon, 
  Languages, 
  Menu, 
  X,
  Search,
  Sparkles
} from 'lucide-react';
import { AppTab, AppTheme, AppLanguage } from '../types';
import { translations } from '../translations';
import SnapIdLogo from './SnapIdLogo';

export interface TopNavigationProps {
  currentTab: AppTab;
  onChangeTab: (tab: AppTab) => void;
  theme: AppTheme;
  onToggleTheme: () => void;
  language: AppLanguage;
  onToggleLanguage: () => void;
}

export default function TopNavigation({
  currentTab,
  onChangeTab,
  theme,
  onToggleTheme,
  language,
  onToggleLanguage,
}: TopNavigationProps) {
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const moreRef = useRef<HTMLDivElement>(null);
  const t = translations[language];
  const isDark = theme === 'dark';

  // Four Primary Navigation Items directly visible in top bar
  const primaryNavItems = [
    { id: 'home' as AppTab, label: t.navHome || 'Home', icon: Home },
    { id: 'passport' as AppTab, label: t.navPassport || 'Passport Size', icon: User, badge: 'Popular' },
    { id: 'documents' as AppTab, label: t.navDocuments || 'Documents', icon: FileText },
    { id: 'resizer' as AppTab, label: (t as any).navResizer || 'Photo Resizer', icon: Sliders },
  ];

  // Secondary items strictly inside "More ▾"
  const moreNavItems = [
    { id: 'blog' as AppTab, label: (t as any).navBlog || 'Blog & Guides', icon: BookOpen, desc: 'Printing & specs guidelines' },
    { id: 'help' as AppTab, label: t.navHelp || 'Help & FAQ', icon: HelpCircle, desc: 'Answers, instructions & tips' },
    { id: 'about' as AppTab, label: t.navAbout || 'About', icon: Info, desc: 'About SnapID Studio suite' },
    { id: 'legal' as AppTab, label: t.navLegal || 'Legal', icon: Shield, desc: 'Privacy policy & terms of service' },
    { id: 'contact' as AppTab, label: t.navContact || 'Contact Us', icon: Mail, desc: 'Support & developer inquiries' },
    { id: 'sitemap' as AppTab, label: (t as any).navSitemap || 'Sitemap', icon: Map, desc: 'Full directory of all tools' },
    { id: 'feedback' as AppTab, label: (t as any).navFeedback || 'User Feedback', icon: MessageSquareHeart, desc: 'Share your suggestions' },
  ];

  // Check if active tab is inside the More dropdown
  const isMoreActive = moreNavItems.some(item => item.id === currentTab);

  // Close "More" dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (moreRef.current && !moreRef.current.contains(event.target as Node)) {
        setIsMoreOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectTab = (tabId: AppTab) => {
    onChangeTab(tabId);
    setIsMoreOpen(false);
    setIsMobileMenuOpen(false);
  };

  return (
    <header 
      id="snapid-top-header"
      className={`w-full sticky top-0 z-50 backdrop-blur-xl border-b ${
        isDark 
          ? 'bg-slate-950/90 border-slate-800/80 shadow-[0_4px_24px_rgba(0,0,0,0.5)] text-slate-100' 
          : 'bg-white/95 border-slate-200/90 shadow-xs text-slate-800'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-17 gap-3">
          
          {/* LEFT: SnapID Studio Logo / Branding */}
          <div className="flex items-center shrink-0">
            <button
              type="button"
              onClick={() => handleSelectTab('home')}
              className="flex items-center gap-2 cursor-pointer transition-transform active:scale-98 text-left focus:outline-none"
              title="SnapID Studio - Home"
            >
              <SnapIdLogo size="sm" theme={theme} />
            </button>
          </div>

          {/* CENTER: Main Top Horizontal Navigation (Desktop) */}
          <nav className="hidden md:flex items-center gap-1 lg:gap-1.5 justify-center flex-1 max-w-2xl mx-auto">
            {primaryNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleSelectTab(item.id)}
                  className={`relative flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs lg:text-sm font-bold transition-all cursor-pointer select-none ${
                    isActive
                      ? isDark
                        ? 'bg-blue-600/15 text-blue-400 border border-blue-500/30 shadow-[0_0_15px_rgba(59,130,246,0.2)]'
                        : 'bg-blue-50 text-blue-600 border border-blue-200 shadow-xs'
                      : isDark
                        ? 'text-slate-300 hover:text-white hover:bg-slate-900/80 border border-transparent'
                        : 'text-slate-600 hover:text-slate-950 hover:bg-slate-100/80 border border-transparent'
                  }`}
                >
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-blue-500' : 'text-slate-400'}`} />
                  <span className="truncate">{item.label}</span>
                  {item.badge && (
                    <span className="hidden lg:inline-block text-[9px] font-mono px-1.5 py-0.2 rounded-full bg-blue-500/15 text-blue-400 font-bold border border-blue-500/25">
                      {item.badge}
                    </span>
                  )}
                  {isActive && (
                    <span className="absolute -bottom-[1px] left-1/2 -translate-x-1/2 w-8 h-[2px] bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full" />
                  )}
                </button>
              );
            })}

            {/* MORE ▾ Dropdown Trigger */}
            <div ref={moreRef} className="relative">
              <button
                type="button"
                onClick={() => setIsMoreOpen(prev => !prev)}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs lg:text-sm font-bold transition-all cursor-pointer select-none ${
                  isMoreActive || isMoreOpen
                    ? isDark
                      ? 'bg-blue-600/15 text-blue-400 border border-blue-500/30'
                      : 'bg-blue-50 text-blue-600 border border-blue-200'
                    : isDark
                      ? 'text-slate-300 hover:text-white hover:bg-slate-900/80 border border-transparent'
                      : 'text-slate-600 hover:text-slate-950 hover:bg-slate-100/80 border border-transparent'
                }`}
                title="More Pages & Guides"
                aria-expanded={isMoreOpen}
              >
                <span>{language === 'hi' ? 'अन्य' : 'More'}</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isMoreOpen ? 'rotate-180 text-blue-500' : 'text-slate-400'}`} />
                {isMoreActive && (
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
                )}
              </button>

              {/* MORE ▾ Popover Dropdown Menu */}
              {isMoreOpen && (
                <div 
                  className={`absolute right-0 mt-2 w-64 rounded-2xl border shadow-2xl backdrop-blur-2xl p-2 z-50 animate-fadeIn ${
                    isDark
                      ? 'bg-slate-950/95 border-slate-800 text-slate-200 shadow-[0_12px_40px_rgba(0,0,0,0.8)]'
                      : 'bg-white/95 border-slate-200 text-slate-800 shadow-xl'
                  }`}
                >
                  <div className="px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-wider font-mono text-slate-400 border-b border-slate-800/50 mb-1 flex items-center justify-between">
                    <span>{language === 'hi' ? 'अतिरिक्त विकल्प' : 'More Resources'}</span>
                    <Sparkles className="w-3 h-3 text-blue-400" />
                  </div>

                  <div className="space-y-0.5">
                    {moreNavItems.map((item) => {
                      const Icon = item.icon;
                      const isItemActive = currentTab === item.id;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => handleSelectTab(item.id)}
                          className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left transition-all cursor-pointer ${
                            isItemActive
                              ? isDark
                                ? 'bg-blue-600/20 text-blue-400 font-bold border border-blue-500/30'
                                : 'bg-blue-50 text-blue-600 font-bold border border-blue-200'
                              : isDark
                                ? 'text-slate-300 hover:text-white hover:bg-slate-900/90'
                                : 'text-slate-700 hover:text-slate-950 hover:bg-slate-100'
                          }`}
                        >
                          <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                            isItemActive 
                              ? 'bg-blue-500 text-white' 
                              : isDark ? 'bg-slate-900 text-slate-400' : 'bg-slate-100 text-slate-500'
                          }`}>
                            <Icon className="w-3.5 h-3.5" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <span className="text-xs block font-bold truncate">{item.label}</span>
                            <span className="text-[10px] text-slate-400 block truncate">{item.desc}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </nav>

          {/* RIGHT: Language Selector & Theme Control */}
          <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
            
            {/* Language Selector */}
            <button
              type="button"
              onClick={onToggleLanguage}
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl text-xs font-bold transition-all cursor-pointer active:scale-95 border ${
                isDark
                  ? 'bg-slate-900/90 hover:bg-slate-800 text-slate-200 hover:text-white border-slate-800 shadow-xs'
                  : 'bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-950 border-slate-200 shadow-xs'
              }`}
              title={language === 'en' ? 'हिन्दी में बदलें (Switch to Hindi)' : 'Switch to English'}
              aria-label="Toggle language"
            >
              <Languages className={`w-3.5 h-3.5 shrink-0 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
              <span className="font-sans">
                {language === 'en' ? 'English' : 'हिन्दी'}
              </span>
              <span className="text-[10px] text-slate-400">▾</span>
            </button>

            {/* Theme / Appearance Control */}
            <button
              type="button"
              onClick={onToggleTheme}
              className={`flex items-center justify-center w-8.5 h-8.5 sm:w-9 sm:h-9 rounded-xl transition-all cursor-pointer active:scale-95 border ${
                isDark
                  ? 'bg-slate-900/90 hover:bg-slate-800 text-amber-400 border-slate-800 shadow-xs'
                  : 'bg-white hover:bg-slate-50 text-indigo-600 border-slate-200 shadow-xs'
              }`}
              title={isDark ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
              aria-label="Toggle theme"
            >
              {isDark ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-indigo-600" />
              )}
            </button>

            {/* Mobile Navigation Menu Toggle Button (Visible only on mobile/small screens) */}
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(prev => !prev)}
              className={`md:hidden flex items-center justify-center w-8.5 h-8.5 rounded-xl border transition-all cursor-pointer active:scale-95 ${
                isDark
                  ? 'bg-slate-900 border-slate-800 text-slate-200'
                  : 'bg-white border-slate-200 text-slate-800'
              }`}
              aria-label="Toggle navigation menu"
            >
              {isMobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>

        </div>

        {/* Mobile Horizontal Navigation Bar (Always visible below header on mobile for instantaneous 1-tap switching) */}
        <div className="md:hidden flex items-center justify-between gap-1 py-2 border-t border-slate-800/40 overflow-x-auto no-scrollbar">
          {primaryNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleSelectTab(item.id)}
                className={`flex-1 flex flex-col items-center justify-center py-1.5 px-1 rounded-xl text-[10px] font-bold transition-all cursor-pointer whitespace-nowrap min-w-[62px] ${
                  isActive
                    ? isDark
                      ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                      : 'bg-blue-50 text-blue-600 border border-blue-200'
                    : isDark
                      ? 'text-slate-400 hover:text-slate-200'
                      : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 mb-0.5 ${isActive ? 'text-blue-400' : 'text-slate-400'}`} />
                <span className="truncate">{item.label.split(' ')[0]}</span>
              </button>
            );
          })}

          {/* Mobile "More" Quick Tab */}
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(prev => !prev)}
            className={`flex-1 flex flex-col items-center justify-center py-1.5 px-1 rounded-xl text-[10px] font-bold transition-all cursor-pointer whitespace-nowrap min-w-[55px] ${
              isMoreActive || isMobileMenuOpen
                ? isDark
                  ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                  : 'bg-blue-50 text-blue-600 border border-blue-200'
                : isDark
                  ? 'text-slate-400 hover:text-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ChevronDown className={`w-3.5 h-3.5 mb-0.5 transition-transform ${isMobileMenuOpen ? 'rotate-180 text-blue-400' : 'text-slate-400'}`} />
            <span>{language === 'hi' ? 'अन्य' : 'More'}</span>
          </button>
        </div>

      </div>

      {/* Mobile Drawer / Expanded Menu for "More" and all resources */}
      {isMobileMenuOpen && (
        <div className={`md:hidden border-t px-4 py-3 space-y-3 animate-fadeIn ${
          isDark ? 'bg-slate-950 border-slate-800 text-slate-200' : 'bg-white border-slate-200 text-slate-800'
        }`}>
          <div className="text-[10px] font-extrabold uppercase tracking-wider font-mono text-slate-400 px-1">
            {language === 'hi' ? 'सभी टूल्स एवं पेज' : 'More Pages & Tools'}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
            {moreNavItems.map((item) => {
              const Icon = item.icon;
              const isItemActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleSelectTab(item.id)}
                  className={`flex items-center gap-2.5 p-2.5 rounded-xl text-left cursor-pointer transition-all ${
                    isItemActive
                      ? isDark
                        ? 'bg-blue-600/20 text-blue-400 font-bold border border-blue-500/30'
                        : 'bg-blue-50 text-blue-600 font-bold border border-blue-200'
                      : isDark
                        ? 'text-slate-300 hover:bg-slate-900'
                        : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                    isItemActive
                      ? 'bg-blue-500 text-white'
                      : isDark ? 'bg-slate-900 text-slate-400' : 'bg-slate-100 text-slate-500'
                  }`}>
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-xs font-bold block truncate">{item.label}</span>
                    <span className="text-[10px] text-slate-400 block truncate">{item.desc}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </header>
  );
}
