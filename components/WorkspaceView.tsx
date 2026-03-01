import React, { useState, useEffect, useRef } from 'react';
import { ProjectNote, Notebook } from '../types';
import { chatWithNotebook } from '../services/geminiService';
import Markdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import remarkGfm from 'remark-gfm';
import StenoPad from './StenoPad';
import SourcesView from './SourcesView';
import { Pin, Send, Sparkles, BookOpen, FileText, MessageSquare, PenTool } from 'lucide-react';

interface WorkspaceViewProps {
  notebookId: string;
  notes: ProjectNote[];
  notebooks: Notebook[];
  onAddNote: (content: string, type: ProjectNote['type'], extra?: Partial<ProjectNote>) => void;
  onUpdateNote: (id: string, updates: Partial<ProjectNote>) => void;
  onDeleteNote: (id: string) => void;
  onNavigateToNotebook?: (id: string) => void;
}

const WorkspaceView: React.FC<WorkspaceViewProps> = ({ 
  notebookId, 
  notes, 
  notebooks,
  onAddNote,
  onUpdateNote,
  onDeleteNote,
  onNavigateToNotebook
}) => {
  const [activeTab, setActiveTab] = useState<'assistant' | 'notepad'>('assistant');
  const [chatMessages, setChatMessages] = useState<{role: 'user' | 'model', text: string}[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const chatScrollRef = useRef<HTMLDivElement>(null);

  const notepadNotes = notes.filter(n => n.type === 'raw' && n.notebookId === notebookId);

  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [chatMessages]);

  const handleChatSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!chatInput.trim() || isChatLoading) return;

    const userMsg = chatInput.trim();
    setChatInput('');
    setChatMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setIsChatLoading(true);

    const notepadContext = notepadNotes
      .map(n => `[NOTEPAD ENTRY: ${n.title || 'Note'}] ${n.content}`)
      .join('\n\n');

    const sourcesContext = notes
      .filter(n => n.type === 'ledger' || n.type === 'research' || n.type === 'source')
      .map(n => `[SOURCE: ${n.title || 'Note'}] ${n.content}`)
      .join('\n\n');
    
    const fullContext = `NOTEPAD CONTENT:\n${notepadContext}\n\nSOURCES:\n${sourcesContext}`;

    try {
      const response = await chatWithNotebook(userMsg, fullContext, chatMessages);
      setChatMessages(prev => [...prev, { role: 'model', text: response }]);
    } catch (error) {
      setChatMessages(prev => [...prev, { role: 'model', text: "Error connecting to assistant." }]);
    } finally {
      setIsChatLoading(false);
    }
  };

  const pinToNotepad = (text: string) => {
    onAddNote(text, 'raw', { title: 'Pinned Insight' });
  };

  return (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-100px)] gap-4 lg:gap-6 p-4 lg:p-6 animate-fade-in overflow-y-auto lg:overflow-hidden">
      
      {/* Left Column (Assistant + Sources) */}
      <div className="flex flex-col gap-4 lg:gap-6 w-full lg:w-2/3 lg:h-full shrink-0 lg:shrink">
        
        {/* Assistant (Top 2/3) */}
        <div className="flex flex-col bg-white rounded-3xl shadow-sm border border-stone-200 overflow-hidden h-[500px] lg:h-auto lg:flex-[2] lg:min-h-0 shrink-0 lg:shrink">
          <div className="p-4 border-b border-stone-100 bg-stone-50 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-blue-500" />
              <h2 className="text-[10px] font-black uppercase tracking-widest text-stone-500">Intelligent Synthesis</h2>
            </div>
            <div className="flex items-center gap-2">
              <BookOpen className="w-3 h-3 text-stone-400" />
              <span className="text-[8px] font-bold text-stone-400 uppercase tracking-tighter">Sources Active</span>
            </div>
          </div>

          <div ref={chatScrollRef} className="flex-1 overflow-y-auto p-6 space-y-6 no-scrollbar">
            {chatMessages.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-20">
                <Sparkles className="w-12 h-12" />
                <p className="text-lg font-bold italic font-serif">Ask your sources to help you write...</p>
              </div>
            )}
            {chatMessages.map((msg, i) => (
              <div key={i} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} group`}>
                <div className={`max-w-[90%] p-4 rounded-2xl text-sm leading-relaxed ${
                  msg.role === 'user' ? 'bg-stone-900 text-white rounded-tr-none' : 'bg-stone-50 text-stone-800 rounded-tl-none border border-stone-100'
                }`}>
                  <div className="markdown-body">
                    <Markdown 
                      rehypePlugins={[rehypeRaw]}
                      remarkPlugins={[remarkGfm]}
                      components={{
                        a: ({node, ...props}) => <a {...props} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline" />
                      }}
                    >
                      {msg.text}
                    </Markdown>
                  </div>
                </div>
                {msg.role === 'model' && (
                  <button 
                    onClick={() => pinToNotepad(msg.text)}
                    className="mt-2 flex items-center gap-1 text-[9px] font-black uppercase tracking-widest text-stone-400 hover:text-blue-500 transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <Pin className="w-3 h-3" />
                    Pin to Notepad
                  </button>
                )}
              </div>
            ))}
            {isChatLoading && (
              <div className="flex items-start gap-4">
                <div className="bg-stone-50 p-4 rounded-2xl rounded-tl-none border border-stone-100 flex gap-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-stone-300 animate-bounce"></div>
                  <div className="w-1.5 h-1.5 rounded-full bg-stone-300 animate-bounce [animation-delay:0.2s]"></div>
                  <div className="w-1.5 h-1.5 rounded-full bg-stone-300 animate-bounce [animation-delay:0.4s]"></div>
                </div>
              </div>
            )}
          </div>

          <form onSubmit={handleChatSend} className="p-4 border-t border-stone-100 bg-stone-50 flex gap-2 shrink-0">
            <input 
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Ask your sources..."
              className="flex-1 bg-white border border-stone-200 rounded-xl px-4 py-3 text-xs focus:ring-2 focus:ring-blue-500 outline-none transition-all shadow-sm"
            />
            <button type="submit" className="bg-stone-900 text-white p-3 rounded-xl hover:bg-stone-800 transition-all shadow-md">
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>

        {/* Sources (Bottom 1/3) */}
        <div className="flex flex-col bg-white rounded-3xl shadow-sm border border-stone-200 overflow-hidden h-[400px] lg:h-auto lg:flex-[1] lg:min-h-0 shrink-0 lg:shrink">
          <div className="p-4 border-b border-stone-100 bg-stone-50 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-amber-500" />
              <h2 className="text-[10px] font-black uppercase tracking-widest text-stone-500">Source Directory</h2>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-6 bg-stone-50/50 no-scrollbar">
            <SourcesView 
              notes={notes}
              onAddNote={onAddNote}
              compact={true}
            />
          </div>
        </div>

      </div>

      {/* Right Column (Ledger) */}
      <div className="flex flex-col bg-white rounded-3xl shadow-sm border border-stone-200 overflow-hidden h-[600px] lg:h-full w-full lg:w-1/3 shrink-0 lg:shrink lg:min-h-0">
        <div className="p-4 border-b border-stone-100 bg-stone-50 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <PenTool className="w-4 h-4 text-emerald-500" />
            <h2 className="text-[10px] font-black uppercase tracking-widest text-stone-500">Persistent Notepad</h2>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-6 bg-white no-scrollbar">
          <StenoPad 
            notes={notepadNotes}
            onAddNote={onAddNote}
            onUpdateNote={onUpdateNote}
            onDeleteNote={onDeleteNote}
            noteType="raw"
            notebooks={notebooks}
            onNavigateToNotebook={onNavigateToNotebook}
          />
        </div>
      </div>

    </div>
  );
};

export default WorkspaceView;
