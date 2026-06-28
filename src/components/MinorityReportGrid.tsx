"use client";

import { useRef, useState, useMemo, useEffect } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Html, Stars, Sparkles, MeshTransmissionMaterial, RoundedBox, Float } from "@react-three/drei";
import { EffectComposer, Bloom, DepthOfField } from "@react-three/postprocessing";
import { useScroll, useSpring, motion, useTransform } from "framer-motion";
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
        float alpha = smoothstep(0.5, 0.1, dist) * 0.2; 
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



function useSafeVideoTexture(src: string) {
  const [texture, setTexture] = useState<THREE.VideoTexture | null>(null);
  const [videoElement, setVideoElement] = useState<HTMLVideoElement | null>(null);

  useEffect(() => {
    const video = document.createElement("video");
    // Use absolute positioning with 0 opacity instead of display: none.
    // Safari aggressively halts video processing for display: none elements, 
    // which results in completely black WebGL textures.
    video.style.position = "absolute";
    video.style.opacity = "0";
    video.style.width = "1px";
    video.style.height = "1px";
    video.style.pointerEvents = "none";
    document.body.appendChild(video);

    // Encode spaces in filenames
    video.src = encodeURI(src);
    video.crossOrigin = ""; // Allow local without strict CORS block
    video.loop = true;
    video.muted = true;
    video.playsInline = true;
    video.setAttribute("playsinline", "true");
    video.setAttribute("webkit-playsinline", "true");

    let tex: THREE.VideoTexture | null = null;

    const initTexture = () => {
      if (!tex) {
        tex = new THREE.VideoTexture(video);
        tex.colorSpace = THREE.SRGBColorSpace;
        setTexture(tex);
      }
      video.play().catch((e) => console.warn("Video play failed:", e));
    };

    video.addEventListener("loadedmetadata", () => {
      // Force a frame decode so it acts as a poster
      if (video.duration > 0.1) video.currentTime = 0.1;
      // Try to silently play and pause to force a WebGL frame buffer update
      video.play().then(() => video.pause()).catch(() => {});
    });

    video.addEventListener("loadeddata", initTexture);
    video.addEventListener("canplay", initTexture);
    video.addEventListener("playing", initTexture);

    if (video.readyState >= 3) {
      initTexture();
    } else {
      video.load();
    }

    return () => {
      video.removeEventListener("loadeddata", initTexture);
      video.removeEventListener("canplay", initTexture);
      video.removeEventListener("playing", initTexture);
      video.pause();
      video.removeAttribute("src");
      video.load();
      if (document.body.contains(video)) {
        document.body.removeChild(video);
      }
      if (tex) tex.dispose();
    };
  }, [src]);

  return { texture, videoElement };
}

function VideoPanel({ project, position, interactionState, activeIdx, idx, onClick, onExit, cameraDist }: any) {
  const { texture, videoElement } = useSafeVideoTexture(project.image);
  const [hovered, setHovered] = useState(false);
  const aspect = 16 / 9; // Enforce 16:9 for all panels to prevent UI overlap

  useEffect(() => {
    if (texture && texture.image) {
      const updateTextureFit = () => {
        const vid = texture.image as HTMLVideoElement;
        if (vid.videoWidth && vid.videoHeight) {
          const vidAspect = vid.videoWidth / vid.videoHeight;
          const planeAspect = 16 / 9;
          
          // Implement "object-fit: contain" via UV mapping
          if (vidAspect > planeAspect) {
             // video is wider than plane (letterbox top/bottom)
             texture.repeat.set(1, planeAspect / vidAspect);
             texture.offset.set(0, (1 - texture.repeat.y) / 2);
          } else {
             // video is taller than plane (pillarbox left/right)
             texture.repeat.set(vidAspect / planeAspect, 1);
             texture.offset.set((1 - texture.repeat.x) / 2, 0);
          }
        }
      };
      updateTextureFit();
      const interval = setInterval(updateTextureFit, 500);
      texture.image.addEventListener("loadedmetadata", updateTextureFit);
      return () => {
        clearInterval(interval);
        texture.image.removeEventListener("loadedmetadata", updateTextureFit);
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
          if (!isClicked) onClick(videoElement);
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
          <meshBasicMaterial map={texture} toneMapped={true} color="#ffffff" />
        ) : (
          <meshBasicMaterial color="#000000" />
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
          position={[0, -(h / 2 + 1.2), 0.2]}
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
              <h3 className="text-white text-2xl font-serif leading-tight tracking-tight drop-shadow-2xl mb-3">
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
            position={[0, -(h / 2) - 1.4, 0.5]}
            center
            transform
            scale={0.9}
            className={`transition-all duration-1000 delay-700 ease-[cubic-bezier(0.16,1,0.3,1)] ${isInside ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
          >
            <button
              onClick={() => onExit(videoElement)}
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

    if (interactionState === "IDLE") {
      camera.position.lerp(baseCameraPos, 0.3);
      
      // DRONE INERTIA: Tilt forward when accelerating (negative velocity), backward when braking
      let tiltX = velocityZ.current * 0.06;
      tiltX = THREE.MathUtils.clamp(tiltX, -Math.PI / 6, Math.PI / 6);

      if (currentScroll > 0.95) {
        camera.rotation.x = THREE.MathUtils.lerp(camera.rotation.x, -Math.PI / 8, 0.08);
      } else {
        camera.rotation.x = THREE.MathUtils.lerp(camera.rotation.x, tiltX, 0.1);
        const lookDummy = new THREE.Vector3(Math.sin(clock.elapsedTime * 0.2) * 2, 0, targetZ - 20);
        camera.lookAt(lookDummy);
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
      
      // Keep the camera centered on the project, but push it back significantly 
      // so the 80% screen constraint is maintained and HTML doesn't clip the near plane.
      const targetPos = new THREE.Vector3(px, py, pz + 13);
      
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
      <ambientLight intensity={interactionState === "INSIDE" ? 0.01 : 0.05} className="transition-all duration-1000" />
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
          onClick={(videoElement: HTMLVideoElement | null) => {
            if (interactionState !== "IDLE") return;
            setActiveIdx(i);
            
            if (videoElement) {
              videoElement.muted = false;
              videoElement.currentTime = 0;
              videoElement.play().catch(e => console.warn(e));
            }
            
            setInteractionState("LOCKING");
            setTimeout(() => setInteractionState("ENTERING"), 300);
          }}
          onExit={(videoElement: HTMLVideoElement | null) => {
            if (videoElement) {
              videoElement.muted = true;
            }
            setInteractionState("EXITING");
          }}
          cameraDist={dists[i] || 100}
        />
      ))}

      <EffectComposer disableNormalPass>
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
