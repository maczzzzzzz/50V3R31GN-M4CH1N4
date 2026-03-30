/**
 * TDD Tests: HybridRoutingController
 *
 * Tests for the Phase 3 orchestration loop that routes Foundry events to:
 *   - Node A (NitroLogicClient) for math/rules
 *   - Node B (OllamaClient) for narrative synthesis
 * ...then pushes the result back to Foundry via FoundryAdapter.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { HybridRoutingController } from '../../src/core/hybrid-routing-controller.js';
import type { INitroLogicClient, AttackResult, DvResult, OracleResult } from '../../src/core/interfaces.js';
import type { IOllamaClient } from '../../src/core/interfaces.js';
import type { IFoundryAdapter } from '../../src/api/foundry-adapter.js';
import type { FoundryEvent } from '../../src/shared/schemas/foundry-bridge.schema.js';

// ── Mock factories ────────────────────────────────────────────────────────────

function makeMockNitroLogic(): INitroLogicClient {
  return {
    resolveAttack: vi.fn(),
    calculateDv: vi.fn(),
    oracleRoll: vi.fn(),
    isHealthy: vi.fn().mockResolvedValue(true),
  };
}

function makeMockOllama(): IOllamaClient {
  return {
    generateNarrative: vi.fn().mockResolvedValue('The night is young, choom.'),
    isHealthy: vi.fn().mockResolvedValue(true),
  };
}

function makeMockFoundryAdapter(): IFoundryAdapter {
  return {
    start: vi.fn().mockResolvedValue(undefined),
    stop: vi.fn().mockResolvedValue(undefined),
    isConnected: vi.fn().mockReturnValue(true),
    sendChatMessage: vi.fn().mockResolvedValue(undefined),
    readActor: vi.fn().mockResolvedValue({ name: 'Test Actor', hp: 40 }),
    triggerSimplePhone: vi.fn().mockResolvedValue(undefined),
    rollDice: vi.fn().mockResolvedValue({ result: 7 }),
    activateScene: vi.fn().mockResolvedValue(undefined),
  };
}

// ── Sample attack result from Node A ─────────────────────────────────────────

const sampleAttackResult: AttackResult = {
  hit: true,
  rollTotal: 16,
  dvTarget: 13,
  rawDamage: 14,
  netDamage: 8,
  criticalInjury: false,
  reasoning: 'REF(6) + Handgun(4) + d10(6) = 16 vs DV 13 → HIT',
};

const sampleDvResult: DvResult = {
  dv: 15,
  breakdown: 'Professional DV (15)',
  reasoning: 'Lookup table: professional = 15',
};

const sampleOracleResult: OracleResult = {
  result: 8,
  isCriticalSuccess: false,
  isCriticalFailure: false,
  luckyReroll: null,
  reasoning: '1d10 → 8',
};

// ── Suite ─────────────────────────────────────────────────────────────────────

describe('HybridRoutingController', () => {
  let nitroLogic: INitroLogicClient;
  let ollama: IOllamaClient;
  let foundry: IFoundryAdapter;
  let controller: HybridRoutingController;

  beforeEach(() => {
    nitroLogic = makeMockNitroLogic();
    ollama = makeMockOllama();
    foundry = makeMockFoundryAdapter();
    controller = new HybridRoutingController({ nitroLogicClient: nitroLogic, ollamaClient: ollama, foundryAdapter: foundry });
  });

  // ── resolve_attack events ───────────────────────────────────────────────────

  describe('handleFoundryEvent — resolve_attack', () => {
    const attackEvent: FoundryEvent = {
      type: 'resolve_attack',
      payload: {
        attackerSkill: 4,
        attackerRef: 6,
        weaponDamage: '3d6',
        weaponArmorPiercing: false,
        defenderRef: 5,
        defenderSP: 6,
        rangeBand: 'close',
        modifiers: 0,
      },
    };

    it('calls NitroLogicClient.resolveAttack with the event payload', async () => {
      vi.mocked(nitroLogic.resolveAttack).mockResolvedValue(sampleAttackResult);

      await controller.handleFoundryEvent(attackEvent);

      expect(nitroLogic.resolveAttack).toHaveBeenCalledWith(attackEvent.payload);
    });

    it('calls OllamaClient.generateNarrative with result context', async () => {
      vi.mocked(nitroLogic.resolveAttack).mockResolvedValue(sampleAttackResult);

      await controller.handleFoundryEvent(attackEvent);

      expect(ollama.generateNarrative).toHaveBeenCalledWith(
        expect.any(String),
        expect.stringContaining('hit=true'),
      );
    });

    it('pushes the narrative prose to Foundry chat', async () => {
      vi.mocked(nitroLogic.resolveAttack).mockResolvedValue(sampleAttackResult);
      vi.mocked(ollama.generateNarrative).mockResolvedValue('Steel sparks fly as the round connects!');

      await controller.handleFoundryEvent(attackEvent);

      expect(foundry.sendChatMessage).toHaveBeenCalledWith(
        'Steel sparks fly as the round connects!',
        expect.objectContaining({ alias: expect.any(String) }),
      );
    });

    it('still sends a fallback chat message if OllamaClient throws', async () => {
      vi.mocked(nitroLogic.resolveAttack).mockResolvedValue(sampleAttackResult);
      vi.mocked(ollama.generateNarrative).mockRejectedValue(new Error('Ollama offline'));

      await controller.handleFoundryEvent(attackEvent);

      // Should still push something to Foundry (math result, not narrative)
      expect(foundry.sendChatMessage).toHaveBeenCalled();
    });

    it('throws if NitroLogicClient.resolveAttack throws', async () => {
      vi.mocked(nitroLogic.resolveAttack).mockRejectedValue(new Error('Node A unreachable'));

      await expect(controller.handleFoundryEvent(attackEvent)).rejects.toThrow('Node A unreachable');
    });
  });

  // ── calculate_dv events ─────────────────────────────────────────────────────

  describe('handleFoundryEvent — calculate_dv', () => {
    const dvEvent: FoundryEvent = {
      type: 'calculate_dv',
      payload: {
        checkType: 'skill',
        baseSkill: 5,
        baseStat: 6,
        situationalModifiers: 0,
        targetDifficulty: 'professional',
      },
    };

    it('calls NitroLogicClient.calculateDv with payload', async () => {
      vi.mocked(nitroLogic.calculateDv).mockResolvedValue(sampleDvResult);

      await controller.handleFoundryEvent(dvEvent);

      expect(nitroLogic.calculateDv).toHaveBeenCalledWith(dvEvent.payload);
    });

    it('pushes DV result to Foundry chat', async () => {
      vi.mocked(nitroLogic.calculateDv).mockResolvedValue(sampleDvResult);

      await controller.handleFoundryEvent(dvEvent);

      expect(foundry.sendChatMessage).toHaveBeenCalled();
    });
  });

  // ── oracle_roll events ──────────────────────────────────────────────────────

  describe('handleFoundryEvent — oracle_roll', () => {
    const rollEvent: FoundryEvent = {
      type: 'oracle_roll',
      payload: {
        expression: '1d10',
        applyLuck: false,
        luckPoints: 0,
      },
    };

    it('calls NitroLogicClient.oracleRoll with payload', async () => {
      vi.mocked(nitroLogic.oracleRoll).mockResolvedValue(sampleOracleResult);

      await controller.handleFoundryEvent(rollEvent);

      expect(nitroLogic.oracleRoll).toHaveBeenCalledWith(rollEvent.payload);
    });

    it('pushes roll result to Foundry chat', async () => {
      vi.mocked(nitroLogic.oracleRoll).mockResolvedValue(sampleOracleResult);

      await controller.handleFoundryEvent(rollEvent);

      expect(foundry.sendChatMessage).toHaveBeenCalled();
    });
  });

  // ── read_actor events ───────────────────────────────────────────────────────

  describe('handleFoundryEvent — read_actor', () => {
    it('calls FoundryAdapter.readActor and returns actor data', async () => {
      const actorData = { name: 'V', hp: 45 };
      vi.mocked(foundry.readActor).mockResolvedValue(actorData);

      const readEvent: FoundryEvent = {
        type: 'read_actor',
        payload: { actorId: 'actor-v-001' },
      };

      const result = await controller.handleFoundryEvent(readEvent);
      expect(foundry.readActor).toHaveBeenCalledWith('actor-v-001');
      expect(result).toEqual(actorData);
    });
  });

  // ── unknown event type ──────────────────────────────────────────────────────

  describe('handleFoundryEvent — unknown type', () => {
    it('throws an error for unrecognised event types', async () => {
      const unknownEvent = { type: 'unknown_event', payload: {} } as unknown as FoundryEvent;
      await expect(controller.handleFoundryEvent(unknownEvent)).rejects.toThrow(/unknown.*event/i);
    });
  });
});
