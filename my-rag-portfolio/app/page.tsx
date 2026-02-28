'use client';

import { useState, useRef, useEffect } from 'react';
import { 
  Send, Bot, User, Loader2, BookOpen, Trash2, ShieldCheck, Database, ThumbsUp, ThumbsDown 
} from 'lucide-react';

interface Source { file: string; page: number; }
interface Message { role: 'user' | 'assistant'; content: string; sources?: Source[]; }

export default function Chat() {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState('gpt-4o');
  const [ratedMessages, setRatedMessages] = useState<Record<number, string>>({});
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, isLoading]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMsg: Message = { role: 'user', content: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: input, modelId: selectedModel }),
      });
      const data = await response.json();
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: data.reply || data.content, 
        sources: data.sources 
      }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'assistant', content: "⚠️ Service Offline. Check Python console." }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFeedback = async (index: number, rating: 'up' | 'down') => {
    try {
      await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rating,
          query: messages[index - 1]?.content || "",
          response: messages[index].content
        }),
      });
      setRatedMessages(prev => ({ ...prev, [index]: rating }));
    } catch (err) { console.error("Feedback failed", err); }
  };

  return (
    <div className="flex flex-col h-screen max-h-screen bg-[#020617] text-slate-50 overflow-hidden font-sans">
      <header className="flex-none px-6 py-4 border-b border-slate-800/50 bg-[#020617]/80 backdrop-blur-md">
        <div className="flex items-center justify-between max-w-5xl mx-auto w-full">
          <div className="flex items-center gap-3">
            <ShieldCheck className="w-5 h-5 text-indigo-400" />
            <div>
              <h1 className="text-xs font-bold tracking-widest uppercase italic">Azure GenAI Workbench</h1>
              <p className="text-[10px] text-emerald-500 font-bold tracking-tighter uppercase">● RAG Pipeline Active</p>
            </div>
          </div>
          <button onClick={() => setMessages([])} className="p-2 hover:bg-slate-800 rounded-lg text-slate-500 transition-colors">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </header>

      <main ref={scrollRef} className="flex-1 overflow-y-auto p-4 md:p-8 space-y-8 scroll-smooth">
        <div className="max-w-3xl mx-auto">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center pt-24 opacity-40">
              <Database className="w-12 h-12 mb-4 text-indigo-500" />
              <p className="text-sm font-medium tracking-wide">Vector Chunks Ready for Query</p>
            </div>
          )}
          {messages.map((m, i) => (
            <div key={i} className={`flex gap-4 mb-10 ${m.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in`}>
              <div className={`flex flex-col gap-3 max-w-[85%] ${m.role === 'user' ? 'items-end' : 'items-start'}`}>
                <div className={`px-5 py-3 rounded-2xl text-[15px] leading-relaxed shadow-lg ${
                  m.role === 'user' ? 'bg-indigo-600 text-white rounded-tr-none' : 'bg-slate-900 border border-slate-800 text-slate-200 rounded-tl-none'
                }`}>
                  {m.content}
                </div>
                {m.role === 'assistant' && (
                  <div className="w-full space-y-4">
                    <div className="flex flex-wrap gap-2">
                      {m.sources?.map((s, idx) => (
                        <div key={idx} className="flex items-center gap-1.5 px-2 py-1 bg-indigo-500/10 border border-indigo-500/20 rounded text-[10px] text-indigo-300 font-bold">
                          <BookOpen className="w-3 h-3" />
                          <span>{s.file} (p.{s.page})</span>
                        </div>
                      ))}
                    </div>
                    <div className="flex items-center gap-4 border-t border-slate-800/50 pt-3">
                      <button onClick={() => handleFeedback(i, 'up')} className={`p-1.5 rounded transition-colors ${ratedMessages[i] === 'up' ? 'text-emerald-400 bg-emerald-500/10' : 'text-slate-600 hover:text-emerald-400'}`}>
                        <ThumbsUp className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleFeedback(i, 'down')} className={`p-1.5 rounded transition-colors ${ratedMessages[i] === 'down' ? 'text-rose-400 bg-rose-500/10' : 'text-slate-600 hover:text-rose-400'}`}>
                        <ThumbsDown className="w-4 h-4" />
                      </button>
                      {ratedMessages[i] && <span className="text-[9px] font-black uppercase text-indigo-400 animate-pulse">Feedback Logged</span>}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
          {isLoading && <Loader2 className="w-5 h-5 animate-spin text-indigo-500 mt-4" />}
        </div>
      </main>

      <footer className="flex-none p-4 md:p-10 bg-[#020617]/80 border-t border-slate-800/40 backdrop-blur-xl">
        <div className="max-w-3xl mx-auto relative">
          <form onSubmit={sendMessage} className="flex items-center bg-slate-900/50 border border-slate-700 rounded-[2rem] p-1.5 focus-within:border-indigo-500 shadow-2xl transition-all">
            <input
              autoFocus
              className="flex-1 bg-transparent pl-5 pr-2 py-4 text-slate-100 placeholder-slate-600 focus:outline-none text-base font-medium"
              placeholder="Query technical specifications..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
            />
            <div className="flex items-center gap-2 pr-2">
              <select 
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                className="bg-slate-800 text-[10px] font-black text-slate-400 uppercase px-3 py-2 rounded-xl border border-slate-700 focus:outline-none cursor-pointer"
              >
                <option value="gpt-4o">GPT-4o</option>
                <option value="gpt-4o-mini">Mini</option>
                <option value="ollama">Ollama</option>
              </select>
              <button type="submit" disabled={!input.trim() || isLoading} className="p-4 bg-indigo-600 text-white rounded-full hover:bg-indigo-500 disabled:opacity-20 shadow-xl transition-all">
                <Send className="w-5 h-5" />
              </button>
            </div>
          </form>
        </div>
      </footer>
    </div>
  );
}