
import React from 'react';
import { AppView } from '../types';

interface NavigationProps {
  activeView: AppView;
  onViewChange: (view: AppView) => void;
  activeNotebookTitle?: string;
  activeNotebookColor?: string;
  onBackToShelf: () => void;
}

const getContrastColor = (hex: string) => {
  if (!hex) return 'text-slate-400';
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  return brightness > 128 ? 'text-slate-900' : 'text-white';
};

const Navigation: React.FC<NavigationProps> = ({ 
  activeView, 
  onViewChange, 
  activeNotebookTitle, 
  activeNotebookColor = '#1e293b',
  onBackToShelf 
}) => {
  const tabs: { id: AppView; label: string; icon: string }[] = [
    { id: 'dashboard', label: 'Cmd', icon: '🏠' },
    { id: 'ledger', label: 'Pad', icon: '📝' },
    { id: 'research', label: 'Scan', icon: '🔍' },
    { id: 'raw', label: 'Raw', icon: '📄' },
  ];

  if (activeView === 'shelf') return null;

  const contrastColor = getContrastColor(activeNotebookColor);
  const isDark = contrastColor === 'text-white';

  return (
    <nav 
      className="sticky top-0 z-50 backdrop-blur-md border-b shadow-xl transition-colors duration-500 overflow-x-auto no-scrollbar"
      style={{ 
        backgroundColor: `${activeNotebookColor}EE`,
        borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' 
      }}
    >
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4 flex-shrink-0">
          <button 
            onClick={onBackToShelf} 
            className={`p-2 rounded-lg transition-colors ${isDark ? 'bg-white/10 hover:bg-white/20 text-white' : 'bg-black/10 hover:bg-black/20 text-black'}`}
            title="Back to Shelf"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 19l-7-7 7-7m8 14l-7-7 7-7"></path></svg>
          </button>
          <span className={`font-bold font-mono truncate text-xs uppercase tracking-[0.2em] hidden lg:inline ${contrastColor}`}>
            « {activeNotebookTitle}
          </span>
        </div>

        <div className="flex gap-1">
          {tabs.map((tab) => (
            <button 
              key={tab.id} 
              onClick={() => onViewChange(tab.id)} 
              className={`
                px-3 py-2 rounded-lg flex items-center gap-2 text-[10px] font-black font-mono uppercase transition-all flex-shrink-0
                ${activeView === tab.id 
                  ? (isDark ? 'bg-white text-slate-900 shadow-md ring-1 ring-white/20' : 'bg-slate-900 text-white shadow-md ring-1 ring-black/20')
                  : `${isDark ? 'text-white/60 hover:text-white hover:bg-white/10' : 'text-slate-600 hover:text-slate-900 hover:bg-black/5'}`
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
