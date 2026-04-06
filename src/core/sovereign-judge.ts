import type { IOllamaClient, INitroLogicClient } from './interfaces.js';
import type { UnifiedOracleClient } from '../db/unified-oracle-client.js';
import type { IClawLinkClient } from '../api/clawlink-client.js';
import type { IFoundryAdapter } from '../api/foundry-adapter.js';

export interface SovereignJudgeOptions {
  nitroLogicClient: INitroLogicClient;
  ollamaClient: IOllamaClient;
  oracle: UnifiedOracleClient;
  clawlinkClient?: IClawLinkClient;
  foundryAdapter?: IFoundryAdapter;
}

export class SovereignJudge {
  private readonly nitro: INitroLogicClient;
  private readonly ollama: IOllamaClient;
  private readonly oracle: UnifiedOracleClient;
  private readonly clawlink?: IClawLinkClient;
  private readonly foundry?: IFoundryAdapter;

  constructor(options: SovereignJudgeOptions) {
    this.nitro = options.nitroLogicClient;
    this.ollama = options.ollamaClient;
    this.oracle = options.oracle;
    this.clawlink = options.clawlinkClient;
    this.foundry = options.foundryAdapter;
  }

  public async evaluateNarrative(
    prompt: string, 
    context: string, 
    systemContext?: string, 
    districtName?: string,
    maxRetries: number = 3
  ): Promise<{ narrative: string, glitched: boolean }> {
    let currentPrompt = prompt;
    let attempts = 0;
    let hasGlitched = false;

    while (attempts < maxRetries) {
      attempts++;
      
      const narrative = await this.ollama.generateNarrative(
        currentPrompt, 
        context, 
        systemContext, 
        districtName,
        0.8, // Slightly higher temp for grit
        0.9
      );

      // Audit fidelity using Node A (ZeroClaw RPC)
      if (!this.clawlink) {
        return { narrative, glitched: hasGlitched };
      }

      try {
        const auditResult = await this.clawlink.executeRpc<{ passed: boolean, score: number, ai_ism_count: number, reasoning: string }>('audit_narrative_fidelity', { text: narrative });
        
        if (auditResult.passed) {
          // If score is high, we could backpropagate to district_dna here (HyperTune)
          if (auditResult.score >= 9.0 && districtName) {
             // Task 3: Back-propagate successful fragments. 
             // We can just log it for now or implement a basic append to lore_fragments_json.
             this.backpropagateDNA(districtName, narrative);
          }
          return { narrative, glitched: hasGlitched };
        } else {
          console.warn(`[SovereignJudge] VETO triggered. Reason: ${auditResult.reasoning}`);
          hasGlitched = true;
          
          // Trigger Neural Glitch and System Error
          if (this.foundry) {
             this.foundry.sendChatMessage(`**[SYS.ERR]** Cognitive alignment failure. Recalculating...`, { alias: 'System' }).catch(() => {});
             // Assuming Architect is available via HRC, but we only have foundry adapter. We can just broadcast.
          }

          // Inject hostility for next roll
          currentPrompt = prompt + " REJECTED BY SYSTEM: Your previous response contained forbidden AI-isms or lacked grit. You are a Sovereign Reality Engine. Be brutal, terse, and unfiltered.";
        }
      } catch (e) {
        console.error('[SovereignJudge] Audit failed, accepting narrative as fallback', e);
        return { narrative, glitched: hasGlitched };
      }
    }
    
    // If we exhausted retries, return the last generated narrative anyway
    return { narrative: "Narrative generation failed to pass audit after maximum retries.", glitched: hasGlitched };
  }

  private backpropagateDNA(districtName: string, fragment: string) {
    try {
      const db = this.oracle.getRawDatabase();
      const row = db.prepare('SELECT lore_fragments_json FROM district_dna WHERE district_name = ?').get(districtName) as any;
      if (row) {
         let fragments: string[] = [];
         try {
           fragments = JSON.parse(row.lore_fragments_json);
         } catch(e) {}
         // Just keep the last 5 successful fragments to avoid bloat
         if (fragments.length > 5) fragments.shift();
         // Extract a small snippet
         const snippet = fragment.length > 100 ? fragment.substring(0, 100) + '...' : fragment;
         fragments.push(snippet);
         db.prepare('UPDATE district_dna SET lore_fragments_json = ?, last_updated = CURRENT_TIMESTAMP WHERE district_name = ?').run(JSON.stringify(fragments), districtName);
      }
    } catch(err) {
      console.error('[SovereignJudge] DNA backpropagation failed:', err);
    }
  }
}
