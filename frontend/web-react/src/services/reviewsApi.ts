import api from './api';

export interface ProductReview {
  id: number;
  product_id: number;
  user_id: number;
  order_id?: number | null;
  rating: number;
  title?: string | null;
  body?: string | null;
  created_at: string;
}

export const reviewsApi = {
  listByProduct: async (productId: number, page = 1, pageSize = 20): Promise<{ data: ProductReview[]; total: number }> => {
    const { data } = await api.get('/reviews', { params: { product_id: productId, page, page_size: pageSize } });
    return { data: data.data ?? [], total: data.total ?? 0 };
  },
  create: async (payload: {
    product_id: number;
    order_id?: number;
    rating: number;
    title?: string;
    body?: string;
  }): Promise<ProductReview> => {
    const { data } = await api.post('/reviews', payload);
    return data.data;
  },
};
