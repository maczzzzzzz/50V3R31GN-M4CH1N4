import { randomUUID } from 'node:crypto';
import type { SynapseStore, SynapseBrief as BriefRecord, SynapseCapture } from '../../db/synapse-store.js';
import type { OsTripletService, TripletWithDistance } from '../../db/os-triplets-service.js';
import type { ILogger } from '../../db/interfaces.js';

export interface BriefOptions {
  /** How many days back to include in the brief (default: 1). */
  days?: number;
  /** Max captures to include in synthesis (default: 50). */
  maxCaptures?: number;
  /** Semantic query to find connections (default: 'system architecture decisions'). */
  connectionQuery?: string;
  /** How many semantic connections to surface (default: 10). */
  topConnections?: number;
}

export interface GeneratedBrief {
  id: string;
  periodStart: string;
  periodEnd: string;
  summary: string;
  connections: TripletWithDistance[];
  captureCount: number;
  tripletCount: number;
}

/**
 * SynapseBrief — JARVIS Connections → Briefs synthesis.
 *
 * Reads recent synapse_captures + semantic triplet connections and produces
 * a structured brief that surfaces non-obvious relationships across session data.
 *
 * The brief format:
 *   ## Sovereign Brief — [period]
 *   ### Recent Activity ([n] captures)
 *   - bullet per unique source
 *   ### Connections ([n] semantic links)
 *   - subject → predicate → object  (distance: d)
 *   ### System State
 *   - key stats
 */
export class SynapseBrief {
  private readonly store: SynapseStore;
  private readonly tripletService: OsTripletService;
  private readonly logger?: ILogger | undefined;

  constructor(store: SynapseStore, tripletService: OsTripletService, logger?: ILogger) {
    this.store = store;
    this.tripletService = tripletService;
    this.logger = logger;
  }

  /**
   * Generate a brief for the specified period and persist it to synapse_briefs.
   */
  async generate(options: BriefOptions = {}): Promise<GeneratedBrief> {
    const traceId = randomUUID();
    const {
      days = 1,
      maxCaptures = 50,
      connectionQuery = 'system architecture decisions sovereign intelligence',
      topConnections = 10,
    } = options;

    const now = new Date();
    const periodEnd   = now.toISOString();
    const periodStart = new Date(now.getTime() - days * 86_400_000).toISOString();

    // 1. Recent captures (text-only — no DB date filter since captures table
    //    may grow slowly; limit is sufficient for lite-mode)
    const captures = this.store.getRecentCaptures(maxCaptures);

    // 2. Semantic connections via vector search
    const connections = await this.tripletService.semanticSearch(connectionQuery, topConnections);

    // 3. Stats
    const stats = this.store.getStats();

    // 4. Render
    const summary = this.renderBrief(periodStart, periodEnd, captures, connections, stats);

    // 5. Persist
    const id = this.store.insertBrief(periodStart, periodEnd, summary, stats.triplets);

    this.logger?.info('SynapseBrief', traceId, `Brief generated: ${id}`, {
      captures: captures.length,
      connections: connections.length,
      triplets: stats.triplets,
    });

    return {
      id,
      periodStart,
      periodEnd,
      summary,
      connections,
      captureCount: captures.length,
      tripletCount: stats.triplets,
    };
  }

  /** Fetch the most recent persisted brief without regenerating. */
  getLatest(): BriefRecord | undefined {
    return this.store.getLatestBrief();
  }

  /** Fetch recent briefs. */
  list(limit = 10): BriefRecord[] {
    return this.store.getBriefs(limit);
  }

  // ── Render ────────────────────────────────────────────────────────────────

  private renderBrief(
    periodStart: string,
    periodEnd: string,
    captures: SynapseCapture[],
    connections: TripletWithDistance[],
    stats: { triplets: number; captures: number; briefs: number; vecRows: number },
  ): string {
    const startLabel = new Date(periodStart).toUTCString();
    const endLabel   = new Date(periodEnd).toUTCString();

    const sourceGroups: Record<string, number> = {};
    for (const c of captures) {
      sourceGroups[c.source] = (sourceGroups[c.source] ?? 0) + 1;
    }
    const activityLines = Object.entries(sourceGroups)
      .map(([src, n]) => `- ${src}: ${n} capture${n > 1 ? 's' : ''}`)
      .join('\n');

    const connectionLines = connections.length > 0
      ? connections
          .map(t => `- \`${t.subject_id}\` → \`${t.predicate}\` → \`${t.object_literal}\`  (dist: ${t.distance.toFixed(4)})`)
          .join('\n')
      : '- No semantic connections found (embed llama-server to activate)';

    return [
      `## Sovereign Brief`,
      `**Period:** ${startLabel} → ${endLabel}`,
      ``,
      `### Recent Activity (${captures.length} captures)`,
      activityLines || '- No recent captures',
      ``,
      `### Semantic Connections (${connections.length} links)`,
      connectionLines,
      ``,
      `### System State`,
      `- os_triplets: ${stats.triplets}`,
      `- vec_os_triplets: ${stats.vecRows}`,
      `- synapse_captures: ${stats.captures}`,
      `- synapse_briefs: ${stats.briefs}`,
      ``,
      `::/5Y573M-N071C3 : BRIEF_GENERATED. // 50V3R31GN-M4CH1N4`,
    ].join('\n');
  }
}
