
'use client';

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
    <div className="max-w-4xl mx-auto py-12 px-4 animate-fade-in relative">
      <div className="bg-[#fffdf2] border-2 border-stone-200 rounded-t-[4rem] rounded-b-2xl shadow-[0_50px_100px_-20px_rgba(0,0,0,0.15)] relative min-h-[900px] flex flex-col paper-texture overflow-hidden">
        
        {/* Top Spiral Binding - Enhanced Realism */}
        <div className="h-20 bg-stone-100/80 backdrop-blur-sm border-b border-stone-200 flex items-center justify-around px-12 relative z-20 overflow-visible">
          <div className="absolute inset-0 bg-gradient-to-b from-stone-200/50 to-transparent"></div>
          {[...Array(14)].map((_, i) => (
            <div key={i} className="flex flex-col items-center relative">
              {/* The metal ring */}
              <div className="w-6 h-14 bg-gradient-to-r from-stone-400 via-stone-200 to-stone-400 rounded-full border border-stone-500 -mt-14 shadow-xl relative z-10">
                 <div className="absolute inset-y-0 left-1/2 w-[1px] bg-white/30"></div>
              </div>
              {/* The hole in the paper */}
              <div className="w-3.5 h-3.5 rounded-full bg-stone-900/10 shadow-inner mt-3 border border-stone-900/5"></div>
            </div>
          ))}
        </div>

        {/* Writing Surface */}
        <div className="flex-1 relative p-12 md:p-20">
          {/* Margin Lines */}
          <div className="absolute left-20 md:left-28 top-0 bottom-0 w-[2px] bg-red-200/40 pointer-events-none"></div>
          <div className="absolute left-21 md:left-29 top-0 bottom-0 w-[1px] bg-red-100/20 pointer-events-none"></div>
          
          <div className="pl-14 md:pl-24 space-y-16">
            <div className="space-y-6 relative group">
              <textarea
                ref={textareaRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Log a new project entry..."
                className="w-full bg-transparent border-none text-2xl md:text-4xl font-serif italic text-stone-800 focus:ring-0 outline-none resize-none overflow-hidden placeholder:text-stone-200 transition-all"
              />
              <div className="flex justify-between items-center pt-2 border-t border-stone-100/50">
                <p className="text-[10px] font-black font-mono text-stone-300 uppercase tracking-[0.3em]">Temporal Buffer Active</p>
                <button 
                  onClick={handleAdd}
                  disabled={!inputValue.trim()}
                  className="px-8 py-3 bg-stone-900 text-white rounded-xl text-[10px] font-black uppercase tracking-[0.3em] hover:bg-black transition-all disabled:opacity-20 shadow-xl active:scale-95"
                >
                  Commit to Ledger
                </button>
              </div>
            </div>

            <div className="space-y-20 pb-32">
              {notes.map(note => (
                <div key={note.id} className="group relative border-b border-stone-100 pb-12 last:border-none">
                  <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center gap-4">
                      <span className="w-2 h-2 rounded-full bg-stone-200"></span>
                      <span className="text-[10px] font-mono text-stone-400 uppercase tracking-[0.4em] font-bold">
                        {new Date(note.timestamp).toLocaleDateString()} — {new Date(note.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <button 
                      onClick={() => onDeleteNote(note.id)} 
                      className="opacity-0 group-hover:opacity-100 p-2 text-stone-300 hover:text-red-500 transition-all rounded-full hover:bg-red-50"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12"></path></svg>
                    </button>
                  </div>
                  <div 
                    className="prose-steno max-w-none prose-stone select-text"
                    dangerouslySetInnerHTML={{ __html: marked.parse(note.content) }}
                  />
                </div>
              ))}
              
              {notes.length === 0 && (
                <div className="mt-32 flex flex-col gap-8 opacity-20 select-none">
                  <p className="text-stone-400 font-serif italic text-4xl md:text-5xl leading-tight">The ledger is primed for your observations. <br/>Begin the chronological record here.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Visual Depth Stack */}
      <div className="absolute -bottom-2 left-6 right-6 h-4 bg-stone-200/40 rounded-b-2xl -z-10 shadow-sm"></div>
      <div className="absolute -bottom-4 left-10 right-10 h-4 bg-stone-100/40 rounded-b-2xl -z-20 shadow-sm"></div>
    </div>
  );
};

export default StenoPad;
