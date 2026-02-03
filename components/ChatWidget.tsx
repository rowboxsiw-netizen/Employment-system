
import React, { useState, useRef, useEffect } from 'react';
import { 
  MessageSquare, 
  X, 
  Send, 
  Sparkles, 
  Mic, 
  Bot,
  ExternalLink,
  ChevronDown,
  Info
} from 'lucide-react';
import { chatWithNexus } from '../geminiService';
import toast from 'react-hot-toast';

interface Message {
  role: 'user' | 'bot';
  content: string;
  sources?: { title: string; uri: string }[];
}

const ChatWidget: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [messages, isLoading]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setIsLoading(true);

    try {
      const result = await chatWithNexus(userMsg);
      
      const sources = result.groundingChunks
        ?.filter(chunk => chunk.web)
        .map(chunk => ({
          title: chunk.web?.title || 'External Source',
          uri: chunk.web?.uri || '#'
        })) || [];

      setMessages(prev => [...prev, { 
        role: 'bot', 
        content: result.text,
        sources: sources.length > 0 ? sources : undefined
      }]);
    } catch (err: any) {
      console.error(err);
      toast.error("AI Assistant unavailable. Check API credentials.");
      setMessages(prev => [...prev, { 
        role: 'bot', 
        content: "I'm currently unable to process requests. This is usually due to an invalid or missing API key in the system environment." 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col items-end">
      {isOpen && (
        <div className="w-[400px] h-[600px] bg-white rounded-3xl shadow-2xl flex flex-col mb-4 overflow-hidden border border-slate-200 animate-in slide-in-from-bottom-4 fade-in duration-300">
          {/* Header */}
          <div className="p-4 bg-slate-900 text-white flex items-center justify-between shadow-lg">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
                <Sparkles size={20} className="text-white" />
              </div>
              <div>
                <h3 className="font-bold text-sm tracking-tight">Nexus Intelligence</h3>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                  <span className="text-[10px] text-slate-400 font-medium uppercase tracking-widest">Active System</span>
                </div>
              </div>
            </div>
            <button 
              onClick={() => setIsOpen(false)}
              className="p-2 hover:bg-slate-800 rounded-xl transition-colors text-slate-400"
            >
              <ChevronDown size={20} />
            </button>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-6 bg-slate-50 custom-scrollbar">
            {messages.length === 0 && (
              <div className="text-center py-12 px-6">
                <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4 border border-slate-100 shadow-sm">
                  <Bot size={32} className="text-indigo-600" />
                </div>
                <h4 className="font-bold text-slate-800 text-lg">System Ready</h4>
                <p className="text-slate-500 text-sm mt-2 leading-relaxed">
                  I can analyze workforce data, extract form details, or search for current labor regulations.
                </p>
                <div className="mt-6 flex flex-wrap justify-center gap-2">
                  {['Summarize staff', 'Search labor laws', 'Help with onboarding'].map(hint => (
                    <button 
                      key={hint}
                      onClick={() => setInput(hint)}
                      className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-600 hover:border-indigo-500 hover:text-indigo-600 transition-all"
                    >
                      {hint}
                    </button>
                  ))}
                </div>
              </div>
            )}
            
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in duration-300`}>
                <div className={`max-w-[85%] group`}>
                  <div className={`p-4 rounded-2xl text-sm leading-relaxed shadow-sm ${
                    msg.role === 'user' 
                    ? 'bg-indigo-600 text-white rounded-tr-none' 
                    : 'bg-white border border-slate-200 text-slate-800 rounded-tl-none'
                  }`}>
                    {msg.content}
                    
                    {msg.sources && (
                      <div className="mt-4 pt-4 border-t border-slate-100">
                        <p className="text-[10px] font-bold text-slate-400 uppercase mb-2 flex items-center gap-1">
                          <ExternalLink size={10} /> Reference Materials
                        </p>
                        <div className="space-y-1.5">
                          {msg.sources.map((src, idx) => (
                            <a 
                              key={idx} 
                              href={src.uri} 
                              target="_blank" 
                              rel="noreferrer"
                              className="flex items-center gap-2 text-[11px] text-indigo-600 hover:underline truncate"
                            >
                              <div className="w-1 h-1 bg-indigo-400 rounded-full"></div>
                              {src.title}
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white border border-slate-200 p-4 rounded-2xl rounded-tl-none flex gap-1.5 shadow-sm">
                  <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                  <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <div className="p-4 bg-white border-t border-slate-100">
            <div className="relative flex items-center gap-3 bg-slate-100 p-1.5 rounded-2xl focus-within:ring-2 focus-within:ring-indigo-500/20 transition-all">
              <input 
                type="text" 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Type your query..."
                className="flex-1 bg-transparent border-none px-3 py-2 text-sm focus:outline-none placeholder:text-slate-400"
                disabled={isLoading}
              />
              <button 
                onClick={handleSend}
                className="p-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all disabled:opacity-50 shadow-md shadow-indigo-200 active:scale-95"
                disabled={isLoading}
              >
                <Send size={18} />
              </button>
            </div>
            <p className="text-[10px] text-center text-slate-400 mt-2 font-medium">
              Information can be grounded in Google Search.
            </p>
          </div>
        </div>
      )}

      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-2xl transition-all duration-300 transform group ${
          isOpen 
          ? 'bg-slate-900 text-white rotate-90 scale-90' 
          : 'bg-indigo-600 text-white hover:scale-110 active:scale-95'
        }`}
      >
        {isOpen ? <X size={24} /> : (
          <div className="relative">
            <MessageSquare size={24} className="group-hover:animate-bounce" />
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 border-2 border-indigo-600 rounded-full"></span>
          </div>
        )}
      </button>
    </div>
  );
};

export default ChatWidget;
