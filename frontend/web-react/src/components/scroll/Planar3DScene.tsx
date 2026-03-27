import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { useReducedMotion } from 'framer-motion';

/* ─── Color Palette (matching brand) ─── */
const COLORS = {
  rust: 0xA45A52,
  sage: 0x7D8471,
  sepia: 0x8B7355,
  warmGray: 0xC4B9A8,
  paleGold: 0xD4C5A9,
};

/* ─── Types ─── */
interface BlockState {
  mesh: THREE.Mesh;
  startX: number;
  startY: number;
  startZ: number;
  startScale: number;
  endX: number;
  endY: number;
  endScale: number;
}

interface SceneState {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
  blocks: BlockState[];
  animationId: number;
}

/* ─── Planar3DScene - Geometric Blocks Only ─── */
export default function Planar3DScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sceneRef = useRef<SceneState | null>(null);
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    if (!canvasRef.current || prefersReducedMotion) return;

    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!container) return;

    // Scene setup
    const scene = new THREE.Scene();
    scene.background = null;

    // Camera
    const camera = new THREE.PerspectiveCamera(
      50,
      container.clientWidth / container.clientHeight,
      0.1,
      1000
    );
    camera.position.z = 12;

    // Renderer
    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
    });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    /* ─── Create 3D Blocks ─── */
    const blocks: BlockState[] = [];
    const blockData = [
      { x: -4, y: 3, z: 2, color: COLORS.paleGold, scale: 0.8 },
      { x: 3, y: 1, z: 4, color: COLORS.warmGray, scale: 1.0 },
      { x: -2, y: -2, z: 3, color: COLORS.sepia, scale: 1.2 },
      { x: 4, y: -3, z: 1, color: COLORS.rust, scale: 0.9 },
    ];

    blockData.forEach((data, i) => {
      const geometry = new THREE.BoxGeometry(1.5, 2, 0.8);
      const material = new THREE.MeshBasicMaterial({
        color: data.color,
        transparent: true,
        opacity: 0,
      });
      const block = new THREE.Mesh(geometry, material);
      block.position.set(data.x, data.y, data.z);
      block.rotation.x = 0.1;
      block.rotation.y = -0.1;
      block.scale.set(0, 0, 0);
      scene.add(block);

      blocks.push({
        mesh: block,
        startX: data.x,
        startY: data.y,
        startZ: data.z,
        startScale: 0,
        endX: data.x,
        endY: data.y,
        endScale: data.scale,
      });
    });

    sceneRef.current = {
      scene,
      camera,
      renderer,
      blocks,
      animationId: 0,
    };

    /* ─── Scroll Handler ─── */
    const handleScroll = () => {
      if (!container || !sceneRef.current) return;

      const rect = container.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const containerHeight = container.offsetHeight;

      const scrolled = viewportHeight - rect.top;
      const totalScrollable = containerHeight - viewportHeight;
      const progress = Math.max(0, Math.min(1, scrolled / totalScrollable));

      const s = sceneRef.current;

      // Blocks appear during scroll
      s.blocks.forEach((block, i) => {
        const delay = i * 0.08;
        const blockProgress = Math.max(0, Math.min(1, (progress - delay) / 0.25));

        // Fade in
        const mat = block.mesh.material as THREE.MeshBasicMaterial;
        mat.opacity = blockProgress * 0.6;

        // Scale up with spring-like easing
        const eased = 1 - Math.pow(1 - blockProgress, 3);
        const scale = block.startScale + (block.endScale - block.startScale) * eased;
        block.mesh.scale.set(scale, scale, scale);

        // Subtle position shift
        block.mesh.position.y = block.startY + (1 - blockProgress) * 0.5;

        // Rotation animation
        block.mesh.rotation.x = 0.1 + blockProgress * 0.1;
        block.mesh.rotation.y = -0.1 - blockProgress * 0.15;
      });
    };

    /* ─── Animation Loop ─── */
    let time = 0;
    const animate = () => {
      if (!sceneRef.current) return;
      time += 0.01;
      const s = sceneRef.current;

      // Subtle floating animation
      s.blocks.forEach((block, i) => {
        const mat = block.mesh.material as THREE.MeshBasicMaterial;
        if (mat.opacity > 0) {
          block.mesh.position.y = block.startY + Math.sin(time + i * 0.7) * 0.08;
          block.mesh.rotation.z = Math.sin(time * 0.5 + i) * 0.02;
        }
      });

      s.animationId = requestAnimationFrame(animate);
      s.renderer.render(s.scene, s.camera);
    };

    animate();
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });

    /* ─── Resize Handler ─── */
    const handleResize = () => {
      if (!container || !sceneRef.current) return;
      const width = container.clientWidth;
      const height = container.clientHeight;

      sceneRef.current.camera.aspect = width / height;
      sceneRef.current.camera.updateProjectionMatrix();
      sceneRef.current.renderer.setSize(width, height);
    };
    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      if (sceneRef.current) {
        cancelAnimationFrame(sceneRef.current.animationId);
      }
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      sceneRef.current = null;
    };
  }, [prefersReducedMotion]);

  if (prefersReducedMotion) return null;

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 pointer-events-none z-[1]"
      style={{ height: '500vh' }}
    >
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
    </div>
  );
}
