import { useEffect, useMemo } from 'react';
import * as THREE from 'three';
import type { Garment, Weave } from '../data';
import type { BodySpec } from './body';
import { ArmSpace, FOOT, FootSpace, ForearmSpace, LegSpace, splitArm } from './Character';
import { foldAt, inflate, loft, ringAt, type LoftOptions, type Ring } from './loft';
import { disposeMaterial, makeFabricMaterial, makeLiningMaterial } from './fabricTexture';

/*
 * Garments are generated from the mannequin's measurements, so every piece fits
 * both bodies and all builds. Realism comes from: ease over the body, gravity
 * folds that deepen toward the hem (with darker valleys), bunching at hems and
 * cuffs, a turned hem with real thickness, a darker inside, and construction
 * details (waistbands, plackets, collars, lapels, pockets).
 */

export interface WornItem {
  garment: Garment;
  weave: Weave;
  colors: [string, string];
}

type MatKey = 'fabric' | 'prim' | 'white' | 'dark' | 'tan' | 'button' | 'base' | 'baseDark';
type Space = 'body' | 'arm' | 'forearm' | 'leg' | 'foot';
type Vec3 = [number, number, number];
type Folds = NonNullable<LoftOptions['folds']>;

/** One mesh of a garment, placed in body space or mirrored onto both arms / forearms / legs / feet. */
interface Part {
  geo: THREE.BufferGeometry;
  space: Space;
  mat: MatKey;
  position?: Vec3;
  rotation?: Vec3;
  scale?: Vec3;
}

const TRIMS: Record<Exclude<MatKey, 'fabric' | 'prim'>, THREE.Material> = {
  white: new THREE.MeshPhysicalMaterial({ color: '#F1EFEA', roughness: 0.55 }),
  dark: new THREE.MeshPhysicalMaterial({ color: '#2A2622', roughness: 0.4, clearcoat: 0.2 }),
  tan: new THREE.MeshPhysicalMaterial({ color: '#B08A62', roughness: 0.65 }),
  button: new THREE.MeshPhysicalMaterial({ color: '#ECE7DC', roughness: 0.25, clearcoat: 0.6 }),
  base: new THREE.MeshPhysicalMaterial({ color: '#D9DCE2', roughness: 0.85, sheen: 0.5, side: THREE.DoubleSide }),
  baseDark: new THREE.MeshPhysicalMaterial({ color: '#B9BDC6', roughness: 0.85, sheen: 0.5, side: THREE.DoubleSide }),
};

const BUTTON_GEO = new THREE.CylinderGeometry(0.0065, 0.0065, 0.004, 16);
const SHARED = new Set<THREE.BufferGeometry>([BUTTON_GEO]);

/* ---------- body-following shapes (metres) ---------- */

const neckR = (spec: BodySpec) => ringAt(spec.neck, spec.lm.neckBase + 0.01).a;
const backOf = (r: Ring) => r.back ?? r.b;
const maxRing = (p: Ring, q: Ring): Ring => ({ ...p, a: Math.max(p.a, q.a), b: Math.max(p.b, q.b), back: Math.max(backOf(p), backOf(q)) });

interface TorsoOptions {
  top: 'neck' | 'chest' | 'waist';
  bottom: number;
  d: number;
  flare?: number;
  /** 0 = follows the waist like a fitted piece, 1 = hangs straight down from the chest/bust */
  drape?: number;
}

/** Cross-sections of a garment around the torso; continues as a skirt below the hips. */
function torsoRings(spec: BodySpec, { top, bottom, d, flare = 0, drape = 0 }: TorsoOptions): Ring[] {
  const { lm, torso } = spec;
  const rings: Ring[] = [];

  if (bottom < lm.hip - 0.06) {
    // Skirt: from the hip line down, cover the seat and both legs, flaring toward the hem.
    const hip = inflate(ringAt(torso, lm.hip), d);
    const ys = [bottom, (bottom + lm.crotch) / 2, lm.crotch + 0.01, (lm.crotch + lm.hip) / 2].filter((y) => y < lm.hip - 0.01);
    for (const y of [...new Set(ys)].sort((p, q) => p - q)) {
      const t = (lm.hip - y) / (lm.hip - bottom);
      const leg = ringAt(spec.leg, y);
      const body = y >= lm.crotch ? inflate(ringAt(torso, y), d) : hip;
      rings.push({
        y,
        a: Math.max(body.a, hip.a + flare * t, spec.legX + leg.a + 0.024),
        b: Math.max(body.b, hip.b + flare * 0.85 * t, leg.b + 0.032),
        back: Math.max(backOf(body), backOf(hip) + flare * 0.85 * t, backOf(leg) + 0.032),
        z: 0,
      });
    }
    rings.push({ ...hip, z: 0 });
  } else {
    // a hem below the hip line doesn't tuck back in under the seat
    const r = ringAt(torso, bottom);
    rings.push(inflate(bottom < lm.hip ? maxRing(r, ringAt(torso, lm.hip)) : r, d));
  }

  const from = rings[rings.length - 1].y;
  const topY = top === 'neck' ? lm.neckBase : top === 'chest' ? lm.chest + 0.07 : lm.waist + 0.035;
  for (const r of torso) if (r.y > from + 0.01 && r.y < topY - 0.01) rings.push(inflate(r, d));
  if (top === 'neck') {
    const n = neckR(spec) + d * 0.5 + 0.006;
    rings.push({ y: lm.neckBase + 0.012, a: n, b: n - 0.002, back: n, z: 0.004 });
  } else {
    rings.push(inflate(ringAt(torso, topY), d));
  }

  if (drape > 0) {
    // Cloth falls from the widest point above (bust, chest) instead of following the waist in.
    const k = 1 - 0.05 * (1 - drape);
    for (let i = rings.length - 2; i >= 0; i--) {
      if (rings[i].y > lm.chest + 0.02) continue;
      const above = rings[i + 1];
      rings[i] = { ...rings[i], a: Math.max(rings[i].a, above.a * k), b: Math.max(rings[i].b, above.b * k), back: Math.max(backOf(rings[i]), backOf(above) * k) };
    }
  }
  return rings;
}

interface ShellOptions {
  gap?: number;
  folds?: Folds;
  wave?: LoftOptions['wave'];
  bunch?: LoftOptions['bunch'];
  segments?: number;
  /** turned hem at the bottom ring; on by default */
  hem?: boolean;
}

/** A garment surface plus its turned hem, which gives the cut edge real thickness. */
function shell(rings: Ring[], o: ShellOptions, space: Space = 'body'): Part[] {
  const segments = o.segments ?? 72;
  const parts: Part[] = [{ geo: loft(rings, { gap: o.gap, folds: o.folds, wave: o.wave, bunch: o.bunch, segments }), space, mat: 'fabric' }];
  if (o.hem !== false) {
    const r = rings[0];
    const hem = loft(
      [
        { ...inflate(r, 0.0022), y: r.y - 0.002 },
        { ...inflate(r, 0.0032), y: r.y + 0.013 },
      ],
      // same folds as the shell, measured from the shell's hem, so the hem rides the folds
      { subdivisions: 1, gap: o.gap, wave: o.wave, segments, folds: o.folds && { ...o.folds, start: o.folds.start } }
    );
    parts.push({ geo: hem, space, mat: 'fabric' });
  }
  return parts;
}

/** Pants seat: waist down to the crotch. */
function seatRings(spec: BodySpec, d: number): Ring[] {
  const { lm, torso } = spec;
  const top = lm.waist + 0.03;
  const hip = ringAt(torso, lm.hip);
  // stop the seat narrowing to a point at the crotch; the legs take over there
  const rings = torso
    .filter((r) => r.y >= lm.crotch && r.y < top - 0.01)
    .map((r) => inflate(r.y < lm.hip ? maxRing(r, { ...hip, a: hip.a * 0.92, b: hip.b * 0.92, back: backOf(hip) * 0.92 }) : r, d));
  rings.push(inflate(ringAt(torso, top), d));
  return rings;
}

/** Tube down one leg; hemExtra widens it toward the hem. */
function legRings(spec: BodySpec, top: number, bottom: number, d: number, hemExtra = 0): Ring[] {
  const at = (y: number) => inflate(ringAt(spec.leg, y), d, (hemExtra * (top - y)) / (top - bottom));
  const rings = [at(bottom)];
  for (const r of spec.leg) if (r.y > bottom + 0.01 && r.y < top - 0.01) rings.push(at(r.y));
  rings.push(at(top));
  return rings;
}

/** Sleeve from the shoulder down `length` metres of the arm; long sleeves bend at the elbow. */
function sleeve(spec: BodySpec, length: number, d: number, flare = 0, extra: Pick<ShellOptions, 'bunch'> = {}): Part[] {
  const rings = spec.arm.filter((r) => r.y > -length + 0.005).map((r) => inflate(r, d));
  rings.unshift(inflate(ringAt(spec.arm, -length), d, flare));
  // taper the top shut inside the shoulder so a thick sleeve never shows its open end
  const top = rings[rings.length - 1];
  rings[rings.length - 1] = { ...top, y: 0.035, a: top.a * 0.55, b: top.b * 0.55, back: backOf(top) * 0.55 };
  const folds: Folds = { count: 5, amp: 0.035, start: -0.04, seed: 7 };
  if (length < spec.elbow - 0.03) return shell(rings, { folds, segments: 40 }, 'arm');

  const [upper, fore] = splitArm(rings, spec.elbow, 0.022);
  const foreBunch = extra.bunch && { ...extra.bunch, y: extra.bunch.y + spec.elbow };
  return [
    ...shell(upper, { hem: false, segments: 40, bunch: { y: -spec.elbow + 0.03, half: 0.05, amp: 0.035, freq: 140 } }, 'arm'),
    ...shell(fore, { segments: 40, bunch: foreBunch }, 'forearm'),
  ];
}

/** Ribbed band between two cross-sections (hems, cuffs, necklines). */
const rib = (lo: Ring, hi: Ring, gap = 0) => loft([lo, hi], { subdivisions: 1, segments: 140, gap, wave: { count: 70, amp: 0.022 } });

function cuff(spec: BodySpec, length: number, d: number, ribbed = true): Part {
  const r = inflate(ringAt(spec.arm, -length), d + 0.005);
  const y = spec.elbow - length;
  const lo = { ...r, y };
  const hi = { ...r, y: y + 0.06 };
  return { geo: ribbed ? rib(lo, hi) : loft([lo, hi], { subdivisions: 1, segments: 40 }), space: 'forearm', mat: 'fabric' };
}

/** Shirt collar: a stand around the neck plus a fall that folds over onto the shoulders. */
function shirtCollar(spec: BodySpec): Part[] {
  const n = neckR(spec);
  const y = spec.lm.neckBase;
  return [
    { geo: loft([{ y: y - 0.004, a: n + 0.026, b: n + 0.022, back: n + 0.024, z: 0.004 }, { y: y + 0.03, a: n + 0.014, b: n + 0.012, back: n + 0.013, z: 0.006 }], { gap: 0.5, subdivisions: 1, segments: 48 }), space: 'body', mat: 'fabric' },
    { geo: loft([{ y: y - 0.04, a: n + 0.062, b: n + 0.052, back: n + 0.05, z: 0 }, { y: y + 0.03, a: n + 0.019, b: n + 0.017, back: n + 0.018, z: 0.006 }], { gap: 0.95, subdivisions: 1, segments: 48 }), space: 'body', mat: 'fabric' },
  ];
}

function crewNeck(spec: BodySpec): Part {
  const n = neckR(spec);
  const y = spec.lm.neckBase;
  return { geo: rib({ y: y - 0.004, a: n + 0.022, b: n + 0.019, back: n + 0.02, z: 0.004 }, { y: y + 0.018, a: n + 0.013, b: n + 0.011, back: n + 0.012, z: 0.004 }), space: 'body', mat: 'fabric' };
}

function hemRib(spec: BodySpec, y: number, d: number): Part {
  const r = inflate(ringAt(spec.torso, y), d + 0.004);
  return { geo: rib({ ...r, y }, { ...r, y: y + 0.055 }), space: 'body', mat: 'fabric' };
}

/** Narrow strip over the front opening (button placket), riding the shell's folds. */
function placket(rings: Ring[], folds?: Folds): Part {
  return { geo: loft(rings.map((r) => inflate(r, 0.003)), { arc: [-0.07, 0.07], segments: 6, folds }), space: 'body', mat: 'fabric' };
}

/** Lapels: wide bands folded back either side of an open front, chest to collar. */
function lapels(spec: BodySpec, rings: Ring[], gap: number): Part[] {
  const from = spec.lm.chest - 0.1;
  const r = rings.filter((q) => q.y >= from).map((q) => inflate(q, 0.005));
  const w = 0.55;
  return [
    { geo: loft(r, { arc: [gap / 2, gap / 2 + w], segments: 12 }), space: 'body', mat: 'fabric' },
    { geo: loft(r, { arc: [-gap / 2 - w, -gap / 2], segments: 12 }), space: 'body', mat: 'fabric' },
  ];
}

/** Front-centre buttons that sit on the folded surface. */
function buttons(rings: Ring[], from: number, to: number, folds?: Folds): Part[] {
  const parts: Part[] = [];
  const bottomY = rings[0].y;
  for (let y = from; y > to; y -= 0.075) {
    const r = ringAt(rings, y);
    const k = 1 + (folds ? foldAt(folds, bottomY, y, 0).lift : 0);
    parts.push({ geo: BUTTON_GEO, space: 'body', mat: 'button', position: [0, y, (r.b + 0.004) * k + (r.z ?? 0) + 0.003], rotation: [Math.PI / 2, 0, 0] });
  }
  return parts;
}

/** A thin box laid flat on the surface of `ring` at angle phi (0 = front). */
function onSurface(ring: Ring, phi: number, size: Vec3, mat: MatKey, lift = 0.004): Part {
  const c = Math.cos(phi);
  const depth = c >= 0 ? ring.b : backOf(ring);
  return {
    geo: new THREE.BoxGeometry(...size),
    space: 'body',
    mat,
    position: [(ring.a + lift) * Math.sin(phi), ring.y, (depth + lift) * c + (ring.z ?? 0)],
    rotation: [0, phi, 0],
  };
}

function straps(spec: BodySpec, d: number): Part[] {
  const y = spec.lm.chest + 0.07;
  const r = ringAt(spec.torso, y);
  const geo = new THREE.TorusGeometry((r.b + backOf(r)) / 2 + d, 0.008, 8, 32, Math.PI);
  return [-1, 1].map((s) => ({
    geo,
    space: 'body' as const,
    mat: 'prim' as const,
    position: [s * spec.shoulder[0] * 0.55, y, ((r.b - backOf(r)) / 2) + (r.z ?? 0)] as Vec3,
    rotation: [0, Math.PI / 2, 0] as Vec3,
  }));
}

/** Waistband with belt loops for trousers and skirts. */
function waistband(spec: BodySpec, d: number, loops: boolean): Part[] {
  const y = spec.lm.waist;
  const r = inflate(ringAt(spec.torso, y), d + 0.004);
  const parts: Part[] = [{ geo: loft([{ ...r, y: y - 0.015 }, { ...r, y: y + 0.03 }], { subdivisions: 1, segments: 72 }), space: 'body', mat: 'fabric' }];
  if (loops) {
    for (const phi of [-1.7, -0.75, 0.75, 1.7, Math.PI]) parts.push(onSurface({ ...r, y: y + 0.008 }, phi, [0.009, 0.042, 0.004], 'prim', 0.003));
  }
  return parts;
}

/* ---------- shoes (foot space: heel→toe along +y, +z points down) ---------- */

/** Pinch the first and last ring shut so heel and toe are closed, not open tubes. */
const capEnds = (rings: Ring[]) => rings.map((r, i) => (i === 0 || i === rings.length - 1 ? { ...r, a: 0.002, b: 0.002, back: 0.002 } : r));
/** Heel→toe extended a little each way so the shoe encloses the foot. */
const shoeLength = (rings: Ring[], grow: number) => rings.map((r, i) => ({ ...r, y: i === 0 ? r.y - grow : i === rings.length - 1 ? r.y + grow : r.y }));
const footRings = (grow: number, depthScale = 1) =>
  capEnds(shoeLength(FOOT.map((r) => ({ ...r, a: r.a + grow, b: r.b * depthScale + grow, back: r.b * depthScale + grow })), grow));
/** A slab under the foot outline: the shoe's sole. */
const soleRings = (grow: number, thickness: number) =>
  capEnds(shoeLength(FOOT.map((r) => ({ y: r.y, a: r.a + grow, b: thickness, back: thickness, z: (r.z ?? 0) + r.b + thickness * 0.6 })), grow + 0.004));

/* ---------- catalogue ---------- */

function buildParts(kind: Garment, spec: BodySpec): Part[] {
  const { lm, wrist: L } = spec;
  const foot = (geo: THREE.BufferGeometry, mat: MatKey, position?: Vec3, rotation?: Vec3): Part => ({ geo, space: 'foot', mat, position, rotation });
  const head = (geo: THREE.BufferGeometry, mat: MatKey, position: Vec3, scale?: Vec3, rotation?: Vec3): Part => ({ geo, space: 'body', mat, position, scale, rotation });
  const { y: hy, r: hr } = spec.head;
  const k = hr / 0.1; // hat offsets are drawn for a 0.1 m head
  const R = hr * 1.06;
  const pocketY = lm.hip + 0.02;

  switch (kind) {
    /* tops */
    case 'tee': {
      const rings = torsoRings(spec, { top: 'neck', bottom: lm.hip - 0.04, d: 0.024, drape: 0.75 });
      return [...shell(rings, { folds: { count: 9, amp: 0.045, start: lm.waist + 0.05, seed: 3 } }), crewNeck(spec), ...sleeve(spec, 0.17, 0.014, 0.01)];
    }
    case 'shirt':
    case 'longshirt': {
      const rings = torsoRings(spec, { top: 'neck', bottom: lm.hip - 0.03, d: 0.026, drape: 0.65 });
      const folds: Folds = { count: 8, amp: 0.04, start: lm.waist + 0.08, seed: 5 };
      const chest = ringAt(rings, lm.chest + 0.04);
      const parts = [
        ...shell(rings, { folds }),
        ...shirtCollar(spec),
        placket(rings, folds),
        ...buttons(rings, lm.neckBase - 0.05, lm.hip - 0.01, folds),
        onSurface(chest, -0.55, [0.09, 0.1, 0.003], 'prim'),
      ];
      if (kind === 'shirt') return [...parts, ...sleeve(spec, 0.21, 0.016, 0.008)];
      return [
        ...parts,
        ...sleeve(spec, L - 0.03, 0.014, 0, { bunch: { y: -(L - 0.1), half: 0.07, amp: 0.05, freq: 120 } }),
        cuff(spec, L - 0.02, 0.012, false),
      ];
    }
    case 'tank': {
      const rings = torsoRings(spec, { top: 'chest', bottom: lm.hip - 0.04, d: 0.022, drape: 0.5 });
      return [...shell(rings, { folds: { count: 9, amp: 0.035, start: lm.waist, seed: 11 } }), ...straps(spec, 0.022)];
    }
    case 'hoodie': {
      const rings = torsoRings(spec, { top: 'neck', bottom: lm.hip - 0.0, d: 0.034, drape: 1 });
      const pr = ringAt(rings, lm.waist - 0.06);
      const fr = ringAt(rings, lm.neckBase - 0.09);
      return [
        // fabric blouses over the ribbed hem
        ...shell(rings, { hem: false, folds: { count: 7, amp: 0.03, start: lm.waist, seed: 13 }, bunch: { y: lm.hip + 0.03, half: 0.05, amp: 0.03, freq: 110 } }),
        hemRib(spec, lm.hip - 0.04, 0.034),
        head(new THREE.SphereGeometry(0.12, 32, 16, Math.PI, Math.PI, 0, Math.PI * 0.6), 'prim', [0, lm.neckBase - 0.01, -0.06], [0.95, 0.75, 0.6], [1.0, 0, 0]),
        onSurface({ ...pr, y: lm.waist - 0.06 }, 0, [0.2, 0.1, 0.01], 'prim', 0.006),
        ...[-1, 1].map((s) => head(new THREE.CylinderGeometry(0.003, 0.003, 0.15, 8), 'white', [s * 0.035, fr.y - 0.06, fr.b + (fr.z ?? 0) + 0.008])),
        ...sleeve(spec, L - 0.05, 0.02, 0, { bunch: { y: -(L - 0.1), half: 0.08, amp: 0.06, freq: 110 } }),
        cuff(spec, L - 0.01, 0.014),
      ];
    }
    case 'knit': {
      const rings = torsoRings(spec, { top: 'neck', bottom: lm.hip - 0.0, d: 0.03, drape: 0.9 });
      return [
        ...shell(rings, { hem: false, folds: { count: 7, amp: 0.022, start: lm.waist, seed: 17 }, bunch: { y: lm.hip + 0.03, half: 0.04, amp: 0.02, freq: 120 } }),
        hemRib(spec, lm.hip - 0.04, 0.03),
        crewNeck(spec),
        ...sleeve(spec, L - 0.05, 0.016, 0, { bunch: { y: -(L - 0.1), half: 0.07, amp: 0.05, freq: 120 } }),
        cuff(spec, L - 0.01, 0.012),
      ];
    }

    /* outerwear */
    case 'jacket':
    case 'coat': {
      const coat = kind === 'coat';
      const gap = coat ? 0.58 : 0.62;
      const rings = torsoRings(spec, coat
        ? { top: 'neck', bottom: lm.knee + 0.02, d: 0.046, flare: 0.07, drape: 1 }
        : { top: 'neck', bottom: lm.hip - 0.05, d: 0.042, drape: 1 });
      const pr = ringAt(rings, pocketY);
      return [
        ...shell(rings, { gap, folds: { count: coat ? 9 : 7, amp: coat ? 0.05 : 0.02, start: lm.waist, seed: coat ? 19 : 23 } }),
        ...lapels(spec, rings, gap),
        ...shirtCollar(spec).slice(1),
        ...[-1, 1].map((s) => onSurface({ ...pr, y: pocketY }, s * 1.0, [0.13, 0.045, 0.006], 'prim', 0.006)),
        ...sleeve(spec, L - 0.03, coat ? 0.04 : 0.036, 0.004, { bunch: { y: -(L - 0.09), half: 0.06, amp: 0.035, freq: 100 } }),
      ];
    }
    case 'vest': {
      const gap = 0.62;
      const rings = torsoRings(spec, { top: 'neck', bottom: lm.hip - 0.03, d: 0.038, drape: 0.6 });
      const pr = ringAt(rings, lm.waist - 0.02);
      return [
        ...shell(rings, { gap }),
        ...[-1, 1].map((s) => onSurface({ ...pr, y: lm.waist - 0.02 }, s * 0.9, [0.08, 0.02, 0.005], 'prim', 0.005)),
      ];
    }

    /* bottoms */
    case 'pants':
    case 'wide':
    case 'shorts': {
      const wide = kind === 'wide';
      const shorts = kind === 'shorts';
      const bottom = shorts ? lm.knee + 0.12 : lm.ankle + (wide ? 0.006 : 0.012);
      const legs = legRings(spec, lm.crotch + 0.08, bottom, wide ? 0.018 : 0.014, wide ? 0.06 : shorts ? 0.018 : 0.012);
      const waist = ringAt(spec.torso, lm.waist);
      return [
        ...shell(seatRings(spec, 0.012), { hem: false }),
        ...waistband(spec, 0.012, true),
        // fly
        onSurface({ ...inflate(waist, 0.014), y: lm.waist - 0.085 }, 0.08, [0.012, 0.11, 0.003], 'prim', 0.003),
        ...shell(legs, {
          segments: 48,
          folds: { count: wide ? 5 : 4, amp: wide ? 0.06 : 0.03, start: wide ? lm.crotch : lm.knee + 0.15, seed: wide ? 29 : 31 },
          bunch: shorts ? undefined : { y: lm.ankle + 0.06, half: 0.06, amp: wide ? 0.02 : 0.045, freq: 110 },
        }, 'leg'),
      ];
    }
    case 'skirt':
    case 'pleated': {
      const pleated = kind === 'pleated';
      const rings = torsoRings(spec, pleated
        ? { top: 'waist', bottom: lm.crotch - 0.13, d: 0.012, flare: 0.06 }
        : { top: 'waist', bottom: lm.knee - 0.1, d: 0.012, flare: 0.1 });
      return [
        ...shell(rings, pleated
          ? { wave: { count: 28, amp: 0.035 }, folds: { count: 4, amp: 0.02, start: lm.hip, seed: 37 }, segments: 168 }
          : { folds: { count: 10, amp: 0.07, start: lm.hip, seed: 41 } }),
        ...waistband(spec, 0.01, false),
      ];
    }

    /* dresses */
    case 'dress': {
      const rings = torsoRings(spec, { top: 'neck', bottom: lm.knee - 0.03, d: 0.016, flare: 0.12 });
      return [...shell(rings, { folds: { count: 11, amp: 0.07, start: lm.waist - 0.02, seed: 43 } }), ...waistSeam(spec, 0.016)];
    }
    case 'shirtdress': {
      const rings = torsoRings(spec, { top: 'neck', bottom: lm.knee - 0.07, d: 0.018, flare: 0.08 });
      const folds: Folds = { count: 10, amp: 0.06, start: lm.waist - 0.02, seed: 47 };
      return [
        ...shell(rings, { folds }),
        ...shirtCollar(spec),
        placket(rings, folds),
        ...buttons(rings, lm.neckBase - 0.05, lm.waist - 0.1, folds),
        ...waistband(spec, 0.016, false),
        ...sleeve(spec, 0.2, 0.016, 0.012),
      ];
    }
    case 'maxi': {
      const rings = torsoRings(spec, { top: 'chest', bottom: lm.ankle + 0.04, d: 0.016, flare: 0.18 });
      return [...shell(rings, { folds: { count: 12, amp: 0.1, start: lm.waist - 0.02, seed: 53 } }), ...straps(spec, 0.016), ...waistSeam(spec, 0.016)];
    }

    /* shoes */
    case 'sneakers':
      return [
        foot(loft(soleRings(0.016, 0.012), { segments: 32 }), 'white'),
        foot(loft(footRings(0.011), { segments: 32 }), 'fabric'),
        { geo: new THREE.TorusGeometry(spec.legX * 0.48, 0.008, 8, 28), space: 'leg', mat: 'white', position: [0, 0.085, 0], rotation: [Math.PI / 2, 0, 0], scale: [1, 1.2, 1] },
      ];
    case 'loafers':
      return [foot(loft(soleRings(0.008, 0.006), { segments: 32 }), 'dark'), foot(loft(footRings(0.006, 0.82), { segments: 32 }), 'fabric')];
    case 'boots':
      return [
        foot(loft(soleRings(0.012, 0.01), { segments: 32 }), 'dark'),
        foot(loft(footRings(0.012), { segments: 32 }), 'fabric'),
        // shaft hugging the ankle and lower calf
        { geo: loft(legRings(spec, 0.2, 0.05, 0.014), { segments: 40 }), space: 'leg', mat: 'fabric' },
      ];
    case 'sandals': {
      // straps arch over the top of the foot (−z is up in foot space)
      const strap = new THREE.TorusGeometry(0.036, 0.006, 8, 24, Math.PI);
      return [
        foot(loft(soleRings(0.01, 0.005), { segments: 32 }), 'tan'),
        foot(strap, 'prim', [0, 0.17, 0.016], [-Math.PI / 2, 0, 0]),
        foot(strap, 'prim', [0, 0.08, 0.004], [-Math.PI / 2, 0, 0]),
      ];
    }

    /* hats — placed on the head in body space */
    case 'bucket':
      return [
        head(new THREE.CylinderGeometry(R * 0.86, R, 0.1 * k, 48), 'prim', [0, hy + 0.072 * k, -0.004], [0.95, 1, 1.03]),
        head(new THREE.CylinderGeometry(R, R * 1.6, 0.05 * k, 64, 1, true), 'prim', [0, hy + 0.005 * k, -0.004], [0.95, 1, 1.03]),
      ];
    case 'cap':
      return [
        head(new THREE.SphereGeometry(R, 40, 20, 0, Math.PI * 2, 0, Math.PI * 0.5), 'prim', [0, hy + 0.01 * k, -0.006], [0.95, 1.22, 1.04], [-0.1, 0, 0]),
        head(new THREE.CylinderGeometry(0.088 * k, 0.088 * k, 0.008, 40, 1, false, -Math.PI / 2, Math.PI), 'prim', [0, hy + 0.03 * k, R * 0.82], [1, 1, 0.95], [0.14, 0, 0]),
      ];
    case 'beanie':
      return [
        head(new THREE.SphereGeometry(R + 0.004, 40, 20, 0, Math.PI * 2, 0, Math.PI * 0.56), 'prim', [0, hy + 0.008 * k, -0.008], [0.96, 1.28, 1.04], [-0.2, 0, 0]),
        head(new THREE.CylinderGeometry(R * 0.99, R, 0.05 * k, 48, 1, true), 'prim', [0, hy + 0.018 * k, -0.004], [0.97, 1, 1.05], [-0.2, 0, 0]),
      ];
    case 'straw':
      return [
        head(new THREE.CylinderGeometry(R * 0.84, R * 0.98, 0.1 * k, 48), 'prim', [0, hy + 0.078 * k, -0.004], [0.95, 1, 1.03]),
        head(new THREE.RingGeometry(R * 0.9, 0.24, 64), 'prim', [0, hy + 0.034 * k, -0.004], [1, 1, 1], [-Math.PI / 2, 0, 0]),
        head(new THREE.CylinderGeometry(R * 0.985, R * 0.99, 0.022, 48, 1, true), 'dark', [0, hy + 0.045 * k, -0.004], [0.955, 1, 1.035]),
      ];
  }
}

/** Thin seam band at the natural waist of a dress. */
function waistSeam(spec: BodySpec, d: number): Part[] {
  const y = spec.lm.waist;
  const r = inflate(ringAt(spec.torso, y), d + 0.003);
  return [{ geo: loft([{ ...r, y: y - 0.006 }, { ...r, y: y + 0.006 }], { subdivisions: 1, segments: 72 }), space: 'body', mat: 'fabric' }];
}

/** Plain base layer so the mannequin is never bare. */
function buildBase(spec: BodySpec, hasTop: boolean, hasBottom: boolean): Part[] {
  const parts: Part[] = [];
  if (!hasTop) parts.push({ geo: loft(torsoRings(spec, { top: 'neck', bottom: spec.lm.waist - 0.02, d: 0.006 }), { segments: 72 }), space: 'body', mat: 'base' });
  if (!hasBottom) {
    parts.push({ geo: loft(seatRings(spec, 0.008), { segments: 64 }), space: 'body', mat: 'baseDark' });
    parts.push({ geo: loft(legRings(spec, spec.lm.crotch + 0.06, spec.lm.crotch - 0.09, 0.008), { segments: 40 }), space: 'leg', mat: 'baseDark' });
  }
  return parts;
}

/* ---------- rendering ---------- */

function useFabric(item: WornItem) {
  const [c0, c1] = item.colors;
  const mats = useMemo(() => {
    const outer = makeFabricMaterial(item.weave, item.colors, { vertexColors: true, side: THREE.FrontSide });
    return { outer, lining: makeLiningMaterial(outer), prim: makeFabricMaterial(item.weave, item.colors, { repeat: [6, 3] }) };
  }, [item.weave, c0, c1]);
  useEffect(
    () => () => {
      disposeMaterial(mats.outer);
      mats.lining.dispose();
      disposeMaterial(mats.prim);
    },
    [mats]
  );
  return mats;
}

interface Fabrics {
  outer: THREE.Material;
  lining: THREE.Material;
  prim: THREE.Material;
}

function PartsMesh({ spec, parts, fabrics }: { spec: BodySpec; parts: Part[]; fabrics?: Fabrics }) {
  const draw = (p: Part, i: number) => {
    const t = { position: p.position, rotation: p.rotation, scale: p.scale };
    if (p.mat === 'fabric' && fabrics) {
      // outside in the cloth, inside in shadow
      return (
        <group key={i} {...t}>
          <mesh geometry={p.geo} material={fabrics.outer} dispose={null} />
          <mesh geometry={p.geo} material={fabrics.lining} dispose={null} />
        </group>
      );
    }
    const mat = p.mat === 'prim' ? fabrics?.prim : p.mat === 'fabric' ? undefined : TRIMS[p.mat];
    return <mesh key={i} geometry={p.geo} material={mat} dispose={null} {...t} />;
  };
  const of = (space: Space) => parts.filter((p) => p.space === space).map(draw);
  return (
    <group>
      {of('body')}
      {([-1, 1] as const).map((side) => (
        <group key={side}>
          <ArmSpace spec={spec} side={side}>
            {of('arm')}
            <ForearmSpace spec={spec} side={side}>{of('forearm')}</ForearmSpace>
          </ArmSpace>
          <LegSpace spec={spec} side={side}>
            {of('leg')}
            <FootSpace spec={spec}>{of('foot')}</FootSpace>
          </LegSpace>
        </group>
      ))}
    </group>
  );
}

function useParts(make: () => Part[], deps: unknown[]) {
  const parts = useMemo(make, deps);
  useEffect(
    () => () => {
      new Set(parts.map((p) => p.geo)).forEach((g) => {
        if (!SHARED.has(g)) g.dispose();
      });
    },
    [parts]
  );
  return parts;
}

export function Garment3D({ item, spec }: { item: WornItem; spec: BodySpec }) {
  const fabrics = useFabric(item);
  const parts = useParts(() => buildParts(item.garment, spec), [item.garment, spec]);
  return <PartsMesh spec={spec} parts={parts} fabrics={fabrics} />;
}

export function BaseLayer({ spec, hasTop, hasBottom }: { spec: BodySpec; hasTop: boolean; hasBottom: boolean }) {
  const parts = useParts(() => buildBase(spec, hasTop, hasBottom), [spec, hasTop, hasBottom]);
  return <PartsMesh spec={spec} parts={parts} />;
}
