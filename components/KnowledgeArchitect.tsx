
import React, { useState } from 'react';
import { shredWallOfText } from '../services/geminiService';
import { ProjectNote } from '../types';

interface KnowledgeArchitectProps {
  onShredded: (notes: ProjectNote[]) => void;
}

const KnowledgeArchitect: React.FC<KnowledgeArchitectProps> = ({ onShredded }) => {
  const [inputText, setInputText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleShred = async () => {
    if (!inputText.trim() || isProcessing) return;
    setIsProcessing(true);
    setError(null);

    try {
      const results = await shredWallOfText(inputText);
      const newNotes: ProjectNote[] = results.map((r: any) => ({
        id: crypto.randomUUID(),
        title: r.title,
        content: r.content,
        category: r.category,
        tags: r.tags,
        links: r.links,
        is_priority: r.is_priority,
        raw_source_id: r.raw_source_id,
        timestamp: Date.now()
      }));
      onShredded(newNotes);
      setInputText('');
    } catch (err: any) {
      setError("Analysis failed. Verify input or API connection.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleShred();
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in pb-24">
      <div className="bg-white border border-slate-200 rounded-2xl p-10 shadow-sm relative overflow-hidden">
        <div className="space-y-6 relative z-10">
          <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="space-y-1">
              <h2 className="text-xl font-bold text-slate-900">Knowledge Architect</h2>
              <p className="text-slate-400 text-xs uppercase tracking-widest font-semibold">
                {isProcessing ? 'Processing Data...' : 'Paste Content for Analysis'}
              </p>
            </div>
          </header>

          <div className="relative">
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Paste research, chat logs, or any unstructured text here..."
              className="w-full h-80 bg-slate-50 border border-slate-200 rounded-xl p-8 font-mono text-sm text-slate-700 placeholder:text-slate-300 focus:ring-2 focus:ring-slate-900 outline-none resize-none transition-all"
            />
            {isProcessing && (
              <div className="absolute inset-0 bg-white/60 backdrop-blur-sm rounded-xl flex flex-col items-center justify-center space-y-4">
                <div className="w-12 h-12 border-4 border-slate-200 border-t-slate-900 rounded-full animate-spin"></div>
                <p className="text-slate-600 font-bold text-xs uppercase tracking-widest">Architecting Structure</p>
              </div>
            )}
          </div>

          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex-1">
              {error && (
                <div className="flex items-center gap-3 text-red-500">
                  <span className="font-bold text-xs uppercase tracking-widest">{error}</span>
                </div>
              )}
            </div>
            <button
              onClick={handleShred}
              disabled={!inputText.trim() || isProcessing}
              className={`w-full md:w-auto px-10 py-4 rounded-xl font-bold text-sm uppercase tracking-wider transition-all shadow-lg active:scale-95 ${
                isProcessing 
                  ? 'bg-slate-200 text-slate-400 cursor-not-allowed' 
                  : 'bg-slate-900 text-white hover:bg-black'
              }`}
            >
              Analyze Records
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
         <div className="p-6 bg-slate-50 border border-slate-200 rounded-xl">
           <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Capabilities</p>
           <ul className="text-xs text-slate-500 space-y-2 list-disc pl-4">
             <li>Extracts atomic notes from wall-of-text content.</li>
             <li>Identifies character, world-building, and manuscript segments.</li>
             <li>Preserves all source links and references.</li>
           </ul>
         </div>
         <div className="p-6 bg-slate-50 border border-slate-200 rounded-xl">
           <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Authority Rule</p>
           <p className="text-xs text-slate-500 italic">Information added later in the text sequence overrides previous descriptions for conflicting data.</p>
         </div>
      </div>
    </div>
  );
};

export default KnowledgeArchitect;
