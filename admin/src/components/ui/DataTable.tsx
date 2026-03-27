import React from 'react';

interface Column<T> {
  key: string;
  title: string;
  width?: number | string;
  render?: (value: any, record: T, index: number) => React.ReactNode;
  sorter?: boolean;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  rowKey: string;
  loading?: boolean;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  onSort?: (key: string) => void;
  onRowClick?: (record: T) => void;
}

export default function DataTable<T extends Record<string, any>>({
  columns, data, rowKey, loading, sortBy, sortOrder, onSort, onRowClick,
}: DataTableProps<T>) {
  const renderSortIcon = (key: string) => {
    if (sortBy !== key) return <span style={{ color: '#ccc', marginLeft: 4 }}>&#8693;</span>;
    return (
      <span style={{ color: 'var(--color-accent)', marginLeft: 4 }}>
        {sortOrder === 'asc' ? '\u2191' : '\u2193'}
      </span>
    );
  };

  return (
    <div style={{
      background: 'var(--color-bg-card)',
      border: '1px solid var(--color-border)',
      borderRadius: 'var(--radius-lg)',
      overflow: 'hidden',
    }}>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', minWidth: 600 }}>
          <thead>
            <tr style={{ borderBottom: '2px solid var(--color-border)' }}>
              {columns.map((col) => (
                <th
                  key={col.key}
                  onClick={() => col.sorter && onSort?.(col.key)}
                  style={{
                    padding: '14px 16px',
                    textAlign: 'left',
                    fontSize: 12,
                    fontWeight: 600,
                    color: 'var(--color-text-secondary)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    width: col.width,
                    cursor: col.sorter ? 'pointer' : 'default',
                    userSelect: 'none',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {col.title}
                  {col.sorter && renderSortIcon(col.key)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={columns.length} style={{ padding: 40, textAlign: 'center', color: 'var(--color-text-light)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                    <div style={{
                      width: 20, height: 20,
                      border: '2px solid var(--color-border)',
                      borderTopColor: 'var(--color-accent)',
                      borderRadius: '50%',
                      animation: 'spin 0.8s linear infinite',
                    }} />
                    加载中...
                  </div>
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} style={{ padding: 40, textAlign: 'center', color: 'var(--color-text-light)' }}>
                  暂无数据
                </td>
              </tr>
            ) : (
              data.map((record, idx) => (
                <tr
                  key={record[rowKey]}
                  onClick={() => onRowClick?.(record)}
                  style={{
                    borderBottom: '1px solid var(--color-border-light)',
                    cursor: onRowClick ? 'pointer' : 'default',
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLTableRowElement).style.background = '#fafaf8'; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLTableRowElement).style.background = 'transparent'; }}
                >
                  {columns.map((col) => (
                    <td key={col.key} style={{
                      padding: '12px 16px',
                      fontSize: 13,
                      color: 'var(--color-text)',
                      maxWidth: col.width || 300,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}>
                      {col.render ? col.render(record[col.key], record, idx) : record[col.key]}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

export type { Column };
