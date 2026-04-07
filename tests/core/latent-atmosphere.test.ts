/**
 * tests/core/latent-atmosphere.test.ts
 *
 * Unit tests for VisualMonitorService.captureAtmosphere() and
 * restoreAtmosphere() — Latent Atmosphere Persistence (Phase 14, Task 3).
 * chrome-remote-interface is mocked — no live Foundry required.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Mock chrome-remote-interface ──────────────────────────────────────────────

const { mockCDP, mockClient } = vi.hoisted(() => {
  const client = {
    Page: {
      enable: vi.fn().mockResolvedValue(undefined),
      captureScreenshot: vi.fn().mockResolvedValue({ data: 'aGVsbG8=' }),
      reload: vi.fn().mockResolvedValue(undefined),
      getFrameTree: vi.fn().mockResolvedValue({
        frameTree: { frame: { id: 'frame-001' } },
      }),
    },
    Runtime: {
      enable: vi.fn().mockResolvedValue(undefined),
      evaluate: vi.fn().mockResolvedValue({
        result: {
          value: {
            lightingColor: '#ff003c',
            animationType: 'torch',
            intensity: 0.7,
            darknessLevel: 0.5,
          },
        },
        exceptionDetails: undefined,
      }),
    },
    CSS: {
      enable: vi.fn().mockResolvedValue(undefined),
      createStyleSheet: vi.fn().mockResolvedValue({ styleSheetId: 'ss-001' }),
      setStyleSheetText: vi.fn().mockResolvedValue(undefined),
    },
    Input: {
      enable: vi.fn().mockResolvedValue(undefined),
      dispatchMouseEvent: vi.fn().mockResolvedValue(undefined),
    },
    close: vi.fn().mockResolvedValue(undefined),
  };
  const cdp = vi.fn().mockResolvedValue(client) as any;
  cdp.List = vi.fn().mockResolvedValue([
    {
      type: 'page',
      title: 'Foundry Virtual Tabletop',
      url: 'http://localhost:30000/',
      webSocketDebuggerUrl: 'ws://127.0.0.1:9222/devtools/page/test-id',
    },
  ]);
  return { mockCDP: cdp, mockClient: client };
});

vi.mock('chrome-remote-interface', () => ({ default: mockCDP }));

// ── Import under test ─────────────────────────────────────────────────────────

import { VisualMonitorService } from '../../src/core/visual-monitor-service.js';
import type { AtmosphereState } from '../../src/core/visual-monitor-service.js';

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeOracle(overrides?: {
  connected?: boolean;
  rows?: unknown[];
}): { isConnected: ReturnType<typeof vi.fn>; execute: ReturnType<typeof vi.fn>; query: ReturnType<typeof vi.fn> } {
  return {
    isConnected: vi.fn().mockReturnValue(overrides?.connected ?? true),
    execute: vi.fn(),
    query: vi.fn().mockReturnValue(overrides?.rows ?? []),
  };
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('VisualMonitorService — Latent Atmosphere Persistence', () => {
  let service: VisualMonitorService;

  beforeEach(async () => {
    vi.clearAllMocks();
    mockCDP.mockResolvedValue(mockClient);
    mockCDP.List.mockResolvedValue([
      {
        type: 'page',
        title: 'Foundry Virtual Tabletop',
        url: 'http://localhost:30000/',
        webSocketDebuggerUrl: 'ws://127.0.0.1:9222/devtools/page/test-id',
      },
    ]);
    // Reset to default captureAtmosphere return value
    mockClient.Runtime.evaluate.mockResolvedValue({
      result: {
        value: {
          lightingColor: '#ff003c',
          animationType: 'torch',
          intensity: 0.7,
          darknessLevel: 0.5,
        },
      },
      exceptionDetails: undefined,
    });

    service = new VisualMonitorService({ debugPort: 9222 });
    await service.connect();
  });

  // Test 1: captureAtmosphere() calls Runtime.evaluate with correct CDP options
  it('captureAtmosphere() calls Runtime.evaluate with awaitPromise: true and returnByValue: true', async () => {
    await service.captureAtmosphere('scene-neon-01');

    expect(mockClient.Runtime.evaluate).toHaveBeenCalledOnce();
    const callArg = mockClient.Runtime.evaluate.mock.calls[0][0];
    expect(callArg.awaitPromise).toBe(true);
    expect(callArg.returnByValue).toBe(true);
    expect(typeof callArg.expression).toBe('string');
  });

  // Test 2: captureAtmosphere() returns AtmosphereState with correct fields
  it('captureAtmosphere() returns an AtmosphereState with the correct fields from CDP result', async () => {
    const state: AtmosphereState = await service.captureAtmosphere('scene-neon-01');

    expect(state.sceneId).toBe('scene-neon-01');
    expect(state.lightingColor).toBe('#ff003c');
    expect(state.animationType).toBe('torch');
    expect(state.intensity).toBe(0.7);
    expect(state.darknessLevel).toBe(0.5);
  });

  // Test 3: captureAtmosphere() persists to oracle via INSERT OR REPLACE
  it('captureAtmosphere() persists the atmosphere to oracle via INSERT OR REPLACE INTO scene_atmosphere', async () => {
    const oracle = makeOracle();
    const svc = new VisualMonitorService({ debugPort: 9222, oracle: oracle as any });
    await svc.connect();

    await svc.captureAtmosphere('scene-neon-01');

    expect(oracle.execute).toHaveBeenCalledOnce();
    const [sql, params] = oracle.execute.mock.calls[0];
    expect(sql).toContain('INSERT OR REPLACE INTO scene_atmosphere');
    expect(params).toContain('scene-neon-01');
    expect(params).toContain('#ff003c');
    expect(params).toContain('torch');
    expect(params).toContain(0.7);
    expect(params).toContain(0.5);
  });

  // Test 4: captureAtmosphere() skips oracle write when oracle is not connected
  it('captureAtmosphere() skips oracle write when oracle.isConnected() returns false', async () => {
    const oracle = makeOracle({ connected: false });
    const svc = new VisualMonitorService({ debugPort: 9222, oracle: oracle as any });
    await svc.connect();

    await svc.captureAtmosphere('scene-neon-01');

    expect(oracle.execute).not.toHaveBeenCalled();
  });

  // Test 5: captureAtmosphere() throws when exceptionDetails is present
  it('captureAtmosphere() throws when exceptionDetails is present in CDP response', async () => {
    mockClient.Runtime.evaluate.mockResolvedValue({
      result: {},
      exceptionDetails: { text: 'Scene not found: bad-scene' },
    });

    await expect(
      service.captureAtmosphere('bad-scene')
    ).rejects.toThrow('captureAtmosphere failed: Scene not found: bad-scene');
  });

  // Test 6: restoreAtmosphere() calls Runtime.evaluate with stored atmosphere values
  it('restoreAtmosphere() calls Runtime.evaluate with the stored atmosphere values from oracle', async () => {
    const storedRow = {
      lighting_color: '#ff003c',
      animation_type: 'torch',
      intensity: 0.7,
      darkness_level: 0.5,
    };
    const oracle = makeOracle({ rows: [storedRow] });
    // Override evaluate for restore (no returnByValue)
    mockClient.Runtime.evaluate.mockResolvedValue({
      result: {},
      exceptionDetails: undefined,
    });
    const svc = new VisualMonitorService({ debugPort: 9222, oracle: oracle as any });
    await svc.connect();

    await svc.restoreAtmosphere('scene-neon-01');

    expect(oracle.query).toHaveBeenCalledOnce();
    expect(mockClient.Runtime.evaluate).toHaveBeenCalledOnce();
    const callArg = mockClient.Runtime.evaluate.mock.calls[0][0];
    expect(callArg.awaitPromise).toBe(true);
    expect(callArg.returnByValue).toBe(false);
    expect(callArg.expression).toContain('#ff003c');
    expect(callArg.expression).toContain('torch');
    expect(callArg.expression).toContain('0.7');
    expect(callArg.expression).toContain('0.5');
  });

  // Test 7: restoreAtmosphere() is a no-op when oracle returns no rows
  it('restoreAtmosphere() is a no-op when oracle returns empty rows for the scene', async () => {
    const oracle = makeOracle({ rows: [] });
    const svc = new VisualMonitorService({ debugPort: 9222, oracle: oracle as any });
    await svc.connect();

    await svc.restoreAtmosphere('scene-no-data');

    expect(mockClient.Runtime.evaluate).not.toHaveBeenCalled();
  });

  // Test 8: restoreAtmosphere() is a no-op when oracle is not connected
  it('restoreAtmosphere() is a no-op when oracle.isConnected() returns false', async () => {
    const oracle = makeOracle({ connected: false });
    const svc = new VisualMonitorService({ debugPort: 9222, oracle: oracle as any });
    await svc.connect();

    await svc.restoreAtmosphere('scene-neon-01');

    expect(oracle.query).not.toHaveBeenCalled();
    expect(mockClient.Runtime.evaluate).not.toHaveBeenCalled();
  });
});
