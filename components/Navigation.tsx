
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
    { id: 'dashboard', label: 'Home', icon: '🏠' },
    { id: 'ledger', label: 'Pad', icon: '📝' },
    { id: 'research', label: 'Scan', icon: '🔍' },
    { id: 'raw', label: 'Raw', icon: '📄' },
  ];

  const contrastColor = getContrastColor(activeNotebookColor);
  const isDark = contrastColor === 'text-white';

  return (
    <nav 
      className="sticky top-0 z-50 backdrop-blur-md border-b shadow-md transition-colors duration-500"
      style={{ 
        backgroundColor: `${activeNotebookColor}EE`,
        borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' 
      }}
    >
      <div className="max-w-[1400px] mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button 
            onClick={onBackToShelf} 
            className={`p-2 rounded-lg transition-colors ${isDark ? 'bg-white/10 hover:bg-white/20 text-white' : 'bg-black/10 hover:bg-black/20 text-black'}`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 19l-7-7 7-7m8 14l-7-7 7-7"></path></svg>
          </button>
          <span className={`font-black font-mono text-[10px] uppercase tracking-widest hidden lg:inline ${contrastColor}`}>
            LEDGER « {activeNotebookTitle}
          </span>
        </div>

        <div className="flex gap-1 overflow-x-auto no-scrollbar max-w-[70%] sm:max-w-none">
          {tabs.map((tab) => (
            <button 
              key={tab.id} 
              onClick={() => onViewChange(tab.id)} 
              className={`
                px-3 py-2 rounded-xl flex items-center gap-2 text-[9px] font-black font-mono uppercase transition-all shrink-0
                ${activeView === tab.id 
                  ? (isDark ? 'bg-white text-slate-900 shadow-lg' : 'bg-slate-900 text-white shadow-lg')
                  : `${isDark ? 'text-white/60 hover:text-white hover:bg-white/10' : 'text-slate-600 hover:text-slate-900 hover:bg-black/5'}`
                }
              `}
            >
              <span className="text-sm">{tab.icon}</span>
              <span className="hidden xl:inline">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
