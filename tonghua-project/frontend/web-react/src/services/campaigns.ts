import api from './api';
import type { Campaign, PaginatedResponse } from '@/types';

export const campaignsApi = {
  getAll: async (params?: {
    page?: number;
    page_size?: number;
    status?: string;
  }): Promise<PaginatedResponse<Campaign>> => {
    const response = await api.get('/campaigns', { params });
    const d = response.data;
    return {
      items: d.data ?? [],
      total: d.total ?? 0,
      page: d.page ?? 1,
      pageSize: d.page_size ?? 20,
      totalPages: Math.ceil((d.total ?? 0) / (d.page_size ?? 20)),
    };
  },

  getById: async (id: string): Promise<Campaign> => {
    const response = await api.get(`/campaigns/${id}`);
    return response.data.data;
  },

  getActive: async (): Promise<Campaign[]> => {
    const response = await api.get('/campaigns/active');
    return response.data.data;
  },

  getFeatured: async (): Promise<Campaign[]> => {
    const response = await api.get('/campaigns/featured');
    return response.data.data;
  },
};
