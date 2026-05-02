/**
 * tests/core/life-path-service.test.ts
 *
 * Integration tests for LifePathService — Phase 21 Task 3 Life-Path Persistence.
 *
 * Uses an in-memory SQLite DB via UnifiedOracleClient(':memory:') so tests
 * are fast, isolated, and leave no files on disk.
 *
 * Each test gets a fresh DB via beforeEach to guarantee full isolation.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { UnifiedOracleClient } from '../../packages/hermes-core/src/db/unified-oracle-client.js';
import { LifePathService } from '../../packages/hermes-core/src/core/life-path-service.js';

async function makeInMemoryStack(): Promise<{
  oracle: UnifiedOracleClient;
  svc: LifePathService;
}> {
  const oracle = new UnifiedOracleClient({
    worldDbPath: ':memory:',
    crushDbPath: ':memory:',
  });
  await oracle.connect();
  await oracle.initSchema();
  const svc = new LifePathService(oracle);
  return { oracle, svc };
}

describe('LifePathService', () => {
  let oracle: UnifiedOracleClient;
  let svc: LifePathService;

  beforeEach(async () => {
    ({ oracle, svc } = await makeInMemoryStack());
  });

  afterEach(async () => {
    await oracle.disconnect();
  });

  // ── 1. appendLog + getRecentLogs round-trip ───────────────────────────────

  it('appendLog() + getRecentLogs() round-trip: stored entry is returned', () => {
    svc.appendLog('npc-001', 'Attacked a corpo guard', 'action');
    const logs = svc.getRecentLogs('npc-001', 5);

    expect(logs).toHaveLength(1);
    expect(logs[0]!.npcId).toBe('npc-001');
    expect(logs[0]!.summary).toBe('Attacked a corpo guard');
    expect(logs[0]!.logType).toBe('action');
    expect(typeof logs[0]!.id).toBe('number');
    expect(typeof logs[0]!.createdAt).toBe('string');
  });

  it('appendLog() stores all three log types correctly', () => {
    svc.appendLog('npc-002', 'Shot at player', 'action');
    svc.appendLog('npc-002', 'Spoken to by V', 'interaction');
    svc.appendLog('npc-002', 'Noticed burning car', 'observation');

    const logs = svc.getRecentLogs('npc-002', 10);
    expect(logs).toHaveLength(3);

    const types = logs.map((l) => l.logType);
    expect(types).toContain('action');
    expect(types).toContain('interaction');
    expect(types).toContain('observation');
  });

  it('appendLog() defaults logType to "action" when omitted', () => {
    svc.appendLog('npc-003', 'Ran away');
    const logs = svc.getRecentLogs('npc-003', 5);
    expect(logs[0]!.logType).toBe('action');
  });

  // ── 2. getRecentLogs returns empty array for unknown NPC ──────────────────

  it('getRecentLogs() returns empty array for an NPC with no logs', () => {
    const logs = svc.getRecentLogs('npc-unknown', 5);
    expect(logs).toEqual([]);
  });

  // ── 3. getRecentLogs respects limit parameter ─────────────────────────────

  it('getRecentLogs() respects the limit parameter — returns at most `limit` entries', () => {
    for (let i = 1; i <= 8; i++) {
      svc.appendLog('npc-004', `Action ${i}`);
    }
    const logs = svc.getRecentLogs('npc-004', 5);
    expect(logs).toHaveLength(5);
  });

  it('getRecentLogs() with limit larger than total returns all entries', () => {
    svc.appendLog('npc-005', 'Only one');
    const logs = svc.getRecentLogs('npc-005', 100);
    expect(logs).toHaveLength(1);
  });

  // ── 4. getRecentLogs returns entries newest-last (chronological order) ─────
  //    The "newest last" contract ensures TurnDaemon can append entries in
  //    order and have the most recent context at the end of the prompt.

  it('getRecentLogs() returns entries in chronological order (oldest first, newest last)', () => {
    // Insert with explicit summaries to track insertion order
    svc.appendLog('npc-006', 'First action');
    svc.appendLog('npc-006', 'Second action');
    svc.appendLog('npc-006', 'Third action');

    const logs = svc.getRecentLogs('npc-006', 5);

    expect(logs).toHaveLength(3);
    expect(logs[0]!.summary).toBe('First action');
    expect(logs[1]!.summary).toBe('Second action');
    expect(logs[2]!.summary).toBe('Third action');
  });

  it('getRecentLogs() with limit=5 on 8 entries returns the 5 most recent, oldest-first', () => {
    for (let i = 1; i <= 8; i++) {
      svc.appendLog('npc-007', `Event ${i}`);
    }
    const logs = svc.getRecentLogs('npc-007', 5);

    // Should be events 4–8 (the 5 most recent), in ascending order
    expect(logs).toHaveLength(5);
    expect(logs[0]!.summary).toBe('Event 4');
    expect(logs[4]!.summary).toBe('Event 8');
  });

  it('TurnDaemon prompt build pattern produces correct history string', () => {
    svc.appendLog('npc-008', 'Patrolled sector 7');
    svc.appendLog('npc-008', 'Spotted intruder');

    const logs = svc.getRecentLogs('npc-008', 5);
    const historyText = logs.map((l) => `[${l.createdAt}] ${l.summary}`).join('\n');

    // Most recent event must appear after earlier event
    const lines = historyText.split('\n');
    expect(lines).toHaveLength(2);
    expect(lines[0]).toContain('Patrolled sector 7');
    expect(lines[1]).toContain('Spotted intruder');
  });

  // ── 5. pruneOldLogs deletes old entries and returns correct count ──────────

  it('pruneOldLogs() returns the number of deleted rows', () => {
    // Insert rows with a backdated created_at by directly calling execute
    oracle.execute(
      `INSERT INTO npc_logs (npc_id, summary, log_type, created_at)
       VALUES (?, ?, ?, datetime('now', '-10 days'))`,
      ['npc-010', 'Old action', 'action'],
    );
    oracle.execute(
      `INSERT INTO npc_logs (npc_id, summary, log_type, created_at)
       VALUES (?, ?, ?, datetime('now', '-15 days'))`,
      ['npc-010', 'Older action', 'action'],
    );
    // Fresh entry — should NOT be pruned
    svc.appendLog('npc-010', 'Recent action');

    const deleted = svc.pruneOldLogs(7);

    expect(deleted).toBe(2);
    const remaining = svc.getRecentLogs('npc-010', 10);
    expect(remaining).toHaveLength(1);
    expect(remaining[0]!.summary).toBe('Recent action');
  });

  it('pruneOldLogs() returns 0 when there are no old entries to delete', () => {
    svc.appendLog('npc-011', 'Fresh entry');
    const deleted = svc.pruneOldLogs(30);
    expect(deleted).toBe(0);
  });

  it('pruneOldLogs() does not affect entries for other NPCs that are recent', () => {
    oracle.execute(
      `INSERT INTO npc_logs (npc_id, summary, log_type, created_at)
       VALUES (?, ?, ?, datetime('now', '-20 days'))`,
      ['npc-012', 'Old', 'action'],
    );
    svc.appendLog('npc-013', 'Recent from different NPC');

    svc.pruneOldLogs(7);

    expect(svc.getRecentLogs('npc-012', 10)).toHaveLength(0);
    expect(svc.getRecentLogs('npc-013', 10)).toHaveLength(1);
  });

  // ── 6. pruneOldLogs with daysOld=0 deletes everything ─────────────────────

  it('pruneOldLogs(0) deletes ALL rows across all NPCs', () => {
    svc.appendLog('npc-020', 'Action A');
    svc.appendLog('npc-021', 'Action B');
    svc.appendLog('npc-022', 'Action C');

    const deleted = svc.pruneOldLogs(0);

    expect(deleted).toBe(3);
    expect(svc.getRecentLogs('npc-020', 10)).toHaveLength(0);
    expect(svc.getRecentLogs('npc-021', 10)).toHaveLength(0);
    expect(svc.getRecentLogs('npc-022', 10)).toHaveLength(0);
  });
});
