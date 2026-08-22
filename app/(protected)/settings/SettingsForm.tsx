'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Trash2, ArrowUp, ArrowDown } from 'lucide-react';
import type { SiteSettings, SitePhone } from '@/lib/site';
import AdminBreadcrumbs from '../AdminBreadcrumbs';

const inputClass =
  'w-full border border-border-light rounded-[8px] px-3 py-2.5 text-[14px] text-font-primary bg-white focus:outline-none focus:border-primary-teal';

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[13px] font-semibold text-font-primary">{label}</span>
      {children}
      {hint && <span className="text-[12px] text-font-muted">{hint}</span>}
    </label>
  );
}

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="bg-white rounded-[12px] shadow-[0_1px_6px_rgba(0,0,0,0.05)] p-5 flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h2
          className="text-font-primary text-[16px] font-bold"
          style={{ fontFamily: 'var(--font-heading)' }}
        >
          {title}
        </h2>
        {description && <p className="text-[13px] text-font-muted leading-relaxed">{description}</p>}
      </div>
      {children}
    </section>
  );
}

export default function SettingsForm({ initialSettings }: { initialSettings: SiteSettings }) {
  const router = useRouter();
  const [form, setForm] = useState<SiteSettings>(initialSettings);
  const [error, setError] = useState<string | null>(null);
  const [savedWarning, setSavedWarning] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  function updatePhone(index: number, patch: Partial<SitePhone>) {
    setForm((prev) => {
      const phones = [...prev.phones];
      phones[index] = { ...phones[index], ...patch };
      return { ...prev, phones };
    });
    setSaved(false);
  }

  function movePhone(index: number, delta: number) {
    const target = index + delta;
    if (target < 0 || target >= form.phones.length) return;
    setForm((prev) => {
      const phones = [...prev.phones];
      [phones[index], phones[target]] = [phones[target], phones[index]];
      return { ...prev, phones };
    });
    setSaved(false);
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setSavedWarning(null);
    setSaved(false);
    setIsSaving(true);

    try {
      const response = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? 'Save failed.');

      setSaved(true);
      if (result.warning) setSavedWarning(result.warning);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed.');
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="max-w-[900px] mx-auto px-4 md:px-8 pt-4 pb-8 flex flex-col gap-5"
      style={{ fontFamily: 'var(--font-body)' }}
    >
      <AdminBreadcrumbs
        items={[{ label: 'Dashboard', href: '/' }, { label: 'Contact settings' }]}
      />

      <div className="sticky top-0 z-20 -mx-4 md:-mx-8 px-4 md:px-8 py-4 bg-bg-light/95 backdrop-blur-sm border-b border-border-light flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1
            className="text-font-primary text-[24px] font-bold"
            style={{ fontFamily: 'var(--font-heading)' }}
          >
            Contact settings
          </h1>
          <div className="flex items-center gap-3">
            {saved && !isSaving && (
              <span className="text-[13px] font-semibold text-accent-green">Saved</span>
            )}
            <button
              type="button"
              onClick={() => router.push('/')}
              className="text-[14px] font-semibold text-font-secondary hover:text-font-primary"
            >
              Back
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="gradient-btn-primary text-white text-[14px] font-semibold rounded-full px-6 py-2.5 hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {isSaving ? 'Saving…' : 'Save changes'}
            </button>
          </div>
        </div>

        {error && (
          <p className="text-[13px] text-accent-pink bg-accent-pink/10 rounded-[8px] p-3">{error}</p>
        )}

        {savedWarning && (
          <p className="text-[13px] text-accent-orange bg-accent-orange/10 rounded-[8px] p-3 leading-relaxed">
            <strong>Saved — but the public site wasn&apos;t refreshed.</strong> Your change is stored
            and will appear on the site&apos;s next deploy. {savedWarning}
          </p>
        )}
      </div>

      <Section
        title="Facebook page"
        description="Every Book Now button and booking link on the site points here."
      >
        <Field label="Page URL" hint="e.g. https://www.facebook.com/yourpage">
          <input
            type="url"
            required
            value={form.facebookUrl}
            onChange={(e) => {
              setForm({ ...form, facebookUrl: e.target.value });
              setSaved(false);
            }}
            className={inputClass}
          />
        </Field>
      </Section>

      <Section
        title="Phone numbers"
        description="Shown in the footer, on package pages and on the 404 page. The first number is the one search engines treat as primary."
      >
        <div className="flex flex-col gap-4">
          {form.phones.map((phone, index) => (
            <div
              key={index}
              className="border border-border-light rounded-[10px] p-4 flex flex-col gap-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-[12px] font-bold uppercase tracking-wide text-font-muted">
                  {index === 0 ? 'Primary' : `Number ${index + 1}`}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => movePhone(index, -1)}
                    disabled={index === 0}
                    aria-label="Move up"
                    className="p-1 text-font-muted hover:text-primary-teal disabled:opacity-30"
                  >
                    <ArrowUp size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => movePhone(index, 1)}
                    disabled={index === form.phones.length - 1}
                    aria-label="Move down"
                    className="p-1 text-font-muted hover:text-primary-teal disabled:opacity-30"
                  >
                    <ArrowDown size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setForm({ ...form, phones: form.phones.filter((_, i) => i !== index) });
                      setSaved(false);
                    }}
                    aria-label="Remove number"
                    className="p-1 text-font-muted hover:text-accent-pink"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Field label="Display text" hint="Exactly how it appears on the site">
                  <input
                    type="text"
                    value={phone.label}
                    onChange={(e) => updatePhone(index, { label: e.target.value })}
                    className={inputClass}
                  />
                </Field>
                <Field label="Dial number" hint="International format, e.g. +18582881777">
                  <input
                    type="text"
                    value={phone.dial}
                    onChange={(e) => updatePhone(index, { dial: e.target.value })}
                    className={inputClass}
                  />
                </Field>
                <Field label="Label" hint="Shown in brackets, e.g. San Diego">
                  <input
                    type="text"
                    value={phone.note}
                    onChange={(e) => updatePhone(index, { note: e.target.value })}
                    className={inputClass}
                  />
                </Field>
                <Field label="Country code" hint="For search engines, e.g. US or PH">
                  <input
                    type="text"
                    maxLength={2}
                    value={phone.areaServed}
                    onChange={(e) =>
                      updatePhone(index, { areaServed: e.target.value.toUpperCase() })
                    }
                    className={inputClass}
                  />
                </Field>
              </div>
            </div>
          ))}

          <button
            type="button"
            onClick={() => {
              setForm({
                ...form,
                phones: [...form.phones, { label: '', dial: '', note: '', areaServed: '' }],
              });
              setSaved(false);
            }}
            className="self-start flex items-center gap-1.5 text-[13px] font-semibold text-primary-teal hover:opacity-80"
          >
            <Plus size={14} />
            Add phone number
          </button>
        </div>
      </Section>

      <Section
        title="Office address"
        description="The first line shows in the footer. The rest is used only by search engines for local results — leave it blank to hide the address entirely."
      >
        <Field label="Address shown in the footer">
          <input
            type="text"
            value={form.address.label}
            onChange={(e) => {
              setForm({ ...form, address: { ...form.address, label: e.target.value } });
              setSaved(false);
            }}
            className={inputClass}
          />
        </Field>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Field label="Street address">
            <input
              type="text"
              value={form.address.streetAddress}
              onChange={(e) => {
                setForm({
                  ...form,
                  address: { ...form.address, streetAddress: e.target.value },
                });
                setSaved(false);
              }}
              className={inputClass}
            />
          </Field>
          <Field label="City">
            <input
              type="text"
              value={form.address.addressLocality}
              onChange={(e) => {
                setForm({
                  ...form,
                  address: { ...form.address, addressLocality: e.target.value },
                });
                setSaved(false);
              }}
              className={inputClass}
            />
          </Field>
          <Field label="State / region">
            <input
              type="text"
              value={form.address.addressRegion}
              onChange={(e) => {
                setForm({ ...form, address: { ...form.address, addressRegion: e.target.value } });
                setSaved(false);
              }}
              className={inputClass}
            />
          </Field>
          <Field label="Postal code">
            <input
              type="text"
              value={form.address.postalCode}
              onChange={(e) => {
                setForm({ ...form, address: { ...form.address, postalCode: e.target.value } });
                setSaved(false);
              }}
              className={inputClass}
            />
          </Field>
          <Field label="Country code" hint="e.g. US">
            <input
              type="text"
              maxLength={2}
              value={form.address.addressCountry}
              onChange={(e) => {
                setForm({
                  ...form,
                  address: { ...form.address, addressCountry: e.target.value.toUpperCase() },
                });
                setSaved(false);
              }}
              className={inputClass}
            />
          </Field>
        </div>
      </Section>
    </form>
  );
}
