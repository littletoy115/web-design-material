import { useEffect, useMemo, useState } from 'react';
import * as THREE from 'three';
import { Canvas, useThree } from '@react-three/fiber';
import { ContactShadows, OrbitControls } from '@react-three/drei';
import { GLTFLoader, type GLTF } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { clone as cloneSkinned } from 'three/examples/jsm/utils/SkeletonUtils.js';
import { garmentSlot, type Slot } from '../data';
import { bodySpec, builds, type Build, type Gender } from './body';
import Mannequin from './Character';
import { BaseLayer, Garment3D, type WornItem } from './Garments';
import { disposeMaterial, makeFabricMaterial } from './fabricTexture';

/*
 * Mannequin viewer.
 *
 * If /models/mannequin.glb (female) or /models/mannequin-male.glb exists, it is
 * loaded instead of the built-in mannequin. Mesh naming contract for the file:
 *   - body meshes: any name; they get the satin skin material
 *   - garment meshes: "garment_<kind>" (e.g. garment_tee, garment_pants) for a
 *     specific product shape, or a slot name "top" | "outer" | "bottom" |
 *     "dress" | "shoes" | "hat" as a generic fallback for that slot
 * Garment meshes are hidden unless a product for them is worn; the product's
 * fabric texture is applied to whichever mesh is shown.
 */

const MODEL_URL: Record<Gender, string> = {
  female: '/models/mannequin.glb',
  male: '/models/mannequin-male.glb',
};
const MODEL_HEIGHT: Record<Gender, number> = { female: 1.67, male: 1.77 };
const SLOT_NAMES = new Set<string>(['top', 'outer', 'bottom', 'dress', 'shoes', 'hat']);

const TOPS = new Set(['tee', 'shirt', 'longshirt', 'tank', 'hoodie', 'knit', 'jacket', 'coat', 'vest', 'dress', 'shirtdress', 'maxi']);
const BOTTOMS = new Set(['pants', 'wide', 'shorts', 'skirt', 'pleated', 'dress', 'shirtdress', 'maxi']);
const SHOES = new Set(['sneakers', 'loafers', 'boots', 'sandals']);

/** Loads the GLB if it is really there (a missing file comes back as the SPA's index.html). */
function useOptionalGltf(url: string) {
  const [gltf, setGltf] = useState<GLTF | null>(null);
  useEffect(() => {
    let alive = true;
    setGltf(null);
    (async () => {
      try {
        const res = await fetch(url, { method: 'HEAD' });
        const type = res.headers.get('content-type') ?? '';
        if (!res.ok || type.includes('text/html')) return;
        const loaded = await new GLTFLoader().loadAsync(url);
        if (alive) setGltf(loaded);
      } catch {
        // No usable model: the built-in mannequin stays on screen.
      }
    })();
    return () => {
      alive = false;
    };
  }, [url]);
  return gltf;
}

function meshNames(gltf: GLTF) {
  const names = new Set<string>();
  gltf.scene.traverse((o) => {
    if ((o as THREE.Mesh).isMesh) names.add(o.name.toLowerCase());
  });
  return names;
}

/** Soft studio light from three's RoomEnvironment, prefiltered once. */
function StudioEnvironment() {
  const { gl, scene } = useThree();
  useEffect(() => {
    const pmrem = new THREE.PMREMGenerator(gl);
    const env = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = env;
    scene.environmentIntensity = 0.6;
    return () => {
      scene.environment = null;
      env.dispose();
      pmrem.dispose();
    };
  }, [gl, scene]);
  return null;
}

function BasePlate() {
  return (
    <mesh position={[0, -0.006, 0]}>
      <cylinderGeometry args={[0.3, 0.3, 0.012, 96]} />
      <meshPhysicalMaterial color="#C9CCD1" metalness={1} roughness={0.22} />
    </mesh>
  );
}

interface GlbProps {
  gltf: GLTF;
  gender: Gender;
  skin: string;
  build: Build;
  layers: WornItem[];
  names: Set<string>;
}

function GlbMannequin({ gltf, gender, skin, build, layers, names }: GlbProps) {
  // Clone (skeleton-aware) and fit: feet on the plate, centred, real-world height.
  const root = useMemo(() => {
    const r = cloneSkinned(gltf.scene);
    const box = new THREE.Box3().setFromObject(r);
    r.scale.setScalar(MODEL_HEIGHT[gender] / Math.max(box.max.y - box.min.y, 1e-6));
    box.setFromObject(r);
    const center = box.getCenter(new THREE.Vector3());
    r.position.set(-center.x, -box.min.y, -center.z);
    return r;
  }, [gltf, gender]);

  const skinMat = useMemo(
    () => new THREE.MeshPhysicalMaterial({ color: skin, roughness: 0.35, clearcoat: 0.3, clearcoatRoughness: 0.25 }),
    [skin]
  );
  useEffect(() => () => skinMat.dispose(), [skinMat]);

  // one fabric material per worn product, rebuilt only when the outfit changes
  const fabricKey = layers.map((l) => `${l.garment}:${l.weave}:${l.colors.join()}`).join('|');
  const fabrics = useMemo(
    () => new Map(layers.map((l) => [l.garment, makeFabricMaterial(l.weave, l.colors, { repeat: [4, 4] })])),
    // layers is a fresh array each render; fabricKey captures what matters
    // eslint-disable-next-line
    [fabricKey]
  );
  useEffect(() => () => fabrics.forEach(disposeMaterial), [fabrics]);

  useEffect(() => {
    const specific = (l: WornItem) => names.has(`garment_${l.garment}`);
    root.traverse((o) => {
      const mesh = o as THREE.Mesh;
      if (!mesh.isMesh) return;
      const n = mesh.name.toLowerCase();
      if (n.startsWith('garment_') || SLOT_NAMES.has(n)) {
        const item = n.startsWith('garment_')
          ? layers.find((l) => n === `garment_${l.garment}`)
          : layers.find((l) => garmentSlot[l.garment] === (n as Slot) && !specific(l));
        mesh.visible = !!item;
        if (item) mesh.material = fabrics.get(item.garment)!;
      } else {
        mesh.material = skinMat;
      }
    });
  }, [root, layers, fabrics, skinMat, names]);

  const w = builds.find((b) => b.id === build)!.width;
  return (
    <group scale={[w, 1, 1 + (w - 1) * 0.7]}>
      <primitive object={root} />
    </group>
  );
}

interface Fitting3DProps {
  gender: Gender;
  skin: string;
  build: Build;
  layers: WornItem[];
  label: string;
}

export default function Fitting3D({ gender, skin, build, layers, label }: Fitting3DProps) {
  const [autoRotate, setAutoRotate] = useState(false);
  const spec = useMemo(() => bodySpec(gender, build), [gender, build]);
  const gltf = useOptionalGltf(MODEL_URL[gender]);
  const names = useMemo(() => (gltf ? meshNames(gltf) : new Set<string>()), [gltf]);

  const has = (set: Set<string>) => layers.some((l) => set.has(l.garment));
  const shoes = layers.find((l) => SHOES.has(l.garment));
  const missing = gltf ? layers.filter((l) => !names.has(`garment_${l.garment}`) && !names.has(garmentSlot[l.garment])) : [];

  return (
    <div>
      <div
        className="aspect-[3/4] w-full"
        style={{ background: 'linear-gradient(180deg, #f4f4f2 0%, #e9e9e6 100%)' }}
        role="img"
        aria-label={`${label} (3D model, drag to rotate)`}
      >
        <Canvas
          camera={{ position: [0.95, 1.0, 3.7], fov: 30 }}
          dpr={[1, 2]}
          gl={{ antialias: true, alpha: true }}
          frameloop={autoRotate ? 'always' : 'demand'}
          onCreated={({ gl }) => {
            gl.toneMapping = THREE.ACESFilmicToneMapping;
            gl.toneMappingExposure = 0.9;
            gl.outputColorSpace = THREE.SRGBColorSpace;
          }}
          fallback={<p className="p-6 text-sm text-ink/60">This device can't display 3D.</p>}
        >
          <StudioEnvironment />
          <directionalLight position={[2, 4, 3]} intensity={0.6} />

          {gltf ? (
            <GlbMannequin gltf={gltf} gender={gender} skin={skin} build={build} layers={layers} names={names} />
          ) : (
            <>
              <Mannequin spec={spec} skin={skin} showFeet={!shoes || shoes.garment === 'sandals'} />
              <BaseLayer spec={spec} hasTop={has(TOPS)} hasBottom={has(BOTTOMS)} />
              {layers.map((l) => (
                <Garment3D key={`${l.garment}-${l.weave}-${l.colors.join()}`} item={l} spec={spec} />
              ))}
            </>
          )}

          <BasePlate />
          <ContactShadows position={[0, 0.001, 0]} opacity={0.45} scale={1.4} blur={2.6} far={1.2} resolution={512} frames={1} />
          <OrbitControls
            target={[0, 0.84, 0]}
            enablePan={false}
            enableDamping
            dampingFactor={0.08}
            minDistance={1.4}
            maxDistance={4.6}
            minPolarAngle={Math.PI * 0.22}
            maxPolarAngle={Math.PI * 0.56}
            autoRotate={autoRotate}
            autoRotateSpeed={2.4}
          />
        </Canvas>
      </div>

      {missing.length > 0 && (
        <p className="mt-2 text-xs text-ink/55">Not in the 3D model yet: {missing.map((l) => l.garment).join(', ')}</p>
      )}

      <div className="mt-3 flex items-center justify-between gap-3">
        <p className="text-xs text-ink/55">Drag to rotate. Scroll or pinch to zoom in on the fabric.</p>
        <button
          type="button"
          aria-pressed={autoRotate}
          onClick={() => setAutoRotate((a) => !a)}
          className="inline-flex min-h-11 shrink-0 items-center border border-ink/20 px-3 text-sm hover:border-ink/60"
        >
          {autoRotate ? 'Stop rotating' : 'Auto-rotate'}
        </button>
      </div>
    </div>
  );
}
