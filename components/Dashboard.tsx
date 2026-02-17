
import React from 'react';
import { Notebook, ProjectNote, AppView } from '../types';

interface DashboardProps {
  notebook: Notebook;
  notes: ProjectNote[];
  onNavigate: (view: AppView) => void;
  onAddNote: (content: string) => void;
  onArchiveOld: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ notebook, notes, onNavigate, onAddNote, onArchiveOld }) => {
  const recentNotes = [...notes].sort((a, b) => b.timestamp - a.timestamp).slice(0, 5);
  const totalNotes = notes.length;
  const researchCount = notes.filter(n => n.type === 'research').length;
  const vaultCount = notes.filter(n => n.metadata?.imageData || n.metadata?.urls).length;

  return (
    <div className="space-y-8 animate-slide-in">
      <header className="flex flex-col md:flex-row justify-between items-end gap-6 border-b-2 border-stone-800 pb-8">
        <div className="space-y-1">
          <p className="text-[10px] font-black font-mono text-stone-400 uppercase tracking-[0.4em]">Active Project Ledger</p>
          <h1 className="text-4xl md:text-6xl font-black font-mono tracking-tighter text-white uppercase">{notebook.title}</h1>
        </div>
        <div className="flex gap-4">
          <button 
            onClick={() => onNavigate('steno')}
            className="px-6 py-4 bg-white text-stone-900 rounded-xl font-mono font-black uppercase text-xs hover:bg-stone-200 transition-all shadow-xl active:scale-95"
          >
            + Quick Capture
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 bg-stone-800/50 rounded-2xl border border-stone-700 flex flex-col justify-between">
          <p className="text-[10px] font-bold font-mono text-stone-500 uppercase">Records</p>
          <h2 className="text-5xl font-black font-mono text-white">{totalNotes}</h2>
          <button onClick={() => onNavigate('raw')} className="text-[9px] font-black font-mono text-blue-400 uppercase mt-4 hover:underline">View Ledger</button>
        </div>
        <div className="p-6 bg-stone-800/50 rounded-2xl border border-stone-700 flex flex-col justify-between">
          <p className="text-[10px] font-bold font-mono text-stone-500 uppercase">Intelligence</p>
          <h2 className="text-5xl font-black font-mono text-white">{researchCount}</h2>
          <button onClick={() => onNavigate('research')} className="text-[9px] font-black font-mono text-blue-400 uppercase mt-4 hover:underline">Open Intel Hub</button>
        </div>
        <div className="p-6 bg-stone-800/50 rounded-2xl border border-stone-700 flex flex-col justify-between">
          <p className="text-[10px] font-bold font-mono text-stone-500 uppercase">Assets</p>
          <h2 className="text-5xl font-black font-mono text-white">{vaultCount}</h2>
          <button onClick={() => onNavigate('vault')} className="text-[9px] font-black font-mono text-blue-400 uppercase mt-4 hover:underline">Browse Vault</button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <section className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-black font-mono text-stone-400 uppercase tracking-widest">Recent Transmissions</h3>
            <button onClick={() => onNavigate('steno')} className="text-[9px] font-bold font-mono text-stone-600 hover:text-white uppercase">History »</button>
          </div>
          <div className="space-y-3">
            {recentNotes.map(note => (
              <div key={note.id} className="p-4 bg-stone-800/30 border border-stone-700/50 rounded-xl hover:bg-stone-800/50 transition-colors cursor-pointer" onClick={() => onNavigate('steno')}>
                <div className="flex justify-between mb-2">
                  <span className="text-[8px] font-bold font-mono text-stone-500 uppercase">{note.type}</span>
                  <span className="text-[8px] font-bold font-mono text-stone-600">{new Date(note.timestamp).toLocaleTimeString()}</span>
                </div>
                <p className="text-xs text-stone-300 font-mono line-clamp-2 leading-relaxed">{note.content}</p>
              </div>
            ))}
            {recentNotes.length === 0 && (
              <div className="py-12 text-center border-2 border-dashed border-stone-800 rounded-2xl">
                <p className="text-[10px] font-mono text-stone-600 uppercase">Archive is current empty</p>
              </div>
            )}
          </div>
        </section>

        <section className="space-y-4">
          <h3 className="text-sm font-black font-mono text-stone-400 uppercase tracking-widest">Workspace Actions</h3>
          <div className="grid grid-cols-1 gap-4">
            <button onClick={() => onNavigate('outlines')} className="p-8 bg-purple-600/10 border border-purple-500/20 rounded-2xl hover:bg-purple-600/20 transition-all text-center group">
              <span className="text-3xl block mb-2 group-hover:scale-110 transition-transform">📑</span>
              <span className="text-[10px] font-black font-mono text-purple-400 uppercase">Synthesize Brief</span>
            </button>
          </div>
          <div className="p-6 bg-stone-900/50 rounded-2xl border border-stone-800 space-y-4">
            <h4 className="text-[9px] font-black font-mono text-stone-500 uppercase">Maintenance</h4>
            <div className="flex justify-between items-center">
              <span className="text-xs text-stone-400 font-mono italic">Prune older records to keep the project agile.</span>
              <button 
                onClick={onArchiveOld}
                className="text-[9px] font-black font-mono text-stone-300 border border-stone-700 px-3 py-1 rounded hover:bg-stone-800"
              >
                Archive
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Dashboard;
