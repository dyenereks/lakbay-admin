import { redirect } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { getAdminSession } from '@/lib/auth';
import { PUBLIC_SITE_URL } from '@/lib/site';
import SignOutButton from './SignOutButton';

/**
 * Every route inside this group is gated here, on the server. Client-side
 * redirects alone would leak the markup before the redirect ran.
 *
 * force-dynamic so no admin route can ever be prerendered and served from cache
 * without the session check running.
 */
export const dynamic = 'force-dynamic';
export default async function ProtectedAdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getAdminSession();
  if (!session) {
    redirect('/login');
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-white border-b border-border-light">
        <div className="max-w-[1100px] mx-auto px-4 md:px-8 py-3 flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-3">
            <Image src="/images/lakbay-logo.png" alt="Lakbay Travel and Tours" width={120} height={37} />
            <span
              className="text-font-muted text-[13px] font-semibold border-l border-border-light pl-3"
              style={{ fontFamily: 'var(--font-body)' }}
            >
              Admin
            </span>
          </Link>
          <div className="flex items-center gap-4" style={{ fontFamily: 'var(--font-body)' }}>
            {/* Section links live on the dashboard, not here. */}
            <a
              href={PUBLIC_SITE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[13px] text-font-secondary hover:text-primary-teal transition-colors hidden sm:inline"
            >
              View site
            </a>
            {/* Shows the email where there's room, stays reachable when there isn't. */}
            <Link
              href="/profile"
              className="text-[13px] text-font-muted hover:text-primary-teal transition-colors"
            >
              <span className="hidden md:inline">{session.email}</span>
              <span className="md:hidden">Profile</span>
            </Link>
            <SignOutButton />
          </div>
        </div>
        <div className="gradient-rainbow h-[3px] w-full" />
      </header>
      <main className="flex-1">{children}</main>
    </div>
  );
}
