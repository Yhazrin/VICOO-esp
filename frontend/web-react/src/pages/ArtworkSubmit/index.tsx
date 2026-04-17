import { useState, useCallback, useMemo, useEffect, type ChangeEvent } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useMutation } from '@tanstack/react-query';
import { motion, useReducedMotion } from 'framer-motion';
import PageWrapper from '@/components/layout/PageWrapper';
import SectionContainer from '@/components/layout/SectionContainer';
import NumberedSectionHeading from '@/components/editorial/NumberedSectionHeading';
import { VintageInput } from '@/components/editorial/VintageInput';
import { VintageSelect } from '@/components/editorial/VintageSelect';
import SepiaImageFrame from '@/components/editorial/SepiaImageFrame';
import { EditorialCard } from '@/components/editorial/EditorialCard';
import GrainOverlay from '@/components/animations/GrainOverlay';
import PaperTextureBackground from '@/components/editorial/PaperTextureBackground';
import { MagazineDivider } from '@/components/editorial/MagazineDivider';
import { placeholderImage } from '@/utils/placeholderImage';
import { artworksApi } from '@/services/artworks';
import { useAuthStore } from '@/stores/authStore';

/* ─── Mock Campaign Data ─── */

const MOCK_CAMPAIGNS = [
  {
    id: 1,
    titleKey: 'artworkSubmit.campaigns.spring.title',
    titleFallback: "Spring Blossoms \u2014 Children's Floral Art Exhibition",
    descKey: 'artworkSubmit.campaigns.spring.description',
    descFallback: 'Inspired by spring flowers, young artists are invited to paint their dream gardens. Outstanding works will be printed on limited-edition eco-friendly scarves.',
    hue: 45,
    deadline: '2026-05-15',
    submissions: 128,
  },
  {
    id: 2,
    titleKey: 'artworkSubmit.campaigns.ocean.title',
    titleFallback: 'Ocean Guardian \u2014 Sustainable Fashion Illustration',
    descKey: 'artworkSubmit.campaigns.ocean.description',
    descFallback: 'Focus on ocean conservation themes and express your care for marine ecosystems through color. Selected artworks will be applied to a recycled-fabric clothing line.',
    hue: 200,
    deadline: '2026-06-01',
    submissions: 86,
  },
  {
    id: 3,
    titleKey: 'artworkSubmit.campaigns.forest.title',
    titleFallback: 'Urban Forest \u2014 Green Living Art Creation',
    descKey: 'artworkSubmit.campaigns.forest.description',
    descFallback: 'Depict your ideal green city and imagine a future where humans and nature coexist in harmony. Artworks will be used in an eco-friendly tote bag design series.',
    hue: 120,
    deadline: '2026-06-20',
    submissions: 52,
  },
];

/* ─── Review Timeline Steps ─── */

const REVIEW_STEPS = [
  { key: 'submitted', label: 'Submitted', description: 'Your artwork has been successfully uploaded' },
  { key: 'pending', label: 'Pending Review', description: 'Our team is reviewing your submission' },
  { key: 'result', label: 'Approved / Rejected', description: 'You will be notified of the review result via message' },
  { key: 'voting', label: 'Public Voting', description: 'Approved artworks will enter public voting' },
  { key: 'commercialize', label: 'Commercialized', description: 'Outstanding artworks will be applied to sustainable fashion products' },
];

/* ─── Age Group Options ─── */

const AGE_GROUP_OPTIONS = [
  { value: '', label: 'Select age group' },
  { value: '3-6', label: 'Ages 3-6' },
  { value: '7-9', label: 'Ages 7-9' },
  { value: '10-12', label: 'Ages 10-12' },
  { value: '13-15', label: 'Ages 13-15' },
];

/* ─── Main Page Component ─── */

export default function ArtworkSubmitPage() {
  const { t } = useTranslation();
  const prefersReducedMotion = useReducedMotion();
  const { isAuthenticated } = useAuthStore();

  const [campaignId, setCampaignId] = useState<number | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [artworkFile, setArtworkFile] = useState<File | null>(null);
  const [authorName, setAuthorName] = useState('');
  const [ageGroup, setAgeGroup] = useState('');
  const [guardianConsent, setGuardianConsent] = useState(false);
  const [showErrors, setShowErrors] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const currentStep = isSubmitted ? 1 : -1;

  const missingFields: string[] = [];
  if (!campaignId) missingFields.push(t('artworkSubmit.fieldCampaign', 'Campaign'));
  if (!title.trim()) missingFields.push(t('artworkSubmit.fieldTitle', 'Artwork title'));
  if (!artworkFile) missingFields.push(t('artworkSubmit.fieldArtwork', 'Artwork image'));
  if (!authorName.trim()) missingFields.push(t('artworkSubmit.fieldAuthor', 'Author name'));
  if (!ageGroup) missingFields.push(t('artworkSubmit.fieldAge', 'Age group'));
  if (authorName.trim() && !guardianConsent) missingFields.push(t('artworkSubmit.fieldConsent', 'Guardian consent'));

  const isFormValid = missingFields.length === 0;

  const artworkPreviewUrl = useMemo(() => {
    if (!artworkFile) return null;
    return URL.createObjectURL(artworkFile);
  }, [artworkFile]);

  useEffect(() => {
    return () => { if (artworkPreviewUrl) URL.revokeObjectURL(artworkPreviewUrl); };
  }, [artworkPreviewUrl]);

  const mutation = useMutation({
    mutationFn: () => {
      if (!artworkFile) throw new Error('Image required');
      return artworksApi.create({
        title,
        image: artworkFile,
        description: description || undefined,
        campaign_id: campaignId ?? undefined,
        child_display_name: authorName || undefined,
        guardian_consent: authorName ? String(guardianConsent) : undefined,
      });
    },
    onSuccess: () => setIsSubmitted(true),
  });

  const handleArtworkFile = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      setArtworkFile(e.target.files?.[0] ?? null);
    },
    [],
  );

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      setShowErrors(true);
      if (!isFormValid) return;
      mutation.mutate();
    },
    [isFormValid, mutation],
  );

  /* ─── Auth gate ─── */

  if (!isAuthenticated) {
    return (
      <PageWrapper>
        <PaperTextureBackground variant="paper" className="py-24 text-center">
          <p className="font-body text-ink-faded mb-6">
            {t('submitArtwork.loginRequired', '请先登录以提交画作')}
          </p>
          <Link to="/login" className="font-body text-rust uppercase tracking-widest text-sm">
            {t('nav.login')} →
          </Link>
        </PaperTextureBackground>
      </PageWrapper>
    );
  }

  /* ─── Animation Helpers ─── */

  const fadeUp = (delay = 0) =>
    prefersReducedMotion
      ? {}
      : {
          initial: { opacity: 0, y: 24 } as const,
          whileInView: { opacity: 1, y: 0 } as const,
          viewport: { once: true, margin: '-60px' } as const,
          transition: { duration: 0.6, ease: [0, 0, 0.2, 1], delay },
        };

  /* ─── Render ─── */

  return (
    <PageWrapper>
      {/* Hero */}
      <PaperTextureBackground variant="paper" className="py-20 md:py-32 relative">
        <GrainOverlay />
        <SectionContainer>
          <motion.div {...fadeUp()} className="max-w-2xl">
            <span className="font-body text-overline text-rust tracking-[0.25em] uppercase block mb-4">
              {t('artworkSubmit.badge', 'Artwork Submission & Review')}
            </span>
            <h1 className="font-display text-h1 font-bold leading-[0.95] tracking-[-0.025em] text-ink mb-6">
              {t('artworkSubmit.heroTitle', 'Change Fashion with Your Brush')}
            </h1>
            <p className="font-body text-body-sm md:text-body text-ink-faded leading-relaxed max-w-lg">
              {t('artworkSubmit.heroDescription', 'Choose a campaign and submit your original artwork. Once approved, your art may be featured on sustainable fashion products.')}
            </p>
          </motion.div>
        </SectionContainer>
      </PaperTextureBackground>

      <MagazineDivider variant="decorative" />

      {/* Section 01: Campaign Selection */}
      <SectionContainer className="section-spacing">
        <NumberedSectionHeading
          number="01"
          title={t('artworkSubmit.section01Title', 'Select a Campaign')}
          subtitle={t('artworkSubmit.section01Subtitle', 'Choose the campaign you want to participate in. Each campaign has a different theme and deadline.')}
        />

        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-12">
          {MOCK_CAMPAIGNS.map((campaign, idx) => (
            <motion.div key={campaign.id} {...fadeUp(idx * 0.1)} className="md:col-span-4">
              <EditorialCard
                title={t(campaign.titleKey, campaign.titleFallback)}
                subtitle={`${t('artworkSubmit.deadline', 'Deadline')}: ${campaign.deadline}`}
                description={t(campaign.descKey, campaign.descFallback)}
                image={placeholderImage(t(campaign.titleKey, campaign.titleFallback), { hue: campaign.hue, width: 600, height: 400 })}
                imageAlt={t(campaign.titleKey, campaign.titleFallback)}
                index={idx}
                onClick={() => setCampaignId(campaign.id)}
                hoverEffect="lift"
                className={`h-full transition-all duration-300 ${
                  campaignId === campaign.id ? 'ring-2 ring-rust shadow-lg' : ''
                }`}
              >
                <div className="flex items-center justify-between mt-2">
                  <span className="font-body text-caption text-sepia-mid">
                    {campaign.submissions} {t('artworkSubmit.submissions', 'submissions')}
                  </span>
                  {campaignId === campaign.id && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="inline-flex items-center gap-1 font-body text-overline text-rust tracking-wider"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                      {t('artworkSubmit.selected', 'Selected')}
                    </motion.span>
                  )}
                </div>
              </EditorialCard>
            </motion.div>
          ))}
        </div>
      </SectionContainer>

      <MagazineDivider variant="decorative" />

      {/* Section 02: Submission Form */}
      <PaperTextureBackground variant="aged" className="py-16 md:py-24 relative">
        <GrainOverlay />
        <SectionContainer>
          <NumberedSectionHeading
            number="02"
            title={t('artworkSubmit.section02Title', 'Submit Artwork')}
            subtitle={t('artworkSubmit.section02Subtitle', 'Fill in artwork details and upload your work. Please ensure the image is clear and all information is complete.')}
          />

          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-12">
            {/* Left Column: Form Fields */}
            <motion.div {...fadeUp()} className="md:col-span-7 space-y-8">
              <VintageInput
                label={t('artworkSubmit.artworkTitle', 'Artwork Title')}
                placeholder={t('artworkSubmit.artworkTitlePlaceholder', 'Give your artwork a name')}
                value={title}
                onChange={(e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setTitle(e.target.value)}
              />

              <VintageInput
                label={t('artworkSubmit.artworkDescription', 'Artwork Description')}
                type="textarea"
                placeholder={t('artworkSubmit.artworkDescriptionPlaceholder', 'Describe your creative inspiration and artwork content...')}
                value={description}
                onChange={(e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setDescription(e.target.value)}
              />

              <VintageInput
                label={t('artworkSubmit.authorName', 'Author Name / Pen Name')}
                placeholder={t('artworkSubmit.authorNamePlaceholder', "Young artist's name or pen name")}
                value={authorName}
                onChange={(e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setAuthorName(e.target.value)}
              />

              <VintageSelect
                label={t('artworkSubmit.ageGroup', 'Age Group')}
                options={AGE_GROUP_OPTIONS}
                value={ageGroup}
                onChange={(e) => setAgeGroup(e.target.value)}
              />

              {/* Guardian Consent */}
              {authorName && (
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={guardianConsent}
                    onChange={(e) => setGuardianConsent(e.target.checked)}
                    className="mt-1 cursor-pointer"
                  />
                  <span className="font-body text-body-sm text-ink-faded">
                    {t('submitArtwork.consentLabel', '我确认已获得该未成年人监护人的同意')}
                  </span>
                </label>
              )}
            </motion.div>

            {/* Right Column: Artwork Upload */}
            <motion.div {...fadeUp(0.15)} className="md:col-span-5 space-y-6">
              <label className="font-body text-overline text-sepia-mid tracking-[0.2em] uppercase block">
                {t('artworkSubmit.uploadArtwork', 'Upload Artwork Image')}
              </label>

              <div className="relative border-2 border-dashed border-rust/30 bg-aged-stock/40 aspect-[3/4] flex flex-col items-center justify-center text-center transition-colors hover:border-rust/50 hover:bg-aged-stock/70 group">
                <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-rust/30 pointer-events-none" aria-hidden="true" />
                <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-rust/30 pointer-events-none" aria-hidden="true" />
                <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-rust/30 pointer-events-none" aria-hidden="true" />
                <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-rust/30 pointer-events-none" aria-hidden="true" />

                <input
                  type="file"
                  accept="image/*"
                  onChange={handleArtworkFile}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                />

                {artworkPreviewUrl ? (
                  <div className="p-4 w-full h-full">
                    <SepiaImageFrame
                      src={artworkPreviewUrl}
                      alt={title || t('artworkSubmit.artworkPreview', 'Artwork Preview')}
                      aspectRatio="portrait"
                      size="full"
                      showCornerAccents={false}
                    />
                  </div>
                ) : (
                  <>
                    <svg className="w-12 h-12 text-rust/40 mb-4 group-hover:text-rust/60 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <p className="font-body text-body-sm text-ink-faded mb-1">
                      {t('artworkSubmit.uploadPrompt', 'Click to upload artwork')}
                    </p>
                    <p className="font-body text-caption text-sepia-mid">
                      {t('artworkSubmit.uploadFormats', 'Supports JPG, PNG, TIFF formats, max 20MB')}
                    </p>
                  </>
                )}
              </div>

              {/* Submit Button */}
              <motion.button
                type="submit"
                whileHover={prefersReducedMotion ? undefined : { scale: 1.02 }}
                whileTap={prefersReducedMotion ? undefined : { scale: 0.98 }}
                disabled={mutation.isPending}
                className={`w-full py-4 font-body text-body-sm tracking-[0.15em] uppercase border transition-all duration-300 ${
                  isFormValid
                    ? 'bg-ink text-paper border-ink hover:bg-rust hover:border-rust cursor-pointer'
                    : 'bg-ink/60 text-paper/70 border-ink/40 cursor-pointer'
                }`}
              >
                {mutation.isPending
                  ? t('common.loading', '…')
                  : t('artworkSubmit.submitButton', 'Submit Artwork')}
              </motion.button>

              {/* Error */}
              {mutation.isError && (
                <p className="font-body text-caption text-rust" role="alert">
                  {t('submitArtwork.error', '提交失败，请稍后再试')}
                </p>
              )}

              {/* Validation Errors */}
              {showErrors && missingFields.length > 0 && (
                <div className="p-4 border border-rust/30 bg-rust/5" role="alert">
                  <p className="font-body text-body-sm text-rust font-semibold mb-2">
                    {t('artworkSubmit.validationError', 'Please complete the following required fields:')}
                  </p>
                  <ul className="list-disc list-inside space-y-1">
                    {missingFields.map((field) => (
                      <li key={field} className="font-body text-caption text-rust">{field}</li>
                    ))}
                  </ul>
                </div>
              )}
            </motion.div>
          </form>
        </SectionContainer>
      </PaperTextureBackground>

      <MagazineDivider variant="decorative" />

      {/* Section 03: Review Status Timeline */}
      <SectionContainer className="section-spacing">
        <NumberedSectionHeading
          number="03"
          title={t('artworkSubmit.section03Title', 'Review Status Tracking')}
          subtitle={t('artworkSubmit.section03Subtitle', 'After submission, you can track the review progress and status updates here in real time.')}
        />

        {!isSubmitted && (
          <div className="mb-8 p-4 border border-warm-gray/30 bg-aged-stock/30 text-center">
            <p className="font-body text-body-sm text-sepia-mid">
              {t('artworkSubmit.timelineHint', 'Once you submit your artwork, the review progress will be updated here in real time')}
            </p>
          </div>
        )}

        <div className={`md:max-w-2xl mx-auto ${!isSubmitted ? 'opacity-40' : ''}`}>
          <div className="relative pl-8 md:pl-12">
            <div className="absolute left-[11px] md:left-[19px] top-2 bottom-2 w-px bg-warm-gray/40" aria-hidden="true" />

            {REVIEW_STEPS.map((step, idx) => {
              const isCompleted = idx < currentStep;
              const isCurrent = idx === currentStep;
              const isFuture = idx > currentStep;

              return (
                <motion.div
                  key={step.key}
                  {...fadeUp(idx * 0.1)}
                  className={`relative pb-10 last:pb-0 ${isFuture ? 'opacity-50' : ''}`}
                >
                  <div
                    className={`absolute -left-8 md:-left-12 top-0.5 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors duration-300 ${
                      isCompleted ? 'bg-rust border-rust' : ''
                    }${isCurrent ? ' bg-paper border-rust' : ''}${isFuture ? ' bg-paper border-warm-gray/40' : ''}`}
                  >
                    {isCompleted && (
                      <svg className="w-3.5 h-3.5 text-paper" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                    {isCurrent && (
                      <motion.div
                        animate={prefersReducedMotion ? {} : { scale: [1, 1.4, 1] }}
                        transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
                        className="w-2 h-2 rounded-full bg-rust"
                      />
                    )}
                    {isFuture && <div className="w-1.5 h-1.5 rounded-full bg-warm-gray/30" />}
                  </div>

                  <div>
                    <h3 className={`font-display text-lg font-semibold leading-tight mb-1 ${
                      isCurrent ? 'text-rust' : isCompleted ? 'text-ink' : 'text-ink-faded'
                    }`}>
                      {t(`artworkSubmit.step_${step.key}`, step.label)}
                    </h3>
                    <p className="font-body text-caption text-sepia-mid leading-relaxed">
                      {t(`artworkSubmit.step_${step.key}_desc`, step.description)}
                    </p>
                    {isCurrent && (
                      <motion.span
                        initial={prefersReducedMotion ? false : { opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="inline-block mt-2 font-body text-overline text-rust tracking-[0.15em] uppercase"
                      >
                        {t('artworkSubmit.currentStatus', 'Current Status')}
                      </motion.span>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </SectionContainer>

      <div className="editorial-divider" />
    </PageWrapper>
  );
}
