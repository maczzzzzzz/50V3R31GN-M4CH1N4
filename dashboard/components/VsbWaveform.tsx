"use client";

import { useEffect, useRef } from "react";

interface Props {
  packetRate: number;
}

const POINTS = 60;

export default function VsbWaveform({ packetRate }: Props) {
  const historyRef = useRef<number[]>(Array(POINTS).fill(0));

  useEffect(() => {
    historyRef.current = [...historyRef.current.slice(1), packetRate];
  }, [packetRate]);

  const data = historyRef.current;
  const maxVal = Math.max(1, ...data);

  const W = 800;
  const H = 80;
  const stepX = W / (POINTS - 1);

  const points = data
    .map((v, i) => {
      const x = i * stepX;
      const y = H - (v / maxVal) * (H - 4);
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <div className="border border-primary rounded bg-panel p-4">
      <div className="flex justify-between items-center mb-2">
        <h2 className="text-primary text-xl tracking-widest">◈ V5B_H1GHW4Y</h2>
        <span className="text-text-main text-sm">
          <span className="text-primary">{packetRate}</span> PKT/S
        </span>
      </div>

      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full h-20"
        preserveAspectRatio="none"
        aria-label="VSB packet rate waveform"
      >
        {/* Grid lines */}
        {[0.25, 0.5, 0.75].map((f) => (
          <line
            key={f}
            x1={0}
            y1={H * f}
            x2={W}
            y2={H * f}
            stroke="#1a1a2e"
            strokeWidth={1}
          />
        ))}

        {/* Waveform fill */}
        <polyline
          points={`0,${H} ${points} ${W},${H}`}
          fill="rgba(255,0,60,0.12)"
          stroke="none"
        />
        {/* Waveform line */}
        <polyline
          points={points}
          fill="none"
          stroke="#ff003c"
          strokeWidth={2}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        {/* Trailing dot at current value */}
        {data.length > 0 && (
          <circle
            cx={(POINTS - 1) * stepX}
            cy={H - (data[data.length - 1] / maxVal) * (H - 4)}
            r={3}
            fill="#ff003c"
          />
        )}
      </svg>
    </div>
  );
}
