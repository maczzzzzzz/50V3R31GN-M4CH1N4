import type { MissionBlueprint } from '../shared/mission.schema.js';
import type { ISovereignNarrativeClient, INitroLogicClient } from './interfaces.js';
import type { UnifiedOracleClient } from '../db/unified-oracle-client.js';

export interface MissionSwarmConfig {
  sovereignNarrative: ISovereignNarrativeClient;
  nitroLogic: INitroLogicClient;
  oracle: UnifiedOracleClient;
}

export class MissionSwarmOrchestrator {
  constructor(private readonly config: MissionSwarmConfig) {}

  /**
   * Generates a complete Mission Blueprint for a specific district.
   * Leverages Node B for narrative and Node A for tactical validation.
   */
  async generateMission(district: string): Promise<MissionBlueprint> {
    // 1. Narrative Brief (Node B)
    const briefPrompt = `You are a Fixer in Night City. Generate a short combat mission brief for the ${district} district.`;
    const brief = await this.config.sovereignNarrative.generateNarrative(briefPrompt, district);

    // 2. Tactical Analysis (Node A / Node B fallback)
    const tacticalPrompt = `Based on this mission: "${brief}", suggest 3 tactical combat considerations.`;
    const response = await this.config.sovereignNarrative.generateNarrative(tacticalPrompt, brief);
    
    // 3. Ground against Oracle
    const rows = this.config.oracle.query<{ content: string }>(
      'SELECT content FROM session_memory.messages WHERE content LIKE ? LIMIT 3',
      [`%${district}%`]
    ) as Array<{ content: string }>;
    const loreAnchors = rows.map(r => r.content.substring(0, 50));

    return {
      district,
      brief,
      tacticalAnalysis: response,
      rulesIntel: { difficulty: 'professional' },
      loreAnchors
    };
  }
}
