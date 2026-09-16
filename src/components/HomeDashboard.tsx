import React from 'react';
import { 
  User, 
  FileText, 
  Sliders, 
  Sparkles, 
  ArrowRight,
  ShieldCheck, 
  TrendingUp,
  Clock,
  Smile,
  Shield,
  Sun
} from 'lucide-react';
import { AppTab, AppTheme, AppLanguage } from '../types';
import { translations } from '../translations';

interface HomeDashboardProps {
  onSelectTab: (tab: AppTab) => void;
  language: AppLanguage;
  theme: AppTheme;
}

// Reusable Realistic Gentleman Portrait Vector matching the 2nd Reference Image
export function PortraitVector({ className = "w-full h-full" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 120 145" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="studio_bg" x1="60" y1="0" x2="60" y2="145" gradientUnits="userSpaceOnUse">
          <stop stopColor="#3b82f6" />
          <stop offset="0.5" stopColor="#2563eb" />
          <stop offset="1" stopColor="#1d4ed8" />
        </linearGradient>
        <radialGradient id="face_grad" cx="60" cy="52" r="32" gradientUnits="userSpaceOnUse">
          <stop stopColor="#fde047" stopOpacity="0.4" />
          <stop offset="0.4" stopColor="#f59e0b" stopOpacity="0.1" />
          <stop offset="1" stopColor="#000000" stopOpacity="0.2" />
        </radialGradient>
        <linearGradient id="skin_grad" x1="60" y1="28" x2="60" y2="82" gradientUnits="userSpaceOnUse">
          <stop stopColor="#ffdfba" />
          <stop offset="0.8" stopColor="#f6c29b" />
          <stop offset="1" stopColor="#e3a77d" />
        </linearGradient>
        <linearGradient id="suit_grad" x1="60" y1="88" x2="60" y2="145" gradientUnits="userSpaceOnUse">
          <stop stopColor="#1e293b" />
          <stop offset="0.5" stopColor="#0f172a" />
          <stop offset="1" stopColor="#020617" />
        </linearGradient>
        <linearGradient id="hair_grad" x1="60" y1="14" x2="60" y2="50" gradientUnits="userSpaceOnUse">
          <stop stopColor="#292524" />
          <stop offset="0.6" stopColor="#1c1917" />
          <stop offset="1" stopColor="#0c0a09" />
        </linearGradient>
      </defs>

      {/* Classic Studio Royal Blue Backdrop */}
      <rect width="120" height="145" fill="url(#studio_bg)" />
      
      {/* Studio Radial Lighting Behind Head */}
      <circle cx="60" cy="55" r="45" fill="#60a5fa" fillOpacity="0.25" />

      {/* Shoulders / Navy Suit Jacket */}
      <path d="M12 145 L18 100 Q36 90 60 92 Q84 90 102 100 L108 145 Z" fill="url(#suit_grad)" />
      
      {/* Suit Lapels & Shoulders Shading */}
      <path d="M28 145 L36 102 L48 108 L34 145 Z" fill="#0f172a" />
      <path d="M92 145 L84 102 L72 108 L86 145 Z" fill="#0f172a" />
      
      {/* White Collared Shirt V-neck */}
      <polygon points="46,92 74,92 68,145 52,145" fill="#f8fafc" />
      <polygon points="46,92 56,108 52,94" fill="#cbd5e1" />
      <polygon points="74,92 64,108 68,94" fill="#cbd5e1" />

      {/* Royal Blue Necktie */}
      <polygon points="56,104 64,104 66,145 54,145" fill="#2563eb" />
      <polygon points="57,100 63,100 65,106 55,106" fill="#1d4ed8" />

      {/* Neck */}
      <rect x="52" y="70" width="16" height="24" rx="4" fill="url(#skin_grad)" />
      <path d="M52 82 Q60 88 68 82 L68 92 L52 92 Z" fill="#d97706" fillOpacity="0.15" />

      {/* Head / Face Oval */}
      <ellipse cx="60" cy="55" rx="22" ry="26" fill="url(#skin_grad)" />
      <ellipse cx="60" cy="55" rx="22" ry="26" fill="url(#face_grad)" />

      {/* Ears */}
      <ellipse cx="37" cy="56" rx="3.5" ry="6.5" fill="#f6c29b" />
      <ellipse cx="83" cy="56" rx="3.5" ry="6.5" fill="#f6c29b" />

      {/* Professional Dark Hair Styled to Side */}
      <path d="M36 48 C34 32, 45 18, 62 18 C78 18, 86 28, 84 46 C81 40, 75 36, 68 36 C56 36, 44 42, 36 48 Z" fill="url(#hair_grad)" />
      <path d="M36 46 C38 40, 42 36, 48 35 C58 34, 70 32, 80 40 C75 30, 64 24, 52 25 C42 26, 37 36, 36 46 Z" fill="#44403c" />

      {/* Eyebrows */}
      <path d="M46 45 Q52 43 56 46" stroke="#292524" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M64 46 Q68 43 74 45" stroke="#292524" strokeWidth="2.2" strokeLinecap="round" />

      {/* Eyes */}
      <ellipse cx="51" cy="52" rx="3.2" ry="2.2" fill="#1e293b" />
      <ellipse cx="69" cy="52" rx="3.2" ry="2.2" fill="#1e293b" />
      <circle cx="50.2" cy="51.2" r="0.9" fill="#ffffff" />
      <circle cx="68.2" cy="51.2" r="0.9" fill="#ffffff" />

      {/* Nose */}
      <path d="M60 50 L58.5 61 L62 61" stroke="#d97706" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />

      {/* Friendly Confident Smile */}
      <path d="M53 68 Q60 73 67 68" stroke="#b45309" strokeWidth="1.8" strokeLinecap="round" fill="none" />
      <path d="M55 68.5 Q60 71 65 68.5" fill="#ffffff" />
    </svg>
  );
}

export default function HomeDashboard({
  onSelectTab,
  language,
  theme
}: HomeDashboardProps) {
  const isDark = theme === 'dark';

  const scrollToPopularTools = () => {
    const el = document.getElementById('popular-tools-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="space-y-4 lg:space-y-5 pb-3">
      {/* 2-Column Responsive Layout: Left Main Area (~72%) + Right Quick Panels (~28%) */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 lg:gap-5 items-start">
        
        {/* ========================================================= */}
        {/* LEFT COLUMN: Compact Hero + Popular Tools + Banner + Badges */}
        {/* ========================================================= */}
        <div className="xl:col-span-8 space-y-4 sm:space-y-4.5">
          
          {/* 1. HERO BANNER - Compact, Balanced Height (Matches 2nd Image) */}
          <div className={`rounded-2xl border relative overflow-hidden p-4 sm:p-5 lg:p-5.5 ${
            isDark 
              ? 'bg-gradient-to-br from-[#0c1c42] via-[#091530] to-[#050b1a] border-blue-500/25 shadow-[0_4px_25px_rgba(0,0,0,0.6)]' 
              : 'bg-gradient-to-br from-blue-50/90 via-white to-indigo-50/70 border-blue-200 shadow-xs'
          }`}>
            {/* Luminous Neon Ambient Glows */}
            <div className={`absolute -right-8 -top-8 w-64 h-64 rounded-full pointer-events-none ${
              isDark ? 'bg-blue-500/20 blur-2xl' : 'bg-blue-300/20 blur-xl'
            }`} />
            <div className={`absolute right-1/4 -bottom-10 w-56 h-56 rounded-full pointer-events-none ${
              isDark ? 'bg-cyan-500/15 blur-2xl' : 'bg-cyan-300/15 blur-xl'
            }`} />
            <div className={`absolute -left-10 bottom-0 w-48 h-48 rounded-full pointer-events-none ${
              isDark ? 'bg-blue-600/10 blur-2xl' : 'bg-blue-400/10 blur-xl'
            }`} />

            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-4 lg:gap-6">
              
              {/* Left Side: Hero Text & Call to Action */}
              <div className="w-full md:max-w-[340px] lg:max-w-[380px] space-y-3.5 text-left shrink-0">
                
                {/* AI Powered Pill Badge */}
                <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border backdrop-blur-md ${
                  isDark
                    ? 'border-blue-400/30 bg-blue-500/15 text-blue-200'
                    : 'border-blue-300 bg-blue-100/80 text-blue-800 shadow-2xs'
                }`}>
                  <Sparkles className={`w-3.5 h-3.5 shrink-0 ${isDark ? 'text-cyan-400' : 'text-blue-600'}`} />
                  <span className="text-[11px] font-bold tracking-wide">
                    AI Powered
                  </span>
                </div>

                {/* Main Heading */}
                <h1 className="text-2xl sm:text-3xl lg:text-[34px] font-black font-display tracking-tight leading-[1.12]">
                  <span className={isDark ? 'text-white' : 'text-slate-900'}>
                    Your All-in-One
                  </span>
                  <br />
                  <span className={
                    isDark 
                      ? 'bg-gradient-to-r from-cyan-400 via-sky-400 to-blue-400 bg-clip-text text-transparent' 
                      : 'bg-gradient-to-r from-blue-600 via-sky-600 to-cyan-600 bg-clip-text text-transparent'
                  }>
                    Photo &amp; Document
                  </span>
                  <br />
                  <span className={isDark ? 'text-white' : 'text-slate-900'}>
                    Solution
                  </span>
                </h1>

                {/* Subtitle */}
                <p className={`text-xs sm:text-[12.5px] leading-relaxed max-w-sm ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                  Passport Photos, Document Tools, Photo Resize and more — all in one place. Fast, easy and secure.
                </p>

                {/* Explore Tools Button */}
                <div className="pt-0.5">
                  <button
                    onClick={scrollToPopularTools}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full font-bold text-xs sm:text-sm text-white bg-blue-600 hover:bg-blue-500 shadow-[0_0_20px_rgba(37,99,235,0.6)] hover:shadow-[0_0_25px_rgba(37,99,235,0.8)] cursor-pointer transform active:scale-95 group"
                  >
                    <span>Explore Tools</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>

              </div>

              {/* Right Side: Futuristic Robot Mascot + Floating Passport Elements Graphic (Matching Image 2) */}
              <div className="relative w-full max-w-[320px] sm:max-w-[360px] h-[190px] sm:h-[215px] flex items-center justify-center select-none shrink-0">
                
                {/* Luminous Cyan Orbital Energy Loop */}
                <div className="absolute inset-2 sm:inset-3 rounded-full border-2 border-cyan-400/40 shadow-[0_0_25px_rgba(6,182,212,0.4)] pointer-events-none transform -rotate-12" />
                
                {/* Floating Handwritten Callout: "Make Your Photos Perfect!" with cyan arrow */}
                <div className="absolute -top-1 right-2 sm:right-4 z-20 pointer-events-none flex flex-col items-end">
                  <span className="text-[10.5px] sm:text-xs font-cursive text-cyan-200 tracking-wide rotate-[5deg] drop-shadow-[0_2px_8px_rgba(6,182,212,0.7)] font-bold whitespace-nowrap">
                    Make<br />Your Photos<br />Perfect!
                  </span>
                  <svg className="w-7 h-7 text-cyan-300 rotate-12 -mr-1 -mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 6 C 14 10, 10 16, 6 18" />
                    <path d="M6 18 L 10 18" />
                    <path d="M6 18 L 8 14" />
                  </svg>
                </div>

                {/* Floating Navy Passport Booklet */}
                <div className="absolute top-2 sm:top-4 left-0 sm:left-2 z-15 w-16 sm:w-19 h-22 sm:h-26 rounded-lg bg-gradient-to-br from-[#081738] to-[#030919] border border-blue-400/50 p-1.5 shadow-[0_8px_20px_rgba(0,0,0,0.7)] transform -rotate-12 hover:rotate-0 transition-transform">
                  <div className="w-full h-full border border-amber-400/40 rounded p-1 flex flex-col items-center justify-between text-center">
                    <div className="w-5 h-5 rounded-full border border-amber-300/50 flex items-center justify-center mt-0.5">
                      <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                    </div>
                    <span className="text-[6.5px] sm:text-[7.5px] font-mono tracking-widest font-extrabold text-amber-300">
                      PASSPORT
                    </span>
                    <div className="w-3.5 h-1.5 rounded-xs border border-amber-300/40 mb-0.5" />
                  </div>
                </div>

                {/* Floating Smart ID Document Card */}
                <div className="absolute bottom-1 sm:bottom-2 left-4 sm:left-8 z-16 w-22 sm:w-26 h-18 sm:h-21 rounded-lg bg-[#07132e] border border-cyan-400/50 p-1.5 shadow-[0_8px_20px_rgba(0,0,0,0.7)] transform rotate-6">
                  <div className="flex gap-1.5 items-start">
                    <div className="w-6 h-8 rounded bg-blue-600/30 border border-blue-400/40 overflow-hidden shrink-0">
                      <PortraitVector className="w-full h-full" />
                    </div>
                    <div className="flex-1 space-y-1 pt-0.5">
                      <div className="w-10 h-1.5 rounded-full bg-blue-500/50" />
                      <div className="w-7 h-1 rounded-full bg-slate-400/40" />
                      <div className="w-9 h-1 rounded-full bg-slate-400/30" />
                    </div>
                  </div>
                  <div className="mt-1.5 pt-1 border-t border-slate-700 flex justify-between items-center text-[6.5px] font-mono text-cyan-400 font-bold">
                    <span>300 DPI</span>
                    <span>VERIFIED</span>
                  </div>
                </div>

                {/* Floating Fanned Passport Photo Print of Gentleman */}
                <div className="absolute top-2 sm:top-3 left-16 sm:left-20 z-17 w-14 sm:w-16 h-18 sm:h-21 rounded-md bg-white p-0.5 shadow-[0_8px_25px_rgba(0,0,0,0.7)] transform rotate-12 overflow-hidden border border-slate-300">
                  <PortraitVector className="w-full h-full rounded-xs" />
                </div>

                {/* 3D Cute AI Robot Mascot (Matching Image 2) */}
                <div className="relative z-10 ml-16 sm:ml-20">
                  <svg className={`w-36 h-36 sm:w-42 sm:h-42 ${isDark ? 'drop-shadow-[0_8px_24px_rgba(59,130,246,0.6)]' : 'drop-shadow-[0_4px_16px_rgba(59,130,246,0.3)]'}`} viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
                    {/* Head / Helmet */}
                    <rect x="55" y="45" width="90" height="75" rx="36" fill="url(#hero_robot_white)" stroke="#93c5fd" strokeWidth="2.5" />
                    
                    {/* Glossy Visor Area */}
                    <rect x="65" y="58" width="70" height="42" rx="18" fill="#040b1e" stroke="#38bdf8" strokeWidth="2" />
                    
                    {/* Specular Visor Highlight */}
                    <path d="M72 64 Q 100 61 128 64 Q 120 70 76 70 Z" fill="white" fillOpacity="0.3" />
                    
                    {/* Luminous Glowing Cyan Oval Eyes */}
                    <ellipse cx="85" cy="79" rx="8" ry="7" fill="#38bdf8" filter="url(#hero_glow_eyes)" />
                    <ellipse cx="85" cy="79" rx="4" ry="4" fill="#ffffff" />
                    <ellipse cx="115" cy="79" rx="8" ry="7" fill="#38bdf8" filter="url(#hero_glow_eyes)" />
                    <ellipse cx="115" cy="79" rx="4" ry="4" fill="#ffffff" />

                    {/* Cute smiling mouth */}
                    <path d="M94 88 Q 100 92 106 88" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" />

                    {/* Headphone Audio Pods (Left & Right) */}
                    <circle cx="50" cy="80" r="11" fill="#1d4ed8" stroke="#60a5fa" strokeWidth="2" />
                    <circle cx="50" cy="80" r="5" fill="#38bdf8" />
                    <circle cx="150" cy="80" r="11" fill="#1d4ed8" stroke="#60a5fa" strokeWidth="2" />
                    <circle cx="150" cy="80" r="5" fill="#38bdf8" />

                    {/* Antenna with glowing beacon */}
                    <path d="M100 45 L 100 32" stroke="#60a5fa" strokeWidth="3" strokeLinecap="round" />
                    <circle cx="100" cy="28" r="6" fill="#38bdf8" filter="url(#hero_glow_eyes)" />
                    <circle cx="100" cy="28" r="3" fill="#ffffff" />

                    {/* Robot Torso / Chassis */}
                    <path d="M70 125 C 70 120, 130 120, 130 125 L 138 175 C 138 185, 62 185, 62 175 Z" fill="url(#hero_robot_white)" stroke="#93c5fd" strokeWidth="2.5" />
                    
                    {/* Chest Glowing Core */}
                    <rect x="85" y="136" width="30" height="26" rx="8" fill="#040b1e" stroke="#38bdf8" strokeWidth="1.5" />
                    <circle cx="100" cy="149" r="7" fill="#1d4ed8" />
                    <circle cx="100" cy="149" r="3.5" fill="#38bdf8" filter="url(#hero_glow_eyes)" />

                    {/* Left Gesturing Arm */}
                    <path d="M62 136 Q 44 145 42 162" stroke="url(#hero_robot_white)" strokeWidth="12" strokeLinecap="round" />
                    <circle cx="42" cy="164" r="7" fill="#60a5fa" />

                    {/* Right Waving Arm */}
                    <path d="M138 136 Q 160 130 168 112" stroke="url(#hero_robot_white)" strokeWidth="12" strokeLinecap="round" />
                    <circle cx="170" cy="110" r="7" fill="#60a5fa" />

                    <defs>
                      <linearGradient id="hero_robot_white" x1="50" y1="30" x2="150" y2="180" gradientUnits="userSpaceOnUse">
                        <stop stopColor="#ffffff" />
                        <stop offset="0.6" stopColor="#e2e8f0" />
                        <stop offset="1" stopColor="#cbd5e1" />
                      </linearGradient>
                      <filter id="hero_glow_eyes" x="70" y="65" width="60" height="35" filterUnits="userSpaceOnUse">
                        <feGaussianBlur stdDeviation="1.5" result="blur" />
                        <feComposite in="SourceGraphic" in2="blur" operator="over" />
                      </filter>
                    </defs>
                  </svg>
                </div>

              </div>

            </div>
          </div>


          {/* 2. POPULAR TOOLS SECTION (Immediately Visible, Exactly 4 Tools) */}
          <div id="popular-tools-section" className="space-y-3 pt-0.5">
            
            {/* Header: Title + View All */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className={`w-4 h-4 shrink-0 ${isDark ? 'text-cyan-400' : 'text-blue-600'}`} />
                <h2 className={`text-base sm:text-lg font-bold font-display tracking-tight ${
                  isDark ? 'text-white' : 'text-slate-900'
                }`}>
                  Popular Tools
                </h2>
              </div>
              
              <button 
                onClick={scrollToPopularTools}
                className={`text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer ${
                  isDark ? 'text-cyan-400 hover:text-cyan-300' : 'text-blue-600 hover:text-blue-700'
                }`}
              >
                <span>View All</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Exactly 4 Cards Grid matching 2nd image */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
              
              {/* Tool Card 1: Passport Size */}
              <div 
                onClick={() => onSelectTab('passport')}
                className={`rounded-2xl border p-3 flex flex-col justify-between group cursor-pointer relative overflow-hidden ${
                  isDark
                    ? 'bg-[#0a1532]/90 hover:bg-[#0e1d44] border-blue-500/20 hover:border-blue-400/50 shadow-md hover:shadow-[0_8px_25px_rgba(37,99,235,0.3)]'
                    : 'bg-white hover:bg-blue-50/50 border-slate-200 hover:border-blue-400 shadow-xs hover:shadow-md'
                }`}
              >
                {/* Top Preview Mockup Box with Gentleman Portrait and Crop Corners */}
                <div className={`w-full aspect-[4/3] rounded-xl border relative overflow-hidden flex items-center justify-center mb-2.5 ${
                  isDark 
                    ? 'bg-gradient-to-br from-[#0d1b3d] to-[#081126] border-blue-500/20' 
                    : 'bg-gradient-to-br from-blue-50 to-indigo-50/70 border-blue-200/80'
                }`}>
                  <div className="absolute inset-0 bg-radial from-blue-500/20 via-transparent to-transparent pointer-events-none" />
                  
                  {/* Framed Passport Photo with Realistic Portrait & White Margin */}
                  <div className="relative z-10 w-16 h-20 rounded-sm bg-white p-0.5 shadow-lg overflow-hidden border border-slate-200 flex items-center justify-center">
                    <PortraitVector className="w-full h-full rounded-2xs" />
                  </div>

                  {/* Corner Crop Frame Guides in Cyan / Blue */}
                  <div className={`absolute top-2.5 left-2.5 w-2.5 h-2.5 border-t-2 border-l-2 ${isDark ? 'border-cyan-400' : 'border-blue-600'}`} />
                  <div className={`absolute top-2.5 right-2.5 w-2.5 h-2.5 border-t-2 border-r-2 ${isDark ? 'border-cyan-400' : 'border-blue-600'}`} />
                  <div className={`absolute bottom-2.5 left-2.5 w-2.5 h-2.5 border-b-2 border-l-2 ${isDark ? 'border-cyan-400' : 'border-blue-600'}`} />
                  <div className={`absolute bottom-2.5 right-2.5 w-2.5 h-2.5 border-b-2 border-r-2 ${isDark ? 'border-cyan-400' : 'border-blue-600'}`} />
                </div>

                {/* Card Title, Subtitle, and Circle Arrow Action Button */}
                <div className="flex items-end justify-between gap-2 mt-auto">
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${isDark ? 'bg-cyan-400' : 'bg-blue-600'}`} />
                      <h3 className={`text-xs sm:text-[13px] font-bold font-display tracking-tight truncate ${
                        isDark ? 'text-white group-hover:text-cyan-300' : 'text-slate-900 group-hover:text-blue-600'
                      }`}>
                        Passport Size
                      </h3>
                    </div>
                    <p className={`text-[10.5px] mt-0.5 leading-snug line-clamp-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                      Create professional passport photos
                    </p>
                  </div>

                  <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 shadow-xs group-hover:scale-105 active:scale-95 ${
                    isDark 
                      ? 'bg-blue-600/30 group-hover:bg-blue-600 text-blue-300 group-hover:text-white' 
                      : 'bg-blue-100 group-hover:bg-blue-600 text-blue-600 group-hover:text-white'
                  }`}>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </div>
              </div>

              {/* Tool Card 2: Documents */}
              <div 
                onClick={() => onSelectTab('documents')}
                className={`rounded-2xl border p-3 flex flex-col justify-between group cursor-pointer relative overflow-hidden ${
                  isDark
                    ? 'bg-[#0a1532]/90 hover:bg-[#0e1d44] border-blue-500/20 hover:border-blue-400/50 shadow-md hover:shadow-[0_8px_25px_rgba(37,99,235,0.3)]'
                    : 'bg-white hover:bg-blue-50/50 border-slate-200 hover:border-blue-400 shadow-xs hover:shadow-md'
                }`}
              >
                {/* Top Preview Mockup Box with Aadhaar / Smart ID Card */}
                <div className={`w-full aspect-[4/3] rounded-xl border relative overflow-hidden flex items-center justify-center mb-2.5 ${
                  isDark 
                    ? 'bg-gradient-to-br from-[#0d1b3d] to-[#081126] border-blue-500/20' 
                    : 'bg-gradient-to-br from-emerald-50 to-blue-50/70 border-emerald-200/80'
                }`}>
                  <div className="absolute inset-0 bg-radial from-cyan-500/20 via-transparent to-transparent pointer-events-none" />
                  
                  {/* Smart ID / Aadhaar Document Card Mockup */}
                  <div className={`relative z-10 w-26 h-18 rounded-lg border p-1.5 shadow-md flex flex-col justify-between ${
                    isDark ? 'bg-slate-900 border-blue-400/40' : 'bg-white border-slate-300'
                  }`}>
                    {/* Top Security Tricolor Stripe */}
                    <div className="h-1.5 w-full rounded-xs bg-gradient-to-r from-orange-500 via-white to-green-600 opacity-90" />
                    
                    <div className="flex items-center gap-1.5 my-0.5">
                      <div className="w-6 h-8 rounded bg-blue-600/20 border border-blue-400/40 overflow-hidden shrink-0">
                        <PortraitVector className="w-full h-full" />
                      </div>
                      <div className="flex-1 space-y-1">
                        <div className="w-11 h-1.5 rounded-full bg-slate-400/60" />
                        <div className="w-7 h-1 rounded-full bg-slate-400/40" />
                        <div className="w-9 h-1 rounded-full bg-slate-400/30" />
                      </div>
                    </div>

                    {/* Bottom Barcode / UID Line */}
                    <div className="h-1 w-full rounded-xs bg-slate-400/40 flex gap-0.5 justify-between">
                      <div className="w-2 h-full bg-slate-600" />
                      <div className="w-4 h-full bg-slate-600" />
                      <div className="w-3 h-full bg-slate-600" />
                      <div className="w-2 h-full bg-slate-600" />
                    </div>
                  </div>
                </div>

                {/* Card Title, Subtitle, and Circle Arrow Action Button */}
                <div className="flex items-end justify-between gap-2 mt-auto">
                  <div className="min-w-0">
                    <h3 className={`text-xs sm:text-[13px] font-bold font-display tracking-tight truncate ${
                      isDark ? 'text-white group-hover:text-cyan-300' : 'text-slate-900 group-hover:text-blue-600'
                    }`}>
                      Documents
                    </h3>
                    <p className={`text-[10.5px] mt-0.5 leading-snug line-clamp-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                      Aadhaar, PAN, DL &amp; more
                    </p>
                  </div>

                  <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 shadow-xs group-hover:scale-105 active:scale-95 ${
                    isDark 
                      ? 'bg-blue-600/30 group-hover:bg-blue-600 text-blue-300 group-hover:text-white' 
                      : 'bg-blue-100 group-hover:bg-blue-600 text-blue-600 group-hover:text-white'
                  }`}>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </div>
              </div>

              {/* Tool Card 3: Photo Resizer */}
              <div 
                onClick={() => onSelectTab('resizer')}
                className={`rounded-2xl border p-3 flex flex-col justify-between group cursor-pointer relative overflow-hidden ${
                  isDark
                    ? 'bg-[#0a1532]/90 hover:bg-[#0e1d44] border-blue-500/20 hover:border-blue-400/50 shadow-md hover:shadow-[0_8px_25px_rgba(37,99,235,0.3)]'
                    : 'bg-white hover:bg-blue-50/50 border-slate-200 hover:border-blue-400 shadow-xs hover:shadow-md'
                }`}
              >
                {/* Top Preview Mockup Box with Crop Handles */}
                <div className={`w-full aspect-[4/3] rounded-xl border relative overflow-hidden flex items-center justify-center mb-2.5 ${
                  isDark 
                    ? 'bg-gradient-to-br from-[#0d1b3d] to-[#081126] border-blue-500/20' 
                    : 'bg-gradient-to-br from-amber-50 to-orange-50/70 border-amber-200/80'
                }`}>
                  <div className="absolute inset-0 bg-radial from-amber-500/20 via-transparent to-transparent pointer-events-none" />
                  
                  {/* Layered Resizing Frames Mockup */}
                  <div className="relative z-10 w-22 h-17 flex items-center justify-center">
                    {/* Background frame */}
                    <div className="absolute w-18 h-15 rounded-lg bg-blue-600/20 border border-blue-400/40 transform -translate-x-2 -translate-y-1" />
                    {/* Foreground frame with crop handles */}
                    <div className="relative z-10 w-19 h-14 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 border border-white/90 p-1.5 shadow-lg flex flex-col items-center justify-center">
                      <div className="w-7 h-7 rounded-full border border-white/50 flex items-center justify-center">
                        <Sliders className="w-3.5 h-3.5 text-white" />
                      </div>
                      <span className="text-[6.5px] font-mono text-cyan-200 font-bold mt-0.5">10–200 KB</span>
                    </div>

                    {/* 8 Resize Handles matching 2nd image */}
                    <div className="absolute -top-1 -left-1 w-2 h-2 rounded-xs bg-white shadow-xs" />
                    <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 rounded-xs bg-white shadow-xs" />
                    <div className="absolute -top-1 -right-1 w-2 h-2 rounded-xs bg-white shadow-xs" />
                    <div className="absolute top-1/2 -translate-y-1/2 -left-1 w-2 h-2 rounded-xs bg-white shadow-xs" />
                    <div className="absolute top-1/2 -translate-y-1/2 -right-1 w-2 h-2 rounded-xs bg-white shadow-xs" />
                    <div className="absolute -bottom-1 -left-1 w-2 h-2 rounded-xs bg-white shadow-xs" />
                    <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 rounded-xs bg-white shadow-xs" />
                    <div className="absolute -bottom-1 -right-1 w-2 h-2 rounded-xs bg-white shadow-xs" />
                  </div>
                </div>

                {/* Card Title, Subtitle, and Circle Arrow Action Button */}
                <div className="flex items-end justify-between gap-2 mt-auto">
                  <div className="min-w-0">
                    <h3 className={`text-xs sm:text-[13px] font-bold font-display tracking-tight truncate ${
                      isDark ? 'text-white group-hover:text-cyan-300' : 'text-slate-900 group-hover:text-blue-600'
                    }`}>
                      Photo Resizer
                    </h3>
                    <p className={`text-[10.5px] mt-0.5 leading-snug line-clamp-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                      Resize &amp; compress photos
                    </p>
                  </div>

                  <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 shadow-xs group-hover:scale-105 active:scale-95 ${
                    isDark 
                      ? 'bg-blue-600/30 group-hover:bg-blue-600 text-blue-300 group-hover:text-white' 
                      : 'bg-blue-100 group-hover:bg-blue-600 text-blue-600 group-hover:text-white'
                  }`}>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </div>
              </div>

              {/* Tool Card 4: Background Removal */}
              <div 
                onClick={() => onSelectTab('passport')}
                className={`rounded-2xl border p-3 flex flex-col justify-between group cursor-pointer relative overflow-hidden ${
                  isDark
                    ? 'bg-[#0a1532]/90 hover:bg-[#0e1d44] border-blue-500/20 hover:border-blue-400/50 shadow-md hover:shadow-[0_8px_25px_rgba(37,99,235,0.3)]'
                    : 'bg-white hover:bg-blue-50/50 border-slate-200 hover:border-blue-400 shadow-xs hover:shadow-md'
                }`}
              >
                {/* Top Preview Mockup Box with Split Portrait Cutout */}
                <div className={`w-full aspect-[4/3] rounded-xl border relative overflow-hidden flex items-center justify-center mb-2.5 ${
                  isDark 
                    ? 'bg-gradient-to-br from-[#0d1b3d] to-[#081126] border-blue-500/20' 
                    : 'bg-gradient-to-br from-purple-50 to-indigo-50/70 border-purple-200/80'
                }`}>
                  <div className="absolute inset-0 bg-radial from-purple-500/20 via-transparent to-transparent pointer-events-none" />
                  
                  {/* Portrait with Half Solid & Half Checkerboard Cutout Mockup */}
                  <div className="relative z-10 w-16 h-20 rounded-sm border-2 border-white shadow-lg overflow-hidden flex">
                    {/* Left half: Solid purple studio background */}
                    <div className="w-1/2 h-full bg-purple-700 relative overflow-hidden" />
                    
                    {/* Right half: Transparent checkerboard pattern */}
                    <div 
                      className="w-1/2 h-full bg-slate-800" 
                      style={{
                        backgroundImage: 'linear-gradient(45deg, #334155 25%, transparent 25%), linear-gradient(-45deg, #334155 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #334155 75%), linear-gradient(-45deg, transparent 75%, #334155 75%)',
                        backgroundSize: '8px 8px',
                        backgroundPosition: '0 0, 0 4px, 4px -4px, -4px 0px'
                      }}
                    />

                    {/* Person silhouette overlay in center */}
                    <div className="absolute inset-0 w-full h-full">
                      <PortraitVector className="w-full h-full" />
                    </div>

                    {/* Vertical split scanline in glowing cyan */}
                    <div className="absolute top-0 bottom-0 left-1/2 w-0.5 bg-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.9)]" />
                  </div>
                </div>

                {/* Card Title, Subtitle, and Circle Arrow Action Button */}
                <div className="flex items-end justify-between gap-2 mt-auto">
                  <div className="min-w-0">
                    <h3 className={`text-xs sm:text-[13px] font-bold font-display tracking-tight truncate ${
                      isDark ? 'text-white group-hover:text-cyan-300' : 'text-slate-900 group-hover:text-blue-600'
                    }`}>
                      Background Removal
                    </h3>
                    <p className={`text-[10.5px] mt-0.5 leading-snug line-clamp-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                      Remove background with AI
                    </p>
                  </div>

                  <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 shadow-xs group-hover:scale-105 active:scale-95 ${
                    isDark 
                      ? 'bg-blue-600/30 group-hover:bg-blue-600 text-blue-300 group-hover:text-white' 
                      : 'bg-blue-100 group-hover:bg-blue-600 text-blue-600 group-hover:text-white'
                  }`}>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </div>
              </div>

            </div>
          </div>


          {/* 3. MIDDLE BANNER: "Need Passport Photos?" (Matching 2nd Image) */}
          <div className={`rounded-2xl border p-3.5 sm:p-4 flex flex-col sm:flex-row items-center justify-between gap-3.5 shadow-md relative overflow-hidden ${
            isDark 
              ? 'border-blue-500/25 bg-gradient-to-r from-[#0d1c44] via-[#0b1739] to-[#0d2252]' 
              : 'border-blue-400/40 bg-gradient-to-r from-blue-700 via-indigo-700 to-blue-800 text-white'
          }`}>
            {/* Ambient background light */}
            <div className="absolute -left-8 top-0 w-40 h-40 bg-blue-500/15 rounded-full blur-2xl pointer-events-none" />

            {/* Left Graphic: Fan-out Stack of 3 Passport Photos with Realistic Portrait */}
            <div className="flex items-center gap-3.5 z-10">
              <div className="relative w-22 h-15 shrink-0 flex items-center justify-center select-none">
                {/* Photo 1 (Tilted Left) */}
                <div className="absolute w-9 h-12 rounded-xs bg-white p-0.5 shadow-md transform -rotate-12 -translate-x-3 overflow-hidden border border-slate-300">
                  <PortraitVector className="w-full h-full" />
                </div>
                {/* Photo 2 (Center) */}
                <div className="relative z-10 w-9 h-12 rounded-xs bg-white p-0.5 shadow-lg overflow-hidden border border-slate-300">
                  <PortraitVector className="w-full h-full" />
                </div>
                {/* Photo 3 (Tilted Right) */}
                <div className="absolute w-9 h-12 rounded-xs bg-white p-0.5 shadow-md transform rotate-12 translate-x-3 overflow-hidden border border-slate-300">
                  <PortraitVector className="w-full h-full" />
                </div>
              </div>

              {/* Center Text */}
              <div className="text-left">
                <h3 className="text-sm sm:text-base font-black font-display tracking-tight text-white">
                  Need Passport Photos?
                </h3>
                <p className="text-xs text-blue-100/90 mt-0.5">
                  Get perfect size, background and quality in seconds.
                </p>
              </div>
            </div>

            {/* Right Action Button */}
            <button
              onClick={() => onSelectTab('passport')}
              className="z-10 w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2 rounded-xl font-bold text-xs sm:text-sm text-white bg-blue-600 hover:bg-blue-500 shadow-[0_0_15px_rgba(37,99,235,0.5)] cursor-pointer transform active:scale-95 shrink-0"
            >
              <span>Start Now</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>


          {/* 4. BOTTOM FEATURE ROW: 4 BADGES (Matching 2nd Image) */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
            {/* Feature 1: 100% Private */}
            <div className={`p-2.5 rounded-xl border flex items-center gap-2.5 text-left ${
              isDark ? 'bg-[#0a142e]/75 border-blue-500/15' : 'bg-white border-slate-200 shadow-xs'
            }`}>
              <div className="w-7 h-7 rounded-lg bg-blue-500/15 border border-blue-400/30 flex items-center justify-center text-cyan-400 shrink-0">
                <Shield className="w-3.5 h-3.5" />
              </div>
              <div className="min-w-0">
                <div className={`text-[11.5px] font-bold truncate ${isDark ? 'text-white' : 'text-slate-800'}`}>
                  100% Private
                </div>
                <div className={`text-[9.5px] truncate ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  Your data stays with you
                </div>
              </div>
            </div>

            {/* Feature 2: High Quality */}
            <div className={`p-2.5 rounded-xl border flex items-center gap-2.5 text-left ${
              isDark ? 'bg-[#0a142e]/75 border-blue-500/15' : 'bg-white border-slate-200 shadow-xs'
            }`}>
              <div className="w-7 h-7 rounded-lg bg-blue-500/15 border border-blue-400/30 flex items-center justify-center text-cyan-400 shrink-0">
                <Sun className="w-3.5 h-3.5" />
              </div>
              <div className="min-w-0">
                <div className={`text-[11.5px] font-bold truncate ${isDark ? 'text-white' : 'text-slate-800'}`}>
                  High Quality
                </div>
                <div className={`text-[9.5px] truncate ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  HD output, professional results
                </div>
              </div>
            </div>

            {/* Feature 3: Fast Processing */}
            <div className={`p-2.5 rounded-xl border flex items-center gap-2.5 text-left ${
              isDark ? 'bg-[#0a142e]/75 border-blue-500/15' : 'bg-white border-slate-200 shadow-xs'
            }`}>
              <div className="w-7 h-7 rounded-lg bg-blue-500/15 border border-blue-400/30 flex items-center justify-center text-cyan-400 shrink-0">
                <Clock className="w-3.5 h-3.5" />
              </div>
              <div className="min-w-0">
                <div className={`text-[11.5px] font-bold truncate ${isDark ? 'text-white' : 'text-slate-800'}`}>
                  Fast Processing
                </div>
                <div className={`text-[9.5px] truncate ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  Get results in seconds
                </div>
              </div>
            </div>

            {/* Feature 4: Easy to Use */}
            <div className={`p-2.5 rounded-xl border flex items-center gap-2.5 text-left ${
              isDark ? 'bg-[#0a142e]/75 border-blue-500/15' : 'bg-white border-slate-200 shadow-xs'
            }`}>
              <div className="w-7 h-7 rounded-lg bg-blue-500/15 border border-blue-400/30 flex items-center justify-center text-cyan-400 shrink-0">
                <Smile className="w-3.5 h-3.5" />
              </div>
              <div className="min-w-0">
                <div className={`text-[11.5px] font-bold truncate ${isDark ? 'text-white' : 'text-slate-800'}`}>
                  Easy to Use
                </div>
                <div className={`text-[9.5px] truncate ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  No technical skills required
                </div>
              </div>
            </div>
          </div>

        </div>


        {/* ========================================================= */}
        {/* RIGHT COLUMN: 4 Panels (Online, Quick Access, Stats, Help) */}
        {/* ========================================================= */}
        <div className="xl:col-span-4 space-y-3.5">
          
          {/* Panel 1: Online System Status */}
          <div className={`p-3.5 sm:p-4 rounded-2xl border ${
            isDark 
              ? 'bg-[#0a1533]/90 border-blue-500/20 shadow-md' 
              : 'bg-white border-slate-200 shadow-xs'
          }`}>
            <div className="flex items-start justify-between">
              <div className="space-y-0.5 text-left">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
                  <span className="text-xs font-bold text-emerald-500 tracking-wide">
                    Online
                  </span>
                </div>
                <h3 className={`text-xs sm:text-sm font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>
                  SnapID Studio is ready!
                </h3>
                <p className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  All tools are working properly.
                </p>
              </div>

              {/* Green Shield Checkmark Icon */}
              <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.2)] shrink-0">
                <ShieldCheck className="w-4.5 h-4.5" />
              </div>
            </div>
          </div>


          {/* Panel 2: Quick Access List (Only Existing 4 Tools) */}
          <div className={`p-3.5 sm:p-4 rounded-2xl border space-y-2.5 ${
            isDark 
              ? 'bg-[#0a1533]/90 border-blue-500/20 shadow-md' 
              : 'bg-white border-slate-200 shadow-xs'
          }`}>
            <div className="text-left">
              <h3 className={`text-xs sm:text-sm font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>
                Quick Access
              </h3>
              <p className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'} mt-0.5`}>
                Jump to your most used tools
              </p>
            </div>

            <div className="space-y-1.5 pt-0.5">
              {/* Quick Item 1: Passport Size */}
              <button
                onClick={() => onSelectTab('passport')}
                className={`w-full flex items-center justify-between p-2 rounded-xl border border-transparent text-left group cursor-pointer ${
                  isDark 
                    ? 'hover:border-blue-500/30 hover:bg-blue-600/15' 
                    : 'hover:border-blue-300 hover:bg-blue-50/80'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-blue-600/20 text-blue-500 flex items-center justify-center shrink-0">
                    <User className="w-3.5 h-3.5" />
                  </div>
                  <span className={`text-xs font-semibold ${
                    isDark ? 'text-slate-200 group-hover:text-white' : 'text-slate-700 group-hover:text-blue-600'
                  }`}>
                    Passport Size
                  </span>
                </div>
                <ArrowRight className={`w-3.5 h-3.5 ${
                  isDark ? 'text-slate-500 group-hover:text-blue-400' : 'text-slate-400 group-hover:text-blue-600'
                }`} />
              </button>

              {/* Quick Item 2: Documents */}
              <button
                onClick={() => onSelectTab('documents')}
                className={`w-full flex items-center justify-between p-2 rounded-xl border border-transparent text-left group cursor-pointer ${
                  isDark 
                    ? 'hover:border-cyan-500/30 hover:bg-cyan-600/15' 
                    : 'hover:border-emerald-300 hover:bg-emerald-50/80'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-emerald-600/20 text-emerald-500 flex items-center justify-center shrink-0">
                    <FileText className="w-3.5 h-3.5" />
                  </div>
                  <span className={`text-xs font-semibold ${
                    isDark ? 'text-slate-200 group-hover:text-white' : 'text-slate-700 group-hover:text-emerald-600'
                  }`}>
                    Documents
                  </span>
                </div>
                <ArrowRight className={`w-3.5 h-3.5 ${
                  isDark ? 'text-slate-500 group-hover:text-cyan-400' : 'text-slate-400 group-hover:text-emerald-600'
                }`} />
              </button>

              {/* Quick Item 3: Photo Resizer */}
              <button
                onClick={() => onSelectTab('resizer')}
                className={`w-full flex items-center justify-between p-2 rounded-xl border border-transparent text-left group cursor-pointer ${
                  isDark 
                    ? 'hover:border-amber-500/30 hover:bg-amber-600/15' 
                    : 'hover:border-amber-300 hover:bg-amber-50/80'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-amber-600/20 text-amber-500 flex items-center justify-center shrink-0">
                    <Sliders className="w-3.5 h-3.5" />
                  </div>
                  <span className={`text-xs font-semibold ${
                    isDark ? 'text-slate-200 group-hover:text-white' : 'text-slate-700 group-hover:text-amber-600'
                  }`}>
                    Photo Resizer
                  </span>
                </div>
                <ArrowRight className={`w-3.5 h-3.5 ${
                  isDark ? 'text-slate-500 group-hover:text-amber-400' : 'text-slate-400 group-hover:text-amber-600'
                }`} />
              </button>

              {/* Quick Item 4: Background Removal */}
              <button
                onClick={() => onSelectTab('passport')}
                className={`w-full flex items-center justify-between p-2 rounded-xl border border-transparent text-left group cursor-pointer ${
                  isDark 
                    ? 'hover:border-purple-500/30 hover:bg-purple-600/15' 
                    : 'hover:border-purple-300 hover:bg-purple-50/80'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-purple-600/20 text-purple-500 flex items-center justify-center shrink-0">
                    <Sparkles className="w-3.5 h-3.5" />
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className={`text-xs font-semibold ${
                      isDark ? 'text-slate-200 group-hover:text-white' : 'text-slate-700 group-hover:text-purple-600'
                    }`}>
                      Background Removal
                    </span>
                    <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full border ${
                      isDark ? 'bg-purple-600/20 border-purple-500/30 text-purple-300' : 'bg-purple-100 border-purple-300 text-purple-700'
                    }`}>
                      New
                    </span>
                  </div>
                </div>
                <ArrowRight className={`w-3.5 h-3.5 ${
                  isDark ? 'text-slate-500 group-hover:text-purple-400' : 'text-slate-400 group-hover:text-purple-600'
                }`} />
              </button>
            </div>
          </div>


          {/* Panel 3: Trusted by Thousands */}
          <div className={`p-3.5 sm:p-4 rounded-2xl border ${
            isDark 
              ? 'bg-[#0a1533]/90 border-blue-500/20 shadow-md' 
              : 'bg-white border-slate-200 shadow-xs'
          }`}>
            <div className="flex items-start justify-between">
              <div className="text-left">
                <h3 className={`text-xs sm:text-sm font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>
                  Trusted by Thousands
                </h3>
                <p className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'} mt-0.5`}>
                  Daily users &amp; counting
                </p>
              </div>

              <div className={isDark ? 'text-cyan-400' : 'text-blue-600'}>
                <TrendingUp className="w-4.5 h-4.5" />
              </div>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-2 gap-3 mt-3 pt-2.5 border-t border-blue-500/10 text-left">
              <div>
                <div className={`flex items-center gap-1 text-sm sm:text-base font-black ${
                  isDark ? 'text-white' : 'text-slate-900'
                }`}>
                  <span className={`text-xs ${isDark ? 'text-cyan-400' : 'text-blue-600'}`}>✦</span>
                  <span>12K+</span>
                </div>
                <div className={`text-[10.5px] ${isDark ? 'text-slate-400' : 'text-slate-500'} mt-0.5`}>
                  Happy Users
                </div>
              </div>

              <div>
                <div className={`flex items-center gap-1 text-sm sm:text-base font-black ${
                  isDark ? 'text-white' : 'text-slate-900'
                }`}>
                  <span className={`text-xs ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>💧</span>
                  <span>50K+</span>
                </div>
                <div className={`text-[10.5px] ${isDark ? 'text-slate-400' : 'text-slate-500'} mt-0.5`}>
                  Photos Processed
                </div>
              </div>
            </div>
          </div>


          {/* Panel 4: Need Help? */}
          <div className={`p-3.5 sm:p-4 rounded-2xl border space-y-2.5 relative overflow-hidden ${
            isDark 
              ? 'bg-[#0a1533]/90 border-blue-500/20 shadow-md' 
              : 'bg-white border-slate-200 shadow-xs'
          }`}>
            <div className="flex items-start justify-between gap-2">
              <div className="text-left space-y-0.5">
                <h3 className={`text-xs sm:text-sm font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>
                  Need Help?
                </h3>
                <div className={`text-[11.5px] font-semibold ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>
                  Check our Guides &amp; FAQ
                </div>
                <p className={`text-[10.5px] ${isDark ? 'text-slate-400' : 'text-slate-500'} leading-snug`}>
                  Get instant support and step-by-step guides.
                </p>
              </div>

              {/* Glowing Mascot Avatar with Lightbulb */}
              <div className="relative w-11 h-11 rounded-full bg-blue-600/20 border border-blue-400/30 flex items-center justify-center shrink-0">
                {/* Lightbulb indicator */}
                <div className="absolute -top-1 -right-1 w-4.5 h-4.5 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.8)] flex items-center justify-center text-slate-900 font-bold text-[9px]">
                  💡
                </div>
                <Smile className={`w-5 h-5 ${isDark ? 'text-cyan-300' : 'text-blue-600'}`} />
              </div>
            </div>

            {/* View Help Center Button */}
            <button
              onClick={() => onSelectTab('help')}
              className="w-full inline-flex items-center justify-center gap-2 py-2 px-3 rounded-xl font-bold text-xs text-white bg-blue-600 hover:bg-blue-500 shadow-[0_0_12px_rgba(37,99,235,0.4)] cursor-pointer"
            >
              <span>View Help Center</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

        </div>

      </div>
    </div>
  );
}
