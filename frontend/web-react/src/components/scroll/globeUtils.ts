import * as THREE from 'three';
import type { SupplyChainRoute } from '@/data/supplyChain';

/**
 * Convert latitude/longitude (degrees) to a 3D point on a sphere.
 * Convention: Y-up, Z-forward — lat maps to Y, lng maps to XZ plane.
 */
export function latLngToVector3(lat: number, lng: number, radius: number): THREE.Vector3 {
  const phi = (90 - lat) * (Math.PI / 180); // polar angle from +Y
  const theta = (lng + 180) * (Math.PI / 180); // azimuthal angle

  return new THREE.Vector3(
    -radius * Math.sin(phi) * Math.cos(theta),
     radius * Math.cos(phi),
     radius * Math.sin(phi) * Math.sin(theta),
  );
}

/**
 * Create a cubic-bezier curve that arcs above the sphere surface
 * between two surface points.
 */
export function createArcCurve(
  start: THREE.Vector3,
  end: THREE.Vector3,
  _globeRadius: number,
): THREE.CubicBezierCurve3 {
  // Midpoint on the chord
  const mid = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);

  // Elevate the midpoint away from the sphere center
  // The further the chord, the higher the arc
  const chordLength = start.distanceTo(end);
  const arcHeight = chordLength * 0.4;
  mid.normalize().multiplyScalar(start.length() + arcHeight);

  return new THREE.CubicBezierCurve3(start, mid, mid, end);
}

/**
 * Build all Three.js objects for a single supply chain route:
 * location dots + arc tubes + a particle (for traveling animation).
 */
export function createRouteVisuals(
  route: SupplyChainRoute,
  globeRadius: number,
  isMobile: boolean,
): { group: THREE.Group; particle: THREE.Mesh; curve: THREE.CubicBezierCurve3 | null } {
  const group = new THREE.Group();
  const color = new THREE.Color(route.color);
  const dotRadius = isMobile ? 0.025 : 0.035;
  const tubeRadius = isMobile ? 0.006 : 0.008;
  const tubeSegments = isMobile ? 16 : 32;

  // Location dots
  for (const node of route.nodes) {
    const pos = latLngToVector3(node.lat, node.lng, globeRadius);
    const geo = new THREE.SphereGeometry(dotRadius, 8, 8);
    const mat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.9 });
    const dot = new THREE.Mesh(geo, mat);
    dot.position.copy(pos);
    group.add(dot);

    // Glow ring
    const ringGeo = new THREE.RingGeometry(dotRadius * 1.4, dotRadius * 2, 16);
    const ringMat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.2, side: THREE.DoubleSide });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.position.copy(pos);
    ring.lookAt(0, 0, 0);
    group.add(ring);
  }

  // Arc tubes connecting sequential nodes
  let mainCurve: THREE.CubicBezierCurve3 | null = null;

  for (let i = 0; i < route.nodes.length - 1; i++) {
    const start = latLngToVector3(route.nodes[i].lat, route.nodes[i].lng, globeRadius);
    const end = latLngToVector3(route.nodes[i + 1].lat, route.nodes[i + 1].lng, globeRadius);
    const curve = createArcCurve(start, end, globeRadius);

    // Use the last (longest) curve for the traveling particle
    if (i === route.nodes.length - 2) {
      mainCurve = curve;
    }

    const tubeGeo = new THREE.TubeGeometry(curve, tubeSegments, tubeRadius, 6, false);
    const tubeMat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.6 });
    group.add(new THREE.Mesh(tubeGeo, tubeMat));
  }

  // Traveling particle along the last arc
  const particleGeo = new THREE.SphereGeometry(dotRadius * 0.7, 6, 6);
  const particleMat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 1 });
  const particle = new THREE.Mesh(particleGeo, particleMat);
  particle.visible = false;
  group.add(particle);

  return { group, particle, curve: mainCurve };
}
