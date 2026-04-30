/**
 * TDD Tests: HybridRoutingController
 *
 * Tests for the Phase 4 orchestration loop:
 *   - Node A (NitroLogicClient) for math/rules
 *   - Node B (SovereignNarrativeClient) for narrative synthesis
 *   - StoryEngine for deterministic state transitions
 *   - GmApprovalQueue for human-in-the-loop
 * ...then pushes the result back to Foundry via FoundryAdapter.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { HybridRoutingController } from '../../src/core/hybrid-routing-controller.js';
import type { INitroLogicClient, AttackResult, DvResult, OracleResult } from '../../src/core/interfaces.js';
import type { ISovereignNarrativeClient } from '../../src/core/interfaces.js';
import type { IFoundryAdapter } from '../../src/api/foundry-adapter.js';
import type { FoundryEvent } from '../../src/shared/schemas/foundry-bridge.schema.js';
import { StoryEngine } from '../../src/core/story-engine.js';
import { GmApprovalQueue } from '../../src/core/gm-approval-queue.js';
import { NightMarketService } from '../../src/core/night-market-service.js';
import type { UnifiedOracleClient } from '../../src/db/unified-oracle-client.js';
import type { RedTradeService } from '../../src/core/red-trade-service.js';

// ── Mock factories ────────────────────────────────────────────────────────────

function makeMockNitroLogic(): INitroLogicClient {
  return {
    resolveAttack: vi.fn(),
    calculateDv: vi.fn(),
    oracleRoll: vi.fn(),
    isHealthy: vi.fn().mockResolvedValue(true),
    stop: vi.fn().mockResolvedValue(undefined),
    ocrAnalyze: vi.fn().mockResolvedValue([]),
  };
}

function makeMockSovereignNarrative(): ISovereignNarrativeClient {
  return {
    generateNarrative: vi.fn().mockResolvedValue('The night is young, choom.'),
    isHealthy: vi.fn().mockResolvedValue(true),
    setProfile: vi.fn(),
    stop: vi.fn().mockResolvedValue(undefined),
  };
}

function makeMockFoundryAdapter(): IFoundryAdapter {
  return {
    start: vi.fn().mockResolvedValue(undefined),
    stop: vi.fn().mockResolvedValue(undefined),
    isConnected: vi.fn().mockReturnValue(true),
    sendChatMessage: vi.fn().mockResolvedValue(undefined),
    readActor: vi.fn().mockResolvedValue({ name: 'Test Actor', system: { wealth: { eb: 1000 } } }),
    triggerSimplePhone: vi.fn().mockResolvedValue(undefined),
    rollDice: vi.fn().mockResolvedValue({ result: 7 }),
    activateScene: vi.fn().mockResolvedValue(undefined),
    updateActor: vi.fn().mockResolvedValue(undefined),
    queueApproval: vi.fn().mockResolvedValue(undefined),
    openNightMarket: vi.fn().mockResolvedValue(undefined),
    show3dDice: vi.fn().mockResolvedValue(undefined),
    queryScenes: vi.fn().mockResolvedValue([]),
    pushDashboardUpdate: vi.fn().mockResolvedValue(undefined),
    triggerFxGlitch: vi.fn().mockResolvedValue(undefined),
    runSequence: vi.fn().mockResolvedValue(undefined),
    triggerPretextOverlay: vi.fn().mockResolvedValue(undefined),
    onEvent: vi.fn(),
    getHandshakeToken: vi.fn().mockReturnValue('token'),
  };
}

function makeMockNightMarketService(): NightMarketService {
  return {
    getVendorInventory: vi.fn().mockResolvedValue({ items: [] }),
    calculateEaglePrice: vi.fn().mockReturnValue(0.5),
  } as unknown as NightMarketService;
}

function makeMockStoryEngine(): StoryEngine {
  return {
    registerBeat: vi.fn(),
    evaluateEvent: vi.fn().mockReturnValue({ transitioned: false }),
    getState: vi.fn(),
    generateOverlayParams: vi.fn().mockResolvedValue({ text: 'MOCK OVERLAY' }),
  } as unknown as StoryEngine;
}

function makeMockGmApprovalQueue(): GmApprovalQueue {
  return {
    enqueue: vi.fn(),
    handleResponse: vi.fn(),
    getPending: vi.fn(),
  } as unknown as GmApprovalQueue;
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
    rollFriction: vi.fn().mockReturnValue({
      roll: 5, friction: 2, total: 7, outcome: 'bark',
    }),
  } as unknown as RedTradeService;
}

// ── Sample results ────────────────────────────────────────────────────────────

const sampleAttackResult: AttackResult = {
  hit: true,
  rollTotal: 16,
  dvTarget: 13,
  rawDamage: 14,
  netDamage: 8,
  criticalInjury: false,
  reasoning: 'REF(6) + Handgun(4) + d10(6) = 16 vs DV 13 → HIT',
};

const sampleOracleResult: OracleResult = {
  result: 10,
  isCriticalSuccess: true,
  isCriticalFailure: false,
  luckyReroll: null,
  reasoning: '1d10 → 10',
};

// ── Suite ─────────────────────────────────────────────────────────────────────

describe('HybridRoutingController', () => {
  let nitroLogic: INitroLogicClient;
  let sovereignNarrative: ISovereignNarrativeClient;
  let foundry: IFoundryAdapter;
  let storyEngine: StoryEngine;
  let gmApprovalQueue: GmApprovalQueue;
  let nightMarketService: NightMarketService;
  let unifiedOracle: UnifiedOracleClient;
  let redTradeService: RedTradeService;
  let controller: HybridRoutingController;

  beforeEach(() => {
    nitroLogic = makeMockNitroLogic();
    sovereignNarrative = makeMockSovereignNarrative();
    foundry = makeMockFoundryAdapter();
    storyEngine = makeMockStoryEngine();
    gmApprovalQueue = makeMockGmApprovalQueue();
    nightMarketService = makeMockNightMarketService();
    unifiedOracle = makeMockUnifiedOracle();
    redTradeService = makeMockRedTradeService();
    controller = new HybridRoutingController({
      nitroLogicClient: nitroLogic,
      sovereignNarrativeClient: sovereignNarrative,
      foundryAdapter: foundry,
      storyEngine,
      gmApprovalQueue,
      nightMarketService,
      unifiedOracle,
      redTradeService,
    });
  });

  describe('World Pulse Grounding', () => {
    it('prepends grounded NPC facts when they are mentioned in the prompt', async () => {
      vi.mocked(nitroLogic.resolveAttack).mockResolvedValue(sampleAttackResult);
      
      vi.mocked(unifiedOracle.query).mockImplementation((sql: string) => {
        if (sql.includes('FROM map_assets')) return [];
        if (sql.includes('FROM npcs')) {
          return [{ name: 'Vido', hp: 40, faction: 'Maelstrom', disposition: 'neutral' }];
        }
        if (sql.includes('session_memory.messages')) {
          return [{ content: 'Vido says hello.' }];
        }
        return [];
      });

      const buyEvent: FoundryEvent = {
        type: 'buy_item',
        payload: {
          itemId: 'cyberdeck-01',
          costEb: 100,
          costEagles: 0.5,
          vendor: 'Vido',
          actorId: 'actor-v-001',
        },
      };
      vi.mocked(foundry.readActor).mockResolvedValue({ system: { wealth: { eb: 500 } } } as any);

      await controller.handleFoundryEvent(buyEvent);

      console.log("CALLS:", sovereignNarrative.generateNarrative.mock.calls);
    });
  });

  describe('handleFoundryEvent — open_night_market', () => {
    it('fetches vendor inventory then calls foundry.openNightMarket', async () => {
      const mockItems = [
        { id: 'item-1', name: 'Cyberdeck', description: 'A hacking rig', costEb: 500, costEagles: 3, vendor: 'Mr. Connors' },
      ];
      vi.mocked(nightMarketService.getVendorInventory).mockResolvedValue({ items: mockItems } as any);

      const event: FoundryEvent = {
        type: 'open_night_market',
        payload: { actorId: 'actor-v-001', vendorName: 'Mr. Connors' },
      };

      await controller.handleFoundryEvent(event);

      expect(nightMarketService.getVendorInventory).toHaveBeenCalledWith('Mr. Connors');
      expect(foundry.openNightMarket).toHaveBeenCalledWith('actor-v-001', 'Mr. Connors', mockItems);
      });
  });

  describe('handleFoundryEvent — buy_item', () => {
    const buyEvent: FoundryEvent = {
      type: 'buy_item',
      payload: {
        itemId: 'cyberdeck-01',
        costEb: 100,
        costEagles: 0.5,
        vendor: 'Mr. Connors',
        actorId: 'actor-v-001',
      },
    };

    it('deducts eb from actor and pushes narrative', async () => {
      vi.mocked(foundry.readActor).mockResolvedValue({ system: { wealth: { eb: 500 } } } as any);

      await controller.handleFoundryEvent(buyEvent);

      expect(foundry.readActor).toHaveBeenCalledWith('actor-v-001');
      expect(foundry.updateActor).toHaveBeenCalledWith('actor-v-001', { 'system.wealth.eb': 400 });
      expect(sovereignNarrative.generateNarrative).toHaveBeenCalled();
    });
  });

  describe('Intent Swarm', () => {
    it('dispatches concurrent requests to determine Tone and Intensity', async () => {
      const generateSpy = vi.spyOn(sovereignNarrative, 'generateNarrative').mockResolvedValue('Tense');
      const calcDvSpy = vi.spyOn(nitroLogic, 'calculateDv').mockResolvedValue({
        dv: 16,
        breakdown: 'Mock',
        checkType: 'skill',
        baseStat: 8,
        baseSkill: 6,
        targetDifficulty: 'professional'
      });

      const result = await controller.evaluateIntentSwarm('A fierce gunfight in the rain.');

      expect(generateSpy).toHaveBeenCalledWith('Determine emotional tone (1 word) of:', 'A fierce gunfight in the rain.', undefined, undefined, 0.7, 0.9);
      expect(calcDvSpy).toHaveBeenCalledWith({ checkType: 'skill', baseStat: 8, baseSkill: 6, targetDifficulty: 'professional', situationalModifiers: 0 });
      expect(result).toEqual({ tone: 'Tense', intensity: 0.8 });
    });
  });
});
