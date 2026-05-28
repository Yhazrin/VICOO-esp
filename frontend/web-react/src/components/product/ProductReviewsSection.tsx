import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { reviewsApi, type ProductReview } from '@/services/reviewsApi';
import { deserializeReviewBody } from '@/utils/reviewChips';
import { formatDate } from '@/utils/dateTime';

const DIMENSION_TAG_KEYS = ['fitComfort', 'packaging', 'traceableImpact'] as const;

function StarIcon({ filled }: { filled: boolean }) {
  return (
    <svg viewBox="0 0 20 20" className="h-5 w-5 shrink-0" aria-hidden="true">
      <path
        fill={filled ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth="1.2"
        d="M10 1.5l2.35 4.76 5.25.76-3.8 3.7.9 5.23L10 13.9l-4.7 2.05.9-5.23-3.8-3.7 5.25-.76L10 1.5z"
      />
    </svg>
  );
}


function RatingDisplay({
  average,
  count,
  countLabel,
}: {
  average: number;
  count: number;
  countLabel: string;
}) {
  const rounded = Math.round(average * 10) / 10;
  return (
    <div className="flex items-end gap-4">
      <p className="font-display text-5xl font-semibold leading-none tracking-tight text-ink tabular-nums">
        {count > 0 ? rounded.toFixed(1) : '0.0'}
      </p>
      <div>
        <div className="flex items-center gap-0.5 text-neutral-800">
          {[1, 2, 3, 4, 5].map((i) => (
            <StarIcon key={i} filled={count > 0 && i <= Math.round(average)} />
          ))}
        </div>
        <p className="mt-1 font-body text-xs text-neutral-500">/ 5 · {countLabel}</p>
      </div>
    </div>
  );
}

function ReviewCard({
  review,
  ratingLabel,
  authorLabel,
}: {
  review: ProductReview;
  ratingLabel: string;
  authorLabel: string;
}) {
  const { t } = useTranslation();
  const { text, chipIds } = deserializeReviewBody(review.body);

  return (
    <article className="rounded-2xl border border-[#E8E8E6] bg-white/70 px-5 py-5 shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition-shadow duration-200 hover:shadow-[0_8px_24px_-12px_rgba(0,0,0,0.08)]">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-0.5 text-neutral-800" aria-hidden="true">
          {[1, 2, 3, 4, 5].map((i) => (
            <StarIcon key={i} filled={i <= review.rating} />
          ))}
        </div>
        <time className="font-mono text-[10px] tracking-[0.06em] text-neutral-400">
          {formatDate(review.created_at)}
        </time>
      </div>
      <p className="sr-only">
        {ratingLabel} {review.rating}/5
      </p>
      <p className="mt-3 font-body text-xs tracking-[0.04em] uppercase text-neutral-500">
        {review.author_nickname?.trim() || authorLabel}
      </p>
      {review.title && (
        <h3 className="mt-3 font-display text-lg font-medium leading-snug tracking-tight text-ink">
          {review.title}
        </h3>
      )}
      {text && (
        <p className="mt-2 font-body text-sm leading-relaxed text-neutral-600 whitespace-pre-line">
          {text}
        </p>
      )}
      {chipIds.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {chipIds.map((id) => (
            <span
              key={id}
              className="rounded-full border border-[#E5E5E5] bg-white/80 px-3 py-1.5 font-body text-[11px] tracking-[0.04em] text-neutral-600"
            >
              {t(`shop.detail.reviewChips.${id}`)}
            </span>
          ))}
        </div>
      )}
    </article>
  );
}

export default function ProductReviewsSection({ productId }: { productId: number }) {
  const { t } = useTranslation();

  const { data: reviewsResult } = useQuery({
    queryKey: ['reviews', productId],
    queryFn: () => reviewsApi.listByProduct(productId),
    enabled: productId > 0,
  });

  const reviews = reviewsResult?.data ?? [];
  const reviewCount = reviewsResult?.total ?? reviews.length;
  const averageRating = useMemo(() => {
    if (reviewCount === 0) return 0;
    return reviews.reduce((sum, r) => sum + r.rating, 0) / reviewCount;
  }, [reviews, reviewCount]);

  return (
    <section className="py-20 md:py-24 lg:py-[96px]" aria-labelledby="product-reviews-heading">
      <div className="mx-auto w-full max-w-[1180px] px-6 md:px-10">
        <header className="mb-12 md:mb-14 border-b border-[#E8E8E6] pb-8">
          <p className="font-body text-[11px] tracking-[0.12em] uppercase text-sage mb-3">
            {t('shop.detail.reviewsEyebrow')}
          </p>
          <h2
            id="product-reviews-heading"
            className="font-display text-3xl md:text-4xl font-semibold text-ink tracking-[-0.02em]"
          >
            {t('shop.detail.reviews')}
          </h2>
          <p className="mt-3 max-w-xl font-body text-sm leading-relaxed text-neutral-600">
            {t('shop.detail.reviewsLead')}
          </p>
        </header>

        <div className="flex flex-col gap-8 min-w-0">
          <div className="rounded-[24px] border border-[#E5E5E5] bg-[#FAFAF8] p-8 md:p-9 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
            <h3 className="font-display text-xl font-medium tracking-tight text-ink">
              {t('shop.detail.reviewsCommunityTitle')}
            </h3>
            <p className="mt-2 font-body text-sm leading-relaxed text-neutral-600">
              {t('shop.detail.reviewsCommunityLead')}
            </p>

            <div className="mt-8">
              <RatingDisplay
                average={averageRating}
                count={reviewCount}
                countLabel={
                  reviewCount === 1
                    ? t('shop.detail.reviewsCountOne', { count: reviewCount })
                    : t('shop.detail.reviewsCount', { count: reviewCount })
                }
              />
            </div>

            <span className="mt-6 inline-flex items-center gap-1.5 rounded-full border border-sage/25 bg-sage/8 px-3 py-1 font-body text-[10px] tracking-[0.06em] uppercase text-sage">
              <span className="h-1.5 w-1.5 rounded-full bg-sage" aria-hidden="true" />
              {t('shop.detail.reviewsVerifiedOnly')}
            </span>

            <div className="mt-8 flex flex-wrap gap-2">
              {DIMENSION_TAG_KEYS.map((key) => (
                <span
                  key={key}
                  className="rounded-full border border-[#E5E5E5] bg-white/80 px-3 py-1.5 font-body text-[11px] tracking-[0.04em] text-neutral-600"
                >
                  {t(`shop.detail.reviewDimensions.${key}`)}
                </span>
              ))}
            </div>

            {reviewCount === 0 && (
              <div className="mt-10 rounded-2xl border border-dashed border-[#DCDCD9] bg-white/50 px-6 py-8 text-center">
                <p className="font-display text-lg font-medium text-ink">
                  {t('shop.detail.noReviews')}
                </p>
                <p className="mt-2 font-body text-sm leading-relaxed text-neutral-500 max-w-sm mx-auto">
                  {t('shop.detail.noReviewsBody')}
                </p>
              </div>
            )}
          </div>

          {reviewCount > 0 && (
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {reviews.map((r) => (
                <li key={r.id}>
                  <ReviewCard
                    review={r}
                    ratingLabel={t('shop.detail.rating')}
                    authorLabel={t('shop.detail.reviewAuthorAnonymous')}
                  />
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}
