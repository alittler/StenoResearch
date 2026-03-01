import React, { useState } from 'react';
import { ProjectNote, Notebook } from '../types';
import Markdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import remarkGfm from 'remark-gfm';
import { Plus, Search, Trash2, Clock, Tag, ChevronDown, ChevronUp, Book, Edit2, Check, X } from 'lucide-react';

interface StenoPadProps {
  notes: ProjectNote[];
  onAddNote: (content: string, type: ProjectNote['type'], extra?: Partial<ProjectNote>) => void;
  onUpdateNote: (id: string, updates: Partial<ProjectNote>) => void;
  onDeleteNote: (id: string) => void;
  isNotebook?: boolean;
  notebooks?: Notebook[];
  onNavigateToNotebook?: (id: string) => void;
  searchQuery?: string;
  noteType?: ProjectNote['type'];
}

const StenoPad: React.FC<StenoPadProps> = ({ 
  notes, 
  onAddNote, 
  onUpdateNote, 
  onDeleteNote,
  isNotebook = false,
  notebooks = [],
  onNavigateToNotebook,
  searchQuery = '',
  noteType = 'ledger'
}) => {
  const [newNoteContent, setNewNoteContent] = useState('');
  const [isExpanded, setIsExpanded] = useState<Record<string, boolean>>({});
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [showTagSuggestions, setShowTagSuggestions] = useState(false);
  const [tagFilter, setTagFilter] = useState('');
  const [cursorPosition, setCursorPosition] = useState(0);

  const filteredNotes = notes.filter(n => 
    n.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (n.title && n.title.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteContent.trim()) return;
    onAddNote(newNoteContent, noteType);
    setNewNoteContent('');
    setShowTagSuggestions(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    const pos = e.target.selectionStart;
    setNewNoteContent(value);
    setCursorPosition(pos);

    // Check for tag trigger
    const lastAt = value.lastIndexOf('#', pos - 1);
    if (lastAt !== -1) {
      const textAfterHash = value.substring(lastAt + 1, pos);
      if (!textAfterHash.includes(' ') && !textAfterHash.includes('\n')) {
        setTagFilter(textAfterHash);
        setShowTagSuggestions(true);
        return;
      }
    }
    setShowTagSuggestions(false);
  };

  const insertTag = (notebook: Notebook) => {
    const tag = `#${notebook.title.replace(/\s+/g, '_')}`;
    const lastAt = newNoteContent.lastIndexOf('#', cursorPosition - 1);
    const before = newNoteContent.substring(0, lastAt);
    const after = newNoteContent.substring(cursorPosition);
    setNewNoteContent(before + tag + ' ' + after);
    setShowTagSuggestions(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (showTagSuggestions && (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'Enter')) {
      // Basic autocomplete navigation could be added here
      // For now, let's just handle Enter if there's a match
      const matches = notebooks.filter(nb => 
        nb.id !== 'general' && 
        nb.title.toLowerCase().replace(/\s+/g, '_').includes(tagFilter.toLowerCase())
      );
      if (e.key === 'Enter' && matches.length > 0) {
        e.preventDefault();
        insertTag(matches[0]);
        return;
      }
    }

    if (e.key === 'Enter' && !e.shiftKey && !showTagSuggestions) {
      e.preventDefault();
      handleAdd(e as unknown as React.FormEvent);
    }
  };

  const toggleExpand = (id: string) => {
    setIsExpanded(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const startEditing = (note: ProjectNote) => {
    setEditingId(note.id);
    setEditContent(note.content);
  };

  const saveEdit = (id: string) => {
    onUpdateNote(id, { content: editContent });
    setEditingId(null);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditContent('');
  };

  // Function to wrap notebook titles and tags in links
  const processContent = (content: string) => {
    if (!notebooks.length) return content;
    
    let processed = content;
    // Sort notebooks by title length descending to avoid partial matches
    const sortedNotebooks = [...notebooks].sort((a, b) => b.title.length - a.title.length);
    
    sortedNotebooks.forEach(nb => {
      if (nb.id === 'general') return; // Don't link to self
      
      const escapedTitle = nb.title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const tagTitle = nb.title.replace(/\s+/g, '_');
      
      // Link plain titles (if isNotebook is true)
      if (isNotebook) {
        const titleRegex = new RegExp(`(?<![#\\[])${escapedTitle}(?!\\])`, 'g');
        processed = processed.replace(titleRegex, `[${nb.title}](notebook://${nb.id})`);
      }

      // Link tags
      const tagRegex = new RegExp(`(?<!\\[)#${tagTitle}(?!\\])`, 'g');
      processed = processed.replace(tagRegex, `[#${tagTitle}](notebook://${nb.id})`);
    });
    
    return processed;
  };

  const tagSuggestions = notebooks.filter(nb => 
    nb.id !== 'general' && 
    nb.title.toLowerCase().replace(/\s+/g, '_').includes(tagFilter.toLowerCase())
  );

  return (
    <div className="max-w-4xl mx-auto pb-20">
      {/* The "Torn Paper" Header Effect */}
      <div className="relative h-8 mb-[-1rem] z-10 pointer-events-none">
        <div className="torn-paper-stack">
          <div className="torn-paper-shadow-container layer-3"><div className="torn-paper-edge"></div></div>
          <div className="torn-paper-shadow-container layer-2"><div className="torn-paper-edge"></div></div>
          <div className="torn-paper-shadow-container layer-1"><div className="torn-paper-edge"></div></div>
        </div>
      </div>

      <div className="paper-texture shadow-[0_20px_50px_rgba(0,0,0,0.1)] border border-stone-200 rounded-b-lg min-h-screen relative flex flex-col">
        {/* Input Area */}
        <div className="p-8 md:pl-[92px] pt-12 relative border-b-2 border-stone-200/50">
          <form onSubmit={handleAdd} className="space-y-4 relative">
            <textarea
              value={newNoteContent}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder="Log an observation, thought, or finding..."
              className="w-full bg-transparent border-none outline-none resize-none prose-steno placeholder:text-stone-400 min-h-[120px]"
            />

            {showTagSuggestions && tagSuggestions.length > 0 && (
              <div className="absolute left-0 bottom-full mb-2 w-64 bg-white rounded-xl shadow-2xl border border-stone-200 overflow-hidden z-50">
                <div className="p-2 bg-stone-50 border-b border-stone-100">
                  <span className="text-[9px] font-black uppercase tracking-widest text-stone-400">Tag Project</span>
                </div>
                <div className="max-h-48 overflow-y-auto">
                  {tagSuggestions.map(nb => (
                    <button
                      key={nb.id}
                      type="button"
                      onClick={() => insertTag(nb)}
                      className="w-full text-left px-4 py-2 hover:bg-emerald-50 transition-colors flex items-center justify-between group"
                    >
                      <span className="text-xs font-bold text-stone-700 group-hover:text-emerald-700">#{nb.title.replace(/\s+/g, '_')}</span>
                      <Plus className="w-3 h-3 text-stone-300 group-hover:text-emerald-500" />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </form>
        </div>

        {/* Notes List */}
        <div className="flex flex-col">
          {filteredNotes.map((note, index) => {
            const prevNote = index > 0 ? filteredNotes[index - 1] : null;
            const isNewDay = !prevNote || 
              new Date(note.timestamp).toLocaleDateString() !== new Date(prevNote.timestamp).toLocaleDateString();

            return (
              <div 
                key={note.id} 
                className="p-8 md:pl-[92px] relative group animate-fade-in border-b-2 border-stone-200/50 last:border-b-0"
              >
                <div className="flex items-center justify-between mb-6 pb-4">
                <div className="flex items-center gap-3">
                  {isNewDay ? (
                    <>
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
                    </>
                  ) : (
                    <div className="flex flex-col pl-11">
                      <span className="text-[10px] font-bold text-stone-300">
                        {new Date(note.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  )}
                </div>
                {note.title && (
                  <div className="flex-1 px-4">
                    <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600 bg-emerald-50 px-2 py-1 rounded">
                      {note.type === 'source' ? 'Source: ' : ''}{note.title}
                    </span>
                  </div>
                )}
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all">
                  {editingId === note.id ? (
                    <>
                      <button 
                        onClick={() => saveEdit(note.id)}
                        className="p-2 hover:bg-emerald-50 text-emerald-500 rounded-lg transition-all"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={cancelEdit}
                        className="p-2 hover:bg-stone-100 text-stone-400 rounded-lg transition-all"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </>
                  ) : (
                    <>
                      <button 
                        onClick={() => startEditing(note)}
                        className="p-2 hover:bg-blue-50 text-stone-300 hover:text-blue-500 rounded-lg transition-all"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => onDeleteNote(note.id)}
                        className="p-2 hover:bg-red-50 text-stone-300 hover:text-red-500 rounded-lg transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </div>
              </div>

              {editingId === note.id ? (
                <div className="space-y-4">
                  <textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    className="w-full bg-white border border-stone-200 rounded-lg p-4 outline-none resize-none prose-steno min-h-[120px] focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              ) : (
                <>
                  <div className={`prose-steno ${!isExpanded[note.id] ? 'line-clamp-6' : ''}`}>
                    <Markdown 
                      rehypePlugins={[rehypeRaw]} 
                      remarkPlugins={[remarkGfm]}
                      components={{
                        a: ({node, ...props}) => {
                          const href = props.href || '';
                          if (href.startsWith('notebook://')) {
                            const id = href.replace('notebook://', '');
                            return (
                              <button 
                                onClick={() => onNavigateToNotebook?.(id)}
                                className="text-emerald-600 font-bold hover:underline"
                              >
                                {props.children}
                              </button>
                            );
                          }
                          return <a {...props} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline" />;
                        }
                      }}
                    >
                      {processContent(note.content)}
                    </Markdown>
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
                </>
              )}
            </div>
          );
        })}

        {filteredNotes.length === 0 && (
          <div className="py-20 text-center space-y-4 opacity-20">
            <Book className="w-16 h-16 mx-auto" />
            <p className="text-xl font-bold italic font-serif">The ledger is empty...</p>
          </div>
        )}
        </div>
      </div>
    </div>
  );
};

export default StenoPad;
