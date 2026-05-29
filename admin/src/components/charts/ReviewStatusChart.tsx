import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { useTranslation } from 'react-i18next';
import type { ChartDataPoint } from '../../types';

const STATUS_COLORS: Record<string, string> = {
  pending: 'var(--color-warning)',
  approved: 'var(--color-primary)',
  rejected: 'var(--color-error)',
  draft: 'var(--color-text-3)',
};

interface ReviewStatusChartProps {
  data?: ChartDataPoint[];
  height?: number;
}

export function ReviewStatusChart({ data = [], height = 180 }: ReviewStatusChartProps) {
  const { t, i18n } = useTranslation();
  const isZh = i18n.language === 'zh';
  const chartData = data.length > 0 ? data : [];
  const total = chartData.reduce((sum, d) => sum + (d.value as number), 0);

  return (
    <div className="chart-card">
      <div className="chart-card-header">
        <div className="chart-card-title">
          <span className="chart-card-label">{t('dashboard.reviewStatus') || 'Review Status'}</span>
          <span className="chart-card-sublabel">DISTRIBUTION</span>
        </div>
        <div className="chart-card-stat">
          <span className="chart-stat-value">{total}</span>
          <span className="chart-stat-sub">{t('dashboard.total') || 'Total'}</span>
        </div>
      </div>
      <div className="chart-card-body" style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 20, left: 10, bottom: 0 }}>
            <CartesianGrid
              strokeDasharray="2 2"
              stroke="var(--color-border)"
              horizontal={false}
            />
            <XAxis
              type="number"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 10, fill: 'var(--color-text-3)' }}
            />
            <YAxis
              type="category"
              dataKey="name"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11, fill: 'var(--color-text-2)' }}
              width={60}
            />
            <Tooltip
              contentStyle={{
                background: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-md)',
                fontSize: 12,
                fontFamily: 'var(--font-mono)',
              }}
              formatter={(value: number) => [value, isZh ? '数量' : 'Count']}
              labelStyle={{ color: 'var(--color-text-2)' }}
            />
            <Bar dataKey="value" radius={[0, 3, 3, 0]} barSize={16}>
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={STATUS_COLORS[entry.name] || 'var(--color-primary)'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export default ReviewStatusChart;