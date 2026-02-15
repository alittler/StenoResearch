
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
  onResetKey: () => void;
}

const Outlines: React.FC<OutlinesProps> = ({ 
  notepadNotes, 
  researchNotes, 
  existingOutlines, 
  onSaveOutline,
  onDeleteOutline,
  onResetKey
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeOutlineId, setActiveOutlineId] = useState<string | null>(
    existingOutlines.length > 0 ? existingOutlines[0].id : null
  );

  const handleWeave = async () => {
    if (notepadNotes.length === 0 && researchNotes.length === 0) {
      alert("Add some notes or research before weaving!");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const { text } = await weaveProjectOutline(
        notepadNotes.map(n => ({ content: n.content, timestamp: n.timestamp })),
        researchNotes.map(n => `Factual Context: ${n.question}\nDetails: ${n.content}`)
      );
      onSaveOutline(text);
      setActiveOutlineId(null); 
    } catch (err: any) {
      if (err.message === 'KEY_RESET_REQUIRED') {
        onResetKey();
      } else {
        setError("The synthesis failed. Try adding more specific research details.");
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
    <div className="space-y-6 md:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      <div className="bg-stone-900 text-stone-100 rounded-2xl md:rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden border-b-[4px] md:border-b-[6px] border-stone-800">
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-4 md:gap-6">
          <div className="space-y-1 md:space-y-2 text-center md:text-left">
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight font-mono uppercase">Outline Studio</h2>
            <p className="text-stone-400 text-[10px] md:text-sm font-mono max-w-md italic leading-tight">
              Synthesizing entries for conflict resolution.
            </p>
          </div>
          
          <button
            onClick={handleWeave}
            disabled={isLoading}
            className="w-full md:w-auto group bg-stone-100 text-stone-900 px-6 md:px-8 py-3 md:py-4 rounded-xl font-bold hover:bg-white transition-all disabled:opacity-50 active:scale-95 flex items-center justify-center gap-3 shadow-lg"
          >
            {isLoading ? (
              <>
                <svg className="animate-spin h-4 w-4 md:h-5 md:w-5" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                <span className="font-mono text-xs md:text-sm">Synthesizing...</span>
              </>
            ) : (
              <>
                <span className="text-lg md:text-xl">🧶</span>
                <span className="font-mono text-xs md:text-sm uppercase tracking-wider">Begin Weave</span>
              </>
            )}
          </button>
        </div>
        {error && <p className="mt-4 text-red-400 text-[10px] md:text-xs italic font-mono text-center">{error}</p>}
      </div>

      <div className="flex flex-col lg:grid lg:grid-cols-4 gap-6 md:gap-8">
        <div className="lg:col-span-1 space-y-4">
          <h3 className="text-[10px] font-bold text-stone-400 uppercase tracking-widest px-2">Outline History</h3>
          <div className="flex flex-row lg:flex-col gap-2 overflow-x-auto lg:overflow-y-auto no-scrollbar pb-2 lg:pb-0 lg:max-h-[500px]">
            {existingOutlines.length === 0 ? (
              <div className="p-4 bg-stone-200/50 rounded-xl border border-dashed border-stone-300 text-center w-40 lg:w-full shrink-0">
                <p className="text-[8px] md:text-[10px] text-stone-400 font-mono italic">No drafts woven yet.</p>
              </div>
            ) : (
              existingOutlines.map((o, idx) => (
                <div 
                  key={o.id}
                  onClick={() => setActiveOutlineId(o.id)}
                  className={`group p-3 md:p-4 rounded-xl border transition-all cursor-pointer relative shrink-0 w-48 lg:w-full ${
                    (activeOutlineId === o.id || (!activeOutlineId && idx === 0))
                      ? 'bg-white border-stone-800 shadow-md ring-1 ring-stone-800' 
                      : 'bg-stone-50 border-stone-200 hover:bg-white hover:border-stone-400'
                  }`}
                >
                  <div className="flex justify-between items-start mb-1">
                    <span className="text-[8px] md:text-[10px] font-bold text-stone-400 font-mono uppercase">DRAFT #{existingOutlines.length - idx}</span>
                    <button 
                      onClick={(e) => { e.stopPropagation(); onDeleteOutline(o.id); }}
                      className="opacity-100 lg:opacity-0 lg:group-hover:opacity-100 p-1 text-red-300 hover:text-red-500 transition-opacity"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12"></path></svg>
                    </button>
                  </div>
                  <p className="text-[10px] md:text-xs font-mono text-stone-600 line-clamp-1 lg:line-clamp-2 leading-tight">
                    {o.content.slice(0, 60)}...
                  </p>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="lg:col-span-3">
          {activeOutline ? (
            <div className="bg-white rounded-2xl md:rounded-3xl p-6 md:p-12 shadow-xl border border-stone-200 relative animate-in zoom-in-95">
              <div className="flex flex-col md:flex-row justify-between items-center mb-6 md:mb-10 pb-4 md:pb-6 border-b border-stone-100 gap-4">
                <div className="text-center md:text-left">
                  <h3 className="text-xl md:text-3xl font-bold text-stone-800 font-mono uppercase tracking-tighter">Project Structure</h3>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => navigator.clipboard.writeText(activeOutline.content)}
                    className="p-2 bg-stone-50 hover:bg-stone-100 border border-stone-200 rounded-lg text-stone-400 hover:text-stone-800 transition-all shadow-sm active:scale-95"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"></path></svg>
                  </button>
                </div>
              </div>

              <div className="prose-custom max-w-none overflow-x-auto">
                {typeof renderedMarkdown === 'string' ? (
                  <div className="text-sm md:text-base" dangerouslySetInnerHTML={{ __html: renderedMarkdown }} />
                ) : (
                  <div className="whitespace-pre-wrap font-mono text-base md:text-lg text-stone-700 leading-relaxed text-sm md:text-base">
                    {activeOutline.content}
                  </div>
                )}
              </div>

              <div className="absolute left-4 md:left-6 top-10 bottom-10 w-[1px] bg-red-100 pointer-events-none hidden md:block"></div>
            </div>
          ) : (
            <div className="bg-stone-200/20 rounded-2xl md:rounded-3xl border-2 border-dashed border-stone-200 min-h-[300px] flex flex-col items-center justify-center py-12 md:py-24 text-center p-6 md:p-8">
              <div className="text-4xl md:text-5xl mb-4 md:mb-6 opacity-30 grayscale">📑</div>
              <h3 className="text-lg md:text-xl font-bold font-mono text-stone-400 uppercase tracking-widest">No Active Outline</h3>
              <p className="text-xs md:text-sm font-mono text-stone-400 mt-2 max-w-xs italic">
                Gather your notes and research, then hit "Begin Weave".
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Outlines;
