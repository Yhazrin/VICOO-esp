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
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-[100] focus:px-4 focus:py-2 focus:bg-ink focus:text-paper focus:font-body focus:text-label"
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
