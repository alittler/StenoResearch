
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
}

const ResearchHub: React.FC<ResearchHubProps> = ({ 
  notes, 
  context, 
  onAddResearch, 
  onPin, 
  onDelete, 
  onRequestKey 
}) => {
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || isLoading) return;

    setIsLoading(true);
    setError(null);

    try {
      const result = await askResearchQuestion(query, context);
      onAddResearch(query, result.text, result.urls);
      setQuery('');
    } catch (err: any) {
      if (err.message === "MISSING_API_KEY" || err.message === "INVALID_API_KEY") {
        setError("API Connection Error. Verify project API key in environment.");
        onRequestKey();
      } else {
        setError("Research failed. Verify your network or query details.");
      }
    } finally {
      setIsLoading(false);
    }
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
          <div className="mt-4 flex flex-col items-center gap-2">
            <p className="text-red-400 text-center text-[10px] font-bold uppercase tracking-wider">{error}</p>
            <button onClick={onRequestKey} className="text-blue-400 text-[9px] font-black uppercase tracking-widest hover:underline">Select Key</button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
