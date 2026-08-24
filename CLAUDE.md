# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

The private content admin for **Lakbay Travel and Tours**. It was split out of the public site repo (`lakbay`, at `../lakbay`) so the two deploy independently.

Both apps talk to the **same Firebase project**. This one owns all writes; the public site only reads.

## Commands

- `npm run dev` — dev server on **port 3122** (the public site uses 3121, so both can run at once)
- `npm run build` / `npm start` — production build / run
- `npm run lint` — ESLint
- `npm run seed` — push `seedPackages` from `lib/packages.ts` into Firestore (idempotent; `-- --force` overwrites). **Needs Node 20+**, as `firebase-admin` won't load on 18.

**Node:** the default shell may be on Node 18, below Next 15's minimum. Use Node 20+ (`~/.nvm/versions/node/v20.20.0/bin/node`).

**macOS install quirk:** an npm bug with optional dependencies can leave `@tailwindcss/oxide-darwin-arm64` uninstalled, which fails the build with "Cannot find native binding" from `next/font`. Fix with `npm install --no-save @tailwindcss/oxide-darwin-arm64@<oxide version>`. Don't add it to `package.json` — that would break Linux CI builds.

## Environment

See `.env.example`. Nothing throws when unset: the app degrades to read-only-looking behaviour and the sign-in page explains what's missing.

## Routes

No `/admin` prefix — this app *is* the admin.

- `app/login/` — public sign-in (Firebase Auth email/password, client SDK).
- `app/(protected)/` — gated **server-side** in the group layout via `getAdminSession()`, and `force-dynamic` so nothing is ever prerendered past the auth check.
  - `/` dashboard → links to the two sections
  - `/packages`, `/packages/new`, `/packages/[slug]`
  - `/settings` — Facebook URL, phone numbers, office address
- `app/api/session` — POST creates the httpOnly session cookie from a Firebase ID token, DELETE signs out.
- `app/api/packages` — POST/PUT/PATCH/DELETE. Re-validates every field server-side, rejects `RESERVED_SLUGS`, handles slug renames.
- `app/api/settings` — PUT contact details.
- `app/api/upload` — image upload to Firebase Storage via the Admin SDK.

## Revalidating the public site

**This is the part that breaks silently if you get it wrong.** When the admin lived inside the public app, saving called `revalidatePath` in-process. The apps are now separate deployments, so Next's cache API here does nothing to the public site.

Instead, `lib/revalidate.ts` POSTs the changed paths to the public site's `/api/revalidate`, authenticated with a shared `REVALIDATE_SECRET` that must be **identical in both projects**. Any new write path must call `revalidatePublicSite()`, or edits won't appear until the public site's next deploy.

It never throws — a failed refresh returns `{ ok: false, warning }`, which the routes pass back in the JSON response so a save isn't reported as a failure when the content did save. The forms surface that warning; don't discard it.

**`NEXT_PUBLIC_PUBLIC_SITE_URL` must be the canonical domain.** `fetch` drops the `Authorization` header when it follows a redirect to another host, so pointing at the apex when the site canonicalises to `www` means the token silently never arrives and the public site reports the call as unauthenticated. `authedFetch()` now re-issues same-site redirects with the header re-attached and reports the redirect, but fixing the URL avoids the extra round trip.

`checkPublicSiteConnection()` verifies the link without changing anything, exposed at `GET /api/revalidate-check` (signed-in admins only). It separates the failure modes that all look alike from a save: no secret here, no secret on the public site, secrets that don't match, and the site being unreachable.

The **Test connection** button is currently hidden from the dashboard. Nothing else was removed — the endpoint and `app/(protected)/ConnectionCheck.tsx` are intact, so re-enabling it means importing that component and rendering it in `app/(protected)/page.tsx` (see the comment there).

## Loading states

Every route in `(protected)` is `force-dynamic` and reads Firestore, so a navigation is a real server round trip. `loading.tsx` files give an instant skeleton instead of the click appearing to do nothing: one per shape at `(protected)/`, `(protected)/packages/` and `(protected)/settings/`. Keep them roughly matching their page's layout so the swap to real content doesn't jump.

**Page tint goes on a wrapper, never `<body>`.** `globals.css` sets `body { background: var(--bg-white) }` *unlayered*, and an unlayered rule beats Tailwind's layered utilities — so `bg-bg-light` on `<body>` is silently ignored. The root layout wraps children in a `min-h-screen bg-bg-light` div instead.

## Shared code

`lib/site.ts`, `lib/packages.ts`, `lib/packages-data.ts`, `lib/settings-data.ts` and `lib/firebase/admin.ts` are **duplicated** in the public repo. There's no shared package. If you change the `TourPackage` shape, the Firestore document layout, or `SiteSettings`, update `../lakbay` to match or the public site will misread the data.

Differences from the public copies:
- `lib/site.ts` here exports `PUBLIC_SITE_URL` (the site being managed) plus `resolveImageUrl()`, since packages seeded with relative paths like `/images/packages/x.jpg` are served by the *public* deployment and 404 against this origin.
- `next.config.ts` sets `images.unoptimized` and must **not** carry the public site's `/packages/:slug` → `/:slug` redirect, which would hijack this app's package editor route.

## Gotchas

- `lib/firebase/admin.ts` never throws on bad credentials — it logs and returns null, so a malformed `FIREBASE_PRIVATE_KEY` degrades instead of 500ing every route including sign-in. `getAdminInitError()` surfaces the reason on the dashboard.
- `package.json` pins `jose` to `^5` for `jwks-rsa` via `overrides`. `jwks-rsa@4` `require()`s jose, but jose 6 is ESM-only — without the pin, `firebase-admin` crashes with `ERR_REQUIRE_ESM` on serverless CommonJS runtimes.
- `firestore.rules` / `storage.rules` are kept here for reference; all writes go through this server, where the Admin SDK bypasses rules. They aren't deployed automatically.
- Firestore doc id **is** the package slug, which enforces uniqueness.
