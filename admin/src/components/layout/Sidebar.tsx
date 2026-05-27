import { NavLink, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useUIStore } from '../../stores/uiStore';
import { SidebarNavIcon } from '../icons/sidebarNav';

export default function Sidebar() {
  const { t } = useTranslation();
  const location = useLocation();
  const collapsed = useUIStore((s) => s.sidebarCollapsed);

  const menuItems = [
    { path: '/', labelKey: 'sidebar.dashboard' },
    { path: '/users', labelKey: 'sidebar.users' },
    { path: '/products', labelKey: 'sidebar.products' },
    { path: '/orders', labelKey: 'sidebar.orders' },
    { path: '/campaigns', labelKey: 'sidebar.campaigns' },
    { path: '/donations', labelKey: 'sidebar.donations' },
    { path: '/clothing-donations', labelKey: 'sidebar.clothing' },
    { path: '/artworks', labelKey: 'sidebar.artworks' },
    { path: '/after-sales', labelKey: 'sidebar.afterSales' },
    { divider: true },
    { path: '/audit-log', labelKey: 'sidebar.auditLog' },
    { path: '/settings', labelKey: 'sidebar.settings' },
  ];

  return (
    <aside style={{
      position: 'fixed',
      left: 0, top: 0, bottom: 0,
      width: collapsed ? '60px' : 'var(--sidebar-width)',
      background: 'var(--color-bg)',
      borderRight: '1px solid var(--color-border)',
      zIndex: 100,
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      transition: 'width 0.2s ease',
    }}>
      {/* Header */}
      <div style={{
        padding: collapsed ? '24px 12px' : '24px 20px',
        borderBottom: '1px solid var(--color-border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: collapsed ? 'center' : 'flex-start',
        gap: '8px',
      }}>
        <div style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '18px',
          fontWeight: 700,
          color: 'var(--color-text)',
          letterSpacing: '0.1em',
          lineHeight: 1,
        }}>
          VICOO
        </div>
        {!collapsed && (
          <div style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '10px',
            textTransform: 'uppercase',
            letterSpacing: '0.2em',
            color: 'var(--color-text-3)',
          }}>
            {t('sidebar.systemName')}
          </div>
        )}
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: collapsed ? '12px 6px' : '12px 10px', overflowY: 'auto' }}>
        {menuItems.map((item: any, i) => {
          if (item.divider) {
            return (
              <div key={`div-${i}`} style={{
                height: '1px',
                background: 'var(--color-border)',
                margin: '8px 12px',
              }} />
            );
          }

          const isActive = location.pathname === item.path;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              title={collapsed ? t(item.labelKey) : undefined}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: collapsed ? 'center' : 'flex-start',
                gap: collapsed ? '0' : '10px',
                padding: collapsed ? '8px 0' : '8px 12px',
                marginBottom: '1px',
                color: isActive ? 'var(--color-text)' : 'var(--color-text-3)',
                textDecoration: 'none',
                borderRadius: '6px',
                background: isActive ? 'var(--color-elevated)' : 'transparent',
                transition: 'all 0.15s',
                fontWeight: isActive ? 500 : 400,
              } as any}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = 'var(--color-surface)';
                  e.currentTarget.style.color = 'var(--color-text-2)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = 'var(--color-text-3)';
                }
              }}
            >
              <span style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '18px',
                height: '18px',
                opacity: isActive ? 1 : 0.6,
                flexShrink: 0,
              }}>
                <SidebarNavIcon path={item.path} />
              </span>
              {!collapsed && (
                <span style={{
                  fontSize: '13px',
                  fontFamily: 'var(--font-body)',
                  fontWeight: isActive ? 500 : 400,
                  whiteSpace: 'nowrap',
                }}>
                  {t(item.labelKey)}
                </span>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Footer */}
      {!collapsed && (
        <div style={{
          padding: '14px 20px',
          borderTop: '1px solid var(--color-border)',
          fontFamily: 'var(--font-mono)',
          fontSize: '10px',
          color: 'var(--color-text-3)',
          letterSpacing: '0.04em',
        }}>
          &copy; 2025 VICOO
        </div>
      )}
    </aside>
  );
}
