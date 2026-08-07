import { useEffect, useRef, useState, useMemo } from "react";
import { X, Volume2, VolumeX, Trophy, ArrowRight, ArrowLeft, Sparkles, Film, ExternalLink } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Mission {
  id: number;
  title: string;
  objective: string;
  tag: string;
  image: string;
  difficulty?: string;
  unlocks?: string;
}

const MISSIONS: Mission[] = [
  {
    id: 1,
    tag: "Ticket 1 — The Setup",
    title: "Who I Am",
    objective: "Computer Science Major at UPES",
    image: "/about.jpg",
    difficulty: "EASY",
    unlocks: "Personal Bio",
  },
  {
    id: 2,
    tag: "Ticket 2 — The Strategy",
    title: "Off Screen",
    objective: "Football, Running & Chess Strategy",
    image: "/DOMEGALLERY/IMG_1470.JPG",
    difficulty: "MEDIUM",
    unlocks: "Pattern Recognition",
  },
  {
    id: 3,
    tag: "Ticket 3 — Top Cuts",
    title: "Four Films I Keep Coming Back To",
    objective: "Letterboxd Film Diary & Aesthetics",
    image: "/DOMEGALLERY/IMG_2036.JPG",
    difficulty: "MEDIUM",
    unlocks: "Cinematic Perspective",
  },
  {
    id: 4,
    tag: "Ticket 4 — The Logic",
    title: "Method to the Madness",
    objective: "Logic Gates & Problem Deconstruction",
    image: "/DOMEGALLERY/IMG_4903.jpeg",
    difficulty: "HARD",
    unlocks: "System Logic",
  },
  {
    id: 5,
    tag: "Ticket 5 — The Writer",
    title: "Silent Background",
    objective: "Substack Essays & Life Facts",
    image: "/DOMEGALLERY/IMG_1353.jpeg",
    difficulty: "EASY",
    unlocks: "Substack Archives",
  },
  {
    id: 6,
    tag: "Final Reel",
    title: "Director's Cut",
    objective: "Interactive Portfolio Complete",
    image: "/about.jpg",
  },
];

const FILMS = [
  {
    title: "Beautiful Boy",
    url: "https://a.ltrbxd.com/resized/film-poster/3/8/4/0/5/8/384058-beautiful-boy-0-230-0-345-crop.jpg?v=fb10cce0",
  },
  {
    title: "The Perks of Being a Wallflower",
    url: "https://a.ltrbxd.com/resized/film-poster/7/1/3/3/8/71338-the-perks-of-being-a-wallflower-0-230-0-345-crop.jpg?v=d2c4c804",
  },
  {
    title: "Good Will Hunting",
    url: "https://a.ltrbxd.com/resized/film-poster/5/1/6/2/1/51621-good-will-hunting-0-230-0-345-crop.jpg?v=f1139f66",
  },
  {
    title: "Dil Bechara",
    url: "https://a.ltrbxd.com/resized/film-poster/5/7/1/3/9/1/571391-dil-bechara-0-230-0-345-crop.jpg?v=bad1a4cb",
  },
];

// Web Audio API Sound Synthesizer
const useSound = (enabled: boolean) => {
  return useMemo(() => {
    const playSound = (freq: number, dur: number, type: OscillatorType, vol: number, delay = 0) => {
      if (!enabled) return;
      try {
        const ac = new (window.AudioContext || (window as any).webkitAudioContext)();
        const t0 = ac.currentTime + delay;
        const osc = ac.createOscillator();
        const gain = ac.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, t0);
        gain.gain.setValueAtTime(0, t0);
        gain.gain.linearRampToValueAtTime(vol, t0 + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
        osc.connect(gain).connect(ac.destination);
        osc.start(t0);
        osc.stop(t0 + dur + 0.02);
      } catch (e) {}
    };

    return {
      click: () => playSound(800, 0.05, "sine", 0.06),
      chime: () => {
        playSound(1046, 0.1, "sine", 0.08);
        playSound(1318, 0.1, "sine", 0.08, 0.05);
      },
      sketch: () => {
        for (let i = 0; i < 4; i++) {
          playSound(300 + Math.random() * 400, 0.03, "sawtooth", 0.03, i * 0.04);
        }
      },
      flip: () => playSound(600, 0.06, "sine", 0.05),
      printer: () => {
        for (let i = 0; i < 5; i++) {
          playSound(700 + Math.random() * 300, 0.03, "square", 0.04, i * 0.05);
        }
      },
    };
  }, [enabled]);
};

/* -----------------------------------------------------
   CANVAS LIVE INTERACTIVE HOVER PENCIL SKETCH ENGINE
   ----------------------------------------------------- */
function CanvasSketchEngine({
  imageSrc,
  isSketchMode,
  sfx,
  title,
}: {
  imageSrc: string;
  isSketchMode: boolean;
  sfx: any;
  title: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(null);
  const [isHovered, setIsHovered] = useState(false);

  const photoCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const sketchCanvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = imageSrc;

    img.onload = () => {
      const parent = canvas.parentElement;
      const width = parent?.clientWidth || 600;
      const height = parent?.clientHeight || 450;
      canvas.width = width;
      canvas.height = height;

      // 1. Offscreen Photo Canvas (Crisp & Bright)
      const pCanvas = document.createElement("canvas");
      pCanvas.width = width;
      pCanvas.height = height;
      const pCtx = pCanvas.getContext("2d");
      if (!pCtx) return;

      const imgAspect = img.naturalWidth / img.naturalHeight;
      const canvasAspect = width / height;
      let renderW = width;
      let renderH = height;
      let offsetX = 0;
      let offsetY = 0;

      if (imgAspect > canvasAspect) {
        renderW = height * imgAspect;
        offsetX = -(renderW - width) / 2;
      } else {
        renderH = width / imgAspect;
        offsetY = -(renderH - height) / 2;
      }

      pCtx.drawImage(img, offsetX, offsetY, renderW, renderH);
      photoCanvasRef.current = pCanvas;

      // 2. Offscreen Pencil Sketch Canvas (Clean, Bright Light-Mode Graphite Sketch)
      const sCanvas = document.createElement("canvas");
      sCanvas.width = width;
      sCanvas.height = height;
      const sCtx = sCanvas.getContext("2d");
      if (!sCtx) return;

      // Draw paper background
      sCtx.fillStyle = "#f5f3eb"; // Warm off-white paper
      sCtx.fillRect(0, 0, width, height);

      // Fine grid texture
      sCtx.strokeStyle = "rgba(0, 0, 0, 0.04)";
      sCtx.lineWidth = 1;
      for (let x = 0; x < width; x += 25) {
        sCtx.beginPath();
        sCtx.moveTo(x, 0);
        sCtx.lineTo(x, height);
        sCtx.stroke();
      }
      for (let y = 0; y < height; y += 25) {
        sCtx.beginPath();
        sCtx.moveTo(0, y);
        sCtx.lineTo(width, y);
        sCtx.stroke();
      }

      // Edge detection processing
      const imageData = pCtx.getImageData(0, 0, width, height);
      const data = imageData.data;
      const gray = new Uint8Array(width * height);

      for (let i = 0; i < data.length; i += 4) {
        gray[i / 4] = Math.round(0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]);
      }

      const sketchData = sCtx.createImageData(width, height);
      const sData = sketchData.data;

      for (let y = 1; y < height - 1; y++) {
        for (let x = 1; x < width - 1; x++) {
          const idx = y * width + x;

          const gx =
            -gray[idx - width - 1] +
            gray[idx - width + 1] -
            2 * gray[idx - 1] +
            2 * gray[idx + 1] -
            gray[idx + width - 1] +
            gray[idx + width + 1];

          const gy =
            -gray[idx - width - 1] -
            2 * gray[idx - width] -
            gray[idx - width + 1] +
            gray[idx + width - 1] +
            2 * gray[idx + width] +
            gray[idx + width + 1];

          const mag = Math.min(255, Math.sqrt(gx * gx + gy * gy) * 2.5);
          const strokeVal = 245 - mag; // Graphite strokes on light paper
          const pixelIdx = idx * 4;

          sData[pixelIdx] = strokeVal * 0.2; // Graphite R
          sData[pixelIdx + 1] = strokeVal * 0.2; // Graphite G
          sData[pixelIdx + 2] = strokeVal * 0.25; // Graphite B
          sData[pixelIdx + 3] = 255;
        }
      }

      // Merge sketch onto paper background
      const tempC = document.createElement("canvas");
      tempC.width = width;
      tempC.height = height;
      const tempCtx = tempC.getContext("2d");
      if (tempCtx) {
        tempCtx.putImageData(sketchData, 0, 0);
        sCtx.drawImage(tempC, 0, 0);
      }

      sketchCanvasRef.current = sCanvas;

      // Initial Render
      renderCanvas();
    };
  }, [imageSrc]);

  const renderCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx || !photoCanvasRef.current || !sketchCanvasRef.current) return;

    const width = canvas.width;
    const height = canvas.height;

    ctx.clearRect(0, 0, width, height);

    if (isSketchMode) {
      // Full Sketch Mode
      ctx.drawImage(sketchCanvasRef.current, 0, 0);
    } else {
      // Photo Base Mode
      ctx.drawImage(photoCanvasRef.current, 0, 0);

      // If mouse is hovered, render Interactive Pencil Sketch Lens under cursor
      if (isHovered && mousePos) {
        const radius = 110;
        ctx.save();

        // Circular clipping region following mouse
        ctx.beginPath();
        ctx.arc(mousePos.x, mousePos.y, radius, 0, Math.PI * 2);
        ctx.clip();

        // Draw sketch inside lens
        ctx.drawImage(sketchCanvasRef.current, 0, 0);

        // Circular lens border
        ctx.restore();
        ctx.strokeStyle = "rgba(232, 178, 61, 0.9)";
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(mousePos.x, mousePos.y, radius, 0, Math.PI * 2);
        ctx.stroke();

        // Crosshair ring
        ctx.strokeStyle = "rgba(255, 255, 255, 0.4)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(mousePos.x, mousePos.y, radius + 4, 0, Math.PI * 2);
        ctx.stroke();
      }
    }
  };

  useEffect(() => {
    renderCanvas();
  }, [isSketchMode, mousePos, isHovered]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setMousePos({ x, y });
  };

  return (
    <div
      ref={containerRef}
      onMouseEnter={() => {
        setIsHovered(true);
        sfx.sketch();
      }}
      onMouseLeave={() => {
        setIsHovered(false);
        setMousePos(null);
      }}
      onMouseMove={handleMouseMove}
      className="relative w-full h-full overflow-hidden bg-[#0a0b10] flex items-center justify-center cursor-crosshair group"
    >
      <canvas ref={canvasRef} className="w-full h-full object-cover" />

      {/* Floating Interactive Hover Badge */}
      <div className="absolute top-4 left-4 z-10 px-3 py-1.5 rounded-full bg-black/80 border border-white/15 backdrop-blur-md text-[10px] font-mono text-white/90 uppercase tracking-widest flex items-center gap-2 shadow-lg pointer-events-none">
        <span className="w-2 h-2 rounded-full bg-[#e8b23d] animate-pulse" />
        <span>{isSketchMode ? "PENCIL SKETCH MODE" : isHovered ? "PENCIL LENS ACTIVE" : "HOVER TO REVEAL SKETCH"}</span>
      </div>
    </div>
  );
}

/* -----------------------------------------------------
   MAIN COMPONENT: ARCADE STAGE STORYBOARD
   ----------------------------------------------------- */
export function ArcadeStage({ onClose }: { onClose: () => void }) {
  const bgmAudio = useRef<HTMLAudioElement | null>(null);

  const [currentMission, setCurrentMission] = useState(1);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isSketchMode, setIsSketchMode] = useState(false); // Default to clean photo with interactive hover sketch lens
  const sfx = useSound(soundEnabled);

  const [achievements, setAchievements] = useState<string[]>([]);
  const [startTime] = useState(Date.now());

  const currentInfo = MISSIONS[currentMission - 1] || MISSIONS[0];
  const isOddBoard = currentMission % 2 === 1;

  const unlockAchievement = (name: string) => {
    setAchievements((prev) => {
      if (!prev.includes(name)) {
        sfx.chime();
        return [...prev, name];
      }
      return prev;
    });
  };

  useEffect(() => {
    bgmAudio.current = new Audio("/bgm.mp3");
    bgmAudio.current.loop = true;
    bgmAudio.current.volume = 0.3;
    return () => {
      bgmAudio.current?.pause();
    };
  }, []);

  useEffect(() => {
    if (soundEnabled) {
      bgmAudio.current?.play().catch(() => {});
    } else {
      bgmAudio.current?.pause();
    }
  }, [soundEnabled]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") {
        nextBoard();
      } else if (e.key === "ArrowLeft") {
        prevBoard();
      } else if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentMission]);

  const nextBoard = () => {
    if (currentMission < 6) {
      sfx.printer();
      const nextM = currentMission + 1;
      setCurrentMission(nextM);
      if (nextM === 2) unlockAchievement("First Take");
      if (nextM === 3) unlockAchievement("Film Buff");
      if (nextM === 4) unlockAchievement("Grandmaster");
      if (nextM === 5) unlockAchievement("Logic Node");
      if (nextM === 6) unlockAchievement("The Writer");
    }
  };

  const prevBoard = () => {
    if (currentMission > 1) {
      sfx.click();
      setCurrentMission((prev) => prev - 1);
    }
  };

  const getRuntime = () => {
    const ms = Date.now() - startTime;
    const mins = Math.floor(ms / 60000);
    const secs = Math.floor((ms % 60000) / 1000);
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#050508] text-white overflow-hidden select-none font-sans">
      {/* 35MM FILM REEL TOP BAR */}
      <div className="relative z-30 flex items-center justify-between px-6 py-3 bg-black/90 border-b border-white/10 backdrop-blur-md">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <Film className="w-5 h-5 text-[#e8b23d] animate-pulse" />
            <span className="font-mono text-xs tracking-[0.25em] uppercase text-white/90 font-bold">
              35MM STORYBOARD REEL
            </span>
          </div>
          <div className="hidden md:flex items-center gap-1.5 border-l border-white/10 pl-6">
            {MISSIONS.slice(0, 5).map((m) => (
              <button
                key={m.id}
                onClick={() => {
                  sfx.click();
                  setCurrentMission(m.id);
                }}
                className={`px-3 py-1 rounded text-[10px] font-mono tracking-wider transition-all ${
                  currentMission === m.id
                    ? "bg-[#e8b23d] text-black font-bold scale-105"
                    : "bg-white/5 text-white/60 hover:bg-white/10 hover:text-white"
                }`}
              >
                0{m.id} {m.title}
              </button>
            ))}
          </div>
        </div>

        {/* CONTROLS RIGHT */}
        <div className="flex items-center gap-3">
          {/* Sketch / Photo Toggle */}
          <button
            onClick={() => {
              sfx.click();
              setIsSketchMode((prev) => !prev);
            }}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 text-xs font-mono text-white/90 transition-all active:scale-95 shadow-sm"
            title="Toggle Full Pencil Sketch Mode"
          >
            <Sparkles className={`w-3.5 h-3.5 ${isSketchMode ? "text-[#e8b23d]" : "text-white/60"}`} />
            <span>{isSketchMode ? "Full Pencil Sketch" : "Photo Mode (Hover Sketch Lens)"}</span>
          </button>

          {/* Sound Toggle */}
          <button
            onClick={() => setSoundEnabled((prev) => !prev)}
            className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-colors active:scale-95"
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-[#00f0ff]" /> : <VolumeX className="w-4 h-4 text-white/40" />}
          </button>

          {/* Close button */}
          <button
            onClick={onClose}
            className="p-2 rounded-full bg-white/10 hover:bg-red-500/80 text-white transition-colors active:scale-95"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* 35MM SPROCKET HOLES HEADER DECORATION */}
      <div className="w-full bg-black py-1.5 flex justify-between px-4 border-b border-white/5 opacity-40">
        {Array.from({ length: 18 }).map((_, i) => (
          <div key={i} className="w-3 h-2 rounded-sm bg-white/20 border border-black" />
        ))}
      </div>

      {/* MAIN VIEWPORT: SIDE-BY-SIDE ALTERNATING LAYOUT */}
      <div className="relative flex-1 w-full h-full overflow-hidden flex items-center justify-center p-6 lg:p-12">
        <AnimatePresence mode="wait">
          {currentMission < 6 ? (
            <motion.div
              key={currentMission}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -30 }}
              transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
              className={`w-full max-w-6xl flex flex-col ${
                isOddBoard ? "lg:flex-row" : "lg:flex-row-reverse"
              } items-center justify-between gap-8 lg:gap-12`}
            >
              {/* BOARD CARD (LEFT or RIGHT) */}
              <div className="flex-1 w-full bg-[#0d0e14]/90 border border-white/15 backdrop-blur-xl rounded-2xl p-8 md:p-10 shadow-[0_25px_70px_rgba(0,0,0,0.8)] flex flex-col justify-between min-h-[440px]">
                <div>
                  {/* Top Ticket Header */}
                  <div className="flex items-center justify-between pb-6 mb-6 border-b border-white/10">
                    <span className="px-3 py-1 rounded bg-[#e8b23d]/15 text-[#e8b23d] font-mono text-xs uppercase tracking-widest border border-[#e8b23d]/30 font-semibold">
                      {currentInfo.tag}
                    </span>
                    <span className="text-white/40 font-mono text-xs tracking-widest uppercase">
                      FRAME 0{currentMission} / 05
                    </span>
                  </div>

                  <h2 className="text-3xl md:text-5xl font-serif italic text-white font-medium tracking-tight mb-4 drop-shadow-md">
                    {currentInfo.title}
                  </h2>

                  {/* SCRIPT CONTENT */}
                  {currentMission === 1 && (
                    <p className="text-white/80 font-sans text-base md:text-lg leading-relaxed font-light">
                      I'm <span className="text-white font-semibold underline decoration-[#e8b23d]">Aditya Parihar</span> — a Computer Science major in my third year at UPES. Code is my major, but there's a lot more going on in my head. It’s chaotic, unpredictable, and you have to keep moving.
                    </p>
                  )}

                  {currentMission === 2 && (
                    <p className="text-white/80 font-sans text-base md:text-lg leading-relaxed font-light">
                      Football and running keep me moving. Chess keeps me thinking — sitting around <span className="text-[#00f0ff] font-mono font-bold">900–1000 Elo</span>, I rely on pattern recognition as much as logic. This analytical mindset shapes how I approach my craft.
                    </p>
                  )}

                  {currentMission === 3 && (
                    <div className="flex flex-col gap-5">
                      <p className="text-white/80 font-sans text-base leading-relaxed font-light">
                        My Letterboxd is basically a diary. These are the films that shaped my perspective:
                      </p>

                      {/* FILM POSTER CARDS */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {FILMS.map((f, i) => (
                          <motion.div
                            key={i}
                            whileHover={{ scale: 1.05 }}
                            className="group relative aspect-[2/3] rounded-lg overflow-hidden border border-white/10 bg-black/40 shadow-lg"
                          >
                            <img src={f.url} alt={f.title} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-2 flex items-end">
                              <span className="text-[9px] font-mono text-white font-bold leading-tight">{f.title}</span>
                            </div>
                          </motion.div>
                        ))}
                      </div>

                      <a
                        href="https://letterboxd.com/adityaparihar21"
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 self-start px-4 py-2 rounded-full bg-[#902424]/80 hover:bg-[#b3122e] text-white font-mono text-xs uppercase tracking-widest transition-all shadow-md active:scale-95"
                      >
                        My Letterboxd Diary <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  )}

                  {currentMission === 4 && (
                    <div className="flex flex-col gap-5">
                      <p className="text-white/80 font-sans text-base md:text-lg leading-relaxed font-light">
                        Whether I'm writing an exam or debugging a React component, breaking a massive problem down into simple logic gates is how I get things done.
                      </p>

                      {/* LOGIC GATE DIAGRAM */}
                      <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10 flex items-center justify-around font-mono text-xs text-white/70">
                        <div className="flex flex-col items-center gap-1">
                          <span className="text-[#00f0ff] font-bold">INPUT A</span>
                          <span className="text-white/40">State Change</span>
                        </div>
                        <span className="text-[#e8b23d] text-base font-bold">AND</span>
                        <div className="flex flex-col items-center gap-1">
                          <span className="text-[#00f0ff] font-bold">INPUT B</span>
                          <span className="text-white/40">Clean Logic</span>
                        </div>
                        <span className="text-[#10b981] text-base font-bold">➔</span>
                        <div className="flex flex-col items-center gap-1">
                          <span className="text-[#10b981] font-bold">OUTPUT</span>
                          <span className="text-white/40">Perfect Build</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {currentMission === 5 && (
                    <div className="flex flex-col gap-5">
                      <p className="text-white/80 font-sans text-base md:text-lg leading-relaxed font-light">
                        While I work silently in the background, I also write about things I find interesting and random facts about my life.
                      </p>

                      <a
                        href="https://substack.com/@adityaparihar21"
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 self-start px-5 py-2.5 rounded-full bg-[#ff6b00] hover:bg-[#ff8533] text-black font-semibold font-mono text-xs uppercase tracking-widest transition-all shadow-lg active:scale-95"
                      >
                        Read My Substack Essays <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  )}
                </div>

                {/* BOTTOM NAVIGATION INSIDE CARD */}
                <div className="flex items-center justify-between border-t border-white/10 pt-6 mt-6">
                  <button
                    onClick={prevBoard}
                    disabled={currentMission === 1}
                    className={`flex items-center gap-2 px-4 py-2 rounded-full font-mono text-xs uppercase tracking-widest transition-all ${
                      currentMission === 1
                        ? "opacity-30 cursor-not-allowed text-white/40"
                        : "bg-white/5 hover:bg-white/10 text-white active:scale-95"
                    }`}
                  >
                    <ArrowLeft className="w-4 h-4" /> Previous
                  </button>

                  <div className="flex items-center gap-2">
                    {MISSIONS.slice(0, 5).map((m) => (
                      <div
                        key={m.id}
                        className={`w-2 h-2 rounded-full transition-all ${
                          currentMission === m.id ? "bg-[#e8b23d] w-6" : "bg-white/20"
                        }`}
                      />
                    ))}
                  </div>

                  <button
                    onClick={nextBoard}
                    className="flex items-center gap-2 px-5 py-2 rounded-full bg-[#e8b23d] hover:bg-[#f5c760] text-black font-semibold font-mono text-xs uppercase tracking-widest transition-all shadow-lg active:scale-95"
                  >
                    {currentMission === 5 ? "View Director's Cut" : "Next Board"} <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* LIVE INTERACTIVE HOVER PENCIL SKETCH CANVAS */}
              <div className="flex-1 w-full aspect-[4/3] rounded-2xl overflow-hidden border border-white/20 shadow-2xl relative min-h-[350px] lg:min-h-[440px]">
                <CanvasSketchEngine
                  imageSrc={currentInfo.image}
                  isSketchMode={isSketchMode}
                  sfx={sfx}
                  title={currentInfo.title}
                />
              </div>
            </motion.div>
          ) : (
            /* FINAL SCREEN: DIRECTOR'S CUT */
            <motion.div
              key="directors-cut"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6 }}
              className="relative z-30 w-full max-w-2xl px-6 py-8"
            >
              <div className="relative bg-[#0d0e14]/95 border border-white/20 backdrop-blur-2xl rounded-2xl p-10 md:p-12 shadow-[0_30px_90px_rgba(0,0,0,0.9)] text-center flex flex-col items-center">
                <div className="w-full border-t border-b border-white/15 py-3 mb-8 flex justify-between items-center text-white/50 font-mono text-xs tracking-[0.3em] uppercase">
                  <span>Interactive Portfolio Storyboard</span>
                  <span>v2.0.0</span>
                </div>

                <h1 className="text-5xl md:text-7xl font-serif italic mb-6 tracking-wider text-white drop-shadow-[0_0_30px_rgba(255,255,255,0.3)]">
                  DIRECTOR'S CUT
                </h1>

                <p className="text-white/70 font-sans italic text-base mb-8 max-w-md">
                  "The scenery evolves to mirror the stages of making a film — from raw sketch to finished story."
                </p>

                {/* STATS */}
                <div className="w-full max-w-md flex flex-col gap-3 font-mono text-xs tracking-widest uppercase mb-8">
                  <div className="flex justify-between items-center border-b border-white/10 pb-2">
                    <span className="text-white/50">Runtime</span>
                    <span className="text-[#e8b23d] font-bold">{getRuntime()}</span>
                  </div>
                  <div className="flex justify-between items-center border-b border-white/10 pb-2">
                    <span className="text-white/50">Boards Unlocked</span>
                    <span className="text-[#00f0ff] font-bold">5 / 5 STRIKES</span>
                  </div>
                  <div className="flex justify-between items-center border-b border-white/10 pb-2">
                    <span className="text-white/50">Achievements</span>
                    <span className="text-[#10b981] font-bold">{achievements.length} UNLOCKED</span>
                  </div>
                </div>

                {/* ACHIEVEMENTS BADGES */}
                {achievements.length > 0 && (
                  <div className="w-full mb-8">
                    <span className="text-[10px] font-mono uppercase tracking-[0.3em] text-white/40 block mb-3">
                      UNLOCKED BADGES
                    </span>
                    <div className="flex flex-wrap justify-center gap-2">
                      {achievements.map((a) => (
                        <span
                          key={a}
                          className="px-3 py-1 rounded-full bg-[#10b981]/15 text-[#10b981] border border-[#10b981]/30 font-mono text-[10px] uppercase tracking-wider flex items-center gap-1.5"
                        >
                          <Trophy className="w-3 h-3" /> {a}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-4">
                  <button
                    onClick={() => {
                      sfx.click();
                      setCurrentMission(1);
                    }}
                    className="px-6 py-3 rounded-full bg-white/10 hover:bg-white/20 text-white font-mono text-xs uppercase tracking-widest transition-all active:scale-95"
                  >
                    Replay Storyboard
                  </button>
                  <button
                    onClick={onClose}
                    className="px-8 py-3 rounded-full bg-[#e8b23d] hover:bg-[#f5c760] text-black font-semibold font-mono text-xs uppercase tracking-widest transition-all shadow-lg active:scale-95"
                  >
                    Return to Portfolio
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 35MM SPROCKET HOLES FOOTER DECORATION */}
      <div className="w-full bg-black py-1.5 flex justify-between px-4 border-t border-white/5 opacity-40">
        {Array.from({ length: 18 }).map((_, i) => (
          <div key={i} className="w-3 h-2 rounded-sm bg-white/20 border border-black" />
        ))}
      </div>
    </div>
  );
}
