import { useRef, useMemo, useState, Suspense, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Text3D, Center, Environment, OrbitControls, ContactShadows, useTexture } from '@react-three/drei';
import { EffectComposer, ToneMapping, Vignette, SMAA } from '@react-three/postprocessing';
import { ToneMappingMode } from 'postprocessing';
import * as THREE from 'three';

/* ── Procedural PBR Texture Generator ── */
function useGoldTextures() {
  return useMemo(() => {
    const size = 512;

    // ── Normal Map: micro-scratches & surface grain ──
    const normalCanvas = document.createElement('canvas');
    normalCanvas.width = size;
    normalCanvas.height = size;
    const nCtx = normalCanvas.getContext('2d')!;
    // Base neutral normal (128,128,255)
    nCtx.fillStyle = 'rgb(128,128,255)';
    nCtx.fillRect(0, 0, size, size);

    // Random micro-scratches
    nCtx.globalAlpha = 0.08;
    for (let i = 0; i < 600; i++) {
      const x = Math.random() * size;
      const y = Math.random() * size;
      const len = Math.random() * 40 + 5;
      const angle = Math.random() * Math.PI * 2;
      nCtx.strokeStyle = `rgb(${100 + Math.random() * 56},${100 + Math.random() * 56},255)`;
      nCtx.lineWidth = Math.random() * 1.5 + 0.3;
      nCtx.beginPath();
      nCtx.moveTo(x, y);
      nCtx.lineTo(x + Math.cos(angle) * len, y + Math.sin(angle) * len);
      nCtx.stroke();
    }

    // Circular mint marks (radial scratches from coin stamping)
    nCtx.globalAlpha = 0.04;
    for (let i = 0; i < 30; i++) {
      const cx = size / 2 + (Math.random() - 0.5) * 200;
      const cy = size / 2 + (Math.random() - 0.5) * 200;
      const r = Math.random() * 120 + 40;
      nCtx.strokeStyle = `rgb(${110 + Math.random() * 36},${110 + Math.random() * 36},255)`;
      nCtx.lineWidth = Math.random() * 0.8 + 0.2;
      nCtx.beginPath();
      nCtx.arc(cx, cy, r, Math.random() * Math.PI, Math.random() * Math.PI + Math.PI * 0.5);
      nCtx.stroke();
    }

    nCtx.globalAlpha = 1;
    const normalMap = new THREE.CanvasTexture(normalCanvas);
    normalMap.wrapS = normalMap.wrapT = THREE.RepeatWrapping;

    // ── Roughness Map: uneven shine ──
    const roughCanvas = document.createElement('canvas');
    roughCanvas.width = size;
    roughCanvas.height = size;
    const rCtx = roughCanvas.getContext('2d')!;
    // Base roughness (medium gray)
    rCtx.fillStyle = 'rgb(90,90,90)';
    rCtx.fillRect(0, 0, size, size);

    // Add noise for uneven polish
    const imgData = rCtx.getImageData(0, 0, size, size);
    for (let i = 0; i < imgData.data.length; i += 4) {
      const noise = (Math.random() - 0.5) * 40;
      imgData.data[i] = Math.max(0, Math.min(255, imgData.data[i] + noise));
      imgData.data[i + 1] = Math.max(0, Math.min(255, imgData.data[i + 1] + noise));
      imgData.data[i + 2] = Math.max(0, Math.min(255, imgData.data[i + 2] + noise));
    }
    rCtx.putImageData(imgData, 0, 0);

    // Worn spots (lighter = rougher = more worn)
    rCtx.globalAlpha = 0.15;
    for (let i = 0; i < 12; i++) {
      const x = Math.random() * size;
      const y = Math.random() * size;
      const r = Math.random() * 60 + 20;
      const grad = rCtx.createRadialGradient(x, y, 0, x, y, r);
      grad.addColorStop(0, 'rgb(160,160,160)');
      grad.addColorStop(1, 'rgba(90,90,90,0)');
      rCtx.fillStyle = grad;
      rCtx.fillRect(x - r, y - r, r * 2, r * 2);
    }

    rCtx.globalAlpha = 1;
    const roughnessMap = new THREE.CanvasTexture(roughCanvas);
    roughnessMap.wrapS = roughnessMap.wrapT = THREE.RepeatWrapping;

    // ── Ambient Occlusion Map: dirt in recessed areas ──
    const aoCanvas = document.createElement('canvas');
    aoCanvas.width = size;
    aoCanvas.height = size;
    const aCtx = aoCanvas.getContext('2d')!;
    // Mostly white (fully lit), dark at edges (recessed areas)
    aCtx.fillStyle = 'rgb(255,255,255)';
    aCtx.fillRect(0, 0, size, size);

    // Subtle vignette for edge darkening
    const aoGrad = aCtx.createRadialGradient(size / 2, size / 2, size * 0.2, size / 2, size / 2, size * 0.5);
    aoGrad.addColorStop(0, 'rgba(255,255,255,0)');
    aoGrad.addColorStop(0.7, 'rgba(0,0,0,0)');
    aoGrad.addColorStop(1, 'rgba(0,0,0,0.2)');
    aCtx.fillStyle = aoGrad;
    aCtx.fillRect(0, 0, size, size);

    // Small dark pits (patina / age marks)
    aCtx.globalAlpha = 0.06;
    for (let i = 0; i < 40; i++) {
      const x = Math.random() * size;
      const y = Math.random() * size;
      const r = Math.random() * 15 + 3;
      aCtx.fillStyle = 'rgb(0,0,0)';
      aCtx.beginPath();
      aCtx.arc(x, y, r, 0, Math.PI * 2);
      aCtx.fill();
    }

    aCtx.globalAlpha = 1;
    const aoMap = new THREE.CanvasTexture(aoCanvas);
    aoMap.wrapS = aoMap.wrapT = THREE.RepeatWrapping;

    return { normalMap, roughnessMap, aoMap };
  }, []);
}

/* ── Antique Gold "AP" Minted Coin with PBR Textures ── */
function APCoin({ isMini, hovered }: { isMini: boolean; hovered: boolean }) {
  const coinRef = useRef<THREE.Group>(null);
  const { normalMap, roughnessMap, aoMap } = useGoldTextures();

  // Entrance animation state
  const entranceRef = useRef({ elapsed: 0, done: false });
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  // Make target scale slightly larger in full-screen preloader (0.20 desktop / 0.15 mobile) for cinematic effect
  const TARGET_SCALE = isMini 
    ? 0.55 
    : (isMobile ? 0.15 : 0.20);

  const currentScale = useRef(isMini ? 0.55 : (isMobile ? 0.15 : 0.20));

  // Smooth entrance + auto-rotation with ramp-up
  useFrame((state, delta) => {
    if (!coinRef.current) return;

    // Smoothly damp the scale to TARGET_SCALE
    currentScale.current = THREE.MathUtils.damp(currentScale.current, TARGET_SCALE, 5, delta);
    coinRef.current.scale.set(currentScale.current, currentScale.current, currentScale.current);

    if (!isMini) {
      // Rotation: ramp up from 0 to full speed over 1.5s
      entranceRef.current.elapsed += delta;
      const rotRamp = Math.min(entranceRef.current.elapsed / 1.5, 1);
      const rotSpeed = rotRamp * (2 - rotRamp) * 0.6;
      coinRef.current.rotation.y += delta * rotSpeed;
    } else {
      // In navbar: fixed scale, fast spin on hover, slow drift otherwise
      const rotSpeed = hovered ? 3.2 : 0.45;
      coinRef.current.rotation.y += delta * rotSpeed;
    }
  });

  // ── Coin body: warm, deep antique gold ──
  const coinBodyProps = {
    color: '#B8912D',           // Deep warm gold — aged, rich
    metalness: 1,
    roughness: 0.38,
    clearcoat: 0.12,
    clearcoatRoughness: 0.6,
    reflectivity: 1,
    envMapIntensity: 2.8,
    normalMap,
    normalScale: new THREE.Vector2(0.35, 0.35),
    roughnessMap,
    aoMap,
    aoMapIntensity: 0.7,
  };

  // ── Rim: slightly brighter, polished gold (worn edges catch more light) ──
  const coinRimProps = {
    ...coinBodyProps,
    color: '#D4A840',           // Brighter polished gold on raised edges
    roughness: 0.25,            // Smoother — rims get polished from handling
    clearcoat: 0.2,
    envMapIntensity: 3.0,
  };

  // ── Text: brightest gold, freshly minted look ──
  const coinTextProps = {
    ...coinBodyProps,
    color: '#DDB94E',           // Bright warm gold on stamped lettering
    roughness: 0.3,
    clearcoat: 0.18,
    envMapIntensity: 3.2,
  };

  return (
    <group scale={[TARGET_SCALE, TARGET_SCALE, TARGET_SCALE]} ref={coinRef}> {/* Centered perfectly at origin */}
      {/* The Solid Coin Base */}
      <mesh rotation={[Math.PI / 2, 0, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[2.0, 2.0, 0.35, 128]} />
        <meshPhysicalMaterial {...coinBodyProps} />
      </mesh>

      {/* Edge Grooves */}
      <mesh rotation={[Math.PI / 2, 0, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[2.005, 2.005, 0.35, 128, 1, true]} />
        <meshPhysicalMaterial {...coinBodyProps} />
      </mesh>

      {/* Front Raised Outer Rim */}
      <mesh position={[0, 0, 0.175]} castShadow receiveShadow>
        <torusGeometry args={[1.92, 0.08, 32, 128]} />
        <meshPhysicalMaterial {...coinRimProps} />
      </mesh>

      {/* Back Raised Outer Rim */}
      <mesh position={[0, 0, -0.175]} castShadow receiveShadow>
        <torusGeometry args={[1.92, 0.08, 32, 128]} />
        <meshPhysicalMaterial {...coinRimProps} />
      </mesh>

      {/* Front Inner Decorative Ring */}
      <mesh position={[0, 0, 0.175]} castShadow receiveShadow>
        <torusGeometry args={[1.7, 0.03, 16, 128]} />
        <meshPhysicalMaterial {...coinRimProps} />
      </mesh>

      {/* Back Inner Decorative Ring */}
      <mesh position={[0, 0, -0.175]} castShadow receiveShadow>
        <torusGeometry args={[1.7, 0.03, 16, 128]} />
        <meshPhysicalMaterial {...coinRimProps} />
      </mesh>

      {/* Front Minted Text */}
      <group position={[0, 0, 0.175]}>
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
            <meshPhysicalMaterial {...coinTextProps} />
          </Text3D>
        </Center>
      </group>

      {/* Back Minted Text (Flipped 180 degrees) */}
      <group position={[0, 0, -0.175]}>
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
              <meshPhysicalMaterial {...coinTextProps} />
            </Text3D>
          </Center>
        </group>
      </group>
    </group>
  );
}

/* ── Cinematic Lighting with Shadow-Casting Key Light ── */
function CinematicLights({ isMini }: { isMini: boolean }) {
  const sweepLightRef = useRef<THREE.DirectionalLight>(null);

  useFrame((state) => {
    if (sweepLightRef.current && !isMini) {
      // Sweep light X position over the first 2.5 seconds
      const elapsed = state.clock.getElapsedTime();
      const x = -8 + Math.min(elapsed / 2.5, 1) * 16;
      sweepLightRef.current.position.x = x;
    }
  });

  return (
    <>
      <ambientLight intensity={isMini ? 0.28 : 0.08} />

      {/* Sweep light for golden reflection pass */}
      {!isMini && (
        <directionalLight
          ref={sweepLightRef}
          position={[-8, 3, 4]}
          intensity={8}
          color="#ffd685"
        />
      )}

      {/* Key light with shadow casting */}
      <directionalLight
        position={[4, 4, 3]}
        intensity={isMini ? 4.5 : 3}
        color="#ffdf95"
        castShadow={!isMini}
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-near={0.1}
        shadow-camera-far={20}
        shadow-camera-left={-3}
        shadow-camera-right={3}
        shadow-camera-top={3}
        shadow-camera-bottom={-3}
        shadow-bias={-0.0001}
      />

      {/* Cool fill light */}
      <pointLight position={[-3, 1, 3]} intensity={isMini ? 12 : 8} color="#ffffff" />

      {/* Golden rim light from below */}
      <pointLight position={[0, -2, -3]} intensity={isMini ? 10 : 6} color="#a28d63" />

      {/* Subtle top accent */}
      <pointLight position={[0, 4, 0]} intensity={isMini ? 6 : 4} color="#ffeebb" />
    </>
  );
}

/* ── Post-Processing Stack ── */
function PostProcessing() {
  return (
    <EffectComposer multisampling={0}>
      {/* Filmic tone mapping for richer colors */}
      <ToneMapping mode={ToneMappingMode.AGX} />
      {/* Subtle vignette for cinematic framing */}
      <Vignette eskil={false} offset={0.15} darkness={0.45} />
      {/* Anti-aliasing */}
      <SMAA />
    </EffectComposer>
  );
}

/* ── Cinematic Scroll Controller for Preloader Transitions ── */
function CinematicScrollScene({
  scrollProgress,
  coinGroupRef,
  shadowRef,
  isMini,
  settled,
  setSettled,
}: {
  scrollProgress: number;
  coinGroupRef: React.RefObject<THREE.Group | null>;
  shadowRef: React.RefObject<THREE.Group | null>;
  isMini: boolean;
  settled: boolean;
  setSettled: (val: boolean) => void;
}) {
  const { camera } = useThree();
  const smoothedProgress = useRef(0);
  const currentLookAt = useRef(new THREE.Vector3(0, 0, 0));

  useFrame((state, delta) => {
    if (!isMini) {
      // --- PRELOADER SCROLL LOGIC ---
      if (settled) setSettled(false);

      // Smooth the input scrollProgress with frame-rate independent damping
      smoothedProgress.current = THREE.MathUtils.damp(
        smoothedProgress.current,
        scrollProgress,
        6, // Damping factor
        delta
      );

      const t = Math.min(Math.max(smoothedProgress.current, 0), 1);

      if (t <= 0.4) {
        // --- STAGE 1 (0.0 -> 0.4): Coin free falls flat to the floor (Camera stays front) ---
        const t1 = t / 0.4;
        const e1 = t1 * t1 * (3 - 2 * t1); // smoothstep ease-in-out for gravity fall

        if (coinGroupRef.current) {
          coinGroupRef.current.position.set(0, -1.25 * e1, 0);
          coinGroupRef.current.rotation.set((Math.PI / 2) * e1, 0, 0);
        }

        camera.position.set(0, 0, 7.5);
        currentLookAt.current.set(0, -1.25 * e1, 0);
        camera.lookAt(currentLookAt.current);

        if (shadowRef.current) {
          shadowRef.current.traverse((child) => {
            if (child instanceof THREE.Mesh && child.material) {
              child.material.opacity = 0.08 + 0.27 * e1;
            }
          });
        }
      } else if (t <= 0.7) {
        // --- STAGE 2 (0.4 -> 0.7): Camera circular orbit to top view ---
        const t2 = (t - 0.4) / 0.3;
        const e2 = t2 * t2 * (3 - 2 * t2); // smoothstep ease-in-out

        if (coinGroupRef.current) {
          coinGroupRef.current.position.set(0, -1.25, 0);
          coinGroupRef.current.rotation.set(Math.PI / 2, 0, 0);
        }

        // True circular orbit around the coin [0, -1.25, 0] with radius 7.6034
        const radius = 7.6034;
        const theta0 = Math.asin(1.25 / radius);
        const theta = theta0 + (Math.PI / 2 - theta0) * e2;
        camera.position.set(0, -1.25 + radius * Math.sin(theta), radius * Math.cos(theta));
        currentLookAt.current.set(0, -1.25, 0);
        camera.lookAt(currentLookAt.current);

        if (shadowRef.current) {
          shadowRef.current.traverse((child) => {
            if (child instanceof THREE.Mesh && child.material) {
              child.material.opacity = 0.35;
            }
          });
        }
      } else {
        // --- STAGE 3 (0.7 -> 1.0): Camera pushes straight down through the center of the coin ---
        const t3 = (t - 0.7) / 0.3;
        const e3 = t3 * t3; // accelerate through the coin

        if (coinGroupRef.current) {
          coinGroupRef.current.position.set(0, -1.25, 0);
          coinGroupRef.current.rotation.set(Math.PI / 2, 0, 0);
        }

        camera.position.set(0, 6.3534 - 8.8534 * e3, 0);
        currentLookAt.current.set(0, -1.25 - 8.75 * e3, 0);
        camera.lookAt(currentLookAt.current);

        if (shadowRef.current) {
          shadowRef.current.traverse((child) => {
            if (child instanceof THREE.Mesh && child.material) {
              child.material.opacity = Math.max(0, 0.35 * (1 - e3));
            }
          });
        }
      }
    } else {
      // --- NAVBAR TRANSITION SMOOTHING LOGIC ---
      // Smoothly damp coin position and rotation back to navbar defaults
      if (coinGroupRef.current) {
        coinGroupRef.current.position.x = THREE.MathUtils.damp(coinGroupRef.current.position.x, 0, 5, delta);
        coinGroupRef.current.position.y = THREE.MathUtils.damp(coinGroupRef.current.position.y, 0, 5, delta);
        coinGroupRef.current.position.z = THREE.MathUtils.damp(coinGroupRef.current.position.z, 0, 5, delta);

        coinGroupRef.current.rotation.x = THREE.MathUtils.damp(coinGroupRef.current.rotation.x, 0, 5, delta);
        coinGroupRef.current.rotation.z = THREE.MathUtils.damp(coinGroupRef.current.rotation.z, 0, 5, delta);
      }

      // Smoothly damp camera position and lookAt back to navbar defaults
      camera.position.x = THREE.MathUtils.damp(camera.position.x, 0, 5, delta);
      camera.position.y = THREE.MathUtils.damp(camera.position.y, 0, 5, delta);
      camera.position.z = THREE.MathUtils.damp(camera.position.z, 4, 5, delta);

      currentLookAt.current.x = THREE.MathUtils.damp(currentLookAt.current.x, 0, 5, delta);
      currentLookAt.current.y = THREE.MathUtils.damp(currentLookAt.current.y, 0, 5, delta);
      currentLookAt.current.z = THREE.MathUtils.damp(currentLookAt.current.z, 0, 5, delta);
      camera.lookAt(currentLookAt.current);

      // Check if camera has settled
      const dist = camera.position.distanceTo(new THREE.Vector3(0, 0, 4));
      if (dist < 0.05 && !settled) {
        setSettled(true);
      }
    }
  });

  return null;
}

// PreloaderFloor removed (restored to transparent video background)

/* ── Main exported component ── */
export default function AP3DMonogram({
  className = '',
  isMini = false,
  scrollProgress = 0,
}: {
  className?: string;
  isMini?: boolean;
  scrollProgress?: number;
}) {
  const [hovered, setHovered] = useState(false);
  const coinGroupRef = useRef<THREE.Group>(null);
  const shadowRef = useRef<THREE.Group>(null);
  const [settled, setSettled] = useState(false);

  return (
    <div 
      className={`w-full h-full cursor-grab active:cursor-grabbing ${className}`}
      onMouseEnter={() => isMini && setHovered(true)}
      onMouseLeave={() => isMini && setHovered(false)}
    >
      <Canvas
        camera={{ position: [0, 0, 7.5], fov: 35 }}
        gl={{ antialias: false, alpha: true, toneMapping: THREE.NoToneMapping }}
        shadows={!isMini}
        style={{ background: 'transparent' }}
        dpr={typeof window !== 'undefined' ? Math.min(window.devicePixelRatio, 2) : 1}
      >
        <Suspense fallback={null}>
          <CinematicLights isMini={isMini} />

          {/* Studio HDRI for strong, clean gold reflections */}
          <Environment preset="studio" />

          {/* Visually center the 3D focal point */}
          <group 
            ref={coinGroupRef} 
            position={[0, 0, 0]}
            rotation={isMini ? [0, 0, 0] : undefined}
          >
            <APCoin isMini={isMini} hovered={hovered} />
          </group>

          {/* Contact shadow grounds the coin inside preloader (disable in navbar) */}
          {!isMini && (
            <ContactShadows
              ref={shadowRef}
              position={[0, -1.3, 0]}
              opacity={0.08}
              blur={3.5}
              scale={10}
              far={4}
            />
          )}

          {/* Preloader Floor removed */}

          {/* Handle scroll-driven camera & coin animations inside the Canvas context */}
          <CinematicScrollScene
            scrollProgress={scrollProgress}
            coinGroupRef={coinGroupRef}
            shadowRef={shadowRef}
            isMini={isMini}
            settled={settled}
            setSettled={setSettled}
          />

          {/* Interactive rotation controls - only enable in navbar AFTER camera settles */}
          {isMini && settled && (
            <OrbitControls
              enableZoom={false}
              enablePan={false}
              enableRotate={true}
              target={[0, 0, 0]}
              makeDefault
            />
          )}
        </Suspense>

        {/* Post-processing outside Suspense for immediate rendering */}
        <PostProcessing />
      </Canvas>
    </div>
  );
}
