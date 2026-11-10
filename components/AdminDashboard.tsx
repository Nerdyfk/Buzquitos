'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Download,
  LogOut,
  Search,
  RefreshCw,
  Trash2,
  Check,
  X,
  Settings,
  Users,
  ExternalLink,
  ListTodo,
  Plus,
  ChevronUp,
  ChevronDown,
  RotateCcw,
  Save,
  Link as LinkIcon
} from 'lucide-react';
import { WhitelistTask, DEFAULT_WHITELIST_TASKS } from '@/types/whitelist-tasks';

type Submission = {
  id: string;
  wallet_address: string;
  x_username: string | null;
  reply_link: string | null;
  responses?: Record<string, string>;
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
  const [tasks, setTasks] = useState<WhitelistTask[]>(DEFAULT_WHITELIST_TASKS);
  const [tab, setTab] = useState<'submissions' | 'tasks' | 'settings'>('submissions');
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [savingTasks, setSavingTasks] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);
  const [message, setMessage] = useState('');

  async function load() {
    setLoading(true);
    try {
      const [a, b, c] = await Promise.all([
        fetch('/api/admin/submissions'),
        fetch('/api/admin/settings'),
        fetch('/api/admin/tasks')
      ]);
      const dataA = await a.json().catch(() => ({}));
      const dataB = await b.json().catch(() => ({}));
      const dataC = await c.json().catch(() => ({}));

      if (a.ok) {
        setRows(dataA.submissions || []);
      } else if (dataA.error) {
        setMessage(dataA.error);
      }

      if (b.ok) {
        setSettings(dataB.settings || []);
      } else if (dataB.error && !dataA.error) {
        setMessage(dataB.error);
      }

      if (c.ok && Array.isArray(dataC.tasks) && dataC.tasks.length > 0) {
        setTasks(dataC.tasks);
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
    setSavingSettings(true);
    try {
      const r = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings })
      });
      setMessage(r.ok ? 'Settings saved successfully.' : 'Could not save settings.');
    } finally {
      setSavingSettings(false);
    }
  }

  async function saveTasks() {
    setSavingTasks(true);
    try {
      const r = await fetch('/api/admin/tasks', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tasks })
      });
      if (r.ok) {
        setMessage('Whitelist tasks saved successfully! The live website is updated.');
      } else {
        setMessage('Could not save whitelist tasks.');
      }
    } catch {
      setMessage('Failed to save tasks.');
    } finally {
      setSavingTasks(false);
    }
  }

  function addTask() {
    const newTask: WhitelistTask = {
      id: `task-${Date.now()}`,
      headline: `New Whitelist Task ${tasks.length + 1}`,
      description: 'Follow, like, or complete the required social step.',
      links: [{ label: 'Open Link', url: 'https://x.com' }],
      field_key: 'custom',
      field_label: 'SUBMISSION PROOF / ANSWER',
      field_placeholder: 'Enter response...',
      required: true
    };
    setTasks(p => [...p, newTask]);
    setMessage('Task added. Don\'t forget to click "Save Tasks Changes".');
  }

  function removeTask(index: number) {
    if (tasks.length <= 1) {
      if (!confirm('This is the only task. Are you sure you want to remove it?')) return;
    } else if (!confirm(`Delete "${tasks[index].headline}"?`)) {
      return;
    }
    setTasks(p => p.filter((_, i) => i !== index));
    setMessage('Task removed. Click "Save Tasks Changes" to apply.');
  }

  function moveTask(index: number, dir: 'up' | 'down') {
    const target = dir === 'up' ? index - 1 : index + 1;
    if (target < 0 || target >= tasks.length) return;
    setTasks(p => {
      const copy = [...p];
      const temp = copy[index];
      copy[index] = copy[target];
      copy[target] = temp;
      return copy;
    });
  }

  function updateTask(index: number, key: keyof WhitelistTask, value: any) {
    setTasks(p =>
      p.map((t, i) => {
        if (i !== index) return t;
        const updated = { ...t, [key]: value };
        // Auto-configure reasonable defaults when switching field_key
        if (key === 'field_key') {
          if (value === 'x_username') {
            updated.field_label = 'YOUR X / TWITTER USERNAME';
            updated.field_placeholder = '@yourhandle';
          } else if (value === 'reply_link') {
            updated.field_label = 'SUBMIT YOUR REPLY LINK';
            updated.field_placeholder = 'https://x.com/...';
          } else if (value === 'custom') {
            updated.field_label = 'SUBMISSION PROOF / ANSWER';
            updated.field_placeholder = 'Enter response...';
          }
        }
        return updated;
      })
    );
  }

  function addLink(taskIndex: number) {
    setTasks(p =>
      p.map((t, i) =>
        i === taskIndex
          ? {
              ...t,
              links: [...t.links, { label: 'Action Link', url: 'https://x.com' }]
            }
          : t
      )
    );
  }

  function updateLink(taskIndex: number, linkIndex: number, key: 'label' | 'url', value: string) {
    setTasks(p =>
      p.map((t, i) =>
        i === taskIndex
          ? {
              ...t,
              links: t.links.map((l, j) => (j === linkIndex ? { ...l, [key]: value } : l))
            }
          : t
      )
    );
  }

  function removeLink(taskIndex: number, linkIndex: number) {
    setTasks(p =>
      p.map((t, i) =>
        i === taskIndex
          ? {
              ...t,
              links: t.links.filter((_, j) => j !== linkIndex)
            }
          : t
      )
    );
  }

  function resetDefaultTasks() {
    if (confirm('Reset all tasks back to original default tasks (@Buzquitos & @Mical_xz)?')) {
      setTasks(DEFAULT_WHITELIST_TASKS);
      setMessage('Tasks reset to default. Click "Save Tasks Changes" to apply.');
    }
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
          [r.wallet_address, r.x_username || '', r.reply_link || ''].join(' ').toLowerCase().includes(search.toLowerCase())
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
            <button onClick={logout} className="flex items-center gap-2 rounded-lg border border-white/15 px-3 py-2 text-xs hover:bg-white/5 cursor-pointer">
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

        {/* Tab Controls */}
        <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setTab('submissions')}
              className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm cursor-pointer transition-colors ${
                tab === 'submissions' ? 'bg-[#c2ed55] font-bold text-black' : 'bg-white/5 text-white/65 hover:bg-white/10'
              }`}
            >
              <Users size={15} /> Submissions ({rows.length})
            </button>
            <button
              onClick={() => setTab('tasks')}
              className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm cursor-pointer transition-colors ${
                tab === 'tasks' ? 'bg-[#c2ed55] font-bold text-black' : 'bg-white/5 text-white/65 hover:bg-white/10'
              }`}
            >
              <ListTodo size={15} /> Whitelist tasks ({tasks.length})
            </button>
            <button
              onClick={() => setTab('settings')}
              className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm cursor-pointer transition-colors ${
                tab === 'settings' ? 'bg-[#c2ed55] font-bold text-black' : 'bg-white/5 text-white/65 hover:bg-white/10'
              }`}
            >
              <Settings size={15} /> Collection settings
            </button>
          </div>
          <button onClick={load} className="flex items-center gap-2 rounded-lg border border-white/15 px-3 py-2 text-xs hover:bg-white/5 cursor-pointer">
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
        </div>

        {message && (
          <div className="mt-4 flex items-center justify-between rounded-lg border border-[#c2ed55]/30 bg-[#c2ed55]/10 p-3 text-sm text-[#c2ed55]">
            <span>{message}</span>
            <button onClick={() => setMessage('')} className="text-xs text-white/50 hover:text-white">✕</button>
          </div>
        )}

        {/* TAB 1: SUBMISSIONS */}
        {tab === 'submissions' && (
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
                  className="flex items-center gap-2 rounded-lg bg-[#c2ed55] px-3 py-2 text-xs font-bold text-black cursor-pointer hover:bg-[#b0dc44]"
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
                      <tr key={r.id} className="border-t border-white/5 hover:bg-white/[0.02]">
                        <td className="px-4 py-4 font-mono font-medium">
                          {r.wallet_address.slice(0, 8)}…{r.wallet_address.slice(-6)}
                        </td>
                        <td className="px-4 py-4">
                          {r.x_username ? (
                            <a
                              href={`https://x.com/${r.x_username}`}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[#c2ed55] hover:underline"
                            >
                              @{r.x_username}
                            </a>
                          ) : (
                            <span className="text-white/40">—</span>
                          )}
                        </td>
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
                            className={`rounded-full px-2 py-1 text-[10px] font-bold ${
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
                              className="rounded-md bg-green-400/10 p-2 text-green-300 hover:bg-green-400/20 cursor-pointer"
                            >
                              <Check size={14} />
                            </button>
                            <button
                              title="Reject"
                              onClick={() => update(r.id, 'rejected')}
                              className="rounded-md bg-red-400/10 p-2 text-red-300 hover:bg-red-400/20 cursor-pointer"
                            >
                              <X size={14} />
                            </button>
                            <button
                              title="Delete"
                              onClick={() => remove(r.id)}
                              className="rounded-md bg-white/5 p-2 text-white/50 hover:bg-red-500/20 hover:text-red-400 cursor-pointer"
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
        )}

        {/* TAB 2: WHITELIST TASKS CONTROL */}
        {tab === 'tasks' && (
          <section className="mt-5 space-y-6">
            <div className="admin-card p-5">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <ListTodo className="text-[#c2ed55]" size={20} />
                    Whitelist Tasks Control
                  </h2>
                  <p className="mt-1 text-xs text-white/55">
                    Add, edit, remove, and reorder social tasks. Update headlines, action button links, instructions, and user input fields. Changes sync live to the whitelist application.
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={addTask}
                    className="flex items-center gap-1.5 rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-xs font-semibold text-white hover:bg-white/10 cursor-pointer"
                  >
                    <Plus size={14} /> Add Task
                  </button>
                  <button
                    onClick={resetDefaultTasks}
                    className="flex items-center gap-1.5 rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-xs font-semibold text-white/70 hover:bg-white/10 cursor-pointer"
                    title="Restore default @Buzquitos & @Mical_xz tasks"
                  >
                    <RotateCcw size={14} /> Reset
                  </button>
                  <button
                    onClick={saveTasks}
                    disabled={savingTasks}
                    className="flex items-center gap-1.5 rounded-lg bg-[#c2ed55] px-4 py-2 text-xs font-bold text-black hover:bg-[#b0dc44] cursor-pointer disabled:opacity-50"
                  >
                    <Save size={14} /> {savingTasks ? 'Saving…' : 'Save Tasks Changes'}
                  </button>
                </div>
              </div>
            </div>

            {/* List of Tasks */}
            <div className="space-y-4">
              {tasks.map((task, tIdx) => {
                const taskNum = String(tIdx + 1).padStart(2, '0');

                return (
                  <div
                    key={task.id || tIdx}
                    className="admin-card border border-white/10 p-5 space-y-4 relative"
                  >
                    {/* Task Card Header */}
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-3">
                      <div className="flex items-center gap-2">
                        <span className="rounded bg-[#c2ed55]/20 text-[#c2ed55] font-mono text-xs font-bold px-2 py-0.5">
                          TASK {taskNum}
                        </span>
                        <span className="font-bold text-sm text-white">{task.headline}</span>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          disabled={tIdx === 0}
                          onClick={() => moveTask(tIdx, 'up')}
                          className="p-1.5 rounded bg-white/5 text-white/70 hover:bg-white/10 disabled:opacity-30 cursor-pointer"
                          title="Move Up"
                        >
                          <ChevronUp size={15} />
                        </button>
                        <button
                          disabled={tIdx === tasks.length - 1}
                          onClick={() => moveTask(tIdx, 'down')}
                          className="p-1.5 rounded bg-white/5 text-white/70 hover:bg-white/10 disabled:opacity-30 cursor-pointer"
                          title="Move Down"
                        >
                          <ChevronDown size={15} />
                        </button>
                        <button
                          onClick={() => removeTask(tIdx)}
                          className="p-1.5 rounded bg-red-500/10 text-red-400 hover:bg-red-500/20 cursor-pointer ml-2"
                          title="Delete this task"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>

                    {/* Task Headline & Description */}
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div>
                        <label className="block text-[11px] font-semibold text-white/60 mb-1">
                          TASK HEADLINE *
                        </label>
                        <input
                          className="admin-field text-xs"
                          placeholder="e.g. Follow on X, Like & Retweet"
                          value={task.headline}
                          onChange={e => updateTask(tIdx, 'headline', e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-white/60 mb-1">
                          INSTRUCTIONS / DESCRIPTION
                        </label>
                        <input
                          className="admin-field text-xs"
                          placeholder="e.g. Follow both official accounts on X."
                          value={task.description}
                          onChange={e => updateTask(tIdx, 'description', e.target.value)}
                        />
                      </div>
                    </div>

                    {/* Action Button Links */}
                    <div className="rounded-lg bg-black/25 p-3.5 border border-white/5">
                      <div className="flex items-center justify-between mb-2.5">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-[#c2ed55] flex items-center gap-1.5">
                          <LinkIcon size={13} /> Action Links (Buttons clicked by users)
                        </span>
                        <button
                          onClick={() => addLink(tIdx)}
                          className="text-[11px] text-[#c2ed55] hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          <Plus size={13} /> Add Button Link
                        </button>
                      </div>

                      {task.links && task.links.length > 0 ? (
                        <div className="space-y-2">
                          {task.links.map((link, lIdx) => (
                            <div key={lIdx} className="flex flex-wrap sm:flex-nowrap items-center gap-2">
                              <div className="w-full sm:w-1/3">
                                <input
                                  className="admin-field text-xs !py-1.5"
                                  placeholder="Button Label (e.g. Follow @Buzquitos)"
                                  value={link.label}
                                  onChange={e => updateLink(tIdx, lIdx, 'label', e.target.value)}
                                />
                              </div>
                              <div className="w-full sm:flex-1 flex items-center gap-1.5">
                                <input
                                  className="admin-field text-xs !py-1.5 flex-1 font-mono"
                                  placeholder="Destination URL (https://x.com/...)"
                                  value={link.url}
                                  onChange={e => updateLink(tIdx, lIdx, 'url', e.target.value)}
                                />
                                {link.url && (
                                  <a
                                    href={link.url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="p-1.5 rounded bg-white/5 text-white/50 hover:text-white"
                                    title="Open link in new tab"
                                  >
                                    <ExternalLink size={13} />
                                  </a>
                                )}
                                <button
                                  onClick={() => removeLink(tIdx, lIdx)}
                                  className="p-1.5 rounded bg-red-500/10 text-red-400 hover:bg-red-500/20 cursor-pointer"
                                  title="Remove link"
                                >
                                  <X size={13} />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-white/40 italic">
                          No links added yet. Click &quot;Add Button Link&quot; to add action buttons for this task.
                        </p>
                      )}
                    </div>

                    {/* User Input Requirement */}
                    <div className="grid gap-3 sm:grid-cols-3 pt-1">
                      <div>
                        <label className="block text-[11px] font-semibold text-white/60 mb-1">
                          USER INPUT FIELD
                        </label>
                        <select
                          className="admin-field text-xs"
                          value={task.field_key}
                          onChange={e => updateTask(tIdx, 'field_key', e.target.value)}
                        >
                          <option value="x_username">X / Twitter Username (@yourhandle)</option>
                          <option value="reply_link">Post Reply / Comment URL (https://x.com/...)</option>
                          <option value="custom">Custom Text / Proof Input</option>
                          <option value="none">None (Action button only — no input)</option>
                        </select>
                      </div>

                      {task.field_key !== 'none' && (
                        <>
                          <div>
                            <label className="block text-[11px] font-semibold text-white/60 mb-1">
                              INPUT LABEL
                            </label>
                            <input
                              className="admin-field text-xs"
                              placeholder="e.g. YOUR X / TWITTER USERNAME"
                              value={task.field_label || ''}
                              onChange={e => updateTask(tIdx, 'field_label', e.target.value)}
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-semibold text-white/60 mb-1">
                              PLACEHOLDER
                            </label>
                            <input
                              className="admin-field text-xs"
                              placeholder="e.g. @yourhandle"
                              value={task.field_placeholder || ''}
                              onChange={e => updateTask(tIdx, 'field_placeholder', e.target.value)}
                            />
                          </div>
                        </>
                      )}
                    </div>

                    {task.field_key !== 'none' && (
                      <div className="flex items-center gap-2 pt-1">
                        <input
                          type="checkbox"
                          id={`req-${tIdx}`}
                          checked={Boolean(task.required)}
                          onChange={e => updateTask(tIdx, 'required', e.target.checked)}
                          className="accent-[#c2ed55] rounded"
                        />
                        <label htmlFor={`req-${tIdx}`} className="text-xs text-white/70 cursor-pointer">
                          Required field (users must fill this out to submit the whitelist form)
                        </label>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Bottom Actions */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <button
                onClick={addTask}
                className="flex items-center gap-1.5 rounded-lg border border-white/20 bg-white/5 px-4 py-2.5 text-xs font-semibold text-white hover:bg-white/10 cursor-pointer"
              >
                <Plus size={14} /> Add Another Task
              </button>

              <button
                onClick={saveTasks}
                disabled={savingTasks}
                className="flex items-center gap-2 rounded-lg bg-[#c2ed55] px-6 py-2.5 text-sm font-bold text-black hover:bg-[#b0dc44] cursor-pointer disabled:opacity-50"
              >
                <Save size={16} /> {savingTasks ? 'Saving Tasks…' : 'Save Tasks Changes'}
              </button>
            </div>
          </section>
        )}

        {/* TAB 3: COLLECTION SETTINGS */}
        {tab === 'settings' && (
          <section className="admin-card mt-5 max-w-3xl p-5">
            <div className="mb-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <h2 className="font-bold">Collection settings</h2>
                <p className="mt-1 text-xs text-white/45">Stored in MongoDB for API / frontend integration.</p>
              </div>
              <button
                onClick={() => setTab('tasks')}
                className="flex items-center gap-1.5 text-xs text-[#c2ed55] hover:underline cursor-pointer"
              >
                <ListTodo size={14} /> Manage Whitelist Tasks →
              </button>
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
              disabled={savingSettings}
              className="mt-6 rounded-lg bg-[#c2ed55] px-5 py-3 text-sm font-bold text-black cursor-pointer hover:bg-[#b0dc44] disabled:opacity-50"
            >
              {savingSettings ? 'Saving…' : 'Save settings'}
            </button>
          </section>
        )}
      </div>
    </main>
  );
}
