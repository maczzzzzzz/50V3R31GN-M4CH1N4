"use client";

import { useCallback, useEffect, useState } from "react";

interface InventoryEntry {
  item_id: string;
  item_name: string;
  quantity: number;
  is_contraband: boolean;
  price: number;
}

interface Market {
  id: string;
  district_id: string;
  vendor_npc_id: string;
  inventory: InventoryEntry[];
  status: string;
}

const DISTRICTS = ["watson", "westbrook", "heywood", "pacifica", "santo-domingo", "city-center"];

export default function MarketTerminal() {
  const [markets, setMarkets] = useState<Market[]>([]);
  const [selected, setSelected] = useState<Market | null>(null);
  const [district, setDistrict] = useState(DISTRICTS[0]!);
  const [loading, setLoading] = useState(false);
  const [manifesting, setManifesting] = useState<string | null>(null);
  const [statusMsg, setStatusMsg] = useState("");

  const fetchMarkets = useCallback(async () => {
    const res = await fetch("/api/markets");
    if (res.ok) {
      const data = (await res.json()) as { markets: Market[] };
      setMarkets(data.markets);
    }
  }, []);

  useEffect(() => { fetchMarkets(); }, [fetchMarkets]);

  const generateMarket = async () => {
    setLoading(true);
    setStatusMsg("◈ ROLLING_MARKET...");
    try {
      const res = await fetch("/api/generate-market", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ district_id: district }),
      });
      if (res.ok) {
        await fetchMarkets();
        setStatusMsg("◈ MARKET_GENERATED");
      } else {
        setStatusMsg("✕ GENERATION_FAILED");
      }
    } catch {
      setStatusMsg("✕ NODE_B_OFFLINE");
    }
    setLoading(false);
    setTimeout(() => setStatusMsg(""), 3000);
  };

  const manifestVendor = (marketId: string) => {
    setManifesting(marketId);
    // Dispatch deploy command to Foundry via parent postMessage bridge
    window.parent.postMessage(
      { type: "CMD_DEPLOY_VENDOR", marketId, source: "shadow-dashboard" },
      "*"
    );
    setStatusMsg(`◈ VENDOR_MANIFEST_SENT [${marketId.slice(0, 8)}]`);
    setTimeout(() => {
      setManifesting(null);
      setStatusMsg("");
    }, 2500);
  };

  return (
    <div className="flex gap-4 h-full">
      {/* Left: controls + market list */}
      <div className="w-72 shrink-0 flex flex-col gap-3">
        {/* Generate controls */}
        <div className="border border-primary rounded bg-panel p-3">
          <h3 className="text-primary text-sm tracking-widest mb-3">◈ MARKET_G3N3R470R</h3>
          <div className="mb-3">
            <label className="text-muted text-xs tracking-wider block mb-1">D15TR1CT</label>
            <select
              value={district}
              onChange={(e) => setDistrict(e.target.value)}
              className="w-full bg-background border border-muted rounded px-2 py-1 text-sm text-text-main font-mono"
            >
              {DISTRICTS.map((d) => (
                <option key={d} value={d}>{d.toUpperCase()}</option>
              ))}
            </select>
          </div>
          <button
            onClick={generateMarket}
            disabled={loading}
            className={`w-full py-2 border-2 rounded text-sm tracking-widest font-mono transition-all
              ${loading
                ? "border-muted text-muted cursor-wait"
                : "border-primary text-primary hover:bg-primary hover:text-background"
              }`}
          >
            {loading ? "ROLLING..." : "▶ R0LL_M4RK37"}
          </button>
          {statusMsg && (
            <p className="mt-2 text-xs tracking-wider text-primary animate-pulse">{statusMsg}</p>
          )}
        </div>

        {/* Market list */}
        <div className="border border-muted rounded bg-panel p-3 flex-1 overflow-y-auto">
          <h3 className="text-muted text-xs tracking-widest mb-2">R3C3NT_M4RK375</h3>
          {markets.length === 0 ? (
            <p className="text-muted text-xs">— no markets generated —</p>
          ) : (
            <div className="space-y-2">
              {markets.map((m) => (
                <button
                  key={m.id}
                  onClick={() => setSelected(m)}
                  className={`w-full text-left p-2 rounded border text-xs font-mono transition-colors
                    ${selected?.id === m.id
                      ? "border-primary bg-dim text-primary"
                      : "border-dim text-muted hover:border-muted hover:text-text-main"
                    }`}
                >
                  <div className="truncate">{m.id.slice(0, 12)}…</div>
                  <div className="text-muted mt-0.5">{m.district_id.toUpperCase()} · {m.inventory.length} items</div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right: selected market inventory */}
      <div className="flex-1 border border-primary rounded bg-panel p-4 flex flex-col">
        {!selected ? (
          <div className="flex-1 flex items-center justify-center text-muted tracking-widest text-sm">
            — SELECT_M4RK37_70_1NSP3CT —
          </div>
        ) : (
          <>
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-primary tracking-widest">
                  ◈ {selected.district_id.toUpperCase()} M4RK37
                </h3>
                <p className="text-muted text-xs mt-1">
                  ID: {selected.id.slice(0, 16)}… · VNDR: {selected.vendor_npc_id.slice(0, 12)}…
                </p>
              </div>
              <button
                onClick={() => manifestVendor(selected.id)}
                disabled={manifesting === selected.id}
                className={`px-4 py-2 border-2 rounded text-sm tracking-widest font-mono transition-all
                  ${manifesting === selected.id
                    ? "border-warning text-warning animate-pulse"
                    : "border-primary text-primary hover:bg-primary hover:text-background"
                  }`}
              >
                {manifesting === selected.id ? "MANIFESTING..." : "▶ M4N1F357"}
              </button>
            </div>

            {/* Inventory grid */}
            <div className="flex-1 overflow-y-auto">
              <div className="grid grid-cols-1 gap-2">
                {selected.inventory.map((entry, i) => (
                  <div
                    key={i}
                    className={`flex items-center justify-between p-2 rounded border text-sm font-mono
                      ${entry.is_contraband
                        ? "border-warning bg-background text-warning"
                        : "border-dim bg-background text-text-main"
                      }`}
                  >
                    <div>
                      <span className={entry.is_contraband ? "text-warning" : "text-text-main"}>
                        {entry.item_name}
                      </span>
                      {entry.is_contraband && (
                        <span className="ml-2 text-xs border border-warning rounded px-1">CNTRBND</span>
                      )}
                    </div>
                    <div className="flex gap-4 text-xs text-right">
                      <span className="text-muted">×{entry.quantity}</span>
                      <span className="text-primary">{entry.price}eb</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
