import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useRef } from "react";
import { motion, useScroll, useTransform, AnimatePresence, useMotionValue, useSpring } from "framer-motion";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { CanvasSequence } from "../components/CanvasSequence";
import { WebGLTransition, WebGLTransitionRef } from "../components/WebGLTransition";
import { ChevronDown, Instagram, Youtube, Github, Linkedin, Mail, ArrowRight, Volume2, VolumeX, Menu, X, Loader2 } from "lucide-react";

import { siteData } from "@/lib/site-data";
import { useContent } from "@/lib/use-content";

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
function Preloader({ monogram, triggerTransition, onComplete }: { monogram: string, triggerTransition: boolean, onComplete: () => void }) {
  const [index, setIndex] = useState(0);
  const words = ["Code.", "Vision.", "Cinematography."];
  const videoRef = useRef<HTMLVideoElement>(null);
  const webGLRef = useRef<WebGLTransitionRef>(null);

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
    if (index < words.length - 1) {
      const timer = setTimeout(() => setIndex(index + 1), 800);
      return () => clearTimeout(timer);
    }
  }, [index, words.length]);

  useEffect(() => {
    if (triggerTransition) {
      const runTransition = async () => {
        // Fade out monogram and text
        gsap.to(".preloader-content", { opacity: 0, duration: 0.8, ease: "power2.out" });
        
        if (webGLRef.current) {
          await webGLRef.current.startTransition();
        }
        
        onComplete();
      };
      runTransition();
    }
  }, [triggerTransition, onComplete]);

  return (
    <motion.div
      initial={{ opacity: 1, scale: 1, filter: "blur(0px) brightness(1)" }}
      exit={{ opacity: 0, filter: "blur(10px) brightness(1.2)" }}
      transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black overflow-hidden cursor-none"
    >
      {/* WebGL Background */}
      <WebGLTransition ref={webGLRef} />
      
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

      <div className="z-10 flex flex-col items-center gap-4 pointer-events-none preloader-content">
        <motion.h1
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, ease: EASE_OUT_EXPO }}
          className="inline-block px-4 py-2 font-serif text-7xl md:text-9xl italic tracking-wide text-foreground drop-shadow-2xl leading-none"
        >
          AP
        </motion.h1>

        <div className="h-6 flex items-center justify-center">
          <AnimatePresence mode="wait">
            <motion.span
              key={index}
              initial={{ opacity: 0, y: 10, filter: "blur(4px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: -10, filter: "blur(4px)" }}
              transition={{ duration: 0.4, ease: EASE_OUT_EXPO }}
              className="font-serif text-sm md:text-lg tracking-[0.3em] uppercase text-muted-foreground/70"
            >
              {words[index]}
            </motion.span>
          </AnimatePresence>
        </div>
        
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 1 }}
          className="mt-6 h-[2px] w-48 md:w-80 lg:w-[450px] overflow-hidden bg-white/10 rounded-full"
        >
          <motion.div
            initial={{ x: "-100%" }}
            animate={{ x: "100%" }}
            transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
            className="h-full w-full bg-primary"
          />
        </motion.div>
      </div>
    </motion.div>
  );
}

/* ---------------- Header ---------------- */
function Header({ data, isLoading }: { data: ReturnType<typeof useContent>; isLoading: boolean }) {
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
        <a href="#top" className="flex items-center gap-2" onClick={() => setMenuOpen(false)}>
          <span className="font-serif text-2xl italic text-foreground inline-block">
            {data.brand.monogram}
          </span>
        </a>
        <nav className="hidden items-center gap-10 md:flex">
          {data.brand.nav.map((item, i) => (
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
            {data.brand.nav.map((item) => (
              <a
                key={item.href}
                href={item.href}
                onClick={() => setMenuOpen(false)}
                className="text-lg font-serif font-light tracking-wide text-foreground/90 hover:text-primary transition-colors py-1"
              >
                {item.label}
              </a>
            ))}
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
          mediaUrl === "/DARK.mp4" ? (
            <CanvasSequence
              folderPath="/hero-seq"
              frameCount={320}
              fps={15}
              width={1280}
              height={546}
              className="h-[115%] w-full object-cover"
              onReady={onMediaReady}
              scrollScrub={false}
            />
          ) : (
            <video
              src={mediaUrl}
              poster={mediaUrl.substring(0, mediaUrl.lastIndexOf('.')) + '_poster.jpg'}
              autoPlay
              loop
              muted={isMuted}
              playsInline
              onCanPlayThrough={onMediaReady}
              onLoadedData={onMediaReady}
              className="h-[115%] w-full object-cover"
            />
          )
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

    useEffect(() => {
      const observer = new IntersectionObserver(
        ([entry]) => {
          setInView(entry.isIntersecting);
        },
        { threshold: 0.15 }
      );

      if (containerRef.current) {
        observer.observe(containerRef.current);
      }
      return () => observer.disconnect();
    }, []);

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
          src={src}
          poster={poster}
          preload="metadata"
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
    <section className="border-y border-border bg-card/40 px-6 py-32 md:px-12 md:py-44">
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
function CallToAction({ data }: { data: ReturnType<typeof useContent> }) {
  const { eyebrow, title, description, email, socials } = data.cta;
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
        <img
          src="/letsconnect.jpg"
          className="h-full w-full object-cover object-center"
        />
        <div className="absolute inset-0 bg-black/75 backdrop-blur-[2px]" />
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
            className="font-serif max-w-4xl text-5xl font-medium leading-[1.02] tracking-tight md:text-8xl"
          >
            {title}
          </motion.h2>
          <motion.p
            variants={fadeUp}
            transition={{ duration: 0.9, ease: EASE_OUT_EXPO }}
            className="max-w-xl text-base font-light leading-relaxed text-muted-foreground md:text-lg"
          >
            {description}
          </motion.p>
          <motion.a
            variants={fadeUp}
            transition={{ duration: 0.9, ease: EASE_OUT_EXPO }}
            href={`mailto:${email}`}
            className="mt-4 inline-flex max-w-full items-center gap-2 bg-primary px-4 py-3 md:px-10 md:py-4 text-[10px] md:text-[11px] font-semibold tracking-[0.12em] md:tracking-[0.25em] uppercase text-primary-foreground transition-all hover:bg-primary/90 hover:gap-4"
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

  useEffect(() => {
    // Clear hash on mount so browser doesn't forcefully auto-scroll to an anchor (like #work) on refresh
    if (typeof window !== "undefined" && window.location.hash) {
      window.history.replaceState(null, '', window.location.pathname);
    }

    // Enforce a minimum loading time of 2.5 seconds to let other videos buffer
    const minTimer = setTimeout(() => setMinTimeElapsed(true), 2500);
    // Absolute maximum loading time of 4.5 seconds (fallback)
    const maxTimer = setTimeout(() => setIsLoading(false), 4500);
    
    return () => {
      clearTimeout(maxTimer);
    };
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => setMinTimeElapsed(true), 1200);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    // Only dismiss the loading screen if the hero video is ready AND 2.5 seconds have passed
    if (mediaReady && minTimeElapsed) {
      setIsLoading(false);
    }
  }, [mediaReady, minTimeElapsed]);

  useEffect(() => {
    if (isLoading) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
      // Force scroll to top when loading finishes to prevent jumping to lower sections
      window.scrollTo(0, 0);
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isLoading]);

  return (
    <div className="bg-black min-h-screen">
      <AnimatePresence>
        {isPreloaderMounted && (
          <Preloader 
            monogram={data.brand.monogram} 
            triggerTransition={!isLoading}
            onComplete={() => setIsPreloaderMounted(false)}
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
        <Header data={data} isLoading={isLoading} />
        <Hero 
          data={data} 
          activeAudioId={activeAudioId} 
          setActiveAudioId={setActiveAudioId} 
          onMediaReady={() => setMediaReady(true)}
        />
      <SelectedWork data={data} activeAudioId={activeAudioId} setActiveAudioId={setActiveAudioId} />
      <Clients data={data} />
      <Certifications data={data} />
      <CreativeWork data={data} activeAudioId={activeAudioId} setActiveAudioId={setActiveAudioId} />
      <UPESWork data={data} activeAudioId={activeAudioId} setActiveAudioId={setActiveAudioId} />
      <WorkedWith data={data} activeAudioId={activeAudioId} setActiveAudioId={setActiveAudioId} />
      <CreativeTools data={data} />
      <About data={data} />
      <Testimonial data={data} />
      <CallToAction data={data} />
      </motion.div>
    </div>
  );
}
