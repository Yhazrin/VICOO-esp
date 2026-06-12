import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import PageWrapper from '@/components/layout/PageWrapper';
import PaperTextureBackground from '@/components/editorial/PaperTextureBackground';
import SectionGrainOverlay from '@/components/editorial/SectionGrainOverlay';
import { EditorialCard } from '@/components/editorial/EditorialCard';
import { useAuthStore } from '@/stores/authStore';
import { useCartStore } from '@/stores/cartStore';
import { useAuth } from '@/hooks/useAuth';
import { authApi } from '@/services/auth';
import { ordersApi, type OrderDetail } from '@/services/orders';
import { donationsApi } from '@/services/donations';
import { formatDate } from '@/utils/dateTime';
import { resolveMediaUrl } from '@/utils/mediaUrl';
import { clothingIntakesApi, type ClothingIntake } from '@/services/clothingIntakes';
import { afterSalesApi, type AfterSaleTicket } from '@/services/afterSales';
import { addressesApi, type Address, type AddressCreateData } from '@/services/addresses';
import OrderReviewModal from '@/components/order/OrderReviewModal';
import AfterSaleProgress from '@/components/order/AfterSaleProgress';
import ProfileOverview from './ProfileOverview';
import ProfileSettingsModal from './ProfileSettingsModal';
import { PROFILE_TABS, useProfileTabs, type TabKey } from './useProfileTabs';

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

const ORDER_STATUSES = ['', 'pending', 'paid', 'shipped', 'completed', 'cancelled'] as const;

function currencySymbol(paymentMethod?: string | null) {
  return paymentMethod === 'paypal' || paymentMethod === 'stripe' ? '$' : '¥';
}

import type { TFunction } from 'i18next';

function orderStatusLabel(status: string, t: TFunction) {
  return t(`profile.orderStatus.${status}`, {
    defaultValue: t(`profile.orders.filter${status.charAt(0).toUpperCase() + status.slice(1)}`, status),
  });
}

export default function Profile() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const prefersReducedMotion = useReducedMotion();
  const { user, isAuthenticated, updateUser } = useAuthStore();
  const { logout } = useAuth();
  const queryClient = useQueryClient();
  const { activeTab, setActiveTab, handleTabKeyDown } = useProfileTabs();
  const [showSettings, setShowSettings] = useState(false);

  const needsOverviewData = activeTab === 'overview';
  const needsOrders = activeTab === 'orders' || needsOverviewData;
  const needsDonations = activeTab === 'donations' || needsOverviewData;
  const needsClothing = activeTab === 'clothing' || needsOverviewData;
  const needsSupport = activeTab === 'support' || needsOverviewData;
  const needsAddresses = activeTab === 'addresses';

  const { data: freshProfile } = useQuery({
    queryKey: ['profile'],
    queryFn: authApi.getProfile,
    enabled: isAuthenticated,
    staleTime: 60_000,
  });

  useEffect(() => {
    if (freshProfile) updateUser(freshProfile);
  }, [freshProfile, updateUser]);

  // Order filters
  const [orderStatus, setOrderStatus] = useState('');
  const [orderKeyword, setOrderKeyword] = useState('');

  // Address form state
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [addressForm, setAddressForm] = useState<AddressCreateData>({
    label: '', recipient_name: '', phone: '', province: '', city: '',
    district: '', detail_address: '', postal_code: '', country: 'China', is_default: false,
  });

  // Inline error message for user feedback
  const [errorMessage, setErrorMessage] = useState('');
  const [cancellingOrderId, setCancellingOrderId] = useState<number | null>(null);

  // Review modal state
  const [reviewOrder, setReviewOrder] = useState<OrderDetail | null>(null);
  const [reviewProductId, setReviewProductId] = useState<number | null>(null);

  const { data: orders = [], isLoading: loadingOrders, isError: errorOrders, isSuccess: ordersLoaded } = useQuery({
    queryKey: ['my-orders', orderStatus, orderKeyword],
    queryFn: () => ordersApi.getMyOrders({
      status: orderStatus || undefined,
      keyword: orderKeyword || undefined,
    }),
    enabled: isAuthenticated && needsOrders,
  });

  const { data: donations = [], isLoading: loadingDonations, isError: errorDonations, isSuccess: donationsLoaded } = useQuery({
    queryKey: ['my-donations'],
    queryFn: () => donationsApi.getMyDonations(),
    enabled: isAuthenticated && needsDonations,
    staleTime: 10 * 60 * 1000,
  });

  const { data: intakes = [], isLoading: loadingIntakes, isError: errorIntakes, isSuccess: intakesLoaded } = useQuery({
    queryKey: ['my-clothing-intakes'],
    queryFn: () => clothingIntakesApi.mine(),
    enabled: isAuthenticated && needsClothing,
  });

  const { data: tickets = [], isLoading: loadingTickets, isError: errorTickets, isSuccess: ticketsLoaded } = useQuery({
    queryKey: ['my-after-sales'],
    queryFn: () => afterSalesApi.mine(),
    enabled: isAuthenticated && needsSupport,
  });

  const { data: addresses = [], isLoading: loadingAddresses, isError: addressError, isSuccess: addressesLoaded } = useQuery({
    queryKey: ['my-addresses'],
    queryFn: () => addressesApi.getAll(),
    enabled: isAuthenticated && needsAddresses,
    staleTime: 15 * 60 * 1000,
  });

  const overviewLoading =
    needsOverviewData &&
    (loadingOrders || loadingDonations || loadingIntakes || loadingTickets);

  const tabCounts: Partial<Record<TabKey, number>> = {
    orders: ordersLoaded ? orders.length : undefined,
    donations: donationsLoaded ? donations.length : undefined,
    clothing: intakesLoaded ? intakes.length : undefined,
    support: ticketsLoaded ? tickets.length : undefined,
    addresses: addressesLoaded ? addresses.length : undefined,
  };

  const handleNavigateTab = (tab: TabKey, status?: string) => {
    if (status !== undefined) setOrderStatus(status);
    setActiveTab(tab);
  };

  const handleLogout = () => {
    logout();
    useCartStore.setState({ items: [], stockWarnings: {} });
    navigate('/login');
  };

  const resetAddressForm = () => {
    setAddressForm({ label: '', recipient_name: '', phone: '', province: '', city: '', district: '', detail_address: '', postal_code: '', country: 'China', is_default: false });
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
      country: addr.country || 'China',
      is_default: addr.is_default,
    });
    setEditingAddress(addr);
    setShowAddressForm(true);
  };

  if (!isAuthenticated || !user) {
    return (
      <PageWrapper>
        <PaperTextureBackground variant="paper" className="-mt-[4.25rem] md:-mt-24 pt-[4.25rem] md:pt-24 h-[100dvh] overflow-hidden flex items-center justify-center relative">
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
      <h1 className="sr-only">{t('profile.title')}</h1>

      <PaperTextureBackground variant="paper" className="-mt-[4.25rem] md:-mt-24 pt-[4.25rem] md:pt-24 h-[100dvh] overflow-hidden flex flex-col relative">
        <div className="flex-1 max-w-[1400px] w-full mx-auto px-4 md:px-6 flex flex-col min-h-0 pt-4 md:pt-5 pb-8 md:pb-10">
          {errorMessage && (
            <div className="flex-shrink-0 mb-3">
              <div className="flex items-center gap-3 bg-rust/10 border border-rust/20 px-4 py-2.5 rounded-lg">
                <p className="font-body text-caption text-rust flex-1">{errorMessage}</p>
                <button
                  onClick={() => setErrorMessage('')}
                  className="text-rust hover:text-rust-light cursor-pointer text-lg leading-none"
                  aria-label={t('common.dismiss', 'Dismiss')}
                >
                  &times;
                </button>
              </div>
            </div>
          )}
          {/* ── Two large dashboard cards ── */}
          <div className="flex-1 min-h-0 flex flex-col md:flex-row gap-4 md:gap-5">

            {/* ════════════════════════════════════════════
                LEFT: Unified Profile Sidebar Card
                ════════════════════════════════════════════ */}
            <motion.aside
              initial={prefersReducedMotion ? false : { opacity: 0, x: -16 }}
              animate={prefersReducedMotion ? undefined : { opacity: 1, x: 0 }}
              transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.5, ease: [0, 0, 0.2, 1] }}
              className="w-full md:w-[300px] lg:w-[320px] flex-shrink-0 min-h-0 border border-warm-gray/25 bg-paper rounded-2xl overflow-y-auto overflow-x-hidden flex flex-col"
            >
              {/* Profile header — avatar + name */}
              <div className="px-5 pt-6 pb-5 flex flex-col items-center text-center border-b border-warm-gray/15">
                <div className="w-20 h-20 lg:w-24 lg:h-24 bg-warm-gray/20 flex items-center justify-center rounded-full border border-warm-gray/30 relative overflow-hidden mb-4">
                  <SectionGrainOverlay />
                  {user.avatarUrl ? (
                    <img
                      src={resolveMediaUrl(user.avatarUrl)}
                      alt=""
                      className="w-full h-full object-cover relative z-10"
                    />
                  ) : (
                    <span className="font-display text-2xl lg:text-3xl text-ink relative z-10">
                      {user.nickname ? user.nickname.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
                <h2 className="font-display text-lg lg:text-xl text-ink truncate w-full">{user.nickname || user.email}</h2>
                <p className="font-body text-body-sm text-ink-faded truncate w-full mt-1">{user.email}</p>
                <span className="inline-block mt-2.5 font-body text-overline tracking-[0.12em] uppercase text-sepia-mid bg-warm-gray/15 px-3 py-1 rounded-full">
                  {user.role}
                </span>
              </div>

              {/* Action buttons */}
              <div className="px-5 py-4 border-b border-warm-gray/15 space-y-2.5">
                <button
                  onClick={() => setShowSettings(true)}
                  className="cursor-pointer w-full font-body text-body-sm tracking-[0.1em] uppercase bg-ink text-paper px-5 py-3 rounded-full hover:bg-rust transition-colors duration-200"
                >
                  {t('profile.settings.editProfile', 'Edit Profile')}
                </button>
                <button
                  onClick={handleLogout}
                  className="cursor-pointer w-full font-body text-body-sm tracking-[0.1em] uppercase border border-warm-gray/30 text-ink-faded px-5 py-2.5 rounded-full hover:text-ink hover:border-warm-gray/50 transition-colors duration-200"
                >
                  {t('nav.logout')}
                </button>
              </div>

              {/* Account details */}
              <div className="px-5 py-4 flex-1 overflow-y-auto min-h-0">
                <p className="font-body text-overline tracking-[0.15em] uppercase text-sepia-mid mb-3">
                  {t('profile.accountDetails')}
                </p>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="font-body text-caption text-ink-faded">{t('profile.userId')}</span>
                    <span className="font-mono text-caption text-ink">{user.id}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-body text-caption text-ink-faded">{t('profile.role')}</span>
                    <span className="font-body text-caption text-ink capitalize">{user.role}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-body text-caption text-ink-faded">{t('profile.tabs.addresses', 'Addresses')}</span>
                    <button
                      onClick={() => setActiveTab('addresses')}
                      className="font-body text-caption text-rust hover:text-ink transition-colors cursor-pointer"
                    >
                      {addressesLoaded ? addresses.length : '—'} &rarr;
                    </button>
                  </div>
                </div>
              </div>

              {/* Mobile-only: compact quick stats */}
              <div className="md:hidden px-5 pb-4 grid grid-cols-3 gap-2 border-t border-warm-gray/15 pt-4">
                <button
                  onClick={() => handleNavigateTab('orders')}
                  className="cursor-pointer text-center py-2 rounded-lg bg-warm-gray/10"
                >
                  <span className="font-display text-base font-bold text-ink block">{orders.length}</span>
                  <span className="font-body text-[10px] text-ink-faded">{t('profile.tabs.orders', 'Orders')}</span>
                </button>
                <button
                  onClick={() => handleNavigateTab('donations')}
                  className="cursor-pointer text-center py-2 rounded-lg bg-warm-gray/10"
                >
                  <span className="font-display text-base font-bold text-ink block">{donations.length}</span>
                  <span className="font-body text-[10px] text-ink-faded">{t('profile.tabs.donations', 'Donations')}</span>
                </button>
                <button
                  onClick={() => handleNavigateTab('clothing')}
                  className="cursor-pointer text-center py-2 rounded-lg bg-warm-gray/10"
                >
                  <span className="font-display text-base font-bold text-ink block">{intakes.length}</span>
                  <span className="font-body text-[10px] text-ink-faded">{t('profile.tabs.clothing', 'Clothing')}</span>
                </button>
              </div>
            </motion.aside>

            {/* ════════════════════════════════════════════
                RIGHT: Account Workspace Card
                ════════════════════════════════════════════ */}
            <motion.div
              initial={prefersReducedMotion ? false : { opacity: 0, y: 12 }}
              animate={prefersReducedMotion ? undefined : { opacity: 1, y: 0 }}
              transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.5, ease: [0, 0, 0.2, 1], delay: 0.1 }}
              className="flex-1 min-h-0 flex flex-col border border-warm-gray/25 bg-paper rounded-2xl overflow-hidden"
            >
              {/* Tab switcher — capsule pills */}
              <div
                className="flex items-center gap-1.5 px-4 md:px-5 py-3 border-b border-warm-gray/15 overflow-x-auto flex-shrink-0"
                role="tablist"
              >
                {PROFILE_TABS.map((tab) => (
                  <button
                    key={tab}
                    role="tab"
                    id={`tab-${tab}`}
                    aria-selected={activeTab === tab}
                    aria-controls={`panel-${tab}`}
                    tabIndex={activeTab === tab ? 0 : -1}
                    onClick={() => setActiveTab(tab)}
                    onKeyDown={(e) => handleTabKeyDown(e, tab)}
                    className={`font-body text-caption tracking-wide px-4 py-2 rounded-full transition-all duration-200 cursor-pointer whitespace-nowrap ${
                      activeTab === tab
                        ? 'text-ink font-medium bg-rust/12 border border-rust/20'
                        : 'text-ink-faded hover:text-ink border border-transparent hover:border-warm-gray/20'
                    }`}
                  >
                    {t(`profile.tabs.${tab}`)}
                    {tabCounts[tab] !== undefined ? ` (${tabCounts[tab]})` : ''}
                  </button>
                ))}
              </div>

              {/* Tab content — scrollable */}
              <div className="flex-1 min-h-0 overflow-y-auto px-5 md:px-6 py-5 md:py-6">
                {/* Overview tab */}
                {activeTab === 'overview' && (
                  <ProfileOverview
                    orders={orders}
                    donations={donations}
                    intakes={intakes}
                    tickets={tickets}
                    isLoading={overviewLoading}
                    onNavigateTab={handleNavigateTab}
                  />
                )}

                {/* Orders tab */}
                {activeTab === 'orders' && (
                  <div role="tabpanel" id="panel-orders" aria-labelledby="tab-orders">
                    {/* Order filters */}
                    <div className="flex flex-wrap items-center gap-2 mb-6">
                      {ORDER_STATUSES.map((s) => (
                        <button
                          key={s}
                          onClick={() => setOrderStatus(s)}
                          className={`font-body text-caption tracking-[0.1em] uppercase px-3 py-1.5 rounded-full border transition-all cursor-pointer ${
                            orderStatus === s
                              ? 'border-rust/40 bg-rust/10 text-ink'
                              : 'border-warm-gray/25 text-sepia-mid hover:border-warm-gray/40'
                          }`}
                        >
                          {s ? t(`profile.orders.filter${s.charAt(0).toUpperCase() + s.slice(1)}`, s) : t('profile.orders.filterAll', 'All')}
                        </button>
                      ))}
                      <input
                        type="text"
                        value={orderKeyword}
                        onChange={(e) => setOrderKeyword(e.target.value)}
                        placeholder={t('profile.orders.searchPlaceholder', 'Search order...')}
                        aria-label={t('profile.orders.searchPlaceholder', 'Search order...')}
                        className="ml-auto px-3.5 py-1.5 border border-warm-gray/25 bg-transparent font-body text-body-sm text-ink rounded-full focus:outline-none focus:border-rust/50 transition-colors w-44"
                      />
                    </div>

                    {loadingOrders ? (
                      <p className="font-body text-caption text-ink-faded">{t('common.loading', 'Loading...')}</p>
                    ) : errorOrders ? (
                      <p className="font-body text-caption text-rust">{t('profile.ordersError')}</p>
                    ) : orders.length === 0 ? (
                      <div className="border border-dashed border-warm-gray/30 rounded-xl p-10 text-center">
                        <div className="w-12 h-12 rounded-full bg-warm-gray/10 flex items-center justify-center mx-auto mb-3">
                          <svg className="w-6 h-6 text-warm-gray/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                          </svg>
                        </div>
                        <p className="font-body text-body-sm text-ink-faded mb-1">{t('profile.noOrders')}</p>
                        <p className="font-body text-caption text-sepia-light mb-4">
                          {t('profile.noOrdersDesc', 'Your order history will appear here once you make a purchase')}
                        </p>
                        <Link to="/shop" className="inline-block font-body text-caption tracking-[0.1em] uppercase text-rust hover:text-ink transition-colors">
                          {t('profile.browseShop')} &rarr;
                        </Link>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {orders.map((order: OrderDetail, index: number) => (
                          <motion.div
                            key={order.id}
                            initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 10 }}
                            animate={prefersReducedMotion ? {} : { opacity: 1, y: 0 }}
                            transition={{ duration: 0.3, delay: index * 0.04 }}
                            className="border border-warm-gray/20 bg-paper rounded-xl p-5 hover:border-rust/20 transition-colors"
                          >
                            <div className="flex items-center justify-between mb-3">
                              <div>
                                <p className="font-mono text-caption text-sepia-mid">{order.order_no}</p>
                                <p className="font-body text-[11px] text-ink-faded mt-0.5">
                                  {formatDate(order.created_at, i18n.language)}
                                </p>
                              </div>
                              <span className={`font-body text-[10px] tracking-[0.1em] uppercase px-2.5 py-1 rounded-full border ${
                                order.status === 'completed' ? 'text-sage border-sage/30 bg-sage/5' :
                                order.status === 'cancelled' ? 'text-rust border-rust/30 bg-rust/5' :
                                order.status === 'shipped' ? 'text-archive-brown border-archive-brown/30 bg-archive-brown/5' :
                                'text-sepia-mid border-warm-gray/30 bg-warm-gray/5'
                              }`}>
                                {orderStatusLabel(order.status, t)}
                              </span>
                            </div>

                            <div className="space-y-2.5 mb-3">
                              {order.items?.map((item) => (
                                <div key={item.id} className="flex items-center gap-3">
                                  <div className="w-11 h-12 flex-shrink-0 overflow-hidden border border-warm-gray/15 rounded-md bg-aged-stock">
                                    {item.product_image ? (
                                      <img src={item.product_image} alt={item.product_name || ''} className="w-full h-full object-cover" loading="lazy" />
                                    ) : (
                                      <div className="w-full h-full flex items-center justify-center">
                                        <span className="font-mono text-[8px] text-warm-gray/40">VICOO</span>
                                      </div>
                                    )}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="font-body text-body-sm text-ink truncate">{item.product_name || `#${item.product_id}`}</p>
                                    <p className="font-mono text-[11px] text-sepia-mid">×{item.quantity}</p>
                                  </div>
                                  <span className="font-mono text-caption text-ink flex-shrink-0">
                                    {currencySymbol(order.payment_method)}{(Number(item.price) * item.quantity).toFixed(2)}
                                  </span>
                                </div>
                              ))}
                            </div>

                            <div className="flex items-center justify-between pt-3 border-t border-warm-gray/10">
                              <div className="flex items-center gap-2">
                                <span className="font-body text-caption text-sepia-mid">{t('profile.total')}</span>
                                <span className="font-display text-base font-bold text-ink">
                                  {currencySymbol(order.payment_method)}{Number(order.total_amount).toFixed(2)}
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
                                {order.status === 'completed' && order.items?.length > 0 && (
                                  <button
                                    onClick={() => {
                                      setReviewOrder(order);
                                      setReviewProductId(Number(order.items[0].product_id));
                                    }}
                                    className="font-body text-caption text-sage hover:text-ink transition-colors cursor-pointer flex items-center gap-1"
                                  >
                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                                    </svg>
                                    {t('profile.writeReview', '评价')}
                                  </button>
                                )}
                                <Link
                                  to={`/orders/${order.id}`}
                                  className="font-body text-caption tracking-[0.08em] uppercase text-rust hover:text-rust-light transition-colors"
                                >
                                  {t('profile.viewLogistics', 'Details')} →
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
                    {loadingDonations ? (
                      <p className="font-body text-caption text-ink-faded">{t('common.loading', 'Loading...')}</p>
                    ) : errorDonations ? (
                      <p className="font-body text-caption text-rust">{t('profile.donationsError')}</p>
                    ) : donations.length === 0 ? (
                      <div className="border border-dashed border-warm-gray/30 rounded-xl p-10 text-center">
                        <div className="w-12 h-12 rounded-full bg-sage/10 flex items-center justify-center mx-auto mb-3">
                          <svg className="w-6 h-6 text-sage/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                          </svg>
                        </div>
                        <p className="font-body text-body-sm text-ink-faded mb-1">{t('profile.noDonations')}</p>
                        <p className="font-body text-caption text-sepia-light mb-4">
                          {t('profile.noDonationsDesc', 'Your contributions help fund children\'s creative programs')}
                        </p>
                        <Link to="/donate" className="inline-block font-body text-caption tracking-[0.1em] uppercase text-rust hover:text-ink transition-colors">
                          {t('profile.makeDonation')} &rarr;
                        </Link>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {donations.map((donation, index) => (
                          <EditorialCard
                            key={donation.id}
                            title={`${donation.currency} ${Number(donation.amount).toFixed(2)}`}
                            subtitle={formatDate(donation.created_at, i18n.language)}
                            index={index}
                            hoverEffect="border"
                          >
                            <div className="flex justify-between items-center mb-1">
                              <span className={`font-body text-[10px] tracking-[0.1em] uppercase ${STATUS_COLORS[donation.status] ?? 'text-sepia-mid'}`}>
                                {donation.status}
                              </span>
                            </div>
                            {donation.message && (
                              <p className="font-body text-caption text-ink-faded italic mt-2 pl-3 border-l-2 border-warm-gray/20">
                                &ldquo;{donation.message}&rdquo;
                              </p>
                            )}
                            {donation.is_anonymous && (
                              <p className="font-body text-[10px] text-sepia-mid mt-2">{t('profile.anonymous')}</p>
                            )}
                          </EditorialCard>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'clothing' && (
                  <div role="tabpanel" id="panel-clothing" aria-labelledby="tab-clothing">
                    <p className="font-body text-body-sm text-ink-faded mb-5">
                      <Link to="/donate-clothing" className="text-rust hover:text-ink underline-offset-4">
                        {t('profile.newClothingIntake')}
                      </Link>
                    </p>
                    {loadingIntakes ? (
                      <p className="font-body text-caption text-ink-faded">{t('common.loading', 'Loading...')}</p>
                    ) : errorIntakes ? (
                      <p className="font-body text-caption text-rust">{t('profile.intakesError', 'Unable to load clothing intakes at the moment.')}</p>
                    ) : intakes.length === 0 ? (
                      <div className="border border-dashed border-warm-gray/30 rounded-xl p-10 text-center">
                        <div className="w-12 h-12 rounded-full bg-sage/10 flex items-center justify-center mx-auto mb-3">
                          <svg className="w-6 h-6 text-sage/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                          </svg>
                        </div>
                        <p className="font-body text-body-sm text-ink-faded mb-1">{t('profile.noIntakes', 'No intakes yet')}</p>
                        <p className="font-body text-caption text-sepia-light mb-4">
                          {t('profile.noIntakesDesc', 'Donate your pre-loved clothing to support upcycling')}
                        </p>
                        <Link to="/donate-clothing" className="inline-block font-body text-caption tracking-[0.1em] uppercase text-rust hover:text-ink transition-colors">
                          {t('profile.newClothingIntake')} &rarr;
                        </Link>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {intakes.map((row: ClothingIntake, index: number) => (
                          <EditorialCard
                            key={row.id}
                            title={(row.summary ?? '').slice(0, 48) + ((row.summary?.length ?? 0) > 48 ? '…' : '')}
                            subtitle={row.created_at}
                            index={index}
                            hoverEffect="border"
                          >
                            <p className={`font-body text-[10px] uppercase ${STATUS_COLORS[row.status] ?? 'text-sepia-mid'}`}>{t(`donateClothing.statusLabels.${row.status}`, row.status)}</p>
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
                    <p className="font-body text-body-sm text-ink-faded mb-5">
                      <Link to="/support" className="text-rust hover:text-ink underline-offset-4">
                        {t('profile.newTicket')}
                      </Link>
                    </p>
                    {loadingTickets ? (
                      <p className="font-body text-caption text-ink-faded">{t('common.loading', 'Loading...')}</p>
                    ) : errorTickets ? (
                      <p className="font-body text-caption text-rust">{t('profile.ticketsError', 'Unable to load support tickets at the moment.')}</p>
                    ) : tickets.length === 0 ? (
                      <div className="border border-dashed border-warm-gray/30 rounded-xl p-10 text-center">
                        <div className="w-12 h-12 rounded-full bg-warm-gray/10 flex items-center justify-center mx-auto mb-3">
                          <svg className="w-6 h-6 text-warm-gray/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
                          </svg>
                        </div>
                        <p className="font-body text-body-sm text-ink-faded mb-1">{t('profile.noTickets', 'No tickets yet')}</p>
                        <p className="font-body text-caption text-sepia-light mb-4">
                          {t('profile.noTicketsDesc', 'Need help? Submit an after-sales request for any order')}
                        </p>
                        <Link to="/support" className="inline-block font-body text-caption tracking-[0.1em] uppercase text-rust hover:text-ink transition-colors">
                          {t('profile.newTicket')} &rarr;
                        </Link>
                      </div>
                    ) : (
                      <div className="space-y-5">
                        {tickets.map((tk: AfterSaleTicket) => (
                          <div key={tk.id} className="space-y-2.5">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <Link
                                to={`/orders/${tk.order_id}`}
                                className="font-mono text-caption text-rust hover:text-ink transition-colors"
                              >
                                {tk.order_no || `#${tk.order_id}`} →
                              </Link>
                              {tk.reason && (
                                <p className="font-body text-caption text-ink-faded max-w-md truncate" title={tk.reason}>
                                  {tk.reason}
                                </p>
                              )}
                            </div>
                            <AfterSaleProgress ticket={tk} compact showReplacementLink />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Addresses tab */}
                {activeTab === 'addresses' && (
                  <div role="tabpanel" id="panel-addresses" aria-labelledby="tab-addresses">
                    <div className="flex items-center justify-between mb-6">
                      {!showAddressForm && (
                        <button
                          onClick={() => { resetAddressForm(); setShowAddressForm(true); }}
                          className="font-body text-caption tracking-[0.1em] uppercase text-rust hover:text-rust-light transition-colors cursor-pointer ml-auto"
                        >
                          + {t('profile.addresses.addAddress', 'Add address')}
                        </button>
                      )}
                    </div>

                    <AnimatePresence>
                      {showAddressForm && (
                        <motion.div
                          initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, height: 0 }}
                          className="border border-warm-gray/25 bg-paper rounded-xl p-5 mb-6 overflow-hidden"
                        >
                          <h3 className="font-body text-body-sm text-ink mb-4">
                            {editingAddress ? t('profile.addresses.editAddress', 'Edit address') : t('profile.addresses.addAddress', 'Add address')}
                          </h3>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                            <div>
                              <label htmlFor="addr-label" className="block font-body text-[10px] tracking-wider uppercase text-sepia-mid mb-1.5">{t('profile.addresses.label', 'Label')}</label>
                              <input id="addr-label" type="text" value={addressForm.label} onChange={(e) => setAddressForm({ ...addressForm, label: e.target.value })} placeholder={t('profile.addresses.labelPlaceholder', 'Home / Office')} className="w-full px-3 py-2 border border-warm-gray/30 bg-transparent font-body text-body-sm text-ink rounded-md focus:outline-none focus:border-rust/50" />
                            </div>
                            <div>
                              <label htmlFor="addr-recipient" className="block font-body text-[10px] tracking-wider uppercase text-sepia-mid mb-1.5">{t('profile.addresses.recipient', 'Recipient')}</label>
                              <input id="addr-recipient" type="text" value={addressForm.recipient_name} onChange={(e) => setAddressForm({ ...addressForm, recipient_name: e.target.value })} className="w-full px-3 py-2 border border-warm-gray/30 bg-transparent font-body text-body-sm text-ink rounded-md focus:outline-none focus:border-rust/50" />
                            </div>
                            <div>
                              <label htmlFor="addr-phone" className="block font-body text-[10px] tracking-wider uppercase text-sepia-mid mb-1.5">{t('profile.addresses.phone', 'Phone')}</label>
                              <input id="addr-phone" type="tel" value={addressForm.phone} onChange={(e) => setAddressForm({ ...addressForm, phone: e.target.value })} className="w-full px-3 py-2 border border-warm-gray/30 bg-transparent font-body text-body-sm text-ink rounded-md focus:outline-none focus:border-rust/50" />
                            </div>
                            <div>
                              <label htmlFor="addr-province" className="block font-body text-[10px] tracking-wider uppercase text-sepia-mid mb-1.5">{t('profile.addresses.province', 'Province')}</label>
                              <input id="addr-province" type="text" value={addressForm.province} onChange={(e) => setAddressForm({ ...addressForm, province: e.target.value })} className="w-full px-3 py-2 border border-warm-gray/30 bg-transparent font-body text-body-sm text-ink rounded-md focus:outline-none focus:border-rust/50" />
                            </div>
                            <div>
                              <label htmlFor="addr-city" className="block font-body text-[10px] tracking-wider uppercase text-sepia-mid mb-1.5">{t('profile.addresses.city', 'City')}</label>
                              <input id="addr-city" type="text" value={addressForm.city} onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })} className="w-full px-3 py-2 border border-warm-gray/30 bg-transparent font-body text-body-sm text-ink rounded-md focus:outline-none focus:border-rust/50" />
                            </div>
                            <div>
                              <label htmlFor="addr-district" className="block font-body text-[10px] tracking-wider uppercase text-sepia-mid mb-1.5">{t('profile.addresses.district', 'District')}</label>
                              <input id="addr-district" type="text" value={addressForm.district} onChange={(e) => setAddressForm({ ...addressForm, district: e.target.value })} className="w-full px-3 py-2 border border-warm-gray/30 bg-transparent font-body text-body-sm text-ink rounded-md focus:outline-none focus:border-rust/50" />
                            </div>
                            <div className="sm:col-span-2">
                              <label htmlFor="addr-detail" className="block font-body text-[10px] tracking-wider uppercase text-sepia-mid mb-1.5">{t('profile.addresses.detailAddress', 'Address')}</label>
                              <input id="addr-detail" type="text" value={addressForm.detail_address} onChange={(e) => setAddressForm({ ...addressForm, detail_address: e.target.value })} className="w-full px-3 py-2 border border-warm-gray/30 bg-transparent font-body text-body-sm text-ink rounded-md focus:outline-none focus:border-rust/50" />
                            </div>
                            <div>
                              <label htmlFor="addr-postal" className="block font-body text-[10px] tracking-wider uppercase text-sepia-mid mb-1.5">{t('profile.addresses.postalCode', 'Postal Code')}</label>
                              <input id="addr-postal" type="text" value={addressForm.postal_code} onChange={(e) => setAddressForm({ ...addressForm, postal_code: e.target.value })} className="w-full px-3 py-2 border border-warm-gray/30 bg-transparent font-body text-body-sm text-ink rounded-md focus:outline-none focus:border-rust/50" />
                            </div>
                            <div>
                              <label className="block font-body text-[10px] tracking-wider uppercase text-sepia-mid mb-1.5">{t('checkout.country', 'Country')}</label>
                              <select value={addressForm.country} onChange={(e) => setAddressForm({ ...addressForm, country: e.target.value })} className="w-full px-3 py-2 border border-warm-gray/30 bg-transparent font-body text-body-sm text-ink rounded-md focus:outline-none focus:border-rust/50 cursor-pointer">
                                <option value="China">China</option>
                                <option value="United States">United States</option>
                                <option value="Japan">Japan</option>
                                <option value="South Korea">South Korea</option>
                                <option value="United Kingdom">United Kingdom</option>
                                <option value="Germany">Germany</option>
                                <option value="France">France</option>
                                <option value="Australia">Australia</option>
                                <option value="Canada">Canada</option>
                                <option value="Singapore">Singapore</option>
                                <option value="Hong Kong">Hong Kong</option>
                                <option value="Taiwan">Taiwan</option>
                              </select>
                            </div>
                            <div className="flex items-end">
                              <label className="flex items-center gap-2 cursor-pointer">
                                <input type="checkbox" checked={addressForm.is_default} onChange={(e) => setAddressForm({ ...addressForm, is_default: e.target.checked })} className="accent-rust" />
                                <span className="font-body text-caption text-ink">{t('profile.addresses.setDefault', 'Set as default')}</span>
                              </label>
                            </div>
                          </div>
                          <div className="flex gap-3 mt-5">
                            <button onClick={handleSaveAddress} disabled={!addressForm.recipient_name || !addressForm.phone || !addressForm.province || !addressForm.city || !addressForm.detail_address} className="font-body text-body-sm tracking-wide bg-ink text-paper px-6 py-2.5 rounded-full hover:bg-rust transition-colors cursor-pointer disabled:opacity-40">
                              {t('common.save', 'Save')}
                            </button>
                            <button onClick={resetAddressForm} className="font-body text-body-sm tracking-wide text-sepia-mid hover:text-ink transition-colors cursor-pointer">
                              {t('common.cancel', 'Cancel')}
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {addressError ? (
                      <p className="font-body text-caption text-rust">{t('common.error', 'Failed to load addresses')}</p>
                    ) : loadingAddresses ? (
                      <p className="font-body text-caption text-ink-faded">{t('common.loading', 'Loading...')}</p>
                    ) : addresses.length === 0 && !showAddressForm ? (
                      <div className="border border-dashed border-warm-gray/30 rounded-xl p-10 text-center">
                        <div className="w-12 h-12 rounded-full bg-warm-gray/10 flex items-center justify-center mx-auto mb-3">
                          <svg className="w-6 h-6 text-warm-gray/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                        </div>
                        <p className="font-body text-body-sm text-ink-faded mb-1">
                          {t('profile.addresses.noAddresses', 'No saved addresses')}
                        </p>
                        <p className="font-body text-caption text-sepia-light">
                          {t('profile.addresses.noAddressesDesc', 'Add a shipping address for faster checkout')}
                        </p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {addresses.map((addr) => (
                          <div key={addr.id} className="border border-warm-gray/20 bg-paper rounded-xl p-4 hover:border-rust/20 transition-colors">
                            <div className="flex items-center justify-between mb-2.5">
                              <div className="flex items-center gap-2">
                                {addr.label && (
                                  <span className="font-body text-[10px] tracking-[0.1em] uppercase text-sepia-mid bg-warm-gray/15 px-2 py-0.5 rounded-full">
                                    {addr.label}
                                  </span>
                                )}
                                {addr.is_default && (
                                  <span className="font-body text-[10px] tracking-wider uppercase text-sage border border-sage/30 bg-sage/5 px-2 py-0.5 rounded-full">
                                    {t('profile.addresses.defaultBadge', 'Default')}
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-2.5">
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
              </div>
            </motion.div>
          </div>
        </div>
      </PaperTextureBackground>

      <OrderReviewModal
        order={reviewOrder}
        initialProductId={reviewProductId}
        onClose={() => {
          setReviewOrder(null);
          setReviewProductId(null);
        }}
      />

      <ProfileSettingsModal
        key={user.id}
        user={user}
        open={showSettings}
        onClose={() => setShowSettings(false)}
        onError={setErrorMessage}
      />
    </PageWrapper>
  );
}
