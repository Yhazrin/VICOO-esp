import { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, useInView, AnimatePresence, useReducedMotion } from 'framer-motion';
import { Link } from 'react-router-dom';
import PageWrapper from '@/components/layout/PageWrapper';
import SectionContainer from '@/components/layout/SectionContainer';
import EditorialHero from '@/components/editorial/EditorialHero';
import NumberedSectionHeading from '@/components/editorial/NumberedSectionHeading';
import SepiaImageFrame from '@/components/editorial/SepiaImageFrame';
import StoryQuoteBlock from '@/components/editorial/StoryQuoteBlock';
import { ScrollPathDrawInline } from '@/components/animations/ScrollPathDraw';
import { supplyChainApi } from '@/services/supply-chain';
import SectionGrainOverlay from '@/components/editorial/SectionGrainOverlay';

// Extended record with story, image, and status for enhanced timeline
interface EnhancedSupplyChainRecord {
  id: number;
  stage: string;
  description: string;
  location: string;
  date: string;
  verified: boolean;
  partnerName: string;
  carbonFootprint?: number;
  story: string;
  imageUrl: string;
  status: 'verified' | 'in-progress' | 'pending';
}

const MOCK_RECORDS: EnhancedSupplyChainRecord[] = [
  {
    id: 1,
    stage: 'artwork',
    description: 'Xiao Lin, age 8, created her ocean painting during a Saturday workshop at Dongfeng Elementary School. The artwork was selected by peer vote.',
    location: 'Shanghai, China',
    date: '2025-11-15',
    verified: true,
    partnerName: 'Dongfeng Elementary School',
    carbonFootprint: 0,
    status: 'verified',
    story: 'On a rainy Saturday morning, eight-year-old Xiao Lin picked up her brush and painted a whale leaping through ocean waves. Her classmates voted it best in show.',
    imageUrl: 'https://picsum.photos/seed/artwork-studio/200/200',
  },
  {
    id: 2,
    stage: 'design',
    description: 'Our design team adapted the artwork for textile printing, maintaining the child\'s original brushstrokes and color palette. Xiao Lin approved the final design.',
    location: 'Shanghai, China',
    date: '2025-12-01',
    verified: true,
    partnerName: 'Tonghua Design Studio',
    carbonFootprint: 0.2,
    status: 'verified',
    story: 'Lead designer Mei transformed the painting into a repeat pattern while preserving every brushstroke. Xiao Lin visited the studio and gave her final approval with a thumbs-up.',
    imageUrl: 'https://picsum.photos/seed/design-studio/200/200',
  },
  {
    id: 3,
    stage: 'material',
    description: 'GOTS-certified organic cotton sourced from Xinjiang cooperative. Fair trade pricing verified by third-party auditor.',
    location: 'Xinjiang, China',
    date: '2025-12-20',
    verified: true,
    partnerName: 'GreenCotton Cooperative',
    carbonFootprint: 1.8,
    status: 'verified',
    story: 'Harvested by hand from fields irrigated with rainwater collection systems. Each batch is tested for pesticide residue and certified organic before shipping.',
    imageUrl: 'https://picsum.photos/seed/cotton-fields/200/200',
  },
  {
    id: 4,
    stage: 'production',
    description: 'Screen-printed and sewn at SA8000-certified factory. Living wages paid. Working conditions audited quarterly.',
    location: 'Guangzhou, China',
    date: '2026-01-10',
    verified: true,
    partnerName: 'FairWear Manufacturing',
    carbonFootprint: 2.4,
    status: 'verified',
    story: 'Artisan Zhang has sewn garments for 15 years. He earns above living wage with full benefits. His team printed and assembled 200 units of this design.',
    imageUrl: 'https://picsum.photos/seed/factory-floor/200/200',
  },
  {
    id: 5,
    stage: 'quality',
    description: 'Quality inspection passed. Color fastness, seam strength, and sizing verified against specifications.',
    location: 'Guangzhou, China',
    date: '2026-01-25',
    verified: true,
    partnerName: 'FairWear Manufacturing',
    carbonFootprint: 0.1,
    status: 'verified',
    story: 'Inspector Li tests every garment for color fastness after 20 washes, seam strength at stress points, and dimensional accuracy within 2mm tolerance.',
    imageUrl: 'https://picsum.photos/seed/quality-check/200/200',
  },
  {
    id: 6,
    stage: 'shipping',
    description: 'Shipped via consolidated freight to reduce emissions. Carbon offset purchased through certified program.',
    location: 'Guangzhou to Shanghai',
    date: '2026-02-05',
    verified: true,
    partnerName: 'GreenLogistics Co.',
    carbonFootprint: 0.8,
    status: 'in-progress',
    story: 'Consolidated with three other orders to fill one container. Remaining emissions offset through a verified reforestation project in Yunnan Province.',
    imageUrl: 'https://picsum.photos/seed/logistics-hub/200/200',
  },
];

const CARBON_DATA = {
  conventional: 33.4,
  vicoo: 8.2,
};

// Animated counter for reduction percentage
function AnimatedCounter({ value, suffix = '' }: { value: number; suffix?: string }) {
  const [displayValue, setDisplayValue] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-50px' });
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    if (!isInView) return;

    if (prefersReducedMotion) {
      setDisplayValue(value);
      return;
    }

    let startTime: number;
    let animationFrame: number;
    const duration = 2000;

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayValue(Math.round(eased * value));
      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    };

    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, [isInView, value, prefersReducedMotion]);

  return (
    <span ref={ref}>
      {displayValue}
      {suffix}
    </span>
  );
}

// Animated bar for carbon comparison
function CarbonBar({ label, value, maxValue, isEco, delay }: {
  label: string;
  value: number;
  maxValue: number;
  isEco: boolean;
  delay: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-50px' });
  const prefersReducedMotion = useReducedMotion();
  const percentage = (value / maxValue) * 100;

  return (
    <motion.div
      ref={ref}
      {...(prefersReducedMotion ? {} : {
        initial: { opacity: 0, x: -20 },
        animate: isInView ? { opacity: 1, x: 0 } : {},
        transition: { duration: 0.6, delay },
      })}
      className="space-y-2"
    >
      <div className="flex justify-between items-baseline">
        <span className="font-body text-label tracking-[0.15em] uppercase text-sepia-mid">
          {label}
        </span>
        <span className={`font-display text-h3 font-bold ${isEco ? 'text-sage' : 'text-archive-brown'}`}>
          {value} kg CO2
        </span>
      </div>
      <div className="h-3 bg-warm-gray/20 border border-warm-gray/30 overflow-hidden">
        <motion.div
          className={`h-full origin-left ${isEco ? 'bg-sage-light' : 'bg-archive-brown/60'}`}
          {...(prefersReducedMotion ? { style: { transform: `scaleX(${percentage / 100})` } } : {
            initial: { scaleX: 0 },
            animate: isInView ? { scaleX: percentage / 100 } : {},
            transition: { duration: 1.2, delay: delay + 0.3, ease: [0, 0, 0.2, 1] },
          })}
        />
      </div>
    </motion.div>
  );
}

// Loading spinner for product lookup
function SearchSpinner({ t }: { t: (key: string) => string }) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <div className="flex items-center gap-3 py-4">
      {prefersReducedMotion ? (
        <div className="w-5 h-5 border-2 border-warm-gray/30 border-t-rust rounded" />
      ) : (
        <motion.div
          className="w-5 h-5 border-2 border-warm-gray/30 border-t-rust rounded"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        />
      )}
      <span className="font-body text-caption text-sepia-mid tracking-[0.1em] uppercase">
        {t('traceability.tracing')}
      </span>
    </div>
  );
}

// Certification badge component
function CertificationBadge({ title, description, delay }: {
  title: string;
  description: string;
  delay: number;
}) {
  const prefersReducedMotion = useReducedMotion();
  return (
    <motion.div
      {...(prefersReducedMotion ? {} : {
        initial: { opacity: 0, y: 20 },
        whileInView: { opacity: 1, y: 0 },
        viewport: { once: true },
        transition: { duration: 0.5, delay },
      })}
      whileHover={prefersReducedMotion ? undefined : { y: -4, borderColor: 'color-mix(in srgb, var(--color-rust) 50%, transparent)' }}
      className="border-2 border-rust/30 bg-paper p-5 text-center transition-all duration-300 hover:shadow-[0_4px_20px_color-mix(in_srgb,var(--color-rust)_8%,transparent)] relative overflow-hidden group"
    >
      <SectionGrainOverlay className="z-10" />

      {/* Corner accents */}
      <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-rust/30 group-hover:border-rust/30 transition-colors" />
      <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-rust/30 group-hover:border-rust/30 transition-colors" />

      <div className="relative z-20">
        {/* Badge icon */}
        <div className="w-12 h-12 mx-auto mb-3 border border-rust/30 rounded-sm flex items-center justify-center bg-aged-stock">
          <svg className="w-5 h-5 text-rust" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z" />
          </svg>
        </div>

        <h4 className="font-display text-body-sm font-bold text-ink mb-1">
          {title}
        </h4>
        <p className="font-body text-overline text-sepia-mid leading-relaxed tracking-wide">
          {description}
        </p>
      </div>
    </motion.div>
  );
}

// Enhanced timeline entry with status indicator, story, and image
function EnhancedTimelineEntry({ record, index, t }: {
  record: EnhancedSupplyChainRecord;
  index: number;
  t: (key: string) => string;
}) {
  const prefersReducedMotion = useReducedMotion();
  const statusConfig = {
    verified: { label: t('traceability.status.verified'), bg: 'bg-sage/10', text: 'text-sage', border: 'border-sage/30', dot: 'bg-sage-light' },
    'in-progress': { label: t('traceability.status.inProgress'), bg: 'bg-pale-gold/20', text: 'text-archive-brown', border: 'border-archive-brown/30', dot: 'bg-archive-brown' },
    pending: { label: t('traceability.status.pending'), bg: 'bg-warm-gray/10', text: 'text-warm-gray', border: 'border-warm-gray/30', dot: 'bg-warm-gray' },
  };

  const config = statusConfig[record.status];

  return (
    <motion.div
      {...(prefersReducedMotion ? {} : {
        initial: { opacity: 0, x: -30 },
        whileInView: { opacity: 1, x: 0 },
        viewport: { once: true, margin: '-40px' },
        transition: {
          duration: 0.6,
          delay: index * 0.15,
          ease: [0.25, 0.1, 0.25, 1],
        },
      })}
      className="relative pb-12 last:pb-0"
    >
      {/* Dot */}
      <div
        className={`absolute left-[-33px] top-1 w-4 h-4 rounded-sm border-[3px] border-paper z-[2] ${config.dot}`}
      />

      {/* Card */}
      <motion.div
        whileHover={prefersReducedMotion ? undefined : { y: -3, borderColor: 'color-mix(in srgb, var(--color-rust) 40%, transparent)' }}
        transition={{ duration: 0.3 }}
        className="relative p-6 border-2 border-rust/30 bg-paper transition-all duration-300 hover:border-rust/50 overflow-hidden"
      >
        <SectionGrainOverlay className="z-10" />

        {/* Sepia corner accents */}
        <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-rust/30" />
        <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-rust/30" />

        <div className="relative z-20">
          {/* Header with status */}
          <div className="flex justify-between items-start flex-wrap gap-3 mb-4">
            <h4 className="font-display text-[clamp(18px,2vw,24px)] font-bold text-ink">
              {t(`traceability.stages.${record.stage}`)}
            </h4>
            <span className={`font-body text-overline tracking-[0.1em] uppercase px-3 py-1 ${config.bg} ${config.text} border ${config.border}`}>
              {config.label}
            </span>
          </div>

          {/* Main content with image */}
          <div className="flex gap-5 mb-4">
            <div className="flex-1">
              <p className="font-body text-body-sm text-ink-faded leading-relaxed mb-3">
                {record.description}
              </p>
              <p className="font-body text-label italic text-sepia-mid leading-relaxed border-l-2 border-rust/30 pl-3">
                "{record.story}"
              </p>
            </div>
            <motion.div
              whileHover={prefersReducedMotion ? undefined : { scale: 1.03 }}
              transition={{ duration: 0.3 }}
              className="hidden sm:block flex-shrink-0 w-[100px] h-[100px] overflow-hidden border border-warm-gray/40"
            >
              <img
                src={record.imageUrl}
                alt={record.partnerName}
                className="w-full h-full object-cover sepia-[0.3] contrast-[1.05]"
                loading="lazy"
              />
            </motion.div>
          </div>

          {/* Meta info */}
          <div className="flex flex-wrap gap-6">
            <div className="font-body text-label text-sepia-mid">
              <span className="uppercase tracking-[0.1em]">{t('traceability.location')}:</span>{' '}
              <span className="text-ink-faded font-medium">{record.location}</span>
            </div>
            <div className="font-body text-label text-sepia-mid">
              <span className="uppercase tracking-[0.1em]">{t('traceability.partner')}:</span>{' '}
              <span className="text-ink-faded font-medium">{record.partnerName}</span>
            </div>
            <div className="font-body text-label text-sepia-mid">
              <span className="uppercase tracking-[0.1em]">{t('traceability.date')}:</span>{' '}
              <span className="text-ink-faded font-medium">
                {new Date(record.date).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                })}
              </span>
            </div>
            {record.carbonFootprint !== undefined && (
              <div className="font-body text-label text-sepia-mid">
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
  );
}

// Enhanced timeline with staggered reveal entries
function EnhancedTimeline({ records, t }: { records: EnhancedSupplyChainRecord[]; t: (key: string) => string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const pathHeight = records.length * 220;

  return (
    <div ref={containerRef} className="relative pl-12">
      {/* Static decorative path line */}
      <svg
        className="absolute left-[15px] top-0 w-4 h-full overflow-visible pointer-events-none"
        aria-hidden="true"
        preserveAspectRatio="none"
      >
        <line
          x1="7" y1="0" x2="7" y2={pathHeight}
          style={{ stroke: 'var(--color-warm-gray)' }}
          strokeWidth="1"
          strokeLinecap="round"
        />
        <circle cx="7" cy="0" r="3" style={{ fill: 'var(--color-rust)' }} />
        <circle cx="7" cy={pathHeight} r="3" style={{ fill: 'var(--color-rust)' }} />
        <path
          d="M 7 20 Q 15 25 7 35"
          fill="none"
          strokeWidth="1"
          strokeLinecap="round"
          style={{ stroke: 'var(--color-rust)' }}
        />
        <path
          d="M 7 60 Q 15 65 7 75"
          fill="none"
          strokeWidth="1"
          strokeLinecap="round"
          style={{ stroke: 'var(--color-rust)' }}
        />
      </svg>

      <div className="space-y-0">
        {records.map((record, index) => (
          <EnhancedTimelineEntry key={record.id} record={record} index={index} t={t} />
        ))}
      </div>
    </div>
  );
}

export default function Traceability() {
  const { t } = useTranslation();
  const prefersReducedMotion = useReducedMotion();
  const timelineRef = useRef<HTMLDivElement>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [highlightedId, setHighlightedId] = useState<number | null>(null);
  const [searchResult, setSearchResult] = useState<EnhancedSupplyChainRecord | null>(null);
  const [records, setRecords] = useState<EnhancedSupplyChainRecord[]>(MOCK_RECORDS);

  // Fetch supply chain records from API on mount (fallback to mock)
  useEffect(() => {
    let cancelled = false;
    supplyChainApi
      .getRecords()
      .then((res) => {
        if (cancelled || !res.length) return;
        const mapped: EnhancedSupplyChainRecord[] = res.map((r, i) => {
          const rec = r as unknown as Record<string, unknown>;
          return {
            id: Number(rec.id ?? i + 1),
            stage: String(rec.stage ?? 'unknown'),
            description: String(rec.description ?? ''),
            location: String(rec.location ?? ''),
            date: String(rec.date ?? rec.timestamp ?? ''),
            verified: Boolean(rec.verified ?? rec.certified),
            partnerName: String(rec.partnerName ?? rec.partner_name ?? MOCK_RECORDS[i]?.partnerName ?? 'Verified Partner'),
            carbonFootprint: typeof rec.carbonFootprint === 'number' ? rec.carbonFootprint : undefined,
            story: MOCK_RECORDS[i]?.story ?? String(rec.description ?? ''),
            imageUrl: MOCK_RECORDS[i]?.imageUrl ?? `https://picsum.photos/seed/stage-${String(rec.stage ?? 'unknown')}/200/200`,
            status: (rec.verified ?? rec.certified ? 'verified' : 'pending') as 'verified' | 'in-progress' | 'pending',
          };
        });
        setRecords(mapped);
      })
      .catch(() => {
        // Keep mock data on failure
      });
    return () => { cancelled = true; };
  }, []);

  // Handle product lookup — try API trace, fallback to local search
  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
    setHighlightedId(null);
    setSearchResult(null);

    if (!query.trim()) return;

    setIsSearching(true);

    supplyChainApi
      .getProductJourney(query.trim())
      .then((journey) => {
        if (journey.length > 0) {
          const first = journey[0];
          const rec = first as unknown as Record<string, unknown>;
          const mockMatch = MOCK_RECORDS.find((m) => m.stage === first.stage);
          const enhanced: EnhancedSupplyChainRecord = {
            id: Number(rec.id ?? 1),
            stage: first.stage,
            description: first.description,
            location: first.location,
            date: String(rec.date ?? rec.timestamp ?? ''),
            verified: Boolean(rec.verified ?? rec.certified),
            partnerName: String(rec.partnerName ?? rec.partner_name ?? mockMatch?.partnerName ?? 'Verified Partner'),
            carbonFootprint: typeof rec.carbonFootprint === 'number' ? rec.carbonFootprint : undefined,
            story: mockMatch?.story ?? first.description,
            imageUrl: mockMatch?.imageUrl ?? `https://picsum.photos/seed/${first.stage}/200/200`,
            status: (rec.verified ?? rec.certified ? 'verified' : 'pending') as 'verified' | 'in-progress' | 'pending',
          };
          setHighlightedId(enhanced.id);
          setSearchResult(enhanced);
        }
        setIsSearching(false);
      })
      .catch(() => {
        // Fallback: local search through records
        const found = records.find(
          (r) =>
            String(r.id) === query.trim() ||
            r.partnerName.toLowerCase().includes(query.toLowerCase()) ||
            query.toUpperCase().includes('VICOO')
        );
        if (found) {
          setHighlightedId(found.id);
          setSearchResult(found);
        }
        setIsSearching(false);
      });
  }, [records]);

  const reductionPercent = Math.round(
    ((CARBON_DATA.conventional - CARBON_DATA.vicoo) / CARBON_DATA.conventional) * 100
  );

  const certifications = [
    { title: t('traceability.certs.gots.title'), description: t('traceability.certs.gots.desc') },
    { title: t('traceability.certs.fairTrade.title'), description: t('traceability.certs.fairTrade.desc') },
    { title: t('traceability.certs.carbonNeutral.title'), description: t('traceability.certs.carbonNeutral.desc') },
    { title: t('traceability.certs.childSafe.title'), description: t('traceability.certs.childSafe.desc') },
  ];

  return (
    <PageWrapper>
      <EditorialHero
        title={t('traceability.hero.title')}
        subtitle={t('traceability.hero.subtitle')}
        hideHero={true}
      />

      {/* Section 01: Trace Your Product — Interactive Lookup */}
      <SectionContainer noTopSpacing>
        <NumberedSectionHeading
          number="01"
          title={t('traceability.lookup.title')}
          subtitle={t('traceability.lookup.subtitle')}
        />

        <motion.div
          {...(prefersReducedMotion ? {} : {
            initial: { opacity: 0, y: 20 },
            whileInView: { opacity: 1, y: 0 },
            viewport: { once: true },
            transition: { duration: 0.6 },
          })}
          className="max-w-xl mb-16"
        >
          <div className="relative">
            {/* Decorative corner accents */}
            <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-rust/30 pointer-events-none z-10" />
            <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-rust/30 pointer-events-none z-10" />

            <div className="flex items-center border-b-2 border-warm-gray/60 focus-within:border-rust transition-colors">
              <svg className="w-4 h-4 text-sepia-mid ml-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder={t('traceability.lookup.placeholder')}
                className="w-full font-body text-body-sm py-3 px-3 bg-transparent focus:outline-none focus-visible:ring-2 focus-visible:ring-rust/50 placeholder:text-ink-faded/60"
                aria-label={t('traceability.lookup.ariaLabel')}
              />
            </div>
          </div>

          <p className="font-body text-overline text-sepia-mid/70 mt-2 tracking-wide">
            {t('traceability.lookup.hint')}
          </p>

          <AnimatePresence>
            {isSearching && (
              <motion.div
                initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, height: 0 }}
                animate={prefersReducedMotion ? { opacity: 1 } : { opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
              >
                <SearchSpinner t={t} />
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {searchResult && !isSearching && (
              <motion.div
                initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 10 }}
                animate={prefersReducedMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.4 }}
                className="mt-4 p-5 border-2 border-sage/30 bg-sage/5 relative overflow-hidden"
              >
                <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-sage/30" />
                <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-sage/30" />
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 flex-shrink-0 border border-sage/30 rounded-sm flex items-center justify-center bg-sage/10">
                    <svg className="w-4 h-4 text-sage" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-display text-body-sm font-bold text-ink mb-1">
                      {t('traceability.lookup.found')}
                    </h4>
                    <p className="font-body text-caption text-ink-faded leading-relaxed">
                      {searchResult.partnerName} &mdash; {searchResult.location},{' '}
                      {new Date(searchResult.date).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                      })}
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </SectionContainer>

      {/* Section 02: Featured traceability example with enhanced timeline */}
      <SectionContainer>
        <NumberedSectionHeading
          number="02"
          title={t('traceability.example.title')}
          subtitle={t('traceability.example.subtitle')}
        />

        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-12">
          {/* Image + carbon sidebar */}
          <div className="md:col-span-5 md:order-2">
            <div className="sticky top-28">
              <SepiaImageFrame
                src="https://picsum.photos/seed/dreamscape-tee/600/800"
                alt="Dreamscape Tee"
                aspectRatio="portrait"
                size="full"
              />

              {/* Carbon total */}
              <motion.div
                {...(prefersReducedMotion ? {} : {
                  initial: { opacity: 0 },
                  whileInView: { opacity: 1 },
                  viewport: { once: true },
                })}
                className="mt-6 border border-warm-gray/30 p-6 bg-aged-stock"
              >
                <span className="font-body text-caption text-sepia-mid tracking-[0.2em] uppercase">
                  {t('traceability.carbon')}
                </span>
                <div className="font-display text-h3 font-bold text-ink mt-2">
                  {t('traceability.carbonTotal.value')}
                </div>
                <p className="font-body text-caption text-ink-faded mt-2 leading-relaxed">
                  {t('traceability.carbonTotal.offset')}
                </p>
              </motion.div>

              {/* Highlighted record detail */}
              <AnimatePresence>
                {highlightedId && (
                  <motion.div
                    initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, height: 0 }}
                    animate={prefersReducedMotion ? { opacity: 1 } : { opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.4 }}
                    className="mt-4 border-2 border-sage/30 p-5 bg-sage/5"
                  >
                    <span className="font-body text-overline text-sage tracking-[0.15em] uppercase">
                      {t('traceability.lookup.highlighted')}
                    </span>
                    <p className="font-body text-caption text-ink-faded mt-1 leading-relaxed">
                      {records.find((r) => r.id === highlightedId)?.description}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Enhanced Timeline with scroll-drawn connector */}
          <div className="md:col-span-7 md:order-1 relative" ref={timelineRef}>
            <EnhancedTimeline records={records} t={t} />

            {/* Vertical scroll-drawn connecting line alongside timeline */}
            <div className="absolute top-0 -left-6 bottom-0 w-px hidden md:block" aria-hidden="true">
              <ScrollPathDrawInline
                path="M0,0 L0,800"
                strokeColor="var(--color-sepia-mid)"
                strokeWidth={1}
                className="h-full w-4"
                containerRef={timelineRef}
              />
            </div>
          </div>
        </div>
      </SectionContainer>

      {/* Quote */}
      <SectionContainer narrow>
        <StoryQuoteBlock
          quote={t('traceability.quote.text')}
          author={t('traceability.quote.author')}
          role={t('traceability.quote.role')}
        />
      </SectionContainer>

      {/* Scroll-drawn connector */}
      <div className="flex justify-center py-4" aria-hidden="true">
        <ScrollPathDrawInline
          path="M0,20 C60,5 120,35 180,20 S300,5 360,20"
          strokeColor="var(--color-sepia-mid)"
          strokeWidth={1}
          className="w-64 h-10"
        />
      </div>

      {/* Section 03: Carbon Footprint Visualization */}
      <section className="bg-aged-stock section-spacing">
        <SectionContainer>
          <NumberedSectionHeading
            number="03"
            title={t('traceability.carbon.title')}
            subtitle={t('traceability.carbon.subtitle')}
          />

          <div className="grid grid-cols-1 md:grid-cols-12 gap-10 md:gap-16">
            {/* Bar chart */}
            <div className="md:col-span-7 space-y-8">
              <CarbonBar
                label={t('traceability.carbon.conventional')}
                value={CARBON_DATA.conventional}
                maxValue={CARBON_DATA.conventional}
                isEco={false}
                delay={0}
              />
              <CarbonBar
                label={t('traceability.carbon.vicoo')}
                value={CARBON_DATA.vicoo}
                maxValue={CARBON_DATA.conventional}
                isEco={true}
                delay={0.2}
              />

              <motion.p
                {...(prefersReducedMotion ? {} : {
                  initial: { opacity: 0 },
                  whileInView: { opacity: 1 },
                  viewport: { once: true },
                  transition: { duration: 0.6, delay: 0.5 },
                })}
                className="font-body text-caption text-ink-faded leading-relaxed border-l-2 border-sage/30 pl-4 mt-4"
              >
                {t('traceability.carbon.explanation')}
              </motion.p>
            </div>

            {/* Reduction counter */}
            <div className="md:col-span-5">
              <motion.div
                {...(prefersReducedMotion ? {} : {
                  initial: { opacity: 0, scale: 0.95 },
                  whileInView: { opacity: 1, scale: 1 },
                  viewport: { once: true },
                  transition: { duration: 0.6, delay: 0.3 },
                })}
                className="border-2 border-sage/30 p-8 text-center bg-paper relative overflow-hidden"
              >
                <SectionGrainOverlay className="z-10" />

                {/* Corner accents */}
                <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-sage/20" />
                <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-sage/20" />

                <div className="relative z-20">
                  <span className="font-body text-overline tracking-[0.2em] uppercase text-sage block mb-3">
                    {t('traceability.carbon.reduction')}
                  </span>
                  <div className="font-display text-[clamp(48px,8vw,72px)] font-bold text-sage leading-none">
                    <AnimatedCounter value={reductionPercent} suffix="%" />
                  </div>
                  <p className="font-body text-caption text-sepia-mid mt-4 leading-relaxed">
                    {t('traceability.carbon.reductionDesc')}
                  </p>
                </div>
              </motion.div>
            </div>
          </div>
        </SectionContainer>
      </section>

      {/* Section 04: How it works */}
      <section className="section-spacing">
        <SectionContainer>
          <NumberedSectionHeading
            number="04"
            title={t('traceability.howItWorks.title')}
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                num: '01',
                title: t('traceability.howItWorks.steps.record.title'),
                desc: t('traceability.howItWorks.steps.record.desc'),
              },
              {
                num: '02',
                title: t('traceability.howItWorks.steps.verify.title'),
                desc: t('traceability.howItWorks.steps.verify.desc'),
              },
              {
                num: '03',
                title: t('traceability.howItWorks.steps.publish.title'),
                desc: t('traceability.howItWorks.steps.publish.desc'),
              },
            ].map((step) => (
              <motion.div
                key={step.num}
                {...(prefersReducedMotion ? {} : {
                  initial: { opacity: 0, y: 30 },
                  whileInView: { opacity: 1, y: 0 },
                  viewport: { once: true },
                  transition: { duration: 0.6, ease: [0, 0, 0.2, 1] },
                })}
                className="border-t border-warm-gray/30 pt-6"
              >
                <span className="font-body text-caption text-sepia-mid tracking-[0.2em]">
                  {step.num}
                </span>
                <h3 className="font-display text-h3 font-bold text-ink mt-2 mb-3">
                  {step.title}
                </h3>
                <p className="font-body text-body-sm text-ink-faded leading-relaxed">
                  {step.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </SectionContainer>
      </section>

      {/* Section 05: Certification Badges */}
      <section className="bg-aged-stock section-spacing">
        <SectionContainer>
          <NumberedSectionHeading
            number="05"
            title={t('traceability.certifications.title')}
            subtitle={t('traceability.certifications.subtitle')}
          />

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {certifications.map((cert, index) => (
              <CertificationBadge
                key={cert.title}
                title={cert.title}
                description={cert.description}
                delay={index * 0.1}
              />
            ))}
          </div>
        </SectionContainer>
      </section>

      {/* Bottom CTA */}
      <div className="editorial-divider" />

      <SectionContainer narrow>
        <motion.div
          {...(prefersReducedMotion ? {} : {
            initial: { opacity: 0, y: 30 },
            whileInView: { opacity: 1, y: 0 },
            viewport: { once: true },
            transition: { duration: 0.7, ease: [0, 0, 0.2, 1] },
          })}
          className="text-center py-8"
        >
          <span className="font-body text-overline tracking-[0.3em] uppercase text-sepia-mid block mb-4">
            {t('traceability.cta.label')}
          </span>
          <h2 className="font-display text-[clamp(28px,4vw,48px)] font-bold text-ink leading-tight mb-6">
            {t('traceability.cta.headline')}
          </h2>
          <p className="font-body text-body-sm text-ink-faded max-w-md mx-auto mb-8 leading-relaxed">
            {t('traceability.cta.body')}
          </p>
          <Link
            to="/shop"
            className="inline-block font-body text-label tracking-[0.2em] uppercase px-10 py-4 border-2 border-rust text-rust hover:bg-rust hover:text-paper transition-all duration-300"
          >
            {t('traceability.cta.button')}
          </Link>
        </motion.div>
      </SectionContainer>

      <div className="editorial-divider" />
    </PageWrapper>
  );
}
