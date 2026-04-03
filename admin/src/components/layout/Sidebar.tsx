import { NavLink, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export default function Sidebar() {
  const { t } = useTranslation();
  const location = useLocation();

  const menuItems = [
    { path: '/', labelKey: 'sidebar.dashboard', icon: '01' },
    { path: '/artworks', labelKey: 'sidebar.artworks', icon: '02' },
    { path: '/campaigns', labelKey: 'sidebar.campaigns', icon: '03' },
    { path: '/donations', labelKey: 'sidebar.donations', icon: '04' },
    { path: '/orders', labelKey: 'sidebar.orders', icon: '05' },
    { path: '/clothing-donations', labelKey: 'sidebar.clothing', icon: '06' },
    { path: '/after-sales', labelKey: 'sidebar.afterSales', icon: '07' },
    { path: '/users', labelKey: 'sidebar.users', icon: '08' },
    { path: '/child-audit', labelKey: 'sidebar.childAudit', icon: '09' },
    { divider: true },
    { path: '/audit-log', labelKey: 'sidebar.auditLog', icon: '10' },
    { path: '/settings', labelKey: 'sidebar.settings', icon: '11' },
  ];

  return (
    <aside style={{
      position: 'fixed',
      left: 0, top: 0, bottom: 0,
      width: 'var(--sidebar-width)',
      backgroundColor: 'var(--color-paper)',
      borderRight: '1px solid var(--color-ink)',
      zIndex: 100,
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
    }}>
      <div style={{
        padding: '40px 30px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        borderBottom: '2px solid var(--color-ink)',
        minHeight: '140px',
        justifyContent: 'center'
      }}>
        <div style={{
          fontFamily: 'var(--font-display)',
          fontSize: '32px',
          fontWeight: 700,
          color: 'var(--color-ink)',
          letterSpacing: '-0.02em',
          lineHeight: 1
        }}>
          VICOO
        </div>
        <div style={{
          marginTop: '8px',
          fontFamily: 'var(--font-body)',
          fontSize: '10px',
          textTransform: 'uppercase',
          letterSpacing: '0.3em',
          color: 'var(--color-sepia-mid)'
        }}>
          {t('sidebar.systemName')}
        </div>
      </div>

      <nav style={{ flex: 1, padding: '20px 0', overflowY: 'auto' }}>
        {menuItems.map((item: any, i) => {
          if (item.divider) {
            return (
              <div key={`div-${i}`} style={{
                height: '1px',
                background: 'var(--color-warm-gray)',
                margin: '20px 30px',
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
                padding: '12px 30px',
                color: isActive ? 'var(--color-archive-brown)' : 'var(--color-ink)',
                textDecoration: 'none',
                transition: 'all 0.2s',
                position: 'relative'
              } as any}
            >
              <span style={{
                fontFamily: 'var(--font-display)',
                fontSize: isActive ? '18px' : '14px',
                fontWeight: isActive ? 700 : 400,
                width: '30px',
                color: isActive ? 'var(--color-archive-brown)' : 'var(--color-sepia-mid)',
                fontStyle: 'italic'
              }}>
                {item.icon}
              </span>
              <span style={{
                fontSize: '12px',
                fontFamily: 'var(--font-body)',
                fontWeight: isActive ? 600 : 400,
                letterSpacing: '0.15em',
                textTransform: 'uppercase',
                marginLeft: '10px',
                borderBottom: isActive ? '1px solid var(--color-archive-brown)' : '1px solid transparent',
                paddingBottom: '2px'
              }}>
                {t(item.labelKey)}
              </span>
            </NavLink>
          );
        })}
      </nav>

      <div style={{
        padding: '20px 30px',
        borderTop: '1px solid var(--color-warm-gray)',
        fontFamily: 'var(--font-body)',
        fontSize: '9px',
        color: 'var(--color-sepia-mid)',
        textTransform: 'uppercase',
        letterSpacing: '0.1em'
      }}>
        {t('sidebar.edition')}<br/>
        {t('sidebar.allRightsReserved')}
      </div>
    </aside>
  );
}
