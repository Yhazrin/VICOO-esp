import { NavLink, useLocation } from 'react-router-dom';

const menuItems = [
  { path: '/', label: 'DASHBOARD', icon: '01' },
  { path: '/artworks', label: 'ARTWORKS', icon: '02' },
  { path: '/campaigns', label: 'CAMPAIGNS', icon: '03' },
  { path: '/donations', label: 'DONATIONS', icon: '04' },
  { path: '/orders', label: 'ORDERS', icon: '05' },
  { path: '/clothing-donations', label: 'CLOTHING', icon: '06' },
  { path: '/after-sales', label: 'AFTER-SALES', icon: '07' },
  { path: '/users', label: 'USERS', icon: '08' },
  { path: '/child-audit', label: 'CHILD AUDIT', icon: '09' },
  { divider: true },
  { path: '/audit-log', label: 'AUDIT LOG', icon: '10' },
  { path: '/settings', label: 'SETTINGS', icon: '11' },
];

export default function Sidebar() {
  const location = useLocation();

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
      {/* Editorial Masthead (Logo) */}
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
          Admin System
        </div>
      </div>

      {/* Table of Contents (Menu) */}
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
              {/* Index Number */}
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
                {item.label}
              </span>
            </NavLink>
          );
        })}
      </nav>

      {/* Footer / Colophon */}
      <div style={{
        padding: '20px 30px',
        borderTop: '1px solid var(--color-warm-gray)',
        fontFamily: 'var(--font-body)',
        fontSize: '9px',
        color: 'var(--color-sepia-mid)',
        textTransform: 'uppercase',
        letterSpacing: '0.1em'
      }}>
        Edition 2026.03<br/>
        All Rights Reserved
      </div>
    </aside>
  );
}
