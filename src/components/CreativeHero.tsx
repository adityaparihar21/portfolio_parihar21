import React from "react";
import { Volume2, VolumeX } from "lucide-react";

export function CreativeHero({
  data,
  activeAudioId,
  setActiveAudioId,
  onMediaReady,
}: {
  data: any;
  activeAudioId: string | null;
  setActiveAudioId: (id: string | null) => void;
  onMediaReady?: () => void;
}) {
  const isMuted = activeAudioId !== "hero";
  const mediaUrl = data?.hero?.media;
  const isVideo =
    mediaUrl &&
    (/\.(mp4|webm|ogg|mov|m4v)$/i.test(mediaUrl) ||
      mediaUrl.includes("video") ||
      mediaUrl.includes("mixkit"));
  return (
    <section className="relative h-screen w-full overflow-hidden bg-[#080808]">
      {/* Background Image is handled by RadialIntro.tsx which fades it in early. 
          But wait, the user says "Act 3: Crossfade to Hero layout content". 
          We can just have the background exist in RadialIntro.tsx and this Hero 
          will just contain the text that GSAP animates in.
          Actually, the prompt says "The given image... is now fully visible above the strip" 
          and "At 100% scroll: pin releases, full hero section is live".
          So the image should probably be in RadialIntro and stick to the back, 
          OR we put it here and RadialIntro fades it in. Let's put it here and make it visible,
          but RadialIntro's timeline will control its opacity from 0 -> 0.6 -> 1. */}

      <div className="absolute inset-0 creative-hero-bg z-0 will-change-[transform,opacity] opacity-0">
        <img
          src="/intro bg.jpeg"
          alt="Cinematic background"
          className="absolute inset-0 h-[110%] w-full object-cover object-[center_30%]"
          onLoad={onMediaReady}
        />
        {/* The video sits on top of the image and fades in at the end of the GSAP timeline */}
        {isVideo && (
          <video
            src={mediaUrl}
            poster={mediaUrl.substring(0, mediaUrl.lastIndexOf(".")) + "_poster.jpg"}
            autoPlay
            loop
            muted={isMuted}
            playsInline
            preload="auto"
            className="creative-hero-video absolute inset-0 h-[110%] w-full object-cover opacity-0 transition-opacity duration-1000"
          />
        )}
      </div>
      
      {/* Dark tint overlay */}
      <div className="absolute inset-0 bg-black/35 z-0" />

      {/* Content wrapper */}
      <div className="relative z-10 w-full h-full flex flex-col items-start justify-center pl-8 md:pl-24 pt-24">
        <h3 className="creative-hero-eyebrow opacity-0 text-[#C8A96E] uppercase text-[11px] font-normal tracking-[0.05em] mb-4">
          The Creative Engineer
        </h3>
        
        <h1 className="creative-hero-headline font-serif text-[#F5ECD7] text-[clamp(3rem,6vw,5rem)] leading-none tracking-tight mb-2">
          {"Aditya Parihar".split(" ").map((word, i) => (
            <span key={i} className="inline-block mr-4 creative-hero-word opacity-0">
              {word}
            </span>
          ))}
        </h1>
        
        <p className="creative-hero-subtext opacity-0 text-white/60 text-[18px] font-light mb-12">
          Code. Vision. Cinematography.
        </p>

        <div className="flex items-center gap-4">
          <button className="creative-hero-cta opacity-0 bg-[#C8A96E] text-[#080808] px-6 py-3 uppercase text-[12px] tracking-[0.15em] font-medium transition-transform hover:scale-105 active:scale-95">
            View Projects
          </button>
          <button className="creative-hero-cta opacity-0 border border-[#C8A96E] text-[#C8A96E] px-6 py-3 uppercase text-[12px] tracking-[0.15em] font-medium transition-transform hover:scale-105 active:scale-95 hover:bg-[#C8A96E]/10">
            GitHub Profile
          </button>
        </div>
      </div>

      {/* Mute/Unmute toggle button (matches original Hero) */}
      {isVideo && (
        <button
          onClick={() => setActiveAudioId(isMuted ? "hero" : null)}
          className="absolute right-6 bottom-24 z-20 flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-black/15 text-white backdrop-blur-md transition-all hover:bg-black/30 hover:scale-105 active:scale-95 md:right-12 md:bottom-32 creative-hero-cta"
          aria-label={isMuted ? "Unmute video" : "Mute video"}
        >
          {isMuted ? (
            <VolumeX className="h-5 w-5" strokeWidth={1.5} />
          ) : (
            <Volume2 className="h-5 w-5" strokeWidth={1.5} />
          )}
        </button>
      )}
    </section>
  );
}
