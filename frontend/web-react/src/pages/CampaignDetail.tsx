import { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
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
import ProductCard from '@/components/editorial/ProductCard';
import WelfareTraceabilitySustainabilityPanel from '@/components/editorial/WelfareTraceabilitySustainabilityPanel';
import ImageSkeleton from '@/components/editorial/ImageSkeleton';
import PaymentQRModal from '@/components/payment/PaymentQRModal';
import { campaignsApi } from '@/services/campaigns';
import { getLocalizedCampaignCopy } from '@/utils/campaignLocale';
import { productsApi } from '@/services/products';
import { donationsApi } from '@/services/donations';
import { paymentsApi } from '@/services/payments';
import { useAuthStore } from '@/stores/authStore';
import type { Campaign, Product } from '@/types';
import { getPublicSiteOrigin } from '@/utils/publicSiteUrl';
import { getPayApiBaseForQr } from '@/utils/payApiBaseOverride';
import { formatDate as formatDateTz } from '@/utils/dateTime';

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

  const { data: campaignProducts } = useQuery({
    queryKey: ['campaign-products', id, i18n.language],
    queryFn: () =>
      productsApi.getAll({
        page: 1,
        page_size: 24,
        isImpactProduct: true,
        campaignId: Number(id),
        locale: i18n.language,
      }),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });

  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const quickAmounts = [50, 100, 200, 500] as const;
  const [quickAmount, setQuickAmount] = useState<number>(quickAmounts[1]);
  const [showSupportDetails, setShowSupportDetails] = useState(false);
  const [pendingDonationPay, setPendingDonationPay] = useState<{
    donationId: string;
    amount: number;
    mockPayToken: string;
    payUrl: string;
  } | null>(null);
  const [supportFloating, setSupportFloating] = useState(false);
  const [supportFixedLeft, setSupportFixedLeft] = useState<number | null>(null);
  const [supportFixedWidth, setSupportFixedWidth] = useState<number | null>(null);
  const donateMutation = useMutation({
    mutationFn: async (data: {
      amount: number;
      frequency: 'once' | 'monthly';
      anonymous: boolean;
      message: string;
      paymentMethod: 'wechat' | 'alipay' | 'stripe' | 'paypal';
    }) => {
      const { user, isAuthenticated } = useAuthStore.getState();
      if (!isAuthenticated) {
        navigate('/login', { state: { from: `/campaigns/${id}` } });
        throw new Error('not authenticated');
      }
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
      const token = (result.mock_pay_token || result.mockPayToken || '').trim();
      if (!token) {
        toast.error(t('donate.paymentFailed', 'Payment was not completed.'));
        return;
      }
      const origin = getPublicSiteOrigin();
      const devApi = getPayApiBaseForQr();
      const qs = new URLSearchParams({ t: token });
      if (devApi) qs.set('apiBase', devApi);
      const payUrl = `${origin}/payment/confirm-donation?${qs.toString()}`;
      setPendingDonationPay({
        donationId: String(result.id || result.donationId || ''),
        amount: variables.amount,
        mockPayToken: token,
        payUrl,
      });
    },
    onError: (err) => {
      if (err.message !== 'not authenticated') {
        toast.error(t('donate.error', 'Donation failed. Please try again.'));
      }
    },
  });

  useEffect(() => {
    if (!pendingDonationPay?.donationId) return;
    let cancelled = false;
    let attempts = 0;
    const maxAttempts = 90;
    const tick = async () => {
      if (cancelled) return;
      attempts++;
      if (attempts > maxAttempts) {
        if (!cancelled) {
          setPendingDonationPay(null);
          toast.error(t('checkout.paymentTimeout', '支付超时，请重试'));
        }
        return;
      }
      try {
        const donation = await donationsApi.getById(pendingDonationPay.donationId);
        if (cancelled) return;
        if ((donation.status || '').toLowerCase() === 'completed') {
          setPendingDonationPay(null);
          setShowSupportDetails(false);
          toast.success(t('donate.success', 'Thank you for your donation!'));
        }
      } catch {
        // ignore transient errors during polling
      }
    };
    const id = window.setInterval(tick, 2000);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [pendingDonationPay, t]);

  const handleDonationSimulatePaid = async () => {
    if (!pendingDonationPay) return;
    try {
      await paymentsApi.mockDonationConfirm(pendingDonationPay.mockPayToken);
      const donation = await donationsApi.getById(pendingDonationPay.donationId);
      if ((donation.status || '').toLowerCase() === 'completed') {
        setPendingDonationPay(null);
        setShowSupportDetails(false);
        toast.success(t('donate.success', 'Thank you for your donation!'));
      } else {
        toast.error(t('donate.paymentFailed', 'Payment was not completed.'));
      }
    } catch {
      toast.error(t('donate.paymentFailed', 'Payment was not completed.'));
    }
  };

  const handleDonationPayModalClose = () => {
    setPendingDonationPay(null);
    toast.error(t('donate.paymentFailed', 'Payment was not completed.'));
  };

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const onScroll = () => {
      const anchor = document.getElementById('campaign-support-anchor');
      const sidebar = document.getElementById('campaign-support-sidebar');
      if (!anchor || !sidebar) return;
      const isDesktop = window.matchMedia('(min-width: 1024px)').matches;
      if (!isDesktop) {
        setSupportFloating(false);
        setSupportFixedLeft(null);
        setSupportFixedWidth(null);
        return;
      }
      const anchorRect = anchor.getBoundingClientRect();
      const sidebarRect = sidebar.getBoundingClientRect();
      const shouldFloat = anchorRect.top <= 96;
      if (shouldFloat && !supportFloating) {
        setSupportFixedLeft(sidebarRect.left);
        setSupportFixedWidth(sidebarRect.width);
      } else if (!shouldFloat && supportFloating) {
        setSupportFixedLeft(null);
        setSupportFixedWidth(null);
      }
      setSupportFloating(shouldFloat);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, [supportFloating]);

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
  const progressValue = Math.min(100, Math.max(0, progress));
  const locale = i18n.language || 'en';
  const formatCurrency = (amount: number) => new Intl.NumberFormat(locale).format(amount);
  const formatDate = (value?: string) => {
    if (!value) return t('campaigns.detail.dateTbd', 'To be announced');
    return formatDateTz(value, locale);
  };

  const copy = getLocalizedCampaignCopy(campaign, t, i18n);
  const snapshotItems = [
    {
      label: t('campaigns.detail.startDate', 'Start date'),
      value: formatDate(campaign.startDate),
    },
    {
      label: t('campaigns.detail.endDate', 'End date'),
      value: formatDate(campaign.endDate),
    },
    {
      label: t('campaigns.detail.participants', 'Participants'),
      value: `${campaign.participantCount}`,
    },
    {
      label: t('campaigns.detail.networks', 'Campaign Networks'),
      value: `${campaign.artworkCount}`,
    },
  ];

  const visibleCampaignProducts = (campaignProducts?.items ?? []).slice(0, (() => {
    const list = campaignProducts?.items ?? [];
    const placeholderCount = list.filter((p) => {
      const u = (p.image_url || '').toLowerCase();
      return !u || u.includes('picsum.photos') || u.includes('placeholder');
    }).length;
    return placeholderCount >= Math.ceil(list.length * 0.5) ? 4 : list.length;
  })());

  return (
    <PageWrapper>
      <h1 className="sr-only">{copy.title}</h1>
      {/* Hero Image */}
      <section className="relative h-[50dvh] md:h-[60dvh]">
        <ImageSkeleton className="absolute inset-0" aspectRatio="aspect-video" />
        <img
          src={campaign.coverImageUrl || undefined}
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
        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10 pb-12 md:pb-16">
          <div className="max-w-[1400px] mx-auto">
            <span className="font-body text-body-sm tracking-[0.3em] uppercase text-pale-gold mb-3 block drop-shadow-sm">
              {t('campaigns.detail.statusLine', {
                status: t(`campaigns.status.${campaign.status}`),
              })}
            </span>
            <BleedTitleBlock className="[&_*]:text-3xl md:[&_*]:text-5xl lg:[&_*]:text-6xl">
              <span className="text-paper drop-shadow-lg">{copy.title}</span>
            </BleedTitleBlock>
            {copy.subtitle && (
              <p className="font-body text-body md:text-body-lg text-paper/90 max-w-2xl mt-3 leading-relaxed drop-shadow-sm">
                {copy.subtitle}
              </p>
            )}
          </div>
        </div>
      </section>

      {/* Content — asymmetric grid */}
      <PaperTextureBackground variant="paper" className="pt-24 pb-20 md:pt-24 md:pb-24">
        <SectionContainer>
          {/* Mobile-first: progress summary above fold */}
          <div className="lg:hidden mb-10 bg-paper/90 shadow-[0_10px_30px_rgba(26,26,22,0.06)] p-5">
            <div className="flex items-baseline justify-between gap-4 mb-3">
              <span className="font-display text-3xl font-bold text-ink">{progress}%</span>
              {campaign.goalAmount > 0 && (
                <span className="font-body text-caption text-sepia-mid text-right">
                  ¥{campaign.raisedAmount.toLocaleString()} / ¥{campaign.goalAmount.toLocaleString()}
                </span>
              )}
            </div>
            <div
              role="progressbar"
              aria-valuenow={progress}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={t('campaigns.detail.progress')}
              className="w-full h-1.5 bg-warm-gray/30 rounded-sm overflow-hidden"
            >
              <div
                className="h-full origin-left bg-rust rounded-sm"
                style={{ transform: `scaleX(${Math.min(100, progress) / 100})` }}
              />
            </div>
          </div>

          <div className="max-w-[1320px] mx-auto grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_280px] gap-10 lg:gap-14 items-start">
            <div className="order-2 lg:order-1 space-y-12">
              <div className="bg-paper/95 shadow-[0_16px_40px_rgba(26,26,22,0.07)] p-7 md:p-8 min-h-[220px]">
                <div className="h-px w-16 bg-rust/40 mb-6" />
                <h2 className="font-display text-h3 font-bold text-ink mb-6">
                  {t('campaigns.detail.about')}
                </h2>
                <p className="font-body text-body md:text-body-lg text-ink-faded leading-[1.85] max-w-prose">
                  {copy.description}
                </p>
              </div>

              <section className="bg-paper/90 shadow-[0_12px_28px_rgba(26,26,22,0.06)] p-7 md:p-8">
                <h3 className="font-display text-h4 font-bold text-ink mb-6">
                  {t('campaigns.detail.snapshot', 'Campaign Snapshot')}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
                {snapshotItems.map((item) => (
                  <div
                    key={item.label}
                    className={`p-5 min-h-[156px] flex flex-col justify-between ${
                      item.label === t('campaigns.detail.startDate', 'Start date') || item.label === t('campaigns.detail.endDate', 'End date')
                        ? 'bg-aged-stock/70'
                        : 'bg-paper/70'
                    }`}
                  >
                    <p className="font-body text-overline tracking-[0.18em] uppercase text-sepia-mid">
                      {item.label}
                    </p>
                    <p className="font-display text-xl md:text-2xl font-bold text-ink leading-snug mt-5">
                      {item.value}
                    </p>
                  </div>
                ))}
                </div>
              </section>

              <section className="bg-aged-stock/45 p-7 md:p-8">
                <p className="font-body text-overline tracking-[0.18em] uppercase text-sepia-mid mb-5">
                  {t('campaigns.detail.voiceEyebrow', 'Voice from the campaign')}
                </p>
                {campaign.featuredChild ? (
                  <StoryQuoteBlock
                    variant="strip"
                    quote={campaign.featuredChild.quote}
                    author={`${campaign.featuredChild.name}, ${t('impactShop.age', { age: campaign.featuredChild.age })}`}
                    role={t('campaigns.detail.quoteRole', 'Guizhou')}
                    className="w-full pt-2 pb-0"
                  />
                ) : (
                  <StoryQuoteBlock
                    variant="strip"
                    quote={t('campaigns.detail.quote', 'I drew a dress that makes rain sounds when you walk. That way, everyone knows you\'re coming.')}
                    author={t('campaigns.detail.quoteAuthor', 'Mei, age 8')}
                    role={t('campaigns.detail.quoteRole', 'Guizhou')}
                    className="w-full pt-2 pb-0"
                  />
                )}
              </section>

              <section className="pt-2">
                <WelfareTraceabilitySustainabilityPanel
                  sustainability={{
                    eyebrow: campaign.sustainabilityEyebrow,
                    title: campaign.sustainabilityTitle || t('campaigns.detail.impactMechanismTitle', 'How Purchases Become Classrooms'),
                    subtitle: campaign.sustainabilitySubtitle,
                    p1Title: campaign.sustainabilityP1Title,
                    p1Body: (campaign.sustainabilityP1Body || '').split(/[.!?。！？]/)[0],
                    p2Title: campaign.sustainabilityP2Title,
                    p2Body: (campaign.sustainabilityP2Body || '').split(/[.!?。！？]/)[0],
                    p3Title: campaign.sustainabilityP3Title,
                    p3Body: (campaign.sustainabilityP3Body || '').split(/[.!?。！？]/)[0],
                    p4Title: campaign.sustainabilityP4Title,
                    p4Body: (campaign.sustainabilityP4Body || '').split(/[.!?。！？]/)[0],
                    footnote: campaign.sustainabilityFootnote,
                    ctaTraceability: campaign.sustainabilityCtaTraceability,
                    ctaShop: campaign.sustainabilityCtaShop,
                  }}
                />
              </section>

              {visibleCampaignProducts.length > 0 && (
                <section className="pt-20">
                  <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3 mb-7">
                    <div>
                      <p className="font-body text-overline tracking-[0.22em] uppercase text-sepia-mid mb-2">
                        {t('campaigns.detail.productsEyebrow', 'Impact collection')}
                      </p>
                      <h2 className="font-display text-h3 font-bold text-ink">
                        {t('campaigns.detail.linkedProducts', 'Linked Impact Products')}
                      </h2>
                    </div>
                    <p className="font-body text-caption text-sepia-mid tracking-wider">
                      {visibleCampaignProducts.length}{' '}
                      {t('campaigns.detail.products', '公益产品')}
                    </p>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-5">
                    {visibleCampaignProducts.map((product: Product, index: number) => (
                      <ProductCard
                        key={product.id}
                        product={product}
                        index={index}
                        detailContext="impact"
                      />
                    ))}
                  </div>
                </section>
              )}
            </div>

            <div id="campaign-support-anchor" className="order-1 lg:order-2 lg:min-h-[620px]">
              <div
                id="campaign-support-sidebar"
                className={`
                  space-y-6
                  ${supportFloating ? 'lg:fixed lg:top-24 lg:z-40' : ''}
                `}
                style={
                  supportFloating && supportFixedLeft != null && supportFixedWidth != null
                    ? { left: `${supportFixedLeft}px`, width: `${supportFixedWidth}px` }
                    : undefined
                }
              >
                <div className="hidden lg:block bg-paper/95 shadow-[0_16px_40px_rgba(26,26,22,0.07)] p-6">
                  <p className="font-body text-overline tracking-[0.2em] uppercase text-sepia-mid mb-4">
                    {t('campaigns.detail.progress')}
                  </p>
                  <div className="flex items-baseline justify-between gap-4 mb-2">
                    <span className="font-display text-4xl font-bold text-ink">{progress}%</span>
                    {campaign.goalAmount > 0 && (
                      <span className="font-body text-caption text-sepia-mid text-right leading-snug">
                        ¥{formatCurrency(campaign.raisedAmount)}
                        <span className="block text-ink-faded/80">
                          / ¥{formatCurrency(campaign.goalAmount)}
                        </span>
                      </span>
                    )}
                  </div>
                  <div
                    role="progressbar"
                    aria-valuenow={progress}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label={t('campaigns.detail.progress')}
                    className="w-full h-1.5 bg-warm-gray/30 rounded-sm overflow-hidden mb-6"
                  >
                    <motion.div
                      {...(prefersReducedMotion ? { style: { transform: `scaleX(${progressValue / 100})` } } : {
                        initial: { scaleX: 0 },
                        animate: { scaleX: progressValue / 100 },
                        transition: { duration: 1.2, ease: 'easeOut' },
                      })}
                      className="h-full origin-left bg-rust rounded-sm"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4 pt-4 border-t border-warm-gray/20">
                    <div>
                      <p className="font-display text-xl text-ink">{campaign.participantCount}</p>
                      <p className="font-body text-overline text-sepia-mid tracking-wider uppercase mt-0.5">
                        {t('campaigns.detail.participants')}
                      </p>
                    </div>
                    <div>
                      <p className="font-display text-xl text-ink">{campaign.artworkCount}</p>
                      <p className="font-body text-overline text-sepia-mid tracking-wider uppercase mt-0.5">
                        {t('campaigns.detail.artworks')}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-5 md:p-6 bg-paper/75 shadow-[0_10px_26px_rgba(26,26,22,0.05)]">
                  <h3 className="font-body text-caption tracking-[0.15em] uppercase text-sepia-mid mb-4">
                    {t('campaigns.detail.donate')}
                  </h3>
                  <div className="grid grid-cols-2 gap-2 mb-4" role="group" aria-label={t('donate.form.amountPresets', 'Donation amount presets')}>
                    {quickAmounts.map((amount) => (
                      <button
                        key={amount}
                        type="button"
                        onClick={() => setQuickAmount(amount)}
                        className={`px-3 py-2 border font-body text-label transition-colors cursor-pointer ${
                          quickAmount === amount
                            ? 'border-rust bg-rust/[0.06] text-ink'
                            : 'border-warm-gray/35 text-ink-faded hover:text-ink'
                        }`}
                      >
                        ¥{amount}
                      </button>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      donateMutation.mutate({
                        amount: quickAmount,
                        frequency: 'once',
                        anonymous: false,
                        message: '',
                        paymentMethod: 'wechat',
                      })
                    }
                    disabled={donateMutation.isPending}
                    className="w-full py-3 font-body text-caption tracking-[0.1em] uppercase bg-rust text-paper border-none cursor-pointer transition-colors hover:bg-archive-brown disabled:bg-warm-gray disabled:cursor-not-allowed"
                  >
                    {donateMutation.isPending ? t('donate.form.processing') : t('donate.form.submit')}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowSupportDetails(true)}
                    className="mt-3 w-full py-2 font-body text-caption tracking-[0.08em] uppercase text-ink-faded border border-warm-gray/30 hover:text-ink hover:border-warm-gray/45 transition-colors cursor-pointer"
                  >
                    {t('campaigns.detail.moreSupportOptions', 'More support options')}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </SectionContainer>
      </PaperTextureBackground>

      {showSupportDetails && (
        <div className="fixed inset-0 z-50 bg-black/45 flex items-center justify-center p-4">
          <div className="w-full max-w-2xl max-h-[88vh] overflow-y-auto bg-paper shadow-[0_24px_60px_rgba(26,26,22,0.28)] p-6 md:p-8 relative">
            <button
              type="button"
              onClick={() => setShowSupportDetails(false)}
              className="absolute right-4 top-4 w-8 h-8 border border-warm-gray/30 text-ink-faded hover:text-ink hover:border-warm-gray/45 transition-colors cursor-pointer"
              aria-label={t('common.close', 'Close')}
            >
              ×
            </button>
            <DonationPanel
              onSubmit={donateMutation.mutate}
              isSubmitting={donateMutation.isPending}
            />
          </div>
        </div>
      )}

      {pendingDonationPay && (
        <PaymentQRModal
          payUrl={pendingDonationPay.payUrl}
          amount={pendingDonationPay.amount}
          onSuccess={handleDonationSimulatePaid}
          onFailure={handleDonationPayModalClose}
          isProcessing={donateMutation.isPending}
        />
      )}

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
