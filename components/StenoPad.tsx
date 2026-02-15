
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { ProjectNote } from '../types';

interface StenoPadProps {
  notes: ProjectNote[];
  onAddNote: (content: string) => void;
  onUpdateNote: (id: string, content: string) => void;
  onDeleteNote: (id: string) => void;
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
    <div className="relative max-w-3xl mx-auto flex flex-col min-h-[80vh] animate-fade-in">
      {/* Metallic Spiral Rings */}
      <div className="absolute -top-6 left-0 right-0 flex justify-around px-8 md:px-12 z-40 pointer-events-none">
        {[...Array(14)].map((_, i) => (
          <div key={i} className="flex flex-col items-center">
            <div className="w-3.5 h-10 bg-gradient-to-r from-stone-400 via-stone-100 to-stone-400 rounded-full border border-stone-500 shadow-lg"></div>
          </div>
        ))}
      </div>

      {/* Main Paper Body */}
      <div 
        className="flex-1 rounded-b-xl shadow-2xl relative overflow-hidden flex flex-col border-t-[14px] border-stone-300 paper-texture" 
        style={{ backgroundColor: notebookColor }}
      >
        {/* Binding Shadow (Simulates the left side of a bound pad) */}
        <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-stone-900/10 to-transparent z-10 pointer-events-none"></div>

        {/* Ruled Blue Lines */}
        <div className="absolute inset-0 pointer-events-none opacity-40 z-0" 
             style={{ 
               backgroundImage: `linear-gradient(#add8e6 1px, transparent 1px)`, 
               backgroundSize: '100% 2.4rem',
               backgroundPosition: '0 1.2rem'
             }}>
        </div>

        {/* Double Red Margin */}
        <div className="absolute left-[4rem] md:left-[6rem] top-0 bottom-0 w-[1px] bg-red-400 opacity-40 z-10"></div>
        <div className="absolute left-[4.2rem] md:left-[6.2rem] top-0 bottom-0 w-[1px] bg-red-400 opacity-20 z-10"></div>

        <div className="flex-1 overflow-y-auto px-10 md:px-28 pt-16 pb-44 z-20 relative no-scrollbar">
          {notes.length === 0 ? (
            <div className="mt-24 text-center">
              <span className="text-5xl opacity-10 block mb-6">🖋️</span>
              <p className="text-stone-300 font-mono text-xs uppercase tracking-[0.4em] font-black">Project Observation Logs</p>
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
                          className="w-full bg-transparent border-none focus:ring-0 font-handwriting text-2xl text-blue-700 p-0 resize-none h-24"
                          defaultValue={note.content}
                          onBlur={(e) => {
                            onUpdateNote(note.id, e.target.value);
                            setEditingId(null);
                          }}
                        />
                      ) : (
                        <p 
                          className="font-handwriting text-3xl text-stone-800 leading-[2.4rem] cursor-text"
                          onClick={() => setEditingId(note.id)}
                        >
                          {note.content}
                        </p>
                      )}
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-[10px] font-mono text-stone-400 font-bold uppercase tracking-widest">
                          ENTRY #{new Date(note.timestamp).getTime().toString().slice(-4)}
                        </span>
                        <span className="text-[10px] font-mono text-stone-300">
                          {new Date(note.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                    <button 
                      onClick={() => onDeleteNote(note.id)} 
                      className="opacity-0 group-hover:opacity-100 p-1.5 text-stone-300 hover:text-red-500 transition-opacity ml-4"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12"></path></svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Input Dock */}
        <div className="absolute bottom-0 left-0 right-0 bg-white/60 backdrop-blur-xl border-t border-stone-200/50 p-6 z-40">
          <div className="flex items-end gap-4 max-w-2xl mx-auto">
            <textarea 
              ref={textareaRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Record a project finding..."
              className="flex-1 bg-white/80 rounded-2xl px-6 py-4 font-handwriting text-3xl text-stone-800 placeholder:text-stone-300 border border-stone-100 focus:ring-4 focus:ring-stone-200 focus:border-transparent outline-none shadow-inner transition-all"
              rows={1}
            />
            <button 
              onClick={triggerAddNote}
              disabled={!inputValue.trim()}
              className="px-8 py-4 bg-stone-900 text-white rounded-2xl text-[10px] font-black font-mono uppercase hover:bg-black transition-all active:scale-95 disabled:opacity-20 shadow-xl"
            >
              Post
            </button>
          </div>
        </div>
      </div>
      
      {/* Physical Backing */}
      <div className="absolute inset-0 -z-10 bg-stone-800/10 translate-x-4 translate-y-4 rounded-xl"></div>
    </div>
  );
};

export default StenoPad;
