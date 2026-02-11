
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
  const [copyStatus, setCopyStatus] = useState<string | null>(null);

  const handleAsk = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim() || isLoading) return;

    setIsLoading(true);
    setError(null);
    try {
      const { text, urls } = await askResearchQuestion(question, context);
      onAddResearch(question, text, urls);
      setQuestion('');
    } catch (err) {
      setError("Failed to fetch answer. Please try again.");
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

  const copyUrl = async (e: React.MouseEvent, url: string, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(url);
      setCopyStatus(id);
      setTimeout(() => setCopyStatus(null), 2000);
    } catch (err) {
      console.error('Failed to copy URL:', err);
    }
  };

  const exportToMarkdown = () => {
    if (notes.length === 0) return;
    let markdown = `# StenoResearch - Exported Research Hub\n\nGenerated on: ${new Date().toLocaleString()}\n\n---\n\n`;
    notes.forEach(note => {
      markdown += `## Question: ${note.question}\n\n${note.content}\n\n`;
      if (note.metadata?.urls && note.metadata.urls.length > 0) {
        markdown += `### Sources:\n`;
        note.metadata.urls.forEach(url => markdown += `- [${new URL(url).hostname}](${url})\n`);
      }
      markdown += `\n---\n\n`;
    });
    downloadFile(markdown, `research-export-${new Date().toISOString().split('T')[0]}.md`, 'text/markdown');
  };

  const exportToJSON = () => {
    if (notes.length === 0) return;
    downloadFile(JSON.stringify(notes, null, 2), `research-export-${new Date().toISOString().split('T')[0]}.json`, 'application/json');
  };

  const downloadFile = (content: string, fileName: string, contentType: string) => {
    const blob = new Blob([content], { type: contentType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-white rounded-2xl p-6 shadow-xl border border-stone-200">
        <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-4">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <span className="text-blue-500">🔍</span> Deep Research
          </h2>
          {notes.length > 0 && (
            <div className="flex gap-2 w-full sm:w-auto">
              <button onClick={exportToMarkdown} className="flex-1 sm:flex-none text-[10px] font-bold text-stone-500 hover:text-stone-800 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg border border-stone-200 hover:border-stone-300 transition-all bg-stone-50">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                Export MD
              </button>
              <button onClick={exportToJSON} className="flex-1 sm:flex-none text-[10px] font-bold text-stone-500 hover:text-stone-800 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg border border-stone-200 hover:border-stone-300 transition-all bg-stone-50">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
                Export JSON
              </button>
            </div>
          )}
        </div>
        <p className="text-stone-500 text-sm mb-6">Ask complex questions about your project. I'll use the context from your notes to provide detailed answers.</p>
        <form onSubmit={handleAsk} className="flex flex-col gap-4">
          <textarea value={question} onChange={(e) => setQuestion(e.target.value)} placeholder="e.g., What are the best materials for building a sustainable birdhouse?" className="w-full p-4 rounded-xl border border-stone-200 focus:ring-2 focus:ring-stone-800 focus:border-transparent transition-all min-h-[100px] resize-none text-stone-800" />
          <div className="flex justify-end">
            <button type="submit" disabled={!question.trim() || isLoading} className="px-6 py-3 bg-stone-800 text-white rounded-xl font-bold hover:bg-stone-700 transition-all flex items-center gap-2 disabled:opacity-50 shadow-lg active:scale-95">
              {isLoading ? <><svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> Thinking...</> : <>Ask Research Assistant</>}
            </button>
          </div>
          {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
        </form>
      </div>

      <div className="space-y-6">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-stone-400">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
          </div>
          <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search research cards..." className="w-full pl-10 pr-4 py-3 bg-white border border-stone-200 rounded-xl focus:ring-2 focus:ring-stone-400 focus:border-transparent outline-none text-sm transition-all shadow-sm" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredNotes.map((note) => {
            const isLong = note.content.length > READ_MORE_THRESHOLD;
            const isExpanded = expandedNotes[note.id];
            const displayContent = isLong && !isExpanded ? note.content.slice(0, READ_MORE_THRESHOLD) + "..." : note.content;
            return (
              <div key={note.id} className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden flex flex-col group hover:shadow-md transition-shadow">
                <div className="p-4 border-b border-stone-100 bg-stone-50 flex justify-between items-start">
                  <h3 className="font-bold text-stone-800 flex-1 line-clamp-1">{note.question}</h3>
                  <button onClick={() => onDeleteNote(note.id)} className="text-stone-300 hover:text-red-500 transition-colors ml-2 p-1 hover:bg-red-50 rounded">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                  </button>
                </div>
                <div className="p-5 flex-1">
                  <p className="text-stone-600 text-sm leading-relaxed mb-4 whitespace-pre-wrap transition-all">{displayContent}</p>
                  {isLong && (
                    <button onClick={() => toggleExpand(note.id)} className="text-xs font-bold text-blue-600 hover:text-blue-800 mb-6 flex items-center gap-1 group/btn">
                      {isExpanded ? 'Read less' : 'Read more'}
                      <svg className={`w-3 h-3 transition-transform ${isExpanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                    </button>
                  )}
                  {note.metadata?.urls && note.metadata.urls.length > 0 && (
                    <div className="space-y-3">
                      <p className="text-[10px] uppercase font-bold text-stone-400 tracking-wider flex items-center gap-1.5">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.828a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"></path></svg>
                        Verified Sources
                      </p>
                      <div className="flex flex-col gap-2">
                        {note.metadata.urls.slice(0, 5).map((url, i) => {
                          const hostname = new URL(url).hostname;
                          const uniqueId = `${note.id}-url-${i}`;
                          return (
                            <div key={i} className="group/link flex items-center bg-stone-50 hover:bg-blue-50/50 rounded-xl transition-all border border-stone-200/50 hover:border-blue-200/50 overflow-hidden">
                              <a href={url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-xs text-stone-700 hover:text-blue-700 p-2.5 flex-1 min-w-0">
                                <img src={`https://www.google.com/s2/favicons?domain=${hostname}&sz=32`} alt="" className="w-4 h-4 rounded-sm flex-shrink-0" onError={(e) => {
                                  e.currentTarget.style.display = 'none';
                                  const parent = e.currentTarget.parentElement;
                                  if (parent && !parent.querySelector('.fallback-icon')) {
                                    const fallback = document.createElement('span');
                                    fallback.className = 'fallback-icon w-4 h-4 text-stone-300';
                                    fallback.innerHTML = '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.828a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"></path></svg>';
                                    parent.prepend(fallback);
                                  }
                                }} />
                                <span className="truncate font-medium">{hostname}</span>
                              </a>
                              <button onClick={(e) => copyUrl(e, url, uniqueId)} className="p-2.5 text-stone-400 hover:text-blue-600 border-l border-stone-200/50 hover:bg-blue-100/30 transition-colors" title="Copy URL">
                                {copyStatus === uniqueId ? (
                                  <svg className="w-3.5 h-3.5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                                ) : (
                                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"></path></svg>
                                )}
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
                <div className="p-4 bg-stone-50 border-t border-stone-100 flex justify-between items-center text-[10px] text-stone-400 font-mono">
                  <span>CARD ID: {note.id.split('-')[0].toUpperCase()}</span>
                  <span>{new Date(note.timestamp).toLocaleDateString()}</span>
                </div>
              </div>
            );
          })}
        </div>
        {filteredNotes.length === 0 && (
          <div className="text-center py-20 bg-stone-200/20 rounded-3xl border-2 border-dashed border-stone-200">
            {searchQuery ? (
              <p className="text-stone-400 font-medium">No results found for "{searchQuery}"</p>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <div className="w-12 h-12 bg-stone-100 rounded-full flex items-center justify-center text-stone-300">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path></svg>
                </div>
                <p className="text-stone-400 font-medium">No research captured yet.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ResearchHub;
