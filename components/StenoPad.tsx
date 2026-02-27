import React, { useState } from 'react';
import { ProjectNote } from '../types';
import Markdown from 'react-markdown';
import { Plus, Search, Trash2, Clock, Tag, ChevronDown, ChevronUp, Book } from 'lucide-react';

interface StenoPadProps {
  notes: ProjectNote[];
  onAddNote: (content: string, type: ProjectNote['type'], extra?: Partial<ProjectNote>) => void;
  onUpdateNote: (id: string, updates: Partial<ProjectNote>) => void;
  onDeleteNote: (id: string) => void;
  isNotebook?: boolean;
  allNotebookTitles?: string[];
  searchQuery?: string;
}

const StenoPad: React.FC<StenoPadProps> = ({ 
  notes, 
  onAddNote, 
  onUpdateNote, 
  onDeleteNote,
  searchQuery = ''
}) => {
  const [newNoteContent, setNewNoteContent] = useState('');
  const [isExpanded, setIsExpanded] = useState<Record<string, boolean>>({});

  const filteredNotes = notes.filter(n => 
    n.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (n.title && n.title.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteContent.trim()) return;
    onAddNote(newNoteContent, 'ledger');
    setNewNoteContent('');
  };

  const toggleExpand = (id: string) => {
    setIsExpanded(prev => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20">
      {/* The "Torn Paper" Header Effect */}
      <div className="relative h-12 mb-[-1rem] z-10 pointer-events-none">
        <div className="torn-paper-stack">
          <div className="torn-paper-shadow-container layer-3"><div className="torn-paper-edge"></div></div>
          <div className="torn-paper-shadow-container layer-2"><div className="torn-paper-edge"></div></div>
          <div className="torn-paper-shadow-container layer-1"><div className="torn-paper-edge"></div></div>
        </div>
      </div>

      {/* Input Area */}
      <div className="paper-texture shadow-xl border border-stone-200 rounded-b-lg p-8 pt-12 relative">
        <form onSubmit={handleAdd} className="space-y-4">
          <textarea
            value={newNoteContent}
            onChange={(e) => setNewNoteContent(e.target.value)}
            placeholder="Log an observation, thought, or finding..."
            className="w-full bg-transparent border-none outline-none resize-none prose-steno placeholder:text-stone-300 min-h-[120px]"
          />
          <div className="flex justify-end">
            <button 
              type="submit"
              disabled={!newNoteContent.trim()}
              className="bg-stone-900 text-white px-6 py-2 rounded-full text-xs font-black uppercase tracking-widest hover:bg-stone-800 transition-all disabled:opacity-20 flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Commit to Ledger
            </button>
          </div>
        </form>
      </div>

      {/* Notes List */}
      <div className="space-y-6">
        {filteredNotes.map((note) => (
          <div 
            key={note.id} 
            className="paper-texture shadow-md border border-stone-200 rounded-lg p-8 relative group animate-fade-in"
          >
            <div className="flex items-center justify-between mb-6 border-b border-stone-200 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center">
                  <Clock className="w-4 h-4 text-stone-400" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-black uppercase tracking-widest text-stone-400">
                    {new Date(note.timestamp).toLocaleDateString()}
                  </span>
                  <span className="text-[10px] font-bold text-stone-500">
                    {new Date(note.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
              {note.title && (
                <div className="flex-1 px-4">
                  <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600 bg-emerald-50 px-2 py-1 rounded">
                    {note.type === 'source' ? 'Source: ' : ''}{note.title}
                  </span>
                </div>
              )}
              <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all">
                <button 
                  onClick={() => onDeleteNote(note.id)}
                  className="p-2 hover:bg-red-50 text-stone-300 hover:text-red-500 rounded-lg transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className={`prose-steno ${!isExpanded[note.id] ? 'line-clamp-6' : ''}`}>
              <Markdown>{note.content}</Markdown>
            </div>

            {note.content.length > 300 && (
              <button 
                onClick={() => toggleExpand(note.id)}
                className="mt-4 flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-stone-400 hover:text-stone-600 transition-all"
              >
                {isExpanded[note.id] ? (
                  <>Collapse <ChevronUp className="w-3 h-3" /></>
                ) : (
                  <>Read Full Entry <ChevronDown className="w-3 h-3" /></>
                )}
              </button>
            )}
          </div>
        ))}

        {filteredNotes.length === 0 && (
          <div className="py-20 text-center space-y-4 opacity-20">
            <Book className="w-16 h-16 mx-auto" />
            <p className="text-xl font-bold italic font-serif">The ledger is empty...</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default StenoPad;
