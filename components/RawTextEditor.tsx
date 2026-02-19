'use client';

import React, { useMemo, useState } from 'react';
import { ProjectNote } from '../types';

interface RawTextEditorProps {
  allNotes: ProjectNote[];
  notebookTitle: string;
}

const RawTextEditor: React.FC<RawTextEditorProps> = ({ allNotes, notebookTitle }) => {
  const [copyStatus, setCopyStatus] = useState<string | null>(null);

  const aggregatedData = useMemo(() => {
    const sorted = [...allNotes].sort((a, b) => a.timestamp - b.timestamp);
    
    let text = `==================================================\n`;
    text += `PROJECT LEDGER: ${notebookTitle.toUpperCase()}\n`;
    text += `EXPORT DATE: ${new Date().toLocaleString()}\n`;
    text += `TOTAL RECORDS: ${sorted.length}\n`;
    text += `==================================================\n\n`;

    sorted.forEach((note, index) => {
      const dateStr = new Date(note.timestamp).toLocaleString();
      const typeLabel = note.type.toUpperCase();
      
      text += `[#${index + 1}] [${dateStr}] [TYPE: ${typeLabel}]\n`;
      if (note.type === 'research' && note.question) {
        text += `QUESTION: ${note.question}\n`;
      }
      text += `--------------------------------------------------\n`;
      text += `${note.content}\n`;
      if (note.metadata?.urls && note.metadata.urls.length > 0) {
        text += `SOURCES: ${note.metadata.urls.join(', ')}\n`;
      }
      text += `\n\n`;
    });

    return text;
  }, [allNotes, notebookTitle]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(aggregatedData);
      setCopyStatus('Copied!');
      setTimeout(() => setCopyStatus(null), 2000);
    } catch (err) {
      setCopyStatus('Error Copying');
    }
  };

  const handleDownload = () => {
    const blob = new Blob([aggregatedData], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ledger-${notebookTitle.toLowerCase().replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="h-[calc(100vh-12rem)] min-h-[500px] flex flex-col animate-in fade-in duration-500">
      <div className="bg-white rounded-2xl shadow-xl border border-stone-200 overflow-hidden flex flex-col h-full">
        <div className="p-4 bg-stone-800 text-white flex justify-between items-center">
          <div className="flex items-center gap-3">
            <span className="text-xl">📄</span>
            <div className="flex flex-col">
               <h2 className="font-bold leading-none">Chronological Project Ledger</h2>
               <span className="text-[10px] font-mono text-stone-400 mt-1 uppercase tracking-widest">Aggregated Records for {notebookTitle}</span>
            </div>
          </div>
          <div className="flex items-center gap-4 text-xs font-mono">
            <span className="opacity-60">{allNotes.length} entries</span>
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
          </div>
        </div>
        
        <div className="flex-1 p-8 bg-stone-50 overflow-hidden flex flex-col">
          <textarea
            readOnly
            value={aggregatedData}
            className="flex-1 p-6 font-mono text-sm leading-relaxed text-stone-700 bg-white border border-stone-200 rounded-xl focus:outline-none resize-none selection:bg-stone-200 selection:text-stone-900 shadow-inner"
          />
        </div>
        
        <div className="p-4 bg-stone-100 border-t border-stone-200 flex justify-between items-center">
          <p className="text-[10px] font-mono text-stone-400 italic">
            This consolidated view supports notepad and research data archival.
          </p>
          <div className="flex gap-2">
            <button
              onClick={handleCopy}
              className="px-4 py-2 bg-stone-200 text-stone-700 rounded-lg text-xs font-bold font-mono uppercase hover:bg-stone-300 transition-colors flex items-center gap-2"
            >
              {copyStatus || 'Copy All'}
            </button>
            <button
              onClick={handleDownload}
              className="px-4 py-2 bg-stone-800 text-white rounded-lg text-xs font-bold font-mono uppercase hover:bg-stone-700 transition-colors flex items-center gap-2"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
              Download .TXT
            </button>
          </div>
        </div>
      </div>
      
      <p className="mt-4 text-xs text-stone-400 italic text-center">
        💡 Use this view to export your research for external word processors.
      </p>
    </div>
  );
};

export default RawTextEditor;