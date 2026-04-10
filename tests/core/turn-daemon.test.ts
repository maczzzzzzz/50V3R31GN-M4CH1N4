/**
 * tests/core/turn-daemon.test.ts
 *
 * Vitest unit tests for TurnDaemon (Phase 21, Task 1).
 * All external services are mocked — no real network I/O.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { TurnDaemon } from '../../src/core/turn-daemon.js';
import type { TurnResult, NpcAction } from '../../src/core/turn-daemon.js';
import type { ISovereignNarrativeClient } from '../../src/core/interfaces.js';
import type { IClawLinkClient } from '../../src/api/clawlink-client.js';
import type { LifePathService } from '../../src/core/life-path-service.js';
import type { NpcLog } from '../../src/core/life-path-service.js';

// ── Shared mock factories ─────────────────────────────────────────────────────

function makeMoveAction(): NpcAction {
  return { type: 'move', targetX: 10, targetY: 20 };
}

function validActionJson(action: NpcAction = makeMoveAction()): string {
  return JSON.stringify(action);
}

/** Build a minimal ISovereignNarrativeClient mock. */
function makeSovereignNarrative(overrides: Partial<{
  reason: string;
  intent: string;
  action: string;
  throws: Error;
}>): ISovereignNarrativeClient {
  let callCount = 0;
  return {
    generateNarrative: vi.fn(async (_prompt: string, _ctx: string) => {
      callCount++;
      if (overrides.throws) throw overrides.throws;
      // Stage 1 → reason, Stage 2 → intent, Stage 3 → action
      if (callCount === 1) return overrides.reason ?? 'The area is hostile.';
      if (callCount === 2) return overrides.intent ?? 'Secure the perimeter.';
      return overrides.action ?? validActionJson();
    }),
    isHealthy: vi.fn(async () => true),
    stop: vi.fn(async () => {}),
  };
}

/** Build a minimal IClawLinkClient mock for the validate_npc_action RPC. */
function makeClawLink(overrides: Partial<{
  valid: boolean;
  reason: string;
  throws: Error;
}>): IClawLinkClient {
  return {
    connect: vi.fn(async () => {}),
    disconnect: vi.fn(async () => {}),
    isHealthy: vi.fn(async () => true),
    hybridSearch: vi.fn(async () => []),
    resolveAttack: vi.fn(async () => ({ hit: true, netDamage: 5, reasoning: '' } as any)),
    resolveDamage: vi.fn(async () => ({ netDamage: 5, reasoning: '' } as any)),
    executeRpc: vi.fn(async (_method: string, _params: unknown) => {
      if (overrides.throws) throw overrides.throws;
      return {
        valid: overrides.valid ?? true,
        reason: overrides.reason,
      } as any;
    }),
    st3ggEncode: vi.fn(async () => 'encoded'),
    st3ggDecode: vi.fn(async () => 'decoded'),
    processParseltongueNarrative: vi.fn(async () => false),
  };
}

/** Build a minimal LifePathService mock. */
function makeLifePath(logs: NpcLog[] = []): LifePathService {
  return {
    getRecentLogs: vi.fn(() => logs),
  } as unknown as LifePathService;
}

// ── Test setup ────────────────────────────────────────────────────────────────

const NPC_ID = 'npc-001';
const SENSORY_CONTEXT = 'Two enemies visible at grid (5,3). Cover to the north.';

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('TurnDaemon', () => {
  describe('Happy path — all 4 stages succeed', () => {
    it('returns a correctly shaped TurnResult', async () => {
      const sovereignNarrative = makeSovereignNarrative({
        reason: 'Enemies are close, I need to move.',
        intent: 'Secure the perimeter.',
        action: validActionJson({ type: 'move', targetX: 5, targetY: 3 }),
      });
      const clawlink = makeClawLink({ valid: true });
      const lifePath = makeLifePath([
        { id: 1, npcId: NPC_ID, createdAt: '2026-04-03T00:00:00Z', summary: 'Patrolled sector A.', logType: 'action' },
      ]);

      const daemon = new TurnDaemon(sovereignNarrative, clawlink, lifePath);
      const result: TurnResult = await daemon.runTurn(NPC_ID, SENSORY_CONTEXT);

      expect(result.npcId).toBe(NPC_ID);
      expect(result.reasoning).toBe('Enemies are close, I need to move.');
      expect(result.intent).toBe('Secure the perimeter.');
      expect(result.action).toEqual({ type: 'move', targetX: 5, targetY: 3 });
      expect(result.validated).toBe(true);
      expect(typeof result.durationMs).toBe('number');
      expect(result.durationMs).toBeGreaterThanOrEqual(0);
    });

    it('calls getRecentLogs with npcId and limit=5', async () => {
      const sovereignNarrative = makeSovereignNarrative({});
      const clawlink = makeClawLink({ valid: true });
      const lifePath = makeLifePath();

      const daemon = new TurnDaemon(sovereignNarrative, clawlink, lifePath);
      await daemon.runTurn(NPC_ID, SENSORY_CONTEXT);

      expect(lifePath.getRecentLogs).toHaveBeenCalledWith(NPC_ID, 5);
    });

    it('calls sovereignNarrative.generateNarrative 3 times (reason + intent + action)', async () => {
      const sovereignNarrative = makeSovereignNarrative({});
      const clawlink = makeClawLink({ valid: true });
      const daemon = new TurnDaemon(sovereignNarrative, clawlink, makeLifePath());
      await daemon.runTurn(NPC_ID, SENSORY_CONTEXT);

      expect(sovereignNarrative.generateNarrative).toHaveBeenCalledTimes(3);
    });

    it('passes all supported action types through validation', async () => {
      const actions: NpcAction[] = [
        { type: 'move', targetX: 1, targetY: 2 },
        { type: 'attack', targetId: 'enemy-1', weaponId: 'pistol' },
        { type: 'attack', targetId: 'enemy-2' },
        { type: 'interact', targetId: 'door-1', interaction: 'open' },
        { type: 'idle', reason: 'waiting' },
      ];

      for (const action of actions) {
        const sovereignNarrative = makeSovereignNarrative({ action: validActionJson(action) });
        const clawlink = makeClawLink({ valid: true });
        const daemon = new TurnDaemon(sovereignNarrative, clawlink, makeLifePath());
        const result = await daemon.runTurn(NPC_ID, SENSORY_CONTEXT);
        expect(result.action).toEqual(action);
      }
    });
  });

  describe('Stage 3 — Action fallbacks', () => {
    it('falls back to idle when LLM returns no JSON object', async () => {
      const sovereignNarrative = makeSovereignNarrative({ action: 'I think I should move north and flank them.' });
      const clawlink = makeClawLink({ valid: true });
      const daemon = new TurnDaemon(sovereignNarrative, clawlink, makeLifePath());
      const result = await daemon.runTurn(NPC_ID, SENSORY_CONTEXT);

      expect(result.action.type).toBe('idle');
      expect((result.action as { type: 'idle'; reason: string }).reason).toBe('parse_failure');
    });

    it('falls back to idle when JSON does not match any NpcAction shape', async () => {
      const sovereignNarrative = makeSovereignNarrative({ action: JSON.stringify({ type: 'fly', destination: 'moon' }) });
      const clawlink = makeClawLink({ valid: true });
      const daemon = new TurnDaemon(sovereignNarrative, clawlink, makeLifePath());
      const result = await daemon.runTurn(NPC_ID, SENSORY_CONTEXT);

      expect(result.action.type).toBe('idle');
    });

    it('falls back to idle when JSON.parse throws (malformed JSON)', async () => {
      const sovereignNarrative = makeSovereignNarrative({ action: '{ "type": "move", "targetX": }' });
      const clawlink = makeClawLink({ valid: true });
      const daemon = new TurnDaemon(sovereignNarrative, clawlink, makeLifePath());
      const result = await daemon.runTurn(NPC_ID, SENSORY_CONTEXT);

      expect(result.action.type).toBe('idle');
      expect((result.action as { type: 'idle'; reason: string }).reason).toBe('parse_failure');
    });

    it('strips markdown fences before parsing JSON', async () => {
      const fenced = '```json\n' + validActionJson({ type: 'idle', reason: 'low_ammo' }) + '\n```';
      const sovereignNarrative = makeSovereignNarrative({ action: fenced });
      const clawlink = makeClawLink({ valid: true });
      const daemon = new TurnDaemon(sovereignNarrative, clawlink, makeLifePath());
      const result = await daemon.runTurn(NPC_ID, SENSORY_CONTEXT);

      expect(result.action).toEqual({ type: 'idle', reason: 'low_ammo' });
    });

    it('falls back to idle with reason "action_timeout" when the 5 s timeout fires', async () => {
      vi.useFakeTimers();

      // A promise that never resolves, simulating a stalled LLM
      let callCount = 0;
      const sovereignNarrative: ISovereignNarrativeClient = {
        generateNarrative: vi.fn(async (_prompt: string) => {
          callCount++;
          if (callCount <= 2) {
            // Stages 1 & 2 return immediately
            return callCount === 1 ? 'reasoning' : 'intent';
          }
          // Stage 3 hangs forever
          return new Promise<string>(() => {});
        }),
        isHealthy: vi.fn(async () => true),
        stop: vi.fn(async () => {}),
      };

      const clawlink = makeClawLink({ valid: true });
      const daemon = new TurnDaemon(sovereignNarrative, clawlink, makeLifePath());

      const turnPromise = daemon.runTurn(NPC_ID, SENSORY_CONTEXT);

      // advanceTimersByTimeAsync flushes the microtask queue between timer ticks,
      // allowing stages 1 & 2 to complete so stageAction's setTimeout gets
      // registered before we advance past the 5 s mark.
      await vi.advanceTimersByTimeAsync(6_000);

      const result = await turnPromise;

      expect(result.action.type).toBe('idle');
      expect((result.action as { type: 'idle'; reason: string }).reason).toBe('action_timeout');

      vi.useRealTimers();
    });
  });

  describe('Stage 4 — Validation outcomes', () => {
    it('sets validated=false and replaces action with idle when Node A rejects it', async () => {
      const sovereignNarrative = makeSovereignNarrative({ action: validActionJson({ type: 'attack', targetId: 'npc-002' }) });
      const clawlink = makeClawLink({ valid: false, reason: 'out_of_range' });
      const daemon = new TurnDaemon(sovereignNarrative, clawlink, makeLifePath());
      const result = await daemon.runTurn(NPC_ID, SENSORY_CONTEXT);

      expect(result.validated).toBe(false);
      expect(result.action.type).toBe('idle');
      expect((result.action as { type: 'idle'; reason: string }).reason).toBe('out_of_range');
    });

    it('uses generic fallback reason when Node A provides no reason string', async () => {
      const clawlink: IClawLinkClient = {
        ...makeClawLink({ valid: false }),
        executeRpc: vi.fn(async () => ({ valid: false })),
      };
      const sovereignNarrative = makeSovereignNarrative({ action: validActionJson() });
      const daemon = new TurnDaemon(sovereignNarrative, clawlink, makeLifePath());
      const result = await daemon.runTurn(NPC_ID, SENSORY_CONTEXT);

      expect(result.action.type).toBe('idle');
      expect((result.action as { type: 'idle'; reason: string }).reason).toBe('rejected_by_rules_vault');
    });

    it('allows action through (fail-open) when Node A is unreachable and logs a warning', async () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const clawlink = makeClawLink({ throws: new Error('ECONNREFUSED') });
      const expectedAction: NpcAction = { type: 'move', targetX: 7, targetY: 8 };
      const sovereignNarrative = makeSovereignNarrative({ action: validActionJson(expectedAction) });
      const daemon = new TurnDaemon(sovereignNarrative, clawlink, makeLifePath());
      const result = await daemon.runTurn(NPC_ID, SENSORY_CONTEXT);

      // Action passes through unchanged
      expect(result.action).toEqual(expectedAction);
      // validated is false because we couldn't confirm it
      expect(result.validated).toBe(false);
      // A warning must have been logged
      expect(consoleSpy).toHaveBeenCalled();
      const warnArg: string = consoleSpy.mock.calls[0]?.[0] ?? '';
      expect(warnArg).toContain('unreachable');

      consoleSpy.mockRestore();
    });

    it('calls executeRpc with correct method and params', async () => {
      const attackAction: NpcAction = { type: 'attack', targetId: 'enemy-X', weaponId: 'smg' };
      const sovereignNarrative = makeSovereignNarrative({ action: validActionJson(attackAction) });
      const clawlink = makeClawLink({ valid: true });
      const daemon = new TurnDaemon(sovereignNarrative, clawlink, makeLifePath());
      await daemon.runTurn(NPC_ID, SENSORY_CONTEXT);

      expect(clawlink.executeRpc).toHaveBeenCalledWith('validate_npc_action', {
        npcId: NPC_ID,
        action: attackAction,
      });
    });
  });

  describe('Edge cases', () => {
    it('handles empty life-path logs gracefully', async () => {
      const sovereignNarrative = makeSovereignNarrative({});
      const clawlink = makeClawLink({ valid: true });
      const daemon = new TurnDaemon(sovereignNarrative, clawlink, makeLifePath([]));
      const result = await daemon.runTurn(NPC_ID, SENSORY_CONTEXT);

      expect(result.npcId).toBe(NPC_ID);
    });

    it('single daemon correctly attributes results to different npcIds per call', async () => {
      // TurnDaemon is stateless — one instance can drive any NPC.
      const npcA = 'npc-A';
      const npcB = 'npc-B';
      const sovereignNarrative = makeSovereignNarrative({});
      const clawlink = makeClawLink({ valid: true });
      const lifePath = makeLifePath();

      const daemon = new TurnDaemon(sovereignNarrative, clawlink, lifePath);

      const [resultA, resultB] = await Promise.all([
        daemon.runTurn(npcA, SENSORY_CONTEXT),
        daemon.runTurn(npcB, SENSORY_CONTEXT),
      ]);

      expect(resultA.npcId).toBe(npcA);
      expect(resultB.npcId).toBe(npcB);
      // Each call must have fetched logs for the correct npcId
      expect(lifePath.getRecentLogs).toHaveBeenCalledWith(npcA, 5);
      expect(lifePath.getRecentLogs).toHaveBeenCalledWith(npcB, 5);
    });
  });
});
