/**
 * src/core/hermes/AutoResumeDaemon.ts
 *
 * Phase 68.5 — Agentic Crash Recovery
 *
 * Daemon to scan for dangling threads (activeNode != 'done')
 * and re-invoke LangGraphOrchestrator to resume them.
 */

import Database from 'better-sqlite3';
import { HermesSingularity } from './HermesSingularity.js';
import type { OrchestratorState } from './HealerProtocol.js';

export class AutoResumeDaemon {
  private db: Database.Database;

  constructor() {
    this.db = new Database('data/Akashik_Checkpoints.db');
  }

  public async resumeDanglingThreads(): Promise<void> {
    const stmt = this.db.prepare(`SELECT thread_id, state FROM orchestrator_checkpoints`);
    const rows = stmt.all() as Array<{ thread_id: string; state: string }>;

    const orchestrator = new HermesSingularity();

    for (const row of rows) {
      try {
        const state = JSON.parse(row.state) as OrchestratorState;
        if (state.activeNode !== 'done') {
          console.log(`[AutoResumeDaemon] Resuming dangling thread: ${row.thread_id}`);
          // Re-invoke the native singularity engine to resume.
          await orchestrator.invoke({
            prompt: state.prompt,
            tokens: state.tokens ?? 16384,
            file_path: state.file_path ?? undefined,
            diff: state.diff ?? undefined,
            thread_id: row.thread_id,
          });
        }
      } catch (err) {
        console.error(`[AutoResumeDaemon] Failed to resume thread ${row.thread_id}:`, err);
      }
    }
  }
}
