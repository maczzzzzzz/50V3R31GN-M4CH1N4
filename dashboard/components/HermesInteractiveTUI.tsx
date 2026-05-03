'use client';

/**
 * ◈ HERMES_INTERACTIVE_TUI : PYTHON_SHARD_INGRESS — v3.8.28-GOLD
 * 
 * Embeds the high-fidelity Python Hermes Agent TUI.
 * Direct bridge to the sidecars/hermes-agent-nous dashboard.
 */

import { useState, useEffect, useRef } from 'react';

const HERMES_DASHBOARD_URL = 'http://localhost:9119/chat';

type HermesStatus = 'probing' | 'online' | 'offline';

export default function HermesInteractiveTUI() {
  const [status, setStatus] = useState<HermesStatus>('probing');
  const probeRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const probe = async () => {
      try {
        // Use a small fetch to probe the port
        const res = await fetch('http://localhost:9119/api/health', { 
            method: 'GET', 
            signal: AbortSignal.timeout(1500) 
        }).catch(() => null);
        
        setStatus(res?.ok ? 'online' : 'offline');
      } catch {
        setStatus('offline');
      }
    };

    probe();
    probeRef.current = setInterval(probe, 5000);
    return () => { if (probeRef.current) clearInterval(probeRef.current); };
  }, []);

  const statusColor =
    status === 'online' ? 'text-[#B8BB26]' :
    status === 'probing' ? 'text-[#404040]' :
    'text-[#FB4934]';

  const statusLabel =
    status === 'online' ? '● HERMES_CORE_ACTIVE' :
    status === 'probing' ? '◌ CONNECTING_TO_SHARD' :
    '○ PYTHON_SHARD_OFFLINE';

  return (
    <div className="h-full flex flex-col border border-[#333333] bg-[#050505] shadow-2xl overflow-hidden group">
      {/* Header bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-[#111111] border-b border-[#161616]">
        <div className="flex items-center gap-3">
          <div className={`w-1.5 h-1.5 rounded-full ${status === 'online' ? 'bg-[#B8BB26] animate-pulse' : 'bg-[#404040]'}`} />
          <span className="text-[#E5E5E5] font-black tracking-widest text-[9px] uppercase authority-text">
            HERMES_INTERACTIVE_TERMINAL // v0.12.0
          </span>
        </div>
        <span className={`text-[8px] font-black uppercase technical-data ${statusColor}`}>{statusLabel}</span>
      </div>

      <div className="flex-1 relative">
        {status === 'offline' ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-[#404040] gap-4">
             <div className="text-[10px] font-black tracking-[0.3em] uppercase authority-text animate-pulse">
               ARTERY_ISOLATED
             </div>
             <div className="text-[8px] technical-data opacity-50">Ensure 'hermes dashboard --tui' is running on port 9119</div>
          </div>
        ) : (
          <iframe
            src={HERMES_DASHBOARD_URL}
            title="Hermes Interactive TUI"
            className="w-full h-full"
            style={{ border: 'none', background: '#050505' }}
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
          />
        )}
      </div>
      
      {/* Status Bar */}
      <div className="h-1 bg-[#161616]">
        {status === 'online' && <div className="h-full bg-[#B8BB26]/30 w-full animate-pulse" />}
      </div>
    </div>
  );
}
