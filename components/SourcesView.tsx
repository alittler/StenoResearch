import React, { useState, useRef } from 'react';
import { ProjectNote } from '../types';
import { FileText, Link as LinkIcon, Globe, Clock, Upload, X, File, Loader2 } from 'lucide-react';
import * as pdfjs from 'pdfjs-dist';
// @ts-ignore
import pdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

// Initialize PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = pdfWorker;

interface SourcesViewProps {
  notes: ProjectNote[];
  onAddNote: (content: string, type: ProjectNote['type'], extra?: Partial<ProjectNote>) => void;
}

const SourcesView: React.FC<SourcesViewProps> = ({ notes, onAddNote }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const sources = notes.filter(n => n.type === 'ledger' || n.type === 'research' || n.type === 'source' || (n.type === 'raw' && n.metadata?.fileType === 'application/pdf'));

  const handleFile = async (file: File) => {
    setIsUploading(true);
    try {
      let content = '';
      const fileType = file.type;
      const isPdf = fileType === 'application/pdf';

      if (isPdf) {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
        let fullText = '';
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const textContent = await page.getTextContent();
          const pageText = textContent.items.map((item: any) => item.str).join(' ');
          fullText += pageText + '\n';
        }
        content = fullText;
      } else if (fileType.startsWith('text/') || file.name.endsWith('.md')) {
        content = await file.text();
      } else {
        content = `Binary file: ${file.name} (${file.size} bytes)`;
      }

      onAddNote(content, isPdf ? 'raw' : 'source', {
        title: file.name,
        metadata: {
          fileName: file.name,
          fileType: file.type,
          fileSize: file.size
        }
      });
    } catch (error) {
      console.error('Upload failed:', error);
      alert('Failed to process file. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    files.forEach(handleFile);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-20">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-black uppercase tracking-tighter">Source Directory</h1>
        <div className="flex items-center gap-4">
          <span className="text-xs font-bold text-stone-400 uppercase tracking-widest">{sources.length} Total Sources</span>
          <button 
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="flex items-center gap-2 bg-stone-900 text-white px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-stone-800 transition-all disabled:opacity-50"
          >
            {isUploading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}
            Upload File
          </button>
          <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            onChange={(e) => {
              const files = Array.from(e.target.files || []);
              files.forEach(handleFile);
            }}
            multiple
          />
        </div>
      </div>

      {/* Dropzone */}
      <div 
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={onDrop}
        className={`
          border-2 border-dashed rounded-3xl p-12 flex flex-col items-center justify-center transition-all
          ${isDragging ? 'border-blue-500 bg-blue-50' : 'border-stone-200 bg-white'}
          ${isUploading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        `}
      >
        <div className="w-16 h-16 rounded-2xl bg-stone-50 flex items-center justify-center mb-4">
          <Upload className={`w-8 h-8 ${isDragging ? 'text-blue-500' : 'text-stone-400'}`} />
        </div>
        <h3 className="text-sm font-bold text-stone-800">Drag & Drop Sources</h3>
        <p className="text-xs text-stone-500 mt-1">PDF, Markdown, or Text files</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sources.map((source) => (
          <div key={source.id} className="bg-white border border-stone-200 rounded-2xl p-6 hover:shadow-md transition-all space-y-4">
            <div className="flex items-start justify-between">
              <div className="w-10 h-10 rounded-xl bg-stone-50 flex items-center justify-center">
                {source.metadata?.fileName ? (
                  <File className="w-5 h-5 text-emerald-500" />
                ) : source.content.startsWith('http') ? (
                  <Globe className="w-5 h-5 text-blue-500" />
                ) : (
                  <FileText className="w-5 h-5 text-stone-400" />
                )}
              </div>
              <span className="text-[10px] font-bold text-stone-300 uppercase tracking-widest">
                {new Date(source.timestamp).toLocaleDateString()}
              </span>
            </div>
            
            <div className="space-y-2">
              <h3 className="text-sm font-bold text-stone-800 line-clamp-2">{source.title || 'Untitled Entry'}</h3>
              <p className="text-xs text-stone-500 line-clamp-3 leading-relaxed">{source.content}</p>
              {source.metadata?.fileSize && (
                <span className="text-[10px] text-stone-400 font-mono">
                  {(source.metadata.fileSize / 1024).toFixed(1)} KB
                </span>
              )}
            </div>

            {source.metadata?.urls && source.metadata.urls.length > 0 && (
              <div className="pt-4 border-t border-stone-100 space-y-2">
                {source.metadata.urls.map((url: string, i: number) => (
                  <a 
                    key={i} 
                    href={url} 
                    target="_blank" 
                    rel="noreferrer" 
                    className="flex items-center gap-2 text-[10px] font-bold text-blue-500 hover:underline truncate"
                  >
                    <LinkIcon className="w-3 h-3" />
                    {new URL(url).hostname}
                  </a>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default SourcesView;
