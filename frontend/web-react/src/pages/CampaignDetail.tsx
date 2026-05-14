import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, useReducedMotion } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import PageWrapper from '@/components/layout/PageWrapper';
import SectionContainer from '@/components/layout/SectionContainer';
import BleedTitleBlock from '@/components/editorial/BleedTitleBlock';

import StoryQuoteBlock from '@/components/editorial/StoryQuoteBlock';
import PaperTextureBackground from '@/components/editorial/PaperTextureBackground';
import DonationPanel from '@/components/editorial/DonationPanel';
import ArtworkCard from '@/components/editorial/ArtworkCard';
import WelfareTraceabilitySustainabilityPanel from '@/components/editorial/WelfareTraceabilitySustainabilityPanel';
import ImageSkeleton from '@/components/editorial/ImageSkeleton';
import { campaignsApi } from '@/services/campaigns';
import { getLocalizedCampaignCopy } from '@/utils/campaignLocale';
import { artworksApi } from '@/services/artworks';
import { donationsApi } from '@/services/donations';
import { invokeWechatPayment } from '@/utils/payment';
import { useAuthStore } from '@/stores/authStore';
import type { Campaign } from '@/types';

export default function CampaignDetail() {
  const { id } = useParams<{ id: string }>();
  const { t, i18n } = useTranslation();
  const prefersReducedMotion = useReducedMotion();
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      setLoadError(true);
      return;
    }
    let cancelled = false;
    setLoadError(false);
    setLoading(true);
    campaignsApi
      .getById(id)
      .then((data: Campaign) => {
        if (!cancelled) {
          setCampaign(data);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setCampaign(null);
          setLoadError(true);
          setLoading(false);
        }
      });
    return () => { cancelled = true; };
  }, [id]);

  const { data: campaignArtworks } = useQuery({
    queryKey: ['campaign-artworks', id],
    queryFn: () => artworksApi.getByCampaign(id!),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });

  const queryClient = useQueryClient();
  const donateMutation = useMutation({
    mutationFn: async (data: {
      amount: number;
      frequency: 'once' | 'monthly';
      anonymous: boolean;
      message: string;
      paymentMethod: 'wechat' | 'alipay' | 'stripe' | 'paypal';
    }) => {
      const { user } = useAuthStore.getState();
      return donationsApi.create({
        donor_name: data.anonymous
          ? t('donate.anonymousName', 'Anonymous')
          : (user?.nickname || user?.email || t('donate.guestName', 'Guest')),
        amount: data.amount,
        currency: 'CNY',
        payment_method: data.paymentMethod,
        campaign_id: Number(id),
        is_anonymous: data.anonymous,
        message: data.message || undefined,
      });
    },
    onSuccess: async (result, variables) => {
      queryClient.invalidateQueries({ queryKey: ['campaign', id] });
      if (variables.paymentMethod === 'wechat' && result && 'appId' in result) {
        try {
          await invokeWechatPayment(result as unknown as Record<string, unknown>);
          toast.success(t('donate.success', 'Thank you for your donation!'));
        } catch {
          toast.error(t('donate.paymentFailed', 'Payment was not completed.'));
        }
        return;
      }
      toast.success(t('donate.success', 'Thank you for your donation!'));
    },
    onError: () => {
      toast.error(t('donate.error', 'Donation failed. Please try again.'));
    },
  });

  if (loading) {
    return (
      <PageWrapper>
        <PaperTextureBackground variant="paper" className="py-16 md:py-24">
          <SectionContainer>
            <p className="font-body text-sepia-mid">{t('campaigns.loading', 'Loading campaign...')}</p>
          </SectionContainer>
        </PaperTextureBackground>
      </PageWrapper>
    );
  }

  if (loadError || !campaign) {
    return (
      <PageWrapper>
        <PaperTextureBackground variant="paper" className="py-16 md:py-24">
          <SectionContainer>
            <p className="font-body text-ink-faded mb-6">
              {t('campaigns.detailLoadError', 'This campaign could not be loaded. It may have been removed or the link is invalid.')}
            </p>
            <Link
              to="/campaigns"
              className="font-body text-caption tracking-[0.15em] uppercase text-ink-faded hover:text-rust transition-colors cursor-pointer"
            >
              &larr; {t('campaigns.detail.backToAll')}
            </Link>
          </SectionContainer>
        </PaperTextureBackground>
      </PageWrapper>
    );
  }

  const progress = campaign.goalAmount > 0
    ? Math.round((campaign.raisedAmount / campaign.goalAmount) * 100)
    : 0;

  const copy = getLocalizedCampaignCopy(campaign, t, i18n);

  return (
    <PageWrapper>
      <h1 className="sr-only">{copy.title}</h1>
      {/* Hero Image */}
      <section className="relative h-[50dvh] md:h-[60dvh]">
        <ImageSkeleton className="absolute inset-0" aspectRatio="aspect-video" />
        <img
          src={campaign.coverImageUrl}
          alt={copy.title}
          className="w-full h-full object-cover"
          style={{ filter: 'sepia(0.2) contrast(1.05) brightness(0.97)', opacity: 0, transition: 'opacity 0.3s' }}
          onLoad={(e) => {
            const target = e.target as HTMLImageElement;
            target.style.opacity = '1';
            const skeleton = target.previousElementSibling as HTMLElement;
            if (skeleton) skeleton.style.display = 'none';
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-ink/70 via-ink/20 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10">
          <div className="max-w-[1400px] mx-auto">
            <span className="font-body text-overline tracking-[0.3em] uppercase text-pale-gold mb-3 block">
              {t('campaigns.detail.statusLine', {
                status: t(`campaigns.status.${campaign.status}`),
              })}
            </span>
            <BleedTitleBlock>
              <span className="text-paper">{copy.title}</span>
            </BleedTitleBlock>
          </div>
        </div>
      </section>

      {/* Content — asymmetric grid */}
      <PaperTextureBackground variant="paper" className="py-16 md:py-24">
        <SectionContainer>
          <div className="grid grid-cols-1 md:grid-cols-12 gap-12 md:gap-16">
            {/* Main content */}
            <div className="md:col-span-7">
              <h2 className="font-display text-h3 font-bold text-ink mb-8">
                {t('campaigns.detail.about')}
              </h2>
              <p className="font-body text-body-sm text-ink-faded leading-[1.8] mb-6">
                {copy.description}
              </p>

              <StoryQuoteBlock
                quote={t('campaigns.detail.quote', 'I drew a dress that makes rain sounds when you walk. That way, everyone knows you\'re coming.')}
                author={t('campaigns.detail.quoteAuthor', 'Mei, age 8')}
                role={t('campaigns.detail.quoteRole', 'Guizhou')}
              />
            </div>

            {/* Sidebar — progress + donate */}
            <div className="md:col-span-4 md:col-start-9">
              <div className="sticky top-24 space-y-8">
                {/* Progress */}
                <div className="border border-warm-gray/30 p-6">
                  <div className="flex justify-between mb-3">
                    <span className="font-display text-3xl font-bold text-ink">{progress}%</span>
                    <span className="font-body text-caption text-sepia-mid self-end">
                      {t('campaigns.detail.progress')}
                    </span>
                  </div>
                  <div
                    role="progressbar"
                    aria-valuenow={progress}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label={t('campaigns.detail.progress')}
                    className="w-full h-1.5 bg-warm-gray/30 rounded-sm overflow-hidden mb-4"
                  >
                    <motion.div
                      {...(prefersReducedMotion ? { style: { transform: `scaleX(${progress / 100})` } } : {
                        initial: { scaleX: 0 },
                        animate: { scaleX: progress / 100 },
                        transition: { duration: 1.2, ease: 'easeOut' },
                      })}
                      className="h-full origin-left bg-archive-brown rounded-sm"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div>
                      <p className="font-display text-xl text-ink">{campaign.participantCount}</p>
                      <p className="font-body text-overline text-sepia-mid tracking-wider uppercase">
                        {t('campaigns.detail.participants')}
                      </p>
                    </div>
                    <div>
                      <p className="font-display text-xl text-ink">{campaign.artworkCount}</p>
                      <p className="font-body text-overline text-sepia-mid tracking-wider uppercase">
                        {t('campaigns.detail.artworks')}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Donation */}
                <div>
                  <h3 className="font-body text-caption tracking-[0.15em] uppercase text-sepia-mid mb-4">
                    {t('campaigns.detail.donate')}
                  </h3>
                  <DonationPanel
                    onSubmit={donateMutation.mutate}
                    isSubmitting={donateMutation.isPending}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="mt-10 md:mt-12">
            <WelfareTraceabilitySustainabilityPanel />
          </div>
        </SectionContainer>
      </PaperTextureBackground>

      {/* Campaign Artworks */}
      <PaperTextureBackground variant="aged" className="py-16 md:py-24">
        <SectionContainer>
          <h2 className="font-display text-h3 font-bold text-ink mb-8">
            {t('campaigns.detail.artworks')}
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
            {(campaignArtworks ?? []).map((artwork, index) => (
              <ArtworkCard key={artwork.id} artwork={artwork} index={index} />
            ))}
          </div>
        </SectionContainer>
      </PaperTextureBackground>

      {/* Back link */}
      <SectionContainer className="py-8">
        <Link
          to="/campaigns"
          className="font-body text-caption tracking-[0.15em] uppercase text-ink-faded hover:text-rust transition-colors cursor-pointer"
        >
          &larr; {t('campaigns.detail.backToAll')}
        </Link>
      </SectionContainer>
    </PageWrapper>
  );
}
