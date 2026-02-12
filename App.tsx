
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { ProjectNote, AppView, NoteType, Notebook } from './types';
import StenoPad from './components/StenoPad';
import ResearchHub from './components/ResearchHub';
import RawTextEditor from './components/RawTextEditor';
import Navigation from './components/Navigation';
import Outlines from './components/Outlines';
import NotebookShelf from './components/NotebookShelf';
import Visualizer from './components/Visualizer';

const STORAGE_KEY_NOTES = 'steno_research_notes_v3';
const STORAGE_KEY_NOTEBOOKS = 'steno_research_notebooks_v3';
const MANUAL_KEY_STORAGE = 'steno_manual_key';

const DEFAULT_NOTEBOOK: Notebook = {
  id: 'general',
  title: 'Default Ledger',
  color: '#fef3c7',
  timestamp: Date.now()
};

const App: React.FC = () => {
  const [notebooks, setNotebooks] = useState<Notebook[]>([DEFAULT_NOTEBOOK]);
  const [notes, setNotes] = useState<ProjectNote[]>([]);
  const [activeNotebookId, setActiveNotebookId] = useState<string>('general');
  const [activeView, setActiveView] = useState<AppView>('shelf');
  const [isInitialized, setIsInitialized] = useState(false);
  const [hasKey, setHasKey] = useState<boolean>(true); // Assume true to prevent initial flicker
  const [tempKey, setTempKey] = useState('');
  const [sessionNonce, setSessionNonce] = useState(0);

  const [history, setHistory] = useState<ProjectNote[][]>([]);
  const [historyPointer, setHistoryPointer] = useState(-1);

  // Initialization and Key Check
  useEffect(() => {
    const init = async () => {
      // 1. Strict Key Check
      const manualKey = localStorage.getItem(MANUAL_KEY_STORAGE);
      let envKey = undefined;
      try {
        if (typeof process !== 'undefined' && process.env && process.env.API_KEY) {
          envKey = process.env.API_KEY;
        }
      } catch (e) {}
      
      const effectiveKey = manualKey || envKey;
      setHasKey(!!effectiveKey);

      // 2. Load Data
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
          if (Array.isArray(parsed)) {
            setNotes(parsed);
            setHistory([parsed]);
            setHistoryPointer(0);
          }
        } catch (e) {}
      }

      setIsInitialized(true);
    };

    init();
  }, [sessionNonce]);

  // Save changes
  useEffect(() => {
    if (!isInitialized) return;
    localStorage.setItem(STORAGE_KEY_NOTES, JSON.stringify(notes));
    localStorage.setItem(STORAGE_KEY_NOTEBOOKS, JSON.stringify(notebooks));
  }, [notes, notebooks, isInitialized]);

  const handleSaveKey = () => {
    if (tempKey.trim()) {
      localStorage.setItem(MANUAL_KEY_STORAGE, tempKey.trim());
      setSessionNonce(n => n + 1);
      setTempKey('');
    }
  };

  const handleClearKey = () => {
    localStorage.removeItem(MANUAL_KEY_STORAGE);
    setSessionNonce(n => n + 1);
  };

  const recordState = useCallback((newNotes: ProjectNote[]) => {
    setHistory(prev => {
      const nextHistory = prev.slice(0, historyPointer + 1);
      nextHistory.push(newNotes);
      return nextHistory.slice(-50);
    });
    setHistoryPointer(prev => Math.min(prev + 1, 49));
    setNotes(newNotes);
  }, [historyPointer]);

  const undo = () => {
    if (historyPointer > 0) {
      setNotes(history[historyPointer - 1]);
      setHistoryPointer(p => p - 1);
    }
  };

  const redo = () => {
    if (historyPointer < history.length - 1) {
      setNotes(history[historyPointer + 1]);
      setHistoryPointer(p => p + 1);
    }
  };

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
    recordState([newNote, ...notes]);
  }, [activeNotebookId, notes, recordState]);

  const deleteNote = (id: string) => recordState(notes.filter(n => n.id !== id));

  if (!isInitialized) return null;

  return (
    <div className="flex flex-col min-h-screen bg-stone-100 text-stone-900">
      {/* KEY ENTRY SCREEN */}
      {!hasKey && (
        <div className="fixed inset-0 z-[100] bg-stone-100 flex items-center justify-center p-6">
          <div className="max-w-md w-full space-y-8 animate-in zoom-in-95 duration-300">
            <div className="text-center space-y-4">
              <div className="w-20 h-24 bg-white border-2 border-stone-300 rounded-lg mx-auto flex flex-col justify-around p-2 shadow-xl rotate-3">
                <div className="w-full h-[1px] bg-stone-200"></div>
                <div className="w-full h-[1px] bg-stone-200"></div>
                <div className="w-full h-[1px] bg-red-100"></div>
                <div className="w-full h-[1px] bg-stone-200"></div>
              </div>
              <h1 className="text-3xl font-mono font-bold tracking-tighter uppercase">UNLOCK LEDGER</h1>
              <p className="text-stone-500 font-mono text-[10px] uppercase tracking-[0.2em] leading-relaxed">
                Enter Gemini API Key to initialize research engine
              </p>
            </div>

            <div className="bg-white p-8 rounded-3xl shadow-2xl border border-stone-200 space-y-6">
              <div className="space-y-2">
                <input 
                  type="password"
                  value={tempKey}
                  onChange={(e) => setTempKey(e.target.value)}
                  placeholder="Paste your API key here..."
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-4 font-mono text-sm focus:ring-2 focus:ring-stone-900 outline-none transition-all text-center placeholder:text-stone-300"
                  onKeyDown={(e) => e.key === 'Enter' && handleSaveKey()}
                  autoFocus
                />
              </div>
              <button 
                onClick={handleSaveKey}
                disabled={!tempKey.trim()}
                className="w-full bg-stone-900 text-white py-4 rounded-xl font-bold font-mono uppercase hover:bg-black transition-all shadow-lg active:scale-95 disabled:opacity-30"
              >
                Start Researching
              </button>
              <div className="pt-4 text-center">
                <a 
                  href="https://aistudio.google.com/app/apikey" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-[10px] text-stone-400 font-mono hover:text-stone-800 underline uppercase tracking-widest font-bold"
                >
                  Don't have a key? Get one here.
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* APP UI */}
      <Navigation 
        activeView={activeView} 
        onViewChange={setActiveView} 
        activeNotebookTitle={activeNotebook.title}
        onBackToShelf={() => setActiveView('shelf')}
      />

      <main className="flex-1 max-w-5xl mx-auto w-full p-4 md:p-8">
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
            isAIStudio={false}
            onClearKey={handleClearKey}
          />
        )}
        {activeView === 'steno' && (
          <StenoPad 
            notes={filteredNotes.filter(n => n.type === 'quick')} 
            onAddNote={(c) => addNote(c, 'quick')} 
            onUpdateNote={(id, c) => setNotes(notes.map(n => n.id === id ? { ...n, content: c } : n))}
            onDeleteNote={deleteNote}
            onUndo={undo}
            onRedo={redo}
            canUndo={historyPointer > 0}
            canRedo={historyPointer < history.length - 1}
            notebookColor={activeNotebook.color}
          />
        )}
        {activeView === 'research' && (
          <ResearchHub 
            notes={filteredNotes.filter(n => n.type === 'research')} 
            context={filteredNotes.map(n => n.content).join('\n')}
            onAddResearch={(q, a, urls) => addNote(a, 'research', { question: q, metadata: { urls } })}
            onDeleteNote={deleteNote}
            onResetKey={() => setHasKey(false)}
          />
        )}
        {activeView === 'outlines' && (
          <Outlines 
            notepadNotes={filteredNotes.filter(n => n.type === 'quick')}
            researchNotes={filteredNotes.filter(n => n.type === 'research')}
            existingOutlines={filteredNotes.filter(n => n.type === 'outline')}
            onSaveOutline={(c) => addNote(c, 'outline')}
            onDeleteOutline={deleteNote}
            onResetKey={() => setHasKey(false)}
          />
        )}
        {activeView === 'visuals' && (
          <Visualizer 
            notes={filteredNotes.filter(n => n.type === 'image')}
            notepadContext={filteredNotes.filter(n => n.type === 'quick').map(n => n.content).join('\n')}
            onAddImage={(p, d) => addNote(p, 'image', { metadata: { imageData: d } })}
            onDeleteImage={deleteNote}
            onResetKey={() => setHasKey(false)}
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
