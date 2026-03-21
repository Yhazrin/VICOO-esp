import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import PageWrapper from '@/components/layout/PageWrapper';
import SectionContainer from '@/components/layout/SectionContainer';
import NumberedSectionHeading from '@/components/editorial/NumberedSectionHeading';
import PaperTextureBackground from '@/components/editorial/PaperTextureBackground';
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
  const [activeTab, setActiveTab] = useState<'orders' | 'donations'>('orders');

  useEffect(() => {
    if (!isAuthenticated) return;
    let cancelled = false;

    ordersApi
      .getMyOrders()
      .then((data: any) => {
        if (!cancelled) {
          const raw = data?.data ?? data;
          setOrders(Array.isArray(raw) ? raw : []);
          setLoadingOrders(false);
        }
      })
      .catch(() => {
        if (!cancelled) setLoadingOrders(false);
      });

    donationsApi
      .getMyDonations()
      .then((data: any) => {
        if (!cancelled) {
          const raw = data?.data ?? data;
          setDonations(Array.isArray(raw) ? raw : []);
          setLoadingDonations(false);
        }
      })
      .catch(() => {
        if (!cancelled) setLoadingDonations(false);
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
        <div className="min-h-[100dvh] flex items-center justify-center py-12 px-4">
          <div className="text-center">
            <p className="font-body text-ink-faded mb-4">{t('profile.notLoggedIn')}</p>
            <motion.button
              whileHover={prefersReducedMotion ? undefined : { scale: 1.01 }}
              whileTap={prefersReducedMotion ? undefined : { scale: 0.99 }}
              onClick={() => navigate('/login')}
              className="cursor-pointer font-body text-body-sm tracking-[0.15em] uppercase bg-ink text-paper px-10 py-4 hover:bg-rust transition-colors duration-300"
            >
              {t('nav.login')}
            </motion.button>
          </div>
        </div>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper>
      {/* Profile Header */}
      <PaperTextureBackground variant="paper" className="py-16 md:py-24">
        <SectionContainer>
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
                <div className="w-16 h-16 bg-warm-gray/20 flex items-center justify-center">
                  <span className="font-display text-xl text-ink">
                    {user.nickname ? user.nickname.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase()}
                  </span>
                </div>
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

      {/* Orders & Donations */}
      <PaperTextureBackground variant="aged" className="py-16 md:py-24">
        <SectionContainer>
          {/* Tab switcher */}
          <div className="flex gap-8 mb-12 border-b border-warm-gray/30">
            <button
              onClick={() => setActiveTab('orders')}
              className={`cursor-pointer pb-4 font-body text-body-sm tracking-[0.15em] uppercase transition-colors ${
                activeTab === 'orders'
                  ? 'text-ink border-b-2 border-ink'
                  : 'text-sepia-mid hover:text-ink'
              }`}
            >
              {t('profile.orders', 'Orders')} ({orders.length})
            </button>
            <button
              onClick={() => setActiveTab('donations')}
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
            <div>
              <NumberedSectionHeading number="01" title={t('profile.orderHistory', 'Order History')} />
              {loadingOrders ? (
                <p className="font-body text-body-sm text-ink-faded">{t('common.loading', 'Loading...')}</p>
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
                <div className="space-y-6">
                  {orders.map((order, index) => (
                    <motion.div
                      key={order.id}
                      initial={prefersReducedMotion ? false : { opacity: 0, y: 12 }}
                      animate={prefersReducedMotion ? undefined : { opacity: 1, y: 0 }}
                      transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.4, delay: index * 0.08 }}
                      className="border border-warm-gray/30 p-6"
                    >
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <p className="font-body text-overline text-ink-faded tracking-wider">
                            {t('profile.orderId', 'Order')} #{order.id}
                          </p>
                          <p className="font-body text-caption text-sepia-mid mt-1">
                            {new Date(order.createdAt).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                            })}
                          </p>
                        </div>
                        <span className={`font-body text-overline tracking-[0.1em] uppercase ${STATUS_COLORS[order.status] ?? 'text-sepia-mid'}`}>
                          {order.status}
                        </span>
                      </div>
                      {order.items?.map((item, i) => (
                        <div key={i} className="flex justify-between py-2 border-t border-warm-gray/10">
                          <span className="font-body text-body-sm text-ink-faded">
                            {item.product?.name ?? 'Product'} × {item.quantity}
                          </span>
                          <span className="font-body text-body-sm text-ink">
                            {order.currency} {((item.product?.price ?? 0) * item.quantity).toFixed(2)}
                          </span>
                        </div>
                      ))}
                      <div className="flex justify-between pt-3 border-t border-warm-gray/20 mt-2">
                        <span className="font-body text-body-sm tracking-wider uppercase text-sepia-mid">
                          {t('profile.total', 'Total')}
                        </span>
                        <span className="font-display text-lg text-ink">
                          {order.currency} {order.totalAmount.toFixed(2)}
                        </span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Donations tab */}
          {activeTab === 'donations' && (
            <div>
              <NumberedSectionHeading number="02" title={t('profile.donationHistory', 'Donation History')} />
              {loadingDonations ? (
                <p className="font-body text-body-sm text-ink-faded">{t('common.loading', 'Loading...')}</p>
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
                <div className="space-y-6">
                  {donations.map((donation, index) => (
                    <motion.div
                      key={donation.id}
                      initial={prefersReducedMotion ? false : { opacity: 0, y: 12 }}
                      animate={prefersReducedMotion ? undefined : { opacity: 1, y: 0 }}
                      transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.4, delay: index * 0.08 }}
                      className="border border-warm-gray/30 p-6"
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <p className="font-display text-xl text-ink">
                            {donation.currency} {donation.amount.toFixed(2)}
                          </p>
                          <p className="font-body text-caption text-sepia-mid mt-1">
                            {new Date(donation.createdAt).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                            })}
                          </p>
                        </div>
                        <span className={`font-body text-overline tracking-[0.1em] uppercase ${STATUS_COLORS[donation.status] ?? 'text-sepia-mid'}`}>
                          {donation.status}
                        </span>
                      </div>
                      {donation.message && (
                        <p className="font-body text-body-sm text-ink-faded italic mt-2 pl-4 border-l-2 border-warm-gray/20">
                          &ldquo;{donation.message}&rdquo;
                        </p>
                      )}
                      {donation.anonymous && (
                        <p className="font-body text-overline text-sepia-mid mt-2">
                          {t('profile.anonymous', 'Anonymous donation')}
                        </p>
                      )}
                    </motion.div>
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
