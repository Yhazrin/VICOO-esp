import api from './api';

export interface ServerCartItem {
  id: number;
  product_id: number;
  quantity: number;
  selected_size: string | null;
  selected_color: string | null;
  created_at: string;
  updated_at: string;
}

export interface CartAddPayload {
  product_id: number;
  quantity: number;
  selected_size?: string;
  selected_color?: string;
}

export interface CartSyncPayload {
  items: CartAddPayload[];
}

export const cartApi = {
  /** Get server-side cart */
  get: async (): Promise<ServerCartItem[]> => {
    const response = await api.get('/cart');
    return response.data.data;
  },

  /** Sync local cart to server, returns merged cart */
  sync: async (items: CartSyncPayload): Promise<ServerCartItem[]> => {
    const response = await api.put('/cart/sync', items);
    return response.data.data;
  },

  /** Add single item */
  addItem: async (item: CartAddPayload): Promise<ServerCartItem> => {
    const response = await api.post('/cart/items', item);
    return response.data.data;
  },

  /** Update item quantity */
  updateItem: async (itemId: number, quantity: number): Promise<ServerCartItem> => {
    const response = await api.put(`/cart/items/${itemId}`, { quantity });
    return response.data.data;
  },

  /** Remove single item */
  removeItem: async (itemId: number): Promise<void> => {
    await api.delete(`/cart/items/${itemId}`);
  },

  /** Clear entire cart */
  clear: async (): Promise<void> => {
    await api.delete('/cart');
  },
};
