import { useEffect, useRef, useState, useMemo } from "react";
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
      click: () => playSound(800, 0.05, "sine", 0.05),
      win: () => { playSound(523, 0.1, "triangle", 0.09); playSound(659, 0.1, "triangle", 0.09, 0.09); playSound(1046, 0.2, "triangle", 0.1, 0.18); }
    };
  }, [enabled]);
};


// -----------------------------------------------------
// CHESS PUZZLE (Reel 2)
// -----------------------------------------------------
function ChessPuzzleGame({ onComplete, sfx }: { onComplete: () => void, sfx: any }) {
  const initialBoard = Array(64).fill("");
  initialBoard[4] = "♚"; 
  initialBoard[13] = "♟"; 
  initialBoard[14] = "♟"; 
  initialBoard[15] = "♟"; 
  initialBoard[26] = "♗"; 
  initialBoard[35] = "♕"; 

  const [board, setBoard] = useState(initialBoard);
  const [selected, setSelected] = useState<number | null>(null);
  const [win, setWin] = useState(false);

  const handleSquareClick = (idx: number) => {
    if (win) return;
    if (selected === null) {
      if (board[idx] === "♕" || board[idx] === "♗") {
        setSelected(idx);
        sfx.click();
      }
    } else {
      if (selected === 35 && idx === 13) {
        const newBoard = [...board];
        newBoard[13] = "♕";
        newBoard[35] = "";
        setBoard(newBoard);
        setSelected(null);
        setWin(true);
        sfx.win();
        setTimeout(onComplete, 1500);
      } else {
        setSelected(null);
        sfx.hit();
      }
    }
  };

  return (
    <div className="absolute inset-0 z-30 flex flex-col items-center justify-center p-8 bg-[#0b0b0f]">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-serif text-white mb-2">{win ? "Checkmate!" : "Find the Mate in 1"}</h2>
        <p className="text-white/50 text-xs font-mono">White to play and win.</p>
      </div>
      <div className="w-full max-w-[320px] aspect-square grid grid-cols-8 border-4 border-[#241a1e] rounded shadow-2xl">
        {board.map((piece, i) => {
          const row = Math.floor(i / 8);
          const col = i % 8;
          const isDark = (row + col) % 2 === 1;
          const isSelected = selected === i;
          return (
            <div key={i} onClick={() => handleSquareClick(i)} className={`flex items-center justify-center text-3xl cursor-pointer select-none ${isDark ? 'bg-[#71828F]' : 'bg-[#C7D0D8]'} ${isSelected ? 'ring-inset ring-4 ring-[#e8b23d] bg-[#e8b23d]/50' : ''}`}>
              <span className={piece === "♕" || piece === "♗" ? "text-white drop-shadow-md" : "text-black drop-shadow-sm"}>{piece}</span>
            </div>
          );
        })}
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
              sfx.win();
              setTimeout(onComplete, 1500);
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
          <div key={c.id} onClick={() => handleCardClick(i)} className="w-20 h-28 md:w-28 md:h-40 perspective-1000 cursor-pointer">
            <motion.div className="w-full h-full relative preserve-3d" animate={{ rotateY: c.flipped || c.matched ? 180 : 0 }} transition={{ duration: 0.4 }}>
              <div className="absolute inset-0 backface-hidden bg-[#241a1e] border border-[#e8b23d]/30 rounded-lg flex items-center justify-center shadow-lg">
                <span className="text-[#e8b23d]/30 font-serif italic text-3xl">?</span>
              </div>
              <div className="absolute inset-0 backface-hidden bg-black rounded-lg overflow-hidden border border-[#e8b23d] shadow-[0_0_15px_rgba(232,178,61,0.4)]" style={{ transform: 'rotateY(180deg)' }}>
                <img src={c.img} className="w-full h-full object-cover opacity-90" />
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

  // START IN "playing" STATE FOR GAME -> STORY FLOW
  const [currentReel, setCurrentReel] = useState(1);
  const [reelState, setReelState] = useState<"playing" | "story" | "fail">("playing");
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
    if (soundEnabled && (reelState === "playing" || reelState === "story")) {
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

    // Load generated sprite sheet & apply chroma key
    const spriteSheet = new Image();
    spriteSheet.src = "/runner_sprite.png";
    const processedCanvas = document.createElement("canvas");
    let isSpriteReady = false;

    spriteSheet.onload = () => {
      processedCanvas.width = spriteSheet.naturalWidth;
      processedCanvas.height = spriteSheet.naturalHeight;
      const pCtx = processedCanvas.getContext("2d");
      if (pCtx) {
        pCtx.drawImage(spriteSheet, 0, 0);
        const imgData = pCtx.getImageData(0, 0, processedCanvas.width, processedCanvas.height);
        const data = imgData.data;
        for (let i = 0; i < data.length; i += 4) {
          // Remove white background (R, G, B > 230)
          if (data[i] > 230 && data[i+1] > 230 && data[i+2] > 230) {
            data[i+3] = 0; 
          }
        }
        pCtx.putImageData(imgData, 0, 0);
        isSpriteReady = true;
      }
    };

    const LOGICAL_W = 960;
    const LOGICAL_H = 480;
    const GROUND_Y = 360;
    const GRAVITY = 0.85;
    const JUMP_V = -15.5;

    let frame = 0;
    let speed = 6;
    let spawnTimer = 0;
    let animationId: number;

    const player = { x: 110, y: GROUND_Y - 80, w: 60, h: 80, vy: 0, onGround: true, invuln: 0, squash: 1, isCrouching: false, crouchTimer: 0 };
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
      if (player.onGround && !player.isCrouching) {
        player.vy = JUMP_V;
        player.onGround = false;
        player.squash = 1.3;
        spawnParticles(player.x + player.w/2, player.y + player.h, 15, "#fff");
        sfx.jump();
      }
    };

    const crouch = () => {
      if (player.onGround && !player.isCrouching) {
        player.crouchTimer = 35; // Crouch for ~0.5s
        sfx.step(); // Quick slide sound
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space" || e.code === "ArrowUp") { e.preventDefault(); jump(); }
      if (e.code === "ArrowDown" || e.code === "KeyS") { e.preventDefault(); crouch(); }
    };
    window.addEventListener("keydown", handleKeyDown);
    canvas.addEventListener("pointerdown", jump, { passive: true }); // Click to jump

    function spawnParticles(x: number, y: number, count: number, color: string) {
      for (let i = 0; i < count; i++) {
        particles.push({ x, y, vx: (Math.random() - 0.5) * 8, vy: (Math.random() - 1) * 6, life: 1, color });
      }
    }

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

    function drawObstacle(o: any) {
      ctx!.save();
      ctx!.translate(o.x, o.y);
      if (o.type === 'c-stand') {
        ctx!.fillStyle = "#222";
        ctx!.fillRect(12, -20, 6, o.h + 20); // main pole
        ctx!.fillRect(0, o.h - 6, 30, 6); // base
        ctx!.fillRect(12, -15, 20, 4); // arm
      } else if (o.type === 'pelican') {
        ctx!.fillStyle = "#111";
        ctx!.beginPath(); ctx!.roundRect(0, 8, o.w + 10, o.h - 8, 4); ctx!.fill();
        ctx!.fillStyle = "#e8b23d"; // yellow accent
        ctx!.fillRect(4, 14, o.w + 2, 4);
      } else if (o.type === 'boom-mic') {
        ctx!.fillStyle = "#333";
        ctx!.fillRect(o.w/2 - 2, -120, 4, 120); // pole coming from top
        ctx!.fillStyle = "#1a1a1a";
        ctx!.beginPath(); ctx!.roundRect(0, 0, o.w, o.h, 10); ctx!.fill(); // fuzzy mic
        // Small grey details
        ctx!.fillStyle = "#555";
        ctx!.fillRect(4, 4, o.w-8, 2);
        ctx!.fillRect(4, 12, o.w-8, 2);
      }
      ctx!.restore();
    }

    function loop() {
      const now = performance.now();
      const dt = now - lastTime;
      lastTime = now;

      frameTimes.current.push(dt);
      if (frameTimes.current.length > 60) {
        frameTimes.current.shift();
        const avgDt = frameTimes.current.reduce((a, b) => a + b) / 60;
        if (avgDt > 22 && !ecoMode) setEcoMode(true);
      }

      frame++;
      speed = 7 + Math.min(5, scoreRef.current / 80);

      // Crouch Logic
      if (player.crouchTimer > 0) {
        player.crouchTimer--;
        player.isCrouching = true;
      } else {
        player.isCrouching = false;
      }

      // Physics
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

      if (player.onGround && !player.isCrouching && frame % 12 === 0) sfx.step();

      // Spawning
      spawnTimer--;
      if (spawnTimer <= 0) {
        spawnTimer = 50 + Math.random() * 30;
        if (Math.random() < 0.50) {
          coins.push({ x: LOGICAL_W + 20, y: GROUND_Y - 90 - Math.random() * 60, r: 16, wobble: Math.random() * 10 });
        } else {
          const types = ['c-stand', 'pelican', 'boom-mic'];
          const type = types[Math.floor(Math.random() * types.length)];
          const yPos = type === 'boom-mic' ? GROUND_Y - 90 : GROUND_Y - 40;
          const height = type === 'boom-mic' ? 30 : 40;
          obstacles.push({ x: LOGICAL_W + 20, y: yPos, w: 32, h: height, type });
        }
      }

      // Dynamic Hitbox for Crouch
      const hitboxTop = player.y + (player.isCrouching ? player.h * 0.5 : 0);
      const hitboxHeight = player.isCrouching ? player.h * 0.5 : player.h;

      // Update obstacles
      for (let i = obstacles.length - 1; i >= 0; i--) {
        const o = obstacles[i];
        o.x -= speed;
        if (o.x + o.w < -20) { obstacles.splice(i, 1); continue; }
        // Hitbox collision
        if (player.invuln === 0 && 
            player.x + 10 < o.x + o.w && 
            player.x + player.w - 10 > o.x && 
            hitboxTop + hitboxHeight > o.y + 10 && 
            hitboxTop < o.y + o.h) {
          
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

      // Update AP Monogram Coins
      for (let i = coins.length - 1; i >= 0; i--) {
        const c = coins[i];
        c.x -= speed;
        if (c.x < -20) { coins.splice(i, 1); continue; }
        const dx = (player.x + player.w/2) - c.x;
        const dy = (player.y + player.h/2) - c.y;
        if (Math.sqrt(dx*dx + dy*dy) < c.r + 24) {
          scoreRef.current += 10;
          setUiScore(scoreRef.current);
          if (scoreRef.current >= 40) { 
            sfx.win();
            setReelState("story"); // Go to story when won
            return;
          }
          coins.splice(i, 1);
          spawnParticles(c.x, c.y, 20, "#e8b23d");
          sfx.coin();
        }
      }

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx; p.y += p.vy; p.vy += 0.2; p.life -= 0.03;
        if (p.life <= 0) particles.splice(i, 1);
      }

      // Draw Background - Sunset
      ctx!.clearRect(0, 0, LOGICAL_W, LOGICAL_H);
      const sky = ctx!.createLinearGradient(0, 0, 0, GROUND_Y);
      sky.addColorStop(0, "#ff7b54"); sky.addColorStop(1, "#ffd56b");
      ctx!.fillStyle = sky; ctx!.fillRect(0, 0, LOGICAL_W, GROUND_Y);
      ctx!.fillStyle = "#fff4d4";
      ctx!.beginPath(); ctx!.arc(LOGICAL_W * 0.7, GROUND_Y * 0.6, 60, 0, Math.PI*2); ctx!.fill();

      drawHillLayer(GROUND_Y - 60, 0.15, "#e36e5c", 80);
      drawHillLayer(GROUND_Y - 20, 0.3, "#a34a58", 50);

      ctx!.fillStyle = "#1a1a24"; ctx!.fillRect(0, GROUND_Y, LOGICAL_W, LOGICAL_H - GROUND_Y);
      ctx!.fillStyle = "#e8b23d"; ctx!.fillRect(0, GROUND_Y, LOGICAL_W, 4);

      // Draw Coins (AP Monogram)
      coins.forEach(c => {
        ctx!.save(); ctx!.translate(c.x, c.y + Math.sin(frame * 0.1 + c.wobble) * 8);
        ctx!.fillStyle = "#e8b23d";
        ctx!.shadowColor = "#e8b23d"; ctx!.shadowBlur = 10;
        ctx!.beginPath(); ctx!.arc(0, 0, c.r, 0, Math.PI * 2); ctx!.fill();
        ctx!.shadowBlur = 0;
        ctx!.fillStyle = "#111";
        ctx!.beginPath(); ctx!.arc(0, 0, c.r * 0.8, 0, Math.PI * 2); ctx!.fill();
        
        // AP Text
        ctx!.fillStyle = "#e8b23d";
        ctx!.font = "bold 14px monospace";
        ctx!.textAlign = "center";
        ctx!.textBaseline = "middle";
        ctx!.fillText("AP", 0, 1);
        ctx!.restore();
      });

      obstacles.forEach(drawObstacle);

      // Draw Player (Transparent Sprite Sheet + Crouch Logic)
      ctx!.save();
      if (player.invuln > 0 && frame % 10 < 5) ctx!.globalAlpha = 0.4;
      const cx = player.x + player.w/2;
      ctx!.translate(cx, GROUND_Y); 
      
      // If crouching, squash on Y heavily to simulate slide
      const renderSquash = player.isCrouching ? player.squash * 0.5 : player.squash;
      ctx!.scale(1 / Math.sqrt(renderSquash), renderSquash); 
      
      ctx!.translate(-cx, -GROUND_Y);
      
      if (isSpriteReady && processedCanvas.width > 0) {
        const cols = 2;
        const rows = 2;
        const frameW = processedCanvas.width / cols;
        const frameH = processedCanvas.height / rows;
        let currentSpriteFrame = 0;
        
        if (player.isCrouching) {
          currentSpriteFrame = 1; // Use jump frame as a proxy for sliding
        } else if (player.onGround) {
          currentSpriteFrame = Math.floor((frame / 6) % 4);
        } else {
          currentSpriteFrame = 1; // Jumping frame
        }
        
        const col = currentSpriteFrame % cols;
        const row = Math.floor(currentSpriteFrame / cols);
        
        ctx!.drawImage(
          processedCanvas,
          col * frameW, row * frameH, frameW, frameH,
          player.x - 20, player.y - 20, player.w + 40, player.h + 20
        );
      } else {
        // Fallback Box
        ctx!.fillStyle = "#3b5b82";
        ctx!.fillRect(player.x, player.y + (player.isCrouching ? player.h/2 : 0), player.w, player.isCrouching ? player.h/2 : player.h);
      }
      ctx!.restore();

      ctx!.save();
      particles.forEach(p => {
        ctx!.globalAlpha = Math.max(0, p.life); ctx!.fillStyle = p.color; ctx!.fillRect(p.x, p.y, 6, 6);
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
    const nextReel = currentReel + 1;
    setCurrentReel(nextReel);
    // If it's reel 4 (Outtakes) there is no game, just story.
    setReelState(nextReel >= 4 ? "story" : "playing"); 
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
          tag: "Ticket 1 — The Setup", title: "Who I Am",
          desc: "I'm Aditya Parihar — a Computer Science major in my third year at UPES. Code is my major, but cinema is where my head actually lives. It’s chaotic, unpredictable, and you have to keep moving."
        };
      case 2:
        return {
          tag: "Ticket 2 — The Strategy", title: "Off Screen",
          desc: "Football and running keep me moving. Chess keeps me thinking — sitting around 900–1000 Elo, I rely on pattern recognition as much as logic."
        };
      case 3:
        return {
          tag: "Ticket 3 — Top Cuts", title: "Four Films I Keep Coming Back To",
          desc: "My Letterboxd is basically a diary. These are the films that shaped my perspective."
        };
      case 4:
        return {
          tag: "Ticket 4 — Outtake", title: "The Blooper Reel",
          desc: "Fun fact: I sometimes stumble over certain sounds when I talk — words starting with things like 'wh-' can trip me up. It's just part of my story — not something I hide."
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
        <span className="text-white/80 font-mono text-sm tracking-widest uppercase">Interactive Cinema {ecoMode && '(Eco)'}</span>
        <button onClick={onClose} className="text-white/60 hover:text-white flex items-center gap-2 font-mono text-xs tracking-wider uppercase">
          Exit <X className="h-4 w-4" />
        </button>
      </div>

      <div className="relative flex-1 flex flex-col items-center justify-center p-4 lg:p-8 overflow-hidden bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.03),transparent_60%)]">
        
        {/* HUD (Only show during Reel 1 Runner Game) */}
        {currentReel === 1 && (reelState === "playing" || reelState === "fail") && (
          <div className="absolute top-8 left-8 right-8 z-40 flex justify-between font-mono text-black pointer-events-none drop-shadow-md">
            <div>
              <div className="text-xs uppercase tracking-widest mb-1 font-bold text-white/50">AP Coins</div>
              <div className="text-3xl text-white font-bold">{uiScore.toString().padStart(3, '0')}</div>
            </div>
            <div className="text-right">
              <div className="text-xs uppercase tracking-widest mb-1 font-bold text-white/50">Takes</div>
              <div className="flex gap-2 justify-end mt-2">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className={`w-4 h-4 rounded-full ${i < uiLives ? 'bg-[#b3122e] border-2 border-white' : 'border-2 border-black/50'}`} />
                ))}
              </div>
            </div>
            {/* Controls hint */}
            <div className="absolute bottom-[-40px] left-0 text-white/40 text-xs tracking-wider">SPACE = JUMP | DOWN = CROUCH</div>
          </div>
        )}

        {/* Game Stage Container */}
        <div className="relative w-full max-w-5xl aspect-[16/8.8] rounded-3xl overflow-hidden border border-white/10 shadow-[0_30px_80px_rgba(0,0,0,0.5)] bg-[#0b0b0f]">
          <div className="arcade-scanlines absolute inset-0 z-40 opacity-50" />
          <div className="arcade-vignette absolute inset-0 z-30 shadow-[inset_0_0_100px_rgba(0,0,0,0.8)] pointer-events-none" />

          <AnimatePresence mode="wait">
            {/* Story Overlay (Reward for winning the game) */}
            {reelState === "story" && content && (
              <motion.div 
                key="story"
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
                className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/90 backdrop-blur-md p-8 text-center"
              >
                <div className="border border-white/20 p-10 rounded-xl bg-gradient-to-b from-white/5 to-transparent max-w-2xl backdrop-blur-sm relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#e8b23d] to-transparent opacity-50"></div>
                  <div className="text-[#e8b23d] font-mono text-xs tracking-[0.3em] uppercase mb-6">{content.tag}</div>
                  <h2 className="text-white font-serif italic text-4xl lg:text-5xl mb-6 leading-tight">{content.title}</h2>
                  <p className="text-white/70 font-mono text-base leading-relaxed mb-10">{content.desc}</p>
                  
                  {currentReel < 4 ? (
                    <button onClick={startNextReel} className="bg-white text-black px-10 py-4 rounded-full font-mono uppercase tracking-widest text-sm hover:scale-105 hover:bg-[#e8b23d] transition-all">
                      Play Next Scene
                    </button>
                  ) : (
                    <button onClick={onClose} className="border border-white/20 text-white px-10 py-4 rounded-full font-mono uppercase tracking-widest text-sm hover:bg-white/10 transition-colors">
                      Return to Portfolio
                    </button>
                  )}
                </div>
              </motion.div>
            )}

            {/* Fail Overlay */}
            {reelState === "fail" && (
              <motion.div 
                key="fail" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/95 backdrop-blur-md"
              >
                <h2 className="text-[#ff6a82] font-serif italic text-5xl mb-4">Cut! Take 2.</h2>
                <button onClick={retryReel} className="border border-white/20 text-white px-8 py-3 rounded-full font-mono uppercase tracking-widest hover:bg-white/10 transition-colors">
                  Reset Scene
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Reel 1: Runner Canvas */}
          {currentReel === 1 && (reelState === "playing" || reelState === "fail") && 
            <canvas ref={canvasRef} className="absolute inset-0 w-full h-full object-cover z-0" style={{ imageRendering: 'pixelated' }} />
          }

          {/* Reel 2: Chess Puzzle */}
          {currentReel === 2 && reelState === "playing" && <ChessPuzzleGame onComplete={() => setReelState("story")} sfx={sfx} />}

          {/* Reel 3: Memory Match */}
          {currentReel === 3 && reelState === "playing" && <MemoryMatchGame onComplete={() => setReelState("story")} sfx={sfx} />}

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
