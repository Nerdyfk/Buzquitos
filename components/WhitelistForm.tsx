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
    <div className="card relative p-4 sm:p-7 w-full overflow-hidden">
      <div className="absolute -right-2 -top-2 sm:-right-3 sm:-top-3 grid h-9 w-9 sm:h-11 sm:w-11 rotate-12 place-items-center border-2 border-[#171820] bg-[#f6d52b] shadow-[2px_2px_0_#171820] sm:shadow-[3px_3px_0_#171820]">
        <Sparkles size={18} />
      </div>

      <div className="eyebrow mb-1.5 sm:mb-2 text-[10px] sm:text-[11px]">01 / Whitelist Application</div>
      <h3 className="text-2xl sm:text-3xl font-black tracking-[-.05em]">Claim your spot.</h3>
      <p className="mb-5 sm:mb-6 mt-1.5 sm:mt-2 text-xs sm:text-sm text-[#535744] leading-relaxed">
        {isOpen
          ? 'Complete the social tasks below to apply for the 5,555 PFP whitelist.'
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
                Your entry has been successfully recorded. Follow @Buzquitos on X for the upcoming whitelist announcement.
              </p>
              <div className="mt-4 font-mono text-[11px] sm:text-xs">FOLLOW @BUZQUITOS &amp; @MICAL_XZ ON X ✦</div>
            </motion.div>
          ) : (
            <motion.form key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} onSubmit={submit} className="space-y-4 sm:space-y-5">
              {/* Task 1: Follow @Buzquitos & @Mical_xz */}
              <div className="border-2 border-[#171820] bg-[#f7f7ed] p-3.5 sm:p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-mono text-[10px] sm:text-xs font-bold text-[#e42c24]">TASK 01</span>
                  <div className="flex flex-wrap items-center gap-2">
                    <a
                      href="https://x.com/Buzquitos"
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 border-2 border-[#171820] bg-[#f6d52b] px-2 py-1 text-[11px] sm:text-xs font-bold shadow-[2px_2px_0_#171820] hover:translate-x-0.5 hover:translate-y-0.5"
                    >
                      Follow @Buzquitos <ExternalLink size={12} />
                    </a>
                    <a
                      href="https://x.com/Mical_xz"
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 border-2 border-[#171820] bg-[#c2ed55] px-2 py-1 text-[11px] sm:text-xs font-bold shadow-[2px_2px_0_#171820] hover:translate-x-0.5 hover:translate-y-0.5"
                    >
                      Follow @Mical_xz <ExternalLink size={12} />
                    </a>
                  </div>
                </div>
                <div className="mt-2.5 sm:mt-3">
                  <label className="label text-xs">
                    YOUR X / TWITTER USERNAME <span className="text-red-600">*</span>
                  </label>
                  <input
                    className="field text-sm"
                    required
                    maxLength={50}
                    placeholder="@yourhandle"
                    value={form.x_username}
                    onChange={e => update('x_username', e.target.value)}
                  />
                  <span className="mt-1 block text-[10px] sm:text-[11px] text-[#747765]">
                    Follow both @Buzquitos and @Mical_xz on X.
                  </span>
                </div>
              </div>

              {/* Task 2: Like, Retweet & Reply */}
              <div className="border-2 border-[#171820] bg-[#f7f7ed] p-3.5 sm:p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-mono text-[10px] sm:text-xs font-bold text-[#e42c24]">TASK 02</span>
                  <a
                    href="https://x.com/Buzquitos"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 border-2 border-[#171820] bg-[#c2ed55] px-2 py-1 text-[11px] sm:text-xs font-bold shadow-[2px_2px_0_#171820] hover:translate-x-0.5 hover:translate-y-0.5"
                  >
                    Open Pinned Post <ExternalLink size={12} />
                  </a>
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-3 text-[11px] sm:text-xs font-bold text-[#394127]">
                  <span className="flex items-center gap-1"><Heart size={12} className="text-red-600" /> Like</span>
                  <span className="flex items-center gap-1"><Repeat size={12} className="text-green-600" /> Retweet</span>
                  <span className="flex items-center gap-1"><MessageCircle size={12} className="text-blue-600" /> Reply</span>
                </div>
                <p className="mt-1 text-[11px] sm:text-xs text-[#535744]">
                  Like, retweet, and reply to our pinned post on <a href="https://x.com/Buzquitos" target="_blank" rel="noreferrer" className="underline font-bold">@Buzquitos</a>.
                </p>
                <div className="mt-2.5 sm:mt-3">
                  <label className="label text-xs">
                    SUBMIT YOUR REPLY LINK <span className="text-red-600">*</span>
                  </label>
                  <input
                    className="field mono text-xs sm:text-sm"
                    required
                    type="url"
                    placeholder="https://x.com/..."
                    value={form.reply_link}
                    onChange={e => update('reply_link', e.target.value.trim())}
                  />
                  <span className="mt-1 block text-[10px] sm:text-[11px] text-[#747765]">
                    Paste the direct URL of your reply comment on the pinned post.
                  </span>
                </div>
              </div>

              {/* Task 3: Wallet Address */}
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

              <label className="flex items-start gap-2.5 text-[11px] sm:text-xs leading-relaxed text-[#535744]">
                <input type="checkbox" required className="mt-0.5 accent-[#171820] shrink-0" />
                <span>
                  I confirm I followed @Buzquitos &amp; @Mical_xz, completed the tasks, and submitted my correct wallet.
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

              <p className="text-center font-mono text-[9px] sm:text-[10px] text-[#747765]">
                NO SEED PHRASE. NO PRIVATE KEY. EVER.
              </p>
            </motion.form>
          )}
        </AnimatePresence>
      )}
    </div>
  );
}
