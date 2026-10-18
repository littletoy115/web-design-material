import { useEffect, useMemo } from 'react';
import * as THREE from 'three';
import type { BodySpec, Gender, Side } from './body';
import { loft, ringAt, type Ring } from './loft';

/*
 * Faceless retail mannequins. Every body part is a lofted surface (stacked
 * cross-sections), never a sphere or cylinder, so joints flow into each other.
 */

/** Upper arm space: origin at the shoulder joint, arm hanging along -y, posed. */
export function ArmSpace({ spec, side, children }: { spec: BodySpec; side: Side; children: React.ReactNode }) {
  const p = spec.pose.arm[side];
  return (
    <group position={[side * spec.shoulder[0], spec.shoulder[1], 0]} rotation={[p.forward, 0, side * p.abduct]}>
      {children}
    </group>
  );
}

/** Forearm space, nested inside ArmSpace: origin at the elbow. */
export function ForearmSpace({ spec, side, children }: { spec: BodySpec; side: Side; children: React.ReactNode }) {
  const p = spec.pose.arm[side];
  return (
    <group position={[0, -spec.elbow, 0]} rotation={[p.bendForward, 0, side * p.bend]}>
      {children}
    </group>
  );
}

/** Leg space: pivots at the hip joint; contents use absolute heights on the leg axis. */
export function LegSpace({ spec, side, children }: { spec: BodySpec; side: Side; children: React.ReactNode }) {
  const p = spec.pose.leg[side];
  const hip = spec.lm.hip;
  return (
    <group position={[side * spec.legX, hip, 0]} rotation={[p.forward, 0, -side * p.inward]}>
      <group position={[0, -hip, 0]}>{children}</group>
    </group>
  );
}

/** Foot space inside LegSpace: the foot loft runs heel→toe along +y, laid flat pointing forward. */
export function FootSpace({ spec, children }: { spec: BodySpec; children: React.ReactNode }) {
  const s = spec.footLength / 0.24;
  return (
    <group position={[0, 0.036, -0.045 * s]} rotation={[Math.PI / 2, 0, 0]} scale={s}>
      {children}
    </group>
  );
}

/** Split the arm rings at the elbow: [upper arm, forearm (shifted to elbow origin)]. */
export function splitArm(rings: Ring[], elbow: number, overlap = 0.025): [Ring[], Ring[]] {
  // the two halves overlap a little so the bent elbow stays closed
  const lo = -elbow - overlap;
  const hi = -elbow + overlap;
  const upper = [ringAt(rings, lo), ...rings.filter((r) => r.y > lo + 0.005)];
  const fore = [...rings.filter((r) => r.y < hi - 0.005), ringAt(rings, hi)].map((r) => ({ ...r, y: r.y + elbow }));
  return [upper, fore];
}

type Row = [number, number, number, number?];
const R = (rows: Row[]): Ring[] => rows.map(([y, a, b, z]) => ({ y, a, b, z }));

// Egg heads at r = 0.1, chin to crown, no features.
const HEADS: Record<Gender, Ring[]> = {
  // narrower oval with a soft pointed chin
  female: R([
    [-0.118, 0.004, 0.004, 0.024], [-0.11, 0.026, 0.03, 0.028], [-0.09, 0.048, 0.058, 0.02], [-0.055, 0.066, 0.08, 0.011],
    [-0.015, 0.077, 0.092, 0.005], [0.03, 0.081, 0.097, 0], [0.07, 0.078, 0.094, -0.004], [0.1, 0.06, 0.074, -0.008],
    [0.117, 0.025, 0.031, -0.01], [0.121, 0.002, 0.002, -0.01],
  ]),
  // broader, squarer jaw and flat chin
  male: R([
    [-0.118, 0.006, 0.006, 0.018], [-0.112, 0.046, 0.04, 0.022], [-0.095, 0.068, 0.066, 0.016], [-0.06, 0.081, 0.084, 0.008],
    [-0.02, 0.086, 0.094, 0.004], [0.03, 0.088, 0.098, 0], [0.07, 0.085, 0.095, -0.004], [0.1, 0.067, 0.077, -0.008],
    [0.117, 0.03, 0.034, -0.01], [0.121, 0.002, 0.002, -0.01],
  ]),
};

// Hand hanging from the wrist (y=0) along -y; thin across x so the palm faces the thigh.
const HAND = R([
  [0.02, 0.018, 0.021], [0, 0.016, 0.023], [-0.03, 0.013, 0.03, 0.002], [-0.06, 0.012, 0.031, 0.004],
  [-0.085, 0.01, 0.026, 0.006], [-0.1, 0.008, 0.016, 0.008], [-0.107, 0.002, 0.003, 0.008],
]);
const THUMB = R([[0, 0.009, 0.01], [-0.025, 0.008, 0.008], [-0.045, 0.006, 0.006], [-0.052, 0.001, 0.001]]);

/** Foot from heel (y=0) to toe (y=0.24) before being laid flat; z here becomes "down". Shared with shoes. */
export const FOOT = R([
  [0, 0.004, 0.004, 0], [0.01, 0.02, 0.026, 0], [0.04, 0.028, 0.034, -0.004], [0.09, 0.032, 0.03, 0.002],
  [0.14, 0.038, 0.022, 0.012], [0.19, 0.04, 0.016, 0.02], [0.222, 0.033, 0.012, 0.024], [0.236, 0.018, 0.008, 0.026], [0.24, 0.002, 0.002, 0.026],
]);

export function useGeometries<T extends Record<string, THREE.BufferGeometry>>(make: () => T, deps: unknown[]) {
  const geos = useMemo(make, deps);
  useEffect(() => () => Object.values(geos).forEach((g) => g.dispose()), [geos]);
  return geos;
}

interface MannequinProps {
  spec: BodySpec;
  skin: string;
  showFeet: boolean;
}

export default function Mannequin({ spec, skin, showFeet }: MannequinProps) {
  // Soft satin finish per the reference: low roughness with a light clear coat.
  const skinMat = useMemo(
    () => new THREE.MeshPhysicalMaterial({ color: skin, roughness: 0.35, clearcoat: 0.3, clearcoatRoughness: 0.25 }),
    [skin]
  );
  useEffect(() => () => skinMat.dispose(), [skinMat]);

  const geo = useGeometries(() => {
    const [upper, fore] = splitArm(spec.arm, spec.elbow);
    return {
      torso: loft(spec.torso, { segments: 72 }),
      neck: loft(spec.neck, { segments: 40 }),
      head: loft(HEADS[spec.gender], { segments: 56, subdivisions: 5 }),
      leg: loft(spec.leg, { segments: 48 }),
      upper: loft(upper, { segments: 36 }),
      fore: loft(fore, { segments: 36 }),
      hand: loft(HAND, { segments: 28 }),
      thumb: loft(THUMB, { segments: 16 }),
      foot: loft(FOOT, { segments: 32 }),
    };
  }, [spec]);

  const wristInForearm = -(spec.wrist - spec.elbow);
  const [tilt, turn] = spec.pose.head;

  return (
    <group>
      <mesh geometry={geo.torso} material={skinMat} dispose={null} />
      <mesh geometry={geo.neck} material={skinMat} dispose={null} />
      <mesh
        geometry={geo.head}
        material={skinMat}
        position={[0, spec.head.y, 0]}
        rotation={[tilt, turn, 0]}
        scale={spec.head.r / 0.1}
        dispose={null}
      />
      {([-1, 1] as const).map((side) => (
        <group key={side}>
          <ArmSpace spec={spec} side={side}>
            <mesh geometry={geo.upper} material={skinMat} dispose={null} />
            <ForearmSpace spec={spec} side={side}>
              <mesh geometry={geo.fore} material={skinMat} dispose={null} />
              <group position={[0, wristInForearm, 0]} scale={spec.handScale}>
                <mesh geometry={geo.hand} material={skinMat} dispose={null} />
                <mesh geometry={geo.thumb} material={skinMat} position={[side * -0.004, -0.012, 0.024]} rotation={[0.45, 0, side * 0.12]} dispose={null} />
              </group>
            </ForearmSpace>
          </ArmSpace>
          <LegSpace spec={spec} side={side}>
            <mesh geometry={geo.leg} material={skinMat} dispose={null} />
            {showFeet && (
              <FootSpace spec={spec}>
                <mesh geometry={geo.foot} material={skinMat} dispose={null} />
              </FootSpace>
            )}
          </LegSpace>
        </group>
      ))}
    </group>
  );
}
