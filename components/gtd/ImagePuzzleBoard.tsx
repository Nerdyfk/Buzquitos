"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  RotateCcw,
  Eye,
  Clock,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Trophy,
  Zap,
  Shuffle,
  ChevronRight,
  ImageIcon,
} from "lucide-react";
import type { CampaignSnapshot, ClientPuzzle } from "@/types/gtd";
import { generateSolvableShuffle, type ImagePuzzleMode } from "@/lib/gtd/image-puzzle";

export interface CharacterItem {
  id: string;
  name: string;
  src: string;
}

export const CHARACTER_LIST: CharacterItem[] = [
  { id: "king", name: "King Buzquito", src: "/nft-target.png" },
  { id: "c1", name: "Buzquito #1", src: "/characters/buzquito-1.png" },
  { id: "c2", name: "Buzquito #2", src: "/characters/buzquito-2.png" },
  { id: "c3", name: "Buzquito #3", src: "/characters/buzquito-3.png" },
  { id: "c5", name: "Buzquito #5", src: "/characters/buzquito-5.png" },
  { id: "c6", name: "Buzquito #6", src: "/characters/buzquito-6.png" },
  { id: "c7", name: "Buzquito #7", src: "/characters/buzquito-7.png" },
];

// Self-contained fallback pixel-art canvas generator
function drawFallbackPixelArt(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const w = canvas.width;
  const h = canvas.height;
  const pixelSize = w / 30;

  ctx.imageSmoothingEnabled = false;

  // Background
  ctx.fillStyle = "#B8E643";
  ctx.fillRect(0, 0, w, h);

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

  // Crown
  p(9, 6, "#111111", 12, 1);
  p(9, 7, "#FACC15", 12, 2);
  p(9, 8, "#EAB308", 12, 1);
  p(9, 4, "#FACC15", 2, 3);
  p(12, 5, "#FACC15", 2, 2);
  p(14, 3, "#FACC15", 2, 4);
  p(17, 5, "#FACC15", 2, 2);
  p(19, 4, "#FACC15", 2, 3);
  p(9, 4, "#e42c24", 2, 1);
  p(14, 3, "#38bdf8", 2, 1);
  p(19, 4, "#e42c24", 2, 1);
  p(8, 4, "#111111", 1, 5);
  p(21, 4, "#111111", 1, 5);

  // Hoodie
  p(7, 9, "#111111", 16, 1);
  p(6, 10, "#111111", 1, 15);
  p(23, 10, "#111111", 1, 15);
  p(7, 10, "#FACC15", 16, 4);
  p(7, 14, "#FACC15", 3, 10);
  p(20, 14, "#FACC15", 3, 10);

  // Face
  p(10, 13, "#FDE68A", 10, 9);
  p(11, 14, "#FEF3C7", 8, 7);

  // Laser Eyes
  p(11, 15, "#111111", 3, 3);
  p(11, 15, "#ef4444", 2, 2);
  p(12, 16, "#ffffff", 1, 1);
  p(16, 15, "#111111", 3, 3);
  p(16, 15, "#ef4444", 2, 2);
  p(17, 16, "#ffffff", 1, 1);
  p(0, 15, "#ef4444", 11, 2);
  p(0, 16, "#fca5a5", 11, 1);
  p(18, 15, "#ef4444", 12, 2);
  p(18, 16, "#fca5a5", 12, 1);

  // Mouth
  p(13, 20, "#111111", 4, 1);
  p(14, 21, "#111111", 3, 1);
  p(14, 20, "#ffffff", 2, 1);

  // Body
  p(5, 23, "#111111", 20, 1);
  p(4, 24, "#FACC15", 22, 6);
  p(4, 24, "#111111", 1, 6);
  p(25, 24, "#111111", 1, 6);

  ctx.strokeStyle = "#111111";
  ctx.lineWidth = 8;
  ctx.strokeRect(4, 4, w - 8, h - 8);
}

interface ImagePuzzleBoardProps {
  puzzle: ClientPuzzle;
  campaign: CampaignSnapshot;
  onSolved: (data: {
    completedAt: string;
    message: string;
    campaign: CampaignSnapshot;
    claimEligible: boolean;
  }) => void;
  onSwitchPuzzle?: (type: "math_3x3" | "word_cipher") => void;
}

export function ImagePuzzleBoard({
  puzzle,
  campaign,
  onSolved,
  onSwitchPuzzle,
}: ImagePuzzleBoardProps) {
  const isAlreadyLocked =
    puzzle.status === "COMPLETED" || puzzle.status === "SUBMITTED";

  const mode = "swap";
  const [board, setBoard] = useState<number[]>(() => {
    if (puzzle.status === "COMPLETED" || puzzle.status === "SUBMITTED") {
      return [0, 1, 2, 3, 4, 5, 6, 7, 8];
    }
    if (puzzle.initialGrid && puzzle.initialGrid.length === 3) {
      return puzzle.initialGrid.flat();
    }
    return generateSolvableShuffle("swap");
  });

  const [characterIndex, setCharacterIndex] = useState(0);
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [tileUrls, setTileUrls] = useState<string[]>([]);
  const [fullImageUrl, setFullImageUrl] = useState<string>(
    CHARACTER_LIST[0].src
  );
  const [moves, setMoves] = useState(0);
  const [timeSeconds, setTimeSeconds] = useState(0);
  const [timerActive, setTimerActive] = useState(false);
  const [peekActive, setPeekActive] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [successData, setSuccessData] = useState<{
    message: string;
    completedAt: string;
    claimEligible: boolean;
  } | null>(
    puzzle.status === "COMPLETED"
      ? {
          message:
            "Congratulations! You successfully solved your personalized GTD Whitelist Challenge.",
          completedAt: puzzle.completedAt ?? new Date().toISOString(),
          claimEligible: campaign.remainingSpots > 0,
        }
      : null
  );

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Slices image into 9 tiles
  const sliceImage = useCallback((img: HTMLImageElement | HTMLCanvasElement) => {
    const tileW = img.width / 3;
    const tileH = img.height / 3;
    const urls: string[] = [];

    const offscreen = document.createElement("canvas");
    offscreen.width = tileW;
    offscreen.height = tileH;
    const offCtx = offscreen.getContext("2d");
    if (!offCtx) return;

    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 3; c++) {
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

  // Loads and slices a specific character image
  const loadAndSliceImage = useCallback(
    (src: string) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.src = src;

      img.onload = () => {
        setFullImageUrl(src);
        sliceImage(img);
      };

      img.onerror = () => {
        const canvas = document.createElement("canvas");
        canvas.width = 450;
        canvas.height = 450;
        drawFallbackPixelArt(canvas);
        const dataUrl = canvas.toDataURL("image/png");
        setFullImageUrl(dataUrl);
        sliceImage(canvas);
      };
    },
    [sliceImage]
  );

  // Initial load
  useEffect(() => {
    loadAndSliceImage(CHARACTER_LIST[characterIndex].src);
  }, [characterIndex, loadAndSliceImage]);

  // Timer
  useEffect(() => {
    if (timerActive && !successData && !isAlreadyLocked) {
      timerRef.current = setInterval(() => {
        setTimeSeconds((s) => s + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [timerActive, successData, isAlreadyLocked]);

  // Verify on server
  const verifySolve = useCallback(
    async (finalBoard: number[]) => {
      if (isAlreadyLocked || verifying) return;
      setVerifying(true);
      setErrorMsg(null);

      try {
        const res = await fetch("/api/gtd/puzzle/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            puzzleId: puzzle.puzzleId,
            grid: finalBoard,
          }),
        });

        const data = await res.json();

        if (!res.ok) {
          setErrorMsg(data.error || "Verification failed. Please try again.");
          return;
        }

        const completedAt = data.completedAt ?? new Date().toISOString();
        const successObj = {
          message: data.message,
          completedAt,
          claimEligible: Boolean(data.claimEligible),
        };

        setSuccessData(successObj);
        setTimerActive(false);

        onSolved({
          completedAt,
          message: data.message,
          campaign: data.campaign ?? campaign,
          claimEligible: Boolean(data.claimEligible),
        });
      } catch {
        setErrorMsg(
          "Network error verifying puzzle solution. Please try again."
        );
      } finally {
        setVerifying(false);
      }
    },
    [puzzle.puzzleId, isAlreadyLocked, verifying, campaign, onSolved]
  );

  const handleSwapClick = (clickedIdx: number) => {
    if (successData || isAlreadyLocked) return;
    if (!timerActive && moves === 0) setTimerActive(true);

    if (selectedIdx === null) {
      setSelectedIdx(clickedIdx);
      return;
    }

    if (selectedIdx === clickedIdx) {
      setSelectedIdx(null);
      return;
    }

    const nextBoard = [...board];
    [nextBoard[selectedIdx], nextBoard[clickedIdx]] = [
      nextBoard[clickedIdx],
      nextBoard[selectedIdx],
    ];

    const nextMoves = moves + 1;
    setBoard(nextBoard);
    setSelectedIdx(null);
    setMoves(nextMoves);

    if (nextBoard.every((val, idx) => val === idx)) {
      verifySolve(nextBoard);
    }
  };

  // When user clicks Shuffle: randomly picks from character pool AND creates a fresh solvable shuffle
  const handleShuffle = () => {
    if (isAlreadyLocked) return;
    const nextIdx = (characterIndex + 1) % CHARACTER_LIST.length;
    setCharacterIndex(nextIdx);
    loadAndSliceImage(CHARACTER_LIST[nextIdx].src);

    const fresh = generateSolvableShuffle("swap");
    setBoard(fresh);
    setSelectedIdx(null);
    setMoves(0);
    setTimeSeconds(0);
    setTimerActive(false);
    setErrorMsg(null);
  };

  const matchedCount = board.filter((val, idx) => val === idx).length;
  const matchPct = Math.round((matchedCount / 9) * 100);

  function formatTime(s: number): string {
    const min = Math.floor(s / 60);
    const sec = s % 60;
    return `${min.toString().padStart(2, "0")}:${sec
      .toString()
      .padStart(2, "0")}`;
  }

  const currentCharacter = CHARACTER_LIST[characterIndex];
  const watermarkText = `@${puzzle.displayUsername}`;

  return (
    <div className="space-y-6">
      {/* Top HUD */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="border-2 border-[#171820] bg-[#f7f7ed] p-3 text-center shadow-[3px_3px_0_#171820]">
          <div className="eyebrow text-[10px] text-[#535744]">MOVES</div>
          <div className="mt-1 font-mono text-xl sm:text-2xl font-black text-[#171820]">
            {moves}
          </div>
        </div>

        <div className="border-2 border-[#171820] bg-[#f7f7ed] p-3 text-center shadow-[3px_3px_0_#171820]">
          <div className="eyebrow text-[10px] text-[#535744] flex items-center justify-center gap-1">
            <Clock className="h-3 w-3" />
            <span>TIME</span>
          </div>
          <div className="mt-1 font-mono text-xl sm:text-2xl font-black text-[#171820]">
            {formatTime(timeSeconds)}
          </div>
        </div>

        <div className="border-2 border-[#171820] bg-[#f7f7ed] p-3 text-center col-span-2 shadow-[3px_3px_0_#171820]">
          <div className="flex items-center justify-between eyebrow text-[10px] text-[#535744]">
            <span>PIECES MATCHED</span>
            <span className="font-bold text-[#171820]">{matchedCount}/9</span>
          </div>
          <div className="mt-2 h-3 border-2 border-[#171820] bg-white p-0.5 overflow-hidden">
            <div
              className="h-full bg-[#c2ed55] transition-all duration-300"
              style={{ width: `${matchPct}%` }}
            />
          </div>
        </div>
      </div>

      {/* Switch to Other 2 Puzzles with Same Username */}
      <div className="border-2 border-[#171820] bg-white p-3 shadow-[4px_4px_0_#171820]">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b-2 border-[#171820]/15 pb-2 mb-2.5">
          <div className="flex items-center gap-2">
            <span className="border border-[#171820] bg-[#f6d52b] px-2 py-0.5 font-mono text-[10px] font-black text-[#171820]">
              SWITCH PUZZLE
            </span>
            <span className="font-mono text-xs font-black text-[#171820]">
              CHOOSE ANOTHER CHALLENGE (SAME @{puzzle.displayUsername.toUpperCase()}):
            </span>
          </div>
          <span className="font-mono text-[10px] text-[#666666]">
            Generated instantly for your username
          </span>
        </div>

        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => onSwitchPuzzle?.("math_3x3")}
            className="flex items-center justify-center gap-2 border-2 border-[#171820] bg-white py-2 px-3 font-mono text-xs font-black text-[#171820] hover:bg-[#f6d52b] shadow-[2px_2px_0_#171820] transition active:translate-y-0.5"
          >
            <span>SWITCH TO: 🔢 3×3 MATH GRID (Σ=15)</span>
          </button>
          <button
            type="button"
            onClick={() => onSwitchPuzzle?.("word_cipher")}
            className="flex items-center justify-center gap-2 border-2 border-[#171820] bg-white py-2 px-3 font-mono text-xs font-black text-[#171820] hover:bg-[#c2ed55] shadow-[2px_2px_0_#171820] transition active:translate-y-0.5"
          >
            <span>SWITCH TO: 🔤 WEB3 WORD CIPHER</span>
          </button>
        </div>
      </div>

      {/* Control bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-2 border-[#171820] bg-white p-2.5 shadow-[4px_4px_0_#171820]">
        <div className="flex items-center gap-1.5 font-mono text-xs font-bold text-[#171820]">
          <span className="border border-[#171820] bg-[#c2ed55] px-2.5 py-1 text-[11px] font-black">
            SWAP MODE
          </span>
          <span className="text-[11px] text-[#555555]">
            Click any 2 tiles to swap
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onMouseDown={() => setPeekActive(true)}
            onMouseUp={() => setPeekActive(false)}
            onTouchStart={() => setPeekActive(true)}
            onTouchEnd={() => setPeekActive(false)}
            className="flex items-center gap-1 border border-[#171820] bg-[#f7f7ed] px-3 py-2 font-mono text-xs font-bold text-[#171820] hover:bg-[#f6d52b] active:bg-[#171820] active:text-white"
          >
            <Eye className="h-3.5 w-3.5" />
            <span>PEEK REFERENCE</span>
          </button>

          {!isAlreadyLocked && !successData && (
            <button
              type="button"
              onClick={handleShuffle}
              className="flex items-center gap-1.5 border-2 border-[#171820] bg-[#171820] px-3.5 py-2 font-mono text-xs font-black text-[#c2ed55] hover:bg-[#f6d52b] hover:text-[#171820] shadow-[2px_2px_0_#171820] active:translate-y-0.5"
              title="Shuffle tiles and load fresh image"
            >
              <Shuffle className="h-3.5 w-3.5" />
              <span>SHUFFLE PUZZLE</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Puzzle Canvas Area with Repeating Watermark */}
      <div className="relative mx-auto w-full aspect-square max-w-[420px] sm:max-w-[440px] border-4 border-[#171820] bg-[#c2ed55] p-2.5 shadow-[6px_6px_0_#171820] overflow-hidden">
        {/* Semi-transparent repeating watermark behind tiles */}
        <div
          className="pointer-events-none absolute inset-0 z-0 flex flex-wrap content-around justify-around opacity-20 select-none overflow-hidden"
          aria-hidden="true"
        >
          {Array.from({ length: 16 }).map((_, i) => (
            <span
              key={i}
              className="rotate-[-22deg] font-mono text-sm sm:text-base font-black text-[#171820] whitespace-nowrap p-3"
            >
              {watermarkText}
            </span>
          ))}
        </div>

        {/* Peek Overlay showing current character reference */}
        {peekActive && (
          <div className="absolute inset-2.5 z-30 flex items-center justify-center border-2 border-[#171820] bg-[#171820]/90 p-2">
            <img
              src={fullImageUrl}
              alt="Reference Preview"
              className="h-full w-full object-contain pixelated"
              style={{ imageRendering: "pixelated" }}
            />
            <div className="absolute top-4 left-4 bg-[#171820] border border-[#c2ed55] px-2 py-0.5 font-mono text-[10px] font-bold text-[#c2ed55]">
              REFERENCE IMAGE
            </div>
          </div>
        )}

        {/* 3x3 Tile Grid (Pure Swap Mode) */}
        <div className="relative z-10 grid grid-cols-3 grid-rows-3 gap-2 h-full w-full">
          {board.map((tileValue, gridIndex) => {
            const isCorrect = tileValue === gridIndex;
            const isSelected = selectedIdx === gridIndex;

            return (
              <button
                key={`tile-${gridIndex}-${tileValue}`}
                type="button"
                disabled={isAlreadyLocked || Boolean(successData)}
                onClick={() => handleSwapClick(gridIndex)}
                className={`relative group aspect-square w-full overflow-hidden border-2 border-[#171820] transition-transform select-none ${
                  isSelected
                    ? "ring-4 ring-[#e42c24] scale-[0.96] shadow-[2px_2px_0_#171820]"
                    : "shadow-[3px_3px_0_#171820] hover:-translate-y-0.5"
                } ${isCorrect ? "bg-white" : "bg-[#f7f7ed]"}`}
                style={{ imageRendering: "pixelated" }}
              >
                {tileUrls[tileValue] ? (
                  <img
                    src={tileUrls[tileValue]}
                    alt={`Piece ${tileValue + 1}`}
                    className="h-full w-full object-cover pixelated pointer-events-none"
                    style={{ imageRendering: "pixelated" }}
                  />
                ) : (
                  <div className="h-full w-full flex items-center justify-center font-mono font-black text-2xl text-[#171820]">
                    {tileValue + 1}
                  </div>
                )}

                <div
                  className={`absolute top-1 left-1 border border-[#171820] px-1 font-mono text-[9px] font-black leading-tight ${
                    isCorrect
                      ? "bg-[#c2ed55] text-[#171820]"
                      : "bg-[#f6d52b] text-[#171820]"
                  }`}
                >
                  #{tileValue + 1}
                </div>

                {isCorrect && (
                  <div className="absolute bottom-1 right-1 bg-[#171820] px-1 font-mono text-[8px] font-bold text-[#c2ed55]">
                    ✓
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {verifying && (
        <div className="flex items-center justify-center gap-2 border-2 border-[#171820] bg-[#f6d52b] p-3 font-mono text-xs font-bold text-[#171820]">
          <Sparkles className="h-4 w-4 animate-spin" />
          <span>VERIFYING COMPLETED 3×3 PUZZLE ON SERVER...</span>
        </div>
      )}

      {errorMsg && (
        <div className="flex items-start gap-2.5 border-2 border-[#171820] bg-[#e42c24] p-3 text-xs font-bold text-white shadow-[3px_3px_0_#171820]">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Exact Green Congratulations Banner */}
      <AnimatePresence>
        {successData && (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="border-2 border-[#171820] bg-[#c2ed55] p-6 shadow-[5px_5px_0_#171820]"
          >
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 border-2 border-[#171820] bg-[#171820] px-3 py-1 font-mono text-xs font-bold text-[#c2ed55]">
                  <Sparkles className="h-3.5 w-3.5" />
                  PUZZLE SOLVED &amp; VERIFIED
                </div>
                <h3 className="text-xl font-black text-[#171820]">
                  {successData.message}
                </h3>
                <p className="text-xs font-medium text-[#394127]">
                  Your claiming form below is now unlocked. Final GTD whitelist
                  allocation is confirmed only after you submit your claim and
                  an admin manually verifies all 5 social tasks.
                </p>
              </div>
              <CheckCircle2 className="h-11 w-11 shrink-0 text-[#171820]" />
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              <div className="border-2 border-[#171820] bg-[#f7f7ed] p-3">
                <div className="eyebrow text-[9px] text-[#535744]">
                  TWITTER/X
                </div>
                <div className="mt-1 font-mono text-xs font-bold text-[#171820]">
                  @{puzzle.displayUsername}
                </div>
              </div>
              <div className="border-2 border-[#171820] bg-[#f7f7ed] p-3">
                <div className="eyebrow text-[9px] text-[#535744]">
                  PUZZLE ID
                </div>
                <div className="mt-1 font-mono text-xs font-bold text-[#171820]">
                  {puzzle.puzzleId}
                </div>
              </div>
              <div className="border-2 border-[#171820] bg-[#f7f7ed] p-3">
                <div className="eyebrow text-[9px] text-[#535744]">
                  COMPLETED AT
                </div>
                <div className="mt-1 font-mono text-[11px] font-bold text-[#171820]">
                  {new Date(successData.completedAt).toLocaleString()}
                </div>
              </div>
              <div className="border-2 border-[#171820] bg-[#f6d52b] p-3">
                <div className="eyebrow text-[9px] text-[#171820]">
                  CAMPAIGN
                </div>
                <div className="mt-1 font-mono text-xs font-bold text-[#171820]">
                  {campaign.status} ({campaign.remainingSpots} left)
                </div>
              </div>
              <div className="border-2 border-[#171820] bg-[#f7f7ed] p-3">
                <div className="eyebrow text-[9px] text-[#535744]">
                  ELIGIBILITY
                </div>
                <div
                  className={`mt-1 font-mono text-xs font-black ${
                    successData.claimEligible
                      ? "text-[#171820]"
                      : "text-[#e42c24]"
                  }`}
                >
                  {successData.claimEligible ? "ELIGIBLE NOW" : "CAMPAIGN FULL"}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
