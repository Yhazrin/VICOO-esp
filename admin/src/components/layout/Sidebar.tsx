import { NavLink, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useUIStore } from '../../stores/uiStore';
import { NAV_GROUPS, GROUP_LABELS } from '../../config/routes';

export default function Sidebar() {
  const { t } = useTranslation();
  const location = useLocation();
  const collapsed = useUIStore((s) => s.sidebarCollapsed);

  // Check if a path matches the current location (supports sub-routes)
  const isActivePath = (path: string): boolean => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <aside className={`admin-sidebar ${collapsed ? 'collapsed' : ''}`}>
      {/* Header */}
      <div className="sidebar-header">
        <div className="sidebar-brand">
          <div className="sidebar-logo">
            <span className="logo-text">V</span>
          </div>
          {!collapsed && (
            <div className="sidebar-brand-text">
              <div className="brand-name">VICOO</div>
              <div className="brand-subtitle">{t('sidebar.systemName')}</div>
            </div>
          )}
        </div>
      </div>

      {/* Nav */}
      <nav className="sidebar-nav">
        {(Object.keys(NAV_GROUPS) as Array<keyof typeof NAV_GROUPS>).map((groupKey) => (
          <div key={groupKey} className="sidebar-nav-group">
            {!collapsed && (
              <div className="sidebar-nav-group-title">
                {t(GROUP_LABELS[groupKey])}
              </div>
            )}
            {NAV_GROUPS[groupKey].map((item) => {
              const active = isActivePath(item.path);
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={`sidebar-nav-item ${active ? 'active' : ''}`}
                  title={collapsed ? t(item.labelKey) : undefined}
                >
                  <span className="sidebar-nav-icon">
                    <item.icon size={16} strokeWidth={1.5} aria-hidden />
                  </span>
                  {!collapsed && (
                    <span className="sidebar-nav-label">
                      {t(item.labelKey)}
                    </span>
                  )}
                </NavLink>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Footer */}
      {!collapsed && (
        <div className="sidebar-footer">
          &copy; {new Date().getFullYear()} VICOO
        </div>
      )}
    </aside>
  );
}
