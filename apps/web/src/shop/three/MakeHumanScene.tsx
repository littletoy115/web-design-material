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
const LAYER: Record<Slot | 'base', number> = { base: 0, shoes: 1, bottom: 1, top: 2, dress: 2, outer: 3, hat: 1 };

function Body({ gender, skin }: { gender: Gender; skin: string }) {
  const gltf = useGltf(`/models/${gender}/body.glb`);
  const material = useMemo(
    () => new THREE.MeshPhysicalMaterial({ color: skin, roughness: 0.35, clearcoat: 0.3, clearcoatRoughness: 0.25 }),
    [skin]
  );
  useEffect(() => () => material.dispose(), [material]);
  const scene = useMemo(() => {
    if (!gltf) return null;
    const s = gltf.scene.clone(true);
    s.traverse((o) => {
      const m = o as THREE.Mesh;
      if (m.isMesh) m.material = material;
    });
    return s;
  }, [gltf, material]);
  return scene ? <primitive object={scene} /> : null;
}

interface GarmentProps {
  gender: Gender;
  model: string;
  layer: number;
  fabric?: FitItem['fabric'];
  onReady?: (key: string) => void;
}

function Garment({ gender, model, layer, fabric, onReady }: GarmentProps) {
  const url = `/models/${gender}/${model}.glb`;
  const gltf = useGltf(url);
  useEffect(() => {
    if (gltf) onReady?.(url);
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
  const [ready, setReady] = useState<Set<string>>(() => new Set());
  const markReady = useCallback((key: string) => setReady((r) => (r.has(key) ? r : new Set(r).add(key))), []);
  const covered = (slots: Slot[]) =>
    items.some((i) => i.model && slots.includes(i.slot) && ready.has(`/models/${gender}/${i.model}.glb`));

  return (
    <group scale={[w, 1, 1 + (w - 1) * 0.7]}>
      <Body gender={gender} skin={skin} />
      {/* the base top is a bra, so only the female body wears it */}
      {gender === 'female' && baseLayers.top && !covered(['top', 'dress']) && (
        <Garment gender={gender} model={baseLayers.top} layer={LAYER.base} />
      )}
      {baseLayers.bottom && !covered(['bottom', 'dress']) && <Garment gender={gender} model={baseLayers.bottom} layer={LAYER.base} />}
      {items.map(
        (i) =>
          i.model && (
            <Garment key={`${gender}-${i.id}`} gender={gender} model={i.model} layer={LAYER[i.slot]} fabric={i.fabric} onReady={markReady} />
          )
      )}
    </group>
  );
}
