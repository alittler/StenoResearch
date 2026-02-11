
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
    { id: 'outlines', label: 'Outlines', icon: '📑' },
    { id: 'research', label: 'Research', icon: '🔍' },
    { id: 'raw', label: 'Raw Data', icon: '📄' },
  ];

  if (activeView === 'shelf') {
    return (
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-stone-200 h-16 flex items-center px-4">
        <div className="max-w-5xl mx-auto w-full flex items-center gap-4">
          <div className="w-8 h-8 bg-stone-800 rounded-lg flex items-center justify-center text-white font-bold font-mono">S</div>
          <span className="font-bold font-mono text-stone-800 uppercase tracking-tighter">StenoResearch</span>
        </div>
      </nav>
    );
  }

  return (
    <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-stone-200">
      <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 overflow-hidden">
          <button onClick={onBackToShelf} className="p-2 hover:bg-stone-100 rounded-lg text-stone-400 hover:text-stone-800">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 19l-7-7 7-7m8 14l-7-7 7-7"></path></svg>
          </button>
          <span className="font-bold font-mono text-stone-800 truncate text-sm uppercase">
            {activeNotebookTitle}
          </span>
        </div>
        <div className="flex gap-1 overflow-x-auto no-scrollbar py-2">
          {tabs.map((tab) => (
            <button key={tab.id} onClick={() => onViewChange(tab.id)} className={`px-3 py-1.5 rounded-full flex items-center gap-2 text-xs font-bold whitespace-nowrap ${activeView === tab.id ? 'bg-stone-800 text-white shadow-lg' : 'text-stone-400 hover:bg-stone-100 hover:text-stone-600'}`}>
              <span>{tab.icon}</span>
              <span className="hidden md:inline">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
