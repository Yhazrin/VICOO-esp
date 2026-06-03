import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import type { OrderDetail } from '@/services/orders';
import { reviewsApi } from '@/services/reviewsApi';
import { serializeReviewBody, FEEDBACK_CHIP_IDS, type FeedbackChipId } from '@/utils/reviewChips';

export interface OrderReviewModalProps {
  order: OrderDetail | null;
  initialProductId?: number | null;
  onClose: () => void;
}

export default function OrderReviewModal({ order, initialProductId, onClose }: OrderReviewModalProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const [productId, setProductId] = useState<number | null>(null);
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [chips, setChips] = useState<FeedbackChipId[]>([]);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!order) return;
    const defaultId =
      initialProductId ??
      (order.items[0] ? Number(order.items[0].product_id) : null);
    setProductId(defaultId);
    setRating(5);
    setTitle('');
    setBody('');
    setChips([]);
    setSuccess(false);
  }, [order, initialProductId]);

  const reviewMutation = useMutation({
    mutationFn: () =>
      reviewsApi.create({
        product_id: productId!,
        order_id: order!.id,
        rating,
        title: title.trim() || undefined,
        body: serializeReviewBody(body, chips),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviews'] });
      setSuccess(true);
      setTimeout(() => {
        onClose();
      }, 1500);
    },
  });

  const toggleChip = (id: FeedbackChipId) => {
    setChips((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id],
    );
  };

  if (!order) return null;

  return (
    <AnimatePresence>
      {order && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={onClose}
        >
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2 }}
            className="relative bg-paper rounded-2xl shadow-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-paper/95 backdrop-blur-sm border-b border-warm-gray/20 px-6 py-4 flex items-center justify-between z-10">
              <h3 className="font-display text-lg font-semibold text-ink">
                {t('shop.detail.writeReview', '写评价')}
              </h3>
              <button
                onClick={onClose}
                className="p-1 hover:bg-warm-gray/20 rounded-full transition-colors cursor-pointer"
                aria-label={t('common.close', '关闭')}
              >
                <svg className="w-5 h-5 text-sepia-mid" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {success ? (
              <div className="p-10 text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-sage/10 flex items-center justify-center">
                  <svg className="w-8 h-8 text-sage" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p className="font-display text-lg font-medium text-ink">
                  {t('shop.detail.reviewSuccess', '感谢您的评价！')}
                </p>
                <p className="mt-2 font-body text-sm text-ink-faded">
                  {t('orderDetail.reviewSuccessHint', '您的评价将显示在商品页面的社区反馈中')}
                </p>
              </div>
            ) : (
              <div className="p-6 space-y-5">
                {order.items.length > 1 && (
                  <div>
                    <p className="font-body text-[11px] tracking-[0.08em] uppercase text-neutral-500 mb-2">
                      {t('profile.review.selectProduct', '选择要评价的商品')}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {order.items.map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => setProductId(Number(item.product_id))}
                          className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-all cursor-pointer ${
                            productId === Number(item.product_id)
                              ? 'border-ink bg-ink/5'
                              : 'border-warm-gray/30 hover:border-warm-gray/50'
                          }`}
                        >
                          {item.product_image && (
                            <img src={item.product_image} alt="" className="w-6 h-6 rounded object-cover" />
                          )}
                          <span className="font-body text-xs text-ink truncate max-w-[120px]">
                            {item.product_name || `#${item.product_id}`}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <p className="font-body text-[11px] tracking-[0.08em] uppercase text-neutral-500 mb-2">
                    {t('shop.detail.rating', '评分')}
                  </p>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        className={`p-1 transition-colors cursor-pointer ${
                          star <= rating ? 'text-neutral-900' : 'text-neutral-300'
                        }`}
                      >
                        <svg viewBox="0 0 20 20" className="h-6 w-6" aria-hidden="true">
                          <path
                            fill={star <= rating ? 'currentColor' : 'none'}
                            stroke="currentColor"
                            strokeWidth="1.2"
                            d="M10 1.5l2.35 4.76 5.25.76-3.8 3.7.9 5.23L10 13.9l-4.7 2.05.9-5.23-3.8-3.7 5.25-.76L10 1.5z"
                          />
                        </svg>
                      </button>
                    ))}
                    <span className="ml-2 font-mono text-sm text-neutral-500">{rating}.0</span>
                  </div>
                </div>

                <div>
                  <label className="block font-body text-[11px] tracking-[0.08em] uppercase text-neutral-500 mb-2">
                    {t('shop.detail.reviewTitleLabel', '标题')}
                  </label>
                  <input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder={t('shop.detail.reviewTitlePlaceholder', '一句话概括')}
                    className="w-full rounded-xl border border-[#E5E5E5] bg-white/90 px-4 py-3 font-body text-sm text-ink placeholder:text-neutral-400 outline-none focus:border-neutral-500 transition-colors"
                  />
                </div>

                <div>
                  <label className="block font-body text-[11px] tracking-[0.08em] uppercase text-neutral-500 mb-2">
                    {t('shop.detail.reviewBodyLabel', '详细评价')}
                  </label>
                  <textarea
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    placeholder={t('shop.detail.reviewBodyPlaceholder', '分享您的使用体验...')}
                    className="w-full rounded-xl border border-[#E5E5E5] bg-white/90 px-4 py-3 font-body text-sm text-ink placeholder:text-neutral-400 outline-none focus:border-neutral-500 transition-colors min-h-[100px] resize-y"
                  />
                </div>

                <div>
                  <p className="font-body text-[11px] tracking-[0.08em] uppercase text-neutral-500 mb-2">
                    {t('shop.detail.reviewChipsLabel', '标签')}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {FEEDBACK_CHIP_IDS.map((id) => {
                      const active = chips.includes(id);
                      return (
                        <button
                          key={id}
                          type="button"
                          onClick={() => toggleChip(id)}
                          className={`rounded-full border px-3 py-1.5 font-body text-xs transition-all cursor-pointer ${
                            active
                              ? 'border-neutral-800 bg-neutral-900 text-white'
                              : 'border-[#E5E5E5] bg-white text-neutral-600 hover:border-neutral-400'
                          }`}
                        >
                          {t(`shop.detail.reviewChips.${id}`)}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {reviewMutation.isError && (
                  <p className="text-sm text-rust font-body" role="alert">
                    {(reviewMutation.error as { response?: { status?: number } })?.response?.status === 409
                      ? t('shop.detail.reviewError', '您已评价过该商品')
                      : t('shop.detail.reviewSubmitFailed', '提交失败，请重试')}
                  </p>
                )}

                <button
                  type="button"
                  onClick={() => reviewMutation.mutate()}
                  disabled={reviewMutation.isPending || !productId}
                  className="w-full rounded-full bg-neutral-900 px-6 py-3 font-body text-sm font-medium text-white transition-all hover:bg-neutral-800 disabled:opacity-50 cursor-pointer"
                >
                  {reviewMutation.isPending
                    ? t('common.loading', '提交中...')
                    : t('shop.detail.submitReview', '提交评价')}
                </button>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
