
'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ProjectNote } from '../types';

interface StenoPadProps {
  notes: ProjectNote[];
  onAddNote: (content: string, type: 'ledger' | 'research', extra?: any) => void;
  onDeleteNote: (id: string) => void;
  isNotebook?: boolean;
  allNotebookTitles: string[];
}

const StenoPad: React.FC<StenoPadProps> = ({ 
  notes, 
  onAddNote, 
  onDeleteNote, 
  isNotebook = false,
  allNotebookTitles
}) => {
  const [newNote, setNewNote] = useState('');
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const [autocompleteQuery, setAutocompleteQuery] = useState('');
  const [autocompleteIndex, setAutocompleteIndex] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [newNote]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey && !showAutocomplete) {
      e.preventDefault();
      if (newNote.trim()) {
        onAddNote(newNote.trim(), 'ledger');
        setNewNote('');
      }
      return;
    }

    if (showAutocomplete) {
      const filtered = allNotebookTitles.filter(t => t.toLowerCase().includes(autocompleteQuery.toLowerCase()));
      
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setAutocompleteIndex(prev => (prev + 1) % (filtered.length || 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setAutocompleteIndex(prev => (prev - 1 + (filtered.length || 1)) % (filtered.length || 1));
      } else if ((e.key === 'Enter' || e.key === 'Tab') && filtered.length > 0) {
        e.preventDefault();
        const before = newNote.substring(0, newNote.lastIndexOf('#'));
        setNewNote(before + '#' + filtered[autocompleteIndex] + ' ');
        setShowAutocomplete(false);
      } else if (e.key === 'Escape') {
        setShowAutocomplete(false);
      }
    }
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setNewNote(value);

    const cursorPosition = e.target.selectionStart;
    const textBeforeCursor = value.substring(0, cursorPosition);
    const lastHashIndex = textBeforeCursor.lastIndexOf('#');

    if (lastHashIndex !== -1) {
      const query = textBeforeCursor.substring(lastHashIndex + 1);
      // Only show if there's no space between # and cursor
      if (!query.includes(' ')) {
        setShowAutocomplete(true);
        setAutocompleteQuery(query);
        setAutocompleteIndex(0);
      } else {
        setShowAutocomplete(false);
      }
    } else {
      setShowAutocomplete(false);
    }
  };

  const filteredTitles = allNotebookTitles.filter(t => 
    t.toLowerCase().includes(autocompleteQuery.toLowerCase())
  );

  return (
    <div className="flex-1 relative p-10 md:p-20 pt-3">
      {/* Vertical Margin Line (Steno Style) - Centered */}
      <div className="absolute left-1/2 -translate-x-1/2 top-0 bottom-0 w-[2px] bg-red-200/40 pointer-events-none hidden sm:block"></div>
      
      <div className="pl-0 sm:pl-10 md:pl-20 space-y-12">
        
        {/* Entry System */}
        <div className="space-y-3 relative">
          {!isNotebook && (
            <div className="flex justify-between items-center mb-2">
              <div className="text-[10px] font-black uppercase tracking-[0.2em] text-stone-400">New Entry</div>
            </div>
          )}
          <div className="relative group">
            <textarea
              ref={textareaRef}
              value={newNote}
              onChange={handleTextareaChange}
              onKeyDown={handleKeyDown}
              placeholder={isNotebook ? "Write something..." : "Quick entry..."}
              className="w-full bg-transparent border-none focus:ring-0 text-xl md:text-2xl font-medium text-stone-800 placeholder-stone-300 resize-none min-h-[100px] leading-relaxed"
              rows={3}
            />
            
            {/* Autocomplete UI */}
            {showAutocomplete && (
              <div className="absolute left-0 top-full mt-2 w-64 bg-white border border-stone-200 rounded-xl shadow-2xl z-50 overflow-hidden">
                <div className="p-2 bg-stone-50 border-b border-stone-100 text-[9px] font-black uppercase tracking-widest text-stone-400 flex justify-between items-center">
                  <span>Link to Notebook</span>
                  {filteredTitles.length > 0 && (
                    <span className="text-[8px] opacity-50">Enter to select</span>
                  )}
                </div>
                {filteredTitles.length > 0 ? (
                  filteredTitles.map((title, i) => (
                    <button
                      key={title}
                      onClick={() => {
                        const before = newNote.substring(0, newNote.lastIndexOf('#'));
                        setNewNote(before + '#' + title + ' ');
                        setShowAutocomplete(false);
                        textareaRef.current?.focus();
                      }}
                      className={`w-full text-left px-4 py-2.5 text-sm hover:bg-stone-50 transition-colors flex items-center gap-3 ${i === autocompleteIndex ? 'bg-stone-100' : ''}`}
                    >
                      <span className={`w-2 h-2 rounded-full ${i === autocompleteIndex ? 'bg-blue-400' : 'bg-stone-300'}`}></span>
                      <span className="font-medium text-stone-700">{title}</span>
                    </button>
                  ))
                ) : (
                  <div className="px-4 py-3 text-xs text-stone-400 italic">No matching notebooks</div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Notes List */}
        <div className="space-y-16 pb-20">
          {notes.map((note) => (
            <div key={note.id} className="group relative">
              <div className="flex items-start gap-6">
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-widest text-stone-400">
                    <div className={`w-2 h-2 rounded-full ${
                      note.type === 'ledger' ? 'bg-red-500' :
                      note.type === 'research' ? 'bg-blue-500' :
                      note.type === 'outline' ? 'bg-green-500' :
                      note.type === 'raw' ? 'bg-purple-500' : 'bg-stone-300'
                    }`}></div>
                    <span>{new Date(note.timestamp).toLocaleDateString()}</span>
                    <span className="w-1 h-1 rounded-full bg-stone-200"></span>
                    <span>{note.type}</span>
                  </div>
                  <div className="text-lg md:text-xl text-stone-700 leading-relaxed whitespace-pre-wrap">
                    {note.content}
                  </div>
                </div>
                <button 
                  onClick={() => onDeleteNote(note.id)}
                  className="opacity-0 group-hover:opacity-100 p-2 hover:bg-red-50 rounded-lg text-red-400 transition-all"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default StenoPad;
