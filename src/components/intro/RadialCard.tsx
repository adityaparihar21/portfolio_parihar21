import React from "react";
import type { LayoutItem } from "./useIntroLayout";

interface RadialCardProps {
  src: string;
  layout: LayoutItem;
  className?: string;
  priority?: boolean;
}

export const RadialCard = React.forwardRef<HTMLDivElement, RadialCardProps>(
  ({ src, layout, className = "", priority = false }, ref) => {
    // Width and aspect ratio per prompt constraints
    const widthClass = "w-[clamp(60px,14vw,88px)] md:w-[clamp(90px,9vw,130px)]";
    const aspectRatioClass = layout.isPortrait ? "aspect-[3/4]" : "aspect-[4/3]";

    return (
      <div
        ref={ref}
        className={`absolute top-1/2 left-1/2 origin-center bg-white rounded-[2px] shadow-[0_4px_16px_rgba(0,0,0,0.35)] pointer-events-none will-change-transform ${widthClass} ${aspectRatioClass} ${className}`}
        style={{
          // Polaroid padding: top, right, bottom, left
          padding: "6px 6px 18px 6px",
          // The transforms will be set by GSAP timeline, but we start at 0 before GSAP kicks in.
          // Centering is handled by translate(-50%, -50%) which we'll let GSAP manage via xPercent/yPercent 
          // or just CSS translate. Since GSAP overwrites transform, it's safer to have xPercent/yPercent: -50 in GSAP.
        }}
      >
        <div className="relative w-full h-full overflow-hidden bg-[#111] rounded-[1px]">
          <img
            src={src}
            alt=""
            loading={priority ? "eager" : "lazy"}
            className="w-full h-full object-cover"
            sizes="(max-width: 768px) 14vw, 9vw"
          />
        </div>
      </div>
    );
  }
);

RadialCard.displayName = "RadialCard";
