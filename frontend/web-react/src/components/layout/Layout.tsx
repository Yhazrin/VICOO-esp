import { Outlet, useMatch, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import Header from './Header';
import EditorialFooter from './EditorialFooter';
import MobileNav from './MobileNav';
import KeyedRouteContent from '../transitions/KeyedRouteContent';
import GrainOverlay from '../animations/GrainOverlay';
import { AIAssistantBall } from './AIAssistantBall';
import { useUIStore } from '@/stores/uiStore';
import Home from '@/pages/Home';
import Campaigns from '@/pages/Campaigns';
import Donate from '@/pages/Donate';
import ImpactShop from '@/pages/ImpactShop';
import ClothingRecycle from '@/pages/ClothingRecycle';

function ImpactContent() {
  const { activeImpactTab } = useUIStore();

  switch (activeImpactTab) {
    case 'home': return <Home />;
    case 'campaigns': return <Campaigns />;
    case 'donate': return <Donate />;
    case 'shop': return <ImpactShop />;
    case 'clothing-recycle': return <ClothingRecycle />;
    default: return <Home />;
  }
}

export default function Layout() {
  const { impactMode, activeImpactTab, setImpactMode, setActiveImpactTab } = useUIStore();
  const location = useLocation();
  const isImpactShopRoute = Boolean(useMatch({ path: '/impact/shop', end: false }));
  /** 仅在首页 `/` 且开启公益壳时用 tab 内容；`/shop`、`/about` 等必须走 `<Outlet />`，否则常规店被挡住 */
  const renderImpactShell = impactMode && location.pathname === '/';
  const mainContent = renderImpactShell ? <ImpactContent /> : <Outlet />;
  /**
   * 公益商店列表与详情共用同一 key，避免 `/` 公益 tab 商店 → `/impact/shop/:id` 时整棵主内容被卸载，
   * 否则 View Transitions 的共享元素无法正确衔接。
   * 其它公益 tab 仍按 tab 区分 key 以便切换时刷新。
   */
  const impactShopUnifiedKey =
    location.pathname.startsWith('/impact/shop') ||
    (renderImpactShell && activeImpactTab === 'shop');
  const mountKey = impactShopUnifiedKey
    ? 'impact-shop-route'
    : renderImpactShell
      ? `impact-${activeImpactTab}`
      : 'company-outlet';

  useEffect(() => {
    if (isImpactShopRoute) {
      setImpactMode(true);
      setActiveImpactTab('shop');
    }
  }, [isImpactShopRoute, setImpactMode, setActiveImpactTab]);

  useEffect(() => {
    const on = impactMode || isImpactShopRoute;
    document.documentElement.toggleAttribute('data-welfare-vivid', on);
    return () => document.documentElement.removeAttribute('data-welfare-vivid');
  }, [impactMode, isImpactShopRoute]);

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
      <main id="main-content" className="flex-1 pt-[4.25rem] md:pt-24">
        <KeyedRouteContent mountKey={mountKey}>
          {mainContent}
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
      <main id="main-content" className="flex-1 overflow-visible">
        <Outlet />
      </main>
      <EditorialFooter />
      {/* No GrainOverlay here - scroll narrative handles its own grain effect */}
      <AIAssistantBall />
    </div>
  );
}
