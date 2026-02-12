
import React, { useState, useMemo } from 'react';
import { ProjectNote } from '../types';
import { generateProjectImage } from '../services/geminiService';

interface VisualizerProps {
  notes: ProjectNote[];
  notepadContext: string;
  onAddImage: (prompt: string, imageData: string) => void;
  onDeleteImage: (id: string) => void;
  onResetKey: () => void;
}

const Visualizer: React.FC<VisualizerProps> = ({ notes, notepadContext, onAddImage, onDeleteImage, onResetKey }) => {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!prompt.trim() || isGenerating) return;
    setIsGenerating(true);
    setError(null);

    try {
      const imageData = await generateProjectImage(prompt);
      onAddImage(prompt, imageData);
      setPrompt('');
    } catch (err: any) {
      if (err.message === 'KEY_RESET_REQUIRED') {
        onResetKey();
      } else {
        setError("Failed to develop the image. Check your chemistry (connection).");
      }
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Darkroom Controls */}
      <div className="bg-stone-900 rounded-3xl p-8 shadow-2xl border-b-4 border-stone-950">
        <div className="flex flex-col md:flex-row gap-6 items-center">
          <div className="w-16 h-16 bg-red-900/30 rounded-full flex items-center justify-center border border-red-500/50 shadow-[0_0_15px_rgba(239,68,68,0.3)]">
            <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
          </div>
          <div className="flex-1 space-y-2">
            <h2 className="text-2xl font-bold font-mono text-stone-100 uppercase tracking-tighter">Visualizer Studio</h2>
            <p className="text-stone-500 text-xs font-mono italic">Generate concept visuals from your brainstorming notes.</p>
          </div>
        </div>

        <div className="mt-8 flex flex-col sm:flex-row gap-3">
          <input 
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
            placeholder="Describe the visual concept... (e.g., 'A rusty robot in a foggy forest')"
            className="flex-1 bg-stone-800 border-stone-700 text-stone-100 rounded-xl px-4 py-3 font-mono text-sm focus:ring-1 focus:ring-stone-500 outline-none placeholder:text-stone-600"
          />
          <button 
            onClick={handleGenerate}
            disabled={!prompt.trim() || isGenerating}
            className="bg-stone-100 text-stone-900 px-6 py-3 rounded-xl font-bold font-mono uppercase text-xs hover:bg-white transition-all disabled:opacity-50 flex items-center gap-2 whitespace-nowrap"
          >
            {isGenerating ? <div className="w-4 h-4 border-2 border-stone-900/30 border-t-stone-900 rounded-full animate-spin"></div> : 'Expose Image'}
          </button>
        </div>
        {error && <p className="text-red-400 text-[10px] font-mono mt-2 uppercase">{error}</p>}
      </div>

      {/* Mood Board Area */}
      <div className="relative min-h-[400px] p-10 bg-stone-200 rounded-[2rem] shadow-inner overflow-hidden border-2 border-stone-300">
        <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
        
        {notes.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-stone-400 gap-4 mt-20">
            <span className="text-6xl grayscale opacity-20">📸</span>
            <p className="font-mono text-sm uppercase tracking-widest italic">The corkboard is empty.</p>
          </div>
        ) : (
          <div className="flex flex-wrap justify-center gap-12 relative z-10">
            {notes.map((note, idx) => (
              <div 
                key={note.id} 
                className="group relative bg-white p-3 pt-3 pb-12 shadow-xl border border-stone-200 transition-all hover:scale-110 hover:z-50 hover:shadow-2xl cursor-default"
                style={{ 
                  transform: `rotate(${(idx % 2 === 0 ? 1 : -1) * (idx % 5)}deg)`,
                  width: '260px'
                }}
              >
                <div className="aspect-square bg-stone-100 overflow-hidden relative">
                  <img src={note.metadata?.imageData} alt={note.content} className="w-full h-full object-cover grayscale-[0.2] contrast-125" />
                  <div className="absolute inset-0 shadow-inner pointer-events-none"></div>
                </div>
                
                <div className="mt-4 px-2">
                  <p className="font-handwriting text-stone-800 text-xl leading-tight line-clamp-2">
                    {note.content}
                  </p>
                </div>

                <div className="absolute bottom-2 left-0 right-0 px-4 flex justify-between items-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="text-[9px] font-mono text-stone-400">{new Date(note.timestamp).toLocaleDateString()}</span>
                  <button 
                    onClick={() => onDeleteImage(note.id)}
                    className="p-1.5 text-red-300 hover:text-red-500 transition-colors"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12"></path></svg>
                  </button>
                </div>

                {/* Decorative Pin */}
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-red-600 shadow-md flex items-center justify-center">
                  <div className="w-1.5 h-1.5 rounded-full bg-red-400/50"></div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Visualizer;
