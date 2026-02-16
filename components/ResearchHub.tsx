
import React, { useState, useMemo, useRef } from 'react';
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
  
  // Note: AbortController is for simulating the stop of a long-running AI task UI-side
  const abortControllerRef = useRef<AbortController | null>(null);

  const handleAsk = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim() || isLoading) return;

    setIsLoading(true);
    setError(null);
    abortControllerRef.current = new AbortController();

    try {
      const { text, urls } = await askResearchQuestion(question, context);
      
      // If the controller hasn't been aborted, add the note
      if (!abortControllerRef.current?.signal.aborted) {
        onAddResearch(question, text, urls);
        setQuestion('');
      }
    } catch (err: any) {
      if (err.name === 'AbortError') {
        console.log('Research operation aborted by user.');
      } else {
        setError("Scanning failed. Verify your connection or API configuration.");
        console.error(err);
      }
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  };

  const handleStop = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsLoading(false);
      setError("Research operation halted.");
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
      {/* Research Dock */}
      <div className="bg-stone-800 rounded-3xl p-6 md:p-10 shadow-2xl border-b-[8px] border-stone-900 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
          <svg className="w-24 h-24" fill="currentColor" viewBox="0 0 24 24"><path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/></svg>
        </div>
        
        <h2 className="text-xl md:text-2xl font-black font-mono text-stone-100 uppercase tracking-tighter mb-6 flex items-center gap-3">
          Field Intelligence
        </h2>
        
        <form onSubmit={handleAsk} className="flex flex-col gap-5 relative z-10">
          <textarea 
            value={question} 
            onChange={(e) => setQuestion(e.target.value)} 
            placeholder="ENTER RESEARCH PARAMETERS..." 
            className="w-full p-6 rounded-2xl bg-stone-900 border-2 border-stone-700 text-stone-100 font-mono uppercase placeholder:text-stone-600 focus:border-stone-500 outline-none transition-all min-h-[140px] resize-none text-base" 
          />
          <div className="flex justify-end gap-3">
            {isLoading && (
              <button 
                type="button"
                onClick={handleStop}
                className="px-6 py-5 bg-red-600/20 text-red-400 border border-red-500/30 rounded-xl font-black font-mono uppercase text-xs hover:bg-red-600 hover:text-white transition-all shadow-xl active:scale-95"
              >
                Stop Scan
              </button>
            )}
            <button 
              type="submit" 
              disabled={!question.trim() || isLoading} 
              className="px-10 py-5 bg-stone-100 text-stone-900 rounded-xl font-black font-mono uppercase text-xs hover:bg-white transition-all flex items-center justify-center gap-3 disabled:opacity-50 shadow-xl active:scale-95"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                  <span>Scanning Records...</span>
                </>
              ) : "Cross-Reference Web"}
            </button>
          </div>
          {error && <p className="text-red-400 text-[10px] font-mono uppercase font-black text-center">{error}</p>}
        </form>
      </div>

      {/* Results Clipping Board */}
      <div className="space-y-6">
        <div className="relative">
          <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="SEARCH ARCHIVE..." className="w-full pl-6 pr-6 py-4 bg-stone-800 border-2 border-stone-700 rounded-2xl text-stone-100 font-mono text-xs uppercase placeholder:text-stone-600 outline-none focus:border-stone-500 shadow-inner" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {filteredNotes.map((note) => {
            const isLong = note.content.length > READ_MORE_THRESHOLD;
            const isExpanded = expandedNotes[note.id];
            const displayContent = isLong && !isExpanded ? note.content.slice(0, READ_MORE_THRESHOLD) + "..." : note.content;
            return (
              <div key={note.id} className="group relative bg-[#fffef0] rounded-lg shadow-2xl overflow-hidden flex flex-col paper-texture border-b-4 border-stone-300 transform transition-all hover:translate-y-[-4px]">
                <div className="p-5 border-b border-stone-200/50 bg-stone-100/50 flex justify-between items-start">
                  <h3 className="font-black text-stone-800 text-[10px] font-mono uppercase tracking-widest flex-1">{note.question}</h3>
                  <button onClick={() => onDeleteNote(note.id)} className="text-stone-300 hover:text-red-500 transition-colors ml-4 p-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                  </button>
                </div>
                <div className="p-6 flex-1 relative">
                  <div className="absolute left-4 top-0 bottom-0 w-[1px] bg-red-100 pointer-events-none"></div>
                  <p className="text-stone-700 text-sm leading-relaxed mb-6 whitespace-pre-wrap font-sans pl-4">{displayContent}</p>
                  {isLong && (
                    <button onClick={() => toggleExpand(note.id)} className="text-[10px] font-black text-blue-600 uppercase mb-6 hover:underline pl-4">
                      {isExpanded ? 'Compress Finding' : 'Read Full Report'}
                    </button>
                  )}
                  {note.metadata?.urls && note.metadata.urls.length > 0 && (
                    <div className="space-y-3 mt-6 pt-6 border-t border-stone-200/50 pl-4">
                      <p className="text-[9px] uppercase font-black text-stone-400 tracking-[0.2em]">Verified Sources</p>
                      <div className="flex flex-col gap-2">
                        {note.metadata.urls.slice(0, 3).map((url, i) => (
                          <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="text-[10px] text-blue-600 hover:text-blue-800 truncate font-mono">
                            {url.replace('https://', '').replace('www.', '')}
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                {/* Visual binder hole decoration */}
                <div className="absolute top-1/2 left-2 -translate-y-1/2 w-3 h-3 rounded-full bg-stone-800/10 border border-stone-800/20"></div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ResearchHub;
