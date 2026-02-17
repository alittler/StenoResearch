
import React, { useState, useRef, useMemo, useEffect } from 'react';
import { Notebook, ProjectNote } from '../types';

interface ProjectBlueprintProps {
  notebook: Notebook;
  ledgerNotes: ProjectNote[];
  onUpdateNotebook: (updates: Partial<Notebook>) => void;
  onUpdateNote: (id: string, updates: Partial<ProjectNote>) => void;
  onAddNote: (content: string, metadata?: any) => void;
}

const ProjectBlueprint: React.FC<ProjectBlueprintProps> = ({ 
  notebook, 
  ledgerNotes, 
  onUpdateNotebook,
  onUpdateNote,
  onAddNote
}) => {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isStacked, setIsStacked] = useState(false);

  // Constants for the canvas coordinate space
  const DEFAULT_ORIGIN_X = 1800;
  const DEFAULT_ORIGIN_Y = 1800;

  const originX = notebook.metadata?.canvasX ?? DEFAULT_ORIGIN_X;
  const originY = notebook.metadata?.canvasY ?? DEFAULT_ORIGIN_Y;

  const handleDragStart = (e: React.MouseEvent, id: string) => {
    if ((e.target as HTMLElement).tagName === 'TEXTAREA') return;
    setDraggedId(id);
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!draggedId || !canvasRef.current || isStacked) return;
    
    const canvasRect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - canvasRect.left + canvasRef.current.scrollLeft - dragOffset.x;
    const y = e.clientY - canvasRect.top + canvasRef.current.scrollTop - dragOffset.y;

    if (draggedId === 'ORIGIN_CONCEPT') {
      onUpdateNotebook({
        metadata: {
          ...notebook.metadata,
          canvasX: x,
          canvasY: y
        }
      });
    } else {
      onUpdateNote(draggedId, {
        metadata: {
          ...ledgerNotes.find(n => n.id === draggedId)?.metadata,
          canvasX: x,
          canvasY: y
        }
      });
    }
  };

  const handleMouseUp = () => setDraggedId(null);

  const createNewSticky = () => {
    // Position near the current viewport or origin
    const scrollX = canvasRef.current?.scrollLeft || 0;
    const scrollY = canvasRef.current?.scrollTop || 0;
    const initialX = scrollX + 400 + (Math.random() - 0.5) * 400;
    const initialY = scrollY + 400 + (Math.random() - 0.5) * 400;
    onAddNote("New Logic Branch...", { canvasX: initialX, canvasY: initialY });
  };

  const toggleStack = () => setIsStacked(!isStacked);

  // Connections - Bezier curves from center of origin to centers of children
  const connections = useMemo(() => {
    return ledgerNotes.map(note => {
      const startX = originX + 160; // Center of 320px origin
      const startY = originY + 120; // Center of approx height
      const targetX = (note.metadata?.canvasX ?? (originX + 400)) + 144; // Center of 288px width
      const targetY = (note.metadata?.canvasY ?? (originY + 100)) + 100;

      const dx = targetX - startX;
      const cp1x = startX + dx * 0.5;
      const cp1y = startY;
      const cp2x = startX + dx * 0.5;
      const cp2y = targetY;

      return { 
        id: note.id, 
        path: `M ${startX} ${startY} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${targetX} ${targetY}`
      };
    });
  }, [ledgerNotes, originX, originY, isStacked]);

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] animate-fade-in relative overflow-hidden bg-slate-900 rounded-[2.5rem] border border-slate-800 shadow-2xl">
      {/* Blueprint Toolbar */}
      <div className="absolute top-8 left-1/2 -translate-x-1/2 z-[100] flex gap-4 pointer-events-none">
        <div className="bg-slate-900/90 backdrop-blur-xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] p-2.5 rounded-2xl border border-white/10 flex gap-2 pointer-events-auto items-center">
          <button 
            onClick={createNewSticky}
            className="px-6 py-3 bg-blue-600 text-white rounded-xl font-black text-[11px] uppercase tracking-widest hover:bg-blue-500 transition-all flex items-center gap-2 shadow-lg"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 4v16m8-8H4"></path></svg>
            Add Branch
          </button>
          <div className="w-[1px] h-6 bg-white/10 mx-1"></div>
          <button 
            onClick={toggleStack}
            className={`px-6 py-3 rounded-xl font-black text-[11px] uppercase tracking-widest transition-all flex items-center gap-2 ${isStacked ? 'bg-amber-500 text-white shadow-inner shadow-amber-900/20' : 'bg-slate-800 text-slate-400 hover:text-white'}`}
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path></svg>
            {isStacked ? 'Explode View' : 'Stack All'}
          </button>
          <div className="w-[1px] h-6 bg-white/10 mx-1"></div>
          <button 
             onClick={() => canvasRef.current?.scrollTo({ top: originY - 400, left: originX - 400, behavior: 'smooth' })}
             className="p-3 bg-slate-800 text-slate-400 rounded-xl hover:text-white transition-all"
             title="Center on Origin"
          >
             <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 21a9.003 9.003 0 008.34-12.66L12 3 3.66 8.34A9.003 9.003 0 0012 21z"></path></svg>
          </button>
        </div>
      </div>

      <div 
        ref={canvasRef}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onDoubleClick={toggleStack}
        className="flex-1 relative overflow-auto paper-texture cursor-crosshair custom-scrollbar bg-slate-900"
      >
        <div className="w-[4000px] h-[4000px] relative">
          
          <div className="absolute inset-0 pointer-events-none opacity-[0.03] flex items-center justify-center">
            <div className="text-[15vw] font-black uppercase tracking-tighter rotate-12 select-none text-white">BLUEPRINT</div>
          </div>

          {/* Connection Lines Layer */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
            {!isStacked && connections.map(conn => (
              <path 
                key={conn.id}
                d={conn.path} 
                stroke="#3b82f6" 
                strokeWidth="2.5" 
                strokeDasharray="12,12"
                fill="none"
                className="transition-all duration-1000 ease-in-out opacity-40"
              />
            ))}
          </svg>

          {/* ORIGIN: BLUE STICKY (NORTH STAR) */}
          <div 
            onMouseDown={(e) => handleDragStart(e, 'ORIGIN_CONCEPT')}
            className={`absolute w-80 p-8 bg-blue-600 border-4 border-blue-500 shadow-[0_30px_60px_-15px_rgba(37,99,235,0.4)] rounded-[2.5rem] z-[80] transition-all duration-1000 cursor-grab active:cursor-grabbing ${isStacked ? 'scale-110 translate-x-4 translate-y-4 shadow-[0_40px_80px_-10px_rgba(37,99,235,0.5)]' : ''}`}
            style={{ left: `${originX}px`, top: `${originY}px` }}
          >
            <div className="flex items-center gap-2 mb-4">
              <div className="w-2.5 h-2.5 rounded-full bg-blue-300 animate-pulse shadow-sm"></div>
              <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-blue-100">Primary Origin</h2>
            </div>
            <textarea
              className="w-full bg-transparent border-none p-0 text-white font-serif italic text-2xl leading-relaxed focus:ring-0 outline-none resize-none overflow-hidden placeholder:text-blue-200/40 selection:bg-blue-400/50"
              value={notebook.coreConcept}
              onChange={(e) => onUpdateNotebook({ coreConcept: e.target.value })}
              placeholder="Core project vision..."
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) { 
                  e.preventDefault(); 
                  (e.target as HTMLTextAreaElement).blur(); 
                }
              }}
            />
            <div className="mt-6 pt-4 border-t border-blue-500/30">
               <span className="text-[8px] font-black text-blue-200 uppercase tracking-widest opacity-60">The North Star #001</span>
            </div>
          </div>

          {/* CHILDREN: YELLOW STICKIES (LEDGER ENTRIES) */}
          {ledgerNotes.map((note, idx) => {
            const x = isStacked ? originX + 24 + (idx * 0.5) : (note.metadata?.canvasX ?? (originX + 450));
            const y = isStacked ? originY + 24 + (idx * 0.5) : (note.metadata?.canvasY ?? (originY + (idx * 60)));
            
            // Stacking visual noise
            const stackRot = isStacked ? (idx % 2 === 0 ? 1 : -1) * (idx % 5 + 1) : 0;
            const stackOffX = isStacked ? (idx % 3 === 0 ? 5 : -5) : 0;
            const stackOffY = isStacked ? (idx % 2 === 0 ? 5 : -5) : 0;
            
            const zIndex = isStacked ? 70 - idx : 10;
            const opacity = isStacked && idx > 15 ? 0 : 1; 

            return (
              <div 
                key={note.id}
                onMouseDown={(e) => handleDragStart(e, note.id)}
                className={`absolute w-72 p-7 bg-[#fffdf0] border-2 border-amber-100 shadow-2xl rounded-2xl transition-all duration-1000 ease-[cubic-bezier(0.19,1,0.22,1)] cursor-grab active:cursor-grabbing hover:shadow-[0_40px_70px_-15px_rgba(0,0,0,0.3)] ${draggedId === note.id ? 'shadow-[0_50px_90px_-20px_rgba(0,0,0,0.4)] ring-4 ring-blue-400/30 scale-105 z-[100]' : ''}`}
                style={{ 
                  left: `${x + stackOffX}px`, 
                  top: `${y + stackOffY}px`, 
                  transform: `rotate(${stackRot}deg) ${isStacked ? 'scale(0.95)' : ''}`,
                  zIndex, 
                  opacity, 
                  pointerEvents: isStacked ? 'none' : 'auto'
                }}
              >
                {/* Visual binder decoration */}
                <div className="absolute top-0 left-0 w-full h-7 bg-amber-50/50 flex items-center px-4 gap-2 rounded-t-2xl border-b border-amber-100/20">
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-200/50"></div>
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-200/50"></div>
                </div>
                
                <div className="pt-5 relative min-h-[140px]">
                  <div className="absolute left-[-16px] top-4 bottom-0 w-[1.5px] bg-red-200/20"></div>
                  <textarea
                    className="w-full bg-transparent border-none p-0 text-slate-800 font-serif italic text-lg leading-relaxed focus:ring-0 outline-none resize-none overflow-hidden placeholder:text-slate-300"
                    value={note.content}
                    onChange={(e) => onUpdateNote(note.id, { content: e.target.value })}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) { 
                        e.preventDefault(); 
                        (e.target as HTMLTextAreaElement).blur(); 
                      }
                    }}
                  />
                  {!isStacked && (
                    <div className="mt-6 pt-4 border-t border-amber-100/50 flex justify-between items-center opacity-30">
                      <span className="text-[7px] font-black font-mono text-slate-500 uppercase tracking-widest">
                        {new Date(note.timestamp).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      
      {/* Visual Feedback Overlays */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-8 bg-slate-900/95 backdrop-blur-2xl px-10 py-5 rounded-3xl border border-white/10 shadow-[0_30px_100px_rgba(0,0,0,0.8)] z-[110] transition-opacity">
        <div className="flex items-center gap-3">
          <kbd className="px-2 py-1 bg-slate-800 text-slate-100 rounded-lg text-[10px] font-black border border-white/5">ENTER</kbd>
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Blur / Submit</span>
        </div>
        <div className="w-[1px] h-4 bg-white/10"></div>
        <div className="flex items-center gap-3">
          <kbd className="px-2 py-1 bg-slate-800 text-slate-100 rounded-lg text-[10px] font-black border border-white/5">SHIFT+ENTER</kbd>
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Break</span>
        </div>
        <div className="w-[1px] h-4 bg-white/10"></div>
        <p className="text-[10px] font-black text-blue-400 uppercase tracking-[0.3em] animate-pulse">DBL-CLICK Canvas TO COLLAPSE</p>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 10px; height: 10px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.1); border-radius: 20px; border: 3px solid transparent; background-clip: content-box; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255, 255, 255, 0.2); border: 3px solid transparent; background-clip: content-box; }
      `}</style>
    </div>
  );
};

export default ProjectBlueprint;
