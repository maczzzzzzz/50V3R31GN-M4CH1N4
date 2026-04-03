/**
 * tests/core/asset-index-service.test.ts
 *
 * Vitest unit tests for AssetIndexService (Phase 13 — Custom Map Ingestion Engine).
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AssetIndexService } from '../../src/core/asset-index-service.js';

// ── Chokidar mock (vi.hoisted so it runs before module evaluation) ────────────

const { mockWatch, mockWatcher } = vi.hoisted(() => {
  const watcher = {
    on: vi.fn().mockReturnThis(),
    close: vi.fn().mockResolvedValue(undefined),
  };
  const watch = vi.fn().mockReturnValue(watcher);
  return { mockWatch: watch, mockWatcher: watcher };
});

vi.mock('chokidar', () => ({ default: { watch: mockWatch } }));

// ── Helper factories ──────────────────────────────────────────────────────────

function makeMockOracle() {
  return {
    isConnected: vi.fn().mockReturnValue(true),
    execute: vi.fn().mockReturnValue({ changes: 1 }),
  } as any;
}

function makeMockClawlink(healthy = true) {
  return {
    isHealthy: vi.fn().mockResolvedValue(healthy),
    executeRpc: vi.fn().mockResolvedValue({ walls: [{ x1: 0, y1: 0, x2: 100, y2: 0 }] }),
  } as any;
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('AssetIndexService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Restore default chained return so .on().on() works in most tests
    mockWatcher.on.mockReturnThis();
  });

  // 1. start() calls chokidar.watch with the correct path and options
  it('start() calls chokidar.watch with the correct path and options', async () => {
    const oracle = makeMockOracle();
    const service = new AssetIndexService({ watchPath: '/maps/unprocessed', oracle });

    mockWatcher.on.mockImplementation((event: string, cb: Function) => {
      if (event === 'ready') cb();
      return mockWatcher;
    });

    await service.start();

    expect(mockWatch).toHaveBeenCalledOnce();
    expect(mockWatch).toHaveBeenCalledWith('/maps/unprocessed', {
      ignoreInitial: true,
      persistent: true,
    });
  });

  // 2. stop() closes the watcher
  it('stop() closes the watcher', async () => {
    const oracle = makeMockOracle();
    const service = new AssetIndexService({ watchPath: '/maps/unprocessed', oracle });

    // Start so watcher is set
    mockWatcher.on.mockImplementation((event: string, cb: Function) => {
      if (event === 'ready') cb();
      return mockWatcher;
    });
    await service.start();

    await service.stop();

    expect(mockWatcher.close).toHaveBeenCalledOnce();
  });

  // 3. handleNewFile() inserts a 'processing' row into map_assets
  it('handleNewFile() inserts a processing row into map_assets', async () => {
    const oracle = makeMockOracle();
    const service = new AssetIndexService({ watchPath: '/maps/unprocessed', oracle });

    await service.handleNewFile('/maps/unprocessed/nightcity.png');

    expect(oracle.execute).toHaveBeenCalledWith(
      expect.stringContaining('INSERT OR REPLACE INTO map_assets'),
      [
        expect.stringMatching(/^[a-f0-9]{16}$/),
        'nightcity.png',
        '/maps/unprocessed/nightcity.png',
        null,
        'processing',
      ],
    );
  });

  // 4. handleNewFile() calls detect_walls RPC when clawlink is healthy
  it('handleNewFile() calls detect_walls RPC when clawlink is healthy', async () => {
    const oracle = makeMockOracle();
    const clawlink = makeMockClawlink(true);
    const service = new AssetIndexService({ watchPath: '/maps', oracle, clawlink });

    await service.handleNewFile('/maps/sector7.png');

    expect(clawlink.isHealthy).toHaveBeenCalledOnce();
    expect(clawlink.executeRpc).toHaveBeenCalledWith('detect_walls', {
      file_path: '/maps/sector7.png',
    });
  });

  // 5. handleNewFile() updates status to 'indexed' on RPC success
  it('handleNewFile() updates status to indexed on RPC success', async () => {
    const oracle = makeMockOracle();
    const clawlink = makeMockClawlink(true);
    const service = new AssetIndexService({ watchPath: '/maps', oracle, clawlink });

    await service.handleNewFile('/maps/sector7.png');

    const updateCall = oracle.execute.mock.calls.find(
      (call: unknown[]) => typeof call[0] === 'string' && (call[0] as string).includes('UPDATE') && (call[1] as string[])[0] === 'indexed',
    );
    expect(updateCall).toBeDefined();
    expect(updateCall![1]).toEqual([
      'indexed',
      JSON.stringify([{ x1: 0, y1: 0, x2: 100, y2: 0 }]),
      expect.any(String), // id
    ]);
  });

  // 6. handleNewFile() updates status to 'failed' on RPC failure
  it('handleNewFile() updates status to failed on RPC failure', async () => {
    const oracle = makeMockOracle();
    const clawlink = makeMockClawlink(true);
    clawlink.executeRpc.mockRejectedValue(new Error('ZeroClaw unavailable'));
    const service = new AssetIndexService({ watchPath: '/maps', oracle, clawlink });

    await service.handleNewFile('/maps/sector7.png');

    const failCall = oracle.execute.mock.calls.find(
      (call: unknown[]) => typeof call[0] === 'string' && (call[0] as string).includes('UPDATE') && (call[1] as string[])[0] === 'failed',
    );
    expect(failCall).toBeDefined();
    expect(failCall![1]).toEqual(['failed', expect.any(String)]);
  });

  // 7. handleNewFile() sets status to 'indexed' without wall_data when no clawlink provided
  it('handleNewFile() sets status to indexed with no wall_data when no clawlink provided', async () => {
    const oracle = makeMockOracle();
    const service = new AssetIndexService({ watchPath: '/maps', oracle });

    await service.handleNewFile('/maps/barrens.png');

    const updateCall = oracle.execute.mock.calls.find(
      (call: unknown[]) => typeof call[0] === 'string' && (call[0] as string).includes('UPDATE'),
    );
    expect(updateCall).toBeDefined();
    expect(updateCall![0]).toContain('UPDATE map_assets SET status=?');
    expect(updateCall![1]).toEqual(['indexed', expect.any(String)]);
    // Confirm wall_data is NOT part of this update (only 2 params: status + id)
    expect((updateCall![1] as unknown[]).length).toBe(2);
  });

  // 8. handleNewFile() is wired to chokidar 'add' event
  // Note: this test invokes the chokidar wrapper which calls handleNewFile internally
  // via the 'add' event callback set up in start(). For clawlink-specific paths,
  // call handleNewFile() directly as tests 3–7 do.
  it('handleNewFile() is wired to chokidar add event', async () => {
    const oracle = makeMockOracle();
    const service = new AssetIndexService({ watchPath: '/maps/unprocessed', oracle });

    let addCallback: ((filePath: string) => void) | undefined;

    mockWatcher.on.mockImplementation((event: string, cb: Function) => {
      if (event === 'add') addCallback = cb as (filePath: string) => void;
      if (event === 'ready') cb();
      return mockWatcher;
    });

    await service.start();

    expect(addCallback).toBeDefined();

    // Invoke the captured 'add' callback and verify handleNewFile logic runs
    await addCallback!('/maps/unprocessed/test-map.png');

    expect(oracle.execute).toHaveBeenCalledWith(
      expect.stringContaining('INSERT OR REPLACE INTO map_assets'),
      expect.arrayContaining(['test-map.png', '/maps/unprocessed/test-map.png', 'processing']),
    );
  });
});
