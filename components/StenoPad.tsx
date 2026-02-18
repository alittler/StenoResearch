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
    <div className="max-w-3xl mx-auto py-8 px-4 animate-fade-in relative">
      <div className="bg-[#fffdf2] border-2 border-stone-200 rounded-t-[3rem] rounded-b-xl shadow-2xl relative min-h-[800px] flex flex-col paper-texture overflow-hidden">
        
        {/* Top Spiral Binding */}
        <div className="h-16 bg-stone-100 border-b border-stone-200 flex items-center justify-around px-10 relative z-20">
          {[...Array(12)].map((_, i) => (
            <div key={i} className="flex flex-col items-center">
              <div className="w-5 h-10 bg-gradient-to-r from-stone-400 to-stone-200 rounded-full border border-stone-500 -mt-12 shadow-lg"></div>
              <div className="w-2.5 h-2.5 rounded-full bg-stone-300 shadow-inner mt-2"></div>
            </div>
          ))}
        </div>

        {/* Writing Surface */}
        <div className="flex-1 relative p-10 md:p-16">
          <div className="absolute left-16 md:left-24 top-0 bottom-0 w-[1.5px] bg-red-200 pointer-events-none"></div>
          
          <div className="pl-12 md:pl-20 space-y-12">
            <div className="space-y-4">
              <textarea
                ref={textareaRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Write a project entry..."
                className="w-full bg-transparent border-none text-2xl md:text-3xl font-serif italic text-stone-800 focus:ring-0 outline-none resize-none overflow-hidden placeholder:text-stone-200"
              />
              <div className="flex justify-between items-center">
                <button 
                  onClick={handleAdd}
                  disabled={!inputValue.trim()}
                  className="px-6 py-2 bg-stone-900 text-white rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all disabled:opacity-20 shadow-md"
                >
                  Log Entry
                </button>
              </div>
            </div>

            <div className="space-y-16 pb-20">
              {notes.map(note => (
                <div key={note.id} className="group relative border-b border-blue-50/50 pb-8">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-[10px] font-mono text-stone-300 uppercase tracking-widest">
                      {new Date(note.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • Record
                    </span>
                    <button 
                      onClick={() => onDeleteNote(note.id)} 
                      className="opacity-0 group-hover:opacity-100 p-1 text-stone-300 hover:text-red-500 transition-all"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12"></path></svg>
                    </button>
                  </div>
                  <div 
                    className="prose-steno max-w-none prose-stone"
                    dangerouslySetInnerHTML={{ __html: marked.parse(note.content) }}
                  />
                </div>
              ))}
              {notes.length === 0 && (
                <div className="mt-20 flex flex-col gap-4">
                  <p className="text-stone-200 font-serif italic text-3xl">The ledger is awaiting your first entry.</p>
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