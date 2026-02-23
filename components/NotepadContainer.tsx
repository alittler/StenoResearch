
'use client';

import React from 'react';

interface NotepadContainerProps {
  children: React.ReactNode;
  navigation?: React.ReactNode;
  title?: string;
}

const NotepadContainer: React.FC<NotepadContainerProps> = ({ children, navigation, title }) => {
  return (
    <div className="relative w-full">
      <div className="bg-[#fffdf2] border-2 border-stone-200 rounded-t-[2rem] rounded-b-2xl shadow-[0_40px_80px_-20px_rgba(0,0,0,0.1)] relative min-h-[calc(100vh-180px)] flex flex-col paper-texture">
        
        {/* Navigation (Dividers) - Rendered behind the paper layers */}
        {navigation}

        {/* Black Book Binding */}
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

        {/* Layered Torn Page Remnants (Stuck in the binding) */}
        <div className="relative z-20 -mt-6">
          {/* Layer 1: Deepest remnants */}
          <div className="h-1 bg-transparent flex overflow-hidden opacity-20 relative z-10">
            {[...Array(75)].map((_, i) => {
              const waveHeight = Math.sin(i * 0.1) * 30;
              return (
                <div 
                  key={i} 
                  className="flex-1 h-4 bg-stone-500 paper-texture"
                  style={{
                    clipPath: `polygon(0% 0%, 100% 0%, 100% ${10 + waveHeight + Math.random() * 60}%, 50% ${waveHeight + Math.random() * 40}%, 0% ${10 + waveHeight + Math.random() * 60}%)`,
                    marginTop: `-${5 + Math.random() * 5}px`,
                    backgroundSize: '100% 28px',
                    transform: `rotate(${Math.random() * 20 - 10}deg) translateZ(-20px)`
                  }}
                ></div>
              );
            })}
          </div>
          
          {/* Layer 2 */}
          <div className="h-1 bg-transparent flex overflow-hidden -mt-0.5 opacity-30 relative z-20">
            {[...Array(70)].map((_, i) => {
              const waveHeight = Math.sin((i + 10) * 0.12) * 25;
              return (
                <div 
                  key={i} 
                  className="flex-1 h-4 bg-stone-400 paper-texture"
                  style={{
                    clipPath: `polygon(0% 0%, 100% 0%, 100% ${20 + waveHeight + Math.random() * 50}%, 50% ${5 + waveHeight + Math.random() * 30}%, 0% ${20 + waveHeight + Math.random() * 50}%)`,
                    marginTop: `-${4 + Math.random() * 5}px`,
                    backgroundSize: '100% 28px',
                    transform: `rotate(${Math.random() * 16 - 8}deg) translateZ(-15px)`
                  }}
                ></div>
              );
            })}
          </div>

          {/* Layer 3 */}
          <div className="h-1.5 bg-transparent flex overflow-hidden -mt-0.5 opacity-40 drop-shadow-[0_1px_1px_rgba(0,0,0,0.05)] relative z-30">
            {[...Array(65)].map((_, i) => {
              const waveHeight = Math.sin((i + 20) * 0.15) * 20;
              return (
                <div 
                  key={i} 
                  className="flex-1 h-5 bg-stone-300 paper-texture"
                  style={{
                    clipPath: `polygon(0% 0%, 100% 0%, 100% ${30 + waveHeight + Math.random() * 40}%, 50% ${10 + waveHeight + Math.random() * 20}%, 0% ${30 + waveHeight + Math.random() * 40}%)`,
                    marginTop: `-${3 + Math.random() * 5}px`,
                    backgroundSize: '100% 28px',
                    transform: `rotate(${Math.random() * 12 - 6}deg) translateZ(-10px)`
                  }}
                ></div>
              );
            })}
          </div>

          {/* Layer 4 */}
          <div className="h-1.5 bg-transparent flex overflow-hidden -mt-0.5 opacity-50 drop-shadow-[0_1px_2px_rgba(0,0,0,0.1)] relative z-40">
            {[...Array(60)].map((_, i) => {
              const waveHeight = Math.sin((i + 30) * 0.18) * 15;
              return (
                <div 
                  key={i} 
                  className="flex-1 h-5 bg-stone-200 paper-texture"
                  style={{
                    clipPath: `polygon(0% 0%, 100% 0%, 100% ${45 + waveHeight + Math.random() * 30}%, 50% ${15 + waveHeight + Math.random() * 15}%, 0% ${45 + waveHeight + Math.random() * 30}%)`,
                    marginTop: `-${2 + Math.random() * 5}px`,
                    backgroundSize: '100% 28px',
                    transform: `rotate(${Math.random() * 10 - 5}deg) translateZ(-5px)`
                  }}
                ></div>
              );
            })}
          </div>

          {/* Layer 5: Top remnants with shadow */}
          <div className="h-2 bg-transparent flex overflow-hidden -mt-0.5 drop-shadow-[0_2px_2px_rgba(0,0,0,0.15)] relative z-50">
            {[...Array(55)].map((_, i) => {
              const waveHeight = Math.sin((i + 40) * 0.2) * 10;
              return (
                <div 
                  key={i} 
                  className="flex-1 h-6 bg-stone-100 paper-texture"
                  style={{
                    clipPath: `polygon(0% 0%, 100% 0%, 100% ${60 + waveHeight + Math.random() * 25}%, 50% ${25 + waveHeight + Math.random() * 15}%, 0% ${60 + waveHeight + Math.random() * 25}%)`,
                    marginTop: `-${1 + Math.random() * 5}px`,
                    backgroundSize: '100% 28px',
                    transform: `rotate(${Math.random() * 8 - 4}deg) translateZ(0px)`
                  }}
                ></div>
              );
            })}
          </div>
        </div>

        {/* Current Active Page Torn Edge with Subtle Shadow */}
        <div className="h-6 bg-transparent relative z-[60] overflow-hidden flex -mt-1 drop-shadow-[0_2px_3px_rgba(0,0,0,0.15)]">
          {[...Array(45)].map((_, i) => {
            const waveHeight = Math.sin(i * 0.1) * 15;
            return (
              <div 
                key={i} 
                className="flex-1 h-full bg-[#fffdf2] border-t border-stone-200/50 paper-texture"
                style={{
                  clipPath: `polygon(0% 0%, 100% 0%, 100% ${92 + waveHeight + Math.random() * 5}%, 50% ${85 + waveHeight + Math.random() * 8}%, 0% ${92 + waveHeight + Math.random() * 5}%)`,
                  transform: `translateY(-3px) rotate(${Math.random() * 4 - 2}deg)`,
                  backgroundSize: '100% 28px'
                }}
              ></div>
            );
          })}
        </div>

        {/* Content Area */}
        <div className="flex-1 flex flex-col overflow-y-auto steno-margin">
          {children}
        </div>
      </div>
    </div>
  );
};

export default NotepadContainer;
