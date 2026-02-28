import React, { useState, useRef, useEffect } from 'react';
import { chatWithNotebook } from '../services/geminiService';
import { Send, Sparkles, User, Bot } from 'lucide-react';
import Markdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import remarkGfm from 'remark-gfm';

interface ChatViewProps {
  context: string;
}

const ChatView: React.FC<ChatViewProps> = ({ context }) => {
  const [messages, setMessages] = useState<{role: 'user' | 'model', text: string}[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setIsLoading(true);

    try {
      const response = await chatWithNotebook(userMsg, context, messages);
      setMessages(prev => [...prev, { role: 'model', text: response }]);
    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, { role: 'model', text: "I encountered an error while processing your request." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto h-[calc(100vh-160px)] flex flex-col bg-white border border-stone-200 rounded-3xl shadow-sm overflow-hidden">
      <div className="p-4 border-b border-stone-100 bg-stone-50 flex items-center gap-2">
        <Sparkles className="w-4 h-4 text-blue-500" />
        <h2 className="text-xs font-black uppercase tracking-widest text-stone-500">Grounded Intelligence</h2>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-8 no-scrollbar">
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-20">
            <Bot className="w-16 h-16" />
            <p className="text-lg font-bold italic font-serif">Ask anything about your ledger...</p>
          </div>
        )}
        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${msg.role === 'user' ? 'bg-stone-900' : 'bg-blue-500'}`}>
              {msg.role === 'user' ? <User className="w-4 h-4 text-white" /> : <Bot className="w-4 h-4 text-white" />}
            </div>
            <div className={`max-w-[80%] p-4 rounded-2xl text-sm leading-relaxed ${msg.role === 'user' ? 'bg-stone-100 text-stone-800 rounded-tr-none' : 'bg-blue-50 text-stone-800 rounded-tl-none'}`}>
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
          </div>
        ))}
        {isLoading && (
          <div className="flex gap-4">
            <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center shrink-0 animate-pulse">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <div className="bg-blue-50 p-4 rounded-2xl rounded-tl-none flex gap-1">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-300 animate-bounce"></div>
              <div className="w-1.5 h-1.5 rounded-full bg-blue-300 animate-bounce [animation-delay:0.2s]"></div>
              <div className="w-1.5 h-1.5 rounded-full bg-blue-300 animate-bounce [animation-delay:0.4s]"></div>
            </div>
          </div>
        )}
      </div>

      <form onSubmit={handleSend} className="p-4 border-t border-stone-100 bg-stone-50 flex gap-2">
        <input 
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask your ledger..."
          className="flex-1 bg-white border border-stone-200 rounded-2xl px-6 py-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
        />
        <button 
          type="submit"
          disabled={!input.trim() || isLoading}
          className="bg-stone-900 text-white p-3 rounded-2xl hover:bg-stone-800 transition-all disabled:opacity-20"
        >
          <Send className="w-5 h-5" />
        </button>
      </form>
    </div>
  );
};

export default ChatView;
