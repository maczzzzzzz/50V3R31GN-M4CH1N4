"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * ◈ ROOT_GATE : NODESTADT_AUTHORITY — v3.8.25
 */

export default function RootPage() {
  const router = useRouter();

  useEffect(() => {
    router.push("/os");
  }, [router]);

  return (
    <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center font-sans">
      <div className="flex flex-col items-center gap-6">
        <div className="w-16 h-16 border-2 border-[#E07A5F] flex items-center justify-center animate-spin-slow">
           <span className="text-[#E07A5F] text-2xl font-black">Σ</span>
        </div>
        <p className="text-[#E07A5F] animate-pulse tracking-[0.5em] font-black uppercase text-sm authority-text">
          ESTABLISHING_ARTERY_LINK...
        </p>
      </div>
    </div>
  );
}
