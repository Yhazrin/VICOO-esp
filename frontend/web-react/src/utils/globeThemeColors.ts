import type { ThemeId } from '@/stores/uiStore';

export interface GlobeThemeColors {
  ocean: number;
  oceanOpacity: number;
  land: string;
  landAlpha: number;
  wire: number;
  wireOpacity: number;
  gridOpacity: number;
  outline: number;
  outlineOpacity: number;
}

export const GLOBE_COLORS: Record<ThemeId, GlobeThemeColors> = {
  monochrome: {
    ocean:   0x1B4F72, oceanOpacity: 0.38,
    land:    '#4A6741', landAlpha: 0.75,
    wire:    0x1A1A16, wireOpacity: 0.03, gridOpacity: 0.015,
    outline: 0x1A1A16, outlineOpacity: 0.52,
  },
  'sweet-cyan': {
    ocean:   0x0A7A75, oceanOpacity: 0.32,
    land:    '#3D6B4D', landAlpha: 0.55,
    wire:    0x1A1A1D, wireOpacity: 0.03, gridOpacity: 0.015,
    outline: 0x1A1A1D, outlineOpacity: 0.50,
  },
  'deep-sea': {
    ocean:   0x0D2060, oceanOpacity: 0.38,
    land:    '#2B5A3D', landAlpha: 0.55,
    wire:    0x122E8A, wireOpacity: 0.04, gridOpacity: 0.02,
    outline: 0x122E8A, outlineOpacity: 0.55,
  },
  aurora: {
    ocean:   0x3A2A6A, oceanOpacity: 0.30,
    land:    '#4A6560', landAlpha: 0.50,
    wire:    0x6A5A9A, wireOpacity: 0.04, gridOpacity: 0.02,
    outline: 0x5A4A80, outlineOpacity: 0.50,
  },
  'dark-pink': {
    ocean:   0x0A1520, oceanOpacity: 0.80,
    land:    '#1A3020', landAlpha: 0.90,
    wire:    0xE6397C, wireOpacity: 0.06, gridOpacity: 0.03,
    outline: 0xE6397C, outlineOpacity: 0.65,
  },
  'soft-pink': {
    ocean:   0x7AAFC0, oceanOpacity: 0.30,
    land:    '#7AA078', landAlpha: 0.50,
    wire:    0xA08890, wireOpacity: 0.04, gridOpacity: 0.02,
    outline: 0x907880, outlineOpacity: 0.50,
  },
};

export function resolveGlobeColors(themeId: ThemeId): GlobeThemeColors {
  return GLOBE_COLORS[themeId] ?? GLOBE_COLORS.monochrome;
}
