import crypto from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { getGtdCollections } from "@/lib/gtd/mongodb";
import { generateUniquePuzzle } from "@/lib/gtd/engine";
import { generateSolvableShuffle } from "@/lib/gtd/image-puzzle";
import { WORD_CHALLENGES, shuffleWordLetters } from "@/lib/gtd/word-challenges";
import {
  checkRateLimit,
  generatePuzzleId,
  getClientIp,
  normalizeTwitterUsername,
  verifyCsrfOrigin,
} from "@/lib/gtd/security";
import { createUserSession, getUserSession } from "@/lib/gtd/auth";
import { getPublicCampaignSnapshot } from "@/lib/gtd/campaign";
import type { PuzzleCategory, PuzzleType } from "@/types/gtd";

export async function POST(req: NextRequest) {
  try {
    if (!verifyCsrfOrigin(req)) {
      return NextResponse.json(
        { error: "Invalid request origin." },
        { status: 403 }
      );
    }

    const ip = getClientIp(req);
    const rl = checkRateLimit(`gtd:puzzle:generate:${ip}`, 20, 60_000);
    if (!rl.allowed) {
      return NextResponse.json(
        {
          error: `Too many puzzle generation requests. Please wait ${rl.retryAfterSeconds}s.`,
        },
        { status: 429 }
      );
    }

    const body = (await req.json().catch(() => null)) as {
      twitterUsername?: unknown;
      gridSize?: unknown;
      puzzleType?: unknown;
      switchType?: unknown;
      forceNew?: unknown;
    } | null;

    if (!body || typeof body.twitterUsername !== "string") {
      return NextResponse.json(
        { error: "Please provide a valid Twitter/X username." },
        { status: 400 }
      );
    }

    const requestedType: PuzzleType =
      body.puzzleType === "image_3x3" ||
      body.puzzleType === "word_cipher" ||
      body.puzzleType === "math_9x9" ||
      body.puzzleType === "math_3x3"
        ? (body.puzzleType as PuzzleType)
        : body.gridSize === 9
        ? "math_9x9"
        : "math_3x3";

    const normalized = normalizeTwitterUsername(body.twitterUsername);
    if (!normalized) {
      return NextResponse.json(
        {
          error:
            "Invalid Twitter/X username. Use 1–15 letters, numbers, or underscores (without spaces).",
        },
        { status: 400 }
      );
    }

    const { users, puzzles, submissions } = await getGtdCollections();
    const campaign = await getPublicCampaignSnapshot();
    const now = new Date();

    await users.updateOne(
      { twitterUsername: normalized.canonical },
      {
        $set: { displayUsername: normalized.display, updatedAt: now },
        $setOnInsert: {
          _id: crypto.randomUUID(),
          twitterUsername: normalized.canonical,
          walletAddress: null,
          createdAt: now,
        },
      },
      { upsert: true }
    );

    const user = await users.findOne({ twitterUsername: normalized.canonical });
    if (!user) {
      return NextResponse.json(
        { error: "Unable to initialize participant record." },
        { status: 500 }
      );
    }

    const existingSubmission = await submissions.findOne(
      { userId: user._id },
      {
        projection: {
          _id: 1,
          submissionCode: 1,
          status: 1,
          puzzleId: 1,
          winnerId: 1,
        },
      }
    );

    if (existingSubmission) {
      return NextResponse.json(
        {
          code: "ALREADY_SUBMITTED",
          error:
            "This Twitter/X username has already completed and submitted a GTD whitelist claim.",
          submission: {
            id: existingSubmission._id,
            submissionCode: existingSubmission.submissionCode,
            status: existingSubmission.status,
            puzzleId: existingSubmission.puzzleId,
            winnerId: existingSubmission.winnerId,
          },
          campaign,
        },
        { status: 409 }
      );
    }

    const currentSession = await getUserSession();
    if (currentSession && currentSession.uid === user._id) {
      const existingSessionPuzzle = await puzzles.findOne(
        {
          userId: user._id,
          sessionTokenHash: currentSession.tokenHash,
          status: { $in: ["ACTIVE", "COMPLETED"] },
        },
        {
          sort: { createdAt: -1 },
          projection: {
            _id: 1,
            category: 1,
            puzzleType: 1,
            gridSize: 1,
            initialGrid: 1,
            targetSum: 1,
            wordChallenge: 1,
            status: 1,
            createdAt: 1,
            completedAt: 1,
          },
        }
      );

      const existingType =
        existingSessionPuzzle?.puzzleType ||
        (existingSessionPuzzle?.category === "image"
          ? "image_3x3"
          : existingSessionPuzzle?.category === "word"
          ? "word_cipher"
          : "math_3x3");

      // Only resume if existing puzzle is the EXACT same puzzleType requested AND forceNew/switchType is not set
      if (
        existingSessionPuzzle &&
        existingType === requestedType &&
        !Boolean(body.forceNew) &&
        !Boolean(body.switchType)
      ) {
        return NextResponse.json({
          resumed: true,
          puzzle: {
            puzzleId: existingSessionPuzzle._id,
            twitterUsername: user.twitterUsername,
            displayUsername: user.displayUsername,
            category: existingSessionPuzzle.category || "math",
            puzzleType: existingSessionPuzzle.puzzleType || "math_3x3",
            gridSize: existingSessionPuzzle.gridSize,
            targetSum: existingSessionPuzzle.targetSum,
            initialGrid: existingSessionPuzzle.initialGrid,
            wordChallenge: existingSessionPuzzle.wordChallenge,
            status: existingSessionPuzzle.status,
            createdAt: existingSessionPuzzle.createdAt,
            completedAt: existingSessionPuzzle.completedAt,
          },
          campaign,
        });
      } else if (existingSessionPuzzle) {
        // Switching to a different puzzle: expire any previous active/completed puzzle for this session
        await puzzles.updateMany(
          {
            userId: user._id,
            sessionTokenHash: currentSession.tokenHash,
            status: { $in: ["ACTIVE", "COMPLETED"] },
          },
          { $set: { status: "EXPIRED" } }
        );
      }
    }

    if (campaign.remainingSpots <= 0) {
      return NextResponse.json(
        {
          code: "CAMPAIGN_FULL",
          error:
            "All 500 GTD whitelist spots are currently reserved or approved. New challenges are paused unless a pending submission is rejected.",
          campaign,
        },
        { status: 409 }
      );
    }

    let category: PuzzleCategory = "math";
    let gridSize: 3 | 9 = 3;
    let initialGrid: number[][] = [];
    let solution: number[][] = [];
    let targetSum = 15;
    let wordSolution: string | undefined = undefined;
    let wordChallenge:
      | { clue: string; category: string; length: number; scrambled: string[] }
      | undefined = undefined;

    if (requestedType === "image_3x3") {
      category = "image";
      gridSize = 3;
      targetSum = 9;
      const shuffled = generateSolvableShuffle("swap");
      initialGrid = [
        [shuffled[0], shuffled[1], shuffled[2]],
        [shuffled[3], shuffled[4], shuffled[5]],
        [shuffled[6], shuffled[7], shuffled[8]],
      ];
      solution = [
        [0, 1, 2],
        [3, 4, 5],
        [6, 7, 8],
      ];
    } else if (requestedType === "word_cipher") {
      category = "word";
      gridSize = 3;
      const picked =
        WORD_CHALLENGES[Math.floor(Math.random() * WORD_CHALLENGES.length)];
      wordSolution = picked.word.toUpperCase();
      const scrambled = shuffleWordLetters(picked.word);
      wordChallenge = {
        clue: picked.clue,
        category: picked.category,
        length: picked.word.length,
        scrambled,
      };
      targetSum = picked.word.length;
      initialGrid = [scrambled.map((_, i) => i)];
      solution = [scrambled.map((_, i) => i)];
    } else {
      category = "math";
      gridSize = requestedType === "math_9x9" ? 9 : 3;
      const generated = generateUniquePuzzle(gridSize);
      initialGrid = generated.initialGrid;
      solution = generated.solution;
      targetSum = generated.targetSum;
    }

    const puzzleId = generatePuzzleId(gridSize, category);
    const { tokenHash } = await createUserSession(user._id, user.twitterUsername);

    await puzzles.insertOne({
      _id: puzzleId,
      userId: user._id,
      sessionTokenHash: tokenHash,
      category,
      puzzleType: requestedType,
      gridSize,
      initialGrid,
      solution, // SERVER-ONLY
      targetSum,
      wordSolution, // SERVER-ONLY
      wordChallenge,
      status: "ACTIVE",
      attempts: 0,
      createdAt: now,
      completedAt: null,
    });

    return NextResponse.json(
      {
        resumed: false,
        puzzle: {
          puzzleId,
          twitterUsername: user.twitterUsername,
          displayUsername: user.displayUsername,
          category,
          puzzleType: requestedType,
          gridSize,
          targetSum,
          initialGrid,
          wordChallenge,
          status: "ACTIVE",
          createdAt: now,
          completedAt: null,
        },
        campaign,
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("POST /api/gtd/puzzle/generate error:", err);
    return NextResponse.json(
      {
        error:
          "Unable to generate your personalized puzzle right now. Please try again.",
      },
      { status: 500 }
    );
  }
}
