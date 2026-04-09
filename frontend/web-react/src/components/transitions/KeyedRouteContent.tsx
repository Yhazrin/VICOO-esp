import { useLocation } from 'react-router-dom';

/**
 * KeyedRouteContent — Remounts children on route changes via React key.
 *
 * This ensures the page component tree is fully fresh on each navigation,
 * preventing stale content from flashing during route transitions.
 */
export default function KeyedRouteContent({ children }: { children: React.ReactNode }) {
  const location = useLocation();

  return (
    <div key={location.pathname}>
      {children}
    </div>
  );
}
