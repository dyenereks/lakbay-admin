import { PUBLIC_SITE_URL } from '@/lib/site';

/**
 * Ask the public site to refresh cached pages.
 *
 * When the admin lived inside the public app, `revalidatePath` did this
 * in-process. Now they're separate deployments, so Next's cache API here would
 * do nothing to the public site — the request has to go over HTTP to an endpoint
 * the public app exposes, authenticated with a shared secret.
 */

// Trimmed to match the public endpoint: a trailing newline picked up when
// pasting into a hosting dashboard would otherwise cause a 401 on every save.
const secret = process.env.REVALIDATE_SECRET?.trim();

/**
 * Whether this app can refresh the public site, for showing on the dashboard.
 * Deliberately reports only presence, never the secret value.
 */
export function getRevalidateConfig(): { targetUrl: string; secretConfigured: boolean } {
  return { targetUrl: PUBLIC_SITE_URL, secretConfigured: Boolean(secret) };
}

/**
 * Only follow a redirect that stays on the same site (apex <-> www, or a
 * subdomain of the same host). Re-attaching credentials to an arbitrary
 * redirect target would leak the secret to whoever controls it.
 */
function isSameSiteRedirect(from: URL, to: URL): boolean {
  if (to.protocol !== 'https:') return false;
  const bare = (host: string) => host.replace(/^www\./i, '').toLowerCase();
  return bare(from.hostname) === bare(to.hostname);
}

/**
 * fetch() drops the Authorization header when it follows a redirect to another
 * host — so pointing this app at the apex domain when the site canonicalises to
 * www means the token silently never arrives, and the public site reports the
 * request as unauthenticated.
 *
 * Handle the redirect explicitly and re-send the header to the canonical host,
 * reporting where it ended up so the misconfiguration can be fixed properly.
 */
async function authedFetch(
  url: string,
  init: RequestInit
): Promise<{ response: Response; redirectedTo?: string }> {
  const first = await fetch(url, { ...init, redirect: 'manual' });

  if (first.status >= 300 && first.status < 400) {
    const location = first.headers.get('location');
    if (location) {
      const target = new URL(location, url);
      if (isSameSiteRedirect(new URL(url), target)) {
        const response = await fetch(target.toString(), { ...init, redirect: 'manual' });
        return { response, redirectedTo: target.origin };
      }
      return { response: first, redirectedTo: target.origin };
    }
  }

  return { response: first };
}

export interface RevalidateResult {
  ok: boolean;
  /** Populated when the public site couldn't be refreshed. */
  warning?: string;
}

/**
 * Never throws: a failed refresh must not turn a successful save into an error.
 * The caller surfaces the warning so the editor knows the site may be stale.
 */
export async function revalidatePublicSite(
  paths: string[],
  options: { layout?: boolean } = {}
): Promise<RevalidateResult> {
  if (!secret) {
    const warning =
      'REVALIDATE_SECRET is not set, so the public site was not refreshed. Changes will appear on its next deploy.';
    console.warn('[revalidate]', warning);
    return { ok: false, warning };
  }

  try {
    const { response } = await authedFetch(`${PUBLIC_SITE_URL}/api/revalidate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${secret}`,
      },
      body: JSON.stringify({ paths, layout: options.layout ?? false }),
      cache: 'no-store',
    });

    if (!response.ok) {
      const detail = await response.text().catch(() => '');
      const warning =
        response.status === 401
          ? 'The public site rejected the credential (401). REVALIDATE_SECRET must be set to the same value on both this admin and the public site.'
          : `The public site rejected the refresh (${response.status}). ${detail}`.trim();
      console.error('[revalidate]', warning);
      return { ok: false, warning };
    }

    return { ok: true };
  } catch (error) {
    const warning = `Could not reach the public site to refresh it: ${
      error instanceof Error ? error.message : String(error)
    }`;
    console.error('[revalidate]', warning);
    return { ok: false, warning };
  }
}

export interface ConnectionCheck {
  ok: boolean;
  /** Whether this admin has a secret configured at all. */
  adminConfigured: boolean;
  /** Whether the public site has one configured. */
  publicConfigured: boolean;
  targetUrl: string;
  message: string;
}

/**
 * Verify the refresh link to the public site without changing anything.
 *
 * Distinguishes the failure modes that all look identical from a save: no
 * secret here, no secret there, the two not matching, or the site being
 * unreachable.
 */
export async function checkPublicSiteConnection(): Promise<ConnectionCheck> {
  const base = { targetUrl: PUBLIC_SITE_URL, adminConfigured: Boolean(secret) };

  if (!secret) {
    return {
      ...base,
      ok: false,
      publicConfigured: false,
      message:
        'REVALIDATE_SECRET is not set on this admin, so saves cannot refresh the public site.',
    };
  }

  try {
    const { response, redirectedTo } = await authedFetch(`${PUBLIC_SITE_URL}/api/revalidate`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${secret}` },
      cache: 'no-store',
    });
    const redirectNote = redirectedTo
      ? ` Note: ${PUBLIC_SITE_URL} redirects to ${redirectedTo} — set NEXT_PUBLIC_PUBLIC_SITE_URL to ${redirectedTo} so requests aren't redirected.`
      : '';

    // A site that predates the check endpoint answers 405/404 rather than JSON.
    const result = await response.json().catch(() => null);

    if (!result || typeof result.configured !== 'boolean') {
      return {
        ...base,
        ok: false,
        publicConfigured: false,
        message: `The public site did not return a valid response (HTTP ${response.status}). It may not have the check endpoint deployed yet.`,
      };
    }

    if (!result.configured) {
      return {
        ...base,
        ok: false,
        publicConfigured: false,
        message: 'REVALIDATE_SECRET is not set on the public site.',
      };
    }

    if (!result.authenticated) {
      // 'no-token' means the header never arrived — almost always a redirect
      // stripping it, not a wrong secret.
      const message =
        result.reason === 'no-token'
          ? `The public site received no credential, so the request was redirected and the Authorization header was dropped.${redirectNote || ' Check NEXT_PUBLIC_PUBLIC_SITE_URL points at the canonical domain.'}`
          : `Both sites have a secret, but they do not match. Set REVALIDATE_SECRET to the same value on each.${redirectNote}`;
      return { ...base, ok: false, publicConfigured: true, message };
    }

    return {
      ...base,
      ok: true,
      publicConfigured: true,
      message: `Connected — saves will refresh the public site.${redirectNote}`,
    };
  } catch (error) {
    return {
      ...base,
      ok: false,
      publicConfigured: false,
      message: `Could not reach the public site: ${
        error instanceof Error ? error.message : String(error)
      }`,
    };
  }
}
