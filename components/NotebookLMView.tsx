
'use client';

import React, { useState } from 'react';
import { ProjectNote, Notebook } from '../types';
import SourcesView from './SourcesView';
import ChatView from './ChatView';
import StenoPad from './StenoPad';

interface NotebookLMViewProps {
  notebook: Notebook;
  notes: ProjectNote[];
  allNotes: ProjectNote[];
  onAddNote: (content: string, type: ProjectNote['type'], extra?: Partial<ProjectNote>) => void;
  onUpdateNote: (id: string, updates: Partial<ProjectNote>) => void;
  onDeleteNote: (id: string) => void;
  searchQuery: string;
}

const NotebookLMView: React.FC<NotebookLMViewProps> = ({
  notebook,
  notes,
  allNotes,
  onAddNote,
  onUpdateNote,
  onDeleteNote,
  searchQuery
}) => {
  const [activeTab, setActiveTab] = useState<'chat' | 'notes'>('chat');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isAddingSource, setIsAddingSource] = useState(false);
  const [newSourceUrl, setNewSourceUrl] = useState('');

  const ledgerNotes = notes.filter(n => n.type === 'ledger' || n.type === 'research');
  const context = notes.filter(n => n.type === 'ledger').map(n => n.content).join('\n---\n');

  const handleAddSource = () => {
    if (newSourceUrl.trim()) {
      onAddNote(newSourceUrl.trim(), 'research', { title: newSourceUrl.trim() });
      setNewSourceUrl('');
      setIsAddingSource(false);
    }
  };

  return (
    <div className="flex h-[calc(100vh-160px)] bg-white rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-200">
      {/* Left Sidebar: Sources */}
      <div className={`${isSidebarOpen ? 'w-80' : 'w-0'} transition-all duration-300 border-r border-slate-100 bg-slate-50 overflow-hidden flex flex-col`}>
        <div className="p-6 border-b border-slate-200 bg-white flex justify-between items-center">
          <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-600 flex items-center gap-2">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            Sources
          </h3>
          <button 
            onClick={() => setIsAddingSource(true)}
            className="p-1.5 bg-indigo-50 border border-indigo-100 rounded-md hover:bg-indigo-100 transition-colors text-indigo-600"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
            </svg>
          </button>
        </div>

        {isAddingSource && (
          <div className="p-4 bg-white border-b border-slate-100 animate-fade-in">
            <input 
              autoFocus
              type="text"
              value={newSourceUrl}
              onChange={e => setNewSourceUrl(e.target.value)}
              placeholder="Enter URL..."
              className="w-full text-xs p-2 border border-slate-200 rounded-lg focus:ring-1 focus:ring-indigo-500 outline-none mb-2"
              onKeyDown={e => e.key === 'Enter' && handleAddSource()}
            />
            <div className="flex gap-2">
              <button onClick={handleAddSource} className="flex-1 py-1.5 bg-indigo-600 text-white text-[9px] font-black uppercase tracking-widest rounded-md hover:bg-indigo-700 transition-colors">Add</button>
              <button onClick={() => setIsAddingSource(false)} className="flex-1 py-1.5 bg-slate-100 text-slate-600 text-[9px] font-black uppercase tracking-widest rounded-md hover:bg-slate-200 transition-colors">Cancel</button>
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto no-scrollbar bg-slate-50/50">
          <SourcesView notes={notes} />
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col relative bg-white">
        {/* Toggle Sidebar Button */}
        <button 
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="absolute left-4 top-4 z-10 p-2 bg-white border border-slate-200 rounded-lg shadow-sm hover:bg-slate-50 transition-colors"
        >
          <svg className={`w-4 h-4 text-slate-500 transition-transform ${isSidebarOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 5l7 7-7 7M5 5l7 7-7 7" />
          </svg>
        </button>

        {/* View Switcher */}
        <div className="flex justify-center p-4 border-b border-slate-100 gap-2 bg-slate-50/30">
          <button 
            onClick={() => setActiveTab('chat')}
            className={`px-8 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'chat' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'}`}
          >
            Chat
          </button>
          <button 
            onClick={() => setActiveTab('notes')}
            className={`px-8 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'notes' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'}`}
          >
            Notes
          </button>
        </div>

        <div className="flex-1 overflow-hidden">
          {activeTab === 'chat' ? (
            <ChatView context={context} />
          ) : (
            <div className="h-full overflow-y-auto p-8 bg-white">
              <div className="max-w-4xl mx-auto">
                <StenoPad 
                  notes={ledgerNotes}
                  onAddNote={onAddNote}
                  onUpdateNote={onUpdateNote}
                  onDeleteNote={onDeleteNote}
                  isNotebook={false}
                  allNotebookTitles={[]}
                  searchQuery={searchQuery}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NotebookLMView;
