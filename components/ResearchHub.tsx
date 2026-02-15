
import React, { useState, useMemo } from 'react';
import { ProjectNote } from '../types';
import { askResearchQuestion } from '../services/geminiService';

interface ResearchHubProps {
  notes: ProjectNote[];
  context: string;
  onAddResearch: (question: string, answer: string, urls: string[]) => void;
  onDeleteNote: (id: string) => void;
}

const READ_MORE_THRESHOLD = 300;

const ResearchHub: React.FC<ResearchHubProps> = ({ notes, context, onAddResearch, onDeleteNote }) => {
  const [question, setQuestion] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedNotes, setExpandedNotes] = useState<Record<string, boolean>>({});

  const handleAsk = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim() || isLoading) return;

    setIsLoading(true);
    setError(null);
    try {
      const { text, urls } = await askResearchQuestion(question, context);
      onAddResearch(question, text, urls);
      setQuestion('');
    } catch (err: any) {
      setError("AI Service connection failed. Ensure API_KEY environment variable is defined.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredNotes = useMemo(() => {
    if (!searchQuery.trim()) return notes;
    const query = searchQuery.toLowerCase();
    return notes.filter(note => 
      note.question?.toLowerCase().includes(query) || 
      note.content.toLowerCase().includes(query)
    );
  }, [notes, searchQuery]);

  const toggleExpand = (id: string) => {
    setExpandedNotes(prev => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="bg-white rounded-2xl p-6 md:p-8 shadow-xl border border-stone-200 paper-texture">
        <h2 className="text-xl md:text-2xl font-black flex items-center gap-3 mb-6 uppercase tracking-tighter text-stone-800">
          <span className="text-blue-500">🔍</span> Research Assistant
        </h2>
        
        <p className="text-stone-500 text-sm mb-6 font-mono leading-relaxed">
          The research tool verifies facts across the live web using your project notes as grounding context.
        </p>
        
        <form onSubmit={handleAsk} className="flex flex-col gap-4">
          <textarea 
            value={question} 
            onChange={(e) => setQuestion(e.target.value)} 
            placeholder="WHAT SPECIFIC CONCEPT DO YOU NEED TO VERIFY?" 
            className="w-full p-5 rounded-xl border border-stone-200 focus:ring-2 focus:ring-stone-800 focus:border-transparent transition-all min-h-[120px] resize-none text-base text-stone-800 font-mono uppercase placeholder:text-stone-300" 
          />
          <div className="flex justify-end">
            <button type="submit" disabled={!question.trim() || isLoading} className="w-full md:w-auto px-8 py-4 bg-stone-900 text-white rounded-xl font-bold font-mono uppercase text-xs hover:bg-black transition-all flex items-center justify-center gap-3 disabled:opacity-50 shadow-lg active:scale-95">
              {isLoading ? (
                <>
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                  <span>Querying Web...</span>
                </>
              ) : "Execute Research"}
            </button>
          </div>
          {error && <p className="text-red-500 text-[10px] font-mono uppercase font-bold text-center mt-2">{error}</p>}
        </form>
      </div>

      <div className="space-y-6">
        <div className="relative">
          <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Filter findings..." className="w-full pl-5 pr-5 py-3.5 bg-white border border-stone-200 rounded-xl focus:ring-2 focus:ring-stone-400 outline-none text-sm font-mono transition-all shadow-sm" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredNotes.map((note) => {
            const isLong = note.content.length > READ_MORE_THRESHOLD;
            const isExpanded = expandedNotes[note.id];
            const displayContent = isLong && !isExpanded ? note.content.slice(0, READ_MORE_THRESHOLD) + "..." : note.content;
            return (
              <div key={note.id} className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden flex flex-col group hover:shadow-md transition-shadow">
                <div className="p-4 border-b border-stone-100 bg-stone-50 flex justify-between items-start">
                  <h3 className="font-bold text-stone-800 flex-1 line-clamp-1 text-xs font-mono uppercase tracking-tight">{note.question}</h3>
                  <button onClick={() => onDeleteNote(note.id)} className="text-stone-300 hover:text-red-500 transition-colors ml-2 p-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                  </button>
                </div>
                <div className="p-5 flex-1">
                  <p className="text-stone-600 text-sm leading-relaxed mb-4 whitespace-pre-wrap font-sans">{displayContent}</p>
                  {isLong && (
                    <button onClick={() => toggleExpand(note.id)} className="text-[10px] font-bold text-blue-600 uppercase mb-4 hover:underline">
                      {isExpanded ? 'Show Less' : 'Read Full Discovery'}
                    </button>
                  )}
                  {note.metadata?.urls && note.metadata.urls.length > 0 && (
                    <div className="space-y-2 mt-4 pt-4 border-t border-stone-100">
                      <p className="text-[10px] uppercase font-black text-stone-400 tracking-[0.2em]">Verified Sources</p>
                      <div className="flex flex-col gap-1.5">
                        {note.metadata.urls.slice(0, 3).map((url, i) => (
                          <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="text-[10px] text-blue-600 hover:text-blue-800 truncate font-mono">
                            {url.replace('https://', '').replace('www.', '')}
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ResearchHub;
