import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { useTranslation } from 'react-i18next';
import dayjs from 'dayjs';
import 'dayjs/locale/zh-cn';
import 'dayjs/locale/en';

const TYPE_COLORS: Record<string, string> = {
  login: 'var(--color-text-3)',
  review: 'var(--color-primary)',
  order: 'var(--color-info)',
  settings: 'var(--color-warning)',
  export: 'var(--color-text-3)',
  delete: 'var(--color-error)',
};

interface AuditActivityChartProps {
  data?: Array<{ date: string; count: number }>;
  height?: number;
}

export function AuditActivityChart({ data = [], height = 180 }: AuditActivityChartProps) {
  const { t, i18n } = useTranslation();
  const chartData = data.length > 0 ? data : [];
  const total = chartData.reduce((sum, d) => sum + d.count, 0);
  const isZh = i18n.language === 'zh';
  dayjs.locale(isZh ? 'zh-cn' : 'en');

  return (
    <div className="chart-card">
      <div className="chart-card-header">
        <div className="chart-card-title">
          <span className="chart-card-label">{t('dashboard.chartActivityTrend')}</span>
          <span className="chart-card-sublabel">{t('dashboard.chartSevenDays')}</span>
        </div>
        <div className="chart-card-stat">
          <span className="chart-stat-value">{total}</span>
          <span className="chart-stat-sub">{t('dashboard.chartEventsThisWeek')}</span>
        </div>
      </div>
      <div className="chart-card-body" style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
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
            />
            <Tooltip
              contentStyle={{
                background: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-md)',
                fontSize: 12,
                fontFamily: 'var(--font-mono)',
              }}
              formatter={(value: number) => [value, t('dashboard.chartOperations')]}
              labelStyle={{ color: 'var(--color-text-2)' }}
            />
            <Bar dataKey="count" fill="var(--color-primary)" radius={[3, 3, 0, 0]} barSize={20} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// Event type breakdown chart
interface EventTypeChartProps {
  data?: Array<{ type: string; count: number; key: string }>;
  height?: number;
}

export function EventTypeChart({ data = [], height = 180 }: EventTypeChartProps) {
  const { t } = useTranslation();
  const chartData = data.length > 0 ? data : [];
  const total = chartData.reduce((sum, d) => sum + d.count, 0);

  return (
    <div className="chart-card">
      <div className="chart-card-header">
        <div className="chart-card-title">
          <span className="chart-card-label">{t('dashboard.chartEventType')}</span>
          <span className="chart-card-sublabel">{t('dashboard.chartBreakdown')}</span>
        </div>
        <div className="chart-card-stat">
          <span className="chart-stat-value">{total}</span>
          <span className="chart-stat-sub">{t('dashboard.total')}</span>
        </div>
      </div>
      <div className="chart-card-body" style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 30, left: 10, bottom: 0 }}>
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
              dataKey="type"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11, fill: 'var(--color-text-2)' }}
              width={110}
            />
            <Tooltip
              contentStyle={{
                background: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-md)',
                fontSize: 12,
                fontFamily: 'var(--font-mono)',
              }}
              formatter={(value: number) => [value, t('dashboard.chartTimes')]}
              labelStyle={{ color: 'var(--color-text-2)' }}
            />
            <Bar dataKey="count" radius={[0, 3, 3, 0]} barSize={14}>
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={TYPE_COLORS[entry.key] || 'var(--color-primary)'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export default AuditActivityChart;