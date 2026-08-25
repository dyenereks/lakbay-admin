import { redirect } from 'next/navigation';
import { Mail } from 'lucide-react';
import { getAdminSession } from '@/lib/auth';
import AdminBreadcrumbs from '../AdminBreadcrumbs';
import ChangePasswordForm from './ChangePasswordForm';

export const dynamic = 'force-dynamic';

export default async function ProfilePage() {
  // The group layout already gates this; re-reading gives us the email and
  // keeps TypeScript happy about it being present.
  const session = await getAdminSession();
  if (!session) {
    redirect('/login');
  }

  return (
    <div className="max-w-[900px] mx-auto px-4 md:px-8 py-8 flex flex-col gap-6">
      <AdminBreadcrumbs items={[{ label: 'Dashboard', href: '/' }, { label: 'Profile' }]} />

      <div className="flex flex-col gap-1">
        <h1
          className="text-font-primary text-[26px] font-bold"
          style={{ fontFamily: 'var(--font-heading)' }}
        >
          Profile
        </h1>
        <p className="text-font-secondary text-[14px]" style={{ fontFamily: 'var(--font-body)' }}>
          Your admin account for Lakbay Travel and Tours.
        </p>
      </div>

      <section
        className="bg-white rounded-[12px] shadow-[0_1px_6px_rgba(0,0,0,0.05)] p-5 flex flex-col gap-3"
        style={{ fontFamily: 'var(--font-body)' }}
      >
        <h2
          className="text-font-primary text-[16px] font-bold"
          style={{ fontFamily: 'var(--font-heading)' }}
        >
          Account
        </h2>
        <p className="flex items-center gap-3 text-[14px] text-font-secondary">
          <Mail size={16} className="text-primary-teal shrink-0" />
          {session.email}
        </p>
        <p className="text-[12px] text-font-muted leading-relaxed">
          The sign-in email is managed in the Firebase console and can&apos;t be changed here —
          changing it would also mean updating the ADMIN_EMAILS allowlist.
        </p>
      </section>

      <ChangePasswordForm email={session.email} />
    </div>
  );
}
