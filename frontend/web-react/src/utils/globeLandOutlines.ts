/**
 * Land silhouettes from Natural Earth 1:110m (public domain).
 * https://www.naturalearthdata.com/
 */
import * as THREE from 'three';
import landData from '@/data/world-land-110m.json';
import { latLngToVector3 } from '@/components/scroll/globeUtils';

type LngLatRing = [number, number][];

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
 * Natural Earth 110m land polygons as LineLoops on a sphere (editorial / low poly).
 * Shares one material across all loops — dispose material once after removing the group.
 */
export function createLandOutlinesGroup(
  radius: number,
  color: THREE.Color,
  opacity = 0.45,
): THREE.Group {
  const group = new THREE.Group();
  const material = new THREE.LineBasicMaterial({
    color,
    transparent: true,
    opacity,
    depthWrite: false,
    depthTest: true,
  });

  const fc = landData as {
    features: { geometry?: { type: string; coordinates: unknown } }[];
  };

  for (const f of fc.features) {
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
