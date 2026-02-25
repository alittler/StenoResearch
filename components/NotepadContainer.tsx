
'use client';

import React from 'react';

interface NotepadContainerProps {
  children: React.ReactNode;
  navigation?: React.ReactNode;
  title?: string;
  onBackToShelf?: () => void;
}

const NotepadContainer: React.FC<NotepadContainerProps> = ({ children, navigation, title, onBackToShelf }) => {
  return (
    <div className="relative w-full">
      {/* Black Book Binding */}
      <div className="h-16 bg-[#1a1a1a] border-b border-black relative z-20 overflow-visible shadow-lg flex items-center px-6">
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

      <div className="border-x-2 border-b-2 border-stone-200 shadow-[0_40px_80px_-20px_rgba(0,0,0,0.15)] relative z-10 min-h-[calc(100vh-180px)] flex flex-col paper-texture pb-12 -mt-2">
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

      {/* Navigation - Positioned after paper in DOM and with higher z-index to be clickable */}
      <div className="absolute bottom-0 left-0 w-full z-50 pointer-events-none">
        {navigation}
      </div>
    </div>
  );
};

export default NotepadContainer;
