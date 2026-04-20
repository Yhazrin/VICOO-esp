import { motion, useScroll, useTransform, useReducedMotion } from 'framer-motion';
import { useRef } from 'react';
import { useScrollReveal } from '@/hooks/useScrollReveal';

interface StoryQuoteBlockProps {
  quote: string;
  author?: string;
  role?: string;
  className?: string;
  /** 条带式排布：无大号引号与左侧重边框，适合页面顶部或窄栏 */
  variant?: 'default' | 'strip';
}

export default function StoryQuoteBlock({
  quote,
  author,
  role,
  className = '',
  variant = 'default',
}: StoryQuoteBlockProps) {
  const [ref, isVisible] = useScrollReveal<HTMLQuoteElement>();
  const prefersReducedMotion = useReducedMotion();
  const underlineRef = useRef<HTMLDivElement>(null);

  // Scroll-linked animation for the decorative underline
  const { scrollYProgress } = useScroll({
    target: underlineRef,
    offset: ['start end', 'end start'],
  });

  // Underline path animation
  const strokeDashoffset = useTransform(scrollYProgress, [0, 1], [200, 0]);
  const underlineOpacity = useTransform(scrollYProgress, [0, 0.3], [0, 1]);
  const flourishDashoffset = useTransform(scrollYProgress, [0.1, 0.5], [20, 0]);

  if (variant === 'strip') {
    return (
      <motion.blockquote
        ref={ref}
        initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 16 }}
        animate={isVisible ? { opacity: 1, y: 0 } : {}}
        transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className={`relative border-t border-warm-gray/20 pt-8 pb-2 md:pt-10 md:pb-4 ${className}`}
      >
        <p className="font-display text-xl md:text-2xl italic leading-[1.45] text-ink/92 font-normal max-w-3xl">
          {quote}
        </p>
        {(author || role) && (
          <footer className="mt-6 flex flex-col gap-0.5 sm:flex-row sm:items-baseline sm:gap-3">
            {author && (
              <cite className="font-body text-sm text-ink not-italic font-medium tracking-wide">
                {author}
              </cite>
            )}
            {role && (
              <span className="font-body text-[11px] md:text-caption text-sepia-mid tracking-[0.12em] uppercase">
                {role}
              </span>
            )}
          </footer>
        )}
      </motion.blockquote>
    );
  }

  return (
    <motion.blockquote
      ref={ref}
      initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 30 }}
      animate={isVisible ? { opacity: 1, y: 0 } : {}}
      transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.8, ease: [0, 0, 0.2, 1] }}
      className={`relative py-12 md:py-16 ${className}`}
    >
      {/* Decorative quote mark */}
      <span
        className="absolute top-4 left-0 font-display text-[120px] md:text-[180px] leading-none text-rust/10 select-none pointer-events-none"
        aria-hidden="true"
      >
        &ldquo;
      </span>

      <div className="relative z-10 pl-4 md:pl-8 border-l-2 border-rust/30">
        <p className="font-display text-h3 md:text-h2 italic leading-[1.3] text-ink font-normal">
          {quote}
        </p>

        {/* Animated decorative underline */}
        <div ref={underlineRef} className="mt-4 h-4 overflow-visible">
          <svg
            className="w-full max-w-[280px] h-8 overflow-visible"
            viewBox="0 0 280 32"
            preserveAspectRatio="xMinYMid meet"
            aria-hidden="true"
          >
            {/* Main decorative underline with flourish */}
            <motion.path
              d="M 0 8 Q 20 4 60 8 T 140 8 T 220 8 L 260 8"
              fill="none"
              strokeWidth="1.5"
              strokeLinecap="round"
              style={{
                stroke: 'var(--color-rust)',
                strokeDasharray: 280,
                strokeDashoffset: prefersReducedMotion ? 0 : strokeDashoffset,
                opacity: prefersReducedMotion ? 1 : underlineOpacity,
              }}
            />
            {/* Accent dot at start */}
            <motion.circle
              cx="0"
              cy="8"
              r="2.5"
              style={{
                fill: 'var(--color-rust)',
                opacity: prefersReducedMotion ? 1 : underlineOpacity,
              }}
            />
            {/* Accent dot at end */}
            <motion.circle
              cx="260"
              cy="8"
              r="2.5"
              style={{
                fill: 'var(--color-rust)',
                opacity: prefersReducedMotion ? 1 : underlineOpacity,
              }}
            />
            {/* Decorative flourish after the line */}
            <motion.path
              d="M 265 8 Q 270 12 268 16 Q 272 14 275 18"
              fill="none"
              strokeWidth="1"
              strokeLinecap="round"
              style={{
                stroke: 'var(--color-rust)',
                strokeDasharray: 20,
                strokeDashoffset: prefersReducedMotion ? 0 : flourishDashoffset,
                opacity: prefersReducedMotion ? 1 : underlineOpacity,
              }}
            />
          </svg>
        </div>

        {(author || role) && (
          <footer className="mt-6 flex items-baseline gap-2">
            {author && (
              <cite className="font-body text-body-sm text-ink not-italic font-medium">
                {author}
              </cite>
            )}
            {author && role && (
              <span className="font-body text-caption text-sepia-mid">/</span>
            )}
            {role && (
              <span className="font-body text-caption text-sepia-mid tracking-wide">
                {role}
              </span>
            )}
          </footer>
        )}
      </div>
    </motion.blockquote>
  );
}
