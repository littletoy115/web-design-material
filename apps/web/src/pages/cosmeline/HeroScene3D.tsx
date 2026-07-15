// @ts-nocheck
import { useRef, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Float, ContactShadows, Environment } from '@react-three/drei';
import * as THREE from 'three';

/* ── Mouse parallax controller ── */
function CameraController({ mouseRef }: { mouseRef: React.MutableRefObject<{ x: number; y: number }> }) {
  const { camera } = useThree();
  const targetRot = useRef({ x: 0, y: 0 });

  useFrame(() => {
    const maxAngle = (4 * Math.PI) / 180;
    targetRot.current.x = -mouseRef.current.y * maxAngle;
    targetRot.current.y = mouseRef.current.x * maxAngle;
    camera.rotation.x += (targetRot.current.x - camera.rotation.x) * 0.05;
    camera.rotation.y += (targetRot.current.y - camera.rotation.y) * 0.05;
  });

  return null;
}

/* ── Floating particles (HA molecules) ── */
function HaParticles() {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const positionsRef = useRef<Float32Array | null>(null);

  useEffect(() => {
    if (!meshRef.current) return;
    const count = 200;
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      positions[i * 3 + 0] = (Math.random() - 0.5) * 8;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 6;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 4;
      const m = new THREE.Matrix4();
      m.setPosition(positions[i * 3], positions[i * 3 + 1], positions[i * 3 + 2]);
      meshRef.current.setMatrixAt(i, m);
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
    positionsRef.current = positions;
  }, []);

  useFrame((_, delta) => {
    if (!meshRef.current || !positionsRef.current) return;
    const positions = positionsRef.current;
    for (let i = 0; i < 200; i++) {
      positions[i * 3 + 1] += delta * 0.25;
      if (positions[i * 3 + 1] > 3) {
        positions[i * 3 + 1] = -3;
      }
      const m = new THREE.Matrix4();
      m.setPosition(positions[i * 3], positions[i * 3 + 1], positions[i * 3 + 2]);
      meshRef.current.setMatrixAt(i, m);
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, 200]}>
      <sphereGeometry args={[0.03, 6, 6]} />
      <meshStandardMaterial color="#E8AEB7" transparent opacity={0.25} />
    </instancedMesh>
  );
}

/* ── Floating vial ── */
function FloatingVial() {
  return (
    <Float speed={1.5} floatIntensity={0.4}>
      <group position={[1.5, 0, 0]}>
        {/* Body */}
        <mesh>
          <cylinderGeometry args={[0.18, 0.22, 2.2, 32]} />
          <meshStandardMaterial color="#f0e6ea" metalness={0.3} roughness={0.2} />
        </mesh>
        {/* Cap */}
        <mesh position={[0, 1.25, 0]}>
          <cylinderGeometry args={[0.1, 0.18, 0.3, 32]} />
          <meshStandardMaterial color="#d4b8be" metalness={0.4} roughness={0.15} />
        </mesh>
        {/* Tip */}
        <mesh position={[0, 1.48, 0]}>
          <cylinderGeometry args={[0.04, 0.1, 0.16, 16]} />
          <meshStandardMaterial color="#c9a0a8" metalness={0.5} roughness={0.1} />
        </mesh>
      </group>
    </Float>
  );
}

/* ── Syringe barrel ── */
function SyringeBarrel() {
  return (
    <mesh position={[-0.5, -0.5, 0.3]} rotation={[0.2, 0.1, 0.3]}>
      <cylinderGeometry args={[0.1, 0.1, 1.8, 24]} />
      <meshStandardMaterial color="#e8d5da" metalness={0.2} roughness={0.3} transparent opacity={0.85} />
    </mesh>
  );
}

/* ── Main scene ── */
export default function HeroScene3D() {
  const mouseRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouseRef.current.y = -((e.clientY / window.innerHeight) * 2 - 1);
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <>
      <CameraController mouseRef={mouseRef} />

      {/* Lighting */}
      <ambientLight intensity={0.4} />
      <directionalLight position={[5, 5, 3]} intensity={1.5} color="#fff5f7" />
      <pointLight position={[-3, 2, 2]} intensity={1} color="#E8AEB7" />
      <ContactShadows position={[0, -2, 0]} opacity={0.3} scale={8} blur={2} />

      {/* Scene objects */}
      <FloatingVial />
      <SyringeBarrel />
      <HaParticles />
    </>
  );
}
