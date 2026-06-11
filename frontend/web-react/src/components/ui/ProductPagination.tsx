import { useTranslation } from 'react-i18next';

interface ProductPaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  /** i18n key prefix, e.g. "shop.pagination" or "impactShop.pagination" */
  i18nPrefix?: string;
  className?: string;
}

export default function ProductPagination({
  page,
  totalPages,
  onPageChange,
  i18nPrefix = 'shop.pagination',
  className = '',
}: ProductPaginationProps) {
  const { t } = useTranslation();

  if (totalPages <= 1) return null;

  const visiblePages = (() => {
    const maxButtons = 7;
    if (totalPages <= maxButtons) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    const pages = new Set<number>([1, totalPages, page, page - 1, page + 1]);
    return Array.from(pages)
      .filter((p) => p >= 1 && p <= totalPages)
      .sort((a, b) => a - b);
  })();

  return (
    <nav
      aria-label={t(`${i18nPrefix}.ariaLabel`)}
      className={`flex items-center justify-center mt-12 ${className}`}
    >
      <div className="flex items-center rounded-full bg-white/80 backdrop-blur-xl shadow-sm px-2 py-1">
        <button
          type="button"
          onClick={() => onPageChange(Math.max(1, page - 1))}
          disabled={page === 1}
          aria-label={t(`${i18nPrefix}.prevAria`)}
          className="font-body text-label tracking-wider uppercase px-3 py-1 rounded-full text-ink-faded hover:text-ink disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-all"
        >
          {t(`${i18nPrefix}.prev`)}
        </button>
        {visiblePages.map((p, idx) => {
          const prev = visiblePages[idx - 1];
          const showEllipsis = idx > 0 && prev != null && p - prev > 1;
          return (
            <span key={p} className="flex items-center">
              {showEllipsis && (
                <span className="px-1 text-ink-faded select-none" aria-hidden="true">
                  …
                </span>
              )}
              <button
                type="button"
                onClick={() => onPageChange(p)}
                aria-label={`${t(`${i18nPrefix}.pageAria`)} ${p}`}
                aria-current={page === p ? 'page' : undefined}
                className={`
                  w-9 h-9 font-body text-caption rounded-full transition-all cursor-pointer
                  ${page === p ? 'bg-rust text-paper font-medium' : 'text-ink-faded hover:text-ink'}
                `}
              >
                {p}
              </button>
            </span>
          );
        })}
        <button
          type="button"
          onClick={() => onPageChange(Math.min(totalPages, page + 1))}
          disabled={page === totalPages}
          aria-label={t(`${i18nPrefix}.nextAria`)}
          className="font-body text-label tracking-wider uppercase px-3 py-1 rounded-full text-ink-faded hover:text-ink disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-all"
        >
          {t(`${i18nPrefix}.next`)}
        </button>
      </div>
    </nav>
  );
}
