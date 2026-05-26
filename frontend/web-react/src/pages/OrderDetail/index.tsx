import { useState } from 'react';
import { Link, useParams, Navigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/authStore';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import PageWrapper from '@/components/layout/PageWrapper';
import SectionContainer from '@/components/layout/SectionContainer';
import PaperTextureBackground from '@/components/editorial/PaperTextureBackground';

import { ordersApi, type ReturnRequestData } from '@/services/orders';
import { impactFundApi } from '@/services/impactFund';
import TraceabilityTimeline from '@/components/editorial/TraceabilityTimeline';
import type { SupplyChainTimelineRecord } from '@/types';

const ORDER_STATUSES = ['pending', 'paid', 'shipped', 'completed'] as const;

const STATUS_COLORS: Record<string, string> = {
  pending: 'text-sepia-mid border-warm-gray/30 bg-warm-gray/5',
  paid: 'text-archive-brown border-archive-brown/30 bg-archive-brown/5',
  shipped: 'text-archive-brown border-archive-brown/30 bg-archive-brown/5',
  completed: 'text-sage border-sage/30 bg-sage/5',
  cancelled: 'text-rust border-rust/30 bg-rust/5',
};

export default function OrderDetail() {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation();
  const prefersReducedMotion = useReducedMotion();
  const queryClient = useQueryClient();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  // Return/exchange modal state — hooks must be called before any conditional return
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [returnType, setReturnType] = useState<'return' | 'exchange'>('return');
  const [selectedItems, setSelectedItems] = useState<Record<number, number>>({});
  const [returnReason, setReturnReason] = useState('');
  const [isSubmittingReturn, setIsSubmittingReturn] = useState(false);
  const [returnSuccess, setReturnSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isCancelling, setIsCancelling] = useState(false);

  const { data: order, isLoading, isError } = useQuery({
    queryKey: ['order', id],
    queryFn: () => ordersApi.getById(id!),
    enabled: !!id && isAuthenticated,
  });

  const { data: impactEntries = [] } = useQuery({
    queryKey: ['impact-fund', id],
    queryFn: () => impactFundApi.getOrderEntries(id!),
    enabled: !!id && isAuthenticated && (order?.status === 'paid' || order?.status === 'completed' || order?.status === 'shipped'),
    retry: false,
  });

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: `/orders/${id}` }} replace />;
  }

  const logisticsAsTimeline: SupplyChainTimelineRecord[] =
    order?.logistics_events?.map((ev, i) => ({
      id: i + 1,
      stage: ev.status,
      description: ev.description ?? ev.status,
      location: ev.location ?? '—',
      date: ev.at?.slice(0, 10) ?? '',
      verified: true,
      partnerName: order.carrier ?? 'Logistics',
    })) ?? [];

  // Current status index for progress bar
  const statusIndex = order
    ? ORDER_STATUSES.indexOf(order.status as typeof ORDER_STATUSES[number])
    : -1;

  const handleCancel = async () => {
    if (!order || isCancelling) return;
    setIsCancelling(true);
    try {
      setErrorMessage('');
      await ordersApi.cancel(String(order.id));
      queryClient.invalidateQueries({ queryKey: ['order', id] });
    } catch {
      setErrorMessage(t('orderDetail.cancelError', 'Failed to cancel order — please retry'));
    } finally {
      setIsCancelling(false);
    }
  };

  const toggleItemSelection = (itemId: number, _maxQty: number) => {
    setSelectedItems((prev) => {
      if (prev[itemId] !== undefined) {
        const next = { ...prev };
        delete next[itemId];
        return next;
      }
      return { ...prev, [itemId]: 1 };
    });
  };

  const updateItemQty = (itemId: number, qty: number, maxQty: number) => {
    const clamped = Math.max(1, Math.min(qty, maxQty));
    setSelectedItems((prev) => ({ ...prev, [itemId]: clamped }));
  };

  const handleSubmitReturn = async () => {
    if (!order || Object.keys(selectedItems).length === 0) return;
    setIsSubmittingReturn(true);
    try {
      const data: ReturnRequestData = {
        type: returnType,
        items: Object.entries(selectedItems).map(([itemId, qty]) => ({
          order_item_id: Number(itemId),
          quantity: qty,
        })),
        reason: returnReason || undefined,
      };
      await ordersApi.requestReturn(String(order.id), data);
      setReturnSuccess(true);
      queryClient.invalidateQueries({ queryKey: ['my-after-sales'] });
    } catch {
      setErrorMessage(t('orderDetail.returnError', 'Failed to submit return request — please retry'));
    }
    finally {
      setIsSubmittingReturn(false);
    }
  };

  const resetReturnModal = () => {
    setShowReturnModal(false);
    setSelectedItems({});
    setReturnReason('');
    setReturnType('return');
    setReturnSuccess(false);
  };

  if (isLoading || !order) {
    return (
      <PageWrapper>
        <PaperTextureBackground variant="paper" className="py-20">
          <SectionContainer>
            <p className="font-body text-sepia-mid">{t('common.loading', 'Loading...')}</p>
          </SectionContainer>
        </PaperTextureBackground>
      </PageWrapper>
    );
  }

  if (isError) {
    return (
      <PageWrapper>
        <PaperTextureBackground variant="paper" className="py-20">
          <SectionContainer>
            <p className="font-body text-rust">{t('orderDetail.error', 'Failed to load order')}</p>
            <Link to="/profile" className="font-body text-caption text-rust mt-4 inline-block">
              ← {t('profile.title')}
            </Link>
          </SectionContainer>
        </PaperTextureBackground>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper>
      {errorMessage && (
        <div className="max-w-[1400px] mx-auto px-6 md:px-10 w-full">
          <div className="flex items-center gap-3 bg-rust/10 border border-rust/20 px-4 py-3 mt-4 mb-2">
            <p className="font-body text-body-sm text-rust flex-1">{errorMessage}</p>
            <button
              onClick={() => setErrorMessage('')}
              className="text-rust hover:text-rust-light cursor-pointer"
              aria-label={t('common.dismiss', 'Dismiss')}
            >
              &times;
            </button>
          </div>
        </div>
      )}
      <PaperTextureBackground variant="paper" className="py-16 md:py-24 relative">

        <SectionContainer>
          {/* Back link */}
          <Link to="/profile" className="font-body text-overline tracking-[0.15em] uppercase text-sepia-mid hover:text-ink transition-colors mb-8 inline-block">
            ← {t('profile.title')}
          </Link>

          {/* Title + status */}
          <div className="flex items-end justify-between mb-8">
            <div>
              <span className="font-body text-overline tracking-[0.3em] uppercase text-sepia-mid block mb-2">
                {t('orderDetail.title', 'Order & Logistics')}
              </span>
              <h1 className="font-display text-2xl md:text-3xl font-bold text-ink leading-tight">
                {order.order_no}
              </h1>
            </div>
            <span className={`font-body text-overline tracking-[0.1em] uppercase px-4 py-1.5 border ${STATUS_COLORS[order.status] ?? 'text-sepia-mid border-warm-gray/30'}`}>
              {order.status}
            </span>
          </div>

          {/* Status progress bar */}
          {order.status !== 'cancelled' && statusIndex >= 0 && (
            <motion.div
              initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="mb-10 border border-warm-gray/20 p-6"
            >
              <div className="flex items-center justify-between">
                {ORDER_STATUSES.map((s, i) => (
                  <div key={s} className="flex items-center flex-1 last:flex-none">
                    <div className="flex flex-col items-center">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center font-mono text-[11px] transition-all ${
                          i <= statusIndex
                            ? 'bg-ink text-paper'
                            : 'border border-warm-gray/30 text-sepia-mid'
                        }`}
                      >
                        {i < statusIndex ? (
                          <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                            <path d="M3 8l3.5 3.5L13 5" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        ) : (
                          i + 1
                        )}
                      </div>
                      <span className={`font-body text-[10px] tracking-wider uppercase mt-1.5 ${i <= statusIndex ? 'text-ink' : 'text-sepia-mid'}`}>
                        {t(`orderDetail.status.${s}`, s)}
                      </span>
                    </div>
                    {i < ORDER_STATUSES.length - 1 && (
                      <div className={`flex-1 h-px mx-3 ${i < statusIndex ? 'bg-ink' : 'bg-warm-gray/25'}`} />
                    )}
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Main: items */}
            <div className="lg:col-span-7">
              <h2 className="font-body text-overline tracking-[0.2em] uppercase text-sepia-mid mb-4">
                {t('orderDetail.items', 'Items')}
              </h2>
              <div className="space-y-4">
                {order.items.map((item) => (
                  <div key={item.id} className="flex items-center gap-4 border-b border-warm-gray/10 pb-4 last:border-b-0">
                    <Link to={`/shop/${item.product_id}`} className="w-16 h-20 flex-shrink-0 overflow-hidden border border-warm-gray/15 bg-aged-stock hover:border-rust/30 transition-colors">
                      {item.product_image ? (
                        <img src={item.product_image} alt={item.product_name || ''} className="w-full h-full object-cover" loading="lazy" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <span className="font-mono text-[9px] text-warm-gray/40">VICOO</span>
                        </div>
                      )}
                    </Link>
                    <div className="flex-1 min-w-0">
                      <Link to={`/shop/${item.product_id}`} className="font-body text-body-sm text-ink hover:text-rust transition-colors block truncate">
                        {item.product_name || `Product #${item.product_id}`}
                      </Link>
                      <p className="font-mono text-[11px] text-sepia-mid mt-0.5">
                        ¥{Number(item.price).toFixed(2)} × {item.quantity}
                      </p>
                    </div>
                    <span className="font-mono text-sm text-ink font-medium flex-shrink-0">
                      ¥{(Number(item.price) * item.quantity).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Total */}
              <div className="flex items-center justify-between pt-5 mt-4 border-t border-warm-gray/20">
                <span className="font-body text-label text-sepia-mid tracking-wide uppercase">{t('orderDetail.total', 'Total')}</span>
                <span className="font-display text-xl font-bold text-ink">¥{Number(order.total_amount).toFixed(2)}</span>
              </div>

              {/* Actions */}
              <div className="mt-6 flex items-center gap-4">
                {order.status === 'pending' && (
                  <button
                    onClick={handleCancel}
                    disabled={isCancelling}
                    className="font-body text-label tracking-wide text-rust hover:text-rust-light transition-colors cursor-pointer border border-rust/30 px-6 py-2.5 hover:bg-rust/5 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isCancelling ? t('common.loading', 'Processing...') : t('profile.cancelOrder', 'Cancel Order')}
                  </button>
                )}
                {order.status === 'completed' && (
                  <button
                    onClick={() => setShowReturnModal(true)}
                    className="font-body text-label tracking-wide text-ink hover:text-rust transition-colors cursor-pointer border border-warm-gray/30 px-6 py-2.5 hover:border-rust/30"
                  >
                    {t('orderDetail.returnExchange.title', 'Request Return')}
                  </button>
                )}
              </div>
            </div>

            {/* Sidebar: shipping + payment */}
            <div className="lg:col-span-5">
              <div className="border border-warm-gray/20 p-6 space-y-5">
                {/* Shipping address */}
                {order.shipping_address && (
                  <div>
                    <p className="font-body text-overline tracking-[0.15em] uppercase text-sepia-mid mb-1.5">
                      {t('orderDetail.address', 'Shipping Address')}
                    </p>
                    <p className="font-body text-body-sm text-ink leading-relaxed">{order.shipping_address}</p>
                  </div>
                )}

                {/* Payment method */}
                {order.payment_method && (
                  <div>
                    <p className="font-body text-overline tracking-[0.15em] uppercase text-sepia-mid mb-1.5">
                      {t('checkout.paymentMethod', 'Payment Method')}
                    </p>
                    <p className="font-body text-body-sm text-ink capitalize">{order.payment_method}</p>
                  </div>
                )}

                {/* Tracking */}
                {(order.carrier || order.tracking_number) && (
                  <div>
                    <p className="font-body text-overline tracking-[0.15em] uppercase text-sepia-mid mb-1.5">
                      {t('orderDetail.logistics', 'Logistics')}
                    </p>
                    <p className="font-body text-body-sm text-ink">
                      {order.carrier && <span>{order.carrier} · </span>}
                      {order.tracking_number && <span className="font-mono">{order.tracking_number}</span>}
                    </p>
                  </div>
                )}

                {/* Date */}
                <div>
                  <p className="font-body text-overline tracking-[0.15em] uppercase text-sepia-mid mb-1.5">
                    {t('orderDetail.orderDate', 'Order Date')}
                  </p>
                  <p className="font-body text-body-sm text-ink">
                    {new Date(order.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </SectionContainer>
      </PaperTextureBackground>

      {/* Logistics timeline */}
      {logisticsAsTimeline.length > 0 && (
        <PaperTextureBackground variant="aged" className="py-16 md:py-24">
          <SectionContainer>
            <h2 className="font-display text-h3 font-bold text-ink mb-8">
              {t('orderDetail.logistics', '物流轨迹')}
            </h2>
            <TraceabilityTimeline records={logisticsAsTimeline} />
          </SectionContainer>
        </PaperTextureBackground>
      )}

      {/* Impact fund allocation */}
      {impactEntries.length > 0 && (
        <PaperTextureBackground variant="paper" className="py-16 md:py-24">
          <SectionContainer>
            <h2 className="font-display text-h3 font-bold text-ink mb-2">
              {t('orderDetail.impactFund', 'Impact Fund')}
            </h2>
            <p className="font-body text-body-sm text-ink-faded mb-8">
              {t('orderDetail.impactFundDesc', 'A portion of the impact product revenue from this order is allocated as follows')}
            </p>
            <div className="space-y-3">
              {impactEntries.map((entry) => (
                <div key={entry.id} className="flex items-center justify-between border-b border-warm-gray/10 pb-3 last:border-b-0">
                  <div>
                    <span className="font-body text-body-sm text-ink">
                      {entry.beneficiary_type === 'artist' && t('orderDetail.fund.artist', 'Young Artist')}
                      {entry.beneficiary_type === 'school' && t('orderDetail.fund.school', 'School')}
                      {entry.beneficiary_type === 'charity_pool' && t('orderDetail.fund.charity', 'Charity Pool')}
                    </span>
                    {entry.beneficiary_name && (
                      <span className="font-body text-caption text-ink-faded ml-2">({entry.beneficiary_name})</span>
                    )}
                  </div>
                  <span className="font-mono text-sm text-archive-brown">¥{Number(entry.allocated_amount).toFixed(2)}</span>
                </div>
              ))}
            </div>
          </SectionContainer>
        </PaperTextureBackground>
      )}

      {/* Return/Exchange Modal */}
      <AnimatePresence>
        {showReturnModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-ink/40 z-40"
              onClick={resetReturnModal}
            />
            <motion.div
              initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 20 }}
              className="fixed inset-x-4 top-[10%] md:inset-x-auto md:left-1/2 md:-translate-x-1/2 md:w-full md:max-w-lg bg-paper border border-warm-gray/25 z-50 p-6 max-h-[80vh] overflow-y-auto"
            >
              {returnSuccess ? (
                <div className="text-center py-8">
                  <div className="w-12 h-12 mx-auto mb-4 bg-sage/10 border border-sage/30 rounded-full flex items-center justify-center">
                    <svg className="w-6 h-6 text-sage" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" /></svg>
                  </div>
                  <h3 className="font-display text-lg font-bold text-ink mb-2">
                    {t('orderDetail.returnExchange.success', 'Request Submitted')}
                  </h3>
                  <p className="font-body text-body-sm text-ink-faded mb-6">
                    {t('orderDetail.returnExchange.successDesc', 'We will process your request within 1-3 business days')}
                  </p>
                  <button onClick={resetReturnModal} className="font-body text-label tracking-wide bg-ink text-paper px-8 py-3 hover:bg-rust transition-colors cursor-pointer">
                    {t('common.close', 'Close')}
                  </button>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="font-display text-lg font-bold text-ink">
                      {t('orderDetail.returnExchange.title', 'Request Return')}
                    </h3>
                    <button onClick={resetReturnModal} className="text-sepia-mid hover:text-ink transition-colors cursor-pointer">
                      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M6 18L18 6M6 6l12 12" strokeLinecap="round" /></svg>
                    </button>
                  </div>

                  {/* Return type selector */}
                  <div className="flex gap-3 mb-6">
                    {(['return', 'exchange'] as const).map((type) => (
                      <button
                        key={type}
                        onClick={() => setReturnType(type)}
                        className={`flex-1 py-2.5 border text-center font-body text-label tracking-wide transition-all cursor-pointer ${
                          returnType === type
                            ? 'border-rust/50 bg-rust/[0.03] text-ink'
                            : 'border-warm-gray/25 text-sepia-mid hover:border-warm-gray/40'
                        }`}
                      >
                        {t(`orderDetail.returnExchange.${type}`, type === 'return' ? 'Return' : 'Exchange')}
                      </button>
                    ))}
                  </div>

                  {/* Item selection */}
                  <p className="font-body text-caption text-sepia-mid tracking-wider uppercase mb-3">
                    {t('orderDetail.returnExchange.selectItems', 'Select Items')}
                  </p>
                  <div className="space-y-3 mb-6">
                    {order.items.map((item) => (
                      <div key={item.id} className="flex items-center gap-3 border border-warm-gray/15 p-3">
                        <input
                          type="checkbox"
                          checked={selectedItems[item.id] !== undefined}
                          onChange={() => toggleItemSelection(item.id, item.quantity)}
                          className="accent-rust cursor-pointer"
                        />
                        <div className="w-10 h-12 flex-shrink-0 overflow-hidden border border-warm-gray/10 bg-aged-stock">
                          {item.product_image && <img src={item.product_image} alt={item.product_name || ''} className="w-full h-full object-cover" loading="lazy" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-body text-body-sm text-ink truncate">{item.product_name || `#${item.product_id}`}</p>
                          <p className="font-mono text-[11px] text-sepia-mid">¥{Number(item.price).toFixed(2)} × {item.quantity}</p>
                        </div>
                        {selectedItems[item.id] !== undefined && (
                          <div className="flex items-center gap-1">
                            <button aria-label="Decrease quantity" onClick={() => updateItemQty(item.id, selectedItems[item.id] - 1, item.quantity)} className="w-6 h-6 border border-warm-gray/25 flex items-center justify-center text-sepia-mid hover:text-ink cursor-pointer">−</button>
                            <span className="font-mono text-xs w-6 text-center">{selectedItems[item.id]}</span>
                            <button aria-label="Increase quantity" onClick={() => updateItemQty(item.id, selectedItems[item.id] + 1, item.quantity)} className="w-6 h-6 border border-warm-gray/25 flex items-center justify-center text-sepia-mid hover:text-ink cursor-pointer">+</button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Reason */}
                  <div className="mb-6">
                    <label className="block font-body text-caption text-sepia-mid tracking-wider uppercase mb-1.5">
                      {t('orderDetail.returnExchange.reason', 'Reason')}
                    </label>
                    <textarea
                      value={returnReason}
                      onChange={(e) => setReturnReason(e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 border border-warm-gray/30 bg-transparent font-body text-body-sm text-ink focus:outline-none focus:border-rust/50 resize-none"
                      placeholder={t('orderDetail.returnExchange.reasonPlaceholder', 'Please describe the reason for return...')}
                    />
                  </div>

                  {/* Submit */}
                  <button
                    onClick={handleSubmitReturn}
                    disabled={Object.keys(selectedItems).length === 0 || isSubmittingReturn}
                    className="w-full font-body text-label tracking-[0.1em] uppercase bg-ink text-paper py-3 hover:bg-rust transition-colors cursor-pointer disabled:opacity-40"
                  >
                    {isSubmittingReturn ? t('checkout.processing', 'Processing...') : t('orderDetail.returnExchange.submit', 'Submit Request')}
                  </button>
                </>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </PageWrapper>
  );
}
