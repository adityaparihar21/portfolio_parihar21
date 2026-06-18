import { useRef, useEffect, Suspense } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Text3D, Center, Environment } from '@react-three/drei';
import * as THREE from 'three';

/* ── Warm-cream serif "AP" mesh ── */
function APText({ mouseX, mouseY }: { mouseX: React.MutableRefObject<number>; mouseY: React.MutableRefObject<number> }) {
  const groupRef = useRef<THREE.Group>(null);
  const { size } = useThree();

  useFrame((state) => {
    if (!groupRef.current) return;
    const t = state.clock.elapsedTime;

    // Slow, graceful Y rotation — cinematic pendulum feel
    const targetY = Math.sin(t * 0.22) * 0.3;
    const targetX = Math.sin(t * 0.14) * 0.06;

    // Mouse parallax — subtle
    const mx = (mouseX.current / (size.width || 1) - 0.5) * 0.35;
    const my = -(mouseY.current / (size.height || 1) - 0.5) * 0.2;

    groupRef.current.rotation.y += ((targetY + mx) - groupRef.current.rotation.y) * 0.04;
    groupRef.current.rotation.x += ((targetX + my) - groupRef.current.rotation.x) * 0.04;
  });

  return (
    <group ref={groupRef}>
      <Center>
        <Text3D
          font="/fonts/gentilis_bold.typeface.json"
          size={1.5}
          height={0.38}
          curveSegments={20}
          bevelEnabled
          bevelThickness={0.035}
          bevelSize={0.022}
          bevelOffset={0}
          bevelSegments={6}
        >
          AP
          {/* Warm cream-pearl material — matches site foreground */}
          <meshStandardMaterial
            color="#EDE0CA"          // warm cream — site's foreground tone
            metalness={0.82}
            roughness={0.18}
            envMapIntensity={2.2}
          />
        </Text3D>
      </Center>
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
  const mouseX = useRef(0);
  const mouseY = useRef(0);

  useEffect(() => {
    const onMove = (e: MouseEvent) => { mouseX.current = e.clientX; mouseY.current = e.clientY; };
    const onTouch = (e: TouchEvent) => { mouseX.current = e.touches[0].clientX; mouseY.current = e.touches[0].clientY; };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('touchmove', onTouch, { passive: true });
    return () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('touchmove', onTouch); };
  }, []);

  return (
    <div className={`w-full h-full ${className}`}>
      <Canvas
        camera={{ position: [0, 0, 4.8], fov: 42 }}
        gl={{ antialias: true, alpha: true }}
        style={{ background: 'transparent' }}
        dpr={typeof window !== 'undefined' ? Math.min(window.devicePixelRatio, 2) : 1}
      >
        <Suspense fallback={null}>
          <DynamicLights />
          <Environment preset="apartment" />
          <APText mouseX={mouseX} mouseY={mouseY} />
        </Suspense>
      </Canvas>
    </div>
  );
}
