'use client';

import { motion } from 'framer-motion';
import { ArrowUpRight, Menu, X } from 'lucide-react';
import { useState } from 'react';
import Image from 'next/image';

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const name = process.env.NEXT_PUBLIC_COLLECTION_NAME || 'BUZQUITOS';

  return (
    <header className="section-wrap relative z-30 flex items-center justify-between py-4 sm:py-5">
      <a href="#home" className="flex items-center gap-2.5 sm:gap-3">
        <div className="relative h-9 w-9 sm:h-10 sm:w-10 overflow-hidden rounded-md border-2 border-[#171820] bg-[#f6d52b] shadow-[3px_3px_0_#171820] shrink-0">
          <Image
            src="/logo.png"
            alt="Buzquitos Logo"
            width={40}
            height={40}
            className="h-full w-full object-cover"
            priority
          />
        </div>
        <span className="text-xs sm:text-sm font-black tracking-tight">
          {name.toUpperCase()}
          <small className="block text-[8px] sm:text-[9px] font-medium tracking-[.18em] text-[#394127]">
            PIXEL PFP COLLECTION
          </small>
        </span>
      </a>

      <nav className="hidden items-center gap-6 lg:gap-8 md:flex">
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
        APPLY FOR WHITELIST <ArrowUpRight size={15} />
      </a>

      <button
        className="border-2 border-[#171820] p-2 md:hidden bg-[#f7f7ed]"
        onClick={() => setOpen(!open)}
        aria-label="Toggle menu"
      >
        {open ? <X size={20} /> : <Menu size={20} />}
      </button>

      {open && (
        <motion.nav
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute left-0 right-0 top-full z-50 grid gap-3 border-2 border-[#171820] bg-[#f7f7ed] p-5 shadow-[5px_5px_0_#171820] md:hidden"
        >
          <a href="#about" onClick={() => setOpen(false)} className="py-1 font-semibold text-sm">
            The collection
          </a>
          <a href="#details" onClick={() => setOpen(false)} className="py-1 font-semibold text-sm">
            Details
          </a>
          <a href="#roadmap" onClick={() => setOpen(false)} className="py-1 font-semibold text-sm">
            Roadmap
          </a>
          <a href="#faq" onClick={() => setOpen(false)} className="py-1 font-semibold text-sm">
            FAQ
          </a>
          <a
            href="#whitelist"
            onClick={() => setOpen(false)}
            className="mt-2 block border-2 border-[#171820] bg-[#171820] p-3 text-center text-xs font-bold text-white"
          >
            APPLY FOR WHITELIST ↗
          </a>
        </motion.nav>
      )}
    </header>
  );
}
