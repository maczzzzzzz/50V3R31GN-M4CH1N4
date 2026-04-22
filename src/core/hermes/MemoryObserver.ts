import { MemoryPalaceService } from '../memory-palace-service.js';
import { UnifiedOracleClient } from '../../db/unified-oracle-client.js';
import type { OrchestratorState } from './LangGraphOrchestrator.js';

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
    });
    await oracle.connect();
    this.service = new MemoryPalaceService(oracle);
  }

  static async observeAndDistill(state: OrchestratorState) {
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
      
      // Also mine the exact verbatim exchange into the ChromaDB Drawer (if initialized)
      await this.service.mineExchange(state.prompt, state.response);

    } catch (e) {
      console.error(`::/OBSERVER_ERROR : Failed to distill memory - ${(e as Error).message}`);
    }
  }
}
