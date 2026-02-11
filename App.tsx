
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { ProjectNote, AppView, NoteType, Notebook } from './types';
import StenoPad from './components/StenoPad';
import ResearchHub from './components/ResearchHub';
import RawTextEditor from './components/RawTextEditor';
import Navigation from './components/Navigation';
import Outlines from './components/Outlines';
import NotebookShelf from './components/NotebookShelf';

const STORAGE_KEY_NOTES = 'steno_research_notes_v3';
const STORAGE_KEY_NOTEBOOKS = 'steno_research_notebooks_v3';

const DEFAULT_NOTEBOOK: Notebook = {
  id: 'general',
  title: 'Default Notepad',
  description: 'Quick thoughts and general reminders.',
  color: '#fef3c7',
  timestamp: Date.now()
};

const App: React.FC = () => {
  const [notebooks, setNotebooks] = useState<Notebook[]>([DEFAULT_NOTEBOOK]);
  const [notes, setNotes] = useState<ProjectNote[]>([]);
  const [activeNotebookId, setActiveNotebookId] = useState<string>('general');
  const [activeView, setActiveView] = useState<AppView>('shelf');
  const [isInitialized, setIsInitialized] = useState(false);
  
  // unique key to force-reset the entire component tree on restore
  const [sessionKey, setSessionKey] = useState(0);

  // Undo/Redo History
  const [history, setHistory] = useState<ProjectNote[][]>([]);
  const [historyPointer, setHistoryPointer] = useState(-1);

  // 1. Initial Load from Storage
  useEffect(() => {
    const savedNotes = localStorage.getItem(STORAGE_KEY_NOTES);
    const savedNotebooks = localStorage.getItem(STORAGE_KEY_NOTEBOOKS);
    
    let loadedNotebooks: Notebook[] = [DEFAULT_NOTEBOOK];
    let loadedNotes: ProjectNote[] = [];

    if (savedNotebooks) {
      try {
        const parsed = JSON.parse(savedNotebooks);
        if (Array.isArray(parsed) && parsed.length > 0) {
          loadedNotebooks = parsed;
        }
      } catch (e) { console.error("Load Error (Notebooks):", e); }
    }
    
    if (savedNotes) {
      try {
        const parsed = JSON.parse(savedNotes);
        if (Array.isArray(parsed)) {
          loadedNotes = parsed;
        }
      } catch (e) { console.error("Load Error (Notes):", e); }
    }

    setNotebooks(loadedNotebooks);
    setNotes(loadedNotes);
    
    // Initialize history with loaded state
    setHistory([loadedNotes]);
    setHistoryPointer(0);
    
    setIsInitialized(true);
  }, [sessionKey]); // Re-run if sessionKey changes (Hard Reset)

  // 2. Continuous Sync to Storage
  useEffect(() => {
    if (!isInitialized) return;
    localStorage.setItem(STORAGE_KEY_NOTES, JSON.stringify(notes));
    localStorage.setItem(STORAGE_KEY_NOTEBOOKS, JSON.stringify(notebooks));
  }, [notes, notebooks, isInitialized]);

  const activeNotebook = useMemo(() => 
    notebooks.find(nb => nb.id === activeNotebookId) || notebooks[0] || DEFAULT_NOTEBOOK
  , [notebooks, activeNotebookId]);

  const filteredNotes = useMemo(() => 
    notes.filter(n => n.notebookId === activeNotebookId)
  , [notes, activeNotebookId]);

  const recordState = useCallback((newNotes: ProjectNote[]) => {
    setHistory(prev => {
      const nextHistory = prev.slice(0, historyPointer + 1);
      nextHistory.push(newNotes);
      if (nextHistory.length > 50) nextHistory.shift();
      return nextHistory;
    });
    setHistoryPointer(prev => {
      const next = prev + 1;
      return next > 49 ? 49 : next;
    });
    setNotes(newNotes);
  }, [historyPointer]);

  const undo = useCallback(() => {
    if (historyPointer > 0) {
      const prevStep = historyPointer - 1;
      setNotes(history[prevStep]);
      setHistoryPointer(prevStep);
    }
  }, [history, historyPointer]);

  const redo = useCallback(() => {
    if (historyPointer < history.length - 1) {
      const nextStep = historyPointer + 1;
      setNotes(history[nextStep]);
      setHistoryPointer(nextStep);
    }
  }, [history, historyPointer]);

  const findTargetNotebook = useCallback((content: string, currentId: string): string => {
    const hashtags = content.match(/#[\w-]+/g)?.map(t => t.toLowerCase().replace('#', '')) || [];
    if (hashtags.length === 0) return currentId;

    for (const tag of hashtags) {
      const match = notebooks.find(nb => {
        const titleNormal = nb.title.toLowerCase().replace(/\s+/g, '');
        const titleUnderscore = nb.title.toLowerCase().replace(/\s+/g, '_');
        return titleNormal === tag || titleUnderscore === tag;
      });
      if (match) return match.id;
    }
    return currentId;
  }, [notebooks]);

  // ATOMIC RESTORE: Write to disk and trigger a full app reboot
  const handleImportLibrary = (data: { notebooks: Notebook[], notes: ProjectNote[] }) => {
    if (confirm("This will permanently overwrite your current library. Proceed?")) {
      try {
        // Step 1: Synchronous Write to Disk
        localStorage.setItem(STORAGE_KEY_NOTEBOOKS, JSON.stringify(data.notebooks));
        localStorage.setItem(STORAGE_KEY_NOTES, JSON.stringify(data.notes));
        
        // Step 2: Trigger Hard Reset
        setIsInitialized(false); // Temporarily pause auto-save
        setSessionKey(prev => prev + 1); // This triggers the loading useEffect again
        setActiveNotebookId('general');
        setActiveView('shelf');
        
        alert("Library restored successfully.");
      } catch (err) {
        alert("Critical Error: Could not write to local storage.");
        console.error(err);
      }
    }
  };

  const addNotebook = (title: string, color: string) => {
    const newNb: Notebook = { id: crypto.randomUUID(), title, color, timestamp: Date.now() };
    setNotebooks(prev => [...prev, newNb]);
    setActiveNotebookId(newNb.id);
    setActiveView('steno');
  };

  const deleteNotebook = (id: string) => {
    if (id === 'general') return;
    if (confirm("Permanently delete this notebook?")) {
      setNotebooks(prev => prev.filter(nb => nb.id !== id));
      const newNotes = notes.filter(n => n.notebookId !== id);
      recordState(newNotes);
      if (activeNotebookId === id) {
        setActiveNotebookId('general');
        setActiveView('shelf');
      }
    }
  };

  const addNote = useCallback((content: string, type: NoteType = 'quick', extra?: Partial<ProjectNote>) => {
    const targetId = type === 'quick' ? findTargetNotebook(content, activeNotebookId) : activeNotebookId;
    const tags = content.match(/#[\w-]+/g)?.map(t => t.toLowerCase()) || [];
    
    const newNote: ProjectNote = {
      id: crypto.randomUUID(),
      notebookId: targetId,
      content,
      type,
      tags,
      timestamp: Date.now(),
      ...extra
    };
    
    const newNotes = [newNote, ...notes];
    recordState(newNotes);
  }, [activeNotebookId, findTargetNotebook, notes, recordState]);

  const updateNote = useCallback((id: string, newContent: string) => {
    const noteToUpdate = notes.find(n => n.id === id);
    if (!noteToUpdate) return;

    const targetId = noteToUpdate.type === 'quick' 
      ? findTargetNotebook(newContent, noteToUpdate.notebookId) 
      : noteToUpdate.notebookId;

    const tags = newContent.match(/#[\w-]+/g)?.map(t => t.toLowerCase()) || [];
    
    const newNotes = notes.map(note => 
      note.id === id ? { ...note, content: newContent, tags, notebookId: targetId } : note
    );
    recordState(newNotes);
  }, [notes, findTargetNotebook, recordState]);

  const deleteNote = useCallback((id: string) => {
    const newNotes = notes.filter(n => n.id !== id);
    recordState(newNotes);
  }, [notes, recordState]);

  return (
    <div key={sessionKey} className="flex flex-col min-h-screen bg-stone-100 text-stone-900">
      <Navigation 
        activeView={activeView} 
        onViewChange={setActiveView} 
        activeNotebookTitle={activeNotebook.title}
        onBackToShelf={() => setActiveView('shelf')}
      />
      <main className="flex-1 max-w-5xl mx-auto w-full p-4 md:p-8">
        {!isInitialized ? (
          <div className="flex flex-col items-center justify-center h-[60vh] text-stone-400 font-mono animate-pulse">
            <span className="text-4xl mb-4">📖</span>
            <p className="uppercase tracking-widest text-xs">Accessing Archives...</p>
          </div>
        ) : (
          <>
            {activeView === 'shelf' && (
              <NotebookShelf 
                notebooks={notebooks} 
                notes={notes}
                onSelect={(id) => { setActiveNotebookId(id); setActiveView('steno'); }} 
                onAdd={addNotebook} 
                onDelete={deleteNotebook}
                onImport={handleImportLibrary}
              />
            )}
            {activeView === 'steno' && (
              <StenoPad 
                notes={filteredNotes.filter(n => n.type === 'quick')} 
                onAddNote={(c) => addNote(c, 'quick')} 
                onUpdateNote={updateNote} 
                onDeleteNote={deleteNote} 
                onUndo={undo}
                onRedo={redo}
                canUndo={historyPointer > 0}
                canRedo={historyPointer < history.length - 1}
                notebookColor={activeNotebook.color}
                notebooks={notebooks}
              />
            )}
            {activeView === 'outlines' && (
              <Outlines 
                notepadNotes={filteredNotes.filter(n => n.type === 'quick')}
                researchNotes={filteredNotes.filter(n => n.type === 'research')}
                existingOutlines={filteredNotes.filter(n => n.type === 'outline')}
                onSaveOutline={(content) => addNote(content, 'outline')}
                onDeleteOutline={deleteNote}
              />
            )}
            {activeView === 'research' && (
              <ResearchHub notes={filteredNotes.filter(n => n.type === 'research')} context={filteredNotes.map(n => n.content).join('\n')} onAddResearch={(q, a, urls) => addNote(a, 'research', { question: q, metadata: { urls } })} onDeleteNote={deleteNote} />
            )}
            {activeView === 'raw' && (
              <RawTextEditor 
                allNotes={filteredNotes} 
                notebookTitle={activeNotebook.title}
              />
            )}
          </>
        )}
      </main>
    </div>
  );
};

export default App;
