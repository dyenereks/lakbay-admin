import { NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/auth';
import { checkPublicSiteConnection } from '@/lib/revalidate';

/**
 * Verifies this admin can refresh the public site. Signed-in admins only —
 * it reports configuration state, so it shouldn't be publicly probeable.
 */
export async function GET() {
  if (!(await getAdminSession())) {
    return NextResponse.json({ error: 'Not signed in.' }, { status: 401 });
  }

  const result = await checkPublicSiteConnection();
  return NextResponse.json(result, { status: result.ok ? 200 : 503 });
}
