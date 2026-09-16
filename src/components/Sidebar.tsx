import React, { useState } from 'react';
import { 
  Home, 
  User, 
  FileText, 
  Sliders,
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
  Map,
  MessageSquareHeart,
  ChevronLeft,
  ChevronRight,
  Crown
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
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

function Sidebar({
  currentTab,
  onChangeTab,
  theme,
  onToggleTheme,
  language,
  onToggleLanguage,
  isCollapsed,
  onToggleCollapse,
}: SidebarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const t = translations[language];

  const menuItems = [
    { id: 'home' as AppTab, label: t.navHome, tooltipText: 'Home', icon: Home },
    { id: 'passport' as AppTab, label: t.navPassport, tooltipText: 'Passport Size', icon: User, badge: 'Popular' },
    { id: 'documents' as AppTab, label: t.navDocuments, tooltipText: 'Documents', icon: FileText },
    { id: 'resizer' as AppTab, label: (t as any).navResizer || 'Photo Resizer', tooltipText: 'Photo Resizer', icon: Sliders },
    { id: 'blog' as AppTab, label: (t as any).navBlog || 'Blog & Guides', tooltipText: 'Blog & Guides', icon: BookOpen },
    { id: 'help' as AppTab, label: t.navHelp, tooltipText: 'Help & FAQ', icon: HelpCircle },
    { id: 'about' as AppTab, label: t.navAbout, tooltipText: 'About', icon: Info },
    { id: 'legal' as AppTab, label: t.navLegal, tooltipText: 'Legal', icon: Shield },
    { id: 'contact' as AppTab, label: t.navContact, tooltipText: 'Contact Us', icon: Mail },
    { id: 'sitemap' as AppTab, label: (t as any).navSitemap || 'Sitemap', tooltipText: 'Sitemap', icon: Map },
    { id: 'feedback' as AppTab, label: (t as any).navFeedback || 'User Feedback', tooltipText: 'User Feedback', icon: MessageSquareHeart },
  ];

  const handleMenuClick = (tabId: AppTab) => {
    onChangeTab(tabId);
    setIsOpen(false);
  };

  const isDark = theme === 'dark';

  return (
    <>
      {/* Mobile Top Bar */}
      <div className={`lg:hidden flex items-center justify-between px-4 py-3 border-b shrink-0 ${
        isDark 
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
            className={`flex items-center justify-center p-1.5 rounded-lg cursor-pointer ${
              isDark
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
            className={`flex items-center justify-center p-1.5 rounded-lg cursor-pointer ${
              isDark
                ? 'bg-slate-800/80 hover:bg-slate-750 text-slate-200'
                : 'bg-slate-100 hover:bg-slate-200/80 text-slate-700'
            }`}
            title={isDark ? 'Switch to White Mode' : 'Switch to Dark Mode'}
          >
            {isDark ? (
              <Sun className="w-4 h-4 text-amber-500 shrink-0" />
            ) : (
              <Moon className="w-4 h-4 text-indigo-500 shrink-0" />
            )}
          </button>

          {/* Hamburger Menu Button */}
          <button 
            onClick={() => setIsOpen(!isOpen)}
            className={`p-1.5 rounded-lg border ${
              isDark 
                ? 'border-slate-800 hover:bg-slate-850 text-slate-200' 
                : 'border-slate-200 hover:bg-slate-100 text-slate-700'
            }`}
            aria-label="Toggle Menu"
          >
            {isOpen ? <X className="w-5.5 h-5.5" /> : <Menu className="w-5.5 h-5.5" />}
          </button>
        </div>
      </div>

      {/* Backdrop for mobile drawers */}
      <div 
        onClick={() => setIsOpen(false)}
        className={`fixed inset-0 bg-black/60 z-40 lg:hidden transition-opacity duration-200 ${
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`} 
      />

      {/* Main Sidebar (Drawer on mobile, stationary on desktop with dynamic collapsible width) */}
      <aside className={`fixed top-0 bottom-0 left-0 z-40 border-r ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      } lg:translate-x-0 w-[280px] max-w-[85vw] ${
        isCollapsed ? 'lg:w-[76px]' : 'lg:w-[270px]'
      } ${
        isDark 
          ? 'bg-slate-950 border-slate-900 text-slate-350' 
          : 'bg-white border-slate-250 text-slate-600'
      } flex flex-col h-full lg:sticky pb-4 select-none shrink-0 transition-transform duration-200 ease-out will-change-transform lg:transition-none`}>
        
        {/* Header containing single SnapID Studio logo and Collapse/Close Button */}
        <div className={`h-[73px] flex items-center ${
          isCollapsed ? 'lg:justify-center lg:px-2 justify-between px-4' : 'justify-between px-5'
        } select-none shrink-0 relative border-b ${
          isDark ? 'border-slate-800/80 bg-slate-900/40' : 'border-slate-200/80 bg-slate-50/50'
        }`}>
          {/* Mobile drawer header: single logo + close (X) button */}
          <div className="flex lg:hidden items-center justify-between w-full">
            <SnapIdLogo size="md" theme={theme} />
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className={`p-1.5 rounded-lg border cursor-pointer ${
                isDark 
                  ? 'border-slate-800 hover:bg-slate-800 text-slate-400 hover:text-white' 
                  : 'border-slate-200 hover:bg-slate-100 text-slate-600 hover:text-slate-900'
              }`}
              aria-label="Close Sidebar"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Desktop Single Logo Header (Expanded or Collapsed) */}
          <div className="hidden lg:flex items-center w-full">
            {isCollapsed ? (
              /* Collapsed State: Single Compact Logo icon (Click to Expand Sidebar) */
              <div className="relative group/logo mx-auto">
                <button
                  type="button"
                  onClick={onToggleCollapse}
                  className="flex items-center justify-center p-1.5 rounded-xl hover:bg-blue-500/15 cursor-pointer transform active:scale-95 focus:outline-none transition-transform"
                  title="Open Sidebar"
                  aria-label="Open Sidebar"
                >
                  <SnapIdLogo size="sm" iconOnly={true} theme={theme} />
                </button>

                {/* Tooltip on Hover: "Open Sidebar" */}
                <div className="hidden group-hover/logo:flex absolute left-full ml-3.5 top-1/2 -translate-y-1/2 z-50 pointer-events-none items-center">
                  <div className="w-1.5 h-1.5 bg-slate-900 border-l border-t border-blue-500/40 transform -rotate-45 -mr-1 z-10" />
                  <div className="px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap bg-slate-900/95 text-white border border-blue-500/35 shadow-[0_0_18px_rgba(59,130,246,0.35)] backdrop-blur-md">
                    Open Sidebar
                  </div>
                </div>
              </div>
            ) : (
              /* Expanded State: Single Full SnapID Logo + Small Collapse Button */
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center overflow-hidden">
                  <SnapIdLogo size="md" theme={theme} />
                </div>

                {/* Small Collapse/Close Icon: ‹ (ChevronLeft) */}
                <div className="relative group/close">
                  <button
                    type="button"
                    onClick={onToggleCollapse}
                    className={`flex items-center justify-center w-7 h-7 rounded-lg border cursor-pointer shadow-xs transition-colors ${
                      isDark
                        ? 'border-blue-500/30 bg-blue-500/10 hover:bg-blue-500/25 text-blue-400 hover:text-blue-200 shadow-[0_0_10px_rgba(59,130,246,0.15)]'
                        : 'border-slate-300 bg-slate-100 hover:bg-blue-50 hover:border-blue-400 text-slate-700 hover:text-blue-600'
                    }`}
                    title="Close Sidebar"
                    aria-label="Close Sidebar"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>

                  {/* Tooltip on Hover: "Close Sidebar" */}
                  <div className="hidden group-hover/close:flex absolute right-0 top-full mt-2 z-50 pointer-events-none items-center">
                    <div className="px-2.5 py-1 rounded-md text-[11px] font-semibold whitespace-nowrap bg-slate-900/95 text-white border border-blue-500/35 shadow-[0_0_15px_rgba(59,130,246,0.35)] backdrop-blur-md">
                      Close Sidebar
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Navigation Items list */}
        <nav className={`flex-1 ${isCollapsed ? 'px-2' : 'px-3.5'} py-4 overflow-y-auto overflow-x-hidden space-y-1.5`}>
          {menuItems.map((item) => {
            const IconComponent = item.icon;
            const isActive = currentTab === item.id;
            const tooltipLabel = language === 'hi' ? item.label : item.tooltipText;

            return (
              <div key={item.id} className="relative group">
                <button
                  onClick={() => handleMenuClick(item.id)}
                  title={isCollapsed ? tooltipLabel : undefined}
                  aria-label={item.tooltipText}
                  className={`w-full flex items-center ${
                    isCollapsed ? 'justify-center w-11 h-11 mx-auto p-0' : 'justify-start px-3.5 py-2.5 gap-3'
                  } rounded-xl text-[13.5px] font-medium cursor-pointer ${
                    isActive
                      ? 'bg-blue-600 text-white font-semibold shadow-[0_0_20px_rgba(37,99,235,0.45)]'
                      : isDark
                        ? 'hover:bg-slate-900/80 text-slate-350 hover:text-white'
                        : 'hover:bg-slate-100/80 text-slate-700 hover:text-slate-900'
                  }`}
                >
                  <IconComponent className={`w-5 h-5 shrink-0 ${
                    isActive 
                      ? 'text-white' 
                      : isDark ? 'text-slate-400 group-hover:text-slate-200' : 'text-slate-500 group-hover:text-slate-800'
                  }`} />
                  
                  {/* Label hidden when collapsed */}
                  {!isCollapsed && (
                    <span className="truncate flex-1 text-left">{item.label}</span>
                  )}

                  {/* Popular pill badge */}
                  {!isCollapsed && (item as any).badge && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/25 text-blue-300 border border-blue-400/30">
                      {(item as any).badge}
                    </span>
                  )}
                </button>

                {/* Collapsed Sidebar Clean Tooltip */}
                {isCollapsed && (
                  <div className="hidden lg:group-hover:flex absolute left-full ml-3.5 top-1/2 -translate-y-1/2 z-50 pointer-events-none items-center">
                    <div className="w-1.5 h-1.5 bg-slate-900 border-l border-t border-blue-500/40 transform -rotate-45 -mr-1 z-10" />
                    <div className="px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap bg-slate-900/95 text-white border border-blue-500/35 shadow-[0_0_18px_rgba(59,130,246,0.35)] backdrop-blur-md flex items-center gap-1.5">
                      <span>{tooltipLabel}</span>
                      {(item as any).badge && (
                        <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-blue-500/30 text-blue-300">
                          {(item as any).badge}
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* Bottom Sidebar Promotional Card: "Made for Cyber Cafe & eMitra - Fast • Private • Easy" */}
        <div className={`shrink-0 ${isCollapsed ? 'px-2' : 'px-3.5'} pt-2 space-y-3`}>
          {!isCollapsed ? (
            <div className={`p-4 rounded-2xl border relative overflow-hidden ${
              isDark 
                ? 'bg-gradient-to-br from-[#0c183a] via-[#091129] to-[#0d1633] border-blue-500/25 text-slate-300 shadow-md' 
                : 'bg-gradient-to-br from-blue-50/70 via-white to-slate-50 border-slate-200 text-slate-700 shadow-xs'
            }`}>
              {/* Background ambient glow */}
              <div className="absolute -right-6 -top-6 w-24 h-24 bg-blue-500/15 rounded-full blur-xl pointer-events-none" />
              
              <div className="flex items-center gap-2.5 mb-2 relative z-10">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-600 via-indigo-600 to-blue-600 flex items-center justify-center text-amber-300 shadow-sm shrink-0">
                  <Crown className="w-4 h-4 fill-amber-300 text-amber-200" />
                </div>
                <div className="min-w-0">
                  <div className={`text-[10px] font-medium leading-none ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Made for</div>
                  <div className={`text-xs font-black tracking-wide font-display mt-0.5 truncate ${
                    isDark ? 'text-white' : 'text-slate-900'
                  }`}>
                    Cyber Cafe &amp; eMitra
                  </div>
                </div>
              </div>
              <p className={`text-[11px] font-medium tracking-wide ${
                isDark ? 'text-cyan-400/90' : 'text-blue-600 font-semibold'
              }`}>
                Fast • Private • Easy
              </p>

              {/* Smooth blue wave line accent */}
              <div className="mt-2 pt-1.5 border-t border-blue-500/10 flex items-center justify-between text-[10px] font-mono text-slate-400">
                <span className="text-emerald-400 flex items-center gap-1 font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  100% In-Browser
                </span>
                <span className="text-blue-400 font-semibold">300 DPI</span>
              </div>
            </div>
          ) : (
            /* Collapsed view of promotional card: compact icon badge with tooltip */
            <div className="relative group flex justify-center">
              <div className="w-10 h-10 rounded-xl border border-blue-500/30 bg-gradient-to-br from-purple-900/50 to-blue-900/50 flex items-center justify-center text-amber-300 shadow-sm cursor-default">
                <Crown className="w-4 h-4 fill-amber-300 text-amber-200" />
              </div>

              {/* Tooltip for collapsed badge */}
              <div className="hidden lg:group-hover:flex absolute left-full ml-3.5 top-1/2 -translate-y-1/2 z-50 pointer-events-none items-center">
                <div className="px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap bg-slate-900/95 text-white border border-blue-500/35 shadow-[0_0_18px_rgba(59,130,246,0.35)] backdrop-blur-md">
                  Made for Cyber Cafe &amp; eMitra • Fast • Private • Easy
                </div>
              </div>
            </div>
          )}

          {/* Copyright text at bottom of sidebar */}
          {!isCollapsed ? (
            <div className="px-2 pt-1 text-[10px] text-slate-500 text-left leading-tight">
              <div>© 2026 SnapID Studio</div>
              <div>All Rights Reserved.</div>
            </div>
          ) : (
            <div className="text-center text-[9px] font-mono text-slate-600">
              ©26
            </div>
          )}
        </div>

      </aside>
    </>
  );
}

export default React.memo(Sidebar);
