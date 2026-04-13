import { useState, useCallback } from 'react';
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

/* ─── Mock Campaign Data ─── */

const MOCK_CAMPAIGNS = [
  {
    id: 'campaign-001',
    title: '春日花语 — 儿童花卉主题画展',
    description: '以春天的花朵为灵感，邀请小画家们用画笔描绘心中的花园世界。优秀作品将印制于限量环保丝巾上。',
    image: '/images/campaigns/spring-flowers.jpg',
    deadline: '2026-05-15',
    submissions: 128,
  },
  {
    id: 'campaign-002',
    title: '海洋守护者 — 可持续时尚插画征集',
    description: '关注海洋环保主题，用色彩表达对海洋生态的关爱。入选画作将应用于再生面料服饰系列。',
    image: '/images/campaigns/ocean-guardian.jpg',
    deadline: '2026-06-01',
    submissions: 86,
  },
  {
    id: 'campaign-003',
    title: '城市森林 — 绿色生活艺术创作',
    description: '描绘你理想中的绿色城市，想象人与自然和谐共处的未来。作品将用于环保手提袋系列设计。',
    image: '/images/campaigns/urban-forest.jpg',
    deadline: '2026-06-20',
    submissions: 52,
  },
];

/* ─── Review Timeline Steps ─── */

const REVIEW_STEPS = [
  { key: 'submitted', label: '已提交', description: '画作已成功上传至平台' },
  { key: 'pending', label: '待审核', description: '运营团队正在审核您的作品' },
  { key: 'result', label: '审核通过 / 驳回', description: '审核结果将通过站内信通知' },
  { key: 'voting', label: '公开投票', description: '通过审核的作品将参与公众投票' },
  { key: 'commercialize', label: '入选商品化', description: '优秀画作将被应用于可持续时尚产品' },
];

/* ─── Age Group Options ─── */

const AGE_GROUP_OPTIONS = [
  { value: '', label: '请选择年龄段' },
  { value: '3-6', label: '3-6岁' },
  { value: '7-9', label: '7-9岁' },
  { value: '10-12', label: '10-12岁' },
  { value: '13-15', label: '13-15岁' },
];

/* ─── Form State ─── */

interface FormState {
  campaignId: string;
  title: string;
  description: string;
  artworkFile: File | null;
  authorName: string;
  ageGroup: string;
  involvesChild: boolean;
  consentFile: File | null;
}

const INITIAL_FORM: FormState = {
  campaignId: '',
  title: '',
  description: '',
  artworkFile: null,
  authorName: '',
  ageGroup: '',
  involvesChild: false,
  consentFile: null,
};

/* ─── Main Page Component ─── */

export default function ArtworkSubmitPage() {
  const { t } = useTranslation();
  const prefersReducedMotion = useReducedMotion();
  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [currentStep] = useState(1); // 0-indexed: step 1 = "pending review"

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
      // eslint-disable-next-line no-console
      console.log('Submitting artwork:', form);
    },
    [form],
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
              {t('artworkSubmit.badge', '画作提交与审核')}
            </span>
            <h1 className="font-display text-h1 md:text-[3.5rem] font-bold leading-[0.95] tracking-[-0.025em] text-ink mb-6">
              {t('artworkSubmit.heroTitle', '用画笔改变时尚')}
            </h1>
            <p className="font-body text-body-sm md:text-base text-ink-faded leading-relaxed max-w-lg">
              {t(
                'artworkSubmit.heroDescription',
                '选择一个征集活动，提交你的原创画作。通过审核后，你的艺术创作将有机会被应用于可持续时尚产品。',
              )}
            </p>
          </motion.div>
        </SectionContainer>

        <MagazineDivider variant="decorative" />

        {/* ── Section 01: Campaign Selection ── */}
        <SectionContainer className="section-spacing">
          <NumberedSectionHeading
            number="01"
            title={t('artworkSubmit.section01Title', '选择征集活动')}
            subtitle={t('artworkSubmit.section01Subtitle', '选择你想要参与的征集活动，每个活动有不同的主题和截止日期。')}
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
                  subtitle={`${t('artworkSubmit.deadline', '截止日期')}: ${campaign.deadline}`}
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
                      {campaign.submissions} {t('artworkSubmit.submissions', '件作品')}
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
                        {t('artworkSubmit.selected', '已选择')}
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
            title={t('artworkSubmit.section02Title', '提交画作')}
            subtitle={t('artworkSubmit.section02Subtitle', '填写画作信息并上传你的作品，请确保图片清晰、信息完整。')}
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
                label={t('artworkSubmit.artworkTitle', '画作标题')}
                placeholder={t('artworkSubmit.artworkTitlePlaceholder', '为你的画作起一个名字')}
                value={form.title}
                onChange={(e) => updateField('title', (e.target as HTMLInputElement).value)}
              />

              <VintageInput
                label={t('artworkSubmit.artworkDescription', '画作描述')}
                type="textarea"
                placeholder={t('artworkSubmit.artworkDescriptionPlaceholder', '描述你的创作灵感与画面内容...')}
                value={form.description}
                onChange={(e) => updateField('description', (e.target as HTMLTextAreaElement).value)}
              />

              <VintageInput
                label={t('artworkSubmit.authorName', '作者名 / 笔名')}
                placeholder={t('artworkSubmit.authorNamePlaceholder', '小画家的名字或笔名')}
                icon="user"
                value={form.authorName}
                onChange={(e) => updateField('authorName', (e.target as HTMLInputElement).value)}
              />

              <VintageSelect
                label={t('artworkSubmit.ageGroup', '年龄段')}
                options={AGE_GROUP_OPTIONS}
                value={form.ageGroup}
                onChange={(e) => updateField('ageGroup', e.target.value)}
              />

              {/* Child Involvement Checkbox */}
              <motion.div
                variants={fadeUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                className="space-y-4"
              >
                <label className="flex items-start gap-3 cursor-pointer group">
                  <div className="relative mt-0.5">
                    <input
                      type="checkbox"
                      checked={form.involvesChild}
                      onChange={(e) => updateField('involvesChild', e.target.checked)}
                      className="peer sr-only"
                    />
                    <div className="w-5 h-5 border-2 border-warm-gray/60 bg-transparent transition-colors peer-checked:border-rust peer-checked:bg-rust/10 peer-focus-visible:ring-2 peer-focus-visible:ring-rust/50" />
                    <svg
                      className="absolute inset-0 w-5 h-5 text-rust opacity-0 peer-checked:opacity-100 transition-opacity pointer-events-none"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2.5}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="font-body text-body-sm text-ink leading-relaxed">
                    {t('artworkSubmit.involvesChild', '是否涉及儿童参与')}
                    <span className="block text-caption text-sepia-mid mt-1">
                      {t(
                        'artworkSubmit.involvesChildHint',
                        '如作者为未成年人，需上传监护人同意书方可参与征集活动',
                      )}
                    </span>
                  </span>
                </label>

                {/* Guardian Consent Upload (conditional) */}
                {form.involvesChild && (
                  <motion.div
                    initial={prefersReducedMotion ? false : { opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.4, ease: [0, 0, 0.2, 1] }}
                    className="ml-8"
                  >
                    <label className="font-body text-overline text-sepia-mid tracking-[0.2em] uppercase block mb-3">
                      {t('artworkSubmit.consentForm', '监护人同意书')}
                    </label>
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
                          {t('artworkSubmit.consentUploadHint', '点击上传 PDF 或图片格式的监护人同意书')}
                        </p>
                      )}
                    </div>
                  </motion.div>
                )}
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
                {t('artworkSubmit.uploadArtwork', '上传画作图片')}
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

                {form.artworkFile ? (
                  <div className="p-4 w-full h-full">
                    <SepiaImageFrame
                      src={URL.createObjectURL(form.artworkFile)}
                      alt={form.title || t('artworkSubmit.artworkPreview', '画作预览')}
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
                      {t('artworkSubmit.uploadPrompt', '点击或拖拽上传画作')}
                    </p>
                    <p className="font-body text-caption text-sepia-mid">
                      {t('artworkSubmit.uploadFormats', '支持 JPG、PNG、TIFF 格式，最大 20MB')}
                    </p>
                  </>
                )}
              </div>

              {/* Submit Button */}
              <motion.button
                type="submit"
                whileHover={prefersReducedMotion ? undefined : { scale: 1.02 }}
                whileTap={prefersReducedMotion ? undefined : { scale: 0.98 }}
                disabled={!form.campaignId || !form.title || !form.artworkFile}
                className="
                  w-full py-4 px-8
                  font-body text-overline tracking-[0.2em] uppercase
                  bg-ink text-paper
                  border-2 border-ink
                  transition-all duration-300
                  hover:bg-rust hover:border-rust
                  disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-ink
                  relative
                "
              >
                <span className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-paper/20 pointer-events-none" aria-hidden="true" />
                <span className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-paper/20 pointer-events-none" aria-hidden="true" />
                {t('artworkSubmit.submitButton', '提交画作')}
              </motion.button>
            </motion.div>
          </form>
        </SectionContainer>

        <MagazineDivider variant="numbered" number="III" />

        {/* ── Section 03: Review Status Timeline ── */}
        <SectionContainer className="section-spacing">
          <NumberedSectionHeading
            number="03"
            title={t('artworkSubmit.section03Title', '审核状态追踪')}
            subtitle={t('artworkSubmit.section03Subtitle', '提交后，你可以在此实时追踪画作的审核进度与状态变更。')}
          />

          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-12">
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
                            {t('artworkSubmit.currentStatus', '当前状态')}
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
