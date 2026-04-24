"use client";

import MarketTerminal from "@/components/MarketTerminal";

export default function EconomyPage() {
  return (
    <main className="min-h-screen bg-background p-4 flex flex-col gap-4">
      <div className="border border-primary rounded p-3 bg-panel flex items-center justify-between">
        <span className="text-primary text-2xl tracking-widest">₿ 3C0N0MY_C0MM4ND</span>
        <span className="text-muted text-xs tracking-widest">1D10_C473G0RY // 1D100_17EM // C0N7R4B4ND_74G</span>
      </div>
      <div className="flex-1">
        <MarketTerminal />
      </div>
    </main>
  );
}
