import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { aiAssistantApi, type AIChatMessage } from '@/services/aiAssistant';
import { useUIStore } from '@/stores/uiStore';
import { getAIAssistantMetadata, getAIAssistantSuggestions } from '@/config/aiAssistantScenarios';

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
}

let _msgId = 0;
const nextMsgId = () => `msg-${++_msgId}`;

export const AIAssistantBall: React.FC = () => {
  const { t } = useTranslation();
  const { impactMode } = useUIStore();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [feedbackMap, setFeedbackMap] = useState<Record<string, 'idle'|'submitting'|'sent'|'escalated'>>({});
  const scrollRef = useRef<HTMLDivElement>(null);
  const route = window.location.pathname;
  const suggestions = getAIAssistantSuggestions(impactMode, route);
  const assistantMetadata = getAIAssistantMetadata(impactMode, route);

  const handleFeedback = async (messageId: string, isHelpful: boolean) => {
    if (feedbackMap[messageId] === 'submitting') return;
    setFeedbackMap(prev => ({ ...prev, [messageId]: 'submitting' }));
    try {
      const chatMessages: AIChatMessage[] = messages.map(m => ({ role: m.role as AIChatMessage['role'], content: m.content }));
      const res = await aiAssistantApi.feedback(
        isHelpful,
        chatMessages,
        assistantMetadata,
        isHelpful ? undefined : t('aiAssistant.feedbackNotHelpfulNote')
      );
      if (isHelpful) {
        setFeedbackMap(prev => ({ ...prev, [messageId]: 'sent' }));
      } else {
        setFeedbackMap(prev => ({ ...prev, [messageId]: res && res.escalated ? 'escalated' : 'sent' }));
      }
    } catch (e) {
      setFeedbackMap(prev => ({ ...prev, [messageId]: 'sent' }));
    }
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async (overrideText?: string) => {
    const text = (overrideText ?? input).trim();
    if (!text || isLoading) return;

    const userMsg: Message = { id: nextMsgId(), role: 'user', content: text };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const chatMessages: AIChatMessage[] = [...messages, userMsg].map((m) => ({
        role: m.role as AIChatMessage['role'],
        content: m.content,
      }));
      const result = await aiAssistantApi.chat(chatMessages, 'general', assistantMetadata);
      const reply = result.reply || t('aiAssistant.replyError');
      setMessages(prev => [...prev, { id: nextMsgId(), role: 'assistant', content: reply }]);
    } catch {
      setMessages(prev => [...prev, { id: nextMsgId(), role: 'system', content: t('aiAssistant.connectionError') }]);
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
                <h3 className="text-xs uppercase tracking-[0.2em] font-bold">{t('aiAssistant.ballTitle')}</h3>
                <p className="text-[10px] opacity-60">{t('aiAssistant.ballSubtitle')}</p>
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
                  <p className="text-sm italic opacity-60">{t('aiAssistant.emptyQuote')}</p>
                  <p className="mt-4 text-xs">{t('aiAssistant.greeting')}</p>
                  <div className="mt-4 flex flex-wrap justify-center gap-2">
                    {suggestions.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => void handleSend(t(`aiAssistant.suggestions.${item.id}.prompt`))}
                        className="text-[10px] px-3 py-1 border border-[#1A1A16] bg-white hover:bg-[#EDE6D6]"
                      >
                        {t(`aiAssistant.suggestions.${item.id}.label`)}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {messages.map((m) => (
                <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] p-3 text-xs leading-relaxed ${
                    m.role === 'user' 
                      ? 'bg-[#EDE6D6] border border-[#1A1A16] text-[#1A1A16]' 
                      : 'bg-white border border-[#1A1A16] text-[#1A1A16]'
                  } ${m.role === 'system' ? 'opacity-50 italic border-none bg-transparent' : ''}`}>
                    {m.content}
                  </div>

                  {m.role === 'assistant' && (
                    <div className="flex items-center gap-2 ml-2">
                      <button onClick={() => handleFeedback(m.id, true)} aria-label={t('aiAssistant.feedbackHelpfulAria')} className="text-green-600">👍</button>
                      <button onClick={() => handleFeedback(m.id, false)} aria-label={t('aiAssistant.feedbackNotHelpfulAria')} className="text-red-600">👎</button>
                      {feedbackMap[m.id] === 'submitting' && <span className="text-xs ml-2">...</span>}
                      {feedbackMap[m.id] === 'sent' && <span className="text-xs ml-2 text-green-600">{t('aiAssistant.feedbackSubmitted')}</span>}
                      {feedbackMap[m.id] === 'escalated' && <span className="text-xs ml-2 text-[#8B3A2A]">{t('aiAssistant.feedbackEscalated')}</span>}
                    </div>
                  )}
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="p-3 text-xs animate-pulse">{t('aiAssistant.typing')}</div>
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
                  onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                  placeholder={t('aiAssistant.placeholder')}
                  className="flex-1 bg-white border border-[#1A1A16] px-3 py-2 text-xs focus:outline-none placeholder:opacity-40"
                />
                <button
                  type="button"
                  onClick={() => {
                    void handleSend();
                  }}
                  disabled={isLoading}
                  className="bg-[#1A1A16] text-[#F5F0E8] px-4 py-2 text-[10px] uppercase tracking-widest hover:opacity-90 transition-opacity"
                >
                  {t('aiAssistant.send')}
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
