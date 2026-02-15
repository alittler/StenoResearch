
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { ProjectNote, Notebook } from '../types';

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
  notebooks?: Notebook[];
}

const StenoPad: React.FC<StenoPadProps> = ({ 
  notes, 
  onAddNote, 
  onUpdateNote, 
  onDeleteNote,
  notebookColor
}) => {
  const [inputValue, setInputValue] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [inputValue]);

  const handleAdd = () => {
    if (inputValue.trim()) {
      onAddNote(inputValue);
      setInputValue('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleAdd();
    }
  };

  const sortedNotes = useMemo(() => 
    [...notes].sort((a, b) => b.timestamp - a.timestamp)
  , [notes]);

  return (
    <div className="relative w-full max-w-2xl mx-auto flex flex-col min-h-[85vh] animate-slide-in mb-12">
      {/* Metallic Spiral Rings */}
      <div className="absolute -top-6 left-0 right-0 flex justify-between px-10 z-40 pointer-events-none">
        {[...Array(16)].map((_, i) => (
          <div key={i} className="flex flex-col items-center">
            <div className="w-3.5 h-10 bg-gradient-to-r from-stone-500 via-stone-200 to-stone-500 rounded-full border border-stone-600 shadow-lg"></div>
          </div>
        ))}
      </div>

      {/* The Pad Body */}
      <div className="flex-1 rounded-b-xl shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] relative overflow-hidden flex flex-col border-t-[16px] border-stone-400 paper-texture">
        {/* Shadow Overlay for Binding */}
        <div className="absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-black/5 to-transparent z-10 pointer-events-none"></div>

        {/* Authentic Ruled Lines */}
        <div className="absolute inset-0 pointer-events-none opacity-20 z-0" 
             style={{ 
               backgroundImage: `linear-gradient(#4a90e2 1px, transparent 1px)`, 
               backgroundSize: '100% 2.25rem',
               backgroundPosition: '0 1.125rem'
             }}>
        </div>

        {/* Double Red Margin Line */}
        <div className="absolute left-[4rem] md:left-[5rem] top-0 bottom-0 w-[1px] bg-red-400 opacity-40 z-10"></div>
        <div className="absolute left-[4.2rem] md:left-[5.2rem] top-0 bottom-0 w-[1px] bg-red-400 opacity-20 z-10"></div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto px-10 md:px-20 pt-16 pb-48 z-20 relative no-scrollbar">
          {notes.length === 0 ? (
            <div className="mt-32 text-center select-none">
              <span className="text-6xl opacity-10 block mb-6">🖋️</span>
              <p className="text-stone-300 font-mono text-[9px] uppercase tracking-[0.5em] font-black">Ready for recording</p>
            </div>
          ) : (
            <div className="space-y-0">
              {sortedNotes.map((note) => (
                <div key={note.id} className="group relative border-b border-stone-200/50 py-3">
                  <div className="flex items-start">
                    <div className="flex-1 min-w-0">
                      {editingId === note.id ? (
                        <textarea
                          autoFocus
                          className="w-full bg-transparent border-none focus:ring-0 font-handwriting text-3xl text-blue-800 p-0 resize-none h-24"
                          defaultValue={note.content}
                          onBlur={(e) => {
                            onUpdateNote(note.id, e.target.value);
                            setEditingId(null);
                          }}
                        />
                      ) : (
                        <p 
                          className="font-handwriting text-3xl md:text-4xl text-stone-800 leading-[2.25rem] cursor-text whitespace-pre-wrap break-words"
                          onClick={() => setEditingId(note.id)}
                        >
                          {note.content}
                        </p>
                      )}
                      <div className="mt-2 flex items-center gap-4 opacity-40 group-hover:opacity-100 transition-opacity">
                        <span className="text-[9px] font-mono text-stone-500 font-bold uppercase">
                          {new Date(note.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                    <button 
                      onClick={() => onDeleteNote(note.id)} 
                      className="opacity-0 group-hover:opacity-100 p-2 text-stone-200 hover:text-red-500 transition-opacity ml-4"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Input Dock */}
        <div className="absolute bottom-0 left-0 right-0 bg-white/40 backdrop-blur-md border-t border-stone-200/50 p-6 md:p-8 z-40">
          <div className="flex items-end gap-6 max-w-xl mx-auto">
            <textarea 
              ref={textareaRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="What did you find?"
              className="flex-1 bg-white/90 rounded-2xl px-6 py-5 font-handwriting text-3xl text-stone-700 placeholder:text-stone-300 border-none focus:ring-4 focus:ring-stone-200 outline-none shadow-xl transition-all"
              rows={1}
            />
            <button 
              onClick={handleAdd}
              disabled={!inputValue.trim()}
              className="px-10 py-5 bg-stone-900 text-white rounded-2xl text-[10px] font-black font-mono uppercase hover:bg-black transition-all active:scale-95 disabled:opacity-10 shadow-2xl"
            >
              Post
            </button>
          </div>
        </div>
      </div>
      
      {/* Visual Depth Cardboard Underlay */}
      <div className="absolute inset-0 -z-10 bg-stone-800/20 translate-x-5 translate-y-5 rounded-xl"></div>
    </div>
  );
};

export default StenoPad;
