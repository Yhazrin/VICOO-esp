import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Locale } from '@/types';

export type ThemeId = 'editorial' | 'morandi' | 'sepia' | 'monochrome' | 'ink' | 'forest' | 'autumn' | 'mist-blue' | 'deep-sea';

export interface ThemeConfig {
  id: ThemeId;
  name: string;
  nameCn: string;
  description: string;
  preview: string; // CSS gradient or color representing the theme
}

export const THEMES: ThemeConfig[] = [
  {
    id: 'editorial',
    name: 'Editorial Paper',
    nameCn: '编辑纸张',
    description: 'Classic warm paper aesthetic',
    preview: 'linear-gradient(135deg, #F7F5F2 0%, #E8E4E0 100%)',
  },
  {
    id: 'morandi',
    name: 'Morandi',
    nameCn: '莫兰迪灰',
    description: 'Soft muted tones inspired by Giorgio Morandi',
    preview: 'linear-gradient(135deg, #8B8178 0%, #C4BDB4 100%)',
  },
  {
    id: 'sepia',
    name: 'Sepia Tone',
    nameCn: '复古 Sepia',
    description: 'Warm vintage brown tones',
    preview: 'linear-gradient(135deg, #8B7355 0%, #D4C4B0 100%)',
  },
  {
    id: 'monochrome',
    name: 'Pure Mono',
    nameCn: '纯粹黑白',
    description: 'Stark black and white contrast',
    preview: 'linear-gradient(135deg, #1A1A1A 0%, #F5F5F5 100%)',
  },
  {
    id: 'ink',
    name: 'Ink Wash',
    nameCn: '水墨风格',
    description: 'Traditional Chinese ink painting aesthetic',
    preview: 'linear-gradient(135deg, #2D2A26 0%, #6B6560 100%)',
  },
  {
    id: 'forest',
    name: 'Forest Floor',
    nameCn: '森林苔藓',
    description: 'Natural greens and earth tones',
    preview: 'linear-gradient(135deg, #5A6A56 0%, #96A692 100%)',
  },
  {
    id: 'autumn',
    name: 'Autumn Leaves',
    nameCn: '秋日枫红',
    description: 'Rich warm amber and rust tones',
    preview: 'linear-gradient(135deg, #A65D4E 0%, #D4A574 100%)',
  },
  {
    id: 'mist-blue',
    name: 'Mist Blue',
    nameCn: '雾蓝主题',
    description: 'Calm, versatile, suitable as default theme',
    preview: 'linear-gradient(135deg, #8FB4B5 0%, #C4CED6 100%)',
  },
  {
    id: 'deep-sea',
    name: 'Deep Sea',
    nameCn: '深海静蓝',
    description: 'Professional, engineering-focused, suitable for backend systems',
    preview: 'linear-gradient(135deg, #647684 0%, #B4C0CA 100%)',
  },
];

// Apply theme to document root
function applyTheme(theme: ThemeId) {
  document.documentElement.setAttribute('data-theme', theme);
}

function applyLocale(locale: Locale) {
  document.documentElement.lang = locale;
}

function getStoredUISettings(): { currentTheme: ThemeId; currentLocale: Locale } {
  try {
    const stored = localStorage.getItem('tonghua-ui-settings');
    if (stored) {
      const parsed = JSON.parse(stored);
      return {
        currentTheme: (parsed.state?.currentTheme as ThemeId) || 'editorial',
        currentLocale: (parsed.state?.currentLocale as Locale) || 'en',
      };
    }
  } catch {
    // localStorage not available
  }

  return {
    currentTheme: 'editorial',
    currentLocale: 'en',
  };
}

interface UIState {
  mobileNavOpen: boolean;
  currentLocale: Locale;
  currentTheme: ThemeId;
  menuTriggerRef: React.RefObject<HTMLButtonElement> | null;
  settingsMenuOpen: boolean;
  setMobileNavOpen: (open: boolean) => void;
  toggleMobileNav: () => void;
  setLocale: (locale: Locale) => void;
  setMenuTriggerRef: (ref: React.RefObject<HTMLButtonElement>) => void;
  setTheme: (theme: ThemeId) => void;
  setSettingsMenuOpen: (open: boolean) => void;
  toggleSettingsMenu: () => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      mobileNavOpen: false,
      currentLocale: getStoredUISettings().currentLocale,
      currentTheme: getStoredUISettings().currentTheme,
      menuTriggerRef: null,
      settingsMenuOpen: false,

      setMobileNavOpen: (mobileNavOpen) => set({ mobileNavOpen }),
      toggleMobileNav: () =>
        set((state) => ({ mobileNavOpen: !state.mobileNavOpen })),
      setLocale: (currentLocale) => {
        applyLocale(currentLocale);
        set({ currentLocale });
      },
      setMenuTriggerRef: (menuTriggerRef) => set({ menuTriggerRef }),
      setTheme: (currentTheme) => {
        applyTheme(currentTheme);
        set({ currentTheme });
      },
      setSettingsMenuOpen: (settingsMenuOpen) => set({ settingsMenuOpen }),
      toggleSettingsMenu: () =>
        set((state) => ({ settingsMenuOpen: !state.settingsMenuOpen })),
    }),
    {
      name: 'tonghua-ui-settings',
      partialize: (state) => ({
        currentTheme: state.currentTheme,
        currentLocale: state.currentLocale,
      }),
      onRehydrateStorage: () => (state) => {
        // Apply persisted theme after rehydration to avoid flash
        if (state?.currentTheme) {
          applyTheme(state.currentTheme);
        }
        if (state?.currentLocale) {
          applyLocale(state.currentLocale);
        }
      },
    }
  )
);

// Apply theme on first load (before hydration) to prevent flash
const initialUISettings = getStoredUISettings();
applyTheme(initialUISettings.currentTheme);
applyLocale(initialUISettings.currentLocale);
