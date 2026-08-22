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
    const response = await fetch(`${PUBLIC_SITE_URL}/api/revalidate`, {
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
    const response = await fetch(`${PUBLIC_SITE_URL}/api/revalidate`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${secret}` },
      cache: 'no-store',
    });

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
      return {
        ...base,
        ok: false,
        publicConfigured: true,
        message:
          'Both sites have a secret, but they do not match. Set REVALIDATE_SECRET to the same value on each.',
      };
    }

    return {
      ...base,
      ok: true,
      publicConfigured: true,
      message: 'Connected — saves will refresh the public site.',
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
