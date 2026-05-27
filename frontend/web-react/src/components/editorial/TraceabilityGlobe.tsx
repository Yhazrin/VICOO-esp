import { useEffect, useRef, useCallback, useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import type { SupplyChainTimelineRecord } from '@/types';
import TraceMediaGallery from '@/components/editorial/TraceMediaGallery';
import { getRecordLatLng } from '@/utils/supplyChainGeo';
import { latLngToVector3, createArcCurve } from '@/components/scroll/globeUtils';
import {
  buildLandOutlinesFromGeoJson,
  createLandTextureSphere,
  landOutlineRadius,
  LAND_OUTLINE_WIDTH_TRACEABILITY_PX,
  syncLandOutlineLine2Resolution,
} from '@/utils/globeLandOutlines';
import { resolveGlobeColors } from '@/utils/globeThemeColors';
import {
  globePinCardClassNames,
  resolveGlobePinCardTone,
  sampleWebGlBackdropLuminance,
  type GlobePinCardTone,
} from '@/utils/globePinCardContrast';
import type { ThemeId } from '@/stores/uiStore';

const GLOBE_RADIUS = 1.85;
const STAGE_ORDER = ['material_sourcing', 'processing', 'manufacturing', 'quality_check', 'shipping'];
const TOUCH_HINT_KEY = 'vicoo-globe-touch-hint';
const AUTO_ROTATE_FULL = 0.35;
const AUTO_ROTATE_SLOW = 0.06;

function canUseWebGL(): boolean {
  try {
    const c = document.createElement('canvas');
    return !!(c.getContext('webgl2') || c.getContext('webgl'));
  } catch {
    return false;
  }
}

/** Great-circle central angle in degrees (0–180). */
function centralAngleDeg(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δλ = ((lng2 - lng1) * Math.PI) / 180;
  const cosd = Math.sin(φ1) * Math.sin(φ2) + Math.cos(φ1) * Math.cos(φ2) * Math.cos(Δλ);
  return (Math.acos(Math.min(1, Math.max(-1, cosd))) * 180) / Math.PI;
}

function maxPairwiseSpanDeg(coords: { lat: number; lng: number }[]): number {
  if (coords.length < 2) return 72;
  let max = 0;
  for (let i = 0; i < coords.length; i++) {
    for (let j = i + 1; j < coords.length; j++) {
      max = Math.max(
        max,
        centralAngleDeg(coords[i].lat, coords[i].lng, coords[j].lat, coords[j].lng)
      );
    }
  }
  return max;
}

function layoutForGeographicSpread(maxSpanDeg: number, nodeCount: number) {
  const span = Math.max(maxSpanDeg, 1e-6);
  const t = THREE.MathUtils.clamp(span / 42, 0, 1);
  const markerRadiusMul = THREE.MathUtils.lerp(0.32, 1, t);
  const tubeRadiusMul = THREE.MathUtils.lerp(0.42, 1, t);
  const coneRadiusMul = THREE.MathUtils.lerp(0.48, 1, t);
  const coneHeightMul = THREE.MathUtils.lerp(0.55, 1, t);
  const jitterDeg =
    nodeCount > 1 && maxSpanDeg < 11
      ? THREE.MathUtils.lerp(0.52, 0.06, maxSpanDeg / 11)
      : 0;
  const radialBump = nodeCount > 1 && maxSpanDeg < 9 ? 0.022 : 0.012;
  return { markerRadiusMul, tubeRadiusMul, coneRadiusMul, coneHeightMul, jitterDeg, radialBump };
}

function jitteredLatLng(
  lat: number,
  lng: number,
  index: number,
  total: number,
  jitterDeg: number
): { lat: number; lng: number } {
  if (jitterDeg <= 0) return { lat, lng };
  const a = (index / Math.max(total, 1)) * Math.PI * 2 + 0.73 + index * 0.41;
  const cosLat = Math.max(0.2, Math.cos((lat * Math.PI) / 180));
  const dLat = Math.cos(a) * jitterDeg * 0.42;
  const dLng = (Math.sin(a) * jitterDeg * 0.42) / cosLat;
  return { lat: lat + dLat, lng: lng + dLng };
}

function sortSupplyRecords(records: SupplyChainTimelineRecord[]) {
  return [...records].sort((a, b) => {
    const ia = STAGE_ORDER.indexOf((a.stage ?? '').toLowerCase());
    const ib = STAGE_ORDER.indexOf((b.stage ?? '').toLowerCase());
    return (ia === -1 ? 999 : ia) - (ib === -1 ? 999 : ib) || a.id - b.id;
  });
}

function readThemeColors() {
  const cs = getComputedStyle(document.documentElement);
  const hex = (name: string, fallback: string) => {
    const v = cs.getPropertyValue(name).trim();
    return new THREE.Color(v || fallback);
  };
  return {
    wire: hex('--color-warm-gray', '#D4CFC4'),
    ink: hex('--color-ink', '#1A1A16'),
    rust: hex('--color-rust', '#8B3A2A'),
    sage: hex('--color-sage', '#3F4F45'),
    paper: hex('--color-paper', '#F5F0E8'),
  };
}

type ThemeSnapshot = ReturnType<typeof readThemeColors>;

type ThemeMats = {
  wire: THREE.MeshBasicMaterial;
  inner: THREE.MeshBasicMaterial;
  grid: THREE.LineBasicMaterial;
  rust: THREE.MeshBasicMaterial[];
};

type SegmentRunner = {
  curve: THREE.CubicBezierCurve3;
  arrow: THREE.Mesh;
  t: number;
  speed: number;
};

type GlobeCtx = {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
  controls: OrbitControls;
  globeGroup: THREE.Group;
  markers: Map<number, THREE.Mesh>;
  runners: SegmentRunner[];
  animationId: number;
  focus: null | { endCam: THREE.Vector3; endTarget: THREE.Vector3 };
  landGroup: THREE.Group | null;
  /** 用于射线检测「是否在星球上」——内层实心球 */
  globeHitMesh: THREE.Mesh;
  initialCameraPosition: THREE.Vector3;
  initialTarget: THREE.Vector3;
  themeMats: ThemeMats;
  oceanMat: THREE.MeshBasicMaterial | null;
  landSphere: THREE.Mesh | null;
};

/** 切换主题时只改材质/雾，不整场景重建（避免再解析 GeoJSON / WebGL 冷启动卡） */
function applyTraceabilityTheme(ctx: GlobeCtx, theme: ThemeSnapshot, themeId?: ThemeId) {
  const { themeMats: tm, scene, landGroup, markers, globeGroup } = ctx;
  tm.wire.color.copy(theme.wire);
  tm.inner.color.copy(theme.ink);
  tm.grid.color.copy(theme.wire);
  for (const m of tm.rust) {
    m.color.copy(theme.rust);
  }
  if (scene.fog instanceof THREE.Fog) {
    scene.fog.color.copy(theme.paper.clone().lerp(theme.wire, 0.14));
  }
  if (landGroup) {
    const c = theme.ink.clone().lerp(theme.sage, 0.22).lerp(theme.wire, 0.08);
    const thick = landGroup.userData.landLineMaterial as { color: THREE.Color } | undefined;
    if (thick) thick.color.copy(c);
    const thin = landGroup.userData.landOutlineMaterial as { color: THREE.Color } | undefined;
    if (thin) thin.color.copy(c);
  }
  markers.forEach((mesh) => {
    const mat = mesh.material as THREE.MeshStandardMaterial;
    mat.emissive.copy(theme.ink);
  });

  const tc = resolveGlobeColors((themeId ?? 'monochrome') as ThemeId);

  if (ctx.oceanMat) {
    ctx.oceanMat.color.setHex(tc.ocean);
    ctx.oceanMat.opacity = tc.oceanOpacity;
  }

  if (ctx.landSphere) {
    globeGroup.remove(ctx.landSphere);
    (ctx.landSphere.material as THREE.Material).dispose();
    ctx.landSphere.geometry.dispose();
    const isMobile = window.innerWidth < 768;
    const newLand = createLandTextureSphere(
      GLOBE_RADIUS * 0.998,
      tc.land,
      tc.landAlpha,
      isMobile ? 512 : 1024,
      GLOBE_RADIUS * 0.014,
    );
    globeGroup.add(newLand);
    ctx.landSphere = newLand;
  }
}

export interface TraceabilityGlobeProps {
  records: SupplyChainTimelineRecord[];
  selectedId: number | null;
  onSelect: (id: number | null) => void;
  getStageLabel: (stage: string) => string;
  prefersReducedMotion?: boolean;
  themeKey?: ThemeId | string;
  className?: string;
  /**
   * 作为全幅背景层：填满父级，不再用固定「卡片高度」约束，由外层控制占位与叠层。
   */
  ambientBackdrop?: boolean;
}

export default function TraceabilityGlobe({
  records,
  selectedId,
  onSelect,
  getStageLabel,
  prefersReducedMotion = false,
  themeKey = 'default',
  className = '',
  ambientBackdrop = false,
}: TraceabilityGlobeProps) {
  const { t } = useTranslation();
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ctxRef = useRef<GlobeCtx | null>(null);
  const themeRef = useRef<ThemeSnapshot>(readThemeColors());
  const selectedRef = useRef(selectedId);
  selectedRef.current = selectedId;
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;
  const sortedRef = useRef<SupplyChainTimelineRecord[]>([]);
  const [hoverId, setHoverId] = useState<number | null>(null);
  const hoverIdRef = useRef<number | null>(null);
  const pinOverlayRef = useRef<HTMLDivElement>(null);
  const overlayPickIdRef = useRef<number | null>(null);
  const prefersReducedMotionRef = useRef(prefersReducedMotion);
  prefersReducedMotionRef.current = prefersReducedMotion;

  const focusBreathUntilRef = useRef(0);
  const rotateEaseUntilRef = useRef(0);
  const prevSelectedRef = useRef(selectedId);

  const [webglOk, setWebglOk] = useState(() => canUseWebGL());
  const [touchHintVisible, setTouchHintVisible] = useState(false);
  const resolvedThemeId = (themeKey ?? 'monochrome') as ThemeId;
  const [cardTone, setCardTone] = useState<GlobePinCardTone>(() =>
    resolveGlobePinCardTone({ themeId: resolvedThemeId }),
  );
  const cardClasses = useMemo(() => globePinCardClassNames(cardTone), [cardTone]);

  const themeKeyRef = useRef(resolvedThemeId);
  themeKeyRef.current = resolvedThemeId;
  const setCardToneRef = useRef(setCardTone);
  setCardToneRef.current = setCardTone;
  const cardToneRef = useRef(cardTone);
  cardToneRef.current = cardTone;
  const lastBackdropSampleAtRef = useRef(0);

  const sorted = useMemo(() => sortSupplyRecords(records), [records]);

  useEffect(() => {
    const next = resolveGlobePinCardTone({ themeId: resolvedThemeId });
    cardToneRef.current = next;
    setCardTone(next);
  }, [resolvedThemeId]);

  const setFocus = useCallback((recordId: number | null) => {
    const ctx = ctxRef.current;
    if (!ctx) return;
    rotateEaseUntilRef.current = 0;
    if (!recordId) {
      ctx.focus = {
        endCam: ctx.initialCameraPosition.clone(),
        endTarget: ctx.initialTarget.clone(),
      };
      ctx.controls.autoRotate = false;
      return;
    }
    const mesh = ctx.markers.get(recordId);
    if (!mesh) return;
    const world = new THREE.Vector3();
    mesh.getWorldPosition(world);
    const dir = world.clone().normalize();
    ctx.focus = {
      endCam: dir.multiplyScalar(5.4),
      endTarget: world.clone(),
    };
    ctx.controls.autoRotate = false;
    if (!prefersReducedMotionRef.current) {
      ctx.controls.autoRotateSpeed = AUTO_ROTATE_SLOW;
    }
  }, []);

  useEffect(() => {
    setFocus(selectedId);
  }, [selectedId, setFocus]);

  useEffect(() => {
    if (selectedId !== prevSelectedRef.current && selectedId != null) {
      focusBreathUntilRef.current = performance.now() + 3200;
    }
    prevSelectedRef.current = selectedId;
  }, [selectedId]);

  const overlayPickId = hoverId ?? selectedId;

  useEffect(() => {
    overlayPickIdRef.current = overlayPickId ?? null;
  }, [overlayPickId]);

  const displayRecord = useMemo(() => {
    if (overlayPickId == null) return null;
    return sorted.find((r) => r.id === overlayPickId) ?? null;
  }, [overlayPickId, sorted]);

  const displayCoords = useMemo(() => {
    if (!displayRecord) return null;
    const idx = sorted.indexOf(displayRecord);
    return getRecordLatLng(displayRecord, idx, sorted.length);
  }, [displayRecord, sorted]);

  useEffect(() => {
    sortedRef.current = sorted;
  }, [sorted]);

  useEffect(() => {
    const coarse = window.matchMedia('(pointer: coarse)').matches;
    if (coarse && !localStorage.getItem(TOUCH_HINT_KEY)) {
      setTouchHintVisible(true);
    }
  }, []);

  const dismissTouchHint = useCallback(() => {
    setTouchHintVisible(false);
    try {
      localStorage.setItem(TOUCH_HINT_KEY, '1');
    } catch {
      /* ignore */
    }
  }, []);

  const captureSnapshot = useCallback(async () => {
    const ctx = ctxRef.current;
    if (!ctx) return;
    ctx.renderer.render(ctx.scene, ctx.camera);
    const canvas = ctx.renderer.domElement;
    const url = canvas.toDataURL('image/png');
    const base = displayRecord ? `trace-${displayRecord.id}` : 'trace-globe';
    if (navigator.share) {
      try {
        const blob = await (await fetch(url)).blob();
        const file = new File([blob], `${base}.png`, { type: 'image/png' });
        const sharePayload: ShareData = {
          files: [file],
          title: t('shop.detail.globeShareTitle'),
        };
        if (typeof navigator.canShare === 'function' && navigator.canShare({ files: [file] })) {
          await navigator.share(sharePayload);
          return;
        }
      } catch {
        /* fall through */
      }
    }
    const a = document.createElement('a');
    a.href = url;
    a.download = `${base}.png`;
    a.click();
  }, [displayRecord, t]);

  useEffect(() => {
    if (!webglOk || !canvasRef.current || !containerRef.current || records.length === 0) return;

    const canvas = canvasRef.current;
    const container = containerRef.current;
    themeRef.current = readThemeColors();
    const theme = themeRef.current;
    sortedRef.current = sorted;
    let cancelled = false;

    const scene = new THREE.Scene();
    scene.fog = new THREE.Fog(theme.paper.clone().lerp(theme.wire, 0.14), 16, 58);

    const camera = new THREE.PerspectiveCamera(
      48,
      container.clientWidth / Math.max(container.clientHeight, 1),
      0.05,
      5000
    );
    camera.position.set(0, 1.2, 5.2);

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        canvas,
        antialias: true,
        alpha: true,
        preserveDrawingBuffer: true,
      });
    } catch {
      setWebglOk(false);
      return;
    }
    if (!renderer.getContext()) {
      setWebglOk(false);
      renderer.dispose();
      return;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(container.clientWidth, container.clientHeight);

    const controls = new OrbitControls(camera, canvas);
    controls.enableDamping = true;
    controls.dampingFactor = 0.06;
    controls.minDistance = GLOBE_RADIUS * 1.02;
    controls.maxDistance = 4000;
    controls.zoomSpeed = 1.15;
    controls.enableZoom = false;
    const prm = prefersReducedMotionRef.current;
    controls.autoRotate = !prm;
    controls.autoRotateSpeed = prm ? 0 : AUTO_ROTATE_FULL;

    scene.add(new THREE.AmbientLight(0xfff2e6, 0.78));
    const key = new THREE.DirectionalLight(0xffead4, 1.05);
    key.position.set(4, 6, 5);
    scene.add(key);
    const rim = new THREE.DirectionalLight(0xa8bdd4, 0.42);
    rim.position.set(-5, 2, -6);
    scene.add(rim);

    const globeGroup = new THREE.Group();
    globeGroup.rotation.x = 0.3;
    scene.add(globeGroup);

    const isMobile = window.innerWidth < 768;
    const wireSegs = isMobile ? [24, 18] : [32, 24];

    const tc = resolveGlobeColors((themeKey ?? 'monochrome') as ThemeId);

    const wireGeo = new THREE.SphereGeometry(GLOBE_RADIUS, wireSegs[0], wireSegs[1]);
    const wireMat = new THREE.MeshBasicMaterial({
      color: theme.wire,
      wireframe: true,
      transparent: true,
      opacity: 0.34,
      depthWrite: false,
    });
    globeGroup.add(new THREE.Mesh(wireGeo, wireMat));

    /* ── Ocean sphere ── */
    const oceanGeo = new THREE.SphereGeometry(GLOBE_RADIUS * 0.998, isMobile ? 32 : 48, isMobile ? 24 : 36);
    const oceanMat = new THREE.MeshBasicMaterial({
      color: tc.ocean,
      transparent: true,
      opacity: tc.oceanOpacity,
      depthWrite: false,
    });
    globeGroup.add(new THREE.Mesh(oceanGeo, oceanMat));

    /* ── Land fill (canvas texture + vertex displacement) ── */
    const landSphere = createLandTextureSphere(
      GLOBE_RADIUS * 0.998,
      tc.land,
      tc.landAlpha,
      isMobile ? 512 : 1024,
      GLOBE_RADIUS * 0.014,
    );
    globeGroup.add(landSphere);

    const innerGeo = new THREE.SphereGeometry(GLOBE_RADIUS * 0.98, 32, 24);
    const innerMat = new THREE.MeshBasicMaterial({
      color: theme.ink,
      transparent: true,
      opacity: 0.065,
    });
    const globeHitMesh = new THREE.Mesh(innerGeo, innerMat);
    globeGroup.add(globeHitMesh);

    const gridGroup = new THREE.Group();
    const gridMat = new THREE.LineBasicMaterial({
      color: theme.wire,
      transparent: true,
      opacity: 0.14,
      depthWrite: false,
    });
    const rustMats: THREE.MeshBasicMaterial[] = [];
    for (let lat = -60; lat <= 60; lat += 30) {
      const points: THREE.Vector3[] = [];
      for (let lng = -180; lng <= 180; lng += 5) {
        points.push(latLngToVector3(lat, lng, GLOBE_RADIUS));
      }
      gridGroup.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(points), gridMat));
    }
    for (let lng = -180; lng < 180; lng += 30) {
      const points: THREE.Vector3[] = [];
      for (let lat = -90; lat <= 90; lat += 5) {
        points.push(latLngToVector3(lat, lng, GLOBE_RADIUS));
      }
      gridGroup.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(points), gridMat));
    }
    globeGroup.add(gridGroup);

    const landColor = theme.ink
      .clone()
      .lerp(theme.sage, 0.22)
      .lerp(theme.wire, 0.08);
    void import('@/data/world-land-110m.json').then((mod) => {
      if (cancelled || !ctxRef.current) return;
      const g = buildLandOutlinesFromGeoJson(
        mod.default as { features: { geometry?: { type: string; coordinates: unknown } }[] },
        landOutlineRadius(GLOBE_RADIUS),
        landColor,
        0.92,
        { lineWidthPx: LAND_OUTLINE_WIDTH_TRACEABILITY_PX }
      );
      globeGroup.add(g);
      const ctx0 = ctxRef.current;
      ctx0.landGroup = g;
      applyTraceabilityTheme(ctx0, themeRef.current, themeKey as ThemeId);
      if (container) {
        syncLandOutlineLine2Resolution(
          g,
          container.clientWidth,
          Math.max(container.clientHeight, 1),
        );
      }
    });

    const markers = new Map<number, THREE.Mesh>();
    const runners: SegmentRunner[] = [];

    const rawCoords = sorted.map((rec, index) => getRecordLatLng(rec, index, sorted.length));
    const maxSpanDeg = maxPairwiseSpanDeg(rawCoords);
    const spreadLayout = layoutForGeographicSpread(maxSpanDeg, sorted.length);
    const markerBaseR = isMobile ? 0.065 : 0.078;
    const markerR = markerBaseR * spreadLayout.markerRadiusMul;
    const tubeCoreR = (isMobile ? 0.006 : 0.008) * spreadLayout.tubeRadiusMul;
    const coneBaseR = (isMobile ? 0.045 : 0.055) * spreadLayout.coneRadiusMul;
    const coneH = 0.12 * spreadLayout.coneHeightMul;

    const vizLatLng = (index: number) =>
      jitteredLatLng(
        rawCoords[index].lat,
        rawCoords[index].lng,
        index,
        sorted.length,
        spreadLayout.jitterDeg
      );

    sorted.forEach((rec, index) => {
      const { lat, lng } = vizLatLng(index);
      const lift = GLOBE_RADIUS + 0.036 + index * spreadLayout.radialBump;
      const pos = latLngToVector3(lat, lng, lift);
      const markerGeo = new THREE.SphereGeometry(markerR, 16, 16);
      const mat = new THREE.MeshStandardMaterial({
        color: theme.sage,
        emissive: theme.ink,
        emissiveIntensity: 0.12,
        roughness: 0.45,
        metalness: 0.15,
      });
      const m = new THREE.Mesh(markerGeo, mat);
      m.position.copy(pos);
      m.userData.recordId = rec.id;
      globeGroup.add(m);
      markers.set(rec.id, m);
    });

    for (let i = 0; i < sorted.length - 1; i++) {
      const { lat: lat1, lng: lng1 } = vizLatLng(i);
      const { lat: lat2, lng: lng2 } = vizLatLng(i + 1);
      const arcLiftA = GLOBE_RADIUS + 0.028 + i * spreadLayout.radialBump * 0.85;
      const arcLiftB = GLOBE_RADIUS + 0.028 + (i + 1) * spreadLayout.radialBump * 0.85;
      const start = latLngToVector3(lat1, lng1, arcLiftA);
      const end = latLngToVector3(lat2, lng2, arcLiftB);
      const curve = createArcCurve(start, end, GLOBE_RADIUS);
      const tubeGeo = new THREE.TubeGeometry(curve, isMobile ? 20 : 36, tubeCoreR, 6, false);
      const tubeMat = new THREE.MeshBasicMaterial({
        color: theme.rust,
        transparent: true,
        opacity: 0.48,
      });
      rustMats.push(tubeMat);
      globeGroup.add(new THREE.Mesh(tubeGeo, tubeMat));

      const coneGeo = new THREE.ConeGeometry(coneBaseR, coneH, 8);
      const coneMat = new THREE.MeshBasicMaterial({
        color: theme.rust,
        transparent: true,
        opacity: 0.92,
      });
      rustMats.push(coneMat);
      const arrow = new THREE.Mesh(coneGeo, coneMat);
      arrow.position.copy(curve.getPoint(0));
      const tan = curve.getTangent(0).normalize();
      arrow.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), tan);
      globeGroup.add(arrow);
      runners.push({
        curve,
        arrow,
        t: i / Math.max(sorted.length - 1, 1),
        speed: 0.007 + i * 0.0015,
      });
    }

    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();

    const pickMarker = (clientX: number, clientY: number): number | null => {
      const ctx = ctxRef.current;
      if (!ctx) return null;
      const rect = canvas.getBoundingClientRect();
      pointer.x = ((clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointer, camera);
      const meshes = Array.from(ctx.markers.values());
      const hits = raycaster.intersectObjects(meshes, false);
      if (hits.length > 0) {
        return hits[0].object.userData.recordId as number;
      }
      const hitPt = new THREE.Vector3();
      let bestId: number | null = null;
      let bestT = Infinity;
      for (const m of meshes) {
        const g = m.geometry;
        if (!g.boundingSphere) g.computeBoundingSphere();
        const sphere = new THREE.Sphere().copy(g.boundingSphere!);
        sphere.applyMatrix4(m.matrixWorld);
        const hit = raycaster.ray.intersectSphere(sphere, hitPt);
        if (hit !== null) {
          const dist = raycaster.ray.origin.distanceTo(hit);
          if (dist > 1e-6 && dist < bestT) {
            bestT = dist;
            bestId = m.userData.recordId as number;
          }
        }
      }
      return bestId;
    };

    const onPointerDown = (e: PointerEvent) => {
      dismissTouchHint();
      const id = pickMarker(e.clientX, e.clientY);
      if (id != null) {
        const ctx = ctxRef.current;
        if (ctx) ctx.controls.autoRotate = false;
        if (id === selectedRef.current) {
          onSelectRef.current(null);
        } else {
          onSelectRef.current(id);
        }
      }
    };

    const onPointerMove = (e: PointerEvent) => {
      const id = pickMarker(e.clientX, e.clientY);
      if (id !== hoverIdRef.current) {
        hoverIdRef.current = id;
        setHoverId(id);
      }
    };

    const onPointerLeave = () => {
      hoverIdRef.current = null;
      setHoverId(null);
    };

    canvas.addEventListener('pointerdown', onPointerDown);
    canvas.addEventListener('pointermove', onPointerMove);
    canvas.addEventListener('pointerleave', onPointerLeave);

    const initialCameraPosition = camera.position.clone();
    const initialTarget = controls.target.clone();

    const onWheel = (e: WheelEvent) => {
      const c = ctxRef.current;
      if (!c) return;
      const rect = canvas.getBoundingClientRect();
      if (e.clientX < rect.left || e.clientX > rect.right || e.clientY < rect.top || e.clientY > rect.bottom) {
        return;
      }
      pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointer, camera);
      if (raycaster.intersectObject(c.globeHitMesh, false).length === 0) return;

      e.preventDefault();
      e.stopPropagation();

      const scale = Math.pow(0.92, e.deltaY * 0.01);
      const offset = new THREE.Vector3().copy(camera.position).sub(controls.target);
      let dist = offset.length();
      dist *= scale;
      dist = THREE.MathUtils.clamp(dist, controls.minDistance, controls.maxDistance);
      offset.normalize().multiplyScalar(dist);
      camera.position.copy(controls.target).add(offset);
      controls.update();
    };
    canvas.addEventListener('wheel', onWheel, { passive: false });

    const themeMats: ThemeMats = { wire: wireMat, inner: innerMat, grid: gridMat, rust: rustMats };

    const ctx: GlobeCtx = {
      scene,
      camera,
      renderer,
      controls,
      globeGroup,
      markers,
      runners,
      animationId: 0,
      focus: null,
      landGroup: null,
      globeHitMesh,
      initialCameraPosition,
      initialTarget,
      themeMats,
      oceanMat,
      landSphere,
    };
    ctxRef.current = ctx;

    const updatePinOverlay = (gc: GlobeCtx) => {
      const el = pinOverlayRef.current;
      const containerEl = containerRef.current;
      const pick = overlayPickIdRef.current;
      if (!el || !containerEl) return;
      if (pick == null) {
        el.style.opacity = '0';
        return;
      }
      const mesh = gc.markers.get(pick);
      if (!mesh) {
        el.style.opacity = '0';
        return;
      }
      const world = new THREE.Vector3();
      mesh.getWorldPosition(world);
      const projected = world.clone().project(gc.camera);
      if (projected.z >= 1) {
        el.style.opacity = '0';
        return;
      }
      const rect = containerEl.getBoundingClientRect();
      const w = rect.width;
      const h = rect.height;
      const x = (projected.x * 0.5 + 0.5) * w;
      const y = (-projected.y * 0.5 + 0.5) * h;
      const nx = x / Math.max(w, 1);
      const ny = y / Math.max(h, 1);
      const halfW = 144;
      const halfH = 110;
      const gap = 12;
      let transform = `translate(-50%, calc(-50% - ${gap + halfH}px))`;
      if (nx < 0.38) {
        transform = `translate(calc(-50% + ${gap + halfW}px), -50%)`;
      } else if (nx > 0.62) {
        transform = `translate(calc(-50% - ${gap + halfW}px), -50%)`;
      } else if (ny < 0.32) {
        transform = `translate(-50%, calc(-50% + ${gap + halfH}px))`;
      }
      el.style.opacity = '1';
      el.style.left = `${x}px`;
      el.style.top = `${y}px`;
      el.style.transform = transform;

      const nowSample = performance.now();
      if (nowSample - lastBackdropSampleAtRef.current >= 140) {
        lastBackdropSampleAtRef.current = nowSample;
        let sampleX = x;
        let sampleY = y - (gap + halfH);
        if (nx < 0.38 || nx > 0.62) {
          sampleY = y;
        } else if (ny < 0.32) {
          sampleY = y + gap + halfH;
        }
        const sampled = sampleWebGlBackdropLuminance(gc.renderer, rect, sampleX, sampleY);
        const nextTone = resolveGlobePinCardTone({
          themeId: themeKeyRef.current,
          sampledLuminance: sampled,
        });
        if (nextTone !== cardToneRef.current) {
          cardToneRef.current = nextTone;
          setCardToneRef.current(nextTone);
        }
      }
    };

    let time = 0;
    const animate = () => {
      const c = ctxRef.current;
      if (!c) return;
      c.animationId = requestAnimationFrame(animate);
      time += 1;
      const prmNow = prefersReducedMotionRef.current;
      const now = performance.now();

      if (c.controls.autoRotate && !prmNow && now < rotateEaseUntilRef.current) {
        const u = 1 - (rotateEaseUntilRef.current - now) / 2200;
        c.controls.autoRotateSpeed = THREE.MathUtils.lerp(AUTO_ROTATE_SLOW, AUTO_ROTATE_FULL, u * u);
      } else if (c.controls.autoRotate && !prmNow) {
        c.controls.autoRotateSpeed = AUTO_ROTATE_FULL;
      }

      const sel = selectedRef.current;
      const breathT = now < focusBreathUntilRef.current && !prmNow && sel != null;
      const breath = breathT ? Math.sin(time * 0.055) * 0.045 : 0;

      const pal = themeRef.current;
      c.markers.forEach((mesh, id) => {
        const mat = mesh.material as THREE.MeshStandardMaterial;
        const isSel = id === sel;
        const isHov = id === hoverIdRef.current;
        if (isSel) {
          mat.color.copy(pal.rust);
          mat.emissiveIntensity = 0.24;
          mesh.scale.setScalar(1.22 + breath);
        } else if (isHov) {
          mat.color.copy(pal.sage.clone().lerp(pal.rust, 0.5));
          mat.emissiveIntensity = 0.18;
          mesh.scale.setScalar(1.04);
        } else {
          mat.color.copy(pal.sage);
          mat.emissiveIntensity = 0.12;
          mesh.scale.setScalar(0.76);
        }
      });

      for (const run of c.runners) {
        run.t += run.speed;
        if (run.t > 1) run.t -= 1;
        const p = run.curve.getPoint(run.t);
        const tng = run.curve.getTangent(run.t).normalize();
        run.arrow.position.copy(p);
        run.arrow.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), tng);
        const am = run.arrow.material as THREE.MeshBasicMaterial;
        if (prmNow) {
          am.opacity = 0.78;
        } else {
          am.opacity = 0.65 + Math.sin(time * 0.04 + run.t * Math.PI * 2) * 0.28;
        }
      }

      if (c.focus) {
        c.controls.autoRotate = false;
        camera.position.lerp(c.focus.endCam, 0.07);
        c.controls.target.lerp(c.focus.endTarget, 0.07);
        if (camera.position.distanceTo(c.focus.endCam) < 0.08) {
          camera.position.copy(c.focus.endCam);
          c.controls.target.copy(c.focus.endTarget);
          c.focus = null;
          if (selectedRef.current == null && !prmNow) {
            c.controls.autoRotate = true;
            rotateEaseUntilRef.current = performance.now() + 2200;
            c.controls.autoRotateSpeed = AUTO_ROTATE_SLOW;
          }
        }
      }

      c.controls.update();
      c.renderer.render(c.scene, c.camera);
      updatePinOverlay(c);
    };
    animate();

    const onResize = () => {
      const c = ctxRef.current;
      if (!c || !container) return;
      const w = container.clientWidth;
      const h = Math.max(container.clientHeight, 1);
      c.camera.aspect = w / h;
      c.camera.updateProjectionMatrix();
      c.renderer.setSize(w, h);
      if (c.landGroup) syncLandOutlineLine2Resolution(c.landGroup, w, h);
    };
    const ro = new ResizeObserver(onResize);
    ro.observe(container);

    const onKeyDown = (e: KeyboardEvent) => {
      if (document.activeElement !== containerRef.current) return;
      if (e.key === 'Escape') {
        if (selectedRef.current != null) {
          e.preventDefault();
          onSelectRef.current(null);
        }
        return;
      }
      if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) return;
      const c = ctxRef.current;
      if (!c) return;
      e.preventDefault();
      const { camera: cam, controls: ctl } = c;
      const offset = new THREE.Vector3().copy(cam.position).sub(ctl.target);
      const spherical = new THREE.Spherical().setFromVector3(offset);
      const step = 0.09;
      if (e.key === 'ArrowLeft') spherical.theta -= step;
      if (e.key === 'ArrowRight') spherical.theta += step;
      if (e.key === 'ArrowUp') spherical.phi -= step;
      if (e.key === 'ArrowDown') spherical.phi += step;
      spherical.phi = Math.max(0.12, Math.min(Math.PI - 0.12, spherical.phi));
      offset.setFromSpherical(spherical);
      cam.position.copy(ctl.target).add(offset);
      ctl.update();
    };
    container.addEventListener('keydown', onKeyDown);

    return () => {
      cancelled = true;
      ro.disconnect();
      container.removeEventListener('keydown', onKeyDown);
      canvas.removeEventListener('pointerdown', onPointerDown);
      canvas.removeEventListener('pointermove', onPointerMove);
      canvas.removeEventListener('pointerleave', onPointerLeave);
      canvas.removeEventListener('wheel', onWheel);
      const last = ctxRef.current;
      if (last) {
        cancelAnimationFrame(last.animationId);
        ctxRef.current = null;
        const seenMat = new Set<THREE.Material>();
        last.globeGroup.traverse((obj) => {
          if ((obj as THREE.Mesh).isMesh) {
            const m = obj as THREE.Mesh;
            m.geometry?.dispose();
            const mat = m.material as THREE.Material;
            if (mat && !seenMat.has(mat)) {
              mat.dispose();
              seenMat.add(mat);
            }
          } else if ((obj as THREE.Line).isLine) {
            const ln = obj as THREE.Line;
            ln.geometry?.dispose();
            const mat = ln.material as THREE.Material;
            if (mat && !seenMat.has(mat)) {
              mat.dispose();
              seenMat.add(mat);
            }
          }
        });
      }
      controls.dispose();
      renderer.dispose();
    };
  }, [records, sorted, webglOk, dismissTouchHint]);

  useEffect(() => {
    const next = readThemeColors();
    themeRef.current = next;
    const c = ctxRef.current;
    if (c) applyTraceabilityTheme(c, next, themeKey as ThemeId);
  }, [themeKey]);

  useEffect(() => {
    const ctx = ctxRef.current;
    if (!ctx) return;
    const prm = prefersReducedMotion;
    if (prm) {
      ctx.controls.autoRotate = false;
      ctx.controls.autoRotateSpeed = 0;
      return;
    }
    if (selectedRef.current != null) {
      ctx.controls.autoRotate = false;
      return;
    }
    if (ctx.focus != null) return;
    ctx.controls.autoRotate = true;
    ctx.controls.autoRotateSpeed = AUTO_ROTATE_FULL;
  }, [prefersReducedMotion, selectedId]);

  if (records.length === 0) return null;

  const precise =
    displayRecord?.latitude != null &&
    displayRecord?.longitude != null &&
    !Number.isNaN(displayRecord.latitude) &&
    !Number.isNaN(displayRecord.longitude);

  const carbonKg = displayRecord?.carbon_kg ?? displayRecord?.carbonFootprint;

  if (!webglOk) {
    return (
      <div
        className={`relative w-full min-w-0 bg-transparent py-2 flex flex-col gap-3 ${
          ambientBackdrop ? 'min-h-[70dvh] h-full' : 'min-h-[70dvh]'
        } ${className}`}
      >
        <p className="font-body text-caption text-ink-faded">{t('shop.detail.globeWebglFallback')}</p>
        <ul className="space-y-2 overflow-auto text-left">
          {sorted.map((r) => (
            <li key={r.id}>
              <button
                type="button"
                onClick={() => onSelect(selectedId === r.id ? null : r.id)}
                className="w-full text-left font-body text-caption py-2 px-1 border-b border-warm-gray/20 hover:border-warm-gray/40 border-t-0 border-x-0 rounded-none"
              >
                <span className="font-medium text-ink">{getStageLabel(r.stage)}</span>
                <span className="block text-sepia-mid">{r.location}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      tabIndex={0}
      role="application"
      data-pin-active={selectedId != null ? 'true' : 'false'}
      aria-label={t('shop.detail.globeAria')}
      onPointerDownCapture={() => containerRef.current?.focus({ preventScroll: true })}
      className={`relative z-0 w-full min-w-0 max-w-none bg-transparent outline-none focus-visible:ring-2 focus-visible:ring-rust/35 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent ${
        ambientBackdrop
          ? 'h-full min-h-[100dvh]'
          : 'min-h-[100dvh] md:min-h-[115dvh]'
      } ${className}`}
    >
      <canvas
        ref={canvasRef}
        className="absolute inset-0 block h-full w-full cursor-grab active:cursor-grabbing touch-none"
      />

      {touchHintVisible && (
        <p className="absolute bottom-1 left-1/2 -translate-x-1/2 z-[5] max-w-[95%] text-center font-body text-[10px] text-ink-faded px-2 pointer-events-none md:hidden [text-shadow:0_1px_2px_var(--color-paper),0_0_12px_var(--color-paper)]">
          {t('shop.detail.globeTouchHint')}
        </p>
      )}

      <div className="absolute top-1 right-1 z-20 flex flex-col items-end gap-1">
        <button
          type="button"
          onClick={() => void captureSnapshot()}
          className="font-body text-[10px] tracking-wide uppercase px-2 py-1 text-ink-faded hover:text-ink bg-paper/50 backdrop-blur-sm border border-warm-gray/25 cursor-pointer transition-colors"
        >
          {t('shop.detail.globeShareSnapshot')}
        </button>
      </div>

      {displayRecord && displayCoords && (
        <div
          ref={pinOverlayRef}
          className="absolute z-10 w-[min(92vw,288px)] pointer-events-none max-h-[min(72dvh,520px)]"
          style={{ opacity: 0, left: 0, top: 0 }}
          aria-live="polite"
        >
          <div
            className={`pointer-events-auto relative overflow-x-hidden overflow-y-auto max-h-[min(72dvh,520px)] px-4 py-3.5 backdrop-blur-md rounded-sm space-y-2 transition-colors duration-300 ${cardClasses.shell}`}
          >
            <div
              className={`absolute top-0 left-4 right-4 h-px pointer-events-none ${cardClasses.accentLine}`}
              aria-hidden="true"
            />
            <p className={`font-display text-base font-bold leading-snug ${cardClasses.title}`}>
              {getStageLabel(displayRecord.stage)}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {displayRecord.verified ? (
                <span className="font-body text-[10px] tracking-wider uppercase px-2 py-0.5 bg-sage/15 text-sage border border-sage/30">
                  {t('shop.detail.globeCertified')}
                </span>
              ) : (
                <span
                  className={`font-body text-[10px] tracking-wider uppercase px-2 py-0.5 border ${cardClasses.uncertifiedBadge}`}
                >
                  {t('shop.detail.globeUncertified')}
                </span>
              )}
              {carbonKg != null && !Number.isNaN(Number(carbonKg)) && (
                <span className="font-body text-[10px] tracking-wider uppercase px-2 py-0.5 bg-rust/10 text-rust border border-rust/25">
                  {t('shop.detail.globeCarbonBadge', { kg: Number(carbonKg).toFixed(2) })}
                </span>
              )}
            </div>
            {displayRecord.carbon_note && (
              <p className={`font-body text-[11px] leading-snug ${cardClasses.muted}`}>
                {displayRecord.carbon_note}
              </p>
            )}
            <p className={`font-body text-caption ${cardClasses.body}`}>
              {displayRecord.location}
              {displayRecord.date ? ` · ${displayRecord.date}` : ''}
            </p>
            <p className={`font-mono text-[11px] leading-relaxed ${cardClasses.mono}`}>
              {precise ? t('shop.detail.coordsRegistered') : t('shop.detail.coordsDerived')}{' '}
              {displayCoords.lat.toFixed(4)}°, {displayCoords.lng.toFixed(4)}°
            </p>
            {displayRecord.description && (
              <p className={`font-body text-body-sm leading-relaxed line-clamp-4 ${cardClasses.description}`}>
                {displayRecord.description}
              </p>
            )}
            {displayRecord.gallery && displayRecord.gallery.length > 0 && (
              <TraceMediaGallery
                items={displayRecord.gallery}
                compact
                className={`pt-1 border-t ${cardClasses.galleryBorder}`}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
