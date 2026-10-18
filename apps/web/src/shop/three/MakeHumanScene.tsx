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

// Garments on outer layers win the depth test over those underneath where they touch.
// Shoes sit over the trouser hem, outerwear over tops.
const LAYER: Record<Slot | 'base', number> = { base: 0, bottom: 1, hat: 1, shoes: 2, top: 2, dress: 2, outer: 3 };

/** Expand "12-40,57" into a lookup of hidden body vertex ids. */
function hiddenLookup(ranges: string[], size: number) {
  const hidden = new Uint8Array(size);
  for (const list of ranges) {
    for (const part of list.split(',')) {
      if (!part) continue;
      const [a, b] = part.split('-').map(Number);
      for (let i = a; i <= (b ?? a) && i < size; i++) hidden[i] = 1;
    }
  }
  return hidden;
}

/**
 * The bare body. Garments carry MakeHuman's delete groups (which skin they cover); the body
 * drops those triangles so skin never pokes through tight clothes, shoes or hats.
 */
function Body({ gender, skin, hide }: { gender: Gender; skin: string; hide: string[] }) {
  const gltf = useGltf(`/models/${gender}/body.glb`);
  const material = useMemo(
    () => new THREE.MeshPhysicalMaterial({ color: skin, roughness: 0.35, clearcoat: 0.3, clearcoatRoughness: 0.25 }),
    [skin]
  );
  useEffect(() => () => material.dispose(), [material]);

  // own copy of the geometry, since its triangle list is rewritten per outfit
  const parts = useMemo(() => {
    if (!gltf) return null;
    const scene = gltf.scene.clone(true);
    const meshes: { mesh: THREE.Mesh; index: ArrayLike<number>; vid?: THREE.BufferAttribute }[] = [];
    scene.traverse((o) => {
      const mesh = o as THREE.Mesh;
      if (!mesh.isMesh) return;
      mesh.geometry = mesh.geometry.clone();
      mesh.material = material;
      const vid = (mesh.geometry.getAttribute('_vid') ?? mesh.geometry.getAttribute('_VID')) as THREE.BufferAttribute | undefined;
      const index = mesh.geometry.index ? Array.from(mesh.geometry.index.array) : [];
      meshes.push({ mesh, index, vid });
    });
    return { scene, meshes };
  }, [gltf, material]);

  const hideKey = hide.join('|');
  useEffect(() => {
    if (!parts) return;
    for (const { mesh, index, vid } of parts.meshes) {
      if (!vid || index.length === 0) continue;
      let max = 0;
      for (let i = 0; i < vid.count; i++) max = Math.max(max, vid.getX(i));
      const hidden = hiddenLookup(hide, max + 1);
      const kept: number[] = [];
      for (let t = 0; t < index.length; t += 3) {
        const a = index[t], b = index[t + 1], c = index[t + 2];
        if (hidden[vid.getX(a)] || hidden[vid.getX(b)] || hidden[vid.getX(c)]) continue;
        kept.push(a, b, c);
      }
      mesh.geometry.setIndex(kept);
    }
  }, [parts, hideKey]);
  useEffect(() => () => parts?.meshes.forEach(({ mesh }) => mesh.geometry.dispose()), [parts]);

  return parts ? <primitive object={parts.scene} /> : null;
}

interface GarmentProps {
  gender: Gender;
  model: string;
  layer: number;
  fabric?: FitItem['fabric'];
  onReady?: (key: string, hide: string) => void;
}

function Garment({ gender, model, layer, fabric, onReady }: GarmentProps) {
  const url = `/models/${gender}/${model}.glb`;
  const gltf = useGltf(url);
  useEffect(() => {
    if (!gltf) return;
    let hide = '';
    gltf.scene.traverse((o) => {
      if (typeof o.userData.hide === 'string') hide += (hide ? ',' : '') + o.userData.hide;
    });
    onReady?.(url, hide);
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

  const scene = useMemo(() => {
    if (!gltf) return null;
    const s = gltf.scene.clone(true);
    s.traverse((o) => {
      const mesh = o as THREE.Mesh;
      if (!mesh.isMesh) return;
      const src = mesh.material as THREE.MeshStandardMaterial;
      const mat = src.clone();
      // single-layer cloth: show the inside where it is open (cuffs, hems, necklines)
      mat.side = THREE.DoubleSide;
      mat.polygonOffset = true;
      mat.polygonOffsetFactor = -layer;
      mat.polygonOffsetUnits = -4 * layer;
      if (fabricMap) {
        // Homfaai piece: our woven cloth on this cut; keep the garment's own seams and folds in the normal map
        mat.map = fabricMap;
        mat.color = new THREE.Color('#ffffff');
        mat.roughness = 0.8;
      }
      mesh.material = mat;
    });
    return s;
  }, [gltf, layer, fabricMap]);
  useEffect(
    () => () =>
      scene?.traverse((o) => {
        const m = (o as THREE.Mesh).material as THREE.Material | undefined;
        if (m) m.dispose();
      }),
    [scene]
  );
  return scene ? <primitive object={scene} /> : null;
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

  // Underwear covers the body until the garment that replaces it is on screen, so the
  // mannequin is never bare while downloading and never shows underwear through tight clothes.
  // url -> body vertices that garment covers, once it has loaded
  const [ready, setReady] = useState<Map<string, string>>(() => new Map());
  const markReady = useCallback(
    (key: string, hide: string) => setReady((r) => (r.get(key) === hide ? r : new Map(r).set(key, hide))),
    []
  );
  const urlOf = (model: string) => `/models/${gender}/${model}.glb`;
  const covered = (slots: Slot[]) => items.some((i) => i.model && slots.includes(i.slot) && ready.has(urlOf(i.model)));

  // the base top is a bra, so only the female body wears it
  const baseTop = gender === 'female' && baseLayers.top && !covered(['top', 'dress']) ? baseLayers.top : undefined;
  const baseBottom = baseLayers.bottom && !covered(['bottom', 'dress']) ? baseLayers.bottom : undefined;
  const onBody = [baseTop, baseBottom, ...items.map((i) => i.model)].filter((m): m is string => !!m);
  const hide = onBody.map((m) => ready.get(urlOf(m))).filter((h): h is string => !!h);

  return (
    <group scale={[w, 1, 1 + (w - 1) * 0.7]}>
      <Body gender={gender} skin={skin} hide={hide} />
      {baseTop && <Garment gender={gender} model={baseTop} layer={LAYER.base} onReady={markReady} />}
      {baseBottom && <Garment gender={gender} model={baseBottom} layer={LAYER.base} onReady={markReady} />}
      {items.map(
        (i) =>
          i.model && (
            <Garment key={`${gender}-${i.id}`} gender={gender} model={i.model} layer={LAYER[i.slot]} fabric={i.fabric} onReady={markReady} />
          )
      )}
    </group>
  );
}
