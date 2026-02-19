
'use client';

import React from 'react';
import { AppView } from '../types';

interface NavigationProps {
  activeView: AppView;
  onViewChange: (view: AppView) => void;
  activeNotebookTitle?: string;
  onBackToShelf: () => void;
}

const Navigation: React.FC<NavigationProps> = ({ 
  activeView, 
  onViewChange, 
  activeNotebookTitle, 
  onBackToShelf 
}) => {
  const tabs: { id: AppView; label: string; icon: string }[] = [
    { id: 'ledger', label: 'Pad', icon: '📝' },
    { id: 'research', label: 'Intel', icon: '🔍' },
    { id: 'brief', label: 'Brief', icon: '🧶' },
    { id: 'blueprint', label: 'Map', icon: '📐' },
    { id: 'architect', label: 'Build', icon: '🏗️' },
    { id: 'visualizer', label: 'Vision', icon: '🎨' },
    { id: 'raw', label: 'Export', icon: '📄' },
  ];

  return (
    <nav className="sticky top-0 z-50 bg-white border-b border-slate-200 shadow-sm">
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

        <div className="flex gap-1 overflow-x-auto no-scrollbar py-2">
          {tabs.map((tab) => (
            <button 
              key={tab.id} 
              onClick={() => onViewChange(tab.id)} 
              className={`
                px-3 py-1.5 rounded-lg flex items-center gap-2 text-[9px] lg:text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap
                ${activeView === tab.id 
                  ? 'bg-slate-900 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-900 hover:bg-slate-50'
                }
              `}
            >
              <span className="text-sm">{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
