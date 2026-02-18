
import React from 'react';
import { AppView } from '../types';

interface NavigationProps {
  activeView: AppView;
  onViewChange: (view: AppView) => void;
  activeNotebookTitle?: string;
  activeNotebookColor?: string;
  onBackToShelf: () => void;
}

const Navigation: React.FC<NavigationProps> = ({ 
  activeView, 
  onViewChange, 
  activeNotebookTitle, 
  activeNotebookColor = '#1e293b',
  onBackToShelf 
}) => {
  const tabs: { id: AppView; label: string; icon: string }[] = [
    { id: 'ledger', label: 'Notes', icon: '📝' },
    { id: 'research', label: 'Research', icon: '🔍' },
    { id: 'raw', label: 'Export', icon: '📄' },
  ];

  return (
    <nav className="sticky top-0 z-50 bg-white border-b border-slate-200 shadow-sm">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button 
            onClick={onBackToShelf}
            className="p-1.5 hover:bg-slate-100 rounded-md transition-colors"
            title="Switch Ledger"
          >
            <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <span className="font-bold text-sm text-slate-900 truncate max-w-[120px] sm:max-w-none">
            {activeNotebookTitle}
          </span>
        </div>

        <div className="flex gap-1 sm:gap-4">
          {tabs.map((tab) => (
            <button 
              key={tab.id} 
              onClick={() => onViewChange(tab.id)} 
              className={`
                px-3 py-1.5 rounded-lg flex items-center gap-2 text-xs font-bold transition-all
                ${activeView === tab.id 
                  ? 'bg-slate-900 text-white shadow-md'
                  : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                }
              `}
            >
              <span>{tab.icon}</span>
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
