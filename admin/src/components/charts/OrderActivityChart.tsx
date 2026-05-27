import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

// Mock data for order activity (last 7 days)
const MOCK_DATA = [
  { date: '周一', orders: 12, completed: 8 },
  { date: '周二', orders: 18, completed: 15 },
  { date: '周三', orders: 14, completed: 12 },
  { date: '周四', orders: 22, completed: 18 },
  { date: '周五', orders: 25, completed: 20 },
  { date: '周六', orders: 30, completed: 28 },
  { date: '周日', orders: 20, completed: 16 },
];

interface OrderActivityChartProps {
  data?: Array<{ date: string; orders: number; completed: number }>;
  height?: number;
}

export function OrderActivityChart({ data = MOCK_DATA, height = 180 }: OrderActivityChartProps) {
  const totalOrders = data.reduce((sum, d) => sum + d.orders, 0);
  const totalCompleted = data.reduce((sum, d) => sum + d.completed, 0);

  return (
    <div className="chart-card">
      <div className="chart-card-header">
        <div className="chart-card-title">
          <span className="chart-card-label">订单活动</span>
          <span className="chart-card-sublabel">Order Activity</span>
        </div>
        <div className="chart-card-stat">
          <span className="chart-stat-value">{totalOrders}</span>
          <span className="chart-stat-sub">本周订单</span>
        </div>
      </div>
      <div className="chart-card-body" style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
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
              formatter={(value: number, name: string) => [
                value,
                name === 'orders' ? '订单' : '已完成'
              ]}
              labelStyle={{ color: 'var(--color-text-2)' }}
            />
            <Line
              type="monotone"
              dataKey="orders"
              stroke="var(--color-primary)"
              strokeWidth={1.5}
              dot={false}
            />
            <Line
              type="monotone"
              dataKey="completed"
              stroke="var(--color-info)"
              strokeWidth={1.5}
              strokeDasharray="4 4"
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export default OrderActivityChart;