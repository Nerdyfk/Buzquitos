'use client';

import { FormEvent, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, ExternalLink, LoaderCircle, Heart, Repeat, MessageCircle } from 'lucide-react';

function StylishPen() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute -right-3 -top-6 sm:-right-6 sm:-top-9 z-30 w-16 sm:w-20 md:w-24 select-none rotate-[20deg]"
      style={{ filter: 'drop-shadow(5px 10px 8px rgba(0,0,0,0.45))' }}
    >
      <svg
        viewBox="0 0 100 360"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-auto"
      >
        <defs>
          <linearGradient id="penGold" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#d4af37" />
            <stop offset="35%" stopColor="#fff3b0" />
            <stop offset="70%" stopColor="#d4af37" />
            <stop offset="100%" stopColor="#997a15" />
          </linearGradient>
          <linearGradient id="penGoldDark" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#a37b12" />
            <stop offset="50%" stopColor="#ffd868" />
            <stop offset="100%" stopColor="#7a5a08" />
          </linearGradient>
          <linearGradient id="penBody" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#0a101d" />
            <stop offset="30%" stopColor="#1e2c45" />
            <stop offset="55%" stopColor="#2c3e5e" />
            <stop offset="85%" stopColor="#0e1726" />
            <stop offset="100%" stopColor="#05080f" />
          </linearGradient>
          <linearGradient id="penNibSilver" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#cbd5e1" />
            <stop offset="50%" stopColor="#ffffff" />
            <stop offset="100%" stopColor="#94a3b8" />
          </linearGradient>
        </defs>

        {/* 1. Golden Fountain Pen Nib */}
        <polygon points="50,358 36,305 64,305" fill="url(#penGold)" stroke="#171820" strokeWidth="1.5" />
        <polygon points="50,356 42,308 58,308" fill="url(#penNibSilver)" />
        <line x1="50" y1="358" x2="50" y2="322" stroke="#171820" strokeWidth="1.2" strokeLinecap="round" />
        <circle cx="50" cy="322" r="2.2" fill="#171820" />
        <path d="M42,328 Q50,334 58,328" stroke="url(#penGoldDark)" strokeWidth="1" fill="none" />

        {/* 2. Nib Collar / Section */}
        <polygon points="37,305 63,305 61,270 39,270" fill="#171820" stroke="#171820" strokeWidth="1" />
        <rect x="38" y="265" width="24" height="5" rx="1" fill="url(#penGold)" stroke="#171820" strokeWidth="1" />

        {/* 3. Pen Barrel */}
        <rect x="36" y="115" width="28" height="150" rx="3" fill="url(#penBody)" stroke="#171820" strokeWidth="1.5" />
        <line x1="43" y1="120" x2="43" y2="260" stroke="#ffffff" strokeWidth="1.8" opacity="0.35" strokeLinecap="round" />

        {/* 4. Central Gold Accent Bands */}
        <rect x="35" y="108" width="30" height="7" rx="1" fill="url(#penGold)" stroke="#171820" strokeWidth="1.2" />
        <line x1="36" y1="111.5" x2="64" y2="111.5" stroke="#7a5a08" strokeWidth="0.8" />

        {/* 5. Pen Cap */}
        <rect x="34.5" y="24" width="31" height="84" rx="4" fill="url(#penBody)" stroke="#171820" strokeWidth="1.5" />
        <line x1="42" y1="28" x2="42" y2="102" stroke="#ffffff" strokeWidth="1.8" opacity="0.4" strokeLinecap="round" />

        {/* 6. Gold Pocket Clip */}
        <rect x="34" y="26" width="32" height="6" rx="1" fill="url(#penGold)" stroke="#171820" strokeWidth="1" />
        <path d="M50,26 L50,82 Q50,89 54,89 Q57,89 57,84 L55,30 Z" fill="url(#penGoldDark)" stroke="#171820" strokeWidth="1.2" />
        <circle cx="53.5" cy="86" r="3.2" fill="url(#penGold)" stroke="#171820" strokeWidth="0.8" />

        {/* 7. Gold Finial */}
        <path d="M40,24 Q50,12 60,24 Z" fill="url(#penGold)" stroke="#171820" strokeWidth="1.5" />
        <circle cx="50" cy="18" r="2.5" fill="#171820" opacity="0.6" />
      </svg>
    </div>
  );
}

function ClipboardClip() {
  return (
    <div className="relative z-20 -mb-5 sm:-mb-6 flex flex-col items-center select-none">
      {/* Hanging bracket loop */}
      <div className="h-4 sm:h-5 w-14 sm:w-16 -mb-1 rounded-t-xl border-4 border-[#475569] bg-transparent shadow-[inset_0_2px_3px_rgba(0,0,0,0.4)]" />

      {/* Main metal clamp body */}
      <div className="relative flex h-9 sm:h-11 w-44 sm:w-56 items-center justify-between rounded-sm border-2 border-[#171820] bg-gradient-to-b from-[#f8fafc] via-[#cbd5e1] to-[#94a3b8] px-3.5 shadow-[0_5px_8px_rgba(0,0,0,0.35)]">
        {/* Left rivet */}
        <div className="flex h-3 w-3 sm:h-3.5 sm:w-3.5 items-center justify-center rounded-full border border-[#171820] bg-[#475569] shadow-inner">
          <div className="h-1 w-1 sm:h-1.5 sm:w-1.5 rounded-full bg-[#1e293b]" />
        </div>

        {/* Center clip grooves */}
        <div className="flex flex-col items-center gap-0.5">
          <div className="h-0.5 sm:h-1 w-14 sm:w-16 rounded bg-[#475569]/40 border-t border-white" />
          <div className="h-0.5 sm:h-1 w-14 sm:w-16 rounded bg-[#475569]/40 border-t border-white" />
          <span className="font-mono text-[8px] sm:text-[9px] font-black tracking-widest text-[#1e293b]/70">BUZQUITOS</span>
        </div>

        {/* Right rivet */}
        <div className="flex h-3 w-3 sm:h-3.5 sm:w-3.5 items-center justify-center rounded-full border border-[#171820] bg-[#475569] shadow-inner">
          <div className="h-1 w-1 sm:h-1.5 sm:w-1.5 rounded-full bg-[#1e293b]" />
        </div>

        {/* Bottom metal clamping bar */}
        <div className="absolute -bottom-1.5 left-0 right-0 h-2 bg-gradient-to-r from-[#64748b] via-[#94a3b8] to-[#64748b] border-t border-[#171820] shadow-[0_4px_6px_rgba(23,24,32,0.45)]" />
      </div>
    </div>
  );
}

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
    <div className="relative w-full max-w-xl mx-auto">
      {/* Stylish Fountain Pen Resting in the Corner */}
      <StylishPen />

      {/* The Clipboard Board Backing */}
      <div className="clipboard-bg relative rounded-2xl sm:rounded-3xl border-4 border-[#171820] p-2.5 sm:p-5 pt-3 sm:pt-4 pb-4 sm:pb-6 shadow-[8px_10px_0_#171820]">
        
        {/* Clipboard Clamp at the Top */}
        <ClipboardClip />

        {/* The Clipped Paper Sheet / Page */}
        <div className="paper-sheet relative mt-2.5 sm:mt-3 rounded-sm border-2 border-[#171820] p-4 sm:p-7 pt-7 sm:pt-8 shadow-[3px_5px_15px_rgba(0,0,0,0.18)]">
          <div className="eyebrow mb-1 text-[10px] sm:text-[11px] text-[#4a5568]">01 / Whitelist Application</div>
          
          <h3 className="pen-script text-3xl sm:text-4xl font-bold tracking-tight text-[#162038]">
            Claim your spot.
          </h3>
          
          <p className="pen-script mb-5 sm:mb-6 mt-1 text-base sm:text-lg text-[#253350] leading-snug">
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
                  <h4 className="pen-script text-2xl sm:text-3xl font-bold text-[#162038]">APPLICATION RECEIVED!</h4>
                  <p className="pen-script mt-2 text-base sm:text-lg text-[#253350] leading-snug">
                    Your entry has been successfully recorded. Follow @Buzquitos on X for the upcoming whitelist announcement.
                  </p>
                  <div className="mt-4 font-mono text-[11px] sm:text-xs font-bold text-[#171820]">
                    FOLLOW @BUZQUITOS &amp; @MICAL_XZ ON X ✦
                  </div>
                </motion.div>
              ) : (
                <motion.form key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} onSubmit={submit} className="space-y-4 sm:space-y-5">
                  {/* Task 1: Follow @Buzquitos & @Mical_xz */}
                  <div className="border-2 border-[#171820] bg-white/70 p-3.5 sm:p-4 shadow-[2px_2px_0_rgba(23,24,32,0.15)]">
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
                      <label className="pen-script block text-base sm:text-lg font-bold text-[#162038]">
                        YOUR X / TWITTER USERNAME <span className="text-red-600">*</span>
                      </label>
                      <input
                        className="field pen-script text-lg sm:text-xl text-[#142345] bg-white/90 placeholder:text-slate-400 placeholder:italic"
                        required
                        maxLength={50}
                        placeholder="@yourhandle"
                        value={form.x_username}
                        onChange={e => update('x_username', e.target.value)}
                      />
                      <span className="pen-script mt-1 block text-sm sm:text-base text-[#475569]">
                        Follow both @Buzquitos and @Mical_xz on X.
                      </span>
                    </div>
                  </div>

                  {/* Task 2: Like, Retweet & Reply */}
                  <div className="border-2 border-[#171820] bg-white/70 p-3.5 sm:p-4 shadow-[2px_2px_0_rgba(23,24,32,0.15)]">
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
                    <p className="pen-script mt-1 text-sm sm:text-base text-[#334155]">
                      Like, retweet, and reply to our pinned post on <a href="https://x.com/Buzquitos" target="_blank" rel="noreferrer" className="underline font-bold">@Buzquitos</a>.
                    </p>
                    <div className="mt-2.5 sm:mt-3">
                      <label className="pen-script block text-base sm:text-lg font-bold text-[#162038]">
                        SUBMIT YOUR REPLY LINK <span className="text-red-600">*</span>
                      </label>
                      <input
                        className="field mono text-xs sm:text-sm bg-white/90 text-[#142345] placeholder:text-slate-400"
                        required
                        type="url"
                        placeholder="https://x.com/..."
                        value={form.reply_link}
                        onChange={e => update('reply_link', e.target.value.trim())}
                      />
                      <span className="pen-script mt-1 block text-sm sm:text-base text-[#475569]">
                        Paste the direct URL of your reply comment on the pinned post.
                      </span>
                    </div>
                  </div>

                  {/* Task 3: Wallet Address */}
                  <div>
                    <label className="pen-script block text-base sm:text-lg font-bold text-[#162038]">
                      WALLET ADDRESS <span className="text-red-600">*</span>
                    </label>
                    <input
                      className="field mono text-xs sm:text-sm bg-white/90 text-[#142345] placeholder:text-slate-400"
                      required
                      minLength={10}
                      maxLength={100}
                      placeholder="0x..."
                      value={form.wallet}
                      onChange={e => update('wallet', e.target.value.trim())}
                    />
                  </div>

                  <label className="flex items-start gap-2.5 leading-snug">
                    <input type="checkbox" required className="mt-1 accent-[#171820] shrink-0" />
                    <span className="pen-script text-base sm:text-lg font-semibold text-[#1f2d48]">
                      I confirm I followed @Buzquitos &amp; @Mical_xz, completed the tasks, and submitted my correct wallet.
                    </span>
                  </label>

                  {error && (
                    <p role="alert" className="border-2 border-red-600 bg-red-50 p-2.5 sm:p-3 text-xs sm:text-sm text-red-700">
                      {error}
                    </p>
                  )}

                  <button disabled={busy} className="pixel-btn w-full !py-3.5" type="submit">
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
      </div>
    </div>
  );
}
