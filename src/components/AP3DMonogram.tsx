import { useRef, useMemo, useState, Suspense, useEffect } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Text3D, Center, Environment, OrbitControls, ContactShadows } from "@react-three/drei";
import { EffectComposer, ToneMapping, Vignette, SMAA } from "@react-three/postprocessing";
import { ToneMappingMode } from "postprocessing";
import * as THREE from "three";

/* ── Procedural PBR Texture Generator ── */
function useGoldTextures() {
  return useMemo(() => {
    const size = 512;

    // ── Normal Map: micro-scratches & surface grain ──
    const normalCanvas = document.createElement("canvas");
    normalCanvas.width = size;
    normalCanvas.height = size;
    const nCtx = normalCanvas.getContext("2d")!;
    // Base neutral normal (128,128,255)
    nCtx.fillStyle = "rgb(128,128,255)";
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
    const roughCanvas = document.createElement("canvas");
    roughCanvas.width = size;
    roughCanvas.height = size;
    const rCtx = roughCanvas.getContext("2d")!;
    // Base roughness (medium gray)
    rCtx.fillStyle = "rgb(90,90,90)";
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
      grad.addColorStop(0, "rgb(160,160,160)");
      grad.addColorStop(1, "rgba(90,90,90,0)");
      rCtx.fillStyle = grad;
      rCtx.fillRect(x - r, y - r, r * 2, r * 2);
    }

    rCtx.globalAlpha = 1;
    const roughnessMap = new THREE.CanvasTexture(roughCanvas);
    roughnessMap.wrapS = roughnessMap.wrapT = THREE.RepeatWrapping;

    // ── Ambient Occlusion Map: dirt in recessed areas ──
    const aoCanvas = document.createElement("canvas");
    aoCanvas.width = size;
    aoCanvas.height = size;
    const aCtx = aoCanvas.getContext("2d")!;
    // Mostly white (fully lit), dark at edges (recessed areas)
    aCtx.fillStyle = "rgb(255,255,255)";
    aCtx.fillRect(0, 0, size, size);

    // Subtle vignette for edge darkening
    const aoGrad = aCtx.createRadialGradient(
      size / 2,
      size / 2,
      size * 0.2,
      size / 2,
      size / 2,
      size * 0.5,
    );
    aoGrad.addColorStop(0, "rgba(255,255,255,0)");
    aoGrad.addColorStop(0.7, "rgba(0,0,0,0)");
    aoGrad.addColorStop(1, "rgba(0,0,0,0.2)");
    aCtx.fillStyle = aoGrad;
    aCtx.fillRect(0, 0, size, size);

    // Small dark pits (patina / age marks)
    aCtx.globalAlpha = 0.06;
    for (let i = 0; i < 40; i++) {
      const x = Math.random() * size;
      const y = Math.random() * size;
      const r = Math.random() * 15 + 3;
      aCtx.fillStyle = "rgb(0,0,0)";
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

// Removed ChainRing and ChainCage completely

/* ── Antique Gold "AP" Minted Coin with PBR Textures ── */
function APCoin({
  isMini,
  hovered,
  themeMode = "select",
  hoverMode = "none",
}: {
  isMini: boolean;
  hovered: boolean;
  themeMode?: string;
  hoverMode?: string;
}) {
  const coinRef = useRef<THREE.Group>(null);
  const { normalMap, roughnessMap, aoMap } = useGoldTextures();

  // Entrance animation state
  const entranceRef = useRef({ elapsed: 0, done: false });
  const isMobile = typeof window !== "undefined" && window.innerWidth < 768;
  // Make target scale slightly larger in full-screen preloader (0.20 desktop / 0.15 mobile) for cinematic effect
  const TARGET_SCALE = isMini ? 0.55 : isMobile ? 0.15 : 0.2;

  useFrame((state, delta) => {
    if (!coinRef.current) return;
    // prefers-reduced-motion check
    const prefersReducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (themeMode === "select") {
      // Choice screen logic: hover scale is based on TARGET_SCALE
      const targetScale = TARGET_SCALE * (hovered ? 1.05 : 1);
      coinRef.current.scale.setScalar(
        THREE.MathUtils.lerp(coinRef.current.scale.x, targetScale, delta * 5),
      );

      // Do not auto-rotate if user prefers reduced motion
      if (!prefersReducedMotion) {
        coinRef.current.rotation.y += delta * 0.3;
      }
    } else if (!isMini) {
      // Entrance animation
      if (entranceRef.current.elapsed < 1.5) {
        const t = entranceRef.current.elapsed / 1.5;
        const easeOutQuint = 1 - Math.pow(1 - t, 5);
        const currentScale = THREE.MathUtils.lerp(0.01, TARGET_SCALE, easeOutQuint);
        coinRef.current.scale.set(currentScale, currentScale, currentScale);
      } else {
        coinRef.current.scale.set(TARGET_SCALE, TARGET_SCALE, TARGET_SCALE);
      }

      // Rotation ramp up
      if (!prefersReducedMotion) {
        entranceRef.current.elapsed += delta;
        const rotRamp = Math.min(entranceRef.current.elapsed / 1.5, 1);
        const rotSpeed = rotRamp * (2 - rotRamp) * 0.6;
        coinRef.current.rotation.y += delta * rotSpeed;
      } else {
        coinRef.current.rotation.y = 0;
      }
    } else {
      // Navbar state
      coinRef.current.scale.set(TARGET_SCALE, TARGET_SCALE, TARGET_SCALE);
      if (!prefersReducedMotion) {
        const rotSpeed = hovered ? 3.2 : 0.45;
        coinRef.current.rotation.y += delta * rotSpeed;
      }
    }
  });

  // ── Coin body: warm, deep antique gold ──
  const coinBodyProps = {
    color: "#B8912D", // Deep warm gold — aged, rich
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

  // Determine dynamic rim color based on hover/theme
  const activeMode = hoverMode !== "none" ? hoverMode : themeMode;
  let dynamicRimColor = "#D4A840"; // Default gold
  if (activeMode === "creative") dynamicRimColor = "#d2af64"; // Creative gold
  if (hoverMode !== "none") {
    // Emphasize rim brightness on hover
    dynamicRimColor = "#ebd496";
  }

  // ── Rim: slightly brighter, polished gold (worn edges catch more light) ──
  const coinRimProps = {
    ...coinBodyProps,
    color: dynamicRimColor,
    roughness: 0.25, // Smoother — rims get polished from handling
    clearcoat: 0.2,
    envMapIntensity: 3.0,
  };

  // ── Text: brightest gold, freshly minted look ──
  const coinTextProps = {
    ...coinBodyProps,
    color: "#DDB94E", // Bright warm gold on stamped lettering
    roughness: 0.3,
    clearcoat: 0.18,
    envMapIntensity: 3.2,
  };

  return (
    <group scale={[TARGET_SCALE, TARGET_SCALE, TARGET_SCALE]} ref={coinRef}>
      {" "}
      {/* Centered perfectly at origin */}
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
function CinematicLights({ isMini, hoverMode = "none" }: { isMini: boolean; hoverMode?: string }) {
  const sweepLightRef = useRef<THREE.DirectionalLight>(null);

  useFrame((state) => {
    if (sweepLightRef.current && !isMini) {
      // Sweep light X position over the first 2.5 seconds
      const elapsed = state.clock.getElapsedTime();
      const x = -8 + Math.min(elapsed / 2.5, 1) * 16;
      sweepLightRef.current.position.x = x;
    }
  });

  // Dynamic lights color and intensities based on hoverMode
  const lightColor =
    hoverMode === "engineering" || hoverMode === "creative"
      ? "#ffbe5b"
      : "#ffdf95"; // Warm/deep gold vs default gold

  const ambientIntensity = isMini ? 0.28 : 0.08;
  const keyIntensity = isMini ? 4.5 : 3;

  return (
    <>
      <ambientLight intensity={ambientIntensity} />

      {/* Sweep light for golden reflection pass */}
      {!isMini && (
        <directionalLight
          ref={sweepLightRef}
          position={[-8, 3, 4]}
          intensity={8}
          color={lightColor}
        />
      )}

      {/* Key light with shadow casting */}
      <directionalLight
        position={[4, 4, 3]}
        intensity={keyIntensity}
        color={lightColor}
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
      <pointLight
        position={[-3, 1, 3]}
        intensity={isMini ? 12 : 8}
        color="#ffffff"
      />

      {/* Golden rim light from below */}
      <pointLight
        position={[2, -4, 2]}
        intensity={isMini ? 12 : 8}
        color="#ffcc66"
      />

      {/* Subtle top accent */}
      <pointLight
        position={[0, 4, 0]}
        intensity={isMini ? 6 : 4}
        color="#ffeebb"
      />
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

/* ── Camera Handler for dynamic sweeps and zooms ── */
function CameraHandler({
  themeMode,
  isMini,
}: {
  themeMode: "select" | "creative" | "engineering";
  isMini: boolean;
}) {
  const { camera } = useThree();
  const targetPos = useRef(new THREE.Vector3(0, 0, 4));

  useEffect(() => {
    if (isMini) {
      targetPos.current.set(0, 0, 4);
    } else if (themeMode === "select") {
      targetPos.current.set(0, 0, 4);
    }
  }, [themeMode, isMini]);

  useFrame((state, delta) => {
    if (isMini) {
      camera.position.lerp(targetPos.current, delta * 5.0);
      camera.lookAt(0, 0, 0);
      return;
    }

    if (themeMode === "creative") {
      // Cinematic camera sweep: orbit slowly around Y axis
      const time = state.clock.getElapsedTime();
      const xVal = Math.sin(time * 0.4) * 0.8;
      const yVal = Math.cos(time * 0.4) * 0.3;
      camera.position.x = THREE.MathUtils.lerp(camera.position.x, xVal, delta * 2.0);
      camera.position.y = THREE.MathUtils.lerp(camera.position.y, yVal, delta * 2.0);
      camera.position.z = THREE.MathUtils.lerp(camera.position.z, 4.2, delta * 2.0);
      camera.lookAt(0.28, 0, 0);
    } else if (themeMode === "engineering") {
      // Zoom into core
      camera.position.z = THREE.MathUtils.lerp(camera.position.z, 0.6, delta * 3.5);
      camera.position.x = THREE.MathUtils.lerp(camera.position.x, 0.28, delta * 3.5);
      camera.position.y = THREE.MathUtils.lerp(camera.position.y, 0, delta * 3.5);
      camera.lookAt(0.28, 0, 0);
    } else {
      // Choice selection screen - perfectly centered, OrbitControls handles the rest.
      // We do NOT lerp the camera position here because OrbitControls needs full control
      // over the camera's position to allow user drag rotation without rubber-banding!
    }
  });

  return null;
}

/* ── Main exported component ── */
export default function AP3DMonogram({
  className = "",
  isMini = false,
  themeMode = "select",
  hoverMode = "none",
}: {
  className?: string;
  isMini?: boolean;
  themeMode?: "select" | "creative" | "engineering";
  hoverMode?: "none" | "creative" | "engineering";
}) {
  const [hovered, setHovered] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div
      className={`w-full h-full cursor-grab active:cursor-grabbing ${className}`}
      onMouseEnter={() => isMini && setHovered(true)}
      onMouseLeave={() => isMini && setHovered(false)}
    >
      <Canvas
        camera={{ position: [0, 0, 4], fov: 35 }}
        gl={{ antialias: false, alpha: true, toneMapping: THREE.NoToneMapping }}
        shadows={!isMini}
        style={{ background: "transparent" }}
        dpr={typeof window !== "undefined" ? Math.min(window.devicePixelRatio, 2) : 1}
      >
        <Suspense fallback={null}>
          <CameraHandler themeMode={themeMode} isMini={isMini} />

          <CinematicLights isMini={isMini} hoverMode={hoverMode} />

          {/* Studio HDRI for strong, clean gold reflections */}
          <Environment files="/studio_small_03_1k.hdr" />

          {/* Visually center the 3D focal point (counteracting layout shift in full-screen) */}
          <group position={isMini || themeMode === "select" ? [0, 0, 0] : [0.28, 0, 0]}>
            <APCoin isMini={isMini} hovered={hovered} hoverMode={hoverMode} themeMode={themeMode} />
          </group>

          {/* Contact shadow grounds the coin inside preloader (disable in navbar) */}
          {!isMini && (
            <ContactShadows
              position={themeMode === "select" ? [0, -1.3, 0] : [0.28, -1.3, 0]}
              opacity={0.35}
              blur={2}
              scale={10}
              far={4}
            />
          )}

          {/* Interactive rotation controls */}
          <OrbitControls
            enableZoom={false}
            enablePan={false}
            enableRotate={true}
            autoRotate={themeMode === "select"}
            autoRotateSpeed={2.5}
            target={isMini || themeMode === "select" ? [0, 0, 0] : [0.28, 0, 0]}
            makeDefault
          />
        </Suspense>

        {/* Post-processing outside Suspense for immediate rendering */}
        <PostProcessing />
      </Canvas>
    </div>
  );
}
