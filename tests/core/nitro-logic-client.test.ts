import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NitroLogicClient } from '../../src/core/nitro-logic-client.js';
import type { NitroLogicConfig } from '../../src/core/interfaces.js';

// ── Helpers ───────────────────────────────────────────────────────────────────

const VALID_CONFIG: NitroLogicConfig = {
  baseUrl: 'http://10.0.0.10:8080/v1',
  model: 'local-llama',
  timeoutMs: 5000,
  seed: 42,
};

function mockFetchSuccess(body: unknown): ReturnType<typeof vi.fn> {
  return vi.fn().mockResolvedValue({
    ok: true,
    status: 200,
    json: async () => body,
    text: async () => JSON.stringify(body),
  });
}

function mockFetchHttpError(status: number, bodyText = 'Internal Server Error'): ReturnType<typeof vi.fn> {
  return vi.fn().mockResolvedValue({
    ok: false,
    status,
    json: async () => ({}),
    text: async () => bodyText,
  });
}

function mockFetchNetworkError(message = 'fetch failed'): ReturnType<typeof vi.fn> {
  return vi.fn().mockRejectedValue(new Error(message));
}

function wrapChatResponse(contentObj: unknown): unknown {
  return {
    choices: [{
      message: {
        role: 'assistant',
        content: JSON.stringify(contentObj),
      },
    }],
  };
}

// ── Config validation ─────────────────────────────────────────────────────────

describe('NitroLogicClient — config validation', () => {
  it('throws on empty baseUrl', () => {
    expect(() => new NitroLogicClient({ ...VALID_CONFIG, baseUrl: '' }))
      .toThrow(/baseUrl/);
  });

  it('throws on timeoutMs < 1', () => {
    expect(() => new NitroLogicClient({ ...VALID_CONFIG, timeoutMs: 0 }))
      .toThrow(/timeoutMs/);
  });

  it('throws on empty model', () => {
    expect(() => new NitroLogicClient({ ...VALID_CONFIG, model: '' }))
      .toThrow(/model/);
  });

  it('constructs successfully with valid config', () => {
    expect(() => new NitroLogicClient(VALID_CONFIG)).not.toThrow();
  });
});

// ── isHealthy ─────────────────────────────────────────────────────────────────

describe('NitroLogicClient — isHealthy()', () => {
  let client: NitroLogicClient;

  beforeEach(() => { client = new NitroLogicClient(VALID_CONFIG); });
  afterEach(() => { vi.restoreAllMocks(); });

  it('returns true when Node A responds 200', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, status: 200, text: async () => '{}' }));
    expect(await client.isHealthy()).toBe(true);
  });

  it('returns false when Node A returns 500', async () => {
    vi.stubGlobal('fetch', mockFetchHttpError(500));
    expect(await client.isHealthy()).toBe(false);
  });

  it('returns false on network error', async () => {
    vi.stubGlobal('fetch', mockFetchNetworkError());
    expect(await client.isHealthy()).toBe(false);
  });
});

// ── resolveAttack ─────────────────────────────────────────────────────────────

describe('NitroLogicClient — resolveAttack()', () => {
  let client: NitroLogicClient;

  beforeEach(() => { client = new NitroLogicClient(VALID_CONFIG); });
  afterEach(() => { vi.restoreAllMocks(); });

  const HIT_RESPONSE = {
    hit: true,
    rollTotal: 18,
    dvTarget: 13,
    rawDamage: 14,
    netDamage: 3,
    criticalInjury: false,
    reasoning: 'REF(6)+Skill(5)+Roll(7)=18 vs DV13. Hit. 3d6=14, SP=11, NetDmg=3.',
  };

  const MISS_RESPONSE = {
    hit: false,
    rollTotal: 7,
    dvTarget: 15,
    rawDamage: 0,
    netDamage: 0,
    criticalInjury: false,
    reasoning: 'REF(4)+Skill(2)+Roll(3)+Mod(-2)=7 vs DV15. Miss.',
  };

  it('returns a valid AttackResult on a hit', async () => {
    vi.stubGlobal('fetch', mockFetchSuccess(wrapChatResponse(HIT_RESPONSE)));
    const result = await client.resolveAttack({
      attackerSkill: 5, attackerRef: 6, weaponDamage: '3d6',
      weaponArmorPiercing: false, defenderRef: 5, defenderSP: 11,
      rangeBand: 'close', modifiers: 0,
    });
    expect(result.hit).toBe(true);
    expect(result.rollTotal).toBe(18);
    expect(result.dvTarget).toBe(13);
    expect(result.rawDamage).toBe(14);
    expect(result.netDamage).toBe(3);
    expect(result.criticalInjury).toBe(false);
    expect(typeof result.reasoning).toBe('string');
    expect(result.reasoning.length).toBeGreaterThan(0);
  });

  it('returns a valid AttackResult on a miss', async () => {
    vi.stubGlobal('fetch', mockFetchSuccess(wrapChatResponse(MISS_RESPONSE)));
    const result = await client.resolveAttack({
      attackerSkill: 2, attackerRef: 4, weaponDamage: '2d6',
      weaponArmorPiercing: false, defenderRef: 5, defenderSP: 7,
      rangeBand: 'medium', modifiers: -2,
    });
    expect(result.hit).toBe(false);
    expect(result.netDamage).toBe(0);
  });

  it('throws when Node A response fails Zod validation (missing hit field)', async () => {
    const malformed = { rollTotal: 18, dvTarget: 13, reasoning: 'ok' };
    vi.stubGlobal('fetch', mockFetchSuccess(wrapChatResponse(malformed)));
    await expect(client.resolveAttack({
      attackerSkill: 5, attackerRef: 6, weaponDamage: '3d6',
      weaponArmorPiercing: false, defenderRef: 5, defenderSP: 11,
      rangeBand: 'close', modifiers: 0,
    })).rejects.toThrow(/schema validation/);
  });

  it('throws when Node A returns HTTP 503', async () => {
    vi.stubGlobal('fetch', mockFetchHttpError(503, 'Service Unavailable'));
    await expect(client.resolveAttack({
      attackerSkill: 5, attackerRef: 6, weaponDamage: '3d6',
      weaponArmorPiercing: false, defenderRef: 5, defenderSP: 11,
      rangeBand: 'close', modifiers: 0,
    })).rejects.toThrow(/503/);
  });

  it('throws on network failure', async () => {
    vi.stubGlobal('fetch', mockFetchNetworkError('connection refused'));
    await expect(client.resolveAttack({
      attackerSkill: 5, attackerRef: 6, weaponDamage: '3d6',
      weaponArmorPiercing: false, defenderRef: 5, defenderSP: 11,
      rangeBand: 'close', modifiers: 0,
    })).rejects.toThrow(/network error/i);
  });

  it('sends temperature:0.0, seed, and top_k in request body', async () => {
    const spy = mockFetchSuccess(wrapChatResponse(HIT_RESPONSE));
    vi.stubGlobal('fetch', spy);
    await client.resolveAttack({
      attackerSkill: 5, attackerRef: 6, weaponDamage: '3d6',
      weaponArmorPiercing: false, defenderRef: 5, defenderSP: 11,
      rangeBand: 'close', modifiers: 0,
    });
    const body = JSON.parse((spy.mock.calls[0] as [string, RequestInit])[1].body as string);
    expect(body.temperature).toBe(0.0);
    expect(body.seed).toBe(42);
    expect(body.top_k).toBe(1);
  });
});

// ── calculateDv ───────────────────────────────────────────────────────────────

describe('NitroLogicClient — calculateDv()', () => {
  let client: NitroLogicClient;

  beforeEach(() => { client = new NitroLogicClient(VALID_CONFIG); });
  afterEach(() => { vi.restoreAllMocks(); });

  it('returns valid DvResult for a skill check', async () => {
    const response = { dv: 15, breakdown: 'Professional DV (15)', reasoning: 'Professional=DV15.' };
    vi.stubGlobal('fetch', mockFetchSuccess(wrapChatResponse(response)));
    const result = await client.calculateDv({
      checkType: 'skill', baseSkill: 5, baseStat: 6,
      situationalModifiers: 0, targetDifficulty: 'professional',
    });
    expect(result.dv).toBe(15);
    expect(typeof result.breakdown).toBe('string');
    expect(typeof result.reasoning).toBe('string');
  });

  it('returns valid DvResult for a ranged attack with range modifier', async () => {
    const response = { dv: 19, breakdown: 'Professional DV (15) + Long (+5) + Situational (-1) = 19', reasoning: 'ok' };
    vi.stubGlobal('fetch', mockFetchSuccess(wrapChatResponse(response)));
    const result = await client.calculateDv({
      checkType: 'ranged_attack', baseSkill: 4, baseStat: 6,
      rangeBand: 'long', situationalModifiers: -1, targetDifficulty: 'professional',
    });
    expect(result.dv).toBe(19);
    expect(result.breakdown).toContain('19');
  });

  it('throws when DvResult is missing dv field', async () => {
    vi.stubGlobal('fetch', mockFetchSuccess(wrapChatResponse({ breakdown: 'ok', reasoning: 'ok' })));
    await expect(client.calculateDv({
      checkType: 'skill', baseSkill: 5, baseStat: 6,
      situationalModifiers: 0, targetDifficulty: 'professional',
    })).rejects.toThrow(/schema validation/);
  });

  it('throws on HTTP error', async () => {
    vi.stubGlobal('fetch', mockFetchHttpError(500));
    await expect(client.calculateDv({
      checkType: 'skill', baseSkill: 5, baseStat: 6,
      situationalModifiers: 0, targetDifficulty: 'professional',
    })).rejects.toThrow(/500/);
  });
});

// ── oracleRoll ────────────────────────────────────────────────────────────────

describe('NitroLogicClient — oracleRoll()', () => {
  let client: NitroLogicClient;

  beforeEach(() => { client = new NitroLogicClient(VALID_CONFIG); });
  afterEach(() => { vi.restoreAllMocks(); });

  it('returns normal roll result', async () => {
    const response = { result: 7, isCriticalSuccess: false, isCriticalFailure: false, luckyReroll: null, reasoning: 'Rolled 7.' };
    vi.stubGlobal('fetch', mockFetchSuccess(wrapChatResponse(response)));
    const result = await client.oracleRoll({ expression: '1d10', applyLuck: false, luckPoints: 0 });
    expect(result.result).toBe(7);
    expect(result.isCriticalSuccess).toBe(false);
    expect(result.isCriticalFailure).toBe(false);
    expect(result.luckyReroll).toBeNull();
  });

  it('returns critical success', async () => {
    const response = { result: 10, isCriticalSuccess: true, isCriticalFailure: false, luckyReroll: null, reasoning: 'Rolled 10. Crit!' };
    vi.stubGlobal('fetch', mockFetchSuccess(wrapChatResponse(response)));
    const result = await client.oracleRoll({ expression: '1d10', applyLuck: false, luckPoints: 0 });
    expect(result.isCriticalSuccess).toBe(true);
    expect(result.result).toBe(10);
  });

  it('returns lucky reroll result when luck applied', async () => {
    const response = { result: 8, isCriticalSuccess: false, isCriticalFailure: false, luckyReroll: 8, reasoning: 'Fumble, rerolled 8.' };
    vi.stubGlobal('fetch', mockFetchSuccess(wrapChatResponse(response)));
    const result = await client.oracleRoll({ expression: '1d10', applyLuck: true, luckPoints: 3 });
    expect(result.luckyReroll).toBe(8);
    expect(result.result).toBe(8);
  });

  it('injects context string into user message', async () => {
    const response = { result: 7, isCriticalSuccess: false, isCriticalFailure: false, luckyReroll: null, reasoning: 'ok' };
    const spy = mockFetchSuccess(wrapChatResponse(response));
    vi.stubGlobal('fetch', spy);
    await client.oracleRoll({
      expression: '1d10',
      context: 'Maximo bribes a bouncer',
      applyLuck: false,
      luckPoints: 0,
    });
    const body = JSON.parse((spy.mock.calls[0] as [string, RequestInit])[1].body as string);
    const userMsg: string = body.messages.find((m: { role: string }) => m.role === 'user').content;
    expect(userMsg).toContain('Maximo bribes a bouncer');
  });

  it('throws when OracleResult is missing result field', async () => {
    vi.stubGlobal('fetch', mockFetchSuccess(wrapChatResponse({
      isCriticalSuccess: false, isCriticalFailure: false, luckyReroll: null, reasoning: 'ok',
    })));
    await expect(client.oracleRoll({ expression: '1d10', applyLuck: false, luckPoints: 0 }))
      .rejects.toThrow(/schema validation/);
  });

  it('includes response_format json_object in every request', async () => {
    const response = { result: 5, isCriticalSuccess: false, isCriticalFailure: false, luckyReroll: null, reasoning: 'ok' };
    const spy = mockFetchSuccess(wrapChatResponse(response));
    vi.stubGlobal('fetch', spy);
    await client.oracleRoll({ expression: '1d10', applyLuck: false, luckPoints: 0 });
    const body = JSON.parse((spy.mock.calls[0] as [string, RequestInit])[1].body as string);
    expect(body.response_format).toEqual({ type: 'json_object' });
  });
});

// ── ocrAnalyze ────────────────────────────────────────────────────────────────

describe('NitroLogicClient — ocrAnalyze()', () => {
  it('throws when clawlinkClient is not provided', async () => {
    const client = new NitroLogicClient(VALID_CONFIG);
    await expect(client.ocrAnalyze('base64data')).rejects.toThrow(/clawlinkClient/);
  });

  it('calls executeRpc with ocr_analyze and the base64 image', async () => {
    const mockRpc = vi.fn().mockResolvedValue([
      { text: 'Room 101', x: 0.1, y: 0.2, confidence: 0.95 },
    ]);
    const client = new NitroLogicClient({
      ...VALID_CONFIG,
      clawlinkClient: { executeRpc: mockRpc },
    });
    const result = await client.ocrAnalyze('base64abc');
    expect(mockRpc).toHaveBeenCalledWith('ocr_analyze', { image: 'base64abc' });
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({ text: 'Room 101', confidence: 0.95 });
  });

  it('returns all detected entities from the RPC response', async () => {
    const entities = [
      { text: 'Heist Zone', x: 0.5, y: 0.5, confidence: 0.9 },
      { text: 'Exit', x: 0.9, y: 0.1, confidence: 0.75 },
    ];
    const client = new NitroLogicClient({
      ...VALID_CONFIG,
      clawlinkClient: { executeRpc: vi.fn().mockResolvedValue(entities) },
    });
    const result = await client.ocrAnalyze('img123');
    expect(result).toHaveLength(2);
    expect(result[1]).toMatchObject({ text: 'Exit' });
  });

  it('throws on Zero-Trust validation failure when response is not an array', async () => {
    const client = new NitroLogicClient({
      ...VALID_CONFIG,
      clawlinkClient: { executeRpc: vi.fn().mockResolvedValue({ text: 'not an array' }) },
    });
    await expect(client.ocrAnalyze('img')).rejects.toThrow(/Zero-Trust validation/);
  });

  it('throws on Zero-Trust validation failure when entity is missing required fields', async () => {
    const client = new NitroLogicClient({
      ...VALID_CONFIG,
      clawlinkClient: { executeRpc: vi.fn().mockResolvedValue([{ text: 'No coords' }]) },
    });
    await expect(client.ocrAnalyze('img')).rejects.toThrow(/Zero-Trust validation/);
  });

  it('accepts an empty entity array', async () => {
    const client = new NitroLogicClient({
      ...VALID_CONFIG,
      clawlinkClient: { executeRpc: vi.fn().mockResolvedValue([]) },
    });
    const result = await client.ocrAnalyze('empty');
    expect(result).toEqual([]);
  });

  it('propagates ClawLink executeRpc errors', async () => {
    const client = new NitroLogicClient({
      ...VALID_CONFIG,
      clawlinkClient: { executeRpc: vi.fn().mockRejectedValue(new Error('TCP timeout')) },
    });
    await expect(client.ocrAnalyze('img')).rejects.toThrow('TCP timeout');
  });
});

// ── balanceNpcForSoloPlay ─────────────────────────────────────────────────────

describe('NitroLogicClient — balanceNpcForSoloPlay()', () => {
  const MOCK_RPC = vi.fn().mockResolvedValue([
    { text: 'REF:6 SP:11 HP:35', x: 0, y: 0, confidence: 1.0 },
  ]);

  const CLIENT_WITH_CLAW = {
    ...VALID_CONFIG,
    clawlinkClient: { executeRpc: MOCK_RPC },
  };

  const VALID_NPC_STAT_BLOCK = {
    REF: 4,
    DEX: 4,
    BODY: 5,
    combatSkill: 4,
    hp: 35,
    sp: 9,
    reasoning: 'Player DV≈15. NPC attack=REF(4)+Skill(4)+5.5=13.5 vs DV15, hit prob=0% — below 60% cap.',
  };

  afterEach(() => {
    vi.restoreAllMocks();
    MOCK_RPC.mockClear();
  });

  it('happy path: returns a valid NpcStatBlock when ocrAnalyze succeeds and LLM returns valid JSON', async () => {
    MOCK_RPC.mockResolvedValue([{ text: 'REF:6 SP:11 HP:35', x: 0, y: 0, confidence: 1.0 }]);
    vi.stubGlobal('fetch', mockFetchSuccess(wrapChatResponse(VALID_NPC_STAT_BLOCK)));

    const client = new NitroLogicClient(CLIENT_WITH_CLAW);
    const result = await client.balanceNpcForSoloPlay({ playerSheetBase64: 'base64img' });

    expect(result.REF).toBe(4);
    expect(result.DEX).toBe(4);
    expect(result.BODY).toBe(5);
    expect(result.combatSkill).toBe(4);
    expect(result.hp).toBe(35);
    expect(result.sp).toBe(9);
    expect(typeof result.reasoning).toBe('string');
    expect(result.reasoning.length).toBeGreaterThan(0);
  });

  it('uses the default cap of 0.60 when targetHitProbabilityCap is not specified', async () => {
    MOCK_RPC.mockResolvedValue([{ text: 'REF:6 SP:11 HP:35', x: 0, y: 0, confidence: 1.0 }]);
    const spy = mockFetchSuccess(wrapChatResponse(VALID_NPC_STAT_BLOCK));
    vi.stubGlobal('fetch', spy);

    const client = new NitroLogicClient(CLIENT_WITH_CLAW);
    await client.balanceNpcForSoloPlay({ playerSheetBase64: 'base64img' });

    const body = JSON.parse((spy.mock.calls[0] as [string, RequestInit])[1].body as string);
    const userMsg: string = body.messages.find((m: { role: string }) => m.role === 'user').content;
    const parsed = JSON.parse(userMsg);
    expect(parsed.hitCap).toBe(0.60);
  });

  it('uses the provided targetHitProbabilityCap when specified', async () => {
    MOCK_RPC.mockResolvedValue([{ text: 'REF:5 SP:9 HP:30', x: 0, y: 0, confidence: 0.9 }]);
    const spy = mockFetchSuccess(wrapChatResponse(VALID_NPC_STAT_BLOCK));
    vi.stubGlobal('fetch', spy);

    const client = new NitroLogicClient(CLIENT_WITH_CLAW);
    await client.balanceNpcForSoloPlay({ playerSheetBase64: 'base64img', targetHitProbabilityCap: 0.45 });

    const body = JSON.parse((spy.mock.calls[0] as [string, RequestInit])[1].body as string);
    const userMsg: string = body.messages.find((m: { role: string }) => m.role === 'user').content;
    const parsed = JSON.parse(userMsg);
    expect(parsed.hitCap).toBe(0.45);
  });

  it('throws when clawlinkClient is not provided (ocrAnalyze fails)', async () => {
    const client = new NitroLogicClient(VALID_CONFIG);
    await expect(
      client.balanceNpcForSoloPlay({ playerSheetBase64: 'base64img' }),
    ).rejects.toThrow(/clawlinkClient/);
  });

  it('throws Zero-Trust validation error when LLM returns invalid JSON shape (missing ref)', async () => {
    MOCK_RPC.mockResolvedValue([{ text: 'REF:6 SP:11 HP:35', x: 0, y: 0, confidence: 1.0 }]);
    const malformed = { DEX: 4, BODY: 5, combatSkill: 4, hp: 35, sp: 9, reasoning: 'ok' }; // missing REF
    vi.stubGlobal('fetch', mockFetchSuccess(wrapChatResponse(malformed)));

    const client = new NitroLogicClient(CLIENT_WITH_CLAW);
    await expect(
      client.balanceNpcForSoloPlay({ playerSheetBase64: 'base64img' }),
    ).rejects.toThrow(/schema validation/);
  });

  it('propagates network error from LLM as a descriptive error', async () => {
    MOCK_RPC.mockResolvedValue([{ text: 'REF:6 SP:11 HP:35', x: 0, y: 0, confidence: 1.0 }]);
    vi.stubGlobal('fetch', mockFetchNetworkError('ECONNREFUSED'));

    const client = new NitroLogicClient(CLIENT_WITH_CLAW);
    await expect(
      client.balanceNpcForSoloPlay({ playerSheetBase64: 'base64img' }),
    ).rejects.toThrow(/network error/i);
  });

  it('passes detected OCR entities as detectedPlayerStats in the LLM user message', async () => {
    MOCK_RPC.mockResolvedValue([
      { text: 'REF:6', x: 0, y: 0, confidence: 1.0 },
      { text: 'SP:11', x: 0.1, y: 0, confidence: 0.9 },
    ]);
    const spy = mockFetchSuccess(wrapChatResponse(VALID_NPC_STAT_BLOCK));
    vi.stubGlobal('fetch', spy);

    const client = new NitroLogicClient(CLIENT_WITH_CLAW);
    await client.balanceNpcForSoloPlay({ playerSheetBase64: 'base64img' });

    const body = JSON.parse((spy.mock.calls[0] as [string, RequestInit])[1].body as string);
    const userMsg: string = body.messages.find((m: { role: string }) => m.role === 'user').content;
    const parsed = JSON.parse(userMsg);
    expect(parsed.detectedPlayerStats).toContain('REF:6');
    expect(parsed.detectedPlayerStats).toContain('SP:11');
  });
});
