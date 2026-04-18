"use client";

import { useCallback, useEffect, useState } from "react";

interface AkashikItem {
  id: string;
  name: string;
  type: string;
  category: string | null;
  cost: number;
  source: string;
  concealable: number;
  reliability: string | null;
}

const ITEM_TYPES = ["", "weapon", "armor", "cyberware", "gear", "program", "ammo", "itemUpgrade"];

export default function ItemBrowser() {
  const [items, setItems] = useState<AkashikItem[]>([]);
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);

  const search = useCallback(async (q: string, type: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: "100" });
      if (q) params.set("q", q);
      if (type) params.set("type", type);
      const res = await fetch(`/api/items?${params}`);
      if (res.ok) {
        const data = (await res.json()) as { items: AkashikItem[]; count: number };
        setItems(data.items);
        setTotal(data.count);
      }
    } catch { /* offline */ }
    setLoading(false);
  }, []);

  // Debounced search
  useEffect(() => {
    const t = setTimeout(() => search(query, typeFilter), 200);
    return () => clearTimeout(t);
  }, [query, typeFilter, search]);

  return (
    <div className="flex flex-col h-full gap-3">
      {/* Search controls */}
      <div className="flex gap-3 items-center">
        <div className="flex-1 relative">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="S34RCH_1T3M5..."
            className="w-full bg-background border border-primary rounded px-3 py-2 text-sm text-text-main font-mono tracking-wider placeholder-muted focus:outline-none focus:border-primary"
          />
          {loading && (
            <span className="absolute right-3 top-2 text-muted text-sm animate-pulse">…</span>
          )}
        </div>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="bg-background border border-muted rounded px-2 py-2 text-sm text-text-main font-mono"
        >
          {ITEM_TYPES.map((t) => (
            <option key={t} value={t}>{t ? t.toUpperCase() : "ALL_7YP35"}</option>
          ))}
        </select>
        <span className="text-muted text-xs tracking-widest whitespace-nowrap">
          {total} 1T3M5
        </span>
      </div>

      {/* Item grid */}
      <div className="flex-1 overflow-y-auto">
        {items.length === 0 && !loading ? (
          <div className="flex items-center justify-center h-48 text-muted tracking-widest text-sm">
            — NO_3NT1T135_FOUND —
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-1">
            {items.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-2 rounded border border-dim bg-panel hover:border-muted transition-colors text-sm font-mono"
              >
                <div className="flex-1 min-w-0">
                  <span className="text-text-main truncate block">{item.name}</span>
                  <div className="flex gap-2 mt-0.5 text-xs">
                    <span className="text-muted">{item.type}</span>
                    {item.category && <span className="text-muted">[{item.category}]</span>}
                    {item.concealable === 1 && (
                      <span className="text-primary">CONCEALABLE</span>
                    )}
                    {item.reliability && (
                      <span className="text-muted">REL:{item.reliability}</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3 ml-4 shrink-0 text-xs">
                  <span className="text-muted">{item.source}</span>
                  <span className="text-primary tabular-nums">{item.cost > 0 ? `${item.cost}eb` : "—"}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
