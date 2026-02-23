
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
      {/* Top Bar for Shelf and Title */}
      <nav className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-[1400px] mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={onBackToShelf}
              className="p-1.5 hover:bg-slate-100 rounded-md transition-colors flex items-center gap-2 group"
              title="Project Shelf"
            >
              <svg className="w-5 h-5 text-slate-400 group-hover:text-slate-900 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
              <span className="hidden lg:inline text-[10px] font-black uppercase tracking-widest text-slate-400 group-hover:text-slate-900">Shelf</span>
            </button>
            <div className="h-6 w-[1px] bg-slate-200 mx-2"></div>
            <span className="font-bold text-sm text-slate-900 truncate max-w-[150px] lg:max-w-xs">
              {activeNotebookTitle}
            </span>
          </div>
        </div>
      </nav>

      {/* Side Book Dividers */}
      {!hideTabs && (
        <div className="fixed right-0 top-1/2 -translate-y-1/2 z-50 flex flex-col gap-1 items-end pointer-events-none">
          {tabs.map((tab, index) => (
            <button 
              key={tab.id} 
              onClick={() => onViewChange(tab.id)} 
              className={`
                pointer-events-auto
                relative flex items-center justify-center w-12 h-24 rounded-l-xl transition-all duration-300 group
                ${activeView === tab.id 
                  ? 'w-16 shadow-[-4px_0_10px_rgba(0,0,0,0.1)]'
                  : 'hover:w-14'
                }
              `}
              style={{ 
                backgroundColor: tab.color,
                marginTop: index === 0 ? '0' : '-10px',
                zIndex: activeView === tab.id ? 10 : 5 - index
              }}
            >
              <div className="flex flex-col items-center gap-2 text-white">
                <span className="text-xl drop-shadow-sm">{tab.icon}</span>
                <span className="[writing-mode:vertical-rl] text-[9px] font-black uppercase tracking-widest drop-shadow-sm">
                  {tab.label}
                </span>
              </div>
              
              {/* Divider Texture */}
              <div className="absolute inset-0 opacity-10 pointer-events-none bg-[radial-gradient(circle_at_center,_rgba(255,255,255,0.2)_0%,_transparent_70%)]"></div>
              <div className="absolute left-0 top-0 bottom-0 w-[1px] bg-black/10"></div>
            </button>
          ))}
        </div>
      )}
    </>
  );
};

export default Navigation;
