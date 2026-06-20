import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { domeGalleryImages } from '@/lib/domeGalleryImages';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

const words = ["Filmmaking", "Direction", "Design", "Emotion"];

// Select a subset of images for the scroll intro
const bgImages = domeGalleryImages.slice(0, 8);

export function CreativeVisionIntro() {
  const containerRef = useRef<HTMLDivElement>(null);
  const spotlightRef = useRef<HTMLDivElement>(null);
  const step1Ref = useRef<HTMLDivElement>(null);
  const step2Ref = useRef<HTMLDivElement>(null);
  const slotInnerRef = useRef<HTMLDivElement>(null);
  const imagesRef = useRef<(HTMLImageElement | null)[]>([]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: containerRef.current,
          start: 'top top',
          end: '+=400%',
          pin: true,
          scrub: 1,
        }
      });

      // Initial state
      gsap.set(step1Ref.current, { opacity: 1, scale: 1 });
      gsap.set(step2Ref.current, { opacity: 0, scale: 0.95 });
      gsap.set(spotlightRef.current, { 
        background: 'radial-gradient(circle at 50% 50%, rgba(210,175,110,0.15) 0%, rgba(0,0,0,0) 60%)' 
      });

      // Staggered image setup
      imagesRef.current.forEach((img, i) => {
        gsap.set(img, { 
          opacity: 0, 
          scale: 0.8,
          y: Math.random() * 200 - 100, // Random vertical offset
          x: Math.random() * 300 - 150  // Random horizontal offset
        });
      });

      // 0% - 20%: Step 1 holds
      tl.to({}, { duration: 0.2 });

      // 20% - 30%: Step 1 fades out, images start fading in
      tl.to(step1Ref.current, {
        opacity: 0,
        scale: 1.05,
        duration: 0.1,
        ease: 'power2.inOut'
      });

      // Images fade in sequentially in the background
      imagesRef.current.forEach((img, i) => {
        tl.to(img, {
          opacity: 0.2 + (Math.random() * 0.2), // Subtle opacity
          scale: 1 + (Math.random() * 0.2),
          y: 0,
          x: 0,
          duration: 0.4,
          ease: 'power1.out'
        }, 0.2 + (i * 0.05)); // Staggered start after Step 1 holds
      });

      // 30% - 40%: Step 2 fades in
      tl.to(step2Ref.current, {
        opacity: 1,
        scale: 1,
        duration: 0.1,
        ease: 'power2.inOut'
      }, 0.3);

      // 40% - 90%: Slot machine scrubs through the words
      tl.to(slotInnerRef.current, {
        yPercent: -75,
        duration: 0.5,
        ease: 'none'
      }, 0.4);

      // Dynamic spotlight shift (warm cinematic shifts)
      tl.to(spotlightRef.current, {
        background: 'radial-gradient(circle at 50% 50%, rgba(210,100,100,0.15) 0%, rgba(0,0,0,0) 60%)',
        duration: 0.25,
        ease: 'power1.inOut'
      }, 0.4);

      tl.to(spotlightRef.current, {
        background: 'radial-gradient(circle at 50% 50%, rgba(210,175,110,0.15) 0%, rgba(0,0,0,0) 60%)',
        duration: 0.25,
        ease: 'power1.inOut'
      }, 0.65);

      // 90% - 100%: Fade out everything before unpinning
      tl.to(step2Ref.current, {
        opacity: 0,
        scale: 1.05,
        duration: 0.1,
        ease: 'power2.inOut'
      }, 0.9);
      
      tl.to(spotlightRef.current, {
        opacity: 0,
        duration: 0.1,
        ease: 'power2.inOut'
      }, 0.9);

      imagesRef.current.forEach((img) => {
        tl.to(img, {
          opacity: 0,
          scale: 1.1,
          duration: 0.1,
          ease: 'power2.inOut'
        }, 0.9);
      });

    }, containerRef);

    return () => ctx.revert();
  }, []);

  const prefersReducedMotion = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReducedMotion) {
    return (
      <div className="w-full bg-[#070b12] py-24 flex flex-col items-center justify-center text-center px-6">
        <p className="font-serif text-3xl md:text-5xl tracking-wide text-white opacity-90 mb-6">
          The future of storytelling is precise.
        </p>
        <p className="font-serif text-2xl md:text-4xl text-white/70">
          Changing the way we approach Filmmaking & Design.
        </p>
      </div>
    );
  }

  return (
    <section 
      ref={containerRef} 
      className="relative w-full h-[100vh] bg-black overflow-hidden flex flex-col items-center justify-center border-t border-white/5"
    >
      {/* Dynamic Image Background Layer */}
      <div className="absolute inset-0 z-0 pointer-events-none flex items-center justify-center">
        {bgImages.map((src, i) => (
          <img 
            key={src}
            ref={el => imagesRef.current[i] = el}
            src={src}
            alt="Dome Gallery Preview"
            className="absolute max-w-[40vw] max-h-[40vh] object-cover grayscale mix-blend-screen opacity-0"
            style={{
              // Spread images somewhat randomly around the center
              transform: `translate(${Math.cos(i) * 25}vw, ${Math.sin(i) * 25}vh)`,
              filter: 'blur(2px)'
            }}
          />
        ))}
      </div>

      {/* Volumetric Spotlight Background */}
      <div 
        ref={spotlightRef}
        className="absolute inset-0 z-0 pointer-events-none"
      />

      {/* Narrative Container */}
      <div className="relative z-10 w-full max-w-5xl px-6 md:px-12 flex flex-col items-center justify-center text-center perspective-[1000px]">
        
        {/* Step 1: The Hook */}
        <div ref={step1Ref} className="absolute inset-0 flex items-center justify-center pointer-events-none origin-center">
          <h2 className="text-3xl md:text-5xl lg:text-6xl text-white/95 leading-tight font-serif font-light tracking-wide">
            The future of storytelling <br className="md:hidden" /> is <span className="text-[#e8d4a0]">precise</span>.
          </h2>
        </div>

        {/* Step 2: The Shift & Slot Machine */}
        <div ref={step2Ref} className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none origin-center">
          <p className="text-xl md:text-3xl lg:text-4xl text-white/70 mb-4 font-serif font-light tracking-wide">
            Changing the way we approach
          </p>
          
          {/* Slot Machine Window */}
          <div className="relative h-[1.2em] overflow-hidden text-3xl md:text-5xl lg:text-6xl text-white leading-[1.2em]">
            <div ref={slotInnerRef} className="flex flex-col items-center justify-start">
              {words.map((word, i) => (
                <div key={i} className="h-[1.2em] flex items-center justify-center font-serif italic tracking-wider">
                  {word}
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>

      {/* Progress Indicator Sidebar */}
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
