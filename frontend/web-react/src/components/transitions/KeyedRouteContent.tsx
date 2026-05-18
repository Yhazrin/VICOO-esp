import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * KeyedRouteContent — Remounts children on route changes via React key.
 *
 * This ensures the page component tree is fully fresh on each navigation,
 * preventing stale content from flashing during route transitions.
 *
 * If an explicit `mountKey` prop is provided (e.g. impact tab key), it takes
 * precedence over location.pathname so that tab switches within the same
 * route don't needlessly remount the component tree.
 */
export default function KeyedRouteContent({ children, mountKey }: { children: React.ReactNode; mountKey?: string }) {
  const location = useLocation();
  const prevKeyRef = useRef<string | null>(null);

  // Fires when the key changes (component remounts after route change)
  useEffect(() => {
    const nextKey = mountKey ?? location.pathname;
    if (prevKeyRef.current !== null && prevKeyRef.current !== nextKey) {
      // Route changed — scroll to top after DOM settles
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
        });
      });
    }
    prevKeyRef.current = nextKey;
  }, [mountKey, location.pathname]);

  return (
    <div key={mountKey ?? location.pathname}>
      {children}
    </div>
  );
}
