import Link from 'next/link';
import Image from 'next/image';
import { Plus, Pencil, ExternalLink } from 'lucide-react';
import { getAllPackages } from '@/lib/packages-data';
import { isAdminConfigured } from '@/lib/firebase/admin';
import PublishToggle from '../PublishToggle';
import AdminBreadcrumbs from '../AdminBreadcrumbs';
import { PUBLIC_SITE_URL, resolveImageUrl } from '@/lib/site';

export const dynamic = 'force-dynamic';

export default async function PackagesPage() {
  // Admin sees drafts as well as live packages.
  const packages = await getAllPackages();
  const liveCount = packages.filter((pkg) => pkg.published).length;
  const draftCount = packages.length - liveCount;

  return (
    <div className="max-w-[1100px] mx-auto px-4 md:px-8 py-8 flex flex-col gap-6">
      <AdminBreadcrumbs
        items={[{ label: 'Dashboard', href: '/' }, { label: 'Tour packages' }]}
      />

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1
            className="text-font-primary text-[26px] font-bold"
            style={{ fontFamily: 'var(--font-heading)' }}
          >
            Tour Packages
          </h1>
          <p className="text-font-secondary text-[14px]" style={{ fontFamily: 'var(--font-body)' }}>
            {liveCount} live{draftCount > 0 && `, ${draftCount} draft`} · changes go live within a few
            seconds of saving
          </p>
        </div>
        <Link
          href="/packages/new"
          className="gradient-btn-primary text-white text-[14px] font-semibold rounded-full px-5 py-2.5 hover:opacity-90 transition-opacity flex items-center gap-2"
          style={{ fontFamily: 'var(--font-body)' }}
        >
          <Plus size={16} />
          New package
        </Link>
      </div>

      {!isAdminConfigured && (
        <p
          className="text-[13px] text-accent-orange bg-accent-orange/10 rounded-[8px] p-4 leading-relaxed"
          style={{ fontFamily: 'var(--font-body)' }}
        >
          Firebase Admin isn&apos;t configured, so this list is showing the built-in seed data and
          saving will fail. Set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL and FIREBASE_PRIVATE_KEY.
        </p>
      )}

      <ul className="flex flex-col gap-3">
        {packages.map((pkg) => (
          <li
            key={pkg.slug}
            className={`bg-white rounded-[12px] shadow-[0_1px_6px_rgba(0,0,0,0.05)] flex items-center gap-4 p-3 ${
              pkg.published ? '' : 'opacity-75'
            }`}
          >
            <div className="relative w-[88px] h-[64px] rounded-[8px] overflow-hidden shrink-0 bg-bg-light">
              {pkg.img && (
                <Image src={resolveImageUrl(pkg.img)} alt="" fill sizes="88px" className="object-cover" />
              )}
            </div>

            <div className="flex flex-col gap-0.5 flex-1 min-w-0" style={{ fontFamily: 'var(--font-body)' }}>
              <span className="flex items-center gap-2 min-w-0">
                <span className="text-font-primary text-[15px] font-semibold truncate">{pkg.name}</span>
                <span
                  className={`shrink-0 text-[10px] font-bold uppercase tracking-wide rounded-full px-2 py-0.5 ${
                    pkg.published
                      ? 'bg-accent-green/15 text-accent-green'
                      : 'bg-font-muted/15 text-font-muted'
                  }`}
                >
                  {pkg.published ? 'Live' : 'Draft'}
                </span>
              </span>
              <span className="text-font-muted text-[12px] truncate">/{pkg.slug}</span>
              <span className="text-primary-teal text-[13px] font-semibold">{pkg.price}</span>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <PublishToggle slug={pkg.slug} published={Boolean(pkg.published)} />
              {pkg.published && (
                <a
                  href={`${PUBLIC_SITE_URL}/${pkg.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`View ${pkg.name} on the site`}
                  className="p-2 rounded-[8px] text-font-muted hover:text-primary-teal hover:bg-bg-light transition-colors"
                >
                  <ExternalLink size={16} />
                </a>
              )}
              <Link
                href={`/packages/${pkg.slug}`}
                className="flex items-center gap-1.5 text-[13px] font-semibold text-font-primary border border-border-light rounded-full px-4 py-2 hover:border-primary-teal hover:text-primary-teal transition-colors"
                style={{ fontFamily: 'var(--font-body)' }}
              >
                <Pencil size={14} />
                Edit
              </Link>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
