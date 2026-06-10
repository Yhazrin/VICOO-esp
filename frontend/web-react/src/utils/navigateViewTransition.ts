import { flushSync } from 'react-dom';
import type { NavigateFunction, NavigateOptions } from 'react-router-dom';

export function supportsViewTransition(): boolean {
  return typeof document !== 'undefined' && typeof document.startViewTransition === 'function';
}

/**
 * SPA navigation + View Transitions API: shared elements (e.g. product images)
 * morph during route transitions.
 *
 * **Must** `await prefetch()` before `navigate` inside the callback: when
 * ProductDetail is lazy-loaded, otherwise the new snapshot captures the Suspense
 * fallback with no view-transition-name nodes, effectively breaking the transition.
 */
export function navigateWithViewTransition(
  navigate: NavigateFunction,
  to: string,
  options?: NavigateOptions,
  prefetch?: () => Promise<unknown>
): void {
  const reduceMotion =
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (!supportsViewTransition() || reduceMotion) {
    navigate(to, options);
    return;
  }

  document.startViewTransition(async () => {
    try {
      await prefetch?.();
    } catch {
      /* Continue navigation even if prefetch fails */
    }
    flushSync(() => {
      navigate(to, options);
    });
  });
}
