import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useTranslation } from 'react-i18next';
import type { ChartDataPoint } from '../../types';

interface DonationTrendChartProps {
  data?: ChartDataPoint[];
  height?: number;
}

export function DonationTrendChart({ data = [], height = 180 }: DonationTrendChartProps) {
  const { t } = useTranslation();
  const chartData = data.length > 0 ? data : [];
  const total = chartData.reduce((sum, d) => sum + (d.value as number), 0);

  return (
    <div className="chart-card">
      <div className="chart-card-header">
        <div className="chart-card-title">
          <span className="chart-card-label">{t('dashboard.donationTrend')}</span>
          <span className="chart-card-sublabel">{t('dashboard.chartSevenDays')}</span>
        </div>
        <div className="chart-card-stat">
          <span className="chart-stat-value">¥{total.toLocaleString()}</span>
          <span className="chart-stat-change positive">{t('dashboard.chartChangePositive', { value: 12 })}</span>
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
              dataKey={chartData[0]?.name ? 'name' : 'date'}
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 10, fill: 'var(--color-text-3)' }}
              tickFormatter={(v) => t(`dashboard.chart${v.charAt(0).toUpperCase() + v.slice(1)}`)}
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
              formatter={(value: number) => [`¥${value.toLocaleString()}`, t('dashboard.chartDonation')]}
              labelStyle={{ color: 'var(--color-text-2)' }}
              labelFormatter={(label) => t(`dashboard.chart${label.charAt(0).toUpperCase() + label.slice(1)}`)}
            />
            <Area
              type="monotone"
              dataKey={chartData[0]?.value !== undefined ? 'value' : 'amount'}
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