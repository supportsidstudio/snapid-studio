import React from 'react';
import { AppTab, AppTheme, AppLanguage } from '../types';
import SnapIdLogo from './SnapIdLogo';

interface AppFooterProps {
  onSelectTab: (tab: AppTab) => void;
  language: AppLanguage;
  theme: AppTheme;
}

export default function AppFooter({
  onSelectTab,
  language,
  theme
}: AppFooterProps) {
  const isDark = theme === 'dark';

  return (
    <footer 
      id="snapid-global-footer" 
      className={`w-full border-t transition-colors mt-auto ${
        isDark 
          ? 'bg-[#070d1e] border-slate-800/80 text-slate-400' 
          : 'bg-white border-slate-200 text-slate-600 shadow-sm'
      }`}
    >
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-6 text-left space-y-8">
        
        {/* Multi-column Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 sm:gap-10">
          
          {/* Column 1: Brand & Bio (Span 5) */}
          <div className="md:col-span-5 space-y-3">
            <div className="flex items-center gap-2.5">
              <SnapIdLogo theme={theme} size="sm" iconOnly={true} />
              <div className={`font-bold text-sm sm:text-base tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                SnapID <span className="text-blue-500">Studio</span>
              </div>
            </div>
            <div className="text-xs text-slate-400 font-medium">
              AI Passport Photo &amp; Document Photo Tools
            </div>
            <p className="text-xs text-slate-500 leading-relaxed max-w-sm">
              Fast &bull; Private &bull; Easy — privacy-first, runs entirely in your browser.
            </p>
          </div>

          {/* Links Columns (Span 7 total) */}
          <div className="md:col-span-7 grid grid-cols-3 gap-6 sm:gap-8">
            
            {/* Column 2: HOME */}
            <div className="space-y-3">
              <div className={`text-[11px] font-bold uppercase tracking-wider ${isDark ? 'text-slate-300' : 'text-slate-800'}`}>
                HOME
              </div>
              <ul className="space-y-2 text-xs">
                <li>
                  <button 
                    type="button"
                    onClick={() => {
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                      onSelectTab('home');
                    }}
                    className="text-slate-400 hover:text-blue-500 transition-colors cursor-pointer text-left"
                  >
                    Home
                  </button>
                </li>
                <li>
                  <button 
                    type="button"
                    onClick={() => {
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                      onSelectTab('passport');
                    }}
                    className="text-slate-400 hover:text-blue-500 transition-colors cursor-pointer text-left"
                  >
                    Passport Size
                  </button>
                </li>
                <li>
                  <button 
                    type="button"
                    onClick={() => {
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                      onSelectTab('documents');
                    }}
                    className="text-slate-400 hover:text-blue-500 transition-colors cursor-pointer text-left"
                  >
                    Documents
                  </button>
                </li>
                <li>
                  <button 
                    type="button"
                    onClick={() => {
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                      onSelectTab('resizer');
                    }}
                    className="text-slate-400 hover:text-blue-500 transition-colors cursor-pointer text-left"
                  >
                    Photo Resizer
                  </button>
                </li>
              </ul>
            </div>

            {/* Column 3: MORE */}
            <div className="space-y-3">
              <div className={`text-[11px] font-bold uppercase tracking-wider ${isDark ? 'text-slate-300' : 'text-slate-800'}`}>
                MORE
              </div>
              <ul className="space-y-2 text-xs">
                <li>
                  <button 
                    type="button"
                    onClick={() => {
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                      onSelectTab('blog');
                    }}
                    className="text-slate-400 hover:text-blue-500 transition-colors cursor-pointer text-left"
                  >
                    Blog &amp; Guides
                  </button>
                </li>
                <li>
                  <button 
                    type="button"
                    onClick={() => {
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                      onSelectTab('help');
                    }}
                    className="text-slate-400 hover:text-blue-500 transition-colors cursor-pointer text-left"
                  >
                    Help &amp; FAQ
                  </button>
                </li>
                <li>
                  <button 
                    type="button"
                    onClick={() => {
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                      onSelectTab('about');
                    }}
                    className="text-slate-400 hover:text-blue-500 transition-colors cursor-pointer text-left"
                  >
                    About
                  </button>
                </li>
                <li>
                  <button 
                    type="button"
                    onClick={() => {
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                      onSelectTab('contact');
                    }}
                    className="text-slate-400 hover:text-blue-500 transition-colors cursor-pointer text-left"
                  >
                    Contact
                  </button>
                </li>
                <li>
                  <button 
                    type="button"
                    onClick={() => {
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                      onSelectTab('feedback');
                    }}
                    className="text-slate-400 hover:text-blue-500 transition-colors cursor-pointer text-left"
                  >
                    User Feedback
                  </button>
                </li>
              </ul>
            </div>

            {/* Column 4: LEGAL */}
            <div className="space-y-3">
              <div className={`text-[11px] font-bold uppercase tracking-wider ${isDark ? 'text-slate-300' : 'text-slate-800'}`}>
                LEGAL
              </div>
              <ul className="space-y-2 text-xs">
                <li>
                  <button 
                    type="button"
                    onClick={() => {
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                      onSelectTab('legal');
                    }}
                    className="text-slate-400 hover:text-blue-500 transition-colors cursor-pointer text-left"
                  >
                    Privacy Policy
                  </button>
                </li>
                <li>
                  <button 
                    type="button"
                    onClick={() => {
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                      onSelectTab('legal');
                    }}
                    className="text-slate-400 hover:text-blue-500 transition-colors cursor-pointer text-left"
                  >
                    Terms of Service
                  </button>
                </li>
                <li>
                  <button 
                    type="button"
                    onClick={() => {
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                      onSelectTab('legal');
                    }}
                    className="text-slate-400 hover:text-blue-500 transition-colors cursor-pointer text-left"
                  >
                    Disclaimer
                  </button>
                </li>
                <li>
                  <button 
                    type="button"
                    onClick={() => {
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                      onSelectTab('sitemap');
                    }}
                    className="text-slate-400 hover:text-blue-500 transition-colors cursor-pointer text-left"
                  >
                    Sitemap
                  </button>
                </li>
              </ul>
            </div>

          </div>

        </div>

        {/* Bottom Sub-bar */}
        <div className={`border-t pt-5 flex flex-col md:flex-row items-center justify-between gap-3 text-[11px] ${
          isDark ? 'border-slate-800/80 text-slate-500' : 'border-slate-200 text-slate-500'
        }`}>
          <div className="flex flex-col sm:flex-row items-center gap-1.5 sm:gap-3 text-center sm:text-left">
            <span>&copy; 2026 SnapID Studio. All Rights Reserved.</span>
            <span className="hidden sm:inline text-slate-600">&bull;</span>
            <span className="font-medium text-slate-400 dark:text-slate-400">
              Designed &amp; Developed by <strong className="text-slate-300 dark:text-slate-300">Lakshya Mehra</strong> &amp; <strong className="text-slate-300 dark:text-slate-300">Sunil Kumar</strong>
            </span>
          </div>
          <div className="text-center sm:text-right text-slate-400">
            Built for Cyber Cafe &amp; eMitra operators &bull; Browser-based &bull; No uploads
          </div>
        </div>

      </div>
    </footer>
  );
}
