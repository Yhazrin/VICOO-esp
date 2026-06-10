import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Locale } from '@/types';

export type ThemeId = 'monochrome' | 'sweet-cyan' | 'deep-sea' | 'aurora' | 'dark-pink' | 'soft-pink';
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
    id: 'monochrome',
    name: 'Pure Mono',
    nameCn: '纯粹黑白',
    description: 'Stark black and white contrast',
    preview: 'linear-gradient(135deg, #1A1A1D 0%, #FFFFFF 100%)',
  },
  {
    id: 'sweet-cyan',
    name: 'Sweet Cyan',
    nameCn: '甜酷青',
    description: 'Vibrant pink meets cyan',
    preview: 'linear-gradient(135deg, #E6397C 0%, #01847F 100%)',
  },
  {
    id: 'deep-sea',
    name: 'Deep Sea',
    nameCn: '深海蓝',
    description: 'Deep ocean blue with clarity',
    preview: 'linear-gradient(135deg, #122E8A 0%, #FFFFFF 100%)',
  },
  {
    id: 'aurora',
    name: 'Aurora Purple',
    nameCn: '极光紫',
    description: 'Dreamy aurora purple haze',
    preview: 'linear-gradient(135deg, #9F82FD 0%, #FFFFFF 100%)',
  },
  {
    id: 'dark-pink',
    name: 'Dark Pink',
    nameCn: '甜酷粉',
    description: 'Bold pink on deep black',
    preview: 'linear-gradient(135deg, #1A1A1D 0%, #E6397C 100%)',
  },
  {
    id: 'soft-pink',
    name: 'Soft Pink',
    nameCn: '柔粉',
    description: 'Gentle pink cotton candy',
    preview: 'linear-gradient(135deg, #F1DDDF 0%, #F9D2E4 100%)',
  },
];

export const DARK_THEMES: ReadonlySet<ThemeId> = new Set<ThemeId>(['dark-pink']);

/**
 * Apply theme to document root — mode-aware.
 * UNIQLO view (impactMode=false) always forces 'monochrome'.
 */
function applyThemeToDOM(theme: ThemeId, inImpactMode: boolean) {
  const effective = inImpactMode ? theme : 'monochrome';
  document.documentElement.setAttribute('data-theme', effective);
  if (inImpactMode && DARK_THEMES.has(theme)) {
    document.documentElement.setAttribute('data-dark-theme', '');
  } else {
    document.documentElement.removeAttribute('data-dark-theme');
  }
}

export { applyThemeToDOM };

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
        currentTheme: (parsed.state?.currentTheme as ThemeId) || 'monochrome',
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
    currentTheme: 'monochrome',
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
  /** Dev-only: hide top header bar for clean marketing screenshots (not persisted). */
  headerHiddenForCapture: boolean;
  setMobileNavOpen: (open: boolean) => void;
  toggleMobileNav: () => void;
  toggleHeaderHiddenForCapture: () => void;
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
    (set, get) => ({
      mobileNavOpen: false,
      currentLocale: initialUI.currentLocale,
      currentTheme: initialUI.currentTheme,
      menuTriggerRef: null,
      settingsMenuOpen: false,
      impactMode: initialUI.impactMode,
      activeImpactTab: initialUI.activeImpactTab,
      aiBallStyle: initialUI.aiBallStyle,
      headerHiddenForCapture: false,

      setMobileNavOpen: (mobileNavOpen) => set({ mobileNavOpen }),
      toggleHeaderHiddenForCapture: () =>
        set((state) => ({ headerHiddenForCapture: !state.headerHiddenForCapture })),
      toggleMobileNav: () =>
        set((state) => ({ mobileNavOpen: !state.mobileNavOpen })),
      setLocale: (currentLocale) => {
        applyLocale(currentLocale);
        set({ currentLocale });
      },
      setMenuTriggerRef: (menuTriggerRef) => set({ menuTriggerRef }),
      setTheme: (currentTheme) => {
        applyThemeToDOM(currentTheme, get().impactMode);
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
        if (state?.currentTheme) {
          applyThemeToDOM(state.currentTheme, state.impactMode ?? false);
        }
        if (state?.currentLocale) {
          applyLocale(state.currentLocale);
        }
        if (state) {
          applyWelfareVivid(Boolean(state.impactMode));
        }
      },
    }
  )
);

// Apply theme + document lang on first load (before hydration) to prevent flash
applyThemeToDOM(initialUI.currentTheme, initialUI.impactMode);
applyLocale(initialUI.currentLocale);
applyWelfareVivid(initialUI.impactMode);
