/**
 * tests/core/visual-monitor-service.test.ts
 *
 * Unit tests for VisualMonitorService (Phase 11 Neural Uplink).
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Mock chrome-remote-interface ──────────────────────────────────────────────

const { mockEnable, mockClose, mockCDP, mockClient } = vi.hoisted(() => {
  const enable = vi.fn().mockResolvedValue(undefined);
  const close = vi.fn().mockResolvedValue(undefined);
  const client = {
    Page:    { enable },
    Runtime: { enable },
    CSS:     { enable },
    close,
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
  return { mockEnable: enable, mockClose: close, mockCDP: cdp, mockClient: client };
});

vi.mock('chrome-remote-interface', () => ({ default: mockCDP }));

// ── Import under test ─────────────────────────────────────────────────────────

import { VisualMonitorService } from '../../src/core/visual-monitor-service.js';

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('VisualMonitorService', () => {
  let service: VisualMonitorService;

  beforeEach(() => {
    vi.clearAllMocks();
    // Restore default mock behavior after each test
    mockCDP.mockResolvedValue(mockClient);
    mockCDP.List.mockResolvedValue([
      {
        type: 'page',
        title: 'Foundry Virtual Tabletop',
        url: 'http://localhost:30000/',
        webSocketDebuggerUrl: 'ws://127.0.0.1:9222/devtools/page/test-id',
      },
    ]);
    service = new VisualMonitorService({ debugPort: 9222 });
  });

  describe('connect()', () => {
    it('discovers the page target via CDP.List', async () => {
      await service.connect();
      expect(mockCDP.List).toHaveBeenCalledWith({ port: 9222 });
    });

    it('connects using the webSocketDebuggerUrl of the page target', async () => {
      await service.connect();
      expect(mockCDP).toHaveBeenCalledWith({
        target: 'ws://127.0.0.1:9222/devtools/page/test-id',
        port: 9222,
      });
    });

    it('enables Page, Runtime, and CSS domains', async () => {
      await service.connect();
      // Each domain's enable() must be called exactly once
      expect(mockEnable).toHaveBeenCalledTimes(3);
    });

    it('logs the Neural Uplink activation message', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      await service.connect();
      expect(consoleSpy).toHaveBeenCalledWith('✅ Neural Uplink: Native CDP Engine Active.');
      consoleSpy.mockRestore();
    });

    it('marks isConnected() as true after successful connect', async () => {
      expect(service.isConnected()).toBe(false);
      await service.connect();
      expect(service.isConnected()).toBe(true);
    });

    it('throws when no page target is found', async () => {
      mockCDP.List.mockResolvedValue([{ type: 'service_worker', webSocketDebuggerUrl: 'ws://...' }]);
      await expect(service.connect()).rejects.toThrow('No page target found');
    });

    it('throws when page target has no webSocketDebuggerUrl', async () => {
      mockCDP.List.mockResolvedValue([{ type: 'page' }]); // no wsUrl
      await expect(service.connect()).rejects.toThrow('No page target found');
    });

    it('uses custom debugPort from config', async () => {
      const custom = new VisualMonitorService({ debugPort: 9333 });
      await custom.connect();
      expect(mockCDP.List).toHaveBeenCalledWith({ port: 9333 });
    });
  });

  describe('disconnect()', () => {
    it('calls client.close() and marks isConnected() false', async () => {
      await service.connect();
      expect(service.isConnected()).toBe(true);
      await service.disconnect();
      expect(mockClose).toHaveBeenCalledOnce();
      expect(service.isConnected()).toBe(false);
    });

    it('is a no-op if already disconnected', async () => {
      await service.disconnect(); // no connect() called
      expect(mockClose).not.toHaveBeenCalled();
    });
  });

  describe('getClient()', () => {
    it('returns the CDP client when connected', async () => {
      await service.connect();
      expect(service.getClient()).toBe(mockClient);
    });

    it('throws when not connected', () => {
      expect(() => service.getClient()).toThrow('Not connected');
    });
  });
});
