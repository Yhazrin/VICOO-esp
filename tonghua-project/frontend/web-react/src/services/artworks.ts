import api from './api';
import type { Artwork, PaginatedResponse } from '@/types';

export const artworksApi = {
  getAll: async (params?: {
    page?: number;
    page_size?: number;
    campaign_id?: string;
    status?: string;
  }): Promise<PaginatedResponse<Artwork>> => {
    const response = await api.get('/artworks', { params });
    const d = response.data;
    return {
      items: d.data ?? [],
      total: d.total ?? 0,
      page: d.page ?? 1,
      pageSize: d.page_size ?? 20,
      totalPages: Math.ceil((d.total ?? 0) / (d.page_size ?? 20)),
    };
  },

  getById: async (id: string): Promise<Artwork> => {
    const response = await api.get(`/artworks/${id}`);
    return response.data.data;
  },

  getFeatured: async (): Promise<Artwork[]> => {
    const response = await api.get('/artworks/featured');
    return response.data.data;
  },

  vote: async (id: string): Promise<{ like_count: number }> => {
    const response = await api.post(`/artworks/${id}/vote`);
    return response.data.data;
  },
};
