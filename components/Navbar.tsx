'use client';

import { motion } from 'framer-motion';
import { ArrowUpRight, Menu, X } from 'lucide-react';
import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const name = process.env.NEXT_PUBLIC_COLLECTION_NAME || 'BUZQUITOS';

  return (
    <header className="section-wrap relative z-30 flex items-center justify-between py-4 sm:py-5">
      <Link href="/" className="flex items-center gap-2.5 sm:gap-3">
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
      </Link>

      <nav className="hidden items-center gap-6 lg:gap-8 md:flex">
        <Link className="text-sm font-semibold hover:underline" href="/#about">
          The collection
        </Link>
        <Link className="text-sm font-semibold hover:underline" href="/#details">
          Details
        </Link>
        <Link className="text-sm font-semibold hover:underline" href="/#roadmap">
          Roadmap
        </Link>
        <Link className="text-sm font-semibold hover:underline" href="/#faq">
          FAQ
        </Link>
        <Link
          className="border-2 border-[#171820] bg-[#f6d52b] px-3 py-1 font-mono text-xs font-bold shadow-[2px_2px_0_#171820] transition hover:-translate-x-0.5 hover:-translate-y-0.5"
          href="/puzzle"
        >
          PUZZLE
        </Link>
      </nav>

      <Link href="/#whitelist" className="pixel-btn hidden !px-4 !py-3 !text-xs sm:inline-flex">
        APPLY FOR WHITELIST <ArrowUpRight size={15} />
      </Link>

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
          <Link href="/#about" onClick={() => setOpen(false)} className="py-1 font-semibold text-sm">
            The collection
          </Link>
          <Link href="/#details" onClick={() => setOpen(false)} className="py-1 font-semibold text-sm">
            Details
          </Link>
          <Link href="/#roadmap" onClick={() => setOpen(false)} className="py-1 font-semibold text-sm">
            Roadmap
          </Link>
          <Link href="/#faq" onClick={() => setOpen(false)} className="py-1 font-semibold text-sm">
            FAQ
          </Link>
          <Link
            href="/puzzle"
            onClick={() => setOpen(false)}
            className="block border-2 border-[#171820] bg-[#f6d52b] p-3 text-center font-mono text-xs font-bold text-[#171820]"
          >
            GTD PUZZLE CHALLENGE ↗
          </Link>
          <Link
            href="/#whitelist"
            onClick={() => setOpen(false)}
            className="mt-1 block border-2 border-[#171820] bg-[#171820] p-3 text-center text-xs font-bold text-white"
          >
            APPLY FOR WHITELIST ↗
          </Link>
        </motion.nav>
      )}
    </header>
  );
}
