import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import { Sparkles, Wind, Flame } from 'lucide-react';

// Gentle acoustic synthesizer for blowing out candle & chime
function playBlowOutSound() {
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();

    // 1. Gentle breath puff (noise buffer with bandpass filter)
    const bufferSize = ctx.sampleRate * 0.4;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.12));
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(600, ctx.currentTime);
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    noise.start();

    // 2. Sweet celebratory chime chords (E6, G#6, B6, E7)
    const notes = [1318.51, 1661.22, 1975.53, 2637.02];
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const noteGain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + 0.15 + idx * 0.08);
      noteGain.gain.setValueAtTime(0.04, ctx.currentTime + 0.15 + idx * 0.08);
      noteGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.9 + idx * 0.1);
      osc.connect(noteGain);
      noteGain.connect(ctx.destination);
      osc.start(ctx.currentTime + 0.15 + idx * 0.08);
      osc.stop(ctx.currentTime + 1.2);
    });
  } catch {
    // Silently continue if audio context is blocked
  }
}

export const InteractiveCandle: React.FC = () => {
  const [isBlownOut, setIsBlownOut] = useState(false);
  const [wishMade, setWishMade] = useState(false);

  const handleBlowOut = () => {
    if (isBlownOut) return;
    setIsBlownOut(true);
    setWishMade(true);
    playBlowOutSound();

    // Pastel celebratory confetti burst
    const colors = ['#F472B6', '#FBCFE8', '#FDE047', '#C084FC', '#FFFFFF', '#FDA4AF'];

    // Center burst
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.65 },
      colors,
      shapes: ['circle', 'square'],
      scalar: 1.1,
    });

    // Side cannons for full screen fairy-dust celebration
    setTimeout(() => {
      confetti({
        particleCount: 50,
        angle: 60,
        spread: 55,
        origin: { x: 0.1, y: 0.7 },
        colors,
      });
      confetti({
        particleCount: 50,
        angle: 120,
        spread: 55,
        origin: { x: 0.9, y: 0.7 },
        colors,
      });
    }, 200);
  };

  const handleRelight = () => {
    setIsBlownOut(false);
    setWishMade(false);
  };

  return (
    <div className="w-full flex flex-col items-center justify-center my-4 select-none">
      <div
        onClick={handleBlowOut}
        className={`relative flex flex-col items-center cursor-pointer group py-2 px-6 rounded-2xl transition-all duration-300 ${
          !isBlownOut ? 'hover:scale-105 active:scale-95' : ''
        }`}
        title={!isBlownOut ? "Click to make a wish & blow out the candle!" : "Candle blown out"}
      >
        {/* Warm Ambient Flame Glow Halo */}
        {!isBlownOut && (
          <motion.div
            animate={{
              scale: [1, 1.12, 0.96, 1.08, 1],
              opacity: [0.35, 0.55, 0.38, 0.5, 0.35],
            }}
            transition={{
              repeat: Infinity,
              duration: 2.4,
              ease: 'easeInOut',
            }}
            className="absolute -top-6 w-24 h-24 rounded-full bg-gradient-to-t from-amber-300/40 via-pink-400/25 to-transparent blur-xl pointer-events-none"
          />
        )}

        {/* The Candle Flame / Smoke */}
        <div className="relative h-12 w-8 flex items-center justify-center">
          <AnimatePresence mode="wait">
            {!isBlownOut ? (
              /* Flickering Living Flame */
              <motion.div
                key="flame"
                initial={{ scale: 0, opacity: 0 }}
                animate={{
                  scale: [1, 1.06, 0.95, 1.04, 1],
                  skewX: [-1, 2, -1.5, 1, -1],
                  opacity: 1,
                }}
                exit={{ scale: 0.2, opacity: 0, y: -10, transition: { duration: 0.25 } }}
                transition={{
                  repeat: Infinity,
                  duration: 1.8,
                  ease: 'easeInOut',
                }}
                className="relative flex flex-col items-center"
              >
                {/* Outer Tear-Drop Flame */}
                <div
                  className="w-4 h-7 rounded-full shadow-lg"
                  style={{
                    borderRadius: '50% 50% 35% 35% / 80% 80% 30% 30%',
                    background: 'radial-gradient(ellipse at bottom, #FFFFFF 0%, #FEF08A 25%, #FB923C 60%, #EA580C 100%)',
                    boxShadow: '0 0 15px rgba(251, 146, 60, 0.8), 0 0 25px rgba(244, 114, 182, 0.4)',
                  }}
                />
                {/* Inner Bright White Core */}
                <div
                  className="absolute bottom-1 w-2 h-3.5 rounded-full bg-white opacity-90"
                  style={{ borderRadius: '50% 50% 35% 35% / 80% 80% 30% 30%' }}
                />
              </motion.div>
            ) : (
              /* Delicate Smoke Wisp on Blowout */
              <motion.div
                key="smoke"
                initial={{ opacity: 0.9, y: 0, scale: 0.7 }}
                animate={{
                  opacity: [0.9, 0.6, 0],
                  y: -28,
                  x: [0, 4, -3, 6],
                  scale: [0.7, 1.2, 1.8],
                }}
                transition={{ duration: 1.6, ease: 'easeOut' }}
                className="w-2.5 h-6 rounded-full bg-zinc-400/40 blur-xs"
              />
            )}
          </AnimatePresence>
        </div>

        {/* Black Candle Wick */}
        <div className="w-[2px] h-2 bg-zinc-800 rounded-t-sm -mt-0.5" />

        {/* Pastel Striped Birthday Candle Body */}
        <div
          className="w-5 h-16 rounded-t-sm rounded-b-xs relative overflow-hidden shadow-md"
          style={{
            background: 'linear-gradient(135deg, #FCE7F3 0%, #F472B6 30%, #FCE7F3 60%, #F472B6 100%)',
            boxShadow: 'inset -2px 0 3px rgba(0,0,0,0.1), inset 2px 0 3px rgba(255,255,255,0.8), 0 4px 6px rgba(0,0,0,0.06)',
          }}
        >
          {/* Subtle diagonal wax glaze stripe reflections */}
          <div
            className="w-full h-full opacity-35 pointer-events-none"
            style={{
              backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 4px, rgba(255,255,255,0.7) 4px, rgba(255,255,255,0.7) 8px)',
            }}
          />
        </div>

        {/* Elegant Ceramic Base Saucer */}
        <div className="w-14 h-2 rounded-full bg-gradient-to-r from-amber-100 via-rose-100 to-amber-200 border border-amber-200/80 shadow-xs -mt-0.5" />

        {/* Action Prompt or Wish Feedback */}
        <div className="mt-3 text-center">
          {!isBlownOut ? (
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/90 backdrop-blur-md border border-pink-200/90 shadow-xs text-xs font-mono text-zinc-700 group-hover:border-pink-400 group-hover:text-pink-700 transition-all">
              <Wind className="w-3.5 h-3.5 text-pink-500 animate-pulse" />
              <span>Tap to blow out candle & make a wish</span>
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center gap-1"
            >
              <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-gradient-to-r from-pink-100 via-rose-50 to-amber-100 border border-pink-300 text-xs font-mono font-semibold text-pink-800 shadow-sm">
                <Sparkles className="w-3.5 h-3.5 text-pink-600" />
                <span>Wish Made! May all your dreams come true ✨</span>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleRelight();
                }}
                className="mt-1.5 text-[11px] font-mono text-zinc-500 hover:text-pink-600 underline cursor-pointer flex items-center gap-1 transition-colors"
              >
                <Flame className="w-3 h-3 text-amber-500" />
                <span>Light candle again</span>
              </button>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};
