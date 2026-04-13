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
  origin: '新疆阿克苏地区',
  volume: '200吨',
  unitPrice: '¥18,500/吨',
  certifications: ['SA8000', 'BSCI', 'GOTS'],
  carbonEstimate: '1,200 kg CO₂e',
  supplier: '绿源有机棉合作社',
};

const PROCESSING_DATA = {
  factory: '苏州恒通纺织有限公司',
  steps: [
    { name: '纺纱', progress: 100 },
    { name: '染整', progress: 100 },
    { name: '面料加工', progress: 100 },
  ],
  transportDistance: '320 km',
  carbonEstimate: '860 kg CO₂e',
};

const MANUFACTURING_DATA = {
  factory: '广州锦华成衣工厂',
  batchId: 'MFG-2026-0312',
  workerCount: 156,
  greenLogistics: true,
  productionDate: '2026-03-01',
  capacity: '5,000件/月',
};

const QUALITY_DATA = {
  institution: 'SGS通标标准技术服务',
  items: [
    { name: '色牢度', rate: 99.2, status: 'completed' as const },
    { name: '缩水率', rate: 98.8, status: 'completed' as const },
    { name: '甲醛含量', rate: 100, status: 'completed' as const },
    { name: '偶氮染料', rate: null, status: 'pending' as const },
    { name: 'pH值', rate: null, status: 'pending' as const },
  ],
  overallRate: null,
  reportId: 'SGS-QC-2026-04518',
  statusLabel: '检测进行中',
};

const SHIPPING_DATA = {
  company: '顺丰速运',
  method: '陆运 + 同城配送',
  estimatedArrival: '待定',
  trackingId: '待发货',
  greenLogistics: true,
  nodes: [
    { location: '广州仓库', date: '--', status: 'pending' as const },
    { location: '长沙中转', date: '--', status: 'pending' as const },
    { location: '上海分拨中心', date: '--', status: 'pending' as const },
    { location: '目的地门店', date: '--', status: 'pending' as const },
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

function QualityBar({ name, rate, status }: { name: string; rate: number | null; status: 'completed' | 'pending' }) {
  if (status === 'pending') {
    return (
      <div className="mb-3 last:mb-0">
        <div className="flex justify-between items-center mb-1">
          <span className="font-body text-caption text-ink/40">{name}</span>
          <span className="font-body text-caption text-sepia-mid/50">待检测</span>
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
}: {
  label: string;
  conventional: number;
  sustainable: number;
  maxValue: number;
}) {
  return (
    <div className="mb-4 last:mb-0">
      <span className="font-body text-caption text-ink mb-2 block">{label}</span>
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <span className="font-body text-[10px] text-sepia-mid w-12 shrink-0">传统</span>
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
          <span className="font-body text-[10px] text-rust w-12 shrink-0">可持续</span>
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
    { label: t('supplyChain.stage1', '原料采购'), sub: 'Material Sourcing' },
    { label: t('supplyChain.stage2', '加工处理'), sub: 'Processing' },
    { label: t('supplyChain.stage3', '成衣制造'), sub: 'Manufacturing' },
    { label: t('supplyChain.stage4', '质检'), sub: 'Quality Check' },
    { label: t('supplyChain.stage5', '物流发货'), sub: 'Shipping' },
  ];

  return (
    <PageWrapper>
      <PaperTextureBackground variant="paper">
        <GrainOverlay />

        {/* ── 示例数据 disclaimer ── */}
        <div className="mx-auto max-w-5xl px-4 pt-6">
          <div className="flex items-center gap-2 rounded-sm border border-rust/20 bg-aged-stock/60 px-4 py-2">
            <svg className="h-4 w-4 shrink-0 text-sepia-mid" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <span className="text-sepia-mid text-xs">
              示例数据 — 当前展示为示例数据，正式环境将对接真实供应链管理系统
            </span>
          </div>
        </div>

        {/* ════════════════════════════════════════════════════════════════
            Section 01 — 供应链总览 Supply Chain Overview
        ════════════════════════════════════════════════════════════════ */}
        <SectionContainer className="pt-20 md:pt-28">
          <NumberedSectionHeading
            number="01"
            title={t('supplyChain.overviewTitle', '供应链总览')}
            subtitle={t('supplyChain.overviewSubtitle', '从棉花田到商品上架，每一步皆可追溯')}
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
                  {t('supplyChain.designDraft', '商品化设计稿')}
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
                  {t('supplyChain.productCatalog', '商品上架')}
                </span>
              </div>
            </div>
          </motion.div>

          {/* Overview Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
            <ImpactCounter
              value={OVERVIEW_STATS.totalBatches}
              label={t('supplyChain.totalBatches', '总原料批次')}
              suffix="+"
            />
            <ImpactCounter
              value={OVERVIEW_STATS.partnerFactories}
              label={t('supplyChain.partnerFactories', '合作工厂')}
              suffix={t('supplyChain.factorySuffix', '家')}
            />
            <ImpactCounter
              value={OVERVIEW_STATS.qcPassRate}
              label={t('supplyChain.qcPassRate', '质检通过率')}
              suffix="%"
            />
            <ImpactCounter
              value={OVERVIEW_STATS.carbonSaved}
              label={t('supplyChain.carbonSaved', '碳排放节约')}
              suffix=" kg"
              prefix="−"
            />
          </div>
        </SectionContainer>

        <MagazineDivider variant="decorative" className="my-12 md:my-20" />

        {/* ════════════════════════════════════════════════════════════════
            Section 02 — 五阶段详情 5-Stage Details
        ════════════════════════════════════════════════════════════════ */}
        <SectionContainer>
          <NumberedSectionHeading
            number="02"
            title={t('supplyChain.stageDetailsTitle', '五阶段详情')}
            subtitle={t('supplyChain.stageDetailsSubtitle', '供应链每个环节的详细记录与数据')}
          />

          {/* ── Stage 1: 原料采购 ── */}
          <div ref={stageRefs.material} className="scroll-mt-24 mb-16 md:mb-24">
            <MagazineDivider variant="numbered" number="STAGE 01" className="mb-8" />
            <div className={`grid grid-cols-12 gap-6 md:gap-8 p-6 md:p-8 rounded-sm ${STAGE_COLORS.material}`}>
              {/* Left: Image + Info */}
              <div className="col-span-12 md:col-span-5">
                <SepiaImageFrame
                  src={placeholderImage('有机棉花基地', { hue: 45, width: 600, height: 400 })}
                  alt={t('supplyChain.materialImageAlt', '新疆有机棉花田')}
                  caption={t('supplyChain.materialCaption', '新疆阿克苏有机棉种植基地')}
                  aspectRatio="landscape"
                  size="full"
                />
              </div>
              {/* Right: Data */}
              <div className="col-span-12 md:col-span-7">
                <EditorialCard
                  title={t('supplyChain.materialTitle', '原料采购 Material Sourcing')}
                  subtitle={t('supplyChain.materialSubtitle', '新疆有机棉 · 200吨采购量')}
                  className="h-full"
                >
                  <div className="space-y-0">
                    <DataField
                      label={t('supplyChain.fieldOrigin', '来源地')}
                      value={MATERIAL_DATA.origin}
                    />
                    <DataField
                      label={t('supplyChain.fieldVolume', '采购量(吨)')}
                      value={MATERIAL_DATA.volume}
                    />
                    <DataField
                      label={t('supplyChain.fieldUnitPrice', '采购单价')}
                      value={MATERIAL_DATA.unitPrice}
                    />
                    <DataField
                      label={t('supplyChain.fieldSupplier', '供应商')}
                      value={MATERIAL_DATA.supplier}
                    />
                    <DataField
                      label={t('supplyChain.fieldCarbon', '碳估算')}
                      value={MATERIAL_DATA.carbonEstimate}
                      accent
                    />
                    <div className="pt-3">
                      <span className="font-body text-caption text-sepia-mid block mb-2">
                        {t('supplyChain.fieldCerts', '供应商认证')}
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

          {/* ── Stage 2: 加工处理 ── */}
          <div ref={stageRefs.processing} className="scroll-mt-24 mb-16 md:mb-24">
            <MagazineDivider variant="numbered" number="STAGE 02" className="mb-8" />
            <div className={`grid grid-cols-12 gap-6 md:gap-8 p-6 md:p-8 rounded-sm ${STAGE_COLORS.processing}`}>
              <div className="col-span-12 md:col-span-7">
                <EditorialCard
                  title={t('supplyChain.processingTitle', '加工处理 Processing')}
                  subtitle={t('supplyChain.processingSubtitle', '纺纱 → 染整 → 面料加工')}
                  className="h-full"
                >
                  <div className="space-y-0 mb-6">
                    <DataField
                      label={t('supplyChain.fieldFactory', '加工厂名称')}
                      value={PROCESSING_DATA.factory}
                    />
                    <DataField
                      label={t('supplyChain.fieldTransport', '运输距离')}
                      value={PROCESSING_DATA.transportDistance}
                    />
                    <DataField
                      label={t('supplyChain.fieldCarbon', '碳排放估算')}
                      value={PROCESSING_DATA.carbonEstimate}
                      accent
                    />
                  </div>
                  <div>
                    <span className="font-body text-caption text-sepia-mid block mb-3">
                      {t('supplyChain.processingSteps', '加工工序进度')}
                    </span>
                    {PROCESSING_DATA.steps.map((step) => (
                      <ProgressBar key={step.name} label={step.name} progress={step.progress} />
                    ))}
                  </div>
                </EditorialCard>
              </div>
              <div className="col-span-12 md:col-span-5">
                <SepiaImageFrame
                  src={placeholderImage('纺纱染整车间', { hue: 30, width: 600, height: 400 })}
                  alt={t('supplyChain.processingImageAlt', '纺织加工车间')}
                  caption={t('supplyChain.processingCaption', '苏州恒通纺织加工车间')}
                  aspectRatio="landscape"
                  size="full"
                />
              </div>
            </div>
          </div>

          {/* ── Stage 3: 成衣制造 ── */}
          <div ref={stageRefs.manufacturing} className="scroll-mt-24 mb-16 md:mb-24">
            <MagazineDivider variant="numbered" number="STAGE 03" className="mb-8" />
            <div className={`grid grid-cols-12 gap-6 md:gap-8 p-6 md:p-8 rounded-sm ${STAGE_COLORS.manufacturing}`}>
              <div className="col-span-12 md:col-span-5">
                <SepiaImageFrame
                  src={placeholderImage('成衣制造工厂', { hue: 140, width: 600, height: 400 })}
                  alt={t('supplyChain.manufacturingImageAlt', '广州成衣工厂')}
                  caption={t('supplyChain.manufacturingCaption', '广州锦华成衣生产线')}
                  aspectRatio="landscape"
                  size="full"
                />
              </div>
              <div className="col-span-12 md:col-span-7">
                <EditorialCard
                  title={t('supplyChain.manufacturingTitle', '成衣制造 Manufacturing')}
                  subtitle={t('supplyChain.manufacturingSubtitle', '广州锦华成衣工厂')}
                  className="h-full"
                >
                  <div className="space-y-0">
                    <DataField
                      label={t('supplyChain.fieldFactory', '工厂名称')}
                      value={MANUFACTURING_DATA.factory}
                    />
                    <DataField
                      label={t('supplyChain.fieldBatchId', '生产批次')}
                      value={MANUFACTURING_DATA.batchId}
                    />
                    <DataField
                      label={t('supplyChain.fieldWorkers', '工人数量')}
                      value={`${MANUFACTURING_DATA.workerCount} 人`}
                    />
                    <DataField
                      label={t('supplyChain.fieldCapacity', '月产能')}
                      value={MANUFACTURING_DATA.capacity}
                    />
                    <DataField
                      label={t('supplyChain.fieldProductionDate', '生产日期')}
                      value={MANUFACTURING_DATA.productionDate}
                    />
                    <div className="pt-3 flex items-center gap-2">
                      {MANUFACTURING_DATA.greenLogistics && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-[#D4E8D4]/40 border border-[#6BAF6B]/30 rounded-sm">
                          <span className="w-2 h-2 bg-[#6BAF6B] rounded-full" aria-hidden="true" />
                          <span className="font-body text-[10px] text-[#4A8B4A]">
                            {t('supplyChain.greenLogistics', '绿色物流标识')}
                          </span>
                        </span>
                      )}
                    </div>
                  </div>
                </EditorialCard>
              </div>
            </div>
          </div>

          {/* ── Stage 4: 质检 ── */}
          <div ref={stageRefs.quality} className="scroll-mt-24 mb-16 md:mb-24">
            <MagazineDivider variant="numbered" number="STAGE 04" className="mb-8" />
            <div className={`grid grid-cols-12 gap-6 md:gap-8 p-6 md:p-8 rounded-sm ${STAGE_COLORS.quality}`}>
              <div className="col-span-12 md:col-span-7">
                <EditorialCard
                  title={t('supplyChain.qualityTitle', '质检 Quality Check')}
                  subtitle={`SGS · ${QUALITY_DATA.statusLabel}`}
                  className="h-full"
                >
                  <div className="space-y-0 mb-6">
                    <DataField
                      label={t('supplyChain.fieldQcInstitution', '质检机构')}
                      value={QUALITY_DATA.institution}
                    />
                    <DataField
                      label={t('supplyChain.fieldQcReport', '质检报告编号')}
                      value={QUALITY_DATA.reportId}
                    />
                    <DataField
                      label={t('supplyChain.fieldQcRate', '综合合格率')}
                      value={QUALITY_DATA.statusLabel}
                      accent
                    />
                    <DataField
                      label={t('supplyChain.fieldQcProgress', '检测进度')}
                      value={`3 / 5 项已完成`}
                    />
                  </div>
                  <div>
                    <span className="font-body text-caption text-sepia-mid block mb-3">
                      {t('supplyChain.qualityItems', '检测项目明细')}
                    </span>
                    {QUALITY_DATA.items.map((item) => (
                      <QualityBar key={item.name} name={item.name} rate={item.rate} status={item.status} />
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
                    检测中
                  </div>
                  <div className="font-body text-caption text-sepia-mid mt-3 tracking-wide">
                    {t('supplyChain.qcInProgress', '质检进行中 · 3/5 项完成')}
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
                        {item.name} {item.status === 'completed' ? `${item.rate}%` : '待检测'}
                      </span>
                    ))}
                  </div>
                </motion.div>
              </div>
            </div>
          </div>

          {/* ── Stage 5: 物流发货 ── */}
          <div ref={stageRefs.shipping} className="scroll-mt-24 mb-16 md:mb-24">
            <MagazineDivider variant="numbered" number="STAGE 05" className="mb-8" />
            <div className={`grid grid-cols-12 gap-6 md:gap-8 p-6 md:p-8 rounded-sm ${STAGE_COLORS.shipping} opacity-60`}>
              <div className="col-span-12 md:col-span-5">
                <EditorialCard
                  title={t('supplyChain.shippingTitle', '物流发货 Shipping')}
                  subtitle={t('supplyChain.awaitingShipment', '待发货')}
                  className="h-full"
                >
                  <div className="space-y-0 mb-4">
                    <DataField
                      label={t('supplyChain.fieldLogisticsCompany', '物流公司')}
                      value={SHIPPING_DATA.company}
                    />
                    <DataField
                      label={t('supplyChain.fieldShippingMethod', '运输方式')}
                      value={SHIPPING_DATA.method}
                    />
                    <DataField
                      label={t('supplyChain.fieldEstimatedArrival', '预计到达')}
                      value={SHIPPING_DATA.estimatedArrival}
                    />
                    <DataField
                      label={t('supplyChain.fieldTrackingId', '物流追踪号')}
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
                    {t('supplyChain.trackingTitle', '物流追踪')}
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
                      物流信息将在发货后更新
                    </span>
                  </div>
                </motion.div>
              </div>
            </div>
          </div>
        </SectionContainer>

        <MagazineDivider variant="decorative" className="my-12 md:my-20" />

        {/* ════════════════════════════════════════════════════════════════
            Section 03 — 碳足迹汇总 Carbon Footprint Summary
        ════════════════════════════════════════════════════════════════ */}
        <SectionContainer className="pb-20 md:pb-28">
          <NumberedSectionHeading
            number="03"
            title={t('supplyChain.carbonTitle', '碳足迹汇总')}
            subtitle={t('supplyChain.carbonSubtitle', '全链路碳排放对比：传统供应链 vs 可持续供应链')}
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
                  {t('supplyChain.carbonByStage', '各阶段碳排放对比')}
                </h3>
                <CarbonComparisonBar
                  label={t('supplyChain.stage1', '原料采购')}
                  conventional={CARBON_COMPARISON.conventional.material}
                  sustainable={CARBON_COMPARISON.sustainable.material}
                  maxValue={5000}
                />
                <CarbonComparisonBar
                  label={t('supplyChain.stage2', '加工处理')}
                  conventional={CARBON_COMPARISON.conventional.processing}
                  sustainable={CARBON_COMPARISON.sustainable.processing}
                  maxValue={5000}
                />
                <CarbonComparisonBar
                  label={t('supplyChain.stage3', '成衣制造')}
                  conventional={CARBON_COMPARISON.conventional.manufacturing}
                  sustainable={CARBON_COMPARISON.sustainable.manufacturing}
                  maxValue={5000}
                />
                <CarbonComparisonBar
                  label={t('supplyChain.stage4', '质检')}
                  conventional={CARBON_COMPARISON.conventional.quality}
                  sustainable={CARBON_COMPARISON.sustainable.quality}
                  maxValue={5000}
                />
                <CarbonComparisonBar
                  label={t('supplyChain.stage5', '物流发货')}
                  conventional={CARBON_COMPARISON.conventional.shipping}
                  sustainable={CARBON_COMPARISON.sustainable.shipping}
                  maxValue={5000}
                />
                {/* Legend */}
                <div className="flex items-center gap-6 mt-6 pt-4 border-t border-rust/10">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-ink/40 rounded-full" />
                    <span className="font-body text-caption text-sepia-mid">
                      {t('supplyChain.conventionalLabel', '传统供应链')}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-rust/70 rounded-full" />
                    <span className="font-body text-caption text-rust">
                      {t('supplyChain.sustainableLabel', '可持续供应链')}
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
                  {t('supplyChain.totalConventional', '传统供应链总排放')}
                </span>
                <span className="font-display text-2xl text-ink/50 line-through block">
                  {CARBON_COMPARISON.conventional.total.toLocaleString()} kg
                </span>
                <div className="w-8 h-px bg-rust/30 mx-auto my-4" aria-hidden="true" />
                <span className="font-body text-caption text-sepia-mid tracking-wide block mb-2">
                  {t('supplyChain.totalSustainable', '可持续供应链总排放')}
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
                  label={t('supplyChain.carbonReduction', '碳排放减少')}
                  suffix="%"
                  prefix="−"
                />
                <p className="font-body text-caption text-sepia-mid mt-4 leading-relaxed">
                  {t(
                    'supplyChain.carbonNote',
                    '通过可持续供应链管理，我们在每个生产环节实现了显著的碳减排'
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
