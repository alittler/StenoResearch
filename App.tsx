
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

const DEFAULT_NOTEBOOK: Notebook = {
  id: 'general',
  title: 'Active Ledger',
  color: '#fef3c7',
  timestamp: Date.now()
};

const App: React.FC = () => {
  const [notebooks, setNotebooks] = useState<Notebook[]>([DEFAULT_NOTEBOOK]);
  const [notes, setNotes] = useState<ProjectNote[]>([]);
  const [activeNotebookId, setActiveNotebookId] = useState<string>('general');
  const [activeView, setActiveView] = useState<AppView>('steno');
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize Data
  useEffect(() => {
    const savedNotes = localStorage.getItem(STORAGE_KEY_NOTES);
    const savedNotebooks = localStorage.getItem(STORAGE_KEY_NOTEBOOKS);

    if (savedNotebooks) {
      try {
        const parsed = JSON.parse(savedNotebooks);
        if (Array.isArray(parsed) && parsed.length > 0) setNotebooks(parsed);
      } catch (e) {}
    }
    
    if (savedNotes) {
      try {
        const parsed = JSON.parse(savedNotes);
        if (Array.isArray(parsed)) setNotes(parsed);
      } catch (e) {}
    }

    setIsInitialized(true);
  }, []);

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

  const addNote = useCallback((content: string, type: NoteType = 'quick', extra?: any) => {
    const newNote: ProjectNote = {
      id: crypto.randomUUID(),
      notebookId: activeNotebookId,
      content,
      type,
      timestamp: Date.now(),
      ...extra
    };
    setNotes(prev => [newNote, ...prev]);
  }, [activeNotebookId]);

  const deleteNote = (id: string) => setNotes(prev => prev.filter(n => n.id !== id));

  const updateNote = (id: string, content: string) => {
    setNotes(prev => prev.map(n => n.id === id ? { ...n, content, timestamp: Date.now() } : n));
  };

  if (!isInitialized) return null;

  return (
    <div className="flex flex-col min-h-screen">
      <Navigation 
        activeView={activeView} 
        onViewChange={setActiveView} 
        activeNotebookTitle={activeNotebook.title}
        onBackToShelf={() => setActiveView('shelf')}
      />

      <main className="flex-1 max-w-5xl mx-auto w-full px-4 md:px-8 py-8">
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
            hasUnsavedChanges={false}
            onBackupPerformed={() => {}}
          />
        )}
        {activeView === 'steno' && (
          <StenoPad 
            notes={filteredNotes.filter(n => n.type === 'quick')} 
            onAddNote={(c) => addNote(c, 'quick')} 
            onUpdateNote={updateNote}
            onDeleteNote={deleteNote}
            notebookColor={activeNotebook.color}
          />
        )}
        {activeView === 'research' && (
          <ResearchHub 
            notes={filteredNotes.filter(n => n.type === 'research')} 
            context={filteredNotes.filter(n => n.type === 'quick').map(n => n.content).join('\n')}
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
