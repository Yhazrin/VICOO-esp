import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import PageWrapper from '@/components/layout/PageWrapper';
import SectionContainer from '@/components/layout/SectionContainer';
import NumberedSectionHeading from '@/components/editorial/NumberedSectionHeading';
import PaperTextureBackground from '@/components/editorial/PaperTextureBackground';
import GrainOverlay from '@/components/editorial/GrainOverlay';
import SectionGrainOverlay from '@/components/editorial/SectionGrainOverlay';
import { MagazineDivider } from '@/components/editorial/MagazineDivider';
import { EditorialCard } from '@/components/editorial/EditorialCard';
import { useAuthStore } from '@/stores/authStore';
import { ordersApi } from '@/services/orders';
import { donationsApi } from '@/services/donations';
import type { Order, Donation } from '@/types';

const STATUS_COLORS: Record<string, string> = {
  pending: 'text-sepia-mid',
  paid: 'text-archive-brown',
  shipped: 'text-archive-brown',
  delivered: 'text-archive-brown',
  cancelled: 'text-rust',
  completed: 'text-archive-brown',
  failed: 'text-rust',
  refunded: 'text-sepia-mid',
};

export default function Profile() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const prefersReducedMotion = useReducedMotion();
  const { user, isAuthenticated, logout } = useAuthStore();
  const [orders, setOrders] = useState<Order[]>([]);
  const [donations, setDonations] = useState<Donation[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [loadingDonations, setLoadingDonations] = useState(true);
  const [errorOrders, setErrorOrders] = useState(false);
  const [errorDonations, setErrorDonations] = useState(false);
  const [activeTab, setActiveTab] = useState<'orders' | 'donations'>('orders');

  useEffect(() => {
    if (!isAuthenticated) return;
    let cancelled = false;

    ordersApi
      .getMyOrders()
      .then((data: Order[]) => {
        if (!cancelled) {
          const raw = data;
          setOrders(Array.isArray(raw) ? raw : []);
          setLoadingOrders(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setErrorOrders(true);
          setLoadingOrders(false);
        }
      });

    donationsApi
      .getMyDonations()
      .then((data: Donation[]) => {
        if (!cancelled) {
          const raw = data;
          setDonations(Array.isArray(raw) ? raw : []);
          setLoadingDonations(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setErrorDonations(true);
          setLoadingDonations(false);
        }
      });

    return () => { cancelled = true; };
  }, [isAuthenticated]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  if (!isAuthenticated || !user) {
    return (
      <PageWrapper>
        <PaperTextureBackground variant="paper" className="min-h-[100dvh] flex items-center justify-center relative">
          <GrainOverlay />
          <div className="absolute left-6 top-1/4 bottom-1/4 w-px bg-rust/15 hidden md:block" aria-hidden="true" />
          <div className="text-center relative">
            <motion.span
              initial={prefersReducedMotion ? false : { opacity: 0 }}
              animate={prefersReducedMotion ? undefined : { opacity: 1 }}
              transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.8, delay: 0.1 }}
              className="font-body text-overline tracking-[0.3em] uppercase text-sepia-mid block mb-6"
            >
              Vol. IX · No. 11
            </motion.span>
            <motion.p
              initial={prefersReducedMotion ? false : { opacity: 0, y: 10 }}
              animate={prefersReducedMotion ? undefined : { opacity: 1, y: 0 }}
              transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.6, ease: [0, 0, 0.2, 1] }}
              className="font-body text-body-sm text-ink-faded mb-6"
            >
              {t('profile.notLoggedIn')}
            </motion.p>
            <motion.div
              {...(prefersReducedMotion ? {} : { initial: { scaleX: 0 }, animate: { scaleX: 1 }, transition: { duration: 0.8, delay: 0.3 } })}
              className="h-px w-[60px] bg-rust/40 mx-auto mb-8 origin-center"
            />
            <motion.button
              initial={prefersReducedMotion ? false : { opacity: 0, y: 20 }}
              animate={prefersReducedMotion ? undefined : { opacity: 1, y: 0 }}
              transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.6, ease: [0, 0, 0.2, 1], delay: 0.2 }}
              whileHover={prefersReducedMotion ? undefined : { scale: 1.01 }}
              whileTap={prefersReducedMotion ? undefined : { scale: 0.99 }}
              onClick={() => navigate('/login')}
              className="cursor-pointer font-body text-body-sm tracking-[0.15em] uppercase bg-ink text-paper px-10 py-4 hover:bg-rust transition-colors duration-300"
            >
              {t('nav.login')}
            </motion.button>
          </div>
        </PaperTextureBackground>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper>
      {/* Profile Header */}
      <PaperTextureBackground variant="paper" className="py-16 md:py-24 relative">
        <GrainOverlay />
        <SectionContainer>
          <h1 className="sr-only">{t('profile.title')}</h1>
          <NumberedSectionHeading number="10" title={t('profile.title')} />

          <motion.div
            initial={prefersReducedMotion ? false : { opacity: 0, y: 20 }}
            animate={prefersReducedMotion ? undefined : { opacity: 1, y: 0 }}
            transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.6, ease: [0, 0, 0.2, 1], delay: 0.2 }}
            className="relative bg-paper border border-warm-gray/30 p-8"
          >
            <div className="absolute top-0 left-0 w-5 h-5 border-t-2 border-l-2 border-rust/30 pointer-events-none" aria-hidden="true" />
            <div className="absolute bottom-0 right-0 w-5 h-5 border-b-2 border-r-2 border-rust/30 pointer-events-none" aria-hidden="true" />

            <div className="space-y-6">
              {/* User Info */}
              <div className="flex items-center gap-6 pb-6 border-b border-warm-gray/20">
                <motion.div
                  whileHover={prefersReducedMotion ? undefined : { scale: 1.03 }}
                  className="w-20 h-20 bg-warm-gray/20 flex items-center justify-center border-2 border-rust/20 relative cursor-default"
                >
                  <SectionGrainOverlay />
                  <div className="absolute top-1.5 left-1.5 w-3 h-3 border-t border-l border-rust/30 pointer-events-none" aria-hidden="true" />
                  <div className="absolute top-1.5 right-1.5 w-3 h-3 border-t border-r border-rust/30 pointer-events-none" aria-hidden="true" />
                  <div className="absolute bottom-1.5 left-1.5 w-3 h-3 border-b border-l border-rust/30 pointer-events-none" aria-hidden="true" />
                  <div className="absolute bottom-1.5 right-1.5 w-3 h-3 border-b border-r border-rust/30 pointer-events-none" aria-hidden="true" />
                  <span className="font-display text-2xl text-ink relative z-10">
                    {user.nickname ? user.nickname.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase()}
                  </span>
                </motion.div>
                <div>
                  <h2 className="font-display text-xl text-ink">{user.nickname || user.email}</h2>
                  <p className="font-body text-body-sm text-ink-faded">{user.email}</p>
                  <span className="inline-block mt-2 font-body text-overline tracking-[0.1em] uppercase text-sepia-mid bg-warm-gray/20 px-2 py-1">
                    {user.role}
                  </span>
                </div>
              </div>

              {/* Account Details */}
              <div className="space-y-4">
                <h3 className="font-body text-body-sm tracking-[0.1em] uppercase text-sepia-mid">
                  {t('profile.accountDetails')}
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="font-body text-overline text-ink-faded mb-1">{t('profile.userId')}</p>
                    <p className="font-body text-body-sm text-ink">{user.id}</p>
                  </div>
                  <div>
                    <p className="font-body text-overline text-ink-faded mb-1">{t('profile.role')}</p>
                    <p className="font-body text-body-sm text-ink capitalize">{user.role}</p>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-4 pt-4">
                <motion.button
                  whileHover={prefersReducedMotion ? undefined : { scale: 1.01 }}
                  whileTap={prefersReducedMotion ? undefined : { scale: 0.99 }}
                  onClick={handleLogout}
                  className="cursor-pointer flex-1 font-body text-body-sm tracking-[0.1em] uppercase border border-warm-gray/40 text-ink px-6 py-3 hover:bg-warm-gray/10 transition-colors duration-300"
                >
                  {t('nav.logout')}
                </motion.button>
              </div>
            </div>
          </motion.div>
        </SectionContainer>
      </PaperTextureBackground>

      <MagazineDivider variant="decorative" />

      {/* Orders & Donations */}
      <PaperTextureBackground variant="aged" className="py-16 md:py-24 relative">
        <GrainOverlay />
        <SectionContainer>
          {/* Tab switcher */}
          <div role="tablist" className="flex gap-8 mb-12 border-b border-warm-gray/30">
            <button
              role="tab"
              id="tab-orders"
              aria-selected={activeTab === 'orders'}
              aria-controls="panel-orders"
              tabIndex={activeTab === 'orders' ? 0 : -1}
              onClick={() => setActiveTab('orders')}
              onKeyDown={(e) => { if (e.key === 'ArrowRight') { setActiveTab('donations'); document.getElementById('tab-donations')?.focus(); } }}
              className={`cursor-pointer pb-4 font-body text-body-sm tracking-[0.15em] uppercase transition-colors ${
                activeTab === 'orders'
                  ? 'text-ink border-b-2 border-ink'
                  : 'text-sepia-mid hover:text-ink'
              }`}
            >
              {t('profile.orders', 'Orders')} ({orders.length})
            </button>
            <button
              role="tab"
              id="tab-donations"
              aria-selected={activeTab === 'donations'}
              aria-controls="panel-donations"
              tabIndex={activeTab === 'donations' ? 0 : -1}
              onClick={() => setActiveTab('donations')}
              onKeyDown={(e) => { if (e.key === 'ArrowLeft') { setActiveTab('orders'); document.getElementById('tab-orders')?.focus(); } }}
              className={`cursor-pointer pb-4 font-body text-body-sm tracking-[0.15em] uppercase transition-colors ${
                activeTab === 'donations'
                  ? 'text-ink border-b-2 border-ink'
                  : 'text-sepia-mid hover:text-ink'
              }`}
            >
              {t('profile.donations', 'Donations')} ({donations.length})
            </button>
          </div>

          {/* Orders tab */}
          {activeTab === 'orders' && (
            <div role="tabpanel" id="panel-orders" aria-labelledby="tab-orders">
              <NumberedSectionHeading number="01" title={t('profile.orderHistory', 'Order History')} />
              {loadingOrders ? (
                <p className="font-body text-body-sm text-ink-faded">{t('common.loading', 'Loading...')}</p>
              ) : errorOrders ? (
                <p className="font-body text-body-sm text-rust text-center py-12">
                  {t('profile.errorLoadingOrders', 'Could not load your orders. Please try again later.')}
                </p>
              ) : orders.length === 0 ? (
                <div className="text-center py-12">
                  <p className="font-body text-body-sm text-ink-faded mb-4">
                    {t('profile.noOrders', 'No orders yet')}
                  </p>
                  <Link
                    to="/shop"
                    className="inline-block font-body text-overline tracking-[0.15em] uppercase text-rust hover:text-ink transition-colors"
                  >
                    {t('profile.browseShop', 'Browse the shop')} &rarr;
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {orders.map((order, index) => (
                    <EditorialCard
                      key={order.id}
                      title={`${t('profile.orderId', 'Order')} #${order.id}`}
                      subtitle={new Date(order.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                      index={index}
                      hoverEffect="border"
                    >
                      <div className="flex justify-between items-center mb-3">
                        <span className={`font-body text-overline tracking-[0.1em] uppercase ${STATUS_COLORS[order.status] ?? 'text-sepia-mid'}`}>
                          {order.status}
                        </span>
                      </div>
                      {order.items?.map((item, i) => (
                        <div key={i} className="flex justify-between py-1.5 border-t border-warm-gray/10">
                          <span className="font-body text-caption text-ink-faded">
                            {item.product?.name ?? 'Product'} × {item.quantity}
                          </span>
                          <span className="font-body text-caption text-ink">
                            {order.currency} {((item.product?.price ?? 0) * item.quantity).toFixed(2)}
                          </span>
                        </div>
                      ))}
                      <div className="flex justify-between pt-2 border-t border-warm-gray/20 mt-1">
                        <span className="font-body text-caption tracking-wider uppercase text-sepia-mid">
                          {t('profile.total', 'Total')}
                        </span>
                        <span className="font-display text-base text-ink">
                          {order.currency} {(order.totalAmount ?? 0).toFixed(2)}
                        </span>
                      </div>
                    </EditorialCard>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Donations tab */}
          {activeTab === 'donations' && (
            <div role="tabpanel" id="panel-donations" aria-labelledby="tab-donations">
              <NumberedSectionHeading number="02" title={t('profile.donationHistory', 'Donation History')} />
              {loadingDonations ? (
                <p className="font-body text-body-sm text-ink-faded">{t('common.loading', 'Loading...')}</p>
              ) : errorDonations ? (
                <p className="font-body text-body-sm text-rust text-center py-12">
                  {t('profile.errorLoadingDonations', 'Could not load your donations. Please try again later.')}
                </p>
              ) : donations.length === 0 ? (
                <div className="text-center py-12">
                  <p className="font-body text-body-sm text-ink-faded mb-4">
                    {t('profile.noDonations', 'No donations yet')}
                  </p>
                  <Link
                    to="/donate"
                    className="inline-block font-body text-overline tracking-[0.15em] uppercase text-rust hover:text-ink transition-colors"
                  >
                    {t('profile.makeDonation', 'Make a donation')} &rarr;
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {donations.map((donation, index) => (
                    <EditorialCard
                      key={donation.id}
                      title={`${donation.currency} ${(donation.amount ?? 0).toFixed(2)}`}
                      subtitle={new Date(donation.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                      index={index}
                      hoverEffect="border"
                    >
                      <div className="flex justify-between items-center mb-2">
                        <span className={`font-body text-overline tracking-[0.1em] uppercase ${STATUS_COLORS[donation.status] ?? 'text-sepia-mid'}`}>
                          {donation.status}
                        </span>
                      </div>
                      {donation.message && (
                        <p className="font-body text-caption text-ink-faded italic mt-2 pl-4 border-l-2 border-warm-gray/20">
                          &ldquo;{donation.message}&rdquo;
                        </p>
                      )}
                      {donation.anonymous && (
                        <p className="font-body text-overline text-sepia-mid mt-2">
                          {t('profile.anonymous', 'Anonymous donation')}
                        </p>
                      )}
                    </EditorialCard>
                  ))}
                </div>
              )}
            </div>
          )}
        </SectionContainer>
      </PaperTextureBackground>
    </PageWrapper>
  );
}
