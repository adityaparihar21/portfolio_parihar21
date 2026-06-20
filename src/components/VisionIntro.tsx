import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

const words = ["Filmmaking", "Engineering", "Systems", "Emotion"];

export function VisionIntro({ themeMode }: { themeMode: 'select' | 'creative' | 'engineering' }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const spotlightRef = useRef<HTMLDivElement>(null);
  const step1Ref = useRef<HTMLDivElement>(null);
  const step2Ref = useRef<HTMLDivElement>(null);
  const slotInnerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    const ctx = gsap.context(() => {
      // Create a master timeline linked to scroll progress
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: containerRef.current,
          start: 'top top',
          end: '+=400%', // 400% height allows for long, smooth scrubbing
          pin: true,
          scrub: 1, // Smooth dampening
        }
      });

      // Initially, Step 1 is visible, Step 2 is hidden.
      gsap.set(step1Ref.current, { opacity: 1, scale: 1 });
      gsap.set(step2Ref.current, { opacity: 0, scale: 0.95 });
      gsap.set(spotlightRef.current, { 
        background: 'radial-gradient(circle at 50% 50%, rgba(210,175,110,0.15) 0%, rgba(0,0,0,0) 60%)' 
      });

      // 0% - 20%: Step 1 holds
      tl.to({}, { duration: 0.2 });

      // 20% - 30%: Step 1 fades out and scales slightly up
      tl.to(step1Ref.current, {
        opacity: 0,
        scale: 1.05,
        duration: 0.1,
        ease: 'power2.inOut'
      });

      // 30% - 40%: Step 2 fades in
      tl.to(step2Ref.current, {
        opacity: 1,
        scale: 1,
        duration: 0.1,
        ease: 'power2.inOut'
      }, "<");

      // 40% - 90%: Slot machine scrubs through the words
      // Height of one word is 100% of its container. We have 4 words, so 4 heights.
      // We translate Y by -75% to hit the 4th word.
      tl.to(slotInnerRef.current, {
        yPercent: -75,
        duration: 0.5,
        ease: 'none' // linear scrub
      });

      // At the same time, shift the spotlight color dynamically across the scrub
      // Mid-point (Engineering/Systems) shifts to steel blue, then back to gold for Emotion
      tl.to(spotlightRef.current, {
        background: 'radial-gradient(circle at 50% 50%, rgba(106,159,216,0.15) 0%, rgba(0,0,0,0) 60%)',
        duration: 0.25,
        ease: 'power1.inOut'
      }, "-=0.5");

      tl.to(spotlightRef.current, {
        background: 'radial-gradient(circle at 50% 50%, rgba(210,175,110,0.15) 0%, rgba(0,0,0,0) 60%)',
        duration: 0.25,
        ease: 'power1.inOut'
      }, "-=0.25");

      // 90% - 100%: Fade out everything before unpinning
      tl.to(step2Ref.current, {
        opacity: 0,
        scale: 1.05,
        duration: 0.1,
        ease: 'power2.inOut'
      });
      tl.to(spotlightRef.current, {
        opacity: 0,
        duration: 0.1,
        ease: 'power2.inOut'
      }, "<");

    }, containerRef);

    return () => ctx.revert();
  }, [themeMode]);

  // If reduced motion is preferred, render a simple static version or nothing.
  const prefersReducedMotion = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReducedMotion) {
    return (
      <div className="w-full bg-[#070b12] py-24 flex flex-col items-center justify-center text-center px-6">
        <p className="font-serif text-3xl md:text-5xl tracking-wide text-white opacity-90 mb-6">
          The future of storytelling is precise.
        </p>
        <p className="font-serif text-2xl md:text-4xl text-white/70">
          Changing the way we approach Filmmaking & Engineering.
        </p>
      </div>
    );
  }

  // Base typography styles
  const isEngineering = themeMode === 'engineering';
  // Use Cinzel/Garamond for Creative, DM Mono for Engineering in the base text?
  // Actually, we want this to be the bridge. We'll use a mix or the active theme's font.
  // The user requested: "We keep your cinematic black/gold aesthetic, but use an intense, localized volumetric spotlight that shifts its tint"
  const fontClass = isEngineering ? "font-mono font-light tracking-tight" : "font-serif font-light tracking-wide";
  const slotFontClass = isEngineering ? "font-mono font-medium uppercase tracking-[0.1em]" : "font-serif italic tracking-wider";

  return (
    <section 
      ref={containerRef} 
      className="relative w-full h-[100vh] bg-black overflow-hidden flex flex-col items-center justify-center border-t border-white/5"
    >
      {/* Volumetric Spotlight Background */}
      <div 
        ref={spotlightRef}
        className="absolute inset-0 z-0 pointer-events-none"
      />

      {/* Narrative Container */}
      <div className="relative z-10 w-full max-w-5xl px-6 md:px-12 flex flex-col items-center justify-center text-center perspective-[1000px]">
        
        {/* Step 1: The Hook */}
        <div ref={step1Ref} className="absolute inset-0 flex items-center justify-center pointer-events-none origin-center">
          <h2 className={`text-3xl md:text-5xl lg:text-6xl text-white/95 leading-tight ${fontClass}`}>
            The future of storytelling <br className="md:hidden" /> is <span className="text-white">precise</span>.
          </h2>
        </div>

        {/* Step 2: The Shift & Slot Machine */}
        <div ref={step2Ref} className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none origin-center">
          <p className={`text-xl md:text-3xl lg:text-4xl text-white/70 mb-4 ${fontClass}`}>
            Changing the way we approach
          </p>
          
          {/* Slot Machine Window */}
          <div className="relative h-[1.2em] overflow-hidden text-3xl md:text-5xl lg:text-6xl text-white leading-[1.2em]">
            <div ref={slotInnerRef} className="flex flex-col items-center justify-start">
              {words.map((word, i) => (
                <div key={i} className={`h-[1.2em] flex items-center justify-center ${slotFontClass}`}>
                  {word}
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>

      {/* Progress Indicator Sidebar (Static visual reference like Inkwell) */}
      <div className="absolute right-8 top-1/2 -translate-y-1/2 hidden md:flex flex-col gap-6 text-[10px] uppercase tracking-[0.2em] font-mono opacity-30">
        <div className="flex items-center gap-4 text-white">
          <div className="w-1 h-1 bg-white rounded-full shadow-[0_0_8px_rgba(255,255,255,0.8)]" />
          <span>Vision</span>
        </div>
        <div className="flex items-center gap-4 text-white/30">
          <div className="w-1 h-1 bg-white/30 rounded-full" />
          <span>Execution</span>
        </div>
        <div className="flex items-center gap-4 text-white/30">
          <div className="w-1 h-1 bg-white/30 rounded-full" />
          <span>Impact</span>
        </div>
      </div>
    </section>
  );
}
