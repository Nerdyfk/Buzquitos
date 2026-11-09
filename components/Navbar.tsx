'use client';

import { motion } from 'framer-motion';
import { ArrowUpRight, Menu, X } from 'lucide-react';
import { useState } from 'react';

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const name = process.env.NEXT_PUBLIC_COLLECTION_NAME || 'BUZQUITOS';

  return (
    <header className="section-wrap relative z-30 flex items-center justify-between py-5">
      <a href="#home" className="flex items-center gap-3">
        <span className="grid h-10 w-10 place-items-center border-2 border-[#171820] bg-[#f6d52b] text-xl font-black shadow-[3px_3px_0_#171820]">
          B.
        </span>
        <span className="text-sm font-black tracking-tight">
          {name.toUpperCase()}
          <small className="block text-[9px] font-medium tracking-[.18em]">PIXEL PEOPLE CLUB</small>
        </span>
      </a>

      <nav className="hidden items-center gap-8 md:flex">
        <a className="text-sm font-semibold hover:underline" href="#about">
          The collection
        </a>
        <a className="text-sm font-semibold hover:underline" href="#details">
          Details
        </a>
        <a className="text-sm font-semibold hover:underline" href="#roadmap">
          Roadmap
        </a>
        <a className="text-sm font-semibold hover:underline" href="#faq">
          FAQ
        </a>
      </nav>

      <a href="#whitelist" className="pixel-btn hidden !px-4 !py-3 !text-xs sm:inline-flex">
        GET WHITELISTED <ArrowUpRight size={15} />
      </a>

      <button
        className="border-2 border-[#171820] p-2 md:hidden"
        onClick={() => setOpen(!open)}
        aria-label="Toggle menu"
      >
        {open ? <X /> : <Menu />}
      </button>

      {open && (
        <motion.nav
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute left-0 right-0 top-full grid gap-4 border-2 border-[#171820] bg-[#f7f7ed] p-5 shadow-[5px_5px_0_#171820] md:hidden"
        >
          <a href="#about" onClick={() => setOpen(false)}>
            The collection
          </a>
          <a href="#details" onClick={() => setOpen(false)}>
            Details
          </a>
          <a href="#roadmap" onClick={() => setOpen(false)}>
            Roadmap
          </a>
          <a href="#faq" onClick={() => setOpen(false)}>
            FAQ
          </a>
          <a href="#whitelist" onClick={() => setOpen(false)} className="font-bold">
            GET WHITELISTED ↗
          </a>
        </motion.nav>
      )}
    </header>
  );
}
