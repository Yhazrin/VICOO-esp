import * as THREE from 'three';
import type { SupplyChainTimelineRecord } from '@/types';

/** Rough coordinates for common supply-chain labels (CN / EN). Extend as needed. */
const LOCATION_HINTS: { pattern: RegExp; lat: number; lng: number }[] = [
  { pattern: /阿克苏|aksu/i, lat: 41.17, lng: 80.26 },
  { pattern: /新疆|xinjiang/i, lat: 43.0, lng: 85.0 },
  { pattern: /德化|dehua/i, lat: 25.4897, lng: 118.2417 },
  { pattern: /泉州|quanzhou/i, lat: 24.9139, lng: 118.5859 },
  { pattern: /厦门|xiamen/i, lat: 24.4798, lng: 118.0894 },
  { pattern: /周城|喜洲/i, lat: 25.8547, lng: 100.2139 },
  { pattern: /大理|dali/i, lat: 25.6065, lng: 100.2676 },
  { pattern: /楚雄|chuxiong/i, lat: 25.033, lng: 101.533 },
  { pattern: /昆明|kunming/i, lat: 25.0389, lng: 102.7183 },
  { pattern: /凯里|kaili/i, lat: 26.5836, lng: 107.9803 },
  { pattern: /柳州|liuzhou/i, lat: 24.3263, lng: 109.4281 },
  { pattern: /佛山|foshan/i, lat: 23.0297, lng: 113.1056 },
  { pattern: /宁波|ningbo/i, lat: 29.8747, lng: 121.5507 },
  { pattern: /祁连|qilian/i, lat: 38.1754, lng: 100.2497 },
  { pattern: /西宁|xining/i, lat: 36.6171, lng: 101.7782 },
  { pattern: /天津(?!港)/i, lat: 39.0842, lng: 117.201 },
  { pattern: /廊坊|langfang/i, lat: 39.5239, lng: 116.7044 },
  { pattern: /通州|tongzhou/i, lat: 39.9097, lng: 116.6576 },
  { pattern: /绍兴|shaoxing/i, lat: 30.0, lng: 120.58 },
  { pattern: /浙江(?!绍兴)|zhejiang/i, lat: 30.27, lng: 120.15 },
  { pattern: /福建(?!德|泉|厦)/i, lat: 26.08, lng: 119.3 },
  { pattern: /深圳|shenzhen/i, lat: 22.55, lng: 114.05 },
  { pattern: /广东|guangdong|canton/i, lat: 23.38, lng: 113.5 },
  { pattern: /上海|shanghai/i, lat: 31.23, lng: 121.47 },
  { pattern: /北京(?!通州)|beijing/i, lat: 39.9, lng: 116.4 },
  { pattern: /成都|chengdu/i, lat: 30.67, lng: 104.06 },
  { pattern: /云南|yunnan/i, lat: 25.04, lng: 102.71 },
  { pattern: /贵州|guizhou|guiyang/i, lat: 26.65, lng: 106.63 },
  { pattern: /孟加拉|bangladesh|dhaka/i, lat: 23.81, lng: 90.41 },
  { pattern: /葡萄牙|portugal|porto/i, lat: 41.15, lng: -8.61 },
  { pattern: /意大利|italy|milano|milan/i, lat: 45.46, lng: 9.19 },
  { pattern: /土耳其|turkey|istanbul/i, lat: 41.01, lng: 28.98 },
  { pattern: /印度|india|mumbai/i, lat: 19.08, lng: 72.88 },
  { pattern: /全国|china|中国|配送|logistics/i, lat: 35.0, lng: 105.0 },
];

function fibonacciLngLat(index: number, total: number): { lat: number; lng: number } {
  const t = (index + 0.5) / Math.max(total, 1);
  const lng = t * 360 - 180;
  const lat = 55 * Math.sin(Math.PI * t * 2.17);
  return { lat, lng };
}

/**
 * Resolve WGS84 coordinates for a timeline record.
 * Uses explicit lat/lng when present, else keyword map, else stable spread.
 */
export function getRecordLatLng(
  record: SupplyChainTimelineRecord,
  index: number,
  total: number
): { lat: number; lng: number } {
  if (record.latitude != null && record.longitude != null) {
    return { lat: record.latitude, lng: record.longitude };
  }
  const loc = (record.location || '').trim();
  if (!loc) {
    return fibonacciLngLat(index, total);
  }
  for (const { pattern, lat, lng } of LOCATION_HINTS) {
    if (pattern.test(loc)) {
      const jitter = index * 0.35;
      return { lat: lat + jitter * 0.02, lng: lng + jitter * 0.03 };
    }
  }
  return fibonacciLngLat(index, total);
}

export function latLngToVector3(lat: number, lng: number, radius: number): THREE.Vector3 {
  const latRad = (lat * Math.PI) / 180;
  const lonRad = (lng * Math.PI) / 180;
  const x = radius * Math.cos(latRad) * Math.sin(lonRad);
  const y = radius * Math.sin(latRad);
  const z = radius * Math.cos(latRad) * Math.cos(lonRad);
  return new THREE.Vector3(x, y, z);
}
