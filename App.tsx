
import React, { useState, useEffect, useMemo } from 'react';
import { ProjectNote, AppView, Notebook } from './types';
import Navigation from './components/Navigation';
import Dashboard from './components/Dashboard';
import StenoPad from './components/StenoPad';
import ResearchHub from './components/ResearchHub';
import RawTextEditor from './components/RawTextEditor';
import NotebookShelf from './components/NotebookShelf';

const STORAGE_KEY = 'ledger_core_v5_persistent';

const INITIAL_NOTEBOOKS: Notebook[] = [
  { id: 'general', title: 'Main Project Pad', color: '#1e293b', createdAt: Date.now() }
];

const App: React.FC = () => {
  const [notebooks, setNotebooks] = useState<Notebook[]>(INITIAL_NOTEBOOKS);
  const [notes, setNotes] = useState<ProjectNote[]>([]);
  const [activeNotebookId, setActiveNotebookId] = useState<string | null>('general');
  const [currentView, setCurrentView] = useState<AppView>('ledger');
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.notebooks) setNotebooks(parsed.notebooks);
        if (parsed.notes) setNotes(parsed.notes);
      } catch (e) { console.error("Restore failed", e); }
    }
    setIsInitialized(true);
  }, []);

  useEffect(() => {
    if (isInitialized) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ notebooks, notes }));
    }
  }, [notebooks, notes, isInitialized]);

  const activeNotebook = useMemo(() => notebooks.find(nb => nb.id === activeNotebookId), [notebooks, activeNotebookId]);
  const activeNotes = useMemo(() => notes.filter(n => n.notebookId === activeNotebookId), [notes, activeNotebookId]);

  const handleAddNote = (content: string, type: ProjectNote['type'] = 'ledger', extra?: Partial<ProjectNote>) => {
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

  const handleDeleteNote = (id: string) => {
    setNotes(prev => prev.filter(n => n.id !== id));
  };

  const changeView = (view: AppView) => {
    setCurrentView(view);
  };

  const renderView = () => {
    if (currentView === 'shelf' || !activeNotebookId) {
      return (
        <NotebookShelf 
          notebooks={notebooks} notes={notes} 
          onSelect={(id) => { setActiveNotebookId(id); changeView('ledger'); }}
          onAdd={(title, color) => {
            setNotebooks(prev => [...prev, { id: crypto.randomUUID(), title, color, createdAt: Date.now() }]);
          }}
          onDelete={(id) => { 
            setNotebooks(prev => prev.filter(nb => nb.id !== id)); 
            setNotes(prev => prev.filter(n => n.notebookId !== id)); 
          }}
          hasUnsavedChanges={false} onBackupPerformed={() => {}}
          onRestore={(data) => { setNotebooks(data.notebooks); setNotes(data.notes); }}
        />
      );
    }

    switch (currentView) {
      case 'dashboard': return <Dashboard notebook={activeNotebook!} notes={activeNotes} onNavigate={changeView} onAddNote={(c) => handleAddNote(c, 'ledger')} />;
      case 'ledger': return <StenoPad notes={activeNotes.filter(n => n.type === 'ledger')} onAddNote={(c) => handleAddNote(c, 'ledger')} onDeleteNote={handleDeleteNote} />;
      case 'research': return (
        <ResearchHub 
          apiKey={process.env.API_KEY || ''}
          notes={activeNotes.filter(n => n.type === 'research')}
          context={activeNotes.slice(0, 5).map(n => n.content).join('\n')}
          onAddResearch={(q, a, u) => handleAddNote(a, 'research', { question: q, metadata: { urls: u } })}
          onPin={(note) => { handleAddNote(`📌 PINNED RESEARCH:\n${note.content}`, 'ledger'); }}
          onDelete={handleDeleteNote}
          onRequestKey={() => {}}
        />
      );
      case 'raw': return <RawTextEditor allNotes={activeNotes} notebookTitle={activeNotebook!.title} />;
      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-[#f1f5f9] flex flex-col font-sans">
      {currentView !== 'shelf' && activeNotebookId && (
        <Navigation 
          activeView={currentView} 
          onViewChange={changeView} 
          activeNotebookTitle={activeNotebook?.title} 
          activeNotebookColor={activeNotebook?.color} 
          onBackToShelf={() => { setCurrentView('shelf'); }} 
        />
      )}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 py-6">{renderView()}</main>
      
      <footer className="py-3 px-6 bg-white border-t border-slate-200 flex justify-between items-center text-[9px] font-mono uppercase tracking-widest text-slate-400">
        <div className="flex items-center gap-6">
          <span className="font-black text-slate-900">PROJECT LEDGER V5</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-slate-300">SYSTEM READY</span>
        </div>
      </footer>
    </div>
  );
};

export default App;
