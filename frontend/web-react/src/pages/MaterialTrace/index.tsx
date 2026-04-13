import { useState, useRef, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence, useInView, useReducedMotion } from 'framer-motion';
import PageWrapper from '@/components/layout/PageWrapper';
import SectionContainer from '@/components/layout/SectionContainer';
import NumberedSectionHeading from '@/components/editorial/NumberedSectionHeading';
import { VintageInput } from '@/components/editorial/VintageInput';
import EditorialCard from '@/components/editorial/EditorialCard';
import SepiaImageFrame from '@/components/editorial/SepiaImageFrame';
import GrainOverlay from '@/components/editorial/GrainOverlay';
import PaperTextureBackground from '@/components/editorial/PaperTextureBackground';
import MagazineDivider from '@/components/editorial/MagazineDivider';
import { placeholderImage } from '@/utils/placeholderImage';

/* ------------------------------------------------------------------ */
/*  Mock Data                                                          */
/* ------------------------------------------------------------------ */

interface TimelineNode {
  id: string;
  stage: string;
  stageEn: string;
  status: 'verified' | 'in-progress' | 'pending';
  statusLabel: string;
  date: string;
  details: Record<string, string>;
}

interface ProductDataset {
  product: { id: string; name: string; batch: string; image: string };
  timeline: TimelineNode[];
  carbonData: { stage: string; co2: number; color: string }[];
  carbonTotal: number;
  carbonTraditional: number;
  certifications: string[];
}

const PRODUCT_DATASETS: ProductDataset[] = [
  {
    product: { id: 'TH-2026-001', name: '\u7ae5\u8da3\u82b1\u56edT\u6064', batch: 'BAT-2026-A12', image: placeholderImage('\u7ae5\u8da3\u82b1\u56edT\u6064', { hue: 30 }) },
    timeline: [
      {
        id: 'raw',
        stage: '\u539f\u6599\u6765\u6e90',
        stageEn: 'Raw Material Source',
        status: 'verified',
        statusLabel: '\u5df2\u9a8c\u8bc1 Verified',
        date: '2025-12-15',
        details: {
          '\u6765\u6e90\u5730': '\u65b0\u7586\u963f\u514b\u82cf\u6709\u673a\u68c9\u82b1\u57fa\u5730',
          '\u54c1\u79cd': '\u957f\u7ed2\u68c9 (Long-staple cotton)',
          '\u8ba4\u8bc1': 'GOTS\u6709\u673a\u8ba4\u8bc1',
          '\u91c7\u8d2d\u65e5\u671f': '2025-12-15',
          'GPS\u5750\u6807': '41.1684\u00b0N, 80.2636\u00b0E',
        },
      },
      {
        id: 'fabric',
        stage: '\u9762\u6599\u52a0\u5de5',
        stageEn: 'Fabric Processing',
        status: 'verified',
        statusLabel: '\u5df2\u9a8c\u8bc1 Verified',
        date: '2026-01-08',
        details: {
          '\u5de5\u5382': '\u5c71\u4e1c\u5fb7\u5dde\u7eba\u7ec7\u6709\u9650\u516c\u53f8',
          '\u5de5\u5e8f': '\u7eba\u7eb1 \u2192 \u7ec7\u5e03 \u2192 \u67d3\u6574',
          '\u5b8c\u6210\u65e5\u671f': '2026-01-08',
        },
      },
      {
        id: 'garment',
        stage: '\u6210\u8863\u5236\u9020',
        stageEn: 'Garment Manufacturing',
        status: 'verified',
        statusLabel: '\u5df2\u9a8c\u8bc1 Verified',
        date: '2026-01-22',
        details: {
          '\u5de5\u5382': '\u5e7f\u5dde\u82b1\u90fd\u670d\u88c5\u5236\u9020\u6709\u9650\u516c\u53f8',
          '\u6279\u6b21\u53f7': 'MFG-2026-0142',
          '\u5de5\u4eba\u4fdd\u969c': 'SA8000\u8ba4\u8bc1',
          '\u5b8c\u6210\u65e5\u671f': '2026-01-22',
        },
      },
      {
        id: 'inspection',
        stage: '\u8d28\u91cf\u68c0\u6d4b',
        stageEn: 'Quality Inspection',
        status: 'verified',
        statusLabel: '\u5df2\u9a8c\u8bc1 Verified',
        date: '2026-01-28',
        details: {
          '\u673a\u6784': 'SGS\u901a\u6807\u6807\u51c6\u6280\u672f\u670d\u52a1',
          '\u62a5\u544a\u7f16\u53f7': 'SGS-2026-TH-0089',
          '\u68c0\u6d4b\u7ed3\u679c': '\u5168\u9879\u5408\u683c',
          '\u68c0\u6d4b\u65e5\u671f': '2026-01-28',
        },
      },
      {
        id: 'logistics',
        stage: '\u7269\u6d41\u914d\u9001',
        stageEn: 'Logistics & Delivery',
        status: 'verified',
        statusLabel: '\u5df2\u9a8c\u8bc1 Verified',
        date: '2026-02-03',
        details: {
          '\u7269\u6d41': '\u987a\u4e30\u901f\u8fd0',
          '\u5355\u53f7': 'SF1234567890',
          '\u7eff\u8272\u7269\u6d41': '\u662f \u2713',
          '\u9001\u8fbe\u65e5\u671f': '2026-02-03',
        },
      },
    ],
    carbonData: [
      { stage: '\u539f\u6599\u91c7\u8d2d', co2: 2.1, color: 'bg-sage' },
      { stage: '\u52a0\u5de5\u5904\u7406', co2: 3.4, color: 'bg-rust' },
      { stage: '\u6210\u8863\u5236\u9020', co2: 1.8, color: 'bg-sepia-mid' },
      { stage: '\u8d28\u68c0\u8fd0\u8f93', co2: 0.5, color: 'bg-ink/60' },
      { stage: '\u7269\u6d41\u914d\u9001', co2: 0.4, color: 'bg-sage/70' },
    ],
    carbonTotal: 8.2,
    carbonTraditional: 33.4,
    certifications: ['GOTS', 'Fair Trade', 'SA8000', 'BSCI'],
  },
  {
    product: { id: 'TH-2026-002', name: '\u661f\u7a7a\u68a6\u60f3\u536b\u8863', batch: 'BAT-2026-B05', image: placeholderImage('\u661f\u7a7a\u68a6\u60f3\u536b\u8863', { hue: 220 }) },
    timeline: [
      {
        id: 'raw',
        stage: '\u539f\u6599\u6765\u6e90',
        stageEn: 'Raw Material Source',
        status: 'verified',
        statusLabel: '\u5df2\u9a8c\u8bc1 Verified',
        date: '2025-11-20',
        details: {
          '\u6765\u6e90\u5730': '\u5c71\u4e1c\u6ee8\u5dde\u6709\u673a\u68c9\u82b1\u5408\u4f5c\u793e',
          '\u54c1\u79cd': '\u7ec6\u7ed2\u68c9 (Upland cotton)',
          '\u8ba4\u8bc1': 'OCS\u6709\u673a\u542b\u91cf\u6807\u51c6',
          '\u91c7\u8d2d\u65e5\u671f': '2025-11-20',
          'GPS\u5750\u6807': '37.3826\u00b0N, 117.9711\u00b0E',
        },
      },
      {
        id: 'fabric',
        stage: '\u9762\u6599\u52a0\u5de5',
        stageEn: 'Fabric Processing',
        status: 'verified',
        statusLabel: '\u5df2\u9a8c\u8bc1 Verified',
        date: '2025-12-18',
        details: {
          '\u5de5\u5382': '\u6c5f\u82cf\u5357\u901a\u534e\u7eba\u7ec7\u4e1a\u96c6\u56e2',
          '\u5de5\u5e8f': '\u7eba\u7eb1 \u2192 \u9488\u7ec7 \u2192 \u8d77\u7ed2 \u2192 \u67d3\u8272',
          '\u5b8c\u6210\u65e5\u671f': '2025-12-18',
        },
      },
      {
        id: 'garment',
        stage: '\u6210\u8863\u5236\u9020',
        stageEn: 'Garment Manufacturing',
        status: 'verified',
        statusLabel: '\u5df2\u9a8c\u8bc1 Verified',
        date: '2026-01-10',
        details: {
          '\u5de5\u5382': '\u6d59\u6c5f\u5609\u5174\u7ae5\u88c5\u5236\u9020\u6709\u9650\u516c\u53f8',
          '\u6279\u6b21\u53f7': 'MFG-2026-0078',
          '\u5de5\u4eba\u4fdd\u969c': 'BSCI\u8ba4\u8bc1',
          '\u5b8c\u6210\u65e5\u671f': '2026-01-10',
        },
      },
      {
        id: 'inspection',
        stage: '\u8d28\u91cf\u68c0\u6d4b',
        stageEn: 'Quality Inspection',
        status: 'verified',
        statusLabel: '\u5df2\u9a8c\u8bc1 Verified',
        date: '2026-01-18',
        details: {
          '\u673a\u6784': 'Intertek\u5929\u7965\u96c6\u56e2',
          '\u62a5\u544a\u7f16\u53f7': 'ITK-2026-TH-0034',
          '\u68c0\u6d4b\u7ed3\u679c': '\u5168\u9879\u5408\u683c',
          '\u68c0\u6d4b\u65e5\u671f': '2026-01-18',
        },
      },
      {
        id: 'logistics',
        stage: '\u7269\u6d41\u914d\u9001',
        stageEn: 'Logistics & Delivery',
        status: 'in-progress',
        statusLabel: '\u8fdb\u884c\u4e2d In Progress',
        date: '2026-02-08',
        details: {
          '\u7269\u6d41': '\u4eac\u4e1c\u7269\u6d41',
          '\u5355\u53f7': 'JD9876543210',
          '\u7eff\u8272\u7269\u6d41': '\u662f \u2713',
          '\u9884\u8ba1\u5230\u8fbe': '2026-02-08',
        },
      },
    ],
    carbonData: [
      { stage: '\u539f\u6599\u91c7\u8d2d', co2: 2.8, color: 'bg-sage' },
      { stage: '\u52a0\u5de5\u5904\u7406', co2: 4.1, color: 'bg-rust' },
      { stage: '\u6210\u8863\u5236\u9020', co2: 2.3, color: 'bg-sepia-mid' },
      { stage: '\u8d28\u68c0\u8fd0\u8f93', co2: 0.6, color: 'bg-ink/60' },
      { stage: '\u7269\u6d41\u914d\u9001', co2: 0.7, color: 'bg-sage/70' },
    ],
    carbonTotal: 10.5,
    carbonTraditional: 38.6,
    certifications: ['OCS', 'BSCI', 'Oeko-Tex'],
  },
  {
    product: { id: 'TH-2026-003', name: '\u5f69\u8679\u6d82\u9e26\u88d9', batch: 'BAT-2026-C03', image: placeholderImage('\u5f69\u8679\u6d82\u9e26\u88d9', { hue: 340 }) },
    timeline: [
      {
        id: 'raw',
        stage: '\u539f\u6599\u6765\u6e90',
        stageEn: 'Raw Material Source',
        status: 'verified',
        statusLabel: '\u5df2\u9a8c\u8bc1 Verified',
        date: '2026-01-05',
        details: {
          '\u6765\u6e90\u5730': '\u4e91\u5357\u5927\u7406\u9ebb\u7eba\u5408\u4f5c\u793e',
          '\u54c1\u79cd': '\u6c49\u9ebb\u6df7\u7eba (Hemp blend)',
          '\u8ba4\u8bc1': 'OEKO-TEX Standard 100',
          '\u91c7\u8d2d\u65e5\u671f': '2026-01-05',
          'GPS\u5750\u6807': '25.6065\u00b0N, 100.2679\u00b0E',
        },
      },
      {
        id: 'fabric',
        stage: '\u9762\u6599\u52a0\u5de5',
        stageEn: 'Fabric Processing',
        status: 'verified',
        statusLabel: '\u5df2\u9a8c\u8bc1 Verified',
        date: '2026-01-25',
        details: {
          '\u5de5\u5382': '\u4e91\u5357\u6606\u660e\u7eff\u7ec7\u7eba\u7ec7\u5382',
          '\u5de5\u5e8f': '\u8131\u80f6 \u2192 \u7eba\u7eb1 \u2192 \u7ec7\u5e03 \u2192 \u690d\u7269\u67d3',
          '\u5b8c\u6210\u65e5\u671f': '2026-01-25',
        },
      },
      {
        id: 'garment',
        stage: '\u6210\u8863\u5236\u9020',
        stageEn: 'Garment Manufacturing',
        status: 'verified',
        statusLabel: '\u5df2\u9a8c\u8bc1 Verified',
        date: '2026-02-10',
        details: {
          '\u5de5\u5382': '\u6210\u90fd\u8700\u7ee3\u7ae5\u88c5\u5de5\u574a',
          '\u6279\u6b21\u53f7': 'MFG-2026-0201',
          '\u5de5\u4eba\u4fdd\u969c': 'Fair Trade\u8ba4\u8bc1',
          '\u5b8c\u6210\u65e5\u671f': '2026-02-10',
        },
      },
      {
        id: 'inspection',
        stage: '\u8d28\u91cf\u68c0\u6d4b',
        stageEn: 'Quality Inspection',
        status: 'pending',
        statusLabel: '\u5f85\u68c0\u6d4b Pending',
        date: '\u9884\u8ba1 2026-02-20',
        details: {
          '\u673a\u6784': 'BV\u5fc5\u7ef4\u56fd\u9645\u68c0\u9a8c\u96c6\u56e2',
          '\u62a5\u544a\u7f16\u53f7': '\u5f85\u5206\u914d',
          '\u68c0\u6d4b\u7ed3\u679c': '\u5f85\u68c0\u6d4b',
          '\u9884\u8ba1\u65e5\u671f': '2026-02-20',
        },
      },
      {
        id: 'logistics',
        stage: '\u7269\u6d41\u914d\u9001',
        stageEn: 'Logistics & Delivery',
        status: 'pending',
        statusLabel: '\u5f85\u53d1\u8d27 Pending',
        date: '\u9884\u8ba1 2026-03-01',
        details: {
          '\u7269\u6d41': '\u5f85\u5b89\u6392',
          '\u5355\u53f7': '\u5f85\u5206\u914d',
          '\u7eff\u8272\u7269\u6d41': '\u8ba1\u5212\u4f7f\u7528',
          '\u9884\u8ba1\u5230\u8fbe': '2026-03-01',
        },
      },
    ],
    carbonData: [
      { stage: '\u539f\u6599\u91c7\u8d2d', co2: 1.5, color: 'bg-sage' },
      { stage: '\u52a0\u5de5\u5904\u7406', co2: 2.6, color: 'bg-rust' },
      { stage: '\u6210\u8863\u5236\u9020', co2: 1.9, color: 'bg-sepia-mid' },
      { stage: '\u8d28\u68c0\u8fd0\u8f93', co2: 0.4, color: 'bg-ink/60' },
      { stage: '\u7269\u6d41\u914d\u9001', co2: 0.4, color: 'bg-sage/70' },
    ],
    carbonTotal: 6.8,
    carbonTraditional: 28.2,
    certifications: ['Oeko-Tex', 'Fair Trade', 'GOTS'],
  },
];

const MOCK_PRODUCTS = PRODUCT_DATASETS.map((d) => d.product);

/* ------------------------------------------------------------------ */
/*  Status styling maps                                                */
/* ------------------------------------------------------------------ */

const DOT_COLORS: Record<TimelineNode['status'], string> = {
  verified: 'bg-sage border-sage/40',
  'in-progress': 'bg-amber-500 border-amber-400/40',
  pending: 'bg-warm-gray border-warm-gray/40',
};

const BADGE_COLORS: Record<TimelineNode['status'], string> = {
  verified: 'bg-sage/10 text-sage border-sage/30',
  'in-progress': 'bg-amber-50 text-amber-700 border-amber-300/40',
  pending: 'bg-gray-50 text-gray-500 border-gray-200',
};

/* ------------------------------------------------------------------ */
/*  Timeline Node Component                                            */
/* ------------------------------------------------------------------ */

function TimelineNodeCard({ node, index }: { node: TimelineNode; index: number }) {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(index === 0);
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-60px' });
  const prefersReducedMotion = useReducedMotion();

  const dotColor = DOT_COLORS[node.status];
  const badgeColor = BADGE_COLORS[node.status];

  return (
    <motion.div
      ref={ref}
      initial={prefersReducedMotion ? false : { opacity: 0, x: 30 }}
      animate={isInView ? { opacity: 1, x: 0 } : {}}
      transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.6, delay: index * 0.12, ease: [0, 0, 0.2, 1] }}
      className="relative pl-10 md:pl-14 pb-10 last:pb-0"
    >
      {/* Dot on timeline */}
      <div
        className={`absolute left-0 md:left-2 top-1 w-4 h-4 rounded-full border-4 ${dotColor} z-10`}
        aria-hidden="true"
      />

      {/* Card */}
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full text-left bg-paper border border-rust/30 p-5 md:p-6 transition-shadow duration-300 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-rust/50"
        aria-expanded={expanded}
      >
        <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
          <div className="flex items-center gap-3">
            <h3 className="font-display text-lg md:text-xl font-semibold text-ink">
              {t(`materialTrace.timeline.${node.id}`, node.stage)}
            </h3>
            <span className="font-body text-overline text-sepia-mid">{node.stageEn}</span>
          </div>
          <span className={`inline-flex items-center px-3 py-1 text-xs font-body tracking-wider border rounded-sm ${badgeColor}`}>
            {node.statusLabel}
          </span>
        </div>

        <p className="font-body text-caption text-sepia-mid">{node.date}</p>

        {/* Expand indicator */}
        <motion.span
          animate={{ rotate: expanded ? 180 : 0 }}
          transition={{ duration: 0.25 }}
          className="absolute top-5 right-5 text-sepia-mid"
          aria-hidden="true"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </motion.span>
      </button>

      {/* Expandable details */}
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            key="details"
            initial={prefersReducedMotion ? false : { height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={prefersReducedMotion ? { opacity: 0 } : { height: 0, opacity: 0 }}
            transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
            className="overflow-hidden"
          >
            <div className="bg-aged-stock border border-t-0 border-rust/20 p-5 md:p-6 space-y-2">
              {Object.entries(node.details).map(([key, value]) => (
                <div key={key} className="flex flex-wrap gap-2">
                  <span className="font-body text-caption text-sepia-mid min-w-[5rem]">{key}:</span>
                  <span className="font-body text-caption text-ink">{value}</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/*  Trust Indicator Icon                                               */
/* ------------------------------------------------------------------ */

function TrustIcon({ type }: { type: 'lock' | 'shield' | 'refresh' }) {
  const paths: Record<string, string> = {
    lock: 'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z',
    shield: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z',
    refresh: 'M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15',
  };
  return (
    <svg className="w-6 h-6 text-rust" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d={paths[type]} />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Page                                                          */
/* ------------------------------------------------------------------ */

export default function MaterialTracePage() {
  const { t } = useTranslation();
  const prefersReducedMotion = useReducedMotion();
  const [searchId, setSearchId] = useState('');
  const [activeProduct, setActiveProduct] = useState<string>(MOCK_PRODUCTS[0].id);
  const [searchError, setSearchError] = useState<string | null>(null);

  const carbonRef = useRef<HTMLDivElement>(null);
  const carbonInView = useInView(carbonRef, { once: true, margin: '-40px' });

  // Derive current dataset from activeProduct
  const activeDataset = PRODUCT_DATASETS.find((d) => d.product.id === activeProduct) ?? PRODUCT_DATASETS[0];
  const { timeline, carbonData, carbonTotal, carbonTraditional, certifications } = activeDataset;

  const { maxCo2, reductionPercent } = useMemo(() => ({
    maxCo2: Math.max(...carbonData.map((d) => d.co2)),
    reductionPercent: (((carbonTraditional - carbonTotal) / carbonTraditional) * 100).toFixed(1),
  }), [activeProduct]);

  const handleSearch = useCallback(() => {
    const trimmed = searchId.trim();
    if (!trimmed) return;
    const found = PRODUCT_DATASETS.find(
      (d) => d.product.id.toLowerCase() === trimmed.toLowerCase()
    );
    if (found) {
      setActiveProduct(found.product.id);
      setSearchError(null);
    } else {
      setSearchError('\u672a\u627e\u5230\u8be5\u5546\u54c1');
    }
  }, [searchId]);

  const handleProductClick = useCallback((id: string) => {
    setActiveProduct(id);
    setSearchError(null);
    setSearchId('');
  }, []);

  const handleSearchKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        handleSearch();
      }
    },
    [handleSearch]
  );

  return (
    <PageWrapper>
      <PaperTextureBackground variant="paper">
        <GrainOverlay />

      {/* ============================================================ */}
      {/*  Sample Data Disclaimer Banner                               */}
      {/* ============================================================ */}
      <SectionContainer className="pt-24 md:pt-32 pb-0">
        <div className="flex items-center gap-2 mb-6">
          <svg className="w-4 h-4 text-sepia-mid flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-sepia-mid text-xs">
            {t('materialTrace.disclaimer', '\u5f53\u524d\u5c55\u793a\u4e3a\u793a\u4f8b\u6570\u636e\uff0c\u6b63\u5f0f\u73af\u5883\u5c06\u63a5\u5165\u771f\u5b9e\u4f9b\u5e94\u94fe\u6eaf\u6e90\u7cfb\u7edf')}
          </span>
        </div>
      </SectionContainer>

      {/* ============================================================ */}
      {/*  Section 01 - Product Trace Lookup                           */}
      {/* ============================================================ */}
      <SectionContainer className="pt-0">
        <NumberedSectionHeading
          number="01"
          title={t('materialTrace.lookup.title', '\u5546\u54c1\u6eaf\u6e90\u67e5\u8be2')}
          subtitle={t('materialTrace.lookup.subtitle', '\u8f93\u5165\u5546\u54c1\u7f16\u53f7\uff0c\u67e5\u770b\u5b8c\u6574\u7684\u4f9b\u5e94\u94fe\u6eaf\u6e90\u4fe1\u606f')}
        />

        {/* Search Row */}
        <div className="grid grid-cols-12 gap-6 mb-12">
          <div className="col-span-12 md:col-span-8 lg:col-span-6">
            <div className="flex items-end gap-3">
              <div className="flex-1" onKeyDown={handleSearchKeyDown}>
                <VintageInput
                  icon="search"
                  placeholder={t('materialTrace.lookup.placeholder', '\u8f93\u5165\u5546\u54c1\u7f16\u53f7 e.g. TH-2026-001')}
                  value={searchId}
                  onChange={(e) => {
                    setSearchId((e.target as HTMLInputElement).value);
                    setSearchError(null);
                  }}
                  label={t('materialTrace.lookup.inputLabel', '\u5546\u54c1\u7f16\u53f7')}
                />
              </div>
              <button
                type="button"
                onClick={handleSearch}
                className="flex items-center justify-center w-12 h-12 border-2 border-rust/30 bg-paper text-rust hover:bg-rust hover:text-paper transition-colors duration-300 flex-shrink-0"
                aria-label={t('materialTrace.lookup.search', '\u641c\u7d22')}
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>
            </div>
            {searchError && (
              <p className="mt-2 font-body text-xs text-rust" role="alert">{searchError}</p>
            )}
          </div>
        </div>

        {/* Quick-access product cards */}
        <div className="grid grid-cols-12 gap-5">
          {MOCK_PRODUCTS.map((product, idx) => (
            <div key={product.id} className="col-span-12 sm:col-span-6 lg:col-span-4">
              <EditorialCard
                title={product.name}
                subtitle={product.batch}
                image={product.image}
                imageAlt={product.name}
                index={idx}
                onClick={() => handleProductClick(product.id)}
                hoverEffect="border"
                className={activeProduct === product.id ? 'ring-2 ring-rust/60' : ''}
              >
                <span className="font-body text-overline text-sepia-mid tracking-widest">
                  ID: {product.id}
                </span>
              </EditorialCard>
            </div>
          ))}
        </div>
      </SectionContainer>

      <MagazineDivider variant="decorative" className="my-16" />

      {/* ============================================================ */}
      {/*  Section 02 - Traceability Timeline                          */}
      {/* ============================================================ */}
      <SectionContainer>
        <NumberedSectionHeading
          number="02"
          title={t('materialTrace.timeline.title', '\u6eaf\u6e90\u65f6\u95f4\u7ebf')}
          subtitle={t('materialTrace.timeline.subtitle', '\u4ece\u68c9\u82b1\u7530\u5230\u60a8\u624b\u4e2d -- \u6bcf\u4e00\u6b65\u90fd\u7ecf\u8fc7\u9a8c\u8bc1\u7684\u900f\u660e\u4f9b\u5e94\u94fe')}
        />

        <div className="grid grid-cols-12 gap-8">
          {/* Left decorative info */}
          <div className="col-span-12 lg:col-span-3 hidden lg:block">
            <div className="sticky top-32 space-y-6">
              <SepiaImageFrame
                src={activeDataset.product.image}
                alt={t('materialTrace.timeline.cottonAlt', '\u6709\u673a\u68c9\u82b1\u57fa\u5730')}
                aspectRatio="portrait"
                size="full"
                caption={t('materialTrace.timeline.cottonCaption', '\u65b0\u7586\u963f\u514b\u82cf -- \u6709\u673a\u68c9\u82b1\u57fa\u5730')}
              />
              <div className="bg-sage/10 border border-sage/20 p-4">
                <p className="font-display text-sm font-semibold text-sage mb-1">
                  {t('materialTrace.timeline.activeId', '\u5f53\u524d\u8ffd\u6eaf')}
                </p>
                <p className="font-body text-body-sm text-ink">{activeProduct}</p>
                <p className="font-body text-xs text-sepia-mid mt-1">{activeDataset.product.name}</p>
              </div>
            </div>
          </div>

          {/* Timeline */}
          <div className="col-span-12 lg:col-span-9 relative">
            {/* Vertical line */}
            <div
              className="absolute left-[7px] md:left-[15px] top-0 bottom-0 w-px bg-rust/20"
              aria-hidden="true"
            />

            {timeline.map((node, idx) => (
              <TimelineNodeCard key={`${activeProduct}-${node.id}`} node={node} index={idx} />
            ))}
          </div>
        </div>
      </SectionContainer>

      <MagazineDivider variant="numbered" number="III" className="my-16" />

      {/* ============================================================ */}
      {/*  Section 03 - Data Integrity                                 */}
      {/* ============================================================ */}
      <SectionContainer>
        <NumberedSectionHeading
          number="03"
          title={t('materialTrace.integrity.title', '\u6570\u636e\u53ef\u4fe1\u5ea6')}
          subtitle={t('materialTrace.integrity.subtitle', 'Append-only \u65f6\u95f4\u7ebf\u67b6\u6784\u786e\u4fdd\u6eaf\u6e90\u6570\u636e\u771f\u5b9e\u53ef\u9760\u3001\u4e0d\u53ef\u7be1\u6539')}
        />

        <div className="grid grid-cols-12 gap-6 mb-12">
          {/* Explanation card */}
          <div className="col-span-12 lg:col-span-7">
            <div className="bg-paper border-2 border-rust/30 p-6 md:p-8 relative">
              <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-rust/30" aria-hidden="true" />
              <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-rust/30" aria-hidden="true" />

              <h3 className="font-display text-lg font-semibold text-ink mb-3">
                Append-only {t('materialTrace.integrity.timelineArch', '\u65f6\u95f4\u7ebf\u67b6\u6784')}
              </h3>
              <p className="font-body text-body-sm text-ink/80 leading-relaxed mb-4">
                {t(
                  'materialTrace.integrity.explanation',
                  '\u6240\u6709\u4f9b\u5e94\u94fe\u8bb0\u5f55\u91c7\u7528\u8ffd\u52a0\u5199\u5165\u6a21\u5f0f\uff0c\u4e00\u65e6\u5199\u5165\u5373\u4e0d\u53ef\u4fee\u6539\u6216\u5220\u9664\u3002\u6bcf\u6761\u8bb0\u5f55\u90fd\u5305\u542b\u65f6\u95f4\u6233\u4e0e\u9a8c\u8bc1\u7b7e\u540d\uff0c\u786e\u4fdd\u6570\u636e\u7684\u5b8c\u6574\u6027\u4e0e\u53ef\u8ffd\u6eaf\u6027\u3002'
                )}
              </p>
              <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-sage/10 border border-sage/30 rounded-sm text-sage font-body text-xs tracking-wider">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                {t('materialTrace.integrity.verifiedOnly', '\u4ec5\u516c\u5f00 Verified \u8bb0\u5f55')}
              </span>
            </div>
          </div>

          {/* Trust indicators */}
          <div className="col-span-12 lg:col-span-5 space-y-4">
            {([
              { icon: 'lock' as const, title: '\u4e0d\u53ef\u7be1\u6539', titleEn: 'Immutable', desc: '\u6570\u636e\u4e00\u65e6\u4e0a\u94fe\u5373\u65e0\u6cd5\u4fee\u6539' },
              { icon: 'shield' as const, title: '\u7b2c\u4e09\u65b9\u9a8c\u8bc1', titleEn: 'Third-party Verified', desc: '\u7531SGS\u7b49\u56fd\u9645\u673a\u6784\u72ec\u7acb\u9a8c\u8bc1' },
              { icon: 'refresh' as const, title: '\u5b9e\u65f6\u66f4\u65b0', titleEn: 'Real-time Updates', desc: '\u4f9b\u5e94\u94fe\u72b6\u6001\u540c\u6b65\u66f4\u65b0' },
            ]).map((item, idx) => (
              <motion.div
                key={item.icon}
                initial={prefersReducedMotion ? false : { opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.5, delay: idx * 0.1 }}
                className="flex items-start gap-4 bg-aged-stock border border-rust/20 p-4"
              >
                <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center bg-paper border border-rust/30 rounded-sm">
                  <TrustIcon type={item.icon} />
                </div>
                <div>
                  <p className="font-display text-sm font-semibold text-ink">
                    {t(`materialTrace.integrity.${item.icon}`, item.title)}{' '}
                    <span className="font-body text-sepia-mid font-normal">{item.titleEn}</span>
                  </p>
                  <p className="font-body text-caption text-ink/70 mt-0.5">{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Certification badges */}
        <div className="flex flex-wrap items-center gap-4 pt-4 border-t border-rust/20">
          <span className="font-body text-overline text-sepia-mid tracking-[0.2em] uppercase mr-2">
            {t('materialTrace.integrity.certifications', '\u8ba4\u8bc1\u4f53\u7cfb')}
          </span>
          {certifications.map((cert) => (
            <span
              key={cert}
              className="inline-flex items-center px-4 py-2 bg-paper border border-rust/30 font-display text-sm font-semibold text-ink tracking-wider"
            >
              {cert}
            </span>
          ))}
        </div>
      </SectionContainer>

      <MagazineDivider variant="decorative" className="my-16" />

      {/* ============================================================ */}
      {/*  Section 04 - Carbon Footprint Tracking                      */}
      {/* ============================================================ */}
      <SectionContainer className="pb-24 md:pb-32">
        <NumberedSectionHeading
          number="04"
          title={t('materialTrace.carbon.title', '\u78b3\u8db3\u8ff9\u8ffd\u8e2a')}
          subtitle={t('materialTrace.carbon.subtitle', '\u4ece\u539f\u6750\u6599\u5230\u6210\u54c1\u7684\u5168\u94fe\u8def\u78b3\u6392\u653e\u8ffd\u8e2a\u4e0e\u5bf9\u6bd4')}
        />

        <div ref={carbonRef} className="grid grid-cols-12 gap-8">
          {/* Bar chart */}
          <div className="col-span-12 lg:col-span-8 space-y-5">
            {carbonData.map((item, idx) => (
              <motion.div
                key={`${activeProduct}-${item.stage}`}
                initial={prefersReducedMotion ? false : { opacity: 0, x: -20 }}
                animate={carbonInView ? { opacity: 1, x: 0 } : {}}
                transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.5, delay: idx * 0.1 }}
                className="space-y-1.5"
              >
                <div className="flex justify-between items-baseline">
                  <span className="font-body text-caption text-ink">{item.stage}</span>
                  <span className="font-body text-caption text-sepia-mid">{item.co2} kg CO\u2082</span>
                </div>
                <div className="w-full h-3 bg-aged-stock border border-rust/10 rounded-sm overflow-hidden">
                  <motion.div
                    className={`h-full ${item.color} rounded-sm`}
                    initial={{ width: 0 }}
                    animate={carbonInView ? { width: `${(item.co2 / maxCo2) * 100}%` } : { width: 0 }}
                    transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.8, delay: 0.3 + idx * 0.1, ease: [0.4, 0, 0.2, 1] }}
                  />
                </div>
              </motion.div>
            ))}

            {/* Total bar */}
            <div className="pt-4 mt-4 border-t border-rust/20">
              <div className="flex justify-between items-baseline mb-2">
                <span className="font-display text-sm font-semibold text-ink">
                  {t('materialTrace.carbon.total', '\u603b\u8ba1')}
                </span>
                <span className="font-display text-lg font-bold text-rust">
                  {carbonTotal} kg CO\u2082
                </span>
              </div>
              <div className="flex justify-between items-baseline">
                <span className="font-body text-caption text-sepia-mid">
                  {t('materialTrace.carbon.traditional', '\u4f20\u7edf\u6a21\u5f0f')}
                </span>
                <span className="font-body text-caption text-sepia-mid line-through">
                  {carbonTraditional} kg CO\u2082
                </span>
              </div>
            </div>
          </div>

          {/* Reduction badge */}
          <div className="col-span-12 lg:col-span-4 flex items-start justify-center lg:justify-start">
            <motion.div
              key={`reduction-${activeProduct}`}
              initial={prefersReducedMotion ? false : { opacity: 0, scale: 0.9 }}
              animate={carbonInView ? { opacity: 1, scale: 1 } : {}}
              transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.6, delay: 0.5 }}
              className="bg-sage/10 border-2 border-sage/30 p-6 md:p-8 text-center w-full max-w-xs"
            >
              <p className="font-body text-overline text-sage tracking-[0.2em] uppercase mb-2">
                {t('materialTrace.carbon.reduction', '\u78b3\u6392\u653e\u964d\u4f4e')}
              </p>
              <p className="font-display text-5xl md:text-6xl font-bold text-sage leading-none mb-2">
                -{reductionPercent}%
              </p>
              <p className="font-body text-caption text-ink/60">
                {t('materialTrace.carbon.vsTraditional', '\u5bf9\u6bd4\u4f20\u7edf\u4f9b\u5e94\u94fe\u6a21\u5f0f')}
              </p>

              <div className="mt-6 pt-4 border-t border-sage/20 space-y-2">
                <div className="flex justify-between font-body text-xs text-ink/70">
                  <span>{t('materialTrace.carbon.sustainable', '\u53ef\u6301\u7eed')}</span>
                  <span className="font-semibold text-sage">{carbonTotal} kg</span>
                </div>
                <div className="flex justify-between font-body text-xs text-ink/70">
                  <span>{t('materialTrace.carbon.traditional', '\u4f20\u7edf\u6a21\u5f0f')}</span>
                  <span className="line-through">{carbonTraditional} kg</span>
                </div>
                <div className="flex justify-between font-body text-xs text-ink/70">
                  <span>{t('materialTrace.carbon.saved', '\u8282\u7701')}</span>
                  <span className="font-semibold text-sage">{(carbonTraditional - carbonTotal).toFixed(1)} kg</span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </SectionContainer>
      </PaperTextureBackground>
    </PageWrapper>
  );
}
