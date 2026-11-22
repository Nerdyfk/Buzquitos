import { NextRequest, NextResponse } from "next/server";
import { getGtdCollections } from "@/lib/gtd/mongodb";
import { getUserSession } from "@/lib/gtd/auth";
import {
  checkRateLimit,
  getClientIp,
  isValidHttpUrl,
  normalizeBscWallet,
  verifyCsrfOrigin,
} from "@/lib/gtd/security";

export async function POST(req: NextRequest) {
  try {
    if (!verifyCsrfOrigin(req)) {
      return NextResponse.json(
        { error: "Invalid request origin." },
        { status: 403 }
      );
    }

    const ip = getClientIp(req);
    const rl = checkRateLimit(`gtd:status:resubmit:${ip}`, 10, 60_000);
    if (!rl.allowed) {
      return NextResponse.json(
        { error: `Too many requests. Wait ${rl.retryAfterSeconds}s.` },
        { status: 429 }
      );
    }

    const body = (await req.json().catch(() => null)) as {
      submissionCode?: unknown;
      walletAddress?: unknown;
      additionalProofUrls?: unknown;
    } | null;

    if (
      !body ||
      typeof body.submissionCode !== "string" ||
      typeof body.walletAddress !== "string" ||
      !Array.isArray(body.additionalProofUrls)
    ) {
      return NextResponse.json(
        {
          error:
            "Provide valid submission code, wallet address, and proof URL(s).",
        },
        { status: 400 }
      );
    }

    const normalizedWallet = normalizeBscWallet(body.walletAddress);
    if (!normalizedWallet) {
      return NextResponse.json(
        { error: "Invalid BSC wallet address." },
        { status: 400 }
      );
    }

    const urls = body.additionalProofUrls
      .filter((u): u is string => typeof u === "string")
      .map((u) => u.trim())
      .filter(Boolean)
      .slice(0, 5);

    if (urls.length === 0) {
      return NextResponse.json(
        { error: "Provide at least one valid proof URL." },
        { status: 400 }
      );
    }

    for (const url of urls) {
      if (!isValidHttpUrl(url)) {
        return NextResponse.json({ error: `Invalid URL: ${url}` }, { status: 400 });
      }
    }

    const [{ submissions }, session] = await Promise.all([
      getGtdCollections(),
      getUserSession(),
    ]);

    const submission = await submissions.findOne({
      submissionCode: body.submissionCode.trim().toUpperCase(),
    });

    if (!submission) {
      return NextResponse.json(
        { error: "Submission not found." },
        { status: 404 }
      );
    }

    if (
      submission.walletAddress !== normalizedWallet &&
      (!session || session.uid !== submission.userId)
    ) {
      return NextResponse.json(
        { error: "Wallet address does not match this submission." },
        { status: 403 }
      );
    }

    if (submission.status !== "ADDITIONAL_PROOF_REQUESTED") {
      return NextResponse.json(
        {
          error:
            "Additional proof is not currently requested for this submission.",
        },
        { status: 409 }
      );
    }

    const mergedLinks = Array.from(
      new Set([...(submission.proofLinks ?? []), ...urls])
    ).slice(0, 10);

    await submissions.updateOne(
      { _id: submission._id },
      {
        $set: {
          proofLinks: mergedLinks,
          status: "PENDING_VERIFICATION",
          updatedAt: new Date(),
        },
      }
    );

    return NextResponse.json({
      message:
        "Additional proof links submitted. Your claim is back in queue for admin review.",
    });
  } catch (err) {
    console.error("POST /api/gtd/status/resubmit-proof error:", err);
    return NextResponse.json(
      { error: "Failed to submit additional proof." },
      { status: 500 }
    );
  }
}
