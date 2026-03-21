import api from './api';
import type { Campaign, PaginatedResponse } from '@/types';

export const campaignsApi = {
  getAll: async (params?: {
    page?: number;
    page_size?: number;
    status?: string;
  }): Promise<PaginatedResponse<Campaign>> => {
    const response = await api.get<PaginatedResponse<Campaign>>('/campaigns', {
      params,
    });
    return response.data;
  },

  getById: async (id: string): Promise<Campaign> => {
    const response = await api.get<Campaign>(`/campaigns/${id}`);
    return response.data;
  },

  getActive: async (): Promise<Campaign[]> => {
    const response = await api.get<Campaign[]>('/campaigns/active');
    return response.data;
  },

  getFeatured: async (): Promise<Campaign[]> => {
    const response = await api.get<Campaign[]>('/campaigns/featured');
    return response.data;
  },
};
