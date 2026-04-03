/**
 * tests/core/neural-decal.test.ts
 *
 * Unit tests for VisualMonitorService.applyNeuralDecal() — Neural Decal Injector
 * (Phase 14, Task 2). chrome-remote-interface is mocked — no live Foundry required.
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
import type { DecalPlacement } from '../../src/core/visual-monitor-service.js';

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('VisualMonitorService.applyNeuralDecal() — Neural Decal Injector', () => {
  let service: VisualMonitorService;

  const bulletPlacement: DecalPlacement = {
    type: 'bullet_hole',
    x: 100,
    y: 200,
  };

  const scorchPlacement: DecalPlacement = {
    type: 'scorch_mark',
    x: 300,
    y: 400,
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
    // Restore default evaluate mock — success with no exception
    mockClient.Runtime.evaluate.mockResolvedValue({
      exceptionDetails: undefined,
    });

    service = new VisualMonitorService({ debugPort: 9222 });
    await service.connect();
  });

  // Test 1: Runtime.evaluate is called with awaitPromise: true
  it('calls Runtime.evaluate with awaitPromise: true', async () => {
    await service.applyNeuralDecal('scene-001', bulletPlacement);

    expect(mockClient.Runtime.evaluate).toHaveBeenCalledOnce();
    const callArg = mockClient.Runtime.evaluate.mock.calls[0][0];
    expect(callArg).toMatchObject({ awaitPromise: true, returnByValue: false });
    expect(typeof callArg.expression).toBe('string');
  });

  // Test 2: The CDP script contains DrawingDocument.create
  it('CDP script contains DrawingDocument.create', async () => {
    await service.applyNeuralDecal('scene-001', bulletPlacement);

    const expression: string = mockClient.Runtime.evaluate.mock.calls[0][0].expression;
    expect(expression).toContain('DrawingDocument.create');
  });

  // Test 3: Script contains the correct fillColor for bullet_hole
  it("script contains fillColor '#1a1a1a' for bullet_hole", async () => {
    await service.applyNeuralDecal('scene-001', bulletPlacement);

    const expression: string = mockClient.Runtime.evaluate.mock.calls[0][0].expression;
    expect(expression).toContain('#1a1a1a');
  });

  // Test 4: Script contains the correct fillColor for scorch_mark
  it("script contains fillColor '#2a1a0a' for scorch_mark", async () => {
    await service.applyNeuralDecal('scene-002', scorchPlacement);

    const expression: string = mockClient.Runtime.evaluate.mock.calls[0][0].expression;
    expect(expression).toContain('#2a1a0a');
  });

  // Test 5: Scale factor affects width/height in the script
  it('scale factor affects width/height values in the script', async () => {
    const scaledPlacement: DecalPlacement = {
      type: 'bullet_hole',
      x: 50,
      y: 50,
      scale: 2.0,
    };

    await service.applyNeuralDecal('scene-003', scaledPlacement);

    const expression: string = mockClient.Runtime.evaluate.mock.calls[0][0].expression;
    // bullet_hole base: 20x20, scale 2.0 → 40x40
    expect(expression).toContain('"width":40');
    expect(expression).toContain('"height":40');
  });

  // Test 6: Throws when exceptionDetails is present
  it('throws when exceptionDetails is present', async () => {
    mockClient.Runtime.evaluate.mockResolvedValue({
      exceptionDetails: { text: 'Scene not found: bad-scene' },
    });

    await expect(
      service.applyNeuralDecal('bad-scene', bulletPlacement)
    ).rejects.toThrow('applyNeuralDecal failed: Scene not found: bad-scene');
  });

  // Test 7: Throws 'Not connected' before connect()
  it("throws 'Not connected' when called before connect()", async () => {
    const freshService = new VisualMonitorService({ debugPort: 9222 });

    await expect(
      freshService.applyNeuralDecal('scene-001', bulletPlacement)
    ).rejects.toThrow('Not connected');
  });
});
