"use client";

import { useState } from "react";

export default function SovereignIgnitionTrigger() {
  const [armed, setArmed] = useState(false);
  const [fired, setFired] = useState(false);

  const handleFire = () => {
    if (!armed) {
      setArmed(true);
      setTimeout(() => setArmed(false), 3000);
      return;
    }
    setFired(true);
    // Send IGNITION_PULSE message to parent window (Foundry iframe host)
    window.parent.postMessage({ type: "IGNITION_PULSE", source: "nodestadt-authority" }, "*");
    setTimeout(() => {
      setFired(false);
      setArmed(false);
    }, 2000);
  };

  return (
    <div className="flex flex-col items-center gap-2">
      {armed && !fired && (
        <p className="text-primary text-sm tracking-widest animate-pulse">
          ⚠ C0NF1RM_S3QUENC3 — CLK_4G41N_70_3X3CUT3
        </p>
      )}
      {fired && (
        <p className="text-accent text-sm tracking-widest animate-pulse">
          ◈ IGNITION_PULSE_1N1T14T3D — 4W417ING_F0UNDRY_4CK
        </p>
      )}
      <button
        onClick={handleFire}
        className={`
          px-10 py-3 border-2 rounded text-xl tracking-widest font-mono
          transition-all duration-150
          ${fired
            ? "border-accent bg-accent text-background animate-pulse"
            : armed
            ? "border-primary text-primary border-opacity-100 bg-dim"
            : "border-accent text-accent hover:bg-accent hover:text-background"
          }
        `}
      >
        {fired ? "◈ FIRING..." : armed ? "◈ [CONFIRM] IGNITION_PULSE" : "◈ IGNITION_PULSE"}
      </button>
    </div>
  );
}
