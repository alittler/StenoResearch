
import React, { useState, useEffect, useMemo } from 'react';
import { ProjectNote, AppView, Notebook } from './types';
import Navigation from './components/Navigation';
import Dashboard from './components/Dashboard';
import StenoPad from './components/StenoPad';
import ResearchHub from './components/ResearchHub';
import RawTextEditor from './components/RawTextEditor';
import NotebookShelf from './components/NotebookShelf';

const STORAGE_KEY = 'ledger_core_v3_persistent';
const API_KEY_STORAGE_KEY = 'ledger_user_api_key';

// Real-time dynamic SHA based on current timestamp
const BUILD_SHA = new Date().getTime().toString();

const INITIAL_NOTEBOOKS: Notebook[] = [
  { id: 'general', title: 'Primary Project Ledger', color: '#1e293b', createdAt: Date.now() }
];

const App: React.FC = () => {
  const [notebooks, setNotebooks] = useState<Notebook[]>(INITIAL_NOTEBOOKS);
  const [notes, setNotes] = useState<ProjectNote[]>([]);
  const [activeNotebookId, setActiveNotebookId] = useState<string | null>('general');
  const [currentView, setCurrentView] = useState<AppView>('ledger');
  const [isInitialized, setIsInitialized] = useState(false);
  const [globalApiKey, setGlobalApiKey] = useState(() => localStorage.getItem(API_KEY_STORAGE_KEY) || '');
  const [isKeyModalOpen, setIsKeyModalOpen] = useState(false);

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

  const deleteNote = (id: string) => setNotes(prev => prev.filter(n => n.id !== id));

  const handleSaveKey = (key: string) => {
    setGlobalApiKey(key.trim());
    localStorage.setItem(API_KEY_STORAGE_KEY, key.trim());
    setIsKeyModalOpen(false);
  };

  const renderView = () => {
    if (currentView === 'shelf' || !activeNotebookId) {
      return (
        <NotebookShelf 
          notebooks={notebooks} notes={notes} 
          onSelect={(id) => { setActiveNotebookId(id); setCurrentView('ledger'); }}
          onAdd={(title, color) => setNotebooks(prev => [...prev, { id: crypto.randomUUID(), title, color, createdAt: Date.now() }])}
          onDelete={(id) => { setNotebooks(prev => prev.filter(nb => nb.id !== id)); setNotes(prev => prev.filter(n => n.notebookId !== id)); }}
          hasUnsavedChanges={false} onBackupPerformed={() => {}}
          onRestore={(data) => { setNotebooks(data.notebooks); setNotes(data.notes); }}
        />
      );
    }

    const commonProps = { apiKey: globalApiKey, onRequestKey: () => setIsKeyModalOpen(true) };

    switch (currentView) {
      case 'dashboard': return <Dashboard notebook={activeNotebook!} notes={activeNotes} onNavigate={setCurrentView} onAddNote={(c) => addNote(c, 'ledger')} />;
      case 'ledger': return <StenoPad notes={activeNotes.filter(n => n.type === 'ledger')} onAddNote={(c) => addNote(c, 'ledger')} onDeleteNote={deleteNote} />;
      case 'research': return (
        <ResearchHub 
          {...commonProps}
          notes={activeNotes.filter(n => n.type === 'research')}
          context={activeNotes.slice(0, 10).map(n => n.content).join('\n')}
          onAddResearch={(q, a, u) => addNote(a, 'research', { question: q, metadata: { urls: u } })}
          onPin={(note) => addNote(`📌 RESEARCH DISCOVERY:\n${note.content}`, 'ledger')}
          onDelete={deleteNote}
        />
      );
      case 'raw': return <RawTextEditor allNotes={activeNotes} notebookTitle={activeNotebook!.title} />;
      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-[#f1f5f9] flex flex-col">
      {currentView !== 'shelf' && activeNotebookId && (
        <Navigation 
          activeView={currentView} 
          onViewChange={setCurrentView} 
          activeNotebookTitle={activeNotebook?.title} 
          activeNotebookColor={activeNotebook?.color} 
          onBackToShelf={() => setCurrentView('shelf')} 
        />
      )}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 py-6">{renderView()}</main>
      
      <footer className="py-3 px-6 bg-white border-t border-slate-200 flex justify-between items-center text-[9px] font-mono uppercase tracking-widest text-slate-400">
        <div className="flex items-center gap-4">
          <span className="font-black text-slate-900">PROJECT LEDGER CORE</span>
          <button onClick={() => setIsKeyModalOpen(true)} className={`flex items-center gap-2 ${globalApiKey ? 'text-emerald-500' : 'text-amber-500'}`}>
            <div className={`w-2 h-2 rounded-full ${globalApiKey ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'}`}></div>
            <span>{globalApiKey ? 'GEMINI 3 ACTIVE' : 'KEY REQUIRED'}</span>
          </button>
        </div>
        <div>SHA: {BUILD_SHA}</div>
      </footer>

      {isKeyModalOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/90 backdrop-blur-xl">
          <div className="bg-white rounded-[2rem] p-10 w-full max-w-md text-center">
            <h2 className="text-sm font-black uppercase tracking-widest mb-6">API Configuration</h2>
            <input 
              type="password" placeholder="AIzaSy..."
              className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl p-4 font-mono text-center mb-6"
              value={globalApiKey} onChange={(e) => setGlobalApiKey(e.target.value)}
            />
            <div className="flex gap-4">
              <button onClick={() => setIsKeyModalOpen(false)} className="flex-1 py-3 text-[10px] font-bold">Cancel</button>
              <button onClick={() => handleSaveKey(globalApiKey)} className="flex-1 py-3 bg-slate-900 text-white rounded-xl text-[10px] font-bold">Apply</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
