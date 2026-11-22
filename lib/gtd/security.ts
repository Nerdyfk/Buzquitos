import crypto from "node:crypto";
import type { NextRequest } from "next/server";

export function normalizeTwitterUsername(input: string): {
  canonical: string;
  display: string;
} | null {
  const trimmed = input.trim().replace(/^@+/, "");
  if (!/^[a-zA-Z0-9_]{1,15}$/.test(trimmed)) {
    return null;
  }
  return {
    canonical: trimmed.toLowerCase(),
    display: trimmed,
  };
}

export function normalizeBscWallet(input: string): string | null {
  const trimmed = input.trim();
  if (!/^0x[a-fA-F0-9]{40}$/.test(trimmed)) {
    return null;
  }
  return trimmed.toLowerCase();
}

export function isValidTwitterPostUrl(input: string): boolean {
  try {
    const url = new URL(input.trim());
    if (url.protocol !== "https:" && url.protocol !== "http:") return false;
    const host = url.hostname.toLowerCase().replace(/^www\./, "");
    if (
      host !== "x.com" &&
      host !== "twitter.com" &&
      host !== "mobile.twitter.com"
    ) {
      return false;
    }
    return /^\/[a-zA-Z0-9_]{1,15}\/status\/\d+/.test(url.pathname);
  } catch {
    return false;
  }
}

export function isValidHttpUrl(input: string): boolean {
  try {
    const url = new URL(input.trim());
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

export function sha256(value: string): string {
  return crypto.createHash("sha256").update(value).digest("hex");
}

export function generatePuzzleId(
  gridSize: 3 | 9 = 3,
  category: "math" | "image" | "word" = "math"
): string {
  const rand = crypto.randomBytes(5).toString("hex").toUpperCase();
  if (category === "image") {
    return `GTD-IMG-${rand}`;
  }
  if (category === "word") {
    return `GTD-WRD-${rand}`;
  }
  return `GTD-${gridSize}X${gridSize}-${rand}`;
}

export function generateSubmissionCode(): string {
  const rand = crypto.randomBytes(4).toString("hex").toUpperCase();
  return `SUB-${rand}`;
}

export function generateWinnerId(rank: number): string {
  const suffix = crypto.randomBytes(2).toString("hex").toUpperCase();
  return `GTD-WIN-${String(rank).padStart(4, "0")}-${suffix}`;
}

export function signToken(
  payload: Record<string, unknown>,
  secret: string
): string {
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString(
    "base64url"
  );
  const signature = crypto
    .createHmac("sha256", secret)
    .update(encodedPayload)
    .digest("base64url");
  return `${encodedPayload}.${signature}`;
}

export function verifyToken<T extends Record<string, unknown>>(
  token: string,
  secret: string
): T | null {
  const parts = token.split(".");
  if (parts.length !== 2) return null;
  const [encodedPayload, signature] = parts;
  const expectedSig = crypto
    .createHmac("sha256", secret)
    .update(encodedPayload)
    .digest("base64url");

  const sigBuf = Buffer.from(signature);
  const expBuf = Buffer.from(expectedSig);
  if (sigBuf.length !== expBuf.length) return null;
  if (!crypto.timingSafeEqual(sigBuf, expBuf)) return null;

  try {
    const parsed = JSON.parse(
      Buffer.from(encodedPayload, "base64url").toString("utf8")
    ) as T & { exp?: number };
    if (typeof parsed.exp === "number" && Date.now() > parsed.exp) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

const rateLimitStore = new Map<string, number[]>();

export function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number
): { allowed: boolean; remaining: number; retryAfterSeconds: number } {
  const now = Date.now();
  const windowStart = now - windowMs;
  const timestamps = (rateLimitStore.get(key) ?? []).filter(
    (ts) => ts > windowStart
  );

  if (timestamps.length >= limit) {
    const oldest = timestamps[0] ?? now;
    const retryAfterSeconds = Math.max(
      1,
      Math.ceil((oldest + windowMs - now) / 1000)
    );
    rateLimitStore.set(key, timestamps);
    return { allowed: false, remaining: 0, retryAfterSeconds };
  }

  timestamps.push(now);
  rateLimitStore.set(key, timestamps);

  if (rateLimitStore.size > 5000) {
    for (const [k, vals] of rateLimitStore.entries()) {
      const fresh = vals.filter((t) => t > windowStart);
      if (fresh.length === 0) rateLimitStore.delete(k);
      else rateLimitStore.set(k, fresh);
    }
  }

  return {
    allowed: true,
    remaining: Math.max(0, limit - timestamps.length),
    retryAfterSeconds: 0,
  };
}

export function getClientIp(req: NextRequest): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  return req.headers.get("x-real-ip") ?? "127.0.0.1";
}

export function verifyCsrfOrigin(req: NextRequest): boolean {
  const origin = req.headers.get("origin");
  const host = req.headers.get("host");
  if (!origin || !host) return true;
  try {
    const originHost = new URL(origin).host;
    return originHost === host;
  } catch {
    return false;
  }
}

export function maskWallet(wallet: string): string {
  if (wallet.length < 12) return wallet;
  return `${wallet.slice(0, 6)}...${wallet.slice(-4)}`;
}
