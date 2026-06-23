import { useState, useEffect, useRef } from "react";

export interface LayoutItem {
  stripX: number;
  stripY: number;
  stripRot: number;
  radialX: number;
  radialY: number;
  radialRot: number;
  threadX: number;
  threadY: number;
  threadRot: number;
  threadIndex: number;
  threadPinAngle: number;
  scale: number;
  isPortrait: boolean;
}

export function PRNG(seed: number) {
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

    const estCardWidth = isMobile 
      ? Math.max(60, Math.min(window.innerWidth * 0.14, 88)) 
      : Math.max(90, Math.min(window.innerWidth * 0.09, 130));
    const overlapPercent = isMobile ? 0.4 : 0.2;
    const overlap = estCardWidth * overlapPercent;
    
    // Center the strip: start X so that the entire row is centered
    const totalStripWidth = count * (estCardWidth - overlap);
    const startStripX = -totalStripWidth / 2;

    const baseRadius = isMobile
      ? Math.min(window.innerWidth * 0.38, window.innerHeight * 0.35, 200)
      : Math.min(window.innerWidth * 0.28, window.innerHeight * 0.38, 450);

    const step = (Math.PI * 2) / count;
    const newLayout: LayoutItem[] = [];

    // Thread logic
    // We split the cards evenly between two threads.
    const halfCount = Math.ceil(count / 2);
    // Threads are at 38vh and 62vh, but our origin is 50vh, so thread 1 is -12vh, thread 2 is +12vh.
    const thread1BaseY = -window.innerHeight * 0.12;
    const thread2BaseY = window.innerHeight * 0.12;

    const totalThreadWidth = window.innerWidth * 1.1; // Extends slightly past screen edges
    const startX = -totalThreadWidth / 2;
    const stepX = totalThreadWidth / halfCount;

    // Track how many cards we've assigned to each thread
    let t1Count = 0;
    let t2Count = 0;

    for (let i = 0; i < count; i++) {
      const angle = i * step;
      const rand1 = rng();
      const rand2 = rng();
      const rand3 = rng();
      const rand4 = rng();
      const rand5 = rng();

      // -- Strip Positions (Initial Phase 1) --
      const stripX = startStripX + i * (estCardWidth - overlap);
      const stripY = (rand4 - 0.5) * 30; // ±15px
      const stripRot = (rand5 - 0.5) * 20; // ±10deg

      // -- Radial Positions (Phase 3) --
      const r = baseRadius + (rand1 - 0.5) * 36; // ±18px jitter
      const radialX = Math.cos(angle) * r;
      const radialY = Math.sin(angle) * r;
      
      const isPortrait = i % 2 !== 0;
      
      const baseRotation = (angle * 180) / Math.PI + 90;
      const radialRot = baseRotation + (rand2 - 0.5) * 16; // ±8deg
      
      const scale = isMobile ? 0.45 + rand3 * 0.2 : 0.85 + rand3 * 0.25;

      // -- Thread Positions (Final Phase) --
      // Randomly assign to thread 1 or 2, balancing the count
      let threadIndex = 1;
      if (t1Count >= halfCount) threadIndex = 2;
      else if (t2Count >= halfCount) threadIndex = 1;
      else threadIndex = rand4 > 0.5 ? 1 : 2;

      let threadX = 0;
      if (threadIndex === 1) {
        threadX = startX + t1Count * stepX + (rng() - 0.5) * 20;
        t1Count++;
      } else {
        threadX = startX + t2Count * stepX + (rng() - 0.5) * 20;
        t2Count++;
      }

      // Catenary Sag (parabola approximation)
      // x ranges from -totalWidth/2 to totalWidth/2
      const normalizedX = threadX / (totalThreadWidth / 2); // -1 to 1
      const maxSag = isMobile ? 15 : 60;
      const sag = (1 - normalizedX * normalizedX) * maxSag; // 0 at edges, maxSag at center

      const threadY = (threadIndex === 1 ? thread1BaseY : thread2BaseY) + sag + (rng() - 0.5) * 10;
      
      // Rotates ±3 to ±10 degrees
      const threadRot = (rng() > 0.5 ? 1 : -1) * (3 + rng() * 7);
      
      // Clothespin angle (slightly different than card rot for realism, but we'll use a fixed vertical rotation relative to card)
      const threadPinAngle = (rng() - 0.5) * 15;

      newLayout.push({
        stripX,
        stripY,
        stripRot,
        radialX,
        radialY,
        radialRot,
        threadX,
        threadY,
        threadRot,
        threadIndex,
        threadPinAngle,
        scale,
        isPortrait,
      });
    }

    setLayout(newLayout);
    setIsReady(true);
  }, [count]);

  return { layout, isReady };
}
