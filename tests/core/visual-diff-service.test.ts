/**
 * tests/core/visual-diff-service.test.ts
 *
 * Unit tests for VisualDiffService (Phase 14 Neural World Engine).
 * UnifiedOracleClient and CDP are mocked — no live DB or Foundry required.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { VisualDiffService } from '../../src/core/visual-diff-service.js';

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeMockOracle(rows: unknown[] = []) {
  return {
    query: vi.fn().mockReturnValue(rows),
    execute: vi.fn().mockReturnValue({ changes: 1 }),
  } as any;
}

/** Generate a simple RGBA buffer encoded as base64 */
function makeRgbaBase64(pixelCount: number, r: number, g: number, b: number, a = 255): string {
  const buf = Buffer.alloc(pixelCount * 4);
  for (let i = 0; i < pixelCount; i++) {
    buf[i * 4] = r;
    buf[i * 4 + 1] = g;
    buf[i * 4 + 2] = b;
    buf[i * 4 + 3] = a;
  }
  return buf.toString('base64');
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('VisualDiffService', () => {
  let service: VisualDiffService;

  beforeEach(() => {
    service = new VisualDiffService({ oracle: makeMockOracle() });
  });

  // ── diffImages() ─────────────────────────────────────────────────────────

  it('diffImages() returns pixelDelta: 0 when both images are identical', () => {
    const pixelCount = 10; // 10 pixels, 2x5 logical
    const img = makeRgbaBase64(pixelCount, 100, 150, 200);

    const result = service.diffImages(img, img, 5, 2);

    expect(result.pixelDelta).toBe(0);
    expect(result.transientRegions).toHaveLength(0);
  });

  it('diffImages() detects differences when pixels change beyond threshold', () => {
    const pixelCount = 10;
    const base = makeRgbaBase64(pixelCount, 0, 0, 0);
    // Change red channel to 200 — well above default threshold of 0.1 * 255 ≈ 25
    const live = makeRgbaBase64(pixelCount, 200, 0, 0);

    const result = service.diffImages(base, live, 5, 2);

    expect(result.pixelDelta).toBe(pixelCount);
  });

  it('diffImages() returns diffPercent as a percentage of total pixels', () => {
    const width = 10;
    const height = 10;
    const totalPixels = width * height; // 100

    // Half the pixels differ: first 50 are red in live, second 50 are same
    const baseBuf = Buffer.alloc(totalPixels * 4, 0);
    const liveBuf = Buffer.alloc(totalPixels * 4, 0);
    for (let i = 0; i < 50; i++) {
      liveBuf[i * 4] = 200; // red channel way above threshold
    }

    const result = service.diffImages(
      baseBuf.toString('base64'),
      liveBuf.toString('base64'),
      width,
      height
    );

    // 50 out of 100 total pixels = 50%
    expect(result.diffPercent).toBeCloseTo(50, 1);
    expect(result.totalPixels).toBe(totalPixels);
  });

  // ── extractBoundingBoxes() ────────────────────────────────────────────────

  it('extractBoundingBoxes() returns empty array for empty pixel list', () => {
    const regions = service.extractBoundingBoxes([], 1920, 1080);
    expect(regions).toHaveLength(0);
  });

  it("extractBoundingBoxes() classifies small regions (≤50x50) as 'token'", () => {
    // All pixels in a tight 5x5 cluster => bounding box well within 50x50
    const pixels: { x: number; y: number }[] = [];
    for (let x = 10; x <= 14; x++) {
      for (let y = 20; y <= 24; y++) {
        pixels.push({ x, y });
      }
    }
    // 25 pixels — one chunk (< 100 threshold), bbox is 5x5
    const regions = service.extractBoundingBoxes(pixels, 1920, 1080);

    expect(regions).toHaveLength(1);
    expect(regions[0].entityType).toBe('token');
    expect(regions[0].width).toBeLessThanOrEqual(50);
    expect(regions[0].height).toBeLessThanOrEqual(50);
  });

  // ── getBaseScreenshot() ───────────────────────────────────────────────────

  it('getBaseScreenshot() returns null when no rows in oracle', () => {
    const oracle = makeMockOracle([]); // empty result set
    const svc = new VisualDiffService({ oracle });

    const result = svc.getBaseScreenshot('scene-001');

    expect(result).toBeNull();
    expect(oracle.query).toHaveBeenCalledWith(
      expect.stringContaining('vision_history'),
      ['scene-001']
    );
  });

  it('getBaseScreenshot() returns data from oracle rows', () => {
    const row = { data: 'abc123=', width: 1280, height: 720 };
    const oracle = makeMockOracle([row]);
    const svc = new VisualDiffService({ oracle });

    const result = svc.getBaseScreenshot('scene-abc');

    expect(result).not.toBeNull();
    expect(result!.data).toBe('abc123=');
    expect(result!.width).toBe(1280);
    expect(result!.height).toBe(720);
  });

  // ── storeBaseScreenshot() ─────────────────────────────────────────────────

  it('storeBaseScreenshot() calls oracle.execute with INSERT OR REPLACE', () => {
    const oracle = makeMockOracle();
    const svc = new VisualDiffService({ oracle });

    svc.storeBaseScreenshot('scene-xyz', 'base64data==', 1920, 1080);

    expect(oracle.execute).toHaveBeenCalledOnce();
    const [sql, params] = oracle.execute.mock.calls[0] as [string, unknown[]];
    expect(sql).toMatch(/INSERT OR REPLACE/i);
    expect(sql).toMatch(/vision_history/);
    expect(params).toContain('scene-xyz');
    expect(params).toContain('base64data==');
    expect(params).toContain(1920);
    expect(params).toContain(1080);
  });
});

// ── VisualMonitorService.diffScene() ─────────────────────────────────────────

describe('VisualMonitorService.diffScene()', () => {
  it('throws when no base screenshot is stored for the given sceneId', async () => {
    // Mock chrome-remote-interface to allow VisualMonitorService to construct
    // and have captureScreenshot spied on without a real CDP connection.
    const { VisualMonitorService } = await import('../../src/core/visual-monitor-service.js');

    const monitor = new VisualMonitorService({});

    // Spy on captureScreenshot to avoid needing a real CDP client
    const fakeRecord = {
      hash: 'deadbeef',
      timestamp: new Date().toISOString(),
      sceneId: 'scene-no-base',
      data: makeRgbaBase64(4, 0, 0, 0),
    };
    vi.spyOn(monitor, 'captureScreenshot').mockResolvedValue(fakeRecord);

    // VisualDiffService backed by oracle that returns no rows
    const oracle = makeMockOracle([]);
    const diffService = new VisualDiffService({ oracle });

    await expect(monitor.diffScene('scene-no-base', diffService)).rejects.toThrow(
      'No base screenshot stored for scene: scene-no-base'
    );
  });
});
