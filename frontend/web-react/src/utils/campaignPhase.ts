import type { Campaign } from '@/types';

export type CampaignDisplayPhase = Campaign['status'];

function parseDateMs(value?: string): number | null {
  if (!value) return null;
  const ms = new Date(value).getTime();
  return Number.isNaN(ms) ? null : ms;
}

/** Derive user-facing phase from DB status and campaign dates. */
export function resolveCampaignPhase(
  dbStatus: string | undefined,
  startDate?: string,
  endDate?: string,
  nowMs: number = Date.now(),
): CampaignDisplayPhase {
  const status = (dbStatus || 'draft').toLowerCase();
  if (status === 'draft') return 'draft';
  if (status === 'cancelled') return 'cancelled';

  const startMs = parseDateMs(startDate);
  const endMs = parseDateMs(endDate);

  if (status === 'completed') return 'completed';
  if (startMs != null && nowMs < startMs) return 'upcoming';
  if (endMs != null && nowMs > endMs) return 'completed';
  return 'active';
}

export function resolveCampaignDisplayPhase(campaign: {
  status: string;
  startDate?: string;
  endDate?: string;
  displayStatus?: string;
}): CampaignDisplayPhase {
  const fromApi = campaign.displayStatus as CampaignDisplayPhase | undefined;
  if (fromApi && ['upcoming', 'active', 'completed', 'draft', 'cancelled'].includes(fromApi)) {
    return fromApi;
  }
  return resolveCampaignPhase(campaign.status, campaign.startDate, campaign.endDate);
}
