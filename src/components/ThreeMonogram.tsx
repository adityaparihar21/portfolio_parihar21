import { useEffect, useRef } from "react";
import * as THREE from "three";
import gsap from "gsap";

export function ThreeMonogram() {
  const containerRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    
    // --- 1. Setup Scene, Camera, and Renderer ---
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x0d1b2a, 0.015);

    const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 0, 5);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    
    // Clear container and append
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // --- 2. Lighting ---
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xfff5e6, 1.5);
    directionalLight.position.set(5, 5, 4);
    scene.add(directionalLight);

    // --- 3. Create the Monogram Placeholder ---
    // (In production, replace this simple geometry with your exported GLTF/OBJ model)
    const geometry = new THREE.BoxGeometry(2, 2, 0.2); 
    const material = new THREE.MeshStandardMaterial({ 
        color: 0xf5f5f7,
        roughness: 0.2,
        metalness: 0.8
    });
    const monogram = new THREE.Mesh(geometry, material);
    scene.add(monogram);

    // --- 4. Cinematic Transition ---
    const playCinematicTransition = () => {
        // Reset position high up
        monogram.position.set(0, 15, -5);
        monogram.rotation.set(0, 0, 0);
        
        if (audioRef.current) {
            audioRef.current.currentTime = 0;
            audioRef.current.play().catch(e => console.log("Audio play prevented:", e));
        }

        const tl = gsap.timeline();

        // 1. The Fall & Rotation
        tl.to(monogram.position, {
            y: 0,
            z: 0,
            duration: 1.8,
            ease: "power4.inOut"
        }, 0);

        tl.to(monogram.rotation, {
            x: Math.PI * 4,
            y: Math.PI * 2,
            duration: 1.8,
            ease: "power3.out"
        }, 0);

        // 2. Camera Shake / Motion Blur
        tl.to(camera, {
            fov: 75,
            duration: 0.4,
            ease: "power2.in",
            onUpdate: () => camera.updateProjectionMatrix()
        }, 0.2);

        tl.to(camera, {
            fov: 60,
            duration: 0.8,
            ease: "elastic.out(1, 0.7)",
            onUpdate: () => camera.updateProjectionMatrix()
        }, 0.6);
    };

    // Auto-play the transition when component mounts
    playCinematicTransition();

    // --- 5. Render Loop ---
    let reqId: number;
    const animate = () => {
        reqId = requestAnimationFrame(animate);
        
        // Gentle float
        if (Math.abs(monogram.position.y) < 0.01) {
            monogram.rotation.y += 0.005;
        }

        renderer.render(scene, camera);
    };
    animate();

    // Handle Resize
    const handleResize = () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', handleResize);

    return () => {
        cancelAnimationFrame(reqId);
        window.removeEventListener('resize', handleResize);
        if (container.contains(renderer.domElement)) {
            container.removeChild(renderer.domElement);
        }
        renderer.dispose();
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 pointer-events-none">
      <div ref={containerRef} className="w-full h-full" />
      <audio ref={audioRef} src="https://assets.mixkit.co/active_storage/sfx/2034/2034-84.wav" preload="auto" />
    </div>
  );
}
