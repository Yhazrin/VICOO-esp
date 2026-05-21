import React from 'react';
import { useTranslation } from 'react-i18next';
import type { ActionCard } from '@/utils/aiContent';

// ── Glass card base style ──
const cardBase: React.CSSProperties = {
  borderRadius: 12,
  background: 'rgba(255, 255, 255, 0.55)',
  backdropFilter: 'blur(8px)',
  WebkitBackdropFilter: 'blur(8px)',
  border: '1px solid rgba(0, 0, 0, 0.06)',
  padding: '12px 14px',
  marginTop: 8,
  marginBottom: 8,
};

// ── Donation List ──
const DonationListCard: React.FC<{ data: Record<string, unknown> }> = ({ data }) => {
  const { t } = useTranslation();
  const items = (data.items ?? []) as Array<{ name?: string; amount?: number; date?: string }>;

  return (
    <div style={cardBase}>
      <p className="text-[12px] font-semibold mb-2" style={{ color: 'var(--color-ink)' }}>
        {t('aiAssistant.actionCard.donationList')}
      </p>
      {items.length === 0 ? (
        <p className="text-[11px]" style={{ color: 'var(--color-ink-faded)' }}>--</p>
      ) : (
        <div className="space-y-1.5">
          {items.map((item, i) => (
            <div key={i} className="flex items-center justify-between">
              <span className="text-[12px]" style={{ color: 'var(--color-ink)' }}>
                {item.name || '--'}
              </span>
              <div className="flex items-center gap-2">
                {item.date && (
                  <span className="text-[10px]" style={{ color: 'var(--color-ink-faded)' }}>{item.date}</span>
                )}
                <span
                  className="text-[11px] font-medium px-2 py-0.5 rounded-full"
                  style={{ background: 'rgba(0,0,0,0.05)', color: 'var(--color-ink)' }}
                >
                  {item.amount != null ? `¥${item.amount.toLocaleString()}` : '--'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ── Campaign Progress ──
interface CampaignItem {
  name?: string;
  title?: string;
  raised?: number;
  goal?: number;
  participants?: number;
}

const CampaignProgressCard: React.FC<{ data: Record<string, unknown> }> = ({ data }) => {
  const { t } = useTranslation();

  // Support both single-campaign and items-array formats
  const items: CampaignItem[] = Array.isArray(data.items)
    ? data.items as CampaignItem[]
    : [data as unknown as CampaignItem];

  return (
    <div style={cardBase}>
      <p className="text-[12px] font-semibold mb-2" style={{ color: 'var(--color-ink)' }}>
        {t('aiAssistant.actionCard.campaignProgress')}
      </p>
      <div className="space-y-3">
        {items.map((item, i) => {
          const name = item.name || item.title || '';
          const goal = Number(item.goal ?? 0);
          const raised = Number(item.raised ?? 0);
          const participants = Number(item.participants ?? 0);
          const progress = goal > 0 ? Math.min((raised / goal) * 100, 100) : 0;

          return (
            <div key={i}>
              {name && (
                <p className="text-[12px] font-medium mb-1" style={{ color: 'var(--color-ink)' }}>{name}</p>
              )}
              <div style={{ height: 5, borderRadius: 3, background: 'rgba(0,0,0,0.06)', overflow: 'hidden', marginBottom: 4 }}>
                <div style={{ width: `${progress}%`, height: '100%', borderRadius: 3, background: 'var(--color-rust)', transition: 'width 0.6s ease' }} />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[10px]" style={{ color: 'var(--color-ink-faded)' }}>
                  ¥{raised.toLocaleString()} / ¥{goal.toLocaleString()}
                </span>
                <span className="text-[10px]" style={{ color: 'var(--color-ink-faded)' }}>
                  {Math.round(progress)}% &middot; {participants} {t('aiAssistant.campaignCard.participants', { count: participants })}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ── Impact Fund ──
const ImpactFundCard: React.FC<{ data: Record<string, unknown> }> = ({ data }) => {
  const { t } = useTranslation();
  const artist = Number(data.artistShare ?? 0);
  const school = Number(data.schoolShare ?? 0);
  const charity = Number(data.charityShare ?? 0);
  const total = Number(data.total ?? (artist + school + charity));
  const pctA = total > 0 ? (artist / total) * 100 : 0;
  const pctS = total > 0 ? (school / total) * 100 : 0;
  const pctC = total > 0 ? (charity / total) * 100 : 0;

  const segments = [
    { pct: pctA, label: 'Artist', color: 'var(--color-rust)' },
    { pct: pctS, label: 'School', color: 'rgba(0,0,0,0.25)' },
    { pct: pctC, label: 'Charity', color: 'rgba(0,0,0,0.12)' },
  ];

  return (
    <div style={cardBase}>
      <p className="text-[12px] font-semibold mb-2" style={{ color: 'var(--color-ink)' }}>
        {t('aiAssistant.actionCard.impactFund')}
      </p>
      {/* Segmented bar */}
      <div className="flex rounded-full overflow-hidden mb-2" style={{ height: 8 }}>
        {segments.map((s, i) => (
          <div
            key={i}
            style={{ width: `${s.pct}%`, background: s.color, transition: 'width 0.6s ease' }}
          />
        ))}
      </div>
      <div className="flex items-center justify-between">
        {segments.map((s, i) => (
          <span key={i} className="text-[10px] flex items-center gap-1" style={{ color: 'var(--color-ink-faded)' }}>
            <span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: s.color }} />
            {s.label} {Math.round(s.pct)}%
          </span>
        ))}
      </div>
      {total > 0 && (
        <p className="text-[11px] mt-1.5" style={{ color: 'var(--color-ink-faded)' }}>
          Total: ¥{total.toLocaleString()}
        </p>
      )}
    </div>
  );
};

// ── Router ──
interface ChatActionCardProps {
  card: ActionCard;
}

export const ChatActionCard: React.FC<ChatActionCardProps> = React.memo(({ card }) => {
  switch (card.type) {
    case 'donation-list':
      return <DonationListCard data={card.data} />;
    case 'campaign-progress':
      return <CampaignProgressCard data={card.data} />;
    case 'impact-fund':
      return <ImpactFundCard data={card.data} />;
    default:
      return null;
  }
});
