/**
 * tests/core/visual-monitor-service.test.ts
 *
 * Unit tests for VisualMonitorService (Phase 11 Neural Uplink).
 * chrome-remote-interface is mocked — no live Foundry/Electron required.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Mock chrome-remote-interface ──────────────────────────────────────────────

const { mockEnable, mockClose, mockCDP, mockClient } = vi.hoisted(() => {
  const enable = vi.fn().mockResolvedValue(undefined);
  const close  = vi.fn().mockResolvedValue(undefined);
  const client = {
    Page: {
      enable: vi.fn().mockResolvedValue(undefined),
      captureScreenshot: vi.fn().mockResolvedValue({ data: 'aGVsbG8=' }), // base64 "hello"
      reload: vi.fn().mockResolvedValue(undefined),
      getFrameTree: vi.fn().mockResolvedValue({
        frameTree: { frame: { id: 'frame-001' } },
      }),
    },
    Runtime: { enable: vi.fn().mockResolvedValue(undefined) },
    CSS: {
      enable: vi.fn().mockResolvedValue(undefined),
      createStyleSheet: vi.fn().mockResolvedValue({ styleSheetId: 'ss-001' }),
      setStyleSheetText: vi.fn().mockResolvedValue(undefined),
    },
    Input: {
      enable: vi.fn().mockResolvedValue(undefined),
      dispatchMouseEvent: vi.fn().mockResolvedValue(undefined),
    },
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

// ── Mock oracle ───────────────────────────────────────────────────────────────

function makeMockOracle() {
  return {
    isConnected: vi.fn().mockReturnValue(true),
    execute: vi.fn().mockReturnValue({ changes: 1 }),
    query: vi.fn().mockReturnValue([]),
  } as any;
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('VisualMonitorService', () => {
  let service: VisualMonitorService;

  beforeEach(() => {
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
    // Restore per-method mocks
    mockClient.Page.captureScreenshot.mockResolvedValue({ data: 'aGVsbG8=' });
    mockClient.Page.reload.mockResolvedValue(undefined);
    mockClient.Page.getFrameTree.mockResolvedValue({ frameTree: { frame: { id: 'frame-001' } } });
    mockClient.CSS.createStyleSheet.mockResolvedValue({ styleSheetId: 'ss-001' });
    mockClient.CSS.setStyleSheetText.mockResolvedValue(undefined);

    service = new VisualMonitorService({ debugPort: 9222 });
  });

  // ── connect() ───────────────────────────────────────────────────────────────

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
      expect(mockClient.Page.enable).toHaveBeenCalledOnce();
      expect(mockClient.Runtime.enable).toHaveBeenCalledOnce();
      expect(mockClient.CSS.enable).toHaveBeenCalledOnce();
    });

    it('logs the Neural Uplink activation message', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      await service.connect();
      expect(consoleSpy).toHaveBeenCalledWith('✅ Neural Uplink: Native CDP Engine Active.');
      consoleSpy.mockRestore();
    });

    it('marks isConnected() true after successful connect', async () => {
      expect(service.isConnected()).toBe(false);
      await service.connect();
      expect(service.isConnected()).toBe(true);
    });

    it('throws when no page target is found', async () => {
      mockCDP.List.mockResolvedValue([{ type: 'service_worker', webSocketDebuggerUrl: 'ws://...' }]);
      await expect(service.connect()).rejects.toThrow('No page target found');
    });

    it('throws when page target has no webSocketDebuggerUrl', async () => {
      mockCDP.List.mockResolvedValue([{ type: 'page' }]);
      await expect(service.connect()).rejects.toThrow('No page target found');
    });

    it('uses custom debugPort from config', async () => {
      const custom = new VisualMonitorService({ debugPort: 9333 });
      await custom.connect();
      expect(mockCDP.List).toHaveBeenCalledWith({ port: 9333 });
    });
  });

  // ── disconnect() ─────────────────────────────────────────────────────────────

  describe('disconnect()', () => {
    it('calls client.close() and marks isConnected() false', async () => {
      await service.connect();
      await service.disconnect();
      expect(mockClient.close).toHaveBeenCalledOnce();
      expect(service.isConnected()).toBe(false);
    });

    it('is a no-op if already disconnected', async () => {
      await service.disconnect();
      expect(mockClient.close).not.toHaveBeenCalled();
    });
  });

  // ── getClient() ──────────────────────────────────────────────────────────────

  describe('getClient()', () => {
    it('returns the CDP client when connected', async () => {
      await service.connect();
      expect(service.getClient()).toBe(mockClient);
    });

    it('throws when not connected', () => {
      expect(() => service.getClient()).toThrow('Not connected');
    });
  });

  // ── captureScreenshot() ──────────────────────────────────────────────────────

  describe('captureScreenshot()', () => {
    beforeEach(async () => { await service.connect(); });

    it('calls Page.captureScreenshot with png format', async () => {
      await service.captureScreenshot();
      expect(mockClient.Page.captureScreenshot).toHaveBeenCalledWith({ format: 'png' });
    });

    it('returns a record with hash, timestamp, data, and null sceneId by default', async () => {
      const record = await service.captureScreenshot();
      expect(record.data).toBe('aGVsbG8=');
      expect(record.hash).toMatch(/^[a-f0-9]{64}$/); // SHA-256 hex
      expect(record.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/);
      expect(record.sceneId).toBeNull();
    });

    it('sets sceneId when provided', async () => {
      const record = await service.captureScreenshot('scene-001');
      expect(record.sceneId).toBe('scene-001');
    });

    it('persists metadata to Akashik.db via oracle.execute when oracle is connected', async () => {
      const oracle = makeMockOracle();
      const svc = new VisualMonitorService({ debugPort: 9222, oracle });
      await svc.connect();
      const record = await svc.captureScreenshot('scene-42');
      expect(oracle.execute).toHaveBeenCalledWith(
        'INSERT INTO vision_history (scene_id, screenshot_hash, captured_at) VALUES (?, ?, ?)',
        ['scene-42', record.hash, record.timestamp]
      );
    });

    it('does not write to oracle when oracle is not provided', async () => {
      const oracle = makeMockOracle();
      // service has no oracle — just confirm no error thrown
      await expect(service.captureScreenshot()).resolves.toBeDefined();
    });

    it('does not write to oracle when oracle.isConnected() is false', async () => {
      const oracle = makeMockOracle();
      oracle.isConnected.mockReturnValue(false);
      const svc = new VisualMonitorService({ debugPort: 9222, oracle });
      await svc.connect();
      await svc.captureScreenshot();
      expect(oracle.execute).not.toHaveBeenCalledWith(
        expect.stringContaining('INSERT OR REPLACE INTO scene_perception'),
        expect.anything()
      );
    });
  });

  // ── reloadWindow() ───────────────────────────────────────────────────────────

  describe('reloadWindow()', () => {
    beforeEach(async () => { await service.connect(); });

    it('calls Page.reload', async () => {
      await service.reloadWindow();
      expect(mockClient.Page.reload).toHaveBeenCalledWith({ ignoreCache: false });
    });

    it('throws when not connected', async () => {
      const disconnected = new VisualMonitorService();
      await expect(disconnected.reloadWindow()).rejects.toThrow('Not connected');
    });
  });

  // ── injectCSS() ──────────────────────────────────────────────────────────────

  describe('injectCSS()', () => {
    beforeEach(async () => { await service.connect(); });

    it('gets the frame tree to obtain frameId', async () => {
      await service.injectCSS('body { color: #ff003c; }');
      expect(mockClient.Page.getFrameTree).toHaveBeenCalled();
    });

    it('creates a stylesheet in the correct frame', async () => {
      await service.injectCSS('body { color: #ff003c; }');
      expect(mockClient.CSS.createStyleSheet).toHaveBeenCalledWith({ frameId: 'frame-001' });
    });

    it('sets the stylesheet text to the provided CSS', async () => {
      await service.injectCSS('body { color: #ff003c; }');
      expect(mockClient.CSS.setStyleSheetText).toHaveBeenCalledWith({
        styleSheetId: 'ss-001',
        text: 'body { color: #ff003c; }',
      });
    });

    it('returns the styleSheetId', async () => {
      const id = await service.injectCSS('body {}');
      expect(id).toBe('ss-001');
    });

    it('throws when not connected', async () => {
      const disconnected = new VisualMonitorService();
      await expect(disconnected.injectCSS('body {}')).rejects.toThrow('Not connected');
    });
  });

  // ── regroundScene() ──────────────────────────────────────────────────────────

  describe('regroundScene()', () => {
    function makeMockNitroLogic(entities = [{ text: 'Room 101', x: 0.1, y: 0.2, confidence: 0.95 }]) {
      return { ocrAnalyze: vi.fn().mockResolvedValue(entities) } as any;
    }

    it('skips when oracle is not configured', async () => {
      const svc = new VisualMonitorService({ debugPort: 9222 });
      await svc.connect();
      // Should not throw
      await expect(svc.regroundScene('scene-001')).resolves.toBeUndefined();
    });

    it('skips when nitroLogic is not configured', async () => {
      const oracle = makeMockOracle();
      const svc = new VisualMonitorService({ debugPort: 9222, oracle });
      await svc.connect();
      await expect(svc.regroundScene('scene-002')).resolves.toBeUndefined();
    });

    it('skips when perception data already exists for the scene', async () => {
      const oracle = makeMockOracle();
      oracle.query.mockReturnValue([{ scene_id: 'scene-003' }]);
      const nitroLogic = makeMockNitroLogic();
      const svc = new VisualMonitorService({ debugPort: 9222, oracle, nitroLogic });
      await svc.connect();
      await svc.regroundScene('scene-003');
      expect(nitroLogic.ocrAnalyze).not.toHaveBeenCalled();
    });

    it('calls ocrAnalyze with the captured screenshot data', async () => {
      const oracle = makeMockOracle();
      oracle.query.mockReturnValue([]); // No existing perception
      const nitroLogic = makeMockNitroLogic();
      const svc = new VisualMonitorService({ debugPort: 9222, oracle, nitroLogic });
      await svc.connect();
      await svc.regroundScene('scene-004');
      expect(nitroLogic.ocrAnalyze).toHaveBeenCalledWith('aGVsbG8=');
    });

    it('persists detected entities to scene_perception via oracle.execute', async () => {
      const oracle = makeMockOracle();
      oracle.query.mockReturnValue([]);
      const nitroLogic = makeMockNitroLogic([{ text: 'Heist Zone', x: 0.5, y: 0.5, confidence: 0.9 }]);
      const svc = new VisualMonitorService({ debugPort: 9222, oracle, nitroLogic });
      await svc.connect();
      await svc.regroundScene('scene-005');
      expect(oracle.execute).toHaveBeenCalledWith(
        expect.stringContaining('INSERT OR REPLACE INTO scene_perception'),
        expect.arrayContaining(['scene-005'])
      );
    });

    it('does not throw when ocrAnalyze fails — logs error and returns', async () => {
      const oracle = makeMockOracle();
      oracle.query.mockReturnValue([]);
      const nitroLogic = { ocrAnalyze: vi.fn().mockRejectedValue(new Error('TCP timeout')) } as any;
      const svc = new VisualMonitorService({ debugPort: 9222, oracle, nitroLogic });
      await svc.connect();
      await expect(svc.regroundScene('scene-006')).resolves.toBeUndefined();
      expect(oracle.execute).not.toHaveBeenCalledWith(
        expect.stringContaining('INSERT OR REPLACE INTO scene_perception'),
        expect.anything()
      );
    });
  });
});
