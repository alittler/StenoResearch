
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
  const tabs: { id: AppView; label: string; color: string }[] = [
    { id: 'ledger', label: 'Pad', color: '#ef4444' }, // Red
    { id: 'research', label: 'Intel', color: '#3b82f6' }, // Blue
    { id: 'architect', label: 'Build', color: '#10b981' }, // Green
    { id: 'raw', label: 'Export', color: '#a855f7' }, // Purple
  ];

  return (
    <>
      {/* Navigation Tabs */}
      {!hideTabs && (
        <div className={`
          z-50 pointer-events-none flex
          lg:flex-col lg:items-start lg:justify-start lg:gap-0 lg:h-full lg:pt-12
          flex-row items-start justify-center gap-2 w-full px-4
          absolute top-0 left-1/2 -translate-x-1/2 -translate-y-2 lg:relative lg:left-0 lg:translate-x-0 lg:translate-y-0
        `}>
          {tabs.map((tab, index) => (
            <button 
              key={tab.id} 
              onClick={() => onViewChange(tab.id)} 
              className={`
                pointer-events-auto
                relative flex flex-col items-center justify-start transition-all duration-500 group
                ${activeView === tab.id 
                  ? 'h-20 w-24 sm:w-32 lg:w-40 lg:h-24 shadow-[0_10px_30px_rgba(0,0,0,0.2)] lg:-ml-4'
                  : 'h-10 w-16 sm:w-20 lg:w-28 lg:h-12 hover:h-14 lg:hover:w-32 shadow-md'
                }
              `}
              style={{ 
                backgroundColor: tab.color,
                zIndex: activeView === tab.id ? 30 : 20 - index
              }}
            >
              {/* Divider Texture & Plastic Tab Effect */}
              <div className="absolute inset-0 opacity-20 pointer-events-none bg-[linear-gradient(to_bottom,_rgba(255,255,255,0.3)_0%,_transparent_40%,_rgba(0,0,0,0.1)_100%)]"></div>
              
              {/* Tab Content */}
              <div className={`flex flex-col items-center lg:items-start lg:pl-6 gap-1 text-white transition-all pt-2 ${activeView === tab.id ? 'scale-110' : 'scale-100'}`}>
                <span className={`text-[8px] sm:text-[10px] font-black uppercase tracking-widest drop-shadow-[0_1px_1px_rgba(0,0,0,0.3)] transition-opacity ${activeView === tab.id ? 'opacity-100' : 'opacity-60 group-hover:opacity-100'}`}>
                  {tab.label}
                </span>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Active Notebook Indicator (Floating below the tabs on mobile, or at bottom on desktop) */}
      {!hideTabs && (
        <div className="absolute top-[calc(100%+100px)] lg:top-auto lg:bottom-0 left-1/2 -translate-x-1/2 z-40 pointer-events-none">
          <span className="bg-white/90 backdrop-blur-md text-slate-500 text-[9px] font-black uppercase tracking-[0.3em] px-6 py-2 rounded-full border border-slate-200 shadow-xl whitespace-nowrap">
            {activeNotebookTitle}
          </span>
        </div>
      )}
    </>
  );
};

export default Navigation;
