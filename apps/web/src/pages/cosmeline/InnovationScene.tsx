// @ts-nocheck
import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';

interface InnovationSceneProps {
  scrollProgress: number;
}

function VialGroup({ scrollProgress }: { scrollProgress: number }) {
  const groupRef = useRef<any>(null);

  useFrame(() => {
    if (!groupRef.current) return;
    groupRef.current.rotation.y = scrollProgress * Math.PI * 2;
  });

  return (
    <group ref={groupRef}>
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
  );
}

export default function InnovationScene({ scrollProgress }: InnovationSceneProps) {
  return (
    <>
      <ambientLight intensity={0.5} />
      <pointLight position={[2, 2, 2]} intensity={1.2} color="#E8AEB7" />
      <pointLight position={[-2, -1, 1]} intensity={0.6} color="#ffd0d8" />
      <directionalLight position={[0, 5, 3]} intensity={0.8} color="#fff5f7" />
      <VialGroup scrollProgress={scrollProgress} />
    </>
  );
}
