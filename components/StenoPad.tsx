
import React, { useState, useRef, useEffect } from 'react';
import { ProjectNote } from '../types';

interface StenoPadProps {
  notes: ProjectNote[];
  onAddNote: (content: string) => void;
  onDeleteNote: (id: string) => void;
}

const StenoPad: React.FC<StenoPadProps> = ({ notes, onAddNote, onDeleteNote }) => {
  const [inputValue, setInputValue] = useState('');
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

  return (
    <div className="max-w-4xl mx-auto py-6 px-4 animate-fade-in">
      <div className="bg-[#fffdf2] rounded-xl shadow-[0_25px_50px_-12px_rgba(0,0,0,0.15)] relative min-h-[80vh] flex flex-col border border-stone-300">
        
        {/* Top Bound Spiral */}
        <div className="h-12 flex items-center justify-around px-8 bg-stone-100 rounded-t-xl border-b border-stone-300 relative">
          {[...Array(12)].map((_, i) => (
            <div key={i} className="w-5 h-8 spiral-bind rounded-full -mt-12 border border-stone-400 shadow-md"></div>
          ))}
        </div>

        <div className="flex-1 steno-paper p-10 md:p-16 relative overflow-hidden">
          <div className="relative z-10 space-y-8">
            <div className="flex items-center justify-between mb-4 border-b border-stone-300 pb-2">
              <div className="flex items-center gap-4">
                <span className="text-[10px] font-black uppercase tracking-widest text-stone-400 font-mono">Ledger Entry</span>
              </div>
              <div className="h-[1px] flex-1 bg-stone-200 mx-4 hidden md:block"></div>
              <div className="text-[8px] font-mono font-black text-stone-300 uppercase tracking-tighter">Verified Content-Addressable Ledger</div>
            </div>
            
            <textarea
              ref={textareaRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Record the current status..."
              className="w-full bg-transparent border-none text-2xl md:text-3xl font-serif-italic text-stone-800 focus:ring-0 outline-none resize-none overflow-hidden placeholder:text-stone-300 leading-[32px] pt-1"
              autoFocus
            />

            <div className="flex justify-end pt-4">
              <button 
                onClick={handleAdd}
                disabled={!inputValue.trim()}
                className="px-6 py-2 bg-stone-900 text-white rounded font-black text-[10px] uppercase tracking-widest hover:bg-black transition-all disabled:opacity-20 shadow-md"
              >
                Log Entry
              </button>
            </div>

            {/* Past Notes with SHA/Date display */}
            <div className="mt-20 space-y-16 pb-32">
              {notes.map((note, idx) => (
                <div key={note.id} className="group relative">
                  <div className="flex justify-between items-center mb-4 border-b border-stone-200 pb-2">
                    <div className="flex items-center gap-4">
                        <span className="text-[10px] font-black text-blue-600 font-mono uppercase tracking-tighter">
                          SHA: {(note.hash || note.id).substring(0, 12).toUpperCase()}
                        </span>
                        <span className="text-[9px] font-mono font-bold text-stone-400 uppercase tracking-widest">
                          ENTRY #{notes.length - idx} — {new Date(note.timestamp).toLocaleString()}
                        </span>
                    </div>
                    <button 
                      onClick={() => onDeleteNote(note.id)} 
                      className="opacity-0 group-hover:opacity-100 p-2 text-stone-300 hover:text-red-500 transition-all"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                      </svg>
                    </button>
                  </div>
                  <div className="font-serif-italic text-xl md:text-2xl text-stone-700 leading-[32px] whitespace-pre-wrap">
                    {note.content}
                  </div>
                </div>
              ))}
              {notes.length === 0 && (
                  <div className="text-center py-20 opacity-20 italic font-serif text-2xl">
                    Ledger is currently empty. Start writing to begin the history.
                  </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StenoPad;
