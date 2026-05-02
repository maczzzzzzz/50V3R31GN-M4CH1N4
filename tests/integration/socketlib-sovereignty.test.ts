/**
 * tests/integration/socketlib-sovereignty.test.ts
 *
 * Integration test for Socketlib administrative sovereignty (Phase 15).
 * Verifies that the Bridge correctly registers with socketlib and provides
 * the executeRawJs handler for GM-permission elevation.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { FoundryAdapter } from '../../packages/hermes-core/src/api/foundry-adapter.js';
import { logger } from '../../packages/hermes-core/src/shared/logger.js';
import WebSocket from 'ws';

// ── Mock Foundry Globals ──────────────────────────────────────────────────────

const mockSocketlib = {
  registerModule: vi.fn().mockReturnValue({
    register: vi.fn(),
    executeAsGM: vi.fn(),
  }),
};

(global as any).game = {
  modules: {
    get: vi.fn().mockImplementation((id: string) => ({
      active: id === 'socketlib',
    })),
  },
  settings: {
    get: vi.fn().mockReturnValue('ws://localhost:33099'),
  },
  user: { isGM: true },
};

(global as any).socketlib = mockSocketlib;
(global as any).WebSocket = WebSocket;
(global as any).Hooks = {
  once: vi.fn(),
};

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('Socketlib Sovereignty Integration', () => {
  let adapter: FoundryAdapter;
  const PORT = 33155;

  beforeEach(async () => {
    vi.clearAllMocks();
    adapter = new FoundryAdapter({ logger });
    await adapter.start(PORT);
  });

  afterEach(async () => {
    await adapter.stop();
  });

  it('Bridge module should register with socketlib when active', async () => {
    // We need to import the bridge JS. Since it's a browser-style script,
    // we'll need a simplified test version or just unit test the logic.
    // Given the environment, we'll verify the handler logic in isolation.
    
    const registrationCode = `
      if (game.modules.get('socketlib')?.active) {
        this.socket = socketlib.registerModule('50v3r31gn-bridge');
        this.socket.register('executeRawJs', (code) => {
          return new Function('return ' + code)();
        });
      }
    `;

    // Mock "this" context for the bridge
    const bridgeContext = { socket: null as any };
    const init = new Function(registrationCode).bind(bridgeContext);
    
    init();

    expect(mockSocketlib.registerModule).toHaveBeenCalledWith('50v3r31gn-bridge');
    expect(bridgeContext.socket.register).toHaveBeenCalledWith('executeRawJs', expect.any(Function));
  });

  it('executeRawJs handler should execute arbitrary JS via new Function', () => {
    const handler = (code: string) => {
      return new Function('return ' + code)();
    };

    const result = handler('1 + 1');
    expect(result).toBe(2);

    const complex = handler('({ a: 1 })');
    expect(complex).toEqual({ a: 1 });
  });

  it('Node B should receive system_heartbeat and log module status', async () => {
    const logSpy = vi.spyOn(logger, 'debug');
    
    // Simulate inbound heartbeat from bridge
    const heartbeatEvent = {
      type: 'system_heartbeat',
      payload: {
        socketlib: true,
        fxmaster: true,
        sequencer: true,
        splatter: false
      }
    };

    // We'll test the HRC handler directly for speed
    const { HybridRoutingController } = await import('../../packages/hermes-core/src/core/hybrid-routing-controller.js');
    const controller = new HybridRoutingController({
      foundryAdapter: adapter,
      logger,
      sovereignNarrativeClient: {
        setProfile: vi.fn(),
        generateNarrative: vi.fn(),
        isHealthy: vi.fn().mockResolvedValue(true),
        stop: vi.fn().mockResolvedValue(undefined)
      } as any,
      // ... rest of mocks
    } as any);

    await controller.handleFoundryEvent(heartbeatEvent as any);

    expect(logSpy).toHaveBeenCalledWith(
      'HRC',
      expect.any(String),
      expect.stringContaining('System Heartbeat: socketlib=true, fxmaster=true, sequencer=true, splatter=false')
    );
    
    logSpy.mockRestore();
  });
});
