"use client";

import React, { useState, useEffect, useRef } from 'react';

/**
 * ◈ PRETEXT_COMMAND_ARTERY : COGNITIVE_INTERFACE — v3.8.25
 * 
 * 2-way high-fidelity conversation artery for the Sovereign OS.
 * Clinical industrial interface with geometric typography.
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

    setTimeout(() => {
      setMessages(prev => [...prev, { role: 'agent', content: '::/ACKNOWLEDGE : Processing clinical directive...' }]);
    }, 500);
  };

  return (
    <div className="flex flex-col h-full font-sans text-[11px] text-[#AFAB9C]">
      {/* ◈ MESSAGE_FEED */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-5 space-y-5">
        {messages.map((m, i) => (
          <div key={i} className={`flex flex-col gap-1 ${m.role === 'user' ? 'items-end' : 'items-start'}`}>
            <span className={`text-[8px] font-black uppercase tracking-widest ${m.role === 'user' ? 'text-[#376374]' : 'text-[#836A46]'}`}>
              ::/{m.role.toUpperCase()}
            </span>
            <div className={`max-w-[90%] px-4 py-3 border ${m.role === 'user' ? 'bg-[#376374]/5 border-[#376374]/20 text-[#AFAB9C]' : 'bg-[#161616] border-[#333333] text-[#AFAB9C]'}`}>
              <span className={m.role === 'system' ? 'text-[#FB4934] italic font-bold' : 'technical-data'}>{m.content}</span>
            </div>
          </div>
        ))}
      </div>

      {/* ◈ INPUT_ZONE */}
      <div className="p-4 border-t border-[#333333] bg-[#111111] flex items-center gap-5">
        <span className="text-[#376374] font-black text-[10px] tracking-widest authority-text">Σ:/&gt;</span>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="RAW_DIRECTIVE"
          className="flex-1 bg-transparent border-none outline-none text-[#AFAB9C] placeholder-[#404040] font-sans text-[13px] technical-data"
        />
        <div className="flex gap-3">
          <div className="w-2.5 h-2.5 bg-[#376374] animate-pulse shadow-[0_0_10px_#376374]" title="Artery Active" />
          <div className="w-2.5 h-2.5 bg-[#404040]" title="Perception Offline" />
        </div>
      </div>
    </div>
  );
}
