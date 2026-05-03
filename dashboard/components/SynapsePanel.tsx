"use client";

import { useCallback, useEffect, useState } from "react";

interface SynapseStats {
  triplets: number;
  captures: number;
  briefs: number;
  vecRows: number;
}

interface Triplet {
  id: string;
  subject_id: string;
  predicate: string;
  object_literal: string;
  last_updated: string;
}

interface Brief {
  id: string;
  summary: string;
  generated_at: string;
  triplet_count: number;
}

type PanelView = "stats" | "search" | "brief";

export default function SynapsePanel() {
  const [view, setView] = useState<PanelView>("stats");
  const [stats, setStats] = useState<SynapseStats | null>(null);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Triplet[]>([]);
  const [brief, setBrief] = useState<Brief | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    try {
      const r = await fetch("/api/synapse?action=stats");
      const d = await r.json() as SynapseStats;
      setStats(d);
    } catch {
      setError("stats fetch failed");
    }
  }, []);

  const fetchBrief = useCallback(async () => {
    try {
      const r = await fetch("/api/synapse?action=brief");
      const d = await r.json() as { brief: Brief | null };
      setBrief(d.brief);
    } catch {
      setError("brief fetch failed");
    }
  }, []);

  useEffect(() => {
    void fetchStats();
    const interval = setInterval(() => { void fetchStats(); }, 30_000);
    return () => clearInterval(interval);
  }, [fetchStats]);

  const handleSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const r = await fetch(`/api/synapse?action=search&q=${encodeURIComponent(query)}&limit=10`);
      const d = await r.json() as { results: Triplet[]; mode: string };
      setResults(d.results ?? []);
    } catch {
      setError("search failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="border border-[#333333] bg-[#161616] p-4 shadow-2xl backdrop-blur-xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <span className="text-[#E07A5F] text-xs font-black tracking-[0.3em] uppercase authority-text flex items-center gap-2">
           <div className="w-2 h-2 bg-[#E07A5F]" /> SYNAPSE_GRAPH
        </span>
        <div className="flex gap-3">
          {(["stats", "search", "brief"] as PanelView[]).map((v) => (
            <button
              key={v}
              onClick={() => { setView(v); if (v === "brief") void fetchBrief(); }}
              className={`text-[9px] font-black uppercase tracking-widest px-3 py-1.5 border transition-all duration-300 technical-data ${
                view === v
                  ? "border-[#E07A5F] bg-[#E07A5F] text-[#0A0A0A]"
                  : "border-[#262626] text-[#404040] hover:border-[#E07A5F] hover:text-[#E07A5F]"
              }`}
            >
              {v}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="text-[9px] font-black text-[#FB4934] mb-3 technical-data uppercase">[ERROR] {error}</div>
      )}

      {/* Stats view */}
      {view === "stats" && stats && (
        <div className="grid grid-cols-2 gap-3">
          <StatShard label="CORE TRIPLETS" value={stats.triplets} />
          <StatShard label="VECTOR_ROWS" value={stats.vecRows} />
          <StatShard label="CDP_CAPTURES" value={stats.captures} />
          <StatShard label="SYNAPSE_BRIEFS" value={stats.briefs} />
        </div>
      )}

      {/* Search view */}
      {view === "search" && (
        <div>
          <div className="flex gap-3 mb-4">
            <input
              className="flex-1 bg-[#0A0A0A] border border-[#262626] text-[#E5E5E5] text-[11px] px-4 py-2 rounded-none focus:border-[#E07A5F] outline-none technical-data"
              placeholder="QUERY_TRIPLETS"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") void handleSearch(); }}
            />
            <button
              onClick={() => void handleSearch()}
              disabled={loading}
              className="text-[10px] font-black px-5 py-2 border border-[#E07A5F] text-[#E07A5F] hover:bg-[#E07A5F] hover:text-[#0A0A0A] transition-all disabled:opacity-30 authority-text"
            >
              {loading ? "..." : "SCAN"}
            </button>
          </div>
          <div className="space-y-2 max-h-56 overflow-y-auto">
            {results.length === 0 && !loading && (
              <div className="text-[10px] text-[#404040] italic uppercase font-black tracking-widest text-center py-4">No results in Artery</div>
            )}
            {results.map((t) => (
              <div key={t.id} className="text-[10px] border border-[#262626] bg-[#0A0A0A] p-2.5 technical-data">
                <span className="text-[#E07A5F] font-black">{t.subject_id}</span>
                <span className="text-[#404040] mx-2">→</span>
                <span className="text-[#C7A87A] font-black">{t.predicate}</span>
                <span className="text-[#404040] mx-2">→</span>
                <span className="text-[#E5E5E5]">{t.object_literal}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Brief view */}
      {view === "brief" && (
        <div className="text-[11px] max-h-72 overflow-y-auto bg-[#0A0A0A] border border-[#262626] p-4 technical-data leading-relaxed">
          {loading && <div className="text-[#404040] animate-pulse">GENERATING_BRIEF...</div>}
          {!loading && !brief && (
            <div className="text-[#404040] italic">No active brief shored in Artery.</div>
          )}
          {!loading && brief && (
            <div>
              <div className="text-[#404040] text-[9px] mb-2 font-black border-b border-[#262626] pb-1 uppercase">{new Date(brief.generated_at).toUTCString()}</div>
              <p className="text-[#E5E5E5]">{brief.summary}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function StatShard({ label, value }: { label: string; value: number }) {
  return (
    <div className="border border-[#262626] bg-[#0A0A0A] p-3 flex justify-between items-center shadow-inner">
      <span className="text-[#404040] text-[9px] font-black tracking-widest uppercase authority-text">{label}</span>
      <span className="text-[#E07A5F] text-sm font-black technical-data">{value.toLocaleString()}</span>
    </div>
  );
}
