import { useRef, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Text3D, Center, Environment, OrbitControls } from '@react-three/drei';
import * as THREE from 'three';

/* ── Antique Gold "AP" Minted Coin ── */
function APCoin() {
  // Rich, slightly worn antique gold material
  const coinMaterial = (
    <meshStandardMaterial
      color="#D4AF37"          // Classic old gold tone
      metalness={0.88}
      roughness={0.32}         // Slightly rougher to look like an old minted coin
      envMapIntensity={2.5}
    />
  );

  return (
    // Scale down the entire coin by 0.75 to prevent the WebGL invisible frame from cropping it!
    <group scale={0.75}>
      {/* The Solid Coin Base */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[2.0, 2.0, 0.25, 64]} />
        {coinMaterial}
      </mesh>

      {/* The Thick Raised Outer Lip of the Coin */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[1.9, 0.15, 64, 64]} />
        {coinMaterial}
      </mesh>
      
      {/* The Inner Decorative Thin Ring (Classic old coin style) */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[1.7, 0.04, 32, 64]} />
        {coinMaterial}
      </mesh>

      {/* Front Minted Text */}
      <group position={[0.15, 0, 0.06]}>
        <Center>
          <Text3D
            font="/fonts/gentilis_bold.typeface.json"
            size={1.1}
            height={0.15} // Thick extrusion
            curveSegments={20}
            bevelEnabled
            bevelThickness={0.04} // Heavy bevel to catch light like a stamped coin
            bevelSize={0.03}
            bevelOffset={0}
            bevelSegments={8}
          >
            AP
            {coinMaterial}
          </Text3D>
        </Center>
      </group>

      {/* Back Minted Text (Flipped 180 degrees) */}
      <group position={[-0.15, 0, -0.06]}>
        <group rotation={[0, Math.PI, 0]}>
          <Center>
            <Text3D
              font="/fonts/gentilis_bold.typeface.json"
              size={1.1}
              height={0.15}
              curveSegments={20}
              bevelEnabled
              bevelThickness={0.04}
              bevelSize={0.03}
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

/* ── Cinematic moody lights matching the dark warm site palette ── */
function DynamicLights() {
  const warm = useRef<THREE.PointLight>(null);
  const cool = useRef<THREE.PointLight>(null);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    if (warm.current) {
      warm.current.position.x = Math.sin(t * 0.45) * 3.5;
      warm.current.position.y = Math.cos(t * 0.35) * 2.5;
    }
    if (cool.current) {
      cool.current.position.x = Math.cos(t * 0.38) * -3;
      cool.current.position.y = Math.sin(t * 0.52) * 1.8;
    }
  });

  return (
    <>
      {/* Warm amber key light — matches site's gold primary */}
      <pointLight ref={warm} position={[3, 3, 3]} intensity={35} color="#C8A96E" />
      {/* Cool desaturated fill */}
      <pointLight ref={cool} position={[-3, -1, 2]} intensity={12} color="#D4CFC8" />
      {/* Soft rim from behind */}
      <pointLight position={[0, 1, -3.5]} intensity={18} color="#B8A070" />
      {/* Very soft ambient so darks aren't pitch black */}
      <ambientLight intensity={0.15} color="#E8DCC8" />
    </>
  );
}

/* ── Main exported component ── */
export default function AP3DMonogram({ className = '' }: { className?: string }) {
  return (
    <div className={`w-full h-full cursor-grab active:cursor-grabbing ${className}`}>
      <Canvas
        camera={{ position: [0, 0, 4.8], fov: 42 }}
        gl={{ antialias: true, alpha: true }}
        style={{ background: 'transparent' }}
        dpr={typeof window !== 'undefined' ? Math.min(window.devicePixelRatio, 2) : 1}
      >
        <Suspense fallback={null}>
          <DynamicLights />
          <Environment preset="apartment" />
          <APCoin />
          <OrbitControls 
            enableZoom={false} 
            enablePan={false} 
            autoRotate 
            autoRotateSpeed={2} 
            makeDefault 
          />
        </Suspense>
      </Canvas>
    </div>
  );
}
