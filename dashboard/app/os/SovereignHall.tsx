'use client';

/**
 * SovereignHall.tsx — Phase 80, Task 2
 *
 * 2.5D Isometric agent collaboration visualization.
 * Renders pulsing Thought Nodes on a Gruvbox isometric grid, connected by
 * Data Arteries. Clicking a node opens the live Thought Stream for that agent.
 *
 * Implements without external deps — pure Canvas 2D API + React hooks.
 * Each cell on the iso-grid maps to one agent slot.
 */

import { useCallback, useEffect, useRef, useState } from 'react';

// ── Gruvbox palette ───────────────────────────────────────────────────────────
const GBX = {
  bg:     '#282828',
  bg1:    '#3c3836',
  bg2:    '#504945',
  fg:     '#ebdbb2',
  yellow: '#fabd2f',
  red:    '#cc241d',
  green:  '#98971a',
  blue:   '#458588',
  gray:   '#665c54',
};

// ── Types ─────────────────────────────────────────────────────────────────────

export interface ThoughtNode {
  id: string;
  agentId: string;
  status: 'active' | 'deadlock' | 'resolved' | 'idle';
  thoughtFile?: string;
}

interface IsoCell {
  node: ThoughtNode;
  /** Isometric screen coords */
  sx: number;
  sy: number;
  /** Grid coords */
  gx: number;
  gy: number;
  /** Pulse phase offset (0..2π) */
  phase: number;
}

// ── Isometric math ────────────────────────────────────────────────────────────

function isoProject(gx: number, gy: number, tileW: number, tileH: number, ox: number, oy: number) {
  const sx = ox + (gx - gy) * (tileW / 2);
  const sy = oy + (gx + gy) * (tileH / 2);
  return { sx, sy };
}

// ── Draw helpers ──────────────────────────────────────────────────────────────

function drawIsoTile(
  ctx: CanvasRenderingContext2D,
  sx: number, sy: number,
  tileW: number, tileH: number,
  fill: string, stroke: string,
) {
  const hw = tileW / 2;
  const hh = tileH / 2;
  ctx.beginPath();
  ctx.moveTo(sx,      sy - hh);
  ctx.lineTo(sx + hw, sy);
  ctx.lineTo(sx,      sy + hh);
  ctx.lineTo(sx - hw, sy);
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.strokeStyle = stroke;
  ctx.lineWidth = 1;
  ctx.stroke();
}

function drawNode(
  ctx: CanvasRenderingContext2D,
  sx: number, sy: number,
  radius: number,
  color: string,
  pulse: number,
  label: string,
) {
  // Glow ring
  const glowR = radius + 4 + Math.sin(pulse) * 3;
  const gradient = ctx.createRadialGradient(sx, sy, radius * 0.5, sx, sy, glowR);
  gradient.addColorStop(0, color + 'cc');
  gradient.addColorStop(1, color + '00');
  ctx.beginPath();
  ctx.arc(sx, sy, glowR, 0, Math.PI * 2);
  ctx.fillStyle = gradient;
  ctx.fill();

  // Core node
  ctx.beginPath();
  ctx.arc(sx, sy, radius, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();

  // Label
  ctx.font = '10px VT323, monospace';
  ctx.fillStyle = GBX.fg;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText(label, sx, sy + radius + 4);
}

function drawArtery(
  ctx: CanvasRenderingContext2D,
  ax: number, ay: number,
  bx: number, by: number,
  color: string,
  pulse: number,
) {
  const alpha = 0.3 + 0.2 * Math.sin(pulse);
  ctx.beginPath();
  ctx.moveTo(ax, ay);
  ctx.lineTo(bx, by);
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.5;
  ctx.globalAlpha = alpha;
  ctx.stroke();
  ctx.globalAlpha = 1.0;
}

// ── Status color mapping ──────────────────────────────────────────────────────

function nodeColor(status: ThoughtNode['status']): string {
  switch (status) {
    case 'active':   return GBX.yellow;
    case 'deadlock': return GBX.red;
    case 'resolved': return GBX.green;
    case 'idle':     return GBX.gray;
  }
}

// ── Main Component ────────────────────────────────────────────────────────────

interface SovereignHallProps {
  nodes?: ThoughtNode[];
  traceId?: string;
}

const DEFAULT_NODES: ThoughtNode[] = [
  { id: 'n1', agentId: 'synapse',  status: 'active',   thoughtFile: undefined },
  { id: 'n2', agentId: 'oracle',   status: 'active',   thoughtFile: undefined },
  { id: 'n3', agentId: 'director', status: 'idle',     thoughtFile: undefined },
  { id: 'n4', agentId: 'vesper',   status: 'active',   thoughtFile: undefined },
  { id: 'n5', agentId: 'healer',   status: 'resolved', thoughtFile: undefined },
];

export function SovereignHall({ nodes = DEFAULT_NODES, traceId }: SovereignHallProps) {
  const canvasRef  = useRef<HTMLCanvasElement>(null);
  const animRef    = useRef<number>(0);
  const frameRef   = useRef<number>(0);
  const cellsRef   = useRef<IsoCell[]>([]);

  const [selected, setSelected] = useState<ThoughtNode | null>(null);
  const [thought,  setThought]  = useState<string>('');
  const [loading,  setLoading]  = useState(false);

  // ── Build iso-cell layout ─────────────────────────────────────────────────

  const buildCells = useCallback(
    (w: number, h: number): IsoCell[] => {
      const cols     = Math.min(nodes.length, 4);
      const rows     = Math.ceil(nodes.length / cols);
      const tileW    = 80;
      const tileH    = 40;
      const ox       = w / 2;
      const oy       = h * 0.22 + rows * tileH;
      const cells: IsoCell[] = [];
      nodes.forEach((node, i) => {
        const gx = i % cols;
        const gy = Math.floor(i / cols);
        const { sx, sy } = isoProject(gx, gy, tileW, tileH, ox, oy);
        cells.push({ node, sx, sy, gx, gy, phase: Math.random() * Math.PI * 2 });
      });
      return cells;
    },
    [nodes],
  );

  // ── Animation loop ────────────────────────────────────────────────────────

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      canvas.width  = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
      cellsRef.current = buildCells(canvas.width, canvas.height);
    };
    resize();
    window.addEventListener('resize', resize);

    const tileW = 80;
    const tileH = 40;

    function frame() {
      frameRef.current++;
      const t = frameRef.current * 0.03;
      const cells = cellsRef.current;
      const w = canvas!.width;
      const h = canvas!.height;

      ctx!.clearRect(0, 0, w, h);

      // Background
      ctx!.fillStyle = GBX.bg;
      ctx!.fillRect(0, 0, w, h);

      // Grid tiles
      cells.forEach(c => {
        const tileFill = c.node.status === 'deadlock' ? GBX.bg2 : GBX.bg1;
        drawIsoTile(ctx!, c.sx, c.sy, tileW, tileH, tileFill, GBX.gray);
      });

      // Arteries between adjacent cells (connect horizontally/vertically in grid)
      cells.forEach((a, i) => {
        cells.slice(i + 1).forEach(b => {
          const dx = Math.abs(a.gx - b.gx);
          const dy = Math.abs(a.gy - b.gy);
          if ((dx === 1 && dy === 0) || (dx === 0 && dy === 1)) {
            drawArtery(ctx!, a.sx, a.sy, b.sx, b.sy, GBX.yellow, t + a.phase);
          }
        });
      });

      // Thought nodes
      cells.forEach(c => {
        const color  = nodeColor(c.node.status);
        const radius = 10;
        drawNode(ctx!, c.sx, c.sy - tileH * 0.5, radius, color, t + c.phase, c.node.agentId);
      });

      // Selected highlight
      if (selected) {
        const cell = cells.find(c => c.node.id === selected.id);
        if (cell) {
          ctx!.beginPath();
          ctx!.arc(cell.sx, cell.sy - tileH * 0.5, 16, 0, Math.PI * 2);
          ctx!.strokeStyle = GBX.yellow;
          ctx!.lineWidth = 2;
          ctx!.stroke();
        }
      }

      animRef.current = requestAnimationFrame(frame);
    }

    animRef.current = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener('resize', resize);
    };
  }, [buildCells, nodes, selected]);

  // ── Hit-test click → select node ─────────────────────────────────────────

  const handleClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mx   = e.clientX - rect.left;
    const my   = e.clientY - rect.top;
    const tileH = 40;

    const hit = cellsRef.current.find(c => {
      const nx = c.sx;
      const ny = c.sy - tileH * 0.5;
      return Math.hypot(mx - nx, my - ny) <= 16;
    });

    if (!hit) { setSelected(null); setThought(''); return; }
    setSelected(hit.node);

    // Load thought file if available
    if (hit.node.thoughtFile) {
      setLoading(true);
      fetch(`/api/meetings/${traceId ?? 'latest'}/${hit.node.thoughtFile}`)
        .then(r => r.ok ? r.text() : Promise.reject(r.status))
        .then(t => { setThought(t); setLoading(false); })
        .catch(() => { setThought('(no thought fragment available)'); setLoading(false); });
    } else {
      setThought(`## THOUGHT_FRAGMENT : ${hit.node.agentId}\n- **Status:** ${hit.node.status}\n- **Fragment:** (not yet written)`);
    }
  }, [traceId]);

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col h-full w-full bg-panel border border-primary" style={{ fontFamily: "'VT323', monospace" }}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-primary">
        <span className="text-primary text-lg">◈ SOVEREIGN_HALL</span>
        {traceId && (
          <span className="text-xs opacity-60">trace: {traceId}</span>
        )}
      </div>

      {/* Canvas */}
      <canvas
        ref={canvasRef}
        className="flex-1 cursor-pointer"
        style={{ minHeight: 200 }}
        onClick={handleClick}
      />

      {/* Legend */}
      <div className="flex gap-4 px-4 py-1 border-t border-primary text-xs opacity-70">
        {(['active', 'deadlock', 'resolved', 'idle'] as const).map(s => (
          <span key={s} style={{ color: nodeColor(s) }}>■ {s}</span>
        ))}
        <span className="ml-auto opacity-50">click node to read fragment</span>
      </div>

      {/* Thought Stream panel */}
      {selected && (
        <div className="border-t border-primary px-4 py-3 max-h-48 overflow-y-auto">
          <div className="text-primary text-sm mb-1">◈ THOUGHT STREAM — {selected.agentId}</div>
          {loading ? (
            <div className="opacity-50 animate-pulse">loading fragment…</div>
          ) : (
            <pre className="text-xs opacity-90 whitespace-pre-wrap">{thought}</pre>
          )}
        </div>
      )}
    </div>
  );
}
