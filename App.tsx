
import React, { useState, useEffect, useMemo } from 'react';
import { ProjectNote, AppView, Notebook } from './types';
import Navigation from './components/Navigation';
import StenoPad from './components/StenoPad';
import ResearchHub from './components/ResearchHub';
import RawTextEditor from './components/RawTextEditor';
import NotebookShelf from './components/NotebookShelf';
import Outlines from './components/Outlines';
import Visualizer from './components/Visualizer';
import Dashboard from './components/Dashboard';
import { generateSHA256 } from './utils/crypto';

const STORAGE_KEY = 'ledger_core_v10_sha_versioning';

const INITIAL_NOTEBOOKS: Notebook[] = [
  { id: 'general', title: 'Main Project Pad', color: '#1e293b', createdAt: Date.now() }
];

const App: React.FC = () => {
  const [notebooks, setNotebooks] = useState<Notebook[]>(INITIAL_NOTEBOOKS);
  const [notes, setNotes] = useState<ProjectNote[]>([]);
  const [activeNotebookId, setActiveNotebookId] = useState<string | null>('general');
  const [currentView, setCurrentView] = useState<AppView>('ledger');
  const [isInitialized, setIsInitialized] = useState(false);
  const [systemHash, setSystemHash] = useState<string>('INITIALIZING...');

  // Restore logic
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

  // Save logic
  useEffect(() => {
    if (isInitialized) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ notebooks, notes }));
    }
  }, [notebooks, notes, isInitialized]);

  // System-wide Versioning Hash
  useEffect(() => {
    const updateSystemHash = async () => {
      const stateString = JSON.stringify({ notebooks, notes });
      const hash = await generateSHA256(stateString);
      setSystemHash(hash.substring(0, 32).toUpperCase());
    };
    updateSystemHash();
  }, [notebooks, notes]);

  const activeNotebook = useMemo(() => notebooks.find(nb => nb.id === activeNotebookId), [notebooks, activeNotebookId]);
  const activeNotes = useMemo(() => notes.filter(n => n.notebookId === activeNotebookId), [notes, activeNotebookId]);

  const handleAddNote = async (content: string, type: ProjectNote['type'] = 'ledger', extra?: Partial<ProjectNote>) => {
    if (!activeNotebookId) return;
    
    const timestamp = Date.now();
    const hashInput = `${content}-${timestamp}-${activeNotebookId}-${type}`;
    const hash = await generateSHA256(hashInput);
    
    const newNote: ProjectNote = {
      id: crypto.randomUUID(),
      hash: hash,
      content,
      timestamp,
      type,
      notebookId: activeNotebookId,
      ...extra
    };
    setNotes(prev => [newNote, ...prev]);
  };

  const handleDeleteNote = (id: string) => {
    setNotes(prev => prev.filter(n => n.id !== id));
  };

  const handleUpdateNote = (id: string, updates: Partial<ProjectNote>) => {
    setNotes(prev => prev.map(n => n.id === id ? { ...n, ...updates } : n));
  };

  const renderView = () => {
    if (currentView === 'shelf' || !activeNotebookId) {
      return (
        <NotebookShelf 
          notebooks={notebooks} notes={notes} 
          onSelect={(id) => { setActiveNotebookId(id); setCurrentView('ledger'); }}
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
      case 'dashboard': return <Dashboard notebook={activeNotebook!} notes={activeNotes} onNavigate={setCurrentView} onAddNote={(c) => handleAddNote(c, 'ledger')} />;
      case 'ledger': return <StenoPad notes={activeNotes.filter(n => n.type === 'ledger')} onAddNote={(c) => handleAddNote(c, 'ledger')} onDeleteNote={handleDeleteNote} />;
      case 'research': return (
        <ResearchHub 
          apiKey={process.env.API_KEY || ''}
          notes={activeNotes.filter(n => n.type === 'research')}
          context={activeNotes.slice(0, 5).map(n => n.content).join('\n')}
          onAddResearch={(q, a, u) => handleAddNote(a, 'research', { question: q, metadata: { urls: u } })}
          onPin={(note) => { handleAddNote(`📌 PINNED RESEARCH:\n${note.content}`, 'ledger'); }}
          onDelete={handleDeleteNote}
          onRequestKey={() => window.aistudio.openSelectKey()}
        />
      );
      case 'outlines': return (
        <Outlines 
          notepadNotes={activeNotes.filter(n => n.type === 'ledger')}
          researchNotes={activeNotes.filter(n => n.type === 'research')}
          existingOutlines={activeNotes.filter(n => n.type === 'outline')}
          onSaveOutline={(c) => handleAddNote(c, 'outline')}
          onDeleteOutline={handleDeleteNote}
        />
      );
      case 'visualizer': return (
        <Visualizer 
          notes={activeNotes.filter(n => !!n.metadata?.imageData)}
          apiKey={process.env.API_KEY || ''}
          onAddImage={(p, img) => handleAddNote(p, 'ledger', { metadata: { imageData: img } })}
          onDeleteImage={handleDeleteNote}
          onRequestKey={() => window.aistudio.openSelectKey()}
        />
      );
      case 'raw': return <RawTextEditor allNotes={activeNotes} notebookTitle={activeNotebook!.title} />;
      default: return <StenoPad notes={activeNotes.filter(n => n.type === 'ledger')} onAddNote={(c) => handleAddNote(c, 'ledger')} onDeleteNote={handleDeleteNote} />;
    }
  };

  return (
    <div className="min-h-screen bg-[#f1f5f9] flex flex-col font-sans">
      {currentView !== 'shelf' && activeNotebookId && (
        <Navigation 
          activeView={currentView} 
          onViewChange={setCurrentView} 
          activeNotebookTitle={activeNotebook?.title} 
          activeNotebookColor={activeNotebook?.color} 
          onBackToShelf={() => { setCurrentView('shelf'); }} 
        />
      )}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 py-6">
        {renderView()}
      </main>
      
      <footer className="py-3 px-6 bg-white border-t border-slate-200 flex justify-between items-center text-[9px] font-mono uppercase tracking-widest text-slate-400">
        <div className="flex items-center gap-6">
          <span className="font-black text-slate-900">PROJECT LEDGER SYSTEM</span>
          <span className="hidden md:inline font-bold">|</span>
          <span className="hidden md:inline">
            SYSTEM IDENTITY HASH: <span className="text-blue-600 font-black">{systemHash}</span>
          </span>
        </div>
        <div className="flex items-center gap-4">
           <button onClick={() => window.aistudio.openSelectKey()} className="hover:text-slate-800 transition-colors underline decoration-slate-300 underline-offset-2">CONFIGURE API KEY</button>
        </div>
      </footer>
    </div>
  );
};

export default App;
