import { randomUUID } from 'node:crypto';
import { logger } from '../../shared/logger.js';
import { MemoryPalaceService } from '../memory-palace-service.js';
import { UnifiedOracleClient } from '../../db/unified-oracle-client.js';
import { SynapseStore } from '../../db/synapse-store.js';
import { OsTripletService } from '../../db/os-triplets-service.js';
import { SovereignEmbeddingService } from '../../db/sovereign-embedding-service.js';

export interface HermesState {
  prompt: string;
  response?: string;
  outcome: 'SUCCESS' | 'FAILURE' | 'PENDING';
  traceId: string;
  profile?: 'SOVEREIGN_OS' | 'RED_DIRECTOR' | 'RESEARCHER';
}

/**
 * Phase 68.5: Memory Palace Observer
 * 
 * Background daemon that parses completed agent traces (checkpoints/audits)
 * and distills high-value semantic facts to inject into the Memory Palace.
 */
export class MemoryObserver {
  private static service: MemoryPalaceService | null = null;
  private static activeProfile: string = 'SOVEREIGN_OS';

  static setProfile(profile: string) {
    this.activeProfile = profile;
  }

  static async init() {
    if (this.service) return;
    const oracle = new UnifiedOracleClient({
      worldDbPath: 'data/Akashik.db',
      crushDbPath: 'data/crush.db',
    }, logger);
    await oracle.connect();

    const store = new SynapseStore('data/SovereignIntelligence.db', logger);
    store.open();
    const embedder = new SovereignEmbeddingService({
      baseUrl: process.env.NODE_A_URL ?? 'http://10.0.0.10:8080/v1',
      model: 'nomic-embed-text',
      timeoutMs: 10000,
    }, logger);
    const tripletService = new OsTripletService(store, embedder, logger);

    this.service = new MemoryPalaceService(oracle, tripletService);
  }

  static async observeAndDistill(state: HermesState) {
    if (state.outcome !== 'SUCCESS' || !state.response) return;

    try {
      await this.init();
      if (!this.service) return;

      const profile = state.profile || this.activeProfile;
      const context = this.service.getActiveContext();
      
      // Phase 107: Profile-Aware Memory Gating
      // Only distill world-state lore if in RED_DIRECTOR mode
      if (profile === 'RED_DIRECTOR') {
        const wing = this.service.upsertWing('Simulation Shard', 'PLAYER', 'Cyberpunk RED world-state fragments.');
        const room = this.service.upsertRoom(wing.id, 'World Narrative', 'POI', 'Distilled lore from the Director.');
        this.service.enterRoom(room.id);
      } else {
        const wing = this.service.upsertWing('Sovereign Memory', 'PLAYER', 'Auto-generated agentic observations.');
        const room = this.service.upsertRoom(wing.id, 'Agent Traces', 'POI', 'Distilled facts from the Hermes Orchestrator.');
        this.service.enterRoom(room.id);
      }

      const activeCtx = this.service.getActiveContext();
      if (!activeCtx.roomId) return;

      // Ensure a 'hall_facts' exists in this room
      const hall = this.service.upsertHall(activeCtx.roomId, 'hall_facts');

      // Extremely basic "distillation": In a real implementation, we would pass the prompt/response
      // through a lightweight LLM call to extract semantic facts (e.g., user preferences).
      // Here, we simulate the distillation of the task's core intent.
      const summary = `Task Executed: ${state.prompt.substring(0, 60)}... Outcome: SUCCESS`;
      
      // Inject the semantic fact into the Memory Palace
      this.service.addCloset(hall.id, summary, state.traceId);

      // Extract and store a task triplet for the active room (Spatial Scoping)
      if (this.service.tripletService) {
        await this.service.tripletService.upsert(
          'Agent',
          'executed_task',
          state.prompt.substring(0, 40).replace(/\s+/g, '_'),
          activeCtx.roomId,
          randomUUID()
        );
      }
      
      // Also mine the exact verbatim exchange into the ChromaDB Drawer (if initialized)
      await this.service.mineExchange(state.prompt, state.response);

    } catch (e) {
      console.error(`::/OBSERVER_ERROR : Failed to distill memory - ${(e as Error).message}`);
    }
  }
}
