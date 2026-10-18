import { useEffect, useMemo, useState } from 'react';
import * as THREE from 'three';
import { Canvas, useThree } from '@react-three/fiber';
import { ContactShadows, OrbitControls } from '@react-three/drei';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { bodySpec, type Build, type Gender } from './body';
import Mannequin from './Character';
import { BaseLayer, Garment3D, type WornItem } from './Garments';
import MakeHumanScene, { usePendingModels } from './MakeHumanScene';
import type { FitItem } from './fitItem';

/*
 * Fitting-room viewer. With the MakeHuman models built (tools/fitting-room) it
 * shows the realistic mannequin and fitted garments; otherwise it falls back to
 * the code-generated mannequin, which only knows Homfaai's own shapes.
 */

const TOPS = new Set(['tee', 'shirt', 'longshirt', 'tank', 'hoodie', 'knit', 'jacket', 'coat', 'vest', 'dress', 'shirtdress', 'maxi']);
const BOTTOMS = new Set(['pants', 'wide', 'shorts', 'skirt', 'pleated', 'dress', 'shirtdress', 'maxi']);
const SHOES = new Set(['sneakers', 'loafers', 'boots', 'sandals']);

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

/** The code-generated mannequin, used when the MakeHuman models are not built. */
function BuiltInScene({ gender, skin, build, items }: { gender: Gender; skin: string; build: Build; items: FitItem[] }) {
  const spec = useMemo(() => bodySpec(gender, build), [gender, build]);
  const layers: WornItem[] = items.flatMap((i) => (i.garment && i.fabric ? [{ garment: i.garment, ...i.fabric }] : []));
  const has = (set: Set<string>) => layers.some((l) => set.has(l.garment));
  const shoes = layers.find((l) => SHOES.has(l.garment));
  return (
    <>
      <Mannequin spec={spec} skin={skin} showFeet={!shoes || shoes.garment === 'sandals'} />
      <BaseLayer spec={spec} hasTop={has(TOPS)} hasBottom={has(BOTTOMS)} />
      {layers.map((l) => (
        <Garment3D key={`${l.garment}-${l.weave}-${l.colors.join()}`} item={l} spec={spec} />
      ))}
    </>
  );
}

interface Fitting3DProps {
  gender: Gender;
  skin: string;
  build: Build;
  items: FitItem[];
  label: string;
  /** true when the MakeHuman models exist in /models */
  realistic: boolean;
  baseLayers: { top?: string; bottom?: string };
}

export default function Fitting3D({ gender, skin, build, items, label, realistic, baseLayers }: Fitting3DProps) {
  const [autoRotate, setAutoRotate] = useState(false);
  const loading = usePendingModels();
  const missing = items.filter((i) => (realistic ? !i.model : !(i.garment && i.fabric)));

  return (
    <div>
      <div
        className="relative aspect-[3/4] w-full"
        style={{ background: 'linear-gradient(180deg, #f4f4f2 0%, #e9e9e6 100%)' }}
        role="img"
        aria-label={`${label} (3D model, drag to rotate)`}
      >
        <Canvas
          camera={{ position: [0.95, 1.05, 3.8], fov: 30 }}
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

          {realistic ? (
            <MakeHumanScene gender={gender} skin={skin} build={build} items={items} baseLayers={baseLayers} />
          ) : (
            <BuiltInScene gender={gender} skin={skin} build={build} items={items} />
          )}

          <BasePlate />
          <ContactShadows position={[0, 0.001, 0]} opacity={0.45} scale={1.4} blur={2.6} far={1.2} resolution={512} frames={1} />
          <OrbitControls
            target={[0, 0.88, 0]}
            enablePan={false}
            enableDamping
            dampingFactor={0.08}
            minDistance={1.2}
            maxDistance={4.8}
            minPolarAngle={Math.PI * 0.22}
            maxPolarAngle={Math.PI * 0.56}
            autoRotate={autoRotate}
            autoRotateSpeed={2.4}
          />
        </Canvas>
        {realistic && loading > 0 && (
          <p role="status" className="absolute inset-x-0 top-3 text-center text-xs text-ink/60">
            Loading {loading} {loading === 1 ? 'piece' : 'pieces'}…
          </p>
        )}
      </div>

      {missing.length > 0 && (
        <p className="mt-2 text-xs text-ink/55">Not in the 3D model yet: {missing.map((i) => i.name).join(', ')}</p>
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
