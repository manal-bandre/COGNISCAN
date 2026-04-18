import { useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float, OrbitControls, MeshDistortMaterial, Sphere, Environment } from "@react-three/drei";
import * as THREE from "three";

function AnimatedShape() {
  const sphereRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (sphereRef.current) {
      sphereRef.current.rotation.x = state.clock.elapsedTime * 0.2;
      sphereRef.current.rotation.y = state.clock.elapsedTime * 0.3;
    }
  });

  return (
    <Float speed={2} rotationIntensity={0.5} floatIntensity={1}>
      <Sphere ref={sphereRef} args={[1.5, 64, 64]} scale={1.2}>
        <MeshDistortMaterial
          color="#1d9e75"
          attach="material"
          distort={0.4}
          speed={2}
          roughness={0.2}
          metalness={0.8}
        />
      </Sphere>
      
      <Sphere args={[1.8, 32, 32]}>
        <meshBasicMaterial color="#1d9e75" wireframe transparent opacity={0.15} />
      </Sphere>
    </Float>
  );
}

export function Hero3D() {
  return (
    <div className="h-full w-full relative">
      <div className="absolute inset-0 bg-gradient-to-tr from-[#1d9e75]/20 to-transparent blur-3xl rounded-full opacity-50 block md:w-[600px] md:h-[600px] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
      <Canvas camera={{ position: [0, 0, 5], fov: 45 }} className="w-full h-full">
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 5]} intensity={1.5} color="#ffffff" />
        <directionalLight position={[-10, -10, -5]} intensity={0.5} color="#0f6e56" />
        <Environment preset="city" />
        <AnimatedShape />
        <OrbitControls enableZoom={false} enablePan={false} autoRotate autoRotateSpeed={0.5} />
      </Canvas>
    </div>
  );
}
