
import React, { useState, useRef } from 'react';
import { Notebook, ProjectNote } from '../types';

const COLORS = [
  { name: 'Slate', hex: '#64748b' },
  { name: 'Red', hex: '#ef4444' },
  { name: 'Blue', hex: '#3b82f6' },
  { name: 'Green', hex: '#10b981' },
  { name: 'Purple', hex: '#a855f7' },
  { name: 'Orange', hex: '#f97316' },
];

interface NotebookShelfProps {
  notebooks: Notebook[];
  notes: ProjectNote[];
  onSelect: (id: string) => void;
  onAdd: (t: string, c: string) => void;
  onDelete: (id: string) => void;
  hasUnsavedChanges: boolean;
  onBackupPerformed: () => void;
  onRestore: (data: any) => void;
}

const NotebookShelf: React.FC<NotebookShelfProps> = ({ 
  notebooks, 
  notes, 
  onSelect, 
  onAdd, 
  onDelete, 
  onBackupPerformed,
  onRestore
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [title, setTitle] = useState('');
  const [color, setColor] = useState(COLORS[0].hex);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = () => {
    const data = { notebooks, notes, version: 6, exportedAt: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ledger-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    onBackupPerformed();
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        onRestore(json);
      } catch (err) { alert("Invalid backup file."); }
    };
    reader.readAsText(file);
  };

  return (
    <div className="max-w-6xl mx-auto px-6 py-12 animate-fade-in">
      <header className="flex flex-col md:flex-row justify-between items-center gap-6 mb-12 border-b border-slate-100 pb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Project Dashboard</h1>
          <p className="text-slate-500 text-sm mt-1">Manage your research ledgers and notes.</p>
        </div>
        
        <div className="flex gap-3">
          <button 
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 bg-slate-50 text-slate-600 hover:bg-slate-100 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0l-4 4m4-4v12"></path></svg>
            Export
          </button>
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 px-4 py-2 bg-slate-50 text-slate-600 hover:bg-slate-100 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path></svg>
            Import
          </button>
          <input type="file" ref={fileInputRef} className="hidden" accept=".json" onChange={handleImport} />
        </div>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <button 
          onClick={() => setIsAdding(true)} 
          className="h-48 border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center gap-4 text-slate-400 hover:border-slate-400 hover:text-slate-600 transition-all bg-slate-50 group"
        >
          <div className="w-12 h-12 rounded-full border-2 border-slate-200 flex items-center justify-center group-hover:bg-slate-100 transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
          </div>
          <span className="font-semibold text-xs uppercase tracking-widest">New Project</span>
        </button>

        {notebooks.map((nb) => {
          const count = notes.filter(n => n.notebookId === nb.id).length;
          return (
            <div 
              key={nb.id} 
              onClick={() => onSelect(nb.id)} 
              className="group relative h-48 bg-white border border-slate-200 rounded-2xl shadow-sm hover:shadow-md hover:border-slate-300 transition-all cursor-pointer p-6 flex flex-col overflow-hidden" 
            >
              <div className="absolute top-0 left-0 w-full h-1" style={{ backgroundColor: nb.color }}></div>
              
              <div className="flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="text-xl font-bold text-slate-800 line-clamp-1">{nb.title}</h3>
                  <div className="flex items-center gap-2 mt-2">
                    {nb.id === 'general' && (
                      <span className="text-[10px] font-bold bg-slate-100 text-slate-500 px-2 py-0.5 rounded uppercase tracking-wider">System</span>
                    )}
                    <span className="text-xs text-slate-400">{count} records</span>
                  </div>
                </div>
                
                <div className="flex justify-between items-center mt-auto">
                   <p className="text-[10px] text-slate-400 font-medium uppercase tracking-widest">
                     {nb.createdAt ? new Date(nb.createdAt).toLocaleDateString() : 'Existing'}
                   </p>
                   {nb.id !== 'general' && (
                    <button 
                      onClick={(e) => { e.stopPropagation(); onDelete(nb.id); }} 
                      className="p-2 text-slate-300 hover:text-red-500 transition-colors z-20"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {isAdding && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-100">
            <div className="p-6 flex justify-between items-center border-b border-slate-100">
              <h2 className="font-bold text-slate-800">New Project</h2>
              <button onClick={() => setIsAdding(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            </div>
            
            <div className="p-8 space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Name</label>
                <input 
                  autoFocus
                  value={title} 
                  onChange={e => setTitle(e.target.value)} 
                  placeholder="Enter project name..." 
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none transition-all" 
                  onKeyDown={(e) => e.key === 'Enter' && title.trim() && (onAdd(title, color), setIsAdding(false), setTitle(''))}
                />
              </div>

              <div className="space-y-3">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Color Theme</label>
                <div className="grid grid-cols-6 gap-2">
                  {COLORS.map(c => (
                    <button 
                      key={c.hex} 
                      onClick={() => setColor(c.hex)} 
                      className={`h-8 w-8 rounded-full border-2 transition-all ${color === c.hex ? 'border-slate-800 scale-110 shadow-sm' : 'border-transparent'}`} 
                      style={{ backgroundColor: c.hex }} 
                    />
                  ))}
                </div>
              </div>

              <button 
                disabled={!title.trim()}
                onClick={() => { if(title.trim()){ onAdd(title, color); setIsAdding(false); setTitle(''); } }} 
                className="w-full py-3 bg-slate-900 text-white rounded-lg font-bold text-sm uppercase tracking-wider hover:bg-black transition-all disabled:opacity-30"
              >
                Create Project
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotebookShelf;
