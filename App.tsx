
import React, { useState, useEffect, useMemo } from 'react';
import { ProjectNote, AppView, Notebook } from './types';
import Navigation from './components/Navigation';
import Dashboard from './components/Dashboard';
import StenoPad from './components/StenoPad';
import ResearchHub from './components/ResearchHub';
import RawTextEditor from './components/RawTextEditor';
import NotebookShelf from './components/NotebookShelf';

const STORAGE_KEY = 'ledger_core_v3';
const BUILD_SHA = '9a2c4e8'; // Updated build identifier

const INITIAL_NOTEBOOKS: Notebook[] = [
  { id: 'general', title: 'Primary Project Ledger', color: '#1e293b', createdAt: Date.now() }
];

const App: React.FC = () => {
  const [notebooks, setNotebooks] = useState<Notebook[]>(INITIAL_NOTEBOOKS);
  const [notes, setNotes] = useState<ProjectNote[]>([]);
  const [activeNotebookId, setActiveNotebookId] = useState<string | null>(null);
  const [currentView, setCurrentView] = useState<AppView>('shelf');
  const [isInitialized, setIsInitialized] = useState(false);
  const [hasUnsavedExport, setHasUnsavedExport] = useState(false);

  // Load persistence from local cache
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setNotebooks(parsed.notebooks || INITIAL_NOTEBOOKS);
        setNotes(parsed.notes || []);
        // If we just loaded, we assume it's "saved" relative to the last export status 
        // (Simplified logic: we set unsaved export to true on any future change)
      } catch (e) {
        console.error("Persistence error", e);
      }
    }
    setIsInitialized(true);
  }, []);

  // Sync to local cache on every change
  useEffect(() => {
    if (isInitialized) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ notebooks, notes }));
    }
  }, [notebooks, notes, isInitialized]);

  // Track changes for export warning
  useEffect(() => {
    if (isInitialized) {
      // Any time notebooks or notes change, we mark the export as "dirty"
      setHasUnsavedExport(true);
    }
  }, [notebooks, notes]);

  // Handle "Warn on Exit" browser event
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedExport) {
        const message = "You have unsaved changes that haven't been exported. Are you sure you want to exit?";
        e.returnValue = message;
        return message;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedExport]);

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
      createdAt: Date.now()
    };
    setNotebooks(prev => [...prev, newNB]);
  };

  const handleDeleteNotebook = (id: string) => {
    if (id === 'general') return;
    setNotebooks(prev => prev.filter(nb => nb.id !== id));
    setNotes(prev => prev.filter(n => n.notebookId !== id));
  };

  const handleBackupPerformed = () => {
    setHasUnsavedExport(false);
  };

  const handleRestore = (data: any) => {
    if (data.notebooks && data.notes) {
      setNotebooks(data.notebooks);
      setNotes(data.notes);
      setHasUnsavedExport(false);
    }
  };

  if (!isInitialized) return null;

  const renderView = () => {
    if (currentView === 'shelf' || !activeNotebookId) {
      return (
        <div className="flex-1">
          <NotebookShelf 
            notebooks={notebooks}
            notes={notes}
            onSelect={(id) => { setActiveNotebookId(id); setCurrentView('dashboard'); }}
            onAdd={handleCreateNotebook}
            onDelete={handleDeleteNotebook}
            hasUnsavedChanges={hasUnsavedExport}
            onBackupPerformed={handleBackupPerformed}
            onRestore={handleRestore}
          />
        </div>
      );
    }

    return (
      <main className="max-w-6xl mx-auto px-4 py-8 flex-1 w-full">
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
            onRequestKey={async () => {
              if ((window as any).aistudio?.openSelectKey) {
                await (window as any).aistudio.openSelectKey();
              }
            }}
          />
        )}
        {currentView === 'raw' && (
          <RawTextEditor 
            allNotes={activeNotes}
            notebookTitle={activeNotebook!.title}
          />
        )}
      </main>
    );
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col">
      {currentView !== 'shelf' && activeNotebookId && (
        <Navigation 
          activeView={currentView}
          onViewChange={setCurrentView}
          activeNotebookTitle={activeNotebook?.title}
          activeNotebookColor={activeNotebook?.color}
          onBackToShelf={() => setCurrentView('shelf')}
        />
      )}

      {renderView()}

      <footer className="py-4 px-6 bg-white border-t border-slate-200 flex justify-between items-center text-[10px] font-mono uppercase tracking-widest">
        <div className="flex items-center gap-6">
          <span className="text-slate-300 font-bold">&copy; Project Ledger Core</span>
          {hasUnsavedExport && (
            <div className="flex items-center gap-2 text-amber-500 font-black animate-pulse">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
              UNSYNCED EXPORT
            </div>
          )}
          {!hasUnsavedExport && (
            <div className="flex items-center gap-2 text-emerald-400 font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              BACKED UP
            </div>
          )}
        </div>
        <div className="text-slate-300 font-bold">SHA: {BUILD_SHA}</div>
      </footer>
    </div>
  );
};

export default App;
