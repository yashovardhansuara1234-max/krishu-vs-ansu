import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'motion/react';
import { Sparkles, Disc } from 'lucide-react';
import { APP_CONFIG } from '../config.ts';
import { subscribeToPhotos } from '../firebase.ts';

// Subtle acoustic camera shutter chime synthesizer
function playShutterChime() {
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, ctx.currentTime); // A5 note
    osc.frequency.exponentialRampToValueAtTime(1320, ctx.currentTime + 0.04); // E6
    osc.frequency.exponentialRampToValueAtTime(587, ctx.currentTime + 0.12); // D5
    gain.gain.setValueAtTime(0.06, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.16);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.16);
  } catch {
    // Audio context may require prior user interaction; silently ignore
  }
}

export const LostAndFoundCard: React.FC = () => {
  // Permanent photo link synced with Firebase Cloud database
  const [photoSrc, setPhotoSrc] = useState<string>(
    APP_CONFIG.lostAndFound.photoUrl || '/images/krishu-id.svg'
  );

  useEffect(() => {
    const unsub = subscribeToPhotos((photos) => {
      if (photos && photos.krishu_id) {
        setPhotoSrc(photos.krishu_id);
      }
    });
    return () => unsub();
  }, []);

  const [isHovered, setIsHovered] = useState(false);
  const [flashActive, setFlashActive] = useState(false);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });

  const cardRef = useRef<HTMLDivElement | null>(null);

  // 3D Parallax Tilt Handler on Mouse Move
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const tiltX = (y - centerY) / 8;
    const tiltY = (centerX - x) / 8;
    setTilt({ x: tiltX, y: tiltY });
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setTilt({ x: 0, y: 0 });
  };

  // Trigger camera flash + shutter chime on click
  const handleCardClick = () => {
    playShutterChime();
    setFlashActive(true);
    setTimeout(() => setFlashActive(false), 350);
  };

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={handleMouseLeave}
      onClick={handleCardClick}
      className="relative select-none cursor-pointer perspective-[1000px] z-20 group"
      title="Click polaroid for camera shutter flash!"
    >
      {/* 
        ========================================================================
        1. THE VINYL RECORD DISC
        Smoothly slides out from behind the polaroid upon hovering
        ========================================================================
      */}
      <motion.div
        animate={{
          x: isHovered ? 68 : 0,
          rotate: isHovered ? 180 : 0,
          opacity: isHovered ? 1 : 0.82,
        }}
        transition={{
          type: 'spring',
          stiffness: 75,
          damping: 14,
          mass: 0.8,
        }}
        className="absolute -top-3 left-4 w-36 h-36 sm:w-44 sm:h-44 rounded-full bg-[#121214] border-2 border-zinc-800 shadow-xl pointer-events-none flex items-center justify-center -z-10"
        style={{
          boxShadow: '0 12px 30px -5px rgba(0, 0, 0, 0.45)',
        }}
      >
        {/* Vinyl Grooves Texture */}
        <div className="absolute inset-1.5 rounded-full border border-zinc-700/30" />
        <div className="absolute inset-3.5 rounded-full border border-zinc-700/25" />
        <div className="absolute inset-6 rounded-full border border-zinc-700/20" />
        <div className="absolute inset-9 rounded-full border border-zinc-700/20" />

        {/* Center Vinyl Label (Pastel Pink) */}
        <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-gradient-to-tr from-pink-400 via-rose-300 to-pink-200 border-2 border-zinc-900 flex flex-col items-center justify-center text-center shadow-inner">
          <Disc className="w-3.5 h-3.5 text-zinc-800 mb-0.5 opacity-80" />
          <span className="font-mono text-[7px] font-bold text-zinc-900 tracking-wider uppercase">
            SIDE A
          </span>
          <span className="font-cursive-krishu text-[9px] text-pink-900 font-bold leading-none">
            krishu
          </span>
          {/* Spindle hole */}
          <div className="w-2.5 h-2.5 rounded-full bg-[#121214] border border-zinc-600 mt-0.5" />
        </div>
      </motion.div>

      {/* 
        ========================================================================
        2. JAPANESE WASHI TAPE (Organic Pinning at Top)
        ========================================================================
      */}
      <div
        className="absolute -top-3 left-1/2 -translate-x-1/2 w-28 h-6.5 z-30 pointer-events-none transform -rotate-2"
        style={{
          background: 'rgba(255, 235, 240, 0.78)',
          backdropFilter: 'blur(3px)',
          borderLeft: '2px solid rgba(244, 143, 177, 0.35)',
          borderRight: '2px solid rgba(244, 143, 177, 0.35)',
          boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
        }}
      >
        <div className="w-full h-full flex items-center justify-center gap-1.5 opacity-60">
          <span className="w-1 h-1 rounded-full bg-pink-400" />
          <span className="font-mono text-[8px] tracking-[0.2em] uppercase text-pink-700 font-semibold">
            OCT 20 · 2026
          </span>
          <span className="w-1 h-1 rounded-full bg-pink-400" />
        </div>
      </div>

      {/* 
        ========================================================================
        3. THE POLAROID FRAME (No boxy corporate border, organic photo paper)
        ========================================================================
      */}
      <motion.div
        animate={{
          rotateX: tilt.x,
          rotateY: tilt.y,
          scale: isHovered ? 1.025 : 1,
        }}
        transition={{
          type: 'spring',
          stiffness: 280,
          damping: 25,
        }}
        style={{
          transformStyle: 'preserve-3d',
        }}
        className="relative w-44 sm:w-52 aspect-[3.5/4.5] bg-[#FFFDF9] p-3 pt-3.5 pb-3 rounded-[3px] shadow-xl border border-zinc-200/60 transform -rotate-2 transition-shadow duration-300 group-hover:shadow-2xl"
      >
        {/* Soft Polaroid Paper Texture & Drop Shadow */}
        <div className="relative w-full aspect-[4/4.2] rounded-[1px] overflow-hidden bg-zinc-900 shadow-inner">
          <img
            src={photoSrc}
            alt="Krishu Polaroid"
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).src = '/images/krishu-id.svg';
            }}
          />

          {/* Holographic Light Prism Reflection on Glossy Photo Paper */}
          <div className="absolute inset-0 pointer-events-none animate-holo-shimmer opacity-40 mix-blend-overlay" />

          {/* Camera Shutter Flash Bloom on Click */}
          {flashActive && (
            <div className="absolute inset-0 bg-white pointer-events-none animate-camera-flash z-30" />
          )}

          {/* Vintage Stamp Seal on Top Corner */}
          <div className="absolute top-1.5 right-1.5 px-1.5 py-0.5 rounded-full bg-white/80 backdrop-blur-xs border border-pink-200 flex items-center gap-1 shadow-xs pointer-events-none">
            <Sparkles className="w-2.5 h-2.5 text-pink-500" />
            <span className="font-mono text-[7px] text-zinc-700 tracking-wider font-bold">
              K-20
            </span>
          </div>

          {/* Bottom Left Frame Info (Photographic metadata) */}
          <div className="absolute bottom-1 left-1.5 font-mono text-[7px] tracking-wider text-white/90 drop-shadow-md pointer-events-none">
            <span>[ISO 200 // 35MM]</span>
          </div>
        </div>

        {/* 
          ======================================================================
          4. POLAROID CHIN: Handwritten Signature & Stamp
          ======================================================================
        */}
        <div className="pt-2 px-1 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            {/* Rubber Stamp Ink Seal */}
            <div className="border border-pink-300/80 rounded-full px-1.5 py-0.5 transform -rotate-6 bg-pink-50/50">
              <span className="font-mono text-[7px] font-bold text-pink-700 tracking-tighter uppercase">
                20TH BDAY
              </span>
            </div>

            {/* Handwritten Signature */}
            <span
              className="font-cursive-krishu font-bold text-pink-600 text-[18px] leading-tight mt-0.5 inline-flex items-center gap-1"
              style={{
                textShadow: '0 1px 2px rgba(244, 143, 177, 0.25)',
              }}
            >
              <span>krishu</span>
              <svg
                className="w-3 h-3 text-pink-500 fill-pink-500/80 inline drop-shadow-xs"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
              </svg>
            </span>
          </div>

          {/* Audio Soundwave Equalizer (Connecting to "soundtrack of us") */}
          <div className="flex items-center justify-between pt-1">
            <span className="font-mono text-[7px] text-zinc-400 tracking-wider uppercase">
              track 01 · her essence
            </span>
            <div className="flex items-center gap-0.5" title="Soundtrack track 01">
              <span className="w-[2.5px] h-2.5 bg-pink-400 rounded-full animate-soundwave" style={{ animationDelay: '0s' }} />
              <span className="w-[2.5px] h-3.5 bg-pink-500 rounded-full animate-soundwave" style={{ animationDelay: '0.2s' }} />
              <span className="w-[2.5px] h-2 bg-pink-400 rounded-full animate-soundwave" style={{ animationDelay: '0.4s' }} />
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
