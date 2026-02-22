
'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { ProjectNote } from '../types';
import { marked } from 'marked';
import { askResearchQuestion } from '../services/geminiService';

interface StenoPadProps {
  notes: ProjectNote[];
  onAddNote: (content: string, type: ProjectNote['type'], extra?: any) => void;
  onDeleteNote: (id: string) => void;
  isNotebook?: boolean;
  allNotebookTitles?: string[];
}

// StenoPad component for drafting and organizing project notes with an analog feel.
const StenoPad: React.FC<StenoPadProps> = ({ 
  notes, 
  onAddNote, 
  onDeleteNote, 
  isNotebook, 
  allNotebookTitles = [] 
}) => {
  const [inputValue, setInputValue] = useState('');
  const [isResearchMode, setIsResearchMode] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const [autocompleteFilter, setAutocompleteFilter] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }

    // Autocomplete logic
    const lastHashIndex = inputValue.lastIndexOf('#');
    if (lastHashIndex !== -1 && lastHashIndex >= inputValue.length - 20) {
      const textAfterHash = inputValue.slice(lastHashIndex + 1);
      if (!textAfterHash.includes(' ') && !textAfterHash.includes('\n')) {
        setAutocompleteFilter(textAfterHash.toLowerCase());
        setShowAutocomplete(true);
      } else {
        setShowAutocomplete(false);
      }
    } else {
      setShowAutocomplete(false);
    }
  }, [inputValue]);

  const filteredTitles = useMemo(() => {
    return allNotebookTitles.filter(title => 
      title.toLowerCase().includes(autocompleteFilter)
    );
  }, [allNotebookTitles, autocompleteFilter]);

  const handleAutocompleteSelect = (title: string) => {
    const lastHashIndex = inputValue.lastIndexOf('#');
    const newValue = inputValue.slice(0, lastHashIndex) + '#' + title + ' ';
    setInputValue(newValue);
    setShowAutocomplete(false);
    textareaRef.current?.focus();
  };

  const handleAdd = async () => {
    if (!inputValue.trim() || isSearching) return;

    if (isResearchMode && !isNotebook) {
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
      if (showAutocomplete && filteredTitles.length > 0) {
        e.preventDefault();
        handleAutocompleteSelect(filteredTitles[0]);
      } else {
        e.preventDefault();
        handleAdd();
      }
    }
    if (e.key === 'Tab' && showAutocomplete && filteredTitles.length > 0) {
      e.preventDefault();
      handleAutocompleteSelect(filteredTitles[0]);
    }
    if (e.key === 'Escape') {
      setShowAutocomplete(false);
    }
  };

  return (
    <div className="relative w-full">
      <div className="bg-[#fffdf2] border-2 border-stone-200 rounded-t-[2rem] rounded-b-2xl shadow-[0_40px_80px_-20px_rgba(0,0,0,0.1)] relative min-h-[850px] flex flex-col paper-texture overflow-hidden">
        
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
        <div className="relative z-10 -mt-4">
          {/* Layer 1: Deepest remnants */}
          <div className="h-1 bg-transparent flex overflow-hidden opacity-20">
            {[...Array(70)].map((_, i) => (
              <div 
                key={i} 
                className="flex-1 h-3 bg-stone-500 paper-texture"
                style={{
                  clipPath: `polygon(0% 0%, 100% 0%, 100% ${10 + Math.random() * 80}%, 50% ${2 + Math.random() * 60}%, 0% ${10 + Math.random() * 80}%)`,
                  marginTop: '-6px',
                  backgroundSize: '20px 20px'
                }}
              ></div>
            ))}
          </div>
          
          {/* Layer 2 */}
          <div className="h-1 bg-transparent flex overflow-hidden -mt-0.5 opacity-30">
            {[...Array(65)].map((_, i) => (
              <div 
                key={i} 
                className="flex-1 h-3 bg-stone-400 paper-texture"
                style={{
                  clipPath: `polygon(0% 0%, 100% 0%, 100% ${20 + Math.random() * 70}%, 50% ${5 + Math.random() * 50}%, 0% ${20 + Math.random() * 70}%)`,
                  marginTop: '-5px',
                  backgroundSize: '20px 20px'
                }}
              ></div>
            ))}
          </div>

          {/* Layer 3 */}
          <div className="h-1.5 bg-transparent flex overflow-hidden -mt-0.5 opacity-40 drop-shadow-[0_1px_1px_rgba(0,0,0,0.05)]">
            {[...Array(60)].map((_, i) => (
              <div 
                key={i} 
                className="flex-1 h-4 bg-stone-300 paper-texture"
                style={{
                  clipPath: `polygon(0% 0%, 100% 0%, 100% ${30 + Math.random() * 60}%, 50% ${10 + Math.random() * 40}%, 0% ${30 + Math.random() * 60}%)`,
                  marginTop: '-4px',
                  backgroundSize: '20px 20px'
                }}
              ></div>
            ))}
          </div>

          {/* Layer 4 */}
          <div className="h-1.5 bg-transparent flex overflow-hidden -mt-0.5 opacity-50 drop-shadow-[0_1px_2px_rgba(0,0,0,0.1)]">
            {[...Array(55)].map((_, i) => (
              <div 
                key={i} 
                className="flex-1 h-4 bg-stone-200 paper-texture"
                style={{
                  clipPath: `polygon(0% 0%, 100% 0%, 100% ${45 + Math.random() * 50}%, 50% ${20 + Math.random() * 30}%, 0% ${45 + Math.random() * 50}%)`,
                  marginTop: '-3px',
                  backgroundSize: '20px 20px'
                }}
              ></div>
            ))}
          </div>

          {/* Layer 5: Top remnants with shadow */}
          <div className="h-2 bg-transparent flex overflow-hidden -mt-0.5 drop-shadow-[0_2px_2px_rgba(0,0,0,0.15)]">
            {[...Array(50)].map((_, i) => (
              <div 
                key={i} 
                className="flex-1 h-5 bg-stone-100 paper-texture"
                style={{
                  clipPath: `polygon(0% 0%, 100% 0%, 100% ${60 + Math.random() * 40}%, 50% ${30 + Math.random() * 40}%, 0% ${60 + Math.random() * 40}%)`,
                  marginTop: '-2px',
                  backgroundSize: '20px 20px'
                }}
              ></div>
            ))}
          </div>
        </div>

        {/* Current Active Page Torn Edge with Subtle Shadow */}
        <div className="h-6 bg-transparent relative z-10 overflow-hidden flex -mt-1 drop-shadow-[0_2px_3px_rgba(0,0,0,0.15)]">
          {[...Array(40)].map((_, i) => (
            <div 
              key={i} 
              className="flex-1 h-full bg-[#fffdf2] border-t border-stone-200/50 paper-texture"
              style={{
                clipPath: `polygon(0% 0%, 100% 0%, 100% ${90 + Math.random() * 10}%, 50% ${80 + Math.random() * 20}%, 0% ${90 + Math.random() * 10}%)`,
                transform: 'translateY(-3px)',
                backgroundSize: '20px 20px'
              }}
            ></div>
          ))}
        </div>

        {/* Writing Surface */}
        <div className="flex-1 relative p-10 md:p-20 pt-3">
          {/* Vertical Margin Line (Steno Style) */}
          <div className="absolute left-16 md:left-24 top-0 bottom-0 w-[2px] bg-red-200/40 pointer-events-none"></div>
          
          <div className="pl-10 md:pl-20 space-y-12">
            
            {/* Entry System */}
            <div className="space-y-3 relative">
              {!isNotebook && (
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
              )}

              <div className="relative">
                <textarea
                  ref={textareaRef}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={isResearchMode && !isNotebook ? "Ask the research oracle..." : "Draft project insight..."}
                  className="w-full bg-transparent border-none p-0 text-stone-800 font-serif italic text-2xl md:text-3xl leading-relaxed focus:ring-0 outline-none resize-none overflow-hidden placeholder:text-stone-300 selection:bg-stone-200"
                />

                {/* Autocomplete Dropdown */}
                {showAutocomplete && filteredTitles.length > 0 && (
                  <div className="absolute left-0 top-full mt-2 w-64 bg-white border border-stone-200 rounded-xl shadow-2xl z-50 overflow-hidden animate-fade-in">
                    <div className="bg-stone-50 px-3 py-2 border-b border-stone-100">
                      <span className="text-[9px] font-black text-stone-400 uppercase tracking-widest">Reference Project</span>
                    </div>
                    <div className="max-h-48 overflow-y-auto no-scrollbar">
                      {filteredTitles.map((title, i) => (
                        <button
                          key={i}
                          onClick={() => handleAutocompleteSelect(title)}
                          className="w-full text-left px-4 py-3 text-sm font-bold text-stone-700 hover:bg-stone-50 hover:text-stone-900 transition-colors border-b border-stone-50 last:border-none flex items-center gap-3"
                        >
                          <span className="text-stone-300">#</span>
                          {title}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              
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
