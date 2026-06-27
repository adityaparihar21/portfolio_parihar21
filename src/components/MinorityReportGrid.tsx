"use client";

import { useRef, useState, useMemo, useEffect } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useVideoTexture, Html, Stars, Sparkles } from "@react-three/drei";
import { EffectComposer, Bloom } from "@react-three/postprocessing";
import { useScroll } from "framer-motion";
import * as THREE from "three";
import { X } from "lucide-react";

const SPACING_Z = 15;

function getPosition(i: number): [number, number, number] {
  // Stagger left and right, up and down
  const x = i % 2 === 0 ? -3.5 : 3.5;
  const y = i % 2 === 0 ? 1 : -1;
  return [x, y, -(i * SPACING_Z)];
}

function VideoPanel({ project, position, onClick, isClicked, hideUI }: any) {
  // useVideoTexture handles playing the video automatically.
  // Using muted/playsInline is crucial for autoplay policies.
  const texture = useVideoTexture(project.image);
  const [hovered, setHovered] = useState(false);
  const [aspect, setAspect] = useState(16 / 9);

  useEffect(() => {
    if (texture && texture.image) {
      const updateAspect = () => {
        if (texture.image.videoWidth && texture.image.videoHeight) {
          setAspect(texture.image.videoWidth / texture.image.videoHeight);
        }
      };
      updateAspect();
      texture.image.addEventListener("loadedmetadata", updateAspect);
      return () => texture.image.removeEventListener("loadedmetadata", updateAspect);
    }
  }, [texture]);

  // When hovered or clicked, scale up slightly
  const targetScale = isClicked ? 1.02 : hovered ? 1.05 : 1;
  const scaleRef = useRef(1);

  useFrame(() => {
    scaleRef.current = THREE.MathUtils.lerp(scaleRef.current, targetScale, 0.1);
  });

  const w = 4.8;
  const h = w / aspect;

  return (
    <group position={position} scale={[scaleRef.current, scaleRef.current, scaleRef.current]}>
      <mesh
        onClick={(e) => {
          e.stopPropagation();
          onClick();
        }}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
        cursor={isClicked ? "auto" : "pointer"}
      >
        <planeGeometry args={[w, h]} />
        <meshBasicMaterial map={texture} toneMapped={true} />
      </mesh>

      {/* HUD Info Box */}
      <Html
        position={[0, -(h / 2 + 0.4), 0]}
        center
        transform
        className={`pointer-events-none transition-opacity duration-300 ${hideUI ? "opacity-0" : "opacity-90"}`}
      >
        <div className="flex flex-col items-center gap-1 w-[300px] text-center">
          <span className="font-mono text-[10px] tracking-[0.3em] text-[#c9a876] uppercase">
            TARGET: {project.category}
          </span>
          <h3 className="font-serif text-2xl text-white font-bold tracking-widest uppercase">
            {project.title}
          </h3>
          <div className="w-full h-[1px] bg-white/20 mt-2 relative">
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-[#e8744a]" />
          </div>
        </div>
      </Html>
    </group>
  );
}

function Scene({ projects, scrollYProgress, clickedIdx, setClickedIdx }: any) {
  const { camera } = useThree();
  const dummy = useMemo(() => new THREE.Vector3(), []);

  // Set initial camera position so it doesn't snap abruptly
  useMemo(() => {
    camera.position.set(0, 0, 8);
  }, [camera]);

  useFrame(() => {
    if (clickedIdx !== null) {
      // Look closely at the clicked panel
      const [px, py, pz] = getPosition(clickedIdx);
      // Offset camera slightly back (Z + 6) to leave room for background
      dummy.set(px, py, pz + 6);
      camera.position.lerp(dummy, 0.08);
    } else {
      // Scroll-driven Z-axis flythrough
      const maxZ = -(projects.length * SPACING_Z) + SPACING_Z;
      // Start much further back (Z = 25)
      const currentScroll = scrollYProgress.get();
      const targetZ = 25 + (maxZ - 25) * currentScroll;

      dummy.set(0, 0, targetZ);
      camera.position.lerp(dummy, 0.1);
    }
  });

  return (
    <>
      <ambientLight intensity={0.5} />
      
      {/* Deep Space Background */}
      <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
      <Sparkles count={300} scale={30} size={2} speed={0.4} opacity={0.2} color="#c9a876" />

      {projects.map((p: any, i: number) => (
        <VideoPanel
          key={p.id}
          project={p}
          position={getPosition(i)}
          onClick={() => setClickedIdx(i)}
          isClicked={clickedIdx === i}
          hideUI={clickedIdx !== null}
        />
      ))}
    </>
  );
}

export default function MinorityReportGrid({ projects }: { projects: any[] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  const [clickedIdx, setClickedIdx] = useState<number | null>(null);

  // Automatically break focus if the user scrolls
  useEffect(() => {
    if (clickedIdx === null) return;
    const handleScroll = () => {
      setClickedIdx(null);
    };
    window.addEventListener("wheel", handleScroll, { once: true });
    window.addEventListener("touchmove", handleScroll, { once: true });
    return () => {
      window.removeEventListener("wheel", handleScroll);
      window.removeEventListener("touchmove", handleScroll);
    };
  }, [clickedIdx]);

  // Space Audio Engine
  const audioCtxRef = useRef<any>(null);
  const gainNodeRef = useRef<any>(null);

  useEffect(() => {
    const initAudio = () => {
      if (audioCtxRef.current) return;
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = "sine";
      osc.frequency.value = 55; // Deep hum frequency
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      gain.gain.value = 0;
      osc.start();

      audioCtxRef.current = ctx;
      gainNodeRef.current = gain;
    };

    window.addEventListener("pointerdown", initAudio, { once: true });
    window.addEventListener("wheel", initAudio, { once: true });

    return () => {
      if (audioCtxRef.current) {
        audioCtxRef.current.close();
      }
    };
  }, []);

  useEffect(() => {
    if (gainNodeRef.current && audioCtxRef.current) {
      if (clickedIdx !== null) {
        // Mute when video is clicked
        gainNodeRef.current.gain.setTargetAtTime(0, audioCtxRef.current.currentTime, 0.1);
      } else {
        // Play deep hum when scrolling
        gainNodeRef.current.gain.setTargetAtTime(0.2, audioCtxRef.current.currentTime, 0.5);
      }
    }
  }, [clickedIdx]);

  return (
    <section
      ref={containerRef}
      className="relative w-full bg-[#050505]"
      style={{ height: `${projects.length * 150}vh` }}
    >
      <div className="sticky top-0 h-screen w-full overflow-hidden cursor-crosshair">
        
        {/* 2D Overlay UI elements */}
        <div className="pointer-events-none absolute inset-0 z-10 shadow-[inset_0_0_150px_rgba(0,0,0,0.9)]" />

        {/* The 3D Engine */}
        <Canvas camera={{ fov: 60, position: [0, 0, 8] }} gl={{ antialias: true, alpha: false }}>
          <color attach="background" args={["#050505"]} />
          {/* Fog hides the panels popping in at a distance */}
          <fog attach="fog" args={["#050505", 10, 45]} />
          
          <Scene
            projects={projects}
            scrollYProgress={scrollYProgress}
            clickedIdx={clickedIdx}
            setClickedIdx={setClickedIdx}
          />

          <EffectComposer>
            <Bloom luminanceThreshold={0.5} luminanceSmoothing={0.9} intensity={0.5} />
          </EffectComposer>
        </Canvas>
      </div>
    </section>
  );
}
