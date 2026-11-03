import { cache } from 'react';
import { getAdminFirestore } from '@/lib/firebase/admin';

/**
 * Who may sign in to the admin.
 *
 * The allowlist used to be ADMIN_EMAILS alone, which is a hosting env var and
 * so can only change via a redeploy — no good for managing admins from the UI.
 * It now lives in Firestore, with ADMIN_EMAILS retained as a **bootstrap**:
 * those addresses are always allowed, so an empty or broken collection can't
 * lock everyone out, and the first admin exists before the collection does.
 */

export const ADMINS_COLLECTION = 'admins';

export interface AdminUser {
  email: string;
  /** Who invited them; absent for bootstrap entries. */
  addedBy?: string;
  addedAt?: string;
  /**
   * True when the address comes from ADMIN_EMAILS rather than Firestore. These
   * are managed in the hosting environment, so the UI can't remove them.
   */
  fromEnvironment: boolean;
}

/** Addresses from ADMIN_EMAILS, lowercased. */
export function bootstrapEmails(): string[] {
  return (process.env.ADMIN_EMAILS ?? '')
    .split(',')
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

function normalize(email: string): string {
  return email.trim().toLowerCase();
}

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

async function fetchAdmins(): Promise<AdminUser[]> {
  const env = bootstrapEmails().map<AdminUser>((email) => ({ email, fromEnvironment: true }));

  const db = getAdminFirestore();
  if (!db) return env;

  try {
    const snapshot = await db.collection(ADMINS_COLLECTION).get();
    const stored = snapshot.docs
      .map((doc) => {
        const data = doc.data();
        return {
          email: normalize(String(data.email ?? doc.id)),
          addedBy: typeof data.addedBy === 'string' ? data.addedBy : undefined,
          addedAt: typeof data.addedAt === 'string' ? data.addedAt : undefined,
          fromEnvironment: false,
        } satisfies AdminUser;
      })
      .filter((admin) => admin.email);

    // Bootstrap wins on a clash: it can't be removed here, and saying so is
    // more useful than showing the same address twice.
    const envEmails = new Set(env.map((admin) => admin.email));
    return [...env, ...stored.filter((admin) => !envEmails.has(admin.email))].sort((a, b) =>
      a.email.localeCompare(b.email)
    );
  } catch (error) {
    console.error('[admins] Firestore read failed, using bootstrap list only:', error);
    return env;
  }
}

/** Everyone allowed in, bootstrap first. Deduped per render pass. */
export const listAdmins = cache(fetchAdmins);

/**
 * Whether an address may sign in.
 *
 * With no bootstrap AND no stored admins this stays permissive — that was the
 * behaviour before the collection existed, and tightening it on an empty
 * project would lock out the only person able to fix it.
 */
export async function isAdminEmail(email: string | undefined): Promise<boolean> {
  if (!email) return false;
  const admins = await listAdmins();
  if (admins.length === 0) return true;
  return admins.some((admin) => admin.email === normalize(email));
}

/** True when nobody is configured, so the admin is open to any Firebase account. */
export async function isAllowlistEmpty(): Promise<boolean> {
  return (await listAdmins()).length === 0;
}

export async function addAdmin(email: string, addedBy: string): Promise<void> {
  const db = getAdminFirestore();
  if (!db) throw new Error('Firebase Admin is not configured.');

  const normalized = normalize(email);
  await db.collection(ADMINS_COLLECTION).doc(normalized).set({
    email: normalized,
    addedBy,
    addedAt: new Date().toISOString(),
  });
}

export async function removeAdmin(email: string): Promise<void> {
  const db = getAdminFirestore();
  if (!db) throw new Error('Firebase Admin is not configured.');

  await db.collection(ADMINS_COLLECTION).doc(normalize(email)).delete();
}
