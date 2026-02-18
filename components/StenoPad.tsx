
import React, { useState, useRef, useEffect } from 'react';
import { ProjectNote } from '../types';
import { marked } from 'marked';

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
    <div className="max-w-4xl mx-auto py-2 px-1 animate-fade-in">
      <div className="bg-[#fffdf2] border-[1px] border-stone-300 rounded-t-[3rem] rounded-b-xl shadow-[0_50px_100px_-20px_rgba(0,0,0,0.25)] relative min-h-[85vh] flex flex-col paper-texture">
        
        {/* Animated Metal Spiral Binding */}
        <div className="h-16 bg-stone-200 border-b border-stone-300 flex items-center justify-between px-10 relative z-30 shadow-inner">
          <div className="absolute inset-0 bg-gradient-to-b from-stone-400/30 to-transparent pointer-events-none"></div>
          {[...Array(14)].map((_, i) => (
            <div key={i} className="group flex flex-col items-center relative">
              <div className="w-6 h-14 bg-gradient-to-r from-stone-500 via-stone-300 to-stone-400 rounded-full border border-stone-600 -mt-10 shadow-lg z-40"></div>
              <div className="w-3 h-3 rounded-full bg-stone-500/40 shadow-inner mt-2"></div>
            </div>
          ))}
        </div>

        <div className="flex-1 relative p-10 md:p-16 lg:p-20 overflow-hidden">
          {/* Authentic Vertical Margin Lines */}
          <div className="absolute left-20 md:left-28 lg:left-36 top-0 bottom-0 w-[2px] bg-red-400/40 pointer-events-none"></div>
          <div className="absolute left-[84px] md:left-[116px] lg:left-[148px] top-0 bottom-0 w-[1px] bg-red-400/20 pointer-events-none"></div>
          
          <div className="pl-16 md:pl-24 lg:pl-32 space-y-10 relative z-10">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                <span className="text-[9px] font-black uppercase tracking-[0.3em] text-stone-400 font-mono">Ledger Input</span>
              </div>
              <textarea
                ref={textareaRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Start writing..."
                className="w-full bg-transparent border-none text-2xl md:text-3xl font-serif italic text-stone-800 focus:ring-0 outline-none resize-none overflow-hidden placeholder:text-stone-300 leading-relaxed"
                autoFocus
              />
              <div className="flex justify-end pt-4">
                <button 
                  onClick={handleAdd}
                  disabled={!inputValue.trim()}
                  className="px-8 py-2.5 bg-stone-900 text-white rounded-lg text-[9px] font-black uppercase tracking-[0.3em] hover:bg-black transition-all shadow-xl"
                >
                  Log Entry
                </button>
              </div>
            </div>

            <div className="space-y-16 mt-20 pb-40">
              {notes.map((note, idx) => (
                <div key={note.id} className="group relative">
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-[9px] font-mono font-bold text-stone-400 uppercase tracking-widest">
                      LOG {notes.length - idx} / {new Date(note.timestamp).toLocaleDateString()}
                    </span>
                    <button onClick={() => onDeleteNote(note.id)} className="opacity-0 group-hover:opacity-100 p-2 text-stone-300 hover:text-red-500 transition-all">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                    </button>
                  </div>
                  <div className="prose-steno max-w-none text-stone-800">
                    <div dangerouslySetInnerHTML={{ __html: marked.parse(note.content) }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      <style>{`
        .paper-texture {
          background-image: linear-gradient(rgba(59, 130, 246, 0.05) 1px, transparent 1px);
          background-size: 100% 32px;
        }
        .prose-steno { font-family: 'Crimson Pro', serif; font-style: italic; font-size: 1.4rem; line-height: 1.6; }
      `}</style>
    </div>
  );
};

export default StenoPad;
