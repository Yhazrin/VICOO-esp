import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Product } from '@/types';

interface WishlistState {
  items: Product[];
  addItem: (product: Product) => void;
  removeItem: (productId: number) => void;
  toggleItem: (product: Product) => void;
  isWishlisted: (productId: number) => boolean;
}

export const useWishlistStore = create<WishlistState>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (product) =>
        set((state) => {
          if (state.items.some((p) => p.id === product.id)) return state;
          return { items: [...state.items, product] };
        }),

      removeItem: (productId) =>
        set((state) => ({
          items: state.items.filter((p) => p.id !== productId),
        })),

      toggleItem: (product) => {
        const state = get();
        if (state.items.some((p) => p.id === product.id)) {
          state.removeItem(product.id);
        } else {
          state.addItem(product);
        }
      },

      isWishlisted: (productId) =>
        get().items.some((p) => p.id === productId),
    }),
    {
      name: 'vicoo-wishlist',
      partialize: (state) => ({ items: state.items }),
    }
  )
);
