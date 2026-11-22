import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { getGtdCollections } from "@/lib/gtd/mongodb";
import { getPublicCampaignSnapshot } from "@/lib/gtd/campaign";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireAdmin();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.message }, { status: auth.status });
  }

  try {
    const { users, puzzles, submissions } = await getGtdCollections();

    const [
      totalUsers,
      totalPuzzlesGenerated,
      totalPuzzlesSolved,
      totalClaimsSubmitted,
      pendingCount,
      proofRequestedCount,
      approvedUsers,
      rejectedUsers,
      campaign,
    ] = await Promise.all([
      users.countDocuments(),
      puzzles.countDocuments(),
      puzzles.countDocuments({ status: { $in: ["COMPLETED", "SUBMITTED"] } }),
      submissions.countDocuments(),
      submissions.countDocuments({ status: "PENDING_VERIFICATION" }),
      submissions.countDocuments({ status: "ADDITIONAL_PROOF_REQUESTED" }),
      submissions.countDocuments({ status: "APPROVED" }),
      submissions.countDocuments({ status: "REJECTED" }),
      getPublicCampaignSnapshot(),
    ]);

    return NextResponse.json({
      admin: { email: auth.user.email },
      overview: {
        totalUsers,
        totalPuzzlesGenerated,
        totalPuzzlesSolved,
        totalClaimsSubmitted,
        pendingVerification: pendingCount + proofRequestedCount,
        pendingInitialReview: pendingCount,
        proofRequestedCount,
        approvedUsers,
        rejectedUsers,
        remainingSpots: campaign.remainingSpots,
        occupiedSpots: campaign.occupiedSpots,
        maxWinners: campaign.maxWinners,
        campaignStatus: campaign.status,
      },
      campaign,
    });
  } catch (err) {
    console.error("GET /api/gtd/admin/overview error:", err);
    return NextResponse.json(
      { error: "Failed to load admin overview." },
      { status: 500 }
    );
  }
}
