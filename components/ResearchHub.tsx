
'use client';

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
  const [showKeyPrompt, setShowKeyPrompt] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || isLoading) return;

    setIsLoading(true);
    setError(null);
    setShowKeyPrompt(false);

    try {
      const result = await askResearchQuestion(query, context);
      onAddResearch(query, result.text, result.urls);
      setQuery('');
    } catch (err: any) {
      // Handle authentication issues and 'Requested entity was not found' per guidelines
      if (
        err.message?.includes("API_KEY_MISSING") || 
        err.message?.includes("401") || 
        err.message?.includes("403") ||
        err.message?.includes("Requested entity was not found")
      ) {
        setError("AI Credentials Missing or Invalid.");
        setShowKeyPrompt(true);
      } else {
        setError(`Research failed: ${err.message}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenKeySelector = async () => {
    // Access window.aistudio helper as per guidelines
    // @ts-ignore
    if (window.aistudio?.openSelectKey) {
      // @ts-ignore
      await window.aistudio.openSelectKey();
      setError(null);
      setShowKeyPrompt(false);
      // Assume success and proceed as per guidelines race condition rule
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-10 animate-fade-in p-6">
      <div className="bg-stone-900 p-8 rounded-[2.5rem] shadow-2xl border-b-8 border-stone-950 paper-texture">
        <h2 className="text-stone-100 font-black text-[10px] uppercase tracking-[0.4em] mb-6 flex items-center gap-3">
          <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse"></span>
          Intelligence Terminal
        </h2>
        
        <form onSubmit={handleSearch} className="space-y-4">
          <textarea 
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Inquire with Gemini Search Grounding..."
            className="w-full bg-stone-800 border-2 border-stone-700 rounded-2xl p-6 text-white text-lg font-mono focus:ring-2 focus:ring-blue-500 outline-none transition-all resize-none h-40 shadow-inner placeholder:text-stone-600"
          />
          <button 
            type="submit" 
            disabled={!query.trim() || isLoading}
            className="w-full py-5 bg-white text-stone-900 rounded-xl font-black text-[10px] uppercase tracking-[0.3em] hover:bg-stone-100 transition-all flex items-center justify-center gap-3 disabled:opacity-20 shadow-lg"
          >
            {isLoading ? "Consulting Engine..." : "Execute Inquiry"}
          </button>
        </form>
        
        {error && (
          <div className="mt-4 p-4 bg-red-900/30 border border-red-500/30 rounded-xl text-red-200 text-[10px] font-black uppercase text-center flex flex-col gap-3">
            <span>{error}</span>
            {showKeyPrompt && (
              <div className="flex flex-col gap-3">
                <button onClick={handleOpenKeySelector} className="mx-auto px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-400 transition-all font-bold">
                  Select Project Key
                </button>
                <a 
                  href="https://ai.google.dev/gemini-api/docs/billing" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-[9px] text-blue-300 underline font-mono"
                >
                  Project Billing Documentation
                </a>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pb-24">
        {notes.map(note => (
          <div key={note.id} className="bg-white p-8 rounded-[2rem] shadow-xl border border-stone-100 flex flex-col group hover:border-blue-200 transition-all">
            <h3 className="text-stone-900 font-black text-xs uppercase tracking-tight mb-4 leading-tight italic">
              " {note.question} "
            </h3>
            
            <div className="flex-1 text-stone-600 text-xs leading-relaxed prose-sm prose-stone mb-6 overflow-y-auto max-h-[250px] no-scrollbar">
              <div dangerouslySetInnerHTML={{ __html: marked.parse(note.content) }} />
            </div>

            {note.metadata?.urls && note.metadata.urls.length > 0 && (
              <div className="mb-6 pt-4 border-t border-stone-50">
                <p className="text-[8px] font-black text-stone-300 uppercase mb-2 tracking-widest">Sources Found</p>
                <div className="flex flex-wrap gap-2">
                  {note.metadata.urls.map((url, i) => (
                    <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="text-[9px] text-blue-500 hover:underline font-mono truncate max-w-[150px]">
                      {new URL(url).hostname}
                    </a>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-auto pt-4 flex justify-between items-center">
              <button onClick={() => onPin(note)} className="text-[10px] font-black text-stone-400 uppercase tracking-widest hover:text-blue-500">Promote to Ledger</button>
              <button onClick={() => onDelete(note.id)} className="text-stone-200 hover:text-red-500 transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ResearchHub;
