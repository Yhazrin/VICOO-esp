import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';

const API_BASE = '/api';

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export const AIAssistantBall: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg: Message = { role: 'user', content: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await axios.post(`${API_BASE}/ai/chat`, {
        messages: [...messages, userMsg],
        context: 'general'
      });
      
      const reply = response.data?.data?.reply || '抱歉，我现在无法回答。';
      setMessages(prev => [...prev, { role: 'assistant', content: reply }]);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'system', content: '连接助手失败，请稍后再试。' }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-8 right-8 z-50 flex flex-col items-end">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20, rotateY: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0, rotateY: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20, rotateY: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="mb-4 w-80 md:w-96 h-[500px] bg-[#F5F0E8] border-2 border-[#1A1A16] shadow-[8px_8px_0px_rgba(26,26,22,0.1)] flex flex-col overflow-hidden origin-bottom-right"
            style={{ fontFamily: 'var(--font-mono)' }}
          >
            {/* Masthead Header */}
            <div className="bg-[#1A1A16] text-[#F5F0E8] p-4 flex justify-between items-center border-b border-[#1A1A16]">
              <div>
                <h3 className="text-xs uppercase tracking-[0.2em] font-bold">VICOO Assistant</h3>
                <p className="text-[10px] opacity-60">Vol. 1 — Issue 01 — AI Edition</p>
              </div>
              <button onClick={() => setIsOpen(false)} className="text-xl hover:opacity-70">×</button>
            </div>

            {/* Chat Content */}
            <div 
              ref={scrollRef}
              className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-[#1A1A16]"
            >
              {messages.length === 0 && (
                <div className="text-center py-10 px-4">
                  <p className="text-sm italic opacity-60">"Art is the most intense mode of individualism that the world has known."</p>
                  <p className="mt-4 text-xs">你好！我是 VICOO 智能助手。关于捐赠流程、艺术活动或可持续时尚，欢迎向我提问。</p>
                </div>
              )}
              {messages.map((m, i) => (
                <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] p-3 text-xs leading-relaxed ${
                    m.role === 'user' 
                      ? 'bg-[#EDE6D6] border border-[#1A1A16] text-[#1A1A16]' 
                      : 'bg-white border border-[#1A1A16] text-[#1A1A16]'
                  } ${m.role === 'system' ? 'opacity-50 italic border-none bg-transparent' : ''}`}>
                    {m.content}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="p-3 text-xs animate-pulse">... Typing ...</div>
                </div>
              )}
            </div>

            {/* Input Area */}
            <div className="p-4 border-t border-[#1A1A16] bg-[#EDE6D6]">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="Type your message..."
                  className="flex-1 bg-white border border-[#1A1A16] px-3 py-2 text-xs focus:outline-none placeholder:opacity-40"
                />
                <button 
                  onClick={handleSend}
                  disabled={isLoading}
                  className="bg-[#1A1A16] text-[#F5F0E8] px-4 py-2 text-[10px] uppercase tracking-widest hover:opacity-90 transition-opacity"
                >
                  Send
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Ball Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="w-14 h-14 bg-[#1A1A16] text-[#F5F0E8] rounded-full flex items-center justify-center shadow-lg border-2 border-[#F5F0E8] group relative overflow-hidden"
      >
        <div className="absolute inset-0 bg-[#8B3A2A] translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
        <span className="relative z-10 text-xs font-bold tracking-tighter">AI</span>
      </motion.button>
    </div>
  );
};
