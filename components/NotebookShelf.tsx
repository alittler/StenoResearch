
import React, { useState, useRef } from 'react';
import { Notebook, ProjectNote } from '../types';

const COLORS = ['#fecaca', '#fed7aa', '#fef08a', '#d9f99d', '#a5f3fc', '#ddd6fe', '#e7e5e4'];

interface NotebookShelfProps {
  notebooks: Notebook[];
  notes: ProjectNote[];
  onSelect: (id: string) => void;
  onAdd: (t: string, c: string) => void;
  onDelete: (id: string) => void;
  onImport?: (data: { notebooks: Notebook[], notes: ProjectNote[] }) => void;
  hasUnsavedChanges: boolean;
  onBackupPerformed: () => void;
}

export const NotebookShelf: React.FC<NotebookShelfProps> = ({ 
  notebooks, 
  notes, 
  onSelect, 
  onAdd, 
  onDelete, 
  onImport, 
  hasUnsavedChanges,
  onBackupPerformed
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [title, setTitle] = useState('');
  const [color, setColor] = useState(COLORS[0]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = () => {
    const data = {
      notebooks,
      notes,
      version: 4,
      exportedAt: new Date().toISOString()
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `steno-ledger-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    onBackupPerformed();
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (json && Array.isArray(json.notebooks) && Array.isArray(json.notes)) {
          if (onImport) onImport({ notebooks: json.notebooks, notes: json.notes });
        }
      } catch (err) {
        alert("Restore Failed: Invalid file format.");
      }
    };
    reader.readAsText(file);
    e.target.value = ''; 
  };

  return (
    <div className="space-y-8 md:space-y-12 animate-in fade-in duration-500 pb-20">
      <div className="flex flex-col items-center gap-4 md:gap-6">
        <h1 className="text-3xl md:text-5xl font-bold font-mono tracking-tighter text-stone-800">PROJECT LEDGER</h1>
        
        <div className="flex flex-wrap justify-center gap-2 md:gap-3 items-center">
          <div className="relative group">
            <button 
              onClick={handleExport}
              className={`text-[9px] md:text-[10px] font-bold font-mono flex items-center gap-2 px-3 md:px-5 py-2.5 rounded-full border transition-all uppercase tracking-widest shadow-sm ${hasUnsavedChanges ? 'bg-orange-50 border-orange-200 text-orange-600 hover:border-orange-400' : 'bg-white border-stone-200 text-stone-400 hover:border-stone-400'}`}
            >
              <svg className="w-3 h-3 md:w-3.5 md:h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0l-4-4m4 4V4"></path></svg>
              <span>Backup Shelf</span>
            </button>
            {hasUnsavedChanges && (
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-orange-500 rounded-full border-2 border-stone-100 animate-pulse"></div>
            )}
          </div>
          
          <button 
            onClick={handleImportClick}
            className="text-[9px] md:text-[10px] font-bold font-mono text-stone-400 hover:text-stone-800 flex items-center gap-2 px-3 py-2.5 rounded-full border border-stone-200 hover:border-stone-400 transition-all uppercase tracking-widest bg-white shadow-sm"
          >
            <svg className="w-3 h-3 md:w-3.5 md:h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path></svg>
            <span>Restore</span>
          </button>
          
          <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept=".json" />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
        {notebooks.map((nb) => (
          <div 
            key={nb.id} 
            onClick={() => onSelect(nb.id)} 
            className="group relative h-48 md:h-64 rounded-r-2xl shadow-xl transition-all md:hover:-translate-y-2 cursor-pointer border-l-[12px] md:border-l-[16px] border-stone-800/30 p-6 md:p-8 flex flex-col justify-between active:scale-[0.98] paper-texture" 
            style={{ backgroundColor: nb.color }}
          >
            <div>
              <h3 className="text-xl md:text-2xl font-bold font-mono text-stone-800 break-words leading-tight uppercase tracking-tighter">{nb.title}</h3>
              {nb.id === 'general' && <span className="text-[8px] md:text-[9px] font-bold font-mono bg-stone-900 text-white px-2 py-0.5 rounded mt-2 inline-block">SYSTEM</span>}
            </div>
            
            <div className="flex justify-between items-end">
              <div className="flex flex-col">
                <span className="text-[9px] md:text-[10px] font-mono text-stone-600 font-bold">CREATED {new Date(nb.timestamp).toLocaleDateString()}</span>
                <span className="text-[8px] md:text-[9px] font-mono text-stone-500 uppercase font-black tracking-widest mt-1">
                  {notes.filter(n => n.notebookId === nb.id).length} RECORDS
                </span>
              </div>
              {nb.id !== 'general' && (
                <button 
                  onClick={(e) => { e.stopPropagation(); onDelete(nb.id); }} 
                  className="p-2 opacity-0 group-hover:opacity-100 hover:text-red-600 transition-opacity"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                </button>
              )}
            </div>
            {/* Shelf lines decoration */}
            <div className="absolute top-0 bottom-0 left-[-8px] w-[2px] bg-stone-900/10"></div>
          </div>
        ))}

        {isAdding ? (
          <div className="h-48 md:h-64 bg-white rounded-r-2xl border-4 border-dashed border-stone-200 p-6 flex flex-col justify-between animate-in fade-in duration-200 shadow-inner">
            <input 
              autoFocus
              value={title} 
              onChange={e => setTitle(e.target.value)} 
              placeholder="LEDGER NAME..." 
              className="w-full bg-transparent border-b-2 border-stone-800 font-mono text-base md:text-xl focus:outline-none py-2 uppercase placeholder:text-stone-300" 
              onKeyDown={(e) => e.key === 'Enter' && title.trim() && (onAdd(title, color), setIsAdding(false), setTitle(''))}
            />
            <div className="flex flex-wrap gap-2">
              {COLORS.map(c => (
                <button 
                  key={c} 
                  onClick={() => setColor(c)} 
                  className={`w-6 h-6 rounded-full border-2 transition-all ${color === c ? 'border-stone-800 scale-125' : 'border-transparent hover:scale-110'}`} 
                  style={{ backgroundColor: c }} 
                />
              ))}
            </div>
            <div className="flex gap-2">
              <button 
                onClick={() => { if(title.trim()){ onAdd(title, color); setIsAdding(false); setTitle(''); } }} 
                className="flex-1 py-2 bg-stone-800 text-white rounded-lg font-mono text-[10px] md:text-xs font-bold uppercase"
              >
                Create
              </button>
              <button 
                onClick={() => setIsAdding(false)} 
                className="flex-1 py-2 text-stone-400 font-mono text-[10px] md:text-xs font-bold uppercase"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button 
            onClick={() => setIsAdding(true)} 
            className="h-48 md:h-64 border-4 border-dashed border-stone-200 rounded-r-2xl flex flex-col items-center justify-center gap-3 text-stone-300 hover:border-stone-300 hover:text-stone-400 transition-all hover:bg-white active:scale-95 group shadow-sm"
          >
            <div className="p-4 rounded-full bg-stone-50 group-hover:bg-stone-100 transition-colors">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
            </div>
            <span className="font-mono text-[10px] md:text-xs font-black uppercase tracking-[0.2em]">New Project</span>
          </button>
        )}
      </div>
    </div>
  );
};

export default NotebookShelf;
