"use client";

import { TelemetryPacket } from "@/hooks/useSovereignTelemetry";
import { useEffect, useRef, useState } from "react";

interface Props {
  telemetry: TelemetryPacket | null;
}

function ProgressBar({ value, max, label }: { value: number; max: number; label: string }) {
  const pct = Math.min(100, Math.round((value / max) * 100));
  const color = pct > 85 ? "bg-[#FB4934]" : "bg-[#F36622]";
  return (
    <div className="mb-4">
      <div className="flex justify-between text-[10px] font-black uppercase tracking-widest mb-1.5 technical-data">
        <span className="text-[#404040]">{label}</span>
        <span className="text-[#F36622]">{pct}%</span>
      </div>
      <div className="w-full bg-[#111111] h-3 overflow-hidden border border-[#262626]">
        <div
          className={`h-full ${color} transition-all duration-500`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

const MAX_LOG_LINES = 12;

export default function KernelMonitor({ telemetry }: Props) {
  const [auditLog, setAuditLog] = useState<string[]>([]);
  const [processorStrain, setProcessorStrain] = useState(0);
  const logRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!telemetry) return;
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
    <div className="border border-[#333333] bg-[#161616] p-6 shadow-2xl backdrop-blur-xl">
      <h2 className="text-[#F36622] text-sm font-black tracking-[0.3em] mb-6 uppercase authority-text flex items-center gap-3">
        <div className="w-2.5 h-2.5 bg-[#F36622] rotate-45" /> KERNEL_MONITOR [NODE_A]
      </h2>

      <ProgressBar value={processorStrain} max={100} label="PROCESSOR_STRAIN" />
      <ProgressBar value={telemetry ? telemetry.payload_len % 4096 : 0} max={4096} label="ARTERY_PRESSURE" />

      <div className="mt-6">
        <p className="text-[#404040] text-[9px] font-black mb-2 tracking-widest uppercase authority-text">AUDIT_ARTERY</p>
        <div
          ref={logRef}
          className="bg-[#0A0A0A] border border-[#262626] p-3 h-40 overflow-y-auto text-[10px] font-mono technical-data leading-relaxed"
        >
          {auditLog.length === 0 ? (
            <span className="text-[#404040] italic tracking-widest uppercase animate-pulse">Waiting for artery link...</span>
          ) : (
            auditLog.map((line, i) => (
              <div key={i} className="text-[#E5E5E5] border-b border-[#161616] py-1 last:border-none">
                <span className="text-[#F36622] font-black mr-2">Σ</span> {line}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
