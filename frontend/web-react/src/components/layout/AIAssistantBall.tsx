import React, { useState, useEffect, useRef, useCallback, lazy, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { aiAssistantApi, type AIChatMessage } from '@/services/aiAssistant';
import { useLocation } from 'react-router-dom';
import { useUIStore } from '@/stores/uiStore';
import { getAIAssistantMetadata, getAIAssistantSuggestions } from '@/config/aiAssistantScenarios';
import { sanitizeAssistantContent } from '@/utils/aiContent';
import AIBallVisual from './AIBallVisual';

// Lazy-load markdown parser (~80KB) — only needed when chat is open
const ReactMarkdown = lazy(() => import('react-markdown'));
const remarkGfmPromise = import('remark-gfm').then(m => m.default);

function MarkdownRenderer({ content }: { content: string }) {
  const [plugin, setPlugin] = useState<unknown>(null);
  useEffect(() => { remarkGfmPromise.then(setPlugin); }, []);
  return <ReactMarkdown remarkPlugins={plugin ? [plugin] : []}>{content}</ReactMarkdown>;
}

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
}

let _msgId = 0;
const nextMsgId = () => `msg-${++_msgId}`;

// ── Ball position persistence ──
const POS_KEY = 'vicoo-ai-ball-pos';
const BALL_SIZE = 56;
const SNAP_THRESHOLD = 5; // px — below this, treat as click not drag

function loadBallPos(): { x: number; y: number } {
  try {
    const raw = localStorage.getItem(POS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (typeof parsed.x === 'number' && typeof parsed.y === 'number') return parsed;
    }
  } catch { /* ignore */ }
  // Default: bottom-right corner
  return { x: window.innerWidth - BALL_SIZE - 32, y: window.innerHeight - BALL_SIZE - 32 };
}

function saveBallPos(x: number, y: number) {
  try { localStorage.setItem(POS_KEY, JSON.stringify({ x, y })); } catch { /* ignore */ }
}

// Snap to nearest horizontal edge
function snapX(x: number): number {
  const mid = window.innerWidth / 2;
  return x < mid ? 24 : window.innerWidth - BALL_SIZE - 24;
}

function clampY(y: number): number {
  return Math.max(24, Math.min(y, window.innerHeight - BALL_SIZE - 24));
}

// ── Welfare capability tags ──
const welfareCapabilities = [
  { id: 'donate', icon: '💝', labelKey: 'aiAssistant.cap.donate', promptKey: 'aiAssistant.cap.donate.prompt' },
  { id: 'campaign', icon: '🎯', labelKey: 'aiAssistant.cap.campaign', promptKey: 'aiAssistant.cap.campaign.prompt' },
  { id: 'impact', icon: '🌍', labelKey: 'aiAssistant.cap.impact', promptKey: 'aiAssistant.cap.impact.prompt' },
  { id: 'myDonations', icon: '📋', labelKey: 'aiAssistant.cap.myDonations', promptKey: 'aiAssistant.cap.myDonations.prompt' },
  { id: 'recycle', icon: '♻️', labelKey: 'aiAssistant.cap.recycle', promptKey: 'aiAssistant.cap.recycle.prompt' },
  { id: 'trace', icon: '🔍', labelKey: 'aiAssistant.cap.trace', promptKey: 'aiAssistant.cap.trace.prompt' },
];

export const AIAssistantBall: React.FC = () => {
  const { t } = useTranslation();
  const { impactMode, aiBallStyle } = useUIStore();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [feedbackMap, setFeedbackMap] = useState<Record<string, 'idle' | 'submitting' | 'sent' | 'escalated'>>({});
  const scrollRef = useRef<HTMLDivElement>(null);
  const route = useLocation().pathname;
  const isImpactSurface = impactMode || route.startsWith('/impact');
  const suggestions = getAIAssistantSuggestions(isImpactSurface, route);
  const assistantMetadata = getAIAssistantMetadata(isImpactSurface, route);

  // ── Drag state ──
  const [ballPos, setBallPos] = useState(loadBallPos);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{ x: number; y: number; bx: number; by: number } | null>(null);
  const hasMovedRef = useRef(false);

  // ── Panel position: above ball, auto-adjust ──
  const panelWidth = 420;
  const panelHeight = 560;
  const getPanelPos = useCallback(() => {
    const bw = window.innerWidth;
    const bh = window.innerHeight;
    let left = ballPos.x + BALL_SIZE / 2 - panelWidth / 2;
    let top = ballPos.y - panelHeight - 16;
    // Clamp horizontal
    left = Math.max(16, Math.min(left, bw - panelWidth - 16));
    // If not enough space above, put below
    if (top < 16) top = ballPos.y + BALL_SIZE + 16;
    // Clamp vertical
    top = Math.max(16, Math.min(top, bh - panelHeight - 16));
    return { left, top };
  }, [ballPos]);

  // ── Drag handlers ──
  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    e.preventDefault();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    dragStartRef.current = { x: e.clientX, y: e.clientY, bx: ballPos.x, by: ballPos.y };
    hasMovedRef.current = false;
  }, [ballPos]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragStartRef.current) return;
    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;
    if (!hasMovedRef.current && Math.abs(dx) < SNAP_THRESHOLD && Math.abs(dy) < SNAP_THRESHOLD) return;
    hasMovedRef.current = true;
    setIsDragging(true);
    const newX = Math.max(0, Math.min(dragStartRef.current.bx + dx, window.innerWidth - BALL_SIZE));
    const newY = clampY(dragStartRef.current.by + dy);
    setBallPos({ x: newX, y: newY });
  }, []);

  const handlePointerUp = useCallback(() => {
    dragStartRef.current = null;
    if (hasMovedRef.current) {
      // Snap to edge
      setBallPos(prev => {
        const snapped = { x: snapX(prev.x), y: prev.y };
        saveBallPos(snapped.x, snapped.y);
        return snapped;
      });
      // Delay resetting isDragging so click doesn't fire
      setTimeout(() => setIsDragging(false), 100);
    } else {
      setIsDragging(false);
      setIsOpen(prev => !prev);
    }
  }, []);

  // ── Chat logic ──
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
    } catch {
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
      const reply = result?.reply || t('aiAssistant.replyError');
      setMessages(prev => [...prev, { id: nextMsgId(), role: 'assistant', content: reply }]);
    } catch {
      setMessages(prev => [...prev, { id: nextMsgId(), role: 'system', content: t('aiAssistant.connectionError') }]);
    } finally {
      setIsLoading(false);
    }
  };

  // ── Frosted glass theme ──
  const panelPos = getPanelPos();

  return (
    <>
      {/* Chat Panel (portal-like, positioned absolute to viewport) */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.85, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.85, y: 20 }}
            transition={{ type: 'spring', damping: 28, stiffness: 220 }}
            className="fixed z-50 flex flex-col overflow-hidden"
            style={{
              left: panelPos.left,
              top: panelPos.top,
              width: panelWidth,
              height: panelHeight,
              borderRadius: 20,
              backdropFilter: 'blur(24px) saturate(1.4)',
              WebkitBackdropFilter: 'blur(24px) saturate(1.4)',
              background: isImpactSurface
                ? 'linear-gradient(135deg, rgba(248,240,225,0.82) 0%, rgba(245,230,204,0.78) 50%, rgba(238,213,175,0.75) 100%)'
                : 'linear-gradient(135deg, rgba(251,242,227,0.82) 0%, rgba(247,228,197,0.78) 50%, rgba(240,204,164,0.75) 100%)',
              border: '1px solid rgba(255,255,255,0.35)',
              boxShadow: '0 25px 80px rgba(0,0,0,0.15), 0 8px 32px rgba(139,58,42,0.08)',
              fontFamily: '"Smiley Sans", "Source Sans Pro", "Noto Serif SC", serif',
            }}
          >
            {/* Header */}
            <div
              className="px-5 py-3.5 flex justify-between items-center"
              style={{
                background: isImpactSurface
                  ? 'linear-gradient(135deg, rgba(107,50,26,0.88) 0%, rgba(143,74,35,0.85) 100%)'
                  : 'linear-gradient(135deg, rgba(94,45,27,0.88) 0%, rgba(122,64,34,0.85) 100%)',
                borderBottom: '1px solid rgba(183,119,73,0.3)',
              }}
            >
              <div>
                <h3 className="text-xs uppercase font-bold tracking-[0.14em] text-[#fff7ea]">
                  {isImpactSurface ? t('aiAssistant.ballTitleImpact') : t('aiAssistant.ballTitle')}
                </h3>
                <p className="text-[10px] text-[#ffe9cc]">
                  {isImpactSurface ? `Impact · ${t('aiAssistant.ballSubtitle')}` : `Uniqlo · ${t('aiAssistant.ballSubtitle')}`}
                </p>
              </div>
              <button onClick={() => setIsOpen(false)} className="text-xl text-[#fff7ea] hover:opacity-70 transition-opacity">×</button>
            </div>

            {/* Chat Content */}
            <div
              ref={scrollRef}
              className="flex-1 overflow-y-auto px-5 py-4 space-y-3 scrollbar-thin"
              style={{ color: '#332217' }}
            >
              {messages.length === 0 && (
                <div className="text-center py-8 px-3">
                  <p className="text-sm italic" style={{ color: isImpactSurface ? '#7f4f2a' : '#6e4b35' }}>
                    {t('aiAssistant.emptyQuote')}
                  </p>
                  <p className="mt-3 text-xs" style={{ color: '#342317' }}>{t('aiAssistant.greeting')}</p>
                  <div className="mt-4 flex flex-wrap justify-center gap-2">
                    {suggestions.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => void handleSend(t(`aiAssistant.suggestions.${item.id}.prompt`))}
                        className="text-[11px] px-3.5 py-1.5 rounded-full transition-all duration-200 hover:scale-[1.04]"
                        style={{
                          fontFamily: '"Source Sans Pro", "Noto Serif SC", serif',
                          color: '#8B3A2A',
                          border: '1px solid #D4CFC4',
                          background: 'rgba(250,246,238,0.85)',
                          backdropFilter: 'blur(4px)',
                          letterSpacing: '0.03em',
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
                    className={`max-w-[85%] p-3 text-xs leading-relaxed rounded-xl ${
                      m.role === 'user'
                        ? 'rounded-br-sm'
                        : 'rounded-bl-sm'
                    } ${m.role === 'system' ? 'opacity-70 italic border-none bg-transparent' : ''}`}
                    style={{
                      background: m.role === 'user'
                        ? (isImpactSurface ? 'rgba(181,95,52,0.85)' : 'rgba(158,79,45,0.85)')
                        : 'rgba(255,247,234,0.8)',
                      border: m.role === 'system' ? 'none' : `1px solid ${m.role === 'user' ? 'rgba(140,68,35,0.4)' : 'rgba(200,139,88,0.35)'}`,
                      color: m.role === 'user' ? '#fff7ec' : '#3b2718',
                      backdropFilter: m.role !== 'user' ? 'blur(8px)' : undefined,
                    }}
                  >
                    <Suspense fallback={<span className="opacity-50">...</span>}>
                      <MarkdownRenderer content={m.role === 'assistant' ? sanitizeAssistantContent(m.content) : m.content} />
                    </Suspense>
                  </div>

                  {m.role === 'assistant' && (
                    <div className="flex items-center gap-1.5 ml-1.5 self-start mt-1">
                      <button onClick={() => handleFeedback(m.id, true)} aria-label={t('aiAssistant.feedbackHelpfulAria')} className="text-green-600 text-[10px] hover:scale-110 transition-transform">👍</button>
                      <button onClick={() => handleFeedback(m.id, false)} aria-label={t('aiAssistant.feedbackNotHelpfulAria')} className="text-red-500 text-[10px] hover:scale-110 transition-transform">👎</button>
                      {feedbackMap[m.id] === 'submitting' && <span className="text-[9px] ml-1">...</span>}
                      {feedbackMap[m.id] === 'sent' && <span className="text-[9px] ml-1 text-[#5b6a2d]">{t('aiAssistant.feedbackSubmitted')}</span>}
                      {feedbackMap[m.id] === 'escalated' && <span className="text-[9px] ml-1 text-[#8B3A2A]">{t('aiAssistant.feedbackEscalated')}</span>}
                    </div>
                  )}
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="p-3 text-xs animate-pulse" style={{ color: '#6f4a34' }}>{t('aiAssistant.typing')}</div>
                </div>
              )}
            </div>

            {/* Welfare Capability Tags */}
            {isImpactSurface && (
              <div
                className="px-4 py-2 flex gap-1.5 overflow-x-auto scrollbar-none"
                style={{ borderTop: '1px solid rgba(155,100,63,0.2)', background: 'rgba(248,236,217,0.5)' }}
              >
                {welfareCapabilities.map((cap) => (
                  <button
                    key={cap.id}
                    type="button"
                    onClick={() => void handleSend(t(cap.promptKey))}
                    className="flex-shrink-0 text-[11px] px-3 py-1.5 rounded-full transition-all duration-200 hover:scale-[1.04]"
                    style={{
                      fontFamily: '"Source Sans Pro", "Noto Serif SC", serif',
                      color: '#8B3A2A',
                      border: '1px solid #D4CFC4',
                      background: 'rgba(250,246,238,0.85)',
                      backdropFilter: 'blur(4px)',
                      letterSpacing: '0.02em',
                    }}
                  >
                    {cap.icon} {t(cap.labelKey)}
                  </button>
                ))}
              </div>
            )}

            {/* Input Area */}
            <div
              className="px-4 py-3"
              style={{ borderTop: '1px solid rgba(155,100,63,0.25)', background: 'rgba(248,236,213,0.6)' }}
            >
              <div className="flex gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                  placeholder={t('aiAssistant.placeholder')}
                  className="flex-1 px-3 py-2 text-xs focus:outline-none rounded-lg"
                  style={{
                    background: 'rgba(255,248,236,0.8)',
                    border: '1px solid rgba(155,100,63,0.4)',
                    color: '#2d1e14',
                    backdropFilter: 'blur(4px)',
                  }}
                />
                <button
                  type="button"
                  onClick={() => void handleSend()}
                  disabled={isLoading}
                  className="px-4 py-2 text-[10px] uppercase tracking-widest transition-colors rounded-lg"
                  style={{
                    background: isImpactSurface ? 'rgba(127,60,32,0.9)' : 'rgba(112,53,28,0.9)',
                    color: '#fff4e3',
                  }}
                >
                  {t('aiAssistant.send')}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Ball */}
      <motion.div
        className="fixed z-50"
        style={{
          left: ballPos.x,
          top: ballPos.y,
          width: BALL_SIZE,
          height: BALL_SIZE,
          touchAction: 'none',
          cursor: isDragging ? 'grabbing' : 'grab',
        }}
        animate={{
          scale: isDragging ? 1.12 : 1,
          filter: isDragging ? 'drop-shadow(0 8px 20px rgba(0,0,0,0.25))' : 'drop-shadow(0 4px 12px rgba(0,0,0,0.15))',
        }}
        transition={{ type: 'spring', damping: 20, stiffness: 300 }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      >
        {/* Breathing pulse ring */}
        <motion.div
          className="absolute inset-0 rounded-full"
          style={{
            border: `2px solid ${isImpactSurface ? 'rgba(232,137,74,0.3)' : 'rgba(139,58,42,0.2)'}`,
          }}
          animate={{ scale: [1, 1.15, 1], opacity: [0.6, 0, 0.6] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        />
        {/* Ball body */}
        <div className="absolute inset-0 rounded-full overflow-hidden">
          <AIBallVisual style={aiBallStyle} isImpact={isImpactSurface} />
        </div>
      </motion.div>
    </>
  );
};
