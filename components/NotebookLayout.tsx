
'use client';

import React from 'react';

import { AppView } from '../types';

interface NotebookLayoutProps {
  children: React.ReactNode;
  isStenoPad?: boolean;
  activeView?: AppView;
  onViewChange?: (view: AppView) => void;
  hideTabs?: boolean;
}

const NotebookLayout: React.FC<NotebookLayoutProps> = ({ 
  children, 
  isStenoPad,
  activeView,
  onViewChange,
  hideTabs
}) => {
  const tabs: { id: AppView; label: string; icon: string; color: string }[] = [
    { id: 'ledger', label: 'Pad', icon: '📝', color: '#ef4444' }, // Red
    { id: 'research', label: 'Intel', icon: '🔍', color: '#3b82f6' }, // Blue
    { id: 'architect', label: 'Build', icon: '🏗️', color: '#10b981' }, // Green
    { id: 'raw', label: 'Export', icon: '📄', color: '#a855f7' }, // Purple
  ];

  return (
    <div className="relative w-full h-full">
      <div className={`
        bg-[#fffdf2] border-2 border-stone-200 shadow-[0_40px_80px_-20px_rgba(0,0,0,0.1)] relative min-h-[calc(100vh-180px)] flex flex-col paper-texture 
        ${isStenoPad ? 'rounded-t-[2rem] rounded-b-2xl overflow-hidden' : 'rounded-r-3xl border-l-0 ml-8'}
      `}>
        
        {/* Thick Notebook Effect (Stacked Pages) */}
        {!isStenoPad && (
          <>
            <div className="absolute -left-2 top-2 bottom-2 w-2 bg-stone-200 rounded-l-md border-y border-stone-300 z-0"></div>
            <div className="absolute -left-4 top-4 bottom-4 w-2 bg-stone-300 rounded-l-md border-y border-stone-400 z-0 opacity-50"></div>
          </>
        )}

        {/* Side Book Dividers (Attached to the notebook) */}
        {!hideTabs && !isStenoPad && onViewChange && (
          <div className="absolute -right-12 top-1/2 -translate-y-1/2 z-50 flex flex-col gap-1 items-start pointer-events-none">
            {tabs.map((tab, index) => (
              <button 
                key={tab.id} 
                onClick={() => onViewChange(tab.id)} 
                className={`
                  pointer-events-auto
                  relative flex items-center justify-center w-12 h-24 rounded-r-xl transition-all duration-300 group
                  ${activeView === tab.id 
                    ? 'w-16 shadow-[4px_0_10px_rgba(0,0,0,0.1)]'
                    : 'hover:w-14'
                  }
                `}
                style={{ 
                  backgroundColor: tab.color,
                  marginTop: index === 0 ? '0' : '-10px',
                  zIndex: activeView === tab.id ? 10 : 5 - index
                }}
              >
                <div className="flex flex-col items-center gap-2 text-white">
                  <span className="text-xl drop-shadow-sm">{tab.icon}</span>
                  <span className="[writing-mode:vertical-rl] text-[9px] font-black uppercase tracking-widest drop-shadow-sm">
                    {tab.label}
                  </span>
                </div>
                
                {/* Divider Texture */}
                <div className="absolute inset-0 opacity-10 pointer-events-none bg-[radial-gradient(circle_at_center,_rgba(255,255,255,0.2)_0%,_transparent_70%)]"></div>
                <div className="absolute right-0 top-0 bottom-0 w-[1px] bg-black/10"></div>
              </button>
            ))}
          </div>
        )}

        {/* Black Book Binding (Steno Only) */}
        {isStenoPad && (
          <div className="h-20 bg-[#1a1a1a] border-b border-black relative z-20 overflow-visible shadow-lg">
            {/* Leather-like texture overlay */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none" 
                 style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.65\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\'/%3E%3C/svg%3E")' }}></div>
            
            <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-transparent to-black/60"></div>
            <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent h-1/3"></div>
            
            {/* Spine Ribbing Details */}
            <div className="absolute inset-x-0 top-0 bottom-0 flex justify-around px-16 items-center opacity-20 pointer-events-none">
              {[...Array(12)].map((_, i) => (
                <div key={i} className="w-[1px] h-full bg-black shadow-[1px_0_0_rgba(255,255,255,0.05)]"></div>
              ))}
            </div>

            {/* Heavy Duty Stitches */}
            <div className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 flex gap-16">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="w-2 h-12 bg-[#2a2a2a] rounded-full shadow-[inset_0_2px_4px_rgba(0,0,0,0.8),0_1px_1px_rgba(255,255,255,0.1)] border border-black/50"></div>
              ))}
            </div>
          </div>
        )}

        {/* Spiral Coils (Notebook Only) */}
        {!isStenoPad && (
          <div className="absolute left-0 top-0 bottom-0 w-12 flex flex-col justify-around py-8 z-30 pointer-events-none">
            {[...Array(24)].map((_, i) => (
              <div key={i} className="relative w-16 -left-8 h-3">
                {/* The Wire Loop */}
                <div className="absolute inset-0 bg-gradient-to-b from-stone-400 via-stone-200 to-stone-500 rounded-full border border-stone-600/30 shadow-sm"></div>
                {/* The Hole in the paper */}
                <div className="absolute right-2 top-1/2 -translate-y-1/2 w-2 h-2 bg-stone-800/20 rounded-full"></div>
              </div>
            ))}
          </div>
        )}

        {/* Layered Torn Page Remnants (Steno Only) */}
        {isStenoPad && (
          <div className="relative z-10 -mt-4">
            {/* Layer 1: Deepest remnants */}
            <div className="h-1 bg-transparent flex overflow-hidden opacity-20">
              {[...Array(75)].map((_, i) => {
                const waveHeight = Math.sin(i * 0.1) * 30;
                return (
                  <div 
                    key={i} 
                    className="flex-1 h-4 bg-stone-500 paper-texture"
                    style={{
                      clipPath: `polygon(0% 0%, 100% 0%, 100% ${10 + waveHeight + Math.random() * 60}%, 50% ${waveHeight + Math.random() * 40}%, 0% ${10 + waveHeight + Math.random() * 60}%)`,
                      marginTop: `-${5 + Math.random() * 3}px`,
                      backgroundSize: '20px 20px',
                      transform: `rotate(${Math.random() * 10 - 5}deg)`
                    }}
                  ></div>
                );
              })}
            </div>
            
            {/* Layer 2 */}
            <div className="h-1 bg-transparent flex overflow-hidden -mt-0.5 opacity-30">
              {[...Array(70)].map((_, i) => {
                const waveHeight = Math.sin((i + 10) * 0.12) * 25;
                return (
                  <div 
                    key={i} 
                    className="flex-1 h-4 bg-stone-400 paper-texture"
                    style={{
                      clipPath: `polygon(0% 0%, 100% 0%, 100% ${20 + waveHeight + Math.random() * 50}%, 50% ${5 + waveHeight + Math.random() * 30}%, 0% ${20 + waveHeight + Math.random() * 50}%)`,
                      marginTop: `-${4 + Math.random() * 3}px`,
                      backgroundSize: '20px 20px',
                      transform: `rotate(${Math.random() * 8 - 4}deg)`
                    }}
                  ></div>
                );
              })}
            </div>

            {/* Layer 3 */}
            <div className="h-1.5 bg-transparent flex overflow-hidden -mt-0.5 opacity-40 drop-shadow-[0_1px_1px_rgba(0,0,0,0.05)]">
              {[...Array(65)].map((_, i) => {
                const waveHeight = Math.sin((i + 20) * 0.15) * 20;
                return (
                  <div 
                    key={i} 
                    className="flex-1 h-5 bg-stone-300 paper-texture"
                    style={{
                      clipPath: `polygon(0% 0%, 100% 0%, 100% ${30 + waveHeight + Math.random() * 40}%, 50% ${10 + waveHeight + Math.random() * 20}%, 0% ${30 + waveHeight + Math.random() * 40}%)`,
                      marginTop: `-${3 + Math.random() * 3}px`,
                      backgroundSize: '20px 20px',
                      transform: `rotate(${Math.random() * 6 - 3}deg)`
                    }}
                  ></div>
                );
              })}
            </div>

            {/* Layer 4 */}
            <div className="h-1.5 bg-transparent flex overflow-hidden -mt-0.5 opacity-50 drop-shadow-[0_1px_2px_rgba(0,0,0,0.1)]">
              {[...Array(60)].map((_, i) => {
                const waveHeight = Math.sin((i + 30) * 0.18) * 15;
                return (
                  <div 
                    key={i} 
                    className="flex-1 h-5 bg-stone-200 paper-texture"
                    style={{
                      clipPath: `polygon(0% 0%, 100% 0%, 100% ${45 + waveHeight + Math.random() * 30}%, 50% ${15 + waveHeight + Math.random() * 15}%, 0% ${45 + waveHeight + Math.random() * 30}%)`,
                      marginTop: `-${2 + Math.random() * 3}px`,
                      backgroundSize: '20px 20px',
                      transform: `rotate(${Math.random() * 4 - 2}deg)`
                    }}
                  ></div>
                );
              })}
            </div>

            {/* Layer 5: Top remnants with shadow */}
            <div className="h-2 bg-transparent flex overflow-hidden -mt-0.5 drop-shadow-[0_2px_2px_rgba(0,0,0,0.15)]">
              {[...Array(55)].map((_, i) => {
                const waveHeight = Math.sin((i + 40) * 0.2) * 10;
                return (
                  <div 
                    key={i} 
                    className="flex-1 h-6 bg-stone-100 paper-texture"
                    style={{
                      clipPath: `polygon(0% 0%, 100% 0%, 100% ${60 + waveHeight + Math.random() * 25}%, 50% ${25 + waveHeight + Math.random() * 15}%, 0% ${60 + waveHeight + Math.random() * 25}%)`,
                      marginTop: `-${1 + Math.random() * 3}px`,
                      backgroundSize: '20px 20px',
                      transform: `rotate(${Math.random() * 2 - 1}deg)`
                    }}
                  ></div>
                );
              })}
            </div>
          </div>
        )}

        {/* Current Active Page Torn Edge (Steno Only) */}
        {isStenoPad && (
          <div className="h-6 bg-transparent relative z-10 overflow-hidden flex -mt-1 drop-shadow-[0_2px_3px_rgba(0,0,0,0.15)]">
            {[...Array(45)].map((_, i) => {
              const waveHeight = Math.sin(i * 0.1) * 15;
              return (
                <div 
                  key={i} 
                  className="flex-1 h-full bg-[#fffdf2] border-t border-stone-200/50 paper-texture"
                  style={{
                    clipPath: `polygon(0% 0%, 100% 0%, 100% ${92 + waveHeight + Math.random() * 5}%, 50% ${85 + waveHeight + Math.random() * 8}%, 0% ${92 + waveHeight + Math.random() * 5}%)`,
                    transform: `translateY(-3px) rotate(${Math.random() * 1 - 0.5}deg)`,
                    backgroundSize: '20px 20px'
                  }}
                ></div>
              );
            })}
          </div>
        )}

        {/* Writing Surface Container */}
        <div className={`flex-1 relative ${!isStenoPad ? 'pl-20 md:pl-32' : ''}`}>
          {/* Vertical Margin Line */}
          <div className={`
            absolute top-0 bottom-0 w-[2px] bg-red-200/40 pointer-events-none z-10
            ${isStenoPad ? 'left-1/2 -translate-x-1/2' : 'left-24 md:left-36'}
          `}></div>
          
          <div className="h-full">
            {children}
          </div>
        </div>
      </div>
      
      {/* Visual background details */}
      <div className="absolute right-0 top-1/4 w-32 h-64 bg-stone-200/5 rotate-12 blur-3xl pointer-events-none"></div>
    </div>
  );
};

export default NotebookLayout;
