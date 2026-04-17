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

  return (
    <div key={mountKey ?? location.pathname}>
      {children}
    </div>
  );
}
