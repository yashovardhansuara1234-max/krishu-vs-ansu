import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, ArrowRight, ArrowLeft, Camera, Upload, Link as LinkIcon, X, Check, RefreshCw, Image as ImageIcon, Heart } from 'lucide-react';
import { APP_CONFIG, formatGoogleDriveUrl } from '../config.ts';
import { savePhotoToFirestore, subscribeToPhotos } from '../firebase.ts';

interface View2Props {
  onBack: () => void;
  onNext: () => void;
}

interface Particle {
  id: number;
  side: 'left' | 'right';
  x: number;
  y: number;
  rot: number;
  char: string;
  color: string;
  size: number;
}

// Web Audio sound synthesizer for VS impact & camera shutter
function playVsImpactSound() {
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();

    // Low sub-bass thump on left
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(120, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(35, ctx.currentTime + 0.15);
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.2);

    // Sparkle harmonic chime on right
    const chimeOsc = ctx.createOscillator();
    const chimeGain = ctx.createGain();
    chimeOsc.type = 'sine';
    chimeOsc.frequency.setValueAtTime(987.77, ctx.currentTime + 0.05); // B5
    chimeOsc.frequency.exponentialRampToValueAtTime(1318.51, ctx.currentTime + 0.18); // E6
    chimeGain.gain.setValueAtTime(0.08, ctx.currentTime + 0.05);
    chimeGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
    chimeOsc.connect(chimeGain);
    chimeGain.connect(ctx.destination);
    chimeOsc.start(ctx.currentTime + 0.05);
    chimeOsc.stop(ctx.currentTime + 0.3);
  } catch {
    // Audio context may require prior interaction
  }
}

function playShutterSound() {
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1320, ctx.currentTime + 0.04);
    osc.frequency.exponentialRampToValueAtTime(587, ctx.currentTime + 0.12);
    gain.gain.setValueAtTime(0.07, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.16);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.16);
  } catch {
    // Audio context fallback
  }
}

function playPaperTearSound() {
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const bufferSize = ctx.sampleRate * 0.18;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.4));
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1400, ctx.currentTime);
    filter.Q.setValueAtTime(2, ctx.currentTime);
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.18);
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    noise.start();
  } catch {
    // Audio context fallback
  }
}

export const View2SplitContrast: React.FC<View2Props> = ({ onBack, onNext }) => {
  const [particles, setParticles] = useState<Particle[]>([]);
  const [isTearingExit, setIsTearingExit] = useState(false);

  // Dynamic photo states with localStorage persistence & Drive link resolution
  const [himPhoto, setHimPhoto] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('vs_photo_him');
      if (saved && !saved.endsWith('.jpg')) return formatGoogleDriveUrl(saved);
    }
    return formatGoogleDriveUrl(APP_CONFIG.vsPhotos.himGangster || '/images/him-bw.svg');
  });

  const [herPhoto, setHerPhoto] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('vs_photo_her');
      if (saved && !saved.endsWith('.jpg')) return formatGoogleDriveUrl(saved);
      // Auto-detect photo added in View 1 if present
      const v1Saved = localStorage.getItem('krishu_uploaded_photo');
      if (v1Saved && !v1Saved.endsWith('.jpg')) return formatGoogleDriveUrl(v1Saved);
    }
    return formatGoogleDriveUrl(APP_CONFIG.vsPhotos.herCute || '/images/krishu-id.svg');
  });

  // Photo customization modal state
  const [activeModalSide, setActiveModalSide] = useState<'him' | 'her' | null>(null);
  const [flashSide, setFlashSide] = useState<'him' | 'her' | null>(null);
  const [urlInput, setUrlInput] = useState('');
  const [urlError, setUrlError] = useState('');
  const [isDraggingOver, setIsDraggingOver] = useState<'him' | 'her' | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Real-time synchronization with Firestore photos
  useEffect(() => {
    const unsub = subscribeToPhotos((photos) => {
      if (photos) {
        if (photos.badmash_profile) setHimPhoto(photos.badmash_profile);
        if (photos.krishu_profile) setHerPhoto(photos.krishu_profile);
      }
    });
    return () => unsub();
  }, []);

  // Check if View 1 Krishu photo is available for quick sync
  const hasV1Photo = typeof window !== 'undefined' && Boolean(localStorage.getItem('krishu_uploaded_photo'));

  // Trigger camera shutter flash & open customize modal
  const handleOpenPhotoModal = (side: 'him' | 'her', e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    playShutterSound();
    setFlashSide(side);
    setTimeout(() => setFlashSide(null), 300);
    setActiveModalSide(side);
    setUrlInput('');
    setUrlError('');
  };

  // Handle local file selection from device
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && activeModalSide) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        if (result) {
          applyNewPhoto(activeModalSide, result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle Drag & Drop on modal
  const handleDrop = (e: React.DragEvent, side: 'him' | 'her') => {
    e.preventDefault();
    setIsDraggingOver(null);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        if (result) {
          applyNewPhoto(side, result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Apply new photo and save to Firestore & localStorage
  const applyNewPhoto = (side: 'him' | 'her', photoUrl: string) => {
    const formatted = formatGoogleDriveUrl(photoUrl.trim());
    if (side === 'him') {
      setHimPhoto(formatted);
      savePhotoToFirestore('badmash_profile', formatted, 'Badmash Profile', 'profile').catch(() => {});
      try {
        localStorage.setItem('vs_photo_him', formatted);
      } catch (err) {
        console.warn('LocalStorage quota limit reached', err);
      }
    } else {
      setHerPhoto(formatted);
      savePhotoToFirestore('krishu_profile', formatted, 'Krishu Profile', 'profile').catch(() => {});
      try {
        localStorage.setItem('vs_photo_her', formatted);
      } catch (err) {
        console.warn('LocalStorage quota limit reached', err);
      }
    }
    setActiveModalSide(null);
    setUrlInput('');
    setUrlError('');
  };

  // Handle URL or Google Drive submission
  const handleUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!urlInput.trim()) {
      setUrlError('Please paste an image URL or Google Drive link');
      return;
    }
    if (!activeModalSide) return;
    applyNewPhoto(activeModalSide, urlInput);
  };

  // Reset to default photo
  const handleResetPhoto = (side: 'him' | 'her') => {
    if (side === 'him') {
      const def = APP_CONFIG.vsPhotos.himGangster || '/images/him-bw.svg';
      setHimPhoto(def);
      localStorage.removeItem('vs_photo_him');
    } else {
      const def = APP_CONFIG.vsPhotos.herCute || '/images/krishu-id.svg';
      setHerPhoto(def);
      localStorage.removeItem('vs_photo_her');
    }
    setActiveModalSide(null);
  };

  // Quick sync Krishu photo from View 1
  const handleSyncV1Photo = () => {
    const v1Saved = localStorage.getItem('krishu_uploaded_photo');
    if (v1Saved) {
      applyNewPhoto('her', v1Saved);
    }
  };

  // Handle VS Intersection Click (Burst dual-sided sparkles)
  const handleVsClick = () => {
    playVsImpactSound();

    const now = Date.now();
    const newParticles: Particle[] = [];

    // Left Side: Dark charcoal & silver grunge fragments
    const leftChars = ['✦', '▪', '✕', '▲', '◆', '✶'];
    const leftColors = ['#18181B', '#3F3F46', '#71717A', '#A1A1AA', '#FFFFFF'];
    for (let i = 0; i < 7; i++) {
      newParticles.push({
        id: now + i,
        side: 'left',
        x: -(18 + Math.random() * 48),
        y: (Math.random() - 0.5) * 70,
        rot: Math.random() * 360,
        char: leftChars[i % leftChars.length],
        color: leftColors[i % leftColors.length],
        size: 10 + Math.random() * 8,
      });
    }

    // Right Side: Soft pastel hearts, flowers & golden stars
    const rightChars = ['🌸', '✨', '♥', '⭐', '🌷', '★'];
    const rightColors = ['#F43F5E', '#EC4899', '#D946EF', '#F59E0B', '#FB7185'];
    for (let i = 0; i < 7; i++) {
      newParticles.push({
        id: now + 10 + i,
        side: 'right',
        x: 18 + Math.random() * 48,
        y: (Math.random() - 0.5) * 70,
        rot: Math.random() * 360,
        char: rightChars[i % rightChars.length],
        color: rightColors[i % rightColors.length],
        size: 12 + Math.random() * 8,
      });
    }

    setParticles((prev) => [...prev, ...newParticles]);
    setTimeout(() => {
      setParticles((prev) => prev.filter((p) => !newParticles.some((np) => np.id === p.id)));
    }, 1100);
  };

  // Trigger page-fold / paper tear transition to View 3
  const handleTransitionNext = () => {
    playPaperTearSound();
    setIsTearingExit(true);
    setTimeout(() => {
      onNext();
    }, 380);
  };

  return (
    <div
      className={`relative w-full h-[100dvh] max-h-[100dvh] flex flex-col justify-between overflow-hidden select-none ${
        isTearingExit ? 'animate-page-tear pointer-events-none' : ''
      }`}
    >
      {/* Hidden File Input for Direct Device Upload */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        className="hidden"
      />

      {/* 
        ========================================================================
        1. THE CANVAS: Hand-Collaged Split Screen with Ripped Paper Seam
        ========================================================================
      */}
      <div className="absolute inset-0 w-full h-full flex flex-row overflow-hidden z-0">
        {/* 
          LEFT SIDE (The Gangster Vibe):
          Moody high-contrast monochrome film-grain, grunge textures, masking tape,
          and faint handwritten lyrics.
        */}
        <div className="relative w-1/2 h-full bg-[#111113] overflow-hidden flex flex-col justify-end">
          {/* Subtle Halftone & Grunge Background Grain */}
          <div
            className="absolute inset-0 opacity-20 pointer-events-none"
            style={{
              backgroundImage: 'radial-gradient(#52525B 1px, transparent 1px)',
              backgroundSize: '16px 16px',
            }}
          />

          {/* Moody Photo Container Layer (Positioned lower so typography shines) */}
          <div className="relative z-10 w-full flex justify-center pb-12 sm:pb-16 px-3 sm:px-8">
            <div
              onClick={(e) => handleOpenPhotoModal('him', e)}
              role="button"
              tabIndex={0}
              aria-label="Him gangster photo. Click to add or customize photo."
              className="group/him relative w-full max-w-[220px] sm:max-w-[280px] md:max-w-[340px] aspect-[3/4] rounded-[2px] overflow-hidden shadow-2xl filter grayscale contrast-125 brightness-90 -rotate-1 border border-zinc-700/50 cursor-pointer transition-transform duration-300 hover:scale-[1.02] hover:-rotate-0"
            >
              <img
                src={himPhoto}
                alt="Him - Gangster Vibe"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover transition-transform duration-500 group-hover/him:scale-105"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/images/him-bw.svg';
                }}
              />

              {/* Deep charcoal film grain & vignette fade */}
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  background:
                    'radial-gradient(circle at 50% 35%, transparent 30%, rgba(9,9,11,0.65) 80%, #09090B 100%)',
                }}
              />

              {/* Camera Shutter Flash Effect */}
              {flashSide === 'him' && (
                <div className="absolute inset-0 bg-white pointer-events-none animate-ping opacity-90 z-30" />
              )}

              {/* Film camera frame info stamped on edge */}
              <div className="absolute bottom-1.5 left-2 font-mono text-[7px] sm:text-[9px] tracking-widest text-zinc-400 opacity-60 flex items-center gap-1.5">
                <span>[35MM // 400 ISO] KODAK TRI-X · #01</span>
              </div>

              {/* Interactive "Add / Change Photo" Overlay Pill on Hover & Tap */}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/him:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1.5 p-3 text-center pointer-events-none">
                <div className="px-3 py-1.5 rounded-full bg-zinc-900/90 border border-zinc-500/60 text-zinc-100 font-mono text-[10px] sm:text-xs tracking-wider uppercase flex items-center gap-1.5 shadow-lg backdrop-blur-xs">
                  <Camera className="w-3.5 h-3.5 text-zinc-300" />
                  <span>Add / Change Image</span>
                </div>
                <span className="text-[9px] sm:text-[10px] text-zinc-300 font-mono opacity-80">
                  Google Drive · Upload · URL
                </span>
              </div>

              {/* Aesthetic Tape Badge Indicator on top-right corner */}
              <div className="absolute top-2 right-2 px-2 py-0.5 rounded-xs bg-zinc-900/80 backdrop-blur-xs border border-zinc-600/50 text-[8px] sm:text-[9px] font-mono text-zinc-300 tracking-wider flex items-center gap-1 opacity-70 group-hover/him:opacity-100 shadow-sm">
                <Camera className="w-2.5 h-2.5 text-zinc-400" />
                <span>EDIT</span>
              </div>
            </div>
          </div>

          {/* Tape Artifact #1: Angled Masking Tape holding top-left corner */}
          <div
            className="absolute top-14 left-4 sm:left-10 px-3 py-1 z-10 pointer-events-none -rotate-6 shadow-md"
            style={{
              background: 'rgba(39, 39, 42, 0.85)',
              backdropFilter: 'blur(2px)',
              borderTop: '1px solid rgba(113, 113, 122, 0.4)',
              borderBottom: '1px solid rgba(82, 82, 91, 0.4)',
            }}
          >
            <span className="font-mono text-[8px] sm:text-[10px] tracking-widest uppercase text-zinc-300 font-bold">
              REC // 00:20:10
            </span>
          </div>

          {/* Tape Artifact #2: Dark Tape with Faint Handwritten Lyrics Scribble */}
          <div
            className="absolute bottom-4 left-3 sm:left-10 px-3 py-1 z-10 pointer-events-none rotate-2 shadow-lg"
            style={{
              background: 'rgba(24, 24, 27, 0.92)',
              borderLeft: '2px solid rgba(161, 161, 170, 0.3)',
              borderRight: '2px solid rgba(161, 161, 170, 0.3)',
            }}
          >
            <p className="font-handwritten-caveat text-[11px] sm:text-xs text-zinc-400/90 tracking-wide">
              "heavy bass in the speakers · strictly classics"
            </p>
          </div>

          {/* Ambient Graffiti Lyric Accent: Faintly etched into dark canvas */}
          <div className="absolute top-1/4 -left-8 z-0 pointer-events-none opacity-10 rotate-90 select-none">
            <span className="font-gangster-anton text-4xl sm:text-7xl text-white tracking-widest">
              NIGHT SHIFT
            </span>
          </div>

          {/* Left Dark Gradient Vignette Seam */}
          <div className="absolute inset-y-0 right-0 w-16 sm:w-24 bg-gradient-to-r from-transparent via-[#111113]/60 to-[#09090B] pointer-events-none" />
        </div>

        {/* 
          RIGHT SIDE (The Cute Vibe):
          Soft, warm pastel pink & lavender aesthetic with whimsical organic doodles,
          die-cut stickers, and floral overlays.
        */}
        <div className="relative w-1/2 h-full bg-gradient-to-br from-[#FFFDF9] via-[#FCE4EC]/50 to-[#F3E5F5]/60 overflow-hidden flex flex-col justify-end">
          {/* Subtle Pastel Polka Dot Grid */}
          <div
            className="absolute inset-0 opacity-25 pointer-events-none"
            style={{
              backgroundImage: 'radial-gradient(#F472B6 1px, transparent 1px)',
              backgroundSize: '20px 20px',
            }}
          />

          {/* Cute Photo Container Layer (Positioned lower so typography shines) */}
          <div className="relative z-10 w-full flex justify-center pb-12 sm:pb-16 px-3 sm:px-8">
            <div
              onClick={(e) => handleOpenPhotoModal('her', e)}
              role="button"
              tabIndex={0}
              aria-label="Krishu cute photo. Click to add or customize photo."
              className="group/her relative w-full max-w-[220px] sm:max-w-[280px] md:max-w-[340px] aspect-[3/4] rounded-xl overflow-hidden shadow-xl border-3 sm:border-4 border-white/90 bg-white rotate-1 cursor-pointer transition-transform duration-300 hover:scale-[1.02] hover:rotate-0"
            >
              <img
                src={herPhoto}
                alt="Krishu - Cute Vibe"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover filter saturate-105 brightness-105 transition-transform duration-500 group-hover/her:scale-105"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/images/krishu-id.svg';
                }}
              />

              {/* Soft Golden Hour Glow & Peach Vignette */}
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  background:
                    'radial-gradient(circle at 50% 35%, transparent 40%, rgba(251,207,232,0.3) 80%, rgba(244,114,182,0.15) 100%)',
                }}
              />

              {/* Camera Shutter Flash Effect */}
              {flashSide === 'her' && (
                <div className="absolute inset-0 bg-white pointer-events-none animate-ping opacity-90 z-30" />
              )}

              {/* Hand-Drawn Floral Overlay (Daisy in hair corner) */}
              <div className="absolute top-2 right-2 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white/90 backdrop-blur-xs flex items-center justify-center shadow-md rotate-12 z-10">
                <span className="text-sm sm:text-base select-none">🌼</span>
              </div>

              {/* Interactive "Add / Change Photo" Overlay Pill on Hover & Tap */}
              <div className="absolute inset-0 bg-pink-900/35 opacity-0 group-hover/her:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1.5 p-3 text-center pointer-events-none z-20">
                <div className="px-3 py-1.5 rounded-full bg-white text-pink-700 font-bubble-cute font-bold text-[10px] sm:text-xs tracking-wider flex items-center gap-1.5 shadow-lg border border-pink-200">
                  <Camera className="w-3.5 h-3.5 text-pink-500" />
                  <span>Add / Change Image 🌸</span>
                </div>
                <span className="text-[9px] sm:text-[10px] text-white font-sans font-medium drop-shadow-sm">
                  Google Drive · Upload · URL
                </span>
              </div>

              {/* Aesthetic Pastel Badge Indicator on top-left corner */}
              <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-white/85 backdrop-blur-xs border border-pink-200/80 text-[8px] sm:text-[9px] font-bubble-cute font-bold text-pink-600 tracking-wider flex items-center gap-1 opacity-80 group-hover/her:opacity-100 shadow-sm z-10">
                <Camera className="w-2.5 h-2.5 text-pink-500" />
                <span>EDIT</span>
              </div>
            </div>
          </div>

          {/* Sticker #1: Die-Cut "100% SWEET" Sticker */}
          <motion.div
            animate={{ rotate: [6, 3, 6], y: [0, -3, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute top-14 right-3 sm:right-12 z-10 px-3 py-1 sm:px-3.5 sm:py-1.5 rounded-full bg-white text-pink-700 shadow-md border-2 border-pink-100 font-bubble-cute font-bold text-[10px] sm:text-xs md:text-sm flex items-center gap-1.5"
            style={{
              boxShadow: '0 8px 16px -2px rgba(244, 143, 177, 0.45)',
            }}
          >
            <span>100% SWEET</span>
            <svg
              className="w-3 h-3 text-pink-500 fill-pink-500 inline"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
            </svg>
          </motion.div>

          {/* Sticker #2: Die-Cut "angel energy ✨" Sticker */}
          <motion.div
            animate={{ rotate: [-8, -5, -8], y: [0, 3, 0] }}
            transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
            className="absolute bottom-6 right-3 sm:right-10 z-10 px-3 py-1 sm:px-3.5 sm:py-1.5 rounded-2xl bg-white/95 backdrop-blur-xs text-purple-700 shadow-md border border-purple-200/80 font-handwritten-caveat text-xs sm:text-sm md:text-base font-bold flex items-center gap-1"
            style={{
              boxShadow: '0 8px 16px -2px rgba(206, 147, 216, 0.35)',
            }}
          >
            <span>angel energy</span>
            <span className="text-amber-400">✨</span>
          </motion.div>

          {/* Floating Heart & Floral Doodles */}
          <div className="absolute top-1/3 right-3 sm:right-6 flex flex-col gap-2 pointer-events-none opacity-70">
            <span className="text-lg sm:text-xl animate-pulse">🌸</span>
            <span className="text-sm">✨</span>
          </div>

          {/* Soft Pastel Mesh Light Bleed */}
          <div className="absolute inset-y-0 left-0 w-16 sm:w-24 bg-gradient-to-l from-transparent via-[#FFFDF9]/60 to-[#FFFDF9] pointer-events-none" />
        </div>

        {/* 
          ======================================================================
          HAND-COLLAGED RIPPED PAPER DIVIDER (Vertical Center Seam)
          Deckle-edge paper tear line with white exposed fibers and drop shadow
          ======================================================================
        */}
        <div
          className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-7 sm:w-12 z-20 pointer-events-none flex items-center justify-center overflow-hidden"
          style={{
            filter: 'drop-shadow(0 0 10px rgba(0,0,0,0.35))',
          }}
        >
          <svg
            viewBox="0 0 50 1000"
            preserveAspectRatio="none"
            className="w-full h-full"
            aria-hidden="true"
          >
            {/* Shadow / Grunge edge behind tear */}
            <path
              d="M 23 0 Q 18 100 24 200 Q 30 300 20 400 Q 12 500 25 600 Q 32 700 21 800 Q 15 900 24 1000 L 29 1000 Q 20 900 26 800 Q 37 700 30 600 Q 17 500 25 400 Q 35 300 29 200 Q 23 100 28 0 Z"
              fill="rgba(0,0,0,0.25)"
            />
            {/* Deckle Ripped White Paper Body */}
            <path
              d="M 20 0 Q 14 60 22 130 Q 30 210 18 290 Q 9 370 24 450 Q 32 530 19 620 Q 11 710 23 800 Q 33 890 19 960 Q 14 985 20 1000 L 28 1000 Q 22 985 27 960 Q 41 890 31 800 Q 19 710 27 620 Q 40 530 32 450 Q 17 370 26 290 Q 38 210 30 130 Q 22 60 28 0 Z"
              fill="#FAF8F5"
            />
            {/* Fine Exposed Fiber Edge */}
            <path
              d="M 22 0 Q 16 60 24 130 Q 32 210 20 290 Q 11 370 26 450 Q 34 530 21 620 Q 13 710 25 800 Q 35 890 21 960 Q 16 985 22 1000"
              fill="none"
              stroke="#FFFFFF"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
          </svg>
        </div>
      </div>

      {/* 
        ========================================================================
        TOP NAVIGATION BAR (Minimalist, unobtrusive)
        ========================================================================
      */}
      <div className="relative z-30 w-full px-4 sm:px-8 py-4 sm:py-5 flex justify-between items-center max-w-7xl mx-auto">
        <button
          onClick={onBack}
          aria-label="Back to Birthday Wish"
          className="group flex items-center gap-1.5 px-3 py-1 sm:px-3.5 sm:py-1.5 rounded-full bg-white/75 hover:bg-white backdrop-blur-md border border-zinc-200/80 text-[11px] sm:text-xs font-mono text-zinc-800 transition-all cursor-pointer shadow-xs active:scale-95"
        >
          <ArrowLeft className="w-3.5 h-3.5 text-zinc-600 transition-transform group-hover:-translate-x-0.5" />
          <span>Track 01</span>
        </button>

        {/* Quick Customize Photos Button in Header */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleOpenPhotoModal('her')}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/70 hover:bg-white backdrop-blur-md border border-pink-200 text-[10px] font-bubble-cute text-pink-700 shadow-xs transition-all active:scale-95 cursor-pointer"
          >
            <Camera className="w-3 h-3 text-pink-500" />
            <span>Customize Photos</span>
          </button>

          <span className="text-[9px] sm:text-[11px] font-mono tracking-widest uppercase text-zinc-600 bg-white/75 backdrop-blur-md px-3 py-1 rounded-full border border-zinc-200/60 shadow-xs">
            ACT II · THE SHOWDOWN
          </span>
        </div>
      </div>

      {/* 
        ========================================================================
        2 & 3. INTEGRATED TYPOGRAPHY (No Box Enclosures) & EPIC "VS"
        ========================================================================
      */}
      <div className="relative z-30 my-auto w-full max-w-6xl mx-auto px-2 sm:px-4 flex flex-col items-center pointer-events-none">
        {/* Split Headings Row (Left: Bold Distressed MUSIC TASTE; Right: Bubble Cute SHOWDOWN) */}
        <div className="w-full grid grid-cols-2 gap-2 sm:gap-6 items-center">
          {/* Left Side Typography: Heavy distressed gangster poster */}
          <div className="flex flex-col items-end text-right pr-2 sm:pr-8 md:pr-12">
            <span className="font-mono text-[8px] sm:text-xs md:text-sm tracking-[0.2em] sm:tracking-[0.25em] text-zinc-400 uppercase font-semibold">
              SIDE A — HIM
            </span>
            <h2 className="font-gangster-anton text-2xl sm:text-5xl md:text-6xl lg:text-7xl tracking-tight text-white uppercase drop-shadow-[0_4px_12px_rgba(0,0,0,0.9)] leading-[0.95] mt-0.5 sm:mt-1 whitespace-nowrap">
              MUSIC TASTE
            </h2>
            <p className="font-mono text-[7px] sm:text-[9px] md:text-xs tracking-wider text-zinc-300 mt-1 opacity-80">
              // The Gangster Playlist
            </p>
          </div>

          {/* Right Side Typography: Playful bubble cute font */}
          <div className="flex flex-col items-start text-left pl-2 sm:pl-8 md:pl-12">
            <span className="font-cursive-krishu text-xs sm:text-base md:text-lg text-pink-600 font-bold inline-flex items-center gap-1">
              <span>SIDE B — KRISHU</span>
              <svg
                className="w-3 h-3 text-pink-500 fill-pink-500 inline"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
              </svg>
            </span>
            <h2
              className="font-bubble-cute text-2xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight text-pink-600 drop-shadow-[0_2px_8px_rgba(244,114,182,0.35)] leading-[0.95] mt-0.5 sm:mt-1 whitespace-nowrap"
              style={{
                WebkitTextStroke: '1px #FFF',
              }}
            >
              SHOWDOWN
            </h2>
            <p className="font-handwritten-caveat text-[10px] sm:text-sm md:text-base text-pink-700/80 mt-1 font-bold">
              // The Soft Cute Playlist 🌸
            </p>
          </div>
        </div>

        {/* 
          ======================================================================
          THE EPIC "VS" INTERSECTION
          Gritty distressed hand-crafted lettering overlapping the ripped seam.
          No bulky boxes! Heartbeat pulse every 4s, click to burst particles!
          ======================================================================
        */}
        <div className="relative mt-2 sm:mt-4 flex flex-col items-center pointer-events-auto">
          {/* Pulsing & Clickable VS Element */}
          <div
            onClick={handleVsClick}
            role="button"
            tabIndex={0}
            aria-label="Versus intersection button. Click for visual spark impact."
            className="group cursor-pointer select-none transition-transform active:scale-95 focus:outline-none"
            title="Click VS for spark impact!"
          >
            <div className="relative animate-vs-pulse">
              {/* Gritty Hand-Crafted VS Brush Lettering */}
              <div
                className="font-gangster-anton text-4xl sm:text-7xl md:text-8xl font-black tracking-tighter transition-all duration-300 group-hover:scale-110 flex items-center justify-center"
                style={{
                  transform: 'rotate(-8deg)',
                  filter: 'drop-shadow(0 8px 18px rgba(0,0,0,0.5))',
                }}
              >
                {/* Dual-Tone VS (Left half chrome/silver, Right half vibrant hot-pink) */}
                <span
                  className="bg-gradient-to-r from-zinc-100 via-zinc-300 to-pink-500 bg-clip-text text-transparent px-2"
                  style={{
                    WebkitTextStroke: '1.5px rgba(255,255,255,0.9)',
                    textShadow: '0 0 25px rgba(244, 114, 182, 0.45)',
                  }}
                >
                  VS
                </span>
              </div>

              {/* Hand-drawn distressed brush underline accent */}
              <div className="w-14 sm:w-24 h-1.5 bg-gradient-to-r from-zinc-400 via-white to-pink-500 rounded-full mx-auto -mt-2 opacity-80" />
            </div>

            {/* Sparkle Micro-Cue on Hover */}
            <div className="absolute -top-3 -right-3 opacity-0 group-hover:opacity-100 transition-opacity">
              <Sparkles className="w-4 h-4 text-pink-400 animate-spin" />
            </div>
          </div>

          {/* Dual-Sided Particle Explosion Container */}
          <AnimatePresence>
            {particles.map((p) => (
              <motion.span
                key={p.id}
                initial={{ opacity: 1, scale: 0.5, x: 0, y: 0, rotate: 0 }}
                animate={{
                  opacity: 0,
                  scale: 1.25,
                  x: p.x * 2.2,
                  y: p.y * 2,
                  rotate: p.rot,
                }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.9, ease: 'easeOut' }}
                className="absolute pointer-events-none font-bold"
                style={{
                  left: '50%',
                  top: '40%',
                  color: p.color,
                  fontSize: `${p.size}px`,
                  textShadow: p.side === 'right' ? '0 0 8px rgba(244,143,177,0.8)' : '0 0 8px rgba(0,0,0,0.8)',
                }}
              >
                {p.char}
              </motion.span>
            ))}
          </AnimatePresence>

          {/* 
            PLAYFUL QUOTE (No container box!):
            Directly below the VS intersection, floating handwritten script quote
            with translucent frosted paper tape backing for perfect legibility across dark and light.
          */}
          <motion.div
            animate={{ y: [0, -3, 0] }}
            transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
            className="mt-3 sm:mt-5 px-3 py-1 rounded-full select-none"
            style={{
              background: 'rgba(255, 255, 255, 0.35)',
              backdropFilter: 'blur(8px)',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            }}
          >
            <p
              className="font-serif-editorial italic text-sm sm:text-lg md:text-xl text-zinc-900 font-semibold tracking-wide drop-shadow-xs"
              style={{
                textShadow: '0 1px 2px rgba(255, 255, 255, 0.8)',
              }}
            >
              "Let's see who wins."
            </p>
          </motion.div>
        </div>
      </div>

      {/* 
        ========================================================================
        4. FLOATING INTERACTION: "Unveil the Playlists →" BUTTON
        Translucent, organically shaped glassmorphic action button at bottom center,
        straddling the split seam with dark-to-light gradient borders.
        ========================================================================
      */}
      <div className="relative z-30 pb-6 sm:pb-8 flex flex-col items-center">
        <motion.button
          onClick={handleTransitionNext}
          whileHover={{ y: -3, scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          aria-label="Unveil the Playlists"
          className="group relative flex items-center gap-3 px-8 sm:px-11 py-3 sm:py-3.5 rounded-full overflow-hidden shadow-xl cursor-pointer"
          style={{
            background: 'rgba(255, 255, 255, 0.55)',
            backdropFilter: 'blur(16px)',
            boxShadow: '0 16px 32px -8px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(255,255,255,0.7)',
          }}
        >
          {/* Dark-to-Light Split Gradient Border Overlay */}
          <div
            className="absolute inset-0 rounded-full p-[1.5px] pointer-events-none"
            style={{
              background:
                'linear-gradient(to right, rgba(24, 24, 27, 0.85) 0%, rgba(113, 113, 122, 0.6) 48%, rgba(244, 114, 182, 0.85) 52%, rgba(244, 114, 182, 0.95) 100%)',
              mask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
              maskComposite: 'exclude',
              WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
              WebkitMaskComposite: 'xor',
            }}
          />

          {/* Dynamic Light/Dark Slideway Sheen on Hover */}
          <div className="absolute inset-0 bg-gradient-to-r from-zinc-900/10 via-transparent to-pink-500/15 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

          {/* Button Label & Motion Arrow */}
          <span className="relative z-10 text-xs sm:text-sm font-semibold tracking-wider text-zinc-900 uppercase font-sans">
            Unveil the Playlists
          </span>
          <span className="relative z-10 transition-transform duration-300 group-hover:translate-x-1.5 text-pink-600 font-bold text-base">
            →
          </span>
        </motion.button>

        {/* Quiet Sub-label */}
        <span className="mt-1.5 text-[8px] sm:text-[9px] font-mono tracking-widest uppercase text-zinc-500 opacity-70">
          {APP_CONFIG.herSongs.length} tracks vs {APP_CONFIG.hisSongs.length} tracks · side by side
        </span>
      </div>

      {/* 
        ========================================================================
        PHOTO CUSTOMIZATION MODAL (Senior Developer Experience)
        Direct Upload · Google Drive URL Auto-Converter · Live Comparison
        ========================================================================
      */}
      <AnimatePresence>
        {activeModalSide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop Blur */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setActiveModalSide(null)}
              className="absolute inset-0 bg-black/60 backdrop-blur-md"
            />

            {/* Modal Dialog Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 15 }}
              className={`relative z-10 w-full max-w-lg rounded-2xl p-6 shadow-2xl overflow-hidden border ${
                activeModalSide === 'him'
                  ? 'bg-zinc-900 text-zinc-100 border-zinc-700/80'
                  : 'bg-white text-zinc-900 border-pink-200'
              }`}
              onDragOver={(e) => {
                e.preventDefault();
                setIsDraggingOver(activeModalSide);
              }}
              onDragLeave={() => setIsDraggingOver(null)}
              onDrop={(e) => handleDrop(e, activeModalSide)}
            >
              {/* Header with Side Tabs */}
              <div className="flex items-start justify-between pb-4 border-b border-inherit/20">
                <div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setActiveModalSide('him')}
                      className={`px-3 py-1 rounded-full text-xs font-mono font-bold transition-all cursor-pointer ${
                        activeModalSide === 'him'
                          ? 'bg-zinc-100 text-zinc-900 shadow-xs'
                          : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      Side A: Him
                    </button>
                    <button
                      onClick={() => setActiveModalSide('her')}
                      className={`px-3 py-1 rounded-full text-xs font-bubble-cute font-bold transition-all cursor-pointer ${
                        activeModalSide === 'her'
                          ? 'bg-pink-500 text-white shadow-xs'
                          : 'bg-pink-50 text-pink-700 hover:bg-pink-100'
                      }`}
                    >
                      Side B: Krishu 🌸
                    </button>
                  </div>
                  <h3 className="text-base sm:text-lg font-bold mt-2">
                    {activeModalSide === 'him'
                      ? 'Add Gangster Playlist Photo'
                      : 'Add Krishu Cute Photo'}
                  </h3>
                  <p className="text-xs opacity-75 mt-0.5">
                    Upload from device or paste your Google Drive image link.
                  </p>
                </div>

                <button
                  onClick={() => setActiveModalSide(null)}
                  className="p-1.5 rounded-full hover:bg-black/10 dark:hover:bg-white/10 transition-colors cursor-pointer"
                  aria-label="Close photo dialog"
                >
                  <X className="w-5 h-5 opacity-70" />
                </button>
              </div>

              {/* Quick Sync Button if Krishu photo is stored from View 1 */}
              {activeModalSide === 'her' && hasV1Photo && (
                <div className="mt-4 p-3 rounded-xl bg-pink-50 border border-pink-200/80 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-pink-900">
                    <Heart className="w-4 h-4 text-pink-500 fill-pink-500" />
                    <span className="text-xs font-medium">Found Krishu photo from Wish Card!</span>
                  </div>
                  <button
                    onClick={handleSyncV1Photo}
                    className="px-3 py-1 rounded-lg bg-pink-500 hover:bg-pink-600 text-white text-xs font-semibold shadow-xs transition-transform active:scale-95 cursor-pointer"
                  >
                    Use Same Photo
                  </button>
                </div>
              )}

              {/* Drag & Drop / Device Upload Area */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className={`mt-4 border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2 ${
                  isDraggingOver === activeModalSide
                    ? 'border-pink-500 bg-pink-500/10 scale-[0.99]'
                    : activeModalSide === 'him'
                    ? 'border-zinc-700 hover:border-zinc-500 hover:bg-zinc-800/40'
                    : 'border-pink-200 hover:border-pink-300 hover:bg-pink-50/50'
                }`}
              >
                <div
                  className={`w-11 h-11 rounded-full flex items-center justify-center ${
                    activeModalSide === 'him'
                      ? 'bg-zinc-800 text-zinc-300'
                      : 'bg-pink-100 text-pink-600'
                  }`}
                >
                  <Upload className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs sm:text-sm font-semibold">
                    Click to browse or drag & drop image here
                  </p>
                  <p className="text-[10px] sm:text-xs opacity-60 mt-0.5">
                    Supports JPG, PNG, WEBP, GIF, SVG
                  </p>
                </div>
              </div>

              {/* Google Drive / Web URL Input Form */}
              <form onSubmit={handleUrlSubmit} className="mt-4 flex flex-col gap-2">
                <label className="text-xs font-semibold opacity-90 flex items-center gap-1.5">
                  <LinkIcon className="w-3.5 h-3.5" />
                  <span>Or Paste Image URL / Google Drive Link</span>
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={urlInput}
                    onChange={(e) => {
                      setUrlInput(e.target.value);
                      setUrlError('');
                    }}
                    placeholder="https://drive.google.com/file/d/... or image URL"
                    className={`flex-1 px-3 py-2 text-xs rounded-xl border outline-none transition-all ${
                      activeModalSide === 'him'
                        ? 'bg-zinc-800 border-zinc-700 text-zinc-100 placeholder-zinc-500 focus:border-zinc-400'
                        : 'bg-zinc-50 border-zinc-200 text-zinc-900 placeholder-zinc-400 focus:border-pink-400'
                    }`}
                  />
                  <button
                    type="submit"
                    className={`px-4 py-2 rounded-xl text-xs font-semibold transition-transform active:scale-95 cursor-pointer flex items-center gap-1 ${
                      activeModalSide === 'him'
                        ? 'bg-zinc-100 text-zinc-900 hover:bg-white'
                        : 'bg-pink-500 text-white hover:bg-pink-600'
                    }`}
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Apply</span>
                  </button>
                </div>

                {urlError && (
                  <p className="text-xs text-rose-500 font-medium">{urlError}</p>
                )}

                <p className="text-[10px] opacity-60 leading-relaxed">
                  💡 Tip: For Google Drive, click <strong>Share → Anyone with the link</strong>, copy the link and paste it here. It auto-converts to a direct image!
                </p>
              </form>

              {/* Current Preview & Reset Actions */}
              <div className="mt-5 pt-4 border-t border-inherit/20 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className={`w-9 h-9 rounded-md overflow-hidden border ${
                      activeModalSide === 'him'
                        ? 'border-zinc-700 grayscale contrast-125'
                        : 'border-pink-200'
                    }`}
                  >
                    <img
                      src={activeModalSide === 'him' ? himPhoto : herPhoto}
                      alt="Active preview"
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src =
                          activeModalSide === 'him' ? '/images/him-bw.svg' : '/images/krishu-id.svg';
                      }}
                    />
                  </div>
                  <div className="text-[11px] leading-tight">
                    <p className="font-semibold">Current Active Photo</p>
                    <p className="opacity-60 text-[9px]">Live on View 2 canvas</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleResetPhoto(activeModalSide)}
                  className="px-3 py-1.5 rounded-lg text-xs font-mono opacity-70 hover:opacity-100 hover:bg-black/5 dark:hover:bg-white/10 transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Reset to Default</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
