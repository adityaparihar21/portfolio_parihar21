"use client";

import { useRef, useState, useMemo, useEffect } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Html, Stars, Sparkles, MeshTransmissionMaterial, RoundedBox, Float } from "@react-three/drei";
import { EffectComposer, Bloom, DepthOfField } from "@react-three/postprocessing";
import { useScroll, useSpring, motion, useTransform } from "framer-motion";
import * as THREE from "three";
import { ArrowRight, Code2, ExternalLink, Github, Volume2, VolumeX } from "lucide-react";

const SPACING_Z = 15;

const positions = [
  [-6, 3], [5, -4], [-4, -2], [7, 4], [-7, 0], [4, 5], [-3, -5], [6, -1]
];

function getPosition(i: number): [number, number, number] {
  const x = positions[i % positions.length][0];
  const y = positions[i % positions.length][1];
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
              opacity={interactionState === "INSIDE" ? 0.01 : 0.1} 
            />
          </mesh>
        </Float>
      ))}
    </group>
  );
}

function NebulaClouds() {
  const count = 12;
  const planes = useMemo(() => {
    return Array.from({ length: count }).map((_, i) => ({
      position: [(Math.random() - 0.5) * 60, (Math.random() - 0.5) * 40, -i * 30 - 20],
      rotation: [0, 0, Math.random() * Math.PI * 2],
      scale: Math.random() * 30 + 30,
      color: Math.random() > 0.5 ? "#2a1542" : "#121a3b",
      speed: (Math.random() - 0.5) * 0.05
    }));
  }, []);

  const groupRef = useRef<THREE.Group>(null);
  
  useFrame(() => {
    if (!groupRef.current) return;
    groupRef.current.children.forEach((child, i) => {
      child.rotation.z += planes[i].speed * 0.01;
    });
  });

  const shaderMaterial = useMemo(() => new THREE.ShaderMaterial({
    uniforms: { color: { value: new THREE.Color() } },
    vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform vec3 color;
      varying vec2 vUv;
      void main() {
        float dist = distance(vUv, vec2(0.5));
        float alpha = smoothstep(0.5, 0.1, dist) * 0.1; 
        gl_FragColor = vec4(color, alpha);
      }
    `,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending
  }), []);

  return (
    <group ref={groupRef}>
      {planes.map((p, i) => {
        const mat = shaderMaterial.clone();
        mat.uniforms.color.value.set(p.color);
        return (
          <mesh key={i} position={p.position as any} rotation={p.rotation as any} scale={p.scale} material={mat}>
            <planeGeometry args={[1, 1]} />
          </mesh>
        );
      })}
    </group>
  );
}



function VideoPanel({ project, position, interactionState, activeIdx, idx, onClick, onExit, cameraDist }: any) {
  const [hovered, setHovered] = useState(false);
  const aspect = 16 / 9; // Enforce 16:9 for all panels to prevent UI overlap
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const isVideo = project.image.toLowerCase().endsWith('.mp4') || project.image.toLowerCase().endsWith('.webm');

  const isClicked = activeIdx === idx;
  const isInside = isClicked && interactionState === "INSIDE";
  const isEntering = isClicked && interactionState === "ENTERING";
  const isLocking = isClicked && interactionState === "LOCKING";
  const hideUI = activeIdx !== null && activeIdx !== idx;

  const [isMuted, setIsMuted] = useState(false);

  useEffect(() => {
    if (videoRef.current && isVideo) {
      if (isInside) {
        videoRef.current.muted = isMuted;
        if (videoRef.current.paused) {
          videoRef.current.play().catch(() => {});
        }
      } else {
        videoRef.current.muted = true;
      }
    }
  }, [isInside, isMuted, isVideo]);

  const targetScale = (isInside || isEntering) ? 1.15 : hovered ? 1.05 : 1;
  const scaleRef = useRef(1);
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    scaleRef.current = THREE.MathUtils.lerp(scaleRef.current, targetScale, 0.1);
    
    if (groupRef.current) {
      if (isInside || isEntering || isLocking || hovered) {
        // Face camera smoothly
        groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, 0, 0.05);
        groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, 0, 0.05);
      } else {
        // Slow orbit (0.2 degrees per second -> ~0.003 rad/sec)
        const time = state.clock.elapsedTime;
        // Seed unique orbital start positions using index
        groupRef.current.rotation.y = Math.sin(time * 0.1 + idx) * 0.3;
        groupRef.current.rotation.x = Math.cos(time * 0.15 + idx) * 0.1;
      }
    }
  });

  const w = 4;
  const h = w / aspect;
  
  const lightColor = useMemo(() => {
    const colors = ["#e8744a", "#4a8ee8", "#e84a9a", "#4ae8c4", "#e8d84a"];
    return colors[Math.floor(Math.random() * colors.length)];
  }, []);

  const isClose = cameraDist < 30;

  return (
    <group position={position} scale={[scaleRef.current, scaleRef.current, scaleRef.current]} ref={groupRef}>
      
      <pointLight 
        color={lightColor} 
        intensity={isInside ? 5 : hovered ? 3 : 0.8} 
        distance={isInside ? 30 : 20} 
      />

      <mesh
        onClick={(e) => {
          e.stopPropagation();
          if (!isClicked) {
            onClick();
          }
        }}
        onPointerOver={() => {
          setHovered(true);
          if (!isClicked) document.body.style.cursor = "pointer";
        }}
        onPointerOut={() => {
          setHovered(false);
          document.body.style.cursor = "auto";
        }}
      >
        {/* Physical Apple Vision Pro-style Titanium Frame */}
        <RoundedBox key={`box-${aspect}`} args={[w + 0.15, h + 0.15, 0.05]} radius={0.02} position={[0, 0, -0.05]}>
          <meshPhysicalMaterial 
            color="#050505"
            metalness={0.9}
            roughness={0.1}
            clearcoat={1.0}
            clearcoatRoughness={0.1}
            transmission={0.4}
            thickness={0.2}
          />
        </RoundedBox>

        {/* Reverted to Html native elements for reliability on iOS/Safari */}
        <Html transform center position={[0, 0, 0.01]} scale={0.01} zIndexRange={[100, 0]} className="opacity-100 transition-opacity duration-1000">
          <div 
            style={{ width: `${w * 100}px`, height: `${h * 100}px` }} 
            className="flex items-center justify-center bg-black overflow-hidden pointer-events-auto"
          >
            {isVideo ? (
              <video
                ref={videoRef}
                src={encodeURI(project.image)}
                loop
                muted
                autoPlay
                playsInline
                preload="auto"
                className="w-full h-full object-cover"
              />
            ) : (
              <img src={encodeURI(project.image)} alt={project.title} className="w-full h-full object-cover" />
            )}
          </div>
        </Html>
      </mesh>

      {/* Sequence 1: Locking Animation */}
      {isLocking && (
        <Html position={[0, 0, 0.5]} center transform>
          <div className="flex flex-col items-center justify-center font-mono text-[10px] text-[#e8d4a0] tracking-[0.3em] uppercase bg-black/60 px-6 py-3 rounded-full backdrop-blur-md border border-[#e8d4a0]/30">
            <span className="animate-pulse">entering the memory...</span>
          </div>
        </Html>
      )}

      {/* Minimal Hover UI */}
      {hovered && !isInside && !isEntering && !isLocking && (
        <Html
          position={[0, -(h / 2 + 0.5), 0.2]}
          center
          transform
          className="pointer-events-none transition-all duration-500 animate-in fade-in slide-in-from-bottom-2"
        >
          <div className="flex flex-col items-center text-center w-[300px]">
            <div className="flex items-center gap-3 px-6 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-md">
              <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-white">Enter Memory</span>
              <ArrowRight className="w-3 h-3 text-white" />
            </div>
          </div>
        </Html>
      )}

      {/* Idle Visible Poster Title */}
      {!isClicked && !hovered && (
        <Html
          position={[0, -(h / 2 + 0.6), 0.2]}
          center
          transform
          className="pointer-events-none opacity-60 transition-opacity duration-1000"
        >
          <div className="flex flex-col items-center text-center w-[400px]">
            <h3 className="text-sm text-white font-serif tracking-wide drop-shadow-lg">
              {project.title}
            </h3>
            <span className="text-white/50 text-[8px] font-mono tracking-[0.3em] uppercase mt-1">
              {project.category}
            </span>
          </div>
        </Html>
      )}

      {/* The Spatial 'Memory Chamber' Portal HUD (Centered Layout) */}
      {(isEntering || isInside) && (
        <>
          {/* Centered Details & Actions */}
          <Html
            position={[0, -(h / 2) - 0.2, 0.2]}
            center
            transform
            scale={0.8}
            className={`w-[500px] flex flex-col items-center text-center transition-all duration-1000 delay-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${isInside ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
          >
            {/* Audio Toggle Button floating near the video edge */}
            <div className="absolute -top-12 right-4">
              <button 
                onClick={(e) => { e.stopPropagation(); setIsMuted(!isMuted); }}
                className="p-2 rounded-full bg-black/40 border border-white/10 hover:bg-white/10 transition-colors backdrop-blur-md text-white"
              >
                {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>
            </div>

            <h3 className="text-white text-3xl font-serif leading-tight tracking-tight drop-shadow-2xl mb-2 mt-6">
              {project.title}
            </h3>
            
            <div className="flex items-center justify-center gap-2 opacity-60 text-white font-mono text-[9px] uppercase tracking-widest mb-6">
              <span>{project.category}</span>
            </div>

            <p className="text-white/70 text-sm font-light leading-relaxed max-w-[400px] mb-8">
              {project.description}
            </p>

            {/* Action Links */}
            <div className="flex items-center gap-4 mb-10">
              {project.href && project.href !== "#" && (
                <a
                  href={project.href}
                  target="_blank"
                  rel="noreferrer"
                  className="group flex items-center gap-3 px-5 py-3 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition-all duration-300 backdrop-blur-md"
                >
                  <ExternalLink className="w-4 h-4 text-white/50 group-hover:text-white" />
                  <span className="text-[10px] font-mono text-white/70 group-hover:text-white uppercase tracking-wider">Live Site</span>
                </a>
              )}

              {project.repo && project.repo !== "#" && (
                <a
                  href={project.repo}
                  target="_blank"
                  rel="noreferrer"
                  className="group flex items-center gap-3 px-5 py-3 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition-all duration-300 backdrop-blur-md"
                >
                  <Github className="w-4 h-4 text-white/50 group-hover:text-white" />
                  <span className="text-[10px] font-mono text-white/70 group-hover:text-white uppercase tracking-wider">Source Code</span>
                </a>
              )}
            </div>

            {/* Back to Journey Button */}
            <button
              onClick={() => onExit()}
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
  const velocityZ = useRef(0);
  const prevZ = useRef(45);
  const dofTarget = useRef(new THREE.Vector3(0, 0, 0));

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

    // Velocity Tracking for Inertia & Warp
    velocityZ.current = targetZ - prevZ.current;
    prevZ.current = targetZ;

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

    // --- SMOOTH CAMERA GLIDE ---
    let desiredX = 0;
    let desiredY = 0;
    let closestProjectIdx = -1;
    let minDistance = Infinity;
    
    for (let i = 0; i < projects.length; i++) {
      const [px, py, pz] = getPosition(i);
      const distZ = Math.abs(pz - targetZ);
      if (distZ < minDistance) {
        minDistance = distZ;
        closestProjectIdx = i;
      }
    }

    if (closestProjectIdx !== -1 && currentScroll <= 0.95 && minDistance < 30) {
      const [px, py] = getPosition(closestProjectIdx);
      // Soft easing curve for attraction
      const factor = Math.max(0, 1 - (minDistance / 30));
      // smoothstep calculation (buttery smooth curve)
      const easeFactor = factor * factor * (3 - 2 * factor);
      
      // We pull slightly towards the project (max 30% of the way)
      desiredX = px * 0.3 * easeFactor;
      desiredY = py * 0.3 * easeFactor;
    }

    if (currentScroll > 0.95) {
      const finale = (currentScroll - 0.95) / 0.05;
      baseCameraPos.set(0, finale * 15, targetZ + finale * 40);
    } else {
      const bobX = Math.sin(clock.elapsedTime * 0.4) * 0.8;
      const bobY = Math.cos(clock.elapsedTime * 0.3) * 0.6;
      baseCameraPos.set(desiredX + bobX, desiredY + bobY, targetZ);
    }

    if (interactionState === "IDLE") {
      camera.position.lerp(baseCameraPos, 0.1); // Slower, more physical lerp
      
      // DRONE INERTIA: Tilt forward when accelerating (negative velocity), backward when braking
      let tiltX = velocityZ.current * 0.06;
      tiltX = THREE.MathUtils.clamp(tiltX, -Math.PI / 6, Math.PI / 6);

      if (currentScroll > 0.95) {
        camera.rotation.x = THREE.MathUtils.lerp(camera.rotation.x, -Math.PI / 8, 0.08);
      } else {
        // --- ASTRONAUT DRIFT ---
        // Sway target points to simulate handheld yaw/pitch
        const swayX = Math.sin(clock.elapsedTime * 0.3) * 2;
        const swayY = Math.cos(clock.elapsedTime * 0.25) * 1.5;
        const lookDummy = new THREE.Vector3(baseCameraPos.x + swayX, baseCameraPos.y + swayY, targetZ - 20);
        camera.lookAt(lookDummy);
        
        // Apply Inertia
        camera.rotateX(tiltX);
        
        // Apply subtle Roll (Z rotation) for floating effect
        const rollZ = Math.sin(clock.elapsedTime * 0.4) * 0.02;
        camera.rotateZ(rollZ);
      }
      
      // Focus on mid-distance during idle
      dofTarget.current.lerp(new THREE.Vector3(0, 0, camera.position.z - 30), 0.05);

    } else if (interactionState === "LOCKING") {
      // Freeze slightly
      camera.position.lerp(baseCameraPos, 0.02);
      
      if (activeIdx !== null) {
        const [px, py, pz] = getPosition(activeIdx);
        dofTarget.current.lerp(new THREE.Vector3(px, py, pz), 0.1);
      }
    } else if (activeIdx !== null) {
      const [px, py, pz] = getPosition(activeIdx);
      
      // Keep the camera centered on the project, but push it back 
      // just enough to frame the video perfectly with room for air.
      const targetPos = new THREE.Vector3(px, py, pz + 12);
      
      // Instantly pull focus to the project
      dofTarget.current.lerp(new THREE.Vector3(px, py, pz), 0.1);

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
      <ambientLight intensity={interactionState === "INSIDE" ? 0.01 : 0.05} />
      <fogExp2 attach="fog" args={["#030305", interactionState === "INSIDE" ? 0.04 : 0.02]} />
      
      <NebulaClouds />
      <FloatingGeometry interactionState={interactionState} />
      <Stars radius={150} depth={80} count={4000} factor={6} saturation={0} fade speed={1.5} />
      
      {/* Background Twinkling Dust / Sparkles */}
      <Sparkles 
        count={interactionState === "INSIDE" ? 1500 : 800} 
        scale={interactionState === "INSIDE" ? 40 : 60} 
        size={2.5} 
        speed={interactionState === "INSIDE" ? 0.6 : 0.3} 
        opacity={0.4} 
        color="#ffffff" 
        noise={0.1}
      />
      <Sparkles 
        count={400} 
        scale={80} 
        size={4} 
        speed={0.1} 
        opacity={0.2} 
        color="#e8d4a0" 
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

      <EffectComposer>
        <DepthOfField 
          target={dofTarget.current} 
          focalLength={0.02} 
          bokehScale={interactionState === "IDLE" ? 2 : 6} 
          height={700} 
        />
        <Bloom luminanceThreshold={0.4} luminanceSmoothing={0.9} intensity={0.6} />
      </EffectComposer>
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

  const fadeOut = useTransform(smoothScroll, [0, 0.05], [1, 0]);
  const scaleDown = useTransform(smoothScroll, [0, 0.05], [1, 0.95]);

  type InteractionState = "IDLE" | "LOCKING" | "ENTERING" | "INSIDE" | "EXITING";
  const [interactionState, setInteractionState] = useState<InteractionState>("IDLE");
  const [activeIdx, setActiveIdx] = useState<number | null>(null);

  // Background Audio Setup
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [audioStarted, setAudioStarted] = useState(false);
  const audioFadeInterval = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    audioRef.current = new Audio("/interstellar.mp3");
    audioRef.current.loop = true;
    audioRef.current.volume = 0; // start at 0 so it fades in cleanly
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, []);

  // Safely unlock audio engine on first trusted interaction anywhere on site
  useEffect(() => {
    if (audioStarted) return;
    const handleFirstInteraction = () => {
      if (audioRef.current) {
        audioRef.current.play().then(() => {
          audioRef.current?.pause();
          setAudioStarted(true);
          window.removeEventListener("pointerdown", handleFirstInteraction);
          window.removeEventListener("keydown", handleFirstInteraction);
        }).catch(() => {});
      }
    };
    window.addEventListener("pointerdown", handleFirstInteraction);
    window.addEventListener("keydown", handleFirstInteraction);
    return () => {
      window.removeEventListener("pointerdown", handleFirstInteraction);
      window.removeEventListener("keydown", handleFirstInteraction);
    };
  }, [audioStarted]);

  // Unified Spatial Audio Manager: Play ONLY if in this specific section AND Idle
  useEffect(() => {
    if (!audioRef.current || !audioStarted) return;

    const updateAudio = () => {
      const v = scrollYProgress.get();
      const inSection = v > 0.001 && v < 0.999;
      const isIdle = interactionState === "IDLE";
      
      if (inSection && isIdle) {
        // Play and fade in
        if (audioRef.current?.paused) {
          audioRef.current.play().catch(() => {});
        }
        if (audioFadeInterval.current) clearInterval(audioFadeInterval.current);
        audioFadeInterval.current = setInterval(() => {
          if (!audioRef.current) return;
          let vol = audioRef.current.volume;
          vol += 0.05;
          if (vol >= 0.3) { vol = 0.3; clearInterval(audioFadeInterval.current!); }
          audioRef.current.volume = vol;
        }, 50);
      } else {
        // Fade out and pause (either exited section, or clicked a video)
        if (!audioRef.current?.paused) {
          if (audioFadeInterval.current) clearInterval(audioFadeInterval.current);
          audioFadeInterval.current = setInterval(() => {
            if (!audioRef.current) return;
            let vol = audioRef.current.volume;
            vol -= 0.05;
            if (vol <= 0) { 
              vol = 0; 
              clearInterval(audioFadeInterval.current!); 
              audioRef.current.pause(); 
            }
            audioRef.current.volume = vol;
          }, 50);
        }
      }
    };

    updateAudio();
    const unsub = scrollYProgress.onChange(updateAudio);
    return () => unsub();
  }, [audioStarted, interactionState, scrollYProgress]);

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
        
        {/* Intro Overlay Frame */}
        <motion.div 
          style={{ opacity: fadeOut, scale: scaleDown }}
          className="absolute inset-0 z-50 pointer-events-none flex flex-col items-center justify-center bg-[#050505]/30 backdrop-blur-[2px]"
        >
          <h1 className="text-white text-[12vw] md:text-[8vw] font-serif tracking-widest drop-shadow-[0_0_30px_rgba(255,255,255,0.2)] ml-[4vw]">
            STAY
          </h1>
          <div className="absolute bottom-16 flex flex-col items-center gap-6">
            <div className="w-[1px] h-16 bg-gradient-to-b from-transparent via-white/50 to-transparent animate-pulse" />
            <span className="font-mono text-[9px] tracking-[0.4em] uppercase text-white/60">
              Scroll to explore
            </span>
          </div>
        </motion.div>

        <div className="pointer-events-none absolute inset-0 z-10 shadow-[inset_0_0_200px_rgba(0,0,0,1)]" />
        <Canvas camera={{ fov: 60, position: [0, 0, 45] }} gl={{ antialias: false, alpha: false, powerPreference: "high-performance" }}>
          <color attach="background" args={["#030305"]} />
          <Scene
            projects={projects}
            smoothScroll={smoothScroll}
            interactionState={interactionState}
            activeIdx={activeIdx}
            setInteractionState={setInteractionState}
            setActiveIdx={setActiveIdx}
          />
        </Canvas>
      </div>
    </section>
  );
}
