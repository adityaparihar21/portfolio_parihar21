"use client";

import { useRef, useState, useMemo, useEffect } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useVideoTexture, Html, Stars, Sparkles, MeshTransmissionMaterial, RoundedBox, Float } from "@react-three/drei";
import { EffectComposer, Bloom } from "@react-three/postprocessing";
import { useScroll, useSpring } from "framer-motion";
import * as THREE from "three";

const SPACING_Z = 15;

function getPosition(i: number): [number, number, number] {
  const x = i % 2 === 0 ? -4.5 : 4.5;
  const y = i % 2 === 0 ? 1.5 : -1.5;
  return [x, y, -(i * SPACING_Z)];
}

function FloatingGeometry() {
  return (
    <group>
      {Array.from({ length: 30 }).map((_, i) => (
        <Float 
          key={i} 
          speed={0.5 + Math.random()} 
          rotationIntensity={2} 
          floatIntensity={2} 
          position={[
            (Math.random() - 0.5) * 50,
            (Math.random() - 0.5) * 30,
            (Math.random() - 1) * 100 // Distribute deep into Z
          ]}
        >
          <mesh>
            <icosahedronGeometry args={[Math.random() * 2 + 0.5]} />
            <meshStandardMaterial wireframe color="#444" transparent opacity={0.15} />
          </mesh>
        </Float>
      ))}
    </group>
  );
}

function VideoPanel({ project, position, onClick, isClicked, hideUI, cameraDist }: any) {
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

  const targetScale = isClicked ? 1.05 : hovered ? 1.08 : 1;
  const scaleRef = useRef(1);

  useFrame(() => {
    scaleRef.current = THREE.MathUtils.lerp(scaleRef.current, targetScale, 0.1);
  });

  const w = 5;
  const h = w / aspect;
  
  const lightColor = useMemo(() => {
    const colors = ["#e8744a", "#4a8ee8", "#e84a9a", "#4ae8c4", "#e8d84a"];
    return colors[Math.floor(Math.random() * colors.length)];
  }, []);

  const isClose = cameraDist < 25;

  return (
    <group position={position} scale={[scaleRef.current, scaleRef.current, scaleRef.current]}>
      
      <pointLight color={lightColor} intensity={hovered || isClicked ? 3 : 0.8} distance={20} />

      <mesh
        onClick={(e) => {
          e.stopPropagation();
          onClick();
        }}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
        cursor={isClicked ? "auto" : "pointer"}
      >
        <RoundedBox args={[w + 0.3, h + 0.3, 0.15]} radius={0.05} position={[0, 0, -0.1]}>
          <MeshTransmissionMaterial 
            backdropBlur={10} 
            roughness={0.2} 
            transmission={1} 
            thickness={0.5} 
            color="#ffffff"
          />
        </RoundedBox>

        <planeGeometry args={[w, h]} />
        <meshBasicMaterial map={texture} toneMapped={true} />
      </mesh>

      <Html
        position={isClicked ? [w / 2 + 1, 0, 0.5] : [0, -(h / 2 + 0.8), 0.2]}
        center
        transform
        className={`pointer-events-none transition-all duration-700 ${hideUI || !isClose ? "opacity-0 scale-95" : "opacity-100 scale-100"}`}
      >
        <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-6 flex flex-col w-[320px] shadow-[0_10px_40px_rgba(0,0,0,0.5)]">
          <div className="flex justify-between items-center opacity-60 text-white font-mono text-[9px] uppercase tracking-widest mb-2">
            <span>TARGET: {project.category}</span>
            <div className="w-1.5 h-1.5 rounded-full shadow-[0_0_10px_currentColor]" style={{ backgroundColor: lightColor, color: lightColor }} />
          </div>
          <h3 className="text-white text-3xl font-serif tracking-wide">{project.title}</h3>
          
          <div className={`mt-4 pt-4 border-t border-white/10 flex gap-4 transition-all duration-500 delay-100 ${hovered || isClicked ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"}`}>
             <div className="flex flex-col">
               <span className="text-white/40 text-[8px] uppercase tracking-widest font-mono">Status</span>
               <span className="text-white/80 text-xs font-mono mt-1">Active</span>
             </div>
             <div className="flex flex-col">
               <span className="text-white/40 text-[8px] uppercase tracking-widest font-mono">Distance</span>
               <span className="text-white/80 text-xs font-mono mt-1">{cameraDist.toFixed(1)}u</span>
             </div>
          </div>
        </div>
      </Html>
    </group>
  );
}

function Scene({ projects, smoothScroll, clickedIdx, setClickedIdx }: any) {
  const { camera } = useThree();
  const dummy = useMemo(() => new THREE.Vector3(), []);
  const [dists, setDists] = useState<number[]>([]);

  useMemo(() => {
    camera.position.set(0, 0, 15);
  }, [camera]);

  useFrame(({ clock }) => {
    const currentScroll = smoothScroll.get();
    let targetZ = 25;

    if (clickedIdx !== null) {
      const [px, py, pz] = getPosition(clickedIdx);
      const isRight = px > 0;
      dummy.set(isRight ? px - 1.5 : px + 1.5, py, pz + 5.5);
      camera.position.lerp(dummy, 0.05);
      camera.lookAt(px, py, pz);
    } else {
      const maxZ = -(projects.length * SPACING_Z) + SPACING_Z;
      targetZ = 25 + (maxZ - 25) * currentScroll;

      if (currentScroll > 0.95) {
        const finale = (currentScroll - 0.95) / 0.05;
        dummy.set(0, finale * 15, targetZ + finale * 40);
        camera.position.lerp(dummy, 0.08);
        const targetRotX = -Math.PI / 8;
        camera.rotation.x = THREE.MathUtils.lerp(camera.rotation.x, targetRotX, 0.08);
      } else {
        const bobX = Math.sin(clock.elapsedTime * 0.4) * 0.8;
        const bobY = Math.cos(clock.elapsedTime * 0.3) * 0.6;
        dummy.set(bobX, bobY, targetZ);
        camera.position.lerp(dummy, 0.08);
        camera.rotation.x = THREE.MathUtils.lerp(camera.rotation.x, 0, 0.1);
        const lookDummy = new THREE.Vector3(Math.sin(clock.elapsedTime * 0.2) * 2, 0, targetZ - 20);
        camera.lookAt(lookDummy);
      }
    }

    const newDists = projects.map((_: any, i: number) => {
      const [px, py, pz] = getPosition(i);
      return camera.position.distanceTo(new THREE.Vector3(px, py, pz));
    });
    setDists(newDists);
  });

  return (
    <>
      <ambientLight intensity={0.1} />
      <fogExp2 attach="fog" args={["#050505", 0.025]} />
      <FloatingGeometry />
      <Stars radius={100} depth={50} count={3000} factor={4} saturation={0} fade speed={1} />
      <Sparkles count={400} scale={50} size={2} speed={0.2} opacity={0.3} color="#ffffff" />
      {projects.map((p: any, i: number) => (
        <VideoPanel
          key={p.id}
          project={p}
          position={getPosition(i)}
          onClick={() => setClickedIdx(i)}
          isClicked={clickedIdx === i}
          hideUI={clickedIdx !== null && clickedIdx !== i}
          cameraDist={dists[i] || 100}
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

  const smoothScroll = useSpring(scrollYProgress, {
    damping: 20,
    mass: 1.5,
    stiffness: 40,
  });

  const [clickedIdx, setClickedIdx] = useState<number | null>(null);

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

  const audioCtxRef = useRef<any>(null);
  const gainNodeRef = useRef<any>(null);

  useEffect(() => {
    const initAudio = () => {
      if (audioCtxRef.current) return;
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = "sine";
      osc.frequency.value = 45;
      
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
      if (audioCtxRef.current) audioCtxRef.current.close();
    };
  }, []);

  useEffect(() => {
    if (gainNodeRef.current && audioCtxRef.current) {
      if (clickedIdx !== null) {
        gainNodeRef.current.gain.setTargetAtTime(0, audioCtxRef.current.currentTime, 0.3);
      } else {
        gainNodeRef.current.gain.setTargetAtTime(0.2, audioCtxRef.current.currentTime, 1.0);
      }
    }
  }, [clickedIdx]);

  return (
    <section
      ref={containerRef}
      className="relative w-full bg-[#050505]"
      style={{ height: `${projects.length * 150}vh` }}
    >
      <div className="sticky top-0 h-screen w-full overflow-hidden">
        <div className="pointer-events-none absolute inset-0 z-10 shadow-[inset_0_0_200px_rgba(0,0,0,1)]" />
        <Canvas camera={{ fov: 60, position: [0, 0, 15] }} gl={{ antialias: true, alpha: false }}>
          <color attach="background" args={["#050505"]} />
          <Scene
            projects={projects}
            smoothScroll={smoothScroll}
            clickedIdx={clickedIdx}
            setClickedIdx={setClickedIdx}
          />
          <EffectComposer>
            <Bloom luminanceThreshold={0.5} luminanceSmoothing={0.9} intensity={0.8} />
          </EffectComposer>
        </Canvas>
      </div>
    </section>
  );
}
