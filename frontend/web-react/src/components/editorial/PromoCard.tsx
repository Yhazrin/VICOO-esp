import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, useReducedMotion } from 'framer-motion';
import { useScrollReveal } from '@/hooks/useScrollReveal';
import SectionGrainOverlay from '@/components/editorial/SectionGrainOverlay';

type PromoVariant = 'story' | 'sustainability' | 'editorial';

interface PromoCardProps {
  variant: PromoVariant;
  index?: number;
  className?: string;
}

const VARIANT_CONFIG: Record<PromoVariant, {
  linkTo: string;
  accentColor: string;
  borderColor: string;
  bgGradient: string;
  icon: React.ReactNode;
}> = {
  story: {
    linkTo: '/about',
    accentColor: 'text-rust',
    borderColor: 'border-rust/25',
    bgGradient: 'from-rust/[0.03] via-paper to-pale-gold/[0.04]',
    icon: (
      <svg className="w-8 h-8" viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1" aria-hidden="true">
        <path d="M16 4v24M4 16h24" strokeLinecap="round" />
        <path d="M8 8l16 16M24 8L8 24" strokeLinecap="round" opacity="0.4" />
      </svg>
    ),
  },
  sustainability: {
    linkTo: '/about',
    accentColor: 'text-sage',
    borderColor: 'border-sage/25',
    bgGradient: 'from-sage/[0.04] via-paper to-pale-gold/[0.03]',
    icon: (
      <svg className="w-8 h-8" viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1" aria-hidden="true">
        <path d="M6 26L12 14L18 20L26 8" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M22 8h4v4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  editorial: {
    linkTo: '/stories',
    accentColor: 'text-pale-gold',
    borderColor: 'border-pale-gold/30',
    bgGradient: 'from-pale-gold/[0.04] via-paper to-archive-brown/[0.03]',
    icon: (
      <svg className="w-8 h-8" viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1" aria-hidden="true">
        <circle cx="16" cy="16" r="11" />
        <circle cx="16" cy="16" r="5" />
        <circle cx="16" cy="16" r="1" fill="currentColor" />
      </svg>
    ),
  },
};

export default function PromoCard({
  variant,
  index = 0,
  className = '',
}: PromoCardProps) {
  const { t } = useTranslation();
  const prefersReducedMotion = useReducedMotion();
  const [ref, isVisible] = useScrollReveal<HTMLDivElement>();

  const config = VARIANT_CONFIG[variant];

  return (
    <motion.article
      ref={ref}
      initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 30 }}
      animate={prefersReducedMotion ? (isVisible ? { opacity: 1 } : {}) : (isVisible ? { opacity: 1, y: 0 } : {})}
      transition={{
        duration: 0.7,
        ease: [0, 0, 0.2, 1],
        delay: index * 0.1,
      }}
      className={`${className}`}
    >
      <Link
        to={config.linkTo}
        className={`
          group relative flex flex-col h-full overflow-hidden
          border ${config.borderColor}
          bg-gradient-to-br ${config.bgGradient}
          transition-all duration-500
          hover:border-rust/40 hover:shadow-[0_8px_30px_-12px_rgba(139,58,42,0.08)]
        `}
      >
        <SectionGrainOverlay opacity={0.03} />

        {/* Top decorative line */}
        <div className="h-px bg-gradient-to-r from-transparent via-warm-gray/30 to-transparent" />

        {/* Image area — same 3:4 ratio as ProductCard */}
        <div className="relative aspect-[3/4] flex items-center justify-center">
          {/* Corner accents */}
          <div className="absolute top-4 left-4 w-4 h-4 border-t border-l border-warm-gray/30" aria-hidden="true" />
          <div className="absolute top-4 right-4 w-4 h-4 border-t border-r border-warm-gray/30" aria-hidden="true" />
          <div className="absolute bottom-4 left-4 w-4 h-4 border-b border-l border-warm-gray/30" aria-hidden="true" />
          <div className="absolute bottom-4 right-4 w-4 h-4 border-b border-r border-warm-gray/30" aria-hidden="true" />

          {/* Center content */}
          <div className="relative z-10 flex flex-col items-center text-center px-8">
            <div className={`${config.accentColor} opacity-40 mb-6`}>
              {config.icon}
            </div>

            <span className="font-body text-overline tracking-[0.25em] uppercase text-sepia-mid mb-3">
              {t(`shop.promo.${variant}`)}
            </span>

            <p className="font-body text-caption text-ink-faded leading-[1.7] max-w-[220px]">
              {t(`shop.promo.${variant}Body`)}
            </p>

            {/* CTA */}
            <div className="mt-6 flex items-center gap-2 group-hover:gap-3 transition-all duration-300">
              <span className={`font-mono text-[10px] tracking-[0.18em] uppercase ${config.accentColor} opacity-60 group-hover:opacity-100 transition-opacity`}>
                {t('shop.promo.cta')}
              </span>
              <svg
                className={`w-3.5 h-3.5 ${config.accentColor} opacity-40 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all duration-300`}
                viewBox="0 0 14 14"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                aria-hidden="true"
              >
                <path d="M2 7h10M8 3l4 4-4 4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          </div>
        </div>

        {/* Bottom bar — matches ProductCard's decorative divider height */}
        <div className="px-4 pb-4 mt-auto">
          <div className="flex items-center gap-2">
            <div className="flex-1 h-px bg-warm-gray/30" />
            <span className={`font-mono text-[9px] tracking-[0.2em] uppercase ${config.accentColor} opacity-40`}>
              {variant === 'story' ? 'VICOO' : variant === 'sustainability' ? 'GOTS' : '2025'}
            </span>
            <div className="flex-1 h-px bg-warm-gray/30" />
          </div>
        </div>
      </Link>
    </motion.article>
  );
}
