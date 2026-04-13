import { useState, useCallback, useMemo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, useReducedMotion } from 'framer-motion';
import PageWrapper from '@/components/layout/PageWrapper';
import SectionContainer from '@/components/layout/SectionContainer';
import NumberedSectionHeading from '@/components/editorial/NumberedSectionHeading';
import { VintageInput } from '@/components/editorial/VintageInput';
import SepiaImageFrame from '@/components/editorial/SepiaImageFrame';
import EditorialCard from '@/components/editorial/EditorialCard';
import GrainOverlay from '@/components/editorial/GrainOverlay';
import PaperTextureBackground from '@/components/editorial/PaperTextureBackground';
import MagazineDivider from '@/components/editorial/MagazineDivider';
import { VintageSelect } from '@/components/editorial/VintageSelect';
import { placeholderImage } from '@/utils/placeholderImage';

/* ─── Mock Campaign Data ─── */

const MOCK_CAMPAIGNS = [
  {
    id: 'campaign-001',
    title: 'Spring Blossoms — Children\'s Floral Art Exhibition',
    description: 'Inspired by spring flowers, young artists are invited to paint their dream gardens. Outstanding works will be printed on limited-edition eco-friendly scarves.',
    image: placeholderImage('Spring Blossoms', { hue: 45, width: 600, height: 400 }),
    deadline: '2026-05-15',
    submissions: 128,
  },
  {
    id: 'campaign-002',
    title: 'Ocean Guardian — Sustainable Fashion Illustration',
    description: 'Focus on ocean conservation themes and express your care for marine ecosystems through color. Selected artworks will be applied to a recycled-fabric clothing line.',
    image: placeholderImage('Ocean Guardian', { hue: 200, width: 600, height: 400 }),
    deadline: '2026-06-01',
    submissions: 86,
  },
  {
    id: 'campaign-003',
    title: 'Urban Forest — Green Living Art Creation',
    description: 'Depict your ideal green city and imagine a future where humans and nature coexist in harmony. Artworks will be used in an eco-friendly tote bag design series.',
    image: placeholderImage('Urban Forest', { hue: 120, width: 600, height: 400 }),
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

/* ─── Form State ─── */

interface FormState {
  campaignId: string;
  title: string;
  description: string;
  artworkFile: File | null;
  authorName: string;
  ageGroup: string;
  consentFile: File | null;
}

const INITIAL_FORM: FormState = {
  campaignId: '',
  title: '',
  description: '',
  artworkFile: null,
  authorName: '',
  ageGroup: '',
  consentFile: null,
};

/* ─── Main Page Component ─── */

export default function ArtworkSubmitPage() {
  const { t } = useTranslation();
  const prefersReducedMotion = useReducedMotion();
  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [showErrors, setShowErrors] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  // Before submission: -1 (no steps active). After submission: 1 (submitted=done, pending review=current)
  const currentStep = isSubmitted ? 1 : -1;

  const missingFields: string[] = [];
  if (!form.campaignId) missingFields.push('Campaign');
  if (!form.title.trim()) missingFields.push('Artwork title');
  if (!form.artworkFile) missingFields.push('Artwork image');
  if (!form.authorName.trim()) missingFields.push('Author name');
  if (!form.ageGroup) missingFields.push('Age group');
  if (!form.consentFile) missingFields.push('Guardian consent');

  const isFormValid = missingFields.length === 0;

  const artworkPreviewUrl = useMemo(() => {
    if (!form.artworkFile) return null;
    return URL.createObjectURL(form.artworkFile);
  }, [form.artworkFile]);

  useEffect(() => {
    return () => { if (artworkPreviewUrl) URL.revokeObjectURL(artworkPreviewUrl); };
  }, [artworkPreviewUrl]);

  const updateField = useCallback(
    <K extends keyof FormState>(key: K, value: FormState[K]) => {
      setForm((prev) => ({ ...prev, [key]: value }));
    },
    [],
  );

  const handleSelectCampaign = useCallback(
    (id: string) => updateField('campaignId', id),
    [updateField],
  );

  const handleArtworkFile = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0] ?? null;
      updateField('artworkFile', file);
    },
    [updateField],
  );

  const handleConsentFile = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0] ?? null;
      updateField('consentFile', file);
    },
    [updateField],
  );

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      setShowErrors(true);
      if (!isFormValid) return;
      setIsSubmitted(true);
    },
    [isFormValid],
  );

  /* ─── Animation Variants ─── */

  const stagger = {
    hidden: {},
    visible: {
      transition: { staggerChildren: prefersReducedMotion ? 0 : 0.1 },
    },
  };

  const fadeUp = prefersReducedMotion
    ? { hidden: {}, visible: {} }
    : {
        hidden: { opacity: 0, y: 24 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0, 0, 0.2, 1] } },
      };

  /* ─── Render ─── */

  return (
    <PaperTextureBackground variant="paper">
      <GrainOverlay />
      <PageWrapper>
        {/* ── Page Header ── */}
        <SectionContainer className="section-spacing">
          <motion.div
            initial={prefersReducedMotion ? false : { opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.7, ease: [0, 0, 0.2, 1] }}
            className="max-w-2xl"
          >
            <span className="font-body text-overline text-rust tracking-[0.25em] uppercase block mb-4">
              {t('artworkSubmit.badge', 'Artwork Submission & Review')}
            </span>
            <h1 className="font-display text-h1 md:text-[3.5rem] font-bold leading-[0.95] tracking-[-0.025em] text-ink mb-6">
              {t('artworkSubmit.heroTitle', 'Change Fashion with Your Brush')}
            </h1>
            <p className="font-body text-body-sm md:text-base text-ink-faded leading-relaxed max-w-lg">
              {t(
                'artworkSubmit.heroDescription',
                'Choose a campaign and submit your original artwork. Once approved, your art may be featured on sustainable fashion products.',
              )}
            </p>
          </motion.div>
        </SectionContainer>

        <MagazineDivider variant="decorative" />

        {/* ── Section 01: Campaign Selection ── */}
        <SectionContainer className="section-spacing">
          <NumberedSectionHeading
            number="01"
            title={t('artworkSubmit.section01Title', 'Select a Campaign')}
            subtitle={t('artworkSubmit.section01Subtitle', 'Choose the campaign you want to participate in. Each campaign has a different theme and deadline.')}
          />

          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-80px' }}
            className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-12"
          >
            {MOCK_CAMPAIGNS.map((campaign, idx) => (
              <motion.div
                key={campaign.id}
                variants={fadeUp}
                className="md:col-span-4"
              >
                <EditorialCard
                  title={campaign.title}
                  subtitle={`${t('artworkSubmit.deadline', 'Deadline')}: ${campaign.deadline}`}
                  description={campaign.description}
                  image={campaign.image}
                  imageAlt={campaign.title}
                  index={idx}
                  onClick={() => handleSelectCampaign(campaign.id)}
                  hoverEffect="lift"
                  className={`h-full transition-all duration-300 ${
                    form.campaignId === campaign.id
                      ? 'ring-2 ring-rust shadow-lg'
                      : ''
                  }`}
                >
                  <div className="flex items-center justify-between mt-2">
                    <span className="font-body text-caption text-sepia-mid">
                      {campaign.submissions} {t('artworkSubmit.submissions', 'submissions')}
                    </span>
                    {form.campaignId === campaign.id && (
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
          </motion.div>
        </SectionContainer>

        <MagazineDivider variant="numbered" number="II" />

        {/* ── Section 02: Artwork Submission Form ── */}
        <SectionContainer className="section-spacing">
          <NumberedSectionHeading
            number="02"
            title={t('artworkSubmit.section02Title', 'Submit Artwork')}
            subtitle={t('artworkSubmit.section02Subtitle', 'Fill in artwork details and upload your work. Please ensure the image is clear and all information is complete.')}
          />

          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-12">
            {/* Left Column: Form Fields */}
            <motion.div
              initial={prefersReducedMotion ? false : { opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.6, ease: [0, 0, 0.2, 1] }}
              className="md:col-span-7 space-y-8"
            >
              <VintageInput
                label={t('artworkSubmit.artworkTitle', 'Artwork Title')}
                placeholder={t('artworkSubmit.artworkTitlePlaceholder', 'Give your artwork a name')}
                value={form.title}
                onChange={(e) => updateField('title', (e.target as HTMLInputElement).value)}
              />

              <VintageInput
                label={t('artworkSubmit.artworkDescription', 'Artwork Description')}
                type="textarea"
                placeholder={t('artworkSubmit.artworkDescriptionPlaceholder', 'Describe your creative inspiration and artwork content...')}
                value={form.description}
                onChange={(e) => updateField('description', (e.target as HTMLTextAreaElement).value)}
              />

              <VintageInput
                label={t('artworkSubmit.authorName', 'Author Name / Pen Name')}
                placeholder={t('artworkSubmit.authorNamePlaceholder', 'Young artist\'s name or pen name')}
                icon="user"
                value={form.authorName}
                onChange={(e) => updateField('authorName', (e.target as HTMLInputElement).value)}
              />

              <VintageSelect
                label={t('artworkSubmit.ageGroup', 'Age Group')}
                options={AGE_GROUP_OPTIONS}
                value={form.ageGroup}
                onChange={(e) => updateField('ageGroup', e.target.value)}
              />

              {/* Guardian Consent Upload (mandatory for all minor age groups) */}
              <motion.div
                variants={fadeUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                className="space-y-3"
              >
                <label className="font-body text-overline text-sepia-mid tracking-[0.2em] uppercase block">
                  {t('artworkSubmit.consentForm', 'Guardian Consent Form (Required)')}
                </label>
                <p className="font-body text-caption text-sepia-mid">
                  {t(
                    'artworkSubmit.consentFormHint',
                    'All participants are minors (ages 3-15). A guardian consent form must be uploaded when submitting artwork.',
                  )}
                </p>
                <div className="relative border-2 border-dashed border-rust/30 bg-aged-stock/50 p-6 text-center transition-colors hover:border-rust/50 hover:bg-aged-stock/80">
                  <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-rust/30 pointer-events-none" aria-hidden="true" />
                  <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-rust/30 pointer-events-none" aria-hidden="true" />
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={handleConsentFile}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <svg className="w-8 h-8 mx-auto text-sepia-mid mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  {form.consentFile ? (
                    <p className="font-body text-body-sm text-rust">{form.consentFile.name}</p>
                  ) : (
                    <p className="font-body text-caption text-sepia-mid">
                      {t('artworkSubmit.consentUploadHint', 'Click to upload guardian consent form (PDF or image)')}
                    </p>
                  )}
                </div>
              </motion.div>
            </motion.div>

            {/* Right Column: Artwork Upload */}
            <motion.div
              initial={prefersReducedMotion ? false : { opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.6, ease: [0, 0, 0.2, 1], delay: 0.15 }}
              className="md:col-span-5 space-y-6"
            >
              <label className="font-body text-overline text-sepia-mid tracking-[0.2em] uppercase block">
                {t('artworkSubmit.uploadArtwork', 'Upload Artwork Image')}
              </label>

              <div className="relative border-2 border-dashed border-rust/30 bg-aged-stock/40 aspect-[3/4] flex flex-col items-center justify-center text-center transition-colors hover:border-rust/50 hover:bg-aged-stock/70 group">
                {/* Corner accents */}
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
                      alt={form.title || t('artworkSubmit.artworkPreview', 'Artwork Preview')}
                      aspectRatio="portrait"
                      size="full"
                      showCornerAccents={false}
                    />
                  </div>
                ) : (
                  <>
                    <svg
                      className="w-12 h-12 text-rust/40 mb-4 group-hover:text-rust/60 transition-colors"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={1}
                    >
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
                className={`
                  w-full py-4 px-8
                  font-body text-overline tracking-[0.2em] uppercase
                  border-2 transition-all duration-300 relative
                  ${isFormValid
                    ? 'bg-ink text-paper border-ink hover:bg-rust hover:border-rust cursor-pointer'
                    : 'bg-ink/60 text-paper/70 border-ink/40 cursor-pointer'}
                `}
              >
                <span className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-paper/20 pointer-events-none" aria-hidden="true" />
                <span className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-paper/20 pointer-events-none" aria-hidden="true" />
                {t('artworkSubmit.submitButton', 'Submit Artwork')}
              </motion.button>

              {/* Validation Error Messages */}
              {showErrors && missingFields.length > 0 && (
                <div className="mt-4 p-4 border border-rust/30 bg-rust/5">
                  <p className="font-body text-body-sm text-rust font-semibold mb-2">
                    {t('artworkSubmit.validationError', 'Please complete the following required fields:')}
                  </p>
                  <ul className="list-disc list-inside space-y-1">
                    {missingFields.map((field) => (
                      <li key={field} className="font-body text-caption text-rust">
                        {field}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </motion.div>
          </form>
        </SectionContainer>

        <MagazineDivider variant="numbered" number="III" />

        {/* ── Section 03: Review Status Timeline ── */}
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

          <div className={`grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-12 ${!isSubmitted ? 'opacity-40' : ''}`}>
            <motion.div
              initial={prefersReducedMotion ? false : { opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.6 }}
              className="md:col-span-8 md:col-start-3"
            >
              <div className="relative pl-8 md:pl-12">
                {/* Vertical timeline line */}
                <div
                  className="absolute left-[11px] md:left-[19px] top-2 bottom-2 w-px bg-warm-gray/40"
                  aria-hidden="true"
                />

                {REVIEW_STEPS.map((step, idx) => {
                  const isCompleted = idx < currentStep;
                  const isCurrent = idx === currentStep;
                  const isFuture = idx > currentStep;

                  return (
                    <motion.div
                      key={step.key}
                      initial={prefersReducedMotion ? false : { opacity: 0, x: -16 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={
                        prefersReducedMotion
                          ? { duration: 0 }
                          : { duration: 0.5, ease: [0, 0, 0.2, 1], delay: idx * 0.1 }
                      }
                      className={`relative pb-10 last:pb-0 ${isFuture ? 'opacity-50' : ''}`}
                    >
                      {/* Step Indicator */}
                      <div
                        className={`
                          absolute -left-8 md:-left-12 top-0.5
                          w-6 h-6 rounded-full border-2
                          flex items-center justify-center
                          transition-colors duration-300
                          ${isCompleted ? 'bg-rust border-rust' : ''}
                          ${isCurrent ? 'bg-paper border-rust shadow-[0_0_0_4px_rgba(var(--color-rust-rgb,180,90,50),0.15)]' : ''}
                          ${isFuture ? 'bg-paper border-warm-gray/40' : ''}
                        `}
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
                        {isFuture && (
                          <div className="w-1.5 h-1.5 rounded-full bg-warm-gray/30" />
                        )}
                      </div>

                      {/* Step Content */}
                      <div>
                        <h3
                          className={`font-display text-lg font-semibold leading-tight mb-1 ${
                            isCurrent ? 'text-rust' : isCompleted ? 'text-ink' : 'text-ink-faded'
                          }`}
                        >
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
            </motion.div>
          </div>
        </SectionContainer>

        <MagazineDivider variant="decorative" className="mb-16" />
      </PageWrapper>
    </PaperTextureBackground>
  );
}
