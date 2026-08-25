'use client';

import { useState } from 'react';
import {
  EmailAuthProvider,
  reauthenticateWithCredential,
  signInWithEmailAndPassword,
  updatePassword,
  type User,
} from 'firebase/auth';
import { CheckCircle2 } from 'lucide-react';
import { getFirebaseAuth, isFirebaseConfigured } from '@/lib/firebase/client';

/** Firebase's own floor is 6; ask for a bit more. */
const MIN_LENGTH = 8;

const inputClass =
  'w-full border border-border-light rounded-[8px] px-3 py-2.5 text-[14px] text-font-primary bg-white focus:outline-none focus:border-primary-teal';

/** Firebase error codes are not something to show a person as-is. */
function friendlyError(error: unknown): string {
  const code = typeof error === 'object' && error && 'code' in error ? String(error.code) : '';
  const message = error instanceof Error ? error.message : String(error);

  if (code.includes('wrong-password') || code.includes('invalid-credential')) {
    return 'That current password is incorrect.';
  }
  if (code.includes('weak-password')) {
    return 'That new password is too weak. Try a longer one.';
  }
  if (code.includes('too-many-requests')) {
    return 'Too many attempts. Wait a few minutes and try again.';
  }
  if (code.includes('requires-recent-login')) {
    return 'For security, sign out and back in, then change your password.';
  }
  if (code.includes('network-request-failed')) {
    return 'Network problem — check your connection and try again.';
  }
  return message;
}

export default function ChangePasswordForm({ email }: { email: string }) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  function reset() {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setDone(false);

    if (newPassword.length < MIN_LENGTH) {
      setError(`Your new password must be at least ${MIN_LENGTH} characters.`);
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('The new passwords do not match.');
      return;
    }
    if (newPassword === currentPassword) {
      setError('Your new password must be different from the current one.');
      return;
    }

    setIsSaving(true);
    try {
      const auth = getFirebaseAuth();
      if (!auth) throw new Error('Firebase is not configured.');

      // Firebase requires a recent login before a password change. Reauthenticate
      // when the client SDK still holds the user; otherwise sign in fresh, which
      // proves knowledge of the current password just the same. Either way the
      // password goes straight to Firebase and never touches our server.
      let user: User;
      if (auth.currentUser) {
        const credential = EmailAuthProvider.credential(email, currentPassword);
        const result = await reauthenticateWithCredential(auth.currentUser, credential);
        user = result.user;
      } else {
        const result = await signInWithEmailAndPassword(auth, email, currentPassword);
        user = result.user;
      }

      await updatePassword(user, newPassword);

      // Changing the password revokes existing refresh tokens, and the session
      // cookie is verified with checkRevoked — so mint a fresh one, otherwise
      // this tab is signed out on the next navigation.
      const idToken = await user.getIdToken(true);
      const response = await fetch('/api/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken }),
      });
      if (!response.ok) {
        throw new Error('Password changed, but this session could not be renewed. Please sign in again.');
      }

      reset();
      setDone(true);
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white rounded-[12px] shadow-[0_1px_6px_rgba(0,0,0,0.05)] p-5 flex flex-col gap-4"
      style={{ fontFamily: 'var(--font-body)' }}
    >
      <div className="flex flex-col gap-1">
        <h2
          className="text-font-primary text-[16px] font-bold"
          style={{ fontFamily: 'var(--font-heading)' }}
        >
          Change password
        </h2>
        <p className="text-[13px] text-font-muted leading-relaxed">
          You&apos;ll stay signed in on this device. Any other devices will need the new password.
        </p>
      </div>

      {!isFirebaseConfigured && (
        <p className="text-[13px] text-accent-orange bg-accent-orange/10 rounded-[8px] p-3">
          Firebase isn&apos;t configured, so the password can&apos;t be changed here.
        </p>
      )}

      {/* Helps password managers associate the change with the right account. */}
      <input type="hidden" autoComplete="username" value={email} readOnly />

      <label className="flex flex-col gap-1.5">
        <span className="text-[13px] font-semibold text-font-primary">Current password</span>
        <input
          type="password"
          required
          autoComplete="current-password"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          className={inputClass}
        />
      </label>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <label className="flex flex-col gap-1.5">
          <span className="text-[13px] font-semibold text-font-primary">New password</span>
          <input
            type="password"
            required
            minLength={MIN_LENGTH}
            autoComplete="new-password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className={inputClass}
          />
          <span className="text-[12px] text-font-muted">At least {MIN_LENGTH} characters.</span>
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-[13px] font-semibold text-font-primary">Confirm new password</span>
          <input
            type="password"
            required
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className={inputClass}
          />
        </label>
      </div>

      {error && (
        <p className="text-[13px] text-accent-pink bg-accent-pink/10 rounded-[8px] p-3">{error}</p>
      )}

      {done && (
        <p className="flex items-center gap-2 text-[13px] text-accent-green bg-accent-green/10 rounded-[8px] p-3">
          <CheckCircle2 size={16} className="shrink-0" />
          Password updated.
        </p>
      )}

      <button
        type="submit"
        disabled={isSaving || !isFirebaseConfigured}
        className="self-start gradient-btn-primary text-white text-[14px] font-semibold rounded-full px-6 py-2.5 hover:opacity-90 transition-opacity disabled:opacity-50"
      >
        {isSaving ? 'Updating…' : 'Update password'}
      </button>
    </form>
  );
}
