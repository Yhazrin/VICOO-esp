/**
 * Land silhouettes from Natural Earth 1:110m (public domain).
 * https://www.naturalearthdata.com/
 */
import * as THREE from 'three';
import { Line2 } from 'three/addons/lines/Line2.js';
import { LineGeometry } from 'three/addons/lines/LineGeometry.js';
import { LineMaterial } from 'three/addons/lines/LineMaterial.js';
import landDataStatic from '@/data/world-land-110m.json';
import { latLngToVector3 } from '@/components/scroll/globeUtils';

/**
 * Coastlines sit slightly above the sphere mesh to avoid z-fighting with the wireframe.
 * Keep this tiny so lines read as drawn on the globe surface, not floating above it.
 */
export function landOutlineRadius(globeRadius: number): number {
  return globeRadius + Math.max(globeRadius * 0.0011, 0.0018);
}

type LngLatRing = [number, number][];

export type LandOutlineStyle = {
  /**
   * Screen-space stroke width in CSS pixels (WebGL `Line2`).
   * When omitted or ≤ 1, uses thin `LineLoop` (width not reliable in WebGL1).
   */
  lineWidthPx?: number;
};

/** Traceability product page globe: land outline line width (screen-space px, `Line2`) */
export const LAND_OUTLINE_WIDTH_TRACEABILITY_PX = 2;

/** Homepage supply-chain globe: use `Line2` when matching `lineWidthPx` */
export const LAND_OUTLINE_WIDTH_SUPPLY_CHAIN_PX = 1.35;

function addRing(
  group: THREE.Group,
  ring: LngLatRing,
  radius: number,
  material: THREE.LineBasicMaterial,
) {
  if (ring.length < 3) return;
  const pts = ring.map(([lng, lat]) => latLngToVector3(lat, lng, radius));
  const geo = new THREE.BufferGeometry().setFromPoints(pts);
  group.add(new THREE.LineLoop(geo, material));
}

function addRingLine2(group: THREE.Group, ring: LngLatRing, radius: number, material: LineMaterial) {
  if (ring.length < 3) return;
  const positions: number[] = [];
  for (const [lng, lat] of ring) {
    const v = latLngToVector3(lat, lng, radius);
    positions.push(v.x, v.y, v.z);
  }
  const [lng0, lat0] = ring[0];
  const vClose = latLngToVector3(lat0, lng0, radius);
  positions.push(vClose.x, vClose.y, vClose.z);

  const geo = new LineGeometry();
  geo.setPositions(positions);
  const line = new Line2(geo, material);
  line.renderOrder = 1;
  group.add(line);
}

type GeoJsonLike = {
  features: { geometry?: { type: string; coordinates: unknown } }[];
};

/**
 * Build land outline line loops from parsed GeoJSON (sync).
 * Dispose `group.userData.landOutlineMaterial` when removing the group.
 */
export function buildLandOutlinesFromGeoJson(
  data: GeoJsonLike,
  radius: number,
  color: THREE.Color,
  opacity = 0.45,
  style?: LandOutlineStyle,
): THREE.Group {
  const group = new THREE.Group();
  const lineWidthPx = style?.lineWidthPx ?? 0;
  const useThick = lineWidthPx > 1;

  if (useThick) {
    const material = new LineMaterial({
      color,
      linewidth: lineWidthPx,
      transparent: true,
      opacity,
      depthWrite: false,
      depthTest: true,
      polygonOffset: true,
      polygonOffsetFactor: -0.8,
      polygonOffsetUnits: -0.8,
    });

    for (const f of data.features) {
      const g = f.geometry;
      if (!g?.coordinates) continue;

      if (g.type === 'Polygon') {
        const rings = g.coordinates as LngLatRing[];
        for (const ring of rings) {
          addRingLine2(group, ring, radius, material);
        }
      } else if (g.type === 'MultiPolygon') {
        const polys = g.coordinates as LngLatRing[][];
        for (const poly of polys) {
          for (const ring of poly) {
            addRingLine2(group, ring, radius, material);
          }
        }
      }
    }

    group.userData.landLineMaterial = material;
    return group;
  }

  const material = new THREE.LineBasicMaterial({
    color,
    transparent: true,
    opacity,
    depthWrite: false,
    depthTest: true,
    polygonOffset: true,
    polygonOffsetFactor: -0.8,
    polygonOffsetUnits: -0.8,
  });

  for (const f of data.features) {
    const g = f.geometry;
    if (!g?.coordinates) continue;

    if (g.type === 'Polygon') {
      const rings = g.coordinates as LngLatRing[];
      for (const ring of rings) {
        addRing(group, ring, radius, material);
      }
    } else if (g.type === 'MultiPolygon') {
      const polys = g.coordinates as LngLatRing[][];
      for (const poly of polys) {
        for (const ring of poly) {
          addRing(group, ring, radius, material);
        }
      }
    }
  }

  group.traverse((obj) => {
    if (obj instanceof THREE.LineLoop) {
      obj.renderOrder = 1;
    }
  });

  group.userData.landOutlineMaterial = material;
  return group;
}

/**
 * Natural Earth 110m land polygons as LineLoops on a sphere (editorial / low poly).
 * Shares one material across all loops — dispose material once after removing the group.
 */
export function createLandOutlinesGroup(
  radius: number,
  color: THREE.Color,
  opacity = 0.45,
  style?: LandOutlineStyle,
): THREE.Group {
  return buildLandOutlinesFromGeoJson(landDataStatic as GeoJsonLike, radius, color, opacity, style);
}

/** `Line2` / `LineMaterial` linewidth is in CSS pixels — must match canvas pixel size. */
export function syncLandOutlineLine2Resolution(group: THREE.Group, width: number, height: number) {
  const m = group.userData.landLineMaterial as { resolution?: THREE.Vector2 } | undefined;
  if (m?.resolution) m.resolution.set(width, height);
}
