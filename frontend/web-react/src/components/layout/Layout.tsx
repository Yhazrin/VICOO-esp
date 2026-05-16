import { Outlet, useMatch, useLocation } from 'react-router-dom';
import { useEffect, useLayoutEffect, lazy, Suspense, useRef } from 'react';
import Header from './Header';
import ImpactWelfareGlobeLayer from './ImpactWelfareGlobeLayer';
import EditorialFooter from './EditorialFooter';
import MobileNav from './MobileNav';
import KeyedRouteContent from '../transitions/KeyedRouteContent';
import GrainOverlay from '../animations/GrainOverlay';
import { AIAssistantBall } from './AIAssistantBall';
import { useUIStore } from '@/stores/uiStore';
import { COMPANY_NAV } from '@/constants/companyNav';

// Lazy-load impact shell pages — these are heavy and only needed in impact mode
const Home = lazy(() => import('@/pages/Home'));
const Campaigns = lazy(() => import('@/pages/Campaigns'));
const Donate = lazy(() => import('@/pages/Donate'));
const ImpactShop = lazy(() => import('@/pages/ImpactShop'));
const ClothingRecycle = lazy(() => import('@/pages/ClothingRecycle'));

function ImpactContent() {
  const { activeImpactTab } = useUIStore();

  const content = (() => {
    switch (activeImpactTab) {
      case 'campaigns': return <Campaigns />;
      case 'donate': return <Donate />;
      case 'shop': return <ImpactShop />;
      case 'clothing-recycle': return <ClothingRecycle />;
      default: return <Home />;
    }
  })();

  return <Suspense fallback={<div style={{ minHeight: '60vh' }} />}>{content}</Suspense>;
}

export default function Layout() {
  const { impactMode, activeImpactTab, setImpactMode, setActiveImpactTab } = useUIStore();
  const location = useLocation();
  const isImpactShopRoute = Boolean(useMatch({ path: '/impact/shop', end: false }));
  /** 仅在首页 `/` 且开启公益壳时用 tab 内容；`/shop`、`/about` 等必须走 `<Outlet />`，否则常规店被挡住 */
  const renderImpactShell = impactMode && location.pathname === '/';
  const mainContent = renderImpactShell ? <ImpactContent /> : <Outlet />;

  useEffect(() => {
    if (!renderImpactShell) return;
    void import('@/components/scroll/SupplyChainGlobe');
    void import('@/data/world-land-110m.json');
  }, [renderImpactShell]);
  /**
   * 与「公司」下整站共用 `company-outlet`：在**同一 URL `/`** 上切换优衣库与公益时不再更换外层 key。
   * 若仍用 `company-outlet`↔`impact-${tab}`，KeyedRouteContent 会多卸一屏，与 Outlet↔ImpactContent 子树切换叠加，主线程/双 WebGL 冷启动会明显更卡。
   * tab 子页面刷新由 `ImpactContent` 内部 `switch` 完成，外无需再包一层 `impact-${tab}`。
   *
   * 公益商店：列表与详情共用 `impact-shop-route`（与既有 View Transitions 设计一致）。
   */
  const impactShopUnifiedKey =
    location.pathname.startsWith('/impact/shop') ||
    (renderImpactShell && activeImpactTab === 'shop');
  const mountKey: string = impactShopUnifiedKey ? 'impact-shop-route' : 'company-outlet';

  // Use a ref to prevent the auto-enable effect from triggering right after handleImpactToggle
  // This avoids the race condition where the Layout effect re-enables impactMode immediately after
  // the user toggled it off via handleImpactToggle.
  const isManualImpactToggle = useRef(false);

  useEffect(() => {
    if (isImpactShopRoute) {
      isManualImpactToggle.current = true;
      setImpactMode(true);
      setActiveImpactTab('shop');
    }
  }, [isImpactShopRoute, setImpactMode, setActiveImpactTab]);

  useEffect(() => {
    // Only auto-disable when navigating to company routes via internal link clicks,
    // not when coming from the impact toggle button (which handles its own navigate).
    // Skip if this route change was triggered by handleImpactToggle.
    if (!impactMode || isManualImpactToggle.current) {
      if (isManualImpactToggle.current) {
        isManualImpactToggle.current = false;
      }
      return;
    }
    const nonRootCompanyPaths = COMPANY_NAV.filter((n) => n.path !== '/').map((n) => n.path);
    const isCompanyRoute = nonRootCompanyPaths.some(
      (p) => location.pathname === p || location.pathname.startsWith(p + '/')
    );
    if (isCompanyRoute) {
      setImpactMode(false);
    }
  }, [location.pathname, impactMode, setImpactMode]);

  // 与顶栏公益↔优衣库切换同一帧同步，避免 paint 后再改 html 变量导致 header 上仍用旧的 --color-*（看起来像样式丢失）
  useLayoutEffect(() => {
    const on = impactMode || isImpactShopRoute;
    if (on) {
      document.documentElement.setAttribute('data-welfare-vivid', '');
    } else {
      document.documentElement.removeAttribute('data-welfare-vivid');
    }
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
      <main id="main-content" className="relative flex-1 pt-[4.25rem] md:pt-24">
        {renderImpactShell && <ImpactWelfareGlobeLayer />}
        <div className="relative z-10 min-h-0">
          <KeyedRouteContent mountKey={mountKey}>
            {mainContent}
          </KeyedRouteContent>
        </div>
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
