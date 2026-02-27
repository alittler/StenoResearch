
'use client';

import React, { useState } from 'react';
import { chatWithNotebook } from '../services/geminiService';
import { Search, Sparkles, Pin, Link as LinkIcon, Loader2, BookOpen, Scissors, Trash2 } from 'lucide-react';
import Markdown from 'react-markdown';

interface ResearchHubProps {
  notes: any[];
  context: string;
  onAddResearch: (question: string, answer: string, urls: string[]) => void;
  onPin: (note: { content: string; question: string; metadata: any }) => void;
  onSendToArchitect: (content: string) => void;
  onDelete: (id: string) => void;
}

const ResearchHub: React.FC<ResearchHubProps> = ({ 
  notes, 
  context, 
  onAddResearch, 
  onPin,
  onSendToArchitect,
  onDelete
}) => {
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || isLoading) return;

    setIsLoading(true);
    try {
      const response = await chatWithNotebook(query, context, []);
      onAddResearch(query, response, []);
      setQuery('');
    } catch (error) {
      console.error(error);
      alert('Research failed. Please check your connection.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-20">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black uppercase tracking-tighter">Research Hub</h1>
          <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mt-1">Deep Intelligence & Grounded Insights</p>
        </div>
        <div className="flex items-center gap-2 bg-blue-50 px-3 py-1.5 rounded-full border border-blue-100">
          <Sparkles className="w-3 h-3 text-blue-500" />
          <span className="text-[9px] font-black text-blue-600 uppercase tracking-widest">AI Active</span>
        </div>
      </div>

      <div className="paper-texture shadow-xl border border-stone-200 rounded-2xl p-8 relative">
        <form onSubmit={handleSearch} className="relative">
          <input 
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ask a research question based on your ledger..."
            className="w-full bg-white/50 border-2 border-stone-100 rounded-2xl px-14 py-6 text-lg font-serif italic focus:border-blue-500 focus:bg-white outline-none transition-all shadow-inner"
          />
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 text-stone-300" />
          <button 
            type="submit"
            disabled={!query.trim() || isLoading}
            className="absolute right-4 top-1/2 -translate-y-1/2 bg-stone-900 text-white px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-stone-800 transition-all disabled:opacity-20 flex items-center gap-2"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            Analyze
          </button>
        </form>
      </div>

      <div className="grid grid-cols-1 gap-8">
        {notes.map((note, i) => (
          <div key={note.id} className="paper-texture shadow-md border border-stone-200 rounded-xl p-8 relative group animate-fade-in">
            <div className="flex items-start justify-between mb-6 border-b border-stone-100 pb-4">
              <div className="space-y-1">
                <span className="text-[9px] font-black text-blue-500 uppercase tracking-widest">Research Query</span>
                <h3 className="text-lg font-bold text-stone-800">{note.question || 'Untitled Research'}</h3>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => onSendToArchitect(note.content)}
                  className="flex items-center gap-2 bg-stone-50 text-stone-400 hover:text-purple-500 hover:bg-purple-50 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all border border-stone-100"
                >
                  <Scissors className="w-3 h-3" />
                  Architect
                </button>
                <button 
                  onClick={() => onPin(note)}
                  className="flex items-center gap-2 bg-stone-50 text-stone-400 hover:text-blue-500 hover:bg-blue-50 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all border border-stone-100"
                >
                  <Pin className="w-3 h-3" />
                  Pin
                </button>
                <button 
                  onClick={() => onDelete(note.id)}
                  className="p-1.5 text-stone-200 hover:text-red-500 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
            
            <div className="prose-steno">
              <Markdown>{note.content}</Markdown>
            </div>

            {note.metadata?.urls && note.metadata.urls.length > 0 && (
              <div className="mt-8 pt-6 border-t border-stone-100">
                <h4 className="text-[9px] font-black text-stone-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                  <BookOpen className="w-3 h-3" />
                  Grounded Sources
                </h4>
                <div className="flex flex-wrap gap-2">
                  {note.metadata.urls.map((url: string, idx: number) => (
                    <a 
                      key={idx}
                      href={url}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-2 bg-white border border-stone-200 px-3 py-1.5 rounded-lg text-[10px] font-bold text-stone-600 hover:border-blue-300 hover:text-blue-500 transition-all"
                    >
                      <LinkIcon className="w-3 h-3" />
                      {new URL(url).hostname}
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}

        {notes.length === 0 && (
          <div className="py-20 text-center space-y-4 opacity-20">
            <Search className="w-16 h-16 mx-auto" />
            <p className="text-xl font-bold italic font-serif">No research conducted yet...</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ResearchHub;
