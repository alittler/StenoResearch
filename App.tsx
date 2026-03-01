
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
import SourcesView from './components/SourcesView';
import ChatView from './components/ChatView';
import WorkspaceView from './components/WorkspaceView';
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
  const [pendingArchitectContent, setPendingArchitectContent] = useState<string>('');

  const navigate = useNavigate();
  const { notebookId, view } = useParams<{ notebookId?: string; view?: string }>();
  const location = useLocation();

  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const activeNotebookId = notebookId || 'general';
  
  // Default to ledger on mobile if no view is specified, otherwise workspace
  let defaultView: AppView = 'workspace';
  if (notebookId === 'general') defaultView = 'ledger';
  else if (isMobile) defaultView = 'ledger';

  const currentView = (view as AppView) || defaultView;

  useEffect(() => {
    if (isMobile && (view === 'workspace' || view === 'architect' || view === 'raw')) {
      navigate(`/notebook/${activeNotebookId}/ledger`, { replace: true });
    }
  }, [isMobile, view, activeNotebookId, navigate]);

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

  const activeNotes = useMemo(() => {
    if (!activeNotebook) return [];
    
    // If we're in a specific notebook, show notes belonging to it 
    // OR notes tagged with its title (formatted as a tag)
    const notebookTag = `#${activeNotebook.title.replace(/\s+/g, '_')}`;
    
    return notes.filter(n => {
      const isDirectlyInNotebook = n.notebookId === activeNotebookId;
      const isTaggedForThisNotebook = activeNotebookId !== 'general' && n.content.includes(notebookTag);
      return isDirectlyInNotebook || isTaggedForThisNotebook;
    });
  }, [notes, activeNotebookId, activeNotebook]);

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
      {!isShelf && (
        <Navigation 
          activeView={currentView}
          onViewChange={(v) => navigate(`/notebook/${activeNotebookId}/${v}`)}
          activeNotebookTitle={activeNotebook?.title}
          activeNotebookColor={activeNotebook?.color}
          onBackToShelf={() => navigate('/')}
          hideTabs={false}
          isMobile={isMobile}
        />
      )}
      <main className="flex-1 w-full overflow-y-auto relative pb-28 md:pb-0">
        <div className={`mx-auto w-full h-full relative ${isShelf ? '' : currentView === 'workspace' ? 'px-4' : 'max-w-4xl px-4'}`}>
          {!isShelf && (
            <div className="h-full">
              {currentView === 'workspace' ? (
                <WorkspaceView 
                  notebookId={activeNotebookId}
                  notes={activeNotes}
                  notebooks={notebooks}
                  onAddNote={addNote}
                  onUpdateNote={updateNote}
                  onDeleteNote={deleteNote}
                  onNavigateToNotebook={(id) => navigate(`/notebook/${id}/${id === 'general' ? 'ledger' : 'workspace'}`)}
                />
              ) : currentView === 'ledger' ? (
                <StenoPad 
                  notes={activeNotes.filter(n => n.type === 'ledger' || n.type === 'research' || n.type === 'source')}
                  onAddNote={(c, type, extra) => addNote(c, type, extra)}
                  onUpdateNote={updateNote}
                  onDeleteNote={deleteNote}
                  isNotebook={activeNotebookId === 'general'}
                  notebooks={notebooks}
                  onNavigateToNotebook={(id) => navigate(`/notebook/${id}/${id === 'general' ? 'ledger' : 'workspace'}`)}
                  searchQuery={searchQuery}
                />
              ) : currentView === 'research' ? (
                <ResearchHub 
                  notes={activeNotes.filter(n => n.type === 'research')}
                  context={activeNotes.filter(n => n.type === 'ledger' || n.type === 'source').map(n => n.content).join('\n---\n')}
                  notebooks={notebooks}
                  onNavigateToNotebook={(id) => navigate(`/notebook/${id}/${id === 'general' ? 'ledger' : 'workspace'}`)}
                  onAddResearch={(q, a, u) => addNote(a, 'research', { question: q, metadata: { urls: u } })}
                  onPin={(note) => addNote(note.content, 'ledger', { title: note.question, metadata: note.metadata })}
                  onSendToArchitect={(content) => {
                    setPendingArchitectContent(content);
                    navigate(`/notebook/${activeNotebookId}/architect`);
                  }}
                  onDelete={deleteNote}
                />
              ) : currentView === 'architect' ? (
                <KnowledgeArchitect 
                  initialText={pendingArchitectContent}
                  context={activeNotes.filter(n => n.type === 'ledger' || n.type === 'source').map(n => n.content).join('\n---\n')}
                  onShredded={(staged) => {
                    const committed: ProjectNote[] = staged.map(s => ({
                      id: crypto.randomUUID(),
                      content: s.content || '',
                      timestamp: Date.now(),
                      type: 'ledger',
                      notebookId: activeNotebookId!,
                      title: s.title,
                      metadata: s.metadata
                    }));
                    setNotes(prev => [...committed, ...prev]);
                    setPendingArchitectContent('');
                  }}
                  onAddRawNote={(content) => {
                    addNote(content, 'raw');
                    setPendingArchitectContent('');
                  }}
                />
              ) : currentView === 'raw' ? (
                <RawTextEditor 
                  allNotes={activeNotes}
                  notebookTitle={activeNotebook?.title || 'Ledger'}
                />
              ) : currentView === 'sources' ? (
                <SourcesView notes={activeNotes} onAddNote={addNote} onDeleteNote={deleteNote} />
              ) : currentView === 'chat' ? (
                <ChatView context={activeNotes.filter(n => n.type === 'ledger' || n.type === 'source').map(n => n.content).join('\n---\n')} />
              ) : null}
            </div>
          )}
          {isShelf && (
            <NotebookShelf 
              notebooks={notebooks}
              notes={notes}
              onSelect={(id) => navigate(`/notebook/${id}/${id === 'general' ? 'ledger' : 'workspace'}`)}
              onAdd={(t, c) => setNotebooks([...notebooks, { id: crypto.randomUUID(), title: t, color: c, createdAt: Date.now(), coreConcept: '' }])}
              onDelete={(id) => setNotebooks(notebooks.filter(n => n.id !== id))}
              hasUnsavedChanges={false}
              onBackupPerformed={() => {}}
              onRestore={(d) => { setNotebooks(d.notebooks); setNotes(d.notes); }}
            />
          )}
        </div>
      </main>
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
