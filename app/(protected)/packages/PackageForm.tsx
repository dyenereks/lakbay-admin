'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Plus, Trash2, ArrowUp, ArrowDown, Upload, Loader2 } from 'lucide-react';
import type { TourPackage } from '@/lib/packages';
import { resolveImageUrl } from '@/lib/site';

const EMPTY_PACKAGE: TourPackage = {
  slug: '',
  name: '',
  tagline: '',
  tag: '',
  price: '',
  img: '',
  borderGradient: 'linear-gradient(90deg, #D6246E 0%, #1565C0 50%, #78BE20 100%)',
  overview: [''],
};

const GRADIENT_PRESETS = [
  'linear-gradient(90deg, #D6246E 0%, #1565C0 50%, #78BE20 100%)',
  'linear-gradient(90deg, #7B2FA0 0%, #0EA5A5 50%, #D4941A 100%)',
  'linear-gradient(90deg, #1565C0 0%, #78BE20 50%, #E86B20 100%)',
  'linear-gradient(90deg, #0EA5A5 0%, #E86B20 50%, #D6246E 100%)',
  'linear-gradient(90deg, #D6246E 0%, #7B2FA0 50%, #1565C0 100%)',
  'linear-gradient(90deg, #78BE20 0%, #0EA5A5 50%, #7B2FA0 100%)',
];

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

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="bg-white rounded-[12px] shadow-[0_1px_6px_rgba(0,0,0,0.05)] p-5 flex flex-col gap-4">
      <h2 className="text-font-primary text-[16px] font-bold" style={{ fontFamily: 'var(--font-heading)' }}>
        {title}
      </h2>
      {children}
    </section>
  );
}

/** Repeatable list of strings with add / remove / reorder. */
function ListField({
  label,
  hint,
  values,
  onChange,
  multiline = false,
  placeholder,
}: {
  label: string;
  hint?: string;
  values: string[];
  onChange: (next: string[]) => void;
  multiline?: boolean;
  placeholder?: string;
}) {
  function update(index: number, value: string) {
    const next = [...values];
    next[index] = value;
    onChange(next);
  }

  function move(index: number, delta: number) {
    const target = index + delta;
    if (target < 0 || target >= values.length) return;
    const next = [...values];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-baseline justify-between">
        <span className="text-[13px] font-semibold text-font-primary">{label}</span>
        {hint && <span className="text-[12px] text-font-muted">{hint}</span>}
      </div>

      {values.length === 0 && (
        <p className="text-[13px] text-font-muted italic">None — add one below.</p>
      )}

      {values.map((value, index) => (
        <div key={index} className="flex items-start gap-2">
          {multiline ? (
            <textarea
              rows={3}
              value={value}
              placeholder={placeholder}
              onChange={(e) => update(index, e.target.value)}
              className={`${inputClass} resize-y`}
            />
          ) : (
            <input
              type="text"
              value={value}
              placeholder={placeholder}
              onChange={(e) => update(index, e.target.value)}
              className={inputClass}
            />
          )}
          <div className="flex flex-col gap-1 shrink-0 pt-1">
            <button
              type="button"
              onClick={() => move(index, -1)}
              disabled={index === 0}
              aria-label="Move up"
              className="p-1 text-font-muted hover:text-primary-teal disabled:opacity-30"
            >
              <ArrowUp size={14} />
            </button>
            <button
              type="button"
              onClick={() => move(index, 1)}
              disabled={index === values.length - 1}
              aria-label="Move down"
              className="p-1 text-font-muted hover:text-primary-teal disabled:opacity-30"
            >
              <ArrowDown size={14} />
            </button>
            <button
              type="button"
              onClick={() => onChange(values.filter((_, i) => i !== index))}
              aria-label="Remove"
              className="p-1 text-font-muted hover:text-accent-pink"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>
      ))}

      <button
        type="button"
        onClick={() => onChange([...values, ''])}
        className="self-start flex items-center gap-1.5 text-[13px] font-semibold text-primary-teal hover:opacity-80"
      >
        <Plus size={14} />
        Add {label.toLowerCase().replace(/s$/, '')}
      </button>
    </div>
  );
}

export default function PackageForm({
  initialPackage,
  mode,
}: {
  initialPackage?: TourPackage;
  mode: 'create' | 'edit';
}) {
  const router = useRouter();
  const [form, setForm] = useState<TourPackage>(initialPackage ?? EMPTY_PACKAGE);
  const [error, setError] = useState<string | null>(null);
  /** Which button is mid-save, so only that one shows a spinner label. */
  const [savingAs, setSavingAs] = useState<'draft' | 'publish' | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const isSaving = savingAs !== null;
  const isPublished = form.published !== false;

  function set<K extends keyof TourPackage>(key: K, value: TourPackage[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleImageUpload(file: File) {
    setIsUploading(true);
    setError(null);
    try {
      const body = new FormData();
      body.append('file', file);
      body.append('slug', form.slug || 'untitled');

      const response = await fetch('/api/upload', { method: 'POST', body });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? 'Upload failed.');

      set('img', result.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed.');
    } finally {
      setIsUploading(false);
    }
  }

  async function save(published: boolean) {
    setError(null);
    setSavingAs(published ? 'publish' : 'draft');

    try {
      const response = await fetch('/api/packages', {
        method: mode === 'create' ? 'POST' : 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          published,
          // Drop blank rows the editor may have left behind.
          overview: form.overview.filter(Boolean),
          highlights: form.highlights?.filter(Boolean),
          inclusions: form.inclusions?.filter(Boolean),
          exclusions: form.exclusions?.filter(Boolean),
          travelDates: form.travelDates?.filter(Boolean),
          notes: form.notes?.filter(Boolean),
          variants: form.variants?.filter((v) => v.name || v.route),
          originalSlug: initialPackage?.slug,
        }),
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? 'Save failed.');

      router.push('/packages');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed.');
      setSavingAs(null);
    }
  }

  /** Enter-to-submit keeps whatever status the package already has. */
  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    save(isPublished);
  }

  async function handleDelete() {
    if (!initialPackage) return;
    const confirmed = window.confirm(
      `Delete "${initialPackage.name}"? This removes the page at /${initialPackage.slug} and cannot be undone.`
    );
    if (!confirmed) return;

    setIsDeleting(true);
    setError(null);
    try {
      const response = await fetch(
        `/api/packages?slug=${encodeURIComponent(initialPackage.slug)}`,
        { method: 'DELETE' }
      );
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? 'Delete failed.');

      router.push('/packages');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed.');
      setIsDeleting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="max-w-[900px] mx-auto px-4 md:px-8 pt-4 pb-8 flex flex-col gap-5"
      style={{ fontFamily: 'var(--font-body)' }}
    >
      {/*
        Sticky action bar — the form is long, so Save/Cancel stay reachable
        without scrolling back up. Bleeds past the form's horizontal padding so
        the backdrop spans the full width when pinned.
      */}
      <div className="sticky top-0 z-20 -mx-4 md:-mx-8 px-4 md:px-8 py-4 bg-bg-light/95 backdrop-blur-sm border-b border-border-light flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1
            className="flex items-center gap-3 text-font-primary text-[24px] font-bold"
            style={{ fontFamily: 'var(--font-heading)' }}
          >
            {mode === 'create' ? 'New package' : form.name || 'Edit package'}
            {mode === 'edit' && (
              <span
                className={`text-[10px] font-bold uppercase tracking-wide rounded-full px-2 py-0.5 ${
                  isPublished
                    ? 'bg-accent-green/15 text-accent-green'
                    : 'bg-font-muted/15 text-font-muted'
                }`}
                style={{ fontFamily: 'var(--font-body)' }}
              >
                {isPublished ? 'Live' : 'Draft'}
              </span>
            )}
          </h1>
          <div className="flex items-center gap-3">
            {mode === 'edit' && (
              <button
                type="button"
                onClick={handleDelete}
                disabled={isDeleting || isSaving}
                className="text-[13px] font-semibold text-accent-pink hover:opacity-80 disabled:opacity-50"
              >
                {isDeleting ? 'Deleting…' : 'Delete'}
              </button>
            )}
            <button
              type="button"
              onClick={() => router.push('/packages')}
              className="text-[14px] font-semibold text-font-secondary hover:text-font-primary"
            >
              Cancel
            </button>

            {/* Secondary action: keep it out of sight of the public site. */}
            <button
              type="button"
              onClick={() => save(false)}
              disabled={isSaving || isUploading}
              className="text-[14px] font-semibold text-font-primary bg-white border border-border-light rounded-full px-5 py-2.5 hover:border-primary-teal hover:text-primary-teal transition-colors disabled:opacity-50"
            >
              {savingAs === 'draft'
                ? 'Saving…'
                : mode === 'create' || !isPublished
                  ? 'Save as draft'
                  : 'Unpublish'}
            </button>

            <button
              type="button"
              onClick={() => save(true)}
              disabled={isSaving || isUploading}
              className="gradient-btn-primary text-white text-[14px] font-semibold rounded-full px-6 py-2.5 hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {savingAs === 'publish'
                ? 'Saving…'
                : mode === 'create' || !isPublished
                  ? 'Save and publish'
                  : 'Save'}
            </button>
          </div>
        </div>

        {/* Inside the sticky bar so a failed save is visible from anywhere in the form. */}
        {error && (
          <p className="text-[13px] text-accent-pink bg-accent-pink/10 rounded-[8px] p-3">{error}</p>
        )}
      </div>

      <Section title="Basics">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Name">
            <input
              type="text"
              required
              value={form.name}
              onChange={(e) => set('name', e.target.value)}
              className={inputClass}
            />
          </Field>
          <Field label="URL slug" hint={`Page will live at /${form.slug || '…'}`}>
            <input
              type="text"
              required
              pattern="[a-z0-9-]+"
              title="Lowercase letters, numbers and hyphens only"
              value={form.slug}
              onChange={(e) => set('slug', e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))}
              className={inputClass}
            />
          </Field>
        </div>

        <Field label="Tagline" hint="Shown on cards and used as the meta description">
          <textarea
            required
            rows={2}
            value={form.tagline}
            onChange={(e) => set('tagline', e.target.value)}
            className={`${inputClass} resize-y`}
          />
        </Field>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Field label="Badge" hint="e.g. 4D3N • Oct–Dec 2026">
            <input
              type="text"
              value={form.tag}
              onChange={(e) => set('tag', e.target.value)}
              className={inputClass}
            />
          </Field>
          <Field label="Price label" hint="e.g. From ₱19,500">
            <input
              type="text"
              value={form.price}
              onChange={(e) => set('price', e.target.value)}
              className={inputClass}
            />
          </Field>
          <Field label="Display order" hint="Lower sorts first">
            <input
              type="number"
              value={form.order ?? ''}
              onChange={(e) => set('order', e.target.value === '' ? undefined : Number(e.target.value))}
              className={inputClass}
            />
          </Field>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Price amount" hint="Numeric, for search-engine structured data">
            <input
              type="number"
              value={form.priceAmount ?? ''}
              onChange={(e) =>
                set('priceAmount', e.target.value === '' ? undefined : Number(e.target.value))
              }
              className={inputClass}
            />
          </Field>
          <Field label="Currency">
            <select
              value={form.priceCurrency ?? ''}
              onChange={(e) =>
                set('priceCurrency', (e.target.value || undefined) as TourPackage['priceCurrency'])
              }
              className={inputClass}
            >
              <option value="">— none —</option>
              <option value="USD">USD</option>
              <option value="PHP">PHP</option>
            </select>
          </Field>
        </div>
      </Section>

      <Section title="Image">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative w-full sm:w-[220px] h-[150px] rounded-[8px] overflow-hidden bg-bg-light shrink-0">
            {form.img ? (
              <Image src={resolveImageUrl(form.img)} alt="" fill sizes="220px" className="object-cover" />
            ) : (
              <span className="absolute inset-0 flex items-center justify-center text-[13px] text-font-muted">
                No image
              </span>
            )}
          </div>
          <div className="flex flex-col gap-3 flex-1">
            <label className="self-start flex items-center gap-2 text-[13px] font-semibold text-primary-teal cursor-pointer hover:opacity-80">
              {isUploading ? <Loader2 size={15} className="animate-spin" /> : <Upload size={15} />}
              {isUploading ? 'Uploading…' : 'Upload new image'}
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                disabled={isUploading}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleImageUpload(file);
                  e.target.value = '';
                }}
              />
            </label>
            <Field label="Image URL" hint="Uploads fill this in automatically">
              <input
                type="text"
                value={form.img}
                onChange={(e) => set('img', e.target.value)}
                className={inputClass}
              />
            </Field>
          </div>
        </div>

        <Field label="Accent gradient">
          <select
            value={form.borderGradient}
            onChange={(e) => set('borderGradient', e.target.value)}
            className={inputClass}
          >
            {GRADIENT_PRESETS.map((gradient, i) => (
              <option key={gradient} value={gradient}>
                Preset {i + 1}
              </option>
            ))}
          </select>
        </Field>
        <div className="h-[6px] w-full rounded-sm" style={{ background: form.borderGradient }} />
      </Section>

      <Section title="Overview">
        <ListField
          label="Paragraphs"
          hint="One block per paragraph"
          values={form.overview}
          onChange={(next) => set('overview', next)}
          multiline
        />
      </Section>

      <Section title="Highlights">
        <ListField
          label="Highlights"
          values={form.highlights ?? []}
          onChange={(next) => set('highlights', next)}
        />
      </Section>

      <Section title="Tour variants">
        <div className="flex flex-col gap-3">
          {(form.variants ?? []).map((variant, index) => (
            <div key={index} className="flex items-start gap-2">
              <input
                type="text"
                placeholder="Name (e.g. Vietnam Rose 1.0)"
                value={variant.name}
                onChange={(e) => {
                  const next = [...(form.variants ?? [])];
                  next[index] = { ...next[index], name: e.target.value };
                  set('variants', next);
                }}
                className={inputClass}
              />
              <input
                type="text"
                placeholder="Route (e.g. Hanoi • Ha Long Bay)"
                value={variant.route}
                onChange={(e) => {
                  const next = [...(form.variants ?? [])];
                  next[index] = { ...next[index], route: e.target.value };
                  set('variants', next);
                }}
                className={inputClass}
              />
              <button
                type="button"
                aria-label="Remove variant"
                onClick={() => set('variants', (form.variants ?? []).filter((_, i) => i !== index))}
                className="p-2 text-font-muted hover:text-accent-pink shrink-0"
              >
                <Trash2 size={15} />
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() => set('variants', [...(form.variants ?? []), { name: '', route: '' }])}
            className="self-start flex items-center gap-1.5 text-[13px] font-semibold text-primary-teal hover:opacity-80"
          >
            <Plus size={14} />
            Add variant
          </button>
        </div>
      </Section>

      <Section title="Inclusions & exclusions">
        <ListField
          label="Inclusions"
          values={form.inclusions ?? []}
          onChange={(next) => set('inclusions', next)}
        />
        <ListField
          label="Exclusions"
          values={form.exclusions ?? []}
          onChange={(next) => set('exclusions', next)}
        />
      </Section>

      <Section title="Travel dates & notes">
        <ListField
          label="Travel dates"
          hint="e.g. Oct 15–18, 2026"
          values={form.travelDates ?? []}
          onChange={(next) => set('travelDates', next)}
        />
        <ListField label="Notes" values={form.notes ?? []} onChange={(next) => set('notes', next)} />
      </Section>
    </form>
  );
}
