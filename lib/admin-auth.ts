import { cookies } from 'next/headers';
import crypto from 'crypto';
import { getDb } from '@/lib/mongodb';
import { Db } from 'mongodb';

const SESSION_COOKIE_NAME = 'admin_session';
const SECRET = process.env.ADMIN_SESSION_SECRET || 'buzquitos-admin-default-secret-key-32chars';

export function createAdminToken(email: string): string {
  const payload = {
    email: email.toLowerCase().trim(),
    exp: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60 // 7 days
  };
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto
    .createHmac('sha256', SECRET)
    .update(encodedPayload)
    .digest('base64url');
  return `${encodedPayload}.${signature}`;
}

export function verifyAdminToken(token: string): { email: string } | null {
  try {
    const [encodedPayload, signature] = token.split('.');
    if (!encodedPayload || !signature) return null;

    const expectedSignature = crypto
      .createHmac('sha256', SECRET)
      .update(encodedPayload)
      .digest('base64url');

    if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
      return null;
    }

    const payload = JSON.parse(Buffer.from(encodedPayload, 'base64url').toString('utf-8'));
    if (!payload.exp || payload.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }

    return { email: payload.email };
  } catch {
    return null;
  }
}

export async function verifyAdminCredentials(emailInput: string, passwordInput: string): Promise<boolean> {
  const email = emailInput.trim().toLowerCase();
  const password = passwordInput.trim();
  if (!email || !password) return false;

  // 1. Check against environment variables
  const envAdminEmail = (process.env.ADMIN_EMAIL || '').trim().toLowerCase();
  const envAdminPassword = process.env.ADMIN_PASSWORD;

  if (envAdminPassword) {
    const emailMatches = !envAdminEmail || envAdminEmail === email;
    if (emailMatches && password === envAdminPassword) {
      return true;
    }
  }

  // 2. Check against admin_users collection in MongoDB
  try {
    const db = await getDb();
    const adminUser = await db.collection('admin_users').findOne({ email });
    if (adminUser && adminUser.password_hash && adminUser.salt) {
      const derivedKey = crypto.pbkdf2Sync(password, adminUser.salt, 100000, 64, 'sha512').toString('hex');
      if (crypto.timingSafeEqual(Buffer.from(derivedKey), Buffer.from(adminUser.password_hash))) {
        return true;
      }
    }
  } catch {
    // MongoDB check error or no admin collection yet
  }

  return false;
}

export async function requireAdmin(): Promise<
  | { ok: true; user: { email: string }; db: Db }
  | { ok: false; status: number; message: string }
> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!sessionCookie) {
    return { ok: false, status: 401, message: 'Please sign in.' };
  }

  const verified = verifyAdminToken(sessionCookie);
  if (!verified || !verified.email) {
    return { ok: false, status: 401, message: 'Invalid or expired session. Please sign in again.' };
  }

  const allowedEmails = (process.env.ADMIN_EMAILS || '')
    .split(',')
    .map(v => v.trim().toLowerCase())
    .filter(Boolean);

  if (allowedEmails.length && !allowedEmails.includes(verified.email.toLowerCase())) {
    return { ok: false, status: 403, message: 'This account is not on the admin allow-list.' };
  }

  const db = await getDb();
  return { ok: true, user: { email: verified.email }, db };
}

export { SESSION_COOKIE_NAME };
