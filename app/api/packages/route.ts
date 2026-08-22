import { NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/auth';
import { revalidatePublicSite } from '@/lib/revalidate';
import { requireAdminFirestore } from '@/lib/firebase/admin';
import { PACKAGES_COLLECTION, RESERVED_SLUGS } from '@/lib/packages-data';
import type { TourPackage } from '@/lib/packages';

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function unauthorized() {
  return NextResponse.json({ error: 'Not signed in.' }, { status: 401 });
}

function badRequest(message: string) {
  return NextResponse.json({ error: message }, { status: 400 });
}

/** Refresh every page on the public site that renders package data. */
async function revalidatePackages(slug: string, previousSlug?: string) {
  const paths = ['/', '/[slug]', `/${slug}`];
  if (previousSlug && previousSlug !== slug) {
    paths.push(`/${previousSlug}`);
  }
  return revalidatePublicSite(paths);
}

function cleanStrings(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const list = value.map((item) => String(item ?? '').trim()).filter(Boolean);
  return list.length ? list : undefined;
}

/**
 * Build a Firestore document from untrusted input: only known fields are
 * copied, and undefined keys are dropped because Firestore rejects them.
 */
function toDocument(body: Record<string, unknown>) {
  const variants = Array.isArray(body.variants)
    ? (body.variants as { name?: unknown; route?: unknown }[])
        .map((v) => ({ name: String(v?.name ?? '').trim(), route: String(v?.route ?? '').trim() }))
        .filter((v) => v.name || v.route)
    : undefined;

  const doc: Record<string, unknown> = {
    slug: String(body.slug ?? '').trim(),
    name: String(body.name ?? '').trim(),
    tagline: String(body.tagline ?? '').trim(),
    tag: String(body.tag ?? '').trim(),
    price: String(body.price ?? '').trim(),
    img: String(body.img ?? '').trim(),
    borderGradient: String(body.borderGradient ?? '').trim(),
    overview: cleanStrings(body.overview) ?? [],
    highlights: cleanStrings(body.highlights),
    inclusions: cleanStrings(body.inclusions),
    exclusions: cleanStrings(body.exclusions),
    travelDates: cleanStrings(body.travelDates),
    notes: cleanStrings(body.notes),
    variants: variants?.length ? variants : undefined,
    priceAmount: typeof body.priceAmount === 'number' ? body.priceAmount : undefined,
    priceCurrency:
      body.priceCurrency === 'USD' || body.priceCurrency === 'PHP' ? body.priceCurrency : undefined,
    order: typeof body.order === 'number' ? body.order : undefined,
    // Anything other than an explicit false is published.
    published: body.published !== false,
    updatedAt: new Date().toISOString(),
  };

  return Object.fromEntries(Object.entries(doc).filter(([, v]) => v !== undefined));
}

function validate(doc: Record<string, unknown>): string | null {
  const slug = doc.slug as string;
  if (!slug) return 'A URL slug is required.';
  if (!SLUG_PATTERN.test(slug)) {
    return 'Slug may only contain lowercase letters, numbers and single hyphens.';
  }
  if (RESERVED_SLUGS.has(slug)) return `"${slug}" is reserved by another page on the site.`;
  if (!doc.name) return 'A name is required.';
  if (!doc.tagline) return 'A tagline is required.';
  if (!(doc.overview as string[])?.length) return 'At least one overview paragraph is required.';
  return null;
}

/** Create a new package. */
export async function POST(request: Request) {
  if (!(await getAdminSession())) return unauthorized();

  try {
    const body = await request.json();
    const doc = toDocument(body);
    const invalid = validate(doc);
    if (invalid) return badRequest(invalid);

    const slug = doc.slug as string;
    const db = requireAdminFirestore();
    const ref = db.collection(PACKAGES_COLLECTION).doc(slug);

    if ((await ref.get()).exists) {
      return badRequest(`A package with the slug "${slug}" already exists.`);
    }

    await ref.set(doc);
    const { warning } = await revalidatePackages(slug);

    return NextResponse.json({ ok: true, slug, warning });
  } catch (error) {
    console.error('[admin] create package failed:', error);
    return NextResponse.json({ error: 'Could not save the package.' }, { status: 500 });
  }
}

/** Update an existing package, handling slug renames. */
export async function PUT(request: Request) {
  if (!(await getAdminSession())) return unauthorized();

  try {
    const body = await request.json();
    const doc = toDocument(body);
    const invalid = validate(doc);
    if (invalid) return badRequest(invalid);

    const slug = doc.slug as string;
    const originalSlug = typeof body.originalSlug === 'string' ? body.originalSlug : slug;

    const db = requireAdminFirestore();
    const collection = db.collection(PACKAGES_COLLECTION);

    if (slug !== originalSlug) {
      // Renaming means a new document id: make sure we aren't clobbering one.
      if ((await collection.doc(slug).get()).exists) {
        return badRequest(`A package with the slug "${slug}" already exists.`);
      }
      await collection.doc(slug).set(doc);
      await collection.doc(originalSlug).delete();
    } else {
      await collection.doc(slug).set(doc);
    }

    const { warning } = await revalidatePackages(slug, originalSlug);

    return NextResponse.json({ ok: true, slug, warning });
  } catch (error) {
    console.error('[admin] update package failed:', error);
    return NextResponse.json({ error: 'Could not save the package.' }, { status: 500 });
  }
}

/** Toggle publish status without touching the rest of the document. */
export async function PATCH(request: Request) {
  if (!(await getAdminSession())) return unauthorized();

  try {
    const body = await request.json();
    const slug = typeof body.slug === 'string' ? body.slug : '';
    if (!slug) return badRequest('Missing slug.');
    if (typeof body.published !== 'boolean') return badRequest('published must be a boolean.');

    const db = requireAdminFirestore();
    const ref = db.collection(PACKAGES_COLLECTION).doc(slug);
    if (!(await ref.get()).exists) {
      return badRequest(`No package found with the slug "${slug}".`);
    }

    await ref.update({ published: body.published, updatedAt: new Date().toISOString() });
    const { warning } = await revalidatePackages(slug);

    return NextResponse.json({ ok: true, slug, published: body.published, warning });
  } catch (error) {
    console.error('[admin] publish toggle failed:', error);
    return NextResponse.json({ error: 'Could not update the package.' }, { status: 500 });
  }
}

/** Delete a package. */
export async function DELETE(request: Request) {
  if (!(await getAdminSession())) return unauthorized();

  try {
    const slug = new URL(request.url).searchParams.get('slug');
    if (!slug) return badRequest('Missing slug.');

    const db = requireAdminFirestore();
    await db.collection(PACKAGES_COLLECTION).doc(slug).delete();
    const { warning } = await revalidatePackages(slug);

    return NextResponse.json({ ok: true, warning });
  } catch (error) {
    console.error('[admin] delete package failed:', error);
    return NextResponse.json({ error: 'Could not delete the package.' }, { status: 500 });
  }
}
