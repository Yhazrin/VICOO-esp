import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../stores/authStore';
import { useUIStore } from '../../stores/uiStore';
import './TopBar.css';

export default function TopBar() {
  const { t, i18n } = useTranslation();
  const user = useAuthStore((s: any) => s.user);
  const logout = useAuthStore((s: any) => s.logout);
  const setLocale = useUIStore((s) => s.setLocale);
  const theme = useUIStore((s) => s.theme);
  const toggleTheme = useUIStore((s) => s.toggleTheme);
  const toggleSidebar = useUIStore((s) => s.toggleSidebar);

  const handleLogout = () => {
    logout();
    window.location.href = '/login?redirect=/admin/';
  };

  const toggleLanguage = () => {
    const newLang = i18n.language === 'zh' ? 'en' : 'zh';
    i18n.changeLanguage(newLang);
    setLocale(newLang);
  };

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
  }, [theme]);

  const getInitials = (name: string) => {
    return name?.slice(0, 2).toUpperCase() || 'AD';
  };

  return (
    <header className="topbar">
      <div className="topbar-controls">
        {/* Sidebar toggle */}
        <button
          onClick={toggleSidebar}
          aria-label="Toggle sidebar"
          className="topbar-btn topbar-btn--icon"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>

        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          className="topbar-btn topbar-btn--icon-text"
        >
          {theme === 'dark' ? (
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="5" /><line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" />
              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
              <line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" />
              <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
            </svg>
          ) : (
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
            </svg>
          )}
          <span>{theme === 'dark' ? t('topbar.themeLight') : t('topbar.themeDark')}</span>
        </button>

        {/* Language toggle */}
        <button
          onClick={toggleLanguage}
          aria-label="Toggle language"
          className="topbar-btn topbar-btn--pill"
        >
          {i18n.language === 'zh' ? 'EN' : '中文'}
        </button>

        {/* User info */}
        <div className="topbar-user">
          {/* Avatar */}
          <div className="topbar-avatar">
            {getInitials(user?.username || 'admin')}
          </div>

          <div className="topbar-user-info">
            <div className="topbar-user-name">
              {user?.username || 'admin'}
            </div>
            <div className="topbar-user-role">
              {user?.role || 'Admin'}
            </div>
          </div>

          {/* Logout */}
          <button
            onClick={handleLogout}
            aria-label="Logout"
            className="topbar-btn topbar-btn--logout"
          >
            {t('topbar.logout')}
          </button>
        </div>
      </div>
    </header>
  );
}
