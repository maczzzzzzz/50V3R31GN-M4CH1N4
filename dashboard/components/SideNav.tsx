"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV = [
  { href: "/",        label: "D45HB04RD", glyph: "◈" },
  { href: "/combat",  label: "4R73RY",    glyph: "⚔" },
  { href: "/economy", label: "M4RK37",    glyph: "₿" },
  { href: "/lexicon", label: "L3X1C0N",   glyph: "⬡" },
];

export default function SideNav() {
  const path = usePathname();

  return (
    <nav className="w-40 min-h-screen bg-panel border-r border-primary flex flex-col pt-6 gap-1 shrink-0">
      <div className="px-3 mb-5">
        <p className="text-primary text-xs tracking-widest opacity-60">50V3R31GN</p>
        <p className="text-primary text-xs tracking-widest opacity-60">M4CH1N4</p>
      </div>

      {NAV.map(({ href, label, glyph }) => {
        const active = path === href;
        return (
          <Link
            key={href}
            href={href}
            className={`
              mx-2 px-3 py-2 rounded text-sm tracking-widest font-mono
              flex items-center gap-2 transition-colors duration-100
              ${active
                ? "bg-primary text-background"
                : "text-muted hover:text-primary hover:bg-dim"
              }
            `}
          >
            <span>{glyph}</span>
            <span>{label}</span>
          </Link>
        );
      })}

      <div className="mt-auto px-3 pb-4">
        <div className="border-t border-muted pt-3">
          <p className="text-muted text-xs tracking-widest">v3.2.15</p>
          <p className="text-muted text-xs">PH453_61</p>
        </div>
      </div>
    </nav>
  );
}
