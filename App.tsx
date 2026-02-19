
'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { ProjectNote, AppView, Notebook } from './types';
import Navigation from './components/Navigation';
import StenoPad from './components/StenoPad';
import ResearchHub from './components/ResearchHub';
import RawTextEditor from './components/RawTextEditor';
import NotebookShelf from './components/NotebookShelf';
import Outlines from './components/Outlines';
import Visualizer from './components/Visualizer';
import KnowledgeArchitect from './components/KnowledgeArchitect';
import ProjectBlueprint from './components/ProjectBlueprint';
import { generateSHA256 } from './utils/crypto';

const STORAGE_KEY = 'steno_ledger_core_v1';

const INITIAL_NOTEBOOKS: Notebook[] = [
  { id: 'general', title: 'Primary Project Ledger', color: '#64748b', createdAt: Date.now(), coreConcept: 'Your project start here...' }
];

export default function App() {
  const [notebooks, setNotebooks] = useState<Notebook[]>(INITIAL_NOTEBOOKS);
  const [notes, setNotes] = useState<ProjectNote[]>([]);
  const [activeNotebookId, setActiveNotebookId] = useState<string | null>('general');
  const [currentView, setCurrentView] = useState<AppView>('ledger');
  const [isInitialized, setIsInitialized] = useState(false);
  const [versionHash, setVersionHash] = useState<string>('INIT_SYNC');

  const lastStateString = useRef<string>('');
  const isGatewayActive = !!process.env.AI_GATEWAY_URL;

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

  const updateNotebook = (id: string, updates: Partial<Notebook>) => {
    setNotebooks(prev => prev.map(nb => nb.id === id ? { ...nb, ...updates } : nb));
  };

  const deleteNote = (id: string) => {
    setNotes(prev => prev.filter(n => n.id !== id));
  };

  if (!isInitialized) return null;

  return (
    <div className="min-h-screen flex flex-col bg-[#f8fafc] text-[#1e293b]">
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
            onAdd={(t, c) => setNotebooks([...notebooks, { id: crypto.randomUUID(), title: t, color: c, createdAt: Date.now(), coreConcept: '' }])}
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
        ) : currentView === 'brief' ? (
          <div className="max-w-6xl mx-auto p-6">
            <Outlines 
              notepadNotes={activeNotes.filter(n => n.type === 'ledger')}
              researchNotes={activeNotes.filter(n => n.type === 'research')}
              existingOutlines={activeNotes.filter(n => n.type === 'outline')}
              onSaveOutline={(content) => addNote(content, 'outline')}
              onDeleteOutline={deleteNote}
            />
          </div>
        ) : currentView === 'blueprint' && activeNotebook ? (
          <ProjectBlueprint 
            notebook={activeNotebook}
            ledgerNotes={activeNotes.filter(n => n.type === 'ledger')}
            onUpdateNotebook={(updates) => updateNotebook(activeNotebook.id, updates)}
            onUpdateNote={updateNote}
            onAddNote={(content, metadata) => addNote(content, 'ledger', { metadata })}
          />
        ) : currentView === 'architect' ? (
          <KnowledgeArchitect 
            onShredded={(staged) => {
              const committed = staged.map(s => ({ ...s, notebookId: activeNotebookId! }));
              setNotes(prev => [...committed, ...prev]);
            }}
            onAddRawNote={(content) => addNote(content, 'raw')}
          />
        ) : currentView === 'visualizer' ? (
          <Visualizer 
            notes={activeNotes.filter(n => n.type === 'visualizer' || (n.metadata && n.metadata.imageData))}
            notepadContext={activeNotes.slice(0, 5).map(n => n.content).join(' ')}
            onAddImage={(p, img) => addNote(p, 'visualizer', { metadata: { imageData: img } })}
            onDeleteImage={deleteNote}
          />
        ) : currentView === 'raw' ? (
          <RawTextEditor 
            allNotes={activeNotes}
            notebookTitle={activeNotebook?.title || 'Ledger'}
          />
        ) : null}
      </main>

      <footer className="py-2.5 px-6 border-t border-slate-200 bg-white flex justify-between items-center shadow-[0_-1px_5px_rgba(0,0,0,0.02)]">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
            <div className="text-[10px] font-mono text-slate-500 uppercase tracking-widest flex items-center gap-2">
              <span className="text-slate-400 font-bold">State ID:</span> 
              <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-800 font-bold border border-slate-200/50">{versionHash}</span>
            </div>
          </div>
          {isGatewayActive && (
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
              <span className="text-[9px] font-mono text-blue-600 uppercase font-black tracking-widest">Gateway Ready</span>
            </div>
          )}
        </div>
        <div className="text-[9px] font-mono text-slate-300 uppercase tracking-tighter">
          Steno Ledger Core v1.5 • Vercel AI Gateway Ready
        </div>
      </footer>
    </div>
  );
}
