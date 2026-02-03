
import React, { useState, useRef, useEffect } from 'react';
import { 
  MessageSquare, 
  X, 
  Send, 
  Sparkles, 
  Mic, 
  MicOff,
  Bot
} from 'lucide-react';
import { chatWithEMS } from '../geminiService';
import toast from 'react-hot-toast';

const ChatWidget: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{role: 'user' | 'bot', content: string}[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMsg = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setIsLoading(true);

    try {
      const response = await chatWithEMS(userMsg);
      setMessages(prev => [...prev, { role: 'bot', content: response || "I'm not sure how to answer that." }]);
    } catch (err: any) {
      console.error(err);
      setMessages(prev => [...prev, { role: 'bot', content: "I'm having trouble connecting to the AI service. Please ensure your API key is correctly configured." }]);
      toast.error("AI connection failed. Check your environment API_KEY.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVoiceToggle = () => {
    setIsListening(!isListening);
    if (!isListening) {
      toast('Voice control enabled (Simulation)', { icon: '🎙️' });
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col items-end">
      {isOpen && (
        <div className="w-[380px] h-[550px] bg-white rounded-3xl shadow-2xl flex flex-col mb-4 overflow-hidden animate-in slide-in-from-bottom-4 duration-300 border border-slate-200">
          <div className="p-4 bg-indigo-600 text-white flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                <Sparkles size={18} />
              </div>
              <div>
                <h3 className="font-bold">Nexus AI Assistant</h3>
                <p className="text-[10px] text-indigo-200 uppercase tracking-widest font-bold">Powered by Gemini Pro</p>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="p-1 hover:bg-white/10 rounded-lg transition-colors">
              <X size={20} />
            </button>
          </div>

          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
            {messages.length === 0 && (
              <div className="text-center py-10 px-4">
                <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4 border border-slate-100 shadow-sm">
                  <Bot size={32} className="text-indigo-600" />
                </div>
                <h4 className="font-bold text-slate-800">How can I help you?</h4>
                <p className="text-slate-500 text-sm mt-2">I can help with workforce analysis, employee onboarding, or explaining company benefits.</p>
              </div>
            )}
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] p-3 rounded-2xl text-sm ${
                  msg.role === 'user' 
                  ? 'bg-indigo-600 text-white rounded-tr-none' 
                  : 'bg-white border border-slate-200 text-slate-800 shadow-sm rounded-tl-none'
                }`}>
                  {msg.content}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white border border-slate-200 p-3 rounded-2xl flex gap-1">
                  <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce"></div>
                  <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce delay-100"></div>
                  <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce delay-200"></div>
                </div>
              </div>
            )}
          </div>

          <div className="p-4 bg-white border-t border-slate-100">
            <div className="relative flex items-center gap-2">
              <input 
                type="text" 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Ask me anything..."
                className="flex-1 bg-slate-100 border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
              />
              <button 
                onClick={handleSend}
                className="p-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-50"
                disabled={isLoading}
              >
                <Send size={18} />
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex gap-3">
        <button 
          onClick={handleVoiceToggle}
          className={`w-14 h-14 rounded-full flex items-center justify-center shadow-xl transition-all duration-300 ${
            isListening ? 'bg-red-500 text-white animate-pulse' : 'bg-white text-indigo-600 border border-slate-100'
          }`}
        >
          {isListening ? <MicOff size={24} /> : <Mic size={24} />}
        </button>
        <button 
          onClick={() => setIsOpen(!isOpen)}
          className={`w-14 h-14 rounded-full flex items-center justify-center shadow-xl transition-all duration-300 transform ${
            isOpen ? 'bg-slate-900 text-white rotate-90' : 'bg-indigo-600 text-white hover:scale-105'
          }`}
        >
          {isOpen ? <X size={24} /> : <MessageSquare size={24} />}
        </button>
      </div>
    </div>
  );
};

export default ChatWidget;
