/**
 * tests/core/asset-index-service.test.ts
 *
 * Vitest unit tests for AssetIndexService (Phase 13 — Custom Map Ingestion Engine).
 * Phase 19 additions: ST3GG embed-on-scan and recoverWalls tests.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AssetIndexService } from '../../src/core/asset-index-service.js';

// ── Chokidar mock (vi.hoisted so it runs before module evaluation) ────────────

const { mockWatch, mockWatcher, mockFsReadFileSync, mockFsWriteFileSync } = vi.hoisted(() => {
  const watcher = {
    on: vi.fn().mockReturnThis(),
    close: vi.fn().mockResolvedValue(undefined),
  };
  const watch = vi.fn().mockReturnValue(watcher);
  const readFileSync = vi.fn().mockReturnValue(Buffer.from('FAKEPNG'));
  const writeFileSync = vi.fn();
  return {
    mockWatch: watch,
    mockWatcher: watcher,
    mockFsReadFileSync: readFileSync,
    mockFsWriteFileSync: writeFileSync,
  };
});

vi.mock('chokidar', () => ({ default: { watch: mockWatch } }));
vi.mock('node:fs', () => ({
  default: { readFileSync: mockFsReadFileSync, writeFileSync: mockFsWriteFileSync },
  readFileSync: mockFsReadFileSync,
  writeFileSync: mockFsWriteFileSync,
}));

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
    st3ggEncode: vi.fn().mockResolvedValue('ENCODEDB64=='),
    st3ggDecode: vi.fn().mockResolvedValue(JSON.stringify([{ x1: 0, y1: 0, x2: 100, y2: 0 }])),
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

  // ── Phase 19: ST3GG Physical Grounding tests ─────────────────────────────

  // 9. handleNewFile() calls st3ggEncode after successful detect_walls
  it('handleNewFile() calls st3ggEncode to embed walls in asset after detect_walls succeeds', async () => {
    const oracle = makeMockOracle();
    const clawlink = makeMockClawlink(true);
    mockFsReadFileSync.mockReturnValue(Buffer.from('FAKEPNG'));

    const service = new AssetIndexService({ watchPath: '/maps', oracle, clawlink });
    await service.handleNewFile('/maps/sector7.png');

    expect(clawlink.st3ggEncode).toHaveBeenCalledOnce();
    const [imageB64Arg, payloadArg] = clawlink.st3ggEncode.mock.calls[0];
    expect(typeof imageB64Arg).toBe('string');
    // payload should be the stringified wall array
    const parsedPayload = JSON.parse(payloadArg as string);
    expect(parsedPayload).toEqual([{ x1: 0, y1: 0, x2: 100, y2: 0 }]);
  });

  // 10. handleNewFile() writes the encoded image back to disk
  it('handleNewFile() writes the ST3GG-encoded image back to the asset file', async () => {
    const oracle = makeMockOracle();
    const clawlink = makeMockClawlink(true);
    mockFsReadFileSync.mockReturnValue(Buffer.from('FAKEPNG'));

    const service = new AssetIndexService({ watchPath: '/maps', oracle, clawlink });
    await service.handleNewFile('/maps/sector7.png');

    expect(mockFsWriteFileSync).toHaveBeenCalledOnce();
    const [writePath, writeData] = mockFsWriteFileSync.mock.calls[0];
    expect(writePath).toBe('/maps/sector7.png');
    // Data should be the base64-decoded version of the mock encode return value
    expect(Buffer.isBuffer(writeData)).toBe(true);
  });

  // 11. handleNewFile() is non-fatal when st3ggEncode fails
  it('handleNewFile() continues to indexed status even when st3ggEncode fails', async () => {
    const oracle = makeMockOracle();
    const clawlink = makeMockClawlink(true);
    clawlink.st3ggEncode.mockRejectedValue(new Error('Pixel buffer overflow'));
    mockFsReadFileSync.mockReturnValue(Buffer.from('FAKEPNG'));

    const service = new AssetIndexService({ watchPath: '/maps', oracle, clawlink });
    await service.handleNewFile('/maps/sector7.png');

    // Despite the ST3GG failure, the asset should still be indexed
    const updateCall = oracle.execute.mock.calls.find(
      (call: unknown[]) => typeof call[0] === 'string' && (call[0] as string).includes('UPDATE') && (call[1] as string[])[0] === 'indexed',
    );
    expect(updateCall).toBeDefined();
  });

  // 12. recoverWalls() calls st3ggDecode and returns parsed wall array
  it('recoverWalls() decodes walls from image LSBs via Node A', async () => {
    const oracle = makeMockOracle();
    const clawlink = makeMockClawlink(true);
    mockFsReadFileSync.mockReturnValue(Buffer.from('SOMEPNG'));

    const service = new AssetIndexService({ watchPath: '/maps', oracle, clawlink });
    const walls = await service.recoverWalls('/maps/sector7.png');

    expect(clawlink.st3ggDecode).toHaveBeenCalledOnce();
    expect(walls).toEqual([{ x1: 0, y1: 0, x2: 100, y2: 0 }]);
  });

  // 13. recoverWalls() throws when no clawlink configured
  it('recoverWalls() throws when no ClawLink client is configured', async () => {
    const oracle = makeMockOracle();
    const service = new AssetIndexService({ watchPath: '/maps', oracle });

    await expect(service.recoverWalls('/maps/sector7.png')).rejects.toThrow(
      'no ClawLink client configured',
    );
  });
});
