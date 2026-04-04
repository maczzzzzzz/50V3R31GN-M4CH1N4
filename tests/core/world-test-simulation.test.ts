/**
 * tests/core/world-test-simulation.test.ts
 *
 * Phase Gate: Full E2E Session Loop Verification (TttA Part 1)
 *
 * This test simulates a complete solo session cycle using the real StoryEngine
 * bootstrapped with TttA Part 1 campaign beats. All external adapters
 * (FoundryAdapter, NitroLogicClient, OllamaClient) are mocked.
 *
 * Verified sequence (Phase Gate per docs/research/2026-03-29_Phase-4-Exhaustive-Blueprint.md §5):
 *   1. Trigger Fixer Gig      → simple_phone → "Got a job, choom."
 *   2. Resolve Attack         → resolveAttack (hit=true) → satisfies Beat 1 Transition Guard
 *   3. Verify Beat Advance    → StoryEngine: beat-1-afterlife-meeting → beat-2-first-gig
 *   4. Execute Night Market   → buy_item → funds deducted → satisfies Beat 2 Transition Guard
 *   5. Verify Beat Advance    → StoryEngine: beat-2-first-gig → beat-3-the-job
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { HybridRoutingController } from '../../src/core/hybrid-routing-controller.js';
import { StoryEngine } from '../../src/core/story-engine.js';
import { GmApprovalQueue } from '../../src/core/gm-approval-queue.js';
import { NightMarketService } from '../../src/core/night-market-service.js';
import { bootstrapTttaPart1, createTttaPart1InitialState } from '../../src/core/campaign-registry.js';
import type { INitroLogicClient, AttackResult } from '../../src/core/interfaces.js';
import type { IOllamaClient } from '../../src/core/interfaces.js';
import type { IFoundryAdapter } from '../../src/api/foundry-adapter.js';
import type { FoundryEvent } from '../../src/shared/schemas/foundry-bridge.schema.js';
import type { UnifiedOracleClient } from '../../src/db/unified-oracle-client.js';
import type { RedTradeService } from '../../src/core/red-trade-service.js';

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
    generateNarrative: vi.fn().mockResolvedValue('The night belongs to you, choom.'),
    isHealthy: vi.fn().mockResolvedValue(true),
  };
}

function makeMockFoundryAdapter(): IFoundryAdapter {
  return {
    start: vi.fn().mockResolvedValue(undefined),
    stop: vi.fn().mockResolvedValue(undefined),
    isConnected: vi.fn().mockReturnValue(true),
    sendChatMessage: vi.fn().mockResolvedValue(undefined),
    readActor: vi.fn().mockResolvedValue({ system: { wealth: { eb: 1000 } } }),
    triggerSimplePhone: vi.fn().mockResolvedValue(undefined),
    rollDice: vi.fn().mockResolvedValue({ result: 7 }),
    activateScene: vi.fn().mockResolvedValue(undefined),
    updateActor: vi.fn().mockResolvedValue(undefined),
    queueApproval: vi.fn().mockResolvedValue(undefined),
    openNightMarket: vi.fn().mockResolvedValue(undefined),
    show3dDice: vi.fn().mockResolvedValue(undefined),
    queryScenes: vi.fn().mockResolvedValue([]),
    pushDashboardUpdate: vi.fn().mockResolvedValue(undefined),
  };
}

function makeMockGmApprovalQueue(): GmApprovalQueue {
  return {
    enqueue: vi.fn(),
    handleResponse: vi.fn(),
    getPending: vi.fn(),
  } as unknown as GmApprovalQueue;
}

function makeMockNightMarketService(): NightMarketService {
  return {
    getVendorInventory: vi.fn().mockResolvedValue([]),
    calculateEaglePrice: vi.fn().mockReturnValue(3),
  } as unknown as NightMarketService;
}

function makeMockUnifiedOracle(): UnifiedOracleClient {
  return {
    query: vi.fn().mockReturnValue([]),
    connect: vi.fn().mockResolvedValue(undefined),
    disconnect: vi.fn().mockResolvedValue(undefined),
    isConnected: vi.fn().mockReturnValue(true),
    executeCommand: vi.fn().mockResolvedValue(undefined),
    executeTransaction: vi.fn().mockResolvedValue(undefined),
  } as unknown as UnifiedOracleClient;
}

function makeMockRedTradeService(): RedTradeService {
  return {
    generateCargo: vi.fn(),
    rollFriction: vi.fn().mockReturnValue({ roll: 3, friction: 0, total: 3, outcome: 'bark' }),
  } as unknown as RedTradeService;
}

// ── Sample data ───────────────────────────────────────────────────────────────

const hitAttackResult: AttackResult = {
  hit: true,
  rollTotal: 18,
  dvTarget: 13,
  rawDamage: 14,
  netDamage: 9,
  criticalInjury: false,
  reasoning: 'REF(6) + Handgun(5) + d10(7) = 18 vs DV 13 → HIT',
};

const attackEvent: FoundryEvent = {
  type: 'resolve_attack',
  payload: {
    attackerSkill: 5,
    attackerRef: 6,
    weaponDamage: '2d6+2',
    weaponArmorPiercing: false,
    defenderRef: 4,
    defenderSP: 5,
    rangeBand: 'close',
    modifiers: 0,
  },
};

const buyItemEvent: FoundryEvent = {
  type: 'buy_item',
  payload: {
    itemId: 'neural-link-01',
    costEb: 500,
    costEagles: 3,
    vendor: 'Mr. Connors',
    actorId: 'actor-v-001',
  },
};

// ── Suite ─────────────────────────────────────────────────────────────────────

describe('Full World Test: TttA Part 1 E2E Session Loop', () => {
  let nitroLogic: INitroLogicClient;
  let ollama: IOllamaClient;
  let foundry: IFoundryAdapter;
  let storyEngine: StoryEngine;
  let gmApprovalQueue: GmApprovalQueue;
  let nightMarketService: NightMarketService;
  let unifiedOracle: UnifiedOracleClient;
  let redTradeService: RedTradeService;
  let controller: HybridRoutingController;

  beforeEach(() => {
    // Real StoryEngine with TttA Part 1 campaign beats registered
    storyEngine = new StoryEngine(createTttaPart1InitialState());
    bootstrapTttaPart1(storyEngine);

    nitroLogic = makeMockNitroLogic();
    ollama = makeMockOllama();
    foundry = makeMockFoundryAdapter();
    gmApprovalQueue = makeMockGmApprovalQueue();
    nightMarketService = makeMockNightMarketService();
    unifiedOracle = makeMockUnifiedOracle();
    redTradeService = makeMockRedTradeService();

    controller = new HybridRoutingController({
      nitroLogicClient: nitroLogic,
      ollamaClient: ollama,
      foundryAdapter: foundry,
      storyEngine,
      gmApprovalQueue,
      nightMarketService,
      unifiedOracle,
      redTradeService,
    });
  });

  // ── Campaign bootstrap ──────────────────────────────────────────────────────

  describe('bootstrapTttaPart1', () => {
    it('sets the initial arc to TttA Part 1', () => {
      const state = storyEngine.getState();
      expect(state.currentArc).toBe('TttA Part 1 - The Afterlife Begins');
    });

    it('sets the initial beat to beat-1-afterlife-meeting', () => {
      expect(storyEngine.getState().currentBeat).toBe('beat-1-afterlife-meeting');
    });

    it('starts with no completed beats and zero Eagle balance', () => {
      const state = storyEngine.getState();
      expect(state.completedBeats).toHaveLength(0);
      expect(state.eagleBalance).toBe(0);
    });
  });

  // ── Phase Gate: Full session loop ───────────────────────────────────────────

  describe('Phase Gate — full E2E loop', () => {
    it('step 1: Fixer gig is delivered via simple_phone', async () => {
      await foundry.triggerSimplePhone(
        '555-ROGUE',
        "Got a job for you, choom. Meet me at the Afterlife tonight. Don't be late.",
      );

      expect(foundry.triggerSimplePhone).toHaveBeenCalledWith(
        '555-ROGUE',
        expect.stringContaining('Afterlife'),
      );
      // Initial beat is unchanged — gig delivery does not trigger a transition
      expect(storyEngine.getState().currentBeat).toBe('beat-1-afterlife-meeting');
    });

    it('step 2-3: resolve_attack (hit=true) advances Beat 1 → Beat 2', async () => {
      vi.mocked(nitroLogic.resolveAttack).mockResolvedValue(hitAttackResult);

      await controller.handleFoundryEvent(attackEvent);

      expect(storyEngine.getState().currentBeat).toBe('beat-2-first-gig');
      expect(storyEngine.getState().completedBeats).toContain('beat-1-afterlife-meeting');
    });

    it('step 3b: Story Engine pushes transition narrative to Foundry chat', async () => {
      vi.mocked(nitroLogic.resolveAttack).mockResolvedValue(hitAttackResult);

      await controller.handleFoundryEvent(attackEvent);

      expect(foundry.sendChatMessage).toHaveBeenCalledWith(
        expect.stringContaining('Story Advance'),
        expect.objectContaining({ alias: 'Story Engine' }),
      );
    });

    it('step 4-5: buy_item (after Beat 2) advances Beat 2 → Beat 3', async () => {
      // Advance to Beat 2 first
      vi.mocked(nitroLogic.resolveAttack).mockResolvedValue(hitAttackResult);
      await controller.handleFoundryEvent(attackEvent);
      expect(storyEngine.getState().currentBeat).toBe('beat-2-first-gig');

      // Now buy an item
      vi.mocked(foundry.readActor).mockResolvedValue({ system: { wealth: { eb: 1000 } } });
      await controller.handleFoundryEvent(buyItemEvent);

      expect(foundry.updateActor).toHaveBeenCalledWith('actor-v-001', { 'system.wealth.eb': 500 });
      expect(storyEngine.getState().currentBeat).toBe('beat-3-the-job');
      expect(storyEngine.getState().completedBeats).toContain('beat-2-first-gig');
    });

    it('full loop in sequence: Gig → Attack → Trade → two Beat advances', async () => {
      // 1. Fixer Gig
      await foundry.triggerSimplePhone('555-ROGUE', "Got a job at the Afterlife.");
      expect(storyEngine.getState().currentBeat).toBe('beat-1-afterlife-meeting');

      // 2. Attack resolves → Beat 1 → Beat 2
      vi.mocked(nitroLogic.resolveAttack).mockResolvedValue(hitAttackResult);
      await controller.handleFoundryEvent(attackEvent);
      expect(storyEngine.getState().currentBeat).toBe('beat-2-first-gig');

      // 3. Night Market purchase → Beat 2 → Beat 3
      vi.mocked(foundry.readActor).mockResolvedValue({ system: { wealth: { eb: 1000 } } });
      await controller.handleFoundryEvent(buyItemEvent);
      expect(storyEngine.getState().currentBeat).toBe('beat-3-the-job');

      // Final state assertions
      const finalState = storyEngine.getState();
      expect(finalState.completedBeats).toEqual(['beat-1-afterlife-meeting', 'beat-2-first-gig']);
      expect(finalState.currentArc).toBe('TttA Part 1 - The Afterlife Begins');
    });

    it('miss attack does NOT advance the beat', async () => {
      vi.mocked(nitroLogic.resolveAttack).mockResolvedValue({
        ...hitAttackResult,
        hit: false,
        rollTotal: 8,
      });

      await controller.handleFoundryEvent(attackEvent);

      // Beat should remain unchanged
      expect(storyEngine.getState().currentBeat).toBe('beat-1-afterlife-meeting');
      expect(storyEngine.getState().completedBeats).toHaveLength(0);
    });
  });
});
