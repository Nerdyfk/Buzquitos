"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import {
  RotateCcw,
  Eye,
  Sliders,
  ArrowRightLeft,
  Clock,
  Zap,
  Sparkles,
  Trophy,
} from "lucide-react";

export type PuzzleMode = "swap" | "slide";

interface PuzzleBoardProps {
  onSolved?: (moves: number, timeSeconds: number) => void;
  targetSrc?: string;
}

const GRID_SIZE = 3;
const TOTAL_TILES = GRID_SIZE * GRID_SIZE; // 9

export const CHARACTER_IMAGES = [
  "/characters/buzquito-1.png",
  "/characters/buzquito-2.png",
  "/characters/buzquito-3.png",
  "/characters/buzquito-5.png",
  "/characters/buzquito-6.png",
  "/characters/buzquito-7.png",
  "/nft-target.png",
];

// Checks whether an 8-puzzle configuration is mathematically solvable
// For 3x3 with empty slot at index 8 (bottom-right), solvable iff number of inversions is even
function countInversions(arr: number[]): number {
  let inv = 0;
  for (let i = 0; i < arr.length - 1; i++) {
    if (arr[i] === 8) continue; // ignore empty tile
    for (let j = i + 1; j < arr.length; j++) {
      if (arr[j] === 8) continue;
      if (arr[i] > arr[j]) inv++;
    }
  }
  return inv;
}

export function generateSolvableShuffle(mode: PuzzleMode): number[] {
  let tiles = Array.from({ length: TOTAL_TILES }, (_, i) => i);

  do {
    // Fisher-Yates shuffle
    for (let i = tiles.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [tiles[i], tiles[j]] = [tiles[j], tiles[i]];
    }

    if (mode === "slide") {
      // In slide mode, make sure the blank tile (8) is initially placed at bottom-right (index 8)
      const blankIndex = tiles.indexOf(8);
      if (blankIndex !== 8) {
        [tiles[blankIndex], tiles[8]] = [tiles[8], tiles[blankIndex]];
      }
      // Solvable iff inversions is even
      const inversions = countInversions(tiles);
      if (inversions % 2 !== 0) {
        // Swap first two non-empty tiles to flip inversion parity
        const i1 = tiles[0] === 8 ? 2 : 0;
        const i2 = tiles[1] === 8 ? 2 : 1;
        [tiles[i1], tiles[i2]] = [tiles[i2], tiles[i1]];
      }
    }
  } while (tiles.every((val, idx) => val === idx)); // Ensure it's not already solved

  return tiles;
}

export function drawFallbackPixelArt(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const w = canvas.width;
  const h = canvas.height;
  const pixelSize = w / 30; // 30x30 virtual pixel grid

  ctx.imageSmoothingEnabled = false;

  // 1. Lime-green Background (#B8E643)
  ctx.fillStyle = "#B8E643";
  ctx.fillRect(0, 0, w, h);

  // Background pixel dithering grid
  ctx.fillStyle = "#A3D332";
  for (let r = 0; r < 30; r += 2) {
    for (let c = 0; c < 30; c += 2) {
      ctx.fillRect(c * pixelSize, r * pixelSize, pixelSize, pixelSize);
    }
  }

  function p(col: number, row: number, color: string, wP = 1, hP = 1) {
    if (!ctx) return;
    ctx.fillStyle = color;
    ctx.fillRect(col * pixelSize, row * pixelSize, wP * pixelSize, hP * pixelSize);
  }

  // 2. Crown (Gold #FACC15 with #EAB308 and red rubies)
  // Crown base
  p(9, 6, "#111111", 12, 1);
  p(9, 7, "#FACC15", 12, 2);
  p(9, 8, "#EAB308", 12, 1);
  // Crown spikes (5 peaks)
  p(9, 4, "#FACC15", 2, 3);
  p(12, 5, "#FACC15", 2, 2);
  p(14, 3, "#FACC15", 2, 4); // tallest center
  p(17, 5, "#FACC15", 2, 2);
  p(19, 4, "#FACC15", 2, 3);

  // Crown jewels
  p(9, 4, "#e42c24", 2, 1);
  p(14, 3, "#38bdf8", 2, 1);
  p(19, 4, "#e42c24", 2, 1);
  p(11, 7, "#e42c24", 1, 1);
  p(15, 7, "#38bdf8", 1, 1);
  p(18, 7, "#e42c24", 1, 1);

  // Crown outline
  p(8, 4, "#111111", 1, 5);
  p(21, 4, "#111111", 1, 5);

  // 3. Yellow Hoodie & Head (#FACC15, #EAB308)
  p(7, 9, "#111111", 16, 1);
  p(6, 10, "#111111", 1, 15);
  p(23, 10, "#111111", 1, 15);

  // Hoodie top & sides
  p(7, 10, "#FACC15", 16, 4);
  p(7, 14, "#FACC15", 3, 10);
  p(20, 14, "#FACC15", 3, 10);

  // Face Skin (#FEF3C7 / #FDE68A)
  p(10, 13, "#FDE68A", 10, 9);
  p(11, 14, "#FEF3C7", 8, 7);

  // 4. Laser Eyes (#e42c24 & cyan #22d3ee)
  // Left eye
  p(11, 15, "#111111", 3, 3);
  p(11, 15, "#ef4444", 2, 2);
  p(12, 16, "#ffffff", 1, 1);

  // Right eye
  p(16, 15, "#111111", 3, 3);
  p(16, 15, "#ef4444", 2, 2);
  p(17, 16, "#ffffff", 1, 1);

  // Powerful Laser Beams shooting out to both sides!
  p(0, 15, "#ef4444", 11, 2);
  p(0, 16, "#fca5a5", 11, 1);
  p(18, 15, "#ef4444", 12, 2);
  p(18, 16, "#fca5a5", 12, 1);

  // 5. Pixel Mouth / Smirk
  p(13, 20, "#111111", 4, 1);
  p(14, 21, "#111111", 3, 1);
  p(14, 20, "#ffffff", 2, 1); // pixel tooth

  // 6. Hoodie Body / Shoulders
  p(5, 23, "#111111", 20, 1);
  p(4, 24, "#FACC15", 22, 6);
  p(4, 24, "#111111", 1, 6);
  p(25, 24, "#111111", 1, 6);
  // Hoodie strings
  p(12, 24, "#ffffff", 1, 4);
  p(17, 24, "#ffffff", 1, 4);
  p(12, 27, "#111111", 1, 1);
  p(17, 27, "#111111", 1, 1);

  // Outer border
  ctx.strokeStyle = "#111111";
  ctx.lineWidth = 8;
  ctx.strokeRect(4, 4, w - 8, h - 8);
}

export function PuzzleBoard({
  onSolved,
  targetSrc = "/nft-target.png",
}: PuzzleBoardProps) {
  const [mode, setMode] = useState<PuzzleMode>("swap");
  const [board, setBoard] = useState<number[]>(() => generateSolvableShuffle("swap"));
  const [charIndex, setCharIndex] = useState(0);
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [tileUrls, setTileUrls] = useState<string[]>([]);
  const [fullImageUrl, setFullImageUrl] = useState<string>(targetSrc);
  const [moves, setMoves] = useState(0);
  const [timeSeconds, setTimeSeconds] = useState(0);
  const [timerActive, setTimerActive] = useState(false);
  const [isSolved, setIsSolved] = useState(false);
  const [peekActive, setPeekActive] = useState(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const fallbackCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // 1. Slice image or generate fallback canvas
  const sliceImage = useCallback((img: HTMLImageElement | HTMLCanvasElement) => {
    const tileW = img.width / GRID_SIZE;
    const tileH = img.height / GRID_SIZE;
    const urls: string[] = [];

    const offscreen = document.createElement("canvas");
    offscreen.width = tileW;
    offscreen.height = tileH;
    const offCtx = offscreen.getContext("2d");

    if (!offCtx) return;

    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE; c++) {
        offCtx.clearRect(0, 0, tileW, tileH);
        offCtx.drawImage(
          img,
          c * tileW,
          r * tileH,
          tileW,
          tileH,
          0,
          0,
          tileW,
          tileH
        );
        urls.push(offscreen.toDataURL("image/png"));
      }
    }

    setTileUrls(urls);
  }, []);

  // 2. Load target image or fallback
  useEffect(() => {
    let active = true;
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = fullImageUrl;

    img.onload = () => {
      if (!active) return;
      sliceImage(img);
    };

    img.onerror = () => {
      if (!active) return;
      // Automatic fallback canvas generator
      const canvas = document.createElement("canvas");
      canvas.width = 450;
      canvas.height = 450;
      drawFallbackPixelArt(canvas);
      const dataUrl = canvas.toDataURL("image/png");
      setFullImageUrl(dataUrl);
      sliceImage(canvas);
    };

    return () => {
      active = false;
    };
  }, [fullImageUrl, sliceImage]);

  // 3. Timer Hook
  useEffect(() => {
    if (timerActive && !isSolved) {
      timerRef.current = setInterval(() => {
        setTimeSeconds((s) => s + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [timerActive, isSolved]);

  // 4. Check if solved
  const checkWin = useCallback(
    (currentBoard: number[], currentMoves: number, currentTime: number) => {
      const solved = currentBoard.every((val, idx) => val === idx);
      if (solved) {
        setIsSolved(true);
        setTimerActive(false);
        onSolved?.(currentMoves, currentTime);
      }
    },
    [onSolved]
  );

  // 5. Handle Tile Click in Swap Mode
  const handleSwapClick = (clickedIdx: number) => {
    if (isSolved) return;
    if (!timerActive && moves === 0) setTimerActive(true);

    if (selectedIdx === null) {
      setSelectedIdx(clickedIdx);
      return;
    }

    if (selectedIdx === clickedIdx) {
      setSelectedIdx(null);
      return;
    }

    // Perform swap
    const nextBoard = [...board];
    [nextBoard[selectedIdx], nextBoard[clickedIdx]] = [
      nextBoard[clickedIdx],
      nextBoard[selectedIdx],
    ];

    const nextMoves = moves + 1;
    setBoard(nextBoard);
    setSelectedIdx(null);
    setMoves(nextMoves);

    checkWin(nextBoard, nextMoves, timeSeconds);
  };

  // 6. Handle Tile Click in Slide Mode
  const handleSlideClick = (clickedIdx: number) => {
    if (isSolved) return;
    if (!timerActive && moves === 0) setTimerActive(true);

    // In slide mode, tile #8 is empty slot
    const emptyIdx = board.indexOf(8);
    const rowClicked = Math.floor(clickedIdx / GRID_SIZE);
    const colClicked = clickedIdx % GRID_SIZE;
    const rowEmpty = Math.floor(emptyIdx / GRID_SIZE);
    const colEmpty = emptyIdx % GRID_SIZE;

    // Check adjacency (Manhattan distance === 1)
    const isAdjacent =
      Math.abs(rowClicked - rowEmpty) + Math.abs(colClicked - colEmpty) === 1;

    if (isAdjacent) {
      const nextBoard = [...board];
      [nextBoard[clickedIdx], nextBoard[emptyIdx]] = [
        nextBoard[emptyIdx],
        nextBoard[clickedIdx],
      ];

      const nextMoves = moves + 1;
      setBoard(nextBoard);
      setMoves(nextMoves);

      checkWin(nextBoard, nextMoves, timeSeconds);
    }
  };

  // 7. Reset / New Shuffle
  const handleShuffle = () => {
    const nextIdx = (charIndex + 1) % CHARACTER_IMAGES.length;
    setCharIndex(nextIdx);
    setFullImageUrl(CHARACTER_IMAGES[nextIdx]);
    const fresh = generateSolvableShuffle(mode);
    setBoard(fresh);
    setSelectedIdx(null);
    setMoves(0);
    setTimeSeconds(0);
    setTimerActive(false);
    setIsSolved(false);
  };

  // 8. Toggle Mode
  const handleToggleMode = (newMode: PuzzleMode) => {
    if (newMode === mode) return;
    setMode(newMode);
    const fresh = generateSolvableShuffle(newMode);
    setBoard(fresh);
    setSelectedIdx(null);
    setMoves(0);
    setTimeSeconds(0);
    setTimerActive(false);
    setIsSolved(false);
  };

  // Matched pieces count
  const matchedCount = board.filter((val, idx) => val === idx).length;
  const matchPct = Math.round((matchedCount / TOTAL_TILES) * 100);

  function formatTime(s: number): string {
    const min = Math.floor(s / 60);
    const sec = s % 60;
    return `${min.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
  }

  return (
    <div className="w-full max-w-xl mx-auto space-y-5">
      {/* HUD Header */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {/* Moves Counter */}
        <div className="border-3 border-[#111111] bg-[#FEF3C7] p-3 shadow-[3px_3px_0_#111111] text-center">
          <div className="font-mono text-[10px] font-bold text-[#666666] uppercase">
            MOVES
          </div>
          <div className="mt-0.5 font-mono text-xl sm:text-2xl font-black text-[#111111]">
            {moves}
          </div>
        </div>

        {/* Elapsed Timer */}
        <div className="border-3 border-[#111111] bg-[#FEF3C7] p-3 shadow-[3px_3px_0_#111111] text-center">
          <div className="font-mono text-[10px] font-bold text-[#666666] uppercase flex items-center justify-center gap-1">
            <Clock className="h-3 w-3" />
            <span>TIME</span>
          </div>
          <div className="mt-0.5 font-mono text-xl sm:text-2xl font-black text-[#111111]">
            {formatTime(timeSeconds)}
          </div>
        </div>

        {/* Matched Progress */}
        <div className="border-3 border-[#111111] bg-[#FEF3C7] p-3 shadow-[3px_3px_0_#111111] text-center col-span-2 sm:col-span-2">
          <div className="flex items-center justify-between font-mono text-[10px] font-bold text-[#666666]">
            <span>PIECES MATCHED</span>
            <span className="text-[#111111] font-black">{matchedCount}/9</span>
          </div>
          {/* Progress bar */}
          <div className="mt-2 h-3.5 border-2 border-[#111111] bg-white overflow-hidden p-0.5">
            <div
              className="h-full bg-[#B8E643] transition-all duration-300"
              style={{ width: `${matchPct}%` }}
            />
          </div>
        </div>
      </div>

      {/* Control bar: Mode switcher & Peek & Shuffle */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-3 border-[#111111] bg-white p-2.5 shadow-[4px_4px_0_#111111]">
        {/* Mode Toggle */}
        <div className="flex items-center gap-1 border-2 border-[#111111] bg-[#FEF3C7] p-1 font-mono text-xs font-bold">
          <span className="bg-[#111111] text-[#B8E643] px-3 py-1.5 shadow-[2px_2px_0_#111111]">
            SWAP MODE
          </span>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2">
          {/* Peek Reference button */}
          <button
            type="button"
            onMouseDown={() => setPeekActive(true)}
            onMouseUp={() => setPeekActive(false)}
            onTouchStart={() => setPeekActive(true)}
            onTouchEnd={() => setPeekActive(false)}
            className={`flex items-center gap-1.5 border-2 border-[#111111] px-3 py-1.5 font-mono text-xs font-bold shadow-[2px_2px_0_#111111] transition active:translate-x-0.5 active:translate-y-0.5 ${
              peekActive ? "bg-[#111111] text-white" : "bg-[#FEF3C7] text-[#111111] hover:bg-[#FACC15]"
            }`}
          >
            <Eye className="h-3.5 w-3.5" />
            <span>PEEK</span>
          </button>

          {/* New Shuffle */}
          <button
            type="button"
            onClick={handleShuffle}
            className="flex items-center gap-1.5 border-2 border-[#111111] bg-[#B8E643] px-3 py-1.5 font-mono text-xs font-bold text-[#111111] shadow-[2px_2px_0_#111111] transition hover:bg-[#FACC15] active:translate-x-0.5 active:translate-y-0.5"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>SHUFFLE</span>
          </button>
        </div>
      </div>

      {/* Main Puzzle Board Frame */}
      <div className="relative mx-auto w-full aspect-square max-w-[420px] sm:max-w-[450px] border-4 border-[#111111] bg-[#B8E643] p-2.5 shadow-[8px_8px_0_#111111]">
        {/* Peek Reference Overlay */}
        {peekActive && (
          <div className="absolute inset-2.5 z-30 flex items-center justify-center border-3 border-[#111111] bg-[#111111]/85 backdrop-blur-xs p-2">
            <img
              src={fullImageUrl}
              alt="Target NFT Reference"
              className="h-full w-full object-contain pixelated border-2 border-[#B8E643]"
            />
            <div className="absolute top-4 left-4 bg-[#111111] border-2 border-[#B8E643] px-2 py-0.5 font-mono text-[10px] font-bold text-[#B8E643]">
              REFERENCE PREVIEW
            </div>
          </div>
        )}

        {/* 3x3 Tile Grid */}
        <div className="grid grid-cols-3 grid-rows-3 gap-2 h-full w-full">
          {board.map((tileValue, gridIndex) => {
            const isCorrect = tileValue === gridIndex;
            const isSelected = selectedIdx === gridIndex;
            const isSlideEmpty = mode === "slide" && tileValue === 8 && !isSolved;

            if (isSlideEmpty) {
              return (
                <div
                  key={`empty-${gridIndex}`}
                  className="relative border-3 border-dashed border-[#111111]/40 bg-[#111111]/10 flex items-center justify-center"
                >
                  <span className="font-mono text-[10px] font-bold text-[#111111]/30">
                    EMPTY
                  </span>
                </div>
              );
            }

            return (
              <button
                key={`tile-${gridIndex}-${tileValue}`}
                type="button"
                onClick={() =>
                  mode === "swap"
                    ? handleSwapClick(gridIndex)
                    : handleSlideClick(gridIndex)
                }
                className={`relative group aspect-square w-full overflow-hidden border-3 border-[#111111] transition-transform select-none ${
                  isSelected
                    ? "ring-4 ring-[#e42c24] scale-[0.96] shadow-[2px_2px_0_#111111]"
                    : "shadow-[4px_4px_0_#111111] hover:-translate-y-0.5"
                } ${isCorrect ? "bg-white" : "bg-[#FEF3C7]"}`}
                style={{ imageRendering: "pixelated" }}
              >
                {/* Tile Slice Image */}
                {tileUrls[tileValue] ? (
                  <img
                    src={tileUrls[tileValue]}
                    alt={`Piece ${tileValue + 1}`}
                    className="h-full w-full object-cover pixelated pointer-events-none"
                    style={{ imageRendering: "pixelated" }}
                  />
                ) : (
                  <div className="h-full w-full flex items-center justify-center font-mono font-black text-2xl text-[#111111]">
                    {tileValue + 1}
                  </div>
                )}

                {/* Status Badge in corner */}
                <div
                  className={`absolute top-1 left-1 border border-[#111111] px-1 font-mono text-[9px] font-black leading-tight ${
                    isCorrect
                      ? "bg-[#B8E643] text-[#111111]"
                      : "bg-[#FEF3C7] text-[#111111]"
                  }`}
                >
                  #{tileValue + 1}
                </div>

                {/* Correct alignment indicator */}
                {isCorrect && (
                  <div className="absolute bottom-1 right-1 bg-[#111111] px-1 font-mono text-[8px] font-bold text-[#B8E643]">
                    ✓
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Guide Note */}
      <div className="border-2 border-[#111111] bg-[#FEF3C7] p-3 font-mono text-xs text-[#333333] shadow-[3px_3px_0_#111111]">
        <div className="flex items-start gap-2">
          <Zap className="h-4 w-4 text-[#e42c24] shrink-0 mt-0.5" />
          <div>
            <strong>How to Play:</strong>{" "}
            {mode === "swap"
              ? "Click any tile, then click a second tile to swap their positions until all 9 pieces match the NFT."
              : "Click any tile adjacent to the empty slot to slide it into position until all 8 pieces align (tile #9 will restore automatically)."}
          </div>
        </div>
      </div>
    </div>
  );
}
