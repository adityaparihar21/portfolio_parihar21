import { useRef, useMemo, Suspense } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Text3D, Center, Environment, OrbitControls, ContactShadows } from '@react-three/drei';
import { EffectComposer, Bloom, ToneMapping, Vignette, SMAA } from '@react-three/postprocessing';
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
function APCoin() {
  const coinRef = useRef<THREE.Group>(null);
  const { normalMap, roughnessMap, aoMap } = useGoldTextures();

  // Smooth auto-rotation
  useFrame((state, delta) => {
    if (coinRef.current) {
      coinRef.current.rotation.y += delta * 0.4;
    }
  });

  // Shared PBR gold material props
  const goldMaterialProps = {
    color: '#C8A34A',
    metalness: 1,
    roughness: 0.35,
    clearcoat: 0.15,
    clearcoatRoughness: 0.5,
    reflectivity: 1,
    envMapIntensity: 2.5,
    normalMap,
    normalScale: new THREE.Vector2(0.3, 0.3),
    roughnessMap,
    aoMap,
    aoMapIntensity: 0.6,
  };

  return (
    <group scale={0.4} ref={coinRef}>
      {/* The Solid Coin Base */}
      <mesh rotation={[Math.PI / 2, 0, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[2.0, 2.0, 0.35, 128]} />
        <meshPhysicalMaterial {...goldMaterialProps} />
      </mesh>

      {/* Edge Grooves */}
      <mesh rotation={[Math.PI / 2, 0, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[2.005, 2.005, 0.35, 128, 1, true]} />
        <meshPhysicalMaterial {...goldMaterialProps} />
      </mesh>

      {/* Front Raised Outer Rim */}
      <mesh position={[0, 0, 0.175]} castShadow receiveShadow>
        <torusGeometry args={[1.92, 0.08, 32, 128]} />
        <meshPhysicalMaterial {...goldMaterialProps} />
      </mesh>

      {/* Back Raised Outer Rim */}
      <mesh position={[0, 0, -0.175]} castShadow receiveShadow>
        <torusGeometry args={[1.92, 0.08, 32, 128]} />
        <meshPhysicalMaterial {...goldMaterialProps} />
      </mesh>

      {/* Front Inner Decorative Ring */}
      <mesh position={[0, 0, 0.175]} castShadow receiveShadow>
        <torusGeometry args={[1.7, 0.03, 16, 128]} />
        <meshPhysicalMaterial {...goldMaterialProps} />
      </mesh>

      {/* Back Inner Decorative Ring */}
      <mesh position={[0, 0, -0.175]} castShadow receiveShadow>
        <torusGeometry args={[1.7, 0.03, 16, 128]} />
        <meshPhysicalMaterial {...goldMaterialProps} />
      </mesh>

      {/* Front Minted Text */}
      <group position={[0.15, 0, 0.175]}>
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
            <meshPhysicalMaterial {...goldMaterialProps} />
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
              <meshPhysicalMaterial {...goldMaterialProps} />
            </Text3D>
          </Center>
        </group>
      </group>
    </group>
  );
}

/* ── Cinematic Lighting with Shadow-Casting Key Light ── */
function CinematicLights() {
  return (
    <>
      <ambientLight intensity={0.08} />

      {/* Key light with shadow casting */}
      <directionalLight
        position={[4, 4, 3]}
        intensity={3}
        color="#ffdf95"
        castShadow
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
      <pointLight position={[-3, 1, 3]} intensity={8} color="#ffffff" />

      {/* Golden rim light from below */}
      <pointLight position={[0, -2, -3]} intensity={6} color="#a28d63" />

      {/* Subtle top accent */}
      <pointLight position={[0, 4, 0]} intensity={4} color="#ffeebb" />
    </>
  );
}

/* ── Post-Processing Stack ── */
function PostProcessing() {
  return (
    <EffectComposer multisampling={0}>
      {/* Subtle gold bloom — catches light on the coin edges beautifully */}
      <Bloom
        intensity={0.35}
        luminanceThreshold={0.8}
        luminanceSmoothing={0.3}
        mipmapBlur
      />
      {/* Filmic tone mapping for richer colors */}
      <ToneMapping mode={ToneMappingMode.AGX} />
      {/* Subtle vignette for cinematic framing */}
      <Vignette eskil={false} offset={0.15} darkness={0.45} />
      {/* Anti-aliasing */}
      <SMAA />
    </EffectComposer>
  );
}

/* ── Main exported component ── */
export default function AP3DMonogram({ className = '' }: { className?: string }) {
  return (
    <div className={`w-full h-full cursor-grab active:cursor-grabbing ${className}`}>
      <Canvas
        camera={{ position: [0, 0, 5.6], fov: 40 }}
        gl={{ antialias: false, alpha: true, toneMapping: THREE.NoToneMapping }}
        shadows
        style={{ background: 'transparent' }}
        dpr={typeof window !== 'undefined' ? Math.min(window.devicePixelRatio, 2) : 1}
      >
        <Suspense fallback={null}>
          <CinematicLights />

          {/* Studio HDRI for strong, clean gold reflections */}
          <Environment preset="studio" />

          <APCoin />

          {/* Contact shadow grounds the coin instead of floating */}
          <ContactShadows
            position={[0, -1.3, 0]}
            opacity={0.35}
            blur={2}
            scale={10}
            far={4}
          />

          {/* Interactive rotation controls */}
          <OrbitControls
            enableZoom={false}
            enablePan={false}
            enableRotate={true}
            makeDefault
          />
        </Suspense>

        {/* Post-processing outside Suspense for immediate rendering */}
        <PostProcessing />
      </Canvas>
    </div>
  );
}
