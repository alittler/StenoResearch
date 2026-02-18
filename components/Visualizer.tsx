
import React, { useState, useEffect } from 'react';
import { ProjectNote } from '../types';
import { generateProjectImage } from '../services/geminiService';

interface VisualizerProps {
  notes: ProjectNote[];
  notepadContext: string;
  onAddImage: (prompt: string, imageData: string) => void;
  onDeleteImage: (id: string) => void;
  manualApiKey?: string;
}

const Visualizer: React.FC<VisualizerProps> = ({ notes, notepadContext, onAddImage, onDeleteImage, manualApiKey }) => {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!prompt.trim() || isGenerating) return;
    setIsGenerating(true);
    setError(null);

    try {
      // Use manualApiKey from props
      const imageData = await generateProjectImage(prompt, manualApiKey);
      onAddImage(prompt, imageData);
      setPrompt('');
    } catch (err: any) {
      if (err.message === "API_KEY_MISSING") {
        setError("AI Credentials Missing. Please set your key in the 'Scan' tab or System Settings.");
      } else if (err.message?.includes("429")) {
        setError("Quota Exceeded. Please upgrade to a paid Gemini plan or wait for reset.");
      } else {
        setError(`Visual synthesis failed: ${err.message || 'Check connection'}`);
      }
      console.error(err);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="bg-stone-900 rounded-[2.5rem] p-10 shadow-2xl border-b-[8px] border-stone-950 paper-texture">
        <h2 className="text-2xl md:text-3xl font-black font-mono text-stone-100 uppercase tracking-tighter mb-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="w-3 h-3 rounded-full bg-blue-500 animate-pulse"></span>
            Vision Core
          </div>
          <span className="text-[10px] text-stone-600 tracking-[0.4em] font-bold">GEMINI-2.5-FLASH-IMAGE</span>
        </h2>

        <div className="flex flex-col sm:flex-row gap-4">
          <input 
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
            placeholder="Describe the visual concept for exposure..."
            className="flex-1 bg-stone-800 border-2 border-stone-700 text-stone-100 rounded-2xl px-6 py-4 font-mono text-base focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none uppercase placeholder:text-stone-600 shadow-inner"
          />
          <button 
            onClick={handleGenerate}
            disabled={!prompt.trim() || isGenerating}
            className="bg-white text-stone-900 px-10 py-4 rounded-2xl font-black font-mono uppercase text-xs hover:bg-stone-100 transition-all disabled:opacity-20 shadow-xl active:scale-95"
          >
            {isGenerating ? 'Exposing...' : 'Expose Concept'}
          </button>
        </div>
        {error && <p className="text-red-400 text-[10px] font-mono mt-4 uppercase font-black text-center animate-pulse">{error}</p>}
      </div>

      <div className="relative min-h-[600px] p-8 md:p-14 bg-stone-100 rounded-[3rem] shadow-inner overflow-hidden border-4 border-stone-200">
        <div className="absolute inset-0 paper-texture opacity-30 pointer-events-none"></div>
        <div className="flex flex-wrap justify-center gap-12 relative z-10">
          {notes.length === 0 ? (
            <div className="h-[400px] flex flex-col items-center justify-center text-stone-300 gap-6 mt-20 opacity-40">
              <span className="text-8xl">📸</span>
              <p className="font-mono text-xs uppercase tracking-[0.4em] font-black italic">No Exposed Artifacts Found</p>
            </div>
          ) : (
            notes.map((note, idx) => (
              <div 
                key={note.id} 
                className="group relative bg-white p-4 pt-4 pb-16 shadow-2xl border border-stone-200 transition-all hover:scale-110 hover:rotate-0 hover:z-50"
                style={{ 
                  transform: `rotate(${(idx % 2 === 0 ? 1 : -1) * (idx % 4 + 2)}deg)`, 
                  width: '280px' 
                }}
              >
                <div className="aspect-square bg-stone-50 overflow-hidden relative border border-stone-100 shadow-inner">
                  <img src={note.metadata?.imageData} alt={note.content} className="w-full h-full object-cover grayscale-[0.05] contrast-110" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none"></div>
                </div>
                <div className="mt-6 px-1">
                  <p className="font-serif italic text-stone-800 text-xl leading-none line-clamp-2">
                    {note.content}
                  </p>
                </div>
                <button onClick={() => onDeleteImage(note.id)} className="absolute bottom-4 right-4 p-2 text-stone-200 hover:text-red-500 transition-colors">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12"></path></svg>
                </button>
                {/* Red pushpin decoration */}
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-red-600 shadow-xl border-2 border-red-400"></div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Visualizer;
