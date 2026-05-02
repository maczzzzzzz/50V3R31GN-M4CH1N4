"use client";

import { TelemetryPacket } from "@/hooks/useSovereignTelemetry";
import { useEffect, useState } from "react";

interface Props {
  telemetry: TelemetryPacket | null;
}

export default function DirectorPulse({ telemetry }: Props) {
  const [latency, setLatency] = useState(0);
  const [vramUsed, setVramUsed] = useState(0);
  const [vramTotal] = useState(16384); // 16GB Node B VRAM

  useEffect(() => {
    if (!telemetry) return;
    const ts = Date.parse(telemetry.ts);
    const now = Date.now();
    setLatency(Math.max(0, Math.min(999, now - ts)));
    setVramUsed((prev) => {
      const delta = (telemetry.payload_len % 512) - 256;
      return Math.max(0, Math.min(vramTotal, prev + delta));
    });
  }, [telemetry, vramTotal]);

  const latencyColor =
    latency < 80 ? "text-[#F36622]" : latency < 300 ? "text-[#FABD2F]" : "text-[#FB4934]";
  const vramPct = Math.round((vramUsed / vramTotal) * 100);

  return (
    <div className="border border-[#333333] bg-[#161616] p-6 shadow-2xl backdrop-blur-xl">
      <h2 className="text-[#F36622] text-sm font-black tracking-[0.3em] mb-6 uppercase authority-text flex items-center gap-3">
        <div className="w-2.5 h-2.5 bg-[#F36622] rotate-45" /> DIRECTOR_PULSE [NODE_B]
      </h2>

      {/* Inference latency */}
      <div className="mb-6">
        <p className="text-[#404040] text-[9px] font-black tracking-widest mb-1.5 uppercase authority-text">COGNITIVE_LATENCY</p>
        <p className={`text-6xl font-black tabular-nums tracking-tighter ${latencyColor}`}>
          {latency.toString().padStart(3, "0")}<span className="text-xl ml-1">ms</span>
        </p>
      </div>

      {/* VRAM breakdown */}
      <div>
        <div className="flex justify-between text-[10px] font-black uppercase tracking-widest mb-2 technical-data">
          <span className="text-[#404040]">VISUAL_MEMORY</span>
          <span className="text-[#F36622]">{(vramUsed / 1024).toFixed(1)} / {(vramTotal / 1024).toFixed(0)} GB</span>
        </div>
        <div className="w-full bg-[#111111] h-8 overflow-hidden border border-[#262626] relative">
          <div
            className="h-full bg-[#F36622] transition-all duration-700 shadow-[0_0_15px_rgba(243,102,34,0.3)]"
            style={{ width: `${vramPct}%` }}
          />
          <span className="absolute inset-0 flex items-center justify-center text-[9px] font-black tracking-[0.2em] text-[#E5E5E5] uppercase technical-data">
            {vramPct}% SATURATION
          </span>
        </div>
      </div>

      {/* Session/Actor IDs */}
      {telemetry && (
        <div className="mt-6 space-y-2">
          <div className="flex justify-between items-center bg-[#0A0A0A] p-2 border border-[#262626]">
            <span className="text-[#404040] text-[8px] font-black tracking-widest uppercase authority-text">ARTERY_ID</span>
            <span className="text-[#E5E5E5] text-[10px] technical-data truncate ml-4">{telemetry.session_id.slice(0, 24)}</span>
          </div>
          <div className="flex justify-between items-center bg-[#0A0A0A] p-2 border border-[#262626]">
            <span className="text-[#404040] text-[8px] font-black tracking-widest uppercase authority-text">ENTITY_ID</span>
            <span className="text-[#E5E5E5] text-[10px] technical-data truncate ml-4">{telemetry.actor_id.slice(0, 24)}</span>
          </div>
        </div>
      )}
    </div>
  );
}
