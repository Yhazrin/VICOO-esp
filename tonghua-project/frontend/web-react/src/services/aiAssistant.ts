import api from './api';

export interface AIChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export const aiAssistantApi = {
  chat: async (messages: AIChatMessage[], context?: string): Promise<{ reply: string; model: string; source: string }> => {
    const { data } = await api.post('/ai/chat', { messages, context });
    return data.data;
  },
};
