import { NextRequest, NextResponse } from "next/server";
import { getGtdCollections } from "@/lib/gtd/mongodb";
import { getUserSession } from "@/lib/gtd/auth";
import { validateCompletedGrid } from "@/lib/gtd/engine";
import {
  checkRateLimit,
  getClientIp,
  verifyCsrfOrigin,
} from "@/lib/gtd/security";
import { getPublicCampaignSnapshot } from "@/lib/gtd/campaign";

export async function POST(req: NextRequest) {
  try {
    if (!verifyCsrfOrigin(req)) {
      return NextResponse.json(
        { error: "Invalid request origin." },
        { status: 403 }
      );
    }

    const ip = getClientIp(req);
    const rl = checkRateLimit(`gtd:puzzle:verify:${ip}`, 30, 60_000);
    if (!rl.allowed) {
      return NextResponse.json(
        {
          error: `Too many verification attempts. Try again in ${rl.retryAfterSeconds}s.`,
        },
        { status: 429 }
      );
    }

    const session = await getUserSession();
    if (!session) {
      return NextResponse.json(
        {
          error:
            "Active puzzle session not found. Please generate your puzzle first.",
        },
        { status: 401 }
      );
    }

    const body = (await req.json().catch(() => null)) as {
      puzzleId?: unknown;
      grid?: unknown;
      submittedWord?: unknown;
    } | null;

    if (!body || typeof body.puzzleId !== "string") {
      return NextResponse.json(
        { error: "Invalid puzzle verification payload." },
        { status: 400 }
      );
    }

    const { puzzles, users } = await getGtdCollections();
    const puzzle = await puzzles.findOne({ _id: body.puzzleId });

    if (!puzzle) {
      return NextResponse.json({ error: "Puzzle not found." }, { status: 404 });
    }

    if (
      puzzle.userId !== session.uid ||
      puzzle.sessionTokenHash !== session.tokenHash
    ) {
      return NextResponse.json(
        {
          error:
            "This puzzle belongs to a different Twitter/X username or browser session.",
        },
        { status: 403 }
      );
    }

    if (puzzle.status === "SUBMITTED") {
      return NextResponse.json(
        {
          code: "PUZZLE_ALREADY_USED",
          error: "This puzzle has already been submitted and cannot be used again.",
        },
        { status: 409 }
      );
    }

    await puzzles.updateOne({ _id: puzzle._id }, { $inc: { attempts: 1 } });

    // Category-specific verification
    const category = puzzle.category || "math";

    if (category === "image") {
      // For image tile puzzle: verify all 9 tiles match [0..8]
      let flatGrid: number[] = [];
      if (Array.isArray(body.grid)) {
        flatGrid = Array.isArray(body.grid[0])
          ? (body.grid as number[][]).flat()
          : (body.grid as number[]);
      }

      const isImageSolved =
        flatGrid.length === 9 && flatGrid.every((val, idx) => val === idx);

      if (!isImageSolved) {
        return NextResponse.json(
          {
            valid: false,
            error: "Image tiles are not yet in their correct solved positions.",
          },
          { status: 400 }
        );
      }
    } else if (category === "word") {
      // For word cipher puzzle: verify submitted word matches target word
      const submitted =
        typeof body.submittedWord === "string"
          ? body.submittedWord.trim().toUpperCase()
          : "";
      const expected = (puzzle.wordSolution || "").trim().toUpperCase();

      if (!submitted || submitted !== expected) {
        return NextResponse.json(
          {
            valid: false,
            error: "The decrypted word sequence is incorrect. Try rearranging the tiles.",
          },
          { status: 400 }
        );
      }
    } else {
      // For mathematical grid puzzle
      if (!Array.isArray(body.grid)) {
        return NextResponse.json(
          { error: "Invalid math grid submission." },
          { status: 400 }
        );
      }

      const validation = validateCompletedGrid(
        body.grid as number[][],
        puzzle.gridSize,
        puzzle.targetSum,
        puzzle.initialGrid,
        puzzle.solution
      );

      if (!validation.valid) {
        return NextResponse.json(
          {
            valid: false,
            error: validation.reason,
            emptyCells: validation.emptyCells,
            outOfRangeCells: validation.outOfRangeCells,
            duplicateCells: validation.duplicateCells,
            invalidRows: validation.invalidRows,
            invalidCols: validation.invalidCols,
            mismatchedCells: validation.mismatchedCells,
          },
          { status: 400 }
        );
      }
    }

    const completedAt = puzzle.completedAt ?? new Date();
    if (puzzle.status !== "COMPLETED") {
      await puzzles.updateOne(
        { _id: puzzle._id },
        { $set: { status: "COMPLETED", completedAt } }
      );
    }

    const [user, campaign] = await Promise.all([
      users.findOne(
        { _id: puzzle.userId },
        { projection: { twitterUsername: 1, displayUsername: 1 } }
      ),
      getPublicCampaignSnapshot(),
    ]);

    return NextResponse.json({
      valid: true,
      message:
        "Congratulations! You successfully solved your personalized GTD Whitelist Challenge.",
      puzzleId: puzzle._id,
      twitterUsername: user?.twitterUsername ?? session.uname,
      displayUsername: user?.displayUsername ?? session.uname,
      completedAt: completedAt.toISOString(),
      campaign,
      claimEligible: campaign.remainingSpots > 0,
    });
  } catch (err) {
    console.error("POST /api/gtd/puzzle/verify error:", err);
    return NextResponse.json(
      { error: "Unable to validate puzzle right now." },
      { status: 500 }
    );
  }
}
