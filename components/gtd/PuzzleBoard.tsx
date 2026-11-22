"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle2,
  Download,
  Eraser,
  Lightbulb,
  RotateCcw,
  Send,
  Sparkles,
  AlertCircle,
  Grid3X3,
} from "lucide-react";
import type { CampaignSnapshot, ClientPuzzle } from "@/types/gtd";
import {
  analyzeBoard,
  buildProgressiveHint,
  type ProgressiveHint,
} from "@/lib/gtd/hints";
import { downloadWatermarkedPuzzlePng } from "@/components/gtd/PuzzleCanvasExport";

interface PuzzleBoardProps {
  puzzle: ClientPuzzle;
  campaign: CampaignSnapshot;
  onSolved: (data: {
    completedAt: string;
    message: string;
    campaign: CampaignSnapshot;
    claimEligible: boolean;
  }) => void;
  onSwitchPuzzle?: (type: "image_3x3" | "word_cipher") => void;
}

interface ServerErrorHighlights {
  invalidRows: number[];
  invalidCols: number[];
  mismatchedCells: Array<{ row: number; col: number }>;
  duplicateCells: Array<{ row: number; col: number }>;
  emptyCells: Array<{ row: number; col: number }>;
}

export function PuzzleBoard({
  puzzle,
  campaign,
  onSolved,
  onSwitchPuzzle,
}: PuzzleBoardProps) {
  const size = puzzle.gridSize;
  const maxVal = size * size;
  const isAlreadyLocked =
    puzzle.status === "COMPLETED" || puzzle.status === "SUBMITTED";

  const [grid, setGrid] = useState<number[][]>(() =>
    puzzle.initialGrid.map((row) => [...row])
  );
  const [selected, setSelected] = useState<{ row: number; col: number } | null>(
    null
  );
  const [typingBuffer, setTypingBuffer] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [serverHighlights, setServerHighlights] =
    useState<ServerErrorHighlights | null>(null);
  const [hintLevel, setHintLevel] = useState<0 | 1 | 2 | 3 | 4>(0);
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

  useEffect(() => {
    setGrid(puzzle.initialGrid.map((row) => [...row]));
    setSelected(null);
    setTypingBuffer("");
    setErrorMsg(null);
    setServerHighlights(null);
    setHintLevel(0);
    setSuccessData(
      puzzle.status === "COMPLETED"
        ? {
            message:
              "Congratulations! You successfully solved your personalized GTD Whitelist Challenge.",
            completedAt: puzzle.completedAt ?? new Date().toISOString(),
            claimEligible: campaign.remainingSpots > 0,
          }
        : null
    );
  }, [
    puzzle.puzzleId,
    puzzle.initialGrid,
    puzzle.status,
    puzzle.completedAt,
    campaign.remainingSpots,
  ]);

  const analysis = useMemo(
    () => analyzeBoard(grid, puzzle.initialGrid, size, puzzle.targetSum),
    [grid, puzzle.initialGrid, size, puzzle.targetSum]
  );

  const activeHint: ProgressiveHint | null = useMemo(() => {
    if (hintLevel === 0) return null;
    return buildProgressiveHint(
      grid,
      puzzle.initialGrid,
      size,
      puzzle.targetSum,
      hintLevel
    );
  }, [grid, puzzle.initialGrid, size, puzzle.targetSum, hintLevel]);

  const setCellValue = useCallback(
    (row: number, col: number, value: number) => {
      if (isAlreadyLocked) return;
      if (puzzle.initialGrid[row][col] !== 0) return;
      setGrid((prev) => {
        const next = prev.map((r) => [...r]);
        next[row][col] = value;
        return next;
      });
      setErrorMsg(null);
      setServerHighlights(null);
    },
    [isAlreadyLocked, puzzle.initialGrid]
  );

  useEffect(() => {
    if (!selected || isAlreadyLocked) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (!selected) return;
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;

      if (e.key === "ArrowUp") {
        e.preventDefault();
        setTypingBuffer("");
        setSelected((s) =>
          s ? { row: (s.row + size - 1) % size, col: s.col } : null
        );
        return;
      }
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setTypingBuffer("");
        setSelected((s) => (s ? { row: (s.row + 1) % size, col: s.col } : null));
        return;
      }
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        setTypingBuffer("");
        setSelected((s) =>
          s ? { row: s.row, col: (s.col + size - 1) % size } : null
        );
        return;
      }
      if (e.key === "ArrowRight") {
        e.preventDefault();
        setTypingBuffer("");
        setSelected((s) => (s ? { row: s.row, col: (s.col + 1) % size } : null));
        return;
      }

      if (e.key === "Backspace" || e.key === "Delete" || e.key === "0") {
        e.preventDefault();
        setTypingBuffer("");
        setCellValue(selected.row, selected.col, 0);
        return;
      }

      if (/^[0-9]$/.test(e.key)) {
        e.preventDefault();
        if (puzzle.initialGrid[selected.row][selected.col] !== 0) return;

        if (size === 3) {
          const num = Number(e.key);
          if (num >= 1 && num <= 9) {
            setCellValue(selected.row, selected.col, num);
          }
        } else {
          const combined = typingBuffer + e.key;
          const parsedCombined = Number(combined);
          if (
            combined.length <= 2 &&
            parsedCombined >= 1 &&
            parsedCombined <= maxVal
          ) {
            setCellValue(selected.row, selected.col, parsedCombined);
            setTypingBuffer(combined.length === 2 ? "" : combined);
          } else {
            const single = Number(e.key);
            if (single >= 1 && single <= maxVal) {
              setCellValue(selected.row, selected.col, single);
              setTypingBuffer(e.key);
            }
          }
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    selected,
    isAlreadyLocked,
    size,
    maxVal,
    typingBuffer,
    setCellValue,
    puzzle.initialGrid,
  ]);

  function handleClearCell() {
    if (!selected || isAlreadyLocked) return;
    setTypingBuffer("");
    setCellValue(selected.row, selected.col, 0);
  }

  function handleResetPuzzle() {
    if (isAlreadyLocked) return;
    setGrid(puzzle.initialGrid.map((row) => [...row]));
    setTypingBuffer("");
    setErrorMsg(null);
    setServerHighlights(null);
  }

  async function handleSubmitPuzzle() {
    if (isAlreadyLocked || submitting) return;
    setSubmitting(true);
    setErrorMsg(null);
    setServerHighlights(null);

    try {
      const res = await fetch("/api/gtd/puzzle/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          puzzleId: puzzle.puzzleId,
          grid,
        }),
      });
      const data = await res.json();

      if (!res.ok || !data.valid) {
        setErrorMsg(
          data.error || "Incorrect solution. Please verify your sums and uniqueness."
        );
        setServerHighlights({
          invalidRows: data.invalidRows ?? [],
          invalidCols: data.invalidCols ?? [],
          mismatchedCells: data.mismatchedCells ?? [],
          duplicateCells: data.duplicateCells ?? [],
          emptyCells: data.emptyCells ?? [],
        });
        return;
      }

      setSuccessData({
        message: data.message,
        completedAt: data.completedAt,
        claimEligible: data.claimEligible,
      });
      onSolved({
        completedAt: data.completedAt,
        message: data.message,
        campaign: data.campaign,
        claimEligible: data.claimEligible,
      });
    } catch {
      setErrorMsg("Network error while verifying your puzzle. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  const watermarkLabel = `@${puzzle.displayUsername}`;
  const watermarkSvg = useMemo(() => {
    const escaped = watermarkLabel.replace(/[<>&"']/g, "");
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="220" height="120" viewBox="0 0 220 120"><text x="16" y="70" fill="rgba(23,24,32,0.14)" font-family="monospace" font-weight="700" font-size="16" transform="rotate(-24 110 60)">${escaped}</text></svg>`;
    return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
  }, [watermarkLabel]);

  const isCellFlagged = (r: number, c: number) => {
    if (!serverHighlights) return false;
    return (
      serverHighlights.mismatchedCells.some((x) => x.row === r && x.col === c) ||
      serverHighlights.duplicateCells.some((x) => x.row === r && x.col === c) ||
      serverHighlights.emptyCells.some((x) => x.row === r && x.col === c)
    );
  };

  return (
    <div className="space-y-6">
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
            onClick={() => onSwitchPuzzle?.("word_cipher")}
            className="flex items-center justify-center gap-2 border-2 border-[#171820] bg-white py-2 px-3 font-mono text-xs font-black text-[#171820] hover:bg-[#f6d52b] shadow-[2px_2px_0_#171820] transition active:translate-y-0.5"
          >
            <span>SWITCH TO: 🔤 WEB3 WORD CIPHER</span>
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-2 border-[#171820] bg-[#f6d52b] px-4 py-3 shadow-[3px_3px_0_#171820]">
        <div className="flex flex-wrap items-center gap-3">
          <span className="inline-flex items-center gap-1.5 border-2 border-[#171820] bg-[#171820] px-2.5 py-1 font-mono text-xs font-bold text-[#c2ed55]">
            <Grid3X3 className="h-3.5 w-3.5" />
            {size}×{size} GRID
          </span>
          <span className="font-mono text-xs font-bold text-[#171820]">
            ID: {puzzle.puzzleId}
          </span>
          <span className="font-mono text-xs font-bold text-[#e42c24]">
            BOUND TO {watermarkLabel.toUpperCase()}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="border-2 border-[#171820] bg-[#f7f7ed] px-3 py-1 font-mono text-xs font-bold text-[#171820]">
            TARGET SUM: {puzzle.targetSum}
          </div>
          <div className="border-2 border-[#171820] bg-[#c2ed55] px-3 py-1 font-mono text-xs font-bold text-[#171820]">
            REMAINING: {analysis.remainingNumbers.length}
          </div>
        </div>
      </div>

      <div>
        <div className="mb-1.5 flex items-center justify-between font-mono text-xs font-bold text-[#171820]">
          <span>
            PROGRESS ({analysis.filledEditableCount} / {analysis.totalEditableCount}{" "}
            CELLS FILLED)
          </span>
          <span>{analysis.progressPercent}%</span>
        </div>
        <div className="h-3.5 w-full border-2 border-[#171820] bg-white p-0.5">
          <div
            className="h-full bg-[#171820] transition-all duration-300"
            style={{ width: `${analysis.progressPercent}%` }}
          />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="relative overflow-hidden border-2 border-[#171820] bg-[#fffdf4] p-4 shadow-[5px_5px_0_#171820] sm:p-6">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 select-none"
            style={{
              backgroundImage: watermarkSvg,
              backgroundRepeat: "repeat",
            }}
          />

          <div className="relative z-10 overflow-x-auto">
            <div
              className={`mx-auto ${size === 3 ? "max-w-[380px]" : "min-w-[520px] max-w-[660px]"}`}
            >
              <div
                className="grid items-center"
                style={{
                  gridTemplateColumns: `repeat(${size}, minmax(0, 1fr)) ${size === 3 ? "58px" : "48px"}`,
                  gap: size === 3 ? "10px" : "5px",
                }}
              >
                {grid.map((rowVals, r) => {
                  const rowTotal = analysis.rowSums[r];
                  const rowComplete = analysis.rowBlanks[r] === 0;
                  const rowMatches = rowComplete && rowTotal === puzzle.targetSum;
                  const rowOver =
                    rowTotal > puzzle.targetSum ||
                    (rowComplete && rowTotal !== puzzle.targetSum) ||
                    Boolean(serverHighlights?.invalidRows.includes(r));
                  const rowHinted = activeHint?.focusRow === r;

                  return (
                    <div key={`row-${r}`} className="contents">
                      {rowVals.map((val, c) => {
                        const isGiven = puzzle.initialGrid[r][c] !== 0;
                        const isSelected =
                          selected?.row === r && selected?.col === c;
                        const isSameRowOrCol =
                          selected !== null &&
                          (selected.row === r || selected.col === c);
                        const isDuplicate =
                          val > 0 && analysis.duplicateValues.has(val);
                        const flagged = isCellFlagged(r, c);
                        const isHintFocus =
                          activeHint?.focusRow === r || activeHint?.focusCol === c;

                        let cellStyle =
                          "border-[#171820] bg-[#fffdf4]/80 text-[#171820] hover:bg-[#c2ed55]/50";
                        if (isGiven) {
                          cellStyle =
                            "border-[#171820] bg-[#f6d52b]/85 text-[#171820] font-black cursor-default";
                        } else if (isSameRowOrCol) {
                          cellStyle =
                            "border-[#171820] bg-[#c2ed55]/55 text-[#171820] font-bold";
                        } else if (val > 0) {
                          cellStyle =
                            "border-[#171820] bg-[#c2ed55]/35 text-[#171820] font-bold";
                        }
                        if (isHintFocus && !isSelected) {
                          cellStyle += " outline outline-2 outline-[#e42c24]";
                        }
                        if (isDuplicate || flagged) {
                          cellStyle =
                            "border-[#171820] bg-[#e42c24] text-white font-black";
                        }
                        if (isSelected) {
                          cellStyle =
                            "border-[#171820] bg-[#171820] text-[#c2ed55] font-black shadow-[3px_3px_0_#e42c24]";
                        }

                        return (
                          <button
                            key={`cell-${r}-${c}`}
                            type="button"
                            disabled={isAlreadyLocked}
                            onClick={() => {
                              setSelected({ row: r, col: c });
                              setTypingBuffer("");
                            }}
                            aria-label={`Row ${r + 1}, Column ${c + 1}${isGiven ? ", fixed clue" : ""}`}
                            className={`relative flex aspect-square items-center justify-center border-2 font-mono transition-colors ${
                              size === 3
                                ? "text-2xl sm:text-3xl"
                                : "text-sm sm:text-base"
                            } ${cellStyle}`}
                          >
                            {val > 0 ? val : ""}
                            {isGiven && (
                              <span className="absolute right-1 top-1 h-1.5 w-1.5 bg-[#171820]" />
                            )}
                          </button>
                        );
                      })}

                      <div
                        title={`Row ${r + 1} Sum (Target: ${puzzle.targetSum})`}
                        className={`flex h-full min-h-[36px] flex-col items-center justify-center border-2 border-[#171820] px-1 font-mono text-xs font-bold ${
                          rowMatches
                            ? "bg-[#c2ed55] text-[#171820]"
                            : rowOver
                              ? "bg-[#e42c24] text-white"
                              : rowHinted
                                ? "bg-[#f6d52b] text-[#171820]"
                                : "bg-[#f7f7ed] text-[#171820]"
                        }`}
                      >
                        <span>{rowTotal}</span>
                        <span className="text-[9px] opacity-75">
                          /{puzzle.targetSum}
                        </span>
                      </div>
                    </div>
                  );
                })}

                {analysis.colSums.map((colTotal, c) => {
                  const colComplete = analysis.colBlanks[c] === 0;
                  const colMatches = colComplete && colTotal === puzzle.targetSum;
                  const colOver =
                    colTotal > puzzle.targetSum ||
                    (colComplete && colTotal !== puzzle.targetSum) ||
                    Boolean(serverHighlights?.invalidCols.includes(c));
                  const colHinted = activeHint?.focusCol === c;

                  return (
                    <div
                      key={`col-sum-${c}`}
                      title={`Column ${c + 1} Sum (Target: ${puzzle.targetSum})`}
                      className={`mt-1 flex flex-col items-center justify-center border-2 border-[#171820] py-1.5 font-mono text-xs font-bold ${
                        colMatches
                          ? "bg-[#c2ed55] text-[#171820]"
                          : colOver
                            ? "bg-[#e42c24] text-white"
                            : colHinted
                              ? "bg-[#f6d52b] text-[#171820]"
                              : "bg-[#f7f7ed] text-[#171820]"
                      }`}
                    >
                      <span>{colTotal}</span>
                      <span className="text-[9px] opacity-75">
                        /{puzzle.targetSum}
                      </span>
                    </div>
                  );
                })}

                <div className="mt-1 flex items-center justify-center border-2 border-[#171820] bg-[#171820] py-1.5 font-mono text-[10px] font-bold text-[#f6d52b]">
                  Σ={puzzle.targetSum}
                </div>
              </div>
            </div>
          </div>

          <div className="relative z-10 mt-4 flex flex-wrap items-center justify-between gap-2 border-t-2 border-[#171820]/15 pt-3 text-[11px] font-medium text-[#465032]">
            <span>
              Click an empty cell &amp; type numbers (Arrow keys navigate, Backspace clears).
            </span>
            <button
              type="button"
              onClick={() =>
                downloadWatermarkedPuzzlePng({
                  puzzle,
                  grid,
                  isSolved: Boolean(successData) || puzzle.status === "SUBMITTED",
                })
              }
              className="pixel-btn light !px-3 !py-1.5 !text-xs"
            >
              <Download className="h-3.5 w-3.5" />
              DOWNLOAD PNG
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <div className="border-2 border-[#171820] bg-white p-4 shadow-[4px_4px_0_#171820]">
            <div className="mb-2.5 flex items-center justify-between">
              <h4 className="eyebrow font-bold text-[#171820]">
                NUMBERS (1–{maxVal})
              </h4>
              <span className="font-mono text-xs font-bold text-[#e42c24]">
                {analysis.remainingNumbers.length} LEFT
              </span>
            </div>

            <div
              className={`grid gap-1.5 ${
                size === 3
                  ? "grid-cols-3"
                  : "max-h-52 grid-cols-6 overflow-y-auto pr-1"
              }`}
            >
              {Array.from({ length: maxVal }, (_, idx) => idx + 1).map((num) => {
                const isUsed = analysis.usedValues.has(num);
                const isDupe = analysis.duplicateValues.has(num);

                return (
                  <button
                    key={num}
                    type="button"
                    disabled={isAlreadyLocked || !selected}
                    onClick={() => {
                      if (selected) {
                        setTypingBuffer("");
                        setCellValue(selected.row, selected.col, num);
                      }
                    }}
                    className={`border-2 border-[#171820] py-1.5 font-mono text-xs font-bold transition ${
                      isDupe
                        ? "bg-[#e42c24] text-white"
                        : isUsed
                          ? "border-[#171820]/25 bg-[#ecece0] text-[#78834b] line-through"
                          : "bg-[#f7f7ed] text-[#171820] hover:bg-[#c2ed55] disabled:opacity-50"
                    }`}
                  >
                    {num}
                  </button>
                );
              })}
            </div>

            {!selected && !isAlreadyLocked && (
              <p className="mt-2 text-[11px] font-medium text-[#535744]">
                Select an empty cell on the board to place a number.
              </p>
            )}

            <div className="mt-3 grid grid-cols-2 gap-2">
              <button
                type="button"
                disabled={isAlreadyLocked || !selected}
                onClick={handleClearCell}
                className="pixel-btn light !px-3 !py-2 !text-xs"
              >
                <Eraser className="h-3.5 w-3.5" />
                CLEAR
              </button>
              <button
                type="button"
                disabled={isAlreadyLocked}
                onClick={handleResetPuzzle}
                className="pixel-btn light !px-3 !py-2 !text-xs"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                RESET
              </button>
            </div>
          </div>

          <div className="border-2 border-[#171820] bg-[#f6d52b] p-4 shadow-[4px_4px_0_#171820]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 font-mono text-xs font-bold uppercase text-[#171820]">
                <Lightbulb className="h-4 w-4" />
                HINTS (1–4)
              </div>
              <div className="flex gap-1">
                {([1, 2, 3, 4] as const).map((lvl) => (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => setHintLevel(hintLevel === lvl ? 0 : lvl)}
                    className={`h-7 w-7 border-2 border-[#171820] font-mono text-xs font-bold transition ${
                      hintLevel === lvl
                        ? "bg-[#171820] text-[#c2ed55]"
                        : "bg-[#f7f7ed] text-[#171820] hover:bg-[#c2ed55]"
                    }`}
                  >
                    {lvl}
                  </button>
                ))}
              </div>
            </div>

            {activeHint ? (
              <div className="mt-3 border-2 border-[#171820] bg-[#f7f7ed] p-3">
                <div className="text-xs font-black text-[#171820]">
                  {activeHint.title}
                </div>
                <p className="mt-1 text-xs leading-relaxed text-[#465032]">
                  {activeHint.body}
                </p>
              </div>
            ) : (
              <p className="mt-2 text-xs font-medium text-[#394127]">
                Click Hint 1–4 for step-by-step constraint deduction without revealing the
                solution.
              </p>
            )}
          </div>

          {!isAlreadyLocked && (
            <button
              type="button"
              onClick={handleSubmitPuzzle}
              disabled={submitting}
              className="pixel-btn red w-full !py-3.5 text-sm"
            >
              <Send className="h-4 w-4" />
              {submitting ? "VERIFYING ON SERVER..." : "SUBMIT PUZZLE SOLUTION"}
            </button>
          )}
        </div>
      </div>

      <AnimatePresence>
        {errorMsg && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="flex items-start gap-3 border-2 border-[#171820] bg-[#e42c24] p-4 text-white shadow-[4px_4px_0_#171820]"
          >
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
            <div>
              <div className="text-sm font-black uppercase">
                Puzzle Validation Failed
              </div>
              <p className="mt-0.5 text-xs font-medium text-white/95">{errorMsg}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

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
