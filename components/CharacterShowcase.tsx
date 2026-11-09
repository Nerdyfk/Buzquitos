'use client';

import { useState } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Maximize2, X } from 'lucide-react';

const CHARACTERS = [
  { id: 1, name: 'Buzquito', src: '/characters/buzquito-1.png' },
  { id: 2, name: 'Buzquito', src: '/characters/buzquito-2.png' },
  { id: 3, name: 'Buzquito', src: '/characters/buzquito-3.png' },
  { id: 4, name: 'Buzquito', src: '/characters/buzquito-5.png' },
  { id: 5, name: 'Buzquito', src: '/characters/buzquito-6.png' },
  { id: 6, name: 'Buzquito', src: '/characters/buzquito-7.png' }
];

export default function CharacterShowcase() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);

  const prev = () => setCurrentIndex(i => (i === 0 ? CHARACTERS.length - 1 : i - 1));
  const next = () => setCurrentIndex(i => (i === CHARACTERS.length - 1 ? 0 : i + 1));

  const current = CHARACTERS[currentIndex];
  // Helper for background floating previews
  const prevChar = CHARACTERS[(currentIndex - 1 + CHARACTERS.length) % CHARACTERS.length];
  const nextChar = CHARACTERS[(currentIndex + 1) % CHARACTERS.length];

  return (
    <div className="relative mx-auto w-full max-w-[440px] sm:max-w-[480px] lg:max-w-[420px] xl:max-w-[480px] px-2 sm:px-0 mt-4 lg:mt-0 justify-self-center lg:justify-self-end">
      {/* Angled decorative grid frame */}
      <div className="grid-bg absolute inset-0 -rotate-2 sm:-rotate-3 border-2 border-[#171820] bg-[#b2df43] shadow-[5px_5px_0_#171820]" />

      {/* Main Showcase Container */}
      <div className="relative border-2 border-[#171820] bg-[#f7f7ed] p-3 sm:p-4 shadow-[4px_4px_0_#171820]">
        {/* Top Header Bar */}
        <div className="flex items-center justify-between pb-3 border-b-2 border-[#171820]">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-[#e42c24] border border-[#171820] animate-pulse" />
            <span className="font-mono text-xs font-bold tracking-wider">{current.name}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={prev}
              className="grid h-7 w-7 place-items-center border-2 border-[#171820] bg-[#f6d52b] text-black shadow-[2px_2px_0_#171820] hover:translate-x-0.5 hover:translate-y-0.5 active:shadow-none"
              title="Previous PFP"
              aria-label="Previous PFP"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={next}
              className="grid h-7 w-7 place-items-center border-2 border-[#171820] bg-[#c2ed55] text-black shadow-[2px_2px_0_#171820] hover:translate-x-0.5 hover:translate-y-0.5 active:shadow-none"
              title="Next PFP"
              aria-label="Next PFP"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>

        {/* Central Card Display with Swappable & Viewable Layers */}
        <div className="relative mt-3 h-[280px] sm:h-[320px] w-full overflow-hidden border-2 border-[#171820] bg-[#b2df43] flex items-center justify-center">
          {/* Subtle Background Ghost Cards for Depth */}
          <div
            onClick={prev}
            className="absolute left-[-20%] scale-75 opacity-40 blur-[0.5px] cursor-pointer transition-transform hover:scale-80 hover:opacity-70 z-0"
          >
            <Image
              src={prevChar.src}
              alt="Previous Buzquito"
              width={260}
              height={260}
              className="object-contain"
            />
          </div>

          <div
            onClick={next}
            className="absolute right-[-20%] scale-75 opacity-40 blur-[0.5px] cursor-pointer transition-transform hover:scale-80 hover:opacity-70 z-0"
          >
            <Image
              src={nextChar.src}
              alt="Next Buzquito"
              width={260}
              height={260}
              className="object-contain"
            />
          </div>

          {/* Active Featured Image with AnimatePresence */}
          <AnimatePresence mode="wait">
            <motion.div
              key={current.id}
              initial={{ opacity: 0, scale: 0.88, rotate: -2 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              exit={{ opacity: 0, scale: 0.9, rotate: 2 }}
              transition={{ duration: 0.22 }}
              className="relative z-10 h-full w-full flex items-center justify-center cursor-pointer group"
              onClick={() => setModalOpen(true)}
            >
              <Image
                src={current.src}
                alt={current.name}
                width={360}
                height={360}
                priority
                className="max-h-[92%] w-auto object-contain drop-shadow-[5px_7px_0_rgba(23,24,32,.25)] transition-transform group-hover:scale-105"
              />

              {/* View Overlay Hint */}
              <div className="absolute bottom-2.5 right-2.5 flex items-center gap-1.5 border-2 border-[#171820] bg-[#171820] px-2 py-1 text-[10px] font-mono text-[#c2ed55] shadow-[2px_2px_0_#fff] group-hover:bg-[#e42c24] group-hover:text-white transition-colors">
                <Maximize2 size={11} />
                <span>CLICK TO VIEW</span>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Top-Right Badge */}
          <div className="absolute right-2 top-2 z-20 border-2 border-[#171820] bg-[#f6d52b] px-2 py-1 font-mono text-[9px] font-bold shadow-[2px_2px_0_#171820]">
            5,555 PFPS
          </div>
        </div>

        {/* Thumbnail Selector Strip (Click to swap any of the characters) */}
        <div className="mt-3 flex items-center justify-between gap-1.5 overflow-x-auto pb-1 pt-1">
          {CHARACTERS.map((char, idx) => (
            <button
              key={char.id}
              onClick={() => setCurrentIndex(idx)}
              className={`relative h-11 w-11 sm:h-12 sm:w-12 shrink-0 overflow-hidden border-2 transition-all ${
                currentIndex === idx
                  ? 'border-[#171820] bg-[#c2ed55] scale-105 shadow-[2px_2px_0_#171820]'
                  : 'border-[#171820]/40 bg-white/70 opacity-60 hover:opacity-100 hover:border-[#171820]'
              }`}
              title={`Swap to ${char.name}`}
            >
              <Image
                src={char.src}
                alt={char.name}
                width={60}
                height={60}
                className="h-full w-full object-cover"
              />
              {currentIndex === idx && (
                <div className="absolute inset-0 border-2 border-[#171820] pointer-events-none" />
              )}
            </button>
          ))}
        </div>

        {/* Bottom Status Bar */}
        <div className="mt-3 flex items-center justify-between border-2 border-[#171820] bg-[#171820] px-3 py-2 text-white">
          <span className="font-mono text-[10px] sm:text-[11px] text-[#c2ed55] font-bold tracking-wider">
            SWAPABLE &amp; VIEWABLE
          </span>
          <span className="font-mono text-[10px] sm:text-xs text-white/70">
            [ 5,555 PFPS ]
          </span>
        </div>
      </div>

      {/* Lightbox Modal (Viewable Fullscreen View) */}
      <AnimatePresence>
        {modalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm"
            onClick={() => setModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative max-w-lg w-full border-4 border-[#171820] bg-[#f7f7ed] p-5 shadow-[8px_8px_0_#c2ed55]"
              onClick={e => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between border-b-2 border-[#171820] pb-3">
                <div>
                  <h3 className="text-xl font-black">Buzquito</h3>
                </div>
                <button
                  onClick={() => setModalOpen(false)}
                  className="grid h-9 w-9 place-items-center border-2 border-[#171820] bg-[#f6d52b] text-black shadow-[2px_2px_0_#171820] hover:translate-x-0.5 hover:translate-y-0.5"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Modal Image Display */}
              <div className="relative my-4 flex h-[320px] sm:h-[380px] w-full items-center justify-center border-2 border-[#171820] bg-[#b2df43]">
                <Image
                  src={current.src}
                  alt={current.name}
                  width={420}
                  height={420}
                  className="max-h-[92%] w-auto object-contain drop-shadow-[8px_10px_0_rgba(23,24,32,.3)]"
                />
              </div>

              {/* Modal Controls */}
              <div className="flex items-center justify-between pt-2">
                <button
                  onClick={prev}
                  className="pixel-btn light !py-2.5 !px-4 text-xs font-bold"
                >
                  ← PREV PFP
                </button>
                <div className="font-mono text-xs font-bold text-[#394127]">
                  {current.id} / {CHARACTERS.length}
                </div>
                <button
                  onClick={next}
                  className="pixel-btn !py-2.5 !px-4 text-xs font-bold"
                >
                  NEXT PFP →
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

