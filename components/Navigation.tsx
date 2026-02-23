
'use client';

import React from 'react';
import { AppView } from '../types';

interface NavigationProps {
  activeView: AppView;
  onViewChange: (view: AppView) => void;
  activeNotebookTitle?: string;
  onBackToShelf: () => void;
  hideTabs?: boolean;
}

const Navigation: React.FC<NavigationProps> = ({ 
  activeView, 
  onViewChange, 
  activeNotebookTitle, 
  onBackToShelf,
  hideTabs
}) => {
  const tabs: { id: AppView; label: string; icon: string; color: string }[] = [
    { id: 'ledger', label: 'Pad', icon: '📝', color: '#ef4444' }, // Red
    { id: 'research', label: 'Intel', icon: '🔍', color: '#3b82f6' }, // Blue
    { id: 'architect', label: 'Build', icon: '🏗️', color: '#10b981' }, // Green
    { id: 'raw', label: 'Export', icon: '📄', color: '#a855f7' }, // Purple
  ];

  return (
    <>
      {/* Bottom Navigation (Binder Dividers) - Positioned to hang from the back cover of the notepad */}
      {!hideTabs && (
        <div className="absolute top-[calc(100%-15px)] left-1/2 -translate-x-1/2 z-10 w-full max-w-2xl px-4 flex items-start justify-center gap-2 pointer-events-none">
          {tabs.map((tab, index) => (
            <button 
              key={tab.id} 
              onClick={() => onViewChange(tab.id)} 
              className={`
                pointer-events-auto
                relative flex flex-col items-center justify-start transition-all duration-500 group
                ${activeView === tab.id 
                  ? 'h-32 w-24 sm:w-32 rounded-b-3xl shadow-[0_20px_40px_rgba(0,0,0,0.3)] translate-y-2'
                  : 'h-18 w-16 sm:w-20 rounded-b-2xl hover:h-22 hover:translate-y-1 shadow-lg'
                }
              `}
              style={{ 
                backgroundColor: tab.color,
                zIndex: activeView === tab.id ? 30 : 20 - index
              }}
            >
              {/* Divider Texture & Plastic Tab Effect */}
              <div className="absolute inset-0 opacity-30 pointer-events-none bg-[linear-gradient(to_bottom,_rgba(255,255,255,0.4)_0%,_transparent_20%,_rgba(0,0,0,0.2)_100%)] rounded-b-inherit"></div>
              <div className="absolute inset-x-2 top-0 h-1 bg-white/20 rounded-full blur-[1px]"></div>
              
              {/* Tab Content */}
              <div className={`flex flex-col items-center gap-1 text-white transition-all pt-6 ${activeView === tab.id ? 'scale-110' : 'scale-100'}`}>
                <span className="text-xl sm:text-2xl drop-shadow-[0_2px_2px_rgba(0,0,0,0.5)]">{tab.icon}</span>
                <span className={`text-[8px] sm:text-[10px] font-black uppercase tracking-widest drop-shadow-[0_1px_1px_rgba(0,0,0,0.5)] transition-opacity ${activeView === tab.id ? 'opacity-100' : 'opacity-60 group-hover:opacity-100'}`}>
                  {tab.label}
                </span>
              </div>

              {/* Binder Hole Detail (Reinforced) */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-black/40 shadow-inner border border-white/20 flex items-center justify-center">
                <div className="w-1 h-1 rounded-full bg-black/20"></div>
              </div>
            </button>
          ))}
          
          {/* Close/Shelf Button (Physical Tab Style) */}
          <button 
            onClick={onBackToShelf}
            className="pointer-events-auto relative h-18 w-14 sm:w-16 bg-stone-800 rounded-b-2xl flex items-center justify-center hover:h-22 hover:translate-y-1 transition-all duration-300 group z-0 shadow-lg"
            title="Close Notepad & Back to Shelf"
          >
            <div className="absolute inset-0 opacity-20 pointer-events-none bg-[linear-gradient(to_top,_rgba(255,255,255,0.2)_0%,_transparent_100%)] rounded-b-inherit"></div>
            <svg className="w-6 h-6 text-stone-400 group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* Active Notebook Indicator (Floating below the tabs) */}
      {!hideTabs && (
        <div className="absolute top-[calc(100%+100px)] left-1/2 -translate-x-1/2 z-40 pointer-events-none">
          <span className="bg-white/90 backdrop-blur-md text-slate-500 text-[9px] font-black uppercase tracking-[0.3em] px-6 py-2 rounded-full border border-slate-200 shadow-xl">
            {activeNotebookTitle}
          </span>
        </div>
      )}

      {/* Fallback Close Button for when tabs are hidden (e.g. general notebook) */}
      {hideTabs && (
        <button 
          onClick={onBackToShelf}
          className="absolute top-[calc(100%-30px)] right-8 z-50 w-16 h-16 bg-stone-800 shadow-2xl rounded-full flex items-center justify-center hover:scale-110 active:scale-95 transition-all group"
          title="Back to Shelf"
        >
          <svg className="w-8 h-8 text-stone-400 group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </>
  );
};

export default Navigation;
