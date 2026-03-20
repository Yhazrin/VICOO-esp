import { type ReactNode } from 'react';
import { motion } from 'framer-motion';
import { useScrollReveal } from '@/hooks/useScrollReveal';

interface EditorialHeroProps {
  title: string;
  subtitle?: string;
  children?: ReactNode;
  number?: string;
  align?: 'left' | 'center';
  fullBleed?: boolean;
  fullHeight?: boolean; // Use 100vh for pure introduction pages
  hideHero?: boolean; // Hide hero section for functional pages
}

export default function EditorialHero({
  title,
  subtitle,
  children,
  number,
  align = 'left',
  fullBleed = true,
  fullHeight = false,
  hideHero = false,
}: EditorialHeroProps) {
  const [ref, isVisible] = useScrollReveal<HTMLDivElement>();

  // For functional pages that hide hero, render nothing (no container)
  if (hideHero) {
    return null;
  }

  // Determine height class based on fullHeight and fullBleed props
  let heightClass = 'min-h-[50vh] md:min-h-[70vh]';
  if (fullHeight) {
    heightClass = 'min-h-screen';
  } else if (fullBleed) {
    heightClass = 'min-h-[80vh] md:min-h-screen';
  }

  return (
    <section
      ref={ref}
      className={`
        relative overflow-hidden
        ${heightClass}
        flex items-end
        ${align === 'center' ? 'text-center justify-center' : ''}
      `}
    >
      <div
        className={`
          page-container w-full pb-16 md:pb-24
          ${align === 'center' ? 'flex flex-col items-center' : ''}
        `}
      >
        {number && (
          <motion.span
            initial={{ opacity: 0, y: 20 }}
            animate={isVisible ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, ease: [0, 0, 0.2, 1] }}
            className="block font-body text-caption text-sepia-mid tracking-[0.3em] mb-6 md:mb-8"
          >
            {number}
          </motion.span>
        )}

        <motion.h1
          initial={{ opacity: 0, y: 40 }}
          animate={isVisible ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, ease: [0, 0, 0.2, 1], delay: 0.1 }}
          className="font-display text-hero font-black leading-[0.9] tracking-[-0.035em] text-ink"
          style={{
            marginLeft: align === 'left' ? '-0.04em' : undefined,
            marginRight: align === 'left' ? '-0.04em' : undefined,
          }}
        >
          {title}
        </motion.h1>

        {subtitle && (
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={isVisible ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.7, ease: [0, 0, 0.2, 1], delay: 0.3 }}
            className={`
              font-body text-base md:text-lg text-ink-faded mt-6 md:mt-8 leading-relaxed
              ${align === 'center' ? 'max-w-2xl text-center' : 'max-w-xl'}
            `}
          >
            {subtitle}
          </motion.p>
        )}

        {children && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isVisible ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.7, ease: [0, 0, 0.2, 1], delay: 0.45 }}
            className="mt-8 md:mt-10"
          >
            {children}
          </motion.div>
        )}
      </div>

      {/* Decorative bottom line */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-warm-gray/40 to-transparent" />
    </section>
  );
}
