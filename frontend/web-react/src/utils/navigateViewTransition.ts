import { flushSync } from 'react-dom';
import type { NavigateFunction, NavigateOptions } from 'react-router-dom';

export function supportsViewTransition(): boolean {
  return typeof document !== 'undefined' && typeof document.startViewTransition === 'function';
}

/**
 * SPA 导航 + View Transitions API：共享元素（如商品图）在路由切换时变形过渡。
 *
 * **必须**在回调里先 `await prefetch()` 再 `navigate`：ProductDetail 为 lazy 时，
 * 否则新快照会拍到 Suspense fallback，没有带 view-transition-name 的节点，过渡等于失效。
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
      /* 预加载失败仍继续导航 */
    }
    flushSync(() => {
      navigate(to, options);
    });
  });
}
