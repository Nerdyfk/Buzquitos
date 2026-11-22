import crypto from "node:crypto";

export type GridSize = 3 | 9;
export type Grid = number[][];

export interface GeneratedPuzzle {
  gridSize: GridSize;
  targetSum: number;
  initialGrid: Grid;
  solution: Grid;
  blankCount: number;
}

export interface SolutionCountResult {
  count: number;
  indeterminate: boolean;
  nodesVisited: number;
}

export interface ValidationResult {
  valid: boolean;
  reason?: string;
  emptyCells: Array<{ row: number; col: number }>;
  outOfRangeCells: Array<{ row: number; col: number }>;
  duplicateCells: Array<{ row: number; col: number }>;
  invalidRows: number[];
  invalidCols: number[];
  mismatchedCells: Array<{ row: number; col: number }>;
}

export function getTargetSum(size: GridSize): number {
  return (size * (size * size + 1)) / 2; // 3 -> 15, 9 -> 369
}

function cryptoShuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = crypto.randomInt(0, i + 1);
    const tmp = copy[i];
    copy[i] = copy[j];
    copy[j] = tmp;
  }
  return copy;
}

function cloneGrid(grid: Grid): Grid {
  return grid.map((row) => [...row]);
}

function generateValid3x3Board(): Grid {
  const base: Grid = [
    [8, 1, 6],
    [3, 5, 7],
    [4, 9, 2],
  ];

  let board = cloneGrid(base);

  if (crypto.randomInt(0, 2) === 1) {
    board = board[0].map((_, c) => board.map((row) => row[c]));
  }
  if (crypto.randomInt(0, 2) === 1) {
    board = board.map((row) => row.map((v) => 10 - v));
  }

  const rowOrder = cryptoShuffle([0, 1, 2]);
  const colOrder = cryptoShuffle([0, 1, 2]);

  return rowOrder.map((r) => colOrder.map((c) => board[r][c]));
}

function generateValid9x9Board(): Grid {
  let board: Grid;

  if (crypto.randomInt(0, 4) === 0) {
    board = Array.from({ length: 9 }, () => Array(9).fill(0));
    let r = 0;
    let c = 4;
    for (let num = 1; num <= 81; num++) {
      board[r][c] = num;
      const nr = (r + 8) % 9;
      const nc = (c + 1) % 9;
      if (board[nr][nc] !== 0) {
        r = (r + 1) % 9;
      } else {
        r = nr;
        c = nc;
      }
    }
  } else {
    const A = generateValid3x3Board().map((row) => row.map((v) => v - 1));
    const B = generateValid3x3Board().map((row) => row.map((v) => v - 1));
    board = Array.from({ length: 9 }, () => Array(9).fill(0));
    for (let r1 = 0; r1 < 3; r1++) {
      for (let c1 = 0; c1 < 3; c1++) {
        for (let r2 = 0; r2 < 3; r2++) {
          for (let c2 = 0; c2 < 3; c2++) {
            board[3 * r1 + r2][3 * c1 + c2] = 9 * A[r1][c1] + B[r2][c2] + 1;
          }
        }
      }
    }
  }

  if (crypto.randomInt(0, 2) === 1) {
    board = board[0].map((_, c) => board.map((row) => row[c]));
  }
  if (crypto.randomInt(0, 2) === 1) {
    board = board.map((row) => row.map((v) => 82 - v));
  }

  const rowOrder = cryptoShuffle([0, 1, 2, 3, 4, 5, 6, 7, 8]);
  const colOrder = cryptoShuffle([0, 1, 2, 3, 4, 5, 6, 7, 8]);

  return rowOrder.map((r) => colOrder.map((c) => board[r][c]));
}

export function generateCompletedBoard(size: GridSize): Grid {
  const board = size === 3 ? generateValid3x3Board() : generateValid9x9Board();
  const check = validateCompletedGrid(board, size, getTargetSum(size));
  if (!check.valid) {
    throw new Error(`Internal generator error: ${check.reason}`);
  }
  return board;
}

export function countSolutions(
  initialGrid: Grid,
  size: GridSize,
  targetSum: number = getTargetSum(size),
  limit = 2,
  maxNodes = 60000
): SolutionCountResult {
  const maxVal = size * size;
  const grid = cloneGrid(initialGrid);
  const used = new Uint8Array(maxVal + 1);
  const rowSum = new Int32Array(size);
  const colSum = new Int32Array(size);
  const rowBlanks = new Int32Array(size);
  const colBlanks = new Int32Array(size);

  let totalBlanks = 0;

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      const v = grid[r][c];
      if (v === 0) {
        rowBlanks[r]++;
        colBlanks[c]++;
        totalBlanks++;
      } else {
        if (v < 1 || v > maxVal || used[v]) {
          return { count: 0, indeterminate: false, nodesVisited: 0 };
        }
        used[v] = 1;
        rowSum[r] += v;
        colSum[c] += v;
      }
    }
  }

  for (let i = 0; i < size; i++) {
    if (rowBlanks[i] === 0 && rowSum[i] !== targetSum) {
      return { count: 0, indeterminate: false, nodesVisited: 0 };
    }
    if (colBlanks[i] === 0 && colSum[i] !== targetSum) {
      return { count: 0, indeterminate: false, nodesVisited: 0 };
    }
  }

  let solutions = 0;
  let nodesVisited = 0;
  let indeterminate = false;

  function checkAllLineBounds(): boolean {
    const unused: number[] = [];
    for (let v = 1; v <= maxVal; v++) {
      if (!used[v]) unused.push(v);
    }

    const uLen = unused.length;
    if (uLen !== totalBlanks) return false;
    if (uLen === 0) return true;

    const minPrefix = new Int32Array(size + 1);
    const maxPrefix = new Int32Array(size + 1);
    const maxK = Math.min(size, uLen);
    for (let k = 1; k <= maxK; k++) {
      minPrefix[k] = minPrefix[k - 1] + unused[k - 1];
      maxPrefix[k] = maxPrefix[k - 1] + unused[uLen - k];
    }

    for (let i = 0; i < size; i++) {
      const rb = rowBlanks[i];
      if (rb === 0) {
        if (rowSum[i] !== targetSum) return false;
      } else {
        const needed = targetSum - rowSum[i];
        if (needed < minPrefix[rb] || needed > maxPrefix[rb]) return false;
      }

      const cb = colBlanks[i];
      if (cb === 0) {
        if (colSum[i] !== targetSum) return false;
      } else {
        const needed = targetSum - colSum[i];
        if (needed < minPrefix[cb] || needed > maxPrefix[cb]) return false;
      }
    }

    return true;
  }

  function place(r: number, c: number, v: number): void {
    grid[r][c] = v;
    used[v] = 1;
    rowSum[r] += v;
    colSum[c] += v;
    rowBlanks[r]--;
    colBlanks[c]--;
    totalBlanks--;
  }

  function unplace(r: number, c: number, v: number): void {
    grid[r][c] = 0;
    used[v] = 0;
    rowSum[r] -= v;
    colSum[c] -= v;
    rowBlanks[r]++;
    colBlanks[c]++;
    totalBlanks++;
  }

  function search(): void {
    if (solutions >= limit || indeterminate) return;
    nodesVisited++;
    if (nodesVisited > maxNodes) {
      indeterminate = true;
      return;
    }

    const forcedStack: Array<[number, number, number]> = [];
    let contradiction = false;

    let progress = true;
    while (progress && !contradiction) {
      progress = false;

      for (let r = 0; r < size; r++) {
        if (rowBlanks[r] === 1) {
          const needed = targetSum - rowSum[r];
          if (needed < 1 || needed > maxVal || used[needed]) {
            contradiction = true;
            break;
          }
          let targetCol = -1;
          for (let c = 0; c < size; c++) {
            if (grid[r][c] === 0) {
              targetCol = c;
              break;
            }
          }
          if (targetCol === -1) {
            contradiction = true;
            break;
          }
          if (colBlanks[targetCol] === 1 && colSum[targetCol] + needed !== targetSum) {
            contradiction = true;
            break;
          }
          place(r, targetCol, needed);
          forcedStack.push([r, targetCol, needed]);
          progress = true;
        }
      }

      if (contradiction) break;

      for (let c = 0; c < size; c++) {
        if (colBlanks[c] === 1) {
          const needed = targetSum - colSum[c];
          if (needed < 1 || needed > maxVal || used[needed]) {
            contradiction = true;
            break;
          }
          let targetRow = -1;
          for (let r = 0; r < size; r++) {
            if (grid[r][c] === 0) {
              targetRow = r;
              break;
            }
          }
          if (targetRow === -1) {
            contradiction = true;
            break;
          }
          if (rowBlanks[targetRow] === 1 && rowSum[targetRow] + needed !== targetSum) {
            contradiction = true;
            break;
          }
          place(targetRow, c, needed);
          forcedStack.push([targetRow, c, needed]);
          progress = true;
        }
      }
    }

    if (!contradiction && checkAllLineBounds()) {
      if (totalBlanks === 0) {
        solutions++;
      } else {
        let bestR = -1;
        let bestC = -1;
        let bestMin = size + 1;
        let bestSum = size * 2 + 1;

        for (let r = 0; r < size; r++) {
          if (rowBlanks[r] === 0) continue;
          for (let c = 0; c < size; c++) {
            if (grid[r][c] !== 0) continue;
            const m = Math.min(rowBlanks[r], colBlanks[c]);
            const s = rowBlanks[r] + colBlanks[c];
            if (m < bestMin || (m === bestMin && s < bestSum)) {
              bestMin = m;
              bestSum = s;
              bestR = r;
              bestC = c;
            }
          }
        }

        if (bestR !== -1 && bestC !== -1) {
          const unused: number[] = [];
          for (let v = 1; v <= maxVal; v++) {
            if (!used[v]) unused.push(v);
          }

          const remRowOther = rowBlanks[bestR] - 1;
          const remColOther = colBlanks[bestC] - 1;

          let minOthersR = 0;
          let maxOthersR = 0;
          for (let k = 0; k < remRowOther; k++) {
            minOthersR += unused[k];
            maxOthersR += unused[unused.length - 1 - k];
          }
          let minOthersC = 0;
          let maxOthersC = 0;
          for (let k = 0; k < remColOther; k++) {
            minOthersC += unused[k];
            maxOthersC += unused[unused.length - 1 - k];
          }

          const lowR = targetSum - rowSum[bestR] - maxOthersR;
          const highR = targetSum - rowSum[bestR] - minOthersR;
          const lowC = targetSum - colSum[bestC] - maxOthersC;
          const highC = targetSum - colSum[bestC] - minOthersC;

          const low = Math.max(1, lowR, lowC);
          const high = Math.min(maxVal, highR, highC);

          for (let idx = 0; idx < unused.length; idx++) {
            const v = unused[idx];
            if (v < low) continue;
            if (v > high) break;

            if (rowBlanks[bestR] === 2) {
              const partnerR = targetSum - rowSum[bestR] - v;
              if (
                partnerR < 1 ||
                partnerR > maxVal ||
                partnerR === v ||
                used[partnerR]
              ) {
                continue;
              }
            }
            if (colBlanks[bestC] === 2) {
              const partnerC = targetSum - colSum[bestC] - v;
              if (
                partnerC < 1 ||
                partnerC > maxVal ||
                partnerC === v ||
                used[partnerC]
              ) {
                continue;
              }
            }

            place(bestR, bestC, v);
            search();
            unplace(bestR, bestC, v);

            if (solutions >= limit || indeterminate) break;
          }
        }
      }
    }

    for (let i = forcedStack.length - 1; i >= 0; i--) {
      const [fr, fc, fv] = forcedStack[i];
      unplace(fr, fc, fv);
    }
  }

  search();

  return {
    count: solutions,
    indeterminate,
    nodesVisited,
  };
}

export function generateUniquePuzzle(
  size: GridSize,
  desiredBlanks?: number
): GeneratedPuzzle {
  const targetSum = getTargetSum(size);
  const targetBlanks =
    desiredBlanks ??
    (size === 3 ? crypto.randomInt(4, 6) : crypto.randomInt(15, 19));
  const minAcceptedBlanks = size === 3 ? 4 : 12;

  for (let attempt = 0; attempt < 25; attempt++) {
    const solution = generateCompletedBoard(size);
    const puzzle = cloneGrid(solution);

    const coords: Array<[number, number]> = [];
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        coords.push([r, c]);
      }
    }

    const shuffledCoords = cryptoShuffle(coords);
    let blanks = 0;

    for (const [r, c] of shuffledCoords) {
      if (blanks >= targetBlanks) break;

      const backup = puzzle[r][c];
      puzzle[r][c] = 0;

      const check = countSolutions(
        puzzle,
        size,
        targetSum,
        2,
        size === 3 ? 10000 : 12000
      );

      if (!check.indeterminate && check.count === 1) {
        blanks++;
      } else {
        puzzle[r][c] = backup;
      }
    }

    if (blanks >= minAcceptedBlanks) {
      const finalCheck = countSolutions(
        puzzle,
        size,
        targetSum,
        2,
        size === 3 ? 50000 : 100000
      );

      const solutionCheck = validateCompletedGrid(
        solution,
        size,
        targetSum,
        puzzle,
        solution
      );

      if (!finalCheck.indeterminate && finalCheck.count === 1 && solutionCheck.valid) {
        return {
          gridSize: size,
          targetSum,
          initialGrid: puzzle,
          solution,
          blankCount: blanks,
        };
      }
    }
  }

  throw new Error(
    `Failed to generate a guaranteed unique ${size}x${size} puzzle after retries.`
  );
}

export function validateCompletedGrid(
  submitted: Grid,
  size: GridSize,
  targetSum: number = getTargetSum(size),
  initialGrid?: Grid,
  expectedSolution?: Grid
): ValidationResult {
  const maxVal = size * size;
  const emptyCells: Array<{ row: number; col: number }> = [];
  const outOfRangeCells: Array<{ row: number; col: number }> = [];
  const duplicateCells: Array<{ row: number; col: number }> = [];
  const invalidRows: number[] = [];
  const invalidCols: number[] = [];
  const mismatchedCells: Array<{ row: number; col: number }> = [];

  if (
    !Array.isArray(submitted) ||
    submitted.length !== size ||
    submitted.some((row) => !Array.isArray(row) || row.length !== size)
  ) {
    return {
      valid: false,
      reason: `Submitted grid must be exactly ${size}x${size}.`,
      emptyCells,
      outOfRangeCells,
      duplicateCells,
      invalidRows,
      invalidCols,
      mismatchedCells,
    };
  }

  const seenPositions = new Map<number, Array<{ row: number; col: number }>>();

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      const val = submitted[r][c];
      if (val === null || val === undefined || val === 0 || Number.isNaN(val)) {
        emptyCells.push({ row: r, col: c });
        continue;
      }
      if (!Number.isInteger(val) || val < 1 || val > maxVal) {
        outOfRangeCells.push({ row: r, col: c });
        continue;
      }

      if (initialGrid && initialGrid[r][c] !== 0 && initialGrid[r][c] !== val) {
        mismatchedCells.push({ row: r, col: c });
      }

      const list = seenPositions.get(val) ?? [];
      list.push({ row: r, col: c });
      seenPositions.set(val, list);
    }
  }

  for (const positions of seenPositions.values()) {
    if (positions.length > 1) {
      duplicateCells.push(...positions);
    }
  }

  for (let r = 0; r < size; r++) {
    const sum = submitted[r].reduce((acc, v) => acc + (Number.isInteger(v) ? v : 0), 0);
    if (sum !== targetSum) {
      invalidRows.push(r);
    }
  }

  for (let c = 0; c < size; c++) {
    let sum = 0;
    for (let r = 0; r < size; r++) {
      const v = submitted[r][c];
      sum += Number.isInteger(v) ? v : 0;
    }
    if (sum !== targetSum) {
      invalidCols.push(c);
    }
  }

  if (expectedSolution) {
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        if (submitted[r][c] !== expectedSolution[r][c]) {
          if (!mismatchedCells.some((cell) => cell.row === r && cell.col === c)) {
            mismatchedCells.push({ row: r, col: c });
          }
        }
      }
    }
  }

  if (emptyCells.length > 0) {
    return {
      valid: false,
      reason: `${emptyCells.length} cell(s) are still empty. Fill every cell before submitting.`,
      emptyCells,
      outOfRangeCells,
      duplicateCells,
      invalidRows,
      invalidCols,
      mismatchedCells: [],
    };
  }

  if (outOfRangeCells.length > 0) {
    return {
      valid: false,
      reason: `All numbers must be whole integers between 1 and ${maxVal}.`,
      emptyCells,
      outOfRangeCells,
      duplicateCells,
      invalidRows,
      invalidCols,
      mismatchedCells: [],
    };
  }

  if (duplicateCells.length > 0) {
    return {
      valid: false,
      reason: `Duplicate numbers detected. Every integer from 1 to ${maxVal} must appear exactly once.`,
      emptyCells,
      outOfRangeCells,
      duplicateCells,
      invalidRows,
      invalidCols,
      mismatchedCells: [],
    };
  }

  if (invalidRows.length > 0 || invalidCols.length > 0) {
    return {
      valid: false,
      reason: `Every row and every column must sum to exactly ${targetSum}. Check the highlighted rows and columns.`,
      emptyCells,
      outOfRangeCells,
      duplicateCells,
      invalidRows,
      invalidCols,
      mismatchedCells: [],
    };
  }

  if (mismatchedCells.length > 0) {
    return {
      valid: false,
      reason: `Your grid does not match the unique solution for this puzzle. Re-check the highlighted cells.`,
      emptyCells,
      outOfRangeCells,
      duplicateCells,
      invalidRows,
      invalidCols,
      mismatchedCells,
    };
  }

  return {
    valid: true,
    emptyCells: [],
    outOfRangeCells: [],
    duplicateCells: [],
    invalidRows: [],
    invalidCols: [],
    mismatchedCells: [],
  };
}
