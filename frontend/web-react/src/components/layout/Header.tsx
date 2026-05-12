import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence, useReducedMotion, type Transition } from 'framer-motion';
import { useUIStore, THEMES, type ThemeId } from '@/stores/uiStore';
import { useAuthStore } from '@/stores/authStore';
import { useCartStore, selectTotalItems } from '@/stores/cartStore';
import { useAuth } from '@/hooks/useAuth';
import { useIsMobile } from '@/hooks/useMediaQuery';
import { useRef, useEffect, useState, useCallback, useLayoutEffect, useMemo } from 'react';
import UniqloLogo from './UniqloLogo';
import { COMPANY_NAV, matchCompanyNavKey } from '@/constants/companyNav';

/** Spring for sliding nav pill — bouncier settle (non-linear). */
const SLIDING_PILL_SPRING = {
  type: 'spring' as const,
  stiffness: 400,
  damping: 22,
  mass: 0.72,
};

/**
 * Mode morph: single duration + cubic-bezier for every driven property.
 * Springs settle at different rates per channel — tween keeps radius/width/margin/x in phase.
 */
/** 略短于旧 520ms：产品里顶栏形态切换多在 380–450ms，体感更跟手、长任务窗更短 */
const MODE_MORPH_DURATION = 0.44;
const MODE_MORPH_EASE = [0.22, 1, 0.36, 1] as const;

/** 与 MODE_MORPH 同步的圆角过渡（避免 class 瞬间切换与容器 motion 不同步） */
const PILL_CORNER_TRANSITION_CLASS =
  'transition-[border-radius] duration-[440ms] ease-[cubic-bezier(0.22,1,0.36,1)]';

function getModeMorphTransition(reduceMotion: boolean): Transition {
  if (reduceMotion) {
    return { duration: 0.2, ease: [0.25, 0.1, 0.25, 1] };
  }
  return {
    duration: MODE_MORPH_DURATION,
    ease: MODE_MORPH_EASE,
  };
}

// ── Impact nav tabs (all public-welfare pages live here) ──
// Impact tabs don't use routing — they switch inline content via activeImpactTab.
// path is kept as '/' so URL stays clean.
const IMPACT_TABS = [
  { key: 'home' },
  { key: 'campaigns' },
  { key: 'donate' },
  { key: 'clothing-recycle' },
  { key: 'shop' },
];

// ── PillWindow: capsule "window" with a horizontal sliding rail ──
// Both tag groups sit side-by-side on one rail.  The capsule auto-resizes
// to fit the active group while the rail slides to reveal it — like a
// microfilm viewer advancing to the next frame.
//
// Extracted to module scope so the component identity is stable across
// Header re-renders (prevents remount jitter).
function PillWindow({
  impactMode,
  activeImpactTab,
  setActiveImpactTab,
  locationPathname,
  modeMorphTransition,
}: {
  impactMode: boolean;
  activeImpactTab: string;
  setActiveImpactTab: (tab: string) => void;
  locationPathname: string;
  modeMorphTransition: Transition;
}) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const prefersReducedMotion = useReducedMotion();

  const companyRef = useRef<HTMLDivElement>(null);
  const impactRef = useRef<HTMLDivElement>(null);
  const companyItemRefs = useRef<Map<string, HTMLElement>>(new Map());
  const impactItemRefs = useRef<Map<string, HTMLElement>>(new Map());
  const [companyW, setCompanyW] = useState(0);
  const [impactW, setImpactW] = useState(0);
  const [companyHl, setCompanyHl] = useState<{ x: number; y: number; w: number; h: number } | null>(null);
  const [impactHl, setImpactHl] = useState<{ x: number; y: number; w: number; h: number } | null>(null);

  /**
   * Company rail: only one “active” item when NOT in impact mode.
   * On `/` + impactMode, pathname is shared — do not treat company Home as selected.
   * Nested routes: `/shop/:id`, `/about/...` still highlight the right company tab.
   */
  const activeCompanyKey = useMemo((): string | null => {
    if (impactMode) return null;
    return matchCompanyNavKey(locationPathname);
  }, [locationPathname, impactMode]);

  const measure = useCallback(() => {
    if (companyRef.current) setCompanyW(companyRef.current.offsetWidth);
    if (impactRef.current) setImpactW(impactRef.current.offsetWidth);
  }, []);

  const measureHighlight = useCallback(
    (container: HTMLDivElement | null, activeKey: string | null, refs: Map<string, HTMLElement>) => {
      if (!container || !activeKey) return null;
      const el = refs.get(activeKey);
      if (!el) return null;
      const c = container.getBoundingClientRect();
      const e = el.getBoundingClientRect();
      return {
        x: e.left - c.left,
        y: e.top - c.top,
        w: e.width,
        h: e.height,
      };
    },
    [],
  );

  const updateHighlights = useCallback(() => {
    // Only measure the rail that is logically active — avoids two pills / wrong slides when modes share `/`.
    if (!impactMode) {
      setImpactHl(null);
      setCompanyHl(measureHighlight(companyRef.current, activeCompanyKey, companyItemRefs.current));
    } else {
      setCompanyHl(null);
      setImpactHl(measureHighlight(impactRef.current, activeImpactTab, impactItemRefs.current));
    }
  }, [activeCompanyKey, activeImpactTab, impactMode, measureHighlight]);

  useEffect(() => {
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [measure]);

  // 公益 ↔ 优衣库切换时外层胶囊宽度依赖 companyW/impactW；仅 mount 时 measure 一次会在模式切换后留下错误宽度（刷新后更明显）
  useLayoutEffect(() => {
    measure();
  }, [impactMode, measure]);

  // Re-measure when language changes (text width changes)
  useEffect(() => {
    const id = requestAnimationFrame(measure);
    return () => cancelAnimationFrame(id);
  }, [t, measure]);

  useLayoutEffect(() => {
    updateHighlights();
  }, [updateHighlights, companyW, impactW, impactMode, locationPathname, t]);

  useLayoutEffect(() => {
    const c = companyRef.current;
    const i = impactRef.current;
    const ro = new ResizeObserver(() => updateHighlights());
    if (c) ro.observe(c);
    if (i) ro.observe(i);
    return () => ro.disconnect();
  }, [updateHighlights]);

  // After capsule / rail motion settles, pill geometry may shift slightly
  useEffect(() => {
    const ms = prefersReducedMotion ? 220 : Math.round(MODE_MORPH_DURATION * 1000) + 40;
    const t1 = window.setTimeout(updateHighlights, ms);
    return () => clearTimeout(t1);
  }, [impactMode, updateHighlights, prefersReducedMotion]);

  // Company tabs: remeasure after client navigation so the sliding pill matches (Outlet paint can lag one frame).
  useEffect(() => {
    if (impactMode) return;
    let alive = true;
    let raf2 = 0;
    const raf1 = requestAnimationFrame(() => {
      if (!alive) return;
      updateHighlights();
      raf2 = requestAnimationFrame(() => {
        if (alive) updateHighlights();
      });
    });
    return () => {
      alive = false;
      cancelAnimationFrame(raf1);
      cancelAnimationFrame(raf2);
    };
  }, [locationPathname, impactMode, updateHighlights]);

  const pillTransition = prefersReducedMotion
    ? { duration: 0.12, ease: [0.25, 0.1, 0.25, 1] as const }
    : SLIDING_PILL_SPRING;

  // Capsule has px-2 (8px each side = 16px padding).
  // Offset uses pure content width; capsule width adds padding so
  // the first & last tags have equal breathing room on both sides.
  const PADDING = 16;
  const xOffset = impactMode ? -companyW : 0;
  const activeRailW = impactMode ? impactW : companyW;
  // innerW 为 0 时不要用 0+PADDING 当成真实宽度，否则 Framer 会动画到极窄宽度，切回优衣库后导航条样式像「丢失」
  const capsuleW = activeRailW > 0 ? activeRailW + PADDING : 0;

  const pillWidthTransition = prefersReducedMotion
    ? undefined
    : `width ${MODE_MORPH_DURATION}s cubic-bezier(0.33, 1, 0.68, 1), border-radius ${MODE_MORPH_DURATION}s cubic-bezier(0.33, 1, 0.68, 1)`;

  // 外层不用 motion 驱动 width：Framer 在 width 数字与 "auto" 间切换时，公益↔优衣库偶发卡在中间态；改为 CSS transition + 像素宽度
  return (
    <div
      className={`
        flex items-center overflow-hidden px-2 py-1 shadow-sm
        ${impactMode
          ? 'border border-warm-gray/20 bg-white/80 backdrop-blur-xl'
          : 'border border-white/30 bg-white/15 backdrop-blur-md'
        }
      `}
      style={{
        width: capsuleW > 0 ? capsuleW : undefined,
        maxWidth: '100%',
        borderRadius: impactMode ? 9999 : 4,
        transition: pillWidthTransition,
        boxSizing: 'border-box',
      }}
    >
      <motion.div
        className="flex items-center"
        animate={{ x: xOffset }}
        transition={modeMorphTransition}
        style={{ minWidth: 'max-content', willChange: 'transform' }}
      >
        {/* Company group */}
        <div ref={companyRef} className="relative flex flex-shrink-0 items-center">
          {companyHl && (
            <motion.div
              aria-hidden
              className={`pointer-events-none absolute z-0 bg-white ${PILL_CORNER_TRANSITION_CLASS} ${impactMode ? 'rounded-full' : 'rounded-sm'} ${prefersReducedMotion ? '' : 'will-change-[left,top,width,height]'}`}
              initial={false}
              animate={{
                left: companyHl.x,
                top: companyHl.y,
                width: companyHl.w,
                height: companyHl.h,
                borderRadius: impactMode ? 9999 : 4,
              }}
              transition={{
                left: pillTransition,
                top: pillTransition,
                width: pillTransition,
                height: pillTransition,
                borderRadius: modeMorphTransition,
              }}
            />
          )}
          {COMPANY_NAV.map((item) => {
            const isActive = !impactMode && activeCompanyKey === item.key;
            return (
              <Link
                key={item.key}
                ref={(el) => {
                  if (el) companyItemRefs.current.set(item.key, el);
                  else companyItemRefs.current.delete(item.key);
                }}
                to={item.path}
                aria-current={isActive ? 'page' : undefined}
                className={`
                  relative z-10 cursor-pointer whitespace-nowrap px-5 py-1 font-body text-label tracking-wide
                  ${PILL_CORNER_TRANSITION_CLASS}
                  ${impactMode ? 'rounded-full' : 'rounded-sm'}
                  ${isActive
                    ? impactMode
                      ? 'font-medium text-paper'
                      : 'font-medium text-[#E60012]'
                    : impactMode
                      ? 'text-ink-faded hover:text-ink'
                      : 'text-white/85 hover:text-white'
                  }
                `}
              >
                {t(`nav.${item.key}`)}
              </Link>
            );
          })}
        </div>
        {/* Impact group */}
        <div ref={impactRef} className="relative flex flex-shrink-0 items-center">
          {impactHl && (
            <motion.div
              aria-hidden
              className={`pointer-events-none absolute z-0 rounded-full bg-ink ${PILL_CORNER_TRANSITION_CLASS} ${prefersReducedMotion ? '' : 'will-change-[left,top,width,height]'}`}
              initial={false}
              animate={{
                left: impactHl.x,
                top: impactHl.y,
                width: impactHl.w,
                height: impactHl.h,
                borderRadius: 9999,
              }}
              transition={{
                left: pillTransition,
                top: pillTransition,
                width: pillTransition,
                height: pillTransition,
                borderRadius: modeMorphTransition,
              }}
            />
          )}
          {IMPACT_TABS.map((tab) => {
            const isActive = impactMode && activeImpactTab === tab.key;
            return (
              <button
                key={tab.key}
                ref={(el) => {
                  if (el) impactItemRefs.current.set(tab.key, el);
                  else impactItemRefs.current.delete(tab.key);
                }}
                type="button"
                aria-current={isActive ? 'page' : undefined}
                onClick={() => {
                  setActiveImpactTab(tab.key);
                  // Impact 子页（活动列表/详情等）走 <Outlet />，只有 pathname === '/' 时才渲染顶栏 tab 对应的 ImpactContent
                  if (locationPathname === '/') return;
                  if (tab.key === 'shop' && locationPathname.startsWith('/impact/shop')) {
                    navigate('/', { replace: true });
                    return;
                  }
                  navigate('/');
                }}
                className={`
                  relative z-10 cursor-pointer whitespace-nowrap px-5 py-1 font-body text-label tracking-wide
                  ${PILL_CORNER_TRANSITION_CLASS}
                  ${impactMode ? 'rounded-full' : 'rounded-sm'}
                  ${isActive
                    ? 'font-medium text-paper'
                    : impactMode
                      ? 'text-ink-faded hover:text-ink'
                      : 'text-white/40'
                  }
                `}
              >
                {t(`nav.${tab.key}`)}
              </button>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
}

export default function Header() {
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const prefersReducedMotion = useReducedMotion();

  const {
    mobileNavOpen,
    toggleMobileNav,
    setMobileNavOpen,
    currentLocale,
    setLocale,
    setMenuTriggerRef,
    currentTheme,
    setTheme,
    setSettingsMenuOpen,
    impactMode,
    setImpactMode,
    activeImpactTab,
    setActiveImpactTab,
  } = useUIStore();

  const { user, isAuthenticated } = useAuthStore();
  const { logout } = useAuth();
  const toggleCart = useCartStore((s) => s.toggleCart);
  const totalCartItems = useCartStore(selectTotalItems);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [activeSubmenu, setActiveSubmenu] = useState<'main' | 'theme' | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  const menuTriggerRef = useRef<HTMLButtonElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMenuTriggerRef(menuTriggerRef);
  }, [setMenuTriggerRef]);

  // When navigating to a company route (other than the root "/"), exit impact mode.
  // "/" is the shared landing page for both modes — don't auto-deactivate there.
  useEffect(() => {
    if (!impactMode) return;
    const nonRootCompanyPaths = COMPANY_NAV.filter((n) => n.path !== '/').map((n) => n.path);
    const isCompanyRoute = nonRootCompanyPaths.some(
      (p) => location.pathname === p || location.pathname.startsWith(p + '/')
    );
    if (isCompanyRoute) {
      setImpactMode(false);
    }
  }, [location.pathname, impactMode, setImpactMode]);

  // Close user menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
        setActiveSubmenu(null);
        setSettingsMenuOpen(false);
      }
    };

    if (userMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [userMenuOpen, setSettingsMenuOpen]);

  const toggleLocale = () => {
    const next = currentLocale === 'en' ? 'zh' : 'en';
    setLocale(next);
    i18n.changeLanguage(next);
  };

  const handleLogout = () => {
    logout();
    setUserMenuOpen(false);
    setActiveSubmenu(null);
    navigate('/');
  };

  const handleThemeChange = (themeId: ThemeId) => {
    setTheme(themeId);
    setActiveSubmenu(null);
  };

  const currentThemeConfig = THEMES.find((theme) => theme.id === currentTheme);

  useEffect(() => {
    if (searchOpen) {
      requestAnimationFrame(() => searchInputRef.current?.focus());
    }
  }, [searchOpen]);

  useEffect(() => {
    if (!searchOpen) return;
    const onMouseDown = (event: MouseEvent) => {
      const target = event.target as Node | null;
      if (target && searchContainerRef.current?.contains(target)) return;
      setSearchOpen(false);
    };
    document.addEventListener('mousedown', onMouseDown);
    return () => document.removeEventListener('mousedown', onMouseDown);
  }, [searchOpen]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = searchQuery.trim();
    if (q) {
      const basePath = impactMode ? '/impact/shop' : '/shop';
      navigate(`${basePath}?search=${encodeURIComponent(q)}`);
      setSearchOpen(false);
      setSearchQuery('');
    }
  };

  const handleImpactToggle = () => {
    if (impactMode) {
      setImpactMode(false);
      navigate('/');
    } else {
      setImpactMode(true);
      setActiveImpactTab('home');
      // 仍在 /shop、/about 等公司路径时，同步 effect 会立刻关掉 impact；先回首页再展示公益壳
      const companySubPaths = COMPANY_NAV.filter((n) => n.path !== '/').map((n) => n.path);
      const onCompanySubRoute = companySubPaths.some(
        (p) => location.pathname === p || location.pathname.startsWith(p + '/')
      );
      if (onCompanySubRoute) {
        navigate('/', { replace: true });
      }
    }
  };

  const modeMorphTransition = getModeMorphTransition(Boolean(prefersReducedMotion));
  /** 顶栏玻璃+大圆角：blur 与 margin 同帧很吃合成；升层减轻跟手时的掉帧 */
  const headerBarGpuClass = 'transform-gpu [backface-visibility:hidden] [isolation:isolate]';

  const iconDisc = impactMode
    ? 'bg-white text-ink-faded shadow-sm hover:shadow-md border border-warm-gray/15'
    : 'border border-white/25 bg-white/20 text-white shadow-none hover:bg-white/30';

  return (
    <header className="pointer-events-none fixed top-0 left-0 right-0 z-50">
      <motion.div
        className={`pointer-events-auto ${headerBarGpuClass}`}
        initial={false}
        animate={{
          marginTop: impactMode ? 10 : 0,
          marginLeft: impactMode ? 12 : 0,
          marginRight: impactMode ? 12 : 0,
          borderRadius: impactMode ? 9999 : 0,
          backgroundColor: impactMode ? 'rgba(252, 250, 246, 0.92)' : '#E60012',
        }}
        transition={modeMorphTransition}
        style={{
          boxShadow: impactMode
            ? '0 8px 32px rgba(0, 0, 0, 0.07), inset 0 1px 0 rgba(255, 255, 255, 0.58)'
            : 'inset 0 -1px 0 rgba(0, 0, 0, 0.2)',
          backdropFilter: impactMode ? 'saturate(180%) blur(14px)' : 'none',
          WebkitBackdropFilter: impactMode ? 'saturate(180%) blur(14px)' : 'none',
          transition: prefersReducedMotion
            ? undefined
            : impactMode
              ? `box-shadow ${MODE_MORPH_DURATION}s cubic-bezier(0.33, 1, 0.68, 1), backdrop-filter ${MODE_MORPH_DURATION}s cubic-bezier(0.33, 1, 0.68, 1), -webkit-backdrop-filter ${MODE_MORPH_DURATION}s cubic-bezier(0.33, 1, 0.68, 1)`
              : `box-shadow ${MODE_MORPH_DURATION}s cubic-bezier(0.33, 1, 0.68, 1), backdrop-filter 0s linear, -webkit-backdrop-filter 0s linear`,
        }}
      >
        <div className="relative mx-auto flex h-14 max-w-[1400px] items-center justify-between px-6 md:px-10">
        {/* Logo */}
        <Link
          to="/"
          className="flex items-center cursor-pointer"
          onClick={() => {
            setMobileNavOpen(false);
            setImpactMode(false);
          }}
        >
          <motion.div animate={{ x: impactMode ? -6 : 0 }} transition={modeMorphTransition}>
            <UniqloLogo variant={impactMode ? 'default' : 'onRed'} />
          </motion.div>
          <AnimatePresence mode="wait">
            {impactMode && (
              <motion.span
                key="vicoo-badge"
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -8 }}
                transition={{ type: 'spring', stiffness: 420, damping: 28, delay: 0.04 }}
                className="font-display text-sm font-medium tracking-wide whitespace-nowrap text-ink select-none md:text-base"
              >
                × VICOO
              </motion.span>
            )}
          </AnimatePresence>
        </Link>

        {/* Right side: pill groups + controls */}
        <div className="flex items-center gap-3">
          {/* Desktop Navigation — pill-group style */}
          {!isMobile && (
            <nav className="flex items-center gap-3" aria-label="Main navigation">
              {/* Pill group — capsule "window", both tag groups ride on one sliding rail */}
              <PillWindow
                impactMode={impactMode}
                activeImpactTab={activeImpactTab}
                setActiveImpactTab={setActiveImpactTab}
                locationPathname={location.pathname}
                modeMorphTransition={modeMorphTransition}
              />

              {/* Impact toggle: UNIQLO = classic red/white; Impact shell = glass card */}
              <button
                type="button"
                data-testid="impact-mode-toggle"
                onClick={handleImpactToggle}
                aria-pressed={impactMode}
                className={`
                  rounded-full px-5 py-1.5 font-body text-label font-medium tracking-wide transition-all duration-300 cursor-pointer
                  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2
                  ${impactMode
                    ? `
                      border border-warm-gray/25 bg-white/75 text-ink shadow-sm backdrop-blur-xl
                      hover:bg-white/90 hover:border-warm-gray/35 hover:shadow-md
                      focus-visible:ring-[#E60012]/40 focus-visible:ring-offset-paper
                    `
                    : `
                      border-0 bg-white text-[#E60012] shadow-md
                      hover:bg-white/95
                      focus-visible:ring-white/80 focus-visible:ring-offset-[#E60012]
                    `
                  }
                `}
              >
                {impactMode ? t('nav.uniqloPortal') : t('nav.impact')}
              </button>
            </nav>
          )}

          {/* Search — expandable */}
          {!isMobile && (
            <div ref={searchContainerRef} className="flex items-center gap-2">
              <AnimatePresence>
                {searchOpen && (
                  <motion.form
                    onSubmit={handleSearch}
                    initial={{ width: 0, opacity: 0 }}
                    animate={{ width: 200, opacity: 1 }}
                    exit={{ width: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
                    className="overflow-hidden"
                  >
                    <input
                      ref={searchInputRef}
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder={t('search.placeholder', 'Search products...')}
                      className="w-[200px] px-4 py-1.5 rounded-full bg-white/90 backdrop-blur-xl shadow-sm font-body text-sm text-ink placeholder:text-warm-gray/60 focus:outline-none focus:ring-1 focus:ring-rust/30"
                      onBlur={() => {
                        if (!searchQuery.trim()) setSearchOpen(false);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Escape') {
                          setSearchOpen(false);
                          setSearchQuery('');
                        }
                      }}
                    />
                  </motion.form>
                )}
              </AnimatePresence>
              <button
                onClick={() => {
                  setSearchOpen((prev) => !prev);
                }}
                className={`flex h-9 w-9 items-center justify-center rounded-full transition-all cursor-pointer ${iconDisc}`}
                aria-label="Search"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                  <circle cx="11" cy="11" r="7" />
                  <path d="M21 21l-4.35-4.35" strokeLinecap="round" />
                </svg>
              </button>
            </div>
          )}

          {/* Cart icon — white disc */}
          <button
            onClick={toggleCart}
            className={`relative flex h-9 w-9 items-center justify-center rounded-full transition-all cursor-pointer ${iconDisc}`}
            aria-label={t('cart.title')}
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
              <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <path d="M16 10a4 4 0 01-8 0" />
            </svg>
            {totalCartItems > 0 && (
              <span
                className={`absolute -right-1 -top-1 flex h-4.5 min-h-[18px] w-4.5 min-w-[18px] items-center justify-center rounded-full font-mono text-[10px] leading-none ${
                  impactMode ? 'bg-rust text-paper' : 'bg-white text-[#E60012]'
                }`}
              >
                {totalCartItems > 99 ? '99+' : totalCartItems}
              </span>
            )}
          </button>

          {/* Language toggle — white disc */}
          <button
            onClick={toggleLocale}
            className={`font-body text-caption flex h-9 w-9 items-center justify-center rounded-full transition-colors cursor-pointer ${iconDisc} ${impactMode ? 'hover:text-ink' : ''}`}
            aria-label={t('nav.toggleLanguage', 'Toggle language')}
          >
            {currentLocale === 'zh' ? 'EN' : '中'}
          </button>

          {/* User menu — white disc avatar */}
          <div className="relative" ref={userMenuRef}>
            <button
              onClick={() => {
                setUserMenuOpen(!userMenuOpen);
                setActiveSubmenu(null);
              }}
              className={`flex h-9 w-9 items-center justify-center rounded-full transition-all cursor-pointer ${iconDisc}`}
              aria-label={t('nav.userMenu', 'User menu')}
              aria-expanded={userMenuOpen}
              aria-haspopup="menu"
            >
              {isAuthenticated && user ? (
                <div className="w-8 h-8 rounded-full bg-sepia-mid flex items-center justify-center">
                  <span className="text-caption text-paper font-medium">
                    {user.nickname?.charAt(0).toUpperCase() || 'U'}
                  </span>
                </div>
              ) : (
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              )}
            </button>

            {/* Dropdown menu */}
            <AnimatePresence>
              {userMenuOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.15 }}
                  role="menu"
                  aria-label={t('nav.userMenu', 'User menu')}
                  className="absolute right-0 top-full mt-2 w-56 bg-paper border border-warm-gray/40 shadow-lg z-50 rounded-lg"
                >
                  {activeSubmenu === 'theme' ? (
                    <div className="py-2">
                      <div className="px-4 py-2 border-b border-warm-gray/20 flex items-center gap-2">
                        <button
                          onClick={() => setActiveSubmenu(null)}
                          className="text-sepia-mid hover:text-ink cursor-pointer"
                          aria-label="Back to main menu"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                          </svg>
                        </button>
                        <span className="font-body text-caption text-sepia-mid">
                          {t('nav.settings.theme', 'Theme')}
                        </span>
                      </div>
                      <div className="max-h-64 overflow-y-auto">
                        {THEMES.map((theme) => (
                          <button
                            key={theme.id}
                            onClick={() => handleThemeChange(theme.id)}
                            className={`w-full flex items-center gap-3 px-4 py-2.5 hover:bg-warm-gray/10 transition-colors cursor-pointer ${
                              currentTheme === theme.id ? 'bg-warm-gray/10' : ''
                            }`}
                          >
                            <div
                              className="w-8 h-8 rounded-sm border border-warm-gray/30 flex-shrink-0"
                              style={{ background: theme.preview }}
                            />
                            <div className="text-left flex-1 min-w-0">
                              <p className="font-body text-body-sm text-ink truncate">
                                {currentLocale === 'zh' ? theme.nameCn : theme.name}
                              </p>
                              <p className="font-body text-caption text-sepia-mid truncate">
                                {theme.description}
                              </p>
                            </div>
                            {currentTheme === theme.id && (
                              <svg className="w-4 h-4 text-rust flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                              </svg>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="py-2">
                      {isAuthenticated && user ? (
                        <>
                          <div className="px-4 py-2 border-b border-warm-gray/20">
                            <p className="font-body text-body-sm text-ink font-medium">{user.nickname}</p>
                            <p className="font-body text-caption text-sepia-mid truncate">{user.email}</p>
                          </div>

                          <button
                            onClick={() => setActiveSubmenu('theme')}
                            className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-warm-gray/10 transition-colors cursor-pointer"
                          >
                            <span className="flex items-center gap-2">
                              <svg className="w-4 h-4 text-sepia-mid" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                              </svg>
                              <span className="font-body text-body-sm text-ink">{t('nav.settings.theme', 'Theme')}</span>
                            </span>
                            <div className="flex items-center gap-2">
                              <div
                                className="w-4 h-4 rounded-full border border-warm-gray/30"
                                style={{ background: currentThemeConfig?.preview }}
                              />
                              <svg className="w-3 h-3 text-sepia-mid" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                              </svg>
                            </div>
                          </button>

                          <Link
                            to="/profile"
                            role="menuitem"
                            className="flex items-center gap-2 px-4 py-2.5 hover:bg-warm-gray/10 transition-colors cursor-pointer"
                            onClick={() => setUserMenuOpen(false)}
                          >
                            <svg className="w-4 h-4 text-sepia-mid" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                            <span className="font-body text-body-sm text-ink">{t('nav.profile')}</span>
                          </Link>

                          <Link
                            to="/submit-artwork"
                            role="menuitem"
                            className="flex items-center gap-2 px-4 py-2.5 hover:bg-warm-gray/10 transition-colors cursor-pointer"
                            onClick={() => setUserMenuOpen(false)}
                          >
                            <svg className="w-4 h-4 text-sepia-mid" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            <span className="font-body text-body-sm text-ink">{t('nav.submitArtwork', 'Submit Artwork')}</span>
                          </Link>

                          {(user.role === 'admin' || user.role === 'editor') && (
                            <Link
                              to="/ai-design"
                              role="menuitem"
                              className="flex items-center gap-2 px-4 py-2.5 hover:bg-warm-gray/10 transition-colors cursor-pointer"
                              onClick={() => setUserMenuOpen(false)}
                            >
                              <svg className="w-4 h-4 text-sepia-mid" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                              </svg>
                              <span className="font-body text-body-sm text-ink">{t('nav.aiDesign', 'AI Design')}</span>
                            </Link>
                          )}
                          {(user.role === 'admin' || user.role === 'editor') && (
                            <Link
                              to="/studio/supply-chain"
                              role="menuitem"
                              className="flex items-center gap-2 px-4 py-2.5 hover:bg-warm-gray/10 transition-colors cursor-pointer"
                              onClick={() => setUserMenuOpen(false)}
                            >
                              <svg className="w-4 h-4 text-sepia-mid" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              <span className="font-body text-body-sm text-ink">{t('nav.supplyChainStudio', '溯源媒体')}</span>
                            </Link>
                          )}

                          <button
                            onClick={handleLogout}
                            className="w-full flex items-center gap-2 px-4 py-2.5 hover:bg-warm-gray/10 transition-colors cursor-pointer"
                          >
                            <svg className="w-4 h-4 text-sepia-mid" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                            </svg>
                            <span className="font-body text-body-sm text-ink">{t('nav.logout')}</span>
                          </button>
                        </>
                      ) : (
                        <>
                          <div className="px-4 py-2 border-b border-warm-gray/20">
                            <p className="font-body text-caption text-ink-faded">{t('nav.settings.title', 'Settings')}</p>
                          </div>

                          <button
                            onClick={() => setActiveSubmenu('theme')}
                            className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-warm-gray/10 transition-colors cursor-pointer"
                          >
                            <span className="flex items-center gap-2">
                              <svg className="w-4 h-4 text-sepia-mid" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                              </svg>
                              <span className="font-body text-body-sm text-ink">{t('nav.settings.theme', 'Theme')}</span>
                            </span>
                            <div className="flex items-center gap-2">
                              <div
                                className="w-4 h-4 rounded-full border border-warm-gray/30"
                                style={{ background: currentThemeConfig?.preview }}
                              />
                              <svg className="w-3 h-3 text-sepia-mid" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                              </svg>
                            </div>
                          </button>

                          <Link
                            to="/login"
                            role="menuitem"
                            className="flex items-center gap-2 px-4 py-2.5 hover:bg-warm-gray/10 transition-colors cursor-pointer"
                            onClick={() => setUserMenuOpen(false)}
                          >
                            <svg className="w-4 h-4 text-sepia-mid" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                            </svg>
                            <span className="font-body text-body-sm text-ink">{t('nav.login')}</span>
                          </Link>
                        </>
                      )}
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Mobile hamburger */}
          {isMobile && (
            <button
              ref={menuTriggerRef}
              onClick={toggleMobileNav}
              className="flex cursor-pointer flex-col gap-1.5 p-2"
              aria-label={t('nav.toggleMenu', 'Toggle menu')}
              aria-expanded={mobileNavOpen}
              aria-controls="mobile-navigation"
            >
              <motion.span
                animate={prefersReducedMotion ? {} : (mobileNavOpen ? { rotate: 45, y: 6 } : { rotate: 0, y: 0 })}
                className={`block h-px w-6 ${impactMode ? 'bg-ink' : 'bg-white'}`}
              />
              <motion.span
                animate={prefersReducedMotion ? {} : (mobileNavOpen ? { opacity: 0 } : { opacity: 1 })}
                className={`block h-px w-6 ${impactMode ? 'bg-ink' : 'bg-white'}`}
              />
              <motion.span
                animate={prefersReducedMotion ? {} : (mobileNavOpen ? { rotate: -45, y: -6 } : { rotate: 0, y: 0 })}
                className={`block h-px w-6 ${impactMode ? 'bg-ink' : 'bg-white'}`}
              />
            </button>
          )}
        </div>
        </div>
      </motion.div>
    </header>
  );
}
