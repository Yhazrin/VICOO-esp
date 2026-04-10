import { Outlet } from 'react-router-dom';
import Header from './Header';
import EditorialFooter from './EditorialFooter';
import MobileNav from './MobileNav';
import KeyedRouteContent from '../transitions/KeyedRouteContent';
import GrainOverlay from '../animations/GrainOverlay';
import { AIAssistantBall } from './AIAssistantBall';
import { useUIStore } from '@/stores/uiStore';
import Campaigns from '@/pages/Campaigns';
import Vote from '@/pages/Vote';
import Traceability from '@/pages/Traceability';
import Donate from '@/pages/Donate';
import ImpactShop from '@/pages/ImpactShop';

function ImpactContent() {
  const { activeImpactTab } = useUIStore();

  switch (activeImpactTab) {
    case 'campaigns': return <Campaigns />;
    case 'vote': return <Vote />;
    case 'traceability': return <Traceability />;
    case 'donate': return <Donate />;
    case 'shop': return <ImpactShop />;
    default: return <Campaigns />;
  }
}

export default function Layout() {
  const { impactMode } = useUIStore();

  return (
    <div className="min-h-[100dvh] flex flex-col bg-paper text-ink">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[9999] focus:px-4 focus:py-2 focus:bg-rust focus:text-paper focus:font-body focus:text-body-sm focus:tracking-[0.1em] focus:uppercase"
      >
        Skip to main content
      </a>
      <Header />
      <MobileNav />
      <main id="main-content" className="flex-1 pt-16 md:pt-20">
        <KeyedRouteContent>
          {impactMode ? <ImpactContent /> : <Outlet />}
        </KeyedRouteContent>
      </main>
      <EditorialFooter />
      <GrainOverlay />
      <AIAssistantBall />
    </div>
  );
}

// Separate export for pages that need full-height scroll control (e.g., scroll narratives)
export function FullHeightLayout() {
  return (
    <div className="min-h-[100dvh] flex flex-col bg-paper text-ink">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[9999] focus:px-4 focus:py-2 focus:bg-rust focus:text-paper focus:font-body focus:text-body-sm focus:tracking-[0.1em] focus:uppercase"
      >
        Skip to main content
      </a>
      <Header />
      <MobileNav />
      <main id="main-content" className="flex-1 pt-16 md:pt-20 overflow-visible">
        <Outlet />
      </main>
      <EditorialFooter />
      {/* No GrainOverlay here - scroll narrative handles its own grain effect */}
    </div>
  );
}
