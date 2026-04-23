import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { aiAssistantApi, type AIChatMessage } from '@/services/aiAssistant';
import { useUIStore } from '@/stores/uiStore';
import { getAIAssistantMetadata, getAIAssistantSuggestions } from '@/config/aiAssistantScenarios';
import { sanitizeAssistantContent } from '@/utils/aiContent';

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
}

let _msgId = 0;
const nextMsgId = () => `msg-${++_msgId}`;

type AIAssistantTheme = {
  panel: string;
  header: string;
  subtitle: string;
  body: string;
  title: string;
  bodyText: string;
  inputPanel: string;
  input: string;
  suggestion: string;
  userBubble: string;
  assistantBubble: string;
  systemBubble: string;
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
          'bg-gradient-to-br from-[#f8f0e1] via-[#f5e6cc] to-[#eed5af] border border-[#7f4f2a]/35 shadow-[0_20px_60px_rgba(139,89,42,0.28)]',
        header: 'bg-gradient-to-r from-[#6b321a] to-[#8f4a23] text-[#fff7ea] border-b border-[#b77749]/40',
        subtitle: 'text-[#ffe9cc]',
        body: 'text-[#332217]',
        title: 'font-display tracking-[0.14em]',
        bodyText: 'text-[#342317]',
        inputPanel: 'border-t border-[#9b643f]/35 bg-[#f8ecd9]/85',
        input: 'bg-[#fff8ec] border border-[#9b643f]/55 text-[#2d1e14] placeholder:text-[#7a553f]/70 focus:ring-1 focus:ring-[#8f4a23]/40',
        suggestion:
          'text-[#4a2d1d] border border-[#9b643f]/45 bg-[#fff4df] hover:bg-[#ffe7c7]',
        userBubble: 'bg-[#b55f34] border border-[#8c4423]/60 text-[#fff7ec]',
        assistantBubble: 'bg-[#fff7ea] border border-[#c88b58]/50 text-[#3b2718]',
        systemBubble: 'text-[#6e4b35]',
        typing: 'text-[#6f4a34]',
        sendButton: 'bg-[#7f3c20] text-[#fff4e3] hover:bg-[#6d3118]',
        ball: 'bg-gradient-to-br from-[#f6ba6f] via-[#e8894a] to-[#be5d2e]',
        ballRing: 'border border-[#fff3e2] shadow-[0_0_0_2px_rgba(255,233,204,0.45)]',
        ballLabel: 'text-[#fff4e3]',
        hoverOverlay: 'bg-[#fff2dc]/35',
      }
    : {
        panel:
          'bg-gradient-to-br from-[#fbf2e3] via-[#f7e4c5] to-[#f0cca4] border border-[#7f4f2a]/35 shadow-[0_20px_60px_rgba(130,82,41,0.24)]',
        header: 'bg-gradient-to-r from-[#5e2d1b] to-[#7a4022] text-[#fff7ea] border-b border-[#b77749]/40',
        subtitle: 'text-[#ffe9cc]',
        body: 'text-[#332217]',
        title: 'font-display tracking-[0.14em]',
        bodyText: 'text-[#342317]',
        inputPanel: 'border-t border-[#9b643f]/35 bg-[#f8ecd9]/80',
        input: 'bg-[#fff8ec] border border-[#9b643f]/55 text-[#2d1e14] placeholder:text-[#7a553f]/70 focus:ring-1 focus:ring-[#8f4a23]/40',
        suggestion:
          'text-[#4a2d1d] border border-[#9b643f]/45 bg-[#fff4df] hover:bg-[#ffe7c7]',
        userBubble: 'bg-[#9e4f2d] border border-[#7f3d21]/60 text-[#fff6eb]',
        assistantBubble: 'bg-[#fff7ea] border border-[#c88b58]/50 text-[#3b2718]',
        systemBubble: 'text-[#6e4b35]',
        typing: 'text-[#6f4a34]',
        sendButton: 'bg-[#70351c] text-[#fff4e3] hover:bg-[#5e2b16]',
        ball: 'bg-gradient-to-br from-[#f5c37f] via-[#e99b58] to-[#c56735]',
        ballRing: 'border border-[#fff3e2] shadow-[0_0_0_2px_rgba(255,233,204,0.45)]',
        ballLabel: 'text-[#fff4e3]',
        hoverOverlay: 'bg-[#fff2dc]/35',
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
            style={{ fontFamily: '"Smiley Sans", "Source Sans Pro", "Noto Serif SC", serif' }}
          >
            {/* Masthead Header */}
            <div className={`p-4 flex justify-between items-center ${theme.header}`}>
              <div>
                <h3 className={`text-xs uppercase font-bold ${theme.title}`}>{t('aiAssistant.ballTitle')}</h3>
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
                  <p className={`mt-4 text-xs ${theme.bodyText}`}>{t('aiAssistant.greeting')}</p>
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
                  } ${m.role === 'system' ? `opacity-70 italic border-none bg-transparent ${theme.systemBubble}` : ''} [&_p]:text-current [&_li]:text-current [&_ol]:text-current [&_ul]:text-current [&_strong]:text-current [&_em]:text-current [&_code]:text-current [&_a]:text-current [&_a]:underline [&_a]:decoration-current [&_a:hover]:opacity-80`}>
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{m.role === 'assistant' ? sanitizeAssistantContent(m.content) : m.content}</ReactMarkdown>
                  </div>

                  {m.role === 'assistant' && (
                    <div className="flex items-center gap-2 ml-2">
                      <button onClick={() => handleFeedback(m.id, true)} aria-label={t('aiAssistant.feedbackHelpfulAria')} className="text-green-600">👍</button>
                      <button onClick={() => handleFeedback(m.id, false)} aria-label={t('aiAssistant.feedbackNotHelpfulAria')} className="text-red-600">👎</button>
                      {feedbackMap[m.id] === 'submitting' && <span className="text-xs ml-2">...</span>}
                      {feedbackMap[m.id] === 'sent' && <span className="text-xs ml-2 text-[#5b6a2d]">{t('aiAssistant.feedbackSubmitted')}</span>}
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
