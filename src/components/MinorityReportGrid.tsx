"use client";

import { useRef, useState, useMemo } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useVideoTexture, Html } from "@react-three/drei";
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

function VideoPanel({ project, position, onClick, isClicked }: any) {
  // useVideoTexture handles playing the video automatically.
  // Using muted/playsInline is crucial for autoplay policies.
  const texture = useVideoTexture(project.image);
  const [hovered, setHovered] = useState(false);

  // When hovered or clicked, scale up slightly
  const targetScale = isClicked ? 1.1 : hovered ? 1.05 : 1;
  const scaleRef = useRef(1);

  useFrame(() => {
    scaleRef.current = THREE.MathUtils.lerp(scaleRef.current, targetScale, 0.1);
  });

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
        <planeGeometry args={[4.8, 2.7]} />
        <meshBasicMaterial map={texture} toneMapped={false} />
      </mesh>

      {/* Sci-Fi crosshair frame */}
      <mesh position={[0, 0, 0.01]}>
        <ringGeometry args={[3, 3.02, 64]} />
        <meshBasicMaterial color={isClicked || hovered ? "#e8744a" : "#444"} transparent opacity={0.6} />
      </mesh>

      {/* HUD Info Box */}
      <Html
        position={[0, -1.8, 0]}
        center
        transform
        className={`pointer-events-none transition-opacity duration-300 ${isClicked ? "opacity-0" : "opacity-90"}`}
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
      // Offset camera slightly back (Z + 3) to frame the panel
      dummy.set(px, py, pz + 3.2);
      camera.position.lerp(dummy, 0.08);
    } else {
      // Scroll-driven Z-axis flythrough
      const maxZ = -(projects.length * SPACING_Z) + SPACING_Z;
      // When scroll is 0, start slightly before the first video (Z = 5)
      // When scroll is 1, reach the last video
      const currentScroll = scrollYProgress.get();
      const targetZ = 5 + (maxZ - 5) * currentScroll;

      dummy.set(0, 0, targetZ);
      camera.position.lerp(dummy, 0.1);
    }
  });

  return (
    <>
      <ambientLight intensity={0.5} />
      
      {/* Floor and Ceiling Grids to enhance speed perception */}
      <gridHelper args={[200, 100, "#e8744a", "#222"]} position={[0, -4, 0]} />
      <gridHelper args={[200, 100, "#e8744a", "#222"]} position={[0, 4, 0]} />

      {projects.map((p: any, i: number) => (
        <VideoPanel
          key={p.id}
          project={p}
          position={getPosition(i)}
          onClick={() => setClickedIdx(i)}
          isClicked={clickedIdx === i}
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

  return (
    <section
      ref={containerRef}
      className="relative w-full bg-[#050505]"
      style={{ height: `${projects.length * 150}vh` }}
    >
      <div className="sticky top-0 h-screen w-full overflow-hidden cursor-crosshair">
        
        {/* 2D Overlay UI elements */}
        <div className="pointer-events-none absolute inset-0 z-10 shadow-[inset_0_0_150px_rgba(0,0,0,0.9)]" />
        
        {clickedIdx !== null && (
          <div className="absolute top-8 right-8 z-50 animate-in fade-in zoom-in duration-300">
            <button
              onClick={() => setClickedIdx(null)}
              className="flex items-center gap-2 px-6 py-3 border border-[#e8744a] text-[#e8744a] bg-black/80 backdrop-blur-md font-mono text-xs tracking-[0.2em] uppercase hover:bg-[#e8744a] hover:text-black transition-all cursor-pointer shadow-[0_0_20px_rgba(232,116,74,0.3)]"
            >
              <X size={14} strokeWidth={2} /> Abort Target
            </button>
          </div>
        )}

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
        </Canvas>
      </div>
    </section>
  );
}
