import type { MissionBlueprint } from '../shared/mission.schema.js';
import type { ISovereignNarrativeClient, INitroLogicClient } from './interfaces.js';
import type { UnifiedOracleClient } from '../db/unified-oracle-client.js';

export interface MissionSwarmConfig {
  sovereignNarrative: ISovereignNarrativeClient;
  nitroLogic: INitroLogicClient;
  oracle: UnifiedOracleClient;
}

interface AssetRow {
  file_path: string;
  category: string;
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
    
    // 3. Asset Retrieval (New!)
    // Fetch relevant map tiles or original TTTA maps for this district
    const maps = this.config.oracle.query(
      `SELECT file_path, category FROM map_assets WHERE category IN ('tile', 'map') AND biome LIKE ? LIMIT 3`,
      [`%${district}%`]
    ) as AssetRow[];

    // Fetch relevant tokens
    const tokens = this.config.oracle.query(
      `SELECT file_path, category FROM map_assets WHERE category = 'token' AND biome LIKE ? LIMIT 5`,
      [`%${district}%`]
    ) as AssetRow[];

    // 4. Ground against Oracle session memory
    const rows = this.config.oracle.query<{ content: string }>(
      'SELECT content FROM session_memory.messages WHERE content LIKE ? LIMIT 3',
      [`%${district}%`]
    ) as Array<{ content: string }>;
    const loreAnchors = rows.map(r => r.content.substring(0, 50));

    return {
      district,
      brief,
      tacticalAnalysis: response,
      rulesIntel: { 
        difficulty: 'professional',
        assets: {
          suggestedMaps: maps.map(m => m.file_path),
          suggestedTokens: tokens.map(t => t.file_path)
        }
      },
      loreAnchors
    };
  }
}
