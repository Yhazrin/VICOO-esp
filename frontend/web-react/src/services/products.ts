import api from './api';
import type { Product, PaginatedResponse } from '@/types';

const CATEGORY_MAP: Record<string, Product['category']> = {
  apparel: 'apparel',
  accessories: 'accessories',
  stationery: 'stationery',
  prints: 'prints',
  服装: 'apparel',
  配饰: 'accessories',
  文具: 'stationery',
};

function normalizeCategory(raw: unknown): Product['category'] {
  const key = String(raw ?? '').trim();
  return CATEGORY_MAP[key] ?? 'prints';
}

function normalizeProduct(raw: any): Product {
  const stockCount = Number(raw?.stock ?? raw?.stockCount ?? 0);
  const status = String(raw?.status ?? '').toLowerCase();
  const inStock = typeof raw?.inStock === 'boolean'
    ? raw.inStock
    : stockCount > 0 && status !== 'sold_out' && status !== 'inactive';

  return {
    id: Number(raw?.id ?? 0),
    name: raw?.name ?? '',
    description: raw?.description ?? '',
    price: Number(raw?.price ?? 0),
    currency: raw?.currency ?? 'CNY',
    image_url: raw?.image_url ?? null,
    category: normalizeCategory(raw?.category),
    inStock,
    stockCount,
    supplyChain: Array.isArray(raw?.supplyChain) ? raw.supplyChain : [],
    sustainabilityScore: Number(raw?.sustainability_score ?? raw?.sustainabilityScore ?? 85),
    artworkBy: raw?.artworkBy,
  };
}

export const productsApi = {
  getAll: async (params?: {
    page?: number;
    page_size?: number;
    category?: string;
  }): Promise<PaginatedResponse<Product>> => {
    const response = await api.get('/products', { params });
    const d = response.data;
    return {
      items: (d.data ?? []).map(normalizeProduct),
      total: d.total ?? 0,
      page: d.page ?? 1,
      pageSize: d.pageSize ?? d.page_size ?? 20,
      totalPages: Math.ceil((d.total ?? 0) / (d.pageSize ?? d.page_size ?? 20)),
    };
  },

  getById: async (id: string): Promise<Product> => {
    const response = await api.get(`/products/${id}`);
    return normalizeProduct(response.data.data);
  },

  getFeatured: async (): Promise<Product[]> => {
    const response = await api.get('/products/featured');
    return (response.data.data ?? []).map(normalizeProduct);
  },

  getByCategory: async (category: string): Promise<PaginatedResponse<Product>> => {
    const response = await api.get('/products', { params: { category } });
    const d = response.data;
    return {
      items: (d.data ?? []).map(normalizeProduct),
      total: d.total ?? 0,
      page: d.page ?? 1,
      pageSize: d.pageSize ?? d.page_size ?? 20,
      totalPages: Math.ceil((d.total ?? 0) / (d.pageSize ?? d.page_size ?? 20)),
    };
  },

  getCategories: async (): Promise<string[]> => {
    const response = await api.get('/products/categories');
    const rows = response.data.data ?? [];
    return rows
      .map((row: any) => normalizeCategory(row?.name ?? row))
      .filter((value: Product['category'], index: number, arr: Product['category'][]) => arr.indexOf(value) === index);
  },
};
