import { useRef, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Text3D, Center, Environment, OrbitControls } from '@react-three/drei';
import * as THREE from 'three';

/* ── Antique Gold "AP" Minted Coin ── */
function APCoin() {
  const coinRef = useRef<THREE.Group>(null);

  // Manual smooth rotation per user request
  useFrame((state, delta) => {
    if (coinRef.current) {
      coinRef.current.rotation.y += delta * 0.4;
    }
  });

  // Rich, premium antique gold material with clearcoat
  const coinMaterial = (
    <meshPhysicalMaterial
      color="#C8A34A"
      metalness={1}
      roughness={0.42}
      clearcoat={0.15}
      clearcoatRoughness={0.5}
      reflectivity={1}
      envMapIntensity={2.5}
    />
  );

  return (
    <group scale={0.55} ref={coinRef}>
      {/* The Solid Coin Base (Thickness 0.35, so faces are at Z=±0.175) */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[2.0, 2.0, 0.35, 128]} />
        {coinMaterial}
      </mesh>

      {/* Edge Grooves (open ended cylinder wrapping the base to add edge texture) */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[2.005, 2.005, 0.35, 128, 1, true]} />
        {coinMaterial}
      </mesh>

      {/* Front Raised Outer Rim (embedded torus creates a perfect coin lip) */}
      <mesh position={[0, 0, 0.175]}>
        <torusGeometry args={[1.92, 0.08, 32, 128]} />
        {coinMaterial}
      </mesh>

      {/* Back Raised Outer Rim */}
      <mesh position={[0, 0, -0.175]}>
        <torusGeometry args={[1.92, 0.08, 32, 128]} />
        {coinMaterial}
      </mesh>

      {/* Front Inner Decorative Ring */}
      <mesh position={[0, 0, 0.175]}>
        <torusGeometry args={[1.7, 0.03, 16, 128]} />
        {coinMaterial}
      </mesh>
      
      {/* Back Inner Decorative Ring */}
      <mesh position={[0, 0, -0.175]}>
        <torusGeometry args={[1.7, 0.03, 16, 128]} />
        {coinMaterial}
      </mesh>

      {/* Front Minted Text - Positioned at 0.175 so it sits perfectly flush with the coin face */}
      <group position={[0.15, 0, 0.175]}>
        <Center>
          <Text3D
            font="/fonts/gentilis_bold.typeface.json"
            size={1.1}
            height={0.05} // Shallow depth so it looks authentically minted/stamped
            curveSegments={20}
            bevelEnabled
            bevelThickness={0.02}
            bevelSize={0.015}
            bevelOffset={0}
            bevelSegments={8}
          >
            AP
            {coinMaterial}
          </Text3D>
        </Center>
      </group>

      {/* Back Minted Text (Flipped 180 degrees) */}
      <group position={[-0.15, 0, -0.175]}>
        <group rotation={[0, Math.PI, 0]}>
          <Center>
            <Text3D
              font="/fonts/gentilis_bold.typeface.json"
              size={1.1}
              height={0.05}
              curveSegments={20}
              bevelEnabled
              bevelThickness={0.02}
              bevelSize={0.015}
              bevelOffset={0}
              bevelSegments={8}
            >
              AP
              {coinMaterial}
            </Text3D>
          </Center>
        </group>
      </group>
    </group>
  );
}

/* ── Cinematic moody lights ── */
function DynamicLights() {
  return (
    <>
      <ambientLight intensity={0.08} />
      {/* Warm key light */}
      <pointLight position={[4, 3, 2]} intensity={18} color="#ffdf95" />
      {/* Cool fill light */}
      <pointLight position={[-3, 1, 3]} intensity={8} color="#ffffff" />
      {/* Golden rim light from below */}
      <pointLight position={[0, -2, -3]} intensity={6} color="#a28d63" />
    </>
  );
}

/* ── Main exported component ── */
export default function AP3DMonogram({ className = '' }: { className?: string }) {
  return (
    <div className={`w-full h-full cursor-grab active:cursor-grabbing ${className}`}>
      <Canvas
        camera={{ position: [0, 0, 5.6], fov: 32 }}
        gl={{ antialias: true, alpha: true }}
        style={{ background: 'transparent' }}
        dpr={typeof window !== 'undefined' ? Math.min(window.devicePixelRatio, 2) : 1}
      >
        <Suspense fallback={null}>
          <DynamicLights />
          {/* City environment provides stronger, more varied reflections for gold */}
          <Environment preset="city" />
          <APCoin />
          
          {/* Controls unlocked so user can grab and spin the coin */}
          <OrbitControls 
            enableZoom={false} 
            enablePan={false} 
            enableRotate={true} 
            makeDefault 
          />
        </Suspense>
      </Canvas>
    </div>
  );
}
