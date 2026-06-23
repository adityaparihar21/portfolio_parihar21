import React, { useRef, useState, useEffect } from "react";
import gsap from "gsap";
import { useContent } from "../lib/use-content";

interface PortalTeaserProps {
  onTransitionComplete: () => void;
}

// Global variable to persist video time across unmounts
declare global {
  interface Window {
    SHARED_VIDEO_TIME?: number;
  }
}

export function PortalTeaser({ onTransitionComplete }: PortalTeaserProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const data = useContent();
  const mediaUrl = data?.hero?.media;

  const [isExpanding, setIsExpanding] = useState(false);

  useEffect(() => {
    // If the global time is set, sync this teaser video to it (just in case)
    if (videoRef.current && window.SHARED_VIDEO_TIME) {
      videoRef.current.currentTime = window.SHARED_VIDEO_TIME;
    }
  }, []);

  const handleClick = () => {
    if (isExpanding || !containerRef.current || !videoRef.current) return;
    setIsExpanding(true);

    // Save the current time so the destination video can pick it up
    window.SHARED_VIDEO_TIME = videoRef.current.currentTime;

    // Get the current position of the teaser
    const rect = containerRef.current.getBoundingClientRect();

    // Create a clone to animate to full screen
    const clone = containerRef.current.cloneNode(true) as HTMLDivElement;
    document.body.appendChild(clone);

    // Style the clone to exactly match the current position
    Object.assign(clone.style, {
      position: "fixed",
      top: `${rect.top}px`,
      left: `${rect.left}px`,
      width: `${rect.width}px`,
      height: `${rect.height}px`,
      zIndex: 9999,
      margin: 0,
      cursor: "default",
      transition: "none",
    });

    // Make the original invisible
    containerRef.current.style.opacity = "0";

    // Grab the video inside the clone to ensure it plays
    const cloneVideo = clone.querySelector("video");
    if (cloneVideo) {
      cloneVideo.currentTime = videoRef.current.currentTime;
      cloneVideo.play().catch(() => {});
    }

    // Animate the clone to full viewport
    gsap.to(clone, {
      top: 0,
      left: 0,
      width: "100vw",
      height: "100vh",
      duration: 1.5,
      ease: "power3.inOut",
      onUpdate: () => {
        // Keep syncing time to global
        if (cloneVideo) {
          window.SHARED_VIDEO_TIME = cloneVideo.currentTime;
        }
      },
      onComplete: () => {
        // Fade out the developer UI (which is everything else)
        gsap.to("#engineering-root", {
          opacity: 0,
          duration: 0.5,
          onComplete: () => {
            // Trigger the app to switch modes
            onTransitionComplete();
            
            // Clean up the clone after a small delay to allow React to mount the new CreativeHero
            setTimeout(() => {
              gsap.to(clone, {
                opacity: 0,
                duration: 0.5,
                onComplete: () => clone.remove()
              });
            }, 100);
          }
        });
      }
    });
  };

  if (!mediaUrl) return null;

  return (
    <div className="w-full relative bg-[#070b12]">
      {/* Soft gradient bleeding into the darkness */}
      <div className="h-32 w-full bg-gradient-to-b from-[#070b12] to-[#080808]" />

      <div 
        ref={containerRef}
        onClick={handleClick}
        className="group relative w-full h-[25vh] overflow-hidden cursor-pointer transition-all duration-700 ease-out hover:h-[28vh]"
      >
        {/* The cinematic video cropped */}
        <video
          ref={videoRef}
          src={mediaUrl}
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-[100vh] object-cover object-[center_30%] transition-transform duration-1000 ease-out group-hover:scale-105 pointer-events-none"
          style={{ top: "50%", transform: "translateY(-50%)" }}
        />

        {/* Cinematic treatments (grain, vignette, contrast) */}
        <div className="absolute inset-0 bg-black/60 transition-opacity duration-700 group-hover:bg-black/30 pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(0,0,0,0.8)_100%)] pointer-events-none" />
        
        {/* Emotional Copy */}
        <div className="absolute inset-0 flex flex-col items-center justify-center opacity-70 group-hover:opacity-100 transition-opacity duration-700">
          <span className="font-serif text-[#E0C9A3] text-lg md:text-xl font-light tracking-wide mb-2 drop-shadow-lg">
            There's another side.
          </span>
          <span className="text-[#A88B63] text-[10px] md:text-[11px] tracking-[0.3em] uppercase">
            Step inside &rarr;
          </span>
        </div>
      </div>
    </div>
  );
}
