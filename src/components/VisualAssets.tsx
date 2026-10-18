import React, { useState } from 'react';

/**
 * High-res, graceful SVG artwork components adhering strictly to the
 * Zero-Broken-Image Policy. If an external URL is provided, it attempts to load;
 * otherwise it renders a stunning, domain-authentic minimalist pastel or monochrome portrait.
 */

export const RabbitIcon: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden="true"
  >
    {/* Minimalist line art bunny */}
    <path d="M10 2c-.8 2-1 4.5-.6 7 .5 2.5 2 4.2 4.6 5 2.2.7 4.5.3 6-1 .5 2.8-.8 5.6-3.2 7-3 1.8-7 1.5-9.6-.8-2-1.8-2.8-4.5-2.2-7.2.5-2.2 2-4 4-5z" />
    <path d="M9 2c.5 1.5.8 3.5.5 5.5" />
    <path d="M14 1.5c.3 1.8.2 4-.3 6" />
    <circle cx="16" cy="11" r="0.75" fill="currentColor" />
  </svg>
);

export const SpotifyIcon: React.FC<{ className?: string }> = ({ className = "w-4 h-4" }) => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
    aria-label="Spotify"
  >
    <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.48.66.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
  </svg>
);

export const SoundwaveBarcode: React.FC<{ isPlaying?: boolean; barColor?: string }> = ({
  isPlaying = false,
  barColor = "bg-zinc-800",
}) => {
  // 18 physical barcode-style soundwave bars
  const heights = [8, 14, 22, 10, 18, 26, 12, 20, 24, 16, 28, 14, 22, 18, 24, 12, 16, 8];

  return (
    <div className="flex items-center gap-[2px] h-6 px-1 overflow-hidden" aria-label="Spotify soundwave code">
      {heights.map((h, i) => (
        <span
          key={i}
          className={`w-[2px] rounded-full ${barColor} ${
            isPlaying ? 'animate-soundwave' : 'opacity-90'
          }`}
          style={{
            height: `${h}px`,
            animationDelay: isPlaying ? `${(i * 0.08) % 0.8}s` : '0s',
            animationDuration: `${0.6 + (i % 4) * 0.15}s`,
          }}
        />
      ))}
    </div>
  );
};

export const HimGangsterVisual: React.FC<{ src?: string }> = ({ src }) => {
  const [loadError, setLoadError] = useState(false);

  if (src && !loadError) {
    return (
      <img
        src={src}
        alt="Him - Gangster Monochrome Portrait"
        referrerPolicy="no-referrer"
        onError={() => setLoadError(true)}
        className="w-full h-full object-cover filter grayscale contrast-125 brightness-95"
      />
    );
  }

  // Pure SVG editorial monochrome portrait fallback
  return (
    <div className="w-full h-full relative overflow-hidden bg-gradient-to-b from-[#18181B] via-[#27272A] to-[#09090B] flex items-center justify-center">
      <svg viewBox="0 0 400 500" className="w-full h-full opacity-90" aria-label="Monochrome portrait">
        <defs>
          <radialGradient id="himGlow" cx="50%" cy="30%" r="60%">
            <stop offset="0%" stopColor="#3F3F46" />
            <stop offset="100%" stopColor="#18181B" />
          </radialGradient>
        </defs>
        <rect width="400" height="500" fill="url(#himGlow)" />
        {/* Cinematic street silhouette with sunglasses */}
        <ellipse cx="200" cy="210" rx="65" ry="85" fill="#27272A" stroke="#52525B" strokeWidth="1" />
        {/* Dark sunglasses */}
        <rect x="145" y="190" width="48" height="26" rx="6" fill="#09090B" stroke="#71717A" strokeWidth="1.5" />
        <rect x="207" y="190" width="48" height="26" rx="6" fill="#09090B" stroke="#71717A" strokeWidth="1.5" />
        <line x1="193" y1="200" x2="207" y2="200" stroke="#71717A" strokeWidth="2" />
        {/* Jawline & subtle smile */}
        <path d="M185 255 Q200 262 215 255" fill="none" stroke="#71717A" strokeWidth="2" strokeLinecap="round" />
        {/* Leather jacket / overcoat collar */}
        <path d="M135 295 L110 500 L290 500 L265 295 L200 350 Z" fill="#09090B" />
        <path d="M140 295 L200 350 L260 295" fill="none" stroke="#3F3F46" strokeWidth="2" />
      </svg>
      <div className="absolute bottom-6 left-6 text-left">
        <span className="text-[11px] tracking-widest uppercase font-mono text-zinc-400">SIDE A · HIM</span>
        <p className="text-sm font-medium text-zinc-200 mt-0.5">The Gangster Playlist</p>
      </div>
    </div>
  );
};

export const HerCuteVisual: React.FC<{ src?: string; showLabels?: boolean }> = ({ src, showLabels = true }) => {
  const [loadError, setLoadError] = useState(false);

  if (src && !loadError) {
    return (
      <img
        src={src}
        alt="Krishu - Cute Pastel Portrait"
        referrerPolicy="no-referrer"
        onError={() => setLoadError(true)}
        className="w-full h-full object-cover filter brightness-105 saturate-95"
      />
    );
  }

  // Pure SVG editorial warm pastel portrait fallback
  return (
    <div className="w-full h-full relative overflow-hidden bg-gradient-to-b from-[#FCE7F3] via-[#FDF2F8] to-[#EDE9FE] flex items-center justify-center">
      <svg viewBox="0 0 400 500" className="w-full h-full" aria-label="Pastel portrait of Krishu">
        <defs>
          <radialGradient id="herAura" cx="50%" cy="35%" r="55%">
            <stop offset="0%" stopColor="#FBCFE8" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#EDE9FE" stopOpacity="0.3" />
          </radialGradient>
        </defs>
        <circle cx="200" cy="190" r="130" fill="url(#herAura)" />
        {/* Soft flowing hair and smiling face */}
        <ellipse cx="200" cy="205" rx="60" ry="78" fill="#FCE7F3" stroke="#F472B6" strokeWidth="0.8" />
        <path d="M145 160 C130 240, 140 320, 160 380" fill="none" stroke="#BE185D" strokeWidth="1.5" strokeLinecap="round" opacity="0.3" />
        <path d="M255 160 C270 240, 260 320, 240 380" fill="none" stroke="#BE185D" strokeWidth="1.5" strokeLinecap="round" opacity="0.3" />
        {/* Soft cheerful eyes */}
        <path d="M168 198 Q178 190 188 198" fill="none" stroke="#831843" strokeWidth="2" strokeLinecap="round" />
        <path d="M212 198 Q222 190 232 198" fill="none" stroke="#831843" strokeWidth="2" strokeLinecap="round" />
        {/* Sweet smile */}
        <path d="M182 235 Q200 248 218 235" fill="none" stroke="#BE185D" strokeWidth="2.5" strokeLinecap="round" />
        {/* Blush cheeks */}
        <circle cx="166" cy="225" r="9" fill="#FB7185" opacity="0.3" />
        <circle cx="234" cy="225" r="9" fill="#FB7185" opacity="0.3" />
        {/* Subtle cute floral hair pin */}
        <circle cx="152" cy="155" r="5" fill="#F43F5E" />
        <circle cx="145" cy="152" r="4" fill="#FDA4AF" />
        <circle cx="158" cy="152" r="4" fill="#FDA4AF" />
      </svg>
      {showLabels && (
        <div className="absolute bottom-6 right-6 text-right">
          <span className="text-[11px] tracking-widest uppercase font-mono text-pink-600">SIDE B · KRISHU</span>
          <p className="text-sm font-medium text-pink-900 mt-0.5">The Soft Cute Playlist</p>
        </div>
      )}
    </div>
  );
};

export const CardCoverArt: React.FC<{
  src?: string;
  title: string;
  artist: string;
  theme?: 'pink' | 'lavender';
}> = ({ src, title, artist, theme = 'pink' }) => {
  const [loadError, setLoadError] = useState(false);

  if (src && !loadError) {
    return (
      <img
        src={src}
        alt={`${title} cover`}
        referrerPolicy="no-referrer"
        onError={() => setLoadError(true)}
        className="w-full aspect-square rounded-xl object-cover"
      />
    );
  }

  const isPink = theme === 'pink';

  return (
    <div
      className={`w-full aspect-square rounded-xl flex flex-col justify-between p-3.5 relative overflow-hidden transition-all duration-300 ${
        isPink
          ? 'bg-gradient-to-br from-[#FCE7F3] via-[#FDF2F8] to-[#FED7AA]/60 text-zinc-800'
          : 'bg-gradient-to-br from-[#E2E8F0] via-[#EDE9FE] to-[#CBD5E1] text-zinc-800'
      }`}
    >
      {/* Decorative subtle background geometry */}
      <div className="absolute -right-6 -bottom-6 w-24 h-24 rounded-full opacity-30 bg-white/60 pointer-events-none" />
      <div className="flex justify-between items-center text-[10px] uppercase font-mono tracking-wider opacity-60">
        <span>{isPink ? 'KRISHU VIBE' : 'BADMASH'}</span>
        <span>HQ</span>
      </div>

      <div className="my-auto text-center py-2">
        <p className="font-serif-editorial text-base font-semibold leading-tight line-clamp-2 px-1">
          {title}
        </p>
        <p className="text-xs text-zinc-600 font-normal mt-1 line-clamp-1">
          {artist}
        </p>
      </div>

      <div className="flex items-center justify-between text-[10px] text-zinc-500 border-t border-black/5 pt-1.5">
        <span className="font-cursive-krishu text-sm text-zinc-700">october tape</span>
        <span className="font-mono text-[9px]">33 RPM</span>
      </div>
    </div>
  );
};
