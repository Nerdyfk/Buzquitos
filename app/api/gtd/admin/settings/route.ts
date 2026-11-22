import crypto from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { getGtdCollections } from "@/lib/gtd/mongodb";
import { isValidHttpUrl, verifyCsrfOrigin } from "@/lib/gtd/security";
import {
  computeCampaignStatus,
  ensureCampaign,
  PRIMARY_CAMPAIGN_ID,
} from "@/lib/gtd/campaign";

export async function GET() {
  const auth = await requireAdmin();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.message }, { status: auth.status });
  }
  const campaign = await ensureCampaign();
  return NextResponse.json({ campaign });
}

export async function PATCH(req: NextRequest) {
  const auth = await requireAdmin();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.message }, { status: auth.status });
  }

  if (!verifyCsrfOrigin(req)) {
    return NextResponse.json(
      { error: "Invalid request origin." },
      { status: 403 }
    );
  }

  const body = (await req.json().catch(() => null)) as Record<
    string,
    unknown
  > | null;
  if (!body) {
    return NextResponse.json(
      { error: "Invalid settings payload." },
      { status: 400 }
    );
  }

  try {
    if (body.action === "RESET_TEST_DATA") {
      const { resetTestDataAtomic } = await import("@/lib/gtd/campaign");
      const result = await resetTestDataAtomic(auth.user.email);
      return NextResponse.json(result);
    }

    const current = await ensureCampaign();
    const occupied = current.approvedCount + current.reservedCount;
    const nextMaxWinners =
      typeof body.maxWinners === "number" &&
      Number.isInteger(body.maxWinners) &&
      body.maxWinners >= 1 &&
      body.maxWinners <= 10000
        ? body.maxWinners
        : current.maxWinners;

    if (nextMaxWinners < occupied) {
      return NextResponse.json(
        {
          error: `Campaign capacity cannot be lower than currently occupied spots (${occupied}).`,
        },
        { status: 400 }
      );
    }

    const isPaused =
      typeof body.isPaused === "boolean"
        ? body.isPaused
        : body.status === "PAUSED"
        ? true
        : body.status === "ACTIVE"
        ? false
        : current.status === "PAUSED" || current.isPaused === true;

    const nextStatus = isPaused
      ? "PAUSED"
      : computeCampaignStatus(
          current.approvedCount,
          current.reservedCount,
          nextMaxWinners,
          false
        );

    const { campaigns, auditLogs } = await getGtdCollections();
    const now = new Date();
    const updates: Record<string, unknown> = {
      maxWinners: nextMaxWinners,
      status: nextStatus,
      isPaused,
      updatedAt: now,
    };

    if (typeof body.name === "string" && body.name.trim().length >= 3)
      updates.name = body.name.trim().slice(0, 120);
    if (
      typeof body.officialTwitterUrl === "string" &&
      isValidHttpUrl(body.officialTwitterUrl)
    )
      updates.officialTwitterUrl = body.officialTwitterUrl.trim();
    if (
      typeof body.officialTwitterHandle === "string" &&
      body.officialTwitterHandle.trim().length >= 2
    )
      updates.officialTwitterHandle = body.officialTwitterHandle
        .trim()
        .slice(0, 40);
    if (
      typeof body.pinnedPostUrl === "string" &&
      isValidHttpUrl(body.pinnedPostUrl)
    )
      updates.pinnedPostUrl = body.pinnedPostUrl.trim();
    if (
      typeof body.requiredHashtags === "string" &&
      body.requiredHashtags.trim().length >= 2
    )
      updates.requiredHashtags = body.requiredHashtags.trim().slice(0, 200);
    if (body.defaultGridSize === 3 || body.defaultGridSize === 9)
      updates.defaultGridSize = body.defaultGridSize;

    const updated = await campaigns.findOneAndUpdate(
      { _id: PRIMARY_CAMPAIGN_ID },
      { $set: updates },
      { returnDocument: "after" }
    );

    await auditLogs.insertOne({
      _id: crypto.randomUUID(),
      adminEmail: auth.user.email,
      submissionId: null,
      action: "UPDATE_CAMPAIGN_SETTINGS",
      notes: "Updated campaign configuration",
      metadata: updates,
      createdAt: now,
    });

    return NextResponse.json({ campaign: updated });
  } catch (err) {
    console.error("PATCH /api/gtd/admin/settings error:", err);
    return NextResponse.json(
      { error: "Failed to update campaign settings." },
      { status: 500 }
    );
  }
}
