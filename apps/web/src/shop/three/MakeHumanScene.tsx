import { useCallback, useEffect, useMemo, useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader, type GLTF } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import type { Slot } from '../data';
import { builds, type Build, type Gender } from './body';
import type { FitItem } from './fitItem';
import { makeWeaveTexture } from './fabricTexture';

/*
 * Realistic mannequin built with MakeHuman (see tools/fitting-room): one posed
 * body per gender plus a separately fitted GLB per garment, all in the same
 * space. Only the garments being worn are downloaded.
 */

const draco = new DRACOLoader().setDecoderPath('/draco/');
const loader = new GLTFLoader().setDRACOLoader(draco);
const cache = new Map<string, Promise<GLTF>>();

// How many model files are still downloading, so the page can say so.
let pending = 0;
const listeners = new Set<(n: number) => void>();
const setPending = (n: number) => {
  pending = n;
  listeners.forEach((l) => l(n));
};

function loadGltf(url: string) {
  if (!cache.has(url)) {
    setPending(pending + 1);
    const p = loader.loadAsync(url);
    p.finally(() => setPending(pending - 1)).catch(() => undefined);
    cache.set(url, p);
  }
  return cache.get(url)!;
}

/** Number of model files still downloading. */
export function usePendingModels() {
  const [n, setN] = useState(pending);
  useEffect(() => {
    listeners.add(setN);
    return () => {
      listeners.delete(setN);
    };
  }, []);
  return n;
}

/** The loaded scene for a URL, or null while it downloads or if it fails. */
function useGltf(url: string | undefined) {
  const [state, setState] = useState<{ url: string; gltf: GLTF } | null>(null);
  useEffect(() => {
    if (!url) return;
    let alive = true;
    loadGltf(url)
      .then((gltf) => alive && setState({ url, gltf }))
      .catch(() => alive && setState(null));
    return () => {
      alive = false;
    };
  }, [url]);
  return state && state.url === url ? state.gltf : null;
}

// Garments on outer layers win the depth test over those underneath where they touch, and hide
// the parts of lower layers they cover. Shoes sit over the trouser hem, outerwear over tops.
const LAYER: Record<Slot | 'base', number> = { base: 0, bottom: 1, hat: 1, shoes: 2, top: 2, dress: 2, outer: 3 };
// a top worn tucked into the trousers sits under them
const TUCKED_LAYER = 0.5;
// metres per layer an outer garment is drawn nearer the camera than the one under it
const DEPTH_BIAS = 0.007;
// metres a garment's covered parts are drawn further from the camera, behind the garment over them
const COVERED_PUSH = 0.03;
// skin under two overlapping garments goes back further still, behind the pushed-back inner one
const SKIN_PUSH = 0.045;

/**
 * Move a material's vertices along the view ray (depth only, nothing moves on screen): `bias`
 * toward the camera everywhere, and `push` away from it where the `covered` attribute is 1.
 */
function shiftDepth(mat: THREE.Material, bias: number, push: number) {
  mat.onBeforeCompile = (shader) => {
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nattribute float covered;')
      .replace(
        '#include <project_vertex>',
        `#include <project_vertex>
        gl_Position = projectionMatrix * vec4(mvPosition.xyz + normalize(-mvPosition.xyz) * (${bias.toFixed(4)} - covered * ${push.toFixed(4)}), 1.0);`
      );
  };
  mat.customProgramCacheKey = () => `shift-${bias}-${push}`;
}

/**
 * Body vertex lists a garment carries: `hide` is the skin under it (kept tight, so necklines and
 * cuffs never open a hole); `cover` reaches further and hides garments worn underneath.
 */
type Mask = { hide: string; cover: string };

/** Body vertex id stored on a vertex; Draco hands back floats a hair off the integer. */
const vidAt = (vid: THREE.BufferAttribute, i: number) => Math.round(vid.getX(i));

/** Expand "12-40,57" lists into a lookup of body vertex ids: 1 where at least `min` lists include the id. */
function hiddenLookup(ranges: string[], size: number, min = 1) {
  const count = new Uint8Array(size);
  for (const list of ranges) {
    for (const part of list.split(',')) {
      if (!part) continue;
      const [a, b] = part.split('-').map(Number);
      for (let i = a; i <= (b ?? a) && i < size; i++) count[i]++;
    }
  }
  return count.map((c) => (c >= min ? 1 : 0));
}

/** Meshes masked by body vertex id (_VID: own id on the body, nearest body vertex on a garment). */
type Maskable = { mesh: THREE.Mesh; index: ArrayLike<number>; vid?: THREE.BufferAttribute }[];

/** Give each mesh its own geometry copy, since its triangle list is rewritten per outfit. */
function maskable(scene: THREE.Object3D): Maskable {
  const out: Maskable = [];
  scene.traverse((o) => {
    const mesh = o as THREE.Mesh;
    if (!mesh.isMesh) return;
    mesh.geometry = mesh.geometry.clone();
    const vid = (mesh.geometry.getAttribute('_vid') ?? mesh.geometry.getAttribute('_VID')) as THREE.BufferAttribute | undefined;
    out.push({ mesh, index: mesh.geometry.index ? Array.from(mesh.geometry.index.array) : [], vid });
  });
  return out;
}

/** Drop every body triangle that touches a hidden body vertex. */
function useMask(meshes: Maskable | null, hide: string[]) {
  const key = hide.join('|');
  useEffect(() => {
    if (!meshes) return;
    for (const { mesh, index, vid } of meshes) {
      if (!vid || index.length === 0) continue;
      if (!hide.length) {
        mesh.geometry.setIndex(Array.from(index));
        continue;
      }
      let max = 0;
      for (let i = 0; i < vid.count; i++) max = Math.max(max, vidAt(vid, i));
      const hidden = hiddenLookup(hide, max + 1);
      const kept: number[] = [];
      for (let t = 0; t < index.length; t += 3) {
        const a = index[t], b = index[t + 1], c = index[t + 2];
        if (hidden[vidAt(vid, a)] || hidden[vidAt(vid, b)] || hidden[vidAt(vid, c)]) continue;
        kept.push(a, b, c);
      }
      mesh.geometry.setIndex(kept);
    }
  }, [meshes, key]);
  useEffect(() => () => meshes?.forEach(({ mesh }) => mesh.geometry.dispose()), [meshes]);
}

/**
 * The bare body. Garments carry the skin they cover (MakeHuman delete groups plus a ray test);
 * the body drops those triangles so skin never pokes through tight clothes, shoes or hats.
 */
function Body({ gender, skin, hide, cover }: { gender: Gender; skin: string; hide: string[]; cover: string[] }) {
  const gltf = useGltf(`/models/${gender}/body.glb`);
  const material = useMemo(() => {
    const m = new THREE.MeshPhysicalMaterial({ color: skin, roughness: 0.35, clearcoat: 0.3, clearcoatRoughness: 0.25 });
    // skin where two garments overlap (near a hem) stays behind both
    shiftDepth(m, 0, SKIN_PUSH);
    return m;
  }, [skin]);
  useEffect(() => () => material.dispose(), [material]);
  const parts = useMemo(() => {
    if (!gltf) return null;
    const scene = gltf.scene.clone(true);
    const meshes = maskable(scene);
    meshes.forEach(({ mesh }) => (mesh.material = material));
    return { scene, meshes };
  }, [gltf, material]);
  useMask(parts?.meshes ?? null, hide);
  // Only skin under two overlapping garments (a waist under a shirt and trousers) goes back, so it
  // stays behind the inner one there. Skin under a single garment can be in plain view (a face
  // under a cap brim, a neck inside a collar) and must keep its depth.
  useCovered(parts?.meshes ?? null, cover, 2);
  return parts ? <primitive object={parts.scene} /> : null;
}

/**
 * Mark the garment vertices that a garment worn over this one covers (`covered` attribute, 0/1).
 * The shader pushes them back from the camera, so the outer garment always wins there. Garments
 * are fitted one by one and cross each other (a trouser waistband or fly through a shirt hem);
 * hiding those triangles instead leaves holes, because garment triangles are large and straddle
 * the hem.
 */
function useCovered(meshes: Maskable | null, cover: string[], min = 1) {
  const key = cover.join('|');
  useEffect(() => {
    if (!meshes) return;
    for (const { mesh, vid } of meshes) {
      const geo = mesh.geometry;
      const n = geo.getAttribute('position').count;
      let attr = geo.getAttribute('covered') as THREE.BufferAttribute | undefined;
      if (!attr) {
        attr = new THREE.BufferAttribute(new Float32Array(n), 1);
        geo.setAttribute('covered', attr);
      }
      const flags = attr.array as Float32Array;
      flags.fill(0);
      if (vid && cover.length) {
        let max = 0;
        for (let i = 0; i < vid.count; i++) max = Math.max(max, vidAt(vid, i));
        const hidden = hiddenLookup(cover, max + 1, min);
        for (let i = 0; i < n; i++) flags[i] = hidden[vidAt(vid, i)] ?? 0;
      }
      attr.needsUpdate = true;
    }
  }, [meshes, key, min]);
}

interface GarmentProps {
  gender: Gender;
  model: string;
  layer: number;
  fabric?: FitItem['fabric'];
  /** what the garments worn over this one cover; those parts of this garment are drawn behind them */
  cover: string[];
  onReady?: (key: string, mask: Mask) => void;
}

function Garment({ gender, model, layer, fabric, cover, onReady }: GarmentProps) {
  const url = `/models/${gender}/${model}.glb`;
  const gltf = useGltf(url);
  useEffect(() => {
    if (!gltf) return;
    const mask: Mask = { hide: '', cover: '' };
    gltf.scene.traverse((o) => {
      for (const k of ['hide', 'cover'] as const) {
        if (typeof o.userData[k] === 'string') mask[k] += (mask[k] ? ',' : '') + o.userData[k];
      }
    });
    // older builds shipped only "hide"
    if (!mask.cover) mask.cover = mask.hide;
    onReady?.(url, mask);
  }, [gltf, url, onReady]);
  // rebuild the texture only when the cloth itself changes, not on every new props object
  const fabricKey = fabric ? `${fabric.weave}:${fabric.colors.join()}` : '';
  const fabricMap = useMemo(() => {
    if (!fabric) return null;
    const t = makeWeaveTexture(fabric.weave, fabric.colors);
    // garment UVs cover the whole pattern piece, so the weave tile repeats many times
    t.repeat.set(22, 22);
    t.flipY = false; // glTF UV convention
    return t;
  }, [fabricKey]);
  useEffect(() => () => fabricMap?.dispose(), [fabricMap]);

  const parts = useMemo(() => {
    if (!gltf) return null;
    const scene = gltf.scene.clone(true);
    const meshes = maskable(scene);
    for (const { mesh } of meshes) {
      const mat = (mesh.material as THREE.MeshStandardMaterial).clone();
      // single-layer cloth: show the inside where it is open (cuffs, hems, necklines)
      mat.side = THREE.DoubleSide;
      // The assets export as alpha "BLEND", which turns off depth writes and lets the far side of
      // a garment draw over the near side (it looks see-through). Draw cloth solid instead; alpha
      // test still cuts real holes such as lace or mesh.
      mat.transparent = false;
      mat.depthWrite = true;
      mat.opacity = 1;
      mat.alphaTest = 0.5;
      // Depth only, along the view ray, so nothing moves on screen: outer layers come a few
      // millimetres per layer toward the camera (they win where garments touch), and parts
      // covered by a garment worn over this one go back by COVERED_PUSH (they never poke through).
      shiftDepth(mat, DEPTH_BIAS * layer, COVERED_PUSH);
      if (fabricMap) {
        // Homfaai piece: our woven cloth on this cut; keep the garment's own seams and folds in the normal map
        mat.map = fabricMap;
        mat.color = new THREE.Color('#ffffff');
        mat.roughness = 0.8;
      }
      mesh.material = mat;
    }
    return { scene, meshes };
  }, [gltf, layer, fabricMap]);
  useEffect(() => () => parts?.meshes.forEach(({ mesh }) => (mesh.material as THREE.Material).dispose()), [parts]);
  useCovered(parts?.meshes ?? null, cover);
  return parts ? <primitive object={parts.scene} /> : null;
}

interface Props {
  gender: Gender;
  skin: string;
  build: Build;
  items: FitItem[];
  baseLayers: { top?: string; bottom?: string };
}

export default function MakeHumanScene({ gender, skin, build, items, baseLayers }: Props) {
  const w = builds.find((b) => b.id === build)!.width;

  // url -> body vertices that garment covers, once it has loaded
  const [ready, setReady] = useState<Map<string, Mask>>(() => new Map());
  const markReady = useCallback(
    (key: string, mask: Mask) =>
      setReady((r) => {
        const old = r.get(key);
        return old && old.hide === mask.hide && old.cover === mask.cover ? r : new Map(r).set(key, mask);
      }),
    []
  );
  const urlOf = (model: string) => `/models/${gender}/${model}.glb`;
  const covered = (slots: Slot[]) => items.some((i) => i.model && slots.includes(i.slot) && ready.has(urlOf(i.model)));

  // Underwear covers the body until the garment that replaces it is on screen, so the mannequin
  // is never bare while downloading and never shows underwear through tight clothes.
  // The base top is a bra, so only the female body wears it.
  const baseTop = gender === 'female' && baseLayers.top && !covered(['top', 'dress']) ? baseLayers.top : undefined;
  const baseBottom = baseLayers.bottom && !covered(['bottom', 'dress']) ? baseLayers.bottom : undefined;

  const worn: { key: string; model: string; layer: number; fabric?: FitItem['fabric'] }[] = [
    ...(baseTop ? [{ key: 'base-top', model: baseTop, layer: LAYER.base }] : []),
    ...(baseBottom ? [{ key: 'base-bottom', model: baseBottom, layer: LAYER.base }] : []),
    ...items.flatMap((i) =>
      i.model ? [{ key: i.id, model: i.model, layer: i.tucked ? TUCKED_LAYER : LAYER[i.slot], fabric: i.fabric }] : []
    ),
  ];
  const hideOf = (model: string) => ready.get(urlOf(model))?.hide;
  const coverOf = (model: string) => ready.get(urlOf(model))?.cover;
  const bodyHide = worn.map((g) => hideOf(g.model)).filter((h): h is string => !!h);
  const bodyCover = worn.map((g) => coverOf(g.model)).filter((h): h is string => !!h);

  return (
    <group scale={[w, 1, 1 + (w - 1) * 0.7]}>
      {/* keep the body off screen until its underwear has loaded, so it never shows bare */}
      {(!baseTop || ready.has(urlOf(baseTop))) && (!baseBottom || ready.has(urlOf(baseBottom))) && (
        <Body gender={gender} skin={skin} hide={bodyHide} cover={bodyCover} />
      )}
      {worn.map((g) => (
        <Garment
          key={`${gender}-${g.key}`}
          gender={gender}
          model={g.model}
          layer={g.layer}
          fabric={g.fabric}
          // parts of this garment under a higher layer (a trouser waist under a shirt) go behind it
          cover={worn.filter((o) => o.layer > g.layer).map((o) => coverOf(o.model)).filter((h): h is string => !!h)}
          onReady={markReady}
        />
      ))}
    </group>
  );
}
