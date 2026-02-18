
import React, { useState } from 'react';
import { ProjectNote } from '../types';
import { askResearchQuestion } from '../services/geminiService';
import { marked } from 'marked';

interface ResearchHubProps {
  notes: ProjectNote[];
  context: string;
  onAddResearch: (question: string, answer: string, urls: string[]) => void;
  onPin: (note: ProjectNote) => void;
  onDelete: (id: string) => void;
  onRequestKey: () => void;
  manualApiKey: string;
  onSaveManualKey: (key: string) => void;
}

const ResearchHub: React.FC<ResearchHubProps> = ({ 
  notes, 
  context, 
  onAddResearch, 
  onPin, 
  onDelete, 
  onRequestKey,
  manualApiKey,
  onSaveManualKey
}) => {
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tempKey, setTempKey] = useState(manualApiKey);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || isLoading) return;

    setIsLoading(true);
    setError(null);

    try {
      const result = await askResearchQuestion(query, context, manualApiKey);
      onAddResearch(query, result.text, result.urls);
      setQuery('');
    } catch (err: any) {
      if (err.message === "API_KEY_MISSING") {
        setError("API Key is missing. Please provide one below.");
      } else {
        setError("AI Service connection failed. Verify your credentials.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateKey = () => {
    onSaveManualKey(tempKey);
    setError(null);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-10 animate-fade-in p-4">
      <div className="bg-stone-900 p-8 rounded-[2rem] shadow-2xl border-b-8 border-stone-950">
        <h2 className="text-stone-100 font-black text-xs uppercase tracking-[0.4em] mb-6 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
          Gathering Intelligence
        </h2>
        
        <form onSubmit={handleSearch} className="space-y-4">
          <textarea 
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ask a project-related research question..."
            className="w-full bg-stone-800 border-2 border-stone-700 rounded-xl p-5 text-white text-lg font-mono focus:border-blue-500 outline-none transition-all resize-none h-32"
          />
          <button 
            type="submit" 
            disabled={!query.trim() || isLoading}
            className="w-full py-4 bg-white text-stone-900 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-stone-100 transition-all flex items-center justify-center gap-3 disabled:opacity-30"
          >
            {isLoading ? "Executing Search..." : "Execute Scan"}
          </button>
        </form>
        
        {error && (
          <div className="mt-6 p-6 bg-red-950/30 border border-red-900/50 rounded-xl space-y-4">
            <div className="flex flex-col items-center gap-2">
              <p className="text-red-400 text-center text-[10px] font-bold uppercase tracking-wider">
                {error}
              </p>
              <button 
                onClick={(e) => {
                  e.preventDefault();
                  onRequestKey();
                }}
                className="text-[10px] font-black font-mono text-blue-400 hover:text-blue-300 uppercase tracking-[0.2em] underline decoration-blue-900 underline-offset-4 transition-colors mb-2"
              >
                Try System Selector
              </button>
            </div>

            <div className="pt-4 border-t border-red-900/30">
              <p className="text-[9px] font-black text-stone-500 uppercase tracking-widest mb-2 text-center">Manual API Key Entry</p>
              <div className="flex gap-2">
                <input 
                  type="password"
                  value={tempKey}
                  onChange={(e) => setTempKey(e.target.value)}
                  placeholder="Paste Key Here..."
                  className="flex-1 bg-stone-950 border border-stone-800 rounded-lg px-4 py-2 text-white font-mono text-xs focus:border-blue-500 outline-none"
                />
                <button 
                  onClick={handleUpdateKey}
                  className="px-4 py-2 bg-stone-100 text-stone-900 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-white transition-all active:scale-95"
                >
                  Apply
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-20">
        {notes.map(note => (
          <div key={note.id} className="bg-white p-6 rounded-2xl shadow-lg border border-stone-100 flex flex-col group relative">
            <div className="flex justify-between items-start mb-4">
              <span className="text-[9px] font-black bg-blue-50 text-blue-600 px-2 py-0.5 rounded uppercase tracking-widest">Discovery</span>
              <button onClick={() => onDelete(note.id)} className="text-stone-200 hover:text-red-500 transition-all opacity-0 group-hover:opacity-100">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            </div>
            
            <h3 className="text-stone-900 font-black text-sm uppercase tracking-tight mb-3 line-clamp-2">{note.question}</h3>
            
            <div className="flex-1 text-stone-600 text-sm leading-relaxed prose-sm prose-stone mb-6 max-h-[200px] overflow-y-auto no-scrollbar">
              <div dangerouslySetInnerHTML={{ __html: marked.parse(note.content) }} />
            </div>

            <div className="mt-auto pt-4 border-t border-stone-100 flex items-center justify-between">
              <button 
                onClick={() => onPin(note)}
                className="text-[10px] font-black text-blue-600 uppercase tracking-widest hover:underline"
              >
                Pin to Ledger
              </button>
              {note.metadata?.urls && note.metadata.urls.length > 0 && (
                <div className="flex gap-2">
                  <span className="text-[8px] font-bold text-stone-300 uppercase tracking-widest">{note.metadata.urls.length} Sources</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ResearchHub;
