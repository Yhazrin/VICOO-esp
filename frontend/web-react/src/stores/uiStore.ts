import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Locale } from '@/types';

export type ThemeId = 'editorial' | 'morandi' | 'sepia' | 'monochrome' | 'ink' | 'forest' | 'autumn' | 'mist-blue' | 'deep-sea' | 'dopamine';

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
  {
    id: 'dopamine',
    name: 'Dopamine',
    nameCn: '多巴胺红蓝',
    description: 'Vibrant red-blue-white energy palette',
    preview: 'linear-gradient(135deg, #2668FD 0%, #FD4401 100%)',
  },
];

// Apply theme to document root
function applyTheme(theme: ThemeId) {
  document.documentElement.setAttribute('data-theme', theme);
}

function applyLocale(locale: Locale) {
  document.documentElement.lang = locale;
}

const IMPACT_TAB_KEYS = new Set([
  'home',
  'campaigns',
  'donate',
  'shop',
  'clothing-recycle',
]);

function getStoredUISettings(): {
  currentTheme: ThemeId;
  currentLocale: Locale;
  impactMode: boolean;
  activeImpactTab: string;
} {
  try {
    const stored = localStorage.getItem('tonghua-ui-settings');
    if (stored) {
      const parsed = JSON.parse(stored);
      const rawTab = parsed.state?.activeImpactTab;
      const activeImpactTab =
        typeof rawTab === 'string' && IMPACT_TAB_KEYS.has(rawTab) ? rawTab : 'home';
      return {
        currentTheme: (parsed.state?.currentTheme as ThemeId) || 'editorial',
        currentLocale: (parsed.state?.currentLocale as Locale) || 'en',
        impactMode: typeof parsed.state?.impactMode === 'boolean' ? parsed.state.impactMode : false,
        activeImpactTab,
      };
    }
  } catch {
    // localStorage not available
  }

  return {
    currentTheme: 'editorial',
    currentLocale: 'en',
    impactMode: false,
    activeImpactTab: 'home',
  };
}

interface UIState {
  mobileNavOpen: boolean;
  currentLocale: Locale;
  currentTheme: ThemeId;
  menuTriggerRef: React.RefObject<HTMLButtonElement> | null;
  settingsMenuOpen: boolean;
  impactMode: boolean;
  activeImpactTab: string;
  setMobileNavOpen: (open: boolean) => void;
  toggleMobileNav: () => void;
  setLocale: (locale: Locale) => void;
  setMenuTriggerRef: (ref: React.RefObject<HTMLButtonElement>) => void;
  setTheme: (theme: ThemeId) => void;
  setSettingsMenuOpen: (open: boolean) => void;
  toggleSettingsMenu: () => void;
  setImpactMode: (on: boolean) => void;
  setActiveImpactTab: (tab: string) => void;
}

const initialUI = getStoredUISettings();

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      mobileNavOpen: false,
      currentLocale: initialUI.currentLocale,
      currentTheme: initialUI.currentTheme,
      menuTriggerRef: null,
      settingsMenuOpen: false,
      impactMode: initialUI.impactMode,
      activeImpactTab: initialUI.activeImpactTab,

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
      setImpactMode: (impactMode) => set({ impactMode }),
      setActiveImpactTab: (activeImpactTab) => set({ activeImpactTab }),
    }),
    {
      name: 'tonghua-ui-settings',
      partialize: (state) => ({
        currentTheme: state.currentTheme,
        currentLocale: state.currentLocale,
        impactMode: state.impactMode,
        activeImpactTab: state.activeImpactTab,
      }),
      /**
       * persist 的 hydrate 是异步的：用户可能在 getItem 完成前已切回优衣库。
       * 默认 merge 会让 localStorage 里的 impactMode **覆盖**内存中更新后的 false，
       * 导致顶栏红底 + 公益配色/胶囊/logo（`<img>` 未切到 onRed）等「半套 UI」错乱。
       * theme/locale 仍以持久化为准；impact 始终以当前内存为准（与首屏 initialUI 一致，除非用户已操作）。
       */
      merge: (persistedState, currentState) => {
        if (!persistedState) return currentState;
        return {
          ...currentState,
          ...persistedState,
          impactMode: currentState.impactMode,
          activeImpactTab: currentState.activeImpactTab,
        };
      },
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

// Apply theme + document lang on first load (before hydration) to prevent flash
applyTheme(initialUI.currentTheme);
applyLocale(initialUI.currentLocale);
