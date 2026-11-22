"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  Grid3X3,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  Lock,
  Image as ImageIcon,
  Calculator,
  KeyRound,
  RotateCcw,
} from "lucide-react";
import type {
  CampaignSnapshot,
  ClientPuzzle,
  ClientSubmissionSummary,
  PuzzleType,
} from "@/types/gtd";
import { LiveCampaignBanner } from "@/components/gtd/LiveCampaignBanner";
import { PuzzleBoard } from "@/components/gtd/PuzzleBoard";
import { ImagePuzzleBoard } from "@/components/gtd/ImagePuzzleBoard";
import { WordCipherBoard } from "@/components/gtd/WordCipherBoard";
import { ClaimForm } from "@/components/gtd/ClaimForm";

interface ChallengeWorkspaceProps {
  initialCampaign: CampaignSnapshot;
  initialPuzzleType?: PuzzleType;
}

export function ChallengeWorkspace({
  initialCampaign,
  initialPuzzleType = "image_3x3",
}: ChallengeWorkspaceProps) {
  const [campaign, setCampaign] = useState<CampaignSnapshot>(initialCampaign);
  const [usernameInput, setUsernameInput] = useState("");
  const [selectedType, setSelectedType] = useState<PuzzleType>(initialPuzzleType);
  const [puzzle, setPuzzle] = useState<ClientPuzzle | null>(null);
  const [submission, setSubmission] = useState<ClientSubmissionSummary | null>(null);
  const [loadingSession, setLoadingSession] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [alreadySubmittedCode, setAlreadySubmittedCode] = useState<string | null>(null);

  // Sync initialPuzzleType if prop changes and no active puzzle
  useEffect(() => {
    if (initialPuzzleType && !puzzle) {
      setSelectedType(initialPuzzleType);
    }
  }, [initialPuzzleType, puzzle]);

  const refreshSession = useCallback(async () => {
    try {
      const res = await fetch("/api/gtd/puzzle/current", { cache: "no-store" });
      if (!res.ok) return;
      const data = await res.json();
      if (data.campaign) setCampaign(data.campaign);
      if (data.puzzle) {
        setPuzzle(data.puzzle);
        setUsernameInput(data.puzzle.displayUsername);
        if (data.puzzle.puzzleType) {
          setSelectedType(data.puzzle.puzzleType);
        }
      } else {
        setPuzzle(null);
      }
      if (data.submission) {
        setSubmission(data.submission);
      } else {
        setSubmission(null);
      }
    } finally {
      setLoadingSession(false);
    }
  }, []);

  useEffect(() => {
    refreshSession();
    const interval = setInterval(async () => {
      try {
        const res = await fetch("/api/gtd/campaign", { cache: "no-store" });
        if (res.ok) {
          const data = await res.json();
          if (data.campaign) setCampaign(data.campaign);
        }
      } catch {
        // Silent background poll retry
      }
    }, 15000);
    return () => clearInterval(interval);
  }, [refreshSession]);

  async function handleGeneratePuzzle(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg(null);
    setAlreadySubmittedCode(null);

    if (campaign.status === "PAUSED") {
      setErrorMsg("Campaign is currently paused by admin. Submissions will reopen shortly.");
      return;
    }

    const cleaned = usernameInput.trim().replace(/^@+/, "");
    if (!cleaned) {
      setErrorMsg("Please enter your Twitter/X username first.");
      return;
    }

    setGenerating(true);
    try {
      const res = await fetch("/api/gtd/puzzle/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          twitterUsername: cleaned,
          puzzleType: selectedType === "math_9x9" ? "math_3x3" : selectedType,
          gridSize: 3,
          switchType: true,
          forceNew: true,
        }),
      });
      const data = await res.json();
      if (data.campaign) setCampaign(data.campaign);

      if (!res.ok) {
        setErrorMsg(data.error || "Unable to generate personalized puzzle.");
        if (data.code === "ALREADY_SUBMITTED" && data.submission?.submissionCode) {
          setAlreadySubmittedCode(data.submission.submissionCode);
        }
        return;
      }

      setPuzzle(data.puzzle);
    } catch {
      setErrorMsg("Network error while generating your puzzle. Please try again.");
    } finally {
      setGenerating(false);
    }
  }

  async function handleDirectSwitchAndGenerate(targetType: PuzzleType) {
    const rawUser = (usernameInput || puzzle?.displayUsername || "").trim().replace(/^@+/, "");
    setSelectedType(targetType);
    if (!rawUser) {
      setPuzzle(null);
      return;
    }
    setGenerating(true);
    setErrorMsg(null);
    try {
      const res = await fetch("/api/gtd/puzzle/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          twitterUsername: rawUser,
          puzzleType: targetType,
          gridSize: 3,
          switchType: true,
          forceNew: true,
        }),
      });
      const data = await res.json();
      if (data.campaign) setCampaign(data.campaign);
      if (res.ok && data.puzzle) {
        setPuzzle(data.puzzle);
        if (data.puzzle.puzzleType) {
          setSelectedType(data.puzzle.puzzleType);
        }
      } else {
        setErrorMsg(data.error || "Unable to switch puzzle.");
      }
    } catch {
      setErrorMsg("Network error switching puzzle.");
    } finally {
      setGenerating(false);
    }
  }

  const isPaused = campaign.status === "PAUSED";

  const activeType: PuzzleType = puzzle
    ? (puzzle.puzzleType ||
      (puzzle.category === "image"
        ? "image_3x3"
        : puzzle.category === "word"
        ? "word_cipher"
        : "math_3x3"))
    : selectedType;

  const handleArenaCardClick = (targetType: PuzzleType) => {
    setSelectedType(targetType);
    const rawUser = (usernameInput || puzzle?.displayUsername || "").trim().replace(/^@+/, "");
    if (rawUser && (!puzzle || puzzle.status !== "SUBMITTED")) {
      handleDirectSwitchAndGenerate(targetType);
    }
  };

  const puzzleTypeName = puzzle
    ? puzzle.category === "image"
      ? "3×3 NFT Tile Pixel Art"
      : puzzle.category === "word"
      ? "Web3 Word Cipher"
      : "3×3 Mathematical Grid (Target Sum 15)"
    : "";

  return (
    <div>
      <LiveCampaignBanner campaign={campaign} />

      <section id="challenge" className="section-wrap py-14 sm:py-20">
        {/* PAUSED NOTICE */}
        {isPaused && (
          <div className="mb-8 border-4 border-[#171820] bg-[#f6d52b] p-5 shadow-[6px_6px_0_#171820]">
            <div className="flex items-start gap-3.5">
              <AlertTriangle className="h-6 w-6 shrink-0 text-[#171820] mt-0.5" />
              <div>
                <h4 className="font-mono text-sm sm:text-base font-black text-[#171820] uppercase">
                  CAMPAIGN CURRENTLY PAUSED BY ADMIN
                </h4>
                <p className="mt-1 text-xs font-semibold text-[#171820]/80">
                  The whitelist puzzle challenge is temporarily paused while dev reviews and audits take place. Existing submissions remain safely recorded. Solvers can check their status anytime below.
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="eyebrow mb-2 text-[#465032]">
              THE ENTRY POINT / 003
            </div>
            <h2 className="pixel-title text-3xl sm:text-5xl font-black text-[#171820]">
              YOUR PERSONALIZED{" "}
              <span className="text-[#e42c24]">GTD CHALLENGE.</span>
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-2 font-mono text-[11px] font-bold">
            <span
              className={`border-2 border-[#171820] px-3 py-1 ${
                puzzle ? "bg-[#171820] text-[#c2ed55]" : "bg-[#f6d52b] text-[#171820]"
              }`}
            >
              01. @USERNAME
            </span>
            <span
              className={`border-2 border-[#171820] px-3 py-1 ${
                puzzle?.status === "COMPLETED" || puzzle?.status === "SUBMITTED"
                  ? "bg-[#171820] text-[#c2ed55]"
                  : puzzle
                    ? "bg-[#f6d52b] text-[#171820]"
                    : "bg-[#f7f7ed] text-[#535744]"
              }`}
            >
              02. SOLVE PUZZLE
            </span>
            <span
              className={`border-2 border-[#171820] px-3 py-1 ${
                submission
                  ? "bg-[#171820] text-[#c2ed55]"
                  : puzzle?.status === "COMPLETED"
                    ? "bg-[#f6d52b] text-[#171820]"
                    : "bg-[#f7f7ed] text-[#535744]"
              }`}
            >
              03. CLAIM SPOT
            </span>
          </div>
        </div>

        {/* 3 GTD PUZZLE ARENA SELECTOR (ALWAYS VISIBLE & PROMINENT) */}
        <div className="mb-8">
          <div className="eyebrow mb-3 text-[11px] font-bold text-[#535744]">
            SELECT YOUR PUZZLE ARENA (ANY PUZZLE QUALIFIES FOR GTD WHITELIST):
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {/* Arena 1: 3x3 NFT Tile */}
            <button
              type="button"
              disabled={generating}
              onClick={() => handleArenaCardClick("image_3x3")}
              className={`flex items-center gap-3.5 border-3 border-[#171820] p-4 text-left transition-all ${
                activeType === "image_3x3"
                  ? "bg-[#c2ed55] shadow-[5px_5px_0_#171820] -translate-y-1"
                  : "bg-white hover:bg-[#f7f7ed] shadow-[3px_3px_0_#171820]"
              }`}
            >
              <div
                className={`flex h-12 w-12 shrink-0 items-center justify-center border-2 border-[#171820] ${
                  activeType === "image_3x3"
                    ? "bg-[#171820] text-[#c2ed55]"
                    : "bg-[#f6d52b] text-[#171820]"
                }`}
              >
                <ImageIcon className="h-6 w-6" />
              </div>
              <div>
                <div className="font-mono text-[10px] font-black uppercase text-[#e42c24]">
                  PUZZLE 01 · VISUAL
                </div>
                <div className="text-base font-black text-[#171820]">
                  3×3 NFT Tile Puzzle
                </div>
                <div className="font-mono text-[11px] text-[#555555]">
                  Character art · Tile Swap
                </div>
              </div>
            </button>

            {/* Arena 2: Math Grid */}
            <button
              type="button"
              disabled={generating}
              onClick={() => handleArenaCardClick("math_3x3")}
              className={`flex items-center gap-3.5 border-3 border-[#171820] p-4 text-left transition-all ${
                activeType === "math_3x3"
                  ? "bg-[#f6d52b] shadow-[5px_5px_0_#171820] -translate-y-1"
                  : "bg-white hover:bg-[#f7f7ed] shadow-[3px_3px_0_#171820]"
              }`}
            >
              <div
                className={`flex h-12 w-12 shrink-0 items-center justify-center border-2 border-[#171820] ${
                  activeType === "math_3x3"
                    ? "bg-[#171820] text-[#f6d52b]"
                    : "bg-[#c2ed55] text-[#171820]"
                }`}
              >
                <Calculator className="h-6 w-6" />
              </div>
              <div>
                <div className="font-mono text-[10px] font-black uppercase text-[#e42c24]">
                  PUZZLE 02 · MATH
                </div>
                <div className="text-base font-black text-[#171820]">
                  3×3 Mathematical Grid
                </div>
                <div className="font-mono text-[11px] text-[#555555]">
                  Magic Square · Target Σ = 15
                </div>
              </div>
            </button>

            {/* Arena 3: Word Cipher */}
            <button
              type="button"
              disabled={generating}
              onClick={() => handleArenaCardClick("word_cipher")}
              className={`flex items-center gap-3.5 border-3 border-[#171820] p-4 text-left transition-all ${
                activeType === "word_cipher"
                  ? "bg-[#f7f7ed] shadow-[5px_5px_0_#171820] -translate-y-1 ring-3 ring-[#171820]"
                  : "bg-white hover:bg-[#f7f7ed] shadow-[3px_3px_0_#171820]"
              }`}
            >
              <div
                className={`flex h-12 w-12 shrink-0 items-center justify-center border-2 border-[#171820] ${
                  activeType === "word_cipher"
                    ? "bg-[#171820] text-[#f7f7ed]"
                    : "bg-[#e42c24] text-white"
                }`}
              >
                <KeyRound className="h-6 w-6" />
              </div>
              <div>
                <div className="font-mono text-[10px] font-black uppercase text-[#e42c24]">
                  PUZZLE 03 · CIPHER
                </div>
                <div className="text-base font-black text-[#171820]">
                  Web3 Word Cipher
                </div>
                <div className="font-mono text-[11px] text-[#555555]">
                  Scrambled Web3 Anagram
                </div>
              </div>
            </button>
          </div>
        </div>

        <div className="space-y-8">
          {/* STEP 1: PERSONALIZE */}
          <div className="card p-6 sm:p-8">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-lg sm:text-xl font-black text-[#171820]">
                  STEP 1: PERSONALIZE WITH YOUR TWITTER/X USERNAME
                </h3>
                <p className="mt-1 text-xs font-medium text-[#535744]">
                  Generates a unique, watermarked puzzle permanently bound to your
                  username and session.
                </p>
              </div>
              {puzzle && (
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 border-2 border-[#171820] bg-[#f6d52b] px-3 py-1 font-mono text-xs font-bold text-[#171820]">
                    <Lock className="h-3.5 w-3.5" />
                    BOUND TO @{puzzle.displayUsername.toUpperCase()}
                  </span>
                  {puzzle.status !== "SUBMITTED" && (
                    <button
                      type="button"
                      onClick={() => setPuzzle(null)}
                      className="border-2 border-[#171820] bg-white px-2.5 py-1 font-mono text-xs font-bold hover:bg-[#f7f7ed]"
                    >
                      SWITCH PUZZLE
                    </button>
                  )}
                </div>
              )}
            </div>

            {loadingSession ? (
              <div className="mt-5 h-14 animate-pulse border-2 border-[#171820]/20 bg-white" />
            ) : puzzle ? (
              <div className="mt-5 flex flex-wrap items-center justify-between gap-4 border-2 border-[#171820] bg-[#c2ed55] px-4 py-3.5 text-xs font-semibold text-[#171820]">
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                  <span>
                    Active puzzle <strong className="font-mono">{puzzle.puzzleId}</strong> is
                    personalized for{" "}
                    <strong className="font-mono">@{puzzle.displayUsername}</strong> (
                    {puzzleTypeName}).
                  </span>
                </div>
              </div>
            ) : (
              <form onSubmit={handleGeneratePuzzle} className="mt-6 space-y-4">
                {/* Username Input and Generate Button */}
                <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
                  <div className="relative flex items-center border-2 border-[#171820] bg-white shadow-[3px_3px_0_#171820]">
                    <span className="flex h-full items-center justify-center border-r-2 border-[#171820] bg-[#f6d52b] px-3.5 font-mono text-sm font-black text-[#171820]">
                      @
                    </span>
                    <input
                      type="text"
                      required
                      maxLength={20}
                      placeholder="Enter Twitter/X username (e.g. username)"
                      value={usernameInput.replace(/^@+/, "")}
                      onChange={(e) => setUsernameInput(e.target.value)}
                      disabled={generating || isPaused || campaign.remainingSpots <= 0}
                      className="w-full bg-transparent px-3 py-3 font-mono text-sm font-bold text-[#171820] outline-none placeholder:text-[#171820]/40"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={generating || isPaused || campaign.remainingSpots <= 0}
                    className="pixel-btn !py-3 !px-6 text-xs sm:text-sm"
                  >
                    <Sparkles className="h-4 w-4" />
                    {generating
                      ? "GENERATING..."
                      : isPaused
                      ? "CAMPAIGN PAUSED"
                      : "GENERATE PUZZLE"}
                  </button>
                </div>
              </form>
            )}

            {errorMsg && (
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-2 border-[#171820] bg-[#e42c24] p-4 text-xs font-bold text-white shadow-[4px_4px_0_#171820]">
                <div className="flex items-start gap-2.5">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
                {alreadySubmittedCode && (
                  <Link
                    href={`/puzzle/status?q=${encodeURIComponent(alreadySubmittedCode)}`}
                    className="inline-flex items-center gap-1 border-2 border-[#171820] bg-[#f6d52b] px-3 py-1.5 font-mono text-xs font-bold text-[#171820]"
                  >
                    VIEW STATUS
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                )}
              </div>
            )}
          </div>

          {/* STEP 2: SOLVE WATERMARKED PUZZLE */}
          {puzzle && (
            <div className="card p-6 sm:p-8">
              <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="text-lg sm:text-xl font-black text-[#171820]">
                    {puzzle.category === "image"
                      ? "STEP 2: SOLVE YOUR WATERMARKED 3×3 NFT TILE PUZZLE"
                      : puzzle.category === "word"
                      ? "STEP 2: SOLVE YOUR WATERMARKED WEB3 WORD CIPHER"
                      : "STEP 2: SOLVE YOUR WATERMARKED MATHEMATICAL PUZZLE"}
                  </h3>
                  <p className="mt-1 text-xs font-medium text-[#535744]">
                    {puzzle.category === "image"
                      ? "Restore the character by swapping the 9 tiles into their correct positions. Click Shuffle to generate a new solvable image shuffle."
                      : puzzle.category === "word"
                      ? "Decipher the scrambled Web3 keyword by placing the letter tiles in the correct sequence."
                      : `Fill every empty cell using each number from 1 to 9 exactly once so every horizontal row and vertical column sums to exactly 15.`}
                  </p>
                </div>
              </div>

              {puzzle.category === "image" ? (
                <ImagePuzzleBoard
                  puzzle={puzzle}
                  campaign={campaign}
                  onSwitchPuzzle={handleDirectSwitchAndGenerate}
                  onSolved={({ completedAt, campaign: nextCampaign }) => {
                    setCampaign(nextCampaign);
                    setPuzzle((prev) =>
                      prev ? { ...prev, status: "COMPLETED", completedAt } : null
                    );
                  }}
                />
              ) : puzzle.category === "word" ? (
                <WordCipherBoard
                  puzzle={puzzle}
                  campaign={campaign}
                  onSwitchPuzzle={handleDirectSwitchAndGenerate}
                  onSolved={({ completedAt, campaign: nextCampaign }) => {
                    setCampaign(nextCampaign);
                    setPuzzle((prev) =>
                      prev ? { ...prev, status: "COMPLETED", completedAt } : null
                    );
                  }}
                />
              ) : (
                <PuzzleBoard
                  puzzle={puzzle}
                  campaign={campaign}
                  onSwitchPuzzle={handleDirectSwitchAndGenerate}
                  onSolved={({ completedAt, campaign: nextCampaign }) => {
                    setCampaign(nextCampaign);
                    setPuzzle((prev) =>
                      prev ? { ...prev, status: "COMPLETED", completedAt } : null
                    );
                  }}
                />
              )}
            </div>
          )}

          {/* STEP 3: CLAIM FORM */}
          <ClaimForm
            puzzle={puzzle}
            campaign={campaign}
            existingSubmission={submission}
            onClaimSubmitted={({ submission: sub, campaign: nextCampaign }) => {
              setSubmission(sub);
              setCampaign(nextCampaign);
              setPuzzle((prev) => (prev ? { ...prev, status: "SUBMITTED" } : null));
            }}
          />
        </div>
      </section>
    </div>
  );
}
