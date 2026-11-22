import crypto from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { getGtdCollections } from "@/lib/gtd/mongodb";
import { verifyCsrfOrigin } from "@/lib/gtd/security";
import {
  approveSubmissionAtomic,
  ClaimError,
  rejectSubmissionAtomic,
  requestAdditionalProofAtomic,
  removeSubmissionAtomic,
  toggleBlockIpAtomic,
} from "@/lib/gtd/campaign";

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
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

  const { id } = await context.params;
  const body = (await req.json().catch(() => null)) as Record<
    string,
    unknown
  > | null;
  if (!body || typeof body.action !== "string") {
    return NextResponse.json(
      { error: "Invalid action payload." },
      { status: 400 }
    );
  }

  try {
    if (body.action === "UPDATE_CHECKS") {
      const { submissions, auditLogs } = await getGtdCollections();
      const now = new Date();
      const updates: Record<string, unknown> = { updatedAt: now };
      if (typeof body.followVerified === "boolean")
        updates.followVerified = body.followVerified;
      if (typeof body.likeVerified === "boolean")
        updates.likeVerified = body.likeVerified;
      if (typeof body.retweetVerified === "boolean")
        updates.retweetVerified = body.retweetVerified;
      if (typeof body.commentVerified === "boolean")
        updates.commentVerified = body.commentVerified;
      if (typeof body.announcementVerified === "boolean")
        updates.announcementVerified = body.announcementVerified;
      if (typeof body.adminNotes === "string")
        updates.adminNotes = body.adminNotes.slice(0, 1000);

      const updated = await submissions.findOneAndUpdate(
        { _id: id },
        { $set: updates },
        { returnDocument: "after" }
      );

      if (!updated) {
        return NextResponse.json(
          { error: "Submission not found." },
          { status: 404 }
        );
      }

      await auditLogs.insertOne({
        _id: crypto.randomUUID(),
        adminEmail: auth.user.email,
        submissionId: id,
        action: "UPDATE_VERIFICATION_CHECKS",
        notes:
          (typeof body.adminNotes === "string" && body.adminNotes) ||
          "Updated manual social task checklist",
        metadata: {
          followVerified: updated.followVerified,
          likeVerified: updated.likeVerified,
          retweetVerified: updated.retweetVerified,
          commentVerified: updated.commentVerified,
          announcementVerified: updated.announcementVerified,
        },
        createdAt: now,
      });

      return NextResponse.json({ submission: { ...updated, id: updated._id } });
    }

    if (body.action === "APPROVE") {
      const result = await approveSubmissionAtomic({
        submissionId: id,
        adminEmail: auth.user.email,
        notes: typeof body.notes === "string" ? body.notes : undefined,
        checks: {
          followVerified:
            typeof body.followVerified === "boolean"
              ? body.followVerified
              : undefined,
          likeVerified:
            typeof body.likeVerified === "boolean" ? body.likeVerified : undefined,
          retweetVerified:
            typeof body.retweetVerified === "boolean"
              ? body.retweetVerified
              : undefined,
          commentVerified:
            typeof body.commentVerified === "boolean"
              ? body.commentVerified
              : undefined,
          announcementVerified:
            typeof body.announcementVerified === "boolean"
              ? body.announcementVerified
              : undefined,
        },
      });
      return NextResponse.json(result);
    }

    if (body.action === "REJECT") {
      const reason =
        typeof body.rejectionReason === "string" ? body.rejectionReason : "";
      const result = await rejectSubmissionAtomic({
        submissionId: id,
        adminEmail: auth.user.email,
        rejectionReason: reason,
        notes: typeof body.notes === "string" ? body.notes : undefined,
      });
      return NextResponse.json(result);
    }

    if (body.action === "DELETE") {
      const result = await removeSubmissionAtomic({
        submissionId: id,
        adminEmail: auth.user.email,
        notes: typeof body.notes === "string" ? body.notes : undefined,
      });
      return NextResponse.json(result);
    }

    if (body.action === "BLOCK_IP" || body.action === "UNBLOCK_IP") {
      const ip = typeof body.ipAddress === "string" ? body.ipAddress.trim() : "";
      if (!ip) {
        return NextResponse.json({ error: "Missing IP address." }, { status: 400 });
      }
      const result = await toggleBlockIpAtomic({
        ipAddress: ip,
        block: body.action === "BLOCK_IP",
        adminEmail: auth.user.email,
      });
      return NextResponse.json(result);
    }

    if (body.action === "REQUEST_PROOF") {
      const notes = typeof body.notes === "string" ? body.notes : "";
      const updated = await requestAdditionalProofAtomic({
        submissionId: id,
        adminEmail: auth.user.email,
        notes,
      });
      return NextResponse.json({ submission: updated });
    }

    return NextResponse.json({ error: "Unknown action." }, { status: 400 });
  } catch (err) {
    if (err instanceof ClaimError) {
      return NextResponse.json({ error: err.message }, { status: err.httpStatus });
    }
    console.error("PATCH /api/gtd/admin/submissions/[id] error:", err);
    return NextResponse.json(
      { error: "Failed to update submission." },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
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

  const { id } = await context.params;
  try {
    const result = await removeSubmissionAtomic({
      submissionId: id,
      adminEmail: auth.user.email,
    });
    return NextResponse.json(result);
  } catch (err) {
    if (err instanceof ClaimError) {
      return NextResponse.json({ error: err.message }, { status: err.httpStatus });
    }
    console.error("DELETE /api/gtd/admin/submissions/[id] error:", err);
    return NextResponse.json(
      { error: "Failed to remove submission." },
      { status: 500 }
    );
  }
}
