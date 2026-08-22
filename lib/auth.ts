import { cookies } from 'next/headers';
import { getAdminAuth } from '@/lib/firebase/admin';

export const SESSION_COOKIE = 'lakbay_session';
/** Firebase session cookies max out at 14 days. */
export const SESSION_MAX_AGE_MS = 60 * 60 * 24 * 14 * 1000;

export interface AdminSession {
  uid: string;
  email: string;
}

/**
 * Emails allowed into the admin. Empty means "any account that exists in this
 * Firebase project", which is fine when you create users by hand — but setting
 * ADMIN_EMAILS is the safer default.
 */
function allowedEmails(): string[] {
  return (process.env.ADMIN_EMAILS ?? '')
    .split(',')
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

export function isEmailAllowed(email: string | undefined): boolean {
  if (!email) return false;
  const allowed = allowedEmails();
  if (allowed.length === 0) return true;
  return allowed.includes(email.toLowerCase());
}

/**
 * Verify the session cookie server-side. Returns null for anonymous or invalid
 * sessions — never throws, so callers can treat it as a plain auth check.
 */
export async function getAdminSession(): Promise<AdminSession | null> {
  const auth = getAdminAuth();
  if (!auth) return null;

  const cookie = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!cookie) return null;

  try {
    // checkRevoked: a disabled or signed-out user loses access immediately.
    const decoded = await auth.verifySessionCookie(cookie, true);
    if (!isEmailAllowed(decoded.email)) return null;
    return { uid: decoded.uid, email: decoded.email ?? '' };
  } catch {
    return null;
  }
}

/** Throws when unauthenticated. Use in write handlers. */
export async function requireAdminSession(): Promise<AdminSession> {
  const session = await getAdminSession();
  if (!session) {
    throw new Error('UNAUTHORIZED');
  }
  return session;
}
