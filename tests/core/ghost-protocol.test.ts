/**
 * tests/core/ghost-protocol.test.ts
 *
 * Unit tests for Ghost Protocol (Physical Input) and UI Infiltration.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Mock chrome-remote-interface ──────────────────────────────────────────────

const { mockCDP, mockClient } = vi.hoisted(() => {
  const client = {
    Page: { enable: vi.fn().mockResolvedValue(undefined) },
    DOM: { enable: vi.fn().mockResolvedValue(undefined) },
    Runtime: {
      enable: vi.fn().mockResolvedValue(undefined),
      evaluate: vi.fn().mockResolvedValue({ result: { value: 5 } }),
    },
    CSS: { enable: vi.fn().mockResolvedValue(undefined) },
    Input: {
      enable: vi.fn().mockResolvedValue(undefined),
      dispatchMouseEvent: vi.fn().mockResolvedValue(undefined),
      dispatchKeyEvent: vi.fn().mockResolvedValue(undefined),
    },
    close: vi.fn().mockResolvedValue(undefined),
  };
  const cdp = vi.fn().mockResolvedValue(client) as any;
  cdp.List = vi.fn().mockResolvedValue([
    { type: 'page', webSocketDebuggerUrl: 'ws://127.0.0.1:9222/test' },
  ]);
  return { mockCDP: cdp, mockClient: client };
});

vi.mock('chrome-remote-interface', () => ({ default: mockCDP }));

import { VisualMonitorService } from '../../packages/hermes-core/src/core/visual-monitor-service.js';
import { GhostInputService } from '../../packages/hermes-core/src/core/ghost-input-service.js';

describe('Phase 28: Ghost Protocol & UI Infiltration', () => {
  let visualMonitor: VisualMonitorService;
  let ghostInput: GhostInputService;

  beforeEach(async () => {
    vi.clearAllMocks();
    visualMonitor = new VisualMonitorService();
    await visualMonitor.connect();
    ghostInput = new GhostInputService(visualMonitor);
  });

  describe('GhostInputService', () => {
    it('dispatches physical click sequence (Move -> Press -> Release)', async () => {
      await ghostInput.dispatchClick({ x: 100, y: 200 });

      const mouseCalls = mockClient.Input.dispatchMouseEvent.mock.calls;
      expect(mouseCalls).toHaveLength(3);
      
      // Move
      expect(mouseCalls[0][0]).toMatchObject({ type: 'mouseMoved', x: 100, y: 200 });
      // Press
      expect(mouseCalls[1][0]).toMatchObject({ type: 'mousePressed', button: 'left', x: 100, y: 200 });
      // Release
      expect(mouseCalls[2][0]).toMatchObject({ type: 'mouseReleased', button: 'left', x: 100, y: 200 });
    });

    it('performs interpolated drag gesture', async () => {
      // Small duration for fast test
      await ghostInput.dragGesture({ x: 0, y: 0 }, { x: 100, y: 100 }, 50);

      const mouseCalls = mockClient.Input.dispatchMouseEvent.mock.calls;
      // 1 (move) + 1 (press) + 10 (interpolated moves) + 1 (release) = 13 calls
      expect(mouseCalls.length).toBeGreaterThanOrEqual(12);
      
      // Verify start and end
      expect(mouseCalls[0][0].type).toBe('mouseMoved');
      expect(mouseCalls[1][0].type).toBe('mousePressed');
      expect(mouseCalls[mouseCalls.length - 1][0]).toMatchObject({
        type: 'mouseReleased',
        x: 100,
        y: 100
      });
    });

    it('dispatches physical key strokes for strings', async () => {
      await ghostInput.dispatchString('HI');
      
      const keyCalls = mockClient.Input.dispatchKeyEvent.mock.calls;
      // 2 chars * (keyDown + keyUp) = 4 calls
      expect(keyCalls).toHaveLength(4);
      expect(keyCalls[0][0]).toMatchObject({ type: 'keyDown', text: 'H' });
      expect(keyCalls[1][0]).toMatchObject({ type: 'keyUp', text: 'H' });
    });
  });

  describe('VisualMonitorService.corruptUI()', () => {
    it('injects transformation script via CDP Runtime.evaluate', async () => {
      await visualMonitor.corruptUI(0.8, 'parsel');

      expect(mockClient.Runtime.evaluate).toHaveBeenCalledWith(
        expect.objectContaining({
          expression: expect.stringContaining('parselChars'),
          awaitPromise: true
        })
      );
    });

    it('includes target selectors for Chat and Sidebar', async () => {
      await visualMonitor.corruptUI();
      const script = mockClient.Runtime.evaluate.mock.calls[0][0].expression;
      
      expect(script).toContain('.chat-message');
      expect(script).toContain('#sidebar-tabs');
      expect(script).toContain('.window-title');
    });
  });
});
