"use client";

import { useEffect, useRef, useState } from "react";
import { useSovereignTelemetry } from "@/hooks/useSovereignTelemetry";

interface RollBreakdown {
  ts: string;
  actor?: string;
  d10: number;
  stat: number;
  skill: number;
  mods: number;
  total: number;
  dv: number;
  success: boolean;
  weapon_category?: string;
  range_bracket?: string;
  raw?: string;
}

function parseRollBreakdown(payload: string): RollBreakdown | null {
  try {
    const p = JSON.parse(payload) as Record<string, unknown>;
    if (p["type"] !== "roll_breakdown" && !("d10" in p)) return null;
    return {
      ts: new Date().toISOString().slice(11, 23),
      actor: (p["actor"] as string | undefined) ?? "UNKNOWN",
      d10: Number(p["d10"] ?? 0),
      stat: Number(p["stat"] ?? 0),
      skill: Number(p["skill"] ?? 0),
      mods: Number(p["mods"] ?? 0),
      total: Number(p["total"] ?? 0),
      dv: Number(p["dv"] ?? 15),
      success: Boolean(p["success"] ?? (Number(p["total"]) >= Number(p["dv"]))),
      weapon_category: (p["weapon_category"] as string | undefined),
      range_bracket: (p["range_bracket"] as string | undefined),
    };
  } catch {
    return null;
  }
}

const MAX_ENTRIES = 20;

export default function CombatOracleLog() {
  const { telemetry, connected } = useSovereignTelemetry("ws://localhost:9090/ws");
  const [rolls, setRolls] = useState<RollBreakdown[]>([]);
  const logRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!telemetry?.payload) return;
    const breakdown = parseRollBreakdown(telemetry.payload);
    if (!breakdown) return;
    setRolls((prev) => {
      const next = [breakdown, ...prev];
      return next.length > MAX_ENTRIES ? next.slice(0, MAX_ENTRIES) : next;
    });
  }, [telemetry]);

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = 0;
  }, [rolls]);

  return (
    <div className="border border-primary rounded bg-panel p-4 h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-primary text-xl tracking-widest">◈ C0MB47_0R4CL3</h2>
        <span className={`text-xs tracking-widest ${connected ? "text-primary" : "text-muted"}`}>
          {connected ? "● N0D3-4_LINK" : "○ OFFLINE"}
        </span>
      </div>

      {/* Legend */}
      <div className="text-xs text-muted tracking-wider mb-3 border-b border-dim pb-2">
        D10 + STAT + SKILL + MODS = TOTAL vs DV
      </div>

      {/* Roll log */}
      <div ref={logRef} className="flex-1 overflow-y-auto space-y-2 min-h-0">
        {rolls.length === 0 ? (
          <div className="text-muted text-sm tracking-widest mt-8 text-center">
            — 4W417ING_C0MB47_5IGN4L —
          </div>
        ) : (
          rolls.map((r, i) => (
            <div
              key={i}
              className={`border rounded p-2 text-xs font-mono ${
                r.success ? "border-primary bg-dim" : "border-muted bg-background"
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-muted">{r.ts}</span>
                <span className={`tracking-widest font-bold ${r.success ? "text-primary" : "text-warning"}`}>
                  {r.success ? "◈ HIT" : "✕ MISS"}
                </span>
              </div>
              {r.actor && (
                <div className="text-muted mb-1">
                  ACT0R: <span className="text-text-main">{r.actor}</span>
                  {r.weapon_category && (
                    <span className="ml-2">[{r.weapon_category} / {r.range_bracket}]</span>
                  )}
                </div>
              )}
              <div className="flex gap-3 text-text-main">
                <span>D10:<span className="text-primary ml-1">{r.d10}</span></span>
                <span>+STAT:<span className="text-text-main ml-1">{r.stat}</span></span>
                <span>+SKILL:<span className="text-text-main ml-1">{r.skill}</span></span>
                {r.mods !== 0 && (
                  <span>+MOD:<span className={`ml-1 ${r.mods > 0 ? "text-primary" : "text-warning"}`}>{r.mods > 0 ? "+" : ""}{r.mods}</span></span>
                )}
                <span className="ml-auto">
                  =<span className="text-primary font-bold ml-1">{r.total}</span>
                  <span className="text-muted mx-1">vs</span>
                  DV<span className="text-warning ml-1">{r.dv}</span>
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Friction monitor footer */}
      <div className="mt-3 pt-3 border-t border-dim">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted tracking-wider">FRICTION_MONITOR</span>
          <div className="flex gap-3">
            <span className="text-primary">
              HITS: {rolls.filter(r => r.success).length}
            </span>
            <span className="text-warning">
              MISS: {rolls.filter(r => !r.success).length}
            </span>
            {rolls.length > 0 && (
              <span className="text-muted">
                ({Math.round((rolls.filter(r => r.success).length / rolls.length) * 100)}% hit)
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
