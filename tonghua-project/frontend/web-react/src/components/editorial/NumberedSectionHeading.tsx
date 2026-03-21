import { motion } from 'framer-motion';
import { useScrollReveal } from '@/hooks/useScrollReveal';

interface NumberedSectionHeadingProps {
  number: string;
  title: string;
  subtitle?: string;
  className?: string;
}

export default function NumberedSectionHeading({
  number,
  title,
  subtitle,
  className = '',
}: NumberedSectionHeadingProps) {
  const [ref, isVisible] = useScrollReveal<HTMLDivElement>();

  return (
    <div ref={ref} className={`mb-12 md:mb-16 ${className}`}>
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={isVisible ? { opacity: 1, x: 0 } : {}}
        transition={{ duration: 0.6, ease: [0, 0, 0.2, 1] }}
        className="flex items-baseline gap-3 mb-4"
      >
        <span className="font-body text-caption text-sepia-mid tracking-[0.2em]">
          {number}
        </span>
        <span className="flex-1 h-px bg-warm-gray/40" />
      </motion.div>

      <motion.h2
        initial={{ opacity: 0, y: 30 }}
        animate={isVisible ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.7, ease: [0, 0, 0.2, 1], delay: 0.1 }}
        className="font-display text-h2 md:text-h1 font-bold leading-[0.95] tracking-[-0.025em] text-ink"
      >
        {title}
      </motion.h2>

      {subtitle && (
        <motion.p
          initial={{ opacity: 0, y: 15 }}
          animate={isVisible ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, ease: [0, 0, 0.2, 1], delay: 0.25 }}
          className="font-body text-body-sm md:text-base text-ink-faded mt-4 max-w-lg leading-relaxed"
        >
          {subtitle}
        </motion.p>
      )}
    </div>
  );
}
