/* ------------------------------------------------------------------ */
/*  Shared supply-chain route data for globe & traceability pages      */
/* ------------------------------------------------------------------ */

export interface SupplyChainNode {
  id: string;
  lat: number;
  lng: number;
  labelEn: string;
  labelZh: string;
  stage: 'raw' | 'fabric' | 'garment';
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

/** Brand palette hex values */
export const ROUTE_COLORS = {
  rust: '#A45A52',
  sage: '#7D8471',
  sepia: '#8B7355',
} as const;

export const SUPPLY_CHAIN_ROUTES: SupplyChainRoute[] = [
  {
    productId: 'TH-2026-001',
    productNameEn: 'Playful Garden Tee',
    productNameZh: '童趣花园T恤',
    color: ROUTE_COLORS.rust,
    co2: 8.2,
    co2Traditional: 33.4,
    nodes: [
      { id: 'raw-001', lat: 41.1684, lng: 80.2636, labelEn: 'Xinjiang Cotton', labelZh: '新疆棉花', stage: 'raw' },
      { id: 'fabric-001', lat: 37.4500, lng: 116.3000, labelEn: 'Shandong Textile', labelZh: '山东纺织', stage: 'fabric' },
      { id: 'garment-001', lat: 23.1291, lng: 113.2644, labelEn: 'Guangzhou Mfg.', labelZh: '广州制造', stage: 'garment' },
    ],
  },
  {
    productId: 'TH-2026-002',
    productNameEn: 'Starlit Dream Hoodie',
    productNameZh: '星空梦想卫衣',
    color: ROUTE_COLORS.sage,
    co2: 10.5,
    co2Traditional: 42.0,
    nodes: [
      { id: 'raw-002', lat: 37.3826, lng: 117.9711, labelEn: 'Shandong Cotton', labelZh: '山东棉花', stage: 'raw' },
      { id: 'fabric-002', lat: 32.0603, lng: 120.8700, labelEn: 'Jiangsu Textile', labelZh: '江苏纺织', stage: 'fabric' },
      { id: 'garment-002', lat: 30.2741, lng: 120.1551, labelEn: 'Zhejiang Mfg.', labelZh: '浙江制造', stage: 'garment' },
    ],
  },
  {
    productId: 'TH-2026-003',
    productNameEn: 'Rainbow Doodle Dress',
    productNameZh: '彩虹涂鸦连衣裙',
    color: ROUTE_COLORS.sepia,
    co2: 6.8,
    co2Traditional: 28.0,
    nodes: [
      { id: 'raw-003', lat: 25.6065, lng: 100.2679, labelEn: 'Yunnan Hemp', labelZh: '云南大麻', stage: 'raw' },
      { id: 'fabric-003', lat: 25.0389, lng: 102.7183, labelEn: 'Yunnan Textile', labelZh: '云南纺织', stage: 'fabric' },
      { id: 'garment-003', lat: 30.5728, lng: 104.0668, labelEn: 'Chengdu Workshop', labelZh: '成都工坊', stage: 'garment' },
    ],
  },
];
