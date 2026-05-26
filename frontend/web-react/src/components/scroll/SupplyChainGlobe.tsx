import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { useReducedMotion } from 'framer-motion';
import type { SupplyChainRoute } from '@/data/supplyChain';
import { createRouteVisuals, latLngToVector3 } from './globeUtils';
import {
  createLandOutlinesGroup,
  landOutlineRadius,
  LAND_OUTLINE_WIDTH_SUPPLY_CHAIN_PX,
  syncLandOutlineLine2Resolution,
} from '@/utils/globeLandOutlines';

/* ─── Brand palette hex → Three.js color ints ─── */
const COLORS = {
  wireframe: 0xC4B9A8, // warm-gray
  ink: 0x1A1A16,
};

const GLOBE_RADIUS = 1.8;

interface ParticleState {
  mesh: THREE.Mesh;
  curve: THREE.CubicBezierCurve3;
  t: number;
  speed: number;
}

interface GlobeSceneState {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
  controls: OrbitControls;
  globeGroup: THREE.Group;
  particles: ParticleState[];
  animationId: number;
  landGroup: THREE.Group | null;
}

interface SupplyChainGlobeProps {
  routes: SupplyChainRoute[];
  /** When true, stops rAF and disables gestures but keeps the WebGL context (e.g. when switching away from welfare tab) */
  suspended?: boolean;
  /** When true, does not fade opacity on scroll (used for the persistent globe in the Layout layer) */
  lockOpacity?: boolean;
}

export default function SupplyChainGlobe({
  routes,
  suspended = false,
  lockOpacity = false,
}: SupplyChainGlobeProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sceneRef = useRef<GlobeSceneState | null>(null);
  const tickRef = useRef<(() => void) | null>(null);
  const suspendedRef = useRef(suspended);
  suspendedRef.current = suspended;
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    if (!canvasRef.current || prefersReducedMotion) return;

    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!container) return;

    const lock = lockOpacity;

    let cancelled = false;
    const isMobile = window.innerWidth < 768;

    /* ── Scene ── */
    const scene = new THREE.Scene();
    scene.background = null;

    /* ── Camera ── */
    const camera = new THREE.PerspectiveCamera(
      42,
      container.clientWidth / Math.max(container.clientHeight, 1),
      0.1,
      100,
    );
    // Pull back slightly so the default appears smaller; adjust in the same direction as min/maxDistance
    camera.position.set(0, 0.35, 5.15);

    /* ── Renderer ── */
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, isMobile ? 1 : 2));

    /* ── Globe group (tilt + content; view rotation via OrbitControls) ── */
    const globeGroup = new THREE.Group();
    scene.add(globeGroup);

    globeGroup.rotation.x = 0.3;

    const controls = new OrbitControls(camera, canvas);
    controls.enableDamping = true;
    controls.dampingFactor = 0.06;
    controls.target.set(0, 0, 0);
    controls.enablePan = false;
    controls.minDistance = 3.05;
    controls.maxDistance = 8.0;
    controls.zoomSpeed = 0.85;
    controls.autoRotate = !prefersReducedMotion;
    controls.autoRotateSpeed = 0.32;
    controls.minPolarAngle = 0.18;
    controls.maxPolarAngle = Math.PI - 0.18;

    /* ── Wireframe sphere ── */
    const wireGeo = new THREE.SphereGeometry(
      GLOBE_RADIUS,
      isMobile ? 24 : 32,
      isMobile ? 18 : 24,
    );
    const wireMat = new THREE.MeshBasicMaterial({
      color: COLORS.wireframe,
      wireframe: true,
      transparent: true,
      opacity: 0.2,
    });
    globeGroup.add(new THREE.Mesh(wireGeo, wireMat));

    /* ── Inner solid sphere (depth) ── */
    const innerGeo = new THREE.SphereGeometry(GLOBE_RADIUS * 0.98, 32, 24);
    const innerMat = new THREE.MeshBasicMaterial({
      color: COLORS.ink,
      transparent: true,
      opacity: 0.03,
    });
    globeGroup.add(new THREE.Mesh(innerGeo, innerMat));

    /* ── Latitude/longitude grid lines ── */
    const gridGroup = new THREE.Group();
    const gridMat = new THREE.LineBasicMaterial({ color: COLORS.wireframe, transparent: true, opacity: 0.06 });

    // Latitude / longitude grid — same projection as routes & land (latLngToVector3)
    for (let lat = -60; lat <= 60; lat += 30) {
      const points: THREE.Vector3[] = [];
      for (let lng = -180; lng <= 180; lng += 5) {
        points.push(latLngToVector3(lat, lng, GLOBE_RADIUS));
      }
      const geo = new THREE.BufferGeometry().setFromPoints(points);
      gridGroup.add(new THREE.Line(geo, gridMat));
    }

    for (let lng = -180; lng < 180; lng += 30) {
      const points: THREE.Vector3[] = [];
      for (let lat = -90; lat <= 90; lat += 5) {
        points.push(latLngToVector3(lat, lng, GLOBE_RADIUS));
      }
      const geo = new THREE.BufferGeometry().setFromPoints(points);
      gridGroup.add(new THREE.Line(geo, gridMat));
    }
    globeGroup.add(gridGroup);

    const landColor = new THREE.Color(COLORS.ink).lerp(new THREE.Color(COLORS.wireframe), 0.42);
    if (!cancelled) {
      const g = createLandOutlinesGroup(
        landOutlineRadius(GLOBE_RADIUS),
        landColor,
        0.52,
        { lineWidthPx: LAND_OUTLINE_WIDTH_SUPPLY_CHAIN_PX }
      );
      globeGroup.add(g);
      const st = sceneRef.current;
      if (st) st.landGroup = g;
      syncLandOutlineLine2Resolution(
        g,
        container.clientWidth,
        Math.max(container.clientHeight, 1),
      );
    }

    /* ── Route visuals ── */
    const particles: ParticleState[] = [];

    for (const route of routes) {
      const { group, particle, curve } = createRouteVisuals(route, GLOBE_RADIUS, isMobile);
      globeGroup.add(group);

      if (curve) {
        particles.push({
          mesh: particle,
          curve,
          t: Math.random(), // stagger start positions
          speed: 0.002 + Math.random() * 0.001,
        });
      }
    }

    sceneRef.current = {
      scene,
      camera,
      renderer,
      controls,
      globeGroup,
      particles,
      animationId: 0,
      landGroup: null,
    };

    /* ── Scroll-driven opacity (lock off for the Layout persistent globe, to prevent child-page scrolling from fading it out) */
    const applyScrollOpacity = () => {
      if (!container || !sceneRef.current) return;
      if (lock) {
        sceneRef.current.globeGroup.visible = true;
        sceneRef.current.renderer.domElement.style.opacity = '1';
        return;
      }
      const rect = container.getBoundingClientRect();
      const vh = window.innerHeight;
      const visibility = Math.max(0, Math.min(1, (vh - rect.top) / (vh * 0.8)));
      sceneRef.current.globeGroup.visible = visibility > 0.01;
      sceneRef.current.renderer.domElement.style.opacity = String(visibility);
    };
    applyScrollOpacity();
    if (!lock) {
      window.addEventListener('scroll', applyScrollOpacity, { passive: true });
    }

    /* ── Animation loop (when suspended, no longer schedules; resume is triggered by the useEffect below) */
    let time = 0;

    const tick = () => {
      if (!sceneRef.current) return;
      if (suspendedRef.current) {
        sceneRef.current.animationId = 0;
        return;
      }
      time += 1;

      const { particles: p, renderer: r, scene: s, camera: c, controls: ctl } = sceneRef.current;

      ctl.update();

      for (const pState of p) {
        pState.t += pState.speed;
        if (pState.t > 1) pState.t -= 1;
        const point = pState.curve.getPoint(pState.t);
        pState.mesh.position.copy(point);
        pState.mesh.visible = true;
        const mat = pState.mesh.material as THREE.MeshBasicMaterial;
        mat.opacity = 0.5 + Math.sin(time * 0.05 + pState.t * Math.PI * 2) * 0.5;
      }

      r.render(s, c);
      sceneRef.current.animationId = requestAnimationFrame(tick);
    };
    tickRef.current = tick;
    tick();

    /* ── Resize ── */
    const handleResize = () => {
      if (!container || !sceneRef.current) return;
      const w = container.clientWidth;
      const h = Math.max(container.clientHeight, 1);
      sceneRef.current.camera.aspect = w / h;
      sceneRef.current.camera.updateProjectionMatrix();
      sceneRef.current.renderer.setSize(w, h);
      if (sceneRef.current.landGroup) {
        syncLandOutlineLine2Resolution(sceneRef.current.landGroup, w, h);
      }
      applyScrollOpacity();
    };
    const ro = new ResizeObserver(handleResize);
    ro.observe(container);
    window.addEventListener('resize', handleResize);

    /* ── Cleanup ── */
    return () => {
      cancelled = true;
      if (sceneRef.current) {
        cancelAnimationFrame(sceneRef.current.animationId);
      }
      if (!lock) {
        window.removeEventListener('scroll', applyScrollOpacity);
      }
      window.removeEventListener('resize', handleResize);
      ro.disconnect();
      controls.dispose();
      renderer.dispose();
      sceneRef.current = null;
      tickRef.current = null;
    };
  }, [prefersReducedMotion, routes, lockOpacity]);

  useEffect(() => {
    if (suspended || !sceneRef.current || !tickRef.current) return;
    const st = sceneRef.current;
    if (st.animationId !== 0) return;
    st.animationId = requestAnimationFrame(tickRef.current);
    return () => {
      if (st.animationId) {
        cancelAnimationFrame(st.animationId);
        st.animationId = 0;
      }
    };
  }, [suspended]);

  useEffect(() => {
    const st = sceneRef.current;
    if (!st) return;
    st.controls.enabled = !suspended;
    st.controls.autoRotate = !suspended && !prefersReducedMotion;
  }, [suspended, prefersReducedMotion]);

  if (prefersReducedMotion) return null;

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 z-[5] touch-none"
      style={{ cursor: 'grab' }}
    >
      <canvas
        ref={canvasRef}
        className="absolute inset-0 h-full w-full cursor-grab active:cursor-grabbing"
      />
    </div>
  );
}
