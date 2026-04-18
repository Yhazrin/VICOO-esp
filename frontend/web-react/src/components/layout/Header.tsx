import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { useUIStore, THEMES, type ThemeId } from '@/stores/uiStore';
import { useAuthStore } from '@/stores/authStore';
import { useCartStore, selectTotalItems } from '@/stores/cartStore';
import { useAuth } from '@/hooks/useAuth';
import { useIsMobile } from '@/hooks/useMediaQuery';
import { useRef, useEffect, useState, useCallback } from 'react';
import UniqloLogo from './UniqloLogo';

// ── Company nav: UNIQLO portal ──
const COMPANY_NAV = [
  { key: 'home', path: '/' },
  { key: 'shop', path: '/shop' },
  { key: 'about', path: '/about' },
  { key: 'contact', path: '/contact' },
];

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
  navigate,
}: {
  impactMode: boolean;
  activeImpactTab: string;
  setActiveImpactTab: (tab: string) => void;
  locationPathname: string;
  navigate: (to: string) => void;
}) {
  const { t } = useTranslation();

  const companyRef = useRef<HTMLDivElement>(null);
  const impactRef = useRef<HTMLDivElement>(null);
  const [companyW, setCompanyW] = useState(0);
  const [impactW, setImpactW] = useState(0);

  const measure = useCallback(() => {
    if (companyRef.current) setCompanyW(companyRef.current.offsetWidth);
    if (impactRef.current) setImpactW(impactRef.current.offsetWidth);
  }, []);

  useEffect(() => {
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [measure]);

  // Re-measure when language changes (text width changes)
  useEffect(() => {
    const id = requestAnimationFrame(measure);
    return () => cancelAnimationFrame(id);
  }, [t, measure]);

  // Capsule has px-2 (8px each side = 16px padding).
  // Offset uses pure content width; capsule width adds padding so
  // the first & last tags have equal breathing room on both sides.
  const PADDING = 16;
  const xOffset = impactMode ? -companyW : 0;
  const capsuleW = (impactMode ? impactW : companyW) + PADDING;

  return (
    <motion.div
      className="flex items-center rounded-full bg-white/80 backdrop-blur-xl shadow-sm px-2 py-1 overflow-hidden"
      animate={{ width: capsuleW || 'auto' }}
      transition={{ duration: 0.45, ease: [0.32, 0.72, 0, 1] }}
      style={{ width: (companyW + PADDING) || 'auto' }}
    >
      <motion.div
        className="flex items-center"
        animate={{ x: xOffset }}
        transition={{ duration: 0.45, ease: [0.32, 0.72, 0, 1] }}
        style={{ minWidth: 'max-content', willChange: 'transform' }}
      >
        {/* Company group */}
        <div ref={companyRef} className="flex items-center flex-shrink-0">
          {COMPANY_NAV.map((item) => {
            const isActive = locationPathname === item.path;
            return (
              <Link
                key={item.key}
                to={item.path}
                className={`
                  font-body text-label tracking-wide px-3 py-1 rounded-full transition-all duration-200 cursor-pointer whitespace-nowrap
                  ${isActive ? 'text-ink font-medium bg-rust/15' : 'text-ink-faded hover:text-ink'}
                `}
              >
                {t(`nav.${item.key}`)}
              </Link>
            );
          })}
        </div>
        {/* Impact group */}
        <div ref={impactRef} className="flex items-center flex-shrink-0">
          {IMPACT_TABS.map((tab) => {
            const isActive = activeImpactTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => {
                  setActiveImpactTab(tab.key);
                  if (tab.key === 'shop') {
                    navigate('/impact/shop');
                  } else if (locationPathname.startsWith('/impact/shop')) {
                    navigate('/');
                  }
                }}
                className={`
                  font-body text-label tracking-wide px-3 py-1 rounded-full transition-all duration-200 cursor-pointer whitespace-nowrap
                  ${isActive ? 'text-ink font-medium bg-rust/15' : 'text-ink-faded hover:text-ink'}
                `}
              >
                {t(`nav.${tab.key}`)}
              </button>
            );
          })}
        </div>
      </motion.div>
    </motion.div>
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

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = searchQuery.trim();
    if (q) {
      navigate(`/shop?search=${encodeURIComponent(q)}`);
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
      setActiveImpactTab('campaigns');
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

  return (
    <header className="fixed top-0 left-0 right-0 z-50">
      <div className="relative max-w-[1400px] mx-auto px-6 md:px-10 flex items-center justify-between h-14">
        {/* Logo */}
        <Link
          to="/"
          className="flex items-center cursor-pointer"
          onClick={() => {
            setMobileNavOpen(false);
            setImpactMode(false);
          }}
        >
          <motion.div
            animate={{ x: impactMode ? -6 : 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 22 }}
          >
            <UniqloLogo />
          </motion.div>
          <AnimatePresence mode="wait">
            {impactMode && (
              <motion.span
                key="vicoo-badge"
                initial={{ opacity: 0, x: -12, filter: 'blur(4px)' }}
                animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
                exit={{ opacity: 0, x: -12, filter: 'blur(4px)' }}
                transition={{ type: 'spring', stiffness: 350, damping: 25, delay: 0.05 }}
                className="font-display text-ink text-sm md:text-base font-medium tracking-wide whitespace-nowrap select-none"
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
                navigate={navigate}
              />

              {/* Impact toggle button */}
              <button
                onClick={handleImpactToggle}
                className={`
                  font-body text-label tracking-wide px-5 py-1.5 rounded-full transition-all duration-300 cursor-pointer
                  ${impactMode
                    ? 'bg-ink text-paper font-medium'
                    : 'bg-white/80 backdrop-blur-xl shadow-sm text-ink-faded hover:text-ink'
                  }
                `}
              >
                {impactMode ? t('nav.home', 'Home') : t('nav.impact', 'Impact')}
              </button>
            </nav>
          )}

          {/* Search — expandable */}
          {!isMobile && (
            <div className="relative flex items-center">
              <AnimatePresence>
                {searchOpen && (
                  <motion.div
                    initial={{ width: 0, opacity: 0 }}
                    animate={{ width: 200, opacity: 1 }}
                    exit={{ width: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
                    className="absolute right-full mr-2 overflow-hidden"
                  >
                    <form onSubmit={handleSearch} className="w-[200px]">
                      <input
                        ref={searchInputRef}
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder={t('search.placeholder', 'Search products...')}
                        className="w-full px-4 py-1.5 rounded-full bg-white/90 backdrop-blur-xl shadow-sm font-body text-sm text-ink placeholder:text-warm-gray/60 focus:outline-none focus:ring-1 focus:ring-rust/30"
                        onBlur={() => {
                          if (!searchQuery) setSearchOpen(false);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Escape') {
                            setSearchOpen(false);
                            setSearchQuery('');
                          }
                        }}
                      />
                    </form>
                  </motion.div>
                )}
              </AnimatePresence>
              <button
                onClick={() => setSearchOpen(!searchOpen)}
                className="flex items-center justify-center w-9 h-9 rounded-full bg-white shadow-sm hover:shadow-md transition-all cursor-pointer"
                aria-label="Search"
              >
                <svg className="w-4 h-4 text-ink-faded" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                  <circle cx="11" cy="11" r="7" />
                  <path d="M21 21l-4.35-4.35" strokeLinecap="round" />
                </svg>
              </button>
            </div>
          )}

          {/* Cart icon — white disc */}
          <button
            onClick={toggleCart}
            className="relative flex items-center justify-center w-9 h-9 rounded-full bg-white shadow-sm hover:shadow-md transition-all cursor-pointer"
            aria-label={t('cart.title')}
          >
            <svg className="w-4 h-4 text-ink-faded" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
              <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <path d="M16 10a4 4 0 01-8 0" />
            </svg>
            {totalCartItems > 0 && (
              <span className="absolute -top-1 -right-1 w-4.5 h-4.5 min-w-[18px] min-h-[18px] flex items-center justify-center bg-rust text-paper font-mono text-[10px] rounded-full leading-none">
                {totalCartItems > 99 ? '99+' : totalCartItems}
              </span>
            )}
          </button>

          {/* Language toggle — white disc */}
          <button
            onClick={toggleLocale}
            className="font-body text-caption text-ink-faded hover:text-ink transition-colors w-9 h-9 rounded-full bg-white shadow-sm flex items-center justify-center cursor-pointer"
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
              className="flex items-center justify-center w-9 h-9 rounded-full bg-white shadow-sm hover:shadow-md transition-all cursor-pointer"
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
                <svg className="w-4 h-4 text-ink-faded" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
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
              className="flex flex-col gap-1.5 p-2 cursor-pointer"
              aria-label={t('nav.toggleMenu', 'Toggle menu')}
              aria-expanded={mobileNavOpen}
              aria-controls="mobile-navigation"
            >
              <motion.span
                animate={prefersReducedMotion ? {} : (mobileNavOpen ? { rotate: 45, y: 6 } : { rotate: 0, y: 0 })}
                className="block w-6 h-px bg-ink"
              />
              <motion.span
                animate={prefersReducedMotion ? {} : (mobileNavOpen ? { opacity: 0 } : { opacity: 1 })}
                className="block w-6 h-px bg-ink"
              />
              <motion.span
                animate={prefersReducedMotion ? {} : (mobileNavOpen ? { rotate: -45, y: -6 } : { rotate: 0, y: 0 })}
                className="block w-6 h-px bg-ink"
              />
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
