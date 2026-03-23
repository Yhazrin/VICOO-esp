import { useCallback } from 'react';
import { useScroll, useTransform, type MotionValue } from 'framer-motion';
import { useReducedMotion } from 'framer-motion';

/**
 * Reusable hook for scroll-linked animations.
 * Provides scroll progress (0-1) and common interpolation utilities.
 *
 * @param threshold - Progress value (0-1) at which animations should start/end
 * @returns Object with scrollProgress, mapRange, lerp, clamp utilities
 */
export function useScrollProgress() {
  const prefersReducedMotion = useReducedMotion();
  const { scrollYProgress } = useScroll();

  const clamp = useCallback((value: number, min: number, max: number) => {
    return Math.max(min, Math.min(max, value));
  }, []);

  const lerp = useCallback((start: number, end: number, t: number) => {
    return start + (end - start) * t;
  }, []);

  const mapRange = useCallback(
    (value: number, inMin: number, inMax: number, outMin: number, outMax: number) => {
      const t = clamp((value - inMin) / (inMax - inMin), 0, 1);
      return lerp(outMin, outMax, t);
    },
    [clamp, lerp]
  );

  return {
    scrollYProgress: scrollYProgress as MotionValue<number>,
    prefersReducedMotion,
    mapRange,
    lerp,
    clamp,
  };
}

/**
 * Creates a scroll-linked opacity animation.
 * Element fades in as scroll progress enters [start, peak] range,
 * and fades out as it exits [peak, end] range.
 */
export function useScrollFade(
  scrollYProgress: MotionValue<number>,
  prefersReducedMotion: boolean,
  _mapRange: (v: number, iMin: number, iMax: number, oMin: number, oMax: number) => number,
  start: number,
  peak: number,
  end: number
) {
  const opacity = useTransform(
    scrollYProgress,
    [start, peak, end],
    prefersReducedMotion ? [1, 1, 1] : [0, 1, 0]
  );

  return opacity;
}

/**
 * Creates a scroll-linked translateY animation.
 */
export function useScrollTranslate(
  scrollYProgress: MotionValue<number>,
  prefersReducedMotion: boolean,
  _mapRange: (v: number, iMin: number, iMax: number, oMin: number, oMax: number) => number,
  start: number,
  end: number,
  from: number,
  to: number
) {
  const y = useTransform(
    scrollYProgress,
    [start, end],
    prefersReducedMotion ? [0, 0] : [from, to]
  );

  return y;
}
