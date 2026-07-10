import { useEffect, useRef, useState, useMemo, useCallback } from "react";
import { X, Volume2, VolumeX } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const FILMS = [
  "https://a.ltrbxd.com/resized/film-poster/3/8/4/0/5/8/384058-beautiful-boy-0-230-0-345-crop.jpg?v=fb10cce0",
  "https://a.ltrbxd.com/resized/film-poster/7/1/3/3/8/71338-the-perks-of-being-a-wallflower-0-230-0-345-crop.jpg?v=d2c4c804",
  "https://a.ltrbxd.com/resized/film-poster/5/1/6/2/1/51621-good-will-hunting-0-230-0-345-crop.jpg?v=f1139f66",
  "https://a.ltrbxd.com/resized/film-poster/5/7/1/3/9/1/571391-dil-bechara-0-230-0-345-crop.jpg?v=bad1a4cb"
];

// -----------------------------------------------------
// SOUND ENGINE
// -----------------------------------------------------
const useSound = (enabled: boolean) => {
  return useMemo(() => {
    const playSound = (freq: number, dur: number, type: string, vol: number, delay = 0) => {
      if (!enabled) return;
      try {
        const ac = new (window.AudioContext || (window as any).webkitAudioContext)();
        const t0 = ac.currentTime + delay;
        const osc = ac.createOscillator();
        const gain = ac.createGain();
        osc.type = type as any;
        osc.frequency.setValueAtTime(freq, t0);
        gain.gain.setValueAtTime(0, t0);
        gain.gain.linearRampToValueAtTime(vol, t0 + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
        osc.connect(gain).connect(ac.destination);
        osc.start(t0);
        osc.stop(t0 + dur + 0.02);
      } catch(e) {}
    };

    return {
      jump: () => { playSound(440, 0.12, "square", 0.1); playSound(660, 0.10, "square", 0.08, 0.03); },
      coin: () => { playSound(988, 0.08, "square", 0.1); playSound(1318, 0.12, "square", 0.1, 0.06); },
      hit: () => playSound(120, 0.22, "sawtooth", 0.14),
      step: () => playSound(200, 0.03, "square", 0.03),
      reveal: () => { playSound(523, 0.1, "triangle", 0.09); playSound(659, 0.1, "triangle", 0.09, 0.09); playSound(784, 0.16, "triangle", 0.1, 0.18); },
      click: () => playSound(800, 0.05, "sine", 0.05)
    };
  }, [enabled]);
};


// -----------------------------------------------------
// COLOR GRADER GAME (Reel 2)
// -----------------------------------------------------
function ColorGraderGame({ onComplete, sfx }: { onComplete: () => void, sfx: any }) {
  // We apply filters. Goal: Match target values.
  const target = useMemo(() => ({
    saturate: 180, // %
    hue: 45, // deg
    brightness: 80 // %
  }), []);

  const [saturate, setSaturate] = useState(100);
  const [hue, setHue] = useState(0);
  const [brightness, setBrightness] = useState(100);
  const [win, setWin] = useState(false);

  const checkMatch = () => {
    const sDiff = Math.abs(saturate - target.saturate);
    const hDiff = Math.abs(hue - target.hue);
    const bDiff = Math.abs(brightness - target.brightness);
    if (sDiff < 20 && hDiff < 15 && bDiff < 15) {
      setWin(true);
      sfx.reveal();
      setTimeout(onComplete, 2000);
    }
  };

  useEffect(() => {
    if (!win) checkMatch();
  }, [saturate, hue, brightness]);

  return (
    <div className="absolute inset-0 z-30 flex flex-col md:flex-row items-center justify-center p-8 gap-8 bg-[#0b0b0f]">
      <div className="flex-1 flex flex-col items-center gap-4 w-full">
        <h3 className="text-[#e8b23d] font-mono uppercase tracking-widest text-xs">Target Look</h3>
        <img src={FILMS[0]} className="h-48 md:h-64 object-cover rounded-lg border border-white/20" style={{ filter: `saturate(${target.saturate}%) hue-rotate(${target.hue}deg) brightness(${target.brightness}%)` }} />
      </div>
      
      <div className="flex-1 flex flex-col gap-6 w-full max-w-sm">
        <div className="text-center">
          <h2 className="text-2xl font-serif text-white mb-2">{win ? "Perfect Match!" : "Match the Grade"}</h2>
          <p className="text-white/50 text-xs font-mono">Adjust the sliders to match the cinematic look.</p>
        </div>
        
        <div className="space-y-4">
          <label className="flex flex-col gap-2 font-mono text-xs text-white/80">
            <span>Saturation</span>
            <input type="range" min="0" max="250" value={saturate} onChange={e => { setSaturate(Number(e.target.value)); sfx.step(); }} disabled={win} className="accent-[#e8b23d]" />
          </label>
          <label className="flex flex-col gap-2 font-mono text-xs text-white/80">
            <span>Hue Tint</span>
            <input type="range" min="-90" max="90" value={hue} onChange={e => { setHue(Number(e.target.value)); sfx.step(); }} disabled={win} className="accent-[#e8b23d]" />
          </label>
          <label className="flex flex-col gap-2 font-mono text-xs text-white/80">
            <span>Brightness</span>
            <input type="range" min="50" max="150" value={brightness} onChange={e => { setBrightness(Number(e.target.value)); sfx.step(); }} disabled={win} className="accent-[#e8b23d]" />
          </label>
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center gap-4 w-full">
        <h3 className="text-[#e8b23d] font-mono uppercase tracking-widest text-xs">Your Grade</h3>
        <img src={FILMS[0]} className="h-48 md:h-64 object-cover rounded-lg border border-white/20 transition-all duration-150" style={{ filter: `saturate(${saturate}%) hue-rotate(${hue}deg) brightness(${brightness}%)` }} />
      </div>
    </div>
  );
}


// -----------------------------------------------------
// MEMORY MATCH GAME (Reel 3)
// -----------------------------------------------------
function MemoryMatchGame({ onComplete, sfx }: { onComplete: () => void, sfx: any }) {
  const [cards, setCards] = useState<{id: number, img: string, flipped: boolean, matched: boolean}[]>([]);
  const [flippedIdx, setFlippedIdx] = useState<number[]>([]);
  const [win, setWin] = useState(false);

  useEffect(() => {
    const pair = [...FILMS, ...FILMS].map((img, i) => ({ id: i, img, flipped: false, matched: false }));
    // Shuffle
    for (let i = pair.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pair[i], pair[j]] = [pair[j], pair[i]];
    }
    setCards(pair);
  }, []);

  const handleCardClick = (idx: number) => {
    if (flippedIdx.length === 2 || cards[idx].flipped || cards[idx].matched) return;
    
    sfx.click();
    const newCards = [...cards];
    newCards[idx].flipped = true;
    setCards(newCards);
    
    const newFlipped = [...flippedIdx, idx];
    setFlippedIdx(newFlipped);

    if (newFlipped.length === 2) {
      const [first, second] = newFlipped;
      if (newCards[first].img === newCards[second].img) {
        sfx.coin();
        setTimeout(() => {
          setCards(prev => {
            const c = [...prev];
            c[first].matched = true;
            c[second].matched = true;
            if (c.every(x => x.matched)) {
              setWin(true);
              sfx.reveal();
              setTimeout(onComplete, 2000);
            }
            return c;
          });
          setFlippedIdx([]);
        }, 500);
      } else {
        setTimeout(() => {
          setCards(prev => {
            const c = [...prev];
            c[first].flipped = false;
            c[second].flipped = false;
            return c;
          });
          setFlippedIdx([]);
          sfx.hit();
        }, 1000);
      }
    }
  };

  return (
    <div className="absolute inset-0 z-30 flex flex-col items-center justify-center p-8 bg-[#0b0b0f]">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-serif text-white mb-2">{win ? "All Matched!" : "Memory Match"}</h2>
        <p className="text-white/50 text-xs font-mono">Match the 4 Letterboxd favorites.</p>
      </div>
      <div className="grid grid-cols-4 gap-4">
        {cards.map((c, i) => (
          <div 
            key={c.id} 
            onClick={() => handleCardClick(i)}
            className="w-20 h-28 md:w-28 md:h-40 perspective-1000 cursor-pointer"
          >
            <motion.div 
              className="w-full h-full relative preserve-3d"
              animate={{ rotateY: c.flipped || c.matched ? 180 : 0 }}
              transition={{ duration: 0.4 }}
            >
              {/* Back */}
              <div className="absolute inset-0 backface-hidden bg-[#241a1e] border border-white/20 rounded-lg flex items-center justify-center">
                <span className="text-white/20 font-serif italic text-2xl">?</span>
              </div>
              {/* Front */}
              <div className="absolute inset-0 backface-hidden bg-black rounded-lg overflow-hidden border border-[#e8b23d]" style={{ transform: 'rotateY(180deg)' }}>
                <img src={c.img} className="w-full h-full object-cover opacity-80" />
              </div>
            </motion.div>
          </div>
        ))}
      </div>
    </div>
  );
}


// -----------------------------------------------------
// MAIN COMPONENT
// -----------------------------------------------------
export function ArcadeStage({ onClose }: { onClose: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const bgmAudio = useRef<HTMLAudioElement | null>(null);

  const [currentReel, setCurrentReel] = useState(1);
  const [reelState, setReelState] = useState<"intro" | "playing" | "fail" | "completed">("intro");
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [ecoMode, setEcoMode] = useState(false);
  const sfx = useSound(soundEnabled);

  // Runner state refs
  const scoreRef = useRef(0);
  const livesRef = useRef(3);
  const frameTimes = useRef<number[]>([]);
  const [uiScore, setUiScore] = useState(0);
  const [uiLives, setUiLives] = useState(3);

  useEffect(() => {
    bgmAudio.current = new Audio("/bgm.mp3");
    bgmAudio.current.loop = true;
    bgmAudio.current.volume = 0.5;
    return () => { bgmAudio.current?.pause(); };
  }, []);

  useEffect(() => {
    if (soundEnabled && (reelState === "playing" || reelState === "completed" || reelState === "intro")) {
      bgmAudio.current?.play().catch(() => {});
    } else {
      bgmAudio.current?.pause();
    }
  }, [soundEnabled, reelState]);

  // Handle Reel 1 Canvas Loop
  useEffect(() => {
    if (currentReel !== 1 || reelState !== "playing") return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const LOGICAL_W = 960;
    const LOGICAL_H = 480;
    const GROUND_Y = 360;
    const GRAVITY = 0.85;
    const JUMP_V = -15.5;

    let frame = 0;
    let speed = 6;
    let spawnTimer = 0;
    let animationId: number;

    const player = { x: 110, y: GROUND_Y - 48, w: 40, h: 48, vy: 0, onGround: true, invuln: 0, squash: 1 };
    let obstacles: any[] = [];
    let coins: any[] = [];
    let particles: any[] = [];
    let lastTime = performance.now();

    const resize = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      const rect = parent.getBoundingClientRect();
      const dpr = Math.max(1, Math.min(window.devicePixelRatio || 1, 2));
      canvas.width = Math.floor(rect.width * dpr);
      canvas.height = Math.floor(rect.height * dpr);
      const scale = canvas.width / LOGICAL_W;
      ctx.setTransform(scale, 0, 0, scale, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    const jump = () => {
      if (player.onGround) {
        player.vy = JUMP_V;
        player.onGround = false;
        player.squash = 1.3;
        spawnParticles(player.x + player.w/2, player.y + player.h, 10, "#f4ead8");
        sfx.jump();
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space" || e.code === "ArrowUp") { e.preventDefault(); jump(); }
    };
    window.addEventListener("keydown", handleKeyDown);
    canvas.addEventListener("pointerdown", jump, { passive: true });

    function spawnParticles(x: number, y: number, count: number, color: string) {
      for (let i = 0; i < count; i++) {
        particles.push({ x, y, vx: (Math.random() - 0.5) * 8, vy: (Math.random() - 1) * 6, life: 1, color });
      }
    }

    const STARS = Array.from({length:40}, ()=>({
      x: Math.random() * LOGICAL_W, y: Math.random() * (GROUND_Y * 0.55),
      r: Math.random() * 1.4 + 0.4, phase: Math.random() * Math.PI * 2
    }));

    function drawHillLayer(baseY: number, speedMul: number, color: string, amp: number) {
      const scrollX = (frame * speed * speedMul) % LOGICAL_W;
      ctx!.fillStyle = color;
      ctx!.beginPath();
      ctx!.moveTo(-scrollX, GROUND_Y + 2);
      const step = 80;
      for(let x = -scrollX; x < LOGICAL_W + step; x += step){
        ctx!.lineTo(x, baseY - Math.sin(x * 0.008) * amp * 0.5 - amp * 0.3);
      }
      ctx!.lineTo(LOGICAL_W + step, GROUND_Y + 2);
      ctx!.fill();
    }

    // Procedural Pixel Art Drawing
    function drawPixelPlayer(ctx: CanvasRenderingContext2D, px: number, py: number) {
      // Colors based on reference PNG
      const cSkin = "#8D5524"; // brown skin
      const cHair = "#1A1A1A"; // dark hair
      const cJacket = "#B3122E"; // red jacket
      const cJacketDark = "#800B20";
      const cPants = "#2C2C2E"; // dark pants
      const cShoes = "#FFFFFF"; // white sneakers
      const cCamera = "#111111"; // black camera

      const s = 4; // Pixel size multiplier
      const drawPix = (x: number, y: number, w: number, h: number, col: string) => {
        ctx.fillStyle = col;
        ctx.fillRect(px + x*s, py + y*s, w*s, h*s);
      };

      // Swing animation logic
      const cycle = player.onGround ? (frame % 20) / 20 : 0.5; // 0 to 1
      const armSwing = Math.sin(cycle * Math.PI * 2) * 2;
      const legSwing = Math.cos(cycle * Math.PI * 2) * 3;

      // Shadow
      ctx.fillStyle = "rgba(0,0,0,0.3)";
      ctx.beginPath();
      ctx.ellipse(px + player.w/2, py + player.h, 12, 4, 0, 0, Math.PI * 2);
      ctx.fill();

      // Back Arm (swinging)
      drawPix(6 - armSwing, 5, 2, 4, cJacketDark); // sleeve
      drawPix(6 - armSwing, 9, 2, 2, cSkin); // hand

      // Back Leg (swinging)
      drawPix(4 - legSwing, 9, 2, 4, cPants);
      drawPix(4 - legSwing, 13, 3, 1.5, cShoes);

      // Body (Jacket)
      drawPix(3, 4, 5, 6, cJacket);

      // Front Leg (swinging)
      drawPix(4 + legSwing, 9, 2, 4, cPants);
      drawPix(4 + legSwing, 13, 3, 1.5, cShoes);

      // Head
      drawPix(4, 0, 4, 4, cSkin);
      drawPix(3, -1, 5, 2, cHair); // hair top
      drawPix(3, 1, 1, 2, cHair); // hair back

      // Front Arm holding camera
      drawPix(3, 5, 4, 2, cJacket); // sleeve forward
      drawPix(7, 5, 2, 2, cSkin); // hand

      // Camera
      drawPix(8, 4, 3, 2, cCamera);
      drawPix(11, 4.5, 1, 1, "#aaa"); // lens
    }

    function drawCanister(o: any) {
      if (o.type === 'c-stand') {
        ctx!.fillStyle = "#ccc";
        ctx!.fillRect(o.x + 12, o.y - 15, 4, o.h + 15);
        ctx!.fillStyle = "#888";
        ctx!.beginPath(); ctx!.moveTo(o.x + 14, o.y + o.h); ctx!.lineTo(o.x, o.y + o.h); ctx!.lineTo(o.x + 14, o.y + o.h - 10); ctx!.fill();
        ctx!.beginPath(); ctx!.moveTo(o.x + 14, o.y + o.h); ctx!.lineTo(o.x + 28, o.y + o.h); ctx!.lineTo(o.x + 14, o.y + o.h - 10); ctx!.fill();
      } else if (o.type === 'pelican') {
        ctx!.fillStyle = "#111";
        ctx!.fillRect(o.x, o.y + 12, o.w + 6, o.h - 12);
        ctx!.fillStyle = "#333";
        ctx!.fillRect(o.x + 4, o.y + 16, o.w - 2, 4);
      } else {
        // Film canister
        ctx!.fillStyle = "#1c1c24";
        ctx!.fillRect(o.x, o.y + 4, o.w, o.h - 8);
        ctx!.fillStyle = "#b3122e";
        ctx!.fillRect(o.x, o.y + o.h/2 - 4, o.w, 8);
      }
    }

    function loop() {
      const now = performance.now();
      const dt = now - lastTime;
      lastTime = now;

      // Eco Mode FPS monitor
      frameTimes.current.push(dt);
      if (frameTimes.current.length > 60) {
        frameTimes.current.shift();
        const avgDt = frameTimes.current.reduce((a, b) => a + b) / 60;
        if (avgDt > 22 && !ecoMode) setEcoMode(true);
      }

      frame++;
      speed = 6 + Math.min(4, scoreRef.current / 100);

      player.vy += GRAVITY;
      player.y += player.vy;
      if (player.y >= GROUND_Y - player.h) {
        player.y = GROUND_Y - player.h;
        if (player.vy > 0 && !player.onGround) player.squash = 0.72;
        player.vy = 0;
        player.onGround = true;
      }
      if (player.invuln > 0) player.invuln--;
      player.squash += (1 - player.squash) * 0.25;

      if (player.onGround && frame % 12 === 0) sfx.step();

      // Spawning
      spawnTimer--;
      if (spawnTimer <= 0) {
        spawnTimer = 40 + Math.random() * 30;
        if (Math.random() < 0.55) {
          coins.push({ x: LOGICAL_W + 20, y: GROUND_Y - 90 - Math.random() * 40, r: 12, wobble: Math.random() * 10 });
        } else {
          const types = ['c-stand', 'pelican', 'canister'];
          obstacles.push({ x: LOGICAL_W + 20, y: GROUND_Y - 34, w: 28, h: 34, type: types[Math.floor(Math.random() * types.length)] });
        }
      }

      // Update obstacles
      for (let i = obstacles.length - 1; i >= 0; i--) {
        const o = obstacles[i];
        o.x -= speed;
        if (o.x + o.w < -20) { obstacles.splice(i, 1); continue; }
        if (player.invuln === 0 && player.x < o.x + o.w - 6 && player.x + player.w > o.x + 6 && player.y + player.h > o.y + 6) {
          livesRef.current--;
          setUiLives(livesRef.current);
          player.invuln = 90;
          player.squash = 1.25;
          sfx.hit();
          if (livesRef.current <= 0) {
            setReelState("fail");
            return;
          }
        }
      }

      // Update Coins (Golden Lenses)
      for (let i = coins.length - 1; i >= 0; i--) {
        const c = coins[i];
        c.x -= speed;
        if (c.x < -20) { coins.splice(i, 1); continue; }
        const dx = (player.x + player.w/2) - c.x;
        const dy = (player.y + player.h/2) - c.y;
        if (Math.sqrt(dx*dx + dy*dy) < c.r + 18) {
          scoreRef.current += 10;
          setUiScore(scoreRef.current);
          if (scoreRef.current >= 40) { // Win condition for Reel 1
            sfx.reveal();
            setReelState("completed");
            return;
          }
          coins.splice(i, 1);
          spawnParticles(c.x, c.y, 15, "#e8b23d");
          sfx.coin();
        }
      }

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx; p.y += p.vy; p.vy += 0.2; p.life -= 0.03;
        if (p.life <= 0) particles.splice(i, 1);
      }

      // Draw
      ctx!.clearRect(0, 0, LOGICAL_W, LOGICAL_H);
      
      const sky = ctx!.createLinearGradient(0, 0, 0, GROUND_Y);
      sky.addColorStop(0, "#1b1030"); sky.addColorStop(1, "#3a1626");
      ctx!.fillStyle = sky; ctx!.fillRect(0, 0, LOGICAL_W, GROUND_Y);

      STARS.forEach(s => {
        ctx!.fillStyle = `rgba(244,234,216,${0.25 + 0.5 * Math.sin(frame * 0.03 + s.phase)})`;
        ctx!.beginPath(); ctx!.arc(s.x, s.y, s.r, 0, Math.PI * 2); ctx!.fill();
      });

      drawHillLayer(GROUND_Y - 46, 0.15, "#241033", 70);
      drawHillLayer(GROUND_Y - 20, 0.3, "#1a0c26", 46);

      ctx!.fillStyle = "#0b0b0f"; ctx!.fillRect(0, GROUND_Y, LOGICAL_W, LOGICAL_H - GROUND_Y);
      ctx!.fillStyle = "#2a2a35"; ctx!.fillRect(0, GROUND_Y, LOGICAL_W, 6);

      // Draw Coins (Golden Lenses)
      coins.forEach(c => {
        ctx!.save(); ctx!.translate(c.x, c.y + Math.sin(frame * 0.1 + c.wobble) * 6);
        ctx!.fillStyle = "#e8b23d";
        ctx!.shadowColor = "#e8b23d"; ctx!.shadowBlur = 10;
        ctx!.beginPath(); ctx!.arc(0, 0, c.r, 0, Math.PI * 2); ctx!.fill();
        ctx!.shadowBlur = 0;
        ctx!.fillStyle = "#111";
        ctx!.beginPath(); ctx!.arc(0, 0, c.r * 0.6, 0, Math.PI * 2); ctx!.fill();
        ctx!.fillStyle = "#fff";
        ctx!.beginPath(); ctx!.arc(-c.r*0.2, -c.r*0.2, c.r * 0.2, 0, Math.PI * 2); ctx!.fill();
        ctx!.restore();
      });

      obstacles.forEach(drawCanister);

      ctx!.save();
      if (player.invuln > 0 && frame % 10 < 5) ctx!.globalAlpha = 0.4;
      const cx = player.x + player.w/2;
      ctx!.translate(cx, GROUND_Y); ctx!.scale(1 / Math.sqrt(player.squash), player.squash); ctx!.translate(-cx, -GROUND_Y);
      drawPixelPlayer(ctx!, player.x, player.y);
      ctx!.restore();

      ctx!.save();
      particles.forEach(p => {
        ctx!.globalAlpha = Math.max(0, p.life); ctx!.fillStyle = p.color; ctx!.fillRect(p.x, p.y, 4, 4);
      });
      ctx!.restore();

      animationId = requestAnimationFrame(loop);
    }

    animationId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener("resize", resize);
      window.removeEventListener("keydown", handleKeyDown);
      canvas.removeEventListener("pointerdown", jump);
    };
  }, [currentReel, reelState, sfx, ecoMode]);


  // -----------------------------------------------------
  // RENDER HELPERS
  // -----------------------------------------------------
  const startNextReel = () => {
    scoreRef.current = 0; setUiScore(0);
    livesRef.current = 3; setUiLives(3);
    setReelState("intro");
    setCurrentReel(prev => prev + 1);
  };

  const retryReel = () => {
    scoreRef.current = 0; setUiScore(0);
    livesRef.current = 3; setUiLives(3);
    setReelState("playing");
  };

  const getReelContent = () => {
    switch(currentReel) {
      case 1:
        return {
          tag: "Reel 1 — Who I Am", title: "Third Year, Frame by Frame",
          desc: "I'm Aditya Parihar — a Computer Science major in my third year at UPES. Code is my major, but cinema is where my head actually lives. It’s chaotic, unpredictable, and you have to keep moving.",
          game: "runner"
        };
      case 2:
        return {
          tag: "Reel 2 — Off Screen", title: "When I'm Not Watching Something",
          desc: "Football and running keep me moving. Chess keeps me thinking. But color grading is about finding the exact mood in the chaos.",
          game: "color"
        };
      case 3:
        return {
          tag: "Reel 3 — Top Cuts", title: "Four Films I Keep Coming Back To",
          desc: "My Letterboxd is basically a diary. Let's see if you can match the films that shaped my perspective.",
          game: "memory"
        };
      case 4:
        return {
          tag: "Reel 4 — Outtake", title: "The Blooper Reel",
          desc: "Fun fact: I sometimes stumble over certain sounds when I talk — words starting with things like 'wh-' can trip me up. It's just part of my story — not something I hide.",
          game: "text"
        };
      case 5:
        return {
          tag: "Reel 5 — The End", title: "Roll Credits",
          desc: "Thanks for watching the whole reel. If any of this resonated — the films, the code, or the journey — I'd genuinely like to hear from you.",
          game: "end"
        };
      default: return null;
    }
  };

  const content = getReelContent();

  return (
    <div className={`fixed inset-0 z-[9999] bg-[#050509] flex flex-col font-sans ${ecoMode ? 'eco-mode' : ''}`}>
      <style dangerouslySetInnerHTML={{__html: `
        .arcade-scanlines {
          background: repeating-linear-gradient(to bottom, rgba(0,0,0,0.14) 0px, rgba(0,0,0,0.14) 1px, transparent 2px, transparent 4px);
          mix-blend-mode: multiply; pointer-events: none;
        }
        .eco-mode .arcade-scanlines, .eco-mode .arcade-vignette { display: none !important; }
        .preserve-3d { transform-style: preserve-3d; }
        .perspective-1000 { perspective: 1000px; }
        .backface-hidden { backface-visibility: hidden; }
      `}} />

      <div className="w-full h-16 bg-[#0a0a0f] border-b border-white/10 flex items-center justify-between px-6 shrink-0 z-50">
        <span className="text-white/80 font-mono text-sm tracking-widest uppercase">Interactive Arcade {ecoMode && '(Eco)'}</span>
        <button onClick={onClose} className="text-white/60 hover:text-white flex items-center gap-2 font-mono text-xs tracking-wider uppercase">
          Exit <X className="h-4 w-4" />
        </button>
      </div>

      <div className="relative flex-1 flex flex-col items-center justify-center p-4 lg:p-8 overflow-hidden bg-[radial-gradient(circle_at_center,rgba(232,178,61,0.08),transparent_60%)]">
        
        {/* HUD (Only show during Reel 1 Runner Game for now) */}
        {currentReel === 1 && (reelState === "playing" || reelState === "fail") && (
          <div className="absolute top-8 left-8 right-8 z-40 flex justify-between font-mono text-white pointer-events-none">
            <div>
              <div className="text-xs text-white/50 uppercase tracking-widest mb-1">Score</div>
              <div className="text-2xl text-[#e8b23d] font-bold">{uiScore.toString().padStart(3, '0')}</div>
            </div>
            <div className="text-center">
              <div className="text-xs text-white/50 uppercase tracking-widest mb-1">Reel</div>
              <div className="text-2xl">{currentReel} / 5</div>
            </div>
            <div className="text-right">
              <div className="text-xs text-white/50 uppercase tracking-widest mb-1">Lives</div>
              <div className="flex gap-2 justify-end mt-2">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className={`w-3 h-3 rounded-full ${i < uiLives ? 'bg-[#b3122e] shadow-[0_0_10px_#b3122e]' : 'border border-white/20'}`} />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Game Stage Container */}
        <div className="relative w-full max-w-5xl aspect-[16/8.8] rounded-3xl overflow-hidden border border-white/10 shadow-[0_30px_80px_rgba(0,0,0,0.5),0_0_60px_rgba(232,178,61,0.12)] bg-[#0b0b0f]">
          <div className="arcade-scanlines absolute inset-0 z-40" />
          <div className="arcade-vignette absolute inset-0 z-30 shadow-[inset_0_0_140px_rgba(0,0,0,0.6)] pointer-events-none" />

          {/* Intro Overlay */}
          <AnimatePresence mode="wait">
            {reelState === "intro" && content && (
              <motion.div 
                key="intro"
                initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/80 backdrop-blur-md p-8 text-center"
              >
                <div className="text-[#e8b23d] font-mono text-sm tracking-[0.2em] uppercase mb-4">{content.tag}</div>
                <h2 className="text-white font-serif italic text-4xl lg:text-5xl mb-6">{content.title}</h2>
                <p className="text-white/80 font-mono max-w-2xl text-lg leading-relaxed mb-10">{content.desc}</p>
                {content.game !== "end" ? (
                  <button onClick={() => setReelState("playing")} className="bg-gradient-to-b from-[#f5cf78] to-[#e8b23d] text-black px-8 py-3 rounded-full font-mono uppercase tracking-widest hover:scale-105 transition-transform">
                    {content.game === "text" ? "Continue" : "Start Reel"}
                  </button>
                ) : (
                  <button onClick={onClose} className="bg-white text-black px-8 py-3 rounded-full font-mono uppercase tracking-widest hover:scale-105 transition-transform">
                    Close Arcade
                  </button>
                )}
              </motion.div>
            )}

            {/* Fail Overlay */}
            {reelState === "fail" && (
              <motion.div 
                key="fail" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/90 backdrop-blur-md"
              >
                <h2 className="text-[#ff6a82] font-serif italic text-4xl lg:text-5xl mb-2">Cut! Take 2.</h2>
                <div className="text-white font-mono text-xl mb-8">Score: {uiScore}</div>
                <button onClick={retryReel} className="border border-white/20 text-white px-8 py-3 rounded-full font-mono uppercase tracking-widest hover:bg-white/10 transition-colors">
                  Try Again
                </button>
              </motion.div>
            )}

            {/* Completed Overlay */}
            {reelState === "completed" && (
              <motion.div 
                key="completed" initial={{ opacity: 0, scale: 1.1 }} animate={{ opacity: 1, scale: 1 }}
                className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/80 backdrop-blur-md p-8"
              >
                <div className="bg-[#f4ead8] text-[#241a1e] p-8 rounded-2xl max-w-lg w-full shadow-2xl relative overflow-hidden text-center">
                  <div className="absolute top-4 right-4 text-[#b3122e] font-mono border-2 border-[#b3122e] rounded-full w-16 h-16 flex items-center justify-center -rotate-12 opacity-80 text-[10px] p-1 uppercase font-bold mix-blend-multiply">
                    Scene<br/>Wrapped
                  </div>
                  <h2 className="font-serif italic text-3xl mb-6 mt-4">Great Job!</h2>
                  <p className="text-lg mb-8 font-mono">You've successfully completed Reel {currentReel}.</p>
                  <button onClick={startNextReel} className="bg-[#241a1e] text-[#f4ead8] px-8 py-3 rounded-full font-mono text-sm uppercase tracking-wider hover:bg-black transition-colors w-full">
                    Load Next Reel
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Reel 1: Runner Canvas */}
          {currentReel === 1 && <canvas ref={canvasRef} className="absolute inset-0 w-full h-full object-cover z-0" style={{ imageRendering: 'pixelated' }} />}

          {/* Reel 2: Color Grader */}
          {currentReel === 2 && reelState === "playing" && <ColorGraderGame onComplete={() => setReelState("completed")} sfx={sfx} />}

          {/* Reel 3: Memory Match */}
          {currentReel === 3 && reelState === "playing" && <MemoryMatchGame onComplete={() => setReelState("completed")} sfx={sfx} />}

          {/* Reel 4: Just Text -> skip straight to completed */}
          {currentReel === 4 && reelState === "playing" && (() => { setReelState("completed"); return null; })()}

        </div>

        <button 
          onClick={() => setSoundEnabled(!soundEnabled)}
          className="absolute bottom-8 right-8 z-40 bg-black/50 backdrop-blur-md border border-white/20 p-3 rounded-full text-[#e8b23d] hover:bg-black/70 transition-colors"
        >
          {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
        </button>

      </div>
    </div>
  );
}
