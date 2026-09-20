import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { flushSync } from 'react-dom';
import TopNavigation from './components/TopNavigation';
import PassportSection from './components/PassportSection';
import DocumentsSection from './components/DocumentsSection';
import PhotoSignatureResizerSection from './components/PhotoSignatureResizerSection';
import HelpAboutLegal from './components/HelpAboutLegal';
import ContactSection from './components/ContactSection';
import FeedbackWidget from './components/FeedbackWidget';
import UserFeedbackSection from './components/UserFeedbackSection';
import HomeDashboard from './components/HomeDashboard';
import AppFooter from './components/AppFooter';
import { AppTab, AppTheme, AppLanguage } from './types';

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

  // Persist selections and keep html classes/styles strictly synchronized
  useEffect(() => {
    try {
      localStorage.setItem('snapid_theme', theme);
    } catch (e) {}

    const isDarkTheme = theme === 'dark';
    if (isDarkTheme) {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
      document.documentElement.style.backgroundColor = '#020617';
      document.documentElement.style.colorScheme = 'dark';
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
      document.documentElement.style.backgroundColor = '#f8fafc';
      document.documentElement.style.colorScheme = 'light';
    }
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('snapid_language', language);
  }, [language]);

  useEffect(() => {
    localStorage.setItem('snapid_active_tab', currentTab);
  }, [currentTab]);

  const handleToggleTheme = useCallback(() => {
    const nextTheme: AppTheme = theme === 'dark' ? 'light' : 'dark';
    const isDarkNext = nextTheme === 'dark';

    // 1. Temporarily disable transitions on ALL elements so all surfaces switch in the exact same paint frame
    document.documentElement.classList.add('theme-switching');

    // 2. Synchronously update <html> classes, inline styles, and color scheme
    if (isDarkNext) {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
      document.documentElement.style.backgroundColor = '#020617';
      document.documentElement.style.colorScheme = 'dark';
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
      document.documentElement.style.backgroundColor = '#f8fafc';
      document.documentElement.style.colorScheme = 'light';
    }

    try {
      localStorage.setItem('snapid_theme', nextTheme);
    } catch (e) {}

    // 3. Force React to synchronously flush DOM updates so child components update immediately in the same tick
    flushSync(() => {
      setTheme(nextTheme);
    });

    // 4. Force browser reflow to guarantee a single synchronous paint frame
    void document.documentElement.offsetHeight;

    // 5. Re-enable interactive transitions (hover/active) on next animation frame
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        document.documentElement.classList.remove('theme-switching');
      });
    });
  }, [theme]);

  const handleToggleLanguage = useCallback(() => {
    setLanguage(prev => prev === 'en' ? 'hi' : 'en');
  }, []);

  const handleSelectTab = useCallback((tab: AppTab) => {
    setCurrentTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const isDark = theme === 'dark';

  // Memoized main page content
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
    <div className={`min-h-screen flex flex-col font-sans selection:bg-blue-500 selection:text-white relative ${
      isDark 
        ? 'bg-slate-950 text-slate-100' 
        : 'bg-slate-50 text-slate-800'
    }`}>
      {/* Subtle Ambient Background Mesh for Dark Mode to prevent flat dead black void */}
      {isDark && (
        <div 
          className="fixed inset-0 pointer-events-none z-0 opacity-40"
          style={{
            backgroundImage: `
              radial-gradient(circle at 50% 0%, rgba(37, 99, 235, 0.15) 0%, transparent 50%),
              radial-gradient(circle at 100% 60%, rgba(30, 58, 138, 0.1) 0%, transparent 40%),
              radial-gradient(circle at 0% 80%, rgba(14, 165, 233, 0.08) 0%, transparent 40%)
            `
          }}
        />
      )}
      
      {/* Top Horizontal Navigation Bar */}
      <TopNavigation
        currentTab={currentTab}
        onChangeTab={handleSelectTab}
        theme={theme}
        onToggleTheme={handleToggleTheme}
        language={language}
        onToggleLanguage={handleToggleLanguage}
      />

      {/* Main content viewport space */}
      <main className="flex-1 w-full flex flex-col min-h-0">
        
        {/* Main Content Area: Responsive vertical document flow */}
        <div className="flex-1 w-full max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6">
          <div className="w-full">
            {mainContent}
          </div>
        </div>

        {/* Global Studio Footer for all pages */}
        <AppFooter 
          onSelectTab={handleSelectTab} 
          language={language} 
          theme={theme} 
        />
      </main>

      {/* Floating 3D Feedback System */}
      <FeedbackWidget theme={theme} language={language} />

    </div>
  );
}
