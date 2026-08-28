import React, { useState } from 'react';
import { 
  Home, 
  User, 
  FileText, 
  HelpCircle, 
  Info, 
  Shield, 
  Menu, 
  X, 
  Sun, 
  Moon, 
  Languages,
  Mail,
  BookOpen,
  Map
} from 'lucide-react';
import { AppTab, AppTheme, AppLanguage } from '../types';
import { translations } from '../translations';
import SnapIdLogo from './SnapIdLogo';

interface SidebarProps {
  currentTab: AppTab;
  onChangeTab: (tab: AppTab) => void;
  theme: AppTheme;
  onToggleTheme: () => void;
  language: AppLanguage;
  onToggleLanguage: () => void;
}

export default function Sidebar({
  currentTab,
  onChangeTab,
  theme,
  onToggleTheme,
  language,
  onToggleLanguage,
}: SidebarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const t = translations[language];

  const menuItems = [
    { id: 'home' as AppTab, label: t.navHome, icon: Home },
    { id: 'passport' as AppTab, label: t.navPassport, icon: User },
    { id: 'documents' as AppTab, label: t.navDocuments, icon: FileText },
    { id: 'blog' as AppTab, label: (t as any).navBlog || 'Blog & Guides', icon: BookOpen },
    { id: 'help' as AppTab, label: t.navHelp, icon: HelpCircle },
    { id: 'about' as AppTab, label: t.navAbout, icon: Info },
    { id: 'legal' as AppTab, label: t.navLegal, icon: Shield },
    { id: 'contact' as AppTab, label: t.navContact, icon: Mail },
    { id: 'sitemap' as AppTab, label: (t as any).navSitemap || 'Sitemap', icon: Map },
  ];

  const handleMenuClick = (tabId: AppTab) => {
    onChangeTab(tabId);
    setIsOpen(false);
  };

  return (
    <>
      {/* Mobile Top Bar */}
      <div className={`lg:hidden flex items-center justify-between px-4 py-3 border-b shrink-0 ${
        theme === 'dark' 
          ? 'bg-slate-900/90 border-slate-800 text-white' 
          : 'bg-white border-slate-200 text-slate-900'
      } sticky top-0 z-50 backdrop-blur-md`}>
        <div className="flex items-center gap-2.5">
          <SnapIdLogo size="sm" theme={theme} />
        </div>

        <div className="flex items-center gap-2">
          {/* Quick Language Toggle - Icon only for mobile friendliness */}
          <button
            onClick={onToggleLanguage}
            className={`flex items-center justify-center p-1.5 rounded-lg transition-all duration-300 cursor-pointer ${
              theme === 'dark'
                ? 'bg-slate-800/80 hover:bg-slate-750 text-slate-200'
                : 'bg-slate-100 hover:bg-slate-200/80 text-slate-700'
            }`}
            title={language === 'en' ? 'हिन्दी में बदलें' : 'Switch to English'}
          >
            <Languages className="w-4 h-4 text-blue-500 shrink-0" />
          </button>

          {/* Quick Theme Toggle */}
          <button
            onClick={onToggleTheme}
            className={`flex items-center justify-center p-1.5 rounded-lg transition-all duration-300 cursor-pointer ${
              theme === 'dark'
                ? 'bg-slate-800/80 hover:bg-slate-750 text-slate-200'
                : 'bg-slate-100 hover:bg-slate-200/80 text-slate-700'
            }`}
            title={theme === 'dark' ? 'Switch to White Mode' : 'Switch to Dark Mode'}
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-500 shrink-0" />
            ) : (
              <Moon className="w-4 h-4 text-indigo-500 shrink-0" />
            )}
          </button>

          {/* Hamburger Menu Button */}
          <button 
            onClick={() => setIsOpen(!isOpen)}
            className={`p-1.5 rounded-lg border ${
              theme === 'dark' 
                ? 'border-slate-800 hover:bg-slate-850 text-slate-200' 
                : 'border-slate-200 hover:bg-slate-100 text-slate-700'
            } transition-colors`}
            aria-label="Toggle Menu"
          >
            {isOpen ? <X className="w-5.5 h-5.5" /> : <Menu className="w-5.5 h-5.5" />}
          </button>
        </div>
      </div>

      {/* Backdrop for mobile drawers */}
      {isOpen && (
        <div 
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-xs" 
        />
      )}

      {/* Main Sidebar (Drawer on mobile, stationary on desktop) */}
      <aside className={`fixed top-0 bottom-0 left-0 z-40 w-[280px] border-r transition-transform duration-300 lg:translate-x-0 ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      } ${
        theme === 'dark' 
          ? 'bg-slate-950 border-slate-900 text-slate-350' 
          : 'bg-white border-slate-250 text-slate-600'
      } flex flex-col h-full lg:sticky pb-6`}>
        
        {/* Header containing vector logo */}
        <div className="h-[73px] flex items-center px-6 bg-slate-900/5 select-none shrink-0">
          <SnapIdLogo size="md" theme={theme} />
        </div>

        {/* Navigation Items list */}
        <nav className="flex-1 px-4 py-6 overflow-y-auto space-y-1">
          {menuItems.map((item) => {
            const IconComponent = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleMenuClick(item.id)}
                className={`w-full flex items-center gap-3.5 px-4.5 py-3 rounded-lg text-[14px] font-medium transition-all ${
                  isActive
                    ? theme === 'dark'
                      ? 'bg-blue-600/10 border-l-4 border-blue-500 text-white font-semibold'
                      : 'bg-blue-550/10 border-l-4 border-blue-600 text-blue-700 font-semibold'
                    : theme === 'dark'
                      ? 'hover:bg-slate-900 text-slate-400 hover:text-white border-l-4 border-transparent'
                      : 'hover:bg-slate-50 text-slate-600 hover:text-slate-900 border-l-4 border-transparent'
                }`}
              >
                <IconComponent className={`w-5 h-5 shrink-0 transition-colors ${
                  isActive 
                    ? theme === 'dark' ? 'text-blue-400' : 'text-blue-600'
                    : ''
                }`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>


      </aside>
    </>
  );
}
