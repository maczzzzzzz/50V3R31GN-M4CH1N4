
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { HybridRoutingController } from '../../src/core/hybrid-routing-controller.js';
import type { INitroLogicClient } from '../../src/core/interfaces.js';
import type { IOllamaClient } from '../../src/core/interfaces.js';
import type { IFoundryAdapter } from '../../src/api/foundry-adapter.js';
import { StoryEngine } from '../../src/core/story-engine.js';
import { GmApprovalQueue } from '../../src/core/gm-approval-queue.js';
import { NightMarketService } from '../../src/core/night-market-service.js';
import type { UnifiedOracleClient } from '../../src/db/unified-oracle-client.js';
import type { RedTradeService } from '../../src/core/red-trade-service.js';

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
    queryScenes: vi.fn().mockResolvedValue([]),
    pushDashboardUpdate: vi.fn().mockResolvedValue(undefined),
    triggerFxGlitch: vi.fn().mockResolvedValue(undefined),
    runSequence: vi.fn().mockResolvedValue(undefined),
    triggerPretextOverlay: vi.fn().mockResolvedValue(undefined),
    executeAction: vi.fn().mockResolvedValue(undefined),
    triggerTile: vi.fn().mockResolvedValue(undefined),
    playSequence: vi.fn().mockResolvedValue(undefined),
    runScript: vi.fn().mockResolvedValue(undefined),
    spawnSoloSafeNpc: vi.fn().mockResolvedValue({ tokenId: 'token-123' }),
    advancePhase: vi.fn().mockResolvedValue(undefined),
    streamThoughtTokens: vi.fn().mockResolvedValue(undefined),
    onEvent: vi.fn(),
    getHandshakeToken: vi.fn().mockReturnValue('token'),
  };
}

describe('Active Defense: Token Movement Validation', () => {
  let controller: HybridRoutingController;
  let foundry: IFoundryAdapter;
  let unifiedOracle: UnifiedOracleClient;

  beforeEach(() => {
    foundry = makeMockFoundryAdapter();
    unifiedOracle = {
      query: vi.fn().mockReturnValue([]),
      isConnected: vi.fn().mockReturnValue(true),
    } as unknown as UnifiedOracleClient;

    controller = new HybridRoutingController({
      nitroLogicClient: makeMockNitroLogic(),
      ollamaClient: makeMockOllama(),
      foundryAdapter: foundry,
      storyEngine: {} as any,
      gmApprovalQueue: {} as any,
      nightMarketService: {} as any,
      unifiedOracle: unifiedOracle,
      redTradeService: {} as any,
    });
  });

  it('rejects movements greater than 1000 units (Teleport Hack)', async () => {
    // We need to simulate the event coming from foundry-adapter.
    // Since handleFoundryEvent is what dispatches, we'll test that.
    
    // Mock current position in Oracle
    vi.mocked(unifiedOracle.query).mockImplementation((sql: string, params: any[]) => {
      if (sql.includes('radar')) {
        return [{ id: 'token-123', x: 100, y: 100 }];
      }
      return [];
    });

    const moveEvent = {
      type: 'validate_move',
      payload: {
        actorId: 'actor-123',
        tokenId: 'token-123',
        x: 1200, // Move of 1100 units from 100
        y: 100
      },
      respond: vi.fn()
    };

    await controller.handleFoundryEvent(moveEvent);

    expect(moveEvent.respond).toHaveBeenCalledWith(expect.objectContaining({
      verdict: 'INVALID',
      reason: expect.stringContaining('Teleport Hack')
    }));
  });

  it('rejects movements into restricted regions (x > 5000)', async () => {
    const moveEvent = {
      type: 'validate_move',
      payload: {
        actorId: 'actor-123',
        tokenId: 'token-123',
        x: 5100,
        y: 100
      },
      respond: vi.fn()
    };

    await controller.handleFoundryEvent(moveEvent);

    expect(moveEvent.respond).toHaveBeenCalledWith(expect.objectContaining({
      verdict: 'INVALID',
      reason: expect.stringContaining('Restricted Region')
    }));
  });

  it('approves valid movements', async () => {
    vi.mocked(unifiedOracle.query).mockImplementation((sql: string, params: any[]) => {
      if (sql.includes('radar')) {
        return [{ id: 'token-123', x: 100, y: 100 }];
      }
      return [];
    });

    const moveEvent = {
      type: 'validate_move',
      payload: {
        actorId: 'actor-123',
        tokenId: 'token-123',
        x: 150,
        y: 150
      },
      respond: vi.fn()
    };

    await controller.handleFoundryEvent(moveEvent);

    expect(moveEvent.respond).toHaveBeenCalledWith(expect.objectContaining({
      verdict: 'VALID'
    }));
  });
});
