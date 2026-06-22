import { useState, useEffect, useRef } from "react";

export interface LayoutItem {
  stripX: number;
  stripY: number;
  stripRot: number;
  radialX: number;
  radialY: number;
  radialRot: number;
  filmStripX: number;
  filmStripY: number;
  filmStripRot: number;
  isTopArc: boolean;
  scale: number;
  isPortrait: boolean;
}

function PRNG(seed: number) {
  // simple seeded random returning 0 to 1
  return Math.abs(Math.sin(seed * 9301 + 49297)) % 1;
}

export function useIntroLayout(count: number) {
  const layoutRef = useRef<LayoutItem[]>([]);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const isMobile = window.innerWidth < 768;
    
    // Desktop: clamp(90px, 9vw, 130px), Mobile: clamp(60px, 14vw, 88px)
    // We'll estimate width for layout purposes:
    const estCardWidth = isMobile ? Math.min(window.innerWidth * 0.14, 88) : Math.min(window.innerWidth * 0.09, 130);
    const overlapPercent = isMobile ? 0.3 : 0.2;
    const overlap = estCardWidth * overlapPercent;
    
    // Center the strip: start X so that the entire row is centered
    const totalStripWidth = count * (estCardWidth - overlap);
    const startX = -totalStripWidth / 2;

    const baseRadius = isMobile
      ? Math.min(window.innerWidth * 0.38, 220)
      : Math.min(window.innerWidth * 0.26, 400);

    const step = (Math.PI * 2) / count;
    const newLayout: LayoutItem[] = [];

    for (let i = 0; i < count; i++) {
      // -- Strip Positions (Initial Load State) --
      const randA = PRNG(i * 10);
      const randB = PRNG(i * 11);
      
      const stripX = startX + i * (estCardWidth - overlap);
      const stripY = (randA - 0.5) * 30; // ±15px
      const stripRot = (randB - 0.5) * 20; // ±10deg

      // -- Radial Positions (Intermediate State) --
      const angle = i * step;
      const rand1 = PRNG(i * 1);
      const rand2 = PRNG(i * 2);
      
      const radiusJitter = (rand1 - 0.5) * 36; // ±18px
      const r = baseRadius + radiusJitter;

      const radialX = Math.cos(angle) * r;
      const radialY = Math.sin(angle) * r;

      const baseRotation = (angle * 180) / Math.PI + 90;
      const rotationJitter = (rand2 - 0.5) * 16; // ±8deg
      const radialRot = baseRotation + rotationJitter;

      // Determine if this is a top arc card
      const strictlyTop = Math.sin(angle) < 0.1; 

      const scale = 0.85 + PRNG(i * 5) * 0.3; // 0.85 to 1.15
      const isPortrait = PRNG(i * 6) > 0.4; // roughly 60% portrait

      newLayout.push({
        stripX,
        stripY,
        stripRot,
        radialX,
        radialY,
        radialRot,
        filmStripX: 0, // Placeholder, calculated later
        filmStripY: 0,
        filmStripRot: 0,
        isTopArc: strictlyTop,
        scale,
        isPortrait,
      });
    }

    // Now calculate perfectly aligned filmStripX for the strictlyTop cards
    let topArcCount = 0;
    newLayout.forEach(l => { if (l.isTopArc) topArcCount++; });
    
    // We want to space them out so they touch with a 4px gap. 
    // They will be scaled down to 0.8 in GSAP, but let's base it on estCardWidth.
    // At scale 0.8, a 130px card is ~104px. Let's use 110px gap.
    const filmSpacing = 110; 
    let topIndex = 0;
    
    // To center them, we start from -totalWidth/2
    const startFilmX = -((topArcCount * filmSpacing) / 2);
    
    newLayout.forEach((l) => {
      if (l.isTopArc) {
        l.filmStripX = startFilmX + topIndex * filmSpacing;
        l.filmStripY = 0; // perfectly flat
        l.filmStripRot = 0; // perfectly straight
        topIndex++;
      } else {
        l.filmStripY = window.innerHeight; // dropping
      }
    });

    layoutRef.current = newLayout;
    setIsReady(true);
  }, [count]);

  return { layout: layoutRef.current, isReady };
}
