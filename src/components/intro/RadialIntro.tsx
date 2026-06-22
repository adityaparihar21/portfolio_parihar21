"use client";

import React, { useRef, useState, useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { domeGalleryImages } from "@/lib/domeGalleryImages";
import { useIntroLayout, PRNG } from "./useIntroLayout";
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
    // Shuffle the images deterministically
    let m = imgs.length, t, j;
    const rng = PRNG(42);
    while (m) {
      j = Math.floor(rng() * m--);
      t = imgs[m];
      imgs[m] = imgs[j];
      imgs[j] = t;
    }    return imgs;
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
    gsap.set(heroWrapperRef.current, { autoAlpha: 1 });
    gsap.set(ringRef.current, { rotation: 0 });

    const heroBg = heroWrapperRef.current?.querySelector(".creative-hero-bg");
    const heroEyebrow = heroWrapperRef.current?.querySelector(".creative-hero-eyebrow");
    const heroWords = heroWrapperRef.current?.querySelectorAll(".creative-hero-word");
    const heroSubtext = heroWrapperRef.current?.querySelector(".creative-hero-subtext");
    const heroCtas = heroWrapperRef.current?.querySelectorAll(".creative-hero-cta");
    const heroVideo = heroWrapperRef.current?.querySelector(".creative-hero-video");

    if (heroBg) gsap.set(heroBg, { autoAlpha: 0, scale: 1.04 });
    if (heroEyebrow) gsap.set(heroEyebrow, { autoAlpha: 0, y: 8, letterSpacing: "0.05em" });
    if (heroWords) gsap.set(heroWords, { autoAlpha: 0, y: 24 });
    if (heroSubtext) gsap.set(heroSubtext, { autoAlpha: 0 });
    if (heroCtas) gsap.set(heroCtas, { autoAlpha: 0, x: -20 });
    if (heroVideo) gsap.set(heroVideo, { autoAlpha: 0 });

    gsap.set(threadsGroupRef.current, { autoAlpha: 0 });
    
    const clothespins = introRef.current?.querySelectorAll(".polaroid-clothespin");
    if (clothespins) gsap.set(clothespins, { autoAlpha: 0, scale: 0.8 });

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: containerRef.current,
        start: "top 1px",
        end: "+=600%", // Extensively extended for mega 5-phase timeline
        pin: true,
        scrub: 1.2,
        invalidateOnRefresh: true,
      },
    });

    // --- Phase 1 -> 2: Strip to Radial Ring (0 - 0.2) ---
    tl.to(cardElements, {
      x: (i) => layout[i].radialX,
      y: (i) => layout[i].radialY,
      rotation: (i) => layout[i].radialRot,
      ease: "power2.inOut",
      stagger: 0,
      duration: 0.2,
    }, 0);

    // Tagline fades in as ring forms
    tl.fromTo(textBlockRef.current,
      { autoAlpha: 0, y: 10 },
      { autoAlpha: 1, y: 0, ease: "none", duration: 0.1 },
      0.1
    );

    // --- Phase 3: Ring Rotates & Tagline Exits (0.2 - 0.4) ---
    tl.to(ringRef.current, { rotation: -60, ease: "none", duration: 0.2 }, 0.2);
    tl.to(textBlockRef.current, { autoAlpha: 0, y: -15, ease: "none", duration: 0.1 }, 0.3);

    // --- Phase 4: Ring to Dual-Thread Clothesline (0.4 - 0.7) ---
    // Counter-rotate the ring back to 0
    tl.to(ringRef.current, { rotation: 0, ease: "power2.inOut", duration: 0.25 }, 0.4);

    // Fade in threads
    tl.to(threadsGroupRef.current, { autoAlpha: 1, ease: "power2.out", duration: 0.1 }, 0.4);

    cardElements.forEach((card, i) => {
      const l = layout[i];
      if (!l) return;
      
      const startTime = 0.4 + (i % 5) * 0.03;
      
      tl.to(card, {
        x: l.threadX,
        y: l.threadY,
        rotation: l.threadRot,
        ease: "power2.inOut",
        duration: 0.15,
      }, startTime);

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

    // Minimal sway
    tl.to(ringRef.current, { x: "-1vw", ease: "sine.inOut", duration: 0.1 }, 0.7);

    // --- Phase 5: The Grand Vanish (0.8 - 1.0) ---
    tl.to(threadsGroupRef.current, { autoAlpha: 0, duration: 0.1 }, 0.8);
    if (clothespins) tl.to(clothespins, { autoAlpha: 0, scale: 0.5, duration: 0.1 }, 0.8);
    tl.to(cardElements, { autoAlpha: 0, scale: 0.8, ease: "power2.inOut", duration: 0.1 }, 0.8);

    if (heroBg) tl.to(heroBg, { autoAlpha: 1, ease: "power2.inOut", duration: 0.15 }, 0.85);
    if (heroVideo) tl.to(heroVideo, { autoAlpha: 1, duration: 0.1, ease: "power2.inOut" }, 0.9);

    const eyebrowWords = heroWrapperRef.current?.querySelectorAll(".creative-hero-eyebrow-word");
    if (eyebrowWords) {
      tl.fromTo(eyebrowWords, 
        { autoAlpha: 0, x: -20 },
        { autoAlpha: 1, x: 0, ease: "power3.out", stagger: 0.02 }, 
        0.92
      );
    }
    
    if (heroWords && heroWords.length > 0) {
      tl.to(heroWords, { autoAlpha: 1, y: 0, ease: "power3.out", stagger: 0.05 }, 0.94);
    }
    
    if (heroSubtext) tl.to(heroSubtext, { autoAlpha: 0.55, ease: "power2.out" }, 0.96);
    
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
        <div ref={threadsGroupRef} className="absolute inset-0 z-2 origin-center pointer-events-none opacity-0">
          
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
          className="relative z-20 flex flex-col items-center justify-center pointer-events-none drop-shadow-[0_4px_16px_rgba(0,0,0,0.8)] max-w-[80vw] opacity-0"
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
