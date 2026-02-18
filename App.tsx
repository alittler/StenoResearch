
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { ProjectNote, AppView, Notebook } from './types';
import Navigation from './components/Navigation';
import Dashboard from './components/Dashboard';
import StenoPad from './components/StenoPad';
import ResearchHub from './components/ResearchHub';
import RawTextEditor from './components/RawTextEditor';
import NotebookShelf from './components/NotebookShelf';
import Outlines from './components/Outlines';
import Visualizer from './components/Visualizer';

const STORAGE_KEY = 'ledger_core_v3_persistent';
const API_KEY_STORAGE_KEY = 'ledger_user_api_key';
const BUILD_SHA = 'quota-fix-v5';

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
  const [userHasInteracted, setUserHasInteracted] = useState(false);
  
  // API Key State
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

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedExport && userHasInteracted) {
        e.preventDefault();
        e.returnValue = "Unsaved changes detected.";
        return e.returnValue;
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedExport, userHasInteracted]);

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
    setUserHasInteracted(true);
  };

  const deleteNote = (id: string) => setNotes(prev => prev.filter(n => n.id !== id));

  const handleRequestKey = async () => {
    // FORCE the modal to open immediately
    setIsKeyModalOpen(true);
    // Optionally trigger system dialog if available
    if ((window as any).aistudio?.openSelectKey) {
      try {
        await (window as any).aistudio.openSelectKey();
      } catch (e) { console.warn("System key selector failed, using manual modal."); }
    }
  };

  const handleSaveKey = (key: string) => {
    const cleanKey = key.trim();
    setGlobalApiKey(cleanKey);
    localStorage.setItem(API_KEY_STORAGE_KEY, cleanKey);
    setIsKeyModalOpen(false);
  };

  const renderView = () => {
    if (currentView === 'shelf' || !activeNotebookId) {
      return (
        <NotebookShelf 
          notebooks={notebooks} notes={notes} 
          onSelect={(id) => { setActiveNotebookId(id); setCurrentView('dashboard'); }}
          onAdd={(title, color) => setNotebooks(prev => [...prev, { id: crypto.randomUUID(), title, color, createdAt: Date.now() }])}
          onDelete={(id) => { setNotebooks(prev => prev.filter(nb => nb.id !== id)); setNotes(prev => prev.filter(n => n.notebookId !== id)); }}
          hasUnsavedChanges={hasUnsavedExport} onBackupPerformed={() => setHasUnsavedExport(false)}
          onRestore={(data) => { setNotebooks(data.notebooks); setNotes(data.notes); setHasUnsavedExport(false); }}
        />
      );
    }

    const commonProps = {
      apiKey: globalApiKey,
      onRequestKey: handleRequestKey
    };

    switch (currentView) {
      case 'dashboard': return <Dashboard notebook={activeNotebook!} notes={activeNotes} onNavigate={setCurrentView} onAddNote={(c) => addNote(c, 'ledger')} />;
      case 'ledger': return <StenoPad notes={activeNotes.filter(n => n.type === 'ledger')} onAddNote={(c) => addNote(c, 'ledger')} onDeleteNote={deleteNote} />;
      case 'research': return (
        <ResearchHub 
          {...commonProps}
          notes={activeNotes.filter(n => n.type === 'research')}
          context={activeNotes.slice(0, 10).map(n => n.content).join('\n')}
          onAddResearch={(q, a, u) => addNote(a, 'research', { question: q, metadata: { urls: u } })}
          onPin={(note) => addNote(`📌 PINNED RESEARCH:\n${note.content}`, 'ledger')}
          onDelete={deleteNote}
        />
      );
      case 'raw': return <RawTextEditor allNotes={activeNotes} notebookTitle={activeNotebook!.title} />;
      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col">
      {currentView !== 'shelf' && activeNotebookId && (
        <Navigation activeView={currentView} onViewChange={setCurrentView} activeNotebookTitle={activeNotebook?.title} activeNotebookColor={activeNotebook?.color} onBackToShelf={() => setCurrentView('shelf')} />
      )}
      <main className="flex-1 w-full max-w-6xl mx-auto px-4 py-8">{renderView()}</main>
      
      {/* Footer */}
      <footer className="py-4 px-6 bg-white border-t border-slate-200 flex justify-between items-center text-[10px] font-mono uppercase tracking-widest">
        <div className="flex items-center gap-6">
          <span className="text-slate-300 font-bold">PROJECT LEDGER CORE</span>
          <button onClick={handleRequestKey} className={`font-black flex items-center gap-2 ${globalApiKey ? 'text-emerald-500' : 'text-amber-500 animate-pulse'}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${globalApiKey ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
            {globalApiKey ? 'API KEY ACTIVE' : 'KEY REQUIRED'}
          </button>
        </div>
        <div className="text-slate-300 font-bold">SHA: {BUILD_SHA}</div>
      </footer>

      {/* Manual Key Modal - HIGH Z-INDEX */}
      {isKeyModalOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-lg animate-fade-in">
          <div className="bg-white rounded-[2.5rem] shadow-2xl p-10 w-full max-w-md border border-slate-100 flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center text-3xl mb-6">🔑</div>
            <h2 className="text-sm font-black uppercase tracking-[0.3em] mb-4 text-slate-800">API Key Configuration</h2>
            <p className="text-[11px] text-slate-500 mb-8 leading-relaxed max-w-[280px]">
              The current key is either missing or has exceeded its free quota. Please paste a <strong>paid-tier</strong> Gemini API key below.
            </p>
            <input 
              type="password" placeholder="AIzaSy..."
              className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 text-sm font-mono focus:border-blue-400 outline-none transition-all mb-8 text-center"
              value={globalApiKey} onChange={(e) => setGlobalApiKey(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSaveKey(globalApiKey)}
              autoFocus
            />
            <div className="flex w-full gap-4">
              <button onClick={() => setIsKeyModalOpen(false)} className="flex-1 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 transition-colors">Dismiss</button>
              <button onClick={() => handleSaveKey(globalApiKey)} className="flex-1 py-4 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl hover:bg-black transition-all">Apply Key</button>
            </div>
            <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" className="mt-8 text-[9px] font-bold text-blue-500 uppercase tracking-widest hover:underline">Learn about Gemini Billing →</a>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
