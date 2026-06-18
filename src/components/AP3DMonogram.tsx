import { useRef, Suspense, useMemo, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Text3D, Center, Environment, OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { MeshSurfaceSampler } from 'three/examples/jsm/math/MeshSurfaceSampler.js';
import gsap from 'gsap';

/* ── Cinematic moody lights ── */
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
      <pointLight ref={warm} position={[3, 3, 3]} intensity={35} color="#C8A96E" />
      <pointLight ref={cool} position={[-3, -1, 2]} intensity={12} color="#D4CFC8" />
      <pointLight position={[0, 1, -3.5]} intensity={18} color="#B8A070" />
      <ambientLight intensity={0.15} color="#E8DCC8" />
    </>
  );
}

/* ── Nebula Dissolve (Particle Sand) Effect ── */
function NebulaDissolve({ triggerTransition, particleData }: { triggerTransition?: boolean, particleData: any }) {
  const count = 20000;
  const pointsRef = useRef<THREE.Points>(null);
  const geomRef = useRef<THREE.BufferGeometry>(null);
  const flashLightRef = useRef<THREE.PointLight>(null);
  const [active, setActive] = useState(false);
  const startTime = useRef(0);

  useEffect(() => {
    if (geomRef.current && particleData && !active) {
      geomRef.current.setAttribute('position', new THREE.BufferAttribute(new Float32Array(particleData.positions), 3));
    }
  }, [particleData, active]);

  useEffect(() => {
    if (triggerTransition) {
       setActive(true);
       startTime.current = performance.now();
       
       if (flashLightRef.current) {
          gsap.fromTo(flashLightRef.current, 
            { intensity: 0 }, 
            { intensity: 5000, duration: 0.15, yoyo: true, repeat: 1, ease: "power4.out" }
          );
       }
    }
  }, [triggerTransition]);

  useFrame(() => {
    if (active && geomRef.current && particleData && pointsRef.current) {
      const elapsed = (performance.now() - startTime.current) / 1000;
      const pos = geomRef.current.attributes.position.array as Float32Array;
      const vels = particleData.velocities;
      
      // The "Wind" acceleration: starts gentle, blows apart
      const speedMult = Math.pow(elapsed * 1.5, 3) * 0.016; 
      
      for(let i=0; i < count; i++) {
         pos[i*3] += vels[i*3] * speedMult;
         pos[i*3+1] += vels[i*3+1] * speedMult;
         pos[i*3+2] += vels[i*3+2] * speedMult;
      }
      geomRef.current.attributes.position.needsUpdate = true;
      
      // Swirl the entire nebula and blow it towards camera
      pointsRef.current.rotation.y += elapsed * 0.02;
      pointsRef.current.rotation.z += elapsed * 0.005;
      pointsRef.current.position.x += elapsed * 0.02;
      pointsRef.current.position.y += elapsed * 0.01;
      pointsRef.current.position.z += elapsed * 0.03;
      
      // Fade out particles slowly
      const material = pointsRef.current.material as THREE.PointsMaterial;
      material.opacity = Math.max(0, 1.0 - elapsed * 0.4);
    }
  });

  if (!particleData) return null;

  return (
    <>
      <pointLight ref={flashLightRef} position={[0, 0, 1]} intensity={0} color="#FFD700" distance={30} />
      <points ref={pointsRef} visible={active}>
        <bufferGeometry ref={geomRef} />
        <pointsMaterial 
          size={0.025} 
          color="#FFD700" 
          transparent 
          opacity={1.0} 
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          sizeAttenuation={true}
        />
      </points>
    </>
  );
}

/* ── Main exported component ── */
export default function AP3DMonogram({ className = '', triggerTransition = false }: { className?: string, triggerTransition?: boolean }) {
  const textMeshRef = useRef<THREE.Mesh>(null);
  const [meshReady, setMeshReady] = useState(false);
  const [particleData, setParticleData] = useState<{ positions: Float32Array, velocities: Float32Array } | null>(null);

  // Sample 20,000 points from the surface of the text geometry
  useEffect(() => {
    if (meshReady && textMeshRef.current && !particleData) {
      try {
        const mesh = textMeshRef.current;
        const sampler = new MeshSurfaceSampler(mesh).build();
        const count = 20000;
        const positions = new Float32Array(count * 3);
        const velocities = new Float32Array(count * 3);
        const tempPosition = new THREE.Vector3();
        
        for (let i = 0; i < count; i++) {
          sampler.sample(tempPosition);
          positions[i * 3] = tempPosition.x;
          positions[i * 3 + 1] = tempPosition.y;
          positions[i * 3 + 2] = tempPosition.z;
          
          // Spherical outward velocity
          const speed = 0.5 + Math.random() * 2.0;
          velocities[i * 3] = (Math.random() - 0.5) * speed;
          velocities[i * 3 + 1] = (Math.random() - 0.5) * speed;
          velocities[i * 3 + 2] = (Math.random() - 0.5) * speed;
        }
        setParticleData({ positions, velocities });
      } catch (e) {
        console.warn("Sampler failed to build", e);
      }
    }
  }, [meshReady, particleData]);

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
          
          <group position={[0.35, 0, 0]}>
            <Center>
              {/* Solid Text - Turns invisible but stays in DOM during explosion to preserve bounding box */}
              <Text3D
                ref={(mesh) => { if(mesh && !meshReady) { textMeshRef.current = mesh as THREE.Mesh; setMeshReady(true); } }}
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
                <meshStandardMaterial
                  color="#EDE0CA"
                  metalness={0.82}
                  roughness={0.18}
                  envMapIntensity={2.2}
                  transparent={triggerTransition}
                  opacity={triggerTransition ? 0 : 1}
                />
              </Text3D>
              
              {/* Nebula Dust Effect - Perfectly overlaps text because it's in the same Center/Group */}
              <NebulaDissolve triggerTransition={triggerTransition} particleData={particleData} />
            </Center>
          </group>
          
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
