import { useState, useRef, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence, useInView, useReducedMotion } from 'framer-motion';
import PageWrapper from '@/components/layout/PageWrapper';
import SectionContainer from '@/components/layout/SectionContainer';
import NumberedSectionHeading from '@/components/editorial/NumberedSectionHeading';
import { EditorialCard } from '@/components/editorial/EditorialCard';
import SepiaImageFrame from '@/components/editorial/SepiaImageFrame';
import GrainOverlay from '@/components/animations/GrainOverlay';
import PaperTextureBackground from '@/components/editorial/PaperTextureBackground';
import { MagazineDivider } from '@/components/editorial/MagazineDivider';
import { VintageInput } from '@/components/editorial/VintageInput';
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

function createProductDatasets(isEnglish: boolean): ProductDataset[] {
  const verifiedLabel = isEnglish ? 'Verified' : '已验证 Verified';
  const inProgressLabel = isEnglish ? 'In Progress' : '进行中 In Progress';
  const pendingInspectionLabel = isEnglish ? 'Pending Inspection' : '待检测 Pending';
  const pendingShipmentLabel = isEnglish ? 'Pending Shipment' : '待发货 Pending';
  const yesLabel = isEnglish ? 'Yes ✓' : '是 ✓';
  const plannedLabel = isEnglish ? 'Planned' : '计划使用';
  const unassignedLabel = isEnglish ? 'Unassigned' : '待分配';

  return [
    {
      product: {
        id: 'TH-2026-001',
        name: isEnglish ? 'Playful Garden Tee' : '童趣花园T恤',
        batch: 'BAT-2026-A12',
        image: placeholderImage(isEnglish ? 'Playful Garden Tee' : '童趣花园T恤', { hue: 30 }),
      },
      timeline: [
        {
          id: 'raw',
          stage: isEnglish ? 'Raw Material Source' : '原料来源',
          stageEn: isEnglish ? '' : 'Raw Material Source',
          status: 'verified',
          statusLabel: verifiedLabel,
          date: '2025-12-15',
          details: isEnglish
            ? {
                Origin: 'Aksu Organic Cotton Base, Xinjiang',
                Fiber: 'Long-staple cotton',
                Certification: 'GOTS Organic',
                'Procurement Date': '2025-12-15',
                GPS: '41.1684°N, 80.2636°E',
              }
            : {
                来源地: '新疆阿克苏有机棉花基地',
                品种: '长绒棉 (Long-staple cotton)',
                认证: 'GOTS有机认证',
                采购日期: '2025-12-15',
                GPS坐标: '41.1684°N, 80.2636°E',
              },
        },
        {
          id: 'fabric',
          stage: isEnglish ? 'Fabric Processing' : '面料加工',
          stageEn: isEnglish ? '' : 'Fabric Processing',
          status: 'verified',
          statusLabel: verifiedLabel,
          date: '2026-01-08',
          details: isEnglish
            ? {
                Factory: 'Dezhou Textile Co., Shandong',
                Process: 'Spinning → Weaving → Dyeing',
                Completed: '2026-01-08',
              }
            : {
                工厂: '山东德州纺织有限公司',
                工序: '纺纱 → 织布 → 染整',
                完成日期: '2026-01-08',
              },
        },
        {
          id: 'garment',
          stage: isEnglish ? 'Garment Manufacturing' : '成衣制造',
          stageEn: isEnglish ? '' : 'Garment Manufacturing',
          status: 'verified',
          statusLabel: verifiedLabel,
          date: '2026-01-22',
          details: isEnglish
            ? {
                Factory: 'Huadu Garment Manufacturing Co., Guangzhou',
                'Batch ID': 'MFG-2026-0142',
                'Worker Welfare': 'SA8000 certified',
                Completed: '2026-01-22',
              }
            : {
                工厂: '广州花都服装制造有限公司',
                批次号: 'MFG-2026-0142',
                工人保障: 'SA8000认证',
                完成日期: '2026-01-22',
              },
        },
        {
          id: 'inspection',
          stage: isEnglish ? 'Quality Inspection' : '质量检测',
          stageEn: isEnglish ? '' : 'Quality Inspection',
          status: 'verified',
          statusLabel: verifiedLabel,
          date: '2026-01-28',
          details: isEnglish
            ? {
                Agency: 'SGS Standard Technical Services',
                'Report ID': 'SGS-2026-TH-0089',
                Result: 'All items passed',
                'Inspection Date': '2026-01-28',
              }
            : {
                机构: 'SGS通标标准技术服务',
                报告编号: 'SGS-2026-TH-0089',
                检测结果: '全项合格',
                检测日期: '2026-01-28',
              },
        },
        {
          id: 'logistics',
          stage: isEnglish ? 'Logistics & Delivery' : '物流配送',
          stageEn: isEnglish ? '' : 'Logistics & Delivery',
          status: 'verified',
          statusLabel: verifiedLabel,
          date: '2026-02-03',
          details: isEnglish
            ? {
                Logistics: 'SF Express',
                'Tracking No.': 'SF1234567890',
                'Green Logistics': yesLabel,
                Delivered: '2026-02-03',
              }
            : {
                物流: '顺丰速运',
                单号: 'SF1234567890',
                绿色物流: yesLabel,
                送达日期: '2026-02-03',
              },
        },
      ],
      carbonData: [
        { stage: isEnglish ? 'Raw Material Sourcing' : '原料采购', co2: 2.1, color: 'bg-sage' },
        { stage: isEnglish ? 'Fabric Processing' : '加工处理', co2: 3.4, color: 'bg-rust' },
        { stage: isEnglish ? 'Garment Manufacturing' : '成衣制造', co2: 1.8, color: 'bg-sepia-mid' },
        { stage: isEnglish ? 'Inspection & Transport' : '质检运输', co2: 0.5, color: 'bg-ink/60' },
        { stage: isEnglish ? 'Logistics Delivery' : '物流配送', co2: 0.4, color: 'bg-sage/70' },
      ],
      carbonTotal: 8.2,
      carbonTraditional: 33.4,
      certifications: ['GOTS', 'Fair Trade', 'SA8000', 'BSCI'],
    },
    {
      product: {
        id: 'TH-2026-002',
        name: isEnglish ? 'Starlit Dream Hoodie' : '星空梦想卫衣',
        batch: 'BAT-2026-B05',
        image: placeholderImage(isEnglish ? 'Starlit Dream Hoodie' : '星空梦想卫衣', { hue: 220 }),
      },
      timeline: [
        {
          id: 'raw',
          stage: isEnglish ? 'Raw Material Source' : '原料来源',
          stageEn: isEnglish ? '' : 'Raw Material Source',
          status: 'verified',
          statusLabel: verifiedLabel,
          date: '2025-11-20',
          details: isEnglish
            ? {
                Origin: 'Binzhou Organic Cotton Co-op, Shandong',
                Fiber: 'Upland cotton',
                Certification: 'OCS Organic Content Standard',
                'Procurement Date': '2025-11-20',
                GPS: '37.3826°N, 117.9711°E',
              }
            : {
                来源地: '山东滨州有机棉花合作社',
                品种: '细绒棉 (Upland cotton)',
                认证: 'OCS有机含量标准',
                采购日期: '2025-11-20',
                GPS坐标: '37.3826°N, 117.9711°E',
              },
        },
        {
          id: 'fabric',
          stage: isEnglish ? 'Fabric Processing' : '面料加工',
          stageEn: isEnglish ? '' : 'Fabric Processing',
          status: 'verified',
          statusLabel: verifiedLabel,
          date: '2025-12-18',
          details: isEnglish
            ? {
                Factory: 'Nantong Huafang Textile Group, Jiangsu',
                Process: 'Spinning → Knitting → Brushing → Dyeing',
                Completed: '2025-12-18',
              }
            : {
                工厂: '江苏南通华纺织业集团',
                工序: '纺纱 → 针织 → 起绒 → 染色',
                完成日期: '2025-12-18',
              },
        },
        {
          id: 'garment',
          stage: isEnglish ? 'Garment Manufacturing' : '成衣制造',
          stageEn: isEnglish ? '' : 'Garment Manufacturing',
          status: 'verified',
          statusLabel: verifiedLabel,
          date: '2026-01-10',
          details: isEnglish
            ? {
                Factory: 'Jiaxing Kidswear Manufacturing Co., Zhejiang',
                'Batch ID': 'MFG-2026-0078',
                'Worker Welfare': 'BSCI certified',
                Completed: '2026-01-10',
              }
            : {
                工厂: '浙江嘉兴童装制造有限公司',
                批次号: 'MFG-2026-0078',
                工人保障: 'BSCI认证',
                完成日期: '2026-01-10',
              },
        },
        {
          id: 'inspection',
          stage: isEnglish ? 'Quality Inspection' : '质量检测',
          stageEn: isEnglish ? '' : 'Quality Inspection',
          status: 'verified',
          statusLabel: verifiedLabel,
          date: '2026-01-18',
          details: isEnglish
            ? {
                Agency: 'Intertek',
                'Report ID': 'ITK-2026-TH-0034',
                Result: 'All items passed',
                'Inspection Date': '2026-01-18',
              }
            : {
                机构: 'Intertek天祥集团',
                报告编号: 'ITK-2026-TH-0034',
                检测结果: '全项合格',
                检测日期: '2026-01-18',
              },
        },
        {
          id: 'logistics',
          stage: isEnglish ? 'Logistics & Delivery' : '物流配送',
          stageEn: isEnglish ? '' : 'Logistics & Delivery',
          status: 'in-progress',
          statusLabel: inProgressLabel,
          date: '2026-02-08',
          details: isEnglish
            ? {
                Logistics: 'JD Logistics',
                'Tracking No.': 'JD9876543210',
                'Green Logistics': yesLabel,
                'Estimated Arrival': '2026-02-08',
              }
            : {
                物流: '京东物流',
                单号: 'JD9876543210',
                绿色物流: yesLabel,
                预计到达: '2026-02-08',
              },
        },
      ],
      carbonData: [
        { stage: isEnglish ? 'Raw Material Sourcing' : '原料采购', co2: 2.8, color: 'bg-sage' },
        { stage: isEnglish ? 'Fabric Processing' : '加工处理', co2: 4.1, color: 'bg-rust' },
        { stage: isEnglish ? 'Garment Manufacturing' : '成衣制造', co2: 2.3, color: 'bg-sepia-mid' },
        { stage: isEnglish ? 'Inspection & Transport' : '质检运输', co2: 0.6, color: 'bg-ink/60' },
        { stage: isEnglish ? 'Logistics Delivery' : '物流配送', co2: 0.7, color: 'bg-sage/70' },
      ],
      carbonTotal: 10.5,
      carbonTraditional: 38.6,
      certifications: ['OCS', 'BSCI', 'Oeko-Tex'],
    },
    {
      product: {
        id: 'TH-2026-003',
        name: isEnglish ? 'Rainbow Doodle Dress' : '彩虹涂鸦裙',
        batch: 'BAT-2026-C03',
        image: placeholderImage(isEnglish ? 'Rainbow Doodle Dress' : '彩虹涂鸦裙', { hue: 340 }),
      },
      timeline: [
        {
          id: 'raw',
          stage: isEnglish ? 'Raw Material Source' : '原料来源',
          stageEn: isEnglish ? '' : 'Raw Material Source',
          status: 'verified',
          statusLabel: verifiedLabel,
          date: '2026-01-05',
          details: isEnglish
            ? {
                Origin: 'Dali Hemp Cooperative, Yunnan',
                Fiber: 'Hemp blend',
                Certification: 'OEKO-TEX Standard 100',
                'Procurement Date': '2026-01-05',
                GPS: '25.6065°N, 100.2679°E',
              }
            : {
                来源地: '云南大理麻纺合作社',
                品种: '汉麻混纺 (Hemp blend)',
                认证: 'OEKO-TEX Standard 100',
                采购日期: '2026-01-05',
                GPS坐标: '25.6065°N, 100.2679°E',
              },
        },
        {
          id: 'fabric',
          stage: isEnglish ? 'Fabric Processing' : '面料加工',
          stageEn: isEnglish ? '' : 'Fabric Processing',
          status: 'verified',
          statusLabel: verifiedLabel,
          date: '2026-01-25',
          details: isEnglish
            ? {
                Factory: 'Kunming Green Weave Mill, Yunnan',
                Process: 'Degumming → Spinning → Weaving → Plant Dyeing',
                Completed: '2026-01-25',
              }
            : {
                工厂: '云南昆明绿织纺织厂',
                工序: '脱胶 → 纺纱 → 织布 → 植物染',
                完成日期: '2026-01-25',
              },
        },
        {
          id: 'garment',
          stage: isEnglish ? 'Garment Manufacturing' : '成衣制造',
          stageEn: isEnglish ? '' : 'Garment Manufacturing',
          status: 'verified',
          statusLabel: verifiedLabel,
          date: '2026-02-10',
          details: isEnglish
            ? {
                Factory: 'Shuxiu Kidswear Studio, Chengdu',
                'Batch ID': 'MFG-2026-0201',
                'Worker Welfare': 'Fair Trade certified',
                Completed: '2026-02-10',
              }
            : {
                工厂: '成都蜀绣童装工坊',
                批次号: 'MFG-2026-0201',
                工人保障: 'Fair Trade认证',
                完成日期: '2026-02-10',
              },
        },
        {
          id: 'inspection',
          stage: isEnglish ? 'Quality Inspection' : '质量检测',
          stageEn: isEnglish ? '' : 'Quality Inspection',
          status: 'pending',
          statusLabel: pendingInspectionLabel,
          date: isEnglish ? 'Expected 2026-02-20' : '预计 2026-02-20',
          details: isEnglish
            ? {
                Agency: 'Bureau Veritas',
                'Report ID': unassignedLabel,
                Result: pendingInspectionLabel,
                'Expected Date': '2026-02-20',
              }
            : {
                机构: 'BV必维国际检验集团',
                报告编号: unassignedLabel,
                检测结果: '待检测',
                预计日期: '2026-02-20',
              },
        },
        {
          id: 'logistics',
          stage: isEnglish ? 'Logistics & Delivery' : '物流配送',
          stageEn: isEnglish ? '' : 'Logistics & Delivery',
          status: 'pending',
          statusLabel: pendingShipmentLabel,
          date: isEnglish ? 'Expected 2026-03-01' : '预计 2026-03-01',
          details: isEnglish
            ? {
                Logistics: 'To Be Arranged',
                'Tracking No.': unassignedLabel,
                'Green Logistics': plannedLabel,
                'Estimated Arrival': '2026-03-01',
              }
            : {
                物流: '待安排',
                单号: unassignedLabel,
                绿色物流: plannedLabel,
                预计到达: '2026-03-01',
              },
        },
      ],
      carbonData: [
        { stage: isEnglish ? 'Raw Material Sourcing' : '原料采购', co2: 1.5, color: 'bg-sage' },
        { stage: isEnglish ? 'Fabric Processing' : '加工处理', co2: 2.6, color: 'bg-rust' },
        { stage: isEnglish ? 'Garment Manufacturing' : '成衣制造', co2: 1.9, color: 'bg-sepia-mid' },
        { stage: isEnglish ? 'Inspection & Transport' : '质检运输', co2: 0.4, color: 'bg-ink/60' },
        { stage: isEnglish ? 'Logistics Delivery' : '物流配送', co2: 0.4, color: 'bg-sage/70' },
      ],
      carbonTotal: 6.8,
      carbonTraditional: 28.2,
      certifications: ['Oeko-Tex', 'Fair Trade', 'GOTS'],
    },
  ];
}

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

function TimelineNodeCard({ node, index, prefersReducedMotion }: { node: TimelineNode; index: number; prefersReducedMotion: boolean }) {
  const [expanded, setExpanded] = useState(index === 0);
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-60px' });

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
            <h3 className="font-display text-h3 text-ink">
              {node.stage}
            </h3>
            {node.stageEn && (
              <span className="font-body text-overline text-sepia-mid">{node.stageEn}</span>
            )}
          </div>
          <span className={`inline-flex items-center px-3 py-1 font-body text-overline tracking-wider border rounded-sm ${badgeColor}`}>
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
  const { t, i18n } = useTranslation();
  const prefersReducedMotion = useReducedMotion();
  const isEnglish = (i18n.resolvedLanguage || i18n.language || 'en').startsWith('en');
  const productDatasets = useMemo(() => createProductDatasets(isEnglish), [isEnglish]);
  const mockProducts = useMemo(() => productDatasets.map((dataset) => dataset.product), [productDatasets]);
  const [searchId, setSearchId] = useState('');
  const [activeProduct, setActiveProduct] = useState<string>('TH-2026-001');
  const [searchError, setSearchError] = useState<string | null>(null);

  const carbonRef = useRef<HTMLDivElement>(null);
  const carbonInView = useInView(carbonRef, { once: true, margin: '-40px' });

  // Derive current dataset from activeProduct
  const activeDataset = productDatasets.find((d) => d.product.id === activeProduct) ?? productDatasets[0];
  const { timeline, carbonData, carbonTotal, carbonTraditional, certifications } = activeDataset;

  const { maxCo2, reductionPercent } = useMemo(() => ({
    maxCo2: Math.max(...carbonData.map((d) => d.co2)),
    reductionPercent: (((carbonTraditional - carbonTotal) / carbonTraditional) * 100).toFixed(1),
  }), [carbonData, carbonTotal, carbonTraditional]);

  const integrityHeading = isEnglish ? 'Append-only Timeline Architecture' : 'Append-only 仅追加时间线架构';
  const integrityExplanation = isEnglish
    ? 'Every supply-chain record is appended chronologically and cannot be edited or deleted after publication. Each entry carries timestamps and verification signatures so the full journey remains auditable.'
    : '所有供应链记录采用追加写入模式，一旦写入即不可修改或删除。每条记录都包含时间戳与验证签名，确保数据的完整性与可追溯性。';
  const integrityVerifiedLabel = isEnglish ? 'Only Verified Records Displayed' : '仅展示已验证记录';
  const integrityItems = useMemo(
    () => [
      {
        icon: 'lock' as const,
        title: isEnglish ? 'Immutable' : '不可篡改',
        secondary: isEnglish ? '' : 'Immutable',
        desc: isEnglish ? 'Once published, records cannot be edited.' : '数据一旦写入即无法修改',
      },
      {
        icon: 'shield' as const,
        title: isEnglish ? 'Third-party Verified' : '第三方验证',
        secondary: isEnglish ? '' : 'Third-party Verified',
        desc: isEnglish ? 'Independently verified by partners such as SGS.' : '由 SGS 等国际机构独立验证',
      },
      {
        icon: 'refresh' as const,
        title: isEnglish ? 'Real-time Updates' : '实时更新',
        secondary: isEnglish ? '' : 'Real-time Updates',
        desc: isEnglish ? 'Status changes are synchronized across the supply chain.' : '供应链状态同步更新',
      },
    ],
    [isEnglish],
  );

  const handleSearch = useCallback(() => {
    const trimmed = searchId.trim();
    if (!trimmed) return;
    const found = productDatasets.find(
      (d) => d.product.id.toLowerCase() === trimmed.toLowerCase()
    );
    if (found) {
      setActiveProduct(found.product.id);
      setSearchError(null);
    } else {
      setSearchError(t('materialTrace.lookup.notFound', 'Product not found'));
    }
  }, [productDatasets, searchId, t]);

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
          <span className="font-body text-caption text-sepia-mid">
            {t('materialTrace.disclaimer', 'Current display uses sample data. Production environment will connect to real supply chain traceability system.')}
          </span>
        </div>
      </SectionContainer>

      {/* ============================================================ */}
      {/*  Section 01 - Product Trace Lookup                           */}
      {/* ============================================================ */}
      <SectionContainer className="pt-0">
        <NumberedSectionHeading
          number="01"
          title={t('materialTrace.lookup.title', 'Product Traceability')}
          subtitle={t('materialTrace.lookup.subtitle', 'Enter a product ID to view the complete supply chain traceability record')}
        />

        {/* Search Row */}
        <div className="grid grid-cols-12 gap-6 mb-12">
          <div className="col-span-12 md:col-span-8 lg:col-span-6">
            <div className="flex items-end gap-3">
              <div className="flex-1" onKeyDown={handleSearchKeyDown}>
                <VintageInput
                  icon="search"
                  placeholder={t('materialTrace.lookup.placeholder', 'Enter product ID e.g. TH-2026-001')}
                  value={searchId}
                  onChange={(e) => {
                    setSearchId((e.target as HTMLInputElement).value);
                    setSearchError(null);
                  }}
                  label={t('materialTrace.lookup.inputLabel', 'Product ID')}
                />
              </div>
              <button
                type="button"
                onClick={handleSearch}
                className="flex items-center justify-center w-12 h-12 border-2 border-rust/30 bg-paper text-rust hover:bg-rust hover:text-paper transition-colors duration-300 flex-shrink-0"
                aria-label={t('materialTrace.lookup.search', 'Search')}
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
          {mockProducts.map((product, idx) => (
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
          title={t('materialTrace.timeline.title', 'Traceability Timeline')}
          subtitle={t('materialTrace.timeline.subtitle', 'From cotton field to your hands — every step verified through a transparent supply chain')}
        />

        <div className="grid grid-cols-12 gap-8">
          {/* Left decorative info */}
          <div className="col-span-12 lg:col-span-3 hidden lg:block">
            <div className="sticky top-32 space-y-6">
              <SepiaImageFrame
                src={activeDataset.product.image}
                alt={activeDataset.product.name}
                aspectRatio="portrait"
                size="full"
                caption={activeDataset.product.batch}
              />
              <div className="bg-sage/10 border border-sage/20 p-4">
                <p className="font-display text-label font-semibold text-sage mb-1">
                  {t('materialTrace.timeline.activeId', 'Currently Tracing')}
                </p>
                <p className="font-body text-body-sm text-ink">{activeProduct}</p>
                <p className="font-body text-caption text-sepia-mid mt-1">{activeDataset.product.name}</p>
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
              <TimelineNodeCard key={`${activeProduct}-${node.id}`} node={node} index={idx} prefersReducedMotion={Boolean(prefersReducedMotion)} />
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
          title={t('materialTrace.integrity.title', 'Data Integrity')}
          subtitle={t('materialTrace.integrity.subtitle', 'Append-only timeline architecture ensures traceability data is authentic, reliable, and tamper-proof')}
        />

        <div className="grid grid-cols-12 gap-6 mb-12">
          {/* Explanation card */}
          <div className="col-span-12 lg:col-span-7">
            <div className="bg-paper border-2 border-rust/30 p-6 md:p-8 relative">
              <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-rust/30" aria-hidden="true" />
              <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-rust/30" aria-hidden="true" />

              <h3 className="font-display text-h3 text-ink mb-3">
                {integrityHeading}
              </h3>
              <p className="font-body text-body-sm text-ink/90 leading-relaxed mb-4">
                {integrityExplanation}
              </p>
              <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-sage/10 border border-sage/30 rounded-sm text-sage font-body text-overline tracking-wider">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                {integrityVerifiedLabel}
              </span>
            </div>
          </div>

          {/* Trust indicators */}
          <div className="col-span-12 lg:col-span-5 space-y-4">
            {integrityItems.map((item, idx) => (
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
                  <p className="font-display text-label font-semibold text-ink">
                    {item.title}{' '}
                    {item.secondary && <span className="font-body text-sepia-mid font-normal">{item.secondary}</span>}
                  </p>
                  <p className="font-body text-caption text-ink/80 mt-0.5">{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Certification badges */}
        <div className="flex flex-wrap items-center gap-4 pt-4 border-t border-rust/20">
          <span className="font-body text-overline text-sepia-mid tracking-[0.2em] uppercase mr-2">
            {t('materialTrace.integrity.certifications', 'Certifications')}
          </span>
          {certifications.map((cert) => (
            <span
              key={cert}
              className="inline-flex items-center px-4 py-2 bg-paper border border-rust/30 font-display text-label font-semibold text-ink tracking-wider"
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
          title={t('materialTrace.carbon.title', 'Carbon Footprint Tracking')}
          subtitle={t('materialTrace.carbon.subtitle', 'Full supply chain carbon emission tracking and comparison from raw material to finished product')}
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
                  <span className="font-body text-caption text-sepia-mid">{item.co2} kg CO₂</span>
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
                <span className="font-display text-label font-semibold text-ink">
                  {t('materialTrace.carbon.total', 'Total')}
                </span>
                <span className="font-display text-h3 font-bold text-rust">
                  {carbonTotal} kg CO₂
                </span>
              </div>
              <div className="flex justify-between items-baseline">
                <span className="font-body text-caption text-sepia-mid">
                  {t('materialTrace.carbon.traditional', 'Traditional Model')}
                </span>
                <span className="font-body text-caption text-sepia-mid line-through">
                  {carbonTraditional} kg CO₂
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
                {t('materialTrace.carbon.reduction', 'Carbon Reduction')}
              </p>
              <p className="font-display text-h1 font-bold text-sage leading-none mb-2">
                -{reductionPercent}%
              </p>
              <p className="font-body text-caption text-ink/75">
                {t('materialTrace.carbon.vsTraditional', 'vs traditional supply chain')}
              </p>

              <div className="mt-6 pt-4 border-t border-sage/20 space-y-2">
                <div className="flex justify-between font-body text-caption text-ink/80">
                  <span>{t('materialTrace.carbon.sustainable', 'Sustainable')}</span>
                  <span className="font-semibold text-sage">{carbonTotal} kg</span>
                </div>
                <div className="flex justify-between font-body text-caption text-ink/80">
                  <span>{t('materialTrace.carbon.traditional', 'Traditional')}</span>
                  <span className="line-through">{carbonTraditional} kg</span>
                </div>
                <div className="flex justify-between font-body text-caption text-ink/80">
                  <span>{t('materialTrace.carbon.saved', 'Saved')}</span>
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
