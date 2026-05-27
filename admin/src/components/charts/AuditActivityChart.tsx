import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

// Mock data for audit activity (last 7 days)
const MOCK_DATA = [
  { date: '周一', count: 45 },
  { date: '周二', count: 52 },
  { date: '周三', count: 38 },
  { date: '周四', count: 61 },
  { date: '周五', count: 55 },
  { date: '周六', count: 28 },
  { date: '周日', count: 22 },
];

// Event type breakdown
const EVENT_TYPE_DATA = [
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

export function AuditActivityChart({ data = MOCK_DATA, height = 180 }: AuditActivityChartProps) {
  const total = data.reduce((sum, d) => sum + d.count, 0);

  return (
    <div className="chart-card">
      <div className="chart-card-header">
        <div className="chart-card-title">
          <span className="chart-card-label">操作趋势</span>
          <span className="chart-card-sublabel">Activity Trend</span>
        </div>
        <div className="chart-card-stat">
          <span className="chart-stat-value">{total}</span>
          <span className="chart-stat-sub">本周事件</span>
        </div>
      </div>
      <div className="chart-card-body" style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
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
              formatter={(value: number) => [value, '操作次数']}
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

export function EventTypeChart({ data = EVENT_TYPE_DATA, height = 180 }: EventTypeChartProps) {
  const total = data.reduce((sum, d) => sum + d.count, 0);

  return (
    <div className="chart-card">
      <div className="chart-card-header">
        <div className="chart-card-title">
          <span className="chart-card-label">事件类型</span>
          <span className="chart-card-sublabel">Event Type</span>
        </div>
        <div className="chart-card-stat">
          <span className="chart-stat-value">{total}</span>
          <span className="chart-stat-sub">总计</span>
        </div>
      </div>
      <div className="chart-card-body" style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ top: 5, right: 30, left: 10, bottom: 0 }}>
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
              width={45}
            />
            <Tooltip
              contentStyle={{
                background: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-md)',
                fontSize: 12,
                fontFamily: 'var(--font-mono)',
              }}
              formatter={(value: number) => [value, '次数']}
              labelStyle={{ color: 'var(--color-text-2)' }}
            />
            <Bar dataKey="count" radius={[0, 3, 3, 0]} barSize={14}>
              {data.map((entry, index) => (
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