'use client';

import { useState } from 'react';
import { CheckCircle2, AlertTriangle, Loader2, PlugZap } from 'lucide-react';

interface Result {
  ok: boolean;
  message: string;
  targetUrl?: string;
}

/**
 * Verifies the refresh link to the public site on demand, so a broken
 * REVALIDATE_SECRET can be spotted here instead of being discovered when a save
 * silently fails to update the site.
 */
export default function ConnectionCheck() {
  const [result, setResult] = useState<Result | null>(null);
  const [isChecking, setIsChecking] = useState(false);

  async function check() {
    setIsChecking(true);
    setResult(null);
    try {
      const response = await fetch('/api/revalidate-check', { cache: 'no-store' });
      const data = await response.json();
      setResult({ ok: Boolean(data.ok), message: data.message ?? 'Unexpected response.', targetUrl: data.targetUrl });
    } catch (error) {
      setResult({
        ok: false,
        message: error instanceof Error ? error.message : 'The check could not be run.',
      });
    } finally {
      setIsChecking(false);
    }
  }

  return (
    <div className="flex flex-col gap-2" style={{ fontFamily: 'var(--font-body)' }}>
      <button
        type="button"
        onClick={check}
        disabled={isChecking}
        className="self-start flex items-center gap-2 text-[13px] font-semibold text-font-primary bg-white border border-border-light rounded-full px-4 py-2 hover:border-primary-teal hover:text-primary-teal transition-colors disabled:opacity-50"
      >
        {isChecking ? <Loader2 size={14} className="animate-spin" /> : <PlugZap size={14} />}
        {isChecking ? 'Checking…' : 'Test connection to the site'}
      </button>

      {result && (
        <p
          className={`flex items-start gap-2 text-[13px] rounded-[8px] p-3 leading-relaxed ${
            result.ok
              ? 'text-accent-green bg-accent-green/10'
              : 'text-accent-pink bg-accent-pink/10'
          }`}
        >
          {result.ok ? (
            <CheckCircle2 size={16} className="shrink-0 mt-0.5" />
          ) : (
            <AlertTriangle size={16} className="shrink-0 mt-0.5" />
          )}
          <span>{result.message}</span>
        </p>
      )}
    </div>
  );
}
