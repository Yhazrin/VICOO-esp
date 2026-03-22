import { Outlet } from 'react-router-dom';
import Header from './Header';
import EditorialFooter from './EditorialFooter';
import MobileNav from './MobileNav';
import CurtainTransition from '../animations/CurtainTransition';
import GrainOverlay from '../animations/GrainOverlay';

export default function Layout() {
  return (
    <div className="min-h-[100dvh] flex flex-col bg-paper text-ink">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[9999] focus:bg-ink focus:text-paper focus:px-4 focus:py-2 focus:font-mono focus:text-xs focus:tracking-wider focus:uppercase"
      >
        Skip to content
      </a>
      <Header />
      <MobileNav />
      <main id="main-content" className="flex-1 pt-16 md:pt-20">
        <CurtainTransition>
          <Outlet />
        </CurtainTransition>
      </main>
      <EditorialFooter />
      <GrainOverlay />
    </div>
  );
}
