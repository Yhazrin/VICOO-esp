import { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, useReducedMotion } from 'framer-motion';
import PageWrapper from '@/components/layout/PageWrapper';
import SectionContainer from '@/components/layout/SectionContainer';
import { MagazineDivider } from '@/components/editorial/MagazineDivider';
import RecycleFlow from './components/RecycleFlow';
import RecycleForm from './components/RecycleForm';
import RecycleOrders, { type RecycleOrdersHandle } from './components/RecycleOrders';
import RecycleShowcase from './components/RecycleShowcase';

export default function ClothingRecycle() {
  const { t } = useTranslation();
  const prefersReducedMotion = useReducedMotion();
  const ordersRef = useRef<RecycleOrdersHandle>(null);

  return (
    <PageWrapper>
      {/* Disclaimer banner */}
      <div className="bg-aged-stock/40 border-b border-rust/20 px-4 py-2 flex items-center justify-center gap-2">
        <svg className="w-4 h-4 text-sepia-mid flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
        </svg>
        <span className="font-body text-caption text-sepia-mid">
          {t('clothingRecycle.disclaimer', 'Product cards are sample content. Signed-in users will see real recycling requests and synced progress.')}
        </span>
      </div>

      {/* Compact page header */}
      <SectionContainer noTopSpacing>
        <div className="pt-12 md:pt-16 pb-6">
          <motion.h1
            initial={prefersReducedMotion ? false : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0, 0, 0.2, 1] }}
            className="font-display text-h2 md:text-h1 text-ink mb-2"
          >
            {t('clothingRecycle.heroTitle', 'Circular Fashion')}
          </motion.h1>
          <motion.p
            initial={prefersReducedMotion ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0, 0, 0.2, 1], delay: 0.08 }}
            className="font-body text-body text-ink-faded max-w-2xl mb-6"
          >
            {t('clothingRecycle.heroSubtitle', 'Give old garments a second life, from submission and review to relisting and reuse.')}
          </motion.p>
          <div className="flex flex-wrap gap-4 md:gap-6">
            {[
              { value: '12,000+', label: t('clothingRecycle.statRecycled', 'Garments Recovered') },
              { value: '8,500 kg', label: t('clothingRecycle.statCarbon', 'CO₂ Reduced') },
              { value: '87%', label: t('clothingRecycle.statRate', 'Reuse Rate') },
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={prefersReducedMotion ? false : { opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: [0, 0, 0.2, 1], delay: 0.15 + i * 0.06 }}
                className="flex items-center gap-2 rounded-full border border-warm-gray/20 bg-paper/60 px-4 py-2"
              >
                <span className="font-display text-body-sm font-semibold text-rust">{stat.value}</span>
                <span className="font-body text-caption text-sepia-mid">{stat.label}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </SectionContainer>

      {/* Circular flow */}
      <RecycleFlow />

      <MagazineDivider variant="decorative" />

      {/* Form section */}
      <section id="recycle-form" className="bg-aged-stock/30 py-16 md:py-24 relative">
        <SectionContainer noTopSpacing>
          <motion.h2
            initial={prefersReducedMotion ? false : { opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.5, ease: [0, 0, 0.2, 1] }}
            className="font-display text-h2 text-ink mb-2"
          >
            {t('clothingRecycle.submitTitle', 'Submit Old Clothes')}
          </motion.h2>
          <motion.p
            initial={prefersReducedMotion ? false : { opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.5, ease: [0, 0, 0.2, 1], delay: 0.05 }}
            className="font-body text-body text-ink-faded mb-10 max-w-xl"
          >
            {t('clothingRecycle.submitSubtitle', 'Fill in the form below to start a recycling request. Our operations team reviews submissions within 1-3 business days.')}
          </motion.p>
        </SectionContainer>
        <RecycleForm onSubmitted={() => ordersRef.current?.scrollTo()} />
      </section>

      <MagazineDivider variant="decorative" />

      {/* Orders */}
      <RecycleOrders ref={ordersRef} />

      {/* Showcase */}
      <RecycleShowcase />

      {/* End divider */}
      <div className="editorial-divider" />
    </PageWrapper>
  );
}
