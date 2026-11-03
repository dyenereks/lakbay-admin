import { cookies } from 'next/headers';
import { getAdminAuth } from '@/lib/firebase/admin';
import { isAdminEmail } from '@/lib/admins-data';

export const SESSION_COOKIE = 'lakbay_session';
/** Firebase session cookies max out at 14 days. */
export const SESSION_MAX_AGE_MS = 60 * 60 * 24 * 14 * 1000;

export interface AdminSession {
  uid: string;
  email: string;
}

/**
 * Whether an address may sign in. Async because the allowlist lives in
 * Firestore now (see lib/admins-data.ts) so admins can be managed from the UI;
 * ADMIN_EMAILS still acts as an always-allowed bootstrap.
 */
export async function isEmailAllowed(email: string | undefined): Promise<boolean> {
  return isAdminEmail(email);
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
    if (!(await isEmailAllowed(decoded.email))) return null;
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
