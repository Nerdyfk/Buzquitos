import crypto from "node:crypto";
import { cookies } from "next/headers";
import { sha256, signToken, verifyToken } from "@/lib/gtd/security";

export const USER_SESSION_COOKIE = "gtd_user_session";

function getUserSessionSecret(): string {
  const explicit = process.env.SESSION_SECRET?.trim();
  if (explicit) return explicit;
  const material = `${process.env.MONGODB_URI || "buzquitos-local"}::${process.env.ADMIN_PASSWORD || "buzquitos-dev"}::gtd-user-session-v1`;
  return crypto.createHash("sha256").update(material).digest("hex");
}

export interface UserSessionPayload {
  sid: string;
  uid: string;
  uname: string;
  exp: number;
  [key: string]: unknown;
}

export async function createUserSession(
  userId: string,
  canonicalUsername: string
): Promise<{ rawToken: string; tokenHash: string; payload: UserSessionPayload }> {
  const payload: UserSessionPayload = {
    sid: crypto.randomBytes(16).toString("hex"),
    uid: userId,
    uname: canonicalUsername,
    exp: Date.now() + 1000 * 60 * 60 * 24 * 7, // 7 days
  };
  const rawToken = signToken(payload, getUserSessionSecret());
  const tokenHash = sha256(payload.sid);

  const cookieStore = await cookies();
  cookieStore.set(USER_SESSION_COOKIE, rawToken, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });

  return { rawToken, tokenHash, payload };
}

export async function getUserSession(): Promise<
  (UserSessionPayload & { tokenHash: string }) | null
> {
  const cookieStore = await cookies();
  const raw = cookieStore.get(USER_SESSION_COOKIE)?.value;
  if (!raw) return null;
  const payload = verifyToken<UserSessionPayload>(raw, getUserSessionSecret());
  if (!payload || !payload.sid || !payload.uid) return null;
  return {
    ...payload,
    tokenHash: sha256(payload.sid),
  };
}
