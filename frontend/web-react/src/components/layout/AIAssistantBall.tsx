import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
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

// Strip <think>... blocks from AI response before rendering
const stripThink = (content: string) =>
  content.replace(/<think>[\s\S]*?<\/think>/g, '').trim();

type AIAssistantTheme = {
  panel: string;
  header: string;
  subtitle: string;
  body: string;
  inputPanel: string;
  input: string;
  suggestion: string;
  userBubble: string;
  assistantBubble: string;
  typing: string;
  sendButton: string;
  ball: string;
  ballRing: string;
  ballLabel: string;
  hoverOverlay: string;
};

const getAssistantTheme = (isImpactSurface: boolean): AIAssistantTheme =>
  isImpactSurface
    ? {
        panel:
          'bg-gradient-to-br from-emerald-950 via-teal-900 to-cyan-900 border border-emerald-200/60 shadow-[0_20px_60px_rgba(6,182,212,0.35)]',
        header: 'bg-emerald-300/10 text-emerald-50 border-b border-emerald-200/40',
        subtitle: 'text-emerald-100/80',
        body: 'text-emerald-50',
        inputPanel: 'border-t border-emerald-200/40 bg-emerald-950/55',
        input: 'bg-emerald-950/70 border border-emerald-200/60 text-emerald-50 placeholder:text-emerald-100/60 focus:ring-1 focus:ring-emerald-200/70',
        suggestion:
          'text-emerald-50 border border-emerald-200/60 bg-emerald-800/40 hover:bg-emerald-700/60',
        userBubble: 'bg-emerald-300/20 border border-emerald-100/60 text-emerald-50',
        assistantBubble: 'bg-cyan-300/15 border border-cyan-100/70 text-cyan-50',
        typing: 'text-emerald-100/85',
        sendButton: 'bg-cyan-300 text-emerald-950 hover:bg-cyan-200',
        ball: 'bg-gradient-to-br from-emerald-400 via-teal-300 to-cyan-300',
        ballRing: 'border border-emerald-100/80 shadow-[0_0_0_2px_rgba(255,255,255,0.14)]',
        ballLabel: 'text-emerald-950',
        hoverOverlay: 'bg-emerald-100/35',
      }
    : {
        panel:
          'bg-gradient-to-br from-slate-950 via-indigo-950 to-blue-900 border border-sky-200/60 shadow-[0_20px_60px_rgba(56,189,248,0.3)]',
        header: 'bg-sky-300/10 text-sky-50 border-b border-sky-200/40',
        subtitle: 'text-sky-100/80',
        body: 'text-sky-50',
        inputPanel: 'border-t border-sky-200/40 bg-indigo-950/60',
        input: 'bg-slate-950/70 border border-sky-200/60 text-sky-50 placeholder:text-sky-100/60 focus:ring-1 focus:ring-sky-200/70',
        suggestion:
          'text-sky-50 border border-sky-200/60 bg-blue-900/40 hover:bg-blue-800/60',
        userBubble: 'bg-blue-300/20 border border-blue-100/70 text-blue-50',
        assistantBubble: 'bg-sky-300/15 border border-sky-100/70 text-sky-50',
        typing: 'text-sky-100/85',
        sendButton: 'bg-sky-300 text-slate-950 hover:bg-sky-200',
        ball: 'bg-gradient-to-br from-sky-300 via-blue-300 to-indigo-300',
        ballRing: 'border border-sky-100/80 shadow-[0_0_0_2px_rgba(255,255,255,0.14)]',
        ballLabel: 'text-slate-950',
        hoverOverlay: 'bg-sky-100/35',
      };

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
  const isImpactSurface = impactMode || route.startsWith('/impact');
  const suggestions = getAIAssistantSuggestions(isImpactSurface, route);
  const assistantMetadata = getAIAssistantMetadata(isImpactSurface, route);
  const theme = getAssistantTheme(isImpactSurface);

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
            className={`mb-4 w-80 md:w-96 h-[500px] flex flex-col overflow-hidden origin-bottom-right backdrop-blur-sm ${theme.panel}`}
            style={{ fontFamily: 'var(--font-mono)' }}
          >
            {/* Masthead Header */}
            <div className={`p-4 flex justify-between items-center ${theme.header}`}>
              <div>
                <h3 className="text-xs uppercase tracking-[0.2em] font-bold">{t('aiAssistant.ballTitle')}</h3>
                <p className={`text-[10px] ${theme.subtitle}`}>
                  {isImpactSurface ? `Impact · ${t('aiAssistant.ballSubtitle')}` : `Uniqlo · ${t('aiAssistant.ballSubtitle')}`}
                </p>
              </div>
              <button onClick={() => setIsOpen(false)} className="text-xl hover:opacity-70">×</button>
            </div>

            {/* Chat Content */}
              <div 
                ref={scrollRef}
                className={`flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin ${theme.body}`}
              >
              {messages.length === 0 && (
                <div className="text-center py-10 px-4">
                  <p className={`text-sm italic ${theme.subtitle}`}>{t('aiAssistant.emptyQuote')}</p>
                  <p className="mt-4 text-xs text-white">{t('aiAssistant.greeting')}</p>
                  <div className="mt-4 flex flex-wrap justify-center gap-2">
                    {suggestions.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => void handleSend(t(`aiAssistant.suggestions.${item.id}.prompt`))}
                        className={`text-[10px] px-3 py-1 transition-colors ${theme.suggestion}`}
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
                      ? theme.userBubble 
                      : theme.assistantBubble
                  } ${m.role === 'system' ? 'opacity-50 italic border-none bg-transparent' : ''}`}>
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{m.role === 'assistant' ? stripThink(m.content) : m.content}</ReactMarkdown>
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
                  <div className={`p-3 text-xs animate-pulse ${theme.typing}`}>{t('aiAssistant.typing')}</div>
                </div>
              )}
            </div>

            {/* Input Area */}
            <div className={`p-4 ${theme.inputPanel}`}>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                  placeholder={t('aiAssistant.placeholder')}
                  className={`flex-1 px-3 py-2 text-xs focus:outline-none ${theme.input}`}
                />
                <button
                  type="button"
                  onClick={() => {
                    void handleSend();
                  }}
                  disabled={isLoading}
                  className={`px-4 py-2 text-[10px] uppercase tracking-widest transition-colors ${theme.sendButton}`}
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
        className={`w-14 h-14 rounded-full flex items-center justify-center shadow-lg group relative overflow-hidden ${theme.ball} ${theme.ballRing}`}
      >
        <div className={`absolute inset-0 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ${theme.hoverOverlay}`}></div>
        <span className={`relative z-10 text-xs font-bold tracking-tighter ${theme.ballLabel}`}>
          {isImpactSurface ? 'AI+' : 'AI'}
        </span>
      </motion.button>
    </div>
  );
};
