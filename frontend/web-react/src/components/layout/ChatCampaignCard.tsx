import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { campaignsApi } from '@/services/campaigns';
import type { Campaign } from '@/types';

// ── Campaign URL matching ──
const CAMPAIGN_PATH_RE = /^\/campaigns\/(\d+)$/;

export function extractCampaignId(href: string): number | null {
  try {
    const url = href.startsWith('http') ? new URL(href) : new URL(href, window.location.origin);
    const match = url.pathname.match(CAMPAIGN_PATH_RE);
    return match ? Number(match[1]) : null;
  } catch {
    return null;
  }
}

// ── Module-level cache ──
const campaignCache = new Map<number, Campaign>();

async function fetchCampaignCached(id: number): Promise<Campaign> {
  if (campaignCache.has(id)) return campaignCache.get(id)!;
  const campaign = await campaignsApi.getById(String(id));
  campaignCache.set(id, campaign);
  return campaign;
}

// ── Component ──
interface ChatCampaignCardProps {
  campaignId: number;
  fallbackName: string;
}

export const ChatCampaignCard: React.FC<ChatCampaignCardProps> = React.memo(({ campaignId, fallbackName }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetchCampaignCached(campaignId)
      .then((c) => { if (!cancelled) setCampaign(c); })
      .catch(() => { if (!cancelled) setError(true); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [campaignId]);

  const handleClick = () => navigate(`/campaigns/${campaignId}`);

  // ── Error state ──
  if (error) {
    return (
      <a
        href={`/campaigns/${campaignId}`}
        onClick={(e) => { e.preventDefault(); handleClick(); }}
        className="inline-flex items-center gap-1 text-[12px] transition-colors"
        style={{ color: 'var(--color-rust)', textDecoration: 'underline', textUnderlineOffset: 2 }}
      >
        {fallbackName || `Campaign #${campaignId}`}
        <span style={{ fontSize: 10 }}>&#8594;</span>
      </a>
    );
  }

  // ── Loading state ──
  if (loading || !campaign) {
    return (
      <div
        className="relative overflow-hidden"
        style={{
          borderRadius: 12,
          background: 'rgba(255, 255, 255, 0.35)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          border: '1px solid rgba(0, 0, 0, 0.04)',
          width: '100%',
          height: 120,
          marginTop: 8,
          marginBottom: 8,
        }}
      >
        <div className="absolute inset-0 flex items-end px-3.5 pb-3">
          <div>
            <div className="rounded" style={{ width: 140, height: 14, background: 'linear-gradient(90deg, rgba(0,0,0,0.06) 25%, rgba(0,0,0,0.02) 50%, rgba(0,0,0,0.06) 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.5s infinite' }} />
            <div className="rounded mt-1.5" style={{ width: 80, height: 10, background: 'linear-gradient(90deg, rgba(0,0,0,0.04) 25%, rgba(0,0,0,0.01) 50%, rgba(0,0,0,0.04) 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.5s infinite' }} />
          </div>
        </div>
      </div>
    );
  }

  // ── Loaded state ──
  const progress = campaign.goalAmount > 0 ? Math.min((campaign.raisedAmount / campaign.goalAmount) * 100, 100) : 0;

  return (
    <div
      className="relative overflow-hidden cursor-pointer transition-all duration-200 hover:shadow-lg"
      style={{
        borderRadius: 12,
        background: 'rgba(255, 255, 255, 0.55)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        border: '1px solid rgba(0, 0, 0, 0.06)',
        width: '100%',
        height: 120,
        marginTop: 8,
        marginBottom: 8,
      }}
      onClick={handleClick}
    >
      {/* Cover image */}
      {campaign.coverImageUrl && (
        <img
          src={campaign.coverImageUrl}
          alt={campaign.title}
          className="absolute inset-0 w-full h-full object-cover"
          style={{ opacity: imageLoaded ? 1 : 0, transition: 'opacity 0.3s ease' }}
          onLoad={() => setImageLoaded(true)}
        />
      )}

      {/* Gradient overlay */}
      <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.15) 50%, transparent 100%)' }} />

      {/* Content overlay */}
      <div className="absolute bottom-0 left-0 right-0 px-3.5 pb-3 pt-8">
        <p className="text-[13px] font-semibold leading-tight truncate" style={{ color: '#ffffff', textShadow: '0 1px 3px rgba(0,0,0,0.3)' }}>
          {campaign.title}
        </p>

        {/* Progress bar */}
        <div className="mt-1.5 mb-1" style={{ height: 3, borderRadius: 2, background: 'rgba(255,255,255,0.2)' }}>
          <div style={{ width: `${progress}%`, height: '100%', borderRadius: 2, background: 'rgba(255,255,255,0.8)', transition: 'width 0.6s ease' }} />
        </div>

        <div className="flex items-center justify-between">
          <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.85)' }}>
            {t('aiAssistant.campaignCard.raised', { amount: `¥${campaign.raisedAmount.toLocaleString()}` })}
          </span>
          <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.7)' }}>
            {t('aiAssistant.campaignCard.participants', { count: campaign.participantCount })}
          </span>
        </div>
      </div>
    </div>
  );
});
