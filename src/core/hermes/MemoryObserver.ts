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
}

/**
 * Phase 68.5: Memory Palace Observer
 * 
 * Background daemon that parses completed agent traces (checkpoints/audits)
 * and distills high-value semantic facts to inject into the Memory Palace.
 */
export class MemoryObserver {
  private static service: MemoryPalaceService | null = null;

  static async init() {
    if (this.service) return;
    const oracle = new UnifiedOracleClient({
      worldDbPath: 'data/Akashik.db',
      crushDbPath: 'data/crush.db',
    }, {});
    await oracle.connect();

    const store = new SynapseStore('data/SovereignIntelligence.db');
    store.open();
    const embedder = new SovereignEmbeddingService({
      baseUrl: process.env.NODE_A_URL ?? 'http://10.0.0.10:8080/v1',
      model: 'nomic-embed-text',
    });
    const tripletService = new OsTripletService(store, embedder);

    this.service = new MemoryPalaceService(oracle, tripletService);
  }

  static async observeAndDistill(state: HermesState) {
    if (state.outcome !== 'SUCCESS' || !state.response) return;

    try {
      await this.init();
      if (!this.service) return;

      const context = this.service.getActiveContext();
      if (!context.roomId) {
        // Fallback: If no room is active, create/use a generic agent observation room
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
          activeCtx.roomId
        );
      }
      
      // Also mine the exact verbatim exchange into the ChromaDB Drawer (if initialized)
      await this.service.mineExchange(state.prompt, state.response);

    } catch (e) {
      console.error(`::/OBSERVER_ERROR : Failed to distill memory - ${(e as Error).message}`);
    }
  }
}
