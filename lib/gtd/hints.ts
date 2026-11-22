export type Grid = number[][];

export interface BoardAnalysis {
  size: 3 | 9;
  targetSum: number;
  maxVal: number;
  rowSums: number[];
  colSums: number[];
  rowBlanks: number[];
  colBlanks: number[];
  duplicateValues: Set<number>;
  usedValues: Set<number>;
  remainingNumbers: number[];
  filledEditableCount: number;
  totalEditableCount: number;
  progressPercent: number;
}

export function analyzeBoard(
  grid: Grid,
  initialGrid: Grid,
  size: 3 | 9,
  targetSum: number
): BoardAnalysis {
  const maxVal = size * size;
  const rowSums = Array(size).fill(0) as number[];
  const colSums = Array(size).fill(0) as number[];
  const rowBlanks = Array(size).fill(0) as number[];
  const colBlanks = Array(size).fill(0) as number[];
  const counts = new Map<number, number>();

  let totalEditableCount = 0;
  let filledEditableCount = 0;

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      const initVal = initialGrid[r]?.[c] ?? 0;
      const val = grid[r]?.[c] ?? 0;

      if (initVal === 0) {
        totalEditableCount++;
        if (val > 0) filledEditableCount++;
      }

      if (val === 0) {
        rowBlanks[r]++;
        colBlanks[c]++;
      } else {
        rowSums[r] += val;
        colSums[c] += val;
        counts.set(val, (counts.get(val) ?? 0) + 1);
      }
    }
  }

  const duplicateValues = new Set<number>();
  const usedValues = new Set<number>();
  for (const [val, count] of counts.entries()) {
    if (val >= 1 && val <= maxVal) {
      usedValues.add(val);
      if (count > 1) duplicateValues.add(val);
    }
  }

  const remainingNumbers: number[] = [];
  for (let v = 1; v <= maxVal; v++) {
    if (!usedValues.has(v)) remainingNumbers.push(v);
  }

  const progressPercent =
    totalEditableCount === 0
      ? 100
      : Math.round((filledEditableCount / totalEditableCount) * 100);

  return {
    size,
    targetSum,
    maxVal,
    rowSums,
    colSums,
    rowBlanks,
    colBlanks,
    duplicateValues,
    usedValues,
    remainingNumbers,
    filledEditableCount,
    totalEditableCount,
    progressPercent,
  };
}

export interface ProgressiveHint {
  level: 1 | 2 | 3 | 4;
  title: string;
  body: string;
  focusRow?: number;
  focusCol?: number;
}

export function buildProgressiveHint(
  grid: Grid,
  initialGrid: Grid,
  size: 3 | 9,
  targetSum: number,
  level: 1 | 2 | 3 | 4
): ProgressiveHint {
  const analysis = analyzeBoard(grid, initialGrid, size, targetSum);

  if (analysis.duplicateValues.size > 0) {
    const dupes = Array.from(analysis.duplicateValues).sort((a, b) => a - b);
    return {
      level,
      title: "Resolve Duplicate Numbers First",
      body: `Duplicate value(s) detected: ${dupes.join(", ")}. Every number from 1 to ${analysis.maxVal} must appear exactly once on the entire board before row and column sums can balance.`,
    };
  }

  if (level === 1) {
    const preview =
      analysis.remainingNumbers.length <= 12
        ? analysis.remainingNumbers.join(", ")
        : `${analysis.remainingNumbers.slice(0, 10).join(", ")} ... (${analysis.remainingNumbers.length} total)`;
    return {
      level: 1,
      title: "Hint 1: Identify Missing Numbers",
      body:
        analysis.remainingNumbers.length === 0
          ? `All numbers 1–${analysis.maxVal} are placed! Double-check any row or column whose sum is not ${targetSum}.`
          : `You still need to place ${analysis.remainingNumbers.length} unique number(s): ${preview}. Keep this pool in mind — only numbers from this list can go into blank cells.`,
    };
  }

  if (level === 2) {
    let bestRow = -1;
    let minBlanks = size + 1;
    for (let r = 0; r < size; r++) {
      if (analysis.rowBlanks[r] > 0 && analysis.rowBlanks[r] < minBlanks) {
        minBlanks = analysis.rowBlanks[r];
        bestRow = r;
      }
    }
    if (bestRow === -1) {
      const badRow = analysis.rowSums.findIndex((s) => s !== targetSum);
      return {
        level: 2,
        title: "Hint 2: Audit Completed Rows",
        body:
          badRow !== -1
            ? `Row ${badRow + 1} currently sums to ${analysis.rowSums[badRow]}, which is ${Math.abs(targetSum - analysis.rowSums[badRow])} ${analysis.rowSums[badRow] > targetSum ? "above" : "below"} the target of ${targetSum}. Try swapping editable numbers with another mismatched row.`
            : `Every row already sums to ${targetSum}! Now check your vertical columns.`,
        focusRow: badRow !== -1 ? badRow : undefined,
      };
    }

    const deficit = targetSum - analysis.rowSums[bestRow];
    return {
      level: 2,
      title: "Hint 2: Examine the Most Constrained Row",
      body:
        minBlanks === 1
          ? `Row ${bestRow + 1} has only 1 empty cell left and currently sums to ${analysis.rowSums[bestRow]}. Subtract ${analysis.rowSums[bestRow]} from ${targetSum} to find the exact missing number for that row!`
          : `Row ${bestRow + 1} has ${minBlanks} empty cells left and needs a combined sum of ${deficit} (Target ${targetSum} − Current ${analysis.rowSums[bestRow]}). Look for combinations of ${minBlanks} unused numbers that add up to ${deficit}.`,
      focusRow: bestRow,
    };
  }

  if (level === 3) {
    let bestCol = -1;
    let minBlanks = size + 1;
    for (let c = 0; c < size; c++) {
      if (analysis.colBlanks[c] > 0 && analysis.colBlanks[c] < minBlanks) {
        minBlanks = analysis.colBlanks[c];
        bestCol = c;
      }
    }
    if (bestCol === -1) {
      const badCol = analysis.colSums.findIndex((s) => s !== targetSum);
      return {
        level: 3,
        title: "Hint 3: Audit Completed Columns",
        body:
          badCol !== -1
            ? `Column ${bestCol + 1} currently sums to ${analysis.colSums[badCol]} instead of ${targetSum}. Look for a pair of editable cells in mismatched columns whose difference fixes both sums.`
            : `Every column already sums to ${targetSum}! Verify all rows and submit when ready.`,
        focusCol: badCol !== -1 ? badCol : undefined,
      };
    }

    const deficit = targetSum - analysis.colSums[bestCol];
    return {
      level: 3,
      title: "Hint 3: Examine the Most Constrained Column",
      body:
        minBlanks === 1
          ? `Column ${bestCol + 1} has only 1 empty cell left and currently sums to ${analysis.colSums[bestCol]}. Subtract ${analysis.colSums[bestCol]} from ${targetSum} to determine the only valid number for that cell.`
          : `Column ${bestCol + 1} has ${minBlanks} empty cells remaining and requires a combined sum of ${deficit} (Target ${targetSum} − Current ${analysis.colSums[bestCol]}).`,
      focusCol: bestCol,
    };
  }

  let bestR = -1;
  let bestC = -1;
  let bestScore = size * 3;
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if ((grid[r]?.[c] ?? 0) === 0) {
        const score = analysis.rowBlanks[r] + analysis.colBlanks[c];
        if (score < bestScore) {
          bestScore = score;
          bestR = r;
          bestC = c;
        }
      }
    }
  }

  if (bestR === -1) {
    return {
      level: 4,
      title: "Hint 4: Intersecting Row & Column Check",
      body: `All cells are filled. Find any cell that sits at the intersection of a row and column that are both off from ${targetSum} — adjusting that intersection fixes both totals simultaneously.`,
    };
  }

  const rowNeed = targetSum - analysis.rowSums[bestR];
  const colNeed = targetSum - analysis.colSums[bestC];
  return {
    level: 4,
    title: "Hint 4: Compare Intersecting Row & Column Constraints",
    body: `Focus on Row ${bestR + 1}, Column ${bestC + 1}. Row ${bestR + 1} needs ${rowNeed} across ${analysis.rowBlanks[bestR]} blank(s), while Column ${bestC + 1} needs ${colNeed} across ${analysis.colBlanks[bestC]} blank(s). Compare which unused numbers can satisfy BOTH the row total and column total simultaneously.`,
    focusRow: bestR,
    focusCol: bestC,
  };
}
