
'use client';

import React from 'react';
import { AppView } from '../types';
import { LayoutDashboard, BookOpen, Library, MessageSquare, PenTool, FileText } from 'lucide-react';

interface NavigationProps {
  activeView: AppView;
  onViewChange: (view: AppView) => void;
  activeNotebookTitle?: string;
  onBackToShelf: () => void;
  hideTabs?: boolean;
  isMobile?: boolean;
}

const Navigation: React.FC<NavigationProps> = ({
  activeView,
  onViewChange,
  activeNotebookTitle,
  onBackToShelf,
  hideTabs = false,
  isMobile = false
}) => {
  const tabs: { id: AppView; label: string; color: string; icon: React.ReactNode }[] = [
    { id: 'workspace', label: 'Workspace', color: 'bg-blue-500', icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: 'ledger', label: 'Ledger', color: 'bg-emerald-500', icon: <BookOpen className="w-4 h-4" /> },
    { id: 'sources', label: 'Sources', color: 'bg-amber-500', icon: <Library className="w-4 h-4" /> },
    { id: 'chat', label: 'Chat', color: 'bg-indigo-500', icon: <MessageSquare className="w-4 h-4" /> },
    { id: 'architect', label: 'Architect', color: 'bg-purple-500', icon: <PenTool className="w-4 h-4" /> },
    { id: 'raw', label: 'Raw', color: 'bg-stone-500', icon: <FileText className="w-4 h-4" /> },
  ];

  return (
    <>
      {/* Top Navigation Bar */}
      <div className="w-full bg-[#1a1a1a] border-b border-black z-50">
        <div className="max-w-[1600px] mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-4 md:gap-6">
            <button 
              onClick={onBackToShelf}
              className="flex items-center gap-2 text-stone-400 hover:text-white transition-colors group"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
              </svg>
              <span className="hidden md:inline text-[10px] font-black uppercase tracking-[0.2em]">Shelf</span>
            </button>
            
            <div className="h-4 w-[1px] bg-stone-800" />
            
            <div className="flex items-center gap-2">
              <h1 className="text-white font-black uppercase tracking-[0.3em] text-[10px] truncate max-w-[120px] md:max-w-[200px]">
                {activeNotebookTitle || 'Untitled Ledger'}
              </h1>
            </div>
          </div>

          {/* Desktop Tabs */}
          {!hideTabs && !isMobile && (
            <nav className="flex items-center gap-1 md:gap-1">
              {tabs.map((tab) => {
                const isMobileHidden = tab.id === 'workspace' || tab.id === 'architect' || tab.id === 'raw';
                return (
                  <button
                    key={tab.id}
                    onClick={() => onViewChange(tab.id)}
                    className={`
                      ${isMobileHidden ? 'hidden md:flex' : 'flex'}
                      items-center justify-center
                      md:px-4 md:py-2 p-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all
                      ${activeView === tab.id 
                        ? `${tab.color} text-white shadow-lg` 
                        : 'text-stone-500 hover:text-stone-300 hover:bg-white/5'}
                    `}
                    title={tab.label}
                  >
                    <span className="hidden md:inline">{tab.label}</span>
                    <span className="md:hidden">{tab.icon}</span>
                  </button>
                );
              })}
            </nav>
          )}
        </div>
      </div>

      {/* Mobile Bottom Navigation */}
      {!hideTabs && isMobile && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-sm bg-[#1a1a1a]/95 backdrop-blur-md rounded-3xl shadow-2xl border border-stone-800 z-[100]">
          <nav className="flex items-center justify-around h-16 px-2">
            {tabs.map((tab) => {
              const isMobileHidden = tab.id === 'workspace' || tab.id === 'architect' || tab.id === 'raw';
              if (isMobileHidden) return null;
              
              return (
                <button
                  key={tab.id}
                  onClick={() => onViewChange(tab.id)}
                  className={`
                    flex flex-col items-center justify-center w-full h-full gap-1
                    transition-all
                    ${activeView === tab.id 
                      ? 'text-white' 
                      : 'text-stone-500 hover:text-stone-300'}
                  `}
                >
                  <div className={`
                    p-2 rounded-xl transition-all
                    ${activeView === tab.id ? tab.color : 'bg-transparent'}
                  `}>
                    {tab.icon}
                  </div>
                  <span className="text-[8px] font-black uppercase tracking-widest">{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
      )}
    </>
  );
};

export default Navigation;
