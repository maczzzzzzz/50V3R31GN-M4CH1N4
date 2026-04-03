/**
 * src/core/mission-swarm-orchestrator.ts
 *
 * MissionSwarmOrchestrator — Phase 13 Concurrent Mission Generation
 *
 * Concurrently dispatches isolated reasoning tasks to:
 *   - Node A (Rules Intel via ClawLink RPC)
 *   - Ollama (Tactical Analysis via HTTP fetch)
 * Then fuses results with lore anchors from crush.db session history.
 */

import type { IClawLinkClient } from '../api/clawlink-client.js';
import type { UnifiedOracleClient } from '../db/unified-oracle-client.js';

export interface MissionSwarmConfig {
  /** ClawLink client for Node A Rules Intel RPC. */
  clawlink: IClawLinkClient;
  /** Oracle for lore anchor queries against crush.db session history. */
  oracle: UnifiedOracleClient;
  /** Model base URL for tactical analysis (Ollama endpoint). */
  tacticsUrl: string;
}

export interface MissionBlueprint {
  district: string;
  rulesIntel: unknown;       // raw result from Node A
  tacticalAnalysis: string;  // narrative from Ollama
  loreAnchors: string[];     // NPC names/facts from recent session history
}

export class MissionSwarmOrchestrator {
  private readonly config: MissionSwarmConfig;

  constructor(config: MissionSwarmConfig) {
    this.config = config;
  }

  /**
   * Generate a mission blueprint for the given district.
   * Concurrently dispatches:
   *   1. Node A rules_intel RPC (ClawLink) for DVs and encounter tables
   *   2. Ollama tactical analysis HTTP fetch
   * Then fuses results with lore anchors from crush.db.
   */
  async generateMission(district: string): Promise<MissionBlueprint> {
    const [rulesIntel, tacticalAnalysis] = await Promise.all([
      this.config.clawlink.executeRpc<{ dvTable: unknown[]; encounters: unknown[] }>('rules_intel', { district }),
      this.fetchTacticalAnalysis(district),
    ]);

    const loreAnchors = await this.getLoreAnchors(district);

    return {
      district,
      rulesIntel,
      tacticalAnalysis,
      loreAnchors,
    };
  }

  /** Fetch tactical analysis from Ollama, returns fallback string on failure. */
  private async fetchTacticalAnalysis(district: string): Promise<string> {
    try {
      const response = await fetch(this.config.tacticsUrl + '/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'mistral-nemo:latest',
          prompt: `Tactical analysis for Cyberpunk RED mission in ${district} district. Be concise.`,
          stream: false,
        }),
      });
      if (!response.ok) {
        throw new Error(`Tactical analysis HTTP ${response.status}`);
      }
      const json = await response.json();
      const text = typeof json.response === 'string' ? json.response : '[Tactical analysis unavailable]';
      return text;
    } catch {
      return '[Tactical analysis unavailable]';
    }
  }

  /** Query recent NPC lore from session history */
  async getLoreAnchors(district: string): Promise<string[]> {
    try {
      const rows = this.config.oracle.query<{ content: string }>(
        `SELECT content FROM messages WHERE content LIKE ? ORDER BY rowid DESC LIMIT 5`,
        [`%${district}%`],
      );
      return rows.map(r => r.content.slice(0, 80));
    } catch {
      return [];
    }
  }
}
