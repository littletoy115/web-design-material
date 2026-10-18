// Body proportions and pose for the fitting-room mannequins. No three.js
// imports here, so the page can use these options without pulling the 3D bundle.
import type { Ring } from './loft';

export type Gender = 'female' | 'male';
export type Build = 'slim' | 'regular' | 'curvy';
export type Side = -1 | 1;

export const genders: { id: Gender; label: string }[] = [
  { id: 'female', label: 'Female' },
  { id: 'male', label: 'Male' },
];

export const builds: { id: Build; label: string; width: number; size: string }[] = [
  { id: 'slim', label: 'Slim', width: 0.92, size: 'S' },
  { id: 'regular', label: 'Regular', width: 1, size: 'M' },
  { id: 'curvy', label: 'Curvy', width: 1.13, size: 'L' },
];

export const skinTones = [
  { id: 'light', label: 'Fair', color: '#EAD3C3' },
  { id: 'wheat', label: 'Medium', color: '#D2A585' },
  { id: 'tan', label: 'Tan', color: '#A97A5C' },
  { id: 'deep', label: 'Deep', color: '#6B4A38' },
];

/** Joint angles in radians. Arms: abduct swings the arm out, bend folds the elbow in. */
export interface Pose {
  arm: Record<Side, { abduct: number; forward: number; bend: number; bendForward: number }>;
  leg: Record<Side, { forward: number; inward: number }>;
  /** head tilt (x) and turn (y) */
  head: [number, number];
}

export interface BodySpec {
  gender: Gender;
  /** torso cross-sections, crotch to neck */
  torso: Ring[];
  /** one leg, ankle to hip, centred on its own axis */
  leg: Ring[];
  legX: number;
  /** one arm in its own space: y=0 at the shoulder joint, negative downward */
  arm: Ring[];
  /** distance from shoulder joint to elbow and to wrist */
  elbow: number;
  wrist: number;
  shoulder: [number, number];
  neck: Ring[];
  head: { y: number; r: number };
  handScale: number;
  footLength: number;
  pose: Pose;
  lm: { neckBase: number; shoulder: number; chest: number; waist: number; hip: number; crotch: number; knee: number; ankle: number };
}

/** [y, half-width, front depth, back depth] */
type Row = [y: number, a: number, b: number, back?: number];
const rows = (r: Row[]): Ring[] => r.map(([y, a, b, back]) => ({ y, a, b, back: back ?? b }));

/* Female: narrow shoulders, bust, small waist, full hips and seat, long neck,
   slender limbs. Relaxed contrapposto with a hand at the hip. */
const FEMALE: Omit<BodySpec, 'gender'> = {
  torso: rows([
    [0.8, 0.055, 0.05, 0.05], [0.835, 0.148, 0.1, 0.115], [0.87, 0.17, 0.1, 0.136], [0.92, 0.173, 0.098, 0.126],
    [0.98, 0.15, 0.09, 0.1], [1.04, 0.117, 0.082, 0.076], [1.1, 0.122, 0.085, 0.08], [1.15, 0.13, 0.102, 0.084],
    [1.2, 0.14, 0.136, 0.088], [1.245, 0.142, 0.118, 0.09], [1.29, 0.146, 0.09, 0.088], [1.33, 0.155, 0.074, 0.08],
    [1.37, 0.116, 0.062, 0.066], [1.395, 0.054, 0.046, 0.048], [1.41, 0.042, 0.041, 0.042],
  ]),
  leg: rows([
    [0.06, 0.026, 0.03, 0.03], [0.09, 0.028, 0.031, 0.032], [0.2, 0.036, 0.038, 0.045], [0.32, 0.044, 0.041, 0.055],
    [0.42, 0.041, 0.041, 0.046], [0.5, 0.041, 0.045, 0.041], [0.6, 0.055, 0.06, 0.057], [0.72, 0.07, 0.075, 0.078],
    [0.84, 0.082, 0.085, 0.09], [0.89, 0.082, 0.084, 0.088],
  ]),
  legX: 0.085,
  arm: rows([
    [-0.545, 0.02, 0.017], [-0.5, 0.023, 0.019], [-0.44, 0.027, 0.025], [-0.36, 0.031, 0.03], [-0.3, 0.027, 0.028],
    [-0.22, 0.033, 0.036], [-0.1, 0.038, 0.042], [0, 0.041, 0.045], [0.02, 0.029, 0.032],
  ]),
  elbow: 0.3,
  wrist: 0.54,
  shoulder: [0.143, 1.322],
  neck: rows([[1.36, 0.05, 0.044, 0.046], [1.41, 0.037, 0.035, 0.036], [1.47, 0.034, 0.034, 0.034], [1.51, 0.033, 0.034, 0.033]]),
  head: { y: 1.575, r: 0.085 },
  handScale: 0.92,
  footLength: 0.23,
  pose: {
    arm: {
      1: { abduct: 0.55, forward: 0.12, bend: -0.95, bendForward: 0.12 },
      [-1]: { abduct: 0.08, forward: 0.06, bend: -0.14, bendForward: -0.22 },
    },
    leg: {
      1: { forward: 0, inward: 0.02 },
      [-1]: { forward: -0.13, inward: 0.075 },
    },
    head: [0.08, -0.12],
  },
  lm: { neckBase: 1.4, shoulder: 1.33, chest: 1.2, waist: 1.04, hip: 0.9, crotch: 0.8, knee: 0.5, ankle: 0.09 },
};

/* Male: broad shoulders tapering to narrow hips (V), flatter chest with
   pecs, thick neck, muscular arms and calves, bigger hands and feet.
   Square, even stance with both arms hanging. */
const MALE: Omit<BodySpec, 'gender'> = {
  torso: rows([
    [0.84, 0.065, 0.055, 0.055], [0.875, 0.148, 0.1, 0.108], [0.92, 0.153, 0.1, 0.112], [1.0, 0.147, 0.098, 0.1],
    [1.08, 0.144, 0.097, 0.094], [1.16, 0.158, 0.103, 0.1], [1.24, 0.178, 0.12, 0.11], [1.31, 0.19, 0.114, 0.114],
    [1.37, 0.2, 0.096, 0.102], [1.415, 0.208, 0.08, 0.088], [1.45, 0.15, 0.07, 0.076], [1.475, 0.066, 0.056, 0.06],
    [1.49, 0.055, 0.05, 0.053],
  ]),
  leg: rows([
    [0.06, 0.029, 0.033, 0.033], [0.09, 0.032, 0.034, 0.036], [0.21, 0.042, 0.042, 0.05], [0.35, 0.055, 0.048, 0.067],
    [0.44, 0.05, 0.048, 0.054], [0.53, 0.047, 0.05, 0.046], [0.64, 0.064, 0.07, 0.064], [0.77, 0.078, 0.084, 0.08],
    [0.9, 0.09, 0.092, 0.094], [0.93, 0.09, 0.09, 0.092],
  ]),
  legX: 0.09,
  arm: rows([
    [-0.585, 0.024, 0.02], [-0.55, 0.027, 0.022], [-0.47, 0.035, 0.032], [-0.39, 0.044, 0.04], [-0.32, 0.036, 0.036],
    [-0.25, 0.043, 0.046], [-0.16, 0.047, 0.053, 0.046], [-0.07, 0.053, 0.056], [0, 0.055, 0.058], [0.02, 0.038, 0.04],
  ]),
  elbow: 0.32,
  wrist: 0.58,
  shoulder: [0.19, 1.398],
  neck: rows([[1.44, 0.068, 0.058, 0.064], [1.49, 0.054, 0.05, 0.052], [1.54, 0.049, 0.048, 0.048], [1.58, 0.047, 0.047, 0.046]]),
  head: { y: 1.665, r: 0.094 },
  handScale: 1.15,
  footLength: 0.27,
  pose: {
    arm: {
      1: { abduct: 0.13, forward: 0.03, bend: -0.12, bendForward: -0.28 },
      [-1]: { abduct: 0.12, forward: -0.02, bend: -0.1, bendForward: -0.24 },
    },
    leg: {
      1: { forward: 0.015, inward: -0.04 },
      [-1]: { forward: -0.04, inward: -0.035 },
    },
    head: [0, 0.05],
  },
  lm: { neckBase: 1.48, shoulder: 1.4, chest: 1.25, waist: 1.08, hip: 0.93, crotch: 0.84, knee: 0.53, ankle: 0.09 },
};

const BASE: Record<Gender, Omit<BodySpec, 'gender'>> = { female: FEMALE, male: MALE };

export function bodySpec(gender: Gender, build: Build): BodySpec {
  const base = BASE[gender];
  const w = builds.find((b) => b.id === build)!.width;
  const limb = 1 + (w - 1) * 0.8;
  const widen = (rs: Ring[], k: number) => rs.map((r) => ({ ...r, a: r.a * k, b: r.b * k, back: (r.back ?? r.b) * k }));
  return {
    ...base,
    gender,
    // keep the neck rings as they are so collars still meet the neck
    torso: base.torso.map((r) => (r.y >= base.lm.neckBase - 0.01 ? r : { ...r, a: r.a * w, b: r.b * w, back: (r.back ?? r.b) * w })),
    leg: widen(base.leg, limb),
    legX: base.legX * w,
    arm: widen(base.arm, limb),
    shoulder: [base.shoulder[0] * w, base.shoulder[1]],
  };
}
