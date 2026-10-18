import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { APP_CONFIG } from '../config.ts';

interface HeartParticle {
  id: number;
  x: number;
  y: number;
  color: string;
}

export const InteractiveRabbit: React.FC = () => {
  const [clickCount, setClickCount] = useState(0);
  const [isJumping, setIsJumping] = useState(false);
  const [hearts, setHearts] = useState<HeartParticle[]>([]);
  const [speechText, setSpeechText] = useState<string | null>(null);

  const messages = APP_CONFIG.rabbitMessages;

  const handleClick = () => {
    // 1. Trigger spring jump
    setIsJumping(true);
    setTimeout(() => setIsJumping(false), 600);

    // 2. Cycle mini speech message
    const nextIdx = clickCount % messages.length;
    setSpeechText(messages[nextIdx]);
    setClickCount((prev) => prev + 1);

    // 3. Spawn 3-4 floating pastel hearts
    const heartColors = ['#F48FB1', '#CE93D8', '#F8BBD0', '#E1BEE7'];
    const newHearts: HeartParticle[] = Array.from({ length: 4 }).map((_, i) => ({
      id: Date.now() + i,
      x: (Math.random() - 0.5) * 32,
      y: -10 - Math.random() * 20,
      color: heartColors[i % heartColors.length],
    }));

    setHearts((prev) => [...prev, ...newHearts]);

    // Cleanup hearts after 1.5s
    setTimeout(() => {
      setHearts((prev) => prev.filter((h) => !newHearts.some((nh) => nh.id === h.id)));
    }, 1500);
  };

  return (
    <div
      className="absolute bottom-[7%] right-[6%] md:bottom-[7%] md:right-[6%] z-30 select-none flex flex-col items-center"
      style={{ touchAction: 'manipulation' }}
    >
      {/* Tiny Glassmorphic Speech Bubble */}
      <AnimatePresence>
        {speechText && (
          <motion.div
            key={clickCount}
            initial={{ opacity: 0, y: 8, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.85, y: -4 }}
            transition={{ duration: 0.25 }}
            className="mb-2 px-3 py-1.5 rounded-xl bg-white/85 backdrop-blur-md border border-pink-200/70 shadow-sm text-xs font-sans text-zinc-700 whitespace-nowrap pointer-events-none relative"
            style={{
              boxShadow: '0 8px 16px -4px rgba(244, 143, 177, 0.25)',
            }}
          >
            <span>{speechText}</span>
            {/* Tiny arrow pointing down to rabbit */}
            <div className="absolute left-1/2 -bottom-1 -translate-x-1/2 w-2 h-2 bg-white/85 rotate-45 border-r border-b border-pink-200/70" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Pastel Hearts on Click */}
      <div className="relative">
        <AnimatePresence>
          {hearts.map((h) => (
            <motion.span
              key={h.id}
              initial={{ opacity: 1, y: 0, x: h.x, scale: 0.6 }}
              animate={{ opacity: 0, y: -45, x: h.x * 1.5, scale: 1.1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.2, ease: 'easeOut' }}
              className="absolute pointer-events-none text-xs font-serif"
              style={{ color: h.color, top: -10, left: '50%' }}
            >
              ♡
            </motion.span>
          ))}
        </AnimatePresence>

        {/* The Rabbit Avatar with Idle Breathing, resting 8deg tilt, and interactive Spring Jump */}
        <motion.button
          onClick={handleClick}
          aria-label="Interactive rabbit mascot"
          title="Tap me! 🐇"
          animate={
            isJumping
              ? {
                  y: [-22, 0],
                  rotate: [-5, 8],
                  scale: [1.15, 1],
                  transition: { type: 'spring', stiffness: 350, damping: 15 },
                }
              : {
                  rotate: 8,
                  y: [0, -3, 0],
                  transition: { repeat: Infinity, duration: 3.5, ease: 'easeInOut' },
                }
          }
          whileHover={{ scale: 1.1, rotate: 4 }}
          whileTap={{ scale: 0.95 }}
          className="cursor-pointer bg-transparent border-0 p-1 flex items-center justify-center outline-none focus-visible:ring-2 focus-visible:ring-pink-300 rounded-full"
        >
          {/* Custom Minimalist Pastel Rabbit SVG */}
          <svg
            width="52"
            height="58"
            viewBox="0 0 52 58"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="filter drop-shadow-sm transition-transform duration-300"
          >
            {/* Soft Shadow Base */}
            <ellipse cx="26" cy="53" rx="16" ry="3.5" fill="#F48FB1" fillOpacity="0.25" />

            {/* Left Ear */}
            <path
              d="M17 26C15 16 16 4 20 2C24 0 25 12 23 25"
              fill="#FFFDF9"
              stroke="#D81B60"
              strokeWidth="1.75"
              strokeLinecap="round"
            />
            <path
              d="M18.5 22C17.5 15 18 6 20.5 4.5C22 3.5 23 11 21.5 21"
              fill="#F8BBD0"
            />

            {/* Right Ear (with subtle twitch angle) */}
            <path
              d="M31 25C30 14 32 3 36 2C40 1 40 14 36 26"
              fill="#FFFDF9"
              stroke="#D81B60"
              strokeWidth="1.75"
              strokeLinecap="round"
            />
            <path
              d="M32.5 21C32 13 33.5 5.5 35.5 4.5C37 3.5 37.5 12 35 21"
              fill="#F8BBD0"
            />

            {/* Rabbit Body / Head (Soft plump silhouette) */}
            <ellipse
              cx="26"
              cy="36"
              rx="18"
              ry="15.5"
              fill="#FFFDF9"
              stroke="#D81B60"
              strokeWidth="1.75"
            />

            {/* Eyes */}
            <circle cx="20.5" cy="34" r="1.75" fill="#4A4453" />
            <circle cx="31.5" cy="34" r="1.75" fill="#4A4453" />

            {/* Eye sparkle highlights */}
            <circle cx="19.75" cy="33.25" r="0.6" fill="#FFFFFF" />
            <circle cx="30.75" cy="33.25" r="0.6" fill="#FFFFFF" />

            {/* Cute Blush Cheeks */}
            <circle cx="16" cy="38" r="3" fill="#F48FB1" fillOpacity="0.6" />
            <circle cx="36" cy="38" r="3" fill="#F48FB1" fillOpacity="0.6" />

            {/* Nose & Mouth */}
            <path
              d="M26 36.5L25 38H27L26 36.5Z"
              fill="#E91E63"
            />
            <path
              d="M24 39.5C25 41 26 41 26 39.5C26 41 27 41 28 39.5"
              stroke="#880E4F"
              strokeWidth="1.2"
              strokeLinecap="round"
            />

            {/* Cute Front Paws resting */}
            <ellipse cx="21" cy="48" rx="3.5" ry="2.5" fill="#FFFDF9" stroke="#D81B60" strokeWidth="1.5" />
            <ellipse cx="31" cy="48" rx="3.5" ry="2.5" fill="#FFFDF9" stroke="#D81B60" strokeWidth="1.5" />
          </svg>
        </motion.button>
      </div>
    </div>
  );
};
