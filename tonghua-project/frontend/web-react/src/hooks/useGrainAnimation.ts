import { useEffect, useState } from 'react';

/**
 * Hook to detect user's prefers-reduced-motion preference
 * and provide animation state control for grain effects.
 *
 * @example
 * const { prefersReducedMotion, isAnimating } = useGrainAnimation();
 *
 * if (isAnimating) {
 *   // Apply animation classes
 * }
 */
export interface UseGrainAnimationResult {
  /** True if user prefers reduced motion */
  prefersReducedMotion: boolean;
  /** Whether the grain animation should run */
  shouldAnimate: boolean;
  /** CSS transform for the grain scale */
  scaleTransform: string;
  /** Current opacity value */
  opacity: number;
}

export interface UseGrainAnimationOptions {
  /** Whether to respect the prefers-reduced-motion media query. Default: true */
  respectReducedMotion?: boolean;
  /** Base opacity of the grain. Default: 0.06 */
  baseOpacity?: number;
  /** Minimum scale value. Default: 1 */
  scaleFrom?: number;
  /** Maximum scale value. Default: 1.03 */
  scaleTo?: number;
  /** Animation duration in seconds. Default: 10 */
  duration?: number;
}

/**
 * useGrainAnimation - Hook for grain animation with breathing effect
 *
 * Provides animation state based on user preferences and
 * generates transform strings for manual animation implementations.
 */
export function useGrainAnimation(
  options: UseGrainAnimationOptions = {}
): UseGrainAnimationResult {
  const {
    respectReducedMotion = true,
    baseOpacity = 0.06,
    scaleFrom = 1,
    scaleTo = 1.03,
  } = options;

  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    if (!respectReducedMotion) {
      setPrefersReducedMotion(false);
      return;
    }

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

    // Set initial value
    setPrefersReducedMotion(mediaQuery.matches);

    // Listen for changes
    const handler = (event: MediaQueryListEvent) => {
      setPrefersReducedMotion(event.matches);
    };

    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, [respectReducedMotion]);

  // Calculate if animation should run
  const shouldAnimate = !prefersReducedMotion;

  // Generate CSS transform for manual animation
  // This can be used with CSS animations or inline styles
  const scaleTransform = shouldAnimate
    ? `scale(${scaleTo})`
    : `scale(${scaleFrom})`;

  return {
    prefersReducedMotion,
    shouldAnimate,
    scaleTransform,
    opacity: baseOpacity,
  };
}

/**
 * CSS keyframes for grain breathing animation
 * Can be injected into a style tag or CSS module
 */
export const grainBreathingKeyframes = `
@keyframes grain-breathing {
  0%, 100% {
    transform: scale(1);
    opacity: 0.06;
  }
  50% {
    transform: scale(1.03);
    opacity: 0.06;
  }
}

.grain-overlay-animated {
  will-change: transform;
  animation: grain-breathing 10s ease-in-out infinite;
}

@media (prefers-reduced-motion: reduce) {
  .grain-overlay-animated {
    animation: none;
    transform: scale(1);
  }
}
`;

/**
 * Tailwind-compatible utility classes for grain overlay
 * Add to your tailwind.config or use via arbitrary values
 */
export const grainOverlayClasses = {
  base: 'fixed inset-0 pointer-events-none z-[9999]',
  animated: 'grain-overlay-animated',
  reduced: 'transform scale-100',
};
