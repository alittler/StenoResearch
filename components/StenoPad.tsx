
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { ProjectNote } from '../types';

interface StenoPadProps {
  notes: ProjectNote[];
  onAddNote: (content: string) => void;
  onUpdateNote: (id: string, content: string) => void;
  onDeleteNote: (id: string) => void;
  onUndo?: () => void;
  onRedo?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
  notebookColor?: string;
}

const StenoPad: React.FC<StenoPadProps> = ({ 
  notes, 
  onAddNote, 
  onUpdateNote, 
  onDeleteNote, 
  notebookColor = '#fffef0' 
}) => {
  const [inputValue, setInputValue] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${textarea.scrollHeight}px`;
    }
  }, [inputValue]);

  const triggerAddNote = () => {
    if (inputValue.trim()) {
      onAddNote(inputValue);
      setInputValue('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      triggerAddNote();
    }
  };

  const sortedNotes = useMemo(() => 
    [...notes].sort((a, b) => b.timestamp - a.timestamp)
  , [notes]);

  return (
    <div className="relative max-w-3xl mx-auto flex flex-col min-h-[70vh] animate-in slide-in-from-bottom-8 duration-700">
      {/* Metallic Spiral Rings */}
      <div className="absolute -top-8 left-0 right-0 flex justify-between px-10 md:px-16 z-30 pointer-events-none">
        {[...Array(12)].map((_, i) => (
          <div key={i} className="flex flex-col items-center">
            <div className="w-4 h-12 bg-gradient-to-r from-stone-400 via-stone-100 to-stone-400 rounded-full border border-stone-500 shadow-md"></div>
          </div>
        ))}
      </div>

      {/* Main Paper Body */}
      <div 
        className="flex-1 rounded-b-xl shadow-[0_25px_50px_-12px_rgba(0,0,0,0.25)] relative overflow-hidden flex flex-col border-t-[10px] border-stone-300" 
        style={{ backgroundColor: notebookColor }}
      >
        {/* Subtle Horizontal Ruling (Ruled Paper Effect) */}
        <div className="absolute inset-0 pointer-events-none opacity-40 z-0" 
             style={{ 
               backgroundImage: `linear-gradient(#add8e6 1px, transparent 1px)`, 
               backgroundSize: '100% 2.2rem',
               backgroundPosition: '0 1.1rem'
             }}>
        </div>

        {/* Double Red Vertical Margin */}
        <div className="absolute left-[3.5rem] md:left-[5rem] top-0 bottom-0 w-[1px] bg-red-400 opacity-40 z-10"></div>
        <div className="absolute left-[3.7rem] md:left-[5.2rem] top-0 bottom-0 w-[1px] bg-red-400 opacity-20 z-10"></div>

        <div className="flex-1 overflow-y-auto px-8 md:px-24 pt-16 pb-40 z-20 relative no-scrollbar">
          {notes.length === 0 ? (
            <div className="mt-20 text-center">
              <span className="text-4xl opacity-20 block mb-4">✍️</span>
              <p className="text-stone-300 font-mono text-sm uppercase tracking-[0.3em] font-bold">Awaiting Observations...</p>
            </div>
          ) : (
            <div className="space-y-0">
              {sortedNotes.map((note) => (
                <div key={note.id} className="group relative border-b border-stone-200/50 py-2">
                  <div className="flex items-start">
                    <div className="flex-1 min-w-0">
                      {editingId === note.id ? (
                        <textarea
                          autoFocus
                          className="w-full bg-transparent border-none focus:ring-0 font-handwriting text-2xl text-blue-800 p-0 resize-none h-24"
                          defaultValue={note.content}
                          onBlur={(e) => {
                            onUpdateNote(note.id, e.target.value);
                            setEditingId(null);
                          }}
                        />
                      ) : (
                        <p 
                          className="font-handwriting text-2xl md:text-3xl text-stone-800 leading-[2.2rem] cursor-text"
                          onClick={() => setEditingId(note.id)}
                        >
                          {note.content}
                        </p>
                      )}
                      <span className="text-[9px] font-mono text-stone-400 uppercase tracking-tighter block mt-1">
                        {new Date(note.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <button 
                      onClick={() => onDeleteNote(note.id)} 
                      className="opacity-0 group-hover:opacity-100 p-1 text-red-300 hover:text-red-500 transition-opacity ml-4"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12"></path></svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Floating Input Dock at the bottom of the pad */}
        <div className="absolute bottom-0 left-0 right-0 bg-white/70 backdrop-blur-md border-t border-stone-200/50 p-6 z-30">
          <div className="flex items-end gap-4 max-w-2xl mx-auto">
            <textarea 
              ref={textareaRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Scribble here..."
              className="flex-1 bg-stone-100/50 rounded-xl px-5 py-3 font-handwriting text-2xl text-stone-700 placeholder:text-stone-300 border border-stone-200 focus:ring-2 focus:ring-stone-400 focus:border-transparent outline-none transition-all"
              rows={1}
            />
            <button 
              onClick={triggerAddNote}
              disabled={!inputValue.trim()}
              className="px-6 py-4 bg-stone-800 text-white rounded-xl text-xs font-bold font-mono uppercase hover:bg-black transition-all active:scale-95 disabled:opacity-30 shadow-lg"
            >
              Post
            </button>
          </div>
        </div>
      </div>
      
      {/* Decorative Cardboard Backing */}
      <div className="absolute inset-0 -z-10 bg-amber-900/10 translate-x-3 translate-y-3 rounded-xl"></div>
    </div>
  );
};

export default StenoPad;
