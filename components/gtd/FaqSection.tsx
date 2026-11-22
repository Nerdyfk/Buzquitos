"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

const FAQ_ITEMS = [
  {
    q: "Does solving the puzzle alone guarantee my GTD whitelist spot?",
    a: "No. Solving your personalized puzzle unlocks the Claim Submission Form. After you submit your BNB Smart Chain wallet and social task proof links, a provisional spot (out of 500) is reserved while our admin team manually verifies all 5 social tasks. Only admin-approved submissions become confirmed GTD whitelist winners.",
  },
  {
    q: "How does the 500-spot First-Come, First-Served (FCFS) limit work?",
    a: "The total number of Approved Winners plus active Pending Verification reservations can never exceed 500. Atomic MongoDB Atlas transactions enforce the 500-spot cap even under simultaneous submissions. If a pending submission is rejected by an admin, that reserved spot is immediately released back to the public pool.",
  },
  {
    q: "Why is my Twitter/X username watermarked across my puzzle?",
    a: "Each puzzle is dynamically generated and bound to your normalized Twitter/X username and session. The repeating @USERNAME watermark prevents copying or reusing another participant's puzzle screenshot when posting completion proof on X.",
  },
  {
    q: "Can I submit the same puzzle, username, or wallet address more than once?",
    a: "No. Strict database-level unique constraints enforce one claim per Twitter/X username, one claim per BNB Smart Chain wallet address, and single-use puzzles. Once a puzzle ID is submitted, it is permanently marked as used.",
  },
  {
    q: "Which puzzles qualify for the GTD whitelist?",
    a: "All three challenges qualify equally: the 3×3 NFT Pixel-Art Tile Puzzle, the 3×3 Mathematical Grid (Target Sum 15), and the Web3 Word Cipher. Successfully solving any one of them unlocks the GTD whitelist claim form.",
  },
  {
    q: "How will I know when my submission is approved or rejected?",
    a: "Visit the Claim Status Dashboard (/puzzle/status) anytime and enter your Submission ID, @username, Puzzle ID, or wallet address. Approved winners receive a unique Winner ID (GTD-WIN-XXXX) and approval timestamp; rejected claims display the exact admin review reason.",
  },
];

export function FaqSection() {
  const [active, setActive] = useState<number | null>(0);

  return (
    <section
      id="puzzle-faq"
      className="section-wrap grid gap-8 sm:gap-10 py-14 sm:py-20 md:grid-cols-[.75fr_1.25fr]"
    >
      <div>
        <div className="eyebrow mb-3 sm:mb-4 text-[#465032]">
          GOOD QUESTIONS / 006
        </div>
        <h2 className="pixel-title text-3xl sm:text-5xl lg:text-6xl font-black text-[#171820]">
          FAQ<span className="text-[#e42c24]">.</span>
        </h2>
        <p className="mt-4 sm:mt-5 max-w-xs text-xs sm:text-sm leading-relaxed text-[#465032]">
          Answers about the 500-spot GTD puzzle challenge, manual social verification,
          and claiming rules.
        </p>
      </div>

      <div className="space-y-3">
        {FAQ_ITEMS.map((item, i) => (
          <div key={item.q} className="border-2 border-[#171820] bg-[#f7f7ed]">
            <button
              type="button"
              className="flex w-full items-center justify-between gap-3 p-4 text-left text-sm font-bold text-[#171820] sm:text-base"
              onClick={() => setActive(active === i ? null : i)}
            >
              <span className="flex items-start sm:items-center">
                <span className="mr-2 sm:mr-3 shrink-0 font-mono text-xs text-[#78834b]">
                  0{i + 1}
                </span>
                <span>{item.q}</span>
              </span>
              <ChevronDown
                className={`shrink-0 transition-transform ${
                  active === i ? "rotate-180" : ""
                }`}
                size={18}
              />
            </button>
            {active === i && (
              <div className="border-t-2 border-[#171820]/15 px-4 pb-4 pt-3 text-xs leading-relaxed text-[#535744] sm:text-sm">
                {item.a}
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
