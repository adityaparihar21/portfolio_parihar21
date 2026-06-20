import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useRef } from "react";
import { motion, useScroll, useTransform, AnimatePresence, useMotionValue, useSpring } from "framer-motion";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { CanvasSequence } from "../components/CanvasSequence";
// @ts-expect-error: Ignore missing types for JSX file
import DomeGallery from "../components/DomeGallery";
import AP3DMonogram from "../components/AP3DMonogram";
import { DevDashboardHero } from "../components/DevDashboardHero";
import { EngineeringPortfolio } from "../components/EngineeringPortfolio";
import { GithubSection } from "../components/GithubSection";
import { RadialIntroSequence } from "../components/intro/RadialIntro";
import { ChevronDown, Instagram, Youtube, Github, Linkedin, Mail, ArrowRight, Volume2, VolumeX, Menu, X, Loader2 } from "lucide-react";

import { siteData } from "@/lib/site-data";
import { useContent } from "@/lib/use-content";
import { domeGalleryImages } from "@/lib/domeGalleryImages";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: `${siteData.brand.name} — Travel Filmmaker & Photographer` },
      {
        name: "description",
        content:
          "Cinematic travel films and photography for premium brands, luxury hotels and travel companies worldwide.",
      },
      { property: "og:title", content: `${siteData.brand.name} — Travel Filmmaker & Photographer` },
      {
        property: "og:description",
        content: "Cinematic storytelling designed to inspire, engage and elevate.",
      },
      { property: "og:image", content: siteData.hero.media },
    ],
  }),
  component: Index,
});

/* ---------------- Shared motion presets ---------------- */
const EASE_OUT_EXPO = [0.22, 1, 0.36, 1] as const;

const fadeUp = {
  hidden: { opacity: 0, y: 60 },
  visible: { opacity: 1, y: 0 },
};

const staggerParent = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12, delayChildren: 0.05 } },
};

/* ---------------- Preloader ---------------- */
function Preloader({
  monogram,
  triggerTransition,
  onComplete,
  showEnter,
  onChoice,
  setHoverMode,
  countdown,
  videoVisible,
  wordsVisible,
}: {
  monogram: string;
  triggerTransition: boolean;
  onComplete: () => void;
  showEnter: boolean;
  onChoice: (choice: 'creative' | 'engineering') => void;
  setHoverMode: (mode: 'none' | 'creative' | 'engineering') => void;
  countdown: number;
  videoVisible: boolean;
  wordsVisible: boolean;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Smooth mouse tracking for the light spotlight
  const mouseX = useMotionValue(typeof window !== "undefined" ? window.innerWidth / 2 : 0);
  const mouseY = useMotionValue(typeof window !== "undefined" ? window.innerHeight / 2 : 0);
  const springX = useSpring(mouseX, { stiffness: 50, damping: 20 });
  const springY = useSpring(mouseY, { stiffness: 50, damping: 20 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);
    };
    const handleTouchMove = (e: TouchEvent) => {
      mouseX.set(e.touches[0].clientX);
      mouseY.set(e.touches[0].clientY);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("touchmove", handleTouchMove);
    
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("touchmove", handleTouchMove);
    };
  }, [mouseX, mouseY]);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.playbackRate = 1.25;
    }
  }, []);

  // Pause preloader audio when page is hidden
  useEffect(() => {
    let wasPlaying = false;
    const handleVisibility = () => {
      if (document.hidden) {
        if (audioRef.current && !audioRef.current.paused) {
          audioRef.current.pause();
          wasPlaying = true;
        }
      } else {
        if (audioRef.current && wasPlaying) {
          audioRef.current.play().catch(e => console.warn("Audio resume failed", e));
          wasPlaying = false;
        }
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, []);

  useEffect(() => {
    if (triggerTransition) {
      // Play cinematic riser SFX safely to prevent overlaps
      if (!audioRef.current) {
        audioRef.current = new Audio('/riser.mp3');
        audioRef.current.volume = 0.85;
      }
      audioRef.current.play().catch(e => console.warn("Audio playback blocked", e));

      const runTransition = async () => {
        // Fade out monogram and text
        gsap.to(".preloader-content", { opacity: 0, duration: 0.8, ease: "power2.out" });
        gsap.to(".preloader-coin", { opacity: 0, scale: 1.1, duration: 1.5, ease: "power2.inOut" });
        
        // Smooth fade out and slight zoom for the new interior video
        gsap.to(".preloader-bg", { 
          scale: 1.1, 
          opacity: 0, 
          duration: 2.5, 
          ease: "power2.inOut",
          onComplete: () => {
            if (audioRef.current) {
              // Rapidly fade out audio so it never bleeds into home page
              gsap.to(audioRef.current, {
                volume: 0,
                duration: 0.3,
                onComplete: () => audioRef.current?.pause()
              });
            }
            onComplete();
          } 
        });
      };
      runTransition();

      return () => {
        // Cleanup function to prevent ghost audio if component unmounts
        if (audioRef.current) {
          audioRef.current.pause();
        }
      };
    }
  }, [triggerTransition, onComplete]);

  return (
    <motion.div
      initial={{ opacity: 1, scale: 1, filter: "blur(0px) brightness(1)" }}
      exit={{ opacity: 0, filter: "blur(10px) brightness(1.2)" }}
      transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black overflow-hidden"
    >
      {/* Interior Video Background - Awakens when videoVisible is true */}
      <motion.div
        initial={{ opacity: 0, scale: 1.0 }}
        animate={{ opacity: videoVisible ? 1 : 0, scale: 1.15 }}
        exit={{ opacity: 0 }}
        transition={{ 
          opacity: { duration: 2.0, ease: "easeOut" },
          scale: { duration: 25, ease: "linear", repeat: Infinity, repeatType: "reverse" }
        }}
        className="preloader-bg absolute inset-0 z-0 pointer-events-none origin-center"
      >
        <video
          ref={videoRef}
          src="/loadingpagebg.mp4"
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
        />
        {/* Dark dimming overlay to ensure the 3D monogram and text pop against the bright flowers */}
        <div className="absolute inset-0 bg-black/40 z-[1]" />
        {/* Additional gradient at the bottom for text readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent z-[2]" />
      </motion.div>
      
      {/* Interactive Spotlight */}
      <motion.div 
        className="pointer-events-none absolute z-0 h-[800px] w-[800px] rounded-full opacity-40"
        style={{
          x: springX,
          y: springY,
          translateX: "-50%",
          translateY: "-50%",
          background: "radial-gradient(circle, rgba(224, 185, 80, 0.15) 0%, rgba(224, 185, 80, 0.05) 30%, transparent 60%)"
        }}
      />

      {/* Loading & Enter UI - Positioned at Bottom */}
      <div className="absolute bottom-20 md:bottom-28 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-6 w-full px-6 preloader-content pointer-events-none">
        
        {/* ALWAYS VISIBLE: Cycling words + Timer bar */}
        <AnimatePresence>
          {wordsVisible && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.0, ease: EASE_OUT_EXPO }}
              className="flex flex-col items-center gap-5 w-full pointer-events-none"
            >
              {/* All descriptor words side by side on desktop, stacked on mobile */}
              <div className="flex flex-col md:flex-row items-center justify-center gap-1 md:gap-4 overflow-hidden">
                {["Code.", "Vision.", "Cinematography."].map((word, i) => (
                  <motion.span
                    key={word}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: i * 0.15, ease: EASE_OUT_EXPO }}
                    className="font-serif text-[11px] md:text-base tracking-[0.2em] md:tracking-[0.3em] uppercase text-foreground/90 italic drop-shadow-md"
                  >
                    {word}
                  </motion.span>
                ))}
              </div>

              {/* Timer bar / Divider */}
              <div className="flex items-center gap-4 opacity-90">
                <div className="h-px w-10 md:w-20 bg-foreground/30 shadow-[0_1px_2px_rgba(0,0,0,0.5)]" />
                <AnimatePresence mode="wait">
                  {!showEnter ? (
                    /* Thin shimmer bar while loading */
                    <motion.div
                      key="shimmer"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="h-px w-24 md:w-32 overflow-hidden bg-foreground/20 relative shadow-[0_1px_2px_rgba(0,0,0,0.5)]"
                    >
                      <motion.div
                        initial={{ x: "-100%" }}
                        animate={{ x: "100%" }}
                        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", repeatDelay: 0.4 }}
                        className="absolute inset-0 h-full w-full bg-primary/90"
                      />
                    </motion.div>
                  ) : (
                    /* 10s countdown text */
                    <motion.span
                      key="countdown"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="font-serif text-[10px] md:text-xs tracking-[0.3em] uppercase text-foreground/90 italic whitespace-nowrap drop-shadow-md"
                    >
                      auto in {countdown}s
                    </motion.span>
                  )}
                </AnimatePresence>
                <div className="h-px w-10 md:w-20 bg-foreground/30 shadow-[0_1px_2px_rgba(0,0,0,0.5)]" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* CHOICE BUTTONS: Fades in below the timer bar */}
        <AnimatePresence>
          {showEnter && (
            <motion.div
              key="enter"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.7, ease: EASE_OUT_EXPO }}
              className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-5 w-full pointer-events-auto"
            >
              {/* Creative Work Pill */}
              <button
                onMouseEnter={() => setHoverMode('creative')}
                onMouseLeave={() => setHoverMode('none')}
                onClick={() => onChoice('creative')}
                className="group flex flex-col items-center justify-center px-8 py-3.5 rounded-[60px] bg-[rgba(210,175,110,0.12)] border-[0.5px] border-[rgba(210,175,110,0.35)] transition-all duration-500 hover:bg-[rgba(210,175,110,0.22)] hover:border-[rgba(210,175,110,0.6)] hover:-translate-y-[2px] cursor-pointer"
              >
                <span className="font-serif font-light text-[#e8d4a0] uppercase tracking-[0.28em] text-[11px] md:text-xs">
                  Creative Work
                </span>
                <span className="font-serif font-light italic text-[#e8d4a0]/80 text-[9px] mt-1 tracking-widest">
                  Film · Direction · Design
                </span>
              </button>
              
              {/* Vertical Divider */}
              <div className="hidden sm:block w-[0.5px] h-[32px] bg-[rgba(180,145,90,0.2)]" />
              
              {/* Technical Work Pill */}
              <button
                onMouseEnter={() => setHoverMode('engineering')}
                onMouseLeave={() => setHoverMode('none')}
                onClick={() => {
                  setHoverMode('none');
                  onChoice('engineering');
                }}
                className="group flex flex-col items-center justify-center px-8 py-3.5 rounded-[60px] bg-[rgba(160,185,220,0.08)] border-[0.5px] border-[rgba(160,185,220,0.25)] transition-all duration-500 hover:bg-[rgba(160,185,220,0.16)] hover:border-[rgba(160,185,220,0.5)] hover:-translate-y-[2px] cursor-pointer"
              >
                <span className="font-serif font-light text-[#b8cfe8] uppercase tracking-[0.28em] text-[11px] md:text-xs">
                  Technical Work
                </span>
                <span className="font-serif font-light italic text-[#b8cfe8]/80 text-[9px] mt-1 tracking-widest">
                  Engineering · Code · Systems
                </span>
              </button>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </motion.div>
  );
}


/* ---------------- Header ---------------- */
function Header({ 
  data, 
  isLoading,
  themeMode,
  setThemeMode
}: { 
  data: ReturnType<typeof useContent>; 
  isLoading: boolean;
  themeMode: 'select' | 'creative' | 'engineering';
  setThemeMode: (mode: 'select' | 'creative' | 'engineering') => void;
}) {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 32);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <motion.header
      initial={{ y: -40, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.9, ease: EASE_OUT_EXPO }}
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-500 ${
        scrolled || menuOpen
          ? "backdrop-blur-xl bg-background/75 border-b border-border"
          : "bg-transparent"
      }`}
    >
      <div className="mx-auto flex max-w-[1600px] items-center justify-between px-6 py-6 md:px-12">
        <a href="#top" className="flex items-center gap-2 w-12 h-12 md:w-16 md:h-16" onClick={() => setMenuOpen(false)}>
          {/* Invisible placeholder matching the flying coin's layout box */}
          <div className="w-12 h-12 md:w-16 md:h-16" />
        </a>
        <nav className="hidden items-center gap-10 md:flex">
          {data.brand.nav
            .filter(item => {
              if (themeMode === 'creative' && item.label.toLowerCase() === 'work') return false;
              if (themeMode === 'engineering' && item.label.toLowerCase() === 'creative') return false;
              return true;
            })
            .map((item, i) => (
            <a
              key={item.href}
              href={item.href}
              className={`text-[11px] font-medium tracking-[0.25em] uppercase transition-colors hover:text-primary ${
                i === 0 ? "text-primary" : "text-foreground/80"
              }`}
            >
              {item.label}
            </a>
          ))}

          {themeMode !== 'select' && (
            <div className="flex border border-border/40 rounded-full p-0.5 bg-card/25 font-mono text-[9px] tracking-[0.12em] select-none ml-4">
              <button
                onClick={() => {
                  setThemeMode('creative');
                  localStorage.setItem('AP_PORTFOLIO_THEME', 'creative');
                }}
                className={`px-3 py-1 rounded-full transition-all duration-300 cursor-pointer ${
                  themeMode === 'creative' 
                    ? "bg-primary text-background font-semibold" 
                    : "text-foreground/60 hover:text-foreground"
                }`}
              >
                CREATIVE
              </button>
              <button
                onClick={() => {
                  setThemeMode('engineering');
                  localStorage.setItem('AP_PORTFOLIO_THEME', 'engineering');
                }}
                className={`px-3 py-1 rounded-full transition-all duration-300 cursor-pointer ${
                  themeMode === 'engineering' 
                    ? "bg-cyan-500 text-black font-semibold" 
                    : "text-foreground/60 hover:text-foreground"
                }`}
              >
                DEV
              </button>
            </div>
          )}
        </nav>
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="md:hidden text-foreground hover:text-primary transition-colors p-1"
          aria-label="Toggle menu"
        >
          {menuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile Menu Dropdown */}
      {menuOpen && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          transition={{ duration: 0.4, ease: EASE_OUT_EXPO }}
          className="md:hidden w-full bg-background/95 backdrop-blur-2xl border-t border-border overflow-hidden"
        >
          <nav className="flex flex-col px-6 py-8 gap-6">
            {data.brand.nav
              .filter(item => {
                if (themeMode === 'creative' && item.label.toLowerCase() === 'work') return false;
                if (themeMode === 'engineering' && item.label.toLowerCase() === 'creative') return false;
                return true;
              })
              .map((item) => (
              <a
                key={item.href}
                href={item.href}
                onClick={() => setMenuOpen(false)}
                className="text-lg font-serif font-light tracking-wide text-foreground/90 hover:text-primary transition-colors py-1"
              >
                {item.label}
              </a>
            ))}

            {themeMode !== 'select' && (
              <div className="flex border border-border/40 rounded-full p-0.5 bg-card/25 font-mono text-[10px] tracking-[0.12em] select-none mt-4 w-fit">
                <button
                  onClick={() => {
                    setThemeMode('creative');
                    localStorage.setItem('AP_PORTFOLIO_THEME', 'creative');
                    setMenuOpen(false);
                  }}
                  className={`px-4 py-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                    themeMode === 'creative' 
                      ? "bg-primary text-background font-semibold" 
                      : "text-foreground/60 hover:text-foreground"
                  }`}
                >
                  CREATIVE
                </button>
                <button
                  onClick={() => {
                    setThemeMode('engineering');
                    localStorage.setItem('AP_PORTFOLIO_THEME', 'engineering');
                    setMenuOpen(false);
                  }}
                  className={`px-4 py-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                    themeMode === 'engineering' 
                      ? "bg-cyan-500 text-black font-semibold" 
                      : "text-foreground/60 hover:text-foreground"
                  }`}
                >
                  DEV
                </button>
              </div>
            )}
          </nav>
        </motion.div>
      )}
    </motion.header>
  );
}



/* ---------------- Hero ---------------- */
function Hero({
  data,
  activeAudioId,
  setActiveAudioId,
  onMediaReady,
}: {
  data: ReturnType<typeof useContent>;
  activeAudioId: string | null;
  setActiveAudioId: (id: string | null) => void;
  onMediaReady?: () => void;
}) {
  const { scrollY } = useScroll();
  const y = useTransform(scrollY, [0, 800], [0, 200]);
  const scale = useTransform(scrollY, [0, 800], [1, 1.08]);
  const contentY = useTransform(scrollY, [0, 800], [0, -80]);
  const overlayOpacity = useTransform(scrollY, [0, 600], [0.55, 0.95]);
  const arrowOpacity = useTransform(scrollY, [0, 300], [1, 0]);

  const isMuted = activeAudioId !== "hero";

  const mediaUrl = data.hero.media;
  const isVideo =
    /\.(mp4|webm|ogg|mov|m4v)$/i.test(mediaUrl) ||
    mediaUrl.includes("video") ||
    mediaUrl.includes("mixkit");

  return (
    <section
      id="top"
      className="relative h-screen w-full overflow-hidden bg-black"
    >
      <motion.div style={{ y, scale }} className="absolute inset-0">
        {isVideo ? (
          <video
            src={mediaUrl}
            poster={mediaUrl.substring(0, mediaUrl.lastIndexOf('.')) + '_poster.jpg'}
            autoPlay
            loop
            muted={isMuted}
            playsInline
            preload="auto"
            onCanPlayThrough={onMediaReady}
            onLoadedData={onMediaReady}
            className="h-[115%] w-full object-cover"
          />
        ) : (
          <img
            src={mediaUrl}
            alt=""
            onLoad={onMediaReady}
            className="h-[115%] w-full object-cover"
          />
        )}
      </motion.div>
      <motion.div
        style={{ opacity: overlayOpacity }}
        className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/55 to-black"
      />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(0,0,0,0.4)_100%)]" />

      {/* Mute/Unmute toggle button */}
      {isVideo && (
        <button
          onClick={() => setActiveAudioId(isMuted ? "hero" : null)}
          className="absolute right-6 bottom-24 z-20 flex h-10 w-10 items-center justify-center rounded-full border border-foreground/20 bg-background/15 text-foreground backdrop-blur-md transition-all hover:bg-background/30 hover:scale-105 active:scale-95 md:right-12 md:bottom-32"
          aria-label={isMuted ? "Unmute video" : "Mute video"}
        >
          {isMuted ? (
            <VolumeX className="h-5 w-5" strokeWidth={1.5} />
          ) : (
            <Volume2 className="h-5 w-5" strokeWidth={1.5} />
          )}
        </button>
      )}

      <motion.div
        style={{ y: contentY }}
        className="relative z-10 mx-auto flex h-full max-w-[1600px] flex-col justify-end px-6 pb-24 md:px-12 md:pb-32"
      >
        <motion.span
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.3 }}
          className="text-[10px] font-medium tracking-[0.45em] uppercase text-primary"
        >
          {data.hero.eyebrow}
        </motion.span>

        <motion.h1
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2, delay: 0.5, ease: EASE_OUT_EXPO }}
          className="font-serif mt-6 text-6xl font-medium leading-[0.95] tracking-tight text-foreground md:text-8xl lg:text-9xl"
        >
          {data.hero.name}
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.9 }}
          className="mt-6 text-base font-light tracking-wide text-foreground/70 md:text-lg"
        >
          {data.hero.tagline}
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 1.1 }}
          className="mt-10 flex flex-wrap gap-4"
        >
          <a
            href={data.hero.primaryCta.href}
            className="inline-flex items-center justify-center bg-primary px-8 py-3.5 text-[11px] font-semibold tracking-[0.25em] uppercase text-primary-foreground transition-all hover:bg-primary/90 hover:tracking-[0.3em]"
          >
            {data.hero.primaryCta.label}
          </a>
          <a
            href={data.hero.secondaryCta.href}
            className="inline-flex items-center justify-center border border-primary px-8 py-3.5 text-[11px] font-semibold tracking-[0.25em] uppercase text-primary transition-all hover:bg-primary hover:text-primary-foreground"
          >
            {data.hero.secondaryCta.label}
          </a>
        </motion.div>
      </motion.div>

      <motion.a
        href="#work"
        style={{ opacity: arrowOpacity }}
        className="absolute bottom-8 left-1/2 z-10 -translate-x-1/2 text-foreground/60 transition-colors hover:text-primary"
      >
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
        >
          <ChevronDown className="h-6 w-6" strokeWidth={1.25} />
        </motion.div>
      </motion.a>
    </section>
  );
}

/* ---------------- Section heading ---------------- */
function SectionEyebrow({ children }: { children: string }) {
  return (
    <motion.div
      variants={fadeUp}
      transition={{ duration: 0.8, ease: EASE_OUT_EXPO }}
      className="flex items-center gap-4"
    >
      <span className="h-px w-10 bg-primary" />
      <span className="text-[10px] font-medium tracking-[0.4em] uppercase text-primary">
        {children}
      </span>
    </motion.div>
  );
}

/* ---------------- Project Media Loader ---------------- */
function ProjectMedia({
  src,
  title,
  id,
  activeAudioId,
  setActiveAudioId,
}: {
  src: string;
  title: string;
  id: string;
  activeAudioId: string | null;
  setActiveAudioId: (id: string | null) => void;
}) {
  const isHtml = src.endsWith(".html");
  const isVideo = /\.(mp4|webm|ogg|mov|m4v)$/i.test(src);

  if (isHtml) {
    return (
      <iframe
        src={src}
        title={title}
        className="absolute inset-0 w-full h-full border-0 pointer-events-none"
      />
    );
  }

  if (isVideo) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [isHovered, setIsHovered] = useState(false);
    const [inView, setInView] = useState(false);
    const [hasEnteredView, setHasEnteredView] = useState(false);

    useEffect(() => {
      const observer = new IntersectionObserver(
        ([entry]) => {
          const isIntersecting = entry.isIntersecting;
          setInView(isIntersecting);
          if (isIntersecting && !hasEnteredView) {
            setHasEnteredView(true); // Only flip once — start loading src
          }
        },
        { threshold: 0.1, rootMargin: "200px" } // Start loading 200px before it enters view
      );

      if (containerRef.current) {
        observer.observe(containerRef.current);
      }
      return () => observer.disconnect();
    }, [hasEnteredView]);

    useEffect(() => {
      const video = videoRef.current;
      if (!video) return;

      const shouldPlay = inView || isHovered;

      if (shouldPlay) {
        video.play().catch((err) => {
          // Ignore play interruption errors
        });
      } else {
        video.pause();
      }
    }, [inView, isHovered]);

    const poster = src.substring(0, src.lastIndexOf(".")) + "_poster.jpg";

    return (
      <div
        ref={containerRef}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className="relative w-full h-full bg-black flex items-center justify-center"
      >
        <video
          ref={videoRef}
          src={hasEnteredView ? src : undefined} // Don't load src until near viewport
          poster={poster}
          preload={hasEnteredView ? "auto" : "none"} // none = 0 bytes downloaded until needed
          loop
          muted={activeAudioId !== id}
          playsInline
          className="max-h-full max-w-full object-contain"
        />
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setActiveAudioId(activeAudioId === id ? null : id);
          }}
          className="absolute right-4 bottom-4 z-20 flex h-8 w-8 items-center justify-center rounded-full border border-foreground/20 bg-background/15 text-foreground backdrop-blur-md transition-all hover:bg-background/30 hover:scale-105 active:scale-95"
          aria-label={activeAudioId === id ? "Mute video" : "Unmute video"}
        >
          {activeAudioId === id ? (
            <Volume2 className="h-4.5 w-4.5" strokeWidth={1.5} />
          ) : (
            <VolumeX className="h-4.5 w-4.5" strokeWidth={1.5} />
          )}
        </button>
      </div>
    );
  }

  // Fallback to image
  return (
    <motion.img
      src={src}
      alt={title}
      loading="lazy"
      initial={{ scale: 1.15 }}
      whileInView={{ scale: 1 }}
      viewport={{ once: true, margin: "-120px" }}
      transition={{ duration: 1.6, ease: EASE_OUT_EXPO }}
      className="h-full w-full object-cover transition-transform duration-[1400ms] ease-out group-hover:scale-[1.04]"
    />
  );
}

/* ---------------- Selected Work ---------------- */
function SelectedWork({
  data,
  activeAudioId,
  setActiveAudioId,
}: {
  data: ReturnType<typeof useContent>;
  activeAudioId: string | null;
  setActiveAudioId: (id: string | null) => void;
}) {
  const { eyebrow, title, projects, viewAll } = data.selectedWork;
  return (
    <section id="work" className="bg-background px-6 py-32 md:px-12 md:py-44">
      <div className="mx-auto max-w-[1600px]">
        <motion.div
          variants={staggerParent}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-120px" }}
          className="mb-20 flex flex-col items-start gap-6"
        >
          <SectionEyebrow>{eyebrow}</SectionEyebrow>
          <motion.h2
            variants={fadeUp}
            transition={{ duration: 1, ease: EASE_OUT_EXPO }}
            className="font-serif text-5xl font-medium leading-[1.05] tracking-tight md:text-7xl"
          >
            {title}
          </motion.h2>
        </motion.div>

        <div className="flex flex-col gap-20 md:gap-28">
          {projects.map((p, i) => (
            <motion.a
              key={p.id}
              href={p.href}
              initial={{ opacity: 0, y: 80 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-120px" }}
              transition={{ duration: 1.1, ease: EASE_OUT_EXPO }}
              className={`group grid items-center gap-8 md:grid-cols-12 md:gap-12 ${
                i % 2 === 1 ? "md:[&>div:first-child]:order-2" : ""
              }`}
            >
              <div className="md:col-span-8 overflow-hidden bg-card">
                <div className="aspect-[16/10] overflow-hidden relative w-full h-full">
                  {p.image ? (
                    <ProjectMedia
                      src={p.image}
                      title={p.title}
                      id={p.id}
                      activeAudioId={activeAudioId}
                      setActiveAudioId={setActiveAudioId}
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center border border-border bg-card/60">
                      <span className="text-[10px] font-medium tracking-[0.3em] uppercase text-muted-foreground/60">
                        Image coming soon
                      </span>
                    </div>
                  )}
                </div>
              </div>
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-120px" }}
                transition={{ duration: 0.9, delay: 0.2, ease: EASE_OUT_EXPO }}
                className="md:col-span-4 flex flex-col gap-4"
              >
                <span className="text-[10px] font-medium tracking-[0.3em] uppercase text-primary">
                  {p.category}
                </span>
                <h3 className="font-serif text-3xl font-medium leading-tight tracking-tight md:text-4xl">
                  {p.title}
                </h3>
                <p className="text-sm font-light leading-relaxed text-muted-foreground md:text-base">
                  {p.description}
                </p>
                <span className="mt-2 inline-flex items-center gap-2 text-[11px] font-semibold tracking-[0.25em] uppercase text-primary transition-all group-hover:gap-3">
                  View Project <ArrowRight className="h-3.5 w-3.5" strokeWidth={1.5} />
                </span>
              </motion.div>
            </motion.a>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: EASE_OUT_EXPO }}
          className="mt-20 flex justify-center"
        >
          <a
            href={viewAll.href}
            className="inline-flex items-center justify-center border border-primary px-10 py-4 text-[11px] font-semibold tracking-[0.25em] uppercase text-primary transition-all hover:bg-primary hover:text-primary-foreground"
          >
            {viewAll.label}
          </a>
        </motion.div>
      </div>
    </section>
  );
}

/* ---------------- Creative Work ---------------- */
function CreativeWork({
  data,
  activeAudioId,
  setActiveAudioId,
}: {
  data: ReturnType<typeof useContent>;
  activeAudioId: string | null;
  setActiveAudioId: (id: string | null) => void;
}) {
  const { eyebrow, title, projects } = data.creativeWork;
  return (
    <section id="creative" className="bg-background px-6 py-32 md:px-12 md:py-44 border-t border-border">
      <div className="mx-auto max-w-[1600px]">
        <motion.div
          variants={staggerParent}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-120px" }}
          className="mb-20 flex flex-col items-start gap-6"
        >
          <SectionEyebrow>{eyebrow}</SectionEyebrow>
          <motion.h2
            variants={fadeUp}
            transition={{ duration: 1, ease: EASE_OUT_EXPO }}
            className="font-serif text-5xl font-medium leading-[1.05] tracking-tight md:text-7xl"
          >
            {title}
          </motion.h2>
        </motion.div>

        <div className="flex flex-col gap-20 md:gap-28">
          {projects.map((p, i) => (
            <motion.a
              key={p.id}
              href={p.href}
              initial={{ opacity: 0, y: 80 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-120px" }}
              transition={{ duration: 1.1, ease: EASE_OUT_EXPO }}
              className={`group grid items-center gap-8 md:grid-cols-12 md:gap-12 ${
                i % 2 === 1 ? "md:[&>div:first-child]:order-2" : ""
              }`}
            >
              <div className="md:col-span-8 overflow-hidden bg-card">
                <div className="aspect-[16/10] overflow-hidden relative w-full h-full">
                  {p.image ? (
                    <ProjectMedia
                      src={p.image}
                      title={p.title}
                      id={p.id}
                      activeAudioId={activeAudioId}
                      setActiveAudioId={setActiveAudioId}
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center border border-border bg-card/60">
                      <span className="text-[10px] font-medium tracking-[0.3em] uppercase text-muted-foreground/60">
                        Image coming soon
                      </span>
                    </div>
                  )}
                </div>
              </div>
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-120px" }}
                transition={{ duration: 0.9, delay: 0.2, ease: EASE_OUT_EXPO }}
                className="md:col-span-4 flex flex-col gap-4"
              >
                <span className="text-[10px] font-medium tracking-[0.3em] uppercase text-primary">
                  {p.category}
                </span>
                <h3 className="font-serif text-3xl font-medium leading-tight tracking-tight md:text-4xl">
                  {p.title}
                </h3>
                <p
                  className="text-sm font-light leading-relaxed text-muted-foreground md:text-base"
                  dangerouslySetInnerHTML={{ __html: p.description }}
                />
                <span className="mt-2 inline-flex items-center gap-2 text-[11px] font-semibold tracking-[0.25em] uppercase text-primary transition-all group-hover:gap-3">
                  View Edit <ArrowRight className="h-3.5 w-3.5" strokeWidth={1.5} />
                </span>
              </motion.div>
            </motion.a>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------------- UPES Social Media Work ---------------- */
function UPESWork({
  data,
  activeAudioId,
  setActiveAudioId,
}: {
  data: ReturnType<typeof useContent>;
  activeAudioId: string | null;
  setActiveAudioId: (id: string | null) => void;
}) {
  const { eyebrow, title, projects } = data.upesWork;
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: "left" | "right") => {
    if (scrollContainerRef.current) {
      const scrollAmount = window.innerWidth * 0.45;
      scrollContainerRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  return (
    <section id="upes-social" className="bg-background px-6 py-32 md:px-12 md:py-44 border-t border-border overflow-hidden">
      <div className="mx-auto max-w-[1600px]">
        <div className="mb-14 flex flex-col md:flex-row md:items-end md:justify-between gap-8">
          <motion.div
            variants={staggerParent}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-120px" }}
            className="flex flex-col items-start gap-6"
          >
            <SectionEyebrow>{eyebrow}</SectionEyebrow>
            <motion.h2
              variants={fadeUp}
              transition={{ duration: 1, ease: EASE_OUT_EXPO }}
              className="font-serif text-5xl font-medium leading-[1.05] tracking-tight md:text-7xl"
            >
              {title}
            </motion.h2>
          </motion.div>

          {/* Navigation Controls & Message */}
          <div className="flex flex-col items-start md:items-end gap-4">
            <motion.p
              variants={fadeUp}
              transition={{ duration: 1, delay: 0.2, ease: EASE_OUT_EXPO }}
              className="text-[11px] font-light italic text-muted-foreground/70 max-w-[280px] md:text-right"
            >
              *Stopped working with the college media team as there was no room for progress.
            </motion.p>
            <div className="flex gap-4">
              <button
                onClick={() => scroll("left")}
                className="flex h-12 w-12 items-center justify-center rounded-full border border-border bg-card/25 text-foreground backdrop-blur-sm transition-all hover:bg-primary hover:text-primary-foreground hover:border-primary active:scale-95 cursor-pointer"
                aria-label="Scroll left"
              >
                <ArrowRight className="h-5 w-5 rotate-180" strokeWidth={1.5} />
              </button>
              <button
                onClick={() => scroll("right")}
                className="flex h-12 w-12 items-center justify-center rounded-full border border-border bg-card/25 text-foreground backdrop-blur-sm transition-all hover:bg-primary hover:text-primary-foreground hover:border-primary active:scale-95 cursor-pointer"
                aria-label="Scroll right"
              >
                <ArrowRight className="h-5 w-5" strokeWidth={1.5} />
              </button>
            </div>
          </div>
        </div>

        <div
          ref={scrollContainerRef}
          className="flex gap-8 overflow-x-auto snap-x snap-mandatory pb-8 custom-scrollbar scroll-smooth items-stretch hide-scrollbar md:scrollbar-thin"
          style={{ scrollbarWidth: 'thin' }}
        >
          {/* Stacked Landscapes Column */}
          {projects.filter((p) => p.image.includes("fresher") || p.image.includes("reel4")).length > 0 && (
            <div className="flex flex-col gap-6 shrink-0 snap-start w-[85vw] sm:w-[55vw] md:w-[40vw] lg:w-[28vw]">
              {projects
                .filter((p) => p.image.includes("fresher") || p.image.includes("reel4"))
                .map((p) => {
                  const isReel = p.href.includes("reel");
                  return (
                    <motion.a
                      key={p.id}
                      href={p.href}
                      target="_blank"
                      rel="noreferrer"
                      initial={{ opacity: 0, y: 35 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true, margin: "-120px" }}
                      transition={{ duration: 0.9, ease: EASE_OUT_EXPO }}
                      className="group flex flex-col justify-between gap-3 bg-card/25 border border-border/40 p-4 rounded-xl hover:border-primary/40 transition-all duration-300 flex-1 min-h-0"
                    >
                      <div className="overflow-hidden bg-black rounded-lg w-full relative aspect-[16/10]">
                        <ProjectMedia
                          src={p.image}
                          title={p.title}
                          id={p.id}
                          activeAudioId={activeAudioId}
                          setActiveAudioId={setActiveAudioId}
                        />
                      </div>
                      <div className="flex flex-col gap-1.5 mt-1">
                        <span className="text-[9px] font-medium tracking-[0.25em] uppercase text-primary">
                          {p.category}
                        </span>
                        <h3 className="font-serif text-xl font-medium leading-tight tracking-tight text-foreground group-hover:text-primary transition-colors line-clamp-1">
                          {p.title}
                        </h3>
                        <p className="text-[11px] font-light leading-relaxed text-muted-foreground line-clamp-2">
                          {p.description}
                        </p>
                        <span className="mt-1 inline-flex items-center gap-1.5 text-[9px] font-semibold tracking-[0.2em] uppercase text-primary transition-all group-hover:gap-2.5">
                          {isReel ? "View Reel" : "View Project"} <ArrowRight className="h-3 w-3" strokeWidth={1.5} />
                        </span>
                      </div>
                    </motion.a>
                  );
                })}
            </div>
          )}

          {/* Portrait Reels Columns */}
          {projects
            .filter((p) => !p.image.includes("fresher") && !p.image.includes("reel4"))
            .map((p) => {
              const isReel = p.href.includes("reel");
              return (
                <motion.a
                  key={p.id}
                  href={p.href}
                  target="_blank"
                  rel="noreferrer"
                  initial={{ opacity: 0, y: 50 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-120px" }}
                  transition={{ duration: 0.9, ease: EASE_OUT_EXPO }}
                  className="group flex flex-col gap-4 bg-card/25 border border-border/40 p-4 rounded-xl hover:border-primary/40 transition-all duration-300 shrink-0 snap-start w-[85vw] sm:w-[55vw] md:w-[40vw] lg:w-[28vw]"
                >
                  <div className="overflow-hidden bg-black rounded-lg w-full relative aspect-[9/16]">
                    <ProjectMedia
                      src={p.image}
                      title={p.title}
                      id={p.id}
                      activeAudioId={activeAudioId}
                      setActiveAudioId={setActiveAudioId}
                    />
                  </div>
                  <div className="flex flex-col gap-2 mt-2">
                    <span className="text-[9px] font-medium tracking-[0.25em] uppercase text-primary">
                      {p.category}
                    </span>
                    <h3 className="font-serif text-2xl font-medium leading-tight tracking-tight text-foreground group-hover:text-primary transition-colors">
                      {p.title}
                    </h3>
                    <p className="text-xs font-light leading-relaxed text-muted-foreground">
                      {p.description}
                    </p>
                    <span className="mt-2 inline-flex items-center gap-1.5 text-[10px] font-semibold tracking-[0.2em] uppercase text-primary transition-all group-hover:gap-2.5">
                      {isReel ? "View Reel" : "View Project"} <ArrowRight className="h-3 w-3" strokeWidth={1.5} />
                    </span>
                  </div>
                </motion.a>
              );
            })}
        </div>
      </div>
    </section>
  );
}

/* ---------------- Clients (marquee logos) ---------------- */
function Clients({ data }: { data: ReturnType<typeof useContent> }) {
  const { eyebrow, title, logos } = data.clients;
  const loop = [...logos, ...logos];
  return (
    <section className="overflow-hidden border-y border-border bg-card/40 py-24 md:py-32">
      <motion.div
        variants={staggerParent}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        className="mx-auto max-w-[1600px] px-6 md:px-12"
      >
        <div className="mb-14 flex flex-col items-start gap-6">
          <SectionEyebrow>{eyebrow}</SectionEyebrow>
          <motion.h2
            variants={fadeUp}
            transition={{ duration: 1, ease: EASE_OUT_EXPO }}
            className="font-serif text-4xl font-medium leading-tight tracking-tight md:text-5xl"
          >
            {title}
          </motion.h2>
        </div>
      </motion.div>
      <div className="relative">
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-32 bg-gradient-to-r from-background to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-32 bg-gradient-to-l from-background to-transparent" />
        <div className="flex w-max animate-marquee items-center gap-16 px-8">
          {loop.map((name, i) => (
            <div
              key={i}
              className="font-serif shrink-0 text-2xl italic tracking-wide text-foreground/40 transition-colors hover:text-primary md:text-3xl"
            >
              {name}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------------- Certifications ---------------- */
function Certifications({ data }: { data: ReturnType<typeof useContent> }) {
  if (!data.certifications) return null;
  const { eyebrow, title, projects } = data.certifications;
  return (
    <section className="bg-background px-6 py-32 md:px-12 md:py-44 border-t border-border">
      <div className="mx-auto max-w-[1600px]">
        <motion.div
          variants={staggerParent}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-120px" }}
          className="mb-20 flex flex-col items-start gap-6"
        >
          <SectionEyebrow>{eyebrow}</SectionEyebrow>
          <motion.h2
            variants={fadeUp}
            transition={{ duration: 1, ease: EASE_OUT_EXPO }}
            className="font-serif text-5xl font-medium leading-[1.05] tracking-tight md:text-7xl"
          >
            {title}
          </motion.h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-12">
          {projects.map((cert, i) => (
            <motion.div
              key={cert.id}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.8, delay: i * 0.1, ease: EASE_OUT_EXPO }}
              className="group flex flex-col justify-between gap-6 bg-card/25 border border-border/40 rounded-3xl p-8 transition-all duration-500 hover:border-primary/50 hover:bg-card/40 hover:-translate-y-1 hover:shadow-xl hover:shadow-primary/5"
            >
              <div className="flex flex-col gap-4">
                <span className="text-[10px] font-medium tracking-[0.3em] uppercase text-primary">
                  {cert.category}
                </span>
                <h3 className="font-serif text-2xl font-medium leading-tight tracking-tight text-foreground group-hover:text-primary transition-colors">
                  {cert.title}
                </h3>
                <p className="text-sm font-light leading-relaxed text-muted-foreground">
                  {cert.description}
                </p>
              </div>
              <div className="flex flex-col gap-4 mt-4 pt-4 border-t border-border/50">
                <a
                  href={cert.file}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 text-[11px] font-semibold tracking-[0.25em] uppercase text-foreground transition-all hover:text-primary group-hover:gap-3"
                >
                  View Certificate <ArrowRight className="h-3.5 w-3.5" strokeWidth={1.5} />
                </a>
                <a
                  href={cert.href}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 text-[11px] font-semibold tracking-[0.25em] uppercase text-muted-foreground transition-all hover:text-primary"
                >
                  <Linkedin className="h-3.5 w-3.5" strokeWidth={1.5} /> View on LinkedIn
                </a>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------------- About ---------------- */
function About({ data }: { data: ReturnType<typeof useContent> }) {
  const { eyebrow, title, paragraphs, cta, portrait } = data.about;
  return (
    <section id="about" className="bg-background px-6 py-32 md:px-12 md:py-44">
      <div className="mx-auto grid max-w-[1600px] items-center gap-16 md:grid-cols-2 md:gap-24">
        <motion.div
          initial={{ opacity: 0, x: -40, scale: 1.05 }}
          whileInView={{ opacity: 1, x: 0, scale: 1 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 1.2, ease: EASE_OUT_EXPO }}
          className="overflow-hidden"
        >
          <img
            src={portrait}
            alt={data.brand.name}
            loading="lazy"
            className="h-full w-full object-cover"
          />
        </motion.div>
        <motion.div
          variants={staggerParent}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="flex flex-col items-start gap-6"
        >
          <SectionEyebrow>{eyebrow}</SectionEyebrow>
          <motion.h2
            variants={fadeUp}
            transition={{ duration: 1, ease: EASE_OUT_EXPO }}
            className="font-serif text-4xl font-medium leading-[1.1] tracking-tight md:text-6xl"
          >
            {title}
          </motion.h2>
          <motion.div
            variants={fadeUp}
            transition={{ duration: 0.9, ease: EASE_OUT_EXPO }}
            className="mt-2 flex flex-col gap-4 text-base font-light leading-relaxed text-muted-foreground md:text-lg"
          >
            {paragraphs.map((p) => (
              <p key={p}>{p}</p>
            ))}
          </motion.div>
          <motion.a
            variants={fadeUp}
            transition={{ duration: 0.9, ease: EASE_OUT_EXPO }}
            href={cta.href}
            className="mt-6 inline-flex items-center gap-3 border border-primary px-8 py-3.5 text-[11px] font-semibold tracking-[0.25em] uppercase text-primary transition-all hover:bg-primary hover:text-primary-foreground"
          >
            {cta.label}
          </motion.a>
        </motion.div>
      </div>
    </section>
  );
}

/* ---------------- Testimonial ---------------- */
function Testimonial({ data }: { data: ReturnType<typeof useContent> }) {
  const { eyebrow, title, quote, author } = data.testimonial;
  return (
    <section className="border-b border-border bg-card/40 px-6 py-32 md:px-12 md:py-44">
      <motion.div
        variants={staggerParent}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-80px" }}
        className="mx-auto flex max-w-4xl flex-col items-center gap-10 text-center"
      >
        <SectionEyebrow>{eyebrow}</SectionEyebrow>
        <motion.h2
          variants={fadeUp}
          transition={{ duration: 1, ease: EASE_OUT_EXPO }}
          className="font-serif text-3xl font-medium tracking-tight md:text-4xl"
        >
          {title}
        </motion.h2>
        <motion.blockquote
          variants={fadeUp}
          transition={{ duration: 1.1, ease: EASE_OUT_EXPO }}
          className="font-serif text-2xl font-medium italic leading-[1.4] text-foreground/90 md:text-4xl"
        >
          <span className="text-primary">&ldquo;</span>
          {quote}
          <span className="text-primary">&rdquo;</span>
        </motion.blockquote>
        <motion.p
          variants={fadeUp}
          transition={{ duration: 0.8, ease: EASE_OUT_EXPO }}
          className="text-[11px] font-medium tracking-[0.3em] uppercase text-muted-foreground"
        >
          — {author}
        </motion.p>
      </motion.div>
    </section>
  );
}

/* ---------------- CTA / Footer ---------------- */
function CallToAction({ data, isEngineering }: { data: ReturnType<typeof useContent>; isEngineering?: boolean }) {
  const { eyebrow, title, description, email, socials } = isEngineering ? data.devCta : data.cta;
  const iconFor = (label: string) =>
    label === "Instagram"
      ? Instagram
      : label === "YouTube"
      ? Youtube
      : label === "GitHub"
      ? Github
      : label === "LinkedIn"
      ? Linkedin
      : Mail;

  return (
    <footer
      id="contact"
      className="relative overflow-hidden border-t border-border px-6 py-32 md:px-12 md:py-44"
    >
      {/* Background Image with Overlay */}
      <div className="absolute inset-0 z-0">
        {!isEngineering && (
          <img
            src="/letsconnect.jpg"
            className="h-full w-full object-cover object-center"
            alt="Let's connect"
          />
        )}
        <div className={`absolute inset-0 ${isEngineering ? 'bg-[#070b12]' : 'bg-black/75 backdrop-blur-[2px]'}`} />
        {isEngineering && (
          <div className="absolute inset-0 bg-[linear-gradient(rgba(100,150,210,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(100,150,210,0.04)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />
        )}
      </div>

      <div className="relative z-10 mx-auto flex max-w-[1600px] flex-col gap-20">
        <motion.div
          variants={staggerParent}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="flex flex-col items-start gap-8"
        >
          <SectionEyebrow>{eyebrow}</SectionEyebrow>
          <motion.h2
            variants={fadeUp}
            transition={{ duration: 1.1, ease: EASE_OUT_EXPO }}
            className={`max-w-4xl text-5xl font-medium leading-[1.02] tracking-tight md:text-8xl ${isEngineering ? 'font-mono text-[#a8c4e0]' : 'font-serif'}`}
          >
            {title}
          </motion.h2>
          <motion.p
            variants={fadeUp}
            transition={{ duration: 0.9, ease: EASE_OUT_EXPO }}
            className={`max-w-xl text-base font-light leading-relaxed md:text-lg ${isEngineering ? 'font-mono text-[rgba(120,160,200,0.7)]' : 'text-muted-foreground'}`}
          >
            {description}
          </motion.p>
          <motion.a
            variants={fadeUp}
            transition={{ duration: 0.9, ease: EASE_OUT_EXPO }}
            href={`mailto:${email}`}
            className={`mt-4 inline-flex max-w-full items-center gap-2 px-4 py-3 md:px-10 md:py-4 text-[10px] md:text-[11px] font-semibold tracking-[0.12em] md:tracking-[0.25em] uppercase transition-all hover:gap-4 ${
              isEngineering 
                ? 'bg-[rgba(55,138,221,0.1)] border border-[rgba(55,138,221,0.3)] text-[#a8c4e0] hover:bg-[rgba(55,138,221,0.2)]'
                : 'bg-primary text-primary-foreground hover:bg-primary/90'
            }`}
          >
            <Mail className="h-4 w-4" strokeWidth={1.75} />
            <span className="truncate">{email}</span>
          </motion.a>
        </motion.div>

        <div className="flex flex-col gap-8 border-t border-border pt-12 md:flex-row md:items-end md:justify-between">

          <div className="flex flex-col gap-4">
            <span className="font-serif text-3xl italic text-foreground">
              {data.brand.monogram}
            </span>
            <span className="text-[11px] font-medium tracking-[0.3em] uppercase text-muted-foreground">
              {data.brand.location} · {data.brand.name}
            </span>
          </div>
          <div className="flex flex-col gap-3 md:items-end">
            <span className="text-[10px] font-medium tracking-[0.4em] uppercase text-muted-foreground">
              Elsewhere
            </span>
            <div className="flex gap-6">
              {socials.map((s) => {
                const Icon = iconFor(s.label);
                return (
                  <a
                    key={s.label}
                    href={s.href}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 text-sm font-light text-foreground/70 transition-colors hover:text-primary"
                  >
                    <Icon className="h-4 w-4" strokeWidth={1.5} />
                    {s.label}
                  </a>
                );
              })}
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-2 text-[11px] tracking-[0.2em] uppercase text-muted-foreground/70 md:flex-row md:items-center md:justify-between">
          <span>© {new Date().getFullYear()} {data.brand.name}. All rights reserved.</span>
          <span>Cinematic Storytelling</span>
        </div>
      </div>
    </footer>
  );
}

/* ---------------- Creative Tools (marquee logos) ---------------- */
function CreativeTools({ data }: { data: ReturnType<typeof useContent> }) {
  const { eyebrow, title, logos } = data.creativeTools;
  const loop = [...logos, ...logos];
  return (
    <section className="overflow-hidden border-b border-border bg-card/40 py-24 md:py-32">
      <motion.div
        variants={staggerParent}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        className="mx-auto max-w-[1600px] px-6 md:px-12"
      >
        <div className="mb-14 flex flex-col items-start gap-6">
          <SectionEyebrow>{eyebrow}</SectionEyebrow>
          <motion.h2
            variants={fadeUp}
            transition={{ duration: 1, ease: EASE_OUT_EXPO }}
            className="font-serif text-4xl font-medium leading-tight tracking-tight md:text-5xl"
          >
            {title}
          </motion.h2>
        </div>
      </motion.div>
      <div className="relative">
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-32 bg-gradient-to-r from-background to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-32 bg-gradient-to-l from-background to-transparent" />
        <div className="flex w-max animate-marquee items-center gap-16 px-8">
          {loop.map((name, i) => (
            <div
              key={i}
              className="font-serif shrink-0 text-2xl italic tracking-wide text-foreground/40 transition-colors hover:text-primary md:text-3xl"
            >
              {name}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function WorkedWith({
  data,
  activeAudioId,
  setActiveAudioId,
}: {
  data: ReturnType<typeof useContent>;
  activeAudioId: string | null;
  setActiveAudioId: (id: string | null) => void;
}) {
  if (!data.workedWith) return null;
  const { eyebrow, title, brands } = data.workedWith;
  return (
    <section className="bg-background px-6 py-32 md:px-12 md:py-44 border-t border-border">
      <div className="mx-auto max-w-[1600px]">
        <motion.div
          variants={staggerParent}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-120px" }}
          className="mb-20 flex flex-col items-start gap-6"
        >
          <SectionEyebrow>{eyebrow}</SectionEyebrow>
          <motion.h2
            variants={fadeUp}
            transition={{ duration: 1, ease: EASE_OUT_EXPO }}
            className="font-serif text-5xl font-medium leading-[1.05] tracking-tight md:text-7xl"
          >
            {title}
          </motion.h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12 lg:gap-16">
          {brands.map((brand, i) => {
            const content = (
              <>
                <div className="h-20 w-full flex items-center justify-start overflow-hidden">
                  {brand.logo.match(/\.(mp4|webm|ogg|mov|m4v)$/i) ? (
                    <div className="h-full w-auto max-w-[80%] rounded-md transition-transform duration-500 group-hover:scale-[1.03]">
                      <ProjectMedia 
                        src={brand.logo}
                        title={brand.name}
                        id={`brand-${i}`}
                        activeAudioId={activeAudioId}
                        setActiveAudioId={setActiveAudioId}
                      />
                    </div>
                  ) : (
                    <img
                      src={brand.logo}
                      alt={brand.name}
                      loading="lazy"
                      className="h-full w-auto object-contain max-w-[80%] transition-transform duration-500 group-hover:scale-[1.03]"
                    />
                  )}
                </div>
                <div className="flex flex-col gap-3">
                  <h3 className="font-serif text-3xl italic tracking-wide text-foreground group-hover:text-primary transition-colors flex items-center justify-between">
                    {brand.name}
                    {brand.href && <ArrowRight className="h-5 w-5 opacity-0 transition-opacity group-hover:opacity-100" strokeWidth={1.5} />}
                  </h3>
                  <p className="text-sm font-light leading-relaxed text-muted-foreground">
                    {brand.description}
                  </p>
                </div>
              </>
            );

            const className = `flex flex-col gap-6 group bg-card/25 border border-border/40 rounded-3xl p-8 transition-all duration-500 hover:border-primary/50 hover:bg-card/40 hover:-translate-y-1 hover:shadow-xl hover:shadow-primary/5 ${brand.href ? 'cursor-pointer' : 'cursor-default'}`;

            return brand.href ? (
              <motion.a
                key={brand.name}
                href={brand.href}
                target="_blank"
                rel="noreferrer"
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ duration: 0.8, delay: i * 0.1, ease: EASE_OUT_EXPO }}
                className={className}
              >
                {content}
              </motion.a>
            ) : (
              <motion.div
                key={brand.name}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ duration: 0.8, delay: i * 0.1, ease: EASE_OUT_EXPO }}
                className={className}
              >
                {content}
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function Index() {
  const data = useContent();
  const [activeAudioId, setActiveAudioId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [mediaReady, setMediaReady] = useState(false);
  const [minTimeElapsed, setMinTimeElapsed] = useState(false);
  const [isPreloaderMounted, setIsPreloaderMounted] = useState(true);
  const [showEnter, setShowEnter] = useState(false);
  const [countdown, setCountdown] = useState(10);

  // Staged timeline sequence states
  const [videoVisible, setVideoVisible] = useState(false);
  const [wordsVisible, setWordsVisible] = useState(false);

  const [themeMode, setThemeMode] = useState<'select' | 'creative' | 'engineering'>('select');
  const [hoverMode, setHoverMode] = useState<'none' | 'creative' | 'engineering'>('none');

  // Hydration-safe localStorage check
  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("AP_PORTFOLIO_THEME");
      if (saved === "creative" || saved === "engineering") {
        setThemeMode(saved as 'creative' | 'engineering');
      }
    }
  }, []);

  // Stop all running videos and audios in the document when tab is hidden, and resume them when active
  useEffect(() => {
    const pausedMedias: (HTMLVideoElement | HTMLAudioElement)[] = [];

    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Query all video elements
        const videos = document.querySelectorAll('video');
        videos.forEach(video => {
          if (!video.paused) {
            video.pause();
            pausedMedias.push(video);
          }
        });

        // Query all audio elements
        const audios = document.querySelectorAll('audio');
        audios.forEach(audio => {
          if (!audio.paused) {
            audio.pause();
            pausedMedias.push(audio);
          }
        });
      } else {
        // Resume previously playing media
        while (pausedMedias.length > 0) {
          const media = pausedMedias.pop();
          if (media) {
            media.play().catch(err => {
              console.warn("Failed to resume playback on tab focus:", err);
            });
          }
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // Handle Choice Selection
  const handleChoice = (choice: 'creative' | 'engineering') => {
    setThemeMode(choice);
    if (typeof window !== "undefined") {
      localStorage.setItem("AP_PORTFOLIO_THEME", choice);
    }
    setIsLoading(false);
  };

  // Scroll to top when clicking the navbar coin logo
  const handleLogoClick = () => {
    if (!isLoading) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  useEffect(() => {
    // Clear hash on mount
    if (typeof window !== "undefined" && window.location.hash) {
      window.history.replaceState(null, '', window.location.pathname);
    }
    // Absolute maximum: if nothing happens in 15s, force entry with creative fallback
    const maxTimer = setTimeout(() => {
      if (isLoading) {
        handleChoice('creative');
      }
    }, 15000);
    return () => clearTimeout(maxTimer);
  }, []);

  useEffect(() => {
    // 2.5s: Background video awakens
    const videoTimer = setTimeout(() => setVideoVisible(true), 2500);

    // 4.5s: Sequential words begin
    const wordsTimer = setTimeout(() => setWordsVisible(true), 4500);

    // 6.0s: Enter Site button appears
    const buttonTimer = setTimeout(() => setMinTimeElapsed(true), 6000);

    return () => {
      clearTimeout(videoTimer);
      clearTimeout(wordsTimer);
      clearTimeout(buttonTimer);
    };
  }, []);

  useEffect(() => {
    // Show enter button once min time has passed
    if (minTimeElapsed && !showEnter) {
      setShowEnter(true);
    }
  }, [minTimeElapsed, showEnter]);

  // 10-second countdown once enter button appears
  useEffect(() => {
    if (!showEnter) return;
    setCountdown(10);
    const interval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          handleChoice('creative');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [showEnter]);

  useEffect(() => {
    if (isLoading || themeMode === 'select') {
      document.body.style.overflow = "hidden";
      
      // Force scroll to top immediately and on scroll events to prevent scroll position restore/shifts
      window.scrollTo(0, 0);
      const handleScroll = () => {
        if (window.scrollY !== 0 || window.scrollX !== 0) {
          window.scrollTo(0, 0);
        }
      };

      // Prevent wheel & touch scroll gestures on mobile & desktop
      const handleWheelTouch = (e: Event) => {
        e.preventDefault();
      };

      // Prevent keyboard-driven scrolling (spacebar, arrow keys, page up/down, home/end)
      const handleKeyDown = (e: KeyboardEvent) => {
        if (["Space", "ArrowUp", "ArrowDown", "PageUp", "PageDown", "Home", "End"].includes(e.code)) {
          e.preventDefault();
        }
      };

      window.addEventListener("scroll", handleScroll, { passive: false });
      window.addEventListener("wheel", handleWheelTouch, { passive: false });
      window.addEventListener("touchmove", handleWheelTouch, { passive: false });
      window.addEventListener("keydown", handleKeyDown, { passive: false });

      return () => {
        window.removeEventListener("scroll", handleScroll);
        window.removeEventListener("wheel", handleWheelTouch);
        window.removeEventListener("touchmove", handleWheelTouch);
        window.removeEventListener("keydown", handleKeyDown);
        document.body.style.overflow = "unset";
      };
    } else {
      document.body.style.overflow = "unset";
      window.scrollTo(0, 0);
    }
  }, [isLoading, themeMode]);

  const coinState = isLoading || themeMode === 'select' ? 'preloader' : 'navbar';

  return (
    <div className="bg-black min-h-screen">
      <AnimatePresence>
        {isPreloaderMounted && (
          <Preloader 
            monogram={data.brand.monogram} 
            triggerTransition={!isLoading}
            onComplete={() => setIsPreloaderMounted(false)}
            showEnter={showEnter}
            onChoice={handleChoice}
            setHoverMode={setHoverMode}
            countdown={countdown}
            videoVisible={videoVisible}
            wordsVisible={wordsVisible}
          />
        )}
      </AnimatePresence>

      <motion.div 
        className="relative min-h-screen bg-background text-foreground antialiased selection:bg-primary/30 selection:text-primary"
        initial={{ opacity: 0, scale: 0.92, filter: "blur(8px)" }}
        animate={{ 
          opacity: isLoading ? 0 : 1, 
          scale: isLoading ? 0.92 : 1, 
          filter: isLoading ? "blur(8px)" : "blur(0px)" 
        }}
        transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
      >
        <Header data={data} isLoading={isLoading} themeMode={themeMode} setThemeMode={setThemeMode} />
        
        {/* NEW: Vision Intro Sequence */}

        {/* CONDITIONAL RENDER: CREATIVE PATH */}
        {themeMode === 'creative' && (
          <>
            <RadialIntroSequence>
              <Hero 
                data={data} 
                activeAudioId={activeAudioId} 
                setActiveAudioId={setActiveAudioId} 
                onMediaReady={() => setMediaReady(true)}
              />
            </RadialIntroSequence>
            <CreativeWork data={data} activeAudioId={activeAudioId} setActiveAudioId={setActiveAudioId} />
            <UPESWork data={data} activeAudioId={activeAudioId} setActiveAudioId={setActiveAudioId} />
            <WorkedWith data={data} activeAudioId={activeAudioId} setActiveAudioId={setActiveAudioId} />
            <CreativeTools data={data} />
            
            {/* --- DOME GALLERY SECTION --- */}
            <section className="relative w-full h-[100vh] bg-black overflow-hidden flex flex-col items-center justify-center border-t border-white/10">
              <div className="absolute top-20 z-20 text-center pointer-events-none">
                <h2 className="text-4xl md:text-5xl font-bold tracking-tighter uppercase mb-4 opacity-90">Dome Gallery</h2>
                <p className="text-xs md:text-sm text-gray-400 font-mono tracking-widest uppercase">Instagram Highlights & Posts</p>
              </div>
              {/* The DomeGallery itself is fully interactive */}
              <div className="w-full h-full cursor-grab active:cursor-grabbing">
                <DomeGallery images={domeGalleryImages} />
              </div>
            </section>
          </>
        )}

        {/* CONDITIONAL RENDER: SYSTEMS ENGINEER PATH */}
        {themeMode === 'engineering' && (
          <>
            <EngineeringPortfolio data={data} />
            <GithubSection />
          </>
        )}

        {/* SHARED SECTIONS */}
        {themeMode !== 'select' && (
          <>
            <About data={data} />
            <Testimonial data={data} />
            <CallToAction data={data} isEngineering={themeMode === 'engineering'} />
          </>
        )}
      </motion.div>



      {/* 3D Monogram - Globally positioned for seamless flight to Navbar logo placeholder (Rendered at bottom of DOM to ensure z-index priority) */}
      {(isPreloaderMounted || coinState === 'navbar' || themeMode === 'select') && (
        <motion.div
          layout
          transition={{ duration: 1.6, ease: [0.16, 1, 0.3, 1] }}
          onClick={handleLogoClick}
          className={
            coinState === 'preloader'
              ? "fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[320px] h-[320px] md:w-[420px] md:h-[420px] z-[110] pointer-events-auto"
              : themeMode === 'select'
              ? "fixed inset-0 z-50 flex items-center justify-center pointer-events-auto"
              : "fixed left-6 md:left-[48px] top-6 translate-x-0 translate-y-0 w-12 h-12 md:w-16 md:h-16 z-[60] pointer-events-auto cursor-pointer"
          }
        >
          <AP3DMonogram isMini={coinState === 'navbar'} themeMode={isLoading ? 'select' : themeMode} hoverMode={hoverMode} />
        </motion.div>
      )}
    </div>
  );
}
