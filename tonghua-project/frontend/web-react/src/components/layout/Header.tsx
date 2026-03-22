import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { useUIStore, THEMES, type ThemeId } from '@/stores/uiStore';
import { useAuthStore } from '@/stores/authStore';
import { useIsMobile } from '@/hooks/useMediaQuery';
import { useRef, useEffect, useState } from 'react';
import SectionGrainOverlay from '@/components/editorial/SectionGrainOverlay';

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
    settingsMenuOpen,
    setSettingsMenuOpen,
  } = useUIStore();

  const { user, isAuthenticated, logout } = useAuthStore();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [activeSubmenu, setActiveSubmenu] = useState<'main' | 'theme' | null>(null);

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
  }, [userMenuOpen, settingsMenuOpen]);

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

  const currentThemeConfig = THEMES.find((t) => t.id === currentTheme);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-paper/90 backdrop-blur-sm">
      <SectionGrainOverlay />
      <div className="relative max-w-[1400px] mx-auto px-6 md:px-10 flex items-center justify-between h-16 md:h-20">
        {/* Logo */}
        <Link
          to="/"
          className="font-display text-ink text-lg md:text-xl font-bold tracking-tight cursor-pointer"
          onClick={() => setMobileNavOpen(false)}
        >
          VICOO
        </Link>

        {/* Desktop Navigation */}
        {!isMobile && (
          <nav className="flex items-center gap-1" aria-label="Main navigation">
            {NAV_ITEMS.map((item, index) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.key}
                  to={item.path}
                  className={`
                    font-body text-label tracking-wide px-3 py-2 transition-colors duration-200 cursor-pointer
                    ${isActive ? 'text-rust' : 'text-ink-faded hover:text-ink'}
                  `}
                >
                  <span className="text-overline tracking-[0.2em] text-sepia-mid mr-2 font-body">
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
            className="font-body text-caption text-ink-faded hover:text-ink transition-colors px-2 py-1 border border-warm-gray/40 cursor-pointer"
            aria-label="Toggle language"
          >
            {currentLocale === 'en' ? '中文' : 'EN'}
          </button>

          {/* User menu - shows username/avatar when logged in, login button when not */}
          <div className="relative" ref={userMenuRef}>
            <button
              onClick={() => {
                setUserMenuOpen(!userMenuOpen);
                setActiveSubmenu(null);
              }}
              className="hidden md:flex items-center gap-2 font-body text-label text-ink-faded hover:text-ink transition-colors px-3 py-1.5 border border-warm-gray/40 cursor-pointer"
              aria-label="User menu"
              aria-expanded={userMenuOpen}
              aria-haspopup="menu"
            >
              {isAuthenticated && user ? (
                <>
                  <div className="w-5 h-5 rounded-full bg-sepia-mid flex items-center justify-center">
                    <span className="text-caption text-paper font-medium">
                      {user.name?.charAt(0).toUpperCase() || 'U'}
                    </span>
                  </div>
                  <span className="max-w-20 truncate">{user.name}</span>
                </>
              ) : (
                <span>{t('nav.login')}</span>
              )}
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
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
                  aria-label="User menu"
                  className="absolute right-0 top-full mt-2 w-56 bg-paper border border-warm-gray/40 shadow-lg z-50"
                >
                  {activeSubmenu === 'theme' ? (
                    /* Theme submenu */
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
                    /* Main menu */
                    <div className="py-2">
                      {isAuthenticated && user ? (
                        <>
                          <div className="px-4 py-2 border-b border-warm-gray/20">
                            <p className="font-body text-body-sm text-ink font-medium">{user.name}</p>
                            <p className="font-body text-caption text-sepia-mid truncate">{user.email}</p>
                          </div>

                          {/* Theme setting shortcut */}
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

                          {/* Theme setting shortcut */}
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
              aria-label="Toggle menu"
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
