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
  const scrollIndicatorRef = useRef<HTMLDivElement>(null);
  const heroWrapperRef = useRef<HTMLDivElement>(null);
  
  const thread1Ref = useRef<SVGSVGElement>(null);
  const thread2Ref = useRef<SVGSVGElement>(null);
  const threadsGroupRef = useRef<HTMLDivElement>(null);

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

    // 1. Initial State: Radial Ring
    cardElements.forEach((card, i) => {
      const l = layout[i];
      if (!l) return;
      gsap.set(card, {
        xPercent: -50,
        yPercent: -50,
        x: l.radialX,
        y: l.radialY,
        rotation: l.radialRot,
        scale: l.scale,
      });
    });

    // Set initial states
    gsap.set(textBlockRef.current, { autoAlpha: 1, y: 0 }); // Tagline visible initially
    gsap.set(scrollIndicatorRef.current, { autoAlpha: 1 });
    
    // The Hero Wrapper contains the background and text
    gsap.set(heroWrapperRef.current, { autoAlpha: 1 });
    
    // Select Hero elements inside children
    const heroBg = heroWrapperRef.current?.querySelector(".creative-hero-bg");
    const heroEyebrow = heroWrapperRef.current?.querySelector(".creative-hero-eyebrow");
    const heroWords = heroWrapperRef.current?.querySelectorAll(".creative-hero-word");
    const heroSubtext = heroWrapperRef.current?.querySelector(".creative-hero-subtext");
    const heroCtas = heroWrapperRef.current?.querySelectorAll(".creative-hero-cta");

    // Initialize Hero text & bg as hidden
    if (heroBg) gsap.set(heroBg, { autoAlpha: 0, scale: 1.04 });
    if (heroEyebrow) gsap.set(heroEyebrow, { autoAlpha: 0, y: 8, letterSpacing: "0.05em" });
    if (heroWords) gsap.set(heroWords, { autoAlpha: 0, y: 24 });
    if (heroSubtext) gsap.set(heroSubtext, { autoAlpha: 0 });
    if (heroCtas) gsap.set(heroCtas, { autoAlpha: 0, x: -20 });
    
    // Select the video (if it exists)
    const heroVideo = heroWrapperRef.current?.querySelector(".creative-hero-video");
    if (heroVideo) gsap.set(heroVideo, { autoAlpha: 0 });

    // Film strip elements initialization -> Clothesline initialization
    gsap.set(threadsGroupRef.current, { autoAlpha: 0 });
    
    // Select all clothespins
    const clothespins = introRef.current?.querySelectorAll(".polaroid-clothespin");
    if (clothespins) gsap.set(clothespins, { autoAlpha: 0, scale: 0.8 });

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: containerRef.current,
        start: "top top",
        end: "+=500%", // Extensively extended for 10 phases
        pin: true,
        scrub: 1.2,
      },
    });

    // --- Phase 1: Ring alive (0 - 0.15) ---
    // Scroll indicator fades out
    tl.to(scrollIndicatorRef.current, { autoAlpha: 0, y: 10, ease: "power2.inOut" }, 0);
    // Ring slow rotation
    tl.to(ringRef.current, { rotation: -60, ease: "none" }, 0);
    // Background photo begins bleeding in
    if (heroBg) tl.to(heroBg, { autoAlpha: 0.3, ease: "power2.inOut" }, 0.05);

    // --- Phase 2: Threads appear (0.15 - 0.25) ---
    tl.to(threadsGroupRef.current, { autoAlpha: 1, ease: "power2.out" }, 0.15);
    if (heroBg) tl.to(heroBg, { autoAlpha: 0.8, ease: "none" }, 0.15);
    tl.to(textBlockRef.current, { autoAlpha: 0, y: -15, ease: "none" }, 0.15);

    // --- Phase 3: Polaroids migrate to threads (0.25 - 0.5) ---
    cardElements.forEach((card, i) => {
      const l = layout[i];
      if (!l) return;
      
      // Calculate stagger based on index for random feel
      const startTime = 0.25 + (i % 5) * 0.03;
      
      tl.to(card, {
        x: l.threadX,
        y: l.threadY,
        rotation: l.threadRot,
        ease: "power2.inOut",
        duration: 0.15,
      }, startTime);

      // Clothespin snaps on
      if (clothespins && clothespins[i]) {
        tl.to(clothespins[i], {
          autoAlpha: 1,
          scale: 1,
          rotation: l.threadPinAngle,
          ease: "back.out(2)",
          duration: 0.05,
        }, startTime + 0.12);
      }
    });

    // --- Phase 4: Final settle + sway (0.5 - 0.7) ---
    // We simulate sway by rotating the ring wrapper slightly back, and panning slightly
    tl.to(ringRef.current, { rotation: -65, x: "-2vw", ease: "sine.inOut" }, 0.5);

    // --- Phase 5: Threads dissolve, polaroids scale up & borders dissolve (0.7 - 0.9) ---
    tl.to(threadsGroupRef.current, { autoAlpha: 0, duration: 0.1 }, 0.7);
    if (clothespins) tl.to(clothespins, { autoAlpha: 0, scale: 0.5, duration: 0.1 }, 0.7);
    
    tl.to(cardElements, { padding: 0, ease: "power2.inOut" }, 0.8);
    tl.to(cardElements, { scale: (i) => (layout[i]?.scale || 1) * 1.08, ease: "power2.inOut" }, 0.8);

    // Fade polaroids into the background video/image
    tl.to(cardElements, { autoAlpha: 0, ease: "power2.inOut" }, 0.85);
    const imgWrappers = document.querySelectorAll(".polaroid-img-wrapper");
    tl.to(imgWrappers, { borderRadius: "0px", ease: "power2.inOut" }, 0.8);
    if (heroBg) tl.to(heroBg, { autoAlpha: 1, ease: "power2.inOut" }, 0.8);

    // --- Phase 6: Background video crossfade (0.9 - 1.0) ---
    if (heroVideo) tl.to(heroVideo, { autoAlpha: 1, duration: 0.1, ease: "power2.inOut" }, 0.9);

    // --- Phase 7-9: Text Cascade (0.9 - 1.0) ---
    // The logo rotation and nav bar fade in would happen globally, but we can fake it here or just handle hero content
    // Eyebrow staggering
    const eyebrowWords = heroWrapperRef.current?.querySelectorAll(".creative-hero-eyebrow-word");
    if (eyebrowWords) {
      tl.fromTo(eyebrowWords, 
        { autoAlpha: 0, x: -20 },
        { autoAlpha: 1, x: 0, ease: "power3.out", stagger: 0.02 }, 
        0.92
      );
    }
    
    // Headline slides up
    if (heroWords && heroWords.length > 0) {
      tl.to(heroWords, { autoAlpha: 1, y: 0, ease: "power3.out", stagger: 0.05 }, 0.94);
    }
    
    // Subtext fades in
    if (heroSubtext) tl.to(heroSubtext, { autoAlpha: 0.55, ease: "power2.out" }, 0.96);
    
    // CTAs bounce up
    if (heroCtas && heroCtas.length > 0) tl.to(heroCtas, { autoAlpha: 1, x: 0, ease: "back.out(1.5)", stagger: 0.05 }, 0.98);

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
        {/* Jute Threads Background Elements */}
        <div ref={threadsGroupRef} className="absolute inset-0 z-2 origin-center pointer-events-none">
          
          {/* Thread 1 (38%) */}
          <svg 
            ref={thread1Ref} 
            className="absolute left-0 w-full h-[120px] overflow-visible" 
            style={{ top: "calc(38vh - 60px)" }}
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
          >
            <defs>
              <filter id="glow1">
                <feGaussianBlur stdDeviation="1.5" result="coloredBlur"/>
                <feMerge>
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
            </defs>
            <path 
              d="M -10 20 Q 50 100 110 20" 
              fill="transparent" 
              stroke="#A88B63" 
              strokeWidth="2.5" 
              strokeLinecap="round"
              filter="url(#glow1)"
              opacity="0.8"
            />
            <path 
              d="M -10 20 Q 50 100 110 20" 
              fill="transparent" 
              stroke="#E0C9A3" 
              strokeWidth="1" 
              strokeLinecap="round"
              opacity="0.9"
            />
          </svg>

          {/* Thread 2 (62%) */}
          <svg 
            ref={thread2Ref} 
            className="absolute left-0 w-full h-[120px] overflow-visible" 
            style={{ top: "calc(62vh - 60px)" }}
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
          >
            <defs>
              <filter id="glow2">
                <feGaussianBlur stdDeviation="1.5" result="coloredBlur"/>
                <feMerge>
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
            </defs>
            <path 
              d="M -10 20 Q 50 100 110 20" 
              fill="transparent" 
              stroke="#A88B63" 
              strokeWidth="2.5" 
              strokeLinecap="round"
              filter="url(#glow2)"
              opacity="0.8"
            />
            <path 
              d="M -10 20 Q 50 100 110 20" 
              fill="transparent" 
              stroke="#E0C9A3" 
              strokeWidth="1" 
              strokeLinecap="round"
              opacity="0.9"
            />
          </svg>
        </div>

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
        </div>

        {/* Scroll Indicator */}
        <div
          ref={scrollIndicatorRef}
          className="absolute bottom-12 left-1/2 -translate-x-1/2 z-30 flex flex-col items-center gap-3 text-white/50 pointer-events-none"
        >
          <span className="text-[10px] md:text-[11px] uppercase tracking-[0.3em] font-mono">
            Scroll to explore
          </span>
          <div className="animate-bounce">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="m6 9 6 6 6-6" />
            </svg>
          </div>
        </div>
        
      </div>
    </div>
  );
}
