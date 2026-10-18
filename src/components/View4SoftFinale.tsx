import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Volume2, VolumeX, RotateCcw } from 'lucide-react';
import { HerCuteVisual, RabbitIcon } from './VisualAssets.tsx';
import { InteractiveCandle } from './InteractiveCandle.tsx';
import { APP_CONFIG } from '../config.ts';
import { soundManager } from '../utils/audioPlayer.ts';

interface View4Props {
  onRestart: () => void;
  onBack: () => void;
}

export const View4SoftFinale: React.FC<View4Props> = ({ onRestart, onBack }) => {
  const [isMuted, setIsMuted] = useState(soundManager.isMuted);

  // Audio Rule: Immediately crossfade / play "We Fell in Love in October" at volume = 0.20
  useEffect(() => {
    soundManager.playFinale(APP_CONFIG.finaleSongUrl);

    const unsubscribe = soundManager.subscribe(() => {
      setIsMuted(soundManager.isMuted);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const toggleMute = () => {
    soundManager.toggleMute();
    setIsMuted(!isMuted);
  };

  // 12 sparse, slow-drifting autumn petal particles
  const petals = Array.from({ length: 12 }, (_, i) => ({
    id: i,
    left: `${(i * 8.5 + 4) % 94}%`,
    delay: `${(i * 1.3) % 10}s`,
    duration: `${14 + (i % 6) * 2}s`,
    size: 14 + (i % 4) * 4,
  }));

  return (
    <div className="relative min-h-screen w-full flex flex-col justify-between items-center py-12 px-6 overflow-hidden select-none pastel-mesh-animated">

      {/* Sparse, gentle drifting autumn petals */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden -z-5">
        {petals.map((p) => (
          <div
            key={p.id}
            className="drifting-petal"
            style={{
              left: p.left,
              animationDelay: p.delay,
              animationDuration: p.duration,
              fontSize: `${p.size}px`,
            }}
          >
            {p.id % 2 === 0 ? '🌸' : '🍂'}
          </div>
        ))}
      </div>

      {/* Top Controls: Audio Status (volume = 20%) & Navigation */}
      <div className="relative z-20 w-full max-w-4xl flex items-center justify-between gap-2">
        <button
          onClick={onBack}
          aria-label="Back to 10 cards"
          className="px-3 py-1.5 rounded-full bg-white/80 backdrop-blur-md border border-zinc-200/80 text-xs font-mono text-zinc-700 hover:text-zinc-950 transition-colors cursor-pointer shrink-0"
        >
          ← Playlists
        </button>

        {/* Ambient Soundtrack Indicator */}
        <div className="flex items-center gap-2 bg-white/85 backdrop-blur-md px-3 py-1.5 rounded-full border border-pink-200/80 shadow-xs shrink-0">
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-pink-500 animate-pulse shrink-0" />
            <span className="text-[11px] font-mono text-zinc-800 tracking-tight">
              october · 20%
            </span>
          </div>
          <button
            onClick={toggleMute}
            aria-label={isMuted ? "Unmute finale track" : "Mute finale track"}
            className="p-0.5 hover:text-pink-600 transition-colors cursor-pointer text-zinc-700"
          >
            {isMuted ? (
              <VolumeX className="w-4 h-4 stroke-[1.75]" />
            ) : (
              <Volume2 className="w-4 h-4 stroke-[1.75]" />
            )}
          </button>
        </div>

        <button
          onClick={onRestart}
          aria-label="Restart surprise"
          title="Restart from beginning"
          className="px-3 py-1.5 rounded-full bg-white/80 backdrop-blur-md border border-zinc-200/80 text-xs font-mono text-zinc-700 hover:text-zinc-950 flex items-center gap-1 transition-colors cursor-pointer shrink-0"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Restart</span>
        </button>
      </div>

      {/* Centerpiece: Clean Typography + Circular Portrait + Heartfelt Letter */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
        className="my-auto max-w-xl text-center px-4 flex flex-col items-center py-6"
      >
        {/* Eyebrow text */}
        <p className="text-[11px] font-mono tracking-[0.3em] uppercase text-zinc-600 font-semibold mb-2">
          THE VERDICT IS IN
        </p>

        {/* Hero headline with deep charcoal contrast */}
        <h1 className="font-serif-editorial text-2xl sm:text-3xl md:text-4xl text-[#18181B] font-medium tracking-tight text-balance drop-shadow-xs">
          The Birthday Girl Wins. Always.
        </h1>

        {/* Subtle Playful Score Pill */}
        <div className="mt-4 inline-flex items-center gap-2 px-5 py-1.5 rounded-full bg-white/90 backdrop-blur-md border border-pink-200 shadow-xs text-xs font-mono text-zinc-800">
          <span className="font-bold text-pink-600">Krishu: ∞</span>
          <span className="text-zinc-300">·</span>
          <span className="text-zinc-500 font-medium">Him: 0</span>
        </div>

        {/* Centerpiece Circular Portrait of Krishu with soft halo */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 1, delay: 0.3 }}
          className="mt-8 mb-6 relative"
        >
          <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-full overflow-hidden p-1 bg-gradient-to-tr from-pink-300 via-rose-200 to-purple-200 shadow-md shadow-pink-900/10">
            <div className="w-full h-full rounded-full overflow-hidden bg-white">
              <HerCuteVisual src={APP_CONFIG.vsPhotos.herCute} showLabels={false} />
            </div>
          </div>
          {/* Subtle line-art rabbit resting in corner */}
          <div className="absolute -bottom-1 -right-1 bg-white p-1.5 rounded-full shadow-sm border border-pink-100 text-pink-500">
            <RabbitIcon className="w-3.5 h-3.5" />
          </div>
        </motion.div>

        {/* Interactive Birthday Candle Component */}
        <InteractiveCandle />

        {/* Heartfelt Personal Letter from Badmash with generous breathing space */}
        <div className="w-full bg-white/60 backdrop-blur-md border border-pink-100/80 rounded-2xl p-6 sm:p-8 text-left shadow-sm">
          <p className="font-serif-editorial text-sm sm:text-base text-zinc-800 font-semibold mb-3">
            {APP_CONFIG.letterContent.salutation}
          </p>

          <div className="space-y-3 font-sans text-xs sm:text-sm text-zinc-600 leading-relaxed font-normal">
            {APP_CONFIG.letterContent.paragraphs.map((p, idx) => (
              <p key={idx}>{p}</p>
            ))}
          </div>

          <div className="mt-5 pt-3 border-t border-black/5 flex justify-between items-end">
            <div>
              <p className="text-[11px] font-mono text-zinc-400">
                {APP_CONFIG.letterContent.signoff}
              </p>
              <p className="font-cursive-krishu text-xl text-pink-700 font-medium mt-0.5">
                {APP_CONFIG.letterContent.author}
              </p>
            </div>
            <span className="font-mono text-[10px] text-zinc-400">
              October 20, 2026
            </span>
          </div>
        </div>
      </motion.div>

      {/* Bottom Minimalist Footer */}
      <div className="relative z-20 pt-4 text-center">
        <p className="font-cursive-krishu text-lg text-pink-500/80">
          Happy Birthday, {APP_CONFIG.nickname} 🐇🌸
        </p>
      </div>
    </div>
  );
};
