
import React, { useState, useMemo, useRef } from 'react';
import { ProjectNote } from '../types';
import { askResearchQuestion, summarizePrompt } from '../services/geminiService';
import { marked } from 'marked';

interface ResearchHubProps {
  notes: ProjectNote[];
  context: string;
  onAddResearch: (question: string, answer: string, urls: string[]) => void;
  onDeleteNote: (id: string) => void;
  onPinNote: (note: ProjectNote) => void;
}

const READ_MORE_THRESHOLD = 500;

const ResearchHub: React.FC<ResearchHubProps> = ({ notes, context, onAddResearch, onDeleteNote, onPinNote }) => {
  const [question, setQuestion] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedNotes, setExpandedNotes] = useState<Record<string, boolean>>({});
  const [attachedFile, setAttachedFile] = useState<{ name: string; data: string; type: string } | null>(null);
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const handleAsk = async (e?: React.FormEvent | React.KeyboardEvent) => {
    if (e) e.preventDefault();
    if (!question.trim() && !attachedFile) return;

    setIsLoading(true);
    setError(null);
    abortControllerRef.current = new AbortController();

    try {
      const rawPrompt = question || (attachedFile ? `Analyze intelligence source: ${attachedFile.name}` : '');
      
      const [researchResult, promptSummary] = await Promise.all([
        askResearchQuestion(
          rawPrompt, 
          context, 
          attachedFile?.type === 'image' ? attachedFile.data : undefined
        ),
        summarizePrompt(rawPrompt)
      ]);
      
      if (!abortControllerRef.current?.signal.aborted) {
        onAddResearch(promptSummary, researchResult.text, researchResult.urls);
        setQuestion('');
        setAttachedFile(null);
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

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleAsk();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    const isImage = file.type.startsWith('image/');

    reader.onload = (ev) => {
      const data = ev.target?.result as string;
      setAttachedFile({
        name: file.name,
        data: data,
        type: isImage ? 'image' : 'text'
      });
      if (!isImage && !question) {
        setQuestion(`Intelligence brief from file: ${file.name}`);
      }
    };

    if (isImage) {
      reader.readAsDataURL(file);
    } else {
      reader.readAsText(file);
    }
  };

  const handleStop = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsLoading(false);
      setError("Research operation halted.");
    }
  };

  const handleRevise = (q: string) => {
    setQuestion(q);
    if (textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.scrollIntoView({ behavior: 'smooth' });
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

  const renderMarkdown = (content: string) => {
    return { __html: marked.parse(content, { breaks: true, gfm: true }) };
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      {/* Search Bar - Strategic Top Placement */}
      <div className="relative group">
        <input 
          type="text" 
          value={searchQuery} 
          onChange={(e) => setSearchQuery(e.target.value)} 
          placeholder="FILTER INTELLIGENCE LOGS..." 
          className="w-full pl-12 pr-6 py-5 bg-white border-2 border-stone-200 rounded-2xl text-stone-800 font-mono text-xs uppercase placeholder:text-stone-400 outline-none focus:border-stone-800 shadow-xl transition-all" 
        />
        <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-300 group-focus-within:text-stone-800" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
      </div>

      <div className="bg-stone-800 rounded-3xl p-6 md:p-10 shadow-2xl border-b-[8px] border-stone-900 relative overflow-hidden">
        <h2 className="text-xl md:text-2xl font-black font-mono text-stone-100 uppercase tracking-tighter mb-6 flex items-center gap-3">
          Intelligence Gathering
        </h2>
        
        <form onSubmit={handleAsk} className="flex flex-col gap-5 relative z-10">
          <div className="relative">
            <textarea 
              ref={textareaRef}
              value={question} 
              onChange={(e) => setQuestion(e.target.value)} 
              onKeyDown={handleKeyDown}
              placeholder="ENTER RESEARCH PARAMETERS... (ENTER TO SCAN, SHIFT+ENTER FOR NEW LINE)" 
              className="w-full p-6 rounded-2xl bg-stone-900 border-2 border-stone-700 text-stone-100 font-mono uppercase placeholder:text-stone-600 focus:border-stone-500 outline-none transition-all min-h-[140px] resize-none text-base" 
            />
            {attachedFile && (
              <div className="absolute bottom-4 left-4 flex items-center gap-2 bg-stone-800 border border-stone-600 px-3 py-1.5 rounded-lg">
                <span className="text-xs text-stone-300 font-mono uppercase truncate max-w-[200px]">{attachedFile.name}</span>
                <button type="button" onClick={() => setAttachedFile(null)} className="text-stone-500 hover:text-red-400">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                </button>
              </div>
            )}
          </div>

          <div className="flex justify-between items-center">
            <button 
              type="button" 
              onClick={() => fileInputRef.current?.click()}
              className="p-3 bg-stone-700 text-stone-300 rounded-xl hover:bg-stone-600 transition-all"
              title="Attach File/Image"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"></path></svg>
            </button>
            <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileChange} />
            
            <div className="flex gap-3">
              {isLoading && (
                <button 
                  type="button"
                  onClick={handleStop}
                  className="px-6 py-5 bg-red-600/20 text-red-400 border border-red-500/30 rounded-xl font-black font-mono uppercase text-xs hover:bg-red-600 hover:text-white transition-all shadow-xl"
                >
                  Stop Scan
                </button>
              )}
              <button 
                type="submit" 
                disabled={(!question.trim() && !attachedFile) || isLoading} 
                className="px-10 py-5 bg-stone-100 text-stone-900 rounded-xl font-black font-mono uppercase text-xs hover:bg-white transition-all flex items-center justify-center gap-3 disabled:opacity-50 shadow-xl active:scale-95"
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                    <span>Gathering Data...</span>
                  </>
                ) : "Execute Intel Scan"}
              </button>
            </div>
          </div>
          {error && <p className="text-red-400 text-[10px] font-mono uppercase font-black text-center">{error}</p>}
        </form>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {filteredNotes.map((note) => {
          const isLong = note.content.length > READ_MORE_THRESHOLD;
          const isExpanded = expandedNotes[note.id];
          const displayContent = isLong && !isExpanded ? note.content.slice(0, READ_MORE_THRESHOLD) : note.content;
          
          return (
            <div key={note.id} className="group relative bg-[#fffef0] rounded-lg shadow-xl overflow-hidden flex flex-col paper-texture border-b-4 border-stone-300 transform transition-all hover:translate-y-[-2px]">
              <div className="p-4 border-b border-stone-200/50 bg-stone-100/50 flex justify-between items-center">
                <h3 className="font-black text-stone-800 text-[10px] font-mono uppercase tracking-widest flex-1 pr-4 truncate">
                  {note.question}
                </h3>
                <button onClick={() => onDeleteNote(note.id)} className="text-stone-300 hover:text-red-500 transition-colors">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                </button>
              </div>

              <div className="p-6 flex-1 relative min-h-[160px]">
                <div className="absolute left-4 top-0 bottom-0 w-[1px] bg-red-100 pointer-events-none"></div>
                
                <div 
                  className="text-stone-700 text-sm leading-relaxed mb-6 pl-6 prose prose-stone max-w-none prose-sm"
                  dangerouslySetInnerHTML={renderMarkdown(displayContent)}
                />

                {isLong && (
                  <button 
                    onClick={() => toggleExpand(note.id)}
                    className="ml-6 mb-4 text-[10px] font-black uppercase text-blue-600 hover:underline"
                  >
                    {isExpanded ? "Show Less" : "Read Full Intel..."}
                  </button>
                )}
                
                {/* Action Icons Bar */}
                <div className="flex items-center gap-1 pl-6 pt-4 border-t border-stone-100 mt-auto">
                  <button 
                    onClick={() => handleRevise(note.question || '')}
                    title="Revise Parameters"
                    className="p-2 text-stone-400 hover:text-stone-900 transition-all rounded-lg hover:bg-stone-100"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                    </svg>
                  </button>

                  <button 
                    onClick={() => onPinNote(note)}
                    title="Pin to Project Pad"
                    className="p-2 text-stone-400 hover:text-emerald-600 transition-all rounded-lg hover:bg-stone-100"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"></path>
                    </svg>
                  </button>
                </div>

                {note.metadata?.urls && note.metadata.urls.length > 0 && isExpanded && (
                  <div className="space-y-2 mt-6 pt-4 border-t border-stone-100 pl-6 animate-in slide-in-from-top-2">
                    <p className="text-[8px] uppercase font-black text-stone-400 tracking-widest">Sources</p>
                    {note.metadata.urls.map((url, i) => (
                      <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="block text-[10px] text-blue-500 truncate hover:underline font-mono">
                        {url}
                      </a>
                    ))}
                  </div>
                )}
              </div>
              <div className="absolute top-1/2 left-2 -translate-y-1/2 w-2 h-2 rounded-full bg-stone-800/10 border border-stone-800/20"></div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ResearchHub;
