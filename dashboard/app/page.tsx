"use client";

import KernelMonitor from "@/components/KernelMonitor";
import DirectorPulse from "@/components/DirectorPulse";
import VsbWaveform from "@/components/VsbWaveform";
import GhostBootTrigger from "@/components/GhostBootTrigger";
import { useSovereignTelemetry } from "@/hooks/useSovereignTelemetry";

export default function Dashboard() {
  const { telemetry, connected, packetRate } = useSovereignTelemetry(
    "ws://localhost:9090/ws"
  );

  return (
    <main className="min-h-screen bg-background p-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
      {/* Header */}
      <div className="lg:col-span-2 border border-primary rounded p-3 bg-panel flex items-center justify-between">
        <span className="text-primary text-2xl tracking-widest">
          ◈ 5H4D0W_D45HB04RD [50V3R31GN_MN7R]
        </span>
        <span className={`text-sm ${connected ? "text-primary" : "text-muted"}`}>
          {connected ? "● V5B_L1NK_4CT1V3" : "○ LINK_0FFLIN3"}
        </span>
      </div>

      {/* Node A: Kernel Monitor */}
      <KernelMonitor telemetry={telemetry} />

      {/* Node B: Director Pulse */}
      <DirectorPulse telemetry={telemetry} />

      {/* VSB Waveform — full width */}
      <div className="lg:col-span-2">
        <VsbWaveform packetRate={packetRate} />
      </div>

      {/* Ghost Boot trigger */}
      <div className="lg:col-span-2 flex justify-center">
        <GhostBootTrigger />
      </div>
    </main>
  );
}
