/**
 * TDD Tests: OnboardingController
 *
 * Covers:
 *   - Interview state machine transitions (INITIAL → VIBE_CHECK → LIFEPATH → STATS → REVIEW → FINALIZED)
 *   - Lifepath mapping: oracleRoll(expression: "1d10") → Mistral-Nemo dialogue
 *   - NPC/gang tracking: player_friends_enemies inserts via UnifiedOracleClient
 *   - Build type: "Standard" (62-point) vs "Major League" (80-point)
 *   - Error handling: nitro-logic unreachable, SovereignNarrative unreachable
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { OnboardingController } from '../../packages/hermes-core/src/core/onboarding-controller.js';
import type { INitroLogicClient, OracleResult } from '../../packages/hermes-core/src/core/interfaces.js';
import type { ISovereignNarrativeClient } from '../../packages/hermes-core/src/core/interfaces.js';
import type { UnifiedOracleClient } from '../../packages/hermes-core/src/db/unified-oracle-client.js';
import { InterviewState } from '../../packages/hermes-core/src/core/onboarding-controller.js';

// ── Mock factories ─────────────────────────────────────────────────────────────

function makeMockNitroLogic(): INitroLogicClient {
  return {
    resolveAttack: vi.fn(),
    calculateDv: vi.fn(),
    oracleRoll: vi.fn().mockResolvedValue({
      result: 5,
      isCriticalSuccess: false,
      isCriticalFailure: false,
      luckyReroll: null,
      reasoning: '1d10 → 5',
    } satisfies OracleResult),
    isHealthy: vi.fn().mockResolvedValue(true),
  };
}

function makeMockSovereignNarrative(): ISovereignNarrativeClient {
  return {
    generateNarrative: vi.fn().mockResolvedValue(
      'The fixer leans back, studying you with chrome eyes. "Street kid, huh? I know that look."'
    ),
    isHealthy: vi.fn().mockResolvedValue(true),
  };
}

function makeMockOracle(): UnifiedOracleClient {
  return {
    execute: vi.fn().mockReturnValue({ changes: 1, lastInsertRowid: 1 }),
    query: vi.fn().mockReturnValue([]),
    isConnected: vi.fn().mockReturnValue(true),
    connect: vi.fn().mockResolvedValue(undefined),
    disconnect: vi.fn().mockResolvedValue(undefined),
  } as unknown as UnifiedOracleClient;
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function makeController(overrides?: {
  nitroLogic?: INitroLogicClient;
  sovereignNarrative?: ISovereignNarrativeClient;
  oracle?: UnifiedOracleClient;
}) {
  return new OnboardingController({
    nitroLogicClient: overrides?.nitroLogic ?? makeMockNitroLogic(),
    sovereignNarrativeClient: overrides?.sovereignNarrative ?? makeMockSovereignNarrative(),
    unifiedOracle: overrides?.oracle ?? makeMockOracle(),
  });
}

// ── Suites ────────────────────────────────────────────────────────────────────

describe('OnboardingController — state machine', () => {
  it('initialises in INITIAL state', () => {
    const ctrl = makeController();
    expect(ctrl.getState()).toBe(InterviewState.INITIAL);
  });

  it('transitions INITIAL → VIBE_CHECK on startInterview()', async () => {
    const ctrl = makeController();
    await ctrl.startInterview();
    expect(ctrl.getState()).toBe(InterviewState.VIBE_CHECK);
  });

  it('transitions VIBE_CHECK → LIFEPATH on advanceToLifepath()', async () => {
    const ctrl = makeController();
    await ctrl.startInterview();
    await ctrl.advanceToLifepath();
    expect(ctrl.getState()).toBe(InterviewState.LIFEPATH);
  });

  it('transitions LIFEPATH → STATS on rollLifepath()', async () => {
    const ctrl = makeController();
    await ctrl.startInterview();
    await ctrl.advanceToLifepath();
    await ctrl.rollLifepath();
    expect(ctrl.getState()).toBe(InterviewState.STATS);
  });

  it('transitions STATS → REVIEW on setStats()', async () => {
    const ctrl = makeController();
    await ctrl.startInterview();
    await ctrl.advanceToLifepath();
    await ctrl.rollLifepath();
    await ctrl.setStats('Standard');
    expect(ctrl.getState()).toBe(InterviewState.REVIEW);
  });

  it('transitions REVIEW → FINALIZED on finalizeCharacter()', async () => {
    const ctrl = makeController();
    await ctrl.startInterview();
    await ctrl.advanceToLifepath();
    await ctrl.rollLifepath();
    await ctrl.setStats('Standard');
    await ctrl.finalizeCharacter();
    expect(ctrl.getState()).toBe(InterviewState.FINALIZED);
  });

  it('rejects out-of-order transitions (cannot rollLifepath from VIBE_CHECK)', async () => {
    const ctrl = makeController();
    await ctrl.startInterview();
    // In VIBE_CHECK, rollLifepath should throw
    await expect(ctrl.rollLifepath()).rejects.toThrow();
  });

  it('rejects re-starting a finalised interview', async () => {
    const ctrl = makeController();
    await ctrl.startInterview();
    await ctrl.advanceToLifepath();
    await ctrl.rollLifepath();
    await ctrl.setStats('Standard');
    await ctrl.finalizeCharacter();
    await expect(ctrl.startInterview()).rejects.toThrow();
  });
});

// ── Lifepath rolls ─────────────────────────────────────────────────────────────

describe('OnboardingController — lifepath rolls', () => {
  it('calls oracleRoll with expression "1d10" for each table', async () => {
    const nitroLogic = makeMockNitroLogic();
    const ctrl = makeController({ nitroLogic });
    await ctrl.startInterview();
    await ctrl.advanceToLifepath();
    await ctrl.rollLifepath();

    // Must roll for: Family Background, Family Tragedy, Friends, Enemies = 4 rolls minimum
    const calls = vi.mocked(nitroLogic.oracleRoll).mock.calls;
    expect(calls.length).toBeGreaterThanOrEqual(4);
    for (const [params] of calls) {
      expect(params.expression).toBe('1d10');
      expect(params.applyLuck).toBe(false);
      expect(params.luckPoints).toBe(0);
    }
  });

  it('returns a LifepathResult with all required fields', async () => {
    const ctrl = makeController();
    await ctrl.startInterview();
    await ctrl.advanceToLifepath();
    const result = await ctrl.rollLifepath();

    expect(result).toMatchObject({
      familyBackground: expect.any(String),
      familyTragedy: expect.any(String),
      friend: expect.any(String),
      enemy: expect.any(String),
      dialogue: expect.any(String),
    });
  });

  it('calls Mistral-Nemo (sovereignNarrative) to generate interview dialogue with roll context', async () => {
    const sovereignNarrative = makeMockSovereignNarrative();
    const ctrl = makeController({ sovereignNarrative });
    await ctrl.startInterview();
    await ctrl.advanceToLifepath();
    await ctrl.rollLifepath();

    expect(sovereignNarrative.generateNarrative).toHaveBeenCalledWith(
      expect.stringContaining('Lifepath'),
      expect.any(String),
      expect.any(String),
    );
  });

  it('maps roll 1-2 to Corporate background', async () => {
    const nitroLogic = makeMockNitroLogic();
    vi.mocked(nitroLogic.oracleRoll).mockResolvedValue({
      result: 1,
      isCriticalSuccess: false,
      isCriticalFailure: false,
      luckyReroll: null,
      reasoning: '1d10 → 1',
    });
    const ctrl = makeController({ nitroLogic });
    await ctrl.startInterview();
    await ctrl.advanceToLifepath();
    const result = await ctrl.rollLifepath();
    expect(result.familyBackground).toMatch(/corporate/i);
  });

  it('maps roll 3-4 to Nomad background', async () => {
    const nitroLogic = makeMockNitroLogic();
    // First call (Family Background) → 3, rest → 5
    vi.mocked(nitroLogic.oracleRoll)
      .mockResolvedValueOnce({ result: 3, isCriticalSuccess: false, isCriticalFailure: false, luckyReroll: null, reasoning: '1d10 → 3' })
      .mockResolvedValue({ result: 5, isCriticalSuccess: false, isCriticalFailure: false, luckyReroll: null, reasoning: '1d10 → 5' });
    const ctrl = makeController({ nitroLogic });
    await ctrl.startInterview();
    await ctrl.advanceToLifepath();
    const result = await ctrl.rollLifepath();
    expect(result.familyBackground).toMatch(/nomad/i);
  });

  it('maps roll 5-6 to Street background', async () => {
    const nitroLogic = makeMockNitroLogic();
    vi.mocked(nitroLogic.oracleRoll).mockResolvedValue({
      result: 5,
      isCriticalSuccess: false,
      isCriticalFailure: false,
      luckyReroll: null,
      reasoning: '1d10 → 5',
    });
    const ctrl = makeController({ nitroLogic });
    await ctrl.startInterview();
    await ctrl.advanceToLifepath();
    const result = await ctrl.rollLifepath();
    expect(result.familyBackground).toMatch(/street/i);
  });

  it('maps roll 7-8 to Boostergang background', async () => {
    const nitroLogic = makeMockNitroLogic();
    vi.mocked(nitroLogic.oracleRoll)
      .mockResolvedValueOnce({ result: 7, isCriticalSuccess: false, isCriticalFailure: false, luckyReroll: null, reasoning: '1d10 → 7' })
      .mockResolvedValue({ result: 5, isCriticalSuccess: false, isCriticalFailure: false, luckyReroll: null, reasoning: '1d10 → 5' });
    const ctrl = makeController({ nitroLogic });
    await ctrl.startInterview();
    await ctrl.advanceToLifepath();
    const result = await ctrl.rollLifepath();
    expect(result.familyBackground).toMatch(/boostergang/i);
  });

  it('maps roll 9-10 to Combat Zone Survivor background', async () => {
    const nitroLogic = makeMockNitroLogic();
    vi.mocked(nitroLogic.oracleRoll)
      .mockResolvedValueOnce({ result: 10, isCriticalSuccess: true, isCriticalFailure: false, luckyReroll: null, reasoning: '1d10 → 10' })
      .mockResolvedValue({ result: 5, isCriticalSuccess: false, isCriticalFailure: false, luckyReroll: null, reasoning: '1d10 → 5' });
    const ctrl = makeController({ nitroLogic });
    await ctrl.startInterview();
    await ctrl.advanceToLifepath();
    const result = await ctrl.rollLifepath();
    expect(result.familyBackground).toMatch(/combat zone/i);
  });
});

// ── RKG Update: player_friends_enemies ────────────────────────────────────────

describe('OnboardingController — RKG update', () => {
  it('inserts friend NPC into player_friends_enemies after rollLifepath()', async () => {
    const oracle = makeMockOracle();
    const ctrl = makeController({ oracle });
    await ctrl.startInterview();
    await ctrl.advanceToLifepath();
    await ctrl.rollLifepath();

    const executeCalls = vi.mocked(oracle.execute).mock.calls;
    // The SQL targets player_friends_enemies; 'friend' is passed as a bound parameter
    const friendInsert = executeCalls.find(([sql, params]) =>
      sql.includes('player_friends_enemies') &&
      Array.isArray(params) &&
      params.includes('friend')
    );
    expect(friendInsert).toBeDefined();
  });

  it('inserts enemy NPC into player_friends_enemies after rollLifepath()', async () => {
    const oracle = makeMockOracle();
    const ctrl = makeController({ oracle });
    await ctrl.startInterview();
    await ctrl.advanceToLifepath();
    await ctrl.rollLifepath();

    const executeCalls = vi.mocked(oracle.execute).mock.calls;
    // The SQL targets player_friends_enemies; 'enemy' is passed as a bound parameter
    const enemyInsert = executeCalls.find(([sql, params]) =>
      sql.includes('player_friends_enemies') &&
      Array.isArray(params) &&
      params.includes('enemy')
    );
    expect(enemyInsert).toBeDefined();
  });

  it('inserts NPC into npcs table before player_friends_enemies FK reference', async () => {
    const oracle = makeMockOracle();
    const ctrl = makeController({ oracle });
    await ctrl.startInterview();
    await ctrl.advanceToLifepath();
    await ctrl.rollLifepath();

    const executeCalls = vi.mocked(oracle.execute).mock.calls;
    const npcInsertIdx = executeCalls.findIndex(([sql]) => sql.includes('INSERT') && sql.includes('npcs'));
    const feInsertIdx = executeCalls.findIndex(([sql]) => sql.includes('player_friends_enemies'));

    expect(npcInsertIdx).toBeGreaterThanOrEqual(0);
    expect(feInsertIdx).toBeGreaterThan(npcInsertIdx);
  });

  it('skips DB inserts when oracle is not connected', async () => {
    const oracle = makeMockOracle();
    vi.mocked(oracle.isConnected).mockReturnValue(false);
    const ctrl = makeController({ oracle });
    await ctrl.startInterview();
    await ctrl.advanceToLifepath();
    // Should not throw even when oracle is disconnected
    await expect(ctrl.rollLifepath()).resolves.toBeDefined();
    expect(oracle.execute).not.toHaveBeenCalled();
  });
});

// ── Stats build types ─────────────────────────────────────────────────────────

describe('OnboardingController — setStats()', () => {
  async function reachStats(ctrl: OnboardingController) {
    await ctrl.startInterview();
    await ctrl.advanceToLifepath();
    await ctrl.rollLifepath();
  }

  it('Standard build assigns 62 stat points total', async () => {
    const ctrl = makeController();
    await reachStats(ctrl);
    const result = await ctrl.setStats('Standard');
    const total = Object.values(result.stats).reduce((a, b) => a + b, 0);
    expect(total).toBe(62);
  });

  it('Major League build assigns 80 stat points total', async () => {
    const ctrl = makeController();
    await reachStats(ctrl);
    const result = await ctrl.setStats('Major League');
    const total = Object.values(result.stats).reduce((a, b) => a + b, 0);
    expect(total).toBe(80);
  });

  it('records the build type in the session', async () => {
    const ctrl = makeController();
    await reachStats(ctrl);
    await ctrl.setStats('Major League');
    const session = ctrl.getSession();
    expect(session.buildType).toBe('Major League');
  });
});

// ── Interview NPC selection ───────────────────────────────────────────────────

describe('OnboardingController — interview NPC selection', () => {
  it('selects a street/district Fixer for Street or Nomad background', async () => {
    const nitroLogic = makeMockNitroLogic();
    // First roll (Family Background) = 5 → Street
    vi.mocked(nitroLogic.oracleRoll)
      .mockResolvedValueOnce({ result: 5, isCriticalSuccess: false, isCriticalFailure: false, luckyReroll: null, reasoning: '1d10 → 5' })
      .mockResolvedValue({ result: 5, isCriticalSuccess: false, isCriticalFailure: false, luckyReroll: null, reasoning: '1d10 → 5' });
    const ctrl = makeController({ nitroLogic });
    await ctrl.startInterview();
    await ctrl.advanceToLifepath();
    const result = await ctrl.rollLifepath();
    expect(result.interviewNPC).toMatch(/fixer/i);
  });

  it('selects a high-tier contact (Rogue) for Corporate background', async () => {
    const nitroLogic = makeMockNitroLogic();
    // First roll = 1 → Corporate
    vi.mocked(nitroLogic.oracleRoll)
      .mockResolvedValueOnce({ result: 1, isCriticalSuccess: false, isCriticalFailure: false, luckyReroll: null, reasoning: '1d10 → 1' })
      .mockResolvedValue({ result: 5, isCriticalSuccess: false, isCriticalFailure: false, luckyReroll: null, reasoning: '1d10 → 5' });
    const ctrl = makeController({ nitroLogic });
    await ctrl.startInterview();
    await ctrl.advanceToLifepath();
    const result = await ctrl.rollLifepath();
    expect(result.interviewNPC).toMatch(/rogue/i);
  });
});

// ── Error handling ─────────────────────────────────────────────────────────────

describe('OnboardingController — error handling', () => {
  it('propagates nitro-logic errors from rollLifepath()', async () => {
    const nitroLogic = makeMockNitroLogic();
    vi.mocked(nitroLogic.oracleRoll).mockRejectedValue(new Error('Node A unreachable'));
    const ctrl = makeController({ nitroLogic });
    await ctrl.startInterview();
    await ctrl.advanceToLifepath();
    await expect(ctrl.rollLifepath()).rejects.toThrow('Node A unreachable');
  });

  it('falls back gracefully when SovereignNarrative narrative generation fails', async () => {
    const sovereignNarrative = makeMockSovereignNarrative();
    vi.mocked(sovereignNarrative.generateNarrative).mockRejectedValue(new Error('SovereignNarrative offline'));
    const ctrl = makeController({ sovereignNarrative });
    await ctrl.startInterview();
    await ctrl.advanceToLifepath();
    // Should still resolve with a fallback dialogue, not throw
    const result = await ctrl.rollLifepath();
    expect(result.dialogue).toBeDefined();
    expect(typeof result.dialogue).toBe('string');
  });
});
