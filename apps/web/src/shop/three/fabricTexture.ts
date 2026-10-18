import * as THREE from 'three';
import type { Weave } from '../data';

/** Paints one tile of a weave on a canvas — the 3D twin of WeavePattern in FabricArt. */
export function makeWeaveTexture(weave: Weave, [base, thread]: [string, string]) {
  const size = 64;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, size, size);
  ctx.fillStyle = thread;
  ctx.strokeStyle = thread;

  switch (weave) {
    case 'plain':
      for (let i = 0; i < size; i += 4) {
        ctx.fillRect(0, i, size, 1);
        ctx.fillRect(i, 0, 1, size);
      }
      break;
    case 'stripe':
      ctx.fillRect(0, 0, 14, size);
      break;
    case 'check':
      ctx.globalAlpha = 0.55;
      ctx.fillRect(0, 0, 22, size);
      ctx.fillRect(0, 0, size, 22);
      break;
    case 'shibori':
      ctx.lineWidth = 3;
      ctx.setLineDash([5, 4]);
      for (const [x, y] of [
        [16, 16],
        [48, 48],
      ]) {
        ctx.beginPath();
        ctx.arc(x, y, 9, 0, Math.PI * 2);
        ctx.stroke();
        ctx.globalAlpha = 0.6;
        ctx.beginPath();
        ctx.arc(x, y, 2.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
      }
      break;
    case 'herringbone':
      ctx.lineWidth = 4;
      for (let y = 0; y < size; y += 16) {
        ctx.beginPath();
        ctx.moveTo(0, y + 16);
        ctx.lineTo(16, y);
        ctx.lineTo(32, y + 16);
        ctx.lineTo(48, y);
        ctx.lineTo(64, y + 16);
        ctx.stroke();
      }
      break;
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}

/**
 * Normal map for the weave: a fine over-under thread relief, plus the pattern's
 * own light/dark areas as raised/sunken yarn. Tiles with the colour texture.
 */
export function makeWeaveNormal(colorMap: THREE.CanvasTexture, strength = 2.2) {
  const src = colorMap.image as HTMLCanvasElement;
  const size = src.width;
  const pixels = src.getContext('2d')!.getImageData(0, 0, size, size).data;

  const height = new Float32Array(size * size);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = (y * size + x) * 4;
      const lum = (0.299 * pixels[i] + 0.587 * pixels[i + 1] + 0.114 * pixels[i + 2]) / 255;
      // basket weave: alternating warp/weft bumps every 4px
      const thread = Math.sin((x / 4) * Math.PI) * Math.sin((y / 4) * Math.PI) * 0.5;
      height[y * size + x] = lum * 0.5 + thread;
    }
  }

  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const out = ctx.createImageData(size, size);
  const h = (x: number, y: number) => height[((y + size) % size) * size + ((x + size) % size)];
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const dx = (h(x + 1, y) - h(x - 1, y)) * strength;
      const dy = (h(x, y + 1) - h(x, y - 1)) * strength;
      const len = Math.hypot(dx, dy, 1);
      const i = (y * size + x) * 4;
      out.data[i] = ((-dx / len) * 0.5 + 0.5) * 255;
      out.data[i + 1] = ((dy / len) * 0.5 + 0.5) * 255;
      out.data[i + 2] = ((1 / len) * 0.5 + 0.5) * 255;
      out.data[i + 3] = 255;
    }
  }
  ctx.putImageData(out, 0, 0);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.colorSpace = THREE.NoColorSpace;
  texture.repeat.copy(colorMap.repeat);
  return texture;
}

interface FabricOptions {
  repeat?: [number, number];
  /** use the loft's vertex colours (darker fold valleys); only for geometry that has them */
  vertexColors?: boolean;
  side?: THREE.Side;
}

/** Fabric per the spec: physically based, matte (roughness 0.8), with a weave normal map. */
export function makeFabricMaterial(weave: Weave, colors: [string, string], { repeat, vertexColors = false, side = THREE.DoubleSide }: FabricOptions = {}) {
  const map = makeWeaveTexture(weave, colors);
  if (repeat) map.repeat.set(repeat[0], repeat[1]);
  const normalMap = makeWeaveNormal(map);
  return new THREE.MeshPhysicalMaterial({
    map,
    normalMap,
    normalScale: new THREE.Vector2(0.7, 0.7),
    roughness: 0.8,
    sheen: 0.45,
    sheenRoughness: 0.6,
    sheenColor: new THREE.Color('#ffffff'),
    vertexColors,
    side,
  });
}

/** The inside of a garment: same cloth, in shadow. Shares the outer material's textures. */
export function makeLiningMaterial(outer: THREE.MeshPhysicalMaterial) {
  const inner = outer.clone();
  inner.side = THREE.BackSide;
  inner.color = new THREE.Color(0.58, 0.58, 0.6);
  inner.sheen = 0;
  return inner;
}

export function disposeMaterial(mat: THREE.MeshPhysicalMaterial) {
  mat.map?.dispose();
  mat.normalMap?.dispose();
  mat.dispose();
}
