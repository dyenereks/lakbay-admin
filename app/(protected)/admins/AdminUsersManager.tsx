'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { sendPasswordResetEmail } from 'firebase/auth';
import { Plus, Trash2, Lock, Mail, Loader2, CheckCircle2 } from 'lucide-react';
import { getFirebaseAuth } from '@/lib/firebase/client';
import type { AdminUser } from '@/lib/admins-data';

const inputClass =
  'w-full border border-border-light rounded-[8px] px-3 py-2.5 text-[14px] text-font-primary bg-white focus:outline-none focus:border-primary-teal';

export default function AdminUsersManager({
  admins,
  currentEmail,
}: {
  admins: AdminUser[];
  currentEmail: string;
}) {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [isInviting, setIsInviting] = useState(false);
  const [busyEmail, setBusyEmail] = useState<string | null>(null);

  /**
   * Firebase's own password-reset email doubles as an invitation: it's sent
   * from the browser, so no mail setup is needed on our side, and the invitee
   * chooses their own password.
   */
  async function sendSetupEmail(target: string): Promise<boolean> {
    const auth = getFirebaseAuth();
    if (!auth) return false;
    try {
      await sendPasswordResetEmail(auth, target);
      return true;
    } catch (err) {
      console.error('[admins] setup email failed', err);
      return false;
    }
  }

  async function handleInvite(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setNotice(null);
    setIsInviting(true);

    try {
      const response = await fetch('/api/admins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? 'Could not add that admin.');

      const sent = await sendSetupEmail(result.email);
      setNotice(
        sent
          ? `${result.email} can now sign in. We've emailed them a link to set their password.`
          : `${result.email} was added, but the password-setup email could not be sent. Use "Send setup email" to try again.`
      );
      setEmail('');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not add that admin.');
    } finally {
      setIsInviting(false);
    }
  }

  async function handleRemove(target: string) {
    if (!window.confirm(`Remove admin access for ${target}? They will be signed out immediately.`)) {
      return;
    }
    setError(null);
    setNotice(null);
    setBusyEmail(target);
    try {
      const response = await fetch(`/api/admins?email=${encodeURIComponent(target)}`, {
        method: 'DELETE',
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? 'Could not remove that admin.');
      setNotice(`${target} no longer has access.`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not remove that admin.');
    } finally {
      setBusyEmail(null);
    }
  }

  async function handleResend(target: string) {
    setError(null);
    setNotice(null);
    setBusyEmail(target);
    const sent = await sendSetupEmail(target);
    setNotice(
      sent
        ? `Password-setup email sent to ${target}.`
        : `Could not send the email to ${target}. Check the Firebase console.`
    );
    setBusyEmail(null);
  }

  return (
    <div className="flex flex-col gap-5" style={{ fontFamily: 'var(--font-body)' }}>
      {error && (
        <p className="text-[13px] text-accent-pink bg-accent-pink/10 rounded-[8px] p-3">{error}</p>
      )}
      {notice && (
        <p className="flex items-start gap-2 text-[13px] text-accent-green bg-accent-green/10 rounded-[8px] p-3">
          <CheckCircle2 size={16} className="shrink-0 mt-0.5" />
          <span>{notice}</span>
        </p>
      )}

      <section className="bg-white rounded-[12px] shadow-[0_1px_6px_rgba(0,0,0,0.05)] p-5 flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <h2
            className="text-font-primary text-[16px] font-bold"
            style={{ fontFamily: 'var(--font-heading)' }}
          >
            Invite an admin
          </h2>
          <p className="text-[13px] text-font-muted leading-relaxed">
            They&apos;ll get an email to set their own password. You never need to choose one for
            them.
          </p>
        </div>

        <form onSubmit={handleInvite} className="flex flex-col sm:flex-row gap-3 sm:items-end">
          <label className="flex flex-col gap-1.5 flex-1">
            <span className="text-[13px] font-semibold text-font-primary">Email address</span>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              className={inputClass}
            />
          </label>
          <button
            type="submit"
            disabled={isInviting}
            className="gradient-btn-primary text-white text-[14px] font-semibold rounded-full px-6 py-2.5 hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2 shrink-0"
          >
            {isInviting ? <Loader2 size={15} className="animate-spin" /> : <Plus size={15} />}
            {isInviting ? 'Adding…' : 'Add admin'}
          </button>
        </form>
      </section>

      <section className="bg-white rounded-[12px] shadow-[0_1px_6px_rgba(0,0,0,0.05)] p-5 flex flex-col gap-4">
        <h2
          className="text-font-primary text-[16px] font-bold"
          style={{ fontFamily: 'var(--font-heading)' }}
        >
          Admins ({admins.length})
        </h2>

        <ul className="flex flex-col divide-y divide-border-light">
          {admins.map((admin) => {
            const isSelf = admin.email === currentEmail.toLowerCase();
            const isBusy = busyEmail === admin.email;
            return (
              <li key={admin.email} className="flex flex-wrap items-center gap-3 py-3">
                <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                  <span className="flex items-center gap-2 text-[14px] text-font-primary font-semibold">
                    <span className="truncate">{admin.email}</span>
                    {isSelf && (
                      <span className="shrink-0 text-[10px] font-bold uppercase tracking-wide rounded-full px-2 py-0.5 bg-primary-teal/15 text-primary-teal">
                        You
                      </span>
                    )}
                    {admin.fromEnvironment && (
                      <span className="shrink-0 flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide rounded-full px-2 py-0.5 bg-font-muted/15 text-font-muted">
                        <Lock size={10} />
                        Env
                      </span>
                    )}
                  </span>
                  <span className="text-[12px] text-font-muted">
                    {admin.fromEnvironment
                      ? 'Set via ADMIN_EMAILS — manage in your hosting environment'
                      : admin.addedBy
                        ? `Added by ${admin.addedBy}`
                        : 'Added from this admin'}
                  </span>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleResend(admin.email)}
                    disabled={isBusy}
                    className="flex items-center gap-1.5 text-[13px] font-semibold text-font-secondary border border-border-light rounded-full px-3 py-1.5 hover:border-primary-teal hover:text-primary-teal transition-colors disabled:opacity-50"
                  >
                    <Mail size={13} />
                    <span className="hidden sm:inline">Send setup email</span>
                  </button>

                  {!isSelf && !admin.fromEnvironment && (
                    <button
                      type="button"
                      onClick={() => handleRemove(admin.email)}
                      disabled={isBusy}
                      aria-label={`Remove ${admin.email}`}
                      className="p-2 rounded-[8px] text-font-muted hover:text-accent-pink hover:bg-bg-light transition-colors disabled:opacity-50"
                    >
                      {isBusy ? (
                        <Loader2 size={15} className="animate-spin" />
                      ) : (
                        <Trash2 size={15} />
                      )}
                    </button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
