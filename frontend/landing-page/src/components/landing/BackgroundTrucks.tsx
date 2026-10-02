import { useRef, useState, useEffect, memo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { RoundedBox } from "@react-three/drei";
import * as THREE from "three";

interface TruckData {
  id: number;
  x: number;
  y: number;
  z: number;
  speed: number;
  direction: 1 | -1;
  scale: number;
}

const MiniVan = ({
  direction,
  scale,
}: {
  direction: 1 | -1;
  scale: number;
}) => {
  const vanColor = "#7db8a5";
  const accentColor = "#f5f0e8";
  const windowColor = "#a8d4c6";

  return (
    <group scale={scale} rotation={[0, direction === 1 ? Math.PI : 0, 0]}>
      {/* Main body */}
      <RoundedBox
        args={[1.8, 1.3, 1.1]}
        radius={0.15}
        position={[0.2, 0.65, 0]}
      >
        <meshStandardMaterial color={vanColor} />
      </RoundedBox>

      {/* Cabin */}
      <RoundedBox
        args={[0.9, 1.0, 1.05]}
        radius={0.12}
        position={[-0.9, 0.5, 0]}
      >
        <meshStandardMaterial color={vanColor} />
      </RoundedBox>

      {/* Windshield */}
      <RoundedBox
        args={[0.1, 0.5, 0.8]}
        radius={0.05}
        position={[-1.3, 0.6, 0]}
      >
        <meshStandardMaterial color={windowColor} transparent opacity={0.8} />
      </RoundedBox>

      {/* Roof accent */}
      <RoundedBox
        args={[2.5, 0.08, 0.6]}
        radius={0.03}
        position={[-0.15, 1.35, 0]}
      >
        <meshStandardMaterial color={accentColor} />
      </RoundedBox>

      {/* Front bumper */}
      <RoundedBox
        args={[0.15, 0.2, 0.9]}
        radius={0.05}
        position={[-1.4, 0.15, 0]}
      >
        <meshStandardMaterial color={accentColor} />
      </RoundedBox>

      {/* Headlights */}
      <mesh position={[-1.38, 0.4, 0.35]}>
        <sphereGeometry args={[0.1, 12, 12]} />
        <meshStandardMaterial
          color="#fff9e6"
          emissive="#fff9e6"
          emissiveIntensity={0.2}
        />
      </mesh>
      <mesh position={[-1.38, 0.4, -0.35]}>
        <sphereGeometry args={[0.1, 12, 12]} />
        <meshStandardMaterial
          color="#fff9e6"
          emissive="#fff9e6"
          emissiveIntensity={0.2}
        />
      </mesh>

      {/* Wheels */}
      {[
        [-0.9, -0.05, 0.55],
        [-0.9, -0.05, -0.55],
        [0.6, -0.05, 0.55],
        [0.6, -0.05, -0.55],
      ].map((pos, i) => (
        <group key={i} position={pos as [number, number, number]}>
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.22, 0.22, 0.12, 16]} />
            <meshStandardMaterial color="#4a4a4a" />
          </mesh>
        </group>
      ))}
    </group>
  );
};

const AnimatedTruck = ({
  data,
  onReset,
}: {
  data: TruckData;
  onReset: (id: number) => void;
}) => {
  const groupRef = useRef<THREE.Group>(null);
  const positionRef = useRef(data.x);

  useFrame((_, delta) => {
    if (groupRef.current) {
      positionRef.current += data.speed * data.direction * delta * 60;
      groupRef.current.position.x = positionRef.current;

      // Check if truck has left the screen
      if (data.direction === 1 && positionRef.current > 20) {
        onReset(data.id);
      } else if (data.direction === -1 && positionRef.current < -20) {
        onReset(data.id);
      }
    }
  });

  return (
    <group ref={groupRef} position={[data.x, data.y, data.z]}>
      <MiniVan direction={data.direction} scale={data.scale} />
    </group>
  );
};

const TruckScene = () => {
  const [trucks, setTrucks] = useState<TruckData[]>([]);
  const nextIdRef = useRef(0);

  const createTruck = (): TruckData => {
    const direction = Math.random() > 0.5 ? 1 : -1;
    const id = nextIdRef.current++;
    // Distribute trucks across two lanes: top and bottom (avoiding text area)
    const lane = Math.floor(Math.random() * 2);
    const yPositions = [4.5, -6]; // top (above text), bottom (below text)
    const yOffset = yPositions[lane] + (Math.random() - 0.5) * 0.8;

    return {
      id,
      x: direction === 1 ? -18 : 18,
      y: yOffset,
      z: -5 - Math.random() * 3,
      speed: 0.08 + Math.random() * 0.04,
      direction: direction as 1 | -1,
      scale: 0.35 + Math.random() * 0.15,
    };
  };

  useEffect(() => {
    // Initialize with 2 trucks at different positions
    const initialTrucks: TruckData[] = [];
    for (let i = 0; i < 2; i++) {
      const truck = createTruck();
      // Spread them across the screen initially
      truck.x = -12 + i * 12 + Math.random() * 4;
      if (truck.direction === -1) {
        truck.x = 12 - i * 12 - Math.random() * 4;
      }
      initialTrucks.push(truck);
    }
    setTrucks(initialTrucks);
  }, []);

  const handleReset = (id: number) => {
    setTrucks((prev) => {
      const newTrucks = prev.filter((t) => t.id !== id);
      // Add a new truck after a random delay
      setTimeout(
        () => {
          setTrucks((current) => [...current, createTruck()]);
        },
        Math.random() * 2000 + 500,
      );
      return newTrucks;
    });
  };

  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight position={[5, 5, 5]} intensity={0.6} />

      {trucks.map((truck) => (
        <AnimatedTruck key={truck.id} data={truck} onReset={handleReset} />
      ))}
    </>
  );
};

const BackgroundTrucks = () => {
  return (
    <div className="absolute inset-0 pointer-events-none opacity-60">
      <Canvas
        camera={{ position: [0, 0, 10], fov: 50 }}
        style={{ background: "transparent" }}
        dpr={[1, 1.5]}
        gl={{ antialias: false, powerPreference: "low-power" }}
      >
        <TruckScene />
      </Canvas>
    </div>
  );
};

export default memo(BackgroundTrucks);
