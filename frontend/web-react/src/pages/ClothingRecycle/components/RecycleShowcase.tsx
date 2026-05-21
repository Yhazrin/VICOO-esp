import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import SectionContainer from '@/components/layout/SectionContainer';

export default function RecycleShowcase() {
  const { t } = useTranslation();
  const prefersReducedMotion = useReducedMotion();

  return (
    <section className="bg-ink text-paper py-20 md:py-28 relative overflow-hidden">
      {/* Subtle grain */}
      <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23n)\' opacity=\'1\'/%3E%3C/svg%3E")' }} />

      <SectionContainer>
        <motion.div
          initial={prefersReducedMotion ? false : { opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.6, ease: [0, 0, 0.2, 1] }}
          className="text-center max-w-2xl mx-auto"
        >
          <p className="font-body text-overline text-paper/50 tracking-[0.15em] uppercase mb-4">
            {t('clothingRecycle.showcaseTitle', 'Circular Showcase')}
          </p>
          <h2 className="font-display text-h2 text-paper mb-4">
            {t('clothingRecycle.showcaseSubtitle', 'Selected items reborn from recycled garments, waiting for their next story.')}
          </h2>
          <p className="font-body text-body-sm text-paper/60 mb-8">
            {t('clothingRecycle.showcaseDescription', 'Each item carries a recycle badge and full supply chain traceability. Browse the circular shop to discover unique pieces.')}
          </p>
          <Link
            to="/impact/shop"
            className="inline-flex items-center gap-2 font-body text-caption tracking-[0.15em] uppercase text-paper border border-paper/30 px-6 py-3 rounded-full hover:bg-paper/10 transition-colors"
          >
            {t('clothingRecycle.browseMore', 'Browse Circular Shop')}
            <span>&rarr;</span>
          </Link>
        </motion.div>
      </SectionContainer>
    </section>
  );
}
