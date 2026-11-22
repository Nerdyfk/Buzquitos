import { NextResponse } from "next/server";
import { getPublicCampaignSnapshot } from "@/lib/gtd/campaign";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const campaign = await getPublicCampaignSnapshot();
    return NextResponse.json({ campaign });
  } catch (err) {
    console.error("GET /api/gtd/campaign error:", err);
    return NextResponse.json(
      { error: "Failed to load campaign statistics." },
      { status: 500 }
    );
  }
}
