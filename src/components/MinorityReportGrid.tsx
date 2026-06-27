"use client";

import { useRef, useState, useMemo, useEffect } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Html, Stars, Sparkles, MeshTransmissionMaterial, RoundedBox, Float } from "@react-three/drei";
import { EffectComposer, Bloom } from "@react-three/postprocessing";
import { useScroll, useSpring } from "framer-motion";
import * as THREE from "three";
import { ArrowRight, Code2, ExternalLink, Github } from "lucide-react";

const SPACING_Z = 15;

function getPosition(i: number): [number, number, number] {
  const x = i % 2 === 0 ? -4.5 : 4.5;
  const y = i % 2 === 0 ? 1.5 : -1.5;
  return [x, y, -(i * SPACING_Z)];
}

function FloatingGeometry({ interactionState }: { interactionState: string }) {
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
            (Math.random() - 1) * 100
          ]}
        >
          <mesh>
            <icosahedronGeometry args={[Math.random() * 2 + 0.5]} />
            <meshStandardMaterial 
              wireframe 
              color="#444" 
              transparent 
              opacity={interactionState === "INSIDE" ? 0.02 : 0.15} 
            />
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
    video.loop = true;
    video.muted = true;
    video.playsInline = true;
    video.setAttribute("playsinline", "true");
    video.setAttribute("webkit-playsinline", "true");

    let tex: THREE.VideoTexture | null = null;

    const onCanPlay = () => {
      if (!tex) {
        tex = new THREE.VideoTexture(video);
        tex.colorSpace = THREE.SRGBColorSpace;
        setTexture(tex);
      }
      video.play().catch((e) => console.warn("Video play failed", e));
    };

    video.addEventListener("loadeddata", onCanPlay);
    video.addEventListener("canplay", onCanPlay);

    if (video.readyState >= 2) {
      onCanPlay();
    }

    return () => {
      video.removeEventListener("loadeddata", onCanPlay);
      video.removeEventListener("canplay", onCanPlay);
      video.pause();
      video.removeAttribute("src");
      video.load();
      if (tex) tex.dispose();
    };
  }, [src]);

  return texture;
}

function VideoPanel({ project, position, interactionState, activeIdx, idx, onClick, onExit, cameraDist }: any) {
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
      const interval = setInterval(updateAspect, 500);
      texture.image.addEventListener("loadedmetadata", updateAspect);
      return () => {
        clearInterval(interval);
        texture.image.removeEventListener("loadedmetadata", updateAspect);
      };
    }
  }, [texture]);

  const isClicked = activeIdx === idx;
  const isInside = isClicked && interactionState === "INSIDE";
  const isEntering = isClicked && interactionState === "ENTERING";
  const isLocking = isClicked && interactionState === "LOCKING";
  const hideUI = activeIdx !== null && activeIdx !== idx;

  const targetScale = (isInside || isEntering) ? 1.15 : hovered ? 1.05 : 1;
  const scaleRef = useRef(1);

  useFrame(() => {
    scaleRef.current = THREE.MathUtils.lerp(scaleRef.current, targetScale, 0.1);
  });

  const w = 4;
  const h = w / aspect;
  
  const lightColor = useMemo(() => {
    const colors = ["#e8744a", "#4a8ee8", "#e84a9a", "#4ae8c4", "#e8d84a"];
    return colors[Math.floor(Math.random() * colors.length)];
  }, []);

  const isClose = cameraDist < 30;

  return (
    <group position={position} scale={[scaleRef.current, scaleRef.current, scaleRef.current]}>
      
      <pointLight 
        color={lightColor} 
        intensity={isInside ? 5 : hovered ? 3 : 0.8} 
        distance={isInside ? 30 : 20} 
      />

      <mesh
        onClick={(e) => {
          e.stopPropagation();
          if (!isClicked) onClick();
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
          <meshBasicMaterial color="#0a0a0a" />
        )}
      </mesh>

      {/* Sequence 1: Locking Animation */}
      {isLocking && (
        <Html position={[0, 0, 0.5]} center transform>
          <div className="flex flex-col items-center justify-center font-mono text-[10px] text-red-500 tracking-[0.3em] uppercase bg-black/60 px-6 py-3 rounded-full backdrop-blur-md border border-red-500/30">
            <span className="animate-pulse">Project Detected</span>
            <span className="mt-1 opacity-70">Locking...</span>
          </div>
        </Html>
      )}

      {/* Default Unclicked HUD */}
      {!isClicked && (
        <Html
          position={[0, -(h / 2 + 0.6), 0.2]}
          center
          transform
          className={`pointer-events-none transition-all duration-1000 ease-[cubic-bezier(0.16,1,0.3,1)] ${hideUI || !isClose ? "opacity-0 scale-95" : "opacity-100 scale-100"}`}
        >
          <div className="flex flex-col items-center text-center w-[400px]">
            <h3 className="text-2xl text-white/70 font-serif tracking-wide drop-shadow-lg">
              {project.title}
            </h3>
            <span className="text-white/30 text-[9px] font-mono tracking-[0.3em] uppercase mt-2">
              {project.category}
            </span>
          </div>
        </Html>
      )}

      {/* Sequence 5 & 6: The Spatial 'Memory Chamber' Portal HUD */}
      {(isEntering || isInside) && (
        <>
          {/* Left Panel: Story & Details */}
          <Html
            position={[-w / 2 - 1.2, 0, 0.2]}
            center
            transform
            scale={0.8}
            className={`w-[260px] transition-all duration-1000 delay-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${isInside ? "opacity-100 translate-x-0" : "opacity-0 translate-x-8"}`}
          >
            <div className="flex flex-col items-end text-right">
              <div className="flex items-center gap-2 opacity-60 text-white font-mono text-[9px] uppercase tracking-widest mb-2">
                <span>{project.category}</span>
                <div className="w-1.5 h-1.5 rounded-full shadow-[0_0_10px_currentColor]" style={{ backgroundColor: lightColor, color: lightColor }} />
              </div>
              <h3 className="text-white text-4xl font-serif leading-tight tracking-tight drop-shadow-2xl mb-4">
                {project.title}
              </h3>
              <p className="text-white/70 text-xs font-light leading-relaxed">
                {project.description}
              </p>
            </div>
          </Html>

          {/* Right Panel: Tech Stack & Actions */}
          <Html
            position={[w / 2 + 1.2, 0, 0.2]}
            center
            transform
            scale={0.8}
            className={`w-[220px] transition-all duration-1000 delay-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${isInside ? "opacity-100 -translate-x-0" : "opacity-0 -translate-x-8"}`}
          >
            <div className="flex flex-col items-start text-left">
              <div className="mb-6 flex flex-col gap-2">
                <span className="text-white/40 text-[9px] uppercase tracking-widest font-mono">Status</span>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse shadow-[0_0_10px_#22c55e]" />
                  <span className="text-white/90 text-xs font-mono">Immersive Mode</span>
                </div>
              </div>

              {project.href && project.href !== "#" && (
                <a
                  href={project.href}
                  target="_blank"
                  rel="noreferrer"
                  className="group flex items-center gap-3 w-full p-4 mb-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all duration-300 backdrop-blur-md"
                >
                  <ExternalLink className="w-4 h-4 text-white/50 group-hover:text-white" />
                  <span className="text-xs font-mono text-white/70 group-hover:text-white uppercase tracking-wider">Live Site</span>
                </a>
              )}

              {project.repo && project.repo !== "#" && (
                <a
                  href={project.repo}
                  target="_blank"
                  rel="noreferrer"
                  className="group flex items-center gap-3 w-full p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all duration-300 backdrop-blur-md"
                >
                  <Github className="w-4 h-4 text-white/50 group-hover:text-white" />
                  <span className="text-xs font-mono text-white/70 group-hover:text-white uppercase tracking-wider">Source Code</span>
                </a>
              )}
            </div>
          </Html>

          {/* Sequence 10: Continue Journey Button */}
          <Html
            position={[0, -(h / 2) - 0.8, 0.5]}
            center
            transform
            scale={0.9}
            className={`transition-all duration-1000 delay-700 ease-[cubic-bezier(0.16,1,0.3,1)] ${isInside ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
          >
            <button
              onClick={onExit}
              className="group flex items-center gap-3 px-6 py-3 rounded-full bg-[#e8d4a0]/10 border border-[#e8d4a0]/30 hover:bg-[#e8d4a0]/20 hover:border-[#e8d4a0]/60 transition-all duration-500 backdrop-blur-xl"
            >
              <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-[#e8d4a0]">Continue Journey</span>
              <ArrowRight className="w-3.5 h-3.5 text-[#e8d4a0] group-hover:translate-x-1 transition-transform" />
            </button>
          </Html>
        </>
      )}
    </group>
  );
}

function Scene({ projects, smoothScroll, interactionState, activeIdx, setInteractionState, setActiveIdx }: any) {
  const { camera } = useThree();
  const dummy = useMemo(() => new THREE.Vector3(), []);
  const [dists, setDists] = useState<number[]>([]);
  
  const startCameraPos = useRef(new THREE.Vector3());
  const transitionProgress = useRef(0);

  useEffect(() => {
    if (interactionState === "ENTERING") {
      startCameraPos.current.copy(camera.position);
      transitionProgress.current = 0;
    } else if (interactionState === "EXITING") {
      transitionProgress.current = 1;
    }
  }, [interactionState, camera.position]);

  useMemo(() => {
    camera.position.set(0, 0, 45); 
  }, [camera]);

  useFrame(({ clock }) => {
    const currentScroll = smoothScroll.get();
    let targetZ = 45 + (-(projects.length * SPACING_Z) + SPACING_Z - 45) * currentScroll; 

    // Base position (The scrolling rail)
    const baseCameraPos = new THREE.Vector3();
    if (currentScroll > 0.95) {
      const finale = (currentScroll - 0.95) / 0.05;
      baseCameraPos.set(0, finale * 15, targetZ + finale * 40);
    } else {
      const bobX = Math.sin(clock.elapsedTime * 0.4) * 0.8;
      const bobY = Math.cos(clock.elapsedTime * 0.3) * 0.6;
      baseCameraPos.set(bobX, bobY, targetZ);
    }

    if (interactionState === "IDLE") {
      camera.position.lerp(baseCameraPos, 0.3);
      if (currentScroll > 0.95) {
        camera.rotation.x = THREE.MathUtils.lerp(camera.rotation.x, -Math.PI / 8, 0.08);
      } else {
        camera.rotation.x = THREE.MathUtils.lerp(camera.rotation.x, 0, 0.1);
        const lookDummy = new THREE.Vector3(Math.sin(clock.elapsedTime * 0.2) * 2, 0, targetZ - 20);
        camera.lookAt(lookDummy);
      }
    } else if (interactionState === "LOCKING") {
      // Freeze slightly
      camera.position.lerp(baseCameraPos, 0.02);
    } else if (activeIdx !== null) {
      const [px, py, pz] = getPosition(activeIdx);
      
      // Keep the camera centered on the project, but push it back significantly 
      // so the 80% screen constraint is maintained and HTML doesn't clip the near plane.
      const targetPos = new THREE.Vector3(px, py, pz + 13);

      if (interactionState === "ENTERING") {
        transitionProgress.current += 0.012; // Speed of drone flight
        if (transitionProgress.current > 1) {
          transitionProgress.current = 1;
          setInteractionState("INSIDE");
        }
        
        const ease = 1 - Math.pow(1 - transitionProgress.current, 3); // Cubic Out
        
        // Bezier Arc outward (alternating direction based on which side the project is on)
        const curPos = new THREE.Vector3().lerpVectors(startCameraPos.current, targetPos, ease);
        curPos.x += Math.sin(ease * Math.PI) * (px > 0 ? 4 : -4); // Sweeping drone curve
        
        camera.position.copy(curPos);
        camera.lookAt(px, py, pz);
        
      } else if (interactionState === "INSIDE") {
        // Subtle drift in the chamber
        const driftX = Math.sin(clock.elapsedTime * 0.3) * 0.1;
        const driftY = Math.cos(clock.elapsedTime * 0.2) * 0.1;
        dummy.set(targetPos.x + driftX, targetPos.y + driftY, targetPos.z);
        camera.position.lerp(dummy, 0.05);
        camera.lookAt(px, py, pz);
        
      } else if (interactionState === "EXITING") {
        transitionProgress.current -= 0.015;
        if (transitionProgress.current < 0) {
          transitionProgress.current = 0;
          setInteractionState("IDLE");
          setActiveIdx(null);
        }
        
        const ease = 1 - Math.pow(1 - transitionProgress.current, 3);
        
        const curPos = new THREE.Vector3().lerpVectors(baseCameraPos, targetPos, ease);
        curPos.x += Math.sin(ease * Math.PI) * (px > 0 ? 4 : -4);
        
        camera.position.copy(curPos);
        
        // Gently blend lookAt back forward
        const lookTarget = new THREE.Vector3(px, py, pz).lerp(new THREE.Vector3(0, 0, baseCameraPos.z - 20), 1 - ease);
        camera.lookAt(lookTarget);
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
      <ambientLight intensity={interactionState === "INSIDE" ? 0.02 : 0.1} className="transition-all duration-1000" />
      <fogExp2 attach="fog" args={["#050505", interactionState === "INSIDE" ? 0.04 : 0.025]} />
      <FloatingGeometry interactionState={interactionState} />
      <Stars radius={100} depth={50} count={3000} factor={4} saturation={0} fade speed={1} />
      <Sparkles 
        count={interactionState === "INSIDE" ? 800 : 400} 
        scale={interactionState === "INSIDE" ? 30 : 50} 
        size={2} 
        speed={interactionState === "INSIDE" ? 0.8 : 0.2} 
        opacity={0.3} 
        color="#ffffff" 
      />
      {projects.map((p: any, i: number) => (
        <VideoPanel
          key={p.id}
          project={p}
          position={getPosition(i)}
          idx={i}
          activeIdx={activeIdx}
          interactionState={interactionState}
          onClick={() => {
            if (interactionState !== "IDLE") return;
            setActiveIdx(i);
            setInteractionState("LOCKING");
            setTimeout(() => setInteractionState("ENTERING"), 300);
          }}
          onExit={() => setInteractionState("EXITING")}
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
    damping: 12, 
    mass: 1.0,
    stiffness: 60, 
  });

  type InteractionState = "IDLE" | "LOCKING" | "ENTERING" | "INSIDE" | "EXITING";
  const [interactionState, setInteractionState] = useState<InteractionState>("IDLE");
  const [activeIdx, setActiveIdx] = useState<number | null>(null);

  useEffect(() => {
    if (interactionState === "IDLE") return;
    const handleScroll = () => {
      // Prevent user from scrolling out during entrance
      if (interactionState === "INSIDE") {
        setInteractionState("EXITING");
      }
    };
    window.addEventListener("wheel", handleScroll, { once: true });
    window.addEventListener("touchmove", handleScroll, { once: true });
    return () => {
      window.removeEventListener("wheel", handleScroll);
      window.removeEventListener("touchmove", handleScroll);
    };
  }, [interactionState]);

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
            interactionState={interactionState}
            activeIdx={activeIdx}
            setInteractionState={setInteractionState}
            setActiveIdx={setActiveIdx}
          />
          <EffectComposer>
            <Bloom luminanceThreshold={0.5} luminanceSmoothing={0.9} intensity={0.8} />
          </EffectComposer>
        </Canvas>
      </div>
    </section>
  );
}
