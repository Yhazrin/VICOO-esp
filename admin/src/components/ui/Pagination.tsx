import { useTranslation } from 'react-i18next';

interface PaginationProps {
  page: number;
  totalPages: number;
  total: number;
  pageSize: number;
  onPageChange: (page: number) => void;
}

export default function Pagination({ page, totalPages, total, pageSize, onPageChange }: PaginationProps) {
  const { t } = useTranslation();

  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (page > 3) pages.push('...');
      for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) {
        pages.push(i);
      }
      if (page < totalPages - 2) pages.push('...');
      pages.push(totalPages);
    }
    return pages;
  };

  if (totalPages <= 1) {
    return (
      <div style={{ padding: '10px 0', fontSize: 12, color: 'var(--color-text-3)', fontFamily: 'var(--font-mono)' }}>
        {t('pagination.total', { count: total })}
      </div>
    );
  }

  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '10px 0', flexWrap: 'wrap', gap: 8,
    }}>
      <span style={{ fontSize: 12, color: 'var(--color-text-3)', fontFamily: 'var(--font-mono)' }}>
        {t('pagination.page', { current: page, total: totalPages })}
      </span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <PageBtn onClick={() => onPageChange(page - 1)} disabled={page <= 1}>
          &laquo;
        </PageBtn>
        {getPageNumbers().map((p, i) =>
          typeof p === 'string' ? (
            <span key={`ellipsis-${i}`} style={{ padding: '0 6px', color: 'var(--color-text-3)', fontSize: 12 }}>...</span>
          ) : (
            <PageBtn key={p} active={p === page} onClick={() => onPageChange(p)}>
              {p}
            </PageBtn>
          )
        )}
        <PageBtn onClick={() => onPageChange(page + 1)} disabled={page >= totalPages}>
          &raquo;
        </PageBtn>
      </div>
    </div>
  );
}

function PageBtn({ children, active, disabled, onClick }: {
  children: React.ReactNode; active?: boolean; disabled?: boolean; onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        minWidth: 30, height: 30,
        padding: '0 6px',
        border: '1px solid',
        borderColor: active ? 'rgba(255,255,255,0.2)' : 'var(--color-border)',
        borderRadius: '6px',
        background: active ? 'rgba(255,255,255,0.1)' : 'transparent',
        color: active ? 'var(--color-text)' : disabled ? 'var(--color-text-3)' : 'var(--color-text-2)',
        fontSize: 12,
        fontFamily: 'var(--font-mono)',
        fontWeight: active ? 600 : 400,
        cursor: disabled ? 'not-allowed' : 'pointer',
        transition: 'all 0.15s',
        opacity: disabled ? 0.4 : 1,
      }}
    >
      {children}
    </button>
  );
}
