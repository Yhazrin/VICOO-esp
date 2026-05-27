import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { reviewsApi, type ProductReview } from '@/services/reviewsApi';
import { useAuthStore } from '@/stores/authStore';

const FEEDBACK_CHIP_IDS = [
  'trueToSize',
  'comfortableFabric',
  'thoughtfulPackaging',
  'impactVisible',
] as const;

type FeedbackChipId = (typeof FEEDBACK_CHIP_IDS)[number];

const DIMENSION_TAG_KEYS = ['fitComfort', 'packaging', 'traceableImpact'] as const;

const inputClass =
  'w-full rounded-2xl border border-[#E5E5E5] bg-white/90 px-4 py-3 font-body text-sm text-ink placeholder:text-neutral-400 outline-none transition-all duration-200 hover:border-neutral-300 focus:border-neutral-500 focus:shadow-[0_0_0_3px_rgba(0,0,0,0.05)]';

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

function StarRatingInput({
  value,
  onChange,
  label,
}: {
  value: number;
  onChange: (n: number) => void;
  label: string;
}) {
  const [hover, setHover] = useState<number | null>(null);
  const display = hover ?? value;

  return (
    <div role="group" aria-label={label}>
      <p className="mb-2 font-body text-[11px] tracking-[0.08em] uppercase text-neutral-500">
        {label}
      </p>
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            onMouseEnter={() => setHover(star)}
            onMouseLeave={() => setHover(null)}
            className={`rounded-md p-1 transition-colors duration-150 cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-800 ${
              star <= display ? 'text-neutral-900' : 'text-neutral-300 hover:text-neutral-500'
            }`}
            aria-label={`${star} ${star === 1 ? 'star' : 'stars'}`}
            aria-pressed={star === value}
          >
            <StarIcon filled={star <= display} />
          </button>
        ))}
        <span className="ml-2 font-mono text-xs tabular-nums text-neutral-500">
          {value}.0
        </span>
      </div>
    </div>
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

function ReviewCard({ review, ratingLabel }: { review: ProductReview; ratingLabel: string }) {
  return (
    <article className="rounded-2xl border border-[#E8E8E6] bg-white/70 px-5 py-5 shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition-shadow duration-200 hover:shadow-[0_8px_24px_-12px_rgba(0,0,0,0.08)]">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-0.5 text-neutral-800" aria-hidden="true">
          {[1, 2, 3, 4, 5].map((i) => (
            <StarIcon key={i} filled={i <= review.rating} />
          ))}
        </div>
        <time className="font-mono text-[10px] tracking-[0.06em] text-neutral-400">
          {review.created_at?.slice(0, 10)}
        </time>
      </div>
      <p className="sr-only">
        {ratingLabel} {review.rating}/5
      </p>
      {review.title && (
        <h3 className="mt-3 font-display text-lg font-medium leading-snug tracking-tight text-ink">
          {review.title}
        </h3>
      )}
      {review.body && (
        <p className="mt-2 font-body text-sm leading-relaxed text-neutral-600 whitespace-pre-line">
          {review.body}
        </p>
      )}
    </article>
  );
}

export default function ProductReviewsSection({ productId }: { productId: number }) {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const { isAuthenticated } = useAuthStore();
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewTitle, setReviewTitle] = useState('');
  const [reviewBody, setReviewBody] = useState('');
  const [selectedChips, setSelectedChips] = useState<FeedbackChipId[]>([]);

  const { data: reviewsResult } = useQuery({
    queryKey: ['reviews', productId],
    queryFn: () => reviewsApi.listByProduct(productId),
    enabled: productId > 0,
  });

  const reviews = reviewsResult?.data ?? [];
  const reviewCount = reviews.length;
  const averageRating = useMemo(() => {
    if (reviewCount === 0) return 0;
    return reviews.reduce((sum, r) => sum + r.rating, 0) / reviewCount;
  }, [reviews, reviewCount]);

  const reviewMutation = useMutation({
    mutationFn: () => {
      const chipLine =
        selectedChips.length > 0
          ? selectedChips.map((id) => t(`shop.detail.reviewChips.${id}`)).join(' · ')
          : '';
      const bodyParts = [reviewBody.trim(), chipLine].filter(Boolean);
      return reviewsApi.create({
        product_id: productId,
        rating: reviewRating,
        title: reviewTitle.trim() || undefined,
        body: bodyParts.length > 0 ? bodyParts.join('\n\n') : undefined,
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['reviews', productId] });
      setReviewTitle('');
      setReviewBody('');
      setSelectedChips([]);
      setReviewRating(5);
    },
  });

  const toggleChip = (id: FeedbackChipId) => {
    setSelectedChips((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id],
    );
  };

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

        <div className="grid grid-cols-1 gap-10 lg:grid-cols-2 lg:gap-14 xl:gap-16">
          {/* Left: summary + list */}
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
              <ul className="space-y-4">
                {reviews.map((r) => (
                  <li key={r.id}>
                    <ReviewCard review={r} ratingLabel={t('shop.detail.rating')} />
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Right: composer */}
          <div className="min-w-0 lg:sticky lg:top-24 lg:self-start">
            {isAuthenticated ? (
              <form
                className="rounded-[24px] border border-[#E5E5E5] bg-[#FAFAF8]/95 p-7 md:p-8 shadow-[0_4px_24px_-8px_rgba(0,0,0,0.06)] backdrop-blur-sm"
                onSubmit={(e) => {
                  e.preventDefault();
                  reviewMutation.mutate();
                }}
              >
                <h3 className="font-display text-xl font-medium tracking-tight text-ink">
                  {t('shop.detail.writeReview')}
                </h3>
                <p className="mt-2 font-body text-sm text-neutral-600 leading-relaxed">
                  {t('shop.detail.writeReviewLead')}
                </p>

                <div className="mt-8">
                  <StarRatingInput
                    value={reviewRating}
                    onChange={setReviewRating}
                    label={t('shop.detail.rating')}
                  />
                </div>

                <div className="mt-6 space-y-4">
                  <div>
                    <label
                      htmlFor="review-title"
                      className="mb-2 block font-body text-[11px] tracking-[0.08em] uppercase text-neutral-500"
                    >
                      {t('shop.detail.reviewTitleLabel')}
                    </label>
                    <input
                      id="review-title"
                      className={inputClass}
                      placeholder={t('shop.detail.reviewTitlePlaceholder')}
                      value={reviewTitle}
                      onChange={(e) => setReviewTitle(e.target.value)}
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="review-body"
                      className="mb-2 block font-body text-[11px] tracking-[0.08em] uppercase text-neutral-500"
                    >
                      {t('shop.detail.reviewBodyLabel')}
                    </label>
                    <textarea
                      id="review-body"
                      className={`${inputClass} min-h-[128px] resize-y`}
                      placeholder={t('shop.detail.reviewBodyPlaceholder')}
                      value={reviewBody}
                      onChange={(e) => setReviewBody(e.target.value)}
                    />
                  </div>
                </div>

                <div className="mt-6">
                  <p className="mb-3 font-body text-[11px] tracking-[0.08em] uppercase text-neutral-500">
                    {t('shop.detail.reviewChipsLabel')}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {FEEDBACK_CHIP_IDS.map((id) => {
                      const active = selectedChips.includes(id);
                      return (
                        <button
                          key={id}
                          type="button"
                          onClick={() => toggleChip(id)}
                          className={`rounded-full border px-3.5 py-2 font-body text-xs transition-all duration-200 cursor-pointer ${
                            active
                              ? 'border-neutral-800 bg-neutral-900 text-white shadow-sm'
                              : 'border-[#E5E5E5] bg-white text-neutral-600 hover:border-neutral-400 hover:shadow-[0_2px_8px_-4px_rgba(0,0,0,0.08)]'
                          }`}
                          aria-pressed={active}
                        >
                          {t(`shop.detail.reviewChips.${id}`)}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {reviewMutation.isError && (
                  <p className="mt-5 text-sm text-rust font-body" role="alert">
                    {t('shop.detail.reviewError')}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={reviewMutation.isPending}
                  className="mt-8 w-full rounded-full bg-neutral-900 px-8 py-3.5 font-body text-sm font-medium tracking-wide text-white transition-all duration-200 hover:bg-neutral-800 hover:-translate-y-px hover:shadow-[0_8px_20px_-8px_rgba(0,0,0,0.35)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900 disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-none cursor-pointer"
                >
                  {reviewMutation.isPending
                    ? t('common.loading')
                    : t('shop.detail.submitReview')}
                </button>
              </form>
            ) : (
              <div className="rounded-[24px] border border-[#E5E5E5] bg-[#FAFAF8] p-8 md:p-9 text-center">
                <h3 className="font-display text-xl font-medium text-ink">
                  {t('shop.detail.writeReview')}
                </h3>
                <p className="mt-2 font-body text-sm text-neutral-600 leading-relaxed">
                  {t('shop.detail.reviewsSignInLead')}
                </p>
                <Link
                  to="/login"
                  className="mt-6 inline-flex rounded-full bg-neutral-900 px-8 py-3 font-body text-sm font-medium text-white transition-all duration-200 hover:bg-neutral-800 hover:-translate-y-px hover:shadow-[0_8px_20px_-8px_rgba(0,0,0,0.35)]"
                >
                  {t('shop.detail.reviewsSignInCta')}
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
