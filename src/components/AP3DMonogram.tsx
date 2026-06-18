import { useRef, Suspense, useMemo, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Text3D, Center, Environment, OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import gsap from 'gsap';

/* ── Warm-cream serif "AP" mesh ── */
function APText() {
  return (
    <group position={[0.35, 0, 0]}>
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

/* ── Glass Supernova Shatter Effect ── */
function GlassSupernova({ triggerTransition }: { triggerTransition?: boolean }) {
  const count = 400;
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const flashLightRef = useRef<THREE.PointLight>(null);
  const [exploded, setExploded] = useState(false);
  const startTime = useRef(0);
  
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const shards = useMemo(() => {
    const data = [];
    for (let i = 0; i < count; i++) {
      // Spawn clustered around the AP logo center
      const x = (Math.random() - 0.5) * 2.5;
      const y = (Math.random() - 0.5) * 1.5;
      const z = (Math.random() - 0.5) * 0.5;
      
      // Explode heavily outwards towards the camera
      const dir = new THREE.Vector3(x * 1.5, y * 1.5, z + 2.0).normalize();
      const speed = 0.08 + Math.random() * 0.25;
      
      const rx = (Math.random() - 0.5) * 0.8;
      const ry = (Math.random() - 0.5) * 0.8;
      const rz = (Math.random() - 0.5) * 0.8;
      
      data.push({ pos: new THREE.Vector3(x, y, z), dir, speed, rx, ry, rz, rot: new THREE.Euler() });
    }
    return data;
  }, []);

  useEffect(() => {
    // Pre-initialize matrices so they exist in GPU memory before explosion
    if (meshRef.current) {
      shards.forEach((shard, i) => {
        dummy.position.copy(shard.pos);
        dummy.rotation.copy(shard.rot);
        dummy.scale.set(1, 1, 1);
        dummy.updateMatrix();
        meshRef.current!.setMatrixAt(i, dummy.matrix);
      });
      meshRef.current.instanceMatrix.needsUpdate = true;
    }
  }, [shards, dummy]);

  useEffect(() => {
    if (triggerTransition) {
       setExploded(true);
       startTime.current = performance.now();
       
       if (flashLightRef.current) {
          gsap.fromTo(flashLightRef.current, 
            { intensity: 0 }, 
            { intensity: 10000, duration: 0.15, yoyo: true, repeat: 1, ease: "power4.out" }
          );
       }
    }
  }, [triggerTransition]);

  useFrame(() => {
    if (exploded && meshRef.current) {
      const elapsed = (performance.now() - startTime.current) / 1000;
      
      shards.forEach((shard, i) => {
        // High explosive burst speed that tapers off slightly
        const currentSpeed = shard.speed * Math.max(0.2, (1.0 - elapsed * 0.3));
        shard.pos.addScaledVector(shard.dir, currentSpeed);
        
        shard.rot.x += shard.rx;
        shard.rot.y += shard.ry;
        shard.rot.z += shard.rz;
        
        dummy.position.copy(shard.pos);
        dummy.rotation.copy(shard.rot);
        
        // Shrink to dust
        const scale = Math.max(0, 1.0 - elapsed * 0.5);
        dummy.scale.set(scale, scale, scale);
        
        dummy.updateMatrix();
        meshRef.current!.setMatrixAt(i, dummy.matrix);
      });
      meshRef.current.instanceMatrix.needsUpdate = true;
    }
  });

  return (
    <>
      <pointLight ref={flashLightRef} position={[0, 0, 1]} intensity={0} color="#ffffff" distance={30} />
      <instancedMesh ref={meshRef} args={[undefined, undefined, count]} visible={exploded}>
        <tetrahedronGeometry args={[0.08, 0]} />
        <meshStandardMaterial 
          color="#FFD700" 
          emissive="#CCAA00"
          emissiveIntensity={0.5}
          metalness={0.9} 
          roughness={0.1} 
          envMapIntensity={4.0} 
        />
      </instancedMesh>
    </>
  );
}

/* ── Main exported component ── */
export default function AP3DMonogram({ className = '', triggerTransition = false }: { className?: string, triggerTransition?: boolean }) {
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
          
          {/* Hide solid text immediately when explosion starts */}
          {!triggerTransition && <APText />}
          
          <GlassSupernova triggerTransition={triggerTransition} />
          
          <OrbitControls 
            enableZoom={false} 
            enablePan={false} 
            autoRotate={!triggerTransition} 
            autoRotateSpeed={2} 
            makeDefault 
          />
        </Suspense>
      </Canvas>
    </div>
  );
}
