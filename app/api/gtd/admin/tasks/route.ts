import crypto from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { getGtdCollections } from "@/lib/gtd/mongodb";
import { verifyCsrfOrigin } from "@/lib/gtd/security";
import { ensureCampaign, PRIMARY_CAMPAIGN_ID } from "@/lib/gtd/campaign";
import { CampaignTask, DEFAULT_CAMPAIGN_TASKS } from "@/types/gtd";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireAdmin();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.message }, { status: auth.status });
  }

  const campaign = await ensureCampaign();
  const tasks =
    campaign.tasks && campaign.tasks.length > 0
      ? campaign.tasks
      : DEFAULT_CAMPAIGN_TASKS;

  return NextResponse.json({ tasks });
}

export async function POST(req: NextRequest) {
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

  const body = (await req.json().catch(() => null)) as {
    tasks?: unknown;
  } | null;

  if (!body || !Array.isArray(body.tasks)) {
    return NextResponse.json(
      { error: "Please provide a valid array of tasks." },
      { status: 400 }
    );
  }

  if (body.tasks.length === 0) {
    return NextResponse.json(
      { error: "At least one verification task is required." },
      { status: 400 }
    );
  }

  const sanitizedTasks: CampaignTask[] = [];

  for (let i = 0; i < body.tasks.length; i++) {
    const raw = body.tasks[i];
    if (!raw || typeof raw !== "object") {
      return NextResponse.json(
        { error: `Task #${i + 1} is invalid.` },
        { status: 400 }
      );
    }

    const t = raw as Record<string, unknown>;
    const title = typeof t.title === "string" ? t.title.trim() : "";
    if (!title || title.length < 3) {
      return NextResponse.json(
        { error: `Task #${i + 1} must have a title with at least 3 characters.` },
        { status: 400 }
      );
    }

    const actionLabel =
      typeof t.actionLabel === "string" && t.actionLabel.trim()
        ? t.actionLabel.trim().slice(0, 50)
        : "OPEN LINK";

    const actionUrl =
      typeof t.actionUrl === "string" && t.actionUrl.trim()
        ? t.actionUrl.trim()
        : "https://x.com/Buzquitos";

    const isRequired = Boolean(t.isRequired);
    const needsUrlInput = Boolean(t.needsUrlInput);
    const urlInputPlaceholder =
      typeof t.urlInputPlaceholder === "string"
        ? t.urlInputPlaceholder.trim()
        : undefined;
    const urlInputDescription =
      typeof t.urlInputDescription === "string"
        ? t.urlInputDescription.trim()
        : undefined;

    const id =
      typeof t.id === "string" && t.id.trim()
        ? t.id.trim().replace(/[^a-zA-Z0-9_-]/g, "")
        : `task_${Date.now()}_${i}`;

    sanitizedTasks.push({
      id: id || `task_${Date.now()}_${i}`,
      title,
      actionLabel,
      actionUrl,
      isRequired,
      needsUrlInput,
      urlInputPlaceholder,
      urlInputDescription,
    });
  }

  const { campaigns, auditLogs } = await getGtdCollections();
  const now = new Date();

  await campaigns.updateOne(
    { _id: PRIMARY_CAMPAIGN_ID },
    {
      $set: {
        tasks: sanitizedTasks,
        updatedAt: now,
      },
    }
  );

  await auditLogs.insertOne({
    _id: crypto.randomUUID(),
    adminEmail: auth.user.email,
    submissionId: null,
    action: "UPDATE_VERIFICATION_TASKS",
    notes: `Updated verification tasks list (${sanitizedTasks.length} tasks configured)`,
    metadata: { tasksCount: sanitizedTasks.length, tasks: sanitizedTasks },
    createdAt: now,
  });

  return NextResponse.json({
    success: true,
    message: "Verification tasks updated successfully.",
    tasks: sanitizedTasks,
  });
}
