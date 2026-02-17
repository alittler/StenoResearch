
import React, { useState, useEffect, useMemo } from 'react';
import { ProjectNote, AppView, Notebook } from './types';
import Navigation from './components/Navigation';
import Dashboard from './components/Dashboard';
import StenoPad from './components/StenoPad';
import ResearchHub from './components/ResearchHub';
import Outlines from './components/Outlines';
import Visualizer from './components/Visualizer';
import RawTextEditor from './components/RawTextEditor';
import NotebookShelf from './components/NotebookShelf';

const STORAGE_KEY = 'steno_ledger_integrated_v1';

const INITIAL_NOTEBOOKS: Notebook[] = [
  { id: 'general', title: 'Primary Project Ledger', color: '#64748b', createdAt: Date.now(), coreConcept: 'The central vision for the project...' }
];

const App: React.FC = () => {
  const [notebooks, setNotebooks] = useState<Notebook[]>(INITIAL_NOTEBOOKS);
  const [notes, setNotes] = useState<ProjectNote[]>([]);
  const [activeNotebookId, setActiveNotebookId] = useState<string | null>(null);
  const [currentView, setCurrentView] = useState<AppView>('shelf');
  const [isInitialized, setIsInitialized] = useState(false);

  // Load persistence
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setNotebooks(parsed.notebooks || INITIAL_NOTEBOOKS);
        setNotes(parsed.notes || []);
      } catch (e) {
        console.error("Failed to restore state", e);
      }
    }
    setIsInitialized(true);
  }, []);

  // Save persistence
  useEffect(() => {
    if (isInitialized) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ notebooks, notes }));
    }
  }, [notebooks, notes, isInitialized]);

  const activeNotebook = useMemo(() => 
    notebooks.find(nb => nb.id === activeNotebookId), 
    [notebooks, activeNotebookId]
  );

  const activeNotes = useMemo(() => 
    notes.filter(n => n.notebookId === activeNotebookId), 
    [notes, activeNotebookId]
  );

  const addNote = (content: string, type: ProjectNote['type'] = 'ledger', extra?: Partial<ProjectNote>) => {
    if (!activeNotebookId) return;
    const newNote: ProjectNote = {
      id: crypto.randomUUID(),
      content,
      timestamp: Date.now(),
      type,
      notebookId: activeNotebookId,
      ...extra
    };
    setNotes(prev => [newNote, ...prev]);
  };

  const deleteNote = (id: string) => {
    setNotes(prev => prev.filter(n => n.id !== id));
  };

  const handleCreateNotebook = (title: string, color: string) => {
    const newNB: Notebook = {
      id: crypto.randomUUID(),
      title,
      color,
      createdAt: Date.now(),
      coreConcept: ''
    };
    setNotebooks(prev => [...prev, newNB]);
  };

  const handleDeleteNotebook = (id: string) => {
    if (id === 'general') return;
    setNotebooks(prev => prev.filter(nb => nb.id !== id));
    setNotes(prev => prev.filter(n => n.notebookId !== id));
  };

  const handleRestore = (data: any) => {
    if (data.notebooks && data.notes) {
      setNotebooks(data.notebooks);
      setNotes(data.notes);
      alert("Restore successful.");
    }
  };

  if (!isInitialized) return null;

  if (currentView === 'shelf' || !activeNotebookId) {
    return (
      <NotebookShelf 
        notebooks={notebooks}
        notes={notes}
        onSelect={(id) => { setActiveNotebookId(id); setCurrentView('dashboard'); }}
        onAdd={handleCreateNotebook}
        onDelete={handleDeleteNotebook}
        hasUnsavedChanges={false}
        onBackupPerformed={() => {}}
        onRestore={handleRestore}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      <Navigation 
        activeView={currentView}
        onViewChange={setCurrentView}
        activeNotebookTitle={activeNotebook?.title}
        activeNotebookColor={activeNotebook?.color}
        onBackToShelf={() => setCurrentView('shelf')}
      />

      <main className="max-w-6xl mx-auto px-4 py-8">
        {currentView === 'dashboard' && (
          <Dashboard 
            notebook={activeNotebook!}
            notes={activeNotes}
            onNavigate={setCurrentView}
            onAddNote={(c) => addNote(c, 'ledger')}
          />
        )}

        {currentView === 'ledger' && (
          <StenoPad 
            notes={activeNotes.filter(n => n.type === 'ledger')}
            onAddNote={(c) => addNote(c, 'ledger')}
            onDeleteNote={deleteNote}
          />
        )}

        {currentView === 'research' && (
          <ResearchHub 
            notes={activeNotes.filter(n => n.type === 'research')}
            context={activeNotes.slice(0, 10).map(n => n.content).join('\n')}
            onAddResearch={(q, a, u) => addNote(a, 'research', { question: q, metadata: { urls: u } })}
            onPin={(note) => addNote(`📌 PINNED RESEARCH:\n${note.content}`, 'ledger')}
            onDelete={deleteNote}
          />
        )}

        {currentView === 'brief' && (
          <Outlines 
            notepadNotes={activeNotes.filter(n => n.type === 'ledger')}
            researchNotes={activeNotes.filter(n => n.type === 'research')}
            existingOutlines={activeNotes.filter(n => n.type === 'outline')}
            onSaveOutline={(content) => addNote(content, 'outline')}
            onDeleteOutline={deleteNote}
          />
        )}

        {currentView === 'visualizer' && (
          <Visualizer 
            notes={activeNotes.filter(n => n.type === 'image')}
            notepadContext={activeNotes.slice(0, 5).map(n => n.content).join('\n')}
            onAddImage={(prompt, data) => addNote(prompt, 'image', { metadata: { imageData: data } })}
            onDeleteImage={deleteNote}
          />
        )}

        {currentView === 'raw' && (
          <RawTextEditor 
            allNotes={activeNotes}
            notebookTitle={activeNotebook!.title}
          />
        )}
      </main>
    </div>
  );
};

export default App;
