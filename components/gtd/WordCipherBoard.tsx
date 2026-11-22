"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  RotateCcw,
  Sparkles,
  HelpCircle,
  Clock,
  CheckCircle2,
  AlertCircle,
  Trophy,
} from "lucide-react";
import type { CampaignSnapshot, ClientPuzzle } from "@/types/gtd";

interface WordCipherBoardProps {
  puzzle: ClientPuzzle;
  campaign: CampaignSnapshot;
  onSolved: (data: {
    completedAt: string;
    message: string;
    campaign: CampaignSnapshot;
    claimEligible: boolean;
  }) => void;
  onSwitchPuzzle?: (type: "image_3x3" | "math_3x3") => void;
}

export function WordCipherBoard({
  puzzle,
  campaign,
  onSolved,
  onSwitchPuzzle,
}: WordCipherBoardProps) {
  const isAlreadyLocked =
    puzzle.status === "COMPLETED" || puzzle.status === "SUBMITTED";

  const challenge = puzzle.wordChallenge ?? {
    clue: "The official character-driven 5,555 pixel-art PFP collection.",
    category: "COLLECTION",
    length: 9,
    scrambled: ["Q", "U", "I", "T", "B", "Z", "S", "O", "O"],
  };

  const [availableLetters, setAvailableLetters] = useState<
    Array<{ id: string; letter: string }>
  >(() => {
    if (isAlreadyLocked) return [];
    return challenge.scrambled.map((l, i) => ({
      id: `letter-${i}-${l}`,
      letter: l.toUpperCase(),
    }));
  });

  const [placedLetters, setPlacedLetters] = useState<
    Array<{ id: string; letter: string }>
  >(() => {
    if (isAlreadyLocked) {
      return challenge.scrambled.map((l, i) => ({
        id: `placed-${i}-${l}`,
        letter: l.toUpperCase(),
      }));
    }
    return [];
  });

  const [moves, setMoves] = useState(0);
  const [timeSeconds, setTimeSeconds] = useState(0);
  const [timerActive, setTimerActive] = useState(false);
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

  const verifyWord = useCallback(
    async (wordStr: string) => {
      if (isAlreadyLocked || verifying) return;
      setVerifying(true);
      setErrorMsg(null);

      try {
        const res = await fetch("/api/gtd/puzzle/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            puzzleId: puzzle.puzzleId,
            submittedWord: wordStr,
          }),
        });

        const data = await res.json();

        if (!res.ok) {
          setErrorMsg(data.error || "Incorrect word sequence. Try rearranging.");
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
        setErrorMsg("Network error verifying word solution. Please try again.");
      } finally {
        setVerifying(false);
      }
    },
    [puzzle.puzzleId, isAlreadyLocked, verifying, campaign, onSolved]
  );

  function handlePickLetter(item: { id: string; letter: string }) {
    if (successData || isAlreadyLocked) return;
    if (!timerActive && moves === 0) setTimerActive(true);

    const nextAvailable = availableLetters.filter((x) => x.id !== item.id);
    const nextPlaced = [...placedLetters, item];

    setAvailableLetters(nextAvailable);
    setPlacedLetters(nextPlaced);
    const nextMoves = moves + 1;
    setMoves(nextMoves);
    setErrorMsg(null);

    if (nextPlaced.length === challenge.length) {
      const fullWord = nextPlaced.map((x) => x.letter).join("");
      verifyWord(fullWord);
    }
  }

  function handleRemoveLetter(index: number) {
    if (successData || isAlreadyLocked) return;
    const removed = placedLetters[index];
    const nextPlaced = placedLetters.filter((_, i) => i !== index);
    const nextAvailable = [...availableLetters, removed];

    setPlacedLetters(nextPlaced);
    setAvailableLetters(nextAvailable);
    setMoves((m) => m + 1);
    setErrorMsg(null);
  }

  function handleReset() {
    if (isAlreadyLocked) return;
    setAvailableLetters(
      challenge.scrambled.map((l, i) => ({
        id: `letter-${i}-${l}`,
        letter: l.toUpperCase(),
      }))
    );
    setPlacedLetters([]);
    setMoves(0);
    setTimeSeconds(0);
    setTimerActive(false);
    setErrorMsg(null);
  }

  function formatTime(s: number): string {
    const min = Math.floor(s / 60);
    const sec = s % 60;
    return `${min.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
  }

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
            <span>CIPHER PROGRESS</span>
            <span className="font-bold text-[#171820]">
              {placedLetters.length}/{challenge.length} LETTERS
            </span>
          </div>
          <div className="mt-2 h-3 border-2 border-[#171820] bg-white p-0.5 overflow-hidden">
            <div
              className="h-full bg-[#f6d52b] transition-all duration-300"
              style={{
                width: `${(placedLetters.length / challenge.length) * 100}%`,
              }}
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
            onClick={() => onSwitchPuzzle?.("image_3x3")}
            className="flex items-center justify-center gap-2 border-2 border-[#171820] bg-white py-2 px-3 font-mono text-xs font-black text-[#171820] hover:bg-[#c2ed55] shadow-[2px_2px_0_#171820] transition active:translate-y-0.5"
          >
            <span>SWITCH TO: 🖼️ 3×3 NFT PIXEL TILE</span>
          </button>
          <button
            type="button"
            onClick={() => onSwitchPuzzle?.("math_3x3")}
            className="flex items-center justify-center gap-2 border-2 border-[#171820] bg-white py-2 px-3 font-mono text-xs font-black text-[#171820] hover:bg-[#f6d52b] shadow-[2px_2px_0_#171820] transition active:translate-y-0.5"
          >
            <span>SWITCH TO: 🔢 3×3 MATH GRID (Σ=15)</span>
          </button>
        </div>
      </div>

      {/* Clue box */}
      <div className="border-2 border-[#171820] bg-white p-4 shadow-[4px_4px_0_#171820]">
        <div className="flex items-center justify-between border-b border-[#171820]/15 pb-2">
          <span className="border border-[#171820] bg-[#c2ed55] px-2 py-0.5 font-mono text-[10px] font-bold text-[#171820]">
            CIPHER CLUE · {challenge.category}
          </span>
          <span className="font-mono text-xs font-bold text-[#535744]">
            TARGET: {challenge.length} LETTERS
          </span>
        </div>
        <p className="mt-2 text-sm font-bold text-[#171820] leading-relaxed">
          &ldquo;{challenge.clue}&rdquo;
        </p>
      </div>

      {/* Main Solution Area with Repeating Watermark */}
      <div className="relative border-4 border-[#171820] bg-[#c2ed55] p-6 shadow-[6px_6px_0_#171820] overflow-hidden">
        {/* Semi-transparent repeating watermark */}
        <div
          className="pointer-events-none absolute inset-0 z-0 flex flex-wrap content-around justify-around opacity-20 select-none overflow-hidden"
          aria-hidden="true"
        >
          {Array.from({ length: 12 }).map((_, i) => (
            <span
              key={i}
              className="rotate-[-22deg] font-mono text-sm sm:text-base font-black text-[#171820] whitespace-nowrap p-3"
            >
              {watermarkText}
            </span>
          ))}
        </div>

        <div className="relative z-10">
          <div className="text-center font-mono text-xs font-bold text-[#171820] mb-3">
            ASSEMBLE THE DECRYPTED WORD SEQUENCE:
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2">
            {Array.from({ length: challenge.length }).map((_, idx) => {
              const placed = placedLetters[idx];
              return (
                <button
                  key={`slot-${idx}`}
                  type="button"
                  disabled={isAlreadyLocked || Boolean(successData)}
                  onClick={() => placed && handleRemoveLetter(idx)}
                  className={`h-11 w-11 sm:h-13 sm:w-13 border-2 border-[#171820] font-mono text-lg sm:text-xl font-black shadow-[3px_3px_0_#171820] transition-transform ${
                    placed
                      ? successData
                        ? "bg-[#171820] text-[#c2ed55] scale-105"
                        : "bg-[#f7f7ed] text-[#171820] hover:bg-[#e42c24] hover:text-white cursor-pointer active:scale-95"
                      : "bg-white/80 border-dashed text-transparent"
                  }`}
                  title={placed ? "Click to remove letter" : "Empty slot"}
                >
                  {placed ? placed.letter : "_"}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Scrambled letter tiles */}
      {!isAlreadyLocked && !successData && (
        <div className="border-2 border-[#171820] bg-[#f7f7ed] p-5 shadow-[4px_4px_0_#171820]">
          <div className="flex items-center justify-between mb-3">
            <span className="font-mono text-xs font-bold text-[#535744]">
              AVAILABLE SCRAMBLED TILES (CLICK TO INSERT):
            </span>
            <button
              type="button"
              onClick={handleReset}
              className="flex items-center gap-1 border border-[#171820] bg-white px-2.5 py-1 font-mono text-xs font-bold hover:bg-[#f6d52b]"
            >
              <RotateCcw className="h-3 w-3" />
              <span>RESET</span>
            </button>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2 min-h-[50px]">
            {availableLetters.length > 0 ? (
              availableLetters.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handlePickLetter(item)}
                  className="h-11 w-11 sm:h-12 sm:w-12 border-2 border-[#171820] bg-white font-mono text-lg sm:text-xl font-black text-[#171820] shadow-[3px_3px_0_#171820] transition-all hover:-translate-y-1 hover:bg-[#f6d52b] active:translate-y-0"
                >
                  {item.letter}
                </button>
              ))
            ) : (
              <span className="font-mono text-xs font-bold text-[#666666]">
                All letters placed! Click a slot above to remove any letter.
              </span>
            )}
          </div>
        </div>
      )}

      {verifying && (
        <div className="flex items-center justify-center gap-2 border-2 border-[#171820] bg-[#f6d52b] p-3 font-mono text-xs font-bold text-[#171820]">
          <Sparkles className="h-4 w-4 animate-spin" />
          <span>VERIFYING WORD CIPHER ON SERVER...</span>
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
                  Your claiming form below is now unlocked. Final GTD whitelist allocation
                  is confirmed only after you submit your claim and an admin manually
                  verifies all 5 social tasks.
                </p>
              </div>
              <CheckCircle2 className="h-11 w-11 shrink-0 text-[#171820]" />
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              <div className="border-2 border-[#171820] bg-[#f7f7ed] p-3">
                <div className="eyebrow text-[9px] text-[#535744]">TWITTER/X</div>
                <div className="mt-1 font-mono text-xs font-bold text-[#171820]">
                  @{puzzle.displayUsername}
                </div>
              </div>
              <div className="border-2 border-[#171820] bg-[#f7f7ed] p-3">
                <div className="eyebrow text-[9px] text-[#535744]">PUZZLE ID</div>
                <div className="mt-1 font-mono text-xs font-bold text-[#171820]">
                  {puzzle.puzzleId}
                </div>
              </div>
              <div className="border-2 border-[#171820] bg-[#f7f7ed] p-3">
                <div className="eyebrow text-[9px] text-[#535744]">COMPLETED AT</div>
                <div className="mt-1 font-mono text-[11px] font-bold text-[#171820]">
                  {new Date(successData.completedAt).toLocaleString()}
                </div>
              </div>
              <div className="border-2 border-[#171820] bg-[#f6d52b] p-3">
                <div className="eyebrow text-[9px] text-[#171820]">CAMPAIGN</div>
                <div className="mt-1 font-mono text-xs font-bold text-[#171820]">
                  {campaign.status} ({campaign.remainingSpots} left)
                </div>
              </div>
              <div className="border-2 border-[#171820] bg-[#f7f7ed] p-3">
                <div className="eyebrow text-[9px] text-[#535744]">ELIGIBILITY</div>
                <div
                  className={`mt-1 font-mono text-xs font-black ${
                    successData.claimEligible ? "text-[#171820]" : "text-[#e42c24]"
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
