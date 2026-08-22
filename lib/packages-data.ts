import { cache } from 'react';
import { getAdminFirestore } from '@/lib/firebase/admin';
import { seedPackages, type TourPackage } from '@/lib/packages';

/**
 * Server-only data access for tour packages.
 *
 * Firestore is the source of truth; `seedPackages` is the fallback when Firebase
 * is unconfigured (local dev without credentials) or a read fails, so the public
 * site never goes blank because of a backend problem.
 */

export const PACKAGES_COLLECTION = 'packages';

/** Top-level paths that are real routes, so they can't be used as package slugs. */
export const RESERVED_SLUGS = new Set([
  'admin',
  'api',
  'about',
  'contact',
  'terms',
  'privacy',
  'tours',
  'tour',
  'images',
  'packages',
]);

function sortPackages(list: TourPackage[]): TourPackage[] {
  return [...list].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
}

/**
 * Normalize a document into a TourPackage. `published` is defaulted to true so
 * documents written before the field existed keep showing on the public site.
 */
function normalize(slug: string, data: Record<string, unknown>): TourPackage {
  const pkg = { ...(data as Omit<TourPackage, 'slug'>), slug } as TourPackage;
  return { ...pkg, published: pkg.published !== false };
}

async function fetchAllPackages(): Promise<TourPackage[]> {
  const db = getAdminFirestore();
  const fallback = () =>
    sortPackages(seedPackages.map((pkg) => ({ ...pkg, published: pkg.published !== false })));

  if (!db) return fallback();

  try {
    const snapshot = await db.collection(PACKAGES_COLLECTION).get();
    if (snapshot.empty) {
      console.warn('[packages] Firestore collection is empty — falling back to seed data.');
      return fallback();
    }
    return sortPackages(snapshot.docs.map((doc) => normalize(doc.id, doc.data())));
  } catch (error) {
    console.error('[packages] Firestore read failed, falling back to seed data:', error);
    return fallback();
  }
}

/**
 * Every package regardless of status — admin only. Never use this on public
 * pages; it would leak drafts.
 */
export const getAllPackages = cache(fetchAllPackages);

/** Published packages in display order — the public site's view. */
export async function getPackages(): Promise<TourPackage[]> {
  const all = await getAllPackages();
  return all.filter((pkg) => pkg.published);
}

/** A published package by slug. Drafts read as missing, so public pages 404. */
export async function getPackage(slug: string): Promise<TourPackage | undefined> {
  const all = await getPackages();
  return all.find((pkg) => pkg.slug === slug);
}

/** A package by slug regardless of status — for the admin editor. */
export async function getPackageForAdmin(slug: string): Promise<TourPackage | undefined> {
  const all = await getAllPackages();
  return all.find((pkg) => pkg.slug === slug);
}

export type { TourPackage };
