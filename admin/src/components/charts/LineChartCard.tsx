import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import type { ChartDataPoint } from '../../types';

interface LineChartCardProps {
  title: string;
  data: ChartDataPoint[];
  dataKeys?: string[];
  colors?: string[];
  height?: number;
}

const defaultColors = [
  'var(--color-primary)',
  'var(--color-info)',
  'var(--color-warning)',
];

export default function LineChartCard({
  title, data, dataKeys = ['value'], colors = defaultColors, height = 280,
}: LineChartCardProps) {
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
        <LineChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="var(--color-border)"
            vertical={false}
          />
          <XAxis
            dataKey="name"
            tick={{ fontSize: 11, fill: 'var(--color-text-3)' }}
            axisLine={{ stroke: 'var(--color-border)' }}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 11, fill: 'var(--color-text-3)' }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            contentStyle={{
              background: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-md)',
              fontSize: 12,
              boxShadow: 'var(--shadow-md)',
            }}
          />
          {dataKeys.length > 1 && (
            <Legend
              wrapperStyle={{ fontSize: 12 }}
              iconType="circle"
            />
          )}
          {dataKeys.map((key, i) => (
            <Line
              key={key}
              type="monotone"
              dataKey={key}
              stroke={colors[i % colors.length]}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 5, fill: colors[i % colors.length] }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}