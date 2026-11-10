'use client';

import { useState } from 'react';
import Link from 'next/link';
import { RotateCcw, Home, Sparkles, CheckCircle2 } from 'lucide-react';
import PixelLoader from '@/components/PixelLoader';

export default function LoaderPreviewPage() {
  const [key, setKey] = useState(0);
  const [isDone, setIsDone] = useState(false);

  const restartLoader = () => {
    setIsDone(false);
    setKey(prev => prev + 1);
  };

  return (
    <div className="min-h-screen bg-[#bfe752] flex flex-col justify-between p-4 sm:p-8 font-sans">
      {/* Active Loader Instance */}
      <PixelLoader
        key={key}
        forceShow={true}
        onComplete={() => {
          setIsDone(true);
        }}
      />

      {/* Control Overlay for when loader finishes */}
      {isDone && (
        <div className="fixed inset-0 z-40 flex flex-col items-center justify-center bg-[#bfe752] p-6 text-center animate-fadeIn">
          <div className="relative max-w-md w-full border-4 border-[#171820] bg-[#f7f7ed] p-6 sm:p-8 shadow-[8px_8px_0_#171820]">
            <div className="inline-flex items-center gap-2 border-2 border-[#171820] bg-[#c2ed55] px-3 py-1 font-mono text-xs font-bold shadow-[2px_2px_0_#171820] mb-4">
              <CheckCircle2 size={16} className="text-[#171820]" />
              LOADING SEQUENCE COMPLETE
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-[#171820] tracking-tight mb-2">
              Buzquitos Pixel Loader
            </h1>

            <p className="text-sm font-medium text-[#394127] mb-6">
              The pixel head rotation, 5–7s randomized progress bar, and completion transitions have finished successfully.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                onClick={restartLoader}
                className="pixel-btn w-full sm:w-auto !py-3 !px-5 text-sm flex items-center justify-center gap-2 cursor-pointer"
              >
                <RotateCcw size={16} /> REPLAY ANIMATION
              </button>

              <Link
                href="/"
                className="pixel-btn light w-full sm:w-auto !py-3 !px-5 text-sm flex items-center justify-center gap-2"
              >
                <Home size={16} /> GO TO HOMEPAGE
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

