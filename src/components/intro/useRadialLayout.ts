import { useState, useEffect } from "react";

export interface RadialLayoutItem {
  x: number;
  y: number;
  rotation: number;
  scale: number;
  isPortrait: boolean;
}

export function useRadialLayout(count: number) {
  const [layout, setLayout] = useState<RadialLayoutItem[]>([]);

  useEffect(() => {
    // Only run on client to avoid hydration mismatch with random values
    if (typeof window === "undefined") return;

    // Responsive radius
    const isMobile = window.innerWidth < 768;
    // For mobile, radius is smaller. We constrain it to keep cards visible.
    const baseRadius = isMobile
      ? Math.min(window.innerWidth * 0.4, 220)
      : Math.min(window.innerWidth * 0.28, 480);

    const step = (Math.PI * 2) / count;

    const newLayout: RadialLayoutItem[] = [];

    for (let i = 0; i < count; i++) {
      const angle = i * step;

      // Jitter math for organic layout
      const radiusJitter = (Math.random() - 0.5) * (isMobile ? 20 : 40);
      const r = baseRadius + radiusJitter;

      const x = Math.cos(angle) * r;
      const y = Math.sin(angle) * r;

      // Rotation jitter: base rotation (tangent to circle) + random -8deg to +8deg
      const baseRotation = (angle * 180) / Math.PI + 90;
      const rotationJitter = (Math.random() - 0.5) * 16;
      const rotation = baseRotation + rotationJitter;

      // Scale variation (some slightly smaller, some slightly larger)
      const scale = 0.85 + Math.random() * 0.3; // 0.85 to 1.15

      // Aspect ratio mix (roughly 60% portrait, 40% landscape)
      const isPortrait = Math.random() > 0.4;

      newLayout.push({ x, y, rotation, scale, isPortrait });
    }

    setLayout(newLayout);

    const handleResize = () => {
      // Re-trigger layout calculation to adjust radius on major resize
      // We don't recalculate random values, just re-scale `x` and `y` based on new radius
      const newIsMobile = window.innerWidth < 768;
      const newBaseRadius = newIsMobile
        ? Math.min(window.innerWidth * 0.4, 220)
        : Math.min(window.innerWidth * 0.28, 480);

      setLayout((prev) =>
        prev.map((item, i) => {
          const angle = i * step;
          const currentRadiusRatio = newBaseRadius / baseRadius;
          return {
            ...item,
            x: Math.cos(angle) * (newBaseRadius + (Math.random() - 0.5) * (newIsMobile ? 20 : 40)),
            y: Math.sin(angle) * (newBaseRadius + (Math.random() - 0.5) * (newIsMobile ? 20 : 40)),
          };
        }),
      );
    };

    let resizeTimer: NodeJS.Timeout;
    const debouncedResize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(handleResize, 300);
    };

    window.addEventListener("resize", debouncedResize);
    return () => {
      window.removeEventListener("resize", debouncedResize);
      clearTimeout(resizeTimer);
    };
  }, [count]);

  return layout;
}
