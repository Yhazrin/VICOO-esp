interface PaginationProps {
  page: number;
  totalPages: number;
  total: number;
  pageSize: number;
  onPageChange: (page: number) => void;
}

export default function Pagination({ page, totalPages, total, pageSize, onPageChange }: PaginationProps) {
  const start = (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);

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
      <div style={{ padding: '12px 0', fontSize: 13, color: 'var(--color-text-secondary)' }}>
        共 {total} 条记录
      </div>
    );
  }

  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '12px 0', flexWrap: 'wrap', gap: 12,
    }}>
      <span style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>
        显示 {start}-{end} / 共 {total} 条
      </span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <PageBtn onClick={() => onPageChange(page - 1)} disabled={page <= 1}>
          &laquo;
        </PageBtn>
        {getPageNumbers().map((p, i) =>
          typeof p === 'string' ? (
            <span key={`ellipsis-${i}`} style={{ padding: '0 8px', color: 'var(--color-text-light)' }}>...</span>
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
        minWidth: 34, height: 34,
        padding: '0 8px',
        border: '1px solid',
        borderColor: active ? 'var(--color-accent)' : 'var(--color-border)',
        borderRadius: 'var(--radius-sm)',
        background: active ? 'var(--color-accent)' : 'var(--color-bg-card)',
        color: active ? '#fff' : disabled ? 'var(--color-text-light)' : 'var(--color-text)',
        fontSize: 13,
        fontWeight: active ? 600 : 400,
        cursor: disabled ? 'not-allowed' : 'pointer',
        transition: 'all 0.15s',
        opacity: disabled ? 0.5 : 1,
      }}
    >
      {children}
    </button>
  );
}
