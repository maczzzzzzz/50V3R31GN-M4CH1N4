"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const OS_NAV = [
  { href: "/os", label: "INTEL_HUD", glyph: "◈" },
];

const RED_NAV = [
  { href: "/red/combat", label: "4R73RY", glyph: "⚔" },
  { href: "/red/economy", label: "M4RK37", glyph: "₿" },
  { href: "/red/lexicon", label: "L3X1C0N", glyph: "⬡" },
];

export default function SideNav() {
  const path = usePathname();
  // TODO: Fetch profile from API or local state. Defaulting to OS for sociotomy proof.
  const profile = "SOVEREIGN_OS"; 

  return (
    <nav className="w-40 min-h-screen bg-panel border-r border-primary flex flex-col pt-6 gap-1 shrink-0">
      <div className="px-3 mb-5">
        <p className="text-primary text-xs tracking-widest opacity-60">
          50V3R31GN
        </p>
        <p className="text-primary text-xs tracking-widest opacity-60">
          M4CH1N4
        </p>
      </div>

      <div className="mb-4">
        <p className="px-3 text-[10px] text-muted tracking-[0.2em] mb-2">SYSTEM_OS</p>
        {OS_NAV.map(({ href, label, glyph }) => {
          const active = path.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`
                mx-2 px-3 py-2 rounded text-sm tracking-widest font-mono
                flex items-center gap-2 transition-colors duration-100
                ${active ? "bg-primary text-background" : "text-muted hover:text-primary hover:bg-dim"}
              `}
            >
              <span>{glyph}</span>
              <span>{label}</span>
            </Link>
          );
        })}
      </div>

      {profile === "RED_DIRECTOR" || profile === "SOVEREIGN_OS" ? (
        <div>
          <p className="px-3 text-[10px] text-muted tracking-[0.2em] mb-2">SIM_SHARD</p>
          {RED_NAV.map(({ href, label, glyph }) => {
            const active = path.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={`
                  mx-2 px-3 py-2 rounded text-sm tracking-widest font-mono
                  flex items-center gap-2 transition-colors duration-100
                  ${active ? "bg-primary text-background" : "text-muted hover:text-primary hover:bg-dim"}
                `}
              >
                <span>{glyph}</span>
                <span>{label}</span>
              </Link>
            );
          })}
        </div>
      ) : null}

      <div className="mt-auto px-3 pb-4">
        <div className="border-t border-muted pt-3">
          <p className="text-muted text-xs tracking-widest">v3.4.1</p>
          <p className="text-muted text-xs">PH453_71</p>
        </div>
      </div>
    </nav>
  );
}

