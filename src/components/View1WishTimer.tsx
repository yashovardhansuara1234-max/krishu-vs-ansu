import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { LostAndFoundCard } from './LostAndFoundCard.tsx';
import { InteractiveRabbit } from './InteractiveRabbit.tsx';
import { APP_CONFIG } from '../config.ts';
import { calculateTimeDifference, formatTimeDisplay } from '../utils/timer.ts';

interface View1Props {
  onNext: () => void;
}

export const View1WishTimer: React.FC<View1Props> = ({ onNext }) => {
  const [timeState, setTimeState] = useState(() =>
    calculateTimeDifference(APP_CONFIG.birthdayDate)
  );

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeState(calculateTimeDifference(APP_CONFIG.birthdayDate));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatted = formatTimeDisplay(timeState);

  return (
    <div className="relative w-full h-[100dvh] max-h-[100dvh] flex flex-col justify-between items-center px-6 py-6 md:py-8 overflow-hidden select-none pastel-mesh-animated">
      {/* Top Quiet Minimalist Header */}
      <div className="relative z-10 w-full max-w-4xl flex justify-between items-center text-xs tracking-widest text-zinc-700 font-mono font-semibold pt-1">
        <span>OCTOBER 20</span>
        <span className="hidden sm:inline">PROJECT KRISHU · V2</span>
        <span>EDITION 01</span>
      </div>

      {/* Center Stage: Timer, Wish Heading & Birthday Message Block */}
      <div className="relative z-10 my-auto text-center flex flex-col items-center max-w-2xl px-2">
        {/* Timer Label */}
        <p className="text-xs uppercase tracking-[0.25em] text-zinc-800 font-bold mb-3">
          {timeState.isPast ? "Counting the moments since" : "Countdown to Krishu's Day"}
        </p>

        {/* The Minimalist Timer: DD : HH : MM : SS */}
        <div className="font-semibold tracking-widest text-4xl sm:text-5xl md:text-7xl text-[#18181B] flex items-center justify-center gap-2 sm:gap-4 md:gap-6 tabular-nums">
          <div className="flex flex-col items-center">
            <span className="font-bold text-[#18181B]">{formatted.days}</span>
            <span className="text-[10px] md:text-xs tracking-widest text-zinc-700 font-mono mt-1 uppercase font-semibold">
              DAYS
            </span>
          </div>
          <span className="text-zinc-600 pb-4 font-bold">:</span>
          <div className="flex flex-col items-center">
            <span className="font-bold text-[#18181B]">{formatted.hours}</span>
            <span className="text-[10px] md:text-xs tracking-widest text-zinc-700 font-mono mt-1 uppercase font-semibold">
              HOURS
            </span>
          </div>
          <span className="text-zinc-600 pb-4 font-bold">:</span>
          <div className="flex flex-col items-center">
            <span className="font-bold text-[#18181B]">{formatted.minutes}</span>
            <span className="text-[10px] md:text-xs tracking-widest text-zinc-700 font-mono mt-1 uppercase font-semibold">
              MINS
            </span>
          </div>
          <span className="text-zinc-600 pb-4 font-bold">:</span>
          <div className="flex flex-col items-center">
            <span className="font-bold text-[#18181B]">{formatted.seconds}</span>
            <span className="text-[10px] md:text-xs tracking-widest text-zinc-700 font-mono mt-1 uppercase font-semibold">
              SECS
            </span>
          </div>
        </div>

        {/* Main Wish Heading: "happy birthday, krishu" with handwritten cursive */}
        <div className="mt-8 sm:mt-10 flex flex-col items-center">
          <h1 className="font-serif-editorial text-2xl sm:text-3xl md:text-4xl text-[#18181B] font-normal tracking-tight text-balance flex items-baseline justify-center gap-2">
            <span>happy birthday,</span>
            <span className="font-cursive-krishu text-3xl sm:text-4xl md:text-5xl text-pink-700 font-bold lowercase">
              {APP_CONFIG.nickname}
            </span>
          </h1>

          {/* Editorial-style Birthday Message Block (Max-width 420px, 85vw mobile, #4A4453 at 80%, 15px, line-height 1.8, delay 0.4s) */}
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="mt-4 text-center mx-auto text-[#4A4453]/80 text-[15px] leading-[1.8] tracking-[0.01em] max-w-[420px] w-[85vw]"
          >
            {APP_CONFIG.heroBirthdayMessage}
          </motion.p>

          {/* Pill-shaped button: "Next Track →" with plenty of breathing room (margin-top: 2.5rem / mt-10) */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="mt-10 flex justify-center"
          >
            <button
              onClick={onNext}
              aria-label="Next Track"
              className="group flex items-center gap-2 px-8 py-3 rounded-full bg-white/75 backdrop-blur-md border border-zinc-200/80 shadow-xs hover:bg-white hover:border-pink-300 hover:shadow-md transition-all duration-300 cursor-pointer active:scale-98"
            >
              <span className="text-sm font-medium text-zinc-800 tracking-wide">
                Next Track
              </span>
              <span className="transition-transform duration-300 group-hover:translate-x-1 font-sans text-pink-600">
                →
              </span>
            </button>
          </motion.div>
        </div>
      </div>

      {/* Bottom-Left Corner: Trending "Lost & Found" ID Card */}
      <LostAndFoundCard />

      {/* Corner Accent: Interactive Animated Pastel Rabbit (Spring jump, floating hearts, speech bubble) */}
      <InteractiveRabbit />

      {/* Bottom Quiet Spacing */}
      <div className="relative z-10 pb-1 text-center text-[10px] font-mono tracking-widest text-zinc-400 pointer-events-none">
        <span>PROJECT KRISHU · 2026</span>
      </div>
    </div>
  );
};
