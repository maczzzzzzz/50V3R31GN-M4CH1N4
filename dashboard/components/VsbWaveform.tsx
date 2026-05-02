"use client";

import { useEffect, useRef } from "react";

interface Props {
  packetRate: number;
}

const POINTS = 80;

export default function VsbWaveform({ packetRate }: Props) {
  const historyRef = useRef<number[]>(Array(POINTS).fill(0));

  useEffect(() => {
    historyRef.current = [...historyRef.current.slice(1), packetRate];
  }, [packetRate]);

  const data = historyRef.current;
  const maxVal = Math.max(50, ...data); // Clinical baseline

  const W = 1000;
  const H = 100;
  const stepX = W / (POINTS - 1);

  const points = data
    .map((v, i) => {
      const x = i * stepX;
      const y = H - (v / maxVal) * (H - 10);
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <div className="border border-[#333333] bg-[#161616] p-6 shadow-2xl backdrop-blur-xl">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-[#F36622] text-sm font-black tracking-[0.3em] uppercase authority-text flex items-center gap-3">
          <div className="w-2.5 h-2.5 bg-[#F36622] rotate-45" /> VSB_HIGHWAY
        </h2>
        <span className="text-[#E5E5E5] text-[10px] font-black technical-data">
          THROUGHPUT: <span className="text-[#F36622]">{packetRate}</span> PKT/S
        </span>
      </div>

      <div className="bg-[#0A0A0A] border border-[#262626] p-4 relative overflow-hidden">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="w-full h-24"
          preserveAspectRatio="none"
        >
          {/* Grid lines */}
          {[0.25, 0.5, 0.75].map((f) => (
            <line
              key={f}
              x1={0}
              y1={H * f}
              x2={W}
              y2={H * f}
              stroke="#1A1A1A"
              strokeWidth={1}
            />
          ))}

          {/* Waveform fill */}
          <polyline
            points={`0,${H} ${points} ${W},${H}`}
            fill="rgba(243, 102, 34, 0.08)"
            stroke="none"
          />
          {/* Waveform line */}
          <polyline
            points={points}
            fill="none"
            stroke="#F36622"
            strokeWidth={1.5}
            strokeLinejoin="miter"
            strokeLinecap="square"
          />
          {/* Trailing marker */}
          {data.length > 0 && (
            <rect
              x={(POINTS - 1) * stepX - 2}
              y={H - (data[data.length - 1] / maxVal) * (H - 10) - 2}
              width={4}
              height={4}
              fill="#F36622"
              className="animate-pulse"
            />
          )}
        </svg>
        
        {/* Aesthetic scan-line overlay on graph */}
        <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-transparent via-[#F36622]/5 to-transparent opacity-10 animate-scan-line" />
      </div>
    </div>
  );
}
