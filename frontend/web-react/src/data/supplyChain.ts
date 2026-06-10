/* ------------------------------------------------------------------ */
/*  Shared supply-chain route data for globe & traceability pages      */
/* ------------------------------------------------------------------ */

export interface SupplyChainNode {
  id: string;
  lat: number;
  lng: number;
  labelEn: string;
  labelZh: string;
  stage: 'material_sourcing' | 'processing' | 'manufacturing' | 'quality_check' | 'shipping';
}

export interface SupplyChainRoute {
  productId: string;
  productNameEn: string;
  productNameZh: string;
  color: string;
  co2: number;
  co2Traditional: number;
  nodes: SupplyChainNode[];
}

/** Brand palette hex values - high saturation */
export const ROUTE_COLORS = {
  rust: '#E63946',
  sage: '#01847F',
  sepia: '#1D3557',
} as const;

export const SUPPLY_CHAIN_ROUTES: SupplyChainRoute[] = [
  {
    productId: 'TH-2026-001',
    productNameEn: 'Carbon Footprint',
    productNameZh: '碳足迹追踪',
    color: ROUTE_COLORS.rust,
    co2: 8.2,
    co2Traditional: 33.4,
    nodes: [
      { id: 'raw-001', lat: 41.1684, lng: 80.2636, labelEn: 'Raw Material', labelZh: '原材料溯源', stage: 'material_sourcing' },
      { id: 'fabric-001', lat: 37.4500, lng: 116.3000, labelEn: 'Production', labelZh: '生产透明', stage: 'processing' },
      { id: 'garment-001', lat: 23.1291, lng: 113.2644, labelEn: 'Carbon Calc', labelZh: '碳排计算', stage: 'manufacturing' },
      { id: 'qc-001', lat: 22.5431, lng: 114.0579, labelEn: 'Verification', labelZh: '第三方核查', stage: 'quality_check' },
      { id: 'ship-001', lat: 22.3193, lng: 114.1694, labelEn: 'Certificate', labelZh: '证书发放', stage: 'shipping' },
    ],
  },
  {
    productId: 'TH-2026-002',
    productNameEn: 'Charity Donation',
    productNameZh: '公益捐赠',
    color: ROUTE_COLORS.sage,
    co2: 10.5,
    co2Traditional: 42.0,
    nodes: [
      { id: 'raw-002', lat: 37.3826, lng: 117.9711, labelEn: 'Donation Match', labelZh: '捐赠配比', stage: 'material_sourcing' },
      { id: 'fabric-002', lat: 32.0603, lng: 120.8700, labelEn: 'Progress Track', labelZh: '进度追踪', stage: 'processing' },
      { id: 'garment-002', lat: 30.2741, lng: 120.1551, labelEn: 'Impact Report', labelZh: '影响力报告', stage: 'manufacturing' },
      { id: 'qc-002', lat: 28.6920, lng: 121.3480, labelEn: 'Certificate', labelZh: '捐赠证书', stage: 'quality_check' },
      { id: 'ship-002', lat: 29.8683, lng: 121.5440, labelEn: 'Beneficiary', labelZh: '受赠方反馈', stage: 'shipping' },
    ],
  },
  {
    productId: 'TH-2026-003',
    productNameEn: 'Supply Chain',
    productNameZh: '供应链透明',
    color: ROUTE_COLORS.sepia,
    co2: 6.8,
    co2Traditional: 28.0,
    nodes: [
      { id: 'raw-003', lat: 25.6065, lng: 100.2679, labelEn: 'Supplier Reg', labelZh: '供应商登记', stage: 'material_sourcing' },
      { id: 'fabric-003', lat: 25.0389, lng: 102.7183, labelEn: 'Documentation', labelZh: '工艺文档化', stage: 'processing' },
      { id: 'garment-003', lat: 30.5728, lng: 104.0668, labelEn: 'Quality Std', labelZh: '质量标准', stage: 'manufacturing' },
      { id: 'qc-003', lat: 29.5630, lng: 106.5516, labelEn: 'Audit Trail', labelZh: '审计追溯', stage: 'quality_check' },
      { id: 'ship-003', lat: 28.9645, lng: 121.6488, labelEn: 'Blockchain', labelZh: '区块链存证', stage: 'shipping' },
    ],
  },
];
