
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
      if (textareaRef.current) textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      triggerAddNote();
    }
  };

  const groupedNotes = useMemo(() => {
    const groups: { day: string; notes: ProjectNote[] }[] = [];
    const sorted = [...notes].sort((a, b) => b.timestamp - a.timestamp);
    sorted.forEach(note => {
      const dateStr = new Date(note.timestamp).toLocaleDateString(undefined, { 
        weekday: 'short', month: 'short', day: 'numeric' 
      });
      const lastGroup = groups[groups.length - 1];
      if (lastGroup && lastGroup.day === dateStr) lastGroup.notes.push(note);
      else groups.push({ day: dateStr, notes: [note] });
    });
    return groups;
  }, [notes]);

  return (
    <div className="relative max-w-2xl mx-auto flex flex-col h-[calc(100vh-10rem)] md:h-[calc(100vh-12rem)] animate-in fade-in duration-300">
      {/* Refined Spiral Top */}
      <div className="absolute -top-6 left-0 right-0 flex justify-around px-8 z-20 pointer-events-none">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="flex flex-col items-center">
            <div className="w-4 h-10 bg-gradient-to-b from-stone-400 to-stone-200 rounded-full border border-stone-500 shadow-md"></div>
          </div>
        ))}
      </div>

      <div className="flex-1 border-x border-stone-300 rounded-b-xl shadow-2xl relative overflow-hidden flex flex-col" style={{ backgroundColor: notebookColor || '#fffef0' }}>
        {/* Double Red Margin Line */}
        <div className="absolute left-[2.5rem] md:left-[3.5rem] top-0 bottom-0 w-[1px] bg-red-400 opacity-30"></div>
        <div className="absolute left-[2.7rem] md:left-[3.7rem] top-0 bottom-0 w-[1px] bg-red-400 opacity-20"></div>
        
        {/* Blue Rule Lines Background */}
        <div className="absolute inset-0 z-0 pointer-events-none" style={{ backgroundImage: `linear-gradient(#e0f2fe 1px, transparent 1px)`, backgroundSize: '100% 2.2rem' }}></div>

        <div className="flex-1 overflow-y-auto px-6 md:px-14 pt-16 pb-32 z-10 no-scrollbar relative">
          {notes.length === 0 ? (
            <div className="text-stone-300 font-mono text-center italic uppercase mt-20 tracking-[0.3em]">New Project Records</div>
          ) : (
            <div className="space-y-12">
              {groupedNotes.map((group) => (
                <div key={group.day} className="space-y-4">
                  <div className="flex items-center gap-4">
                    <span className="text-[10px] font-black font-mono text-stone-400 uppercase tracking-widest">{group.day}</span>
                    <div className="flex-1 h-[1px] bg-stone-100"></div>
                  </div>
                  <div className="space-y-2">
                    {group.notes.map((note) => (
                      <NoteItem key={note.id} note={note} onDelete={onDeleteNote} onUpdate={onUpdateNote} isEditing={editingId === note.id} setEditingId={setEditingId} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="absolute bottom-0 left-0 right-0 bg-white/90 backdrop-blur-sm border-t border-stone-200 p-5 z-20">
          <div className="flex gap-4 items-end max-w-2xl mx-auto">
            <textarea 
              ref={textareaRef} 
              value={inputValue} 
              onChange={(e) => setInputValue(e.target.value)} 
              onKeyDown={handleKeyDown} 
              placeholder="Record observation..." 
              className="flex-1 bg-transparent border-none focus:ring-0 font-mono text-lg text-stone-800 placeholder:text-stone-300 resize-none py-1" 
              rows={1} 
            />
            <button 
              onClick={triggerAddNote} 
              disabled={!inputValue.trim()} 
              className="px-6 py-2.5 bg-stone-900 text-white rounded-xl text-[10px] font-bold font-mono uppercase hover:bg-black transition-all active:scale-95 disabled:opacity-20"
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
  const handleSave = () => { if (editValue !== note.content) onUpdate(note.id, editValue); setEditingId(null); };

  return (
    <div className={`group relative flex justify-between items-start py-1 rounded-lg transition-all ${isEditing ? 'bg-white shadow-xl ring-1 ring-stone-200 p-4 -mx-4 z-30' : ''}`}>
      <div className="flex-1 min-w-0">
        {isEditing ? (
          <textarea 
            autoFocus
            value={editValue} 
            onChange={(e) => setEditValue(e.target.value)} 
            onBlur={handleSave} 
            className="w-full bg-transparent border-none focus:ring-0 font-mono text-lg text-stone-800 p-0 resize-none h-32" 
          />
        ) : (
          <p className="font-mono text-lg text-stone-800 leading-[2.2rem] break-words whitespace-pre-wrap">
            {note.content}
          </p>
        )}
      </div>
      <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity ml-4 shrink-0">
        <button onClick={() => setEditingId(note.id)} className="p-1 text-stone-300 hover:text-stone-900"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg></button>
        <button onClick={() => onDelete(note.id)} className="p-1 text-stone-200 hover:text-red-500"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12"></path></svg></button>
      </div>
    </div>
  );
};

export default StenoPad;
