'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Loader2 } from 'lucide-react';

export default function PublishToggle({
  slug,
  published,
}: {
  slug: string;
  published: boolean;
}) {
  const router = useRouter();
  const [isBusy, setIsBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function toggle() {
    setIsBusy(true);
    setError(null);
    try {
      const response = await fetch('/api/packages', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug, published: !published }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? 'Could not update.');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update.');
    } finally {
      setIsBusy(false);
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={isBusy}
      title={error ?? (published ? 'Hide from the public site' : 'Publish to the public site')}
      className={`flex items-center gap-1.5 text-[13px] font-semibold rounded-full px-3 py-2 border transition-colors disabled:opacity-50 ${
        error
          ? 'border-accent-pink text-accent-pink'
          : 'border-border-light text-font-secondary hover:border-primary-teal hover:text-primary-teal'
      }`}
      style={{ fontFamily: 'var(--font-body)' }}
    >
      {isBusy ? (
        <Loader2 size={14} className="animate-spin" />
      ) : published ? (
        <EyeOff size={14} />
      ) : (
        <Eye size={14} />
      )}
      <span className="hidden sm:inline">{published ? 'Unpublish' : 'Publish'}</span>
    </button>
  );
}
