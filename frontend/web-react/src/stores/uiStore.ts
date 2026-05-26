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
 * 与 Layout 中 useLayoutEffect 同步：把 `data-welfare-vivid` 直接挂到 <html> 上。
 * 关键点：在 store 创建（模块加载）期、`setImpactMode` 调用时都同步刷新，
 * 防止首屏 / 模式切换的当帧出现「Header className 已切公益、但 CSS 变量仍是优衣库」
 * 这种「公益胶囊套优衣库色」的半套样式（用户报告的"部分按钮仍保持慈善格式"）。
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
    (set, get) => ({
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
