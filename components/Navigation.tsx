
'use client';

import React from 'react';
import { AppView } from '../types';
import { LayoutDashboard, BookOpen, Library, MessageSquare, PenTool, FileText } from 'lucide-react';

interface NavigationProps {
  activeView: AppView;
  onViewChange: (view: AppView) => void;
  activeNotebookTitle?: string;
  activeNotebookColor?: string;
  onBackToShelf: () => void;
  hideTabs?: boolean;
  isMobile?: boolean;
}

const Navigation: React.FC<NavigationProps> = ({
  activeView,
  onViewChange,
  activeNotebookTitle,
  activeNotebookColor,
  onBackToShelf,
  hideTabs = false,
  isMobile = false
}) => {
  const tabs: { id: AppView; label: string; icon: React.ReactNode }[] = [
    { id: 'workspace', label: 'Workspace', icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: 'ledger', label: 'Ledger', icon: <BookOpen className="w-4 h-4" /> },
    { id: 'sources', label: 'Sources', icon: <Library className="w-4 h-4" /> },
    { id: 'chat', label: 'Chat', icon: <MessageSquare className="w-4 h-4" /> },
    { id: 'architect', label: 'Architect', icon: <PenTool className="w-4 h-4" /> },
    { id: 'raw', label: 'Raw', icon: <FileText className="w-4 h-4" /> },
  ];

  return (
    <>
      {/* Top Navigation Bar */}
      <div className="px-4">
        <div className="max-w-4xl mx-auto bg-[#1a1a1a] border-b border-black z-50">
          <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
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
            <nav className="flex items-center h-full">
              {tabs.map((tab) => {
                const isMobileHidden = tab.id === 'workspace' || tab.id === 'architect' || tab.id === 'raw';
                const isActive = activeView === tab.id;
                
                return (
                  <button
                    key={tab.id}
                    onClick={() => onViewChange(tab.id)}
                    className={`
                      ${isMobileHidden ? 'hidden md:flex' : 'flex'}
                      items-center justify-center h-full
                      md:px-4 px-2 relative group transition-all
                      ${isActive ? 'text-white' : 'text-stone-500 hover:text-stone-300'}
                    `}
                    title={tab.label}
                  >
                    <span className="text-[9px] font-black uppercase tracking-widest relative z-10">
                      {tab.label}
                    </span>
                    
                    {/* Active Indicator Background */}
                    {isActive && (
                      <div 
                        className="absolute inset-x-1 inset-y-2 rounded-lg opacity-20"
                        style={{ backgroundColor: activeNotebookColor || '#3b82f6' }}
                      />
                    )}
                    
                    {/* Active Bottom Bar */}
                    {isActive && (
                      <div 
                        className="absolute bottom-0 left-0 right-0 h-0.5"
                        style={{ backgroundColor: activeNotebookColor || '#3b82f6' }}
                      />
                    )}

                    {/* Hover Indicator */}
                    {!isActive && (
                      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white/0 group-hover:bg-white/10 transition-all" />
                    )}
                  </button>
                );
              })}
            </nav>
          )}
        </div>
      </div>
    </div>

      {/* Mobile Bottom Navigation */}
      {!hideTabs && isMobile && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-sm bg-[#1a1a1a]/95 backdrop-blur-md rounded-3xl shadow-2xl border border-stone-800 z-[100]">
          <nav className="flex items-center justify-around h-16 px-2">
            {tabs.map((tab) => {
              const isMobileHidden = tab.id === 'workspace' || tab.id === 'architect' || tab.id === 'raw';
              if (isMobileHidden) return null;
              const isActive = activeView === tab.id;
              
              return (
                <button
                  key={tab.id}
                  onClick={() => onViewChange(tab.id)}
                  className={`
                    flex flex-col items-center justify-center w-full h-full gap-1
                    transition-all relative
                    ${isActive ? 'text-white' : 'text-stone-500 hover:text-stone-300'}
                  `}
                >
                  <div 
                    className={`p-2 rounded-xl transition-all relative z-10`}
                    style={isActive ? { backgroundColor: activeNotebookColor || '#3b82f6' } : {}}
                  >
                    {tab.icon}
                  </div>
                  <span className="text-[8px] font-black uppercase tracking-widest relative z-10">{tab.label}</span>
                  
                  {isActive && (
                    <div 
                      className="absolute bottom-2 w-1 h-1 rounded-full"
                      style={{ backgroundColor: activeNotebookColor || '#3b82f6' }}
                    />
                  )}
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
