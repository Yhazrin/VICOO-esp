import { type ReactNode } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { useScrollReveal } from '@/hooks/useScrollReveal';

interface BleedTitleBlockProps {
  children: ReactNode;
  className?: string;
  overlay?: boolean;
}

export default function BleedTitleBlock({
  children,
  className = '',
  overlay = false,
}: BleedTitleBlockProps) {
  const [ref, isVisible] = useScrollReveal<HTMLDivElement>();
  const prefersReducedMotion = useReducedMotion();

  return (
    <div
      ref={ref}
      className={`
        relative
        ${overlay ? 'absolute inset-0 z-10 flex items-end overflow-hidden' : ''}
        ${className}
      `}
    >
      <motion.div
        initial={prefersReducedMotion ? false : { opacity: 0, y: 60 }}
        animate={isVisible ? (prefersReducedMotion ? {} : { opacity: 1, y: 0 }) : {}}
        transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.9, ease: [0, 0, 0.2, 1] }}
        className={`
          font-display font-black leading-[1.1] tracking-[-0.02em] text-ink
          ${overlay ? 'p-6 md:p-10 lg:p-16 bg-gradient-to-t from-paper/90 to-transparent w-full' : ''}
        `}
      >
        {children}
      </motion.div>
    </div>
  );
}
