'use client';

/**
 * dashboard/components/HermesProxy.tsx
 *
 * Phase 63.5 — Hermes Control Interface Proxy
 *
 * Embeds the Node C `hermes-control-interface` (port 8080) as an iframe
 * within the Node B Command Deck. Maintains the VT323/Cyberpunk RED
 * aesthetic with a collapsible panel and connection status indicator.
 *
 * Node C target: NODE_C_HERMES_URL env (default http://10.0.0.30:8080)
 */

import { useState, useEffect, useRef } from 'react';

const HERMES_URL =
  process.env.NEXT_PUBLIC_NODE_C_HERMES_URL ?? 'http://10.0.0.30:8080';

type HermesStatus = 'probing' | 'online' | 'offline';

export default function HermesProxy() {
  const [expanded, setExpanded] = useState(false);
  const [status, setStatus] = useState<HermesStatus>('probing');
  const probeRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Lightweight liveness probe — HEAD the hermes root every 10s
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
    status === 'online' ? 'text-primary' :
    status === 'probing' ? 'text-muted' :
    'text-red-500';

  const statusLabel =
    status === 'online' ? '● H3RM35_ONLINE' :
    status === 'probing' ? '◌ PROBING_NODE_C' :
    '○ H3RM35_OFFLINE';

  return (
    <div className="border border-primary rounded bg-panel">
      {/* Header bar — always visible */}
      <div
        className="flex items-center justify-between p-3 cursor-pointer select-none"
        onClick={() => setExpanded(e => !e)}
      >
        <span className="text-primary tracking-widest text-sm">
          ◈ H3RM35_CTR7_1NT3RF4C3 // NODE_C
        </span>
        <div className="flex items-center gap-4">
          <span className={`text-xs ${statusColor}`}>{statusLabel}</span>
          <span className="text-muted text-xs">{expanded ? '▲ COLLAPSE' : '▼ EXPAND'}</span>
        </div>
      </div>

      {/* Collapsible iframe panel */}
      {expanded && (
        <div className="border-t border-primary">
          {status === 'offline' ? (
            <div className="flex items-center justify-center h-48 text-muted text-sm tracking-widest">
              NODE_C_UNREACHABLE // {HERMES_URL}
            </div>
          ) : (
            <iframe
              src={HERMES_URL}
              title="Hermes Control Interface"
              className="w-full"
              style={{ height: '480px', border: 'none', background: '#0d0d0d' }}
              sandbox="allow-scripts allow-same-origin allow-forms"
            />
          )}
        </div>
      )}
    </div>
  );
}
