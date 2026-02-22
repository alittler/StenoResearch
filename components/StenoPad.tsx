
'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ProjectNote } from '../types';
import { marked } from 'marked';
import { askResearchQuestion } from '../services/geminiService';

interface StenoPadProps {
  notes: ProjectNote[];
  onAddNote: (content: string, type: ProjectNote['type'], extra?: any) => void;
  onDeleteNote: (id: string) => void;
}

// StenoPad component for drafting and organizing project notes with an analog feel.
const StenoPad: React.FC<StenoPadProps> = ({ notes, onAddNote, onDeleteNote }) => {
  const [inputValue, setInputValue] = useState('');
  const [isResearchMode, setIsResearchMode] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [inputValue]);

  const handleAdd = async () => {
    if (!inputValue.trim() || isSearching) return;

    if (isResearchMode) {
      setIsSearching(true);
      setError(null);
      try {
        const context = notes.slice(0, 10).map(n => n.content).join('\n');
        const result = await askResearchQuestion(inputValue, context);
        onAddNote(result.text, 'research', { 
          question: inputValue, 
          metadata: { urls: result.urls } 
        });
        setInputValue('');
        setIsResearchMode(false);
      } catch (err: any) {
        setError("ORACLE ERROR: " + (err.message || "CONNECTION INTERRUPTED"));
        setTimeout(() => setError(null), 5000);
      } finally {
        setIsSearching(false);
      }
    } else {
      onAddNote(inputValue, 'ledger');
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
    <div className="relative w-full">
      <div className="bg-[#fffdf2] border-2 border-stone-200 rounded-t-[4rem] rounded-b-2xl shadow-[0_40px_80px_-20px_rgba(0,0,0,0.1)] relative min-h-[850px] flex flex-col paper-texture overflow-hidden">
        
        {/* Top Spiral Binding - High Fidelity */}
        <div className="h-20 bg-stone-100/90 backdrop-blur-sm border-b border-stone-200 flex items-center justify-around px-8 md:px-12 relative z-20 overflow-visible">
          <div className="absolute inset-0 bg-gradient-to-b from-stone-200/50 to-transparent"></div>
          {[...Array(14)].map((_, i) => (
            <div key={i} className="flex flex-col items-center relative group/spiral">
              {/* Metal spiral rings */}
              <div className="w-5 md:w-6 h-14 bg-gradient-to-r from-stone-500 via-stone-300 to-stone-500 rounded-full border border-stone-600 -mt-14 shadow-2xl relative z-10 transition-transform group-hover/spiral:-translate-y-1">
                 <div className="absolute inset-y-0 left-1/2 w-[1px] bg-white/20"></div>
              </div>
              {/* Punched hole in paper */}
              <div className="w-3 md:w-4 h-3 md:h-4 rounded-full bg-stone-900/10 shadow-inner mt-4 border border-stone-900/5"></div>
            </div>
          ))}
        </div>

        {/* Writing Surface */}
        <div className="flex-1 relative p-10 md:p-20">
          {/* Vertical Margin Line (Steno Style) */}
          <div className="absolute left-16 md:left-24 top-0 bottom-0 w-[2px] bg-red-200/40 pointer-events-none"></div>
          
          <div className="pl-10 md:pl-20 space-y-12">
            
            {/* Entry System */}
            <div className="space-y-6 relative">
              <div className="flex justify-between items-center mb-2">
                <button 
                  onClick={() => setIsResearchMode(!isResearchMode)}
                  className={`flex items-center gap-2 px-3 py-1 rounded-md text-[8px] font-black uppercase tracking-widest transition-all border ${
                    isResearchMode 
                    ? 'bg-blue-600 text-white border-blue-400 shadow-md' 
                    : 'bg-stone-50 text-stone-400 border-stone-200 hover:text-stone-900'
                  }`}
                >
                  {isResearchMode ? '⚡ Research Active' : '🔍 Research Mode'}
                </button>
              </div>

              <textarea
                ref={textareaRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={isResearchMode ? "Ask the research oracle..." : "Draft project insight..."}
                className="w-full bg-transparent border-none p-0 text-stone-800 font-serif italic text-2xl md:text-3xl leading-relaxed focus:ring-0 outline-none resize-none overflow-hidden placeholder:text-stone-300 selection:bg-stone-200"
              />
              
              <div className="flex justify-between items-center mt-4">
                <div className="text-[10px] font-mono text-stone-400 uppercase tracking-widest">
                  {isSearching ? 'Synchronizing with core...' : 'Ready for capture'}
                </div>
                {error && <span className="text-red-500 text-[10px] font-bold uppercase">{error}</span>}
              </div>
            </div>

            {/* Note List */}
            <div className="space-y-12">
              {notes.map((note) => (
                <div key={note.id} className="relative group">
                  <div className="absolute -left-12 top-1 flex flex-col items-center gap-2">
                    <button 
                      onClick={() => onDeleteNote(note.id)}
                      className="text-stone-200 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-4">
                      <span className="text-[9px] font-black text-stone-300 uppercase tracking-[0.3em]">
                        {new Date(note.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded ${
                        note.type === 'research' ? 'bg-blue-100 text-blue-600' : 'bg-stone-100 text-stone-400'
                      }`}>
                        {note.type}
                      </span>
                    </div>
                    
                    {note.type === 'research' && note.question && (
                      <p className="text-stone-400 text-sm font-serif italic mb-2">Q: {note.question}</p>
                    )}

                    <div className="prose prose-stone max-w-none text-stone-700 font-serif text-lg leading-relaxed">
                      <div dangerouslySetInnerHTML={{ __html: marked.parse(note.content) }} />
                    </div>

                    {note.metadata?.urls && note.metadata.urls.length > 0 && (
                      <div className="mt-4 flex flex-wrap gap-2">
                        {note.metadata.urls.map((url, i) => (
                          <a 
                            key={i} 
                            href={url} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="text-[10px] text-blue-500 hover:underline font-mono truncate max-w-xs"
                          >
                            {new URL(url).hostname}
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {notes.length === 0 && (
                <div className="py-20 flex flex-col items-center justify-center opacity-20 grayscale">
                  <span className="text-6xl mb-4">🖋️</span>
                  <p className="text-[10px] font-black uppercase tracking-[0.5em] text-stone-900">Awaiting Log Entry</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Visual background details */}
      <div className="absolute right-0 top-1/4 w-32 h-64 bg-stone-200/5 rotate-12 blur-3xl pointer-events-none"></div>
    </div>
  );
};

export default StenoPad;
