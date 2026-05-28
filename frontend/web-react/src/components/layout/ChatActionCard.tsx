import React from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import type { ActionCard } from '@/utils/aiContent';
import { impactProductPath } from '@/utils/productPaths';

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

// ── Traceability Timeline ──
interface TraceStage {
  stage?: string;
  location?: string;
  description?: string;
  date?: string;
  verified?: boolean;
  carbon?: string | number;
}

const TraceabilityCard: React.FC<{ data: Record<string, unknown> }> = ({ data }) => {
  const { t, i18n } = useTranslation();
  const stages = (data.stages as TraceStage[] | undefined) ?? [];
  const productName = (data.productName as string | undefined) ?? '';
  const productId = data.productId as number | undefined;

  if (stages.length === 0) {
    return (
      <div style={cardBase}>
        <p className="text-[12px] font-semibold mb-2" style={{ color: 'var(--color-ink)' }}>
          {t('aiAssistant.actionCard.traceability', 'Supply Chain Traceability')}
        </p>
        <p className="text-[11px]" style={{ color: 'var(--color-ink-faded)' }}>--</p>
      </div>
    );
  }

  return (
    <div style={cardBase}>
      <div className="flex items-center justify-between mb-3">
        <p className="text-[12px] font-semibold" style={{ color: 'var(--color-ink)' }}>
          {t('aiAssistant.actionCard.traceability', 'Supply Chain Traceability')}
        </p>
        {productId && (
          <Link
            to={impactProductPath(productId)}
            className="text-[10px] underline underline-offset-2"
            style={{ color: 'var(--color-rust)' }}
          >
            {t('aiAssistant.actionCard.viewDetails', 'View Details')} →
          </Link>
        )}
      </div>

      {productName && (
        <p className="text-[11px] mb-3" style={{ color: 'var(--color-ink-faded)' }}>
          {productName}
        </p>
      )}

      {/* Compact vertical timeline */}
      <div className="relative pl-5">
        {/* Vertical line */}
        <div
          className="absolute left-[5px] top-1 bottom-1 w-px"
          style={{ background: 'linear-gradient(to bottom, var(--color-warm-gray), transparent)' }}
        />

        <div className="space-y-3">
          {stages.map((stage, i) => (
            <div key={i} className="relative">
              {/* Dot */}
              <div
                className="absolute left-[-17px] top-[3px] w-2 h-2 rounded-full border border-paper"
                style={{
                  background: stage.verified ? 'var(--color-sage)' : 'var(--color-warm-gray)',
                  boxShadow: '0 0 0 1px rgba(0,0,0,0.08)',
                }}
              />

              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[11px] font-medium" style={{ color: 'var(--color-ink)' }}>
                      {stage.stage || '—'}
                    </span>
                    {stage.verified && (
                      <span
                        className="text-[8px] px-1 py-0.5 rounded-full"
                        style={{
                          background: 'var(--color-sage)',
                          color: '#fff',
                          letterSpacing: '0.04em',
                        }}
                      >
                        ✓
                      </span>
                    )}
                  </div>
                  {stage.location && (
                    <p className="text-[10px] mt-0.5" style={{ color: 'var(--color-ink-faded)' }}>
                      {stage.location}
                    </p>
                  )}
                  {stage.description && (
                    <p className="text-[10px] mt-1 leading-snug" style={{ color: 'var(--color-ink-faded)' }}>
                      {stage.description}
                    </p>
                  )}
                </div>
                <div className="flex-shrink-0 text-right">
                  {stage.date && (
                    <p className="text-[9px]" style={{ color: 'var(--color-ink-faded)' }}>
                      {new Date(stage.date).toLocaleDateString(i18n.language === 'zh' ? 'zh-CN' : 'en-US', { month: 'short', day: 'numeric' })}
                    </p>
                  )}
                  {stage.carbon != null && (
                    <p className="text-[9px] mt-0.5" style={{ color: 'var(--color-sage)' }}>
                      {Number(stage.carbon)}kg CO₂
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
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
    case 'impact-fund':
      return <ImpactFundCard data={card.data} />;
    case 'traceability':
      return <TraceabilityCard data={card.data} />;
    default:
      return null;
  }
});
