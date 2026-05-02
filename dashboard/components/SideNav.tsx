"use client";

/**
 * ◈ SIDE_NAV : NODESTADT_AUTHORITY — v3.8.25
 * 
 * Clinical navigation artery for the Sovereign OS.
 */

import Link from "next/link";
import { usePathname } from "next/navigation";

const OS_NAV = [
  { href: "/os", label: "COMMAND_DECK", glyph: "Σ" },
];

export default function SideNav() {
  const path = usePathname();
  const profile = "SOVEREIGN_OS"; 

  return (
    <nav className="w-48 min-h-screen bg-[#111111] border-r border-[#333333] flex flex-col pt-8 gap-2 shrink-0 z-50">
      <div className="px-6 mb-8">
        <p className="text-[#F36622] text-[10px] font-black tracking-[0.4em] uppercase authority-text">
          NODESTADT
        </p>
        <p className="text-[#A3A3A3] text-[8px] font-black tracking-[0.2em] uppercase technical-data">
          AUTHORITY_OS
        </p>
      </div>

      <div className="mb-6">
        <p className="px-6 text-[9px] text-[#404040] font-black tracking-[0.3em] mb-4 uppercase authority-text">SYSTEM_ARTERY</p>
        {OS_NAV.map(({ href, label, glyph }) => {
          const active = path.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`
                mx-3 px-4 py-3 text-[10px] tracking-[0.2em] font-black uppercase technical-data
                flex items-center gap-3 transition-all duration-300
                ${active 
                  ? "bg-[#F36622] text-[#0A0A0A] shadow-[0_0_15px_rgba(243,102,34,0.4)]" 
                  : "text-[#A3A3A3] hover:text-[#F36622] hover:bg-[#1A1A1A]"}
              `}
            >
              <span className="text-sm">{glyph}</span>
              <span>{label}</span>
            </Link>
          );
        })}
      </div>

      <div className="mt-auto px-6 pb-6">
        <div className="border-t border-[#333333] pt-6">
          <p className="text-[#F36622] text-[9px] font-black tracking-widest technical-data">v3.8.25-CLINICAL</p>
          <p className="text-[#404040] text-[8px] font-black tracking-widest technical-data">CLEAN_BASE_ACTIVE</p>
        </div>
      </div>
    </nav>
  );
}
