"use client";

import React, { useRef, useState, useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { domeGalleryImages } from "@/lib/domeGalleryImages";
import { useIntroLayout } from "./useIntroLayout";
import { RadialCard } from "./RadialCard";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger, useGSAP);
}

const PRIMARY_TAGLINE = "Built on craft & curiosity";

export function RadialIntroSequence({ children }: { children: React.ReactNode }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const introRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const textBlockRef = useRef<HTMLDivElement>(null);
  const heroWrapperRef = useRef<HTMLDivElement>(null);

  const cardsRef = useRef<(HTMLDivElement | null)[]>([]);

  const [isMobile, setIsMobile] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setIsMobile(window.innerWidth < 768);
      setPrefersReducedMotion(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
    }
  }, []);

  const cardCount = isMobile ? 16 : 24;
  const { layout, isReady } = useIntroLayout(cardCount);

  const selectedImages = React.useMemo(() => {
    if (!domeGalleryImages || domeGalleryImages.length === 0) return [];
    const step = Math.max(1, Math.floor(domeGalleryImages.length / cardCount));
    const imgs = [];
    for (let i = 0; i < cardCount; i++) {
      imgs.push(domeGalleryImages[(i * step) % domeGalleryImages.length]);
    }
    return imgs;
  }, [cardCount]);

  useGSAP(() => {
    if (prefersReducedMotion || !isReady || !containerRef.current) return;

    const cardElements = cardsRef.current.filter(Boolean);
    if (cardElements.length === 0) return;

    // 1. Initial State: Horizontal Strip
    cardElements.forEach((card, i) => {
      const l = layout[i];
      if (!l) return;
      gsap.set(card, {
        xPercent: -50,
        yPercent: -50,
        x: l.stripX,
        y: l.stripY,
        rotation: l.stripRot,
        scale: l.scale,
      });
    });

    // Set initial states
    gsap.set(textBlockRef.current, { autoAlpha: 0, y: 10 });
    gsap.set(heroWrapperRef.current, { autoAlpha: 0, y: 24 });
    gsap.set(ringRef.current, { rotation: 0 });
    gsap.set(introRef.current, { autoAlpha: 1 });

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: containerRef.current,
        start: "top top",
        end: "+=220%",
        pin: true,
        scrub: 1.2,
      },
    });

    // Phase 1 → 2: morph strip to radial (timeline positions 0 → 0.55)
    tl.to(cardElements, {
      x: (i) => layout[i].radialX,
      y: (i) => layout[i].radialY,
      rotation: (i) => layout[i].radialRot,
      ease: "power2.inOut",
      stagger: 0,
    }, 0);

    // Tagline fades in as ring forms (0.25 → 0.55)
    tl.fromTo(textBlockRef.current,
      { autoAlpha: 0, y: 10 },
      { autoAlpha: 1, y: 0, ease: "none" },
      0.25
    );

    // Phase 2 → 3: ring rotates (0.55 → 0.8)
    tl.to(ringRef.current, { rotation: -70, ease: "none" }, 0.55);

    // Tagline shrinks/fades (0.72 → 0.85)
    tl.to(textBlockRef.current, { autoAlpha: 0, y: -15, ease: "none" }, 0.72);

    // Intro dissolves (0.82 → 0.95)
    tl.to(introRef.current, { autoAlpha: 0, ease: "none" }, 0.82);

    // Hero section crossfades in (overlaps with intro's exit — same position 0.82)
    tl.fromTo(heroWrapperRef.current,
      { autoAlpha: 0, y: 24 },
      { autoAlpha: 1, y: 0, ease: "none" },
      0.82
    );

  }, { dependencies: [isReady, prefersReducedMotion, layout], scope: containerRef });

  if (prefersReducedMotion) {
    return (
      <div className="relative w-full">
        <div className="w-full bg-[#080808] py-32 flex flex-col items-center justify-center text-center">
          <h1 className="font-serif text-3xl md:text-5xl text-white/90 mb-4">{PRIMARY_TAGLINE}</h1>
        </div>
        {children}
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative w-full h-screen bg-[#080808]">
      
      {/* Film Grain Overlay */}
      <div 
        className="absolute inset-0 z-50 pointer-events-none opacity-[0.08]" 
        style={{ 
          backgroundImage: "url('https://upload.wikimedia.org/wikipedia/commons/7/76/1k_Dissolve_Noise_Texture.png')",
          backgroundSize: "200px 200px",
          mixBlendMode: "overlay"
        }} 
      />

      {/* Hero Content Layer (Underneath the Intro, so it can fade in) */}
      <div ref={heroWrapperRef} className="absolute inset-0 z-0 w-full h-full pointer-events-auto">
        {children}
      </div>

      {/* Intro Sequence Layer */}
      <div
        ref={introRef}
        className="absolute inset-0 z-10 w-full h-full overflow-hidden flex flex-col items-center justify-center pointer-events-none"
      >
        {/* Animated Wrapper for Cards */}
        <div ref={ringRef} className="absolute inset-0 origin-center will-change-transform z-3">
          {isReady && layout.length === cardCount &&
            selectedImages.map((src, i) => (
              <RadialCard
                key={i}
                ref={(el) => {
                  cardsRef.current[i] = el;
                }}
                src={src}
                layout={layout[i]}
                priority={i < 6}
              />
            ))}
        </div>

        {/* Center Text Block */}
        <div 
          ref={textBlockRef} 
          className="relative z-20 flex flex-col items-center justify-center pointer-events-none drop-shadow-[0_4px_16px_rgba(0,0,0,0.8)] max-w-[80vw]"
        >
          <h2 className="font-serif text-[clamp(1.6rem,3.2vw,2.8rem)] text-[#F5ECD7] font-light tracking-wide text-center leading-tight">
            {PRIMARY_TAGLINE}
          </h2>
          <span className="text-[clamp(0.55rem,1vw,0.75rem)] tracking-[0.2em] uppercase opacity-50 mt-[12px] text-white font-mono">
            Scroll to explore
          </span>
        </div>
      </div>
    </div>
  );
}
