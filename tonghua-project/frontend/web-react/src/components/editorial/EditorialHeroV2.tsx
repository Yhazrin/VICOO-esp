import { type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { useScrollReveal } from '@/hooks/useScrollReveal';
import HeroBackgroundArt from './HeroBackgroundArt';
import HeroFloatingCards from './HeroFloatingCards';

interface EditorialHeroV2Props {
  title: string;
  subtitle?: string;
  eyebrowText?: string;
  children?: ReactNode;
  stats?: Array<{ value: string; label: string }>;
  ctaText?: string;
  ctaLink?: string;
  secondaryLink?: { text: string; href: string };
  hideHero?: boolean;
}

export default function EditorialHeroV2({
  title,
  subtitle,
  eyebrowText = 'VISION IN CREATIVE OPPORTUNITY',
  children,
  stats = [],
  ctaText = 'EXPLORE OUR WORK',
  ctaLink = '/campaigns',
  secondaryLink,
  hideHero = false,
}: EditorialHeroV2Props) {
  const [ref, isVisible] = useScrollReveal<HTMLDivElement>();
  const prefersReducedMotion = useReducedMotion();

  if (hideHero) {
    return null;
  }

  // Split title into lines for staggered animation
  const titleLines = title.split('<br>');

  return (
    <section
      ref={ref}
      className="relative min-h-[580px] overflow-hidden bg-paper rounded-none border border-black/[0.08]"
    >
      {/* Background SVG Art */}
      <HeroBackgroundArt />

      {/* Floating Cards on Right */}
      <HeroFloatingCards />

      {/* Left Content */}
      <motion.div
        {...(prefersReducedMotion ? {} : { initial: { opacity: 0 } })}
        animate={{ opacity: 1 }}
        transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.4 }}
        className="relative z-10 p-10 md:p-14 max-w-[580px]"
      >
        {/* Decorative vertical line + Eyebrow */}
        <motion.div
          {...(prefersReducedMotion ? {} : { initial: { opacity: 0, x: -20 } })}
          animate={isVisible ? (prefersReducedMotion ? {} : { opacity: 1, x: 0 }) : {}}
          transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.6 }}
          className="flex items-center gap-4 mb-6"
        >
          <div className="w-px h-12 bg-gradient-to-b from-transparent via-rust/60 to-transparent" />
          <span className="font-mono text-[9px] tracking-[0.25em] text-rust uppercase">
            {eyebrowText}
          </span>
        </motion.div>

        {/* Headline - More prominent with shadow */}
        <motion.h1
          {...(prefersReducedMotion ? {} : { initial: { opacity: 0, y: 30 } })}
          animate={isVisible ? (prefersReducedMotion ? {} : { opacity: 1, y: 0 }) : {}}
          transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.8, delay: 0.1 }}
          className="font-display text-[48px] md:text-[58px] font-medium leading-[1.1] text-ink mb-6 relative"
          style={{ textShadow: '0 2px 4px rgba(0,0,0,0.03)' }}
        >
          {titleLines.map((line, i) => (
            <span key={i} className="block">
              {line.includes('<em>') ? (
                <>
                  {line.split('<em>')[0]}
                  <em className="italic text-rust font-normal">
                    {line.split('<em>')[1]?.replace('</em>', '')}
                  </em>
                </>
              ) : (
                line
              )}
              {i < titleLines.length - 1 && <br />}
            </span>
          ))}
        </motion.h1>

        {/* Body Text - refined spacing */}
        {subtitle && (
          <motion.p
            {...(prefersReducedMotion ? {} : { initial: { opacity: 0, y: 20 } })}
            animate={isVisible ? (prefersReducedMotion ? {} : { opacity: 1, y: 0 }) : {}}
            transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.7, delay: 0.2 }}
            className="font-mono text-[11px] leading-[2] text-gray-400 max-w-[380px] mb-10 tracking-[0.03em]"
          >
            {subtitle}
          </motion.p>
        )}

        {/* CTA Row - more prominent */}
        <motion.div
          {...(prefersReducedMotion ? {} : { initial: { opacity: 0, y: 20 } })}
          animate={isVisible ? (prefersReducedMotion ? {} : { opacity: 1, y: 0 }) : {}}
          transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.7, delay: 0.3 }}
          className="flex items-center gap-8 mb-14"
        >
          <Link
            to={ctaLink}
            className="group relative inline-block font-mono text-[10px] tracking-[0.18em] bg-ink text-paper px-8 py-4 hover:bg-rust transition-all duration-300 overflow-hidden"
          >
            <span className="relative z-10">{ctaText}</span>
            <motion.div
              className="absolute inset-0 bg-rust origin-left"
              initial={prefersReducedMotion ? undefined : { scaleX: 0 }}
              whileHover={prefersReducedMotion ? undefined : { scaleX: 1 }}
              transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.3 }}
            />
          </Link>
          {secondaryLink && (
            <Link
              to={secondaryLink.href}
              className="group font-mono text-[10px] tracking-[0.14em] text-rust hover:text-ink transition-colors duration-300 flex items-center gap-2"
            >
              <span className="underline underline-offset-4 decoration-rust/50 group-hover:decoration-ink transition-all">
                {secondaryLink.text}
              </span>
              <motion.span
                animate={prefersReducedMotion ? {} : { x: [0, 4, 0] }}
                transition={prefersReducedMotion ? { duration: 0 } : { duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
              >
                →
              </motion.span>
            </Link>
          )}
          {children}
        </motion.div>

        {/* Stats Row - enhanced with separators */}
        {stats.length > 0 && (
          <motion.div
            {...(prefersReducedMotion ? {} : { initial: { opacity: 0, y: 20 } })}
            animate={isVisible ? (prefersReducedMotion ? {} : { opacity: 1, y: 0 }) : {}}
            transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.7, delay: 0.4 }}
            className="flex gap-10 border-t border-black/[0.08] pt-6"
          >
            {stats.map((stat, i) => (
              <div key={i} className="relative">
                {i > 0 && (
                  <div className="absolute left-[-20px] top-1/2 -translate-y-1/2 w-px h-8 bg-gradient-to-b from-transparent via-black/10 to-transparent" />
                )}
                <span className="font-display text-[24px] font-semibold text-ink block mb-1">
                  {stat.value}
                </span>
                <span className="font-mono text-[7px] tracking-[0.2em] text-gray-400 uppercase">
                  {stat.label}
                </span>
              </div>
            ))}
          </motion.div>
        )}
      </motion.div>
    </section>
  );
}
