import Link from "next/link";
import {
  ArrowDown,
  ArrowUpRight,
  Award,
  Check,
  ExternalLink,
  Lock,
  ShieldCheck,
  UserCheck,
  Zap,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import { getPublicCampaignSnapshot } from "@/lib/gtd/campaign";
import type { CampaignSnapshot } from "@/types/gtd";
import { MultiPuzzleHub } from "@/components/MultiPuzzleHub";
import { HowToSolveGuide } from "@/components/gtd/HowToSolveGuide";
import { FaqSection } from "@/components/gtd/FaqSection";

export const dynamic = "force-dynamic";

const FALLBACK_CAMPAIGN: CampaignSnapshot = {
  id: "primary",
  name: process.env.CAMPAIGN_NAME || "Buzquitos GTD Challenge",
  maxWinners: Number(process.env.CAMPAIGN_MAX_WINNERS || "500") || 500,
  approvedCount: 0,
  reservedCount: 0,
  occupiedSpots: 0,
  remainingSpots: Number(process.env.CAMPAIGN_MAX_WINNERS || "500") || 500,
  status: "ACTIVE",
  officialTwitterUrl:
    process.env.OFFICIAL_TWITTER_URL || "https://x.com/Buzquitos",
  officialTwitterHandle:
    process.env.OFFICIAL_TWITTER_HANDLE || "@Buzquitos",
  pinnedPostUrl:
    process.env.PINNED_POST_URL ||
    "https://x.com/Buzquitos/status/1890000000000000000",
  requiredHashtags:
    process.env.REQUIRED_HASHTAGS ||
    "#Buzquitos #GTDWhitelist #GTDChallenge",
  defaultGridSize: 3,
};

export default async function PuzzlePage() {
  let campaign: CampaignSnapshot = FALLBACK_CAMPAIGN;
  try {
    campaign = await getPublicCampaignSnapshot();
  } catch {
    campaign = FALLBACK_CAMPAIGN;
  }

  return (
    <main id="puzzle-top" className="grid-bg min-h-screen overflow-x-hidden">
      {/* Exact same Navbar with all existing Buzquitos buttons + Puzzle link */}
      <Navbar />

      {/* 1. HERO SECTION */}
      <section className="section-wrap grid items-center gap-8 pb-14 pt-6 sm:pb-16 sm:pt-10 lg:grid-cols-[1.15fr_.85fr] lg:gap-12">
        <div className="max-w-full">
          <div className="mb-4 inline-flex max-w-full flex-wrap items-center gap-2 border-2 border-[#171820] bg-[#f6d52b] px-3 py-1.5 font-mono text-[10px] font-bold tracking-widest shadow-[3px_3px_0_#171820]">
            <span className="blink h-2 w-2 shrink-0 bg-[#e42c24]" />
            <span>
              FIRST {campaign.maxWinners} VALID SUBMISSIONS ONLY · GTD PUZZLE CHALLENGE
            </span>
          </div>

          <h1 className="pixel-title text-4xl font-black leading-[0.93] text-[#171820] sm:text-6xl lg:text-[3.6rem] xl:text-[4.35rem]">
            SOLVE THE<br />
            PUZZLE.<br />
            <span className="text-[#e42c24]">SECURE YOUR GTD SPOT.</span>
          </h1>

          <p className="mt-5 max-w-[520px] text-sm font-medium leading-relaxed text-[#394127] sm:text-base lg:text-lg">
            Generate a unique mathematical sum-grid puzzle watermarked with your{" "}
            <strong>Twitter/X username</strong>. Solve it to unlock the claim form,
            complete all social tasks, and pass manual admin verification to secure 1 of{" "}
            <strong>{campaign.maxWinners} GTD whitelist spots</strong>.
          </p>


          <div className="mt-7 flex flex-col flex-wrap gap-3 sm:flex-row">
            <a href="#challenge" className="pixel-btn w-full sm:w-auto">
              START PERSONALIZED PUZZLE <ArrowDown size={16} />
            </a>
            <Link href="/puzzle/status" className="pixel-btn light w-full sm:w-auto">
              CHECK CLAIM STATUS <ArrowUpRight size={16} />
            </Link>
          </div>
        </div>

        {/* Hero Visual Summary Card */}
        <div className="card p-6 sm:p-7">
          <div className="flex items-center justify-between border-b-2 border-[#171820]/15 pb-4">
            <span className="eyebrow font-bold text-[#e42c24]">
              CHALLENGE SPECS
            </span>
            <span className="border-2 border-[#171820] bg-[#c2ed55] px-2.5 py-0.5 font-mono text-[11px] font-bold">
              {campaign.remainingSpots} LEFT
            </span>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3">
            <div className="border-2 border-[#171820] bg-[#f6d52b] p-4">
              <div className="eyebrow text-[10px]">PUZZLE 01</div>
              <div className="mt-2 font-mono text-xl sm:text-2xl font-black">NFT TILE</div>
              <div className="mt-1 text-[11px] font-semibold text-[#394127]">
                3×3 Character Swap
              </div>
            </div>
            <div className="border-2 border-[#171820] bg-[#c2ed55] p-4">
              <div className="eyebrow text-[10px]">PUZZLE 02</div>
              <div className="mt-2 font-mono text-xl sm:text-2xl font-black">3×3 MATH</div>
              <div className="mt-1 text-[11px] font-semibold text-[#394127]">
                1–9 · Target Σ = 15
              </div>
            </div>
            <div className="border-2 border-[#171820] bg-white p-4">
              <div className="eyebrow text-[10px]">CAPACITY</div>
              <div className="mt-2 font-mono text-2xl font-black text-[#e42c24]">
                {campaign.maxWinners}
              </div>
              <div className="mt-1 text-[11px] font-semibold text-[#535744]">
                FCFS Hard Cap
              </div>
            </div>
            <div className="border-2 border-[#171820] bg-[#171820] p-4 text-white">
              <div className="eyebrow text-[10px] text-[#c2ed55]">UNIQUENESS</div>
              <div className="mt-2 font-mono text-2xl font-black">1-OF-1</div>
              <div className="mt-1 text-[11px] text-white/75">
                @User Watermarked
              </div>
            </div>
          </div>

          <div className="mt-5 rotate-[-1.5deg] border-2 border-[#171820] bg-[#e42c24] p-3 text-center font-mono text-[11px] font-bold text-white shadow-[4px_4px_0_#171820]">
            1 PUZZLE · 1 USERNAME · 1 WALLET · ZERO DUPLICATES ✦
          </div>
        </div>
      </section>

      {/* MARQUEE BANNER */}
      <div className="marquee">
        <div className="marquee-track">
          {Array.from({ length: 8 }).map((_, i) => (
            <span key={i}>
              ✳ SOLVE THE PUZZLE ✳ FIRST 500 VALID CLAIMS ✳ PERSONALIZED @X WATERMARK ✳
              MANUAL ADMIN VERIFICATION ✳ GTD WHITELIST ✳
            </span>
          ))}
        </div>
      </div>

      {/* 2. HOW IT WORKS */}
      <section id="how-it-works" className="section-wrap py-14 sm:py-20">
        <div className="grid gap-8 md:grid-cols-[.8fr_1.2fr]">
          <div>
            <div className="eyebrow mb-3 text-[#465032]">
              STRICT ANTI-SYBIL FLOW / 001
            </div>
            <h2 className="pixel-title text-3xl font-black sm:text-5xl lg:text-6xl">
              HOW IT<br />
              WORKS.<br />
              <span className="text-[#e42c24]">NO SKIPPING.</span>
            </h2>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-[#465032]">
              Every stage is validated server-side. You cannot access the claiming form
              until your unique personalized board is solved and verified.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {[
              {
                num: "01",
                bg: "bg-[#f6d52b]",
                icon: UserCheck,
                title: "Bind Your @Username",
                desc: "Enter your Twitter/X handle and choose your challenge arena (NFT Tile, 3×3 Math, or Word Cipher). Generates a unique watermarked puzzle.",
              },
              {
                num: "02",
                bg: "bg-[#f7f7ed]",
                icon: Zap,
                title: "Solve Unique Puzzle",
                desc: "Use every number once so every row & column equals the target sum. Verified against our server-only solution.",
              },
              {
                num: "03",
                bg: "bg-[#f7f7ed]",
                icon: Lock,
                title: "Submit Claim & Proof",
                desc: "Solving unlocks the claim form. Submit your BSC wallet & social links to reserve 1 of 500 FCFS spots.",
              },
              {
                num: "04",
                bg: "bg-[#e42c24] text-white",
                icon: Award,
                title: "Manual Admin Approval",
                desc: "Admins audit Follow, Like, Retweet, Comment & Post. Approved winners get an official GTD Winner ID.",
              },
            ].map((step) => {
              const Icon = step.icon;
              return (
                <div
                  key={step.num}
                  className={`border-2 border-[#171820] p-5 shadow-[5px_5px_0_#171820] ${step.bg}`}
                >
                  <div className="flex items-center justify-between">
                    <Icon size={22} />
                    <span className="font-mono text-xl font-black opacity-80">
                      {step.num}
                    </span>
                  </div>
                  <h3 className="mt-4 text-lg font-black">{step.title}</h3>
                  <p className="mt-1.5 text-xs leading-relaxed opacity-90">
                    {step.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 3 & 4. TRIPLE GTD PUZZLE ARENA (IMAGE, MATH & WORD CIPHER) */}
      <MultiPuzzleHub initialCampaign={campaign} />

      {/* 5. DEDICATED PUZZLE-SOLVING GUIDE */}
      <HowToSolveGuide />

      {/* 6. SOCIAL PARTICIPATION REQUIREMENTS */}
      <section
        id="social-tasks"
        className="border-b-2 border-[#171820] bg-[#f7f7ed] py-14 sm:py-20"
      >
        <div className="section-wrap">
          <div className="eyebrow mb-3 text-[#465032]">
            SOCIAL PARTICIPATION / 005
          </div>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <h2 className="pixel-title text-3xl font-black sm:text-5xl">
              5 REQUIRED<br />
              <span className="text-[#e42c24]">SOCIAL TASKS.</span>
            </h2>
            <a
              href={campaign.officialTwitterUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="pixel-btn !px-4 !py-3 !text-xs"
            >
              FOLLOW {campaign.officialTwitterHandle.toUpperCase()}{" "}
              <ExternalLink size={14} />
            </a>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            {[
              {
                num: "01",
                bg: "bg-white",
                title: "Follow Official X",
                detail: `Follow ${campaign.officialTwitterHandle} on Twitter/X.`,
                link: campaign.officialTwitterUrl,
              },
              {
                num: "02",
                bg: "bg-[#c2ed55]",
                title: "Like Pinned Post",
                detail: "Like our official pinned GTD campaign announcement.",
                link: campaign.pinnedPostUrl,
              },
              {
                num: "03",
                bg: "bg-[#f6d52b]",
                title: "Retweet Post",
                detail: "Repost the pinned campaign thread publicly.",
                link: campaign.pinnedPostUrl,
              },
              {
                num: "04",
                bg: "bg-white",
                title: "Comment on Post",
                detail: "Leave a genuine reply on the pinned campaign post.",
                link: campaign.pinnedPostUrl,
              },
              {
                num: "05",
                bg: "bg-[#c2ed55]",
                title: "Publish Proof Post",
                detail: `Post your completion with ${campaign.requiredHashtags} and submit the link.`,
                link: campaign.officialTwitterUrl,
              },
            ].map((t) => (
              <a
                key={t.num}
                href={t.link}
                target="_blank"
                rel="noopener noreferrer"
                className={`flex flex-col justify-between border-2 border-[#171820] p-4 shadow-[4px_4px_0_#171820] transition hover:-translate-x-0.5 hover:-translate-y-0.5 ${t.bg}`}
              >
                <div>
                  <div className="flex items-center justify-between font-mono text-xs font-bold text-[#e42c24]">
                    <span>TASK {t.num}</span>
                    <ExternalLink size={14} className="text-[#171820]" />
                  </div>
                  <h3 className="mt-3 text-base font-black text-[#171820]">
                    {t.title}
                  </h3>
                  <p className="mt-1.5 text-xs leading-relaxed text-[#465032]">
                    {t.detail}
                  </p>
                </div>
                <div className="mt-4 inline-flex items-center gap-1.5 font-mono text-[10px] font-bold uppercase text-[#171820]">
                  <Check size={13} />
                  MANUALLY AUDITED
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* 7. FAQ SECTION */}
      <FaqSection />

      {/* 8. FOOTER */}
      <footer className="border-t-2 border-[#171820] bg-[#171820] py-8 text-white">
        <div className="section-wrap flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
          <div>
            <div className="text-base font-black tracking-tight sm:text-lg">
              BUZQUITOS
            </div>
            <div className="mt-1 font-mono text-[10px] text-white/55">
              FIRST {campaign.maxWinners} VALID CLAIMS · GTD WHITELIST PUZZLE CHALLENGE
            </div>
          </div>
          <div className="flex flex-wrap gap-5 text-xs font-semibold">
            <Link href="/" className="hover:underline">
              HOME
            </Link>
            <Link href="/puzzle/status" className="text-[#f6d52b] hover:underline">
              CHECK CLAIM STATUS
            </Link>
            <a
              href={campaign.officialTwitterUrl}
              target="_blank"
              rel="noreferrer"
              className="text-[#c2ed55] hover:underline"
            >
              FOLLOW {campaign.officialTwitterHandle.toUpperCase()} ON X ↗
            </a>
            <a href="#puzzle-top" className="hover:underline">
              BACK TO TOP ↑
            </a>
          </div>
          <div className="font-mono text-[10px] text-white/45">
            © 2026 BUZQUITOS. ALL PIXELS RESERVED.
          </div>
        </div>
      </footer>
    </main>
  );
}
