"use client";

import { motion } from "framer-motion";
import { CheckCircle2, Clock, Users, AlertTriangle } from "lucide-react";
import type { CampaignSnapshot } from "@/types/gtd";

interface LiveCampaignBannerProps {
  campaign: CampaignSnapshot;
}

export function LiveCampaignBanner({ campaign }: LiveCampaignBannerProps) {
  const pct =
    campaign.maxWinners > 0
      ? Math.min(
          100,
          Math.round((campaign.occupiedSpots / campaign.maxWinners) * 100)
        )
      : 100;

  const statusConfig =
    campaign.status === "FULL"
      ? {
          label: "CAMPAIGN FULL",
          badge: "bg-[#e42c24] text-white",
          bar: "bg-[#e42c24]",
        }
      : campaign.status === "ALMOST_FULL"
        ? {
            label: "ALMOST FULL",
            badge: "bg-[#f6d52b] text-[#171820]",
            bar: "bg-[#e42c24]",
          }
        : {
            label: "ACTIVE",
            badge: "bg-[#c2ed55] text-[#171820]",
            bar: "bg-[#171820]",
          };

  return (
    <section
      id="fcfs-counter"
      className="border-y-2 border-[#171820] bg-[#f7f7ed] py-14 sm:py-16"
    >
      <div className="section-wrap">
        <div className="eyebrow mb-3 text-[#465032]">
          LIVE FCFS ALLOCATION ENGINE / 002
        </div>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <h2 className="pixel-title text-3xl sm:text-5xl font-black text-[#171820]">
            <span className="font-mono text-[#e42c24]">
              {campaign.occupiedSpots} / {campaign.maxWinners}
            </span>{" "}
            GTD SPOTS CLAIMED.
          </h2>
          <span
            className={`inline-flex items-center gap-2 border-2 border-[#171820] px-3.5 py-1.5 font-mono text-xs font-bold shadow-[3px_3px_0_#171820] ${statusConfig.badge}`}
          >
            <span className="blink h-2 w-2 bg-current shrink-0" />
            STATUS: {statusConfig.label}
          </span>
        </div>

        <div className="mt-7">
          <div className="mb-2 flex items-center justify-between font-mono text-xs font-bold text-[#171820]">
            <span>CAPACITY UTILIZATION (APPROVED + PENDING RESERVATIONS)</span>
            <span>{pct}%</span>
          </div>
          <div className="h-5 w-full border-2 border-[#171820] bg-white p-0.5 shadow-[4px_4px_0_#171820]">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${pct}%` }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className={`h-full ${statusConfig.bar}`}
            />
          </div>
        </div>

        <div className="mt-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <div className="border-2 border-[#171820] bg-white p-4 sm:p-5 shadow-[4px_4px_0_#171820]">
            <div className="flex items-center justify-between eyebrow text-[10px]">
              <span>TOTAL CAPACITY</span>
              <Users size={15} />
            </div>
            <div className="mt-4 font-mono text-3xl sm:text-4xl font-black tracking-[-.05em]">
              {campaign.maxWinners}
            </div>
            <div className="mt-3 h-1 w-9 bg-[#e42c24]" />
            <div className="mt-2 text-[11px] font-medium text-[#535744]">
              Hard FCFS cap
            </div>
          </div>

          <div className="border-2 border-[#171820] bg-[#c2ed55] p-4 sm:p-5 shadow-[4px_4px_0_#171820]">
            <div className="flex items-center justify-between eyebrow text-[10px]">
              <span>APPROVED SPOTS</span>
              <CheckCircle2 size={15} />
            </div>
            <div className="mt-4 font-mono text-3xl sm:text-4xl font-black tracking-[-.05em]">
              {campaign.approvedCount}
            </div>
            <div className="mt-3 h-1 w-9 bg-[#171820]" />
            <div className="mt-2 text-[11px] font-medium text-[#394127]">
              Admin verified GTD
            </div>
          </div>

          <div className="border-2 border-[#171820] bg-[#f6d52b] p-4 sm:p-5 shadow-[4px_4px_0_#171820]">
            <div className="flex items-center justify-between eyebrow text-[10px]">
              <span>PENDING REVIEW</span>
              <Clock size={15} />
            </div>
            <div className="mt-4 font-mono text-3xl sm:text-4xl font-black tracking-[-.05em]">
              {campaign.reservedCount}
            </div>
            <div className="mt-3 h-1 w-9 bg-[#e42c24]" />
            <div className="mt-2 text-[11px] font-medium text-[#394127]">
              Provisional spot hold
            </div>
          </div>

          <div className="border-2 border-[#171820] bg-white p-4 sm:p-5 shadow-[4px_4px_0_#171820]">
            <div className="flex items-center justify-between eyebrow text-[10px]">
              <span>REMAINING SPOTS</span>
              <AlertTriangle size={15} />
            </div>
            <div className="mt-4 font-mono text-3xl sm:text-4xl font-black tracking-[-.05em] text-[#e42c24]">
              {campaign.remainingSpots}
            </div>
            <div className="mt-3 h-1 w-9 bg-[#171820]" />
            <div className="mt-2 text-[11px] font-medium text-[#535744]">
              {campaign.remainingSpots === 0
                ? "Opens if any rejected"
                : "Available right now"}
            </div>
          </div>
        </div>

        <p className="mt-6 text-xs leading-relaxed text-[#535744]">
          <strong className="text-[#171820]">Allocation Policy:</strong> Spots are
          provisionally reserved atomically upon valid claim submission. Admin approval
          converts a reservation into a confirmed GTD winner; rejection releases the spot
          back to the live pool. Solving the puzzle alone does not guarantee whitelist
          approval until social tasks pass manual review.
        </p>
      </div>
    </section>
  );
}
