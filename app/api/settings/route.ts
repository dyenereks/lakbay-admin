import { NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/auth';
import { revalidatePublicSite } from '@/lib/revalidate';
import { requireAdminFirestore } from '@/lib/firebase/admin';
import { SETTINGS_COLLECTION, SETTINGS_DOC } from '@/lib/settings-data';

/** Digits with optional leading +, allowing spaces, dashes and parens. */
const DIAL_PATTERN = /^\+?[\d\s()-]{6,20}$/;

function badRequest(message: string) {
  return NextResponse.json({ error: message }, { status: 400 });
}

function isHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

export async function PUT(request: Request) {
  if (!(await getAdminSession())) {
    return NextResponse.json({ error: 'Not signed in.' }, { status: 401 });
  }

  try {
    const body = await request.json();

    const facebookUrl = String(body.facebookUrl ?? '').trim();
    if (!facebookUrl) return badRequest('A Facebook page URL is required.');
    if (!isHttpUrl(facebookUrl)) {
      return badRequest('The Facebook page URL must start with http:// or https://.');
    }

    const rawPhones: Record<string, unknown>[] = Array.isArray(body.phones) ? body.phones : [];
    const phones = rawPhones
      .map((entry) => ({
        label: String(entry?.label ?? '').trim(),
        dial: String(entry?.dial ?? '').trim(),
        note: String(entry?.note ?? '').trim(),
        areaServed: String(entry?.areaServed ?? '').trim().toUpperCase(),
      }))
      .filter((phone) => phone.label || phone.dial);

    if (phones.length === 0) return badRequest('Add at least one phone number.');

    for (const phone of phones) {
      if (!phone.label) return badRequest('Every phone number needs a display label.');
      if (!phone.dial) return badRequest(`"${phone.label}" needs a dial number.`);
      if (!DIAL_PATTERN.test(phone.dial)) {
        return badRequest(
          `"${phone.dial}" doesn't look like a phone number. Use international format, e.g. +18582881777.`
        );
      }
    }

    const rawAddress = (body.address ?? {}) as Record<string, unknown>;
    const address = {
      label: String(rawAddress.label ?? '').trim(),
      streetAddress: String(rawAddress.streetAddress ?? '').trim(),
      addressLocality: String(rawAddress.addressLocality ?? '').trim(),
      addressRegion: String(rawAddress.addressRegion ?? '').trim(),
      postalCode: String(rawAddress.postalCode ?? '').trim(),
      addressCountry: String(rawAddress.addressCountry ?? '').trim().toUpperCase(),
    };

    const db = requireAdminFirestore();
    await db
      .collection(SETTINGS_COLLECTION)
      .doc(SETTINGS_DOC)
      .set({ facebookUrl, phones, address, updatedAt: new Date().toISOString() });

    // Contact details appear in the global footer and header, so refresh every
    // page rather than a single route.
    const { warning } = await revalidatePublicSite(['/'], { layout: true });

    return NextResponse.json({ ok: true, warning });
  } catch (error) {
    console.error('[admin] settings update failed:', error);
    return NextResponse.json({ error: 'Could not save settings.' }, { status: 500 });
  }
}
