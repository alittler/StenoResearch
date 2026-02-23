
import React, { useState, useRef } from 'react';
import { shredWallOfText } from '../services/geminiService';
import { ProjectNote } from '../types';

interface KnowledgeArchitectProps {
  onShredded: (notes: ProjectNote[]) => void;
  onAddRawNote: (content: string) => void;
}

const KnowledgeArchitect: React.FC<KnowledgeArchitectProps> = ({ onShredded, onAddRawNote }) => {
  const [inputText, setInputText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stagedNotes, setStagedNotes] = useState<ProjectNote[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleShred = async () => {
    if (!inputText.trim() || isProcessing) return;
    setIsProcessing(true);
    setError(null);

    try {
      const results = await shredWallOfText(inputText);
      const newNotes: ProjectNote[] = results.map((r: any) => ({
        id: crypto.randomUUID(),
        title: r.title,
        content: r.content,
        category: r.category,
        tags: r.tags,
        links: r.links,
        is_priority: r.is_priority,
        raw_source_id: r.raw_source_id,
        timestamp: Date.now()
      }));
      setStagedNotes(newNotes);
    } catch (err: any) {
      setError("Architectural synthesis failed. Verify input or API connection.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCommitRaw = () => {
    if (!inputText.trim()) return;
    onAddRawNote(inputText);
    setInputText('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleShred();
    }
  };

  const handleCommitStaged = () => {
    onShredded(stagedNotes);
    setStagedNotes([]);
    setInputText('');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      if (text) setInputText(prev => prev + (prev ? '\n\n' : '') + text);
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="space-y-12 animate-fade-in p-10 md:p-20 pt-3 pb-32">
      <header className="space-y-2 text-center">
        <h2 className="text-4xl font-black text-slate-900 uppercase tracking-tighter italic">Knowledge Architect</h2>
        <p className="text-slate-400 text-[10px] uppercase font-black tracking-[0.4em]">Notes created here remain staged until committed.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">
        {/* Input Side */}
        <div className="bg-slate-900 rounded-[2.5rem] p-10 shadow-2xl space-y-8">
          <div className="space-y-4">
            <div className="flex justify-between items-center px-2">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Drafting Area</span>
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="text-[10px] font-black text-slate-400 hover:text-white uppercase tracking-widest transition-colors"
              >
                Upload Document
              </button>
              <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileUpload} />
            </div>
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="PASTE CHAT LOGS OR RAW NOTES... (ENTER TO SHATTER AND ANALYZE)"
              className="w-full h-[500px] bg-slate-800 border-2 border-slate-700 rounded-3xl p-8 text-white font-mono text-base focus:border-slate-500 outline-none transition-all resize-none leading-relaxed"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={handleCommitRaw}
              disabled={!inputText.trim() || isProcessing}
              className="py-5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] bg-slate-700 text-white hover:bg-slate-600 transition-all shadow-xl disabled:opacity-20"
            >
              Commit Raw
            </button>
            <button
              onClick={handleShred}
              disabled={!inputText.trim() || isProcessing}
              className="py-5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] bg-white text-slate-900 hover:bg-slate-100 transition-all shadow-xl disabled:opacity-20"
            >
              {isProcessing ? 'Shattering...' : 'Shatter & Analyze'}
            </button>
          </div>
          {error && <p className="text-red-400 text-[10px] font-black uppercase text-center">{error}</p>}
        </div>

        {/* Staging Side */}
        <div className="space-y-6">
          <div className="flex justify-between items-center px-4">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Atomic Staging Area</h3>
            {stagedNotes.length > 0 && (
              <button 
                onClick={handleCommitStaged}
                className="text-[10px] font-black text-emerald-600 uppercase tracking-widest hover:text-emerald-700 underline underline-offset-4"
              >
                Commit Staged Records
              </button>
            )}
          </div>

          <div className="space-y-4 max-h-[700px] overflow-y-auto no-scrollbar pr-2 pb-10">
            {stagedNotes.map((note) => (
              <div key={note.id} className="bg-white border-2 border-slate-100 rounded-3xl p-8 shadow-sm space-y-4 hover:border-slate-300 transition-all group">
                <div className="flex justify-between">
                  <span className="text-[9px] font-black px-2 py-0.5 rounded border bg-slate-50 text-slate-400 border-slate-100 uppercase tracking-widest">
                    {note.category}
                  </span>
                  <button 
                    onClick={() => setStagedNotes(prev => prev.filter(n => n.id !== note.id))}
                    className="text-slate-200 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12"></path></svg>
                  </button>
                </div>
                <h4 className="font-black text-slate-900 text-sm uppercase italic tracking-tight">{note.title}</h4>
                <p className="text-[13px] text-slate-600 leading-relaxed italic">"{note.content}"</p>
              </div>
            ))}

            {stagedNotes.length === 0 && !isProcessing && (
              <div className="h-[400px] border-4 border-dashed border-slate-100 rounded-[3rem] flex flex-col items-center justify-center text-slate-300 gap-6">
                <div className="text-6xl opacity-20 grayscale">🧩</div>
                <p className="text-[10px] font-black uppercase tracking-[0.4em] text-center">Structure Pending Analysis</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default KnowledgeArchitect;
