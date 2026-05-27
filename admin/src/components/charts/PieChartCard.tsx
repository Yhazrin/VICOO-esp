import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import type { ChartDataPoint } from '../../types';

interface PieChartCardProps {
  title: string;
  data: ChartDataPoint[];
  colors?: string[];
  height?: number;
}

const defaultColors = [
  'var(--color-primary)',
  'var(--color-info)',
  'var(--color-warning)',
  'var(--color-success)',
  '#8B5CF6',
  'var(--color-error)',
];

export default function PieChartCard({
  title, data, colors = defaultColors, height = 280,
}: PieChartCardProps) {
  return (
    <div style={{
      background: 'var(--color-surface)',
      border: '1px solid var(--color-border)',
      borderRadius: 'var(--radius-xl)',
      padding: '24px',
      boxShadow: 'var(--shadow-card)',
    }}>
      <h3 style={{
        fontSize: '16px',
        fontWeight: 600,
        marginBottom: '20px',
        color: 'var(--color-text)',
      }}>
        {title}
      </h3>
      <ResponsiveContainer width="100%" height={height}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={90}
            paddingAngle={3}
            dataKey="value"
            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
            labelLine={{ stroke: 'var(--color-text-3)', strokeWidth: 1 }}
          >
            {data.map((_, i) => (
              <Cell key={i} fill={colors[i % colors.length]} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              background: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-md)',
              fontSize: 12,
              boxShadow: 'var(--shadow-md)',
            }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}