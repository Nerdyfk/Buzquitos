import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { verifyCsrfOrigin } from "@/lib/gtd/security";
import { resetTestDataAtomic } from "@/lib/gtd/campaign";

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

  try {
    const result = await resetTestDataAtomic(auth.user.email);
    return NextResponse.json(result);
  } catch (err) {
    console.error("POST /api/gtd/admin/reset-test-data error:", err);
    return NextResponse.json(
      { error: "Failed to reset test data." },
      { status: 500 }
    );
  }
}
