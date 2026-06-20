import React from 'react';
import type { RadialLayoutItem } from './useRadialLayout';

interface RadialCardProps {
  src: string;
  layout: RadialLayoutItem;
  className?: string;
}

export function RadialCard({ src, layout, className = '' }: RadialCardProps) {
  // width based on portrait vs landscape. 
  // We'll use viewport relative units so they scale slightly with screen size
  const widthClass = layout.isPortrait ? "w-[14vw] md:w-[9vw]" : "w-[18vw] md:w-[12vw]";
  const aspectRatioClass = layout.isPortrait ? "aspect-[3/4]" : "aspect-[4/3]";

  return (
    <div
      className={`absolute top-1/2 left-1/2 origin-center shadow-[0_8px_24px_rgba(0,0,0,0.6)] ${widthClass} ${aspectRatioClass} bg-white p-[3px] md:p-[6px] rounded-[2px] pointer-events-none will-change-transform ${className}`}
      style={{
        // We use translate(-50%, -50%) to center it on the origin, then apply the layout offsets and rotation.
        // GSAP will animate the parent container, so these local transforms stay static.
        transform: `translate(-50%, -50%) translate(${layout.x}px, ${layout.y}px) rotate(${layout.rotation}deg) scale(${layout.scale})`,
      }}
    >
      <div className="relative w-full h-full overflow-hidden bg-[#111]">
        {/* The user requested a cinematic look. We can optionally dim the image to help center text pop, 
            or keep it full brightness. We'll use a slight dim overlay. */}
        <img
          src={src}
          alt=""
          loading="lazy"
          className="w-full h-full object-cover"
          sizes="(max-width: 768px) 20vw, 15vw"
        />
        <div className="absolute inset-0 bg-black/10 mix-blend-multiply" />
      </div>
    </div>
  );
}
