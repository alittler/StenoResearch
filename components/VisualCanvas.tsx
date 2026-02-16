
import React, { useState, useRef, useEffect } from 'react';
import { ProjectNote, NoteType } from '../types';

interface VisualCanvasProps {
  notes: ProjectNote[];
  onUpdateNote: (id: string, updates: Partial<ProjectNote>) => void;
  onAddNote: (content: string, type: NoteType, extra: any) => void;
}

const VisualCanvas: React.FC<VisualCanvasProps> = ({ notes, onUpdateNote, onAddNote }) => {
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleWheel = (e: React.WheelEvent) => {
    if (e.ctrlKey) {
      setScale(s => Math.min(Math.max(s - e.deltaY * 0.001, 0.1), 2));
    } else {
      setOffset(o => ({ x: o.x - e.deltaX, y: o.y - e.deltaY }));
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 1 || e.altKey) {
      setIsPanning(true);
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isPanning) {
      setOffset(o => ({ x: o.x + e.movementX, y: o.y + e.movementY }));
    }
  };

  const handleMouseUp = () => setIsPanning(false);

  const handleDragNoteEnd = (id: string, e: React.DragEvent) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = (e.clientX - rect.left - offset.x) / scale;
    const y = (e.clientY - rect.top - offset.y) / scale;
    onUpdateNote(id, { metadata: { ...notes.find(n => n.id === id)?.metadata, canvasX: x, canvasY: y } });
  };

  return (
    <div 
      ref={containerRef}
      className="relative w-full h-full bg-[#111] overflow-hidden cursor-grab active:cursor-grabbing select-none"
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* Background Grid */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-10"
        style={{ 
          backgroundImage: `radial-gradient(circle, #fff 1px, transparent 1px)`,
          backgroundSize: `${20 * scale}px ${20 * scale}px`,
          backgroundPosition: `${offset.x}px ${offset.y}px`
        }}
      />

      <div 
        className="absolute transition-transform duration-75 ease-out"
        style={{ 
          transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
          transformOrigin: '0 0'
        }}
      >
        {notes.map(note => {
          const x = note.metadata?.canvasX ?? 100;
          const y = note.metadata?.canvasY ?? 100;
          
          return (
            <div 
              key={note.id}
              draggable
              onDragEnd={(e) => handleDragNoteEnd(note.id, e)}
              className={`absolute p-4 w-64 rounded-xl border shadow-2xl transition-shadow cursor-move ${
                note.type === 'research' ? 'bg-stone-800 border-blue-500/30' : 
                note.type === 'outline' ? 'bg-stone-800 border-purple-500/30' : 
                'bg-stone-800 border-stone-700'
              }`}
              style={{ left: x, top: y }}
            >
              <div className="flex justify-between items-start mb-2">
                <span className="text-[8px] font-black font-mono text-stone-500 uppercase">{note.type}</span>
                {note.metadata?.imageData && <span className="text-xs">🖼️</span>}
              </div>
              <p className="text-[10px] font-mono text-stone-300 line-clamp-4 leading-relaxed whitespace-pre-wrap">
                {note.content}
              </p>
              {note.metadata?.urls && note.metadata.urls.length > 0 && (
                <div className="mt-2 pt-2 border-t border-stone-700 flex gap-1 overflow-hidden">
                  {note.metadata.urls.slice(0, 2).map((u, i) => (
                    <span key={i} className="text-[8px] text-blue-400 truncate max-w-full">🔗 {u}</span>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="absolute bottom-6 left-6 flex gap-2">
        <div className="bg-stone-900/80 backdrop-blur-md px-4 py-2 rounded-full border border-white/10 text-[10px] font-mono text-stone-400">
          Scale: {Math.round(scale * 100)}% | Drag notes to organize
        </div>
      </div>
    </div>
  );
};

export default VisualCanvas;
