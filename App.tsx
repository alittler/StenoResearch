
import React, { useState, useEffect, useMemo } from 'react';
import { ProjectNote, AppView, Notebook } from './types';
import Navigation from './components/Navigation';
import Dashboard from './components/Dashboard';
import StenoPad from './components/StenoPad';
import ResearchHub from './components/ResearchHub';
import RawTextEditor from './components/RawTextEditor';
import NotebookShelf from './components/NotebookShelf';
import { generateSHA256 } from './utils/crypto';

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
  const [versionHash, setVersionHash] = useState<string>('INIT-HASH-PENDING');

  // Load persistence
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setNotebooks(parsed.notebooks || INITIAL_NOTEBOOKS);
        setNotes(parsed.notes || []);
        // Restore previous hash if available, or generate a fresh one
        if (parsed.lastSaved) {
           generateSHA256(parsed.lastSaved).then(h => setVersionHash(h.substring(0, 16).toUpperCase()));
        }
      } catch (e) {
        console.error("Failed to restore state", e);
      }
    }
    setIsInitialized(true);
  }, []);

  // Save persistence & Update Version Hash
  useEffect(() => {
    if (isInitialized) {
      const now = new Date().toISOString();
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ notebooks, notes, lastSaved: now }));
      
      // Update the visual version hash based on the timestamp of this specific update (shortened)
      generateSHA256(now).then(h => setVersionHash(h.substring(0, 16).toUpperCase()));
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

  const renderContent = () => {
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
      <div className="min-h-screen bg-[#f8fafc] flex flex-col">
        <Navigation 
          activeView={currentView}
          onViewChange={setCurrentView}
          activeNotebookTitle={activeNotebook?.title}
          activeNotebookColor={activeNotebook?.color}
          onBackToShelf={() => setCurrentView('shelf')}
        />

        <main className="flex-1 max-w-6xl mx-auto px-4 py-8 w-full">
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

  return (
    <div className="min-h-screen flex flex-col bg-[#f8fafc]">
      {renderContent()}
      
      <footer className="w-full py-4 px-6 border-t border-slate-200 bg-white flex flex-col md:flex-row justify-between items-center gap-2">
        <div className="text-[10px] font-mono text-slate-400 font-bold uppercase tracking-widest flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-slate-200"></span>
          Ledger Version Integrity System
        </div>
        <div className="flex flex-col items-center md:items-end">
          <span className="text-[9px] font-mono text-slate-300 uppercase tracking-tighter">STATE_VER_SIG_16</span>
          <span className="text-[10px] font-mono text-blue-600 font-black tracking-widest text-center md:text-right selection:bg-blue-100">
            {versionHash}
          </span>
        </div>
      </footer>
    </div>
  );
};

export default App;
