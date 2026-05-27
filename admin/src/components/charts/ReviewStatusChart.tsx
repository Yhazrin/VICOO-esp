import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

// Mock data for review status
const MOCK_DATA = [
  { status: '待审核', count: 12, key: 'pending' },
  { status: '已通过', count: 89, key: 'approved' },
  { status: '已拒绝', count: 5, key: 'rejected' },
  { status: '草稿', count: 3, key: 'draft' },
];

const STATUS_COLORS: Record<string, string> = {
  pending: 'var(--color-warning)',
  approved: 'var(--color-primary)',
  rejected: 'var(--color-error)',
  draft: 'var(--color-text-3)',
};

interface ReviewStatusChartProps {
  data?: Array<{ status: string; count: number; key: string }>;
  height?: number;
}

export function ReviewStatusChart({ data = MOCK_DATA, height = 180 }: ReviewStatusChartProps) {
  const total = data.reduce((sum, d) => sum + d.count, 0);

  return (
    <div className="chart-card">
      <div className="chart-card-header">
        <div className="chart-card-title">
          <span className="chart-card-label">审核状态</span>
          <span className="chart-card-sublabel">Review Status</span>
        </div>
        <div className="chart-card-stat">
          <span className="chart-stat-value">{total}</span>
          <span className="chart-stat-sub">总计</span>
        </div>
      </div>
      <div className="chart-card-body" style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ top: 5, right: 20, left: 10, bottom: 0 }}>
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
              dataKey="status"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11, fill: 'var(--color-text-2)' }}
              width={50}
            />
            <Tooltip
              contentStyle={{
                background: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-md)',
                fontSize: 12,
                fontFamily: 'var(--font-mono)',
              }}
              formatter={(value: number, name: string, props: any) => [value, '数量']}
              labelStyle={{ color: 'var(--color-text-2)' }}
            />
            <Bar dataKey="count" radius={[0, 3, 3, 0]} barSize={16}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={STATUS_COLORS[entry.key] || 'var(--color-primary)'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export default ReviewStatusChart;