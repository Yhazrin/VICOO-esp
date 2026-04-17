import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import SectionGrainOverlay from '@/components/editorial/SectionGrainOverlay';
import { useUIStore } from '@/stores/uiStore';
import UniqloLogo from './UniqloLogo';

const CORE_LINKS = [
  { key: 'shop', path: '/shop' },
  { key: 'about', path: '/about' },
  { key: 'contact', path: '/contact' },
  { key: 'campaigns', path: '/campaigns' },
] as const;

export default function EditorialFooter() {
  const { t } = useTranslation();
  const prefersReducedMotion = useReducedMotion();
  const year = new Date().getFullYear();
  const impactMode = useUIStore((s) => s.impactMode);

  return (
    <footer className="mt-auto relative">
      <SectionGrainOverlay />

      <div className="max-w-[1400px] mx-auto px-6 md:px-10 pt-10 md:pt-14 pb-6 md:pb-8">
        {/* ── Brand Block: the name IS the container ── */}
        <motion.div
          initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, ease: [0, 0, 0.2, 1] }}
          className="
            bg-[var(--color-aged-stock)]
            rounded-[1.5rem] md:rounded-[2rem]
            border border-[var(--color-warm-gray)]/25
            relative overflow-hidden
          "
        >
          <SectionGrainOverlay frequency={0.85} opacity={0.02} />

          {/* ── Brand: fills the container top to bottom ── */}
          <div className="relative z-10 px-6 md:px-12 pt-6 md:pt-8 pb-0">
            <Link
              to="/"
              className="
                block text-center
                cursor-pointer
                focus-visible:outline-none
                focus-visible:ring-2
                focus-visible:ring-[var(--color-rust)]/40
                focus-visible:rounded-lg
              "
            >
              <div className="flex items-center justify-center gap-4 md:gap-6">
                <motion.div
                  animate={{ x: impactMode ? -12 : 0 }}
                  transition={{ type: 'spring', stiffness: 260, damping: 24 }}
                >
                  <UniqloLogo className="!h-[clamp(40px,7vw,90px)]" />
                </motion.div>
                <AnimatePresence mode="wait">
                  {impactMode && (
                    <motion.span
                      key="footer-vicoo"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ type: 'spring', stiffness: 280, damping: 24, delay: 0.05 }}
                      className="
                        font-display font-bold
                        tracking-[-0.03em] leading-[0.85]
                        text-[var(--color-ink)]
                        hover:text-[var(--color-rust)]
                        transition-colors duration-300
                        whitespace-nowrap
                      "
                      style={{ fontSize: 'clamp(40px, 7vw, 90px)' }}
                    >
                      × VICOO
                    </motion.span>
                  )}
                </AnimatePresence>
              </div>
            </Link>
          </div>

          {/* ── Tagline + Links: compact strip below the name ── */}
          <div className="relative z-10 px-6 md:px-12 pt-4 md:pt-5 pb-5 md:pb-7">

            {/* Core nav links */}
            <nav
              className="flex flex-wrap items-center justify-center gap-x-5 gap-y-1 mb-4"
              aria-label="Footer navigation"
            >
              {CORE_LINKS.map((link) => (
                <Link
                  key={link.key}
                  to={link.path}
                  className="
                    font-body text-[10px] md:text-[11px]
                    tracking-[0.1em] uppercase
                    text-[var(--color-ink-light)]
                    hover:text-[var(--color-rust)]
                    transition-colors duration-200
                    cursor-pointer
                    focus-visible:outline-none
                    focus-visible:ring-2
                    focus-visible:ring-[var(--color-rust)]/40
                    focus-visible:rounded-sm
                  "
                >
                  {t(`nav.${link.key}`)}
                </Link>
              ))}
            </nav>

            {/* Legal row */}
            <div className="
              flex items-center justify-center
              gap-3
              pt-3
              border-t border-[var(--color-warm-gray)]/15
            ">
              <span className="font-body text-[9px] tracking-[0.06em] text-[var(--color-muted-gray)]">
                &copy; {year} VICOO
              </span>
              <span className="w-0.5 h-0.5 rounded-full bg-[var(--color-warm-gray)]" aria-hidden="true" />
              <Link
                to="/privacy"
                className="font-body text-[9px] tracking-[0.06em] text-[var(--color-muted-gray)] hover:text-[var(--color-sepia-mid)] transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-rust)]/40 focus-visible:rounded-sm"
              >
                {t('footer.links.privacy')}
              </Link>
              <span className="w-0.5 h-0.5 rounded-full bg-[var(--color-warm-gray)]" aria-hidden="true" />
              <Link
                to="/terms"
                className="font-body text-[9px] tracking-[0.06em] text-[var(--color-muted-gray)] hover:text-[var(--color-sepia-mid)] transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-rust)]/40 focus-visible:rounded-sm"
              >
                {t('footer.links.terms')}
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </footer>
  );
}
