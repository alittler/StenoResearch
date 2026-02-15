
import React, { useState, useEffect } from 'react';
import { ProjectNote } from '../types';
import { generateProjectImage } from '../services/geminiService';

interface VisualizerProps {
  notes: ProjectNote[];
  notepadContext: string;
  onAddImage: (prompt: string, imageData: string) => void;
  onDeleteImage: (id: string) => void;
}

const Visualizer: React.FC<VisualizerProps> = ({ notes, notepadContext, onAddImage, onDeleteImage }) => {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasKey, setHasKey] = useState<boolean>(false);

  useEffect(() => {
    const checkKey = async () => {
      // @ts-ignore
      const selected = await window.aistudio.hasSelectedApiKey();
      setHasKey(selected);
    };
    checkKey();
  }, []);

  const handleOpenKey = async () => {
    // @ts-ignore
    await window.aistudio.openSelectKey();
    setHasKey(true); // Assume success per guidelines
  };

  const handleGenerate = async () => {
    if (!prompt.trim() || isGenerating) return;
    setIsGenerating(true);
    setError(null);

    try {
      const imageData = await generateProjectImage(prompt);
      onAddImage(prompt, imageData);
      setPrompt('');
    } catch (err: any) {
      if (err.message?.includes("entity was not found")) {
        setHasKey(false);
        setError("API Key session expired. Please reconnect.");
      } else {
        setError("Visual synthesis failed. Ensure your API_KEY is valid.");
      }
      console.error(err);
    } finally {
      setIsGenerating(false);
    }
  };

  if (!hasKey) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-6 text-center">
        <div className="w-20 h-20 bg-stone-200 rounded-full flex items-center justify-center text-3xl">🖼️</div>
        <div className="space-y-2">
          <h2 className="text-2xl font-black font-mono uppercase tracking-tighter">Visualizer Offline</h2>
          <p className="text-sm font-mono text-stone-500 max-w-xs mx-auto">
            High-quality image generation requires an active Studio Key selection.
          </p>
        </div>
        <button 
          onClick={handleOpenKey}
          className="bg-stone-900 text-white px-8 py-4 rounded-xl font-black font-mono uppercase text-xs hover:bg-black transition-all shadow-xl active:scale-95"
        >
          Connect Studio Key
        </button>
        <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" className="text-[10px] text-stone-400 underline font-mono">Billing Documentation</a>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="bg-stone-900 rounded-3xl p-8 md:p-10 shadow-2xl border-b-[8px] border-stone-950 paper-texture">
        <h2 className="text-2xl md:text-3xl font-black font-mono text-stone-100 uppercase tracking-tighter mb-8 flex items-center gap-4">
          CONCEPT VISUALIZER
        </h2>

        <div className="flex flex-col sm:flex-row gap-4">
          <input 
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
            placeholder="DESCRIBE THE CONCEPT..."
            className="flex-1 bg-stone-800 border-2 border-stone-700 text-stone-100 rounded-2xl px-6 py-4 font-mono text-base focus:ring-2 focus:ring-stone-500 focus:border-transparent outline-none uppercase placeholder:text-stone-600"
          />
          <button 
            onClick={handleGenerate}
            disabled={!prompt.trim() || isGenerating}
            className="bg-stone-100 text-stone-900 px-10 py-4 rounded-2xl font-black font-mono uppercase text-xs hover:bg-white transition-all disabled:opacity-50 shadow-xl active:scale-95"
          >
            {isGenerating ? 'Developing...' : 'Expose Concept'}
          </button>
        </div>
        {error && <p className="text-red-400 text-[10px] font-mono mt-4 uppercase font-black text-center">{error}</p>}
      </div>

      <div className="relative min-h-[500px] p-8 md:p-14 bg-stone-200 rounded-[3rem] shadow-inner overflow-hidden border-4 border-stone-300">
        <div className="flex flex-wrap justify-center gap-10 relative z-10">
          {notes.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-stone-400 gap-6 mt-20 opacity-30">
              <span className="text-7xl">📸</span>
              <p className="font-mono text-xs uppercase tracking-[0.4em] font-black italic">Moodboard Empty</p>
            </div>
          ) : (
            notes.map((note, idx) => (
              <div 
                key={note.id} 
                className="group relative bg-white p-3 md:p-4 pt-4 pb-12 md:pb-16 shadow-2xl border border-stone-200 transition-all md:hover:scale-110 md:hover:rotate-0 hover:z-50 active:scale-95"
                style={{ 
                  transform: `rotate(${(idx % 2 === 0 ? 1 : -1) * (idx % 4 + 2)}deg)`, 
                  width: window.innerWidth < 640 ? '180px' : '300px' 
                }}
              >
                <div className="aspect-square bg-stone-100 overflow-hidden relative border border-stone-100">
                  <img src={note.metadata?.imageData} alt={note.content} className="w-full h-full object-cover grayscale-[0.1] contrast-125" />
                </div>
                <div className="mt-4 md:mt-6 px-1">
                  <p className="font-handwriting text-stone-800 text-lg md:text-2xl leading-none line-clamp-2 italic">
                    {note.content}
                  </p>
                </div>
                <button onClick={() => onDeleteImage(note.id)} className="absolute bottom-3 right-3 p-2 text-stone-200 hover:text-red-500 transition-colors">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12"></path></svg>
                </button>
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-red-600 shadow-xl border-2 border-red-400"></div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Visualizer;
