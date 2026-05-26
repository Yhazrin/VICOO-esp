import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import PageWrapper from '@/components/layout/PageWrapper';
import SectionContainer from '@/components/layout/SectionContainer';
import PaperTextureBackground from '@/components/editorial/PaperTextureBackground';

import SectionGrainOverlay from '@/components/editorial/SectionGrainOverlay';
import { MagazineDivider } from '@/components/editorial/MagazineDivider';
import { EditorialCard } from '@/components/editorial/EditorialCard';
import { useAuthStore } from '@/stores/authStore';
import { useAuth } from '@/hooks/useAuth';
import { ordersApi, type OrderDetail } from '@/services/orders';
import { donationsApi } from '@/services/donations';
import { clothingIntakesApi, type ClothingIntake } from '@/services/clothingIntakes';
import { afterSalesApi, type AfterSaleTicket } from '@/services/afterSales';
import { addressesApi, type Address, type AddressCreateData } from '@/services/addresses';

const STATUS_COLORS: Record<string, string> = {
  pending: 'text-sepia-mid',
  paid: 'text-archive-brown',
  shipped: 'text-archive-brown',
  delivered: 'text-archive-brown',
  cancelled: 'text-rust',
  completed: 'text-archive-brown',
  failed: 'text-rust',
  refunded: 'text-sepia-mid',
  submitted: 'text-sepia-mid',
  received: 'text-archive-brown',
  processing: 'text-archive-brown',
  listed: 'text-sage',
  rejected: 'text-rust',
  open: 'text-sepia-mid',
  in_progress: 'text-archive-brown',
  resolved: 'text-sage',
  closed: 'text-archive-brown',
};

type TabKey = 'orders' | 'donations' | 'clothing' | 'support' | 'addresses';

const ORDER_STATUSES = ['', 'pending', 'paid', 'shipped', 'completed', 'cancelled'] as const;

export default function Profile() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const prefersReducedMotion = useReducedMotion();
  const { user, isAuthenticated } = useAuthStore();
  const { logout } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<TabKey>('orders');

  // Order filters
  const [orderStatus, setOrderStatus] = useState('');
  const [orderKeyword, setOrderKeyword] = useState('');

  // Address form state
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [addressForm, setAddressForm] = useState<AddressCreateData>({
    label: '', recipient_name: '', phone: '', province: '', city: '',
    district: '', detail_address: '', postal_code: '', is_default: false,
  });

  // Inline error message for user feedback
  const [errorMessage, setErrorMessage] = useState('');
  const [cancellingOrderId, setCancellingOrderId] = useState<number | null>(null);

  const tabs: TabKey[] = ['orders', 'donations', 'clothing', 'support', 'addresses'];

  const handleTabKeyDown = (e: React.KeyboardEvent, tab: TabKey) => {
    const idx = tabs.indexOf(tab);
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      const next = tabs[(idx + 1) % tabs.length];
      setActiveTab(next);
      document.getElementById(`tab-${next}`)?.focus();
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      const prev = tabs[(idx - 1 + tabs.length) % tabs.length];
      setActiveTab(prev);
      document.getElementById(`tab-${prev}`)?.focus();
    }
  };

  const { data: orders = [], isLoading: loadingOrders, isError: errorOrders } = useQuery({
    queryKey: ['my-orders', orderStatus, orderKeyword],
    queryFn: () => ordersApi.getMyOrders({
      status: orderStatus || undefined,
      keyword: orderKeyword || undefined,
    }),
    enabled: isAuthenticated,
  });

  const { data: donations = [], isLoading: loadingDonations, isError: errorDonations } = useQuery({
    queryKey: ['my-donations'],
    queryFn: () => donationsApi.getMyDonations(),
    enabled: isAuthenticated,
    staleTime: 10 * 60 * 1000,
  });

  const { data: intakes = [], isLoading: loadingIntakes, isError: errorIntakes } = useQuery({
    queryKey: ['my-clothing-intakes'],
    queryFn: () => clothingIntakesApi.mine(),
    enabled: isAuthenticated,
  });

  const { data: tickets = [], isLoading: loadingTickets, isError: errorTickets } = useQuery({
    queryKey: ['my-after-sales'],
    queryFn: () => afterSalesApi.mine(),
    enabled: isAuthenticated,
  });

  const { data: addresses = [], isLoading: loadingAddresses, isError: addressError } = useQuery({
    queryKey: ['my-addresses'],
    queryFn: () => addressesApi.getAll(),
    enabled: isAuthenticated,
    staleTime: 15 * 60 * 1000,
  });

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const resetAddressForm = () => {
    setAddressForm({ label: '', recipient_name: '', phone: '', province: '', city: '', district: '', detail_address: '', postal_code: '', is_default: false });
    setEditingAddress(null);
    setShowAddressForm(false);
  };

  const handleSaveAddress = async () => {
    try {
      setErrorMessage('');
      if (editingAddress) {
        await addressesApi.update(editingAddress.id, addressForm);
      } else {
        await addressesApi.create(addressForm);
      }
      queryClient.invalidateQueries({ queryKey: ['my-addresses'] });
      resetAddressForm();
    } catch {
      setErrorMessage(t('profile.addressSaveError', 'Failed to save address — please retry'));
    }
  };

  const handleDeleteAddress = async (id: number) => {
    try {
      setErrorMessage('');
      await addressesApi.remove(id);
      queryClient.invalidateQueries({ queryKey: ['my-addresses'] });
    } catch {
      setErrorMessage(t('profile.addressDeleteError', 'Failed to delete address — please retry'));
    }
  };

  const handleSetDefault = async (id: number) => {
    try {
      setErrorMessage('');
      await addressesApi.setDefault(id);
      queryClient.invalidateQueries({ queryKey: ['my-addresses'] });
    } catch {
      setErrorMessage(t('profile.setDefaultError', 'Failed to set default address — please retry'));
    }
  };

  const startEditAddress = (addr: Address) => {
    setAddressForm({
      label: addr.label || '',
      recipient_name: addr.recipient_name,
      phone: addr.phone,
      province: addr.province,
      city: addr.city,
      district: addr.district || '',
      detail_address: addr.detail_address,
      postal_code: addr.postal_code || '',
      is_default: addr.is_default,
    });
    setEditingAddress(addr);
    setShowAddressForm(true);
  };

  if (!isAuthenticated || !user) {
    return (
      <PageWrapper>
        <PaperTextureBackground variant="paper" className="min-h-[100dvh] flex items-center justify-center relative">

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
      <h1 className="sr-only">{t('profile.title')}</h1>
      {/* Profile Header */}
      <PaperTextureBackground variant="paper" className="py-16 md:py-24 relative">

        <SectionContainer>
          <h1 className="sr-only">{t('profile.title')}</h1>
          <h2 className="font-display text-h3 font-bold text-ink mb-8">
            {t('profile.title')}
          </h2>

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

      {/* Orders & Donations & Addresses */}
      <PaperTextureBackground variant="aged" className="py-16 md:py-24 relative">

        <SectionContainer>
          {/* Tab switcher — capsule style */}
          <div
            className="flex items-center mb-12 rounded-full bg-white/80 backdrop-blur-xl shadow-sm px-2 py-1 overflow-x-auto"
            role="tablist"
          >
            {tabs.map((tab) => (
              <button
                key={tab}
                role="tab"
                id={`tab-${tab}`}
                aria-selected={activeTab === tab}
                aria-controls={`panel-${tab}`}
                tabIndex={activeTab === tab ? 0 : -1}
                onClick={() => setActiveTab(tab)}
                onKeyDown={(e) => handleTabKeyDown(e, tab)}
                className={`font-body text-label tracking-wide px-3 py-1 rounded-full transition-all duration-200 cursor-pointer whitespace-nowrap ${
                  activeTab === tab
                    ? 'text-ink font-medium bg-rust/15'
                    : 'text-ink-faded hover:text-ink'
                }`}
              >
                {t(`profile.tabs.${tab}`)} ({
                  tab === 'orders' ? orders.length :
                  tab === 'donations' ? donations.length :
                  tab === 'clothing' ? intakes.length :
                  tab === 'support' ? tickets.length :
                  addresses.length
                })
              </button>
            ))}
          </div>

          {/* Orders tab */}
          {activeTab === 'orders' && (
            <div role="tabpanel" id="panel-orders" aria-labelledby="tab-orders">
              <h2 className="font-display text-h3 font-bold text-ink mb-6">
                {t('profile.orderHistory')}
              </h2>

              {/* Order filters */}
              <div className="flex flex-wrap items-center gap-3 mb-8">
                {/* Status chips */}
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
                    {s ? t(`profile.orders.filter${s.charAt(0).toUpperCase() + s.slice(1)}`, s) : t('profile.orders.filterAll', 'All')}
                  </button>
                ))}
                {/* Search */}
                <input
                  type="text"
                  value={orderKeyword}
                  onChange={(e) => setOrderKeyword(e.target.value)}
                  placeholder={t('profile.orders.searchPlaceholder', 'Search order number...')}
                  aria-label={t('profile.orders.searchPlaceholder', 'Search order number...')}
                  className="ml-auto px-3 py-1.5 border border-warm-gray/25 bg-transparent font-body text-caption text-ink focus:outline-none focus:border-rust/50 transition-colors w-48"
                />
              </div>

              {loadingOrders ? (
                <p className="font-body text-body-sm text-ink-faded">{t('common.loading', 'Loading...')}</p>
              ) : errorOrders ? (
                <p className="font-body text-body-sm text-rust">
                  {t('profile.ordersError')}
                </p>
              ) : orders.length === 0 ? (
                <div className="text-center py-12">
                  <p className="font-body text-body-sm text-ink-faded mb-4">
                    {t('profile.noOrders')}
                  </p>
                  <Link
                    to="/shop"
                    className="inline-block font-body text-overline tracking-[0.15em] uppercase text-rust hover:text-ink transition-colors"
                  >
                    {t('profile.browseShop')} &rarr;
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-6">
                  {orders.map((order: OrderDetail, index: number) => (
                    <motion.div
                      key={order.id}
                      initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 15 }}
                      animate={prefersReducedMotion ? {} : { opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: index * 0.06 }}
                      className="border border-warm-gray/25 bg-paper p-6 hover:border-rust/25 transition-colors"
                    >
                      {/* Header */}
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <p className="font-mono text-xs text-sepia-mid">{order.order_no}</p>
                          <p className="font-body text-caption text-ink-faded mt-0.5">
                            {new Date(order.created_at).toLocaleDateString(i18n.language, { year: 'numeric', month: 'short', day: 'numeric' })}
                          </p>
                        </div>
                        <span className={`font-body text-overline tracking-[0.1em] uppercase px-3 py-1 border ${
                          order.status === 'completed' ? 'text-sage border-sage/30 bg-sage/5' :
                          order.status === 'cancelled' ? 'text-rust border-rust/30 bg-rust/5' :
                          order.status === 'shipped' ? 'text-archive-brown border-archive-brown/30 bg-archive-brown/5' :
                          'text-sepia-mid border-warm-gray/30 bg-warm-gray/5'
                        }`}>
                          {order.status}
                        </span>
                      </div>

                      {/* Items with images */}
                      <div className="space-y-3 mb-4">
                        {order.items?.map((item) => (
                          <div key={item.id} className="flex items-center gap-3">
                            <div className="w-12 h-14 flex-shrink-0 overflow-hidden border border-warm-gray/15 bg-aged-stock">
                              {item.product_image ? (
                                <img src={item.product_image} alt={item.product_name || ''} className="w-full h-full object-cover" loading="lazy" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <span className="font-mono text-[8px] text-warm-gray/40">VICOO</span>
                                </div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-body text-body-sm text-ink truncate">
                                {item.product_name || `#${item.product_id}`}
                              </p>
                              <p className="font-mono text-[11px] text-sepia-mid">
                                ×{item.quantity}
                              </p>
                            </div>
                            <span className="font-mono text-sm text-ink flex-shrink-0">
                              ¥{(Number(item.price) * item.quantity).toFixed(2)}
                            </span>
                          </div>
                        ))}
                      </div>

                      {/* Footer */}
                      <div className="flex items-center justify-between pt-3 border-t border-warm-gray/15">
                        <div className="flex items-center gap-3">
                          <span className="font-body text-caption text-sepia-mid">{t('profile.total')}</span>
                          <span className="font-display text-base font-bold text-ink">
                            ¥{Number(order.total_amount).toFixed(2)}
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          {order.status === 'pending' && (
                            <button
                              disabled={cancellingOrderId === order.id}
                              onClick={async (e) => {
                                e.preventDefault();
                                if (cancellingOrderId === order.id) return;
                                setCancellingOrderId(order.id);
                                try {
                                  setErrorMessage('');
                                  await ordersApi.cancel(String(order.id));
                                  queryClient.invalidateQueries({ queryKey: ['my-orders'] });
                                } catch {
                                  setErrorMessage(t('profile.cancelOrderError', 'Failed to cancel order — please retry'));
                                } finally {
                                  setCancellingOrderId(null);
                                }
                              }}
                              className="font-body text-caption text-rust hover:text-rust-light transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {cancellingOrderId === order.id ? t('common.loading', 'Processing...') : t('profile.cancelOrder', 'Cancel order')}
                            </button>
                          )}
                          <Link
                            to={`/orders/${order.id}`}
                            className="font-body text-overline tracking-[0.1em] uppercase text-rust hover:text-rust-light transition-colors"
                          >
                            {t('profile.viewLogistics', 'View logistics & details')} →
                          </Link>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Donations tab */}
          {activeTab === 'donations' && (
            <div role="tabpanel" id="panel-donations" aria-labelledby="tab-donations">
              <h2 className="font-display text-h3 font-bold text-ink mb-8">
                {t('profile.donationHistory')}
              </h2>
              {loadingDonations ? (
                <p className="font-body text-body-sm text-ink-faded">{t('common.loading', 'Loading...')}</p>
              ) : errorDonations ? (
                <p className="font-body text-body-sm text-rust">
                  {t('profile.donationsError')}
                </p>
              ) : donations.length === 0 ? (
                <div className="text-center py-12">
                  <p className="font-body text-body-sm text-ink-faded mb-4">
                    {t('profile.noDonations')}
                  </p>
                  <Link
                    to="/donate"
                    className="inline-block font-body text-overline tracking-[0.15em] uppercase text-rust hover:text-ink transition-colors"
                  >
                    {t('profile.makeDonation')} &rarr;
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {donations.map((donation, index) => (
                    <EditorialCard
                      key={donation.id}
                      title={`${donation.currency} ${Number(donation.amount).toFixed(2)}`}
                      subtitle={new Date(donation.created_at).toLocaleDateString(i18n.language, {
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
                      {donation.is_anonymous && (
                        <p className="font-body text-overline text-sepia-mid mt-2">
                          {t('profile.anonymous')}
                        </p>
                      )}
                    </EditorialCard>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'clothing' && (
            <div role="tabpanel" id="panel-clothing" aria-labelledby="tab-clothing">
              <h2 className="font-display text-h3 font-bold text-ink mb-8">
                {t('profile.clothingIntakes')}
              </h2>
              <p className="font-body text-body-sm text-ink-faded mb-6">
                <Link to="/donate-clothing" className="text-rust hover:text-ink underline-offset-4">
                  {t('profile.newClothingIntake')}
                </Link>
              </p>
              {loadingIntakes ? (
                <p className="font-body text-body-sm text-ink-faded">{t('common.loading', 'Loading...')}</p>
              ) : errorIntakes ? (
                <p className="font-body text-body-sm text-rust">{t('profile.intakesError', 'Unable to load clothing intakes at the moment.')}</p>
              ) : intakes.length === 0 ? (
                <p className="font-body text-body-sm text-ink-faded">{t('profile.noIntakes', 'No intakes yet')}</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {intakes.map((row: ClothingIntake, index: number) => (
                    <EditorialCard
                      key={row.id}
                      title={(row.summary ?? '').slice(0, 48) + ((row.summary?.length ?? 0) > 48 ? '…' : '')}
                      subtitle={row.created_at}
                      index={index}
                      hoverEffect="border"
                    >
                      <p className={`font-body text-overline uppercase ${STATUS_COLORS[row.status] ?? 'text-sepia-mid'}`}>{t(`donateClothing.statusLabels.${row.status}`, row.status)}</p>
                      {row.product_id && (
                        <Link to={`/shop/${row.product_id}`} className="font-body text-caption text-rust mt-2 inline-block">
                          {t('profile.viewLinkedProduct', 'View linked product')} →
                        </Link>
                      )}
                    </EditorialCard>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'support' && (
            <div role="tabpanel" id="panel-support" aria-labelledby="tab-support">
              <h2 className="font-display text-h3 font-bold text-ink mb-8">
                {t('profile.afterSales')}
              </h2>
              <p className="font-body text-body-sm text-ink-faded mb-6">
                <Link to="/support" className="text-rust hover:text-ink underline-offset-4">
                  {t('profile.newTicket')}
                </Link>
              </p>
              {loadingTickets ? (
                <p className="font-body text-body-sm text-ink-faded">{t('common.loading', 'Loading...')}</p>
              ) : errorTickets ? (
                <p className="font-body text-body-sm text-rust">{t('profile.ticketsError', 'Unable to load support tickets at the moment.')}</p>
              ) : tickets.length === 0 ? (
                <p className="font-body text-body-sm text-ink-faded">{t('profile.noTickets', 'No tickets yet')}</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {tickets.map((tk: AfterSaleTicket, index: number) => (
                    <EditorialCard
                      key={tk.id}
                      title={tk.subject}
                      subtitle={`${t('profile.orderId', 'Order')} #${tk.order_id}`}
                      index={index}
                      hoverEffect="border"
                    >
                      <p className="font-body text-overline uppercase text-sepia-mid">{tk.category}</p>
                      <p className={`font-body text-caption mt-2 ${STATUS_COLORS[tk.status] ?? 'text-ink'}`}>{tk.status}</p>
                      {tk.description && (
                        <p className="font-body text-caption text-ink-faded mt-2 border-l-2 border-warm-gray/30 pl-3">{tk.description}</p>
                      )}
                    </EditorialCard>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Addresses tab */}
          {activeTab === 'addresses' && (
            <div role="tabpanel" id="panel-addresses" aria-labelledby="tab-addresses">
              <div className="flex items-center justify-between mb-8">
                <h2 className="font-display text-h3 font-bold text-ink">
                  {t('profile.addresses.title', 'Shipping addresses')}
                </h2>
                {!showAddressForm && (
                  <button
                    onClick={() => { resetAddressForm(); setShowAddressForm(true); }}
                    className="font-body text-overline tracking-[0.1em] uppercase text-rust hover:text-rust-light transition-colors cursor-pointer"
                  >
                    + {t('profile.addresses.addAddress', 'Add address')}
                  </button>
                )}
              </div>

              {/* Address form */}
              <AnimatePresence>
                {showAddressForm && (
                  <motion.div
                    initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, height: 0 }}
                    className="border border-warm-gray/25 bg-paper p-6 mb-8 overflow-hidden"
                  >
                    <h3 className="font-body text-label text-ink mb-4">
                      {editingAddress ? t('profile.addresses.editAddress', 'Edit address') : t('profile.addresses.addAddress', 'Add address')}
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="addr-label" className="block font-body text-[10px] tracking-wider uppercase text-sepia-mid mb-1">{t('profile.addresses.label', 'Label')}</label>
                        <input id="addr-label" type="text" value={addressForm.label} onChange={(e) => setAddressForm({ ...addressForm, label: e.target.value })} placeholder={t('profile.addresses.labelPlaceholder', 'Home / Office')} className="w-full px-3 py-2 border border-warm-gray/30 bg-transparent font-body text-body-sm text-ink focus:outline-none focus:border-rust/50" />
                      </div>
                      <div>
                        <label htmlFor="addr-recipient" className="block font-body text-[10px] tracking-wider uppercase text-sepia-mid mb-1">{t('profile.addresses.recipient', 'Recipient')}</label>
                        <input id="addr-recipient" type="text" value={addressForm.recipient_name} onChange={(e) => setAddressForm({ ...addressForm, recipient_name: e.target.value })} className="w-full px-3 py-2 border border-warm-gray/30 bg-transparent font-body text-body-sm text-ink focus:outline-none focus:border-rust/50" />
                      </div>
                      <div>
                        <label htmlFor="addr-phone" className="block font-body text-[10px] tracking-wider uppercase text-sepia-mid mb-1">{t('profile.addresses.phone', 'Phone')}</label>
                        <input id="addr-phone" type="tel" value={addressForm.phone} onChange={(e) => setAddressForm({ ...addressForm, phone: e.target.value })} className="w-full px-3 py-2 border border-warm-gray/30 bg-transparent font-body text-body-sm text-ink focus:outline-none focus:border-rust/50" />
                      </div>
                      <div>
                        <label htmlFor="addr-province" className="block font-body text-[10px] tracking-wider uppercase text-sepia-mid mb-1">{t('profile.addresses.province', 'Province')}</label>
                        <input id="addr-province" type="text" value={addressForm.province} onChange={(e) => setAddressForm({ ...addressForm, province: e.target.value })} className="w-full px-3 py-2 border border-warm-gray/30 bg-transparent font-body text-body-sm text-ink focus:outline-none focus:border-rust/50" />
                      </div>
                      <div>
                        <label htmlFor="addr-city" className="block font-body text-[10px] tracking-wider uppercase text-sepia-mid mb-1">{t('profile.addresses.city', 'City')}</label>
                        <input id="addr-city" type="text" value={addressForm.city} onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })} className="w-full px-3 py-2 border border-warm-gray/30 bg-transparent font-body text-body-sm text-ink focus:outline-none focus:border-rust/50" />
                      </div>
                      <div>
                        <label htmlFor="addr-district" className="block font-body text-[10px] tracking-wider uppercase text-sepia-mid mb-1">{t('profile.addresses.district', 'District')}</label>
                        <input id="addr-district" type="text" value={addressForm.district} onChange={(e) => setAddressForm({ ...addressForm, district: e.target.value })} className="w-full px-3 py-2 border border-warm-gray/30 bg-transparent font-body text-body-sm text-ink focus:outline-none focus:border-rust/50" />
                      </div>
                      <div className="sm:col-span-2">
                        <label htmlFor="addr-detail" className="block font-body text-[10px] tracking-wider uppercase text-sepia-mid mb-1">{t('profile.addresses.detailAddress', 'Address')}</label>
                        <input id="addr-detail" type="text" value={addressForm.detail_address} onChange={(e) => setAddressForm({ ...addressForm, detail_address: e.target.value })} className="w-full px-3 py-2 border border-warm-gray/30 bg-transparent font-body text-body-sm text-ink focus:outline-none focus:border-rust/50" />
                      </div>
                      <div>
                        <label htmlFor="addr-postal" className="block font-body text-[10px] tracking-wider uppercase text-sepia-mid mb-1">{t('profile.addresses.postalCode', 'Postal Code')}</label>
                        <input id="addr-postal" type="text" value={addressForm.postal_code} onChange={(e) => setAddressForm({ ...addressForm, postal_code: e.target.value })} className="w-full px-3 py-2 border border-warm-gray/30 bg-transparent font-body text-body-sm text-ink focus:outline-none focus:border-rust/50" />
                      </div>
                      <div className="flex items-end">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input type="checkbox" checked={addressForm.is_default} onChange={(e) => setAddressForm({ ...addressForm, is_default: e.target.checked })} className="accent-rust" />
                          <span className="font-body text-caption text-ink">{t('profile.addresses.setDefault', 'Set as default')}</span>
                        </label>
                      </div>
                    </div>
                    <div className="flex gap-3 mt-6">
                      <button onClick={handleSaveAddress} disabled={!addressForm.recipient_name || !addressForm.phone || !addressForm.province || !addressForm.city || !addressForm.detail_address} className="font-body text-label tracking-wide bg-ink text-paper px-6 py-2.5 hover:bg-rust transition-colors cursor-pointer disabled:opacity-40">
                        {t('common.save', 'Save')}
                      </button>
                      <button onClick={resetAddressForm} className="font-body text-label tracking-wide text-sepia-mid hover:text-ink transition-colors cursor-pointer">
                        {t('common.cancel', 'Cancel')}
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {addressError ? (
                <p className="font-body text-body-sm text-rust">{t('common.error', 'Failed to load addresses')}</p>
              ) : loadingAddresses ? (
                <p className="font-body text-body-sm text-ink-faded">{t('common.loading', 'Loading...')}</p>
              ) : addresses.length === 0 && !showAddressForm ? (
                <div className="text-center py-12">
                  <p className="font-body text-body-sm text-ink-faded mb-4">
                    {t('profile.addresses.noAddresses', 'No saved addresses')}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {addresses.map((addr) => (
                    <div key={addr.id} className="border border-warm-gray/25 bg-paper p-5 hover:border-rust/25 transition-colors">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          {addr.label && (
                            <span className="font-body text-overline tracking-[0.1em] uppercase text-sepia-mid bg-warm-gray/15 px-2 py-0.5">
                              {addr.label}
                            </span>
                          )}
                          {addr.is_default && (
                            <span className="font-body text-[10px] tracking-wider uppercase text-sage border border-sage/30 bg-sage/5 px-2 py-0.5">
                              {t('profile.addresses.defaultBadge', 'Default')}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <button onClick={() => startEditAddress(addr)} className="font-body text-[11px] text-sepia-mid hover:text-ink transition-colors cursor-pointer">
                            {t('common.edit', 'Edit')}
                          </button>
                          <button onClick={() => handleDeleteAddress(addr.id)} className="font-body text-[11px] text-rust hover:text-rust-light transition-colors cursor-pointer">
                            {t('common.delete', 'Delete')}
                          </button>
                        </div>
                      </div>
                      <p className="font-body text-body-sm text-ink">{addr.recipient_name} · {addr.phone}</p>
                      <p className="font-body text-caption text-ink-faded mt-1">
                        {[addr.province, addr.city, addr.district, addr.detail_address].filter(Boolean).join(' ')}
                        {addr.postal_code && ` (${addr.postal_code})`}
                      </p>
                      {!addr.is_default && (
                        <button onClick={() => handleSetDefault(addr.id)} className="font-body text-[11px] text-rust hover:text-rust-light transition-colors cursor-pointer mt-2">
                          {t('profile.addresses.setDefault', 'Set as default')}
                        </button>
                      )}
                    </div>
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
