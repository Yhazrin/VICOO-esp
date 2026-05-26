import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CartItem, Product } from '@/types';
import { productsApi } from '@/services/products';

interface CartState {
  items: CartItem[];
  isOpen: boolean;
  _refreshing: boolean;
  addItem: (product: Product, quantity?: number, selectedSize?: string, selectedColor?: string) => void;
  removeItem: (productId: number, selectedSize?: string, selectedColor?: string) => void;
  updateQuantity: (productId: number, quantity: number, selectedSize?: string, selectedColor?: string) => void;
  clearCart: () => void;
  toggleCart: () => void;
  setCartOpen: (open: boolean) => void;
  refreshCart: () => Promise<void>;
}

function matchesItem(item: CartItem, productId: number, selectedSize?: string, selectedColor?: string) {
  return item.product.id === productId &&
    item.selectedSize === selectedSize &&
    item.selectedColor === selectedColor;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,
      _refreshing: false,

      addItem: (product, quantity = 1, selectedSize, selectedColor) =>
        set((state) => {
          const qty = Math.max(1, quantity);
          const existing = state.items.find(
            (item) => matchesItem(item, product.id, selectedSize, selectedColor)
          );
          if (existing) {
            return {
              items: state.items.map((item) =>
                matchesItem(item, product.id, selectedSize, selectedColor)
                  ? { ...item, quantity: Math.min(99, item.quantity + qty) }
                  : item
              ),
            };
          }
          return { items: [...state.items, { product, quantity: Math.min(99, qty), selectedSize, selectedColor }] };
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
              matchesItem(item, productId, selectedSize, selectedColor) ? { ...item, quantity: Math.min(99, quantity) } : item
            ),
          };
        }),

      clearCart: () => set({ items: [] }),
      toggleCart: () => set((state) => ({ isOpen: !state.isOpen })),
      setCartOpen: (isOpen) => set({ isOpen }),

      refreshCart: async () => {
        const { items, _refreshing } = get();
        if (_refreshing || items.length === 0) return;
        set({ _refreshing: true });
        try {
          const updates = await Promise.allSettled(
            items.map((item) => productsApi.getById(String(item.product.id)))
          );
          let changed = false;
          const freshItems: CartItem[] = [];
          items.forEach((item, i) => {
            const result = updates[i];
            if (result.status === 'rejected') {
              // Product deleted or unavailable — remove from cart
              changed = true;
              return;
            }
            const fresh = result.value;
            if (fresh.price !== item.product.price || fresh.inStock !== item.product.inStock || fresh.stockCount !== item.product.stockCount) {
              changed = true;
              freshItems.push({ ...item, product: fresh });
            } else {
              freshItems.push(item);
            }
          });
          if (changed) set({ items: freshItems });
        } catch {
          // Silently ignore refresh failures — stale data is better than breaking the cart
        } finally {
          set({ _refreshing: false });
        }
      },
    }),
    {
      name: 'vicoo-cart',
      partialize: (state) => ({ items: state.items }),
    }
  )
);

// Selectors — use with useCartStore(selectTotalItems) for reactive updates
export const selectTotalItems = (state: CartState) =>
  state.items.reduce((sum, item) => sum + item.quantity, 0);

export const selectTotalPrice = (state: CartState) =>
  state.items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
