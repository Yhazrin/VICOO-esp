import api from './api';

export interface DesignDraft {
  id: number;
  artwork_id: number;
  product_id: number | null;
  created_by_user_id: number;
  title: string;
  description: string | null;
  target_category: string | null;
  original_artwork_url: string | null;
  design_image_url: string | null;
  prompt_used: string | null;
  status: 'draft' | 'ai_generated' | 'review' | 'approved' | 'rejected' | 'published';
  review_note: string | null;
  created_at: string;
  updated_at: string;
}

export const aiDesignApi = {
  list: async (params?: { status?: string; artwork_id?: number }): Promise<DesignDraft[]> => {
    const response = await api.get('/design-drafts', { params });
    return response.data.data ?? [];
  },

  getById: async (id: number): Promise<DesignDraft> => {
    const response = await api.get(`/design-drafts/${id}`);
    return response.data.data;
  },

  create: async (data: { artwork_id: number; title: string; description?: string; target_category?: string }): Promise<DesignDraft> => {
    const response = await api.post('/design-drafts', data);
    return response.data.data;
  },

  generate: async (id: number): Promise<DesignDraft> => {
    const response = await api.post(`/design-drafts/${id}/generate`);
    return response.data.data;
  },

  approve: async (id: number, review_note?: string): Promise<DesignDraft> => {
    const response = await api.post(`/design-drafts/${id}/approve`, { review_note });
    return response.data.data;
  },

  reject: async (id: number, review_note?: string): Promise<DesignDraft> => {
    const response = await api.post(`/design-drafts/${id}/reject`, { review_note });
    return response.data.data;
  },

  publish: async (id: number, productData?: Record<string, unknown>): Promise<{ product_id: number; product_name: string }> => {
    const response = await api.post(`/design-drafts/${id}/publish`, productData);
    return response.data.data;
  },
};
