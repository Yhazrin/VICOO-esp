import api from './api';

export interface AIChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export const aiAssistantApi = {
  chat: async (
    messages: AIChatMessage[],
    context?: string,
    metadata?: Record<string, any>,
    signal?: AbortSignal
  ): Promise<{ reply: string; model: string; source: string } | null> => {
    const payload: Record<string, any> = { messages };
    if (context) payload.context = context;
    if (metadata) payload.metadata = metadata;
    const resp = await api.post('/ai/chat', payload, { signal });
    // Backend wraps in { data: { reply, model, source } } — guard against
    // malformed responses (e.g. 502 from upstream proxy returning HTML)
    const inner = resp?.data?.data ?? resp?.data;
    if (!inner || typeof inner.reply !== 'string') return null;
    return inner;
  },

  feedback: async (
    is_helpful: boolean,
    messages: AIChatMessage[],
    metadata?: Record<string, any>,
    reason?: string
  ): Promise<any> => {
    const payload: Record<string, any> = { is_helpful, messages };
    if (metadata) payload.metadata = metadata;
    if (reason) payload.reason = reason;
    const resp = await api.post('/ai/feedback', payload);
    return resp?.data?.data ?? resp?.data ?? null;
  }
};
