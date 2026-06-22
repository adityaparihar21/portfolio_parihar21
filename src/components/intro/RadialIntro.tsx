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
  
  // New elements for the film strip transition
  const horizonLineRef = useRef<HTMLDivElement>(null);
  const celluloidBarRef = useRef<HTMLDivElement>(null);
  const sunGlowRef = useRef<HTMLDivElement>(null);
  const sprocketsTopRef = useRef<HTMLDivElement>(null);
  const sprocketsBottomRef = useRef<HTMLDivElement>(null);
  const filmStripGroupRef = useRef<HTMLDivElement>(null);

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

    // We start with Frame A: Ring arrangement
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
    gsap.set(textBlockRef.current, { autoAlpha: 1, y: 0 });
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

    // Film strip elements initialization
    gsap.set(horizonLineRef.current, { autoAlpha: 0 });
    gsap.set(celluloidBarRef.current, { y: 110, autoAlpha: 0 });
    gsap.set(sprocketsTopRef.current, { autoAlpha: 0 });
    gsap.set(sprocketsBottomRef.current, { autoAlpha: 0 });
    gsap.set(sunGlowRef.current, { autoAlpha: 0 });
    
    // We group the strip to pan it and eventually drop it
    gsap.set(filmStripGroupRef.current, { y: 0 });

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: containerRef.current,
        start: "top top",
        end: "+=250%", 
        pin: true,
        scrub: 1.2,
      },
    });

    // --- Act 1: Ring Shatters & Flattens (0% -> 40%) ---
    
    // 0-15%: Scroll indicator & Tagline fade out
    tl.to(scrollIndicatorRef.current, { autoAlpha: 0, y: 10, ease: "power2.inOut" }, 0);
    tl.to(textBlockRef.current, { autoAlpha: 0, y: -12, ease: "power1.inOut" }, 0);

    // 0-40%: Morph cards to flattened horizontal strip
    cardElements.forEach((card, i) => {
      const l = layout[i];
      if (!l) return;
      
      if (l.isTopArc) {
        tl.to(card, {
          x: l.filmStripX,
          y: l.filmStripY - (window.innerHeight * 0.08), // adjust up slightly to sit on horizon
          rotation: l.filmStripRot,
          ease: "power2.inOut"
        }, 0);
      } else {
        tl.to(card, {
          y: window.innerHeight * 0.6,
          rotation: 0,
          autoAlpha: 0,
          ease: "power2.inOut"
        }, 0);
      }
    });

    // 20%: Cinematic background starts fading in
    if (heroBg) {
      tl.to(heroBg, { autoAlpha: 0.6, scale: 1.0, ease: "power2.out" }, 0.2);
    }
    
    // 30%: Golden horizon line fades in
    tl.to(horizonLineRef.current, { autoAlpha: 0.7, ease: "power2.inOut" }, 0.3);


    // --- Act 2: Polaroids Become Film Strip (40% -> 70%) ---
    
    // 40%: Polaroid borders shrink
    const polaroids = document.querySelectorAll(".polaroid-card");
    const imgWrappers = document.querySelectorAll(".polaroid-img-wrapper");
    
    // We animate inline padding directly to remove the white matte
    tl.to(polaroids, { padding: "0px", borderRadius: "0px", ease: "power2.inOut" }, 0.4);
    tl.to(imgWrappers, { borderRadius: "0px", ease: "power2.inOut" }, 0.4);
    
    // Scale cards strictly to standard film frame sizes (120x90 roughly handled by scale down)
    // Actually padding removal might be enough visually, but let's drop their scale to normalize
    tl.to(cardElements, { scale: 0.8, ease: "power2.inOut" }, 0.4);

    // 40%: Celluloid bar rises to encase images
    tl.to(celluloidBarRef.current, { y: 0, autoAlpha: 1, ease: "power2.out" }, 0.4);
    
    // 40%: Sprockets fade in
    tl.to([sprocketsTopRef.current, sprocketsBottomRef.current], { autoAlpha: 1, ease: "power2.out" }, 0.4);

    // 40% -> 100%: Continuous Pan of the film strip right-to-left
    // We will animate the X of the ringRef to pan the images
    tl.to(ringRef.current, { x: "-=30vw", ease: "none" }, 0.4);
    
    // Background becomes fully visible
    if (heroBg) {
      tl.to(heroBg, { autoAlpha: 1, ease: "power2.inOut" }, 0.4);
    }

    // 55%: Soft sun glow appears on horizon
    tl.to(sunGlowRef.current, { autoAlpha: 1, ease: "power2.inOut" }, 0.55);


    // --- Act 3: Hero Text Resolves (70% -> 100%) ---
    
    // 70%: Eyebrow text
    if (heroEyebrow) {
      tl.to(heroEyebrow, { autoAlpha: 1, y: 0, letterSpacing: "0.2em", ease: "power3.out" }, 0.7);
    }

    // 78%: Headline rises word by word
    if (heroWords && heroWords.length > 0) {
      tl.to(heroWords, { autoAlpha: 1, y: 0, ease: "power3.out", stagger: 0.07 }, 0.78);
    }

    // 88%: Subtext fades in
    if (heroSubtext) {
      tl.to(heroSubtext, { autoAlpha: 0.6, ease: "power2.out" }, 0.88);
    }

    // 95%: Buttons slide in
    if (heroCtas && heroCtas.length > 0) {
      tl.to(heroCtas, { autoAlpha: 1, x: 0, ease: "power3.out", stagger: 0.08 }, 0.95);
    }

    // 90% -> 100%: Film strip sinks below viewport
    tl.to(filmStripGroupRef.current, { y: window.innerHeight * 0.6, ease: "power2.in" }, 0.9);
    
    // Horizon glow fades out
    tl.to([horizonLineRef.current, sunGlowRef.current], { autoAlpha: 0, ease: "power2.in" }, 0.9);

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
      
      {/* Hero Content Layer (Underneath the Intro, so it can fade in) */}
      <div ref={heroWrapperRef} className="absolute inset-0 z-0 w-full h-full pointer-events-auto">
        {children}
      </div>

      {/* Intro Sequence Layer */}
      <div
        ref={introRef}
        className="absolute inset-0 z-10 w-full h-full overflow-hidden flex flex-col items-center justify-center pointer-events-none"
      >
        {/* Film Strip Background Elements */}
        <div ref={filmStripGroupRef} className="absolute inset-0 origin-center will-change-transform">
          {/* Horizon Line */}
          <div 
            ref={horizonLineRef} 
            className="absolute left-0 w-full h-[1px] bg-[rgba(200,169,110,0.65)] z-0" 
            style={{ top: "42vh" }} 
          />
          
          {/* Sun Glow */}
          <div 
            ref={sunGlowRef} 
            className="absolute left-1/2 -translate-x-1/2 w-[200px] h-[200px] bg-[radial-gradient(circle_at_center,rgba(200,140,60,0.35)_0%,transparent_70%)] z-1" 
            style={{ top: "calc(42vh - 100px)" }} 
          />

          {/* Celluloid Bar */}
          <div 
            ref={celluloidBarRef} 
            className="absolute left-0 w-[200vw] -ml-[50vw] h-[110px] bg-[rgba(8,6,4,0.92)] z-2 flex flex-col justify-between overflow-hidden" 
            style={{ top: "calc(42vh - 55px)" }} 
          >
            {/* Sprockets Top */}
            <div ref={sprocketsTopRef} className="w-full h-[12px] flex items-center gap-[18px] pl-[10px] mt-[4px]">
              {Array.from({ length: 60 }).map((_, i) => (
                <div key={i} className="w-[10px] h-[8px] rounded-[2px] bg-[rgba(200,169,110,0.2)] shrink-0" />
              ))}
            </div>
            
            {/* Sprockets Bottom */}
            <div ref={sprocketsBottomRef} className="w-full h-[12px] flex items-center gap-[18px] pl-[10px] mb-[4px]">
              {Array.from({ length: 60 }).map((_, i) => (
                <div key={i} className="w-[10px] h-[8px] rounded-[2px] bg-[rgba(200,169,110,0.2)] shrink-0" />
              ))}
            </div>
          </div>

          {/* Animated Wrapper for Cards */}
          <div ref={ringRef} className="absolute inset-0 origin-center will-change-transform z-3">
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
