/**
 * tests/core/neural-glitch.test.ts
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { VisualMonitorService } from '../../packages/hermes-core/src/core/visual-monitor-service.js';

// ── Mock CDP ──────────────────────────────────────────────────────────────────

const { mockCDP, mockClient } = vi.hoisted(() => {
  const client = {
    Page: {
      enable: vi.fn().mockResolvedValue(undefined),
      getFrameTree: vi.fn().mockResolvedValue({
        frameTree: { frame: { id: 'frame-001' } },
      }),
    },
    DOM: { enable: vi.fn().mockResolvedValue(undefined) },
    Runtime: {
      enable: vi.fn().mockResolvedValue(undefined),
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
      webSocketDebuggerUrl: 'ws://127.0.0.1:9222/devtools/page/test-id',
    },
  ]);
  return { mockCDP: cdp, mockClient: client };
});

vi.mock('chrome-remote-interface', () => ({ default: mockCDP }));

describe('VisualMonitorService.triggerNeuralGlitch()', () => {
  let service: VisualMonitorService;

  beforeEach(async () => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    service = new VisualMonitorService({ debugPort: 9222 });
    await service.connect();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should inject glitch CSS and then clear it', async () => {
    // triggerNeuralGlitch is async but the cleanup is in a setTimeout
    await service.triggerNeuralGlitch(1.5);
    
    // 1. Verify injection
    expect(mockClient.CSS.createStyleSheet).toHaveBeenCalledOnce();
    expect(mockClient.CSS.setStyleSheetText).toHaveBeenCalledWith(expect.objectContaining({
      styleSheetId: 'ss-001',
      text: expect.stringContaining('neural-flicker')
    }));

    // 2. Advance time to trigger cleanup
    vi.advanceTimersByTime(600);
    
    // 3. Verify cleanup call (SET text to empty)
    expect(mockClient.CSS.setStyleSheetText).toHaveBeenCalledTimes(2);
    expect(mockClient.CSS.setStyleSheetText).toHaveBeenLastCalledWith({
      styleSheetId: 'ss-001',
      text: ''
    });
  });

  it('should adjust background opacity based on intensity', async () => {
    await service.triggerNeuralGlitch(2.0);
    
    const cssText = mockClient.CSS.setStyleSheetText.mock.calls[0][0].text;
    expect(cssText).toContain('background: rgba(255, 0, 0, 0.2)');
  });
});
