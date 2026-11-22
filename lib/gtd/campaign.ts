import crypto from "node:crypto";
import {
  getGtdCollections,
  isMongoDuplicateKeyError,
  runGtdTransaction,
  type CampaignDoc,
  type CampaignStatus,
  type SubmissionDoc,
} from "@/lib/gtd/mongodb";
import { generateSubmissionCode, generateWinnerId } from "@/lib/gtd/security";
import { DEFAULT_CAMPAIGN_TASKS } from "@/types/gtd";

export const PRIMARY_CAMPAIGN_ID = "primary";

export function computeCampaignStatus(
  approvedCount: number,
  reservedCount: number,
  maxWinners: number,
  isPaused = false
): CampaignStatus {
  if (isPaused) return "PAUSED";
  const occupied = approvedCount + reservedCount;
  if (occupied >= maxWinners) return "FULL";
  if (occupied >= Math.floor(maxWinners * 0.85)) return "ALMOST_FULL";
  return "ACTIVE";
}

export async function ensureCampaign(): Promise<CampaignDoc> {
  const { campaigns } = await getGtdCollections();
  const maxWinners = Number(process.env.CAMPAIGN_MAX_WINNERS || "500") || 500;
  const now = new Date();

  await campaigns.updateOne(
    { _id: PRIMARY_CAMPAIGN_ID },
    {
      $setOnInsert: {
        _id: PRIMARY_CAMPAIGN_ID,
        name: process.env.CAMPAIGN_NAME || "Buzquitos GTD Challenge",
        maxWinners,
        approvedCount: 0,
        reservedCount: 0,
        status: "ACTIVE",
        officialTwitterUrl:
          process.env.OFFICIAL_TWITTER_URL || "https://x.com/Buzquitos",
        officialTwitterHandle:
          process.env.OFFICIAL_TWITTER_HANDLE || "@Buzquitos",
        pinnedPostUrl:
          process.env.PINNED_POST_URL ||
          "https://x.com/Buzquitos/status/1890000000000000000",
        requiredHashtags:
          process.env.REQUIRED_HASHTAGS ||
          "#Buzquitos #GTDWhitelist #GTDChallenge",
        defaultGridSize: 3,
        tasks: DEFAULT_CAMPAIGN_TASKS,
        updatedAt: now,
      },
    },
    { upsert: true }
  );

  const campaign = await campaigns.findOne({ _id: PRIMARY_CAMPAIGN_ID });
  if (!campaign) {
    throw new Error("Unable to initialize primary campaign record.");
  }
  return campaign;
}

export async function getPublicCampaignSnapshot() {
  const campaign = await ensureCampaign();
  const occupiedSpots = campaign.approvedCount + campaign.reservedCount;
  const remainingSpots = Math.max(0, campaign.maxWinners - occupiedSpots);
  const isPaused = campaign.status === "PAUSED" || campaign.isPaused === true;
  const computedStatus = isPaused
    ? "PAUSED"
    : computeCampaignStatus(
        campaign.approvedCount,
        campaign.reservedCount,
        campaign.maxWinners
      );

  return {
    id: campaign._id,
    name: campaign.name,
    maxWinners: campaign.maxWinners,
    approvedCount: campaign.approvedCount,
    reservedCount: campaign.reservedCount,
    occupiedSpots,
    remainingSpots,
    status: computedStatus,
    officialTwitterUrl: campaign.officialTwitterUrl,
    officialTwitterHandle: campaign.officialTwitterHandle,
    pinnedPostUrl: campaign.pinnedPostUrl,
    requiredHashtags: campaign.requiredHashtags,
    defaultGridSize: campaign.defaultGridSize,
    tasks: campaign.tasks && campaign.tasks.length > 0 ? campaign.tasks : DEFAULT_CAMPAIGN_TASKS,
    isPaused,
    blockedIps: campaign.blockedIps || [],
  };
}

export class ClaimError extends Error {
  constructor(
    public code:
      | "CAMPAIGN_FULL"
      | "CAMPAIGN_PAUSED"
      | "IP_BLOCKED"
      | "PUZZLE_NOT_FOUND"
      | "PUZZLE_NOT_SOLVED"
      | "PUZZLE_ALREADY_USED"
      | "SESSION_MISMATCH"
      | "DUPLICATE_USERNAME"
      | "DUPLICATE_WALLET"
      | "INVALID_STATE",
    message: string,
    public httpStatus: number
  ) {
    super(message);
    this.name = "ClaimError";
  }
}

export async function reserveSpotAndCreateSubmission(params: {
  userId: string;
  puzzleId: string;
  sessionTokenHash: string;
  walletAddress: string;
  announcementPostUrl: string;
  commentPostUrl?: string | null;
  proofLinks: string[];
  tasksConfirmed: boolean;
  ipAddress?: string | null;
  userAgent?: string | null;
}) {
  await ensureCampaign();

  try {
    return await runGtdTransaction(async (cols, session) => {
      const now = new Date();

      const campaignRecord = await cols.campaigns.findOne(
        { _id: PRIMARY_CAMPAIGN_ID },
        { session }
      );
      if (campaignRecord) {
        if (campaignRecord.status === "PAUSED" || campaignRecord.isPaused) {
          throw new ClaimError(
            "CAMPAIGN_PAUSED",
            "GTD whitelist challenge is currently paused by an administrator.",
            403
          );
        }
        if (
          params.ipAddress &&
          (campaignRecord.blockedIps || []).includes(params.ipAddress)
        ) {
          throw new ClaimError(
            "IP_BLOCKED",
            "Submissions from your IP address have been restricted by an administrator.",
            403
          );
        }
      }

      const puzzle = await cols.puzzles.findOne(
        { _id: params.puzzleId },
        {
          session,
          projection: {
            _id: 1,
            userId: 1,
            sessionTokenHash: 1,
            status: 1,
            gridSize: 1,
            completedAt: 1,
          },
        }
      );

      if (!puzzle) {
        throw new ClaimError("PUZZLE_NOT_FOUND", "Puzzle not found.", 404);
      }

      if (puzzle.status === "SUBMITTED") {
        throw new ClaimError(
          "PUZZLE_ALREADY_USED",
          "This puzzle has already been submitted and cannot be used again.",
          409
        );
      }

      if (
        puzzle.userId !== params.userId ||
        puzzle.sessionTokenHash !== params.sessionTokenHash
      ) {
        throw new ClaimError(
          "SESSION_MISMATCH",
          "This puzzle is bound to a different Twitter/X username or browser session.",
          403
        );
      }

      if (puzzle.status !== "COMPLETED") {
        throw new ClaimError(
          "PUZZLE_NOT_SOLVED",
          "You must solve your personalized puzzle before submitting a whitelist claim.",
          400
        );
      }

      const [dupUser, dupPuzzle, dupWallet] = await Promise.all([
        cols.submissions.findOne(
          { userId: params.userId },
          { session, projection: { _id: 1 } }
        ),
        cols.submissions.findOne(
          { puzzleId: params.puzzleId },
          { session, projection: { _id: 1 } }
        ),
        cols.submissions.findOne(
          { walletAddress: params.walletAddress },
          { session, projection: { _id: 1 } }
        ),
      ]);

      if (dupUser) {
        throw new ClaimError(
          "DUPLICATE_USERNAME",
          "This Twitter/X username has already submitted a GTD whitelist claim.",
          409
        );
      }
      if (dupPuzzle) {
        throw new ClaimError(
          "PUZZLE_ALREADY_USED",
          "This puzzle has already been submitted and cannot be used again.",
          409
        );
      }
      if (dupWallet) {
        throw new ClaimError(
          "DUPLICATE_WALLET",
          "This BNB Smart Chain wallet address has already been used for another claim.",
          409
        );
      }

      const reservedCampaign = await cols.campaigns.findOneAndUpdate(
        {
          _id: PRIMARY_CAMPAIGN_ID,
          $expr: {
            $lt: [
              { $add: ["$approvedCount", "$reservedCount"] },
              "$maxWinners",
            ],
          },
        },
        {
          $inc: { reservedCount: 1 },
          $set: { updatedAt: now },
        },
        { returnDocument: "after", session }
      );

      if (!reservedCampaign) {
        throw new ClaimError(
          "CAMPAIGN_FULL",
          "All 500 GTD whitelist spots are currently reserved or approved. No new claims can be accepted.",
          409
        );
      }

      const puzzleUpdate = await cols.puzzles.updateOne(
        { _id: params.puzzleId, status: "COMPLETED" },
        { $set: { status: "SUBMITTED" } },
        { session }
      );

      if (puzzleUpdate.modifiedCount !== 1) {
        throw new ClaimError(
          "PUZZLE_ALREADY_USED",
          "This puzzle has already been submitted and cannot be used again.",
          409
        );
      }

      const nextStatus = computeCampaignStatus(
        reservedCampaign.approvedCount,
        reservedCampaign.reservedCount,
        reservedCampaign.maxWinners
      );
      if (reservedCampaign.status !== nextStatus) {
        await cols.campaigns.updateOne(
          { _id: PRIMARY_CAMPAIGN_ID },
          { $set: { status: nextStatus, updatedAt: now } },
          { session }
        );
        reservedCampaign.status = nextStatus;
      }

      const submissionDoc: SubmissionDoc = {
        _id: crypto.randomUUID(),
        submissionCode: generateSubmissionCode(),
        userId: params.userId,
        puzzleId: params.puzzleId,
        walletAddress: params.walletAddress,
        announcementPostUrl: params.announcementPostUrl,
        commentPostUrl: params.commentPostUrl ?? null,
        proofLinks: params.proofLinks,
        tasksConfirmed: params.tasksConfirmed,
        ipAddress: params.ipAddress ?? null,
        userAgent: params.userAgent ?? null,
        followVerified: false,
        likeVerified: false,
        retweetVerified: false,
        commentVerified: false,
        announcementVerified: false,
        status: "PENDING_VERIFICATION",
        winnerId: null,
        adminNotes: null,
        rejectionReason: null,
        reservedAt: now,
        reviewedAt: null,
        reviewedByEmail: null,
        createdAt: now,
        updatedAt: now,
      };

      await cols.submissions.insertOne(submissionDoc, { session });

      await cols.users.updateOne(
        { _id: params.userId },
        { $set: { walletAddress: params.walletAddress, updatedAt: now } },
        { session }
      );

      const user = await cols.users.findOne(
        { _id: params.userId },
        { session, projection: { twitterUsername: 1, displayUsername: 1 } }
      );

      return {
        submission: {
          ...submissionDoc,
          id: submissionDoc._id,
          user: {
            twitterUsername: user?.twitterUsername ?? "",
            displayUsername: user?.displayUsername ?? "",
          },
          puzzle: {
            id: puzzle._id,
            gridSize: puzzle.gridSize,
            completedAt: puzzle.completedAt,
          },
        },
        campaign: reservedCampaign,
      };
    });
  } catch (err) {
    if (err instanceof ClaimError) throw err;
    const dup = isMongoDuplicateKeyError(err);
    if (dup.isDuplicate) {
      const keys = Object.keys(dup.keyPattern ?? {});
      if (keys.includes("puzzleId")) {
        throw new ClaimError(
          "PUZZLE_ALREADY_USED",
          "This puzzle has already been submitted and cannot be used again.",
          409
        );
      }
      if (keys.includes("walletAddress")) {
        throw new ClaimError(
          "DUPLICATE_WALLET",
          "This BNB Smart Chain wallet address has already been used for another claim.",
          409
        );
      }
      if (keys.includes("userId")) {
        throw new ClaimError(
          "DUPLICATE_USERNAME",
          "This Twitter/X username has already submitted a GTD whitelist claim.",
          409
        );
      }
    }
    throw err;
  }
}

export async function approveSubmissionAtomic(params: {
  submissionId: string;
  adminEmail: string;
  notes?: string;
  checks?: {
    followVerified?: boolean;
    likeVerified?: boolean;
    retweetVerified?: boolean;
    commentVerified?: boolean;
    announcementVerified?: boolean;
  };
}) {
  return runGtdTransaction(async (cols, session) => {
    const now = new Date();
    const submission = await cols.submissions.findOne(
      { _id: params.submissionId },
      { session }
    );

    if (!submission) {
      throw new ClaimError("INVALID_STATE", "Submission not found.", 404);
    }
    if (submission.status === "APPROVED") {
      throw new ClaimError(
        "INVALID_STATE",
        "This submission has already been approved.",
        409
      );
    }
    if (submission.status === "REJECTED") {
      throw new ClaimError(
        "INVALID_STATE",
        "Rejected submissions have already released their spot and cannot be directly approved.",
        409
      );
    }

    const updatedCampaign = await cols.campaigns.findOneAndUpdate(
      { _id: PRIMARY_CAMPAIGN_ID, reservedCount: { $gte: 1 } },
      {
        $inc: { approvedCount: 1, reservedCount: -1 },
        $set: { updatedAt: now },
      },
      { returnDocument: "after", session }
    );

    if (!updatedCampaign) {
      throw new ClaimError(
        "INVALID_STATE",
        "Campaign reservation counter is out of sync.",
        409
      );
    }

    const nextStatus = computeCampaignStatus(
      updatedCampaign.approvedCount,
      updatedCampaign.reservedCount,
      updatedCampaign.maxWinners
    );
    if (updatedCampaign.status !== nextStatus) {
      await cols.campaigns.updateOne(
        { _id: PRIMARY_CAMPAIGN_ID },
        { $set: { status: nextStatus, updatedAt: now } },
        { session }
      );
      updatedCampaign.status = nextStatus;
    }

    const winnerId = generateWinnerId(updatedCampaign.approvedCount);

    const checkFields: Partial<SubmissionDoc> = {};
    if (params.checks) {
      if (typeof params.checks.followVerified === "boolean")
        checkFields.followVerified = params.checks.followVerified;
      if (typeof params.checks.likeVerified === "boolean")
        checkFields.likeVerified = params.checks.likeVerified;
      if (typeof params.checks.retweetVerified === "boolean")
        checkFields.retweetVerified = params.checks.retweetVerified;
      if (typeof params.checks.commentVerified === "boolean")
        checkFields.commentVerified = params.checks.commentVerified;
      if (typeof params.checks.announcementVerified === "boolean")
        checkFields.announcementVerified = params.checks.announcementVerified;
    }

    const updatedSubmission = await cols.submissions.findOneAndUpdate(
      {
        _id: submission._id,
        status: { $in: ["PENDING_VERIFICATION", "ADDITIONAL_PROOF_REQUESTED"] },
      },
      {
        $set: {
          status: "APPROVED",
          winnerId,
          reviewedAt: now,
          reviewedByEmail: params.adminEmail,
          rejectionReason: null,
          adminNotes: params.notes ?? submission.adminNotes,
          updatedAt: now,
          ...checkFields,
        },
      },
      { returnDocument: "after", session }
    );

    if (!updatedSubmission) {
      throw new ClaimError(
        "INVALID_STATE",
        "Submission status changed concurrently. Refresh and retry.",
        409
      );
    }

    const user = await cols.users.findOne(
      { _id: submission.userId },
      { session, projection: { twitterUsername: 1, displayUsername: 1 } }
    );

    await cols.auditLogs.insertOne(
      {
        _id: crypto.randomUUID(),
        adminEmail: params.adminEmail,
        submissionId: submission._id,
        action: "APPROVE_SUBMISSION",
        notes: params.notes || `Approved and assigned ${winnerId}`,
        metadata: {
          winnerId,
          twitterUsername: user?.displayUsername ?? "",
          walletAddress: submission.walletAddress,
        },
        createdAt: now,
      },
      { session }
    );

    return {
      submission: { ...updatedSubmission, id: updatedSubmission._id },
      campaign: updatedCampaign,
    };
  });
}

export async function rejectSubmissionAtomic(params: {
  submissionId: string;
  adminEmail: string;
  rejectionReason: string;
  notes?: string;
}) {
  if (!params.rejectionReason || params.rejectionReason.trim().length < 3) {
    throw new ClaimError(
      "INVALID_STATE",
      "A clear rejection reason is required.",
      400
    );
  }

  return runGtdTransaction(async (cols, session) => {
    const now = new Date();
    const submission = await cols.submissions.findOne(
      { _id: params.submissionId },
      { session }
    );

    if (!submission) {
      throw new ClaimError("INVALID_STATE", "Submission not found.", 404);
    }
    if (submission.status === "APPROVED") {
      throw new ClaimError(
        "INVALID_STATE",
        "Cannot reject an already approved GTD winner.",
        409
      );
    }
    if (submission.status === "REJECTED") {
      throw new ClaimError(
        "INVALID_STATE",
        "This submission is already rejected.",
        409
      );
    }

    const updatedCampaign = await cols.campaigns.findOneAndUpdate(
      { _id: PRIMARY_CAMPAIGN_ID, reservedCount: { $gte: 1 } },
      {
        $inc: { reservedCount: -1 },
        $set: { updatedAt: now },
      },
      { returnDocument: "after", session }
    );

    if (!updatedCampaign) {
      throw new ClaimError(
        "INVALID_STATE",
        "Campaign reservation counter is out of sync.",
        409
      );
    }

    const nextStatus = computeCampaignStatus(
      updatedCampaign.approvedCount,
      updatedCampaign.reservedCount,
      updatedCampaign.maxWinners
    );
    if (updatedCampaign.status !== nextStatus) {
      await cols.campaigns.updateOne(
        { _id: PRIMARY_CAMPAIGN_ID },
        { $set: { status: nextStatus, updatedAt: now } },
        { session }
      );
      updatedCampaign.status = nextStatus;
    }

    const updatedSubmission = await cols.submissions.findOneAndUpdate(
      {
        _id: submission._id,
        status: { $in: ["PENDING_VERIFICATION", "ADDITIONAL_PROOF_REQUESTED"] },
      },
      {
        $set: {
          status: "REJECTED",
          rejectionReason: params.rejectionReason.trim(),
          adminNotes: params.notes ?? submission.adminNotes,
          reviewedAt: now,
          reviewedByEmail: params.adminEmail,
          updatedAt: now,
        },
      },
      { returnDocument: "after", session }
    );

    if (!updatedSubmission) {
      throw new ClaimError(
        "INVALID_STATE",
        "Submission status changed concurrently. Refresh and retry.",
        409
      );
    }

    const user = await cols.users.findOne(
      { _id: submission.userId },
      { session, projection: { twitterUsername: 1, displayUsername: 1 } }
    );

    await cols.auditLogs.insertOne(
      {
        _id: crypto.randomUUID(),
        adminEmail: params.adminEmail,
        submissionId: submission._id,
        action: "REJECT_SUBMISSION",
        notes: params.rejectionReason.trim(),
        metadata: {
          releasedSpot: true,
          remainingSpots:
            updatedCampaign.maxWinners -
            (updatedCampaign.approvedCount + updatedCampaign.reservedCount),
          twitterUsername: user?.displayUsername ?? "",
        },
        createdAt: now,
      },
      { session }
    );

    return {
      submission: { ...updatedSubmission, id: updatedSubmission._id },
      campaign: updatedCampaign,
    };
  });
}

export async function requestAdditionalProofAtomic(params: {
  submissionId: string;
  adminEmail: string;
  notes: string;
}) {
  if (!params.notes || params.notes.trim().length < 3) {
    throw new ClaimError(
      "INVALID_STATE",
      "Please provide clear instructions for the additional proof needed.",
      400
    );
  }

  return runGtdTransaction(async (cols, session) => {
    const now = new Date();
    const submission = await cols.submissions.findOne(
      { _id: params.submissionId },
      { session }
    );

    if (!submission) {
      throw new ClaimError("INVALID_STATE", "Submission not found.", 404);
    }

    if (submission.status === "APPROVED" || submission.status === "REJECTED") {
      throw new ClaimError(
        "INVALID_STATE",
        "Cannot request additional proof for a finalized submission.",
        409
      );
    }

    const updatedSubmission = await cols.submissions.findOneAndUpdate(
      { _id: submission._id },
      {
        $set: {
          status: "ADDITIONAL_PROOF_REQUESTED",
          adminNotes: params.notes.trim(),
          reviewedAt: now,
          reviewedByEmail: params.adminEmail,
          updatedAt: now,
        },
      },
      { returnDocument: "after", session }
    );

    await cols.auditLogs.insertOne(
      {
        _id: crypto.randomUUID(),
        adminEmail: params.adminEmail,
        submissionId: submission._id,
        action: "REQUEST_ADDITIONAL_PROOF",
        notes: params.notes.trim(),
        metadata: null,
        createdAt: now,
      },
      { session }
    );

    return { ...updatedSubmission!, id: updatedSubmission!._id };
  });
}

export async function removeSubmissionAtomic(params: {
  submissionId: string;
  adminEmail: string;
  notes?: string;
}) {
  return runGtdTransaction(async (cols, session) => {
    const now = new Date();
    const submission = await cols.submissions.findOne(
      { _id: params.submissionId },
      { session }
    );
    if (!submission) {
      throw new ClaimError("INVALID_STATE", "Submission not found.", 404);
    }

    const campaignInc: Record<string, number> = {};
    if (submission.status === "APPROVED") {
      campaignInc.approvedCount = -1;
    } else if (
      submission.status === "PENDING_VERIFICATION" ||
      submission.status === "ADDITIONAL_PROOF_REQUESTED"
    ) {
      campaignInc.reservedCount = -1;
    }

    if (Object.keys(campaignInc).length > 0) {
      await cols.campaigns.updateOne(
        { _id: PRIMARY_CAMPAIGN_ID },
        { $inc: campaignInc, $set: { updatedAt: now } },
        { session }
      );
    }

    await cols.submissions.deleteOne({ _id: submission._id });

    // Reset puzzle so participant isn't permanently locked out
    await cols.puzzles.updateOne(
      { _id: submission.puzzleId },
      { $set: { status: "ACTIVE" } },
      { session }
    );

    await cols.auditLogs.insertOne(
      {
        _id: crypto.randomUUID(),
        adminEmail: params.adminEmail,
        submissionId: submission._id,
        action: "REMOVE_SUBMISSION",
        notes:
          params.notes ||
          `Permanently deleted submission ${submission.submissionCode}`,
        metadata: {
          submissionCode: submission.submissionCode,
          walletAddress: submission.walletAddress,
          ipAddress: submission.ipAddress,
        },
        createdAt: now,
      },
      { session }
    );

    const updatedCampaign = await cols.campaigns.findOne(
      { _id: PRIMARY_CAMPAIGN_ID },
      { session }
    );
    return { success: true, campaign: updatedCampaign };
  });
}

export async function resetTestDataAtomic(adminEmail: string) {
  return runGtdTransaction(async (cols) => {
    const now = new Date();
    await cols.submissions.deleteMany({});
    await cols.puzzles.deleteMany({});
    await cols.users.deleteMany({});
    await cols.auditLogs.deleteMany({});

    await cols.campaigns.updateOne(
      { _id: PRIMARY_CAMPAIGN_ID },
      {
        $set: {
          approvedCount: 0,
          reservedCount: 0,
          status: "ACTIVE",
          updatedAt: now,
        },
      }
    );

    try {
      const { resetLocalStore } = await import("./local-store");
      resetLocalStore();
    } catch {
      // Ignore if in mongo mode
    }

    const campaign = await cols.campaigns.findOne({ _id: PRIMARY_CAMPAIGN_ID });
    return {
      success: true,
      message:
        "All test claims and submissions have been wiped. Spots claimed is now 0 / 500.",
      campaign,
    };
  });
}

export async function toggleBlockIpAtomic(params: {
  ipAddress: string;
  block: boolean;
  adminEmail: string;
}) {
  const now = new Date();
  const { campaigns, auditLogs } = await getGtdCollections();
  const campaign = await ensureCampaign();
  const existingBlocked: string[] = (campaign as any).blockedIps || [];

  let nextBlocked: string[];
  if (params.block) {
    nextBlocked = Array.from(new Set([...existingBlocked, params.ipAddress]));
  } else {
    nextBlocked = existingBlocked.filter((ip) => ip !== params.ipAddress);
  }

  await campaigns.updateOne(
    { _id: PRIMARY_CAMPAIGN_ID },
    { $set: { blockedIps: nextBlocked, updatedAt: now } }
  );

  await auditLogs.insertOne({
    _id: crypto.randomUUID(),
    adminEmail: params.adminEmail,
    submissionId: null,
    action: params.block ? "BLOCK_IP" : "UNBLOCK_IP",
    notes: `${params.block ? "Blocked" : "Unblocked"} IP address ${params.ipAddress}`,
    metadata: { ipAddress: params.ipAddress },
    createdAt: now,
  });

  return { success: true, blockedIps: nextBlocked };
}

export async function setCampaignPausedAtomic(params: {
  paused: boolean;
  adminEmail: string;
}) {
  const now = new Date();
  const { campaigns, auditLogs } = await getGtdCollections();
  const campaign = await ensureCampaign();

  const nextStatus = params.paused
    ? "PAUSED"
    : computeCampaignStatus(
        campaign.approvedCount,
        campaign.reservedCount,
        campaign.maxWinners,
        false
      );

  await campaigns.updateOne(
    { _id: PRIMARY_CAMPAIGN_ID },
    { $set: { status: nextStatus, isPaused: params.paused, updatedAt: now } }
  );

  await auditLogs.insertOne({
    _id: crypto.randomUUID(),
    adminEmail: params.adminEmail,
    submissionId: null,
    action: params.paused ? "PAUSE_CAMPAIGN" : "RESUME_CAMPAIGN",
    notes: params.paused
      ? "Paused whitelist puzzle challenge & submissions"
      : "Resumed whitelist puzzle challenge & submissions",
    metadata: { paused: params.paused, status: nextStatus },
    createdAt: now,
  });

  const updated = await campaigns.findOne({ _id: PRIMARY_CAMPAIGN_ID });
  return { success: true, campaign: updated };
}
