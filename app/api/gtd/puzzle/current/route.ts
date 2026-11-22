import { NextResponse } from "next/server";
import { getGtdCollections } from "@/lib/gtd/mongodb";
import { getUserSession } from "@/lib/gtd/auth";
import { getPublicCampaignSnapshot } from "@/lib/gtd/campaign";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const campaign = await getPublicCampaignSnapshot();
    const session = await getUserSession();

    if (!session) {
      return NextResponse.json({ puzzle: null, submission: null, campaign });
    }

    const { users, puzzles, submissions } = await getGtdCollections();
    const user = await users.findOne(
      { _id: session.uid },
      { projection: { _id: 1, twitterUsername: 1, displayUsername: 1 } }
    );

    if (!user) {
      return NextResponse.json({ puzzle: null, submission: null, campaign });
    }

    const [puzzle, sub] = await Promise.all([
      puzzles.findOne(
        {
          userId: user._id,
          sessionTokenHash: session.tokenHash,
          status: { $in: ["ACTIVE", "COMPLETED", "SUBMITTED"] },
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
      ),
      submissions.findOne(
        { userId: user._id },
        {
          projection: {
            submissionCode: 1,
            puzzleId: 1,
            walletAddress: 1,
            status: 1,
            winnerId: 1,
            rejectionReason: 1,
            adminNotes: 1,
            reservedAt: 1,
            reviewedAt: 1,
          },
        }
      ),
    ]);

    const sanitizedSubmission = sub
      ? {
          submissionCode: sub.submissionCode,
          puzzleId: sub.puzzleId,
          walletAddress: sub.walletAddress,
          status: sub.status,
          winnerId: sub.winnerId,
          rejectionReason: sub.status === "REJECTED" ? sub.rejectionReason : null,
          proofRequestNote:
            sub.status === "ADDITIONAL_PROOF_REQUESTED" ? sub.adminNotes : null,
          reservedAt: sub.reservedAt,
          reviewedAt: sub.reviewedAt,
        }
      : null;

    return NextResponse.json({
      puzzle: puzzle
        ? {
            puzzleId: puzzle._id,
            twitterUsername: user.twitterUsername,
            displayUsername: user.displayUsername,
            category: puzzle.category || "math",
            puzzleType: puzzle.puzzleType || "math_3x3",
            gridSize: puzzle.gridSize,
            targetSum: puzzle.targetSum,
            initialGrid: puzzle.initialGrid,
            wordChallenge: puzzle.wordChallenge,
            status: puzzle.status,
            createdAt: puzzle.createdAt,
            completedAt: puzzle.completedAt,
          }
        : null,
      submission: sanitizedSubmission,
      campaign,
    });
  } catch (err) {
    console.error("GET /api/gtd/puzzle/current error:", err);
    return NextResponse.json(
      { error: "Failed to restore puzzle session." },
      { status: 500 }
    );
  }
}
