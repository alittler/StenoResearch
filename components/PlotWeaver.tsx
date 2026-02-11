
import React, { useState } from 'react';
import { ProjectNote } from '../types';
import { weaveProjectOutline } from '../services/geminiService';

interface PlotWeaverProps {
  notepadNotes: ProjectNote[];
  researchNotes: ProjectNote[];
  existingOutlines: ProjectNote[];
  onSaveOutline: (content: string) => void;
  onDeleteOutline: (id: string) => void;
}

const PlotWeaver: React.FC<PlotWeaverProps> = ({ 
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
      alert("Please add some notes or research before weaving an outline!");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Pass content AND timestamp so the service can prioritize newer entries
      const { text } = await weaveProjectOutline(
        notepadNotes.map(n => ({ content: n.content, timestamp: n.timestamp })),
        researchNotes.map(n => `Factual Context: ${n.question}\nDetails: ${n.content}`)
      );
      onSaveOutline(text);
      setActiveOutlineId(null); 
    } catch (err) {
      setError("The synthesis failed. Try adding more specific research details.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const activeOutline = existingOutlines.find(o => o.id === activeOutlineId) || existingOutlines[0];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header Panel */}
      <div className="bg-stone-900 text-stone-100 rounded-3xl p-8 shadow-2xl relative overflow-hidden border-b-[6px] border-stone-800">
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="space-y-2 text-center md:text-left">
            <h2 className="text-3xl font-bold tracking-tight font-mono uppercase">Outline Studio</h2>
            <p className="text-stone-400 text-sm font-mono max-w-md italic leading-tight">
              Synthesizing {notepadNotes.length} temporal entries. Newer notes take precedence during conflict resolution.
            </p>
          </div>
          
          <button
            onClick={handleWeave}
            disabled={isLoading}
            className="group bg-stone-100 text-stone-900 px-8 py-4 rounded-xl font-bold hover:bg-white transition-all disabled:opacity-50 active:scale-95 flex items-center gap-3 shadow-lg"
          >
            {isLoading ? (
              <>
                <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                <span className="font-mono">Synthesizing...</span>
              </>
            ) : (
              <>
                <span className="text-xl">🧶</span>
                <span className="font-mono uppercase tracking-wider">Begin Weave</span>
              </>
            )}
          </button>
        </div>
        {error && <p className="mt-4 text-red-400 text-xs italic font-mono text-center">{error}</p>}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar: Draft History */}
        <div className="lg:col-span-1 space-y-4">
          <h3 className="text-xs font-bold text-stone-400 uppercase tracking-widest px-2">Outline History</h3>
          <div className="flex flex-col gap-2 max-h-[500px] overflow-y-auto no-scrollbar pr-2">
            {existingOutlines.length === 0 ? (
              <div className="p-4 bg-stone-200/50 rounded-xl border border-dashed border-stone-300 text-center">
                <p className="text-[10px] text-stone-400 font-mono italic">No drafts woven yet.</p>
              </div>
            ) : (
              existingOutlines.map((o, idx) => (
                <div 
                  key={o.id}
                  onClick={() => setActiveOutlineId(o.id)}
                  className={`group p-4 rounded-xl border transition-all cursor-pointer relative ${
                    (activeOutlineId === o.id || (!activeOutlineId && idx === 0))
                      ? 'bg-white border-stone-800 shadow-md ring-1 ring-stone-800' 
                      : 'bg-stone-50 border-stone-200 hover:bg-white hover:border-stone-400'
                  }`}
                >
                  <div className="flex justify-between items-start mb-1">
                    <span className="text-[10px] font-bold text-stone-400 font-mono">DRAFT #{existingOutlines.length - idx}</span>
                    <button 
                      onClick={(e) => { e.stopPropagation(); onDeleteOutline(o.id); }}
                      className="opacity-0 group-hover:opacity-100 p-1 text-red-300 hover:text-red-500 transition-opacity"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12"></path></svg>
                    </button>
                  </div>
                  <p className="text-xs font-mono text-stone-600 line-clamp-2 leading-tight">
                    {o.content.slice(0, 60)}...
                  </p>
                  <p className="text-[9px] text-stone-400 mt-2">
                    {new Date(o.timestamp).toLocaleDateString()} @ {new Date(o.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Main Content: The Outline Reader */}
        <div className="lg:col-span-3">
          {activeOutline ? (
            <div className="bg-white rounded-3xl p-8 md:p-12 shadow-xl border border-stone-200 relative animate-in zoom-in-95">
              {/* Typewriter Header */}
              <div className="flex flex-col md:flex-row justify-between items-center mb-10 pb-6 border-b border-stone-100 gap-4">
                <div>
                  <h3 className="text-3xl font-bold text-stone-800 font-mono uppercase tracking-tighter">Project Structure</h3>
                  <p className="text-xs font-mono text-stone-400 mt-1 uppercase tracking-widest italic font-bold">Priority: Latest Entries First</p>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => navigator.clipboard.writeText(activeOutline.content)}
                    className="p-2 bg-stone-50 hover:bg-stone-100 border border-stone-200 rounded-lg text-stone-400 hover:text-stone-800 transition-all shadow-sm"
                    title="Copy Outline"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"></path></svg>
                  </button>
                </div>
              </div>

              {/* The Text Body */}
              <div className="prose prose-stone max-w-none">
                <div className="whitespace-pre-wrap font-mono text-lg text-stone-700 leading-relaxed selection:bg-stone-200">
                  {activeOutline.content}
                </div>
              </div>

              {/* Decorative Red Line (Steno Style) */}
              <div className="absolute left-6 top-10 bottom-10 w-[1px] bg-red-100 pointer-events-none hidden md:block"></div>
            </div>
          ) : (
            <div className="bg-stone-200/20 rounded-3xl border-2 border-dashed border-stone-200 h-full flex flex-col items-center justify-center py-24 text-center p-8">
              <div className="text-5xl mb-6 opacity-30 grayscale">🧶</div>
              <h3 className="text-xl font-bold font-mono text-stone-400 uppercase tracking-widest">No Active Outline</h3>
              <p className="text-sm font-mono text-stone-400 mt-2 max-w-sm italic">
                Gather your notes and research, then hit "Begin Weave" to generate a corroborating structure.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PlotWeaver;
