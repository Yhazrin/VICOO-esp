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
    if (sortBy !== key) {
      return (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.4, marginLeft: 4 }}>
          <path d="M7 15l5 5 5-5" />
          <path d="M7 9l5-5 5 5" />
        </svg>
      );
    }
    return (
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: 4, color: 'var(--color-primary)' }}>
        {sortOrder === 'asc' ? (
          <path d="M7 15l5 5 5-5" />
        ) : (
          <path d="M7 9l5-5 5 5" />
        )}
      </svg>
    );
  };

  return (
    <div className="data-table-container">
      <div style={{
        overflowX: 'auto',
        width: '100%',
        WebkitOverflowScrolling: 'touch',
      }}>
        <table>
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
                    padding: '14px 18px',
                    textAlign: 'left',
                    fontSize: '11px',
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
                    transition: 'all var(--duration-fast)',
                    fontFamily: 'var(--font-mono)',
                  }}
                  onMouseEnter={(e) => {
                    if (col.sorter) {
                      e.currentTarget.style.backgroundColor = 'var(--color-elevated)';
                      e.currentTarget.style.color = 'var(--color-text-2)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--color-surface)';
                    e.currentTarget.style.color = 'var(--color-text-3)';
                  }}
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
                <td colSpan={columns.length} style={{ padding: '60px', textAlign: 'center' }}>
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '16px',
                  }}>
                    <div style={{
                      width: '24px',
                      height: '24px',
                      border: '2px solid var(--color-border)',
                      borderTopColor: 'var(--color-primary)',
                      borderRadius: '50%',
                      animation: 'spin 0.8s linear infinite',
                    }} />
                    <span style={{
                      fontSize: '12px',
                      fontFamily: 'var(--font-mono)',
                      letterSpacing: '0.05em',
                      color: 'var(--color-text-3)',
                    }}>
                      {t('dataTable.loading', 'Loading...')}
                    </span>
                  </div>
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} style={{
                  padding: '60px',
                  textAlign: 'center',
                  color: 'var(--color-text-3)',
                  fontSize: '13px',
                }}>
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '8px',
                  }}>
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.3 }}>
                      <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" />
                      <polyline points="13 2 13 9 20 9" />
                    </svg>
                    {t('dataTable.empty', 'No data')}
                  </div>
                </td>
              </tr>
            ) : (
              data.map((record, idx) => (
                <tr
                  key={record[rowKey] || idx}
                  onClick={() => onRowClick?.(record)}
                  style={{
                    cursor: onRowClick ? 'pointer' : 'default',
                  }}
                >
                  {columns.map((col) => (
                    <td key={col.key} style={{
                      padding: '14px 18px',
                      fontSize: '13px',
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
    </div>
  );
}

export type { Column };