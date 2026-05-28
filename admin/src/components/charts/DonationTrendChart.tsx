import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useTranslation } from 'react-i18next';

// Mock data for donation trend (last 7 days)
const MOCK_DATA_EN = [
  { date: 'Mon', amount: 4200 },
  { date: 'Tue', amount: 5800 },
  { date: 'Wed', amount: 3100 },
  { date: 'Thu', amount: 7500 },
  { date: 'Fri', amount: 6200 },
  { date: 'Sat', amount: 8900 },
  { date: 'Sun', amount: 5400 },
];

const MOCK_DATA_ZH = [
  { date: '周一', amount: 4200 },
  { date: '周二', amount: 5800 },
  { date: '周三', amount: 3100 },
  { date: '周四', amount: 7500 },
  { date: '周五', amount: 6200 },
  { date: '周六', amount: 8900 },
  { date: '周日', amount: 5400 },
];

interface DonationTrendChartProps {
  data?: Array<{ date: string; amount: number }>;
  height?: number;
}

export function DonationTrendChart({ data, height = 180 }: DonationTrendChartProps) {
  const { t, i18n } = useTranslation();
  const isZh = i18n.language === 'zh';
  const chartData = data || (isZh ? MOCK_DATA_ZH : MOCK_DATA_EN);
  const total = chartData.reduce((sum, d) => sum + d.amount, 0);

  return (
    <div className="chart-card">
      <div className="chart-card-header">
        <div className="chart-card-title">
          <span className="chart-card-label">{t('dashboard.donationTrend') || 'Donation Trend'}</span>
          <span className="chart-card-sublabel">7 DAYS</span>
        </div>
        <div className="chart-card-stat">
          <span className="chart-stat-value">¥{total.toLocaleString()}</span>
          <span className="chart-stat-change positive">+12%</span>
        </div>
      </div>
      <div className="chart-card-body" style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.15} />
                <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="2 2"
              stroke="var(--color-border)"
              vertical={false}
            />
            <XAxis
              dataKey="date"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 10, fill: 'var(--color-text-3)' }}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 10, fill: 'var(--color-text-3)' }}
              tickFormatter={(v) => `¥${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`}
            />
            <Tooltip
              contentStyle={{
                background: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-md)',
                fontSize: 12,
                fontFamily: 'var(--font-mono)',
              }}
              formatter={(value: number) => [`¥${value.toLocaleString()}`, isZh ? '捐赠' : 'Donation']}
              labelStyle={{ color: 'var(--color-text-2)' }}
            />
            <Area
              type="monotone"
              dataKey="amount"
              stroke="var(--color-primary)"
              strokeWidth={1.5}
              fillOpacity={1}
              fill="url(#colorAmount)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export default DonationTrendChart;