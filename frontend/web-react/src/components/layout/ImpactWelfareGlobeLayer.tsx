import { lazy, Suspense, useMemo } from 'react';
import { useReducedMotion } from 'framer-motion';
import { SUPPLY_CHAIN_ROUTES } from '@/data/supplyChain';
import { useUIStore } from '@/stores/uiStore';

const SupplyChainGlobe = lazy(() => import('@/components/scroll/SupplyChainGlobe'));

/**
 * Large globe under the welfare shell: mounted in Layout at the same level as the
 * Impact tab subtree; switching tabs does not unmount WebGL.
 * Visible and interactive on the home tab; on other tabs only rAF is paused and
 * pointer events are disabled.
 */
export default function ImpactWelfareGlobeLayer() {
  const activeImpactTab = useUIStore((s) => s.activeImpactTab);
  const prefersReducedMotion = useReducedMotion();
  const routes = useMemo(() => SUPPLY_CHAIN_ROUTES, []);
  const suspended = activeImpactTab !== 'home';

  if (prefersReducedMotion) return null;

  return (
    <div
      className={`-mt-[4.25rem] md:-mt-24 absolute left-0 right-0 top-0 z-0 h-[min(135dvh,260vw)] max-h-[2200px] ${
        suspended ? 'pointer-events-none opacity-0' : 'pointer-events-auto opacity-100'
      }`}
      aria-hidden={suspended}
      style={suspended ? { contentVisibility: 'hidden' } : undefined}
    >
      <Suspense fallback={null}>
        <SupplyChainGlobe routes={routes} suspended={suspended} lockOpacity />
      </Suspense>
    </div>
  );
}
