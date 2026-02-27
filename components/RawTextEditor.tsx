
'use client';

import React from 'react';
import { ProjectNote } from '../types';
import { Download, Copy, FileText } from 'lucide-react';

interface RawTextEditorProps {
  allNotes: ProjectNote[];
  notebookTitle: string;
}

const RawTextEditor: React.FC<RawTextEditorProps> = ({ allNotes, notebookTitle }) => {
  const fullText = allNotes
    .sort((a, b) => b.timestamp - a.timestamp)
    .map(note => {
      const date = new Date(note.timestamp).toLocaleString();
      return `[${date}] ${note.title ? note.title.toUpperCase() : 'ENTRY'}\n${note.content}\n\n${'='.repeat(40)}\n`;
    })
    .join('\n');

  const handleCopy = () => {
    navigator.clipboard.writeText(fullText);
    alert('Copied to clipboard!');
  };

  const handleDownload = () => {
    const blob = new Blob([fullText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${notebookTitle.toLowerCase().replace(/\s+/g, '-')}-export.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-20">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black uppercase tracking-tighter">Raw Export</h1>
          <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mt-1">Plain Text Ledger View</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={handleCopy}
            className="flex items-center gap-2 bg-stone-50 text-stone-600 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-stone-100 transition-all border border-stone-200"
          >
            <Copy className="w-3 h-3" />
            Copy All
          </button>
          <button 
            onClick={handleDownload}
            className="flex items-center gap-2 bg-stone-900 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-stone-800 transition-all shadow-lg"
          >
            <Download className="w-3 h-3" />
            Download .txt
          </button>
        </div>
      </div>

      <div className="paper-texture shadow-xl border border-stone-200 rounded-2xl p-12 min-h-[70vh] relative">
        <div className="absolute left-10 top-0 bottom-0 w-[1px] bg-red-200 opacity-40"></div>
        <pre className="whitespace-pre-wrap font-mono text-xs text-stone-600 leading-relaxed pl-12">
          {fullText || 'No notes found in this ledger.'}
        </pre>
      </div>
    </div>
  );
};

export default RawTextEditor;
