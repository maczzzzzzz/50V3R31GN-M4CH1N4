/**
 * TDD Tests: HybridRoutingController
 *
 * Tests for the Phase 4 orchestration loop:
 *   - Node A (NitroLogicClient) for math/rules
 *   - Node B (OllamaClient) for narrative synthesis
 *   - StoryEngine for deterministic state transitions
 *   - GmApprovalQueue for human-in-the-loop
 * ...then pushes the result back to Foundry via FoundryAdapter.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { HybridRoutingController } from '../../src/core/hybrid-routing-controller.js';
import type { INitroLogicClient, AttackResult, DvResult, OracleResult } from '../../src/core/interfaces.js';
import type { IOllamaClient } from '../../src/core/interfaces.js';
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
    readActor: vi.fn().mockResolvedValue({ name: 'Test Actor', system: { wealth: { eb: 1000 } } }),
    triggerSimplePhone: vi.fn().mockResolvedValue(undefined),
    rollDice: vi.fn().mockResolvedValue({ result: 7 }),
    activateScene: vi.fn().mockResolvedValue(undefined),
    updateActor: vi.fn().mockResolvedValue(undefined),
    queueApproval: vi.fn().mockResolvedValue(undefined),
    openNightMarket: vi.fn().mockResolvedValue(undefined),
    show3dDice: vi.fn().mockResolvedValue(undefined),
  };
}

function makeMockNightMarketService(): NightMarketService {
  return {
    getVendorInventory: vi.fn().mockResolvedValue([]),
    calculateEaglePrice: vi.fn().mockReturnValue(0.5),
  } as unknown as NightMarketService;
}

function makeMockStoryEngine(): StoryEngine {
  return {
    registerBeat: vi.fn(),
    evaluateEvent: vi.fn().mockReturnValue({ transitioned: false }),
    getState: vi.fn(),
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
  let ollama: IOllamaClient;
  let foundry: IFoundryAdapter;
  let storyEngine: StoryEngine;
  let gmApprovalQueue: GmApprovalQueue;
  let nightMarketService: NightMarketService;
  let unifiedOracle: UnifiedOracleClient;
  let redTradeService: RedTradeService;
  let controller: HybridRoutingController;

  beforeEach(() => {
    nitroLogic = makeMockNitroLogic();
    ollama = makeMockOllama();
    foundry = makeMockFoundryAdapter();
    storyEngine = makeMockStoryEngine();
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

  // ── World Pulse Grounding ───────────────────────────────────────────────────

  describe('World Pulse Grounding', () => {
    it('prepends grounded NPC facts when they are mentioned in the prompt', async () => {
      vi.mocked(nitroLogic.resolveAttack).mockResolvedValue(sampleAttackResult);
      
      // Mock Oracle to return Vido's stats
      vi.mocked(unifiedOracle.query).mockImplementation((sql: string) => {
        if (sql.includes('FROM npcs')) {
          return [{ name: 'Vido', hp: 40, faction: 'Maelstrom', disposition: 'neutral' }];
        }
        if (sql.includes('session_memory.messages')) {
          return [{ content: 'Vido says hello.' }];
        }
        return [];
      });

      const attackEvent: FoundryEvent = {
        type: 'resolve_attack',
        payload: {
          attackerSkill: 4, attackerRef: 6, weaponDamage: '3d6',
          weaponArmorPiercing: false, defenderRef: 5, defenderSP: 6,
          rangeBand: 'close', modifiers: 0,
        },
      };

      // Prompt should mention "Vido" to trigger grounding
      vi.mocked(ollama.generateNarrative).mockImplementation((prompt) => {
        return Promise.resolve(`Narrative about Vido`);
      });

      // We need to trigger a foundry event that results in a narrative call
      // and the context or prompt MUST contain "Vido".
      // Let's mock resolveAttack to return a result that we then use in a 
      // direct handleBuyItem call where we can control the vendor name.
      const buyEvent: FoundryEvent = {
        type: 'buy_item',
        payload: {
          itemId: 'cyberdeck-01',
          costEb: 100,
          costEagles: 0.5,
          vendor: 'Vido', // Mentions Vido
          actorId: 'actor-v-001',
        },
      };
      vi.mocked(foundry.readActor).mockResolvedValue({ system: { wealth: { eb: 500 } } });

      await controller.handleFoundryEvent(buyEvent);

      expect(ollama.generateNarrative).toHaveBeenCalledWith(
        expect.any(String),
        expect.stringContaining('vendor=Vido'),
        expect.stringContaining('WORLD PULSE (GROUNDED TRUTH):\n- Vido: HP=40, Faction=Maelstrom, Stance=neutral\n  Context: "Vido says hello...."'),
        );
        });

  });

  // ── open_night_market events ────────────────────────────────────────────────

  describe('handleFoundryEvent — open_night_market', () => {
    it('fetches vendor inventory then calls foundry.openNightMarket', async () => {
      const mockItems = [
        { id: 'item-1', name: 'Cyberdeck', description: 'A hacking rig', costEb: 500, costEagles: 3, vendor: 'Mr. Connors' },
      ];
      vi.mocked(nightMarketService.getVendorInventory).mockResolvedValue(mockItems);

      const event: FoundryEvent = {
        type: 'open_night_market',
        payload: { actorId: 'actor-v-001', vendorName: 'Mr. Connors' },
      };

      await controller.handleFoundryEvent(event);

      expect(nightMarketService.getVendorInventory).toHaveBeenCalledWith('Mr. Connors');
      expect(foundry.openNightMarket).toHaveBeenCalledWith('actor-v-001', 'Mr. Connors', mockItems);
    });
  });

  // ── buy_item events ─────────────────────────────────────────────────────────

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
      vi.mocked(foundry.readActor).mockResolvedValue({ system: { wealth: { eb: 500 } } });

      await controller.handleFoundryEvent(buyEvent);

      expect(foundry.readActor).toHaveBeenCalledWith('actor-v-001');
      expect(foundry.updateActor).toHaveBeenCalledWith('actor-v-001', { 'system.wealth.eb': 400 });
      expect(ollama.generateNarrative).toHaveBeenCalled();
    });

    it('fails if actor has insufficient funds', async () => {
      vi.mocked(foundry.readActor).mockResolvedValue({ system: { wealth: { eb: 50 } } });

      await controller.handleFoundryEvent(buyEvent);

      expect(foundry.updateActor).not.toHaveBeenCalled();
      expect(foundry.sendChatMessage).toHaveBeenCalledWith(expect.stringContaining('Insufficient funds'), expect.any(Object));
    });

    it('calls storyEngine.evaluateEvent with the buy_item payload', async () => {
      await controller.handleFoundryEvent(buyEvent);
      expect(storyEngine.evaluateEvent).toHaveBeenCalledWith({ type: 'buy_item', payload: buyEvent.payload });
    });
  });

  // ── Story Transitions ───────────────────────────────────────────────────────

  describe('Story Transitions', () => {
    it('pushes a message to Foundry chat when a transition occurs', async () => {
      vi.mocked(nitroLogic.oracleRoll).mockResolvedValue(sampleOracleResult);
      vi.mocked(storyEngine.evaluateEvent).mockReturnValue({
        transitioned: true,
        oldBeat: 'Beat 1',
        newBeat: 'Beat 2',
      });

      const rollEvent: FoundryEvent = {
        type: 'oracle_roll',
        payload: { expression: '1d10', applyLuck: false, luckPoints: 0 },
      };

      await controller.handleFoundryEvent(rollEvent);

      expect(foundry.sendChatMessage).toHaveBeenCalledWith(
        expect.stringContaining('Story Advance'),
        expect.objectContaining({ alias: 'Story Engine' }),
      );
    });
  });

  // ── approval_response events ────────────────────────────────────────────────

  describe('handleFoundryEvent — approval_response', () => {
    it('dispatches to GmApprovalQueue.handleResponse', async () => {
      const approvalEvent: FoundryEvent = {
        type: 'approval_response',
        payload: { proposalId: 'prop-123', status: 'approved' },
      };

      await controller.handleFoundryEvent(approvalEvent);

      expect(gmApprovalQueue.handleResponse).toHaveBeenCalledWith('prop-123', 'approved', undefined);
    });
  });

  // ── Red Trade Transit ───────────────────────────────────────────────────────

  describe('handleFoundryEvent — red_trade_transit', () => {
    it('calls rollFriction and pushes a bark message to Foundry chat', async () => {
      vi.mocked(redTradeService.rollFriction).mockReturnValue({
        roll: 5, friction: 2, total: 7, outcome: 'bark',
      });

      const event: FoundryEvent = {
        type: 'red_trade_transit',
        payload: { factionId: 'tyger-claws', currentFriction: 2 },
      };

      await controller.handleFoundryEvent(event);

      expect(redTradeService.rollFriction).toHaveBeenCalledWith(2);
      expect(foundry.sendChatMessage).toHaveBeenCalledWith(
        expect.stringMatching(/tense|street|heat|bark/i),
        expect.objectContaining({ alias: 'Friction Engine' }),
      );
    });

    it('calls rollFriction and pushes a gate message for medium heat', async () => {
      vi.mocked(redTradeService.rollFriction).mockReturnValue({
        roll: 8, friction: 3, total: 11, outcome: 'gate',
      });

      const event: FoundryEvent = {
        type: 'red_trade_transit',
        payload: { factionId: 'maelstrom', currentFriction: 3 },
      };

      await controller.handleFoundryEvent(event);

      expect(foundry.sendChatMessage).toHaveBeenCalledWith(
        expect.stringMatching(/gate|decision|heat/i),
        expect.objectContaining({ alias: 'Friction Engine' }),
      );
    });

    it('calls rollFriction and pushes an ambush message for high heat', async () => {
      vi.mocked(redTradeService.rollFriction).mockReturnValue({
        roll: 10, friction: 8, total: 18, outcome: 'ambush',
      });

      const event: FoundryEvent = {
        type: 'red_trade_transit',
        payload: { factionId: 'maelstrom', currentFriction: 8 },
      };

      await controller.handleFoundryEvent(event);

      expect(foundry.sendChatMessage).toHaveBeenCalledWith(
        expect.stringMatching(/ambush|rival|intervention/i),
        expect.objectContaining({ alias: 'Friction Engine' }),
      );
    });

    it('returns the FrictionRollResult', async () => {
      const mockResult = { roll: 3, friction: 0, total: 3, outcome: 'bark' as const };
      vi.mocked(redTradeService.rollFriction).mockReturnValue(mockResult);

      const event: FoundryEvent = {
        type: 'red_trade_transit',
        payload: { factionId: 'nomads', currentFriction: 0 },
      };

      const result = await controller.handleFoundryEvent(event);
      expect(result).toEqual(mockResult);
    });
  });

  // ── Existing tests (sanity check) ──────────────────────────────────────────

  describe('handleFoundryEvent — resolve_attack', () => {
    it('calls NitroLogicClient.resolveAttack and StoryEngine', async () => {
      vi.mocked(nitroLogic.resolveAttack).mockResolvedValue(sampleAttackResult);

      const attackEvent: FoundryEvent = {
        type: 'resolve_attack',
        payload: {
          attackerSkill: 4, attackerRef: 6, weaponDamage: '3d6',
          weaponArmorPiercing: false, defenderRef: 5, defenderSP: 6,
          rangeBand: 'close', modifiers: 0,
        },
      };

      await controller.handleFoundryEvent(attackEvent);

      expect(nitroLogic.resolveAttack).toHaveBeenCalled();
      expect(storyEngine.evaluateEvent).toHaveBeenCalledWith({ type: 'resolve_attack', result: sampleAttackResult });
    });
  });
});
