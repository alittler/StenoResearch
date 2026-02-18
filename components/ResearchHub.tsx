
import React, { useState, useEffect } from 'react';
import { ProjectNote } from '../types';
import { askResearchQuestion } from '../services/geminiService';
import { marked } from 'marked';

interface ResearchHubProps {
  notes: ProjectNote[];
  context: string;
  apiKey: string;
  onAddResearch: (question: string, answer: string, urls: string[]) => void;
  onPin: (note: ProjectNote) => void;
  onDelete: (id: string) => void;
  onRequestKey: () => void;
}

const ResearchHub: React.FC<ResearchHubProps> = ({ 
  notes, 
  context, 
  apiKey,
  onAddResearch, 
  onPin, 
  onDelete, 
  onRequestKey 
}) => {
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Clear error when key is updated
  useEffect(() => {
    if (apiKey && (error?.includes("Key") || error?.includes("MISSING") || error?.includes("INVALID"))) {
      setError(null);
    }
  }, [apiKey]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || isLoading) return;

    setIsLoading(true);
    setError(null);

    try {
      const result = await askResearchQuestion(query, context, apiKey);
      onAddResearch(query, result.text, result.urls);
      setQuery('');
    } catch (err: any) {
      console.error("Research Hub Error:", err);
      // Map known error types to friendly messages, or show raw error for debugging
      if (err.message === "MISSING_API_KEY") {
        setError("API Key is missing. Please use the 'Select Key' button below.");
      } else if (err.message === "INVALID_API_KEY") {
        setError("The provided API Key is invalid or unauthorized. Please verify your billing or select a different key.");
      } else if (err.message === "MODEL_NOT_AVAILABLE") {
        setError("The Gemini model is not available for this key/region. Ensure you are using a paid-tier key if required.");
      } else {
        // Fallback to detailed message so the user can actually see what's wrong
        setError(`Research Failed: ${err.message || 'Unknown network error'}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-10 animate-fade-in">
      <div className="bg-stone-900 p-8 rounded-[2rem] shadow-2xl border-b-8 border-stone-950 relative overflow-hidden">
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-blue-600/10 rounded-full blur-3xl pointer-events-none"></div>
        <h2 className="text-stone-100 font-black text-xs uppercase tracking-[0.4em] mb-6 flex items-center gap-2 relative z-10">
          <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
          Gathering Intelligence
        </h2>
        
        <form onSubmit={handleSearch} className="space-y-4 relative z-10">
          <textarea 
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ask a project-related research question..."
            className="w-full bg-stone-800 border-2 border-stone-700 rounded-xl p-5 text-white text-lg font-mono focus:border-blue-500 outline-none transition-all resize-none h-32 placeholder:text-stone-600"
          />
          <button 
            type="submit" 
            disabled={!query.trim() || isLoading}
            className="w-full py-4 bg-white text-stone-900 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-stone-100 transition-all flex items-center justify-center gap-3 disabled:opacity-30 shadow-lg active:translate-y-0.5"
          >
            {isLoading ? "Executing Search..." : "Execute Scan"}
          </button>
        </form>

        {error && (
          <div className="mt-6 p-5 bg-red-500/10 border border-red-500/20 rounded-xl flex flex-col items-center gap-4 relative z-10 animate-fade-in">
            <div className="flex items-center gap-2 text-red-400">
               <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
               <p className="text-center text-[11px] font-black uppercase tracking-wider">{error}</p>
            </div>
            <button 
              onClick={onRequestKey} 
              className="w-full py-2 bg-red-600 text-white rounded-lg text-[10px] font-black uppercase tracking-[0.2em] hover:bg-red-500 transition-all shadow-lg"
            >
              Select API Key
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-20">
        {notes.map(note => (
          <div key={note.id} className="bg-white p-6 rounded-2xl shadow-lg border border-stone-100 flex flex-col group relative hover:shadow-xl transition-all">
            <div className="flex justify-between items-start mb-4">
              <span className="text-[9px] font-black bg-blue-50 text-blue-600 px-2 py-0.5 rounded uppercase tracking-widest">Discovery</span>
              <button onClick={() => onDelete(note.id)} className="text-stone-200 hover:text-red-500 transition-all opacity-0 group-hover:opacity-100 p-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            </div>
            <h3 className="text-stone-900 font-black text-sm uppercase tracking-tight mb-3 line-clamp-2 leading-tight">{note.question}</h3>
            <div className="flex-1 text-stone-600 text-sm leading-relaxed prose-sm prose-stone mb-6 max-h-[200px] overflow-y-auto no-scrollbar scroll-smooth">
              <div dangerouslySetInnerHTML={{ __html: marked.parse(note.content) }} />
            </div>
            <div className="mt-auto pt-4 border-t border-stone-100 flex items-center justify-between">
              <button onClick={() => onPin(note)} className="text-[10px] font-black text-blue-600 uppercase tracking-widest hover:underline">Pin to Ledger</button>
              {note.metadata?.urls && note.metadata.urls.length > 0 && (
                <span className="text-[8px] font-bold text-stone-300 uppercase tracking-widest">{note.metadata.urls.length} Sources</span>
              )}
            </div>
          </div>
        ))}
        {notes.length === 0 && !isLoading && (
          <div className="col-span-full py-20 bg-stone-50/30 border-2 border-dashed border-stone-100 rounded-[2.5rem] flex flex-col items-center justify-center gap-4 text-stone-300">
             <div className="text-5xl opacity-20">📡</div>
             <p className="text-[10px] font-black uppercase tracking-[0.4em]">Ready for Intelligence Scan</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ResearchHub;
