import { useState, useEffect, useRef } from "react";

export interface LayoutItem {
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
      // -- Radial Positions (Start State) --
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

      // Determine if this is a top arc card (roughly sin(angle) < 0 in standard DOM coords, but let's be safe: angle between PI and 2PI is top)
      // Since angle is 0 to 2PI. 0 is right, PI/2 is bottom, PI is left, 3PI/2 is top.
      const isTopArc = angle > Math.PI * 0.8 && angle < Math.PI * 2.2; 
      // Actually let's just take the top half: Math.sin(angle) < 0
      const strictlyTop = Math.sin(angle) < 0.1; 

      // -- Film Strip Positions (End of Act 1) --
      const rand3 = PRNG(i * 3);
      const rand4 = PRNG(i * 4);
      
      // If it's top arc, it lines up horizontally. If bottom, it drops away (we handle drop in GSAP, but give it a dummy target here)
      // We will compress the horizontal spread slightly.
      const spreadX = radialX * 1.5; // Stretch out the top arc horizontally
      const filmStripX = strictlyTop ? spreadX : radialX;
      
      // Horizon line is around 42vh. We will handle the exact Y in GSAP since it's viewport relative, but let's give a local offset
      const filmStripY = strictlyTop ? (rand3 - 0.5) * 20 : window.innerHeight; // Drop bottom ones
      const filmStripRot = strictlyTop ? (rand4 - 0.5) * 8 : 0; // Almost flat

      const scale = 0.85 + PRNG(i * 5) * 0.3; // 0.85 to 1.15
      const isPortrait = PRNG(i * 6) > 0.4; // roughly 60% portrait

      newLayout.push({
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
