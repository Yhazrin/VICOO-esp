import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { useUIStore } from '@/stores/uiStore';
import { useAuthStore } from '@/stores/authStore';
import { useIsMobile } from '@/hooks/useMediaQuery';
import { useRef, useEffect, useState } from 'react';

const NAV_ITEMS = [
  { key: 'home', path: '/' },
  { key: 'about', path: '/about' },
  { key: 'campaigns', path: '/campaigns' },
  { key: 'stories', path: '/stories' },
  { key: 'donate', path: '/donate' },
  { key: 'shop', path: '/shop' },
  { key: 'traceability', path: '/traceability' },
  { key: 'contact', path: '/contact' },
];

export default function Header() {
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { mobileNavOpen, toggleMobileNav, setMobileNavOpen, currentLocale, setLocale, setMenuTriggerRef } =
    useUIStore();
  const { user, isAuthenticated, logout } = useAuthStore();
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const menuTriggerRef = useRef<HTMLButtonElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMenuTriggerRef(menuTriggerRef);
  }, [setMenuTriggerRef]);

  // Close user menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
    };

    if (userMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [userMenuOpen]);

  const toggleLocale = () => {
    const next = currentLocale === 'en' ? 'zh' : 'en';
    setLocale(next);
    i18n.changeLanguage(next);
  };

  const handleLogout = () => {
    logout();
    setUserMenuOpen(false);
    navigate('/');
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-paper/90 backdrop-blur-sm border-b border-warm-gray/30">
      {/* Grain overlay */}
      <div className="absolute inset-0 z-0 pointer-events-none opacity-[0.06]" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`
      }} />
      <div className="relative max-w-[1400px] mx-auto px-6 md:px-10 flex items-center justify-between h-16 md:h-20">
        {/* Logo */}
        <Link
          to="/"
          className="font-display text-ink text-lg md:text-xl font-bold tracking-tight"
          onClick={() => setMobileNavOpen(false)}
        >
          Tonghua
        </Link>

        {/* Desktop Navigation */}
        {!isMobile && (
          <nav className="flex items-center gap-1">
            {NAV_ITEMS.map((item, index) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.key}
                  to={item.path}
                  className={`
                    font-body text-label tracking-wide px-3 py-2 transition-colors duration-200
                    ${isActive ? 'text-rust' : 'text-ink-faded hover:text-ink'}
                  `}
                >
                  <span className="text-[9px] tracking-[0.2em] text-sepia-mid mr-2 font-body">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  {t(`nav.${item.key}`)}
                </Link>
              );
            })}
          </nav>
        )}

        {/* Right side controls */}
        <div className="flex items-center gap-3">
          <button
            onClick={toggleLocale}
            className="font-body text-caption text-ink-faded hover:text-ink transition-colors px-2 py-1 border border-warm-gray/40 rounded"
            aria-label="Toggle language"
          >
            {currentLocale === 'en' ? '中文' : 'EN'}
          </button>

          {/* User menu - shown when authenticated */}
          {isAuthenticated && user ? (
            <div className="relative" ref={userMenuRef}>
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="hidden md:flex items-center gap-2 font-body text-label text-ink-faded hover:text-ink transition-colors px-3 py-1.5 border border-warm-gray/40 rounded"
                aria-label="User menu"
                aria-expanded={userMenuOpen}
              >
                <span className="text-[9px] tracking-[0.2em] text-sepia-mid font-body">USER</span>
                <span className="max-w-[120px] truncate">{user.nickname || user.email}</span>
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Dropdown menu */}
              {userMenuOpen && (
                <div className="absolute right-0 top-full mt-2 w-48 bg-paper border border-warm-gray/40 rounded shadow-lg z-50">
                  <div className="py-2">
                    <div className="px-4 py-2 border-b border-warm-gray/20">
                      <p className="font-body text-xs text-ink-faded">{user.nickname || user.email}</p>
                      <p className="font-body text-overline text-sepia-mid capitalize">{user.role}</p>
                    </div>
                    <Link
                      to="/profile"
                      className="block px-4 py-2 font-body text-sm text-ink hover:bg-warm-gray/10 transition-colors"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      {t('nav.profile')}
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2 font-body text-sm text-ink hover:bg-warm-gray/10 transition-colors"
                    >
                      {t('nav.logout')}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Login link - shown when not authenticated */
            <Link
              to="/login"
              className="hidden md:inline-block font-body text-label text-ink-faded hover:text-ink transition-colors px-3 py-1.5 border border-warm-gray/40 rounded"
            >
              {t('nav.login')}
            </Link>
          )}

          {/* Mobile hamburger */}
          {isMobile && (
            <button
              ref={menuTriggerRef}
              onClick={toggleMobileNav}
              className="flex flex-col gap-1.5 p-2"
              aria-label="Toggle menu"
              aria-expanded={mobileNavOpen}
              aria-controls="mobile-navigation"
            >
              <motion.span
                animate={mobileNavOpen ? { rotate: 45, y: 6 } : { rotate: 0, y: 0 }}
                className="block w-6 h-px bg-ink"
              />
              <motion.span
                animate={mobileNavOpen ? { opacity: 0 } : { opacity: 1 }}
                className="block w-6 h-px bg-ink"
              />
              <motion.span
                animate={mobileNavOpen ? { rotate: -45, y: -6 } : { rotate: 0, y: 0 }}
                className="block w-6 h-px bg-ink"
              />
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
