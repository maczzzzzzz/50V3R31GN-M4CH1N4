"use client";

import dynamic from "next/dynamic";
const PretextShroud = dynamic(() => import("./PretextShroud"), { ssr: false });

/**
 * ◈ COMMAND_DECK : NODESTADT_AUTHORITY — v3.8.25
 * 
 * Root entry point for the clinical Sovereign OS interface.
 */

export default function DashboardPage() {
  return (
    <main className="min-h-screen bg-[#1A282F] selection:bg-[#376374] selection:text-black">
      <PretextShroud />
    </main>
  );
}
