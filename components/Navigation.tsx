
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
          lg:flex-col lg:items-start lg:justify-start lg:gap-4 lg:h-full lg:pt-24
          flex-row items-end justify-center gap-2 w-full px-4
          fixed bottom-0 left-0 lg:relative lg:bottom-auto lg:left-auto lg:h-auto
        `}>
          {tabs.map((tab, index) => (
            <button 
              key={tab.id} 
              onClick={() => onViewChange(tab.id)} 
              className={`
                pointer-events-auto
                relative flex flex-col items-center justify-center transition-all duration-500 group
                ${activeView === tab.id 
                  ? 'h-20 w-20 lg:w-20 lg:h-20 shadow-[0_-10px_30px_rgba(0,0,0,0.2)] lg:shadow-[0_10px_30px_rgba(0,0,0,0.2)] translate-y-0 lg:translate-y-0 lg:translate-x-0'
                  : 'h-12 w-12 lg:w-12 lg:h-12 translate-y-[85%] hover:translate-y-0 lg:translate-y-0 lg:translate-x-[-85%] lg:hover:translate-x-0 shadow-md'
                }
                rounded-t-xl lg:rounded-r-xl lg:rounded-l-none
              `}
              style={{ 
                backgroundColor: tab.color,
                zIndex: activeView === tab.id ? 30 : 20 - index
              }}
            >
              {/* Divider Texture & Plastic Tab Effect */}
              <div className="absolute inset-0 opacity-20 pointer-events-none bg-[linear-gradient(to_bottom,_rgba(255,255,255,0.3)_0%,_transparent_40%,_rgba(0,0,0,0.1)_100%)] lg:bg-[linear-gradient(to_right,_rgba(255,255,255,0.3)_0%,_transparent_40%,_rgba(0,0,0,0.1)_100%)]"></div>
              
              {/* Tab Content */}
              <div className={`flex flex-col items-center justify-center gap-1 text-white transition-all ${activeView === tab.id ? 'scale-110' : 'scale-100'}`}>
                <span className={`
                  text-[8px] font-black uppercase tracking-widest drop-shadow-[0_1px_1px_rgba(0,0,0,0.3)] transition-all
                  rotate-0 lg:rotate-[270deg]
                  ${activeView === tab.id ? 'opacity-100' : 'opacity-60 group-hover:opacity-100'}
                `}>
                  {tab.label}
                </span>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Active Notebook Indicator removed per request */}
    </>
  );
};

export default Navigation;
