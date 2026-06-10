import { useState, type ChangeEvent } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, useReducedMotion } from 'framer-motion';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import PageWrapper from '@/components/layout/PageWrapper';
import SectionContainer from '@/components/layout/SectionContainer';
import { VintageInput } from '@/components/editorial/VintageInput';
import { VintageSelect } from '@/components/editorial/VintageSelect';
import { afterSalesApi } from '@/services/afterSales';
import { useAuthStore } from '@/stores/authStore';

export default function Support() {
  const { t } = useTranslation();
  const prefersReducedMotion = useReducedMotion();
  const qc = useQueryClient();
  const { isAuthenticated } = useAuthStore();
  const [orderId, setOrderId] = useState('');
  const [category, setCategory] = useState('quality');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [fieldError, setFieldError] = useState('');
  const [submitError, setSubmitError] = useState('');

  const categories = [
    { value: 'return', label: t('support.return') },
    { value: 'exchange', label: t('support.exchange') },
    { value: 'quality', label: t('support.quality') },
    { value: 'logistics', label: t('support.logistics') },
    { value: 'other', label: t('support.other') },
  ];

  const mutation = useMutation({
    mutationFn: () =>
      afterSalesApi.create({
        order_id: Number(orderId),
        category: category as 'return' | 'exchange' | 'quality' | 'logistics' | 'other',
        subject,
        description: description || undefined,
      }),
    onSuccess: () => {
      setSubmitError('');
      qc.invalidateQueries({ queryKey: ['my-after-sales'] });
      setSubject('');
      setDescription('');
      setOrderId('');
    },
    onError: () => setSubmitError(t('support.submitError', 'Submission failed — please retry')),
  });

  if (!isAuthenticated) {
    return (
      <PageWrapper>
        <SectionContainer noTopSpacing>
          <div className="pt-16 md:pt-24 pb-12 text-center">
            <p className="font-body text-body text-ink-faded mb-6">
              {t('support.loginRequired', 'Log in to submit a support ticket')}
            </p>
            <Link to="/login" className="font-body text-caption text-rust tracking-[0.1em] uppercase hover:underline">
              {t('nav.login')} &rarr;
            </Link>
          </div>
        </SectionContainer>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper>
      <SectionContainer noTopSpacing>
        <div className="pt-12 md:pt-16 pb-6">
          <motion.h1
            initial={prefersReducedMotion ? false : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0, 0, 0.2, 1] }}
            className="font-display text-h2 md:text-h1 text-ink mb-2"
          >
            {t('support.title', 'After-Sales Service')}
          </motion.h1>
          <motion.p
            initial={prefersReducedMotion ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0, 0, 0.2, 1], delay: 0.08 }}
            className="font-body text-body text-ink-faded max-w-2xl"
          >
            {t('support.subtitle', 'Link order number for easier processing')}
          </motion.p>
        </div>
      </SectionContainer>

      <section className="bg-aged-stock/30 py-16 md:py-24 relative">
        <SectionContainer noTopSpacing>
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-12">
            {/* Left: Form */}
            <motion.form
              initial={prefersReducedMotion ? false : { opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.6, ease: [0, 0, 0.2, 1] }}
              className="md:col-span-7 space-y-5"
              onSubmit={(e) => {
                e.preventDefault();
                if (!/^\d+$/.test(orderId.trim())) {
                  setFieldError(t('support.invalidOrderId', 'Order ID must be a number'));
                  return;
                }
                setFieldError('');
                mutation.mutate();
              }}
            >
              <VintageInput
                label={t('support.orderId', 'Order ID *')}
                value={orderId}
                onChange={(e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
                  setOrderId(e.target.value);
                  setFieldError('');
                }}
                required
                inputMode="numeric"
              />
              <VintageSelect
                label={t('support.category', 'Category')}
                value={category}
                onChange={(e: ChangeEvent<HTMLSelectElement>) => setCategory(e.target.value)}
                options={categories}
              />
              <VintageInput
                label={t('support.subject', 'Subject *')}
                value={subject}
                onChange={(e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setSubject(e.target.value)}
                required
              />
              <VintageInput
                label={t('support.description', 'Description')}
                type="textarea"
                value={description}
                onChange={(e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setDescription(e.target.value)}
                placeholder={t('support.descriptionPlaceholder', 'Describe the issue in detail')}
              />
              {fieldError && (
                <p className="font-body text-caption text-rust" role="alert">
                  {fieldError}
                </p>
              )}
              {mutation.isSuccess && (
                <p className="font-body text-caption text-sage" role="status">
                  {t('support.success', 'Submitted — check progress in your profile')}
                </p>
              )}
              {(mutation.isError || submitError) && (
                <p className="font-body text-body-sm text-rust" role="alert">
                  {submitError || t('support.error', 'Submission failed. Please verify the order ID belongs to your account.')}
                </p>
              )}
              <motion.button
                type="submit"
                whileHover={prefersReducedMotion ? undefined : { scale: 1.02 }}
                whileTap={prefersReducedMotion ? undefined : { scale: 0.98 }}
                disabled={mutation.isPending || !orderId || !subject.trim()}
                className="w-full py-3 rounded-full font-body text-body-sm tracking-[0.15em] uppercase bg-rust text-paper border border-rust hover:bg-rust/90 disabled:opacity-50 transition-colors cursor-pointer"
              >
                {mutation.isPending ? t('common.loading', 'Submitting...') : t('support.submit', 'Submit Ticket')}
              </motion.button>
            </motion.form>

            {/* Right: Tips */}
            <motion.div
              initial={prefersReducedMotion ? false : { opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.6, ease: [0, 0, 0.2, 1], delay: 0.15 }}
              className="md:col-span-5 space-y-6"
            >
              <div className="rounded-xl border border-warm-gray/20 bg-paper/80 p-6">
                <h3 className="font-display text-h3 text-ink mb-3">
                  {t('support.tipsTitle', 'Before Submitting')}
                </h3>
                <ul className="space-y-3 font-body text-body-sm text-ink-faded">
                  <li className="flex gap-2">
                    <span className="text-rust mt-0.5">&#9670;</span>
                    {t('support.tip1', 'Have your order ID ready — find it in your order history.')}
                  </li>
                  <li className="flex gap-2">
                    <span className="text-rust mt-0.5">&#9670;</span>
                    {t('support.tip2', 'For quality issues, include photos for faster resolution.')}
                  </li>
                  <li className="flex gap-2">
                    <span className="text-rust mt-0.5">&#9670;</span>
                    {t('support.tip3', 'Most tickets are resolved within 2 business days.')}
                  </li>
                </ul>
              </div>

              <div className="rounded-xl border border-warm-gray/20 bg-aged-stock/30 p-6">
                <h3 className="font-display text-h3 text-ink mb-3">
                  {t('support.contactTitle', 'Other Channels')}
                </h3>
                <div className="space-y-3 font-body text-body-sm text-ink-faded">
                  <p>{t('support.contactEmail', 'Email: support@vicoo.com')}</p>
                  <p>{t('support.contactHours', 'Mon–Fri, 9:00–18:00 CST')}</p>
                </div>
              </div>
            </motion.div>
          </div>
        </SectionContainer>
      </section>
    </PageWrapper>
  );
}
