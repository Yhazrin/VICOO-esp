import api from './api';

export interface AIChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export const aiAssistantApi = {
  chat: async (messages: AIChatMessage[], context?: string, metadata?: Record<string, any>): Promise<{ reply: string; model: string; source: string }> => {
    const payload: Record<string, any> = { messages };
    if (context) payload.context = context;
    if (metadata) payload.metadata = metadata;
    const { data } = await api.post('/ai/chat', payload);
    return data.data;
  },
};
