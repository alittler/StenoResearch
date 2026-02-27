import React, { useState, useEffect, useRef } from 'react';
import { ProjectNote } from '../types';
import { chatWithNotebook } from '../services/geminiService';
import Markdown from 'react-markdown';
import ReactQuill from 'react-quill-new';
import { Pin, Send, Sparkles, BookOpen, FileText } from 'lucide-react';

interface WorkspaceViewProps {
  notebookId: string;
  notes: ProjectNote[];
  onAddNote: (content: string, type: ProjectNote['type'], extra?: Partial<ProjectNote>) => void;
  onUpdateNote: (id: string, updates: Partial<ProjectNote>) => void;
}

const WorkspaceView: React.FC<WorkspaceViewProps> = ({ 
  notebookId, 
  notes, 
  onAddNote,
  onUpdateNote
}) => {
  const notepadNote = notes.find(n => n.type === 'raw' && n.notebookId === notebookId);
  const [notepadContent, setNotepadContent] = useState(notepadNote?.content || '');
  const [chatMessages, setChatMessages] = useState<{role: 'user' | 'model', text: string}[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const chatScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (notepadNote && notepadNote.content !== notepadContent) {
      setNotepadContent(notepadNote.content);
    }
  }, [notepadNote?.id]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (notepadNote) {
        if (notepadContent !== notepadNote.content) {
          onUpdateNote(notepadNote.id, { content: notepadContent });
        }
      } else if (notepadContent.trim()) {
        onAddNote(notepadContent, 'raw');
      }
    }, 1000);
    return () => clearTimeout(timer);
  }, [notepadContent]);

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

    const strippedNotepad = notepadContent.replace(/<[^>]*>?/gm, '');
    const sourcesContext = notes
      .filter(n => n.type === 'ledger' || n.type === 'research')
      .map(n => `[SOURCE: ${n.title || 'Note'}] ${n.content}`)
      .join('\n\n');
    
    const fullContext = `NOTEPAD CONTENT:\n${strippedNotepad}\n\nSOURCES:\n${sourcesContext}`;

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
    const htmlText = `<p><strong>Pinned Insight:</strong></p><blockquote>${text.split('\n').join('<br/>')}</blockquote><p><br/></p>`;
    setNotepadContent(prev => prev + htmlText);
  };

  return (
    <div className="flex h-[calc(100vh-100px)] gap-6 p-6 animate-fade-in overflow-hidden">
      <div className="flex-1 flex flex-col bg-white rounded-3xl shadow-sm border border-stone-200 overflow-hidden">
        <div className="p-4 border-b border-stone-100 bg-stone-50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-blue-500" />
            <h2 className="text-[10px] font-black uppercase tracking-widest text-stone-500">Grounded Assistant</h2>
          </div>
          <div className="flex items-center gap-2">
            <BookOpen className="w-3 h-3 text-stone-400" />
            <span className="text-[8px] font-bold text-stone-400 uppercase tracking-tighter">Sources Active</span>
          </div>
        </div>

        <div ref={chatScrollRef} className="flex-1 overflow-y-auto p-6 space-y-6 no-scrollbar">
          {chatMessages.map((msg, i) => (
            <div key={i} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} group`}>
              <div className={`max-w-[90%] p-4 rounded-2xl text-sm leading-relaxed ${
                msg.role === 'user' ? 'bg-stone-900 text-white rounded-tr-none' : 'bg-stone-50 text-stone-800 rounded-tl-none border border-stone-100'
              }`}>
                <div className="markdown-body">
                  <Markdown>{msg.text}</Markdown>
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
        </div>

        <form onSubmit={handleChatSend} className="p-4 border-t border-stone-100 bg-stone-50 flex gap-2">
          <input 
            type="text"
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            placeholder="Ask your sources..."
            className="flex-1 bg-white border border-stone-200 rounded-xl px-4 py-2 text-xs focus:ring-2 focus:ring-blue-500 outline-none transition-all"
          />
          <button type="submit" className="bg-stone-900 text-white p-2 rounded-xl hover:bg-stone-800 transition-all">
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>

      <div className="flex-1 flex flex-col bg-white rounded-3xl shadow-sm border border-stone-200 overflow-hidden">
        <div className="p-4 border-b border-stone-100 bg-stone-50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-emerald-500" />
            <h2 className="text-[10px] font-black uppercase tracking-widest text-stone-500">Persistent Notepad</h2>
          </div>
          <span className="text-[8px] font-bold text-stone-300 uppercase tracking-widest">Auto-saving</span>
        </div>
        <div className="flex-1 overflow-y-auto no-scrollbar paper-texture">
          <ReactQuill 
            theme="snow"
            value={notepadContent}
            onChange={setNotepadContent}
            placeholder="Start writing..."
            className="h-full"
          />
        </div>
      </div>
    </div>
  );
};

export default WorkspaceView;
