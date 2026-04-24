"use client";

import CombatOracleLog from "@/components/CombatOracleLog";

export default function CombatPage() {
  return (
    <main className="min-h-screen bg-background p-4 flex flex-col gap-4">
      <div className="border border-primary rounded p-3 bg-panel flex items-center justify-between">
        <span className="text-primary text-2xl tracking-widest">⚔ C0MB47_4R73RY [N0D3-4]</span>
        <span className="text-muted text-xs tracking-widest">RUST_K3RN3L // CPU_F4LLB4CK</span>
      </div>
      <div className="flex-1">
        <CombatOracleLog />
      </div>
    </main>
  );
}
