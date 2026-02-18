
import React, { useState, useEffect } from 'react';
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
  const [error, setError] = useState<React.ReactNode | null>(null);
  const [tempKey, setTempKey] = useState(manualApiKey);
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    if (!manualApiKey && (!process.env.API_KEY || process.env.API_KEY === 'undefined')) {
      setShowSettings(true);
    }
  }, [manualApiKey]);

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
      console.error("Research Hub Caught Error:", err);
      
      const detailedMessage = err.message || "";
      
      if (detailedMessage === "API_KEY_MISSING") {
        setError("AI Credentials Missing. Provide a key in Settings to begin.");
        setShowSettings(true);
      } else if (detailedMessage.includes("429") || detailedMessage.includes("RESOURCE_EXHAUSTED")) {
        setError(
          <div className="space-y-2">
            <p className="font-bold">Quota Exceeded (429)</p>
            <p className="text-[9px] leading-relaxed">Your project has reached its free-tier rate limit. To remove this limit, upgrade to a paid plan in the Google Cloud Console.</p>
            <a 
              href="https://ai.google.dev/gemini-api/docs/billing" 
              target="_blank" 
              className="inline-block text-blue-400 underline font-black text-[9px] uppercase tracking-widest mt-2"
            >
              Billing Documentation »
            </a>
          </div>
        );
        setShowSettings(true);
      } else {
        setError(`Connection Failed: ${detailedMessage.substring(0, 100)}...`);
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
        <h2 className="text-stone-100 font-black text-xs uppercase tracking-[0.4em] mb-6 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse"></span>
            Intelligence Scans
          </div>
          <button 
            onClick={() => setShowSettings(!showSettings)}
            className={`text-[10px] font-bold uppercase tracking-widest transition-colors ${showSettings ? 'text-blue-400' : 'text-stone-500 hover:text-stone-300'}`}
          >
            {showSettings ? 'System Settings' : 'Settings'}
          </button>
        </h2>
        
        <form onSubmit={handleSearch} className="space-y-4">
          <textarea 
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search recent research or analyze project data..."
            className="w-full bg-stone-800 border-2 border-stone-700 rounded-xl p-6 text-white text-lg font-mono focus:border-blue-500 outline-none transition-all resize-none h-40 shadow-inner placeholder:text-stone-600"
          />
          <button 
            type="submit" 
            disabled={!query.trim() || isLoading}
            className="w-full py-5 bg-white text-stone-900 rounded-xl font-black text-xs uppercase tracking-[0.3em] hover:bg-stone-100 transition-all flex items-center justify-center gap-3 disabled:opacity-20 shadow-lg active:scale-[0.98]"
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-4 w-4 text-stone-900" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                Processing...
              </span>
            ) : "Begin Intelligence Scan"}
          </button>
        </form>
        
        {(error || showSettings) && (
          <div className="mt-8 p-6 bg-stone-800/30 border-2 border-stone-800 rounded-2xl space-y-6 animate-fade-in">
            {error && (
              <div className="p-4 bg-red-900/20 border border-red-900/50 rounded-lg">
                <div className="text-red-400 text-[10px] font-black uppercase tracking-wider text-center">
                  {error}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <p className="text-[10px] font-black text-stone-500 uppercase tracking-widest">Manual API Configuration</p>
                  <button 
                    onClick={onRequestKey}
                    className="text-[10px] font-black text-blue-500 uppercase tracking-widest hover:underline"
                  >
                    Use Browser Keychain
                  </button>
                </div>
                
                <div className="flex flex-col gap-3">
                  <input 
                    type="password"
                    value={tempKey}
                    onChange={(e) => setTempKey(e.target.value)}
                    placeholder="Paste Gemini API Key..."
                    className="w-full bg-stone-950 border border-stone-700 rounded-xl px-4 py-3 text-white font-mono text-xs focus:border-blue-500 outline-none placeholder:text-stone-700 shadow-inner"
                  />
                  <button 
                    onClick={handleUpdateKey}
                    className="w-full py-3 bg-stone-100 text-stone-900 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-white transition-all active:scale-95 whitespace-nowrap"
                  >
                    Save & Apply
                  </button>
                </div>
              </div>

              <div className="space-y-4 border-l border-stone-800 pl-8 hidden md:block">
                <p className="text-[10px] font-black text-stone-500 uppercase tracking-widest">System Specifications</p>
                <div className="space-y-3 font-mono text-[9px] uppercase">
                   <div className="flex justify-between">
                     <span className="text-stone-600">Primary Core</span>
                     <span className="text-stone-400">Gemini 3 Pro Preview</span>
                   </div>
                   <div className="flex justify-between">
                     <span className="text-stone-600">Visual Core</span>
                     <span className="text-stone-400">Gemini 2.5 Flash Image</span>
                   </div>
                   <div className="flex justify-between">
                     <span className="text-stone-600">Search Layer</span>
                     <span className="text-stone-400">Google Grounding V1</span>
                   </div>
                </div>
                <p className="text-[8px] text-stone-600 italic leading-relaxed pt-2">
                  Pro-tier models provide enhanced reasoning but consume higher API quota. 
                  Switch to a paid plan to remove 429 limits.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pb-24">
        {notes.map(note => (
          <div key={note.id} className="bg-white p-8 rounded-[2rem] shadow-xl border border-stone-100 flex flex-col group relative hover:border-blue-100 transition-all">
            <div className="flex justify-between items-start mb-6">
              <span className="text-[10px] font-black bg-blue-50 text-blue-600 px-3 py-1 rounded-full uppercase tracking-widest">Research Data</span>
              <button onClick={() => onDelete(note.id)} className="text-stone-200 hover:text-red-500 transition-all opacity-0 group-hover:opacity-100">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            </div>
            
            <h3 className="text-stone-900 font-black text-base uppercase tracking-tight mb-4 leading-tight">
              {note.question}
            </h3>
            
            <div className="flex-1 text-stone-600 text-sm leading-relaxed prose-sm prose-stone mb-8 max-h-[300px] overflow-y-auto no-scrollbar">
              <div dangerouslySetInnerHTML={{ __html: marked.parse(note.content) }} />
            </div>

            <div className="mt-auto pt-6 border-t border-stone-100 flex items-center justify-between">
              <button 
                onClick={() => onPin(note)}
                className="text-[10px] font-black text-blue-600 uppercase tracking-widest hover:bg-blue-50 px-4 py-2 rounded-lg transition-all"
              >
                Pin to Project Ledger
              </button>
              {note.metadata?.urls && note.metadata.urls.length > 0 && (
                <div className="flex gap-2">
                  <span className="text-[9px] font-bold text-stone-300 uppercase tracking-widest">{note.metadata.urls.length} Intelligence Sources</span>
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
