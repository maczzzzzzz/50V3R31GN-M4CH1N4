/**
 * src/core/life-path-service.ts
 *
 * Phase 21 Task 3 — Life-Path Persistence.
 * Provides a rolling NPC log so Turn Daemon can inject recent history into
 * each NPC's reasoning prompt, giving autonomous agents life-path continuity
 * across sessions.
 *
 * Delegates all SQL to UnifiedOracleClient.query() / .execute() — never
 * imports better-sqlite3 directly.
 */

import type { UnifiedOracleClient } from '../db/unified-oracle-client.js';

export interface NpcLog {
  id: number;
  npcId: string;
  summary: string;
  logType: 'action' | 'interaction' | 'observation';
  createdAt: string;
}

// Raw row shape returned by SQLite (snake_case column names)
interface NpcLogRow {
  id: number;
  npc_id: string;
  summary: string;
  log_type: 'action' | 'interaction' | 'observation';
  created_at: string;
}

export class LifePathService {
  constructor(private readonly db: UnifiedOracleClient) {}

  /**
   * Append a log entry for an NPC.
   * logType defaults to 'action'.
   */
  appendLog(
    npcId: string,
    summary: string,
    logType: NpcLog['logType'] = 'action',
  ): void {
    this.db.execute(
      `INSERT INTO npc_logs (npc_id, summary, log_type) VALUES (?, ?, ?)`,
      [npcId, summary, logType],
    );
  }

  /**
   * Return the `limit` most recent log entries for `npcId`, ordered oldest→newest
   * (i.e. chronological / "newest last") so TurnDaemon can build prompt history
   * with the most recent context at the bottom.
   *
   * Returns an empty array if the NPC has no logs.
   */
  getRecentLogs(npcId: string, limit: number): NpcLog[] {
    // Fetch the newest `limit` rows in DESC order, then reverse for prompt order.
    const rows = this.db.query<NpcLogRow>(
      `SELECT id, npc_id, summary, log_type, created_at
       FROM npc_logs
       WHERE npc_id = ?
       ORDER BY created_at DESC, id DESC
       LIMIT ?`,
      [npcId, limit],
    );

    // Reverse so the array is chronological (oldest first, newest last).
    return rows.reverse().map((row) => ({
      id: row.id,
      npcId: row.npc_id,
      summary: row.summary,
      logType: row.log_type,
      createdAt: row.created_at,
    }));
  }

  /**
   * Delete all log entries older than `daysOld` days for all NPCs.
   * Used for housekeeping — keeps the npc_logs table bounded.
   *
   * Returns the number of rows deleted.
   *
   * Special case: daysOld = 0 deletes ALL rows regardless of age.
   */
  pruneOldLogs(daysOld: number): number {
    // Special case: daysOld = 0 must delete everything. Using datetime('now', '-0 days')
    // is unreliable because rows inserted in the same tick may not satisfy <=.
    if (daysOld === 0) {
      return this.db.execute('DELETE FROM npc_logs', []).changes;
    }
    const result = this.db.execute(
      `DELETE FROM npc_logs
       WHERE created_at <= datetime('now', ? || ' days')`,
      [`-${daysOld}`],
    );
    return result.changes;
  }
}
