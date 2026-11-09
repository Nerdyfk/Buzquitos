'use client';

import { FormEvent, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, ExternalLink, LoaderCircle, Sparkles, Heart, Repeat, MessageCircle } from 'lucide-react';

export default function WhitelistForm({ isOpen = true }: { isOpen?: boolean }) {
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ wallet: '', x_username: '', reply_link: '' });

  const update = (key: string, value: string) => setForm(p => ({ ...p, [key]: value }));

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError('');

    try {
      const r = await fetch('/api/whitelist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
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
    <div className="card relative p-5 sm:p-7">
      <div className="absolute -right-3 -top-3 grid h-11 w-11 rotate-12 place-items-center border-2 border-[#171820] bg-[#f6d52b] shadow-[3px_3px_0_#171820]">
        <Sparkles size={20} />
      </div>
      <div className="eyebrow mb-2">01 / Whitelist Application</div>
      <h3 className="text-3xl font-black tracking-[-.06em]">Claim your spot.</h3>
      <p className="mb-6 mt-2 text-sm text-[#535744]">
        {isOpen
          ? 'Complete the social tasks below to apply for the whitelist. Submission does not guarantee whitelist allocation.'
          : 'Whitelist registration is currently closed. Follow our official socials for the next update.'}
      </p>

      {!isOpen ? (
        <div className="border-2 border-[#171820] bg-[#f6d52b] p-5 font-bold">
          REGISTRATION CLOSED
          <span className="mt-2 block text-xs font-normal">Thanks for your interest. Stay tuned.</span>
        </div>
      ) : (
        <AnimatePresence mode="wait">
          {done ? (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.94 }}
              animate={{ opacity: 1, scale: 1 }}
              className="border-2 border-[#171820] bg-[#c2ed55] p-6 text-center"
            >
              <div className="mx-auto mb-3 grid h-14 w-14 place-items-center border-2 border-[#171820] bg-white">
                <Check size={30} />
              </div>
              <h4 className="text-2xl font-black">APPLICATION RECEIVED!</h4>
              <p className="mt-2 text-sm">
                Your entry has been recorded for review. Remember that submitting an application does not guarantee a whitelist allocation.
              </p>
              <div className="mt-4 font-mono text-xs">KEEP AN EYE ON @BUZQUITOS ✦</div>
            </motion.div>
          ) : (
            <motion.form key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} onSubmit={submit} className="space-y-5">
              {/* Task 1: Follow @Buzquitos */}
              <div className="border-2 border-[#171820] bg-[#f7f7ed] p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-mono text-xs font-bold text-[#e42c24]">TASK 01</span>
                  <a
                    href="https://x.com/Buzquitos"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 border-2 border-[#171820] bg-[#f6d52b] px-2.5 py-1 text-xs font-bold shadow-[2px_2px_0_#171820] hover:translate-x-0.5 hover:translate-y-0.5"
                  >
                    Follow @Buzquitos on X <ExternalLink size={13} />
                  </a>
                </div>
                <div className="mt-3">
                  <label className="label">
                    YOUR X / TWITTER USERNAME <span className="text-red-600">*</span>
                  </label>
                  <input
                    className="field"
                    required
                    maxLength={50}
                    placeholder="@yourhandle"
                    value={form.x_username}
                    onChange={e => update('x_username', e.target.value)}
                  />
                </div>
              </div>

              {/* Task 2: Like, Retweet & Reply */}
              <div className="border-2 border-[#171820] bg-[#f7f7ed] p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-mono text-xs font-bold text-[#e42c24]">TASK 02</span>
                  <a
                    href="https://x.com/Buzquitos"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 border-2 border-[#171820] bg-[#c2ed55] px-2.5 py-1 text-xs font-bold shadow-[2px_2px_0_#171820] hover:translate-x-0.5 hover:translate-y-0.5"
                  >
                    Open Pinned Post <ExternalLink size={13} />
                  </a>
                </div>
                <div className="mt-2 flex items-center gap-4 text-xs font-bold text-[#394127]">
                  <span className="flex items-center gap-1"><Heart size={13} className="text-red-600" /> Like</span>
                  <span className="flex items-center gap-1"><Repeat size={13} className="text-green-600" /> Retweet</span>
                  <span className="flex items-center gap-1"><MessageCircle size={13} className="text-blue-600" /> Reply</span>
                </div>
                <p className="mt-1 text-xs text-[#535744]">
                  Like, retweet, and reply to our pinned tweet on <a href="https://x.com/Buzquitos" target="_blank" rel="noreferrer" className="underline font-bold">@Buzquitos</a>.
                </p>
                <div className="mt-3">
                  <label className="label">
                    SUBMIT YOUR REPLY LINK <span className="text-red-600">*</span>
                  </label>
                  <input
                    className="field mono text-xs sm:text-sm"
                    required
                    type="url"
                    placeholder="https://x.com/Buzquitos/status/... or your reply URL"
                    value={form.reply_link}
                    onChange={e => update('reply_link', e.target.value.trim())}
                  />
                  <span className="mt-1 block text-[11px] text-[#747765]">
                    Paste the direct URL of your reply comment on the pinned post.
                  </span>
                </div>
              </div>

              {/* Task 3: Wallet Address */}
              <div>
                <label className="label">
                  WALLET ADDRESS <span className="text-red-600">*</span>
                </label>
                <input
                  className="field mono text-sm"
                  required
                  minLength={10}
                  maxLength={100}
                  placeholder="0x..."
                  value={form.wallet}
                  onChange={e => update('wallet', e.target.value.trim())}
                />
              </div>

              {/* Notice / Disclaimer */}
              <div className="border-2 border-[#171820] bg-[#f6d52b]/30 p-3 text-xs text-[#394127]">
                <b>⚠️ PLEASE NOTE:</b> Submitting the whitelist application does <u>not</u> guarantee you will be whitelisted. All submissions are subject to review.
              </div>

              <label className="flex items-start gap-3 text-xs leading-relaxed text-[#535744]">
                <input type="checkbox" required className="mt-0.5 accent-[#171820]" />
                <span>
                  I confirm I followed @Buzquitos, liked/retweeted/replied to the pinned post, and understand that submission does not guarantee whitelist allocation.
                </span>
              </label>

              {error && (
                <p role="alert" className="border-2 border-red-600 bg-red-50 p-3 text-sm text-red-700">
                  {error}
                </p>
              )}

              <button disabled={busy} className="pixel-btn w-full" type="submit">
                {busy ? (
                  <>
                    <LoaderCircle className="animate-spin" size={17} /> SUBMITTING APPLICATION...
                  </>
                ) : (
                  <>
                    SUBMIT WHITELIST APPLICATION <span>↗</span>
                  </>
                )}
              </button>

              <p className="text-center font-mono text-[10px] text-[#747765]">NO SEED PHRASE. NO PRIVATE KEY. EVER.</p>
            </motion.form>
          )}
        </AnimatePresence>
      )}
    </div>
  );
}
