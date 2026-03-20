import { Outlet } from 'react-router-dom';
import Header from './Header';
import EditorialFooter from './EditorialFooter';
import MobileNav from './MobileNav';

export default function Layout() {
  return (
    <div className="min-h-screen flex flex-col bg-paper text-ink">
      <Header />
      <MobileNav />
      <main className="flex-1 pt-16 md:pt-20">
        <Outlet />
      </main>
      <EditorialFooter />
    </div>
  );
}
