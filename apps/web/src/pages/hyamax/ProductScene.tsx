// @ts-nocheck
import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Float, MeshReflectorMaterial } from '@react-three/drei';
import * as THREE from 'three';

function ProductBottle() {
  const groupRef = useRef<THREE.Group>(null);
  const glowRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (groupRef.current) {
      groupRef.current.rotation.y = t * 0.4;
    }
    if (glowRef.current) {
      (glowRef.current.material as THREE.MeshStandardMaterial).emissiveIntensity =
        0.5 + Math.sin(t * 1.5) * 0.3;
    }
  });

  return (
    <Float speed={1.2} rotationIntensity={0.1} floatIntensity={0.6}>
      <group ref={groupRef} position={[0, 0.3, 0]}>
        {/* Bottle body */}
        <mesh position={[0, 0, 0]}>
          <cylinderGeometry args={[0.55, 0.65, 2.8, 64, 1, false]} />
          <meshStandardMaterial
            color="#1e1b4b"
            metalness={0.95}
            roughness={0.05}
            envMapIntensity={2}
          />
        </mesh>

        {/* Bottle neck */}
        <mesh position={[0, 1.7, 0]}>
          <cylinderGeometry args={[0.22, 0.52, 0.5, 32]} />
          <meshStandardMaterial color="#1e1b4b" metalness={0.95} roughness={0.05} />
        </mesh>

        {/* Bottle top */}
        <mesh position={[0, 2.05, 0]}>
          <cylinderGeometry args={[0.22, 0.22, 0.3, 32]} />
          <meshStandardMaterial color="#7c3aed" metalness={1} roughness={0} />
        </mesh>

        {/* Cap */}
        <mesh position={[0, 2.35, 0]}>
          <cylinderGeometry args={[0.28, 0.22, 0.22, 32]} />
          <meshStandardMaterial color="#4c1d95" metalness={0.9} roughness={0.1} />
        </mesh>

        {/* Label glow strip */}
        <mesh ref={glowRef} position={[0, 0, 0]}>
          <cylinderGeometry args={[0.56, 0.66, 1.2, 64, 1, false]} />
          <meshStandardMaterial
            color="#7c3aed"
            emissive="#8b5cf6"
            emissiveIntensity={0.5}
            transparent
            opacity={0.3}
            side={THREE.FrontSide}
          />
        </mesh>

        {/* Logo ring */}
        <mesh position={[0, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.66, 0.012, 8, 80]} />
          <meshStandardMaterial color="#c4b5fd" emissive="#a78bfa" emissiveIntensity={2} />
        </mesh>
        <mesh position={[0, 0.7, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.58, 0.008, 8, 80]} />
          <meshStandardMaterial color="#c4b5fd" emissive="#a78bfa" emissiveIntensity={2} />
        </mesh>
        <mesh position={[0, -0.7, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.64, 0.008, 8, 80]} />
          <meshStandardMaterial color="#c4b5fd" emissive="#a78bfa" emissiveIntensity={2} />
        </mesh>
      </group>
    </Float>
  );
}

function GlowRings() {
  const ringsRef = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (ringsRef.current) {
      ringsRef.current.rotation.y = t * 0.15;
      ringsRef.current.rotation.x = Math.sin(t * 0.2) * 0.05;
    }
  });

  return (
    <group ref={ringsRef}>
      {[2.2, 3.0, 3.8].map((r, i) => (
        <mesh key={i} rotation={[Math.PI / 2 + i * 0.3, i * 0.5, 0]}>
          <torusGeometry args={[r, 0.008, 8, 120]} />
          <meshStandardMaterial
            color={['#a78bfa', '#60a5fa', '#f472b6'][i]}
            emissive={['#a78bfa', '#60a5fa', '#f472b6'][i]}
            emissiveIntensity={1.5}
            transparent
            opacity={0.6 - i * 0.1}
          />
        </mesh>
      ))}
    </group>
  );
}

function AmbientParticles() {
  const count = 200;
  const ref = useRef<THREE.Points>(null);

  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = 2.5 + Math.random() * 3;
      pos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      pos[i * 3 + 2] = r * Math.cos(phi);
    }
    return pos;
  }, []);

  useFrame(({ clock }) => {
    if (ref.current) {
      ref.current.rotation.y = clock.getElapsedTime() * 0.08;
    }
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial size={0.04} color="#c4b5fd" transparent opacity={0.8} sizeAttenuation />
    </points>
  );
}

export default function ProductScene() {
  return (
    <>
      <ambientLight intensity={0.15} />
      <pointLight position={[0, 5, 3]} intensity={4} color="#a78bfa" />
      <pointLight position={[-4, 2, 2]} intensity={2} color="#60a5fa" />
      <pointLight position={[4, -2, 2]} intensity={2} color="#f472b6" />
      <pointLight position={[0, -4, 0]} intensity={1} color="#4f46e5" />

      {/* Reflective floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2.5, 0]}>
        <planeGeometry args={[20, 20]} />
        <MeshReflectorMaterial
          blur={[300, 100]}
          resolution={512}
          mixBlur={0.8}
          mixStrength={50}
          roughness={1}
          depthScale={1.2}
          minDepthThreshold={0.4}
          maxDepthThreshold={1.4}
          color="#050510"
          metalness={0.8}
          mirror={0}
        />
      </mesh>

      <ProductBottle />
      <GlowRings />
      <AmbientParticles />
    </>
  );
}
