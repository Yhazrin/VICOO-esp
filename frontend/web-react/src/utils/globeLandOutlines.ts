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

/**
 * Add filled polygon for land mass (not just outlines)
 * Uses ShapeGeometry for proper polygon triangulation
 */
function addFilledPolygon(
  group: THREE.Group,
  ring: LngLatRing,
  radius: number,
  material: THREE.MeshBasicMaterial,
) {
  if (ring.length < 3) return;

  // Convert to 2D points on sphere surface using stereographic projection
  const pts2D = ring.map(([lng, lat]) => {
    const phi = (90 - lat) * (Math.PI / 180);
    const theta = (lng + 180) * (Math.PI / 180);
    const x = radius * Math.sin(phi) * Math.cos(theta);
    const y = radius * Math.cos(phi);
    return { x, y };
  });

  // Create THREE.Shape for triangulation
  const shape = new THREE.Shape();
  shape.moveTo(pts2D[0].x, pts2D[0].y);
  for (let i = 1; i < pts2D.length; i++) {
    shape.lineTo(pts2D[i].x, pts2D[i].y);
  }
  shape.closePath();

  const geometry = new THREE.ShapeGeometry(shape, 8);
  const mesh = new THREE.Mesh(geometry, material);
  mesh.rotation.x = Math.PI / 2; // Rotate to lie flat on XY plane
  group.add(mesh);
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

/**
 * Natural Earth 110m land polygons as filled meshes on a sphere.
 * (Legacy 2D stereographic projection — kept for backwards compat)
 */
export function createLandFillGroup(
  radius: number,
  color: THREE.Color,
  opacity = 0.25,
): THREE.Group {
  const group = new THREE.Group();
  const mat = new THREE.MeshBasicMaterial({
    color,
    transparent: true,
    opacity,
    side: THREE.FrontSide,
    depthWrite: false,
  });

  const landData = landDataStatic as GeoJsonLike;
  for (const feature of landData.features) {
    const g = feature.geometry;
    if (!g) continue;
    if (g.type === 'Polygon') {
      const rings = g.coordinates as LngLatRing[];
      for (const ring of rings) {
        addFilledPolygon(group, ring, radius, mat);
      }
    } else if (g.type === 'MultiPolygon') {
      const polys = g.coordinates as LngLatRing[][];
      for (const poly of polys) {
        for (const ring of poly) {
          addFilledPolygon(group, ring, radius, mat);
        }
      }
    }
  }

  group.userData.landFillMaterial = mat;
  return group;
}

/**
 * Canvas 等矩形投影 → 球面纹理 + 可选顶点位移浮雕。
 *
 * 1. 在 2D 画布上绘制大陆色块，作为颜色贴图。
 * 2. 若 `bumpHeight > 0`，额外绘制一张二值遮罩，对球体顶点做
 *    "命中大陆 → 向外推"的位移，产生浅浮雕效果。
 */
export function createLandTextureSphere(
  radius: number,
  landColorHex: string,
  landAlpha = 0.55,
  resolution = 1024,
  bumpHeight = 0,
): THREE.Mesh {
  const w = resolution;
  const h = resolution / 2;
  const landData = landDataStatic as GeoJsonLike;

  const paintLand = (ctx: CanvasRenderingContext2D) => {
    for (const feature of landData.features) {
      const g = feature.geometry;
      if (!g) continue;
      const drawRing = (ring: LngLatRing) => {
        if (ring.length < 3) return;
        ctx.beginPath();
        for (let i = 0; i < ring.length; i++) {
          const [lng, lat] = ring[i];
          const x = ((lng + 180) / 360) * w;
          const y = ((90 - lat) / 180) * h;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.fill();
      };
      if (g.type === 'Polygon') {
        for (const ring of g.coordinates as LngLatRing[]) drawRing(ring);
      } else if (g.type === 'MultiPolygon') {
        for (const poly of g.coordinates as LngLatRing[][])
          for (const ring of poly) drawRing(ring);
      }
    }
  };

  /* ── 颜色纹理 ── */
  const colorCanvas = document.createElement('canvas');
  colorCanvas.width = w;
  colorCanvas.height = h;
  const colorCtx = colorCanvas.getContext('2d')!;
  colorCtx.clearRect(0, 0, w, h);
  colorCtx.fillStyle = landColorHex;
  colorCtx.globalAlpha = landAlpha;
  paintLand(colorCtx);

  const useBump = bumpHeight > 0;
  const wSegs = useBump ? 128 : 64;
  const hSegs = useBump ? 96 : 48;
  const geo = new THREE.SphereGeometry(radius, wSegs, hSegs);

  /* ── 顶点位移 ── */
  if (useBump) {
    const maskCanvas = document.createElement('canvas');
    maskCanvas.width = w;
    maskCanvas.height = h;
    const maskCtx = maskCanvas.getContext('2d')!;
    maskCtx.clearRect(0, 0, w, h);
    maskCtx.fillStyle = '#ffffff';
    maskCtx.globalAlpha = 1;
    paintLand(maskCtx);
    const mask = maskCtx.getImageData(0, 0, w, h).data;

    const pos = geo.attributes.position;
    const uv = geo.attributes.uv;
    for (let i = 0; i < pos.count; i++) {
      const u = uv.getX(i);
      const v = uv.getY(i);
      const px = Math.min(Math.floor(u * w), w - 1);
      const py = Math.min(Math.floor((1 - v) * h), h - 1);
      if (mask[(py * w + px) * 4] > 128) {
        const x = pos.getX(i);
        const y = pos.getY(i);
        const z = pos.getZ(i);
        const len = Math.sqrt(x * x + y * y + z * z);
        const s = (len + bumpHeight) / len;
        pos.setXYZ(i, x * s, y * s, z * s);
      }
    }
    pos.needsUpdate = true;
    geo.computeVertexNormals();
  }

  const texture = new THREE.CanvasTexture(colorCanvas);
  const mat = new THREE.MeshBasicMaterial({
    map: texture,
    transparent: true,
    depthWrite: false,
    side: THREE.FrontSide,
  });

  const mesh = new THREE.Mesh(geo, mat);
  mesh.userData.landTextureMaterial = mat;
  return mesh;
}

/** `Line2` / `LineMaterial` linewidth is in CSS pixels — must match canvas pixel size. */
export function syncLandOutlineLine2Resolution(group: THREE.Group, width: number, height: number) {
  const m = group.userData.landLineMaterial as { resolution?: THREE.Vector2 } | undefined;
  if (m?.resolution) m.resolution.set(width, height);
}
