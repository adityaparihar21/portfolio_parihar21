import { useEffect, useRef, useState, useMemo } from "react";
import { X, Volume2, VolumeX, HelpCircle, Trophy, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const MISSIONS = [
  { id: 1, title: "Escape the Set", objective: "Collect 40 AP Coins", difficulty: "HARD" },
  {
    id: 2,
    title: "Checkmate the Director",
    objective: "Neutralize the Director's Final Move",
    difficulty: "HARD",
  },
  {
    id: 3,
    title: "Recover the Film Archive",
    objective: "Decrypt all missing film files",
    difficulty: "MEDIUM",
  },
  {
    id: 4,
    title: "Decode the Logic Core",
    objective: "Reconstruct the corrupted system data",
    difficulty: "EASY",
  },
  { id: 5, title: "Behind the Scenes", objective: "Read About" },
  { id: 6, title: "Director's Cut", objective: "Complete the Arcade" },
];

const ACHIEVEMENTS_LIST = {
  "First Take": "Clear a mission without failing",
  "Film Buff": "Decrypt the archive perfectly",
  Grandmaster: "Solve the chess puzzle",
  "Logic Node": "Reconstruct the system core",
};

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
      } catch (e) {}
    };

    return {
      jump: () => {
        playSound(440, 0.12, "square", 0.1);
        playSound(660, 0.1, "square", 0.08, 0.03);
      },
      coin: () => {
        playSound(988, 0.08, "square", 0.1);
        playSound(1318, 0.12, "square", 0.1, 0.06);
      },
      hit: () => playSound(120, 0.22, "sawtooth", 0.14),
      step: () => playSound(200, 0.03, "square", 0.03),
      reveal: () => {
        playSound(523, 0.1, "triangle", 0.09);
        playSound(659, 0.1, "triangle", 0.09, 0.09);
        playSound(784, 0.16, "triangle", 0.1, 0.18);
      },
      click: () => playSound(800, 0.05, "sine", 0.05),
      win: () => {
        playSound(523, 0.1, "triangle", 0.09);
        playSound(659, 0.1, "triangle", 0.09, 0.09);
        playSound(1046, 0.2, "triangle", 0.1, 0.18);
      },
      flip: () => playSound(600, 0.06, "sine", 0.05),
      chime: () => {
        playSound(1046, 0.1, "sine", 0.1);
        playSound(1318, 0.1, "sine", 0.1, 0.05);
      },
      error: () => playSound(150, 0.2, "sawtooth", 0.1),
      printer: () => {
        for (let i = 0; i < 6; i++) {
          playSound(800 + Math.random() * 200, 0.03, "square", 0.05, i * 0.06);
        }
      },
    };
  }, [enabled]);
};

const FILMS = [
  "https://a.ltrbxd.com/resized/film-poster/3/8/4/0/5/8/384058-beautiful-boy-0-230-0-345-crop.jpg?v=fb10cce0",
  "https://a.ltrbxd.com/resized/film-poster/7/1/3/3/8/71338-the-perks-of-being-a-wallflower-0-230-0-345-crop.jpg?v=d2c4c804",
  "https://a.ltrbxd.com/resized/film-poster/5/1/6/2/1/51621-good-will-hunting-0-230-0-345-crop.jpg?v=f1139f66",
  "https://a.ltrbxd.com/resized/film-poster/5/7/1/3/9/1/571391-dil-bechara-0-230-0-345-crop.jpg?v=bad1a4cb",
];
const SVGPieces = {
  wQ: () => (
    <img
      src="https://upload.wikimedia.org/wikipedia/commons/1/15/Chess_qlt45.svg"
      alt="White Queen"
      className="w-full h-full drop-shadow-lg"
    />
  ),
  wB: () => (
    <img
      src="https://upload.wikimedia.org/wikipedia/commons/b/b1/Chess_blt45.svg"
      alt="White Bishop"
      className="w-full h-full drop-shadow-lg"
    />
  ),
  wR: () => (
    <img
      src="https://upload.wikimedia.org/wikipedia/commons/7/72/Chess_rlt45.svg"
      alt="White Rook"
      className="w-full h-full drop-shadow-lg"
    />
  ),
  wN: () => (
    <img
      src="https://upload.wikimedia.org/wikipedia/commons/7/70/Chess_nlt45.svg"
      alt="White Knight"
      className="w-full h-full drop-shadow-lg"
    />
  ),
  wK: () => (
    <img
      src="https://upload.wikimedia.org/wikipedia/commons/4/42/Chess_klt45.svg"
      alt="White King"
      className="w-full h-full drop-shadow-lg"
    />
  ),
  bK: () => (
    <img
      src="https://upload.wikimedia.org/wikipedia/commons/f/f0/Chess_kdt45.svg"
      alt="Black King"
      className="w-full h-full drop-shadow-lg"
    />
  ),
  bP: () => (
    <img
      src="https://upload.wikimedia.org/wikipedia/commons/c/c7/Chess_pdt45.svg"
      alt="Black Pawn"
      className="w-full h-full drop-shadow-lg"
    />
  ),
  bR: () => (
    <img
      src="https://upload.wikimedia.org/wikipedia/commons/f/ff/Chess_rdt45.svg"
      alt="Black Rook"
      className="w-full h-full drop-shadow-lg"
    />
  ),
};
const PUZZLES = [
  {
    initial: { 4: "bK", 13: "bP", 14: "bP", 15: "bP", 26: "wB", 35: "wQ" },
    pieceToMove: 35,
    target: 13,
    pieceType: "wQ",
    validMoves: [
      3, 11, 19, 27, 43, 51, 59, 32, 33, 34, 36, 37, 38, 39, 8, 17, 26, 44, 53, 62, 56, 49, 42, 28,
      21, 14, 13,
    ],
  },
  {
    initial: { 6: "bK", 13: "bP", 14: "bP", 15: "bP", 59: "wR", 55: "wK" },
    pieceToMove: 59,
    target: 3,
    pieceType: "wR",
    validMoves: [3, 11, 19, 27, 35, 43, 51, 56, 57, 58, 60, 61, 62, 63],
  },
  {
    initial: { 7: "bK", 6: "bR", 14: "bP", 15: "bP", 20: "wN", 62: "wK" },
    pieceToMove: 20,
    target: 13,
    pieceType: "wN",
    validMoves: [11, 13, 18, 22, 35, 37, 43, 45],
  },
  {
    initial: { 6: "bK", 15: "bP", 21: "wN", 38: "wQ", 62: "wK" },
    pieceToMove: 38,
    target: 14,
    pieceType: "wQ",
    validMoves: [
      6, 14, 22, 30, 46, 54, 62, 32, 33, 34, 35, 36, 37, 39, 11, 20, 29, 47, 56, 24, 31, 45, 52, 59,
    ],
  },
  {
    initial: { 2: "bK", 8: "bP", 9: "bP", 10: "bP", 58: "wR", 54: "wK" },
    pieceToMove: 58,
    target: 2,
    pieceType: "wR",
    validMoves: [2, 10, 18, 26, 34, 42, 50, 56, 57, 59, 60, 61, 62, 63],
  },
  {
    initial: { 0: "bK", 1: "bR", 8: "bP", 9: "bP", 35: "wN", 62: "wK" },
    pieceToMove: 35,
    target: 10,
    pieceType: "wN",
    validMoves: [10, 18, 20, 25, 41, 45, 50, 52],
  },
  {
    initial: { 7: "bK", 14: "bP", 21: "wN", 39: "wR", 62: "wK" },
    pieceToMove: 39,
    target: 15,
    pieceType: "wR",
    validMoves: [7, 15, 23, 31, 47, 55, 63, 32, 33, 34, 35, 36, 37, 38],
  },
  {
    initial: { 6: "bK", 13: "bP", 14: "bP", 15: "bP", 34: "wB", 31: "wQ" },
    pieceToMove: 31,
    target: 13,
    pieceType: "wQ",
    validMoves: [7, 15, 23, 39, 47, 55, 63, 24, 25, 26, 27, 28, 29, 30, 6, 13, 22, 38, 45, 52, 59],
  },
  {
    initial: { 7: "bK", 15: "bP", 22: "wB", 56: "wR" },
    pieceToMove: 56,
    target: 0,
    pieceType: "wR",
    validMoves: [0, 8, 16, 24, 32, 40, 48, 57, 58, 59, 60, 61, 62, 63],
  },
  {
    initial: { 6: "bK", 5: "bR", 15: "bP", 21: "wN", 39: "wR" },
    pieceToMove: 39,
    target: 7,
    pieceType: "wR",
    validMoves: [7, 15, 23, 31, 47, 55, 63, 32, 33, 34, 35, 36, 37, 38],
  },
];

function ChessPuzzleGame({ onComplete, sfx }: { onComplete: () => void; sfx: any }) {
  const puzzle = useMemo(() => PUZZLES[Math.floor(Math.random() * PUZZLES.length)], []);
  const [board, setBoard] = useState(() => {
    const b = Array(64).fill("");
    Object.entries(puzzle.initial).forEach(([k, v]) => {
      b[parseInt(k)] = v as string;
    });
    return b;
  });

  const [selected, setSelected] = useState<number | null>(null);
  const [win, setWin] = useState(false);
  const [hintActive, setHintActive] = useState(false);

  const handleSquareClick = (idx: number) => {
    if (win) return;

    if (board[idx] && board[idx].startsWith("w")) {
      setSelected(idx);
      sfx.click();
      return;
    }

    if (selected === puzzle.pieceToMove && puzzle.validMoves.includes(idx)) {
      const newBoard = [...board];
      newBoard[idx] = puzzle.pieceType;
      newBoard[selected] = "";
      setBoard(newBoard);
      setSelected(null);

      if (idx === puzzle.target) {
        setWin(true);
        sfx.win();
        setTimeout(onComplete, 1000);
      } else {
        sfx.error();
        setTimeout(() => {
          const resetBoard = Array(64).fill("");
          Object.entries(puzzle.initial).forEach(([k, v]) => {
            resetBoard[parseInt(k)] = v as string;
          });
          setBoard(resetBoard);
        }, 1000);
      }
    } else {
      setSelected(null);
    }
  };

  return (
    <div className="absolute inset-0 z-30 flex flex-col items-center justify-center p-4 bg-[#0a0a0f]">
      {/* Dynamic cinematic lighting overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,#2a3b4c_0%,transparent_70%)] opacity-30 pointer-events-none" />

      <motion.div
        animate={win ? { y: [0, 10, -10, 5, -5, 0], transition: { duration: 0.5 } } : {}}
        className="relative w-[90vw] max-w-[420px] aspect-square rounded-lg p-3 bg-[#111] border border-white/10 shadow-[0_30px_80px_rgba(0,0,0,0.8),inset_0_0_20px_rgba(255,255,255,0.05)]"
      >
        <div className="w-full h-full grid grid-cols-8 grid-rows-8 rounded overflow-hidden border border-white/5 relative">
          {board.map((piece, i) => {
            const row = Math.floor(i / 8);
            const col = i % 8;
            const isDark = (row + col) % 2 === 1;
            const isSelected = selected === i;
            const isHintSquare = hintActive && (i === puzzle.pieceToMove || i === puzzle.target);
            const isValidMove = selected === puzzle.pieceToMove && puzzle.validMoves.includes(i);
            const isCapture = isValidMove && board[i] !== "";

            return (
              <div
                key={i}
                onClick={() => handleSquareClick(i)}
                className={`relative flex items-center justify-center cursor-pointer transition-colors duration-200
                  ${isDark ? "bg-[#344050]" : "bg-[#5b6a7a]"}
                  ${win && piece.startsWith("b") ? "opacity-20 blur-sm scale-90" : ""}
                  ${win && piece.startsWith("w") ? "drop-shadow-[0_0_15px_rgba(255,255,255,0.5)] scale-105" : ""}
                `}
              >
                {isSelected && (
                  <motion.div
                    layoutId="selection"
                    className="absolute inset-0 bg-[#e8b23d]/40 shadow-[inset_0_0_20px_rgba(232,178,61,0.6)]"
                  />
                )}

                {isHintSquare && !win && (
                  <div className="absolute inset-0 border-2 border-[#10b981]/50 shadow-[inset_0_0_15px_rgba(16,185,129,0.4)] animate-pulse pointer-events-none" />
                )}

                {isValidMove && !isCapture && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute w-[25%] h-[25%] bg-[#10b981]/60 rounded-full z-20 pointer-events-none shadow-[0_0_10px_rgba(16,185,129,0.8)]"
                  />
                )}
                {isValidMove && isCapture && (
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="absolute w-[80%] h-[80%] border-4 border-[#ff4d4d]/60 rounded-full z-20 pointer-events-none shadow-[0_0_15px_rgba(255,77,77,0.6)]"
                  />
                )}

                {piece && (
                  <div className="w-[85%] h-[85%] relative z-10 transition-transform duration-300">
                    {piece === "wQ" && <SVGPieces.wQ />}
                    {piece === "wB" && <SVGPieces.wB />}
                    {piece === "wR" && <SVGPieces.wR />}
                    {piece === "wN" && <SVGPieces.wN />}
                    {piece === "wK" && <SVGPieces.wK />}
                    {piece === "bK" && <SVGPieces.bK />}
                    {piece === "bP" && <SVGPieces.bP />}
                    {piece === "bR" && <SVGPieces.bR />}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </motion.div>

      {!win && (
        <button
          onClick={() => {
            setHintActive(!hintActive);
            sfx.click();
          }}
          className="mt-6 flex items-center gap-2 px-6 py-2 rounded-full border border-white/10 bg-white/5 text-white/70 hover:text-white hover:bg-white/10 transition font-mono uppercase text-xs tracking-widest"
        >
          <HelpCircle className="w-4 h-4" /> {hintActive ? "Hide Analytics" : "Request Hint"}
        </button>
      )}
    </div>
  );
}

function MemoryMatchGame({ onComplete, sfx }: { onComplete: () => void; sfx: any }) {
  const [cards, setCards] = useState<
    { id: number; img: string; flipped: boolean; matched: boolean }[]
  >([]);
  const [flippedIdx, setFlippedIdx] = useState<number[]>([]);
  const [win, setWin] = useState(false);
  const [matches, setMatches] = useState(0);

  useEffect(() => {
    const pair = [...FILMS, ...FILMS].map((img, i) => ({
      id: i,
      img,
      flipped: false,
      matched: false,
    }));
    for (let i = pair.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pair[i], pair[j]] = [pair[j], pair[i]];
    }
    setCards(pair);
  }, []);

  const handleCardClick = (idx: number) => {
    if (flippedIdx.length === 2 || cards[idx].flipped || cards[idx].matched) return;

    sfx.flip();
    const newCards = [...cards];
    newCards[idx].flipped = true;
    setCards(newCards);

    const newFlipped = [...flippedIdx, idx];
    setFlippedIdx(newFlipped);

    if (newFlipped.length === 2) {
      const [first, second] = newFlipped;
      if (newCards[first].img === newCards[second].img) {
        setTimeout(() => {
          sfx.chime();
          setCards((prev) => {
            const c = [...prev];
            c[first].matched = true;
            c[second].matched = true;
            setMatches((m) => {
              const newM = m + 1;
              if (newM === 4) {
                setWin(true);
                sfx.win();
                setTimeout(onComplete, 1000);
              }
              return newM;
            });
            return c;
          });
          setFlippedIdx([]);
        }, 500);
      } else {
        setTimeout(() => {
          sfx.error();
          setCards((prev) => {
            const c = [...prev];
            c[first].flipped = false;
            c[second].flipped = false;
            return c;
          });
          setFlippedIdx([]);
        }, 1000);
      }
    }
  };

  return (
    <div className="absolute inset-0 z-30 flex flex-col items-center justify-center p-8 bg-[#1a1c23]">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.03)_0%,transparent_80%)] pointer-events-none" />

      <div className="grid grid-cols-4 gap-4 md:gap-6 relative z-10">
        {cards.map((c, i) => {
          const isWrong =
            flippedIdx.length === 2 &&
            flippedIdx.includes(i) &&
            cards[flippedIdx[0]].img !== cards[flippedIdx[1]].img;
          return (
            <motion.div
              key={c.id}
              onClick={() => handleCardClick(i)}
              animate={isWrong ? { x: [-5, 5, -5, 5, 0], transition: { duration: 0.4 } } : {}}
              className="w-20 h-28 md:w-28 md:h-40 perspective-1000 cursor-pointer"
            >
              <motion.div
                className="w-full h-full relative preserve-3d"
                initial={false}
                animate={{
                  rotateY: c.flipped || c.matched ? 180 : 0,
                  z: c.flipped && !c.matched ? 20 : 0,
                  scale: c.matched ? 1.05 : 1,
                }}
                transition={{ type: "spring", stiffness: 260, damping: 20 }}
              >
                {/* Back of Card (Archive Design) */}
                <div className="absolute inset-0 backface-hidden bg-[#242730] border-2 border-[#3a3f4e] rounded-lg shadow-xl overflow-hidden flex flex-col">
                  <div className="flex-1 border-x-4 border-[#15161a] border-dashed opacity-50 m-2 flex items-center justify-center relative">
                    <div className="absolute -left-1 w-2 h-full bg-[#1a1c23] flex flex-col justify-between py-1">
                      {[...Array(6)].map((_, j) => (
                        <div key={j} className="w-full h-1.5 bg-[#242730]" />
                      ))}
                    </div>
                    <div className="absolute -right-1 w-2 h-full bg-[#1a1c23] flex flex-col justify-between py-1">
                      {[...Array(6)].map((_, j) => (
                        <div key={j} className="w-full h-1.5 bg-[#242730]" />
                      ))}
                    </div>
                    <span className="text-[#3a3f4e] font-mono font-bold text-3xl rotate-90 tracking-widest opacity-30">
                      NEG
                    </span>
                  </div>
                  <div className="h-6 bg-[#3a3f4e] w-full flex items-center justify-center">
                    <span className="text-[8px] font-mono text-[#1a1c23] font-bold tracking-widest uppercase">
                      PROJECT AP
                    </span>
                  </div>
                </div>

                {/* Front of Card (Movie Poster) */}
                <div
                  className="absolute inset-0 backface-hidden bg-black rounded-lg overflow-hidden border-2 border-white/10 shadow-[0_20px_40px_rgba(0,0,0,0.6)]"
                  style={{ transform: "rotateY(180deg)" }}
                >
                  <img
                    src={c.img}
                    className={`w-full h-full object-cover transition-opacity duration-500 ${c.matched ? "opacity-100" : "opacity-80"}`}
                  />
                  {c.matched && (
                    <motion.div
                      initial={{ opacity: 1 }}
                      animate={{ opacity: 0 }}
                      transition={{ duration: 1 }}
                      className="absolute inset-0 bg-white mix-blend-overlay"
                    />
                  )}
                  {c.matched && (
                    <div className="absolute inset-0 border-2 border-[#e8b23d] rounded-lg shadow-[inset_0_0_20px_rgba(232,178,61,0.5)] pointer-events-none" />
                  )}
                  {isWrong && (
                    <div className="absolute inset-0 bg-[#ff4d4d]/30 mix-blend-overlay pointer-events-none" />
                  )}
                </div>
              </motion.div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

function generateSudoku() {
  const base = [
    [1, 2, 3, 4, 5, 6],
    [4, 5, 6, 1, 2, 3],
    [2, 3, 1, 5, 6, 4],
    [5, 6, 4, 2, 3, 1],
    [3, 1, 2, 6, 4, 5],
    [6, 4, 5, 3, 1, 2],
  ];

  // Random mapping 1-6
  const map = [1, 2, 3, 4, 5, 6].sort(() => Math.random() - 0.5);
  let grid = base.map((row) => row.map((v) => map[v - 1]));

  const swapRows = (r1: number, r2: number) => {
    const t = grid[r1];
    grid[r1] = grid[r2];
    grid[r2] = t;
  };
  if (Math.random() > 0.5) swapRows(0, 1);
  if (Math.random() > 0.5) swapRows(2, 3);
  if (Math.random() > 0.5) swapRows(4, 5);

  const b0 = [0, 1, 2].sort(() => Math.random() - 0.5);
  const b1 = [3, 4, 5].sort(() => Math.random() - 0.5);

  const newGrid: number[][] = [];
  for (let i = 0; i < 6; i++) {
    newGrid.push([
      grid[i][b0[0]],
      grid[i][b0[1]],
      grid[i][b0[2]],
      grid[i][b1[0]],
      grid[i][b1[1]],
      grid[i][b1[2]],
    ]);
  }
  grid = newGrid;

  const initial = grid.map((r) => [...r]);
  let removed = 0;
  while (removed < 18) {
    const r = Math.floor(Math.random() * 6);
    const c = Math.floor(Math.random() * 6);
    if (initial[r][c] !== 0) {
      initial[r][c] = 0;
      removed++;
    }
  }

  return { initial, solution: grid };
}

function SudokuGame({ onComplete, sfx }: { onComplete: () => void; sfx: any }) {
  const [puzzle] = useState(() => generateSudoku());
  const [grid, setGrid] = useState(puzzle.initial);
  const [selected, setSelected] = useState<{ r: number; c: number } | null>(null);
  const [win, setWin] = useState(false);
  const [completionProgress, setCompletionProgress] = useState(0);

  useEffect(() => {
    if (win) {
      let val = 0;
      const interval = setInterval(() => {
        val += 0.05;
        if (val > 1) {
          clearInterval(interval);
          setTimeout(onComplete, 500); // reduced delay since ArcadeStage will handle the overlay
        }
        setCompletionProgress(val);
      }, 50);
      return () => clearInterval(interval);
    }
  }, [win, onComplete]);

  const handleCellClick = (r: number, c: number) => {
    if (win) return;
    setSelected({ r, c });

    if (puzzle.initial[r][c] !== 0) return;

    const newGrid = [...grid.map((row) => [...row])];
    let val = newGrid[r][c];
    val = val === 0 ? 1 : val + 1;
    if (val > 6) val = 1; // 1-6 for 6x6
    newGrid[r][c] = val;
    setGrid(newGrid);

    // Feedback sound based on correctness
    if (val === puzzle.solution[r][c]) {
      sfx.click();
    } else {
      sfx.error();
    }

    // Check win
    let isWin = true;
    for (let i = 0; i < 6; i++) {
      for (let j = 0; j < 6; j++) {
        if (newGrid[i][j] !== puzzle.solution[i][j]) {
          isWin = false;
        }
      }
    }
    if (isWin) {
      setSelected(null);
      setWin(true);
      sfx.win();
    }
  };

  return (
    <div className="absolute inset-0 z-30 flex flex-col items-center justify-center p-8 bg-[#050b14] select-none touch-none [-webkit-tap-highlight-color:transparent]">
      {/* Sci-fi scanning lines overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_4px,3px_100%] pointer-events-none z-0" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(0,180,255,0.05)_0%,transparent_70%)] pointer-events-none" />

      <motion.div
        animate={
          win
            ? {
                scale: [1, 1.02, 1],
                filter: ["hue-rotate(0deg)", "hue-rotate(90deg)", "hue-rotate(0deg)"],
              }
            : {}
        }
        transition={{ duration: 1, ease: "easeInOut" }}
        className="relative z-10 w-[85vw] max-w-[340px] aspect-square p-2 bg-[#0a1220] rounded-xl border border-[#00f0ff]/20 shadow-[0_0_50px_rgba(0,240,255,0.1),inset_0_0_20px_rgba(0,240,255,0.05)]"
      >
        <div className="grid grid-cols-6 grid-rows-6 w-full h-full border-2 border-[#00f0ff]/40 rounded-lg overflow-hidden shadow-[0_0_15px_rgba(0,240,255,0.2)]">
          {grid.map((row, r) =>
            row.map((val, c) => {
              const isFixed = puzzle.initial[r][c] !== 0;
              const isSelected = selected?.r === r && selected?.c === c;
              const isRelated =
                selected &&
                !isSelected &&
                (selected.r === r ||
                  selected.c === c ||
                  (Math.floor(selected.r / 2) === Math.floor(r / 2) &&
                    Math.floor(selected.c / 3) === Math.floor(c / 3)));

              const isError = !isFixed && val !== 0 && val !== puzzle.solution[r][c];

              let bgClass = "bg-[#0a1220]";
              if (win) {
                // Completion sweep effect
                const delay = (r + c) * 0.05;
                if (completionProgress > delay) bgClass = "bg-[#00f0ff]/20";
              } else {
                if (isSelected)
                  bgClass = "bg-[#00f0ff]/30 shadow-[inset_0_0_15px_rgba(0,240,255,0.5)]";
                else if (isRelated) bgClass = "bg-[#00f0ff]/10";
              }

              let textClass = isFixed
                ? "text-white font-bold"
                : "text-[#00f0ff] font-light text-shadow-[0_0_8px_rgba(0,240,255,0.8)]";
              if (isError) {
                textClass = "text-[#ff4d4d] font-bold text-shadow-[0_0_8px_rgba(255,77,77,0.8)]";
              }

              return (
                <div
                  key={`${r}-${c}`}
                  onClick={() => handleCellClick(r, c)}
                  className={`relative flex items-center justify-center text-xl md:text-2xl font-mono cursor-pointer transition-all duration-200 outline-none
                  ${bgClass}
                  ${textClass}
                  ${r % 2 === 1 && r !== 5 ? "border-b-2 border-b-[#00f0ff]/30" : "border-b border-b-[#00f0ff]/10"}
                  ${c % 3 === 2 && c !== 5 ? "border-r-2 border-r-[#00f0ff]/30" : "border-r border-r-[#00f0ff]/10"}
                `}
                >
                  {isSelected && !win && (
                    <motion.div
                      layoutId="cellHighlight"
                      className="absolute inset-0 bg-[#00f0ff]/20"
                    />
                  )}
                  {val !== 0 ? val : ""}

                  {win && completionProgress > (r + c) * 0.05 && (
                    <div className="absolute inset-0 bg-[#00f0ff]/30 mix-blend-screen pointer-events-none animate-pulse" />
                  )}
                </div>
              );
            }),
          )}
        </div>
      </motion.div>
    </div>
  );
}

// -----------------------------------------------------
// MAIN COMPONENT
// -----------------------------------------------------
export function ArcadeStage({ onClose }: { onClose: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const bgmAudio = useRef<HTMLAudioElement | null>(null);

  const [currentMission, setCurrentMission] = useState(1);
  const [reelState, setReelState] = useState<
    "briefing" | "playing" | "completed" | "story" | "fail"
  >("briefing");
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [ecoMode, setEcoMode] = useState(false);
  const sfx = useSound(soundEnabled);

  const [achievements, setAchievements] = useState<string[]>([]);
  const [hasFailedMission, setHasFailedMission] = useState(false);

  const scoreRef = useRef(0);
  const [totalCoins, setTotalCoins] = useState(0);
  const livesRef = useRef(3);
  const frameTimes = useRef<number[]>([]);
  const [uiScore, setUiScore] = useState(0);
  const [uiLives, setUiLives] = useState(3);
  const [startTime] = useState(Date.now());
  const [perfectMissions, setPerfectMissions] = useState(0);

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
    bgmAudio.current.volume = 0.5;
    return () => {
      bgmAudio.current?.pause();
    };
  }, []);

  useEffect(() => {
    if (soundEnabled && (reelState === "playing" || reelState === "story")) {
      bgmAudio.current?.play().catch(() => {});
    } else {
      bgmAudio.current?.pause();
    }
  }, [soundEnabled, reelState]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (reelState === "briefing") {
        setReelState("playing");
        sfx.click();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [reelState, sfx]);

  // Handle Reel 1 Canvas Loop
  useEffect(() => {
    if (currentMission !== 1 || (reelState !== "playing" && reelState !== "fail")) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return;

    const spriteSheet = new Image();
    spriteSheet.src = "/runner_sprite.png";
    const processedCanvas = document.createElement("canvas");
    let isSpriteReady = false;

    spriteSheet.onload = () => {
      processedCanvas.width = spriteSheet.naturalWidth;
      processedCanvas.height = spriteSheet.naturalHeight;
      const pCtx = processedCanvas.getContext("2d", { willReadFrequently: true });
      if (pCtx) {
        pCtx.drawImage(spriteSheet, 0, 0);
        const imgData = pCtx.getImageData(0, 0, processedCanvas.width, processedCanvas.height);
        const data = imgData.data;
        const bgR = data[0],
          bgG = data[1],
          bgB = data[2];
        for (let i = 0; i < data.length; i += 4) {
          if (
            Math.abs(data[i] - bgR) < 30 &&
            Math.abs(data[i + 1] - bgG) < 30 &&
            Math.abs(data[i + 2] - bgB) < 30
          ) {
            data[i + 3] = 0;
          }
        }
        pCtx.putImageData(imgData, 0, 0);
        isSpriteReady = true;
      }
    };

    const LOGICAL_W = 960;
    const LOGICAL_H = 480;
    const GROUND_Y = 380;
    const GRAVITY = 0.85;
    const JUMP_V = -15.5;

    let frame = 0;
    let speed = 6.5;
    let spawnTimer = 0;
    let animationId: number;
    let lastTime = performance.now();

    const player = {
      x: 110,
      y: GROUND_Y - 80,
      w: 60,
      h: 80,
      vy: 0,
      onGround: true,
      invuln: 0,
      isCrouching: false,
      crouchTimer: 0,
      scaleX: 1,
      scaleY: 1,
    };
    const obstacles: any[] = [];
    const coins: any[] = [];
    const particles: any[] = [];
    const floatingTexts: any[] = [];
    const flashes: any[] = [];

    let shakeTimer = 0;
    let shakeMag = 0;
    let cameraY = 0;
    let targetCameraY = 0;
    let zoomLevel = 1.0;
    let targetZoom = 1.0;

    let gameState = "STARTING";
    let startSequenceTimer = 180;
    let endSequenceTimer = 0;
    let timeScale = 1.0;
    let combo = 0;

    // Get current stage based on score (0 to 3)
    const getStage = () => Math.min(3, Math.floor((scoreRef.current || 0) / 10));

    const resize = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      const rect = parent.getBoundingClientRect();
      const dpr = Math.max(1, Math.min(window.devicePixelRatio || 1, 2));
      canvas.width = Math.floor(rect.width * dpr);
      canvas.height = Math.floor(rect.height * dpr);
      const scale = canvas.width / LOGICAL_W;
      ctx!.setTransform(scale, 0, 0, scale, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    const triggerShake = (mag: number, time: number) => {
      shakeMag = mag;
      shakeTimer = time;
    };

    const triggerZoom = (mag: number) => {
      targetZoom = mag;
      setTimeout(() => {
        targetZoom = 1.0;
      }, 100);
    };

    const addFloatingText = (txt: string, x: number, y: number, color: string = "#fff") => {
      floatingTexts.push({ txt, x, y, life: 60, color, vy: -1.5 });
    };

    const jump = () => {
      if (gameState !== "PLAYING") return;
      if (player.onGround && !player.isCrouching) {
        player.vy = JUMP_V;
        player.onGround = false;
        player.scaleX = 0.8;
        player.scaleY = 1.25;
        targetCameraY = -15; // Pan camera down
        spawnParticles(player.x + 30, player.y + 80, 15, "#e8e8e8", 4, -2);
        sfx.jump();
      }
    };

    const crouch = () => {
      if (gameState !== "PLAYING") return;
      if (player.onGround && !player.isCrouching) {
        player.crouchTimer = 35;
        sfx.step();
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space" || e.code === "ArrowUp") {
        e.preventDefault();
        jump();
      }
      if (e.code === "ArrowDown" || e.code === "KeyS") {
        e.preventDefault();
        crouch();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    canvas.addEventListener("pointerdown", jump, { passive: true });

    function spawnParticles(
      x: number,
      y: number,
      count: number,
      color: string,
      spreadX = 8,
      spreadY = 6,
    ) {
      for (let i = 0; i < count; i++) {
        particles.push({
          x,
          y,
          vx: (Math.random() - 0.5) * spreadX,
          vy: (Math.random() - 1) * spreadY,
          life: 1,
          color,
        });
      }
    }

    const cityBack = [150, 100, 180, 120, 160, 200];
    const cityFront = [60, 80, 50, 90, 70, 110, 60, 120];

    function drawCityLayer(
      baseY: number,
      speedMul: number,
      color: string,
      w: number,
      spacing: number,
      arr: number[],
      stage: number,
    ) {
      const scrollX =
        (frame * speed * speedMul * timeScale) % (w * arr.length + spacing * arr.length);
      ctx!.fillStyle = color;
      let x = -scrollX;
      for (let i = 0; i < arr.length * 3; i++) {
        const h = arr[i % arr.length];
        ctx!.fillRect(x, baseY - h, w, h);

        // Windows/lights based on stage
        if (w > 40 && i % 3 === 0 && stage === 0) {
          ctx!.fillStyle = "#e8b23d"; // Warm lights for studio entrance
          ctx!.fillRect(x + 10, baseY - h - 5, 4, 4);
          ctx!.fillStyle = color;
        } else if (w > 40 && i % 2 === 0 && stage === 1) {
          ctx!.fillStyle = "#ff4d4d"; // Red recording lights
          ctx!.fillRect(x + 10, baseY - h - 5, 4, 4);
          ctx!.fillStyle = color;
        }

        // Easter Eggs
        if (i === 2 && w === 80) {
          ctx!.fillStyle = "#e8b23d";
          ctx!.font = "bold 10px sans-serif";
          ctx!.fillText("WeatherHUT", x + 5, baseY - h + 15);
          ctx!.fillStyle = color;
        }
        if (i === 5 && w === 60) {
          ctx!.fillStyle = "#ff4d4d";
          ctx!.font = "italic 8px serif";
          ctx!.fillText("Fragmento", x + 5, baseY - h + 15);
          ctx!.fillStyle = color;
        }

        x += w + spacing;
      }
    }

    function drawObstacle(o: any) {
      ctx!.save();
      ctx!.translate(Math.floor(o.x), Math.floor(o.y));

      ctx!.fillStyle = "rgba(0,0,0,0.3)";
      ctx!.beginPath();
      ctx!.ellipse(o.w / 2, o.h, o.w / 2 + 4, 4, 0, 0, Math.PI * 2);
      ctx!.fill();

      if (o.type === "c-stand" || o.type === "boom-mic") {
        ctx!.translate(Math.sin(frame * 0.2 + o.x) * 1, 0);
      }

      if (o.type === "c-stand") {
        ctx!.fillStyle = "#ff4d4d";
        ctx!.fillRect(12, -20, 6, o.h + 20);
        ctx!.fillStyle = "#222";
        ctx!.fillRect(0, o.h - 6, 30, 6);
        ctx!.fillStyle = "#ccc";
        ctx!.fillRect(12, -15, 20, 4);
      } else if (o.type === "pelican") {
        ctx!.fillStyle = "#ff9f43";
        ctx!.beginPath();
        ctx!.roundRect(0, 8, o.w + 10, o.h - 8, 4);
        ctx!.fill();
        ctx!.fillStyle = "#fff";
        ctx!.fillRect(4, 14, o.w + 2, 4);
      } else if (o.type === "boom-mic") {
        ctx!.fillStyle = "#ff4d4d";
        ctx!.fillRect(o.w / 2 - 2, -300, 4, 300);
        ctx!.fillStyle = "#ff9f43";
        ctx!.beginPath();
        ctx!.roundRect(0, 0, o.w, o.h, 10);
        ctx!.fill();
        ctx!.fillStyle = "#fff";
        ctx!.fillRect(4, 4, o.w - 8, 2);
        ctx!.fillRect(4, 12, o.w - 8, 2);
      } else if (o.type === "director-chair") {
        ctx!.fillStyle = "#8b5a2b";
        ctx!.fillRect(4, 10, 4, o.h - 10);
        ctx!.fillRect(o.w - 8, 10, 4, o.h - 10);
        ctx!.fillRect(0, o.h / 2, o.w, 4);
        ctx!.fillStyle = "#111";
        ctx!.fillRect(4, 0, o.w - 8, 14);
      } else if (o.type === "camera-dolly") {
        ctx!.fillStyle = "#333";
        ctx!.fillRect(0, o.h - 10, o.w + 20, 10);
        ctx!.fillStyle = "#222";
        ctx!.fillRect(10, o.h - 30, o.w, 20);
        ctx!.fillStyle = "#ff4d4d";
        ctx!.fillRect(14, o.h - 40, 12, 10);
      }
      ctx!.restore();
    }

    function drawHUD() {
      ctx!.save();
      const hw = LOGICAL_W / 2;
      ctx!.translate(hw - 150, 40);

      ctx!.fillStyle = "#fff";
      ctx!.font = "bold 12px sans-serif";
      ctx!.textAlign = "center";
      ctx!.fillText("MISSION: Collect 40 AP Coins", 150, -15);

      const pRatio = Math.min(1, scoreRef.current / 40);
      ctx!.fillStyle = "rgba(0,0,0,0.5)";
      ctx!.fillRect(0, 0, 300, 12);
      ctx!.fillStyle = "#e8b23d";
      ctx!.fillRect(0, 0, 300 * pRatio, 12);
      ctx!.strokeStyle = "#fff";
      ctx!.lineWidth = 2;
      ctx!.strokeRect(0, 0, 300, 12);

      ctx!.textAlign = "left";
      ctx!.font = "bold 24px sans-serif";
      ctx!.fillText(scoreRef.current.toString().padStart(3, "0"), -60, 10);

      for (let i = 0; i < 3; i++) {
        ctx!.fillStyle = i < livesRef.current ? "#ff4d4d" : "#333";
        ctx!.beginPath();
        ctx!.arc(340 + i * 20, 6, 6, 0, Math.PI * 2);
        ctx!.fill();
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
        if (avgDt > 24 && !ecoMode) setEcoMode(true);
      }

      frame += timeScale;
      speed = 6.5 + Math.min(5, scoreRef.current / 80);
      const stage = getStage();

      drawHUD();

      if (gameState === "STARTING") {
        startSequenceTimer -= dt * 0.06;
        if (startSequenceTimer <= 0) {
          gameState = "PLAYING";
        }
      }

      if (gameState === "SCENE_COMPLETE") {
        timeScale = Math.max(0.05, timeScale * 0.95);
        endSequenceTimer += dt * 0.06;
        if (endSequenceTimer > 180) {
          // Changed to set ReelState to "completed" so ArcadeStage handles it
          setReelState("completed");
          return;
        }
      }

      if (gameState === "PLAYING") {
        timeScale = 1.0;
        spawnTimer -= 1 * timeScale;
        if (spawnTimer <= 0) {
          spawnTimer = 55 + Math.random() * 30;
          if (Math.random() < 0.45) {
            coins.push({
              x: LOGICAL_W + 20,
              y: GROUND_Y - 90 - Math.random() * 60,
              r: 16,
              wobble: Math.random() * 10,
              golden: Math.random() < 0.05, // 5% chance of Golden Coin
            });
          } else {
            const types = ["c-stand", "pelican", "boom-mic", "director-chair", "camera-dolly"];
            const type = types[Math.floor(Math.random() * types.length)];
            const yPos = type === "boom-mic" ? GROUND_Y - 90 : GROUND_Y - 40;
            const height = type === "boom-mic" ? 30 : 40;
            obstacles.push({ x: LOGICAL_W + 20, y: yPos, w: 32, h: height, type });
          }
        }

        // Random camera flashes in Premiere stage (Stage 3)
        if (stage === 3 && Math.random() < 0.02) {
          flashes.push({ life: 10, x: Math.random() * LOGICAL_W, y: Math.random() * GROUND_Y });
        }

        // Particles/Dust for atmosphere
        if (Math.random() < 0.1) {
          particles.push({
            x: LOGICAL_W + 10,
            y: Math.random() * LOGICAL_H,
            vx: -speed * 0.5,
            vy: (Math.random() - 0.5) * 0.5,
            life: 1,
            color: "rgba(255,255,255,0.2)",
          });
        }
      }

      if (gameState !== "STARTING") {
        if (player.crouchTimer > 0) {
          player.crouchTimer -= timeScale;
          player.isCrouching = true;
        } else {
          player.isCrouching = false;
        }

        player.vy += GRAVITY * timeScale;
        player.y += player.vy * timeScale;
        if (player.y >= GROUND_Y - player.h) {
          if (!player.onGround && player.vy > 0) {
            player.scaleX = 1.2;
            player.scaleY = 0.8;
            targetCameraY = 0; // Return camera to center
            triggerShake(3, 5); // bounce
            spawnParticles(player.x + 30, GROUND_Y, 10, "#aaa", 6, -1);
            sfx.step();
          }
          player.y = GROUND_Y - player.h;
          player.vy = 0;
          player.onGround = true;
        }

        player.scaleX += (1 - player.scaleX) * 0.15;
        player.scaleY += (1 - player.scaleY) * 0.15;

        if (player.invuln > 0) player.invuln -= timeScale;

        if (
          player.onGround &&
          !player.isCrouching &&
          Math.floor(frame) % 12 === 0 &&
          gameState === "PLAYING"
        ) {
          spawnParticles(player.x + 10, GROUND_Y, 2, "#999", 2, -1);
        }

        cameraY += (targetCameraY - cameraY) * 0.1;
        zoomLevel += (targetZoom - zoomLevel) * 0.15;

        const hitboxTop = player.y + (player.isCrouching ? player.h * 0.6 : 0);
        const hitboxHeight = player.isCrouching ? player.h * 0.4 : player.h;

        for (let i = obstacles.length - 1; i >= 0; i--) {
          const o = obstacles[i];
          o.x -= speed * timeScale;
          if (o.x + o.w < -20) {
            obstacles.splice(i, 1);
            continue;
          }

          if (
            player.invuln <= 0 &&
            gameState === "PLAYING" &&
            player.x + 10 < o.x + o.w &&
            player.x + player.w - 10 > o.x
          ) {
            if (hitboxTop + hitboxHeight > o.y + 10 && hitboxTop < o.y + o.h) {
              livesRef.current--;
              setUiLives(livesRef.current);
              player.invuln = 90;
              combo = 0;
              triggerShake(15, 15);
              spawnParticles(player.x + 30, player.y + 40, 30, "#ff4d4d", 10, 10);
              sfx.hit();
              if (livesRef.current <= 0) {
                handleFail();
                return;
              }
            } else if (player.x > o.x + o.w - 15 && player.y < o.y) {
              if (!o.passed) {
                o.passed = true;
                addFloatingText("NEAR MISS +STYLE", player.x, player.y - 20, "#e8b23d");
                combo++;
              }
            }
          }
        }

        for (let i = coins.length - 1; i >= 0; i--) {
          const c = coins[i];
          c.x -= speed * timeScale;
          if (c.x < -20) {
            coins.splice(i, 1);
            continue;
          }
          const dx = player.x + player.w / 2 - c.x;
          const dy = player.y + player.h / 2 - c.y;
          if (Math.sqrt(dx * dx + dy * dy) < c.r + 24 && gameState === "PLAYING") {
            scoreRef.current += c.golden ? 50 : 10;
            setUiScore(scoreRef.current);
            combo++;
            triggerZoom(1.03); // micro-zoom on coin

            if (combo > 2) {
              const txts = ["Nice!", "Great!", "Perfect!", "Excellent!"];
              addFloatingText(
                txts[Math.min(combo - 3, 3)] + ` x${combo}`,
                player.x,
                player.y - 40,
                "#10b981",
              );
            }

            if (scoreRef.current >= 40 && gameState === "PLAYING") {
              gameState = "SCENE_COMPLETE";
              sfx.win();
              coins.forEach((cc) => spawnParticles(cc.x, cc.y, 15, "#e8b23d", 8, 8));
            }
            coins.splice(i, 1);
            spawnParticles(c.x, c.y, 25, c.golden ? "#fff" : "#e8b23d", 6, 6);
            triggerShake(3, 5);
            sfx.coin();
          }
        }

        for (let i = particles.length - 1; i >= 0; i--) {
          const p = particles[i];
          p.x += p.vx * timeScale;
          p.y += p.vy * timeScale;
          // Only add gravity if it's not ambient dust
          if (p.color !== "rgba(255,255,255,0.2)") {
            p.vy += 0.2 * timeScale;
            p.life -= 0.03 * timeScale;
          } else {
            p.life -= 0.005 * timeScale;
          }
          if (p.life <= 0) particles.splice(i, 1);
        }

        for (let i = floatingTexts.length - 1; i >= 0; i--) {
          const ft = floatingTexts[i];
          ft.y += ft.vy * timeScale;
          ft.life -= timeScale;
          if (ft.life <= 0) floatingTexts.splice(i, 1);
        }

        for (let i = flashes.length - 1; i >= 0; i--) {
          flashes[i].life -= timeScale;
          if (flashes[i].life <= 0) flashes.splice(i, 1);
        }
      }

      ctx!.fillStyle = "#111";
      ctx!.fillRect(0, 0, LOGICAL_W, LOGICAL_H);

      ctx!.save();

      // Camera System
      ctx!.translate(LOGICAL_W / 2, LOGICAL_H / 2);
      ctx!.scale(zoomLevel, zoomLevel);
      ctx!.translate(-LOGICAL_W / 2, -LOGICAL_H / 2);

      if (shakeTimer > 0) {
        shakeTimer -= timeScale;
        ctx!.translate((Math.random() - 0.5) * shakeMag, (Math.random() - 0.5) * shakeMag);
      }
      ctx!.translate(0, -cameraY);

      // Dynamic Sky based on Stage
      const sky = ctx!.createLinearGradient(0, 0, 0, GROUND_Y);
      if (stage === 0) {
        sky.addColorStop(0, "#191724");
        sky.addColorStop(1, "#3c385c");
      } else if (stage === 1) {
        sky.addColorStop(0, "#2c3e50");
        sky.addColorStop(1, "#34495e");
      } else if (stage === 2) {
        sky.addColorStop(0, "#00b894");
        sky.addColorStop(1, "#55efc4");
      } else {
        sky.addColorStop(0, "#2d3436");
        sky.addColorStop(1, "#636e72");
      }

      ctx!.fillStyle = sky;
      ctx!.fillRect(0, cameraY, LOGICAL_W, GROUND_Y - cameraY);

      if (stage === 0) {
        ctx!.fillStyle = "#f6f6f6";
        ctx!.beginPath();
        ctx!.arc(LOGICAL_W * 0.8 - ((frame * 0.1) % LOGICAL_W), GROUND_Y * 0.4, 50, 0, Math.PI * 2);
        ctx!.fill();
      }

      // Dynamic City/Bg Layers based on Stage
      let backColor, frontColor;
      if (stage === 0) {
        backColor = "#3b3754";
        frontColor = "#2a273b";
      } else if (stage === 1) {
        backColor = "#2c3e50";
        frontColor = "#2c3e50"; // Dark rigs
      } else if (stage === 2) {
        backColor = "#00b894";
        frontColor = "#55efc4"; // Green screen markers
      } else {
        backColor = "#d63031";
        frontColor = "#ff7675"; // Red carpet accents
      }

      drawCityLayer(GROUND_Y, 0.1, backColor, 80, 20, cityBack, stage);
      drawCityLayer(GROUND_Y, 0.3, frontColor, 60, 40, cityFront, stage);

      ctx!.fillStyle = "#11111a";
      ctx!.fillRect(0, GROUND_Y, LOGICAL_W, LOGICAL_H - GROUND_Y + Math.max(0, cameraY));

      ctx!.fillStyle = stage === 3 ? "#d63031" : "#222"; // Red carpet in stage 3
      for (let i = 0; i < LOGICAL_W; i += 40) {
        const sx = (i - frame * speed * timeScale) % LOGICAL_W;
        const rx = sx < 0 ? sx + LOGICAL_W : sx;
        ctx!.fillRect(rx, GROUND_Y + 10, 15, 10);
        ctx!.fillRect(rx, GROUND_Y + LOGICAL_H - GROUND_Y - 20, 15, 10);
      }
      ctx!.fillStyle = "#e8b23d";
      ctx!.fillRect(0, GROUND_Y, LOGICAL_W, 4);

      coins.forEach((c) => {
        ctx!.save();
        ctx!.translate(Math.floor(c.x), Math.floor(c.y + Math.sin(frame * 0.1 + c.wobble) * 8));
        const scaleX = Math.abs(Math.cos(frame * 0.08));

        if (!ecoMode) {
          ctx!.shadowColor = c.golden ? "#fff" : "#e8b23d";
          ctx!.shadowBlur = 10;
        }

        ctx!.scale(scaleX, 1);
        ctx!.beginPath();
        ctx!.arc(0, 0, c.r, 0, Math.PI * 2);
        ctx!.fillStyle = c.golden ? "#fff" : "#e8b23d";
        ctx!.fill();
        ctx!.lineWidth = 2;
        ctx!.strokeStyle = "#fff";
        ctx!.stroke();

        ctx!.fillStyle = c.golden ? "#111" : "#fff";
        ctx!.font = "bold 14px sans-serif";
        ctx!.textAlign = "center";
        ctx!.textBaseline = "middle";
        ctx!.fillText("AP", 0, 1);
        ctx!.restore();
      });

      obstacles.forEach(drawObstacle);

      ctx!.save();
      if (player.invuln > 0 && Math.floor(frame) % 10 < 5) ctx!.globalAlpha = 0.4;
      const cx = Math.floor(player.x + player.w / 2);
      const cy = Math.floor(player.y + player.h);
      ctx!.translate(cx, cy);
      ctx!.scale(player.scaleX, player.scaleY);
      if (player.isCrouching) {
        ctx!.scale(1.05, 0.85);
        ctx!.transform(1, 0, 0.15, 1, 0, 0);
      }
      ctx!.translate(-cx, -cy);

      if (isSpriteReady && processedCanvas.width > 0) {
        const cols = 2;
        const rows = 2;
        const frameW = processedCanvas.width / cols;
        const frameH = processedCanvas.height / rows;
        let currentSpriteFrame = 0;
        if (player.isCrouching || !player.onGround) currentSpriteFrame = 1;
        else currentSpriteFrame = Math.floor((frame / 6) % 4);

        const col = currentSpriteFrame % cols;
        const row = Math.floor(currentSpriteFrame / cols);
        ctx!.drawImage(
          processedCanvas,
          col * frameW,
          row * frameH,
          frameW,
          frameH,
          Math.floor(player.x - 20),
          Math.floor(player.y - 20),
          player.w + 40,
          player.h + 20,
        );
      }
      ctx!.restore();

      ctx!.save();
      particles.forEach((p) => {
        ctx!.globalAlpha = Math.max(0, p.life);
        ctx!.fillStyle = p.color;
        ctx!.fillRect(Math.floor(p.x), Math.floor(p.y), 6, 6);
      });
      ctx!.restore();

      floatingTexts.forEach((ft) => {
        ctx!.globalAlpha = Math.max(0, ft.life / 60);
        ctx!.fillStyle = ft.color;
        ctx!.font = "bold 16px sans-serif";
        ctx!.textAlign = "center";
        ctx!.fillText(ft.txt, ft.x, ft.y);
        ctx!.globalAlpha = 1;
      });

      // Camera flashes
      flashes.forEach((f) => {
        ctx!.globalAlpha = f.life / 10;
        ctx!.fillStyle = "#fff";
        ctx!.fillRect(f.x - 10, f.y - 10, 20, 20);
      });
      ctx!.globalAlpha = 1;

      // Fog in stage 0 and 1
      if ((stage === 0 || stage === 1) && !ecoMode) {
        ctx!.fillStyle = "rgba(125, 132, 148, 0.2)";
        ctx!.fillRect(0, cameraY, LOGICAL_W, LOGICAL_H);
      }

      ctx!.restore();

      if (gameState === "STARTING") {
        ctx!.fillStyle = "rgba(0,0,0,0.7)";
        ctx!.fillRect(0, 0, LOGICAL_W, LOGICAL_H);
        ctx!.fillStyle = "#fff";
        ctx!.textAlign = "center";
        ctx!.font = "bold 64px sans-serif";
        let txt = "ACTION!";
        if (startSequenceTimer > 120) txt = "3";
        else if (startSequenceTimer > 60) txt = "2";
        else if (startSequenceTimer > 0) txt = "1";
        ctx!.fillText(txt, LOGICAL_W / 2, LOGICAL_H / 2);
      }

      animationId = requestAnimationFrame(loop);
    }

    animationId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener("resize", resize);
      window.removeEventListener("keydown", handleKeyDown);
      canvas.removeEventListener("pointerdown", jump);
    };
  }, [currentMission, reelState, sfx, ecoMode]);

  const startNextReel = () => {
    // Add runner score to total coins
    if (currentMission === 1) {
      setTotalCoins((prev) => prev + scoreRef.current);
    }

    scoreRef.current = 0;
    setUiScore(0);
    livesRef.current = 3;
    setUiLives(3);

    if (!hasFailedMission && currentMission <= 4) {
      unlockAchievement("First Take");
      setPerfectMissions((prev) => prev + 1);
    }

    setHasFailedMission(false);

    const nextMission = currentMission + 1;
    setCurrentMission(nextMission);

    if (nextMission >= 5) {
      setReelState("story");
    } else {
      setReelState("briefing");
    }
  };

  const retryReel = () => {
    scoreRef.current = 0;
    setUiScore(0);
    livesRef.current = 3;
    setUiLives(3);
    setHasFailedMission(true);
    setReelState("playing");
  };

  const handleFail = () => {
    setHasFailedMission(true);
    setReelState("fail");
  };

  const getReelContent = () => {
    switch (currentMission) {
      case 1:
        return {
          tag: "Ticket 1 — The Setup",
          title: "Who I Am",
          desc: "I'm Aditya Parihar — a Computer Science major in my third year at UPES. Code is my major, but there's a lot more going on in my head. It’s chaotic, unpredictable, and you have to keep moving.",
        };
      case 2:
        return {
          tag: "Ticket 2 — The Strategy",
          title: "Off Screen",
          desc: "Football and running keep me moving. Chess keeps me thinking — sitting around 900–1000 Elo, I rely on pattern recognition as much as logic. This analytical mindset shapes how I approach my craft.",
        };
      case 3:
        return {
          tag: "Ticket 3 — Top Cuts",
          title: "Four Films I Keep Coming Back To",
          desc: "My Letterboxd is basically a diary. These are the films that shaped my perspective.",
          link: { url: "https://letterboxd.com/adityaparihar21", text: "My Letterboxd" },
        };
      case 4:
        return {
          tag: "Ticket 4 — The Logic",
          title: "Method to the Madness",
          desc: "Whether I'm writing an exam or debugging a React component, breaking a massive problem down into simple logic gates is how I get things done.",
        };
      case 5:
        return {
          tag: "Ticket 5 — The Writer",
          title: "Silent Background",
          desc: "While I work silently in the background, I also write about things I find interesting and random facts about my life.",
          link: { url: "https://substack.com/@adityaparihar21", text: "Read my Substack" },
          image: "/about.jpg",
        };
      default:
        return null;
    }
  };

  const content = getReelContent();
  const currentMissionInfo = MISSIONS[currentMission - 1] || MISSIONS[MISSIONS.length - 1];

  const getRuntime = () => {
    const ms = Date.now() - startTime;
    const mins = Math.floor(ms / 60000);
    const secs = Math.floor((ms % 60000) / 1000);
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div
      className={`fixed inset-0 z-[9999] bg-[#050509] flex flex-col font-sans ${ecoMode ? "eco-mode" : ""}`}
    >
      <style
        dangerouslySetInnerHTML={{
          __html: `
        .arcade-scanlines {
          background: repeating-linear-gradient(to bottom, rgba(0,0,0,0.14) 0px, rgba(0,0,0,0.14) 1px, transparent 2px, transparent 4px);
          mix-blend-mode: multiply; pointer-events: none;
        }
        .eco-mode .arcade-scanlines, .eco-mode .arcade-vignette { display: none !important; }
        .preserve-3d { transform-style: preserve-3d; }
        .perspective-1000 { perspective: 1000px; }
        .backface-hidden { backface-visibility: hidden; }
        
        .cinema-ticket {
          background: #f4ead8;
          border-radius: 12px;
          position: relative;
          color: #241a1e;
        }
        .cinema-ticket::before, .cinema-ticket::after {
          content: ""; position: absolute; top: 50%; width: 40px; height: 40px;
          background: #000; border-radius: 50%; transform: translateY(-50%);
        }
        .cinema-ticket::before { left: -20px; }
        .cinema-ticket::after { right: -20px; }
        .ticket-dashed-line {
          position: absolute; left: 80px; top: 20px; bottom: 20px;
          border-left: 2px dashed rgba(0,0,0,0.15);
        }
        .ticket-barcode {
          background: repeating-linear-gradient(to right, #241a1e 0px, #241a1e 3px, transparent 3px, transparent 6px, #241a1e 6px, #241a1e 7px, transparent 7px, transparent 10px);
          width: 100%; height: 40px;
        }
      `,
        }}
      />

      <div className="w-full h-16 bg-[#0a0a0f] border-b border-white/5 flex items-center justify-between px-6 shrink-0 z-50">
        <span className="text-white/60 font-mono text-sm tracking-widest uppercase">
          Interactive Cinema {ecoMode && "(Eco)"}
        </span>
        <button
          onClick={onClose}
          className="text-white/60 hover:text-white flex items-center gap-2 font-mono text-xs tracking-wider uppercase transition-colors"
        >
          Exit <X className="h-4 w-4" />
        </button>
      </div>

      <div className="relative flex-1 flex flex-col items-center justify-center p-4 lg:p-8 overflow-hidden bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.02),transparent_70%)]">
        {/* Slow moving ambient dust for global UI */}
        <div className="absolute inset-0 pointer-events-none opacity-50 z-0">
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              animate={{
                y: [Math.random() * window.innerHeight, Math.random() * window.innerHeight - 200],
                x: [Math.random() * window.innerWidth, Math.random() * window.innerWidth + 100],
                opacity: [0, 0.5, 0],
              }}
              transition={{ duration: 10 + Math.random() * 20, repeat: Infinity, ease: "linear" }}
              className="absolute w-1 h-1 bg-white/20 rounded-full blur-[1px]"
            />
          ))}
        </div>

        <div className="relative w-full max-w-5xl flex flex-col p-4 md:p-6 bg-[#161616] rounded-[2rem] border border-[#2a2a2a] shadow-[0_40px_100px_rgba(0,0,0,0.8),inset_0_4px_2px_rgba(255,255,255,0.03)] ring-1 ring-black z-10">
          <div className="flex justify-between items-center mb-4 px-2 font-mono text-[10px] md:text-xs text-[#555] tracking-widest uppercase select-none">
            <div className="flex items-center gap-4">
              <span className="font-bold text-[#888]">CINEMA EOS</span>
              <span className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-[#10b981] animate-pulse"></div> 8K RAW
              </span>
            </div>
            {currentMission === 1 && (reelState === "playing" || reelState === "fail") && (
              <div className="flex items-center gap-2 text-[#ff4d4d] animate-pulse font-bold tracking-widest bg-[#ff4d4d]/10 px-3 py-1 rounded border border-[#ff4d4d]/30 shadow-[0_0_10px_rgba(255,77,77,0.2)]">
                <div className="w-2 h-2 bg-[#ff4d4d] rounded-full shadow-[0_0_8px_#ff4d4d]"></div>
                REC
              </div>
            )}
          </div>

          <div className="relative p-2 md:p-3 bg-[#050505] rounded-[1.25rem] border border-[#222] shadow-[inset_0_10px_30px_rgba(0,0,0,1)]">
            <div className="relative w-full aspect-[16/8.8] rounded-xl overflow-hidden shadow-[0_0_50px_rgba(255,255,255,0.02)] bg-[#0b0b0f] ring-1 ring-white/10">
              <div className="arcade-scanlines absolute inset-0 z-[100] opacity-40 mix-blend-overlay" />
              <div className="arcade-vignette absolute inset-0 z-30 shadow-[inset_0_0_120px_rgba(0,0,0,0.9)] pointer-events-none" />

              {/* GLOBAL HUD */}
              {(reelState === "playing" || reelState === "completed") &&
                currentMission > 1 &&
                currentMission < 6 && (
                  <div className="absolute top-4 left-6 right-6 z-40 flex justify-between font-mono pointer-events-none select-none">
                    <div className="flex flex-col">
                      <div className="text-[10px] text-[#e8b23d] font-bold tracking-[0.2em] uppercase mb-1">
                        MISSION 0{currentMission}
                      </div>
                      <div className="text-white text-lg font-serif italic">
                        {currentMissionInfo.title}
                      </div>
                    </div>
                    <div className="flex flex-col items-end">
                      <div className="text-[10px] text-white/50 tracking-[0.2em] uppercase mb-1 flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#10b981] animate-pulse" />
                        PROGRESS
                      </div>
                      <div className="flex gap-2">
                        {[1, 2, 3, 4, 5, 6].map((i) => (
                          <div
                            key={i}
                            className={`w-2 h-2 rounded-full ${i < currentMission ? "bg-[#10b981]" : i === currentMission ? "bg-[#e8b23d] shadow-[0_0_8px_#e8b23d] animate-pulse" : "bg-white/10"}`}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                )}

              <AnimatePresence mode="wait">
                {/* BRIEFING STATE OVERLAY */}
                {reelState === "briefing" && (
                  <motion.div
                    key="briefing"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0, scale: 1.1, filter: "blur(10px)" }}
                    transition={{ duration: 0.5 }}
                    className="absolute inset-0 z-[60] flex flex-col items-center justify-center bg-black font-mono text-white select-none"
                    onClick={() => {
                      setReelState("playing");
                      sfx.click();
                    }}
                  >
                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.05)_0%,transparent_80%)]" />

                    {/* Projector flicker effect */}
                    <motion.div
                      animate={{ opacity: [0.1, 0.3, 0.1, 0.4, 0.2] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="absolute inset-0 bg-white/5 pointer-events-none mix-blend-overlay"
                    />

                    <div className="relative z-10 w-full max-w-lg border border-white/10 bg-[#0a0a0f]/80 p-8 flex flex-col items-center text-center backdrop-blur-sm">
                      <div className="w-full border-b border-white/20 pb-2 mb-6">
                        <span className="text-[#e8b23d] font-bold tracking-[0.3em] uppercase text-sm">
                          MISSION 0{currentMission}
                        </span>
                      </div>

                      <h2 className="text-3xl font-serif italic mb-6 tracking-widest uppercase drop-shadow-md">
                        {currentMissionInfo.title}
                      </h2>

                      <div className="flex flex-col gap-4 text-xs tracking-widest uppercase text-white/70 mb-12 w-full text-left bg-white/5 p-4 border-l-2 border-[#10b981]">
                        <div className="flex justify-between">
                          <span className="text-white/40">Objective</span>
                          <span className="text-white font-bold">
                            {currentMissionInfo.objective}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-white/40">Difficulty</span>
                          <span className="text-[#ff4d4d]">{currentMissionInfo.difficulty}</span>
                        </div>
                      </div>

                      <motion.div
                        animate={{ opacity: [0.3, 1, 0.3] }}
                        transition={{ repeat: Infinity, duration: 1.5 }}
                        className="text-[10px] text-white/50 tracking-[0.3em] uppercase cursor-pointer"
                      >
                        Press Any Key to Continue
                      </motion.div>
                    </div>
                  </motion.div>
                )}

                {/* MISSION COMPLETE SCREEN */}
                {reelState === "completed" && (
                  <motion.div
                    key="completed"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.5 }}
                    className="absolute inset-0 z-[60] flex flex-col items-center justify-center bg-black/85 backdrop-blur-md"
                  >
                    <div className="flex flex-col items-center justify-center text-center">
                      <motion.h2
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        className="text-4xl font-serif text-[#f4f4f4] tracking-widest mb-4"
                      >
                        MISSION COMPLETE
                      </motion.h2>
                      <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.4 }}
                        className="text-[#e8b23d] text-3xl tracking-[0.4em] mb-8 drop-shadow-[0_0_15px_rgba(232,178,61,0.5)]"
                      >
                        ★★★★★
                      </motion.div>

                      <motion.div
                        initial={{ y: -10, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.6 }}
                        className="flex flex-col gap-2 items-center mb-8"
                      >
                        <div className="text-white font-mono text-sm tracking-[0.3em] uppercase text-[#00f0ff] mb-2 flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4" />
                          Objective Cleared
                        </div>

                        {!hasFailedMission && currentMission <= 4 && (
                          <div className="text-[#e8b23d] font-mono text-xs tracking-[0.2em] uppercase mt-2">
                            Achievement: First Take
                          </div>
                        )}
                      </motion.div>

                      <motion.button
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 1.5 }}
                        onClick={() => setReelState("story")}
                        className="px-8 py-3 bg-transparent border border-[#e8b23d] text-[#e8b23d] font-mono uppercase text-sm tracking-widest hover:bg-[#e8b23d] hover:text-black transition-colors rounded-full"
                      >
                        Continue →
                      </motion.button>
                    </div>
                  </motion.div>
                )}

                {/* STORY TICKETS */}
                {reelState === "story" && currentMission < 6 && content && (
                  <motion.div
                    key="story"
                    initial={{ opacity: 0, y: 100, rotateX: 45 }}
                    animate={{ opacity: 1, y: 0, rotateX: 0 }}
                    exit={{ opacity: 0, scale: 1.05, filter: "brightness(2) contrast(1.5)" }}
                    transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                    onAnimationStart={() => sfx.printer()}
                    className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/95 backdrop-blur-xl p-8"
                  >
                    <div className="cinema-ticket w-full max-w-2xl shadow-[0_30px_60px_rgba(0,0,0,0.8)] flex">
                      <div className="w-[100px] flex-shrink-0 flex items-center justify-center border-r border-dashed border-black/10 relative">
                        <div className="ticket-dashed-line"></div>
                        <div
                          className="text-black/30 font-mono text-xs uppercase tracking-[0.4em] rotate-180"
                          style={{ writingMode: "vertical-rl" }}
                        >
                          Admit One
                        </div>
                      </div>
                      <div className="p-10 flex-1 flex flex-col justify-between">
                        <div>
                          <div className="flex items-center gap-4 mb-4">
                            {content.image && (
                              <img
                                src={content.image}
                                alt="Profile"
                                className="w-10 h-10 rounded-full object-cover border border-black/20 grayscale"
                              />
                            )}
                            <div className="text-black/50 font-mono text-xs tracking-[0.3em] uppercase">
                              {content.tag}
                            </div>
                          </div>
                          <h2 className="text-[#241a1e] font-serif italic text-3xl lg:text-4xl mb-4 leading-tight">
                            {content.title}
                          </h2>
                          <p className="text-black/70 font-sans text-base leading-relaxed mb-4">
                            {content.desc}
                          </p>
                          {content.link && (
                            <a
                              href={content.link.url}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-block mb-8 text-[#902424] hover:text-[#b3122e] underline decoration-dashed underline-offset-4 transition-colors font-mono text-sm uppercase tracking-wider"
                            >
                              {content.link.text} ↗
                            </a>
                          )}
                        </div>
                        <div className="flex flex-col gap-6">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: "100%" }}
                            transition={{ duration: 1.5, ease: "linear" }}
                            className="ticket-barcode overflow-hidden"
                          />
                          <div className="flex justify-end">
                            <button
                              onClick={startNextReel}
                              className="bg-[#241a1e] text-[#f4ead8] px-8 py-3 rounded-full font-mono uppercase tracking-widest text-xs hover:scale-105 hover:bg-black transition-all shadow-lg"
                            >
                              {currentMission === 5 ? "View Director's Cut" : "Play Next Scene"}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Director's Cut Final Screen */}
                {reelState === "story" && currentMission === 6 && (
                  <motion.div
                    key="directors-cut"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 1 }}
                    className="absolute inset-0 z-[60] flex flex-col items-center justify-center bg-black text-white p-8 overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.05)_0%,transparent_60%)]" />

                    <div className="relative z-10 w-full max-w-2xl border border-white/10 p-12 bg-black/70 backdrop-blur-md rounded-lg flex flex-col items-center">
                      <div className="w-full border-t border-b border-white/20 py-4 mb-8 flex justify-between items-center text-white/50 font-mono text-xs tracking-[0.3em] uppercase">
                        <span>Interactive Portfolio Complete</span>
                        <span>v1.0.0</span>
                      </div>

                      <h1 className="text-5xl md:text-7xl font-serif italic mb-8 tracking-wider text-center drop-shadow-[0_0_20px_rgba(255,255,255,0.3)]">
                        DIRECTOR'S CUT
                      </h1>

                      <div className="w-full text-center text-white/60 font-sans italic mb-8 text-sm max-w-sm">
                        "The gameplay never changes—but the scenery evolves to mirror the stages of
                        making a film."
                      </div>

                      <div className="w-full max-w-md flex flex-col gap-4 font-mono text-sm tracking-widest uppercase mb-12">
                        <div className="flex justify-between items-center border-b border-white/10 pb-2">
                          <span className="text-white/50">Runtime</span>
                          <span className="text-[#e8b23d]">{getRuntime()}</span>
                        </div>
                        <div className="flex justify-between items-center border-b border-white/10 pb-2">
                          <span className="text-white/50">Coins Collected</span>
                          <span className="text-[#00f0ff]">{totalCoins}</span>
                        </div>
                        <div className="flex justify-between items-center border-b border-white/10 pb-2">
                          <span className="text-white/50">Perfect Missions</span>
                          <span className="text-[#10b981]">{perfectMissions}</span>
                        </div>

                        {/* Achievements Section */}
                        {achievements.length > 0 && (
                          <div className="flex flex-col gap-2 mt-4 pt-4 border-t border-white/20">
                            <span className="text-white/30 mb-2">Achievements Unlocked</span>
                            {achievements.map((ach) => (
                              <div
                                key={ach}
                                className="flex items-center justify-between text-[#00f0ff]"
                              >
                                <div className="flex items-center gap-2">
                                  <CheckCircle2 className="w-4 h-4" />
                                  <span>{ach}</span>
                                </div>
                                <span className="text-white/30 text-[10px]">
                                  {ACHIEVEMENTS_LIST[ach as keyof typeof ACHIEVEMENTS_LIST]}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}

                        <div className="flex justify-center mt-6 gap-2 text-[#e8b23d]">
                          <Trophy className="w-6 h-6" />
                          <Trophy className="w-6 h-6" />
                          <Trophy className="w-6 h-6" />
                          <Trophy className="w-6 h-6" />
                          <Trophy className="w-6 h-6" />
                        </div>
                      </div>

                      <div className="flex flex-col items-center gap-4 text-xs font-mono text-white/40 uppercase tracking-[0.3em] mb-8">
                        <div>Director ............ Aditya Parihar</div>
                        <div>Developer ........... Aditya Parihar</div>
                        <div>Designer ............ Aditya Parihar</div>
                      </div>

                      <button
                        onClick={onClose}
                        className="flex items-center gap-3 px-8 py-4 border border-white/20 rounded-full hover:bg-white hover:text-black transition-all duration-300 font-mono tracking-widest text-sm uppercase group"
                      >
                        Explore Portfolio{" "}
                        <span className="group-hover:translate-x-1 transition-transform">→</span>
                      </button>
                    </div>
                  </motion.div>
                )}

                {reelState === "fail" && (
                  <motion.div
                    key="fail"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="absolute inset-0 z-[60] flex flex-col items-center justify-center bg-black/95 backdrop-blur-md"
                  >
                    <h2 className="text-[#ff6a82] font-serif italic text-5xl mb-4">Cut! Take 2.</h2>
                    <button
                      onClick={retryReel}
                      className="border border-white/20 text-white px-8 py-3 rounded-full font-mono uppercase tracking-widest hover:bg-white/10 transition-colors"
                    >
                      Reset Scene
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>

              {currentMission === 1 &&
                (reelState === "playing" || reelState === "fail" || reelState === "completed") && (
                  <canvas
                    ref={canvasRef}
                    className="absolute inset-0 w-full h-full object-cover z-0"
                    style={{ imageRendering: "pixelated" }}
                  />
                )}
              {currentMission === 2 && (reelState === "playing" || reelState === "completed") && (
                <ChessPuzzleGame
                  onComplete={() => {
                    unlockAchievement("Grandmaster");
                    setReelState("completed");
                  }}
                  sfx={sfx}
                />
              )}
              {currentMission === 3 && (reelState === "playing" || reelState === "completed") && (
                <MemoryMatchGame
                  onComplete={() => {
                    unlockAchievement("Film Buff");
                    setReelState("completed");
                  }}
                  sfx={sfx}
                />
              )}
              {currentMission === 4 && (reelState === "playing" || reelState === "completed") && (
                <SudokuGame
                  onComplete={() => {
                    unlockAchievement("Logic Node");
                    setReelState("completed");
                  }}
                  sfx={sfx}
                />
              )}
            </div>
          </div>

          <div className="mt-4 flex justify-between items-center px-4 font-mono text-[10px] md:text-xs text-[#666] tracking-widest uppercase select-none z-10">
            <div className="flex gap-6">
              {currentMission === 1 ? (
                <span className="text-white/50 bg-white/5 px-3 py-1 rounded">
                  CTL: SPACE/JUMP, DOWN/CROUCH
                </span>
              ) : (
                <span className="text-white/50 bg-white/5 px-3 py-1 rounded">CTL: MOUSE/TOUCH</span>
              )}
              <span className="hidden md:flex items-center gap-2">
                SDI IN <div className="w-1.5 h-1.5 rounded-full bg-[#10b981]"></div>
              </span>
            </div>
            <div className="flex items-center gap-4">
              <span>TC 01:24:43:12</span>
              <div className="flex gap-1.5">
                <div className="w-1.5 h-3 bg-[#444] rounded-sm"></div>
                <div className="w-1.5 h-3 bg-[#444] rounded-sm"></div>
                <div className="w-1.5 h-3 bg-[#10b981] rounded-sm shadow-[0_0_5px_#10b981]"></div>
              </div>
            </div>
          </div>
        </div>

        <button
          onClick={() => setSoundEnabled(!soundEnabled)}
          className="absolute bottom-8 right-8 z-50 bg-black/50 backdrop-blur-md border border-white/20 p-3 rounded-full text-[#e8b23d] hover:bg-black/70 transition-colors shadow-xl"
        >
          {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
        </button>
      </div>
    </div>
  );
}
