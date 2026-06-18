import { useRef, useEffect, Suspense } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Text3D, Center, Environment, MeshTransmissionMaterial } from '@react-three/drei';
import * as THREE from 'three';

/* ── Gold metallic "AP" mesh ── */
function APText({ mouseX, mouseY }: { mouseX: React.MutableRefObject<number>; mouseY: React.MutableRefObject<number> }) {
  const groupRef = useRef<THREE.Group>(null);
  const { size } = useThree();

  useFrame((state) => {
    if (!groupRef.current) return;
    const t = state.clock.elapsedTime;

    // Slow auto-rotation on Y axis
    groupRef.current.rotation.y = Math.sin(t * 0.25) * 0.35;
    groupRef.current.rotation.x = Math.cos(t * 0.18) * 0.08;

    // Subtle mouse parallax influence
    const tx = (mouseX.current / size.width - 0.5) * 0.4;
    const ty = -(mouseY.current / size.height - 0.5) * 0.25;
    groupRef.current.rotation.y += tx * 0.5;
    groupRef.current.rotation.x += ty * 0.5;
  });

  return (
    <group ref={groupRef}>
      <Center>
        <Text3D
          font="/fonts/optimer_bold.typeface.json"
          size={1.6}
          height={0.45}          // extrusion depth
          curveSegments={24}
          bevelEnabled
          bevelThickness={0.04}
          bevelSize={0.03}
          bevelOffset={0}
          bevelSegments={8}
        >
          AP
          {/* Gold-chrome PBR material */}
          <meshStandardMaterial
            color="#D4AF5A"
            metalness={1}
            roughness={0.12}
            envMapIntensity={2.5}
          />
        </Text3D>
      </Center>
    </group>
  );
}

/* ── Animated point lights for drama ── */
function DynamicLights() {
  const light1 = useRef<THREE.PointLight>(null);
  const light2 = useRef<THREE.PointLight>(null);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    if (light1.current) {
      light1.current.position.x = Math.sin(t * 0.6) * 4;
      light1.current.position.y = Math.cos(t * 0.4) * 3;
    }
    if (light2.current) {
      light2.current.position.x = Math.cos(t * 0.5) * -4;
      light2.current.position.y = Math.sin(t * 0.7) * 2;
    }
  });

  return (
    <>
      {/* Key warm gold light */}
      <pointLight ref={light1} position={[3, 3, 3]} intensity={40} color="#FFD580" />
      {/* Cool fill light from below */}
      <pointLight ref={light2} position={[-3, -2, 2]} intensity={20} color="#AACCFF" />
      {/* Rim / back light */}
      <pointLight position={[0, 0, -4]} intensity={15} color="#E8B86D" />
      {/* Ambient */}
      <ambientLight intensity={0.3} color="#FFE8B0" />
    </>
  );
}

/* ── Main exported component ── */
export default function AP3DMonogram({ className = '' }: { className?: string }) {
  const mouseX = useRef(0);
  const mouseY = useRef(0);

  useEffect(() => {
    const handleMove = (e: MouseEvent) => {
      mouseX.current = e.clientX;
      mouseY.current = e.clientY;
    };
    const handleTouch = (e: TouchEvent) => {
      mouseX.current = e.touches[0].clientX;
      mouseY.current = e.touches[0].clientY;
    };
    window.addEventListener('mousemove', handleMove);
    window.addEventListener('touchmove', handleTouch);
    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('touchmove', handleTouch);
    };
  }, []);

  return (
    <div className={`w-full h-full ${className}`} style={{ touchAction: 'none' }}>
      <Canvas
        camera={{ position: [0, 0, 5], fov: 45 }}
        gl={{ antialias: true, alpha: true }}
        style={{ background: 'transparent' }}
        dpr={[1, 2]}
      >
        <Suspense fallback={null}>
          <DynamicLights />
          {/* HDR environment for realistic metallic reflections */}
          <Environment preset="city" />
          <APText mouseX={mouseX} mouseY={mouseY} />
        </Suspense>
      </Canvas>
    </div>
  );
}
