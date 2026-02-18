
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { ProjectNote, AppView, Notebook } from './types';
import Navigation from './components/Navigation';
import StenoPad from './components/StenoPad';
import ResearchHub from './components/ResearchHub';
import RawTextEditor from './components/RawTextEditor';
import NotebookShelf from './components/NotebookShelf';
import { generateSHA256 } from './utils/crypto';

const STORAGE_KEY = 'steno_ledger_core_v1';

const INITIAL_NOTEBOOKS: Notebook[] = [
  { id: 'general', title: 'Primary Project Ledger', color: '#64748b', createdAt: Date.now() }
];

const App: React.FC = () => {
  const [notebooks, setNotebooks] = useState<Notebook[]>(INITIAL_NOTEBOOKS);
  const [notes, setNotes] = useState<ProjectNote[]>([]);
  const [activeNotebookId, setActiveNotebookId] = useState<string | null>('general');
  const [currentView, setCurrentView] = useState<AppView>('ledger');
  const [isInitialized, setIsInitialized] = useState(false);
  const [versionHash, setVersionHash] = useState<string>('INIT');

  const lastStateString = useRef<string>('');

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.notebooks) setNotebooks(parsed.notebooks);
        if (parsed.notes) setNotes(parsed.notes);
      } catch (e) {
        console.error("Restoration failed", e);
      }
    }
    setIsInitialized(true);
  }, []);

  useEffect(() => {
    if (isInitialized) {
      const dataString = JSON.stringify({ notebooks, notes });
      if (dataString !== lastStateString.current) {
        localStorage.setItem(STORAGE_KEY, dataString);
        lastStateString.current = dataString;
        generateSHA256(dataString).then(h => setVersionHash(h.substring(0, 4).toUpperCase()));
      }
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

  if (!isInitialized) return null;

  return (
    <div className="min-h-screen flex flex-col bg-[#f8fafc]">
      {currentView !== 'shelf' && (
        <Navigation 
          activeView={currentView}
          onViewChange={setCurrentView}
          activeNotebookTitle={activeNotebook?.title}
          onBackToShelf={() => setCurrentView('shelf')}
        />
      )}

      <main className="flex-1 w-full overflow-y-auto">
        {currentView === 'shelf' ? (
          <NotebookShelf 
            notebooks={notebooks}
            notes={notes}
            onSelect={(id) => { setActiveNotebookId(id); setCurrentView('ledger'); }}
            onAdd={(t, c) => setNotebooks([...notebooks, { id: crypto.randomUUID(), title: t, color: c, createdAt: Date.now() }])}
            onDelete={(id) => setNotebooks(notebooks.filter(n => n.id !== id))}
            hasUnsavedChanges={false}
            onBackupPerformed={() => {}}
            onRestore={(d) => { setNotebooks(d.notebooks); setNotes(d.notes); }}
          />
        ) : currentView === 'ledger' ? (
          <StenoPad 
            notes={activeNotes.filter(n => n.type === 'ledger')}
            onAddNote={(c) => addNote(c, 'ledger')}
            onDeleteNote={deleteNote}
          />
        ) : currentView === 'research' ? (
          <ResearchHub 
            notes={activeNotes.filter(n => n.type === 'research')}
            context={activeNotes.slice(0, 10).map(n => n.content).join('\n')}
            onAddResearch={(q, a, u) => addNote(a, 'research', { question: q, metadata: { urls: u } })}
            onPin={(note) => addNote(note.content, 'ledger')}
            onDelete={deleteNote}
          />
        ) : (
          <RawTextEditor 
            allNotes={activeNotes}
            notebookTitle={activeNotebook?.title || 'Ledger'}
          />
        )}
      </main>

      <footer className="py-2 px-6 border-t border-slate-200 bg-white flex justify-between items-center">
        <div className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">
          Checksum: {versionHash}
        </div>
        <div className="text-[9px] font-mono text-slate-300 uppercase">
          Steno Ledger Core v1.2
        </div>
      </footer>
    </div>
  );
};

export default App;
