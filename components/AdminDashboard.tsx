'use client';

import { useEffect, useMemo, useState } from 'react';
import { Download, LogOut, Search, RefreshCw, Trash2, Check, X, Settings, Users, ExternalLink } from 'lucide-react';

type Submission = {
  id: string;
  wallet_address: string;
  x_username: string;
  reply_link: string | null;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
};

type Setting = {
  key: string;
  value: string;
};

export default function AdminDashboard({ email }: { email: string }) {
  const [rows, setRows] = useState<Submission[]>([]);
  const [settings, setSettings] = useState<Setting[]>([]);
  const [tab, setTab] = useState<'submissions' | 'settings'>('submissions');
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  async function load() {
    setLoading(true);
    try {
      const [a, b] = await Promise.all([
        fetch('/api/admin/submissions'),
        fetch('/api/admin/settings')
      ]);
      if (a.ok) {
        const d = await a.json();
        setRows(d.submissions || []);
      }
      if (b.ok) {
        const d = await b.json();
        setSettings(d.settings || []);
      }
    } catch {
      setMessage('Failed to load dashboard data.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function update(id: string, status: string) {
    const r = await fetch('/api/admin/submissions', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status })
    });
    if (r.ok) {
      setRows(p => p.map(x => (x.id === id ? { ...x, status: status as Submission['status'] } : x)));
      setMessage('Submission updated.');
    } else {
      setMessage('Update failed.');
    }
  }

  async function remove(id: string) {
    if (!confirm('Delete this submission permanently?')) return;
    const r = await fetch('/api/admin/submissions?id=' + encodeURIComponent(id), { method: 'DELETE' });
    if (r.ok) {
      setRows(p => p.filter(x => x.id !== id));
      setMessage('Submission deleted.');
    } else {
      setMessage('Delete failed.');
    }
  }

  async function saveSettings() {
    const r = await fetch('/api/admin/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ settings })
    });
    setMessage(r.ok ? 'Settings saved successfully.' : 'Could not save settings.');
  }

  async function logout() {
    try {
      await fetch('/api/admin/auth/logout', { method: 'POST' });
    } finally {
      location.href = '/admin/login';
    }
  }

  const filtered = useMemo(
    () =>
      rows.filter(
        r =>
          (filter === 'all' || r.status === filter) &&
          [r.wallet_address, r.x_username, r.reply_link || ''].join(' ').toLowerCase().includes(search.toLowerCase())
      ),
    [rows, filter, search]
  );

  function exportCsv() {
    const fields = ['wallet_address', 'x_username', 'reply_link', 'status', 'created_at'];
    const csv = [
      fields.join(','),
      ...filtered.map(r =>
        fields.map(k => '"' + String((r as any)[k] ?? '').replaceAll('"', '""') + '"').join(',')
      )
    ].join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    a.download = 'buzquitos-whitelist-submissions.csv';
    a.click();
    URL.revokeObjectURL(a.href);
  }

  const counts = {
    total: rows.length,
    pending: rows.filter(x => x.status === 'pending').length,
    approved: rows.filter(x => x.status === 'approved').length,
    rejected: rows.filter(x => x.status === 'rejected').length
  };

  return (
    <main className="admin-bg min-h-screen">
      <header className="border-b border-white/10">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5">
          <div>
            <div className="text-xs font-mono tracking-[.2em] text-[#c2ed55]">BUZQUITOS WHITELIST / CONTROL ROOM</div>
            <h1 className="mt-1 text-xl font-bold">Admin dashboard</h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="hidden text-xs text-white/50 sm:block">{email}</span>
            <button onClick={logout} className="flex items-center gap-2 rounded-lg border border-white/15 px-3 py-2 text-xs">
              <LogOut size={14} /> Sign out
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-5 py-8">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ['TOTAL ENTRIES', counts.total],
            ['PENDING', counts.pending],
            ['APPROVED', counts.approved],
            ['REJECTED', counts.rejected]
          ].map(([l, v]) => (
            <div key={String(l)} className="admin-card p-5">
              <div className="text-[10px] font-mono tracking-widest text-white/45">{l}</div>
              <div className="mt-2 text-3xl font-bold">{v}</div>
            </div>
          ))}
        </div>

        <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
          <div className="flex gap-2">
            <button
              onClick={() => setTab('submissions')}
              className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm ${
                tab === 'submissions' ? 'bg-[#c2ed55] font-bold text-black' : 'bg-white/5 text-white/65'
              }`}
            >
              <Users size={15} /> Submissions
            </button>
            <button
              onClick={() => setTab('settings')}
              className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm ${
                tab === 'settings' ? 'bg-[#c2ed55] font-bold text-black' : 'bg-white/5 text-white/65'
              }`}
            >
              <Settings size={15} /> Collection settings
            </button>
          </div>
          <button onClick={load} className="flex items-center gap-2 rounded-lg border border-white/15 px-3 py-2 text-xs">
            <RefreshCw size={14} /> Refresh
          </button>
        </div>

        {message && (
          <div className="mt-4 rounded-lg border border-[#c2ed55]/30 bg-[#c2ed55]/10 p-3 text-sm text-[#c2ed55]">
            {message}
          </div>
        )}

        {tab === 'submissions' ? (
          <section className="admin-card mt-5 overflow-hidden">
            <div className="flex flex-col justify-between gap-3 border-b border-white/10 p-4 sm:flex-row sm:items-center">
              <div>
                <h2 className="font-bold">Whitelist submissions</h2>
                <p className="mt-1 text-xs text-white/45">
                  Showing {filtered.length} of {rows.length} records · latest 1,000
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 text-white/35" size={15} />
                  <input
                    className="admin-field !w-56 !py-2 !pl-9 text-xs"
                    placeholder="Search wallet / X / reply"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                  />
                </div>
                <select
                  className="admin-field !w-auto !py-2 text-xs"
                  value={filter}
                  onChange={e => setFilter(e.target.value)}
                >
                  <option value="all">All statuses</option>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </select>
                <button
                  onClick={exportCsv}
                  className="flex items-center gap-2 rounded-lg bg-[#c2ed55] px-3 py-2 text-xs font-bold text-black"
                >
                  <Download size={14} /> CSV
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              {loading ? (
                <div className="p-10 text-center text-sm text-white/50">Loading submissions…</div>
              ) : (
                <table className="w-full min-w-[850px] text-left text-xs">
                  <thead className="bg-white/5 text-[10px] uppercase tracking-wider text-white/45">
                    <tr>
                      {['Wallet', 'X username', 'Reply Link', 'Submitted', 'Status', 'Actions'].map(x => (
                        <th key={x} className="px-4 py-3">
                          {x}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map(r => (
                      <tr key={r.id} className="border-t border-white/5">
                        <td className="px-4 py-4 font-mono">
                          {r.wallet_address.slice(0, 8)}…{r.wallet_address.slice(-6)}
                        </td>
                        <td className="px-4 py-4">@{r.x_username}</td>
                        <td className="px-4 py-4 max-w-[240px] truncate">
                          {r.reply_link ? (
                            <a
                              href={r.reply_link}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 text-[#c2ed55] hover:underline"
                            >
                              View Reply <ExternalLink size={12} />
                            </a>
                          ) : (
                            <span className="text-white/40">—</span>
                          )}
                        </td>
                        <td className="px-4 py-4 text-white/55">
                          {new Date(r.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-4">
                          <span
                            className={`rounded-full px-2 py-1 text-[10px] ${
                              r.status === 'approved'
                                ? 'bg-green-400/15 text-green-300'
                                : r.status === 'rejected'
                                ? 'bg-red-400/15 text-red-300'
                                : 'bg-yellow-300/15 text-yellow-200'
                            }`}
                          >
                            {r.status}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex gap-1">
                            <button
                              title="Approve"
                              onClick={() => update(r.id, 'approved')}
                              className="rounded-md bg-green-400/10 p-2 text-green-300"
                            >
                              <Check size={14} />
                            </button>
                            <button
                              title="Reject"
                              onClick={() => update(r.id, 'rejected')}
                              className="rounded-md bg-red-400/10 p-2 text-red-300"
                            >
                              <X size={14} />
                            </button>
                            <button
                              title="Delete"
                              onClick={() => remove(r.id)}
                              className="rounded-md bg-white/5 p-2 text-white/50"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
              {!loading && filtered.length === 0 && (
                <div className="p-10 text-center text-sm text-white/45">No submissions found.</div>
              )}
            </div>
          </section>
        ) : (
          <section className="admin-card mt-5 max-w-3xl p-5">
            <div className="mb-5">
              <h2 className="font-bold">Collection settings</h2>
              <p className="mt-1 text-xs text-white/45">Stored in MongoDB for API / frontend integration.</p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {[
                'collection_name',
                'tagline',
                'network',
                'supply',
                'mint_price',
                'mint_date',
                'whitelist_capacity',
                'whitelist_open'
              ].map(key => {
                const current = settings.find(s => s.key === key)?.value || '';
                return (
                  <label key={key} className="text-xs font-semibold capitalize text-white/65">
                    {key.replaceAll('_', ' ')}
                    {key === 'whitelist_open' ? (
                      <select
                        className="admin-field mt-2"
                        value={current || 'true'}
                        onChange={e =>
                          setSettings(p => [...p.filter(x => x.key !== key), { key, value: e.target.value }])
                        }
                      >
                        <option value="true">Open</option>
                        <option value="false">Closed</option>
                      </select>
                    ) : (
                      <input
                        className="admin-field mt-2"
                        value={current}
                        onChange={e =>
                          setSettings(p => [...p.filter(x => x.key !== key), { key, value: e.target.value }])
                        }
                      />
                    )}
                  </label>
                );
              })}
            </div>
            <button
              onClick={saveSettings}
              className="mt-6 rounded-lg bg-[#c2ed55] px-5 py-3 text-sm font-bold text-black"
            >
              Save settings
            </button>
          </section>
        )}
      </div>
    </main>
  );
}
