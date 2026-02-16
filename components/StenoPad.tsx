
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

const CATEGORY_COLORS: Record<string, string> = {
  MANUSCRIPT: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  CHARACTER: 'bg-indigo-100 text-indigo-700 border-indigo-200',
  'WORLD-BUILDING': 'bg-amber-100 text-amber-700 border-amber-200',
  RESEARCH: 'bg-blue-100 text-blue-700 border-blue-200',
  BRAINSTORM: 'bg-rose-100 text-rose-700 border-rose-200',
  UNCLASSIFIED: 'bg-slate-100 text-slate-700 border-slate-200'
};

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

  const handleInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleAdd();
    }
  };

  const sortedNotes = useMemo(() => 
    [...notes].sort((a, b) => b.timestamp - a.timestamp)
  , [notes]);

  const renderMarkdown = (content: string) => {
    return { __html: marked.parse(content, { breaks: true, gfm: true }) };
  };

  return (
    <div className="flex flex-col gap-8 animate-fade-in max-w-4xl mx-auto w-full">
      <div className="sticky top-[80px] z-30 flex justify-between items-center mb-4">
        <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest">Chronological Feed</h3>
        <div className="flex gap-2">
          <button onClick={onUndo} disabled={!canUndo} className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 disabled:opacity-20 transition-all">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"></path></svg>
          </button>
          <button onClick={onRedo} disabled={!canRedo} className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 disabled:opacity-20 transition-all">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 10h-10a8 8 0 00-8 8v2m18-10l-6 6m6-6l-6-6"></path></svg>
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {sortedNotes.length === 0 ? (
          <div className="py-24 text-center text-slate-400 border-2 border-dashed border-slate-100 rounded-2xl">
            <p className="text-sm">No records found. Start typing below.</p>
          </div>
        ) : (
          sortedNotes.map((note) => (
            <div key={note.id} className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-all group">
              <div className="flex justify-between items-start gap-4">
                <div className="flex-1 space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    {note.category && (
                      <span className={`${CATEGORY_COLORS[note.category]} border px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider`}>
                        {note.category}
                      </span>
                    )}
                    {note.is_priority && (
                      <span className="bg-red-50 text-red-600 border border-red-100 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">
                        Priority
                      </span>
                    )}
                    <span className="text-[10px] text-slate-400 font-medium">{new Date(note.timestamp).toLocaleString()}</span>
                  </div>

                  <div 
                    className="text-slate-700 leading-relaxed text-base prose prose-slate max-w-none"
                    dangerouslySetInnerHTML={renderMarkdown(note.content)}
                  />

                  {note.links && note.links.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-slate-50 grid grid-cols-1 md:grid-cols-2 gap-3">
                      {note.links.map((link, idx) => (
                        <a key={idx} href={link.url} target="_blank" className="p-3 bg-slate-50 border border-slate-100 rounded-lg hover:border-slate-300 transition-colors group/link">
                          <p className="text-[10px] text-blue-600 font-bold truncate">{link.url}</p>
                          <p className="text-[10px] text-slate-500 mt-1 italic line-clamp-1">{link.description}</p>
                        </a>
                      ))}
                    </div>
                  )}
                </div>
                
                <button 
                  onClick={(e) => { e.stopPropagation(); onDeleteNote(note.id); }} 
                  className="opacity-0 group-hover:opacity-100 p-2 text-slate-300 hover:text-red-500 transition-all rounded-lg"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="sticky bottom-8 mt-12 bg-white/80 backdrop-blur-md p-6 rounded-2xl shadow-xl border border-slate-200 max-w-3xl mx-auto w-full">
        <div className="flex items-end gap-3">
          <textarea 
            ref={textareaRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleInputKeyDown}
            placeholder="Write a new note... (Enter to commit)"
            className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-5 py-4 text-slate-800 outline-none focus:ring-2 focus:ring-slate-900 transition-all h-14 min-h-[56px] resize-none"
            rows={1}
          />
          <button 
            onClick={handleAdd}
            disabled={!inputValue.trim()}
            className="h-14 px-8 bg-slate-900 text-white rounded-xl font-bold text-sm uppercase tracking-wider hover:bg-black transition-all disabled:opacity-20 shadow-lg"
          >
            Add
          </button>
        </div>
      </div>
    </div>
  );
};

export default StenoPad;
