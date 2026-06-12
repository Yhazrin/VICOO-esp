import { create } from 'zustand';
import type { CartItem, Product } from '@/types';
import { productsApi } from '@/services/products';
import { cartApi } from '@/services/cart';
import { useAuthStore } from './authStore';

// Clean up stale guest-cart data from old persist middleware
try { localStorage.removeItem('vicoo-cart'); } catch {}

interface CartState {
  items: CartItem[];
  isOpen: boolean;
  stockWarnings: Record<string, string>;
  addItem: (product: Product, quantity?: number, selectedSize?: string, selectedColor?: string) => void;
  removeItem: (productId: number, selectedSize?: string, selectedColor?: string) => void;
  updateQuantity: (productId: number, quantity: number, selectedSize?: string, selectedColor?: string) => void;
  clearCart: () => void;
  toggleCart: () => void;
  setCartOpen: (open: boolean) => void;
  checkStock: (productId: number, quantity: number, selectedSize?: string, selectedColor?: string) => Promise<boolean>;
  dismissStockWarning: (key: string) => void;
  refreshCart: () => Promise<void>;
  syncWithServer: () => Promise<void>;
  loadFromServer: () => Promise<void>;
}

function matchesItem(item: CartItem, productId: number, selectedSize?: string, selectedColor?: string) {
  return item.product.id === productId &&
    item.selectedSize === selectedSize &&
    item.selectedColor === selectedColor;
}

function itemKey(productId: number, selectedSize?: string, selectedColor?: string) {
  return `${productId}-${selectedSize || ''}-${selectedColor || ''}`;
}

function isAuthed(): boolean {
  return useAuthStore.getState().isAuthenticated;
}

/** Hydrate server cart items with full product data */
async function hydrateServerItems(serverItems: { product_id: number; quantity: number; selected_size: string | null; selected_color: string | null }[]): Promise<CartItem[]> {
  const hydrated = await Promise.all(
    serverItems.map(async (si) => {
      try {
        const product = await productsApi.getById(String(si.product_id));
        return {
          product,
          quantity: si.quantity,
          selectedSize: si.selected_size || undefined,
          selectedColor: si.selected_color || undefined,
        } satisfies CartItem;
      } catch {
        return null;
      }
    })
  );
  return hydrated.filter(Boolean) as CartItem[];
}

export const useCartStore = create<CartState>()((set, get) => ({
      items: [],
      isOpen: false,
      stockWarnings: {},

      addItem: (product, quantity = 1, selectedSize, selectedColor) => {
        if (!isAuthed()) return;

        const qty = Math.max(1, quantity);
        set((state) => {
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

        cartApi.addItem({
          product_id: product.id,
          quantity: qty,
          selected_size: selectedSize,
          selected_color: selectedColor,
        }).catch(() => {});
      },

      removeItem: (productId, selectedSize, selectedColor) => {
        const key = itemKey(productId, selectedSize, selectedColor);

        // Find server item id before removing locally
        const state = get();
        const item = state.items.find((i) => matchesItem(i, productId, selectedSize, selectedColor));

        set((state) => ({
          items: state.items.filter((item) => !matchesItem(item, productId, selectedSize, selectedColor)),
          stockWarnings: { ...state.stockWarnings, [key]: '' },
        }));

        // Sync to server — need to find the server item id
        if (isAuthed() && item) {
          cartApi.get().then((serverItems) => {
            const serverItem = serverItems.find(
              (si) => si.product_id === productId &&
                (si.selected_size || '') === (selectedSize || '') &&
                (si.selected_color || '') === (selectedColor || '')
            );
            if (serverItem) cartApi.removeItem(serverItem.id).catch(() => {});
          }).catch(() => {});
        }
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

        // Sync to server
        if (isAuthed()) {
          if (quantity <= 0) {
            // Same as remove — find server id
            cartApi.get().then((serverItems) => {
              const serverItem = serverItems.find(
                (si) => si.product_id === productId &&
                  (si.selected_size || '') === (selectedSize || '') &&
                  (si.selected_color || '') === (selectedColor || '')
              );
              if (serverItem) cartApi.removeItem(serverItem.id).catch(() => {});
            }).catch(() => {});
          } else {
            cartApi.get().then((serverItems) => {
              const serverItem = serverItems.find(
                (si) => si.product_id === productId &&
                  (si.selected_size || '') === (selectedSize || '') &&
                  (si.selected_color || '') === (selectedColor || '')
              );
              if (serverItem) cartApi.updateItem(serverItem.id, Math.min(99, quantity)).catch(() => {});
            }).catch(() => {});
          }
        }
      },

      clearCart: () => {
        set({ items: [], stockWarnings: {} });
        if (isAuthed()) {
          cartApi.clear().catch(() => {});
        }
      },

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
          return true;
        }
      },

      dismissStockWarning: (key: string) => {
        set((state) => ({
          stockWarnings: { ...state.stockWarnings, [key]: '' },
        }));
      },

      refreshCart: async () => {
        const { items } = get();
        if (items.length === 0) return;
        const updatedItems = await Promise.all(
          items.map(async (item) => {
            try {
              const fresh = await productsApi.getById(String(item.product.id));
              return { ...item, product: { ...item.product, ...fresh } };
            } catch {
              return item;
            }
          })
        );
        set({ items: updatedItems });
      },

      /** Merge local cart into server cart, then load the merged result */
      syncWithServer: async () => {
        const { items } = get();
        try {
          const localPayload = items.map((item) => ({
            product_id: item.product.id,
            quantity: item.quantity,
            selected_size: item.selectedSize,
            selected_color: item.selectedColor,
          }));
          const serverItems = await cartApi.sync({ items: localPayload });
          const hydrated = await hydrateServerItems(serverItems);
          set({ items: hydrated });
        } catch {
          // Keep local items if sync fails
        }
      },

      /** Load cart from server (replaces local) */
      loadFromServer: async () => {
        try {
          const serverItems = await cartApi.get();
          const hydrated = await hydrateServerItems(serverItems);
          set({ items: hydrated });
        } catch {
          // Keep local items if load fails
        }
      },
    })
);

// Selectors
export const selectTotalItems = (state: CartState) =>
  state.items.reduce((sum, item) => sum + item.quantity, 0);

export const selectTotalPrice = (state: CartState) =>
  state.items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
