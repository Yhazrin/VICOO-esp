import * as THREE from 'three';
import type { SupplyChainTimelineRecord } from '@/types';

/** Rough coordinates for common supply-chain labels (CN / EN). Extend as needed. */
const LOCATION_HINTS: { pattern: RegExp; lat: number; lng: number }[] = [
  { pattern: /阿克苏|aksu/i, lat: 41.17, lng: 80.26 },
  { pattern: /新疆|xinjiang/i, lat: 43.0, lng: 85.0 },
  { pattern: /绍兴|shaoxing/i, lat: 30.0, lng: 120.58 },
  { pattern: /浙江(?!绍兴)|zhejiang/i, lat: 30.27, lng: 120.15 },
  { pattern: /深圳|shenzhen/i, lat: 22.55, lng: 114.05 },
  { pattern: /广东|guangdong|canton/i, lat: 23.38, lng: 113.5 },
  { pattern: /上海|shanghai/i, lat: 31.23, lng: 121.47 },
  { pattern: /北京|beijing/i, lat: 39.9, lng: 116.4 },
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
