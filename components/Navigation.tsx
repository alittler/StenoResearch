
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
  hideTabs = false
}) => {
  const tabs: { id: AppView; label: string; color: string }[] = [
    { id: 'workspace', label: 'Workspace', color: 'bg-blue-500' },
    { id: 'ledger', label: 'Ledger', color: 'bg-emerald-500' },
    { id: 'sources', label: 'Sources', color: 'bg-amber-500' },
    // { id: 'chat', label: 'Chat', color: 'bg-indigo-500' },
    { id: 'architect', label: 'Architect', color: 'bg-purple-500' },
    { id: 'raw', label: 'Raw', color: 'bg-stone-500' },
  ];

  return (
    <div className="w-full bg-[#1a1a1a] border-b border-black z-50">
      <div className="max-w-[1600px] mx-auto px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <button 
            onClick={onBackToShelf}
            className="flex items-center gap-2 text-stone-400 hover:text-white transition-colors group"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
            </svg>
            <span className="text-[10px] font-black uppercase tracking-[0.2em]">Shelf</span>
          </button>
          
          <div className="h-4 w-[1px] bg-stone-800" />
          
          <div className="flex items-center gap-2">
            <h1 className="text-white font-black uppercase tracking-[0.3em] text-[10px] truncate max-w-[200px]">
              {activeNotebookTitle || 'Untitled Ledger'}
            </h1>
          </div>
        </div>

        {!hideTabs && (
          <nav className="flex items-center gap-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => onViewChange(tab.id)}
                className={`
                  px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all
                  ${activeView === tab.id 
                    ? `${tab.color} text-white shadow-lg` 
                    : 'text-stone-500 hover:text-stone-300 hover:bg-white/5'}
                `}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        )}
      </div>
    </div>
  );
};

export default Navigation;
