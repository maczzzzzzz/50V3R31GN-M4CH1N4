/**
 * tests/core/tactical-vision-service.test.ts
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TacticalVisionService } from '../../src/core/tactical-vision-service.js';
import fs from 'node:fs/promises';

// Mock the file system
vi.mock('node:fs/promises');

describe('TacticalVisionService', () => {
  const mockConfig = {
    baseUrl: 'http://localhost:11434',
    model: 'mistral-nemo', // Note: service uses 'llava:7b' internally
    timeoutMs: 5000,
  };

  let service: TacticalVisionService;

  beforeEach(() => {
    service = new TacticalVisionService(mockConfig);
    vi.clearAllMocks();
  });

  it('should successfully scan a map and return validated tactical regions', async () => {
    // Mock image reading
    vi.mocked(fs.readFile).mockResolvedValue(Buffer.from('mock-binary-data'));

    // Mock global fetch for Ollama /api/generate
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        model: 'llava:7b',
        response: JSON.stringify({
          regions: [
            {
              category: 'cover_high',
              box2d: [100, 200, 300, 400],
              label: 'Reinforced Concrete Pillar'
            },
            {
              category: 'hazard',
              box2d: [500, 600, 550, 650],
              label: 'Exposed Electrical Main'
            }
          ]
        })
      })
    });

    const regions = await service.scanMap('test-map.png');

    expect(regions).toHaveLength(2);
    expect(regions[0].category).toBe('cover_high');
    expect(regions[0].label).toBe('Reinforced Concrete Pillar');
    expect(regions[0].box2d).toEqual([100, 200, 300, 400]);
    
    expect(regions[1].category).toBe('hazard');
    expect(regions[1].label).toBe('Exposed Electrical Main');

    expect(fs.readFile).toHaveBeenCalledWith('test-map.png');
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/generate'),
      expect.objectContaining({
        method: 'POST',
        body: expect.stringContaining('"model":"llava:7b"')
      })
    );
  });

  it('should throw error on invalid model response JSON', async () => {
    vi.mocked(fs.readFile).mockResolvedValue(Buffer.from('data'));
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ response: 'Garbage Text' })
    });

    await expect(service.scanMap('map.png')).rejects.toThrow('model response is not valid JSON');
  });

  it('should throw error on schema validation failure', async () => {
    vi.mocked(fs.readFile).mockResolvedValue(Buffer.from('data'));
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        response: JSON.stringify({
          regions: [
            {
              category: 'invalid_category', // Not in enum
              box2d: [0, 0, 0, 0],
              label: 'Bad'
            }
          ]
        })
      })
    });

    await expect(service.scanMap('map.png')).rejects.toThrow('schema validation failed');
  });

  it('should handle file read errors gracefully', async () => {
    vi.mocked(fs.readFile).mockRejectedValue(new Error('File not found'));

    await expect(service.scanMap('missing.png')).rejects.toThrow('failed to read image');
  });
});
