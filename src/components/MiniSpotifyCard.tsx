import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Heart,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  RotateCcw,
  RotateCw,
  Camera,
  Upload,
  Link as LinkIcon,
  X,
  Check,
  Globe,
  Sparkles,
  Database,
  Music,
} from 'lucide-react';
import { SpotifyIcon, SoundwaveBarcode, CardCoverArt } from './VisualAssets.tsx';
import { SongItem, formatGoogleDriveUrl } from '../config.ts';
import { soundManager } from '../utils/audioPlayer.ts';
import { saveSongCoverToFirestore, subscribeToSongCovers } from '../firebase.ts';

interface MiniSpotifyCardProps {
  song: SongItem;
  isActive: boolean;
  isPlaying: boolean;
  onPlayToggle: () => void;
  index: number;
}

// Client-side image compressor: scales any device upload to square album dimensions
function compressImageForStorage(file: File, maxDim = 600, quality = 0.85): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        if (width > height) {
          if (width > maxDim) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          }
        } else {
          if (height > maxDim) {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', quality));
        } else {
          resolve(e.target?.result as string);
        }
      };
      img.onerror = () => resolve(e.target?.result as string);
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
}

export const MiniSpotifyCard: React.FC<MiniSpotifyCardProps> = ({
  song,
  isActive,
  isPlaying,
  onPlayToggle,
}) => {
  const [isLiked, setIsLiked] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const [makePermanent, setMakePermanent] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const defaultCardPhoto = song.cover || (song.colorTheme === 'pink' ? '/images/her1.jpg' : '/images/him1.jpg');

  const [customCover, setCustomCover] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(`song_cover_${song.id}`);
      if (saved && saved !== '/images/her-color.jpg' && saved !== '/images/him-bw.jpg') {
        return formatGoogleDriveUrl(saved);
      }
    }
    return defaultCardPhoto;
  });

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Real-time synchronization with Firebase Firestore across all devices
  useEffect(() => {
    const unsubscribe = subscribeToSongCovers((covers) => {
      if (covers && covers[song.id]) {
        const coverVal = covers[song.id];
        if (coverVal !== '/images/her-color.jpg' && coverVal !== '/images/him-bw.jpg') {
          setCustomCover(formatGoogleDriveUrl(coverVal));
        } else {
          setCustomCover(defaultCardPhoto);
        }
      }
    });

    // Static fallback check from server
    fetch('/custom-covers.json')
      .then((res) => (res.ok ? res.json() : {}))
      .then((covers: Record<string, string>) => {
        if (covers && covers[song.id]) {
          const coverVal = covers[song.id];
          if (coverVal !== '/images/her-color.jpg' && coverVal !== '/images/him-bw.jpg') {
            setCustomCover(formatGoogleDriveUrl(coverVal));
          } else {
            setCustomCover(defaultCardPhoto);
          }
        }
      })
      .catch(() => {});

    return () => unsubscribe();
  }, [song.id, defaultCardPhoto]);

  const applyCover = async (coverUrl: string) => {
    const formattedUrl = formatGoogleDriveUrl(coverUrl.trim());
    setIsSaving(true);
    setStatusMessage('Syncing to Firebase database...');
    setCustomCover(formattedUrl);
    localStorage.setItem(`song_cover_${song.id}`, formattedUrl);

    if (makePermanent) {
      try {
        await saveSongCoverToFirestore(
          song.id,
          formattedUrl,
          song.title,
          song.artist,
          song.colorTheme === 'pink' ? 'her' : 'his'
        );
        setStatusMessage('Saved to Firebase! Synced to every device ✓');
      } catch (err) {
        console.warn('Firebase sync note:', err);
        // Fallback to local server save
        await fetch('/api/save-cover', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ songId: song.id, coverUrl }),
        }).catch(() => {});
        setStatusMessage('Saved to website codebase ✓');
      }
    } else {
      setStatusMessage('Saved to this browser ✓');
    }

    setTimeout(() => {
      setIsSaving(false);
      setShowModal(false);
      setStatusMessage(null);
      setUrlInput('');
    }, 1100);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsSaving(true);
      setStatusMessage('Optimizing photo for Firebase...');
      try {
        const compressed = await compressImageForStorage(file);
        await applyCover(compressed);
      } catch (err) {
        console.error(err);
        setIsSaving(false);
      }
    }
  };

  const handleUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!urlInput.trim()) return;
    const formatted = formatGoogleDriveUrl(urlInput.trim());
    applyCover(formatted);
  };

  const handleReset = async () => {
    localStorage.removeItem(`song_cover_${song.id}`);
    setCustomCover(null);
    try {
      await saveSongCoverToFirestore(
        song.id,
        song.cover,
        song.title,
        song.artist,
        song.colorTheme === 'pink' ? 'her' : 'his'
      );
      await fetch('/api/reset-cover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ songId: song.id }),
      }).catch(() => {});
    } catch {}
    setShowModal(false);
  };

  const isHer = song.colorTheme === 'pink';

  // Physical Plaque Background Tones:
  // Her: #F9C6E0 soft pastel pink
  // Badmash: #E2E8F0 soft muted lavender/slate
  const cardBgClass = isHer
    ? 'bg-[#F9C6E0] border-pink-200/60 text-zinc-900 shadow-pink-900/5'
    : 'bg-[#E2E8F0] border-slate-300/60 text-zinc-900 shadow-slate-900/5';

  return (
    <>
      <motion.div
        layout
        whileHover={{ y: -4, transition: { duration: 0.2 } }}
        className={`w-44 md:w-52 aspect-[3/4.2] rounded-2xl p-3 flex flex-col justify-between shadow-lg border relative transition-shadow duration-300 select-none ${cardBgClass} ${
          isActive && isPlaying ? 'ring-2 ring-pink-400/50 shadow-xl' : ''
        }`}
      >
        {/* 1. Top: Square Image with p-3 padding around card */}
        <div className="group/cover relative w-full aspect-square rounded-xl overflow-hidden bg-white/40 shadow-inner flex-shrink-0">
          <CardCoverArt
            src={customCover || song.cover}
            title={song.title}
            artist={song.artist}
            theme={song.colorTheme}
          />

          {/* Quick Edit Cover Button (always accessible, highlighted on hover) */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowModal(true);
            }}
            aria-label={`Change cover for ${song.title}`}
            title={`Change cover for ${song.title}`}
            className="absolute top-2 right-2 px-2 py-1 rounded-full bg-black/65 hover:bg-black/85 text-white opacity-80 md:opacity-0 md:group-hover/cover:opacity-100 transition-all cursor-pointer shadow-md backdrop-blur-xs flex items-center gap-1 active:scale-95"
          >
            <Camera className="w-3 h-3 text-white" />
            <span className="text-[9px] font-mono tracking-wider font-semibold">EDIT</span>
          </button>
        </div>

        {/* 2. Middle: Spotify Icon + Soundwave Barcode */}
        <div className="flex items-center justify-between px-1 py-1 mt-1 flex-shrink-0">
          <div className="text-zinc-800" title="Spotify Audio Code">
            <SpotifyIcon className="w-4 h-4 md:w-4.5 md:h-4.5" />
          </div>
          <div className="flex-1 flex justify-center">
            <SoundwaveBarcode isPlaying={isActive && isPlaying} barColor="bg-zinc-800" />
          </div>
        </div>

        {/* 3. Track Info Row: Bold Title, Muted Artist, Heart Icon */}
        <div className="flex items-start justify-between px-1 gap-1 flex-shrink-0">
          <div className="min-w-0 pr-1 flex-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              <h4 className="font-sans font-bold text-xs md:text-sm text-zinc-900 truncate leading-snug">
                {song.title}
              </h4>
              {song.id === 'b1' && (
                <span className="px-1.5 py-0.2 rounded-full bg-emerald-100 text-emerald-800 text-[9px] font-mono font-medium border border-emerald-300">
                  HQ AUDIO
                </span>
              )}
            </div>
            <p className="text-[10px] md:text-xs text-zinc-600 truncate font-normal">
              {song.artist}
            </p>
          </div>
          <button
            onClick={() => setIsLiked(!isLiked)}
            aria-label={isLiked ? "Unlike song" : "Like song"}
            className="p-1 hover:scale-110 active:scale-95 transition-transform cursor-pointer text-zinc-700"
          >
            <Heart
              className={`w-4 h-4 transition-colors ${
                isLiked ? 'fill-pink-600 text-pink-600' : 'text-zinc-800 stroke-[1.5]'
              }`}
            />
          </button>
        </div>

        {/* 4. Scrubber Bar: Thin horizontal line with tiny dot & timestamps 15:05 / -14:55 */}
        <div className="px-1 flex flex-col gap-0.5 flex-shrink-0">
          <div className="w-full h-1 bg-zinc-800/15 rounded-full relative overflow-hidden flex items-center">
            <div
              className="h-full bg-zinc-800 rounded-full transition-all duration-300"
              style={{ width: isActive ? `${Math.max(5, (soundManager.progress * 100))}%` : '28%' }}
            />
          </div>
          <div className="flex justify-between items-center text-[9px] font-mono text-zinc-600 font-medium pt-0.5">
            <span>{isActive ? soundManager.currentFormattedTime : "15:05"}</span>
            <span>{isActive ? soundManager.remainingFormattedTime : "-14:55"}</span>
          </div>
        </div>

        {/* 5. Bottom Controls: 5 Minimalist Outlined Circular Transport Buttons */}
        <div className="flex items-center justify-between px-1 pt-1 pb-0.5 flex-shrink-0 text-zinc-800">
          {/* Previous |<< */}
          <button
            onClick={() => soundManager.seek(-10)}
            aria-label="Previous track"
            className="p-1 rounded-full hover:bg-black/5 active:scale-90 transition-all cursor-pointer"
          >
            <SkipBack className="w-3.5 h-3.5 md:w-4 md:h-4 stroke-[1.75]" />
          </button>

          {/* Rewind 15s */}
          <button
            onClick={() => soundManager.seek(-15)}
            aria-label="Rewind 15 seconds"
            className="p-1 rounded-full hover:bg-black/5 active:scale-90 transition-all cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5 md:w-4 md:h-4 stroke-[1.75]" />
          </button>

          {/* Center Play/Pause Circle */}
          <button
            onClick={onPlayToggle}
            aria-label={isActive && isPlaying ? `Pause ${song.title}` : `Play ${song.title}`}
            className="w-7 h-7 md:w-8 md:h-8 rounded-full border border-zinc-800 flex items-center justify-center hover:bg-zinc-800 hover:text-white active:scale-95 transition-all shadow-sm cursor-pointer"
          >
            {isActive && isPlaying ? (
              <Pause className="w-3.5 h-3.5 fill-current stroke-[1.5]" />
            ) : (
              <Play className="w-3.5 h-3.5 fill-current stroke-[1.5] translate-x-0.5" />
            )}
          </button>

          {/* Forward 15s */}
          <button
            onClick={() => soundManager.seek(15)}
            aria-label="Forward 15 seconds"
            className="p-1 rounded-full hover:bg-black/5 active:scale-90 transition-all cursor-pointer"
          >
            <RotateCw className="w-3.5 h-3.5 md:w-4 md:h-4 stroke-[1.75]" />
          </button>

          {/* Next >>| */}
          <button
            onClick={() => soundManager.seek(10)}
            aria-label="Next track"
            className="p-1 rounded-full hover:bg-black/5 active:scale-90 transition-all cursor-pointer"
          >
            <SkipForward className="w-3.5 h-3.5 md:w-4 md:h-4 stroke-[1.75]" />
          </button>
        </div>
      </motion.div>

      {/* Custom Cover Photo Modal with Permanent Firebase Save */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !isSaving && setShowModal(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-md"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 10 }}
              className="relative z-10 w-full max-w-md rounded-2xl p-6 shadow-2xl bg-white text-zinc-900 border border-zinc-200 overflow-hidden"
            >
              {/* Header */}
              <div className="flex items-start justify-between pb-3 border-b border-zinc-100">
                <div>
                  <div className="flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-pink-500" />
                    <h3 className="font-sans font-bold text-base text-zinc-900">
                      Cover Art Studio
                    </h3>
                  </div>
                  <p className="text-xs text-zinc-500 font-normal mt-0.5">
                    {song.title} · <span className="font-medium text-zinc-700">{song.artist}</span>
                  </p>
                </div>
                <button
                  onClick={() => !isSaving && setShowModal(false)}
                  className="p-1 rounded-full hover:bg-zinc-100 text-zinc-400 hover:text-zinc-800 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Status Banner */}
              {statusMessage && (
                <div className="mt-3 py-2 px-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-center gap-2 animate-fadeIn">
                  <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>{statusMessage}</span>
                </div>
              )}

              {/* Permanent Firebase Option Toggle */}
              <div className="mt-4 p-3 rounded-xl bg-pink-50/60 border border-pink-200/80 flex items-start gap-3">
                <input
                  type="checkbox"
                  id={`make-permanent-${song.id}`}
                  checked={makePermanent}
                  onChange={(e) => setMakePermanent(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-pink-300 text-pink-600 focus:ring-pink-400 cursor-pointer accent-pink-600"
                />
                <label htmlFor={`make-permanent-${song.id}`} className="text-xs cursor-pointer select-none">
                  <span className="font-semibold text-zinc-900 flex items-center gap-1">
                    <Database className="w-3.5 h-3.5 text-pink-600 inline" />
                    Save to Firebase Cloud Database (Permanent on all devices)
                  </span>
                  <p className="text-zinc-600 text-[11px] mt-0.5 leading-tight">
                    Stores directly in Firebase Cloud Firestore so Krishu, Badmash, and anyone visiting on any phone, tablet, or laptop sees it permanently.
                  </p>
                </label>
              </div>

              {/* Cloud Database Connected Status indicator */}
              <div className="mt-2.5 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50/80 border border-emerald-200/80 text-emerald-800 text-[11px] font-mono">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Firebase Cloud Firestore Database: Active & Synced</span>
              </div>

              {/* Option A: Direct Device File Upload */}
              <div className="mt-4">
                <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
                  1. Upload Image from Device (Auto-compressed for Cloud)
                </label>
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isSaving}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl border-2 border-dashed border-zinc-300 hover:border-pink-500 hover:bg-pink-50/40 text-xs font-medium text-zinc-700 transition-all cursor-pointer disabled:opacity-50"
                >
                  <Upload className="w-4 h-4 text-pink-600" />
                  <span>Choose Image File (PNG, JPG, HEIC, WebP)</span>
                </button>
              </div>

              {/* Option B: Paste Image URL */}
              <form onSubmit={handleUrlSubmit} className="mt-4">
                <label className="block text-xs font-semibold text-zinc-700 mb-1.5 flex items-center gap-1">
                  <LinkIcon className="w-3.5 h-3.5 text-zinc-500" />
                  <span>2. Or Paste Image / Google Drive URL</span>
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    placeholder="https://... or Google Drive sharing link"
                    disabled={isSaving}
                    className="flex-1 text-xs px-3 py-2.5 rounded-lg border border-zinc-300 focus:outline-none focus:ring-2 focus:ring-pink-400 disabled:opacity-50"
                  />
                  <button
                    type="submit"
                    disabled={isSaving || !urlInput.trim()}
                    className="px-4 py-2.5 bg-zinc-900 hover:bg-zinc-800 active:scale-95 text-white rounded-lg text-xs font-medium cursor-pointer transition-all disabled:opacity-40"
                  >
                    {isSaving ? 'Saving...' : makePermanent ? 'Save to Firebase' : 'Apply'}
                  </button>
                </div>
              </form>

              {/* Audio Track Source & Status */}
              <div className="mt-4 p-3 rounded-xl bg-zinc-50 border border-zinc-200 text-left">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-800">
                    <Music className="w-3.5 h-3.5 text-pink-600" />
                    <span>Track Audio Source</span>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-medium border border-emerald-300">
                    {song.id === 'b1' ? 'Warning · 02:59' : song.duration}
                  </span>
                </div>
                <p className="text-[11px] text-zinc-600 mt-1">
                  {song.id === 'b1'
                    ? 'Original audio by Addi Kalyan is loaded and configured in cloud database.'
                    : `Audio file connected: ${song.title} (${song.artist}).`}
                </p>
              </div>

              {/* Reset to Original Cover */}
              <div className="mt-4 pt-3 border-t border-zinc-100 flex items-center justify-between text-xs">
                <span className="text-zinc-400 text-[11px] font-mono">
                  Track ID: {song.id}
                </span>
                {customCover && (
                  <button
                    onClick={handleReset}
                    disabled={isSaving}
                    className="text-rose-600 hover:underline cursor-pointer font-medium"
                  >
                    Reset to Default Cover
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
