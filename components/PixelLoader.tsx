'use client';

import { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';

export interface PixelLoaderProps {
  onComplete?: () => void;
  forceShow?: boolean;
  minDuration?: number; // default 5000ms
  maxDuration?: number; // default 7000ms
}

const STATUS_MESSAGES = [
  { threshold: 0, text: 'INITIALIZING...' },
  { threshold: 22, text: 'LOADING ASSETS...' },
  { threshold: 48, text: 'GENERATING PIXELS...' },
  { threshold: 74, text: 'ALMOST THERE...' },
  { threshold: 94, text: 'FINALIZING...' }
];

// Deterministic floating pixel particle positions
const PARTICLES = [
  { id: 1, top: '12%', left: '8%', size: 10, delay: 0, color: '#171820', opacity: 0.18 },
  { id: 2, top: '22%', left: '88%', size: 14, delay: 0.8, color: '#ffffff', opacity: 0.28 },
  { id: 3, top: '35%', left: '14%', size: 8, delay: 1.4, color: '#f6d52b', opacity: 0.35 },
  { id: 4, top: '48%', left: '92%', size: 12, delay: 0.4, color: '#171820', opacity: 0.15 },
  { id: 5, top: '68%', left: '10%', size: 14, delay: 1.1, color: '#ffffff', opacity: 0.25 },
  { id: 6, top: '78%', left: '84%', size: 8, delay: 1.9, color: '#171820', opacity: 0.2 },
  { id: 7, top: '18%', left: '76%', size: 6, delay: 0.6, color: '#f6d52b', opacity: 0.4 },
  { id: 8, top: '82%', left: '22%', size: 10, delay: 1.3, color: '#ffffff', opacity: 0.22 },
  { id: 9, top: '60%', left: '88%', size: 6, delay: 2.1, color: '#171820', opacity: 0.18 },
  { id: 10, top: '15%', left: '28%', size: 8, delay: 0.3, color: '#171820', opacity: 0.15 },
  { id: 11, top: '74%', left: '72%', size: 12, delay: 1.7, color: '#f6d52b', opacity: 0.32 },
  { id: 12, top: '30%', left: '82%', size: 6, delay: 2.4, color: '#ffffff', opacity: 0.3 }
];

export default function PixelLoader({
  onComplete,
  minDuration = 5000,
  maxDuration = 7000
}: PixelLoaderProps) {
  const [progress, setProgress] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  // Random duration between minDuration and maxDuration (5–7 seconds)
  const duration = useMemo(() => {
    return minDuration + Math.random() * (maxDuration - minDuration);
  }, [minDuration, maxDuration]);

  // Progress animation with smooth curve and faster finish
  useEffect(() => {
    let animId: number;
    const startTime = performance.now();

    const tick = (now: number) => {
      const elapsed = now - startTime;
      const raw = Math.min(1, elapsed / duration);

      // Smooth pacing with slightly accelerated finish toward 100%
      let eased: number;
      if (raw < 0.7) {
        eased = 0.65 * (raw / 0.7);
      } else {
        const t = (raw - 0.7) / 0.3;
        eased = 0.65 + 0.35 * Math.sin((t * Math.PI) / 2);
      }

      const currentProgress = Math.min(100, Math.round(eased * 100));
      setProgress(currentProgress);

      if (raw < 1) {
        animId = requestAnimationFrame(tick);
      } else {
        setProgress(100);
        setIsComplete(true);

        // 500ms pause when reaching 100% before triggering completion
        const timer = setTimeout(() => {
          setIsExiting(true);
          const exitTimer = setTimeout(() => {
            onComplete?.();
          }, 450); // Matches exit fade duration
          return () => clearTimeout(exitTimer);
        }, 500);

        return () => clearTimeout(timer);
      }
    };

    animId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animId);
  }, [duration, onComplete]);

  // Determine current status message
  const currentStatus = useMemo(() => {
    if (isComplete) return '100% — COMPLETE';
    for (let i = STATUS_MESSAGES.length - 1; i >= 0; i--) {
      if (progress >= STATUS_MESSAGES[i].threshold) {
        return STATUS_MESSAGES[i].text;
      }
    }
    return 'INITIALIZING...';
  }, [progress, isComplete]);

  return (
    <AnimatePresence>
      {!isExiting && (
        <motion.div
          key="pixel-loader-container"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 0.99 }}
          transition={{ duration: 0.45, ease: 'easeInOut' }}
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-between select-none overflow-hidden"
          style={{ backgroundColor: '#bfe752' }} // Exact lime-green from uploaded reference
        >
          {/* Subtle Pixel Grid Overlay */}
          <div
            className="absolute inset-0 pointer-events-none opacity-40"
            style={{
              backgroundImage:
                'linear-gradient(rgba(23, 24, 32, 0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(23, 24, 32, 0.05) 1px, transparent 1px)',
              backgroundSize: '24px 24px'
            }}
          />

          {/* Floating Pixel Particles / Squares */}
          {PARTICLES.map(p => (
            <motion.div
              key={p.id}
              className="absolute pointer-events-none"
              style={{
                top: p.top,
                left: p.left,
                width: p.size,
                height: p.size,
                backgroundColor: p.color,
                opacity: p.opacity
              }}
              animate={{
                y: [-8, 8, -8],
                x: [-3, 3, -3],
                opacity: [p.opacity * 0.7, p.opacity * 1.3, p.opacity * 0.7]
              }}
              transition={{
                duration: 3 + p.delay,
                repeat: Infinity,
                ease: 'easeInOut',
                delay: p.delay
              }}
            />
          ))}

          {/* Top Bar (Minimalist pixel identity) */}
          <header className="relative z-10 w-full px-5 py-4 sm:px-8 sm:py-6 flex items-center justify-between">
            <div className="flex items-center gap-2 border-2 border-[#171820] bg-[#f7f7ed] px-2.5 py-1 shadow-[2px_2px_0_#171820]">
              <span className="h-2 w-2 bg-[#e42c24] animate-pulse" />
              <span className="font-mono text-[10px] sm:text-xs font-bold tracking-widest text-[#171820]">
                BUZQUITOS // BOOT
              </span>
            </div>

            <div className="font-mono text-[9px] sm:text-[11px] font-bold tracking-wider text-[#394127] border-b border-[#171820]/30 pb-0.5">
              ROBINHOOD NETWORK
            </div>
          </header>

          {/* Center Stage: Character & Progress Bar */}
          <main className="relative z-10 flex flex-col items-center justify-center my-auto px-4 max-w-md w-full">
            {/* Character Head Animation Container */}
            <div className="relative flex items-center justify-center">
              {/* Star Sparkles Pop on Completion */}
              <AnimatePresence>
                {isComplete && (
                  <>
                    <motion.div
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: [0, 1.3, 1], opacity: [0, 1, 0.9] }}
                      transition={{ duration: 0.35, ease: 'easeOut' }}
                      className="absolute -top-4 -left-4 z-30 font-mono text-xl text-[#171820] select-none"
                    >
                      ✦
                    </motion.div>
                    <motion.div
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: [0, 1.4, 1], opacity: [0, 1, 0.9] }}
                      transition={{ duration: 0.4, delay: 0.08, ease: 'easeOut' }}
                      className="absolute -top-3 -right-3 z-30 font-mono text-xl text-[#f6d52b] select-none drop-shadow-[1px_1px_0_#171820]"
                    >
                      ★
                    </motion.div>
                    <motion.div
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: [0, 1.2, 1], opacity: [0, 1, 0.9] }}
                      transition={{ duration: 0.35, delay: 0.12, ease: 'easeOut' }}
                      className="absolute -bottom-2 -left-3 z-30 font-mono text-lg text-[#e42c24] select-none"
                    >
                      ✦
                    </motion.div>
                    <motion.div
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: [0, 1.3, 1], opacity: [0, 1, 0.9] }}
                      transition={{ duration: 0.4, delay: 0.16, ease: 'easeOut' }}
                      className="absolute -bottom-2 -right-4 z-30 font-mono text-xl text-[#171820] select-none"
                    >
                      ★
                    </motion.div>
                  </>
                )}
              </AnimatePresence>

              {/* Character Head with Smooth Continuous 360-Degree Rotation & Floating Bounce */}
              <motion.div
                animate={
                  isComplete
                    ? {
                        rotate: 360,
                        y: 0,
                        scale: [1, 1.14, 1],
                        transition: {
                          rotate: { duration: 0.35, ease: 'easeOut' },
                          scale: { duration: 0.35, ease: 'easeInOut' }
                        }
                      }
                    : {
                        rotate: [0, 90, 180, 270, 360],
                        y: [-7, 7, -7],
                        transition: {
                          rotate: {
                            duration: 3.2,
                            repeat: Infinity,
                            ease: 'easeInOut' // Playful, fluid continuous easing
                          },
                          y: {
                            duration: 1.8,
                            repeat: Infinity,
                            ease: 'easeInOut' // Gentle floating bounce
                          }
                        }
                      }
                }
                className="relative z-20 flex items-center justify-center select-none"
              >
                <Image
                  src="/loader-head-transparent.png"
                  alt="Buzquito Pixel Head"
                  width={240}
                  height={240}
                  priority
                  className="w-40 h-40 sm:w-52 sm:h-52 md:w-60 md:h-60 object-contain [image-rendering:pixelated]"
                  style={{ imageRendering: 'pixelated' }}
                />
              </motion.div>

              {/* Subtle Ground Shadow for Character Depth */}
              <motion.div
                animate={
                  isComplete
                    ? { scale: 1, opacity: 0.25 }
                    : {
                        scale: [1, 0.85, 1],
                        opacity: [0.25, 0.15, 0.25],
                        transition: {
                          duration: 1.8,
                          repeat: Infinity,
                          ease: 'easeInOut'
                        }
                      }
                }
                className="absolute -bottom-4 h-3 w-28 sm:w-36 rounded-full bg-[#171820] blur-[1px] -z-10"
              />
            </div>

            {/* Loading Progress Box */}
            <div className="mt-8 sm:mt-10 w-full max-w-[320px] sm:max-w-[360px]">
              {/* Header Info Above Progress Bar: Status Text + Numeric Percentage */}
              <div className="flex items-baseline justify-between mb-2 px-0.5">
                {/* Rotating Status Text */}
                <span className="font-mono text-xs sm:text-sm font-bold tracking-widest text-[#171820] transition-all">
                  {currentStatus}
                </span>

                {/* Real-time Smooth Numerical Percentage */}
                <span className="font-mono text-base sm:text-lg font-black tracking-wider text-[#171820]">
                  {progress}%
                </span>
              </div>

              {/* Modern Pixel-Style Progress Bar Frame */}
              <div className="relative border-4 border-[#171820] bg-[#f7f7ed] p-1 shadow-[4px_4px_0_#171820]">
                {/* Track */}
                <div className="relative h-5 sm:h-6 w-full overflow-hidden bg-[#e5e5d3]">
                  {/* Subtle Pixel Tick Marks Every 20% */}
                  <div className="absolute inset-0 z-10 flex justify-between pointer-events-none px-1">
                    <span className="h-full w-[2px] bg-[#171820]/15" />
                    <span className="h-full w-[2px] bg-[#171820]/15" />
                    <span className="h-full w-[2px] bg-[#171820]/15" />
                    <span className="h-full w-[2px] bg-[#171820]/15" />
                  </div>

                  {/* Dynamic Progress Fill Bar */}
                  <div
                    className="h-full bg-[#171820] relative transition-[width] duration-75 ease-linear flex items-center justify-end"
                    style={{ width: `${progress}%` }}
                  >
                    {/* Active Leading Edge Marker (Yellow pixel tip while loading) */}
                    {progress > 0 && progress < 100 && (
                      <div className="h-full w-2 sm:w-2.5 bg-[#f6d52b] border-l-2 border-[#171820]" />
                    )}

                    {/* Completion Glow / Flash */}
                    {isComplete && (
                      <div className="absolute inset-0 bg-[#e42c24] animate-pulse" />
                    )}
                  </div>
                </div>
              </div>

              {/* Bottom Micro Status */}
              <div className="mt-2.5 flex items-center justify-between font-mono text-[9px] sm:text-[10px] text-[#394127] font-semibold tracking-wider">
                <span>[ PIXEL ENGINE V1 ]</span>
                <span className="text-[#171820] font-bold">
                  {isComplete ? 'READY' : 'SYNCING...'}
                </span>
              </div>
            </div>
          </main>

          {/* Minimalist Footer */}
          <footer className="relative z-10 w-full px-5 py-4 sm:px-8 sm:py-6 flex items-center justify-center">
            <div className="font-mono text-[10px] sm:text-xs font-bold tracking-widest text-[#394127]/80 uppercase">
              BUZQUITOS // CHARACTER PFP DROP
            </div>
          </footer>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
