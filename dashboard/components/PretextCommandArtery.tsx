"use client";

import React, { useState, useEffect, useRef } from 'react';

/**
 * PRETEXT_COMMAND_ARTERY — PHASE 93.5
 * 
 * 2-way high-fidelity conversation interface for Hermes.
 * Replaces legacy HermesProxy with direct SSE/WebSocket communication.
 */

export default function PretextCommandArtery() {
  const [messages, setMessages] = useState<Array<{role: string, content: string}>>([
    { role: 'system', content: '::/COGNITIVE_INGRESS_LOCKED' }
  ]);
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;
    
    const userMsg = { role: 'user', content: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');

    // TODO: Map to Hermes Singularity /api/hermes/chat
    // In Phase 93, we simulate the agent's response stream
    setTimeout(() => {
      setMessages(prev => [...prev, { role: 'agent', content: '::/ACKNOWLEDGE : Processing directive...' }]);
    }, 500);
  };

  return (
    <div className="flex flex-col h-full font-mono text-[11px] text-[#ebdbb2]">
      {/* ◈ MESSAGE_FEED */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((m, i) => (
          <div key={i} className={`flex gap-2 ${m.role === 'user' ? 'text-[#fe8019]' : 'text-[#ebdbb2]'}`}>
            <span className="opacity-50">::/{m.role.toUpperCase()} :</span>
            <span className={m.role === 'system' ? 'text-[#fb4934] italic' : ''}>{m.content}</span>
          </div>
        ))}
      </div>

      {/* ◈ INPUT_ZONE */}
      <div className="p-3 border-t border-[#3c3836] bg-[#1d2021] flex items-center gap-4">
        <span className="text-[#fb4934] font-bold">STRATEGIST{'>'}</span>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="ENTER_DIRECTIVE..."
          className="flex-1 bg-transparent border-none outline-none text-[#ebdbb2] placeholder-[#504945]"
        />
        <div className="flex gap-2">
          <div className="w-2 h-2 rounded-full bg-[#b8bb26] animate-pulse" title="Artery Active" />
          <div className="w-2 h-2 rounded-full bg-[#3c3836]" title="Vesper Passive" />
        </div>
      </div>
    </div>
  );
}
