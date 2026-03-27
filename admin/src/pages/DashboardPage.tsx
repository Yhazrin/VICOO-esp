import { useQuery } from '@tanstack/react-query';
import StatCard from '../components/ui/StatCard';
import LineChartCard from '../components/charts/LineChartCard';
import BarChartCard from '../components/charts/BarChartCard';
import PieChartCard from '../components/charts/PieChartCard';
import StatusBadge from '../components/ui/StatusBadge';
import {
  fetchDashboardMetrics, fetchDonationTrend, fetchArtworkByCategory,
  fetchOrderTrend, fetchUserGrowth, fetchArtworks, fetchDonations, fetchOrders,
} from '../services/api';
import dayjs from 'dayjs';

export default function DashboardPage() {
  const { data: metrics } = useQuery({ queryKey: ['metrics'], queryFn: fetchDashboardMetrics });
  const { data: donationTrend } = useQuery({ queryKey: ['donationTrend'], queryFn: fetchDonationTrend });
  const { data: artworkByCategory } = useQuery({ queryKey: ['artworkByCat'], queryFn: fetchArtworkByCategory });
  const { data: orderTrend } = useQuery({ queryKey: ['orderTrend'], queryFn: fetchOrderTrend });
  const { data: userGrowth } = useQuery({ queryKey: ['userGrowth'], queryFn: fetchUserGrowth });
  const { data: recentArtworks } = useQuery({
    queryKey: ['recentArtworks'],
    queryFn: () => fetchArtworks({ page: 1, pageSize: 5, sortBy: 'createdAt', sortOrder: 'desc' }),
  });
  const { data: recentDonations } = useQuery({
    queryKey: ['recentDonations'],
    queryFn: () => fetchDonations({ page: 1, pageSize: 5, sortBy: 'createdAt', sortOrder: 'desc' }),
  });

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 4 }}>仪表盘</h1>
        <p style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>
          数据概览与关键指标监控
        </p>
      </div>

      {/* Stat Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
        gap: 16,
        marginBottom: 24,
      }}>
        <StatCard
          title="作品总数"
          value={metrics?.totalArtworks || 0}
          subtitle={`待审核 ${metrics?.pendingArtworks || 0}`}
          icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z" /></svg>}
          trend={{ value: 12, isUp: true }}
          color="accent"
        />
        <StatCard
          title="捐赠总额"
          value={`\u00a5${(metrics?.totalDonationAmount || 0).toLocaleString()}`}
          subtitle={`共 ${metrics?.totalDonations || 0} 笔捐赠`}
          icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" /></svg>}
          trend={{ value: 8, isUp: true }}
          color="success"
        />
        <StatCard
          title="订单总数"
          value={metrics?.totalOrders || 0}
          subtitle="本月新增订单"
          icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M18 6h-2c0-2.21-1.79-4-4-4S8 3.79 8 6H6c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2z" /></svg>}
          trend={{ value: 5, isUp: true }}
          color="info"
        />
        <StatCard
          title="注册用户"
          value={metrics?.totalUsers || 0}
          subtitle="平台活跃用户"
          icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5z" /></svg>}
          trend={{ value: 15, isUp: true }}
          color="warning"
        />
      </div>

      {/* Charts Row 1 */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '2fr 1fr',
        gap: 16,
        marginBottom: 24,
      }}>
        <LineChartCard
          title="捐赠趋势"
          data={donationTrend || []}
          dataKeys={['wechat', 'alipay', 'stripe', 'paypal']}
          colors={['#c17c5a', '#4a9d6e', '#5a8fc4', '#8b6cc1']}
          height={300}
        />
        <PieChartCard
          title="作品类别分布"
          data={artworkByCategory || []}
          height={300}
        />
      </div>

      {/* Charts Row 2 */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: 16,
        marginBottom: 24,
      }}>
        <BarChartCard
          title="订单趋势"
          data={orderTrend || []}
          dataKey="revenue"
          color="#4a9d6e"
          height={260}
        />
        <LineChartCard
          title="用户增长"
          data={userGrowth || []}
          colors={['#5a8fc4']}
          height={260}
        />
      </div>

      {/* Recent Activity */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: 16,
      }}>
        {/* Recent Artworks */}
        <div style={{
          background: 'var(--color-bg-card)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-lg)',
          padding: '20px 24px',
        }}>
          <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>最新作品</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {(recentArtworks?.data || []).map((art) => (
              <div key={art.id} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '8px 0',
                borderBottom: '1px solid var(--color-border-light)',
              }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 500 }}>{art.title}</div>
                  <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginTop: 2 }}>
                    {art.childName} &middot; {art.category}
                  </div>
                </div>
                <StatusBadge status={art.status} />
              </div>
            ))}
          </div>
        </div>

        {/* Recent Donations */}
        <div style={{
          background: 'var(--color-bg-card)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-lg)',
          padding: '20px 24px',
        }}>
          <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>最新捐赠</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {(recentDonations?.data || []).map((don) => (
              <div key={don.id} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '8px 0',
                borderBottom: '1px solid var(--color-border-light)',
              }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 500 }}>
                    {don.isAnonymous ? '匿名捐赠' : don.donorName}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginTop: 2 }}>
                    {dayjs(don.createdAt).format('YYYY-MM-DD HH:mm')}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-success)' }}>
                    {don.currency === 'CNY' ? '\u00a5' : '$'}{don.amount.toLocaleString()}
                  </div>
                  <StatusBadge status={don.status} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
