"use client";

import React, { useState, useEffect, useCallback } from 'react';

/**
 * PRETEXT_MARKET_ARTERY — PHASE 92/93 back-propagation
 * 
 * High-density RED Trade interface using Pretext aesthetics.
 * Handles Night Market generation and item manifestation.
 */

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

export default function PretextMarketArtery() {
  const [markets, setMarkets] = useState<Market[]>([]);
  const [selected, setSelected] = useState<Market | null>(null);
  const [district, setDistrict] = useState(DISTRICTS[0]!);
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
    setStatusMsg("::/ROLLING_MARKET...");
    try {
      const res = await fetch("/api/generate-market", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ district_id: district }),
      });
      if (res.ok) {
        await fetchMarkets();
        setStatusMsg("::/MARKET_GENERATED");
      }
    } catch {
      setStatusMsg("::/ERROR_NODE_B_OFFLINE");
    }
    setTimeout(() => setStatusMsg(""), 3000);
  };

  return (
    <div className="flex flex-col h-full font-mono text-[10px] text-[#ebdbb2]">
      {/* ◈ CONTROL_INGRESS */}
      <div className="p-3 border-b border-[#3c3836] bg-[#282828] flex items-center justify-between">
        <div className="flex gap-4 items-center">
          <span className="text-[#fe8019] font-bold">◈ RED_TRADE_MESH</span>
          <select
            value={district}
            onChange={(e) => setDistrict(e.target.value)}
            className="bg-[#1d2021] border border-[#3c3836] rounded px-2 py-0.5 text-[#b8bb26]"
          >
            {DISTRICTS.map((d) => (
              <option key={d} value={d}>{d.toUpperCase()}</option>
            ))}
          </select>
          <button
            onClick={generateMarket}
            className="px-2 py-0.5 border border-[#fb4934] text-[#fb4934] hover:bg-[#fb4934] hover:text-[#1d2021] transition-all"
          >
            EXECUTE_ROLL
          </button>
        </div>
        <span className="text-[#fabd2f] animate-pulse">{statusMsg}</span>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* ◈ MARKET_LEDGER (Left) */}
        <div className="w-48 border-r border-[#3c3836] overflow-y-auto bg-[#1d2021]">
          {markets.map((m) => (
            <div
              key={m.id}
              onClick={() => setSelected(m)}
              className={`p-2 border-b border-[#3c3836] cursor-pointer transition-colors
                ${selected?.id === m.id ? "bg-[#3c3836] text-[#fe8019]" : "hover:bg-[#282828]"}
              `}
            >
              <div>{m.id.slice(0, 8)}</div>
              <div className="text-[8px] opacity-60">{m.district_id.toUpperCase()}</div>
            </div>
          ))}
        </div>

        {/* ◈ INVENTORY_FLOW (Right) */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1 bg-[#1d2021]">
          {!selected ? (
            <div className="h-full flex items-center justify-center text-[#504945]">
              ::/AWAITING_MARKET_SELECTION
            </div>
          ) : (
            selected.inventory.map((item, i) => (
              <div key={i} className="flex justify-between items-center group hover:bg-[#282828] p-1 rounded transition-all">
                <div className="flex gap-2">
                  <span className={item.is_contraband ? "text-[#fb4934]" : "text-[#ebdbb2]"}>
                    {item.item_name}
                  </span>
                  {item.is_contraband && (
                    <span className="text-[8px] border border-[#fb4934] px-1 text-[#fb4934] opacity-80">CNTRBND</span>
                  )}
                </div>
                <div className="flex gap-4">
                  <span className="text-[#a89984]">×{item.quantity}</span>
                  <span className="text-[#b8bb26] font-bold">{item.price}eb</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
