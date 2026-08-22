import { initializeApp, getApps, getApp, cert, type App } from 'firebase-admin/app';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';
import { getAuth, type Auth } from 'firebase-admin/auth';
import { getStorage } from 'firebase-admin/storage';

/**
 * Service-account keys are multi-line PEM blocks, which env vars can't hold
 * directly. Hosts mangle them in predictable ways, so normalize the common
 * cases rather than handing `cert()` something it will reject:
 *  - escaped "\n" sequences (Netlify, Vercel, most CI)
 *  - the whole value wrapped in quotes, kept literally by some dashboards
 *  - CRLF line endings from a Windows copy/paste
 */
function normalizePrivateKey(raw: string | undefined): string | undefined {
  if (!raw) return undefined;
  let key = raw.trim();
  if (
    (key.startsWith('"') && key.endsWith('"')) ||
    (key.startsWith("'") && key.endsWith("'"))
  ) {
    key = key.slice(1, -1);
  }
  return key.replace(/\\n/g, '\n').replace(/\r\n/g, '\n');
}

const projectId = process.env.FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const privateKey = normalizePrivateKey(process.env.FIREBASE_PRIVATE_KEY);

/** True when server-side service-account credentials are present. */
export const isAdminConfigured = Boolean(projectId && clientEmail && privateKey);

/** Set when credentials are present but Firebase refused them. */
let initError: Error | null = null;

/** Why Admin SDK setup failed, for surfacing in the admin UI. */
export function getAdminInitError(): string | null {
  return initError ? initError.message : null;
}

/**
 * Lazily initialize the Admin SDK. Deliberately never throws — pages import this
 * during builds that may not have credentials, and callers treat a null app as
 * "unconfigured" and degrade. A malformed key used to throw from cert() and
 * surface as a 500 on every admin route, including the sign-in page.
 */
function getAdminApp(): App | null {
  if (!isAdminConfigured) return null;
  if (getApps().length) return getApp();

  try {
    return initializeApp({
      credential: cert({ projectId, clientEmail, privateKey }),
    });
  } catch (error) {
    if (!initError) {
      initError = error instanceof Error ? error : new Error(String(error));
      console.error(
        '[firebase-admin] Could not initialize with the configured service account. ' +
          'This is usually a malformed FIREBASE_PRIVATE_KEY:',
        initError.message
      );
    }
    return null;
  }
}

export function getAdminFirestore(): Firestore | null {
  const app = getAdminApp();
  if (!app) return null;
  const db = getFirestore(app);
  return db;
}

export function getAdminAuth(): Auth | null {
  const app = getAdminApp();
  return app ? getAuth(app) : null;
}

export const STORAGE_BUCKET =
  process.env.FIREBASE_STORAGE_BUCKET ?? process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;

/** Default Cloud Storage bucket, or null when unconfigured. */
export function getAdminBucket() {
  const app = getAdminApp();
  if (!app || !STORAGE_BUCKET) return null;
  return getStorage(app).bucket(STORAGE_BUCKET);
}

/** Distinguishes "no credentials" from "credentials rejected" in error output. */
function notConfiguredMessage(): string {
  if (initError) {
    return `Firebase Admin rejected the configured service account: ${initError.message}`;
  }
  return 'Firebase Admin is not configured. Set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL and FIREBASE_PRIVATE_KEY.';
}

/** Use in write paths where operating without credentials is a bug, not a fallback. */
export function requireAdminFirestore(): Firestore {
  const db = getAdminFirestore();
  if (!db) throw new Error(notConfiguredMessage());
  return db;
}

export function requireAdminAuth(): Auth {
  const auth = getAdminAuth();
  if (!auth) throw new Error(notConfiguredMessage());
  return auth;
}
