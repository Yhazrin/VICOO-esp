import { useState, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import PageWrapper from '@/components/layout/PageWrapper';
import SectionContainer from '@/components/layout/SectionContainer';
import EditorialHero from '@/components/editorial/EditorialHero';
import NumberedSectionHeading from '@/components/editorial/NumberedSectionHeading';
import SepiaImageFrame from '@/components/editorial/SepiaImageFrame';
import FAQAccordion from '@/components/editorial/FAQAccordion';
import StoryQuoteBlock from '@/components/editorial/StoryQuoteBlock';
import { ScrollPathDrawInline } from '@/components/animations/ScrollPathDraw';
import { VintageInput } from '@/components/editorial/VintageInput';
import { VintageSelect } from '@/components/editorial/VintageSelect';
import { useScrollReveal } from '@/hooks/useScrollReveal';
import { contactApi } from '@/services/contact';
import SectionGrainOverlay from '@/components/editorial/SectionGrainOverlay';

const MAX_MESSAGE_LENGTH = 1000;

type FormStatus = 'idle' | 'validation' | 'sending' | 'success' | 'error';

interface FormErrors {
  name?: string;
  email?: string;
  subject?: string;
  message?: string;
}

// SVG icons for contact cards
function EmailIcon() {
  return (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.2} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
    </svg>
  );
}

function LocationIcon() {
  return (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.2} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.2} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function CheckmarkIcon({ prefersReducedMotion }: { prefersReducedMotion: boolean | null }) {
  if (prefersReducedMotion) {
    return (
      <svg
        aria-hidden="true"
        className="w-12 h-12 text-rust"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    );
  }

  return (
    <motion.svg
      className="w-12 h-12 text-rust"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      {...(prefersReducedMotion ? {} : { initial: { pathLength: 0 }, animate: { pathLength: 1 }, transition: { duration: 0.6, ease: [0, 0, 0.2, 1] } })}
    >
      <motion.path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        {...(prefersReducedMotion ? {} : { initial: { pathLength: 0 }, animate: { pathLength: 1 }, transition: { duration: 0.6, ease: [0, 0, 0.2, 1] } })}
      />
    </motion.svg>
  );
}

interface ContactCardData {
  icon: React.ReactNode;
  titleKey: string;
  descKey: string;
  imageSeed: string;
}

const CONTACT_CARDS: ContactCardData[] = [
  {
    icon: <EmailIcon />,
    titleKey: 'contact.cards.email.title',
    descKey: 'contact.cards.email.description',
    imageSeed: 'contact-email',
  },
  {
    icon: <LocationIcon />,
    titleKey: 'contact.cards.location.title',
    descKey: 'contact.cards.location.description',
    imageSeed: 'contact-office',
  },
  {
    icon: <ClockIcon />,
    titleKey: 'contact.cards.responseTime.title',
    descKey: 'contact.cards.responseTime.description',
    imageSeed: 'contact-clock',
  },
];

function ContactInfoCard({
  card,
  index,
  prefersReducedMotion,
}: {
  card: ContactCardData;
  index: number;
  prefersReducedMotion: boolean | null;
}) {
  const { t } = useTranslation();
  const [ref, isVisible] = useScrollReveal<HTMLDivElement>();

  return (
    <motion.div
      ref={ref}
      {...(prefersReducedMotion ? {} : {
        initial: { opacity: 0, y: 30 },
        animate: isVisible ? { opacity: 1, y: 0 } : {},
        transition: {
          duration: 0.6,
          ease: [0, 0, 0.2, 1],
          delay: index * 0.15,
        },
      })}
      className="group"
    >
      <div className="relative border-2 border-warm-gray/50 bg-paper overflow-hidden">
        <SectionGrainOverlay />

        {/* Corner accents — diagonal pattern */}
        <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-rust/30 pointer-events-none" aria-hidden="true" />
        <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-rust/30 pointer-events-none" aria-hidden="true" />

        {/* Image */}
        <div className="relative aspect-[16/9] overflow-hidden">
          <div className="absolute inset-0 z-10 pointer-events-none bg-gradient-to-br from-pale-gold/10 via-transparent to-archive-brown/10" />
          <div className="absolute inset-0 z-10 pointer-events-none" style={{ boxShadow: 'inset 0 0 40px color-mix(in srgb, var(--color-ink) 15%, transparent)' }} />
          <img
            src={`https://picsum.photos/seed/${card.imageSeed}/600/338`}
            alt={t(card.titleKey)}
            className="w-full h-full object-cover sepia-[0.1] transition-transform duration-700 group-hover:scale-105"
            loading="lazy"
          />
        </div>

        {/* Content */}
        <div className="p-5 md:p-6 relative z-10">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-rust/70">
              {card.icon}
            </span>
            <h3 className="font-display text-lg font-semibold text-ink">
              {t(card.titleKey)}
            </h3>
          </div>
          <p className="font-body text-body-sm text-ink-faded leading-relaxed">
            {t(card.descKey)}
          </p>
        </div>
      </div>
    </motion.div>
  );
}

// Loading dots animation for submit button
function LoadingDots() {
  const prefersReducedMotion = useReducedMotion();

  if (prefersReducedMotion) {
    return (
      <span className="inline-flex items-center gap-1">
        {[0, 1, 2].map((i) => (
          <span key={i} className="inline-block w-1 h-1 rounded-sm bg-paper" />
        ))}
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="inline-block w-1 h-1 rounded-sm bg-paper"
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{
            duration: 1,
            repeat: Infinity,
            delay: i * 0.2,
            ease: 'easeInOut',
          }}
        />
      ))}
    </span>
  );
}

export default function Contact() {
  const { t } = useTranslation();
  const prefersReducedMotion = useReducedMotion();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });
  const [status, setStatus] = useState<FormStatus>('idle');
  const [errors, setErrors] = useState<FormErrors>({});
  const pullQuoteRef = useRef<HTMLDivElement>(null);

  // FAQ items from translations
  const faqItems = t('contact.faq.items', { returnObjects: true }) as Array<{
    question: string;
    answer: string;
  }>;

  // Subject options
  const subjectOptions = [
    { value: 'general', label: t('contact.form.subjectOptions.general') },
    { value: 'donation', label: t('contact.form.subjectOptions.donation') },
    { value: 'order', label: t('contact.form.subjectOptions.order') },
    { value: 'partnership', label: t('contact.form.subjectOptions.partnership') },
    { value: 'artwork', label: t('contact.form.subjectOptions.artwork') },
    { value: 'other', label: t('contact.form.subjectOptions.other') },
  ];

  const validateForm = useCallback((): FormErrors => {
    const newErrors: FormErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = t('contact.form.requiredField');
    }
    if (!formData.email.trim()) {
      newErrors.email = t('contact.form.requiredField');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = t('contact.form.invalidEmail');
    }
    if (!formData.subject) {
      newErrors.subject = t('contact.form.requiredField');
    }
    if (!formData.message.trim()) {
      newErrors.message = t('contact.form.requiredField');
    }

    return newErrors;
  }, [formData, t]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      setStatus('validation');
      return;
    }

    setErrors({});
    setStatus('sending');

    try {
      await contactApi.submit({
        name: formData.name.trim(),
        email: formData.email.trim(),
        subject: formData.subject,
        message: formData.message.trim(),
      });
      setStatus('success');
      setFormData({ name: '', email: '', subject: '', message: '' });
    } catch {
      setStatus('error');
    }
  };

  const handleChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const value = e.target.value;

    // Enforce character limit on message
    if (field === 'message' && value.length > MAX_MESSAGE_LENGTH) {
      return;
    }

    setFormData((prev) => ({ ...prev, [field]: value }));

    // Clear field error on change
    if (errors[field as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const handleSubjectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFormData((prev) => ({ ...prev, subject: e.target.value }));
    if (errors.subject) {
      setErrors((prev) => ({ ...prev, subject: undefined }));
    }
  };

  const resetForm = () => {
    setStatus('idle');
    setErrors({});
  };

  return (
    <PageWrapper>
      {/* Hero Section */}
      <EditorialHero
        title={t('contact.hero.title')}
        subtitle={t('contact.hero.welcome')}
        fullHeight={false}
      />

      {/* FAQ Section */}
      <SectionContainer noTopSpacing>
        <NumberedSectionHeading number="01" title={t('contact.faq.title')} />

        <div className="max-w-3xl">
          {Array.isArray(faqItems) && <FAQAccordion items={faqItems} />}
        </div>
      </SectionContainer>

      {/* Pull quote connector */}
      <div ref={pullQuoteRef} className="relative max-w-[1400px] mx-auto px-6 md:px-10">
        <ScrollPathDrawInline
          path="M 0 0 C 20 40, 40 60, 60 30 S 100 80, 120 50"
          strokeColor="var(--color-rust)"
          strokeWidth={1}
          className="absolute left-0 top-0 h-full w-16 pointer-events-none opacity-20"
          containerRef={pullQuoteRef}
        />
        <StoryQuoteBlock
          quote={t('contact.pullQuote.quote', { defaultValue: 'Every question is an invitation to understand our mission more deeply — and every answer is a chance to weave another thread of trust.' })}
          author={t('contact.pullQuote.author', { defaultValue: 'VICOO Editorial' })}
          role={t('contact.pullQuote.role', { defaultValue: 'Community Engagement' })}
        />
      </div>

      {/* Contact Form + Info */}
      <SectionContainer>
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 md:gap-16">
          {/* Form */}
          <div className="md:col-span-7">
            <NumberedSectionHeading number="02" title={t('contact.formTitle')} />

            <AnimatePresence mode="wait">
              {status === 'success' ? (
                <motion.div
                  key="success"
                  {...(prefersReducedMotion ? {} : { initial: { opacity: 0, scale: 0.95 }, animate: { opacity: 1, scale: 1 }, exit: { opacity: 0, scale: 0.95 }, transition: { duration: 0.5, ease: [0, 0, 0.2, 1] } })}
                  className="border-2 border-rust/30 bg-paper p-10 md:p-14 text-center relative"
                >
                  <SectionGrainOverlay />

                  {/* Corner accents — diagonal pattern */}
                  <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-rust/30 pointer-events-none" aria-hidden="true" />
                  <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-rust/30 pointer-events-none" aria-hidden="true" />

                  <div className="relative z-10 flex flex-col items-center">
                    <CheckmarkIcon prefersReducedMotion={prefersReducedMotion} />

                    <h3 className="font-display text-h3 font-bold text-ink mt-6">
                      {t('contact.form.successTitle')}
                    </h3>

                    <p className="font-body text-body-sm md:text-body text-ink-faded mt-3 max-w-md leading-relaxed">
                      {t('contact.form.success')}
                    </p>

                    <motion.button
                      type="button"
                      onClick={resetForm}
                      whileHover={prefersReducedMotion ? undefined : { scale: 1.01 }}
                      whileTap={prefersReducedMotion ? undefined : { scale: 0.99 }}
                      className="mt-8 font-body text-body-sm tracking-[0.15em] uppercase border-2 border-ink text-ink px-8 py-3 hover:bg-ink hover:text-paper transition-colors duration-300 cursor-pointer"
                    >
                      {t('contact.form.submit')}
                    </motion.button>
                  </div>
                </motion.div>
              ) : (
                <motion.form
                  key="form"
                  {...(prefersReducedMotion ? {} : { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } })}
                  onSubmit={handleSubmit}
                  className="space-y-8"
                  noValidate
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <VintageInput
                      label={t('contact.form.name')}
                      type="text"
                      value={formData.name}
                      onChange={handleChange('name')}
                      error={errors.name}
                      required
                    />
                    <VintageInput
                      label={t('contact.form.email')}
                      type="email"
                      value={formData.email}
                      onChange={handleChange('email')}
                      error={errors.email}
                      required
                    />
                  </div>

                  {/* Subject dropdown */}
                  <VintageSelect
                    id="contact-subject"
                    label={t('contact.form.subject')}
                    options={[
                      { value: '', label: t('contact.form.subjectPlaceholder') },
                      ...subjectOptions,
                    ]}
                    value={formData.subject}
                    onChange={handleSubjectChange}
                    error={errors.subject}
                    required
                  />

                  {/* Message textarea with character counter */}
                  <div className="space-y-2">
                    <label
                      htmlFor="contact-message"
                      className="font-body text-overline tracking-[0.2em] uppercase text-sepia-mid block"
                    >
                      {t('contact.form.message')}
                    </label>
                    <div className="relative">
                      <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-rust/30 pointer-events-none z-10" />
                      <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-rust/30 pointer-events-none z-10" />
                      <motion.textarea
                        id="contact-message"
                        value={formData.message}
                        onChange={handleChange('message')}
                        rows={5}
                        aria-describedby={errors.message ? 'contact-message-error' : undefined}
                        aria-invalid={!!errors.message}
                        whileFocus={prefersReducedMotion ? undefined : { scale: 1.005 }}
                        className={`
                          w-full font-body text-body-sm py-3 px-3
                          border-b-2 bg-transparent
                          transition-all duration-300
                          placeholder:text-ink-faded/80
                          focus:outline-none focus-visible:ring-2 focus-visible:ring-rust/50 focus:border-rust
                          ${errors.message ? 'border-archive-brown' : 'border-warm-gray/60'}
                        `}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      {errors.message ? (
                        <motion.p
                          id="contact-message-error"
                          initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: -5 }}
                          animate={prefersReducedMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
                          role="alert"
                          className="font-body text-overline text-archive-brown"
                        >
                          {errors.message}
                        </motion.p>
                      ) : (
                        <span />
                      )}
                      <span
                        className={`font-body text-overline tracking-wide transition-colors duration-200 ${
                          formData.message.length > MAX_MESSAGE_LENGTH * 0.9
                            ? 'text-archive-brown'
                            : 'text-sepia-mid/60'
                        }`}
                      >
                        {t('contact.form.characterCount', { count: formData.message.length, max: MAX_MESSAGE_LENGTH })}
                      </span>
                    </div>
                  </div>

                  {/* Submit button */}
                  <div className="flex items-center gap-6">
                    <motion.button
                      type="submit"
                      disabled={status === 'sending'}
                      whileHover={prefersReducedMotion ? undefined : { scale: 1.01 }}
                      whileTap={prefersReducedMotion ? undefined : { scale: 0.99 }}
                      className="font-body text-body-sm tracking-[0.15em] uppercase bg-ink text-paper px-10 py-4 hover:bg-rust transition-colors duration-300 disabled:opacity-60 flex items-center gap-3 cursor-pointer"
                    >
                      {status === 'sending' ? (
                        <>
                          <span>{t('contact.form.sending')}</span>
                          <LoadingDots />
                        </>
                      ) : (
                        t('contact.form.submit')
                      )}
                    </motion.button>
                  </div>

                  {/* Error state */}
                  {status === 'error' && (
                    <motion.p
                      initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 10 }}
                      animate={prefersReducedMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
                      role="alert"
                      className="font-body text-body-sm text-archive-brown"
                    >
                      {t('contact.form.error')}
                    </motion.p>
                  )}
                </motion.form>
              )}
            </AnimatePresence>
          </div>

          {/* Contact info sidebar */}
          <div className="md:col-span-5">
            <NumberedSectionHeading number="03" title={t('contact.info.title')} />

            <div className="space-y-8">
              <div>
                <span className="font-body text-caption text-sepia-mid tracking-[0.2em] uppercase">
                  {t('contact.info.emailLabel')}
                </span>
                <a
                  href={`mailto:${t('contact.info.email')}`}
                  className="block font-display text-h3 font-semibold text-ink mt-2 hover:text-rust transition-colors cursor-pointer"
                >
                  {t('contact.info.email')}
                </a>
              </div>

              <div>
                <span className="font-body text-caption text-sepia-mid tracking-[0.2em] uppercase">
                  {t('contact.info.wechatLabel')}
                </span>
                <p className="font-display text-h3 font-semibold text-ink mt-2">
                  {t('contact.info.wechat')}
                </p>
              </div>

              <div>
                <span className="font-body text-caption text-sepia-mid tracking-[0.2em] uppercase">
                  {t('contact.info.locationLabel')}
                </span>
                <p className="font-display text-h3 font-semibold text-ink mt-2">
                  {t('contact.info.address')}
                </p>
              </div>
            </div>

            {/* Decorative image */}
            <div className="mt-12">
              <SepiaImageFrame
                src="https://picsum.photos/seed/vicoo-shanghai-office/600/450"
                alt={t('contact.info.officeCaption')}
                caption={t('contact.info.officeCaption')}
                aspectRatio="landscape"
                size="full"
              />
            </div>
          </div>
        </div>
      </SectionContainer>

      {/* Contact Info Cards */}
      <SectionContainer>
        <NumberedSectionHeading number="04" title={t('contact.contactTitle')} />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
          {CONTACT_CARDS.map((card, index) => (
            <ContactInfoCard key={card.imageSeed} card={card} index={index} prefersReducedMotion={prefersReducedMotion} />
          ))}
        </div>
      </SectionContainer>

      <div className="editorial-divider" aria-hidden="true" />
    </PageWrapper>
  );
}
