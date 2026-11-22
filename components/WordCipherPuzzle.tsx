"use client";

import { useEffect, useState, useRef } from "react";
import {
  RotateCcw,
  Sparkles,
  HelpCircle,
  Clock,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Trophy,
} from "lucide-react";

interface WordCipherPuzzleProps {
  onSolved?: (moves: number, timeSeconds: number) => void;
}

interface WordChallenge {
  word: string;
  clue: string;
  category: string;
}

const WORD_CHALLENGES: WordChallenge[] = [
  {
    word: "BUZQUITOS",
    clue: "The official character-driven 5,555 pixel-art PFP collection.",
    category: "COLLECTION",
  },
  {
    word: "ALLOWLIST",
    clue: "Guaranteed Token Distribution whitelist qualification status.",
    category: "WEB3 ACCESS",
  },
  {
    word: "BLOCKCHAIN",
    clue: "The immutable decentralized public ledger powering Web3.",
    category: "PROTOCOL",
  },
  {
    word: "ROBINHOOD",
    clue: "The primary blockchain network for the Buzquitos collection.",
    category: "NETWORK",
  },
  {
    word: "COMMUNITY",
    clue: "The foundation of Web3 culture, creators, and diamond hands.",
    category: "ECOSYSTEM",
  },
];

function shuffleWord(word: string): string[] {
  const letters = word.split("");
  let shuffled: string[];
  do {
    shuffled = [...letters];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
  } while (shuffled.join("") === word);
  return shuffled;
}

export function WordCipherPuzzle({ onSolved }: WordCipherPuzzleProps) {
  const [challengeIdx, setChallengeIdx] = useState(0);
  const challenge = WORD_CHALLENGES[challengeIdx];

  const [availableLetters, setAvailableLetters] = useState<
    Array<{ id: string; letter: string }>
  >([]);
  const [placedLetters, setPlacedLetters] = useState<
    Array<{ id: string; letter: string }>
  >([]);

  const [moves, setMoves] = useState(0);
  const [timeSeconds, setTimeSeconds] = useState(0);
  const [timerActive, setTimerActive] = useState(false);
  const [isSolved, setIsSolved] = useState(false);
  const [hintUsed, setHintUsed] = useState(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize letters
  useEffect(() => {
    const letters = shuffleWord(challenge.word);
    setAvailableLetters(
      letters.map((letter, idx) => ({ id: `letter-${idx}-${letter}`, letter }))
    );
    setPlacedLetters([]);
    setMoves(0);
    setTimeSeconds(0);
    setTimerActive(false);
    setIsSolved(false);
    setHintUsed(false);
  }, [challengeIdx]);

  // Timer Hook
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

  function handlePickLetter(letterObj: { id: string; letter: string }) {
    if (isSolved) return;
    if (!timerActive && moves === 0) setTimerActive(true);

    const nextAvailable = availableLetters.filter((x) => x.id !== letterObj.id);
    const nextPlaced = [...placedLetters, letterObj];

    setAvailableLetters(nextAvailable);
    setPlacedLetters(nextPlaced);
    const nextMoves = moves + 1;
    setMoves(nextMoves);

    // Check if full word matches
    const currentWord = nextPlaced.map((x) => x.letter).join("");
    if (currentWord.length === challenge.word.length) {
      if (currentWord === challenge.word) {
        setIsSolved(true);
        setTimerActive(false);
        onSolved?.(nextMoves, timeSeconds);
      }
    }
  }

  function handleRemoveLetter(index: number) {
    if (isSolved) return;
    const removed = placedLetters[index];
    const nextPlaced = placedLetters.filter((_, i) => i !== index);
    const nextAvailable = [...availableLetters, removed];

    setPlacedLetters(nextPlaced);
    setAvailableLetters(nextAvailable);
    setMoves((m) => m + 1);
  }

  function handleHint() {
    if (isSolved || hintUsed) return;
    // Place the next correct letter automatically
    const currentLen = placedLetters.length;
    const targetLetter = challenge.word[currentLen];

    const matchIdx = availableLetters.findIndex((x) => x.letter === targetLetter);
    if (matchIdx !== -1) {
      handlePickLetter(availableLetters[matchIdx]);
      setHintUsed(true);
    }
  }

  function handleReset() {
    const letters = shuffleWord(challenge.word);
    setAvailableLetters(
      letters.map((letter, idx) => ({ id: `letter-${idx}-${letter}`, letter }))
    );
    setPlacedLetters([]);
    setMoves(0);
    setTimeSeconds(0);
    setTimerActive(false);
    setIsSolved(false);
    setHintUsed(false);
  }

  function handleNextChallenge() {
    setChallengeIdx((prev) => (prev + 1) % WORD_CHALLENGES.length);
  }

  function formatTime(s: number): string {
    const min = Math.floor(s / 60);
    const sec = s % 60;
    return `${min.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
  }

  return (
    <div className="w-full max-w-xl mx-auto space-y-5">
      {/* HUD Header */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <div className="border-3 border-[#111111] bg-[#FEF3C7] p-3 shadow-[3px_3px_0_#111111] text-center">
          <div className="font-mono text-[10px] font-bold text-[#666666] uppercase">
            MOVES
          </div>
          <div className="mt-0.5 font-mono text-xl sm:text-2xl font-black text-[#111111]">
            {moves}
          </div>
        </div>

        <div className="border-3 border-[#111111] bg-[#FEF3C7] p-3 shadow-[3px_3px_0_#111111] text-center">
          <div className="font-mono text-[10px] font-bold text-[#666666] uppercase flex items-center justify-center gap-1">
            <Clock className="h-3 w-3" />
            <span>TIME</span>
          </div>
          <div className="mt-0.5 font-mono text-xl sm:text-2xl font-black text-[#111111]">
            {formatTime(timeSeconds)}
          </div>
        </div>

        <div className="border-3 border-[#111111] bg-[#FEF3C7] p-3 shadow-[3px_3px_0_#111111] text-center col-span-2">
          <div className="flex items-center justify-between font-mono text-[10px] font-bold text-[#666666]">
            <span>CIPHER PROGRESS</span>
            <span className="text-[#111111] font-black">
              {placedLetters.length}/{challenge.word.length} LETTERS
            </span>
          </div>
          <div className="mt-2 h-3.5 border-2 border-[#111111] bg-white overflow-hidden p-0.5">
            <div
              className="h-full bg-[#FACC15] transition-all duration-300"
              style={{
                width: `${(placedLetters.length / challenge.word.length) * 100}%`,
              }}
            />
          </div>
        </div>
      </div>

      {/* Clue Box */}
      <div className="border-3 border-[#111111] bg-white p-4 shadow-[4px_4px_0_#111111]">
        <div className="flex items-center justify-between border-b border-[#111111]/15 pb-2">
          <span className="border-2 border-[#111111] bg-[#B8E643] px-2.5 py-0.5 font-mono text-[10px] font-bold">
            CIPHER CATEGORY: {challenge.category}
          </span>
          <span className="font-mono text-xs font-bold text-[#666666]">
            WORD #{challengeIdx + 1} OF {WORD_CHALLENGES.length}
          </span>
        </div>
        <p className="mt-2 text-sm font-bold text-[#111111] leading-relaxed">
          &ldquo;{challenge.clue}&rdquo;
        </p>
      </div>

      {/* Solution Slots */}
      <div className="border-4 border-[#111111] bg-[#B8E643] p-5 shadow-[6px_6px_0_#111111]">
        <div className="text-center font-mono text-xs font-bold text-[#111111] mb-3">
          ASSEMBLE THE DECRYPTED WORD:
        </div>

        <div className="flex flex-wrap items-center justify-center gap-2">
          {Array.from({ length: challenge.word.length }).map((_, idx) => {
            const placed = placedLetters[idx];
            return (
              <button
                key={`slot-${idx}`}
                type="button"
                onClick={() => placed && handleRemoveLetter(idx)}
                className={`h-11 w-11 sm:h-12 sm:w-12 border-3 border-[#111111] font-mono text-lg sm:text-xl font-black shadow-[3px_3px_0_#111111] transition-transform ${
                  placed
                    ? isSolved
                      ? "bg-[#111111] text-[#B8E643] scale-105"
                      : "bg-[#FEF3C7] text-[#111111] hover:bg-[#e42c24] hover:text-white cursor-pointer active:scale-95"
                    : "bg-white/70 border-dashed text-transparent"
                }`}
                title={placed ? "Click to remove letter" : "Empty slot"}
              >
                {placed ? placed.letter : "_"}
              </button>
            );
          })}
        </div>

        {isSolved && (
          <div className="mt-4 flex items-center justify-center gap-2 border-2 border-[#111111] bg-[#111111] p-2.5 text-center font-mono text-xs font-bold text-[#B8E643] shadow-[3px_3px_0_#FACC15]">
            <Trophy className="h-4 w-4 text-[#FACC15]" />
            <span>WORD DECRYPTED SUCCESSFULLY! GTD UNLOCKED!</span>
          </div>
        )}
      </div>

      {/* Available Letter Tiles */}
      <div className="border-3 border-[#111111] bg-[#FEF3C7] p-5 shadow-[4px_4px_0_#111111]">
        <div className="text-center font-mono text-xs font-bold text-[#666666] mb-3">
          AVAILABLE SCRAMBLED LETTER TILES (CLICK TO INSERT):
        </div>

        <div className="flex flex-wrap items-center justify-center gap-2 min-h-[50px]">
          {availableLetters.length > 0 ? (
            availableLetters.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => handlePickLetter(item)}
                className="h-11 w-11 sm:h-12 sm:w-12 border-3 border-[#111111] bg-white font-mono text-lg sm:text-xl font-black text-[#111111] shadow-[3px_3px_0_#111111] transition-all hover:-translate-y-1 hover:bg-[#FACC15] active:translate-y-0"
              >
                {item.letter}
              </button>
            ))
          ) : (
            <span className="font-mono text-xs font-bold text-[#888888]">
              All letters placed! Click a slot above to remove any letter.
            </span>
          )}
        </div>
      </div>

      {/* Control Actions */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={hintUsed || isSolved}
            onClick={handleHint}
            className={`flex items-center gap-1.5 border-2 border-[#111111] px-3.5 py-2 font-mono text-xs font-bold shadow-[2px_2px_0_#111111] transition ${
              hintUsed || isSolved
                ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                : "bg-[#FACC15] text-[#111111] hover:bg-[#B8E643]"
            }`}
          >
            <HelpCircle className="h-3.5 w-3.5" />
            <span>{hintUsed ? "HINT USED" : "REVEAL 1 LETTER"}</span>
          </button>

          <button
            type="button"
            onClick={handleReset}
            className="flex items-center gap-1.5 border-2 border-[#111111] bg-white px-3.5 py-2 font-mono text-xs font-bold text-[#111111] shadow-[2px_2px_0_#111111] transition hover:bg-[#FEF3C7]"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>RESET</span>
          </button>
        </div>

        <button
          type="button"
          onClick={handleNextChallenge}
          className="flex items-center gap-1.5 border-2 border-[#111111] bg-[#111111] px-3.5 py-2 font-mono text-xs font-bold text-[#B8E643] shadow-[2px_2px_0_#B8E643] transition hover:bg-black"
        >
          <span>NEXT WORD</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
