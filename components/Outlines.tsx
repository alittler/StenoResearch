
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
  manualApiKey?: string;
}

const Outlines: React.FC<OutlinesProps> = ({ 
  notepadNotes, 
  researchNotes, 
  existingOutlines, 
  onSaveOutline,
  onDeleteOutline,
  manualApiKey
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
        researchNotes.map(n => `Research Discovery: ${n.question}\n${n.content}`),
        manualApiKey
      );
      onSaveOutline(text);
      setActiveOutlineId(null); 
    } catch (err: any) {
      if (err.message === "API_KEY_MISSING") {
        setError("AI Credentials Missing. Set your key in System Settings.");
      } else {
        setError(`Synthesis failed: ${err.message || 'Verify connection'}`);
      }
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
    <div className="space-y-6 md:space-y-8 animate-fade-in pb-20">
      <div className="bg-stone-900 text-stone-100 rounded-[2.5rem] p-10 shadow-2xl relative overflow-hidden border-b-[8px] border-stone-800 paper-texture">
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="space-y-2 text-center md:text-left">
            <h2 className="text-3xl md:text-5xl font-black tracking-tighter font-mono uppercase">Briefing Studio</h2>
            <p className="text-stone-400 text-[10px] md:text-xs font-mono italic leading-tight uppercase tracking-widest">
              Synthesizing all ledger records into a cohesive intelligence brief via Gemini 3 Pro.
            </p>
          </div>
          
          <button
            onClick={handleWeave}
            disabled={isLoading}
            className="w-full md:w-auto bg-white text-stone-900 px-10 py-5 rounded-2xl font-black font-mono text-xs uppercase hover:bg-stone-50 transition-all disabled:opacity-20 active:scale-95 flex items-center justify-center gap-3 shadow-xl"
          >
            {isLoading ? "Executing Synthesis..." : "Execute Weave"}
          </button>
        </div>
        {error && <p className="mt-4 text-red-400 text-[10px] font-mono text-center uppercase font-black animate-pulse">{error}</p>}
      </div>

      <div className="flex flex-col lg:grid lg:grid-cols-4 gap-8">
        <div className="lg:col-span-1 space-y-4">
          <h3 className="text-[10px] font-black text-stone-400 uppercase tracking-[0.2em] px-2">Draft History</h3>
          <div className="flex flex-row lg:flex-col gap-4 overflow-x-auto lg:overflow-y-auto no-scrollbar pb-2 lg:pb-0 lg:max-h-[700px]">
            {existingOutlines.length === 0 ? (
              <div className="p-8 bg-white rounded-[2rem] border-4 border-dashed border-stone-100 text-center w-full shrink-0">
                <p className="text-[10px] text-stone-300 font-mono italic uppercase font-black">No drafts woven.</p>
              </div>
            ) : (
              existingOutlines.map((o, idx) => (
                <div 
                  key={o.id}
                  onClick={() => setActiveOutlineId(o.id)}
                  className={`group p-6 rounded-2xl border-2 transition-all cursor-pointer relative shrink-0 w-56 lg:w-full ${
                    (activeOutlineId === o.id || (!activeOutlineId && idx === 0))
                      ? 'bg-white border-stone-900 shadow-xl ring-2 ring-stone-900 scale-[1.02]' 
                      : 'bg-stone-50 border-stone-200 hover:bg-white hover:border-stone-400'
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-[10px] font-black text-stone-400 font-mono uppercase tracking-tighter">V.{existingOutlines.length - idx}</span>
                    <button onClick={(e) => { e.stopPropagation(); onDeleteOutline(o.id); }} className="p-1 text-stone-200 hover:text-red-500 transition-colors">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12"></path></svg>
                    </button>
                  </div>
                  <p className="text-[11px] font-mono text-stone-600 line-clamp-2 leading-tight uppercase font-bold">{o.content.split('\n')[0].replace(/#|/g, '').substring(0, 50)}</p>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="lg:col-span-3">
          {activeOutline ? (
            <div className="bg-white rounded-[3rem] p-10 md:p-16 shadow-2xl border border-stone-200 relative animate-fade-in paper-texture min-h-[600px]">
              <div className="flex justify-between items-center mb-12 pb-8 border-b-2 border-stone-50">
                <div>
                   <h3 className="text-xl md:text-3xl font-black text-stone-800 font-mono uppercase tracking-tighter">Draft Synthesis Review</h3>
                   <span className="text-[10px] font-black text-stone-400 uppercase tracking-[0.3em]">Temporal Priority Resolution Active</span>
                </div>
                <button onClick={() => navigator.clipboard.writeText(activeOutline.content)} className="p-4 bg-stone-50 border border-stone-100 rounded-2xl text-stone-400 hover:text-stone-900 transition-all shadow-sm">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"></path></svg>
                </button>
              </div>

              <div className="prose-steno max-w-none text-stone-700">
                {typeof renderedMarkdown === 'string' ? (
                  <div dangerouslySetInnerHTML={{ __html: renderedMarkdown }} />
                ) : (
                  <div className="whitespace-pre-wrap font-mono text-stone-700 leading-relaxed text-lg italic">
                    {activeOutline.content}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-stone-50 rounded-[3rem] border-4 border-dashed border-stone-200 min-h-[500px] flex flex-col items-center justify-center py-20 text-center p-8 shadow-inner">
              <div className="text-8xl mb-8 opacity-20 grayscale">🧶</div>
              <h3 className="text-2xl font-black font-mono text-stone-300 uppercase tracking-[0.4em]">Briefing Workspace</h3>
              <p className="text-xs font-mono text-stone-400 mt-6 max-w-xs italic uppercase font-black leading-relaxed">
                Execute a weave to synchronize ledger data into a coherent Project Structure.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Outlines;
