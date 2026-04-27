"use client";

import React, { useState, useEffect, useRef } from 'react';

/**
 * PRETEXT_TERMINAL_ARTERY — v3.8.7
 * 
 * High-fidelity log ingress for the Pretext Shroud.
 * Renders the unified JSON artery stream (data/logs/artery.json).
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
        setLogs(prev => [...prev.slice(-100), entry]); // Keep last 100 entries
      } catch (e) {
        console.error("::/ARTERY_INGRESS_ERROR", e);
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
      case 'ERROR': return 'text-[#fb4934]';
      case 'WARN': return 'text-[#fabd2f]';
      case 'VETO': return 'text-[#d3869b] font-bold';
      default: return 'text-[#b8bb26]';
    }
  };

  return (
    <div ref={scrollRef} className="flex flex-col h-full font-mono text-[9px] bg-black p-2 overflow-y-auto selection:bg-[#fb4934] selection:text-black">
      {logs.map((entry, i) => (
        <div key={i} className="flex gap-2 py-0.5 opacity-80 hover:opacity-100 transition-opacity border-b border-[#1d2021] last:border-none">
          <span className="text-[#a89984] shrink-0">[{entry.timestamp?.slice(11, 19)}]</span>
          <span className={`${getSeverityColor(entry.severity)} shrink-0 w-8`}>{entry.severity}</span>
          <span className="text-[#83a598] shrink-0 w-12">[{entry.context}]</span>
          <span className="text-[#ebdbb2] break-all">{entry.message}</span>
        </div>
      ))}
      <div className="text-[#fe8019] animate-pulse">_</div>
    </div>
  );
}
