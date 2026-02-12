
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
  title: 'Default Notepad',
  description: 'Quick thoughts and general reminders.',
  color: '#fef3c7',
  timestamp: Date.now()
};

const App: React.FC = () => {
  const [notebooks, setNotebooks] = useState<Notebook[]>([DEFAULT_NOTEBOOK]);
  const [notes, setNotes] = useState<ProjectNote[]>([]);
  const [activeNotebookId, setActiveNotebookId] = useState<string>('general');
  const [activeView, setActiveView] = useState<AppView>('shelf');
  const [isInitialized, setIsInitialized] = useState(false);
  const [sessionKey, setSessionKey] = useState(0);
  const [hasApiKey, setHasApiKey] = useState(true);
  const [isAIStudio, setIsAIStudio] = useState(false);
  const [tempKey, setTempKey] = useState('');

  const [history, setHistory] = useState<ProjectNote[][]>([]);
  const [historyPointer, setHistoryPointer] = useState(-1);

  // Check for API key on mount and session refresh
  useEffect(() => {
    const checkKey = async () => {
      const aistudio = (window as any).aistudio;
      const manualKey = localStorage.getItem(MANUAL_KEY_STORAGE);
      const envKey = typeof process !== 'undefined' ? process.env.API_KEY : undefined;
      const effectiveKey = manualKey || envKey;

      if (aistudio && typeof aistudio.hasSelectedApiKey === 'function') {
        setIsAIStudio(true);
        const selected = await aistudio.hasSelectedApiKey();
        // If they haven't selected a platform key, but have a manual one, that's fine too
        setHasApiKey(selected || !!manualKey);
      } else {
        setIsAIStudio(false);
        setHasApiKey(!!effectiveKey); 
      }
    };
    checkKey();
  }, [sessionKey]);

  const handleOpenKeySelector = async () => {
    const aistudio = (window as any).aistudio;
    if (aistudio && typeof aistudio.openSelectKey === 'function') {
      await aistudio.openSelectKey();
      setHasApiKey(true); 
      setSessionKey(prev => prev + 1);
    }
  };

  const handleSaveManualKey = () => {
    if (tempKey.trim()) {
      localStorage.setItem(MANUAL_KEY_STORAGE, tempKey.trim());
      setHasApiKey(true);
      setSessionKey(prev => prev + 1);
    }
  };

  const handleClearKey = () => {
    localStorage.removeItem(MANUAL_KEY_STORAGE);
    setHasApiKey(false);
    setSessionKey(prev => prev + 1);
  };

  useEffect(() => {
    const savedNotes = localStorage.getItem(STORAGE_KEY_NOTES);
    const savedNotebooks = localStorage.getItem(STORAGE_KEY_NOTEBOOKS);
    
    let loadedNotebooks: Notebook[] = [DEFAULT_NOTEBOOK];
    let loadedNotes: ProjectNote[] = [];

    if (savedNotebooks) {
      try {
        const parsed = JSON.parse(savedNotebooks);
        if (Array.isArray(parsed) && parsed.length > 0) loadedNotebooks = parsed;
      } catch (e) { console.error("Load Error (Notebooks):", e); }
    }
    
    if (savedNotes) {
      try {
        const parsed = JSON.parse(savedNotes);
        if (Array.isArray(parsed)) loadedNotes = parsed;
      } catch (e) { console.error("Load Error (Notes):", e); }
    }

    setNotebooks(loadedNotebooks);
    setNotes(loadedNotes);
    setHistory([loadedNotes]);
    setHistoryPointer(0);
    setIsInitialized(true);
  }, [sessionKey]);

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

  const recordState = useCallback((newNotes: ProjectNote[]) => {
    setHistory(prev => {
      const nextHistory = prev.slice(0, historyPointer + 1);
      nextHistory.push(newNotes);
      if (nextHistory.length > 50) nextHistory.shift();
      return nextHistory;
    });
    setHistoryPointer(prev => {
      const next = prev + 1;
      return next > 49 ? 49 : next;
    });
    setNotes(newNotes);
  }, [historyPointer]);

  const undo = useCallback(() => {
    if (historyPointer > 0) {
      const prevStep = historyPointer - 1;
      setNotes(history[prevStep]);
      setHistoryPointer(prevStep);
    }
  }, [history, historyPointer]);

  const redo = useCallback(() => {
    if (historyPointer < history.length - 1) {
      const nextStep = historyPointer + 1;
      setNotes(history[nextStep]);
      setHistoryPointer(nextStep);
    }
  }, [history, historyPointer]);

  const findTargetNotebook = useCallback((content: string, currentId: string): string => {
    const hashtags = content.match(/#[\w-]+/g)?.map(t => t.toLowerCase().replace('#', '')) || [];
    if (hashtags.length === 0) return currentId;
    for (const tag of hashtags) {
      const match = notebooks.find(nb => {
        const titleNormal = nb.title.toLowerCase().replace(/\s+/g, '');
        const titleUnderscore = nb.title.toLowerCase().replace(/\s+/g, '_');
        return titleNormal === tag || titleUnderscore === tag;
      });
      if (match) return match.id;
    }
    return currentId;
  }, [notebooks]);

  const handleImportLibrary = (data: { notebooks: Notebook[], notes: ProjectNote[] }) => {
    if (confirm("This will permanently overwrite your current library. Proceed?")) {
      try {
        localStorage.setItem(STORAGE_KEY_NOTEBOOKS, JSON.stringify(data.notebooks));
        localStorage.setItem(STORAGE_KEY_NOTES, JSON.stringify(data.notes));
        setIsInitialized(false);
        setSessionKey(prev => prev + 1);
        setActiveNotebookId('general');
        setActiveView('shelf');
        alert("Library restored successfully.");
      } catch (err) {
        alert("Critical Error: Could not write to local storage.");
      }
    }
  };

  const addNotebook = (title: string, color: string) => {
    const newNb: Notebook = { id: crypto.randomUUID(), title, color, timestamp: Date.now() };
    setNotebooks(prev => [...prev, newNb]);
    setActiveNotebookId(newNb.id);
    setActiveView('steno');
  };

  const deleteNotebook = (id: string) => {
    if (id === 'general') return;
    if (confirm("Permanently delete this notebook?")) {
      setNotebooks(prev => prev.filter(nb => nb.id !== id));
      const newNotes = notes.filter(n => n.notebookId !== id);
      recordState(newNotes);
      if (activeNotebookId === id) {
        setActiveNotebookId('general');
        setActiveView('shelf');
      }
    }
  };

  const addNote = useCallback((content: string, type: NoteType = 'quick', extra?: Partial<ProjectNote>) => {
    const targetId = findTargetNotebook(content, activeNotebookId);
    const tags = content.match(/#[\w-]+/g)?.map(t => t.toLowerCase()) || [];
    
    const newNote: ProjectNote = {
      id: crypto.randomUUID(),
      notebookId: targetId,
      content,
      type,
      tags,
      timestamp: Date.now(),
      ...extra
    };
    const newNotes = [newNote, ...notes];
    recordState(newNotes);
  }, [activeNotebookId, findTargetNotebook, notes, recordState]);

  const updateNote = useCallback((id: string, newContent: string) => {
    const noteToUpdate = notes.find(n => n.id === id);
    if (!noteToUpdate) return;
    const targetId = findTargetNotebook(newContent, noteToUpdate.notebookId);
    const tags = newContent.match(/#[\w-]+/g)?.map(t => t.toLowerCase()) || [];
    const newNotes = notes.map(note => 
      note.id === id ? { ...note, content: newContent, tags, notebookId: targetId } : note
    );
    recordState(newNotes);
  }, [notes, findTargetNotebook, recordState]);

  const deleteNote = useCallback((id: string) => {
    const newNotes = notes.filter(n => n.id !== id);
    recordState(newNotes);
  }, [notes, recordState]);

  return (
    <div key={sessionKey} className="flex flex-col min-h-screen bg-stone-100 text-stone-900 selection:bg-stone-300 selection:text-stone-900">
      {!hasApiKey && (
        <div className="fixed inset-0 z-[100] bg-stone-950/90 backdrop-blur-md flex items-center justify-center p-6 text-center">
          <div className="bg-white p-10 rounded-3xl shadow-2xl max-w-lg space-y-6 border border-stone-200">
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 bg-stone-100 rounded-2xl flex items-center justify-center text-3xl mb-4 shadow-inner">🗝️</div>
              <h2 className="text-2xl font-bold font-mono uppercase tracking-tight">Gemini API Key</h2>
            </div>
            
            <p className="text-stone-500 text-sm font-mono leading-relaxed">
              To enable AI research, outlines, and image generation, please provide a Gemini API Key. It will be stored safely in your browser's local storage.
            </p>
            
            <div className="space-y-4 pt-4">
              <div className="space-y-3">
                <input 
                  type="password"
                  value={tempKey}
                  onChange={(e) => setTempKey(e.target.value)}
                  placeholder="Type or Paste API Key here..."
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-4 font-mono text-sm focus:ring-2 focus:ring-stone-900 outline-none text-center"
                  onKeyDown={(e) => e.key === 'Enter' && handleSaveManualKey()}
                  autoFocus
                />
                <button 
                  onClick={handleSaveManualKey}
                  className="w-full bg-stone-900 text-white py-4 rounded-xl font-bold font-mono uppercase hover:bg-black transition-all shadow-lg active:scale-95"
                >
                  Apply API Key
                </button>
              </div>

              {isAIStudio && (
                <div className="pt-2">
                  <div className="relative mb-4">
                    <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-stone-200"></div></div>
                    <div className="relative flex justify-center text-[10px] uppercase font-bold font-mono"><span className="bg-white px-2 text-stone-400">Alternative</span></div>
                  </div>
                  <button 
                    onClick={handleOpenKeySelector}
                    className="w-full bg-stone-100 text-stone-600 py-3 rounded-xl font-bold font-mono uppercase hover:bg-stone-200 transition-all border border-stone-200"
                  >
                    Select Platform Key
                  </button>
                </div>
              )}
              
              <div className="flex flex-col gap-2 pt-4">
                <a 
                  href="https://aistudio.google.com/app/apikey" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-[11px] text-stone-400 font-mono hover:text-stone-600 underline uppercase tracking-widest font-bold"
                >
                  Get a Key from Google AI Studio
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      <Navigation 
        activeView={activeView} 
        onViewChange={setActiveView} 
        activeNotebookTitle={activeNotebook.title}
        onBackToShelf={() => setActiveView('shelf')}
      />
      <main className="flex-1 max-w-5xl mx-auto w-full p-4 md:p-8">
        {!isInitialized ? (
          <div className="flex flex-col items-center justify-center h-[60vh] text-stone-400 font-mono animate-pulse">
            <span className="text-4xl mb-4">📖</span>
            <p className="uppercase tracking-widest text-xs">Accessing Archives...</p>
          </div>
        ) : (
          <>
            {activeView === 'shelf' && (
              <NotebookShelf 
                notebooks={notebooks} 
                notes={notes}
                onSelect={(id) => { setActiveNotebookId(id); setActiveView('steno'); }} 
                onAdd={addNotebook} 
                onDelete={deleteNotebook}
                onImport={handleImportLibrary}
                isAIStudio={isAIStudio}
                onClearKey={handleClearKey}
              />
            )}
            {activeView === 'steno' && (
              <StenoPad 
                notes={filteredNotes.filter(n => n.type === 'quick')} 
                onAddNote={(c) => addNote(c, 'quick')} 
                onUpdateNote={updateNote} 
                onDeleteNote={deleteNote} 
                onUndo={undo}
                onRedo={redo}
                canUndo={historyPointer > 0}
                canRedo={historyPointer < history.length - 1}
                notebookColor={activeNotebook.color}
                notebooks={notebooks}
              />
            )}
            {activeView === 'outlines' && (
              <Outlines 
                notepadNotes={filteredNotes.filter(n => n.type === 'quick')}
                researchNotes={filteredNotes.filter(n => n.type === 'research')}
                existingOutlines={filteredNotes.filter(n => n.type === 'outline')}
                onSaveOutline={(content) => addNote(content, 'outline')}
                onDeleteOutline={deleteNote}
                onResetKey={() => setHasApiKey(false)}
              />
            )}
            {activeView === 'visuals' && (
              <Visualizer 
                notes={filteredNotes.filter(n => n.type === 'image')}
                notepadContext={filteredNotes.filter(n => n.type === 'quick').map(n => n.content).join('\n')}
                onAddImage={(prompt, data) => addNote(prompt, 'image', { metadata: { imageData: data } })}
                onDeleteImage={deleteNote}
                onResetKey={() => setHasApiKey(false)}
              />
            )}
            {activeView === 'research' && (
              <ResearchHub 
                notes={filteredNotes.filter(n => n.type === 'research')} 
                context={filteredNotes.map(n => n.content).join('\n')} 
                onAddResearch={(q, a, urls) => addNote(a, 'research', { question: q, metadata: { urls } })} 
                onDeleteNote={deleteNote}
                onResetKey={() => setHasApiKey(false)}
              />
            )}
            {activeView === 'raw' && (
              <RawTextEditor 
                allNotes={filteredNotes} 
                notebookTitle={activeNotebook.title}
              />
            )}
          </>
        )}
      </main>
    </div>
  );
};

export default App;
