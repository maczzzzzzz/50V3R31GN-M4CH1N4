/**
 * tests/core/red-trade-story.test.ts
 *
 * Phase Gate: Red Trade "One-Shot" E2E Loop (Phase 5.1 Task 4)
 *
 * Verifies the dynamic 3-beat Red Trade arc:
 *   Beat 1 (Fixer Call)  → red_trade_transit  → Beat 2 (Transit)
 *   Beat 2 (Transit)     → buy_item (delivery) → Beat 3 (Handoff)
 *   Beat 3 (Handoff)     → terminal
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { StoryEngine } from '../../packages/hermes-core/src/core/story-engine.js';
import { HybridRoutingController } from '../../packages/hermes-core/src/core/hybrid-routing-controller.js';
import {
  bootstrapRedTrade,
  createRedTradeInitialState,
} from '../../packages/hermes-core/src/core/campaign-registry.js';
import type { INitroLogicClient, ISovereignNarrativeClient } from '../../packages/hermes-core/src/core/interfaces.js';
import type { IFoundryAdapter } from '../../packages/hermes-core/src/api/foundry-adapter.js';
import type { FoundryEvent } from '../../packages/hermes-core/src/shared/schemas/foundry-bridge.schema.js';
import type { GmApprovalQueue } from '../../packages/hermes-core/src/core/gm-approval-queue.js';
import type { NightMarketService } from '../../packages/hermes-core/src/core/night-market-service.js';
import type { UnifiedOracleClient } from '../../packages/hermes-core/src/db/unified-oracle-client.js';
import type { RedTradeService } from '../../packages/hermes-core/src/core/red-trade-service.js';

// ── Mock factories ────────────────────────────────────────────────────────────

function makeMockNitroLogic(): INitroLogicClient {
  return {
    resolveAttack: vi.fn(),
    calculateDv: vi.fn(),
    oracleRoll: vi.fn(),
    isHealthy: vi.fn().mockResolvedValue(true),
  };
}

function makeMockSovereignNarrative(): ISovereignNarrativeClient {
  return {
    generateNarrative: vi.fn().mockResolvedValue('The city never sleeps, choom.'),
    isHealthy: vi.fn().mockResolvedValue(true),
    stop: vi.fn().mockResolvedValue(undefined),
    setProfile: vi.fn(),
  };
}

function makeMockFoundryAdapter(): IFoundryAdapter {
  return {
    start: vi.fn().mockResolvedValue(undefined),
    stop: vi.fn().mockResolvedValue(undefined),
    isConnected: vi.fn().mockReturnValue(true),
    sendChatMessage: vi.fn().mockResolvedValue(undefined),
    readActor: vi.fn().mockResolvedValue({ system: { wealth: { eb: 2000 } } }),
    triggerSimplePhone: vi.fn().mockResolvedValue(undefined),
    rollDice: vi.fn().mockResolvedValue({ result: 5 }),
    activateScene: vi.fn().mockResolvedValue(undefined),
    updateActor: vi.fn().mockResolvedValue(undefined),
    queueApproval: vi.fn().mockResolvedValue(undefined),
    openNightMarket: vi.fn().mockResolvedValue(undefined),
    show3dDice: vi.fn().mockResolvedValue(undefined),
    queryScenes: vi.fn().mockResolvedValue([]),
    pushDashboardUpdate: vi.fn().mockResolvedValue(undefined),
  };
}

function makeMockRedTradeService(): RedTradeService {
  return {
    generateCargo: vi.fn(),
    rollFriction: vi.fn().mockReturnValue({ roll: 4, friction: 2, total: 6, outcome: 'bark' }),
  } as unknown as RedTradeService;
}

function makeController(storyEngine: StoryEngine, foundry: IFoundryAdapter, redTradeService: RedTradeService): HybridRoutingController {
  return new HybridRoutingController({
    nitroLogicClient: makeMockNitroLogic(),
    sovereignNarrativeClient: makeMockSovereignNarrative(),
    foundryAdapter: foundry,
    storyEngine,
    gmApprovalQueue: { enqueue: vi.fn(), handleResponse: vi.fn(), getPending: vi.fn() } as unknown as GmApprovalQueue,
    nightMarketService: { getVendorInventory: vi.fn().mockResolvedValue([]), calculateEaglePrice: vi.fn() } as unknown as NightMarketService,
    unifiedOracle: { 
      isConnected: vi.fn().mockReturnValue(true),
      query: vi.fn().mockReturnValue([]), 
      connect: vi.fn(), 
      disconnect: vi.fn(), 
      executeCommand: vi.fn().mockResolvedValue(undefined), 
      executeTransaction: vi.fn().mockResolvedValue(undefined) 
    } as unknown as UnifiedOracleClient,
    redTradeService,
  });
}

// ── Suite ─────────────────────────────────────────────────────────────────────

describe('Red Trade "One-Shot" Story Arc', () => {
  let storyEngine: StoryEngine;
  let foundry: IFoundryAdapter;
  let redTradeService: RedTradeService;
  let controller: HybridRoutingController;

  beforeEach(() => {
    foundry = makeMockFoundryAdapter();
    redTradeService = makeMockRedTradeService();
    storyEngine = new StoryEngine(createRedTradeInitialState('tyger-claws'));
    bootstrapRedTrade(storyEngine);
    controller = makeController(storyEngine, foundry, redTradeService);
  });

  // ── Initial state ─────────────────────────────────────────────────────────

  describe('createRedTradeInitialState', () => {
    it('sets the arc to Red Trade', () => {
      expect(storyEngine.getState().currentArc).toBe('Red Trade — One-Shot Run');
    });

    it('starts at beat-1-fixer-call', () => {
      expect(storyEngine.getState().currentBeat).toBe('red-trade-beat-1-fixer-call');
    });

    it('stores the buyerFaction in worldState', () => {
      const state = new StoryEngine(createRedTradeInitialState('maelstrom')).getState();
      expect(state.worldState.buyerFaction).toBe('maelstrom');
    });

    it('starts with no completed beats', () => {
      expect(storyEngine.getState().completedBeats).toHaveLength(0);
    });
  });

  // ── Beat 1 → 2: Fixer Call → Transit ─────────────────────────────────────

  describe('Beat 1 → Beat 2: red_trade_transit starts the run', () => {
    it('advances from fixer-call to transit on red_trade_transit event', async () => {
      const transitEvent: FoundryEvent = {
        type: 'red_trade_transit',
        payload: { factionId: 'tyger-claws', currentFriction: 2 },
      };

      await controller.handleFoundryEvent(transitEvent);

      expect(storyEngine.getState().currentBeat).toBe('red-trade-beat-2-transit');
      expect(storyEngine.getState().completedBeats).toContain('red-trade-beat-1-fixer-call');
    });

    it('does NOT advance on an unrelated event (oracle_roll)', async () => {
      vi.mocked(controller['nitroLogic' as any]?.oracleRoll ?? (() => {}));
      // Simulate oracle_roll without triggering attack
      const engine = storyEngine;
      // Directly evaluate — no matching transition
      const result = engine.evaluateEvent({ type: 'oracle_roll', result: { result: 9 } });
      expect(result.transitioned).toBe(false);
      expect(engine.getState().currentBeat).toBe('red-trade-beat-1-fixer-call');
    });
  });

  // ── Beat 2 → 3: Transit → Handoff on delivery ────────────────────────────

  describe('Beat 2 → Beat 3: buy_item delivery completes the run', () => {
    async function advanceToTransit(): Promise<void> {
      await controller.handleFoundryEvent({
        type: 'red_trade_transit',
        payload: { factionId: 'tyger-claws', currentFriction: 0 },
      });
    }

    it('advances from transit to handoff on buy_item with matching buyerFaction', async () => {
      await advanceToTransit();
      expect(storyEngine.getState().currentBeat).toBe('red-trade-beat-2-transit');

      const deliveryEvent: FoundryEvent = {
        type: 'buy_item',
        payload: {
          itemId: 'stolen-badge-01',
          costEb: 0,
          costEagles: 0,
          vendor: 'tyger-claws',
          actorId: 'actor-v-001',
        },
      };

      await controller.handleFoundryEvent(deliveryEvent);

      expect(storyEngine.getState().currentBeat).toBe('red-trade-beat-3-handoff');
      expect(storyEngine.getState().completedBeats).toContain('red-trade-beat-2-transit');
    });

    it('does NOT advance on buy_item with wrong vendor when buyerFaction is set', async () => {
      await advanceToTransit();

      const wrongDelivery: FoundryEvent = {
        type: 'buy_item',
        payload: {
          itemId: 'wrong-item',
          costEb: 100,
          costEagles: 0,
          vendor: 'maelstrom',      // wrong faction
          actorId: 'actor-v-001',
        },
      };

      await controller.handleFoundryEvent(wrongDelivery);

      expect(storyEngine.getState().currentBeat).toBe('red-trade-beat-2-transit');
    });

    it('friction ticks during transit do NOT advance the beat', async () => {
      await advanceToTransit();

      await controller.handleFoundryEvent({
        type: 'red_trade_transit',
        payload: { factionId: 'tyger-claws', currentFriction: 3 },
      });

      // Still in transit — friction ticks don't auto-complete the run
      expect(storyEngine.getState().currentBeat).toBe('red-trade-beat-2-transit');
    });
  });

  // ── Full E2E Red Trade loop ───────────────────────────────────────────────

  describe('Full E2E: Fixer Call → Transit → Handoff', () => {
    it('completes the full 3-beat arc in sequence', async () => {
      // Beat 1: Fixer Call (initial state)
      expect(storyEngine.getState().currentBeat).toBe('red-trade-beat-1-fixer-call');

      // Beat 1 → 2: First transit tick (run starts)
      await controller.handleFoundryEvent({
        type: 'red_trade_transit',
        payload: { factionId: 'tyger-claws', currentFriction: 1 },
      });
      expect(storyEngine.getState().currentBeat).toBe('red-trade-beat-2-transit');

      // Mid-transit friction tick (should not advance)
      await controller.handleFoundryEvent({
        type: 'red_trade_transit',
        payload: { factionId: 'tyger-claws', currentFriction: 2 },
      });
      expect(storyEngine.getState().currentBeat).toBe('red-trade-beat-2-transit');

      // Beat 2 → 3: Deliver to correct faction
      await controller.handleFoundryEvent({
        type: 'buy_item',
        payload: {
          itemId: 'stolen-badge-01',
          costEb: 0,
          costEagles: 0,
          vendor: 'tyger-claws',
          actorId: 'actor-v-001',
        },
      });
      expect(storyEngine.getState().currentBeat).toBe('red-trade-beat-3-handoff');

      // Verify final state
      const finalState = storyEngine.getState();
      expect(finalState.completedBeats).toEqual([
        'red-trade-beat-1-fixer-call',
        'red-trade-beat-2-transit',
      ]);
      expect(finalState.currentArc).toBe('Red Trade — One-Shot Run');
    });

    it('StoryEngine pushes transition narrative to Foundry on each beat advance', async () => {
      await controller.handleFoundryEvent({
        type: 'red_trade_transit',
        payload: { factionId: 'tyger-claws', currentFriction: 0 },
      });

      expect(foundry.sendChatMessage).toHaveBeenCalledWith(
        expect.stringContaining('Story Advance'),
        expect.objectContaining({ alias: 'Story Engine' }),
      );
    });
  });

  // ── Beat 3: Terminal ──────────────────────────────────────────────────────

  describe('Beat 3 (Handoff) is terminal', () => {
    it('no event advances beyond the handoff beat', () => {
      const engine = new StoryEngine({
        currentArc: 'Red Trade — One-Shot Run',
        currentBeat: 'red-trade-beat-3-handoff',
        completedBeats: ['red-trade-beat-1-fixer-call', 'red-trade-beat-2-transit'],
        worldState: { buyerFaction: 'tyger-claws' },
        eagleBalance: 0,
      });
      bootstrapRedTrade(engine);

      const result = engine.evaluateEvent({ type: 'buy_item', payload: { vendor: 'tyger-claws' } });
      expect(result.transitioned).toBe(false);
      expect(engine.getState().currentBeat).toBe('red-trade-beat-3-handoff');
    });
  });
});
