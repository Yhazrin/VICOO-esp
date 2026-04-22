import { useTranslation } from 'react-i18next';
import { useLocation, Link } from 'react-router-dom';

const pathToKey: Record<string, string> = {
  '': 'breadcrumb.dashboard',
  artworks: 'breadcrumb.artworks',
  campaigns: 'breadcrumb.campaigns',
  donations: 'breadcrumb.donations',
  orders: 'breadcrumb.orders',
  users: 'breadcrumb.users',
  products: 'breadcrumb.products',
  'clothing-donations': 'breadcrumb.clothingDonations',
  'after-sales': 'breadcrumb.afterSales',
  'child-audit': 'breadcrumb.childAudit',
  'audit-log': 'breadcrumb.auditLog',
  settings: 'breadcrumb.settings',
};

export default function Breadcrumb() {
  const { t } = useTranslation();
  const location = useLocation();
  const segments = location.pathname.split('/').filter(Boolean);

  return (
    <nav style={{
      display: 'flex',
      alignItems: 'center',
      gap: 6,
      marginBottom: 24,
      fontSize: 12,
      fontFamily: 'var(--font-mono)',
    }}>
      <Link
        to="/"
        style={{ color: 'var(--color-text-3)', textDecoration: 'none' }}
      >
        ~
      </Link>
      {segments.map((seg, i) => {
        const path = '/' + segments.slice(0, i + 1).join('/');
        const label = t(pathToKey[seg] || 'breadcrumb.unknown');
        const isLast = i === segments.length - 1;

        return (
          <span key={path} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ color: 'var(--color-text-3)' }}>/</span>
            {isLast ? (
              <span style={{ color: 'var(--color-text)', fontWeight: 500 }}>{label}</span>
            ) : (
              <Link to={path} style={{ color: 'var(--color-text-3)', textDecoration: 'none' }}>
                {label}
              </Link>
            )}
          </span>
        );
      })}
    </nav>
  );
}
