
import React, { useState, useMemo } from 'react';
import { ProjectNote } from '../types';
import { weaveProjectOutline } from '../services/geminiService';
import { marked } from 'marked';

interface OutlinesProps {
  notepadNotes: ProjectNote[];
  researchNotes: ProjectNote[];
  existingOutlines: ProjectNote[];
  onSaveOutline: (content: string) => void;
  onDeleteOutline: (id: string) => void;
}

const Outlines: React.FC<OutlinesProps> = ({ 
  notepadNotes, 
  researchNotes, 
  existingOutlines, 
  onSaveOutline,
  onDeleteOutline
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeOutlineId, setActiveOutlineId] = useState<string | null>(
    existingOutlines.length > 0 ? existingOutlines[0].id : null
  );

  const handleWeave = async () => {
    if (notepadNotes.length === 0 && researchNotes.length === 0) {
      alert("PLEASE ADD PROJECT DATA BEFORE SYNTHESIS.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const { text } = await weaveProjectOutline(
        notepadNotes.map(n => ({ content: n.content, timestamp: n.timestamp })),
        researchNotes.map(n => `Research Discovery: ${n.question}\n${n.content}`)
      );
      onSaveOutline(text);
      setActiveOutlineId(null); 
    } catch (err: any) {
      setError("Synthesis failed. Ensure API_KEY environment variable is configured correctly.");
    } finally {
      setIsLoading(false);
    }
  };

  const activeOutline = existingOutlines.find(o => o.id === activeOutlineId) || existingOutlines[0];

  const renderedMarkdown = useMemo(() => {
    if (!activeOutline) return null;
    return marked.parse(activeOutline.content);
  }, [activeOutline]);

  return (
    <div className="space-y-6 md:space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="bg-stone-900 text-stone-100 rounded-3xl p-8 md:p-10 shadow-2xl relative overflow-hidden border-b-[6px] border-stone-800 paper-texture">
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="space-y-2 text-center md:text-left">
            <h2 className="text-2xl md:text-4xl font-black tracking-tighter font-mono uppercase">Briefing Studio</h2>
            <p className="text-stone-400 text-[10px] md:text-sm font-mono italic leading-tight uppercase tracking-widest">
              Synthesizing all ledger records into a cohesive project brief.
            </p>
          </div>
          
          <button
            onClick={handleWeave}
            disabled={isLoading}
            className="w-full md:w-auto bg-stone-100 text-stone-900 px-8 py-4 rounded-xl font-bold font-mono text-xs uppercase hover:bg-white transition-all disabled:opacity-50 active:scale-95 flex items-center justify-center gap-3 shadow-lg"
          >
            {isLoading ? "Synthesizing Brief..." : "Execute Weave"}
          </button>
        </div>
        {error && <p className="mt-4 text-red-400 text-[10px] font-mono text-center uppercase font-black">{error}</p>}
      </div>

      <div className="flex flex-col lg:grid lg:grid-cols-4 gap-8">
        <div className="lg:col-span-1 space-y-4">
          <h3 className="text-[10px] font-black text-stone-400 uppercase tracking-[0.2em] px-2">Draft History</h3>
          <div className="flex flex-row lg:flex-col gap-3 overflow-x-auto lg:overflow-y-auto no-scrollbar pb-2 lg:pb-0 lg:max-h-[600px]">
            {existingOutlines.length === 0 ? (
              <div className="p-6 bg-white rounded-xl border-2 border-dashed border-stone-200 text-center w-full shrink-0">
                <p className="text-[10px] text-stone-300 font-mono italic uppercase font-bold">No active drafts.</p>
              </div>
            ) : (
              existingOutlines.map((o, idx) => (
                <div 
                  key={o.id}
                  onClick={() => setActiveOutlineId(o.id)}
                  className={`group p-4 rounded-xl border-2 transition-all cursor-pointer relative shrink-0 w-48 lg:w-full ${
                    (activeOutlineId === o.id || (!activeOutlineId && idx === 0))
                      ? 'bg-white border-stone-800 shadow-md ring-1 ring-stone-100' 
                      : 'bg-stone-50 border-stone-100 hover:bg-white hover:border-stone-300'
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-[10px] font-black text-stone-400 font-mono uppercase tracking-tighter">VERSION {existingOutlines.length - idx}</span>
                    <button onClick={(e) => { e.stopPropagation(); onDeleteOutline(o.id); }} className="p-1 text-red-200 hover:text-red-500">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12"></path></svg>
                    </button>
                  </div>
                  <p className="text-[11px] font-mono text-stone-600 line-clamp-2 leading-tight">{o.content.slice(0, 60)}...</p>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="lg:col-span-3">
          {activeOutline ? (
            <div className="bg-white rounded-3xl p-8 md:p-14 shadow-xl border border-stone-200 relative animate-in fade-in duration-300 paper-texture">
              <div className="flex justify-between items-center mb-10 pb-6 border-b-2 border-stone-100">
                <h3 className="text-xl md:text-3xl font-black text-stone-800 font-mono uppercase tracking-tighter">Draft Review</h3>
                <button onClick={() => navigator.clipboard.writeText(activeOutline.content)} className="p-3 bg-stone-50 border border-stone-200 rounded-xl text-stone-400 hover:text-stone-800 transition-colors shadow-sm">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"></path></svg>
                </button>
              </div>

              <div className="prose-custom max-w-none">
                {typeof renderedMarkdown === 'string' ? (
                  <div dangerouslySetInnerHTML={{ __html: renderedMarkdown }} />
                ) : (
                  <div className="whitespace-pre-wrap font-mono text-stone-700 leading-relaxed text-lg">
                    {activeOutline.content}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-stone-50 rounded-3xl border-4 border-dashed border-stone-200 min-h-[400px] flex flex-col items-center justify-center py-20 text-center p-8 shadow-inner">
              <div className="text-6xl mb-6 opacity-20 grayscale">📑</div>
              <h3 className="text-xl font-black font-mono text-stone-300 uppercase tracking-[0.3em]">Brief Workspace</h3>
              <p className="text-xs font-mono text-stone-400 mt-4 max-w-xs italic uppercase font-bold leading-relaxed">
                Connect your thoughts. Gather research discoveries. Then execute the synthesis.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Outlines;
