import { useState, useEffect } from "react";

export interface LayoutItem {
  stripX: number;
  stripY: number;
  stripRot: number;
  radialX: number;
  radialY: number;
  radialRot: number;
  scale: number;
  isPortrait: boolean;
}

function PRNG(seed: number) {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => {
    return (s = (s * 16807) % 2147483647) / 2147483647;
  };
}

export function useIntroLayout(count: number) {
  const [layout, setLayout] = useState<LayoutItem[]>([]);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const isMobile = window.innerWidth < 768;
    const rng = PRNG(42);

    const estCardWidth = isMobile ? Math.min(window.innerWidth * 0.14, 88) : Math.min(window.innerWidth * 0.09, 130);
    const overlapPercent = isMobile ? 0.3 : 0.2;
    const overlap = estCardWidth * overlapPercent;
    
    // Center the strip: start X so that the entire row is centered
    const totalStripWidth = count * (estCardWidth - overlap);
    const startX = -totalStripWidth / 2;

    const baseRadius = isMobile
      ? Math.min(window.innerWidth * 0.40, 200) // Slightly smaller radius on mobile per prompt
      : Math.min(window.innerWidth * 0.26, 400);

    const step = (Math.PI * 2) / count;
    const newLayout: LayoutItem[] = [];

    for (let i = 0; i < count; i++) {
      const angle = i * step;
      const rand1 = rng();
      const rand2 = rng();
      const rand3 = rng();
      const rand4 = rng();
      const rand5 = rng();

      // -- Strip Positions (Phase 1) --
      const stripX = startX + i * (estCardWidth - overlap);
      const stripY = (rand4 - 0.5) * 30; // ±15px
      const stripRot = (rand5 - 0.5) * 20; // ±10deg

      // -- Radial Positions (Phase 3) --
      const r = baseRadius + (rand1 - 0.5) * 36; // ±18px jitter
      const radialX = Math.cos(angle) * r;
      const radialY = Math.sin(angle) * r;
      
      const isPortrait = i % 2 !== 0;
      
      const baseRotation = (angle * 180) / Math.PI + 90;
      const radialRot = baseRotation + (rand2 - 0.5) * 16; // ±8deg
      
      const scale = isMobile ? 0.7 + rand3 * 0.3 : 0.85 + rand3 * 0.25;

      newLayout.push({
        stripX,
        stripY,
        stripRot,
        radialX,
        radialY,
        radialRot,
        scale,
        isPortrait,
      });
    }

    setLayout(newLayout);
    setIsReady(true);
  }, [count]);

  return { layout, isReady };
}
