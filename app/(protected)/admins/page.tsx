import { redirect } from 'next/navigation';
import { getAdminSession } from '@/lib/auth';
import { listAdmins, isAllowlistEmpty } from '@/lib/admins-data';
import AdminBreadcrumbs from '../AdminBreadcrumbs';
import AdminUsersManager from './AdminUsersManager';

export const dynamic = 'force-dynamic';

export default async function AdminUsersPage() {
  const session = await getAdminSession();
  if (!session) {
    redirect('/login');
  }

  const [admins, allowlistEmpty] = await Promise.all([listAdmins(), isAllowlistEmpty()]);

  return (
    <div className="max-w-[900px] mx-auto px-4 md:px-8 py-8 flex flex-col gap-6">
      <AdminBreadcrumbs items={[{ label: 'Dashboard', href: '/' }, { label: 'Admin users' }]} />

      <div className="flex flex-col gap-1">
        <h1
          className="text-font-primary text-[26px] font-bold"
          style={{ fontFamily: 'var(--font-heading)' }}
        >
          Admin users
        </h1>
        <p className="text-font-secondary text-[14px]" style={{ fontFamily: 'var(--font-body)' }}>
          Who can sign in and edit the site.
        </p>
      </div>

      {allowlistEmpty && (
        <p
          className="text-[13px] text-accent-orange bg-accent-orange/10 rounded-[8px] p-4 leading-relaxed"
          style={{ fontFamily: 'var(--font-body)' }}
        >
          <strong>No admins are configured, so any account in this Firebase project can sign
          in.</strong>{' '}
          Add yourself below to close that off — once at least one admin exists, only the listed
          addresses are allowed.
        </p>
      )}

      <AdminUsersManager admins={admins} currentEmail={session.email} />
    </div>
  );
}
