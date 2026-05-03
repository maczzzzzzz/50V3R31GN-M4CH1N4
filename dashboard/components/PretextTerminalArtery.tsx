"use client";

import React, { useState, useEffect, useRef } from 'react';

/**
 * ◈ PRETEXT_TERMINAL_ARTERY : SYSTEM_LOG_INGRESS — v3.8.25
 * 
 * High-fidelity log ingress for the clinical HUD.
 * Industrial terminal interface with monochromatic technical data.
 */

export default function PretextTerminalArtery() {
  const [logs, setLogs] = useState<any[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // ◈ Artery Stream Ingress (SSE)
    const eventSource = new EventSource('http://localhost:3015/logs');
    
    eventSource.onmessage = (event) => {
      try {
        const entry = JSON.parse(event.data);
        setLogs(prev => [...prev.slice(-150), entry]); // Increased buffer
      } catch (e) {
        // Clinical error suppression
      }
    };

    return () => eventSource.close();
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  const getSeverityColor = (sev: string) => {
    switch (sev) {
      case 'ERROR': return 'text-[#FB4934]';
      case 'WARN': return 'text-[#FABD2F]';
      case 'VETO': return 'text-[#E07A5F] font-black shadow-[0_0_10px_#E07A5F]';
      case 'AUDIT': return 'text-[#C7A87A] italic';
      default: return 'text-[#B8BB26]';
    }
  };

  return (
    <div ref={scrollRef} className="flex flex-col h-full font-sans text-[9px] bg-[#050505] p-3 overflow-y-auto selection:bg-[#E07A5F] selection:text-black">
      {logs.map((entry, i) => (
        <div key={i} className="flex gap-3 py-1 opacity-70 hover:opacity-100 transition-opacity border-b border-[#161616] last:border-none technical-data">
          <span className="text-[#404040] shrink-0 font-black">[{entry.timestamp?.slice(11, 19)}]</span>
          <span className={`${getSeverityColor(entry.severity)} shrink-0 w-10 font-black uppercase tracking-tighter`}>{entry.severity}</span>
          <span className="text-[#A3A3A3] shrink-0 w-14 font-black">[{entry.context.toUpperCase()}]</span>
          <span className="text-[#E5E5E5] break-all leading-tight">{entry.message}</span>
        </div>
      ))}
      {logs.length === 0 && (
        <div className="text-[#404040] font-black tracking-widest p-4 animate-pulse uppercase">Waiting for artery pulse...</div>
      )}
      <div className="w-1.5 h-3 bg-[#E07A5F] animate-pulse mt-2" />
    </div>
  );
}
