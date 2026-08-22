import { cache } from 'react';
import { getAdminFirestore } from '@/lib/firebase/admin';
import { DEFAULT_SITE_SETTINGS, type SiteSettings, type SitePhone } from '@/lib/site';

/**
 * Server-only access to editable site settings (contact details).
 *
 * Firestore holds a single document at `settings/site`. Every field falls back
 * to DEFAULT_SITE_SETTINGS individually, so a partially-filled document can
 * never blank out contact info on the public site.
 */

export const SETTINGS_COLLECTION = 'settings';
export const SETTINGS_DOC = 'site';

function normalizePhones(value: unknown): SitePhone[] | null {
  if (!Array.isArray(value)) return null;
  const phones = value
    .map((entry) => {
      const phone = entry as Partial<SitePhone> | null;
      return {
        label: String(phone?.label ?? '').trim(),
        dial: String(phone?.dial ?? '').trim(),
        note: String(phone?.note ?? '').trim(),
        areaServed: String(phone?.areaServed ?? '').trim(),
      };
    })
    .filter((phone) => phone.label && phone.dial);
  return phones.length ? phones : null;
}

function merge(data: Record<string, unknown>): SiteSettings {
  const address = (data.address ?? {}) as Partial<SiteSettings['address']>;
  return {
    facebookUrl: String(data.facebookUrl ?? '').trim() || DEFAULT_SITE_SETTINGS.facebookUrl,
    phones: normalizePhones(data.phones) ?? DEFAULT_SITE_SETTINGS.phones,
    address: {
      label: String(address.label ?? '').trim() || DEFAULT_SITE_SETTINGS.address.label,
      streetAddress:
        String(address.streetAddress ?? '').trim() || DEFAULT_SITE_SETTINGS.address.streetAddress,
      addressLocality:
        String(address.addressLocality ?? '').trim() ||
        DEFAULT_SITE_SETTINGS.address.addressLocality,
      addressRegion:
        String(address.addressRegion ?? '').trim() || DEFAULT_SITE_SETTINGS.address.addressRegion,
      postalCode:
        String(address.postalCode ?? '').trim() || DEFAULT_SITE_SETTINGS.address.postalCode,
      addressCountry:
        String(address.addressCountry ?? '').trim() || DEFAULT_SITE_SETTINGS.address.addressCountry,
    },
  };
}

async function fetchSiteSettings(): Promise<SiteSettings> {
  const db = getAdminFirestore();
  if (!db) return DEFAULT_SITE_SETTINGS;

  try {
    const doc = await db.collection(SETTINGS_COLLECTION).doc(SETTINGS_DOC).get();
    if (!doc.exists) return DEFAULT_SITE_SETTINGS;
    return merge(doc.data() ?? {});
  } catch (error) {
    console.error('[settings] Firestore read failed, using defaults:', error);
    return DEFAULT_SITE_SETTINGS;
  }
}

/** Editable contact details. Deduped per render pass. */
export const getSiteSettings = cache(fetchSiteSettings);
