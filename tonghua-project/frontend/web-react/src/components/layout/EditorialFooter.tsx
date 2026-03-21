import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, useReducedMotion } from 'framer-motion';
import { OrigamiCorner, OrigamiDivider, OrigamiFoldAccent } from '@/components/animations/OrigamiFold';

export default function EditorialFooter() {
  const { t } = useTranslation();
  const prefersReducedMotion = useReducedMotion();
  const year = new Date().getFullYear();

  return (
    <footer className="bg-ink text-paper mt-auto relative overflow-hidden">
      {/* Grain overlay */}
      <div
        className="absolute inset-0 z-0 pointer-events-none opacity-[0.06]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`
        }}
        aria-hidden="true"
      />

      {/* Sepia gradient overlay */}
      <div
        className="absolute inset-0 z-0 pointer-events-none opacity-5"
        style={{
          background: 'linear-gradient(to bottom, transparent 0%, color-mix(in srgb, var(--color-rust) 10%, transparent) 100%)'
        }}
        aria-hidden="true"
      />

      {/* Origami fold accent at top */}
      <div className="absolute top-0 left-0 right-0 h-3 overflow-hidden" aria-hidden="true">
        <OrigamiDivider
          orientation="horizontal"
          length="full"
          variant="single"
          color="sepia"
          foldCount={4}
          showBackside={true}
        />
      </div>

      {/* Origami corner accents */}
      <OrigamiFoldAccent
        position="top-left"
        size="lg"
        intensity="medium"
        className="absolute top-6 left-0 pointer-events-none"
      />
      <OrigamiFoldAccent
        position="top-right"
        size="lg"
        intensity="subtle"
        className="absolute top-6 right-0 pointer-events-none"
      />

      <div className="max-w-[1400px] mx-auto px-6 md:px-10 py-16 md:py-24 relative z-10">
        {/* Top section — Magazine colophon style */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 md:gap-8 mb-16">
          {/* Brand column */}
          <div className="md:col-span-4 relative">
            {/* Origami corner accents */}
            <OrigamiCorner
              position="top-left"
              size="sm"
              color="sepia"
              showBackside={true}
              className="absolute -top-1 -left-1 pointer-events-none"
            />
            <OrigamiCorner
              position="bottom-right"
              size="sm"
              color="sepia"
              showBackside={true}
              className="absolute -bottom-1 -right-1 pointer-events-none"
            />

            <h3 className="font-display text-3xl md:text-4xl font-bold mb-4 tracking-tight">
              VICOO
            </h3>
            <p className="font-body text-body-sm text-warm-gray leading-relaxed max-w-xs mb-6">
              {t('footer.brand.description')}
            </p>
            <div className="w-12 h-px bg-pale-gold mb-6" aria-hidden="true" />
            <p className="font-body text-overline tracking-[0.2em] uppercase text-sepia-on-dark">
              {t('footer.issueNo')}
            </p>
          </div>

          {/* Publication */}
          <div className="md:col-span-2">
            <h4 className="font-body text-overline tracking-[0.2em] uppercase text-sepia-on-dark mb-6">
              {t('footer.sections.publication')}
            </h4>
            <ul className="space-y-3">
              {['about', 'campaigns', 'stories'].map((key) => (
                <li key={key}>
                  <motion.div whileHover={prefersReducedMotion ? undefined : { x: 4 }}>
                    <Link
                      to={`/${key}`}
                      className="font-body text-body-sm text-warm-gray hover:text-paper transition-colors duration-200 inline-block cursor-pointer"
                    >
                      {t(`footer.links.${key}`)}
                    </Link>
                  </motion.div>
                </li>
              ))}
            </ul>
          </div>

          {/* Connect */}
          <div className="md:col-span-2">
            <h4 className="font-body text-overline tracking-[0.2em] uppercase text-sepia-on-dark mb-6">
              {t('footer.sections.connect')}
            </h4>
            <ul className="space-y-3">
              {['shop', 'donate', 'contact'].map((key) => (
                <li key={key}>
                  <motion.div whileHover={prefersReducedMotion ? undefined : { x: 4 }}>
                    <Link
                      to={`/${key}`}
                      className="font-body text-body-sm text-warm-gray hover:text-paper transition-colors duration-200 inline-block cursor-pointer"
                    >
                      {t(`footer.links.${key}`)}
                    </Link>
                  </motion.div>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div className="md:col-span-2">
            <h4 className="font-body text-overline tracking-[0.2em] uppercase text-sepia-on-dark mb-6">
              {t('footer.sections.legal')}
            </h4>
            <ul className="space-y-3">
              {['privacy', 'terms', 'children'].map((key) => (
                <li key={key}>
                  <motion.div whileHover={prefersReducedMotion ? undefined : { x: 4 }}>
                    <Link
                      to={`/${key}`}
                      className="font-body text-body-sm text-warm-gray hover:text-paper transition-colors duration-200 inline-block cursor-pointer"
                    >
                      {t(`footer.links.${key}`)}
                    </Link>
                  </motion.div>
                </li>
              ))}
            </ul>
          </div>

          {/* Newsletter */}
          <div className="md:col-span-2 relative">
            {/* Origami corner accents */}
            <OrigamiCorner
              position="top-left"
              size="sm"
              color="sepia"
              showBackside={true}
              className="absolute -top-1 -left-1 pointer-events-none"
            />
            <OrigamiCorner
              position="bottom-right"
              size="sm"
              color="sepia"
              showBackside={true}
              className="absolute -bottom-1 -right-1 pointer-events-none"
            />

            <h4 className="font-body text-overline tracking-[0.2em] uppercase text-sepia-on-dark mb-6">
              {t('footer.newsletter.title')}
            </h4>
            <p className="font-body text-caption text-warm-gray mb-4 leading-relaxed">
              {t('footer.newsletter.description')}
            </p>
            <motion.form
              onSubmit={(e) => e.preventDefault()}
              className="flex flex-col gap-3"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
            >
              <motion.input
                type="email"
                placeholder="your@email.com"
                className="bg-transparent border-b border-sepia-mid/30 text-paper font-body text-caption py-2 outline-none focus-visible:ring-2 focus-visible:ring-pale-gold/50 focus:border-pale-gold transition-colors placeholder:text-sepia-on-dark/40"
                aria-label={t('common.emailAriaLabel')}
                whileFocus={prefersReducedMotion ? undefined : { scale: 1.01 }}
              />
              <motion.button
                type="submit"
                className="font-body text-overline tracking-[0.15em] uppercase text-pale-gold hover:text-paper transition-colors text-left cursor-pointer"
                whileHover={prefersReducedMotion ? undefined : { x: 4 }}
              >
                {t('footer.newsletter.subscribe')} &rarr;
              </motion.button>
            </motion.form>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-sepia-mid/20 pt-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <p className="font-body text-label text-sepia-on-dark">
            &copy; {year} VICOO. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            <span className="font-body text-label text-sepia-on-dark">
              {t('common.location.shanghai')}
            </span>
            <span className="font-body text-label text-sepia-on-dark">
              {t('footer.builtWith')}
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
