
import React from 'react';
import { AppView } from '../types';

interface NavigationProps {
  activeView: AppView;
  onViewChange: (view: AppView) => void;
  activeNotebookTitle?: string;
  onBackToShelf: () => void;
}

const Navigation: React.FC<NavigationProps> = ({ activeView, onViewChange, activeNotebookTitle, onBackToShelf }) => {
  const tabs: { id: AppView; label: string; icon: string }[] = [
    { id: 'steno', label: 'Pad', icon: '📝' },
    { id: 'research', label: 'Scan', icon: '🔍' },
    { id: 'visuals', label: 'Mood', icon: '🖼️' },
    { id: 'outlines', label: 'Brief', icon: '📑' },
    { id: 'raw', label: 'Raw', icon: '📄' },
  ];

  if (activeView === 'shelf') return null;

  return (
    <nav className="sticky top-0 z-50 bg-stone-900/90 backdrop-blur-md border-b border-stone-800 shadow-xl">
      <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4 overflow-hidden">
          <button 
            onClick={onBackToShelf} 
            className="p-2 bg-stone-800 hover:bg-stone-700 rounded-lg text-stone-300 transition-colors"
            title="Back to Shelf"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 19l-7-7 7-7m8 14l-7-7 7-7"></path></svg>
          </button>
          <span className="font-bold font-mono text-stone-100 truncate text-xs uppercase tracking-widest hidden md:inline">
            {activeNotebookTitle}
          </span>
        </div>

        <div className="flex gap-2">
          {tabs.map((tab) => (
            <button 
              key={tab.id} 
              onClick={() => onViewChange(tab.id)} 
              className={`
                px-4 py-2 rounded-lg flex items-center gap-2 text-[10px] font-black font-mono uppercase transition-all
                ${activeView === tab.id 
                  ? 'bg-amber-500 text-stone-900 shadow-[0_0_15px_rgba(245,158,11,0.4)] scale-105' 
                  : 'text-stone-400 hover:text-stone-100 hover:bg-stone-800'
                }
              `}
            >
              <span className="text-sm">{tab.icon}</span>
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
