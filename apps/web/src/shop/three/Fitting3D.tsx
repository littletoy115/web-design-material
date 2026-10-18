import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
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

export type CameraView = 'full' | 'top' | 'shoes';

/** Where the camera looks from for each quick view (metres; the mannequin stands at the origin). */
const VIEWS: Record<CameraView, { target: [number, number, number]; position: [number, number, number] }> = {
  full: { target: [0, 0.88, 0], position: [0.95, 1.05, 3.8] },
  top: { target: [0, 1.32, 0], position: [0.45, 1.45, 1.55] },
  shoes: { target: [0, 0.1, 0.03], position: [0.42, 0.32, 0.95] },
};

// Keep the orbit point on the mannequin and the camera above the floor, however far people pan.
const TARGET_MIN = new THREE.Vector3(-0.5, 0.04, -0.4);
const TARGET_MAX = new THREE.Vector3(0.5, 1.8, 0.4);
const CAMERA_MIN_Y = 0.03;

type Orbit = THREE.EventDispatcher<{ change: object }> & { target: THREE.Vector3; update: () => void };

/** Free orbit/pan/zoom with soft limits, plus animated moves to the quick views. */
function CameraRig({ view, viewNonce, autoRotate }: { view: CameraView; viewNonce: number; autoRotate: boolean }) {
  const camera = useThree((s) => s.camera);
  const invalidate = useThree((s) => s.invalidate);
  const controls = useThree((s) => s.controls) as unknown as Orbit | null;
  // a timed move (not per-frame easing), so it lands exactly even when frames are irregular
  const move = useRef<{ fromT: THREE.Vector3; fromP: THREE.Vector3; toT: THREE.Vector3; toP: THREE.Vector3; start: number } | null>(null);
  const first = useRef(true);

  useEffect(() => {
    if (!controls) return;
    const clamp = () => {
      controls.target.clamp(TARGET_MIN, TARGET_MAX);
      if (camera.position.y < CAMERA_MIN_Y) camera.position.y = CAMERA_MIN_Y;
    };
    controls.addEventListener('change', clamp);
    return () => controls.removeEventListener('change', clamp);
  }, [controls, camera]);

  useEffect(() => {
    if (first.current) {
      first.current = false;
      if (view === 'full') return; // the camera already starts at the full view
    }
    if (!controls) return;
    const v = VIEWS[view];
    move.current = {
      fromT: controls.target.clone(),
      fromP: camera.position.clone(),
      toT: new THREE.Vector3(...v.target),
      toP: new THREE.Vector3(...v.position),
      start: performance.now(),
    };
    invalidate();
  }, [view, viewNonce, controls, camera, invalidate]);

  useFrame(() => {
    const m = move.current;
    if (!m || !controls) return;
    const t = Math.min(1, (performance.now() - m.start) / 600);
    const ease = 1 - Math.pow(1 - t, 3);
    controls.target.lerpVectors(m.fromT, m.toT, ease);
    camera.position.lerpVectors(m.fromP, m.toP, ease);
    controls.update();
    if (t >= 1) move.current = null;
    else if (!autoRotate) invalidate();
  });
  return null;
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
  autoRotate: boolean;
  /** quick view to move the camera to; bump viewNonce to move there again */
  view: CameraView;
  viewNonce: number;
}

/** The 3D stage only: it fills its parent, which places the controls around it. */
export default function Fitting3D({ gender, skin, build, items, label, realistic, baseLayers, autoRotate, view, viewNonce }: Fitting3DProps) {
  const loading = usePendingModels();
  const missing = items.filter((i) => (realistic ? !i.model : !(i.garment && i.fabric)));

  return (
    <div className="absolute inset-0">
      <div className="absolute inset-0" role="img" aria-label={`${label} (3D model, drag to rotate)`}>
        <Canvas
          camera={{ position: VIEWS.full.position, fov: 30, near: 0.05 }}
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
          {/* Free camera: orbit, pan (right-drag, shift-drag or two fingers) and zoom toward the
              pointer, so shoes and hats can be inspected up close. CameraRig keeps it on the model. */}
          <OrbitControls
            makeDefault
            target={VIEWS.full.target}
            enableDamping
            dampingFactor={0.08}
            enablePan
            screenSpacePanning
            zoomToCursor
            minDistance={0.35}
            maxDistance={5}
            minPolarAngle={Math.PI * 0.04}
            maxPolarAngle={Math.PI * 0.62}
            autoRotate={autoRotate}
            autoRotateSpeed={2.4}
          />
          <CameraRig view={view} viewNonce={viewNonce} autoRotate={autoRotate} />
        </Canvas>
      </div>
      <div className="pointer-events-none absolute bottom-16 left-4 right-4 grid gap-1 text-xs text-ink/60">
        {realistic && loading > 0 && (
          <p role="status">
            Loading {loading} {loading === 1 ? 'piece' : 'pieces'}…
          </p>
        )}
        {missing.length > 0 && <p>Not in the 3D model yet: {missing.map((i) => i.name).join(', ')}</p>}
      </div>
    </div>
  );
}
