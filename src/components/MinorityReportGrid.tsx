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

function useSafeVideoTexture(src: string) {
  const [texture, setTexture] = useState<THREE.VideoTexture | null>(null);

  useEffect(() => {
    const video = document.createElement("video");
    video.src = src;
    video.crossOrigin = "Anonymous";
    video.loop = true;
    video.muted = true;
    video.playsInline = true;
    video.setAttribute("playsinline", "true");
    video.setAttribute("webkit-playsinline", "true");

    video.play().catch((e) => console.warn("Video play failed", e));

    const tex = new THREE.VideoTexture(video);
    tex.colorSpace = THREE.SRGBColorSpace;

    setTexture(tex);

    return () => {
      video.pause();
      video.removeAttribute("src");
      video.load();
      tex.dispose();
    };
  }, [src]);

  return texture;
}

function VideoPanel({ project, position, onClick, isClicked, hideUI, cameraDist }: any) {
  const texture = useSafeVideoTexture(project.image);
  const [hovered, setHovered] = useState(false);
  const [aspect, setAspect] = useState(16 / 9);

  useEffect(() => {
    if (texture && texture.image) {
      const updateAspect = () => {
        const vid = texture.image as HTMLVideoElement;
        if (vid.videoWidth && vid.videoHeight) {
          setAspect(vid.videoWidth / vid.videoHeight);
        }
      };
      updateAspect();
      
      // Video metadata can sometimes load silently in WebGL, polling ensures we catch it
      const interval = setInterval(updateAspect, 500);
      texture.image.addEventListener("loadedmetadata", updateAspect);
      return () => {
        clearInterval(interval);
        texture.image.removeEventListener("loadedmetadata", updateAspect);
      };
    }
  }, [texture]);

  const targetScale = isClicked ? 1.05 : hovered ? 1.08 : 1;
  const scaleRef = useRef(1);

  useFrame(() => {
    scaleRef.current = THREE.MathUtils.lerp(scaleRef.current, targetScale, 0.1);
  });

  const w = 4; // Decreased size
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
        <RoundedBox key={`box-${aspect}`} args={[w + 0.3, h + 0.3, 0.15]} radius={0.05} position={[0, 0, -0.1]}>
          <MeshTransmissionMaterial 
            backdropBlur={10} 
            roughness={0.2} 
            transmission={1} 
            thickness={0.5} 
            color="#ffffff"
          />
        </RoundedBox>

        <planeGeometry key={`plane-${aspect}`} args={[w, h]} />
        {texture ? (
          <meshBasicMaterial map={texture} toneMapped={true} />
        ) : (
          <meshBasicMaterial color="#111" />
        )}
      </mesh>

      <Html
        position={isClicked ? [w / 2 + 1, 0, 0.5] : [0, -(h / 2 + 0.6), 0.2]}
        center
        transform
        className={`pointer-events-none transition-all duration-700 ${hideUI || !isClose ? "opacity-0 scale-95" : "opacity-100 scale-100"}`}
      >
        <div className={`flex flex-col transition-all duration-700 ${isClicked ? 'w-[280px] items-start text-left' : 'w-[400px] items-center text-center'}`}>
          
          <div className={`flex items-center gap-2 opacity-60 text-white font-mono text-[9px] uppercase tracking-widest transition-all duration-700 ${isClicked ? 'mb-2 opacity-100' : 'mb-0 opacity-0 h-0 overflow-hidden'}`}>
            <div className="w-1.5 h-1.5 rounded-full shadow-[0_0_10px_currentColor]" style={{ backgroundColor: lightColor, color: lightColor }} />
            <span>TARGET: {project.category}</span>
          </div>
          
          <h3 className={`text-white font-serif tracking-wide transition-all duration-700 ${isClicked ? 'text-4xl leading-tight drop-shadow-2xl' : 'text-2xl text-white/70 drop-shadow-lg'}`}>
            {project.title}
          </h3>
          
          {!isClicked && (
            <span className="text-white/30 text-[9px] font-mono tracking-[0.3em] uppercase mt-2">
              {project.category}
            </span>
          )}
          
          {isClicked && (
            <div className="mt-6 flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-300 drop-shadow-2xl">
               <div className="flex flex-col">
                 <span className="text-white/40 text-[9px] uppercase tracking-widest font-mono">Status</span>
                 <span className="text-white/80 text-sm font-mono mt-1">Active</span>
               </div>
               <div className="flex flex-col">
                 <span className="text-white/40 text-[9px] uppercase tracking-widest font-mono">Distance</span>
                 <span className="text-white/80 text-sm font-mono mt-1">{cameraDist.toFixed(1)}u</span>
               </div>
            </div>
          )}
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
    camera.position.set(0, 0, 45); // Start very far back
  }, [camera]);

  useFrame(({ clock }) => {
    const currentScroll = smoothScroll.get();
    let targetZ = 25;

    if (clickedIdx !== null) {
      const [px, py, pz] = getPosition(clickedIdx);
      const isRight = px > 0;
      dummy.set(isRight ? px - 1.5 : px + 1.5, py, pz + 7.5); // 7.5 leaves more room for background
      camera.position.lerp(dummy, 0.05);
      camera.lookAt(px, py, pz);
    } else {
      const maxZ = -(projects.length * SPACING_Z) + SPACING_Z;
      targetZ = 45 + (maxZ - 45) * currentScroll; // Start at 45

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

  // Audio SFX removed based on user feedback

  return (
    <section
      ref={containerRef}
      className="relative w-full bg-[#050505]"
      style={{ height: `${projects.length * 150}vh` }}
    >
      <div className="sticky top-0 h-screen w-full overflow-hidden">
        <div className="pointer-events-none absolute inset-0 z-10 shadow-[inset_0_0_200px_rgba(0,0,0,1)]" />
        <Canvas camera={{ fov: 60, position: [0, 0, 45] }} gl={{ antialias: true, alpha: false }}>
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
