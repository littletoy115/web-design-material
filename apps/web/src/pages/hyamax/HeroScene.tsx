// @ts-nocheck
import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Sphere, MeshDistortMaterial, Float, Stars } from '@react-three/drei';
import * as THREE from 'three';

function ParticleField() {
  const count = 600;
  const mesh = useRef<THREE.Points>(null);

  const [positions, colors] = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 30;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 30;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 20;
      const t = Math.random();
      col[i * 3] = 0.4 + t * 0.3;      // R
      col[i * 3 + 1] = 0.7 + t * 0.2;  // G
      col[i * 3 + 2] = 0.9 + t * 0.1;  // B
    }
    return [pos, col];
  }, []);

  useFrame(({ clock }) => {
    if (!mesh.current) return;
    mesh.current.rotation.y = clock.getElapsedTime() * 0.03;
    mesh.current.rotation.x = Math.sin(clock.getElapsedTime() * 0.02) * 0.1;
  });

  return (
    <points ref={mesh}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-color" args={[colors, 3]} />
      </bufferGeometry>
      <pointsMaterial size={0.05} vertexColors transparent opacity={0.7} sizeAttenuation />
    </points>
  );
}

function MoleculeOrb() {
  const meshRef = useRef<THREE.Mesh>(null);
  const ringRef = useRef<THREE.Mesh>(null);
  const ring2Ref = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (meshRef.current) {
      meshRef.current.rotation.y = t * 0.3;
      meshRef.current.rotation.z = Math.sin(t * 0.5) * 0.1;
    }
    if (ringRef.current) {
      ringRef.current.rotation.z = t * 0.6;
      ringRef.current.rotation.x = Math.PI / 3 + Math.sin(t * 0.3) * 0.2;
    }
    if (ring2Ref.current) {
      ring2Ref.current.rotation.z = -t * 0.4;
      ring2Ref.current.rotation.y = Math.PI / 4 + Math.cos(t * 0.2) * 0.2;
    }
  });

  return (
    <Float speed={1.5} rotationIntensity={0.2} floatIntensity={0.5}>
      <group position={[0, 0, 0]}>
        {/* Core glow orb */}
        <Sphere ref={meshRef} args={[1.2, 64, 64]}>
          <MeshDistortMaterial
            color="#a78bfa"
            emissive="#6d28d9"
            emissiveIntensity={0.4}
            distort={0.35}
            speed={2}
            roughness={0.1}
            metalness={0.8}
            transparent
            opacity={0.9}
          />
        </Sphere>

        {/* Inner core */}
        <Sphere args={[0.7, 32, 32]}>
          <meshStandardMaterial
            color="#c4b5fd"
            emissive="#8b5cf6"
            emissiveIntensity={0.8}
            roughness={0}
            metalness={1}
            transparent
            opacity={0.6}
          />
        </Sphere>

        {/* Orbital ring 1 */}
        <mesh ref={ringRef} rotation={[Math.PI / 3, 0, 0]}>
          <torusGeometry args={[2.0, 0.015, 16, 120]} />
          <meshStandardMaterial color="#e879f9" emissive="#c026d3" emissiveIntensity={1.5} />
        </mesh>

        {/* Orbital ring 2 */}
        <mesh ref={ring2Ref} rotation={[Math.PI / 5, Math.PI / 3, 0]}>
          <torusGeometry args={[2.4, 0.01, 16, 120]} />
          <meshStandardMaterial color="#60a5fa" emissive="#2563eb" emissiveIntensity={1.2} />
        </mesh>

        {/* Orbiting dots */}
        {[0, 1, 2, 3].map((i) => (
          <OrbitDot key={i} index={i} radius={2.0} speed={0.8 + i * 0.2} />
        ))}
      </group>
    </Float>
  );
}

function OrbitDot({ index, radius, speed }: { index: number; radius: number; speed: number }) {
  const ref = useRef<THREE.Mesh>(null);
  const offset = (index / 4) * Math.PI * 2;

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime() * speed + offset;
    if (ref.current) {
      ref.current.position.x = Math.cos(t) * radius;
      ref.current.position.y = Math.sin(t) * radius * 0.4;
      ref.current.position.z = Math.sin(t) * radius * 0.6;
    }
  });

  return (
    <mesh ref={ref}>
      <sphereGeometry args={[0.07, 12, 12]} />
      <meshStandardMaterial
        color="#f9a8d4"
        emissive="#ec4899"
        emissiveIntensity={2}
      />
    </mesh>
  );
}

export default function HeroScene() {
  return (
    <>
      <Stars radius={80} depth={30} count={1500} factor={3} fade speed={0.5} />
      <ParticleField />
      <ambientLight intensity={0.3} />
      <pointLight position={[5, 5, 5]} intensity={2} color="#a78bfa" />
      <pointLight position={[-5, -3, -5]} intensity={1.5} color="#38bdf8" />
      <pointLight position={[0, 0, 3]} intensity={1} color="#f9a8d4" />
      <MoleculeOrb />
    </>
  );
}
