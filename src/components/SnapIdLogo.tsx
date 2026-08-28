import React from 'react';

interface SnapIdLogoProps {
  className?: string;
  theme?: 'light' | 'dark';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  iconOnly?: boolean;
}

export default function SnapIdLogo({
  className = '',
  theme = 'dark',
  size = 'md',
  iconOnly = false
}: SnapIdLogoProps) {
  // Perfect sizing scales matching the uploaded banner aspect ratios
  const iconSizes = {
    sm: 'w-8 h-8 rounded-[24%]',
    md: 'w-12 h-12 rounded-[24%]',
    lg: 'w-20 h-20 rounded-[24%]',
    xl: 'w-28 h-28 rounded-[24%]'
  };

  const textSizes = {
    sm: 'text-xl tracking-tight',
    md: 'text-2xl lg:text-3xl tracking-tight',
    lg: 'text-5xl tracking-tight',
    xl: 'text-7xl tracking-tighter'
  };

  const subtitleSizes = {
    sm: 'text-[5.5px] tracking-[0.22em]',
    md: 'text-[9.5px] tracking-[0.34em]',
    lg: 'text-xs tracking-[0.45em]',
    xl: 'text-base tracking-[0.5em]'
  };

  const gapSizes = {
    sm: 'gap-2.5',
    md: 'gap-4',
    lg: 'gap-6',
    xl: 'gap-8'
  };

  const lineSizes = {
    sm: 'w-3.5',
    md: 'w-5',
    lg: 'w-11',
    xl: 'w-18'
  };

  const isDarkMode = theme === 'dark';

  return (
    <div className={`flex items-center ${gapSizes[size]} select-none ${className}`}>
      
      {/* BRAND CAMERA ICON WITH SQUIRCLE BEZEL AND GLOW (Identical design in both light & dark modes) */}
      <div className={`relative ${iconSizes[size]} shrink-0 flex items-center justify-center p-[1.5px] rounded-[24%] transition-all duration-300 bg-gradient-to-br from-[#38bdf8] via-[#4f46e5] to-[#c084fc] ${
        isDarkMode 
          ? 'shadow-[0_12px_40px_rgba(37,99,235,0.4),_0_0_20px_rgba(139,92,246,0.3)]' 
          : 'shadow-[0_10px_25px_rgba(37,99,235,0.25),_0_4px_12px_rgba(139,92,246,0.18)]'
      }`}>
        {/* Inner Container - Always premium deep glass canvas */}
        <div className="w-full h-full rounded-[22%] flex items-center justify-center relative overflow-hidden bg-gradient-to-br from-[#124be3] via-[#3321bf] to-[#6911c7]">
          {/* Top glossy glass highlight */}
          <div className="absolute inset-x-0 top-0 h-[45%] bg-gradient-to-b from-white/20 to-transparent pointer-events-none" />

          {/* White camera icon with drop shadow */}
          <svg 
            viewBox="0 0 100 100" 
            fill="none" 
            xmlns="http://www.w3.org/2000/svg" 
            className="w-[62%] h-[62%] filter drop-shadow-[0_2.5px_4px_rgba(0,0,0,0.4)]"
          >
            <path 
              d="M32 29L36.5 21.5C38 19 40.5 17.5 43.5 17.5H56.5C59.5 17.5 62 19 63.5 21.5L68 29H81C85.4 29 89 32.6 89 37V71C89 75.4 85.4 79 81 79H19C14.6 79 11 75.4 11 71V37C11 32.6 14.6 29 19 29H32Z" 
              stroke="white" 
              strokeWidth="6" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            />
            <circle 
              cx="50" 
              cy="53" 
              r="15" 
              stroke="white" 
              strokeWidth="6"
            />
          </svg>
        </div>
      </div>

      {/* Brand Text Columns */}
      {!iconOnly && (
        <div className="flex flex-col justify-center">
          {/* Title Area: "Snap" + Premium Gradient "ID" */}
          <h1 className={`${textSizes[size]} font-black tracking-tight leading-none flex items-baseline font-display`}>
            {/* Clean solid color text to match reference exactly */}
            <span className={`inline-block font-extrabold ${
              isDarkMode ? 'text-white' : 'text-[#091e42]'
            }`}>
              Snap
            </span>
            {/* Deep rich blue-to-purple gradient "ID" to match reference exactly */}
            <span className="bg-gradient-to-r from-[#2563eb] via-[#4f46e5] to-[#8b5cf6] bg-clip-text text-transparent font-black select-none pl-0.5" style={{ textShadow: isDarkMode ? '0 0 25px rgba(139,92,246,0.15)' : 'none' }}>
              ID
            </span>
          </h1>

          {/* Underbar: — AI PHOTO STUDIO — with glowing luxury lines */}
          <div className="flex items-center gap-1.5 mt-2 whitespace-nowrap overflow-visible">
            {/* Left Blue glowing bar */}
            <div className={`h-[1px] ${lineSizes[size]} shrink-0 bg-gradient-to-r ${
              isDarkMode 
                ? 'from-transparent via-blue-500/80 to-blue-400' 
                : 'from-transparent via-blue-600/90 to-blue-500'
            }`} />

            {/* Center wide subtitle */}
            <span className={`${subtitleSizes[size]} font-sans font-bold ${
              isDarkMode ? 'text-slate-400' : 'text-slate-500'
            } uppercase leading-none select-none`}>
              AI Photo Studio
            </span>

            {/* Right Purple glowing bar */}
            <div className={`h-[1px] ${lineSizes[size]} shrink-0 bg-gradient-to-l ${
              isDarkMode 
                ? 'from-transparent via-purple-500/80 to-purple-400' 
                : 'from-transparent via-purple-600/90 to-purple-500'
            }`} />
          </div>
        </div>
      )}

    </div>
  );
}
