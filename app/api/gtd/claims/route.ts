import { NextRequest, NextResponse } from "next/server";
import { getUserSession } from "@/lib/gtd/auth";
import {
  checkRateLimit,
  getClientIp,
  isValidHttpUrl,
  isValidTwitterPostUrl,
  normalizeBscWallet,
  verifyCsrfOrigin,
} from "@/lib/gtd/security";
import {
  ClaimError,
  getPublicCampaignSnapshot,
  reserveSpotAndCreateSubmission,
} from "@/lib/gtd/campaign";

export async function POST(req: NextRequest) {
  try {
    if (!verifyCsrfOrigin(req)) {
      return NextResponse.json(
        { error: "Invalid request origin." },
        { status: 403 }
      );
    }

    const ip = getClientIp(req);
    const rl = checkRateLimit(`gtd:claim:submit:${ip}`, 10, 60_000);
    if (!rl.allowed) {
      return NextResponse.json(
        {
          error: `Too many claim requests. Try again in ${rl.retryAfterSeconds}s.`,
        },
        { status: 429 }
      );
    }

    const session = await getUserSession();
    if (!session) {
      return NextResponse.json(
        {
          error:
            "Session expired or missing. You must solve your personalized puzzle before claiming.",
        },
        { status: 401 }
      );
    }

    const body = (await req.json().catch(() => null)) as {
      puzzleId?: unknown;
      walletAddress?: unknown;
      commentPostUrl?: unknown;
      announcementPostUrl?: unknown;
      postUrl?: unknown;
      proofLinks?: unknown;
      tasksConfirmed?: unknown;
    } | null;

    if (
      !body ||
      typeof body.puzzleId !== "string" ||
      typeof body.walletAddress !== "string"
    ) {
      return NextResponse.json(
        { error: "Invalid claim submission data." },
        { status: 400 }
      );
    }

    // Required: comment on pinned post URL (or fallback to announcementPostUrl)
    const rawCommentUrl =
      typeof body.commentPostUrl === "string"
        ? body.commentPostUrl.trim()
        : typeof body.announcementPostUrl === "string"
        ? body.announcementPostUrl.trim()
        : "";

    if (!rawCommentUrl || !isValidTwitterPostUrl(rawCommentUrl)) {
      return NextResponse.json(
        {
          error:
            "Please enter a valid Twitter/X URL to your comment on our pinned post (e.g. https://x.com/username/status/123456789).",
        },
        { status: 400 }
      );
    }

    // Optional: personal post URL about GTD Challenge
    const rawPostUrl =
      typeof body.postUrl === "string" && body.postUrl.trim()
        ? body.postUrl.trim()
        : typeof body.announcementPostUrl === "string" && body.announcementPostUrl.trim() !== rawCommentUrl
        ? body.announcementPostUrl.trim()
        : "";

    if (rawPostUrl && !isValidTwitterPostUrl(rawPostUrl)) {
      return NextResponse.json(
        {
          error:
            "Please enter a valid Twitter/X post URL for your personal post (e.g. https://x.com/username/status/123456789), or leave it empty.",
        },
        { status: 400 }
      );
    }

    if (body.tasksConfirmed !== true) {
      return NextResponse.json(
        {
          error:
            "You must confirm that all required social tasks have been completed.",
        },
        { status: 400 }
      );
    }

    const normalizedWallet = normalizeBscWallet(body.walletAddress);
    if (!normalizedWallet) {
      return NextResponse.json(
        {
          error:
            "Invalid BNB Smart Chain (BEP-20) wallet address. Must be a valid 0x address with 40 hex characters.",
        },
        { status: 400 }
      );
    }

    const rawProofs = Array.isArray(body.proofLinks) ? body.proofLinks : [];
    const cleanProofLinks = rawProofs
      .filter((s): s is string => typeof s === "string")
      .map((s) => s.trim())
      .filter((u) => Boolean(u) && u !== rawCommentUrl && u !== rawPostUrl)
      .slice(0, 5);

    for (const url of cleanProofLinks) {
      if (!isValidHttpUrl(url)) {
        return NextResponse.json(
          { error: `Invalid optional proof URL: ${url}` },
          { status: 400 }
        );
      }
    }

    const { submission } = await reserveSpotAndCreateSubmission({
      userId: session.uid,
      puzzleId: body.puzzleId.trim(),
      sessionTokenHash: session.tokenHash,
      walletAddress: normalizedWallet,
      commentPostUrl: rawCommentUrl,
      announcementPostUrl: rawPostUrl || rawCommentUrl,
      proofLinks: [rawCommentUrl, ...(rawPostUrl ? [rawPostUrl] : []), ...cleanProofLinks],
      tasksConfirmed: true,
      ipAddress: ip,
      userAgent: req.headers.get("user-agent") ?? null,
    });

    const campaign = await getPublicCampaignSnapshot();

    return NextResponse.json(
      {
        message:
          "Your claim has been submitted and a provisional GTD spot is reserved pending manual admin verification.",
        submission: {
          submissionCode: submission.submissionCode,
          twitterUsername: submission.user.twitterUsername,
          displayUsername: submission.user.displayUsername,
          walletAddress: submission.walletAddress,
          puzzleId: submission.puzzleId,
          status: submission.status,
          reservedAt: submission.reservedAt,
        },
        campaign,
      },
      { status: 201 }
    );
  } catch (err) {
    if (err instanceof ClaimError) {
      return NextResponse.json(
        { code: err.code, error: err.message },
        { status: err.httpStatus }
      );
    }
    console.error("POST /api/gtd/claims error:", err);
    return NextResponse.json(
      { error: "Unable to process your whitelist claim right now." },
      { status: 500 }
    );
  }
}
