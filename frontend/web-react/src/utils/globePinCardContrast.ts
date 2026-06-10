import type { WebGLRenderer } from 'three';
import type { ThemeId } from '@/stores/uiStore';
import { resolveGlobeColors } from '@/utils/globeThemeColors';

/** Card copy/contrast when the globe backdrop behind the glass pin is dark or light. */
export type GlobePinCardTone = 'on-dark' | 'on-light';

/** sRGB relative luminance (0–1). */
export function relativeLuminance(r: number, g: number, b: number): number {
  const lin = (c: number) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

export function luminanceFromHexNumber(hex: number): number {
  const r = (hex >> 16) & 255;
  const g = (hex >> 8) & 255;
  const b = hex & 255;
  return relativeLuminance(r, g, b);
}

export function luminanceFromCssHex(hex: string): number {
  const h = hex.trim().replace('#', '');
  if (h.length !== 6) return 0.5;
  const n = Number.parseInt(h, 16);
  if (Number.isNaN(n)) return 0.5;
  return luminanceFromHexNumber(n);
}

/** Default page paper (--color-paper) approximate luminance. */
const PAPER_LUMINANCE = 0.94;

/** Below → dark globe/ocean behind card → light text (`on-dark`). */
export const GLOBE_BACKDROP_LUMINANCE_THRESHOLD = 0.42;

/**
 * Estimate backdrop brightness from globe theme colors (ocean + land + fog).
 * Used before / without canvas sampling.
 */
export function estimateGlobeBackdropLuminance(themeId: ThemeId): number {
  const c = resolveGlobeColors(themeId);
  const oceanL = luminanceFromHexNumber(c.ocean);
  const oceanBlend = oceanL * c.oceanOpacity + PAPER_LUMINANCE * (1 - c.oceanOpacity);
  const landL = luminanceFromCssHex(c.land);
  const landBlend = landL * c.landAlpha + PAPER_LUMINANCE * (1 - c.landAlpha);
  const wireL = luminanceFromHexNumber(c.wire);
  const fogL = PAPER_LUMINANCE * 0.88 + wireL * 0.12;
  return oceanBlend * 0.58 + landBlend * 0.22 + fogL * 0.2;
}

export type ResolveGlobePinCardToneInput = {
  themeId: ThemeId;
  /** Optional canvas sample at pin/card anchor (0–1 sRGB luminance). */
  sampledLuminance?: number | null;
  /**
   * How much to trust the sample vs theme estimate when both exist.
   * 0 = theme only, 1 = sample only.
   */
  sampleWeight?: number;
};

/**
 * Choose glass-card text/surface variant for readability over the globe.
 */
export function resolveGlobePinCardTone(input: ResolveGlobePinCardToneInput): GlobePinCardTone {
  const themeLum = estimateGlobeBackdropLuminance(input.themeId);
  const sample = input.sampledLuminance;
  const weight =
    sample != null && Number.isFinite(sample)
      ? Math.min(1, Math.max(0, input.sampleWeight ?? 0.72))
      : 0;

  let lum = themeLum;
  if (weight > 0 && sample != null) {
    lum = themeLum * (1 - weight) + sample * weight;
  }

  return lum < GLOBE_BACKDROP_LUMINANCE_THRESHOLD ? 'on-dark' : 'on-light';
}

/**
 * Sample pixels from the rendered globe canvas near a CSS-space point.
 * Call only after `renderer.render()` in the same frame.
 */
export function sampleWebGlBackdropLuminance(
  renderer: WebGLRenderer,
  containerRect: DOMRect,
  cssX: number,
  cssY: number,
  sampleSize = 14,
): number | null {
  const canvas = renderer.domElement;
  const gl = renderer.getContext();
  if (!gl || containerRect.width <= 0 || containerRect.height <= 0) return null;

  const dpr = renderer.getPixelRatio();
  const px = Math.floor(cssX * dpr);
  const py = Math.floor((containerRect.height - cssY) * dpr);
  const half = Math.floor(sampleSize / 2);
  const w = sampleSize;
  const h = sampleSize;
  const x0 = Math.max(0, Math.min(canvas.width - w, px - half));
  const y0 = Math.max(0, Math.min(canvas.height - h, py - half));
  const buf = new Uint8Array(w * h * 4);

  try {
    gl.readPixels(x0, y0, w, h, gl.RGBA, gl.UNSIGNED_BYTE, buf);
  } catch {
    return null;
  }

  let sum = 0;
  const n = w * h;
  for (let i = 0; i < n; i++) {
    const o = i * 4;
    const a = buf[o + 3] / 255;
    const lr = relativeLuminance(buf[o], buf[o + 1], buf[o + 2]);
    sum += lr * a + PAPER_LUMINANCE * (1 - a);
  }
  return sum / n;
}

export type GlobePinCardClassNames = {
  shell: string;
  accentLine: string;
  title: string;
  body: string;
  muted: string;
  mono: string;
  description: string;
  uncertifiedBadge: string;
  galleryBorder: string;
};

export function globePinCardClassNames(tone: GlobePinCardTone): GlobePinCardClassNames {
  if (tone === 'on-dark') {
    return {
      shell:
        'border-white/20 bg-ink/55 shadow-[0_12px_40px_-16px_rgba(0,0,0,0.45)]',
      accentLine: 'bg-gradient-to-r from-transparent via-white/25 to-transparent',
      title: 'text-white/92',
      body: 'text-white/62',
      muted: 'text-white/50',
      mono: 'text-white/42',
      description: 'text-white/58',
      uncertifiedBadge: 'bg-white/10 text-white/48 border-white/22',
      galleryBorder: 'border-white/15',
    };
  }

  return {
    shell:
      'border-warm-gray/30 bg-paper/96 shadow-[0_12px_40px_-16px_rgba(26,26,22,0.18)]',
    accentLine: 'bg-gradient-to-r from-transparent via-rust/35 to-transparent',
    title: 'text-ink',
    body: 'text-sepia-mid',
    muted: 'text-ink-faded',
    mono: 'text-sepia-mid/80',
    description: 'text-ink/80',
    uncertifiedBadge: 'bg-warm-gray/20 text-ink-faded border-warm-gray/35',
    galleryBorder: 'border-warm-gray/15',
  };
}
