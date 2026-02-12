
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
  isAIStudio: boolean;
}

export const NotebookShelf: React.FC<NotebookShelfProps> = ({ notebooks, notes, onSelect, onAdd, onDelete, onImport, isAIStudio }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [title, setTitle] = useState('');
  const [color, setColor] = useState(COLORS[0]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = () => {
    const data = {
      notebooks,
      notes,
      version: 3,
      exportedAt: new Date().toISOString()
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `steno-research-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
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
          if (onImport) {
            onImport({ notebooks: json.notebooks, notes: json.notes });
          }
        } else {
          alert("Restore Failed: The selected file is not a valid StenoResearch backup or is missing data.");
        }
      } catch (err) {
        alert("Restore Failed: Invalid file format. Please upload a .json backup file.");
        console.error("Parse error:", err);
      }
    };
    reader.readAsText(file);
    e.target.value = ''; // Reset input
  };

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col items-center gap-4">
        <h1 className="text-4xl font-bold font-mono tracking-tighter">PROJECT SHELF</h1>
        
        <div className="flex flex-wrap justify-center gap-3">
          <button 
            onClick={handleExport}
            className="text-[10px] font-bold font-mono text-stone-400 hover:text-stone-800 flex items-center gap-2 px-3 py-1.5 rounded-full border border-stone-200 hover:border-stone-400 transition-all uppercase tracking-widest bg-white/50"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0l-4-4m4 4V4"></path></svg>
            Backup Library
          </button>
          
          <button 
            onClick={handleImportClick}
            className="text-[10px] font-bold font-mono text-stone-400 hover:text-stone-800 flex items-center gap-2 px-3 py-1.5 rounded-full border border-stone-200 hover:border-stone-400 transition-all uppercase tracking-widest bg-white/50"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path></svg>
            Restore Library
          </button>

          {!isAIStudio && (
            <a 
              href="https://www.doppler.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-[10px] font-bold font-mono text-stone-100 hover:text-white flex items-center gap-2 px-3 py-1.5 rounded-full bg-stone-800 hover:bg-black transition-all uppercase tracking-widest shadow-sm ring-1 ring-stone-950/20"
              title="Manage your API keys securely via Doppler Secret Ops"
            >
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 6c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2zm0 12c-2.67 0-5-1.33-5-4 0-2.67 2.33-4 5-4s5 1.33 5 4c0 2.67-2.33 4-5 4z"/>
              </svg>
              API Keys via Doppler
            </a>
          )}
          
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            className="hidden" 
            accept=".json"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {notebooks.map((nb) => (
          <div 
            key={nb.id} 
            onClick={() => onSelect(nb.id)} 
            className="group relative h-64 rounded-r-2xl shadow-xl transition-all hover:-translate-y-2 cursor-pointer border-l-[12px] border-stone-800/20 p-8 flex flex-col justify-between" 
            style={{ backgroundColor: nb.color }}
          >
            <div>
              <h3 className="text-2xl font-bold font-mono text-stone-800 break-words leading-tight">{nb.title}</h3>
              {nb.id === 'general' && <span className="text-[9px] font-bold font-mono bg-white/40 px-2 py-0.5 rounded mt-2 inline-block">SYSTEM NOTES</span>}
            </div>
            
            <div className="flex justify-between items-end">
              <div className="flex flex-col">
                <span className="text-[10px] font-mono text-stone-600">EST. {new Date(nb.timestamp).toLocaleDateString()}</span>
                <span className="text-[9px] font-mono text-stone-500 uppercase font-bold">
                  {notes.filter(n => n.notebookId === nb.id).length} Records
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
            
            <div className="absolute top-0 bottom-0 left-[-6px] w-[2px] bg-stone-800/10"></div>
          </div>
        ))}

        {isAdding ? (
          <div className="h-64 bg-white rounded-r-2xl border-2 border-dashed border-stone-300 p-6 flex flex-col justify-between animate-in zoom-in-95">
            <input 
              autoFocus 
              value={title} 
              onChange={e => setTitle(e.target.value)} 
              placeholder="Project Name..." 
              className="w-full bg-transparent border-b-2 border-stone-800 font-mono text-xl focus:outline-none py-2" 
              onKeyDown={(e) => e.key === 'Enter' && title.trim() && (onAdd(title, color), setIsAdding(false), setTitle(''))}
            />
            <div className="flex flex-wrap gap-2">
              {COLORS.map(c => (
                <button 
                  key={c} 
                  onClick={() => setColor(c)} 
                  className={`w-6 h-6 rounded-full border transition-all ${color === c ? 'ring-2 ring-stone-800 ring-offset-2' : 'border-stone-100'}`} 
                  style={{ backgroundColor: c }} 
                />
              ))}
            </div>
            <div className="flex gap-2">
              <button 
                onClick={() => { if(title.trim()){ onAdd(title, color); setIsAdding(false); setTitle(''); } }} 
                className="flex-1 py-2 bg-stone-800 text-white rounded font-mono text-xs font-bold"
              >
                Create
              </button>
              <button 
                onClick={() => setIsAdding(false)} 
                className="flex-1 py-2 text-stone-400 font-mono text-xs font-bold"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button 
            onClick={() => setIsAdding(true)} 
            className="h-64 border-4 border-dashed border-stone-200 rounded-r-2xl flex flex-col items-center justify-center gap-2 text-stone-300 hover:border-stone-300 hover:text-stone-400 transition-all hover:bg-white"
          >
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
            <span className="font-mono text-xs font-bold uppercase tracking-widest">New Project</span>
          </button>
        )}
      </div>
    </div>
  );
};

export default NotebookShelf;
