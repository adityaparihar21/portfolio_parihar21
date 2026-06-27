"use client";

import { useRef } from "react";
import { useScrollScrubVideo } from "../hooks/useScrollScrubVideo";

interface ScrubVideoSectionProps {
  eyebrow: string;
  title: string;
  description: string;
  linkLabel?: string;
  videoSrc: string;
  poster?: string;
  reverse?: boolean;
  trackHeightVh?: number;
}

export default function ScrubVideoSection({
  eyebrow,
  title,
  description,
  linkLabel = "VIEW EDIT",
  videoSrc,
  poster,
  reverse = false,
  trackHeightVh = 220,
}: ScrubVideoSectionProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const { progress } = useScrollScrubVideo(trackRef, videoRef, {
    smoothing: 0,
  });

  return (
    <section
      ref={trackRef}
      className="relative w-full bg-[#0d0a07] max-md:!h-[160vh]"
      style={{ height: `${trackHeightVh}vh` }}
    >
      <div className="sticky top-0 h-screen flex items-center overflow-hidden">
        {/* Film grain overlay */}
        <div 
          className="pointer-events-none absolute inset-0 opacity-5 mix-blend-overlay" 
          style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")" }} 
        />
        
        <div className={`grid grid-cols-1 md:grid-cols-[1fr_1.3fr] gap-8 md:gap-[4vw] items-center w-full max-w-[1400px] mx-auto px-6 md:px-[6vw] ${reverse ? "md:grid-cols-[1.3fr_1fr]" : ""}`}>
          <div className={`flex flex-col ${reverse ? "md:order-2" : ""}`}>
            <span className="block font-mono text-[12px] tracking-[0.18em] text-[#c9a876] uppercase mb-[18px]">
              {eyebrow}
            </span>
            <h2 className="font-serif text-[clamp(32px,8vw,44px)] md:text-[clamp(40px,5vw,64px)] font-semibold text-[#f5ede0] leading-[1.05] mb-[22px]">
              {title}
            </h2>
            <p 
              className="font-sans text-[17px] leading-[1.7] text-[#b8ab98] max-w-[38ch] mb-[32px]"
              dangerouslySetInnerHTML={{ __html: description }}
            />

            <a className="inline-flex items-center gap-2 hover:gap-[13px] font-mono text-[12px] tracking-[0.12em] text-[#c9a876] hover:text-[#e8744a] uppercase transition-all duration-300 group" href="#">
              <span>{linkLabel}</span>
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                aria-hidden="true"
                className="transition-transform duration-300 group-hover:translate-x-[2px]"
              >
                <path
                  d="M3 8H13M13 8L9 4M13 8L9 12"
                  stroke="currentColor"
                  strokeWidth="1.4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </a>
          </div>

          <div className={`relative aspect-[16/10] w-full bg-black border border-[#3a322a] overflow-hidden ${reverse ? "md:order-1" : ""}`}>
            <video
              ref={videoRef}
              src={videoSrc}
              poster={poster}
              muted
              playsInline
              preload="auto"
              className="w-full h-full object-cover block"
            />

            <div className="absolute left-0 bottom-0 w-full h-[2px] bg-[rgba(245,237,224,0.12)]">
              <div
                className="absolute left-0 top-0 h-full w-full bg-[#e8744a] origin-left"
                style={{ transform: `scaleX(${progress})` }}
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
