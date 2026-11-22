"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Award,
  CheckCircle2,
  Clock,
  Search,
  ShieldAlert,
  XCircle,
  Send,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import type { CampaignSnapshot } from "@/types/gtd";

interface StatusRecord {
  twitterUsername: string;
  displayUsername: string;
  walletAddress: string | null;
  puzzleId: string | null;
  puzzleGridSize: number | null;
  puzzleCompletedAt: string | null;
  submissionId: string | null;
  submissionTimestamp: string | null;
  reviewedAt: string | null;
  rawStatus: string;
  statusCode: string;
  statusLabel: string;
  statusDescription: string;
  winnerId: string | null;
  rejectionReason: string | null;
  additionalProofNote: string | null;
  canSubmitAdditionalProof: boolean;
}

function StatusDashboardInner() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q") || "";

  const [query, setQuery] = useState(initialQuery);
  const [loading, setLoading] = useState(true);
  const [record, setRecord] = useState<StatusRecord | null>(null);
  const [campaign, setCampaign] = useState<CampaignSnapshot | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [proofWallet, setProofWallet] = useState("");
  const [proofUrl, setProofUrl] = useState("");
  const [proofSubmitting, setProofSubmitting] = useState(false);
  const [proofMessage, setProofMessage] = useState<string | null>(null);

  const fetchStatus = useCallback(async (searchValue: string) => {
    setLoading(true);
    setErrorMsg(null);
    setProofMessage(null);
    try {
      const qs = searchValue.trim()
        ? `?q=${encodeURIComponent(searchValue.trim())}`
        : "";
      const res = await fetch(`/api/gtd/status${qs}`, { cache: "no-store" });
      const data = await res.json();
      if (data.campaign) setCampaign(data.campaign);
      if (data.found && data.record) {
        setRecord(data.record);
      } else {
        setRecord(null);
        if (searchValue.trim()) {
          setErrorMsg(data.error || "No claim found for that query.");
        }
      }
    } catch {
      setErrorMsg("Unable to fetch claim status right now.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus(initialQuery);
  }, [initialQuery, fetchStatus]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    fetchStatus(query);
  }

  async function handleResubmitProof(e: React.FormEvent) {
    e.preventDefault();
    if (!record?.submissionId || proofSubmitting) return;
    setProofSubmitting(true);
    setProofMessage(null);
    try {
      const res = await fetch("/api/gtd/status/resubmit-proof", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          submissionCode: record.submissionId,
          walletAddress: proofWallet.trim(),
          additionalProofUrls: [proofUrl.trim()],
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setProofMessage(`Error: ${data.error || "Could not submit proof."}`);
        return;
      }
      setProofMessage(data.message);
      setProofUrl("");
      fetchStatus(record.submissionId);
    } catch {
      setProofMessage("Error: Network failure while submitting additional proof.");
    } finally {
      setProofSubmitting(false);
    }
  }

  const badgeStyle = (code: string) => {
    switch (code) {
      case "APPROVED":
        return { cls: "bg-[#c2ed55] text-[#171820]", Icon: Award };
      case "REJECTED":
      case "CAMPAIGN_FULL":
        return { cls: "bg-[#e42c24] text-white", Icon: XCircle };
      case "ADDITIONAL_PROOF_REQUESTED":
        return { cls: "bg-[#f6d52b] text-[#171820]", Icon: ShieldAlert };
      case "PUZZLE_COMPLETED":
        return { cls: "bg-[#c2ed55] text-[#171820]", Icon: CheckCircle2 };
      default:
        return { cls: "bg-[#f6d52b] text-[#171820]", Icon: Clock };
    }
  };

  return (
    <div className="grid-bg min-h-screen overflow-x-hidden pb-16">
      <Navbar />

      <div className="section-wrap max-w-4xl space-y-8 pt-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <Link href="/puzzle" className="pixel-btn light !px-4 !py-2.5 !text-xs">
            <ArrowLeft className="h-4 w-4" />
            BACK TO PUZZLE
          </Link>
          {campaign && (
            <div className="border-2 border-[#171820] bg-[#f6d52b] px-4 py-2 font-mono text-xs font-bold shadow-[3px_3px_0_#171820]">
              LIVE POOL: {campaign.occupiedSpots} / {campaign.maxWinners} SPOTS (
              {campaign.remainingSpots} REMAINING)
            </div>
          )}
        </div>

        <div className="card p-6 sm:p-8">
          <div className="eyebrow text-[#e42c24]">
            USER CLAIM VERIFICATION DASHBOARD
          </div>
          <h1 className="pixel-title mt-2 text-3xl font-black text-[#171820] sm:text-4xl">
            CHECK YOUR GTD STATUS.
          </h1>
          <p className="mt-2 text-sm text-[#465032]">
            Enter your @username, Submission ID (<code>SUB-XXXX</code>), Puzzle ID (
            <code>GTD-...</code>), or BNB Smart Chain wallet address to inspect real-time
            admin verification status.
          </p>

          <form
            onSubmit={handleSearch}
            className="mt-6 flex flex-col gap-3 sm:flex-row"
          >
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#465032]" />
              <input
                type="text"
                placeholder="@username, SUB-XXXXXXXX, GTD-..., or 0x..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="field !pl-10 font-mono font-bold"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="pixel-btn !px-6 !py-3 text-xs sm:text-sm"
            >
              {loading ? "CHECKING..." : "CHECK STATUS"}
            </button>
          </form>

          {errorMsg && (
            <div className="mt-4 border-2 border-[#171820] bg-[#e42c24] p-4 text-xs font-bold text-white shadow-[4px_4px_0_#171820]">
              {errorMsg}
            </div>
          )}
        </div>

        {record && (
          <div className="card p-6 sm:p-8">
            {(() => {
              const { cls, Icon } = badgeStyle(record.statusCode);
              return (
                <div className="flex flex-wrap items-start justify-between gap-4 border-b-2 border-[#171820]/15 pb-6">
                  <div>
                    <div
                      className={`inline-flex items-center gap-2 border-2 border-[#171820] px-3.5 py-1.5 font-mono text-xs font-bold shadow-[3px_3px_0_#171820] ${cls}`}
                    >
                      <Icon className="h-4 w-4" />
                      {record.statusLabel.toUpperCase()}
                    </div>
                    <h2 className="mt-3 text-2xl font-black text-[#171820]">
                      @{record.displayUsername}
                    </h2>
                    <p className="mt-1.5 max-w-2xl text-sm text-[#465032]">
                      {record.statusDescription}
                    </p>
                  </div>

                  {record.winnerId && (
                    <div className="border-2 border-[#171820] bg-[#171820] px-5 py-3 text-right text-white shadow-[4px_4px_0_#e42c24]">
                      <div className="eyebrow text-[10px] text-[#c2ed55]">
                        OFFICIAL GTD WINNER ID
                      </div>
                      <div className="mt-1 font-mono text-lg font-black text-[#f6d52b]">
                        {record.winnerId}
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}

            <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <div className="border-2 border-[#171820] bg-white p-4">
                <div className="eyebrow text-[10px] text-[#535744]">TWITTER/X</div>
                <div className="mt-1 font-mono text-sm font-bold text-[#171820]">
                  @{record.displayUsername}
                </div>
              </div>

              <div className="border-2 border-[#171820] bg-white p-4">
                <div className="eyebrow text-[10px] text-[#535744]">BSC WALLET</div>
                <div className="mt-1 truncate font-mono text-xs font-bold text-[#171820]">
                  {record.walletAddress || "Not submitted yet"}
                </div>
              </div>

              <div className="border-2 border-[#171820] bg-[#c2ed55] p-4">
                <div className="eyebrow text-[10px] text-[#394127]">PUZZLE ID</div>
                <div className="mt-1 font-mono text-sm font-bold text-[#171820]">
                  {record.puzzleId || "—"}
                </div>
              </div>

              <div className="border-2 border-[#171820] bg-[#f6d52b] p-4">
                <div className="eyebrow text-[10px] text-[#171820]">
                  SUBMISSION ID
                </div>
                <div className="mt-1 font-mono text-sm font-bold text-[#171820]">
                  {record.submissionId || "Not submitted yet"}
                </div>
              </div>

              <div className="border-2 border-[#171820] bg-white p-4">
                <div className="eyebrow text-[10px] text-[#535744]">SUBMITTED AT</div>
                <div className="mt-1 font-mono text-xs font-bold text-[#171820]">
                  {record.submissionTimestamp
                    ? new Date(record.submissionTimestamp).toLocaleString()
                    : "—"}
                </div>
              </div>

              <div className="border-2 border-[#171820] bg-white p-4">
                <div className="eyebrow text-[10px] text-[#535744]">REVIEWED AT</div>
                <div className="mt-1 font-mono text-xs font-bold text-[#171820]">
                  {record.reviewedAt
                    ? new Date(record.reviewedAt).toLocaleString()
                    : "Awaiting Admin Review"}
                </div>
              </div>
            </div>

            {record.rejectionReason && (
              <div className="mt-6 border-2 border-[#171820] bg-[#e42c24] p-5 text-white shadow-[4px_4px_0_#171820]">
                <div className="eyebrow text-xs font-bold text-[#f6d52b]">
                  ADMIN REJECTION REASON
                </div>
                <p className="mt-1.5 text-sm font-semibold">
                  {record.rejectionReason}
                </p>
              </div>
            )}

            {record.canSubmitAdditionalProof && record.submissionId && (
              <div className="mt-6 border-2 border-[#171820] bg-[#f6d52b] p-5 shadow-[4px_4px_0_#171820]">
                <div className="eyebrow font-bold text-[#171820]">
                  ADDITIONAL VERIFICATION PROOF REQUESTED
                </div>
                {record.additionalProofNote && (
                  <p className="mt-1.5 text-sm font-semibold text-[#171820]">
                    {record.additionalProofNote}
                  </p>
                )}

                <form onSubmit={handleResubmitProof} className="mt-4 space-y-3">
                  <input
                    type="text"
                    required
                    placeholder="Confirm your submitted BSC wallet (0x...)"
                    value={proofWallet}
                    onChange={(e) => setProofWallet(e.target.value)}
                    className="field font-mono"
                  />
                  <input
                    type="url"
                    required
                    placeholder="Additional proof URL (e.g. https://x.com/...)"
                    value={proofUrl}
                    onChange={(e) => setProofUrl(e.target.value)}
                    className="field"
                  />
                  <button
                    type="submit"
                    disabled={proofSubmitting}
                    className="pixel-btn !px-5 !py-2.5 !text-xs"
                  >
                    <Send className="h-3.5 w-3.5" />
                    {proofSubmitting ? "SUBMITTING..." : "SUBMIT ADDITIONAL PROOF"}
                  </button>
                  {proofMessage && (
                    <p className="text-xs font-bold text-[#171820]">
                      {proofMessage}
                    </p>
                  )}
                </form>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function PuzzleStatusPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#c2ed55] p-12 text-center font-mono text-sm font-bold text-[#171820]">
          LOADING CLAIM STATUS DASHBOARD...
        </div>
      }
    >
      <StatusDashboardInner />
    </Suspense>
  );
}
