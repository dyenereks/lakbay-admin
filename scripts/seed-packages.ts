/**
 * Seeds the Firestore `packages` collection from the static seed data.
 *
 *   npm run seed          # create/update missing fields, never clobber edits
 *   npm run seed -- --force   # overwrite existing documents entirely
 *
 * Idempotent: re-running without --force leaves already-seeded documents alone.
 */
import { loadEnvConfig } from '@next/env';
import { seedPackages } from '../lib/packages';

// Load .env.local the same way Next does, before anything reads process.env.
// lib/firebase/admin.ts captures its config at module scope, and it's pulled in
// transitively by lib/packages-data, so BOTH are imported dynamically inside
// main() — a static import would be hoisted above this call and see no env.
loadEnvConfig(process.cwd());

/** Firestore rejects undefined values; drop those keys entirely. */
function stripUndefined<T extends Record<string, unknown>>(obj: T): Partial<T> {
  return Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined)) as Partial<T>;
}

async function main() {
  const force = process.argv.includes('--force');
  const { requireAdminFirestore } = await import('../lib/firebase/admin');
  const { PACKAGES_COLLECTION } = await import('../lib/packages-data');
  const db = requireAdminFirestore();
  const collection = db.collection(PACKAGES_COLLECTION);

  let created = 0;
  let updated = 0;
  let skipped = 0;

  for (const [index, pkg] of seedPackages.entries()) {
    const { slug, ...rest } = pkg;
    const ref = collection.doc(slug);
    const existing = await ref.get();

    if (existing.exists && !force) {
      skipped += 1;
      console.log(`  skip    ${slug} (already exists)`);
      continue;
    }

    await ref.set(
      stripUndefined({
        ...rest,
        slug,
        published: rest.published !== false,
        order: index + 1,
        updatedAt: new Date().toISOString(),
      }),
      { merge: false }
    );

    if (existing.exists) {
      updated += 1;
      console.log(`  update  ${slug}`);
    } else {
      created += 1;
      console.log(`  create  ${slug}`);
    }
  }

  console.log(`\nDone. created=${created} updated=${updated} skipped=${skipped}`);
  if (skipped > 0 && !force) {
    console.log('Re-run with `npm run seed -- --force` to overwrite existing documents.');
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('\nSeed failed:', error instanceof Error ? error.message : error);
    process.exit(1);
  });
