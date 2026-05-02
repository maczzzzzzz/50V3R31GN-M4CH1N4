'use client';

/**
 * ◈ HERMES_PROXY : CONTROL_PLANE — v3.8.25
 * 
 * Embeds the Node C clinical control interface.
 * Zero-Trust compliant gateway.
 */

import { useState, useEffect, useRef } from 'react';

const HERMES_URL =
  process.env.NEXT_PUBLIC_NODE_C_HERMES_URL ?? 'http://10.0.0.30:8080';

type HermesStatus = 'probing' | 'online' | 'offline';

export default function HermesProxy() {
  const [expanded, setExpanded] = useState(false);
  const [status, setStatus] = useState<HermesStatus>('probing');
  const probeRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const probe = async () => {
      try {
        const res = await fetch(HERMES_URL, { method: 'HEAD', signal: AbortSignal.timeout(2500) });
        setStatus(res.ok ? 'online' : 'offline');
      } catch {
        setStatus('offline');
      }
    };

    probe();
    probeRef.current = setInterval(probe, 10_000);
    return () => { if (probeRef.current) clearInterval(probeRef.current); };
  }, []);

  const statusColor =
    status === 'online' ? 'text-[#F36622]' :
    status === 'probing' ? 'text-[#404040]' :
    'text-[#FB4934]';

  const statusLabel =
    status === 'online' ? '● HERMES_READY' :
    status === 'probing' ? '◌ PROBING_ARTERY' :
    '○ ARTERY_ISOLATED';

  return (
    <div className="border border-[#333333] bg-[#161616] shadow-2xl backdrop-blur-xl">
      {/* Header bar */}
      <div
        className="flex items-center justify-between p-4 cursor-crosshair select-none bg-[#111111]"
        onClick={() => setExpanded(e => !e)}
      >
        <span className="text-[#F36622] font-black tracking-widest text-xs uppercase authority-text">
          ◈ HERMES_CONTROL_PLANE // NODE_C
        </span>
        <div className="flex items-center gap-6">
          <span className={`text-[10px] font-black uppercase technical-data ${statusColor}`}>{statusLabel}</span>
          <span className="text-[#404040] text-[9px] font-black uppercase technical-data">{expanded ? '▲ RETRACT' : '▼ DEPLOY'}</span>
        </div>
      </div>

      {/* Collapsible iframe panel */}
      {expanded && (
        <div className="border-t border-[#333333]">
          {status === 'offline' ? (
            <div className="flex items-center justify-center h-48 text-[#404040] text-[10px] font-black tracking-[0.3em] uppercase authority-text animate-pulse italic">
              ARTERY_UNREACHABLE // {HERMES_URL}
            </div>
          ) : (
            <iframe
              src={HERMES_URL}
              title="Hermes Control Interface"
              className="w-full"
              style={{ height: '500px', border: 'none', background: '#050505' }}
              sandbox="allow-scripts allow-same-origin allow-forms"
            />
          )}
        </div>
      )}
    </div>
  );
}
