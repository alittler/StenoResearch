
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { ProjectNote, AppMode, Notebook } from './types';
import StenoPad from './components/StenoPad';
import KnowledgeArchitect from './components/KnowledgeArchitect';
import NotebookShelf from './components/NotebookShelf';

const STORAGE_KEY_NOTES = 'steno_notes_v6';
const STORAGE_KEY_BOOKS = 'steno_books_v6';

const DEFAULT_NOTEBOOK: Notebook = {
  id: 'general',
  title: 'Main Project',
  color: '#3b82f6', // blue-500
  createdAt: Date.now(),
};

const getHashtag = (title: string) => `#${title.trim().replace(/\s+/g, '_')}`;

const App: React.FC = () => {
  const [notebooks, setNotebooks] = useState<Notebook[]>([]);
  const [activeNotebookId, setActiveNotebookId] = useState<string | null>(null);
  const [notes, setNotes] = useState<ProjectNote[]>([]);
  const [mode, setMode] = useState<AppMode>('ledger');
  const [isInitialized, setIsInitialized] = useState(false);

  const [past, setPast] = useState<ProjectNote[][]>([]);
  const [future, setFuture] = useState<ProjectNote[][]>([]);

  useEffect(() => {
    const savedBooks = localStorage.getItem(STORAGE_KEY_BOOKS);
    const savedNotes = localStorage.getItem(STORAGE_KEY_NOTES);
    
    let loadedBooks: Notebook[] = [];
    if (savedBooks) {
      try {
        loadedBooks = JSON.parse(savedBooks);
      } catch (e) { console.error(e); }
    }
    
    if (!loadedBooks.find(b => b.id === 'general')) {
      loadedBooks = [DEFAULT_NOTEBOOK, ...loadedBooks];
    }
    setNotebooks(loadedBooks);

    if (savedNotes) {
      try {
        setNotes(JSON.parse(savedNotes));
      } catch (e) { console.error(e); }
    }
    
    setIsInitialized(true);
  }, []);

  useEffect(() => {
    if (!isInitialized) return;
    localStorage.setItem(STORAGE_KEY_BOOKS, JSON.stringify(notebooks));
    localStorage.setItem(STORAGE_KEY_NOTES, JSON.stringify(notes));
  }, [notes, notebooks, isInitialized]);

  const activeNotebook = useMemo(() => 
    notebooks.find(b => b.id === activeNotebookId) || null
  , [activeNotebookId, notebooks]);

  const projectNotes = useMemo(() => 
    notes.filter(n => n.notebookId === activeNotebookId)
  , [notes, activeNotebookId]);

  const pushToHistory = useCallback((currentNotes: ProjectNote[]) => {
    setPast(prev => [...prev.slice(-49), currentNotes]);
    setFuture([]);
  }, []);

  const addNote = useCallback((content: string) => {
    if (!activeNotebookId) return;
    setNotes(prev => {
      pushToHistory(prev);
      const newNote: ProjectNote = {
        id: crypto.randomUUID(),
        content,
        timestamp: Date.now(),
        notebookId: activeNotebookId,
        tags: [getHashtag(activeNotebook?.title || 'General')]
      };
      return [newNote, ...prev];
    });
  }, [pushToHistory, activeNotebookId, activeNotebook]);

  const addShreddedNotes = useCallback((newNotes: ProjectNote[]) => {
    if (!activeNotebookId) return;
    const htag = getHashtag(activeNotebook?.title || 'General');
    const notesWithId = newNotes.map(n => ({ 
      ...n, 
      notebookId: activeNotebookId,
      tags: Array.from(new Set([...(n.tags || []), htag]))
    }));
    setNotes(prev => {
      pushToHistory(prev);
      return [...notesWithId, ...prev];
    });
    setMode('ledger');
  }, [pushToHistory, activeNotebookId, activeNotebook]);

  const deleteNote = useCallback((id: string) => {
    setNotes(prev => {
      pushToHistory(prev);
      return prev.filter(n => n.id !== id);
    });
  }, [pushToHistory]);

  const updateNote = useCallback((id: string, content: string) => {
    setNotes(prev => {
      pushToHistory(prev);
      return prev.map(n => {
        if (n.id === id) {
          return { ...n, content, timestamp: Date.now() };
        }
        return n;
      });
    });
  }, [pushToHistory]);

  const addNotebook = (title: string, color: string) => {
    const newBook: Notebook = {
      id: crypto.randomUUID(),
      title,
      color,
      createdAt: Date.now(),
    };
    setNotebooks(prev => [...prev, newBook]);
  };

  const deleteNotebook = (id: string) => {
    if (id === 'general') return;
    if (confirm('Delete this project and all its records?')) {
      setNotebooks(prev => prev.filter(b => b.id !== id));
      setNotes(prev => prev.filter(n => n.notebookId !== id));
      if (activeNotebookId === id) setActiveNotebookId(null);
    }
  };

  const handleRestore = (data: any) => {
    if (data.notebooks && data.notes) {
      setNotebooks(data.notebooks);
      setNotes(data.notes);
      alert('Data restored successfully.');
    }
  };

  const undo = useCallback(() => {
    if (past.length === 0) return;
    const previous = past[past.length - 1];
    setFuture(prev => [notes, ...prev]);
    setPast(prev => prev.slice(0, -1));
    setNotes(previous);
  }, [past, notes]);

  const redo = useCallback(() => {
    if (future.length === 0) return;
    const next = future[0];
    setPast(prev => [...prev, notes]);
    setFuture(prev => prev.slice(1));
    setNotes(next);
  }, [future, notes]);

  if (!isInitialized) return null;

  if (!activeNotebookId) {
    return (
      <div className="min-h-screen bg-white text-slate-900">
        <NotebookShelf 
          notebooks={notebooks} 
          notes={notes}
          onSelect={setActiveNotebookId}
          onAdd={addNotebook}
          onDelete={deleteNotebook}
          hasUnsavedChanges={false}
          onBackupPerformed={() => {}}
          onRestore={handleRestore}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <nav className="sticky top-0 z-40 bg-white border-b border-slate-200 px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setActiveNotebookId(null)}
            className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
          </button>
          <div className="h-4 w-[1px] bg-slate-200"></div>
          <h2 className="font-semibold text-slate-800 tracking-tight">{activeNotebook?.title}</h2>
        </div>

        <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-lg">
          <button 
            onClick={() => setMode('ledger')}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${mode === 'ledger' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Notes
          </button>
          <button 
            onClick={() => setMode('architect')}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${mode === 'architect' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Architect
          </button>
        </div>
      </nav>

      <main className="flex-1 max-w-5xl w-full mx-auto p-8">
        {mode === 'ledger' ? (
          <StenoPad 
            notes={projectNotes} 
            onAddNote={addNote} 
            onUpdateNote={updateNote}
            onDeleteNote={deleteNote}
            onUndo={undo}
            onRedo={redo}
            canUndo={past.length > 0}
            canRedo={future.length > 0}
          />
        ) : (
          <KnowledgeArchitect onShredded={addShreddedNotes} />
        )}
      </main>
    </div>
  );
};

export default App;
