import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, useReducedMotion } from 'framer-motion';
import type { OrderDetail } from '@/services/orders';
import type { Donation } from '@/types';
import type { ClothingIntake } from '@/services/clothingIntakes';
import type { AfterSaleTicket } from '@/services/afterSales';
import type { TabKey } from './useProfileTabs';

interface ProfileOverviewProps {
  orders: OrderDetail[];
  donations: Donation[];
  intakes: ClothingIntake[];
  tickets: AfterSaleTicket[];
  isLoading: boolean;
  onNavigateTab: (tab: TabKey, orderStatus?: string) => void;
}

function StatCard({
  label,
  value,
  accent,
  onClick,
  prefersReducedMotion,
}: {
  label: string;
  value: number | string;
  accent?: boolean;
  onClick?: () => void;
  prefersReducedMotion: boolean | null;
}) {
  const Tag = onClick ? 'button' : 'div';
  return (
    <motion.div whileHover={prefersReducedMotion || !onClick ? undefined : { y: -2 }}>
      <Tag
        type={onClick ? 'button' : undefined}
        onClick={onClick}
        className={`border border-warm-gray/25 bg-paper p-5 text-left w-full ${
          onClick ? 'hover:border-rust/30 cursor-pointer transition-colors' : ''
        } ${accent ? 'border-rust/30 bg-rust/5' : ''}`}
      >
        <p className="font-display text-2xl font-bold text-ink">{value}</p>
        <p className="font-body text-caption text-sepia-mid mt-1">{label}</p>
      </Tag>
    </motion.div>
  );
}

export default function ProfileOverview({
  orders,
  donations,
  intakes,
  tickets,
  isLoading,
  onNavigateTab,
}: ProfileOverviewProps) {
  const { t } = useTranslation();
  const prefersReducedMotion = useReducedMotion();

  const pendingOrders = orders.filter((o) => o.status === 'pending').length;
  const shippedOrders = orders.filter((o) => o.status === 'shipped').length;
  const activeTickets = tickets.filter((tk) => tk.status === 'open' || tk.status === 'in_progress').length;
  const activeIntakes = intakes.filter((i) =>
    ['submitted', 'received', 'processing'].includes(i.status),
  ).length;

  const totalDonation = donations
    .filter((d) => d.status === 'completed')
    .reduce((sum, d) => sum + Number(d.amount), 0);
  const donationCurrency = donations.find((d) => d.status === 'completed')?.currency ?? 'CNY';
  const donationSymbol = donationCurrency === 'CNY' ? '¥' : '$';

  const quickLinks: { label: string; to: string }[] = [
    { label: t('profile.overview.linkShop', 'Browse Shop'), to: '/shop' },
    { label: t('profile.overview.linkClothing', 'Donate Clothing'), to: '/donate-clothing' },
    { label: t('profile.overview.linkDonate', 'Make a Donation'), to: '/donate' },
  ];

  if (isLoading) {
    return (
      <p className="font-body text-body-sm text-ink-faded">{t('common.loading', 'Loading...')}</p>
    );
  }

  return (
    <div role="tabpanel" id="panel-overview" aria-labelledby="tab-overview">
      <h2 className="font-display text-h3 font-bold text-ink mb-2">
        {t('profile.overview.title', 'Overview')}
      </h2>
      <p className="font-body text-body-sm text-ink-faded mb-8">
        {t('profile.overview.subtitle', 'Your activity at a glance')}
      </p>

      {(pendingOrders > 0 || shippedOrders > 0 || activeTickets > 0) && (
        <div className="mb-8">
          <h3 className="font-body text-overline tracking-[0.15em] uppercase text-sepia-mid mb-4">
            {t('profile.overview.actionRequired', 'Needs attention')}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {pendingOrders > 0 && (
              <StatCard
                label={t('profile.overview.pendingPayment', 'Pending payment')}
                value={pendingOrders}
                accent
                onClick={() => onNavigateTab('orders', 'pending')}
                prefersReducedMotion={prefersReducedMotion}
              />
            )}
            {shippedOrders > 0 && (
              <StatCard
                label={t('profile.overview.awaitingDelivery', 'Awaiting delivery')}
                value={shippedOrders}
                onClick={() => onNavigateTab('orders', 'shipped')}
                prefersReducedMotion={prefersReducedMotion}
              />
            )}
            {activeTickets > 0 && (
              <StatCard
                label={t('profile.overview.activeSupport', 'Active support tickets')}
                value={activeTickets}
                onClick={() => onNavigateTab('support')}
                prefersReducedMotion={prefersReducedMotion}
              />
            )}
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-10">
        <StatCard
          label={t('profile.tabs.orders', 'My Orders')}
          value={orders.length}
          onClick={() => onNavigateTab('orders')}
          prefersReducedMotion={prefersReducedMotion}
        />
        <StatCard
          label={t('profile.overview.totalDonated', 'Total donated')}
          value={donations.length > 0 ? `${donationSymbol}${totalDonation.toFixed(0)}` : `${donationSymbol}0`}
          onClick={() => onNavigateTab('donations')}
          prefersReducedMotion={prefersReducedMotion}
        />
        <StatCard
          label={t('profile.tabs.clothing', 'Clothing')}
          value={intakes.length}
          onClick={() => onNavigateTab('clothing')}
          prefersReducedMotion={prefersReducedMotion}
        />
      </div>

      {activeIntakes > 0 && (
        <div className="border border-warm-gray/20 bg-paper/60 p-5 mb-10">
          <p className="font-body text-body-sm text-ink">
            {t('profile.overview.intakesInProgress', '{{count}} clothing donation(s) in progress', {
              count: activeIntakes,
            })}
          </p>
        </div>
      )}

      <h3 className="font-body text-overline tracking-[0.15em] uppercase text-sepia-mid mb-4">
        {t('profile.overview.quickLinks', 'Quick links')}
      </h3>
      <div className="flex flex-wrap gap-3">
        {quickLinks.map((link) => (
          <Link
            key={link.to}
            to={link.to}
            className="font-body text-caption tracking-[0.1em] uppercase border border-warm-gray/30 px-4 py-2 text-ink hover:border-rust/40 hover:text-rust transition-colors"
          >
            {link.label} →
          </Link>
        ))}
      </div>
    </div>
  );
}
