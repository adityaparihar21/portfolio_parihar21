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
        className={`polaroid-card absolute top-1/2 left-1/2 origin-center bg-white shadow-[0_4px_16px_rgba(0,0,0,0.35)] pointer-events-none will-change-transform ${widthClass} ${aspectRatioClass} ${className}`}
        style={{
          padding: "6px 6px 18px 6px",
          borderRadius: "2px"
        }}
      >
        {/* Clothespin element */}
        <div 
          className="polaroid-clothespin absolute left-1/2 -top-[12px] -ml-[6px] w-[12px] h-[24px] bg-[#C19A6B] rounded-sm opacity-0 will-change-transform shadow-md z-20"
          style={{ 
            boxShadow: "inset -2px 0 4px rgba(0,0,0,0.2), 2px 2px 4px rgba(0,0,0,0.3)",
            backgroundImage: "linear-gradient(to right, #D2B48C, #A0522D)",
            transformOrigin: "center 8px"
          }}
        >
          {/* Silver spring line */}
          <div className="absolute top-[8px] left-[-1px] w-[14px] h-[2px] bg-gray-300 rounded-full" />
        </div>

        <div className="polaroid-img-wrapper relative w-full h-full overflow-hidden bg-[#111] rounded-[1px]">
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
