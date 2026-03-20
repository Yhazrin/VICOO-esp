import { create } from 'zustand';
import type { Locale } from '@/types';

interface UIState {
  mobileNavOpen: boolean;
  currentLocale: Locale;
  menuTriggerRef: React.RefObject<HTMLButtonElement> | null;
  setMobileNavOpen: (open: boolean) => void;
  toggleMobileNav: () => void;
  setLocale: (locale: Locale) => void;
  setMenuTriggerRef: (ref: React.RefObject<HTMLButtonElement>) => void;
}

export const useUIStore = create<UIState>((set) => ({
  mobileNavOpen: false,
  currentLocale: 'en',
  menuTriggerRef: null,

  setMobileNavOpen: (mobileNavOpen) => set({ mobileNavOpen }),
  toggleMobileNav: () =>
    set((state) => ({ mobileNavOpen: !state.mobileNavOpen })),
  setLocale: (currentLocale) => set({ currentLocale }),
  setMenuTriggerRef: (menuTriggerRef) => set({ menuTriggerRef }),
}));
