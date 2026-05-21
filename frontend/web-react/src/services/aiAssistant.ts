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
    const inner = resp?.data?.data ?? resp?.data;
    if (!inner || typeof inner.reply !== 'string') return null;
    return inner;
  },

  /**
   * Stream AI chat via SSE (POST /ai/chat/stream).
   * Calls onToken(text) for each incremental text chunk.
   * Returns the full accumulated reply when the stream ends.
   */
  chatStream: async (
    messages: AIChatMessage[],
    context?: string,
    metadata?: Record<string, any>,
    onToken?: (text: string) => void,
    signal?: AbortSignal
  ): Promise<string> => {
    const { accessToken } = (await import('@/stores/authStore')).useAuthStore.getState();
    const baseURL = (await import('./api')).default.defaults.baseURL;
    const payload: Record<string, any> = { messages };
    if (context) payload.context = context;
    if (metadata) payload.metadata = metadata;

    const resp = await fetch(`${baseURL}/ai/chat/stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      },
      body: JSON.stringify(payload),
      signal,
    });

    if (!resp.ok) {
      throw new Error(`Stream failed: ${resp.status}`);
    }

    const reader = resp.body!.getReader();
    const decoder = new TextDecoder();
    let fullText = '';
    let buffer = '';

    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      const lines = buffer.split('\n');
      buffer = lines.pop()!; // keep incomplete line in buffer

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || !trimmed.startsWith('data:')) continue;
        const dataStr = trimmed.slice(5).trim();
        if (!dataStr) continue;
        try {
          const evt = JSON.parse(dataStr);
          if (evt.type === 'content_block_delta' && typeof evt.text === 'string') {
            fullText += evt.text;
            onToken?.(fullText);
          } else if (evt.type === 'message_stop') {
            return fullText;
          } else if (evt.type === 'error') {
            throw new Error(evt.error || 'Stream error');
          }
        } catch (e) {
          if (e instanceof SyntaxError) continue; // skip malformed JSON
          throw e;
        }
      }
    }
    return fullText;
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
