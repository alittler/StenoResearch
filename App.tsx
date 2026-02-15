
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { ProjectNote, AppView, NoteType, Notebook } from './types';
import StenoPad from './components/StenoPad';
import ResearchHub from './components/ResearchHub';
import RawTextEditor from './components/RawTextEditor';
import Navigation from './components/Navigation';
import Outlines from './components/Outlines';
import NotebookShelf from './components/NotebookShelf';
import Visualizer from './components/Visualizer';

const STORAGE_KEY_NOTES = 'steno_research_notes_v4';
const STORAGE_KEY_NOTEBOOKS = 'steno_research_notebooks_v4';
const LAST_BACKUP_KEY = 'steno_last_backup_time';

const DEFAULT_NOTEBOOK: Notebook = {
  id: 'general',
  title: 'Main Ledger',
  color: '#fffef0',
  timestamp: Date.now()
};

const App: React.FC = () => {
  const [notebooks, setNotebooks] = useState<Notebook[]>([DEFAULT_NOTEBOOK]);
  const [notes, setNotes] = useState<ProjectNote[]>([]);
  const [activeNotebookId, setActiveNotebookId] = useState<string>('general');
  const [activeView, setActiveView] = useState<AppView>('steno'); // Default to notepad
  const [isInitialized, setIsInitialized] = useState(false);
  const [lastBackupTime, setLastBackupTime] = useState<number>(0);

  const [history, setHistory] = useState<ProjectNote[][]>([]);
  const [historyPointer, setHistoryPointer] = useState(-1);

  // Initialize Data
  useEffect(() => {
    const savedNotes = localStorage.getItem(STORAGE_KEY_NOTES);
    const savedNotebooks = localStorage.getItem(STORAGE_KEY_NOTEBOOKS);
    const savedBackupTime = localStorage.getItem(LAST_BACKUP_KEY);
    
    if (savedBackupTime) setLastBackupTime(parseInt(savedBackupTime, 10));

    if (savedNotebooks) {
      try {
        const parsed = JSON.parse(savedNotebooks);
        if (Array.isArray(parsed) && parsed.length > 0) setNotebooks(parsed);
      } catch (e) {}
    }
    
    if (savedNotes) {
      try {
        const parsed = JSON.parse(savedNotes);
        if (Array.isArray(parsed)) {
          setNotes(parsed);
          setHistory([parsed]);
          setHistoryPointer(0);
        }
      } catch (e) {}
    }

    setIsInitialized(true);
  }, []);

  useEffect(() => {
    if (!isInitialized) return;
    localStorage.setItem(STORAGE_KEY_NOTES, JSON.stringify(notes));
    localStorage.setItem(STORAGE_KEY_NOTEBOOKS, JSON.stringify(notebooks));
  }, [notes, notebooks, isInitialized]);

  const recordState = useCallback((newNotes: ProjectNote[]) => {
    setHistory(prev => {
      const nextHistory = prev.slice(0, historyPointer + 1);
      nextHistory.push(newNotes);
      return nextHistory.slice(-50);
    });
    setHistoryPointer(prev => Math.min(prev + 1, 49));
    setNotes(newNotes);
  }, [historyPointer]);

  const undo = () => {
    if (historyPointer > 0) {
      setNotes(history[historyPointer - 1]);
      setHistoryPointer(p => p - 1);
    }
  };

  const redo = () => {
    if (historyPointer < history.length - 1) {
      setNotes(history[historyPointer + 1]);
      setHistoryPointer(p => p + 1);
    }
  };

  const activeNotebook = useMemo(() => 
    notebooks.find(nb => nb.id === activeNotebookId) || notebooks[0] || DEFAULT_NOTEBOOK
  , [notebooks, activeNotebookId]);

  const filteredNotes = useMemo(() => 
    notes.filter(n => n.notebookId === activeNotebookId)
  , [notes, activeNotebookId]);

  const addNote = useCallback((content: string, type: NoteType = 'quick', extra?: any) => {
    const newNote: ProjectNote = {
      id: crypto.randomUUID(),
      notebookId: activeNotebookId,
      content,
      type,
      timestamp: Date.now(),
      ...extra
    };
    recordState([newNote, ...notes]);
  }, [activeNotebookId, notes, recordState]);

  const deleteNote = (id: string) => recordState(notes.filter(n => n.id !== id));

  const hasUnsavedChanges = useMemo(() => {
    const newestNote = notes.length > 0 ? Math.max(...notes.map(n => n.timestamp)) : 0;
    const newestNotebook = Math.max(...notebooks.map(nb => nb.timestamp));
    return newestNote > lastBackupTime || newestNotebook > lastBackupTime;
  }, [notes, notebooks, lastBackupTime]);

  const handleBackupPerformed = () => {
    const now = Date.now();
    localStorage.setItem(LAST_BACKUP_KEY, now.toString());
    setLastBackupTime(now);
  };

  if (!isInitialized) return null;

  return (
    <div className="flex flex-col min-h-screen bg-stone-200 text-stone-900 overflow-x-hidden paper-texture">
      <Navigation 
        activeView={activeView} 
        onViewChange={setActiveView} 
        activeNotebookTitle={activeNotebook.title}
        onBackToShelf={() => setActiveView('shelf')}
      />

      <main className="flex-1 max-w-5xl mx-auto w-full px-4 md:px-8 py-6 md:py-10">
        {activeView === 'shelf' && (
          <NotebookShelf 
            notebooks={notebooks} 
            notes={notes}
            onSelect={(id) => { setActiveNotebookId(id); setActiveView('steno'); }} 
            onAdd={(t, c) => {
              const nb = { id: crypto.randomUUID(), title: t, color: c, timestamp: Date.now() };
              setNotebooks([...notebooks, nb]);
              setActiveNotebookId(nb.id);
              setActiveView('steno');
            }} 
            onDelete={(id) => {
              if (id === 'general') return;
              setNotebooks(notebooks.filter(n => n.id !== id));
              setNotes(notes.filter(n => n.notebookId !== id));
            }}
            hasUnsavedChanges={hasUnsavedChanges}
            onBackupPerformed={handleBackupPerformed}
          />
        )}
        {activeView === 'steno' && (
          <StenoPad 
            notes={filteredNotes.filter(n => n.type === 'quick')} 
            onAddNote={(c) => addNote(c, 'quick')} 
            onUpdateNote={(id, c) => setNotes(notes.map(n => n.id === id ? { ...n, content: c, timestamp: Date.now() } : n))}
            onDeleteNote={deleteNote}
            onUndo={undo}
            onRedo={redo}
            canUndo={historyPointer > 0}
            canRedo={historyPointer < history.length - 1}
            notebookColor={activeNotebook.color}
          />
        )}
        {activeView === 'research' && (
          <ResearchHub 
            notes={filteredNotes.filter(n => n.type === 'research')} 
            context={filteredNotes.map(n => n.content).join('\n')}
            onAddResearch={(q, a, urls) => addNote(a, 'research', { question: q, metadata: { urls } })}
            onDeleteNote={deleteNote}
          />
        )}
        {activeView === 'outlines' && (
          <Outlines 
            notepadNotes={filteredNotes.filter(n => n.type === 'quick')}
            researchNotes={filteredNotes.filter(n => n.type === 'research')}
            existingOutlines={filteredNotes.filter(n => n.type === 'outline')}
            onSaveOutline={(c) => addNote(c, 'outline')}
            onDeleteOutline={deleteNote}
          />
        )}
        {activeView === 'visuals' && (
          <Visualizer 
            notes={filteredNotes.filter(n => n.type === 'image')}
            notepadContext={filteredNotes.filter(n => n.type === 'quick').map(n => n.content).join('\n')}
            onAddImage={(p, d) => addNote(p, 'image', { metadata: { imageData: d } })}
            onDeleteImage={deleteNote}
          />
        )}
        {activeView === 'raw' && (
          <RawTextEditor allNotes={filteredNotes} notebookTitle={activeNotebook.title} />
        )}
      </main>
    </div>
  );
};

export default App;
