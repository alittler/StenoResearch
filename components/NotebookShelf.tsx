
import React, { useState, useRef, useMemo } from 'react';
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
  hasUnsavedChanges,
  onBackupPerformed,
  onRestore
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [title, setTitle] = useState('');
  const [color, setColor] = useState(COLORS[0].hex);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const sortedNotebooks = useMemo(() => {
    const main = notebooks.find(nb => nb.id === 'general');
    const others = notebooks.filter(nb => nb.id !== 'general').sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    return main ? [main, ...others] : others;
  }, [notebooks]);

  const handleAddProject = () => {
    if (title.trim()) {
      onAdd(title, color);
      setIsAdding(false);
      setTitle('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleAddProject();
    }
  };

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
          <p className="text-slate-500 text-sm mt-1 uppercase font-black text-[10px] tracking-widest">Select an active ledger</p>
        </div>
        
        <div className="flex items-center gap-6">
          {hasUnsavedChanges && (
            <div className="hidden md:flex flex-col items-end">
              <span className="text-[9px] font-black text-amber-500 uppercase tracking-widest">Unsaved Export</span>
              <span className="text-[8px] font-bold text-slate-300 uppercase">Backup recommended</span>
            </div>
          )}
          <div className="flex gap-3">
            <button 
              onClick={handleExport} 
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all border ${hasUnsavedChanges ? 'bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100 shadow-md' : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'}`}
            >
              Export JSON
            </button>
            <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2 px-4 py-2 bg-slate-50 text-slate-600 hover:bg-slate-100 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all border border-slate-200">Import</button>
            <input type="file" ref={fileInputRef} className="hidden" accept=".json" onChange={handleImport} />
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {sortedNotebooks.map((nb) => {
          const count = notes.filter(n => n.notebookId === nb.id).length;
          const isMain = nb.id === 'general';
          
          return (
            <div 
              key={nb.id} 
              onClick={() => onSelect(nb.id)} 
              className={`group relative h-56 border-2 rounded-3xl shadow-sm hover:shadow-xl transition-all cursor-pointer p-8 flex flex-col overflow-hidden ${
                isMain 
                ? 'bg-[#fffbeb] border-amber-200 hover:border-amber-400' 
                : 'bg-white border-slate-200 hover:border-slate-300'
              }`} 
            >
              {isMain ? (
                <>
                  <div className="absolute top-0 left-0 w-full h-10 bg-amber-100 flex items-center px-4 gap-2">
                     {[...Array(14)].map((_, i) => <div key={i} className="w-2 h-2 rounded-full bg-amber-200 shadow-inner"></div>)}
                  </div>
                  <div className="absolute left-10 top-0 bottom-0 w-[1px] bg-red-200 opacity-60"></div>
                  <div className="mt-6 pl-6 flex-1 flex flex-col justify-between">
                    <div>
                      <h3 className="text-2xl font-black text-amber-900 font-serif italic tracking-tight leading-none">
                        {nb.title}
                      </h3>
                      <div className="mt-3 flex items-center gap-2">
                        <span className="text-[9px] font-black bg-amber-200 text-amber-700 px-2 py-0.5 rounded uppercase tracking-widest">Main Pad</span>
                        <span className="text-[9px] font-bold text-amber-600/70 uppercase tracking-widest">{count} records</span>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="absolute top-0 left-0 w-full h-2" style={{ backgroundColor: nb.color }}></div>
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <h3 className="text-xl font-bold text-slate-800 line-clamp-2">{nb.title}</h3>
                      <div className="mt-2 text-[9px] font-bold text-slate-400 uppercase tracking-widest">{count} records</div>
                    </div>
                    <div className="flex justify-between items-center mt-auto">
                      <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">{nb.createdAt ? new Date(nb.createdAt).toLocaleDateString() : 'Draft'}</p>
                      <button onClick={(e) => { e.stopPropagation(); onDelete(nb.id); }} className="p-2 text-slate-200 hover:text-red-500 transition-colors"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg></button>
                    </div>
                  </div>
                </>
              )}
            </div>
          );
        })}

        <button 
          onClick={() => setIsAdding(true)} 
          className="h-56 border-4 border-dashed border-slate-200 rounded-3xl flex flex-col items-center justify-center gap-4 text-slate-300 hover:border-slate-400 hover:text-slate-500 transition-all bg-slate-50/50 group"
        >
          <div className="w-16 h-16 rounded-full border-4 border-slate-200 flex items-center justify-center group-hover:bg-white group-hover:border-slate-300 transition-all"><svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg></div>
          <span className="font-black text-xs uppercase tracking-[0.2em]">Create New Ledger</span>
        </button>
      </div>

      {isAdding && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100">
            <div className="p-6 flex justify-between items-center border-b border-slate-100 bg-slate-50/50">
              <h2 className="font-black text-slate-800 uppercase tracking-widest text-sm">Initialize Project</h2>
              <button onClick={() => setIsAdding(false)} className="text-slate-400 hover:text-slate-600 transition-colors"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg></button>
            </div>
            <div className="p-10 space-y-8">
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Ledger Name</label>
                <input autoFocus value={title} onChange={e => setTitle(e.target.value)} onKeyDown={handleKeyDown} placeholder="Project ID..." className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 text-slate-800 font-bold focus:border-blue-500 outline-none transition-all" />
              </div>
              <div className="space-y-4">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Color ID</label>
                <div className="flex justify-between gap-2">
                  {COLORS.map(c => <button key={c.hex} onClick={() => setColor(c.hex)} className={`h-10 w-10 rounded-full border-4 transition-all ${color === c.hex ? 'border-slate-800 scale-110 shadow-lg' : 'border-transparent'}`} style={{ backgroundColor: c.hex }} />)}
                </div>
              </div>
              <button disabled={!title.trim()} onClick={handleAddProject} className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:bg-black transition-all disabled:opacity-20 shadow-xl">Initialize Ledger</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotebookShelf;
