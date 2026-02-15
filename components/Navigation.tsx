
import React from 'react';
import { AppView } from '../types';

interface NavigationProps {
  activeView: AppView;
  onViewChange: (view: AppView) => void;
  activeNotebookTitle?: string;
  onBackToShelf: () => void;
}

const Navigation: React.FC<NavigationProps> = ({ activeView, onViewChange, activeNotebookTitle, onBackToShelf }) => {
  const tabs: { id: AppView; label: string; icon: string; color: string }[] = [
    { id: 'steno', label: 'PAD', icon: '📝', color: 'bg-stone-800' },
    { id: 'research', label: 'SCAN', icon: '🔍', color: 'bg-blue-800' },
    { id: 'visuals', label: 'MOOD', icon: '🖼️', color: 'bg-rose-800' },
    { id: 'outlines', label: 'BRIEF', icon: '📑', color: 'bg-emerald-800' },
    { id: 'raw', label: 'RAW', icon: '📄', color: 'bg-amber-800' },
  ];

  return (
    <nav className="sticky top-0 z-50 bg-stone-100/40 backdrop-blur-xl border-b border-stone-200/50 h-16 md:h-20 flex items-center">
      <div className="max-w-5xl mx-auto w-full px-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button 
            onClick={onBackToShelf} 
            className="flex items-center gap-2 px-3 py-1.5 bg-stone-200 hover:bg-stone-300 text-stone-600 rounded-lg text-[10px] font-black font-mono transition-all shadow-sm active:scale-95"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M15 19l-7-7 7-7"></path></svg>
            LEDGER SHELF
          </button>
          <div className="h-4 w-[1px] bg-stone-300"></div>
          <span className="font-bold font-mono text-stone-800 text-sm uppercase tracking-tighter truncate max-w-[120px] md:max-w-none">
            {activeNotebookTitle}
          </span>
        </div>

        <div className="flex items-center -mb-[4px] md:-mb-0 gap-1 md:gap-2">
          {tabs.map((tab) => (
            <button 
              key={tab.id} 
              onClick={() => onViewChange(tab.id)} 
              className={`
                relative px-3 md:px-5 py-2 md:py-3 rounded-t-xl transition-all flex items-center gap-2
                ${activeView === tab.id 
                  ? `${tab.color} text-white shadow-[-5px_0_10px_rgba(0,0,0,0.1)] -translate-y-1` 
                  : 'bg-stone-200 text-stone-400 hover:bg-stone-300 hover:text-stone-600'
                }
              `}
            >
              <span className="text-xs md:text-sm">{tab.icon}</span>
              <span className="font-black font-mono text-[9px] md:text-[11px] tracking-widest">{tab.label}</span>
              
              {activeView === tab.id && (
                <div className="absolute -bottom-2 left-0 right-0 h-2 bg-inherit"></div>
              )}
            </button>
          ))}
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
