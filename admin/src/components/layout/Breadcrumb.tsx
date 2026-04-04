/**
 * 面包屑导航组件 (Breadcrumb)
 *
 * 功能说明：
 * - 根据当前路由路径动态生成面包屑导航
 * - 将路径段转换为可读的页面名称
 * - 支持中英文国际化切换
 *
 * 使用场景：
 * 显示当前页面在网站结构中的位置，提供导航返回
 */

import { useTranslation } from 'react-i18next';
import { useLocation, Link } from 'react-router-dom';

/**
 * 路径到翻译 key 的映射
 * 将路由路径段映射到对应的翻译文件中的 key
 */
const pathToKey: Record<string, string> = {
  '': 'breadcrumb.dashboard',
  artworks: 'breadcrumb.artworks',
  campaigns: 'breadcrumb.campaigns',
  donations: 'breadcrumb.donations',
  orders: 'breadcrumb.orders',
  users: 'breadcrumb.users',
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
      gap: 8,
      marginBottom: 20,
      fontSize: 13,
    }}>
      <Link
        to="/"
        style={{ color: 'var(--color-text-secondary)', textDecoration: 'none' }}
      >
        {t('breadcrumb.home')}
      </Link>
      {segments.map((seg, i) => {
        const path = '/' + segments.slice(0, i + 1).join('/');
        const label = t(pathToKey[seg] || 'breadcrumb.unknown');
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
