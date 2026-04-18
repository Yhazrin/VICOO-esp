import React from 'react';
import { useTranslation } from 'react-i18next';

interface Column<T> {
  key: string;
  title: string;
  width?: number | string;
  minWidth?: number | string;
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
  const { t } = useTranslation();
  const renderSortIcon = (key: string) => {
    if (sortBy !== key) return <span style={{ color: 'var(--color-text-3)', marginLeft: 4 }}>&#8693;</span>;
    return (
      <span style={{ color: 'var(--color-text)', marginLeft: 4 }}>
        {sortOrder === 'asc' ? '\u2191' : '\u2193'}
      </span>
    );
  };

  return (
    <div className="data-table-container" style={{
      borderRadius: '8px',
      background: 'var(--color-surface)',
      border: '1px solid var(--color-border)',
      position: 'relative',
      width: '100%',
      overflow: 'hidden',
    }}>
      <div style={{
        overflowX: 'auto',
        width: '100%',
        WebkitOverflowScrolling: 'touch',
      }}>
        <table style={{
          width: '100%',
          minWidth: 'max-content',
          borderCollapse: 'separate',
          borderSpacing: 0
        }}>
          <thead>
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  onClick={() => col.sorter && onSort?.(col.key)}
                  style={{
                    position: 'sticky',
                    top: 0,
                    zIndex: 10,
                    padding: '12px 16px',
                    textAlign: 'left',
                    fontSize: 11,
                    fontWeight: 600,
                    color: 'var(--color-text-3)',
                    backgroundColor: 'var(--color-surface)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    width: col.width,
                    minWidth: col.minWidth || 100,
                    cursor: col.sorter ? 'pointer' : 'default',
                    userSelect: 'none',
                    whiteSpace: 'nowrap',
                    borderBottom: '1px solid var(--color-border)',
                    transition: 'background-color 0.15s',
                    fontFamily: 'var(--font-body)',
                  }}
                  onMouseEnter={(e) => { if(col.sorter) e.currentTarget.style.backgroundColor = 'var(--color-elevated)'; }}
                  onMouseLeave={(e) => { if(col.sorter) e.currentTarget.style.backgroundColor = 'var(--color-surface)'; }}
                >
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    {col.title}
                    {col.sorter && renderSortIcon(col.key)}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={columns.length} style={{ padding: 48, textAlign: 'center', color: 'var(--color-text-3)' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
                    <div style={{
                      width: 20, height: 20,
                      border: '2px solid var(--color-border)',
                      borderTopColor: 'var(--color-text-3)',
                      borderRadius: '50%',
                      animation: 'spin 0.8s linear infinite',
                    }} />
                    <span style={{ fontSize: 12, fontFamily: 'var(--font-mono)', letterSpacing: '0.05em' }}>
                      {t('dataTable.loading', 'Loading...')}
                    </span>
                  </div>
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} style={{ padding: 48, textAlign: 'center', color: 'var(--color-text-3)', fontSize: 13 }}>
                  {t('dataTable.empty', 'No data')}
                </td>
              </tr>
            ) : (
              data.map((record, idx) => (
                <tr
                  key={record[rowKey] || idx}
                  onClick={() => onRowClick?.(record)}
                  style={{
                    cursor: onRowClick ? 'pointer' : 'default',
                    transition: 'background-color 0.1s',
                  }}
                  className="table-row-hover"
                >
                  {columns.map((col) => (
                    <td key={col.key} style={{
                      padding: '12px 16px',
                      fontSize: 13,
                      lineHeight: 1.5,
                      color: 'var(--color-text-2)',
                      width: col.width,
                      minWidth: col.minWidth || 100,
                      borderBottom: '1px solid var(--color-border)',
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
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .table-row-hover:hover td {
          background-color: var(--color-surface);
        }
      `}</style>
    </div>
  );
}

export type { Column };
