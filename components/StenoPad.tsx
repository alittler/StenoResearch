
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { ProjectNote, Notebook } from '../types';
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
  notebookColor?: string;
  notebooks?: Notebook[];
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
  notebookColor, 
  notebooks = [] 
}) => {
  const [inputValue, setInputValue] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [suggestionState, setSuggestionState] = useState<{ 
    show: boolean; 
    list: Notebook[]; 
    activeIndex: number; 
    query: string; 
    cursorPos: number 
  }>({
    show: false,
    list: [],
    activeIndex: 0,
    query: '',
    cursorPos: 0
  });
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      const maxHeight = window.innerHeight / 3;
      textarea.style.height = `${Math.min(textarea.scrollHeight, maxHeight)}px`;
    }
  }, [inputValue]);

  const triggerAddNote = () => {
    if (inputValue.trim()) {
      onAddNote(inputValue);
      setInputValue('');
      setSuggestionState(prev => ({ ...prev, show: false }));
      if (textareaRef.current) textareaRef.current.style.height = 'auto';
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    const pos = e.target.selectionStart;
    setInputValue(value);

    const textBeforeCursor = value.slice(0, pos);
    const words = textBeforeCursor.split(/\s+/);
    const currentWord = words[words.length - 1];

    if (currentWord.startsWith('#')) {
      const query = currentWord.slice(1).toLowerCase();
      const matches = notebooks.filter(nb => 
        nb.id !== 'general' && 
        nb.title.toLowerCase().replace(/\s+/g, '_').includes(query)
      );

      if (matches.length > 0) {
        setSuggestionState({
          show: true,
          list: matches,
          activeIndex: 0,
          query,
          cursorPos: pos
        });
      } else {
        setSuggestionState(prev => ({ ...prev, show: false }));
      }
    } else {
      setSuggestionState(prev => ({ ...prev, show: false }));
    }
  };

  const selectSuggestion = (nb: Notebook) => {
    const textBeforeCursor = inputValue.slice(0, suggestionState.cursorPos);
    const textAfterCursor = inputValue.slice(suggestionState.cursorPos);
    const lastHashIndex = textBeforeCursor.lastIndexOf('#');
    const slug = nb.title.toLowerCase().replace(/\s+/g, '_');
    const newValue = inputValue.slice(0, lastHashIndex) + `#${slug} ` + textAfterCursor;
    setInputValue(newValue);
    setSuggestionState(prev => ({ ...prev, show: false }));
    // Manual focus after selection only
    setTimeout(() => textareaRef.current?.focus(), 0);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (suggestionState.show) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSuggestionState(prev => ({ ...prev, activeIndex: (prev.activeIndex + 1) % prev.list.length }));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSuggestionState(prev => ({ ...prev, activeIndex: (prev.activeIndex - 1 + prev.list.length) % prev.list.length }));
      } else if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault();
        selectSuggestion(suggestionState.list[suggestionState.activeIndex]);
      } else if (e.key === 'Escape') {
        setSuggestionState(prev => ({ ...prev, show: false }));
      }
    } else if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      triggerAddNote();
    }
  };

  const groupedNotes = useMemo(() => {
    const groups: { day: string; notes: ProjectNote[] }[] = [];
    const sorted = [...notes].sort((a, b) => b.timestamp - a.timestamp);
    
    sorted.forEach(note => {
      const date = new Date(note.timestamp);
      const dayLabel = date.toLocaleDateString(undefined, { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
      
      const lastGroup = groups[groups.length - 1];
      if (lastGroup && lastGroup.day === dayLabel) {
        lastGroup.notes.push(note);
      } else {
        groups.push({ day: dayLabel, notes: [note] });
      }
    });
    return groups;
  }, [notes]);

  return (
    <div className="relative max-w-2xl mx-auto flex flex-col h-[calc(100vh-10rem)] md:h-[calc(100vh-12rem)] min-h-[400px] animate-in fade-in duration-300">
      {/* Decorative Spiral - Scaled for mobile */}
      <div className="absolute -top-4 md:-top-6 left-0 right-0 flex justify-around px-4 md:px-8 z-10 pointer-events-none overflow-hidden">
        {[...Array(window.innerWidth < 640 ? 6 : 10)].map((_, i) => (
          <div key={i} className="flex flex-col items-center">
            <div className="w-3 md:w-4 h-6 md:h-8 bg-stone-300 rounded-full border border-stone-400 shadow-inner"></div>
            <div className="w-4 md:w-6 h-4 md:h-6 -mt-3 md:-mt-4 bg-white rounded-full border border-stone-200"></div>
          </div>
        ))}
      </div>

      <div className="flex-1 border-x border-b border-stone-300 rounded-b-xl shadow-2xl relative overflow-hidden flex flex-col" style={{ backgroundColor: notebookColor || '#fffdf0' }}>
        <div className="absolute left-[1.5rem] md:left-1/2 top-0 bottom-0 w-[1px] bg-red-200 z-0 opacity-30 md:opacity-40"></div>
        
        <div className="absolute top-2 right-4 flex gap-1 md:gap-2 z-50 scale-90 md:scale-100 origin-top-right">
          <button 
            onClick={onUndo} 
            disabled={!canUndo}
            className="p-2 rounded-md bg-white/40 hover:bg-white/80 disabled:opacity-20 transition-all text-stone-600 border border-stone-200 shadow-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"></path></svg>
          </button>
          <button 
            onClick={onRedo} 
            disabled={!canRedo}
            className="p-2 rounded-md bg-white/40 hover:bg-white/80 disabled:opacity-20 transition-all text-stone-600 border border-stone-200 shadow-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 10h-10a8 8 0 00-8 8v2m18-12l-6 6m6-6l-6-6"></path></svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 md:px-8 pt-10 md:pt-12 pb-32 md:pb-48 z-10 no-scrollbar" style={{ backgroundImage: `linear-gradient(#00000008 1px, transparent 1px)`, backgroundSize: '100% 2.2rem', lineHeight: '2.2rem' }}>
          {notes.length === 0 ? (
            <div className="text-stone-400 font-mono text-xs md:text-sm mt-8 text-center italic uppercase tracking-widest opacity-40">Empty Pages</div>
          ) : (
            <div className="flex flex-col gap-6 md:gap-10">
              {groupedNotes.map((group) => (
                <div key={group.day} className="space-y-4">
                  <div className="sticky top-0 z-20 flex justify-center py-2">
                    <span className="bg-stone-800 text-white font-mono text-[8px] md:text-[10px] px-3 md:px-4 py-1 rounded-full uppercase tracking-[0.1em] md:tracking-[0.2em] shadow-xl border border-stone-600">
                      {group.day}
                    </span>
                  </div>
                  <div className="flex flex-col gap-[0.8rem] md:gap-[1.1rem]">
                    {group.notes.map((note) => (
                      <NoteItem key={note.id} note={note} onDelete={onDeleteNote} onUpdate={onUpdateNote} isEditing={editingId === note.id} setEditingId={setEditingId} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        {suggestionState.show && (
          <div className="absolute bottom-[100%] mb-4 left-4 md:left-8 right-4 md:right-8 bg-white border border-stone-800 shadow-2xl rounded-xl overflow-hidden z-50 animate-in fade-in slide-in-from-bottom-2 duration-200 max-h-40 md:max-h-48 overflow-y-auto">
            <div className="bg-stone-800 text-[8px] md:text-[10px] text-stone-400 font-bold px-4 py-1 uppercase tracking-widest font-mono">
              Link to Project
            </div>
            {suggestionState.list.map((nb, idx) => (
              <div 
                key={nb.id}
                onClick={() => selectSuggestion(nb)}
                className={`px-4 py-2 cursor-pointer font-mono text-[10px] md:text-xs flex items-center justify-between transition-colors ${suggestionState.activeIndex === idx ? 'bg-stone-100 text-stone-900' : 'text-stone-500'}`}
              >
                <span>#{nb.title.toLowerCase().replace(/\s+/g, '_')}</span>
              </div>
            ))}
          </div>
        )}

        <div className="absolute bottom-0 left-0 right-0 bg-white/80 backdrop-blur-md border-t border-stone-200 p-3 md:p-5 z-20">
          <div className="flex gap-2 md:gap-3 items-end max-w-2xl mx-auto">
            <textarea 
              ref={textareaRef} 
              value={inputValue} 
              onChange={handleInputChange} 
              onKeyDown={handleKeyDown} 
              placeholder="Idea... (#tag to move)" 
              className="flex-1 bg-transparent border-none focus:ring-0 font-mono text-base md:text-lg text-stone-800 placeholder:text-stone-400/50 resize-none min-h-[2.2rem] py-1" 
              rows={1} 
            />
            <button 
              onClick={triggerAddNote} 
              disabled={!inputValue.trim()} 
              className="px-4 md:px-5 py-2 md:py-2.5 bg-stone-900 text-white rounded-xl text-[10px] md:text-xs font-bold font-mono uppercase transition-all hover:bg-black active:scale-95 disabled:opacity-30"
            >
              Post
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const NoteItem: React.FC<{ note: ProjectNote; onDelete: (id: string) => void; onUpdate: (id: string, content: string) => void; isEditing: boolean; setEditingId: (id: string | null) => void; }> = ({ note, onDelete, onUpdate, isEditing, setEditingId }) => {
  const [editValue, setEditValue] = useState(note.content);
  const editRef = useRef<HTMLTextAreaElement>(null);

  const renderedMarkdown = useMemo(() => {
    return marked.parse(note.content, { breaks: true });
  }, [note.content]);
  
  useEffect(() => {
    if (isEditing && editRef.current) {
      const textarea = editRef.current;
      textarea.style.height = 'auto';
      const maxHeight = window.innerHeight / 3;
      textarea.style.height = `${Math.min(textarea.scrollHeight, maxHeight)}px`;
    }
  }, [editValue, isEditing]);

  const handleSave = () => { if (editValue !== note.content) onUpdate(note.id, editValue); setEditingId(null); };
  const timeStr = new Date(note.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <div className={`group relative flex justify-between items-start bg-black/5 hover:bg-black/10 p-3 md:p-5 rounded-xl md:rounded-2xl transition-all ${isEditing ? 'bg-white ring-2 ring-stone-900 z-30 shadow-2xl' : ''}`}>
      <div className="flex-1 pr-2 md:pr-4 min-w-0">
        {isEditing ? (
          <textarea 
            ref={editRef}
            value={editValue} 
            onChange={(e) => setEditValue(e.target.value)} 
            onBlur={handleSave} 
            className="w-full bg-transparent border-none focus:ring-0 font-mono text-base md:text-lg text-stone-800 p-0 resize-none" 
          />
        ) : (
          <div>
            <div className="flex flex-wrap items-center gap-2 md:gap-3 mb-1 md:mb-2">
              <span className="text-[8px] md:text-[10px] font-bold text-stone-400 font-mono bg-stone-200/50 px-1.5 md:px-2 py-0.5 rounded uppercase tracking-tighter">
                {timeStr}
              </span>
              {note.tags?.map(t => (
                <span key={t} className="text-[8px] md:text-[10px] font-bold text-stone-500 font-mono bg-white/50 px-1.5 md:px-2 py-0.5 rounded shadow-sm border border-stone-200">
                  {t}
                </span>
              ))}
            </div>
            <div 
              className="prose-custom font-mono text-base md:text-lg text-stone-800 leading-[2.2rem] break-words [&_p]:mb-0 [&_ul]:mb-0 [&_ol]:mb-0"
              dangerouslySetInnerHTML={{ __html: typeof renderedMarkdown === 'string' ? renderedMarkdown : '' }}
            />
          </div>
        )}
      </div>
      <div className="flex flex-col gap-1.5 md:gap-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
        <button onClick={() => setEditingId(note.id)} className="p-1 text-stone-400 hover:text-stone-900 transition-colors">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
        </button>
        <button onClick={() => onDelete(note.id)} className="p-1 text-stone-300 hover:text-red-500 transition-colors">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12"></path></svg>
        </button>
      </div>
    </div>
  );
};

export default StenoPad;
