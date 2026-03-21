import { Outlet } from 'react-router-dom';
import Header from './Header';
import EditorialFooter from './EditorialFooter';
import MobileNav from './MobileNav';
import CurtainTransition from '../animations/CurtainTransition';
import GrainOverlay from '../animations/GrainOverlay';

export default function Layout() {
  return (
    <div className="min-h-[100dvh] flex flex-col bg-paper text-ink">
      <Header />
      <MobileNav />
      <main className="flex-1 pt-16 md:pt-20">
        <CurtainTransition>
          <Outlet />
        </CurtainTransition>
      </main>
      <EditorialFooter />
      <GrainOverlay />
    </div>
  );
}
