import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CartItem, Product } from '@/types';

interface CartState {
  items: CartItem[];
  isOpen: boolean;
  addItem: (product: Product, quantity?: number, selectedSize?: string, selectedColor?: string) => void;
  removeItem: (productId: number, selectedSize?: string, selectedColor?: string) => void;
  updateQuantity: (productId: number, quantity: number, selectedSize?: string, selectedColor?: string) => void;
  clearCart: () => void;
  toggleCart: () => void;
  setCartOpen: (open: boolean) => void;
}

function matchesItem(item: CartItem, productId: number, selectedSize?: string, selectedColor?: string) {
  return item.product.id === productId &&
    item.selectedSize === selectedSize &&
    item.selectedColor === selectedColor;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, _get) => ({
      items: [],
      isOpen: false,

      addItem: (product, quantity = 1, selectedSize, selectedColor) =>
        set((state) => {
          const existing = state.items.find(
            (item) => matchesItem(item, product.id, selectedSize, selectedColor)
          );
          if (existing) {
            return {
              items: state.items.map((item) =>
                matchesItem(item, product.id, selectedSize, selectedColor)
                  ? { ...item, quantity: item.quantity + quantity }
                  : item
              ),
            };
          }
          return { items: [...state.items, { product, quantity, selectedSize, selectedColor }] };
        }),

      removeItem: (productId, selectedSize, selectedColor) =>
        set((state) => ({
          items: state.items.filter((item) => !matchesItem(item, productId, selectedSize, selectedColor)),
        })),

      updateQuantity: (productId, quantity, selectedSize, selectedColor) =>
        set((state) => {
          if (quantity <= 0) {
            return {
              items: state.items.filter((item) => !matchesItem(item, productId, selectedSize, selectedColor)),
            };
          }
          return {
            items: state.items.map((item) =>
              matchesItem(item, productId, selectedSize, selectedColor) ? { ...item, quantity } : item
            ),
          };
        }),

      clearCart: () => set({ items: [] }),
      toggleCart: () => set((state) => ({ isOpen: !state.isOpen })),
      setCartOpen: (isOpen) => set({ isOpen }),
    }),
    {
      name: 'tonghua-cart',
      partialize: (state) => ({ items: state.items }),
    }
  )
);

// Selectors — use with useCartStore(selectTotalItems) for reactive updates
export const selectTotalItems = (state: CartState) =>
  state.items.reduce((sum, item) => sum + item.quantity, 0);

export const selectTotalPrice = (state: CartState) =>
  state.items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
