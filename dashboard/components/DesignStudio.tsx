"use client";

import React from 'react';

/**
 * ◈ DESIGN_STUDIO : NODESTADT_AUTHORITY — v1.3.1
 * 
 * High-fidelity design-to-code interface powered by Open-Design.
 */
export default function DesignStudio() {
  return (
    <div className="w-full h-full bg-[#1A282F] relative overflow-hidden">
      <iframe 
        src="http://localhost:33359" 
        className="w-full h-full border-none"
        title="Open-Design Studio"
      />
      <div className="absolute top-2 right-4 pointer-events-none">
        <span className="text-[10px] font-black text-[#376374] tracking-[0.2em] authority-text">
          ● DESIGN_STUDIO_ACTIVE
        </span>
      </div>
    </div>
  );
}
