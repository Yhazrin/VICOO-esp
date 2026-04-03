import { Outlet } from 'react-router-dom';
import Header from './Header';
import EditorialFooter from './EditorialFooter';
import MobileNav from './MobileNav';
import HorizontalSlideTransition from '../transitions/HorizontalSlideTransition';
import GrainOverlay from '../animations/GrainOverlay';
import { AIAssistantBall } from './AIAssistantBall';

export default function Layout() {
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
        <HorizontalSlideTransition>
          <Outlet />
        </HorizontalSlideTransition>
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
