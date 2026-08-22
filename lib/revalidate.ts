import { PUBLIC_SITE_URL } from '@/lib/site';

/**
 * Ask the public site to refresh cached pages.
 *
 * When the admin lived inside the public app, `revalidatePath` did this
 * in-process. Now they're separate deployments, so Next's cache API here would
 * do nothing to the public site — the request has to go over HTTP to an endpoint
 * the public app exposes, authenticated with a shared secret.
 */

const secret = process.env.REVALIDATE_SECRET;

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
      const warning = `The public site rejected the refresh (${response.status}). ${detail}`.trim();
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
