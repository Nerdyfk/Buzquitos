'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { LockKeyhole, LoaderCircle } from 'lucide-react';

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError('');

    try {
      const res = await fetch('/api/admin/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to sign in.');
      } else {
        window.location.href = '/admin';
      }
    } catch {
      setError('An unexpected network error occurred.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="admin-bg grid min-h-screen place-items-center px-5">
      <form onSubmit={submit} className="admin-card w-full max-w-md p-7">
        <div className="mb-6 grid h-12 w-12 place-items-center rounded-xl bg-[#c2ed55] text-black">
          <LockKeyhole />
        </div>
        <div className="text-xs font-mono tracking-[.2em] text-[#c2ed55]">PRIVATE ACCESS / 01</div>
        <h1 className="mt-2 text-3xl font-bold">Admin sign in</h1>
        <p className="mt-2 text-sm text-white/50">This area is private and is not linked from the public website.</p>
        <div className="mt-7 space-y-4">
          <div>
            <label className="mb-2 block text-xs font-semibold">EMAIL</label>
            <input
              className="admin-field"
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
            />
          </div>
          <div>
            <label className="mb-2 block text-xs font-semibold">PASSWORD</label>
            <input
              className="admin-field"
              type="password"
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
            />
          </div>
          {error && <p className="text-sm text-red-400">{error}</p>}
          <button disabled={busy} className="w-full rounded-lg bg-[#c2ed55] p-3 font-bold text-[#171820] disabled:opacity-60">
            {busy ? <LoaderCircle className="mx-auto animate-spin" /> : 'SIGN IN'}
          </button>
        </div>
        <a href="/" className="mt-6 inline-block text-xs text-white/40 hover:text-white">
          ← Back to public website
        </a>
      </form>
    </main>
  );
}
