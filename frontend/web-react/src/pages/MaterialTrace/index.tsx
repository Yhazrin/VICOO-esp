import { useState, useRef } from 'react';
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

const MOCK_PRODUCTS = [
  { id: 'TH-2026-0421', name: '童趣星空连衣裙', batch: 'BAT-2026-A12', image: '/images/products/dress-01.jpg' },
  { id: 'TH-2026-0388', name: '彩虹涂鸦T恤', batch: 'BAT-2026-A09', image: '/images/products/tshirt-01.jpg' },
  { id: 'TH-2026-0356', name: '森林物语卫衣', batch: 'BAT-2026-A07', image: '/images/products/hoodie-01.jpg' },
];

const TIMELINE_DATA: TimelineNode[] = [
  {
    id: 'raw',
    stage: '原料来源',
    stageEn: 'Raw Material Source',
    status: 'verified',
    statusLabel: '已验证 Verified',
    date: '2025-12-15',
    details: {
      '来源地': '新疆阿克苏有机棉花基地',
      '品种': '长绒棉 (Long-staple cotton)',
      '认证': 'GOTS有机认证',
      '采购日期': '2025-12-15',
      'GPS坐标': '41.1684\u00b0N, 80.2636\u00b0E',
    },
  },
  {
    id: 'fabric',
    stage: '面料加工',
    stageEn: 'Fabric Processing',
    status: 'verified',
    statusLabel: '已验证 Verified',
    date: '2026-01-08',
    details: {
      '工厂': '山东德州纺织有限公司',
      '工序': '纺纱 \u2192 织布 \u2192 染整',
      '完成日期': '2026-01-08',
    },
  },
  {
    id: 'garment',
    stage: '成衣制造',
    stageEn: 'Garment Manufacturing',
    status: 'verified',
    statusLabel: '已验证 Verified',
    date: '2026-01-22',
    details: {
      '工厂': '广州花都服装制造有限公司',
      '批次号': 'MFG-2026-0142',
      '工人保障': 'SA8000认证',
      '完成日期': '2026-01-22',
    },
  },
  {
    id: 'inspection',
    stage: '质量检测',
    stageEn: 'Quality Inspection',
    status: 'verified',
    statusLabel: '已验证 Verified',
    date: '2026-01-28',
    details: {
      '机构': 'SGS通标标准技术服务',
      '报告编号': 'SGS-2026-TH-0089',
      '检测结果': '全项合格',
      '检测日期': '2026-01-28',
    },
  },
  {
    id: 'logistics',
    stage: '物流配送',
    stageEn: 'Logistics & Delivery',
    status: 'in-progress',
    statusLabel: '进行中 In Progress',
    date: '2026-02-05',
    details: {
      '物流': '顺丰速运',
      '单号': 'SF1234567890',
      '绿色物流': '是 \u2713',
      '预计到达': '2026-02-05',
    },
  },
];

const CARBON_DATA = [
  { stage: '原料采购', co2: 2.1, color: 'bg-sage' },
  { stage: '加工处理', co2: 3.4, color: 'bg-rust' },
  { stage: '成衣制造', co2: 1.8, color: 'bg-sepia-mid' },
  { stage: '质检运输', co2: 0.5, color: 'bg-ink/60' },
  { stage: '物流配送', co2: 0.4, color: 'bg-sage/70' },
];

const CARBON_TOTAL = 8.2;
const CARBON_TRADITIONAL = 33.4;

const CERTIFICATIONS = ['GOTS', 'Fair Trade', 'SA8000', 'BSCI'];

/* ------------------------------------------------------------------ */
/*  Timeline Node Component                                            */
/* ------------------------------------------------------------------ */

function TimelineNodeCard({ node, index }: { node: TimelineNode; index: number }) {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(index === 0);
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-60px' });
  const prefersReducedMotion = useReducedMotion();

  const dotColor =
    node.status === 'verified'
      ? 'bg-sage border-sage/40'
      : node.status === 'in-progress'
        ? 'bg-amber-500 border-amber-400/40'
        : 'bg-warm-gray border-warm-gray/40';

  const badgeColor =
    node.status === 'verified'
      ? 'bg-sage/10 text-sage border-sage/30'
      : node.status === 'in-progress'
        ? 'bg-amber-50 text-amber-700 border-amber-300/40'
        : 'bg-gray-50 text-gray-500 border-gray-200';

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

  const carbonRef = useRef<HTMLDivElement>(null);
  const carbonInView = useInView(carbonRef, { once: true, margin: '-40px' });

  const maxCo2 = Math.max(...CARBON_DATA.map((d) => d.co2));
  const reductionPercent = (((CARBON_TRADITIONAL - CARBON_TOTAL) / CARBON_TRADITIONAL) * 100).toFixed(1);

  return (
    <PageWrapper>
      <PaperTextureBackground variant="paper">
        <GrainOverlay />

      {/* ============================================================ */}
      {/*  Section 01 - Product Trace Lookup                           */}
      {/* ============================================================ */}
      <SectionContainer className="pt-24 md:pt-32">
        <NumberedSectionHeading
          number="01"
          title={t('materialTrace.lookup.title', '商品溯源查询')}
          subtitle={t('materialTrace.lookup.subtitle', '输入商品编号或扫描二维码，查看完整的供应链溯源信息')}
        />

        {/* Search Row */}
        <div className="grid grid-cols-12 gap-6 mb-12">
          <div className="col-span-12 md:col-span-8 lg:col-span-6">
            <div className="flex items-end gap-3">
              <div className="flex-1">
                <VintageInput
                  icon="search"
                  placeholder={t('materialTrace.lookup.placeholder', '输入商品编号 e.g. TH-2026-0421')}
                  value={searchId}
                  onChange={(e) => setSearchId((e.target as HTMLInputElement).value)}
                  label={t('materialTrace.lookup.inputLabel', '商品编号 / QR Code')}
                />
              </div>
              <button
                type="button"
                className="flex items-center justify-center w-12 h-12 border-2 border-rust/30 bg-paper text-rust hover:bg-rust hover:text-paper transition-colors duration-300 flex-shrink-0"
                aria-label={t('materialTrace.lookup.search', '搜索')}
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>
            </div>
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
                onClick={() => setActiveProduct(product.id)}
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
          title={t('materialTrace.timeline.title', '溯源时间线')}
          subtitle={t('materialTrace.timeline.subtitle', '从棉花田到您手中 -- 每一步都经过验证的透明供应链')}
        />

        <div className="grid grid-cols-12 gap-8">
          {/* Left decorative info */}
          <div className="col-span-12 lg:col-span-3 hidden lg:block">
            <div className="sticky top-32 space-y-6">
              <SepiaImageFrame
                src="/images/supply-chain/cotton-field.jpg"
                alt={t('materialTrace.timeline.cottonAlt', '有机棉花基地')}
                aspectRatio="portrait"
                size="full"
                caption={t('materialTrace.timeline.cottonCaption', '新疆阿克苏 -- 有机棉花基地')}
              />
              <div className="bg-sage/10 border border-sage/20 p-4">
                <p className="font-display text-sm font-semibold text-sage mb-1">
                  {t('materialTrace.timeline.activeId', '当前追溯')}
                </p>
                <p className="font-body text-body-sm text-ink">{activeProduct}</p>
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

            {TIMELINE_DATA.map((node, idx) => (
              <TimelineNodeCard key={node.id} node={node} index={idx} />
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
          title={t('materialTrace.integrity.title', '数据可信度')}
          subtitle={t('materialTrace.integrity.subtitle', 'Append-only 时间线架构确保溯源数据真实可靠、不可篡改')}
        />

        <div className="grid grid-cols-12 gap-6 mb-12">
          {/* Explanation card */}
          <div className="col-span-12 lg:col-span-7">
            <div className="bg-paper border-2 border-rust/30 p-6 md:p-8 relative">
              <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-rust/30" aria-hidden="true" />
              <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-rust/30" aria-hidden="true" />

              <h3 className="font-display text-lg font-semibold text-ink mb-3">
                Append-only {t('materialTrace.integrity.timelineArch', '时间线架构')}
              </h3>
              <p className="font-body text-body-sm text-ink/80 leading-relaxed mb-4">
                {t(
                  'materialTrace.integrity.explanation',
                  '所有供应链记录采用追加写入模式，一旦写入即不可修改或删除。每条记录都包含时间戳与验证签名，确保数据的完整性与可追溯性。'
                )}
              </p>
              <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-sage/10 border border-sage/30 rounded-sm text-sage font-body text-xs tracking-wider">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                {t('materialTrace.integrity.verifiedOnly', '仅公开 Verified 记录')}
              </span>
            </div>
          </div>

          {/* Trust indicators */}
          <div className="col-span-12 lg:col-span-5 space-y-4">
            {([
              { icon: 'lock' as const, title: '不可篡改', titleEn: 'Immutable', desc: '数据一旦上链即无法修改' },
              { icon: 'shield' as const, title: '第三方验证', titleEn: 'Third-party Verified', desc: '由SGS等国际机构独立验证' },
              { icon: 'refresh' as const, title: '实时更新', titleEn: 'Real-time Updates', desc: '供应链状态同步更新' },
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
            {t('materialTrace.integrity.certifications', '认证体系')}
          </span>
          {CERTIFICATIONS.map((cert) => (
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
          title={t('materialTrace.carbon.title', '碳足迹追踪')}
          subtitle={t('materialTrace.carbon.subtitle', '从原材料到成品的全链路碳排放追踪与对比')}
        />

        <div ref={carbonRef} className="grid grid-cols-12 gap-8">
          {/* Bar chart */}
          <div className="col-span-12 lg:col-span-8 space-y-5">
            {CARBON_DATA.map((item, idx) => (
              <motion.div
                key={item.stage}
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
                  {t('materialTrace.carbon.total', '总计')}
                </span>
                <span className="font-display text-lg font-bold text-rust">
                  {CARBON_TOTAL} kg CO\u2082
                </span>
              </div>
              <div className="flex justify-between items-baseline">
                <span className="font-body text-caption text-sepia-mid">
                  {t('materialTrace.carbon.traditional', '传统模式')}
                </span>
                <span className="font-body text-caption text-sepia-mid line-through">
                  {CARBON_TRADITIONAL} kg CO\u2082
                </span>
              </div>
            </div>
          </div>

          {/* Reduction badge */}
          <div className="col-span-12 lg:col-span-4 flex items-start justify-center lg:justify-start">
            <motion.div
              initial={prefersReducedMotion ? false : { opacity: 0, scale: 0.9 }}
              animate={carbonInView ? { opacity: 1, scale: 1 } : {}}
              transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.6, delay: 0.5 }}
              className="bg-sage/10 border-2 border-sage/30 p-6 md:p-8 text-center w-full max-w-xs"
            >
              <p className="font-body text-overline text-sage tracking-[0.2em] uppercase mb-2">
                {t('materialTrace.carbon.reduction', '碳排放降低')}
              </p>
              <p className="font-display text-5xl md:text-6xl font-bold text-sage leading-none mb-2">
                -{reductionPercent}%
              </p>
              <p className="font-body text-caption text-ink/60">
                {t('materialTrace.carbon.vsTraditional', '对比传统供应链模式')}
              </p>

              <div className="mt-6 pt-4 border-t border-sage/20 space-y-2">
                <div className="flex justify-between font-body text-xs text-ink/70">
                  <span>{t('materialTrace.carbon.sustainable', '可持续')}</span>
                  <span className="font-semibold text-sage">{CARBON_TOTAL} kg</span>
                </div>
                <div className="flex justify-between font-body text-xs text-ink/70">
                  <span>{t('materialTrace.carbon.traditional', '传统模式')}</span>
                  <span className="line-through">{CARBON_TRADITIONAL} kg</span>
                </div>
                <div className="flex justify-between font-body text-xs text-ink/70">
                  <span>{t('materialTrace.carbon.saved', '节省')}</span>
                  <span className="font-semibold text-sage">{(CARBON_TRADITIONAL - CARBON_TOTAL).toFixed(1)} kg</span>
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
