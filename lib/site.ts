/**
 * Origin of the public marketing site this admin manages. It's a *different*
 * deployment, so every link to it must be absolute, and content changes are
 * pushed there over the revalidation webhook (see lib/revalidate.ts).
 */
export const PROD_SITE_URL = 'https://www.lakbaytravelandtours.com';

export const PUBLIC_SITE_URL = process.env.NEXT_PUBLIC_PUBLIC_SITE_URL || PROD_SITE_URL;

export interface SitePhone {
  /** Shown to visitors, formatted however reads best, e.g. "+1 858-288-1777". */
  label: string;
  /** The tel: target in international format, e.g. "+18582881777". */
  dial: string;
  /** Short qualifier shown beside the number, e.g. "San Diego". */
  note: string;
  /** ISO country code for structured data, e.g. "US". */
  areaServed: string;
}

export interface SiteAddress {
  /** Single-line version shown in the footer. */
  label: string;
  streetAddress: string;
  addressLocality: string;
  addressRegion: string;
  postalCode: string;
  addressCountry: string;
}

export interface SiteSettings {
  facebookUrl: string;
  phones: SitePhone[];
  address: SiteAddress;
}

/**
 * Fallback contact details. Firestore (`settings/site`) is the runtime source of
 * truth — see lib/settings-data.ts — and these are used when it's unconfigured,
 * empty, or unreachable, so the site always renders real contact info.
 */
export const DEFAULT_SITE_SETTINGS: SiteSettings = {
  facebookUrl: 'https://www.facebook.com/lakbaytravelandtourscalifornia',
  phones: [
    { label: '+1 858-288-1777', dial: '+18582881777', note: 'San Diego', areaServed: 'US' },
    { label: '0967-098-4951', dial: '+639670984951', note: 'PH', areaServed: 'PH' },
  ],
  address: {
    label: 'Extension Office: Carolino Business Center, 3035 E 8th St, National City, CA 91950',
    streetAddress: 'Carolino Business Center, 3035 E 8th St',
    addressLocality: 'National City',
    addressRegion: 'CA',
    postalCode: '91950',
    addressCountry: 'US',
  },
};

/**
 * Default Facebook URL. Only for client components that can't read Firestore
 * (the header) as a fallback before settings are passed down — server code
 * should call getSiteSettings() instead.
 */
export const FB_PAGE_URL = DEFAULT_SITE_SETTINGS.facebookUrl;

/**
 * Package images may be stored as absolute URLs (Firebase Storage uploads) or
 * as paths relative to the public site (`/images/packages/x.jpg`, from the
 * original seed data). The admin is a different origin, so relative paths have
 * to be resolved against the public site or they 404 here.
 */
export function resolveImageUrl(img: string): string {
  if (!img) return '';
  if (/^https?:\/\//i.test(img)) return img;
  return `${PUBLIC_SITE_URL}${img.startsWith('/') ? '' : '/'}${img}`;
}
