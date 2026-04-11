import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { useUIStore } from '@/stores/uiStore';
import { useAuthStore } from '@/stores/authStore';
import { useAuth } from '@/hooks/useAuth';
import { useRef, useEffect, useState } from 'react';

// ── Company nav ──
const COMPANY_NAV = [
  { key: 'home', path: '/' },
  { key: 'shop', path: '/shop' },
  { key: 'stories', path: '/stories' },
  { key: 'about', path: '/about' },
  { key: 'contact', path: '/contact' },
];

// ── Impact tabs ──
const IMPACT_TABS = ['campaigns', 'vote', 'traceability', 'donate', 'shop'];

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
      setTimeout(() => {
        firstLinkRef.current?.focus();
      }, 100);

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          setMobileNavOpen(false);
        }
      };

      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
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
    } else {
      setImpactMode(true);
      setActiveImpactTab('campaigns');
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
            flex items-baseline gap-4 py-4 border-b border-warm-gray/20 w-full
            transition-colors duration-200 cursor-pointer
            ${isActive ? 'text-rust' : 'text-ink hover:text-rust'}
          `}
        >
          <span className="font-body text-caption text-sepia-mid tracking-widest">
            {String(index + 1).padStart(2, '0')}
          </span>
          <span className="font-display text-h2 md:text-h1">{label}</span>
        </Link>
      ) : (
        <button
          onClick={onClick}
          className={`
            flex items-baseline gap-4 py-4 border-b border-warm-gray/20 w-full text-left
            transition-colors duration-200 cursor-pointer
            ${isActive ? 'text-rust' : 'text-ink hover:text-rust'}
          `}
        >
          <span className="font-body text-caption text-sepia-mid tracking-widest">
            {String(index + 1).padStart(2, '0')}
          </span>
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
                  ? IMPACT_TABS.map((tabKey, index) =>
                      renderNavItem(tabKey, t(`nav.${tabKey}`), index, activeImpactTab === tabKey, () => { setActiveImpactTab(tabKey); setMobileNavOpen(false); })
                    )
                  : COMPANY_NAV.map((item, index) =>
                      renderNavItem(item.key, t(`nav.${item.key}`), index, location.pathname === item.path, () => setMobileNavOpen(false), item.path)
                    )
                }
              </motion.div>
            </AnimatePresence>

            {/* Impact toggle */}
            <button
              onClick={handleImpactToggle}
              className={`
                mt-6 w-full flex items-baseline gap-4 py-4 border-b border-warm-gray/20
                transition-colors duration-200 cursor-pointer
                ${impactMode ? 'text-rust' : 'text-ink hover:text-rust'}
              `}
            >
              <span className="font-body text-caption text-sepia-mid tracking-widest">
                {String(IMPACT_TABS.length + 1).padStart(2, '0')}
              </span>
              <span className="font-display text-h2 md:text-h1">
                {impactMode ? t('nav.home') : t('nav.impact', '公益')}
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
