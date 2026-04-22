/**
 * src/core/hermes/AutoResumeDaemon.ts
 *
 * Phase 68.5 — Agentic Crash Recovery
 *
 * Daemon to scan for dangling threads (activeNode != 'done')
 * and re-invoke LangGraphOrchestrator to resume them.
 */

import Database from 'better-sqlite3';
import { LangGraphOrchestrator } from './LangGraphOrchestrator.js';
import type { OrchestratorState } from './LangGraphOrchestrator.js';

export class AutoResumeDaemon {
  private db: Database.Database;

  constructor() {
    this.db = new Database('data/Akashik_Checkpoints.db');
  }

  public async resumeDanglingThreads(): Promise<void> {
    const stmt = this.db.prepare(`SELECT thread_id, state FROM orchestrator_checkpoints`);
    const rows = stmt.all() as Array<{ thread_id: string; state: string }>;

    const orchestrator = new LangGraphOrchestrator();

    for (const row of rows) {
      try {
        const state = JSON.parse(row.state) as OrchestratorState;
        if (state.activeNode !== 'done') {
          console.log(`[AutoResumeDaemon] Resuming dangling thread: ${row.thread_id}`);
          // Re-invoke the orchestrator to resume.
          await orchestrator.invoke({
            prompt: state.prompt,
            tokens: state.tokens,
            file_path: state.file_path,
            diff: state.diff,
            thread_id: row.thread_id,
          });
        }
      } catch (err) {
        console.error(`[AutoResumeDaemon] Failed to resume thread ${row.thread_id}:`, err);
      }
    }
  }
}
