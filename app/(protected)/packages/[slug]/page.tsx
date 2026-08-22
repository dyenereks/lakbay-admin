import { notFound } from 'next/navigation';
import { getPackageForAdmin } from '@/lib/packages-data';
import PackageForm from '../PackageForm';

export const dynamic = 'force-dynamic';

export default async function EditPackagePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  // Admin editor must reach drafts too, so this bypasses the published filter.
  const pkg = await getPackageForAdmin(slug);

  if (!pkg) {
    notFound();
  }

  return <PackageForm mode="edit" initialPackage={pkg} />;
}
