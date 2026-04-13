import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, useReducedMotion } from 'framer-motion';
import { placeholderImage } from '@/utils/placeholderImage';
import PageWrapper from '@/components/layout/PageWrapper';
import SectionContainer from '@/components/layout/SectionContainer';
import NumberedSectionHeading from '@/components/editorial/NumberedSectionHeading';
import EditorialCard from '@/components/editorial/EditorialCard';
import SepiaImageFrame from '@/components/editorial/SepiaImageFrame';
import GrainOverlay from '@/components/editorial/GrainOverlay';
import PaperTextureBackground from '@/components/editorial/PaperTextureBackground';
import MagazineDivider from '@/components/editorial/MagazineDivider';
import ImpactCounter from '@/components/editorial/ImpactCounter';
import { useScrollReveal } from '@/hooks/useScrollReveal';

/* ─── Stage accent colors ─── */
const STAGE_COLORS = {
  material: 'bg-[#F5E6C8]/20',
  processing: 'bg-[#E8D4B8]/20',
  manufacturing: 'bg-sage/10',
  quality: 'bg-[#D4E8D4]/20',
  shipping: 'bg-[#E0D4E8]/20',
} as const;

const STAGE_BORDER_COLORS = {
  material: 'border-[#D4A84B]/30',
  processing: 'border-[#C49A6C]/30',
  manufacturing: 'border-sage/30',
  quality: 'border-[#6BAF6B]/30',
  shipping: 'border-[#9B7DB8]/30',
} as const;

/* ─── Mock data ─── */
const OVERVIEW_STATS = {
  totalBatches: 186,
  partnerFactories: 12,
  qcPassRate: 98.5,
  carbonSaved: 7300,
};

const STAGES = [
  { key: 'material', number: 1, icon: '🌾' },
  { key: 'processing', number: 2, icon: '🧵' },
  { key: 'manufacturing', number: 3, icon: '🏭' },
  { key: 'quality', number: 4, icon: '✅' },
  { key: 'shipping', number: 5, icon: '🚚' },
] as const;

const MATERIAL_DATA = {
  origin: 'Aksu, Xinjiang Region',
  volume: '200 tons',
  unitPrice: '¥18,500/ton',
  certifications: ['SA8000', 'BSCI', 'GOTS'],
  carbonEstimate: '1,200 kg CO₂e',
  supplier: 'Lvyuan Organic Cotton Co-op',
};

const PROCESSING_DATA = {
  factory: 'Suzhou Hengtong Textile Co.',
  steps: [
    { name: 'Spinning', progress: 100 },
    { name: 'Dyeing', progress: 100 },
    { name: 'Fabric Processing', progress: 100 },
  ],
  transportDistance: '320 km',
  carbonEstimate: '860 kg CO₂e',
};

const MANUFACTURING_DATA = {
  factory: 'Guangzhou Jinhua Garment Factory',
  batchId: 'MFG-2026-0312',
  workerCount: 156,
  greenLogistics: true,
  productionDate: '2026-03-01',
  capacity: '5,000 pcs/month',
};

const QUALITY_DATA = {
  institution: 'SGS Standard Technical Services',
  items: [
    { name: 'Color Fastness', rate: 99.2, status: 'completed' as const },
    { name: 'Shrinkage', rate: 98.8, status: 'completed' as const },
    { name: 'Formaldehyde', rate: 100, status: 'completed' as const },
    { name: 'Azo Dyes', rate: null, status: 'pending' as const },
    { name: 'pH Level', rate: null, status: 'pending' as const },
  ],
  overallRate: null,
  reportId: 'SGS-QC-2026-04518',
  statusLabel: 'Testing in Progress',
};

const SHIPPING_DATA = {
  company: 'SF Express',
  method: 'Road + Local Delivery',
  estimatedArrival: 'TBD',
  trackingId: 'Awaiting Shipment',
  greenLogistics: true,
  nodes: [
    { location: 'Guangzhou Warehouse', date: '--', status: 'pending' as const },
    { location: 'Changsha Transit', date: '--', status: 'pending' as const },
    { location: 'Shanghai Distribution Center', date: '--', status: 'pending' as const },
    { location: 'Destination Store', date: '--', status: 'pending' as const },
  ],
};

const CARBON_COMPARISON = {
  conventional: { material: 3200, processing: 2800, manufacturing: 4500, quality: 200, shipping: 1800, total: 12500 },
  sustainable: { material: 1200, processing: 860, manufacturing: 2100, quality: 120, shipping: 920, total: 5200 },
};

const CARBON_REDUCTION_PERCENT = parseFloat(
  (((CARBON_COMPARISON.conventional.total - CARBON_COMPARISON.sustainable.total) /
    CARBON_COMPARISON.conventional.total) * 100).toFixed(1),
);

/* ─── Sub-components ─── */

function StageCard({
  stageKey,
  number,
  icon,
  label,
  sublabel,
  onClick,
  isActive,
}: {
  stageKey: keyof typeof STAGE_COLORS;
  number: number;
  icon: string;
  label: string;
  sublabel: string;
  onClick: () => void;
  isActive: boolean;
}) {
  const prefersReducedMotion = useReducedMotion();
  return (
    <motion.button
      whileHover={prefersReducedMotion ? {} : { y: -4 }}
      whileTap={prefersReducedMotion ? {} : { scale: 0.97 }}
      onClick={onClick}
      className={`
        flex flex-col items-center p-4 rounded-sm border-2 transition-all duration-300 cursor-pointer
        ${STAGE_COLORS[stageKey]} ${isActive ? STAGE_BORDER_COLORS[stageKey] : 'border-rust/20'}
        ${isActive ? 'shadow-md' : 'hover:shadow-sm'}
        min-w-[120px]
      `}
    >
      <span className="text-2xl mb-2" aria-hidden="true">{icon}</span>
      <span className="font-display text-sm font-semibold text-ink">{`0${number}`}</span>
      <span className="font-body text-xs text-ink mt-1 text-center">{label}</span>
      <span className="font-body text-[10px] text-sepia-mid mt-0.5">{sublabel}</span>
    </motion.button>
  );
}

function DataField({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="flex justify-between items-baseline py-2 border-b border-rust/10 last:border-b-0">
      <span className="font-body text-caption text-sepia-mid tracking-wide">{label}</span>
      <span className={`font-body text-sm ${accent ? 'text-rust font-semibold' : 'text-ink'}`}>{value}</span>
    </div>
  );
}

function CertBadge({ name }: { name: string }) {
  return (
    <span className="inline-block px-2 py-0.5 text-[10px] font-body text-rust border border-rust/30 rounded-sm mr-1.5 mb-1">
      {name}
    </span>
  );
}

function ProgressBar({ label, progress }: { label: string; progress: number }) {
  return (
    <div className="mb-3 last:mb-0">
      <div className="flex justify-between items-center mb-1">
        <span className="font-body text-caption text-ink">{label}</span>
        <span className="font-body text-caption text-sepia-mid">{progress}%</span>
      </div>
      <div className="w-full h-2 bg-aged-stock rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          whileInView={{ width: `${progress}%` }}
          viewport={{ once: true }}
          transition={{ duration: 1, ease: [0, 0, 0.2, 1] }}
          className="h-full bg-rust/70 rounded-full"
        />
      </div>
    </div>
  );
}

function QualityBar({
  name,
  rate,
  status,
  pendingLabel,
}: {
  name: string;
  rate: number | null;
  status: 'completed' | 'pending';
  pendingLabel: string;
}) {
  if (status === 'pending') {
    return (
      <div className="mb-3 last:mb-0">
        <div className="flex justify-between items-center mb-1">
          <span className="font-body text-caption text-ink/40">{name}</span>
          <span className="font-body text-caption text-sepia-mid/50">{pendingLabel}</span>
        </div>
        <div className="w-full h-2 bg-aged-stock rounded-full overflow-hidden">
          <div className="h-full w-0 rounded-full" />
        </div>
      </div>
    );
  }
  const barColor = rate! >= 99 ? 'bg-[#6BAF6B]' : rate! >= 98 ? 'bg-[#8BC34A]' : 'bg-[#FFC107]';
  return (
    <div className="mb-3 last:mb-0">
      <div className="flex justify-between items-center mb-1">
        <span className="font-body text-caption text-ink">{name}</span>
        <span className="font-body text-caption text-sepia-mid">{rate}%</span>
      </div>
      <div className="w-full h-2 bg-aged-stock rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          whileInView={{ width: `${rate}%` }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: [0, 0, 0.2, 1] }}
          className={`h-full ${barColor} rounded-full`}
        />
      </div>
    </div>
  );
}

function CarbonComparisonBar({
  label,
  conventional,
  sustainable,
  maxValue,
  conventionalShortLabel,
  sustainableShortLabel,
}: {
  label: string;
  conventional: number;
  sustainable: number;
  maxValue: number;
  conventionalShortLabel: string;
  sustainableShortLabel: string;
}) {
  return (
    <div className="mb-4 last:mb-0">
      <span className="font-body text-caption text-ink mb-2 block">{label}</span>
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <span className="font-body text-[10px] text-sepia-mid w-12 shrink-0">{conventionalShortLabel}</span>
          <div className="flex-1 h-3 bg-aged-stock rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              whileInView={{ width: `${(conventional / maxValue) * 100}%` }}
              viewport={{ once: true }}
              transition={{ duration: 1, ease: [0, 0, 0.2, 1] }}
              className="h-full bg-ink/40 rounded-full"
            />
          </div>
          <span className="font-body text-[10px] text-sepia-mid w-16 text-right">{conventional} kg</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-body text-[10px] text-rust w-12 shrink-0">{sustainableShortLabel}</span>
          <div className="flex-1 h-3 bg-aged-stock rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              whileInView={{ width: `${(sustainable / maxValue) * 100}%` }}
              viewport={{ once: true }}
              transition={{ duration: 1.2, ease: [0, 0, 0.2, 1] }}
              className="h-full bg-rust/70 rounded-full"
            />
          </div>
          <span className="font-body text-[10px] text-rust w-16 text-right">{sustainable} kg</span>
        </div>
      </div>
    </div>
  );
}

/* ─── Main Page ─── */

export default function SupplyChainPage() {
  const { t } = useTranslation();
  const prefersReducedMotion = useReducedMotion();

  // Refs for scrolling to stage sections
  const stageRefs = {
    material: useRef<HTMLDivElement>(null),
    processing: useRef<HTMLDivElement>(null),
    manufacturing: useRef<HTMLDivElement>(null),
    quality: useRef<HTMLDivElement>(null),
    shipping: useRef<HTMLDivElement>(null),
  };

  const [overviewRef, overviewVisible] = useScrollReveal<HTMLDivElement>();
  const [carbonRef, carbonVisible] = useScrollReveal<HTMLDivElement>();
  const [activeStage, setActiveStage] = useState<string>('material');

  const scrollToStage = (key: string) => {
    setActiveStage(key);
    const ref = stageRefs[key as keyof typeof stageRefs];
    ref?.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const stageLabels = [
    { label: t('supplyChain.stage1', 'Material Sourcing'), sub: t('supplyChain.stage1', 'Material Sourcing') },
    { label: t('supplyChain.stage2', 'Processing'), sub: t('supplyChain.stage2', 'Processing') },
    { label: t('supplyChain.stage3', 'Manufacturing'), sub: t('supplyChain.stage3', 'Manufacturing') },
    { label: t('supplyChain.stage4', 'Quality Check'), sub: t('supplyChain.stage4', 'Quality Check') },
    { label: t('supplyChain.stage5', 'Shipping'), sub: t('supplyChain.stage5', 'Shipping') },
  ];

  return (
    <PageWrapper>
      <PaperTextureBackground variant="paper">
        <GrainOverlay />

        {/* -- Sample data disclaimer -- */}
        <div className="mx-auto max-w-5xl px-4 pt-6">
          <div className="flex items-center gap-2 rounded-sm border border-rust/20 bg-aged-stock/60 px-4 py-2">
            <svg className="h-4 w-4 shrink-0 text-sepia-mid" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <span className="text-sepia-mid text-xs">
              Sample Data — Currently showing sample data; production will connect to the real supply chain management system
            </span>
          </div>
        </div>

        {/* ════════════════════════════════════════════════════════════════
            Section 01 — Supply Chain Overview
        ════════════════════════════════════════════════════════════════ */}
        <SectionContainer className="pt-20 md:pt-28">
          <NumberedSectionHeading
            number="01"
            title={t('supplyChain.overviewTitle', 'Supply Chain Overview')}
            subtitle={t('supplyChain.overviewSubtitle', 'From cotton fields to store shelves, every step is traceable')}
          />

          {/* Pipeline Stepper */}
          <motion.div
            ref={overviewRef}
            initial={prefersReducedMotion ? false : { opacity: 0, y: 30 }}
            animate={overviewVisible ? { opacity: 1, y: 0 } : {}}
            transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.7, ease: [0, 0, 0.2, 1] }}
            className="mb-16"
          >
            {/* Entry: Design Draft */}
            <div className="flex items-center justify-center mb-8">
              <div className="px-4 py-2 bg-aged-stock border border-rust/20 rounded-sm">
                <span className="font-body text-caption text-sepia-mid tracking-wide">
                  {t('supplyChain.designDraft', 'Product Design Draft')}
                </span>
              </div>
              <div className="w-8 h-px bg-rust/30 mx-2" aria-hidden="true" />
              <span className="font-body text-caption text-rust">→</span>
            </div>

            {/* 5 Stage Cards */}
            <div className="flex flex-wrap justify-center gap-3 md:gap-4 mb-8">
              {STAGES.map((stage, idx) => (
                <div key={stage.key} className="flex items-center">
                  <StageCard
                    stageKey={stage.key}
                    number={stage.number}
                    icon={stage.icon}
                    label={stageLabels[idx].label}
                    sublabel={stageLabels[idx].sub}
                    onClick={() => scrollToStage(stage.key)}
                    isActive={activeStage === stage.key}
                  />
                  {idx < STAGES.length - 1 && (
                    <div className="hidden md:flex items-center mx-2" aria-hidden="true">
                      <div className="w-6 h-px bg-rust/30" />
                      <span className="text-rust/50 text-xs">→</span>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Exit: Product Catalog */}
            <div className="flex items-center justify-center">
              <span className="font-body text-caption text-rust">→</span>
              <div className="w-8 h-px bg-rust/30 mx-2" aria-hidden="true" />
              <div className="px-4 py-2 bg-aged-stock border border-rust/20 rounded-sm">
                <span className="font-body text-caption text-sepia-mid tracking-wide">
                  {t('supplyChain.productCatalog', 'Product Launch')}
                </span>
              </div>
            </div>
          </motion.div>

          {/* Overview Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
            <ImpactCounter
              value={OVERVIEW_STATS.totalBatches}
              label={t('supplyChain.totalBatches', 'Total Material Batches')}
              suffix="+"
            />
            <ImpactCounter
              value={OVERVIEW_STATS.partnerFactories}
              label={t('supplyChain.partnerFactories', 'Partner Factories')}
              suffix={t('supplyChain.factorySuffix', '')}
            />
            <ImpactCounter
              value={OVERVIEW_STATS.qcPassRate}
              label={t('supplyChain.qcPassRate', 'QC Pass Rate')}
              suffix="%"
            />
            <ImpactCounter
              value={OVERVIEW_STATS.carbonSaved}
              label={t('supplyChain.carbonSaved', 'Carbon Saved')}
              suffix=" kg"
              prefix="−"
            />
          </div>
        </SectionContainer>

        <MagazineDivider variant="decorative" className="my-12 md:my-20" />

        {/* ════════════════════════════════════════════════════════════════
            Section 02 — 5-Stage Details
        ════════════════════════════════════════════════════════════════ */}
        <SectionContainer>
          <NumberedSectionHeading
            number="02"
            title={t('supplyChain.stageDetailsTitle', '5-Stage Details')}
            subtitle={t('supplyChain.stageDetailsSubtitle', 'Detailed records and data for each supply chain stage')}
          />

          {/* -- Stage 1: Material Sourcing -- */}
          <div ref={stageRefs.material} className="scroll-mt-24 mb-16 md:mb-24">
            <MagazineDivider variant="numbered" number="STAGE 01" className="mb-8" />
            <div className={`grid grid-cols-12 gap-6 md:gap-8 p-6 md:p-8 rounded-sm ${STAGE_COLORS.material}`}>
              {/* Left: Image + Info */}
              <div className="col-span-12 md:col-span-5">
                <SepiaImageFrame
                  src={placeholderImage('Organic Cotton Field', { hue: 45, width: 600, height: 400 })}
                  alt={t('supplyChain.materialImageAlt', 'Xinjiang Organic Cotton Field')}
                  caption={t('supplyChain.materialCaption', 'Aksu, Xinjiang Organic Cotton Base')}
                  aspectRatio="landscape"
                  size="full"
                />
              </div>
              {/* Right: Data */}
              <div className="col-span-12 md:col-span-7">
                <EditorialCard
                  title={t('supplyChain.materialTitle', 'Material Sourcing')}
                  subtitle={t('supplyChain.materialSubtitle', 'Xinjiang Organic Cotton - 200 tons')}
                  className="h-full"
                >
                  <div className="space-y-0">
                    <DataField
                      label={t('supplyChain.fieldOrigin', 'Origin')}
                      value={MATERIAL_DATA.origin}
                    />
                    <DataField
                      label={t('supplyChain.fieldVolume', 'Volume (tons)')}
                      value={MATERIAL_DATA.volume}
                    />
                    <DataField
                      label={t('supplyChain.fieldUnitPrice', 'Unit Price')}
                      value={MATERIAL_DATA.unitPrice}
                    />
                    <DataField
                      label={t('supplyChain.fieldSupplier', 'Supplier')}
                      value={MATERIAL_DATA.supplier}
                    />
                    <DataField
                      label={t('supplyChain.fieldCarbon', 'Carbon Estimate')}
                      value={MATERIAL_DATA.carbonEstimate}
                      accent
                    />
                    <div className="pt-3">
                      <span className="font-body text-caption text-sepia-mid block mb-2">
                        {t('supplyChain.fieldCerts', 'Supplier Certifications')}
                      </span>
                      {MATERIAL_DATA.certifications.map((cert) => (
                        <CertBadge key={cert} name={cert} />
                      ))}
                    </div>
                  </div>
                </EditorialCard>
              </div>
            </div>
          </div>

          {/* -- Stage 2: Processing -- */}
          <div ref={stageRefs.processing} className="scroll-mt-24 mb-16 md:mb-24">
            <MagazineDivider variant="numbered" number="STAGE 02" className="mb-8" />
            <div className={`grid grid-cols-12 gap-6 md:gap-8 p-6 md:p-8 rounded-sm ${STAGE_COLORS.processing}`}>
              <div className="col-span-12 md:col-span-7">
                <EditorialCard
                  title={t('supplyChain.processingTitle', 'Processing')}
                  subtitle={t('supplyChain.processingSubtitle', 'Spinning -> Dyeing -> Fabric Processing')}
                  className="h-full"
                >
                  <div className="space-y-0 mb-6">
                    <DataField
                      label={t('supplyChain.fieldFactory', 'Factory')}
                      value={PROCESSING_DATA.factory}
                    />
                    <DataField
                      label={t('supplyChain.fieldTransport', 'Transport Distance')}
                      value={PROCESSING_DATA.transportDistance}
                    />
                    <DataField
                      label={t('supplyChain.fieldCarbon', 'Carbon Estimate')}
                      value={PROCESSING_DATA.carbonEstimate}
                      accent
                    />
                  </div>
                  <div>
                    <span className="font-body text-caption text-sepia-mid block mb-3">
                      {t('supplyChain.processingSteps', 'Processing Progress')}
                    </span>
                    {PROCESSING_DATA.steps.map((step) => (
                      <ProgressBar key={step.name} label={step.name} progress={step.progress} />
                    ))}
                  </div>
                </EditorialCard>
              </div>
              <div className="col-span-12 md:col-span-5">
                <SepiaImageFrame
                  src={placeholderImage('Textile Workshop', { hue: 30, width: 600, height: 400 })}
                  alt={t('supplyChain.processingImageAlt', 'Textile Processing Workshop')}
                  caption={t('supplyChain.processingCaption', 'Suzhou Hengtong Textile Workshop')}
                  aspectRatio="landscape"
                  size="full"
                />
              </div>
            </div>
          </div>

          {/* -- Stage 3: Manufacturing -- */}
          <div ref={stageRefs.manufacturing} className="scroll-mt-24 mb-16 md:mb-24">
            <MagazineDivider variant="numbered" number="STAGE 03" className="mb-8" />
            <div className={`grid grid-cols-12 gap-6 md:gap-8 p-6 md:p-8 rounded-sm ${STAGE_COLORS.manufacturing}`}>
              <div className="col-span-12 md:col-span-5">
                <SepiaImageFrame
                  src={placeholderImage('Garment Factory', { hue: 140, width: 600, height: 400 })}
                  alt={t('supplyChain.manufacturingImageAlt', 'Guangzhou Garment Factory')}
                  caption={t('supplyChain.manufacturingCaption', 'Guangzhou Jinhua Production Line')}
                  aspectRatio="landscape"
                  size="full"
                />
              </div>
              <div className="col-span-12 md:col-span-7">
                <EditorialCard
                  title={t('supplyChain.manufacturingTitle', 'Manufacturing')}
                  subtitle={t('supplyChain.manufacturingSubtitle', 'Guangzhou Jinhua Garment Factory')}
                  className="h-full"
                >
                  <div className="space-y-0">
                    <DataField
                      label={t('supplyChain.fieldFactory', 'Factory')}
                      value={MANUFACTURING_DATA.factory}
                    />
                    <DataField
                      label={t('supplyChain.fieldBatchId', 'Batch ID')}
                      value={MANUFACTURING_DATA.batchId}
                    />
                    <DataField
                      label={t('supplyChain.fieldWorkers', 'Workers')}
                      value={`${MANUFACTURING_DATA.workerCount} workers`}
                    />
                    <DataField
                      label={t('supplyChain.fieldCapacity', 'Monthly Capacity')}
                      value={MANUFACTURING_DATA.capacity}
                    />
                    <DataField
                      label={t('supplyChain.fieldProductionDate', 'Production Date')}
                      value={MANUFACTURING_DATA.productionDate}
                    />
                    <div className="pt-3 flex items-center gap-2">
                      {MANUFACTURING_DATA.greenLogistics && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-[#D4E8D4]/40 border border-[#6BAF6B]/30 rounded-sm">
                          <span className="w-2 h-2 bg-[#6BAF6B] rounded-full" aria-hidden="true" />
                          <span className="font-body text-[10px] text-[#4A8B4A]">
                            {t('supplyChain.greenLogistics', 'Green Logistics')}
                          </span>
                        </span>
                      )}
                    </div>
                  </div>
                </EditorialCard>
              </div>
            </div>
          </div>

          {/* -- Stage 4: Quality Check -- */}
          <div ref={stageRefs.quality} className="scroll-mt-24 mb-16 md:mb-24">
            <MagazineDivider variant="numbered" number="STAGE 04" className="mb-8" />
            <div className={`grid grid-cols-12 gap-6 md:gap-8 p-6 md:p-8 rounded-sm ${STAGE_COLORS.quality}`}>
              <div className="col-span-12 md:col-span-7">
                <EditorialCard
                  title={t('supplyChain.qualityTitle', 'Quality Check')}
                  subtitle={`SGS · ${t('supplyChain.qualityStatusLabel', 'Testing in Progress')}`}
                  className="h-full"
                >
                  <div className="space-y-0 mb-6">
                    <DataField
                      label={t('supplyChain.fieldQcInstitution', 'QC Institution')}
                      value={QUALITY_DATA.institution}
                    />
                    <DataField
                      label={t('supplyChain.fieldQcReport', 'QC Report ID')}
                      value={QUALITY_DATA.reportId}
                    />
                    <DataField
                      label={t('supplyChain.fieldQcRate', 'Overall Pass Rate')}
                      value={t('supplyChain.qualityStatusLabel', 'Testing in Progress')}
                      accent
                    />
                    <DataField
                      label={t('supplyChain.fieldQcProgress', 'Test Progress')}
                      value={`3 / 5 completed`}
                    />
                  </div>
                  <div>
                    <span className="font-body text-caption text-sepia-mid block mb-3">
                      {t('supplyChain.qualityItems', 'Test Item Details')}
                    </span>
                    {QUALITY_DATA.items.map((item) => (
                      <QualityBar
                        key={item.name}
                        name={item.name}
                        rate={item.rate}
                        status={item.status}
                        pendingLabel={t('supplyChain.pendingLabel', 'Pending')}
                      />
                    ))}
                  </div>
                </EditorialCard>
              </div>
              <div className="col-span-12 md:col-span-5 flex items-center">
                {/* Quality status display */}
                <motion.div
                  initial={prefersReducedMotion ? false : { opacity: 0, scale: 0.9 }}
                  whileInView={prefersReducedMotion ? {} : { opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6 }}
                  className="w-full text-center p-8 bg-paper border-2 border-[#FFC107]/30 rounded-sm"
                >
                  <div className="font-display text-4xl md:text-5xl font-bold text-[#E6A817] leading-none">
                    Testing
                  </div>
                  <div className="font-body text-caption text-sepia-mid mt-3 tracking-wide">
                    {t('supplyChain.qcInProgress', 'Quality check in progress - 3/5 completed')}
                  </div>
                  <div className="mt-4 flex flex-wrap justify-center gap-2">
                    {QUALITY_DATA.items.map((item) => (
                      <span
                        key={item.name}
                        className={`inline-block px-2 py-0.5 text-[10px] font-body rounded-sm ${
                          item.status === 'completed'
                            ? 'text-[#4A8B4A] bg-[#D4E8D4]/30'
                            : 'text-sepia-mid/50 bg-aged-stock/50'
                        }`}
                      >
                        {item.name} {item.status === 'completed' ? `${item.rate}%` : t('supplyChain.pendingLabel', 'Pending')}
                      </span>
                    ))}
                  </div>
                </motion.div>
              </div>
            </div>
          </div>

          {/* -- Stage 5: Shipping -- */}
          <div ref={stageRefs.shipping} className="scroll-mt-24 mb-16 md:mb-24">
            <MagazineDivider variant="numbered" number="STAGE 05" className="mb-8" />
            <div className={`grid grid-cols-12 gap-6 md:gap-8 p-6 md:p-8 rounded-sm ${STAGE_COLORS.shipping} opacity-60`}>
              <div className="col-span-12 md:col-span-5">
                <EditorialCard
                  title={t('supplyChain.shippingTitle', 'Shipping')}
                  subtitle={t('supplyChain.awaitingShipment', 'Awaiting Shipment')}
                  className="h-full"
                >
                  <div className="space-y-0 mb-4">
                    <DataField
                      label={t('supplyChain.fieldLogisticsCompany', 'Logistics Company')}
                      value={SHIPPING_DATA.company}
                    />
                    <DataField
                      label={t('supplyChain.fieldShippingMethod', 'Shipping Method')}
                      value={SHIPPING_DATA.method}
                    />
                    <DataField
                      label={t('supplyChain.fieldEstimatedArrival', 'Est. Arrival')}
                      value={SHIPPING_DATA.estimatedArrival}
                    />
                    <DataField
                      label={t('supplyChain.fieldTrackingId', 'Tracking ID')}
                      value={SHIPPING_DATA.trackingId}
                    />
                  </div>
                </EditorialCard>
              </div>
              <div className="col-span-12 md:col-span-7">
                <motion.div
                  initial={prefersReducedMotion ? false : { opacity: 0, y: 20 }}
                  whileInView={prefersReducedMotion ? {} : { opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6 }}
                  className="bg-paper border-2 border-rust/10 rounded-sm p-6"
                >
                  <h4 className="font-display text-base font-semibold text-ink/40 mb-4">
                    {t('supplyChain.trackingTitle', 'Logistics Tracking')}
                  </h4>
                  {/* Grayed-out placeholder timeline */}
                  <div className="relative pl-6 mt-4">
                    <div className="absolute left-[9px] top-2 bottom-2 w-px bg-rust/10" aria-hidden="true" />
                    {SHIPPING_DATA.nodes.map((node, i) => (
                      <div key={i} className="relative flex items-start mb-5 last:mb-0">
                        <div
                          className="absolute left-[-15px] top-1 w-[10px] h-[10px] rounded-full border-2 bg-aged-stock border-rust/15"
                          aria-hidden="true"
                        />
                        <div className="ml-2">
                          <span className="font-body text-sm text-ink/30 block">{node.location}</span>
                          <span className="font-body text-caption text-sepia-mid/30">{node.date}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-6 text-center py-4 bg-aged-stock/40 rounded-sm">
                    <span className="font-body text-sm text-sepia-mid">
                      {t('supplyChain.shippingPendingNotice', 'Tracking details will appear once the order ships')}
                    </span>
                  </div>
                </motion.div>
              </div>
            </div>
          </div>
        </SectionContainer>

        <MagazineDivider variant="decorative" className="my-12 md:my-20" />

        {/* ════════════════════════════════════════════════════════════════
            Section 03 — Carbon Footprint Summary
        ════════════════════════════════════════════════════════════════ */}
        <SectionContainer className="pb-20 md:pb-28">
          <NumberedSectionHeading
            number="03"
            title={t('supplyChain.carbonTitle', 'Carbon Footprint Summary')}
            subtitle={t('supplyChain.carbonSubtitle', 'Lifecycle emissions comparison: conventional vs sustainable supply chain')}
          />

          <motion.div
            ref={carbonRef}
            initial={prefersReducedMotion ? false : { opacity: 0, y: 30 }}
            animate={carbonVisible ? { opacity: 1, y: 0 } : {}}
            transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.7, ease: [0, 0, 0.2, 1] }}
            className="grid grid-cols-12 gap-6 md:gap-8"
          >
            {/* Per-stage comparison */}
            <div className="col-span-12 md:col-span-8">
              <div className="bg-paper border-2 border-rust/20 rounded-sm p-6 md:p-8">
                <h3 className="font-display text-lg font-semibold text-ink mb-6">
                  {t('supplyChain.carbonByStage', 'Per-stage emissions comparison')}
                </h3>
                <CarbonComparisonBar
                  label={t('supplyChain.stage1', 'Material Sourcing')}
                  conventional={CARBON_COMPARISON.conventional.material}
                  sustainable={CARBON_COMPARISON.sustainable.material}
                  maxValue={5000}
                  conventionalShortLabel={t('supplyChain.conventionalShortLabel', 'Conv.')}
                  sustainableShortLabel={t('supplyChain.sustainableShortLabel', 'Sust.')}
                />
                <CarbonComparisonBar
                  label={t('supplyChain.stage2', 'Processing')}
                  conventional={CARBON_COMPARISON.conventional.processing}
                  sustainable={CARBON_COMPARISON.sustainable.processing}
                  maxValue={5000}
                  conventionalShortLabel={t('supplyChain.conventionalShortLabel', 'Conv.')}
                  sustainableShortLabel={t('supplyChain.sustainableShortLabel', 'Sust.')}
                />
                <CarbonComparisonBar
                  label={t('supplyChain.stage3', 'Manufacturing')}
                  conventional={CARBON_COMPARISON.conventional.manufacturing}
                  sustainable={CARBON_COMPARISON.sustainable.manufacturing}
                  maxValue={5000}
                  conventionalShortLabel={t('supplyChain.conventionalShortLabel', 'Conv.')}
                  sustainableShortLabel={t('supplyChain.sustainableShortLabel', 'Sust.')}
                />
                <CarbonComparisonBar
                  label={t('supplyChain.stage4', 'Quality Check')}
                  conventional={CARBON_COMPARISON.conventional.quality}
                  sustainable={CARBON_COMPARISON.sustainable.quality}
                  maxValue={5000}
                  conventionalShortLabel={t('supplyChain.conventionalShortLabel', 'Conv.')}
                  sustainableShortLabel={t('supplyChain.sustainableShortLabel', 'Sust.')}
                />
                <CarbonComparisonBar
                  label={t('supplyChain.stage5', 'Shipping')}
                  conventional={CARBON_COMPARISON.conventional.shipping}
                  sustainable={CARBON_COMPARISON.sustainable.shipping}
                  maxValue={5000}
                  conventionalShortLabel={t('supplyChain.conventionalShortLabel', 'Conv.')}
                  sustainableShortLabel={t('supplyChain.sustainableShortLabel', 'Sust.')}
                />
                {/* Legend */}
                <div className="flex items-center gap-6 mt-6 pt-4 border-t border-rust/10">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-ink/40 rounded-full" />
                    <span className="font-body text-caption text-sepia-mid">
                      {t('supplyChain.conventionalLabel', 'Conventional Supply Chain')}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-rust/70 rounded-full" />
                    <span className="font-body text-caption text-rust">
                      {t('supplyChain.sustainableLabel', 'Sustainable Supply Chain')}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Summary card */}
            <div className="col-span-12 md:col-span-4 flex flex-col gap-6">
              {/* Total comparison */}
              <div className="bg-paper border-2 border-rust/20 rounded-sm p-6 text-center flex-1 flex flex-col justify-center">
                <span className="font-body text-caption text-sepia-mid tracking-wide block mb-2">
                  {t('supplyChain.totalConventional', 'Total Emissions, Conventional')}
                </span>
                <span className="font-display text-2xl text-ink/50 line-through block">
                  {CARBON_COMPARISON.conventional.total.toLocaleString()} kg
                </span>
                <div className="w-8 h-px bg-rust/30 mx-auto my-4" aria-hidden="true" />
                <span className="font-body text-caption text-sepia-mid tracking-wide block mb-2">
                  {t('supplyChain.totalSustainable', 'Total Emissions, Sustainable')}
                </span>
                <span className="font-display text-3xl font-bold text-rust block">
                  {CARBON_COMPARISON.sustainable.total.toLocaleString()} kg
                </span>
              </div>

              {/* Reduction percentage */}
              <motion.div
                initial={prefersReducedMotion ? false : { opacity: 0, scale: 0.9 }}
                whileInView={prefersReducedMotion ? {} : { opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="bg-aged-stock border-2 border-rust/30 rounded-sm p-6 text-center"
              >
                <ImpactCounter
                  value={CARBON_REDUCTION_PERCENT}
                  label={t('supplyChain.carbonReduction', 'Carbon Reduction')}
                  suffix="%"
                  prefix="−"
                />
                <p className="font-body text-caption text-sepia-mid mt-4 leading-relaxed">
                  {t(
                    'supplyChain.carbonNote',
                    'Sustainable operations reduce emissions meaningfully at every production stage'
                  )}
                </p>
              </motion.div>
            </div>
          </motion.div>
        </SectionContainer>
      </PaperTextureBackground>
    </PageWrapper>
  );
}
