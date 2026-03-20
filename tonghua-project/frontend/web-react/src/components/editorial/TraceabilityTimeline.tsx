import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef } from 'react';
import type { SupplyChainRecord } from '@/types';
import { useTranslation } from 'react-i18next';

interface TraceabilityTimelineProps {
  records: SupplyChainRecord[];
  className?: string;
}

export default function TraceabilityTimeline({
  records,
  className = '',
}: TraceabilityTimelineProps) {
  const { t } = useTranslation();
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
        <p className="font-body text-sm text-sepia-mid">
          No supply chain records available.
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
          stroke="#D4CFC4"
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
          r="3"
          fill="#8B3A2A"
          style={{
            opacity: useTransform(scrollYProgress, [0, 0.1], [0, 1]),
          }}
        />
        <motion.circle
          cx="7"
          cy={pathHeight}
          r="3"
          fill="#8B3A2A"
          style={{
            opacity: useTransform(scrollYProgress, [0.9, 1], [0, 1]),
          }}
        />
        {/* Decorative corner flourishes */}
        <motion.path
          d="M 7 20 Q 15 25 7 35"
          fill="none"
          stroke="#8B3A2A"
          strokeWidth="1"
          strokeLinecap="round"
          style={{
            opacity: useTransform(scrollYProgress, [0, 0.15], [0, 1]),
            strokeDasharray: 30,
            strokeDashoffset: useTransform(scrollYProgress, [0, 0.2], [30, 0]),
          }}
        />
        <motion.path
          d="M 7 60 Q 15 65 7 75"
          fill="none"
          stroke="#8B3A2A"
          strokeWidth="1"
          strokeLinecap="round"
          style={{
            opacity: useTransform(scrollYProgress, [0.05, 0.2], [0, 1]),
            strokeDasharray: 30,
            strokeDashoffset: useTransform(scrollYProgress, [0.05, 0.25], [30, 0]),
          }}
        />
      </svg>

      <div className="space-y-0">
        {records.map((record, index) => (
          <motion.div
            key={record.id}
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-30px' }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            className="relative pb-12 last:pb-0"
          >
            {/* Dot */}
            <div
              className={`
                absolute left-[-33px] top-1 w-4 h-4 rounded-full border-[3px] border-paper z-[2]
                ${record.verified ? 'bg-rust' : 'bg-warm-gray'}
              `}
            />

            {/* Card */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
              whileHover={{ y: -2 }}
              className="relative p-6 border-2 border-rust/30 bg-paper transition-all duration-300 hover:border-rust/50 overflow-hidden"
            >
              {/* Grain overlay */}
              <div className="absolute inset-0 z-10 pointer-events-none opacity-[0.08]" style={{
                backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\'/%3E%3C/svg%3E")'
              }} />

              {/* Sepia corner accents */}
              <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-rust/30" />
              <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-rust/30" />

              <div className="relative z-20">
                <div className="flex justify-between items-start flex-wrap gap-3 mb-3">
                  <h4 className="font-display text-[clamp(18px,2vw,24px)] font-bold text-ink">
                    {record.stage}
                  </h4>
                  {record.verified && (
                    <span className="font-body text-[10px] tracking-[0.1em] uppercase px-3 py-1 bg-rust/10 text-rust border border-rust/20">
                      {t('traceability.verified')}
                    </span>
                  )}
                </div>

                <p className="font-body text-sm text-ink-faded leading-relaxed mb-4">
                  {record.description}
                </p>

                <div className="flex flex-wrap gap-6">
                  <div className="font-body text-[11px] text-sepia-mid">
                    <span className="uppercase tracking-[0.1em]">Location:</span>{' '}
                    <span className="text-ink-faded font-medium">{record.location}</span>
                  </div>
                  <div className="font-body text-[11px] text-sepia-mid">
                    <span className="uppercase tracking-[0.1em]">Partner:</span>{' '}
                    <span className="text-ink-faded font-medium">{record.partnerName}</span>
                  </div>
                  <div className="font-body text-[11px] text-sepia-mid">
                    <span className="uppercase tracking-[0.1em]">Date:</span>{' '}
                    <span className="text-ink-faded font-medium">
                      {new Date(record.date).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </span>
                  </div>
                  {record.carbonFootprint !== undefined && (
                    <div className="font-body text-[11px] text-sepia-mid">
                      <span className="uppercase tracking-[0.1em]">{t('traceability.carbon')}:</span>{' '}
                      <span className="text-archive-brown font-medium">
                        {record.carbonFootprint} kg CO2
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
