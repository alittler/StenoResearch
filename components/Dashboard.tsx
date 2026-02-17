
import React from 'react';
import { Notebook, ProjectNote, AppView } from '../types';

interface DashboardProps {
  notebook: Notebook;
  notes: ProjectNote[];
  onNavigate: (view: AppView) => void;
  onAddNote: (content: string) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ notebook, notes, onNavigate }) => {
  const recentNotes = [...notes].sort((a, b) => b.timestamp - a.timestamp).slice(0, 5);
  const totalNotes = notes.length;
  const researchCount = notes.filter(n => n.type === 'research').length;

  return (
    <div className="space-y-8 animate-fade-in">
      <header className="flex flex-col md:flex-row justify-between items-end gap-6 border-b-2 border-slate-800 pb-8">
        <div className="space-y-1">
          <p className="text-[10px] font-black font-mono text-slate-400 uppercase tracking-[0.4em]">Active Project</p>
          <h1 className="text-4xl md:text-6xl font-black font-mono tracking-tighter text-slate-900 uppercase">{notebook.title}</h1>
        </div>
        <button 
          onClick={() => onNavigate('ledger')}
          className="px-6 py-4 bg-slate-900 text-white rounded-xl font-mono font-black uppercase text-xs hover:bg-black transition-all shadow-xl active:scale-95"
        >
          + Quick Capture
        </button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div 
          onClick={() => onNavigate('ledger')}
          className="p-8 bg-white rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-between hover:border-slate-300 transition-all cursor-pointer group"
        >
          <div>
            <p className="text-[10px] font-bold font-mono text-slate-500 uppercase tracking-widest mb-1">Total Entries</p>
            <h2 className="text-5xl font-black font-mono text-slate-900 group-hover:scale-110 origin-left transition-transform">{totalNotes}</h2>
          </div>
          <span className="text-[10px] font-black font-mono text-blue-600 uppercase mt-8">Open StenoPad »</span>
        </div>
        <div 
          onClick={() => onNavigate('research')}
          className="p-8 bg-white rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-between hover:border-slate-300 transition-all cursor-pointer group"
        >
          <div>
            <p className="text-[10px] font-bold font-mono text-slate-500 uppercase tracking-widest mb-1">Intelligence Scans</p>
            <h2 className="text-5xl font-black font-mono text-slate-900 group-hover:scale-110 origin-left transition-transform">{researchCount}</h2>
          </div>
          <span className="text-[10px] font-black font-mono text-blue-600 uppercase mt-8">Open Research Hub »</span>
        </div>
      </div>

      <section className="space-y-4">
        <div className="flex justify-between items-center border-b border-slate-100 pb-2">
          <h3 className="text-[10px] font-black font-mono text-slate-400 uppercase tracking-[0.3em]">Recent Logs</h3>
        </div>
        <div className="space-y-3">
          {recentNotes.map(note => (
            <div 
              key={note.id} 
              className="p-5 bg-white border border-slate-100 rounded-2xl hover:border-slate-200 transition-all cursor-pointer shadow-sm" 
              onClick={() => onNavigate('ledger')}
            >
              <div className="flex justify-between mb-2">
                <span className="text-[9px] font-black font-mono text-slate-400 uppercase bg-slate-50 px-2 py-0.5 rounded tracking-tighter">{note.type}</span>
                <span className="text-[9px] font-bold font-mono text-slate-300">{new Date(note.timestamp).toLocaleTimeString()}</span>
              </div>
              <p className="text-sm text-slate-700 font-mono line-clamp-2 leading-relaxed">{note.content}</p>
            </div>
          ))}
          {recentNotes.length === 0 && (
            <div className="py-20 text-center border-2 border-dashed border-slate-100 rounded-3xl">
              <p className="text-[10px] font-mono text-slate-300 uppercase tracking-widest">No entries found.</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default Dashboard;
