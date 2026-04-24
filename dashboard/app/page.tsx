"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function RootPage() {
  const router = useRouter();

  useEffect(() => {
    router.push("/os");
  }, [router]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center font-mono">
      <p className="text-primary animate-pulse tracking-widest">
        ◈ R3D_V01D :: ROUTING_TO_OS...
      </p>
    </div>
  );
}
