/**
 * KineticThoughtStream - Canvas-based thought stream component
 *
 * Renders text using the Pretext "Zero-DOM" paradigm with geometric flow.
 * Text reflows around obstacles (like Node Status icons) without DOM thrashing.
 */

import { useRef, useEffect } from 'react';
import { usePretext, Obstacle } from '../../hooks/usePretext';

interface KineticThoughtStreamProps {
  text: string;
  maxWidth?: number;
  fontSize?: number;
  obstacles?: Obstacle[];
  className?: string;
  onAnimationComplete?: () => void;
}

/**
 * KineticThoughtStream renders text with Pretext layout engine
 * using canvas for high-performance rendering (60fps)
 */
export function KineticThoughtStream({
  text,
  maxWidth = 800,
  fontSize = 16,
  obstacles = [],
  className = '',
  onAnimationComplete,
}: KineticThoughtStreamProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const layout = usePretext({
    text,
    maxWidth,
    fontSize,
    obstacles,
    enabled: true,
  });

  // Render to canvas when layout changes
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !layout) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas dimensions
    canvas.width = layout.tightWidth + 20; // Add padding
    canvas.height = layout.totalHeight + 20;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Set font
    ctx.font = `${fontSize}px Georgia, serif`;
    ctx.fillStyle = '#AFAB9C'; // Sovereign Machina text color
    ctx.textBaseline = 'top';

    // Render each line
    let animationFrame: number;
    let lineIndex = 0;

    const animateLines = () => {
      if (lineIndex >= layout.lines.length) {
        onAnimationComplete?.();
        return;
      }

      const line = layout.lines[lineIndex];

      // Draw line with subtle fade-in animation
      ctx.globalAlpha = 0;
      const fadeIn = () => {
        ctx.globalAlpha += 0.05;
        if (ctx.globalAlpha < 1) {
          ctx.clearRect(line.x, line.y - 10, line.width + 100, line.height + 20);
          ctx.globalAlpha = ctx.globalAlpha;
          ctx.fillText(line.text, line.x + 10, line.y + 10);
          requestAnimationFrame(fadeIn);
        } else {
          ctx.globalAlpha = 1;
          ctx.fillText(line.text, line.x + 10, line.y + 10);
          lineIndex++;
          requestAnimationFrame(animateLines);
        }
      };

      fadeIn();
    };

    animationFrame = requestAnimationFrame(animateLines);

    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
    };
  }, [layout, fontSize, onAnimationComplete]);

  return (
    <div className={`kinetic-thought-stream ${className}`}>
      <canvas
        ref={canvasRef}
        className="w-full h-auto"
        style={{
          imageRendering: 'crisp-edges',
        }}
      />
      <style jsx>{`
        .kinetic-thought-stream canvas {
          display: block;
        }
      `}</style>
    </div>
  );
}

/**
 * Static thought stream without animation
 * Useful for pre-rendered content
 */
export function StaticThoughtStream({
  text,
  maxWidth = 800,
  fontSize = 16,
  obstacles = [],
  className = '',
}: Omit<KineticThoughtStreamProps, 'onAnimationComplete'>) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const layout = usePretext({
    text,
    maxWidth,
    fontSize,
    obstacles,
    enabled: true,
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !layout) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas dimensions
    canvas.width = layout.tightWidth + 20;
    canvas.height = layout.totalHeight + 20;

    // Clear and render
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.font = `${fontSize}px Georgia, serif`;
    ctx.fillStyle = '#AFAB9C';
    ctx.textBaseline = 'top';

    // Render all lines immediately
    layout.lines.forEach((line) => {
      ctx.fillText(line.text, line.x + 10, line.y + 10);
    });
  }, [layout, fontSize]);

  return (
    <div className={`static-thought-stream ${className}`}>
      <canvas ref={canvasRef} className="w-full h-auto" />
    </div>
  );
}
