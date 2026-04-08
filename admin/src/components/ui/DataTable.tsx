import React from 'react';

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
  const renderSortIcon = (key: string) => {
    if (sortBy !== key) return <span style={{ color: 'var(--color-warm-gray)', marginLeft: 6 }}>&#8693;</span>;
    return (
      <span style={{ color: 'var(--color-rust)', marginLeft: 6, fontWeight: 'bold' }}>
        {sortOrder === 'asc' ? '\u2191' : '\u2193'}
      </span>
    );
  };

  return (
    <div className="data-table-container" style={{
      borderRadius: 'var(--radius-sm)',
      position: 'relative',
      width: '100%',
    }}>
      <div style={{ 
        overflowX: 'auto', 
        width: '100%',
        WebkitOverflowScrolling: 'touch',
      }}>
        <table style={{ 
          width: '100%', 
          minWidth: 'max-content', // Crucial: table takes as much space as columns need
          borderCollapse: 'separate', // Needed for sticky header borders
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
                    padding: '16px 24px',
                    textAlign: 'left',
                    fontSize: 11,
                    fontWeight: 700,
                    color: 'var(--color-ink)',
                    backgroundColor: 'var(--color-aged-stock)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.12em',
                    width: col.width,
                    minWidth: col.minWidth || 120,
                    cursor: col.sorter ? 'pointer' : 'default',
                    userSelect: 'none',
                    whiteSpace: 'nowrap',
                    borderBottom: '1px solid var(--color-ink)',
                    transition: 'background-color 0.2s',
                  }}
                  onMouseEnter={(e) => { if(col.sorter) e.currentTarget.style.backgroundColor = 'var(--color-warm-gray)'; }}
                  onMouseLeave={(e) => { if(col.sorter) e.currentTarget.style.backgroundColor = 'var(--color-aged-stock)'; }}
                >
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    {col.title}
                    {col.sorter && renderSortIcon(col.key)}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody style={{ backgroundColor: 'white' }}>
            {loading ? (
              <tr>
                <td colSpan={columns.length} style={{ padding: 60, textAlign: 'center', color: 'var(--color-sepia-mid)' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
                    <div style={{
                      width: 24, height: 24,
                      border: '2px solid var(--color-warm-gray)',
                      borderTopColor: 'var(--color-rust)',
                      borderRadius: '50%',
                      animation: 'spin 1s cubic-bezier(0.4, 0, 0.2, 1) infinite',
                    }} />
                    <span style={{ fontSize: 12, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Synchronizing Archive...</span>
                  </div>
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} style={{ padding: 60, textAlign: 'center', color: 'var(--color-sepia-mid)', fontStyle: 'italic' }}>
                  No records found in the current selection.
                </td>
              </tr>
            ) : (
              data.map((record, idx) => (
                <tr
                  key={record[rowKey] || idx}
                  onClick={() => onRowClick?.(record)}
                  style={{
                    cursor: onRowClick ? 'pointer' : 'default',
                    transition: 'background-color 0.1s ease',
                  }}
                  className="table-row-hover"
                >
                  {columns.map((col) => (
                    <td key={col.key} style={{
                      padding: '16px 24px',
                      fontSize: 13,
                      lineHeight: 1.5,
                      color: 'var(--color-ink)',
                      width: col.width,
                      minWidth: col.minWidth || 120,
                      borderBottom: '1px solid var(--color-warm-gray)',
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
          background-color: rgba(92, 64, 51, 0.04);
        }
        .data-table-container::after {
          content: '';
          position: absolute;
          top: 0; right: 0; bottom: 0;
          width: 20px;
          pointer-events: none;
          background: linear-gradient(to right, transparent, rgba(0,0,0,0.02));
        }
      `}</style>
    </div>
  );
}

export type { Column };
