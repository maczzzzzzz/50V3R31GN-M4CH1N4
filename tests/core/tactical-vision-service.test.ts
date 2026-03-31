/**
 * tests/core/tactical-vision-service.test.ts
 *
 * Vitest unit tests for TacticalVisionService (Phase 6: Project Eyes-On).
 *
 * Covers:
 *   - Structured LLava output parsing → TacticalRegion[]
 *   - Coordinate conversion: normalized 0-1000 → pixel space
 *   - Foundry RegionDocument shape data (name, color, rectangle)
 *   - Category-to-color mapping for all 4 categories
 *   - Ollama HTTP error → returns empty array (graceful)
 *   - Invalid JSON from Ollama → returns empty array
 *   - Missing / malformed region entries are filtered out
 *   - persistRegions() writes to world.db scene_regions table
 *   - persistRegions() no-ops when oracle is disconnected
 *   - getRegionsForScene() round-trips through SQLite
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TacticalVisionService } from '../../src/core/tactical-vision-service.js';
import type { TacticalRegion } from '../../src/core/tactical-vision-service.js';

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeOllamaResponse(regions: unknown[]) {
  return {
    ok: true,
    json: async () => ({
      message: { role: 'assistant', content: JSON.stringify({ regions }) },
    }),
  };
}

const VALID_REGION = {
  category: 'cover_high',
  label:    'concrete barrier',
  bounds:   [200, 150, 350, 400],
};

// ── identifyRegions ───────────────────────────────────────────────────────────

describe('TacticalVisionService.identifyRegions', () => {
  let fetchMock: ReturnType<typeof vi.fn>;
  let service: TacticalVisionService;

  beforeEach(() => {
    fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    service = new TacticalVisionService({ sceneWidth: 1000, sceneHeight: 1000 });
  });

  it('parses a valid structured response into TacticalRegion[]', async () => {
    fetchMock.mockResolvedValueOnce(makeOllamaResponse([VALID_REGION]));

    const regions = await service.identifyRegions('base64data', 'scene-abc');

    expect(regions).toHaveLength(1);
    const r = regions[0]!;
    expect(r.category).toBe('cover_high');
    expect(r.label).toBe('concrete barrier');
    expect(r.sceneId).toBe('scene-abc');
    expect(r.id).toMatch(/^[0-9a-f-]{36}$/); // UUID
  });

  it('returns multiple regions when LLava provides them', async () => {
    fetchMock.mockResolvedValueOnce(makeOllamaResponse([
      VALID_REGION,
      { category: 'hazard',   label: 'exposed wiring', bounds: [500, 500, 600, 700] },
      { category: 'security', label: 'camera arc',     bounds: [10,  10,  100, 200] },
    ]));

    const regions = await service.identifyRegions('base64data', 'scene-xyz');
    expect(regions).toHaveLength(3);
  });

  it('filters out regions with unknown category', async () => {
    fetchMock.mockResolvedValueOnce(makeOllamaResponse([
      VALID_REGION,
      { category: 'unknown_type', label: 'weird thing', bounds: [0, 0, 100, 100] },
    ]));

    const regions = await service.identifyRegions('base64data', 'scene-1');
    expect(regions).toHaveLength(1);
  });

  it('filters out regions with missing bounds', async () => {
    fetchMock.mockResolvedValueOnce(makeOllamaResponse([
      { category: 'hazard', label: 'fire pit', bounds: [100, 200] }, // only 2 values
      VALID_REGION,
    ]));

    const regions = await service.identifyRegions('base64data', 'scene-1');
    expect(regions).toHaveLength(1);
    expect(regions[0]!.category).toBe('cover_high');
  });

  it('filters out regions with empty label', async () => {
    fetchMock.mockResolvedValueOnce(makeOllamaResponse([
      { category: 'hazard', label: '', bounds: [0, 0, 100, 100] },
      VALID_REGION,
    ]));

    const regions = await service.identifyRegions('base64data', 'scene-1');
    expect(regions).toHaveLength(1);
  });

  it('returns empty array when Ollama responds with HTTP 503', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: false,
      status: 503,
      statusText: 'Service Unavailable',
    });

    const regions = await service.identifyRegions('base64data', 'scene-1');
    expect(regions).toEqual([]);
  });

  it('returns empty array when Ollama returns invalid JSON', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        message: { role: 'assistant', content: 'not valid json at all {{' },
      }),
    });

    const regions = await service.identifyRegions('base64data', 'scene-1');
    expect(regions).toEqual([]);
  });

  it('returns empty array when Ollama returns missing regions key', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        message: { role: 'assistant', content: JSON.stringify({ something: 'else' }) },
      }),
    });

    const regions = await service.identifyRegions('base64data', 'scene-1');
    expect(regions).toEqual([]);
  });

  it('calls /api/chat endpoint (not /api/generate)', async () => {
    fetchMock.mockResolvedValueOnce(makeOllamaResponse([]));
    await service.identifyRegions('base64data', 'scene-1');

    const url = fetchMock.mock.calls[0]?.[0] as string;
    expect(url).toContain('/api/chat');
    expect(url).not.toContain('/api/generate');
  });
});

// ── Coordinate conversion ─────────────────────────────────────────────────────

describe('TacticalVisionService coordinate conversion', () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
  });

  it('converts normalized bounds to pixel space on 1000×1000 scene (identity)', async () => {
    const service = new TacticalVisionService({ sceneWidth: 1000, sceneHeight: 1000 });
    fetchMock.mockResolvedValueOnce(makeOllamaResponse([
      { category: 'cover_high', label: 'barrier', bounds: [200, 150, 350, 400] },
    ]));

    const [r] = await service.identifyRegions('img', 'scene-1') as [TacticalRegion];
    const shape = r.foundryRegion.shapes[0]!;

    // x = 150/1000 * 1000 = 150
    expect(shape.x).toBeCloseTo(150);
    // y = 200/1000 * 1000 = 200
    expect(shape.y).toBeCloseTo(200);
    // width = (400-150)/1000 * 1000 = 250
    expect(shape.width).toBeCloseTo(250);
    // height = (350-200)/1000 * 1000 = 150
    expect(shape.height).toBeCloseTo(150);
  });

  it('converts normalized bounds with a 2000×1500 scene', async () => {
    const service = new TacticalVisionService({ sceneWidth: 2000, sceneHeight: 1500 });
    fetchMock.mockResolvedValueOnce(makeOllamaResponse([
      { category: 'hazard', label: 'fire', bounds: [100, 200, 300, 500] },
    ]));

    const [r] = await service.identifyRegions('img', 'scene-2') as [TacticalRegion];
    const shape = r.foundryRegion.shapes[0]!;

    // x = 200/1000 * 2000 = 400
    expect(shape.x).toBeCloseTo(400);
    // y = 100/1000 * 1500 = 150
    expect(shape.y).toBeCloseTo(150);
    // width = (500-200)/1000 * 2000 = 600
    expect(shape.width).toBeCloseTo(600);
    // height = (300-100)/1000 * 1500 = 300
    expect(shape.height).toBeCloseTo(300);
  });

  it('defaults to 1000×1000 scene when no dimensions provided', async () => {
    const service = new TacticalVisionService(); // no sceneWidth/sceneHeight
    fetchMock.mockResolvedValueOnce(makeOllamaResponse([
      { category: 'security', label: 'camera', bounds: [0, 0, 500, 500] },
    ]));

    const [r] = await service.identifyRegions('img', 'scene-3') as [TacticalRegion];
    const shape = r.foundryRegion.shapes[0]!;
    expect(shape.width).toBeCloseTo(500);
    expect(shape.height).toBeCloseTo(500);
  });
});

// ── Foundry RegionDocument schema ─────────────────────────────────────────────

describe('TacticalVisionService Foundry region data', () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
  });

  it('assigns correct color for cover_high', async () => {
    const service = new TacticalVisionService();
    fetchMock.mockResolvedValueOnce(makeOllamaResponse([
      { category: 'cover_high', label: 'wall', bounds: [0, 0, 100, 100] },
    ]));
    const [r] = await service.identifyRegions('img', 'scene-1') as [TacticalRegion];
    expect(r.foundryRegion.color).toBe('#1a6b1a');
  });

  it('assigns correct color for cover_partial', async () => {
    const service = new TacticalVisionService();
    fetchMock.mockResolvedValueOnce(makeOllamaResponse([
      { category: 'cover_partial', label: 'crate', bounds: [0, 0, 100, 100] },
    ]));
    const [r] = await service.identifyRegions('img', 'scene-1') as [TacticalRegion];
    expect(r.foundryRegion.color).toBe('#5a9e5a');
  });

  it('assigns correct color for hazard', async () => {
    const service = new TacticalVisionService();
    fetchMock.mockResolvedValueOnce(makeOllamaResponse([
      { category: 'hazard', label: 'fire', bounds: [0, 0, 100, 100] },
    ]));
    const [r] = await service.identifyRegions('img', 'scene-1') as [TacticalRegion];
    expect(r.foundryRegion.color).toBe('#c43030');
  });

  it('assigns correct color for security', async () => {
    const service = new TacticalVisionService();
    fetchMock.mockResolvedValueOnce(makeOllamaResponse([
      { category: 'security', label: 'camera', bounds: [0, 0, 100, 100] },
    ]));
    const [r] = await service.identifyRegions('img', 'scene-1') as [TacticalRegion];
    expect(r.foundryRegion.color).toBe('#c49430');
  });

  it('produces a single rectangle shape with rotation=0', async () => {
    const service = new TacticalVisionService();
    fetchMock.mockResolvedValueOnce(makeOllamaResponse([VALID_REGION]));
    const [r] = await service.identifyRegions('img', 'scene-1') as [TacticalRegion];
    expect(r.foundryRegion.shapes).toHaveLength(1);
    expect(r.foundryRegion.shapes[0]!.type).toBe('rectangle');
    expect(r.foundryRegion.shapes[0]!.rotation).toBe(0);
  });

  it('includes category and label in region name', async () => {
    const service = new TacticalVisionService();
    fetchMock.mockResolvedValueOnce(makeOllamaResponse([
      { category: 'hazard', label: 'broken pipe', bounds: [0, 0, 100, 100] },
    ]));
    const [r] = await service.identifyRegions('img', 'scene-1') as [TacticalRegion];
    expect(r.foundryRegion.name).toContain('hazard');
    expect(r.foundryRegion.name).toContain('broken pipe');
  });
});

// ── persistRegions + getRegionsForScene ───────────────────────────────────────

describe('TacticalVisionService persistence', () => {
  it('persists regions to scene_regions table', () => {
    const executeCalls: Array<{ sql: string; params: unknown[] }> = [];
    const mockOracle = {
      isConnected: () => true,
      execute: (sql: string, params: unknown[]) => {
        executeCalls.push({ sql, params });
        return { changes: 1, lastInsertRowid: 1 };
      },
    };

    const service = new TacticalVisionService();
    const regions: TacticalRegion[] = [
      {
        id:       'test-uuid-1',
        sceneId:  'scene-001',
        category: 'cover_high',
        label:    'barrier',
        bounds:   [100, 100, 200, 300],
        foundryRegion: {
          name:   '[cover high] barrier',
          color:  '#1a6b1a',
          shapes: [{ type: 'rectangle', x: 100, y: 100, width: 200, height: 100, rotation: 0 }],
        },
      },
    ];

    service.persistRegions(regions, mockOracle as any);

    expect(executeCalls).toHaveLength(1);
    expect(executeCalls[0]!.sql).toContain('INSERT OR REPLACE INTO scene_regions');
    expect(executeCalls[0]!.params[0]).toBe('test-uuid-1');
    expect(executeCalls[0]!.params[1]).toBe('scene-001');
    expect(executeCalls[0]!.params[2]).toBe('cover_high');
    expect(executeCalls[0]!.params[3]).toBe('barrier');
    // bounds_json
    expect(JSON.parse(executeCalls[0]!.params[4] as string)).toEqual([100, 100, 200, 300]);
    // foundry_region_json
    const frd = JSON.parse(executeCalls[0]!.params[5] as string);
    expect(frd.color).toBe('#1a6b1a');
  });

  it('no-ops when oracle is disconnected', () => {
    const mockOracle = { isConnected: () => false, execute: vi.fn() };
    const service    = new TacticalVisionService();

    service.persistRegions([], mockOracle as any);
    expect(mockOracle.execute).not.toHaveBeenCalled();
  });

  it('returns empty array from getRegionsForScene when disconnected', () => {
    const mockOracle = { isConnected: () => false };
    const service    = new TacticalVisionService();

    const result = service.getRegionsForScene('scene-1', mockOracle as any);
    expect(result).toEqual([]);
  });

  it('deserialises regions correctly from getRegionsForScene', () => {
    const mockOracle = {
      isConnected: () => true,
      query: () => [
        {
          id:                  'uuid-1',
          scene_id:            'scene-A',
          category:            'hazard',
          label:               'fire pit',
          bounds_json:         '[100,200,300,400]',
          foundry_region_json: '{"name":"[hazard] fire pit","color":"#c43030","shapes":[]}',
        },
      ],
    };

    const service = new TacticalVisionService();
    const regions = service.getRegionsForScene('scene-A', mockOracle as any);

    expect(regions).toHaveLength(1);
    expect(regions[0]!.category).toBe('hazard');
    expect(regions[0]!.bounds).toEqual([100, 200, 300, 400]);
    expect(regions[0]!.foundryRegion.color).toBe('#c43030');
  });
});
