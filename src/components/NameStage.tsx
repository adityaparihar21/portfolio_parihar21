import { useState, useRef } from 'react';

export function NameStage() {
  const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);
  const stageRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!stageRef.current) return;
    const rect = stageRef.current.getBoundingClientRect();
    setCursorPos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  const marqueeItems = [
    'Travel Filmmaker', 'Photographer', 'Cinematic Storytelling',
    'India', 'Worldwide', 'Available for Work',
    'Creative Direction', 'Visual Narrative', 'Aditya Parihar'
  ];
  const loop = [...marqueeItems, ...marqueeItems, ...marqueeItems, ...marqueeItems];

  return (
    <div className="w-full flex flex-col items-center">
      <div 
        ref={stageRef}
        onMouseMove={handleMouseMove}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
        className="relative w-full overflow-hidden pt-6 md:pt-10 cursor-none group pointer-events-auto"
      >
        <div 
          className="absolute z-20 flex items-center justify-center w-11 h-11 rounded-full border-[0.5px] border-[#c9a96e] pointer-events-none transition-all duration-200"
          style={{
            left: cursorPos.x,
            top: cursorPos.y,
            transform: `translate(-50%, -50%) scale(${isHovering ? 1 : 0})`,
            opacity: isHovering ? 1 : 0,
            transitionTimingFunction: 'cubic-bezier(.34, 1.56, .64, 1)'
          }}
        >
          <span className="font-light text-[7px] tracking-[0.22em] uppercase text-[#c9a96e]">Work</span>
        </div>

        <div className="flex items-baseline justify-center whitespace-nowrap px-4 pb-2 md:pb-4 relative z-10">
          <span className="font-bebas text-[clamp(72px,18vw,160px)] tracking-[0.06em] leading-[0.88] text-foreground transition-colors duration-300 group-hover:text-[#e8dfc8]">
            ADITYA&nbsp;
          </span>
          <span className="font-bebas text-[clamp(72px,18vw,160px)] tracking-[0.06em] leading-[0.88] text-[#e8dfc8]">
            PARIHAR
          </span>
        </div>

        <span 
          className="block font-bebas text-[clamp(72px,18vw,160px)] tracking-[0.06em] leading-[0.88] text-center text-transparent relative z-0 transition-all duration-300 whitespace-nowrap"
          style={{
            WebkitTextStroke: isHovering ? '1px rgba(201, 169, 110, 0.4)' : '1px rgba(255, 255, 255, 0.1)',
          }}
        >
          ADITYA&nbsp;&nbsp;PARIHAR
        </span>
      </div>

      <div className="overflow-hidden border-t border-b border-border/40 py-3 mt-5 w-full pointer-events-none">
        <div className="flex w-max animate-marquee items-center">
          {loop.map((text, i) => (
            <span key={i} className="font-light text-[9px] tracking-[0.35em] uppercase text-muted-foreground px-7 whitespace-nowrap flex items-center">
              {text} <span className="text-[#c9a96e] mx-2">✦</span>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
