import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import PageWrapper from '@/components/layout/PageWrapper';
import SectionContainer from '@/components/layout/SectionContainer';
import NumberedSectionHeading from '@/components/editorial/NumberedSectionHeading';
import PaperTextureBackground from '@/components/editorial/PaperTextureBackground';
import GrainOverlay from '@/components/editorial/GrainOverlay';
import { aiAssistantApi, type AIChatMessage } from '@/services/aiAssistant';

const CONTEXT_OPTIONS = [
  { value: 'general', label: '通用' },
  { value: 'donation', label: '捐赠与衣物' },
  { value: 'shop', label: '商城与支付' },
  { value: 'logistics', label: '订单物流' },
  { value: 'sustainability', label: '可持续与溯源' },
];

export default function AiAssistant() {
  const { t } = useTranslation();
  const [context, setContext] = useState('general');
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<AIChatMessage[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;
    const next: AIChatMessage[] = [...messages, { role: 'user', content: text }];
    setMessages(next);
    setInput('');
    setLoading(true);
    try {
      const res = await aiAssistantApi.chat(next, context);
      setMessages([...next, { role: 'assistant', content: res.reply }]);
    } catch {
      setMessages([
        ...next,
        { role: 'assistant', content: t('aiAssistant.error', '请求失败，请稍后再试。') },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageWrapper>
      <PaperTextureBackground variant="paper" className="py-16 md:py-24 relative min-h-[80dvh]">
        <GrainOverlay />
        <SectionContainer>
          <NumberedSectionHeading
            number="AI"
            title={t('aiAssistant.title', '智能助手')}
            subtitle={t('aiAssistant.subtitle', '捐赠、购物、物流与可持续实践')}
          />
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
              {CONTEXT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
          <div
            className="border border-warm-gray/30 bg-paper/90 p-4 md:p-6 min-h-[320px] max-h-[50dvh] overflow-y-auto mb-4 space-y-4"
            role="log"
            aria-live="polite"
          >
            {messages.length === 0 && (
              <p className="font-body text-caption text-ink-faded">{t('aiAssistant.empty', '输入问题开始对话。未配置 API 时返回演示回复。')}</p>
            )}
            {messages.map((m, i) => (
              <div
                key={i}
                className={`font-body text-body-sm leading-relaxed ${m.role === 'user' ? 'text-ink pl-4 border-l-2 border-rust/40' : 'text-ink-faded'}`}
              >
                <span className="text-overline text-sepia-mid block mb-1">{m.role === 'user' ? 'You' : 'Assistant'}</span>
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
