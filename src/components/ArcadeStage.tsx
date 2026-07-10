import { useEffect, useRef, useState, useMemo } from "react";
import { X, Volume2, VolumeX, Play } from "lucide-react";

export function ArcadeStage({ onClose }: { onClose: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const bgmAudio = useRef<HTMLAudioElement | null>(null);

  const [gameState, setGameState] = useState<"start" | "playing" | "fail" | "reveal">("start");
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [ecoMode, setEcoMode] = useState(false);
  const [currentReel, setCurrentReel] = useState(0);

  // Use refs for fast updates in loop
  const scoreRef = useRef(0);
  const livesRef = useRef(3);
  const frameTimes = useRef<number[]>([]);

  useEffect(() => {
    bgmAudio.current = new Audio("/bgm.mp3");
    bgmAudio.current.loop = true;
    bgmAudio.current.volume = 0.5;

    return () => {
      bgmAudio.current?.pause();
    };
  }, []);

  useEffect(() => {
    if (soundEnabled && gameState === "playing") {
      bgmAudio.current?.play().catch(() => {});
    } else {
      bgmAudio.current?.pause();
    }
  }, [soundEnabled, gameState]);

  // Sound Engine
  const playSound = (freq: number, dur: number, type: string, vol: number, delay = 0) => {
    if (!soundEnabled) return;
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

  const sfx = useMemo(() => ({
    jump: () => { playSound(440, 0.12, "square", 0.1); playSound(660, 0.10, "square", 0.08, 0.03); },
    coin: () => { playSound(988, 0.08, "square", 0.1); playSound(1318, 0.12, "square", 0.1, 0.06); },
    hit: () => playSound(120, 0.22, "sawtooth", 0.14),
    step: () => playSound(200, 0.03, "square", 0.03),
    reveal: () => { playSound(523, 0.1, "triangle", 0.09); playSound(659, 0.1, "triangle", 0.09, 0.09); playSound(784, 0.16, "triangle", 0.1, 0.18); }
  }), [soundEnabled]);

  // Game Engine
  useEffect(() => {
    if (gameState !== "playing") return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Load custom sprite
    const playerImg = new Image();
    playerImg.src = "/IMG_9397.PNG";

    const LOGICAL_W = 960;
    const LOGICAL_H = 480;
    const GROUND_Y = 360;
    const GRAVITY = 0.85;
    const JUMP_V = -15.5;

    let frame = 0;
    let speed = 6;
    let spawnTimer = 0;

    const player = {
      x: 110, y: GROUND_Y - 40, w: 40, h: 48,
      vy: 0, onGround: true, invuln: 0, squash: 1
    };

    let obstacles: any[] = [];
    let coins: any[] = [];
    let particles: any[] = [];

    let animationId: number;

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
        particles.push({
          x, y,
          vx: (Math.random() - 0.5) * 8, vy: (Math.random() - 1) * 6,
          life: 1, color
        });
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
        const y = baseY - Math.sin(x * 0.008) * amp * 0.5 - amp * 0.3;
        ctx!.lineTo(x, y);
      }
      ctx!.lineTo(LOGICAL_W + step, GROUND_Y + 2);
      ctx!.closePath();
      ctx!.fill();
    }

    function drawCanister(o: any) {
      if (o.type === 'c-stand') {
        ctx!.fillStyle = "#aaa";
        ctx!.fillRect(o.x + 12, o.y - 10, 4, o.h + 10);
        ctx!.beginPath(); ctx!.moveTo(o.x + 14, o.y + o.h); ctx!.lineTo(o.x, o.y + o.h); ctx!.lineTo(o.x + 14, o.y + o.h - 10); ctx!.fill();
        ctx!.beginPath(); ctx!.moveTo(o.x + 14, o.y + o.h); ctx!.lineTo(o.x + 28, o.y + o.h); ctx!.lineTo(o.x + 14, o.y + o.h - 10); ctx!.fill();
      } else if (o.type === 'pelican') {
        ctx!.fillStyle = "#111";
        ctx!.fillRect(o.x, o.y + 10, o.w, o.h - 10);
        ctx!.fillStyle = "#333";
        ctx!.fillRect(o.x + 4, o.y + 14, o.w - 8, 4);
      } else {
        // Film canister
        ctx!.fillStyle = "#1c1c24";
        ctx!.fillRect(o.x, o.y + 4, o.w, o.h - 8);
        ctx!.fillStyle = "#b3122e";
        ctx!.fillRect(o.x, o.y + o.h/2 - 4, o.w, 8);
      }
    }

    let lastTime = performance.now();

    function loop() {
      const now = performance.now();
      const dt = now - lastTime;
      lastTime = now;

      // Eco Mode FPS monitor
      frameTimes.current.push(dt);
      if (frameTimes.current.length > 60) {
        frameTimes.current.shift();
        const avgDt = frameTimes.current.reduce((a, b) => a + b) / 60;
        if (avgDt > 22 && !ecoMode) { // < ~45 FPS
          setEcoMode(true);
        }
      }

      frame++;
      speed = 6 + Math.min(4, scoreRef.current / 150);

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

      if (player.onGround && frame % 9 === 0) sfx.step();

      // Spawning
      spawnTimer--;
      if (spawnTimer <= 0) {
        spawnTimer = 40 + Math.random() * 30;
        if (Math.random() < 0.55) {
          coins.push({ x: LOGICAL_W + 20, y: GROUND_Y - 90 - Math.random() * 40, r: 12, wobble: Math.random() * 10 });
        } else {
          const types = ['c-stand', 'pelican', 'canister'];
          const t = types[Math.floor(Math.random() * types.length)];
          obstacles.push({ x: LOGICAL_W + 20, y: GROUND_Y - 34, w: 28, h: 34, type: t });
        }
      }

      // Update entities
      for (let i = obstacles.length - 1; i >= 0; i--) {
        const o = obstacles[i];
        o.x -= speed;
        if (o.x + o.w < -20) { obstacles.splice(i, 1); continue; }
        if (player.invuln === 0 && player.x < o.x + o.w - 6 && player.x + player.w > o.x + 6 && player.y + player.h > o.y + 6) {
          livesRef.current--;
          setLives(livesRef.current);
          player.invuln = 90;
          player.squash = 1.25;
          sfx.hit();
          if (livesRef.current <= 0) {
            setGameState("fail");
            return;
          }
        }
      }

      for (let i = coins.length - 1; i >= 0; i--) {
        const c = coins[i];
        c.x -= speed;
        if (c.x < -20) { coins.splice(i, 1); continue; }
        const dx = (player.x + player.w/2) - c.x;
        const dy = (player.y + player.h/2) - c.y;
        if (Math.sqrt(dx*dx + dy*dy) < c.r + 18) {
          scoreRef.current += 10;
          setScore(scoreRef.current);
          if (scoreRef.current % 40 === 0 && scoreRef.current <= 200) {
            setCurrentReel(scoreRef.current / 40);
          }
          if (scoreRef.current >= 200) {
            setGameState("reveal");
            sfx.reveal();
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
      
      // Sky
      const sky = ctx!.createLinearGradient(0, 0, 0, GROUND_Y);
      sky.addColorStop(0, "#1b1030"); sky.addColorStop(1, "#3a1626");
      ctx!.fillStyle = sky;
      ctx!.fillRect(0, 0, LOGICAL_W, GROUND_Y);

      // Stars
      STARS.forEach(s => {
        ctx!.fillStyle = `rgba(244,234,216,${0.25 + 0.5 * Math.sin(frame * 0.03 + s.phase)})`;
        ctx!.beginPath(); ctx!.arc(s.x, s.y, s.r, 0, Math.PI * 2); ctx!.fill();
      });

      drawHillLayer(GROUND_Y - 46, 0.15, "#241033", 70);
      drawHillLayer(GROUND_Y - 20, 0.3, "#1a0c26", 46);

      // Ground
      ctx!.fillStyle = "#0b0b0f"; ctx!.fillRect(0, GROUND_Y, LOGICAL_W, LOGICAL_H - GROUND_Y);
      ctx!.fillStyle = "#2a2a35"; ctx!.fillRect(0, GROUND_Y, LOGICAL_W, 6);

      // Draw Coins
      coins.forEach(c => {
        ctx!.save(); ctx!.translate(c.x, c.y + Math.sin(frame * 0.1 + c.wobble) * 6);
        ctx!.rotate((frame * 0.05 + c.wobble) % (Math.PI * 2));
        ctx!.fillStyle = "#e8b23d"; ctx!.fillRect(-c.r, -c.r*0.8, c.r*2, c.r*1.6);
        ctx!.fillStyle = "#050509"; ctx!.fillRect(-c.r + 3, -c.r*0.7, 3, 3);
        ctx!.restore();
      });

      obstacles.forEach(drawCanister);

      // Draw Player
      ctx!.save();
      if (player.invuln > 0 && frame % 10 < 5) ctx!.globalAlpha = 0.4;
      const cx = player.x + player.w/2;
      ctx!.translate(cx, GROUND_Y); ctx!.scale(1 / Math.sqrt(player.squash), player.squash); ctx!.translate(-cx, -GROUND_Y);
      
      if (playerImg.complete && playerImg.naturalWidth > 0) {
        // Draw user image if loaded
        ctx!.drawImage(playerImg, player.x, player.y, player.w, player.h);
      } else {
        // Fallback red rectangle
        ctx!.fillStyle = "#b3122e";
        ctx!.fillRect(player.x, player.y, player.w, player.h);
      }
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
  }, [gameState, sfx, ecoMode]);

  return (
    <div className={`fixed inset-0 z-[9999] bg-[#050509] flex flex-col font-sans ${ecoMode ? 'eco-mode' : ''}`}>
      <style dangerouslySetInnerHTML={{__html: `
        .arcade-scanlines {
          background: repeating-linear-gradient(to bottom, rgba(0,0,0,0.14) 0px, rgba(0,0,0,0.14) 1px, transparent 2px, transparent 4px);
          mix-blend-mode: multiply; pointer-events: none;
        }
        .eco-mode .arcade-scanlines, .eco-mode .arcade-vignette { display: none !important; }
      `}} />

      <div className="w-full h-16 bg-[#0a0a0f] border-b border-white/10 flex items-center justify-between px-6 shrink-0 z-50">
        <span className="text-white/80 font-mono text-sm tracking-widest uppercase">Interactive Arcade {ecoMode && '(Eco)'}</span>
        <button onClick={onClose} className="text-white/60 hover:text-white flex items-center gap-2 font-mono text-xs tracking-wider uppercase">
          Exit <X className="h-4 w-4" />
        </button>
      </div>

      <div className="relative flex-1 flex flex-col items-center justify-center p-4 lg:p-8 overflow-hidden bg-[radial-gradient(circle_at_center,rgba(232,178,61,0.08),transparent_60%)]">
        
        {/* HUD */}
        <div className="absolute top-8 left-8 right-8 z-40 flex justify-between font-mono text-white pointer-events-none">
          <div>
            <div className="text-xs text-white/50 uppercase tracking-widest mb-1">Score</div>
            <div className="text-2xl text-[#e8b23d] font-bold">{score.toString().padStart(3, '0')}</div>
          </div>
          <div className="text-center">
            <div className="text-xs text-white/50 uppercase tracking-widest mb-1">Reel</div>
            <div className="text-2xl">{currentReel} / 5</div>
          </div>
          <div className="text-right">
            <div className="text-xs text-white/50 uppercase tracking-widest mb-1">Lives</div>
            <div className="flex gap-2 justify-end mt-2">
              {[...Array(3)].map((_, i) => (
                <div key={i} className={`w-3 h-3 rounded-full ${i < lives ? 'bg-[#b3122e] shadow-[0_0_10px_#b3122e]' : 'border border-white/20'}`} />
              ))}
            </div>
          </div>
        </div>

        {/* Game Stage */}
        <div className="relative w-full max-w-5xl aspect-[16/8.8] rounded-3xl overflow-hidden border border-white/10 shadow-[0_30px_80px_rgba(0,0,0,0.5),0_0_60px_rgba(232,178,61,0.12)]">
          
          <div className="arcade-scanlines absolute inset-0 z-20" />
          <div className="arcade-vignette absolute inset-0 z-10 shadow-[inset_0_0_140px_rgba(0,0,0,0.6)] pointer-events-none" />

          <canvas ref={canvasRef} className="absolute inset-0 w-full h-full object-cover z-0" style={{ imageRendering: 'pixelated' }} />

          {/* Overlays */}
          {gameState === "start" && (
            <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm">
              <h2 className="text-[#e8b23d] font-serif italic text-4xl lg:text-6xl mb-4 text-center">Reel Runner</h2>
              <p className="text-white/80 font-mono max-w-md text-center mb-8">Tap or press Space/Up to jump over camera gear and collect film reels.</p>
              <button 
                onClick={() => { setScore(0); scoreRef.current=0; setLives(3); livesRef.current=3; setCurrentReel(0); setGameState("playing"); }}
                className="bg-gradient-to-b from-[#f5cf78] to-[#e8b23d] text-black px-8 py-3 rounded-full font-mono uppercase tracking-widest hover:scale-105 transition-transform"
              >
                Insert Coin
              </button>
            </div>
          )}

          {gameState === "fail" && (
            <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-black/80 backdrop-blur-md">
              <h2 className="text-[#ff6a82] font-serif italic text-4xl lg:text-5xl mb-2 text-center">Game Over</h2>
              <div className="text-white font-mono text-xl mb-8">Final Score: {score}</div>
              <button 
                onClick={() => { setScore(0); scoreRef.current=0; setLives(3); livesRef.current=3; setCurrentReel(0); setGameState("playing"); }}
                className="border border-white/20 text-white px-8 py-3 rounded-full font-mono uppercase tracking-widest hover:bg-white/10 transition-colors"
              >
                Try Again
              </button>
            </div>
          )}

          {gameState === "reveal" && (
            <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-black/80 backdrop-blur-md p-8">
              <div className="bg-[#f4ead8] text-[#241a1e] p-8 rounded-2xl max-w-2xl w-full shadow-2xl relative overflow-hidden">
                <div className="absolute top-4 right-4 text-[#b3122e] font-mono border-2 border-[#b3122e] rounded-full w-20 h-20 flex items-center justify-center -rotate-12 opacity-80 text-xs text-center p-2 uppercase font-bold mix-blend-multiply">
                  Level<br/>Cleared
                </div>
                <h3 className="font-mono text-[#b3122e] tracking-widest text-sm mb-4">Reel 5 — The End</h3>
                <h2 className="font-serif italic text-3xl mb-6">Roll Credits</h2>
                <p className="text-lg leading-relaxed mb-6">
                  Thanks for playing! You've successfully navigated the set. Check out my latest work in the portfolio, or drop me an email if you'd like to collaborate.
                </p>
                <button 
                  onClick={onClose}
                  className="bg-[#241a1e] text-[#f4ead8] px-6 py-3 rounded-full font-mono text-sm uppercase tracking-wider hover:bg-black transition-colors"
                >
                  Return to Portfolio
                </button>
              </div>
            </div>
          )}

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
