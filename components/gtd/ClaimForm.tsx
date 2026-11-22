"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Lock,
  Wallet,
  ExternalLink,
  Plus,
  Trash2,
  CheckCircle2,
  ShieldAlert,
  Send,
  Clock,
  ArrowRight,
  Share2,
} from "lucide-react";
import type {
  CampaignSnapshot,
  CampaignTask,
  ClientPuzzle,
  ClientSubmissionSummary,
} from "@/types/gtd";
import { DEFAULT_CAMPAIGN_TASKS } from "@/types/gtd";

interface ClaimFormProps {
  puzzle: ClientPuzzle | null;
  campaign: CampaignSnapshot;
  existingSubmission: ClientSubmissionSummary | null;
  onClaimSubmitted: (data: {
    submission: ClientSubmissionSummary;
    campaign: CampaignSnapshot;
  }) => void;
}

declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
    };
  }
}

export function ClaimForm({
  puzzle,
  campaign,
  existingSubmission,
  onClaimSubmitted,
}: ClaimFormProps) {
  const isUnlocked = puzzle?.status === "COMPLETED" && !existingSubmission;
  const isAlreadySubmitted =
    puzzle?.status === "SUBMITTED" || Boolean(existingSubmission);
  const isCampaignFull = campaign.remainingSpots <= 0;

  const tasks: CampaignTask[] =
    campaign.tasks && campaign.tasks.length > 0
      ? campaign.tasks
      : DEFAULT_CAMPAIGN_TASKS;

  const [walletAddress, setWalletAddress] = useState("");
  const [taskChecks, setTaskChecks] = useState<Record<string, boolean>>({});
  const [taskUrls, setTaskUrls] = useState<Record<string, string>>({});
  const [finalConfirm, setFinalConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const requiredTasksMarked = tasks
    .filter((t) => t.isRequired)
    .every((t) => Boolean(taskChecks[t.id]));

  const requiredUrlsFilled = tasks
    .filter((t) => t.isRequired && t.needsUrlInput)
    .every((t) => Boolean(taskUrls[t.id]?.trim()));

  const puzzleTypeName =
    puzzle?.category === "image"
      ? "3×3 NFT Tile"
      : puzzle?.category === "word"
      ? "Web3 Word Cipher"
      : `${puzzle?.gridSize || 3}×${puzzle?.gridSize || 3} Math Grid`;

  const shareTweetUrl = puzzle
    ? `https://x.com/intent/tweet?text=${encodeURIComponent(
        `I just solved my personalized ${puzzleTypeName} GTD Whitelist Puzzle (${puzzle.puzzleId}) for ${campaign.officialTwitterHandle}!\n\nJoining the 500-spot FCFS GTD Challenge.\n${campaign.requiredHashtags}`
      )}`
    : "#";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!puzzle || !isUnlocked || submitting) return;

    setErrorMsg(null);

    if (!requiredTasksMarked || !finalConfirm) {
      setErrorMsg(
        "Please complete all required social verification tasks, check the boxes, and confirm."
      );
      return;
    }

    if (!walletAddress.trim()) {
      setErrorMsg("Please enter your EVM / BSC wallet address.");
      return;
    }

    if (!requiredUrlsFilled) {
      const missing = tasks.find(
        (t) => t.isRequired && t.needsUrlInput && !taskUrls[t.id]?.trim()
      );
      setErrorMsg(
        `Please enter the required link for: "${missing?.title || "Required Task"}".`
      );
      return;
    }

    const firstReqUrl = tasks.find((t) => t.needsUrlInput && t.isRequired);
    const firstOptUrl = tasks.find((t) => t.needsUrlInput && !t.isRequired);
    const commentPostUrl = firstReqUrl ? taskUrls[firstReqUrl.id] || "" : "";
    const announcementPostUrl = firstOptUrl ? taskUrls[firstOptUrl.id] || "" : "";

    const taskProofs = tasks
      .filter((t) => t.needsUrlInput && taskUrls[t.id]?.trim())
      .map((t) => ({
        taskId: t.id,
        taskTitle: t.title,
        url: taskUrls[t.id]!.trim(),
      }));

    setSubmitting(true);
    try {
      const res = await fetch("/api/gtd/claims", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          puzzleId: puzzle.puzzleId,
          walletAddress: walletAddress.trim(),
          commentPostUrl: commentPostUrl || Object.values(taskUrls).find((u) => u.trim()) || "",
          postUrl: announcementPostUrl,
          announcementPostUrl: announcementPostUrl || commentPostUrl,
          proofLinks: taskProofs.map((p) => p.url),
          taskProofs,
          tasksConfirmed: true,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || "Unable to submit whitelist claim.");
        return;
      }
      onClaimSubmitted({
        submission: {
          submissionCode: data.submission.submissionCode,
          puzzleId: data.submission.puzzleId,
          walletAddress: data.submission.walletAddress,
          status: data.submission.status,
          reservedAt: data.submission.reservedAt,
        },
        campaign: data.campaign,
      });
    } catch {
      setErrorMsg("Network error while submitting your claim. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (isAlreadySubmitted && existingSubmission) {
    return (
      <div className="card p-6 sm:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 border-2 border-[#171820] bg-[#f6d52b] px-3 py-1 font-mono text-xs font-bold text-[#171820]">
              <Clock className="h-3.5 w-3.5" />
              {existingSubmission.status === "APPROVED"
                ? "APPROVED – GTD WHITELIST SECURED"
                : existingSubmission.status === "REJECTED"
                  ? "REJECTED – ADDITIONAL ACTION REQUIRED"
                  : "PENDING ADMIN VERIFICATION"}
            </div>
            <h3 className="mt-3 text-2xl font-black text-[#171820]">
              CLAIM SUBMISSION RECORDED.
            </h3>
            <p className="mt-1.5 max-w-2xl text-sm text-[#465032]">
              Your personalized puzzle is permanently locked to prevent duplicate claims.
              An administrator will manually inspect your social tasks before approving
              your GTD whitelist spot.
            </p>
          </div>
          <CheckCircle2 className="h-11 w-11 shrink-0 text-[#171820]" />
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="border-2 border-[#171820] bg-white p-3.5">
            <div className="eyebrow text-[10px] text-[#535744]">SUBMISSION ID</div>
            <div className="mt-1 font-mono text-sm font-bold text-[#e42c24]">
              {existingSubmission.submissionCode}
            </div>
          </div>
          <div className="border-2 border-[#171820] bg-white p-3.5">
            <div className="eyebrow text-[10px] text-[#535744]">PUZZLE ID</div>
            <div className="mt-1 font-mono text-sm font-bold text-[#171820]">
              {existingSubmission.puzzleId}
            </div>
          </div>
          <div className="border-2 border-[#171820] bg-[#c2ed55] p-3.5">
            <div className="eyebrow text-[10px] text-[#394127]">BSC WALLET</div>
            <div className="mt-1 truncate font-mono text-xs font-bold text-[#171820]">
              {existingSubmission.walletAddress}
            </div>
          </div>
          <div className="border-2 border-[#171820] bg-white p-3.5">
            <div className="eyebrow text-[10px] text-[#535744]">RESERVED AT</div>
            <div className="mt-1 font-mono text-xs font-bold text-[#171820]">
              {new Date(existingSubmission.reservedAt).toLocaleString()}
            </div>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t-2 border-[#171820]/15 pt-5">
          <p className="text-xs font-medium text-[#535744]">
            Track live review updates and your official Winner ID anytime on the Status
            Dashboard.
          </p>
          <Link
            href={`/puzzle/status?q=${encodeURIComponent(existingSubmission.submissionCode)}`}
            className="pixel-btn !px-5 !py-2.5 !text-xs"
          >
            OPEN CLAIM STATUS DASHBOARD
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    );
  }

  if (!isUnlocked || !puzzle) {
    return (
      <div className="card p-6 sm:p-8">
        <div className="flex flex-col items-center justify-center py-6 text-center">
          <div className="flex h-14 w-14 items-center justify-center border-2 border-[#171820] bg-[#f6d52b] text-[#171820] shadow-[4px_4px_0_#171820]">
            <Lock className="h-7 w-7" />
          </div>
          <h3 className="mt-4 text-xl font-black text-[#171820]">
            STEP 3: GTD CLAIM FORM (LOCKED)
          </h3>
          <p className="mt-2 max-w-lg text-sm text-[#465032]">
            This section remains strictly locked until you generate and correctly solve
            your personalized mathematical puzzle above. Server-side validation enforces
            that no steps can be skipped.
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-2 font-mono text-[11px] font-bold">
            <span className="border-2 border-[#171820] bg-white px-3 py-1">
              1. ENTER @USERNAME
            </span>
            <span className="border-2 border-[#171820] bg-white px-3 py-1">
              2. SOLVE UNIQUE PUZZLE
            </span>
            <span className="border-2 border-[#171820] bg-[#c2ed55] px-3 py-1">
              3. UNLOCK CLAIM &amp; RESERVE SPOT
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="card p-6 sm:p-8">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4 border-b-2 border-[#171820]/15 pb-5">
        <div>
          <div className="inline-flex items-center gap-2 border-2 border-[#171820] bg-[#c2ed55] px-3 py-1 font-mono text-xs font-bold text-[#171820]">
            <CheckCircle2 className="h-3.5 w-3.5" />
            CLAIM FORM UNLOCKED
          </div>
          <h3 className="mt-2 text-2xl font-black text-[#171820]">
            STEP 3: SUBMIT WALLET &amp; SOCIAL PROOF
          </h3>
          <p className="mt-1 text-xs font-medium text-[#535744]">
            Submitting reserves 1 provisional spot out of {campaign.maxWinners} (FCFS).
            Final GTD whitelist approval requires manual verification by our admin team.
          </p>
        </div>
      </div>

      {isCampaignFull && (
        <div className="mb-6 flex items-start gap-3 border-2 border-[#171820] bg-[#e42c24] p-4 text-white shadow-[4px_4px_0_#171820]">
          <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0" />
          <div>
            <div className="text-sm font-black uppercase">
              Campaign Currently Full (500 / 500)
            </div>
            <p className="mt-0.5 text-xs">
              All 500 GTD spots are currently approved or provisionally reserved. New
              submissions will only open if an admin rejects a pending claim and releases
              a spot.
            </p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label uppercase">Twitter/X Username (Locked)</label>
            <input
              type="text"
              readOnly
              value={`@${puzzle.displayUsername}`}
              className="field font-mono font-bold bg-[#ecece0] cursor-not-allowed"
            />
          </div>
          <div>
            <label className="label uppercase">Verified Puzzle ID (Locked)</label>
            <input
              type="text"
              readOnly
              value={puzzle.puzzleId}
              className="field font-mono font-bold bg-[#ecece0] cursor-not-allowed"
            />
          </div>
        </div>

        <div>
          <div className="mb-1.5 flex flex-wrap items-center justify-between gap-2">
            <label htmlFor="bsc-wallet" className="label !mb-0 uppercase">
              BNB Smart Chain (BEP-20) / EVM Wallet Address *
            </label>
            <span className="border border-[#171820] bg-[#c2ed55] px-2.5 py-0.5 font-mono text-[10px] font-bold text-[#171820]">
              SUBMIT 0X... ADDRESS (NO WALLET CONNECTION REQUIRED)
            </span>
          </div>
          <input
            id="bsc-wallet"
            type="text"
            required
            placeholder="0x..."
            value={walletAddress}
            onChange={(e) => setWalletAddress(e.target.value)}
            className="field font-mono"
          />
          <p className="mt-1.5 text-[11px] font-medium text-[#535744]">
            Paste or enter your EVM / BNB Smart Chain wallet address into the box above to claim your spot. No wallet connection or transaction signature required. One wallet address can claim only one GTD whitelist spot.
          </p>
        </div>

        {/* Social Tasks Section */}
        <div className="border-2 border-[#171820] bg-[#fffdf4] p-5">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h4 className="text-sm font-black uppercase text-[#171820]">
              Verification Tasks
            </h4>
            <span className="border border-[#171820] bg-[#f6d52b] px-2 py-0.5 font-mono text-[10px] font-bold">
              ADMINS MANUALLY AUDIT EVERY COMMENT &amp; LINK
            </span>
          </div>

          <div className="space-y-3 text-sm">
            {tasks.map((task, idx) => {
              const isCompose =
                task.actionLabel.toUpperCase().includes("COMPOSE") ||
                task.actionUrl.includes("intent/tweet");
              const actionHref = isCompose ? shareTweetUrl : task.actionUrl;

              return (
                <div
                  key={task.id}
                  className="flex flex-wrap items-center justify-between gap-3 border-2 border-[#171820] bg-[#f7f7ed] px-3.5 py-3"
                >
                  <label className="flex cursor-pointer items-center gap-3 text-xs font-semibold text-[#171820] sm:text-sm">
                    <input
                      type="checkbox"
                      checked={Boolean(taskChecks[task.id])}
                      onChange={(e) =>
                        setTaskChecks((prev) => ({
                          ...prev,
                          [task.id]: e.target.checked,
                        }))
                      }
                      className="h-4 w-4 accent-[#171820]"
                    />
                    <span>
                      <strong>{idx + 1}. {task.title}</strong>{" "}
                      {task.isRequired ? (
                        <span className="ml-1 rounded bg-[#e42c24] px-1.5 py-0.2 font-mono text-[10px] text-white font-bold">
                          REQUIRED
                        </span>
                      ) : (
                        <span className="ml-1 rounded bg-[#343744] px-1.5 py-0.2 font-mono text-[10px] text-white/80 font-bold">
                          OPTIONAL
                        </span>
                      )}
                    </span>
                  </label>
                  <a
                    href={actionHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 border-2 border-[#171820] bg-[#c2ed55] px-3 py-1.5 font-mono text-xs font-bold text-[#171820] hover:bg-[#f6d52b]"
                  >
                    {isCompose ? (
                      <Share2 className="h-3 w-3" />
                    ) : (
                      <ExternalLink className="h-3 w-3" />
                    )}
                    {task.actionLabel}
                  </a>
                </div>
              );
            })}
          </div>
        </div>

        {/* Dynamic Proof Inputs for tasks that require or accept a link/URL */}
        {tasks.some((t) => t.needsUrlInput) && (
          <div className="space-y-4">
            {tasks
              .filter((t) => t.needsUrlInput)
              .map((task) => (
                <div key={`input-${task.id}`}>
                  <div className="mb-1.5 flex items-center justify-between gap-2">
                    <label htmlFor={`proof-${task.id}`} className="label !mb-0 uppercase">
                      {task.title} {task.isRequired ? "*" : "(Optional)"}
                    </label>
                    <span
                      className={`rounded px-2 py-0.5 font-mono text-[10px] font-black ${
                        task.isRequired
                          ? "bg-[#e42c24] text-white"
                          : "bg-[#343744] text-white/80"
                      }`}
                    >
                      {task.isRequired ? "REQUIRED" : "OPTIONAL"}
                    </span>
                  </div>
                  <input
                    id={`proof-${task.id}`}
                    type="url"
                    required={task.isRequired}
                    placeholder={
                      task.urlInputPlaceholder || "https://x.com/username/status/..."
                    }
                    value={taskUrls[task.id] || ""}
                    onChange={(e) =>
                      setTaskUrls((prev) => ({
                        ...prev,
                        [task.id]: e.target.value,
                      }))
                    }
                    className="field"
                  />
                  {task.urlInputDescription && (
                    <p className="mt-1 text-[11px] font-medium text-[#535744]">
                      {task.urlInputDescription}
                    </p>
                  )}
                </div>
              ))}
          </div>
        )}

        <label className="flex cursor-pointer items-start gap-3 border-2 border-[#171820] bg-[#f6d52b] p-4 text-xs font-semibold leading-relaxed text-[#171820]">
          <input
            type="checkbox"
            checked={finalConfirm}
            onChange={(e) => setFinalConfirm(e.target.checked)}
            className="mt-0.5 h-4 w-4 accent-[#171820]"
          />
          <span>
            I confirm that I completed the required social tasks using{" "}
            <strong>@{puzzle.displayUsername}</strong>, provided my valid BSC wallet address, and attached my comment link. I understand that an administrator will manually verify every link before approval.
          </span>
        </label>

        {errorMsg && (
          <div className="border-2 border-[#171820] bg-[#e42c24] p-4 text-xs font-bold text-white shadow-[4px_4px_0_#171820]">
            {errorMsg}
          </div>
        )}

        <button
          type="submit"
          disabled={submitting || isCampaignFull}
          className="pixel-btn red w-full !py-4 text-sm"
        >
          <Send className="h-4 w-4" />
          {submitting
            ? "RESERVING PROVISIONAL SPOT..."
            : isCampaignFull
              ? "CAMPAIGN FULL — SUBMISSIONS CLOSED"
              : "SUBMIT CLAIM & RESERVE PROVISIONAL GTD SPOT"}
        </button>
      </form>
    </div>
  );
}
