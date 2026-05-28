import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { MetricCard } from '../components/ui/MetricCard';
import { Card } from '../components/ui/Card';
import StatusBadge from '../components/ui/StatusBadge';
import { SummaryCard, MiniStat, PendingItem } from '../components/ui/SummaryCard';
import { DonationTrendChart } from '../components/charts/DonationTrendChart';
import { ReviewStatusChart } from '../components/charts/ReviewStatusChart';
import { fetchDashboardMetrics, fetchArtworks } from '../services/api';

// Safe text rendering - prevents XSS without dangerouslySetInnerHTML
function SafeText({ text }: { text?: string }) {
  if (!text) return null;
  const escaped = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
  return <>{escaped}</>;
}

// Icons — small, linear style
const Icons = {
  works: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2L2 7l10 5 10-5-10-5z" />
      <path d="M2 17l10 5 10-5" />
      <path d="M2 12l10 5 10-5" />
    </svg>
  ),
  pending: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  ),
  orders: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
      <line x1="3" y1="6" x2="21" y2="6" />
      <path d="M16 10a4 4 0 0 1-8 0" />
    </svg>
  ),
  users: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  ),
  donations: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  ),
  empty: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <polyline points="21 15 16 10 5 21" />
    </svg>
  ),
  chart: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10" />
      <line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" />
    </svg>
  ),
  alert: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  ),
  check: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  ),
  wallet: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 4H3a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h18a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z" />
      <path d="M1 10h22" />
    </svg>
  ),
};

// Mock data
const MOCK_METRICS = {
  totalArtworks: 156,
  pendingArtworks: 12,
  totalOrders: 89,
  totalUsers: 342,
  totalDonationAmount: 45820,
  activeCampaigns: 5,
  weeklyChange: 8,
};

// Mock pending artworks for summary
const MOCK_PENDING_ARTWORKS_EN = [
  { id: '1', title: 'My First Red Scarf', childName: 'Xiao Ming', submittedAt: '2h ago', status: 'pending' },
  { id: '2', title: 'Green Environmental Protection', childName: 'Xiao Hong', submittedAt: '5h ago', status: 'pending' },
  { id: '3', title: 'I Love My Motherland', childName: 'Xiao Hua', submittedAt: '1d ago', status: 'pending' },
];

const MOCK_PENDING_ARTWORKS_ZH = [
  { id: '1', title: '我的第一条红领巾', childName: '小明', submittedAt: '2h ago', status: 'pending' },
  { id: '2', title: '绿色环保从我做起', childName: '小红', submittedAt: '5h ago', status: 'pending' },
  { id: '3', title: '我爱我的祖国', childName: '小华', submittedAt: '1d ago', status: 'pending' },
];

// Mock audit logs for summary
const MOCK_AUDIT_LOGS_EN = [
  { id: '1', action: 'Approved', target: 'Work #234', user: 'Admin', time: '10m ago' },
  { id: '2', action: 'New Order', target: 'Order #8921', user: 'System', time: '25m ago' },
  { id: '3', action: 'Updated Campaign', target: 'Campaign #12', user: 'Editor', time: '1h ago' },
];

const MOCK_AUDIT_LOGS_ZH = [
  { id: '1', action: '审核通过', target: '作品 #234', user: 'Admin', time: '10m ago' },
  { id: '2', action: '新增订单', target: 'Order #8921', user: 'System', time: '25m ago' },
  { id: '3', action: '更新活动', target: 'Campaign #12', user: 'Editor', time: '1h ago' },
];

export default function DashboardPage() {
  const { t, i18n } = useTranslation();
  const isZh = i18n.language === 'zh';

  const metricsQuery = useQuery({
    queryKey: ['dashboardMetrics'],
    queryFn: fetchDashboardMetrics,
    staleTime: 5 * 60 * 1000,
  });

  const artworksQuery = useQuery({
    queryKey: ['dashboardArtworks'],
    queryFn: () => fetchArtworks({ pageSize: 3, sortBy: 'createdAt', sortOrder: 'desc', status: 'pending' }),
    staleTime: 2 * 60 * 1000,
  });

  const metrics = metricsQuery.data;
  const artworks = artworksQuery.data?.data ?? [];
  const isLoading = metricsQuery.isLoading || artworksQuery.isLoading;

  const displayMetrics = {
    totalWorks: metrics?.totalArtworks ?? MOCK_METRICS.totalArtworks,
    pendingReviews: metrics?.pendingArtworks ?? MOCK_METRICS.pendingArtworks,
    totalOrders: metrics?.totalOrders ?? MOCK_METRICS.totalOrders,
    authorizedUsers: metrics?.totalUsers ?? MOCK_METRICS.totalUsers,
    totalDonations: metrics?.totalDonationAmount ?? MOCK_METRICS.totalDonationAmount,
    activeCampaigns: metrics?.activeCampaigns ?? MOCK_METRICS.activeCampaigns,
  };

  // Use pending artworks from query or mock
  const pendingArtworks = artworks.length > 0 ? artworks : (isZh ? MOCK_PENDING_ARTWORKS_ZH : MOCK_PENDING_ARTWORKS_EN);

  return (
    <div className="dashboard-page">
      {/* Page Header */}
      <div className="dashboard-header">
        <h1 className="dashboard-title">{t('dashboard.title')}</h1>
        <p className="dashboard-subtitle">{t('dashboard.issueLabel')}</p>
      </div>

      {/* Metric Cards Row */}
      <div className="metrics-grid">
        <MetricCard
          label={t('dashboard.metricTotalWorks')}
          value={displayMetrics.totalWorks}
          icon={Icons.works}
          color="primary"
          loading={isLoading}
          subtitle={isZh ? '作品总数' : 'Total Works'}
          href="/artworks"
        />
        <MetricCard
          label={t('dashboard.metricPending')}
          value={displayMetrics.pendingReviews}
          icon={Icons.pending}
          color="warning"
          loading={isLoading}
          subtitle={isZh ? '待审核' : 'Pending'}
          href="/artworks"
        />
        <MetricCard
          label={t('dashboard.metricOrders')}
          value={displayMetrics.totalOrders}
          icon={Icons.orders}
          color="info"
          loading={isLoading}
          subtitle={isZh ? '订单总数' : 'Total Orders'}
          href="/orders"
        />
        <MetricCard
          label={t('dashboard.metricUsers')}
          value={displayMetrics.authorizedUsers}
          icon={Icons.users}
          color="success"
          loading={isLoading}
          subtitle={isZh ? '授权用户' : 'Users'}
          href="/users"
        />
        <MetricCard
          label={t('dashboard.metricDonations')}
          value={`¥${displayMetrics.totalDonations.toLocaleString('zh-CN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`}
          icon={Icons.donations}
          color="primary"
          loading={isLoading}
          subtitle={isZh ? '捐赠总额' : 'Total'}
          href="/donations"
        />
      </div>

      {/* Charts Row */}
      <div className="dashboard-charts-grid">
        <DonationTrendChart />
        <ReviewStatusChart />
      </div>

      {/* Summary Row */}
      <div className="dashboard-summary-grid">
        {/* Pending Artworks Summary */}
        <SummaryCard
          title={isZh ? '待审核作品' : 'Pending Reviews'}
          subtitle={isZh ? 'Pending Artworks' : '待审核'}
          linkTo="/artworks"
          icon={Icons.alert}
        >
          {pendingArtworks.slice(0, 3).map((artwork: any) => (
            <PendingItem
              key={artwork.id}
              title={artwork.title}
              meta={artwork.childName}
              status={<StatusBadge status={artwork.status || 'pending'} />}
              time={artwork.submittedAt || 'recently'}
            />
          ))}
        </SummaryCard>

        {/* Financial Summary */}
        <SummaryCard
          title={isZh ? '财务概览' : 'Financial Overview'}
          subtitle={isZh ? '财务' : '财务概览'}
          linkTo="/donations"
          icon={Icons.wallet}
        >
          <MiniStat label={isZh ? '本周捐赠' : 'Weekly Donation'} value={`¥${(45820 * 0.15).toFixed(0)}`} change={12} />
          <MiniStat label={isZh ? '活跃活动' : 'Active Campaigns'} value={displayMetrics.activeCampaigns} />
          <MiniStat label={isZh ? '验证记录' : 'Verified Records'} value="98.5%" trend="up" />
          <MiniStat label={isZh ? '本周增长' : 'Weekly Growth'} value={`+${MOCK_METRICS.weeklyChange}%`} change={MOCK_METRICS.weeklyChange} />
        </SummaryCard>

        {/* Audit Log Summary */}
        <SummaryCard
          title={isZh ? '最近动态' : 'Recent Activity'}
          subtitle={isZh ? '最近' : '最近动态'}
          linkTo="/audit-log"
          icon={Icons.check}
        >
          {(isZh ? MOCK_AUDIT_LOGS_ZH : MOCK_AUDIT_LOGS_EN).map((log) => (
            <PendingItem
              key={log.id}
              title={log.action}
              meta={log.target}
              time={log.time}
            />
          ))}
        </SummaryCard>
      </div>
    </div>
  );
}