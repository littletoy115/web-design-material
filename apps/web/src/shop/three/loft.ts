import * as THREE from 'three';

/**
 * One horizontal cross-section at height `y`: half-width `a`, front depth `b`,
 * back depth `back` (defaults to `b`), shifted forward by `z`. Separate front
 * and back depths are what give a chest, a seat or shoulder blades.
 */
export interface Ring {
  y: number;
  a: number;
  b: number;
  back?: number;
  z?: number;
}

export interface LoftOptions {
  /** points around each ring */
  segments?: number;
  /** extra rings interpolated between each pair (smooths the silhouette) */
  subdivisions?: number;
  /** radians left open at the front, e.g. for an open jacket */
  gap?: number;
  /** explicit angular range [from, to] in radians, 0 = front centre, increasing toward the left side */
  arc?: [number, number];
  /** regular ripple of the outline (pleats, ribbing); amp is a fraction of the radius */
  wave?: { count: number; amp: number };
  /** gravity folds: irregular vertical folds that deepen from `start` (a height) down to the bottom ring */
  folds?: { count: number; amp: number; start: number; seed?: number };
  /** horizontal wrinkles where fabric bunches, e.g. a trouser hem or a sleeve at the wrist */
  bunch?: { y: number; half: number; amp: number; freq: number };
  /** metres per texture repeat, so weaves keep one scale on every garment */
  tile?: number;
}

const catmull = (p0: number, p1: number, p2: number, p3: number, t: number) => {
  const t2 = t * t;
  const t3 = t2 * t;
  return 0.5 * (2 * p1 + (-p0 + p2) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t2 + (-p0 + 3 * p1 - 3 * p2 + p3) * t3);
};

const backOf = (r: Ring) => r.back ?? r.b;

function smoothRings(rings: Ring[], steps: number): Ring[] {
  if (rings.length < 3 || steps <= 1) return rings;
  const out: Ring[] = [];
  for (let i = 0; i < rings.length - 1; i++) {
    const p0 = rings[Math.max(i - 1, 0)];
    const p1 = rings[i];
    const p2 = rings[i + 1];
    const p3 = rings[Math.min(i + 2, rings.length - 1)];
    for (let s = 0; s < steps; s++) {
      const t = s / steps;
      out.push({
        y: catmull(p0.y, p1.y, p2.y, p3.y, t),
        a: Math.max(0.001, catmull(p0.a, p1.a, p2.a, p3.a, t)),
        b: Math.max(0.001, catmull(p0.b, p1.b, p2.b, p3.b, t)),
        back: Math.max(0.001, catmull(backOf(p0), backOf(p1), backOf(p2), backOf(p3), t)),
        z: catmull(p0.z ?? 0, p1.z ?? 0, p2.z ?? 0, p3.z ?? 0, t),
      });
    }
  }
  out.push(rings[rings.length - 1]);
  return out;
}

/** Linear lookup of the cross-section at height y (rings sorted bottom-up). */
export function ringAt(rings: Ring[], y: number): Ring {
  if (y <= rings[0].y) return { ...rings[0], y };
  for (let i = 0; i < rings.length - 1; i++) {
    const lo = rings[i];
    const hi = rings[i + 1];
    if (y <= hi.y) {
      const t = (y - lo.y) / (hi.y - lo.y);
      const mix = (p: number, q: number) => p + (q - p) * t;
      return { y, a: mix(lo.a, hi.a), b: mix(lo.b, hi.b), back: mix(backOf(lo), backOf(hi)), z: mix(lo.z ?? 0, hi.z ?? 0) };
    }
  }
  return { ...rings[rings.length - 1], y };
}

/** Grow a cross-section outward by d metres (garment ease). */
export const inflate = (r: Ring, d: number, extra = 0): Ring => ({
  ...r,
  a: r.a + d + extra,
  b: r.b + d + extra,
  back: backOf(r) + d + extra,
});

/** Deterministic pseudo-random phase from a seed. */
const phase = (seed: number, i: number) => {
  const x = Math.sin(seed * 12.9898 + i * 78.233) * 43758.5453;
  return (x - Math.floor(x)) * Math.PI * 2;
};

/**
 * Gravity folds at one point: three integer harmonics with random phases, so they look
 * irregular but still meet at the seam, growing from `start` down to the hem.
 * `lift` is the outward radial gain (never inward, so folds don't sink into the layer
 * beneath); `shadow` darkens the valleys.
 */
export function foldAt(folds: NonNullable<LoftOptions['folds']>, bottomY: number, y: number, phi: number) {
  const env = Math.pow(Math.min(1, Math.max(0, (folds.start - y) / Math.max(folds.start - bottomY, 1e-3))), 1.3);
  if (env <= 0) return { lift: 0, shadow: 0 };
  const seed = folds.seed ?? 1;
  const f1 = folds.count;
  const f2 = Math.max(1, Math.round(f1 * 1.7));
  const f3 = Math.max(1, Math.round(f1 * 0.5));
  const n = (0.6 * Math.sin(f1 * phi + phase(seed, 1)) + 0.3 * Math.sin(f2 * phi + phase(seed, 2)) + 0.3 * Math.sin(f3 * phi + phase(seed, 3))) / 1.2;
  const up = 0.5 + 0.5 * n;
  return { lift: folds.amp * env * up, shadow: 0.32 * env * (1 - up) };
}

/**
 * Build a tube through the rings (sorted bottom-up). Normals face outward.
 * Adds a vertex colour that darkens fold valleys, for fabric materials that use it.
 */
export function loft(input: Ring[], opts: LoftOptions = {}) {
  const { segments = 56, subdivisions = 4, gap = 0, arc, wave, folds, bunch, tile = 0.05 } = opts;
  const rings = smoothRings(input, subdivisions);
  // Closed tubes start and end at the back so the seam is out of sight.
  const [start, span] = arc ? [arc[0], arc[1] - arc[0]] : gap ? [gap / 2, Math.PI * 2 - gap] : [Math.PI, Math.PI * 2];
  const closed = !arc && !gap;
  const cols = segments + 1;
  const pos = new Float32Array(rings.length * cols * 3);
  const uv = new Float32Array(rings.length * cols * 2);
  const color = new Float32Array(rings.length * cols * 3);

  // One horizontal scale for the whole piece keeps stripes and checks running straight.
  const radius = rings.reduce((sum, r) => sum + Math.sqrt((r.a * r.a + r.b * r.b) / 2), 0) / rings.length;
  const bottomY = rings[0].y;

  let v = 0;
  rings.forEach((r, i) => {
    if (i > 0) v += Math.hypot(r.y - rings[i - 1].y, r.a - rings[i - 1].a) / tile;

    const bunchEnv = bunch ? Math.max(0, 1 - Math.abs(r.y - bunch.y) / bunch.half) : 0;
    const bunchWave = bunch ? 0.5 + 0.5 * Math.sin((r.y - bunch.y) * bunch.freq) : 0;

    for (let j = 0; j < cols; j++) {
      const s = j / segments;
      const phi = start + s * span;
      let k = 1;
      let shade = 1;
      if (wave) k += wave.amp * Math.sin(phi * wave.count);
      if (folds) {
        const f = foldAt(folds, bottomY, r.y, phi);
        k += f.lift;
        shade -= f.shadow;
      }
      if (bunchEnv > 0) {
        k += bunch!.amp * bunchEnv * bunchWave;
        shade -= 0.22 * bunchEnv * (1 - bunchWave);
      }

      const c = Math.cos(phi);
      const p = (i * cols + j) * 3;
      pos[p] = r.a * k * Math.sin(phi);
      pos[p + 1] = r.y;
      pos[p + 2] = (c >= 0 ? r.b : backOf(r)) * k * c + (r.z ?? 0);
      color[p] = color[p + 1] = color[p + 2] = shade;
      const q = (i * cols + j) * 2;
      uv[q] = (s * span * radius) / tile;
      uv[q + 1] = v;
    }
  });

  const index: number[] = [];
  for (let i = 0; i < rings.length - 1; i++) {
    for (let j = 0; j < segments; j++) {
      const a = i * cols + j;
      const b = a + 1;
      const c = a + cols;
      const d = c + 1;
      index.push(a, b, c, b, d, c);
    }
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  geo.setAttribute('color', new THREE.BufferAttribute(color, 3));
  geo.setIndex(index);
  geo.computeVertexNormals();

  if (closed) {
    // Weld normals across the seam so it doesn't show as a crease.
    const n = geo.attributes.normal as THREE.BufferAttribute;
    for (let i = 0; i < rings.length; i++) {
      const a = i * cols;
      const b = a + segments;
      const x = (n.getX(a) + n.getX(b)) / 2;
      const y = (n.getY(a) + n.getY(b)) / 2;
      const z = (n.getZ(a) + n.getZ(b)) / 2;
      n.setXYZ(a, x, y, z);
      n.setXYZ(b, x, y, z);
    }
  }
  return geo;
}
