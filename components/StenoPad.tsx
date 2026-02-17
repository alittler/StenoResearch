
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { ProjectNote } from '../types';
import { marked } from 'marked';

interface StenoPadProps {
  notes: ProjectNote[];
  onAddNote: (content: string) => void;
  onUpdateNote: (id: string, content: string) => void;
  onDeleteNote: (id: string) => void;
  onUndo?: () => void;
  onRedo?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
}

const StenoPad: React.FC<StenoPadProps> = ({ 
  notes, 
  onAddNote, 
  onUpdateNote,
  onDeleteNote,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
}) => {
  const [inputValue, setInputValue] = useState('');
  const [copyingId, setCopyingId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const editAreaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [inputValue]);

  useEffect(() => {
    if (editAreaRef.current) {
      editAreaRef.current.style.height = 'auto';
      editAreaRef.current.style.height = `${editAreaRef.current.scrollHeight}px`;
      editAreaRef.current.focus();
    }
  }, [editingId, editValue]);

  // Global Undo/Redo shortcuts
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      const isZ = e.key.toLowerCase() === 'z';
      const isY = e.key.toLowerCase() === 'y';
      const mod = e.ctrlKey || e.metaKey;

      if (mod && isZ) {
        if (e.shiftKey) {
          if (onRedo && canRedo) {
            e.preventDefault();
            onRedo();
          }
        } else {
          if (onUndo && canUndo) {
            e.preventDefault();
            onUndo();
          }
        }
      } else if (mod && isY) {
        if (onRedo && canRedo) {
          e.preventDefault();
          onRedo();
        }
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [onUndo, onRedo, canUndo, canRedo]);

  const handleAdd = () => {
    if (inputValue.trim()) {
      onAddNote(inputValue);
      setInputValue('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // RULE: SUBMIT WITH ENTER / BREAK LINE WITH SHIFT-ENTER
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleAdd();
    }
  };

  const handleCopy = async (note: ProjectNote) => {
    try {
      await navigator.clipboard.writeText(note.content);
      setCopyingId(note.id);
      setTimeout(() => setCopyingId(null), 2000);
    } catch (err) {
      console.error("Failed to copy", err);
    }
  };

  const startEdit = (note: ProjectNote) => {
    setEditingId(note.id);
    setEditValue(note.content);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditValue('');
  };

  const commitEdit = () => {
    if (editingId && editValue.trim()) {
      onUpdateNote(editingId, editValue);
      setEditingId(null);
      setEditValue('');
    }
  };

  const handleEditKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // RULE: SUBMIT WITH ENTER / BREAK LINE WITH SHIFT-ENTER
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      commitEdit();
    } else if (e.key === 'Escape') {
      cancelEdit();
    }
  };

  const groupedNotes = useMemo(() => {
    const sorted = [...notes].sort((a, b) => b.timestamp - a.timestamp);
    const groups: { [key: string]: ProjectNote[] } = {};
    sorted.forEach(note => {
      const date = new Date(note.timestamp).toLocaleDateString(undefined, {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      if (!groups[date]) groups[date] = [];
      groups[date].push(note);
    });
    return Object.entries(groups);
  }, [notes]);

  return (
    <div className="flex flex-col gap-12 animate-fade-in max-w-4xl mx-auto w-full pb-32">
      <div className="relative bg-[#fffdf7] border-2 border-slate-200 rounded-[3rem] shadow-[0_40px_100px_-20px_rgba(0,0,0,0.1)] overflow-hidden min-h-[850px] paper-texture flex flex-col">
        {/* Spiral Top Binding */}
        <div className="h-16 bg-slate-50 border-b-2 border-slate-200 flex items-center justify-between px-10 relative shrink-0">
          <div className="absolute -top-3 left-0 right-0 flex justify-center gap-6 pointer-events-none">
            {[...Array(14)].map((_, i) => (
              <div key={i} className="w-4 h-9 bg-slate-300 rounded-full border border-slate-400 shadow-[inset_0_2px_4px_rgba(0,0,0,0.2)]"></div>
            ))}
          </div>
          <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.5em] mt-3">Universal Project Ledger</h3>
          <div className="flex gap-4 mt-3">
            <button 
              onClick={onUndo} 
              disabled={!canUndo} 
              className="p-1.5 text-slate-300 hover:text-slate-800 disabled:opacity-10 transition-all flex items-center gap-1.5 group"
              title="Undo (Ctrl+Z)"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"></path></svg>
            </button>
            <button 
              onClick={onRedo} 
              disabled={!canRedo} 
              className="p-1.5 text-slate-300 hover:text-slate-800 disabled:opacity-10 transition-all flex items-center gap-1.5 group"
              title="Redo (Ctrl+Y)"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 10h-10a8 8 0 00-8 8v2m18-10l-6 6m6-6l-6-6"></path></svg>
            </button>
          </div>
        </div>

        <div className="flex-1 relative">
          {/* Steno Pad Red Line */}
          <div className="absolute left-20 top-0 bottom-0 w-[1.5px] bg-red-200/50 pointer-events-none z-10"></div>

          <div className="divide-y divide-slate-100">
            <div className="p-10 pt-14">
              <div className="pl-16 space-y-5">
                <textarea 
                  ref={textareaRef}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Capture a thought... (Enter to commit, Shift+Enter for new line)"
                  className="w-full bg-transparent border-none text-slate-800 font-serif italic text-2xl focus:ring-0 outline-none transition-all min-h-[160px] resize-none overflow-hidden leading-relaxed placeholder:text-slate-200 selection:bg-blue-100"
                />
                <div className="flex justify-between items-center pt-6">
                  <div className="flex items-center gap-4 text-[9px] font-black text-slate-300 uppercase tracking-widest">
                    <span>ENTER: COMMIT</span>
                    <div className="w-1.5 h-1.5 rounded-full bg-slate-100"></div>
                    <span>SHIFT+ENTER: BREAK</span>
                  </div>
                  <button 
                    onClick={handleAdd}
                    disabled={!inputValue.trim()}
                    className="px-12 py-4 bg-slate-900 text-white rounded-2xl font-black text-[11px] uppercase tracking-[0.25em] hover:bg-black transition-all disabled:opacity-10 shadow-[0_15px_30px_-5px_rgba(0,0,0,0.2)] active:scale-95"
                  >
                    Commit Entry
                  </button>
                </div>
              </div>
            </div>

            <div className="pb-40">
              {groupedNotes.map(([date, dayNotes]) => (
                <div key={date}>
                  <div className="bg-slate-50/40 px-10 py-5 flex items-center gap-4 border-y border-slate-100/50">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.5em] pl-16 italic">{date}</span>
                  </div>
                  
                  <div className="divide-y divide-slate-50">
                    {dayNotes.map((note) => (
                      <div key={note.id} className="p-10 group relative hover:bg-white/60 transition-colors">
                        <div className="pl-16 space-y-4">
                          <div className="flex items-center gap-4">
                            <div className="w-2 h-2 rounded-full bg-blue-500/20 group-hover:bg-blue-500 transition-colors"></div>
                            <span className="text-[11px] font-bold font-mono text-slate-300 uppercase tracking-tighter">
                              {new Date(note.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>

                          {editingId === note.id ? (
                            <div className="space-y-4 -ml-4">
                              <textarea
                                ref={editAreaRef}
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                onKeyDown={handleEditKeyDown}
                                onBlur={commitEdit}
                                className="w-full bg-white border-2 border-slate-200 rounded-2xl p-6 text-slate-800 font-serif italic text-2xl focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 outline-none transition-all resize-none overflow-hidden leading-relaxed shadow-xl"
                              />
                              <div className="flex justify-between items-center px-4">
                                <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest">ESC: CANCEL • ENTER: SAVE</p>
                                <div className="flex gap-4">
                                  <button onClick={cancelEdit} className="text-[10px] font-black uppercase text-slate-400 hover:text-slate-600 transition-colors">Discard</button>
                                  <button onClick={commitEdit} className="text-[10px] font-black uppercase text-blue-600 hover:text-blue-800 transition-colors">Apply Changes</button>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div 
                              onClick={() => startEdit(note)}
                              title="Click to revise entry"
                              className="prose prose-steno max-w-none prose-slate bg-white/40 hover:bg-white rounded-2xl p-6 -ml-6 border border-transparent hover:border-slate-100 hover:shadow-lg cursor-text leading-loose transition-all duration-300"
                              dangerouslySetInnerHTML={{ __html: marked.parse(note.content) }}
                            />
                          )}

                          <div className="absolute top-10 right-10 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-all duration-300 scale-95 group-hover:scale-100">
                            <button 
                              onClick={() => handleCopy(note)}
                              className={`p-2.5 rounded-xl transition-all ${copyingId === note.id ? 'text-emerald-500 bg-emerald-50 shadow-inner' : 'text-slate-200 hover:text-slate-600 hover:bg-slate-50'}`}
                              title="Duplicate to clipboard"
                            >
                              {copyingId === note.id ? (
                                <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7"></path></svg>
                              ) : (
                                <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>
                              )}
                            </button>
                            <button 
                              onClick={() => onDeleteNote(note.id)} 
                              className="p-2.5 text-slate-200 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                              title="Purge entry"
                            >
                              <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              {notes.length === 0 && (
                <div className="py-40 text-center opacity-10 grayscale">
                   <div className="text-8xl mb-8">✒️</div>
                   <p className="text-[12px] font-black uppercase tracking-[0.5em]">The Ledger is Blank</p>
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
