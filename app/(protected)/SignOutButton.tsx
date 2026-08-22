'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { signOut } from 'firebase/auth';
import { getFirebaseAuth } from '@/lib/firebase/client';

export default function SignOutButton() {
  const router = useRouter();
  const [isBusy, setIsBusy] = useState(false);

  async function handleSignOut() {
    setIsBusy(true);
    try {
      // Clear the server session cookie first — that's the one that gates access.
      await fetch('/api/session', { method: 'DELETE' });
      const auth = getFirebaseAuth();
      if (auth) await signOut(auth);
    } finally {
      router.replace('/login');
      router.refresh();
    }
  }

  return (
    <button
      type="button"
      onClick={handleSignOut}
      disabled={isBusy}
      className="text-[13px] font-semibold text-font-secondary hover:text-accent-pink transition-colors disabled:opacity-50"
      style={{ fontFamily: 'var(--font-body)' }}
    >
      {isBusy ? 'Signing out…' : 'Sign out'}
    </button>
  );
}
