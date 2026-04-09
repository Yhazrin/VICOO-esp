import { Link, useParams, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { motion, useReducedMotion } from 'framer-motion';
import PageWrapper from '@/components/layout/PageWrapper';
import SectionContainer from '@/components/layout/SectionContainer';
import PaperTextureBackground from '@/components/editorial/PaperTextureBackground';
import GrainOverlay from '@/components/editorial/GrainOverlay';
import { ordersApi } from '@/services/orders';
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
  const navigate = useNavigate();
  const prefersReducedMotion = useReducedMotion();
  const queryClient = useQueryClient();

  const { data: order, isLoading, isError } = useQuery({
    queryKey: ['order', id],
    queryFn: () => ordersApi.getById(id!),
    enabled: !!id,
  });

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
    if (!order) return;
    try {
      await ordersApi.cancel(String(order.id));
      queryClient.invalidateQueries({ queryKey: ['order', id] });
    } catch { /* silent */ }
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
            <p className="font-body text-rust">{t('orderDetail.error', '无法加载订单')}</p>
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
      <PaperTextureBackground variant="paper" className="py-16 md:py-24 relative">
        <GrainOverlay />
        <SectionContainer>
          {/* Back link */}
          <Link to="/profile" className="font-body text-overline tracking-[0.15em] uppercase text-sepia-mid hover:text-ink transition-colors mb-8 inline-block">
            ← {t('profile.title')}
          </Link>

          {/* Title + status */}
          <div className="flex items-end justify-between mb-8">
            <div>
              <span className="font-body text-overline tracking-[0.3em] uppercase text-sepia-mid block mb-2">
                {t('orderDetail.title', '订单与物流')}
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
                {t('orderDetail.items', '明细')}
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
                <span className="font-body text-label text-sepia-mid tracking-wide uppercase">{t('orderDetail.total', '合计')}</span>
                <span className="font-display text-xl font-bold text-ink">¥{Number(order.total_amount).toFixed(2)}</span>
              </div>

              {/* Actions */}
              {order.status === 'pending' && (
                <div className="mt-6">
                  <button
                    onClick={handleCancel}
                    className="font-body text-label tracking-wide text-rust hover:text-rust-light transition-colors cursor-pointer border border-rust/30 px-6 py-2.5 hover:bg-rust/5"
                  >
                    {t('profile.cancelOrder', '取消订单')}
                  </button>
                </div>
              )}
            </div>

            {/* Sidebar: shipping + payment */}
            <div className="lg:col-span-5">
              <div className="border border-warm-gray/20 p-6 space-y-5">
                {/* Shipping address */}
                {order.shipping_address && (
                  <div>
                    <p className="font-body text-overline tracking-[0.15em] uppercase text-sepia-mid mb-1.5">
                      {t('orderDetail.address', '收货地址')}
                    </p>
                    <p className="font-body text-body-sm text-ink leading-relaxed">{order.shipping_address}</p>
                  </div>
                )}

                {/* Payment method */}
                {order.payment_method && (
                  <div>
                    <p className="font-body text-overline tracking-[0.15em] uppercase text-sepia-mid mb-1.5">
                      {t('checkout.paymentMethod', '支付方式')}
                    </p>
                    <p className="font-body text-body-sm text-ink capitalize">{order.payment_method}</p>
                  </div>
                )}

                {/* Tracking */}
                {(order.carrier || order.tracking_number) && (
                  <div>
                    <p className="font-body text-overline tracking-[0.15em] uppercase text-sepia-mid mb-1.5">
                      {t('orderDetail.logistics', '物流轨迹')}
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
                    {t('orderDetail.orderDate', '下单时间')}
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
    </PageWrapper>
  );
}
