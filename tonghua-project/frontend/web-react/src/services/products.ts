import api from './api';
import type { Product, PaginatedResponse } from '@/types';

export const productsApi = {
  getAll: async (params?: {
    page?: number;
    page_size?: number;
    category?: string;
  }): Promise<PaginatedResponse<Product>> => {
    const response = await api.get('/products', { params });
    const d = response.data;
    return {
      items: d.data ?? [],
      total: d.total ?? 0,
      page: d.page ?? 1,
      pageSize: d.page_size ?? 20,
      totalPages: Math.ceil((d.total ?? 0) / (d.page_size ?? 20)),
    };
  },

  getById: async (id: string): Promise<Product> => {
    const response = await api.get(`/products/${id}`);
    return response.data.data;
  },

  getFeatured: async (): Promise<Product[]> => {
    const response = await api.get('/products/featured');
    return response.data.data;
  },

  getByCategory: async (category: string): Promise<PaginatedResponse<Product>> => {
    const response = await api.get('/products', { params: { category } });
    const d = response.data;
    return {
      items: d.data ?? [],
      total: d.total ?? 0,
      page: d.page ?? 1,
      pageSize: d.page_size ?? 20,
      totalPages: Math.ceil((d.total ?? 0) / (d.page_size ?? 20)),
    };
  },
};
