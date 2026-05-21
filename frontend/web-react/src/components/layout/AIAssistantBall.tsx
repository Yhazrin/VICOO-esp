import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { aiAssistantApi, type AIChatMessage } from '@/services/aiAssistant';
import { useLocation } from 'react-router-dom';
import { useUIStore } from '@/stores/uiStore';
import { getAIAssistantMetadata, getAIAssistantSuggestions } from '@/config/aiAssistantScenarios';
import { sanitizeAssistantContentWithCards } from '@/utils/aiContent';
import { ChatProductCard, extractProductId } from './ChatProductCard';
import { ChatCampaignCard, extractCampaignId } from './ChatCampaignCard';
import { ChatActionCard } from './ChatActionCard';

// ── Markdown components (module-level — stable reference across renders) ──
const markdownComponents = {
  a: ({ href, children, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { children?: React.ReactNode }) => {
    if (!href) return <a {...props}>{children}</a>;
    const fallbackName = typeof children === 'string' ? children : '';
    // Product link
    const pid = extractProductId(href);
    if (pid != null) {
      return <div style={{ display: 'block', width: '100%' }}><ChatProductCard productId={pid} fallbackName={fallbackName} /></div>;
    }
    // Campaign link
    const cid = extractCampaignId(href);
    if (cid != null) {
      return <div style={{ display: 'block', width: '100%' }}><ChatCampaignCard campaignId={cid} fallbackName={fallbackName} /></div>;
    }
    // Other link
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        style={{ color: 'var(--color-rust)', textDecoration: 'underline', textUnderlineOffset: 2 }}
        {...props}
      >
        {children}
      </a>
    );
  },
  ul: ({ children, ...props }: React.HTMLAttributes<HTMLUListElement>) => (
    <ul style={{ margin: '4px 0 8px', paddingLeft: 18, listStyleType: 'disc' }} {...props}>{children}</ul>
  ),
  ol: ({ children, ...props }: React.HTMLAttributes<HTMLOListElement>) => (
    <ol style={{ margin: '4px 0 8px', paddingLeft: 18 }} {...props}>{children}</ol>
  ),
  li: ({ children, ...props }: React.HTMLAttributes<HTMLLIElement>) => (
    <li style={{ margin: '2px 0', lineHeight: 1.65 }} {...props}>{children}</li>
  ),
  table: ({ children, ...props }: React.HTMLAttributes<HTMLTableElement>) => (
    <div style={{ overflowX: 'auto', margin: '8px 0', borderRadius: 8, border: '1px solid rgba(0,0,0,0.06)' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }} {...props}>{children}</table>
    </div>
  ),
  thead: ({ children, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) => (
    <thead style={{ background: 'rgba(0,0,0,0.03)' }} {...props}>{children}</thead>
  ),
  th: ({ children, ...props }: React.ThHTMLAttributes<HTMLTableCellElement>) => (
    <th style={{ padding: '8px 10px', textAlign: 'left', fontWeight: 600, borderBottom: '1px solid rgba(0,0,0,0.08)' }} {...props}>{children}</th>
  ),
  td: ({ children, ...props }: React.TdHTMLAttributes<HTMLTableCellElement>) => (
    <td style={{ padding: '6px 10px', borderBottom: '1px solid rgba(0,0,0,0.04)' }} {...props}>{children}</td>
  ),
  code: ({ children, className, ...props }: React.HTMLAttributes<HTMLElement>) => {
    if (className?.includes('language-')) return <code className={className} {...props}>{children}</code>;
    return (
      <code style={{ background: 'rgba(0,0,0,0.06)', padding: '1px 5px', borderRadius: 4, fontSize: 12, fontFamily: 'monospace' }} {...props}>
        {children}
      </code>
    );
  },
  pre: ({ children, ...props }: React.HTMLAttributes<HTMLPreElement>) => (
    <pre style={{ background: 'rgba(0,0,0,0.05)', borderRadius: 8, padding: '10px 14px', overflowX: 'auto', fontSize: 12, margin: '8px 0' }} {...props}>
      {children}
    </pre>
  ),
  blockquote: ({ children, ...props }: React.HTMLAttributes<HTMLQuoteElement>) => (
    <blockquote style={{ borderLeft: '3px solid var(--color-rust)', background: 'rgba(0,0,0,0.03)', padding: '8px 12px', margin: '8px 0', borderRadius: '0 8px 8px 0', fontSize: 13 }} {...props}>
      {children}
    </blockquote>
  ),
  hr: ({ ...props }: React.HTMLAttributes<HTMLHRElement>) => (
    <hr style={{ border: 'none', borderTop: '1px solid rgba(0,0,0,0.08)', margin: '12px 0' }} {...props} />
  ),
  strong: ({ children, ...props }: React.HTMLAttributes<HTMLElement>) => (
    <strong style={{ fontWeight: 600, color: 'var(--color-ink)' }} {...props}>{children}</strong>
  ),
};

const MarkdownRenderer = React.memo(function MarkdownRenderer({ content }: { content: string }) {
  return (
    <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
      {content}
    </ReactMarkdown>
  );
});

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
}

let _msgId = 0;
const nextMsgId = () => `msg-${++_msgId}`;

// ── Welfare capability tags ──
const welfareCapabilities = [
  { id: 'donate', labelKey: 'aiAssistant.cap.donate', promptKey: 'aiAssistant.cap.donate.prompt' },
  { id: 'campaign', labelKey: 'aiAssistant.cap.campaign', promptKey: 'aiAssistant.cap.campaign.prompt' },
  { id: 'impact', labelKey: 'aiAssistant.cap.impact', promptKey: 'aiAssistant.cap.impact.prompt' },
  { id: 'myDonations', labelKey: 'aiAssistant.cap.myDonations', promptKey: 'aiAssistant.cap.myDonations.prompt' },
  { id: 'recycle', labelKey: 'aiAssistant.cap.recycle', promptKey: 'aiAssistant.cap.recycle.prompt' },
  { id: 'trace', labelKey: 'aiAssistant.cap.trace', promptKey: 'aiAssistant.cap.trace.prompt' },
];

export const AIAssistantBall: React.FC = () => {
  const { t } = useTranslation();
  const { impactMode } = useUIStore();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const handleSendRef = useRef<(text?: string) => void>(() => {});
  const route = useLocation().pathname;
  const isImpactSurface = impactMode || route.startsWith('/impact');
  const suggestions = getAIAssistantSuggestions(isImpactSurface, route);
  const assistantMetadata = getAIAssistantMetadata(isImpactSurface, route);

  // ── Chat logic ──
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

    const assistantId = nextMsgId();
    // Insert an empty assistant message that will be updated as tokens stream in
    setMessages(prev => [...prev, { id: assistantId, role: 'assistant', content: '' }]);

    try {
      const chatMessages: AIChatMessage[] = [...messages, userMsg].map((m) => ({
        role: m.role as AIChatMessage['role'],
        content: m.content,
      }));
      await aiAssistantApi.chatStream(
        chatMessages,
        'general',
        assistantMetadata,
        (fullText) => {
          setMessages(prev => prev.map(m => m.id === assistantId ? { ...m, content: fullText } : m));
        },
      );
    } catch {
      // Replace the empty assistant message with an error
      setMessages(prev => prev.map(m => m.id === assistantId ? { ...m, role: 'system', content: t('aiAssistant.connectionError') } : m));
    } finally {
      setIsLoading(false);
    }
  };

  handleSendRef.current = handleSend;

  // ── Prefill from external components (e.g. ProductDetail) ──
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail as { text?: string; metadata?: Record<string, unknown> } | undefined;
      if (!detail?.text) return;
      setIsOpen(true);
      // Slight delay so the panel mounts before sending
      setTimeout(() => handleSendRef.current(detail.text), 100);
    };
    window.addEventListener('ai-assistant-prefill', handler as EventListener);
    return () => window.removeEventListener('ai-assistant-prefill', handler as EventListener);
  }, []);

  return (
    <>
      {/* Chat Panel — fixed bottom-right */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
            className="fixed z-[60] flex flex-col overflow-hidden"
            style={{
              right: 24,
              bottom: 4,
              width: 420,
              height: 560,
              borderRadius: 36,
              background: 'rgba(255, 255, 255, 0.82)',
              backdropFilter: 'blur(24px) saturate(1.4)',
              WebkitBackdropFilter: 'blur(24px) saturate(1.4)',
              border: '1px solid rgba(0, 0, 0, 0.08)',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.1), 0 4px 16px rgba(0, 0, 0, 0.04)',
              fontFamily: '"Source Sans Pro", "Noto Serif SC", sans-serif',
            }}
          >
            {/* Chat Content */}
            <div
              ref={scrollRef}
              className="flex-1 overflow-y-auto relative z-10 px-4 pt-4 pb-4 space-y-4 scrollbar-none"
              style={{ color: 'var(--color-ink)' }}
            >
              {messages.length === 0 && (
                <div className="py-6 px-2">
                  <p
                    className="text-sm leading-relaxed"
                    style={{ color: 'var(--color-ink-faded)', fontFamily: '"Source Sans Pro", sans-serif' }}
                  >
                    {t('aiAssistant.greeting')}
                  </p>
                  <div className="mt-4 mb-5" style={{ borderTop: '1px solid var(--color-warm-gray)', width: 40, opacity: 0.4 }} />
                  <div className="flex flex-wrap gap-2">
                    {suggestions.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => void handleSend(t(`aiAssistant.suggestions.${item.id}.prompt`))}
                        className="text-[11px] px-3.5 py-1.5 rounded-full transition-all duration-200 cursor-pointer hover:shadow-sm"
                        style={{
                          fontFamily: '"Source Sans Pro", sans-serif',
                          color: 'var(--color-ink-faded)',
                          border: '1px solid rgba(0, 0, 0, 0.1)',
                          background: 'rgba(255, 255, 255, 0.7)',
                          backdropFilter: 'blur(8px)',
                          letterSpacing: '0.02em',
                        }}
                      >
                        {t(`aiAssistant.suggestions.${item.id}.label`)}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {messages.map((m) => (
                <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`text-[13px] leading-relaxed ${
                      m.role === 'user'
                        ? 'ai-user-msg max-w-[75%] px-4 py-2.5 rounded-2xl rounded-br-md'
                        : 'ai-chat-md max-w-[88%] px-4 py-2.5 rounded-2xl rounded-bl-md'
                    } ${m.role === 'system' ? 'opacity-60 italic text-[12px]' : ''}`}
                    style={{
                      background: m.role === 'user' ? 'var(--color-ink)' : 'rgba(0, 0, 0, 0.04)',
                      color: m.role === 'user' ? '#ffffff' : 'var(--color-ink)',
                    }}
                  >
                    {m.role === 'assistant' ? (() => {
                      const { cleanedText, actionCards } = sanitizeAssistantContentWithCards(m.content);
                      return (
                        <>
                          <MarkdownRenderer content={cleanedText} />
                          {actionCards.map((card, i) => <ChatActionCard key={i} card={card} />)}
                        </>
                      );
                    })() : <MarkdownRenderer content={m.content} />}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="px-4 py-2.5 rounded-2xl rounded-bl-md text-[12px]" style={{ color: 'var(--color-ink-light)', background: 'rgba(0, 0, 0, 0.04)' }}>
                    {t('aiAssistant.typing')}
                  </div>
                </div>
              )}
            </div>

            {/* Welfare Capability Tags */}
            {isImpactSurface && (
              <div
                className="relative z-10 px-4 py-2.5 flex gap-2 overflow-x-auto overflow-y-hidden scrollbar-none"
              >
                {welfareCapabilities.map((cap) => (
                  <button
                    key={cap.id}
                    type="button"
                    onClick={() => void handleSend(t(cap.promptKey))}
                    className="flex-shrink-0 text-[11px] px-3 py-1.5 rounded-full transition-all duration-200 cursor-pointer hover:shadow-sm"
                    style={{
                      fontFamily: '"Source Sans Pro", sans-serif',
                      color: 'var(--color-ink-faded)',
                      border: '1px solid rgba(0, 0, 0, 0.08)',
                      background: 'rgba(255, 255, 255, 0.7)',
                      letterSpacing: '0.02em',
                    }}
                  >
                    {t(cap.labelKey)}
                  </button>
                ))}
              </div>
            )}

            {/* Input Area — capsule bar */}
            <div className="relative z-10 px-4 pb-4">
              <div
                className="flex items-center p-1"
                style={{
                  borderRadius: 999,
                  background: 'rgba(255, 255, 255, 0.6)',
                  border: '1px solid rgba(0, 0, 0, 0.08)',
                }}
              >
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                  placeholder={t('aiAssistant.placeholder')}
                  className="flex-1 px-4 py-2.5 text-[13px] bg-transparent focus:outline-none"
                  style={{
                    color: 'var(--color-ink)',
                    fontFamily: '"Source Sans Pro", sans-serif',
                  }}
                />
                {/* Close button — morphs from trigger */}
                <motion.button
                  layoutId="ai-trigger"
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="flex-shrink-0 flex items-center justify-center cursor-pointer"
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: '50%',
                    background: 'var(--color-ink)',
                    color: '#ffffff',
                    border: 'none',
                    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.15)',
                  }}
                  whileHover={{ scale: 1.08 }}
                  whileTap={{ scale: 0.92 }}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 6L6 18M6 6l12 12" />
                  </svg>
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Trigger Button — morphs into send button when panel opens */}
      {!isOpen && (
        <motion.button
          layoutId="ai-trigger"
          type="button"
          onClick={() => setIsOpen(true)}
          className="fixed z-50 flex items-center justify-center cursor-pointer"
          style={{
            right: 24,
            bottom: 24,
            width: 48,
            height: 48,
            borderRadius: '50%',
            background: 'var(--color-ink)',
            color: '#ffffff',
            border: 'none',
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.15)',
          }}
          whileHover={{ scale: 1.08, boxShadow: '0 6px 24px rgba(0, 0, 0, 0.2)' }}
          whileTap={{ scale: 0.92 }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
        </motion.button>
      )}
    </>
  );
};
