import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import Sidebar from './components/Sidebar';
import PassportSection from './components/PassportSection';
import DocumentsSection from './components/DocumentsSection';
import PhotoSignatureResizerSection from './components/PhotoSignatureResizerSection';
import HelpAboutLegal from './components/HelpAboutLegal';
import ContactSection from './components/ContactSection';
import FeedbackWidget from './components/FeedbackWidget';
import UserFeedbackSection from './components/UserFeedbackSection';
import HomeDashboard from './components/HomeDashboard';
import { AppTab, AppTheme, AppLanguage } from './types';
import { translations } from './translations';
import { 
  Sun, 
  Moon, 
  Languages,
  Search,
  User,
  FileText,
  Sliders,
  Sparkles,
  HelpCircle
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

  // Collapsible sidebar state (persisted across page navigation)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(() => {
    const saved = localStorage.getItem('snapid_sidebar_collapsed');
    return saved === 'true';
  });

  // Search state in top header
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    localStorage.setItem('snapid_sidebar_collapsed', String(isSidebarCollapsed));
  }, [isSidebarCollapsed]);

  // Close search popup on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleToggleTheme = useCallback(() => {
    setTheme(prev => {
      const nextTheme: AppTheme = prev === 'dark' ? 'light' : 'dark';
      if (nextTheme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      try {
        localStorage.setItem('snapid_theme', nextTheme);
      } catch (e) {}
      return nextTheme;
    });
  }, []);

  const handleToggleLanguage = useCallback(() => {
    setLanguage(prev => prev === 'en' ? 'hi' : 'en');
  }, []);

  const handleToggleSidebar = useCallback(() => {
    setIsSidebarCollapsed(prev => !prev);
  }, []);

  const handleSelectTab = useCallback((tab: AppTab) => {
    setCurrentTab(tab);
  }, []);

  const isDark = theme === 'dark';

  // Search tools list
  const searchableTools = [
    {
      id: 'passport' as AppTab,
      title: 'Passport Size Photo Maker',
      desc: '4x6, A4, single sheets, Indian & global passport specs, AI background removal',
      icon: User,
      badge: 'Popular'
    },
    {
      id: 'documents' as AppTab,
      title: 'Standard Indian Documents',
      desc: 'Aadhaar, PAN Card, Voter ID, Driving Licence, Jan Aadhaar card printing',
      icon: FileText,
      badge: 'eMitra / CSC'
    },
    {
      id: 'resizer' as AppTab,
      title: 'Photo & Signature Resizer',
      desc: 'Compress to 10KB–200KB, resize px/mm, UPSC, SSC, IBPS exam form specs',
      icon: Sliders,
      badge: 'Govt Specs'
    },
    {
      id: 'passport' as AppTab,
      title: 'AI Background Removal',
      desc: 'Automatic cutout with white, blue, red studio background colors',
      icon: Sparkles,
      badge: '100% Offline'
    },
    {
      id: 'help' as AppTab,
      title: 'Help, FAQ & Print Guides',
      desc: 'Printer margin settings, 300 DPI layout guide, paper dimensions',
      icon: HelpCircle,
      badge: 'Guide'
    }
  ];

  const filteredTools = searchQuery.trim() === ''
    ? searchableTools
    : searchableTools.filter(item => 
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.desc.toLowerCase().includes(searchQuery.toLowerCase())
      );

  // Memoized main page content - skips re-rendering entire tab when sidebar collapses or opens
  const mainContent = useMemo(() => {
    switch (currentTab) {
      case 'home':
        return (
          <HomeDashboard 
            onSelectTab={handleSelectTab} 
            language={language} 
            theme={theme} 
          />
        );
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
            onChangeTab={handleSelectTab}
          />
        );
      case 'contact':
        return <ContactSection language={language} theme={theme} />;
      case 'feedback':
        return <UserFeedbackSection language={language} theme={theme} />;
      default:
        return (
          <HomeDashboard 
            onSelectTab={handleSelectTab} 
            language={language} 
            theme={theme} 
          />
        );
    }
  }, [currentTab, language, theme, handleSelectTab]);

  return (
    <div className={`min-h-screen flex flex-col lg:flex-row font-sans ${
      isDark 
        ? 'bg-slate-950 text-slate-100' 
        : 'bg-slate-50 text-slate-800'
    }`}>
      
      {/* Sidebar Section (Collapsible on Desktop, Drawer on Mobile) */}
      <Sidebar
        currentTab={currentTab}
        onChangeTab={handleSelectTab}
        theme={theme}
        onToggleTheme={handleToggleTheme}
        language={language}
        onToggleLanguage={handleToggleLanguage}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={handleToggleSidebar}
      />

      {/* Main content viewport space */}
      <main className="flex-1 min-w-0 flex flex-col relative">
        
        {/* Top Header Bar (Desktop Only) - Matching Reference: Search + Language + Theme, NO LOGIN/PROFILE ICON */}
        <header className={`w-full hidden lg:flex justify-between items-center px-6 py-2.5 shrink-0 border-b backdrop-blur-md sticky top-0 z-30 ${
          isDark 
            ? 'bg-[#060b18]/85 border-slate-900/80 shadow-[0_4px_20px_rgba(0,0,0,0.4)]' 
            : 'bg-white/85 border-slate-200/80 shadow-xs'
        }`}>
          
          {/* Header Left / Center: Sleek Interactive Search Bar */}
          <div ref={searchRef} className="relative w-80 md:w-96">
            <div className={`flex items-center gap-2.5 px-3.5 py-1.5 rounded-xl border text-xs ${
              isDark
                ? 'bg-[#0b1633]/90 border-blue-500/25 focus-within:border-cyan-400 focus-within:shadow-[0_0_15px_rgba(6,182,212,0.25)] text-slate-200'
                : 'bg-slate-100/90 border-slate-250 focus-within:border-blue-500 focus-within:bg-white focus-within:shadow-xs text-slate-800'
            }`}>
              <Search className="w-4 h-4 text-cyan-400 shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setIsSearchOpen(true);
                }}
                onFocus={() => setIsSearchOpen(true)}
                placeholder={language === 'hi' ? 'टूल्स, दस्तावेज़, साइज़ खोजें...' : 'Search tools, features...'}
                className={`w-full bg-transparent outline-none text-xs placeholder:text-slate-500 ${
                  isDark ? 'text-slate-200' : 'text-slate-800'
                }`}
              />
              <span className="hidden sm:inline-block text-[10px] font-mono px-2 py-0.5 rounded bg-slate-500/15 text-slate-400 shrink-0 border border-slate-500/20">
                Ctrl + K
              </span>
            </div>

            {/* Quick Search Results Dropdown */}
            {isSearchOpen && (
              <div className={`absolute left-0 right-0 mt-2 rounded-2xl border shadow-xl backdrop-blur-xl p-2 z-50 ${
                isDark 
                  ? 'bg-slate-950/95 border-blue-500/25 text-slate-200 shadow-[0_10px_30px_rgba(0,0,0,0.7)]' 
                  : 'bg-white/95 border-slate-200 text-slate-800 shadow-lg'
              }`}>
                <div className="px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider font-mono text-slate-400">
                  {searchQuery.trim() ? 'Matching Tools' : 'Quick Navigation'}
                </div>
                <div className="space-y-1 mt-1 max-h-64 overflow-y-auto">
                  {filteredTools.map((tool, idx) => {
                    const IconComp = tool.icon;
                    return (
                      <button
                        key={`${tool.id}-${idx}`}
                        onClick={() => {
                          setCurrentTab(tool.id);
                          setIsSearchOpen(false);
                          setSearchQuery('');
                        }}
                        className={`w-full flex items-center justify-between p-2 rounded-xl text-left cursor-pointer ${
                          isDark 
                            ? 'hover:bg-slate-900/90 text-slate-200' 
                            : 'hover:bg-blue-50/70 text-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-7 h-7 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center shrink-0">
                            <IconComp className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <span className="text-xs font-bold block truncate">{tool.title}</span>
                            <span className="text-[10px] text-slate-400 block truncate">{tool.desc}</span>
                          </div>
                        </div>
                        <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 shrink-0">
                          {tool.badge}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Header Right: Language selector + Theme toggle (NO LOGIN/PROFILE ICON) */}
          <div className="flex items-center gap-3">
            {/* Quick Language Toggle */}
            <button
              onClick={handleToggleLanguage}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer ${
                isDark
                  ? 'bg-[#0b1633]/90 hover:bg-[#0f2048] text-slate-200 hover:text-white border border-blue-500/25 shadow-xs'
                  : 'bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 border border-slate-200 shadow-xs'
              }`}
              title={language === 'en' ? 'हिन्दी में बदलें' : 'Switch to English'}
            >
              <Languages className={`w-3.5 h-3.5 shrink-0 ${isDark ? 'text-cyan-400' : 'text-blue-600'}`} />
              <span className="font-sans text-xs">
                {language === 'en' ? 'English' : 'हिन्दी'}
              </span>
              <span className="text-[10px] text-slate-400">▾</span>
            </button>

            {/* Quick Theme Toggle */}
            <button
              onClick={handleToggleTheme}
              className={`flex items-center justify-center w-8 h-8 rounded-xl cursor-pointer ${
                isDark
                  ? 'bg-[#0b1633]/90 hover:bg-[#0f2048] text-amber-400 border border-blue-500/25 shadow-xs'
                  : 'bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 border border-slate-200 shadow-xs'
              }`}
              title={isDark ? 'Switch to White Mode' : 'Switch to Dark Mode'}
            >
              {isDark ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-indigo-500" />
              )}
            </button>
          </div>

        </header>

        {/* Main Content Area: Dynamically expands when sidebar is collapsed, compact padding */}
        <div className={`flex-1 overflow-y-auto px-4 py-4 md:px-6 md:py-4 w-full mx-auto space-y-4 flex flex-col justify-between ${
          isSidebarCollapsed ? 'max-w-[1550px]' : 'max-w-7xl'
        }`}>
          <div className="flex-1">
            {mainContent}
          </div>
          
          <footer className={`pt-6 pb-2 border-t text-[11px] font-sans flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0 ${
            isDark 
              ? 'border-slate-900 text-slate-400' 
              : 'border-slate-200 text-slate-600'
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

      {/* Floating 3D Feedback System */}
      <FeedbackWidget theme={theme} language={language} />

    </div>
  );
}
