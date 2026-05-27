import React from 'react';
import { useTranslation } from 'react-i18next';
import DataTable, { type Column } from './DataTable';
import Pagination from './Pagination';
import Button from './Button';
import './DataTableShell.css';

interface DataTableShellProps<T> {
  // Header
  title: string;
  description?: string;
  actions?: React.ReactNode;

  // Summary cards slot
  summarySlot?: React.ReactNode;

  // Toolbar
  toolbarLeft?: React.ReactNode;
  toolbarRight?: React.ReactNode;

  // Filters (replaces default toolbar)
  filters?: React.ReactNode;
  showDefaultSearch?: boolean;
  searchPlaceholder?: string;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  defaultFilters?: React.ReactNode;

  // Table
  columns: Column<T>[];
  data: T[];
  rowKey: string;
  loading?: boolean;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  onSort?: (key: string) => void;
  onRowClick?: (record: T) => void;

  // Pagination
  page?: number;
  totalPages?: number;
  total?: number;
  pageSize?: number;
  onPageChange?: (page: number) => void;

  // Empty state
  emptyTitle?: string;
  emptyDescription?: string;
  emptyIcon?: React.ReactNode;
  onEmptyAction?: () => void;
  emptyActionLabel?: string;

  // Error state
  error?: string | null;
  onRetry?: () => void;
}

export default function DataTableShell<T extends Record<string, any>>({
  // Header
  title,
  description,
  actions,

  // Summary cards slot
  summarySlot,

  // Toolbar
  toolbarLeft,
  toolbarRight,
  filters,
  showDefaultSearch = false,
  searchPlaceholder,
  searchValue,
  onSearchChange,
  defaultFilters,

  // Table
  columns,
  data,
  rowKey,
  loading = false,
  sortBy,
  sortOrder,
  onSort,
  onRowClick,

  // Pagination
  page = 1,
  totalPages = 1,
  total = 0,
  pageSize = 10,
  onPageChange,

  // Empty state
  emptyTitle,
  emptyDescription,
  emptyIcon,
  onEmptyAction,
  emptyActionLabel,

  // Error state
  error,
  onRetry,
}: DataTableShellProps<T>) {
  const { t } = useTranslation();

  // Search icon SVG
  const SearchIcon = (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );

  return (
    <div className="data-table-shell">
      {/* Header */}
      {(title || description || actions) && (
        <div className="data-table-shell__header">
          <div className="data-table-shell__header-left">
            {title && <h1 className="data-table-shell__title">{title}</h1>}
            {description && <p className="data-table-shell__description">{description}</p>}
          </div>
          {actions && <div className="data-table-shell__actions">{actions}</div>}
        </div>
      )}

      {/* Summary Cards */}
      {summarySlot && <div className="data-table-shell__summary">{summarySlot}</div>}

      {/* Toolbar / Filters */}
      {filters ? (
        <div className="table-toolbar">{filters}</div>
      ) : (
        (showDefaultSearch || toolbarLeft || toolbarRight || defaultFilters) && (
          <div className="table-toolbar">
            <div className="table-toolbar__filters">
              {showDefaultSearch && (
                <div className="table-search">
                  {SearchIcon}
                  <input
                    type="text"
                    placeholder={searchPlaceholder || t('common.search', 'Search...')}
                    value={searchValue || ''}
                    onChange={(e) => onSearchChange?.(e.target.value)}
                  />
                </div>
              )}
              {defaultFilters}
              {toolbarLeft}
            </div>
            {toolbarRight && <div className="table-toolbar__right">{toolbarRight}</div>}
          </div>
        )
      )}

      {/* Error State */}
      {error && (
        <div className="data-table-shell__error">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <span>{error}</span>
          {onRetry && (
            <Button size="sm" variant="ghost" onClick={onRetry}>
              {t('common.retry', 'Retry')}
            </Button>
          )}
        </div>
      )}

      {/* Table Container */}
      <div className="data-table-shell__table-container">
        <DataTable
          columns={columns}
          data={data}
          rowKey={rowKey}
          loading={loading}
          sortBy={sortBy}
          sortOrder={sortOrder}
          onSort={onSort}
          onRowClick={onRowClick}
        />

        {/* Empty State */}
        {!loading && !error && data.length === 0 && (
          <div className="data-table-shell__empty">
            <div className="data-table-shell__empty-icon">
              {emptyIcon || (
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" />
                  <polyline points="13 2 13 9 20 9" />
                </svg>
              )}
            </div>
            <h3 className="data-table-shell__empty-title">
              {emptyTitle || t('dataTable.emptyTitle', 'No Data')}
            </h3>
            {emptyDescription && (
              <p className="data-table-shell__empty-description">{emptyDescription}</p>
            )}
            {onEmptyAction && emptyActionLabel && (
              <Button variant="primary" onClick={onEmptyAction}>
                {emptyActionLabel}
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Pagination */}
      {onPageChange && (
        <div className="data-table-shell__pagination">
          <Pagination
            page={page}
            totalPages={totalPages}
            total={total}
            pageSize={pageSize}
            onPageChange={onPageChange}
          />
        </div>
      )}
    </div>
  );
}