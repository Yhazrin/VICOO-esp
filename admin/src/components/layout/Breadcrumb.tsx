import { useLocation, Link } from 'react-router-dom';

const pathNames: Record<string, string> = {
  '': '仪表盘',
  artworks: '作品管理',
  campaigns: '活动管理',
  donations: '捐赠管理',
  orders: '订单管理',
  users: '用户管理',
  'child-audit': '儿童审计',
  'audit-log': '审计日志',
  settings: '系统设置',
};

export default function Breadcrumb() {
  const location = useLocation();
  const segments = location.pathname.split('/').filter(Boolean);

  return (
    <nav style={{
      display: 'flex', alignItems: 'center', gap: 8,
      marginBottom: 20, fontSize: 13,
    }}>
      <Link
        to="/"
        style={{ color: 'var(--color-text-secondary)', textDecoration: 'none' }}
      >
        首页
      </Link>
      {segments.map((seg, i) => {
        const path = '/' + segments.slice(0, i + 1).join('/');
        const label = pathNames[seg] || seg;
        const isLast = i === segments.length - 1;

        return (
          <span key={path} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ color: 'var(--color-text-light)' }}>/</span>
            {isLast ? (
              <span style={{ color: 'var(--color-text)', fontWeight: 500 }}>{label}</span>
            ) : (
              <Link to={path} style={{ color: 'var(--color-text-secondary)', textDecoration: 'none' }}>
                {label}
              </Link>
            )}
          </span>
        );
      })}
    </nav>
  );
}
