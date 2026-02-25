
'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { ProjectNote, AppView, Notebook } from './types';
import { BrowserRouter, Routes, Route, useNavigate, useParams, useLocation } from 'react-router-dom';
import Navigation from './components/Navigation';
import StenoPad from './components/StenoPad';
import ResearchHub from './components/ResearchHub';
import RawTextEditor from './components/RawTextEditor';
import NotebookShelf from './components/NotebookShelf';
import KnowledgeArchitect from './components/KnowledgeArchitect';
import NotepadContainer from './components/NotepadContainer';
import { generateSHA256 } from './utils/crypto';

const STORAGE_KEY = 'steno_ledger_core_v2';

const INITIAL_NOTEBOOKS: Notebook[] = [
  { id: 'general', title: 'General Ledger', color: '#64748b', createdAt: Date.now(), coreConcept: '' }
];

function AppContent() {
  const [notebooks, setNotebooks] = useState<Notebook[]>(INITIAL_NOTEBOOKS);
  const [notes, setNotes] = useState<ProjectNote[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const [versionHash, setVersionHash] = useState<string>('INIT');
  const [searchQuery, setSearchQuery] = useState('');

  const navigate = useNavigate();
  const { notebookId, view } = useParams<{ notebookId?: string; view?: string }>();
  const location = useLocation();

  const activeNotebookId = notebookId || 'general';
  const currentView = (view as AppView) || 'ledger';

  const lastStateString = useRef<string>('');

  // Scroll to top on view change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [location.pathname]);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.notebooks) {
          const migratedNotebooks = parsed.notebooks.map((nb: Notebook) => 
            nb.id === 'general' && (nb.title === 'Primary Project Ledger' || nb.title === 'Notebook')
              ? { ...nb, title: 'General Ledger' } 
              : nb
          );
          setNotebooks(migratedNotebooks);
        }
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
        generateSHA256(dataString).then(h => setVersionHash(h.substring(0, 8).toUpperCase()));
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

  const updateNote = (id: string, updates: Partial<ProjectNote>) => {
    setNotes(prev => prev.map(n => n.id === id ? { ...n, ...updates } : n));
  };

  const deleteNote = (id: string) => {
    setNotes(prev => prev.filter(n => n.id !== id));
  };

  if (!isInitialized) return null;

  const isShelf = location.pathname === '/';

  return (
    <div className="min-h-screen flex flex-col bg-[#f8fafc] text-[#1e293b]">
      <main className="flex-1 w-full overflow-y-auto relative">
        <div className={`mx-auto w-full h-full relative ${isShelf ? '' : 'max-w-[1400px] px-4 lg:px-12 py-8 pb-32'}`}>
          {!isShelf && (
            <NotepadContainer 
              title={activeNotebook?.title}
              onBackToShelf={() => navigate('/')}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              navigation={
                <Navigation 
                  activeView={currentView}
                  onViewChange={(v) => navigate(`/notebook/${activeNotebookId}/${v}`)}
                  activeNotebookTitle={activeNotebook?.title}
                  onBackToShelf={() => navigate('/')}
                  hideTabs={activeNotebookId === 'general'}
                />
              }
            >
              {currentView === 'ledger' ? (
                <StenoPad 
                  notes={activeNotes.filter(n => n.type === 'ledger' || n.type === 'research')}
                  onAddNote={(c, type, extra) => addNote(c, type, extra)}
                  onUpdateNote={updateNote}
                  onDeleteNote={deleteNote}
                  isNotebook={activeNotebookId === 'general'}
                  allNotebookTitles={notebooks.map(nb => nb.title)}
                  searchQuery={searchQuery}
                />
              ) : currentView === 'research' ? (
                <ResearchHub 
                  notes={activeNotes.filter(n => n.type === 'research')}
                  context={activeNotes.slice(0, 10).map(n => n.content).join('\n')}
                  onAddResearch={(q, a, u) => addNote(a, 'research', { question: q, metadata: { urls: u } })}
                  onPin={(note) => addNote(note.content, 'ledger')}
                  onDelete={deleteNote}
                />
              ) : currentView === 'architect' ? (
                <KnowledgeArchitect 
                  onShredded={(staged) => {
                    const committed = staged.map(s => ({ ...s, notebookId: activeNotebookId! }));
                    setNotes(prev => [...committed, ...prev]);
                  }}
                  onAddRawNote={(content) => addNote(content, 'raw')}
                />
              ) : currentView === 'raw' ? (
                <RawTextEditor 
                  allNotes={activeNotes}
                  notebookTitle={activeNotebook?.title || 'Ledger'}
                />
              ) : null}
            </NotepadContainer>
          )}
          {isShelf && (
            <NotebookShelf 
              notebooks={notebooks}
              notes={notes}
              onSelect={(id) => navigate(`/notebook/${id}/ledger`)}
              onAdd={(t, c) => setNotebooks([...notebooks, { id: crypto.randomUUID(), title: t, color: c, createdAt: Date.now(), coreConcept: '' }])}
              onDelete={(id) => setNotebooks(notebooks.filter(n => n.id !== id))}
              hasUnsavedChanges={false}
              onBackupPerformed={() => {}}
              onRestore={(d) => { setNotebooks(d.notebooks); setNotes(d.notes); }}
            />
          )}
        </div>
      </main>

      <div className="fixed bottom-4 right-6 pointer-events-none">
        <div className="text-[10px] font-mono text-slate-400 uppercase tracking-widest flex items-center gap-2">
          <span className="opacity-50">State ID:</span> 
          <span className="font-bold">{versionHash}</span>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AppContent />} />
        <Route path="/notebook/:notebookId/:view" element={<AppContent />} />
      </Routes>
    </BrowserRouter>
  );
}
