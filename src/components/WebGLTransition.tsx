import { useEffect, useRef, useState, useImperativeHandle, forwardRef } from 'react';
import * as THREE from 'three';
import gsap from 'gsap';

const vertexShader = `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const fragmentShader = `
uniform sampler2D texBase;
uniform sampler2D texDisp1;
uniform sampler2D texDisp2;
uniform float uDispFactor;
uniform float uAlpha;
uniform float uTime;

varying vec2 vUv;

void main() {
  // Sample displacement textures
  vec2 disp1 = texture2D(texDisp1, vUv + vec2(uTime * 0.05, uTime * 0.02)).rg;
  vec2 disp2 = texture2D(texDisp2, vUv - vec2(uTime * 0.03, uTime * 0.04)).rg;
  
  // Combine displacement, scale to [-1, 1] range
  vec2 disp = (disp1 + disp2) - 1.0;
  
  // Apply displacement factor and scale down magnitude
  vec2 distortedUv = vUv + disp * uDispFactor * 0.15;
  
  // Ensure we don't sample outside bounds aggressively
  distortedUv = clamp(distortedUv, 0.0, 1.0);

  // Sample the base texture with distorted UVs
  vec4 color = texture2D(texBase, distortedUv);
  
  // Fade out to transparent using uAlpha
  gl_FragColor = vec4(color.rgb, color.a * uAlpha);
}
`;

export interface WebGLTransitionRef {
  startTransition: () => Promise<void>;
}

export const WebGLTransition = forwardRef<WebGLTransitionRef>((props, ref) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const materialRef = useRef<THREE.ShaderMaterial | null>(null);

  useImperativeHandle(ref, () => ({
    startTransition: () => {
      return new Promise<void>((resolve) => {
        if (!materialRef.current) {
          resolve();
          return;
        }

        const tl = gsap.timeline({
          onComplete: resolve
        });

        // 1. Ramp up the displacement distortion
        tl.to(materialRef.current.uniforms.uDispFactor, {
          value: 1.0,
          duration: 2.0,
          ease: 'power2.inOut'
        }, 0);

        // 2. Crossfade alpha towards the end of the distortion
        tl.to(materialRef.current.uniforms.uAlpha, {
          value: 0.0,
          duration: 1.2,
          ease: 'power1.inOut'
        }, 1.2);
      });
    }
  }));

  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(
      window.innerWidth / -2, window.innerWidth / 2,
      window.innerHeight / 2, window.innerHeight / -2,
      1, 1000
    );
    camera.position.z = 10;

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    const textureLoader = new THREE.TextureLoader();
    const texBase = textureLoader.load('/sunset_bg.png');
    const texDisp1 = textureLoader.load('/noise1.png');
    const texDisp2 = textureLoader.load('/noise2.png');

    // Optional wrapping for seamless displacement
    texDisp1.wrapS = texDisp1.wrapT = THREE.RepeatWrapping;
    texDisp2.wrapS = texDisp2.wrapT = THREE.RepeatWrapping;

    const geometry = new THREE.PlaneGeometry(window.innerWidth, window.innerHeight);
    
    const material = new THREE.ShaderMaterial({
      uniforms: {
        texBase: { value: texBase },
        texDisp1: { value: texDisp1 },
        texDisp2: { value: texDisp2 },
        uDispFactor: { value: 0.0 },
        uAlpha: { value: 1.0 },
        uTime: { value: 0.0 }
      },
      vertexShader,
      fragmentShader,
      transparent: true,
      depthTest: false,
    });
    
    materialRef.current = material;

    const plane = new THREE.Mesh(geometry, material);
    scene.add(plane);

    let animationFrameId: number;
    const clock = new THREE.Clock();

    const animate = () => {
      material.uniforms.uTime.value = clock.getElapsedTime();
      renderer.render(scene, camera);
      animationFrameId = requestAnimationFrame(animate);
    };
    animate();

    const handleResize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      
      // Update camera view bounds
      camera.left = width / -2;
      camera.right = width / 2;
      camera.top = height / 2;
      camera.bottom = height / -2;
      camera.updateProjectionMatrix();

      // Update plane size
      plane.geometry.dispose();
      plane.geometry = new THREE.PlaneGeometry(width, height);

      renderer.setSize(width, height);
    };
    
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      geometry.dispose();
      material.dispose();
      renderer.dispose();
    };
  }, []);

  return (
    <div 
      ref={containerRef} 
      className="absolute inset-0 z-0 pointer-events-none" 
      style={{ overflow: 'hidden' }}
    />
  );
});

WebGLTransition.displayName = 'WebGLTransition';
