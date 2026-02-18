
import React from 'react';
import { Notebook, ProjectNote, AppView } from '../types';

interface DashboardProps {
  notebook: Notebook;
  notes: ProjectNote[];
  onNavigate: (view: AppView) => void;
  onAddNote: (content: string) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ notebook, notes, onNavigate, onAddNote }) => {
  const recentNotes = [...notes].sort((a, b) => b.timestamp - a.timestamp).slice(0, 5);
  const totalNotes = notes.length;
  const researchCount = notes.filter(n => n.type === 'research').length;

  return (
    <div className="space-y-8 animate-fade-in">
      <header className="flex flex-col md:flex-row justify-between items-end gap-6 border-b-2 border-slate-800 pb-8">
        <div className="space-y-1">
          <p className="text-[10px] font-black font-mono text-slate-400 uppercase tracking-[0.4em]">Active Project Ledger</p>
          <h1 className="text-4xl md:text-6xl font-black font-mono tracking-tighter text-slate-900 uppercase">{notebook.title}</h1>
        </div>
        <div className="flex gap-4">
          <button 
            onClick={() => onNavigate('ledger')}
            className="px-6 py-4 bg-slate-900 text-white rounded-xl font-mono font-black uppercase text-xs hover:bg-black transition-all shadow-xl active:scale-95"
          >
            + Quick Capture
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col justify-between">
          <p className="text-[10px] font-bold font-mono text-slate-500 uppercase">Records</p>
          <h2 className="text-4xl font-black font-mono text-slate-900">{totalNotes}</h2>
          <button onClick={() => onNavigate('raw')} className="text-[9px] font-black font-mono text-blue-600 uppercase mt-4 hover:underline text-left">Raw View</button>
        </div>
        <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col justify-between">
          <p className="text-[10px] font-bold font-mono text-slate-500 uppercase">Intel Logs</p>
          <h2 className="text-4xl font-black font-mono text-slate-900">{researchCount}</h2>
          <button onClick={() => onNavigate('research')} className="text-[9px] font-black font-mono text-blue-600 uppercase mt-4 hover:underline text-left">Intel Hub</button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8">
        <section className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-black font-mono text-slate-400 uppercase tracking-widest">Recent Activity</h3>
            <button onClick={() => onNavigate('ledger')} className="text-[9px] font-bold font-mono text-slate-600 hover:text-slate-900 uppercase">History »</button>
          </div>
          <div className="space-y-3">
            {recentNotes.map(note => (
              <div key={note.id} className="p-4 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer" onClick={() => onNavigate('ledger')}>
                <div className="flex justify-between mb-2">
                  <span className="text-[8px] font-bold font-mono text-slate-500 uppercase">{note.type}</span>
                  <span className="text-[8px] font-bold font-mono text-slate-400">{new Date(note.timestamp).toLocaleTimeString()}</span>
                </div>
                <p className="text-xs text-slate-600 font-mono line-clamp-2 leading-relaxed">{note.content}</p>
              </div>
            ))}
            {recentNotes.length === 0 && (
              <div className="py-12 text-center border-2 border-dashed border-slate-100 rounded-2xl">
                <p className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">Ledger is empty</p>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

export default Dashboard;
