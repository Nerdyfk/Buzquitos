export type ImagePuzzleMode = "swap" | "slide";

function countInversions(arr: number[]): number {
  let inv = 0;
  for (let i = 0; i < arr.length - 1; i++) {
    if (arr[i] === 8) continue; // ignore empty tile
    for (let j = i + 1; j < arr.length; j++) {
      if (arr[j] === 8) continue;
      if (arr[i] > arr[j]) inv++;
    }
  }
  return inv;
}

export function generateSolvableShuffle(mode: ImagePuzzleMode = "swap"): number[] {
  let tiles = Array.from({ length: 9 }, (_, i) => i);

  do {
    // Fisher-Yates shuffle
    for (let i = tiles.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [tiles[i], tiles[j]] = [tiles[j], tiles[i]];
    }

    if (mode === "slide") {
      const blankIndex = tiles.indexOf(8);
      if (blankIndex !== 8) {
        [tiles[blankIndex], tiles[8]] = [tiles[8], tiles[blankIndex]];
      }
      const inversions = countInversions(tiles);
      if (inversions % 2 !== 0) {
        const i1 = tiles[0] === 8 ? 2 : 0;
        const i2 = tiles[1] === 8 ? 2 : 1;
        [tiles[i1], tiles[i2]] = [tiles[i2], tiles[i1]];
      }
    }
  } while (tiles.every((val, idx) => val === idx));

  return tiles;
}
