import { motion, useScroll, useTransform, useReducedMotion } from 'framer-motion';
import { useRef } from 'react';
import type { SupplyChainTimelineRecord } from '@/types';
import { useTranslation } from 'react-i18next';
import SectionGrainOverlay from '@/components/editorial/SectionGrainOverlay';

interface TraceabilityTimelineProps {
  records: SupplyChainTimelineRecord[];
  className?: string;
  /** 与商品详情地球仪选中节点同步：对应卡片低调高亮，不滚动页面 */
  linkedFromGlobeId?: number | null;
}

export default function TraceabilityTimeline({
  records,
  className = '',
  linkedFromGlobeId = null,
}: TraceabilityTimelineProps) {
  const { t } = useTranslation();
  const prefersReducedMotion = useReducedMotion();
  const containerRef = useRef<HTMLDivElement>(null);

  // Scroll-linked animation for the vertical path line
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start end', 'end start'],
  });

  // Calculate the total height needed for the path
  const pathHeight = records.length * 200; // Approximate height per record
  const strokeDashoffset = useTransform(scrollYProgress, [0, 1], [pathHeight, 0]);

  if (records.length === 0) {
    return (
      <div className={`text-center py-16 ${className}`}>
        <p className="font-body text-body-sm text-sepia-mid">
          {t('traceability.noRecords', 'No supply chain records available.')}
        </p>
      </div>
    );
  }

  return (
    <div ref={containerRef} className={`relative pl-12 ${className}`}>
      {/* Animated decorative path line - draws on scroll */}
      <svg
        className="absolute left-[15px] top-0 w-4 h-full overflow-visible pointer-events-none"
        aria-hidden="true"
        preserveAspectRatio="none"
      >
        {/* Main animated vertical line */}
        <motion.path
          d={`M 7 0 L 7 ${pathHeight}`}
          fill="none"
          stroke="var(--color-warm-gray)"
          strokeWidth="1"
          strokeLinecap="round"
          style={{
            strokeDasharray: pathHeight,
            strokeDashoffset,
          }}
        />
        {/* Decorative accent dots at top and bottom */}
        <motion.circle
          cx="7"
          cy="0"
          r="2.5"
          style={{
            fill: 'var(--color-sage)',
            opacity: useTransform(scrollYProgress, [0, 0.1], [0, 1]),
          }}
        />
        <motion.circle
          cx="7"
          cy={pathHeight}
          r="2.5"
          style={{
            fill: 'var(--color-sage)',
            opacity: useTransform(scrollYProgress, [0.9, 1], [0, 1]),
          }}
        />
        {/* Decorative corner flourishes */}
        <motion.path
          d="M 7 20 Q 15 25 7 35"
          fill="none"
          strokeWidth="1"
          strokeLinecap="round"
          style={{
            stroke: 'var(--color-warm-gray)',
            opacity: useTransform(scrollYProgress, [0, 0.15], [0, 0.85]),
            strokeDasharray: 30,
            strokeDashoffset: useTransform(scrollYProgress, [0, 0.2], [30, 0]),
          }}
        />
        <motion.path
          d="M 7 60 Q 15 65 7 75"
          fill="none"
          strokeWidth="1"
          strokeLinecap="round"
          style={{
            stroke: 'var(--color-warm-gray)',
            opacity: useTransform(scrollYProgress, [0.05, 0.2], [0, 0.75]),
            strokeDasharray: 30,
            strokeDashoffset: useTransform(scrollYProgress, [0.05, 0.25], [30, 0]),
          }}
        />
      </svg>

      <div className="space-y-0">
        {records.map((record, index) => {
          const isGlobeLinked = linkedFromGlobeId != null && record.id === linkedFromGlobeId;
          return (
          <motion.div
            key={record.id}
            id={`trace-step-${record.id}`}
            initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, x: -20 }}
            whileInView={prefersReducedMotion ? { opacity: 1 } : { opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-30px' }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            className="relative pb-12 last:pb-0 scroll-mt-24 md:scroll-mt-28"
            aria-current={isGlobeLinked ? 'step' : undefined}
          >
            {/* Dot */}
            <div
              className={`
                absolute left-[-33px] top-1 w-3.5 h-3.5 rounded-full border-[2px] border-paper z-[2] transition-transform duration-500 ease-out shadow-[0_0_0_1px_rgba(26,26,22,0.06)]
                ${record.verified ? 'bg-sage' : 'bg-warm-gray/55'}
                ${isGlobeLinked ? 'scale-125 ring-2 ring-ink/20 ring-offset-2 ring-offset-aged-stock' : ''}
              `}
              aria-hidden="true"
            />

            {/* Card */}
            <motion.div
              initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 10 }}
              whileInView={prefersReducedMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={
                isGlobeLinked && !prefersReducedMotion
                  ? { duration: 1.15, ease: [0.22, 1, 0.36, 1] }
                  : { duration: 0.4, delay: index * 0.1 }
              }
              whileHover={prefersReducedMotion ? undefined : { y: -1 }}
              animate={
                prefersReducedMotion || !isGlobeLinked
                  ? undefined
                  : {
                      boxShadow: [
                        '0 0 0 0 rgba(26, 26, 22, 0)',
                        '0 0 40px -14px rgba(26, 26, 22, 0.12)',
                        '0 0 28px -16px rgba(26, 26, 22, 0.08)',
                      ],
                    }
              }
              className={`relative p-6 md:p-7 border bg-paper/90 transition-[border-color,box-shadow] duration-500 ease-out overflow-hidden ${
                isGlobeLinked
                  ? 'border-ink/22 shadow-[0_24px_56px_-32px_rgba(26,26,22,0.18)]'
                  : 'border-warm-gray/18 hover:border-warm-gray/32 hover:shadow-[0_20px_48px_-36px_rgba(26,26,22,0.12)]'
              }`}
            >
              <SectionGrainOverlay className="z-10" />

              {/* Sepia corner accents */}
              <div
                className="absolute top-0 left-0 w-7 h-7 border-t border-l border-warm-gray/35"
                aria-hidden="true"
              />
              <div
                className="absolute bottom-0 right-0 w-7 h-7 border-b border-r border-warm-gray/35"
                aria-hidden="true"
              />

              <div className="relative z-20">
                <div className="flex justify-between items-start flex-wrap gap-3 mb-3">
                  <h4 className="font-display text-[clamp(17px,1.9vw,22px)] font-semibold text-ink tracking-[-0.02em]">
                    {record.stage}
                  </h4>
                  {record.verified && (
                    <span className="font-body text-[9px] md:text-[10px] tracking-[0.14em] uppercase px-2.5 py-1 bg-sage/12 text-sage border border-sage/25">
                      {t('traceability.verified')}
                    </span>
                  )}
                </div>

                <p className="font-body text-body-sm text-ink-faded leading-[1.85] mb-5 max-w-2xl">
                  {record.description}
                </p>

                <div className="flex flex-wrap gap-x-8 gap-y-3">
                  <div className="font-body text-[11px] text-sepia-mid leading-snug">
                    <span className="uppercase tracking-[0.16em] block text-[10px] mb-0.5 opacity-90">
                      {t('traceability.location')}
                    </span>
                    <span className="text-ink-faded font-medium">{record.location}</span>
                  </div>
                  <div className="font-body text-[11px] text-sepia-mid leading-snug">
                    <span className="uppercase tracking-[0.16em] block text-[10px] mb-0.5 opacity-90">
                      {t('traceability.partner')}
                    </span>
                    <span className="text-ink-faded font-medium">{record.partnerName}</span>
                  </div>
                  <div className="font-body text-[11px] text-sepia-mid leading-snug">
                    <span className="uppercase tracking-[0.16em] block text-[10px] mb-0.5 opacity-90">
                      {t('traceability.date')}
                    </span>
                    <span className="font-mono text-[11px] text-ink-faded">
                      {new Date(record.date).toLocaleDateString(undefined, {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </span>
                  </div>
                  {record.carbonFootprint !== undefined && (
                    <div className="font-body text-[11px] text-sepia-mid leading-snug">
                      <span className="uppercase tracking-[0.16em] block text-[10px] mb-0.5 opacity-90">
                        {t('traceability.carbon')}
                      </span>
                      <span className="font-mono text-[11px] text-ink-faded tabular-nums">
                        {record.carbonFootprint} kg CO₂
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
          );
        })}
      </div>
    </div>
  );
}
