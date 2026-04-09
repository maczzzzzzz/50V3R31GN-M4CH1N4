"use client";

import { useState } from "react";

export default function GhostBootTrigger() {
  const [armed, setArmed] = useState(false);
  const [fired, setFired] = useState(false);

  const handleFire = () => {
    if (!armed) {
      setArmed(true);
      setTimeout(() => setArmed(false), 3000);
      return;
    }
    setFired(true);
    // Send GH057_B007 message to parent window (Foundry iframe host)
    window.parent.postMessage({ type: "GH057_B007", source: "shadow-dashboard" }, "*");
    setTimeout(() => {
      setFired(false);
      setArmed(false);
    }, 2000);
  };

  return (
    <div className="flex flex-col items-center gap-2">
      {armed && !fired && (
        <p className="text-warning text-sm tracking-widest animate-pulse">
          ⚠ C0NF1RM_S3QUENC3 — CLK_4G41N_70_3X3CUT3
        </p>
      )}
      {fired && (
        <p className="text-primary text-sm tracking-widest animate-pulse">
          ◈ GH057_B007_1N1T14T3D — 4W417ING_F0UNDRY_4CK
        </p>
      )}
      <button
        onClick={handleFire}
        className={`
          px-10 py-3 border-2 rounded text-xl tracking-widest font-mono
          transition-all duration-150
          ${fired
            ? "border-primary bg-primary text-background animate-pulse"
            : armed
            ? "border-warning text-warning border-opacity-100 bg-dim"
            : "border-primary text-primary hover:bg-primary hover:text-background"
          }
        `}
      >
        {fired ? "◈ FIRING..." : armed ? "◈ [CONFIRM] GH057_B007" : "◈ GH057_B007"}
      </button>
    </div>
  );
}
