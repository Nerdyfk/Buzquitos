import { NextRequest, NextResponse } from "next/server";
import { getGtdCollections, type UserDoc } from "@/lib/gtd/mongodb";
import { getUserSession } from "@/lib/gtd/auth";
import {
  checkRateLimit,
  getClientIp,
  maskWallet,
  normalizeBscWallet,
  normalizeTwitterUsername,
} from "@/lib/gtd/security";
import { getPublicCampaignSnapshot } from "@/lib/gtd/campaign";

export const dynamic = "force-dynamic";

function mapDisplayStatus(params: {
  submissionStatus?: string | null;
  puzzleStatus?: string | null;
  campaignFull: boolean;
}) {
  if (params.submissionStatus === "APPROVED") {
    return {
      code: "APPROVED",
      label: "Approved – GTD Whitelist Secured",
      description:
        "An administrator verified your puzzle completion and all social tasks. Your GTD whitelist allocation is officially confirmed.",
    };
  }
  if (params.submissionStatus === "REJECTED") {
    return {
      code: "REJECTED",
      label: "Rejected – Additional Action Required",
      description:
        "Your submission was rejected during manual review and your provisional spot was released. See the review reason below.",
    };
  }
  if (params.submissionStatus === "ADDITIONAL_PROOF_REQUESTED") {
    return {
      code: "ADDITIONAL_PROOF_REQUESTED",
      label: "Pending Admin Review – Additional Proof Requested",
      description:
        "Your provisional spot remains reserved, but an admin requested additional verification links before final approval.",
    };
  }
  if (params.submissionStatus === "PENDING_VERIFICATION") {
    return {
      code: "PENDING_ADMIN_REVIEW",
      label: "Pending Admin Review",
      description:
        "Claim submitted and provisional spot reserved. An admin is manually verifying your Twitter/X social tasks. You are not confirmed until approved.",
    };
  }
  if (params.puzzleStatus === "COMPLETED") {
    if (params.campaignFull) {
      return {
        code: "CAMPAIGN_FULL",
        label: "Campaign Full",
        description:
          "You solved your puzzle, but all 500 GTD whitelist spots are currently reserved or approved.",
      };
    }
    return {
      code: "PUZZLE_COMPLETED",
      label: "Puzzle Completed",
      description:
        "Your puzzle is solved! Complete the social tasks and submit your claim form to reserve a provisional spot.",
    };
  }
  return {
    code: "ACTIVE_PUZZLE",
    label: "Puzzle In Progress",
    description: "Complete your personalized puzzle to unlock the claiming form.",
  };
}

export async function GET(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    const rl = checkRateLimit(`gtd:status:lookup:${ip}`, 40, 60_000);
    if (!rl.allowed) {
      return NextResponse.json(
        { error: `Rate limit reached. Try again in ${rl.retryAfterSeconds}s.` },
        { status: 429 }
      );
    }

    const q = req.nextUrl.searchParams.get("q")?.trim() ?? "";
    const [{ users, puzzles, submissions }, campaign, session] =
      await Promise.all([
        getGtdCollections(),
        getPublicCampaignSnapshot(),
        getUserSession(),
      ]);

    let userRecord: UserDoc | null = null;

    if (q) {
      const upperQ = q.toUpperCase();
      const wallet = normalizeBscWallet(q);
      const handle = normalizeTwitterUsername(q);

      if (upperQ.startsWith("SUB-")) {
        const sub = await submissions.findOne({ submissionCode: upperQ });
        if (sub) userRecord = await users.findOne({ _id: sub.userId });
      } else if (upperQ.startsWith("GTD-")) {
        const p = await puzzles.findOne(
          { _id: upperQ },
          { projection: { userId: 1 } }
        );
        if (p) userRecord = await users.findOne({ _id: p.userId });
      } else if (wallet) {
        const sub = await submissions.findOne({ walletAddress: wallet });
        if (sub) userRecord = await users.findOne({ _id: sub.userId });
      } else if (handle) {
        userRecord = await users.findOne({ twitterUsername: handle.canonical });
      }
    } else if (session) {
      userRecord = await users.findOne({ _id: session.uid });
    }

    if (!userRecord) {
      return NextResponse.json(
        {
          found: false,
          error: q
            ? "No puzzle or claim record found matching that query."
            : "No active session found. Search by @username, wallet address, Submission ID, or Puzzle ID.",
          campaign,
        },
        { status: q ? 404 : 200 }
      );
    }

    const [latestPuzzle, sub] = await Promise.all([
      puzzles.findOne(
        { userId: userRecord._id },
        {
          sort: { createdAt: -1 },
          projection: { _id: 1, gridSize: 1, status: 1, completedAt: 1 },
        }
      ),
      submissions.findOne({ userId: userRecord._id }),
    ]);

    const isOwner = Boolean(session && session.uid === userRecord._id);
    const statusInfo = mapDisplayStatus({
      submissionStatus: sub?.status,
      puzzleStatus: latestPuzzle?.status,
      campaignFull: campaign.remainingSpots <= 0,
    });

    return NextResponse.json({
      found: true,
      record: {
        twitterUsername: userRecord.twitterUsername,
        displayUsername: userRecord.displayUsername,
        walletAddress: sub
          ? isOwner
            ? sub.walletAddress
            : maskWallet(sub.walletAddress)
          : null,
        puzzleId: sub?.puzzleId ?? latestPuzzle?._id ?? null,
        puzzleGridSize: latestPuzzle?.gridSize ?? null,
        puzzleCompletedAt: latestPuzzle?.completedAt ?? null,
        submissionId: sub?.submissionCode ?? null,
        submissionTimestamp: sub?.reservedAt ?? null,
        reviewedAt: sub?.reviewedAt ?? null,
        rawStatus: sub?.status ?? latestPuzzle?.status ?? "NONE",
        statusCode: statusInfo.code,
        statusLabel: statusInfo.label,
        statusDescription: statusInfo.description,
        winnerId: sub?.status === "APPROVED" ? sub.winnerId : null,
        rejectionReason: sub?.status === "REJECTED" ? sub.rejectionReason : null,
        additionalProofNote:
          sub?.status === "ADDITIONAL_PROOF_REQUESTED" ? sub.adminNotes : null,
        canSubmitAdditionalProof: sub?.status === "ADDITIONAL_PROOF_REQUESTED",
      },
      campaign,
    });
  } catch (err) {
    console.error("GET /api/gtd/status error:", err);
    return NextResponse.json(
      { error: "Unable to check status right now." },
      { status: 500 }
    );
  }
}
