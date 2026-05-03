'use client';

/**
 * ◈ SOVEREIGN_HALL : CLINICAL_VISUALIZER — v3.8.25
 *
 * 2.5D Isometric agent collaboration visualization.
 * Industrial retro-futuristic interface.
 */

import { useCallback, useEffect, useRef, useState } from 'react';

// ── NODESTADT palette ─────────────────────────────────────────────────────────
const NDS = {
  bg:     '#0A0A0A',
  bg1:    '#161616',
  bg2:    '#262626',
  fg:     '#E5E5E5',
  accent: '#E07A5F',
  gold:   '#C7A87A',
  dim:    '#404040',
  red:    '#FB4934',
  green:  '#B8BB26',
};

export interface ThoughtNode {
  id: string;
  agentId: string;
  status: 'active' | 'deadlock' | 'resolved' | 'idle';
  thoughtFile?: string;
}

interface IsoCell {
  node: ThoughtNode;
  sx: number;
  sy: number;
  gx: number;
  gy: number;
  phase: number;
}

function isoProject(gx: number, gy: number, tileW: number, tileH: number, ox: number, oy: number) {
  const sx = ox + (gx - gy) * (tileW / 2);
  const sy = oy + (gx + gy) * (tileH / 2);
  return { sx, sy };
}

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
  const glowR = radius + 6 + Math.sin(pulse) * 4;
  const gradient = ctx.createRadialGradient(sx, sy, radius * 0.2, sx, sy, glowR);
  gradient.addColorStop(0, color + 'aa');
  gradient.addColorStop(1, color + '00');
  
  ctx.beginPath();
  ctx.arc(sx, sy, glowR, 0, Math.PI * 2);
  ctx.fillStyle = gradient;
  ctx.fill();

  ctx.beginPath();
  ctx.arc(sx, sy, radius, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();

  ctx.font = '900 10px "Space Grotesk"';
  ctx.fillStyle = NDS.fg;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText(label.toUpperCase(), sx, sy + radius + 6);
}

function drawArtery(
  ctx: CanvasRenderingContext2D,
  ax: number, ay: number,
  bx: number, by: number,
  color: string,
  pulse: number,
) {
  const alpha = 0.2 + 0.15 * Math.sin(pulse);
  ctx.beginPath();
  ctx.moveTo(ax, ay);
  ctx.lineTo(bx, by);
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.globalAlpha = alpha;
  ctx.stroke();
  ctx.globalAlpha = 1.0;
}

function nodeColor(status: ThoughtNode['status']): string {
  switch (status) {
    case 'active':   return NDS.accent;
    case 'deadlock': return NDS.red;
    case 'resolved': return NDS.green;
    case 'idle':     return NDS.dim;
  }
}

interface SovereignHallProps {
  nodes?: ThoughtNode[];
  traceId?: string;
}

const DEFAULT_NODES: ThoughtNode[] = [
  { id: 'n1', agentId: 'synapse',  status: 'active',   thoughtFile: undefined },
  { id: 'n2', agentId: 'oracle',   status: 'active',   thoughtFile: undefined },
  { id: 'n3', agentId: 'director', status: 'idle',     thoughtFile: undefined },
  { id: 'n4', agentId: 'heavy',    status: 'active',   thoughtFile: undefined },
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

  const buildCells = useCallback(
    (w: number, h: number): IsoCell[] => {
      const cols     = Math.min(nodes.length, 4);
      const rows     = Math.ceil(nodes.length / cols);
      const tileW    = 100;
      const tileH    = 50;
      const ox       = w / 2;
      const oy       = h * 0.25 + rows * tileH;
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

    const tileW = 100;
    const tileH = 50;

    function frame() {
      frameRef.current++;
      const t = frameRef.current * 0.02;
      const cells = cellsRef.current;
      const w = canvas!.width;
      const h = canvas!.height;

      ctx!.clearRect(0, 0, w, h);
      ctx!.fillStyle = NDS.bg;
      ctx!.fillRect(0, 0, w, h);

      cells.forEach(c => {
        const tileFill = c.node.status === 'deadlock' ? NDS.bg2 : NDS.bg1;
        drawIsoTile(ctx!, c.sx, c.sy, tileW, tileH, tileFill, NDS.dim);
      });

      cells.forEach((a, i) => {
        cells.slice(i + 1).forEach(b => {
          const dx = Math.abs(a.gx - b.gx);
          const dy = Math.abs(a.gy - b.gy);
          if ((dx === 1 && dy === 0) || (dx === 0 && dy === 1)) {
            drawArtery(ctx!, a.sx, a.sy, b.sx, b.sy, NDS.accent, t + a.phase);
          }
        });
      });

      cells.forEach(c => {
        const color  = nodeColor(c.node.status);
        const radius = 12;
        drawNode(ctx!, c.sx, c.sy - tileH * 0.5, radius, color, t + c.phase, c.node.agentId);
      });

      if (selected) {
        const cell = cells.find(c => c.node.id === selected.id);
        if (cell) {
          ctx!.beginPath();
          ctx!.arc(cell.sx, cell.sy - tileH * 0.5, 20, 0, Math.PI * 2);
          ctx!.strokeStyle = NDS.accent;
          ctx!.lineWidth = 2;
          ctx!.setLineDash([5, 5]);
          ctx!.stroke();
          ctx!.setLineDash([]);
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

  const handleClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mx   = e.clientX - rect.left;
    const my   = e.clientY - rect.top;
    const tileH = 50;

    const hit = cellsRef.current.find(c => {
      const nx = c.sx;
      const ny = c.sy - tileH * 0.5;
      return Math.hypot(mx - nx, my - ny) <= 20;
    });

    if (!hit) { setSelected(null); setThought(''); return; }
    setSelected(hit.node);

    if (hit.node.thoughtFile) {
      setLoading(true);
      fetch(`/api/meetings/${traceId ?? 'latest'}/${hit.node.thoughtFile}`)
        .then(r => r.ok ? r.text() : Promise.reject(r.status))
        .then(t => { setThought(t); setLoading(false); })
        .catch(() => { setThought('(no thought fragment available)'); setLoading(false); });
    } else {
      setThought(`## THOUGHT_FRAGMENT : ${hit.node.agentId}\n- **Status:** ${hit.node.status}\n- **Fragment:** (stream offline)`);
    }
  }, [traceId]);

  return (
    <div className="flex flex-col h-full w-full bg-[#111111] border border-[#333333] font-sans">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-[#333333] bg-[#0A0A0A]">
        <span className="text-[#E07A5F] font-black tracking-widest text-sm uppercase authority-text">◈ SOVEREIGN_HALL</span>
        {traceId && (
          <span className="text-[10px] text-[#A3A3A3] technical-data">ID: {traceId}</span>
        )}
      </div>

      {/* Canvas */}
      <canvas
        ref={canvasRef}
        className="flex-1 cursor-crosshair"
        style={{ minHeight: 250 }}
        onClick={handleClick}
      />

      {/* Legend */}
      <div className="flex gap-6 px-6 py-2 border-t border-[#333333] text-[9px] font-black uppercase technical-data">
        {(['active', 'deadlock', 'resolved', 'idle'] as const).map(s => (
          <span key={s} style={{ color: nodeColor(s) }}>• {s}</span>
        ))}
      </div>

      {/* Thought Stream panel */}
      {selected && (
        <div className="border-t border-[#333333] px-6 py-4 max-h-56 overflow-y-auto bg-[#0A0A0A]/80 backdrop-blur-md">
          <div className="text-[#E07A5F] text-xs font-black mb-2 tracking-widest uppercase authority-text">◈ THOUGHT_STREAM : {selected.agentId}</div>
          {loading ? (
            <div className="text-[#A3A3A3] technical-data animate-pulse italic">Retrieving fragment…</div>
          ) : (
            <pre className="text-[11px] text-[#E5E5E5] whitespace-pre-wrap leading-relaxed technical-data">{thought}</pre>
          )}
        </div>
      )}
    </div>
  );
}
