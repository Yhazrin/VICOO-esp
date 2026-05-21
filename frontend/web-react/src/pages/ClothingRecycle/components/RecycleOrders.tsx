import { useState, useMemo, useRef, forwardRef, useImperativeHandle } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import SectionContainer from '@/components/layout/SectionContainer';
import { clothingIntakesApi } from '@/services/clothingIntakes';
import { useAuthStore } from '@/stores/authStore';
import {
  type OrderStatus, ORDER_STATUS_KEYS, STATUS_BADGE, TAB_KEYS,
  mapIntakeToOrder,
} from './types';

export interface RecycleOrdersHandle {
  scrollTo: () => void;
}

const RecycleOrders = forwardRef<RecycleOrdersHandle>(function RecycleOrders(_props, ref) {
  const { t } = useTranslation();
  const prefersReducedMotion = useReducedMotion();
  const { isAuthenticated } = useAuthStore();
  const sectionRef = useRef<HTMLDivElement>(null);

  useImperativeHandle(ref, () => ({
    scrollTo: () => sectionRef.current?.scrollIntoView({ behavior: 'smooth' }),
  }));

  const [activeTab, setActiveTab] = useState<OrderStatus>('all');

  const { data: intakeOrders = [], isLoading } = useQuery({
    queryKey: ['my-clothing-intakes'],
    queryFn: () => clothingIntakesApi.mine(),
    enabled: isAuthenticated,
  });

  const orderStatusLabels = useMemo(() => ({
    listed: t(ORDER_STATUS_KEYS.listed, 'Listed'),
    pending: t(ORDER_STATUS_KEYS.pending, 'Under Review'),
    approved: t(ORDER_STATUS_KEYS.approved, 'Approved · Processing'),
    rejected: t(ORDER_STATUS_KEYS.rejected, 'Rejected'),
  }), [t]);

  const tabs = useMemo(
    () => (Object.keys(TAB_KEYS) as OrderStatus[]).map((k) => ({ key: k, label: t(TAB_KEYS[k], k) })),
    [t],
  );

  const userOrders = useMemo(
    () => intakeOrders.map((intake) => mapIntakeToOrder(intake, orderStatusLabels)),
    [intakeOrders, orderStatusLabels],
  );

  const filteredOrders = useMemo(
    () => activeTab === 'all' ? userOrders : userOrders.filter((o) => o.status === activeTab),
    [userOrders, activeTab],
  );

  const fadeUp = (delay = 0) =>
    prefersReducedMotion ? {} : {
      initial: { opacity: 0, y: 24 } as const,
      whileInView: { opacity: 1, y: 0 } as const,
      viewport: { once: true, margin: '-60px' } as const,
      transition: { duration: 0.6, ease: [0, 0, 0.2, 1], delay },
    };

  return (
    <div ref={sectionRef}>
      <SectionContainer decorativeDivider>
        <h2 className="font-display text-h2 text-ink mb-2">
          {t('clothingRecycle.ordersTitle', 'My Recycling Orders')}
        </h2>
        <p className="font-body text-body text-ink-faded mb-10">
          {t('clothingRecycle.ordersSubtitle', 'Track recycling progress, review outcomes, and linked resale items here.')}
        </p>

        {!isAuthenticated ? (
          <motion.div {...fadeUp()} className="rounded-xl border border-rust/20 bg-aged-stock/30 p-8 text-center max-w-lg mx-auto">
            <p className="font-body text-body-sm text-ink mb-4">
              {t('clothingRecycle.loginToTrack', 'Log in to view recycling progress synced with your profile.')}
            </p>
            <Link to="/login" className="font-body text-caption text-rust tracking-[0.1em] uppercase hover:underline">
              {t('clothingRecycle.goToLogin', 'Go to Login')} &rarr;
            </Link>
          </motion.div>
        ) : (
          <>
            {/* Capsule tab bar */}
            <motion.div {...fadeUp()} className="inline-flex rounded-full bg-white/80 backdrop-blur-xl shadow-sm border border-warm-gray/20 p-1 mb-8">
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveTab(tab.key)}
                  className={`font-body text-caption tracking-[0.1em] uppercase px-4 py-1.5 rounded-full transition-all duration-200 ${
                    activeTab === tab.key
                      ? 'bg-ink text-paper shadow-sm'
                      : 'text-sepia-mid hover:text-ink'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </motion.div>

            <div className="space-y-3">
              {isLoading ? (
                <p className="font-body text-body-sm text-sepia-mid text-center py-12">
                  {t('common.loading', 'Loading...')}
                </p>
              ) : filteredOrders.map((order, i) => (
                <motion.div
                  key={order.id}
                  {...fadeUp(i * 0.06)}
                  className="relative rounded-xl border border-warm-gray/20 bg-white/60 backdrop-blur p-5 md:p-6 flex flex-col md:flex-row md:items-center gap-4 overflow-hidden"
                >
                  {/* Status color bar */}
                  <div
                    className={`absolute left-0 top-0 bottom-0 w-1 ${
                      order.status === 'listed' ? 'bg-sage' :
                      order.status === 'pending' ? 'bg-amber-400' :
                      order.status === 'approved' ? 'bg-sky-400' : 'bg-red-400'
                    }`}
                  />

                  <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-3 pl-3">
                    <div>
                      <span className="font-body text-overline text-sepia-mid tracking-[0.1em] uppercase block mb-1">
                        {t('clothingRecycle.orderId', 'Order ID')}
                      </span>
                      <span className="font-body text-body-sm text-ink font-medium">{order.id}</span>
                    </div>
                    <div>
                      <span className="font-body text-overline text-sepia-mid tracking-[0.1em] uppercase block mb-1">
                        {t('clothingRecycle.orderDate', 'Submitted')}
                      </span>
                      <span className="font-body text-body-sm text-ink">{order.date}</span>
                    </div>
                    <div>
                      <span className="font-body text-overline text-sepia-mid tracking-[0.1em] uppercase block mb-1">
                        {t('clothingRecycle.orderType', 'Garment Type')}
                      </span>
                      <span className="font-body text-body-sm text-ink">{order.type}</span>
                    </div>
                    <div>
                      <span className="font-body text-overline text-sepia-mid tracking-[0.1em] uppercase block mb-1">
                        {t('clothingRecycle.orderQuantity', 'Quantity')}
                      </span>
                      <span className="font-body text-body-sm text-ink">{order.quantity} {t('clothingRecycle.quantityUnit', 'pcs')}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 md:flex-col md:items-end md:gap-2 pl-3 md:pl-0">
                    <span className={`inline-block font-body text-overline tracking-[0.1em] px-3 py-1 rounded-full text-[10px] ${STATUS_BADGE[order.status]}`}>
                      {order.statusLabel}
                    </span>
                    {order.status === 'listed' && order.productLink && (
                      <Link to={order.productLink} className="font-body text-caption text-rust tracking-[0.1em] uppercase hover:underline">
                        {t('clothingRecycle.viewProduct', 'View Product')} &rarr;
                      </Link>
                    )}
                    {order.status === 'rejected' && order.reason && (
                      <span className="font-body text-caption text-red-600 max-w-xs">{order.reason}</span>
                    )}
                    {order.status === 'pending' && (
                      <span className="font-body text-[10px] text-sepia-mid">
                        {t('clothingRecycle.pendingEta', 'Estimated review: 1-3 business days')}
                      </span>
                    )}
                  </div>
                </motion.div>
              ))}

              {!isLoading && filteredOrders.length === 0 && (
                <div className="text-center py-16">
                  <p className="font-body text-body-sm text-sepia-mid mb-4">
                    {t('clothingRecycle.noOrders', 'No orders in this status')}
                  </p>
                  <a href="#recycle-form" className="font-body text-caption text-rust tracking-[0.1em] uppercase hover:underline">
                    {t('clothingRecycle.submitFirst', 'Submit your first recycling request')} &rarr;
                  </a>
                </div>
              )}
            </div>
          </>
        )}
      </SectionContainer>
    </div>
  );
});

export default RecycleOrders;
