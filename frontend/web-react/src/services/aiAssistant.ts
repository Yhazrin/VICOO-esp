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
  ): Promise<{ reply: string; model: string; source: string }> => {
    const payload: Record<string, any> = { messages };
    if (context) payload.context = context;
    if (metadata) payload.metadata = metadata;
    const { data } = await api.post('/ai/chat', payload, { signal });
    return data.data;
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
    const { data } = await api.post('/ai/feedback', payload);
    return data.data;
  }
};
