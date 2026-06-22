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
  
  // We need to store card refs so we can animate them individually
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

  // We sample evenly from the dome gallery array so we get a good mix
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

    // Filter out any null refs
    const cardElements = cardsRef.current.filter(Boolean);
    if (cardElements.length === 0) return;

    // 1. Set initial Phase 1 (Strip) positions for all cards
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

    // Hide text and hero initially
    gsap.set(textBlockRef.current, { autoAlpha: 0, y: 10 });
    gsap.set(heroWrapperRef.current, { autoAlpha: 0, y: 24 });

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: containerRef.current,
        start: "top top",
        end: "+=250%", // Tweak for scroll duration length
        pin: true,
        scrub: 1.2,
      },
    });

    // --- Phase 1 -> 2: Morph strip to radial (0 -> 0.55) ---
    // All cards move simultaneously to their ring positions
    cardElements.forEach((card, i) => {
      const l = layout[i];
      if (!l) return;
      tl.to(
        card,
        {
          x: l.radialX,
          y: l.radialY,
          rotation: l.radialRot,
          ease: "power2.inOut",
        },
        0 // start exactly at 0
      );
    });

    // Tagline fades in as the ring forms (0.25 -> 0.55)
    tl.to(
      textBlockRef.current,
      { autoAlpha: 1, y: 0, ease: "none" },
      0.25
    );

    // --- Phase 2 -> 3: Ring rotates (0.55 -> 0.8) ---
    tl.to(
      ringRef.current,
      { rotation: -70, ease: "none" },
      0.55
    );

    // Tagline shrinks/fades (0.72 -> 0.85)
    tl.to(
      textBlockRef.current,
      { autoAlpha: 0, y: -15, ease: "none" },
      0.72
    );

    // --- Intro dissolves and Hero crossfades in (0.82 -> 0.95) ---
    tl.to(
      introRef.current,
      { autoAlpha: 0, ease: "none" },
      0.82
    );

    tl.to(
      heroWrapperRef.current,
      { autoAlpha: 1, y: 0, ease: "none" },
      0.82
    );

  }, { dependencies: [isReady, prefersReducedMotion, layout], scope: containerRef });

  if (prefersReducedMotion) {
    return (
      <div className="relative w-full">
        {/* Simple static fallback for reduced motion */}
        <div className="w-full bg-black py-32 flex flex-col items-center justify-center text-center">
          <h1 className="font-serif text-3xl md:text-5xl text-white/90 mb-4">{PRIMARY_TAGLINE}</h1>
          <p className="font-serif text-lg md:text-xl text-white/50">A visual exploration</p>
        </div>
        {children}
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative w-full h-screen bg-black">
      {/* Intro Sequence Layer */}
      <div
        ref={introRef}
        className="absolute inset-0 z-10 w-full h-full overflow-hidden flex flex-col items-center justify-center bg-black"
      >
        {/* Animated Wrapper for overall Ring Rotation */}
        <div ref={ringRef} className="absolute inset-0 origin-center will-change-transform">
          {isReady &&
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

        {/* Center Text Block (Typography size strictly constrained per prompt to avoid overlap) */}
        <div 
          ref={textBlockRef} 
          className="relative z-20 flex flex-col items-center justify-center pointer-events-none drop-shadow-[0_4px_16px_rgba(0,0,0,0.8)] max-w-[80vw]"
        >
          <h2 className="font-serif text-[clamp(1.6rem,3.2vw,2.8rem)] text-white font-light tracking-wide text-center leading-tight">
            {PRIMARY_TAGLINE}
          </h2>
          <span className="mt-[12px] text-[clamp(0.55rem,1vw,0.75rem)] uppercase tracking-[0.2em] font-mono text-white/50">
            Scroll to explore
          </span>
        </div>

        {/* Outer Vignette to soften edges of the ring */}
        <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,transparent_30%,rgba(0,0,0,0.6)_80%,rgba(0,0,0,0.95)_100%)] z-10" />
      </div>

      {/* Hero Content Layer (Handoff Target) */}
      <div ref={heroWrapperRef} className="relative z-0 w-full h-full">
        {children}
      </div>
    </div>
  );
}
