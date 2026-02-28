import React, { useState, useEffect, useRef } from 'react';
import { ProjectNote } from '../types';
import { chatWithNotebook } from '../services/geminiService';
import Markdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import StenoPad from './StenoPad';
import { Pin, Send, Sparkles, BookOpen, FileText, MessageSquare, PenTool } from 'lucide-react';

interface WorkspaceViewProps {
  notebookId: string;
  notes: ProjectNote[];
  onAddNote: (content: string, type: ProjectNote['type'], extra?: Partial<ProjectNote>) => void;
  onUpdateNote: (id: string, updates: Partial<ProjectNote>) => void;
  onDeleteNote: (id: string) => void;
}

const WorkspaceView: React.FC<WorkspaceViewProps> = ({ 
  notebookId, 
  notes, 
  onAddNote,
  onUpdateNote,
  onDeleteNote
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
  }, [chatMessages, activeTab]);

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
    setActiveTab('notepad');
  };

  return (
    <div className="flex flex-col h-[calc(100vh-100px)] animate-fade-in overflow-hidden">
      {/* View Switcher */}
      <div className="flex justify-center p-4 border-b border-stone-100 gap-2 bg-stone-50/30">
        <button 
          onClick={() => setActiveTab('assistant')}
          className={`px-8 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${activeTab === 'assistant' ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'text-stone-400 hover:text-stone-600 hover:bg-stone-100'}`}
        >
          <MessageSquare className="w-3 h-3" />
          Grounded Assistant
        </button>
        <button 
          onClick={() => setActiveTab('notepad')}
          className={`px-8 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${activeTab === 'notepad' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-200' : 'text-stone-400 hover:text-stone-600 hover:bg-stone-100'}`}
        >
          <PenTool className="w-3 h-3" />
          Persistent Notepad
        </button>
      </div>

      <div className="flex-1 overflow-hidden relative">
        {activeTab === 'assistant' ? (
          <div className="h-full max-w-5xl mx-auto p-6 flex flex-col">
            <div className="flex-1 flex flex-col bg-white rounded-3xl shadow-sm border border-stone-200 overflow-hidden">
              <div className="p-4 border-b border-stone-100 bg-stone-50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-blue-500" />
                  <h2 className="text-[10px] font-black uppercase tracking-widest text-stone-500">Intelligent Synthesis</h2>
                </div>
                <div className="flex items-center gap-2">
                  <BookOpen className="w-3 h-3 text-stone-400" />
                  <span className="text-[8px] font-bold text-stone-400 uppercase tracking-tighter">Sources Active</span>
                </div>
              </div>

              <div ref={chatScrollRef} className="flex-1 overflow-y-auto p-8 space-y-8 no-scrollbar">
                {chatMessages.length === 0 && (
                  <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-20">
                    <Sparkles className="w-16 h-16" />
                    <p className="text-xl font-bold italic font-serif">Ask your sources to help you write...</p>
                  </div>
                )}
                {chatMessages.map((msg, i) => (
                  <div key={i} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} group`}>
                    <div className={`max-w-[85%] p-6 rounded-2xl text-sm leading-relaxed ${
                      msg.role === 'user' ? 'bg-stone-900 text-white rounded-tr-none' : 'bg-stone-50 text-stone-800 rounded-tl-none border border-stone-100'
                    }`}>
                      <div className="markdown-body">
                        <Markdown rehypePlugins={[rehypeRaw]}>{msg.text}</Markdown>
                      </div>
                    </div>
                    {msg.role === 'model' && (
                      <button 
                        onClick={() => pinToNotepad(msg.text)}
                        className="mt-3 flex items-center gap-1 text-[9px] font-black uppercase tracking-widest text-stone-400 hover:text-blue-500 transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <Pin className="w-3 h-3" />
                        Pin to Notepad
                      </button>
                    )}
                  </div>
                ))}
                {isChatLoading && (
                  <div className="flex items-start gap-4">
                    <div className="bg-stone-50 p-6 rounded-2xl rounded-tl-none border border-stone-100 flex gap-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-stone-300 animate-bounce"></div>
                      <div className="w-1.5 h-1.5 rounded-full bg-stone-300 animate-bounce [animation-delay:0.2s]"></div>
                      <div className="w-1.5 h-1.5 rounded-full bg-stone-300 animate-bounce [animation-delay:0.4s]"></div>
                    </div>
                  </div>
                )}
              </div>

              <form onSubmit={handleChatSend} className="p-6 border-t border-stone-100 bg-stone-50 flex gap-3">
                <input 
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Ask your sources..."
                  className="flex-1 bg-white border border-stone-200 rounded-2xl px-6 py-4 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all shadow-sm"
                />
                <button type="submit" className="bg-stone-900 text-white p-4 rounded-2xl hover:bg-stone-800 transition-all shadow-lg">
                  <Send className="w-5 h-5" />
                </button>
              </form>
            </div>
          </div>
        ) : (
          <div className="h-full overflow-y-auto p-8 bg-white">
            <div className="max-w-4xl mx-auto">
              <div className="flex items-center gap-2 mb-8 border-b border-stone-100 pb-4">
                <FileText className="w-5 h-5 text-emerald-500" />
                <h2 className="text-xl font-black uppercase tracking-tighter text-stone-800">Persistent Notepad</h2>
              </div>
              <StenoPad 
                notes={notepadNotes}
                onAddNote={onAddNote}
                onUpdateNote={onUpdateNote}
                onDeleteNote={onDeleteNote}
                noteType="raw"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default WorkspaceView;
