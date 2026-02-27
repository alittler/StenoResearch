
'use client';

import React from 'react';

interface NotepadContainerProps {
  children: React.ReactNode;
  navigation?: React.ReactNode;
  title?: string;
  onBackToShelf?: () => void;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  isMinimal?: boolean;
}

const NotepadContainer: React.FC<NotepadContainerProps> = ({ 
  children, 
  navigation, 
  title, 
  onBackToShelf,
  searchQuery,
  onSearchChange,
  isMinimal = false
}) => {
  return (
    <div className="relative w-full flex flex-col items-start gap-0">
      <div className="flex-1 relative w-full">
        {/* Black Book Binding */}
        <div className="h-12 w-full bg-[#1a1a1a] border-b border-black border-x-2 border-transparent relative z-20 overflow-visible shadow-lg flex items-center justify-between px-6">
            <div className="flex items-center gap-4">
              {onBackToShelf && (
                <button 
                  onClick={onBackToShelf}
                  className="p-2 hover:bg-white/10 transition-colors group relative z-30"
                  title="Back to Shelf"
                >
                  <svg className="w-6 h-6 text-stone-400 group-hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                </button>
              )}
              <div className="flex items-center gap-2">
                <h1 className="text-stone-400 font-black uppercase tracking-[0.3em] text-[10px] hidden sm:block">{title}</h1>
                {title === 'General Ledger' && (
                  <svg className="w-3 h-3 text-amber-500/50" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
            </div>

          {/* Search Bar in Header */}
          {onSearchChange && (
            <div className="relative max-w-[200px] sm:max-w-xs w-full group">
              <input 
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Search..."
                className="w-full bg-white/5 border-none rounded-full px-4 py-1.5 text-xs text-white placeholder-stone-500 focus:ring-1 focus:ring-white/20 transition-all"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-500 group-focus-within:text-white transition-colors">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
          )}
          
          {/* Leather-like texture overlay */}
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none" 
               style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.65\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\'/%3E%3C/svg%3E")' }}></div>
          
          <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-transparent to-black/60 pointer-events-none"></div>
          <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent h-1/3 pointer-events-none"></div>
          
          {/* Spine Ribbing Details */}
          <div className="absolute inset-x-0 top-0 bottom-0 flex justify-around px-16 items-center opacity-10 pointer-events-none">
            {[...Array(12)].map((_, i) => (
              <div key={i} className="w-[1px] h-full bg-black shadow-[1px_0_0_rgba(255,255,255,0.05)]"></div>
            ))}
          </div>
        </div>
      </div>

      <div className="relative w-full">
        {/* Navigation - Absolute on Desktop (Right), Fixed on Mobile (Bottom) */}
        <div className="lg:absolute lg:left-full lg:top-0 lg:h-full lg:w-auto pointer-events-none z-0">
          {navigation}
        </div>

        <div className={`w-full relative z-10 min-h-[calc(100vh-180px)] flex flex-col -mt-2 overflow-visible ${
          isMinimal 
            ? 'lg:border-x-2 lg:border-b-2 lg:border-stone-200 lg:shadow-[0_40px_80px_-20px_rgba(0,0,0,0.15)] lg:bg-white lg:pb-12' 
            : 'border-x-2 border-b-2 border-stone-200 shadow-[0_40px_80px_-20px_rgba(0,0,0,0.15)] paper-texture pb-12'
        }`}>
          {/* Opaque Torn Edge Overlay with Shadow Wrapper - Stacked Layers */}
          <div className="torn-paper-stack">
            <div className="torn-paper-shadow-container layer-3">
              <div className="torn-paper-edge"></div>
            </div>
            <div className="torn-paper-shadow-container layer-2">
              <div className="torn-paper-edge"></div>
            </div>
            <div className="torn-paper-shadow-container layer-1">
              <div className="torn-paper-edge"></div>
            </div>
          </div>
          
          {/* Content Area */}
          <div className="flex-1 flex flex-col overflow-y-auto px-8 sm:px-12 pt-8">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotepadContainer;
