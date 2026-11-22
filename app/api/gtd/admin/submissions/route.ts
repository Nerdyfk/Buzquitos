import { NextRequest, NextResponse } from "next/server";
import type { Filter } from "mongodb";
import { requireAdmin } from "@/lib/admin-auth";
import {
  getGtdCollections,
  type SubmissionDoc,
  type SubmissionStatus,
} from "@/lib/gtd/mongodb";

export const dynamic = "force-dynamic";

const VALID_STATUSES: SubmissionStatus[] = [
  "PENDING_VERIFICATION",
  "ADDITIONAL_PROOF_REQUESTED",
  "APPROVED",
  "REJECTED",
];

function escapeRegex(input: string): string {
  return input.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function csvEscape(val: unknown): string {
  const s = String(val ?? "");
  if (/[",\n\r]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

export async function GET(req: NextRequest) {
  const auth = await requireAdmin();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.message }, { status: auth.status });
  }

  try {
    const search = req.nextUrl.searchParams.get("q")?.trim() ?? "";
    const statusParam = req.nextUrl.searchParams.get("status")?.trim() ?? "ALL";
    const format = req.nextUrl.searchParams.get("format")?.trim() ?? "json";
    const page = Math.max(1, Number(req.nextUrl.searchParams.get("page") || "1"));
    const pageSize = Math.min(
      100,
      Math.max(10, Number(req.nextUrl.searchParams.get("pageSize") || "25"))
    );

    const { users, puzzles, submissions } = await getGtdCollections();
    const filter: Filter<SubmissionDoc> = {};

    if (
      statusParam !== "ALL" &&
      VALID_STATUSES.includes(statusParam as SubmissionStatus)
    ) {
      filter.status = statusParam as SubmissionStatus;
    }

    if (search) {
      const clean = search.replace(/^@+/, "");
      const rx = new RegExp(escapeRegex(clean), "i");
      const matchingUsers = await users
        .find({ twitterUsername: rx }, { projection: { _id: 1 } })
        .toArray();
      const matchingUserIds = matchingUsers.map((u) => u._id);

      filter.$or = [
        { submissionCode: rx },
        { walletAddress: rx },
        { puzzleId: rx },
        { winnerId: rx },
        ...(matchingUserIds.length > 0
          ? [{ userId: { $in: matchingUserIds } }]
          : []),
      ];
    }

    const sortDir = format === "csv" ? 1 : -1;
    const cursor = submissions.find(filter).sort({ createdAt: sortDir });

    const [total, rawItems] =
      format === "csv"
        ? [0, await cursor.toArray()]
        : await Promise.all([
            submissions.countDocuments(filter),
            cursor
              .skip((page - 1) * pageSize)
              .limit(pageSize)
              .toArray(),
          ]);

    const userIds = Array.from(new Set(rawItems.map((s) => s.userId)));
    const puzzleIds = Array.from(new Set(rawItems.map((s) => s.puzzleId)));

    const [userDocs, puzzleDocs] = await Promise.all([
      userIds.length
        ? users
            .find(
              { _id: { $in: userIds } },
              { projection: { _id: 1, twitterUsername: 1, displayUsername: 1 } }
            )
            .toArray()
        : [],
      puzzleIds.length
        ? puzzles
            .find(
              { _id: { $in: puzzleIds } },
              {
                projection: {
                  _id: 1,
                  gridSize: 1,
                  status: 1,
                  completedAt: 1,
                  attempts: 1,
                },
              }
            )
            .toArray()
        : [],
    ]);

    const userMap = new Map(userDocs.map((u) => [u._id, u]));
    const puzzleMap = new Map(puzzleDocs.map((p) => [p._id, p]));

    // IP Submission Intelligence: calculate how many submissions originate from each IP
    const allIps = await submissions
      .find({}, { projection: { ipAddress: 1 } })
      .toArray();
    const ipCountMap = new Map<string, number>();
    for (const item of allIps) {
      if (item.ipAddress) {
        ipCountMap.set(item.ipAddress, (ipCountMap.get(item.ipAddress) || 0) + 1);
      }
    }

    const { ensureCampaign } = await import("@/lib/gtd/campaign");
    const campaignDoc = await ensureCampaign();
    const blockedIps: string[] = (campaignDoc as any).blockedIps || [];

    const hydrated = rawItems.map((s) => {
      const u = userMap.get(s.userId);
      const p = puzzleMap.get(s.puzzleId);
      const verifiedChecksCount = [
        s.followVerified,
        s.likeVerified,
        s.retweetVerified,
        s.commentVerified,
        s.announcementVerified,
      ].filter(Boolean).length;

      const ipSubmissionsCount = s.ipAddress
        ? ipCountMap.get(s.ipAddress) || 1
        : 0;
      const isIpBlocked = Boolean(s.ipAddress && blockedIps.includes(s.ipAddress));

      return {
        id: s._id,
        submissionCode: s.submissionCode,
        winnerId: s.winnerId,
        twitterUsername: u?.twitterUsername ?? "",
        displayUsername: u?.displayUsername ?? "",
        walletAddress: s.walletAddress,
        puzzleId: s.puzzleId,
        puzzleGridSize: p?.gridSize ?? 3,
        puzzleStatus: p?.status ?? "SUBMITTED",
        puzzleCompletedAt: p?.completedAt ?? null,
        puzzleAttempts: p?.attempts ?? 0,
        commentPostUrl: (s as any).commentPostUrl || null,
        announcementPostUrl: s.announcementPostUrl,
        proofLinks: s.proofLinks ?? [],
        tasksConfirmed: s.tasksConfirmed,
        followVerified: s.followVerified,
        likeVerified: s.likeVerified,
        retweetVerified: s.retweetVerified,
        commentVerified: s.commentVerified,
        announcementVerified: s.announcementVerified,
        verifiedChecksCount,
        ipAddress: s.ipAddress || null,
        ipSubmissionsCount,
        isIpBlocked,
        status: s.status,
        adminNotes: s.adminNotes,
        rejectionReason: s.rejectionReason,
        reservedAt: s.reservedAt,
        reviewedAt: s.reviewedAt,
        reviewedByEmail: s.reviewedByEmail,
      };
    });

    if (format === "csv") {
      const header = [
        "Submission ID",
        "Winner ID",
        "Twitter Username",
        "Wallet Address",
        "Puzzle ID",
        "Grid Mode",
        "Puzzle Completed At",
        "Announcement Post URL",
        "Status",
        "Checks Verified (of 5)",
        "Submitted At",
        "Reviewed At",
        "Rejection Reason",
      ].join(",");

      const lines = hydrated.map((row) =>
        [
          row.submissionCode,
          row.winnerId ?? "",
          `@${row.displayUsername}`,
          row.walletAddress,
          row.puzzleId,
          `${row.puzzleGridSize}x${row.puzzleGridSize}`,
          row.puzzleCompletedAt
            ? new Date(row.puzzleCompletedAt).toISOString()
            : "",
          row.announcementPostUrl,
          row.status,
          row.verifiedChecksCount,
          new Date(row.reservedAt).toISOString(),
          row.reviewedAt ? new Date(row.reviewedAt).toISOString() : "",
          row.rejectionReason ?? "",
        ]
          .map(csvEscape)
          .join(",")
      );

      return new NextResponse([header, ...lines].join("\n"), {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="gtd-submissions-${statusParam.toLowerCase()}.csv"`,
        },
      });
    }

    return NextResponse.json({
      total,
      page,
      pageSize,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
      submissions: hydrated,
      blockedIps,
    });
  } catch (err) {
    console.error("GET /api/gtd/admin/submissions error:", err);
    return NextResponse.json(
      { error: "Failed to fetch submissions." },
      { status: 500 }
    );
  }
}
