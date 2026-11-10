'use client';

import { FormEvent, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, ExternalLink, LoaderCircle, Heart, Repeat, MessageCircle } from 'lucide-react';
import { WhitelistTask, DEFAULT_WHITELIST_TASKS } from '@/types/whitelist-tasks';

export default function WhitelistForm({
  isOpen = true,
  tasks: initialTasks
}: {
  isOpen?: boolean;
  tasks?: WhitelistTask[];
}) {
  const [tasks, setTasks] = useState<WhitelistTask[]>(initialTasks || DEFAULT_WHITELIST_TASKS);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ wallet: '', x_username: '', reply_link: '' });
  const [customResponses, setCustomResponses] = useState<Record<string, string>>({});

  useEffect(() => {
    if (initialTasks && initialTasks.length > 0) {
      setTasks(initialTasks);
    } else {
      // Fetch latest tasks client-side if not supplied
      fetch('/api/tasks')
        .then(r => r.json())
        .then(data => {
          if (Array.isArray(data.tasks) && data.tasks.length > 0) {
            setTasks(data.tasks);
          }
        })
        .catch(() => {});
    }
  }, [initialTasks]);

  const update = (key: string, value: string) => setForm(p => ({ ...p, [key]: value }));
  const updateCustom = (taskId: string, value: string) =>
    setCustomResponses(p => ({ ...p, [taskId]: value }));

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError('');

    try {
      const payload = {
        ...form,
        responses: customResponses
      };

      const r = await fetch('/api/whitelist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || 'Something went wrong.');
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to submit. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="card relative p-4 sm:p-7 w-full overflow-hidden">
      <div className="eyebrow mb-1.5 sm:mb-2 text-[10px] sm:text-[11px]">01 / Whitelist Application</div>
      <h3 className="text-2xl sm:text-3xl font-black tracking-[-.05em]">Claim your spot.</h3>
      <p className="mb-5 sm:mb-6 mt-1.5 sm:mt-2 text-xs sm:text-sm text-[#535744] leading-relaxed">
        {isOpen
          ? 'Complete the social tasks below to apply for the whitelist.'
          : 'Whitelist registration is currently closed. Follow our official X for the next update.'}
      </p>

      {!isOpen ? (
        <div className="border-2 border-[#171820] bg-[#f6d52b] p-4 sm:p-5 font-bold">
          REGISTRATION CLOSED
          <span className="mt-1.5 block text-xs font-normal">Thanks for your interest. Stay tuned.</span>
        </div>
      ) : (
        <AnimatePresence mode="wait">
          {done ? (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.94 }}
              animate={{ opacity: 1, scale: 1 }}
              className="border-2 border-[#171820] bg-[#c2ed55] p-5 sm:p-6 text-center"
            >
              <div className="mx-auto mb-3 grid h-12 w-12 sm:h-14 sm:w-14 place-items-center border-2 border-[#171820] bg-white">
                <Check size={26} />
              </div>
              <h4 className="text-xl sm:text-2xl font-black">APPLICATION RECEIVED!</h4>
              <p className="mt-2 text-xs sm:text-sm text-[#394127] leading-relaxed">
                Your entry has been successfully recorded. Follow our official channels for the upcoming whitelist announcement.
              </p>
              <div className="mt-4 font-mono text-[11px] sm:text-xs">
                OFFICIAL WHITELIST ENTRY CONFIRMED ✦
              </div>
            </motion.div>
          ) : (
            <motion.form key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} onSubmit={submit} className="space-y-4 sm:space-y-5">
              {/* Dynamic Admin-Controlled Tasks */}
              {tasks.map((task, idx) => {
                const taskNum = String(idx + 1).padStart(2, '0');
                const isEven = idx % 2 === 1;

                return (
                  <div key={task.id || idx} className="border-2 border-[#171820] bg-[#f7f7ed] p-3.5 sm:p-4">
                    {/* Task Header: Label + Action Links */}
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[10px] sm:text-xs font-bold text-[#e42c24]">
                          TASK {taskNum}
                        </span>
                        <span className="font-bold text-xs sm:text-sm text-[#171820]">
                          {task.headline}
                        </span>
                      </div>

                      {/* Action Links / Buttons */}
                      {task.links && task.links.length > 0 && (
                        <div className="flex flex-wrap items-center gap-2">
                          {task.links.map((link, lIdx) => (
                            <a
                              key={lIdx}
                              href={link.url}
                              target="_blank"
                              rel="noreferrer"
                              className={`inline-flex items-center gap-1 border-2 border-[#171820] px-2 py-1 text-[11px] sm:text-xs font-bold shadow-[2px_2px_0_#171820] hover:translate-x-0.5 hover:translate-y-0.5 transition-transform ${
                                lIdx === 0
                                  ? isEven
                                    ? 'bg-[#c2ed55]'
                                    : 'bg-[#f6d52b]'
                                  : 'bg-[#c2ed55]'
                              }`}
                            >
                              {link.label} <ExternalLink size={12} />
                            </a>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Task Description */}
                    {task.description && (
                      <p className="mt-2 text-[11px] sm:text-xs text-[#535744] leading-relaxed">
                        {task.description}
                      </p>
                    )}

                    {/* Optional Social Helper Badges for Reply/Like tasks */}
                    {task.field_key === 'reply_link' && (
                      <div className="mt-2 flex flex-wrap items-center gap-3 text-[11px] sm:text-xs font-bold text-[#394127]">
                        <span className="flex items-center gap-1"><Heart size={12} className="text-red-600" /> Like</span>
                        <span className="flex items-center gap-1"><Repeat size={12} className="text-green-600" /> Retweet</span>
                        <span className="flex items-center gap-1"><MessageCircle size={12} className="text-blue-600" /> Reply</span>
                      </div>
                    )}

                    {/* Task Input Field (if configured) */}
                    {task.field_key === 'x_username' && (
                      <div className="mt-2.5 sm:mt-3">
                        <label className="label text-xs">
                          {task.field_label || 'YOUR X / TWITTER USERNAME'}{' '}
                          {task.required && <span className="text-red-600">*</span>}
                        </label>
                        <input
                          className="field text-sm"
                          required={task.required}
                          maxLength={50}
                          placeholder={task.field_placeholder || '@yourhandle'}
                          value={form.x_username}
                          onChange={e => update('x_username', e.target.value)}
                        />
                      </div>
                    )}

                    {task.field_key === 'reply_link' && (
                      <div className="mt-2.5 sm:mt-3">
                        <label className="label text-xs">
                          {task.field_label || 'SUBMIT YOUR REPLY LINK'}{' '}
                          {task.required && <span className="text-red-600">*</span>}
                        </label>
                        <input
                          className="field mono text-xs sm:text-sm"
                          required={task.required}
                          type="url"
                          placeholder={task.field_placeholder || 'https://x.com/...'}
                          value={form.reply_link}
                          onChange={e => update('reply_link', e.target.value.trim())}
                        />
                      </div>
                    )}

                    {task.field_key === 'custom' && (
                      <div className="mt-2.5 sm:mt-3">
                        <label className="label text-xs">
                          {task.field_label || 'SUBMISSION PROOF / ANSWER'}{' '}
                          {task.required && <span className="text-red-600">*</span>}
                        </label>
                        <input
                          className="field text-xs sm:text-sm"
                          required={task.required}
                          placeholder={task.field_placeholder || 'Enter your response...'}
                          value={customResponses[task.id] || ''}
                          onChange={e => updateCustom(task.id, e.target.value)}
                        />
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Final Step: Wallet Address Input */}
              <div>
                <label className="label text-xs">
                  WALLET ADDRESS <span className="text-red-600">*</span>
                </label>
                <input
                  className="field mono text-xs sm:text-sm"
                  required
                  minLength={10}
                  maxLength={100}
                  placeholder="0x..."
                  value={form.wallet}
                  onChange={e => update('wallet', e.target.value.trim())}
                />
              </div>

              {/* Confirmation Checkbox */}
              <label className="flex items-start gap-2.5 text-[11px] sm:text-xs leading-relaxed text-[#535744] cursor-pointer">
                <input type="checkbox" required className="mt-0.5 accent-[#171820] shrink-0" />
                <span>
                  I confirm I have completed the tasks above and submitted my correct wallet address.
                </span>
              </label>

              {error && (
                <p role="alert" className="border-2 border-red-600 bg-red-50 p-2.5 sm:p-3 text-xs sm:text-sm text-red-700">
                  {error}
                </p>
              )}

              <button disabled={busy} className="pixel-btn w-full" type="submit">
                {busy ? (
                  <>
                    <LoaderCircle className="animate-spin" size={16} /> SUBMITTING APPLICATION...
                  </>
                ) : (
                  <>
                    SUBMIT WHITELIST APPLICATION <span>↗</span>
                  </>
                )}
              </button>
            </motion.form>
          )}
        </AnimatePresence>
      )}
    </div>
  );
}
