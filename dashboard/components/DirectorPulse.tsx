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
    // Derive synthetic metrics from live packet data
    const ts = Date.parse(telemetry.ts);
    const now = Date.now();
    setLatency(Math.max(0, Math.min(999, now - ts)));
    // Payload-based VRAM pressure simulation
    setVramUsed((prev) => {
      const delta = (telemetry.payload_len % 512) - 256;
      return Math.max(0, Math.min(vramTotal, prev + delta));
    });
  }, [telemetry, vramTotal]);

  const latencyColor =
    latency < 50 ? "text-primary" : latency < 200 ? "text-warning" : "text-red-500";
  const vramPct = Math.round((vramUsed / vramTotal) * 100);

  return (
    <div className="border border-primary rounded bg-panel p-4">
      <h2 className="text-primary text-xl tracking-widest mb-4">
        ◈ D1R3C70R_PUL53 [N0D3-B]
      </h2>

      {/* Inference latency */}
      <div className="mb-5">
        <p className="text-muted text-sm tracking-wider mb-1">1NF3R3NC3_L473NCY</p>
        <p className={`text-5xl tabular-nums ${latencyColor}`}>
          {latency.toString().padStart(3, "0")}<span className="text-xl">ms</span>
        </p>
      </div>

      {/* VRAM breakdown */}
      <div>
        <div className="flex justify-between text-sm mb-1">
          <span className="text-muted">V15U4L_M3M0RY</span>
          <span className="text-primary">{(vramUsed / 1024).toFixed(1)} / {(vramTotal / 1024).toFixed(0)} GB</span>
        </div>
        <div className="w-full bg-dim rounded-sm h-6 overflow-hidden border border-muted relative">
          <div
            className="h-full bg-primary transition-all duration-500"
            style={{ width: `${vramPct}%` }}
          />
          <span className="absolute inset-0 flex items-center justify-center text-xs text-text-main">
            {vramPct}% 0CCU?13D
          </span>
        </div>
      </div>

      {/* Session/Actor IDs */}
      {telemetry && (
        <div className="mt-4 text-xs font-mono">
          <div className="flex gap-2 mb-1">
            <span className="text-muted">535510N:</span>
            <span className="text-text-main truncate">{telemetry.session_id.slice(0, 16)}…</span>
          </div>
          <div className="flex gap-2">
            <span className="text-muted">4C70R:</span>
            <span className="text-text-main truncate">{telemetry.actor_id.slice(0, 16)}…</span>
          </div>
        </div>
      )}
    </div>
  );
}
