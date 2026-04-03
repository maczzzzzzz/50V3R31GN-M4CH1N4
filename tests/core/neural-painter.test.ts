/**
 * tests/core/neural-painter.test.ts
 *
 * Unit tests for VisualMonitorService.batchCreateDocuments() — Neural Painter
 * (Phase 13, Task 3). chrome-remote-interface is mocked — no live Foundry required.
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
        result: { value: { wallsCreated: 2, lightsCreated: 1, tokensCreated: 3 } },
        exceptionDetails: undefined,
      }),
    },
    CSS: {
      enable: vi.fn().mockResolvedValue(undefined),
      createStyleSheet: vi.fn().mockResolvedValue({ styleSheetId: 'ss-001' }),
      setStyleSheetText: vi.fn().mockResolvedValue(undefined),
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
import type { SceneBlueprint } from '../../src/core/visual-monitor-service.js';

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('VisualMonitorService.batchCreateDocuments() — Neural Painter', () => {
  let service: VisualMonitorService;

  const defaultBlueprint: SceneBlueprint = {
    sceneId: 'scene-abc',
    walls: [
      { x1: 0, y1: 0, x2: 100, y2: 0 },
      { x1: 100, y1: 0, x2: 100, y2: 100 },
    ],
    lights: [
      { x: 50, y: 50, radius: 30, color: '#ff0000' },
    ],
    tokens: [
      { actorId: 'actor-001', x: 200, y: 200, name: 'V' },
      { actorId: 'actor-002', x: 300, y: 300, name: 'Johnny' },
      { actorId: 'actor-003', x: 400, y: 400 },
    ],
  };

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
    // Restore default evaluate mock
    mockClient.Runtime.evaluate.mockResolvedValue({
      result: { value: { wallsCreated: 2, lightsCreated: 1, tokensCreated: 3 } },
      exceptionDetails: undefined,
    });

    service = new VisualMonitorService({ debugPort: 9222 });
    await service.connect();
  });

  // Test 1: Runtime.evaluate is called with the correct CDP options
  it('calls Runtime.evaluate with awaitPromise: true and returnByValue: true', async () => {
    await service.batchCreateDocuments(defaultBlueprint);

    expect(mockClient.Runtime.evaluate).toHaveBeenCalledOnce();
    const callArg = mockClient.Runtime.evaluate.mock.calls[0][0];
    expect(callArg.awaitPromise).toBe(true);
    expect(callArg.returnByValue).toBe(true);
    expect(typeof callArg.expression).toBe('string');
  });

  // Test 2: The script contains Wall createEmbeddedDocuments when walls are provided
  it("includes createEmbeddedDocuments('Wall', ...) in the script when walls are provided", async () => {
    await service.batchCreateDocuments(defaultBlueprint);

    const expression: string = mockClient.Runtime.evaluate.mock.calls[0][0].expression;
    expect(expression).toContain("createEmbeddedDocuments('Wall'");
  });

  // Test 3: The script contains AmbientLight createEmbeddedDocuments when lights are provided
  it("includes createEmbeddedDocuments('AmbientLight', ...) in the script when lights are provided", async () => {
    await service.batchCreateDocuments(defaultBlueprint);

    const expression: string = mockClient.Runtime.evaluate.mock.calls[0][0].expression;
    expect(expression).toContain("createEmbeddedDocuments('AmbientLight'");
  });

  // Test 4: The script contains TokenDocument.createDocuments when tokens are provided
  it('includes TokenDocument.createDocuments(...) in the script when tokens are provided', async () => {
    await service.batchCreateDocuments(defaultBlueprint);

    const expression: string = mockClient.Runtime.evaluate.mock.calls[0][0].expression;
    expect(expression).toContain('TokenDocument.createDocuments(');
  });

  // Test 5: Returns wallsCreated, lightsCreated, tokensCreated from CDP result
  it('returns wallsCreated, lightsCreated, and tokensCreated from the CDP result', async () => {
    const result = await service.batchCreateDocuments(defaultBlueprint);

    expect(result.wallsCreated).toBe(2);
    expect(result.lightsCreated).toBe(1);
    expect(result.tokensCreated).toBe(3);
  });

  // Test 6: Returns executionMs as a non-negative number
  it('returns executionMs as a non-negative number', async () => {
    const result = await service.batchCreateDocuments(defaultBlueprint);

    expect(typeof result.executionMs).toBe('number');
    expect(result.executionMs).toBeGreaterThanOrEqual(0);
  });

  // Test 7: Throws when exceptionDetails is present
  it('throws a Neural Painter CDP error when exceptionDetails is present', async () => {
    mockClient.Runtime.evaluate.mockResolvedValue({
      result: {},
      exceptionDetails: { text: 'Scene not found: bad-id' },
    });

    await expect(
      service.batchCreateDocuments({ sceneId: 'bad-id' })
    ).rejects.toThrow('Neural Painter CDP error: Scene not found: bad-id');
  });

  // Test 8: Throws 'Not connected' when called before connect()
  it("throws 'Not connected' when called before connect()", async () => {
    const freshService = new VisualMonitorService({ debugPort: 9222 });

    await expect(
      freshService.batchCreateDocuments(defaultBlueprint)
    ).rejects.toThrow('Not connected');
  });
});
