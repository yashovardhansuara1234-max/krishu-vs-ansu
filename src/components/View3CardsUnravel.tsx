import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MiniSpotifyCard } from './MiniSpotifyCard.tsx';
import { APP_CONFIG, SongItem } from '../config.ts';
import { soundManager } from '../utils/audioPlayer.ts';

interface View3Props {
  onBack: () => void;
  onNext: () => void;
}

export const View3CardsUnravel: React.FC<View3Props> = ({ onBack, onNext }) => {
  const [isUnraveled, setIsUnraveled] = useState(false);
  const [activeTab, setActiveTab] = useState<'both' | 'her' | 'his'>('both');
  const [, setSoundTick] = useState(0);

  // Subscribe to audio manager state changes
  useEffect(() => {
    const unsubscribe = soundManager.subscribe(() => {
      setSoundTick((prev) => prev + 1);
    });
    return () => unsubscribe();
  }, []);

  const handlePlaySong = (song: SongItem) => {
    soundManager.playTrack(song.id, song.audio, song.synthNotes);
  };

  // Stacked slight natural rotations for the initial 10 cards
  const stackRotations = [-4, 2, -2, 3, -3, 1, -1, 4, -2, 0];

  return (
    <div className="relative min-h-screen w-full flex flex-col justify-between py-8 px-4 md:px-8 select-none pastel-mesh-bg overflow-x-hidden">

      {/* Top Header Navigation */}
      <div className="relative z-20 w-full max-w-6xl mx-auto flex items-center justify-between">
        <button
          onClick={onBack}
          aria-label="Back to showdown"
          className="px-4 py-1.5 rounded-full bg-white/70 backdrop-blur-md border border-zinc-200/60 text-xs font-mono text-zinc-600 hover:text-zinc-900 transition-colors cursor-pointer"
        >
          ← Back
        </button>

        {/* Mobile Filter Pill (Her 5 / His 5) when unraveled on small screens */}
        {isUnraveled && (
          <div className="flex md:hidden items-center bg-white/80 backdrop-blur-md p-1 rounded-full border border-zinc-200/80 shadow-sm">
            <button
              onClick={() => setActiveTab('her')}
              aria-label="Filter Her tracks"
              className={`px-3 py-1 rounded-full text-xs font-medium transition-all cursor-pointer ${
                activeTab === 'her'
                  ? 'bg-pink-100 text-pink-800 shadow-xs'
                  : 'text-zinc-600'
              }`}
            >
              Her {APP_CONFIG.herSongs.length} 🌸
            </button>
            <button
              onClick={() => setActiveTab('his')}
              aria-label="Filter His tracks"
              className={`px-3 py-1 rounded-full text-xs font-medium transition-all cursor-pointer ${
                activeTab === 'his'
                  ? 'bg-slate-200 text-slate-800 shadow-xs'
                  : 'text-zinc-600'
              }`}
            >
              His {APP_CONFIG.hisSongs.length} 🕶️
            </button>
          </div>
        )}

        <span className="text-[11px] font-mono tracking-widest uppercase text-zinc-500 bg-white/60 backdrop-blur-md px-3 py-1 rounded-full border border-zinc-200/50">
          Act III · The {APP_CONFIG.herSongs.length + APP_CONFIG.hisSongs.length} Plaques
        </span>
      </div>

      {/* Main Stage */}
      <div className="relative flex-1 flex flex-col items-center justify-center my-6 max-w-6xl mx-auto w-full">
        {/* State 1: Stacked in Center with Silk Pastel Ribbon & Bow */}
        {!isUnraveled ? (
          <div className="relative flex flex-col items-center justify-center py-12">
            <p className="text-xs uppercase tracking-[0.25em] text-zinc-400 font-mono mb-8 text-center">
              A curated stack of {APP_CONFIG.herSongs.length + APP_CONFIG.hisSongs.length} physical mini plaques
            </p>

            {/* The Stacked Cards Container */}
            <div className="relative w-48 md:w-56 h-72 flex items-center justify-center">
              {APP_CONFIG.herSongs.concat(APP_CONFIG.hisSongs).map((song, index) => {
                const rotation = stackRotations[index % stackRotations.length];
                return (
                  <motion.div
                    key={song.id}
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{
                      scale: 1,
                      opacity: 1,
                      rotate: rotation,
                      y: (index - 5) * 1.5,
                    }}
                    transition={{
                      type: 'spring',
                      stiffness: 60,
                      damping: 20,
                      delay: index * 0.04,
                    }}
                    className="absolute"
                    style={{ zIndex: index }}
                  >
                    <div className="pointer-events-none opacity-90">
                      <MiniSpotifyCard
                        song={song}
                        index={index}
                        isActive={false}
                        isPlaying={false}
                        onPlayToggle={() => {}}
                      />
                    </div>
                  </motion.div>
                );
              })}

              {/* Silk Pastel Ribbon & Interactive Bow wrapped across the stack */}
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 1.2, opacity: 0 }}
                className="absolute inset-0 z-20 flex items-center justify-center pointer-events-auto cursor-pointer"
                onClick={() => setIsUnraveled(true)}
                title="Click to untie ribbon"
              >
                {/* Horizontal Ribbon Strap */}
                <div className="absolute w-[115%] h-10 bg-gradient-to-r from-pink-300 via-rose-300 to-pink-300 shadow-md border-y border-pink-400/40 opacity-95 transform -rotate-12 flex items-center justify-center" />

                {/* Vertical Ribbon Strap */}
                <div className="absolute h-[115%] w-10 bg-gradient-to-b from-pink-300 via-rose-300 to-pink-300 shadow-md border-x border-pink-400/40 opacity-95 flex items-center justify-center" />

                {/* Silk Bow Ornament Centerpiece */}
                <motion.button
                  whileHover={{ scale: 1.12 }}
                  whileTap={{ scale: 0.94 }}
                  animate={{
                    boxShadow: [
                      '0 4px 14px rgba(244, 114, 182, 0.25)',
                      '0 4px 24px rgba(244, 114, 182, 0.45)',
                      '0 4px 14px rgba(244, 114, 182, 0.25)',
                    ],
                  }}
                  transition={{ repeat: Infinity, duration: 2.5 }}
                  aria-label="Untie silk ribbon"
                  className="relative z-30 px-5 py-3 rounded-full bg-gradient-to-br from-pink-200 via-pink-300 to-rose-300 border border-white/80 shadow-lg text-xs font-semibold text-pink-900 tracking-wider flex items-center gap-2 cursor-pointer"
                >
                  <span className="text-base select-none">🎀</span>
                  <span>Untie Ribbon</span>
                </motion.button>
              </motion.div>
            </div>

            <motion.p
              animate={{ opacity: [0.5, 0.9, 0.5] }}
              transition={{ repeat: Infinity, duration: 2 }}
              className="font-serif-editorial italic text-zinc-500 text-sm mt-12 text-center"
            >
              "Click the pink bow to unravel the showdown..."
            </motion.p>
          </div>
        ) : (
          /* State 2: Unraveled 2-Column Spacious Layout (5 Her vs 5 His) */
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8 }}
            className="w-full flex flex-col items-center"
          >
            {/* Column Titles on Desktop */}
            <div className="w-full max-w-5xl hidden md:grid grid-cols-2 gap-8 mb-6 text-center">
              <div className="border-b border-pink-200/80 pb-2">
                <span className="font-cursive-krishu text-2xl text-pink-700 font-semibold">
                  Krishu's {APP_CONFIG.herSongs.length} Tracks
                </span>
                <p className="text-[11px] font-mono tracking-widest text-zinc-500 uppercase mt-0.5">
                  Soft · Romantic · Acoustic
                </p>
              </div>
              <div className="border-b border-slate-300/80 pb-2">
                <span className="font-serif-editorial text-xl text-slate-800 font-semibold">
                  Badmash's {APP_CONFIG.hisSongs.length} Tracks
                </span>
                <p className="text-[11px] font-mono tracking-widest text-zinc-500 uppercase mt-0.5">
                  Cool · Moody · Midnight
                </p>
              </div>
            </div>

            {/* The Cards Grid with generous breathing room */}
            <div className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 px-2">
              {/* Left Column (Krishu's Tracks) */}
              <div
                className={`flex flex-wrap justify-center gap-5 md:gap-6 ${
                  activeTab === 'his' ? 'hidden md:flex' : 'flex'
                }`}
              >
                <div className="w-full md:hidden text-center pb-2">
                  <span className="font-cursive-krishu text-2xl text-pink-700 font-semibold">
                    Krishu's {APP_CONFIG.herSongs.length} Tracks
                  </span>
                </div>
                {APP_CONFIG.herSongs.map((song, idx) => (
                  <motion.div
                    key={song.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      type: 'spring',
                      stiffness: 60,
                      damping: 20,
                      delay: idx * 0.07,
                    }}
                  >
                    <MiniSpotifyCard
                      song={song}
                      index={idx}
                      isActive={soundManager.activeId === song.id}
                      isPlaying={soundManager.isPlaying}
                      onPlayToggle={() => handlePlaySong(song)}
                    />
                  </motion.div>
                ))}
              </div>

              {/* Right Column (Badmash's Tracks) */}
              <div
                className={`flex flex-wrap justify-center gap-5 md:gap-6 ${
                  activeTab === 'her' ? 'hidden md:flex' : 'flex'
                }`}
              >
                <div className="w-full md:hidden text-center pb-2">
                  <span className="font-serif-editorial text-lg text-slate-800 font-semibold">
                    Badmash's {APP_CONFIG.hisSongs.length} Tracks
                  </span>
                </div>
                {APP_CONFIG.hisSongs.map((song, idx) => (
                  <motion.div
                    key={song.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      type: 'spring',
                      stiffness: 60,
                      damping: 20,
                      delay: 0.15 + idx * 0.07,
                    }}
                  >
                    <MiniSpotifyCard
                      song={song}
                      index={idx}
                      isActive={soundManager.activeId === song.id}
                      isPlaying={soundManager.isPlaying}
                      onPlayToggle={() => handlePlaySong(song)}
                    />
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Bottom Floating Trigger: Appears once unraveled */}
      <AnimatePresence>
        {isUnraveled && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="w-full flex justify-center pt-8 pb-4 z-20"
          >
            <button
              onClick={onNext}
              aria-label="View Scores"
              className="group flex items-center gap-3 px-9 py-3.5 rounded-full bg-white/80 backdrop-blur-md border border-zinc-200/90 shadow-md hover:bg-white hover:border-pink-300 hover:shadow-lg transition-all duration-300 cursor-pointer active:scale-98"
            >
              <span className="text-sm font-medium text-zinc-900 tracking-wide">
                View Scores
              </span>
              <span className="transition-transform duration-300 group-hover:translate-x-1 font-sans text-pink-600">
                →
              </span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
