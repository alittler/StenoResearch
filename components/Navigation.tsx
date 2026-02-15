
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
    { id: 'steno', label: 'Notepad', icon: '📝' },
    { id: 'visuals', label: 'Visuals', icon: '🖼️' },
    { id: 'outlines', label: 'Outlines', icon: '📑' },
    { id: 'research', label: 'Research', icon: '🔍' },
    { id: 'raw', label: 'Raw Data', icon: '📄' },
  ];

  if (activeView === 'shelf') {
    return (
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-stone-200 h-14 md:h-16 flex items-center px-4">
        <div className="max-w-5xl mx-auto w-full flex items-center gap-3">
          <div className="w-7 h-7 md:w-8 md:h-8 bg-stone-800 rounded-lg flex items-center justify-center text-white font-bold font-mono text-sm">S</div>
          <span className="font-bold font-mono text-stone-800 uppercase tracking-tighter text-sm md:text-base">StenoResearch</span>
        </div>
      </nav>
    );
  }

  return (
    <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-stone-200">
      <div className="max-w-5xl mx-auto px-4 h-auto md:h-16 py-2 md:py-0 flex flex-col md:flex-row items-center justify-between gap-2 md:gap-4">
        <div className="flex items-center gap-2 md:gap-3 w-full md:w-auto overflow-hidden">
          <button onClick={onBackToShelf} className="p-1.5 md:p-2 hover:bg-stone-100 rounded-lg text-stone-400 hover:text-stone-800">
            <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 19l-7-7 7-7m8 14l-7-7 7-7"></path></svg>
          </button>
          <span className="font-bold font-mono text-stone-800 truncate text-[10px] md:text-sm uppercase flex-1 min-w-0">
            {activeNotebookTitle}
          </span>
        </div>
        <div className="flex gap-1 overflow-x-auto no-scrollbar py-1 w-full md:w-auto justify-center md:justify-end">
          {tabs.map((tab) => (
            <button 
              key={tab.id} 
              onClick={() => onViewChange(tab.id)} 
              className={`px-2 md:px-3 py-1.5 rounded-full flex items-center gap-1.5 md:gap-2 text-[10px] md:text-xs font-bold whitespace-nowrap transition-all ${activeView === tab.id ? 'bg-stone-800 text-white shadow-lg' : 'text-stone-400 hover:bg-stone-100 hover:text-stone-600'}`}
            >
              <span>{tab.icon}</span>
              <span className="inline">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
