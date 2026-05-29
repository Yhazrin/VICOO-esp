import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useTranslation } from 'react-i18next';

interface OrderActivityChartProps {
  data?: Array<{ date: string; orders: number; completed: number }>;
  height?: number;
}

export function OrderActivityChart({ data = [], height = 180 }: OrderActivityChartProps) {
  const { i18n } = useTranslation();
  const isZh = i18n.language === 'zh';
  const chartData = data.length > 0 ? data : [];
  const totalOrders = chartData.reduce((sum, d) => sum + d.orders, 0);

  return (
    <div className="chart-card">
      <div className="chart-card-header">
        <div className="chart-card-title">
          <span className="chart-card-label">{isZh ? '订单活动' : 'Order Activity'}</span>
          <span className="chart-card-sublabel">7 DAYS</span>
        </div>
        <div className="chart-card-stat">
          <span className="chart-stat-value">{totalOrders}</span>
          <span className="chart-stat-sub">{isZh ? '本周订单' : 'Orders'}</span>
        </div>
      </div>
      <div className="chart-card-body" style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
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
                name === 'orders' ? (isZh ? '订单' : 'Orders') : (isZh ? '已完成' : 'Completed')
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