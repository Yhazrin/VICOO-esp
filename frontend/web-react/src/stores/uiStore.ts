import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Locale } from '@/types';

export type ThemeId = 'editorial' | 'morandi' | 'sepia' | 'monochrome' | 'ink' | 'forest' | 'autumn' | 'mist-blue' | 'deep-sea' | 'dopamine';
export type AIBallStyle = 'orb' | 'particles';

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

/**
 * Synced with Layout's useLayoutEffect: sets `data-welfare-vivid` directly on <html>.
 * Key point: refreshes synchronously both during store creation (module load) and on
 * `setImpactMode` calls, to prevent a frame where the Header className has switched to
 * welfare but CSS variables are still UNIQLO's on first render / mode switch -- a
 * "welfare capsule with UNIQLO colors" half-applied style (user-reported as "some buttons
 * still show charity styling").
 */
function applyWelfareVivid(on: boolean) {
  if (typeof document === 'undefined') return;
  if (on) {
    document.documentElement.setAttribute('data-welfare-vivid', '');
  } else {
    document.documentElement.removeAttribute('data-welfare-vivid');
  }
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
  aiBallStyle: AIBallStyle;
} {
  try {
    const stored = localStorage.getItem('vicoo-ui-settings');
    if (stored) {
      const parsed = JSON.parse(stored);
      const rawTab = parsed.state?.activeImpactTab;
      const activeImpactTab =
        typeof rawTab === 'string' && IMPACT_TAB_KEYS.has(rawTab) ? rawTab : 'home';
      const rawBallStyle = parsed.state?.aiBallStyle;
      const aiBallStyle = rawBallStyle === 'particles' ? 'particles' : 'orb';
      return {
        currentTheme: (parsed.state?.currentTheme as ThemeId) || 'editorial',
        currentLocale: (parsed.state?.currentLocale as Locale) || 'en',
        impactMode: typeof parsed.state?.impactMode === 'boolean' ? parsed.state.impactMode : false,
        activeImpactTab,
        aiBallStyle,
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
    aiBallStyle: 'orb',
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
  aiBallStyle: AIBallStyle;
  setMobileNavOpen: (open: boolean) => void;
  toggleMobileNav: () => void;
  setLocale: (locale: Locale) => void;
  setMenuTriggerRef: (ref: React.RefObject<HTMLButtonElement>) => void;
  setTheme: (theme: ThemeId) => void;
  setSettingsMenuOpen: (open: boolean) => void;
  toggleSettingsMenu: () => void;
  setImpactMode: (on: boolean) => void;
  setActiveImpactTab: (tab: string) => void;
  setAIBallStyle: (style: AIBallStyle) => void;
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
      aiBallStyle: initialUI.aiBallStyle,

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
      setImpactMode: (impactMode) => {
        applyWelfareVivid(impactMode);
        set({ impactMode });
      },
      setActiveImpactTab: (activeImpactTab) => set({ activeImpactTab }),
      setAIBallStyle: (aiBallStyle) => set({ aiBallStyle }),
    }),
    {
      name: 'vicoo-ui-settings',
      partialize: (state) => ({
        currentTheme: state.currentTheme,
        currentLocale: state.currentLocale,
        impactMode: state.impactMode,
        activeImpactTab: state.activeImpactTab,
        aiBallStyle: state.aiBallStyle,
      }),
      /**
       * persist's hydration is async: the user may have switched back to UNIQLO before
       * getItem completes. The default merge would let the impactMode in localStorage
       * **overwrite** the in-memory value of false, causing "half-applied UI" glitches like
       * a red header background + welfare palette/capsule/logo (`<img>` not switched to onRed).
       * theme/locale still use the persisted value; impact always uses the current in-memory
       * value (consistent with the initial UI, unless the user has acted).
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
        // Re-calibrate attributes that were set in sync with first render, to avoid desync between DOM attributes and in-memory impactMode after merge / async hydration
        if (state) {
          applyWelfareVivid(Boolean(state.impactMode));
        }
      },
    }
  )
);

// Apply theme + document lang on first load (before hydration) to prevent flash
applyTheme(initialUI.currentTheme);
applyLocale(initialUI.currentLocale);
applyWelfareVivid(initialUI.impactMode);
