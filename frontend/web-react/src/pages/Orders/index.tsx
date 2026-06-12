import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, useReducedMotion } from 'framer-motion';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import PageWrapper from '@/components/layout/PageWrapper';
import SectionContainer from '@/components/layout/SectionContainer';
import PaperTextureBackground from '@/components/editorial/PaperTextureBackground';
import { MagazineDivider } from '@/components/editorial/MagazineDivider';
import { EditorialCard } from '@/components/editorial/EditorialCard';
import { useAuthStore } from '@/stores/authStore';
import { ordersApi, type OrderDetail, resolveOrderItemName } from '@/services/orders';

const ORDER_STATUSES = ['', 'pending', 'paid', 'shipped', 'completed', 'cancelled'] as const;

const STATUS_COLORS: Record<string, string> = {
  pending: 'text-sepia-mid border-warm-gray/30 bg-warm-gray/5',
  paid: 'text-archive-brown border-archive-brown/30 bg-archive-brown/5',
  shipped: 'text-archive-brown border-archive-brown/30 bg-archive-brown/5',
  delivered: 'text-archive-brown border-archive-brown/30 bg-archive-brown/5',
  completed: 'text-sage border-sage/30 bg-sage/5',
  cancelled: 'text-rust border-rust/30 bg-rust/5',
};

const STATUS_LABEL_KEY: Record<string, string> = {
  pending: 'orderDetail.status.pending',
  paid: 'orderDetail.status.paid',
  shipped: 'orderDetail.status.shipped',
  delivered: 'orderDetail.status.delivered',
  completed: 'orderDetail.status.completed',
  cancelled: 'orderDetail.status.cancelled',
};

export default function Orders() {
  const { t, i18n } = useTranslation();
  const prefersReducedMotion = useReducedMotion();
  const queryClient = useQueryClient();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const [_searchParams] = useSearchParams();

  const [orderStatus, setOrderStatus] = useState('');
  const [orderKeyword, setOrderKeyword] = useState('');
  const [cancellingOrderId, setCancellingOrderId] = useState<number | null>(null);

  const { data: orders = [], isLoading, isError } = useQuery({
    queryKey: ['my-orders', orderStatus, orderKeyword],
    queryFn: () =>
      ordersApi.getMyOrders({
        status: orderStatus || undefined,
        keyword: orderKeyword || undefined,
      }),
    enabled: isAuthenticated,
  });

  const handleCancel = async (orderId: number) => {
    if (!confirm('Cancel this order?')) return;
    setCancellingOrderId(orderId);
    try {
      await ordersApi.cancel(String(orderId));
      queryClient.invalidateQueries({ queryKey: ['my-orders'] });
    } finally {
      setCancellingOrderId(null);
    }
  };

  return (
    <PageWrapper>
      <PaperTextureBackground variant="paper" className="py-12 md:py-20">
        <SectionContainer>
          <EditorialCard variant="text" className="mb-10">
            <span className="font-body text-overline tracking-[0.25em] uppercase text-sepia-mid block mb-3">
              VICOO · Impact
            </span>
            <h1 className="font-display text-h2 md:text-h1 font-bold text-ink">
              {t('profile.tabs.orders', 'My Orders')}
            </h1>
          </EditorialCard>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-3 mb-8">
            {ORDER_STATUSES.map((s) => (
              <button
                key={s}
                onClick={() => setOrderStatus(s)}
                className={`font-body text-[11px] tracking-[0.1em] uppercase px-3 py-1.5 border transition-all cursor-pointer ${
                  orderStatus === s
                    ? 'border-rust/50 bg-rust/10 text-ink'
                    : 'border-warm-gray/25 text-sepia-mid hover:border-warm-gray/40'
                }`}
              >
                {s
                  ? t(
                      `profile.orders.filter${s.charAt(0).toUpperCase() + s.slice(1)}`,
                      s,
                    )
                  : t('profile.orders.filterAll', 'All')}
              </button>
            ))}
            <input
              type="text"
              value={orderKeyword}
              onChange={(e) => setOrderKeyword(e.target.value)}
              placeholder={t('profile.orders.searchPlaceholder', 'Search order number...')}
              className="ml-auto px-3 py-1.5 border border-warm-gray/25 bg-paper font-body text-caption text-ink focus:outline-none focus:border-rust/50 transition-colors w-48"
            />
          </div>

          {/* List */}
          {isLoading ? (
            <p className="font-body text-body-sm text-ink-faded">{t('common.loading', 'Loading...')}</p>
          ) : isError ? (
            <p className="font-body text-body-sm text-rust">{t('profile.ordersError', 'Failed to load orders.')}</p>
          ) : orders.length === 0 ? (
            <div className="text-center py-16">
              <p className="font-body text-body-sm text-ink-faded mb-6">{t('profile.noOrders', 'No orders yet.')}</p>
              <Link
                to="/shop"
                className="inline-block font-body text-overline tracking-[0.15em] uppercase text-rust hover:text-ink transition-colors"
              >
                {t('profile.browseShop', 'Browse Shop')} &rarr;
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {orders.map((order: OrderDetail, index: number) => (
                <motion.div
                  key={order.id}
                  initial={prefersReducedMotion ? false : { opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, delay: index * 0.05 }}
                  className="border border-warm-gray/25 bg-paper p-5 hover:border-rust/20 transition-colors"
                >
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <p className="font-mono text-xs text-sepia-mid">{order.order_no}</p>
                      <p className="font-body text-caption text-ink-faded mt-0.5">
                        {new Date(order.created_at).toLocaleDateString(
                          i18n.language,
                          { year: 'numeric', month: 'short', day: 'numeric' },
                        )}
                      </p>
                    </div>
                    <span
                      className={`font-body text-overline tracking-[0.1em] uppercase px-2.5 py-1 border ${STATUS_COLORS[order.status] ?? 'text-sepia-mid border-warm-gray/30 bg-warm-gray/5'}`}
                    >
                      {t(STATUS_LABEL_KEY[order.status] ?? order.status)}
                    </span>
                  </div>

                  {/* Items */}
                  <div className="space-y-2 mb-4">
                    {order.items?.slice(0, 3).map((item) => (
                      <div key={item.id} className="flex items-center gap-3">
                        <div className="w-10 h-12 flex-shrink-0 overflow-hidden border border-warm-gray/15 bg-aged-stock">
                          {item.product_image ? (
                            <img
                              src={item.product_image}
                              alt={item.product_name ?? ''}
                              className="w-full h-full object-cover"
                              loading="lazy"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <span className="font-mono text-[8px] text-warm-gray/40">VICOO</span>
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-body text-caption text-ink truncate">
                            {resolveOrderItemName(item, i18n.language)}
                          </p>
                          <p className="font-mono text-[10px] text-sepia-mid">×{item.quantity}</p>
                        </div>
                        <span className="font-mono text-sm text-ink flex-shrink-0">
                          ¥{(Number(item.price) * item.quantity).toFixed(2)}
                        </span>
                      </div>
                    ))}
                    {(order.items?.length ?? 0) > 3 && (
                      <p className="font-body text-caption text-sepia-mid text-right">
                        +{order.items!.length - 3} more
                      </p>
                    )}
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between pt-3 border-t border-warm-gray/15">
                    <div className="flex items-center gap-2">
                      <span className="font-body text-caption text-sepia-mid">{t('profile.total', 'Total')}</span>
                      <span className="font-display text-base font-bold text-ink">
                        ¥{Number(order.total_amount).toFixed(2)}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      {order.status === 'pending' && (
                        <button
                          disabled={cancellingOrderId === order.id}
                          onClick={() => handleCancel(order.id)}
                          className="font-body text-[11px] tracking-[0.1em] uppercase px-3 py-1.5 border border-rust/30 text-rust hover:bg-rust/5 transition-colors cursor-pointer disabled:opacity-50"
                        >
                          {cancellingOrderId === order.id
                            ? t('common.loading', '...')
                            : t('profile.cancelOrder', 'Cancel')}
                        </button>
                      )}
                      <Link
                        to={`/orders/${order.id}`}
                        className="font-body text-[11px] tracking-[0.1em] uppercase px-3 py-1.5 bg-ink text-paper hover:bg-rust transition-colors"
                      >
                        {t('profile.viewDetail', 'View')}
                      </Link>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </SectionContainer>
      </PaperTextureBackground>
      <SectionContainer>
        <MagazineDivider variant="decorative" />
      </SectionContainer>
    </PageWrapper>
  );
}
