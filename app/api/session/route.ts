import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getAdminAuth } from '@/lib/firebase/admin';
import { SESSION_COOKIE, SESSION_MAX_AGE_MS, isEmailAllowed } from '@/lib/auth';

/** Exchange a Firebase ID token for an httpOnly session cookie. */
export async function POST(request: Request) {
  const auth = getAdminAuth();
  if (!auth) {
    return NextResponse.json({ error: 'Firebase Admin is not configured.' }, { status: 503 });
  }

  let idToken: string | undefined;
  try {
    ({ idToken } = await request.json());
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  if (!idToken) {
    return NextResponse.json({ error: 'Missing idToken.' }, { status: 400 });
  }

  try {
    const decoded = await auth.verifyIdToken(idToken, true);

    if (!isEmailAllowed(decoded.email)) {
      return NextResponse.json({ error: 'This account is not authorized.' }, { status: 403 });
    }

    const sessionCookie = await auth.createSessionCookie(idToken, {
      expiresIn: SESSION_MAX_AGE_MS,
    });

    (await cookies()).set(SESSION_COOKIE, sessionCookie, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: SESSION_MAX_AGE_MS / 1000,
    });

    return NextResponse.json({ ok: true, email: decoded.email });
  } catch {
    return NextResponse.json({ error: 'Could not verify sign-in.' }, { status: 401 });
  }
}

/** Sign out: clear the cookie. */
export async function DELETE() {
  (await cookies()).delete(SESSION_COOKIE);
  return NextResponse.json({ ok: true });
}
