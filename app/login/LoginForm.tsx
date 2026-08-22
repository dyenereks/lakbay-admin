'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { getFirebaseAuth, isFirebaseConfigured } from '@/lib/firebase/client';

export default function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const auth = getFirebaseAuth();
      if (!auth) throw new Error('Firebase is not configured.');

      const credential = await signInWithEmailAndPassword(auth, email, password);
      const idToken = await credential.user.getIdToken();

      // Exchange the ID token for an httpOnly session cookie the server can trust.
      const response = await fetch('/api/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken }),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error ?? 'Could not start a session.');
      }

      router.replace('/');
      router.refresh();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Sign-in failed.';
      // Firebase error codes are not user-friendly; translate the common ones.
      if (message.includes('auth/invalid-credential') || message.includes('auth/wrong-password')) {
        setError('Incorrect email or password.');
      } else if (message.includes('auth/too-many-requests')) {
        setError('Too many attempts. Try again in a few minutes.');
      } else {
        setError(message);
      }
      setIsSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-[400px] bg-white rounded-[16px] shadow-[0_4px_24px_rgba(0,0,0,0.08)] p-8 flex flex-col gap-6">
        <div className="flex flex-col items-center gap-3">
          <Image src="/images/lakbay-logo.png" alt="Lakbay Travel and Tours" width={150} height={47} />
          <div className="gradient-rainbow h-[3px] w-[100px] rounded-sm" />
          <h1
            className="text-font-primary text-[20px] font-bold"
            style={{ fontFamily: 'var(--font-heading)' }}
          >
            Admin Sign In
          </h1>
        </div>

        {!isFirebaseConfigured && (
          <p
            className="text-[13px] text-accent-orange bg-accent-orange/10 rounded-[8px] p-3 leading-relaxed"
            style={{ fontFamily: 'var(--font-body)' }}
          >
            Firebase isn&apos;t configured yet. Add the NEXT_PUBLIC_FIREBASE_* environment variables
            to sign in.
          </p>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4" style={{ fontFamily: 'var(--font-body)' }}>
          <label className="flex flex-col gap-1.5">
            <span className="text-[13px] font-semibold text-font-primary">Email</span>
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="border border-border-light rounded-[8px] px-3 py-2.5 text-[14px] text-font-primary focus:outline-none focus:border-primary-teal"
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-[13px] font-semibold text-font-primary">Password</span>
            <input
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="border border-border-light rounded-[8px] px-3 py-2.5 text-[14px] text-font-primary focus:outline-none focus:border-primary-teal"
            />
          </label>

          {error && (
            <p className="text-[13px] text-accent-pink bg-accent-pink/10 rounded-[8px] p-3">{error}</p>
          )}

          <button
            type="submit"
            disabled={isSubmitting || !isFirebaseConfigured}
            className="gradient-btn-primary text-white text-[15px] font-semibold rounded-full px-6 py-3 hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Signing in…' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}
