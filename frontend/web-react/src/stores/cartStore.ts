import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CartItem, Product } from '@/types';
import { productsApi } from '@/services/products';

interface CartState {
  items: CartItem[];
  isOpen: boolean;
  stockWarnings: Record<string, string>; // productId-size-color -> warning message
  addItem: (product: Product, quantity?: number, selectedSize?: string, selectedColor?: string) => void;
  removeItem: (productId: number, selectedSize?: string, selectedColor?: string) => void;
  updateQuantity: (productId: number, quantity: number, selectedSize?: string, selectedColor?: string) => void;
  clearCart: () => void;
  toggleCart: () => void;
  setCartOpen: (open: boolean) => void;
  checkStock: (productId: number, quantity: number, selectedSize?: string, selectedColor?: string) => Promise<boolean>;
  dismissStockWarning: (key: string) => void;
}

function matchesItem(item: CartItem, productId: number, selectedSize?: string, selectedColor?: string) {
  return item.product.id === productId &&
    item.selectedSize === selectedSize &&
    item.selectedColor === selectedColor;
}

function itemKey(productId: number, selectedSize?: string, selectedColor?: string) {
  return `${productId}-${selectedSize || ''}-${selectedColor || ''}`;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, _get) => ({
      items: [],
      isOpen: false,
      stockWarnings: {},

      addItem: (product, quantity = 1, selectedSize, selectedColor) => {
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
        });
      },

      removeItem: (productId, selectedSize, selectedColor) => {
        const key = itemKey(productId, selectedSize, selectedColor);
        set((state) => ({
          items: state.items.filter((item) => !matchesItem(item, productId, selectedSize, selectedColor)),
          stockWarnings: { ...state.stockWarnings, [key]: '' },
        }));
      },

      updateQuantity: (productId, quantity, selectedSize, selectedColor) => {
        const key = itemKey(productId, selectedSize, selectedColor);
        set((state) => {
          if (quantity <= 0) {
            return {
              items: state.items.filter((item) => !matchesItem(item, productId, selectedSize, selectedColor)),
              stockWarnings: { ...state.stockWarnings, [key]: '' },
            };
          }
          return {
            items: state.items.map((item) =>
              matchesItem(item, productId, selectedSize, selectedColor) ? { ...item, quantity: Math.min(99, quantity) } : item
            ),
          };
        });
      },

      clearCart: () => set({ items: [], stockWarnings: {} }),
      toggleCart: () => set((state) => ({ isOpen: !state.isOpen })),
      setCartOpen: (isOpen) => set({ isOpen }),

      checkStock: async (productId: number, quantity: number, selectedSize?: string, selectedColor?: string) => {
        try {
          const product = await productsApi.getById(String(productId));
          if (product.stockCount < quantity) {
            const key = itemKey(productId, selectedSize, selectedColor);
            set((state) => ({
              stockWarnings: {
                ...state.stockWarnings,
                [key]: `库存不足（当前 ${product.stockCount} 件）`,
              },
            }));
            return false;
          }
          return true;
        } catch {
          return true; // fail open, let checkout handle errors
        }
      },

      dismissStockWarning: (key: string) => {
        set((state) => ({
          stockWarnings: { ...state.stockWarnings, [key]: '' },
        }));
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
