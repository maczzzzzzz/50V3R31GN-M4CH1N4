'use client';

/**
 * dashboard/app/shroud/useShroud.ts
 *
 * Phase 64 — useShroud React Hook
 *
 * Mounts the ShroudEngine on a canvas ref and exposes a `pulse()` callback.
 * Designed to wrap the full-screen HUD overlay canvas.
 *
 * Usage:
 *   const { canvasRef, pulse } = useShroud();
 *   <canvas ref={canvasRef} className="shroud-overlay" />
 *   <button onClick={() => pulse({ type: 'combat', origin: [0.5, 0.3] })}>Fire</button>
 */

import { useEffect, useRef, useCallback } from 'react';

type PulseType = 'vsb' | 'combat' | 'economy' | 'alert';

interface PulseOpts {
  type?: PulseType;
  /** NDC origin [x, y] ∈ [0,1] */
  origin?: [number, number];
  /** Opacity multiplier 0–1 */
  intensity?: number;
}

interface ShroudHandle {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  /** Fire a GLSL pulse at the given NDC origin */
  pulse: (opts?: PulseOpts) => void;
  /** Set scan-line intensity (0–1) */
  setScanIntensity: (v: number) => void;
}

export function useShroud(): ShroudHandle {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  // Engine is stored as a ref so React doesn't re-render on mount
  const engineRef = useRef<import('./shroud-engine.js').ShroudEngine | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let engine: import('./shroud-engine.js').ShroudEngine | null = null;

    // Async import keeps Three.js out of the SSR bundle
    import('./shroud-engine.js').then(({ ShroudEngine }) => {
      engine = new ShroudEngine(canvas);
      engine.start();
      engineRef.current = engine;
    });

    return () => {
      engine?.dispose();
      engineRef.current = null;
    };
  }, []);

  const pulse = useCallback((opts?: PulseOpts) => {
    engineRef.current?.pulse(opts ?? {});
  }, []);

  const setScanIntensity = useCallback((v: number) => {
    engineRef.current?.setScanIntensity(v);
  }, []);

  return { canvasRef, pulse, setScanIntensity };
}
