import { useEffect, useRef, useCallback, useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import type { SupplyChainTimelineRecord } from '@/types';
import { getRecordLatLng } from '@/utils/supplyChainGeo';
import { latLngToVector3, createArcCurve } from '@/components/scroll/globeUtils';

const GLOBE_RADIUS = 1.85;
const STAGE_ORDER = ['material_sourcing', 'processing', 'manufacturing', 'quality_check', 'shipping'];

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
  };
}

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
};

export interface TraceabilityGlobeProps {
  records: SupplyChainTimelineRecord[];
  selectedId: number | null;
  onSelect: (id: number | null) => void;
  getStageLabel: (stage: string) => string;
  /** 切换主题时传入以重建材质颜色 */
  themeKey?: string;
  className?: string;
}

export default function TraceabilityGlobe({
  records,
  selectedId,
  onSelect,
  getStageLabel,
  themeKey = 'default',
  className = '',
}: TraceabilityGlobeProps) {
  const { t } = useTranslation();
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ctxRef = useRef<GlobeCtx | null>(null);
  const selectedRef = useRef(selectedId);
  selectedRef.current = selectedId;
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;
  const sortedRef = useRef<SupplyChainTimelineRecord[]>([]);
  const [hoverId, setHoverId] = useState<number | null>(null);
  const hoverIdRef = useRef<number | null>(null);

  const sorted = useMemo(() => sortSupplyRecords(records), [records]);

  const setFocus = useCallback((recordId: number | null) => {
    const ctx = ctxRef.current;
    if (!ctx) return;
    if (!recordId) {
      ctx.focus = null;
      ctx.controls.autoRotate = true;
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
  }, []);

  useEffect(() => {
    setFocus(selectedId);
  }, [selectedId, setFocus]);

  const displayRecord = useMemo(() => {
    const id = hoverId ?? selectedId;
    if (id == null) return null;
    return sorted.find((r) => r.id === id) ?? null;
  }, [hoverId, selectedId, sorted]);

  const displayCoords = useMemo(() => {
    if (!displayRecord) return null;
    const idx = sorted.indexOf(displayRecord);
    return getRecordLatLng(displayRecord, idx, sorted.length);
  }, [displayRecord, sorted]);

  useEffect(() => {
    sortedRef.current = sorted;
  }, [sorted]);

  useEffect(() => {
    if (!canvasRef.current || !containerRef.current || records.length === 0) return;

    const canvas = canvasRef.current;
    const container = containerRef.current;
    const theme = readThemeColors();
    sortedRef.current = sorted;

    const scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(
      48,
      container.clientWidth / Math.max(container.clientHeight, 1),
      0.1,
      100
    );
    camera.position.set(0, 1.2, 5.2);

    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(container.clientWidth, container.clientHeight);

    const controls = new OrbitControls(camera, canvas);
    controls.enableDamping = true;
    controls.dampingFactor = 0.06;
    controls.minDistance = 3.2;
    controls.maxDistance = 10;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 0.35;

    scene.add(new THREE.AmbientLight(0xfff5eb, 0.75));
    const key = new THREE.DirectionalLight(0xffe8d0, 0.95);
    key.position.set(4, 6, 5);
    scene.add(key);

    const globeGroup = new THREE.Group();
    globeGroup.rotation.x = 0.3;
    scene.add(globeGroup);

    const isMobile = window.innerWidth < 768;
    const wireSegs = isMobile ? [24, 18] : [32, 24];

    const wireGeo = new THREE.SphereGeometry(GLOBE_RADIUS, wireSegs[0], wireSegs[1]);
    const wireMat = new THREE.MeshBasicMaterial({
      color: theme.wire,
      wireframe: true,
      transparent: true,
      opacity: 0.22,
    });
    globeGroup.add(new THREE.Mesh(wireGeo, wireMat));

    const innerGeo = new THREE.SphereGeometry(GLOBE_RADIUS * 0.98, 32, 24);
    const innerMat = new THREE.MeshBasicMaterial({
      color: theme.ink,
      transparent: true,
      opacity: 0.035,
    });
    globeGroup.add(new THREE.Mesh(innerGeo, innerMat));

    const gridGroup = new THREE.Group();
    const gridMat = new THREE.LineBasicMaterial({
      color: theme.wire,
      transparent: true,
      opacity: 0.07,
    });
    for (let lat = -60; lat <= 60; lat += 30) {
      const points: THREE.Vector3[] = [];
      for (let lng = 0; lng <= 360; lng += 5) {
        const phi = (90 - lat) * (Math.PI / 180);
        const theta = lng * (Math.PI / 180);
        points.push(
          new THREE.Vector3(
            -GLOBE_RADIUS * Math.sin(phi) * Math.cos(theta),
            GLOBE_RADIUS * Math.cos(phi),
            GLOBE_RADIUS * Math.sin(phi) * Math.sin(theta)
          )
        );
      }
      gridGroup.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(points), gridMat));
    }
    for (let lng = 0; lng < 360; lng += 30) {
      const points: THREE.Vector3[] = [];
      for (let lat = -90; lat <= 90; lat += 5) {
        const phi = (90 - lat) * (Math.PI / 180);
        const theta = lng * (Math.PI / 180);
        points.push(
          new THREE.Vector3(
            -GLOBE_RADIUS * Math.sin(phi) * Math.cos(theta),
            GLOBE_RADIUS * Math.cos(phi),
            GLOBE_RADIUS * Math.sin(phi) * Math.sin(theta)
          )
        );
      }
      gridGroup.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(points), gridMat));
    }
    globeGroup.add(gridGroup);

    const markers = new Map<number, THREE.Mesh>();
    const runners: SegmentRunner[] = [];

    sorted.forEach((rec, index) => {
      const { lat, lng } = getRecordLatLng(rec, index, sorted.length);
      const pos = latLngToVector3(lat, lng, GLOBE_RADIUS + 0.04);
      const markerGeo = new THREE.SphereGeometry(isMobile ? 0.065 : 0.078, 16, 16);
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
      const a = sorted[i];
      const b = sorted[i + 1];
      const { lat: lat1, lng: lng1 } = getRecordLatLng(a, i, sorted.length);
      const { lat: lat2, lng: lng2 } = getRecordLatLng(b, i + 1, sorted.length);
      const start = latLngToVector3(lat1, lng1, GLOBE_RADIUS + 0.03);
      const end = latLngToVector3(lat2, lng2, GLOBE_RADIUS + 0.03);
      const curve = createArcCurve(start, end, GLOBE_RADIUS);
      const tubeGeo = new THREE.TubeGeometry(curve, isMobile ? 20 : 36, isMobile ? 0.006 : 0.008, 6, false);
      const tubeMat = new THREE.MeshBasicMaterial({
        color: theme.rust,
        transparent: true,
        opacity: 0.38,
      });
      globeGroup.add(new THREE.Mesh(tubeGeo, tubeMat));

      const coneGeo = new THREE.ConeGeometry(isMobile ? 0.045 : 0.055, 0.12, 8);
      const coneMat = new THREE.MeshBasicMaterial({
        color: theme.rust,
        transparent: true,
        opacity: 0.92,
      });
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
      return null;
    };

    const onPointerDown = (e: PointerEvent) => {
      const id = pickMarker(e.clientX, e.clientY);
      if (id != null) {
        const ctx = ctxRef.current;
        if (ctx) ctx.controls.autoRotate = false;
        onSelectRef.current(id);
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
    };
    ctxRef.current = ctx;

    let time = 0;
    const animate = () => {
      const c = ctxRef.current;
      if (!c) return;
      c.animationId = requestAnimationFrame(animate);
      time += 1;

      const sel = selectedRef.current;
      c.markers.forEach((mesh, id) => {
        const mat = mesh.material as THREE.MeshStandardMaterial;
        const isSel = id === sel;
        const isHover = id === hoverIdRef.current;
        const active = isSel || isHover;
        mat.color.copy(active ? theme.rust : theme.sage);
        mat.emissiveIntensity = active ? 0.22 : 0.12;
        mesh.scale.setScalar(active ? 1.28 : 1);
      });

      for (const run of c.runners) {
        run.t += run.speed;
        if (run.t > 1) run.t -= 1;
        const p = run.curve.getPoint(run.t);
        const tng = run.curve.getTangent(run.t).normalize();
        run.arrow.position.copy(p);
        run.arrow.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), tng);
        const mat = run.arrow.material as THREE.MeshBasicMaterial;
        mat.opacity = 0.65 + Math.sin(time * 0.04 + run.t * Math.PI * 2) * 0.28;
      }

      if (c.focus) {
        c.controls.autoRotate = false;
        camera.position.lerp(c.focus.endCam, 0.07);
        c.controls.target.lerp(c.focus.endTarget, 0.07);
        if (camera.position.distanceTo(c.focus.endCam) < 0.07) {
          c.focus = null;
        }
      }

      c.controls.update();
      c.renderer.render(c.scene, c.camera);
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
    };
    const ro = new ResizeObserver(onResize);
    ro.observe(container);

    return () => {
      ro.disconnect();
      canvas.removeEventListener('pointerdown', onPointerDown);
      canvas.removeEventListener('pointermove', onPointerMove);
      canvas.removeEventListener('pointerleave', onPointerLeave);
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
  }, [records, sorted, themeKey]);

  if (records.length === 0) return null;

  const precise =
    displayRecord?.latitude != null &&
    displayRecord?.longitude != null &&
    !Number.isNaN(displayRecord.latitude) &&
    !Number.isNaN(displayRecord.longitude);

  return (
    <div
      ref={containerRef}
      className={`relative w-full min-h-[320px] md:min-h-[440px] rounded-sm border border-warm-gray/25 bg-aged-stock/40 ${className}`}
    >
      <canvas
        ref={canvasRef}
        className="block w-full h-full min-h-[320px] md:min-h-[440px] cursor-grab active:cursor-grabbing"
      />

      {displayRecord && displayCoords && (
        <div
          className="absolute z-10 w-[min(92vw,288px)] pointer-events-none max-md:bottom-3 max-md:left-1/2 max-md:-translate-x-1/2 md:right-5 md:top-1/2 md:-translate-y-1/2"
          aria-live="polite"
        >
          <div className="pointer-events-auto border border-warm-gray/35 bg-paper/95 px-4 py-3 shadow-lg backdrop-blur-md rounded-sm space-y-2">
            <p className="font-display text-base font-bold text-ink leading-snug">
              {getStageLabel(displayRecord.stage)}
            </p>
            <p className="font-body text-caption text-sepia-mid">
              {displayRecord.location}
              {displayRecord.date ? ` · ${displayRecord.date}` : ''}
            </p>
            <p className="font-mono text-[11px] text-ink-faded leading-relaxed">
              {precise ? t('shop.detail.coordsRegistered') : t('shop.detail.coordsDerived')}{' '}
              {displayCoords.lat.toFixed(4)}°, {displayCoords.lng.toFixed(4)}°
            </p>
            {displayRecord.description && (
              <p className="font-body text-body-sm text-ink-faded leading-relaxed line-clamp-4">
                {displayRecord.description}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
