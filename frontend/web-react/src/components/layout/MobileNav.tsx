import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { useUIStore } from '@/stores/uiStore';
import { useAuthStore } from '@/stores/authStore';
import { useAuth } from '@/hooks/useAuth';
import { useRef, useEffect, useState } from 'react';
import { COMPANY_NAV } from '@/constants/companyNav';

// ── Impact tabs ──
const IMPACT_TABS = [
  { key: 'home' },
  { key: 'campaigns' },
  { key: 'donate' },
  { key: 'clothing-recycle' },
  { key: 'shop' },
];

export default function MobileNav() {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const { mobileNavOpen, setMobileNavOpen, menuTriggerRef, impactMode, setImpactMode, activeImpactTab, setActiveImpactTab } = useUIStore();
  const { user, isAuthenticated } = useAuthStore();
  const { logout } = useAuth();
  const [_userMenuOpen, setUserMenuOpen] = useState(false);
  const prefersReducedMotion = useReducedMotion();

  const dialogRef = useRef<HTMLDivElement>(null);
  const firstLinkRef = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    if (mobileNavOpen) {
      const focusTimer = setTimeout(() => {
        firstLinkRef.current?.focus();
      }, 100);

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          setMobileNavOpen(false);
        }
      };

      document.addEventListener('keydown', handleKeyDown);
      return () => {
        clearTimeout(focusTimer);
        document.removeEventListener('keydown', handleKeyDown);
      };
    } else {
      if (menuTriggerRef?.current) {
        menuTriggerRef.current.focus();
      }
      setUserMenuOpen(false);
    }
  }, [mobileNavOpen, setMobileNavOpen, menuTriggerRef]);

  const handleLogout = () => {
    logout();
    setUserMenuOpen(false);
    setMobileNavOpen(false);
    navigate('/');
  };

  const handleImpactToggle = () => {
    if (impactMode) {
      setImpactMode(false);
      navigate('/');
    } else {
      setImpactMode(true);
      setActiveImpactTab('campaigns');
      const companySubPaths = COMPANY_NAV.filter((n) => n.path !== '/').map((n) => n.path);
      const onCompanySubRoute = companySubPaths.some(
        (p) => location.pathname === p || location.pathname.startsWith(p + '/')
      );
      if (onCompanySubRoute) {
        navigate('/', { replace: true });
      }
    }
    setMobileNavOpen(false);
  };

  const renderNavItem = (
    key: string,
    label: string,
    index: number,
    isActive: boolean,
    onClick: () => void,
    linkTo?: string,
  ) => (
    <motion.div
      key={key}
      initial={prefersReducedMotion ? false : { opacity: 0, x: -30 }}
      animate={prefersReducedMotion ? {} : { opacity: 1, x: 0 }}
      transition={prefersReducedMotion ? { duration: 0 } : { delay: index * 0.05, duration: 0.3 }}
      className="w-full"
    >
      {linkTo ? (
        <Link
          ref={index === 0 ? firstLinkRef : undefined}
          to={linkTo}
          onClick={onClick}
          className={`
            flex items-center py-4 border-b border-warm-gray/20 w-full
            transition-colors duration-200 cursor-pointer
            ${isActive ? 'text-rust' : 'text-ink hover:text-rust'}
          `}
        >
          <span className="font-display text-h2 md:text-h1">{label}</span>
        </Link>
      ) : (
        <button
          onClick={onClick}
          className={`
            flex items-center py-4 border-b border-warm-gray/20 w-full text-left
            transition-colors duration-200 cursor-pointer
            ${isActive ? 'text-rust' : 'text-ink hover:text-rust'}
          `}
        >
          <span className="font-display text-h2 md:text-h1">{label}</span>
        </button>
      )}
    </motion.div>
  );

  return (
    <AnimatePresence>
      {mobileNavOpen && (
        <motion.div
          initial={prefersReducedMotion ? false : { opacity: 0 }}
          animate={prefersReducedMotion ? {} : { opacity: 1 }}
          exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0 }}
          transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.3 }}
          className="fixed inset-0 z-40 bg-paper/98 backdrop-blur-md flex flex-col justify-center overflow-y-auto"
          ref={dialogRef}
          id="mobile-navigation"
          role="dialog"
          aria-modal="true"
          aria-label="Mobile navigation menu"
        >
          <nav className="flex flex-col items-start px-8 gap-0">
            <AnimatePresence mode="wait">
              <motion.div
                key={impactMode ? 'impact' : 'company'}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.25 }}
                className="w-full"
              >
                <p className="font-body text-caption text-sepia-mid tracking-[0.25em] uppercase pt-4 pb-2">
                  {impactMode ? t('nav.group.impact', 'Impact') : t('nav.group.company', 'Company')}
                </p>
                {impactMode
                  ? IMPACT_TABS.map((tab, index) =>
                      renderNavItem(tab.key, t(`nav.${tab.key}`), index, activeImpactTab === tab.key, () => {
                        setActiveImpactTab(tab.key);
                        if (tab.key === 'shop') {
                          if (location.pathname !== '/' && location.pathname.startsWith('/impact/shop')) {
                            navigate('/', { replace: true });
                          }
                        } else if (location.pathname.startsWith('/impact/shop')) {
                          navigate('/');
                        }
                        setMobileNavOpen(false);
                      })
                    )
                  : COMPANY_NAV.map((item, index) =>
                      renderNavItem(item.key, t(`nav.${item.key}`), index, location.pathname === item.path, () => setMobileNavOpen(false), item.path)
                    )
                }
              </motion.div>
            </AnimatePresence>

            {/* Impact toggle */}
            <button
              type="button"
              onClick={handleImpactToggle}
              aria-pressed={impactMode}
              className={`
                group mt-6 w-full flex items-center px-4 py-4 rounded-xl transition-all duration-200 cursor-pointer text-left
                ${impactMode
                  ? 'border border-warm-gray/25 bg-white/70 text-ink shadow-sm backdrop-blur-md hover:bg-white/85'
                  : 'border-2 border-[#E60012] bg-white text-[#E60012] shadow-sm hover:bg-[#E60012] hover:text-white'
                }
              `}
            >
              <span
                className={`font-display text-h2 md:text-h1 ${!impactMode ? 'text-[#E60012] group-hover:text-white' : ''}`}
              >
                {impactMode ? t('nav.uniqloPortal') : t('nav.impact')}
              </span>
            </button>
          </nav>

          <motion.div
            initial={prefersReducedMotion ? false : { opacity: 0 }}
            animate={prefersReducedMotion ? {} : { opacity: 1 }}
            transition={prefersReducedMotion ? { duration: 0 } : { delay: 0.4 }}
            className="px-8 mt-8 flex gap-4 pb-8"
          >
            {isAuthenticated && user ? (
              <div className="flex flex-col gap-2 w-full">
                <div className="px-4 py-3 bg-warm-gray/10 rounded">
                  <p className="font-body text-body-sm text-ink">{user.nickname || user.email}</p>
                  <p className="font-body text-caption text-sepia-mid capitalize">{user.role}</p>
                </div>
                <Link
                  to="/profile"
                  onClick={() => setMobileNavOpen(false)}
                  className="inline-block font-body text-body-sm text-ink-faded border border-warm-gray/40 px-6 py-3 rounded-full hover:text-ink transition-colors cursor-pointer"
                >
                  {t('nav.profile')}
                </Link>
                <Link
                  to="/submit-artwork"
                  onClick={() => setMobileNavOpen(false)}
                  className="inline-block font-body text-body-sm text-ink-faded border border-warm-gray/40 px-6 py-3 rounded-full hover:text-ink transition-colors cursor-pointer"
                >
                  {t('nav.submitArtwork', 'Submit Artwork')}
                </Link>
                {(user.role === 'admin' || user.role === 'editor') && (
                  <Link
                    to="/ai-design"
                    onClick={() => setMobileNavOpen(false)}
                    className="inline-block font-body text-body-sm text-ink-faded border border-warm-gray/40 px-6 py-3 rounded-full hover:text-ink transition-colors cursor-pointer"
                  >
                    {t('nav.aiDesign', 'AI Design')}
                  </Link>
                )}
                <button
                  onClick={handleLogout}
                  className="inline-block font-body text-body-sm bg-ink text-paper border border-ink px-6 py-3 rounded-full hover:bg-rust transition-colors text-left cursor-pointer"
                >
                  {t('nav.logout')}
                </button>
              </div>
            ) : (
              <>
                <Link
                  to="/login"
                  onClick={() => setMobileNavOpen(false)}
                  className="inline-block font-body text-body-sm text-ink-faded border border-warm-gray/40 px-6 py-3 rounded-full hover:text-ink transition-colors cursor-pointer"
                >
                  {t('nav.login')}
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMobileNavOpen(false)}
                  className="inline-block font-body text-body-sm bg-ink text-paper border border-ink px-6 py-3 rounded-full hover:bg-rust transition-colors cursor-pointer"
                >
                  {t('nav.register')}
                </Link>
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
