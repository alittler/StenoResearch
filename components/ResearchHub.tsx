
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
}

const ResearchHub: React.FC<ResearchHubProps> = ({ 
  notes, 
  context, 
  onAddResearch, 
  onPin, 
  onDelete
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
      console.error("Research Hub Error:", err);
      const detailedMessage = err.message || "Unknown Error";
      
      if (detailedMessage === "API_KEY_MISSING") {
        setError("AI Credentials Missing. Please check environment configuration.");
      } else {
        setError(`Inference Failed: ${detailedMessage}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-10 animate-fade-in p-6">
      <div className="bg-stone-900 p-8 rounded-[2rem] shadow-2xl border-b-8 border-stone-950">
        <h2 className="text-stone-100 font-black text-[10px] uppercase tracking-[0.4em] mb-6 flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-orange-500 animate-pulse shadow-[0_0_10px_rgba(249,115,22,0.5)]"></span>
          Groq Intelligence Gateway
        </h2>
        
        <form onSubmit={handleSearch} className="space-y-4">
          <textarea 
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Describe your research inquiry..."
            className="w-full bg-stone-800 border-2 border-stone-700 rounded-2xl p-6 text-white text-lg font-mono focus:border-orange-500 outline-none transition-all resize-none h-40 shadow-inner placeholder:text-stone-600"
          />
          <button 
            type="submit" 
            disabled={!query.trim() || isLoading}
            className="w-full py-5 bg-white text-stone-900 rounded-xl font-black text-[10px] uppercase tracking-[0.3em] hover:bg-stone-100 transition-all flex items-center justify-center gap-3 disabled:opacity-20 shadow-lg active:scale-[0.98]"
          >
            {isLoading ? "Analyzing via Llama-3..." : "Execute Inquiry"}
          </button>
        </form>
        
        {error && (
          <div className="mt-6 p-4 bg-red-900/20 border border-red-900/50 rounded-xl text-red-400 text-[10px] font-black uppercase tracking-wider text-center animate-pulse">
            {error}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pb-24">
        {notes.map(note => (
          <div key={note.id} className="bg-white p-8 rounded-[2rem] shadow-xl border border-stone-100 flex flex-col group relative hover:border-orange-100 transition-all">
            <div className="flex justify-between items-start mb-6">
              <span className="text-[10px] font-black bg-orange-50 text-orange-600 px-3 py-1 rounded-full uppercase tracking-widest">Inference Record</span>
              <button onClick={() => onDelete(note.id)} className="text-stone-200 hover:text-red-500 transition-all opacity-0 group-hover:opacity-100">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            </div>
            
            <h3 className="text-stone-900 font-black text-sm uppercase tracking-tight mb-4 leading-tight">
              {note.question}
            </h3>
            
            <div className="flex-1 text-stone-600 text-xs leading-relaxed prose-sm prose-stone mb-8 max-h-[300px] overflow-y-auto no-scrollbar">
              <div dangerouslySetInnerHTML={{ __html: marked.parse(note.content) }} />
            </div>

            <div className="mt-auto pt-6 border-t border-stone-100">
              <button 
                onClick={() => onPin(note)}
                className="text-[10px] font-black text-stone-300 uppercase tracking-widest hover:text-orange-500 transition-all"
              >
                Promote to Ledger
              </button>
            </div>
          </div>
        ))}
        {notes.length === 0 && !isLoading && (
          <div className="col-span-full py-20 text-center border-4 border-dashed border-stone-100 rounded-[3rem]">
            <p className="text-[10px] font-black font-mono text-stone-300 uppercase tracking-[0.4em]">Awaiting Intel Synthesis</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ResearchHub;
