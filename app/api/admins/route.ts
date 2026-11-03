import { NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/auth';
import { requireAdminAuth } from '@/lib/firebase/admin';
import {
  addAdmin,
  removeAdmin,
  listAdmins,
  isValidEmail,
  bootstrapEmails,
} from '@/lib/admins-data';

function badRequest(message: string) {
  return NextResponse.json({ error: message }, { status: 400 });
}

/**
 * Invite an admin.
 *
 * Creates the Firebase Auth account if it doesn't exist, with a random password
 * nobody ever sees — the invitee sets their own via the password-setup email the
 * client sends next. No one types a password on someone else's behalf.
 */
export async function POST(request: Request) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: 'Not signed in.' }, { status: 401 });

  try {
    const body = await request.json();
    const email = String(body.email ?? '').trim().toLowerCase();

    if (!email) return badRequest('An email address is required.');
    if (!isValidEmail(email)) return badRequest(`"${email}" doesn't look like an email address.`);

    const admins = await listAdmins();
    if (admins.some((admin) => admin.email === email)) {
      return badRequest(`${email} is already an admin.`);
    }

    const auth = requireAdminAuth();

    // The account may already exist (a former admin, or someone with a Firebase
    // login for another reason) — reuse it rather than failing.
    let created = false;
    try {
      await auth.getUserByEmail(email);
    } catch {
      await auth.createUser({
        email,
        emailVerified: false,
        // Long random value: never shown, never used. The invitee sets their
        // own password through the setup email.
        password: `${crypto.randomUUID()}${crypto.randomUUID()}`,
      });
      created = true;
    }

    await addAdmin(email, session.email);

    return NextResponse.json({ ok: true, email, created });
  } catch (error) {
    console.error('[admins] invite failed:', error);
    const message = error instanceof Error ? error.message : 'Could not add that admin.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/** Revoke an admin's access. The Firebase account is left intact. */
export async function DELETE(request: Request) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: 'Not signed in.' }, { status: 401 });

  try {
    const email = (new URL(request.url).searchParams.get('email') ?? '').trim().toLowerCase();
    if (!email) return badRequest('Missing email.');

    // Guards against locking everyone — or yourself — out.
    if (email === session.email.toLowerCase()) {
      return badRequest('You cannot remove your own access.');
    }
    if (bootstrapEmails().includes(email)) {
      return badRequest(
        `${email} comes from the ADMIN_EMAILS environment variable and has to be removed there.`
      );
    }

    const admins = await listAdmins();
    if (!admins.some((admin) => admin.email === email)) {
      return badRequest(`${email} is not an admin.`);
    }
    if (admins.length <= 1) {
      return badRequest('That is the only admin — removing it would lock everyone out.');
    }

    await removeAdmin(email);

    // Their session cookie is checked against the allowlist on every request, so
    // access is already gone; revoking tokens also kills any client SDK session.
    try {
      const auth = requireAdminAuth();
      const user = await auth.getUserByEmail(email);
      await auth.revokeRefreshTokens(user.uid);
    } catch (error) {
      console.warn('[admins] could not revoke tokens for the removed admin:', error);
    }

    return NextResponse.json({ ok: true, email });
  } catch (error) {
    console.error('[admins] remove failed:', error);
    const message = error instanceof Error ? error.message : 'Could not remove that admin.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
