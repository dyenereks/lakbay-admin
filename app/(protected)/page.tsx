import Link from 'next/link';
import { Package, Phone, ArrowRight } from 'lucide-react';
import { getAllPackages } from '@/lib/packages-data';
import { getSiteSettings } from '@/lib/settings-data';
import { isAdminConfigured, getAdminInitError } from '@/lib/firebase/admin';
import { getRevalidateConfig } from '@/lib/revalidate';

export const dynamic = 'force-dynamic';

export default async function AdminDashboard() {
  const [packages, settings] = await Promise.all([getAllPackages(), getSiteSettings()]);
  const initError = getAdminInitError();
  const revalidate = getRevalidateConfig();
  const liveCount = packages.filter((pkg) => pkg.published).length;
  const draftCount = packages.length - liveCount;

  const sections = [
    {
      href: '/packages',
      icon: Package,
      title: 'Tour packages',
      description: 'Add, edit, reorder, publish or hide the packages shown on the site.',
      summary: `${liveCount} live${draftCount > 0 ? `, ${draftCount} draft` : ''}`,
      accent: 'linear-gradient(90deg, #D6246E 0%, #7B2FA0 50%, #1565C0 100%)',
      iconColor: '#D6246E',
    },
    {
      href: '/settings',
      icon: Phone,
      title: 'Contact settings',
      description: 'Facebook page link, phone numbers and the office address in the footer.',
      summary: `${settings.phones.length} number${settings.phones.length === 1 ? '' : 's'}`,
      accent: 'linear-gradient(90deg, #0EA5A5 0%, #78BE20 50%, #D4941A 100%)',
      iconColor: '#0EA5A5',
    },
  ];

  return (
    <div className="max-w-[1100px] mx-auto px-4 md:px-8 py-8 flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1
          className="text-font-primary text-[26px] font-bold"
          style={{ fontFamily: 'var(--font-heading)' }}
        >
          Dashboard
        </h1>
        <p className="text-font-secondary text-[14px]" style={{ fontFamily: 'var(--font-body)' }}>
          Changes go live on the site within a few seconds of saving.
        </p>
      </div>

      {initError ? (
        <p
          className="text-[13px] text-accent-pink bg-accent-pink/10 rounded-[8px] p-4 leading-relaxed"
          style={{ fontFamily: 'var(--font-body)' }}
        >
          Firebase rejected the configured service account, so this is showing built-in defaults and
          saving will fail. This is usually a malformed <code>FIREBASE_PRIVATE_KEY</code> — it must
          keep its <code>\n</code> sequences and include the BEGIN/END PRIVATE KEY lines. Error:{' '}
          {initError}
        </p>
      ) : (
        !isAdminConfigured && (
          <p
            className="text-[13px] text-accent-orange bg-accent-orange/10 rounded-[8px] p-4 leading-relaxed"
            style={{ fontFamily: 'var(--font-body)' }}
          >
            Firebase Admin isn&apos;t configured, so this is showing built-in defaults and saving
            will fail. Set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL and FIREBASE_PRIVATE_KEY.
          </p>
        )
      )}

      {!revalidate.secretConfigured && (
        <p
          className="text-[13px] text-accent-orange bg-accent-orange/10 rounded-[8px] p-4 leading-relaxed"
          style={{ fontFamily: 'var(--font-body)' }}
        >
          <strong>REVALIDATE_SECRET is not set here.</strong> Saving will store your changes, but the
          public site won&apos;t refresh — edits will only appear on its next deploy. Set this to the
          same value as the <code>REVALIDATE_SECRET</code> on {revalidate.targetUrl}.
        </p>
      )}

      <p
        className="text-[12px] text-font-muted"
        style={{ fontFamily: 'var(--font-body)' }}
      >
        Publishing to <strong>{revalidate.targetUrl}</strong> · refresh hook{' '}
        {revalidate.secretConfigured ? 'configured' : 'not configured'}
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        {sections.map((section) => {
          const Icon = section.icon;
          return (
            <Link
              key={section.href}
              href={section.href}
              className="group bg-white rounded-[14px] shadow-[0_1px_6px_rgba(0,0,0,0.05)] hover:shadow-[0_6px_20px_rgba(0,0,0,0.09)] transition-all duration-200 hover:-translate-y-0.5 p-6 flex flex-col gap-4 overflow-hidden"
              style={{ borderTop: '3px solid transparent', borderImage: `${section.accent} 1` }}
            >
              <div className="flex items-start justify-between gap-3">
                <div
                  className="w-12 h-12 rounded-[12px] flex items-center justify-center bg-bg-light shrink-0"
                  aria-hidden="true"
                >
                  <Icon size={22} color={section.iconColor} />
                </div>
                <span
                  className="text-[12px] font-semibold text-font-muted bg-bg-light rounded-full px-3 py-1"
                  style={{ fontFamily: 'var(--font-body)' }}
                >
                  {section.summary}
                </span>
              </div>

              <div className="flex flex-col gap-1.5" style={{ fontFamily: 'var(--font-body)' }}>
                <h2
                  className="text-font-primary text-[18px] font-bold"
                  style={{ fontFamily: 'var(--font-heading)' }}
                >
                  {section.title}
                </h2>
                <p className="text-font-secondary text-[14px] leading-relaxed">
                  {section.description}
                </p>
              </div>

              <span
                className="mt-auto flex items-center gap-1.5 text-[13px] font-semibold text-accent-pink"
                style={{ fontFamily: 'var(--font-body)' }}
              >
                Manage
                <ArrowRight
                  size={14}
                  className="group-hover:translate-x-0.5 transition-transform"
                />
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
