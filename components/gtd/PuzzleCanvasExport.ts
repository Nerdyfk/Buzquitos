import type { ClientPuzzle } from "@/types/gtd";

export function downloadWatermarkedPuzzlePng(params: {
  puzzle: ClientPuzzle;
  grid: number[][];
  isSolved: boolean;
}) {
  const { puzzle, grid, isSolved } = params;
  const size = puzzle.gridSize;
  const watermarkText = `@${puzzle.displayUsername}`;

  const canvasWidth = 1000;
  const canvasHeight = 1140;
  const canvas = document.createElement("canvas");
  canvas.width = canvasWidth;
  canvas.height = canvasHeight;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  ctx.fillStyle = "#c2ed55";
  ctx.fillRect(0, 0, canvasWidth, canvasHeight);

  ctx.strokeStyle = "rgba(23, 24, 32, 0.06)";
  ctx.lineWidth = 1;
  for (let x = 0; x <= canvasWidth; x += 28) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, canvasHeight);
    ctx.stroke();
  }
  for (let y = 0; y <= canvasHeight; y += 28) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(canvasWidth, y);
    ctx.stroke();
  }

  ctx.fillStyle = "#465032";
  ctx.font = "bold 18px monospace";
  ctx.fillText("BUZQUITOS GTD WHITELIST PUZZLE CHALLENGE // 500 SPOTS FCFS", 70, 68);

  ctx.fillStyle = "#171820";
  ctx.font = "900 42px sans-serif";
  ctx.fillText(`PERSONALIZED FOR ${watermarkText.toUpperCase()}`, 70, 122);

  ctx.fillStyle = "#394127";
  ctx.font = "bold 18px monospace";
  ctx.fillText(
    `ID: ${puzzle.puzzleId}  |  MODE: ${size}x${size}  |  TARGET SUM: ${puzzle.targetSum}`,
    70,
    160
  );

  const statusLabel = isSolved ? "VERIFIED SOLVED" : "IN PROGRESS";
  ctx.fillStyle = "#171820";
  ctx.fillRect(724, 54, 210, 44);
  ctx.fillStyle = isSolved ? "#f6d52b" : "#f7f7ed";
  ctx.fillRect(720, 50, 210, 44);
  ctx.strokeStyle = "#171820";
  ctx.lineWidth = 3;
  ctx.strokeRect(720, 50, 210, 44);

  ctx.fillStyle = "#171820";
  ctx.font = "bold 16px monospace";
  ctx.textAlign = "center";
  ctx.fillText(statusLabel, 825, 78);
  ctx.textAlign = "left";

  const boardX = 70;
  const boardY = 198;
  const boardSize = 860;

  ctx.fillStyle = "#171820";
  ctx.fillRect(boardX + 8, boardY + 8, boardSize, boardSize);

  ctx.save();
  ctx.fillStyle = "#f7f7ed";
  ctx.fillRect(boardX, boardY, boardSize, boardSize);
  ctx.strokeStyle = "#171820";
  ctx.lineWidth = 4;
  ctx.strokeRect(boardX, boardY, boardSize, boardSize);

  ctx.beginPath();
  ctx.rect(boardX, boardY, boardSize, boardSize);
  ctx.clip();

  ctx.save();
  ctx.translate(boardX + boardSize / 2, boardY + boardSize / 2);
  ctx.rotate(-Math.PI / 6);
  ctx.fillStyle = "rgba(23, 24, 32, 0.13)";
  ctx.font = "bold 28px monospace";
  for (let wy = -700; wy <= 700; wy += 105) {
    for (let wx = -750; wx <= 750; wx += 260) {
      ctx.fillText(watermarkText, wx + ((wy / 105) % 2 === 0 ? 0 : 120), wy);
    }
  }
  ctx.restore();

  const padding = 44;
  const gap = size === 3 ? 18 : 8;
  const innerSize = boardSize - padding * 2;
  const cellSize = (innerSize - gap * (size - 1)) / size;

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      const cx = boardX + padding + c * (cellSize + gap);
      const cy = boardY + padding + r * (cellSize + gap);
      const isGiven = puzzle.initialGrid[r][c] !== 0;
      const val = grid[r]?.[c] ?? 0;

      ctx.fillStyle = isGiven
        ? "rgba(246, 213, 43, 0.72)"
        : val > 0
          ? "rgba(194, 237, 85, 0.65)"
          : "rgba(255, 253, 244, 0.72)";
      ctx.fillRect(cx, cy, cellSize, cellSize);

      ctx.strokeStyle = "#171820";
      ctx.lineWidth = size === 3 ? 3 : 2;
      ctx.strokeRect(cx, cy, cellSize, cellSize);

      if (val > 0) {
        ctx.fillStyle = "#171820";
        ctx.font = `900 ${size === 3 ? 72 : 30}px monospace`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(String(val), cx + cellSize / 2, cy + cellSize / 2 + 2);
      }
    }
  }
  ctx.restore();

  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = "#171820";
  ctx.font = "bold 16px monospace";
  ctx.fillText(
    `BOUND TO ${watermarkText.toUpperCase()} • UNIQUE SOLUTION VERIFIED • FIRST 500 VALID CLAIMS ONLY`,
    70,
    1104
  );

  const link = document.createElement("a");
  link.download = `gtd-puzzle-${puzzle.displayUsername}-${puzzle.puzzleId}.png`;
  link.href = canvas.toDataURL("image/png");
  link.click();
}
