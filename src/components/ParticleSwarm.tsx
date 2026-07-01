import { useRef, useMemo, useEffect, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { motion, AnimatePresence } from "framer-motion";

function SwarmGeometry({ progress, isForming }: { progress: number; isForming: boolean }) {
  const count = 3000;
  const pointsRef = useRef<THREE.Points>(null);
  const { viewport, mouse } = useThree();

  const { positions, targets, velocities } = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const targets = new Float32Array(count * 3);
    const velocities = new Float32Array(count * 3);

    const addLine = (x1: number, y1: number, x2: number, y2: number, pointCount: number, offset: number) => {
      for (let i = 0; i < pointCount; i++) {
        const t = Math.random();
        const idx = (offset + i) * 3;
        targets[idx] = THREE.MathUtils.lerp(x1, x2, t) + (Math.random() - 0.5) * 0.15;
        targets[idx + 1] = THREE.MathUtils.lerp(y1, y2, t) + (Math.random() - 0.5) * 0.15;
        targets[idx + 2] = (Math.random() - 0.5) * 0.2;
      }
    };

    const addCurve = (cx: number, cy: number, r: number, startAngle: number, endAngle: number, pointCount: number, offset: number) => {
      for (let i = 0; i < pointCount; i++) {
        const t = Math.random();
        const angle = THREE.MathUtils.lerp(startAngle, endAngle, t);
        const idx = (offset + i) * 3;
        targets[idx] = cx + Math.cos(angle) * r + (Math.random() - 0.5) * 0.15;
        targets[idx + 1] = cy + Math.sin(angle) * r + (Math.random() - 0.5) * 0.15;
        targets[idx + 2] = (Math.random() - 0.5) * 0.2;
      }
    };

    // A (1500 points)
    addLine(-1.5, 1.5, -2.5, -1.5, 600, 0); // Left leg
    addLine(-1.5, 1.5, -0.5, -1.5, 600, 600); // Right leg
    addLine(-2.0, -0.2, -1.0, -0.2, 300, 1200); // Crossbar

    // P (1500 points)
    addLine(0.8, 1.5, 0.8, -1.5, 700, 1500); // Stem
    addCurve(0.8, 0.4, 1.1, -Math.PI / 2, Math.PI / 2, 800, 2200); // Loop

    // Initialize random positions
    for (let i = 0; i < count; i++) {
      const x = (Math.random() - 0.5) * 30;
      const y = (Math.random() - 0.5) * 30;
      const z = (Math.random() - 0.5) * 30;
      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;

      velocities[i * 3] = 0;
      velocities[i * 3 + 1] = 0;
      velocities[i * 3 + 2] = 0;
    }

    return { positions, targets, velocities };
  }, [count]);

  const targetScale = 1.2;

  useFrame((state, delta) => {
    if (!pointsRef.current) return;
    const geometry = pointsRef.current.geometry;
    const posAttribute = geometry.attributes.position;
    
    // Mouse world position mapped to viewport
    const mouseX = (mouse.x * viewport.width) / 2;
    const mouseY = (mouse.y * viewport.height) / 2;

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      let px = positions[i3];
      let py = positions[i3 + 1];
      let pz = positions[i3 + 2];

      if (isForming) {
        // Form the AP monogram
        const tx = targets[i3] * targetScale;
        const ty = targets[i3 + 1] * targetScale;
        const tz = targets[i3 + 2] * targetScale;

        // Smoothly lerp towards target (speed increases as it finishes)
        const speed = 2.0 + (progress * 8); 
        positions[i3] = THREE.MathUtils.lerp(px, tx, delta * speed);
        positions[i3 + 1] = THREE.MathUtils.lerp(py, ty, delta * speed);
        positions[i3 + 2] = THREE.MathUtils.lerp(pz, tz, delta * speed);
      } else {
        // Swarm behavior around mouse
        const dx = mouseX - px;
        const dy = mouseY - py;
        const dz = 0 - pz;
        const distSq = dx * dx + dy * dy + dz * dz;
        
        // Attraction force
        const pull = Math.min(100 / (distSq + 1), 5.0); 
        
        // Swirl force (cross product)
        const swirlX = -dy * 1.5;
        const swirlY = dx * 1.5;
        
        // Update velocity
        velocities[i3] += (dx * pull + swirlX) * delta;
        velocities[i3 + 1] += (dy * pull + swirlY) * delta;
        velocities[i3 + 2] += (dz * pull) * delta;
        
        // Friction / drag
        velocities[i3] *= 0.90;
        velocities[i3 + 1] *= 0.90;
        velocities[i3 + 2] *= 0.90;
        
        // Apply velocity
        positions[i3] += velocities[i3] * delta;
        positions[i3 + 1] += velocities[i3 + 1] * delta;
        positions[i3 + 2] += velocities[i3 + 2] * delta;
      }
    }

    posAttribute.needsUpdate = true;
    
    // Gentle rotation of the entire particle cloud
    if (isForming) {
      pointsRef.current.rotation.y = THREE.MathUtils.lerp(pointsRef.current.rotation.y, 0, delta * 3);
      pointsRef.current.rotation.x = THREE.MathUtils.lerp(pointsRef.current.rotation.x, 0, delta * 3);
    } else {
      pointsRef.current.rotation.y += delta * 0.1;
      pointsRef.current.rotation.x += delta * 0.05;
    }
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial 
        size={0.06} 
        color="#D2AF6E" 
        transparent 
        opacity={0.8} 
        blending={THREE.AdditiveBlending}
        sizeAttenuation={true}
        depthWrite={false}
      />
    </points>
  );
}

export function ParticleSwarm({ onComplete }: { onComplete: () => void }) {
  const [progress, setProgress] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  
  useEffect(() => {
    // Simulate loading progress over 3.5 seconds
    const duration = 3500;
    const startTime = performance.now();
    
    let raf: number;
    const tick = (time: number) => {
      const elapsed = time - startTime;
      const p = Math.min(elapsed / duration, 1);
      setProgress(p);
      
      if (p < 1) {
        raf = requestAnimationFrame(tick);
      } else {
        // Once formed, hold the AP shape for 1.2 seconds before fading out
        setTimeout(() => {
          setIsVisible(false);
          // Tell parent to show main preloader after fade animation completes
          setTimeout(() => onComplete(), 1000);
        }, 1200);
      }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [onComplete]);

  // isForming triggers the magnetism when progress crosses 65%
  const isForming = progress > 0.65;
  const displayPercent = Math.floor((progress > 0.65 ? 1 : progress / 0.65) * 100);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.0, ease: "easeInOut" }}
          className="fixed inset-0 z-[200] bg-[#050505] flex flex-col items-center justify-center pointer-events-auto"
        >
          <Canvas camera={{ position: [0, 0, 10], fov: 45 }}>
            <SwarmGeometry progress={progress} isForming={isForming} />
          </Canvas>
          
          {/* Loading HUD */}
          <div className="absolute bottom-12 md:bottom-24 flex flex-col items-center gap-3">
            <div className="font-serif text-[#D2AF6E] tracking-[0.4em] uppercase text-[10px] md:text-xs italic opacity-80">
              Neural WebGL Engine
            </div>
            <div className="font-mono text-white/50 tracking-widest text-[9px] md:text-[10px] uppercase">
              {isForming ? "SYSTEM READY" : `INITIALIZING [ ${displayPercent}% ]`}
            </div>
            {/* Sleek loading bar */}
            <div className="w-32 md:w-48 h-[1px] bg-white/10 mt-2 relative overflow-hidden">
              <div 
                className="absolute top-0 left-0 bottom-0 bg-[#D2AF6E] transition-all duration-75 ease-linear"
                style={{ width: `${displayPercent}%` }}
              />
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
