"use client";

import { useEffect, useState } from "react";
import confetti from "canvas-confetti";
import {
  Trophy,
  CheckCircle2,
  Share2,
  Clock,
  RotateCcw,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  X,
  Wallet,
} from "lucide-react";
import { truncateAddress } from "./WalletConnect";

interface GtdModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPlayAgain: () => void;
  moves: number;
  timeSeconds: number;
  walletAddress: string | null;
  onConnectWallet?: () => void;
  targetImageSrc?: string;
  puzzleType?: "image_tile" | "mathematical" | "word_cipher";
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

export function generateGtdPassCode(
  wallet: string | null,
  moves: number,
  timeSeconds: number
): string {
  const seed = `${wallet || "guest"}-${moves}-${timeSeconds}`;
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0;
  }
  const hex1 = Math.abs(hash).toString(16).toUpperCase().padStart(4, "0").slice(0, 4);
  const hex2 = Math.abs((hash * 31) | 0).toString(16).toUpperCase().padStart(4, "0").slice(0, 4);
  return `GTD-${hex1}-${hex2}`;
}

export function GtdModal({
  isOpen,
  onClose,
  onPlayAgain,
  moves,
  timeSeconds,
  walletAddress,
  onConnectWallet,
  targetImageSrc = "/nft-target.png",
  puzzleType = "image_tile",
}: GtdModalProps) {
  const [passCode, setPassCode] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Generate deterministic Pass ID and trigger confetti when modal opens
  useEffect(() => {
    if (isOpen) {
      const code = generateGtdPassCode(walletAddress, moves, timeSeconds);
      setPassCode(code);
      setSavedSuccess(false);
      setErrorMsg(null);

      // Launch vibrant confetti bursts
      try {
        const count = 200;
        const defaults = {
          origin: { y: 0.6 },
          colors: ["#B8E643", "#FACC15", "#111111", "#FEF3C7", "#e42c24"],
        };

        function fire(particleRatio: number, opts: confetti.Options) {
          confetti({
            ...defaults,
            ...opts,
            particleCount: Math.floor(count * particleRatio),
          });
        }

        fire(0.25, { spread: 26, startVelocity: 55 });
        fire(0.2, { spread: 60 });
        fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8 });
        fire(0.1, { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2 });
        fire(0.1, { spread: 120, startVelocity: 45 });
      } catch {
        // Confetti gracefully skipped if canvas not ready
      }
    }
  }, [isOpen, walletAddress, moves, timeSeconds]);

  if (!isOpen) return null;

  async function handleSaveAllowlist() {
    if (!walletAddress) {
      onConnectWallet?.();
      return;
    }

    setSaving(true);
    setErrorMsg(null);

    try {
      const res = await fetch("/api/claim-gtd", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          walletAddress,
          passCode,
          moves,
          timeSeconds,
          puzzleType,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setSavedSuccess(true);
      } else if (res.status === 409) {
        // Already claimed
        setSavedSuccess(true);
        setErrorMsg("This wallet has already recorded a GTD allowlist claim! Spot is secured.");
      } else {
        setErrorMsg(data.error || "Failed to record allowlist spot. Please try again.");
      }
    } catch {
      setErrorMsg("Network error saving to allowlist. Please retry.");
    } finally {
      setSaving(false);
    }
  }

  function handleShareOnX() {
    const formatted = formatTime(timeSeconds);
    const text = `I just solved the @Buzquitos 3x3 NFT Pixel Puzzle in ${formatted} (${moves} moves) and secured my GTD Whitelist spot on @base! 🎯 Pass: ${passCode}\n\nJoin the challenge: https://buzquitos.xyz/puzzle`;
    const tweetUrl = `https://x.com/intent/tweet?text=${encodeURIComponent(text)}`;
    window.open(tweetUrl, "_blank", "noopener,noreferrer");
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#111111]/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-lg border-4 border-[#111111] bg-[#FEF3C7] p-6 sm:p-8 shadow-[8px_8px_0_#111111]">
        {/* Close button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 border-2 border-[#111111] bg-white p-1.5 text-[#111111] shadow-[2px_2px_0_#111111] hover:bg-[#e42c24] hover:text-white transition"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Modal Header */}
        <div className="text-center">
          <div className="inline-flex items-center gap-1.5 border-2 border-[#111111] bg-[#B8E643] px-3 py-1 font-mono text-xs font-black shadow-[3px_3px_0_#111111]">
            <Trophy className="h-4 w-4 text-[#111111]" />
            <span>PUZZLE COMPLETED!</span>
          </div>

          <h2 className="mt-3 text-2xl sm:text-3xl font-black text-[#111111] tracking-tight">
            GTD ALLOWLIST <span className="text-[#e42c24]">UNLOCKED.</span>
          </h2>
          <p className="mt-1 text-xs sm:text-sm font-semibold text-[#444444]">
            All 9 tiles restored! You are eligible for Guaranteed Token Distribution.
          </p>
        </div>

        {/* NFT Image Preview & Stats Box */}
        <div className="mt-5 grid grid-cols-[100px_minmax(0,1fr)] gap-4 border-3 border-[#111111] bg-white p-4 shadow-[4px_4px_0_#111111]">
          <div className="relative h-24 w-24 border-2 border-[#111111] bg-[#B8E643] overflow-hidden shadow-[2px_2px_0_#111111]">
            <img
              src={targetImageSrc}
              alt="Solved NFT"
              className="h-full w-full object-cover pixelated"
            />
            <div className="absolute bottom-1 right-1 bg-[#111111] px-1 font-mono text-[9px] font-bold text-[#B8E643]">
              9/9
            </div>
          </div>

          <div className="space-y-1.5 font-mono text-xs text-[#111111]">
            <div className="flex items-center justify-between border-b border-[#111111]/15 pb-1">
              <span className="text-[11px] font-bold text-[#666666]">GTD PASS ID:</span>
              <strong className="text-xs font-black text-[#e42c24]">{passCode}</strong>
            </div>

            <div className="flex items-center justify-between border-b border-[#111111]/15 pb-1">
              <span className="text-[11px] font-bold text-[#666666]">MOVES:</span>
              <strong className="text-xs font-bold">{moves} moves</strong>
            </div>

            <div className="flex items-center justify-between border-b border-[#111111]/15 pb-1">
              <span className="text-[11px] font-bold text-[#666666]">SOLVE TIME:</span>
              <strong className="text-xs font-bold">{formatTime(timeSeconds)}</strong>
            </div>

            <div className="flex items-center justify-between pt-0.5">
              <span className="text-[11px] font-bold text-[#666666]">NETWORK:</span>
              <strong className="text-xs font-bold text-[#B8E643] bg-[#111111] px-1.5 py-0.5">
                BASE (8453)
              </strong>
            </div>
          </div>
        </div>

        {/* Wallet binding status */}
        <div className="mt-4 border-2 border-[#111111] bg-[#FEF3C7] p-3 text-xs">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[11px] font-bold text-[#666666]">
              CONNECTED WALLET:
            </span>
            {walletAddress ? (
              <span className="font-mono font-bold text-[#111111] flex items-center gap-1">
                <CheckCircle2 className="h-3.5 w-3.5 text-[#B8E643]" />
                {truncateAddress(walletAddress)}
              </span>
            ) : (
              <span className="font-mono font-bold text-[#e42c24]">
                NOT CONNECTED
              </span>
            )}
          </div>
          {!walletAddress && (
            <p className="mt-1 text-[11px] text-[#555555]">
              Connect your EVM wallet to permanently record this GTD spot.
            </p>
          )}
        </div>

        {/* Error or Notice message */}
        {errorMsg && (
          <div className="mt-3 border-2 border-[#111111] bg-[#FACC15] p-2.5 text-xs font-bold text-[#111111]">
            {errorMsg}
          </div>
        )}

        {/* Action Buttons */}
        <div className="mt-5 space-y-2.5">
          {savedSuccess ? (
            <div className="flex items-center justify-center gap-2 border-3 border-[#111111] bg-[#B8E643] p-3 font-mono text-xs sm:text-sm font-black text-[#111111] shadow-[4px_4px_0_#111111]">
              <ShieldCheck className="h-5 w-5 text-[#111111]" />
              <span>GTD ALLOWLIST SPOT CONFIRMED & SAVED!</span>
            </div>
          ) : (
            <button
              type="button"
              disabled={saving}
              onClick={handleSaveAllowlist}
              className="w-full flex items-center justify-center gap-2 border-3 border-[#111111] bg-[#B8E643] py-3.5 px-4 font-mono text-xs sm:text-sm font-black text-[#111111] shadow-[4px_4px_0_#111111] transition hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0 active:translate-y-0 hover:bg-[#FACC15]"
            >
              <Sparkles className="h-4 w-4" />
              <span>
                {saving
                  ? "SAVING TO ALLOWLIST..."
                  : walletAddress
                  ? "SAVE GTD TO ALLOWLIST"
                  : "CONNECT WALLET & SAVE GTD"}
              </span>
            </button>
          )}

          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={handleShareOnX}
              className="flex items-center justify-center gap-2 border-2 border-[#111111] bg-[#111111] py-2.5 px-3 font-mono text-xs font-bold text-white shadow-[3px_3px_0_#B8E643] transition hover:bg-black"
            >
              <Share2 className="h-3.5 w-3.5" />
              <span>SHARE ON X</span>
            </button>

            <button
              type="button"
              onClick={onPlayAgain}
              className="flex items-center justify-center gap-2 border-2 border-[#111111] bg-white py-2.5 px-3 font-mono text-xs font-bold text-[#111111] shadow-[3px_3px_0_#111111] transition hover:bg-[#FEF3C7]"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>PLAY AGAIN</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
