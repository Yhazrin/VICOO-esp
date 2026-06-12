import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, useReducedMotion } from 'framer-motion';
import type { OrderDetail } from '@/services/orders';
import type { Donation } from '@/types';
import type { ClothingIntake } from '@/services/clothingIntakes';
import type { AfterSaleTicket } from '@/services/afterSales';
import type { TabKey } from './useProfileTabs';
import { formatDate } from '@/utils/dateTime';

interface ProfileOverviewProps {
  orders: OrderDetail[];
  donations: Donation[];
  intakes: ClothingIntake[];
  tickets: AfterSaleTicket[];
  isLoading: boolean;
  onNavigateTab: (tab: TabKey, orderStatus?: string) => void;
}

function currencySymbol(paymentMethod?: string | null) {
  return paymentMethod === 'paypal' || paymentMethod === 'stripe' ? '$' : '¥';
}

export default function ProfileOverview({
  orders,
  donations,
  intakes,
  tickets,
  isLoading,
  onNavigateTab,
}: ProfileOverviewProps) {
  const { t, i18n } = useTranslation();
  const prefersReducedMotion = useReducedMotion();

  // Derived stats
  const totalOrders = orders.length;
  const pendingOrders = orders.filter((o) => o.status === 'pending').length;
  const shippedOrders = orders.filter((o) => o.status === 'shipped').length;
  const completedOrders = orders.filter((o) => o.status === 'completed').length;
  const activeTickets = tickets.filter((tk) => tk.status === 'open' || tk.status === 'in_progress').length;
  const activeIntakes = intakes.filter((i) =>
    ['submitted', 'received', 'processing'].includes(i.status),
  ).length;

  const totalDonation = donations
    .filter((d) => d.status === 'completed')
    .reduce((sum, d) => sum + Number(d.amount), 0);
  const donationCurrency = donations.find((d) => d.status === 'completed')?.currency ?? 'CNY';
  const donationSymbol = donationCurrency === 'CNY' ? '¥' : '$';

  // Recent orders (last 3)
  const recentOrders = [...orders]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 3);

  // Recent donations (last 3)
  const recentDonations = [...donations]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 3);

  if (isLoading) {
    return (
      <div className="space-y-5 animate-pulse">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 rounded-xl bg-warm-gray/10" />
          ))}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-28 rounded-xl bg-warm-gray/10" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div role="tabpanel" id="panel-overview" aria-labelledby="tab-overview" className="space-y-6">
      {/* ── Needs Attention ── */}
      {(pendingOrders > 0 || shippedOrders > 0 || activeTickets > 0) && (
        <motion.div
          initial={prefersReducedMotion ? false : { opacity: 0, y: 8 }}
          animate={prefersReducedMotion ? undefined : { opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <p className="font-body text-overline tracking-[0.2em] uppercase text-rust mb-3">
            {t('profile.overview.actionRequired', 'Needs attention')}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {pendingOrders > 0 && (
              <button
                onClick={() => onNavigateTab('orders', 'pending')}
                className="cursor-pointer text-left border border-rust/25 bg-rust/5 rounded-xl px-4 py-3.5 hover:border-rust/40 transition-colors"
              >
                <span className="font-display text-2xl font-bold text-rust block">{pendingOrders}</span>
                <span className="font-body text-caption text-sepia-mid">
                  {t('profile.overview.pendingPayment', 'Pending payment')}
                </span>
              </button>
            )}
            {shippedOrders > 0 && (
              <button
                onClick={() => onNavigateTab('orders', 'shipped')}
                className="cursor-pointer text-left border border-archive-brown/25 bg-archive-brown/5 rounded-xl px-4 py-3.5 hover:border-archive-brown/40 transition-colors"
              >
                <span className="font-display text-2xl font-bold text-archive-brown block">{shippedOrders}</span>
                <span className="font-body text-caption text-sepia-mid">
                  {t('profile.overview.awaitingDelivery', 'Awaiting delivery')}
                </span>
              </button>
            )}
            {activeTickets > 0 && (
              <button
                onClick={() => onNavigateTab('support')}
                className="cursor-pointer text-left border border-pale-gold/25 bg-pale-gold/5 rounded-xl px-4 py-3.5 hover:border-pale-gold/40 transition-colors"
              >
                <span className="font-display text-2xl font-bold text-pale-gold block">{activeTickets}</span>
                <span className="font-body text-caption text-sepia-mid">
                  {t('profile.overview.activeSupport', 'Active tickets')}
                </span>
              </button>
            )}
          </div>
        </motion.div>
      )}

      {/* ── Stats Overview Grid ── */}
      <motion.div
        initial={prefersReducedMotion ? false : { opacity: 0, y: 8 }}
        animate={prefersReducedMotion ? undefined : { opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.05 }}
      >
        <p className="font-body text-overline tracking-[0.2em] uppercase text-sepia-mid mb-3">
          {t('profile.overview.summary', 'Account summary')}
        </p>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Total orders */}
          <button
            onClick={() => onNavigateTab('orders')}
            className="cursor-pointer text-left border border-warm-gray/20 rounded-xl px-4 py-4 hover:border-rust/25 transition-colors group"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="font-body text-overline tracking-[0.15em] uppercase text-ink-faded">
                {t('profile.tabs.orders', 'Orders')}
              </span>
              <svg className="w-4 h-4 text-warm-gray/50 group-hover:text-rust transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
              </svg>
            </div>
            <span className="font-display text-3xl font-bold text-ink block">{totalOrders}</span>
            <span className="font-body text-[11px] text-ink-faded mt-1 block">
              {completedOrders > 0
                ? t('profile.overview.ordersCompleted', '{{count}} completed', { count: completedOrders })
                : t('profile.overview.noOrdersYet', 'No orders yet')}
            </span>
          </button>

          {/* Donations */}
          <button
            onClick={() => onNavigateTab('donations')}
            className="cursor-pointer text-left border border-warm-gray/20 rounded-xl px-4 py-4 hover:border-sage/25 transition-colors group"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="font-body text-overline tracking-[0.15em] uppercase text-ink-faded">
                {t('profile.tabs.donations', 'Donations')}
              </span>
              <svg className="w-4 h-4 text-warm-gray/50 group-hover:text-sage transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
              </svg>
            </div>
            <span className="font-display text-3xl font-bold text-ink block">
              {donations.length > 0 ? `${donationSymbol}${totalDonation.toFixed(0)}` : `${donationSymbol}0`}
            </span>
            <span className="font-body text-[11px] text-ink-faded mt-1 block">
              {donations.length > 0
                ? t('profile.overview.donationCount', '{{count}} donation(s)', { count: donations.length })
                : t('profile.overview.noDonationsYet', 'No donations yet')}
            </span>
          </button>

          {/* Clothing intakes */}
          <button
            onClick={() => onNavigateTab('clothing')}
            className="cursor-pointer text-left border border-warm-gray/20 rounded-xl px-4 py-4 hover:border-sage/25 transition-colors group"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="font-body text-overline tracking-[0.15em] uppercase text-ink-faded">
                {t('profile.tabs.clothing', 'Clothing')}
              </span>
              <svg className="w-4 h-4 text-warm-gray/50 group-hover:text-sage transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
              </svg>
            </div>
            <span className="font-display text-3xl font-bold text-ink block">{intakes.length}</span>
            <span className="font-body text-[11px] text-ink-faded mt-1 block">
              {activeIntakes > 0
                ? t('profile.overview.intakesInProgress', '{{count}} in progress', { count: activeIntakes })
                : t('profile.overview.noIntakesYet', 'No donations yet')}
            </span>
          </button>

          {/* Support tickets */}
          <button
            onClick={() => onNavigateTab('support')}
            className="cursor-pointer text-left border border-warm-gray/20 rounded-xl px-4 py-4 hover:border-pale-gold/25 transition-colors group"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="font-body text-overline tracking-[0.15em] uppercase text-ink-faded">
                {t('profile.tabs.support', 'Support')}
              </span>
              <svg className="w-4 h-4 text-warm-gray/50 group-hover:text-pale-gold transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
              </svg>
            </div>
            <span className="font-display text-3xl font-bold text-ink block">{tickets.length}</span>
            <span className="font-body text-[11px] text-ink-faded mt-1 block">
              {activeTickets > 0
                ? t('profile.overview.ticketsActive', '{{count}} active', { count: activeTickets })
                : t('profile.overview.noTicketsYet', 'No tickets yet')}
            </span>
          </button>
        </div>
      </motion.div>

      {/* ── Action Tiles ── */}
      <motion.div
        initial={prefersReducedMotion ? false : { opacity: 0, y: 8 }}
        animate={prefersReducedMotion ? undefined : { opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        <p className="font-body text-overline tracking-[0.2em] uppercase text-sepia-mid mb-3">
          {t('profile.overview.quickActions', 'Quick actions')}
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Browse Shop */}
          <Link
            to="/shop"
            className="group border border-warm-gray/20 rounded-xl p-4 hover:border-rust/25 hover:bg-rust/[0.02] transition-all"
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-ink/5 flex items-center justify-center flex-shrink-0 group-hover:bg-rust/10 transition-colors">
                <svg className="w-5 h-5 text-ink-light group-hover:text-rust transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
              </div>
              <div className="min-w-0">
                <p className="font-body text-body-sm text-ink font-medium">
                  {t('profile.overview.linkShop', 'Browse Shop')}
                </p>
                <p className="font-body text-caption text-ink-faded mt-0.5">
                  {t('profile.overview.linkShopDesc', 'Explore wearable art made from children\'s creativity')}
                </p>
              </div>
            </div>
          </Link>

          {/* Donate Clothing */}
          <Link
            to="/donate-clothing"
            className="group border border-warm-gray/20 rounded-xl p-4 hover:border-sage/25 hover:bg-sage/[0.02] transition-all"
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-ink/5 flex items-center justify-center flex-shrink-0 group-hover:bg-sage/10 transition-colors">
                <svg className="w-5 h-5 text-ink-light group-hover:text-sage transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
              <div className="min-w-0">
                <p className="font-body text-body-sm text-ink font-medium">
                  {t('profile.overview.linkClothing', 'Donate Clothing')}
                </p>
                <p className="font-body text-caption text-ink-faded mt-0.5">
                  {t('profile.overview.linkClothingDesc', 'Give old clothes a new life through upcycling')}
                </p>
              </div>
            </div>
          </Link>

          {/* Make a Donation */}
          <Link
            to="/donate"
            className="group border border-warm-gray/20 rounded-xl p-4 hover:border-sage/25 hover:bg-sage/[0.02] transition-all"
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-ink/5 flex items-center justify-center flex-shrink-0 group-hover:bg-sage/10 transition-colors">
                <svg className="w-5 h-5 text-ink-light group-hover:text-sage transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="min-w-0">
                <p className="font-body text-body-sm text-ink font-medium">
                  {t('profile.overview.linkDonate', 'Make a Donation')}
                </p>
                <p className="font-body text-caption text-ink-faded mt-0.5">
                  {t('profile.overview.linkDonateDesc', 'Support children\'s creative programs directly')}
                </p>
              </div>
            </div>
          </Link>
        </div>
      </motion.div>

      {/* ── Recent Activity ── */}
      <motion.div
        initial={prefersReducedMotion ? false : { opacity: 0, y: 8 }}
        animate={prefersReducedMotion ? undefined : { opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.15 }}
      >
        <div className="flex items-center justify-between mb-3">
          <p className="font-body text-overline tracking-[0.2em] uppercase text-sepia-mid">
            {t('profile.overview.recentActivity', 'Recent activity')}
          </p>
          {orders.length > 0 && (
            <button
              onClick={() => onNavigateTab('orders')}
              className="font-body text-caption text-rust hover:text-ink transition-colors cursor-pointer"
            >
              {t('profile.overview.viewAll', 'View all')} &rarr;
            </button>
          )}
        </div>

        {recentOrders.length === 0 && recentDonations.length === 0 ? (
          /* Empty state */
          <div className="border border-dashed border-warm-gray/30 rounded-xl p-8 text-center">
            <div className="w-12 h-12 rounded-full bg-warm-gray/10 flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6 text-warm-gray/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>
            <p className="font-body text-body-sm text-ink-faded mb-1">
              {t('profile.overview.noActivity', 'No activity yet')}
            </p>
            <p className="font-body text-caption text-sepia-light max-w-xs mx-auto">
              {t('profile.overview.noActivityDesc', 'Your orders, donations, and clothing contributions will appear here')}
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {recentOrders.map((order) => (
              <Link
                key={`order-${order.id}`}
                to={`/orders/${order.id}`}
                className="flex items-center gap-4 border border-warm-gray/15 rounded-xl px-4 py-3 hover:border-rust/20 transition-colors group"
              >
                <div className="w-9 h-9 rounded-lg bg-ink/5 flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4 text-ink-light" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-mono text-caption text-sepia-mid truncate">{order.order_no}</p>
                  <p className="font-body text-[11px] text-ink-faded">
                    {formatDate(order.created_at, i18n.language)}
                  </p>
                </div>
                <span className={`font-body text-overline tracking-[0.1em] uppercase px-2 py-0.5 rounded-full border flex-shrink-0 ${
                  order.status === 'completed' ? 'text-sage border-sage/30 bg-sage/5' :
                  order.status === 'cancelled' ? 'text-rust border-rust/30 bg-rust/5' :
                  order.status === 'shipped' ? 'text-archive-brown border-archive-brown/30 bg-archive-brown/5' :
                  'text-sepia-mid border-warm-gray/30 bg-warm-gray/5'
                }`}>
                  {order.status}
                </span>
                <span className="font-mono text-caption text-ink flex-shrink-0">
                  {currencySymbol(order.payment_method)}{Number(order.total_amount).toFixed(2)}
                </span>
                <svg className="w-4 h-4 text-warm-gray/40 group-hover:text-rust transition-colors flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            ))}

            {recentDonations.map((donation) => (
              <Link
                key={`donation-${donation.id}`}
                to="/profile?tab=donations"
                className="flex items-center gap-4 border border-warm-gray/15 rounded-xl px-4 py-3 hover:border-sage/20 transition-colors group"
              >
                <div className="w-9 h-9 rounded-lg bg-sage/5 flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4 text-sage" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-body text-caption text-ink">
                    {t('profile.overview.donationLabel', 'Donation')}
                  </p>
                  <p className="font-body text-[11px] text-ink-faded">
                    {formatDate(donation.created_at, i18n.language)}
                  </p>
                </div>
                <span className={`font-body text-overline tracking-[0.1em] uppercase px-2 py-0.5 rounded-full border flex-shrink-0 ${
                  donation.status === 'completed' ? 'text-sage border-sage/30 bg-sage/5' :
                  'text-sepia-mid border-warm-gray/30 bg-warm-gray/5'
                }`}>
                  {donation.status}
                </span>
                <span className="font-mono text-caption text-ink flex-shrink-0">
                  {donation.currency} {Number(donation.amount).toFixed(2)}
                </span>
                <svg className="w-4 h-4 text-warm-gray/40 group-hover:text-sage transition-colors flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            ))}
          </div>
        )}
      </motion.div>

      {/* ── Impact Summary (always visible) ── */}
      <motion.div
        initial={prefersReducedMotion ? false : { opacity: 0, y: 8 }}
        animate={prefersReducedMotion ? undefined : { opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.2 }}
        className="border border-warm-gray/15 rounded-xl p-5 bg-gradient-to-br from-warm-gray/[0.04] to-transparent"
      >
        <p className="font-body text-overline tracking-[0.2em] uppercase text-sepia-mid mb-3">
          {t('profile.overview.yourImpact', 'Your impact')}
        </p>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <span className="font-display text-2xl font-bold text-ink block">
              {totalOrders}
            </span>
            <span className="font-body text-caption text-ink-faded">
              {t('profile.overview.impactOrders', 'Orders')}
            </span>
          </div>
          <div>
            <span className="font-display text-2xl font-bold text-sage block">
              {donations.length > 0 ? `${donationSymbol}${totalDonation.toFixed(0)}` : `${donationSymbol}0`}
            </span>
            <span className="font-body text-caption text-ink-faded">
              {t('profile.overview.impactDonated', 'Donated')}
            </span>
          </div>
          <div>
            <span className="font-display text-2xl font-bold text-ink block">
              {intakes.length}
            </span>
            <span className="font-body text-caption text-ink-faded">
              {t('profile.overview.impactClothing', 'Clothing')}
            </span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
