import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { useTranslation } from 'react-i18next';

// Mock data for audit activity (last 7 days)
const MOCK_DATA_EN = [
  { date: 'Mon', count: 45 },
  { date: 'Tue', count: 52 },
  { date: 'Wed', count: 38 },
  { date: 'Thu', count: 61 },
  { date: 'Fri', count: 55 },
  { date: 'Sat', count: 28 },
  { date: 'Sun', count: 22 },
];

const MOCK_DATA_ZH = [
  { date: '周一', count: 45 },
  { date: '周二', count: 52 },
  { date: '周三', count: 38 },
  { date: '周四', count: 61 },
  { date: '周五', count: 55 },
  { date: '周六', count: 28 },
  { date: '周日', count: 22 },
];

// Event type breakdown
const EVENT_TYPE_DATA_EN = [
  { type: 'Login', count: 120, key: 'login' },
  { type: 'Review', count: 85, key: 'review' },
  { type: 'Order', count: 62, key: 'order' },
  { type: 'Settings', count: 28, key: 'settings' },
  { type: 'Export', count: 15, key: 'export' },
  { type: 'Delete', count: 5, key: 'delete' },
];

const EVENT_TYPE_DATA_ZH = [
  { type: '登录', count: 120, key: 'login' },
  { type: '审核', count: 85, key: 'review' },
  { type: '订单', count: 62, key: 'order' },
  { type: '设置', count: 28, key: 'settings' },
  { type: '导出', count: 15, key: 'export' },
  { type: '删除', count: 5, key: 'delete' },
];

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

export function AuditActivityChart({ data, height = 180 }: AuditActivityChartProps) {
  const { i18n } = useTranslation();
  const isZh = i18n.language === 'zh';
  const chartData = data || (isZh ? MOCK_DATA_ZH : MOCK_DATA_EN);
  const total = chartData.reduce((sum, d) => sum + d.count, 0);

  return (
    <div className="chart-card">
      <div className="chart-card-header">
        <div className="chart-card-title">
          <span className="chart-card-label">{isZh ? '操作趋势' : 'Activity Trend'}</span>
          <span className="chart-card-sublabel">7 DAYS</span>
        </div>
        <div className="chart-card-stat">
          <span className="chart-stat-value">{total}</span>
          <span className="chart-stat-sub">{isZh ? '本周事件' : 'Events'}</span>
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
              formatter={(value: number) => [value, isZh ? '操作次数' : 'Operations']}
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

export function EventTypeChart({ data, height = 180 }: EventTypeChartProps) {
  const { i18n } = useTranslation();
  const isZh = i18n.language === 'zh';
  const chartData = data || (isZh ? EVENT_TYPE_DATA_ZH : EVENT_TYPE_DATA_EN);
  const total = chartData.reduce((sum, d) => sum + d.count, 0);

  return (
    <div className="chart-card">
      <div className="chart-card-header">
        <div className="chart-card-title">
          <span className="chart-card-label">{isZh ? '事件类型' : 'Event Type'}</span>
          <span className="chart-card-sublabel">BREAKDOWN</span>
        </div>
        <div className="chart-card-stat">
          <span className="chart-stat-value">{total}</span>
          <span className="chart-stat-sub">{isZh ? '总计' : 'Total'}</span>
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
              formatter={(value: number) => [value, isZh ? '次数' : 'Count']}
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