import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { getGtdCollections } from "@/lib/gtd/mongodb";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireAdmin();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.message }, { status: auth.status });
  }

  const { auditLogs, submissions, users } = await getGtdCollections();
  const rawLogs = await auditLogs
    .find()
    .sort({ createdAt: -1 })
    .limit(100)
    .toArray();

  const subIds = Array.from(
    new Set(
      rawLogs
        .map((l) => l.submissionId)
        .filter((id): id is string => Boolean(id))
    )
  );

  const subDocs = subIds.length
    ? await submissions
        .find(
          { _id: { $in: subIds } },
          { projection: { _id: 1, submissionCode: 1, userId: 1 } }
        )
        .toArray()
    : [];

  const userIds = Array.from(new Set(subDocs.map((s) => s.userId)));
  const userDocs = userIds.length
    ? await users
        .find(
          { _id: { $in: userIds } },
          { projection: { _id: 1, displayUsername: 1 } }
        )
        .toArray()
    : [];

  const userMap = new Map(userDocs.map((u) => [u._id, u]));
  const subMap = new Map(subDocs.map((s) => [s._id, s]));

  const logs = rawLogs.map((l) => {
    const s = l.submissionId ? subMap.get(l.submissionId) : null;
    const u = s ? userMap.get(s.userId) : null;
    return {
      id: l._id,
      action: l.action,
      notes: l.notes,
      createdAt: l.createdAt,
      adminEmail: l.adminEmail,
      submission: s
        ? {
            submissionCode: s.submissionCode,
            user: { displayUsername: u?.displayUsername ?? "" },
          }
        : null,
    };
  });

  return NextResponse.json({ logs });
}
