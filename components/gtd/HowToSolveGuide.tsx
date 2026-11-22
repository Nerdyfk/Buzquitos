import {
  Calculator,
  Crosshair,
  Filter,
  Hash,
  Lightbulb,
  Rows3,
  Columns3,
} from "lucide-react";

const GUIDE_RULES = [
  {
    icon: Hash,
    num: "01",
    title: "Number Uniqueness Rule",
    body: "Use integers 1–9. Every number from 1 to 9 must appear exactly once across the entire 3×3 board—zero duplicates allowed.",
  },
  {
    icon: Rows3,
    num: "02",
    title: "Horizontal Row Sums",
    body: "Add every number in a horizontal row. Every completed row must equal the Target Sum: exactly 15.",
  },
  {
    icon: Columns3,
    num: "03",
    title: "Vertical Column Sums",
    body: "Add every number in a vertical column. Every completed column must also equal the exact Target Sum: exactly 15.",
  },
  {
    icon: Calculator,
    num: "04",
    title: "Identify Missing Numbers",
    body: "Check the Numbers panel to see which integers are still unused. Any single-blank row or column immediately reveals its value: Target Sum − Current Sum.",
  },
  {
    icon: Crosshair,
    num: "05",
    title: "Intersecting Constraints",
    body: "When a cell sits inside an incomplete row and an incomplete column, the number you place must leave a valid sum for BOTH lines simultaneously.",
  },
  {
    icon: Filter,
    num: "06",
    title: "Eliminate Impossible Placements",
    body: "Rule out numbers that would exceed the target sum or force a duplicate in remaining cells. Every generated puzzle has a mathematically proven unique solution.",
  },
];

export function HowToSolveGuide() {
  return (
    <section
      id="guide"
      className="border-y-2 border-[#171820] bg-[#f6d52b] py-14 sm:py-20"
    >
      <div className="section-wrap">
        <div className="eyebrow mb-3 text-[#171820]">
          MATHEMATICAL SOLVING GUIDE / 004
        </div>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <h2 className="pixel-title text-3xl sm:text-5xl lg:text-6xl font-black text-[#171820]">
            HOW TO<br />
            SOLVE IT.
          </h2>
          <p className="max-w-md text-xs sm:text-sm font-medium leading-relaxed text-[#394127]">
            No guesswork needed. Every generated board is verified by our server-side
            constraint solver to guarantee exactly one valid completion.
          </p>
        </div>

        <div className="mt-8 sm:mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {GUIDE_RULES.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.title}
                className="border-2 border-[#171820] bg-[#f7f7ed] p-5 shadow-[5px_5px_0_#171820]"
              >
                <div className="flex items-center justify-between">
                  <div className="flex h-10 w-10 items-center justify-center border-2 border-[#171820] bg-[#c2ed55] text-[#171820]">
                    <Icon className="h-5 w-5" />
                  </div>
                  <span className="font-mono text-2xl font-bold text-[#e42c24]">
                    {item.num}
                  </span>
                </div>
                <h3 className="mt-5 text-lg font-black text-[#171820]">
                  {item.title}
                </h3>
                <p className="mt-2 text-xs leading-relaxed text-[#535744]">
                  {item.body}
                </p>
              </div>
            );
          })}
        </div>

        <div className="mt-8 grid gap-5 lg:grid-cols-2">
          <div className="border-2 border-[#171820] bg-[#f7f7ed] p-6 shadow-[5px_5px_0_#171820]">
            <div className="eyebrow font-bold text-[#e42c24]">
              WORKED EXAMPLE (3×3, TARGET = 15)
            </div>
            <p className="mt-2 text-xs leading-relaxed text-[#465032]">
              Suppose Row 1 contains{" "}
              <code className="font-mono font-bold text-[#171820]">[ 8, ?, 6 ]</code>.
              Current sum is <strong>8 + 6 = 14</strong>. Since the target sum is{" "}
              <strong>15</strong> and only 1 cell is blank, that cell MUST be{" "}
              <strong className="text-[#e42c24]">15 − 14 = 1</strong>. Placing{" "}
              <strong>1</strong> narrows Column 2 and unlocks a deduction chain!
            </p>
            <div className="mt-4 grid max-w-[220px] grid-cols-4 gap-1.5 font-mono text-xs font-bold">
              {[
                { v: "8", given: true },
                { v: "1", solved: true },
                { v: "6", given: true },
                { v: "=15", sum: true },
                { v: "3", given: true },
                { v: "5", solved: true },
                { v: "7", given: true },
                { v: "=15", sum: true },
                { v: "4", solved: true },
                { v: "9", given: true },
                { v: "2", solved: true },
                { v: "=15", sum: true },
              ].map((cell, idx) => (
                <div
                  key={idx}
                  className={`flex h-10 items-center justify-center border-2 border-[#171820] ${
                    cell.sum
                      ? "bg-[#171820] text-[#c2ed55]"
                      : cell.given
                        ? "bg-[#f6d52b] text-[#171820]"
                        : "bg-[#c2ed55] text-[#171820]"
                  }`}
                >
                  {cell.v}
                </div>
              ))}
            </div>
          </div>

          <div className="border-2 border-[#171820] bg-[#f7f7ed] p-6 shadow-[5px_5px_0_#171820]">
            <div className="flex items-center gap-2 eyebrow font-bold text-[#171820]">
              <Lightbulb className="h-4 w-4 text-[#e42c24]" />
              4-LEVEL PROGRESSIVE HINT SYSTEM
            </div>
            <p className="mt-2 text-xs text-[#465032]">
              Use the hint buttons inside the puzzle panel whenever you want guidance
              without spoiling the solution:
            </p>
            <ul className="mt-4 space-y-2 text-xs text-[#171820]">
              <li className="border-2 border-[#171820] bg-white px-3 py-2">
                <strong className="font-mono text-[#e42c24]">HINT 1:</strong> Lists the
                remaining unused numbers missing from your board.
              </li>
              <li className="border-2 border-[#171820] bg-white px-3 py-2">
                <strong className="font-mono text-[#e42c24]">HINT 2:</strong> Highlights
                the most constrained incomplete horizontal row and its sum deficit.
              </li>
              <li className="border-2 border-[#171820] bg-white px-3 py-2">
                <strong className="font-mono text-[#e42c24]">HINT 3:</strong> Highlights
                the most constrained incomplete vertical column and its sum deficit.
              </li>
              <li className="border-2 border-[#171820] bg-white px-3 py-2">
                <strong className="font-mono text-[#e42c24]">HINT 4:</strong> Pinpoints
                the best intersecting row/column cell to narrow valid placements.
              </li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
