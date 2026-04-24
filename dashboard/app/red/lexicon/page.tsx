"use client";

import ItemBrowser from "@/components/ItemBrowser";

export default function LexiconPage() {
  return (
    <main className="min-h-screen bg-background p-4 flex flex-col gap-4">
      <div className="border border-primary rounded p-3 bg-panel flex items-center justify-between">
        <span className="text-primary text-2xl tracking-widest">⬡ 4K45H1K_L3X1C0N</span>
        <span className="text-muted text-xs tracking-widest">C4N0N1C4L_M1RR0R // DB_v4</span>
      </div>
      <div className="flex-1">
        <ItemBrowser />
      </div>
    </main>
  );
}
