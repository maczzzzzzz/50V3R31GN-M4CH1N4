"use client";

import { TelemetryPacket } from "@/hooks/useSovereignTelemetry";
import { useEffect, useRef, useState } from "react";

interface Props {
  telemetry: TelemetryPacket | null;
}

function ProgressBar({ value, max, label }: { value: number; max: number; label: string }) {
  const pct = Math.min(100, Math.round((value / max) * 100));
  const color = pct > 80 ? "bg-primary" : pct > 50 ? "bg-warning" : "bg-primary";
  return (
    <div className="mb-3">
      <div className="flex justify-between text-sm mb-1">
        <span className="text-muted">{label}</span>
        <span className="text-primary">{pct}%</span>
      </div>
      <div className="w-full bg-dim rounded-sm h-4 overflow-hidden border border-muted">
        <div
          className={`h-full ${color} transition-all duration-300`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

const MAX_LOG_LINES = 8;

export default function KernelMonitor({ telemetry }: Props) {
  const [auditLog, setAuditLog] = useState<string[]>([]);
  const [processorStrain, setProcessorStrain] = useState(0);
  const logRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!telemetry) return;
    // Simulate PR0C3550R_57R41N from payload_len + seq jitter
    const strain = Math.min(100, (telemetry.seq % 100) + telemetry.payload_len % 40);
    setProcessorStrain(strain);

    const entry = `[${new Date(telemetry.ts).toISOString().slice(11, 23)}] PKT#${telemetry.seq} T:0x${telemetry.pkt_type.toString(16).toUpperCase().padStart(2, "0")} I:0x${telemetry.intent_type.toString(16).toUpperCase().padStart(2, "0")}`;
    setAuditLog((prev) => {
      const next = [...prev, entry];
      return next.length > MAX_LOG_LINES ? next.slice(-MAX_LOG_LINES) : next;
    });
  }, [telemetry]);

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [auditLog]);

  return (
    <div className="border border-primary rounded bg-panel p-4">
      <h2 className="text-primary text-xl tracking-widest mb-4">
        ◈ K3RN3L_MN7R [N0D3-4]
      </h2>

      <ProgressBar value={processorStrain} max={100} label="PR0C3550R_57R41N" />
      <ProgressBar value={telemetry ? telemetry.payload_len % 4096 : 0} max={4096} label="M3M0RY_PR355UR3" />

      <div className="mt-4">
        <p className="text-muted text-sm mb-1 tracking-wider">4UD17_L0G</p>
        <div
          ref={logRef}
          className="bg-background border border-dim rounded p-2 h-36 overflow-y-auto text-xs font-mono"
        >
          {auditLog.length === 0 ? (
            <span className="text-muted">— awaiting vsb signal —</span>
          ) : (
            auditLog.map((line, i) => (
              <div key={i} className="text-text-main leading-5">
                <span className="text-primary">▸</span> {line}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
