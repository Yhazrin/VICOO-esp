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

  vote: async (id: string): Promise<Artwork> => {
    const response = await api.post(`/artworks/${id}/vote`);
    return response.data.data;
  },

  create: async (data: {
    title: string;
    image: File;
    description?: string;
    campaign_id?: number;
    child_display_name?: string;
    guardian_consent?: string;
  }): Promise<Artwork> => {
    const formData = new FormData();
    formData.append('title', data.title);
    formData.append('image', data.image);
    if (data.description) formData.append('description', data.description);
    if (data.campaign_id != null) formData.append('campaign_id', String(data.campaign_id));
    if (data.child_display_name) formData.append('child_display_name', data.child_display_name);
    if (data.guardian_consent) formData.append('guardian_consent', data.guardian_consent);
    const response = await api.post('/artworks', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data.data;
  },
};
