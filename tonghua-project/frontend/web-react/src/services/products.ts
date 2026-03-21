import api from './api';
import type { Product, PaginatedResponse } from '@/types';

export const productsApi = {
  getAll: async (params?: {
    page?: number;
    page_size?: number;
    category?: string;
  }): Promise<PaginatedResponse<Product>> => {
    const response = await api.get<PaginatedResponse<Product>>('/products', {
      params,
    });
    return response.data;
  },

  getById: async (id: string): Promise<Product> => {
    const response = await api.get<Product>(`/products/${id}`);
    return response.data;
  },

  getFeatured: async (): Promise<Product[]> => {
    const response = await api.get<Product[]>('/products/featured');
    return response.data;
  },

  getByCategory: async (category: string): Promise<PaginatedResponse<Product>> => {
    const response = await api.get<PaginatedResponse<Product>>('/products', {
      params: { category },
    });
    return response.data;
  },

  getCategories: async (): Promise<string[]> => {
    const response = await api.get<{ success: boolean; data: string[] }>('/products/categories');
    return response.data.data;
  },
};
