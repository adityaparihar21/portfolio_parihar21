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

      // -- Film Strip Positions (Act 2 State) --
      const rand3 = PRNG(i * 3);
      const rand4 = PRNG(i * 4);
      
      const spreadX = radialX * 1.5; 
      const filmStripX = strictlyTop ? spreadX : radialX;
      const filmStripY = strictlyTop ? (rand3 - 0.5) * 20 : window.innerHeight; 
      const filmStripRot = strictlyTop ? (rand4 - 0.5) * 8 : 0; 

      const scale = 0.85 + PRNG(i * 5) * 0.3; // 0.85 to 1.15
      const isPortrait = PRNG(i * 6) > 0.4; // roughly 60% portrait

      newLayout.push({
        stripX,
        stripY,
        stripRot,
        radialX,
        radialY,
        radialRot,
        filmStripX,
        filmStripY,
        filmStripRot,
        isTopArc: strictlyTop,
        scale,
        isPortrait,
      });
    }

    layoutRef.current = newLayout;
    setIsReady(true);
  }, [count]);

  return { layout: layoutRef.current, isReady };
}
