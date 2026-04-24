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

  const handleBriefView = async () => {
    setView("brief");
    setLoading(true);
    await fetchBrief();
    setLoading(false);
  };

  return (
    <div className="border border-primary rounded p-3 bg-panel">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-primary tracking-widest text-sm">◈ 5YN4P53_GR4PH</span>
        <div className="flex gap-2">
          {(["stats", "search", "brief"] as PanelView[]).map((v) => (
            <button
              key={v}
              onClick={() => { setView(v); if (v === "brief") void handleBriefView(); }}
              className={`text-xs px-2 py-1 border rounded transition-colors ${
                view === v
                  ? "border-primary text-primary"
                  : "border-muted text-muted hover:border-primary hover:text-primary"
              }`}
            >
              {v.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="text-xs text-warning mb-2">[ERR] {error}</div>
      )}

      {/* Stats view */}
      {view === "stats" && stats && (
        <div className="grid grid-cols-2 gap-2 text-xs">
          <StatRow label="OS TRIPLETS" value={stats.triplets} />
          <StatRow label="VEC ROWS" value={stats.vecRows} />
          <StatRow label="CAPTURES" value={stats.captures} />
          <StatRow label="BRIEFS" value={stats.briefs} />
        </div>
      )}

      {/* Search view */}
      {view === "search" && (
        <div>
          <div className="flex gap-2 mb-3">
            <input
              className="flex-1 bg-dim border border-muted text-primary text-xs px-2 py-1 rounded focus:border-primary outline-none font-mono"
              placeholder="search triplets..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") void handleSearch(); }}
            />
            <button
              onClick={() => void handleSearch()}
              disabled={loading}
              className="text-xs px-3 py-1 border border-primary text-primary rounded hover:bg-primary hover:text-background transition-colors disabled:opacity-50"
            >
              {loading ? "..." : "SCAN"}
            </button>
          </div>
          <div className="space-y-1 max-h-48 overflow-y-auto">
            {results.length === 0 && !loading && (
              <div className="text-xs text-muted">no results</div>
            )}
            {results.map((t) => (
              <div key={t.id} className="text-xs font-mono border border-dim rounded px-2 py-1">
                <span className="text-primary">{t.subject_id}</span>
                <span className="text-muted mx-1">→</span>
                <span className="text-warning">{t.predicate}</span>
                <span className="text-muted mx-1">→</span>
                <span className="text-primary">{t.object_literal}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Brief view */}
      {view === "brief" && (
        <div className="text-xs font-mono max-h-64 overflow-y-auto">
          {loading && <div className="text-muted">generating...</div>}
          {!loading && !brief && (
            <div className="text-muted">no brief yet — POST to /api/synapse to capture data</div>
          )}
          {!loading && brief && (
            <div>
              <div className="text-muted mb-1">{new Date(brief.generated_at).toUTCString()}</div>
              <pre className="whitespace-pre-wrap text-primary leading-relaxed">{brief.summary}</pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function StatRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="border border-dim rounded px-2 py-1 flex justify-between items-center">
      <span className="text-muted">{label}</span>
      <span className="text-primary font-mono">{value.toLocaleString()}</span>
    </div>
  );
}
