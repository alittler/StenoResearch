import React, { useState, useRef } from 'react';
import { ProjectNote } from '../types';
import { FileText, Link as LinkIcon, Globe, Clock, Upload, X, File, Loader2, Clipboard, Trash2 } from 'lucide-react';
import * as pdfjs from 'pdfjs-dist';
// @ts-ignore
import pdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import Markdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import remarkGfm from 'remark-gfm';

// Initialize PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = pdfWorker;

interface SourcesViewProps {
  notes: ProjectNote[];
  onAddNote: (content: string, type: ProjectNote['type'], extra?: Partial<ProjectNote>) => void;
  onDeleteNote: (id: string) => void;
  compact?: boolean;
}

const SourcesView: React.FC<SourcesViewProps> = ({ notes, onAddNote, onDeleteNote, compact }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isPasting, setIsPasting] = useState(false);
  const [pastedText, setPastedText] = useState('');
  const [pastedTitle, setPastedTitle] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const sources = notes.filter(n => n.type === 'ledger' || n.type === 'research' || n.type === 'source' || (n.type === 'raw' && (n.metadata?.fileType === 'application/pdf' || n.metadata?.fileType?.startsWith('image/'))));

  const handleFile = async (file: File) => {
    setIsUploading(true);
    try {
      let content = '';
      const fileType = file.type;
      const isPdf = fileType === 'application/pdf';
      const isImage = fileType.startsWith('image/');

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
      } else if (isImage) {
        const reader = new FileReader();
        const dataUrl = await new Promise<string>((resolve, reject) => {
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
        content = `![${file.name}](${dataUrl})`;
      } else if (fileType.startsWith('text/') || file.name.endsWith('.md')) {
        content = await file.text();
      } else {
        content = `Binary file: ${file.name} (${file.size} bytes)`;
      }

      onAddNote(content, (isPdf || isImage) ? 'raw' : 'source', {
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

  const handlePasteSubmit = () => {
    if (!pastedText.trim()) return;
    
    onAddNote(pastedText.trim(), 'source', {
      title: pastedTitle.trim() || 'Pasted Content',
      metadata: {
        fileName: pastedTitle.trim() || 'pasted-content.txt',
        fileType: 'text/plain',
        fileSize: new Blob([pastedText]).size
      }
    });
    
    setPastedText('');
    setPastedTitle('');
    setIsPasting(false);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    files.forEach(handleFile);
  };

  return (
    <div 
      className={compact ? "relative min-h-[200px]" : "max-w-6xl mx-auto pb-20 relative min-h-[400px]"}
      onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
      onDragLeave={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) {
          setIsDragging(false);
        }
      }}
      onDrop={onDrop}
    >
      {/* Drag Overlay */}
      {isDragging && (
        <div className="absolute inset-0 z-50 bg-blue-50/90 backdrop-blur-sm border-2 border-dashed border-blue-500 rounded-3xl flex items-center justify-center">
          <div className="text-center">
            <Upload className="w-12 h-12 text-blue-500 mx-auto mb-4 animate-bounce" />
            <h3 className="text-xl font-bold text-blue-900">Drop files to upload</h3>
          </div>
        </div>
      )}

      <input 
        type="file" 
        ref={fileInputRef} 
        className="hidden" 
        onChange={(e) => {
          const files = Array.from(e.target.files || []);
          files.forEach(handleFile);
        }}
        multiple
        accept="image/*,application/pdf,text/*,.md"
      />

      {/* Sticky Reveal Actions */}
      {!isPasting && (
        <div className="sticky top-0 z-20 flex justify-center group w-full h-0">
          {/* Invisible hover target area at the top */}
          <div className="absolute top-0 left-0 w-full h-12 bg-transparent z-30" /> 
          
          <div className="flex items-center gap-3 transform transition-transform duration-300 -translate-y-[calc(100%-8px)] group-hover:translate-y-0 bg-white/90 backdrop-blur-md px-4 py-2 rounded-b-2xl border-x border-b border-stone-200 shadow-md">
            {isUploading && (
              <Loader2 className="w-4 h-4 animate-spin text-stone-400" />
            )}
            <button 
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="bg-stone-900 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-stone-800 transition-all disabled:opacity-50 flex items-center gap-2"
            >
              <Upload className="w-3 h-3" />
              Browse Files
            </button>
            <button 
              onClick={() => setIsPasting(true)}
              disabled={isUploading}
              className="bg-white border border-stone-200 text-stone-600 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-stone-50 transition-all disabled:opacity-50 flex items-center gap-2"
            >
              <Clipboard className="w-3 h-3" />
              Paste Text
            </button>
          </div>
        </div>
      )}

      {/* Paste Area */}
      {isPasting && (
        <div className="mt-4 bg-white border-2 border-stone-200 rounded-2xl p-6 space-y-4 animate-fade-in shadow-sm">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-stone-400">Source Title</label>
            <input 
              type="text"
              value={pastedTitle}
              onChange={(e) => setPastedTitle(e.target.value)}
              placeholder="e.g., Interview Transcript, Meeting Notes..."
              className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-stone-200 outline-none transition-all"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-stone-400">Content</label>
            <textarea 
              value={pastedText}
              onChange={(e) => setPastedText(e.target.value)}
              placeholder="Paste your text here..."
              className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-4 text-sm min-h-[200px] focus:ring-2 focus:ring-stone-200 outline-none transition-all resize-none"
            />
          </div>
          <div className="flex justify-end gap-3">
            <button 
              onClick={() => setIsPasting(false)}
              className="px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest text-stone-400 hover:text-stone-600 transition-all"
            >
              Cancel
            </button>
            <button 
              onClick={handlePasteSubmit}
              disabled={!pastedText.trim()}
              className="bg-stone-900 text-white px-8 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-stone-800 transition-all disabled:opacity-20 shadow-lg"
            >
              Add to Sources
            </button>
          </div>
        </div>
      )}

      <div className={`mt-4 grid ${compact ? 'grid-cols-1 gap-4' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'}`}>
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
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-stone-300 uppercase tracking-widest">
                  {new Date(source.timestamp).toLocaleDateString()}
                </span>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm('Are you sure you want to delete this source?')) {
                      onDeleteNote(source.id);
                    }
                  }}
                  className="p-1.5 text-stone-200 hover:text-red-500 transition-colors"
                  title="Delete Source"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
            
            <div className="space-y-2">
              <h3 className="text-sm font-bold text-stone-800 line-clamp-2">{source.title || 'Untitled Entry'}</h3>
              <div className="text-xs text-stone-500 line-clamp-3 leading-relaxed markdown-body overflow-hidden">
                <Markdown 
                  rehypePlugins={[rehypeRaw]}
                  remarkPlugins={[remarkGfm]}
                  components={{
                    a: ({node, ...props}) => <a {...props} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline" />
                  }}
                >
                  {source.content}
                </Markdown>
              </div>
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
