import { useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float, RoundedBox } from "@react-three/drei";
import * as THREE from "three";

const Van = () => {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (groupRef.current) {
      // Gentle side-to-side sway
      groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.3) * 0.1 + Math.PI * 0.15;
    }
  });

  const vanColor = "#7db8a5"; // Matches our sage green primary
  const accentColor = "#f5f0e8"; // Warm off-white
  const windowColor = "#a8d4c6"; // Lighter sage for windows

  return (
    <group ref={groupRef} position={[0, -0.3, 0]} scale={0.9}>
      {/* Main body - cargo area */}
      <RoundedBox args={[1.8, 1.3, 1.1]} radius={0.15} position={[0.2, 0.65, 0]}>
        <meshStandardMaterial color={vanColor} />
      </RoundedBox>

      {/* Cabin */}
      <RoundedBox args={[0.9, 1.0, 1.05]} radius={0.12} position={[-0.9, 0.5, 0]}>
        <meshStandardMaterial color={vanColor} />
      </RoundedBox>

      {/* Windshield */}
      <RoundedBox args={[0.1, 0.5, 0.8]} radius={0.05} position={[-1.3, 0.6, 0]}>
        <meshStandardMaterial color={windowColor} transparent opacity={0.8} />
      </RoundedBox>

      {/* Side windows */}
      <RoundedBox args={[0.5, 0.35, 0.05]} radius={0.05} position={[-0.75, 0.7, 0.52]}>
        <meshStandardMaterial color={windowColor} transparent opacity={0.8} />
      </RoundedBox>
      <RoundedBox args={[0.5, 0.35, 0.05]} radius={0.05} position={[-0.75, 0.7, -0.52]}>
        <meshStandardMaterial color={windowColor} transparent opacity={0.8} />
      </RoundedBox>

      {/* Roof accent stripe */}
      <RoundedBox args={[2.5, 0.08, 0.6]} radius={0.03} position={[-0.15, 1.35, 0]}>
        <meshStandardMaterial color={accentColor} />
      </RoundedBox>

      {/* Front bumper */}
      <RoundedBox args={[0.15, 0.2, 0.9]} radius={0.05} position={[-1.4, 0.15, 0]}>
        <meshStandardMaterial color={accentColor} />
      </RoundedBox>

      {/* Headlights */}
      <mesh position={[-1.38, 0.4, 0.35]}>
        <sphereGeometry args={[0.1, 16, 16]} />
        <meshStandardMaterial color="#fff9e6" emissive="#fff9e6" emissiveIntensity={0.3} />
      </mesh>
      <mesh position={[-1.38, 0.4, -0.35]}>
        <sphereGeometry args={[0.1, 16, 16]} />
        <meshStandardMaterial color="#fff9e6" emissive="#fff9e6" emissiveIntensity={0.3} />
      </mesh>

      {/* Wheels */}
      {[[-0.9, -0.05, 0.55], [-0.9, -0.05, -0.55], [0.6, -0.05, 0.55], [0.6, -0.05, -0.55]].map((pos, i) => (
        <group key={i} position={pos as [number, number, number]}>
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.22, 0.22, 0.12, 24]} />
            <meshStandardMaterial color="#4a4a4a" />
          </mesh>
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.12, 0.12, 0.14, 24]} />
            <meshStandardMaterial color={accentColor} />
          </mesh>
        </group>
      ))}

      {/* Side accent line */}
      <RoundedBox args={[1.6, 0.06, 0.02]} radius={0.02} position={[0.15, 0.35, 0.56]}>
        <meshStandardMaterial color={accentColor} />
      </RoundedBox>
      <RoundedBox args={[1.6, 0.06, 0.02]} radius={0.02} position={[0.15, 0.35, -0.56]}>
        <meshStandardMaterial color={accentColor} />
      </RoundedBox>

      {/* Heart logo on side */}
      <mesh position={[0.4, 0.65, 0.561]} rotation={[0, 0, 0]}>
        <circleGeometry args={[0.15, 32]} />
        <meshStandardMaterial color={accentColor} />
      </mesh>
    </group>
  );
};

const DeliveryVan3D = () => {
  return (
    <div className="w-full h-64 md:h-80">
      <Canvas
        camera={{ position: [3, 2, 4], fov: 35 }}
        style={{ background: "transparent" }}
      >
        <ambientLight intensity={0.6} />
        <directionalLight position={[5, 5, 5]} intensity={0.8} />
        <directionalLight position={[-3, 3, -3]} intensity={0.3} />
        
        <Float
          speed={1.5}
          rotationIntensity={0.2}
          floatIntensity={0.5}
          floatingRange={[-0.1, 0.1]}
        >
          <Van />
        </Float>
      </Canvas>
    </div>
  );
};

export default DeliveryVan3D;
