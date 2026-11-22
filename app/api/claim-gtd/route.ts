import { NextRequest, NextResponse } from "next/server";
import { saveGtdClaim, getGtdClaimByWallet } from "@/lib/supabase";

function isValidEvmAddress(address: unknown): address is string {
  if (typeof address !== "string") return false;
  return /^0x[a-fA-F0-9]{40}$/.test(address.trim());
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);

    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { error: "Invalid request payload. Expected JSON body." },
        { status: 400 }
      );
    }

    const { walletAddress, passCode, moves, timeSeconds, puzzleType } = body as {
      walletAddress?: unknown;
      passCode?: unknown;
      moves?: unknown;
      timeSeconds?: unknown;
      puzzleType?: unknown;
    };

    if (!isValidEvmAddress(walletAddress)) {
      return NextResponse.json(
        { error: "Invalid EVM wallet address. Please connect a valid Base/Ethereum wallet." },
        { status: 400 }
      );
    }

    if (typeof passCode !== "string" || !passCode.startsWith("GTD-")) {
      return NextResponse.json(
        { error: "Invalid or missing GTD Pass ID. You must solve the puzzle to generate a pass." },
        { status: 400 }
      );
    }

    const movesNum = Number(moves);
    const timeNum = Number(timeSeconds);

    if (!Number.isFinite(movesNum) || movesNum < 0) {
      return NextResponse.json(
        { error: "Invalid moves count provided." },
        { status: 400 }
      );
    }

    if (!Number.isFinite(timeNum) || timeNum < 0) {
      return NextResponse.json(
        { error: "Invalid solve time provided." },
        { status: 400 }
      );
    }

    const validPuzzleType =
      puzzleType === "mathematical" || puzzleType === "word_cipher"
        ? puzzleType
        : "image_tile";

    const result = await saveGtdClaim({
      walletAddress: walletAddress.trim(),
      passCode: passCode.trim(),
      moves: Math.round(movesNum),
      timeSeconds: Math.round(timeNum),
      puzzleType: validPuzzleType,
      chainId: 8453, // Base Mainnet
    });

    if (result.isDuplicate) {
      return NextResponse.json(
        {
          error: "This wallet address has already claimed a GTD allowlist spot.",
          code: "DUPLICATE_CLAIM",
          existingRecord: {
            walletAddress: result.record.wallet_address,
            passCode: result.record.pass_code,
            puzzleType: result.record.puzzle_type,
            claimedAt: result.record.created_at,
          },
        },
        { status: 409 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Congratulations! GTD Allowlist spot secured successfully on Base.",
        record: {
          id: result.record.id,
          walletAddress: result.record.wallet_address,
          passCode: result.record.pass_code,
          puzzleType: result.record.puzzle_type,
          moves: result.record.moves,
          timeSeconds: result.record.time_seconds,
          chainId: result.record.chain_id,
          status: result.record.status,
          claimedAt: result.record.created_at,
        },
      },
      { status: 201 }
    );
  } catch (err: unknown) {
    console.error("[POST /api/claim-gtd] Error:", err);
    return NextResponse.json(
      { error: "Failed to record GTD allowlist claim. Please try again." },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const wallet = searchParams.get("wallet");

    if (!wallet) {
      return NextResponse.json(
        { error: "Missing required 'wallet' query parameter." },
        { status: 400 }
      );
    }

    if (!isValidEvmAddress(wallet)) {
      return NextResponse.json(
        { error: "Invalid EVM wallet address format." },
        { status: 400 }
      );
    }

    const claim = await getGtdClaimByWallet(wallet);

    if (!claim) {
      return NextResponse.json(
        { claimed: false, message: "No GTD allowlist claim found for this wallet." },
        { status: 200 }
      );
    }

    return NextResponse.json(
      {
        claimed: true,
        claim: {
          walletAddress: claim.wallet_address,
          passCode: claim.pass_code,
          puzzleType: claim.puzzle_type,
          moves: claim.moves,
          timeSeconds: claim.time_seconds,
          status: claim.status,
          claimedAt: claim.created_at,
        },
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("[GET /api/claim-gtd] Error:", err);
    return NextResponse.json(
      { error: "Failed to look up GTD claim." },
      { status: 500 }
    );
  }
}
