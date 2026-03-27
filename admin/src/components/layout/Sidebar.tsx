import { NavLink, useLocation } from 'react-router-dom';
import { useUIStore } from '../../stores/uiStore';

const menuItems = [
  { path: '/', label: '仪表盘', icon: '01', iconSvg: 'dashboard' },
  { path: '/artworks', label: '作品管理', icon: '02', iconSvg: 'artworks' },
  { path: '/campaigns', label: '活动管理', icon: '03', iconSvg: 'campaigns' },
  { path: '/donations', label: '捐赠管理', icon: '04', iconSvg: 'donations' },
  { path: '/orders', label: '订单管理', icon: '05', iconSvg: 'orders' },
  { path: '/clothing-donations', label: '衣物捐献', icon: '05b', iconSvg: 'donations' },
  { path: '/after-sales', label: '售后管理', icon: '05c', iconSvg: 'orders' },
  { path: '/users', label: '用户管理', icon: '06', iconSvg: 'users' },
  { path: '/child-audit', label: '儿童审计', icon: '07', iconSvg: 'child' },
  { divider: true },
  { path: '/audit-log', label: '审计日志', icon: '08', iconSvg: 'audit' },
  { path: '/settings', label: '系统设置', icon: '09', iconSvg: 'settings' },
];

const iconPaths: Record<string, React.ReactNode> = {
  dashboard: <path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z" />,
  artworks: <><path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z" /></>,
  campaigns: <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" />,
  donations: <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />,
  orders: <path d="M18 6h-2c0-2.21-1.79-4-4-4S8 3.79 8 6H6c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm-6-2c1.1 0 2 .9 2 2h-4c0-1.1.9-2 2-2zm6 16H6V8h2v2c0 .55.45 1 1 1s1-.45 1-1V8h4v2c0 .55.45 1 1 1s1-.45 1-1V8h2v12z" />,
  users: <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5z" />,
  child: <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />,
  audit: <path d="M13 3c-4.97 0-9 4.03-9 9H1l3.89 3.89.07.14L9 12H6c0-3.87 3.13-7 7-7s7 3.13 7 7-3.13 7-7 7c-1.93 0-3.68-.79-4.94-2.06l-1.42 1.42C8.27 19.99 10.51 21 13 21c4.97 0 9-4.03 9-9s-4.03-9-9-9zm-1 5v5l4.28 2.54.72-1.21-3.5-2.08V8H12z" />,
  settings: <path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z" />,
};

export default function Sidebar() {
  const collapsed = useUIStore((s) => s.sidebarCollapsed);
  const location = useLocation();

  return (
    <aside style={{
      position: 'fixed',
      left: 0, top: 0, bottom: 0,
      width: collapsed ? 'var(--sidebar-collapsed-width)' : 'var(--sidebar-width)',
      background: 'var(--color-bg-sidebar)',
      color: 'var(--color-text-sidebar)',
      transition: 'width 0.25s ease',
      zIndex: 100,
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
    }}>
      {/* Logo */}
      <div style={{
        padding: collapsed ? '20px 0' : '20px 24px',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: collapsed ? 'center' : 'flex-start',
        gap: 12,
        minHeight: 64,
      }}>
        <div style={{
          width: 32, height: 32, borderRadius: 8,
          background: 'var(--color-accent)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#fff', fontSize: 14, fontWeight: 700,
          flexShrink: 0,
        }}>
          T
        </div>
        {!collapsed && (
          <div style={{ overflow: 'hidden' }}>
            <div style={{ fontSize: 15, fontWeight: 600, color: '#fff', whiteSpace: 'nowrap' }}>
              童画公益
            </div>
            <div style={{ fontSize: 11, color: 'var(--color-text-sidebar)', whiteSpace: 'nowrap' }}>
              管理后台
            </div>
          </div>
        )}
      </div>

      {/* Menu */}
      <nav style={{ flex: 1, padding: '12px 0', overflowY: 'auto' }}>
        {menuItems.map((item: any, i) => {
          if (item.divider) {
            return (
              <div key={`div-${i}`} style={{
                height: 1,
                background: 'rgba(255,255,255,0.06)',
                margin: '12px 16px',
              }} />
            );
          }

          const isActive = location.pathname === item.path;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: collapsed ? '10px 0' : '10px 24px',
                justifyContent: collapsed ? 'center' : 'flex-start',
                color: isActive ? 'var(--color-text-sidebar-active)' : 'var(--color-text-sidebar)',
                background: isActive ? 'var(--color-bg-sidebar-active)' : 'transparent',
                transition: 'all 0.15s',
                textDecoration: 'none',
                position: 'relative',
              }}
              onMouseEnter={(e) => {
                if (!isActive) (e.currentTarget as HTMLElement).style.background = 'var(--color-bg-sidebar-hover)';
              }}
              onMouseLeave={(e) => {
                if (!isActive) (e.currentTarget as HTMLElement).style.background = 'transparent';
              }}
              title={collapsed ? item.label : undefined}
            >
              {isActive && (
                <div style={{
                  position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)',
                  width: 3, height: 20,
                  background: 'var(--color-accent)',
                  borderRadius: '0 3px 3px 0',
                }} />
              )}
              <div style={{
                width: 20, height: 20,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  {iconPaths[item.iconSvg]}
                </svg>
              </div>
              {!collapsed && (
                <span style={{ fontSize: 13, fontWeight: isActive ? 600 : 400, whiteSpace: 'nowrap' }}>
                  <span style={{
                    fontFamily: 'var(--font-mono)', fontSize: 10, opacity: 0.5, marginRight: 8,
                  }}>
                    {item.icon}
                  </span>
                  {item.label}
                </span>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Footer */}
      {!collapsed && (
        <div style={{
          padding: '16px 24px',
          borderTop: '1px solid rgba(255,255,255,0.06)',
          fontSize: 11,
          color: 'rgba(255,255,255,0.3)',
          fontFamily: 'var(--font-mono)',
        }}>
          v1.0.0
        </div>
      )}
    </aside>
  );
}
