
'use client';

import React, { useState, useEffect } from 'react';
import { Scissors, Plus, Trash2, Sparkles, FileText, LayoutGrid } from 'lucide-react';
import { chatWithNotebook } from '../services/geminiService';

interface KnowledgeArchitectProps {
  initialText: string;
  context: string;
  onShredded: (staged: { title: string; content: string; metadata?: any }[]) => void;
  onAddRawNote: (content: string) => void;
}

const KnowledgeArchitect: React.FC<KnowledgeArchitectProps> = ({ 
  initialText, 
  context, 
  onShredded,
  onAddRawNote
}) => {
  const [text, setText] = useState(initialText);
  const [stagedNotes, setStagedNotes] = useState<{ title: string; content: string }[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (initialText) setText(initialText);
  }, [initialText]);

  const handleShred = async () => {
    if (!text.trim() || isProcessing) return;
    
    setIsProcessing(true);
    try {
      const prompt = `
        Analyze the following text and "shred" it into atomic, categorized project notes. 
        Each note should have a clear, concise title and the relevant content extracted.
        Return the result as a JSON array of objects with "title" and "content" properties.
        
        TEXT TO SHRED:
        ${text}
      `;
      
      const response = await chatWithNotebook(prompt, context, []);
      // Basic extraction of JSON from response
      const jsonMatch = response.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        setStagedNotes(prev => [...prev, ...parsed]);
        setText('');
      } else {
        // Fallback if AI doesn't return clean JSON
        setStagedNotes(prev => [...prev, { title: 'Extracted Insight', content: response }]);
      }
    } catch (error) {
      console.error(error);
      alert('Failed to shred content.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCommit = () => {
    onShredded(stagedNotes);
    setStagedNotes([]);
  };

  return (
    <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8 pb-20">
      {/* Input Area */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-black uppercase tracking-tighter flex items-center gap-2">
            <FileText className="w-5 h-5 text-stone-400" />
            Raw Input
          </h2>
          <div className="flex gap-2">
            <button 
              onClick={() => onAddRawNote(text)}
              className="text-[9px] font-black uppercase tracking-widest text-stone-400 hover:text-stone-600 px-3 py-1.5 rounded-lg border border-stone-100"
            >
              Save as Raw
            </button>
          </div>
        </div>
        
        <div className="paper-texture shadow-xl border border-stone-200 rounded-2xl p-8 min-h-[500px] flex flex-col">
          <textarea 
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Paste long-form content, transcripts, or messy notes here to architect them into the ledger..."
            className="flex-1 bg-transparent border-none outline-none resize-none prose-steno placeholder:text-stone-300"
          />
          <div className="mt-6 pt-6 border-t border-stone-100 flex justify-end">
            <button 
              onClick={handleShred}
              disabled={!text.trim() || isProcessing}
              className="bg-stone-900 text-white px-8 py-3 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-stone-800 transition-all disabled:opacity-20 flex items-center gap-2 shadow-lg"
            >
              {isProcessing ? <Sparkles className="w-4 h-4 animate-pulse" /> : <Scissors className="w-4 h-4" />}
              Shred & Categorize
            </button>
          </div>
        </div>
      </div>

      {/* Staging Area */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-black uppercase tracking-tighter flex items-center gap-2">
            <LayoutGrid className="w-5 h-5 text-stone-400" />
            Staging Area
          </h2>
          {stagedNotes.length > 0 && (
            <button 
              onClick={handleCommit}
              className="bg-emerald-600 text-white px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100 flex items-center gap-2"
            >
              <Plus className="w-3 h-3" />
              Commit All to Ledger
            </button>
          )}
        </div>

        <div className="space-y-4">
          {stagedNotes.map((note, i) => (
            <div key={i} className="bg-white border border-stone-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-all group relative">
              <button 
                onClick={() => setStagedNotes(prev => prev.filter((_, idx) => idx !== i))}
                className="absolute top-4 right-4 p-2 text-stone-200 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
              >
                <Trash2 className="w-4 h-4" />
              </button>
              <input 
                value={note.title}
                onChange={(e) => {
                  const newNotes = [...stagedNotes];
                  newNotes[i].title = e.target.value;
                  setStagedNotes(newNotes);
                }}
                className="w-full bg-transparent border-none outline-none text-sm font-black uppercase tracking-widest text-stone-800 mb-2"
              />
              <textarea 
                value={note.content}
                onChange={(e) => {
                  const newNotes = [...stagedNotes];
                  newNotes[i].content = e.target.value;
                  setStagedNotes(newNotes);
                }}
                className="w-full bg-transparent border-none outline-none text-xs text-stone-500 leading-relaxed resize-none h-24"
              />
            </div>
          ))}

          {stagedNotes.length === 0 && (
            <div className="h-[500px] border-2 border-dashed border-stone-100 rounded-2xl flex flex-col items-center justify-center text-center p-12 opacity-20">
              <LayoutGrid className="w-12 h-12 mb-4" />
              <p className="text-lg font-bold italic font-serif">Staging area empty...</p>
              <p className="text-xs mt-2">Shred content to see atomic notes here</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default KnowledgeArchitect;
