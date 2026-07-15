// @ts-nocheck
import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Float } from '@react-three/drei';
import * as THREE from 'three';

function DNAHelix() {
  const groupRef = useRef<THREE.Group>(null);

  const { strand1Positions, strand2Positions, rungs } = useMemo(() => {
    const s1: { pos: [number, number, number]; color: string }[] = [];
    const s2: { pos: [number, number, number]; color: string }[] = [];
    const r: { from: THREE.Vector3; to: THREE.Vector3 }[] = [];
    const colors = ['#f472b6', '#a78bfa', '#34d399', '#fb923c'];
    const total = 30;

    for (let i = 0; i < total; i++) {
      const t = (i / total) * Math.PI * 6;
      const y = (i / total) * 10 - 5;
      const r1 = 1.2;

      const x1 = Math.cos(t) * r1;
      const z1 = Math.sin(t) * r1;
      const x2 = Math.cos(t + Math.PI) * r1;
      const z2 = Math.sin(t + Math.PI) * r1;

      const col = colors[i % colors.length];
      s1.push({ pos: [x1, y, z1], color: col });
      s2.push({ pos: [x2, y, z2], color: col });

      if (i % 3 === 0) {
        r.push({
          from: new THREE.Vector3(x1, y, z1),
          to: new THREE.Vector3(x2, y, z2),
        });
      }
    }
    return { strand1Positions: s1, strand2Positions: s2, rungs: r };
  }, []);

  useFrame(({ clock }) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = clock.getElapsedTime() * 0.25;
    }
  });

  return (
    <Float speed={0.8} floatIntensity={0.3}>
      <group ref={groupRef} position={[0, 0, 0]}>
        {strand1Positions.map((s, i) => (
          <mesh key={`s1-${i}`} position={s.pos}>
            <sphereGeometry args={[0.12, 12, 12]} />
            <meshStandardMaterial color={s.color} emissive={s.color} emissiveIntensity={0.6} roughness={0.2} metalness={0.6} />
          </mesh>
        ))}
        {strand2Positions.map((s, i) => (
          <mesh key={`s2-${i}`} position={s.pos}>
            <sphereGeometry args={[0.12, 12, 12]} />
            <meshStandardMaterial color={s.color} emissive={s.color} emissiveIntensity={0.6} roughness={0.2} metalness={0.6} />
          </mesh>
        ))}
        {rungs.map((rung, i) => {
          const dir = new THREE.Vector3().subVectors(rung.to, rung.from);
          const len = dir.length();
          const mid = new THREE.Vector3().addVectors(rung.from, rung.to).multiplyScalar(0.5);
          const quaternion = new THREE.Quaternion().setFromUnitVectors(
            new THREE.Vector3(0, 1, 0),
            dir.normalize()
          );
          return (
            <mesh key={`rung-${i}`} position={mid.toArray()} quaternion={quaternion}>
              <cylinderGeometry args={[0.025, 0.025, len, 8]} />
              <meshStandardMaterial color="#e2e8f0" emissive="#94a3b8" emissiveIntensity={0.3} transparent opacity={0.7} />
            </mesh>
          );
        })}
      </group>
    </Float>
  );
}

function FloatingMolecule({ position, color }: { position: [number, number, number]; color: string }) {
  const ref = useRef<THREE.Group>(null);
  const speed = 0.3 + Math.random() * 0.3;
  const offset = Math.random() * Math.PI * 2;

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime() * speed + offset;
    if (ref.current) {
      ref.current.position.y = position[1] + Math.sin(t) * 0.4;
      ref.current.rotation.y = t * 0.5;
      ref.current.rotation.x = t * 0.3;
    }
  });

  return (
    <group ref={ref} position={position}>
      <mesh>
        <octahedronGeometry args={[0.25]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.5} roughness={0.1} metalness={0.8} transparent opacity={0.85} />
      </mesh>
      <mesh>
        <torusGeometry args={[0.4, 0.02, 8, 32]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={1} transparent opacity={0.5} />
      </mesh>
    </group>
  );
}

export default function ScienceScene() {
  const floaters: { pos: [number, number, number]; color: string }[] = [
    { pos: [-3.5, 1.5, -1], color: '#f472b6' },
    { pos: [3.5, -1, -1], color: '#34d399' },
    { pos: [-3, -2, 0.5], color: '#fb923c' },
    { pos: [3, 2, 0.5], color: '#60a5fa' },
    { pos: [0, 3, -2], color: '#a78bfa' },
    { pos: [0, -3.5, -1.5], color: '#fbbf24' },
  ];

  return (
    <>
      <ambientLight intensity={0.2} />
      <pointLight position={[0, 5, 3]} intensity={3} color="#a78bfa" />
      <pointLight position={[-4, 0, 0]} intensity={2} color="#38bdf8" />
      <pointLight position={[4, 0, 0]} intensity={2} color="#f472b6" />
      <pointLight position={[0, -5, 0]} intensity={1} color="#34d399" />
      <DNAHelix />
      {floaters.map((f, i) => (
        <FloatingMolecule key={i} position={f.pos} color={f.color} />
      ))}
    </>
  );
}
