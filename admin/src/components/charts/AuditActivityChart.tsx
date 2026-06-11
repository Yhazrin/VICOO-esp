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

// Event type breakdown chart — click bar / chip to focus; click again to reset.
// `focusedKey` is the externally-selected action (e.g. dropdown filter); when
// set, that bar gets full color and the rest dim. Internal click state lets
// users focus a bar from the chart itself, which then bubbles up via
// `onFocusChange` so the table can filter too.
interface EventTypeChartProps {
  data?: Array<{ type: string; count: number; key: string }>;
  height?: number;
  focusedKey?: string | null;
  onFocusChange?: (key: string) => void;
}

const TYPE_COLORS_FOCUSED = 'var(--color-primary)';
const TYPE_COLORS_DIMMED = 'var(--color-border)';

export function EventTypeChart({ data = [], height = 180, focusedKey, onFocusChange }: EventTypeChartProps) {
  const { t } = useTranslation();
  const chartData = data.length > 0 ? data : [];
  const total = chartData.reduce((sum, d) => sum + d.count, 0);
  const focused = focusedKey || null;

  function handleBarClick(entry: { key: string }) {
    if (!onFocusChange) return;
    onFocusChange(focused === entry.key ? '' : entry.key);
  }

  function barColor(entry: { key: string }): string {
    if (focused && focused !== entry.key) return TYPE_COLORS_DIMMED;
    return TYPE_COLORS[entry.key] || TYPE_COLORS_FOCUSED;
  }

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
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ top: 5, right: 30, left: 10, bottom: 0 }}
            onClick={() => focused && onFocusChange?.('')}
          >
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
              content={({ active, payload }) => {
                if (!active || !payload || !payload[0]) return null;
                const p = payload[0].payload as { type: string; count: number; key: string };
                const pct = total > 0 ? ((p.count / total) * 100).toFixed(1) : '0.0';
                return (
                  <div
                    style={{
                      background: 'var(--color-surface)',
                      border: '1px solid var(--color-border)',
                      borderRadius: 'var(--radius-md)',
                      padding: '8px 10px',
                      fontSize: 12,
                      fontFamily: 'var(--font-mono)',
                      minWidth: 160,
                    }}
                  >
                    <div style={{ fontWeight: 600, color: 'var(--color-text)', marginBottom: 4 }}>
                      {p.type}
                    </div>
                    <div style={{ color: 'var(--color-text-2)' }}>
                      <code style={{ fontSize: 10, color: 'var(--color-text-3)' }}>{p.key}</code>
                    </div>
                    <div style={{ color: 'var(--color-text-2)', marginTop: 4 }}>
                      {p.count} · {pct}%
                    </div>
                  </div>
                );
              }}
            />
            <Bar
              dataKey="count"
              radius={[0, 3, 3, 0]}
              barSize={14}
              onClick={handleBarClick}
              cursor={onFocusChange ? 'pointer' : 'default'}
            >
              {chartData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={barColor(entry)}
                  fillOpacity={focused && focused !== entry.key ? 0.25 : 1}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Chip legend — clickable, scrollable, every action type listed. */}
      {chartData.length > 0 && (
        <div
          className="event-type-chip-strip"
          style={{
            display: 'flex',
            flexWrap: 'nowrap',
            gap: 6,
            marginTop: 8,
            paddingTop: 8,
            borderTop: '1px solid var(--color-border)',
            overflowX: 'auto',
            maxHeight: 56,
            overflowY: 'auto',
          }}
        >
          {chartData.map((entry) => {
            const isFocused = focused === entry.key;
            return (
              <button
                key={entry.key}
                type="button"
                onClick={() => onFocusChange?.(isFocused ? '' : entry.key)}
                title={`${entry.type} · ${entry.count}`}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  padding: '3px 8px',
                  fontSize: 10,
                  fontFamily: 'var(--font-mono)',
                  whiteSpace: 'nowrap',
                  border: '1px solid',
                  borderColor: isFocused ? 'var(--color-primary)' : 'var(--color-border)',
                  background: isFocused ? 'var(--color-primary-light)' : 'transparent',
                  color: isFocused ? 'var(--color-primary)' : 'var(--color-text-2)',
                  borderRadius: 'var(--radius-pill)',
                  cursor: onFocusChange ? 'pointer' : 'default',
                  opacity: focused && !isFocused ? 0.5 : 1,
                  flexShrink: 0,
                }}
              >
                <span
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    background: TYPE_COLORS[entry.key] || 'var(--color-primary)',
                    display: 'inline-block',
                  }}
                />
                {entry.type}
                <span style={{ color: 'var(--color-text-3)' }}>·{entry.count}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default AuditActivityChart;