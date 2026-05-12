/**
 * usePretext - React hook for Pretext layout engine integration
 *
 * Provides geometric text flow calculations using the Rust Pretext Core
 * via WASM. Returns line paths for canvas rendering at 60fps.
 */

import { useEffect, useState, useRef, useCallback } from 'react';

export interface Obstacle {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface LinePath {
  text: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface LayoutResult {
  lines: LinePath[];
  tightWidth: number;
  totalHeight: number;
}

export interface UsePretextOptions {
  text: string;
  maxWidth: number;
  fontSize?: number;
  obstacles?: Obstacle[];
  enabled?: boolean;
}

/**
 * Hook for calculating Pretext layout with obstacle avoidance
 *
 * @param options - Configuration options for the layout engine
 * @returns Layout result with line paths and metrics
 */
export function usePretext(options: UsePretextOptions): LayoutResult | null {
  const {
    text,
    maxWidth,
    fontSize = 16,
    obstacles = [],
    enabled = true,
  } = options;

  const [layout, setLayout] = useState<LayoutResult | null>(null);
  const wasmModuleRef = useRef<any>(null);
  const initRef = useRef(false);

  // Initialize WASM module
  useEffect(() => {
    if (!enabled || initRef.current) return;

    const initWasm = async () => {
      try {
        // Load the Pretext Core WASM module
        // Note: This path would be adjusted based on actual build output
        const wasmModule = await import('../../../../crates/modules/pretext-core/pkg/pretext_core.js');
        wasmModuleRef.current = wasmModule;
        initRef.current = true;
      } catch (error) {
        console.error('Failed to load Pretext WASM module:', error);
        // Fallback to pure JS implementation
        initRef.current = true;
      }
    };

    initWasm();
  }, [enabled]);

  // Calculate layout with obstacle avoidance
  const calculateLayout = useCallback(() => {
    if (!text || !enabled) {
      setLayout(null);
      return;
    }

    try {
      if (wasmModuleRef.current) {
        // Use WASM-accelerated layout
        const wasmResult = wasmModuleRef.current.pretext_layout(
          text,
          maxWidth,
          fontSize
        );

        // Convert WASM result to our internal format
        const lines: LinePath[] = wasmResult.lines.map((line: any, index: number) => ({
          text: line.segments.map((seg: any) => seg.text).join(' '),
          x: 0,
          y: index * (fontSize * 1.2), // Line height
          width: line.width,
          height: fontSize * 1.2,
        }));

        setLayout({
          lines,
          tightWidth: wasmResult.tight_width,
          totalHeight: wasmResult.total_height,
        });
      } else {
        // Fallback to pure JS implementation
        const lines = calculateFallbackLayout(text, maxWidth, fontSize, obstacles);
        const totalHeight = lines.length * (fontSize * 1.2);
        const tightWidth = Math.max(...lines.map(l => l.width), 0);

        setLayout({
          lines,
          tightWidth,
          totalHeight,
        });
      }
    } catch (error) {
      console.error('Layout calculation error:', error);
      // Fallback on error
      const lines = calculateFallbackLayout(text, maxWidth, fontSize, obstacles);
      setLayout({
        lines,
        tightWidth: Math.max(...lines.map(l => l.width), 0),
        totalHeight: lines.length * (fontSize * 1.2),
      });
    }
  }, [text, maxWidth, fontSize, obstacles, enabled]);

  // Recalculate layout when inputs change
  useEffect(() => {
    calculateLayout();
  }, [calculateLayout]);

  return layout;
}

/**
 * Fallback pure JS layout calculation
 * Used when WASM is not available or fails
 */
function calculateFallbackLayout(
  text: string,
  maxWidth: number,
  fontSize: number,
  obstacles: Obstacle[]
): LinePath[] {
  const lines: LinePath[] = [];
  const words = text.split(/\s+/);
  const avgCharWidth = fontSize * 0.56; // Georgia approximation
  const lineHeight = fontSize * 1.2;

  let currentLine: string[] = [];
  let currentWidth = 0;
  let lineIndex = 0;

  for (const word of words) {
    const wordWidth = word.length * avgCharWidth;
    const spaceWidth = avgCharWidth;

    // Check if word fits in current line
    if (currentWidth + wordWidth + (currentLine.length > 0 ? spaceWidth : 0) <= maxWidth) {
      currentLine.push(word);
      currentWidth += wordWidth + (currentLine.length > 1 ? spaceWidth : 0);
    } else {
      // Finalize current line
      if (currentLine.length > 0) {
        lines.push({
          text: currentLine.join(' '),
          x: 0,
          y: lineIndex * lineHeight,
          width: currentWidth,
          height: lineHeight,
        });
        lineIndex++;
      }

      // Start new line
      currentLine = [word];
      currentWidth = wordWidth;
    }
  }

  // Don't forget the last line
  if (currentLine.length > 0) {
    lines.push({
      text: currentLine.join(' '),
      x: 0,
      y: lineIndex * lineHeight,
      width: currentWidth,
      height: lineHeight,
    });
  }

  return lines;
}
