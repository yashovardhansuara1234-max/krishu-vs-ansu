import React, { useEffect, useRef, useState, useCallback } from 'react';

export type PetalDensity = 'gentle' | 'breezy' | 'off';

interface Petal {
  x: number;
  y: number;
  size: number;
  width: number;
  height: number;
  type: 'sakura' | 'rose' | 'bud';
  baseColor: string;
  tipColor: string;
  fallSpeed: number;
  swaySpeed: number;
  swayAmp: number;
  swayPhase: number;
  rotZ: number;
  rotSpeedZ: number;
  pitch: number;
  pitchSpeed: number;
  roll: number;
  rollSpeed: number;
  opacity: number;
  depth: 'fg' | 'mg' | 'bg'; // foreground, midground, background
}

// Sophisticated pastel palettes for diverse soft flower petals
const PETAL_PALETTES = [
  // Sakura Soft Pink
  { base: 'rgba(251, 113, 133, 0.75)', tip: 'rgba(254, 205, 211, 0.55)' },
  // Delicate Rose Pastel
  { base: 'rgba(244, 114, 182, 0.70)', tip: 'rgba(252, 231, 243, 0.50)' },
  // Warm Peach Blossom
  { base: 'rgba(253, 164, 175, 0.68)', tip: 'rgba(255, 237, 213, 0.52)' },
  // Soft Lavender Lilac
  { base: 'rgba(216, 180, 254, 0.65)', tip: 'rgba(243, 232, 255, 0.48)' },
  // Creamy Rose Gold Pearl
  { base: 'rgba(254, 205, 211, 0.72)', tip: 'rgba(255, 241, 242, 0.58)' },
  // Champagne Blush
  { base: 'rgba(244, 143, 177, 0.70)', tip: 'rgba(255, 247, 237, 0.55)' },
];

export const PetalDriftBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [density, setDensity] = useState<PetalDensity>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('krishu_petal_density') as PetalDensity;
      if (saved && (saved === 'gentle' || saved === 'breezy' || saved === 'off')) {
        return saved;
      }
    }
    return 'gentle';
  });

  const [showControlTip, setShowControlTip] = useState(false);
  const mousePosRef = useRef<{ x: number; y: number; active: boolean }>({
    x: -1000,
    y: -1000,
    active: false,
  });

  // Cycle density between gentle, breezy, and off
  const cycleDensity = useCallback(() => {
    setDensity((prev) => {
      const next: PetalDensity =
        prev === 'gentle' ? 'breezy' : prev === 'breezy' ? 'off' : 'gentle';
      try {
        localStorage.setItem('krishu_petal_density', next);
      } catch {
        // Ignore quota/access errors
      }
      return next;
    });
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    if (density === 'off') {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      return;
    }

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    // Scale canvas for sharp retina / high-DPI displays
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.scale(dpr, dpr);

    const handleResize = () => {
      if (!canvas) return;
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.scale(dpr, dpr);
    };

    window.addEventListener('resize', handleResize);

    // Track mouse movement for subtle air breeze
    const handleMouseMove = (e: MouseEvent) => {
      mousePosRef.current = {
        x: e.clientX,
        y: e.clientY,
        active: true,
      };
    };

    const handleMouseLeave = () => {
      mousePosRef.current.active = false;
    };

    window.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseleave', handleMouseLeave);

    // Number of petals depending on density
    // Mobile gets slightly fewer for maximum frame rate
    const isMobile = width < 768;
    const count =
      density === 'breezy'
        ? isMobile
          ? 35
          : 50
        : isMobile
        ? 22
        : 32;

    const createPetal = (initialYRandom = true): Petal => {
      const depthRoll = Math.random();
      const depth: 'fg' | 'mg' | 'bg' =
        depthRoll > 0.75 ? 'fg' : depthRoll > 0.25 ? 'mg' : 'bg';

      const sizeScale = depth === 'fg' ? 1.25 : depth === 'mg' ? 1.0 : 0.65;
      const baseSize = (11 + Math.random() * 8) * sizeScale;
      const palette =
        PETAL_PALETTES[Math.floor(Math.random() * PETAL_PALETTES.length)];
      const types: ('sakura' | 'rose' | 'bud')[] = ['sakura', 'sakura', 'rose', 'bud'];
      const type = types[Math.floor(Math.random() * types.length)];

      return {
        x: Math.random() * (width + 100) - 50,
        y: initialYRandom ? Math.random() * (height + 100) - 50 : -40 - Math.random() * 60,
        size: baseSize,
        width: baseSize * (0.8 + Math.random() * 0.4),
        height: baseSize * (1.1 + Math.random() * 0.4),
        type,
        baseColor: palette.base,
        tipColor: palette.tip,
        fallSpeed: (0.45 + Math.random() * 0.65) * (depth === 'fg' ? 1.2 : depth === 'mg' ? 1.0 : 0.75),
        swaySpeed: 0.012 + Math.random() * 0.016,
        swayAmp: 1.2 + Math.random() * 1.8,
        swayPhase: Math.random() * Math.PI * 2,
        rotZ: Math.random() * Math.PI * 2,
        rotSpeedZ: (Math.random() - 0.5) * 0.015,
        pitch: Math.random() * Math.PI * 2,
        pitchSpeed: 0.008 + Math.random() * 0.018,
        roll: Math.random() * Math.PI * 2,
        rollSpeed: 0.006 + Math.random() * 0.014,
        opacity: (depth === 'fg' ? 0.85 : depth === 'mg' ? 0.70 : 0.45) * (0.8 + Math.random() * 0.4),
        depth,
      };
    };

    const petals: Petal[] = Array.from({ length: count }, () => createPetal(true));

    let lastTime = performance.now();
    let ambientWind = 0.25;

    // Draw single organic petal with realistic curved silhouette & gradient
    const renderPetal = (p: Petal) => {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotZ);

      // Simulate 3D tumbling via cosine projection
      const scaleX = Math.cos(p.pitch);
      const scaleY = Math.sin(p.roll) * 0.4 + 0.6;
      ctx.scale(scaleX, scaleY);

      // Depth blur simulation for background petals
      ctx.globalAlpha = p.opacity;

      const w = p.width;
      const h = p.height;

      // Radial/Linear soft shading from base to tip
      const grad = ctx.createLinearGradient(0, h * 0.45, 0, -h * 0.45);
      grad.addColorStop(0, p.baseColor);
      grad.addColorStop(1, p.tipColor);
      ctx.fillStyle = grad;

      ctx.beginPath();
      if (p.type === 'sakura') {
        // Authentic Sakura notched petal
        ctx.moveTo(0, h * 0.45); // Tapered base
        ctx.bezierCurveTo(-w * 0.55, h * 0.2, -w * 0.55, -h * 0.28, -w * 0.25, -h * 0.45);
        // Notched center tip
        ctx.quadraticCurveTo(0, -h * 0.35, w * 0.25, -h * 0.45);
        ctx.bezierCurveTo(w * 0.55, -h * 0.28, w * 0.55, h * 0.2, 0, h * 0.45);
      } else if (p.type === 'rose') {
        // Soft rounded rose petal
        ctx.moveTo(0, h * 0.45);
        ctx.bezierCurveTo(-w * 0.55, h * 0.28, -w * 0.55, -h * 0.35, 0, -h * 0.48);
        ctx.bezierCurveTo(w * 0.55, -h * 0.35, w * 0.55, h * 0.28, 0, h * 0.45);
      } else {
        // Delicate teardrop bud
        ctx.moveTo(0, h * 0.4);
        ctx.bezierCurveTo(-w * 0.4, h * 0.12, -w * 0.4, -h * 0.3, 0, -h * 0.42);
        ctx.bezierCurveTo(w * 0.4, -h * 0.3, w * 0.4, h * 0.12, 0, h * 0.4);
      }
      ctx.closePath();
      ctx.fill();

      // Subtle translucent inner fold line
      ctx.beginPath();
      ctx.moveTo(0, h * 0.38);
      ctx.quadraticCurveTo(w * 0.08, 0, 0, -h * 0.22);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
      ctx.lineWidth = Math.max(0.6, w * 0.05);
      ctx.stroke();

      ctx.restore();
    };

    // Main animation loop
    const animate = (time: number) => {
      const dt = Math.min((time - lastTime) / 1000, 0.1);
      lastTime = time;

      // Slow sinusoidal ambient breeze shifts over time
      ambientWind = 0.25 + Math.sin(time * 0.0004) * 0.35;

      ctx.clearRect(0, 0, width, height);

      const mouse = mousePosRef.current;

      for (let i = 0; i < petals.length; i++) {
        const p = petals[i];

        // Horizontal sway + ambient wind drift
        p.swayPhase += p.swaySpeed;
        const swayForce = Math.sin(p.swayPhase) * p.swayAmp;
        p.x += (ambientWind + swayForce) * (60 * dt);

        // Vertical fall with subtle breathing speed
        const fallForce = p.fallSpeed + Math.cos(p.swayPhase * 0.7) * (p.fallSpeed * 0.25);
        p.y += fallForce * (60 * dt);

        // 3D rotations
        p.rotZ += p.rotSpeedZ;
        p.pitch += p.pitchSpeed;
        p.roll += p.rollSpeed;

        // Interactive air displacement from cursor
        if (mouse.active) {
          const dx = p.x - mouse.x;
          const dy = p.y - mouse.y;
          const distSq = dx * dx + dy * dy;
          const maxDist = 110;
          if (distSq < maxDist * maxDist && distSq > 1) {
            const dist = Math.sqrt(distSq);
            const force = (1 - dist / maxDist) * 1.8;
            p.x += (dx / dist) * force;
            p.y += (dy / dist) * force;
            p.rotSpeedZ += (Math.random() - 0.5) * 0.01;
          }
        }

        // Boundary wrap: smooth respawn when drifting out of frame
        if (p.y > height + 40) {
          p.y = -30 - Math.random() * 20;
          p.x = Math.random() * (width + 60) - 30;
          p.swayPhase = Math.random() * Math.PI * 2;
        } else if (p.x > width + 50) {
          p.x = -40;
        } else if (p.x < -50) {
          p.x = width + 40;
        }

        renderPetal(p);
      }

      animationFrameId = requestAnimationFrame(animate);
    };

    animationFrameId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [density]);

  return (
    <>
      {/* 
        Full-Screen Petals Canvas:
        Mounted with fixed positioning, pointer-events-none, and z-15
        so it drifts gracefully over view backgrounds throughout all views,
        without ever blocking clicks, scroll, or UI controls.
      */}
      <canvas
        ref={canvasRef}
        className="fixed inset-0 pointer-events-none z-15 select-none"
        aria-hidden="true"
      />

      {/* 
        Aesthetic Ambient Petal Control (Bottom Right):
        Ultra-minimalist, translucent floating pill allowing the user to
        seamlessly toggle between Gentle Drift, Breezy, or Off.
      */}
      <div
        className="fixed bottom-3 right-3 z-30 select-none group/petal"
        onMouseEnter={() => setShowControlTip(true)}
        onMouseLeave={() => setShowControlTip(false)}
      >
        <button
          onClick={cycleDensity}
          aria-label={`Petals background animation: currently ${density}. Click to toggle mode.`}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/70 hover:bg-white/95 backdrop-blur-md border border-pink-200/70 text-[10px] font-mono text-pink-700 shadow-xs hover:shadow-md transition-all active:scale-95 cursor-pointer"
        >
          <span className="text-xs transition-transform duration-300 group-hover/petal:rotate-12">
            {density === 'off' ? '🍃' : density === 'breezy' ? '🌸' : '🌸'}
          </span>
          <span className="capitalize hidden sm:inline font-medium">
            {density === 'off' ? 'Petals: Off' : density === 'breezy' ? 'Breezy' : 'Petals'}
          </span>
        </button>

        {/* Tooltip hint on hover */}
        {showControlTip && (
          <div className="absolute bottom-8 right-0 mb-1 px-2.5 py-1 rounded-lg bg-zinc-900/90 text-white text-[9px] font-mono whitespace-nowrap shadow-lg backdrop-blur-xs pointer-events-none transition-opacity">
            <span>
              Mode: {density} (Click: Gentle → Breezy → Off)
            </span>
          </div>
        )}
      </div>
    </>
  );
};
