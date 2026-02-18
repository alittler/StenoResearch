
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { ProjectNote, AppView, Notebook } from './types';
import Navigation from './components/Navigation';
import Dashboard from './components/Dashboard';
import StenoPad from './components/StenoPad';
import ResearchHub from './components/ResearchHub';
import RawTextEditor from './components/RawTextEditor';
import NotebookShelf from './components/NotebookShelf';
import { generateSHA256 } from './utils/crypto';

const STORAGE_KEY = 'steno_ledger_integrated_v1';
const API_KEY_OVERRIDE = 'steno_api_key_override';

const INITIAL_NOTEBOOKS: Notebook[] = [
  { id: 'general', title: 'Primary Project Ledger', color: '#64748b', createdAt: 1700000000000, coreConcept: 'The central vision for the project...' }
];

const App: React.FC = () => {
  const [notebooks, setNotebooks] = useState<Notebook[]>(INITIAL_NOTEBOOKS);
  const [notes, setNotes] = useState<ProjectNote[]>([]);
  const [activeNotebookId, setActiveNotebookId] = useState<string | null>('general');
  const [currentView, setCurrentView] = useState<AppView>('ledger');
  const [isInitialized, setIsInitialized] = useState(false);
  const [versionHash, setVersionHash] = useState<string>('INIT-HASH');
  const [manualApiKey, setManualApiKey] = useState<string>(() => localStorage.getItem(API_KEY_OVERRIDE) || '');

  const lastStateString = useRef<string>('');

  // Load persistence
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.notebooks) setNotebooks(parsed.notebooks);
        if (parsed.notes) setNotes(parsed.notes);
      } catch (e) {
        console.error("Failed to restore state", e);
      }
    }
    setIsInitialized(true);
  }, []);

  // Deterministic Hashing: Sort data by ID to ensure the hash is identical for identical content
  useEffect(() => {
    if (isInitialized) {
      const dataToSave = { notebooks, notes };
      const dataString = JSON.stringify(dataToSave);
      
      if (dataString !== lastStateString.current) {
        localStorage.setItem(STORAGE_KEY, dataString);
        lastStateString.current = dataString;

        // Generate deterministic hash
        const hashPayload = JSON.stringify({
          notebooks: [...notebooks].sort((a, b) => a.id.localeCompare(b.id)),
          notes: [...notes].sort((a, b) => a.id.localeCompare(b.id))
        });
        
        generateSHA256(hashPayload).then(h => setVersionHash(h.substring(0, 8).toUpperCase()));
      }
    }
  }, [notebooks, notes, isInitialized]);

  useEffect(() => {
    if (manualApiKey) {
      localStorage.setItem(API_KEY_OVERRIDE, manualApiKey);
    } else {
      localStorage.removeItem(API_KEY_OVERRIDE);
    }
  }, [manualApiKey]);

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
    }
  };

  const handleRequestKey = async () => {
    // @ts-ignore
    if (window.aistudio && typeof window.aistudio.openSelectKey === 'function') {
      // @ts-ignore
      await window.aistudio.openSelectKey();
    }
  };

  if (!isInitialized) return null;

  const renderContent = () => {
    if (currentView === 'shelf' || !activeNotebookId) {
      return (
        <NotebookShelf 
          notebooks={notebooks}
          notes={notes}
          onSelect={(id) => { setActiveNotebookId(id); setCurrentView('ledger'); }}
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
              onRequestKey={handleRequestKey}
              manualApiKey={manualApiKey}
              onSaveManualKey={setManualApiKey}
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
          Ledger State Integrity Fingerprint
        </div>
        <div className="flex flex-col items-center md:items-end">
          <span className="text-[9px] font-mono text-slate-300 uppercase tracking-tighter">BUILD_V1_STABLE</span>
          <span className="text-[10px] font-mono text-blue-600 font-black tracking-widest text-center md:text-right selection:bg-blue-100">
            {versionHash}
          </span>
        </div>
      </footer>
    </div>
  );
};

export default App;
