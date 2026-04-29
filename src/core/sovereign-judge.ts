import { randomUUID } from 'node:crypto';
import type { ISovereignNarrativeClient, INitroLogicClient, ILogger, SovereignProfile } from './interfaces.js';
import type { UnifiedOracleClient } from '../db/unified-oracle-client.js';
import type { IClawLinkClient } from '../api/clawlink-client.js';
import type { IFoundryAdapter } from '../api/foundry-adapter.js';

export interface SovereignJudgeOptions {
  nitroLogicClient: INitroLogicClient;
  sovereignNarrativeClient: ISovereignNarrativeClient;
  oracle: UnifiedOracleClient;
  clawlinkClient?: IClawLinkClient;
  foundryAdapter?: IFoundryAdapter;
  logger?: ILogger;
}

const CONTEXT = 'SovereignJudge';

export class SovereignJudge {
  private readonly nitro: INitroLogicClient;
  private readonly sovereignNarrative: ISovereignNarrativeClient;
  private readonly oracle: UnifiedOracleClient;
  private readonly clawlink?: IClawLinkClient;
  private readonly foundry?: IFoundryAdapter;
  private readonly logger?: ILogger | undefined;
  private activeProfile: SovereignProfile = 'SOVEREIGN_OS';

  constructor(options: SovereignJudgeOptions) {
    this.nitro = options.nitroLogicClient;
    this.sovereignNarrative = options.sovereignNarrativeClient;
    this.oracle = options.oracle;
    if (options.clawlinkClient !== undefined) this.clawlink = options.clawlinkClient;
    if (options.foundryAdapter !== undefined) this.foundry = options.foundryAdapter;
    this.logger = options.logger;
  }

  public setProfile(profile: SovereignProfile): void {
    this.activeProfile = profile;
  }

  public async evaluateNarrative(
    prompt: string, 
    context: string, 
    systemContext?: string, 
    districtName?: string,
    temperature: number = 0.8,
    topP: number = 0.9,
    maxRetries: number = 3
  ): Promise<{ narrative: string, glitched: boolean }> {
    const traceId = randomUUID();
    let currentPrompt = prompt;
    let attempts = 0;
    let hasGlitched = false;

    this.logger?.debug(CONTEXT, traceId, 'Starting narrative evaluation', { districtName, attempts });

    while (attempts < maxRetries) {
      attempts++;
      
      const narrative = await this.sovereignNarrative.generateNarrative(
        currentPrompt, 
        context, 
        systemContext, 
        districtName,
        temperature,
        topP
      );

      // Audit fidelity using Node A (ZeroClaw RPC)
      if (!this.clawlink) {
        return { narrative, glitched: hasGlitched };
      }

      try {
        const auditResult = await this.clawlink.executeRpc<{ passed: boolean, score: number, ai_ism_count: number, reasoning: string }>('audit_narrative_fidelity', { text: narrative });
        
        if (auditResult.passed) {
          this.logger?.info(CONTEXT, traceId, 'Narrative PASSED audit', { score: auditResult.score, attempts });
          if (auditResult.score >= 9.0 && districtName) {
             this.backpropagateDNA(districtName, narrative);
          }
          return { narrative, glitched: hasGlitched };
        } else {
          this.logger?.warn(CONTEXT, traceId, `Narrative VETO triggered (Attempt ${attempts})`, { reason: auditResult.reasoning });
          hasGlitched = true;
          
          if (this.foundry) {
             this.foundry.sendChatMessage(`**[SYS.ERR]** Cognitive alignment failure. Recalculating...`, { alias: 'System' }).catch(() => {});
          }

          if (this.activeProfile === 'RED_DIRECTOR') {
            currentPrompt = prompt + " REJECTED BY SYSTEM: Your previous response contained forbidden AI-isms or lacked grit. You are a Sovereign Reality Engine. Be brutal, terse, and unfiltered.";
          } else {
            currentPrompt = prompt + " REJECTED BY SYSTEM: Your previous response was logically inconsistent or contained AI meta-talk. Be clinical, objective, and adhere strictly to the OS mandate.";
          }
        }
      } catch (e) {
        this.logger?.error(CONTEXT, traceId, 'Narrative audit failed, accepting narrative as fallback', { error: (e as Error).message });
        return { narrative, glitched: hasGlitched };
      }
    }
    
    this.logger?.error(CONTEXT, traceId, `Narrative generation failed after ${maxRetries} attempts.`);
    return { narrative: "Narrative generation failed to pass audit after maximum retries.", glitched: hasGlitched };
  }

  private backpropagateDNA(districtName: string, fragment: string) {
    const traceId = randomUUID();
    try {
      const db = this.oracle.getRawDatabase();
      const row = db.prepare('SELECT lore_fragments_json FROM district_dna WHERE district_name = ?').get(districtName) as any;
      if (row) {
         let fragments: string[] = [];
         try {
           fragments = JSON.parse(row.lore_fragments_json);
         } catch(e) {}
         if (fragments.length > 5) fragments.shift();
         const snippet = fragment.length > 100 ? fragment.substring(0, 100) + '...' : fragment;
         fragments.push(snippet);
         db.prepare('UPDATE district_dna SET lore_fragments_json = ?, last_updated = CURRENT_TIMESTAMP WHERE district_name = ?').run(JSON.stringify(fragments), districtName);
         this.logger?.info(CONTEXT, traceId, `DNA backpropagated for ${districtName}`, { snippet });
      }
    } catch(err) {
      this.logger?.error(CONTEXT, traceId, 'DNA backpropagation failed', { districtName, error: (err as Error).message });
    }
  }
}
