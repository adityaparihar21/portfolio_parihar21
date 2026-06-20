"use client";

import React, { useRef, useState, useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { domeGalleryImages } from "@/lib/domeGalleryImages";
import { useRadialLayout } from "./useRadialLayout";
import { RadialCard } from "./RadialCard";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

// "Built on [craft / code / curiosity]" - but we'll use words that fit the cinematic theme
const PRIMARY_TAGLINE = "Built on craft & curiosity";
const SECONDARY_TAGLINE = "A visual exploration";

export function RadialIntroSequence({ children }: { children: React.ReactNode }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const introRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const taglineRef = useRef<HTMLDivElement>(null);
  const subTaglineRef = useRef<HTMLDivElement>(null);
  const heroWrapperRef = useRef<HTMLDivElement>(null);

  const [isMobile, setIsMobile] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setIsMobile(window.innerWidth < 768);
      setPrefersReducedMotion(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
    }
  }, []);

  const cardCount = isMobile ? 14 : 26;
  const layout = useRadialLayout(cardCount);

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

  useEffect(() => {
    if (prefersReducedMotion || layout.length === 0 || !containerRef.current) return;

    const ctx = gsap.context(() => {
      // Setup initial states
      gsap.set(subTaglineRef.current, { opacity: 0, y: 20 });
      gsap.set(heroWrapperRef.current, { autoAlpha: 0, y: 30 });

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: containerRef.current,
          start: "top top",
          end: "+=150%",
          pin: true,
          scrub: 1, // Smooth dampening
        },
      });

      // 1. Rotate the ring continuously through the timeline
      tl.to(
        ringRef.current,
        {
          rotation: -90,
          ease: "none",
        },
        0,
      );

      // 2. Fade out primary tagline and scroll indicator
      tl.to(
        taglineRef.current,
        {
          opacity: 0,
          y: -20,
          ease: "power1.inOut",
        },
        0.15,
      );

      // 3. Fade in secondary tagline
      tl.to(
        subTaglineRef.current,
        {
          opacity: 1,
          y: 0,
          ease: "power1.inOut",
        },
        0.2,
      );

      // 4. Zoom in to the ring and fade it out
      tl.to(
        ringRef.current,
        {
          scale: 1.5,
          opacity: 0,
          ease: "power2.in",
        },
        0.6,
      );

      // 5. Fade out secondary tagline
      tl.to(
        subTaglineRef.current,
        {
          opacity: 0,
          scale: 1.1,
          ease: "power1.inOut",
        },
        0.7,
      );

      // 6. Crossfade the intro container and Hero container
      // The overlap here creates the dissolve handoff
      tl.to(
        introRef.current,
        {
          autoAlpha: 0,
          ease: "none",
        },
        0.85,
      );

      tl.to(
        heroWrapperRef.current,
        {
          autoAlpha: 1,
          y: 0,
          ease: "power2.out",
        },
        0.85,
      );
    }, containerRef);

    return () => ctx.revert();
  }, [prefersReducedMotion, layout.length]);

  if (prefersReducedMotion) {
    return (
      <div className="relative w-full">
        {/* Simple static fallback for reduced motion */}
        <div className="w-full bg-black py-32 flex flex-col items-center justify-center text-center">
          <h1 className="font-serif text-3xl md:text-5xl text-white/90 mb-4">{PRIMARY_TAGLINE}</h1>
          <p className="font-serif text-lg md:text-xl text-white/50">{SECONDARY_TAGLINE}</p>
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
        {/* Rotating Image Ring */}
        <div ref={ringRef} className="absolute inset-0 origin-center will-change-transform">
          {layout.length > 0 &&
            selectedImages.map((src, i) => <RadialCard key={i} src={src} layout={layout[i]} />)}
        </div>

        {/* Center Text Block */}
        <div className="relative z-20 flex flex-col items-center justify-center pointer-events-none drop-shadow-[0_4px_24px_rgba(0,0,0,0.8)]">
          <div ref={taglineRef} className="flex flex-col items-center">
            <h2 className="font-serif text-4xl md:text-6xl text-white font-light tracking-wide text-center px-4 max-w-3xl leading-tight">
              {PRIMARY_TAGLINE}
            </h2>
            <span className="mt-8 text-[10px] uppercase tracking-[0.3em] font-mono text-white/50">
              Scroll to explore
            </span>
          </div>

          <div ref={subTaglineRef} className="absolute inset-0 flex items-center justify-center">
            <h2 className="font-serif text-3xl md:text-5xl text-[#e8d4a0] font-light tracking-wide text-center italic">
              {SECONDARY_TAGLINE}
            </h2>
          </div>
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
