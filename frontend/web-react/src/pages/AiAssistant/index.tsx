import { useState, useRef, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import PageWrapper from '@/components/layout/PageWrapper';
import SectionContainer from '@/components/layout/SectionContainer';

import PaperTextureBackground from '@/components/editorial/PaperTextureBackground';

import { aiAssistantApi, type AIChatMessage } from '@/services/aiAssistant';
import { useUIStore } from '@/stores/uiStore';
import { getAIAssistantMetadata, getAIAssistantSuggestions } from '@/config/aiAssistantScenarios';

interface ChatMessage extends AIChatMessage {
  id: string;
}

let _chatMsgId = 0;
const nextChatMsgId = () => `chat-${++_chatMsgId}`;

export default function AiAssistant() {
  const { t } = useTranslation();
  const [context, setContext] = useState('general');
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null);
  const { impactMode } = useUIStore();
  const location = useLocation();
  const route = location.pathname;
  const suggestions = getAIAssistantSuggestions(impactMode, route);
  const baseMetadata = getAIAssistantMetadata(impactMode, route);

  const contextOptions = [
    { value: 'general', label: t('aiAssistant.general') },
    { value: 'donation', label: t('aiAssistant.donation') },
    { value: 'shop', label: t('aiAssistant.shopCategory') },
    { value: 'logistics', label: t('aiAssistant.logisticsCategory') },
    { value: 'sustainability', label: t('aiAssistant.sustainability') },
  ];

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // If navigated here with prefill + metadata (e.g., from product detail), auto-send the prefill message
  useEffect(() => {
    const state = (location as unknown as any)?.state;
    if (state?.prefill) {
      const prefillText = String(state.prefill);
      const userMsg: ChatMessage = { id: nextChatMsgId(), role: 'user', content: prefillText };
      const nextMsgs: ChatMessage[] = [...messages, userMsg];
      setMessages(nextMsgs);
      const metadata = { ...baseMetadata, ...(state.metadata ?? {}) };
      (async () => {
        try {
          const res = await aiAssistantApi.chat(nextMsgs.map(({ id: _id, ...m }) => m) as AIChatMessage[], context, metadata);
          setMessages([...nextMsgs, { id: nextChatMsgId(), role: 'assistant', content: res.reply }]);
        } catch {
          setMessages([...nextMsgs, { id: nextChatMsgId(), role: 'assistant', content: t('aiAssistant.error', '请求失败，请稍后再试。') }]);
        }
      })();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  const send = async (overrideText?: string) => {
    const text = (overrideText ?? input).trim();
    if (!text || loading) return;
    const userMsg: ChatMessage = { id: nextChatMsgId(), role: 'user', content: text };
    const next: ChatMessage[] = [...messages, userMsg];
    setMessages(next);
    setInput('');
    setLoading(true);
    try {
      const res = await aiAssistantApi.chat(next.map(({ id: _id, ...m }) => m) as AIChatMessage[], context, baseMetadata);
      setMessages([...next, { id: nextChatMsgId(), role: 'assistant', content: res.reply }]);
    } catch {
      setMessages([
        ...next,
        { id: nextChatMsgId(), role: 'assistant', content: t('aiAssistant.error', '请求失败，请稍后再试。') },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageWrapper>
      <PaperTextureBackground variant="paper" className="py-16 md:py-24 relative min-h-[80dvh]">

        <SectionContainer>
          <h2 className="font-display text-h3 font-bold text-ink mb-8">
            {t('aiAssistant.title', '智能助手')}
          </h2>
          <p className="font-body text-body-sm text-ink-faded mt-2 mb-8">
            {t('aiAssistant.subtitle', '捐赠、购物、物流与可持续实践')}
          </p>
          <div className="mb-6 flex flex-wrap gap-3 items-center">
            <label htmlFor="ai-ctx" className="font-body text-overline text-sepia-mid">
              {t('aiAssistant.context', '上下文')}
            </label>
            <select
              id="ai-ctx"
              value={context}
              onChange={(e) => setContext(e.target.value)}
              className="font-body text-body-sm border border-warm-gray/40 bg-paper px-3 py-2 text-ink"
            >
              {contextOptions.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
          <div className="mb-6 flex flex-wrap gap-2">
            {suggestions.map((item) => (
              <button
                key={item.label}
                type="button"
                onClick={() => void send(item.prompt)}
                className="font-body text-caption border border-warm-gray/40 bg-white px-3 py-1.5 text-ink hover:bg-sepia-light"
              >
                {item.label}
              </button>
            ))}
          </div>
          <div
            className="border border-warm-gray/30 bg-paper/90 p-4 md:p-6 min-h-[320px] max-h-[50dvh] overflow-y-auto mb-4 space-y-4"
            role="log"
            aria-live="polite"
          >
            {messages.length === 0 && (
              <p className="font-body text-caption text-ink-faded">{t('aiAssistant.empty', '输入问题开始对话。未配置 API 时返回演示回复。')}</p>
            )}
            {messages.map((m) => (
              <div
                key={m.id}
                className={`font-body text-body-sm leading-relaxed ${m.role === 'user' ? 'text-ink pl-4 border-l-2 border-rust/40' : 'text-ink-faded'}`}
              >
                <span className="text-overline text-sepia-mid block mb-1">{m.role === 'user' ? t('aiAssistant.userLabel') : t('aiAssistant.assistantLabel')}</span>
                {m.content}
              </div>
            ))}
            <div ref={bottomRef} />
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              rows={3}
              className="flex-1 font-body text-body-sm border border-warm-gray/40 bg-transparent p-3 text-ink resize-y min-h-[88px]"
              placeholder={t('aiAssistant.placeholder', '例如：衣物捐献后多久能上架？')}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  void send();
                }
              }}
            />
            <button
              type="button"
              onClick={() => void send()}
              disabled={loading || !input.trim()}
              className="sm:self-end font-body text-body-sm tracking-[0.12em] uppercase px-8 py-4 bg-ink text-paper hover:bg-rust disabled:opacity-50 cursor-pointer"
            >
              {loading ? t('common.loading', '…') : t('aiAssistant.send', '发送')}
            </button>
          </div>
        </SectionContainer>
      </PaperTextureBackground>
    </PageWrapper>
  );
}
